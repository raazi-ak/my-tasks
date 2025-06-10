import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/stores/themeStore';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  large?: boolean;
}

export default function ModernHeader({ 
  title, 
  subtitle, 
  icon: Icon, 
  rightElement, 
  leftElement,
  large = false 
}: ModernHeaderProps) {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.top, large);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {leftElement && (
          <View style={styles.leftContainer}>
            {leftElement}
          </View>
        )}
        
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            {Icon && (
              <View style={styles.iconContainer}>
                <Icon size={large ? 32 : 24} color={theme.colors.primary} strokeWidth={2} />
              </View>
            )}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
              )}
            </View>
          </View>
        </View>

        {rightElement && (
          <View style={styles.rightContainer}>
            {rightElement}
          </View>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any, topInset: number, large: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingTop: topInset,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: large ? 20 : 16,
    minHeight: large ? 80 : 60,
  },
  leftContainer: {
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: large ? 40 : 32,
    height: large ? 40 : 32,
    borderRadius: large ? 20 : 16,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: large ? 28 : 20,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  rightContainer: {
    marginLeft: 16,
  },
}); 