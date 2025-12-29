/**
 * Offline Banner Component
 * Displays at top of screen when network disconnected
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { COLORS, FONTS, SPACING } from '@/utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface OfflineBannerProps {
  visible: boolean;
}

/**
 * Banner showing offline status with animation
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible }) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInUp.duration(300)}
      exiting={SlideOutUp.duration(250)}
      style={[styles.banner, { paddingTop: insets.top + SPACING.sm }]}
    >
      <Text style={styles.text}>You are offline. Using cached data.</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    zIndex: 1000,
  },
  text: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.black,
    textAlign: 'center',
  },
});