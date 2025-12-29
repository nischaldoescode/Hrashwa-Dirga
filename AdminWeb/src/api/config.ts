/**
 * Configuration API Service
 * Handles app configuration management for admin panel
 * 
 * All endpoints use admin authentication via HTTP-only cookie
 * Write operations are restricted to authenticated admin users
 */

import axiosInstance from './axios'
import type { ApiResponse, AppConfig, ConfigFormValues } from '@/types'

/**
 * Fetch current app configuration
 * Uses admin-specific endpoint with session cookie authentication
 * 
 * @returns {Promise<AppConfig>} Complete application configuration
 * @throws {AxiosError} If authentication fails or server error occurs
 */
export const getConfig = async (): Promise<AppConfig> => {
  const response = await axiosInstance.get<ApiResponse<{ config: AppConfig }>>(
    '/config/admin'
  )
  return response.data.data!.config
}

/**
 * Update app configuration
 * Requires admin authentication
 * 
 * @param {Partial<ConfigFormValues>} data - Configuration fields to update
 * @returns {Promise<AppConfig>} Updated configuration
 * @throws {AxiosError} If validation fails or unauthorized
 */
export const updateConfig = async (data: Partial<ConfigFormValues>): Promise<AppConfig> => {
  const response = await axiosInstance.put<ApiResponse<{ config: AppConfig }>>(
    '/config',
    data
  )
  return response.data.data!.config
}

/**
 * Upload app logo to Cloudinary
 * Replaces existing logo if present
 * 
 * @param {File} file - Image file to upload (JPEG, PNG, etc.)
 * @returns {Promise<string>} Cloudinary URL of uploaded logo
 * @throws {AxiosError} If file is invalid or upload fails
 */
export const uploadLogo = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('logo', file)

  const response = await axiosInstance.post<ApiResponse<{ logoUrl: string }>>(
    '/config/logo',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data.data!.logoUrl
}

/**
 * Delete current app logo
 * Removes logo from Cloudinary and clears configuration
 * 
 * @returns {Promise<void>}
 * @throws {AxiosError} If deletion fails
 */
export const deleteLogo = async (): Promise<void> => {
  await axiosInstance.delete('/config/logo')
}

/**
 * Update app name only
 * Quick update endpoint for app name without modifying other settings
 * 
 * @param {string} appName - New application name
 * @returns {Promise<string>} Updated app name
 * @throws {AxiosError} If validation fails
 */
export const updateAppName = async (appName: string): Promise<string> => {
  const response = await axiosInstance.patch<ApiResponse<{ appName: string }>>(
    '/config/app-name',
    { appName }
  )
  return response.data.data!.appName
}