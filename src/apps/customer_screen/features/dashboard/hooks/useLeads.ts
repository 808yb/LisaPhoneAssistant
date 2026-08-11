import { useState, useEffect } from 'react';
import { Lead } from '../../../../../core/types';
import { fetchLeads as apiFetchLeads, updateLead as apiUpdateLead, deleteLead as apiDeleteLead } from '../dashboard.service';
import { supabase } from '../../../../../core/supabaseClient';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLeads = async (showLoading = true) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; // Prevent 401 on initial mount before login

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchLeads(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
