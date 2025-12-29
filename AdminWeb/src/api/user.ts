/**
 * Users API Service
 * Handles user management operations
 */

import axiosInstance from './axios'
import type { ApiResponse, User, PaginationMeta } from '@/types'

/**
 * Fetch all users with pagination and search
 */
export const getAllUsers = async (
  page: number = 1,
  limit: number = 20,
  search: string = ''
): Promise<{ users: User[]; pagination: PaginationMeta }> => {
  const response = await axiosInstance.get<ApiResponse<{ users: User[]; pagination: PaginationMeta }>>(
    `/admin/users?page=${page}&limit=${limit}&search=${search}`
  )
  return response.data.data!
}

/**
 * Toggle user active status
 */
export const toggleUserStatus = async (userId: string): Promise<User> => {
  const response = await axiosInstance.patch<ApiResponse<{ user: User }>>(
    `/admin/users/${userId}/toggle-status`
  )
  return response.data.data!.user
}

/**
 * Delete user account
 */
export const deleteUser = async (userId: string): Promise<void> => {
  await axiosInstance.delete(`/admin/users/${userId}`)
}