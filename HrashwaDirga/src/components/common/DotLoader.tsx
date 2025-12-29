/**
 * Dot Loader Component
 * Animated three-dot loading indicator
 * Professional pulse animation with configurable colors and timing
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { COLORS, SPACING } from '@/utils/constants';

interface DotLoaderProps {
  /**
   * Color of the loading dots
   * @default COLORS.primary
   */
  color?: string;
  /**
   * Size of each dot in pixels
   * @default 10
   */
  size?: number;
  /**
   * Spacing between dots in pixels
   * @default 8
   */
  spacing?: number;
}

/**
 * Individual animated dot component
 * Scales up and down with staggered timing for wave effect
 */
const AnimatedDot: React.FC<{
  delay: number;
  color: string;
  size: number;
}> = ({ delay, color, size }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    // Staggered animation for wave effect
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.4, {
            duration: 400,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Bouncy easing
          }),
          withTiming(1, {
            duration: 400,
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          }),
        ),
        -1, // Infinite repeat
        false, // Don't reverse
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.4, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Dot Loader Component
 * Three animated dots with wave effect for loading states
 * Used in splash screens and loading indicators
 * 
 * @example
 * ```tsx
 * <DotLoader color={COLORS.primary} size={12} spacing={10} />
 * ```
 */
export const DotLoader: React.FC<DotLoaderProps> = ({
  color = COLORS.primary,
  size = 10,
  spacing = 8,
}) => {
  return (
    <View style={[styles.container, { gap: spacing }]}>
      <AnimatedDot delay={0} color={color} size={size} />
      <AnimatedDot delay={150} color={color} size={size} />
      <AnimatedDot delay={300} color={color} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    // Dynamic styles applied via props
  },
});