import { useState, useMemo } from 'react';
import { Lead } from '../../core/types';

export const useDashboard = (leads: Lead[]) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLeadModal, setActiveLeadModal] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
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
  }, [leads, selectedCategory, selectedUrgency, selectedStatus, searchQuery]);

  return {
    selectedCategory,
    setSelectedCategory,
    selectedUrgency,
    setSelectedUrgency,
    selectedStatus,
    setSelectedStatus,
    searchQuery,
    setSearchQuery,
    activeLeadModal,
    setActiveLeadModal,
    filteredLeads
  };
};
