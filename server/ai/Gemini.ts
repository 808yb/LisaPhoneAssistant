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
    matchedCustomer: any
  ) {
    const injectedContext = PromptBuilder.buildContext(matchedCustomer, phoneNumber, hasSavedLead);

    if (isFirstGreeting) {
      return {
        success: true,
        text: scriptedResponses['[SCRIPT_GREETING]'],
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

    for (const [tag, text] of Object.entries(scriptedResponses)) {
      if (assistantText.includes(tag)) {
        assistantText = text;
        break;
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
              for (const [tag, text] of Object.entries(scriptedResponses)) {
                if (assistantText.includes(tag)) {
                  assistantText = text;
                  break;
                }
              }
            }
          } catch (e) {
            assistantText = scriptedResponses['[SCRIPT_ANYTHING_ELSE]'];
          }
        } else if (call.name === 'update_lead') {
          toolCalled = true;
          const args: any = call.args;
          const additionalConcern = args.additionalConcern;

          const { data: latestLeads } = await this.supabase.from('leads')
            .select('id, concern')
            .eq('phone_number', phoneNumber || '')
            .order('created_at', { ascending: false })
            .limit(1);

          if (latestLeads && latestLeads.length > 0) {
            const leadId = latestLeads[0].id;
            const updatedConcern = latestLeads[0].concern + "\n\n[ERGÄNZUNG]: " + additionalConcern;
            await this.supabase.from('leads').update({ concern: updatedConcern, updated_at: new Date().toISOString() }).eq('id', leadId);
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
              for (const [tag, text] of Object.entries(scriptedResponses)) {
                if (assistantText.includes(tag)) {
                  assistantText = text;
                  break;
                }
              }
            }
          } catch (e) {
            assistantText = scriptedResponses['[SCRIPT_ANYTHING_ELSE]'];
          }
        }
      }
    }

    return {
      success: true,
      text: assistantText,
      injectedContext,
      toolCalled,
      savedLeadData: savedLeadData ? { callerName: savedLeadData.caller_name, category: savedLeadData.category, concern: savedLeadData.concern } : null,
      updatedLeadData,
      matchedCustomer: matchedCustomer ? { name: matchedCustomer.name, vehicle: matchedCustomer.vehicle } : null
    };
  }
}
