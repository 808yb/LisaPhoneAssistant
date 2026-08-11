import React, { useState, useEffect } from 'react';
import { Building2, Search, Filter, MoreVertical, ExternalLink } from 'lucide-react';
import { supabase } from '../../../../core/supabaseClient';

export const BusinessesTable: React.FC = () => {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const res = await fetch('/api/admin/businesses', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Map DB data and inject dummy data for metrics
          const mapped = data.map((b: any) => ({
            id: b.id,
            name: b.name,
            status: 'Online', 
            statusColor: 'text-emerald-600 bg-emerald-50', 
            plan: 'Professional', 
            calls: Math.floor(Math.random() * 50), 
            appointments: Math.floor(Math.random() * 10), 
            knowledge: '96%', 
            lastActive: 'Gerade eben'
          }));
          setBusinesses(mapped);
        }
      } catch (err) {
        console.error('Failed to load businesses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Lade Unternehmen...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Unternehmen</h1>
          <p className="text-sm text-slate-500 mt-1">Verwalten Sie Ihre Kunden und deren Lisa-Instanzen.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
          <Building2 className="w-4 h-4" />
          <span>Unternehmen Hinzufügen</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Unternehmen suchen..." 
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
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 font-semibold">Anrufe Heute</th>
                <th className="px-6 py-4 font-semibold">Termine</th>
                <th className="px-6 py-4 font-semibold">Wissen</th>
                <th className="px-6 py-4 font-semibold">Zuletzt Aktiv</th>
                <th className="px-6 py-4 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map((biz, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-800">{biz.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${biz.statusColor}`}>
                      {biz.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{biz.plan}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{biz.calls}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{biz.appointments}</td>
                  <td className="px-6 py-4 text-slate-600">{biz.knowledge}</td>
                  <td className="px-6 py-4 text-slate-500">{biz.lastActive}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end space-x-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Öffnen</span>
                      <ExternalLink className="w-3 h-3" />
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
