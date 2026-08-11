import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import ws from 'ws';

// Polyfill WebSocket for Node < 22
globalThis.WebSocket = ws as any;

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const supabaseUrl = process.env.SUPABASE_PROJECT_ID 
  ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` 
  : process.env.VITE_SUPABASE_URL;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_PROJECT_ID or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function ensureUser(email: string) {
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  
  const existing = users.users.find(u => u.email === email);
  if (existing) {
    console.log(`User ${email} already exists: ${existing.id}`);
    
    // Update password just to be sure
    await supabase.auth.admin.updateUserById(existing.id, { password: 'demo123' });
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'demo123',
    email_confirm: true
  });
  
  if (error) throw error;
  console.log(`Created user ${email}: ${data.user.id}`);
  return data.user;
}

async function seed() {
  console.log("🌱 Seeding Auth Users and distinct Businesses...");

  try {
    // 1. Ensure Auth Users
    const adminUser = await ensureUser('admin@lisahq.com');
    const autoHausUser = await ensureUser('demo@autohaus.de');
    const friseurUser = await ensureUser('demo@friseur.de');

    // 2. Link Admin
    const { error: adminErr } = await supabase
      .from('lisahq_admins')
      .upsert({ email: 'admin@lisahq.com' }, { onConflict: 'email' });
    if (adminErr) console.error("Admin link error (can be ignored if unique):", adminErr.message);

    // 3. Create Businesses
    const { data: b1 } = await supabase
      .from('businesses')
      .insert({ name: 'AutoHaus Müller Dummy', industry: 'Automobile', twilio_phone_number: '+1234567890' })
      .select().single();
      
    const { data: b2 } = await supabase
      .from('businesses')
      .insert({ name: 'Friseur Salon Lisa', industry: 'Beauty', twilio_phone_number: '+0987654321' })
      .select().single();

    if (!b1 || !b2) throw new Error("Failed to create businesses");
    
    // 4. Link Users to Businesses
    await supabase.from('business_users').upsert({ user_id: autoHausUser.id, business_id: b1.id, role: 'owner' });
    await supabase.from('business_users').upsert({ user_id: friseurUser.id, business_id: b2.id, role: 'owner' });

    // 5. Create Facts
    await supabase.from('business_facts').insert([
      { business_id: b1.id, ai_prompt_instructions: '{"[SCRIPT_GREETING]": ["Hallo bei Autohaus Müller!"]}' },
      { business_id: b2.id, ai_prompt_instructions: '{"[SCRIPT_GREETING]": ["Willkommen beim Friseursalon Lisa!"]}' }
    ]);

    // 6. Create Customers
    await supabase.from('customers').insert([
      { business_id: b1.id, name: 'Max Mustermann (Auto)', email: 'max@auto.de', phone: '01511234567' },
      { business_id: b2.id, name: 'Sabine (Friseur)', email: 'sabine@hair.de', phone: '01729876543' }
    ]);

    // 7. Create Leads
    await supabase.from('leads').insert([
      { business_id: b1.id, name: 'Klaus Weber', concern: 'Ölwechsel und Inspektion', vehicle_model: 'BMW 320d', status: 'new' },
      { business_id: b2.id, name: 'Julia Wagner', concern: 'Dauerwelle Termin', vehicle_model: '', status: 'in_progress' }
    ]);

    console.log("✅ Seeding completed! Data is safely segregated.");
  } catch (e) {
    console.error("❌ Seeding failed:", e);
  }
}

seed();
