/**
 * Daily Coin Claim Modal
 * Professional animated modal for claiming daily coins
 * Features smooth coin collection animation and streak display
 */

import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { Button } from '@/components/common/Button';
import { DailyClaimStatus } from '@/api/coinApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DailyCoinClaimModalProps {
  visible: boolean;
  claimStatus: DailyClaimStatus | null;
  onClaim: () => void;
  onClose: () => void;
  claiming: boolean;
  targetCoinPosition?: { x: number; y: number };
}

/**
 * Daily coin claim modal with animations
 * Shows claim button, streak info, and animates coins on collection
 */
export const DailyCoinClaimModal: React.FC<DailyCoinClaimModalProps> = ({
  visible,
  claimStatus,
  onClaim,
  onClose,
  claiming,
  targetCoinPosition = { x: SCREEN_WIDTH - 80, y: 60 },
}) => {
  const coinScale = useSharedValue(0);
  const coinOpacity = useSharedValue(0);
  const coinTranslateY = useSharedValue(0);
  const coinTranslateX = useSharedValue(0);

  const [showCoinAnimation, setShowCoinAnimation] = React.useState(false);

  useEffect(() => {
    if (visible && claimStatus?.canClaim) {
      // Reset coin animation
      coinScale.value = 0;
      coinOpacity.value = 0;
      coinTranslateY.value = 0;
      coinTranslateX.value = 0;
    }
  }, [visible]);

  const animatedCoinStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: coinScale.value },
      { translateY: coinTranslateY.value },
      { translateX: coinTranslateX.value },
    ],
    opacity: coinOpacity.value,
  }));

  const handleClaim = () => {
    console.log('Claim initiated, target position:', targetCoinPosition);
    setShowCoinAnimation(true);

    // Calculate the coin's starting position (center of modal)
    const modalCenterY = SCREEN_HEIGHT / 2;
    const modalCenterX = SCREEN_WIDTH / 2;

    // Calculate distance to target coin icon in HomeScreen header
    // Note: targetCoinPosition is already in window coordinates
    const targetX = targetCoinPosition.x - modalCenterX;
    const targetY = targetCoinPosition.y - modalCenterY;

    console.log('Animation distances:', { targetX, targetY });
    // Start coin collection animation
    coinOpacity.value = 1;

    // Step 1: Bounce in place
    coinScale.value = withSequence(
      withSpring(1.5, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 15, stiffness: 100 }),
    );

    // Step 2: Wait for bounce, then fly to target
    coinTranslateY.value = withDelay(
      600,
      withTiming(targetY, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );

    coinTranslateX.value = withDelay(
      600,
      withTiming(targetX, {
        duration: 800,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
    );

    // Step 3: Shrink as it approaches target
    coinScale.value = withDelay(
      600,
      withTiming(
        0.3,
        {
          duration: 800,
        },
        finished => {
          if (finished) {
            runOnJS(setShowCoinAnimation)(false);
            runOnJS(onClaim)();
          }
        },
      ),
    );

    // Step 4: Fade out near the end
    coinOpacity.value = withDelay(1200, withTiming(0, { duration: 200 }));
  };

  if (!visible || !claimStatus) return null;

  const { canClaim, isFirstClaim, currentStreak, coinsToAward, message } =
    claimStatus;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={canClaim ? undefined : onClose}
          disabled={claiming || showCoinAnimation}
        />

        <Animated.View
          entering={SlideInDown.duration(300).springify()}
          exiting={SlideOutDown.duration(250)}
          style={styles.modalContainer}
        >
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.icon}>🪙</Text>
              <Text style={styles.title}>
                {isFirstClaim ? 'Welcome Bonus!' : 'Daily Coins'}
              </Text>
            </View>

            {canClaim ? (
              <>
                <View style={styles.coinAmountContainer}>
                  <Text style={styles.coinAmount}>+{coinsToAward}</Text>
                  <Text style={styles.coinLabel}>Coins</Text>
                </View>

                {/* 5-Day Streak Calendar */}
                <View style={styles.streakCalendar}>
                  <Text style={styles.streakCalendarTitle}>Daily Streak</Text>
                  <View style={styles.daysContainer}>
                    {[1, 2, 3, 4, 5].map(day => {
                      const isCompleted =
                        day <=
                        currentStreak +
                          (canClaim && !claimStatus.streakBroken ? 1 : 0);
                      const isToday = day === currentStreak + 1;

                      return (
                        <View key={day} style={styles.dayItem}>
                          <View
                            style={[
                              styles.dayCircle,
                              isCompleted && styles.dayCircleCompleted,
                              isToday && canClaim && styles.dayCircleToday,
                            ]}
                          >
                            {isCompleted ? (
                              <Text style={styles.dayCheckmark}>✓</Text>
                            ) : (
                              <Text style={styles.dayNumber}>{day}</Text>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.dayLabel,
                              isCompleted && styles.dayLabelCompleted,
                            ]}
                          >
                            Day {day}
                          </Text>
                          {isToday && canClaim && (
                            <Text style={styles.todayIndicator}>Today</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Next claim timer */}
                  {!canClaim && (
                    <View style={styles.timerContainer}>
                      <Text style={styles.timerLabel}>Next claim in:</Text>
                      <Text style={styles.timerValue}>
                        {claimStatus.daysUntilNextClaim === 1
                          ? '24 hours'
                          : `${claimStatus.daysUntilNextClaim} days`}
                      </Text>
                    </View>
                  )}
                </View>

                {!isFirstClaim && claimStatus.streakBroken && (
                  <Text style={styles.streakWarning}>
                    Streak was reset. Keep playing daily to build it back!
                  </Text>
                )}

                {message && <Text style={styles.messageText}>{message}</Text>}

                <Button
                  title={isFirstClaim ? 'Claim Welcome Bonus' : 'Claim Coins'}
                  onPress={handleClaim}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={claiming || showCoinAnimation}
                  disabled={claiming || showCoinAnimation}
                  style={styles.claimButton}
                />

                <Text style={styles.disclaimer}>
                  Come back tomorrow for your next daily bonus!
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.alreadyClaimedText}>
                  {message || 'Already claimed today!'}
                </Text>

                <View style={styles.streakInfo}>
                  <Text style={styles.currentStreakLabel}>Current Streak</Text>
                  <Text style={styles.currentStreakValue}>
                    {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                  </Text>
                </View>

                <Button
                  title="Close"
                  onPress={onClose}
                  variant="outline"
                  size="medium"
                  fullWidth
                  style={styles.closeButton}
                />
              </>
            )}
          </View>
        </Animated.View>

        {showCoinAnimation && (
          <Animated.View style={[styles.flyingCoin, animatedCoinStyle]}>
            <Text style={styles.flyingCoinIcon}>🪙</Text>
          </Animated.View>
        )}
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: SCREEN_WIDTH - SPACING.xl * 2,
    maxWidth: 400,
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  coinAmountContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
    width: '100%',
  },
  coinAmount: {
    fontSize: 48,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  coinLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  streakWarning: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.warning,
    textAlign: 'center',
  },
  messageText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  claimButton: {
    marginTop: SPACING.md,
  },
  disclaimer: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  alreadyClaimedText: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  streakInfo: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.md,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  currentStreakLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  currentStreakValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  closeButton: {
    marginTop: SPACING.sm,
  },
  flyingCoin: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2 - 30,
    left: SCREEN_WIDTH / 2 - 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999, // Higher z-index
    elevation: 99999, // For Android
    pointerEvents: 'none', // Don't intercept touches
  },
  flyingCoinIcon: {
    fontSize: 60,
  },

  streakCalendar: {
    width: '100%',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.md,
  },
  streakCalendarTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayCircle: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  dayCircleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  dayCircleToday: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 3,
  },
  dayNumber: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textSecondary,
  },
  dayCheckmark: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  dayLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
  },
  dayLabelCompleted: {
    color: COLORS.success,
    fontWeight: FONTS.weights.semiBold,
  },
  todayIndicator: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginTop: SPACING.xs,
  },
  timerContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timerLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  timerValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
});
