export interface Customer {
  id: number;
  name: string;
  phone: string;
  vehicle: string | null;
  licensePlate: string | null;
  isKnownCustomer: boolean;
  lastVisitReason: string | null;
  hasOwnCar: boolean;
  rentsFromUs: boolean;
  notes: string | null;
  createdAt?: string;
}
