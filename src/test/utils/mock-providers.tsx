/**
 * Mock Context Providers for Testing
 * 
 * Provides individual React context providers for isolated component testing
 * that replicate Angular TestBed module configuration patterns. Each provider
 * can be used independently for granular test setup or combined for comprehensive
 * testing scenarios requiring multiple contexts.
 * 
 * Key Features:
 * - Individual provider components for targeted testing scenarios
 * - Authentication state mocking with session management simulation
 * - Theme and internationalization provider setup for UI component testing
 * - Next.js router context mocking for navigation component testing
 * - React Query client mocking with configurable cache behavior
 * - Form provider wrapper for React Hook Form testing with validation scenarios
 * - Accessibility testing provider with screen reader simulation capabilities
 * 
 * Usage Pattern:
 * ```tsx
 * // Individual provider testing
 * render(<MockAuthProvider user={mockUser}><Component /></MockAuthProvider>);
 * 
 * // Multiple provider composition
 * render(
 *   <TestQueryProvider>
 *     <MockAuthProvider user={mockUser}>
 *       <MockThemeProvider theme="dark">
 *         <Component />
 *       </MockThemeProvider>
 *     </MockAuthProvider>
 *   </TestQueryProvider>
 * );
 * ```
 */

'use client';

import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { FormProvider, UseFormReturn, FieldValues } from 'react-hook-form';
import type { UserSession, AuthState, AuthActions } from '@/types/auth';
import type { UserProfile } from '@/types/user';

// =============================================================================
// MOCK AUTHENTICATION PROVIDER
// =============================================================================

/**
 * Mock authentication context interface
 */
interface MockAuthContextValue extends AuthState, AuthActions {
  // Additional testing utilities
  _setUser: (user: UserSession | null) => void;
  _setLoading: (loading: boolean) => void;
  _setError: (error: any) => void;
  _triggerRefresh: () => void;
}

/**
 * Mock authentication context
 */
const MockAuthContext = createContext<MockAuthContextValue | null>(null);

/**
 * Mock authentication provider configuration
 */
export interface MockAuthProviderProps {
  children: ReactNode;
  /** Initial user state for testing */
  user?: UserSession | null;
  /** Initial loading state */
  isLoading?: boolean;
  /** Initial error state */
  error?: any;
  /** Mock authentication state */
  isAuthenticated?: boolean;
  /** Mock refresh state */
  isRefreshing?: boolean;
  /** Mock user permissions */
  permissions?: string[];
  /** Mock implementation of authentication actions */
  mockActions?: Partial<AuthActions>;
}

/**
 * Mock authentication provider for testing authentication flows
 * 
 * Provides controllable authentication state for testing components
 * that depend on user sessions, permissions, and authentication status.
 * Supports dynamic state updates during testing through utility methods.
 * 
 * @param props Authentication provider configuration
 */
export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  user = null,
  isLoading = false,
  error = null,
  isAuthenticated = !!user,
  isRefreshing = false,
  permissions = [],
  mockActions = {},
}) => {
  const [currentUser, setCurrentUser] = React.useState<UserSession | null>(user);
  const [currentLoading, setCurrentLoading] = React.useState(isLoading);
  const [currentError, setCurrentError] = React.useState(error);
  const [currentRefreshing, setCurrentRefreshing] = React.useState(isRefreshing);

  // Default mock implementations for authentication actions
  const defaultMockActions: AuthActions = {
    login: jest.fn().mockResolvedValue(undefined),
    loginWithToken: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    refreshToken: jest.fn().mockResolvedValue(undefined),
    forgotPassword: jest.fn().mockResolvedValue({ success: true, message: 'Password reset email sent' }),
    updatePassword: jest.fn().mockResolvedValue({ success: true, message: 'Password updated' }),
    oauthLogin: jest.fn().mockResolvedValue(undefined),
    samlLogin: jest.fn().mockResolvedValue(undefined),
    updateUser: jest.fn((userData: Partial<UserSession>) => {
      if (currentUser) {
        setCurrentUser({ ...currentUser, ...userData });
      }
    }),
    clearError: jest.fn(() => setCurrentError(null)),
    checkSession: jest.fn().mockResolvedValue(!!currentUser),
    hasRole: jest.fn((role: string) => currentUser?.roles?.includes(role) || false),
    hasPermission: jest.fn((permission: string) => permissions.includes(permission)),
    canAccessService: jest.fn((serviceName: string) => !!currentUser),
    checkPermissions: jest.fn((requiredPermissions: string[]) => 
      requiredPermissions.every(permission => permissions.includes(permission))
    ),
    clearAuthState: jest.fn().mockResolvedValue(undefined),
  };

  const contextValue: MockAuthContextValue = useMemo(() => ({
    // Authentication state
    isAuthenticated: !!currentUser,
    isLoading: currentLoading,
    user: currentUser,
    error: currentError,
    isRefreshing: currentRefreshing,
    permissions,

    // Authentication actions (merged with custom mocks)
    ...defaultMockActions,
    ...mockActions,

    // Testing utilities
    _setUser: setCurrentUser,
    _setLoading: setCurrentLoading,
    _setError: setCurrentError,
    _triggerRefresh: () => setCurrentRefreshing(true),
  }), [
    currentUser,
    currentLoading,
    currentError,
    currentRefreshing,
    permissions,
    mockActions,
  ]);

  return (
    <MockAuthContext.Provider value={contextValue}>
      {children}
    </MockAuthContext.Provider>
  );
};

