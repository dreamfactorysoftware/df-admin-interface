'use client';

/**
 * Theme Toggle Component for DreamFactory Admin Interface
 * 
 * Accessible React 19 component that provides user interface for switching between
 * light, dark, and system theme preferences. Converts Angular Material slide toggle
 * to React component using Headless UI Switch with proper ARIA labeling, keyboard
 * navigation, and visual feedback. Integrates with theme context for state management
 * and user preference persistence.
 * 
 * Features:
 * - Headless UI 2.0+ Switch component for unstyled accessible toggle control
 * - Three-state theme selection supporting light, dark, and system preferences
 * - WCAG 2.1 AA compliance with proper ARIA labels and keyboard navigation
 * - Visual feedback for current theme state with appropriate icons and styling
 * - Integration with theme context provider for state management and persistence
 * - Responsive design with mobile-optimized touch targets (minimum 44x44px)
 * - Focus-visible states for keyboard accessibility per modern standards
 * - Smooth transitions and animations for enhanced user experience
 * 
 * @version 1.0.0
 * @since React 19.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Switch } from '@headlessui/react';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { 
  SunIcon as SunIconSolid, 
  MoonIcon as MoonIconSolid, 
  ComputerDesktopIcon as ComputerDesktopIconSolid 
} from '@heroicons/react/24/solid';
import { useTheme } from './theme-provider';
import { ThemeMode, ResolvedTheme } from '@/types/theme';

/**
 * Theme option configuration interface
 */
interface ThemeOption {
  /** Theme mode identifier */
  mode: ThemeMode;
  /** Display label for the theme option */
  label: string;
  /** Icon component for outline state */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Icon component for solid state */
  iconSolid: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Accessible description for screen readers */
  description: string;
  /** Keyboard shortcut hint */
  shortcut?: string;
}

/**
 * Theme toggle component props interface
 */
interface ThemeToggleProps {
  /** Additional CSS class names */
  className?: string;
  /** Size variant for different layouts */
  size?: 'sm' | 'md' | 'lg';
  /** Layout variant */
  variant?: 'switch' | 'dropdown' | 'buttons';
  /** Whether to show labels alongside icons */
  showLabels?: boolean;
  /** Whether to show system theme option */
  enableSystem?: boolean;
  /** Custom aria-label for the toggle */
  ariaLabel?: string;
  /** Whether to disable the toggle */
  disabled?: boolean;
  /** Callback for theme change events */
  onThemeChange?: (theme: ThemeMode) => void;
}

/**
 * Theme option configurations with accessibility metadata
 */
const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'light',
    label: 'Light',
    icon: SunIcon,
    iconSolid: SunIconSolid,
    description: 'Switch to light theme with bright backgrounds and dark text',
    shortcut: 'L',
  },
  {
    mode: 'dark',
    label: 'Dark',
    icon: MoonIcon,
    iconSolid: MoonIconSolid,
    description: 'Switch to dark theme with dark backgrounds and light text',
    shortcut: 'D',
  },
  {
    mode: 'system',
    label: 'System',
    icon: ComputerDesktopIcon,
    iconSolid: ComputerDesktopIconSolid,
    description: 'Use system preference to automatically switch between light and dark themes',
    shortcut: 'S',
  },
];

/**
 * Hook for theme toggle logic and keyboard shortcuts
 */
function useThemeToggleLogic(onThemeChange?: (theme: ThemeMode) => void) {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

  /**
   * Handle theme change with callback support
   */
  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [setTheme, onThemeChange]);

  /**
   * Cycle to next theme in sequence
   */
  const cycleTheme = useCallback(() => {
    const currentIndex = THEME_OPTIONS.findIndex(option => option.mode === theme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    const nextTheme = THEME_OPTIONS[nextIndex].mode;
    handleThemeChange(nextTheme);
  }, [theme, handleThemeChange]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle Space/Enter for activation
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      cycleTheme();
      return;
    }

    // Handle theme-specific shortcuts (Alt + L/D/S)
    if (event.altKey) {
      const shortcutTheme = THEME_OPTIONS.find(
        option => option.shortcut?.toLowerCase() === event.key.toLowerCase()
      );
      
      if (shortcutTheme) {
        event.preventDefault();
        handleThemeChange(shortcutTheme.mode);
      }
    }
  }, [cycleTheme, handleThemeChange]);

  /**
   * Get current theme status for UI state
   */
  const themeStatus = useMemo(() => {
    const currentOption = THEME_OPTIONS.find(option => option.mode === theme);
    const isSystemTheme = theme === 'system';
    
    return {
      currentOption,
      resolvedTheme,
      systemTheme,
      isSystemTheme,
      effectiveIcon: isSystemTheme 
        ? (systemTheme === 'dark' ? MoonIconSolid : SunIconSolid)
        : currentOption?.iconSolid || SunIconSolid,
    };
  }, [theme, resolvedTheme, systemTheme]);

  return {
    theme,
    handleThemeChange,
    cycleTheme,
    handleKeyDown,
    themeStatus,
  };
}

/**
 * Switch variant component using Headless UI Switch
 */
