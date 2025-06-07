/**
 * Loading Spinner Component
 * 
 * Reusable loading spinner component providing animated indicators for short-duration 
 * loading states. Supports multiple sizes, themes, and accessibility features with 
 * customizable appearance for different loading contexts throughout the application.
 * 
 * Features:
 * - React 19.0 stable functional component with enhanced concurrent features
 * - Tailwind CSS 4.1+ utility-first styling with custom animation classes
 * - WCAG 2.1 AA accessibility compliance including ARIA labels and motion preferences
 * - Theme integration supporting dynamic light/dark mode switching
 * - TypeScript 5.8+ with strict type checking and comprehensive prop interfaces
 * - Size variants (small, medium, large) using class-variance-authority
 * - Multiple spinner styles and customizable overlay options
 * 
 * @fileoverview Loading spinner component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import type { LoadingStateValue, LoadingPriority, LoadingCategory } from '@/types/loading';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Spinner style variants for different visual appearances
 */
export type SpinnerStyle = 
  | 'circular'     // Classic circular spinner (default)
  | 'dots'         // Three bouncing dots
  | 'pulse'        // Pulsing circle
  | 'bars'         // Vertical bars animation
  | 'ring'         // Ring with rotating segment
  | 'dual'         // Dual concentric rings
  | 'wave'         // Wave-like animation
  | 'fade';        // Fading circles

/**
 * Spinner color variants based on context and theme
 */
export type SpinnerColor = 
  | 'primary'      // Primary brand color
  | 'secondary'    // Secondary/muted color
  | 'success'      // Success state color
  | 'warning'      // Warning state color
  | 'error'        // Error state color
  | 'info'         // Information color
  | 'current'      // Inherit current text color
  | 'white'        // White color for dark backgrounds
  | 'inherit';     // Inherit from parent

/**
 * Animation speed variants for different loading contexts
 */
export type SpinnerSpeed = 'slow' | 'normal' | 'fast' | 'instant';

/**
 * Overlay configuration for modal-style loading states
 */
export interface OverlayConfig {
  /** Whether to show backdrop overlay */
  enabled: boolean;
  /** Overlay background opacity (0-100) */
  opacity?: number;
  /** Whether overlay is dismissible by clicking */
  dismissible?: boolean;
  /** Custom overlay className */
  className?: string;
  /** Z-index for overlay positioning */
  zIndex?: number;
}

/**
 * Accessibility configuration for screen readers and motion preferences
 */
export interface AccessibilityConfig {
  /** ARIA label for the spinner */
  label?: string;
  /** ARIA description for detailed context */
  description?: string;
  /** Whether to respect user's reduced motion preference */
  respectReducedMotion?: boolean;
  /** Custom role attribute */
  role?: string;
  /** Whether to announce loading state changes */
  announceChanges?: boolean;
  /** Live region politeness level */
  liveRegion?: 'polite' | 'assertive' | 'off';
}

/**
 * Loading context information for intelligent behavior
 */
export interface LoadingContext {
  /** Loading state value */
  state?: LoadingStateValue;
  /** Loading operation priority */
  priority?: LoadingPriority;
  /** Loading operation category */
  category?: LoadingCategory;
  /** Expected duration in milliseconds */
  expectedDuration?: number;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Custom loading message */
  message?: string;
}

/**
 * Component variant props using class-variance-authority
 */
