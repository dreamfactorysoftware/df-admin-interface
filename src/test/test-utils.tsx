/**
 * Test Utilities for React/Next.js Component Testing
 * 
 * Comprehensive testing utilities providing configured renderers, custom matchers,
 * and helper functions for component testing with Vitest, Testing Library, React Hook Form,
 * and MSW integration. Replaces Angular TestBed with React-based testing patterns.
 * 
 * Features:
 * - Custom render function with providers (React Hook Form, Theme, Query Client)
 * - Accessibility testing utilities for WCAG 2.1 AA compliance
 * - Form testing helpers with validation mocking
 * - MSW integration for realistic API testing
 * - Custom Vitest matchers for component-specific assertions
 * - Screen reader testing utilities
 * - Keyboard navigation testing helpers
 * 
 * @fileoverview Testing utilities for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { renderHook, type RenderHookOptions } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm, type UseFormReturn, type FieldValues } from 'react-hook-form';
import { vi, type MockedFunction } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Custom render options with providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route for Next.js router */
  initialRoute?: string;
  /** Query client configuration */
  queryClient?: QueryClient;
  /** Form provider configuration */
  formProvider?: {
    defaultValues?: FieldValues;
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  };
  /** Theme provider configuration */
  theme?: 'light' | 'dark';
  /** Disable default providers */
  skipProviders?: boolean;
}

/**
 * Form testing utilities type
 */
interface FormTestUtils<T extends FieldValues = FieldValues> {
  formMethods: UseFormReturn<T>;
  user: UserEvent;
  rerender: (ui: ReactElement) => void;
  getFieldError: (fieldName: keyof T) => string | undefined;
  submitForm: () => Promise<void>;
  resetForm: () => void;
  setFieldValue: (fieldName: keyof T, value: any) => void;
  triggerValidation: (fieldName?: keyof T) => Promise<boolean>;
}

/**
 * Accessibility testing configuration
 */
interface A11yTestConfig {
  /** Skip specific accessibility rules */
  skipRules?: string[];
  /** Include only specific rules */
  includeRules?: string[];
  /** Custom accessibility tags */
  tags?: string[];
  /** Disable color contrast checking */
  disableColorContrast?: boolean;
}

/**
 * Keyboard testing utilities
 */
interface KeyboardTestUtils {
  /** Simulate Tab navigation */
  tab: (options?: { shift?: boolean }) => Promise<void>;
  /** Simulate Enter key press */
  enter: () => Promise<void>;
  /** Simulate Escape key press */
  escape: () => Promise<void>;
  /** Simulate Arrow key navigation */
  arrowDown: () => Promise<void>;
  arrowUp: () => Promise<void>;
  arrowLeft: () => Promise<void>;
  arrowRight: () => Promise<void>;
  /** Simulate Space key press */
  space: () => Promise<void>;
  /** Get currently focused element */
  getFocused: () => Element | null;
  /** Check if element is focused */
  isFocused: (element: Element) => boolean;
}

// ============================================================================
// PROVIDER WRAPPERS
// ============================================================================

/**
 * Query client wrapper for React Query testing
 */
const createTestQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });
};

/**
 * Form provider wrapper component
 */
