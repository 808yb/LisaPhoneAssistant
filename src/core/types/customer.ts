export interface Customer {
  id: number;
  name: string;
  phone: string;
  additionalInfo: string | null;
  referenceId: string | null;
  isKnownCustomer: boolean;
  lastVisitReason: string | null;
  hasResource: boolean;
  rentsFromUs: boolean;
  notes: string | null;
  createdAt?: string;
}
