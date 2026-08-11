import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  const bidiModels = data.models.filter((m: any) => 
    m.supportedGenerationMethods && m.supportedGenerationMethods.includes('bidiGenerateContent')
  );
  console.log("Bidi Models on v1beta:", bidiModels.map((m: any) => m.name));
}
run().catch(console.error);
