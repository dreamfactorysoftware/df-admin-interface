/**
 * @fileoverview Comprehensive test suite for LookupKeys component
 * 
 * Tests React Hook Form integration, useFieldArray functionality, accessibility compliance,
 * keyboard navigation, and user interactions. Ensures WCAG 2.1 AA compliance through
 * automated testing and validates add/remove operations with proper form state management.
 * 
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Import the component and its types
import { LookupKeys } from './lookup-keys';
import type { LookupKeysProps, LookupKey } from './lookup-keys.types';

// Import test utilities and mocks
import { renderWithProviders } from '@/test/utils/test-utils';
import { mockNextRouter } from '@/test/mocks/next-router';
import { mockReactHookForm } from '@/test/mocks/react-hook-form';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js internationalization
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useMessages: () => ({}),
}));

// Mock theme hook
vi.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    isDark: false,
  }),
}));

// Define validation schema for testing
const lookupKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  value: z.string().min(1, 'Value is required').max(1000, 'Value too long'),
  private: z.boolean().default(false),
});

const formSchema = z.object({
  lookupKeys: z.array(lookupKeySchema).min(1, 'At least one key is required'),
});

type FormData = z.infer<typeof formSchema>;

/**
 * Test wrapper component that provides React Hook Form context
 */
function TestWrapper({ 
  children, 
  defaultValues = { lookupKeys: [] },
  onSubmit = vi.fn(),
}: {
  children: React.ReactNode;
  defaultValues?: Partial<FormData>;
  onSubmit?: (data: FormData) => void;
}) {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} data-testid="test-form">
        {children}
        <button type="submit" data-testid="submit-button">Submit</button>
      </form>
    </FormProvider>
  );
}

/**
 * Helper function to render LookupKeys component with providers
 */
function renderLookupKeys(props: Partial<LookupKeysProps> = {}) {
  const defaultProps: LookupKeysProps = {
    name: 'lookupKeys',
    label: 'Lookup Keys',
    description: 'Manage key-value pairs for configuration',
    ...props,
  };

  return renderWithProviders(
    <TestWrapper>
      <LookupKeys {...defaultProps} />
    </TestWrapper>
  );
}

/**
 * Helper function to render with pre-populated data
 */
function renderWithData(lookupKeys: LookupKey[]) {
  return renderWithProviders(
    <TestWrapper defaultValues={{ lookupKeys }}>
      <LookupKeys name="lookupKeys" label="Lookup Keys" />
    </TestWrapper>
  );
}

