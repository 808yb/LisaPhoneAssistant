import React from 'react';
import { Lead } from '../../core/types';
import { getStatusBadge, getCategoryBadge, getUrgencyBadge } from './dashboard.utils';

interface LeadModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose, onUpdateLead }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-5 my-8">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-blue-600 font-bold">Ticket #{lead.id}</span>
              {getStatusBadge(lead.status)}
            </div>
            <h3 className="text-base font-semibold text-slate-800 mt-1">{lead.callerName}</h3>
            <p className="text-xs font-mono text-slate-500">{lead.phoneNumber}</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 text-xs font-medium bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            Schließen
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Abteilung & Dringlichkeit</span>
            <div className="flex items-center space-x-2 mt-1">
              {getCategoryBadge(lead.category)}
              {getUrgencyBadge(lead.urgency)}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">Fahrzeug & Wunschzeit</span>
            <p className="text-slate-700 font-medium">Fahrzeug: {lead.vehicleInfo || 'Keine Angabe'}</p>
            <p className="text-amber-600 font-medium">Rückruf: {lead.preferredCallbackTime || 'Schnellstmöglich'}</p>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">Qualifiziertes Anliegen:</span>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-700">
            {lead.concern}
          </div>
        </div>

        {/* Conversation Transcript Log */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-2">Gesprächsprotokoll der KI:</span>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 max-h-56 overflow-y-auto">
            {lead.transcript && lead.transcript.length > 0 ? (
              lead.transcript.map((t, idx) => (
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
            value={lead.notes || ''}
            onChange={(e) => {
              const val = e.target.value;
              onUpdateLead(lead.id, { notes: val });
            }}
            placeholder="Notiz für den Rückrufer eingeben..."
            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

      </div>
    </div>
  );
};
