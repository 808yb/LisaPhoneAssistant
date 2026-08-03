import React from 'react';
import { PhoneCall, Calendar, PhoneMissed, Users, Percent, Euro } from 'lucide-react';

export const MetricsGrid: React.FC = () => {
  const metrics = [
    { label: 'Anrufe heute', value: '42', icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Termine gebucht', value: '12', icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Verpasste Anrufe', value: '3', icon: PhoneMissed, color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Neukunden', value: '8', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'KI-Annahmequote', value: '98.5%', icon: Percent, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Umsatz (geschätzt)', value: '€4.250', icon: Euro, color: 'text-blue-500', bg: 'bg-blue-50' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">{m.label}</span>
            <div className={`p-1.5 rounded-lg ${m.bg}`}>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
          </div>
          <span className="text-2xl font-bold text-slate-800">{m.value}</span>
        </div>
      ))}
    </div>
  );
};
