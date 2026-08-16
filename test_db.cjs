const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local', 'utf8'));
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

supabase.from('leads').select('*').limit(3).then(r => {
  console.log('Leads:', r.data ? r.data.length : 0);
  console.log('Error:', r.error);
}).catch(console.error);
