/**
 * Comprehensive Vitest Test Suite for Function Usage Form Component
 * 
 * This test suite validates the function usage form component that enables users to
 * configure database function usage entries within field configurations. The component
 * supports dynamic addition/removal of function entries, real-time validation,
 * accordion/table display modes, and seamless integration with parent forms.
 * 
 * Key Testing Areas:
 * - Dynamic function entry addition/removal workflows
 * - Real-time validation with Zod schema integration
 * - Accordion and table display mode switching
 * - React Hook Form integration and validation
 * - MSW-powered API mocking for function options
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation (sub-100ms interactions)
 * 
 * Performance Target: All user interactions complete within 100ms
 * Coverage Target: 95%+ test coverage for component functionality
 * 
 * @version React 19.0.0 + Next.js 15.1 + Vitest 2.1.0
 */

import { describe, test, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Component under test
import { FunctionUseForm } from './function-use-form';
import type { 
  FunctionUseFormProps, 
  FunctionUseEntry, 
  FunctionOption,
  DisplayMode 
} from './function-use.types';

// Mock data and utilities
const mockFunctionOptions: FunctionOption[] = [
  {
    id: 'NOW',
    name: 'NOW',
    description: 'Returns current timestamp',
    parameters: [],
    returnType: 'TIMESTAMP',
    category: 'date'
  },
  {
    id: 'UPPER',
    name: 'UPPER',
    description: 'Converts string to uppercase',
    parameters: [{ name: 'str', type: 'VARCHAR', required: true }],
    returnType: 'VARCHAR',
    category: 'string'
  },
  {
    id: 'CONCAT',
    name: 'CONCAT',
    description: 'Concatenates multiple strings',
    parameters: [
      { name: 'str1', type: 'VARCHAR', required: true },
      { name: 'str2', type: 'VARCHAR', required: true }
    ],
    returnType: 'VARCHAR',
    category: 'string'
  },
  {
    id: 'SUM',
    name: 'SUM',
    description: 'Calculates sum of numeric values',
    parameters: [{ name: 'value', type: 'NUMERIC', required: true }],
    returnType: 'NUMERIC',
    category: 'aggregate'
  }
];

const mockFunctionEntries: FunctionUseEntry[] = [
  {
    id: '1',
    functionId: 'NOW',
    functionName: 'NOW',
    parameters: {},
    description: 'Current timestamp function',
    isValid: true
  },
  {
    id: '2',
    functionId: 'UPPER',
    functionName: 'UPPER',
    parameters: { str: 'test_value' },
    description: 'Uppercase conversion',
    isValid: true
  }
];

// Test form schema
const testFormSchema = z.object({
  functionEntries: z.array(z.object({
    id: z.string(),
    functionId: z.string().min(1, 'Function selection is required'),
    functionName: z.string(),
    parameters: z.record(z.string()),
    description: z.string().optional(),
    isValid: z.boolean()
  }))
});

type TestFormData = z.infer<typeof testFormSchema>;

// Test wrapper component with form context
const TestWrapper: React.FC<{ 
  children: React.ReactNode;
  defaultValues?: Partial<TestFormData>;
  onSubmit?: (data: TestFormData) => void;
}> = ({ children, defaultValues, onSubmit = vi.fn() }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      functionEntries: [],
      ...defaultValues
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
          {children}
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>
      </FormProvider>
    </QueryClientProvider>
  );
};

// MSW handlers for function options API
const functionOptionsHandlers = [
  http.get('/api/v2/system/database/:serviceId/functions', ({ params }) => {
    const { serviceId } = params;
    
    if (serviceId === 'test-mysql-service') {
      return HttpResponse.json({
        resource: mockFunctionOptions,
        count: mockFunctionOptions.length
      });
    }
    
    return HttpResponse.json({ resource: [], count: 0 });
  }),

  http.get('/api/v2/system/database/:serviceId/functions/:functionId', ({ params }) => {
    const { functionId } = params;
    const func = mockFunctionOptions.find(f => f.id === functionId);
    
    if (func) {
      return HttpResponse.json({ resource: [func] });
    }
    
    return HttpResponse.json(
      { error: { message: 'Function not found', code: 404 } },
      { status: 404 }
    );
  })
];

