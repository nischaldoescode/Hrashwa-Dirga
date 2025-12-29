/**
 * Configuration API
 * Handles app configuration and settings
 */

import axiosInstance from './axiosConfig';
import { AppConfig } from '@/types/game.types';
import { ApiResponse } from '@/types/api.types';

/**
 * Fetch current app configuration
 * Includes app name, logo URL, and game settings
 * @returns Complete app configuration object
 */
export const getConfig = async (): Promise<AppConfig> => {
  const response = await axiosInstance.get<ApiResponse<{ config: AppConfig }>>('/config');
  return response.data.data!.config;
};