const spinnerVariants = cva(
  // Base classes for all spinners
  [
    'inline-block',
    'transition-all duration-200 ease-in-out',
    'motion-reduce:animate-none', // Respect reduced motion preference
  ],
  {
    variants: {
      size: {
        xs: 'w-3 h-3',      // 12px - For inline text loading
        sm: 'w-4 h-4',      // 16px - Small buttons and compact areas
        md: 'w-6 h-6',      // 24px - Default size for most contexts
        lg: 'w-8 h-8',      // 32px - Larger buttons and emphasis
        xl: 'w-12 h-12',    // 48px - Modal overlays and major operations
        '2xl': 'w-16 h-16', // 64px - Full-page loading states
        '3xl': 'w-24 h-24', // 96px - Splash screens and major waits
      },
      
      style: {
        circular: 'animate-spin',
        dots: 'flex items-center justify-center space-x-1',
        pulse: 'animate-pulse',
        bars: 'flex items-end justify-center space-x-0.5',
        ring: 'animate-spin',
        dual: 'animate-spin',
        wave: 'flex items-center justify-center space-x-0.5',
        fade: 'flex items-center justify-center space-x-1',
      },
      
      color: {
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-500 dark:text-secondary-400',
        success: 'text-success-500 dark:text-success-400',
        warning: 'text-warning-500 dark:text-warning-400',
        error: 'text-error-500 dark:text-error-400',
        info: 'text-blue-500 dark:text-blue-400',
        current: 'text-current',
        white: 'text-white',
        inherit: '',
      },
      
      speed: {
        slow: '[animation-duration:2s]',
        normal: '[animation-duration:1s]',
        fast: '[animation-duration:0.5s]',
        instant: '[animation-duration:0.1s]',
      },
    },
    defaultVariants: {
      size: 'md',
      style: 'circular',
      color: 'current',
      speed: 'normal',
    },
  }
);

/**
 * Props interface for the LoadingSpinner component
 */
export interface LoadingSpinnerProps 
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
          VariantProps<typeof spinnerVariants> {
  
  // Core appearance props
  /** Spinner style variant */
  style?: SpinnerStyle;
  /** Spinner color variant */
  color?: SpinnerColor;
  /** Animation speed */
  speed?: SpinnerSpeed;
  
  // Content and messaging
  /** Loading message to display below spinner */
  message?: string;
  /** Whether to show the loading message */
  showMessage?: boolean;
  /** Custom content to render alongside spinner */
  children?: React.ReactNode;
  
  // Accessibility configuration
  /** Accessibility settings */
  accessibility?: Partial<AccessibilityConfig>;
  
  // Overlay configuration
  /** Overlay settings for modal-style loading */
  overlay?: Partial<OverlayConfig>;
  
  // Loading context
  /** Loading context information */
  context?: LoadingContext;
  
  // Styling overrides
  /** Custom className for the container */
  className?: string;
  /** Custom className for the spinner element */
  spinnerClassName?: string;
  /** Custom className for the message */
  messageClassName?: string;
  
  // Behavior props
  /** Whether spinner should be centered in its container */
  centered?: boolean;
  /** Whether to show spinner (for conditional rendering) */
  visible?: boolean;
  /** Delay before showing spinner (prevents flash for quick operations) */
  delay?: number;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default accessibility configuration
 */
const DEFAULT_ACCESSIBILITY: Required<AccessibilityConfig> = {
  label: 'Loading',
  description: 'Content is loading, please wait',
  respectReducedMotion: true,
  role: 'status',
  announceChanges: false,
  liveRegion: 'polite',
};

/**
 * Default overlay configuration
 */
const DEFAULT_OVERLAY: Required<OverlayConfig> = {
  enabled: false,
  opacity: 50,
  dismissible: false,
  className: '',
  zIndex: 50,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate appropriate ARIA attributes based on configuration
 */
const getAriaAttributes = (
  accessibility: Required<AccessibilityConfig>,
  context?: LoadingContext
) => {
  const attrs: Record<string, string> = {};
  
  // Basic ARIA attributes
  attrs['aria-label'] = accessibility.label;
  attrs['role'] = accessibility.role;
  
  if (accessibility.description) {
    attrs['aria-describedby'] = 'spinner-description';
  }
  
  if (accessibility.liveRegion !== 'off') {
    attrs['aria-live'] = accessibility.liveRegion;
    attrs['aria-atomic'] = 'true';
  }
  
  // Context-specific attributes
  if (context?.progress !== undefined) {
    attrs['aria-valuenow'] = context.progress.toString();
    attrs['aria-valuemin'] = '0';
    attrs['aria-valuemax'] = '100';
  }
  
  if (context?.state) {
    attrs['aria-busy'] = (context.state === 'loading').toString();
  }
  
  return attrs;
};

/**
 * Get theme-aware color classes
 */
const getThemeAwareColorClasses = (
  color: SpinnerColor, 
  resolvedTheme: 'light' | 'dark'
): string => {
  const colorMap: Record<SpinnerColor, { light: string; dark: string }> = {
    primary: {
      light: 'text-primary-600',
      dark: 'text-primary-400'
    },
    secondary: {
      light: 'text-secondary-600', 
      dark: 'text-secondary-400'
    },
    success: {
      light: 'text-success-600',
      dark: 'text-success-400'
    },
    warning: {
      light: 'text-warning-600',
      dark: 'text-warning-400'
    },
    error: {
      light: 'text-error-600',
      dark: 'text-error-400'
    },
    info: {
      light: 'text-blue-600',
      dark: 'text-blue-400'
    },
    current: {
      light: 'text-current',
      dark: 'text-current'
    },
    white: {
      light: 'text-white',
      dark: 'text-white'
    },
    inherit: {
      light: '',
      dark: ''
    },
  };
  
  return colorMap[color][resolvedTheme];
};

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  } catch {
    return false;
  }
};

