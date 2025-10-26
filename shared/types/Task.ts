/**
 * Task type definitions
 */
export enum TaskType {
  Pick = 'Pick',
  Pack = 'Pack',
  Putaway = 'Putaway',
  BinToBin = 'BinToBin',
  CycleCount = 'CycleCount',
}

/**
 * Task status definitions
 */
export enum TaskStatus {
  Pending = 'Pending',
  Assigned = 'Assigned',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

/**
 * Task priority definitions
 */
export enum TaskPriority {
  Low = 'Low',
  Normal = 'Normal',
  High = 'High',
  Urgent = 'Urgent',
}

/**
 * Task item interface
 */
export interface TaskItem {
  id: string;
  task_id: string;
  sku: string;
  lock_tag: string;
  quantity: number;
  quantity_scanned: number;
  status: TaskStatus;
}

/**
 * Task interface representing a warehouse task
 */
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  warehouse: string;
  zone?: string;
  from_bin?: string;
  to_bin?: string;
  items: TaskItem[];
  notes?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create task request
 */
export interface CreateTaskRequest {
  type: TaskType;
  priority?: TaskPriority;
  warehouse: string;
  zone?: string;
  from_bin?: string;
  to_bin?: string;
  items: Omit<TaskItem, 'id' | 'task_id' | 'quantity_scanned' | 'status'>[];
  notes?: string;
}

/**
 * Scan request
 */
export interface ScanRequest {
  barcode: string;
  lock_tag: string;
}

/**
 * Scan response
 */
export interface ScanResponse {
  matched: boolean;
  task_id?: string;
  item_id?: string;
  sku?: string;
  action?: string;
  message: string;
}
