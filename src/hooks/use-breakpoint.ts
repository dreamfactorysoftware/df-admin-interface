'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS 4.1+ breakpoint system
 * These values correspond to the min-width media queries
 */
export const BREAKPOINTS = {
  xs: 475,   // Extra small devices (large phones)
  sm: 640,   // Small devices (tablets)
  md: 768,   // Medium devices (small laptops) 
  lg: 1024,  // Large devices (laptops/desktops)
  xl: 1280,  // Extra large devices (large desktops)
  '2xl': 1536, // 2X large devices (larger desktops)
  '3xl': 1920, // 3X large devices (ultra-wide displays)
} as const;

/**
 * Breakpoint names as a union type
 */
export type BreakpointName = keyof typeof BREAKPOINTS;

/**
 * Current breakpoint state interface
 */
export interface BreakpointState {
  /** Current screen width in pixels */
  width: number;
  /** Current screen height in pixels */
  height: number;
  /** Active breakpoint name based on current width */
  current: BreakpointName;
  /** Whether device is in portrait orientation */
  isPortrait: boolean;
  /** Whether device is in landscape orientation */
  isLandscape: boolean;
  /** Convenience flags for common device types */
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  /** Breakpoint state flags for each breakpoint */
  breakpoints: Record<BreakpointName, boolean>;
}

/**
 * Hook options for customizing breakpoint detection behavior
 */
export interface UseBreakpointOptions {
  /** Custom breakpoint definitions (optional) */
  customBreakpoints?: Partial<Record<string, number>>;
  /** Debounce delay for resize events in milliseconds (default: 100) */
  debounceDelay?: number;
  /** Whether to enable server-side rendering support (default: true) */
  enableSSR?: boolean;
  /** Initial width for SSR (default: 1024) */
  ssrWidth?: number;
  /** Initial height for SSR (default: 768) */
  ssrHeight?: number;
}

/**
 * Determines the current breakpoint based on screen width
 */
const getCurrentBreakpoint = (width: number): BreakpointName => {
  if (width >= BREAKPOINTS['3xl']) return '3xl';
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  if (width >= BREAKPOINTS.xs) return 'xs';
  return 'xs'; // Fallback for very small screens
};

/**
 * Generates breakpoint state flags for all breakpoints
 */
const getBreakpointFlags = (width: number): Record<BreakpointName, boolean> => {
  return {
    xs: width >= BREAKPOINTS.xs,
    sm: width >= BREAKPOINTS.sm,
    md: width >= BREAKPOINTS.md,
    lg: width >= BREAKPOINTS.lg,
    xl: width >= BREAKPOINTS.xl,
    '2xl': width >= BREAKPOINTS['2xl'],
    '3xl': width >= BREAKPOINTS['3xl'],
  };
};

