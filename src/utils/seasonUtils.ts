/**
 * Utility functions for detecting and managing seasonal themes
 */

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface SeasonInfo {
  season: Season;
  name: string;
  emoji: string;
  startDate: Date;
  endDate: Date;
  isHoliday: boolean;
  holidayName?: string;
}

/**
 * Detects the current season based on the date
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Winter: December (12), January (1), February (2)
  if (month === 12 || month === 1 || month === 2) {
    return 'winter';
  }
  // Spring: March (3), April (4), May (5)
  if (month >= 3 && month <= 5) {
    return 'spring';
  }
  // Summer: June (6), July (7), August (8)
  if (month >= 6 && month <= 8) {
    return 'summer';
  }
  // Autumn: September (9), October (10), November (11)
  return 'autumn';
}

/**
 * Gets detailed information about the current season
 */
export function getSeasonInfo(date: Date = new Date()): SeasonInfo {
  const season = getCurrentSeason(date);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  let startDate: Date;
  let endDate: Date;
  let isHoliday = false;
  let holidayName: string | undefined;
  
  switch (season) {
    case 'winter':
      startDate = new Date(year - (month === 12 ? 0 : 1), 11, 1); // December 1
      endDate = new Date(year + (month === 12 ? 1 : 0), 1, 28); // February 28
      // Check for Christmas season (December 1 - January 6)
      isHoliday = month === 12 || (month === 1 && day <= 6);
      if (isHoliday) {
        if (month === 12 && day >= 24 && day <= 25) {
          holidayName = 'Christmas';
        } else if (month === 12) {
          holidayName = 'Christmas Season';
        } else if (month === 1 && day === 1) {
          holidayName = 'New Year';
        } else if (month === 1 && day <= 6) {
          holidayName = 'Epiphany';
        }
      }
      return {
        season: 'winter',
        name: 'Winter',
        emoji: '❄️',
        startDate,
        endDate,
        isHoliday,
        holidayName,
      };
      
    case 'spring':
      startDate = new Date(year, 2, 1); // March 1
      endDate = new Date(year, 4, 31); // May 31
      // Check for Easter (simplified - you can add proper Easter calculation)
      return {
        season: 'spring',
        name: 'Spring',
        emoji: '🌸',
        startDate,
        endDate,
        isHoliday,
        holidayName,
      };
      
    case 'summer':
      startDate = new Date(year, 5, 1); // June 1
      endDate = new Date(year, 7, 31); // August 31
      return {
        season: 'summer',
        name: 'Summer',
        emoji: '☀️',
        startDate,
        endDate,
        isHoliday,
        holidayName,
      };
      
    case 'autumn':
      startDate = new Date(year, 8, 1); // September 1
      endDate = new Date(year, 10, 30); // November 30
      // Check for Halloween (October 31) and Thanksgiving (varies, simplified)
      if (month === 10 && day === 31) {
        isHoliday = true;
        holidayName = 'Halloween';
      }
      return {
        season: 'autumn',
        name: 'Autumn',
        emoji: '🍂',
        startDate,
        endDate,
        isHoliday,
        holidayName,
      };
  }
}

/**
 * Check if we're in a special holiday period
 */
export function isHolidaySeason(date: Date = new Date()): boolean {
  const info = getSeasonInfo(date);
  return info.isHoliday;
}

/**
 * Get the current holiday name if any
 */
export function getCurrentHoliday(date: Date = new Date()): string | null {
  const info = getSeasonInfo(date);
  return info.holidayName || null;
}

