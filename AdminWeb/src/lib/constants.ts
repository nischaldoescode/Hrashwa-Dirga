/**
 * Application Constants
 * Centralized configuration values for the admin panel
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Hrashwa-Dirga Admin'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

/**
 * Query keys for React Query
 * Organized by feature for easy cache management
 */
export const QUERY_KEYS = {
  AUTH: {
    CHECK: ['auth', 'check'],
  },
  DASHBOARD: {
    STATS: ['dashboard', 'stats'],
  },
  LEVELS: {
    ALL: ['levels', 'all'],
    BY_ID: (id: string) => ['levels', id],
  },
  QUESTIONS: {
    ALL: ['questions', 'all'],
    BY_ID: (id: string) => ['questions', id],
    BY_LEVEL: (levelId: string) => ['questions', 'level', levelId],
  },
  USERS: {
    ALL: ['users', 'all'],
    BY_ID: (id: string) => ['users', id],
  },
  LEADERBOARD: {
    ALL: ['leaderboard', 'all'],
  },
  CONFIG: {
    APP: ['config', 'app'],
  },
}

/**
 * Difficulty levels for questions
 */
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'hard', label: 'Hard', color: 'bg-red-500' },
] as const

/**
 * Navigation menu items
 */
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: '/',
    icon: 'LayoutDashboard',
  },
  {
    title: 'Levels',
    href: '/levels',
    icon: 'Layers',
  },
  {
    title: 'Questions',
    href: '/questions',
    icon: 'HelpCircle',
  },
  {
    title: 'Users',
    href: '/users',
    icon: 'Users',
  },
  {
    title: 'Leaderboard',
    href: '/leaderboard',
    icon: 'Trophy',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
] as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
}

/**
 * Toast duration in milliseconds
 */
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
}

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}

/**
 * iso 3166-1 alpha-2 country codes for leaderboard filtering
 * includes major countries where the app is popular
 */
export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' 
  },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },

] as const