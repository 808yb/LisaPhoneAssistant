import { PromptBuilder } from './server/ai/PromptBuilder';

const businessFacts = {
  dealershipName: 'Test Autohaus',
  scriptObj: {
    core_greeting: ['Hallo, willkommen bei Test Autohaus!'],
    core_ai_disclosure: ['Dies ist ein Test [CORE_DISCLOSURE]'],
    core_farewell: ['Tschüss! [CORE_FAREWELL]'],
    custom_nodes: [{ tag: 'ASK_COLOR', description: 'Ask color', texts: ['Welche Farbe?'] }]
  },
  guardrailsPrompt: 'Sei nett.'
};

const sysInstr = PromptBuilder.buildSystemInstruction(businessFacts, '[KUNDENKONTEXT]');
console.log('--- System Instruction ---');
console.log(sysInstr);

console.log('\n--- Test Successful ---');
