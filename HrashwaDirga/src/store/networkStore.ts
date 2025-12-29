/**
 * Network Store
 * Manages network connectivity state
 */

import { create } from 'zustand';

interface NetworkStore {
  isOnline: boolean;
  showOfflineBanner: boolean;
  
  setOnline: (online: boolean) => void;
  setShowOfflineBanner: (show: boolean) => void;
}

/**
 * Create network store
 * Tracks connectivity status across app
 */
export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true,
  showOfflineBanner: false,

  /**
   * Update online status
   * @param online Network connectivity status
   */
  setOnline: (online) => {
    set({ isOnline: online });
  },

  /**
   * Control offline banner visibility
   * @param show Banner visibility status
   */
  setShowOfflineBanner: (show) => {
    set({ showOfflineBanner: show });
  },
}));