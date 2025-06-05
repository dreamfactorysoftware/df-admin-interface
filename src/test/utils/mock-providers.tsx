/**
 * Mock Providers for React Component Testing
 * 
 * Provides comprehensive React context providers and wrapper components for testing
 * that replicate Angular TestBed module configuration. Delivers standardized testing
 * contexts including authentication, theme, internationalization, router, and form
 * providers for isolated component testing with realistic application state simulation.
 */

import React, { ReactNode, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { FormProvider as ReactHookFormProvider, useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { 
  UserSession, 
  SessionManager, 
  AUTH_STATES,
  RBAC_PERMISSIONS,
  type AuthState,
  type RBACPermission,
} from '../../lib/auth/session';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Mock authentication state configuration
 */
export interface MockAuthState {
  isAuthenticated: boolean;
  user?: Partial<UserSession> | null;
  state?: AuthState;
  permissions?: RBACPermission[];
  loading?: boolean;
  error?: string | null;
}

/**
 * Mock router configuration for Next.js testing
 */
export interface MockRouterConfig {
  pathname?: string;
  query?: Record<string, string | string[]>;
  asPath?: string;
  push?: jest.Mock;
  replace?: jest.Mock;
  back?: jest.Mock;
  prefetch?: jest.Mock;
  reload?: jest.Mock;
  isReady?: boolean;
}

/**
 * Mock theme configuration
 */
export interface MockThemeConfig {
  theme?: 'light' | 'dark' | 'system';
  systemTheme?: 'light' | 'dark';
  resolvedTheme?: 'light' | 'dark';
  setTheme?: jest.Mock;
  themes?: string[];
}

/**
 * Mock form configuration for React Hook Form testing
 */
export interface MockFormConfig<T = any> {
  defaultValues?: Partial<T>;
  schema?: z.ZodSchema<T>;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
  shouldFocusError?: boolean;
}

/**
 * Mock accessibility testing configuration
 */
export interface MockA11yConfig {
  announcements?: string[];
  screenReaderMode?: boolean;
  keyboardNavigation?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  announceChanges?: jest.Mock;
  focusManagement?: jest.Mock;
}

/**
 * Comprehensive test provider configuration
 */
export interface TestProvidersConfig {
  auth?: MockAuthState;
  router?: MockRouterConfig;
  theme?: MockThemeConfig;
  form?: MockFormConfig;
  accessibility?: MockA11yConfig;
  queryClient?: QueryClient;
  disableErrorBoundary?: boolean;
}

/**
 * Custom render options extending RTL RenderOptions
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providers?: TestProvidersConfig;
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

// =============================================================================
// MOCK CONTEXTS
// =============================================================================

/**
 * Mock Authentication Context
 */
interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  state: AuthState;
  error: string | null;
  login: jest.Mock;
  logout: jest.Mock;
  refresh: jest.Mock;
  hasPermission: jest.Mock;
  hasRole: jest.Mock;
  updateActivity: jest.Mock;
}

const MockAuthContext = React.createContext<AuthContextValue | null>(null);

/**
 * Mock Router Context (for Next.js router testing)
 */
interface RouterContextValue {
  pathname: string;
  query: Record<string, string | string[]>;
  asPath: string;
  push: jest.Mock;
  replace: jest.Mock;
  back: jest.Mock;
  prefetch: jest.Mock;
  reload: jest.Mock;
  isReady: boolean;
}

const MockRouterContext = React.createContext<RouterContextValue | null>(null);

/**
 * Mock Accessibility Context
 */
interface A11yContextValue {
  announcements: string[];
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  announce: jest.Mock;
  focus: jest.Mock;
  setScreenReaderMode: jest.Mock;
  setKeyboardNavigation: jest.Mock;
  setHighContrast: jest.Mock;
  setReducedMotion: jest.Mock;
}

const MockA11yContext = React.createContext<A11yContextValue | null>(null);

// =============================================================================
// PROVIDER COMPONENTS
// =============================================================================

/**
 * Test Query Provider with optimized configuration for testing
 */
export function TestQueryProvider({ 
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const defaultQueryClient = React.useMemo(() => {
    return queryClient || new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries in tests
          gcTime: 0, // Disable garbage collection
          staleTime: 0, // Always refetch
          refetchOnWindowFocus: false, // Disable refetch on window focus
          refetchOnMount: false, // Control refetching manually
          refetchOnReconnect: false, // Disable refetch on reconnect
        },
        mutations: {
          retry: false, // Disable retries in tests
          gcTime: 0, // Disable garbage collection
        },
      },
      logger: {
        log: () => {}, // Silence logs in tests
        warn: () => {},
        error: () => {},
      },
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={defaultQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Mock Authentication Provider for testing authentication states
 */
export function MockAuthProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: MockAuthState;
}) {
  const {
    isAuthenticated = false,
    user = null,
    state = AUTH_STATES.UNAUTHENTICATED,
    permissions = [],
    loading = false,
    error = null,
  } = config;

  // Create mock session if user is provided
  const mockSession = React.useMemo((): UserSession | null => {
    if (!user || !isAuthenticated) return null;

    return {
      userId: user.userId || 'test-user-id',
      email: user.email || 'test@example.com',
      firstName: user.firstName || 'Test',
      lastName: user.lastName || 'User',
      displayName: user.displayName || 'Test User',
      roles: user.roles || ['user'],
      permissions: permissions,
      sessionId: user.sessionId || 'test-session-id',
      sessionToken: user.sessionToken || 'test-token',
      refreshToken: user.refreshToken || 'test-refresh-token',
      csrfToken: user.csrfToken || 'test-csrf-token',
      issuedAt: user.issuedAt || Date.now(),
      expiresAt: user.expiresAt || Date.now() + 3600000, // 1 hour
      lastActivity: user.lastActivity || Date.now(),
      isRootAdmin: user.isRootAdmin || false,
      isSysAdmin: user.isSysAdmin || false,
      roleId: user.roleId || 'user-role',
      accessibleTabs: user.accessibleTabs || [],
      preferences: user.preferences || {},
    };
  }, [user, isAuthenticated, permissions]);

  // Mock authentication functions
  const mockAuthValue = React.useMemo((): AuthContextValue => ({
    session: mockSession,
    isAuthenticated,
    isLoading: loading,
    state,
    error,
    login: jest.fn().mockResolvedValue({ success: true }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    refresh: jest.fn().mockResolvedValue({ success: true }),
    hasPermission: jest.fn((permission: RBACPermission) => 
      permissions.includes(permission)
    ),
    hasRole: jest.fn((roles: string | string[]) => {
      if (!mockSession) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.some(role => mockSession.roles.includes(role));
    }),
    updateActivity: jest.fn(),
  }), [mockSession, isAuthenticated, loading, state, error, permissions]);

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

/**
 * Theme Provider wrapper for testing light/dark theme variations
 */
export function MockThemeProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: MockThemeConfig;
}) {
  const {
    theme = 'light',
    systemTheme = 'light',
    resolvedTheme = 'light',
    setTheme = jest.fn(),
    themes = ['light', 'dark', 'system'],
  } = config;

  // Mock theme context value
  const mockThemeValue = React.useMemo(() => ({
    theme,
    systemTheme,
    resolvedTheme,
    setTheme,
    themes,
    forcedTheme: undefined,
    enableSystem: true,
    enableColorScheme: true,
  }), [theme, systemTheme, resolvedTheme, setTheme, themes]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      value={mockThemeValue}
    >
      {children}
    </NextThemesProvider>
  );
}

/**
 * Mock Router Provider for Next.js router testing
 */
export function MockRouterProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: MockRouterConfig;
}) {
  const {
    pathname = '/',
    query = {},
    asPath = '/',
    push = jest.fn().mockResolvedValue(true),
    replace = jest.fn().mockResolvedValue(true),
    back = jest.fn(),
    prefetch = jest.fn().mockResolvedValue(undefined),
    reload = jest.fn(),
    isReady = true,
  } = config;

  const mockRouterValue = React.useMemo((): RouterContextValue => ({
    pathname,
    query,
    asPath,
    push,
    replace,
    back,
    prefetch,
    reload,
    isReady,
  }), [pathname, query, asPath, push, replace, back, prefetch, reload, isReady]);

  return (
    <MockRouterContext.Provider value={mockRouterValue}>
      {children}
    </MockRouterContext.Provider>
  );
}