// =============================================================================
// SPINNER STYLE COMPONENTS
// =============================================================================

/**
 * Circular spinner (classic rotating circle)
 */
const CircularSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <svg 
    className={cn(className, !reducedMotion && 'animate-spin')} 
    fill="none" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Dots spinner (three bouncing dots)
 */
const DotsSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <div className={className}>
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className={cn(
          'w-2 h-2 rounded-full bg-current',
          !reducedMotion && 'animate-bounce',
          !reducedMotion && index === 1 && '[animation-delay:0.1s]',
          !reducedMotion && index === 2 && '[animation-delay:0.2s]'
        )}
        style={reducedMotion ? undefined : {
          animationDelay: `${index * 0.1}s`
        }}
      />
    ))}
  </div>
);

/**
 * Pulse spinner (pulsing circle)
 */
const PulseSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <div 
    className={cn(
      className,
      'rounded-full bg-current',
      !reducedMotion && 'animate-pulse'
    )}
  />
);

/**
 * Bars spinner (vertical bars animation)
 */
const BarsSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <div className={className}>
    {[0, 1, 2, 3].map((index) => (
      <div
        key={index}
        className={cn(
          'w-1 bg-current rounded-full',
          !reducedMotion && 'animate-pulse',
          'h-full'
        )}
        style={reducedMotion ? undefined : {
          animationDelay: `${index * 0.1}s`,
          animationDuration: '1.2s'
        }}
      />
    ))}
  </div>
);

/**
 * Ring spinner (ring with rotating segment)
 */
const RingSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <svg 
    className={cn(className, !reducedMotion && 'animate-spin')} 
    fill="none" 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle
      className="opacity-75"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="31.416"
      strokeDashoffset="15.708"
    />
  </svg>
);

/**
 * Dual spinner (dual concentric rings)
 */
const DualSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <div className={cn(className, 'relative')}>
    <svg 
      className={cn('absolute inset-0', !reducedMotion && 'animate-spin')} 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-40"
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="25.13"
        strokeDashoffset="12.57"
      />
    </svg>
    <svg 
      className={cn('relative', !reducedMotion && 'animate-spin animate-reverse')} 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={reducedMotion ? undefined : { animationDirection: 'reverse' }}
    >
      <circle
        className="opacity-60"
        cx="12"
        cy="12"
        r="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="18.85"
        strokeDashoffset="9.42"
      />
    </svg>
  </div>
);

/**
 * Wave spinner (wave-like animation)
 */
const WaveSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <div className={className}>
    {[0, 1, 2, 3, 4].map((index) => (
      <div
        key={index}
        className={cn(
          'w-1 h-4 bg-current rounded-full',
          !reducedMotion && 'animate-pulse'
        )}
        style={reducedMotion ? undefined : {
          animationDelay: `${index * 0.1}s`,
          animationDuration: '1s'
        }}
      />
    ))}
  </div>
);

/**
 * Fade spinner (fading circles)
 */
