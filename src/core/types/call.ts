import { Customer } from './customer';
import { TranscriptEntry, Lead } from './lead';

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
