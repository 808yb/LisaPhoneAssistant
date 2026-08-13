import { GoogleGenAI } from "@google/genai";
import { saveLeadFunctionDeclaration, updateLeadFunctionDeclaration, checkAvailabilityFunctionDeclaration, bookAppointmentFunctionDeclaration, checkAvailableResourcesFunctionDeclaration, checkExternalAvailabilityFunctionDeclaration } from "./Tools";
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
  '[SCRIPT_FILLER_NOTE]': 'Ich notiere mir das kurz.',
  '[SCRIPT_FILLER_SEARCH]': 'Ich gucke mal kurz nach.',
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
        matchedCustomer: matchedCustomer ? { name: matchedCustomer.name, vehicle: matchedCustomer.metadata?.vehicle } : null
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

    const activeTools: any[] = [{ functionDeclarations: [saveLeadFunctionDeclaration, updateLeadFunctionDeclaration, checkAvailabilityFunctionDeclaration, bookAppointmentFunctionDeclaration] }];
    if (businessFacts?.externalApiUrl) {
      activeTools[0].functionDeclarations.push(checkExternalAvailabilityFunctionDeclaration);
    } else {
      activeTools[0].functionDeclarations.push(checkAvailableResourcesFunctionDeclaration);
    }

    const t0 = performance.now();
    const response = await this.ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: activeTools
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
            business_id: business_id,
            name: args.callerName || (matchedCustomer?.name || 'Unbekannt'),
            contact_info: args.phoneNumber || phoneNumber,
            concern: args.concern || 'Anfrage',
            status: 'new',
            metadata: {
              category: args.category || 'general',
              urgency: args.urgency || 'normal',
              vehicleInfo: args.vehicleInfo || (matchedCustomer?.metadata?.vehicle || ''),
              preferredCallbackTime: args.preferredCallbackTime || 'Heute',
              notes: 'Automatisch qualifiziert',
              transcript: history || [],
              assignedStaff: args.category === 'workshop' ? 'Werkstatt' : 'Empfang'
            }
          };

          const { data: insertedLead, error: insertError } = await this.supabase.from('leads').insert(savedLeadData).select().single();
          if (insertError) {
            console.error("Fehler beim Speichern des Leads:", insertError);
          } else if (insertedLead) {
            savedLeadData.id = insertedLead.id; // Get the real UUID back
            
            // Fire Webhook if configured
            const webhookUrl = businessFacts?.metadata?.webhookUrl;
            if (webhookUrl) {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              const secret = businessFacts?.metadata?.webhookSecret;
              if (secret) headers['Authorization'] = `Bearer ${secret}`;
              
              fetch(webhookUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ event: 'lead_created', data: savedLeadData })
              }).catch(err => console.error('Webhook failed for lead_created', err));
            }
          }

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
                systemInstruction
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
                systemInstruction
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
        } else if (call.name === 'check_availability') {
          toolCalled = true;
          const { date } = call.args as any;
          const startOfDay = new Date(date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(date);
          endOfDay.setHours(23, 59, 59, 999);
          
          const { data: appts } = await this.supabase.from('appointments')
            .select('start_time, end_time, title')
            .eq('business_id', business_id)
            .gte('start_time', startOfDay.toISOString())
            .lte('end_time', endOfDay.toISOString());
            
          const dayIndex = startOfDay.getDay();
          const daysMap = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
          const dayName = daysMap[dayIndex];
          
          let isClosed = false;
          let hoursText = "Öffnungszeiten: (Siehe System-Prompt).";
          if (businessFacts?.openingHours && Array.isArray(businessFacts.openingHours)) {
            const dayInfo = businessFacts.openingHours.find((h: any) => h.day === dayName);
            if (dayInfo) {
              if (dayInfo.closed) {
                isClosed = true;
                hoursText = `WICHTIG: Das Geschäft hat an diesem Tag (${dayName}) GESCHLOSSEN! Teile dem Kunden freundlich mit, dass an diesem Tag geschlossen ist und schlage einen anderen Tag vor.`;
              } else {
                hoursText = `Das Geschäft hat am ${dayName} von ${dayInfo.open} bis ${dayInfo.close} Uhr geöffnet. Schlage NUR Termine innerhalb dieser Zeiten vor!`;
              }
            }
          }

          let responseText = isClosed ? hoursText : `${hoursText}\nAn diesem Tag sind bisher keine Termine gebucht.`;
          if (!isClosed && appts && appts.length > 0) {
            responseText = `${hoursText}\nFolgende Termine sind bereits gebucht (diese Zeiten sind BLOCKIERT): ` + appts.map((a: any) => `${new Date(a.start_time).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})} bis ${new Date(a.end_time).toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'})}`).join(", ");
          }

          try {
            const followUpRes = await this.ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                ...contents,
                response.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'check_availability', response: { result: responseText } } }] }
              ],
              config: {
                systemInstruction
              }
            });
            const text = followUpRes.text;
            if (text && text.trim().length > 0) {
              assistantText = text;
            } else {
              // If the model tried to chain tool calls instead of replying, we intercept and ask the user.
              assistantText = "Ich habe gerade im Kalender nachgesehen. Welchen Tag oder welche Uhrzeit soll ich noch einmal genau prüfen?";
            }
          } catch (e) {
            assistantText = "Entschuldigung, ich konnte den Kalender gerade nicht prüfen.";
          }
        } else if (call.name === 'book_appointment') {
          toolCalled = true;
          const args = call.args as any;
          let toolSuccess = true;
          let toolError = '';

          // Check for duplicates to prevent Lisa from double-booking
          const { data: existingAppts } = await this.supabase
            .from('appointments')
            .select('id')
            .eq('business_id', business_id)
            .eq('start_time', args.startTime);

          let customerId = matchedCustomer ? matchedCustomer.id : null;

          // Auto-create customer if it's a new caller
          if (!customerId && args.callerName) {
            try {
              const { data: newCust } = await this.supabase.from('customers').insert({
                business_id: business_id,
                name: args.callerName,
                phone: phoneNumber,
                notes: 'Automatisch durch Lisa bei Terminbuchung angelegt.',
                metadata: {
                  isKnownCustomer: false
                }
              }).select('id').single();
              if (newCust) customerId = newCust.id;
            } catch (err) {
              console.error('Failed to auto-create customer in book_appointment', err);
            }
          }

          if (!existingAppts || existingAppts.length === 0) {
            const { data: insertedAppt, error: insertApptErr } = await this.supabase.from('appointments').insert({
              business_id,
              customer_id: customerId,
              title: args.title,
              start_time: args.startTime,
              end_time: args.endTime,
              notes: args.notes || 'Gebucht durch KI Assistentin Lisa',
              status: 'confirmed'
            }).select().single();

            if (insertApptErr) {
              console.error('Failed to insert appointment:', insertApptErr);
              toolSuccess = false;
              toolError = insertApptErr.message;
            } else if (insertedAppt) {
              if (args.resourceId) {
                await this.supabase.from('resources')
                  .update({ status: 'in_use' })
                  .eq('id', args.resourceId)
                  .eq('business_id', business_id);
              } else if (args.resourceName) {
                const { data: res } = await this.supabase.from('resources')
                  .select('id')
                  .ilike('name', `%${args.resourceName}%`)
                  .eq('business_id', business_id)
                  .eq('status', 'available')
                  .limit(1);
                if (res && res.length > 0) {
                  await this.supabase.from('resources')
                    .update({ status: 'in_use' })
                    .eq('id', res[0].id)
                    .eq('business_id', business_id);
                }
              }

              // Also create a Lead so the call shows up in the Anrufhistorie
              savedLeadData = {
                business_id: business_id,
                name: args.callerName || (matchedCustomer?.name || 'Unbekannt'),
                contact_info: phoneNumber,
                concern: 'Terminbuchung: ' + args.title,
                status: 'closed', // Mark as closed since it's already a confirmed appointment
                metadata: {
                  category: 'booking',
                  urgency: 'normal',
                  notes: 'Termin wurde von Lisa gebucht: ' + (args.notes || ''),
                  transcript: history || []
                }
              };
              try {
                await this.supabase.from('leads').insert(savedLeadData);
              } catch (e) {
                console.error("Failed to insert lead for appointment:", e);
              }
            }

            // Fire Webhook if configured
            const webhookUrl = businessFacts?.webhookUrl;
            if (webhookUrl) {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              const secret = businessFacts?.webhookSecret;
              if (secret) headers['Authorization'] = `Bearer ${secret}`;
              
              fetch(webhookUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ event: 'appointment_booked', data: insertedAppt })
              }).catch(err => console.error('Webhook failed for appointment_booked', err));
            }
          } else {
             toolSuccess = false;
             toolError = 'Termin existiert bereits zur gleichen Zeit.';
          }

          try {
            const followUpRes = await this.ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                ...contents,
                response.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'book_appointment', response: { success: toolSuccess, error: toolError } } }] }
              ],
              config: {
                systemInstruction
              }
            });
            assistantText = followUpRes.text || "Der Termin wurde erfolgreich gebucht.";
          } catch (e) {
            assistantText = "Entschuldigung, beim Buchen des Termins ist ein Fehler aufgetreten.";
          }
        } else if (call.name === 'check_available_resources') {
          toolCalled = true;
          const args = call.args as any;
          let query = this.supabase.from('resources').select('*').eq('business_id', business_id).eq('status', 'available');
          if (args.type) query = query.eq('type', args.type);
          const { data: resources } = await query;
          
          let responseText = "Es wurden keine freien Ressourcen gefunden.";
          if (resources && resources.length > 0) {
            responseText = "Freie Ressourcen:\n" + resources.map((r: any) => `- ID: ${r.id} | Name: ${r.name} (Details: ${JSON.stringify(r.metadata)})`).join('\n');
          }

          try {
            const followUpRes = await this.ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                ...contents,
                response.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'check_available_resources', response: { result: responseText } } }] }
              ],
              config: {
                systemInstruction
              }
            });
            assistantText = followUpRes.text || "Ich habe die Ressourcen geprüft.";
          } catch (e) {
            assistantText = "Entschuldigung, ich konnte die Ressourcen gerade nicht prüfen.";
          }
        } else if (call.name === 'check_external_availability') {
          toolCalled = true;
          const args = call.args as any;
          
          const externalUrl = businessFacts?.externalApiUrl;
          const externalKey = businessFacts?.externalApiKey;

          let responseText = "Das externe System konnte nicht erreicht werden oder ist nicht konfiguriert.";

          if (externalUrl) {
            console.log(`Live-Abfrage externes System: ${externalUrl} für Typ: ${args.resourceType}`);
            try {
              const headers: Record<string, string> = { 'Content-Type': 'application/json' };
              if (externalKey) {
                headers['Authorization'] = `Bearer ${externalKey}`;
              }
              const fetchRes = await fetch(externalUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ action: 'check_availability', date: args.date, type: args.resourceType })
              });
              
              if (fetchRes.ok) {
                const data = await fetchRes.json();
                responseText = `Die Live-Verfügbarkeit besagt: ${JSON.stringify(data)}`;
              } else {
                console.error('External API returned error', fetchRes.status);
              }
            } catch (err) {
              console.error('External API request failed', err);
            }
          } else {
            responseText = "Es ist keine externe API konfiguriert.";
          }

          try {
            const followUpRes = await this.ai.models.generateContent({
              model: "gemini-3.6-flash",
              contents: [
                ...contents,
                response.candidates?.[0]?.content || { role: 'model', parts: [{ functionCall: call }] },
                { role: 'user', parts: [{ functionResponse: { name: 'check_external_availability', response: { result: responseText } } }] }
              ],
              config: {
                systemInstruction
              }
            });
            assistantText = followUpRes.text || "Ich habe die externe Verfügbarkeit geprüft.";
          } catch (e) {
            assistantText = "Entschuldigung, das externe System antwortet gerade nicht.";
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
