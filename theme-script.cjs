const fs = require('fs');
const files = [
  'src/components/PhoneSimulator.tsx',
  'src/components/CustomerDatabase.tsx',
  'src/components/BusinessFactsSettings.tsx',
  'src/components/CallAnalytics.tsx'
];

const replacements = [
  { from: /bg-\[#141417\]/g, to: 'bg-white' },
  { from: /bg-\[#0E0E10\]/g, to: 'bg-slate-50' },
  { from: /bg-\[#0A0A0C\]/g, to: 'bg-slate-100' },
  { from: /bg-\[#18181B\]/g, to: 'bg-white' },
  
  { from: /border-white\/5/g, to: 'border-slate-200' },
  { from: /border-white\/10/g, to: 'border-slate-200' },
  { from: /border-white\/20/g, to: 'border-slate-300' },
  
  { from: /text-slate-200/g, to: 'text-slate-800' },
  { from: /text-slate-300/g, to: 'text-slate-700' },
  { from: /text-slate-400/g, to: 'text-slate-600' },
  { from: /text-white/g, to: 'text-slate-900' },
  
  { from: /bg-white\/5/g, to: 'bg-slate-100' },
  { from: /bg-white\/10/g, to: 'bg-slate-200' },
  { from: /bg-white\/\[0\.02\]/g, to: 'bg-slate-50' },
  { from: /hover:border-white\/10/g, to: 'hover:border-slate-300' },
  
  { from: /bg-indigo-600\/30/g, to: 'bg-blue-100' },
  { from: /hover:bg-indigo-600\/50/g, to: 'hover:bg-blue-200' },
  { from: /text-indigo-300/g, to: 'text-blue-700' },
  { from: /text-indigo-200/g, to: 'text-blue-800' },
  { from: /text-indigo-100/g, to: 'text-blue-900' },
  { from: /border-indigo-500\/30/g, to: 'border-blue-200' },
  { from: /border-indigo-500\/40/g, to: 'border-blue-300' },
  
  { from: /text-emerald-300/g, to: 'text-emerald-700' },
  { from: /bg-emerald-500\/10/g, to: 'bg-emerald-100' },
  { from: /bg-emerald-500\/20/g, to: 'bg-emerald-100' },
  { from: /hover:bg-emerald-500\/30/g, to: 'hover:bg-emerald-200' },
  { from: /border-emerald-500\/20/g, to: 'border-emerald-200' },
  { from: /border-emerald-500\/30/g, to: 'border-emerald-200' },
  { from: /text-emerald-400/g, to: 'text-emerald-600' },

  { from: /text-red-300/g, to: 'text-red-700' },
  { from: /bg-red-500\/20/g, to: 'bg-red-100' },
  { from: /hover:bg-red-500\/30/g, to: 'hover:bg-red-200' },
  { from: /border-red-500\/30/g, to: 'border-red-200' },
  { from: /border-red-500\/40/g, to: 'border-red-300' },

  { from: /bg-sky-500\/10/g, to: 'bg-sky-100' },
  { from: /text-sky-300/g, to: 'text-sky-700' },
  { from: /border-sky-500\/20/g, to: 'border-sky-200' },

  { from: /bg-indigo-500\/10/g, to: 'bg-blue-100' },
  { from: /bg-indigo-500\/20/g, to: 'bg-blue-100' },
  { from: /text-indigo-400/g, to: 'text-blue-600' },
  { from: /text-amber-400/g, to: 'text-amber-600' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(r => {
    content = content.replace(r.from, r.to);
  });
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
