/**
 * Result Screen
 * Level completion celebration screen
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { completeLevel } from '@/api/levelApi';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Modal } from '@/components/common/Modal';
import { COLORS, FONTS, SPACING } from '@/utils/constants';
import { formatNumber } from '@/utils/helpers';
import { GradientBackground } from '@/components/common/GradientBackground';
import { useGameStore } from '@/store/gameStore';

type ResultScreenParams = {
  levelId: string;
};

/**
 * Result screen with level completion animation
 */
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

  // Prevent back button navigation on Result screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Do nothing - prevent going back during result screen
        return true; // Return true to prevent default back behavior
      },
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
      updateUserCoins(result.currentCoins);
      incrementLevel();
    } catch (err: any) {
      console.error('Level completion error:', err);
      if (err.response?.status === 400) {
        setError('Level already completed or not all questions answered.');
      } else {
        setError('Failed to complete level. Please try again.');
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Levels' as never);
  };

  const handleBackHome = () => {
    navigation.navigate('Home' as never);
  };

  return (
    <GradientBackground variant="default">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={styles.content}>
          <View style={styles.animationContainer}>
            <Text style={styles.celebration}>🎉</Text>
            <Text style={styles.title}>Level Complete!</Text>
            <Text style={styles.subtitle}>
              Congratulations on finishing this level
            </Text>
          </View>

          {completionData && (
            <Card style={styles.statsCard} animated>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Bonus Coins</Text>
                <Text style={styles.statValue}>
                  +{completionData.bonusCoins}
                </Text>
              </View>
              <View style={styles.divider} />
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
                <Text style={styles.statLabel}>Next Level</Text>
                <Text style={styles.statValue}>
                  {completionData.currentLevel}
                </Text>
              </View>
            </Card>
          )}

          <View style={styles.buttonContainer}>
            {/* Only show "Continue" if there are more levels */}
            {completionData && completionData.currentLevel <= levels.length ? (
              <Button
                title="Continue to Next Level"
                onPress={handleContinue}
                variant="primary"
                size="large"
                fullWidth
                style={styles.button}
              />
            ) : (
              <Button
                title="All Levels Complete! 🎉"
                onPress={handleBackHome}
                variant="primary"
                size="large"
                fullWidth
                style={styles.button}
              />
            )}
            <Button
              title="Back to Home"
              onPress={handleBackHome}
              variant="outline"
              size="medium"
              fullWidth
              style={styles.button}
            />
          </View>
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
  statsCard: {
    marginBottom: SPACING.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  statLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  buttonContainer: {
    gap: SPACING.md,
  },
  button: {
    marginBottom: SPACING.sm,
  },
});
