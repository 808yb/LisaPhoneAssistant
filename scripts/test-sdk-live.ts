import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } });
  
  console.log("Connecting to gemini-2.0-flash on v1alpha without config...");
  try {
    const session = await ai.live.connect({
      model: 'gemini-2.0-flash',
      callbacks: {
        onopen: () => console.log('OPEN'),
        onmessage: (msg: any) => console.log('MSG', JSON.stringify(msg)),
        onclose: (e: any) => console.log('CLOSE', e),
        onerror: (err: any) => console.log('ERROR', err)
      }
    });
    console.log("Session connected:", session);
    
    setTimeout(() => {
      console.log("Disconnecting");
      // @ts-ignore
      session.close();
    }, 5000);
  } catch (err) {
    console.error("Connect failed:", err);
  }
}

run();
