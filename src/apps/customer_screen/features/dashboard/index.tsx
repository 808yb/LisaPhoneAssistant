import React from 'react';
import { Lead } from '../../../../core/types';
import { useDashboard } from './useDashboard';
import { LeadHeader } from './LeadHeader';
import { LeadFilters } from './LeadFilters';
import { LeadList } from './LeadList';
import { LeadModal } from './LeadModal';

export interface DashboardProps {
  leads: Lead[];
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onDeleteLead: (leadId: string) => void;
  onStartCallWithLead: (phoneNumber: string, name: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  leads,
  onUpdateLead,
  onDeleteLead,
  onStartCallWithLead
}) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedUrgency,
    setSelectedUrgency,
    selectedStatus,
    setSelectedStatus,
    activeLeadModal,
    setActiveLeadModal,
    filteredLeads
  } = useDashboard(leads);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <LeadHeader leads={leads} />

      <LeadFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedUrgency={selectedUrgency}
        setSelectedUrgency={setSelectedUrgency}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      <LeadList
        leads={filteredLeads}
        onUpdateLead={onUpdateLead}
        onDeleteLead={onDeleteLead}
        onStartCallWithLead={onStartCallWithLead}
        onViewLeadDetails={setActiveLeadModal}
      />

      {activeLeadModal && (
        <LeadModal
          lead={activeLeadModal}
          onClose={() => setActiveLeadModal(null)}
          onUpdateLead={(leadId, updates) => {
            setActiveLeadModal({ ...activeLeadModal, ...updates });
            onUpdateLead(leadId, updates);
          }}
        />
      )}

    </div>
  );
};
