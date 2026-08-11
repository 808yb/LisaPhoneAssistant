import { GoogleGenAI } from "@google/genai";
import { saveLeadFunctionDeclaration, updateLeadFunctionDeclaration } from "./Tools";
import { PromptBuilder } from "./PromptBuilder";
import { createClient } from "@supabase/supabase-js";
import { metrics } from "../metrics";

export const scriptedResponses: Record<string, string> = {
  '[SCRIPT_GREETING]': 'Autohaus Kaiserslautern, Guten Tag. Hier ist Lisa, Ihre KI-Assistentin. Dieses Gespräch wird nicht aufgezeichnet. Wie kann ich Ihnen helfen?',
  '[SCRIPT_ASK_CUSTOMER]': 'Sind Sie ein Kunde bei uns?',
  '[SCRIPT_ASK_PLATE]': 'Wie lautet Ihr Kennzeichen?',
  '[SCRIPT_OPENING_HOURS]': 'Unsere Öffnungszeiten sind von Montag bis Freitag von 08:00 bis 18:00 Uhr und Samstag von 09:00 bis 14:00 Uhr. Am Sonntag haben wir geschlossen.',
  '[SCRIPT_ANYTHING_ELSE]': 'Ich habe Ihr Anliegen gespeichert. Gibt es noch etwas, was ich heute für Sie tun kann?',
  '[SCRIPT_FILLER_APPOINTMENT]': 'Ich schaue kurz nach freien Terminen um.',
  '[SCRIPT_FILLER_WAIT]': 'Einen kleinen Moment bitte.',
  '[SCRIPT_FAREWELL]': 'Vielen Dank! Ich habe Ihr Anliegen an unser Team weitergeleitet. Auf Wiederhören.'
};

export class GeminiService {
  private ai: GoogleGenAI;
  private supabase: any;

  constructor(apiKey: string, supabaseClient: any) {
    this.ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
    this.supabase = supabaseClient;
  }

  async processInteraction(
    phoneNumber: string,
    userMessage: string | undefined,
    history: any[],
    isFirstGreeting: boolean,
    hasSavedLead: boolean,
    businessFacts: any,
    matchedCustomer: any,
    business_id: string
  ) {
    const injectedContext = PromptBuilder.buildContext(matchedCustomer, phoneNumber, hasSavedLead);

    if (isFirstGreeting) {
      let greetingText = businessFacts.scriptObj?.core_greeting?.[0] || 'Hallo, wie kann ich helfen?';
      if (businessFacts.scriptObj?.core_ai_disclosure?.[0]) {
        greetingText += ' ' + businessFacts.scriptObj.core_ai_disclosure[0];
      }

      return {
        success: true,
        text: greetingText,
        fillers: businessFacts.scriptObj?.fillers || [],
        injectedContext,
        toolCalled: false,
        savedLeadData: null,
        updatedLeadData: null,
        matchedCustomer: matchedCustomer ? { name: matchedCustomer.name, vehicle: matchedCustomer.vehicle } : null
      };
    }

    const systemInstruction = PromptBuilder.buildSystemInstruction(businessFacts, injectedContext);

    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      const prunedHistory = history.slice(-20); // Keep more context
      for (const msg of prunedHistory) {
        if (msg.sender === 'customer') contents.push({ role: 'user', parts: [{ text: msg.text }] });
        else if (msg.sender === 'assistant') contents.push({ role: 'model', parts: [{ text: msg.text }] });
      }
    } else if (userMessage) {
      // Fallback in case history is not provided
      contents.push({ role: 'user', parts: [{ text: userMessage }] });
    }

