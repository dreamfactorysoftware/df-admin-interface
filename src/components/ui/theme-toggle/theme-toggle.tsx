'use client';

/**
 * ThemeToggle Component for DreamFactory Admin Interface
 * 
 * A fully accessible three-state theme switcher providing seamless transitions between
 * light, dark, and system preference modes. Built with Headless UI Switch component
 * for optimal accessibility compliance and replacing Angular Material mat-slide-toggle.
 * 
 * Features:
 * - WCAG 2.1 AA compliant with 4.5:1+ contrast ratios
 * - Headless UI Switch component for unstyled, accessible control
 * - Three-state theme selection: light, dark, and system preference detection
 * - 44x44px minimum touch targets for mobile accessibility
 * - Comprehensive keyboard navigation with focus-visible states
 * - React context integration replacing Angular BehaviorSubject patterns
 * - Smooth visual transitions with Tailwind CSS animations
 * - Screen reader friendly with proper ARIA labeling
 * - TypeScript 5.8+ interfaces with strict type safety
 * 
 * Accessibility Standards:
 * - Focus rings with 2px width and 2px offset for keyboard navigation
 * - Minimum 3:1 contrast ratio for UI components (exceeds WCAG requirements)
 * - Touch targets meet 44x44px minimum size requirement
 * - Screen reader announcements for theme changes
 * - High contrast mode support with enhanced borders
 * - Reduced motion preference respect for smooth transitions
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/components/layout/theme/use-theme';
import { 
  themeToggleVariants,
  themeToggleIconSizes,
  themeToggleAnimations,
  themeToggleAriaLabels,
  getThemeToggleClasses,
  type ThemeToggleVariantProps
} from './theme-toggle-variants';
import { cn } from '@/lib/utils';
import type { ThemeMode, ResolvedTheme } from '@/types/theme';

/**
 * Props interface for ThemeToggle component
 * Provides comprehensive configuration options for visual appearance and behavior
 */
export interface ThemeToggleProps extends Omit<ThemeToggleVariantProps, 'themeState'> {
  /** Additional CSS classes for custom styling */
  className?: string;
  
  /** Whether to show text labels alongside icons (default: false for icon-only mode) */
  showLabels?: boolean;
  
  /** Orientation of the toggle control */
  orientation?: 'horizontal' | 'vertical';
  
  /** Whether to show the current theme state visually */
  showCurrentState?: boolean;
  
  /** Callback fired when theme changes (for analytics/tracking) */
  onThemeChange?: (theme: ThemeMode, resolvedTheme: ResolvedTheme) => void;
  
  /** Whether to announce theme changes to screen readers */
  announceChanges?: boolean;
  
  /** Custom ARIA label override */
  ariaLabel?: string;
  
  /** Whether the toggle is disabled */
  disabled?: boolean;
  
  /** Tooltip text for additional context */
  tooltip?: string;
  
