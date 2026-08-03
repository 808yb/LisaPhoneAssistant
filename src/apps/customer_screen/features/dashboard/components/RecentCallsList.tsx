import React from 'react';
import { Phone, PhoneIncoming, PhoneMissed } from 'lucide-react';

export const RecentCallsList: React.FC = () => {
  const calls = [
    { time: '10:45', caller: '0151 2345678', type: 'incoming', reason: 'Terminvereinbarung' },
    { time: '10:30', caller: '0172 9876543', type: 'missed', reason: 'Unbekannt' },
    { time: '09:15', caller: '0176 1122334', type: 'incoming', reason: 'Rückfrage Reparatur' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Letzte Anrufe</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {calls.map((call, i) => (
          <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${call.type === 'missed' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {call.type === 'missed' ? <PhoneMissed className="w-4 h-4" /> : <PhoneIncoming className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{call.caller}</p>
                <p className="text-xs text-slate-500">{call.reason}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-500">{call.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
