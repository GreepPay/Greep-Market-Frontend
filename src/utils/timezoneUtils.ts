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
  const now = getCurrentDateTime();
  
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
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
 * Debug helper to log timezone information
 */
export function debugTimezoneInfo(): void {
  const now = new Date();
  const appTime = getCurrentDateTime();
  
  console.log('Frontend Timezone Debug Info:', {
    timezone: DEFAULT_TIMEZONE,
    systemTime: now.toLocaleString(),
    appTime: appTime.toLocaleString(),
    currentDateString: getCurrentDateString(),
    todayRange: getTodayRange(),
    yesterdayRange: getYesterdayRange(),
    thisMonthRange: getThisMonthRange()
  });
}
