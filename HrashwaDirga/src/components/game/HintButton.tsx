/**
 * Hint Button Component
 * Button to use hints with coin cost display
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface HintButtonProps {
  onPress: () => void;
  disabled: boolean;
  hintCost: number;
  userCoins: number;
  isOffline?: boolean;
  hintsRemainingToday?: number;
}

/**
 * Hint button with pulse animation and coin cost
 */
export const HintButton: React.FC<HintButtonProps> = ({
  onPress,
  disabled,
  hintCost,
  userCoins,
  isOffline = false,
  hintsRemainingToday = 1, // Default to 1 if not the hints is not there
}) => {
  const scale = useSharedValue(1);
  const canAfford =
    userCoins >= hintCost && !isOffline && hintsRemainingToday > 1;
  // will decide if the user can afford the hint or not

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    if (!disabled && canAfford) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [disabled, canAfford]);

  const handlePress = () => {
    if (!disabled && canAfford) {
      ReactNativeHapticFeedback.trigger('impactMedium');
      onPress();
    } else if (!canAfford) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
    }
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        (disabled || !canAfford) && styles.buttonDisabled,
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>💡</Text>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.cost,
              (!canAfford || isOffline) && styles.costDisabled,
            ]}
          >
            {isOffline
              ? 'Offline'
              : hintsRemainingToday === 0
              ? 'No hints today'
              : `${hintCost} coins (${hintsRemainingToday} left)`}
          </Text>
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.warning,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textTertiary, // Grey color
    opacity: 0.6,
  },
  buttonCannotAfford: {
    backgroundColor: COLORS.textTertiary, // Grey, not red
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: FONTS.sizes.xl,
    marginRight: SPACING.sm,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  text: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  textDisabled: {
    color: COLORS.textTertiary,
  },
  cost: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.white,
    opacity: 0.9,
  },
  costDisabled: {
    color: COLORS.textTertiary,
  },
});
