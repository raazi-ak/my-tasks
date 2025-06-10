import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Plus, CircleCheck as CheckCircle2, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import ModernHeader from '@/components/ModernHeader';
import TaskCard from '@/components/TaskCard';
import AddTaskModal from '@/components/AddTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import UndoBanner from '@/components/UndoBanner';
import { Task } from '@/types/task';

export default function TasksScreen() {
  const { 
    tasks, 
    categories, 
    addTask, 
    toggleTask, 
    deleteTask, 
    updateTask, 
    recentlyDeleted, 
    restoreTask, 
    clearRecentlyDeleted 
  } = useTaskStore();
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showUndoBanner, setShowUndoBanner] = useState(false);

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending': return !task.completed;
      case 'completed': return task.completed;
      default: return true;
    }
  });

  const handleTaskPress = (task: Task) => {
    // Navigate to task detail (implement later)
    console.log('Task pressed:', task.title);
  };

  const handleTaskDelete = (taskId: string) => {
    deleteTask(taskId);
    // Show undo banner after deletion
    setShowUndoBanner(true);
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleTaskSave = (updatedTask: Task) => {
    updateTask(updatedTask.id, updatedTask);
    setShowEditModal(false);
    setEditingTask(null);
  };

  const handleUndo = () => {
    // Restore all recently deleted tasks
    recentlyDeleted.forEach(task => {
      restoreTask(task);
    });
    setShowUndoBanner(false);
  };

  const handleDismissUndo = () => {
    setShowUndoBanner(false);
    // Optionally clear recently deleted after some time
    setTimeout(() => {
      clearRecentlyDeleted();
    }, 1000);
  };

  const getFilterCount = (type: string) => {
    switch (type) {
      case 'pending': return tasks.filter(t => !t.completed).length;
      case 'completed': return tasks.filter(t => t.completed).length;
      default: return tasks.length;
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
  ).length;

  const styles = createStyles(theme, insets.bottom);

  const addButton = (
    <TouchableOpacity
      style={styles.addButton}
      onPress={() => setShowAddModal(true)}
    >
      <Plus size={20} color="#ffffff" strokeWidth={2.5} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ModernHeader
        title="My Tasks"
        subtitle={`${completedTasks} of ${tasks.length} completed`}
        icon={CheckCircle2}
        rightElement={addButton}
        large
      />

      <View style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <CheckCircle2 size={20} color={theme.colors.success} strokeWidth={2} />
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={20} color={theme.colors.warning} strokeWidth={2} />
            <Text style={styles.statNumber}>{tasks.filter(t => !t.completed).length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <AlertCircle size={20} color={theme.colors.error} strokeWidth={2} />
            <Text style={styles.statNumber}>{overdueTasks}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {['all', 'pending', 'completed'].map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterTab,
                filter === filterType && styles.filterTabActive,
              ]}
              onPress={() => setFilter(filterType as any)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === filterType && styles.filterTabTextActive,
                ]}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)} ({getFilterCount(filterType)})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tasks List */}
        <ScrollView
          style={styles.tasksList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.tasksListContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onPress={handleTaskPress}
                onDelete={handleTaskDelete}
                onEdit={handleTaskEdit}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color={theme.colors.textTertiary} strokeWidth={1} />
              <Text style={styles.emptyStateTitle}>
                {filter === 'all' ? 'No tasks yet' : 
                 filter === 'pending' ? 'No pending tasks' : 'No completed tasks'}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {filter === 'all' ? 'Tap the + button to add your first task' : 
                 filter === 'pending' ? 'Great job staying on top of everything!' : 
                 'Complete some tasks to see them here'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <AddTaskModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addTask}
        categories={categories}
      />

      <EditTaskModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSave}
        task={editingTask}
        categories={categories}
      />

      <UndoBanner
        visible={showUndoBanner && recentlyDeleted.length > 0}
        deletedTasks={recentlyDeleted}
        onUndo={handleUndo}
        onDismiss={handleDismissUndo}
      />
    </View>
  );
}

const createStyles = (theme: any, bottomInset: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tasksListContent: {
    // paddingBottom will be set dynamically with bottom inset
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});