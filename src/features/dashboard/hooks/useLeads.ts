import { useState, useEffect } from 'react';
import { Lead } from '../../../core/types';
import { fetchLeads as apiFetchLeads, updateLead as apiUpdateLead, deleteLead as apiDeleteLead } from '../dashboard.service';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeads = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await apiFetchLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const updatedLead = await apiUpdateLead(leadId, updates);
      setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      await apiDeleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  return { leads, loading, updateLead, deleteLead, fetchLeads };
};
