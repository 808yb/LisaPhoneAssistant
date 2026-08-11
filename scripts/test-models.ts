import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function listModels() {
  const response = await ai.models.list();
  for await (const model of response) {
    if (model.name.includes("flash")) {
        console.log(model.name);
    }
  }
}
listModels();
