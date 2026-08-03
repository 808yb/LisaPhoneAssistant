import React from 'react';
import { Clock, User } from 'lucide-react';

export const AppointmentsList: React.FC = () => {
  const appointments = [
    { time: '09:00', customer: 'Müller', service: 'Inspektion', status: 'confirmed' },
    { time: '11:30', customer: 'Schmidt', service: 'Reifenwechsel', status: 'confirmed' },
    { time: '14:00', customer: 'Weber', service: 'Ölwechsel', status: 'pending' },
    { time: '15:45', customer: 'Wagner', service: 'Beratung', status: 'confirmed' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-800">Heutige Termine</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {appointments.map((apt, i) => (
          <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{apt.customer}</p>
                <p className="text-xs text-slate-500">{apt.service}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{apt.time}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {apt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
