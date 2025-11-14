/**
 * Frontend Timezone Utilities
 * Ensures consistent timezone handling across the frontend application
 */

// Default timezone - matches your system timezone (EEST)
const DEFAULT_TIMEZONE = 'Europe/Nicosia'; // EEST (Eastern European Summer Time) GMT+3

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Get the configured timezone for the application
 */
export function getAppTimezone(): string {
  return DEFAULT_TIMEZONE;
}

/**
 * Get the current date in the app timezone as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  const now = new Date();
  return now.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE });
}

/**
 * Get current date and time in the app timezone
 */
export function getCurrentDateTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: DEFAULT_TIMEZONE }));
}

/**
 * Create a date range for "today" in the app timezone
 */
export function getTodayRange(): DateRange {
  const now = getCurrentDateTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
  };
}

/**
 * Create a date range for "yesterday" in the app timezone
 */
export function getYesterdayRange(): DateRange {
  const now = getCurrentDateTime();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return {
    start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0),
    end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
  };
}

/**
 * Create a date range for "this month" in the app timezone
 */
export function getThisMonthRange(): DateRange {
  // Use system date directly to avoid timezone conversion issues
  const now = new Date();
  
  // Create dates in the app timezone to avoid timezone conversion issues
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Start of month: first day at 00:00:00
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  
  // End of month: last day at 23:59:59
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start,
    end
  };
}

/**
 * Create a date range for the last N days in the app timezone
 */
export function getLastNDaysRange(days: number): DateRange {
  const now = getCurrentDateTime();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  
  return {
    start: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0),
    end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
  };
}

/**
 * Format a date for display in the app timezone
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE });
}

/**
 * Format a datetime for display in the app timezone
 */
export function formatDateTimeForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', { 
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Convert a date to ISO string in the app timezone
 */
export function toISOStringInTimezone(date: Date): string {
  return date.toLocaleString('sv-SE', { timeZone: DEFAULT_TIMEZONE }).replace(' ', 'T') + '.000Z';
}

/**
 * Check if two dates are on the same day in the app timezone
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const str1 = d1.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE });
  const str2 = d2.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE });
  
  return str1 === str2;
}

/**
 * Standardize date to YYYY-MM-DD format for storage and comparison
 * This is the canonical format used throughout the app for date matching
 * IMPORTANT: Uses local timezone (Europe/Nicosia) to extract date components
 */
export function normalizeDateToYYYYMMDD(date: Date | string): string {
  // Handle YYYY-MM-DD strings (already normalized)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Parse the date - this creates a Date object from the input
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return typeof date === 'string' ? date : '';
  }
  
  // Use timezone-aware date extraction to get local date components
  // This ensures dates are grouped by the local day, not UTC day
  const localDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: DEFAULT_TIMEZONE });
  
  // en-CA format is YYYY-MM-DD, which is exactly what we need
  if (/^\d{4}-\d{2}-\d{2}$/.test(localDateStr)) {
    return localDateStr;
  }
  
  // Fallback: extract components manually using timezone-aware methods
  // Create a date formatter for the local timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: DEFAULT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(dateObj);
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  
  return `${year}-${month}-${day}`;
}

/**
 * Format date for chart display (e.g., "Nov 13", "Oct 2023")
 * This is for visual display only, not for matching/comparison
 */
export function formatDateForChart(date: Date | string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): string {
  let dateObj: Date;
  
  // Handle YYYY-MM format for monthly period
  if (period === 'monthly' && typeof date === 'string' && /^\d{4}-\d{2}$/.test(date)) {
    const [year, month] = date.split('-').map(Number);
    dateObj = new Date(year, month - 1, 1); // Create date from YYYY-MM format
  } else {
    dateObj = typeof date === 'string' ? new Date(date) : date;
  }
  
  // Ensure we have a valid date
  if (isNaN(dateObj.getTime())) {
    return typeof date === 'string' ? date : '';
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  switch (period) {
    case 'weekly':
      const month = monthNames[dateObj.getMonth()];
      const day = dateObj.getDate();
      return `W${month} ${day}`;
    case 'monthly':
      return `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    default:
      // Daily format: "Nov 13"
      const dayMonth = monthNames[dateObj.getMonth()];
      const dayNum = dateObj.getDate();
      return `${dayMonth} ${dayNum}`;
  }
}

/**
 * Parse date from various formats and return normalized YYYY-MM-DD string
 */
export function parseAndNormalizeDate(dateInput: string | Date): string {
  if (dateInput instanceof Date) {
    return normalizeDateToYYYYMMDD(dateInput);
  }
  
  // Handle ISO format
  if (dateInput.includes('T')) {
    return dateInput.split('T')[0];
  }
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  
  // Try parsing as Date
  const parsed = new Date(dateInput);
  if (!isNaN(parsed.getTime())) {
    return normalizeDateToYYYYMMDD(parsed);
  }
  
  // Return as-is if can't parse
  return dateInput;
}

/**
 * Compare two dates to see if they're the same day (using normalized format)
 */
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const normalized1 = normalizeDateToYYYYMMDD(date1);
  const normalized2 = normalizeDateToYYYYMMDD(date2);
  return normalized1 === normalized2;
}

/**
 * Debug helper to log timezone information
 */
export function debugTimezoneInfo(): void {
  const now = new Date();
  const appTime = getCurrentDateTime();
  
}
