/**
 * dot loader component.
 * three dots bounce upward in a staggered wave.
 * each dot cycles through the app's warm color palette.
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
import { COLORS } from '@/utils/constants';

interface DotLoaderProps {
  size?: number;
  spacing?: number;
  color?: string; // optional prop to override default colors
}

/** three warm colors that complement the app palette */
const DOT_COLORS = [COLORS.primary, COLORS.primaryDark, '#7B9E7B'];

const AnimatedDot: React.FC<{
  delay: number;
  color: string;
  size: number;
}> = ({ delay, color, size }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    /** bounce upward then return — negative Y = up on screen */
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-14, {
            duration: 350,
            easing: Easing.bezier(0.33, 1, 0.68, 1),
          }),
          withTiming(0, {
            duration: 350,
            easing: Easing.bezier(0.33, 0, 0.68, 0),
          }),
          /** small pause at bottom before next bounce */
          withTiming(0, { duration: 200 }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.5, { duration: 350 }),
          withTiming(0.5, { duration: 200 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
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

export const DotLoader: React.FC<DotLoaderProps> = ({
  size = 12,
  spacing = 10,
  color,
}) => {
  const colors = color ? [color, color, color] : DOT_COLORS;
  return (
    <View style={[styles.container, { gap: spacing }]}>
      {DOT_COLORS.map((color, index) => (
        <AnimatedDot
          key={index}
          delay={index * 160}
          color={color}
          size={size}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    /** extra vertical space so the upward bounce isn't clipped */
    paddingTop: 20,
  },
});
