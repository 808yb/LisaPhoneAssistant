import ws from 'ws';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;
import { saveLeadFunctionDeclaration, updateLeadFunctionDeclaration } from './Tools';

export class GeminiLive {
  private ws: ws | null = null;
  
  // Callbacks for Twilio server integration
  public onAudio?: (mulaw8kBase64: string) => void;
  public onTurnComplete?: () => void;
  public onToolCall?: (functionName: string, args: any) => Promise<any>;

  constructor(private apiKey: string, private systemInstruction: string) {
  }

  connect() {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
    this.ws = new ws(url);
    
    this.ws.on('open', () => {
      console.log('Connected to Gemini Live API');
      const setupMsg = {
        setup: {
          model: "models/gemini-live-2.5-flash-preview",
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Aoede"
                }
              }
            }
          },
          systemInstruction: {
            parts: [{ text: this.systemInstruction }]
          },
          tools: [{ functionDeclarations: [saveLeadFunctionDeclaration, updateLeadFunctionDeclaration] }]
        }
      };
      this.ws?.send(JSON.stringify(setupMsg));
    });

    this.ws.on('message', async (data) => {
      // console.log("Gemini Raw Message:", data.toString('utf-8'));
      await this.handleMessage(data);
    });

    this.ws.on('close', (code, reason) => {
      console.log(`Gemini Live WS closed. Code: ${code}, Reason: ${reason.toString()}`);
    });
    this.ws.on('error', (err) => console.error('Gemini Live WS error', err));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Call this when the user barges in or we want to interrupt Gemini's output
  clear() {
    if (!this.ws || this.ws.readyState !== ws.OPEN) return;
    this.ws.send(JSON.stringify({
      clientContent: {
        turnComplete: true
      }
    }));
  }

  // Takes base64 string from Twilio (8kHz mu-law), transcodes, and sends to Gemini
  sendAudio(mulaw8kBase64: string) {
    if (!this.ws || this.ws.readyState !== ws.OPEN) return;
    
    const mulaw8kBuffer = Buffer.from(mulaw8kBase64, 'base64');
    
    try {
      const wav = new WaveFile();
      wav.fromScratch(1, 8000, '8m', mulaw8kBuffer);
      wav.fromMuLaw();
      wav.toSampleRate(16000);
      wav.toBitDepth('16');
      
      const samples16k = wav.data.samples as any;
      const int16Samples = new Int16Array(samples16k.buffer, samples16k.byteOffset, samples16k.byteLength / 2);
      const pcmBuffer = Buffer.from(int16Samples.buffer);

      const msg = {
        realtimeInput: {
          mediaChunks: [{
            mimeType: "audio/pcm;rate=16000",
            data: pcmBuffer.toString('base64')
          }]
        }
      };
      this.ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error('Error transcoding incoming audio', err);
    }
  }

  private async handleMessage(data: ws.RawData) {
    const textData = data.toString('utf-8');
    let msg: any;
    try {
      msg = JSON.parse(textData);
      if (msg.error) {
        console.error("Gemini API Error Message:", msg.error);
      }
    } catch(e) {
      return;
    }

    if (msg.serverContent && msg.serverContent.modelTurn) {
      const parts = msg.serverContent.modelTurn.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
          const pcmBase64 = part.inlineData.data;
          this.handleIncomingAudio(pcmBase64);
        }
        if (part.functionCall) {
          await this.handleToolCall(part.functionCall);
        }
      }
    }

    if (msg.serverContent && msg.serverContent.turnComplete) {
      if (this.onTurnComplete) this.onTurnComplete();
    }
  }

  private handleIncomingAudio(pcmBase64: string) {
    if (!this.onAudio) return;
    try {
      const pcmBuffer = Buffer.from(pcmBase64, 'base64');
      
      // Gemini sends 16kHz PCM. We transcode back to 8kHz mu-law for Twilio
      const wav = new WaveFile();
      // It's 16-bit PCM, so we pass Int16Array
      const int16Samples = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 2);
      wav.fromScratch(1, 16000, '16', int16Samples);
      wav.toSampleRate(8000);
      wav.toMuLaw();
      
      const outSamples = wav.data.samples as any;
      const mulawBuffer = Buffer.from(outSamples.buffer || outSamples);
      
      this.onAudio(mulawBuffer.toString('base64'));
    } catch (err) {
      console.error('Error transcoding outgoing audio', err);
    }
  }

  private async handleToolCall(functionCall: any) {
    if (!this.onToolCall) return;
    
    const response = await this.onToolCall(functionCall.name, functionCall.args);
    
    // Send response back to Gemini Live
    if (this.ws && this.ws.readyState === ws.OPEN) {
      const msg = {
        toolResponse: {
          functionResponses: [{
            name: functionCall.name,
            response: response
          }]
        }
      };
      this.ws.send(JSON.stringify(msg));
    }
  }
}
