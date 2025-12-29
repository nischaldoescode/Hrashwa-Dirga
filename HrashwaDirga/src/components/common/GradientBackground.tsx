/**
 * Gradient Background Component
 * Provides consistent static gradient across the app
 * NO ANIMATION - completely static colors
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'game';
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'default',
}) => {
  // Static colors - NO animation, NO opacity changes
  const colors =
    variant === 'game'
      ? ['#F7F4F0', '#FBF8F3', '#FDFCFB', '#F9F6F2']
      : ['#F7F4F0', '#FAF7F3', '#FCFAF7', '#F5F2EE'];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});