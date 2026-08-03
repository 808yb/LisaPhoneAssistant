import React from 'react';
import { Building2, PhoneCall, Calendar, Euro, Percent, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const kpis = [
    { label: 'Unternehmen', value: '34', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lisa Online', value: '34 / 34', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Aktive Anrufe', value: '7', icon: PhoneCall, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Anrufe Heute', value: '612', icon: PhoneCall, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Gebuchte Termine', value: '189', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'MRR', value: '€7,240', icon: Euro, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Monatl. Churn', value: '0', icon: Percent, color: 'text-slate-600', bg: 'bg-slate-50' },
    { label: 'Ø KI-Latenz', value: '620 ms', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' }
  ];

  const activities = [
    { business: 'BMW Kaiser', action: 'Termin gebucht', time: 'Gerade eben' },
    { business: 'Dental Müller', action: 'Wissensdatenbank aktualisiert', time: 'Vor 5 Min.' },
    { business: 'Hotel Adler', action: 'Lisa neu gestartet', time: 'Vor 12 Min.' },
    { business: 'Autohaus Fischer', action: 'Neuer Kunde aufgenommen', time: 'Vor 1 Std.' }
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Agentur-Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Plattform-Übersicht und Echtzeit-Metriken.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${kpi.bg}`}>
                <Icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</div>
                <div className="text-2xl font-bold text-slate-800">{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Letzte Aktivitäten</h2>
        <div className="space-y-4">
          {activities.map((act, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex flex-col">
                <span className="font-semibold text-slate-700">{act.business}</span>
                <span className="text-sm text-slate-500">{act.action}</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
