import React, { useState } from 'react';
import {
  ClipboardList, Search, Filter, Phone, CheckCircle, Clock, AlertTriangle,
  User, Wrench, Car, ShoppingBag, Key, ChevronRight, MessageSquare, Trash2,
  Calendar, CheckCircle2, UserCheck, Tag, Sparkles
} from 'lucide-react';
import { Lead, LeadCategory, LeadStatus, LeadUrgency } from '../types';

interface LeadDashboardProps {
  leads: Lead[];
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onDeleteLead: (leadId: string) => void;
  onStartCallWithLead: (phoneNumber: string, name: string) => void;
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({
  leads,
  onUpdateLead,
  onDeleteLead,
  onStartCallWithLead
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLeadModal, setActiveLeadModal] = useState<Lead | null>(null);

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    if (selectedCategory !== 'all' && lead.category !== selectedCategory) return false;
    if (selectedUrgency !== 'all' && lead.urgency !== selectedUrgency) return false;
    if (selectedStatus !== 'all' && lead.status !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.callerName.toLowerCase().includes(q);
      const matchPhone = lead.phoneNumber.includes(q);
      const matchConcern = lead.concern.toLowerCase().includes(q);
      const matchVehicle = lead.vehicleInfo?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchConcern && !matchVehicle) return false;
    }
    return true;
  });

  // Category Icon helper
  const getCategoryBadge = (category: LeadCategory) => {
    switch (category) {
      case 'workshop':
        return <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold tracking-wide uppercase">Werkstatt</span>;
      case 'sales':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold tracking-wide uppercase">Vertrieb</span>;
      case 'test_drive':
        return <span className="px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold tracking-wide uppercase">Probefahrt</span>;
      case 'spare_parts':
        return <span className="px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[10px] font-bold tracking-wide uppercase">Teile</span>;
      case 'rental':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold tracking-wide uppercase">Mietwagen</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold tracking-wide uppercase">Sonstiges</span>;
    }
  };

  // Urgency badge helper
  const getUrgencyBadge = (urgency: LeadUrgency) => {
    switch (urgency) {
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wide uppercase animate-pulse">Dringend</span>;
      case 'normal':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wide uppercase">Normal</span>;
      case 'low':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold tracking-wide uppercase">Niedrig</span>;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wide uppercase">Neu</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wide uppercase">In Bearbeitung</span>;
      case 'callback_scheduled':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold tracking-wide uppercase">Rückruf</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold tracking-wide uppercase">Abgeschlossen</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Lead Tickets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Eingehende Anfragen werden automatisch nach Abteilung und Dringlichkeit kategorisiert
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 px-5 rounded-lg text-center flex flex-col items-center shadow-sm">
            <span className="text-xl font-bold text-emerald-500 leading-none">
              {leads.filter(l => l.status === 'new' || l.status === 'in_progress').length}
            </span>
            <span className="text-[10px] text-emerald-600 uppercase tracking-widest font-bold mt-1">Offen</span>
          </div>
          <div className="bg-red-50 border border-red-200 p-2.5 px-5 rounded-lg text-center flex flex-col items-center shadow-sm">
            <span className="text-xl font-bold text-red-500 leading-none">
              {leads.filter(l => l.urgency === 'high').length}
            </span>
            <span className="text-[10px] text-red-600 uppercase tracking-widest font-bold mt-1">Dringend</span>
          </div>
          <div className="bg-blue-600 border border-blue-600 p-2.5 px-5 rounded-lg text-center flex flex-col items-center shadow-sm">
            <span className="text-xl font-bold text-white leading-none">{leads.length}</span>
            <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold mt-1">Gesamt</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, Telefon oder Anfrage suchen ..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
          >
            <option value="all">Alle Abteilungen</option>
            <option value="workshop">Werkstatt / Inspektion</option>
            <option value="sales">Verkauf / Fahrzeuge</option>
            <option value="test_drive">Probefahrt</option>
            <option value="spare_parts">Ersatzteile & Reifen</option>
            <option value="rental">Mietwagen</option>
            <option value="general">Sonstiges</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
          >
            <option value="all">Alle Dringlichkeiten</option>
            <option value="high">HOCH (Dringend)</option>
            <option value="normal">Normal</option>
            <option value="low">Niedrig</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
          >
            <option value="all">Alle Status</option>
            <option value="new">NEU (Unbearbeitet)</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="callback_scheduled">Rückruf geplant</option>
            <option value="completed">Abgeschlossen</option>
          </select>

        </div>
      </div>

      {/* Lead Cards List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 text-slate-500 shadow-sm">
            <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700 text-sm">Keine Leads gefunden</p>
            <p className="text-xs text-slate-500">
              Versuchen Sie die Filter anzupassen oder simulieren Sie einen neuen Anruf im Telefon-Simulator.
            </p>
          </div>
        ) : (
          filteredLeads.map(lead => (
            <div
              key={lead.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                lead.urgency === 'high' ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Left info block */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(lead.status)}
                    {getCategoryBadge(lead.category)}
                    {getUrgencyBadge(lead.urgency)}
                    <span className="text-[11px] text-slate-400 font-mono ml-1">
                      {new Date(lead.createdAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} Uhr
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
                      <span>{lead.callerName}</span>
                      <span className="text-slate-500 text-xs font-mono font-normal">({lead.phoneNumber})</span>
                    </h3>
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {lead.concern}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    {lead.vehicleInfo && (
                      <span className="flex items-center space-x-1.5">
                        <Car className="w-3.5 h-3.5 text-blue-500" />
                        <span>{lead.vehicleInfo}</span>
                      </span>
                    )}

                    {lead.preferredCallbackTime && (
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lead.preferredCallbackTime}</span>
                      </span>
                    )}

                    {lead.assignedStaff && (
                      <span className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{lead.assignedStaff}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-col sm:flex-row md:flex-row items-center gap-3 shrink-0 mt-4 md:mt-0">
                  
                  <button
                    onClick={() => onStartCallWithLead(lead.phoneNumber, lead.callerName)}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none"
                    title="Anrufen"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveLeadModal(lead)}
                    className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors border border-slate-200 focus:outline-none"
                    title="Details"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {/* Status quick switcher */}
                  <select
                    value={lead.status}
                    onChange={(e) => onUpdateLead(lead.id, { status: e.target.value as LeadStatus })}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 text-[11px] font-semibold focus:outline-none focus:border-blue-400 min-w-[140px]"
                  >
                    <option value="new">NEU</option>
                    <option value="in_progress">IN BEARBEITUNG</option>
                    <option value="callback_scheduled">RÜCKRUF GEPLANT</option>
                    <option value="completed">ABGESCHLOSSEN</option>
                  </select>

                  <button
                    onClick={() => onDeleteLead(lead.id)}
                    className="p-1.5 text-slate-600 hover:text-red-600 transition-colors focus:outline-none"
                    title="Ticket löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Lead Ticket Details Modal */}
      {activeLeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-5 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-blue-600 font-bold">Ticket #{activeLeadModal.id}</span>
                  {getStatusBadge(activeLeadModal.status)}
                </div>
                <h3 className="text-base font-semibold text-slate-800 mt-1">{activeLeadModal.callerName}</h3>
                <p className="text-xs font-mono text-slate-500">{activeLeadModal.phoneNumber}</p>
              </div>

              <button
                onClick={() => setActiveLeadModal(null)}
                className="text-slate-600 hover:text-slate-900 text-xs font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
              >
                Schließen
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Abteilung & Dringlichkeit</span>
                <div className="flex items-center space-x-2 mt-1">
                  {getCategoryBadge(activeLeadModal.category)}
                  {getUrgencyBadge(activeLeadModal.urgency)}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Fahrzeug & Wunschzeit</span>
                <p className="text-slate-700 font-medium">Fahrzeug: {activeLeadModal.vehicleInfo || 'Keine Angabe'}</p>
                <p className="text-amber-600 font-medium">Rückruf: {activeLeadModal.preferredCallbackTime || 'Schnellstmöglich'}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">Qualifiziertes Anliegen:</span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
                {activeLeadModal.concern}
              </div>
            </div>

            {/* Conversation Transcript Log */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Gesprächsprotokoll der KI:</span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 max-h-56 overflow-y-auto">
                {activeLeadModal.transcript && activeLeadModal.transcript.length > 0 ? (
                  activeLeadModal.transcript.map((t, idx) => (
                    <div key={idx} className="text-xs space-y-0.5">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span className="font-bold text-blue-600">{t.sender === 'assistant' ? 'Lisa (KI)' : 'Anrufer'}</span>
                        <span>{t.timestamp}</span>
                      </div>
                      <p className="text-slate-700 pl-2 border-l-2 border-slate-200">{t.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Kein Einzeltranskript vorhanden.</p>
                )}
              </div>
            </div>

            {/* Notes edit */}
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-1">Interne Mitarbeiter-Notiz:</span>
              <textarea
                rows={2}
                value={activeLeadModal.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveLeadModal({ ...activeLeadModal, notes: val });
                  onUpdateLead(activeLeadModal.id, { notes: val });
                }}
                placeholder="Notiz für den Rückrufer eingeben..."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              />
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
