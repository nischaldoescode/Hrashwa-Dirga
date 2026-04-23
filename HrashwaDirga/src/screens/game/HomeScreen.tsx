/**
 * home screen.
 * hero greeting section, stats grid, streak, play card.
 * scroll-aware header with gold fill border.
 * offline users cannot pull-to-refresh.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ScrollAwareHeader } from '@/components/common/ScrollAwareHeader';
import {
  getDailyClaimStatus,
  claimDailyCoins,
  DailyClaimStatus,
} from '@/api/coinApi';
import { DailyCoinClaimModal } from '@/components/coins/DailyCoinClaimModal';
import { toast } from '@/utils/toast';
import { useAuthStore } from '@/store/authStore';
import { useCache } from '@/hooks/useCache';
import { useNetwork } from '@/hooks/useNetwork';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { formatNumber } from '@/utils/helpers';
import { GradientBackground } from '@/components/common/GradientBackground';
import { WatchAdButtonSmall } from '@/components/ads/WatchAdButtonSmall';
import { useNetworkStore } from '@/store/networkStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  /**
   * getParent() is called at render time — safe because HomeScreen
   * is always mounted inside HomeStack which is inside TopTab.
   * cache it in a ref so it doesn't change between renders.
   */
  const parentNavigationRef = React.useRef(navigation.getParent());
  const parentNavigation = parentNavigationRef.current;
  const { user, updateUserCoins } = useAuthStore();
  const { loadEssentialData } = useCache();
  const { showOfflineBanner } = useNetwork();
  const { isOnline } = useNetworkStore();

  const [refreshing, setRefreshing] = React.useState(false);
  const [showCoinModal, setShowCoinModal] = React.useState(false);
  const [dailyClaimStatus, setDailyClaimStatus] =
    React.useState<DailyClaimStatus | null>(null);
  const [claiming, setClaiming] = React.useState(false);
  const coinDisplayRef = React.useRef<View>(null);
  const [coinPosition, setCoinPosition] = React.useState({ x: 0, y: 0 });
  const [coinPositionMeasured, setCoinPositionMeasured] = React.useState(false);
  const offlineBannerShakeRef = React.useRef<(() => void) | null>(null);

  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: e => {
      scrollY.value = e.contentOffset.y;
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadEssentialData();
    await checkDailyClaim();
  };

  const checkDailyClaim = async () => {
    try {
      const status = await getDailyClaimStatus();
      setDailyClaimStatus(status);
      if (status.canClaim && status.isFirstClaim) {
        setShowCoinModal(true);
      }
    } catch (error) {
      console.error('Failed to check daily claim status:', error);
    }
  };

  const handleClaimDailyCoins = async () => {
    if (!dailyClaimStatus?.canClaim) return;
    try {
      setClaiming(true);
      const result = await claimDailyCoins();
      const { updateUserCoins: updateCoins } = useAuthStore.getState();
      updateCoins(result.newBalance);
      toast.success(result.message, 'short');
      setTimeout(() => {
        setShowCoinModal(false);
        setClaiming(false);
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
    if (!isOnline) {
      /** shake the banner to signal that refresh is not available */
      offlineBannerShakeRef.current?.();
      return;
    }
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePlayNow = () => {
    navigation.navigate('Levels' as never);
  };

  const handleCoinPress = async () => {
    try {
      const status = await getDailyClaimStatus();
      setDailyClaimStatus(status);
      setShowCoinModal(true);
    } catch (error) {
      toast.error('Could not load coin status', 'short');
    }
  };

  if (!user) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <LoadingSpinner message="Loading..." />
      </>
    );
  }

  return (
    <GradientBackground variant="default">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollAwareHeader
        title="HOME"
        scrollY={scrollY}
        borderColor="#DDD4C8"
        fillColor="#B8956A"
        bgColor="rgba(247,244,240,0.93)"
        textColor={COLORS.text}
      />

      <OfflineBanner
        visible={showOfflineBanner}
        onRetry={handleRefresh}
        shakeRef={offlineBannerShakeRef}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 96 },
        ]}
        refreshControl={
          isOnline ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
              progressViewOffset={insets.top + 96}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {/** name card — creative replacement for greeting text */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(400)}
          style={styles.nameCard}
        >
          <View style={styles.nameCardLeft}>
            <Text style={styles.nameCardLabel}>PLAYING AS</Text>
            <Text style={styles.nameCardName} numberOfLines={1}>
              {user.username
                ? `@${user.username}`
                : user.displayName?.split(' ')[0] ?? user.displayName}
            </Text>
            {user.rank && (
              <View style={styles.rankPill}>
                <Text style={styles.rankPillText}>#{user.rank} Global</Text>
              </View>
            )}
          </View>
          <View style={styles.nameCardRight}>
            <WatchAdButtonSmall
              user={user}
              onRewardClaimed={coins => updateUserCoins(user.coins + coins)}
            />
            <TouchableOpacity
              style={styles.coinBadge}
              onPress={handleCoinPress}
              activeOpacity={0.75}
              ref={coinDisplayRef}
              onLayout={() => {
                setTimeout(() => {
                  coinDisplayRef.current?.measureInWindow((x, y, w, h) => {
                    setCoinPosition({ x: x + w / 2, y: y + h / 2 });
                    setCoinPositionMeasured(true);
                  });
                }, 100);
              }}
            >
              <Text style={styles.coinBadgeText}>
                {formatNumber(user?.coins ?? 0)} coins
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.statsStrip}>
          <TouchableOpacity
            style={styles.statCell}
            onPress={() => {
              try {
                navigation.navigate('Levels' as never);
              } catch {
                const parent = navigation.getParent();
                parent?.navigate('HomeTab' as never);
              }
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.statAccentBar, { backgroundColor: '#A0634A' }]}
            />
            <Text style={styles.statCellValue}>{user.currentLevel}</Text>
            <Text style={styles.statCellLabel}>Level</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCell}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Leaderboard' as never);
              }
            }}
            activeOpacity={0.7}
          >
            <View
              style={[styles.statAccentBar, { backgroundColor: '#6B8B50' }]}
            />
            <Text style={styles.statCellValue}>
              {user.rank ? `#${user.rank}` : '—'}
            </Text>
            <Text style={styles.statCellLabel}>Rank</Text>
          </TouchableOpacity>

          <View style={styles.statDivider} />

          <TouchableOpacity
            style={styles.statCell}
            onPress={handleCoinPress}
            activeOpacity={0.7}
          >
            <View
              style={[styles.statAccentBar, { backgroundColor: '#4A8A8A' }]}
            />
            <Text style={styles.statCellValue}>
              {formatNumber(user?.totalScore ?? 0)}
            </Text>
            <Text style={styles.statCellLabel}>Score</Text>
          </TouchableOpacity>
        </View>

        {user.dailyCoinClaim && user.dailyCoinClaim.currentStreak > 0 && (
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <TouchableOpacity
              style={styles.streakCard}
              onPress={handleCoinPress}
              activeOpacity={0.8}
            >
              <View style={styles.streakLeft}>
                <Text style={styles.streakCount}>
                  {user.dailyCoinClaim.currentStreak}
                </Text>
                <Text style={styles.streakCountLabel}>
                  day{user.dailyCoinClaim.currentStreak > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.streakMiddle}>
                <Text style={styles.streakTitle}>Daily Streak</Text>
                <Text style={styles.streakSub}>
                  Keep playing to earn bonus coins
                </Text>
                {/** dot progress for 5-day streak cycle */}
                <View style={styles.streakDots}>
                  {[1, 2, 3, 4, 5].map(day => (
                    <View
                      key={day}
                      style={[
                        styles.streakDot,
                        day <= (user.dailyCoinClaim?.currentStreak ?? 0) % 5 ||
                        (user.dailyCoinClaim?.currentStreak ?? 0) >= 5
                          ? styles.streakDotFilled
                          : null,
                      ]}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.streakChevron}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/** progress card */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)}>
          <Card style={styles.progressCard}>
            <Text style={styles.sectionLabel}>Your Progress</Text>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{user.completedLevels}</Text>
                <Text style={styles.progressLabel}>Completed</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>
                  {formatNumber(user?.totalScore ?? 0)}
                </Text>
                <Text style={styles.progressLabel}>Total Score</Text>
              </View>
              <View style={styles.progressDivider} />
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>{user.coins ?? 0}</Text>
                <Text style={styles.progressLabel}>Coins</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/** play card — primary CTA */}

        <TouchableOpacity
          style={styles.playCard}
          onPress={handlePlayNow}
          activeOpacity={0.82}
        >
          <View style={styles.playCardLeft}>
            <Text style={styles.playCardTitle}>Ready to play?</Text>
            <Text style={styles.playCardSub}>
              Test your knowledge and climb the ranks
            </Text>
          </View>
          <View style={styles.playCardArrow}>
            <Text style={styles.playCardArrowText}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.ScrollView>

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
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 140,
  },

  /** name card replaces hero greeting */
  nameCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  nameCardLeft: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  nameCardRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  nameCardLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  nameCardName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  statAccentBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  rankPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(184,149,106,0.15)',
    borderRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(184,149,106,0.3)',
  },
  rankPillText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
  },
  heroRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  coinBadge: {
    backgroundColor: 'rgba(184,149,106,0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(184,149,106,0.3)',
  },
  coinBadgeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  coinBadgeIcon: {
    fontSize: 14,
  },

  /** stats strip */
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  statCellEmoji: {
    fontSize: 22,
    marginBottom: SPACING.xs,
  },
  statCellValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  statCellLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(184,149,106,0.08)',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(184,149,106,0.28)',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  streakLeft: {
    alignItems: 'center',
    minWidth: 44,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  streakCount: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    lineHeight: 28,
  },
  streakCountLabel: {
    fontSize: 9,
    fontWeight: FONTS.weights.bold,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  streakMiddle: {
    flex: 1,
  },
  streakTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 2,
  },
  streakSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 5,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(184,149,106,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(184,149,106,0.35)',
  },
  streakDotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  streakChevron: {
    fontSize: 24,
    color: COLORS.primary,
    lineHeight: 28,
  },

  /** progress card */
  progressCard: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },

  /** play CTA card */
  playCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  playCardLeft: {
    flex: 1,
  },
  playCardTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  playCardSub: {
    fontSize: FONTS.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  playCardArrow: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCardArrowText: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 34,
  },
});
