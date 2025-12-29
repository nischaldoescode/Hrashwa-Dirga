/**
 * Configuration Store
 * Manages app configuration and settings
 */

import { create } from 'zustand';
import { AppConfig } from '@/types/game.types';
import { cacheService } from '@/services/cacheService';

interface ConfigStore {
  config: AppConfig | null;
  isLoading: boolean;
  
  setConfig: (config: AppConfig) => void;
  setLoading: (loading: boolean) => void;
  getAppName: () => string;
  getLogoUrl: () => string;
  getHintCost: () => number;
  isInMaintenance: () => boolean;
}

/**
 * Default configuration values
 * Used as fallback when config not loaded
 */
const defaultConfig: AppConfig = {
  appName: 'Hrashwa-Dirga',
  logoUrl: '',
  appVersion: '1.0.0',
  maintenanceMode: false,
  maintenanceMessage: 'App is under maintenance.',
  gameSettings: {
    initialCoins: 30,
    dailyCoins: 15,
    hintCost: 15,
    levelCompletionBonus: 5,
    maxHintsPerQuestion: 2,
    baseScore: 10,
    hintScorePenalty: 3,
  },
};

/**
 * Create configuration store
 * Provides app-wide settings access
 */
export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  isLoading: false,

  /**
   * Set app configuration
   * Caches config for offline access
   * @param config App configuration object
   */
  setConfig: (config) => {
    set({ config });
    cacheService.cacheConfig(config);
  },

  /**
   * Set loading state for config fetch
   * @param loading Loading status
   */
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  /**
   * Get app name from config
   * @returns App name or default
   */
  getAppName: () => {
    const { config } = get();
    return config?.appName || defaultConfig.appName;
  },

  /**
   * Get logo URL from config
   * @returns Logo URL or empty string
   */
  getLogoUrl: () => {
    const { config } = get();
    return config?.logoUrl || defaultConfig.logoUrl;
  },

  /**
   * Get hint cost from game settings
   * @returns Hint cost in coins
   */
  getHintCost: () => {
    const { config } = get();
    return config?.gameSettings.hintCost || defaultConfig.gameSettings.hintCost;
  },

  /**
   * Check if app is in maintenance mode
   * @returns True if maintenance mode active
   */
  isInMaintenance: () => {
    const { config } = get();
    return config?.maintenanceMode || false;
  },
}));