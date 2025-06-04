/**
 * ThemeToggle Component - WCAG 2.1 AA Compliant Theme Switcher
 * 
 * Main ThemeToggle React component providing a three-state theme switcher 
 * (light/dark/system) with full WCAG 2.1 AA accessibility compliance. 
 * Replaces Angular Material mat-slide-toggle with Headless UI Switch component, 
 * supporting proper ARIA labeling, keyboard navigation, and minimum 44x44px touch targets.
 * Integrates with theme context for state management and provides smooth visual transitions.
 * 
 * Features:
 * - Three-state theme selection (light, dark, system)
 * - WCAG 2.1 AA compliance with 4.5:1+ contrast ratios
 * - 44x44px minimum touch targets for mobile accessibility
 * - Keyboard navigation with focus-visible indicators
 * - Screen reader support with proper ARIA labels
 * - Smooth transitions between theme states
 * - System theme preference detection and following
 * - Integration with React context via useTheme hook
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

'use client';

import React, { useCallback, useMemo } from 'react';
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
  type ThemeToggleVariantProps,
  getThemeToggleClasses
} from './theme-toggle-variants';
import type { ThemeMode, ResolvedTheme } from '@/types/theme';
import { cn } from '@/lib/utils';

/**
 * ThemeToggle component props interface
 * Provides comprehensive customization options while maintaining accessibility standards
 */
export interface ThemeToggleProps {
  /** Visual style variant for the toggle component */
  variant?: ThemeToggleVariantProps['variant'];
  
  /** Size variant affecting touch target and icon dimensions */
  size?: ThemeToggleVariantProps['size'];
  
  /** Additional CSS classes for custom styling */
  className?: string;
  
  /** Whether to show text labels alongside icons */
  showLabels?: boolean;
  
  /** Position of labels relative to the toggle */
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  /** Custom aria-label for the entire toggle group */
  ariaLabel?: string;
  
  /** ID for the toggle group (for form association) */
  id?: string;
  
  /** Whether the toggle is disabled */
  disabled?: boolean;
  
  /** Callback fired when theme changes */
  onThemeChange?: (theme: ThemeMode) => void;
  
  /** Whether to include system preference option */
  enableSystem?: boolean;
  
  /** Whether to show loading state during theme transitions */
  showLoading?: boolean;
  
  /** Custom icons for each theme state */
  icons?: {
    light?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    dark?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    system?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  };
  
  /** Whether to use compact layout (icons only) */
  compact?: boolean;
}

/**
 * Individual theme option configuration
 */
interface ThemeOption {
  mode: ThemeMode;
  label: string;
  ariaLabel: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
}

/**
 * ThemeToggle Component
 * 
 * Implements a three-state theme switcher with full accessibility compliance.
 * Uses Headless UI Switch for unstyled, accessible foundation with custom styling
 * applied via Tailwind CSS and class-variance-authority variants.
 * 
 * @param props - ThemeToggle configuration options
 * @returns JSX.Element - Rendered theme toggle component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ThemeToggle />
 * 
 * // With custom styling and labels
 * <ThemeToggle 
 *   variant="outline" 
 *   size="lg" 
 *   showLabels 
 *   labelPosition="bottom"
 * />
 * 
 * // Compact mobile-friendly version
 * <ThemeToggle 
 *   compact 
 *   size="sm" 
 *   className="md:hidden" 
 * />
 * ```
 */
