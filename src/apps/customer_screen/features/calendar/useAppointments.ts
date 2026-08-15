import { useState, useEffect } from 'react';
import { supabase } from '../../../../core/supabaseClient';

export interface Appointment {
  id: string;
  business_id: string;
  customer_id?: number | null;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  created_at: string;
  customer?: {
    name?: string;
    phone?: string;
  };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const addAppointment = async (appt: Partial<Appointment>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appt)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAppointments([...appointments, json.appointment]);
          return json.appointment;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setAppointments(appointments.map(a => a.id === id ? updated : a));
        return updated;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setAppointments(appointments.filter(a => a.id !== id));
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return { appointments, loading, addAppointment, updateAppointment, deleteAppointment, fetchAppointments };
}