interface FormProviderWrapperProps {
  children: ReactNode;
  defaultValues?: FieldValues;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

const FormProviderWrapper: React.FC<FormProviderWrapperProps> = ({
  children,
  defaultValues = {},
  mode = 'onChange',
}) => {
  const methods = useForm({
    defaultValues,
    mode,
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
};

/**
 * Theme provider wrapper component
 */
interface ThemeProviderWrapperProps {
  children: ReactNode;
  theme?: 'light' | 'dark';
}

const ThemeProviderWrapper: React.FC<ThemeProviderWrapperProps> = ({
  children,
  theme = 'light',
}) => {
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <div data-theme={theme}>{children}</div>;
};

/**
 * All providers wrapper for testing
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  formProvider?: FormProviderWrapperProps;
  theme?: 'light' | 'dark';
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  queryClient,
  formProvider,
  theme = 'light',
}) => {
  const testQueryClient = queryClient || createTestQueryClient();

  let wrappedChildren = children;

  // Wrap with theme provider
  wrappedChildren = (
    <ThemeProviderWrapper theme={theme}>
      {wrappedChildren}
    </ThemeProviderWrapper>
  );

  // Wrap with form provider if configured
  if (formProvider) {
    wrappedChildren = (
      <FormProviderWrapper {...formProvider}>
        {wrappedChildren}
      </FormProviderWrapper>
    );
  }

  // Wrap with query client provider
  wrappedChildren = (
    <QueryClientProvider client={testQueryClient}>
      {wrappedChildren}
    </QueryClientProvider>
  );

  return <>{wrappedChildren}</>;
};

// ============================================================================
// CUSTOM RENDER FUNCTIONS
// ============================================================================

/**
 * Custom render function with providers and utilities
 */
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: UserEvent } => {
  const {
    queryClient,
    formProvider,
    theme = 'light',
    skipProviders = false,
    ...renderOptions
  } = options;

  const user = userEvent.setup();

  const Wrapper = skipProviders
    ? undefined
    : ({ children }: { children: ReactNode }) => (
        <AllProviders
          queryClient={queryClient}
          formProvider={formProvider}
          theme={theme}
        >
          {children}
        </AllProviders>
      );

  const result = render(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });

  return {
    ...result,
    user,
  };
};

/**
 * Render with form provider specifically
 */
export const renderWithForm = <T extends FieldValues = FieldValues>(
  ui: ReactElement,
  options: {
    defaultValues?: T;
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  } & Omit<CustomRenderOptions, 'formProvider'> = {}
): RenderResult & FormTestUtils<T> => {
  const { defaultValues, mode, ...renderOptions } = options;
  let formMethods: UseFormReturn<T>;

  const FormWrapper = ({ children }: { children: ReactNode }) => {
    formMethods = useForm<T>({
      defaultValues,
      mode,
    });

    return <FormProvider {...formMethods}>{children}</FormProvider>;
  };

  const user = userEvent.setup();
  const result = render(ui, {
    wrapper: FormWrapper,
    ...renderOptions,
  });

  return {
    ...result,
    user,
    formMethods: formMethods!,
    getFieldError: (fieldName: keyof T) => {
      const error = formMethods.formState.errors[fieldName];
      return error?.message as string | undefined;
    },
    submitForm: async () => {
      await formMethods.handleSubmit(() => {})();
    },
    resetForm: () => {
      formMethods.reset();
    },
    setFieldValue: (fieldName: keyof T, value: any) => {
      formMethods.setValue(fieldName as any, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    triggerValidation: async (fieldName?: keyof T) => {
      if (fieldName) {
        return await formMethods.trigger(fieldName as any);
      }
      return await formMethods.trigger();
    },
  };
};

/**
 * Custom render hook with providers
 */
export const customRenderHook = <TResult, TProps>(
  hook: (props: TProps) => TResult,
  options: {
    initialProps?: TProps;
    queryClient?: QueryClient;
    formProvider?: FormProviderWrapperProps;
    theme?: 'light' | 'dark';
  } & Omit<RenderHookOptions<TProps>, 'wrapper'> = {}
) => {
  const { queryClient, formProvider, theme, ...hookOptions } = options;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders
      queryClient={queryClient}
      formProvider={formProvider}
      theme={theme}
    >
      {children}
    </AllProviders>
  );

  return renderHook(hook, {
    wrapper,
    ...hookOptions,
  });
};

// ============================================================================
// ACCESSIBILITY TESTING UTILITIES
// ============================================================================

/**
 * Test component for accessibility violations
 */
export const testA11y = async (
  container: Element | DocumentFragment,
  config: A11yTestConfig = {}
): Promise<void> => {
  const {
    skipRules = [],
    includeRules,
    tags = ['wcag2a', 'wcag2aa'],
    disableColorContrast = false,
  } = config;

  const rules = disableColorContrast
    ? { ...skipRules, 'color-contrast': { enabled: false } }
    : skipRules;

  const axeConfig = {
    rules: includeRules
      ? Object.fromEntries(includeRules.map(rule => [rule, { enabled: true }]))
      : rules,
    tags,
  };

  const results = await axe(container, axeConfig);
  expect(results).toHaveNoViolations();
};

/**
 * Check ARIA attributes on element
 */
export const checkAriaAttributes = (
  element: Element,
  expectedAttributes: Record<string, string | boolean | null>
): void => {
  Object.entries(expectedAttributes).forEach(([attr, expectedValue]) => {
    const actualValue = element.getAttribute(attr);
    
    if (expectedValue === null) {
      expect(actualValue).toBeNull();
    } else if (typeof expectedValue === 'boolean') {
      expect(actualValue).toBe(expectedValue.toString());
    } else {
      expect(actualValue).toBe(expectedValue);
    }
  });
};

/**
 * Test screen reader announcements
 */
export const getAriaLiveRegions = (container: Element): Element[] => {
  return Array.from(
    container.querySelectorAll('[aria-live], [aria-atomic], .sr-only')
  );
};

// ============================================================================
// KEYBOARD TESTING UTILITIES
// ============================================================================

/**
 * Create keyboard testing utilities
 */
export const createKeyboardUtils = (user: UserEvent): KeyboardTestUtils => ({
  tab: async (options = {}) => {
    await user.keyboard(options.shift ? '{Shift>}{Tab}{/Shift}' : '{Tab}');
  },
  enter: async () => {
    await user.keyboard('{Enter}');
  },
  escape: async () => {
    await user.keyboard('{Escape}');
  },
  arrowDown: async () => {
    await user.keyboard('{ArrowDown}');
  },
  arrowUp: async () => {
    await user.keyboard('{ArrowUp}');
  },
  arrowLeft: async () => {
    await user.keyboard('{ArrowLeft}');
  },
  arrowRight: async () => {
    await user.keyboard('{ArrowRight}');
  },
  space: async () => {
    await user.keyboard(' ');
  },
  getFocused: () => document.activeElement,
  isFocused: (element: Element) => document.activeElement === element,
});

// ============================================================================
// FORM TESTING UTILITIES
// ============================================================================

/**
 * Mock form validation functions
 */
export const createMockValidation = () => ({
  required: vi.fn((value: any) => !!value || 'This field is required'),
  minLength: (min: number) =>
    vi.fn((value: string) => 
      value.length >= min || `Minimum length is ${min} characters`
    ),
  maxLength: (max: number) =>
    vi.fn((value: string) => 
      value.length <= max || `Maximum length is ${max} characters`
    ),
  pattern: (regex: RegExp, message: string) =>
    vi.fn((value: string) => regex.test(value) || message),
  custom: (validator: (value: any) => boolean | string) => vi.fn(validator),
});

/**
 * Wait for form validation to complete
 */
export const waitForValidation = async (delay = 100): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, delay));
};

