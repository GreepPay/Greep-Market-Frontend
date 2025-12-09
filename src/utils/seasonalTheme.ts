/**
 * Seasonal theme configurations for UI components
 * Provides colors, messages, and styling based on current season and holidays
 */

import { SeasonInfo } from './seasonUtils';

export interface SeasonalTheme {
  // Color schemes
  backgroundGradient: string;
  cardGradient: string;
  iconGradient: string;
  textGradient: string;
  accentColor: string;
  borderColor: string;
  badgeGradient: string;
  borderGradient: string;
  
  // Messages
  welcomeMessage: string;
  festiveMessage?: string;
  emoji: string;
}

/**
 * Get seasonal theme configuration based on season info
 */
export function getSeasonalTheme(seasonInfo: SeasonInfo): SeasonalTheme {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  
  // Christmas Season (December 1 - January 6)
  if (seasonInfo.season === 'winter' && seasonInfo.isHoliday) {
    if (seasonInfo.holidayName === 'Christmas' || (month === 12 && day >= 24 && day <= 25)) {
      return {
        backgroundGradient: 'from-red-100 via-green-100 to-red-100 dark:from-red-950/40 dark:via-green-950/40 dark:to-red-950/40',
        cardGradient: 'from-red-500 via-green-500 to-red-500',
        iconGradient: 'from-red-600 to-green-600',
        textGradient: 'from-red-700 via-green-700 to-red-700 dark:from-red-300 dark:via-green-300 dark:to-red-300',
        accentColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-500',
        badgeGradient: 'from-red-100 via-green-100 to-red-100 dark:from-red-900/50 dark:via-green-900/50 dark:to-red-900/50',
        borderGradient: 'from-red-500 via-green-500 to-red-500',
        welcomeMessage: `🎄 Merry Christmas! Welcome to`,
        festiveMessage: '✨ Wishing you joy, peace, and prosperity this holiday season!',
        emoji: '🎄',
      };
    }
    
    if (seasonInfo.holidayName === 'New Year' || (month === 1 && day === 1)) {
      return {
        backgroundGradient: 'from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-yellow-950/40',
        cardGradient: 'from-purple-500 via-pink-500 to-yellow-500',
        iconGradient: 'from-purple-600 to-yellow-500',
        textGradient: 'from-purple-700 via-pink-700 to-yellow-700 dark:from-purple-300 dark:via-pink-300 dark:to-yellow-300',
        accentColor: 'text-purple-700 dark:text-purple-300',
        borderColor: 'border-purple-500',
        badgeGradient: 'from-purple-100 via-pink-100 to-yellow-100 dark:from-purple-900/50 dark:via-pink-900/50 dark:to-yellow-900/50',
        borderGradient: 'from-purple-500 via-pink-500 to-yellow-500',
        welcomeMessage: `🎊 Happy New Year! Welcome to`,
        festiveMessage: '🌟 May this year bring you success, growth, and endless opportunities!',
        emoji: '🎊',
      };
    }
    
    if (seasonInfo.holidayName === 'Christmas Season' || (month === 12 && day >= 1 && day <= 23)) {
      return {
        backgroundGradient: 'from-red-100 via-green-100 to-blue-100 dark:from-red-950/40 dark:via-green-950/40 dark:to-blue-950/40',
        cardGradient: 'from-red-500 via-green-500 to-blue-500',
        iconGradient: 'from-red-600 to-green-600',
        textGradient: 'from-red-700 via-green-700 to-blue-700 dark:from-red-300 dark:via-green-300 dark:to-blue-300',
        accentColor: 'text-red-700 dark:text-red-300',
        borderColor: 'border-red-500',
        badgeGradient: 'from-red-100 via-green-100 to-blue-100 dark:from-red-900/50 dark:via-green-900/50 dark:to-blue-900/50',
        borderGradient: 'from-red-500 via-green-500 to-blue-500',
        welcomeMessage: `🎅 It's the Holiday Season! Welcome to`,
        festiveMessage: '🎁 Spread the joy and make this season memorable!',
        emoji: '🎅',
      };
    }
    
    // General Winter
    return {
      backgroundGradient: 'from-blue-100 via-cyan-100 to-blue-200 dark:from-blue-950/40 dark:via-cyan-950/40 dark:to-blue-900/40',
      cardGradient: 'from-blue-500 via-cyan-500 to-blue-600',
      iconGradient: 'from-blue-600 to-cyan-600',
      textGradient: 'from-blue-700 via-cyan-700 to-blue-800 dark:from-blue-300 dark:via-cyan-300 dark:to-blue-200',
      accentColor: 'text-blue-700 dark:text-blue-300',
      borderColor: 'border-blue-500',
      badgeGradient: 'from-blue-100 via-cyan-100 to-blue-100 dark:from-blue-900/50 dark:via-cyan-900/50 dark:to-blue-900/50',
      borderGradient: 'from-blue-500 via-cyan-500 to-blue-600',
      welcomeMessage: `❄️ Winter Wonderland! Welcome to`,
      festiveMessage: 'Stay warm and keep your business thriving!',
      emoji: '❄️',
    };
  }
  
  // Spring
  if (seasonInfo.season === 'spring') {
    return {
      backgroundGradient: 'from-pink-100 via-rose-100 to-purple-100 dark:from-pink-950/40 dark:via-rose-950/40 dark:to-purple-950/40',
      cardGradient: 'from-pink-500 via-rose-500 to-purple-500',
      iconGradient: 'from-pink-600 to-purple-600',
      textGradient: 'from-pink-700 via-rose-700 to-purple-700 dark:from-pink-300 dark:via-rose-300 dark:to-purple-300',
      accentColor: 'text-pink-700 dark:text-pink-300',
      borderColor: 'border-pink-500',
      badgeGradient: 'from-pink-100 via-rose-100 to-purple-100 dark:from-pink-900/50 dark:via-rose-900/50 dark:to-purple-900/50',
      borderGradient: 'from-pink-500 via-rose-500 to-purple-500',
      welcomeMessage: `🌸 Spring has Sprung! Welcome to`,
      festiveMessage: 'A fresh start brings new opportunities!',
      emoji: '🌸',
    };
  }
  
  // Summer
  if (seasonInfo.season === 'summer') {
    return {
      backgroundGradient: 'from-yellow-100 via-orange-100 to-amber-100 dark:from-yellow-950/40 dark:via-orange-950/40 dark:to-amber-950/40',
      cardGradient: 'from-yellow-500 via-orange-500 to-amber-500',
      iconGradient: 'from-yellow-600 to-orange-600',
      textGradient: 'from-yellow-700 via-orange-700 to-amber-700 dark:from-yellow-300 dark:via-orange-300 dark:to-amber-300',
      accentColor: 'text-yellow-700 dark:text-yellow-300',
      borderColor: 'border-yellow-500',
      badgeGradient: 'from-yellow-100 via-orange-100 to-amber-100 dark:from-yellow-900/50 dark:via-orange-900/50 dark:to-amber-900/50',
      borderGradient: 'from-yellow-500 via-orange-500 to-amber-500',
      welcomeMessage: `☀️ Sunny Days Ahead! Welcome to`,
      festiveMessage: 'Let the sunshine fuel your success!',
      emoji: '☀️',
    };
  }
  
  // Autumn
  if (seasonInfo.season === 'autumn') {
    if (seasonInfo.holidayName === 'Halloween' || (month === 10 && day === 31)) {
      return {
        backgroundGradient: 'from-orange-100 via-purple-100 to-gray-100 dark:from-orange-950/40 dark:via-purple-950/40 dark:to-gray-950/40',
        cardGradient: 'from-orange-500 via-purple-600 to-gray-700',
        iconGradient: 'from-orange-600 to-purple-700',
        textGradient: 'from-orange-700 via-purple-700 to-gray-800 dark:from-orange-300 dark:via-purple-300 dark:to-gray-200',
        accentColor: 'text-orange-700 dark:text-orange-300',
        borderColor: 'border-orange-500',
        badgeGradient: 'from-orange-100 via-purple-100 to-gray-100 dark:from-orange-900/50 dark:via-purple-900/50 dark:to-gray-900/50',
        borderGradient: 'from-orange-500 via-purple-600 to-gray-700',
        welcomeMessage: `🎃 Happy Halloween! Welcome to`,
        festiveMessage: 'Trick or treat your way to business success!',
        emoji: '🎃',
      };
    }
    
    return {
      backgroundGradient: 'from-orange-100 via-amber-100 to-red-100 dark:from-orange-950/40 dark:via-amber-950/40 dark:to-red-950/40',
      cardGradient: 'from-orange-500 via-amber-500 to-red-500',
      iconGradient: 'from-orange-600 to-red-600',
      textGradient: 'from-orange-700 via-amber-700 to-red-700 dark:from-orange-300 dark:via-amber-300 dark:to-red-300',
      accentColor: 'text-orange-700 dark:text-orange-300',
      borderColor: 'border-orange-500',
      badgeGradient: 'from-orange-100 via-amber-100 to-red-100 dark:from-orange-900/50 dark:via-amber-900/50 dark:to-red-900/50',
      borderGradient: 'from-orange-500 via-amber-500 to-red-500',
      welcomeMessage: `🍂 Autumn Vibes! Welcome to`,
      festiveMessage: 'Harvest the rewards of your hard work!',
      emoji: '🍂',
    };
  }
  
  // Default fallback
  return {
    backgroundGradient: 'from-slate-50 via-green-50 to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    cardGradient: 'from-green-500 to-green-600',
    iconGradient: 'from-green-600 to-green-700',
    textGradient: 'from-gray-900 to-gray-600 dark:from-white dark:to-gray-300',
    accentColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-500',
    badgeGradient: 'from-green-100 to-green-100 dark:from-green-900/50 dark:to-green-900/50',
    borderGradient: 'from-green-500 to-green-600',
    welcomeMessage: 'Welcome to',
    emoji: '👋',
  };
}
