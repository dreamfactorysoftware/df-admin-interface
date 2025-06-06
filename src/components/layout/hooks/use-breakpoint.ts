/**
 * Custom React hook for responsive breakpoint detection and screen size state management.
 * Replaces Angular DfBreakpointService with React patterns using window.matchMedia
 * and integrates with Tailwind CSS breakpoint system for consistent responsive design.
 * 
 * Features:
 * - Accurate breakpoint detection using window.matchMedia API
 * - Real-time viewport dimension tracking with window resize listeners
 * - Cross-component state sharing through Zustand store integration
 * - Utility functions for common responsive design patterns
 * - Memory leak prevention with proper event listener cleanup
 * - Server-side rendering compatibility with safe window access
 */

import { useState, useEffect } from 'react';
import { useBreakpointStore } from '@/stores/app-store';
import type { 
  BreakpointState, 
  UseBreakpointReturn, 
  TailwindBreakpoint, 
  ScreenSize, 
  BreakpointConfig 
} from '@/types/layout';

/**
 * Tailwind CSS breakpoint configuration mapping to media queries.
 * Matches default Tailwind CSS responsive prefixes with exact pixel values.
 */
const BREAKPOINT_CONFIG: BreakpointConfig = {
  xs: '(max-width: 639px)',     // < 640px (mobile)
  sm: '(min-width: 640px)',     // >= 640px (small tablet)
  md: '(min-width: 768px)',     // >= 768px (tablet)
  lg: '(min-width: 1024px)',    // >= 1024px (desktop)
  xl: '(min-width: 1280px)',    // >= 1280px (large desktop)
  '2xl': '(min-width: 1536px)', // >= 1536px (wide screen)
};

/**
 * Breakpoint order for determining the highest active breakpoint.
 * Used to identify the current active breakpoint when multiple may match.
 */
const BREAKPOINT_ORDER: TailwindBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Determines the screen size category based on the active breakpoint.
 * Provides simplified responsive logic for layout components.
 * 
 * @param activeBreakpoint - Current active breakpoint
 * @returns Screen size category for responsive behavior
 */
function getScreenSize(activeBreakpoint: TailwindBreakpoint): ScreenSize {
  switch (activeBreakpoint) {
    case 'xs':
      return 'mobile';
    case 'sm':
    case 'md':
      return 'tablet';
    case 'lg':
    case 'xl':
      return 'desktop';
    case '2xl':
      return 'wide';
    default:
      return 'mobile';
  }
}

/**
 * Determines the highest active breakpoint from current media query matches.
 * Uses the breakpoint order to find the most specific matching breakpoint.
 * 
 * @param matches - Object containing boolean flags for each breakpoint
 * @returns The highest active breakpoint
 */
function getActiveBreakpoint(matches: Record<TailwindBreakpoint, boolean>): TailwindBreakpoint {
  // Find the highest breakpoint that matches (iterate in reverse order)
  for (let i = BREAKPOINT_ORDER.length - 1; i >= 0; i--) {
    const breakpoint = BREAKPOINT_ORDER[i];
    if (matches[breakpoint]) {
      return breakpoint;
    }
  }
  
  // Fallback to xs if no breakpoints match
  return 'xs';
}

/**
 * Creates convenience flags for common responsive design patterns.
 * Provides boolean flags for simplified conditional rendering and styling.
 * 
 * @param activeBreakpoint - Current active breakpoint
 * @param screenSize - Current screen size category
 * @returns Object with convenience boolean flags
 */
function getConvenienceFlags(activeBreakpoint: TailwindBreakpoint, screenSize: ScreenSize) {
  return {
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop' || screenSize === 'wide',
    isSmallScreen: activeBreakpoint === 'xs' || activeBreakpoint === 'sm',
    isLargeScreen: activeBreakpoint === 'lg' || activeBreakpoint === 'xl' || activeBreakpoint === '2xl',
  };
}

