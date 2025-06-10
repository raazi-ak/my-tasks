import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useNotifications } from '@/hooks/useNotifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';
import { useTaskStore } from '@/stores/taskStore';

export default function RootLayout() {
  useFrameworkReady();
  useNotifications();
  const { theme } = useThemeStore();
  const { updateDailyReminders } = useTaskStore();

  // Remove automatic daily reminder scheduling on app start
  // Daily reminders will be scheduled only when tasks are added/modified

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme.dark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
    </SafeAreaProvider>
  );
}