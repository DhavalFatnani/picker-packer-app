export interface User {
  id: string;
  name: string;
  phone: string;
  employee_id: string;
  role: 'picker' | 'asm' | 'ops_admin';
  status: 'pending' | 'active' | 'inactive';
}

export interface Task {
  id: string;
  type: 'pick' | 'pack' | 'putaway' | 'bin_to_bin' | 'cycle_count';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  warehouse: string;
  zone?: string;
  items: TaskItem[];
  created_at: string;
}

export interface TaskItem {
  id: string;
  task_id: string;
  sku: string;
  lock_tag_id?: string;
  bin_location: string;
  required_quantity: number;
  scanned_quantity: number;
  status: 'pending' | 'scanned' | 'completed';
}

export interface Shift {
  id: string;
  user_id: string;
  warehouse: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed';
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
}