  /** Position of tooltip when provided */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Theme icon mapping with React components
 * Uses Heroicons outline style for consistent visual design
 */
const themeIcons = {
  light: SunIcon,
  dark: MoonIcon,
  system: ComputerDesktopIcon,
} as const;

/**
 * Theme cycle order for sequential switching
 * Defines the progression when cycling through theme options
 */
const themeCycleOrder: ThemeMode[] = ['light', 'dark', 'system'];

/**
 * Get readable theme name for accessibility announcements
 * Converts theme mode to human-readable string for screen readers
 */
const getThemeDisplayName = (theme: ThemeMode): string => {
  const displayNames: Record<ThemeMode, string> = {
    light: 'Light theme',
    dark: 'Dark theme', 
    system: 'System theme preference'
  };
  return displayNames[theme];
};

/**
 * Get theme description for enhanced accessibility context
 * Provides detailed descriptions for screen reader users
 */
const getThemeDescription = (theme: ThemeMode, resolvedTheme: ResolvedTheme): string => {
  const descriptions: Record<ThemeMode, string> = {
    light: 'Uses light colors with dark text for better visibility in bright environments',
    dark: 'Uses dark colors with light text to reduce eye strain in low light conditions',
    system: `Automatically follows your device preference, currently using ${resolvedTheme} theme`
  };
  return descriptions[theme];
};

/**
 * Main ThemeToggle Component
 * 
 * A comprehensive three-state theme switcher with full accessibility compliance.
 * Replaces Angular Material mat-slide-toggle with modern React implementation
 * using Headless UI for unstyled, accessible control primitives.
 * 
 * @param props - Component configuration props
 * @returns Fully accessible theme toggle switch component
 * 
 * @example
 * ```tsx
 * // Basic usage with default styling
 * <ThemeToggle />
 * 
 * // With custom styling and labels
 * <ThemeToggle 
 *   size="lg"
 *   variant="outline"
 *   showLabels={true}
 *   onThemeChange={(theme, resolved) => analytics.track('theme_changed', { theme, resolved })}
 * />
 * 
 * // Disabled state with tooltip
 * <ThemeToggle 
 *   disabled={true}
 *   tooltip="Theme switching is disabled in this context"
 * />
 * ```
 */
export function ThemeToggle({
  variant = 'default',
  size = 'md',
  className,
  showLabels = false,
  orientation = 'horizontal',
  showCurrentState = true,
  onThemeChange,
  announceChanges = true,
  ariaLabel,
  disabled = false,
  tooltip,
  tooltipPosition = 'bottom',
  loading = false,
  ...props
}: ThemeToggleProps) {
  // Theme context integration replacing Angular service injection
  const {
    theme,
    resolvedTheme,
    setTheme,
    mounted,
    isTheme,
    systemTheme
  } = useTheme();

  // Local state for UI feedback and interactions
  const [isPressed, setIsPressed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastAnnouncedTheme, setLastAnnouncedTheme] = useState<ThemeMode | null>(null);

  /**
   * Handle theme cycling through three states
   * Implements sequential progression: light → dark → system → light
   */
  const handleThemeChange = useCallback(() => {
    if (disabled || loading) return;

    const currentIndex = themeCycleOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeCycleOrder.length;
    const nextTheme = themeCycleOrder[nextIndex];

    // Apply theme change
    setTheme(nextTheme);

    // Fire callback for analytics/tracking
    onThemeChange?.(nextTheme, theme === 'system' ? systemTheme : nextTheme as ResolvedTheme);

    // Announce change to screen readers if enabled
    if (announceChanges && nextTheme !== lastAnnouncedTheme) {
      announceThemeChange(nextTheme, theme === 'system' ? systemTheme : nextTheme as ResolvedTheme);
      setLastAnnouncedTheme(nextTheme);
    }
  }, [
    theme,
    systemTheme,
    setTheme,
    onThemeChange,
    announceChanges,
    lastAnnouncedTheme,
    disabled,
    loading
  ]);

  /**
   * Announce theme changes to screen readers
   * Creates temporary live region for accessibility announcements
   */
  const announceThemeChange = useCallback((newTheme: ThemeMode, resolved: ResolvedTheme) => {
    if (typeof window === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only absolute -top-10 -left-10 w-1 h-1 overflow-hidden';
    
    const themeName = getThemeDisplayName(newTheme);
    const description = getThemeDescription(newTheme, resolved);
    announcement.textContent = `Theme changed to ${themeName}. ${description}`;
    
    document.body.appendChild(announcement);
    
    // Clean up announcement after screen readers have processed it
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  /**
   * Handle keyboard interactions for enhanced accessibility
   * Supports Enter, Space, and Arrow keys for navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled || loading) return;

    switch (event.key) {
      case 'Enter':
      case ' ': // Space key
        event.preventDefault();
        handleThemeChange();
        setIsPressed(true);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        handleThemeChange();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        // Cycle backward through themes
        const currentIndex = themeCycleOrder.indexOf(theme);
        const prevIndex = currentIndex === 0 ? themeCycleOrder.length - 1 : currentIndex - 1;
        const prevTheme = themeCycleOrder[prevIndex];
        setTheme(prevTheme);
        onThemeChange?.(prevTheme, theme === 'system' ? systemTheme : prevTheme as ResolvedTheme);
        break;
    }
  }, [theme, systemTheme, setTheme, onThemeChange, handleThemeChange, disabled, loading]);

  /**
   * Handle keyboard release for visual feedback
   */
  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsPressed(false);
    }
  }, []);

  /**
   * Get current theme icon component
   * Returns appropriate icon based on current theme state
   */
  const CurrentIcon = useMemo(() => {
    return themeIcons[theme];
  }, [theme]);

  /**
   * Generate comprehensive ARIA label
   * Provides rich context for screen reader users
   */
  const ariaLabelText = useMemo(() => {
    if (ariaLabel) return ariaLabel;

    const currentThemeName = getThemeDisplayName(theme);
    const nextThemeIndex = (themeCycleOrder.indexOf(theme) + 1) % themeCycleOrder.length;
    const nextThemeName = getThemeDisplayName(themeCycleOrder[nextThemeIndex]);
    
    return `Theme toggle, currently set to ${currentThemeName}. Press to switch to ${nextThemeName}.`;
  }, [theme, ariaLabel]);

  /**
   * Generate component classes with variant support
   * Combines base styles with variant-specific styling
   */
  const componentClasses = useMemo(() => {
    return getThemeToggleClasses(
      {
        variant,
        size,
        themeState: theme,
        loading: loading || !mounted,
      },
      cn(
        // Base accessibility classes
        'focus-accessible',
        
        // Animation classes
        themeToggleAnimations.colorTransition,
        themeToggleAnimations.scaleOnPress,
        
        // State-specific classes
        isPressed && themeToggleAnimations.scaleOnPress,
        
        // Orientation classes
        orientation === 'vertical' && 'flex-col',
        
        // Reduced motion support
        'motion-reduce:transition-none',
        
        // High contrast support
        '@media (prefers-contrast: high)': 'border-2',
        
        className
      )
    );
  }, [variant, size, theme, loading, mounted, isPressed, orientation, className]);

  /**
   * Get icon size based on component size variant
   */
  const iconSize = useMemo(() => {
    return themeToggleIconSizes[size];
  }, [size]);

  /**
   * Tooltip visibility handlers for enhanced UX
   */
  const handleMouseEnter = useCallback(() => {
    if (tooltip && !disabled) {
      setShowTooltip(true);
    }
  }, [tooltip, disabled]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  /**
   * Prevent hydration mismatch by checking mount state
   * Ensures server-side rendering compatibility
   */
  if (!mounted) {
    return (
      <div 
        className={componentClasses}
        aria-hidden="true"
      >
        <div className={cn(iconSize, 'animate-pulse bg-secondary-300 rounded')} />
      </div>
    );
  }

  return (
    <div className="relative inline-flex">
      {/* Main theme toggle switch */}
      <Switch
        checked={theme !== 'light'} // Switch state for visual feedback
        onChange={handleThemeChange}
        disabled={disabled || loading}
        className={componentClasses}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabelText}
        aria-describedby={tooltip ? 'theme-toggle-tooltip' : undefined}
        data-theme={theme}
        data-resolved-theme={resolvedTheme}
        {...props}
      >
        {/* Icon container with smooth transitions */}
        <span 
          className={cn(
            'flex items-center justify-center transition-transform duration-300',
            themeToggleAnimations.iconRotation,
            loading && 'animate-pulse'
          )}
          aria-hidden="true"
        >
          <CurrentIcon 
            className={cn(
              iconSize,
              'transition-colors duration-200',
              // Theme-specific icon colors with WCAG compliance
              theme === 'light' && 'text-amber-600 dark:text-amber-400',
              theme === 'dark' && 'text-indigo-600 dark:text-indigo-400', 
              theme === 'system' && 'text-secondary-600 dark:text-secondary-400',
              disabled && 'text-secondary-400 dark:text-secondary-600'
            )}
          />
        </span>

        {/* Optional text labels for enhanced clarity */}
        {showLabels && (
          <span 
            className={cn(
              'ml-2 text-sm font-medium transition-colors duration-200',
              orientation === 'vertical' && 'ml-0 mt-1',
              disabled && 'text-secondary-400 dark:text-secondary-600'
            )}
          >
            {getThemeDisplayName(theme)}
          </span>
        )}

        {/* Current state indicator */}
        {showCurrentState && (
          <span className="sr-only">
            Current theme: {getThemeDisplayName(theme)}
            {theme === 'system' && ` (resolved to ${resolvedTheme})`}
          </span>
        )}

        {/* Loading indicator */}
        {loading && (
          <span 
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          </span>
        )}
      </Switch>

      {/* Accessible tooltip with proper positioning */}
      {tooltip && showTooltip && (
        <div
          id="theme-toggle-tooltip"
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-secondary-900 rounded-md shadow-lg',
            'pointer-events-none transition-opacity duration-200',
            // Position-based classes
            tooltipPosition === 'top' && 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
            tooltipPosition === 'bottom' && 'top-full mt-2 left-1/2 transform -translate-x-1/2',
            tooltipPosition === 'left' && 'right-full mr-2 top-1/2 transform -translate-y-1/2',
            tooltipPosition === 'right' && 'left-full ml-2 top-1/2 transform -translate-y-1/2',
            // Dark mode styles
            'dark:bg-white dark:text-secondary-900'
          )}
          aria-live="polite"
        >
          {tooltip}
          
          {/* Tooltip arrow */}
          <div 
            className={cn(
              'absolute w-2 h-2 bg-secondary-900 transform rotate-45',
              tooltipPosition === 'top' && 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
              tooltipPosition === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
              tooltipPosition === 'left' && 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2',
              tooltipPosition === 'right' && 'right-full top-1/2 translate-x-1/2 -translate-y-1/2',
              'dark:bg-white'
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Preset theme toggle variants for common use cases
 * Provides convenient pre-configured components for specific scenarios
 */

/**
 * Compact theme toggle for tight spaces (toolbar, header)
 */
export function CompactThemeToggle(props: Omit<ThemeToggleProps, 'size' | 'showLabels'>) {
  return (
    <ThemeToggle
      size="sm"
      showLabels={false}
      variant="ghost"
      {...props}
    />
  );
}

/**
 * Full-featured theme toggle with labels for settings pages
 */
export function DetailedThemeToggle(props: Omit<ThemeToggleProps, 'showLabels' | 'showCurrentState'>) {
  return (
    <ThemeToggle
      showLabels={true}
      showCurrentState={true}
      size="lg"
      {...props}
    />
  );
}

/**
 * Accessible theme toggle for keyboard-first navigation
 */
export function KeyboardThemeToggle(props: ThemeToggleProps) {
  return (
    <ThemeToggle
      announceChanges={true}
      tooltip="Use arrow keys to navigate, Enter or Space to select"
      {...props}
    />
  );
}

// Export types for external usage
export type { ThemeToggleProps };

// Default export
export default ThemeToggle;