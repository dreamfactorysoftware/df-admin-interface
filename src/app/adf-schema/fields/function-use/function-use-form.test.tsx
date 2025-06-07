/**
 * Function Use Form Component Test Suite
 * 
 * Comprehensive Vitest test suite for the function usage form component using React Testing Library
 * and Mock Service Worker for API mocking. Tests dynamic function entry management, validation 
 * workflows, accordion/table display modes, and integration with parent form components.
 * 
 * Key Testing Areas:
 * - Dynamic function entry addition and removal
 * - React Hook Form validation with Zod schemas
 * - Accordion and table display mode switching
 * - MSW integration for function dropdown options
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Integration with parent form components
 * - React Query caching patterns for function options
 * 
 * Performance Requirements:
 * - 10x faster test execution with Vitest 2.1.0
 * - Real-time validation under 100ms
 * - Component rendering optimizations
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { 
  renderWithProviders, 
  renderWithForm, 
  accessibilityUtils, 
  headlessUIUtils,
  testUtils
} from '@/test/utils/test-utils';
import { FunctionUseForm } from './function-use-form';
import { functionUseSchema, type FunctionUseFormData } from './function-use.types';

// ============================================================================
// MOCK DATA AND FIXTURES
// ============================================================================

/**
 * Mock function usage dropdown options matching DreamFactory API responses
 */
const mockFunctionUsesDropdownOptions = [
  {
    name: 'SELECT (GET)',
    value: 'SELECT',
    description: 'Function for SELECT operations',
  },
  {
    name: 'FILTER (GET)',
    value: 'FILTER',
    description: 'Function for FILTER operations',
  },
  {
    name: 'INSERT (POST)',
    value: 'INSERT',
    description: 'Function for INSERT operations',
  },
  {
    name: 'UPDATE (PATCH)',
    value: 'UPDATE',
    description: 'Function for UPDATE operations',
  },
];

/**
 * Mock initial form data for testing
 */
const mockInitialFormData: FunctionUseFormData = {
  dbFunction: [
    {
      use: ['SELECT', 'FILTER'],
      function: 'my_custom_function',
    },
    {
      use: ['INSERT'],
      function: 'insert_validation_function',
    },
  ],
};

/**
 * Empty form data for testing new entries
 */
const emptyFormData: FunctionUseFormData = {
  dbFunction: [],
};

// ============================================================================
// MSW HANDLERS FOR API MOCKING
// ============================================================================

/**
 * MSW handlers for function usage API endpoints
 */
const functionUsageHandlers = [
  // Mock function usage options endpoint
  http.get('/api/v2/system/database/function-options', () => {
    return HttpResponse.json({
      resource: mockFunctionUsesDropdownOptions,
      success: true,
    });
  }),

  // Mock function validation endpoint
  http.post('/api/v2/system/database/validate-function', async ({ request }) => {
    const body = await request.json() as { functionName: string };
    const { functionName } = body;
    
    // Simulate validation logic
    if (functionName === 'invalid_function') {
      return HttpResponse.json({
        error: 'Function does not exist in database',
        success: false,
      }, { status: 400 });
    }
    
    return HttpResponse.json({
      valid: true,
      signature: `${functionName}(param1 varchar, param2 int)`,
      returnType: 'varchar',
      success: true,
    });
  }),

  // Mock error scenario for network failures
  http.get('/api/v2/system/database/function-options-error', () => {
    return HttpResponse.json({
      error: 'Database connection failed',
      success: false,
    }, { status: 500 });
  }),
];

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Custom render function for Function Use Form with form providers
 */
const renderFunctionUseForm = (
  props: Partial<React.ComponentProps<typeof FunctionUseForm>> = {},
  formOptions: {
    defaultValues?: FunctionUseFormData;
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
  } = {}
) => {
  const { defaultValues = emptyFormData, mode = 'onChange' } = formOptions;
  
  const TestWrapper = () => {
    const methods = useForm<FunctionUseFormData>({
      resolver: zodResolver(functionUseSchema),
      defaultValues,
      mode,
    });

    return (
      <form 
        onSubmit={methods.handleSubmit((data) => console.log('Form submitted:', data))}
        data-testid="function-use-test-form"
      >
        <FunctionUseForm
          showAccordion={true}
          name="dbFunction"
          {...props}
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    );
  };

  return renderWithForm(<TestWrapper />, {
    providerOptions: {
      queryClient: new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      }),
    },
  });
};

