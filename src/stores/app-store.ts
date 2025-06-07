/**
 * Global application state store using Zustand.
 * Manages theme, navigation, layout, and user preferences across the application.
 * Replaces Angular service-based state management with simplified React patterns.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BreakpointState, SidebarState } from '@/types/layout';

/**
 * User preference settings for application behavior and appearance.
 */
export interface UserPreferences {
  /** Default database type for new connections */
  defaultDatabaseType: 'mysql' | 'postgresql' | 'mongodb' | 'oracle' | 'snowflake' | 'sqlite';
  
  /** Default page size for table pagination */
  tablePageSize: number;
  
  /** Automatically refresh schema data */
  autoRefreshSchemas: boolean;
  
  /** Show advanced configuration options */
  showAdvancedOptions: boolean;
  
  /** Enable animations and transitions */
  enableAnimations: boolean;
  
  /** Preferred language/locale */
  language: string;
  
  /** Enable development debug features */
  debugMode: boolean;
}

/**
 * Global application state interface.
 * Defines all state properties and actions available throughout the app.
 */
export interface AppState {
  // Theme Management
  /** Current theme setting ('light' | 'dark' | 'system') */
  theme: 'light' | 'dark' | 'system';
  
  /** Resolved theme based on system preference if theme is 'system' */
  resolvedTheme: 'light' | 'dark';
  
  /** Update theme setting */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  /** Set resolved theme (used internally) */
  setResolvedTheme: (theme: 'light' | 'dark') => void;
  
  // Navigation and Layout State
  /** Sidebar visibility and configuration */
  sidebar: SidebarState;
  
  /** Update sidebar state */
  setSidebar: (sidebar: Partial<SidebarState>) => void;
  
  /** Toggle sidebar open/closed */
  toggleSidebar: () => void;
  
  /** Toggle sidebar collapsed state */
  toggleSidebarCollapse: () => void;
  
  // Responsive Breakpoint State
  /** Current responsive breakpoint information */
  breakpoint: BreakpointState | null;
  
  /** Update breakpoint state */
  setBreakpoint: (breakpoint: BreakpointState) => void;
  
  // Loading States
  /** Global loading indicator for application-wide operations */
  globalLoading: boolean;
  
  /** Loading states for specific features */
  loadingStates: Record<string, boolean>;
  
  /** Set global loading state */
  setGlobalLoading: (loading: boolean) => void;
  
  /** Set loading state for specific feature */
  setFeatureLoading: (feature: string, loading: boolean) => void;
  
  // User Preferences
  /** User preference settings */
  preferences: UserPreferences;
  
  /** Update user preferences (partial update) */
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  /** Reset preferences to defaults */
  resetPreferences: () => void;
  
  // Error State
  /** Global error state for application-wide error handling */
  error: string | null;
  
  /** Set global error message */
  setError: (error: string | null) => void;
  
  /** Clear global error */
  clearError: () => void;
  
  // Search State
  /** Global search query */
  searchQuery: string;
  
  /** Search results visibility */
  searchOpen: boolean;
  
  /** Set search query */
  setSearchQuery: (query: string) => void;
  
  /** Toggle search modal/dialog */
  toggleSearch: () => void;
}

/**
 * Default user preferences.
 * Used for initial state and preference resets.
 */
const defaultPreferences: UserPreferences = {
  defaultDatabaseType: 'mysql',
  tablePageSize: 25,
  autoRefreshSchemas: true,
  showAdvancedOptions: false,
  enableAnimations: true,
  language: 'en',
  debugMode: false,
};

/**
 * Default sidebar state.
 * Responsive defaults that work across different screen sizes.
 */
const defaultSidebar: SidebarState = {
  isOpen: true,
  isCollapsed: false,
  isOverlay: false,
  width: 280,
  collapsedWidth: 64,
};

