/**
 * Home Screen
 * Main dashboard with animated background and game-like UI
 */

import React, { useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import {
  getDailyClaimStatus,
  claimDailyCoins,
  DailyClaimStatus,
} from '@/api/coinApi';
import { DailyCoinClaimModal } from '@/components/coins/DailyCoinClaimModal';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '@/store/authStore';
import { useCache } from '@/hooks/useCache';
import { useNetwork } from '@/hooks/useNetwork';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { CoinDisplay } from '@/components/game/CoinDisplay';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { Modal } from '@/components/common/Modal';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { formatNumber } from '@/utils/helpers';
import { GradientBackground } from '@/components/common/GradientBackground';
import { WatchAdButton } from '@/components/ads/WatchAdButton';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { claimAdReward } from '@/api/adApi';
import { adMobService } from '@/services/adMobService';
/**
 * Home screen with animated background and game-like UI
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateUserCoins } = useAuthStore();
  const { loadEssentialData } = useCache();
  const { showOfflineBanner } = useNetwork();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCoinModal, setShowCoinModal] = React.useState(false);
  const [showDailyClaimModal, setShowDailyClaimModal] = React.useState(false);
  const [dailyClaimStatus, setDailyClaimStatus] =
    React.useState<DailyClaimStatus | null>(null);
  const [claiming, setClaiming] = React.useState(false);
  const coinDisplayRef = React.useRef<View>(null);
  const [coinPosition, setCoinPosition] = React.useState({ x: 0, y: 0 });
  const [coinPositionMeasured, setCoinPositionMeasured] = React.useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadEssentialData();
    await checkDailyClaim();
  };

  /**
   * Check and display daily coin claim modal
   * Called on app startup and data refresh
   */
  const checkDailyClaim = async () => {
    try {
      const status = await getDailyClaimStatus();
      setDailyClaimStatus(status);

      // Show modal automatically ONLY on first app load if can claim
      if (status.canClaim && status.isFirstClaim) {
        setShowCoinModal(true);
      }
    } catch (error) {
      console.error('Failed to check daily claim status:', error);
    }
  };

  /**
   * Handle daily coin claim
   * Awards coins and updates user balance
   */
  const handleClaimDailyCoins = async () => {
    if (!dailyClaimStatus?.canClaim) return;

    try {
      setClaiming(true);

      const result = await claimDailyCoins();

      // Update user coins in store
      const { updateUserCoins } = useAuthStore.getState();
      updateUserCoins(result.newBalance);

      toast.success(result.message, 'short');

      setTimeout(() => {
        setShowCoinModal(false); // CHANGED: close the coin modal
        setClaiming(false);

        // Refresh claim status (don't auto-show modal)
        checkDailyClaim();
      }, 1500);
    } catch (error: any) {
      console.error('Failed to claim daily coins:', error);
      toast.error(
        error.response?.data?.message || 'Claim failed. Please try again',
        'short',
      );
      setClaiming(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePlayNow = () => {
    navigation.navigate('Levels' as never);
  };

  const handleCoinPress = async () => {
    // ALWAYS show the daily claim modal when coin is clicked
    // This shows streak status whether they can claim or not
    try {
      const status = await getDailyClaimStatus();
      setDailyClaimStatus(status);
      setShowCoinModal(true); // Use the SAME state for coin modal
    } catch (error) {
      console.error('Failed to get claim status:', error);
      toast.error('Could not load coin status', 'short');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.compactAdButton}
            onPress={async () => {
              if (!adMobService.isRewardedAdReady()) {
                toast.info('Ad is loading, please wait...', 'short');
                return;
              }

              const result = await adMobService.showRewardedAd();

              if (!result.watched) {
                toast.error('Failed to show ad', 'short');
                return;
              }

              if (!result.earned) {
                toast.info('Watch the full ad to earn reward', 'short');
                return;
              }

              // Claim reward
              try {
                const rewardResult = await claimAdReward();
                if (rewardResult.rewardGiven) {
                  toast.success(
                    `You earned ${rewardResult.coinsEarned} coins!`,
                    'long',
                  );
                  if (user) {
                    updateUserCoins(user.coins + rewardResult.coinsEarned);
                  }
                }
              } catch (error) {
                console.error('Claim reward error:', error);
              }
            }}
          >
            <MaterialCommunityIcons
              name="play-circle"
              size={20}
              color={COLORS.success}
            />
            <Text style={styles.compactAdText}>Ad</Text>
          </TouchableOpacity>

          <View
            ref={coinDisplayRef}
            onLayout={() => {
              setTimeout(() => {
                coinDisplayRef.current?.measureInWindow(
                  (x, y, width, height) => {
                    setCoinPosition({
                      x: x + width / 2,
                      y: y + height / 2,
                    });
                    setCoinPositionMeasured(true);
                  },
                );
              }, 100);
            }}
          >
            <CoinDisplay coins={user?.coins ?? 0} onPress={handleCoinPress} />
          </View>
        </View>
      ),
    });
  }, [navigation, user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.textSecondary }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GradientBackground variant="default">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <OfflineBanner visible={showOfflineBanner} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Header with user info and coins */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome Back,</Text>
              <Text style={styles.username}>{user.displayName}</Text>
            </View>
          </View>

          {/* Stats card with animations */}
          <Card style={styles.statsCard}>
            <Text style={styles.cardTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              {user.completedLevels > 0 && (
                <Animated.View style={[styles.statItem]}>
                  <Text style={styles.statValue}>{user.currentLevel}</Text>
                  <Text style={styles.statLabel}>Current Level</Text>
                </Animated.View>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatNumber(user?.totalScore ?? 0)}
                </Text>
                <Text style={styles.statLabel}>Total Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.completedLevels}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </Card>

          {/* Quick Stats Cards - More interactive elements */}
          <View style={styles.quickStatsContainer}>
            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => navigation.navigate('Levels' as never)}
              activeOpacity={0.7}
            >
              <View style={styles.quickStatIcon}>
                <Text style={styles.quickStatEmoji}>🎯</Text>
              </View>
              <Text style={styles.quickStatValue}>{user.currentLevel}</Text>
              <Text style={styles.quickStatLabel}>Current Level</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={() => navigation.navigate('Leaderboard' as never)}
              activeOpacity={0.7}
            >
              <View style={styles.quickStatIcon}>
                <Text style={styles.quickStatEmoji}>🏆</Text>
              </View>
              <Text style={styles.quickStatValue}>
                {user.rank ? `#${user.rank}` : 'N/A'}
              </Text>
              <Text style={styles.quickStatLabel}>Your Rank</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickStatCard}
              onPress={handleCoinPress}
              activeOpacity={0.7}
            >
              <View style={styles.quickStatIcon}>
                <Text style={styles.quickStatEmoji}>💰</Text>
              </View>
              <Text style={styles.quickStatValue}>{user.coins ?? 0}</Text>
              <Text style={styles.quickStatLabel}>Coins</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Streak Indicator */}
          {user.dailyCoinClaim && user.dailyCoinClaim.currentStreak > 0 && (
            <Card style={styles.streakCard} pressable onPress={handleCoinPress}>
              <View style={styles.streakContent}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>
                    {user.dailyCoinClaim.currentStreak} Day Streak
                  </Text>
                  <Text style={styles.streakLabel}>
                    Keep playing daily to maintain your streak!
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Main action card */}
          <Card style={styles.playCard} elevated>
            <Text style={styles.playTitle}>Ready for Challenge?</Text>
            <Text style={styles.playDescription}>
              Test your knowledge and climb the leaderboard
            </Text>
            <View style={styles.buttonWrapper}>
              <Button
                title="Start Playing"
                onPress={handlePlayNow}
                variant="primary"
                size="medium"
                style={styles.playButton}
              />
            </View>
          </Card>
        </ScrollView>

        {/* Single modal for both coin info and daily claim */}
        {dailyClaimStatus && coinPositionMeasured && (
          <DailyCoinClaimModal
            visible={showCoinModal && dailyClaimStatus !== null}
            claimStatus={dailyClaimStatus}
            onClaim={handleClaimDailyCoins}
            onClose={() => setShowCoinModal(false)}
            claiming={claiming}
            targetCoinPosition={coinPosition}
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  scrollView: {
    flex: 2,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  username: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  levelBadge: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  statsCard: {
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    // Remove all text shadow properties
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  playCard: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    // Ensure no elevation/shadow on card
    elevation: 0,
    shadowOpacity: 0,
  },
  playTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    // Remove all text shadow properties
  },
  playDescription: {
    fontSize: FONTS.sizes.md,
    color: COLORS.text, // Changed from textSecondary for better visibility
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: FONTS.sizes.md * 1.5,
    fontWeight: FONTS.weights.medium, // Add weight for visibility
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  playButton: {
    paddingHorizontal: SPACING.xl,
    minWidth: 180, // Smaller fixed width
    maxWidth: 220,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickStatEmoji: {
    fontSize: 24,
  },
  quickStatValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  quickStatLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  streakCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 48,
    marginRight: SPACING.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  streakLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginRight: SPACING.md,
  },
  compactAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  compactAdText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
});
