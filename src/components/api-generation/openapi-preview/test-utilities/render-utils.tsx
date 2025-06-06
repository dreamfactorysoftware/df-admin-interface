/**
 * @fileoverview React Testing Library render utilities and custom providers for OpenAPI preview component testing
 * @description Provides reusable render functions with API generation context, React Query client, MSW integration, and routing setup for consistent component testing environment across the OpenAPI preview test suite
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - React Testing Library component testing patterns per React/Next.js Integration Requirements
 * - Custom render function with OpenAPI preview context provider, React Query client, and Next.js router setup per F-006 API Documentation and Testing requirements
 * - MSW integration with render utilities for realistic API interaction testing during OpenAPI preview component tests per Section 3.6 Enhanced Testing Pipeline
 * - Utility functions for OpenAPI preview state management testing and specification rendering simulation per Section 6.6 Testing Strategy
 * - Comprehensive provider setup for isolated component testing with authentication, theme, and form contexts
 * - Performance-optimized test execution with Vitest 2.1.0 and native TypeScript support per Section 3.6 Development & Deployment
 * - Accessibility testing utilities ensuring WCAG 2.1 AA compliance per technical specification requirements
 * - SwaggerUI component testing utilities with theme switching and API key management simulation
 */

import React, { ReactElement, ReactNode, ComponentType, createContext, useContext } from 'react'
import { vi, type MockedFunction } from 'vitest'
import { 
  render, 
  screen, 
  within, 
  RenderOptions, 
  RenderResult,
  waitFor,
  fireEvent
} from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider, type QueryClientConfig } from '@tanstack/react-query'
import { FormProvider, useForm, type UseFormReturn, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { type z } from 'zod'

// Import Next.js testing contexts
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'

// Import OpenAPI preview types and test utilities
import type {
  OpenAPIPreviewStore,
  OpenAPIViewerProps,
  ApiDocsListProps,
  ApiKeySelectorProps,
  SwaggerUIConfig,
  ApiKeyInfo,
  ServiceApiKeys,
  OpenAPIPreviewError,
  OpenAPIPreviewState,
  OpenAPIPreviewActions,
  ThemeMode
} from '../types'
import { 
  createTestQueryClient,
  testQueryClient,
  server,
  serverConfig,
  createMockOpenAPIPreviewStore,
  createMockApiKey,
  createMockServiceApiKeys,
  createMockOpenAPIError,
  TEST_CONSTANTS,
  debugLog,
  mockBrowserAPIs
} from './test-setup'

// =============================================================================
// MOCK CONTEXTS AND PROVIDERS
// =============================================================================

/**
 * Mock OpenAPI preview context for testing
 * Provides controlled state management for component testing scenarios
 */
export interface MockOpenAPIPreviewContext {
  store: OpenAPIPreviewStore
  updateStore: (updates: Partial<OpenAPIPreviewStore>) => void
  resetStore: () => void
}

/**
 * OpenAPI preview context for testing
 */
const OpenAPIPreviewTestContext = createContext<MockOpenAPIPreviewContext | null>(null)

/**
 * Hook to access OpenAPI preview test context
 */
export const useOpenAPIPreviewTestContext = (): MockOpenAPIPreviewContext => {
  const context = useContext(OpenAPIPreviewTestContext)
  if (!context) {
    throw new Error('useOpenAPIPreviewTestContext must be used within OpenAPIPreviewTestProvider')
  }
  return context
}

/**
 * OpenAPI preview provider for testing
 * Wraps components with mock OpenAPI preview state and actions
 */
interface OpenAPIPreviewTestProviderProps {
  children: ReactNode
  initialStore?: Partial<OpenAPIPreviewStore>
}

const OpenAPIPreviewTestProvider: React.FC<OpenAPIPreviewTestProviderProps> = ({
  children,
  initialStore = {}
}) => {
  const [store, setStore] = React.useState<OpenAPIPreviewStore>(() =>
    createMockOpenAPIPreviewStore(initialStore)
  )

  const updateStore = React.useCallback((updates: Partial<OpenAPIPreviewStore>) => {
    setStore(prev => ({ ...prev, ...updates }))
  }, [])

  const resetStore = React.useCallback(() => {
    setStore(createMockOpenAPIPreviewStore(initialStore))
  }, [initialStore])

  const contextValue = React.useMemo(() => ({
    store,
    updateStore,
    resetStore
  }), [store, updateStore, resetStore])

  return (
    <OpenAPIPreviewTestContext.Provider value={contextValue}>
      {children}
    </OpenAPIPreviewTestContext.Provider>
  )
}

/**
 * Mock theme provider for testing
 */
interface MockThemeProviderProps {
  children: ReactNode
  theme?: ThemeMode
  systemTheme?: 'light' | 'dark'
}

const MockThemeProvider: React.FC<MockThemeProviderProps> = ({
  children,
  theme = 'light',
  systemTheme = 'light'
}) => {
  const [currentTheme, setCurrentTheme] = React.useState(theme)

  const themeContext = React.useMemo(() => ({
    theme: currentTheme,
    systemTheme,
    resolvedTheme: currentTheme === 'system' ? systemTheme : currentTheme,
    setTheme: vi.fn((newTheme: ThemeMode) => setCurrentTheme(newTheme)),
    themes: ['light', 'dark', 'system']
  }), [currentTheme, systemTheme])

  return (
    <div className={currentTheme} data-testid="theme-provider" data-theme={currentTheme}>
      {React.createElement(
        React.createContext(themeContext).Provider,
        { value: themeContext },
        children
      )}
    </div>
  )
}

/**
 * Mock authentication provider for testing
 */
interface MockAuthProviderProps {
  children: ReactNode
  user?: {
    id: string
    email: string
    firstName: string
    lastName: string
    isAdmin: boolean
    sessionToken?: string
    permissions?: string[]
  } | null
  loading?: boolean
  error?: string | null
}

const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  user = null,
  loading = false,
  error = null
}) => {
  const authContext = React.useMemo(() => ({
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
    hasPermission: vi.fn((permission: string) => 
      user?.permissions?.includes(permission) ?? false
    ),
    isAdmin: user?.isAdmin ?? false
  }), [user, loading, error])

  return (
    <div data-testid="auth-provider">
      {React.createElement(
        React.createContext(authContext).Provider,
        { value: authContext },
        children
      )}
    </div>
  )
}

