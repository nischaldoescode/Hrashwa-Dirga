/**
 * Card Component
 * Reusable container with elevation, animations, and hover effects
 */

import React from 'react';
import {
  ViewStyle,
  TouchableWithoutFeedback,
  View,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, SPACING, RADIUS } from '@/utils/constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  animated?: boolean;
  delay?: number;
  pressable?: boolean;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = true,
  animated = false,
  delay = 0,
  pressable = false,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animationProps = animated
    ? {
        entering: FadeIn.delay(delay).duration(300),
        exiting: FadeOut.duration(200),
      }
    : {};

  const handlePressIn = () => {
    if (pressable) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 150,
      });
    }
  };

  const handlePressOut = () => {
    if (pressable) {
      scale.value = withSpring(1);
    }
  };

  const cardStyle = {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    overflow: 'hidden' as const,
    // Static border with no shadow
    borderWidth: 1,
    borderColor: COLORS.border,
    // Completely disable shadows
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  };

  const elevatedStyle = elevated ? {
    // Add subtle elevation without shadow animation
    borderColor: COLORS.primaryLight,
    borderWidth: 1.5,
  } : {};

  const content = (
    <Animated.View
      style={[
        cardStyle,
        elevatedStyle,
        animatedStyle,
        style,
      ]}
      {...animationProps}
    >
      {children}
    </Animated.View>
  );

  if (pressable && onPress) {
    return (
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {content}
      </TouchableWithoutFeedback>
    );
  }

  return content;
};