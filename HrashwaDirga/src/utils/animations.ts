/**
 * Animation Utilities
 * Reusable animation configurations and helpers for consistent motion design
 */

import { Easing } from 'react-native-reanimated';
import { ANIMATION_DURATION } from './constants';

/**
 * Standard easing curves for animations
 * Provides natural motion feel across the application
 */
export const EASING = {
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
  easeIn: Easing.bezier(0.42, 0, 1, 1),
  spring: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  linear: Easing.linear,
};

/**
 * Timing configuration for answer feedback animations
 * Used when user selects correct or incorrect answer
 */
export const ANSWER_FEEDBACK_CONFIG = {
  duration: ANIMATION_DURATION.fast,
  easing: EASING.easeOut,
};

/**
 * Spring configuration for button interactions
 * Creates smooth, natural press feedback
 */
export const BUTTON_SPRING_CONFIG = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

/**
 * Configuration for card entrance animations
 * Used for level cards and question cards
 */
export const CARD_ENTRANCE_CONFIG = {
  duration: ANIMATION_DURATION.normal,
  easing: EASING.easeOut,
};

/**
 * Configuration for level completion celebration
 * Includes confetti and score animations
 */
export const CELEBRATION_CONFIG = {
  duration: ANIMATION_DURATION.slow,
  easing: EASING.spring,
};

/**
 * Configuration for coin counter animations
 * Smooth number increment effect
 */
export const COIN_ANIMATION_CONFIG = {
  duration: ANIMATION_DURATION.normal,
  easing: EASING.easeInOut,
};

/**
 * Configuration for modal entrance and exit
 * Fade and scale combined for professional feel
 */
export const MODAL_CONFIG = {
  entrance: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.easeOut,
  },
  exit: {
    duration: ANIMATION_DURATION.fast,
    easing: EASING.easeIn,
  },
};

/**
 * Stagger delay for list item animations
 * Creates cascading entrance effect
 */
export const STAGGER_DELAY = 50;

/**
 * Shake animation configuration for wrong answers
 * Creates attention-grabbing error feedback
 */
export const SHAKE_CONFIG = {
  duration: 400,
  count: 3,
  intensity: 10,
};

/**
 * Pulse animation configuration for hints
 * Subtle breathing effect to draw attention
 */
export const PULSE_CONFIG = {
  duration: ANIMATION_DURATION.slow,
  minScale: 0.95,
  maxScale: 1.05,
};

/**
 * Page transition configurations
 * Smooth navigation between screens
 */
export const PAGE_TRANSITION_CONFIG = {
  slide: {
    duration: ANIMATION_DURATION.normal,
    easing: EASING.easeInOut,
  },
  fade: {
    duration: ANIMATION_DURATION.fast,
    easing: EASING.easeOut,
  },
};