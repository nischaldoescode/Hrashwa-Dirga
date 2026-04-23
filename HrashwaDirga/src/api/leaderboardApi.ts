/**
 * Leaderboard API
 * Handles leaderboard data and user ranking
 */

import axiosInstance from './axiosConfig';
import { LeaderboardEntry } from '@/types/game.types';
import { ApiResponse } from '@/types/api.types';

/**
 * Fetch global leaderboard
 * Returns top users sorted by total score
 * @param limit Maximum number of entries to return (default: 100)
 * @returns Array of leaderboard entries with rankings
 */
export const getLeaderboard = async (
  limit: number = 100,
  country?: string,
): Promise<LeaderboardEntry[]> => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (country) params.append('country', country);

  const response = await axiosInstance.get<
    ApiResponse<{ leaderboard: LeaderboardEntry[] }>
  >(`/leaderboard?${params.toString()}`);

  return response.data.data!.leaderboard;
};

/**
 * Get current user's rank in leaderboard
 * Returns user's position among all players
 * @returns User rank and total score
 */
export const getUserRank = async (): Promise<{
  rank: number;
  totalScore: number;
}> => {
  const response = await axiosInstance.get<ApiResponse<{
    rank: number;
    totalScore: number;
  }>>('/leaderboard/my-rank');
  return response.data.data!;
};

/**
 * Fetch top N users
 * Returns limited leaderboard for quick display
 * @param limit Number of top users to return (default: 10)
 * @returns Array of top user entries
 */
export const getTopUsers = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  const response = await axiosInstance.get<ApiResponse<{ topUsers: LeaderboardEntry[] }>>(
    `/leaderboard/top-users?limit=${limit}`
  );
  return response.data.data!.topUsers;
};