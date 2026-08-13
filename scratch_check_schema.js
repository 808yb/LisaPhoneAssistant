import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'e:/AgenturBuchbar/GeminiAutoHaus/.env.local' });

const supabase = createClient(
  'https://' + process.env.SUPABASE_PROJECT_ID + '.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('appointments').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log('SUCCESS, table exists and is queryable!');
  }
}
check();
