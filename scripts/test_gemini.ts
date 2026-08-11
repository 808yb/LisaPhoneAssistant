import { GeminiService } from './server/ai/Gemini';

const businessFacts = {
  dealershipName: 'Test Autohaus',
  scriptObj: {
    core_greeting: ['Hallo, willkommen!'],
    core_ai_disclosure: ['Dies ist ein Test [CORE_DISCLOSURE]'],
    core_farewell: ['Tschüss! [CORE_FAREWELL]'],
    custom_nodes: [{ tag: 'ASK_COLOR', description: 'Ask color', texts: ['Welche Farbe?', 'Was für eine Farbe?'] }]
  },
  guardrailsPrompt: 'Sei nett.'
};

const gemini = new GeminiService('dummy', {});

// Mock the generateContent function
(gemini as any).ai = {
  models: {
    generateContent: async (args: any) => {
      // Simulate that Gemini chose to ask for color
      return {
        text: 'Ich habe das verstanden. [ASK_COLOR]',
        functionCalls: []
      };
    }
  }
};

async function run() {
  const res = await gemini.processInteraction('123', 'Hallo', [], false, false, businessFacts, null, 'b1');
  console.log('--- Output from Gemini ---');
  console.log('Original from mocked model: Ich habe das verstanden. [ASK_COLOR]');
  console.log('Transformed by processInteraction:', res.text);
  
  if (res.text === 'Welche Farbe?') {
    console.log('SUCCESS: Tag [ASK_COLOR] was correctly replaced by the first text variation.');
  } else {
    console.log('ERROR: Tag replacement failed.');
  }
}

run();
