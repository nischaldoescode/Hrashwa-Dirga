/**
 * Game Screen
 * Main gameplay screen with questions and answers
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useRoute,
  useNavigation,
  RouteProp,
  NavigationProp,
} from '@react-navigation/native';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStore } from '@/store/networkStore';
import { getLevelQuestions } from '@/api/levelApi';
import {
  submitAnswer as apiSubmitAnswer,
  useHint as apiUseHint,
} from '@/api/questionApi';
import { cacheService } from '@/services/cacheService';
import { QuestionCard } from '@/components/game/QuestionCard';
import { OptionButton } from '@/components/game/OptionButton';
import { HintButton } from '@/components/game/HintButton';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ScoreAnimation } from '@/components/game/ScoreAnimation';
import { CoinDisplay } from '@/components/game/CoinDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { COLORS, FONTS, SPACING, RADIUS } from '@/utils/constants';
import { QuestionWithStatus, AnswerResponse } from '@/types/game.types';
import { shuffleArray } from '@/utils/helpers';
import { toast } from '@/utils/toast';
import { storageService } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';
import { GradientBackground } from '@/components/common/GradientBackground';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { getProfile } from '@/api/authApi';
import { adMobService } from '@/services/adMobService';

type GameScreenParamList = {
  Game: { levelId: string };
  Result: { levelId: string };
};

type GameScreenRouteProp = RouteProp<GameScreenParamList, 'Game'>;
type GameScreenNavigationProp = NavigationProp<GameScreenParamList>;

/**
 * Game screen with question answering logic
 */
