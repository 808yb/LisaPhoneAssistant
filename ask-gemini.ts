import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: `I am trying to use the Gemini Multimodal Live API (bidiGenerateContent).
I get "is not found or not supported for bidiGenerateContent" for EVERYTHING.
The models endpoint returns these models:
models/gemini-2.5-flash
models/gemini-2.5-pro
models/gemini-2.0-flash
models/gemini-3.1-pro-preview
models/gemini-3.1-flash-lite
models/gemini-3.5-flash
models/gemini-omni-flash-preview
models/gemini-3.6-flash
...etc.

gemini-2.0-flash-exp DOES NOT EXIST anymore.
Which model from the list above (or another specific name) should I use for Multimodal Live API in 2026? What API version (v1alpha, v1beta, v1)?`
  });
  console.log(response.text);
}
run();
