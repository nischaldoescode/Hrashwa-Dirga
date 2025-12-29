/**
 * Authentication Store
 * Global state management for user authentication and profile
 * Uses Zustand for lightweight, fast state management
 */

import { create } from 'zustand';
import { User } from '@/types/auth.types';
import { storageService } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { cacheService } from '@/services/cacheService';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateUserCoins: (coins: number) => void;
  updateUserScore: (score: number) => void;
  updateDailyClaimInfo: (claimData: {
    currentStreak: number;
    lastClaimDate: string;
    totalClaims: number;
  }) => void;
  incrementLevel: () => void;
  logout: () => void;
  restoreSession: () => void;
}

/**
 * Create authentication store
 * Manages user state and authentication status
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Set user data and authentication status
   * @param user User object or null for logout
   */
  setUser: user => {
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    });

    if (user) {
      cacheService.cacheUser(user);
      // Also store auth token
      const token = storageService.getString(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        storageService.setString(STORAGE_KEYS.AUTH_TOKEN, token);
      }
    } else {
      storageService.delete(STORAGE_KEYS.USER_DATA);
      storageService.delete(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  /**
   * Set loading state for async operations
   * @param loading Loading status
   */
  setLoading: loading => {
    set({ isLoading: loading });
  },

  /**
   * Set error message
   * @param error Error message or null to clear
   */
  setError: error => {
    set({ error });
  },

  /**
   * Update user coin count
   * @param coins New coin count
   */
  updateUserCoins: coins => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, coins };
      set({ user: updatedUser });
      cacheService.cacheUser(updatedUser);
    }
  },

  /**
   * Update daily claim info
   * @param claimData Daily claim tracking data
   */
  updateDailyClaimInfo: (claimData: {
    currentStreak: number;
    lastClaimDate: string;
    totalClaims: number;
  }) => {
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        dailyCoinClaim: {
          currentStreak: claimData.currentStreak,
          lastClaimDate: claimData.lastClaimDate,
          totalClaims: claimData.totalClaims,
          canClaim: false,
        },
      };
      set({ user: updatedUser });
      cacheService.cacheUser(updatedUser);
    }
  },

  /**
   * Update user total score
   * @param score New total score
   */
  updateUserScore: score => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, totalScore: score };
      set({ user: updatedUser });
      cacheService.cacheUser(updatedUser);
    }
  },

  /**
   * Increment user's current level
   * Called after level completion
   */
  incrementLevel: () => {
    const { user } = get();
    if (user) {
      const updatedUser = {
        ...user,
        currentLevel: user.currentLevel + 1,
        completedLevels: user.completedLevels + 1,
      };
      set({ user: updatedUser });
      cacheService.cacheUser(updatedUser);
    }
  },

  /**
   * Clear user data and logout
   * Removes all cached authentication data
   */
  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
    storageService.delete(STORAGE_KEYS.USER_DATA);
    storageService.delete(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Restore user session from cache
   * Called on app startup to maintain logged-in state
   */
  restoreSession: () => {
    const cachedUser = cacheService.getCachedUser();
    if (cachedUser) {
      set({
        user: cachedUser,
        isAuthenticated: true,
      });
    }
  },
}));
