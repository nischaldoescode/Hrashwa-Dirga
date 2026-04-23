/**
 * scroll-aware header with frosted glass effect.
 * static outer border always visible.
 * fill border sweeps left-to-right on scroll, reverses on scroll up.
 * blur layer gives glass morphism without heavy rendering cost.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, FONTS } from '@/utils/constants';

interface ScrollAwareHeaderProps {
  title: string;
  scrollY: SharedValue<number>;
  icon?: React.ReactNode;
  borderColor: string;
  fillColor: string;
  bgColor: string;
  textColor: string;
}

const FILL_THRESHOLD = 60;

export const ScrollAwareHeader: React.FC<ScrollAwareHeaderProps> = ({
  title,
  scrollY,
  icon,
  borderColor,
  fillColor,
  bgColor,
  textColor,
}) => {
  const insets = useSafeAreaInsets();

  const animatedFillStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      scrollY.value,
      [0, FILL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      width: `${progress * 100}%` as any,
      opacity: progress > 0.02 ? 1 : 0,
    };
  });

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      scrollY.value,
      [0, FILL_THRESHOLD],
      [0.05, 0.18],
      Extrapolation.CLAMP,
    ),
    elevation: interpolate(
      scrollY.value,
      [0, FILL_THRESHOLD],
      [3, 12],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor, paddingTop: insets.top + SPACING.xs },
        animatedShadowStyle,
      ]}
    >
      {/** blur layer for glass effect — no absoluteFillObject */}
      <BlurView
        blurType="light"
        blurAmount={20}
        style={styles.blurAbsolute}
        reducedTransparencyFallbackColor={bgColor}
      />

      {/** solid tint over blur — controls the actual bg color */}
      <View style={[styles.tintAbsolute, { backgroundColor: bgColor }]} />

      <View style={styles.inner}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
        </View>

        {/** static base border */}
        <View style={[styles.staticBorder, { backgroundColor: borderColor }]} />

        {/** animated fill border */}
        <Animated.View
          style={[
            styles.fillBorder,
            { backgroundColor: fillColor },
            animatedFillStyle,
          ]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 100,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 1.4,
    borderTopWidth: 0,
    shadowColor: '#3E362E',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    overflow: 'hidden',
  },
  /** explicit absolute instead of deprecated StyleSheet.absoluteFillObject */
  blurAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tintAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.75,
  },
  inner: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    minHeight: 42,
    position: 'relative',
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  iconWrapper: {
    position: 'absolute',
    right: 0,
  },
  staticBorder: {
    height: 1.5,
    borderRadius: 1,
    opacity: 0.45,
  },
  fillBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2.5,
    borderRadius: 2,
  },
});
