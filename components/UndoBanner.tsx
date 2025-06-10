import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Undo2, X } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { Task } from '@/types/task';

interface UndoBannerProps {
  visible: boolean;
  deletedTasks: Task[];
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoBanner({ visible, deletedTasks, onUndo, onDismiss }: UndoBannerProps) {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Slide up animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();

      // Auto-dismiss after 5 seconds
      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, 5000);
    } else {
      // Slide down animation
      Animated.spring(translateY, {
        toValue: 100,
        useNativeDriver: true,
        tension: 300,
        friction: 30,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, translateY, onDismiss]);

  const getUndoText = () => {
    const count = deletedTasks.length;
    if (count === 1) {
      return `"${deletedTasks[0].title}" deleted`;
    }
    return `${count} tasks deleted`;
  };

  const styles = createStyles(theme, insets.bottom);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity: visible ? 1 : 0,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{getUndoText()}</Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.undoButton}
            onPress={onUndo}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Undo2 size={16} color={theme.colors.primary} strokeWidth={2} />
            <Text style={styles.undoText}>Undo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: any, bottomInset: number) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Math.max(bottomInset + 16, 32),
    paddingTop: 16,
    zIndex: 1000,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.dark ? 0.4 : 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary + '15',
    borderRadius: 8,
    gap: 4,
  },
  undoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  dismissButton: {
    padding: 8,
    borderRadius: 8,
  },
}); 