import { GeminiLive } from './server/ai/GeminiLive';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("No API key");
  process.exit(1);
}

const live = new GeminiLive(apiKey, "You are a helpful assistant.", "models/gemini-3.1-pro-preview");
live.onAudio = () => console.log("Received audio");
live.connect();

setTimeout(() => {
  live.disconnect();
  console.log("Test finished");
}, 5000);
