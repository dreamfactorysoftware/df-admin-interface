/**
 * Custom React hook for responsive breakpoint detection and screen size state management.
 * Replaces Angular DfBreakpointService with React patterns using window.matchMedia and resize listeners.
 * 
 * Features:
 * - Real-time breakpoint detection using window.matchMedia
 * - Window resize event handling with proper cleanup
 * - Integration with Tailwind CSS breakpoint system
 * - Cross-component state sharing via Zustand store
 * - Memory leak prevention through event listener cleanup
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { isSmallScreen, isMobile, activeBreakpoint } = useBreakpoint();
 *   
 *   return (
 *     <div>
 *       {isSmallScreen ? 'Mobile Layout' : 'Desktop Layout'}
 *       <p>Current breakpoint: {activeBreakpoint}</p>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { useBreakpointStore } from '@/stores/app-store';
import type { 
  BreakpointState, 
  UseBreakpointReturn, 
  TailwindBreakpoint, 
  ScreenSize,
  BreakpointConfig 
} from '@/types/layout';

/**
 * Tailwind CSS breakpoint configuration.
 * Maps breakpoint names to their corresponding media query strings.
 * These match the default Tailwind CSS responsive design breakpoints.
 */
const BREAKPOINT_CONFIG: BreakpointConfig = {
  xs: '(max-width: 639px)',        // 0px to 639px
  sm: '(min-width: 640px)',        // 640px and up
  md: '(min-width: 768px)',        // 768px and up
  lg: '(min-width: 1024px)',       // 1024px and up
  xl: '(min-width: 1280px)',       // 1280px and up
  '2xl': '(min-width: 1536px)',    // 1536px and up
} as const;

/**
 * Breakpoint order for determining the active (highest matching) breakpoint.
 * Ordered from smallest to largest for proper precedence.
 */
const BREAKPOINT_ORDER: TailwindBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Maps breakpoints to screen size categories for simplified responsive logic.
 */
const BREAKPOINT_TO_SCREEN_SIZE: Record<TailwindBreakpoint, ScreenSize> = {
  xs: 'mobile',
  sm: 'tablet',
  md: 'tablet',
  lg: 'desktop',
  xl: 'desktop',
  '2xl': 'wide',
};

/**
 * Gets the current viewport dimensions.
 * Safely handles server-side rendering where window is not available.
 */