export function ThemeToggle({
  variant = 'default',
  size = 'md',
  className,
  showLabels = false,
  labelPosition = 'bottom',
  ariaLabel = 'Select theme preference',
  id,
  disabled = false,
  onThemeChange,
  enableSystem = true,
  showLoading = false,
  icons = {},
  compact = false,
  ...props
}: ThemeToggleProps) {
  // Access theme context with error handling
  const { 
    theme, 
    resolvedTheme, 
    setTheme, 
    isTheme, 
    mounted 
  } = useTheme();

  /**
   * Define available theme options with enhanced accessibility metadata
   */
  const themeOptions: ThemeOption[] = useMemo(() => {
    const baseOptions: ThemeOption[] = [
      {
        mode: 'light',
        label: 'Light',
        ariaLabel: themeToggleAriaLabels.light,
        icon: icons.light || SunIcon,
        description: 'Use light theme with bright backgrounds and dark text'
      },
      {
        mode: 'dark',
        label: 'Dark', 
        ariaLabel: themeToggleAriaLabels.dark,
        icon: icons.dark || MoonIcon,
        description: 'Use dark theme with dark backgrounds and light text'
      }
    ];

    // Add system option if enabled
    if (enableSystem) {
      baseOptions.push({
        mode: 'system',
        label: 'System',
        ariaLabel: themeToggleAriaLabels.system,
        icon: icons.system || ComputerDesktopIcon,
        description: 'Follow system color scheme preference automatically'
      });
    }

    return baseOptions;
  }, [enableSystem, icons]);

  /**
   * Handle theme selection with validation and callbacks
   */
  const handleThemeSelect = useCallback((selectedTheme: ThemeMode) => {
    try {
      // Validate theme mode before setting
      if (!['light', 'dark', 'system'].includes(selectedTheme)) {
        console.warn(`Invalid theme mode: ${selectedTheme}`);
        return;
      }

      // Update theme in context
      setTheme(selectedTheme);
      
      // Fire custom callback if provided
      onThemeChange?.(selectedTheme);
      
      // Announce change to screen readers
      const announcement = `Theme changed to ${selectedTheme}`;
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      // Remove announcement after screen readers have processed it
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to change theme:', error);
    }
  }, [setTheme, onThemeChange]);

  /**
   * Get dynamic styling based on current theme state
   */
  const getThemeStateVariant = useCallback((mode: ThemeMode): ThemeToggleVariantProps['themeState'] => {
    if (isTheme(mode)) {
      return mode as ThemeToggleVariantProps['themeState'];
    }
    return undefined;
  }, [isTheme]);

  /**
   * Render individual theme option button
   */
  const renderThemeOption = useCallback((option: ThemeOption) => {
    const isSelected = isTheme(option.mode);
    const IconComponent = option.icon;
    const iconSize = themeToggleIconSizes[size];
    
    // Get variant-specific styling
    const variantProps: ThemeToggleVariantProps = {
      variant,
      size,
      themeState: getThemeStateVariant(option.mode),
      loading: showLoading
    };
    
    const buttonClasses = getThemeToggleClasses(variantProps, cn(
      themeToggleAnimations.colorTransition,
      themeToggleAnimations.scaleOnPress,
      showLoading && themeToggleAnimations.loadingPulse,
      'group relative'
    ));

    return (
      <Switch
        key={option.mode}
        checked={isSelected}
        onChange={() => handleThemeSelect(option.mode)}
        disabled={disabled || showLoading}
        className={buttonClasses}
        aria-label={option.ariaLabel}
        aria-describedby={`${id || 'theme-toggle'}-${option.mode}-description`}
        data-state={isSelected ? 'on' : 'off'}
        data-theme={option.mode}
      >
        {/* Icon with proper sizing and accessibility */}
        <IconComponent 
          className={cn(
            iconSize,
            themeToggleAnimations.iconRotation,
            'flex-shrink-0',
            // Enhanced contrast for better visibility
            isSelected 
              ? 'text-current' 
              : 'text-current opacity-70 group-hover:opacity-100'
          )}
          aria-hidden="true"
        />
        
        {/* Selection indicator for enhanced feedback */}
        {isSelected && (
          <CheckIcon 
            className={cn(
              'absolute -top-1 -right-1 h-3 w-3',
              'text-primary-600 dark:text-primary-400',
              'bg-white dark:bg-gray-900 rounded-full',
              'ring-1 ring-primary-600 dark:ring-primary-400',
              themeToggleAnimations.iconRotation
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Label text (if enabled and not compact) */}
        {showLabels && !compact && (
          <span className={cn(
            'text-xs font-medium mt-1',
            'text-current',
            isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
          )}>
            {option.label}
          </span>
        )}
        
        {/* Hidden description for screen readers */}
        <span 
          id={`${id || 'theme-toggle'}-${option.mode}-description`}
          className="sr-only"
        >
          {option.description}
        </span>
      </Switch>
    );
  }, [
    variant, 
    size, 
    disabled, 
    showLoading, 
    showLabels, 
    compact, 
    id, 
    isTheme, 
    handleThemeSelect, 
    getThemeStateVariant
  ]);

  /**
   * Get container layout classes based on label position and compact mode
   */
  const getContainerClasses = useCallback(() => {
    if (compact) {
      return 'flex items-center space-x-1';
    }
    
    if (!showLabels) {
      return 'flex items-center space-x-2';
    }
    
    switch (labelPosition) {
      case 'top':
        return 'flex flex-col space-y-2';
      case 'bottom':
        return 'flex flex-col space-y-2';
      case 'left':
        return 'flex items-center space-x-3';
      case 'right':
        return 'flex items-center space-x-3 flex-row-reverse';
      default:
        return 'flex items-center space-x-2';
    }
  }, [compact, showLabels, labelPosition]);

  /**
   * Get grid layout for theme options
   */
  const getOptionsGridClasses = useCallback(() => {
    if (compact) {
      return 'flex space-x-1';
    }
    
    const optionCount = themeOptions.length;
    
    if (showLabels && (labelPosition === 'top' || labelPosition === 'bottom')) {
      return `grid grid-cols-${optionCount} gap-3`;
    }
    
    return 'flex space-x-2';
  }, [compact, showLabels, labelPosition, themeOptions.length]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div 
        className={cn(getContainerClasses(), 'animate-pulse', className)}
        aria-hidden="true"
      >
        <div className="flex space-x-2">
          {themeOptions.map((option) => (
            <div 
              key={option.mode}
              className={cn(
                'h-11 w-11 bg-gray-200 dark:bg-gray-700 rounded-md',
                size === 'sm' && 'h-11 w-11',
                size === 'md' && 'h-12 w-12', 
                size === 'lg' && 'h-14 w-14'
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(getContainerClasses(), className)}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-describedby={`${id || 'theme-toggle'}-description`}
      id={id}
      {...props}
    >
      {/* Hidden description for screen readers */}
      <span 
        id={`${id || 'theme-toggle'}-description`}
        className="sr-only"
      >
        Select your preferred color theme. Current theme: {theme}
        {theme === 'system' && `, resolving to ${resolvedTheme}`}
      </span>
      
      {/* Loading indicator overlay */}
      {showLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-md"
          aria-label={themeToggleAriaLabels.loading}
        >
          <div className="animate-spin h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}
      
      {/* Theme option buttons */}
      <div className={getOptionsGridClasses()}>
        {themeOptions.map(renderThemeOption)}
      </div>
      
      {/* Current resolved theme indicator for system mode */}
      {theme === 'system' && !compact && (
        <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
          <span className="sr-only">System theme resolved to: </span>
          Following {resolvedTheme} mode
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for mobile/constrained spaces
 */
export function CompactThemeToggle(props: Omit<ThemeToggleProps, 'compact'>) {
  return <ThemeToggle {...props} compact />;
}

/**
 * Pre-configured variants for common use cases
 */
export const ThemeToggleVariants = {
  /**
   * Header/navbar variant with compact design
   */
  Header: (props: Partial<ThemeToggleProps>) => (
    <ThemeToggle 
      variant="ghost"
      size="sm"
      compact
      {...props}
    />
  ),
  
  /**
   * Settings page variant with labels
   */
  Settings: (props: Partial<ThemeToggleProps>) => (
    <ThemeToggle
      variant="outline"
      size="md"
      showLabels
      labelPosition="bottom"
      {...props}
    />
  ),
  
  /**
   * Mobile-friendly variant
   */
  Mobile: (props: Partial<ThemeToggleProps>) => (
    <ThemeToggle
      variant="secondary"
      size="lg"
      compact
      className="md:hidden"
      {...props}
    />
  ),
  
  /**
   * Accessibility-enhanced variant for high contrast needs
   */
  HighContrast: (props: Partial<ThemeToggleProps>) => (
    <ThemeToggle
      variant="outline"
      size="lg"
      showLabels
      labelPosition="right"
      className="border-2 focus-within:ring-4"
      {...props}
    />
  )
};

// Export types for external use
export type { ThemeToggleProps };

// Export the main component as default
export default ThemeToggle;