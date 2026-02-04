/**
 * Date utility functions for CAVERIS application
 * All dates are handled in IST timezone and stored as DATE (without time)
 */

/**
 * Format a date string (YYYY-MM-DD) to DD/MM/YYYY for display
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateForDisplay(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Format a date string (YYYY-MM-DD) to a more readable format (e.g., "29 January 2026")
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

/**
 * Get current date in YYYY-MM-DD format (IST timezone)
 * @returns Current date string in YYYY-MM-DD format
 */
export function getCurrentDateIST(): string {
  const now = new Date();
  
  // Convert to IST
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Convert a Date object to YYYY-MM-DD format (date only, no time)
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Parse DD/MM/YYYY format to YYYY-MM-DD format
 * @param dateString - Date in DD/MM/YYYY format
 * @returns Date string in YYYY-MM-DD format
 */
export function parseDDMMYYYY(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Check if a date string is valid (YYYY-MM-DD format)
 * @param dateString - Date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Compare two date strings (YYYY-MM-DD format)
 * @param date1 - First date string
 * @param date2 - Second date string
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(date1: string, date2: string): number {
  if (date1 < date2) return -1;
  if (date1 > date2) return 1;
  return 0;
}

/**
 * Check if a date is between two dates (inclusive)
 * @param date - Date to check
 * @param startDate - Start date
 * @param endDate - End date
 * @returns true if date is between startDate and endDate (inclusive)
 */
export function isDateBetween(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Normalize a date value for database storage (ensure YYYY-MM-DD format, no time)
 * Handles various input formats and strips time components
 * @param dateValue - Date value (string, Date object, or ISO timestamp)
 * @returns Normalized date string in YYYY-MM-DD format, or null if invalid
 */
export function normalizeDateForDB(dateValue: string | Date | null | undefined): string | null {
  if (!dateValue) return null;
  
  // If it's already a string, extract just the date part (before 'T')
  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0];
  }
  
  // If it's a Date object, convert to YYYY-MM-DD
  if (dateValue instanceof Date) {
    return dateToString(dateValue);
  }
  
  return null;
}