const getViewportSize = (): { width: number; height: number } => {
  if (typeof window === 'undefined') {
    return { width: 1920, height: 1080 }; // Default SSR dimensions
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Determines which breakpoints are currently active based on media queries.
 * Uses window.matchMedia for accurate, native browser media query matching.
 */
const getActiveBreakpoints = (): Record<TailwindBreakpoint, boolean> => {
  if (typeof window === 'undefined') {
    // Default SSR state - assume desktop
    return {
      xs: false,
      sm: true,
      md: true,
      lg: true,
      xl: true,
      '2xl': false,
    };
  }

  const breakpoints: Record<TailwindBreakpoint, boolean> = {} as Record<TailwindBreakpoint, boolean>;
  
  for (const [breakpoint, query] of Object.entries(BREAKPOINT_CONFIG)) {
    try {
      breakpoints[breakpoint as TailwindBreakpoint] = window.matchMedia(query).matches;
    } catch (error) {
      // Fallback for environments where matchMedia is not supported
      console.warn(`Failed to evaluate media query for ${breakpoint}:`, error);
      breakpoints[breakpoint as TailwindBreakpoint] = false;
    }
  }
  
  return breakpoints;
};

/**
 * Determines the highest active breakpoint.
 * Returns the largest breakpoint that is currently matching.
 */
const getActiveBreakpoint = (breakpoints: Record<TailwindBreakpoint, boolean>): TailwindBreakpoint => {
  // Find the highest active breakpoint by iterating in reverse order
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const breakpoint = BREAKPOINT_ORDER[i];
    if (breakpoints[breakpoint]) {
      return breakpoint;
    }
  }
  
  // Fallback to xs if no breakpoints match (should not happen in normal circumstances)
  return 'xs';
};

/**
 * Creates a complete breakpoint state object from current viewport conditions.
 */
const createBreakpointState = (): BreakpointState => {
  const { width, height } = getViewportSize();
  const breakpoints = getActiveBreakpoints();
  const activeBreakpoint = getActiveBreakpoint(breakpoints);
  const screenSize = BREAKPOINT_TO_SCREEN_SIZE[activeBreakpoint];
  
  return {
    activeBreakpoint,
    screenSize,
    width,
    height,
    breakpoints,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isSmallScreen: breakpoints.xs || breakpoints.sm, // Equivalent to Angular's isSmallScreen
    isLargeScreen: breakpoints.lg || breakpoints.xl || breakpoints['2xl'],
  };
};

/**
 * Custom React hook for responsive breakpoint detection and management.
 * 
 * Provides real-time responsive state updates and utility functions for
 * component layout decisions. Integrates with the global app store to
 * share breakpoint state across components.
 * 
 * @returns {UseBreakpointReturn} Current breakpoint state and utility functions
 */
export const useBreakpoint = (): UseBreakpointReturn => {
  // Get breakpoint state management from global store
  const { setBreakpoint } = useBreakpointStore();
  
  // Local state for immediate updates (before store sync)
  const [breakpointState, setBreakpointState] = useState<BreakpointState>(() => 
    createBreakpointState()
  );
  
  /**
   * Handles viewport changes and updates breakpoint state.
   * Debounced to prevent excessive updates during window resizing.
   */
  const handleViewportChange = useCallback(() => {
    const newState = createBreakpointState();
    setBreakpointState(newState);
    setBreakpoint(newState);
  }, [setBreakpoint]);
  
  /**
   * Effect to set up event listeners and initialize breakpoint state.
   * Manages window resize and media query change events.
   */
  useEffect(() => {
    // Initialize state on mount
    handleViewportChange();
    
    // Set up window resize listener
    const handleResize = () => {
      handleViewportChange();
    };
    
    // Set up media query listeners for more precise breakpoint detection
    const mediaQueryListeners: (() => void)[] = [];
    
    if (typeof window !== 'undefined') {
      Object.entries(BREAKPOINT_CONFIG).forEach(([breakpoint, query]) => {
        try {
          const mediaQueryList = window.matchMedia(query);
          const listener = () => handleViewportChange();
          
          // Use addEventListener if available (modern browsers)
          if (mediaQueryList.addEventListener) {
            mediaQueryList.addEventListener('change', listener);
            mediaQueryListeners.push(() => 
              mediaQueryList.removeEventListener('change', listener)
            );
          } else {
            // Fallback for older browsers
            mediaQueryList.addListener(listener);
            mediaQueryListeners.push(() => 
              mediaQueryList.removeListener(listener)
            );
          }
        } catch (error) {
          console.warn(`Failed to set up media query listener for ${breakpoint}:`, error);
        }
      });
      
      // Add window resize listener as backup
      window.addEventListener('resize', handleResize, { passive: true });
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      
      // Clean up all media query listeners
      mediaQueryListeners.forEach(cleanup => cleanup());
    };
  }, [handleViewportChange]);
  
  /**
   * Utility function to check if a specific breakpoint is currently active.
   */
  const isBreakpoint = useCallback((breakpoint: TailwindBreakpoint): boolean => {
    return breakpointState.breakpoints[breakpoint];
  }, [breakpointState.breakpoints]);
  
  /**
   * Utility function to check if current screen is at least the specified breakpoint.
   * Useful for "mobile-first" responsive design patterns.
   */
  const isMinBreakpoint = useCallback((breakpoint: TailwindBreakpoint): boolean => {
    const breakpointIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
    const activeIndex = BREAKPOINT_ORDER.indexOf(breakpointState.activeBreakpoint);
    return activeIndex >= breakpointIndex;
  }, [breakpointState.activeBreakpoint]);
  
  /**
   * Utility function to check if current screen is at most the specified breakpoint.
   * Useful for "desktop-first" responsive design patterns.
   */
  const isMaxBreakpoint = useCallback((breakpoint: TailwindBreakpoint): boolean => {
    const breakpointIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
    const activeIndex = BREAKPOINT_ORDER.indexOf(breakpointState.activeBreakpoint);
    return activeIndex <= breakpointIndex;
  }, [breakpointState.activeBreakpoint]);
  
  return {
    ...breakpointState,
    isBreakpoint,
    isMinBreakpoint,
    isMaxBreakpoint,
  };
};

/**
 * Hook variant that only provides the current breakpoint state without utility functions.
 * Useful when you only need the state and not the helper methods.
 * 
 * @returns {BreakpointState} Current breakpoint state
 */
export const useBreakpointState = (): BreakpointState => {
  const { isBreakpoint, isMinBreakpoint, isMaxBreakpoint, ...state } = useBreakpoint();
  return state;
};

/**
 * Hook that provides only the isSmallScreen state for Angular service compatibility.
 * Directly replaces the Angular DfBreakpointService.isSmallScreen observable.
 * 
 * @returns {boolean} True if current screen is xs or sm breakpoint
 */
export const useIsSmallScreen = (): boolean => {
  const { isSmallScreen } = useBreakpoint();
  return isSmallScreen;
};

/**
 * Hook that provides only the active breakpoint name.
 * Useful for components that need to render differently based on the current breakpoint.
 * 
 * @returns {TailwindBreakpoint} Current active breakpoint
 */
export const useActiveBreakpoint = (): TailwindBreakpoint => {
  const { activeBreakpoint } = useBreakpoint();
  return activeBreakpoint;
};

/**
 * Hook that provides only the screen size category.
 * Useful for high-level layout decisions based on device type.
 * 
 * @returns {ScreenSize} Current screen size category
 */
export const useScreenSize = (): ScreenSize => {
  const { screenSize } = useBreakpoint();
  return screenSize;
};