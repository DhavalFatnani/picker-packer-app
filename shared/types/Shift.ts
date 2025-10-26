/**
 * Shift status definitions
 */
export enum ShiftStatus {
  NotStarted = 'NotStarted',
  Active = 'Active',
  Ended = 'Ended',
}

/**
 * Shift interface representing a work shift
 */
export interface Shift {
  id: string;
  user_id: string;
  status: ShiftStatus;
  warehouse: string;
  zone?: string;
  started_at?: Date;
  ended_at?: Date;
  selfie_uri?: string;
  selfie_gps?: {
    latitude: number;
    longitude: number;
  };
  geo_validated: boolean;
  created_at: Date;
}

/**
 * Shift summary metrics
 */
export interface ShiftSummary {
  shift_id: string;
  user_id: string;
  duration_minutes: number;
  tasks_completed: number;
  tasks_pending: number;
  items_scanned: number;
  throughput: number; // items per minute
  exceptions_count: number;
}

/**
 * Start shift request
 */
export interface StartShiftRequest {
  warehouse: string;
  zone?: string;
  gps: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Start shift response
 */
export interface StartShiftResponse {
  shift_id: string;
  shift: Shift;
}

/**
 * End shift request
 */
export interface EndShiftRequest {
  notes?: string;
}

/**
 * End shift response
 */
export interface EndShiftResponse {
  shift: Shift;
  summary: ShiftSummary;
}
