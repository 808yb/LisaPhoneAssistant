import { GoogleGenAI } from "@google/genai";
import fs from "fs";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function testAudio() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-native-audio-latest",
      contents: "Say 'Hello world' in a warm voice. Output AUDIO only.",
      config: {
        responseModalities: ["AUDIO"],
      } as any
    });
    console.log("Response parts:", JSON.stringify(response.candidates?.[0]?.content?.parts, null, 2));
    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (audioPart) {
        fs.writeFileSync("output.mp3", Buffer.from(audioPart.inlineData.data, "base64"));
        console.log("Saved output.mp3");
    }
  } catch (e) {
    console.error("Error:", e);
  }
}
testAudio();
