import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Type, FunctionDeclaration } from "@google/genai";
import { GeminiService, scriptedResponses } from "./server/ai/Gemini";
import dotenv from "dotenv";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { Readable } from "stream";
import ws from "ws";
import * as textToSpeech from "@google-cloud/text-to-speech";
import twilio from "twilio";
import { metrics } from "./server/metrics";

// Polyfill WebSocket for Supabase in Node < 22
globalThis.WebSocket = ws as any;

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Required for Twilio webhooks

const VoiceResponse = twilio.twiml.VoiceResponse;

// ==========================================
// 1. SUPABASE CLIENT
// ==========================================
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_PROJECT_ID || !supabaseKey) {
  console.warn("Supabase credentials not found in env vars. Please configure SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY.");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ==========================================
// 2. REST API ENDPOINTS
// ==========================================

app.get('/api/metrics/latency', (req, res) => {
  res.json(metrics.getStats());
});

// Normalize phone number for matching
function normalizePhone(p: string): string {
  return p.replace(/[\s\-\(\)\/\+]/g, '').replace(/^0049/, '0').replace(/^\+49/, '0');
}

// Get Customers
app.get('/api/customers', async (req, res) => {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const customers = data.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicle: c.vehicle,
    licensePlate: c.license_plate,
    isKnownCustomer: c.is_known_customer,
    lastVisitReason: c.last_visit_reason,
    hasOwnCar: c.has_own_car,
    rentsFromUs: c.rents_from_us,
    notes: c.notes,
    createdAt: c.created_at
  }));
  res.json(customers);
});

// Lookup Customer by Phone
app.get('/api/customers/lookup', async (req, res) => {
  const phone = req.query.phone as string;
  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter required' });
  }

  const cleanPhone = normalizePhone(phone);
  const { data, error } = await supabase.from('customers').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const found = data.find(c => normalizePhone(c.phone) === cleanPhone);

  if (found) {
    return res.json({
      found: true,
      customer: {
        id: found.id,
        name: found.name,
        phone: found.phone,
        vehicle: found.vehicle,
        licensePlate: found.license_plate,
        isKnownCustomer: found.is_known_customer,
        lastVisitReason: found.last_visit_reason,
        hasOwnCar: found.has_own_car,
        rentsFromUs: found.rents_from_us,
        notes: found.notes,
        createdAt: found.created_at
      }
    });
  }

  return res.json({ found: false, customer: null });
});

// Add or Update Customer
app.post('/api/customers', async (req, res) => {
  const data = req.body;
  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  const { data: newCustData, error } = await supabase.from('customers').insert({
    name: data.name,
    phone: data.phone,
    vehicle: data.vehicle || null,
    license_plate: data.licensePlate || null,
    is_known_customer: data.isKnownCustomer ?? true,
    last_visit_reason: data.lastVisitReason || null,
    has_own_car: data.hasOwnCar ?? true,
    rents_from_us: data.rentsFromUs ?? false,
    notes: data.notes || ''
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    id: newCustData.id,
    name: newCustData.name,
    phone: newCustData.phone,
    vehicle: newCustData.vehicle,
    licensePlate: newCustData.license_plate,
    isKnownCustomer: newCustData.is_known_customer,
    lastVisitReason: newCustData.last_visit_reason,
    hasOwnCar: newCustData.has_own_car,
    rentsFromUs: newCustData.rents_from_us,
    notes: newCustData.notes,
    createdAt: newCustData.created_at
  });
});

// Get All Leads
app.get('/api/leads', async (req, res) => {
  const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const leads = data.map(l => ({
    id: l.id,
    callerName: l.caller_name,
    phoneNumber: l.phone_number,
    category: l.category,
    concern: l.concern,
    urgency: l.urgency,
    vehicleInfo: l.vehicle_info,
    preferredCallbackTime: l.preferred_callback_time,
    status: l.status,
    notes: l.notes,
    transcript: l.transcript,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    assignedStaff: l.assigned_staff
  }));
  res.json(leads);
});