    const t0 = performance.now();
    const response = await this.ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: [saveLeadFunctionDeclaration, updateLeadFunctionDeclaration] }]
      }
    });
    metrics.record('gemini', performance.now() - t0);

    let assistantText = response.text || '';
    let endCall = false;

    const s = businessFacts.scriptObj;
    if (s) {
      if (s.core_ai_disclosure?.length && assistantText.includes('[CORE_DISCLOSURE]')) {
        assistantText = s.core_ai_disclosure[0];
      }
      if (assistantText.includes('[CORE_FAREWELL]') || /auf wiederhören|schönen tag noch|verabschiede mich/i.test(assistantText)) {
        if (assistantText.includes('[CORE_FAREWELL]')) {
          assistantText = s.core_farewell?.length ? s.core_farewell[0] : 'Vielen Dank. Ich habe Ihr Anliegen gespeichert. Auf Wiederhören.';
        }
        endCall = true;
      } else if (s.custom_nodes) {
        for (const n of s.custom_nodes) {
          if (assistantText.includes(`[${n.tag}]`) && n.texts?.length) {
            assistantText = n.texts[0];
            break;
          }
        }
      }
    }

    let toolCalled = false;
    let savedLeadData: any = null;
    let updatedLeadData: any = null;

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === 'save_lead') {
          toolCalled = true;
          const args: any = call.args;

          savedLeadData = {
            id: 'lead-' + Date.now().toString(36),
            business_id: business_id,
            caller_name: args.callerName || (matchedCustomer?.name || 'Unbekannt'),
            phone_number: args.phoneNumber || phoneNumber,
            category: args.category || 'general',
            concern: args.concern || 'Anfrage',
            urgency: args.urgency || 'normal',
            vehicle_info: args.vehicleInfo || (matchedCustomer?.vehicle || ''),
            preferred_callback_time: args.preferredCallbackTime || 'Heute',
            status: 'new',
            notes: 'Automatisch qualifiziert',
            transcript: history || [],
            assigned_staff: args.category === 'workshop' ? 'Werkstatt' : 'Empfang'
          };

          await this.supabase.from('leads').insert(savedLeadData);

          // Auto-create customer if it's a new caller
          if (!matchedCustomer && args.callerName) {
            try {
              await this.supabase.from('customers').insert({
                business_id: business_id,
                name: args.callerName,
                phone: phoneNumber,
                notes: 'Automatisch durch Lisa nach dem ersten Anruf angelegt.',
                metadata: {
                  vehicle: args.vehicleInfo || null,
                  isKnownCustomer: false
                }
              });
            } catch (err) {
              console.error('Failed to auto-create customer', err);
            }
          }

          try {
            const followUpRes = await this.ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                ...contents,
                response.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'save_lead', response: { success: true } } }] }
              ],
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: [saveLeadFunctionDeclaration, updateLeadFunctionDeclaration] }]
              }
            });
            if (followUpRes.text) {
              assistantText = followUpRes.text;
              if (s && s.core_ai_disclosure?.length && assistantText.includes('[CORE_DISCLOSURE]')) {
                assistantText = s.core_ai_disclosure[0];
              }
              if (assistantText.includes('[CORE_FAREWELL]') || /auf wiederhören|schönen tag|verabschiede|auf wiedersehen/i.test(assistantText)) {
                if (assistantText.includes('[CORE_FAREWELL]')) {
                  assistantText = s?.core_farewell?.length ? s.core_farewell[0] : 'Vielen Dank. Ich habe Ihr Anliegen gespeichert. Auf Wiederhören.';
                }
                endCall = true;
              }
            }
          } catch (e) {
            assistantText = "Danke für Ihren Anruf, wir melden uns!";
            endCall = true;
          }
        } else if (call.name === 'update_lead') {
          toolCalled = true;
          const args = call.args as any;
          const leadId = args.leadId;
          const additionalConcern = args.additionalConcern;

          const { data: latestLeads } = await this.supabase.from('leads')
            .select('*')
            .eq('business_id', business_id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (latestLeads && latestLeads.length > 0) {
            const dbLeadId = latestLeads[0].id;
            const existingConcern = latestLeads[0].concern || '';
            const updatedConcern = existingConcern + '\n\nErgänzung:\n' + additionalConcern;
            await this.supabase.from('leads').update({ concern: updatedConcern, updated_at: new Date().toISOString() }).eq('id', dbLeadId).eq('business_id', business_id);
            updatedLeadData = { id: dbLeadId, concern: updatedConcern };
          } else if (leadId) {
            // fallback
            const { data: leadData } = await this.supabase.from('leads').select('concern').eq('id', leadId).single();
            const existingConcern = leadData?.concern || '';
            const updatedConcern = existingConcern + '\n\nErgänzung:\n' + additionalConcern;
            await this.supabase.from('leads').update({ concern: updatedConcern, updated_at: new Date().toISOString() }).eq('id', leadId).eq('business_id', business_id);
            updatedLeadData = { id: leadId, concern: updatedConcern };
          }

          try {
            const followUpRes = await this.ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                ...contents,
                response.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'update_lead', response: { success: true } } }] }
              ],
              config: {
                systemInstruction,
                tools: [{ functionDeclarations: [saveLeadFunctionDeclaration, updateLeadFunctionDeclaration] }]
              }
            });
            if (followUpRes.text) {
              assistantText = followUpRes.text;
              if (s && s.core_ai_disclosure?.length && assistantText.includes('[CORE_DISCLOSURE]')) {
                assistantText = s.core_ai_disclosure[0];
              }
              if (assistantText.includes('[CORE_FAREWELL]') || /auf wiederhören|schönen tag|verabschiede|auf wiedersehen/i.test(assistantText)) {
                if (assistantText.includes('[CORE_FAREWELL]')) {
                  assistantText = s?.core_farewell?.length ? s.core_farewell[0] : 'Vielen Dank. Ich habe Ihr Anliegen gespeichert. Auf Wiederhören.';
                }
                endCall = true;
              }
            }
          } catch (e) {
            assistantText = "Vielen Dank, wir haben alles notiert!";
            endCall = true;
          }
        }
      }
    }

    return {
      success: true,
      text: assistantText,
      injectedContext,
      toolCalled,
      endCall,
      savedLeadData: savedLeadData ? { callerName: savedLeadData.caller_name, category: savedLeadData.category, concern: savedLeadData.concern } : null,
      updatedLeadData,
      matchedCustomer: matchedCustomer ? { name: matchedCustomer.name, vehicle: matchedCustomer.vehicle } : null
    };
  }
}