// ============================================================================
// MOCK DATA UTILITIES
// ============================================================================

/**
 * Create mock select options
 */
export const createMockOptions = (count: number = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    value: `option-${index + 1}`,
    label: `Option ${index + 1}`,
    description: `Description for option ${index + 1}`,
    disabled: index === 2, // Make third option disabled
  }));
};

/**
 * Create mock grouped options
 */
export const createMockGroupedOptions = () => [
  {
    id: 'group-1',
    label: 'Group 1',
    options: [
      { value: 'g1-option-1', label: 'Group 1 Option 1' },
      { value: 'g1-option-2', label: 'Group 1 Option 2' },
    ],
  },
  {
    id: 'group-2',
    label: 'Group 2',
    options: [
      { value: 'g2-option-1', label: 'Group 2 Option 1' },
      { value: 'g2-option-2', label: 'Group 2 Option 2' },
    ],
  },
];

/**
 * Create mock HTTP verb options for verb picker testing
 */
export const createMockVerbOptions = () => [
  { value: 'GET', label: 'GET', description: 'Retrieve data' },
  { value: 'POST', label: 'POST', description: 'Create new data' },
  { value: 'PUT', label: 'PUT', description: 'Update existing data' },
  { value: 'PATCH', label: 'PATCH', description: 'Partially update data' },
  { value: 'DELETE', label: 'DELETE', description: 'Remove data' },
];

// ============================================================================
// ASSERTION UTILITIES
// ============================================================================

/**
 * Custom matchers for select components
 */
export const selectMatchers = {
  toHaveSelectedOption: (container: Element, optionLabel: string) => {
    const selectedElement = container.querySelector('[aria-selected="true"]');
    return selectedElement?.textContent?.includes(optionLabel) || false;
  },
  toHaveOptions: (container: Element, expectedCount: number) => {
    const options = container.querySelectorAll('[role="option"]');
    return options.length === expectedCount;
  },
  toBeAccessible: async (element: Element) => {
    const results = await axe(element);
    return results.violations.length === 0;
  },
};

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * Measure component render performance
 */
export const measureRenderTime = async (
  renderFn: () => RenderResult
): Promise<{ renderTime: number; result: RenderResult }> => {
  const start = performance.now();
  const result = renderFn();
  await new Promise(resolve => setTimeout(resolve, 0)); // Wait for render
  const end = performance.now();
  
  return {
    renderTime: end - start,
    result,
  };
};

/**
 * Test large dataset performance
 */
export const createLargeDataset = (size: number = 1000) => {
  return Array.from({ length: size }, (_, index) => ({
    value: `item-${index}`,
    label: `Item ${index}`,
    description: `Description for item ${index}`,
    searchKeywords: [`keyword-${index}`, `tag-${index % 10}`],
  }));
};

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export everything from testing library for convenience
export * from '@testing-library/react';
export { userEvent };
export { customRender as render };

// Export custom utilities
export {
  customRender,
  renderWithForm,
  customRenderHook,
  testA11y,
  checkAriaAttributes,
  getAriaLiveRegions,
  createKeyboardUtils,
  createMockValidation,
  waitForValidation,
  createMockOptions,
  createMockGroupedOptions,
  createMockVerbOptions,
  selectMatchers,
  measureRenderTime,
  createLargeDataset,
};

// Export types
export type {
  CustomRenderOptions,
  FormTestUtils,
  A11yTestConfig,
  KeyboardTestUtils,
};