/**
 * Helper function to add a new function entry
 */
const addFunctionEntry = async (user: ReturnType<typeof userEvent.setup>) => {
  const addButton = screen.getByRole('button', { name: /add.*function/i });
  await user.click(addButton);
};

/**
 * Helper function to remove a function entry
 */
const removeFunctionEntry = async (
  user: ReturnType<typeof userEvent.setup>, 
  index: number
) => {
  const removeButtons = screen.getAllByRole('button', { name: /delete.*row/i });
  await user.click(removeButtons[index]);
};

/**
 * Helper function to select function uses
 */
const selectFunctionUses = async (
  user: ReturnType<typeof userEvent.setup>,
  rowIndex: number,
  uses: string[]
) => {
  const table = screen.getByRole('table');
  const rows = within(table).getAllByRole('row');
  const targetRow = rows[rowIndex + 1]; // +1 to skip header row
  
  const useSelect = within(targetRow).getByRole('combobox', { name: /use/i });
  await user.click(useSelect);
  
  for (const use of uses) {
    const option = await screen.findByRole('option', { name: new RegExp(use, 'i') });
    await user.click(option);
  }
  
  // Click outside to close dropdown
  await user.click(document.body);
};

/**
 * Helper function to enter function name
 */
const enterFunctionName = async (
  user: ReturnType<typeof userEvent.setup>,
  rowIndex: number,
  functionName: string
) => {
  const table = screen.getByRole('table');
  const rows = within(table).getAllByRole('row');
  const targetRow = rows[rowIndex + 1]; // +1 to skip header row
  
  const functionInput = within(targetRow).getByRole('textbox', { name: /function/i });
  await user.clear(functionInput);
  await user.type(functionInput, functionName);
};

// ============================================================================
// TEST SUITE SETUP
// ============================================================================

