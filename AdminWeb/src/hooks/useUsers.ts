/**
 * Users Hook
 * Manages user data and operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllUsers, toggleUserStatus, deleteUser } from '@/api/user'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/axios'

/**
 * Fetch all users with pagination and search
 * Returns empty data structure if query fails or returns undefined
 * 
 * @param {number} page - Current page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {string} search - Search query for filtering users (default: '')
 * @returns Query result with users data and pagination metadata
 */
export const useUsers = (page: number = 1, limit: number = 20, search: string = '') => {
  return useQuery({
    queryKey: [...QUERY_KEYS.USERS.ALL, page, limit, search],
    queryFn: () => getAllUsers(page, limit, search),
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    placeholderData: { 
      users: [], 
      pagination: { 
        currentPage: page, 
        totalPages: 0, 
        totalCount: 0, 
        limit: limit 
      } 
    },
  })
}

/**
 * Toggle user status mutation
 */
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => toggleUserStatus(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL })
      toast.success('User status updated successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

/**
 * Delete user mutation
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL })
      toast.success('User deleted successfully')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}