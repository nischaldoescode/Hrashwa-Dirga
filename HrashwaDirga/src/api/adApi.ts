/**
 * Ad API
 * Handles ad reward status and claiming
 */

import axiosInstance from './axiosConfig';
import { ApiResponse } from '@/types/api.types';

/**
 * Ad reward status response
 */
export interface AdRewardStatus {
  canClaim: boolean;
  remaining: number;
  coinsPerAd: number;
  maxRewardsPerDay: number;
  adsWatchedToday: number;
  rewardsClaimedToday: number;
}

/**
 * Ad reward claim result
 */
export interface AdRewardResult {
  rewardGiven: boolean;
  coinsEarned: number;
  newBalance: number;
  adsWatchedToday: number;
  rewardsRemaining: number;
}

/**
 * Get current ad reward status
 * @returns Ad reward eligibility and remaining counts
 */
export const getAdRewardStatus = async (): Promise<AdRewardStatus> => {
  const response = await axiosInstance.get<ApiResponse<AdRewardStatus>>(
    '/ads/reward-status'
  );
  return response.data.data!;
};

/**
 * Claim ad reward after watching ad
 * @returns Reward result with coins earned
 */
export const claimAdReward = async (): Promise<AdRewardResult> => {
  const response = await axiosInstance.post<ApiResponse<AdRewardResult>>(
    '/ads/claim-reward'
  );
  return response.data.data!;
};