import React from 'react';
import { ClipboardList, Phone, MessageSquare, Trash2, Car, Clock, UserCheck } from 'lucide-react';
import { Lead, LeadStatus } from '../../../../core/types';
import { getStatusBadge, getCategoryBadge, getUrgencyBadge } from './dashboard.utils';

interface LeadListProps {
  leads: Lead[];
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onDeleteLead: (leadId: string) => void;
  onStartCallWithLead: (phoneNumber: string, name: string) => void;
  onViewLeadDetails: (lead: Lead) => void;
}

export const LeadList: React.FC<LeadListProps> = ({
  leads,
  onUpdateLead,
  onDeleteLead,
  onStartCallWithLead,
  onViewLeadDetails
}) => {
  if (leads.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 text-slate-500 shadow-sm">
        <ClipboardList className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="font-medium text-slate-700 text-sm">Keine Anrufe gefunden</p>
        <p className="text-xs text-slate-500">
          Versuchen Sie die Filter anzupassen oder simulieren Sie einen neuen Anruf im Telefon-Simulator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map(lead => (
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
                onClick={() => onViewLeadDetails(lead)}
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
                title="Eintrag löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  );
};
