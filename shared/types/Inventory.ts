/**
 * Bin status definitions
 */
export enum BinStatus {
  Open = 'Open',
  Closed = 'Closed',
  InUse = 'InUse',
  Full = 'Full',
}

/**
 * Item status definitions
 */
export enum ItemStatus {
  InStock = 'InStock',
  Allocated = 'Allocated',
  Reserved = 'Reserved',
  Damaged = 'Damaged',
  Missing = 'Missing',
}

/**
 * SKU (Stock Keeping Unit) interface
 */
export interface SKU {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  unit_of_measure: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  weight?: number;
  created_at: Date;
}

/**
 * Lock tag interface
 */
export interface LockTag {
  id: string;
  tag_code: string;
  sku_id: string;
  batch_id?: string;
  bin_id?: string;
  status: ItemStatus;
  created_at: Date;
}

/**
 * Bin interface
 */
export interface Bin {
  id: string;
  code: string;
  warehouse: string;
  zone: string;
  capacity: number;
  current_quantity: number;
  status: BinStatus;
  assigned_skus?: string[]; // SKU IDs that can be stored in this bin
  created_at: Date;
  updated_at: Date;
}

/**
 * Bin item interface
 */
export interface BinItem {
  id: string;
  bin_id: string;
  sku_id: string;
  lock_tag_id: string;
  quantity: number;
  status: ItemStatus;
  added_at: Date;
  updated_at: Date;
}

/**
 * Movement interface for bin-to-bin transfers
 */
export interface Movement {
  id: string;
  from_bin_id: string;
  to_bin_id: string;
  user_id: string;
  items: {
    lock_tag_id: string;
    sku_id: string;
    quantity: number;
  }[];
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at: Date;
  completed_at?: Date;
}

/**
 * Cycle count record
 */
export interface CycleCount {
  id: string;
  bin_id: string;
  user_id: string;
  expected_items: number;
  actual_items: number;
  discrepancy: number;
  notes?: string;
  created_at: Date;
}
