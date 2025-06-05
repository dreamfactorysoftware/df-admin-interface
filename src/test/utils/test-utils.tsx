import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import userEvent from '@testing-library/user-event';
import { FormProvider, UseFormReturn, FieldValues } from 'react-hook-form';

// Mock Next.js router for testing
interface MockRouter {
  push: jest.Mock;
  replace: jest.Mock;
  prefetch: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  refresh: jest.Mock;
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
 * Theme provider context for Tailwind CSS testing
 */
interface ThemeProviderProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  theme = 'light' 
}) => {
  return (
    <div className={theme} data-testid="theme-provider">
      {children}
    </div>
  );
};

/**
 * Auth provider context for authentication testing
 */
interface AuthProviderProps {
  children: ReactNode;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
    sessionToken?: string;
  } | null;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  user = null 
}) => {
  const authContext = React.createContext({
    user,
    isAuthenticated: !!user,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
  });

  return (
    <authContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login: jest.fn(),
      logout: jest.fn(),
      loading: false,
    }}>
      {children}
    </authContext.Provider>
  );
};

/**
 * Configuration options for test providers
 */
interface TestProvidersOptions {
  router?: Partial<MockRouter>;
  pathname?: string;
  searchParams?: URLSearchParams;
  queryClient?: QueryClient;
  theme?: 'light' | 'dark';
  user?: AuthProviderProps['user'];
  initialEntries?: string[];
}

/**
 * Wrapper component that provides all necessary testing contexts
 */
const AllTheProviders: React.FC<{
  children: ReactNode;
  options?: TestProvidersOptions;
}> = ({ children, options = {} }) => {
  const {
    router = createMockRouter(),
    pathname = '/',
    searchParams = new URLSearchParams(),
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    theme = 'light',
    user = null,
  } = options;

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouterContext.Provider value={router as any}>
        <PathnameContext.Provider value={pathname}>
          <SearchParamsContext.Provider value={searchParams}>
            <ThemeProvider theme={theme}>
              <AuthProvider user={user}>
                {children}
              </AuthProvider>
            </ThemeProvider>
          </SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    </QueryClientProvider>
  );
};

/**
 * Enhanced render function with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  providerOptions?: TestProvidersOptions;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { providerOptions, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllTheProviders options={providerOptions}>
      {children}
    </AllTheProviders>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
};

/**
 * Render function specifically for React Hook Form components
 */
interface FormRenderOptions extends CustomRenderOptions {
  formMethods?: UseFormReturn<any>;
  defaultValues?: FieldValues;
}

export const renderWithForm = <T extends FieldValues>(
  ui: ReactElement,
  options: FormRenderOptions = {}
) => {
  const { formMethods, providerOptions, ...renderOptions } = options;

  const FormWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AllTheProviders options={providerOptions}>
      {formMethods ? (
        <FormProvider {...formMethods}>
          {children}
        </FormProvider>
      ) : (
        children
      )}
    </AllTheProviders>
  );

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: FormWrapper, ...renderOptions }),
  };
};

/**
 * Render function for testing React Query mutations and queries
 */
interface QueryRenderOptions extends CustomRenderOptions {
  queryClient?: QueryClient;
  initialData?: Record<string, any>;
}

export const renderWithQuery = (
  ui: ReactElement,
  options: QueryRenderOptions = {}
) => {
  const { queryClient: customQueryClient, initialData, ...renderOptions } = options;

  const queryClient = customQueryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Set initial data if provided
  if (initialData) {
    Object.entries(initialData).forEach(([queryKey, data]) => {
      queryClient.setQueryData([queryKey], data);
    });
  }

  return renderWithProviders(ui, {
    ...renderOptions,
    providerOptions: {
      ...renderOptions.providerOptions,
      queryClient,
    },
  });
};

/**
 * WCAG 2.1 AA compliance testing utilities
 */
