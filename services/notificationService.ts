import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '@/types/task';

export class NotificationService {
  private static instance: NotificationService;
  private dailyReminderIdentifiers = [
    'daily-reminder-morning',
    'daily-reminder-afternoon', 
    'daily-reminder-evening',
    'daily-reminder-night'
  ];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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

  // Schedule daily reminders for pending tasks (4 times a day, avoiding 1-5 AM)
  async scheduleDailyReminder(): Promise<void> {
    try {
      // Check if daily reminders are already scheduled
      const existingNotifications = await this.getAllScheduledNotifications();
      const hasExistingDailyReminders = this.dailyReminderIdentifiers.some(id => 
        existingNotifications.some(notification => notification.identifier === id)
      );

      // If daily reminders are already scheduled, don't reschedule them
      if (hasExistingDailyReminders) {
        console.log('Daily reminders already scheduled, skipping...');
        return;
      }

      // Cancel existing daily reminders first (just in case)
      await this.cancelDailyReminder();

      // Schedule each reminder separately
      await this.scheduleMorningReminder();
      await this.scheduleAfternoonReminder();
      await this.scheduleEveningReminder();
      await this.scheduleNightReminder();
      
      console.log('All daily reminders scheduled successfully');
    } catch (error) {
      console.error('Error scheduling daily reminders:', error);
    }
  }

  // Schedule morning reminder (9 AM)
  async scheduleMorningReminder(): Promise<void> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0);
    
    console.log(`DEBUG Morning: Current time: ${now.toLocaleString()}`);
    console.log(`DEBUG Morning: Initial reminder time: ${reminderTime.toLocaleString()}`);
    console.log(`DEBUG Morning: Is reminder <= now? ${reminderTime <= now}`);
    
    // If 9 AM has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
      console.log(`DEBUG Morning: Moved to tomorrow: ${reminderTime.toLocaleString()}`);
    }

    // Double check the time is in the future
    if (reminderTime <= now) {
      console.error(`ERROR Morning: Reminder time is still in the past! ${reminderTime.toLocaleString()}`);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: this.dailyReminderIdentifiers[0],
      content: {
        title: '🌅 Morning Check-in',
        body: 'Good morning! Ready to tackle your pending tasks today?',
        data: {
          type: 'daily-reminder',
          timeSlot: 9,
        },
        sound: 'notification.mp3',
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      } as any,
    });

    console.log(`🌅 Morning Check-in scheduled for ${reminderTime.toLocaleString()}`);
  }

  // Schedule afternoon reminder (1 PM)
  async scheduleAfternoonReminder(): Promise<void> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(13, 0, 0, 0);
    
    console.log(`DEBUG Afternoon: Current time: ${now.toLocaleString()}`);
    console.log(`DEBUG Afternoon: Initial reminder time: ${reminderTime.toLocaleString()}`);
    console.log(`DEBUG Afternoon: Is reminder <= now? ${reminderTime <= now}`);
    
    // If 1 PM has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
      console.log(`DEBUG Afternoon: Moved to tomorrow: ${reminderTime.toLocaleString()}`);
    }

    // Double check the time is in the future
    if (reminderTime <= now) {
      console.error(`ERROR Afternoon: Reminder time is still in the past! ${reminderTime.toLocaleString()}`);
      return;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: this.dailyReminderIdentifiers[1],
      content: {
        title: '☀️ Afternoon Reminder',
        body: 'How are your tasks going? Check what\'s still pending!',
        data: {
          type: 'daily-reminder',
          timeSlot: 13,
        },
        sound: 'notification.mp3',
      },
      trigger: {
        hour: 13,
        minute: 0,
        repeats: true,
      } as any,
    });

    console.log(`☀️ Afternoon Reminder scheduled for ${reminderTime.toLocaleString()}`);
  }

  // Schedule evening reminder (6 PM)
  async scheduleEveningReminder(): Promise<void> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(18, 0, 0, 0);
    
    // If 6 PM has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: this.dailyReminderIdentifiers[2],
      content: {
        title: '🌆 Evening Review',
        body: 'Evening check: You have pending tasks to complete!',
        data: {
          type: 'daily-reminder',
          timeSlot: 18,
        },
        sound: 'notification.mp3',
      },
      trigger: {
        hour: 18,
        minute: 0,
        repeats: true,
      } as any,
    });

    console.log(`🌆 Evening Review scheduled for ${reminderTime.toLocaleString()}`);
  }

  // Schedule night reminder (10 PM)
  async scheduleNightReminder(): Promise<void> {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(22, 0, 0, 0);
    
    // If 10 PM has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      identifier: this.dailyReminderIdentifiers[3],
      content: {
        title: '🌙 Night Planning',
        body: 'Before you rest, remember you have tasks for tomorrow!',
        data: {
          type: 'daily-reminder',
          timeSlot: 22,
        },
        sound: 'notification.mp3',
      },
      trigger: {
        hour: 22,
        minute: 0,
        repeats: true,
      } as any,
    });

    console.log(`🌙 Night Planning scheduled for ${reminderTime.toLocaleString()}`);
  }

  // Cancel daily reminders
  async cancelDailyReminder(): Promise<void> {
    try {
      for (const identifier of this.dailyReminderIdentifiers) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      }
      console.log('Cancelled all daily reminders');
    } catch (error) {
      console.error('Error cancelling daily reminders:', error);
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