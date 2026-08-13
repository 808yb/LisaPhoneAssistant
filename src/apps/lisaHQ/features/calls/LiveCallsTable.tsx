import React from 'react';
import { Phone, Search, Filter, Headphones } from 'lucide-react';

export const LiveCallsTable: React.FC = () => {
  const calls = [
    { business: 'Unternehmen A', customer: 'Herr Müller', duration: '01:21', intent: 'Beratung', confidence: '98%', status: 'Im Gespräch', statusColor: 'text-emerald-600 bg-emerald-50' },
    { business: 'Dental Müller', customer: 'Frau Schmidt', duration: '00:45', intent: 'Neuer Termin', confidence: '92%', status: 'Im Gespräch', statusColor: 'text-emerald-600 bg-emerald-50' },
    { business: 'Klinik B', customer: 'Unbekannt', duration: '04:12', intent: 'Beschwerde', confidence: '65%', status: 'Wird weitergeleitet', statusColor: 'text-amber-600 bg-amber-50' },
    { business: 'Unternehmen A', customer: 'Alex D.', duration: '02:30', intent: 'Öffnungszeiten', confidence: '99%', status: 'Abschluss', statusColor: 'text-blue-600 bg-blue-50' }
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Live-Anrufe</h1>
          <p className="text-sm text-slate-500 mt-1">Überwachen Sie aktive Gespräche in Ihrem gesamten Netzwerk.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span>4 Aktive Anrufe</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Suchen nach Unternehmen oder Anliegen..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 text-sm text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            <span>Filtern</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Unternehmen</th>
                <th className="px-6 py-4 font-semibold">Kunde</th>
                <th className="px-6 py-4 font-semibold">Dauer</th>
                <th className="px-6 py-4 font-semibold">Anliegen</th>
                <th className="px-6 py-4 font-semibold">Konfidenz</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calls.map((call, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-800">{call.business}</td>
                  <td className="px-6 py-4 text-slate-600">{call.customer}</td>
                  <td className="px-6 py-4 font-mono text-slate-600">{call.duration}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-medium">
                      {call.intent}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${parseInt(call.confidence) > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: call.confidence }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-slate-600">{call.confidence}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${call.statusColor}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end space-x-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1 rounded-full">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Beitreten</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
