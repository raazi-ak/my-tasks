import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';

export interface Colors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // UI colors
  border: string;
  borderLight: string;
  shadow: string;
  
  // Accent colors
  primary: string;
  success: string;
  warning: string;
  error: string;
  
  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;
}

export interface Theme {
  dark: boolean;
  colors: Colors;
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceSecondary: '#f3f4f6',
    
    text: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    shadow: '#000000',
    
    primary: '#2563EB',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    
    tabBarBackground: '#ffffff',
    tabBarBorder: '#e5e7eb',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    
    border: '#475569',
    borderLight: '#374151',
    shadow: '#000000',
    
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    
    tabBarBackground: '#1e293b',
    tabBarBorder: '#475569',
  },
};

interface ThemeStore {
  theme: Theme;
  followSystem: boolean;
  materialYou: boolean; // Android Material You design
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setFollowSystem: (enabled: boolean) => void;
  setMaterialYou: (enabled: boolean) => void;
  syncWithSystem: () => void;
}

// Global listener reference for cleanup
let systemAppearanceListener: any = null;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: lightTheme,
      followSystem: false,
      materialYou: Platform.OS === 'android', // Default to true on Android
      
      setDarkMode: (enabled) => {
        // If following system, don't allow manual override
        if (get().followSystem) return;
        
        set({
          theme: enabled ? darkTheme : lightTheme,
        });
      },
      
      toggleDarkMode: () => {
        const { theme, followSystem } = get();
        if (followSystem) return;
        
        set({
          theme: theme.dark ? lightTheme : darkTheme,
        });
      },
      
      setFollowSystem: (enabled) => {
        set({ followSystem: enabled });
        
        if (enabled) {
          // Immediately sync with system
          get().syncWithSystem();
          
          // Set up listener if not already set
          if (!systemAppearanceListener) {
            systemAppearanceListener = Appearance.addChangeListener(({ colorScheme }) => {
              if (get().followSystem) {
                get().syncWithSystem();
              }
            });
          }
        } else {
          // Remove listener when not following system
          if (systemAppearanceListener) {
            systemAppearanceListener.remove();
            systemAppearanceListener = null;
          }
        }
      },
      
      setMaterialYou: (enabled) => {
        set({ materialYou: enabled });
      },
      
      syncWithSystem: () => {
        const colorScheme = Appearance.getColorScheme();
        set({
          theme: colorScheme === 'dark' ? darkTheme : lightTheme,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Set up system appearance listener if following system
          if (state.followSystem) {
            // Initial sync
            state.syncWithSystem();
            
            // Set up listener
            if (!systemAppearanceListener) {
              systemAppearanceListener = Appearance.addChangeListener(({ colorScheme }) => {
                if (state.followSystem) {
                  state.syncWithSystem();
                }
              });
            }
          }
        }
      },
    }
  )
); 