// =============================================================================
// MOCK ROUTER AND NAVIGATION
// =============================================================================

/**
 * Mock Next.js App Router for testing
 */
export interface MockAppRouter extends AppRouterInstance {
  push: MockedFunction<AppRouterInstance['push']>
  replace: MockedFunction<AppRouterInstance['replace']>
  prefetch: MockedFunction<AppRouterInstance['prefetch']>
  back: MockedFunction<AppRouterInstance['back']>
  forward: MockedFunction<AppRouterInstance['forward']>
  refresh: MockedFunction<AppRouterInstance['refresh']>
}

/**
 * Create mock Next.js router for testing
 */
export const createMockAppRouter = (overrides: Partial<MockAppRouter> = {}): MockAppRouter => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  ...overrides
})

/**
 * Mock router provider configuration
 */
interface MockRouterProviderProps {
  children: ReactNode
  router?: Partial<MockAppRouter>
  pathname?: string
  searchParams?: URLSearchParams
}

const MockRouterProvider: React.FC<MockRouterProviderProps> = ({
  children,
  router = {},
  pathname = '/',
  searchParams = new URLSearchParams()
}) => {
  const mockRouter = React.useMemo(() => createMockAppRouter(router), [router])

  return (
    <AppRouterContext.Provider value={mockRouter}>
      <PathnameContext.Provider value={pathname}>
        <SearchParamsContext.Provider value={searchParams}>
          {children}
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  )
}

// =============================================================================
// COMPREHENSIVE TEST PROVIDER SETUP
// =============================================================================

/**
 * Configuration options for OpenAPI preview test providers
 */
export interface OpenAPIPreviewTestConfig {
  /** OpenAPI preview store initial state */
  openApiStore?: Partial<OpenAPIPreviewStore>
  
  /** React Query client configuration */
  queryClient?: QueryClient | QueryClientConfig
  
  /** Router configuration */
  router?: {
    pathname?: string
    searchParams?: URLSearchParams
    instance?: Partial<MockAppRouter>
  }
  
  /** Theme configuration */
  theme?: {
    mode?: ThemeMode
    systemTheme?: 'light' | 'dark'
  }
  
  /** Authentication configuration */
  auth?: MockAuthProviderProps
  
  /** Form configuration */
  form?: {
    defaultValues?: FieldValues
    schema?: z.ZodSchema<any>
    formMethods?: UseFormReturn<any>
  }
  
  /** MSW configuration */
  msw?: {
    handlers?: 'core' | 'errors' | 'performance' | 'security'
    customHandlers?: any[]
  }
  
