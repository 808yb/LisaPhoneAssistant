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
            name: b.business_facts?.metadata?.businessName || b.name,
            phone: b.business_facts?.metadata?.phone || '',
            email: b.business_facts?.metadata?.email || '',
            twilioNumber: b.business_facts?.metadata?.twilioNumber || '',
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

  const [editingBiz, setEditingBiz] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBiz) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/businesses/${editingBiz.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingBiz.name,
          phone: editingBiz.phone,
          email: editingBiz.email,
          twilioNumber: editingBiz.twilioNumber
        })
      });
      if (res.ok) {
        setBusinesses(prev => prev.map(b => b.id === editingBiz.id ? { ...b, ...editingBiz } : b));
        setEditingBiz(null);
      } else {
        alert("Fehler beim Speichern");
      }
    } catch (err) {
      console.error(err);
      alert("Netzwerkfehler");
    }
  };

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
                    <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingBiz(biz)}
                        className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center space-x-1"
                      >
                        <span>Bearbeiten</span>
                      </button>
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center space-x-1">
                        <span>Öffnen</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingBiz && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Unternehmen bearbeiten</h2>
              <button onClick={() => setEditingBiz(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Unternehmensname</label>
                <input
                  type="text"
                  required
                  value={editingBiz.name}
                  onChange={e => setEditingBiz({...editingBiz, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefonnummer</label>
                <input
                  type="text"
                  value={editingBiz.phone || ''}
                  onChange={e => setEditingBiz({...editingBiz, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="+49 123 456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail Adresse</label>
                <input
                  type="email"
                  value={editingBiz.email || ''}
                  onChange={e => setEditingBiz({...editingBiz, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="kontakt@firma.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Twilio-Nummer (Lisa-Nummer)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">📞</span>
                  <input
                    type="text"
                    value={editingBiz.twilioNumber || ''}
                    onChange={e => setEditingBiz({...editingBiz, twilioNumber: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                    placeholder="+49 157 12345678"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Diese Nummer sieht der Kunde in seinem Dashboard nicht. Nur für internes Routing.</p>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingBiz(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