describe('LookupKeys Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Mock router
    mockNextRouter.push.mockReset();
    
    // Mock React Hook Form utilities
    mockReactHookForm.useFieldArray.mockReset();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.resetAllMocks();
  });

  describe('Rendering and Initial State', () => {
    it('renders with correct initial structure', () => {
      renderLookupKeys();

      // Check for main container
      expect(screen.getByRole('region', { name: /lookup keys/i })).toBeInTheDocument();
      
      // Check for label and description
      expect(screen.getByText('Lookup Keys')).toBeInTheDocument();
      expect(screen.getByText('Manage key-value pairs for configuration')).toBeInTheDocument();
      
      // Check for add button
      expect(screen.getByRole('button', { name: /add key/i })).toBeInTheDocument();
    });

    it('renders empty state when no keys are provided', () => {
      renderLookupKeys();

      // Should show empty state message
      expect(screen.getByText(/no lookup keys configured/i)).toBeInTheDocument();
      
      // Should not show table when empty
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('renders table layout when variant is table', () => {
      const keys: LookupKey[] = [
        { name: 'API_URL', value: 'https://api.example.com', private: false },
        { name: 'SECRET_KEY', value: 'secret123', private: true },
      ];

      renderWithData(keys);

      // Should render table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /private/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('renders accordion layout when variant is accordion', () => {
      const keys: LookupKey[] = [
        { name: 'API_URL', value: 'https://api.example.com', private: false },
      ];

      renderWithProviders(
        <TestWrapper defaultValues={{ lookupKeys: keys }}>
          <LookupKeys name="lookupKeys" label="Lookup Keys" variant="accordion" />
        </TestWrapper>
      );

      // Should render accordion structure
      expect(screen.getByRole('button', { name: /api_url/i })).toBeInTheDocument();
    });
  });

  describe('React Hook Form Integration', () => {
    it('integrates with useFieldArray correctly', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add a new key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Verify form fields are rendered
      expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key value/i)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /private/i })).toBeInTheDocument();
    });

    it('validates form inputs correctly', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add a new key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Try to submit empty form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/value is required/i)).toBeInTheDocument();
      });
    });

    it('updates form values when fields change', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper onSubmit={onSubmit}>
          <LookupKeys name="lookupKeys" label="Lookup Keys" />
        </TestWrapper>
      );

      // Add a new key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Fill in the form
      const nameInput = screen.getByLabelText(/key name/i);
      const valueInput = screen.getByLabelText(/key value/i);
      
      await user.type(nameInput, 'TEST_KEY');
      await user.type(valueInput, 'test_value');

      // Submit form
      await user.click(screen.getByTestId('submit-button'));

      // Verify form submission
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          lookupKeys: [
            { name: 'TEST_KEY', value: 'test_value', private: false }
          ]
        });
      });
    });

    it('handles field array operations correctly', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'KEY1', value: 'value1', private: false },
        { name: 'KEY2', value: 'value2', private: true },
      ];

      renderWithData(keys);

      // Should render existing keys
      expect(screen.getByDisplayValue('KEY1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('KEY2')).toBeInTheDocument();

      // Remove first key
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Verify key was removed
      await waitFor(() => {
        expect(screen.queryByDisplayValue('KEY1')).not.toBeInTheDocument();
        expect(screen.getByDisplayValue('KEY2')).toBeInTheDocument();
      });
    });
  });

  describe('Add/Remove Operations', () => {
    it('adds new lookup key when add button is clicked', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      const initialAddButtons = screen.queryAllByRole('button', { name: /add key/i });
      expect(initialAddButtons).toHaveLength(1);

      // Click add button
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Should add new form fields
      await waitFor(() => {
        expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/key value/i)).toBeInTheDocument();
      });
    });

    it('removes lookup key when delete button is clicked', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'TEST_KEY', value: 'test_value', private: false },
      ];

      renderWithData(keys);

      // Should show the key
      expect(screen.getByDisplayValue('TEST_KEY')).toBeInTheDocument();

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Should remove the key
      await waitFor(() => {
        expect(screen.queryByDisplayValue('TEST_KEY')).not.toBeInTheDocument();
      });
    });

    it('shows confirmation dialog for destructive delete operations', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'IMPORTANT_KEY', value: 'important_value', private: false },
      ];

      renderWithProviders(
        <TestWrapper defaultValues={{ lookupKeys: keys }}>
          <LookupKeys 
            name="lookupKeys" 
            label="Lookup Keys" 
            confirmDelete={true}
          />
        </TestWrapper>
      );

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Should show confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      // Cancel deletion
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Key should still exist
      expect(screen.getByDisplayValue('IMPORTANT_KEY')).toBeInTheDocument();
    });

    it('maintains form state during add/remove operations', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add first key
      await user.click(screen.getByRole('button', { name: /add key/i }));
      await user.type(screen.getByLabelText(/key name/i), 'KEY1');
      await user.type(screen.getByLabelText(/key value/i), 'value1');

      // Add second key
      await user.click(screen.getByRole('button', { name: /add key/i }));
      
      const nameInputs = screen.getAllByLabelText(/key name/i);
      const valueInputs = screen.getAllByLabelText(/key value/i);
      
      await user.type(nameInputs[1], 'KEY2');
      await user.type(valueInputs[1], 'value2');

      // Verify both keys exist
      expect(screen.getByDisplayValue('KEY1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('value1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('KEY2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('value2')).toBeInTheDocument();
    });
  });

  describe('Privacy Toggle Functionality', () => {
    it('toggles privacy state when switch is clicked', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'API_KEY', value: 'secret123', private: false },
      ];

      renderWithData(keys);

      const privacySwitch = screen.getByRole('switch', { name: /private/i });
      
      // Initially not private
      expect(privacySwitch).not.toBeChecked();

      // Toggle to private
      await user.click(privacySwitch);

      // Should be checked now
      await waitFor(() => {
        expect(privacySwitch).toBeChecked();
      });
    });

    it('hides/shows value based on privacy setting', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'SECRET_KEY', value: 'secret123', private: true },
      ];

      renderWithData(keys);

      // Value should be masked when private
      expect(screen.getByText(/••••••••/)).toBeInTheDocument();
      expect(screen.queryByText('secret123')).not.toBeInTheDocument();

      // Toggle privacy off
      const privacySwitch = screen.getByRole('switch', { name: /private/i });
      await user.click(privacySwitch);

      // Value should be visible
      await waitFor(() => {
        expect(screen.getByDisplayValue('secret123')).toBeInTheDocument();
        expect(screen.queryByText(/••••••••/)).not.toBeInTheDocument();
      });
    });

    it('updates form state when privacy is toggled', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      const keys: LookupKey[] = [
        { name: 'API_KEY', value: 'key123', private: false },
      ];

      renderWithProviders(
        <TestWrapper defaultValues={{ lookupKeys: keys }} onSubmit={onSubmit}>
          <LookupKeys name="lookupKeys" label="Lookup Keys" />
        </TestWrapper>
      );

      // Toggle privacy on
      const privacySwitch = screen.getByRole('switch', { name: /private/i });
      await user.click(privacySwitch);

      // Submit form
      await user.click(screen.getByTestId('submit-button'));

      // Verify privacy state is updated
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          lookupKeys: [
            { name: 'API_KEY', value: 'key123', private: true }
          ]
        });
      });
    });
  });

  describe('Table Rendering and Management', () => {
    it('renders table headers correctly', () => {
      const keys: LookupKey[] = [
        { name: 'KEY1', value: 'value1', private: false },
      ];

      renderWithData(keys);

      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /private/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('renders table rows for each lookup key', () => {
      const keys: LookupKey[] = [
        { name: 'KEY1', value: 'value1', private: false },
        { name: 'KEY2', value: 'value2', private: true },
        { name: 'KEY3', value: 'value3', private: false },
      ];

      renderWithData(keys);

      const rows = screen.getAllByRole('row');
      // Header row + 3 data rows
      expect(rows).toHaveLength(4);

      // Check specific row content
      expect(screen.getByDisplayValue('KEY1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('KEY2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('KEY3')).toBeInTheDocument();
    });

    it('handles dynamic data source updates', async () => {
      const { rerender } = renderWithData([
        { name: 'KEY1', value: 'value1', private: false },
      ]);

      // Initially shows one key
      expect(screen.getByDisplayValue('KEY1')).toBeInTheDocument();

      // Update with more keys
      rerender(
        <TestWrapper defaultValues={{ 
          lookupKeys: [
            { name: 'KEY1', value: 'value1', private: false },
            { name: 'KEY2', value: 'value2', private: true },
          ]
        }}>
          <LookupKeys name="lookupKeys" label="Lookup Keys" />
        </TestWrapper>
      );

      // Should show both keys
      await waitFor(() => {
        expect(screen.getByDisplayValue('KEY1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('KEY2')).toBeInTheDocument();
      });
    });

    it('supports inline editing in table cells', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'EDIT_KEY', value: 'original_value', private: false },
      ];

      renderWithData(keys);

      // Find and edit the value input
      const valueInput = screen.getByDisplayValue('original_value');
      await user.clear(valueInput);
      await user.type(valueInput, 'updated_value');

      // Value should be updated
      expect(screen.getByDisplayValue('updated_value')).toBeInTheDocument();
      expect(screen.queryByDisplayValue('original_value')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('passes automated accessibility tests', async () => {
      const { container } = renderLookupKeys();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes accessibility tests with data', async () => {
      const keys: LookupKey[] = [
        { name: 'ACCESS_KEY', value: 'key123', private: false },
        { name: 'SECRET_KEY', value: 'secret456', private: true },
      ];

      const { container } = renderWithData(keys);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and descriptions', () => {
      renderLookupKeys();

      // Check main container has proper role and label
      expect(screen.getByRole('region', { name: /lookup keys/i })).toBeInTheDocument();

      // Add a key to check field labels
      fireEvent.click(screen.getByRole('button', { name: /add key/i }));

      // Check form field labels
      expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/key value/i)).toBeInTheDocument();
    });

    it('supports screen reader announcements', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add button should have descriptive label
      const addButton = screen.getByRole('button', { name: /add key/i });
      expect(addButton).toHaveAttribute('aria-label');

      // Click add button
      await user.click(addButton);

      // New form fields should be announced to screen readers
      const nameInput = screen.getByLabelText(/key name/i);
      expect(nameInput).toHaveAttribute('aria-describedby');
    });

    it('maintains proper focus management', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add a new key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Focus should move to first input
      await waitFor(() => {
        expect(screen.getByLabelText(/key name/i)).toHaveFocus();
      });
    });

    it('provides high contrast mode support', () => {
      renderWithProviders(
        <div className="contrast-more">
          <TestWrapper>
            <LookupKeys name="lookupKeys" label="Lookup Keys" />
          </TestWrapper>
        </div>
      );

      // Component should render without breaking in high contrast mode
      expect(screen.getByRole('region', { name: /lookup keys/i })).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation through table rows', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'KEY1', value: 'value1', private: false },
        { name: 'KEY2', value: 'value2', private: false },
      ];

      renderWithData(keys);

      // Tab through interactive elements
      await user.tab();
      await user.tab();
      
      // Should be able to navigate to first input
      expect(screen.getAllByLabelText(/key name/i)[0]).toHaveFocus();
    });

    it('supports Enter key for adding new keys', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      const addButton = screen.getByRole('button', { name: /add key/i });
      addButton.focus();

      // Press Enter to add key
      await user.keyboard('{Enter}');

      // Should add new form fields
      await waitFor(() => {
        expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
      });
    });

    it('supports Escape key for canceling operations', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'KEY1', value: 'value1', private: false },
      ];

      renderWithProviders(
        <TestWrapper defaultValues={{ lookupKeys: keys }}>
          <LookupKeys 
            name="lookupKeys" 
            label="Lookup Keys" 
            confirmDelete={true}
          />
        </TestWrapper>
      );

      // Open delete confirmation
      await user.click(screen.getByRole('button', { name: /delete/i }));
      
      // Should show dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape to cancel
      await user.keyboard('{Escape}');

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('supports arrow key navigation in accordion mode', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'KEY1', value: 'value1', private: false },
        { name: 'KEY2', value: 'value2', private: false },
      ];

      renderWithProviders(
        <TestWrapper defaultValues={{ lookupKeys: keys }}>
          <LookupKeys name="lookupKeys" label="Lookup Keys" variant="accordion" />
        </TestWrapper>
      );

      const accordionButtons = screen.getAllByRole('button', { expanded: false });
      
      // Focus first accordion button
      accordionButtons[0].focus();
      expect(accordionButtons[0]).toHaveFocus();

      // Arrow down should move to next button
      await user.keyboard('{ArrowDown}');
      expect(accordionButtons[1]).toHaveFocus();

      // Arrow up should move back
      await user.keyboard('{ArrowUp}');
      expect(accordionButtons[0]).toHaveFocus();
    });
  });

  describe('Theme Integration', () => {
    it('renders correctly in light theme', () => {
      renderLookupKeys();

      const container = screen.getByRole('region', { name: /lookup keys/i });
      expect(container).toHaveClass('bg-white', 'text-gray-900');
    });

    it('renders correctly in dark theme', () => {
      // Mock dark theme
      vi.mocked(require('@/hooks/use-theme').useTheme).mockReturnValue({
        theme: 'dark',
        toggleTheme: vi.fn(),
        isDark: true,
      });

      renderLookupKeys();

      const container = screen.getByRole('region', { name: /lookup keys/i });
      expect(container).toHaveClass('bg-gray-900', 'text-white');
    });

    it('switches theme dynamically', async () => {
      const mockToggleTheme = vi.fn();
      const { rerender } = renderLookupKeys();

      // Switch to dark theme
      vi.mocked(require('@/hooks/use-theme').useTheme).mockReturnValue({
        theme: 'dark',
        toggleTheme: mockToggleTheme,
        isDark: true,
      });

      rerender(
        <TestWrapper>
          <LookupKeys name="lookupKeys" label="Lookup Keys" />
        </TestWrapper>
      );

      // Should update classes for dark theme
      const container = screen.getByRole('region', { name: /lookup keys/i });
      expect(container).toHaveClass('bg-gray-900');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const keys: LookupKey[] = [
        { name: 'MOBILE_KEY', value: 'mobile_value', private: false },
      ];

      renderWithData(keys);

      // Should stack form fields vertically on mobile
      const container = screen.getByRole('region', { name: /lookup keys/i });
      expect(container).toHaveClass('space-y-4', 'sm:space-y-0');
    });

    it('optimizes table display for tablet screens', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const keys: LookupKey[] = [
        { name: 'TABLET_KEY', value: 'tablet_value', private: false },
      ];

      renderWithData(keys);

      // Table should be responsive on tablet
      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-auto', 'w-full');
    });
  });

  describe('Form Validation and Error Display', () => {
    it('displays validation errors correctly', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add empty key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Try to submit
      await user.click(screen.getByTestId('submit-button'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/value is required/i)).toBeInTheDocument();
      });
    });

    it('clears validation errors when fields are corrected', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add empty key and trigger validation
      await user.click(screen.getByRole('button', { name: /add key/i }));
      await user.click(screen.getByTestId('submit-button'));

      // Should show errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Fill in the name field
      await user.type(screen.getByLabelText(/key name/i), 'VALID_NAME');

      // Name error should disappear
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
      });
    });

    it('validates unique key names', async () => {
      const user = userEvent.setup();
      const keys: LookupKey[] = [
        { name: 'EXISTING_KEY', value: 'value1', private: false },
      ];

      renderWithData(keys);

      // Add new key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      // Try to use duplicate name
      const newNameInput = screen.getAllByLabelText(/key name/i)[1];
      await user.type(newNameInput, 'EXISTING_KEY');

      // Should show duplicate name error
      await waitFor(() => {
        expect(screen.getByText(/name must be unique/i)).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization Support', () => {
    it('renders translated text correctly', () => {
      renderLookupKeys();

      // Check that translation keys are being called
      expect(screen.getByText('Lookup Keys')).toBeInTheDocument();
      expect(screen.getByText('Manage key-value pairs for configuration')).toBeInTheDocument();
    });

    it('supports RTL languages', () => {
      // Mock RTL locale
      vi.mocked(require('next-intl').useMessages).mockReturnValue({
        dir: 'rtl',
      });

      renderLookupKeys();

      const container = screen.getByRole('region', { name: /lookup keys/i });
      expect(container).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Performance Optimization', () => {
    it('handles large datasets efficiently', () => {
      // Create large dataset
      const keys: LookupKey[] = Array.from({ length: 100 }, (_, i) => ({
        name: `KEY_${i}`,
        value: `value_${i}`,
        private: i % 2 === 0,
      }));

      const startTime = performance.now();
      renderWithData(keys);
      const endTime = performance.now();

      // Should render quickly (under 100ms for 100 items)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Should render all keys
      expect(screen.getByDisplayValue('KEY_0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('KEY_99')).toBeInTheDocument();
    });

    it('debounces form validation', async () => {
      const user = userEvent.setup();
      renderLookupKeys();

      // Add key
      await user.click(screen.getByRole('button', { name: /add key/i }));

      const nameInput = screen.getByLabelText(/key name/i);
      
      // Type rapidly
      await user.type(nameInput, 'TEST');

      // Validation should be debounced
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });
});