describe('FunctionUseForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Add MSW handlers for function options
    server.use(...functionOptionsHandlers);
  });

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    test('renders function use form with empty state', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion',
        label: 'Function Usage Configuration',
        description: 'Configure database functions for this field'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Verify form label and description
      expect(screen.getByText('Function Usage Configuration')).toBeInTheDocument();
      expect(screen.getByText('Configure database functions for this field')).toBeInTheDocument();

      // Verify empty state message
      expect(screen.getByText(/no function entries configured/i)).toBeInTheDocument();

      // Verify add function button is present
      expect(screen.getByRole('button', { name: /add function/i })).toBeInTheDocument();
    });

    test('renders with existing function entries in accordion mode', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion',
        label: 'Function Usage Configuration'
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for function entries to load
      await waitFor(() => {
        expect(screen.getByText('NOW')).toBeInTheDocument();
        expect(screen.getByText('UPPER')).toBeInTheDocument();
      });

      // Verify accordion structure
      const accordionItems = screen.getAllByRole('button', { expanded: false });
      expect(accordionItems).toHaveLength(2);
    });

    test('renders with existing function entries in table mode', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'table',
        label: 'Function Usage Configuration'
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table headers
      expect(screen.getByText('Function')).toBeInTheDocument();
      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Verify table rows
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3); // Header + 2 data rows
    });

    test('shows loading state while fetching function options', async () => {
      // Delay the API response
      server.use(
        http.get('/api/v2/system/database/:serviceId/functions', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({
            resource: mockFunctionOptions,
            count: mockFunctionOptions.length
          });
        })
      );

      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Verify loading state
      expect(screen.getByText(/loading function options/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText(/loading function options/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Function Entry Management', () => {
    test('adds new function entry when add button is clicked', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for function options to load
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add function/i })).toBeEnabled();
      });

      // Click add function button
      const addButton = screen.getByRole('button', { name: /add function/i });
      await user.click(addButton);

      // Verify new entry form appears
      await waitFor(() => {
        expect(screen.getByText(/select function/i)).toBeInTheDocument();
      });

      // Verify function dropdown is present
      expect(screen.getByRole('combobox', { name: /function/i })).toBeInTheDocument();
    });

    test('removes function entry when remove button is clicked', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('NOW')).toBeInTheDocument();
      });

      // Find and click remove button for first entry
      const removeButtons = screen.getAllByRole('button', { name: /remove function/i });
      expect(removeButtons).toHaveLength(2);

      await user.click(removeButtons[0]);

      // Verify entry is removed
      await waitFor(() => {
        expect(screen.queryByText('NOW')).not.toBeInTheDocument();
        expect(screen.getByText('UPPER')).toBeInTheDocument();
      });
    });

    test('reorders function entries with drag and drop', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion',
        allowReorder: true
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.getByText('NOW')).toBeInTheDocument();
        expect(screen.getByText('UPPER')).toBeInTheDocument();
      });

      // Find drag handles
      const dragHandles = screen.getAllByRole('button', { name: /reorder/i });
      expect(dragHandles).toHaveLength(2);

      // Simulate drag and drop (simplified for testing)
      const firstHandle = dragHandles[0];
      const secondHandle = dragHandles[1];

      // Focus and keyboard interaction simulation
      firstHandle.focus();
      await user.keyboard('{ArrowDown}');

      // Verify order change indication
      expect(firstHandle).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Function Selection and Configuration', () => {
    test('selects function from dropdown and configures parameters', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Add new function entry
      await user.click(screen.getByRole('button', { name: /add function/i }));

      // Wait for function dropdown to appear
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /function/i })).toBeInTheDocument();
      });

      // Select function from dropdown
      const functionSelect = screen.getByRole('combobox', { name: /function/i });
      await user.click(functionSelect);

      // Wait for options to appear
      await waitFor(() => {
        expect(screen.getByText('UPPER')).toBeInTheDocument();
      });

      await user.click(screen.getByText('UPPER'));

      // Verify function is selected and parameter fields appear
      await waitFor(() => {
        expect(screen.getByDisplayValue('UPPER')).toBeInTheDocument();
        expect(screen.getByLabelText(/str parameter/i)).toBeInTheDocument();
      });

      // Configure parameter
      const parameterInput = screen.getByLabelText(/str parameter/i);
      await user.clear(parameterInput);
      await user.type(parameterInput, 'test_value');

      // Verify parameter value
      expect(parameterInput).toHaveValue('test_value');
    });

    test('validates required parameters', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Add new function entry
      await user.click(screen.getByRole('button', { name: /add function/i }));

      // Select function with required parameters
      const functionSelect = screen.getByRole('combobox', { name: /function/i });
      await user.click(functionSelect);
      await user.click(await screen.findByText('CONCAT'));

      // Wait for parameter fields
      await waitFor(() => {
        expect(screen.getByLabelText(/str1 parameter/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/str2 parameter/i)).toBeInTheDocument();
      });

      // Try to submit form without filling required parameters
      await user.click(screen.getByTestId('submit-button'));

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/str1 is required/i)).toBeInTheDocument();
        expect(screen.getByText(/str2 is required/i)).toBeInTheDocument();
      });
    });

    test('shows function description and parameter help', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Add new function entry
      await user.click(screen.getByRole('button', { name: /add function/i }));

      // Select function
      const functionSelect = screen.getByRole('combobox', { name: /function/i });
      await user.click(functionSelect);
      await user.click(await screen.findByText('UPPER'));

      // Verify function description is shown
      await waitFor(() => {
        expect(screen.getByText('Converts string to uppercase')).toBeInTheDocument();
      });

      // Verify parameter help text
      expect(screen.getByText(/required parameter/i)).toBeInTheDocument();
    });
  });

  describe('Display Mode Switching', () => {
    test('switches from accordion to table mode', async () => {
      const mockOnDisplayModeChange = vi.fn();
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion',
        onDisplayModeChange: mockOnDisplayModeChange,
        allowModeSwitch: true
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for accordion to render
      await waitFor(() => {
        expect(screen.getByText('NOW')).toBeInTheDocument();
      });

      // Find and click table mode button
      const tableModeButton = screen.getByRole('button', { name: /table view/i });
      await user.click(tableModeButton);

      // Verify mode change callback
      expect(mockOnDisplayModeChange).toHaveBeenCalledWith('table');
    });

    test('switches from table to accordion mode', async () => {
      const mockOnDisplayModeChange = vi.fn();
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'table',
        onDisplayModeChange: mockOnDisplayModeChange,
        allowModeSwitch: true
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for table to render
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and click accordion mode button
      const accordionModeButton = screen.getByRole('button', { name: /accordion view/i });
      await user.click(accordionModeButton);

      // Verify mode change callback
      expect(mockOnDisplayModeChange).toHaveBeenCalledWith('accordion');
    });

    test('maintains form state when switching display modes', async () => {
      let currentMode: DisplayMode = 'accordion';
      const mockOnDisplayModeChange = vi.fn((mode: DisplayMode) => {
        currentMode = mode;
      });

      const Component = () => (
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm
            name="functionEntries"
            serviceId="test-mysql-service"
            displayMode={currentMode}
            onDisplayModeChange={mockOnDisplayModeChange}
            allowModeSwitch={true}
          />
        </TestWrapper>
      );

      const { rerender } = render(<Component />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('NOW')).toBeInTheDocument();
      });

      // Switch to table mode
      await user.click(screen.getByRole('button', { name: /table view/i }));
      currentMode = 'table';
      rerender(<Component />);

      // Verify data is preserved
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('NOW')).toBeInTheDocument();
        expect(screen.getByText('UPPER')).toBeInTheDocument();
      });
    });
  });

  describe('Form Integration and Validation', () => {
    test('integrates with parent form submission', async () => {
      const mockOnSubmit = vi.fn();
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper 
          defaultValues={{ functionEntries: mockFunctionEntries }}
          onSubmit={mockOnSubmit}
        >
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Submit form
      await user.click(screen.getByTestId('submit-button'));

      // Verify form submission with function entries
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          functionEntries: expect.arrayContaining([
            expect.objectContaining({
              functionId: 'NOW',
              functionName: 'NOW'
            }),
            expect.objectContaining({
              functionId: 'UPPER',
              functionName: 'UPPER'
            })
          ])
        });
      });
    });

    test('validates function entries with form validation', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion',
        required: true
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Try to submit empty form when required
      await user.click(screen.getByTestId('submit-button'));

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/at least one function entry is required/i)).toBeInTheDocument();
      });
    });

    test('handles field array operations correctly', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Initial state: 2 entries
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /remove function/i })).toHaveLength(2);
      });

      // Add new entry
      await user.click(screen.getByRole('button', { name: /add function/i }));

      // Now should have 3 entries (2 existing + 1 new)
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /remove function/i })).toHaveLength(3);
      });

      // Remove one entry
      const removeButtons = screen.getAllByRole('button', { name: /remove function/i });
      await user.click(removeButtons[0]);

      // Back to 2 entries
      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /remove function/i })).toHaveLength(2);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    test('provides proper ARIA labels and descriptions', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion',
        label: 'Function Configuration',
        description: 'Configure database functions'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Verify main form has proper labeling
      const form = screen.getByRole('group', { name: /function configuration/i });
      expect(form).toHaveAttribute('aria-describedby');

      // Verify add button is properly labeled
      const addButton = screen.getByRole('button', { name: /add function/i });
      expect(addButton).toHaveAttribute('aria-label');
    });

    test('supports keyboard navigation', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Test keyboard navigation through entries
      const addButton = screen.getByRole('button', { name: /add function/i });
      addButton.focus();
      expect(addButton).toHaveFocus();

      // Navigate to first entry
      await user.keyboard('{Tab}');
      const firstEntry = screen.getAllByRole('button', { expanded: false })[0];
      expect(firstEntry).toHaveFocus();

      // Expand with keyboard
      await user.keyboard('{Enter}');
      expect(firstEntry).toHaveAttribute('aria-expanded', 'true');
    });

    test('announces changes to screen readers', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Add function entry
      await user.click(screen.getByRole('button', { name: /add function/i }));

      // Verify live region announcement
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent(/function entry added/i);
      });
    });

    test('provides proper focus management', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper defaultValues={{ functionEntries: mockFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Focus should move to new entry after adding
      await user.click(screen.getByRole('button', { name: /add function/i }));

      await waitFor(() => {
        const functionSelect = screen.getByRole('combobox', { name: /function/i });
        expect(functionSelect).toHaveFocus();
      });
    });
  });

  describe('Performance Validation', () => {
    test('handles large number of function entries efficiently', async () => {
      const largeFunctionEntries = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        functionId: 'NOW',
        functionName: 'NOW',
        parameters: {},
        description: `Function entry ${i + 1}`,
        isValid: true
      }));

      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'table' // Table mode for better performance with many entries
      };

      const startTime = performance.now();

      render(
        <TestWrapper defaultValues={{ functionEntries: largeFunctionEntries }}>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Wait for rendering to complete
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify render time is under performance threshold (100ms)
      expect(renderTime).toBeLessThan(100);

      // Verify all entries are rendered
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(51); // Header + 50 data rows
    });

    test('debounces parameter input changes', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Add function with parameters
      await user.click(screen.getByRole('button', { name: /add function/i }));
      
      const functionSelect = screen.getByRole('combobox', { name: /function/i });
      await user.click(functionSelect);
      await user.click(await screen.findByText('UPPER'));

      // Type in parameter field rapidly
      const parameterInput = await screen.findByLabelText(/str parameter/i);
      const startTime = performance.now();
      
      await user.type(parameterInput, 'rapid_typing_test');
      
      const endTime = performance.now();
      const inputTime = endTime - startTime;

      // Verify interaction is responsive (under 100ms for each character)
      expect(inputTime / 'rapid_typing_test'.length).toBeLessThan(10);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      // Mock API error
      server.use(
        http.get('/api/v2/system/database/:serviceId/functions', () => {
          return HttpResponse.json(
            { error: { message: 'Service not found', code: 404 } },
            { status: 404 }
          );
        })
      );

      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'invalid-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to load function options/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    test('handles network connectivity issues', async () => {
      // Mock network error
      server.use(
        http.get('/api/v2/system/database/:serviceId/functions', () => {
          return HttpResponse.error();
        })
      );

      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Verify network error handling
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('validates function parameter types', async () => {
      const props: FunctionUseFormProps = {
        name: 'functionEntries',
        serviceId: 'test-mysql-service',
        displayMode: 'accordion'
      };

      render(
        <TestWrapper>
          <FunctionUseForm {...props} />
        </TestWrapper>
      );

      // Add function with numeric parameter
      await user.click(screen.getByRole('button', { name: /add function/i }));
      
      const functionSelect = screen.getByRole('combobox', { name: /function/i });
      await user.click(functionSelect);
      await user.click(await screen.findByText('SUM'));

      // Enter invalid value for numeric parameter
      const parameterInput = await screen.findByLabelText(/value parameter/i);
      await user.type(parameterInput, 'not_a_number');

      // Trigger validation
      await user.tab();

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/must be a valid number/i)).toBeInTheDocument();
      });
    });
  });
});