import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { FieldArray } from './field-array';
import type { FieldArrayProps } from './field-array.types';
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createFieldArrayTestData } from '../../../test/utils/component-factories';
import { server } from '../../../test/mocks/server';
import { measureRenderTime, measureValidationTime } from '../../../test/utils/performance-helpers';
import { testKeyboardNavigation, testScreenReaderAnnouncements } from '../../../test/utils/accessibility-helpers';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock external dependencies
vi.mock('@heroicons/react/24/outline', () => ({
  PlusIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="plus-icon" aria-hidden="true">
      <path d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <svg className={className} data-testid="x-mark-icon" aria-hidden="true">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}));

vi.mock('../../dynamic-field', () => ({
  DynamicField: ({ name, label, value, onChange, error, ...props }: any) => (
    <div data-testid={`dynamic-field-${name}`}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <div id={`${name}-error`} role="alert" aria-live="polite">
          {error.message}
        </div>
      )}
    </div>
  ),
}));

vi.mock('../../verb-picker', () => ({
  VerbPicker: ({ value, onChange, disabled, ...props }: any) => (
    <select
      data-testid="verb-picker"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      {...props}
    >
      <option value="">Select verb</option>
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
    </select>
  ),
}));

// Test schemas for validation
const stringArraySchema = z.object({
  tags: z.array(z.string().min(1, 'Tag is required')),
});

const objectArraySchema = z.object({
  endpoints: z.array(
    z.object({
      path: z.string().min(1, 'Path is required'),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
      description: z.string().optional(),
    })
  ),
});

// Test wrapper component for React Hook Form integration
function TestWrapper({ 
  children, 
  schema = stringArraySchema, 
  defaultValues = {},
  onSubmit = vi.fn()
}: {
  children: React.ReactNode;
  schema?: z.ZodSchema;
  defaultValues?: any;
  onSubmit?: (data: any) => void;
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange',
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
      {children}
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  );
}

