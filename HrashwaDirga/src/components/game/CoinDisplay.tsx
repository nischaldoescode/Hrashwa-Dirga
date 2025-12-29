/**
 * Coin Display Component
 * Shows user's current coin balance
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import { BUTTON_SPRING_CONFIG } from '@/utils/animations';
import { formatNumber } from '@/utils/helpers';

interface CoinDisplayProps {
  coins: number;
  onPress?: () => void;
}

/**
 * Coin balance display with bounce animation on update
 */
export const CoinDisplay: React.FC<CoinDisplayProps> = ({ coins = 0, onPress }) => {
  const scale = useSharedValue(1);
  const prevCoins = React.useRef(coins);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    if (coins !== prevCoins.current) {
      scale.value = withSequence(
        withSpring(1.2, BUTTON_SPRING_CONFIG),
        withSpring(1, BUTTON_SPRING_CONFIG),
      );
      ReactNativeHapticFeedback.trigger('impactLight');
      prevCoins.current = coins;
    }
  }, [coins]);

  const handlePress = () => {
    if (coins === 0 && onPress) {
      ReactNativeHapticFeedback.trigger('notificationWarning');
      onPress();
    }
  };

  const Container = onPress && coins === 0 ? TouchableOpacity : View as React.ComponentType<any>;

  return (
    <Container onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Text style={styles.icon}>🪙</Text>
        <Text style={styles.coins}>{formatNumber(coins)}</Text>
      </Animated.View>
      </Container> 
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  icon: {
    fontSize: FONTS.sizes.lg,
    marginRight: SPACING.xs,
  },
  coins: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
});
