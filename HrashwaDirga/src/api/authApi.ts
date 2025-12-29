/**
 * Authentication API
 * Handles user authentication and profile management endpoints
 */

import axiosInstance from './axiosConfig';
import { User, GoogleSignInResponse } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';

/**
 * Authenticate user with Firebase ID token
 * Exchanges Firebase token for backend session cookie
 * @param idToken Firebase ID token from Google Sign-In
 * @returns User data and authentication status
 */
export const googleSignIn = async (
  idToken: string,
): Promise<GoogleSignInResponse> => {
  const response = await axiosInstance.post<GoogleSignInResponse>(
    '/auth/google-signin',
    {
      idToken,
    },
  );

  // Extract and store the JWT token from response
  const responseData = response.data;
  if (responseData.success && responseData.token) {
    // Store token in local storage for subsequent requests
    const { storageService } = require('@/utils/storage');
    const { STORAGE_KEYS } = require('@/utils/constants');
    storageService.setString(STORAGE_KEYS.AUTH_TOKEN, responseData.token);
  }

  return responseData;
};
/**
 * Fetch current authenticated user profile
 * Retrieves complete user data including progress and coins
 * @returns User profile data
 */
export const getProfile = async (): Promise<User> => {
  const response = await axiosInstance.get<ApiResponse<{ user: User }>>(
    '/auth/profile',
  );
  console.log('[API Response - /profile]', response.data);
  return response.data.data!.user;
};

/**
 * Logout current user
 * Clears backend session cookie
 * @returns Success status
 */
export const logout = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout');
};

/**
 * Refresh daily coins for user
 * Awards 15 coins if eligible (new day since last award)
 * @returns Coin award status and current coin count
 */
export const refreshCoins = async (): Promise<{
  coinsAwarded: boolean;
  currentCoins: number;
  message: string;
}> => {
  const response = await axiosInstance.post<
    ApiResponse<{
      coinsAwarded: boolean;
      currentCoins: number;
      message: string;
    }>
  >('/auth/refresh-coins');
  return response.data.data!;
};

/**
 * Check authentication status
 * Validates if current session is still valid
 * @returns Authentication status and user data if authenticated
 */
export const checkAuth = async (): Promise<{
  authenticated: boolean;
  user?: User;
}> => {
  const response = await axiosInstance.get<{
    authenticated: boolean;
    user?: User;
  }>('/auth/check');
  return response.data;
};
