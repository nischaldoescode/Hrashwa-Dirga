/**
 * Axios Configuration
 * Centralized HTTP client with interceptors
 */

import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "@/lib/constants";

/**
 * Create axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable cookies for admin authentication
});

/**
 * Request interceptor
 * Logs requests in development mode
 */
axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`
      );
    }
    return config;
  },
  (error: AxiosError) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles common error scenarios
 */
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.url}`, response.status);
    }
    return response;
  },
  (error: AxiosError) => {
    console.error("[API Error]", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    // Handle 401 Unauthorized - redirect to login ONLY if not already on login page
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

/**
 * Extract error message from axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message === "Network Error") {
      return "Network error. Please check your connection.";
    }

    if (error.code === "ECONNABORTED") {
      return "Request timeout. Please try again.";
    }

    if (error.response?.status) {
      const status = error.response.status;
      if (status >= 500) return "Server error. Please try again later.";
      if (status >= 400) return "Request failed. Please check your input.";
    }
  }

  return "An unexpected error occurred.";
};

export default axiosInstance;
