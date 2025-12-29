/**
 * TypeScript Type Definitions
 * Centralized type definitions for the admin panel
 */

/**
 * Standard API response wrapper
 * All backend responses follow this structure for consistency
 */
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  cached?: boolean
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}

/**
 * Admin user
 */
export interface Admin {
  email: string
  role: 'admin'
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  users: {
    total: number
    active: number
    inactive: number
  }
  levels: {
    total: number
    published: number
    draft: number
  }
  questions: {
    total: number
    active: number
    inactive: number
  }
  questionPerformance: {
    totalAttempts: number
    correctAttempts: number
    successRate: string
    totalHintsUsed: number
  }
  topUsers: Array<{
    _id: string
    displayName: string
    email: string
    totalScore: number
  }>
}

/**
 * Level entity
 */
export interface Level {
  _id: string
  levelNumber: number
  levelName: string
  isPublished: boolean
  displayOrder: number
  questions: string[]
  questionCount?: number
  createdAt: string
  updatedAt: string
}

/**
 * Question entity
 */
export interface Question {
  _id: string
  levelId: {
    _id: string
    levelNumber: number
    levelName: string
  }
  questionText: string
  options: string[]
  correctAnswer: string
  orderInLevel: number
  isActive: boolean
  stats: {
    totalAttempts: number
    correctAttempts: number
    hintsUsed: number
  }
  successRate?: number
  averageHintsUsed?: number
  createdAt: string
  updatedAt: string
}

/**
 * User entity
 */
export interface User {
  _id: string
  firebaseUid: string
  email: string
  displayName: string
  photoURL: string | null
  coins: number
  currentLevel: number
  totalScore: number
  completedLevels: string[]
  completedQuestions: Array<{
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
    hintsUsed: number
    completedAt: string
  }>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  _id: string
  displayName: string
  email: string
  photoURL: string | null
  totalScore: number
  rank: number
}

/**
 * App configuration
 */
export interface AppConfig {
  _id: string
  appName: string
  logoUrl: string
  logoPublicId: string
  appVersion: string
  maintenanceMode: boolean
  maintenanceMessage: string
  gameSettings: {
    initialCoins: number
    dailyCoins: number
    hintCost: number
    levelCompletionBonus: number
    maxHintsPerQuestion: number
    baseScore: number
    hintScorePenalty: number
  }
  contactEmail: string
  termsUrl: string
  privacyUrl: string
  socialLinks: {
    facebook: string
    twitter: string
    instagram: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * Form values for level creation/update
 */
export interface LevelFormValues {
  levelNumber: number
  levelName: string
  isPublished: boolean
}

/**
 * Form values for question creation/update
 */
export interface QuestionFormValues {
  levelId: string
  questionText: string
  options: [string, string, string]
  correctAnswer: string
  orderInLevel?: number
}

/**
 * Form values for config update
 */
export interface ConfigFormValues {
  appName: string
  appVersion: string
  maintenanceMode: boolean
  maintenanceMessage: string
  gameSettings: {
    initialCoins: number
    dailyCoins: number
    hintCost: number
    levelCompletionBonus: number
    maxHintsPerQuestion: number
    baseScore: number
    hintScorePenalty: number
  }
  contactEmail: string
}

/**
 * Login form values
 */
export interface LoginFormValues {
  email: string
  password: string
}