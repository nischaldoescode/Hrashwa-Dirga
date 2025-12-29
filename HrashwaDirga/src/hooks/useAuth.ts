/**
 * Authentication Hook
 * Provides authentication helpers and state
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { googleSignIn, logout as apiLogout } from '@/api/authApi';
import { getErrorMessage } from '@/api/axiosConfig';
import { notificationService } from '@/services/notificationService';
import { toast } from '@/utils/toast';
import { useNetworkStore } from '@/store/networkStore';
/**
 * Custom hook for authentication operations
 * @returns Auth state and methods
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    logout: storeLogout,
  } = useAuthStore();

  /**
   * Handle Google Sign-In flow
   * Complete authentication from Google to backend
   */
  const signInWithGoogle = useCallback(async () => {
    try {
      const { isOnline } = useNetworkStore.getState();

      if (!isOnline) {
        toast.error('No internet connection', 'long');
        return { success: false, error: 'No internet connection' };
      }

      setError(null);

      const firebaseToken = await authService.signInWithGoogle();
      const response = await googleSignIn(firebaseToken);

      setUser(response.user);
      await notificationService.scheduleDailyCoinsReminder();

      toast.success(`Welcome back, ${response.user.displayName}!`, 'short');
      return { success: true };
    } catch (err: any) {
      // Handle user cancellation silently
      if (err.message === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'CANCELLED', cancelled: true };
      }

      const message = getErrorMessage(err);
      setError(message);

      toast.error(`Sign-in failed: ${message}`, 'long');

      return { success: false, error: message };
    }
  }, []);

  /**
   * Handle user logout
   * Clears all auth data and cancels notifications
   */
  const logout = useCallback(async () => {
    try {
      await apiLogout();
      await authService.signOut();
      await notificationService.cancelAllNotifications();

      storeLogout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    signInWithGoogle,
    logout,
  };
};
