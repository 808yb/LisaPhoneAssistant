import React from 'react';
import { Bell, AlertCircle, AlertTriangle } from 'lucide-react';

export const NotificationsPanel: React.FC = () => {
  const notifications = [
    { type: 'callback', message: 'Rückruf erforderlich: 0172 9876543', urgency: 'high', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
    { type: 'low-confidence', message: 'KI war sich unsicher bei Terminbuchung (Herr Weber)', urgency: 'medium', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { type: 'info', message: 'Neues FAQ-Thema vorgeschlagen: "Elektroauto-Service"', urgency: 'low', icon: Bell, color: 'text-blue-500', bg: 'bg-blue-50' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Benachrichtigungen</h3>
        <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">2 Aktionen Erforderlich</span>
      </div>
      <div className="divide-y divide-slate-100">
        {notifications.map((notif, i) => (
          <div key={i} className="p-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors">
            <div className={`p-2 rounded-lg ${notif.bg} shrink-0`}>
              <notif.icon className={`w-4 h-4 ${notif.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 leading-snug">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
