export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  dueTime?: string; // Format: "HH:MM"
  reminder?: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  estimatedDuration?: number; // in minutes
  tags: string[];
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface UserStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  productivityScore: number;
  streak: number;
}