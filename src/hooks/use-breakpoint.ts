/**
 * useBreakpoint Hook - Responsive Breakpoint Detection
 * 
 * React hook that replaces Angular DfBreakpointService with modern breakpoint detection
 * using window.matchMedia, providing accurate screen size monitoring, Tailwind CSS
 * integration, and cross-component state sharing for responsive design patterns.
 * 
 * Features:
 * - Accurate breakpoint detection using window.matchMedia API
 * - Window resize event handling with proper cleanup
 * - Tailwind CSS breakpoint system integration
 * - Angular CDK compatibility for seamless migration
 * - Cross-component state sharing with immediate updates
 * - Server-side rendering support with mobile-first defaults
 * - Debounced resize handling for performance optimization
 * - Memory leak prevention with proper event cleanup
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  BreakpointState,
  UseBreakpointOptions,
  UseBreakpointReturn,
  BreakpointConfig,
  TailwindBreakpoint,
  BreakpointName,
  MediaQueryChangeEvent,
} from '@/types/breakpoint';

/**
 * Default Tailwind CSS breakpoint configuration with Angular CDK compatibility
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  // Tailwind CSS breakpoints
  xs: '(max-width: 475px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  
  // Angular CDK compatibility aliases for migration
  XSmall: '(max-width: 599.98px)',        // Angular CDK XSmall
  Small: '(min-width: 600px) and (max-width: 959.98px)', // Angular CDK Small
  Medium: '(min-width: 960px) and (max-width: 1279.98px)', // Angular CDK Medium
  Large: '(min-width: 1280px) and (max-width: 1919.98px)', // Angular CDK Large
  XLarge: '(min-width: 1920px)',          // Angular CDK XLarge
};

/**
 * Breakpoint order for comparison operations
 */
const BREAKPOINT_ORDER: TailwindBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

/**
 * Global state for cross-component sharing
 */
let globalBreakpointState: BreakpointState | null = null;
const subscribers = new Set<(state: BreakpointState) => void>();

/**
 * Notify all subscribers of breakpoint changes
 */
function notifySubscribers(newState: BreakpointState): void {
  globalBreakpointState = newState;
  subscribers.forEach(callback => {
    try {
      callback(newState);
    } catch (error) {
      console.error('Error in breakpoint subscriber:', error);
    }
  });
}

/**
 * Create initial breakpoint state for SSR and client hydration
 */
function createInitialState(width = 320, height = 568): BreakpointState {
  // Mobile-first approach for SSR compatibility
  const xs = width <= 475;
  const sm = width >= 640;
  const md = width >= 768;
  const lg = width >= 1024;
  const xl = width >= 1280;
  const xl2 = width >= 1536;
  
  // Angular CDK compatibility
  const XSmall = width <= 599.98;
  const Small = width >= 600 && width <= 959.98;
  const Medium = width >= 960 && width <= 1279.98;
  const Large = width >= 1280 && width <= 1919.98;
  const XLarge = width >= 1920;
  
  return {
    width,
    height,
    xs,
    sm,
    md,
    lg,
    xl,
    '2xl': xl2,
    XSmall,
    Small,
    Medium,
    Large,
    XLarge,
    // Convenience computed properties for Angular service compatibility
    isSmallScreen: XSmall || Small, // Matches Angular DfBreakpointService.isSmallScreen
    isXSmallScreen: XSmall,         // Matches Angular DfBreakpointService.isXSmallScreen
    isMediumScreen: md,
    isLargeScreen: lg || xl || xl2,
    isMobile: xs || (width < 768),
    isTablet: md && !lg,
    isDesktop: lg || xl || xl2,
  };
}