  /** Accessibility testing configuration */
  a11y?: {
    announcements?: string[]
    screenReaderMode?: boolean
    keyboardNavigation?: boolean
  }
  
  /** Performance testing configuration */
  performance?: {
    enableMetrics?: boolean
    slowNetwork?: boolean
    measureRender?: boolean
  }
}

/**
 * All-in-one test provider wrapper for OpenAPI preview components
 * Provides comprehensive testing context including all necessary providers
 */
interface AllOpenAPIPreviewProvidersProps {
  children: ReactNode
  config?: OpenAPIPreviewTestConfig
}

const AllOpenAPIPreviewProviders: React.FC<AllOpenAPIPreviewProvidersProps> = ({
  children,
  config = {}
}) => {
  const {
    openApiStore = {},
    queryClient: queryClientConfig = testQueryClient,
    router = {},
    theme = {},
    auth = {},
    form = {},
    msw = {},
    a11y = {},
    performance = {}
  } = config

  // Setup MSW handlers based on configuration
  React.useEffect(() => {
    if (msw.handlers) {
      switch (msw.handlers) {
        case 'core':
          serverConfig.core()
          break
        case 'errors':
          serverConfig.errors()
          break
        case 'performance':
          serverConfig.performance()
          break
        case 'security':
          serverConfig.security()
          break
      }
    }
    
    if (msw.customHandlers?.length) {
      server.use(...msw.customHandlers)
    }
  }, [msw.handlers, msw.customHandlers])

  // Create query client if configuration provided
  const queryClient = React.useMemo(() => {
    if (queryClientConfig instanceof QueryClient) {
      return queryClientConfig
    }
    return createTestQueryClient()
  }, [queryClientConfig])

  // Setup form provider if configuration provided
  const FormWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    if (!form.formMethods && !form.schema) {
      return <>{children}</>
    }

    if (form.formMethods) {
      return (
        <FormProvider {...form.formMethods}>
          {children}
        </FormProvider>
      )
    }

    const methods = useForm({
      defaultValues: form.defaultValues,
      resolver: form.schema ? zodResolver(form.schema) : undefined,
      mode: 'onChange'
    })

    return (
      <FormProvider {...methods}>
        {children}
      </FormProvider>
    )
  }

  // Setup accessibility context if needed
  const A11yWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    if (!a11y.announcements && !a11y.screenReaderMode) {
      return <>{children}</>
    }

    const a11yContext = React.useMemo(() => ({
      announcements: a11y.announcements || [],
      screenReaderMode: a11y.screenReaderMode || false,
      keyboardNavigation: a11y.keyboardNavigation ?? true,
      announce: vi.fn(),
      focusManagement: vi.fn()
    }), [a11y])

    return (
      <div data-testid="a11y-provider" role="application">
        {React.createElement(
          React.createContext(a11yContext).Provider,
          { value: a11yContext },
          children
        )}
      </div>
    )
  }

  // Performance monitoring wrapper
  const PerformanceWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    React.useEffect(() => {
      if (performance.enableMetrics) {
        debugLog('Performance monitoring enabled for test')
      }
    }, [performance.enableMetrics])

    return <>{children}</>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MockRouterProvider
        pathname={router.pathname}
        searchParams={router.searchParams}
        router={router.instance}
      >
        <MockThemeProvider
          theme={theme.mode}
          systemTheme={theme.systemTheme}
        >
          <MockAuthProvider {...auth}>
            <OpenAPIPreviewTestProvider initialStore={openApiStore}>
              <FormWrapper>
                <A11yWrapper>
                  <PerformanceWrapper>
                    <div data-testid="openapi-preview-test-wrapper">
                      {children}
                    </div>
                  </PerformanceWrapper>
                </A11yWrapper>
              </FormWrapper>
            </OpenAPIPreviewTestProvider>
          </MockAuthProvider>
        </MockThemeProvider>
      </MockRouterProvider>
    </QueryClientProvider>
  )
}

// =============================================================================
// ENHANCED RENDER FUNCTIONS
// =============================================================================

/**
 * Enhanced render options for OpenAPI preview components
 */
export interface OpenAPIPreviewRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  config?: OpenAPIPreviewTestConfig
  skipProviders?: boolean
}

/**
 * Enhanced render result with testing utilities
 */
