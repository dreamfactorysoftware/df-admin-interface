/**
 * DreamFactory Admin Interface - Scheduler Layout Component
 * 
 * Scheduler-specific layout component that provides the structural foundation 
 * for all scheduler-related pages within the Next.js app router. This layout 
 * establishes React Context providers for theme management, authentication state, 
 * and scheduler-specific state management using Zustand.
 * 
 * This component replaces Angular's module-based dependency injection with React's 
 * composition patterns while ensuring consistent styling, navigation, and error 
 * boundary handling across all scheduler workflows.
 * 
 * @implements WCAG 2.1 AA accessibility compliance
 * @implements React/Next.js Integration Requirements per Section 4.3.1
 * @implements Zustand state management per Section 5.2
 */

'use client';

import React, { Suspense, ErrorInfo, Component, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

// Types for scheduler state management
interface SchedulerJob {
  id: string;
  name: string;
  type: 'event' | 'recurring' | 'oneshot';
  status: 'active' | 'inactive' | 'running' | 'failed';
  schedule: string;
  lastRun?: Date;
  nextRun?: Date;
  service?: string;
  endpoint?: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface SchedulerState {
  jobs: SchedulerJob[];
  selectedJob: SchedulerJob | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    status: string[];
    type: string[];
    service: string[];
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  sortBy: {
    field: keyof SchedulerJob;
    direction: 'asc' | 'desc';
  };
}

interface SchedulerActions {
  setJobs: (jobs: SchedulerJob[]) => void;
  addJob: (job: SchedulerJob) => void;
  updateJob: (id: string, job: Partial<SchedulerJob>) => void;
  deleteJob: (id: string) => void;
  setSelectedJob: (job: SchedulerJob | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SchedulerState['filters']>) => void;
  setPagination: (pagination: Partial<SchedulerState['pagination']>) => void;
  setSortBy: (sortBy: SchedulerState['sortBy']) => void;
  resetFilters: () => void;
  clearError: () => void;
}

// Mock implementations for dependencies that will be created separately
const mockUseAuth = () => ({
  user: null,
  isAuthenticated: false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  loading: false,
  error: null,
});

const mockUseTheme = () => ({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

// Simple Zustand-like store implementation for scheduler state
class SchedulerStore {
  private state: SchedulerState & SchedulerActions;
  private listeners: Set<() => void> = new Set();

  constructor() {
    const initialState: SchedulerState = {
      jobs: [],
      selectedJob: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      filters: {
        status: [],
        type: [],
        service: [],
      },
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
      },
      sortBy: {
        field: 'createdAt',
        direction: 'desc',
      },
    };

    const actions: SchedulerActions = {
      setJobs: (jobs) => {
        this.state.jobs = jobs;
        this.state.pagination.total = jobs.length;
        this.notify();
      },
      addJob: (job) => {
        this.state.jobs.push(job);
        this.state.pagination.total = this.state.jobs.length;
        this.notify();
      },
      updateJob: (id, jobUpdate) => {
        const index = this.state.jobs.findIndex(job => job.id === id);
        if (index !== -1) {
          this.state.jobs[index] = { ...this.state.jobs[index], ...jobUpdate };
          if (this.state.selectedJob?.id === id) {
            this.state.selectedJob = this.state.jobs[index];
          }
          this.notify();
        }
      },
      deleteJob: (id) => {
        this.state.jobs = this.state.jobs.filter(job => job.id !== id);
        if (this.state.selectedJob?.id === id) {
          this.state.selectedJob = null;
        }
        this.state.pagination.total = this.state.jobs.length;
        this.notify();
      },
      setSelectedJob: (job) => {
        this.state.selectedJob = job;
        this.notify();
      },
      setLoading: (loading) => {
        this.state.isLoading = loading;
        this.notify();
      },
      setError: (error) => {
        this.state.error = error;
        this.notify();
      },
      setSearchQuery: (query) => {
        this.state.searchQuery = query;
        this.state.pagination.page = 1; // Reset to first page on search
        this.notify();
      },
      setFilters: (filters) => {
        this.state.filters = { ...this.state.filters, ...filters };
        this.state.pagination.page = 1; // Reset to first page on filter change
        this.notify();
      },
      setPagination: (pagination) => {
        this.state.pagination = { ...this.state.pagination, ...pagination };
        this.notify();
      },
      setSortBy: (sortBy) => {
        this.state.sortBy = sortBy;
        this.notify();
      },
      resetFilters: () => {
        this.state.filters = {
          status: [],
          type: [],
          service: [],
        };
        this.state.searchQuery = '';
        this.state.pagination.page = 1;
        this.notify();
      },
      clearError: () => {
        this.state.error = null;
        this.notify();
      },
    };

    this.state = { ...initialState, ...actions };

    // Persist state to localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('scheduler-state');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.state = { ...this.state, ...parsed, ...actions };
        } catch (error) {
          console.warn('Failed to parse stored scheduler state:', error);
        }
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  private notify() {
    // Persist state changes
    if (typeof window !== 'undefined') {
      const { 
        jobs, selectedJob, searchQuery, filters, pagination, sortBy, ...rest 
      } = this.state;
      const persistedState = {
        jobs, selectedJob, searchQuery, filters, pagination, sortBy
      };
      localStorage.setItem('scheduler-state', JSON.stringify(persistedState));
    }

    this.listeners.forEach(listener => listener());
  }
}

// Singleton scheduler store instance
const schedulerStore = new SchedulerStore();

// Context for scheduler state
const SchedulerContext = React.createContext<SchedulerState & SchedulerActions | null>(null);

// Hook to use scheduler store
export const useScheduler = () => {
  const context = React.useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within a SchedulerLayout');
  }
  return context;
};

// Provider component for scheduler state
const SchedulerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState(schedulerStore.getState());

  React.useEffect(() => {
    const unsubscribe = schedulerStore.subscribe(() => {
      setState(schedulerStore.getState());
    });
    return unsubscribe;
  }, []);

  return (
    <SchedulerContext.Provider value={state}>
      {children}
    </SchedulerContext.Provider>
  );
};

// Error boundary props and state interfaces
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
}

