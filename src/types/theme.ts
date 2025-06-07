/**
 * Theme types for DreamFactory Admin Interface
 * 
 * Defines comprehensive theme management types for dark/light mode switching,
 * system preference detection, and UI customization preferences.
 */

/**
 * Available theme modes
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Resolved theme values (system resolves to either light or dark)
 */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Theme configuration options
 */
export interface ThemeConfig {
  /** Default theme mode when no preference is stored */
  defaultTheme: ThemeMode
  /** Enable automatic system theme detection */
  enableSystemDetection: boolean
  /** Enable smooth transitions between themes */
  enableTransitions: boolean
  /** Storage key for theme persistence */
  storageKey: string
  /** CSS class prefix for theme application */
  classPrefix: string
}

/**
 * User theme preferences
 */
export interface ThemePreferences {
  /** Current theme mode selection */
  mode: ThemeMode
  /** Whether to follow system preference */
  followSystemPreference: boolean
  /** User's manual color preference when not following system */
  preferredColorScheme: ResolvedTheme
  /** Last update timestamp */
  updatedAt: number
}

/**
 * Table pagination preferences for UI state
 */
export interface TablePreferences {
  /** Default number of rows per page */
  defaultPageSize: number
  /** Available page size options */
  pageSizeOptions: number[]
  /** Whether to show page size selector */
  showPageSizeSelector: boolean
  /** Whether to persist pagination state across navigation */
  persistPagination: boolean
}

/**
 * Complete theme state interface
 */
export interface ThemeState {
  /** Current theme mode (user selection) */
  theme: ThemeMode
  /** Resolved theme (actual applied theme) */
  resolvedTheme: ResolvedTheme
  /** System theme preference */
  systemTheme: ResolvedTheme
  /** Theme preferences object */
  preferences: ThemePreferences
  /** Table pagination preferences */
  tablePreferences: TablePreferences
  /** Whether theme system is initializing */
  isLoading: boolean
  /** Any theme-related error */
  error: string | null
}

/**
 * Theme context value interface
 */
export interface ThemeContextValue extends ThemeState {
  /** Set theme mode */
  setTheme: (theme: ThemeMode) => void
  /** Toggle between light and dark */
  toggleTheme: () => void
  /** Reset to system preference */
  resetToSystem: () => void
  /** Update theme preferences */
  updatePreferences: (preferences: Partial<ThemePreferences>) => void
  /** Update table preferences */
  updateTablePreferences: (preferences: Partial<TablePreferences>) => void
  /** Set table page size */
  setTablePageSize: (size: number) => void
  /** Check if current theme is dark */
  isDark: boolean
  /** Check if current theme is light */
  isLight: boolean
  /** Check if following system preference */
  isSystemMode: boolean
}

/**
 * Theme event types for external integrations
 */
export type ThemeEventType = 'theme-changed' | 'system-theme-changed' | 'preferences-updated'

/**
 * Theme change event data
 */
export interface ThemeEvent {
  type: ThemeEventType
  previousTheme: ResolvedTheme
  currentTheme: ResolvedTheme
  timestamp: number
  source: 'user' | 'system' | 'storage'
}

/**
 * Hook return value interface
 */
export interface UseThemeReturn extends ThemeContextValue {
  /** Apply theme classes to an element */
  applyTheme: (element?: HTMLElement) => void
  /** Get theme-aware CSS classes */
  getThemeClasses: (baseClasses: string) => string
  /** Listen to theme change events */
  addEventListener: (callback: (event: ThemeEvent) => void) => () => void
}

/**
 * Media query result for system theme detection
 */
export interface SystemThemeQuery {
  /** Whether dark mode is preferred */
  prefersDark: boolean
  /** Whether light mode is preferred */
  prefersLight: boolean
  /** Whether user has no preference */
  noPreference: boolean
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean
}

/**
 * CSS variable definitions for theme switching
 */
export interface ThemeVariables {
  /** Background colors */
  '--background': string
  '--foreground': string
  '--card': string
  '--card-foreground': string
  '--popover': string
  '--popover-foreground': string
  /** Primary colors */
  '--primary': string
  '--primary-foreground': string
  '--secondary': string
  '--secondary-foreground': string
  '--muted': string
  '--muted-foreground': string
  '--accent': string
  '--accent-foreground': string
  /** State colors */
  '--destructive': string
  '--destructive-foreground': string
  '--border': string
  '--input': string
  '--ring': string
  /** Chart colors */
  '--chart-1': string
  '--chart-2': string
  '--chart-3': string
  '--chart-4': string
  '--chart-5': string
}

/**
 * Default theme configuration values
 */
export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'system',
  enableSystemDetection: true,
  enableTransitions: true,
  storageKey: 'dreamfactory-theme-preferences',
  classPrefix: 'theme-'
}

/**
 * Default table preferences
 */
export const DEFAULT_TABLE_PREFERENCES: TablePreferences = {
  defaultPageSize: 25,
  pageSizeOptions: [10, 25, 50, 100],
  showPageSizeSelector: true,
  persistPagination: true
}

/**
 * Default theme preferences
 */
export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
  mode: 'system',
  followSystemPreference: true,
  preferredColorScheme: 'light',
  updatedAt: Date.now()
}