import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskCategory } from '@/types/task';
import { NotificationService } from '@/services/notificationService';

const defaultCategories: TaskCategory[] = [
  { id: '1', name: 'Work', color: '#2563EB', icon: 'briefcase' },
  { id: '2', name: 'Personal', color: '#059669', icon: 'user' },
  { id: '3', name: 'Health', color: '#DC2626', icon: 'heart' },
  { id: '4', name: 'Learning', color: '#7C3AED', icon: 'book' },
  { id: '5', name: 'Shopping', color: '#EA580C', icon: 'shopping-cart' },
];

interface TaskStore {
  tasks: Task[];
  recentlyDeleted: Task[];
  categories: TaskCategory[];
  notificationsEnabled: boolean;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  restoreTask: (task: Task) => void;
  clearRecentlyDeleted: () => void;
  toggleTask: (id: string) => void;
  
  // Notification actions
  setNotificationsEnabled: (enabled: boolean) => void;
  scheduleTaskNotifications: (task: Task) => Promise<void>;
  cancelTaskNotifications: (taskId: string) => Promise<void>;
  updateDailyReminders: () => Promise<void>;
  
  // Selectors
  getTasksByCategory: (category: string) => Task[];
  getTasksByPriority: (priority: string) => Task[];
  getPendingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getOverdueTasks: () => Task[];
  loadTasks: () => Promise<void>;
  saveTasks: () => Promise<void>;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],
      recentlyDeleted: [],
      categories: defaultCategories,
      notificationsEnabled: true,
      
      addTask: (taskData) => {
        const state = get();
        const hadNoPendingTasks = state.tasks.filter(task => !task.completed).length === 0;
        
        const newTask: Task = {
          ...taskData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        // Schedule notifications for the new task
        if (get().notificationsEnabled) {
          // Schedule specific task reminder (if task has reminder set)
          get().scheduleTaskNotifications(newTask);
          
          // Only schedule daily reminders if this is the first pending task
          if (hadNoPendingTasks && !newTask.completed) {
            get().updateDailyReminders();
          }
        }

        get().saveTasks();
      },
      
      updateTask: (id, updates) => {
        const state = get();
        const oldTask = state.tasks.find(t => t.id === id);
        const hadNoPendingTasks = state.tasks.filter(task => !task.completed).length === 0;
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
        }));

        // Handle notification updates
        if (get().notificationsEnabled && oldTask) {
          const updatedTask = get().tasks.find(t => t.id === id);
          if (updatedTask) {
            // Cancel old notifications for this task
            get().cancelTaskNotifications(id);
            
            // Schedule new notifications if task is not completed
            if (!updatedTask.completed) {
              get().scheduleTaskNotifications(updatedTask);
            }
            
            // Only update daily reminders if crossing the threshold
            const newPendingCount = get().getPendingTasks().length;
            if (hadNoPendingTasks && newPendingCount === 1) {
              // First pending task - schedule daily reminders
              get().updateDailyReminders();
            } else if (!hadNoPendingTasks && newPendingCount === 0) {
              // Last pending task completed - cancel daily reminders
              get().updateDailyReminders();
            }
          }
        }

        get().saveTasks();
      },
      
      deleteTask: (id) => {
        const state = get();
        const taskToDelete = state.tasks.find(task => task.id === id);
        
        if (taskToDelete) {
          const wasLastPendingTask = state.tasks.filter(task => !task.completed).length === 1 && !taskToDelete.completed;
          
          set((currentState) => ({
            tasks: currentState.tasks.filter((task) => task.id !== id),
            recentlyDeleted: [taskToDelete, ...currentState.recentlyDeleted.slice(0, 9)] // Keep last 10
          }));
          
          // Cancel notifications for deleted task
          if (state.notificationsEnabled) {
            get().cancelTaskNotifications(id);
            
            // Only update daily reminders if this was the last pending task
            if (wasLastPendingTask) {
              get().updateDailyReminders();
            }
          }
          
          get().saveTasks();
        }
      },
      
      restoreTask: (task) => {
        set((state) => ({
          tasks: [...state.tasks, { ...task, updatedAt: new Date() }],
          recentlyDeleted: state.recentlyDeleted.filter(t => t.id !== task.id),
        }));

        // Reschedule notifications for restored task
        if (get().notificationsEnabled && !task.completed) {
          get().scheduleTaskNotifications(task);
          get().updateDailyReminders();
        }

        get().saveTasks();
      },
      
      clearRecentlyDeleted: () => {
        set({ recentlyDeleted: [] });
      },
      
      toggleTask: (id) => {
        const state = get();
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;
        
        const wasCompleted = task.completed;

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, completed: !task.completed, updatedAt: new Date() }
              : task
          ),
        }));

        // Handle notifications for task completion
        if (state.notificationsEnabled) {
          if (wasCompleted) {
            // Task was marked as unfinished (uncompleted), reschedule notifications
            const updatedTask = { ...task, completed: false };
            get().scheduleTaskNotifications(updatedTask);
          } else {
            // Task was completed
            NotificationService.getInstance().sendTaskCompletedNotification(task);
            get().cancelTaskNotifications(id);
          }
          // Only update daily reminders when task completion state changes significantly
          // (i.e., when going from no pending tasks to having pending tasks, or vice versa)
          const pendingTasksCount = get().getPendingTasks().length;
          if (wasCompleted && pendingTasksCount === 1) {
            // First pending task after all were completed - schedule daily reminders
            get().updateDailyReminders();
          } else if (!wasCompleted && pendingTasksCount === 0) {
            // Last pending task was completed - cancel daily reminders
            get().updateDailyReminders();
          }
        }

        get().saveTasks();
      },

      // Notification methods
      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
        
        if (!enabled) {
          // Cancel all notifications when disabled
          NotificationService.getInstance().cancelAllNotifications();
        } else {
          // Only reschedule task-specific notifications when enabled
          // Don't automatically trigger daily reminders on toggle
          const tasks = get().tasks;
          tasks.forEach(task => {
            if (!task.completed) {
              get().scheduleTaskNotifications(task);
            }
          });
        }
      },

      scheduleTaskNotifications: async (task) => {
        if (!get().notificationsEnabled || task.completed) return;
        
        const notificationService = NotificationService.getInstance();
        await notificationService.scheduleTaskReminder(task);
      },

      cancelTaskNotifications: async (taskId) => {
        const notificationService = NotificationService.getInstance();
        await notificationService.cancelTaskReminder(taskId);
      },

      updateDailyReminders: async () => {
        if (!get().notificationsEnabled) return;
        
        const pendingTasks = get().getPendingTasks();
        const overdueTasks = get().getOverdueTasks();
        const notificationService = NotificationService.getInstance();
        
        // Only schedule daily reminders if there are pending tasks
        // This prevents unnecessary daily notifications when all tasks are done
        if (pendingTasks.length > 0) {
          await notificationService.scheduleDailyReminder();
        } else {
          // Cancel daily reminders if no pending tasks
          await notificationService.cancelDailyReminder();
        }
        
        // Schedule overdue notification if there are overdue tasks
        if (overdueTasks.length > 0) {
          await notificationService.scheduleOverdueNotification(overdueTasks);
        }
      },
      
      getTasksByCategory: (category) => {
        return get().tasks.filter(task => task.category === category);
      },
      
      getTasksByPriority: (priority) => {
        return get().tasks.filter(task => task.priority === priority);
      },
      
      getPendingTasks: () => {
        return get().tasks.filter(task => !task.completed);
      },
      
      getCompletedTasks: () => {
        return get().tasks.filter(task => task.completed);
      },
      
      getOverdueTasks: () => {
        return get().tasks.filter(task => 
          task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
        );
      },
      
      loadTasks: async () => {
        // Implementation of loadTasks
      },
      
      saveTasks: async () => {
        // Implementation of saveTasks
      },
    }),
    {
      name: 'task-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 