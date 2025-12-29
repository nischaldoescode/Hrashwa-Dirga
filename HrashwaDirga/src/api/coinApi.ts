/**
 * Coin API
 * Handles daily coin claim operations
 */

import apiClient from './axiosConfig';

/**
 * Daily coin claim status response
 */
export interface DailyClaimStatus {
  canClaim: boolean;
  isFirstClaim: boolean;
  currentStreak: number;
  daysUntilNextClaim: number;
  coinsToAward: number;
  streakContinues?: boolean;
  streakBroken?: boolean;
  daysMissed?: number;
  message?: string;
}

/**
 * Claim result response
 */
export interface ClaimResult {
  success: boolean;
  coinsAwarded: number;
  newBalance: number;
  currentStreak: number;
  totalClaims: number;
  nextClaimAvailable: string;
  message: string;
}

/**
 * Check if daily coins can be claimed
 * @returns Daily claim status with streak info
 */
export const getDailyClaimStatus = async (): Promise<DailyClaimStatus> => {
  const response = await apiClient.get<{ success: boolean; data: DailyClaimStatus }>(
    '/auth/daily-claim-status'
  );
  return response.data.data;
};

/**
 * Claim daily coins
 * Awards coins and updates streak
 * @returns Claim result with new balance
 */
export const claimDailyCoins = async (): Promise<ClaimResult> => {
  const response = await apiClient.post<{ success: boolean; data: ClaimResult }>(
    '/auth/claim-daily-coins'
  );
  return response.data.data;
};