// Enhanced Error Boundary component for scheduler operations
class SchedulerErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    console.error('Scheduler Error Boundary caught an error:', error, errorInfo);
    
    // Clear any scheduler errors from state
    const store = schedulerStore.getState();
    if (store.error) {
      store.clearError();
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error!,
          this.state.errorInfo!,
          this.handleReset
        );
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-lg border shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-destructive"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Scheduler Error
                </h2>
                <p className="text-sm text-muted-foreground">
                  Something went wrong with the scheduler interface
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-3">
                <h3 className="text-sm font-medium text-foreground mb-2">
                  Error Details:
                </h3>
                <code className="text-xs text-muted-foreground break-all">
                  {this.state.error?.message || 'Unknown error occurred'}
                </code>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-secondary text-secondary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 transition-colors"
                >
                  Reload Page
                </button>
              </div>

              <button
                onClick={() => window.history.back()}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component for scheduler operations
const SchedulerLoading: React.FC = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="loading-spinner w-8 h-8" />
      <div className="text-sm text-muted-foreground">
        Loading scheduler...
      </div>
    </div>
  </div>
);

// Layout props interface
interface SchedulerLayoutProps {
  children: ReactNode;
}

// Create a React Query client optimized for scheduler operations
const createSchedulerQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache scheduler data for 5 minutes to reduce API calls
        staleTime: 5 * 60 * 1000,
        // Keep in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 3 times with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for fresh data
        refetchOnWindowFocus: true,
        // Refetch on reconnect for reliability
        refetchOnReconnect: true,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
      },
    },
  });
};

/**
 * Scheduler Layout Component
 * 
 * Provides the foundational structure for all scheduler-related pages with:
 * - React Context providers for auth, theme, and scheduler state
 * - Zustand store integration for workflow state management
 * - Comprehensive error boundaries for graceful error handling
 * - Responsive Tailwind CSS layouts with WCAG 2.1 AA compliance
 * - React Query integration for server state management
 */
const SchedulerLayout: React.FC<SchedulerLayoutProps> = ({ children }) => {
  // Create query client with memoization to prevent recreating on re-renders
  const [queryClient] = React.useState(() => createSchedulerQueryClient());

  // Mock hooks - these will be replaced with actual implementations
  const auth = mockUseAuth();
  const theme = mockUseTheme();

  return (
    <div 
      className="scheduler-layout min-h-screen bg-background text-foreground theme-transition"
      data-theme={theme.theme}
    >
      {/* Skip link for keyboard navigation - WCAG 2.1 AA compliance */}
      <a 
        href="#scheduler-main-content"
        className="skip-link"
        tabIndex={1}
      >
        Skip to scheduler content
      </a>

      <SchedulerErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SchedulerProvider>
            {/* Layout container with responsive design */}
            <div className="flex flex-col min-h-screen">
              {/* Scheduler-specific header with breadcrumbs */}
              <header className="bg-card border-b border-border">
                <div className="px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                      <h1 className="text-lg font-semibold text-foreground">
                        Scheduler Management
                      </h1>
                      <nav aria-label="Scheduler breadcrumb">
                        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                          <li>
                            <a 
                              href="/adf-home" 
                              className="hover:text-foreground transition-colors focus-accessible"
                            >
                              Dashboard
                            </a>
                          </li>
                          <li aria-hidden="true">/</li>
                          <li className="text-foreground">Scheduler</li>
                        </ol>
                      </nav>
                    </div>

                    {/* Theme and user controls */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={theme.toggleTheme}
                        className="p-2 rounded-md hover:bg-muted transition-colors focus-accessible"
                        aria-label={`Switch to ${theme.theme === 'light' ? 'dark' : 'light'} theme`}
                      >
                        {theme.theme === 'light' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </button>

                      {auth.isAuthenticated && (
                        <div className="text-sm text-muted-foreground">
                          Welcome back!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* Main content area with scheduler-specific layout */}
              <main 
                id="scheduler-main-content"
                className="flex-1 bg-background"
                role="main"
                aria-label="Scheduler management interface"
              >
                <div className="h-full">
                  <Suspense fallback={<SchedulerLoading />}>
                    {children}
                  </Suspense>
                </div>
              </main>

              {/* Footer with scheduler-specific information */}
              <footer className="bg-card border-t border-border mt-auto">
                <div className="px-4 sm:px-6 lg:px-8 py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>DreamFactory Scheduler Management</div>
                    <div className="flex items-center gap-4">
                      <span>Status: Connected</span>
                      <span>Last sync: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </footer>
            </div>

            {/* Toast notifications for scheduler operations */}
            <Toaster 
              position="bottom-right"
              theme={theme.theme}
              richColors
              closeButton
              toastOptions={{
                duration: 5000,
                className: 'font-sans',
              }}
            />

            {/* React Query DevTools for development */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools 
                initialIsOpen={false}
                position="bottom-left"
              />
            )}
          </SchedulerProvider>
        </QueryClientProvider>
      </SchedulerErrorBoundary>
    </div>
  );
};

export default SchedulerLayout;