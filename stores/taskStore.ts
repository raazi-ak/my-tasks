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
  scheduleOverdueNotifications: () => Promise<void>;
  updateDailyReminderChecker: () => void;
  
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
          get().scheduleTaskNotifications(newTask);
          get().updateDailyReminderChecker();
        }

        get().saveTasks();
      },
      
      updateTask: (id, updates) => {
        const state = get();
        const oldTask = state.tasks.find(t => t.id === id);
        
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
            
            get().updateDailyReminderChecker();
          }
        }

        get().saveTasks();
      },
      
      deleteTask: (id) => {
        const state = get();
        const taskToDelete = state.tasks.find(task => task.id === id);
        
        if (taskToDelete) {
          set((currentState) => ({
            tasks: currentState.tasks.filter((task) => task.id !== id),
            recentlyDeleted: [taskToDelete, ...currentState.recentlyDeleted.slice(0, 9)] // Keep last 10
          }));
          
          // Cancel notifications for deleted task
          if (state.notificationsEnabled) {
            get().cancelTaskNotifications(id);
            get().updateDailyReminderChecker();
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
          get().updateDailyReminderChecker();
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
          
          get().updateDailyReminderChecker();
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
          // Reschedule task-specific notifications when enabled
          const tasks = get().tasks;
          tasks.forEach(task => {
            if (!task.completed) {
              get().scheduleTaskNotifications(task);
            }
          });
          get().updateDailyReminderChecker();
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

      scheduleOverdueNotifications: async () => {
        if (!get().notificationsEnabled) return;
        
        const overdueTasks = get().getOverdueTasks();
        const notificationService = NotificationService.getInstance();
        
        // Schedule overdue notification if there are overdue tasks
        if (overdueTasks.length > 0) {
          await notificationService.scheduleOverdueNotification(overdueTasks);
        }
      },
      
      updateDailyReminderChecker: () => {
        const notificationService = NotificationService.getInstance();
        const pendingTasks = get().getPendingTasks();
        const notificationsEnabled = get().notificationsEnabled;
        
        if (notificationsEnabled && pendingTasks.length > 0) {
          // Start the time checker when there are pending tasks
          notificationService.startDailyTimeChecker();
        } else {
          // Stop the time checker when no pending tasks or notifications disabled
          notificationService.stopDailyTimeChecker();
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