/**
 * Hook to access mock authentication context in tests
 */
export const useMockAuth = (): MockAuthContextValue => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

// =============================================================================
// MOCK THEME PROVIDER
// =============================================================================

/**
 * Theme context interface
 */
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}

/**
 * Mock theme context
 */
const MockThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Mock theme provider configuration
 */
export interface MockThemeProviderProps {
  children: ReactNode;
  /** Initial theme state */
  theme?: 'light' | 'dark' | 'system';
  /** System theme preference for testing */
  systemTheme?: 'light' | 'dark';
  /** Disable theme transitions for testing */
  disableTransitions?: boolean;
}

/**
 * Mock theme provider for testing theme-dependent components
 * 
 * Provides controllable theme state for testing components that respond
 * to light/dark theme changes. Includes system theme preference simulation
 * and theme transition controls for consistent testing.
 * 
 * @param props Theme provider configuration
 */
export const MockThemeProvider: React.FC<MockThemeProviderProps> = ({
  children,
  theme: initialTheme = 'light',
  systemTheme = 'light',
  disableTransitions = true,
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark' | 'system'>(initialTheme);

  const resolvedTheme = currentTheme === 'system' ? systemTheme : currentTheme;

  const contextValue: ThemeContextValue = useMemo(() => ({
    theme: currentTheme,
    setTheme: setCurrentTheme,
    resolvedTheme,
    systemTheme,
  }), [currentTheme, resolvedTheme, systemTheme]);

  // Apply theme classes to container for Tailwind CSS testing
  const themeClasses = [
    resolvedTheme,
    disableTransitions ? 'transition-none' : '',
  ].filter(Boolean).join(' ');

  return (
    <MockThemeContext.Provider value={contextValue}>
      <div className={themeClasses} data-testid="theme-provider" data-theme={resolvedTheme}>
        {children}
      </div>
    </MockThemeContext.Provider>
  );
};

/**
 * Hook to access mock theme context in tests
 */
export const useMockTheme = (): ThemeContextValue => {
  const context = useContext(MockThemeContext);
  if (!context) {
    throw new Error('useMockTheme must be used within a MockThemeProvider');
  }
  return context;
};

// =============================================================================
// MOCK ROUTER PROVIDER
// =============================================================================

/**
 * Mock Next.js router interface
 */
export interface MockRouter {
  push: jest.Mock;
  replace: jest.Mock;
  prefetch: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  refresh: jest.Mock;
}

/**
 * Mock router provider configuration
 */
export interface MockRouterProviderProps {
  children: ReactNode;
  /** Current pathname for testing */
  pathname?: string;
  /** Search parameters for testing */
  searchParams?: URLSearchParams;
  /** Mock router implementation */
  router?: Partial<MockRouter>;
  /** Enable router call tracking */
  trackCalls?: boolean;
}

/**
 * Creates a mock Next.js App Router for testing
 */
export const createMockRouter = (overrides: Partial<MockRouter> = {}): MockRouter => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  ...overrides,
});

/**
 * Mock router provider for testing navigation components
 * 
 * Provides Next.js App Router context mocking for testing components
 * that use router hooks. Includes pathname, search params, and router
 * action mocking with call tracking capabilities.
 * 
 * @param props Router provider configuration
 */
