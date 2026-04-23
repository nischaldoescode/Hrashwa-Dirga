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
import { UsernameScreen } from '@/screens/auth/UsernameScreen';

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
   * phases in order:
   *  Initialize auth service and notifications
   * Restore previous session from cache
   * Load essential data if authenticated
   * Sync offline data if authenticated
   * Hide native splash screen
   */
  const initializeApp = async () => {
    try {
      setLoading(true);

      console.log('[AppNavigator] Starting app initialization...');

      // Initialize AdMob FIRST before anything else
      console.log('[AppNavigator] Initializing AdMob...');
      await adMobService.initialize();

      // Wait 1 second to coz ads start loading
      await new Promise(resolve => setTimeout(() => resolve(undefined), 1000));

      console.log('Initializing auth service...');
      authService.initialize();

      console.log('Initializing notifications...');
      await notificationService.initialize();

      // Restore session from cache
      console.log('Restoring session...');
      restoreSession();

      // Load data for authenticated users
      if (isAuthenticated) {
        console.log('Loading user data...');
        await loadEssentialData();
        await syncOfflineData();
      }

      console.log('App initialization complete');
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

  /**
   * subscribe to username specifically so AppNavigator re-renders
   * the moment setUser is called with a username value.
   */
  const user = useAuthStore(state => state.user);

  /**
   * needsUsername is true only when:
   * - user is authenticated
   * - user object exists
   * - username field is null, undefined, or empty string
   *
   * this check re-evaluates every time user object changes,
   * so setting username via setUser immediately unmounts UsernameScreen.
   */
  const needsUsername =
    isAuthenticated &&
    !!user &&
    (!user.username || user.username.trim().length === 0);

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : needsUsername ? (
        <UsernameScreen />
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};
