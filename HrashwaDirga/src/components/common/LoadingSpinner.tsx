/**
 * loading spinner component.
 * uses dot loader animation instead of native activity indicator.
 * gradient background prevents logo bleed-through.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/utils/constants';
import { DotLoader } from './DotLoader';
import { GradientBackground } from './GradientBackground';

interface LoadingSpinnerProps {
  message?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  color = COLORS.primary,
}) => {
  return (
    <GradientBackground variant="default">
      <View style={styles.container}>
        <DotLoader color={color} size={12} spacing={10} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});