export const MockRouterProvider: React.FC<MockRouterProviderProps> = ({
  children,
  pathname = '/',
  searchParams = new URLSearchParams(),
  router = {},
  trackCalls = true,
}) => {
  const mockRouter = useMemo(() => createMockRouter(router), [router]);

  // Track router calls if enabled
  React.useEffect(() => {
    if (trackCalls) {
      const originalPush = mockRouter.push;
      mockRouter.push = jest.fn((...args) => {
        console.log('[MockRouter] push called with:', args);
        return originalPush(...args);
      });
    }
  }, [mockRouter, trackCalls]);

  return (
    <AppRouterContext.Provider value={mockRouter as any}>
      <PathnameContext.Provider value={pathname}>
        <SearchParamsContext.Provider value={searchParams}>
          {children}
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
};

// =============================================================================
// TEST QUERY PROVIDER
// =============================================================================

/**
 * Test query client configuration
 */
export interface TestQueryProviderProps {
  children: ReactNode;
  /** Custom query client instance */
  queryClient?: QueryClient;
  /** Initial query data for testing */
  initialData?: Record<string, any>;
  /** Disable retries for consistent testing */
  disableRetry?: boolean;
  /** Custom stale time for testing */
  staleTime?: number;
  /** Custom cache time for testing */
  cacheTime?: number;
}

/**
 * Test query provider replacing Angular HTTP testing module
 * 
 * Provides TanStack React Query client configuration optimized for testing.
 * Includes initial data setup, retry disabling, and cache time controls
 * for predictable test behavior.
 * 
 * @param props Query provider configuration
 */
export const TestQueryProvider: React.FC<TestQueryProviderProps> = ({
  children,
  queryClient: customQueryClient,
  initialData = {},
  disableRetry = true,
  staleTime = 0,
  cacheTime = 0,
}) => {
  const queryClient = useMemo(() => {
    if (customQueryClient) return customQueryClient;

    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: disableRetry ? false : 3,
          staleTime,
          gcTime: cacheTime,
          refetchOnMount: false,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
        mutations: {
          retry: disableRetry ? false : 3,
        },
      },
    });

    // Set initial data if provided
    Object.entries(initialData).forEach(([queryKey, data]) => {
      client.setQueryData([queryKey], data);
    });

    return client;
  }, [customQueryClient, initialData, disableRetry, staleTime, cacheTime]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// =============================================================================
// MOCK FORM PROVIDER
// =============================================================================

/**
 * Mock form provider configuration
 */
export interface MockFormProviderProps<T extends FieldValues = FieldValues> {
  children: ReactNode;
  /** React Hook Form methods for testing */
  formMethods?: UseFormReturn<T>;
  /** Default values for form testing */
  defaultValues?: Partial<T>;
  /** Mock validation errors */
  errors?: Record<string, any>;
  /** Mock form state */
  isValid?: boolean;
  /** Mock submission state */
  isSubmitting?: boolean;
  /** Mock dirty state */
  isDirty?: boolean;
}

/**
 * Mock form provider for React Hook Form testing
 * 
 * Provides React Hook Form context with configurable form state for testing
 * form components and validation scenarios. Supports custom form methods,
 * validation errors, and form state simulation.
 * 
 * @param props Form provider configuration
 */
export const MockFormProvider = <T extends FieldValues = FieldValues>({
  children,
  formMethods,
  defaultValues = {} as Partial<T>,
  errors = {},
  isValid = true,
  isSubmitting = false,
  isDirty = false,
}: MockFormProviderProps<T>) => {
  const mockFormMethods: UseFormReturn<T> = useMemo(() => {
    if (formMethods) return formMethods;

    return {
      register: jest.fn(),
      unregister: jest.fn(),
      handleSubmit: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearErrors: jest.fn(),
      setValue: jest.fn(),
      getValue: jest.fn(),
      getValues: jest.fn(() => defaultValues as T),
      watch: jest.fn(),
      trigger: jest.fn().mockResolvedValue(true),
      formState: {
        errors,
        isValid,
        isSubmitting,
        isDirty,
        isLoading: false,
        isSubmitted: false,
        isSubmitSuccessful: false,
        isValidating: false,
        submitCount: 0,
        touchedFields: {},
        dirtyFields: {},
        defaultValues,
      },
      control: {} as any,
      getFieldState: jest.fn(),
      resetField: jest.fn(),
      setFocus: jest.fn(),
    } as UseFormReturn<T>;
  }, [formMethods, defaultValues, errors, isValid, isSubmitting, isDirty]);

  return (
    <FormProvider {...mockFormMethods}>
      {children}
    </FormProvider>
  );
};

