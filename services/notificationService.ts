import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '@/types/task';

export class NotificationService {
  private static instance: NotificationService;
  private timeChecker: ReturnType<typeof setInterval> | null = null;
  private lastNotificationTimes: Set<string> = new Set();

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Start the time checker for daily reminders
  startDailyTimeChecker(): void {
    if (this.timeChecker) {
      clearInterval(this.timeChecker);
    }

    // Check every minute
    this.timeChecker = setInterval(() => {
      this.checkTimeAndDispatch();
    }, 60000); // 60 seconds

    // Also check immediately
    this.checkTimeAndDispatch();
  }

  // Stop the time checker
  stopDailyTimeChecker(): void {
    if (this.timeChecker) {
      clearInterval(this.timeChecker);
      this.timeChecker = null;
    }
    this.lastNotificationTimes.clear();
  }

  // Check current time and dispatch notifications if needed
  private checkTimeAndDispatch(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const timeKey = `${currentHour}:${currentMinute}`;

    // Prevent duplicate notifications in the same minute
    if (this.lastNotificationTimes.has(timeKey)) {
      return;
    }

    // Check each time slot
    if (currentHour === 9 && currentMinute === 0) {
      this.dispatchMorningReminder();
      this.lastNotificationTimes.add(timeKey);
    } else if (currentHour === 13 && currentMinute === 0) {
      this.dispatchAfternoonReminder();
      this.lastNotificationTimes.add(timeKey);
    } else if (currentHour === 18 && currentMinute === 0) {
      this.dispatchEveningReminder();
      this.lastNotificationTimes.add(timeKey);
    } else if (currentHour === 22 && currentMinute === 0) {
      this.dispatchNightReminder();
      this.lastNotificationTimes.add(timeKey);
    }

    // Clean up old time keys (keep only last 24 hours worth)
    if (this.lastNotificationTimes.size > 1440) { // 24 hours * 60 minutes
      const oldestTime = Array.from(this.lastNotificationTimes)[0];
      this.lastNotificationTimes.delete(oldestTime);
    }
  }

  // 9 AM - Morning reminder
  private async dispatchMorningReminder(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `morning-reminder-${Date.now()}`,
        content: {
          title: '🌅 Morning Check-in',
          body: 'Good morning! Ready to tackle your pending tasks today?',
          data: {
            type: 'daily-reminder',
            timeSlot: 9,
          },
          sound: 'notification.mp3',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error dispatching morning reminder:', error);
    }
  }

  // 1 PM - Afternoon reminder
  private async dispatchAfternoonReminder(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `afternoon-reminder-${Date.now()}`,
        content: {
          title: '☀️ Afternoon Reminder',
          body: 'How are your tasks going? Check what\'s still pending!',
          data: {
            type: 'daily-reminder',
            timeSlot: 13,
          },
          sound: 'notification.mp3',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error dispatching afternoon reminder:', error);
    }
  }

  // 6 PM - Evening reminder
  private async dispatchEveningReminder(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `evening-reminder-${Date.now()}`,
        content: {
          title: '🌆 Evening Review',
          body: 'Evening check: You have pending tasks to complete!',
          data: {
            type: 'daily-reminder',
            timeSlot: 18,
          },
          sound: 'notification.mp3',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error dispatching evening reminder:', error);
    }
  }

  // 10 PM - Night reminder
  private async dispatchNightReminder(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `night-reminder-${Date.now()}`,
        content: {
          title: '🌙 Night Planning',
          body: 'Before you rest, remember you have tasks for tomorrow!',
          data: {
            type: 'daily-reminder',
            timeSlot: 22,
          },
          sound: 'notification.mp3',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error dispatching night reminder:', error);
    }
  }

  // Schedule notification for a specific task
  async scheduleTaskReminder(task: Task): Promise<string | null> {
    try {
      if (!task.reminder || !task.dueDate) {
        return null;
      }

      const now = new Date();
      const reminderTime = new Date(task.reminder);

      // Don't schedule if reminder time is in the past
      if (reminderTime <= now) {
        return null;
      }

      const identifier = `task-reminder-${task.id}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `📋 Reminder: ${task.title}`,
          body: `This task is due ${this.getRelativeTimeString(new Date(task.dueDate))}. Don't forget to complete it!`,
          data: {
            taskId: task.id,
            type: 'task-reminder',
          },
          sound: 'notification.mp3',
        },
        trigger: { date: reminderTime } as any,
      });

      console.log(`Scheduled notification for task "${task.title}" at ${reminderTime.toLocaleString()}`);
      return identifier;
    } catch (error) {
      console.error('Error scheduling task reminder:', error);
      return null;
    }
  }

  // Cancel notification for a specific task
  async cancelTaskReminder(taskId: string): Promise<void> {
    try {
      const identifier = `task-reminder-${taskId}`;
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log(`Cancelled notification for task ${taskId}`);
    } catch (error) {
      console.error('Error cancelling task reminder:', error);
    }
  }

  // Schedule overdue task notification
  async scheduleOverdueNotification(overdueTasks: Task[]): Promise<void> {
    try {
      if (overdueTasks.length === 0) return;

      const now = new Date();
      const notificationTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

      await Notifications.scheduleNotificationAsync({
        identifier: 'overdue-tasks',
        content: {
          title: '⚠️ Tasks Overdue',
          body: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} that need${overdueTasks.length === 1 ? 's' : ''} attention.`,
          data: {
            type: 'overdue-reminder',
            taskIds: overdueTasks.map(t => t.id),
          },
          sound: 'notification.mp3',
        },
        trigger: {
          date: notificationTime,
        } as any,
      });

      console.log(`Scheduled overdue notification for ${overdueTasks.length} tasks`);
    } catch (error) {
      console.error('Error scheduling overdue notification:', error);
    }
  }

  // Get all scheduled notifications (for debugging)
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.stopDailyTimeChecker();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Helper function to get relative time string
  private getRelativeTimeString(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `in ${diffInMinutes} minutes`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  }

  // Send immediate notification for completed task
  async sendTaskCompletedNotification(task: Task): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `task-completed-${task.id}`,
        content: {
          title: '🎉 Well Done!',
          body: `You completed "${task.title}"! Keep up the great work!`,
          data: {
            taskId: task.id,
            type: 'task-completed',
          },
          sound: 'notification.mp3',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending task completed notification:', error);
    }
  }
} 