import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ChartBar as BarChart3, TrendingUp, TrendingDown, Target, Clock, Calendar, Award, Zap, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import ModernHeader from '@/components/ModernHeader';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { tasks, categories } = useTaskStore();
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  // Helper function to get date range for selected period
  const getDateRange = (period: 'week' | 'month' | 'year') => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  };

  // Filter tasks by selected period
  const { start: periodStart, end: periodEnd } = getDateRange(selectedPeriod);
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.createdAt);
    return taskDate >= periodStart && taskDate <= periodEnd;
  });

  // Calculate previous period for comparison
  const getPreviousPeriodData = (period: 'week' | 'month' | 'year') => {
    const now = new Date();
    const prevStart = new Date();
    const prevEnd = new Date();
    
    switch (period) {
      case 'week':
        prevEnd.setDate(now.getDate() - 7);
        prevStart.setDate(prevEnd.getDate() - 7);
        break;
      case 'month':
        prevEnd.setMonth(now.getMonth() - 1);
        prevStart.setMonth(prevEnd.getMonth() - 1);
        break;
      case 'year':
        prevEnd.setFullYear(now.getFullYear() - 1);
        prevStart.setFullYear(prevEnd.getFullYear() - 1);
        break;
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      return taskDate >= prevStart && taskDate <= prevEnd;
    });
  };

  const previousPeriodTasks = getPreviousPeriodData(selectedPeriod);

  // Calculate current period metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const totalEstimatedTime = filteredTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
  const completedTime = filteredTasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);

  // Calculate previous period metrics for comparison
  const prevTotalTasks = previousPeriodTasks.length;
  const prevCompletedTasks = previousPeriodTasks.filter(task => task.completed).length;
  const prevCompletionRate = prevTotalTasks > 0 ? (prevCompletedTasks / prevTotalTasks) * 100 : 0;
  const prevCompletedTime = previousPeriodTasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);

  // Calculate changes
  const completionRateChange = completionRate - prevCompletionRate;
  const taskCountChange = totalTasks - prevTotalTasks;
  const timeChange = completedTime - prevCompletedTime;

  // Calculate productivity score based on completion rate, time efficiency, and consistency
  const calculateProductivityScore = () => {
    if (totalTasks === 0) return 0;
    
    const completionFactor = completionRate / 100; // 0-1
    const efficiencyFactor = completedTime > 0 ? Math.min(completedTime / totalEstimatedTime, 1) : 0; // 0-1
    const consistencyFactor = totalTasks > 0 ? Math.min(totalTasks / 10, 1) : 0; // 0-1 (based on task volume)
    
    return Math.round((completionFactor * 0.5 + efficiencyFactor * 0.3 + consistencyFactor * 0.2) * 100);
  };

  const productivityScore = calculateProductivityScore();
  const prevProductivityScore = previousPeriodTasks.length > 0 ? (() => {
    const prevCompletionFactor = prevCompletionRate / 100;
    const prevTotalEstimated = previousPeriodTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
    const prevEfficiencyFactor = prevCompletedTime > 0 ? Math.min(prevCompletedTime / prevTotalEstimated, 1) : 0;
    const prevConsistencyFactor = prevTotalTasks > 0 ? Math.min(prevTotalTasks / 10, 1) : 0;
    return Math.round((prevCompletionFactor * 0.5 + prevEfficiencyFactor * 0.3 + prevConsistencyFactor * 0.2) * 100);
  })() : 0;
  const productivityChange = productivityScore - prevProductivityScore;
  
  // Format change values
  const formatChange = (change: number, type: 'percentage' | 'count' | 'time') => {
    const prefix = change >= 0 ? '+' : '';
    switch (type) {
      case 'percentage':
        return `${prefix}${Math.round(change)}%`;
      case 'count':
        return `${prefix}${change}`;
      case 'time':
        return `${prefix}${Math.round(change / 60)}h`;
      default:
        return `${prefix}${change}`;
    }
  };

  const getTrend = (change: number): 'up' | 'down' => change >= 0 ? 'up' : 'down';
  
  const categoryStats = categories.map(category => {
    const categoryTasks = filteredTasks.filter(task => task.category === category.name);
    const completed = categoryTasks.filter(task => task.completed).length;
    return {
      ...category,
      total: categoryTasks.length,
      completed,
      completionRate: categoryTasks.length > 0 ? (completed / categoryTasks.length) * 100 : 0,
    };
  });

  const priorityStats = ['high', 'medium', 'low'].map(priority => {
    const priorityTasks = filteredTasks.filter(task => task.priority === priority);
    const completed = priorityTasks.filter(task => task.completed).length;
    return {
      priority,
      total: priorityTasks.length,
      completed,
      completionRate: priorityTasks.length > 0 ? (completed / priorityTasks.length) * 100 : 0,
    };
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const metrics = [
    {
      id: 'completion-rate',
      title: 'Completion Rate',
      value: `${Math.round(completionRate)}%`,
      change: formatChange(completionRateChange, 'percentage'),
      trend: getTrend(completionRateChange),
      icon: CheckCircle2,
      color: theme.colors.success,
    },
    {
      id: 'productivity-score',
      title: 'Productivity Score',
      value: productivityScore.toString(),
      change: formatChange(productivityChange, 'count'),
      trend: getTrend(productivityChange),
      icon: Zap,
      color: '#7C3AED',
    },
    {
      id: 'time-completed',
      title: 'Time Completed',
      value: `${Math.round(completedTime / 60)}h`,
      change: formatChange(timeChange, 'time'),
      trend: getTrend(timeChange),
      icon: Clock,
      color: theme.colors.primary,
    },
    {
      id: 'total-tasks',
      title: 'Total Tasks',
      value: totalTasks.toString(),
      change: formatChange(taskCountChange, 'count'),
      trend: getTrend(taskCountChange),
      icon: Target,
      color: theme.colors.error,
    },
  ];

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  const styles = createStyles(theme, insets.bottom);

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Analytics"
        subtitle="Track your productivity insights"
        icon={BarChart3}
        large
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {metrics.map((metric) => {
              const IconComponent = metric.icon;
              const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
              return (
                <View key={metric.id} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                      <IconComponent size={20} color={metric.color} strokeWidth={2} />
                    </View>
                    <View style={styles.metricChange}>
                      <TrendIcon size={12} color={metric.color} strokeWidth={2} />
                      <Text style={[styles.metricChangeText, { color: metric.color }]}>
                        {metric.change}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                  <Text style={styles.metricTitle}>{metric.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Category Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Performance</Text>
          <View style={styles.categoryStats}>
            {categoryStats.map((category) => (
              <View key={category.id} style={styles.categoryStatCard}>
                <View style={styles.categoryStatHeader}>
                  <Text style={styles.categoryStatName}>{category.name}</Text>
                  <Text style={styles.categoryStatRate}>
                    {Math.round(category.completionRate)}%
                  </Text>
                </View>
                <View style={styles.categoryStatBar}>
                  <View
                    style={[
                      styles.categoryStatProgress,
                      {
                        width: `${category.completionRate}%`,
                        backgroundColor: category.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.categoryStatDetails}>
                  {category.completed} of {category.total} tasks completed
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Priority Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Analysis</Text>
          <View style={styles.priorityStats}>
            {priorityStats.map((priority) => (
              <View key={priority.priority} style={styles.priorityStatCard}>
                <View style={styles.priorityStatHeader}>
                  <View
                    style={[
                      styles.priorityIndicator,
                      { backgroundColor: getPriorityColor(priority.priority) },
                    ]}
                  />
                  <Text style={styles.priorityStatName}>
                    {priority.priority.charAt(0).toUpperCase() + priority.priority.slice(1)} Priority
                  </Text>
                  <Text style={styles.priorityStatCount}>
                    {priority.completed}/{priority.total}
                  </Text>
                </View>
                <View style={styles.priorityStatBar}>
                  <View
                    style={[
                      styles.priorityStatProgress,
                      {
                        width: `${priority.completionRate}%`,
                        backgroundColor: getPriorityColor(priority.priority),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              You have completed <Text style={styles.summaryHighlight}>{completedTasks}</Text> out of{' '}
              <Text style={styles.summaryHighlight}>{totalTasks}</Text> tasks {selectedPeriod === 'week' ? 'this week' : selectedPeriod === 'month' ? 'this month' : 'this year'}.
            </Text>
            <Text style={styles.summaryText}>
              Total estimated time: <Text style={styles.summaryHighlight}>{Math.round(totalEstimatedTime / 60)}h</Text>
            </Text>
            <Text style={styles.summaryText}>
              Time completed: <Text style={styles.summaryHighlight}>{Math.round(completedTime / 60)}h</Text>
            </Text>
            {totalTasks === 0 && (
              <Text style={[styles.summaryText, { fontStyle: 'italic', marginTop: 8 }]}>
                No tasks found for the selected period. Try switching to a different time range.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
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
  contentContainer: {
    // paddingBottom will be set dynamically with bottom inset
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  categoryStats: {
    gap: 16,
  },
  categoryStatCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryStatRate: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  categoryStatBar: {
    height: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 3,
    marginBottom: 8,
  },
  categoryStatProgress: {
    height: '100%',
    borderRadius: 3,
  },
  categoryStatDetails: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  priorityStats: {
    gap: 12,
  },
  priorityStatCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  priorityStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  priorityStatCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  priorityStatBar: {
    height: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 3,
    marginBottom: 8,
  },
  priorityStatProgress: {
    height: '100%',
    borderRadius: 3,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
});