describe('FieldArray', () => {
  let mockProps: FieldArrayProps;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    server.listen();
    
    mockProps = {
      name: 'tags',
      label: 'Tags',
      fieldType: 'array',
      valueType: 'string',
      control: undefined, // Will be set by form context
    };
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  describe('Rendering and Basic Functionality', () => {
    it('renders with correct structure and ARIA attributes', async () => {
      const { container } = renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['initial-tag'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Check for proper semantic structure
      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByRole('group')).toHaveAttribute('aria-labelledby');
      
      // Check for table structure with proper headers
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label', 'Tags array fields');

      // Check for add button
      const addButton = screen.getByRole('button', { name: /add tag/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('aria-describedby');

      // Accessibility audit
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('displays initial values correctly', () => {
      const initialValues = ['tag1', 'tag2', 'tag3'];
      
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: initialValues }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      initialValues.forEach((tag, index) => {
        expect(screen.getByDisplayValue(tag)).toBeInTheDocument();
        expect(screen.getByTestId(`dynamic-field-tags.${index}`)).toBeInTheDocument();
      });
    });

    it('handles empty initial state correctly', () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: [] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/no tags added yet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add tag/i })).toBeInTheDocument();
    });
  });

  describe('Array Field Management', () => {
    it('adds new string fields correctly', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: [] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add tag/i });
      
      // Add first field
      await user.click(addButton);
      expect(screen.getByTestId('dynamic-field-tags.0')).toBeInTheDocument();
      
      // Add second field
      await user.click(addButton);
      expect(screen.getByTestId('dynamic-field-tags.1')).toBeInTheDocument();

      // Verify table structure is maintained
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3); // Header + 2 data rows
    });

    it('removes fields correctly with confirmation', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['tag1', 'tag2'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Get remove buttons
      const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
      expect(removeButtons).toHaveLength(2);

      // Remove first item
      await user.click(removeButtons[0]);
      
      // Should only have one field left
      await waitFor(() => {
        expect(screen.queryByDisplayValue('tag1')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('tag2')).toBeInTheDocument();
      });
    });

    it('handles object array fields correctly', async () => {
      const objectProps: FieldArrayProps = {
        name: 'endpoints',
        label: 'API Endpoints',
        fieldType: 'object',
        valueType: 'object',
        objectSchema: {
          path: { type: 'string', label: 'Path' },
          method: { type: 'select', label: 'Method' },
          description: { type: 'string', label: 'Description', optional: true },
        },
      };

      renderWithProviders(
        <TestWrapper 
          schema={objectArraySchema}
          defaultValues={{ endpoints: [] }}
        >
          <FieldArray {...objectProps} />
        </TestWrapper>
      );

      // Add an object field
      const addButton = screen.getByRole('button', { name: /add api endpoint/i });
      await user.click(addButton);

      // Check that object fields are rendered
      expect(screen.getByTestId('dynamic-field-endpoints.0.path')).toBeInTheDocument();
      expect(screen.getByTestId('verb-picker')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-field-endpoints.0.description')).toBeInTheDocument();
    });
  });

  describe('Form Integration and Validation', () => {
    it('integrates with React Hook Form correctly', async () => {
      const onSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper 
          defaultValues={{ tags: ['valid-tag'] }}
          onSubmit={onSubmit}
        >
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Submit form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ tags: ['valid-tag'] });
      });
    });

    it('validates required fields in real-time', async () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: [''] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Clear the field to trigger validation
      const input = screen.getByDisplayValue('');
      await user.clear(input);
      await user.tab(); // Trigger blur event

      // Check validation occurs under 100ms requirement
      const validationTime = performance.now() - startTime;
      expect(validationTime).toBeLessThan(100);

      // Check error message appears
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Tag is required')).toBeInTheDocument();
      });
    });

    it('validates object fields correctly', async () => {
      const objectProps: FieldArrayProps = {
        name: 'endpoints',
        label: 'API Endpoints',
        fieldType: 'object',
        valueType: 'object',
        objectSchema: {
          path: { type: 'string', label: 'Path', required: true },
          method: { type: 'select', label: 'Method', required: true },
        },
      };

      renderWithProviders(
        <TestWrapper 
          schema={objectArraySchema}
          defaultValues={{ endpoints: [{ path: '', method: '' }] }}
        >
          <FieldArray {...objectProps} />
        </TestWrapper>
      );

      // Try to submit with empty required fields
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Check validation errors
      await waitFor(() => {
        expect(screen.getByText('Path is required')).toBeInTheDocument();
      });
    });

    it('supports controlled mode with external state', async () => {
      const ExternalStateWrapper = () => {
        const [value, setValue] = React.useState(['external-tag']);
        
        return (
          <div>
            <FieldArray 
              {...mockProps}
              value={value}
              onChange={setValue}
            />
            <div data-testid="external-value">{value.join(',')}</div>
          </div>
        );
      };

      renderWithProviders(<ExternalStateWrapper />);

      // Check initial external value
      expect(screen.getByTestId('external-value')).toHaveTextContent('external-tag');

      // Add a new field
      const addButton = screen.getByRole('button', { name: /add tag/i });
      await user.click(addButton);

      // Update the new field
      const newInput = screen.getByTestId('dynamic-field-tags.1').querySelector('input');
      await user.type(newInput!, 'new-tag');

      // Check external state is updated
      await waitFor(() => {
        expect(screen.getByTestId('external-value')).toHaveTextContent('external-tag,new-tag');
      });
    });
  });

  describe('Theme Integration', () => {
    it('applies light theme classes correctly', () => {
      renderWithProviders(
        <TestWrapper>
          <FieldArray {...mockProps} />
        </TestWrapper>,
        { theme: 'light' }
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('bg-white', 'border-gray-200');

      const addButton = screen.getByRole('button', { name: /add tag/i });
      expect(addButton).toHaveClass('bg-primary-500', 'hover:bg-primary-600');
    });

    it('applies dark theme classes correctly', () => {
      renderWithProviders(
        <TestWrapper>
          <FieldArray {...mockProps} />
        </TestWrapper>,
        { theme: 'dark' }
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('bg-gray-800', 'border-gray-600');

      const addButton = screen.getByRole('button', { name: /add tag/i });
      expect(addButton).toHaveClass('bg-primary-400', 'hover:bg-primary-300');
    });

    it('updates theme classes when theme changes', async () => {
      const { toggleTheme } = renderWithProviders(
        <TestWrapper>
          <FieldArray {...mockProps} />
        </TestWrapper>,
        { theme: 'light' }
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('bg-white');

      // Toggle to dark theme
      toggleTheme();

      await waitFor(() => {
        expect(table).toHaveClass('bg-gray-800');
      });
    });
  });

  describe('Accessibility Features', () => {
    it('supports keyboard navigation', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['tag1', 'tag2'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Test tab navigation through fields
      await testKeyboardNavigation([
        { selector: '[data-testid="dynamic-field-tags.0"] input', key: 'Tab' },
        { selector: '[role="button"][aria-label*="Remove tag"]', key: 'Tab' },
        { selector: '[data-testid="dynamic-field-tags.1"] input', key: 'Tab' },
        { selector: '[role="button"][aria-label*="Add tag"]', key: 'Tab' },
      ]);

      // Test Enter key on add button
      const addButton = screen.getByRole('button', { name: /add tag/i });
      addButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('dynamic-field-tags.2')).toBeInTheDocument();
    });

    it('provides proper screen reader announcements', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: [] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Add field and check announcement
      const addButton = screen.getByRole('button', { name: /add tag/i });
      await user.click(addButton);

      await testScreenReaderAnnouncements([
        { text: 'Tag field added', role: 'status' },
      ]);

      // Remove field and check announcement
      const removeButton = screen.getByRole('button', { name: /remove tag/i });
      await user.click(removeButton);

      await testScreenReaderAnnouncements([
        { text: 'Tag field removed', role: 'status' },
      ]);
    });

    it('maintains proper focus management', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['tag1'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Add a field
      const addButton = screen.getByRole('button', { name: /add tag/i });
      await user.click(addButton);

      // Focus should move to the new field
      await waitFor(() => {
        const newInput = screen.getByTestId('dynamic-field-tags.1').querySelector('input');
        expect(newInput).toHaveFocus();
      });

      // Remove the original field
      const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
      await user.click(removeButtons[0]);

      // Focus should move to the remaining field or add button
      await waitFor(() => {
        const focusedElement = document.activeElement;
        expect(focusedElement).toBe(
          screen.getByTestId('dynamic-field-tags.0').querySelector('input') ||
          addButton
        );
      });
    });

    it('provides appropriate ARIA labels and descriptions', () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['tag1'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Check field group has proper labeling
      const fieldGroup = screen.getByRole('group');
      expect(fieldGroup).toHaveAttribute('aria-labelledby');

      // Check table has accessible name
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Tags array fields');

      // Check add button has description
      const addButton = screen.getByRole('button', { name: /add tag/i });
      expect(addButton).toHaveAttribute('aria-describedby');

      // Check remove buttons have proper labels
      const removeButton = screen.getByRole('button', { name: /remove tag/i });
      expect(removeButton).toHaveAttribute('aria-label');
    });
  });

  describe('Performance Requirements', () => {
    it('renders under performance thresholds', async () => {
      const renderTime = await measureRenderTime(() => {
        renderWithProviders(
          <TestWrapper defaultValues={{ tags: Array(100).fill('tag') }}>
            <FieldArray {...mockProps} />
          </TestWrapper>
        );
      });

      // Should render large arrays efficiently
      expect(renderTime).toBeLessThan(500); // 500ms threshold for 100 items
    });

    it('validates fields under 100ms requirement', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['test'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      const input = screen.getByDisplayValue('test');
      
      const validationTime = await measureValidationTime(async () => {
        await user.clear(input);
        await user.type(input, 'a');
      });

      expect(validationTime).toBeLessThan(100);
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = Array(1000).fill(0).map((_, i) => `tag-${i}`);
      
      const renderTime = await measureRenderTime(() => {
        renderWithProviders(
          <TestWrapper defaultValues={{ tags: largeDataset }}>
            <FieldArray {...mockProps} enableVirtualization />
          </TestWrapper>
        );
      });

      // Should handle large datasets with virtualization
      expect(renderTime).toBeLessThan(1000); // 1s threshold for 1000 items
    });
  });

  describe('Integration with Other Components', () => {
    it('integrates correctly with DynamicField component', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: [''] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      const dynamicField = screen.getByTestId('dynamic-field-tags.0');
      expect(dynamicField).toBeInTheDocument();

      // Test field interaction
      const input = dynamicField.querySelector('input');
      await user.type(input!, 'new value');

      expect(input).toHaveValue('new value');
    });

    it('integrates correctly with VerbPicker component', async () => {
      const objectProps: FieldArrayProps = {
        name: 'endpoints',
        label: 'API Endpoints',
        fieldType: 'object',
        valueType: 'object',
        objectSchema: {
          method: { type: 'verb-picker', label: 'HTTP Method' },
        },
      };

      renderWithProviders(
        <TestWrapper 
          schema={objectArraySchema}
          defaultValues={{ endpoints: [{ method: '' }] }}
        >
          <FieldArray {...objectProps} />
        </TestWrapper>
      );

      const verbPicker = screen.getByTestId('verb-picker');
      expect(verbPicker).toBeInTheDocument();

      // Test verb selection
      await user.selectOptions(verbPicker, 'GET');
      expect(verbPicker).toHaveValue('GET');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles invalid initial data gracefully', () => {
      // Suppress console errors for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(
        <TestWrapper defaultValues={{ tags: null }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Should render with empty state
      expect(screen.getByText(/no tags added yet/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles rapid add/remove operations', async () => {
      renderWithProviders(
        <TestWrapper defaultValues={{ tags: [] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      const addButton = screen.getByRole('button', { name: /add tag/i });

      // Rapidly add multiple fields
      for (let i = 0; i < 5; i++) {
        await user.click(addButton);
      }

      // Should have 5 fields
      expect(screen.getAllByTestId(/dynamic-field-tags\.\d+/)).toHaveLength(5);

      // Rapidly remove all fields
      const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
      for (const button of removeButtons) {
        await user.click(button);
      }

      // Should be back to empty state
      await waitFor(() => {
        expect(screen.getByText(/no tags added yet/i)).toBeInTheDocument();
      });
    });

    it('maintains data integrity during concurrent operations', async () => {
      const onSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper 
          defaultValues={{ tags: ['tag1'] }}
          onSubmit={onSubmit}
        >
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Simultaneously modify field and add new field
      const input = screen.getByDisplayValue('tag1');
      const addButton = screen.getByRole('button', { name: /add tag/i });

      await Promise.all([
        user.type(input, '-modified'),
        user.click(addButton),
      ]);

      // Verify both operations completed correctly
      expect(screen.getByDisplayValue('tag1-modified')).toBeInTheDocument();
      expect(screen.getByTestId('dynamic-field-tags.1')).toBeInTheDocument();

      // Submit and verify data integrity
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: expect.arrayContaining(['tag1-modified', ''])
        });
      });
    });
  });

  describe('Responsive Layout', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['tag1', 'tag2'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('overflow-x-auto');
    });

    it('maintains accessibility on small screens', async () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = renderWithProviders(
        <TestWrapper defaultValues={{ tags: ['tag1'] }}>
          <FieldArray {...mockProps} />
        </TestWrapper>
      );

      // Accessibility should still pass on mobile
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});