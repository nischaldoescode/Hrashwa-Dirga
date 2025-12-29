/**
 * Network Hook
 * Provides network connectivity monitoring
 */

import { useEffect } from 'react';
import { useNetworkStore } from '@/store/networkStore';
import { networkService } from '@/services/networkService';

/**
 * Custom hook for network connectivity monitoring
 * Updates store with online/offline status
 * @returns Network status and banner control
 */
export const useNetwork = () => {
  const { isOnline, showOfflineBanner, setOnline, setShowOfflineBanner } = useNetworkStore();

  useEffect(() => {
    networkService.initialize();

    const unsubscribe = networkService.addListener((connected) => {
      setOnline(connected);
      setShowOfflineBanner(!connected);
    });

    networkService.checkConnection().then(setOnline);

    return () => {
      unsubscribe();
      networkService.cleanup();
    };
  }, []);

  return {
    isOnline,
    showOfflineBanner,
    hideOfflineBanner: () => setShowOfflineBanner(false),
  };
};