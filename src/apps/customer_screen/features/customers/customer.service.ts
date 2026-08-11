import { Customer } from '../../../../core/types';
import { supabase } from '../../../../core/supabaseClient';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session ? `Bearer ${session.access_token}` : ''
  };
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const res = await fetch('/api/customers', { headers: await getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch customers');
  const data = await res.json();
  
  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    vehicle: c.vehicle,
    licensePlate: c.license_plate || c.licensePlate,
    isKnownCustomer: c.is_known_customer ?? c.isKnownCustomer,
    lastVisitReason: c.last_visit_reason || c.lastVisitReason,
    hasOwnCar: c.has_own_car ?? c.hasOwnCar,
    rentsFromUs: c.rents_from_us ?? c.rentsFromUs,
    notes: c.notes,
    createdAt: c.created_at || c.createdAt
  }));
};

export const addCustomer = async (cust: Partial<Customer>): Promise<Customer> => {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: await getHeaders(),
    body: JSON.stringify(cust)
  });
  if (!res.ok) throw new Error('Failed to add customer');
  return res.json();
};

export const updateCustomer = async (id: number, cust: Partial<Customer>): Promise<Customer> => {
  const res = await fetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: await getHeaders(),
    body: JSON.stringify(cust)
  });
  if (!res.ok) throw new Error('Failed to update customer');
  return res.json();
};
