/**
 * Telemetry event type definitions
 */
export enum EventType {
  UnitScanned = 'unit_scanned',
  TaskStarted = 'task_started',
  TaskCompleted = 'task_completed',
  TaskCancelled = 'task_cancelled',
  ShiftStarted = 'shift_started',
  ShiftEnded = 'shift_ended',
  ExceptionRaised = 'exception_raised',
  ExceptionResolved = 'exception_resolved',
  BinOpened = 'bin_opened',
  BinClosed = 'bin_closed',
  MovementCompleted = 'movement_completed',
  CycleCountPerformed = 'cycle_count_performed',
  UserApproved = 'user_approved',
  UserRejected = 'user_rejected',
}

/**
 * Telemetry event interface
 */
export interface TelemetryEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  timestamp: Date;
  metadata: {
    [key: string]: unknown;
  };
  gps?: {
    latitude: number;
    longitude: number;
  };
  device_info?: {
    platform: string;
    version: string;
  };
}

/**
 * Event metadata for different event types
 */
export interface UnitScannedMetadata {
  barcode: string;
  lock_tag: string;
  task_id?: string;
  sku_id?: string;
}

export interface TaskEventMetadata {
  task_id: string;
  task_type: string;
  items_completed?: number;
  items_total?: number;
}

export interface ExceptionMetadata {
  exception_id: string;
  exception_type: string;
  task_id?: string;
}

export interface ShiftMetadata {
  shift_id: string;
  warehouse: string;
  duration_minutes?: number;
}