export const accessibilityUtils = {
  /**
   * Check if element has proper ARIA labels
   */
  hasAriaLabel: (element: HTMLElement): boolean => {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.getAttribute('aria-describedby')
    );
  },

  /**
   * Check if interactive element is keyboard accessible
   */
  isKeyboardAccessible: (element: HTMLElement): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    const isInteractive = ['button', 'input', 'select', 'textarea', 'a'].includes(
      element.tagName.toLowerCase()
    );
    const hasRole = ['button', 'link', 'menuitem', 'option'].includes(
      element.getAttribute('role') || ''
    );

    return isInteractive || hasRole || (tabIndex !== null && tabIndex !== '-1');
  },

  /**
   * Check color contrast requirements (basic implementation)
   */
  hasAdequateContrast: (element: HTMLElement): boolean => {
    const styles = window.getComputedStyle(element);
    const backgroundColor = styles.backgroundColor;
    const color = styles.color;
    
    // This is a simplified check - in practice, you'd use a proper contrast calculation
    return !!(backgroundColor && color && backgroundColor !== 'transparent');
  },

  /**
   * Find all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="link"]',
      '[role="menuitem"]',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  },

  /**
   * Test keyboard navigation through focusable elements
   */
  testKeyboardNavigation: async (container: HTMLElement, user: ReturnType<typeof userEvent.setup>) => {
    const focusableElements = accessibilityUtils.getFocusableElements(container);
    
    if (focusableElements.length === 0) {
      return { success: true, focusedElements: [] };
    }

    const focusedElements: HTMLElement[] = [];

    // Focus first element
    focusableElements[0].focus();
    focusedElements.push(document.activeElement as HTMLElement);

    // Tab through all elements
    for (let i = 1; i < focusableElements.length; i++) {
      await user.keyboard('{Tab}');
      focusedElements.push(document.activeElement as HTMLElement);
    }

    return {
      success: focusedElements.length === focusableElements.length,
      focusedElements,
      expectedElements: focusableElements,
    };
  },
};

/**
 * Headless UI component testing utilities
 */
export const headlessUIUtils = {
  /**
   * Test disclosure (dropdown/accordion) behavior
   */
  testDisclosure: async (
    triggerElement: HTMLElement,
    panelTestId: string,
    user: ReturnType<typeof userEvent.setup>
  ) => {
    const panel = screen.queryByTestId(panelTestId);
    const initialState = panel ? !panel.hasAttribute('hidden') : false;

    // Test click to toggle
    await user.click(triggerElement);
    const afterClick = screen.queryByTestId(panelTestId);
    const clickState = afterClick ? !afterClick.hasAttribute('hidden') : false;

    // Test Enter key to toggle
    triggerElement.focus();
    await user.keyboard('{Enter}');
    const afterEnter = screen.queryByTestId(panelTestId);
    const enterState = afterEnter ? !afterEnter.hasAttribute('hidden') : false;

    // Test Escape key to close (if open)
    if (enterState) {
      await user.keyboard('{Escape}');
      const afterEscape = screen.queryByTestId(panelTestId);
      const escapeState = afterEscape ? !afterEscape.hasAttribute('hidden') : false;

      return {
        initialState,
        clickState,
        enterState,
        escapeState,
        canToggle: clickState !== initialState,
        canToggleWithKeyboard: enterState !== clickState,
        canCloseWithEscape: !escapeState,
      };
    }

    return {
      initialState,
      clickState,
      enterState,
      escapeState: enterState,
      canToggle: clickState !== initialState,
      canToggleWithKeyboard: enterState !== clickState,
      canCloseWithEscape: true,
    };
  },

  /**
   * Test listbox (select) behavior
   */
  testListbox: async (
    triggerElement: HTMLElement,
    optionsTestId: string,
    user: ReturnType<typeof userEvent.setup>
  ) => {
    // Open listbox
    await user.click(triggerElement);
    
    const optionsContainer = screen.getByTestId(optionsTestId);
    const options = within(optionsContainer).getAllByRole('option');

    if (options.length === 0) {
      return { success: false, error: 'No options found' };
    }

    // Test arrow navigation
    triggerElement.focus();
    await user.keyboard('{ArrowDown}');
    
    const firstOptionFocused = document.activeElement === options[0];

    // Test selection with Enter
    await user.keyboard('{Enter}');
    
    return {
      success: true,
      optionsCount: options.length,
      canNavigateWithArrows: firstOptionFocused,
      options: options.map(option => ({
        text: option.textContent,
        value: option.getAttribute('data-value'),
        selected: option.getAttribute('aria-selected') === 'true',
      })),
    };
  },

  /**
   * Test dialog behavior
   */
  testDialog: async (
    openTrigger: HTMLElement,
    dialogTestId: string,
    user: ReturnType<typeof userEvent.setup>
  ) => {
    // Open dialog
    await user.click(openTrigger);
    
    const dialog = screen.getByTestId(dialogTestId);
    const isOpen = dialog.getAttribute('data-state') === 'open' || 
                   !dialog.hasAttribute('hidden');

    if (!isOpen) {
      return { success: false, error: 'Dialog did not open' };
    }

    // Test focus trap
    const focusableElements = accessibilityUtils.getFocusableElements(dialog);
    const initialFocus = document.activeElement;
    const isInitialFocusInDialog = dialog.contains(initialFocus as Node);

    // Test escape to close
    await user.keyboard('{Escape}');
    const isClosedAfterEscape = dialog.hasAttribute('hidden') || 
                               dialog.getAttribute('data-state') === 'closed';

    return {
      success: true,
      opensCorrectly: isOpen,
      trapsFocus: isInitialFocusInDialog,
      closesWithEscape: isClosedAfterEscape,
      focusableElementsCount: focusableElements.length,
    };
  },
};

