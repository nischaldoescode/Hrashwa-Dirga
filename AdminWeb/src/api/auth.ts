/**
 * Authentication API Service
 * Handles admin authentication operations
 */

import axiosInstance from './axios'
import type { ApiResponse, DashboardStats, Admin } from '@/types'

/**
 * Admin login with email and password
 * Sets HTTP-only cookie on success
 */
export const login = async (email: string, password: string): Promise<Admin> => {
  const response = await axiosInstance.post<ApiResponse<{ admin: Admin }>>(
    '/admin/login',
    { email, password }
  )
  return response.data.data!.admin
}

/**
 * Admin logout
 * Clears authentication cookie
 */
export const logout = async (): Promise<void> => {
  await axiosInstance.post('/admin/logout')
}

/**
 * Check admin authentication status
 * Validates current session
 */
export const checkAuth = async (): Promise<{ authenticated: boolean; admin?: Admin }> => {
  const response = await axiosInstance.get<{
    authenticated: boolean
    admin?: Admin
  }>('/admin/check-auth')
  return response.data
}