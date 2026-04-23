/**
 * offline banner component.
 * floats above the tab bar, not overlapping it.
 * shakes when user attempts to refresh while offline.
 * includes a retry button.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';

interface OfflineBannerProps {
  visible: boolean;
  onRetry?: () => void;
  /** call shake() from parent when user attempts offline pull-to-refresh */
  shakeRef?: React.MutableRefObject<(() => void) | null>;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  visible,
  onRetry,
  shakeRef,
}) => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(0, { duration: 40 }),
      ),
      1,
      false,
    );
  };

  useEffect(() => {
    if (shakeRef) {
      shakeRef.current = shake;
    }
  }, [shakeRef]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      /**
       * bottom: 84 puts it just above the floating tab bar (62px height + 10px gap + some breathing room).
       * zIndex 200 ensures it sits above tab bar but below modals.
       */
      style={[styles.wrapper, animatedStyle]}
    >
      <View style={styles.dot} />
      <Text style={styles.text}>No internet connection</Text>
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          activeOpacity={0.75}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    /** 62 (tab height) + 10 (bottom offset) + 10 (gap) = 82 */
    bottom: 82,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.13)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    zIndex: 200,
    gap: SPACING.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.warning,
  },
  retryButton: {
    backgroundColor: 'rgba(217, 119, 6, 0.18)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  retryText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.warning,
  },
});