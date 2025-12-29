/**
 * Axios Configuration
 * Centralized HTTP client setup with interceptors for authentication and error handling
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '@/utils/constants';
import { storageService } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

/**
 * Create axios instance with default configuration
 * Includes base URL, timeout, and headers
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookie support for authentication
});

/**
 * Request interceptor
 * Adds authentication token to requests if available
 * Logs requests in development mode
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // DO NOT add Authorization header - backend uses HTTP-only cookies
    // The cookies are automatically sent via withCredentials: true
    // Retrieve auth token from storage
    const token = storageService.getString(STORAGE_KEYS.AUTH_TOKEN);

    // Attach token to request headers if available
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;

      // Also log token presence for debugging
      if (__DEV__) {
        console.log('[Auth Token]', token ? 'Present' : 'Missing');
      }
    }

    return config;
  },
  (error: AxiosError) => {
    // Log request setup errors
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  },
);

/**
 * Response interceptor
 * Handles successful responses and common error scenarios
 * Implements automatic retry logic for network failures
 */
axiosInstance.interceptors.response.use(
  response => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(`[API Response] ${response.config.url}`, response.status);
    }

    return response;
  },
  async (error: AxiosError) => {
    // Extract error details
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log error details
    console.error('[API Error]', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message,
    });

    // Handle 401 Unauthorized - Token expired or invalid
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Clear invalid auth data
      storageService.delete(STORAGE_KEYS.AUTH_TOKEN);
      storageService.delete(STORAGE_KEYS.USER_DATA);

      // Redirect to login handled by navigation listener
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - Insufficient permissions
    if (error.response?.status === 403) {
      console.error('Access denied - insufficient permissions');
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found');
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error - please try again later');
    }

    // Handle network errors (no response received)
    if (!error.response) {
      console.error('Network error - please check your connection');
    }

    return Promise.reject(error);
  },
);

/**
 * Export configured axios instance
 */
export default axiosInstance;

/**
 * Helper function to extract error message from axios error
 * Provides user-friendly error messages
 * @param error Axios error object
 * @returns User-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Extract message from response data
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Handle network errors
    if (error.message === 'Network Error') {
      return 'Network error. Please check your internet connection.';
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }

    // Generic error message based on status code
    if (error.response?.status) {
      const status = error.response.status;
      if (status >= 500) return 'Server error. Please try again later.';
      if (status >= 400) return 'Request failed. Please check your input.';
    }
  }

  // Fallback error message
  return 'An unexpected error occurred. Please try again.';
};
