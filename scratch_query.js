import dotenv from 'dotenv';
dotenv.config({ path: 'e:/AgenturBuchbar/GeminiAutoHaus/.env.local' });

async function check() {
  const url = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co/rest/v1/resources?select=id,name,status`;
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
check();
