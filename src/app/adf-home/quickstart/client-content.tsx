/**
 * @fileoverview Client-Side Quickstart Content Component
 * 
 * This component handles client-side functionality for the quickstart page,
 * including responsive behavior and breakpoint detection. Separated from the
 * main page component to enable server-side rendering for static content
 * while providing interactive features through client-side hydration.
 * 
 * Key Features:
 * - Responsive layout adjustments using useBreakpoint hook
 * - Client-side hydration without layout shift
 * - Breakpoint-aware grid layouts for platform examples
 * - Smooth transitions between responsive states
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useEffect, useState, type PropsWithChildren } from 'react';
import { useBreakpoint } from '@/hooks/use-breakpoint';

/**
 * Interface for client-side quickstart content props
 */
interface ClientOnlyQuickstartContentProps extends PropsWithChildren {
  className?: string;
}

/**
 * Client-Only Quickstart Content Component
 * 
 * Wraps quickstart content with client-side responsive behavior while preventing
 * hydration mismatches. Uses useBreakpoint hook to provide responsive layout
 * adjustments and ensures consistent rendering between server and client.
 * 
 * This component replaces the Angular DfBreakpointService injection pattern
 * with React hooks and provides enhanced responsive capabilities.
 * 
 * Features:
 * - Prevents hydration mismatches with mounted state tracking
 * - Responsive grid layouts based on screen size
 * - Smooth transitions between breakpoint changes
 * - Accessibility-aware responsive behavior
 * - Performance-optimized with minimal re-renders
 * 
 * @param props - Component props including children and optional className
 * @returns JSX element with responsive quickstart content
 */
export function ClientOnlyQuickstartContent({ 
  children, 
  className = '' 
}: ClientOnlyQuickstartContentProps) {
  // Track mounted state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  
  // Get responsive breakpoint information
  const { 
    current: currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints,
    width,
    height,
    isPortrait,
    isAbove,
    isBelow,
    isMounted: breakpointMounted
  } = useBreakpoint();

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until both component and breakpoint detection are mounted
  // This prevents hydration mismatches and layout shifts
  if (!isMounted || !breakpointMounted) {
    // Return children without responsive behavior during SSR/hydration
    return (
      <div className={className} data-hydrating="true">
        {children}
      </div>
    );
  }

  // Determine responsive classes based on current breakpoint
  const responsiveClasses = {
    // Container classes based on breakpoint
    container: [
      'transition-all duration-300 ease-in-out',
      isMobile && 'px-2',
      isTablet && 'px-4',
      isDesktop && 'px-6',
      className
    ].filter(Boolean).join(' '),
    
    // Grid classes for platform examples
    nativeGrid: [
      'grid gap-4 list-none p-0 transition-all duration-300',
      'grid-cols-1', // Base: single column
      isAbove('sm') && 'sm:grid-cols-2', // Small screens: 2 columns
      isAbove('lg') && 'lg:grid-cols-4', // Large screens: 4 columns
      // Special handling for very small screens (x-small breakpoint equivalent)
      isBelow('sm') && isPortrait && 'justify-items-center'
    ].filter(Boolean).join(' '),
    
    javascriptGrid: [
      'grid gap-4 list-none p-0 transition-all duration-300',
      'grid-cols-1', // Base: single column
      isAbove('sm') && 'sm:grid-cols-2', // Small screens: 2 columns  
      isAbove('lg') && 'lg:grid-cols-3', // Large screens: 3 columns
      isAbove('xl') && 'xl:grid-cols-6', // Extra large: 6 columns
      // Special handling for very small screens
      isBelow('sm') && isPortrait && 'justify-items-center'
    ].filter(Boolean).join(' '),
    
    // Card classes for responsive sizing
    cardWrapper: [
      'flex transition-transform duration-200',
      isMobile && 'w-full max-w-xs mx-auto',
      !isMobile && 'w-full'
    ].filter(Boolean).join(' ')
  };

  // Debug information for development (removed in production)
  const debugInfo = process.env.NODE_ENV === 'development' ? {
    breakpoint: currentBreakpoint,
    width,
    height,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
    activeBreakpoints: Object.entries(breakpoints)
      .filter(([_, active]) => active)
      .map(([name]) => name)
  } : null;

  return (
    <div 
      className={responsiveClasses.container}
      data-testid="client-quickstart-content"
      data-breakpoint={currentBreakpoint}
      data-mobile={isMobile}
      {...(debugInfo && process.env.NODE_ENV === 'development' && {
        'data-debug': JSON.stringify(debugInfo)
      })}
    >
      {/* Responsive Content Wrapper */}
      <div className="space-y-8">
        {/* Apply responsive styles to platform sections */}
        <div 
          className="platforms-section space-y-8"
          style={{
            '--native-grid-classes': responsiveClasses.nativeGrid,
            '--javascript-grid-classes': responsiveClasses.javascriptGrid,
            '--card-wrapper-classes': responsiveClasses.cardWrapper
          } as React.CSSProperties}
        >
          {children}
        </div>
      </div>

      {/* Accessibility announcements for screen readers */}
      {isMounted && (
        <div
          aria-live="polite"
          aria-atomic="false"
          className="sr-only"
          id="responsive-announcements"
        >
          {/* Announce significant layout changes for screen readers */}
          <span>
            Layout optimized for {isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'} display
          </span>
        </div>
      )}

      {/* Development breakpoint indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono">
          <div>Breakpoint: {currentBreakpoint}</div>
          <div>Size: {width} × {height}</div>
          <div>Type: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Higher-Order Component for adding responsive behavior to quickstart sections
 * Provides a convenient way to wrap content with responsive classes
 * 
 * @param Component - Component to wrap with responsive behavior
 * @returns Enhanced component with responsive capabilities
 */
export function withResponsiveLayout<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ResponsiveComponent(props: P) {
    return (
      <ClientOnlyQuickstartContent>
        <Component {...props} />
      </ClientOnlyQuickstartContent>
    );
  };
}

/**
 * Custom hook for quickstart-specific responsive behavior
 * Provides commonly used responsive states and utilities for quickstart components
 * 
 * @returns Object containing responsive state and utility functions
 */
export function useQuickstartResponsive() {
  const breakpoint = useBreakpoint();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return {
    ...breakpoint,
    isMounted,
    // Quickstart-specific responsive utilities
    shouldUseCompactLayout: breakpoint.isBelow('md'),
    shouldUseCenteredLayout: breakpoint.isBelow('sm') && breakpoint.isPortrait,
    gridColumns: {
      native: breakpoint.isAbove('lg') ? 4 : breakpoint.isAbove('sm') ? 2 : 1,
      javascript: breakpoint.isAbove('xl') ? 6 : breakpoint.isAbove('lg') ? 3 : breakpoint.isAbove('sm') ? 2 : 1
    },
    // Layout classes for common patterns
    getLayoutClasses: (type: 'native' | 'javascript') => {
      const baseClasses = 'grid gap-4 list-none p-0 transition-all duration-300';
      
      if (type === 'native') {
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`;
      } else {
        return `${baseClasses} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`;
      }
    }
  };
}

/**
 * Export default for convenience
 */
export default ClientOnlyQuickstartContent;