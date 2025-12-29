/**
 * Custom Button Component
 * Reusable button with animations, haptic feedback, and loading state
 */

import React, { useCallback, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Layout,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import { BUTTON_SPRING_CONFIG } from '@/utils/animations';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Button component with press animations, haptic feedback, and loading state
 * @promise Smoothly animates scale and opacity during user interaction and loading
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  /**
   * Scale animation for button press interaction
   */
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.95, BUTTON_SPRING_CONFIG);
      ReactNativeHapticFeedback.trigger('impactLight');
    }
  }, [disabled, loading]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, BUTTON_SPRING_CONFIG);
  }, []);

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      ReactNativeHapticFeedback.trigger('impactMedium');
      onPress();
    }
  }, [disabled, loading, onPress]);

  /**
   * Opacity transition for loading and disabled state
   */
  useEffect(() => {
    opacity.value = withTiming(loading || disabled ? 0.6 : 1, {
      duration: 300,
    });
  }, [loading, disabled]);

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            textStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: '#ba9a74',
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: COLORS.transparent,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: COLORS.transparent,
    borderWidth: 0,
  },
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  large: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: FONTS.weights.semiBold,
    color: '#f8f4ef', // Changed from COLORS.white
  },
  primaryText: {
    color: '#f8f4ef', // Changed from COLORS.white
  },
  secondaryText: {
    color: COLORS.white,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  smallText: {
    fontSize: FONTS.sizes.sm,
  },
  mediumText: {
    fontSize: FONTS.sizes.md,
  },
  largeText: {
    fontSize: FONTS.sizes.lg,
  },
});
