import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/AgenturBuchbar/GeminiAutoHaus/.env.local' });

const supabase = createClient(
  'https://' + process.env.SUPABASE_PROJECT_ID + '.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('appointments').select('*').order('created_at', {ascending: false}).limit(3);
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}
check();