/**
 * Form Provider wrapper for React Hook Form testing
 */
export function MockFormProvider<T = any>({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: MockFormConfig<T>;
}) {
  const {
    defaultValues = {} as Partial<T>,
    schema,
    mode = 'onSubmit',
    reValidateMode = 'onChange',
    shouldFocusError = true,
  } = config;

  const formConfig: UseFormProps<T> = {
    defaultValues,
    mode,
    reValidateMode,
    shouldFocusError,
    ...(schema && { resolver: zodResolver(schema) }),
  };

  const methods = useForm<T>(formConfig);

  return (
    <ReactHookFormProvider {...methods}>
      {children}
    </ReactHookFormProvider>
  );
}

/**
 * Accessibility Testing Provider with screen reader simulation
 */
export function MockAccessibilityProvider({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: MockA11yConfig;
}) {
  const {
    announcements = [],
    screenReaderMode = false,
    keyboardNavigation = false,
    highContrast = false,
    reducedMotion = false,
    announceChanges = jest.fn(),
    focusManagement = jest.fn(),
  } = config;

  const [currentAnnouncements, setCurrentAnnouncements] = React.useState<string[]>(announcements);
  const [isScreenReaderMode, setIsScreenReaderMode] = React.useState(screenReaderMode);
  const [isKeyboardNavigation, setIsKeyboardNavigation] = React.useState(keyboardNavigation);
  const [isHighContrast, setIsHighContrast] = React.useState(highContrast);
  const [isReducedMotion, setIsReducedMotion] = React.useState(reducedMotion);

  const mockA11yValue = React.useMemo((): A11yContextValue => ({
    announcements: currentAnnouncements,
    screenReaderMode: isScreenReaderMode,
    keyboardNavigation: isKeyboardNavigation,
    highContrast: isHighContrast,
    reducedMotion: isReducedMotion,
    announce: jest.fn((message: string) => {
      setCurrentAnnouncements(prev => [...prev, message]);
      announceChanges(message);
    }),
    focus: jest.fn((element?: HTMLElement) => {
      if (element) {
        element.focus();
      }
      focusManagement(element);
    }),
    setScreenReaderMode: jest.fn((enabled: boolean) => {
      setIsScreenReaderMode(enabled);
    }),
    setKeyboardNavigation: jest.fn((enabled: boolean) => {
      setIsKeyboardNavigation(enabled);
    }),
    setHighContrast: jest.fn((enabled: boolean) => {
      setIsHighContrast(enabled);
    }),
    setReducedMotion: jest.fn((enabled: boolean) => {
      setIsReducedMotion(enabled);
    }),
  }), [
    currentAnnouncements,
    isScreenReaderMode,
    isKeyboardNavigation,
    isHighContrast,
    isReducedMotion,
    announceChanges,
    focusManagement,
  ]);

  return (
    <MockA11yContext.Provider value={mockA11yValue}>
      {children}
    </MockA11yContext.Provider>
  );
}

