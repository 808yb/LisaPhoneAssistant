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
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import { LRUCache } from "lru-cache";

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
const supabaseUrl = process.env.VITE_SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.SUPABASE_PROJECT_ID || !supabaseKey) {
  console.warn("Supabase credentials not found in env vars. Please configure SUPABASE_PROJECT_ID and SUPABASE_ANON_KEY.");
}

// Global Anon client
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Global Admin client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceKey || '');

// Auth & Context Middleware
app.use(async (req, res, next) => {
  // 1. Check if it's a Twilio request (webhook)
  const isTwilioWebhook = req.path === '/api/twilio/incoming' || req.path === '/api/twilio/respond';
  const twilioNumber = req.body?.To || req.query?.To;

  if (isTwilioWebhook && twilioNumber) {
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('twilio_phone_number', twilioNumber)
      .single();

    if (business) {
      (req as any).business_id = business.id;
    }
    return next();
  }

  // 2. Check for Frontend JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (user && !error) {
      (req as any).user = user;

      // console.log(`[Auth] User ${user.email} authenticated`);

      // Check if superadmin
      const { data: admin } = await supabaseAdmin.from('lisahq_admins').select('id').eq('email', user.email).maybeSingle();
      if (admin) {
        // console.log(`[Auth] User is superadmin`);
        (req as any).is_superadmin = true;
        return next();
      }

      // Check if business user
      const { data: bizUser } = await supabaseAdmin.from('business_users').select('business_id').eq('user_id', user.id).maybeSingle();
      if (bizUser) {
        // console.log(`[Auth] User is business user for ${bizUser.business_id}`);
        (req as any).business_id = bizUser.business_id;
        return next();
      } else {
        // console.log(`[Auth] User not found in business_users! ID: ${user.id}`);
      }
    } else {
      // console.log(`[Auth] Supabase auth error:`, error);
    }
  } else {
    // console.log(`[Auth] No valid auth header found for ${req.path}`);
  }

  // List of public API endpoints that don't require JWT authentication
  const publicApiRoutes = [
    '/api/metrics',
    '/api/twilio/call',
    '/api/twilio/incoming',
    '/api/twilio/respond',
    '/api/twilio/audio',
    '/api/voice/interact',
    '/api/voice/voices'
  ];

  const isPublicApi = publicApiRoutes.some(route => req.path.startsWith(route));

  if (req.path.startsWith('/api/') && !isPublicApi && !(req as any).user && !(req as any).business_id) {
    console.log(`[Auth] Rejecting unauthenticated request to ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});

// ==========================================
// 2. REST API ENDPOINTS
// ==========================================

app.get('/api/me', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  const business_id = (req as any).business_id;

  if (is_superadmin) {
    return res.json({ role: 'admin' });
  }

  if (business_id) {
    const { data: biz, error } = await supabaseAdmin.from('businesses').select('id, name').eq('id', business_id).single();
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch business details' });
    }
    return res.json({ role: 'business', business: biz });
  }

  return res.status(403).json({ error: 'No valid role found' });
});

app.get('/api/admin/businesses', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  if (!is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabaseAdmin
    .from('businesses')
    .select('*, business_facts (metadata)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/admin/businesses/:id', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  if (!is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const { id } = req.params;
  const { name, phone, email, twilioNumber } = req.body;

  // 1. Update name in 'businesses'
  if (name) {
    const { error: bizError } = await supabaseAdmin
      .from('businesses')
      .update({ name })
      .eq('id', id);
    if (bizError) return res.status(500).json({ error: bizError.message });
  }

  // 2. Fetch existing business_facts to merge metadata
  const { data: existingFacts, error: fetchError } = await supabaseAdmin
    .from('business_facts')
    .select('metadata')
    .eq('business_id', id)
    .single();

  let newMetadata = existingFacts?.metadata || {};
  if (phone !== undefined) newMetadata.phone = phone;
  if (email !== undefined) newMetadata.email = email;
  if (name !== undefined) newMetadata.businessName = name;
  if (twilioNumber !== undefined) newMetadata.twilioNumber = twilioNumber;

  // 3. Upsert updated metadata
  const { error: factsError } = await supabaseAdmin
    .from('business_facts')
    .upsert({ business_id: id, metadata: newMetadata }, { onConflict: 'business_id' });

  if (factsError) return res.status(500).json({ error: factsError.message });

  res.json({ success: true, name, metadata: newMetadata });
});

app.get('/api/admin/scripts/:businessId', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  if (!is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabaseAdmin
    .from('business_facts')
    .select('ai_prompt_instructions')
    .eq('business_id', req.params.businessId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }

  // Default structure if not found or invalid JSON
  let scriptObj = {
    core_greeting: ['Hallo, willkommen!'],
    core_ai_disclosure: ['Ich bin Lisa, die KI-Assistentin. Ich notiere nur Ihr Anliegen und speichere keine Daten dauerhaft.'],
    core_farewell: ['Auf Wiederhören, einen schönen Tag noch.'],
    custom_nodes: []
  };

  if (data?.ai_prompt_instructions) {
    try {
      scriptObj = JSON.parse(data.ai_prompt_instructions);
    } catch (e) {
      // ignore
    }
  }

  res.json(scriptObj);
});

app.post('/api/admin/scripts/:businessId', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  if (!is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const scriptObj = req.body;

  // Upsert the new script to business_facts
  const { error } = await supabaseAdmin
    .from('business_facts')
    .upsert({
      business_id: req.params.businessId,
      ai_prompt_instructions: JSON.stringify(scriptObj)
    }, { onConflict: 'business_id' });

  if (error) return res.status(500).json({ error: error.message });

  // Trigger TTS pregeneration in the background (we will implement this function next)
  pregenerateCustomScriptAudio(scriptObj, DEFAULT_VOICE_ID).catch(e => console.error("Pregeneration error:", e));

  res.json({ success: true });
});

app.get('/api/admin/global-scripts', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  if (!is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const globalScriptsFile = path.join(process.cwd(), 'global_scripts.json');
  let globalScripts: any = {
    core_greeting: ['Hallo, willkommen bei {business_name}!'],
    core_ai_disclosure: ['Ich bin Lisa, die KI-Assistentin. Ich notiere nur Ihr Anliegen und speichere keine Daten dauerhaft.'],
    core_farewell: ['Auf Wiederhören, einen schönen Tag noch.'],
    fillers: [
      {
        id: 'f1',
        category: 'Terminsuche',
        keywords: 'termin, tüv, tuv, werkstatt, probefahrt, inspektion',
        texts: ['Ich schaue kurz nach freien Terminen um.', 'Einen Moment, ich prüfe unseren Kalender.']
      }
    ]
  };

  if (fs.existsSync(globalScriptsFile)) {
    try {
      globalScripts = JSON.parse(fs.readFileSync(globalScriptsFile, 'utf8'));
    } catch (e) {
      console.error('Failed to parse global scripts:', e);
    }
  }

  res.json(globalScripts);
});

app.post('/api/admin/global-scripts', async (req, res) => {
  const is_superadmin = (req as any).is_superadmin;
  if (!is_superadmin) return res.status(403).json({ error: 'Forbidden' });

  const globalScripts = req.body;
  const globalScriptsFile = path.join(process.cwd(), 'global_scripts.json');

  fs.writeFileSync(globalScriptsFile, JSON.stringify(globalScripts, null, 2));

  // Trigger TTS pregeneration for ALL businesses
  try {
    const { data: businesses } = await supabaseAdmin.from('businesses').select('id, name');
    if (businesses) {
      for (const biz of businesses) {
        // Resolve placeholders
        const resolvedScripts = {
          core_greeting: globalScripts.core_greeting?.map((t: string) => t.replace(/{business_name}/g, biz.name)),
          core_ai_disclosure: globalScripts.core_ai_disclosure?.map((t: string) => t.replace(/{business_name}/g, biz.name)),
          core_farewell: globalScripts.core_farewell?.map((t: string) => t.replace(/{business_name}/g, biz.name)),
        };
        // Trigger generation
        await pregenerateCustomScriptAudio(resolvedScripts, DEFAULT_VOICE_ID);
      }
    }
  } catch (e) {
    console.error("Failed to pregenerate global scripts:", e);
  }

  res.json({ success: true });
});

app.get('/api/metrics/latency', (req, res) => {
  res.json(metrics.getStats());
});

// Normalize phone number for matching
function normalizePhone(p: string): string {
  return p.replace(/[\s\-\(\)\/\+]/g, '').replace(/^0049/, '0').replace(/^\+49/, '0');
}

// Get Customers
app.get('/api/customers', async (req, res) => {
  const business_id = (req as any).business_id;
  if (!business_id) {
    // If superadmin or no business_id is set, return empty list instead of throwing 500
    return res.json([]);
  }

  const { data, error } = await supabaseAdmin.from('customers').select('*').eq('business_id', business_id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const customers = data.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicle: c.metadata?.vehicle || null,
    licensePlate: c.metadata?.licensePlate || null,
    isKnownCustomer: c.metadata?.isKnownCustomer ?? false,
    lastVisitReason: c.metadata?.lastVisitReason || null,
    hasOwnCar: c.metadata?.hasOwnCar ?? false,
    rentsFromUs: c.metadata?.rentsFromUs ?? false,
    notes: c.notes,
    createdAt: c.created_at
  }));
  res.json(customers);
});

// Lookup Customer by Phone
app.get('/api/customers/lookup', async (req, res) => {
  const phone = req.query.phone as string;
  const business_id = (req as any).business_id;
  if (!phone) {
    return res.status(400).json({ error: 'Phone parameter required' });
  }
  if (!business_id) {
    return res.json(null);
  }

  const cleanPhone = normalizePhone(phone);
  const { data, error } = await supabaseAdmin.from('customers').select('*').eq('business_id', business_id);
  if (error) return res.status(500).json({ error: error.message });

  const found = data.find(c => normalizePhone(c.phone) === cleanPhone);

  if (found) {
    return res.json({
      found: true,
      customer: {
        id: found.id,
        name: found.name,
        phone: found.phone,
        vehicle: found.metadata?.vehicle || null,
        licensePlate: found.metadata?.licensePlate || null,
        isKnownCustomer: found.metadata?.isKnownCustomer ?? false,
        lastVisitReason: found.metadata?.lastVisitReason || null,
        hasOwnCar: found.metadata?.hasOwnCar ?? false,
        rentsFromUs: found.metadata?.rentsFromUs ?? false,
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
  const business_id = (req as any).business_id;
  if (!data.name || !data.phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  const { data: newCustData, error } = await supabaseAdmin.from('customers').insert({
    business_id,
    name: data.name,
    phone: data.phone,
    notes: data.notes || '',
    metadata: {
      vehicle: data.vehicle || null,
      licensePlate: data.licensePlate || null,
      isKnownCustomer: data.isKnownCustomer ?? false,
      lastVisitReason: data.lastVisitReason || null,
      hasOwnCar: data.hasOwnCar ?? false,
      rentsFromUs: data.rentsFromUs ?? false
    }
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({
    id: newCustData.id,
    name: newCustData.name,
    phone: newCustData.phone,
    vehicle: newCustData.metadata?.vehicle || null,
    licensePlate: newCustData.metadata?.licensePlate || null,
    isKnownCustomer: newCustData.metadata?.isKnownCustomer ?? false,
    lastVisitReason: newCustData.metadata?.lastVisitReason || null,
    hasOwnCar: newCustData.metadata?.hasOwnCar ?? false,
    rentsFromUs: newCustData.metadata?.rentsFromUs ?? false,
    notes: newCustData.notes,
    createdAt: newCustData.created_at
  });
});

// Update Customer
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const business_id = (req as any).business_id;

  if (!id) return res.status(400).json({ error: 'Customer ID required' });

  const { data: updatedCust, error } = await supabaseAdmin.from('customers').update({
    name: data.name,
    phone: data.phone,
    notes: data.notes || '',
    metadata: {
      vehicle: data.vehicle || null,
      licensePlate: data.licensePlate || null,
      isKnownCustomer: data.isKnownCustomer ?? false,
      lastVisitReason: data.lastVisitReason || null,
      hasOwnCar: data.hasOwnCar ?? false,
      rentsFromUs: data.rentsFromUs ?? false
    }
  }).eq('id', id).eq('business_id', business_id).select().single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({
    id: updatedCust.id,
    name: updatedCust.name,
    phone: updatedCust.phone,
    vehicle: updatedCust.metadata?.vehicle || null,
    licensePlate: updatedCust.metadata?.licensePlate || null,
    isKnownCustomer: updatedCust.metadata?.isKnownCustomer ?? false,
    lastVisitReason: updatedCust.metadata?.lastVisitReason || null,
    hasOwnCar: updatedCust.metadata?.hasOwnCar ?? false,
    rentsFromUs: updatedCust.metadata?.rentsFromUs ?? false,
    notes: updatedCust.notes,
    createdAt: updatedCust.created_at
  });
});

// Get Leads
app.get('/api/leads', async (req, res) => {
  const business_id = (req as any).business_id;
  if (!business_id) {
    return res.json([]);
  }

  const { data, error } = await supabaseAdmin.from('leads').select('*').eq('business_id', business_id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const mappedData = data.map((d: any) => ({
    ...d,
    callerName: d.name, // the db uses "name", front expects "callerName"
    phoneNumber: d.contact_info, // db uses "contact_info"
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    additionalInfo: d.metadata?.vehicleInfo || d.metadata?.additionalInfo,
    preferredCallbackTime: d.metadata?.preferredCallbackTime,
    assignedStaff: d.metadata?.assignedStaff
  }));

  res.json(mappedData);
});

// Save Lead endpoint
app.post('/api/leads', async (req, res) => {
  const business_id = (req as any).business_id;
  const data = req.body;

  const newLead = {
    business_id,
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

  const { data: inserted, error } = await supabaseAdmin.from('leads').insert(newLead).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ success: true, lead: { ...inserted, callerName: inserted.caller_name, phoneNumber: inserted.phone_number } });
});

// Update Lead Status / Urgency / Notes
app.patch('/api/leads/:id', async (req, res) => {
  const business_id = (req as any).business_id;
  const { id } = req.params;

  const updates: any = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.notes) updates.notes = req.body.notes;
  if (req.body.assignedStaff) updates.assigned_staff = req.body.assignedStaff;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin.from('leads').update(updates).eq('id', id).eq('business_id', business_id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// Delete Lead
app.delete('/api/leads/:id', async (req, res) => {
  const business_id = (req as any).business_id;
  const { id } = req.params;
  const { error } = await supabaseAdmin.from('leads').delete().eq('id', id).eq('business_id', business_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Business Facts GET & POST
app.get('/api/business-facts', async (req, res) => {
  const business_id = (req as any).business_id;
  const { data, error } = await supabaseAdmin.from('business_facts').select('*').eq('business_id', business_id).single();
  if (error || !data) {
    return res.json({
      businessName: 'Beispielunternehmen',
      address: 'Musterstraße 1, 12345 Musterstadt',
      phone: '0123 456789',
      email: 'info@beispielunternehmen.de',
      openingHours: {
        weekdays: 'Montag bis Freitag: 08:00 - 18:00 Uhr',
        saturday: 'Samstag: 09:00 - 14:00 Uhr',
        sunday: 'Sonntag: Geschlossen'
      },
      secondaryHours: '',
      pricing: '',
      emergencyNumber: '',
      specialOffers: '',
      guardrailsPrompt: 'Sei stets freundlich, professionell und hilfsbereit. Gib keine medizinischen oder juristischen Ratschläge.',
      products: '',
      services: '',
      teamMembers: '',
      appointmentRules: '',
      knowledgeBase: '',
      permissions: {
        mentionPrices: false,
        mentionEmployees: true,
        bookAppointments: true,
        technicalAdvice: false
      }
    });
  }

  let actualGuardrails = data.metadata?.guardrailsPrompt || '';
  let perms = { mentionPrices: false, mentionEmployees: true, bookAppointments: true, technicalAdvice: false };

  if (actualGuardrails.includes('|||PERMISSIONS|||')) {
    const parts = actualGuardrails.split('|||PERMISSIONS|||');
    actualGuardrails = parts[0];
    try {
      perms = JSON.parse(parts[1]);
    } catch (e) { }
  }

  res.json({
    businessName: data.metadata?.businessName || '',
    address: data.metadata?.address || '',
    phone: data.metadata?.phone || '',
    email: data.metadata?.email || '',
    openingHours: data.metadata?.openingHours || '',
    secondaryHours: data.metadata?.secondaryHours || '',
    pricing: data.metadata?.pricing || '',
    emergencyNumber: data.metadata?.emergencyNumber || '',
    specialOffers: data.metadata?.specialOffers || '',
    guardrailsPrompt: actualGuardrails,
    products: data.metadata?.products || '',
    services: data.metadata?.services || '',
    teamMembers: data.metadata?.teamMembers || '',
    appointmentRules: data.metadata?.appointmentRules || '',
    knowledgeBase: data.metadata?.knowledgeBase || '',
    permissions: perms,
    externalApiUrl: data.metadata?.externalApiUrl || '',
    externalApiKey: data.metadata?.externalApiKey || '',
    webhookUrl: data.metadata?.webhookUrl || '',
    webhookSecret: data.metadata?.webhookSecret || ''
  });
});

app.post('/api/business-facts', async (req, res) => {
  const business_id = (req as any).business_id;

  // Package everything into the metadata object
  const metadata = {
    businessName: req.body.businessName,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    openingHours: req.body.openingHours,
    secondaryHours: req.body.secondaryHours,
    pricing: req.body.pricing,
    emergencyNumber: req.body.emergencyNumber,
    specialOffers: req.body.specialOffers,
    guardrailsPrompt: req.body.guardrailsPrompt + '|||PERMISSIONS|||' + JSON.stringify(req.body.permissions || {}),
    products: req.body.products,
    services: req.body.services,
    teamMembers: req.body.teamMembers,
    appointmentRules: req.body.appointmentRules,
    knowledgeBase: req.body.knowledgeBase,
    externalApiUrl: req.body.externalApiUrl,
    externalApiKey: req.body.externalApiKey,
    webhookUrl: req.body.webhookUrl,
    webhookSecret: req.body.webhookSecret
  };

  const payload = {
    business_id: business_id,
    metadata: metadata
  };

  const { data, error } = await supabaseAdmin.from('business_facts').upsert(payload, { onConflict: 'business_id' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(req.body);
});

// --- RESOURCES ---
app.get('/api/resources', async (req, res) => {
  const business_id = (req as any).business_id;
  const { data, error } = await supabaseAdmin.from('resources').select('*').eq('business_id', business_id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/external-resources', async (req, res) => {
  const business_id = (req as any).business_id;

  // 1. Fetch business facts to get the external API URL and token
  const { data: bf, error } = await supabaseAdmin
    .from('business_facts')
    .select('metadata')
    .eq('business_id', business_id)
    .single();

  if (error || !bf || !bf.metadata?.externalApiUrl) {
    return res.status(400).json({ error: "Keine externe API konfiguriert." });
  }

  const url = bf.metadata.externalApiUrl;
  const token = bf.metadata.externalApiKey;

  // 2. Fetch from the external API
  try {
    const fetchRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ action: 'list_resources' })
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: "Fehler beim Abrufen der externen Ressourcen." });
    }

    const data = await fetchRes.json();
    res.json(data.resources || []); // Expect the edge function to return { resources: [...] }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/external-resources/update', async (req, res) => {
  const business_id = (req as any).business_id;
  const { id, status } = req.body;

  const { data: bf, error } = await supabaseAdmin
    .from('business_facts')
    .select('metadata')
    .eq('business_id', business_id)
    .single();

  if (error || !bf || !bf.metadata?.externalApiUrl) {
    return res.status(400).json({ error: "Keine externe API konfiguriert." });
  }

  const url = bf.metadata.externalApiUrl;
  const token = bf.metadata.externalApiKey;

  try {
    const fetchRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ action: 'update_status', data: { id, status } })
    });

    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: "Fehler beim Aktualisieren der externen Ressource." });
    }

    const responseData = await fetchRes.json();
    res.json({ success: true, ...responseData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resources', async (req, res) => {
  const business_id = (req as any).business_id;
  const payload = { ...req.body, business_id };
  const { data, error } = await supabaseAdmin.from('resources').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/resources/:id', async (req, res) => {
  const business_id = (req as any).business_id;
  const { data, error } = await supabaseAdmin.from('resources')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('business_id', business_id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/resources/:id', async (req, res) => {
  const business_id = (req as any).business_id;
  const { error } = await supabaseAdmin.from('resources').delete().eq('id', req.params.id).eq('business_id', business_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- APPOINTMENTS ---
app.get('/api/appointments', async (req, res) => {
  const business_id = (req as any).business_id;
  const { data, error } = await supabaseAdmin.from('appointments').select('*, customer:customers(name, phone)').eq('business_id', business_id).order('start_time', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/appointments', async (req, res) => {
  const business_id = (req as any).business_id;
  const payload = { ...req.body, business_id };
  const { data, error } = await supabaseAdmin.from('appointments').insert(payload).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, appointment: data });
});

app.patch('/api/appointments/:id', async (req, res) => {
  const business_id = (req as any).business_id;
  const { data, error } = await supabaseAdmin.from('appointments')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('business_id', business_id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/appointments/:id', async (req, res) => {
  const business_id = (req as any).business_id;
  const { error } = await supabaseAdmin.from('appointments').delete().eq('id', req.params.id).eq('business_id', business_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- RESOURCE TEMPLATES ---
app.get('/api/resource-templates', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('resource_templates').select('*').order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/resource-templates', async (req, res) => {
  const { type, label, fields } = req.body;
  if (!type || !label) return res.status(400).json({ error: "type and label are required" });

  const { data, error } = await supabaseAdmin.from('resource_templates').insert({ type, label, fields: fields || [] }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/resource-templates/:id', async (req, res) => {
  const { label, fields } = req.body;
  const { data, error } = await supabaseAdmin.from('resource_templates')
    .update({ label, fields })
    .eq('id', req.params.id)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/api/resource-templates/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('resource_templates').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
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

const ttsCache = new LRUCache<string, Buffer>({ max: 5000 });

// scriptedResponses are now imported from server/ai/Gemini.ts

const DEFAULT_VOICE_ID = 'de-DE-Journey-F'; // Journey-F is commonly used for Aoede

const AUDIO_CACHE_DIR = path.join(process.cwd(), 'audio_cache');
if (!fs.existsSync(AUDIO_CACHE_DIR)) {
  fs.mkdirSync(AUDIO_CACHE_DIR, { recursive: true });
}

async function pregenerateCustomScriptAudio(scriptObj: any, voiceId: string) {
  console.log(`Pre-generating custom script audio for voice: ${voiceId}`);

  // Extract all text strings from the scriptObj
  const textsToGenerate: { tag: string, text: string }[] = [];

  if (scriptObj.core_greeting) scriptObj.core_greeting.forEach((t: string, i: number) => textsToGenerate.push({ tag: `greeting_${i}`, text: t }));
  if (scriptObj.core_ai_disclosure) scriptObj.core_ai_disclosure.forEach((t: string, i: number) => textsToGenerate.push({ tag: `disclosure_${i}`, text: t }));
  if (scriptObj.core_farewell) scriptObj.core_farewell.forEach((t: string, i: number) => textsToGenerate.push({ tag: `farewell_${i}`, text: t }));

  if (scriptObj.custom_nodes && Array.isArray(scriptObj.custom_nodes)) {
    scriptObj.custom_nodes.forEach((node: any, nIdx: number) => {
      if (node.texts && Array.isArray(node.texts)) {
        node.texts.forEach((t: string, tIdx: number) => {
          textsToGenerate.push({ tag: `custom_${nIdx}_${tIdx}`, text: t });
        });
      }
    });
  }

  if (scriptObj.fillers && Array.isArray(scriptObj.fillers)) {
    scriptObj.fillers.forEach((f: any, fIdx: number) => {
      if (f.texts && Array.isArray(f.texts)) {
        f.texts.forEach((t: string, tIdx: number) => {
          textsToGenerate.push({ tag: `filler_${fIdx}_${tIdx}`, text: t });
        });
      }
    });
  }

  for (const item of textsToGenerate) {
    const text = item.text.trim();
    if (!text) continue;

    const cacheKey = `${text}-${voiceId}`;
    if (!ttsCache.has(cacheKey)) {
      const safeTag = item.tag.replace(/[^a-zA-Z0-9_]/g, '');
      const textHash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
      const filePath = path.join(AUDIO_CACHE_DIR, `dyn_${safeTag}_${textHash}_${voiceId}.mp3`);

      if (fs.existsSync(filePath)) {
        const audioBuffer = fs.readFileSync(filePath);
        ttsCache.set(cacheKey, audioBuffer);
      } else {
        if (!ttsClient) continue;
        try {
          console.log(`Generating TTS for dynamic text: "${text.substring(0, 20)}..."`);
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
          console.error(`Failed to pre-generate audio for "${text}":`, e);
        }
      }
    }
  }
}

async function pregenerateScriptAudio(voiceId: string) {
  console.log(`Pre-generating script audio for voice: ${voiceId}`);
  for (const [tag, text] of Object.entries(scriptedResponses)) {
    const cacheKey = `${text}-${voiceId}`;
    if (!ttsCache.has(cacheKey)) {
      const safeTag = tag.replace(/[^a-zA-Z0-9_]/g, '');
      const textHash = crypto.createHash('md5').update(text).digest('hex').substring(0, 8);
      const filePath = path.join(AUDIO_CACHE_DIR, `${safeTag}_${textHash}_${voiceId}.mp3`);

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
            input: { text: text },
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

(async () => {
  try {
    const globalScriptsPath = path.join(process.cwd(), 'global_scripts.json');
    if (fs.existsSync(globalScriptsPath)) {
      const globalScripts = JSON.parse(fs.readFileSync(globalScriptsPath, 'utf8'));
      await pregenerateCustomScriptAudio(globalScripts, DEFAULT_VOICE_ID);
    }
  } catch (e) {
    console.error("Failed to pregenerate global scripts on startup:", e);
  }
})();

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

export async function generateTTSCore(text: string, voiceId?: string): Promise<Buffer> {
  const targetVoiceId = voiceId || DEFAULT_VOICE_ID;
  const cacheKey = `${text}-${targetVoiceId}`;

  if (ttsCache.has(cacheKey)) {
    return ttsCache.get(cacheKey) as Buffer;
  }

  if (!ttsClient) throw new Error("Google TTS Client not initialized.");

  const request = {
    input: { text: text },
    voice: { languageCode: 'de-DE', name: targetVoiceId },
    audioConfig: {
      audioEncoding: 'MP3' as const,
      ...(targetVoiceId.includes('Journey') ? {} : { speakingRate: 1.10 })
    },
  };

  const t0 = performance.now();
  const [response] = await ttsClient.synthesizeSpeech(request);
  metrics.record('tts', performance.now() - t0);

  if (response.audioContent) {
    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
    ttsCache.set(cacheKey, audioBuffer);
    return audioBuffer;
  } else {
    throw new Error("No audio content returned");
  }
}

app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const audioBuffer = await generateTTSCore(text, voiceId);

    res.set({
      'Content-Type': 'audio/mp3'
    });
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('Google TTS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Businesses for HQ
app.get('/api/businesses', async (req, res) => {
  if (!(req as any).is_superadmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Join businesses with business_facts
  const { data: businesses, error: bErr } = await supabaseAdmin.from('businesses').select('*');
  const { data: facts, error: fErr } = await supabaseAdmin.from('business_facts').select('business_id, ai_prompt_instructions');

  if (bErr || fErr) {
    console.error("DB Error:", bErr || fErr);
    return res.status(500).json({ error: 'DB Error' });
  }

  const result = businesses.map(b => {
    const fact = facts.find(f => f.business_id === b.id);
    let scripts = {};
    if (fact && fact.ai_prompt_instructions) {
      try {
        scripts = JSON.parse(fact.ai_prompt_instructions);
      } catch (e) {
        // Not a JSON object, ignore
      }
    }
    return {
      id: b.id,
      dealership_name: b.name,
      twilio_phone_number: b.twilio_phone_number,
      scripts
    };
  });
  res.json(result);
});

// Save Scripts
app.put('/api/businesses/:id/scripts', async (req, res) => {
  if (!(req as any).is_superadmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { id } = req.params;
  const { scripts } = req.body;

  // Save as JSON string in ai_prompt_instructions for now (or a new column)
  const { error } = await supabaseAdmin.from('business_facts')
    .update({ ai_prompt_instructions: JSON.stringify(scripts) })
    .eq('business_id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Generate Audio
app.post('/api/scripts/generate-audio', async (req, res) => {
  // Stub for audio generation
  console.log("Audio generation triggered for:", req.body.twilioPhoneNumber);
  res.json({ success: true });
});

// Magic Fill: Scrape Website
app.post('/api/scrape-business', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // 1. Fetch website HTML
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });
    const html = await fetchRes.text();

    // 2. Extract raw text using cheerio
    const $ = cheerio.load(html);
    // Remove scripts, styles, etc.
    $('script, style, noscript').remove();
    const rawText = $('body').text().replace(/\s+/g, ' ').substring(0, 30000); // Limit length to avoid huge token costs

    // 3. Ask Gemini to extract structured JSON
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not configured.');

    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

    const prompt = `Du bist ein intelligenter Daten-Extraktor. Analysiere den folgenden Text von der Unternehmens-Webseite und extrahiere die relevanten Informationen für ein CRM/KI-System.
Gib das Ergebnis **ausschließlich** als gültiges JSON-Objekt zurück. Verwende dieses exakte Schema:
{
  "dealershipName": "Name des Unternehmens",
  "address": "Vollständige Adresse (falls gefunden)",
  "phone": "Zentrale Telefonnummer (falls gefunden)",
  "email": "Allgemeine E-Mail (falls gefunden)",
  "emergencyNumber": "Notdienst/Pannenhotline (falls gefunden)",
  "brands": "Marken oder Produkte, die verkauft/vertreten werden (kommagetrennt)",
  "services": "Dienstleistungen, die angeboten werden (kommagetrennt)",
  "rentalRates": "Preise, Preislisten oder Tarif-Konditionen für Dienstleistungen/Produkte (als lesbarer Freitext)",
  "specialOffers": "Aktuelle Rabatte, Aktionen oder Sonderangebote (als Freitext)",
  "openingHours": [
     {"day": "Montag", "open": "08:00", "close": "18:00", "closed": false},
     ...
  ],
  "workshopHours": [
     ...gleiches Format wie openingHours, falls separate Werkstattzeiten vorhanden...
  ]
}
Wenn eine Information nicht im Text gefunden wird, lasse den String leer oder gib ein leeres Array zurück.

Webseiten-Text:
"""
${rawText}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Scraping error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 3. GEMINI AI CONVERSATIONAL VOICE ENGINE
// ==========================================

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not configured.');
  return new GeminiService(apiKey, supabaseAdmin);
};

export async function processVoiceInteractionCore(params: {
  phoneNumber: string;
  userMessage?: string;
  history: any[];
  isFirstGreeting?: boolean;
  hasSavedLead?: boolean;
  business_id?: string;
}) {
  const { phoneNumber, userMessage, history, isFirstGreeting, hasSavedLead, business_id } = params;

  // 1. Fetch Business Facts
  let businessFacts: any = { dealershipName: 'Autohaus Kaiserslautern' };
  const t0 = performance.now();
  const { data: bf } = await supabaseAdmin.from('business_facts').select('*').eq('business_id', business_id).single();
  const { data: biz } = await supabaseAdmin.from('businesses').select('name').eq('id', business_id).single();

  if (bf || biz) {
    let actualGuardrails = bf?.metadata?.guardrailsPrompt || '';
    let permissions = { mentionPrices: false, mentionEmployees: true, bookAppointments: true, technicalAdvice: false };

    if (actualGuardrails.includes('|||PERMISSIONS|||')) {
      const parts = actualGuardrails.split('|||PERMISSIONS|||');
      actualGuardrails = parts[0];
      try { permissions = JSON.parse(parts[1]); } catch (e) { }
    }

    businessFacts = {
      businessName: bf?.metadata?.businessName || biz?.name,
      address: bf?.metadata?.address,
      phone: bf?.metadata?.phone,
      openingHours: bf?.metadata?.openingHours,
      secondaryHours: bf?.metadata?.secondaryHours,
      pricing: bf?.metadata?.pricing,
      emergencyNumber: bf?.metadata?.emergencyNumber,
      specialOffers: bf?.metadata?.specialOffers,
      products: bf?.metadata?.products,
      services: bf?.metadata?.services,
      teamMembers: bf?.metadata?.teamMembers,
      appointmentRules: bf?.metadata?.appointmentRules,
      knowledgeBase: bf?.metadata?.knowledgeBase,
      guardrailsPrompt: actualGuardrails,
      permissions,
      externalApiUrl: bf?.metadata?.externalApiUrl,
      externalApiKey: bf?.metadata?.externalApiKey,
      webhookUrl: bf?.metadata?.webhookUrl,
      webhookSecret: bf?.metadata?.webhookSecret
    };

    let customScripts = { custom_nodes: [] };
    try {
      if (bf?.ai_prompt_instructions) {
        customScripts = JSON.parse(bf.ai_prompt_instructions);
      }
    } catch (e) { }

    let globalScripts: any = {};
    try {
      const p = path.join(process.cwd(), 'global_scripts.json');
      if (fs.existsSync(p)) {
        globalScripts = JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) { }

    // Resolve {business_name} placeholders in global scripts
    const name = biz?.name || 'unserem Unternehmen';
    businessFacts.scriptObj = {
      core_greeting: (globalScripts.core_greeting || []).map((t: string) => t.replace(/{business_name}/g, name)),
      core_ai_disclosure: (globalScripts.core_ai_disclosure || []).map((t: string) => t.replace(/{business_name}/g, name)),
      core_farewell: (globalScripts.core_farewell || []).map((t: string) => t.replace(/{business_name}/g, name)),
      fillers: globalScripts.fillers || [],
      custom_nodes: customScripts.custom_nodes || []
    };
  } else {
    businessFacts.guardrailsPrompt = "Sei stets freundlich, professionell und hilfsbereit.";
    businessFacts.openingHours = { weekdays: '08:00 - 18:00', saturday: '09:00 - 14:00', sunday: 'Geschlossen' };
    businessFacts.scriptObj = { core_greeting: [], core_ai_disclosure: [], core_farewell: [], custom_nodes: [] };
  }

  // 2. Lookup Customer
  const cleanPhone = normalizePhone(phoneNumber || '');
  const { data: allCusts } = await supabaseAdmin.from('customers').select('*').eq('business_id', business_id);
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
    matchedCustomer,
    business_id
  );

  return result;
}

app.post('/api/voice/interact', async (req, res) => {
  try {
    const { phoneNumber, userMessage, history, isFirstGreeting, hasSavedLead, business_id: bodyBusinessId } = req.body;

    const authBusinessId = (req as any).business_id;
    const isPublic = !req.headers.authorization;

    // Security check: Block explicit business_id from public requests to prevent tenant hijacking
    if (isPublic && bodyBusinessId) {
      return res.status(403).json({ error: 'Unauthorized tenant access.' });
    }

    // Only use auth-provided business_id.
    // For demo purposes (public without body business_id), this falls back to undefined.
    const business_id = authBusinessId;

    const result = await processVoiceInteractionCore({
      phoneNumber,
      userMessage,
      history,
      isFirstGreeting,
      hasSavedLead,
      business_id
    });

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
const twilioCallSessions = new LRUCache<string, any[]>({ max: 500, ttl: 1000 * 60 * 60 * 2 }); // 2 hours TTL
const twilioCallStates = new LRUCache<string, { hasSavedLead: boolean }>({ max: 500, ttl: 1000 * 60 * 60 * 2 });
const twilioCallFillers = new LRUCache<string, any[]>({ max: 500, ttl: 1000 * 60 * 60 * 2 });
const twilioAudioCache = new LRUCache<string, Buffer>({ max: 1000, ttl: 1000 * 60 * 30 }); // 30 mins TTL

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
const validateTwilioRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allow bypassing in dev if specifically needed, but default to validating
  if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_TWILIO_SIG === 'true') {
    return next();
  }

  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const authToken = process.env.TWILIO_AUTH_TOKEN || '';

  if (!twilioSignature || !authToken) {
    return res.status(403).send('Forbidden: Missing Twilio Signature or Auth Token');
  }

  // Twilio signs the full URL it requested.
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = `${protocol}://${host}${req.originalUrl}`;

  const isValid = twilio.validateRequest(authToken, twilioSignature, url, req.body);

  if (isValid) {
    next();
  } else {
    console.error('Twilio Signature Validation Failed for URL:', url);
    res.status(403).send('Forbidden: Invalid Twilio Signature');
  }
};

app.post('/api/twilio/incoming', validateTwilioRequest, async (req, res) => {
  try {
    const callSid = req.body.CallSid;
    const fromPhone = req.body.From;
    const toPhone = req.body.To;

    // Lookup business by Twilio number (check both To and From to support both inbound and outbound calls)
    let business_id = undefined;
    if (toPhone || fromPhone) {
      const { data: bfData } = await supabaseAdmin
        .from('business_facts')
        .select('business_id, metadata');

      const match = bfData?.find(b =>
        b.metadata?.twilioNumber === toPhone || b.metadata?.twilioNumber === toPhone?.replace('+', '00') ||
        b.metadata?.twilioNumber === fromPhone || b.metadata?.twilioNumber === fromPhone?.replace('+', '00')
      );
      if (match) business_id = match.business_id;
    }

    // Fetch initial greeting using the existing logic
    const interactData = await processVoiceInteractionCore({
      phoneNumber: fromPhone,
      history: [],
      isFirstGreeting: true,
      business_id
    });

    const greetingText = interactData.text || "Guten Tag. Wie kann ich Ihnen helfen?";

    // Generate Audio
    const audioBuffer = await generateTTSCore(greetingText);
    const audioId = Date.now().toString();
    twilioAudioCache.set(audioId, audioBuffer);

    // Store empty history
    twilioCallSessions.set(callSid, [
      { sender: 'assistant', text: greetingText, timestamp: new Date().toISOString() }
    ]);
    twilioCallStates.set(callSid, { hasSavedLead: false });
    twilioCallFillers.set(callSid, interactData.fillers || []); // Store the custom fillers for this call

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

app.post('/api/twilio/respond', validateTwilioRequest, async (req, res) => {
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

    // Asynchronous Call Update Architecture

    // 1. Instantly respond with a Smart Filler Audio + Pause (so Twilio stays alive)
    const customFillers = twilioCallFillers.get(callSid) || [];
    let fillerTextToPlay: string | null = null;
    const speechLower = userSpeech.toLowerCase().trim();

    // Skip filler completely for short, direct answers that likely end a conversation
    const isFarewellOrNo = /\b(nein|nee|nö|passt|danke|tschüss|ciao|wiederhören|wiedersehen)\b/i.test(speechLower) && speechLower.length < 40;
    if (isFarewellOrNo) {
      fillerTextToPlay = null;
    } else {
      // Find a matching custom filler
      let matchedFiller = customFillers.find((f: any) => {
        if (!f.keywords) return false;
        const keywords = f.keywords.split(',').map((k: string) => k.trim().toLowerCase());
        // wildcard match for general waiting
        if (keywords.includes('*')) return false;
        return keywords.some((k: string) => speechLower.includes(k));
      });

      // Fallback to wildcard or generic filler
      if (!matchedFiller) {
        matchedFiller = customFillers.find((f: any) => f.keywords?.trim() === '*');
      }

      const variations = matchedFiller?.texts || matchedFiller?.variations;
      if (variations && variations.length > 0) {
        // Pick random variation
        fillerTextToPlay = variations[Math.floor(Math.random() * variations.length)];
      } else {
        // Ultimate fallback
        fillerTextToPlay = 'Einen kleinen Moment bitte.';
      }
    }

    const twiml = new VoiceResponse();

    // Play filler ONLY if we decided one is appropriate
    if (fillerTextToPlay) {
      const b64SmartFiller = Buffer.from(fillerTextToPlay).toString('base64');
      twiml.play(`/api/twilio/audio/b64_${b64SmartFiller}`);
      
      twiml.pause({ length: 35 });
    } else {
      twiml.pause({ length: 40 }); // Wait up to 40 seconds for Gemini and Webhooks
    }

    res.type('text/xml');
    res.send(twiml.toString());

    // 2. Do the heavy lifting (LLM + TTS) in the background
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const baseUrl = `${protocol}://${host}`;

    (async () => {
      try {
        history.push({ sender: 'customer', text: userSpeech, timestamp: new Date().toISOString() });

        const callState = twilioCallStates.get(callSid) || { hasSavedLead: false };
        const toPhone = req.body.To;

        let business_id = undefined;
        if (toPhone || fromPhone) {
          const { data: bfData } = await supabaseAdmin
            .from('business_facts')
            .select('business_id, metadata');
          const match = bfData?.find(b =>
            b.metadata?.twilioNumber === toPhone || b.metadata?.twilioNumber === toPhone?.replace('+', '00') ||
            b.metadata?.twilioNumber === fromPhone || b.metadata?.twilioNumber === fromPhone?.replace('+', '00')
          );
          if (match) business_id = match.business_id;
        }

        // Send to Gemini
        const interactData = await processVoiceInteractionCore({
          phoneNumber: fromPhone,
          userMessage: userSpeech,
          history: history,
          hasSavedLead: callState.hasSavedLead,
          business_id
        });
        const assistantText = interactData.text || "Ich habe Sie leider nicht verstanden.";

        if (interactData.savedLeadData) {
          callState.hasSavedLead = true;
          twilioCallStates.set(callSid, callState);
        }

        history.push({ sender: 'assistant', text: assistantText, timestamp: new Date().toISOString() });
        twilioCallSessions.set(callSid, history);

        // Generate Audio for the final response
        const audioBuffer = await generateTTSCore(assistantText);
        const audioId = Date.now().toString();
        twilioAudioCache.set(audioId, audioBuffer);

        // 3. Update the Live Call with the new Audio
        const updateTwiml = new VoiceResponse();

        if (assistantText.includes('Auf Wiederhören')) {
          updateTwiml.play(`${baseUrl}/api/twilio/audio/${audioId}`);
        } else {
          const gather = updateTwiml.gather({
            input: ['speech'],
            action: `${baseUrl}/api/twilio/respond`,
            language: 'de-DE',
            speechTimeout: 'auto'
          });
          gather.play(`${baseUrl}/api/twilio/audio/${audioId}`);
        }

        if (twilioClient) {
          // Asynchronously replace the <Pause> with the generated Audio!
          await twilioClient.calls(callSid).update({ twiml: updateTwiml.toString() });
        }
      } catch (e) {
        console.error("Background Async Error:", e);
      }
    })();
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

  if (audioId.startsWith('b64_')) {
    try {
      const base64Text = audioId.replace('b64_', '').replace(/\.mp3$/, '');
      const decodedText = Buffer.from(base64Text, 'base64').toString('utf8');
      const cacheKey = `${decodedText}-${DEFAULT_VOICE_ID}`;
      
      const buffer = ttsCache.get(cacheKey);
      if (buffer) {
        res.set('Content-Type', 'audio/mp3');
        return res.send(buffer);
      } else {
        console.warn(`Audio not found in ttsCache for decoded text: "${decodedText}"`);
      }
    } catch (e) {
      console.error("Failed to decode base64 audio id:", e);
    }
  } else if (audioId.startsWith('filler')) {
    // Determine which pre-generated text to look for based on ID
    let fillerText = 'Einen kleinen Moment bitte.';
    if (audioId === 'filler_appointment') fillerText = 'Ich schaue kurz nach freien Terminen um.';
    else if (audioId === 'filler_note') fillerText = 'Ich notiere mir das kurz.';
    else if (audioId === 'filler_search') fillerText = 'Ich gucke mal kurz nach.';

    const fillerKey = `${fillerText}-${DEFAULT_VOICE_ID}`;
    const fillerBuffer = ttsCache.get(fillerKey);
    if (fillerBuffer) {
      res.set('Content-Type', 'audio/mp3');
      return res.send(fillerBuffer);
    }
  }

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
