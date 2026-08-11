import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import ws from 'ws';

// Polyfill WebSocket for Node < 22
globalThis.WebSocket = ws as any;

// Load env vars
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const supabaseUrl = process.env.SUPABASE_PROJECT_ID 
  ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` 
  : process.env.VITE_SUPABASE_URL;

// We MUST use the service role key to bypass RLS when seeding data
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_PROJECT_ID (or VITE_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log("🌱 Starting Database Seeding...");

  try {
    // 1. Create a Superadmin
    const { data: admin, error: adminErr } = await supabase
      .from('lisahq_admins')
      .insert({ email: 'superadmin@lisahq.com' })
      .select()
      .single();

    if (adminErr && adminErr.code !== '23505') { // 23505 is unique violation, ignore if exists
        console.error("Error creating admin:", adminErr);
    } else {
        console.log("✅ Superadmin ensured: superadmin@lisahq.com");
    }

    // 2. Create Dummy Business
    const { data: business, error: bizErr } = await supabase
      .from('businesses')
      .insert({
        name: 'AutoHaus Müller Dummy',
        industry: 'Automobile',
        twilio_phone_number: '+1234567890' // Dummy twilio number
      })
      .select()
      .single();

    if (bizErr) throw new Error(`Business creation failed: ${bizErr.message}`);
    console.log(`✅ Business created: ${business.name} (${business.id})`);

    // 3. Create Business Facts
    const { error: factsErr } = await supabase
      .from('business_facts')
      .insert({
        business_id: business.id,
        opening_hours: 'Montag bis Freitag: 08:00 - 18:00 Uhr, Samstag: 09:00 - 13:00 Uhr',
        general_info: 'Wir sind eine zertifizierte Vertragswerkstatt für BMW und Audi. Kostenloser Hol- und Bringservice ab 200€ Reparaturwert.',
        ai_prompt_instructions: 'Du bist Lisa, die freundliche KI-Assistentin von AutoHaus Müller. Du duzt die Kunden. Ziel ist es, Werkstatt-Termine zu qualifizieren.'
      });
      
    if (factsErr) throw new Error(`Business facts creation failed: ${factsErr.message}`);
    console.log(`✅ Business facts created`);

    // 4. Create Customers
    const { error: custErr } = await supabase
      .from('customers')
      .insert([
        { business_id: business.id, name: 'Max Mustermann', email: 'max@example.com', phone: '01511234567' },
        { business_id: business.id, name: 'Anna Schmidt', email: 'anna@example.com', phone: '01729876543' }
      ]);
      
    if (custErr) throw new Error(`Customers creation failed: ${custErr.message}`);
    console.log(`✅ Dummy customers created`);

    // 5. Create Leads
    const { error: leadsErr } = await supabase
      .from('leads')
      .insert([
        { 
          business_id: business.id, 
          name: 'Klaus Weber', 
          contact_info: '01601112223', 
          vehicle_model: 'BMW 320d',
          concern: 'Ölwechsel und Inspektion',
          status: 'new'
        },
        { 
          business_id: business.id, 
          name: 'Julia Wagner', 
          contact_info: 'julia.w@test.de', 
          vehicle_model: 'Audi A4',
          concern: 'Bremsen quietschen',
          status: 'in_progress'
        }
      ]);

    if (leadsErr) throw new Error(`Leads creation failed: ${leadsErr.message}`);
    console.log(`✅ Dummy leads created`);

    console.log("\n🎉 Seeding complete!");
    console.log(`\nIMPORTANT: Use this business_id for testing: ${business.id}`);

  } catch (err) {
    console.error("\n❌ Seeding failed:", err);
  }
}

seed();