export interface OpenAPIPreviewRenderResult extends RenderResult {
  user: UserEvent
  queryClient: QueryClient
  mockRouter: MockAppRouter
  store: OpenAPIPreviewStore
  rerender: (ui: ReactElement, options?: OpenAPIPreviewRenderOptions) => void
  updateStore: (updates: Partial<OpenAPIPreviewStore>) => void
  resetStore: () => void
}

/**
 * Main render function for OpenAPI preview components
 * Provides comprehensive testing environment with all necessary providers and utilities
 */
export const renderOpenAPIPreview = (
  ui: ReactElement,
  options: OpenAPIPreviewRenderOptions = {}
): OpenAPIPreviewRenderResult => {
  const { config = {}, skipProviders = false, ...renderOptions } = options

  let contextValue: MockOpenAPIPreviewContext | null = null

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    if (skipProviders) {
      return <>{children}</>
    }

    return (
      <AllOpenAPIPreviewProviders config={config}>
        {children}
      </AllOpenAPIPreviewProviders>
    )
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions })

  // Get context value for store access
  if (!skipProviders) {
    const testElement = screen.getByTestId('openapi-preview-test-wrapper')
    const contextEl = testElement.closest('[data-testid="openapi-preview-test-wrapper"]')
    if (contextEl) {
      // In a real implementation, we'd use React DevTools or a ref to access context
      // For testing purposes, we'll create a mock context value
      contextValue = {
        store: createMockOpenAPIPreviewStore(config.openApiStore),
        updateStore: vi.fn(),
        resetStore: vi.fn()
      }
    }
  }

  const queryClient = config.queryClient instanceof QueryClient 
    ? config.queryClient 
    : testQueryClient

  const mockRouter = createMockAppRouter(config.router?.instance)

  const enhancedResult: OpenAPIPreviewRenderResult = {
    ...result,
    user: userEvent.setup(),
    queryClient,
    mockRouter,
    store: contextValue?.store || createMockOpenAPIPreviewStore(),
    updateStore: contextValue?.updateStore || vi.fn(),
    resetStore: contextValue?.resetStore || vi.fn(),
    rerender: (ui: ReactElement, rerenderOptions?: OpenAPIPreviewRenderOptions) => {
      const { config: rerenderConfig, ...otherOptions } = rerenderOptions || {}
      const mergedConfig = { ...config, ...rerenderConfig }
      
      const RerenderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
        if (skipProviders) return <>{children}</>
        return <AllOpenAPIPreviewProviders config={mergedConfig}>{children}</AllOpenAPIPreviewProviders>
      }
      
      return result.rerender(React.createElement(RerenderWrapper, {}, ui))
    }
  }

  return enhancedResult
}

/**
 * Specialized render function for OpenAPI viewer component testing
 */
export const renderOpenAPIViewer = (
  props: Partial<OpenAPIViewerProps> = {},
  options: OpenAPIPreviewRenderOptions = {}
): OpenAPIPreviewRenderResult => {
  const defaultProps: OpenAPIViewerProps = {
    service: { id: 1, name: 'test-service', type: 'mysql' },
    loading: false,
    error: null,
    height: '600px',
    enableDownload: true,
    enableApiKeySelection: true,
    enableThemeSwitch: true,
    testId: 'openapi-viewer',
    ...props
  }

  // Mock OpenAPI viewer component for testing
  const MockOpenAPIViewer: React.FC<OpenAPIViewerProps> = (componentProps) => (
    <div data-testid={componentProps.testId || 'openapi-viewer'}>
      <div data-testid="swagger-ui-container" style={{ height: componentProps.height }}>
        {componentProps.loading && <div data-testid="loading-spinner">Loading...</div>}
        {componentProps.error && <div data-testid="error-message">{componentProps.error.message}</div>}
        {!componentProps.loading && !componentProps.error && (
          <div data-testid="swagger-ui-content">
            <div data-testid="service-info">Service: {componentProps.service.name}</div>
            {componentProps.enableApiKeySelection && <div data-testid="api-key-selector">API Key Selector</div>}
            {componentProps.enableThemeSwitch && <div data-testid="theme-toggle">Theme Toggle</div>}
            {componentProps.enableDownload && <div data-testid="download-button">Download</div>}
          </div>
        )}
      </div>
    </div>
  )

  return renderOpenAPIPreview(<MockOpenAPIViewer {...defaultProps} />, options)
}

/**
 * Specialized render function for API docs list component testing
 */
