import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Animated, 
  PanResponder, 
  Platform,
  Vibration,
  ActionSheetIOS,
  Dimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { CircleCheck as CheckCircle, Circle, Clock, Calendar, Trash2, Edit3 } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { Task } from '@/types/task';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
const OVERSCROLL_THRESHOLD = screenWidth * 0.4;
const ACTION_WIDTH = 80;

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onPress: (task: Task) => void;
  onDelete?: (id: string) => void;
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onToggle, onPress, onDelete, onEdit }: TaskCardProps) {
  const { theme } = useThemeStore();
  const pan = useRef(new Animated.Value(0)).current;
  const eclipse = useRef(new Animated.Value(1)).current; // For eclipse effect
  const [isSwipeActionsVisible, setIsSwipeActionsVisible] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') => {
    if (Platform.OS === 'ios') {
      try {
        switch (type) {
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (error) {
        // Fallback to basic vibration if haptics fail
        Vibration.vibrate(20);
      }
    } else {
      // Android vibration fallback
      switch (type) {
        case 'light':
          Vibration.vibrate(10);
          break;
        case 'medium':
          Vibration.vibrate(20);
          break;
        case 'heavy':
        case 'error':
          Vibration.vibrate(50);
          break;
        case 'success':
          Vibration.vibrate([10, 50]);
          break;
        case 'warning':
          Vibration.vibrate([20, 30]);
          break;
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // More lenient gesture detection
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: (evt, gestureState) => {
        // Stop any ongoing animations when user starts swiping
        pan.stopAnimation();
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        
        // Always allow movement - no restrictions
        // This makes swiping back to center much easier
        
        // Determine current swipe direction
        let currentDirection: 'left' | 'right' | null = null;
        if (Math.abs(dx) > 10) {
          currentDirection = dx < 0 ? 'left' : 'right';
        }

        // Show action buttons when crossing threshold
        if (Math.abs(dx) > SWIPE_THRESHOLD && currentDirection) {
          if (!isSwipeActionsVisible || swipeDirection !== currentDirection) {
            setSwipeDirection(currentDirection);
            setIsSwipeActionsVisible(true);
            triggerHapticFeedback('light');
          }
        }

        // Hide action buttons when returning close to center
        if (Math.abs(dx) < SWIPE_THRESHOLD * 0.5 && isSwipeActionsVisible) {
          setIsSwipeActionsVisible(false);
          setSwipeDirection(null);
        }

        // Stage 1: Graceful reveal of action buttons (0 to ACTION_WIDTH)
        if (Math.abs(dx) <= ACTION_WIDTH) {
          pan.setValue(dx);
        } else {
          // Stage 2: Elastic overscroll effect
          const overscrollAmount = Math.abs(dx) - ACTION_WIDTH;
          const elasticResistance = 1 - Math.min(overscrollAmount / (screenWidth * 0.25), 0.8);
          const direction = dx < 0 ? -1 : 1;
          const elasticValue = direction * (ACTION_WIDTH + overscrollAmount * elasticResistance);
          
          pan.setValue(elasticValue);

          // Trigger hard haptic for overscroll threshold
          if (Math.abs(dx) > OVERSCROLL_THRESHOLD) {
            triggerHapticFeedback('heavy');
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        const absVelocity = Math.abs(vx);
        const significantVelocity = absVelocity > 0.3; // Lower threshold for more responsiveness

        // Check for overscroll actions (immediate execution with eclipse effect)
        if (Math.abs(dx) > OVERSCROLL_THRESHOLD || (significantVelocity && Math.abs(dx) > ACTION_WIDTH * 0.6)) {
          if (dx < 0) {
            // Overscroll left - immediate delete with eclipse
            triggerHapticFeedback('error');
            eclipseAndExecute(() => handleSwipeDelete());
            return;
          } else {
            // Overscroll right - immediate edit with eclipse
            triggerHapticFeedback('heavy');
            eclipseAndExecute(() => handleEdit());
            return;
          }
        }

        // Much more lenient logic for showing actions vs returning to center
        const shouldShowActions = Math.abs(dx) > SWIPE_THRESHOLD * 0.7 || 
                                 (significantVelocity && Math.abs(dx) > SWIPE_THRESHOLD * 0.3);

        if (shouldShowActions) {
          if (dx < 0) {
            // Swipe left - show delete action
            Animated.spring(pan, {
              toValue: -ACTION_WIDTH,
              useNativeDriver: false,
              tension: 300,
              friction: 25,
              velocity: vx * 1000, // Convert velocity
            }).start();
            setIsSwipeActionsVisible(true);
            setSwipeDirection('left');
          } else {
            // Swipe right - show edit action  
            Animated.spring(pan, {
              toValue: ACTION_WIDTH,
              useNativeDriver: false,
              tension: 300,
              friction: 25,
              velocity: vx * 1000, // Convert velocity
            }).start();
            setIsSwipeActionsVisible(true);
            setSwipeDirection('right');
          }
        } else {
          // Reset to center with smooth spring animation
          resetCard();
        }
      },
      onPanResponderTerminationRequest: () => false, // Don't allow termination
      onPanResponderTerminate: () => {
        // If gesture is terminated, smoothly return to center
        resetCard();
      },
    })
  ).current;

  const resetCard = () => {
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: false,
      tension: 300,
      friction: 25,
    }).start(() => {
      setIsSwipeActionsVisible(false);
      setSwipeDirection(null);
    });
  };

  const eclipseAndExecute = (action: () => void) => {
    // Eclipse animation: scale down and fade out quickly
    Animated.parallel([
      Animated.timing(eclipse, {
        toValue: 0,
        duration: 120, // Much faster - was 200ms
        useNativeDriver: false,
      }),
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: false,
        tension: 400, // Snappier spring
        friction: 20,
      }),
    ]).start(() => {
      action();
      // Reset state and eclipse effect after action
      setIsSwipeActionsVisible(false);
      setSwipeDirection(null);
      // Reset eclipse value for next use
      eclipse.setValue(1);
    });
  };

  const handleLongPress = () => {
    if (Platform.OS === 'ios') {
      // iOS Haptic Touch Menu
      triggerHapticFeedback('medium');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit Task', 'Delete Task'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: task.title,
          message: 'Choose an action for this task',
          userInterfaceStyle: theme.dark ? 'dark' : 'light',
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 1:
              handleEdit();
              break;
            case 2:
              handleDelete();
              break;
            default:
              break;
          }
        }
      );
    } else {
      // Android Dialog Menu
      triggerHapticFeedback('medium');
      Alert.alert(
        'Task Actions',
        `What would you like to do with "${task.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Edit', 
            onPress: handleEdit,
            style: 'default'
          },
          { 
            text: 'Delete', 
            onPress: handleDelete,
            style: 'destructive'
          },
        ],
        { 
          cancelable: true,
          userInterfaceStyle: theme.dark ? 'dark' : 'light'
        }
      );
    }
  };

  const handleDelete = () => {
    const confirmDelete = () => {
      onDelete?.(task.id);
      triggerHapticFeedback('success');
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Task'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: 'Delete Task',
          message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
          userInterfaceStyle: theme.dark ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            confirmDelete();
          }
        }
      );
    } else {
      Alert.alert(
        'Delete Task',
        `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: confirmDelete
          },
        ],
        { 
          cancelable: true,
          userInterfaceStyle: theme.dark ? 'dark' : 'light'
        }
      );
    }
  };

  const handleSwipeDelete = () => {
    // Direct delete from swipe gesture
    onDelete?.(task.id);
  };

  const handleEdit = () => {
    onEdit?.(task);
    triggerHapticFeedback('success');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.textSecondary;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Work': return '#2563EB';
      case 'Personal': return '#059669';
      case 'Health': return '#DC2626';
      case 'Learning': return '#7C3AED';
      case 'Shopping': return '#EA580C';
      default: return theme.colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const styles = createStyles(theme, !!isOverdue, task.completed);

  return (
    <View style={styles.container}>
      <View style={styles.swipeContainer}>
        {/* Left Action (Delete) */}
        {swipeDirection === 'left' && (
          <Animated.View 
            style={[
              styles.leftAction,
              {
                // Make delete button elastic - gets pulled during overscroll
                transform: [
                  {
                    translateX: pan.interpolate({
                      inputRange: [-screenWidth, -ACTION_WIDTH, 0],
                      outputRange: [-screenWidth * 0.3, 0, ACTION_WIDTH],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.deleteAction} 
              onPress={() => {
                handleDelete();
                resetCard();
              }}
            >
              <Trash2 size={24} color="#ffffff" strokeWidth={2} />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Right Action (Edit) */}
        {swipeDirection === 'right' && (
          <Animated.View 
            style={[
              styles.rightAction,
              {
                // Make edit button elastic - gets pulled during overscroll
                transform: [
                  {
                    translateX: pan.interpolate({
                      inputRange: [0, ACTION_WIDTH, screenWidth],
                      outputRange: [-ACTION_WIDTH, 0, screenWidth * 0.3],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.editAction} 
              onPress={() => {
                handleEdit();
                resetCard();
              }}
            >
              <Edit3 size={24} color="#ffffff" strokeWidth={2} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View 
          style={[
            styles.taskContainer,
            {
              // Eclipse effect with scale and opacity
              opacity: eclipse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                { translateX: pan },
                {
                  scale: eclipse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.taskContent}
            onPress={() => onPress(task)}
            onLongPress={handleLongPress}
            activeOpacity={0.7}
          >
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => {
                onToggle(task.id);
                triggerHapticFeedback('light');
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {task.completed ? (
                <CheckCircle size={24} color={theme.colors.success} strokeWidth={2} />
              ) : (
                <Circle size={24} color={theme.colors.textSecondary} strokeWidth={2} />
              )}
            </TouchableOpacity>

            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {task.title}
                </Text>
              </View>

              {task.description && (
                <Text style={styles.description}>
                  {task.description}
                </Text>
              )}

              <View style={styles.metadata}>
                <View style={styles.metadataLeft}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(task.category) }]}>
                      {task.category}
                    </Text>
                  </View>
                  
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                      {task.priority}
                    </Text>
                  </View>
                </View>

                <View style={styles.metadataRight}>
                  {task.estimatedDuration && (
                    <View style={styles.durationContainer}>
                      <Clock size={14} color={theme.colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.durationText}>{task.estimatedDuration}m</Text>
                    </View>
                  )}
                  
                  {task.dueDate && (
                    <View style={styles.dueDateContainer}>
                      <Calendar size={14} color={isOverdue ? theme.colors.error : theme.colors.textSecondary} strokeWidth={2} />
                      <Text style={[styles.dueDateText, isOverdue && styles.overdueText]}>
                        {formatDate(new Date(task.dueDate))}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isOverdue: boolean, isCompleted: boolean) => StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leftAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightAction: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: theme.colors.error,
    width: ACTION_WIDTH - 10,
    height: '90%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAction: {
    backgroundColor: theme.colors.primary,
    width: ACTION_WIDTH - 10,
    height: '90%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  taskContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: isOverdue ? theme.colors.error + '05' : theme.colors.surface,
  },
  taskContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: isOverdue ? theme.colors.error + '40' : theme.colors.borderLight,
    backgroundColor: isOverdue ? theme.colors.error + '05' : theme.colors.surface,
    opacity: isCompleted ? 0.7 : 1,
    borderRadius: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    textDecorationLine: isCompleted ? 'line-through' : 'none',
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
    textDecorationLine: isCompleted ? 'line-through' : 'none',
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  durationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  overdueText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
});