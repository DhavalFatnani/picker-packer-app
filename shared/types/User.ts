/**
 * User role definitions
 */
export enum Role {
  PickerPacker = 'PickerPacker',
  ASM = 'ASM',
  StoreManager = 'StoreManager',
  OpsAdmin = 'OpsAdmin',
}

/**
 * User status definitions
 */
export enum UserStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Active = 'Active',
  Inactive = 'Inactive',
}

/**
 * User interface representing a user in the system
 */
export interface User {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  pin_hash: string;
  role: Role;
  status: UserStatus;
  warehouse: string;
  created_at: Date;
  updated_at: Date;
  approved_at?: Date;
  approved_by?: string;
}

/**
 * Authentication token payload
 */
export interface AuthToken {
  userId: string;
  employee_id: string;
  role: Role;
  warehouse: string;
}

/**
 * Signup request payload
 */
export interface SignupRequest {
  name: string;
  phone: string;
}

/**
 * Signup response payload
 */
export interface SignupResponse {
  user_id: string;
  employee_id: string;
  pin: string; // PIN is only returned once during signup
  status: UserStatus;
  message: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  phone: string;
  pin: string;
}

/**
 * Login response payload
 */
export interface LoginResponse {
  token: string;
  refresh_token: string;
  user: Omit<User, 'pin_hash'>;
}

/**
 * Auth status response
 */
export interface AuthStatusResponse {
  user: Omit<User, 'pin_hash'>;
  is_authenticated: boolean;
}
