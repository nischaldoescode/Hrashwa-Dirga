/**
 * Result Screen
 * Level completion celebration screen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { completeLevel } from '@/api/levelApi';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { formatNumber } from '@/utils/helpers';
import { GradientBackground } from '@/components/common/GradientBackground';
import { useGameStore } from '@/store/gameStore';
import { adMobService } from '@/services/adMobService';
import { claimAdReward } from '@/api/adApi';
import { toast } from '@/utils/toast';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

type ResultScreenParams = { levelId: string };

export const ResultScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: ResultScreenParams }, 'params'>>();
  const navigation = useNavigation();
  const { levelId } = route.params;
  const { user, incrementLevel, updateUserCoins } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const { levels } = useGameStore();
  const [error, setError] = useState<string | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  /** pulse animation for the celebration icon */
  const pulseScale = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    handleLevelCompletion();
  }, []);

  const handleLevelCompletion = async () => {
    if (!isOnline) {
      setError('You need to be online to complete the level.');
      return;
    }
    try {
      setIsCompleting(true);
      const result = await completeLevel(levelId);
      setCompletionData(result);
      if (result.alreadyCompleted) {
        setAlreadyCompleted(true);
      } else {
        updateUserCoins(result.currentCoins);
        incrementLevel();
        setTimeout(async () => {
          await showRewardedAdAfterCompletion();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Level completion error:', err);
      /**
       * 400 = already completed or not all questions answered.
       * show result screen gracefully instead of error modal.
       */
      if (err.response?.status === 400) {
        setAlreadyCompleted(true);
        setCompletionData({
          bonusCoins: 0,
          currentCoins: user?.coins ?? 0,
          currentLevel: user?.currentLevel ?? 1,
          totalScore: user?.totalScore ?? 0,
          alreadyCompleted: true,
        });
      } else {
        setError('Failed to complete level. Please try again.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const showRewardedAdAfterCompletion = async () => {
    try {
      if (!adMobService.isRewardedAdReady()) return;
      const result = await adMobService.showRewardedAd();
      if (!result.watched || !result.earned) return;
      const rewardResult = await claimAdReward();
      if (rewardResult.rewardGiven) {
        toast.success(
          `+${rewardResult.coinsEarned} bonus coins from ad!`,
          'long',
        );
        updateUserCoins(rewardResult.newBalance);
      }
    } catch {}
  };

  const handleContinue = async () => {
    await adMobService.showInterstitialAd();
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' as never }, { name: 'Levels' as never }],
    });
  };

  const handleBackHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  const hasNextLevel =
    completionData &&
    completionData.currentLevel != null &&
    completionData.currentLevel <= (levels?.length ?? 0);

  const isAllLevelsComplete =
    completionData && !hasNextLevel && !alreadyCompleted;

  /** — ALL LEVELS COMPLETE — creative full-screen state */
  if (isAllLevelsComplete) {
    return (
      <GradientBackground variant="default">
        <SafeAreaView style={styles.container}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent
          />
          <View style={styles.allCompleteContainer}>
            <Animated.View
              entering={FadeInDown.duration(600)}
              style={styles.allCompleteTop}
            >
              <Animated.Text style={[styles.allCompleteEmoji, pulseStyle]}>
                👑
              </Animated.Text>
              <Text style={styles.allCompleteTitle}>
                You finished everything.
              </Text>
              <Text style={styles.allCompleteSubtitle}>
                Every level. Every question. You've reached the pinnacle of
                Hrashwa Dirga.
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(300).duration(500)}
              style={styles.allCompleteStats}
            >
              <View style={styles.allCompleteStat}>
                <Text style={styles.allCompleteStatNum}>
                  {formatNumber(completionData.totalScore)}
                </Text>
                <Text style={styles.allCompleteStatLabel}>Total Score</Text>
              </View>
              <View style={styles.allCompleteStatDivider} />
              <View style={styles.allCompleteStat}>
                <Text style={styles.allCompleteStatNum}>
                  {completionData.currentCoins}
                </Text>
                <Text style={styles.allCompleteStatLabel}>Coins Earned</Text>
              </View>
              <View style={styles.allCompleteStatDivider} />
              <View style={styles.allCompleteStat}>
                <Text style={styles.allCompleteStatNum}>
                  {levels?.length ?? 0}
                </Text>
                <Text style={styles.allCompleteStatLabel}>Levels Done</Text>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.delay(500).duration(500)}
              style={styles.allCompleteActions}
            >
              <Text style={styles.allCompleteHint}>
                More levels are coming. Check back soon.
              </Text>
              <Button
                title="Return Home"
                onPress={handleBackHome}
                variant="primary"
                size="large"
                fullWidth
              />
            </Animated.View>
          </View>
        </SafeAreaView>
      </GradientBackground>
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

        <View style={styles.content}>
          <Animated.View
            entering={FadeInDown.duration(500)}
            style={styles.animationContainer}
          >
            <Animated.Text style={[styles.celebration, pulseStyle]}>
              {alreadyCompleted ? '✅' : '🎉'}
            </Animated.Text>
            <Text style={styles.title}>
              {alreadyCompleted ? 'Already Completed' : 'Level Complete!'}
            </Text>
            <Text style={styles.subtitle}>
              {alreadyCompleted
                ? 'You reviewed this level. Keep going.'
                : 'Congratulations on finishing this level'}
            </Text>
          </Animated.View>

          {completionData && (
            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Card style={styles.statsCard} animated>
                {!alreadyCompleted && (
                  <>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Bonus Coins</Text>
                      <Text
                        style={[styles.statValue, { color: COLORS.primary }]}
                      >
                        +{completionData.bonusCoins}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                  </>
                )}
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Coins</Text>
                  <Text style={styles.statValue}>
                    {completionData.currentCoins}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Score</Text>
                  <Text style={styles.statValue}>
                    {formatNumber(completionData.totalScore)}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>
                    {alreadyCompleted ? 'Current Level' : 'Unlocked Level'}
                  </Text>
                  <Text style={styles.statValue}>
                    {completionData.currentLevel}
                  </Text>
                </View>
              </Card>
            </Animated.View>
          )}

          <Animated.View
            entering={FadeInUp.delay(350).duration(500)}
            style={styles.buttonContainer}
          >
            {hasNextLevel ? (
              <Button
                title="Continue to Next Level →"
                onPress={handleContinue}
                variant="primary"
                size="large"
                fullWidth
                style={styles.button}
              />
            ) : null}
            <Button
              title="Back to Home"
              onPress={handleBackHome}
              variant="outline"
              size="medium"
              fullWidth
              style={styles.button}
            />
          </Animated.View>
        </View>

        <Modal
          visible={!!error}
          title="Error"
          message={error || 'An error occurred'}
          onClose={() => setError(null)}
          onConfirm={() => {
            setError(null);
            navigation.navigate('Levels' as never);
          }}
          confirmText="OK"
          type="error"
          showCloseButton={false}
        />
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  celebration: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statsCard: { marginBottom: SPACING.xl },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statLabel: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  statValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  buttonContainer: { gap: SPACING.md },
  button: { marginBottom: SPACING.sm },

  /** — ALL LEVELS COMPLETE STYLES — */
  allCompleteContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl,
  },
  allCompleteTop: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  allCompleteEmoji: {
    fontSize: 96,
    marginBottom: SPACING.xl,
  },
  allCompleteTitle: {
    fontFamily: undefined,
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 38,
  },
  allCompleteSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  allCompleteStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginVertical: SPACING.xl,
  },
  allCompleteStat: {
    flex: 1,
    alignItems: 'center',
  },
  allCompleteStatNum: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  allCompleteStatLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  allCompleteStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  allCompleteActions: {
    gap: SPACING.md,
  },
  allCompleteHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
});
