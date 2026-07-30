export type LeadCategory = 'workshop' | 'sales' | 'test_drive' | 'spare_parts' | 'rental' | 'general';
export type LeadUrgency = 'high' | 'normal' | 'low';
export type LeadStatus = 'new' | 'in_progress' | 'callback_scheduled' | 'completed';

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

export interface TranscriptEntry {
  id: string;
  sender: 'customer' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export interface Lead {
  id: string;
  callerName: string;
  phoneNumber: string;
  category: LeadCategory;
  concern: string;
  urgency: LeadUrgency;
  vehicleInfo?: string;
  preferredCallbackTime?: string;
  status: LeadStatus;
  notes?: string;
  transcript: TranscriptEntry[];
  createdAt: string;
  updatedAt: string;
  assignedStaff?: string;
}

export interface BusinessFacts {
  dealershipName: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  workshopHours: string;
  rentalRates: string;
  emergencyNumber: string;
  specialOffers: string;
  guardrailsPrompt: string;
}

export interface CallState {
  callId: string;
  phoneNumber: string;
  customer: Customer | null;
  status: 'idle' | 'dialing' | 'connected' | 'assistant_speaking' | 'customer_speaking' | 'processing' | 'ended';
  transcript: TranscriptEntry[];
  injectedContext: string;
  leadSaved: boolean;
  leadData: Partial<Lead> | null;
  startedAt: string | null;
  endedAt: string | null;
}
