export type LeadCategory = 'service' | 'sales' | 'booking' | 'support' | 'rental' | 'general';
export type LeadUrgency = 'high' | 'normal' | 'low';
export type LeadStatus = 'new' | 'in_progress' | 'callback_scheduled' | 'completed';

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
  additionalInfo?: string;
  preferredCallbackTime?: string;
  status: LeadStatus;
  notes?: string;
  transcript: TranscriptEntry[];
  createdAt: string;
  updatedAt: string;
  assignedStaff?: string;
}
