/**
 * Breakpoint Types for Responsive Design System
 * 
 * Provides TypeScript interfaces and types for the React breakpoint detection hook,
 * supporting both Tailwind CSS breakpoints and Angular CDK compatibility for migration.
 */

/**
 * Tailwind CSS breakpoint names aligned with the design system
 */
export type TailwindBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Angular CDK compatible breakpoint names for migration compatibility
 */
export type CDKBreakpoint = 'XSmall' | 'Small' | 'Medium' | 'Large' | 'XLarge';

/**
 * Unified breakpoint names supporting both systems
 */
export type BreakpointName = TailwindBreakpoint | CDKBreakpoint;

/**
 * Breakpoint configuration mapping breakpoint names to CSS media query strings
 */
export interface BreakpointConfig {
  /** Extra small devices (phones, up to 475px) */
  xs: string;
  /** Small devices (large phones, 640px and up) */
  sm: string;
  /** Medium devices (tablets, 768px and up) */
  md: string;
  /** Large devices (desktops, 1024px and up) */
  lg: string;
  /** Extra large devices (large desktops, 1280px and up) */
  xl: string;
  /** 2X large devices (larger desktops, 1536px and up) */
  '2xl': string;
  
  // Angular CDK compatibility aliases
  /** Angular CDK XSmall - equivalent to xs breakpoint */
  XSmall: string;
  /** Angular CDK Small - equivalent to sm breakpoint */
  Small: string;
  /** Angular CDK Medium - equivalent to md breakpoint */
  Medium: string;
  /** Angular CDK Large - equivalent to lg breakpoint */
  Large: string;
  /** Angular CDK XLarge - equivalent to xl breakpoint */
  XLarge: string;
}

/**
 * Current breakpoint state tracking which breakpoints are currently active
 */
export interface BreakpointState {
  /** Current screen width in pixels */
  width: number;
  /** Current screen height in pixels */
  height: number;
  /** Whether xs breakpoint is active (up to 475px) */
  xs: boolean;
  /** Whether sm breakpoint is active (640px and up) */
  sm: boolean;
  /** Whether md breakpoint is active (768px and up) */
  md: boolean;
  /** Whether lg breakpoint is active (1024px and up) */
  lg: boolean;
  /** Whether xl breakpoint is active (1280px and up) */
  xl: boolean;
  /** Whether 2xl breakpoint is active (1536px and up) */
  '2xl': boolean;
  
  // Angular CDK compatibility properties
  /** Angular CDK XSmall compatibility - matches xs */
  XSmall: boolean;
  /** Angular CDK Small compatibility - matches sm */
  Small: boolean;
  /** Angular CDK Medium compatibility - matches md */
  Medium: boolean;
  /** Angular CDK Large compatibility - matches lg */
  Large: boolean;
  /** Angular CDK XLarge compatibility - matches xl */
  XLarge: boolean;
  
  // Convenience computed properties
  /** True if screen is considered small (xs or sm breakpoints active) */
  isSmallScreen: boolean;
  /** True if screen is extra small (xs breakpoint active) */
  isXSmallScreen: boolean;
  /** True if screen is medium or larger (md, lg, xl, 2xl breakpoints active) */
  isMediumScreen: boolean;
  /** True if screen is large or larger (lg, xl, 2xl breakpoints active) */
  isLargeScreen: boolean;
  /** True if screen is in mobile range (xs or sm) */
  isMobile: boolean;
  /** True if screen is in tablet range (md) */
  isTablet: boolean;
  /** True if screen is in desktop range (lg and above) */
  isDesktop: boolean;
}

/**
 * Options for configuring the breakpoint hook behavior
 */
export interface UseBreakpointOptions {
  /** Custom breakpoint configuration (optional, defaults to Tailwind CSS breakpoints) */
  breakpoints?: Partial<BreakpointConfig>;
  /** Debounce delay in milliseconds for window resize events (default: 100) */
  debounceMs?: number;
  /** Whether to enable server-side rendering support (default: true) */
  enableSSR?: boolean;
  /** Initial state for server-side rendering (default: mobile-first) */
  ssrBreakpoint?: TailwindBreakpoint;
}

/**
 * Return type for the useBreakpoint hook
 */
export interface UseBreakpointReturn extends BreakpointState {
  /** Function to check if a specific breakpoint is active */
  isActive: (breakpoint: BreakpointName) => boolean;
  /** Function to check if screen width is above a specific breakpoint */
  isAbove: (breakpoint: TailwindBreakpoint) => boolean;
  /** Function to check if screen width is below a specific breakpoint */
  isBelow: (breakpoint: TailwindBreakpoint) => boolean;
  /** Function to check if screen width is between two breakpoints */
  isBetween: (min: TailwindBreakpoint, max: TailwindBreakpoint) => boolean;
}

/**
 * Media query change event data
 */
export interface MediaQueryChangeEvent {
  /** The breakpoint that changed */
  breakpoint: BreakpointName;
  /** Whether the breakpoint is now active */
  matches: boolean;
  /** The media query string that triggered the change */
  query: string;
  /** Timestamp when the change occurred */
  timestamp: number;
}

/**
 * Hook configuration with advanced options
 */
export interface BreakpointHookConfig extends UseBreakpointOptions {
  /** Whether to persist breakpoint state across navigation (default: false) */
  persist?: boolean;
  /** Storage key for persisting state (default: 'df-breakpoint-state') */
  storageKey?: string;
  /** Callback fired when any breakpoint changes */
  onChange?: (event: MediaQueryChangeEvent) => void;
  /** Whether to use reduced motion preferences (default: true) */
  respectReducedMotion?: boolean;
}