/**
 * Next.js middleware testing utilities
 */
export const middlewareUtils = {
  /**
   * Create mock Next.js request
   */
  createMockRequest: (
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      cookies?: Record<string, string>;
      body?: any;
    } = {}
  ) => {
    const { method = 'GET', headers = {}, cookies = {}, body } = options;
    
    return {
      url,
      method,
      headers: new Headers(headers),
      cookies: {
        get: (name: string) => cookies[name],
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        has: (name: string) => name in cookies,
        set: jest.fn(),
        delete: jest.fn(),
      },
      nextUrl: new URL(url),
      body: body ? JSON.stringify(body) : undefined,
      json: () => Promise.resolve(body),
    };
  },

  /**
   * Create mock Next.js response
   */
  createMockResponse: () => {
    return {
      status: 200,
      headers: new Headers(),
      redirect: jest.fn(),
      rewrite: jest.fn(),
      next: jest.fn(),
      json: jest.fn(),
    };
  },
};

/**
 * Server component testing utilities
 */
export const serverComponentUtils = {
  /**
   * Mock server-side data fetching
   */
  mockServerData: <T>(data: T) => {
    return {
      data,
      error: null,
      loading: false,
    };
  },

  /**
   * Mock server action
   */
  mockServerAction: <T extends any[], R>(
    implementation?: (...args: T) => Promise<R>
  ) => {
    return jest.fn(implementation || (async () => ({ success: true } as R)));
  },

  /**
   * Test server component with data
   */
  renderServerComponent: <T>(
    Component: React.ComponentType<T>,
    props: T,
    serverData?: any
  ) => {
    // Mock the server data context if provided
    if (serverData) {
      const ServerDataContext = React.createContext(serverData);
      const ComponentWithData = (componentProps: T) => (
        <ServerDataContext.Provider value={serverData}>
          <Component {...componentProps} />
        </ServerDataContext.Provider>
      );
      
      return renderWithProviders(<ComponentWithData {...props} />);
    }
    
    return renderWithProviders(<Component {...props} />);
  },
};

/**
 * Common test utilities and helpers
 */
export const testUtils = {
  /**
   * Wait for element to appear in DOM
   */
  waitForElement: async (selector: string, timeout = 5000) => {
    return screen.findByTestId(selector, {}, { timeout });
  },

  /**
   * Wait for element to disappear from DOM
   */
  waitForElementToBeRemoved: async (element: HTMLElement, timeout = 5000) => {
    return new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        if (!document.body.contains(element)) {
          observer.disconnect();
          resolve();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, timeout);
    });
  },

  /**
   * Test component error boundary
   */
  testErrorBoundary: (
    ErrorBoundary: React.ComponentType<{ children: ReactNode }>,
    ThrowingComponent: React.ComponentType
  ) => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const result = renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    consoleSpy.mockRestore();
    return result;
  },

  /**
   * Mock window methods for testing
   */
  mockWindow: (properties: Partial<Window & typeof globalThis> = {}) => {
    const originalWindow = global.window;
    
    Object.defineProperty(global, 'window', {
      value: {
        ...originalWindow,
        ...properties,
      },
      writable: true,
    });

    return () => {
      global.window = originalWindow;
    };
  },

  /**
   * Mock local storage for testing
   */
  mockLocalStorage: () => {
    const storage: Record<string, string> = {};
    
    const mockStorage = {
      getItem: jest.fn((key: string) => storage[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete storage[key];
      }),
      clear: jest.fn(() => {
        Object.keys(storage).forEach(key => delete storage[key]);
      }),
      length: 0,
      key: jest.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });

    return mockStorage;
  },
};

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';

// Re-export userEvent
export { userEvent };

// Override the default render method
export { renderWithProviders as render };