export const GameScreen: React.FC = () => {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { levelId } = route.params;

  const {
    currentQuestions,
    currentQuestionIndex,
    setCurrentQuestions,
    setCurrentQuestionIndex,
    setLoadingQuestions,
    isLoadingQuestions,
    addRemovedOption,
    incrementHintsUsed,
    queueOfflineAnswer,
    setCurrentLevel,
  } = useGameStore();

  const { user, updateUserCoins, updateUserScore } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [currentLevelName, setCurrentLevelName] = useState('');

  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Add effect to monitor network status:
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineData();
    }
  }, [isOnline]);

  const syncOfflineData = async () => {
    if (offlineQueue.length === 0) return;

    toast.info(`Syncing ${offlineQueue.length} answer(s)...`, 'short');

    let successCount = 0;
    let failCount = 0;

    for (const data of offlineQueue) {
      try {
        await apiSubmitAnswer(data);
        successCount++;
      } catch (error) {
        console.error('Failed to sync offline answer:', error);
        failCount++;
      }
    }

    // Clear queue regardless of success/failure
    setOfflineQueue([]);
    storageService.delete(STORAGE_KEYS.OFFLINE_QUEUE);

    if (successCount > 0) {
      toast.success(`${successCount} answer(s) synced successfully`, 'short');
    }

    if (failCount > 0) {
      toast.warning(`${failCount} answer(s) failed to sync`, 'short');
    }

    // Refresh user data after sync
    try {
      const profile = await getProfile();
      updateUserCoins(profile.coins);
      updateUserScore(profile.totalScore);
    } catch (error) {
      console.error('Failed to refresh profile after sync:', error);
    }
  };

  // Effect 1: Load questions only when levelId changes
  useEffect(() => {
    loadQuestions();
  }, [levelId]); // Only re-run when levelId changes

  // Effect 2: Handle back button separately
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Prevent back during result display
        if (showResult) {
          return true;
        }

        // Check if all questions completed
        const allCompleted = currentQuestions.every(q => q.isCompleted);

        if (allCompleted) {
          navigation.goBack();
          return true;
        }

        // Show exit confirmation for incomplete levels
        setShowExitModal(true);
        return true;
      },
    );

    return () => backHandler.remove();
  }, [showResult, currentQuestions]);

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);

      if (isOnline) {
        const data = await getLevelQuestions(levelId);
        const questionsWithShuffled = data.questions.map(q => ({
          ...q,
          shuffledOptions: shuffleArray(q.options),
          removedOptions: [],
          hintsUsed: 0,
        }));
        setCurrentQuestions(questionsWithShuffled);
        setCurrentLevelName(data.level.levelName);
      } else {
        const cached = cacheService.getCachedQuestions(levelId);
        if (cached) {
          const questionsWithShuffled = cached.map(q => ({
            ...q,
            shuffledOptions: shuffleArray(q.options),
            removedOptions: [],
            hintsUsed: 0,
          }));
          setCurrentQuestions(questionsWithShuffled);
        }
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (!showResult && !currentQuestion.isCompleted && !isSubmitting) {
      setSelectedAnswer(answer);
      // FIXED: Call submit immediately, no timeout
      handleSubmitAnswer(answer);
    }
  };

  // // New function for auto-submit
  // const handleSubmitAnswerAuto = async (answer: string) => {
  //   if (!currentQuestion || !user) return;

  //   setIsSubmitting(true);

  //   const submission = {
  //     questionId: currentQuestion.id,
  //     selectedAnswer: answer,
  //     hintsUsed: currentQuestion.hintsUsed || 0,
  //   };

  //   try {
  //     if (isOnline) {
  //       // Backend returns: { success: true, data: { isCorrect, correctAnswer, scoreEarned, ... } }
  //       const result = await apiSubmitAnswer(submission);

  //       // Extract nested data object from response
  //       const answerData = result.data;

  //       // Development logging for debugging response structure
  //       if (__DEV__) {
  //         console.log('[GameScreen] Answer submission response:', {
  //           success: result.success,
  //           isCorrect: answerData.isCorrect,
  //           scoreEarned: answerData.scoreEarned,
  //         });
  //       }

  //       // Set answer result with extracted data
  //       setAnswerResult({
  //         success: result.success,
  //         data: {
  //           isCorrect: answerData.isCorrect,
  //           correctAnswer: answerData.correctAnswer,
  //           scoreEarned: answerData.scoreEarned,
  //           currentScore: answerData.currentScore,
  //           currentCoins: answerData.currentCoins,
  //         },
  //       });

  //       // Update global user state with new coins and score
  //       updateUserCoins(answerData.currentCoins);
  //       updateUserScore(answerData.currentScore);

  //       // Display result feedback to user
  //       setShowResult(true);
  //     } else {
  //       // OFFLINE MODE: Cannot validate answer without server
  //       // Queue for sync and show warning
  //       const newQueue = [
  //         ...offlineQueue,
  //         { ...submission, timestamp: Date.now() },
  //       ];
  //       setOfflineQueue(newQueue);
  //       storageService.setObject(STORAGE_KEYS.OFFLINE_QUEUE, newQueue);

  //       // ⚠️ CRITICAL: Cannot determine correctness offline without exposing answer
  //       // Show placeholder result that will be corrected on sync
  //       toast.warning(
  //         'Offline mode: Answer will be validated when online',
  //         'long',
  //       );

  //       // Don't show result or proceed to next question
  //       // User must be online to play properly
  //       setIsSubmitting(false);
  //       return;
  //     }
  //   } catch (error) {
  //     console.error('Submit answer error:', error);
  //     toast.error('Submission failed. Please try again', 'short');
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmitAnswer = async (answer?: string) => {
    const answerToSubmit = answer || selectedAnswer;

    if (!answerToSubmit || !currentQuestion || !user) return;

    // Prevent duplicate submissions
    if (isSubmitting) return;

    setIsSubmitting(true);

    const submission = {
      questionId: currentQuestion.id,
      selectedAnswer: answerToSubmit,
      hintsUsed: currentQuestion.hintsUsed || 0,
    };

    try {
      if (isOnline) {
        // Backend returns: { success: true, data: { isCorrect, correctAnswer, scoreEarned, ... } }
        const result = await apiSubmitAnswer(submission);

        // Extract nested data object from response
        const answerData = result.data;

        // Development logging for debugging response structure
        if (__DEV__) {
          console.log('[GameScreen] Answer submission response:', {
            success: result.success,
            isCorrect: answerData.isCorrect,
            scoreEarned: answerData.scoreEarned,
          });
        }

        // Development logging for debugging response structure
        console.log('[GameScreen] Full API Response:', result);
        console.log('[GameScreen] Answer Data:', answerData);
        console.log('[GameScreen] Score Earned:', answerData.scoreEarned);

        // Set answer result with extracted data
        setAnswerResult({
          success: result.success,
          data: {
            isCorrect: answerData.isCorrect,
            correctAnswer: answerData.correctAnswer,
            scoreEarned: answerData.scoreEarned,
            currentScore: answerData.currentScore,
            currentCoins: answerData.currentCoins,
          },
        });

        // Update global user state with new coins and score
        updateUserCoins(answerData.currentCoins);
        updateUserScore(answerData.currentScore);

        // Display result feedback to user
        setShowResult(true);
      } else {
        // Queue answer for offline sync
        const newQueue = [
          ...offlineQueue,
          { ...submission, timestamp: Date.now() },
        ];
        setOfflineQueue(newQueue);
        storageService.setObject(STORAGE_KEYS.OFFLINE_QUEUE, newQueue);

        // Calculate offline result (will be validated on sync)
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        // Create result matching backend response structure
        setAnswerResult({
          success: true,
          data: {
            isCorrect,
            correctAnswer: currentQuestion.correctAnswer,
            scoreEarned: isCorrect ? 10 - submission.hintsUsed * 3 : 0,
            currentScore: user.totalScore,
            currentCoins: user.coins,
          },
        });

        // Display result to user
        setShowResult(true);

        // Inform user about offline status
        toast.info('Answer will sync when online', 'short');
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      toast.error('Submission failed. Please try again', 'short');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseHint = async () => {
    if (!currentQuestion || !user) return;

    if (!isOnline) {
      toast.warning('Hints require internet connection', 'short');
      return;
    }

    if (currentQuestion.isCompleted) {
      toast.info('Cannot use hint on completed question', 'short');
      return;
    }

    if (user.coins < 15) {
      toast.error('You need 15 coins to use a hint', 'short');
      return;
    }

    // REMOVE THE PER-QUESTION LIMIT CHECK
    // if ((currentQuestion.hintsUsed || 0) >= 2) {
    //   toast.info('Maximum 2 hints per question', 'short');
    //   return;
    // }

    try {
      const result = await apiUseHint(currentQuestion.id);

      // CHECK FOR DAILY LIMIT ERROR
      if (!result.success && (result as any).dailyLimitReached) {
        toast.error('Daily hint limit reached. Come back tomorrow!', 'long');
        return;
      }

      const optionToRemove = result.data.optionToRemove;
      const coinsRemaining = result.data.coinsRemaining;
      const hintsRemaining = result.data.hintsRemainingToday || 0;

      if (!optionToRemove) {
        console.error('No option to remove in response:', result);
        toast.error('Hint failed. Please try again.', 'short');
        return;
      }

      // Immediately update state
      addRemovedOption(currentQuestion.id, optionToRemove);
      incrementHintsUsed(currentQuestion.id);
      updateUserCoins(coinsRemaining);

      ReactNativeHapticFeedback.trigger('notificationSuccess');
      toast.success(
        `Hint used! ${hintsRemaining} hint${
          hintsRemaining === 1 ? '' : 's'
        } remaining today`,
        'short',
      );
    } catch (error: any) {
      console.error('Use hint error:', error);

      // Handle daily limit error from catch block too
      if (error.response?.data?.dailyLimitReached) {
        toast.error('Daily hint limit reached. Come back tomorrow!', 'long');
      } else {
        toast.error('Could not process hint request', 'short');
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setAnswerResult(null);
    setShowResult(false);

    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // CLEAR GAME STATE BEFORE NAVIGATING
      setCurrentQuestions([]);
      setCurrentQuestionIndex(0);
      setCurrentLevel(null);

      // Navigate to result screen
      navigation.navigate('Result', { levelId });
    }
  };

  const handleExit = async () => {
    setShowExitModal(false);

    // Show interstitial ad when quitting mid-game
    const shown = await adMobService.showInterstitialAd();
    if (shown) {
      console.log('[GameScreen] Interstitial ad shown on exit');
    }

    navigation.goBack();
  };

  // Compute derived state with hooks first
  const currentQuestionFromStore = React.useMemo(() => {
    if (!currentQuestions || currentQuestions.length === 0) {
      return null;
    }
    return currentQuestions[currentQuestionIndex];
  }, [currentQuestions, currentQuestionIndex]);

  const removedOptions = currentQuestionFromStore?.removedOptions || [];

  const filteredOptions = React.useMemo(() => {
    if (!currentQuestionFromStore) {
      return [];
    }
    const options =
      currentQuestionFromStore.shuffledOptions ||
      currentQuestionFromStore.options ||
      [];
    return options.filter(option => !removedOptions.includes(option));
  }, [currentQuestionFromStore, removedOptions]);

  // ============================================
  // NOW safe to check conditions and return early
  // ============================================
  if (isLoadingQuestions || !currentQuestion) {
    return <LoadingSpinner message="Loading questions..." />;
  }

  console.log('Filtered options:', {
    total: currentQuestionFromStore?.shuffledOptions?.length,
    removed: removedOptions.length,
    filtered: filteredOptions.length,
  });

  return (
    <GradientBackground variant="game">
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />

        <View style={styles.header}>
          <ProgressBar
            current={currentQuestionIndex + 1}
            total={currentQuestions.length}
            label={currentLevelName}
          />
          <CoinDisplay coins={user?.coins || 0} />
        </View>

        <View style={styles.gameIndicator}>
          <View style={styles.gameIndicatorDot} />
          <Text style={styles.gameIndicatorText}>IN GAME</Text>
          <View style={styles.gameIndicatorDot} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={true}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={false}
        >
          {/* Question counter outside card - more professional */}
          <View style={styles.questionHeader}>
            <Text style={styles.questionCounter}>
              Question {currentQuestionIndex + 1} of {currentQuestions.length}
            </Text>
            <View style={styles.questionProgress}>
              <View
                style={[
                  styles.questionProgressFill,
                  {
                    width: `${
                      ((currentQuestionIndex + 1) / currentQuestions.length) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          <QuestionCard questionText={currentQuestion.questionText} />

          <View style={styles.optionsContainer}>
            {filteredOptions.map((option, originalIndex) => {
              // ADDED: Check if question was previously completed
              const wasAlreadyCompleted = currentQuestion.isCompleted;

              const isCompletedAndCorrect =
                wasAlreadyCompleted &&
                currentQuestion.correctAnswer &&
                option === currentQuestion.correctAnswer;

              const isCompletedAndWrong =
                wasAlreadyCompleted &&
                currentQuestion.userAnswer &&
                option === currentQuestion.userAnswer.selectedAnswer &&
                !currentQuestion.userAnswer.isCorrect;

              const isThisCorrectAnswer =
                showResult &&
                answerResult &&
                answerResult.data &&
                option === answerResult.data.correctAnswer;

              const isThisWrongAnswer =
                showResult &&
                answerResult &&
                answerResult.data &&
                option === selectedAnswer &&
                selectedAnswer !== answerResult.data.correctAnswer;

              // Find the real index in the original shuffled options
              // This ensures A, B, C labels are consistent
              const realIndex =
                currentQuestionFromStore?.shuffledOptions?.indexOf(option) ??
                originalIndex;

              return (
                <OptionButton
                  key={option}
                  option={option}
                  index={realIndex}
                  selected={
                    wasAlreadyCompleted ? false : selectedAnswer === option
                  }
                  disabled={showResult || !!wasAlreadyCompleted}
                  isCorrect={!!(isThisCorrectAnswer || isCompletedAndCorrect)}
                  isWrong={!!(isThisWrongAnswer || isCompletedAndWrong)}
                  isRemoved={false}
                  onPress={() => handleAnswerSelect(option)}
                />
              );
            })}
          </View>

          {!showResult && !currentQuestion.isCompleted && (
            <View style={styles.hintSection}>
              <HintButton
                onPress={handleUseHint}
                disabled={
                  currentQuestion.isCompleted ||
                  (currentQuestion.hintsUsed || 0) >= 2 ||
                  !isOnline
                }
                hintCost={15}
                userCoins={user?.coins || 0}
                isOffline={!isOnline}
              />
            </View>
          )}

          {showResult && answerResult && answerResult.data && (
            <>
              <ScoreAnimation
                score={answerResult.data.scoreEarned}
                totalScore={answerResult.data.currentScore}
                visible={showResult}
                isCorrect={answerResult.data.isCorrect}
              />
            </>
          )}

          {showResult && (
            <Button
              title={
                currentQuestionIndex < currentQuestions.length - 1
                  ? 'Next Question'
                  : 'Complete Level'
              }
              onPress={handleNextQuestion}
              variant="primary"
              size="large"
              fullWidth
              style={styles.submitButton}
            />
          )}
        </ScrollView>

        <Modal
          visible={showExitModal}
          title="Exit Game"
          message="Are you sure you want to exit? Your progress will be saved."
          onClose={() => setShowExitModal(false)}
          onConfirm={handleExit}
          confirmText="Exit"
          cancelText="Continue Playing"
          type="warning"
        />

        {/* DEBUG OVERLAY - REMOVE AFTER FIXING */}
        {__DEV__ && (
          <View
            style={{
              position: 'absolute',
              top: 100,
              right: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontSize: 10 }}>
              Selected: {selectedAnswer || 'none'}
            </Text>
            <Text style={{ color: 'white', fontSize: 10 }}>
              ShowResult: {showResult ? 'true' : 'false'}
            </Text>
            <Text style={{ color: 'white', fontSize: 10 }}>
              Submitting: {isSubmitting ? 'true' : 'false'}
            </Text>
            <Text style={{ color: 'white', fontSize: 10 }}>
              Completed: {currentQuestion?.isCompleted ? 'true' : 'false'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  gameIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    opacity: 0.9,
  },
  gameIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
  },
  gameIndicatorText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
    marginHorizontal: SPACING.sm,
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120, // Increased padding to ensure button is fully visible
    flexGrow: 1, // Allow content to expand
  },
  optionsContainer: {
    marginTop: SPACING.lg,
  },
  submitButton: {
    marginTop: SPACING.xl,
  },

  questionHeader: {
    marginBottom: SPACING.lg,
  },
  questionCounter: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  questionProgress: {
    height: 4,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  questionProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  hintSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  hintInfo: {
    marginBottom: SPACING.sm,
  },
  hintLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  hintDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
