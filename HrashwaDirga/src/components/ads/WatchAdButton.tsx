/**
 * Watch Ad Button Component
 * Button to watch rewarded ads with reward counter
 */

import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { adMobService } from '@/services/adMobService';
import { getAdRewardStatus, claimAdReward, AdRewardStatus } from '@/api/adApi';
import { toast } from '@/utils/toast';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface WatchAdButtonProps {
  onRewardEarned: (coins: number) => void;
}

export const WatchAdButton: React.FC<WatchAdButtonProps> = ({
  onRewardEarned,
}) => {
  const [loading, setLoading] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<AdRewardStatus | null>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    loadRewardStatus();

    // Pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const loadRewardStatus = async () => {
    try {
      const status = await getAdRewardStatus();
      setRewardStatus(status);
    } catch (error) {
      console.error('Failed to load ad reward status:', error);
    }
  };

  const handleWatchAd = async () => {
    if (loading) return;

    ReactNativeHapticFeedback.trigger('impactMedium');

    // Check if ad is ready
    if (!adMobService.isRewardedAdReady()) {
      toast.info('Ad is loading, please wait...', 'short');
      return;
    }

    try {
      setLoading(true);

      // Show the ad
      const result = await adMobService.showRewardedAd();

      if (!result.watched) {
        toast.error('Failed to show ad. Please try again.', 'short');
        setLoading(false);
        return;
      }

      if (!result.earned) {
        toast.info('You need to watch the full ad to earn reward', 'short');
        setLoading(false);
        return;
      }

      // User watched full ad, claim reward from backend
      const rewardResult = await claimAdReward();

      if (rewardResult.rewardGiven) {
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        toast.success(
          `You earned ${rewardResult.coinsEarned} coins! ${rewardResult.rewardsRemaining} reward(s) remaining today`,
          'long',
        );
        onRewardEarned(rewardResult.coinsEarned);
      } else {
        toast.info(
          'Daily ad reward limit reached. Come back tomorrow!',
          'long',
        );
      }

      // Reload status
      await loadRewardStatus();
    } catch (error) {
      console.error('Watch ad error:', error);
      toast.error('Failed to process ad reward', 'short');
    } finally {
      setLoading(false);
    }
  };

  if (!rewardStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <AnimatedTouchable
      style={[styles.container, animatedStyle]}
      onPress={handleWatchAd}
      disabled={loading}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="play-circle"
          size={32}
          color={COLORS.white}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Watch Ad</Text>
        <Text style={styles.subtitle}>
          {rewardStatus.remaining > 0
            ? `Earn ${rewardStatus.coinsPerAd} coins`
            : 'No rewards left today'}
        </Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {`${rewardStatus.remaining}/${rewardStatus.maxRewardsPerDay}`}
        </Text>
      </View>
      {/* Info Icon */}
      <TouchableOpacity
        style={styles.infoIcon}
        onPress={() => {
          toast.info(
            `You can watch ads unlimited times, but only earn rewards for the first ${rewardStatus.maxRewardsPerDay} ads per day (${rewardStatus.coinsPerAd} coins each)`,
            'long',
          );
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={20}
          color={COLORS.white}
        />
      </TouchableOpacity>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.white} size="small" />
        </View>
      )}
    </AnimatedTouchable>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: COLORS.successDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  badge: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  badgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.success,
  },
  infoIcon: {
    marginLeft: SPACING.sm,
    padding: SPACING.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    right: SPACING.md,
  },
});
