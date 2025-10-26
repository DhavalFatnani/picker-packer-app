/**
 * Exception type definitions
 */
export enum ExceptionType {
  Damage = 'Damage',
  Missing = 'Missing',
  WrongItem = 'WrongItem',
  TagReplacement = 'TagReplacement',
  Overstock = 'Overstock',
  Understock = 'Understock',
  Other = 'Other',
}

/**
 * Exception status definitions
 */
export enum ExceptionStatus {
  Pending = 'Pending',
  InReview = 'InReview',
  Resolved = 'Resolved',
  Rejected = 'Rejected',
}

/**
 * Exception interface
 */
export interface Exception {
  id: string;
  type: ExceptionType;
  status: ExceptionStatus;
  user_id: string;
  task_id?: string;
  sku_id?: string;
  lock_tag_id?: string;
  bin_id?: string;
  description: string;
  photos?: string[];
  quantity?: number;
  old_tag?: string;
  new_tag?: string;
  created_at: Date;
  reviewed_at?: Date;
  reviewed_by?: string;
  resolution?: string;
}

/**
 * Create exception request
 */
export interface CreateExceptionRequest {
  type: ExceptionType;
  task_id?: string;
  sku_id?: string;
  lock_tag_id?: string;
  bin_id?: string;
  description: string;
  photos?: string[];
  quantity?: number;
  old_tag?: string;
  new_tag?: string;
}

/**
 * Update exception request
 */
export interface UpdateExceptionRequest {
  status: ExceptionStatus;
  resolution?: string;
}
