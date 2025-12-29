/**
 * Toast Utility
 * Platform-specific toast notifications
 */

import { Platform, ToastAndroid } from 'react-native';
import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastDuration = 'short' | 'long';

interface ToastOptions {
  type?: ToastType;
  duration?: ToastDuration;
  position?: 'top' | 'center' | 'bottom';
}

/**
 * Show toast notification
 * Uses ToastAndroid on Android, Alert on iOS
 */
export const showToast = (
  message: string,
  options: ToastOptions = {}
) => {
  const { type = 'info', duration = 'short', position = 'bottom' } = options;

  if (Platform.OS === 'android') {
    // Use native Android toast
    const toastDuration =
      duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT;

    let gravity = ToastAndroid.BOTTOM;
    if (position === 'top') gravity = ToastAndroid.TOP;
    if (position === 'center') gravity = ToastAndroid.CENTER;

    // Add emoji based on type
    let emoji = '';
    switch (type) {
      case 'success':
        emoji = '✅ ';
        break;
      case 'error':
        emoji = '❌ ';
        break;
      case 'warning':
        emoji = '⚠️ ';
        break;
      case 'info':
        emoji = 'ℹ️ ';
        break;
    }

    ToastAndroid.showWithGravity(
      emoji + message,
      toastDuration,
      gravity
    );
  } else {
    // Fallback to Alert for iOS
    Alert.alert(
      type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info',
      message,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Convenience methods for different toast types
 */
export const toast = {
  success: (message: string, duration?: ToastDuration) =>
    showToast(message, { type: 'success', duration }),

  error: (message: string, duration?: ToastDuration) =>
    showToast(message, { type: 'error', duration }),

  info: (message: string, duration?: ToastDuration) =>
    showToast(message, { type: 'info', duration }),

  warning: (message: string, duration?: ToastDuration) =>
    showToast(message, { type: 'warning', duration }),
};