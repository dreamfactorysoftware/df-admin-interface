'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocalStorage } from './use-local-storage'
import type {
  ThemeMode,
  ResolvedTheme,
  ThemeState,
  ThemePreferences,
  TablePreferences,
  UseThemeReturn,
  ThemeEvent,
  ThemeEventType,
  SystemThemeQuery,
  ThemeVariables,
  DEFAULT_THEME_CONFIG,
  DEFAULT_TABLE_PREFERENCES,
  DEFAULT_THEME_PREFERENCES
} from '../types/theme'

/**
 * Enhanced theme management hook for DreamFactory Admin Interface
 * 
 * Replaces Angular DfThemeService with React state management, providing
 * comprehensive theme switching, system preference detection, localStorage
 * persistence, and Tailwind CSS integration with smooth transitions.
 * 
 * Features:
 * - Light/dark/system theme modes with automatic switching
 * - System preference detection via prefers-color-scheme media query
 * - localStorage persistence with cross-tab synchronization
 * - Tailwind CSS dynamic class application and CSS variables
 * - Table pagination preferences management
 * - Theme change event system for external integrations
 * - Comprehensive error handling and accessibility support
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { theme, setTheme, isDark, toggleTheme } = useTheme()
 *   
 *   return (
 *     <div className={isDark ? 'dark' : 'light'}>
 *       <button onClick={toggleTheme}>
 *         Switch to {isDark ? 'light' : 'dark'} mode
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Internal state management
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs for preventing memory leaks and managing listeners
  const mediaQueryRef = useRef<MediaQueryList | null>(null)
  const eventListenersRef = useRef<Set<(event: ThemeEvent) => void>>(new Set())
  const initializedRef = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Persistent storage for theme preferences
  const [themePreferences, setThemePreferences, , themeError] = useLocalStorage<ThemePreferences>(
    'dreamfactory-theme-preferences',
    {
      defaultValue: DEFAULT_THEME_PREFERENCES,
      syncAcrossTabs: true,
      validator: (value): value is ThemePreferences => {
        return (
          typeof value === 'object' &&
          value !== null &&
          ['light', 'dark', 'system'].includes((value as any).mode) &&
          typeof (value as any).followSystemPreference === 'boolean' &&
          ['light', 'dark'].includes((value as any).preferredColorScheme) &&
          typeof (value as any).updatedAt === 'number'
        )
      }
    }
  )

  // Persistent storage for table preferences
  const [tablePreferences, setTablePreferences, , tableError] = useLocalStorage<TablePreferences>(
    'dreamfactory-table-preferences',
    {
      defaultValue: DEFAULT_TABLE_PREFERENCES,
      syncAcrossTabs: true,
      validator: (value): value is TablePreferences => {
        return (
          typeof value === 'object' &&
          value !== null &&
          typeof (value as any).defaultPageSize === 'number' &&
          Array.isArray((value as any).pageSizeOptions) &&
          typeof (value as any).showPageSizeSelector === 'boolean' &&
          typeof (value as any).persistPagination === 'boolean'
        )
      }
    }
  )

  /**
   * Detect system theme preference using prefers-color-scheme media query
   */
  const detectSystemTheme = useCallback((): SystemThemeQuery => {
    if (typeof window === 'undefined') {
      return {
        prefersDark: false,
        prefersLight: true,
        noPreference: false,
        prefersReducedMotion: false
      }
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    const noPreference = window.matchMedia('(prefers-color-scheme: no-preference)').matches
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return {
      prefersDark,
      prefersLight,
      noPreference,
      prefersReducedMotion
    }
  }, [])

  /**
   * Get resolved theme based on current preference and system setting
   */
  const getResolvedTheme = useCallback((
    mode: ThemeMode,
    systemPreference: ResolvedTheme,
    fallback: ResolvedTheme = 'light'
  ): ResolvedTheme => {
    switch (mode) {
      case 'light':
        return 'light'
      case 'dark':
        return 'dark'
      case 'system':
        return systemPreference
      default:
        console.warn(`Invalid theme mode: ${mode}, falling back to ${fallback}`)
        return fallback
    }
  }, [])

  /**
   * Apply theme CSS variables to document root
   */
  const applyThemeVariables = useCallback((theme: ResolvedTheme): void => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const variables: ThemeVariables = theme === 'dark' ? {
      '--background': '222.2 84% 4.9%',
      '--foreground': '210 40% 98%',
      '--card': '222.2 84% 4.9%',
      '--card-foreground': '210 40% 98%',
      '--popover': '222.2 84% 4.9%',
      '--popover-foreground': '210 40% 98%',
      '--primary': '217.2 91.2% 59.8%',
      '--primary-foreground': '222.2 84% 4.9%',
      '--secondary': '217.2 32.6% 17.5%',
      '--secondary-foreground': '210 40% 98%',
      '--muted': '217.2 32.6% 17.5%',
      '--muted-foreground': '215 20.2% 65.1%',
      '--accent': '217.2 32.6% 17.5%',
      '--accent-foreground': '210 40% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '217.2 32.6% 17.5%',
      '--input': '217.2 32.6% 17.5%',
      '--ring': '224.3 76.3% 94.1%',
      '--chart-1': '220 70% 50%',
      '--chart-2': '160 60% 45%',
      '--chart-3': '30 80% 55%',
      '--chart-4': '280 65% 60%',
      '--chart-5': '340 75% 55%'
    } : {
      '--background': '0 0% 100%',
      '--foreground': '222.2 84% 4.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '222.2 84% 4.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '222.2 84% 4.9%',
      '--primary': '221.2 83.2% 53.3%',
      '--primary-foreground': '210 40% 98%',
      '--secondary': '210 40% 96%',
      '--secondary-foreground': '222.2 84% 4.9%',
      '--muted': '210 40% 96%',
      '--muted-foreground': '215.4 16.3% 46.9%',
      '--accent': '210 40% 96%',
      '--accent-foreground': '222.2 84% 4.9%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '210 40% 98%',
      '--border': '214.3 31.8% 91.4%',
      '--input': '214.3 31.8% 91.4%',
      '--ring': '221.2 83.2% 53.3%',
      '--chart-1': '12 76% 61%',
      '--chart-2': '173 58% 39%',
      '--chart-3': '197 37% 24%',
      '--chart-4': '43 74% 66%',
      '--chart-5': '27 87% 67%'
    }

    // Apply CSS variables
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }, [])

  /**
   * Apply theme classes to document element
   */
  const applyTheme = useCallback((element?: HTMLElement): void => {
    const targetElement = element || (typeof document !== 'undefined' ? document.documentElement : null)
    if (!targetElement) return

    try {
      // Remove existing theme classes
      targetElement.classList.remove('light', 'dark')
      
      // Add current theme class
      targetElement.classList.add(resolvedTheme)
      
      // Apply CSS variables
      applyThemeVariables(resolvedTheme)
      
      // Add transition class for smooth theme switching
      if (themePreferences?.followSystemPreference || !detectSystemTheme().prefersReducedMotion) {
        targetElement.classList.add('theme-transition')
        
        // Remove transition class after animation completes
        setTimeout(() => {
          targetElement.classList.remove('theme-transition')
        }, 300)
      }
    } catch (err) {
      setError(`Failed to apply theme: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [resolvedTheme, themePreferences, applyThemeVariables, detectSystemTheme])

  /**
   * Emit theme change event to listeners
   */
  const emitThemeEvent = useCallback((
    type: ThemeEventType,
    previousTheme: ResolvedTheme,
    currentTheme: ResolvedTheme,
    source: 'user' | 'system' | 'storage' = 'user'
  ): void => {
    const event: ThemeEvent = {
      type,
      previousTheme,
      currentTheme,
      timestamp: Date.now(),
      source
    }

    eventListenersRef.current.forEach(callback => {
      try {
        callback(event)
      } catch (err) {
        console.warn('Theme event listener error:', err)
      }
    })
  }, [])

  /**
   * Update system theme based on media query
   */
  const updateSystemTheme = useCallback((forceUpdate = false): void => {
    const query = detectSystemTheme()
    const newSystemTheme: ResolvedTheme = query.prefersDark ? 'dark' : 'light'
    
    if (newSystemTheme !== systemTheme || forceUpdate) {
      const previousSystemTheme = systemTheme
      setSystemTheme(newSystemTheme)
      
      // Update resolved theme if in system mode
      if (themePreferences?.mode === 'system') {
        const previousResolved = resolvedTheme
        const newResolved = getResolvedTheme(themePreferences.mode, newSystemTheme)
        
        if (newResolved !== previousResolved || forceUpdate) {
          setResolvedTheme(newResolved)
          emitThemeEvent('system-theme-changed', previousResolved, newResolved, 'system')
        }
      }
      
      if (previousSystemTheme !== newSystemTheme) {
        emitThemeEvent('system-theme-changed', previousSystemTheme, newSystemTheme, 'system')
      }
    }
  }, [systemTheme, themePreferences, resolvedTheme, detectSystemTheme, getResolvedTheme, emitThemeEvent])

  /**
   * Set theme mode with validation and persistence
   */
  const setTheme = useCallback((theme: ThemeMode): void => {
    if (!['light', 'dark', 'system'].includes(theme)) {
      setError(`Invalid theme mode: ${theme}`)
      return
    }

    try {
      setError(null)
      const previousResolved = resolvedTheme
      const newResolved = getResolvedTheme(theme, systemTheme)
      
      // Update preferences
      const newPreferences: ThemePreferences = {
        ...themePreferences,
        mode: theme,
        followSystemPreference: theme === 'system',
        preferredColorScheme: theme === 'system' ? newResolved : theme as ResolvedTheme,
        updatedAt: Date.now()
      }
      
      setThemePreferences(newPreferences)
      setResolvedTheme(newResolved)
      
      // Emit theme change event
      if (previousResolved !== newResolved) {
        emitThemeEvent('theme-changed', previousResolved, newResolved, 'user')
      }
      
      emitThemeEvent('preferences-updated', previousResolved, newResolved, 'user')
    } catch (err) {
      setError(`Failed to set theme: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [themePreferences, resolvedTheme, systemTheme, getResolvedTheme, setThemePreferences, emitThemeEvent])

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = useCallback((): void => {
    const currentMode = themePreferences?.mode || 'system'
    
    if (currentMode === 'system') {
      // When in system mode, toggle to opposite of current system preference
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      // Toggle between light and dark
      setTheme(currentMode === 'light' ? 'dark' : 'light')
    }
  }, [themePreferences, systemTheme, setTheme])

  /**
   * Reset theme to system preference
   */
  const resetToSystem = useCallback((): void => {
    setTheme('system')
  }, [setTheme])

  /**
   * Update theme preferences with validation
   */
  const updatePreferences = useCallback((newPreferences: Partial<ThemePreferences>): void => {
    if (!themePreferences) return

    try {
      const updatedPreferences: ThemePreferences = {
        ...themePreferences,
        ...newPreferences,
        updatedAt: Date.now()
      }
      
      setThemePreferences(updatedPreferences)
      emitThemeEvent('preferences-updated', resolvedTheme, resolvedTheme, 'user')
    } catch (err) {
      setError(`Failed to update preferences: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [themePreferences, setThemePreferences, resolvedTheme, emitThemeEvent])

  /**
   * Update table preferences with validation
   */
  const updateTablePreferences = useCallback((newPreferences: Partial<TablePreferences>): void => {
    if (!tablePreferences) return

    try {
      const updatedPreferences: TablePreferences = {
        ...tablePreferences,
        ...newPreferences
      }
      
      // Validate page size is in available options
      if (newPreferences.defaultPageSize) {
        const isValidSize = updatedPreferences.pageSizeOptions.includes(newPreferences.defaultPageSize)
        if (!isValidSize) {
          updatedPreferences.pageSizeOptions.push(newPreferences.defaultPageSize)
          updatedPreferences.pageSizeOptions.sort((a, b) => a - b)
        }
      }
      
      setTablePreferences(updatedPreferences)
    } catch (err) {
      setError(`Failed to update table preferences: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [tablePreferences, setTablePreferences])

  /**
   * Set table page size with validation
   */
  const setTablePageSize = useCallback((size: number): void => {
    if (size < 1 || size > 1000) {
      setError(`Invalid page size: ${size}. Must be between 1 and 1000.`)
      return
    }

    updateTablePreferences({ defaultPageSize: size })
  }, [updateTablePreferences])

  /**
   * Get theme-aware CSS classes
   */
  const getThemeClasses = useCallback((baseClasses: string): string => {
    const themeClass = resolvedTheme === 'dark' ? 'dark' : 'light'
    return `${baseClasses} ${themeClass}`
  }, [resolvedTheme])

  /**
   * Add event listener for theme changes
   */
  const addEventListener = useCallback((callback: (event: ThemeEvent) => void): (() => void) => {
    eventListenersRef.current.add(callback)
    
    return () => {
      eventListenersRef.current.delete(callback)
    }
  }, [])

  /**
   * Initialize theme system and set up media query listener
   */
  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current) return

    try {
      setIsLoading(true)
      
      // Initialize system theme detection
      updateSystemTheme(true)
      
      // Set up media query listener for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryRef.current = mediaQuery
      
      const handleMediaChange = () => {
        // Debounce rapid changes
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          updateSystemTheme()
        }, 100)
      }
      
      mediaQuery.addEventListener('change', handleMediaChange)
      
      initializedRef.current = true
      setError(null)
    } catch (err) {
      setError(`Failed to initialize theme system: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      if (mediaQueryRef.current) {
        mediaQueryRef.current.removeEventListener('change', updateSystemTheme)
        mediaQueryRef.current = null
      }
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }
    }
  }, [updateSystemTheme])

  /**
   * Update resolved theme when preferences change
   */
  useEffect(() => {
    if (!themePreferences || !initializedRef.current) return

    const newResolved = getResolvedTheme(themePreferences.mode, systemTheme)
    if (newResolved !== resolvedTheme) {
      const previousResolved = resolvedTheme
      setResolvedTheme(newResolved)
      emitThemeEvent('theme-changed', previousResolved, newResolved, 'storage')
    }
  }, [themePreferences, systemTheme, resolvedTheme, getResolvedTheme, emitThemeEvent])

  /**
   * Apply theme classes when resolved theme changes
   */
  useEffect(() => {
    if (initializedRef.current) {
      applyTheme()
    }
  }, [resolvedTheme, applyTheme])

  /**
   * Add global CSS for theme transitions
   */
  useEffect(() => {
    if (typeof document === 'undefined') return

    const style = document.createElement('style')
    style.textContent = `
      .theme-transition {
        transition: 
          background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          fill 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .theme-transition * {
        transition: 
          background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          fill 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      /* Respect user's reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .theme-transition,
        .theme-transition * {
          transition: none !important;
        }
      }
    `
    
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Derive computed values
  const theme = themePreferences?.mode || 'system'
  const isDark = resolvedTheme === 'dark'
  const isLight = resolvedTheme === 'light'
  const isSystemMode = theme === 'system'
  const preferences = themePreferences || DEFAULT_THEME_PREFERENCES
  const tablePrefs = tablePreferences || DEFAULT_TABLE_PREFERENCES
  const combinedError = error || themeError || tableError

  // Build complete state object
  const themeState: ThemeState = {
    theme,
    resolvedTheme,
    systemTheme,
    preferences,
    tablePreferences: tablePrefs,
    isLoading,
    error: combinedError
  }

  // Return comprehensive theme interface
  return {
    ...themeState,
    setTheme,
    toggleTheme,
    resetToSystem,
    updatePreferences,
    updateTablePreferences,
    setTablePageSize,
    isDark,
    isLight,
    isSystemMode,
    applyTheme,
    getThemeClasses,
    addEventListener
  }
}

export default useTheme