// Save Lead endpoint
app.post('/api/leads', async (req, res) => {
  const data = req.body;

  const newLead = {
    id: 'lead-' + Date.now().toString(36),
    caller_name: data.callerName || 'Unbekannt',
    phone_number: data.phoneNumber || '',
    category: data.category || 'general',
    concern: data.concern || 'Anfrage über KI-Empfang',
    urgency: data.urgency || 'normal',
    vehicle_info: data.vehicleInfo || '',
    preferred_callback_time: data.preferredCallbackTime || 'Schnellstmöglich',
    status: 'new',
    notes: data.notes || 'Automatisch erfasst von Autohaus KI-Empfangsdame Lisa',
    transcript: data.transcript || [],
    assigned_staff: data.category === 'workshop' ? 'Werkstatt-Team' : data.category === 'sales' || data.category === 'test_drive' ? 'Verkaufsteam' : 'Empfang'
  };

  const { data: inserted, error } = await supabase.from('leads').insert(newLead).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ success: true, lead: { ...inserted, callerName: inserted.caller_name, phoneNumber: inserted.phone_number } });
});

// Update Lead Status / Urgency / Notes
app.patch('/api/leads/:id', async (req, res) => {
  const { id } = req.params;

  const updates: any = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes) updates.notes = req.body.notes;
  if (req.body.assignedStaff) updates.assigned_staff = req.body.assignedStaff;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// Delete Lead
app.delete('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Business Facts GET & POST
app.get('/api/business-facts', async (req, res) => {
  const { data, error } = await supabase.from('business_facts').select('*').eq('id', 1).single();
  if (error || !data) {
    return res.json({
      dealershipName: 'Autohaus Kaiserslautern',
      address: 'Pariser Str. 120, 67655 Kaiserslautern',
      phone: '0631 1234560',
      email: 'info@autohaus-kaiserslautern.de',
      openingHours: {
        weekdays: 'Montag bis Freitag: 08:00 - 18:00 Uhr',
        saturday: 'Samstag: 09:00 - 14:00 Uhr',
        sunday: 'Sonntag: Geschlossen (Schauseite geöffnet)'
      },
      workshopHours: 'Montag bis Freitag: 07:30 - 17:00 Uhr',
      rentalRates: 'Mietwagen ab 39€ / Tag inklusive 100km. Vollkasko verfügbar.',
      emergencyNumber: '24/7 Pannennotdienst: 0800 555 4433',
      specialOffers: 'Sommer-Check inklusive Klima-Wartung für 49€ Angebot diesen Monat!',
      guardrailsPrompt: 'Sei stets freundlich, professionell und hilfsbereit. Gib keine medizinischen oder juristischen Ratschläge. Beschränke deine Antworten auf Themen des Autohauses Kaiserslautern.'
    });
  }

  res.json({
    dealershipName: data.dealership_name,
    address: data.address,
    phone: data.phone,
    email: data.email,
    openingHours: data.opening_hours,
    workshopHours: data.workshop_hours,
    rentalRates: data.rental_rates,
    emergencyNumber: data.emergency_number,
    specialOffers: data.special_offers,
    guardrailsPrompt: data.guardrails_prompt
  });
});

app.post('/api/business-facts', async (req, res) => {
  const payload = {
    id: 1,
    dealership_name: req.body.dealershipName,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    opening_hours: req.body.openingHours,
    workshop_hours: req.body.workshopHours,
    rental_rates: req.body.rentalRates,
    emergency_number: req.body.emergencyNumber,
    special_offers: req.body.specialOffers,
    guardrails_prompt: req.body.guardrailsPrompt
  };

  const { data, error } = await supabase.from('business_facts').upsert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(req.body);
});

// ==========================================
// 2.5 GOOGLE CLOUD TTS ENDPOINTS
// ==========================================
let ttsClient: textToSpeech.TextToSpeechClient | null = null;
try {
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    // Lade Credentials direkt aus einer Environment Variable (für Render/Vercel)
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    ttsClient = new textToSpeech.TextToSpeechClient({ credentials });
  } else {
    // Standard-Verhalten: Lade aus lokaler Datei via GOOGLE_APPLICATION_CREDENTIALS
    ttsClient = new textToSpeech.TextToSpeechClient();
  }
} catch (e) {
  console.warn("Google TTS Client could not be initialized:", e);
}

const ttsCache = new Map<string, Buffer>();

// scriptedResponses are now imported from server/ai/Gemini.ts

const DEFAULT_VOICE_ID = 'de-DE-Journey-F'; // Journey-F is commonly used for Aoede

const AUDIO_CACHE_DIR = path.join(process.cwd(), 'audio_cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

async function pregenerateScriptAudio(voiceId: string) {
  console.log(`Pre-generating script audio for voice: ${voiceId}`);
  for (const [tag, text] of Object.entries(scriptedResponses)) {
    const cacheKey = `${text}-${voiceId}`;
    if (!ttsCache.has(cacheKey)) {
      const safeTag = tag.replace(/[^a-zA-Z0-9_]/g, '');
      const filePath = path.join(AUDIO_CACHE_DIR, `${safeTag}_${voiceId}.mp3`);

      if (fs.existsSync(filePath)) {
        console.log(`Loading ${tag} from disk cache.`);
        const audioBuffer = fs.readFileSync(filePath);
        ttsCache.set(cacheKey, audioBuffer);
      } else {
        if (!ttsClient) {
          console.warn(`TTS Client not initialized, skipping generation for ${tag}`);
          continue;
        }
        try {
          console.log(`Generating TTS for ${tag} and saving to disk.`);
          const request = {
            input: { text: text + ' ...' },
            voice: { languageCode: 'de-DE', name: voiceId },
            audioConfig: { 
              audioEncoding: 'MP3' as const, 
              ...(voiceId.includes('Journey') ? {} : { speakingRate: 1.10 })
            }
          };
          const [response] = await ttsClient.synthesizeSpeech(request);
          if (response.audioContent) {
            const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
            fs.writeFileSync(filePath, audioBuffer);
            ttsCache.set(cacheKey, audioBuffer);
          }
        } catch (e) {
          console.error(`Failed to pre-generate audio for ${tag}:`, e);
        }
      }
    }
  }
}

// Trigger pre-generation for default voice on startup
pregenerateScriptAudio(DEFAULT_VOICE_ID);

app.get('/api/voice/voices', async (req, res) => {
  try {
    if (!ttsClient) throw new Error("Google TTS Client not initialized. Check your google-credentials.json");

    const [result] = await ttsClient.listVoices({ languageCode: 'de-DE' });

    const voices = result.voices?.filter(v =>
      v.name?.includes('Chirp3-HD') ||
      v.name?.includes('Studio') ||
      v.name?.includes('Neural2') ||
      v.name?.includes('Journey')
    ).map(v => {
      let displayName = v.name?.replace('de-DE-', '');
      if (v.name === 'de-DE-Neural2-G') displayName = 'Lisa (Neural2)';
      if (v.name === 'de-DE-Neural2-H') displayName = 'Herald (Neural2)';
      if (v.name === 'de-DE-Journey-F') displayName = 'Aoede (Journey)';
      if (v.name?.includes('Chirp3-HD')) displayName = displayName?.replace('Chirp3-HD-', '') + ' (Ultra-Realistisch)';
      if (v.name?.includes('Studio')) displayName = displayName + ' (Studio)';

      return {
        voice_id: v.name,
        name: displayName
      };
    }) || [];

    res.json({ voices });
  } catch (error: any) {
    console.error('Google TTS voices error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/voice/tts', async (req, res) => {
  const { text, voiceId } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const targetVoiceId = voiceId || DEFAULT_VOICE_ID;

  const cacheKey = `${text}-${targetVoiceId}`;
  if (ttsCache.has(cacheKey)) {
    res.set({ 'Content-Type': 'audio/mp3' });
    return res.send(ttsCache.get(cacheKey));
  }

  try {
    if (!ttsClient) throw new Error("Google TTS Client not initialized.");

    const request = {
      input: { text: text + ' ...' },
      voice: { languageCode: 'de-DE', name: targetVoiceId },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        ...(targetVoiceId.includes('Journey') ? {} : { speakingRate: 1.10 }) // Speeds up the voice by 10%
      },
    };

    const t0 = performance.now();
    const [response] = await ttsClient.synthesizeSpeech(request);
    metrics.record('tts', performance.now() - t0);

    if (response.audioContent) {
      const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
      ttsCache.set(cacheKey, audioBuffer); // Cache for future use

      res.set({
        'Content-Type': 'audio/mp3'
      });
      res.send(audioBuffer);
    } else {
      res.status(500).json({ error: "No audio content returned" });
    }
  } catch (error: any) {
    console.error('Google TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. GEMINI AI CONVERSATIONAL VOICE ENGINE
// ==========================================

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not configured.');
  return new GeminiService(apiKey, supabase);
};

app.post('/api/voice/interact', async (req, res) => {
  try {
    const { phoneNumber, userMessage, history, isFirstGreeting, hasSavedLead } = req.body;

    // 1. Fetch Business Facts
    let businessFacts: any = { dealershipName: 'Autohaus Kaiserslautern' };
    const t0 = performance.now();
    const { data: bf } = await supabase.from('business_facts').select('*').eq('id', 1).single();
    if (bf) {
      businessFacts = {
        dealershipName: bf.dealership_name,
        address: bf.address,
        phone: bf.phone,
        openingHours: bf.opening_hours,
        workshopHours: bf.workshop_hours,
        rentalRates: bf.rental_rates,
        emergencyNumber: bf.emergency_number,
        specialOffers: bf.special_offers,
        guardrailsPrompt: bf.guardrails_prompt
      };
    } else {
      businessFacts.guardrailsPrompt = "Sei stets freundlich, professionell und hilfsbereit.";
      businessFacts.openingHours = { weekdays: '08:00 - 18:00', saturday: '09:00 - 14:00', sunday: 'Geschlossen' };
    }

    // 2. Lookup Customer
    const cleanPhone = normalizePhone(phoneNumber || '');
    const { data: allCusts } = await supabase.from('customers').select('*');
    metrics.record('db', performance.now() - t0);
    const matchedCustomer = allCusts?.find(c => normalizePhone(c.phone) === cleanPhone);

    const aiService = getAiClient();
    const result = await aiService.processInteraction(
      phoneNumber,
      userMessage,
      history,
      isFirstGreeting,
      hasSavedLead,
      businessFacts,
      matchedCustomer
    );

    res.json(result);
  } catch (error: any) {
    console.error('Gemini Voice Interact Error:', error);
    res.status(500).json({ error: 'Fehler bei der KI-Verarbeitung', details: error.message });
  }
});

// ==========================================
// 4. TWILIO VOICE CALLING (TURN-BASED)
// ==========================================

// In-memory stores
const twilioCallSessions = new Map<string, any[]>();
const twilioAudioCache = new Map<string, Buffer>();

// Initialize Twilio Client for Outbound calls
let twilioClient: twilio.Twilio | null = null;
if (process.env.TWILIO_API_KEY_SID && process.env.TWILIO_API_KEY_SECRET && process.env.TWILIO_ACCOUNT_SID) {
  twilioClient = twilio(process.env.TWILIO_API_KEY_SID, process.env.TWILIO_API_KEY_SECRET, { accountSid: process.env.TWILIO_ACCOUNT_SID });
} else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

app.post('/api/twilio/call', async (req, res) => {
  try {
    const { toPhone, ngrokUrl } = req.body;
    if (!toPhone || !ngrokUrl) {
      return res.status(400).json({ error: 'toPhone and ngrokUrl are required' });
    }
    if (!twilioClient) {
      return res.status(500).json({ error: 'Twilio Client not initialized. Check .env.local' });
    }

    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhone) {
      return res.status(500).json({ error: 'TWILIO_PHONE_NUMBER not configured.' });
    }

    const t0 = performance.now();
    const call = await twilioClient.calls.create({
      url: `${ngrokUrl}/api/twilio/incoming`, // Point to our incoming webhook to start the interaction
      to: toPhone,
      from: twilioPhone
    });
    metrics.record('twilio', performance.now() - t0);

    res.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error('Twilio Outbound Call Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/twilio/incoming', async (req, res) => {
  try {
    const callSid = req.body.CallSid;
    const fromPhone = req.body.From;

    // Fetch initial greeting using the existing logic
    const interactRes = await fetch(`http://localhost:${PORT}/api/voice/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: fromPhone,
        isFirstGreeting: true,
        history: []
      })
    });

    const interactData = await interactRes.json();
    const greetingText = interactData.text || "Guten Tag. Wie kann ich Ihnen helfen?";

    // Generate Audio
    const ttsRes = await fetch(`http://localhost:${PORT}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: greetingText })
    });

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    const audioId = Date.now().toString();
    twilioAudioCache.set(audioId, audioBuffer);

    // Store empty history
    twilioCallSessions.set(callSid, [
      { sender: 'assistant', text: greetingText, timestamp: new Date().toISOString() }
    ]);

    const twiml = new VoiceResponse();
    // Play greeting
    twiml.play(`/api/twilio/audio/${audioId}`);

    // Gather speech
    twiml.gather({
      input: ['speech'],
      action: '/api/twilio/respond',
      language: 'de-DE',
      speechTimeout: 'auto'
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error('Twilio Incoming Error:', err);
    const twiml = new VoiceResponse();
    twiml.say({ language: 'de-DE' }, 'Es ist ein Fehler aufgetreten. Auf Wiederhören.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.post('/api/twilio/respond', async (req, res) => {
  try {
    const callSid = req.body.CallSid;
    const fromPhone = req.body.From;
    const userSpeech = req.body.SpeechResult;

    let history = twilioCallSessions.get(callSid) || [];

    if (!userSpeech) {
      // If nothing was said, just re-prompt
      const twiml = new VoiceResponse();
      twiml.gather({
        input: ['speech'],
        action: '/api/twilio/respond',
        language: 'de-DE',
        speechTimeout: 'auto'
      });
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    history.push({ sender: 'customer', text: userSpeech, timestamp: new Date().toISOString() });

    // Send to Gemini
    const interactRes = await fetch(`http://localhost:${PORT}/api/voice/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: fromPhone,
        userMessage: userSpeech,
        history: history
      })
    });

    const interactData = await interactRes.json();
    const assistantText = interactData.text || "Ich habe Sie leider nicht verstanden.";

    history.push({ sender: 'assistant', text: assistantText, timestamp: new Date().toISOString() });
    twilioCallSessions.set(callSid, history);

    // Generate Audio
    const ttsRes = await fetch(`http://localhost:${PORT}/api/voice/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: assistantText })
    });

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    const audioId = Date.now().toString();
    twilioAudioCache.set(audioId, audioBuffer);

    const twiml = new VoiceResponse();
    twiml.play(`/api/twilio/audio/${audioId}`);

    // Check if it's the farewell message to end the call, otherwise gather more input
    if (assistantText.includes('Auf Wiederhören')) {
      twiml.pause({ length: 1 });
      twiml.hangup();
    } else {
      twiml.gather({
        input: ['speech'],
        action: '/api/twilio/respond',
        language: 'de-DE',
        speechTimeout: 'auto'
      });
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) {
    console.error('Twilio Respond Error:', err);
    const twiml = new VoiceResponse();
    twiml.say({ language: 'de-DE' }, 'Es ist ein Fehler aufgetreten. Auf Wiederhören.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

app.get('/api/twilio/audio/:id', (req, res) => {
  const audioId = req.params.id;
  const buffer = twilioAudioCache.get(audioId);
  if (!buffer) {
    return res.status(404).send('Audio not found');
  }
  res.set('Content-Type', 'audio/mp3');
  res.send(buffer);
});

// ==========================================
// 5. VITE MIDDLEWARE / PRODUCTION STATIC SERVE
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Autohaus KI-Assistent Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
