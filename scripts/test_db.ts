import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import ws from 'ws';

globalThis.WebSocket = ws as any;
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_PROJECT_ID 
  ? `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co` 
  : process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function test() {
  const { data: users, error: err1 } = await supabase.from('business_users').select('*');
  console.log("Business Users:", users, err1);

  const { data: auth, error: err2 } = await supabase.auth.admin.listUsers();
  console.log("Auth Users:", auth.users.map(u => ({ email: u.email, id: u.id })), err2);
}
test();
