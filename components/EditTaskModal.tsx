import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-native-date-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock, Calendar, Bell, Plus, Minus, AlertCircle } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { Task, TaskCategory } from '@/types/task';

interface EditTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  task: Task | null;
  categories: TaskCategory[];
}

export default function EditTaskModal({ visible, onClose, onSave, task, categories }: EditTaskModalProps) {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [hasReminder, setHasReminder] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Populate form with task data when task changes
  useEffect(() => {
    if (task && visible) {
      setTitle(task.title);
      setDescription(task.description || '');
      setCategory(task.category);
      setPriority(task.priority);
      setEstimatedDuration(task.estimatedDuration || 30);
      
      if (task.dueDate) {
        setDueDate(new Date(task.dueDate));
      } else {
        setDueDate(null);
      }
      
      if (task.dueTime) {
        const [hours, minutes] = task.dueTime.split(':');
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        setDueTime(timeDate);
      } else {
        setDueTime(null);
      }
      
      setHasReminder(!!task.reminder);
    }
  }, [task, visible]);

  // Reset state when modal closes
  const resetState = () => {
    setTitle('');
    setDescription('');
    setCategory('Work');
    setPriority('medium');
    setEstimatedDuration(30);
    setDueDate(null);
    setDueTime(null);
    setHasReminder(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowErrorToast(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = () => {
    if (!title.trim() || !task) return;

    // Combine date and time if both are set
    let finalDueDate: Date | undefined = undefined;
    if (dueDate) {
      finalDueDate = new Date(dueDate);
      if (dueTime) {
        finalDueDate.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
      }
    }

    const reminder = hasReminder && finalDueDate ? new Date(finalDueDate.getTime() - 60 * 60 * 1000) : undefined;

    const updatedTask: Task = {
      ...task,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      estimatedDuration,
      dueDate: finalDueDate,
      dueTime: dueTime ? `${dueTime.getHours().toString().padStart(2, '0')}:${dueTime.getMinutes().toString().padStart(2, '0')}` : undefined,
      reminder,
      updatedAt: new Date(),
    };

    onSave(updatedTask);
    resetState();
    onClose();
  };

  const showToast = () => {
    setShowErrorToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowErrorToast(false);
    });
  };

  const handleDatePress = () => {
    Keyboard.dismiss();
    if (showDatePicker) {
      setShowDatePicker(false);
    } else {
      setShowTimePicker(false);
      setShowDatePicker(true);
    }
  };

  const handleTimePress = () => {
    if (!dueDate) {
      showToast();
      return;
    }
    Keyboard.dismiss();
    if (showTimePicker) {
      setShowTimePicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(true);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    // Fix: Set date even if no change was made, using current value as fallback
    if (selectedDate) {
      setDueDate(selectedDate);
    } else if (event.type !== 'dismissed' && dueDate) {
      // If no date selected but not dismissed, keep current date
      setDueDate(dueDate);
    } else if (event.type !== 'dismissed' && !dueDate) {
      // If no current date and not dismissed, set to today
      setDueDate(new Date());
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    // Fix: Set time even if no change was made, using current value as fallback
    if (selectedTime) {
      setDueTime(selectedTime);
    } else if (event.type !== 'dismissed' && dueTime) {
      // If no time selected but not dismissed, keep current time
      setDueTime(dueTime);
    } else if (event.type !== 'dismissed' && !dueTime) {
      // If no current time and not dismissed, set to current time
      setDueTime(new Date());
    }
  };

  // Modern date picker handlers for Android
  const handleModernDateConfirm = (selectedDate: Date) => {
    setDueDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleModernTimeConfirm = (selectedTime: Date) => {
    setDueTime(selectedTime);
    setShowTimePicker(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    // Detect system time format
    const testTime = new Date();
    const timeString = testTime.toLocaleTimeString([], { 
      hour: 'numeric',
      minute: '2-digit'
    });
    
    const is24HourFormat = !timeString.toLowerCase().includes('am') && !timeString.toLowerCase().includes('pm');
    
    if (is24HourFormat) {
      return time.toLocaleTimeString([], { 
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      return time.toLocaleTimeString([], { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const adjustDuration = (change: number) => {
    const newDuration = Math.max(15, estimatedDuration + change);
    setEstimatedDuration(newDuration);
  };

  const getComplementaryColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      '#2563EB': '#ffffff',
      '#059669': '#ffffff',  
      '#DC2626': '#ffffff',
      '#7C3AED': '#ffffff',
      '#EA580C': '#ffffff',
    };
    return colorMap[color] || '#ffffff';
  };

  const priorities = [
    { value: 'low', label: 'Low', color: theme.colors.success },
    { value: 'medium', label: 'Medium', color: theme.colors.warning },
    { value: 'high', label: 'High', color: theme.colors.error },
  ];

  const styles = createStyles(theme, insets);

  if (!task) return null;

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Task</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
              placeholderTextColor={theme.colors.textTertiary}
              autoFocus
              returnKeyType="next"
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add task description"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      isSelected && {
                        backgroundColor: cat.color,
                        borderColor: cat.color,
                      }
                    ]}
                    onPress={() => setCategory(cat.name)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        isSelected && { 
                          color: getComplementaryColor(cat.color),
                          fontWeight: '700'
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.priorityButton,
                    priority === p.value && [styles.priorityButtonActive, { borderColor: p.color }],
                  ]}
                  onPress={() => setPriority(p.value as any)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priority === p.value && { color: p.color },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Estimated Duration</Text>
            <View style={styles.durationContainer}>
              <TouchableOpacity 
                style={styles.durationButton}
                onPress={() => adjustDuration(-15)}
              >
                <Minus size={20} color={theme.colors.primary} strokeWidth={2} />
              </TouchableOpacity>
              
              <View style={styles.durationDisplay}>
                <Clock size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                <Text style={styles.durationText}>{estimatedDuration} min</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.durationButton}
                onPress={() => adjustDuration(15)}
              >
                <Plus size={20} color={theme.colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Due Date & Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Due Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={handleDatePress}
              >
                <Calendar size={20} color={theme.colors.primary} strokeWidth={2} />
                <Text style={[styles.dateButtonText, { color: theme.colors.primary }]}>
                  {dueDate ? formatDate(dueDate) : 'Set Due Date'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={handleTimePress}
                disabled={!dueDate}
              >
                <Clock size={16} color={dueDate ? theme.colors.primary : theme.colors.textTertiary} strokeWidth={2} />
                <Text style={[
                  styles.timeButtonText, 
                  { color: dueDate ? theme.colors.primary : theme.colors.textTertiary }
                ]}>
                  {dueTime ? formatTime(dueTime) : 'Time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reminder Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.reminderToggle, hasReminder && styles.reminderToggleActive]}
              onPress={() => setHasReminder(!hasReminder)}
              disabled={!dueDate}
            >
              <Bell size={20} color={hasReminder ? theme.colors.primary : theme.colors.textSecondary} strokeWidth={2} />
              <Text style={[styles.reminderText, hasReminder && { color: theme.colors.primary }]}>
                Set reminder (1 hour before)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer - Fixed at bottom */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!title.trim()}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>

        {/* Error Toast */}
        {showErrorToast && (
          <Animated.View 
            style={[
              styles.errorToast,
              {
                opacity: toastOpacity,
                top: insets.top + 100,
              }
            ]}
          >
            <AlertCircle size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.errorToastText}>
              Please select a due date first before setting the time
            </Text>
          </Animated.View>
        )}

        {/* Date Picker */}
        {showDatePicker && Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity 
              style={styles.pickerContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerHeaderButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerHeaderTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerHeaderButton, { color: theme.colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.picker}
                themeVariant={theme.dark ? 'dark' : 'light'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Modern Date Picker for Android */}
        {showDatePicker && Platform.OS === 'android' && (
          <DatePicker
            modal
            open={showDatePicker}
            date={dueDate || new Date()}
            mode="date"
            minimumDate={new Date()}
            theme={theme.dark ? 'dark' : 'light'}
            onConfirm={handleModernDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            title="Select Date"
            confirmText="Confirm"
            cancelText="Cancel"
          />
        )}

        {/* Time Picker */}
        {showTimePicker && Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          >
            <TouchableOpacity 
              style={styles.pickerContainer}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerHeaderButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerHeaderTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.pickerHeaderButton, { color: theme.colors.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dueTime || new Date()}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                style={styles.picker}
                themeVariant={theme.dark ? 'dark' : 'light'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Modern Time Picker for Android */}
        {showTimePicker && Platform.OS === 'android' && (
          <DatePicker
            modal
            open={showTimePicker}
            date={dueTime || new Date()}
            mode="time"
            theme={theme.dark ? 'dark' : 'light'}
            onConfirm={handleModernTimeConfirm}
            onCancel={() => setShowTimePicker(false)}
            title="Select Time"
            confirmText="Confirm"
            cancelText="Cancel"
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: insets.top + 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  priorityButtonActive: {
    borderWidth: 2,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  durationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reminderToggleActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  reminderText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Math.max(insets.bottom + 16, 32),
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.dark ? 0.4 : 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 2000,
  },
  errorToastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
    flex: 1,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.dark ? 0.4 : 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerHeaderButton: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pickerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 'auto',
  },
}); 