// =============================================================================
// ACCESSIBILITY TESTING PROVIDER
// =============================================================================

/**
 * Accessibility context interface
 */
interface AccessibilityContextValue {
  screenReaderEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  announceMessage: (message: string) => void;
  setScreenReaderEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
}

/**
 * Mock accessibility context
 */
const MockAccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Accessibility provider configuration
 */
export interface MockAccessibilityProviderProps {
  children: ReactNode;
  /** Initial screen reader state */
  screenReaderEnabled?: boolean;
  /** Initial reduced motion preference */
  reducedMotion?: boolean;
  /** Initial high contrast preference */
  highContrast?: boolean;
  /** Custom message announcer for testing */
  messageAnnouncer?: (message: string) => void;
}

/**
 * Mock accessibility provider for testing accessible components
 * 
 * Provides accessibility context simulation for testing components with
 * screen reader support, reduced motion preferences, and high contrast
 * modes. Includes message announcement tracking for ARIA live regions.
 * 
 * @param props Accessibility provider configuration
 */
export const MockAccessibilityProvider: React.FC<MockAccessibilityProviderProps> = ({
  children,
  screenReaderEnabled = false,
  reducedMotion = false,
  highContrast = false,
  messageAnnouncer = jest.fn(),
}) => {
  const [currentScreenReaderEnabled, setCurrentScreenReaderEnabled] = React.useState(screenReaderEnabled);
  const [currentReducedMotion, setCurrentReducedMotion] = React.useState(reducedMotion);
  const [currentHighContrast, setCurrentHighContrast] = React.useState(highContrast);

  const contextValue: AccessibilityContextValue = useMemo(() => ({
    screenReaderEnabled: currentScreenReaderEnabled,
    reducedMotion: currentReducedMotion,
    highContrast: currentHighContrast,
    announceMessage: messageAnnouncer,
    setScreenReaderEnabled: setCurrentScreenReaderEnabled,
    setReducedMotion: setCurrentReducedMotion,
    setHighContrast: setCurrentHighContrast,
  }), [
    currentScreenReaderEnabled,
    currentReducedMotion,
    currentHighContrast,
    messageAnnouncer,
  ]);

  // Apply accessibility classes for testing
  const accessibilityClasses = [
    currentReducedMotion ? 'motion-reduce' : '',
    currentHighContrast ? 'contrast-more' : '',
  ].filter(Boolean).join(' ');

  return (
    <MockAccessibilityContext.Provider value={contextValue}>
      <div 
        className={accessibilityClasses}
        data-testid="accessibility-provider"
        data-screen-reader={currentScreenReaderEnabled}
        data-reduced-motion={currentReducedMotion}
        data-high-contrast={currentHighContrast}
      >
        {children}
      </div>
    </MockAccessibilityContext.Provider>
  );
};

/**
 * Hook to access mock accessibility context in tests
 */
export const useMockAccessibility = (): AccessibilityContextValue => {
  const context = useContext(MockAccessibilityContext);
  if (!context) {
    throw new Error('useMockAccessibility must be used within a MockAccessibilityProvider');
  }
  return context;
};

// =============================================================================
// INTERNATIONALIZATION PROVIDER
// =============================================================================

/**
 * Internationalization context interface
 */
interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
}

/**
 * Mock internationalization context
 */
const MockI18nContext = createContext<I18nContextValue | null>(null);

/**
 * Internationalization provider configuration
 */
export interface MockI18nProviderProps {
  children: ReactNode;
  /** Initial locale */
  locale?: string;
  /** Mock translations */
  translations?: Record<string, Record<string, string>>;
  /** Custom translation function */
  customT?: (key: string, params?: Record<string, any>) => string;
}

/**
 * Mock internationalization provider for testing localized components
 * 
 * Provides i18n context simulation for testing components with translations,
 * date formatting, and number formatting. Supports custom translation
 * dictionaries and locale switching for testing internationalization.
 * 
 * @param props I18n provider configuration
 */
