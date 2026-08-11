import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

globalThis.WebSocket = ws as any;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_PROJECT_ID 
  ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` 
  : process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function test() {
  const { data: admin, error } = await supabase.from('lisahq_admins').select('id').eq('email', 'demo@autohaus.de').single();
  console.log("Admin single:", admin, error);
}
test();