const FadeSpinner: React.FC<{ 
  className: string; 
  reducedMotion: boolean;
}> = ({ className, reducedMotion }) => (
  <div className={className}>
    {[0, 1, 2].map((index) => (
      <div
        key={index}
        className={cn(
          'w-3 h-3 rounded-full bg-current',
          !reducedMotion && 'animate-pulse'
        )}
        style={reducedMotion ? undefined : {
          animationDelay: `${index * 0.2}s`,
          animationDuration: '1.5s'
        }}
      />
    ))}
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * LoadingSpinner Component
 * 
 * A comprehensive loading spinner component with multiple styles, sizes, and
 * accessibility features. Supports theme integration and WCAG 2.1 AA compliance.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 * 
 * // With custom size and color
 * <LoadingSpinner size="lg" color="primary" />
 * 
 * // With message and overlay
 * <LoadingSpinner 
 *   size="xl"
 *   style="dots"
 *   message="Loading data..."
 *   overlay={{ enabled: true, opacity: 75 }}
 * />
 * 
 * // With accessibility configuration
 * <LoadingSpinner
 *   accessibility={{
 *     label: "Loading database schema",
 *     description: "Please wait while we fetch the database structure"
 *   }}
 * />
 * 
 * // With loading context
 * <LoadingSpinner
 *   context={{
 *     state: 'loading',
 *     priority: 'high',
 *     category: 'api',
 *     progress: 65
 *   }}
 * />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  style = 'circular',
  color = 'current',
  speed = 'normal',
  message,
  showMessage = !!message,
  children,
  accessibility: accessibilityConfig,
  overlay: overlayConfig,
  context,
  className,
  spinnerClassName,
  messageClassName,
  centered = false,
  visible = true,
  delay = 0,
  ...props
}) => {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================
  
  const { resolvedTheme, mounted } = useTheme();
  const [shouldShow, setShouldShow] = React.useState(delay === 0);
  
  // Handle delay for preventing flash on quick operations
  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [delay]);
  
  // =============================================================================
  // CONFIGURATION MERGING
  // =============================================================================
  
  const accessibility = React.useMemo(
    () => ({ ...DEFAULT_ACCESSIBILITY, ...accessibilityConfig }),
    [accessibilityConfig]
  );
  
  const overlay = React.useMemo(
    () => ({ ...DEFAULT_OVERLAY, ...overlayConfig }),
    [overlayConfig]
  );
  
  // =============================================================================
  // ACCESSIBILITY AND MOTION PREFERENCES
  // =============================================================================
  
  const reducedMotion = React.useMemo(() => {
    return accessibility.respectReducedMotion && prefersReducedMotion();
  }, [accessibility.respectReducedMotion]);
  
  const ariaAttributes = React.useMemo(
    () => getAriaAttributes(accessibility, context),
    [accessibility, context]
  );
  
  // =============================================================================
  // THEME AND STYLING
  // =============================================================================
  
  const themeAwareColorClass = React.useMemo(() => {
    if (!mounted) return '';
    return getThemeAwareColorClasses(color, resolvedTheme);
  }, [color, resolvedTheme, mounted]);
  
  const spinnerClasses = React.useMemo(() => {
    return cn(
      spinnerVariants({ size, style, speed }),
      themeAwareColorClass,
      spinnerClassName
    );
  }, [size, style, speed, themeAwareColorClass, spinnerClassName]);
  
  // =============================================================================
  // SPINNER RENDERING
  // =============================================================================
  
  const renderSpinner = React.useCallback(() => {
    const baseProps = {
      className: spinnerClasses,
      reducedMotion,
    };
    
    switch (style) {
      case 'dots':
        return <DotsSpinner {...baseProps} />;
      case 'pulse':
        return <PulseSpinner {...baseProps} />;
      case 'bars':
        return <BarsSpinner {...baseProps} />;
      case 'ring':
        return <RingSpinner {...baseProps} />;
      case 'dual':
        return <DualSpinner {...baseProps} />;
      case 'wave':
        return <WaveSpinner {...baseProps} />;
      case 'fade':
        return <FadeSpinner {...baseProps} />;
      case 'circular':
      default:
        return <CircularSpinner {...baseProps} />;
    }
  }, [style, spinnerClasses, reducedMotion]);
  
  // =============================================================================
  // EARLY RETURNS
  // =============================================================================
  
  // Don't render if not visible or delayed
  if (!visible || !shouldShow) {
    return null;
  }
  
  // =============================================================================
  // CONTENT PREPARATION
  // =============================================================================
  
  const containerClasses = cn(
    'flex flex-col items-center gap-2',
    centered && 'justify-center min-h-[4rem]',
    className
  );
  
  const messageClasses = cn(
    'text-sm text-secondary-600 dark:text-secondary-400 text-center',
    'max-w-xs leading-relaxed',
    messageClassName
  );
  
  const overlayClasses = cn(
    'fixed inset-0 flex items-center justify-center',
    'transition-all duration-200',
    overlay.enabled && [
      'bg-black',
      `bg-opacity-${overlay.opacity}`,
      overlay.className,
    ]
  );
  
  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================
  
  const spinnerContent = (
    <div 
      className={containerClasses}
      {...ariaAttributes}
      {...props}
    >
      {/* Main spinner */}
      {renderSpinner()}
      
      {/* Loading message */}
      {showMessage && (message || context?.message) && (
        <div className={messageClasses}>
          {message || context?.message}
        </div>
      )}
      
      {/* Progress indicator if available */}
      {context?.progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="bg-secondary-200 dark:bg-secondary-700 rounded-full h-1">
            <div 
              className="bg-current h-1 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, context.progress))}%` }}
            />
          </div>
          <div className="text-xs text-secondary-500 dark:text-secondary-400 text-center mt-1">
            {Math.round(context.progress)}%
          </div>
        </div>
      )}
      
      {/* Custom children content */}
      {children}
      
      {/* Hidden description for screen readers */}
      {accessibility.description && (
        <div 
          id="spinner-description" 
          className="sr-only"
          aria-hidden="true"
        >
          {accessibility.description}
        </div>
      )}
    </div>
  );
  
  // Render with overlay if enabled
  if (overlay.enabled) {
    return (
      <div 
        className={overlayClasses}
        style={{ zIndex: overlay.zIndex }}
        onClick={overlay.dismissible ? undefined : (e) => e.stopPropagation()}
      >
        {spinnerContent}
      </div>
    );
  }
  
  // Render without overlay
  return spinnerContent;
};

