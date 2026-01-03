/**
 * Small Watch Ad Button Component
 * Compact button for header display with live status updates
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
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { adMobService } from '@/services/adMobService';
import { getAdRewardStatus, claimAdReward } from '@/api/adApi';
import { toast } from '@/utils/toast';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface WatchAdButtonSmallProps {
  user: any;
  onRewardClaimed: (coins: number) => void;
}

export const WatchAdButtonSmall: React.FC<WatchAdButtonSmallProps> = ({
  user,
  onRewardClaimed,
}) => {
  const [isAdReady, setIsAdReady] = useState<boolean | null>(null); // null = checking, true = ready, false = unavailable
  const [processing, setProcessing] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);

  // Check ad status
  useEffect(() => {
    const checkAdStatus = () => {
      const ready = adMobService.isRewardedAdReady();
      
      if (ready) {
        setIsAdReady(true);
        setCheckAttempts(0);
      } else {
        // After 10 checks (20 seconds), consider ad unavailable
        if (checkAttempts >= 10) {
          setIsAdReady(false);
        }
        setCheckAttempts(prev => prev + 1);
      }
    };

    // Initial check after 2 seconds (give time for ad to load)
    const initialTimer = setTimeout(() => {
      checkAdStatus();
    }, 2000);

    // Then check every 2 seconds
    const interval = setInterval(checkAdStatus, 2000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [checkAttempts]);

  const handlePress = async () => {
    if (processing) return;

    ReactNativeHapticFeedback.trigger('impactMedium');

    const rewardsClaimedToday = user.dailyAdRewards?.rewardsClaimedToday ?? 0;
    const maxRewardsPerDay = user.dailyAdRewards?.maxRewardsPerDay ?? 2;
    const hasRewardsLeft = rewardsClaimedToday < maxRewardsPerDay;

    // Check if ad is ready
    if (isAdReady === false) {
      toast.info('No ads available at the moment. Try again later.', 'short');
      return;
    }

    if (isAdReady === null || !isAdReady) {
      toast.info('Ad is still loading, please wait...', 'short');
      return;
    }

    try {
      setProcessing(true);

      // Show the ad (regardless of reward limit)
      const result = await adMobService.showRewardedAd();

      if (!result.watched) {
        toast.error('Failed to show ad', 'short');
        setProcessing(false);
        return;
      }

      if (!result.earned) {
        toast.info('Watch the full ad to earn reward', 'short');
        setProcessing(false);
        return;
      }

      // User watched full ad - now check if they can get reward
      if (!hasRewardsLeft) {
        // Ad watched but no reward given (limit reached)
        toast.info(
          'Ad watched! Daily reward limit reached. Come back tomorrow for more coins.',
          'long',
        );
        setProcessing(false);
        return;
      }

      // User has rewards left - claim from backend
      const rewardResult = await claimAdReward();

      if (rewardResult.rewardGiven) {
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        toast.success(
          `+${rewardResult.coinsEarned} coins! ${rewardResult.rewardsRemaining} left today`,
          'long',
        );
        onRewardClaimed(rewardResult.coinsEarned);
      } else {
        toast.info('Daily ad limit reached. Come back tomorrow!', 'long');
      }
    } catch (error) {
      console.error('Watch ad error:', error);
      toast.error('Failed to process ad reward', 'short');
    } finally {
      setProcessing(false);
      // Reset check attempts after watching
      setCheckAttempts(0);
      setIsAdReady(null);
    }
  };

  const rewardsClaimedToday = user.dailyAdRewards?.rewardsClaimedToday ?? 0;
  const maxRewardsPerDay = user.dailyAdRewards?.maxRewardsPerDay ?? 2;
  const hasRewardsLeft = rewardsClaimedToday < maxRewardsPerDay;

  // Determine button state
  const isLoading = isAdReady === null;
  const isUnavailable = isAdReady === false;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        !hasRewardsLeft && styles.buttonNoRewards,
        isUnavailable && styles.buttonUnavailable,
      ]}
      onPress={handlePress}
      disabled={processing}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <>
          <ActivityIndicator size="small" color={COLORS.white} />
          <Text style={styles.loadingText}>Loading...</Text>
        </>
      ) : (
        <>
          <MaterialCommunityIcons
            name="play-circle"
            size={18}
            color={COLORS.white}
          />
          <View style={styles.textContainer}>
            <Text style={styles.buttonText}>
              {isUnavailable ? 'No Ads' : 'Watch Ad'}
            </Text>
            <Text style={styles.buttonSubtext}>
              {hasRewardsLeft
                ? `${rewardsClaimedToday}/${maxRewardsPerDay} rewards`
                : 'No rewards left'}
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 6,
    shadowColor: COLORS.successDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
  },
  buttonNoRewards: {
    backgroundColor: COLORS.warning, // Orange/yellow to indicate no rewards but still clickable
    shadowColor: COLORS.warningDark,
  },
  buttonUnavailable: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.6,
  },
  textContainer: {
    flexDirection: 'column',
  },
  buttonText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    lineHeight: 14,
  },
  buttonSubtext: {
    fontSize: 10,
    color: COLORS.white,
    opacity: 0.9,
    lineHeight: 12,
  },
  loadingText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
});