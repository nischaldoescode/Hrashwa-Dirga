/**
 * Modal Component
 * Customizable modal with animations
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import { Button } from './Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  children?: React.ReactNode;
  showCloseButton?: boolean;
  
}

/**
 * Modal component with animated entrance and exit
 */
export const Modal: React.FC<ModalProps> = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info',
  children,
  showCloseButton = true,
}) => {
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
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(250)}
          style={styles.modalContainer}
        >
          <View style={[styles.modal, styles[type]]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {message && <Text style={styles.message}>{message}</Text>}
            {children}
            <View style={styles.buttonContainer}>
              {showCloseButton && onClose && (
                <Button
                  title={cancelText}
                  onPress={onClose}
                  variant="outline"
                  style={styles.button}
                />
              )}
              {onConfirm && (
                <Button
                  title={confirmText}
                  onPress={onConfirm}
                  variant="primary"
                  style={styles.button}
                />
              )}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
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
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  info: {
    borderTopWidth: 4,
    borderTopColor: COLORS.primary, // Warm brown
  },
  success: {
    borderTopWidth: 4,
    borderTopColor: COLORS.success, // Deep green
  },
  warning: {
    borderTopWidth: 4,
    borderTopColor: COLORS.warning, // Warm orange
  },
  error: {
    borderTopWidth: 4,
    borderTopColor: COLORS.error, // Deep red
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    lineHeight: FONTS.sizes.md * 1.5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
  },
});
