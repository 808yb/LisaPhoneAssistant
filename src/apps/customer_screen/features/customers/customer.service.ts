import { Customer } from '../../../../core/types';

export const fetchCustomers = async (): Promise<Customer[]> => {
  const res = await fetch('/api/customers');
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

export const addCustomer = async (newCustData: Partial<Customer>): Promise<void> => {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newCustData)
  });
  if (!res.ok) throw new Error('Failed to add customer');
};
