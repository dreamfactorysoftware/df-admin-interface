/**
 * Comprehensive Test Suite for LookupKeys Component
 * 
 * Tests React Hook Form integration, useFieldArray functionality, accessibility compliance,
 * keyboard navigation, and user interactions. Ensures WCAG 2.1 AA compliance through
 * automated testing and validates add/remove operations with proper form state management.
 * 
 * @fileoverview LookupKeys component test suite
 * @version 1.0.0
 * @since Vitest 2.1.0
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithForm, testA11y, createKeyboardUtils, type FormTestUtils } from '@/test/test-utils';
import { LookupKeys, type LookupKeyEntry, lookupKeySchema, lookupKeysArraySchema } from './lookup-keys';
import { z } from 'zod';

// Mock Next.js internationalization
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock theme hook
const mockTheme = vi.fn();
vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: mockTheme(),
    setTheme: vi.fn(),
  }),
}));

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">+</div>,
  Trash2: () => <div data-testid="trash-icon">🗑</div>,
  ChevronDown: () => <div data-testid="chevron-icon">⌄</div>,
}));

// Mock Headless UI components
vi.mock('@headlessui/react', () => ({
  Disclosure: {
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Panel: ({ children }: any) => <div>{children}</div>,
  },
  Switch: ({ checked, onChange, disabled, className, children, ...props }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Test data
const mockLookupKeys: LookupKeyEntry[] = [
  {
    id: 1,
    name: 'api_key',
    value: 'secret-key-123',
    private: true,
    description: 'API key for external service',
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
  {
    id: 2,
    name: 'database_url',
    value: 'postgresql://localhost:5432/app',
    private: false,
    description: 'Database connection URL',
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
];

const emptyLookupKey: Partial<LookupKeyEntry> = {
  name: '',
  value: '',
  private: false,
};

// Form schema for testing
const testFormSchema = z.object({
  lookupKeys: lookupKeysArraySchema,
});

type TestFormData = z.infer<typeof testFormSchema>;

describe('LookupKeys Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onEntriesChangeMock: MockedFunction<(entries: LookupKeyEntry[]) => void>;

  beforeEach(() => {
    user = userEvent.setup();
    onEntriesChangeMock = vi.fn();
    mockTheme.mockReturnValue('light');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('should render with accordion by default', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(screen.getByRole('button', { name: /toggle lookup keys section/i })).toBeInTheDocument();
      expect(screen.getByText('Lookup Keys')).toBeInTheDocument();
    });

    it('should render without accordion when showAccordion is false', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" showAccordion={false} />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(screen.queryByRole('button', { name: /toggle lookup keys section/i })).not.toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should render empty state when no lookup keys exist', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(screen.getByText(/no lookup keys configured/i)).toBeInTheDocument();
      expect(screen.getByText(/click the \+ button to add your first key/i)).toBeInTheDocument();
    });

    it('should render existing lookup keys', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      expect(screen.getByDisplayValue('api_key')).toBeInTheDocument();
      expect(screen.getByDisplayValue('secret-key-123')).toBeInTheDocument();
      expect(screen.getByDisplayValue('database_url')).toBeInTheDocument();
      expect(screen.getByDisplayValue('postgresql://localhost:5432/app')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderWithForm(
        <LookupKeys name="lookupKeys" className="custom-class" />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" disabled />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const nameInput = screen.getByDisplayValue('api_key');
      const valueInput = screen.getByDisplayValue('secret-key-123');
      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      const removeButton = screen.getByLabelText(/remove lookup key entry api_key/i);

      expect(nameInput).toBeDisabled();
      expect(valueInput).toBeDisabled();
      expect(addButton).toBeDisabled();
      expect(removeButton).toBeDisabled();
    });
  });

  // ============================================================================
  // DARK THEME INTEGRATION TESTS
  // ============================================================================

  describe('Dark Theme Integration', () => {
    it('should apply dark theme classes when theme is dark', () => {
      mockTheme.mockReturnValue('dark');
      
      const { container } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(container.querySelector('.dark')).toBeInTheDocument();
    });

    it('should not apply dark theme classes when theme is light', () => {
      mockTheme.mockReturnValue('light');
      
      const { container } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(container.querySelector('.dark')).not.toBeInTheDocument();
    });

    it('should handle theme switching correctly', () => {
      mockTheme.mockReturnValue('light');
      
      const { rerender, container } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      expect(container.querySelector('.dark')).not.toBeInTheDocument();

      mockTheme.mockReturnValue('dark');
      
      rerender(<LookupKeys name="lookupKeys" />);

      expect(container.querySelector('.dark')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // REACT HOOK FORM INTEGRATION TESTS
  // ============================================================================

  describe('React Hook Form Integration', () => {
    it('should integrate with useFieldArray correctly', () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const formValues = formMethods.getValues();
      expect(formValues.lookupKeys).toHaveLength(2);
      expect(formValues.lookupKeys[0]).toMatchObject({
        name: 'api_key',
        value: 'secret-key-123',
        private: true,
      });
    });

    it('should handle form submission', async () => {
      const onSubmit = vi.fn();
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      await formMethods.handleSubmit(onSubmit)();
      
      expect(onSubmit).toHaveBeenCalledWith({
        lookupKeys: expect.arrayContaining([
          expect.objectContaining({
            name: 'api_key',
            value: 'secret-key-123',
            private: true,
          }),
        ]),
      });
    });

    it('should trigger form validation on field changes', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [emptyLookupKey] } }
      );

      const nameInput = screen.getByLabelText(/lookup key name for entry 1/i);
      
      await user.type(nameInput, 'test_key');
      await waitFor(() => {
        const formValues = formMethods.getValues();
        expect(formValues.lookupKeys[0].name).toBe('test_key');
      });
    });

    it('should reset form state correctly', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      // Add an entry
      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      expect(formMethods.getValues().lookupKeys).toHaveLength(1);

      // Reset form
      formMethods.reset();

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys).toHaveLength(0);
      });
    });
  });

  // ============================================================================
  // ADD/REMOVE OPERATIONS TESTS
  // ============================================================================

  describe('Add/Remove Operations', () => {
    it('should add new lookup key entry', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys).toHaveLength(1);
        expect(formMethods.getValues().lookupKeys[0]).toMatchObject({
          name: '',
          value: '',
          private: false,
        });
      });

      expect(screen.getByLabelText(/lookup key name for entry 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lookup key value for entry 1/i)).toBeInTheDocument();
    });

    it('should remove lookup key entry', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const removeButton = screen.getByLabelText(/remove lookup key entry api_key/i);
      await user.click(removeButton);

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys).toHaveLength(1);
        expect(formMethods.getValues().lookupKeys[0].name).toBe('database_url');
      });

      expect(screen.queryByDisplayValue('api_key')).not.toBeInTheDocument();
    });

    it('should respect maxEntries limit', async () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" maxEntries={2} />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry \(2\/2\)/i);
      expect(addButton).toBeDisabled();
    });

    it('should show entry count in add button when maxEntries is set', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" maxEntries={5} />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      expect(screen.getByLabelText(/add new lookup key entry \(2\/5\)/i)).toBeInTheDocument();
    });

    it('should handle adding multiple entries sequentially', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys).toHaveLength(3);
      });

      expect(screen.getByLabelText(/lookup key name for entry 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lookup key name for entry 2/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lookup key name for entry 3/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // PRIVACY TOGGLE FUNCTIONALITY TESTS
  // ============================================================================

  describe('Privacy Toggle Functionality', () => {
    it('should toggle privacy flag', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);
      expect(privacyToggle).toHaveAttribute('aria-checked', 'true');

      await user.click(privacyToggle);

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys[0].private).toBe(false);
      });

      expect(privacyToggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should handle privacy toggle for new entries', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      const privacyToggle = screen.getByLabelText(/toggle privacy for entry 1/i);
      expect(privacyToggle).toHaveAttribute('aria-checked', 'false');

      await user.click(privacyToggle);

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys[0].private).toBe(true);
      });
    });

    it('should disable privacy toggle when component is disabled', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" disabled />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);
      expect(privacyToggle).toBeDisabled();
    });

    it('should update form state when privacy toggle changes', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [{ ...mockLookupKeys[0], private: false }] } }
      );

      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);
      await user.click(privacyToggle);

      await waitFor(() => {
        expect(formMethods.formState.isDirty).toBe(true);
        expect(formMethods.getValues().lookupKeys[0].private).toBe(true);
      });
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [emptyLookupKey] } }
      );

      // Trigger validation
      await formMethods.trigger('lookupKeys');

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate name pattern', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [{ ...emptyLookupKey, name: '123invalid' }] } }
      );

      const nameInput = screen.getByLabelText(/lookup key name for entry 1/i);
      await user.clear(nameInput);
      await user.type(nameInput, '123invalid');

      await formMethods.trigger('lookupKeys.0.name');

      await waitFor(() => {
        expect(screen.getByText(/name must start with a letter or underscore/i)).toBeInTheDocument();
      });
    });

    it('should validate unique names', async () => {
      const duplicateEntries = [
        { name: 'duplicate_key', value: 'value1', private: false },
        { name: 'duplicate_key', value: 'value2', private: false },
      ];

      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: duplicateEntries } }
      );

      await formMethods.trigger('lookupKeys');

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/key names must be unique/i);
        expect(errorMessages).toHaveLength(2);
      });
    });

    it('should validate maximum length constraints', async () => {
      const longName = 'a'.repeat(256); // Exceeds 255 character limit
      const longValue = 'a'.repeat(65536); // Exceeds 65535 character limit

      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [{ name: longName, value: longValue, private: false }] } }
      );

      await formMethods.trigger('lookupKeys');

      await waitFor(() => {
        expect(screen.getByText(/name must be 255 characters or less/i)).toBeInTheDocument();
        expect(screen.getByText(/value must be 65535 characters or less/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when fields are corrected', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [emptyLookupKey] } }
      );

      // Trigger validation to show errors
      await formMethods.trigger('lookupKeys');
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Fix the validation error
      const nameInput = screen.getByLabelText(/lookup key name for entry 1/i);
      await user.type(nameInput, 'valid_name');

      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // TABLE RENDERING AND DATA SOURCE MANAGEMENT TESTS
  // ============================================================================

  describe('Table Rendering and Data Source Management', () => {
    it('should render table headers correctly', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /private/i })).toBeInTheDocument();
    });

    it('should render table rows for each entry', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3); // Header row + 2 data rows
    });

    it('should handle dynamic data updates', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      // Initially empty
      expect(screen.getByText(/no lookup keys configured/i)).toBeInTheDocument();

      // Add entry
      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      // Should now show input fields
      await waitFor(() => {
        expect(screen.queryByText(/no lookup keys configured/i)).not.toBeInTheDocument();
        expect(screen.getByLabelText(/lookup key name for entry 1/i)).toBeInTheDocument();
      });
    });

    it('should show hover effects on table rows', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const rows = screen.getAllByRole('row');
      const dataRow = rows[1]; // First data row (skip header)
      expect(dataRow).toHaveClass('hover:bg-gray-50', 'dark:hover:bg-gray-800');
    });

    it('should disable name input for existing entries', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const nameInput = screen.getByDisplayValue('api_key');
      expect(nameInput).toBeDisabled();
    });

    it('should allow editing value for existing entries', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const valueInput = screen.getByDisplayValue('secret-key-123');
      expect(valueInput).not.toBeDisabled();
    });
  });

  // ============================================================================
  // CALLBACK FUNCTIONALITY TESTS
  // ============================================================================

  describe('Callback Functionality', () => {
    it('should call onEntriesChange when entries are modified', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" onEntriesChange={onEntriesChangeMock} />,
        { defaultValues: { lookupKeys: [] } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      await waitFor(() => {
        expect(onEntriesChangeMock).toHaveBeenCalledWith([
          expect.objectContaining({
            name: '',
            value: '',
            private: false,
          }),
        ]);
      });
    });

    it('should call onEntriesChange with current entries on mount', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" onEntriesChange={onEntriesChangeMock} />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      expect(onEntriesChangeMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'api_key' }),
          expect.objectContaining({ name: 'database_url' }),
        ])
      );
    });
  });

  // ============================================================================
  // ACCESSIBILITY COMPLIANCE TESTS (WCAG 2.1 AA)
  // ============================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      await testA11y(container);
    });

    it('should have proper ARIA labels for form elements', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" aria-label="Configure lookup keys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      expect(screen.getByLabelText(/lookup key name for entry 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/lookup key value for entry 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle privacy for api_key/i)).toBeInTheDocument();
    });

    it('should have proper ARIA roles for interactive elements', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);
      expect(privacyToggle).toHaveAttribute('role', 'switch');
      expect(privacyToggle).toHaveAttribute('aria-checked');
    });

    it('should announce validation errors to screen readers', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [emptyLookupKey] } }
      );

      await formMethods.trigger('lookupKeys');

      await waitFor(() => {
        const errorMessage = screen.getByText(/name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should have proper focus management', async () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [] } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      // Focus should be manageable on newly added input
      const nameInput = screen.getByLabelText(/lookup key name for entry 1/i);
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
    });

    it('should support custom aria-describedby', () => {
      renderWithForm(
        <LookupKeys 
          name="lookupKeys" 
          aria-describedby="lookup-keys-description"
        />,
        { defaultValues: { lookupKeys: [] } }
      );

      const container = screen.getByRole('button', { name: /toggle lookup keys section/i });
      expect(container).toHaveAttribute('aria-describedby', 'lookup-keys-description');
    });
  });

  // ============================================================================
  // KEYBOARD NAVIGATION TESTS
  // ============================================================================

  describe('Keyboard Navigation', () => {
    let keyboard: ReturnType<typeof createKeyboardUtils>;

    beforeEach(() => {
      keyboard = createKeyboardUtils(user);
    });

    it('should support Tab navigation through form elements', async () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const nameInput = screen.getByDisplayValue('api_key');
      const valueInput = screen.getByDisplayValue('secret-key-123');
      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);

      nameInput.focus();
      expect(keyboard.isFocused(nameInput)).toBe(true);

      await keyboard.tab();
      expect(keyboard.isFocused(valueInput)).toBe(true);

      await keyboard.tab();
      expect(keyboard.isFocused(privacyToggle)).toBe(true);
    });

    it('should support Enter key to toggle privacy switch', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);
      privacyToggle.focus();

      expect(privacyToggle).toHaveAttribute('aria-checked', 'true');

      await keyboard.enter();

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys[0].private).toBe(false);
      });
    });

    it('should support Space key to toggle privacy switch', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const privacyToggle = screen.getByLabelText(/toggle privacy for api_key/i);
      privacyToggle.focus();

      await keyboard.space();

      await waitFor(() => {
        expect(formMethods.getValues().lookupKeys[0].private).toBe(false);
      });
    });

    it('should support keyboard navigation to add/remove buttons', async () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      const removeButton = screen.getByLabelText(/remove lookup key entry api_key/i);

      addButton.focus();
      expect(keyboard.isFocused(addButton)).toBe(true);

      await keyboard.tab();
      await keyboard.tab();
      await keyboard.tab();
      await keyboard.tab();
      expect(keyboard.isFocused(removeButton)).toBe(true);
    });

    it('should skip disabled elements during tab navigation', () => {
      renderWithForm(
        <LookupKeys name="lookupKeys" disabled />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const nameInput = screen.getByDisplayValue('api_key');
      expect(nameInput).toBeDisabled();
      expect(nameInput).toHaveAttribute('tabindex', undefined);
    });
  });

  // ============================================================================
  // RESPONSIVE BEHAVIOR TESTS
  // ============================================================================

  describe('Responsive Behavior', () => {
    it('should handle table overflow on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320, // Mobile width
      });

      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const tableContainer = screen.getByRole('table').parentElement;
      expect(tableContainer).toHaveClass('overflow-x-auto');
    });

    it('should maintain usability on tablet sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet width
      });

      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      const table = screen.getByRole('table');
      expect(table).toHaveClass('min-w-full');
    });

    it('should handle long content gracefully', () => {
      const longValueEntry = {
        ...mockLookupKeys[0],
        value: 'a'.repeat(200), // Very long value
      };

      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [longValueEntry] } }
      );

      const valueInput = screen.getByDisplayValue(longValueEntry.value);
      expect(valueInput).toHaveClass('w-full');
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle form submission with validation errors', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: { lookupKeys: [emptyLookupKey] } }
      );

      const onSubmit = vi.fn();
      const onError = vi.fn();

      await formMethods.handleSubmit(onSubmit, onError)();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });

    it('should handle unexpected data gracefully', () => {
      const invalidData = {
        lookupKeys: [
          { name: null, value: undefined, private: 'invalid' },
        ],
      };

      renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { defaultValues: invalidData as any }
      );

      // Should not crash and render inputs with default values
      expect(screen.getByLabelText(/lookup key name for entry 1/i)).toBeInTheDocument();
    });

    it('should handle component unmounting gracefully', () => {
      const { unmount } = renderWithForm(
        <LookupKeys name="lookupKeys" onEntriesChange={onEntriesChangeMock} />,
        { defaultValues: { lookupKeys: mockLookupKeys } }
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should work with external form validation library', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" />,
        { 
          defaultValues: { lookupKeys: [] },
          mode: 'onChange'
        }
      );

      // Add entry and validate
      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);

      const nameInput = screen.getByLabelText(/lookup key name for entry 1/i);
      await user.type(nameInput, 'test_key');

      await waitFor(() => {
        expect(formMethods.formState.isValid).toBe(false); // Value is still empty
      });

      const valueInput = screen.getByLabelText(/lookup key value for entry 1/i);
      await user.type(valueInput, 'test_value');

      await waitFor(() => {
        expect(formMethods.formState.isValid).toBe(true);
      });
    });

    it('should handle complex user interactions', async () => {
      const { formMethods } = renderWithForm(
        <LookupKeys name="lookupKeys" onEntriesChange={onEntriesChangeMock} />,
        { defaultValues: { lookupKeys: [] } }
      );

      // Add multiple entries
      const addButton = screen.getByLabelText(/add new lookup key entry/i);
      await user.click(addButton);
      await user.click(addButton);

      // Fill in data
      const nameInputs = screen.getAllByLabelText(/lookup key name for entry/i);
      const valueInputs = screen.getAllByLabelText(/lookup key value for entry/i);

      await user.type(nameInputs[0], 'key1');
      await user.type(valueInputs[0], 'value1');
      await user.type(nameInputs[1], 'key2');
      await user.type(valueInputs[1], 'value2');

      // Toggle privacy
      const privacyToggles = screen.getAllByLabelText(/toggle privacy for/i);
      await user.click(privacyToggles[0]);

      // Remove first entry
      const removeButtons = screen.getAllByLabelText(/remove lookup key entry/i);
      await user.click(removeButtons[0]);

      await waitFor(() => {
        const finalData = formMethods.getValues().lookupKeys;
        expect(finalData).toHaveLength(1);
        expect(finalData[0].name).toBe('key2');
        expect(finalData[0].value).toBe('value2');
        expect(finalData[0].private).toBe(false);
      });

      expect(onEntriesChangeMock).toHaveBeenCalledTimes(6); // Called for each change
    });
  });
});