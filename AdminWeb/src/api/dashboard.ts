/**
 * Dashboard API Service
 * Handles dashboard statistics and analytics
 */

import axiosInstance from './axios'
import type { ApiResponse, DashboardStats } from '@/types'

/**
 * Fetch dashboard statistics
 * Returns overview metrics for admin panel
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axiosInstance.get<ApiResponse<{ stats: DashboardStats }>>(
    '/admin/dashboard-stats'
  )
  return response.data.data!.stats
}