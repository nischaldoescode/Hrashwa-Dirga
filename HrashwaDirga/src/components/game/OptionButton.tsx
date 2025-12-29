/**
 * Option Button Component
 * Interactive button for answer selection with animations
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import { BUTTON_SPRING_CONFIG } from '@/utils/animations';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface OptionButtonProps {
  option: string;
  index: number;
  selected: boolean;
  disabled: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  isRemoved?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * Option button with selection states and animations
 */
export const OptionButton: React.FC<OptionButtonProps> = ({
  option,
  index,
  selected,
  disabled,
  isCorrect = false,
  isWrong = false,
  isRemoved = false,
  onPress,
  style,
}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    if (!disabled && !isRemoved) {
      scale.value = withSpring(0.95, BUTTON_SPRING_CONFIG);
      ReactNativeHapticFeedback.trigger('impactLight');
    }
  }, [disabled, isRemoved]);

  const handlePressOut = useCallback(() => {
    if (!disabled && !isRemoved) {
      scale.value = withSpring(1, BUTTON_SPRING_CONFIG);
    }
  }, [disabled, isRemoved]);

  const handlePress = useCallback(() => {
    if (!disabled && !isRemoved) {
      ReactNativeHapticFeedback.trigger('impactMedium');
      onPress();
    }
  }, [disabled, isRemoved, onPress]);

  React.useEffect(() => {
    if (isWrong) {
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      ReactNativeHapticFeedback.trigger('notificationError');
    }
    if (isCorrect) {
      scale.value = withSequence(
        withSpring(1.05, BUTTON_SPRING_CONFIG),
        withSpring(1, BUTTON_SPRING_CONFIG),
      );
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    }
    if (isRemoved) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 100 }),
        withTiming(0.95, { duration: 100 }),
        withTiming(0, { duration: 200 }),
      );
      opacity.value = withTiming(0, { duration: 400 });
      translateX.value = withTiming(-50, { duration: 400 });
    }
  }, [isWrong, isCorrect, isRemoved]);

  const getButtonStyle = () => {
    if (isCorrect) return styles.correct;
    if (isWrong) return styles.wrong;
    if (selected) return styles.selected;
    if (isRemoved) return styles.removed;
    if (disabled && !isCorrect && !isWrong) return styles.disabled;
    return styles.default;
  };

  const getTextStyle = () => {
    if (isCorrect || isWrong) return styles.selectedText;
    if (selected) return styles.selectedOnlyText;
    if (isRemoved) return styles.removedText;
    return styles.defaultText;
  };

  const getIndexContainerStyle = () => {
    if (isCorrect || isWrong || selected) {
      return { backgroundColor: 'transparent', borderColor: COLORS.white };
    }
    return {};
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isRemoved}
      activeOpacity={0.8}
      style={[styles.button, getButtonStyle(), animatedStyle, style]}
    >
      <View style={[styles.indexContainer, getIndexContainerStyle()]}>
        <Text style={[styles.index, getTextStyle()]}>
          {String.fromCharCode(65 + index)}
        </Text>
      </View>
      <Text style={[styles.option, getTextStyle()]}>{option}</Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
  },
  default: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  correct: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  wrong: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  removed: {
    backgroundColor: COLORS.cardLight,
    borderColor: COLORS.border,
  },
  indexContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  index: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  option: {
    flex: 1,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
  },
  defaultText: {
    color: COLORS.text,
  },
  selectedText: {
    color: COLORS.white,
  },
  selectedOnlyText: {
    color: COLORS.white,
  },
  removedText: {
    color: COLORS.textTertiary,
  },
  disabled: {
    backgroundColor: COLORS.backgroundLight,
    borderColor: COLORS.borderLight,
  },
});