describe('FunctionUseForm Component', () => {
  beforeAll(() => {
    // Start MSW server with function usage handlers
    server.use(...functionUsageHandlers);
  });

  beforeEach(() => {
    // Reset any custom handlers and clear all mocks
    server.resetHandlers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllTimers();
  });

  // ============================================================================
  // BASIC RENDERING AND STRUCTURE TESTS
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render function use form with accordion by default', () => {
      renderFunctionUseForm();
      
      expect(screen.getByText(/database function/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
    });

    it('should render function use form without accordion when showAccordion is false', () => {
      renderFunctionUseForm({ showAccordion: false });
      
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    });

    it('should render table with correct columns when accordion is expanded', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      expect(screen.getByRole('columnheader', { name: /use/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /function/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add.*function/i })).toBeInTheDocument();
    });

    it('should display "no functions" message when form array is empty', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      expect(screen.getByText(/no database functions/i)).toBeInTheDocument();
    });

    it('should render existing function entries from form data', () => {
      renderFunctionUseForm({}, { defaultValues: mockInitialFormData });
      
      expect(screen.getByDisplayValue('my_custom_function')).toBeInTheDocument();
      expect(screen.getByDisplayValue('insert_validation_function')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DYNAMIC FUNCTION ENTRY MANAGEMENT TESTS
  // ============================================================================

  describe('Dynamic Function Entry Management', () => {
    it('should add new function entry when add button is clicked', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      await addFunctionEntry(user);
      
      // Check that new row is added
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2); // header + 1 data row
      
      // Check that form fields are present
      expect(screen.getByRole('combobox', { name: /use/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /function/i })).toBeInTheDocument();
    });

    it('should add multiple function entries', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      // Add multiple entries
      await addFunctionEntry(user);
      await addFunctionEntry(user);
      await addFunctionEntry(user);
      
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(4); // header + 3 data rows
    });

    it('should remove function entry when delete button is clicked', async () => {
      const { user } = renderFunctionUseForm({}, { defaultValues: mockInitialFormData });
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      // Initial state should have 2 entries
      let table = screen.getByRole('table');
      let rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(3); // header + 2 data rows
      
      // Remove first entry
      await removeFunctionEntry(user, 0);
      
      // Should have 1 entry remaining
      table = screen.getByRole('table');
      rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(2); // header + 1 data row
      
      // First entry should be removed, second entry should remain
      expect(screen.queryByDisplayValue('my_custom_function')).not.toBeInTheDocument();
      expect(screen.getByDisplayValue('insert_validation_function')).toBeInTheDocument();
    });

    it('should remove all entries and show empty message', async () => {
      const { user } = renderFunctionUseForm({}, { defaultValues: mockInitialFormData });
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      // Remove all entries
      await removeFunctionEntry(user, 0);
      await removeFunctionEntry(user, 0); // Index 0 again because array shrinks
      
      // Should show empty message
      expect(screen.getByText(/no database functions/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    it('should validate that use field is required', async () => {
      const { user } = renderFunctionUseForm({}, { mode: 'onChange' });
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Enter function name but leave use field empty
      await enterFunctionName(user, 0, 'test_function');
      
      // Submit form to trigger validation
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/use is required/i)).toBeInTheDocument();
      });
    });

    it('should allow function field to be optional', async () => {
      const { user } = renderFunctionUseForm({}, { mode: 'onChange' });
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Select use but leave function empty
      await selectFunctionUses(user, 0, ['SELECT']);
      
      // Submit form - should not show validation error for function field
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/function is required/i)).not.toBeInTheDocument();
      });
    });

    it('should validate real-time changes under 100ms', async () => {
      const { user } = renderFunctionUseForm({}, { mode: 'onChange' });
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      const startTime = performance.now();
      
      // Make changes that should trigger validation
      await selectFunctionUses(user, 0, ['SELECT']);
      await enterFunctionName(user, 0, 'test_function');
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;
      
      // Validation should complete under 100ms
      expect(validationTime).toBeLessThan(100);
    });

    it('should validate multiple use selections', async () => {
      const { user } = renderFunctionUseForm({}, { mode: 'onChange' });
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Select multiple uses
      await selectFunctionUses(user, 0, ['SELECT', 'FILTER', 'UPDATE']);
      
      // Verify all selections are maintained
      const useField = screen.getByRole('combobox', { name: /use/i });
      expect(useField).toHaveAttribute('aria-expanded', 'false');
      
      // Check that values are properly stored (this would be verified by form state)
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      // Should not show validation errors
      await waitFor(() => {
        expect(screen.queryByText(/use is required/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACCORDION AND TABLE DISPLAY MODE TESTS
  // ============================================================================

  describe('Accordion and Table Display Modes', () => {
    it('should toggle accordion expansion and maintain accessibility', async () => {
      const { user } = renderFunctionUseForm();
      
      const accordionButton = screen.getByRole('button', { expanded: false });
      
      // Test initial state
      expect(accordionButton).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      
      // Expand accordion
      await user.click(accordionButton);
      
      expect(screen.getByRole('button', { expanded: true })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Collapse accordion
      await user.click(screen.getByRole('button', { expanded: true }));
      
      expect(screen.getByRole('button', { expanded: false })).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should support keyboard navigation for accordion toggle', async () => {
      const { user } = renderFunctionUseForm();
      
      const accordionButton = screen.getByRole('button', { expanded: false });
      accordionButton.focus();
      
      // Test Enter key
      await user.keyboard('{Enter}');
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Test Space key
      await user.keyboard(' ');
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should maintain proper focus management when switching modes', async () => {
      const { user } = renderFunctionUseForm();
      
      const accordionButton = screen.getByRole('button', { expanded: false });
      
      // Expand accordion
      await user.click(accordionButton);
      
      // Focus should remain manageable within the expanded content
      const addButton = screen.getByRole('button', { name: /add.*function/i });
      addButton.focus();
      expect(document.activeElement).toBe(addButton);
      
      // Collapse accordion
      await user.click(screen.getByRole('button', { expanded: true }));
      
      // Focus should return to accordion button
      expect(document.activeElement).toBe(screen.getByRole('button', { expanded: false }));
    });

    it('should display table directly when showAccordion is false', () => {
      renderFunctionUseForm({ showAccordion: false });
      
      // Table should be visible immediately
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // MSW INTEGRATION AND API MOCKING TESTS
  // ============================================================================

  describe('MSW Integration and API Mocking', () => {
    it('should load function options from API', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Open use dropdown
      const useSelect = screen.getByRole('combobox', { name: /use/i });
      await user.click(useSelect);
      
      // Wait for options to load from API
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /SELECT \(GET\)/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /FILTER \(GET\)/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /INSERT \(POST\)/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /UPDATE \(PATCH\)/i })).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      server.use(
        http.get('/api/v2/system/database/function-options', () => {
          return HttpResponse.json({
            error: 'Database connection failed',
            success: false,
          }, { status: 500 });
        })
      );

      const { user } = renderFunctionUseForm();
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Open use dropdown
      const useSelect = screen.getByRole('combobox', { name: /use/i });
      await user.click(useSelect);
      
      // Should show error state or fallback options
      await waitFor(() => {
        expect(screen.getByText(/error loading options/i) || 
               screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });
    });

    it('should validate function names through API', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Enter invalid function name
      await enterFunctionName(user, 0, 'invalid_function');
      
      // Function validation should occur (this would typically be on blur or submit)
      const functionInput = screen.getByRole('textbox', { name: /function/i });
      await user.click(document.body); // Trigger blur
      
      await waitFor(() => {
        expect(screen.getByText(/function does not exist/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY COMPLIANCE TESTS (WCAG 2.1 AA)
  // ============================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have proper ARIA labels and descriptions', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      expect(accessibilityUtils.hasAriaLabel(accordionToggle)).toBe(true);
      
      await user.click(accordionToggle);
      
      // Check form fields have proper labels
      const useSelect = screen.getByRole('combobox', { name: /use/i });
      const functionInput = screen.getByRole('textbox', { name: /function/i });
      
      expect(accessibilityUtils.hasAriaLabel(useSelect)).toBe(true);
      expect(accessibilityUtils.hasAriaLabel(functionInput)).toBe(true);
    });

    it('should support keyboard navigation through all interactive elements', async () => {
      const { user } = renderFunctionUseForm({}, { defaultValues: mockInitialFormData });
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      const container = screen.getByTestId('function-use-test-form');
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(container, user);
      
      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
    });

    it('should maintain proper focus order and focus indicators', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Test tab order
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByRole('combobox', { name: /use/i }));
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /function/i }));
      
      await user.keyboard('{Tab}');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /delete.*row/i }));
    });

    it('should provide appropriate error announcements for screen readers', async () => {
      const { user } = renderFunctionUseForm({}, { mode: 'onChange' });
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Submit form to trigger validation error
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/use is required/i);
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should have adequate color contrast for all text elements', () => {
      renderFunctionUseForm();
      
      const textElements = screen.getAllByText(/./);
      textElements.forEach(element => {
        if (element.tagName !== 'SCRIPT' && element.textContent?.trim()) {
          expect(accessibilityUtils.hasAdequateContrast(element as HTMLElement)).toBe(true);
        }
      });
    });
  });

  // ============================================================================
  // INTEGRATION WITH PARENT FORM COMPONENTS TESTS
  // ============================================================================

  describe('Integration with Parent Form Components', () => {
    it('should integrate seamlessly with React Hook Form', () => {
      const TestParentForm = () => {
        const methods = useForm<{ dbFunction: FunctionUseFormData['dbFunction'] }>({
          defaultValues: { dbFunction: [] },
        });

        return (
          <form onSubmit={methods.handleSubmit(() => {})}>
            <FunctionUseForm name="dbFunction" showAccordion={false} />
          </form>
        );
      };

      renderWithForm(<TestParentForm />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should maintain form state when parent form re-renders', async () => {
      let renderCount = 0;
      const TestParentForm = () => {
        renderCount++;
        const methods = useForm<FunctionUseFormData>({
          defaultValues: emptyFormData,
        });

        return (
          <form onSubmit={methods.handleSubmit(() => {})}>
            <div data-testid={`render-count-${renderCount}`}>Render: {renderCount}</div>
            <FunctionUseForm name="dbFunction" showAccordion={false} />
          </form>
        );
      };

      const { user, rerender } = renderWithForm(<TestParentForm />);
      
      // Add entry and fill data
      await addFunctionEntry(user);
      await selectFunctionUses(user, 0, ['SELECT']);
      await enterFunctionName(user, 0, 'test_function');
      
      // Force re-render
      rerender(<TestParentForm />);
      
      // Data should be preserved
      expect(screen.getByDisplayValue('test_function')).toBeInTheDocument();
    });

    it('should validate form data according to parent form schema', async () => {
      const parentSchema = functionUseSchema.extend({
        additionalField: z.string().min(1, 'Additional field is required'),
      });

      const TestParentForm = () => {
        const methods = useForm({
          resolver: zodResolver(parentSchema),
          defaultValues: { dbFunction: [], additionalField: '' },
        });

        return (
          <form onSubmit={methods.handleSubmit(() => {})}>
            <input 
              {...methods.register('additionalField')} 
              placeholder="Additional field"
              data-testid="additional-field"
            />
            <FunctionUseForm name="dbFunction" showAccordion={false} />
            <button type="submit" data-testid="parent-submit">Submit</button>
          </form>
        );
      };

      const { user } = renderWithForm(<TestParentForm />);
      
      // Submit without filling required parent field
      const submitButton = screen.getByTestId('parent-submit');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/additional field is required/i)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // REACT QUERY CACHING TESTS
  // ============================================================================

  describe('React Query Caching Patterns', () => {
    it('should cache function options data effectively', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Open dropdown first time - should fetch from API
      const useSelect = screen.getByRole('combobox', { name: /use/i });
      await user.click(useSelect);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /SELECT \(GET\)/i })).toBeInTheDocument();
      });
      
      // Close and reopen dropdown - should use cached data
      await user.click(document.body);
      await user.click(useSelect);
      
      // Options should appear immediately from cache
      expect(screen.getByRole('option', { name: /SELECT \(GET\)/i })).toBeInTheDocument();
    });

    it('should handle cache invalidation properly', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      const { user } = renderFunctionUseForm({}, { 
        defaultValues: emptyFormData 
      });
      
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['function-options'] });
      
      // Expand accordion and add entry
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      await addFunctionEntry(user);
      
      // Should refetch data after cache invalidation
      const useSelect = screen.getByRole('combobox', { name: /use/i });
      await user.click(useSelect);
      
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /SELECT \(GET\)/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // PERFORMANCE TESTS
  // ============================================================================

  describe('Performance Optimization', () => {
    it('should render large numbers of function entries efficiently', async () => {
      const largeMockData: FunctionUseFormData = {
        dbFunction: Array.from({ length: 50 }, (_, i) => ({
          use: ['SELECT'],
          function: `function_${i}`,
        })),
      };

      const startTime = performance.now();
      renderFunctionUseForm({}, { defaultValues: largeMockData });
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      
      // Should render efficiently even with many entries
      expect(renderTime).toBeLessThan(500); // 500ms threshold
      expect(screen.getByDisplayValue('function_0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('function_49')).toBeInTheDocument();
    });

    it('should handle rapid user interactions without performance degradation', async () => {
      const { user } = renderFunctionUseForm();
      
      // Expand accordion
      const accordionToggle = screen.getByRole('button', { expanded: false });
      await user.click(accordionToggle);
      
      const startTime = performance.now();
      
      // Rapidly add and remove entries
      for (let i = 0; i < 10; i++) {
        await addFunctionEntry(user);
      }
      
      for (let i = 0; i < 5; i++) {
        await removeFunctionEntry(user, 0);
      }
      
      const endTime = performance.now();
      const interactionTime = endTime - startTime;
      
      // Should handle rapid interactions efficiently
      expect(interactionTime).toBeLessThan(2000); // 2 second threshold
      
      // Should have 5 entries remaining
      const table = screen.getByRole('table');
      const rows = within(table).getAllByRole('row');
      expect(rows).toHaveLength(6); // header + 5 data rows
    });
  });
});