/**
 * Error Boundary for testing error scenarios
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class TestErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error);
    console.error('Test Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div data-testid="error-boundary">
          <h2>Test Error Boundary</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// COMBINED PROVIDERS
// =============================================================================

/**
 * All-in-one test providers wrapper component
 */
export function AllProvidersWrapper({
  children,
  config = {},
}: {
  children: ReactNode;
  config?: TestProvidersConfig;
}) {
  const {
    auth,
    router,
    theme,
    form,
    accessibility,
    queryClient,
    disableErrorBoundary = false,
  } = config;

  let wrappedChildren = children;

  // Wrap with providers in reverse order (innermost first)
  if (form) {
    wrappedChildren = (
      <MockFormProvider config={form}>
        {wrappedChildren}
      </MockFormProvider>
    );
  }

  if (accessibility) {
    wrappedChildren = (
      <MockAccessibilityProvider config={accessibility}>
        {wrappedChildren}
      </MockAccessibilityProvider>
    );
  }

  if (router) {
    wrappedChildren = (
      <MockRouterProvider config={router}>
        {wrappedChildren}
      </MockRouterProvider>
    );
  }

  if (theme) {
    wrappedChildren = (
      <MockThemeProvider config={theme}>
        {wrappedChildren}
      </MockThemeProvider>
    );
  }

  if (auth) {
    wrappedChildren = (
      <MockAuthProvider config={auth}>
        {wrappedChildren}
      </MockAuthProvider>
    );
  }

  // Query provider should be one of the outermost
  wrappedChildren = (
    <TestQueryProvider queryClient={queryClient}>
      {wrappedChildren}
    </TestQueryProvider>
  );

  // Error boundary should be the outermost
  if (!disableErrorBoundary) {
    wrappedChildren = (
      <TestErrorBoundary>
        {wrappedChildren}
      </TestErrorBoundary>
    );
  }

  return <>{wrappedChildren}</>;
}

// =============================================================================
// CUSTOM HOOKS FOR ACCESSING MOCK CONTEXTS
// =============================================================================

/**
 * Hook to access mock authentication context in tests
 */
export function useMockAuth(): AuthContextValue {
  const context = React.useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within MockAuthProvider');
  }
  return context;
}

/**
 * Hook to access mock router context in tests
 */