/**
 * Debounce utility function for resize events
 */
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Advanced responsive breakpoint detection hook
 * 
 * Provides comprehensive screen size state management with Tailwind CSS integration.
 * Replaces Angular DfBreakpointService with React patterns using window.matchMedia,
 * resize listeners, and optimized state management.
 * 
 * @param options - Configuration options for breakpoint detection
 * @returns Comprehensive breakpoint state and utility functions
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { current, isMobile, isAbove, isBelow } = useBreakpoint();
 *   
 *   return (
 *     <div>
 *       <p>Current breakpoint: {current}</p>
 *       {isMobile && <MobileNavigation />}
 *       {isAbove('lg') && <DesktopSidebar />}
 *       {isBelow('md') && <CompactLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export const useBreakpoint = (options: UseBreakpointOptions = {}) => {
  const {
    debounceDelay = 100,
    enableSSR = true,
    ssrWidth = 1024,
    ssrHeight = 768,
  } = options;

  // Initialize state with SSR-safe defaults
  const [state, setState] = useState<BreakpointState>(() => {
    const initialWidth = enableSSR ? ssrWidth : 0;
    const initialHeight = enableSSR ? ssrHeight : 0;
    
    return {
      width: initialWidth,
      height: initialHeight,
      current: getCurrentBreakpoint(initialWidth),
      isPortrait: initialHeight > initialWidth,
      isLandscape: initialWidth > initialHeight,
      isMobile: initialWidth < BREAKPOINTS.md,
      isTablet: initialWidth >= BREAKPOINTS.md && initialWidth < BREAKPOINTS.lg,
      isDesktop: initialWidth >= BREAKPOINTS.lg && initialWidth < BREAKPOINTS['2xl'],
      isLargeDesktop: initialWidth >= BREAKPOINTS['2xl'],
      breakpoints: getBreakpointFlags(initialWidth),
    };
  });

  // Track if component is mounted to prevent SSR hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  /**
   * Updates breakpoint state based on current window dimensions
   */
  const updateBreakpointState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const current = getCurrentBreakpoint(width);
    const isPortrait = height > width;
    const isLandscape = width > height;

    const newState: BreakpointState = {
      width,
      height,
      current,
      isPortrait,
      isLandscape,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg && width < BREAKPOINTS['2xl'],
      isLargeDesktop: width >= BREAKPOINTS['2xl'],
      breakpoints: getBreakpointFlags(width),
    };

    setState(newState);
  }, []);

  // Debounced resize handler to prevent excessive re-renders
  const debouncedUpdate = useMemo(
    () => debounce(updateBreakpointState, debounceDelay),
    [updateBreakpointState, debounceDelay]
  );

  // Initialize and set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set mounted flag and update initial state
    setIsMounted(true);
    updateBreakpointState();

    // Set up resize event listener
    window.addEventListener('resize', debouncedUpdate);

    // Set up media query listeners for more accurate breakpoint detection
    const mediaQueries = Object.entries(BREAKPOINTS).map(([name, width]) => {
      const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
      
      const handleChange = () => {
        // Trigger update when media query changes
        updateBreakpointState();
      };

      // Add listener with proper event handling
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
      }

      return { mediaQuery, handleChange, name };
    });

    // Cleanup function
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      
      // Clean up media query listeners
      mediaQueries.forEach(({ mediaQuery, handleChange }) => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          // Fallback for older browsers
          mediaQuery.removeListener(handleChange);
        }
      });
    };
  }, [debouncedUpdate, updateBreakpointState]);

  /**
   * Utility functions for breakpoint comparisons
   */
  const utilities = useMemo(() => ({
    /**
     * Check if current breakpoint is above specified breakpoint
     * @param breakpoint - Breakpoint name to compare against
     * @returns True if current width is at or above the specified breakpoint
     */
    isAbove: (breakpoint: BreakpointName): boolean => {
      return state.width >= BREAKPOINTS[breakpoint];
    },

    /**
     * Check if current breakpoint is below specified breakpoint  
     * @param breakpoint - Breakpoint name to compare against
     * @returns True if current width is below the specified breakpoint
     */
    isBelow: (breakpoint: BreakpointName): boolean => {
      return state.width < BREAKPOINTS[breakpoint];
    },

    /**
     * Check if current breakpoint exactly matches specified breakpoint
     * @param breakpoint - Breakpoint name to compare against
     * @returns True if current breakpoint matches exactly
     */
    isExactly: (breakpoint: BreakpointName): boolean => {
      return state.current === breakpoint;
    },

    /**
     * Check if current width is between two breakpoints
     * @param min - Minimum breakpoint name
     * @param max - Maximum breakpoint name
     * @returns True if current width is between the specified breakpoints
     */
    isBetween: (min: BreakpointName, max: BreakpointName): boolean => {
      return state.width >= BREAKPOINTS[min] && state.width < BREAKPOINTS[max];
    },

    /**
     * Get breakpoint value by name
     * @param breakpoint - Breakpoint name
     * @returns Pixel value for the breakpoint
     */
    getBreakpointValue: (breakpoint: BreakpointName): number => {
      return BREAKPOINTS[breakpoint];
    },

    /**
     * Check if device has touch capabilities (heuristic based on screen size)
     * @returns True if likely a touch device
     */
    isTouchDevice: (): boolean => {
      return state.isMobile || state.isTablet;
    },

    /**
     * Get responsive class prefix for Tailwind CSS
     * @param className - Base class name
     * @returns Object with responsive class variants
     */
    getResponsiveClasses: (className: string) => ({
      base: className,
      sm: `sm:${className}`,
      md: `md:${className}`,
      lg: `lg:${className}`,
      xl: `xl:${className}`,
      '2xl': `2xl:${className}`,
      '3xl': `3xl:${className}`,
    }),
  }), [state.width, state.current, state.isMobile, state.isTablet]);

  /**
   * Return comprehensive breakpoint state and utilities
   * Include isMounted to prevent hydration mismatches in SSR scenarios
   */
  return {
    ...state,
    ...utilities,
    isMounted,
    // Legacy compatibility methods for Angular migration
    observe: () => state, // Replaces Angular observable pattern
    isMatched: utilities.isAbove, // Replaces Angular BreakpointObserver.isMatched
  };
};

/**
 * Export breakpoint constants for external use
 */
export { BREAKPOINTS as breakpoints };

/**
 * Export type definitions for external use
 */
export type { BreakpointState, UseBreakpointOptions };

/**
 * HOC for providing breakpoint context to class components (migration aid)
 * @deprecated Use useBreakpoint hook directly in function components
 */
export const withBreakpoint = <P extends object>(
  Component: React.ComponentType<P & { breakpoint: BreakpointState }>
) => {
  return (props: P) => {
    const breakpoint = useBreakpoint();
    return <Component {...props} breakpoint={breakpoint} />;
  };
};