export const MockI18nProvider: React.FC<MockI18nProviderProps> = ({
  children,
  locale = 'en-US',
  translations = {},
  customT,
}) => {
  const [currentLocale, setCurrentLocale] = React.useState(locale);

  const t = useMemo(() => {
    if (customT) return customT;

    return (key: string, params: Record<string, any> = {}) => {
      const localeTranslations = translations[currentLocale] || translations['en-US'] || {};
      let translation = localeTranslations[key] || key;

      // Simple parameter substitution
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });

      return translation;
    };
  }, [customT, translations, currentLocale]);

  const formatDate = useMemo(() => {
    return (date: Date, options: Intl.DateTimeFormatOptions = {}) => {
      return new Intl.DateTimeFormat(currentLocale, options).format(date);
    };
  }, [currentLocale]);

  const formatNumber = useMemo(() => {
    return (value: number, options: Intl.NumberFormatOptions = {}) => {
      return new Intl.NumberFormat(currentLocale, options).format(value);
    };
  }, [currentLocale]);

  const contextValue: I18nContextValue = useMemo(() => ({
    locale: currentLocale,
    setLocale: setCurrentLocale,
    t,
    formatDate,
    formatNumber,
  }), [currentLocale, t, formatDate, formatNumber]);

  return (
    <MockI18nContext.Provider value={contextValue}>
      <div data-testid="i18n-provider" data-locale={currentLocale}>
        {children}
      </div>
    </MockI18nContext.Provider>
  );
};

/**
 * Hook to access mock i18n context in tests
 */
export const useMockI18n = (): I18nContextValue => {
  const context = useContext(MockI18nContext);
  if (!context) {
    throw new Error('useMockI18n must be used within a MockI18nProvider');
  }
  return context;
};

// =============================================================================
// COMPOSITE PROVIDER UTILITIES
// =============================================================================

/**
 * Configuration for multiple providers
 */
export interface CompositeProviderProps {
  children: ReactNode;
  auth?: MockAuthProviderProps;
  theme?: MockThemeProviderProps;
  router?: MockRouterProviderProps;
  query?: TestQueryProviderProps;
  form?: MockFormProviderProps;
  accessibility?: MockAccessibilityProviderProps;
  i18n?: MockI18nProviderProps;
}

/**
 * Composite provider for testing with multiple contexts
 * 
 * Provides a convenient way to compose multiple mock providers for
 * comprehensive testing scenarios. Maintains proper provider ordering
 * and context isolation for complex component testing.
 * 
 * @param props Composite provider configuration
 */
export const MockCompositeProvider: React.FC<CompositeProviderProps> = ({
  children,
  auth,
  theme,
  router,
  query,
  form,
  accessibility,
  i18n,
}) => {
  let wrappedChildren = children;

  // Wrap in reverse order to maintain proper context hierarchy
  if (i18n) {
    wrappedChildren = (
      <MockI18nProvider {...i18n}>
        {wrappedChildren}
      </MockI18nProvider>
    );
  }

  if (accessibility) {
    wrappedChildren = (
      <MockAccessibilityProvider {...accessibility}>
        {wrappedChildren}
      </MockAccessibilityProvider>
    );
  }

  if (form) {
    wrappedChildren = (
      <MockFormProvider {...form}>
        {wrappedChildren}
      </MockFormProvider>
    );
  }

  if (router) {
    wrappedChildren = (
      <MockRouterProvider {...router}>
        {wrappedChildren}
      </MockRouterProvider>
    );
  }

  if (theme) {
    wrappedChildren = (
      <MockThemeProvider {...theme}>
        {wrappedChildren}
      </MockThemeProvider>
    );
  }

  if (auth) {
    wrappedChildren = (
      <MockAuthProvider {...auth}>
        {wrappedChildren}
      </MockAuthProvider>
    );
  }

  if (query) {
    wrappedChildren = (
      <TestQueryProvider {...query}>
        {wrappedChildren}
      </TestQueryProvider>
    );
  }

  return <>{wrappedChildren}</>;
};

// =============================================================================
// EXPORT ALL PROVIDERS AND UTILITIES
// =============================================================================

export {
  MockAuthContext,
  MockThemeContext,
  MockAccessibilityContext,
  MockI18nContext,
};

// Type exports for provider props
export type {
  MockAuthContextValue,
  ThemeContextValue,
  AccessibilityContextValue,
  I18nContextValue,
};

// Default export for convenience
export default MockCompositeProvider;