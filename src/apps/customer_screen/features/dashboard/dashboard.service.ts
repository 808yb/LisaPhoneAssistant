import { Lead } from '../../../../core/types';
import { supabase } from '../../../../core/supabaseClient';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : ''
  };
};

export const fetchLeads = async (): Promise<Lead[]> => {
  const res = await fetch('/api/leads', { headers: await getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
};

export const updateLead = async (leadId: string, updates: Partial<Lead>): Promise<Lead> => {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: 'PATCH',
    headers: await getHeaders(),
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
};

export const deleteLead = async (leadId: string): Promise<void> => {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: 'DELETE',
    headers: await getHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete lead');
};