/**
 * Global application store using Zustand.
 * Provides centralized state management with persistence and dev tools.
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Theme State
        theme: 'system',
        resolvedTheme: 'light',
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }, false, 'setResolvedTheme'),
        
        // Navigation State
        sidebar: defaultSidebar,
        setSidebar: (sidebar) => 
          set({ sidebar: { ...get().sidebar, ...sidebar } }, false, 'setSidebar'),
        toggleSidebar: () => 
          set({ sidebar: { ...get().sidebar, isOpen: !get().sidebar.isOpen } }, false, 'toggleSidebar'),
        toggleSidebarCollapse: () => 
          set({ sidebar: { ...get().sidebar, isCollapsed: !get().sidebar.isCollapsed } }, false, 'toggleSidebarCollapse'),
        
        // Breakpoint State
        breakpoint: null,
        setBreakpoint: (breakpoint) => set({ breakpoint }, false, 'setBreakpoint'),
        
        // Loading States
        globalLoading: false,
        loadingStates: {},
        setGlobalLoading: (globalLoading) => set({ globalLoading }, false, 'setGlobalLoading'),
        setFeatureLoading: (feature, loading) => 
          set({ loadingStates: { ...get().loadingStates, [feature]: loading } }, false, 'setFeatureLoading'),
        
        // User Preferences
        preferences: defaultPreferences,
        updatePreferences: (newPreferences) => 
          set({ preferences: { ...get().preferences, ...newPreferences } }, false, 'updatePreferences'),
        resetPreferences: () => 
          set({ preferences: defaultPreferences }, false, 'resetPreferences'),
        
        // Error State
        error: null,
        setError: (error) => set({ error }, false, 'setError'),
        clearError: () => set({ error: null }, false, 'clearError'),
        
        // Search State
        searchQuery: '',
        searchOpen: false,
        setSearchQuery: (searchQuery) => set({ searchQuery }, false, 'setSearchQuery'),
        toggleSearch: () => set({ searchOpen: !get().searchOpen }, false, 'toggleSearch'),
      }),
      {
        name: 'dreamfactory-admin-store',
        // Only persist specific parts of the state
        partialize: (state) => ({
          theme: state.theme,
          preferences: state.preferences,
          sidebar: {
            isCollapsed: state.sidebar.isCollapsed,
            width: state.sidebar.width,
            collapsedWidth: state.sidebar.collapsedWidth,
          },
        }),
        // Storage version for migration handling
        version: 1,
      }
    ),
    {
      name: 'DreamFactory Admin Store',
      // Enable dev tools only in development
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

/**
 * Selector hooks for specific parts of the store.
 * Provides optimized re-renders by selecting only needed state slices.
 */

/** Theme state selector */
export const useTheme = () => useAppStore((state) => ({
  theme: state.theme,
  resolvedTheme: state.resolvedTheme,
  setTheme: state.setTheme,
  setResolvedTheme: state.setResolvedTheme,
}));

/** Sidebar state selector */
export const useSidebar = () => useAppStore((state) => ({
  sidebar: state.sidebar,
  setSidebar: state.setSidebar,
  toggleSidebar: state.toggleSidebar,
  toggleSidebarCollapse: state.toggleSidebarCollapse,
}));

/** Breakpoint state selector */
export const useBreakpointStore = () => useAppStore((state) => ({
  breakpoint: state.breakpoint,
  setBreakpoint: state.setBreakpoint,
}));

/** Loading state selector */
export const useLoading = () => useAppStore((state) => ({
  globalLoading: state.globalLoading,
  loadingStates: state.loadingStates,
  setGlobalLoading: state.setGlobalLoading,
  setFeatureLoading: state.setFeatureLoading,
}));

/** Preferences state selector */
export const usePreferences = () => useAppStore((state) => ({
  preferences: state.preferences,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
}));

/** Error state selector */
export const useError = () => useAppStore((state) => ({
  error: state.error,
  setError: state.setError,
  clearError: state.clearError,
}));

/** Search state selector */
export const useSearch = () => useAppStore((state) => ({
  searchQuery: state.searchQuery,
  searchOpen: state.searchOpen,
  setSearchQuery: state.setSearchQuery,
  toggleSearch: state.toggleSearch,
}));