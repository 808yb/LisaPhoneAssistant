import { Lead } from '../../core/types';

export const fetchLeads = async (): Promise<Lead[]> => {
  const res = await fetch('/api/leads');
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
};

export const updateLead = async (leadId: string, updates: Partial<Lead>): Promise<Lead> => {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update lead');
  return res.json();
};

export const deleteLead = async (leadId: string): Promise<void> => {
  const res = await fetch(`/api/leads/${leadId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete lead');
};