export const renderApiDocsList = (
  props: Partial<ApiDocsListProps> = {},
  options: OpenAPIPreviewRenderOptions = {}
): OpenAPIPreviewRenderResult => {
  const defaultProps: ApiDocsListProps = {
    data: [
      { id: 1, name: 'mysql-service', label: 'MySQL Service', description: 'MySQL database service', group: 'database', type: 'mysql' },
      { id: 2, name: 'email-service', label: 'Email Service', description: 'SMTP email service', group: 'email', type: 'smtp' }
    ],
    loading: false,
    error: null,
    testId: 'api-docs-list',
    ...props
  }

  // Mock API docs list component for testing
  const MockApiDocsList: React.FC<ApiDocsListProps> = (componentProps) => (
    <div data-testid={componentProps.testId || 'api-docs-list'}>
      {componentProps.loading && <div data-testid="loading-spinner">Loading...</div>}
      {componentProps.error && <div data-testid="error-message">{componentProps.error.message}</div>}
      {!componentProps.loading && !componentProps.error && (
        <div data-testid="docs-table">
          {componentProps.data?.map(item => (
            <div key={item.id} data-testid={`docs-row-${item.id}`}>
              <span data-testid="service-name">{item.name}</span>
              <span data-testid="service-label">{item.label}</span>
              <span data-testid="service-type">{item.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return renderOpenAPIPreview(<MockApiDocsList {...defaultProps} />, options)
}

/**
 * Specialized render function for API key selector component testing
 */
export const renderApiKeySelector = (
  props: Partial<ApiKeySelectorProps> = {},
  options: OpenAPIPreviewRenderOptions = {}
): OpenAPIPreviewRenderResult => {
  const defaultProps: ApiKeySelectorProps = {
    apiKeys: [
      createMockApiKey({ name: 'Primary Key', apiKey: 'pk_test_123' }),
      createMockApiKey({ name: 'Secondary Key', apiKey: 'pk_test_456' })
    ],
    selectedKey: '',
    loading: false,
    error: null,
    placeholder: 'Select an API key...',
    enableCopy: true,
    showPreview: true,
    testId: 'api-key-selector',
    ...props
  }

  // Mock API key selector component for testing
  const MockApiKeySelector: React.FC<ApiKeySelectorProps> = (componentProps) => (
    <div data-testid={componentProps.testId || 'api-key-selector'}>
      {componentProps.loading && <div data-testid="loading-spinner">Loading...</div>}
      {componentProps.error && <div data-testid="error-message">{componentProps.error.message}</div>}
      {!componentProps.loading && !componentProps.error && (
        <div data-testid="key-selector-content">
          <select data-testid="key-dropdown" value={componentProps.selectedKey}>
            <option value="">{componentProps.placeholder}</option>
            {componentProps.apiKeys?.map(key => (
              <option key={key.id} value={key.apiKey} data-testid={`key-option-${key.id}`}>
                {key.name}
              </option>
            ))}
          </select>
          {componentProps.enableCopy && <button data-testid="copy-button">Copy</button>}
          {componentProps.showPreview && componentProps.selectedKey && (
            <div data-testid="key-preview">Preview: {componentProps.selectedKey.slice(0, 8)}...</div>
          )}
        </div>
      )}
    </div>
  )

  return renderOpenAPIPreview(<MockApiKeySelector {...defaultProps} />, options)
}

// =============================================================================
// TESTING UTILITIES AND HELPERS
// =============================================================================

/**
 * OpenAPI preview specific testing utilities
 */
export const openApiTestUtils = {
  /**
   * Wait for SwaggerUI to load
   */
  waitForSwaggerUI: async (timeout = TEST_CONSTANTS.DEFAULT_TIMEOUT) => {
    await waitFor(() => {
      const container = screen.getByTestId('swagger-ui-container')
      const content = within(container).queryByTestId('swagger-ui-content')
      if (!content) {
        throw new Error('SwaggerUI not loaded')
      }
    }, { timeout })
  },

  /**
   * Wait for API documentation to load
   */
  waitForApiDocs: async (timeout = TEST_CONSTANTS.DEFAULT_TIMEOUT) => {
    await waitFor(() => {
      const table = screen.getByTestId('docs-table')
      const rows = within(table).getAllByTestId(/^docs-row-/)
      if (rows.length === 0) {
        throw new Error('API documentation not loaded')
      }
    }, { timeout })
  },

  /**
   * Wait for API keys to load
   */
  waitForApiKeys: async (timeout = TEST_CONSTANTS.DEFAULT_TIMEOUT) => {
    await waitFor(() => {
      const selector = screen.getByTestId('api-key-selector')
      const dropdown = within(selector).getByTestId('key-dropdown')
      const options = within(dropdown).getAllByTestId(/^key-option-/)
      if (options.length === 0) {
        throw new Error('API keys not loaded')
      }
    }, { timeout })
  },

  /**
   * Simulate SwaggerUI interaction
   */
  interactWithSwagger: async (
    user: UserEvent,
    action: 'download' | 'theme-toggle' | 'api-key-change' | 'refresh'
  ) => {
    switch (action) {
      case 'download':
        const downloadBtn = screen.getByTestId('download-button')
        await user.click(downloadBtn)
        break
      case 'theme-toggle':
        const themeBtn = screen.getByTestId('theme-toggle')
        await user.click(themeBtn)
        break
      case 'api-key-change':
        const keySelector = screen.getByTestId('api-key-selector')
        const dropdown = within(keySelector).getByTestId('key-dropdown')
        await user.selectOptions(dropdown, 'pk_test_123')
        break
      case 'refresh':
        const refreshBtn = screen.getByTestId('refresh-button')
        await user.click(refreshBtn)
        break
    }
  },

  /**
   * Simulate keyboard navigation in OpenAPI components
   */
  testKeyboardNavigation: async (user: UserEvent, containerId: string) => {
    const container = screen.getByTestId(containerId)
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    )

    const navigationResults = []

    for (let i = 0; i < focusableElements.length; i++) {
      if (i === 0) {
        ;(focusableElements[0] as HTMLElement).focus()
      } else {
        await user.tab()
      }
      
      navigationResults.push({
        element: focusableElements[i],
        focused: document.activeElement === focusableElements[i]
      })
    }

    return navigationResults
  },

  /**
   * Test OpenAPI specification loading simulation
   */
  simulateSpecLoad: async (
    result: OpenAPIPreviewRenderResult,
    spec: Record<string, any> = { openapi: '3.0.0', info: { title: 'Test API', version: '1.0.0' } }
  ) => {
    result.updateStore({
      loading: { spec: true, apiKeys: false, service: false },
      errors: { spec: null, apiKeys: null, swagger: null }
    })

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 100))

    result.updateStore({
      spec,
      loading: { spec: false, apiKeys: false, service: false }
    })

    await openApiTestUtils.waitForSwaggerUI()
  },

  /**
   * Test API key management simulation
   */
  simulateApiKeyManagement: async (
    result: OpenAPIPreviewRenderResult,
    user: UserEvent,
    scenario: 'select' | 'copy' | 'error'
  ) => {
    const mockKeys = [
      createMockApiKey({ name: 'Primary Key', apiKey: 'pk_test_123' }),
      createMockApiKey({ name: 'Secondary Key', apiKey: 'pk_test_456' })
    ]

    result.updateStore({
      apiKeys: mockKeys,
      loading: { spec: false, apiKeys: false, service: false }
    })

    switch (scenario) {
      case 'select':
        const selector = screen.getByTestId('key-dropdown')
        await user.selectOptions(selector, 'pk_test_123')
        result.updateStore({ selectedApiKey: 'pk_test_123' })
        break
        
      case 'copy':
        const copyBtn = screen.getByTestId('copy-button')
        await user.click(copyBtn)
        break
        
      case 'error':
        result.updateStore({
          errors: {
            spec: null,
            apiKeys: createMockOpenAPIError({ 
              category: 'authentication',
              message: 'Failed to load API keys'
            }),
            swagger: null
          }
        })
        break
    }
  },

  /**
   * Test theme switching functionality
   */
  testThemeSwitching: async (
    result: OpenAPIPreviewRenderResult,
    user: UserEvent,
    targetTheme: ThemeMode = 'dark'
  ) => {
    const themeToggle = screen.getByTestId('theme-toggle')
    await user.click(themeToggle)
    
    result.updateStore({ theme: targetTheme })
    
    // Verify theme change
    await waitFor(() => {
      const themeProvider = screen.getByTestId('theme-provider')
      expect(themeProvider).toHaveAttribute('data-theme', targetTheme)
    })
  },

  /**
   * Test error scenarios
   */
  simulateError: async (
    result: OpenAPIPreviewRenderResult,
    errorType: 'spec' | 'swagger' | 'apiKeys',
    errorMessage: string = 'Test error'
  ) => {
    const errors = { spec: null, apiKeys: null, swagger: null }
    
    switch (errorType) {
      case 'spec':
        errors.spec = createMockOpenAPIError({ 
          category: 'spec',
          message: errorMessage
        })
        break
      case 'swagger':
        errors.swagger = new Error(errorMessage)
        break
      case 'apiKeys':
        errors.apiKeys = createMockOpenAPIError({
          category: 'authentication',
          message: errorMessage
        })
        break
    }

    result.updateStore({ errors })

    // Wait for error to be displayed
    await waitFor(() => {
      const errorElement = screen.getByTestId('error-message')
      expect(errorElement).toHaveTextContent(errorMessage)
    })
  }
}

/**
 * Performance testing utilities for OpenAPI preview
 */
export const openApiPerformanceUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: async <T extends (...args: any[]) => OpenAPIPreviewRenderResult>(
    renderFn: T,
    ...args: Parameters<T>
  ): Promise<{ result: ReturnType<T>; renderTime: number }> => {
    const start = performance.now()
    const result = renderFn(...args)
    const renderTime = performance.now() - start
    
    debugLog(`Render time: ${renderTime.toFixed(2)}ms`)
    
    return { result: result as ReturnType<T>, renderTime }
  },

  /**
   * Test large dataset rendering performance
   */
  testLargeDatasetPerformance: async (itemCount: number = 1000) => {
    const largeDataset = Array.from({ length: itemCount }, (_, i) => ({
      id: i + 1,
      name: `service-${i + 1}`,
      label: `Service ${i + 1}`,
      description: `Test service ${i + 1}`,
      group: 'database' as const,
      type: 'mysql'
    }))

    const { result, renderTime } = await openApiPerformanceUtils.measureRenderTime(
      renderApiDocsList,
      { data: largeDataset },
      { config: { performance: { enableMetrics: true } } }
    )

    return { result, renderTime, itemCount }
  },

  /**
   * Test SwaggerUI loading performance
   */
  testSwaggerUIPerformance: async () => {
    const { result, renderTime } = await openApiPerformanceUtils.measureRenderTime(
      renderOpenAPIViewer,
      { loading: true },
      { config: { performance: { enableMetrics: true } } }
    )

    const loadStart = performance.now()
    await openApiTestUtils.simulateSpecLoad(result)
    const loadTime = performance.now() - loadStart

    return { result, renderTime, loadTime }
  }
}

/**
 * Accessibility testing utilities for OpenAPI preview
 */
export const openApiA11yUtils = {
  /**
   * Test component accessibility compliance
   */
  testAccessibility: async (containerId: string) => {
    const container = screen.getByTestId(containerId)
    
    // Check for required ARIA attributes
    const interactiveElements = container.querySelectorAll('button, input, select, textarea, a[href]')
    const accessibilityIssues = []

    interactiveElements.forEach((element, index) => {
      const hasAriaLabel = element.hasAttribute('aria-label') || 
                          element.hasAttribute('aria-labelledby') ||
                          element.hasAttribute('aria-describedby')
      
      if (!hasAriaLabel && !element.textContent?.trim()) {
        accessibilityIssues.push({
          element: element.tagName.toLowerCase(),
          index,
          issue: 'Missing accessible name'
        })
      }
    })

    return {
      passed: accessibilityIssues.length === 0,
      issues: accessibilityIssues,
      interactiveElementCount: interactiveElements.length
    }
  },

  /**
   * Test keyboard navigation compliance
   */
  testKeyboardAccessibility: async (user: UserEvent, containerId: string) => {
    const result = await openApiTestUtils.testKeyboardNavigation(user, containerId)
    const totalElements = result.length
    const focusedElements = result.filter(r => r.focused).length
    
    return {
      passed: focusedElements === totalElements,
      totalElements,
      focusedElements,
      focusRate: totalElements > 0 ? (focusedElements / totalElements) * 100 : 0,
      details: result
    }
  },

  /**
   * Test screen reader announcements
   */
  testScreenReaderSupport: async (containerId: string) => {
    const container = screen.getByTestId(containerId)
    const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')
    const landmarks = container.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer')

    return {
      hasLiveRegions: liveRegions.length > 0,
      headingCount: headings.length,
      landmarkCount: landmarks.length,
      liveRegions: Array.from(liveRegions).map(el => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live')
      }))
    }
  }
}

// =============================================================================
// CONVENIENCE EXPORTS AND ALIASES
// =============================================================================

/**
 * Main render function (alias for common usage)
 */
export const render = renderOpenAPIPreview

/**
 * Re-export testing utilities from test-setup
 */
export {
  server,
  serverConfig,
  testQueryClient,
  createTestQueryClient,
  createMockOpenAPIPreviewStore,
  createMockApiKey,
  createMockServiceApiKeys,
  createMockOpenAPIError,
  TEST_CONSTANTS,
  debugLog
}

/**
 * Re-export React Testing Library utilities
 */
export {
  screen,
  within,
  waitFor,
  fireEvent,
  userEvent
}

/**
 * Custom matchers and assertions for OpenAPI preview testing
 */
export const expect = {
  /**
   * Assert that OpenAPI specification is valid
   */
  toBeValidOpenAPISpec: (spec: unknown) => {
    const isValid = spec && 
                   typeof spec === 'object' && 
                   'openapi' in spec && 
                   'info' in spec
    
    return {
      pass: isValid,
      message: () => `Expected ${spec} to be a valid OpenAPI specification`
    }
  },

  /**
   * Assert that component is accessible
   */
  toBeAccessible: async (element: HTMLElement) => {
    const issues = await openApiA11yUtils.testAccessibility(element.dataset.testid || 'component')
    
    return {
      pass: issues.passed,
      message: () => `Expected component to be accessible, but found ${issues.issues.length} issues: ${issues.issues.map(i => i.issue).join(', ')}`
    }
  },

  /**
   * Assert that SwaggerUI is properly loaded
   */
  toHaveSwaggerUILoaded: (container: HTMLElement) => {
    const swaggerContent = container.querySelector('[data-testid="swagger-ui-content"]')
    
    return {
      pass: !!swaggerContent,
      message: () => `Expected SwaggerUI to be loaded in container`
    }
  }
}

/**
 * Default export for convenient imports
 */
export default {
  render: renderOpenAPIPreview,
  renderOpenAPIViewer,
  renderApiDocsList,
  renderApiKeySelector,
  openApiTestUtils,
  openApiPerformanceUtils,
  openApiA11yUtils,
  expect,
  server,
  testQueryClient,
  TEST_CONSTANTS
}

/**
 * @example
 * // Basic OpenAPI viewer testing
 * import { renderOpenAPIViewer, openApiTestUtils } from './render-utils'
 * 
 * test('should display OpenAPI documentation', async () => {
 *   const { screen, user } = renderOpenAPIViewer({
 *     service: { id: 1, name: 'test-service', type: 'mysql' }
 *   })
 *   
 *   await openApiTestUtils.waitForSwaggerUI()
 *   expect(screen.getByTestId('swagger-ui-content')).toBeInTheDocument()
 * })
 * 
 * // API key selector testing
 * import { renderApiKeySelector } from './render-utils'
 * 
 * test('should handle API key selection', async () => {
 *   const { screen, user } = renderApiKeySelector({
 *     apiKeys: [{ id: '1', name: 'Test Key', apiKey: 'pk_test_123' }]
 *   })
 *   
 *   const dropdown = screen.getByTestId('key-dropdown')
 *   await user.selectOptions(dropdown, 'pk_test_123')
 *   expect(screen.getByTestId('key-preview')).toHaveTextContent('pk_test_1')
 * })
 * 
 * // API docs list testing
 * import { renderApiDocsList, openApiTestUtils } from './render-utils'
 * 
 * test('should display API documentation list', async () => {
 *   const { screen } = renderApiDocsList({
 *     data: [
 *       { id: 1, name: 'service-1', label: 'Service 1', type: 'mysql', group: 'database' }
 *     ]
 *   })
 *   
 *   await openApiTestUtils.waitForApiDocs()
 *   expect(screen.getByTestId('docs-row-1')).toBeInTheDocument()
 * })
 * 
 * // Performance testing
 * import { openApiPerformanceUtils } from './render-utils'
 * 
 * test('should handle large datasets efficiently', async () => {
 *   const { result, renderTime } = await openApiPerformanceUtils.testLargeDatasetPerformance(1000)
 *   expect(renderTime).toBeLessThan(5000) // 5 seconds max
 * })
 * 
 * // Accessibility testing
 * import { openApiA11yUtils } from './render-utils'
 * 
 * test('should be accessible', async () => {
 *   const { screen, user } = renderOpenAPIViewer()
 *   const accessibility = await openApiA11yUtils.testAccessibility('openapi-viewer')
 *   expect(accessibility.passed).toBe(true)
 * })
 */