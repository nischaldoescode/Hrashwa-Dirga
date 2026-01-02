import { Platform } from 'react-native';

/**
 * Application Constants
 * Centralized configuration values and static data
 */

/**
 * Get API base URL based on platform and environment
 */
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // For Android physical device, use our computer's local IP
      // For emulator, you can also use this IP (works for both)
      return 'http://192.168.1.2:5000/api';
      
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:5000/api';
    }
  }

  // Production URL
  return 'https://your-production-api.com/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Color palette for the application
 * Professional light theme with warm accents
 */
export const COLORS = {
  // Primary brand colors - Warm browns and golds
  primary: '#B8956A', // Warm golden brown
  primaryDark: '#8B6F47', // Darker brown
  primaryLight: '#D4B896', // Light gold
  secondary: '#D4A574', // Warm accent
  secondaryDark: '#B8956A',

  // Background colors - Warm cream theme
  background: '#F7F4F0', // Warm cream background
  backgroundLight: '#FFFFFF', // Pure white
  card: '#FFFFFF', // White cards
  cardLight: '#FDFCFB', // Off-white

  // Text colors - Dark warm browns for readability
  text: '#3E362E', // Dark warm brown (main text)
  textSecondary: '#6B5D52', // Medium brown (secondary text)
  textTertiary: '#9B8B7E', // Light brown (tertiary text)

  // Semantic colors - Adjusted for light theme
  success: '#2D7A4F', // Deep green
  successDark: '#1E5A3A',
  warning: '#D97706', // Warm orange
  warningDark: '#B45309',
  error: '#C53030', // Deep red
  errorDark: '#9B2C2C',

  // UI elements - Subtle borders and overlays
  border: '#E5DDD5', // Light warm border
  borderLight: '#F0EBE6', // Very light border
  white: '#FFFFFF',
  black: '#1A1614', // Almost black brown
  transparent: 'transparent',
  overlay: 'rgba(62, 54, 46, 0.7)', // Dark brown overlay
  overlayLight: 'rgba(62, 54, 46, 0.4)',
};

/**
 * Typography scale
 * Consistent font sizes across the application
 */
export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

/**
 * Spacing scale based on 4px grid system
 * Ensures consistent spacing throughout the app
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

/**
 * Border radius values for consistent rounded corners
 */
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

/**
 * Shadow configurations for elevation
 * Reduced values to prevent inner shadow appearance
 */
export const SHADOWS = {
  small: {
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};

/**
 * Animation duration constants
 * Standard timing for smooth animations
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

/**
 * Layout breakpoints for responsive design
 */
export const BREAKPOINTS = {
  small: 375,
  medium: 414,
  large: 768,
};

/**
 * Cache keys for MMKV storage
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  APP_CONFIG: 'app_config',
  LEVELS_CACHE: 'levels_cache',
  QUESTIONS_CACHE: 'questions_cache',
  LEADERBOARD_CACHE: 'leaderboard_cache',
  LAST_SYNC: 'last_sync',
  OFFLINE_QUEUE: 'offline_queue',
};

/**
 * Network request timeout in milliseconds
 */
export const REQUEST_TIMEOUT = 30000;

/**
 * Cache expiry time in milliseconds
 * 5 minutes for most data
 */
export const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Maximum number of retries for failed requests
 */
export const MAX_RETRIES = 3;

/**
 * Haptic feedback types
 */
export const HAPTIC_TYPES = {
  light: 'impactLight' as const,
  medium: 'impactMedium' as const,
  heavy: 'impactHeavy' as const,
  success: 'notificationSuccess' as const,
  warning: 'notificationWarning' as const,
  error: 'notificationError' as const,
  selection: 'selection' as const,
};

/**
 * Notification channel IDs for Android
 */
export const NOTIFICATION_CHANNELS = {
  DAILY_COINS: 'daily_coins',
  LEVEL_COMPLETE: 'level_complete',
  STREAK_REMINDER: 'streak_reminder',
  LEADERBOARD: 'leaderboard',
};
