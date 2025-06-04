/**
 * Layout-related types for responsive design and component state management.
 * Provides TypeScript definitions for breakpoint detection, screen size state,
 * and responsive layout patterns used throughout the application.
 */

/**
 * Standardized breakpoint names matching Tailwind CSS breakpoint system.
 * These correspond to the default Tailwind CSS responsive prefixes.
 */
export type TailwindBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Screen size categories for simplified responsive logic.
 * Used for determining layout behavior and component variants.
 */
export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Breakpoint configuration object defining media query strings.
 * Maps Tailwind breakpoint names to their corresponding CSS media queries.
 */
export interface BreakpointConfig {
  xs: string;  // < 640px
  sm: string;  // >= 640px
  md: string;  // >= 768px
  lg: string;  // >= 1024px
  xl: string;  // >= 1280px
  '2xl': string; // >= 1536px
}

/**
 * Current breakpoint state containing active breakpoints and screen information.
 * Provides comprehensive responsive state for components and layouts.
 */
export interface BreakpointState {
  /** Current active breakpoint (highest matching breakpoint) */
  activeBreakpoint: TailwindBreakpoint;
  
  /** Current screen size category */
  screenSize: ScreenSize;
  
  /** Current viewport width in pixels */
  width: number;
  
  /** Current viewport height in pixels */
  height: number;
  
  /** Boolean flags for each breakpoint (true if currently active) */
  breakpoints: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    '2xl': boolean;
  };
  
  /** Convenience flags for common responsive patterns */
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallScreen: boolean; // xs or sm
  isLargeScreen: boolean; // lg, xl, or 2xl
}

/**
 * Hook return type for useBreakpoint custom hook.
 * Provides current breakpoint state and utility functions.
 */
export interface UseBreakpointReturn extends BreakpointState {
  /** Check if a specific breakpoint is currently active */
  isBreakpoint: (breakpoint: TailwindBreakpoint) => boolean;
  
  /** Check if current screen is at least the specified breakpoint */
  isMinBreakpoint: (breakpoint: TailwindBreakpoint) => boolean;
  
  /** Check if current screen is at most the specified breakpoint */
  isMaxBreakpoint: (breakpoint: TailwindBreakpoint) => boolean;
}

/**
 * Layout container variants for responsive design.
 * Used by layout components to adapt to different screen sizes.
 */
export type LayoutVariant = 
  | 'full-width'      // Uses full viewport width
  | 'container'       // Uses Tailwind container with responsive max-widths
  | 'constrained'     // Fixed maximum width with centered content
  | 'sidebar'         // Layout with collapsible sidebar
  | 'split';          // Two-column layout

/**
 * Sidebar state for responsive navigation layouts.
 * Manages sidebar visibility and behavior across different screen sizes.
 */
export interface SidebarState {
  /** Whether sidebar is currently open/visible */
  isOpen: boolean;
  
  /** Whether sidebar is collapsed (icons only) */
  isCollapsed: boolean;
  
  /** Whether sidebar is in overlay mode (mobile) */
  isOverlay: boolean;
  
  /** Sidebar width in pixels when expanded */
  width: number;
  
  /** Sidebar width in pixels when collapsed */
  collapsedWidth: number;
}

/**
 * Grid system configuration for responsive layouts.
 * Provides responsive grid columns and spacing definitions.
 */
export interface GridConfig {
  /** Number of columns at different breakpoints */
  columns: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  
  /** Gap spacing between grid items */
  gap: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

/**
 * Responsive component props interface.
 * Common props for components that need responsive behavior.
 */
export interface ResponsiveProps {
  /** Hide component at specific breakpoints */
  hideAt?: TailwindBreakpoint[];
  
  /** Show component only at specific breakpoints */
  showAt?: TailwindBreakpoint[];
  
  /** Responsive size variants */
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  
  /** Responsive order/priority */
  order?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
}