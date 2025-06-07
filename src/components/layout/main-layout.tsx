/**
 * Main Layout Component for DreamFactory Admin Interface
 * 
 * Root layout component that provides the main application shell structure with
 * sidebar navigation, header toolbar, and content area. Integrates theme provider,
 * authentication state, and responsive layout containers using Tailwind CSS.
 * 
 * Replaces Angular Material-based layout structure with React 19 server components
 * and Next.js app router patterns, providing enhanced performance and accessibility.
 * 
 * Features:
 * - React 19 functional component with enhanced concurrent features
 * - Responsive sidebar navigation with Zustand state management  
 * - Header toolbar with global search and user controls
 * - Theme provider integration with system preference detection
 * - Error boundary with graceful fallback handling
 * - Suspense wrappers for improved loading states
 * - WCAG 2.1 AA compliance with accessible navigation
 * - Performance optimized with React.memo and useCallback
 * - Server-side rendering compatibility
 * 
 * @fileoverview Main application layout shell component
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { 
  Suspense, 
  useEffect, 
  useCallback, 
  useMemo,
  useState,
  type ReactNode 
} from 'react';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'sonner';

// Layout components
import { Sidebar } from './sidebar';
import { Header } from './header';

// Custom hooks
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

// Store management
import { useAppStore, useSidebar, useBreakpointStore } from '@/stores/app-store';

// Utilities
import { cn } from '@/lib/utils';
import type { BreakpointState } from '@/types/layout';

// =============================================================================
// ERROR BOUNDARY FALLBACK COMPONENT
// =============================================================================

/**
 * Error fallback component for graceful error handling.
 * Provides user-friendly error display with recovery options.
 */
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  return (
    <div 
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <svg 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Application Error
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Something went wrong in the admin interface
            </p>
          </div>
        </div>
        
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Error Details
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 font-mono">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className={cn(
              "flex-1 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white",
              "hover:bg-primary-700 focus-visible:outline focus-visible:outline-2",
              "focus-visible:outline-offset-2 focus-visible:outline-primary-600",
              "transition-colors duration-200"
            )}
          >
            Try Again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(
              "flex-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white",
              "hover:bg-gray-700 focus-visible:outline focus-visible:outline-2",
              "focus-visible:outline-offset-2 focus-visible:outline-gray-600",
              "transition-colors duration-200"
            )}
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton component for layout initialization.
 * Provides visual feedback during component loading.
 */
const LayoutSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="flex space-x-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// RESPONSIVE BREAKPOINT HOOK
// =============================================================================

/**
 * Custom hook for managing responsive breakpoint detection.
 * Provides real-time breakpoint state for layout adaptation.
 */
const useResponsiveBreakpoints = () => {
  const { setBreakpoint } = useBreakpointStore();
  const [mounted, setMounted] = useState(false);

  const updateBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Determine active breakpoint
    let activeBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'xs';
    if (width >= 1536) activeBreakpoint = '2xl';
    else if (width >= 1280) activeBreakpoint = 'xl';
    else if (width >= 1024) activeBreakpoint = 'lg';
    else if (width >= 768) activeBreakpoint = 'md';
    else if (width >= 640) activeBreakpoint = 'sm';

    // Determine screen size category
    let screenSize: 'mobile' | 'tablet' | 'desktop' | 'wide' = 'mobile';
    if (width >= 1280) screenSize = 'wide';
    else if (width >= 1024) screenSize = 'desktop';
    else if (width >= 768) screenSize = 'tablet';

    const breakpointState: BreakpointState = {
      activeBreakpoint,
      screenSize,
      width,
      height,
      breakpoints: {
        xs: width >= 0,
        sm: width >= 640,
        md: width >= 768,
        lg: width >= 1024,
        xl: width >= 1280,
        '2xl': width >= 1536,
      },
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isSmallScreen: width < 768,
      isLargeScreen: width >= 1024,
    };

    setBreakpoint(breakpointState);
  }, [setBreakpoint]);

  useEffect(() => {
    setMounted(true);
    updateBreakpoint();

    // Add resize listener with debouncing
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBreakpoint, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateBreakpoint]);

  return mounted;
};

