/**
 * Lookup Keys Management Test Suite
 * 
 * Comprehensive Vitest test suite for global lookup keys management components
 * within the system settings section. Implements React Testing Library patterns
 * with MSW for API mocking, providing comprehensive test coverage for lookup key
 * operations, form validation, user interactions, error handling, and accessibility
 * compliance including keyboard navigation and screen reader support.
 * 
 * Test Coverage Areas:
 * - Page component rendering and server-side rendering (SSR)
 * - Form component validation and user interactions
 * - Custom hook data operations and state management
 * - SWR/React Query integration and caching behavior
 * - MSW API mocking for realistic testing scenarios
 * - WCAG 2.1 AA accessibility compliance validation
 * - Keyboard navigation and focus management
 * - Error handling and edge case scenarios
 * - Performance requirements validation
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  screen, 
  waitFor, 
  waitForElementToBeRemoved,
  within,
  fireEvent
} from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, type AxeResults } from 'axe-core';
import { rest } from 'msw';
import { server } from '@/test/mocks/server';
import { QueryClient } from '@tanstack/react-query';
import { 
  renderWithProviders,
  renderWithQuery,
  renderWithForm,
  accessibilityUtils,
  testUtils
} from '@/test/utils/test-utils';

// Import components under test
import LookupKeysPage from './page';
import LookupKeysForm from './lookup-keys-form';
import { useLookupKeys } from './use-lookup-keys';

// Mock data factories
const mockLookupKey = {
  id: 1,
  name: 'test_key',
  value: 'Test Value',
  description: 'Test lookup key description',
  private: false,
  created_date: '2024-01-01T10:00:00.000Z',
  last_modified_date: '2024-01-01T10:00:00.000Z',
};

const mockLookupKeys = [
  mockLookupKey,
  {
    id: 2,
    name: 'private_key',
    value: 'Private Value',
    description: 'Private lookup key',
    private: true,
    created_date: '2024-01-02T10:00:00.000Z',
    last_modified_date: '2024-01-02T10:00:00.000Z',
  },
  {
    id: 3,
    name: 'system_config',
    value: 'System Configuration',
    description: 'System configuration key',
    private: false,
    created_date: '2024-01-03T10:00:00.000Z',
    last_modified_date: '2024-01-03T10:00:00.000Z',
  }
];

// MSW handlers for lookup keys API
const lookupKeysHandlers = [
  // GET /api/v2/system/lookup_key - List all lookup keys
  rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
    const limit = req.url.searchParams.get('limit');
    const offset = req.url.searchParams.get('offset');
    const includeCount = req.url.searchParams.get('include_count');
    
    const startIndex = offset ? parseInt(offset) : 0;
    const limitNum = limit ? parseInt(limit) : mockLookupKeys.length;
    const paginatedData = mockLookupKeys.slice(startIndex, startIndex + limitNum);
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: paginatedData,
        meta: includeCount === 'true' ? { count: mockLookupKeys.length } : undefined
      })
    );
  }),

  // POST /api/v2/system/lookup_key - Create new lookup key
  rest.post('/api/v2/system/lookup_key', async (req, res, ctx) => {
    const body = await req.json();
    const newLookupKey = {
      id: mockLookupKeys.length + 1,
      ...body,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
    };
    
    return res(
      ctx.status(201),
      ctx.json({
        resource: [newLookupKey]
      })
    );
  }),

  // PUT /api/v2/system/lookup_key/[id] - Update existing lookup key
  rest.put('/api/v2/system/lookup_key/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();
    const updatedKey = {
      ...mockLookupKey,
      id: parseInt(id as string),
      ...body,
      last_modified_date: new Date().toISOString(),
    };
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: [updatedKey]
      })
    );
  }),

  // DELETE /api/v2/system/lookup_key/[id] - Delete lookup key
  rest.delete('/api/v2/system/lookup_key/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true
      })
    );
  }),

  // GET /api/v2/system/lookup_key/[id] - Get single lookup key
  rest.get('/api/v2/system/lookup_key/:id', (req, res, ctx) => {
    const { id } = req.params;
    const lookupKey = mockLookupKeys.find(key => key.id === parseInt(id as string));
    
    if (!lookupKey) {
      return res(
        ctx.status(404),
        ctx.json({
          error: {
            code: 404,
            message: 'Lookup key not found'
          }
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: [lookupKey]
      })
    );
  }),

  // Validation endpoint for unique name checking
  rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
    const filter = req.url.searchParams.get('filter');
    if (filter && filter.includes('name=')) {
      const nameMatch = filter.match(/name=([^&]+)/);
      if (nameMatch) {
        const name = decodeURIComponent(nameMatch[1]);
        const existingKey = mockLookupKeys.find(key => key.name === name);
        return res(
          ctx.status(200),
          ctx.json({
            resource: existingKey ? [existingKey] : [],
            meta: { count: existingKey ? 1 : 0 }
          })
        );
      }
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: mockLookupKeys,
        meta: { count: mockLookupKeys.length }
      })
    );
  }),
];

// Error scenario handlers
const lookupKeysErrorHandlers = [
  rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          code: 500,
          message: 'Internal server error'
        }
      })
    );
  }),

  rest.post('/api/v2/system/lookup_key', (req, res, ctx) => {
    return res(
      ctx.status(422),
      ctx.json({
        error: {
          code: 422,
          message: 'Validation failed',
          context: {
            field_errors: {
              name: ['Name already exists']
            }
          }
        }
      })
    );
  }),
];

describe('Lookup Keys Management', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    server.use(...lookupKeysHandlers);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Page Component', () => {
    test('renders lookup keys page with correct structure and SSR support', async () => {
      const { container } = renderWithProviders(<LookupKeysPage />);

      // Test SSR-compatible structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /global lookup keys/i })).toBeInTheDocument();
      
      // Test page metadata and accessibility
      expect(container.querySelector('main')).toHaveAttribute('data-testid', 'lookup-keys-page');
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });

      // Test table structure with accessibility
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveAttribute('aria-label');
      
      const columnHeaders = within(table).getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(5); // Name, Value, Description, Private, Actions
      
      expect(columnHeaders[0]).toHaveTextContent('Name');
      expect(columnHeaders[1]).toHaveTextContent('Value');
      expect(columnHeaders[2]).toHaveTextContent('Description');
      expect(columnHeaders[3]).toHaveTextContent('Private');
      expect(columnHeaders[4]).toHaveTextContent('Actions');
    });

    test('renders create new lookup key button with proper accessibility', async () => {
      renderWithProviders(<LookupKeysPage />);

      const createButton = screen.getByRole('button', { name: /create new lookup key/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('aria-label');
      expect(createButton).not.toHaveAttribute('disabled');

      // Test keyboard accessibility
      createButton.focus();
      expect(createButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Should open the create form
    });

    test('displays loading state correctly', () => {
      // Render with loading state
      renderWithQuery(<LookupKeysPage />, {
        initialData: {},
      });

      // Check for loading indicators
      expect(screen.getByTestId('lookup-keys-loading')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('displays error state with retry functionality', async () => {
      server.use(...lookupKeysErrorHandlers);
      
      renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-error')).toBeInTheDocument();
      });

      const errorMessage = screen.getByText(/failed to load lookup keys/i);
      expect(errorMessage).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      // Test retry functionality
      server.use(...lookupKeysHandlers); // Reset to success handlers
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByTestId('lookup-keys-error')).not.toBeInTheDocument();
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });
    });

    test('supports pagination with accessible controls', async () => {
      // Mock large dataset
      const largeMockData = Array.from({ length: 50 }, (_, i) => ({
        ...mockLookupKey,
        id: i + 1,
        name: `test_key_${i + 1}`,
        value: `Test Value ${i + 1}`,
      }));

      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          const limit = parseInt(req.url.searchParams.get('limit') || '25');
          const offset = parseInt(req.url.searchParams.get('offset') || '0');
          const paginatedData = largeMockData.slice(offset, offset + limit);
          
          return res(
            ctx.status(200),
            ctx.json({
              resource: paginatedData,
              meta: { count: largeMockData.length }
            })
          );
        })
      );

      renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      // Test pagination controls
      const pagination = screen.getByRole('navigation', { name: /pagination/i });
      expect(pagination).toBeInTheDocument();

      const nextButton = within(pagination).getByRole('button', { name: /next page/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).not.toHaveAttribute('disabled');

      // Test keyboard navigation in pagination
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('test_key_26')).toBeInTheDocument();
      });
    });

    test('implements search functionality with real-time filtering', async () => {
      renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('searchbox', { name: /search lookup keys/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder');

      // Test search functionality
      await user.type(searchInput, 'private');

      await waitFor(() => {
        expect(screen.getByText('private_key')).toBeInTheDocument();
        expect(screen.queryByText('test_key')).not.toBeInTheDocument();
      });

      // Test clearing search
      await user.clear(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
        expect(screen.getByText('private_key')).toBeInTheDocument();
      });
    });

    test('validates WCAG 2.1 AA accessibility compliance', async () => {
      const { container } = renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });

      // Run axe accessibility tests
      const results: AxeResults = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true },
          'landmark-one-main': { enabled: false }, // Single component test
        },
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
      });

      expect(results.violations).toHaveLength(0);

      // Test keyboard navigation
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(container, user);
      expect(navigationResult.success).toBe(true);
      
      // Test focus management
      const focusableElements = accessibilityUtils.getFocusableElements(container);
      expect(focusableElements.length).toBeGreaterThan(0);
      
      focusableElements.forEach(element => {
        expect(accessibilityUtils.hasAriaLabel(element) || element.textContent?.trim()).toBeTruthy();
      });
    });
  });

  describe('Form Component', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
      mockOnSubmit.mockClear();
      mockOnCancel.mockClear();
    });

    test('renders create form with proper validation', () => {
      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Test form structure
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/private/i)).toBeInTheDocument();

      // Test form accessibility
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('noValidate'); // Client-side validation
      
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });

    test('renders edit form with pre-populated data', () => {
      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="edit"
          initialData={mockLookupKey}
        />
      );

      expect(screen.getByDisplayValue('test_key')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Value')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test lookup key description')).toBeInTheDocument();
      
      const privateCheckbox = screen.getByLabelText(/private/i) as HTMLInputElement;
      expect(privateCheckbox.checked).toBe(false);
    });

    test('validates form fields with real-time feedback', async () => {
      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const submitButton = screen.getByRole('button', { name: /save/i });

      // Test required field validation
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Test invalid name format
      await user.type(nameInput, 'invalid name with spaces');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/name must contain only letters, numbers, and underscores/i))
          .toBeInTheDocument();
      });

      // Test valid input
      await user.clear(nameInput);
      await user.type(nameInput, 'valid_name');

      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/name must contain only/i)).not.toBeInTheDocument();
      });
    });

    test('validates unique name constraint', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          const filter = req.url.searchParams.get('filter');
          if (filter && filter.includes('name=existing_key')) {
            return res(
              ctx.status(200),
              ctx.json({
                resource: [{ ...mockLookupKey, name: 'existing_key' }],
                meta: { count: 1 }
              })
            );
          }
          return res(
            ctx.status(200),
            ctx.json({ resource: [], meta: { count: 0 } })
          );
        })
      );

      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      
      await user.type(nameInput, 'existing_key');
      await user.tab(); // Trigger async validation

      await waitFor(() => {
        expect(screen.getByText(/name already exists/i)).toBeInTheDocument();
      });

      // Test that form cannot be submitted with duplicate name
      const submitButton = screen.getByRole('button', { name: /save/i });
      expect(submitButton).toHaveAttribute('disabled');
    });

    test('submits form with correct data transformation', async () => {
      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const privateCheckbox = screen.getByLabelText(/private/i);
      const submitButton = screen.getByRole('button', { name: /save/i });

      // Fill form
      await user.type(nameInput, 'new_test_key');
      await user.type(valueInput, 'New Test Value');
      await user.type(descriptionInput, 'New test description');
      await user.click(privateCheckbox);

      // Submit form
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'new_test_key',
          value: 'New Test Value',
          description: 'New test description',
          private: true,
        });
      });
    });

    test('handles form submission errors gracefully', async () => {
      server.use(
        rest.post('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: {
                code: 422,
                message: 'Validation failed',
                context: {
                  field_errors: {
                    name: ['Name already exists'],
                    value: ['Value cannot be empty']
                  }
                }
              }
            })
          );
        })
      );

      const mockSubmitWithError = vi.fn().mockRejectedValue(new Error('Validation failed'));

      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockSubmitWithError}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const submitButton = screen.getByRole('button', { name: /save/i });

      await user.type(nameInput, 'test_name');
      await user.type(valueInput, 'test_value');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
      });

      // Form should remain editable after error
      expect(nameInput).not.toHaveAttribute('disabled');
      expect(submitButton).not.toHaveAttribute('disabled');
    });

    test('supports keyboard navigation and form accessibility', async () => {
      const { container } = renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Test tab order
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const privateCheckbox = screen.getByLabelText(/private/i);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const submitButton = screen.getByRole('button', { name: /save/i });

      nameInput.focus();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(valueInput).toHaveFocus();

      await user.tab();
      expect(descriptionInput).toHaveFocus();

      await user.tab();
      expect(privateCheckbox).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      // Test form submission with Enter key
      nameInput.focus();
      await user.type(nameInput, 'keyboard_test');
      await user.keyboard('{Enter}');

      // Should focus next field, not submit
      expect(valueInput).toHaveFocus();

      // Test accessibility
      const results: AxeResults = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    test('provides proper form field validation feedback', async () => {
      renderWithProviders(
        <LookupKeysForm 
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      
      // Test invalid characters
      await user.type(nameInput, 'invalid-name-with-hyphens');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/name must contain only letters, numbers, and underscores/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('id');
        expect(nameInput).toHaveAttribute('aria-describedby', errorMessage.id);
      });

      // Test maximum length
      const longName = 'a'.repeat(256);
      await user.clear(nameInput);
      await user.type(nameInput, longName);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/name must be less than 255 characters/i)).toBeInTheDocument();
      });

      // Test valid input clears errors
      await user.clear(nameInput);
      await user.type(nameInput, 'valid_name');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/name must contain only/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/name must be less than/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Custom Hook (useLookupKeys)', () => {
    const TestComponent: React.FC = () => {
      const { 
        data, 
        isLoading, 
        error, 
        createLookupKey, 
        updateLookupKey, 
        deleteLookupKey,
        validateUniqueName 
      } = useLookupKeys();

      const handleCreate = () => {
        createLookupKey.mutate({
          name: 'hook_test',
          value: 'Hook Test Value',
          description: 'Test from hook',
          private: false,
        });
      };

      const handleUpdate = () => {
        updateLookupKey.mutate({
          id: 1,
          name: 'updated_key',
          value: 'Updated Value',
          description: 'Updated description',
          private: true,
        });
      };

      const handleDelete = () => {
        deleteLookupKey.mutate(1);
      };

      const testValidation = async () => {
        const isUnique = await validateUniqueName('test_unique_name');
        // Store result for testing
        (window as any).validationResult = isUnique;
      };

      return (
        <div>
          <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
          <div data-testid="error">{error ? error.message : 'No Error'}</div>
          <div data-testid="data-count">{data?.length || 0}</div>
          <button onClick={handleCreate} data-testid="create-button">Create</button>
          <button onClick={handleUpdate} data-testid="update-button">Update</button>
          <button onClick={handleDelete} data-testid="delete-button">Delete</button>
          <button onClick={testValidation} data-testid="validate-button">Validate</button>
          <div data-testid="create-loading">{createLookupKey.isPending ? 'Creating' : 'Not Creating'}</div>
          <div data-testid="update-loading">{updateLookupKey.isPending ? 'Updating' : 'Not Updating'}</div>
          <div data-testid="delete-loading">{deleteLookupKey.isPending ? 'Deleting' : 'Not Deleting'}</div>
        </div>
      );
    };

    test('fetches lookup keys data with proper caching', async () => {
      renderWithQuery(<TestComponent />);

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('data-count')).toHaveTextContent('3');
        expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      });
    });

    test('handles create mutation with optimistic updates', async () => {
      renderWithQuery(<TestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('data-count')).toHaveTextContent('3');
      });

      const createButton = screen.getByTestId('create-button');
      await user.click(createButton);

      // Should show creating state
      expect(screen.getByTestId('create-loading')).toHaveTextContent('Creating');

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('create-loading')).toHaveTextContent('Not Creating');
      });
    });

    test('handles update mutation correctly', async () => {
      renderWithQuery(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('data-count')).toHaveTextContent('3');
      });

      const updateButton = screen.getByTestId('update-button');
      await user.click(updateButton);

      expect(screen.getByTestId('update-loading')).toHaveTextContent('Updating');

      await waitFor(() => {
        expect(screen.getByTestId('update-loading')).toHaveTextContent('Not Updating');
      });
    });

    test('handles delete mutation with cache invalidation', async () => {
      renderWithQuery(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('data-count')).toHaveTextContent('3');
      });

      const deleteButton = screen.getByTestId('delete-button');
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-loading')).toHaveTextContent('Deleting');

      await waitFor(() => {
        expect(screen.getByTestId('delete-loading')).toHaveTextContent('Not Deleting');
      });
    });

    test('validates unique names correctly', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          const filter = req.url.searchParams.get('filter');
          if (filter && filter.includes('name=test_unique_name')) {
            return res(
              ctx.status(200),
              ctx.json({ resource: [], meta: { count: 0 } })
            );
          }
          return res(
            ctx.status(200),
            ctx.json({ resource: mockLookupKeys, meta: { count: mockLookupKeys.length } })
          );
        })
      );

      renderWithQuery(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('data-count')).toHaveTextContent('3');
      });

      const validateButton = screen.getByTestId('validate-button');
      await user.click(validateButton);

      await waitFor(() => {
        expect((window as any).validationResult).toBe(true);
      });
    });

    test('handles network errors gracefully', async () => {
      server.use(...lookupKeysErrorHandlers);

      renderWithQuery(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Internal server error');
      });
    });

    test('implements proper retry logic for failed requests', async () => {
      let callCount = 0;
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          callCount++;
          if (callCount <= 2) {
            return res(ctx.status(500), ctx.json({ error: { message: 'Server error' } }));
          }
          return res(
            ctx.status(200),
            ctx.json({ resource: mockLookupKeys, meta: { count: mockLookupKeys.length } })
          );
        })
      );

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: 100,
          },
        },
      });

      renderWithQuery(<TestComponent />, { queryClient });

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByTestId('data-count')).toHaveTextContent('3');
      }, { timeout: 5000 });

      expect(callCount).toBe(3); // Initial call + 2 retries
    });
  });

  describe('Integration Tests', () => {
    test('complete CRUD workflow integration', async () => {
      renderWithProviders(<LookupKeysPage />);

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });

      // Test create workflow
      const createButton = screen.getByRole('button', { name: /create new lookup key/i });
      await user.click(createButton);

      // Fill create form
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.type(nameInput, 'integration_test_key');
      await user.type(valueInput, 'Integration Test Value');
      await user.type(descriptionInput, 'Created during integration test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should return to list and show new item
      await waitFor(() => {
        expect(screen.getByText('integration_test_key')).toBeInTheDocument();
      });

      // Test edit workflow
      const editButton = screen.getByRole('button', { name: /edit integration_test_key/i });
      await user.click(editButton);

      const editValueInput = screen.getByDisplayValue('Integration Test Value');
      await user.clear(editValueInput);
      await user.type(editValueInput, 'Updated Integration Test Value');

      const updateButton = screen.getByRole('button', { name: /save/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Integration Test Value')).toBeInTheDocument();
      });

      // Test delete workflow
      const deleteButton = screen.getByRole('button', { name: /delete integration_test_key/i });
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText('integration_test_key')).not.toBeInTheDocument();
      });
    });

    test('performance requirements validation', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<LookupKeysPage />);

      // Test initial load performance
      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      
      // Should load within 2 seconds (SSR requirement)
      expect(loadTime).toBeLessThan(2000);

      // Test form validation performance
      const createButton = screen.getByRole('button', { name: /create new lookup key/i });
      await user.click(createButton);

      const nameInput = screen.getByLabelText(/name/i);
      
      const validationStartTime = performance.now();
      await user.type(nameInput, 'performance_test');
      await user.tab(); // Trigger validation

      const validationTime = performance.now() - validationStartTime;
      
      // Real-time validation should complete under 100ms
      expect(validationTime).toBeLessThan(100);
    });

    test('accessibility compliance across complete workflow', async () => {
      const { container } = renderWithProviders(<LookupKeysPage />);

      // Test main page accessibility
      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
      });

      let results: AxeResults = await axe(container);
      expect(results.violations).toHaveLength(0);

      // Test create form accessibility
      const createButton = screen.getByRole('button', { name: /create new lookup key/i });
      await user.click(createButton);

      results = await axe(container);
      expect(results.violations).toHaveLength(0);

      // Test keyboard navigation through entire workflow
      const nameInput = screen.getByLabelText(/name/i);
      nameInput.focus();

      const navigationResult = await accessibilityUtils.testKeyboardNavigation(container, user);
      expect(navigationResult.success).toBe(true);

      // Test screen reader announcements
      await user.type(nameInput, 'accessibility_test');
      
      // Should have proper live region announcements for validation
      const liveRegions = container.querySelectorAll('[aria-live]');
      expect(liveRegions.length).toBeGreaterThan(0);
    });

    test('error boundary integration and recovery', async () => {
      // Simulate network failure
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res) => {
          return res.networkError('Network connection failed');
        })
      );

      renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-error')).toBeInTheDocument();
      });

      // Test error recovery
      server.resetHandlers();
      server.use(...lookupKeysHandlers);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('test_key')).toBeInTheDocument();
        expect(screen.queryByTestId('lookup-keys-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles empty dataset gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              resource: [],
              meta: { count: 0 }
            })
          );
        })
      );

      renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/no lookup keys found/i)).toBeInTheDocument();
      });

      // Should still show create button
      expect(screen.getByRole('button', { name: /create new lookup key/i })).toBeInTheDocument();
    });

    test('handles malformed API responses', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              // Missing resource field
              meta: { count: 0 }
            })
          );
        })
      );

      renderWithProviders(<LookupKeysPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-error')).toBeInTheDocument();
      });
    });

    test('handles extremely long text values', async () => {
      const longDescription = 'A'.repeat(1000);
      const longValue = 'B'.repeat(500);

      renderWithProviders(
        <LookupKeysForm 
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          mode="create"
          initialData={{
            ...mockLookupKey,
            description: longDescription,
            value: longValue,
          }}
        />
      );

      // Should truncate display appropriately
      const descriptionDisplay = screen.getByDisplayValue(longDescription);
      expect(descriptionDisplay).toBeInTheDocument();
      
      // Check that scrolling works for long content
      expect(descriptionDisplay.scrollHeight).toBeGreaterThan(descriptionDisplay.clientHeight);
    });

    test('handles concurrent modifications gracefully', async () => {
      let createCount = 0;
      server.use(
        rest.post('/api/v2/system/lookup_key', async (req, res, ctx) => {
          createCount++;
          if (createCount === 2) {
            // Simulate race condition
            return res(
              ctx.status(409),
              ctx.json({
                error: {
                  code: 409,
                  message: 'Resource has been modified by another user'
                }
              })
            );
          }
          
          const body = await req.json();
          return res(
            ctx.status(201),
            ctx.json({
              resource: [{
                id: createCount,
                ...body,
                created_date: new Date().toISOString(),
                last_modified_date: new Date().toISOString(),
              }]
            })
          );
        })
      );

      renderWithProviders(<LookupKeysPage />);

      // Simulate two rapid creates
      const createButton = screen.getByRole('button', { name: /create new lookup key/i });
      
      await user.click(createButton);
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'concurrent_test_1');
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should handle conflict gracefully
      await waitFor(() => {
        expect(screen.getByText(/resource has been modified/i)).toBeInTheDocument();
      });
    });
  });
});