/**
 * Custom React hook for responsive breakpoint detection and screen size management.
 * Provides real-time breakpoint state and utility functions for responsive design.
 * 
 * @returns Complete breakpoint state with utility functions
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { isSmallScreen, activeBreakpoint, isMinBreakpoint } = useBreakpoint();
 *   
 *   return (
 *     <div className={`${isSmallScreen ? 'p-4' : 'p-8'}`}>
 *       {isMinBreakpoint('lg') ? (
 *         <DesktopLayout />
 *       ) : (
 *         <MobileLayout />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(): UseBreakpointReturn {
  // Get breakpoint state from Zustand store for cross-component sharing
  const { breakpoint, setBreakpoint } = useBreakpointStore();
  
  // Local state for immediate updates before store synchronization
  const [localBreakpoint, setLocalBreakpoint] = useState<BreakpointState | null>(null);
  
  // Initialize breakpoint state on mount and handle window resize events
  useEffect(() => {
    // Early return if running on server (SSR compatibility)
    if (typeof window === 'undefined') {
      return;
    }
    
    /**
     * Creates the current breakpoint state from window dimensions and media queries.
     * Calculates all breakpoint matches and determines active breakpoint.
     */
    function createBreakpointState(): BreakpointState {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Check each breakpoint media query
      const matches: Record<TailwindBreakpoint, boolean> = {
        xs: window.matchMedia(BREAKPOINT_CONFIG.xs).matches,
        sm: window.matchMedia(BREAKPOINT_CONFIG.sm).matches,
        md: window.matchMedia(BREAKPOINT_CONFIG.md).matches,
        lg: window.matchMedia(BREAKPOINT_CONFIG.lg).matches,
        xl: window.matchMedia(BREAKPOINT_CONFIG.xl).matches,
        '2xl': window.matchMedia(BREAKPOINT_CONFIG['2xl']).matches,
      };
      
      const activeBreakpoint = getActiveBreakpoint(matches);
      const screenSize = getScreenSize(activeBreakpoint);
      const convenienceFlags = getConvenienceFlags(activeBreakpoint, screenSize);
      
      return {
        activeBreakpoint,
        screenSize,
        width,
        height,
        breakpoints: matches,
        ...convenienceFlags,
      };
    }
    
    /**
     * Handles window resize events with throttling for performance.
     * Updates both local state and store state with new breakpoint information.
     */
    function handleResize() {
      const newBreakpointState = createBreakpointState();
      
      // Update local state immediately for responsive UI updates
      setLocalBreakpoint(newBreakpointState);
      
      // Update store state for cross-component access
      setBreakpoint(newBreakpointState);
    }
    
    // Initialize breakpoint state on mount
    handleResize();
    
    // Set up resize event listener with passive option for better performance
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Cleanup event listener on unmount to prevent memory leaks
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [setBreakpoint]);
  
  // Use local state if available, fallback to store state
  const currentBreakpoint = localBreakpoint || breakpoint;
  
  // Return default state if no breakpoint data is available (SSR or initial render)
  if (!currentBreakpoint) {
    return {
      activeBreakpoint: 'lg' as TailwindBreakpoint, // Default to desktop for SSR
      screenSize: 'desktop' as ScreenSize,
      width: 1280, // Default desktop width
      height: 720, // Default desktop height
      breakpoints: {
        xs: false,
        sm: false,
        md: false,
        lg: true, // Default to large screen
        xl: false,
        '2xl': false,
      },
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isSmallScreen: false,
      isLargeScreen: true,
      
      // Utility functions with safe defaults
      isBreakpoint: (breakpoint: TailwindBreakpoint) => breakpoint === 'lg',
      isMinBreakpoint: (breakpoint: TailwindBreakpoint) => {
        const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = order.indexOf('lg');
        const targetIndex = order.indexOf(breakpoint);
        return currentIndex >= targetIndex;
      },
      isMaxBreakpoint: (breakpoint: TailwindBreakpoint) => {
        const order = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
        const currentIndex = order.indexOf('lg');
        const targetIndex = order.indexOf(breakpoint);
        return currentIndex <= targetIndex;
      },
    };
  }
  
  // Utility functions for breakpoint checking
  const utilities = {
    /**
     * Check if a specific breakpoint is currently active.
     * 
     * @param breakpoint - Breakpoint to check
     * @returns True if the specified breakpoint is active
     */
    isBreakpoint: (breakpoint: TailwindBreakpoint): boolean => {
      return currentBreakpoint.activeBreakpoint === breakpoint;
    },
    
    /**
     * Check if current screen is at least the specified breakpoint.
     * Useful for "mobile-first" responsive design patterns.
     * 
     * @param breakpoint - Minimum breakpoint to check
     * @returns True if current screen is at or above the specified breakpoint
     */
    isMinBreakpoint: (breakpoint: TailwindBreakpoint): boolean => {
      const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint.activeBreakpoint);
      const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
      return currentIndex >= targetIndex;
    },
    
    /**
     * Check if current screen is at most the specified breakpoint.
     * Useful for "desktop-first" responsive design patterns.
     * 
     * @param breakpoint - Maximum breakpoint to check
     * @returns True if current screen is at or below the specified breakpoint
     */
    isMaxBreakpoint: (breakpoint: TailwindBreakpoint): boolean => {
      const currentIndex = BREAKPOINT_ORDER.indexOf(currentBreakpoint.activeBreakpoint);
      const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
      return currentIndex <= targetIndex;
    },
  };
  
  // Return complete breakpoint state with utility functions
  return {
    ...currentBreakpoint,
    ...utilities,
  };
}

/**
 * Lightweight hook for accessing only the current active breakpoint.
 * Optimized for components that only need the breakpoint name.
 * 
 * @returns Current active breakpoint name
 */
export function useActiveBreakpoint(): TailwindBreakpoint {
  const { activeBreakpoint } = useBreakpoint();
  return activeBreakpoint;
}

/**
 * Hook for accessing only screen size convenience flags.
 * Optimized for components that need simple mobile/desktop detection.
 * 
 * @returns Object with boolean flags for screen size categories
 */
export function useScreenSize() {
  const { isMobile, isTablet, isDesktop, isSmallScreen, isLargeScreen } = useBreakpoint();
  return { isMobile, isTablet, isDesktop, isSmallScreen, isLargeScreen };
}

/**
 * Hook that returns true when the screen is considered "small" (mobile/tablet).
 * Replaces Angular DfBreakpointService.isSmallScreen observable pattern.
 * 
 * @returns True if screen is small (xs or sm breakpoint)
 */
export function useIsSmallScreen(): boolean {
  const { isSmallScreen } = useBreakpoint();
  return isSmallScreen;
}

// Export breakpoint configuration for testing and external usage
export { BREAKPOINT_CONFIG, BREAKPOINT_ORDER };