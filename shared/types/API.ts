import type { User } from './User';
import type {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  AuthStatusResponse,
} from './User';
import type {
  Shift,
  StartShiftRequest,
  StartShiftResponse,
  EndShiftRequest,
  EndShiftResponse,
  ShiftSummary,
} from './Shift';
import type {
  Task,
  CreateTaskRequest,
  ScanRequest,
  ScanResponse,
} from './Task';
import type {
  Exception,
  CreateExceptionRequest,
  UpdateExceptionRequest,
} from './Exception';

/**
 * API Error response structure
 */
export interface APIError {
  error_code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Standard API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// ============================================================================
// Auth Endpoints
// ============================================================================

export interface AuthSignupEndpoint {
  request: SignupRequest;
  response: APIResponse<SignupResponse>;
}

export interface AuthLoginEndpoint {
  request: LoginRequest;
  response: APIResponse<LoginResponse>;
}

export interface AuthStatusEndpoint {
  response: APIResponse<AuthStatusResponse>;
}

// ============================================================================
// Shift Endpoints
// ============================================================================

export interface ShiftStartEndpoint {
  request: StartShiftRequest;
  response: APIResponse<StartShiftResponse>;
}

export interface ShiftEndEndpoint {
  request: EndShiftRequest;
  response: APIResponse<EndShiftResponse>;
}

export interface ShiftGetEndpoint {
  response: APIResponse<Shift>;
}

export interface ShiftSummaryEndpoint {
  response: APIResponse<ShiftSummary>;
}

// ============================================================================
// Task Endpoints
// ============================================================================

export interface TasksListEndpoint {
  query: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  };
  response: APIResponse<PaginatedResponse<Task>>;
}

export interface TaskGetEndpoint {
  params: { id: string };
  response: APIResponse<Task>;
}

export interface TaskScanEndpoint {
  params: { id: string };
  request: ScanRequest;
  response: APIResponse<ScanResponse>;
}

export interface TaskCompleteEndpoint {
  params: { id: string };
  response: APIResponse<Task>;
}

export interface TaskCreateEndpoint {
  request: CreateTaskRequest;
  response: APIResponse<Task>;
}

// ============================================================================
// Exception Endpoints
// ============================================================================

export interface ExceptionsListEndpoint {
  query: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  };
  response: APIResponse<PaginatedResponse<Exception>>;
}

export interface ExceptionCreateEndpoint {
  request: CreateExceptionRequest;
  response: APIResponse<Exception>;
}

export interface ExceptionUpdateEndpoint {
  params: { id: string };
  request: UpdateExceptionRequest;
  response: APIResponse<Exception>;
}

// ============================================================================
// Approvals Endpoints
// ============================================================================

export interface ApprovalsPendingEndpoint {
  response: APIResponse<User[]>;
}

export interface ApprovalApproveEndpoint {
  params: { id: string };
  query: {
    action: 'approve' | 'reject';
  };
  response: APIResponse<{ success: boolean }>;
}

// ============================================================================
// Announcements Endpoints
// ============================================================================

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'Low' | 'Normal' | 'High';
  created_by: string;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AnnouncementsListEndpoint {
  response: APIResponse<Announcement[]>;
}

export interface AnnouncementCreateEndpoint {
  request: Omit<Announcement, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
  response: APIResponse<Announcement>;
}
