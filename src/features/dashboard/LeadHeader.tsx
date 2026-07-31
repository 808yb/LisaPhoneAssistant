import React from 'react';
import { Lead } from '../../core/types';

interface LeadHeaderProps {
  leads: Lead[];
}

export const LeadHeader: React.FC<LeadHeaderProps> = ({ leads }) => {
  return (
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
  );
};
