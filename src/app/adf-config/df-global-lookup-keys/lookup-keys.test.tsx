/**
 * Vitest Test Suite: Global Lookup Keys Management
 * 
 * Comprehensive test coverage for React lookup keys components replacing Angular implementation.
 * Implements React Testing Library patterns with MSW for realistic API mocking.
 * 
 * Test Coverage Areas:
 * - Component rendering and initial state
 * - Form validation and user interactions
 * - CRUD operations with optimistic updates
 * - Error handling and edge cases
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Keyboard navigation and screen reader support
 * - Loading states and async operations
 * - SWR/React Query hook testing
 * 
 * Performance Target: Tests execute in <100ms each for 10x faster execution
 * Coverage Target: 90%+ code coverage per testing strategy requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { server } from '../../../test/setup';

// Import components under test
import LookupKeysPage from './page';
import LookupKeysForm from './lookup-keys-form';
import { useLookupKeys } from './use-lookup-keys';

// Test utilities and mocks
import { createTestWrapper, renderWithProviders } from '../../../test/utils/test-utils';
import type { LookupKeyType } from '../../../types/lookup-keys';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock data fixtures
const mockLookupKeys: LookupKeyType[] = [
  {
    id: 1,
    name: 'api_url',
    value: 'https://api.example.com',
    private: false,
    description: 'Main API endpoint URL',
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-01-15T10:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
  {
    id: 2,
    name: 'secret_key',
    value: 'abc123secret',
    private: true,
    description: 'Private API secret key',
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-01-15T10:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
  {
    id: 3,
    name: 'debug_mode',
    value: 'true',
    private: false,
    description: 'Enable debug logging',
    created_date: '2024-01-15T10:00:00Z',
    last_modified_date: '2024-01-15T10:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
  },
];

const mockEmptyResponse = {
  resource: [],
  meta: {
    count: 0,
    total_count: 0,
  },
};

const mockLookupKeysResponse = {
  resource: mockLookupKeys,
  meta: {
    count: mockLookupKeys.length,
    total_count: mockLookupKeys.length,
  },
};

// MSW handlers for lookup keys API endpoints
const lookupKeysHandlers = [
  // GET /api/v2/system/lookup_key - List lookup keys
  rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
    const url = new URL(req.url);
    const fields = url.searchParams.get('fields');
    const includeCount = url.searchParams.get('include_count');
    
    return res(
      ctx.status(200),
      ctx.json({
        ...mockLookupKeysResponse,
        meta: {
          ...mockLookupKeysResponse.meta,
          include_count: includeCount === 'true',
        },
      })
    );
  }),

  // POST /api/v2/system/lookup_key - Create lookup keys
  rest.post('/api/v2/system/lookup_key', async (req, res, ctx) => {
    const body = await req.json();
    const { resource } = body;
    
    // Validate required fields
    for (const key of resource) {
      if (!key.name || typeof key.name !== 'string') {
        return res(
          ctx.status(400),
          ctx.json({
            error: {
              code: 400,
              message: 'Name is required and must be a string',
              context: {
                field: 'name',
                value: key.name,
              },
            },
          })
        );
      }
      
      // Check for duplicate names
      if (mockLookupKeys.some(existing => existing.name === key.name)) {
        return res(
          ctx.status(422),
          ctx.json({
            error: {
              code: 422,
              message: `Lookup key with name '${key.name}' already exists`,
              context: {
                field: 'name',
                value: key.name,
              },
            },
          })
        );
      }
    }
    
    // Create new lookup keys with generated IDs
    const createdKeys = resource.map((key: Partial<LookupKeyType>, index: number) => ({
      ...key,
      id: mockLookupKeys.length + index + 1,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      created_by_id: 1,
      last_modified_by_id: 1,
    }));
    
    // Add to mock data
    mockLookupKeys.push(...createdKeys);
    
    return res(
      ctx.status(201),
      ctx.json({
        resource: createdKeys,
        meta: {
          count: createdKeys.length,
        },
      })
    );
  }),

  // PUT /api/v2/system/lookup_key/{id} - Update lookup key
  rest.put('/api/v2/system/lookup_key/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();
    const lookupKeyId = parseInt(id as string);
    
    const existingIndex = mockLookupKeys.findIndex(key => key.id === lookupKeyId);
    
    if (existingIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          error: {
            code: 404,
            message: `Lookup key with ID ${id} not found`,
          },
        })
      );
    }
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return res(
        ctx.status(400),
        ctx.json({
          error: {
            code: 400,
            message: 'Name is required and must be a string',
            context: {
              field: 'name',
              value: body.name,
            },
          },
        })
      );
    }
    
    // Check for duplicate names (excluding current record)
    if (mockLookupKeys.some(existing => existing.name === body.name && existing.id !== lookupKeyId)) {
      return res(
        ctx.status(422),
        ctx.json({
          error: {
            code: 422,
            message: `Lookup key with name '${body.name}' already exists`,
            context: {
              field: 'name',
              value: body.name,
            },
          },
        })
      );
    }
    
    // Update the lookup key
    const updatedKey = {
      ...mockLookupKeys[existingIndex],
      ...body,
      id: lookupKeyId,
      last_modified_date: new Date().toISOString(),
      last_modified_by_id: 1,
    };
    
    mockLookupKeys[existingIndex] = updatedKey;
    
    return res(
      ctx.status(200),
      ctx.json(updatedKey)
    );
  }),

  // DELETE /api/v2/system/lookup_key/{id} - Delete lookup key
  rest.delete('/api/v2/system/lookup_key/:id', (req, res, ctx) => {
    const { id } = req.params;
    const lookupKeyId = parseInt(id as string);
    
    const existingIndex = mockLookupKeys.findIndex(key => key.id === lookupKeyId);
    
    if (existingIndex === -1) {
      return res(
        ctx.status(404),
        ctx.json({
          error: {
            code: 404,
            message: `Lookup key with ID ${id} not found`,
          },
        })
      );
    }
    
    // Remove from mock data
    const deletedKey = mockLookupKeys.splice(existingIndex, 1)[0];
    
    return res(
      ctx.status(200),
      ctx.json(deletedKey)
    );
  }),

  // Unique name validation endpoint
  rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter');
    
    if (filter) {
      // Extract name from filter parameter (format: "name='test_name'")
      const nameMatch = filter.match(/name='([^']+)'/);
      if (nameMatch) {
        const nameToCheck = nameMatch[1];
        const exists = mockLookupKeys.some(key => key.name === nameToCheck);
        
        return res(
          ctx.status(200),
          ctx.json({
            resource: exists ? [{ name: nameToCheck }] : [],
            meta: {
              count: exists ? 1 : 0,
            },
          })
        );
      }
    }
    
    return res(ctx.status(200), ctx.json(mockEmptyResponse));
  }),
];

describe('Global Lookup Keys Management', () => {
  beforeAll(() => {
    // Setup MSW handlers for lookup keys
    server.use(...lookupKeysHandlers);
  });

  beforeEach(() => {
    // Reset mock data before each test
    mockLookupKeys.length = 0;
    mockLookupKeys.push(
      {
        id: 1,
        name: 'api_url',
        value: 'https://api.example.com',
        private: false,
        description: 'Main API endpoint URL',
        created_date: '2024-01-15T10:00:00Z',
        last_modified_date: '2024-01-15T10:00:00Z',
        created_by_id: 1,
        last_modified_by_id: 1,
      },
      {
        id: 2,
        name: 'secret_key',
        value: 'abc123secret',
        private: true,
        description: 'Private API secret key',
        created_date: '2024-01-15T10:00:00Z',
        last_modified_date: '2024-01-15T10:00:00Z',
        created_by_id: 1,
        last_modified_by_id: 1,
      },
      {
        id: 3,
        name: 'debug_mode',
        value: 'true',
        private: false,
        description: 'Enable debug logging',
        created_date: '2024-01-15T10:00:00Z',
        last_modified_date: '2024-01-15T10:00:00Z',
        created_by_id: 1,
        last_modified_by_id: 1,
      }
    );
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset MSW handlers after each test
    server.resetHandlers();
  });

  describe('Lookup Keys Page Component', () => {
    it('should render the page component successfully', async () => {
      renderWithProviders(<LookupKeysPage />);
      
      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for description text
      expect(screen.getByText(/global lookup keys configuration/i)).toBeInTheDocument();
      
      // Wait for lookup keys to load
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
    });

    it('should display existing lookup keys in a table', async () => {
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      // Check table headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /private/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
      
      // Check for lookup key data
      await waitFor(() => {
        expect(screen.getByText('api_url')).toBeInTheDocument();
        expect(screen.getByText('secret_key')).toBeInTheDocument();
        expect(screen.getByText('debug_mode')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching data', async () => {
      // Delay the API response to test loading state
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.delay(100),
            ctx.status(200),
            ctx.json(mockLookupKeysResponse)
          );
        })
      );
      
      renderWithProviders(<LookupKeysPage />);
      
      // Check for loading indicator
      expect(screen.getByTestId('lookup-keys-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading lookup keys/i)).toBeInTheDocument();
      
      // Wait for loading to complete
      await waitFor(
        () => {
          expect(screen.queryByTestId('lookup-keys-loading')).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Internal server error',
              },
            })
          );
        })
      );
      
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-error')).toBeInTheDocument();
        expect(screen.getByText(/failed to load lookup keys/i)).toBeInTheDocument();
      });
      
      // Check for retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should display empty state when no lookup keys exist', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json(mockEmptyResponse)
          );
        })
      );
      
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-empty-state')).toBeInTheDocument();
        expect(screen.getByText(/no lookup keys configured/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add lookup key/i })).toBeInTheDocument();
      });
    });
  });

  describe('Lookup Keys Form Component', () => {
    const mockProps = {
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
    };

    beforeEach(() => {
      mockProps.onSubmit.mockClear();
      mockProps.onCancel.mockClear();
    });

    it('should render form with all required fields', () => {
      renderWithProviders(<LookupKeysForm {...mockProps} />);
      
      // Check form fields
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/private/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      
      // Check action buttons
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysForm {...mockProps} />);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Try to submit empty form
      await user.click(saveButton);
      
      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
      
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should validate unique name requirement', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysForm {...mockProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Enter existing name
      await user.type(nameInput, 'api_url');
      await user.type(valueInput, 'https://test.com');
      
      await user.click(saveButton);
      
      // Check for unique name validation error
      await waitFor(() => {
        expect(screen.getByText(/name must be unique/i)).toBeInTheDocument();
      });
      
      expect(mockProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysForm {...mockProps} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const privateCheckbox = screen.getByLabelText(/private/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Fill form with valid data
      await user.type(nameInput, 'new_key');
      await user.type(valueInput, 'new_value');
      await user.type(descriptionInput, 'Test description');
      await user.click(privateCheckbox);
      
      await user.click(saveButton);
      
      // Check form submission
      await waitFor(() => {
        expect(mockProps.onSubmit).toHaveBeenCalledWith({
          name: 'new_key',
          value: 'new_value',
          description: 'Test description',
          private: true,
        });
      });
    });

    it('should handle form cancellation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysForm {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockProps.onCancel).toHaveBeenCalled();
    });

    it('should prefill form when editing existing lookup key', () => {
      const editProps = {
        ...mockProps,
        initialData: mockLookupKeys[0],
      };
      
      renderWithProviders(<LookupKeysForm {...editProps} />);
      
      // Check form is prefilled
      expect(screen.getByDisplayValue('api_url')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://api.example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Main API endpoint URL')).toBeInTheDocument();
      
      // Private checkbox should not be checked for this item
      expect(screen.getByLabelText(/private/i)).not.toBeChecked();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const slowSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderWithProviders(<LookupKeysForm {...mockProps} onSubmit={slowSubmit} />);
      
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await user.type(nameInput, 'test_key');
      await user.type(valueInput, 'test_value');
      await user.click(saveButton);
      
      // Check loading state
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should create new lookup keys successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      // Click add button
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      // Fill form
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await user.type(nameInput, 'new_test_key');
      await user.type(valueInput, 'new_test_value');
      await user.click(saveButton);
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByText(/lookup key created successfully/i)).toBeInTheDocument();
      });
      
      // Check that new key appears in list
      await waitFor(() => {
        expect(screen.getByText('new_test_key')).toBeInTheDocument();
      });
    });

    it('should update existing lookup keys successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('api_url')).toBeInTheDocument();
      });
      
      // Click edit button for first item
      const editButton = screen.getByTestId('edit-lookup-key-1');
      await user.click(editButton);
      
      // Modify value
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await user.clear(valueInput);
      await user.type(valueInput, 'https://updated-api.example.com');
      await user.click(saveButton);
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByText(/lookup key updated successfully/i)).toBeInTheDocument();
      });
      
      // Check that value was updated
      await waitFor(() => {
        expect(screen.getByText('https://updated-api.example.com')).toBeInTheDocument();
      });
    });

    it('should delete lookup keys successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('debug_mode')).toBeInTheDocument();
      });
      
      // Click delete button for last item
      const deleteButton = screen.getByTestId('delete-lookup-key-3');
      await user.click(deleteButton);
      
      // Confirm deletion in modal
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);
      
      // Check for success message
      await waitFor(() => {
        expect(screen.getByText(/lookup key deleted successfully/i)).toBeInTheDocument();
      });
      
      // Check that item was removed
      await waitFor(() => {
        expect(screen.queryByText('debug_mode')).not.toBeInTheDocument();
      });
    });

    it('should handle create operation failures', async () => {
      const user = userEvent.setup();
      
      // Mock API error for create operation
      server.use(
        rest.post('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: {
                code: 422,
                message: 'Lookup key with this name already exists',
              },
            })
          );
        })
      );
      
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await user.type(nameInput, 'duplicate_key');
      await user.type(valueInput, 'test_value');
      await user.click(saveButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/lookup key with this name already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle update operation failures', async () => {
      const user = userEvent.setup();
      
      // Mock API error for update operation
      server.use(
        rest.put('/api/v2/system/lookup_key/:id', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              error: {
                code: 404,
                message: 'Lookup key not found',
              },
            })
          );
        })
      );
      
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByText('api_url')).toBeInTheDocument();
      });
      
      const editButton = screen.getByTestId('edit-lookup-key-1');
      await user.click(editButton);
      
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await user.clear(valueInput);
      await user.type(valueInput, 'updated_value');
      await user.click(saveButton);
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/lookup key not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions and Keyboard Navigation', () => {
    it('should support keyboard navigation in lookup keys table', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
      
      const table = screen.getByRole('table');
      const firstRow = within(table).getAllByRole('row')[1]; // Skip header row
      
      // Focus first row
      firstRow.focus();
      expect(firstRow).toHaveFocus();
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      const secondRow = within(table).getAllByRole('row')[2];
      expect(secondRow).toHaveFocus();
      
      // Press Enter to edit
      await user.keyboard('{Enter}');
      
      // Check that edit form opened
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should support keyboard shortcuts for common actions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      // Use Ctrl+N to add new lookup key
      await user.keyboard('{Control>}n{/Control}');
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toHaveFocus();
    });

    it('should handle Escape key to close modals', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      // Open add dialog
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Press Escape to close
      await user.keyboard('{Escape}');
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle Tab navigation within forms', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveFocus();
      
      // Tab through form fields
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/value/i)).toHaveFocus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/description/i)).toHaveFocus();
      
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/private/i)).toHaveFocus();
    });

    it('should provide visual focus indicators', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      
      // Focus button with keyboard
      addButton.focus();
      expect(addButton).toHaveFocus();
      expect(addButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations on main page', async () => {
      const { container } = renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in form modal', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      // Check table accessibility
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Global lookup keys configuration');
      
      // Check action buttons have proper labels
      const editButtons = screen.getAllByTestId(/edit-lookup-key-/);
      editButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-label', expect.stringMatching(/edit lookup key/i));
      });
      
      const deleteButtons = screen.getAllByTestId(/delete-lookup-key-/);
      deleteButtons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-label', expect.stringMatching(/delete lookup key/i));
      });
    });

    it('should support screen reader announcements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      // Check for live region for status updates
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Add new lookup key to test announcement
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      await user.type(nameInput, 'test_key');
      await user.type(valueInput, 'test_value');
      await user.click(saveButton);
      
      // Check for success announcement
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toHaveTextContent(/lookup key created successfully/i);
      });
    });

    it('should provide proper form field associations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      // Check that form fields have proper labels
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('id');
      expect(nameInput).toHaveAttribute('aria-required', 'true');
      
      const valueInput = screen.getByLabelText(/value/i);
      expect(valueInput).toHaveAttribute('id');
      
      const descriptionInput = screen.getByLabelText(/description/i);
      expect(descriptionInput).toHaveAttribute('id');
      
      const privateCheckbox = screen.getByLabelText(/private/i);
      expect(privateCheckbox).toHaveAttribute('id');
      expect(privateCheckbox).toHaveAttribute('type', 'checkbox');
    });

    it('should handle error states accessibly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Submit empty form to trigger validation errors
      await user.click(saveButton);
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby');
        
        const errorMessage = screen.getByText(/name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('SWR/React Query Hook Testing', () => {
    // Test the custom hook separately using a test component
    const TestComponent = () => {
      const { data, error, isLoading, create, update, remove } = useLookupKeys();
      
      return (
        <div>
          <div data-testid="hook-loading">{isLoading ? 'Loading' : 'Loaded'}</div>
          <div data-testid="hook-error">{error?.message || 'No error'}</div>
          <div data-testid="hook-data">{data ? data.length : 0} items</div>
          <button onClick={() => create({ name: 'test', value: 'test', private: false })}>
            Create
          </button>
          <button onClick={() => update(1, { name: 'updated', value: 'updated', private: false })}>
            Update
          </button>
          <button onClick={() => remove(1)}>Delete</button>
        </div>
      );
    };

    it('should fetch lookup keys data successfully', async () => {
      renderWithProviders(<TestComponent />);
      
      // Initially loading
      expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loading');
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loaded');
        expect(screen.getByTestId('hook-data')).toHaveTextContent('3 items');
        expect(screen.getByTestId('hook-error')).toHaveTextContent('No error');
      });
    });

    it('should handle fetch errors', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              error: {
                code: 500,
                message: 'Server error',
              },
            })
          );
        })
      );
      
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-error')).toHaveTextContent('Server error');
      });
    });

    it('should handle create mutations with optimistic updates', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('hook-data')).toHaveTextContent('3 items');
      });
      
      // Click create button
      await user.click(screen.getByText('Create'));
      
      // Check optimistic update
      await waitFor(() => {
        expect(screen.getByTestId('hook-data')).toHaveTextContent('4 items');
      });
    });

    it('should handle update mutations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loaded');
      });
      
      await user.click(screen.getByText('Update'));
      
      // Mutation should complete successfully
      await waitFor(() => {
        expect(screen.getByTestId('hook-error')).toHaveTextContent('No error');
      });
    });

    it('should handle delete mutations', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-data')).toHaveTextContent('3 items');
      });
      
      await user.click(screen.getByText('Delete'));
      
      // Check optimistic update
      await waitFor(() => {
        expect(screen.getByTestId('hook-data')).toHaveTextContent('2 items');
      });
    });

    it('should implement cache invalidation correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('hook-loading')).toHaveTextContent('Loaded');
      });
      
      // Perform create operation
      await user.click(screen.getByText('Create'));
      
      // Cache should be revalidated automatically
      await waitFor(() => {
        expect(screen.getByTestId('hook-data')).toHaveTextContent('4 items');
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large datasets efficiently', async () => {
      // Create large mock dataset
      const largeMockData = Array.from({ length: 1000 }, (_, index) => ({
        id: index + 1,
        name: `key_${index + 1}`,
        value: `value_${index + 1}`,
        private: index % 2 === 0,
        description: `Description for key ${index + 1}`,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
        created_by_id: 1,
        last_modified_by_id: 1,
      }));
      
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              resource: largeMockData,
              meta: {
                count: largeMockData.length,
                total_count: largeMockData.length,
              },
            })
          );
        })
      );
      
      const startTime = performance.now();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render large dataset in reasonable time (< 1 second)
      expect(renderTime).toBeLessThan(1000);
      
      // Check that virtual scrolling or pagination is working
      const visibleRows = screen.getAllByRole('row');
      // Should not render all 1000 rows at once
      expect(visibleRows.length).toBeLessThan(100);
    });

    it('should handle network timeouts gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/lookup_key', (req, res, ctx) => {
          return res(
            ctx.delay(10000), // 10 second delay to trigger timeout
            ctx.status(200),
            ctx.json(mockLookupKeysResponse)
          );
        })
      );
      
      renderWithProviders(<LookupKeysPage />);
      
      // Should show timeout error after reasonable time
      await waitFor(
        () => {
          expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
        },
        { timeout: 6000 }
      );
    });

    it('should handle concurrent operations correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      // Start multiple operations simultaneously
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      const editButton = screen.getByTestId('edit-lookup-key-1');
      
      // Click both buttons rapidly
      await user.click(addButton);
      await user.click(editButton);
      
      // Only one modal should be open
      const modals = screen.getAllByRole('dialog');
      expect(modals).toHaveLength(1);
    });

    it('should handle special characters in lookup key names and values', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      const valueInput = screen.getByLabelText(/value/i);
      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Test special characters
      await user.type(nameInput, 'special_key_@#$%');
      await user.type(valueInput, 'value with spaces & symbols!');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/lookup key created successfully/i)).toBeInTheDocument();
      });
    });

    it('should maintain form state during navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<LookupKeysPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-list')).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);
      
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'partial_input');
      
      // Close modal without saving
      await user.keyboard('{Escape}');
      
      // Reopen modal
      await user.click(addButton);
      
      // Check if form state is preserved or reset appropriately
      const newNameInput = screen.getByLabelText(/name/i);
      // Should be empty on new form
      expect(newNameInput).toHaveValue('');
    });
  });
});