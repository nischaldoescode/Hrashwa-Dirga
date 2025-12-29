/**
 * Authentication Service
 * Handles Google Sign-In integration and authentication flow
 */

import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Authentication Service class
 * Manages Firebase and Google authentication
 */
class AuthService {
  /**
   * Initialize Google Sign-In configuration
   * Must be called before using Google Sign-In
   */
  initialize(): void {
    GoogleSignin.configure({
      webClientId:
        '509425229960-cubf8omantrg5t3f5hj9rgdko9bbjvi7.apps.googleusercontent.com', // From Firebase Console
      offlineAccess: false,
    });
  }

  /**
   * Sign in with Google
   * Handles complete Google authentication flow
   * @returns Firebase ID token for backend authentication
   */
  async signInWithGoogle(): Promise<string> {
    try {
      // Check Google Play Services availability
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get Google user info
      const userInfo = await GoogleSignin.signIn();

      // Check if user cancelled the sign-in process
      if (!userInfo || userInfo.type === 'cancelled') {
        throw new Error('SIGN_IN_CANCELLED');
      }

      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: missing ID token');
      }

      // Create Firebase credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase
      const userCredential = await auth().signInWithCredential(
        googleCredential,
      );

      // Get Firebase ID token for backend use
      const firebaseIdToken = await userCredential.user.getIdToken();

      return firebaseIdToken;
    } catch (error: any) {
      // Don't log cancelled sign-ins as errors
      if (
        error.message === 'SIGN_IN_CANCELLED' ||
        error.code === 'SIGN_IN_CANCELLED' ||
        error.code === '-5'
      ) {
        // Google Sign-In cancelled code
        throw new Error('SIGN_IN_CANCELLED');
      }
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  /**
   * Sign out from Firebase and Google
   * Clears all authentication state
   */
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current Firebase user
   * @returns Firebase user or null
   */
  getCurrentUser() {
    return auth().currentUser;
  }

  /**
   * Get fresh Firebase ID token
   * Used for re-authentication
   * @returns Firebase ID token or null
   */
  async getIdToken(): Promise<string | null> {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      return await user.getIdToken(true);
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