export function useMockRouter(): RouterContextValue {
  const context = React.useContext(MockRouterContext);
  if (!context) {
    throw new Error('useMockRouter must be used within MockRouterProvider');
  }
  return context;
}

/**
 * Hook to access mock accessibility context in tests
 */
export function useMockA11y(): A11yContextValue {
  const context = React.useContext(MockA11yContext);
  if (!context) {
    throw new Error('useMockA11y must be used within MockAccessibilityProvider');
  }
  return context;
}

// =============================================================================
// CUSTOM RENDER FUNCTIONS
// =============================================================================

/**
 * Custom render function that wraps components with test providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { providers, ...renderOptions } = options;

  function TestWrapper({ children }: { children: ReactNode }): ReactElement {
    return (
      <AllProvidersWrapper config={providers}>
        {children}
      </AllProvidersWrapper>
    );
  }

  return render(ui, {
    wrapper: options.wrapper || TestWrapper,
    ...renderOptions,
  });
}

/**
 * Render function specifically for authenticated components
 */
export function renderWithAuth(
  ui: ReactElement,
  authConfig: MockAuthState = { isAuthenticated: true },
  options: CustomRenderOptions = {}
): RenderResult {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      ...options.providers,
      auth: { ...authConfig },
    },
  });
}

/**
 * Render function specifically for form components
 */
export function renderWithForm<T = any>(
  ui: ReactElement,
  formConfig: MockFormConfig<T> = {},
  options: CustomRenderOptions = {}
): RenderResult {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      ...options.providers,
      form: formConfig,
    },
  });
}

/**
 * Render function specifically for router-dependent components
 */
export function renderWithRouter(
  ui: ReactElement,
  routerConfig: MockRouterConfig = {},
  options: CustomRenderOptions = {}
): RenderResult {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      ...options.providers,
      router: routerConfig,
    },
  });
}

/**
 * Render function specifically for accessibility testing
 */
export function renderWithA11y(
  ui: ReactElement,
  a11yConfig: MockA11yConfig = { screenReaderMode: true },
  options: CustomRenderOptions = {}
): RenderResult {
  return renderWithProviders(ui, {
    ...options,
    providers: {
      ...options.providers,
      accessibility: a11yConfig,
    },
  });
}

// =============================================================================
// TEST UTILITIES AND HELPERS
// =============================================================================

/**
 * Creates a mock user session for testing
 */
export function createMockUserSession(overrides: Partial<UserSession> = {}): UserSession {
  return {
    userId: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    roles: ['user'],
    permissions: [RBAC_PERMISSIONS.USER_READ],
    sessionId: 'test-session-id',
    sessionToken: 'test-token',
    refreshToken: 'test-refresh-token',
    csrfToken: 'test-csrf-token',
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000, // 1 hour
    lastActivity: Date.now(),
    isRootAdmin: false,
    isSysAdmin: false,
    roleId: 'user-role',
    accessibleTabs: [],
    preferences: {},
    ...overrides,
  };
}

/**
 * Creates a mock admin user session for testing
 */
export function createMockAdminSession(overrides: Partial<UserSession> = {}): UserSession {
  return createMockUserSession({
    roles: ['admin'],
    permissions: [
      RBAC_PERMISSIONS.SUPER_ADMIN,
      RBAC_PERMISSIONS.SYSTEM_ADMIN,
      RBAC_PERMISSIONS.USER_READ,
      RBAC_PERMISSIONS.USER_WRITE,
    ],
    isRootAdmin: true,
    isSysAdmin: true,
    accessibleTabs: ['users', 'admins', 'roles', 'services', 'schema'],
    ...overrides,
  });
}

/**
 * Creates a basic test query client with test-friendly defaults
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * Mock form validation schema for testing
 */
export const mockValidationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Wait for all pending queries to settle (useful for async testing)
 */
export async function waitForQueriesToSettle(queryClient: QueryClient): Promise<void> {
  await queryClient.getQueryCache().clear();
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Mock window.matchMedia for responsive testing
 */
export function mockMatchMedia(matches: boolean = false): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Mock window.ResizeObserver for component testing
 */
export function mockResizeObserver(): void {
  class MockResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });
}

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage(): { [key: string]: string } {
  const store: { [key: string]: string } = {};

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => {
          delete store[key];
        });
      }),
      key: jest.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      }),
      length: Object.keys(store).length,
    },
  });

  return store;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  type MockAuthState,
  type MockRouterConfig,
  type MockThemeConfig,
  type MockFormConfig,
  type MockA11yConfig,
  type TestProvidersConfig,
  type CustomRenderOptions,
};

// Re-export testing library utilities for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';