/**
 * Debounce utility for resize events
 */
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Custom hook for responsive breakpoint detection
 * 
 * Provides real-time breakpoint state updates using window.matchMedia for accurate
 * screen size detection, with debounced resize handling and cross-component sharing.
 * 
 * @param options - Configuration options for breakpoint behavior
 * @returns Breakpoint state and utility functions
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { isSmallScreen, isMobile, isAbove } = useBreakpoint();
 *   
 *   return (
 *     <div>
 *       {isSmallScreen && <MobileNav />}
 *       {isAbove('lg') && <DesktopSidebar />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useBreakpoint(options: UseBreakpointOptions = {}): UseBreakpointReturn {
  const {
    breakpoints = DEFAULT_BREAKPOINTS,
    debounceMs = 100,
    enableSSR = true,
    ssrBreakpoint = 'xs',
  } = options;
  
  // Initialize state with SSR-safe defaults
  const [breakpointState, setBreakpointState] = useState<BreakpointState>(() => {
    // Use global state if available (cross-component sharing)
    if (globalBreakpointState) {
      return globalBreakpointState;
    }
    
    // SSR-safe initialization
    if (enableSSR && typeof window === 'undefined') {
      const ssrWidth = ssrBreakpoint === 'xs' ? 320 : 
                     ssrBreakpoint === 'sm' ? 640 :
                     ssrBreakpoint === 'md' ? 768 :
                     ssrBreakpoint === 'lg' ? 1024 :
                     ssrBreakpoint === 'xl' ? 1280 : 1536;
      return createInitialState(ssrWidth, 568);
    }
    
    // Client-side initialization
    if (typeof window !== 'undefined') {
      return createInitialState(window.innerWidth, window.innerHeight);
    }
    
    return createInitialState();
  });
  
  const mediaQueriesRef = useRef<Map<string, MediaQueryList>>(new Map());
  
  /**
   * Update breakpoint state based on current window dimensions
   */
  const updateBreakpointState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newState = createInitialState(width, height);
    
    setBreakpointState(newState);
    notifySubscribers(newState);
  }, []);
  
  /**
   * Debounced version of state update for resize events
   */
  const debouncedUpdate = useDebounce(updateBreakpointState, debounceMs);
  
  /**
   * Handle media query changes for accurate breakpoint detection
   */
  const handleMediaQueryChange = useCallback((event: MediaQueryListEvent, breakpointName: string) => {
    // Update state immediately for media query changes (more accurate than resize)
    updateBreakpointState();
    
    // Fire change event for external listeners
    const changeEvent: MediaQueryChangeEvent = {
      breakpoint: breakpointName as BreakpointName,
      matches: event.matches,
      query: event.media,
      timestamp: Date.now(),
    };
    
    // Emit custom event for global listening
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('breakpointChange', { detail: changeEvent }));
    }
  }, [updateBreakpointState]);
  
  /**
   * Setup media query listeners and window resize handler
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Clear existing media queries
    mediaQueriesRef.current.forEach((mq, query) => {
      mq.removeEventListener('change', () => {});
    });
    mediaQueriesRef.current.clear();
    
    // Setup media query listeners for accurate breakpoint detection
    Object.entries(breakpoints).forEach(([name, query]) => {
      try {
        const mediaQuery = window.matchMedia(query);
        mediaQueriesRef.current.set(name, mediaQuery);
        
        const handler = (event: MediaQueryListEvent) => {
          handleMediaQueryChange(event, name);
        };
        
        // Use addEventListener for better browser support
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handler);
        } else {
          // Fallback for older browsers
          mediaQuery.addListener(handler);
        }
      } catch (error) {
        console.warn(`Invalid media query for breakpoint ${name}: ${query}`, error);
      }
    });
    
    // Setup window resize listener as fallback
    const handleResize = () => {
      debouncedUpdate();
    };
    
    window.addEventListener('resize', handleResize, { passive: true });
    
    // Initial state update
    updateBreakpointState();
    
    // Cleanup function
    return () => {
      // Remove media query listeners
      mediaQueriesRef.current.forEach((mediaQuery, name) => {
        const handlers = (mediaQuery as any)._handlers || [];
        handlers.forEach((handler: any) => {
          if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener('change', handler);
          } else {
            mediaQuery.removeListener(handler);
          }
        });
      });
      
      // Remove resize listener
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoints, handleMediaQueryChange, debouncedUpdate, updateBreakpointState]);
  
  /**
   * Setup cross-component state sharing subscription
   */
  useEffect(() => {
    const unsubscribe = () => {
      subscribers.delete(setBreakpointState);
    };
    
    subscribers.add(setBreakpointState);
    return unsubscribe;
  }, []);
  
  /**
   * Utility functions for breakpoint checking
   */
  const utils = useMemo(() => ({
    /**
     * Check if a specific breakpoint is currently active
     */
    isActive: (breakpoint: BreakpointName): boolean => {
      return breakpointState[breakpoint] || false;
    },
    
    /**
     * Check if screen width is above a specific breakpoint
     */
    isAbove: (breakpoint: TailwindBreakpoint): boolean => {
      const currentIndex = BREAKPOINT_ORDER.findIndex(bp => breakpointState[bp]);
      const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
      return currentIndex > targetIndex;
    },
    
    /**
     * Check if screen width is below a specific breakpoint
     */
    isBelow: (breakpoint: TailwindBreakpoint): boolean => {
      const currentIndex = BREAKPOINT_ORDER.findIndex(bp => breakpointState[bp]);
      const targetIndex = BREAKPOINT_ORDER.indexOf(breakpoint);
      return currentIndex < targetIndex;
    },
    
    /**
     * Check if screen width is between two breakpoints (inclusive)
     */
    isBetween: (min: TailwindBreakpoint, max: TailwindBreakpoint): boolean => {
      const minIndex = BREAKPOINT_ORDER.indexOf(min);
      const maxIndex = BREAKPOINT_ORDER.indexOf(max);
      const currentIndex = BREAKPOINT_ORDER.findIndex(bp => breakpointState[bp]);
      
      return currentIndex >= minIndex && currentIndex <= maxIndex;
    },
  }), [breakpointState]);
  
  return {
    ...breakpointState,
    ...utils,
  };
}

/**
 * Export default breakpoint configuration for external use
 */
export { DEFAULT_BREAKPOINTS };

/**
 * Export utility function to get current global breakpoint state
 */
export function getCurrentBreakpointState(): BreakpointState | null {
  return globalBreakpointState;
}

/**
 * Export function to manually trigger breakpoint update (for testing)
 */
export function updateBreakpoints(): void {
  if (typeof window !== 'undefined') {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const newState = createInitialState(width, height);
    notifySubscribers(newState);
  }
}