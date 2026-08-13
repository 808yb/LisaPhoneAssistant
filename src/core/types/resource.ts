export type ResourceStatus = 'available' | 'in_use' | 'maintenance' | 'offline';

export interface Resource {
  id?: number;
  business_id: string;
  name: string;
  type: string; // e.g. 'vehicle', 'room', 'equipment', 'personnel'
  status: ResourceStatus;
  metadata?: Record<string, any>; // Flexible JSONB structure
  created_at?: string;
}
