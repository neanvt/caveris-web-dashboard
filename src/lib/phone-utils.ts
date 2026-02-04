/**
 * Phone number utility functions for CAVERIS application
 * All phone numbers are stored as 10-digit numbers without ISD code
 */

/**
 * Validate Indian phone number (10 digits)
 * @param phone - Phone number string
 * @returns true if valid 10-digit number, false otherwise
 */
export function isValidIndianPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  // Remove any whitespace
  const cleaned = phone.trim();
  
  // Check if it's exactly 10 digits
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Format phone number for display (add spaces for readability)
 * @param phone - 10-digit phone number
 * @returns Formatted phone number (e.g., "9000 000 001")
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  
  const cleaned = phone.trim();
  
  // Format as XXXX XXX XXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return cleaned;
}

/**
 * Normalize phone number for database storage
 * Removes ISD code, spaces, and other formatting
 * @param phone - Phone number in any format
 * @returns 10-digit phone number or null if invalid
 */
export function normalizePhoneForDB(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 91 (India ISD code) and has 12 digits, remove the 91
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  }
  
  // If it starts with +91, it should have been cleaned above
  // If it has 10 digits and starts with 6-9, it's valid
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

/**
 * Parse phone number from CSV (handles various formats)
 * @param phone - Phone number from CSV
 * @returns Normalized 10-digit phone number or null
 */
export function parsePhoneFromCSV(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const normalized = normalizePhoneForDB(phone);
  
  if (!normalized || !isValidIndianPhone(normalized)) {
    return null;
  }
  
  return normalized;
}

/**
 * Get phone validation error message
 * @param phone - Phone number to validate
 * @returns Error message or null if valid
 */
export function getPhoneValidationError(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === '') {
    return null; // Empty is okay if optional
  }
  
  const normalized = normalizePhoneForDB(phone);
  
  if (!normalized) {
    return 'Invalid phone number format';
  }
  
  if (!isValidIndianPhone(normalized)) {
    return 'Phone number must be 10 digits starting with 6, 7, 8, or 9';
  }
  
  return null;
}
