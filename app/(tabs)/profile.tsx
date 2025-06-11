import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { 
  Settings, 
  Moon, 
  Smartphone,
  Palette,
  User,
  Bell,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/stores/taskStore';
import { useThemeStore } from '@/stores/themeStore';
import ModernHeader from '@/components/ModernHeader';
import AppLogo from '@/components/AppLogo';
import { NotificationService } from '@/services/notificationService';

interface SwitchItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  type: 'switch';
  value: boolean;
  disabled?: boolean;
  onToggle: (value: boolean) => void;
}

type SettingItem = SwitchItem;

export default function SettingsScreen() {
  const { tasks, notificationsEnabled, setNotificationsEnabled } = useTaskStore();
  const { theme, followSystem, materialYou, setDarkMode, setFollowSystem, setMaterialYou } = useThemeStore();
  const insets = useSafeAreaInsets();

  const settingsGroups: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications-enabled',
          title: 'Enable Notifications',
          subtitle: 'Get reminders for tasks and daily check-ins',
          icon: Bell,
          type: 'switch',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          id: 'follow-system',
          title: 'Follow System Theme',
          subtitle: 'Automatically adapt to system dark/light mode',
          icon: Smartphone,
          type: 'switch',
          value: followSystem,
          onToggle: setFollowSystem,
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: followSystem ? 'Controlled by system settings' : 'Enable dark theme',
          icon: Moon,
          type: 'switch',
          value: theme.dark,
          disabled: followSystem,
          onToggle: setDarkMode,
        },
        ...(Platform.OS === 'android' ? [{
          id: 'material-you',
          title: 'Material You',
          subtitle: 'Use Android 12+ dynamic colors',
          icon: Palette,
          type: 'switch' as const,
          value: materialYou,
          onToggle: setMaterialYou,
        }] : []),
      ],
    },
  ];

  const stats = {
    totalTasks: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
  };

  const styles = createStyles(theme, insets.bottom);

  return (
    <View style={styles.container}>
      <ModernHeader
        title="Settings"
        subtitle="Customize your experience"
        icon={Settings}
        large
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.warning }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <View key={group.title} style={styles.settingsGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupItems}>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.settingItem,
                      item.disabled && styles.disabledItem,
                    ]}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[
                        styles.settingIcon,
                        { backgroundColor: theme.colors.primary + '20' }
                      ]}>
                        <IconComponent 
                          size={20} 
                          color={item.disabled ? theme.colors.textTertiary : theme.colors.primary} 
                          strokeWidth={2} 
                        />
                      </View>
                      <View style={styles.settingText}>
                        <Text style={[
                          styles.settingTitle,
                          item.disabled && { color: theme.colors.textTertiary }
                        ]}>
                          {item.title}
                        </Text>
                        <Text style={[
                          styles.settingSubtitle,
                          item.disabled && { color: theme.colors.textTertiary }
                        ]}>
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingRight}>
                      <Switch
                        value={item.value}
                        onValueChange={item.disabled ? undefined : item.onToggle}
                        disabled={item.disabled}
                        trackColor={{ 
                          false: theme.colors.borderLight, 
                          true: theme.colors.primary 
                        }}
                        thumbColor="#ffffff"
                        style={[
                          item.disabled && { opacity: 0.5 }
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <AppLogo size={60} style={{ marginBottom: 16 }} />
          <Text style={styles.appName}>My Tasks ver.1</Text>
          <Text style={styles.appVersion}>Developed with 💗 by Raazi</Text>
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
    padding: 20,
    // paddingBottom will be set dynamically with bottom inset
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  settingsGroup: {
    marginBottom: 32,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  groupItems: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  disabledItem: {
    // Optional styling for disabled items
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 16,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  appVersion: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  settingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});