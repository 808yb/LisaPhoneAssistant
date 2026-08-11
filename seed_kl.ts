import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

// @ts-ignore
global.WebSocket = ws;

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_PROJECT_ID ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` : process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("🚗 Updating Autohaus to Kaiserslautern...");
  
  // 1. Get the user demo@autohaus.de
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;
  
  const user = users.users.find(u => u.email === 'demo@autohaus.de');
  if (!user) {
    console.error("Could not find demo@autohaus.de");
    return;
  }

  // 2. Get their business_id
  const { data: bizUser, error: bUserErr } = await supabase
    .from('business_users')
    .select('business_id')
    .eq('user_id', user.id)
    .single();
    
  if (bUserErr || !bizUser) {
    console.error("Could not find business link for user", bUserErr);
    return;
  }
  
  const businessId = bizUser.business_id;
  
  // 3. Update the business
  const { error: updErr } = await supabase
    .from('businesses')
    .update({ 
      name: 'Autohaus Kaiserslautern',
      twilio_phone_number: '+16086556067'
    })
    .eq('id', businessId);
    
  if (updErr) throw updErr;
  console.log("✅ Business updated to Autohaus Kaiserslautern with Twilio number +16086556067");

  // 4. Update the AI Prompt in business_facts
  const { error: factsErr } = await supabase
    .from('business_facts')
    .update({ 
      ai_prompt_instructions: '{"[SCRIPT_GREETING]": ["Hallo, willkommen bei Autohaus Kaiserslautern! Wie kann ich Ihnen heute helfen?"]}'
    })
    .eq('business_id', businessId);
    
  if (factsErr) console.error("Error updating facts (might not exist yet, ignoring):", factsErr);

  // 5. Add some fresh dummy customers
  const customers = [
    { business_id: businessId, name: 'Hans Meier', email: 'hans@gmx.de', phone: '015199887766' },
    { business_id: businessId, name: 'Petra Schmidt', email: 'petra.s@gmail.com', phone: '017255443322' },
    { business_id: businessId, name: 'Dirk Wagner', email: 'dirk.wagner@t-online.de', phone: '016011223344' }
  ];
  
  await supabase.from('customers').insert(customers);
  console.log("✅ Dummy customers added");

  // 6. Add some leads
  const leads = [
    { business_id: businessId, name: 'Stefanie Klein', phone: '015733445566', concern: 'Klimaanlage defekt, kühlt nicht mehr', vehicle_model: 'Mercedes C-Klasse', status: 'new', priority: 'high' },
    { business_id: businessId, name: 'Markus Bauer', phone: '017344556677', concern: 'Termin für TÜV und HU', vehicle_model: 'Ford Focus', status: 'new', priority: 'medium' }
  ];
  
  await supabase.from('leads').insert(leads);
  console.log("✅ Dummy leads added");
  
  console.log("🎉 Done!");
}

run().catch(console.error);
