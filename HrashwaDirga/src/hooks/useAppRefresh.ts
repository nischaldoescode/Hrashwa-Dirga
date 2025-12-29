/**
 * App Refresh Hook
 * Handles app refresh when network connection is restored
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNetworkStore } from '@/store/networkStore';
import { useCache } from '@/hooks/useCache';
import { storageService } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import RNRestart from 'react-native-restart';

/**
 * Custom hook to manage app refresh on network restore
 * Monitors network status and app state changes
 */
export const useAppRefresh = () => {
  const { isOnline } = useNetworkStore();
  const { loadEssentialData } = useCache();
  const appState = useRef(AppState.currentState);
  const wasOffline = useRef(!isOnline);

  /**
   * Handle app state changes
   * Detects when app comes to foreground
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Monitor network status changes
   * Reload app when connection is restored after being offline
   */
  useEffect(() => {
    if (wasOffline.current && isOnline) {
      // Connection restored - check if user data exists
      const hasUserData = storageService.contains(STORAGE_KEYS.USER_DATA);
      const hasAuthToken = storageService.contains(STORAGE_KEYS.AUTH_TOKEN);

      if (hasUserData && hasAuthToken) {
        // User is logged in - reload app to sync data
        console.log('Network restored - reloading app');
        RNRestart.Restart();
      } else {
        // No user data - just reload essential data
        loadEssentialData();
      }
    }

    wasOffline.current = !isOnline;
  }, [isOnline]);

  /**
   * Handle app state change
   * Reload data when app comes to foreground
   */
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground
      const hasUserData = storageService.contains(STORAGE_KEYS.USER_DATA);
      const hasAuthToken = storageService.contains(STORAGE_KEYS.AUTH_TOKEN);

      if (hasUserData && hasAuthToken && isOnline) {
        // Refresh data when app resumes
        loadEssentialData();
      }
    }

    appState.current = nextAppState;
  };
};
