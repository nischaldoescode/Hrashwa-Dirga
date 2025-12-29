/**
 * App Navigator
 * Root navigation controller
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useCache } from '@/hooks/useCache';
import { authService } from '@/services/authService';
import { notificationService } from '@/services/notificationService';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import SplashScreen from 'react-native-splash-screen';

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, restoreSession, isLoading, setLoading } =
    useAuthStore();
  const { loadEssentialData, syncOfflineData } = useCache();
  const [initializing, setInitializing] = React.useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  /**
   * Initialize app on startup
   * Steps:
   * 1. Initialize auth service and notifications
   * 2. Restore previous session from cache
   * 3. Load essential data if authenticated
   * 4. Sync offline data if authenticated
   * 5. Hide native splash screen
   */
  const initializeApp = async () => {
    try {
      setLoading(true);

      // Initialize services
      authService.initialize();
      await notificationService.initialize();

      // Restore session from cache
      restoreSession();

      // Load data for authenticated users
      if (isAuthenticated) {
        await loadEssentialData();
        await syncOfflineData();
      }
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  // Hide splash screen after initialization completes
  useEffect(() => {
    if (!initializing && !isLoading) {
      // Give a small delay to ensure first screen renders
      const timer = setTimeout(() => {
        SplashScreen.hide();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [initializing, isLoading]);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
