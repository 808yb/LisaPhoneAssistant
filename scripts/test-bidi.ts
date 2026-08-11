import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const aiAlpha = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });
  const aiBeta = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1beta' } });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1alpha/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await res.json();
  const allModels = data.models.map((m: any) => m.name.replace('models/', ''));

  for (const model of allModels) {
    if (!model.includes('gemini')) continue;
    
    for (const ai of [aiAlpha, aiBeta]) {
      const version = ai === aiAlpha ? 'v1alpha' : 'v1beta';
      console.log(`Testing ${model} on ${version}...`);
      
      let receivedMsg = false;
      let closed = false;
      const testPromise = new Promise((resolve) => {
        let session: any = null;
        ai.live.connect({
          model: model,
          config: { responseModalities: ['AUDIO'], systemInstruction: { parts: [{ text: "Hello" }] } },
          callbacks: {
            onmessage: (msg: any) => { 
              if (msg.setupComplete) {
                receivedMsg = true;
                resolve(true);
              }
            },
            onclose: (e: any) => { 
              closed = true;
              resolve(false); 
            },
            onerror: () => { resolve(false); }
          }
        }).then(s => { session = s; }).catch(() => resolve(false));
        
        setTimeout(() => {
          if (!closed && !receivedMsg) resolve(false);
          if (session) session.close();
        }, 3000);
      });
      
      const success = await testPromise;
      if (success) {
        console.log(`SUCCESS! Model ${model} on API version ${version} supports bidiGenerateContent!`);
        process.exit(0);
      }
    }
  }
}
run();