// =============================================================================
// LAYOUT THEME INTEGRATION
// =============================================================================

/**
 * Custom hook for managing layout-specific theme behavior.
 * Integrates with global theme system and applies layout-specific styles.
 */
const useLayoutTheme = () => {
  const { resolvedTheme, mounted } = useTheme();
  
  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme-specific meta tags
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        'content',
        resolvedTheme === 'dark' ? '#111827' : '#ffffff'
      );
    }
    
    // Apply theme to document for consistent styling
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme, mounted]);

  return { resolvedTheme, mounted };
};

// =============================================================================
// MAIN LAYOUT COMPONENT INTERFACE
// =============================================================================

/**
 * Main layout component props interface.
 */
interface MainLayoutProps {
  /** Child components to render in the main content area */
  children: ReactNode;
  
  /** Additional CSS class name for the layout container */
  className?: string;
  
  /** Whether to show the header toolbar */
  showHeader?: boolean;
  
  /** Whether to show the sidebar navigation */
  showSidebar?: boolean;
  
  /** Whether to enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  
  /** Custom error boundary configuration */
  errorBoundaryConfig?: {
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    fallback?: React.ComponentType<ErrorFallbackProps>;
  };
  
  /** Loading state override */
  isLoading?: boolean;
}

// =============================================================================
// MAIN LAYOUT COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * Main Layout Component
 * 
 * Root layout shell that provides the complete application structure including
 * responsive sidebar navigation, header toolbar, theme integration, and content area.
 * 
 * @param props Layout configuration and children
 * @returns Main application layout structure
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <MainLayout showHeader showSidebar enableKeyboardShortcuts>
 *       <DashboardPage />
 *     </MainLayout>
 *   );
 * }
 * ```
 */
export const MainLayout: React.FC<MainLayoutProps> = React.memo(({
  children,
  className,
  showHeader = true,
  showSidebar = true,
  enableKeyboardShortcuts = true,
  errorBoundaryConfig = {},
  isLoading = false,
}) => {
  // =============================================================================
  // HOOKS AND STATE MANAGEMENT
  // =============================================================================

  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { sidebar, setSidebar } = useSidebar();
  const { resolvedTheme, mounted: themeMounted } = useLayoutTheme();
  const breakpointMounted = useResponsiveBreakpoints();

  // Loading states
  const [layoutReady, setLayoutReady] = useState(false);

  // =============================================================================
  // RESPONSIVE SIDEBAR MANAGEMENT
  // =============================================================================

  /**
   * Update sidebar state based on screen size changes.
   * Handles responsive behavior for mobile and desktop layouts.
   */
  const updateSidebarForBreakpoint = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    setSidebar({
      isOverlay: isMobile,
      isOpen: isMobile ? false : true,
      isCollapsed: isTablet ? true : sidebar.isCollapsed,
    });
  }, [setSidebar, sidebar.isCollapsed]);

  useEffect(() => {
    updateSidebarForBreakpoint();
  }, [updateSidebarForBreakpoint]);

  // =============================================================================
  // LAYOUT INITIALIZATION
  // =============================================================================

  /**
   * Handle layout initialization once all dependencies are ready.
   */
  useEffect(() => {
    if (themeMounted && breakpointMounted) {
      // Small delay to ensure smooth initialization
      const timer = setTimeout(() => setLayoutReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [themeMounted, breakpointMounted]);

  // =============================================================================
  // KEYBOARD SHORTCUTS
  // =============================================================================

  /**
   * Global keyboard shortcut handling for layout navigation.
   */
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Sidebar toggle (Alt + S)
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        setSidebar({ isOpen: !sidebar.isOpen });
      }

      // Collapse toggle (Alt + C)
      if (event.altKey && event.key === 'c') {
        event.preventDefault();
        setSidebar({ isCollapsed: !sidebar.isCollapsed });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, sidebar.isOpen, sidebar.isCollapsed, setSidebar]);

  // =============================================================================
  // MEMOIZED VALUES
  // =============================================================================

  /**
   * Compute main content area styles based on sidebar state.
   */
  const mainContentStyles = useMemo(() => {
    const baseStyles = "flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out";
    
    if (!showSidebar) {
      return cn(baseStyles, "ml-0");
    }

    // No margin adjustment needed as sidebar is handled by flex layout
    return baseStyles;
  }, [showSidebar]);

  /**
   * Compute layout container classes with theme and responsive support.
   */
  const layoutClasses = useMemo(() => {
    return cn(
      "flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100",
      "transition-colors duration-200",
      // High contrast mode support
      "supports-[forced-colors:active]:bg-[Canvas] supports-[forced-colors:active]:text-[CanvasText]",
      className
    );
  }, [className]);

  // =============================================================================
  // ERROR BOUNDARY CONFIGURATION
  // =============================================================================

  const errorBoundaryProps = {
    FallbackComponent: errorBoundaryConfig.fallback || ErrorFallback,
    onError: errorBoundaryConfig.onError || ((error: Error, errorInfo: React.ErrorInfo) => {
      console.error('Layout Error:', error, errorInfo);
      // In production, this would send to error tracking service
    }),
    onReset: () => {
      // Reset any error state if needed
      window.location.reload();
    },
  };

  // =============================================================================
  // LOADING STATE HANDLING
  // =============================================================================

  if (isLoading || !layoutReady) {
    return <LayoutSkeleton />;
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <ErrorBoundary {...errorBoundaryProps}>
      <div className={layoutClasses}>
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className={cn(
            "sr-only focus:not-sr-only absolute top-4 left-4 z-50",
            "bg-primary-600 text-white px-4 py-2 rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          )}
        >
          Skip to main content
        </a>

        {/* Sidebar Navigation */}
        {showSidebar && isAuthenticated && (
          <Suspense fallback={
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 animate-pulse" />
          }>
            <Sidebar />
          </Suspense>
        )}

        {/* Main Content Area */}
        <div className={mainContentStyles}>
          {/* Header Toolbar */}
          {showHeader && (
            <Suspense fallback={
              <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-pulse" />
            }>
              <Header 
                showMobileToggle={showSidebar}
                enableKeyboardShortcuts={enableKeyboardShortcuts}
              />
            </Suspense>
          )}

          {/* Page Content */}
          <main 
            id="main-content"
            className={cn(
              "flex-1 overflow-auto",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              // Ensure proper scrolling behavior
              "overscroll-behavior-y-contain"
            )}
            role="main"
            aria-label="Main content area"
            tabIndex={-1}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </div>

        {/* Global Toast Notifications */}
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          toastOptions={{
            duration: 5000,
            className: cn(
              "border border-gray-200 dark:border-gray-700",
              "bg-white dark:bg-gray-800",
              "text-gray-900 dark:text-gray-100"
            ),
          }}
        />
      </div>
    </ErrorBoundary>
  );
});

MainLayout.displayName = 'MainLayout';

// =============================================================================
// LAYOUT VARIANTS
// =============================================================================

/**
 * Minimal layout variant without sidebar.
 * Useful for authentication pages and standalone views.
 */
export const MinimalLayout: React.FC<Omit<MainLayoutProps, 'showSidebar'>> = React.memo((props) => (
  <MainLayout {...props} showSidebar={false} />
));

MinimalLayout.displayName = 'MinimalLayout';

/**
 * Compact layout variant with collapsed sidebar by default.
 * Useful for data-intensive pages that need more horizontal space.
 */
export const CompactLayout: React.FC<MainLayoutProps> = React.memo((props) => {
  const { setSidebar } = useSidebar();
  
  useEffect(() => {
    setSidebar({ isCollapsed: true });
  }, [setSidebar]);

  return <MainLayout {...props} />;
});

CompactLayout.displayName = 'CompactLayout';

/**
 * Full-screen layout variant without header or sidebar.
 * Useful for immersive interfaces like data visualization or reports.
 */
export const FullScreenLayout: React.FC<Omit<MainLayoutProps, 'showHeader' | 'showSidebar'>> = React.memo((props) => (
  <MainLayout {...props} showHeader={false} showSidebar={false} />
));

FullScreenLayout.displayName = 'FullScreenLayout';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default MainLayout;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { MainLayoutProps };