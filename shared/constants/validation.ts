/**
 * Validation constants and rules for the PickerPacker application
 */

/**
 * Phone number format
 * Accepts: +1234567890, (123) 456-7890, 123-456-7890, 1234567890
 */
export const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

/**
 * PIN validation
 * Must be exactly 6 digits
 */
export const PIN_REGEX = /^[0-9]{6}$/;
export const PIN_LENGTH = 6;

/**
 * Employee ID format
 * Format: PP-{warehouse}-{6digit}
 * Example: PP-WH1-123456
 */
export const EMPLOYEE_ID_REGEX = /^PP-[A-Z0-9]+-\d{6}$/;

/**
 * Lock tag/Barcode format
 * Alphanumeric, 6-20 characters
 */
export const TAG_REGEX = /^[A-Z0-9]{6,20}$/;

/**
 * Geo-fence settings
 */
export const GEO_FENCE_RADIUS_METERS = 1000; // 1km radius

/**
 * Name validation
 * Allows letters, spaces, hyphens, apostrophes
 */
export const NAME_REGEX = /^[a-zA-Z\s\-']{2,50}$/;

/**
 * Warehouse code format
 * 2-10 uppercase alphanumeric characters
 */
export const WAREHOUSE_CODE_REGEX = /^[A-Z0-9]{2,10}$/;

/**
 * Zone code format
 * 1-10 alphanumeric characters
 */
export const ZONE_CODE_REGEX = /^[A-Z0-9-]{1,10}$/;

/**
 * Bin code format
 * Alphanumeric with optional hyphens
 */
export const BIN_CODE_REGEX = /^[A-Z0-9-]{3,20}$/;

/**
 * SKU code format
 * Alphanumeric with optional hyphens and underscores
 */
export const SKU_CODE_REGEX = /^[A-Z0-9_-]{3,30}$/;

/**
 * Application limits
 */
export const LIMITS = {
  MAX_NAME_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_NOTES_LENGTH: 1000,
  MAX_PHOTO_SIZE_MB: 5,
  MIN_PASSWORD_LENGTH: 8,
  MAX_TASKS_PER_USER: 100,
  MAX_ITEMS_PER_TASK: 1000,
  MAX_EXCEPTION_PHOTOS: 5,
  PAGINATION_DEFAULT_PAGE: 1,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as const;

/**
 * Validation functions
 */
export const Validation = {
  isPhone(phone: string): boolean {
    return PHONE_REGEX.test(phone);
  },

  isPin(pin: string): boolean {
    return PIN_REGEX.test(pin);
  },

  isEmployeeId(id: string): boolean {
    return EMPLOYEE_ID_REGEX.test(id);
  },

  isTag(tag: string): boolean {
    return TAG_REGEX.test(tag);
  },

  isName(name: string): boolean {
    return NAME_REGEX.test(name);
  },

  isWarehouseCode(code: string): boolean {
    return WAREHOUSE_CODE_REGEX.test(code);
  },

  isZoneCode(code: string): boolean {
    return ZONE_CODE_REGEX.test(code);
  },

  isBinCode(code: string): boolean {
    return BIN_CODE_REGEX.test(code);
  },

  isSKUCode(code: string): boolean {
    return SKU_CODE_REGEX.test(code);
  },

  sanitizePhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  },

  validateLength(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
  },
};