function ThemeSwitchVariant({ 
  size = 'md', 
  showLabels = false, 
  ariaLabel,
  disabled = false,
  onThemeChange,
  className = ''
}: Omit<ThemeToggleProps, 'variant'>) {
  const { theme, cycleTheme, handleKeyDown, themeStatus } = useThemeToggleLogic(onThemeChange);

  // Size configuration
  const sizeConfig = {
    sm: {
      container: 'h-9 min-w-[44px]',
      switch: 'h-7 w-12',
      thumb: 'h-5 w-5',
      icon: 'h-3 w-3',
      label: 'text-sm',
    },
    md: {
      container: 'h-11 min-w-[44px]',
      switch: 'h-8 w-14',
      thumb: 'h-6 w-6',
      icon: 'h-4 w-4',
      label: 'text-base',
    },
    lg: {
      container: 'h-12 min-w-[48px]',
      switch: 'h-10 w-16',
      thumb: 'h-8 w-8',
      icon: 'h-5 w-5',
      label: 'text-lg',
    },
  };

  const config = sizeConfig[size];
  const IconComponent = themeStatus.effectiveIcon;

  return (
    <div 
      className={`flex items-center space-x-3 ${config.container} ${className}`}
      role="group"
      aria-labelledby="theme-toggle-label"
    >
      {showLabels && (
        <span 
          id="theme-toggle-label"
          className={`font-medium text-gray-700 dark:text-gray-300 ${config.label}`}
        >
          Theme
        </span>
      )}
      
      <Switch
        checked={theme !== 'light'}
        onChange={cycleTheme}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          relative inline-flex items-center ${config.switch} rounded-full
          transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${theme === 'light' 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : theme === 'dark'
            ? 'bg-gray-800 dark:bg-gray-900'
            : 'bg-gradient-to-r from-gray-200 to-gray-800 dark:from-gray-700 dark:to-gray-900'
          }
        `}
        aria-label={
          ariaLabel || 
          `Theme toggle. Current theme: ${themeStatus.currentOption?.label}. ${themeStatus.currentOption?.description}`
        }
        aria-describedby="theme-toggle-description"
      >
        <span
          className={`
            ${config.thumb}
            transform rounded-full transition-all duration-200 ease-in-out
            flex items-center justify-center
            bg-white dark:bg-gray-100 shadow-lg
            ${theme === 'light' 
              ? 'translate-x-1' 
              : theme === 'dark'
              ? `translate-x-${size === 'sm' ? '5' : size === 'md' ? '6' : '7'}`
              : `translate-x-${size === 'sm' ? '3' : size === 'md' ? '4' : '5'}`
            }
          `}
        >
          <IconComponent
            className={`${config.icon} ${
              theme === 'light' 
                ? 'text-yellow-500' 
                : theme === 'dark'
                ? 'text-blue-500'
                : 'text-purple-500'
            }`}
            aria-hidden="true"
          />
        </span>
      </Switch>

      <span 
        id="theme-toggle-description" 
        className="sr-only"
      >
        Press Space or Enter to cycle through theme options. 
        Use Alt+L for light, Alt+D for dark, or Alt+S for system theme.
        {themeStatus.isSystemTheme && 
          ` System preference is currently ${themeStatus.systemTheme}.`
        }
      </span>
    </div>
  );
}

/**
 * Dropdown variant for more explicit theme selection
 */
function ThemeDropdownVariant({ 
  size = 'md', 
  showLabels = true, 
  enableSystem = true,
  ariaLabel,
  disabled = false,
  onThemeChange,
  className = ''
}: Omit<ThemeToggleProps, 'variant'>) {
  const { theme, handleThemeChange, themeStatus } = useThemeToggleLogic(onThemeChange);
  const [isOpen, setIsOpen] = useState(false);

  const availableOptions = enableSystem ? THEME_OPTIONS : THEME_OPTIONS.filter(opt => opt.mode !== 'system');

  const sizeConfig = {
    sm: {
      button: 'h-9 px-3 text-sm',
      icon: 'h-4 w-4',
      menu: 'text-sm',
    },
    md: {
      button: 'h-11 px-4 text-base',
      icon: 'h-5 w-5',
      menu: 'text-base',
    },
    lg: {
      button: 'h-12 px-5 text-lg',
      icon: 'h-6 w-6',
      menu: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          ${config.button}
          min-w-[44px] inline-flex items-center justify-between
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-md shadow-sm
          text-gray-700 dark:text-gray-300
          hover:bg-gray-50 dark:hover:bg-gray-700
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
        aria-label={ariaLabel || 'Select theme preference'}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center space-x-2">
          <themeStatus.effectiveIcon 
            className={`${config.icon} ${
              theme === 'light' 
                ? 'text-yellow-500' 
                : theme === 'dark'
                ? 'text-blue-500'
                : 'text-purple-500'
            }`}
            aria-hidden="true"
          />
          {showLabels && (
            <span className="font-medium">
              {themeStatus.currentOption?.label}
            </span>
          )}
        </div>
        
        <svg 
          className={`${config.icon} text-gray-400 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className={`
            absolute top-full left-0 mt-2 w-48 z-50
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            rounded-md shadow-lg ring-1 ring-black ring-opacity-5
            ${config.menu}
          `}
          role="listbox"
          aria-label="Theme options"
        >
          <div className="py-1">
            {availableOptions.map((option) => (
              <button
                key={option.mode}
                onClick={() => {
                  handleThemeChange(option.mode);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-4 py-2 flex items-center justify-between
                  transition-colors duration-150
                  ${theme === option.mode
                    ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                role="option"
                aria-selected={theme === option.mode}
                aria-describedby={`theme-option-${option.mode}-description`}
              >
                <div className="flex items-center space-x-3">
                  <option.icon 
                    className={`${config.icon} ${
                      option.mode === 'light' 
                        ? 'text-yellow-500' 
                        : option.mode === 'dark'
                        ? 'text-blue-500'
                        : 'text-purple-500'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div 
                      id={`theme-option-${option.mode}-description`}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {option.description}
                    </div>
                  </div>
                </div>
                
                {theme === option.mode && (
                  <CheckIcon 
                    className={`${config.icon} text-primary-600 dark:text-primary-400`}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside handler */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/**
 * Button group variant for explicit theme selection
 */
function ThemeButtonsVariant({ 
  size = 'md', 
  showLabels = false, 
  enableSystem = true,
  ariaLabel,
  disabled = false,
  onThemeChange,
  className = ''
}: Omit<ThemeToggleProps, 'variant'>) {
  const { theme, handleThemeChange } = useThemeToggleLogic(onThemeChange);

  const availableOptions = enableSystem ? THEME_OPTIONS : THEME_OPTIONS.filter(opt => opt.mode !== 'system');

  const sizeConfig = {
    sm: {
      button: 'h-9 w-9 text-sm',
      icon: 'h-4 w-4',
    },
    md: {
      button: 'h-11 w-11 text-base',
      icon: 'h-5 w-5',
    },
    lg: {
      button: 'h-12 w-12 text-lg',
      icon: 'h-6 w-6',
    },
  };

  const config = sizeConfig[size];

  return (
    <div 
      className={`flex items-center ${className}`}
      role="group"
      aria-label={ariaLabel || 'Theme selection buttons'}
    >
      {availableOptions.map((option, index) => {
        const isSelected = theme === option.mode;
        const IconComponent = isSelected ? option.iconSolid : option.icon;
        
        return (
          <button
            key={option.mode}
            onClick={() => handleThemeChange(option.mode)}
            disabled={disabled}
            className={`
              ${config.button}
              inline-flex items-center justify-center
              transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${index === 0 ? 'rounded-l-md' : ''}
              ${index === availableOptions.length - 1 ? 'rounded-r-md' : ''}
              ${index > 0 ? '-ml-px' : ''}
              ${isSelected
                ? 'bg-primary-600 text-white border border-primary-600 z-10'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
            aria-label={`${option.label} theme`}
            aria-pressed={isSelected}
            title={option.description}
          >
            <IconComponent 
              className={`${config.icon} ${
                isSelected 
                  ? 'text-white' 
                  : option.mode === 'light' 
                  ? 'text-yellow-500' 
                  : option.mode === 'dark'
                  ? 'text-blue-500'
                  : 'text-purple-500'
              }`}
              aria-hidden="true"
            />
            {showLabels && (
              <span className="ml-2 font-medium">
                {option.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Main Theme Toggle Component
 * 
 * Provides accessible theme switching interface with multiple variants and
 * comprehensive WCAG 2.1 AA compliance. Integrates with theme context for
 * state management and persistence.
 * 
 * @param props - Theme toggle configuration options
 * @returns Accessible theme toggle component
 * 
 * @example
 * ```tsx
 * // Switch variant (default)
 * <ThemeToggle />
 * 
 * // Dropdown variant with labels
 * <ThemeToggle variant="dropdown" showLabels={true} />
 * 
 * // Button group variant
 * <ThemeToggle variant="buttons" size="lg" />
 * 
 * // With custom callback
 * <ThemeToggle 
 *   onThemeChange={(theme) => console.log('Theme changed to:', theme)}
 *   ariaLabel="Application theme selector"
 * />
 * ```
 */
export function ThemeToggle({
  variant = 'switch',
  size = 'md',
  showLabels = false,
  enableSystem = true,
  className = '',
  ariaLabel,
  disabled = false,
  onThemeChange,
}: ThemeToggleProps) {
  const commonProps = {
    size,
    showLabels,
    enableSystem,
    ariaLabel,
    disabled,
    onThemeChange,
    className,
  };

  switch (variant) {
    case 'dropdown':
      return <ThemeDropdownVariant {...commonProps} />;
    case 'buttons':
      return <ThemeButtonsVariant {...commonProps} />;
    case 'switch':
    default:
      return <ThemeSwitchVariant {...commonProps} />;
  }
}

// Export component variants for specific use cases
export { ThemeSwitchVariant, ThemeDropdownVariant, ThemeButtonsVariant };

// Export types for external usage
export type { ThemeToggleProps, ThemeOption };

// Default export
export default ThemeToggle;