/**
 * Notification Service
 * Handles push notifications and local scheduled notifications
 * Implements Firebase Cloud Messaging and Notifee for rich notifications
 */

import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { NOTIFICATION_CHANNELS } from '@/utils/constants';

/**
 * Notification Service class
 * Manages all notification operations and scheduling
 */
class NotificationService {
  /**
   * Initialize notification service
   * Requests permissions and creates notification channels
   */
  async initialize(): Promise<void> {
    await this.requestPermissions();
    await this.createNotificationChannels();
    await this.setupMessageHandlers();
  }

  /**
   * Request notification permissions from user
   * Handles both iOS and Android permission requests
   * @returns Authorization status
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled;
      } else {
        const permission = await notifee.requestPermission();
        return permission.authorizationStatus >= 1;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Create notification channels for Android
   * Organizes notifications by type for better user control
   */
  async createNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.DAILY_COINS,
        name: 'Daily Coins',
        description: 'Notifications for daily coin rewards',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.LEVEL_COMPLETE,
        name: 'Level Completion',
        description: 'Notifications when you complete a level',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });

      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.STREAK_REMINDER,
        name: 'Streak Reminders',
        description: 'Reminders to maintain your playing streak',
        importance: AndroidImportance.DEFAULT,
        sound: 'default',
      });

      await notifee.createChannel({
        id: NOTIFICATION_CHANNELS.LEADERBOARD,
        name: 'Leaderboard Updates',
        description: 'Your leaderboard position updates',
        importance: AndroidImportance.LOW,
        sound: 'default',
      });
    }
  }

  /**
   * Setup Firebase message handlers
   * Handles foreground and background notifications
   */
  async setupMessageHandlers(): Promise<void> {
    messaging().onMessage(async remoteMessage => {
      await this.displayNotification(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || '',
        NOTIFICATION_CHANNELS.DAILY_COINS,
      );
    });

    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message received:', remoteMessage);
    });
  }

  /**
   * Get FCM token for push notifications
   * Required for sending targeted notifications from backend
   * @returns FCM registration token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Get FCM token error:', error);
      return null;
    }
  }

  /**
   * Display local notification immediately
   * @param title Notification title
   * @param body Notification body text
   * @param channelId Android notification channel
   */
  async displayNotification(
    title: string,
    body: string,
    channelId: string = NOTIFICATION_CHANNELS.DAILY_COINS,
  ): Promise<void> {
    try {
      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId,
          smallIcon: 'ic_notification',
          color: '#6366F1',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      });
    } catch (error) {
      console.error('Display notification error:', error);
    }
  }

  /**
   * Schedule daily coin reminder notification
   * Triggers at 9 AM local time every day
   */
  async scheduleDailyCoinsReminder(): Promise<void> {
    try {
      // Cancel any existing daily coins notifications first
      const existingNotifications = await notifee.getTriggerNotifications();

      for (const trigger of existingNotifications) {
        const notificationTitle = trigger.notification?.title;
        const triggerId = (trigger as any).id; // bypass type issue safely

        if (notificationTitle === 'Daily Coins Available' && triggerId) {
          await notifee.cancelTriggerNotification(triggerId);
        }
      }

      const now = new Date();
      const trigger = new Date();
      trigger.setHours(9, 0, 0, 0);

      if (trigger.getTime() <= now.getTime()) {
        trigger.setDate(trigger.getDate() + 1);
      }

      await notifee.createTriggerNotification(
        {
          id: 'daily-coins-reminder', // Unique ID to prevent duplicates
          title: 'Daily Coins Available',
          body: 'Your daily coins are waiting. Open the app to claim them!',
          android: {
            channelId: NOTIFICATION_CHANNELS.DAILY_COINS,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: trigger.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        },
      );

      console.log(
        'Daily coins reminder scheduled for:',
        trigger.toLocaleString(),
      );
    } catch (error) {
      console.error('Schedule daily notification error:', error);
    }
  }

  /**
   * Schedule evening streak reminder
   * Triggers at 8 PM if user hasn't played today
   */
  async scheduleStreakReminder(): Promise<void> {
    try {
      // Cancel any existing streak reminder notifications first
      const existingNotifications = await notifee.getTriggerNotifications();

      for (const trigger of existingNotifications) {
        const notificationTitle = trigger.notification?.title;
        const triggerId = (trigger as any).id;

        if (notificationTitle === 'Keep Your Streak Going' && triggerId) {
          await notifee.cancelTriggerNotification(triggerId);
        }
      }

      // Schedule new one
      const trigger = new Date();
      trigger.setHours(20, 0, 0, 0);

      if (trigger.getTime() <= Date.now()) {
        trigger.setDate(trigger.getDate() + 1);
      }

      await notifee.createTriggerNotification(
        {
          id: 'streak-reminder', // Unique ID
          title: 'Keep Your Streak Going',
          body: 'Play today to maintain your winning streak.',
          android: {
            channelId: NOTIFICATION_CHANNELS.STREAK_REMINDER,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: trigger.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        },
      );

      console.log('Streak reminder scheduled for:', trigger.toLocaleString());
    } catch (error) {
      console.error('Schedule streak reminder error:', error);
    }
  }

  /**
   * Show level completion notification
   * Immediate notification with celebration
   * @param levelNumber Completed level number
   */
  async notifyLevelComplete(levelNumber: number): Promise<void> {
    await this.displayNotification(
      'Level Complete',
      `Congratulations on completing Level ${levelNumber}`,
      NOTIFICATION_CHANNELS.LEVEL_COMPLETE,
    );
  }

  /**
   * Show leaderboard position notification
   * Updates user on their ranking
   * @param rank User's current rank
   */
  async notifyLeaderboardPosition(rank: number): Promise<void> {
    await this.displayNotification(
      'Leaderboard Update',
      `You are now ranked number ${rank} on the leaderboard`,
      NOTIFICATION_CHANNELS.LEADERBOARD,
    );
  }

  /**
   * Cancel all scheduled notifications
   * Called when user logs out
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Cancel notifications error:', error);
    }
  }
}

export const notificationService = new NotificationService();
