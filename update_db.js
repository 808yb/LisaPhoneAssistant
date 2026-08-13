import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';
globalThis.WebSocket = ws;
dotenv.config({ path: '.env.local' });

const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function update() {
  const { error } = await supabase.from('business_facts').update({ scripts: null }).eq('id', 1);
  if (error) console.error('Error updating:', error);
  else console.log('Successfully wiped scripts, dashboard will use new defaults!');
}
update();
