/**
 * Standardized error codes for the PickerPacker application
 * 
 * These codes follow the pattern ERR_XXX where XXX is a three-digit number.
 * Each error should have a corresponding user-friendly message.
 */

export enum ErrorCode {
  // Authentication errors (001-009)
  InvalidPhone = 'ERR_001',
  PendingASMApproval = 'ERR_002',
  InvalidCredentials = 'ERR_003',
  TokenExpired = 'ERR_004',
  Unauthorized = 'ERR_005',

  // Location/Geo errors (010-019)
  OutsideGeofence = 'ERR_010',
  InvalidGPS = 'ERR_011',

  // Task errors (020-029)
  TagUnreadable = 'ERR_020',
  ItemBelongsToAnotherUser = 'ERR_021',
  TaskNotFound = 'ERR_022',
  TaskAlreadyCompleted = 'ERR_023',
  InvalidTaskOperation = 'ERR_024',

  // Inventory errors (030-039)
  BinFull = 'ERR_030',
  BinNotFound = 'ERR_031',
  InvalidBin = 'ERR_032',
  SKUIncompatibleWithBin = 'ERR_033',
  InsufficientQuantity = 'ERR_034',

  // Network errors (040-049)
  NetworkOffline = 'ERR_040',
  Timeout = 'ERR_041',
  ServerError = 'ERR_042',

  // Validation errors (050-059)
  InvalidInput = 'ERR_050',
  MissingRequiredField = 'ERR_051',
  InvalidFormat = 'ERR_052',

  // Exception errors (060-069)
  ExceptionNotFound = 'ERR_060',
  CannotResolveException = 'ERR_061',

  // Shift errors (070-079)
  ShiftNotStarted = 'ERR_070',
  ShiftAlreadyEnded = 'ERR_071',
  ActiveShiftExists = 'ERR_072',

  // General errors (090-099)
  UnknownError = 'ERR_090',
  RateLimitExceeded = 'ERR_091',
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.InvalidPhone]: 'Please provide a valid phone number',
  [ErrorCode.PendingASMApproval]: 'Your account is pending approval from your Area Supervisor',
  [ErrorCode.InvalidCredentials]: 'Invalid phone number or PIN',
  [ErrorCode.TokenExpired]: 'Your session has expired. Please login again',
  [ErrorCode.Unauthorized]: 'You are not authorized to perform this action',

  [ErrorCode.OutsideGeofence]: 'You are outside the allowed work area',
  [ErrorCode.InvalidGPS]: 'Unable to determine your location',

  [ErrorCode.TagUnreadable]: 'Unable to read the scanned tag. Please try again',
  [ErrorCode.ItemBelongsToAnotherUser]: 'This item is assigned to another task',
  [ErrorCode.TaskNotFound]: 'Task not found',
  [ErrorCode.TaskAlreadyCompleted]: 'This task has already been completed',
  [ErrorCode.InvalidTaskOperation]: 'This operation is not valid for the current task status',

  [ErrorCode.BinFull]: 'This bin is at capacity',
  [ErrorCode.BinNotFound]: 'Bin not found',
  [ErrorCode.InvalidBin]: 'Invalid bin specified',
  [ErrorCode.SKUIncompatibleWithBin]: 'This item cannot be stored in this bin',
  [ErrorCode.InsufficientQuantity]: 'Insufficient quantity available',

  [ErrorCode.NetworkOffline]: 'You are currently offline. Changes will sync when connection is restored',
  [ErrorCode.Timeout]: 'Request timed out. Please try again',
  [ErrorCode.ServerError]: 'An error occurred on the server. Please try again later',

  [ErrorCode.InvalidInput]: 'Invalid input provided',
  [ErrorCode.MissingRequiredField]: 'Required field is missing',
  [ErrorCode.InvalidFormat]: 'Invalid data format',

  [ErrorCode.ExceptionNotFound]: 'Exception not found',
  [ErrorCode.CannotResolveException]: 'Cannot resolve this exception',

  [ErrorCode.ShiftNotStarted]: 'Please start your shift before performing this action',
  [ErrorCode.ShiftAlreadyEnded]: 'Your shift has already ended',
  [ErrorCode.ActiveShiftExists]: 'You already have an active shift',

  [ErrorCode.UnknownError]: 'An unexpected error occurred',
  [ErrorCode.RateLimitExceeded]: 'Too many requests. Please try again later',
};

/**
 * Get user-friendly error message by code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UnknownError];
}
