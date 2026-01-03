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
import { adMobService } from '@/services/adMobService';
import { useAppOpenAd } from '@/hooks/useAppOpenAd';

export const AppNavigator: React.FC = () => {
  useAppOpenAd();
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

        console.log('[AppNavigator] Starting app initialization...');

        // Initialize AdMob FIRST before anything else
        console.log('[AppNavigator] Initializing AdMob...');
        await adMobService.initialize();
        
        // Wait 1 second to ensure ads start loading
        await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));
        
        console.log('[AppNavigator] Initializing auth service...');
        authService.initialize();
        
        console.log('[AppNavigator] Initializing notifications...');
        await notificationService.initialize();
        
        // Restore session from cache
        console.log('[AppNavigator] Restoring session...');
        restoreSession();

        // Load data for authenticated users
        if (isAuthenticated) {
          console.log('[AppNavigator] Loading user data...');
          await loadEssentialData();
          await syncOfflineData();
        }
        
        console.log('[AppNavigator] ✅ App initialization complete');
      } catch (error) {
        console.error('[AppNavigator] ❌ App initialization error:', error);
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
