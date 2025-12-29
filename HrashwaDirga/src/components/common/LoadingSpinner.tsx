/**
 * Loading Spinner Component
 * Displays loading indicator with optional message
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/utils/constants';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * Loading spinner with optional text message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  color = COLORS.primary,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});