// =============================================================================
// COMPONENT VARIANTS AND PRESETS
// =============================================================================

/**
 * Small inline spinner for buttons and compact areas
 */
export const InlineSpinner: React.FC<Omit<LoadingSpinnerProps, 'size' | 'centered'>> = (props) => (
  <LoadingSpinner size="sm" centered={false} {...props} />
);

/**
 * Large overlay spinner for major loading operations
 */
export const OverlaySpinner: React.FC<Omit<LoadingSpinnerProps, 'overlay' | 'size'>> = (props) => (
  <LoadingSpinner 
    size="xl" 
    overlay={{ enabled: true, opacity: 50 }} 
    {...props} 
  />
);

/**
 * Page-level spinner for full-page loading states
 */
export const PageSpinner: React.FC<Omit<LoadingSpinnerProps, 'size' | 'centered' | 'overlay'>> = (props) => (
  <LoadingSpinner 
    size="2xl" 
    centered={true}
    style="dual"
    overlay={{ enabled: true, opacity: 75 }}
    className="min-h-screen"
    {...props} 
  />
);

/**
 * Button spinner for loading buttons
 */
export const ButtonSpinner: React.FC<Omit<LoadingSpinnerProps, 'size' | 'centered'>> = (props) => (
  <LoadingSpinner 
    size="sm" 
    centered={false}
    color="white"
    style="circular"
    {...props} 
  />
);

// =============================================================================
// EXPORTS
// =============================================================================

export default LoadingSpinner;

// Export types for external usage
export type {
  LoadingSpinnerProps,
  SpinnerStyle,
  SpinnerColor,
  SpinnerSpeed,
  OverlayConfig,
  AccessibilityConfig,
  LoadingContext,
};