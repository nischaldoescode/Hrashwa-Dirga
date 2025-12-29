/**
 * Authentication Hook
 * Manages admin authentication state and operations
 * 
 * This hook provides a centralized interface for all authentication-related
 * functionality including login, logout, and session validation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { login, logout, checkAuth } from '@/api/auth'
import { QUERY_KEYS } from '@/lib/constants'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/axios'

/**
 * Configuration options for useAuth hook
 * @property {boolean} enabled - Controls whether auth check query runs automatically
 *                                Set to false on login page to prevent unnecessary API calls
 */
interface UseAuthOptions {
  enabled?: boolean
}

/**
 * Custom hook for admin authentication management
 * 
 * @param {UseAuthOptions} options - Configuration options
 * @param {boolean} options.enabled - Enable/disable automatic auth check (default: true)
 * 
 * @returns Authentication state and methods
 * 
 * @example
 * // Default usage (auth check enabled)
 * const { isAuthenticated, login, logout } = useAuth()
 * 
 * @example
 * // Disable auth check on login page
 * const { login, isLoggingIn } = useAuth({ enabled: false })
 */
export const useAuth = (options?: UseAuthOptions) => {
  const queryClient = useQueryClient()

  /**
   * Query to check current authentication status
   * Validates admin session by checking HTTP-only cookie
   * 
   * Configuration:
   * - retry: false - Don't retry on 401 errors (user simply not authenticated)
   * - staleTime: 5min - Cache auth status for 5 minutes to reduce API calls
   * - refetchOnWindowFocus: false - Don't recheck when window regains focus
   * - refetchOnMount: false - Don't recheck when component remounts
   * - enabled: Controlled by options parameter (default: true)
   */
  const { data: authData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.AUTH.CHECK,
    queryFn: checkAuth,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: options?.enabled ?? true,
  })

  /**
   * Login mutation
   * Authenticates admin user with email and password
   * Sets HTTP-only cookie on success
   * 
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - Admin email address
   * @param {string} credentials.password - Admin password
   */
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: (admin) => {
      // Update query cache immediately with authenticated state
      // This prevents need for additional API call and enables instant navigation
      queryClient.setQueryData(QUERY_KEYS.AUTH.CHECK, {
        authenticated: true,
        admin: admin
      })
      toast.success('Logged in successfully')
    },
    onError: (error) => {
      // Display user-friendly error message from API response
      toast.error(getErrorMessage(error))
    },
  })

  /**
   * Logout mutation
   * Terminates admin session and clears authentication cookie
   * Clears all cached query data on success
   */
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Update cache to unauthenticated state immediately
      queryClient.setQueryData(QUERY_KEYS.AUTH.CHECK, {
        authenticated: false,
        admin: undefined
      })
      toast.success('Logged out successfully')
    },
    onError: (error) => {
      // Display error if logout fails (rare scenario)
      toast.error(getErrorMessage(error))
    },
  })

  /**
   * Return authentication state and control methods
   * 
   * @property {Admin|undefined} admin - Current admin user data (null if not authenticated)
   * @property {boolean} isAuthenticated - Whether user is currently authenticated
   * @property {boolean} isLoading - Whether initial auth check is in progress
   * @property {Function} login - Function to initiate login (email, password)
   * @property {Function} logout - Function to terminate session
   * @property {boolean} isLoggingIn - Whether login request is in progress
   * @property {boolean} isLoggingOut - Whether logout request is in progress
   */
  return {
    admin: authData?.admin,
    isAuthenticated: authData?.authenticated || false,
    isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  }
}