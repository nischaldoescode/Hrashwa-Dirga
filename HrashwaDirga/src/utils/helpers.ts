/**
 * Utility Helper Functions
 * Common functions used across the application
 */

import { Dimensions, Platform } from 'react-native';
import { BREAKPOINTS } from './constants';

/**
 * Get device dimensions
 */
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

/**
 * Check if device is a small screen
 * @returns True if screen width is less than medium breakpoint
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < BREAKPOINTS.medium;
};

/**
 * Check if device is a tablet
 * @returns True if screen width exceeds large breakpoint
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= BREAKPOINTS.large;
};

/**
 * Check if running on iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Check if running on Android
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Format number with thousand separators
 * @param num Number to format
 * @returns Formatted string (e.g., 1,234)
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Truncate text to specified length
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Calculate time difference from now
 * @param date Date string or Date object
 * @returns Human-readable time difference
 */
export const getTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param array Array to shuffle
 * @returns New shuffled array
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Delay execution for specified milliseconds
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function calls
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Generate random ID
 * @returns Random alphanumeric string
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Check if value is valid email
 * @param email Email string to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate percentage
 * @param value Current value
 * @param total Total value
 * @returns Percentage as number (0-100)
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Clamp number between min and max
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Check if date is today
 * @param date Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const today = new Date();
  const checkDate = new Date(date);

  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
};

/**
 * Get ordinal suffix for number (1st, 2nd, 3rd, etc.)
 * @param num Number to get suffix for
 * @returns Number with ordinal suffix
 */
export const getOrdinal = (num: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = num % 100;
  return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
};

/**
 * Format joined date safely
 * @param dateString Date string to format
 * @returns Formatted date or fallback text
 */
export const formatJoinedDate = (
  dateString: string | null | undefined,
): string => {
  // Handle null, undefined, or invalid strings
  if (
    !dateString ||
    typeof dateString !== 'string' ||
    dateString.trim() === '' ||
    dateString.trim() === '.' ||
    dateString.toLowerCase() === 'null' ||
    dateString.toLowerCase() === 'undefined'
  ) {
    return 'Recently joined';
  }

  try {
    const date = new Date(dateString.trim());

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently joined';
    }

    // Format the date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.log('[formatJoinedDate] Error parsing date:', error);
    return 'Recently joined';
  }
};
