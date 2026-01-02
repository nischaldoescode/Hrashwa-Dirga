/**
 * Authentication Related Types
 * User data structures and auth states
 */

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  coins: number;
  currentLevel: number;
  totalScore: number;
  completedLevels: number;
  rank?: number;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  dailyCoinClaim?: {
    currentStreak: number;
    lastClaimDate: string | null;
    totalClaims: number;
    canClaim: boolean;
  };
  dailyAdRewards?: {
    lastAdDate: string | null;
    adsWatchedToday: number;
    rewardsClaimedToday: number;
    maxRewardsPerDay: number;
    coinsPerAd: number;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface GoogleSignInResponse {
  success: boolean;
  message: string;
  user: User;
  token?: string;
}
