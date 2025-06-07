/**
 * Global Lookup Keys Management - Comprehensive Test Suite
 * 
 * Enterprise-grade test suite for the DreamFactory Global Lookup Keys management
 * components using Vitest 2.1.0 and React Testing Library. This test suite provides
 * comprehensive coverage for all lookup key operations, form validation, user 
 * interactions, error handling, and accessibility compliance.
 * 
 * Performance Characteristics:
 * - 10x faster test execution compared to Jest/Karma (Vitest 2.1.0)
 * - Parallel test execution with isolated environments
 * - MSW for realistic API mocking without backend dependencies
 * - Memory-efficient test runner with automatic garbage collection
 * 
 * Coverage Requirements:
 * - 90%+ code coverage as per testing strategy requirements
 * - WCAG 2.1 AA accessibility compliance validation
 * - Comprehensive error scenario testing
 * - User interaction and keyboard navigation testing
 * - SWR/React Query hooks and mutations coverage
 * 
 * Architecture Benefits:
 * - Zero-configuration TypeScript support with Vitest
 * - Enhanced debugging with source map support
 * - Realistic API mocking with MSW preserving request/response patterns
 * - Accessibility-first testing patterns with automatic WCAG validation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Import components under test
import LookupKeysPage from './page';
import { LookupKeysForm } from './lookup-keys-form';
import { useLookupKeys } from './use-lookup-keys';

// Import test utilities and mocks
import { createMockLookupKey, createMockLookupKeysList, createErrorResponse } from '@/test/mocks/lookup-keys-handlers';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Test Environment Configuration
 * 
 * Establishes isolated test environment for each test with fresh React Query
 * client, MSW handlers, and component state. Ensures test isolation and
 * prevents state leakage between tests.
 */

// Create fresh QueryClient for each test to prevent cache pollution
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for faster test execution
      gcTime: 0, // Disable garbage collection delay
    },
    mutations: {
      retry: false,
    },
  },
});

// Test wrapper component with all necessary providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <div id="test-container" data-testid="test-wrapper">
        {children}
      </div>
    </QueryClientProvider>
  );
};

// Enhanced render utility with accessibility testing
const renderWithProviders = (component: React.ReactElement) => {
  const utils = render(component, { wrapper: TestWrapper });
  
  return {
    ...utils,
    // Custom utility for accessibility testing
    expectAccessible: async () => {
      const results = await axe(utils.container);
      expect(results).toHaveNoViolations();
    },
  };
};

// Mock data generators
const mockLookupKeys = [
  createMockLookupKey({
    id: 1,
    name: 'api.default_database',
    value: 'mysql_production',
    private: false,
  }),
  createMockLookupKey({
    id: 2,
    name: 'system.debug_mode',
    value: 'false',
    private: true,
  }),
  createMockLookupKey({
    id: 3,
    name: 'email.smtp_host',
    value: 'smtp.example.com',
    private: false,
  }),
];

// ============================================================================
// LOOKUP KEYS PAGE COMPONENT TESTS
// ============================================================================

describe('LookupKeysPage Component', () => {
  beforeEach(() => {
    // Reset MSW handlers for each test
    server.resetHandlers();
    
    // Set up default successful API responses
    server.use(
      http.get('/api/v2/system/lookup', ({ request }) => {
        const url = new URL(request.url);
        const limit = url.searchParams.get('limit');
        const offset = url.searchParams.get('offset');
        
        return HttpResponse.json(
          createMockLookupKeysList(mockLookupKeys, {
            limit: limit ? parseInt(limit) : 25,
            offset: offset ? parseInt(offset) : 0,
          })
        );
      })
    );
  });

  test('renders lookup keys page with proper structure', async () => {
    const { expectAccessible } = renderWithProviders(<LookupKeysPage />);
    
    // Test basic page structure
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /global lookup keys/i })).toBeInTheDocument();
    
    // Test page description and instructions
    expect(screen.getByText(/manage system-wide lookup keys/i)).toBeInTheDocument();
    
    // Test accessibility compliance
    await expectAccessible();
  });

  test('displays loading state initially', async () => {
    // Delay API response to test loading state
    server.use(
      http.get('/api/v2/system/lookup', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json(createMockLookupKeysList(mockLookupKeys));
      })
    );

    renderWithProviders(<LookupKeysPage />);
    
    // Check for loading indicator
    expect(screen.getByTestId('lookup-keys-loading')).toBeInTheDocument();
    expect(screen.getByLabelText(/loading lookup keys/i)).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('lookup-keys-loading')).not.toBeInTheDocument();
    });
  });

  test('displays lookup keys data after successful load', async () => {
    renderWithProviders(<LookupKeysPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    // Verify all lookup keys are displayed
    expect(screen.getByText('api.default_database')).toBeInTheDocument();
    expect(screen.getByText('system.debug_mode')).toBeInTheDocument();
    expect(screen.getByText('email.smtp_host')).toBeInTheDocument();
    
    // Verify values are displayed
    expect(screen.getByText('mysql_production')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
    expect(screen.getByText('smtp.example.com')).toBeInTheDocument();
  });

  test('handles API error gracefully with proper error messaging', async () => {
    // Mock API error response
    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(
          createErrorResponse('Failed to load lookup keys', 500),
          { status: 500 }
        );
      })
    );

    renderWithProviders(<LookupKeysPage />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Verify error message
    expect(screen.getByText(/failed to load lookup keys/i)).toBeInTheDocument();
    
    // Verify retry button is available
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toBeEnabled();
  });

  test('supports keyboard navigation and screen reader accessibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysPage />);
    
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    // Test keyboard navigation through lookup keys list
    const firstLookupKey = screen.getByTestId('lookup-key-item-1');
    firstLookupKey.focus();
    
    // Navigate with arrow keys
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('lookup-key-item-2')).toHaveFocus();
    
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('lookup-key-item-3')).toHaveFocus();
    
    // Test Home/End navigation
    await user.keyboard('{Home}');
    expect(screen.getByTestId('lookup-key-item-1')).toHaveFocus();
    
    await user.keyboard('{End}');
    expect(screen.getByTestId('lookup-key-item-3')).toHaveFocus();
  });

  test('filters lookup keys based on search input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysPage />);
    
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    // Find and use search input
    const searchInput = screen.getByRole('searchbox', { name: /filter lookup keys/i });
    expect(searchInput).toBeInTheDocument();
    
    // Filter by "api"
    await user.type(searchInput, 'api');
    
    // Verify filtered results
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
      expect(screen.queryByText('system.debug_mode')).not.toBeInTheDocument();
      expect(screen.queryByText('email.smtp_host')).not.toBeInTheDocument();
    });
    
    // Clear filter
    await user.clear(searchInput);
    await user.type(searchInput, '');
    
    // Verify all items are visible again
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
      expect(screen.getByText('system.debug_mode')).toBeInTheDocument();
      expect(screen.getByText('email.smtp_host')).toBeInTheDocument();
    });
  });

  test('opens create lookup key dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysPage />);
    
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    // Click create button
    const createButton = screen.getByRole('button', { name: /create lookup key/i });
    await user.click(createButton);
    
    // Verify dialog opens
    expect(screen.getByRole('dialog', { name: /create lookup key/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /key name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /key value/i })).toBeInTheDocument();
  });
});

// ============================================================================
// LOOKUP KEYS FORM COMPONENT TESTS
// ============================================================================

describe('LookupKeysForm Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders create form with proper structure and labels', async () => {
    const { expectAccessible } = renderWithProviders(
      <LookupKeysForm {...defaultProps} mode="create" />
    );
    
    // Test form structure
    expect(screen.getByRole('form', { name: /create lookup key/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /key name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /key value/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /private key/i })).toBeInTheDocument();
    
    // Test action buttons
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    
    // Test accessibility compliance
    await expectAccessible();
  });

  test('renders edit form with pre-filled data', async () => {
    const existingLookupKey = mockLookupKeys[0];
    
    renderWithProviders(
      <LookupKeysForm 
        {...defaultProps} 
        mode="edit" 
        initialData={existingLookupKey}
      />
    );
    
    // Verify form is populated with existing data
    expect(screen.getByDisplayValue('api.default_database')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mysql_production')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /private key/i })).not.toBeChecked();
    
    // Verify edit mode button
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });

  test('validates required fields with proper error messages', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysForm {...defaultProps} mode="create" />);
    
    // Submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/key name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/key value is required/i)).toBeInTheDocument();
    });
    
    // Verify form submission is prevented
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  test('validates key name format and uniqueness', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysForm {...defaultProps} mode="create" />);
    
    const nameInput = screen.getByRole('textbox', { name: /key name/i });
    const valueInput = screen.getByRole('textbox', { name: /key value/i });
    
    // Test invalid characters
    await user.type(nameInput, 'invalid@name!');
    await user.type(valueInput, 'test value');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/key name must contain only letters, numbers, dots, and underscores/i)).toBeInTheDocument();
    });
    
    // Test duplicate name validation
    await user.clear(nameInput);
    await user.type(nameInput, 'api.default_database'); // Existing key
    
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/key name already exists/i)).toBeInTheDocument();
    });
  });

  test('handles form submission with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysForm {...defaultProps} mode="create" />);
    
    // Fill form with valid data
    await user.type(screen.getByRole('textbox', { name: /key name/i }), 'app.new_setting');
    await user.type(screen.getByRole('textbox', { name: /key value/i }), 'new_value');
    await user.click(screen.getByRole('checkbox', { name: /private key/i }));
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    // Verify submission
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        name: 'app.new_setting',
        value: 'new_value',
        private: true,
      });
    });
  });

  test('handles loading state during submission', async () => {
    renderWithProviders(
      <LookupKeysForm {...defaultProps} mode="create" isLoading={true} />
    );
    
    // Verify loading state
    const submitButton = screen.getByRole('button', { name: /creating/i });
    expect(submitButton).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Verify form fields are disabled during loading
    expect(screen.getByRole('textbox', { name: /key name/i })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: /key value/i })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /private key/i })).toBeDisabled();
  });

  test('handles cancel action properly', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LookupKeysForm {...defaultProps} mode="create" />);
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Verify cancel callback
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  test('supports keyboard navigation and accessibility', async () => {
    const user = userEvent.setup();
    const { expectAccessible } = renderWithProviders(
      <LookupKeysForm {...defaultProps} mode="create" />
    );
    
    // Test tab navigation through form fields
    await user.tab();
    expect(screen.getByRole('textbox', { name: /key name/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('textbox', { name: /key value/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('checkbox', { name: /private key/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /create/i })).toHaveFocus();
    
    await user.tab();
    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
    
    // Test accessibility compliance
    await expectAccessible();
  });

  test('displays contextual help information', async () => {
    renderWithProviders(<LookupKeysForm {...defaultProps} mode="create" />);
    
    // Check for help text
    expect(screen.getByText(/lookup keys provide system-wide configuration values/i)).toBeInTheDocument();
    expect(screen.getByText(/private keys are not exposed in api responses/i)).toBeInTheDocument();
    expect(screen.getByText(/key names should follow dot notation convention/i)).toBeInTheDocument();
  });
});

// ============================================================================
// LOOKUP KEYS HOOK TESTS
// ============================================================================

describe('useLookupKeys Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    server.resetHandlers();
  });

  test('fetches lookup keys successfully', async () => {
    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(createMockLookupKeysList(mockLookupKeys));
      })
    );

    const TestComponent = () => {
      const { data, isLoading, error } = useLookupKeys();
      
      if (isLoading) return <div data-testid="loading">Loading...</div>;
      if (error) return <div data-testid="error">Error: {error.message}</div>;
      if (!data) return <div data-testid="no-data">No data</div>;
      
      return (
        <div data-testid="success">
          {data.resource.map((key) => (
            <div key={key.id} data-testid={`lookup-key-${key.id}`}>
              {key.name}: {key.value}
            </div>
          ))}
        </div>
      );
    };

    renderWithProviders(<TestComponent />);
    
    // Check loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
    
    // Verify data is rendered
    expect(screen.getByTestId('lookup-key-1')).toHaveTextContent('api.default_database: mysql_production');
    expect(screen.getByTestId('lookup-key-2')).toHaveTextContent('system.debug_mode: false');
    expect(screen.getByTestId('lookup-key-3')).toHaveTextContent('email.smtp_host: smtp.example.com');
  });

  test('handles create lookup key mutation', async () => {
    const newLookupKey = createMockLookupKey({
      id: 4,
      name: 'app.new_setting',
      value: 'new_value',
      private: false,
    });

    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(createMockLookupKeysList(mockLookupKeys));
      }),
      http.post('/api/v2/system/lookup', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          ...newLookupKey,
          name: body.name,
          value: body.value,
          private: body.private,
        });
      })
    );

    const TestComponent = () => {
      const { data, createLookupKey } = useLookupKeys();
      
      const handleCreate = () => {
        createLookupKey.mutate({
          name: 'app.new_setting',
          value: 'new_value',
          private: false,
        });
      };
      
      return (
        <div>
          <button onClick={handleCreate} data-testid="create-button">
            Create
          </button>
          {createLookupKey.isPending && (
            <div data-testid="creating">Creating...</div>
          )}
          {createLookupKey.isSuccess && (
            <div data-testid="create-success">Created successfully</div>
          )}
          {createLookupKey.error && (
            <div data-testid="create-error">Error: {createLookupKey.error.message}</div>
          )}
        </div>
      );
    };

    const user = userEvent.setup();
    renderWithProviders(<TestComponent />);
    
    // Trigger create mutation
    const createButton = screen.getByTestId('create-button');
    await user.click(createButton);
    
    // Check loading state
    expect(screen.getByTestId('creating')).toBeInTheDocument();
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('create-success')).toBeInTheDocument();
    });
  });

  test('handles update lookup key mutation', async () => {
    const updatedKey = { ...mockLookupKeys[0], value: 'updated_value' };

    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(createMockLookupKeysList(mockLookupKeys));
      }),
      http.put('/api/v2/system/lookup/1', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          ...updatedKey,
          value: body.value,
        });
      })
    );

    const TestComponent = () => {
      const { updateLookupKey } = useLookupKeys();
      
      const handleUpdate = () => {
        updateLookupKey.mutate({
          id: 1,
          name: 'api.default_database',
          value: 'updated_value',
          private: false,
        });
      };
      
      return (
        <div>
          <button onClick={handleUpdate} data-testid="update-button">
            Update
          </button>
          {updateLookupKey.isSuccess && (
            <div data-testid="update-success">Updated successfully</div>
          )}
        </div>
      );
    };

    const user = userEvent.setup();
    renderWithProviders(<TestComponent />);
    
    // Trigger update mutation
    const updateButton = screen.getByTestId('update-button');
    await user.click(updateButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('update-success')).toBeInTheDocument();
    });
  });

  test('handles delete lookup key mutation', async () => {
    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(createMockLookupKeysList(mockLookupKeys));
      }),
      http.delete('/api/v2/system/lookup/1', () => {
        return HttpResponse.json({ success: true });
      })
    );

    const TestComponent = () => {
      const { deleteLookupKey } = useLookupKeys();
      
      const handleDelete = () => {
        deleteLookupKey.mutate(1);
      };
      
      return (
        <div>
          <button onClick={handleDelete} data-testid="delete-button">
            Delete
          </button>
          {deleteLookupKey.isSuccess && (
            <div data-testid="delete-success">Deleted successfully</div>
          )}
        </div>
      );
    };

    const user = userEvent.setup();
    renderWithProviders(<TestComponent />);
    
    // Trigger delete mutation
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('delete-success')).toBeInTheDocument();
    });
  });

  test('handles API errors properly', async () => {
    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(
          createErrorResponse('Server error', 500),
          { status: 500 }
        );
      })
    );

    const TestComponent = () => {
      const { data, isLoading, error } = useLookupKeys();
      
      if (isLoading) return <div data-testid="loading">Loading...</div>;
      if (error) return <div data-testid="error">Error: {error.message}</div>;
      
      return <div data-testid="success">Success</div>;
    };

    renderWithProviders(<TestComponent />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/server error/i)).toBeInTheDocument();
  });

  test('supports pagination and filtering', async () => {
    server.use(
      http.get('/api/v2/system/lookup', ({ request }) => {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const filter = url.searchParams.get('filter');
        
        let filteredKeys = mockLookupKeys;
        if (filter) {
          filteredKeys = mockLookupKeys.filter(key => 
            key.name.includes(filter) || key.value.includes(filter)
          );
        }
        
        return HttpResponse.json(
          createMockLookupKeysList(filteredKeys, { limit, offset })
        );
      })
    );

    const TestComponent = () => {
      const { data } = useLookupKeys({
        limit: 10,
        offset: 0,
        filter: 'api',
      });
      
      return (
        <div data-testid="results">
          {data?.resource.map((key) => (
            <div key={key.id}>{key.name}</div>
          ))}
        </div>
      );
    };

    renderWithProviders(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('results')).toBeInTheDocument();
    });
    
    // Should only show filtered results
    expect(screen.getByText('api.default_database')).toBeInTheDocument();
    expect(screen.queryByText('system.debug_mode')).not.toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Lookup Keys Integration Tests', () => {
  beforeEach(() => {
    server.resetHandlers();
    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(createMockLookupKeysList(mockLookupKeys));
      })
    );
  });

  test('complete CRUD workflow', async () => {
    const user = userEvent.setup();
    
    // Mock all CRUD operations
    server.use(
      http.post('/api/v2/system/lookup', async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json(
          createMockLookupKey({
            id: 4,
            name: body.name,
            value: body.value,
            private: body.private,
          })
        );
      }),
      http.put('/api/v2/system/lookup/:id', async ({ request, params }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          id: parseInt(params.id as string),
          ...body,
        });
      }),
      http.delete('/api/v2/system/lookup/:id', () => {
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<LookupKeysPage />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    // CREATE: Add new lookup key
    const createButton = screen.getByRole('button', { name: /create lookup key/i });
    await user.click(createButton);
    
    // Fill form
    await user.type(screen.getByRole('textbox', { name: /key name/i }), 'test.new_key');
    await user.type(screen.getByRole('textbox', { name: /key value/i }), 'test_value');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
    
    // READ: Verify new key appears in list
    await waitFor(() => {
      expect(screen.getByText('test.new_key')).toBeInTheDocument();
    });
    
    // UPDATE: Edit existing key
    const editButton = screen.getByTestId('edit-lookup-key-1');
    await user.click(editButton);
    
    const valueInput = screen.getByRole('textbox', { name: /key value/i });
    await user.clear(valueInput);
    await user.type(valueInput, 'updated_value');
    
    const updateButton = screen.getByRole('button', { name: /update/i });
    await user.click(updateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/updated successfully/i)).toBeInTheDocument();
    });
    
    // DELETE: Remove lookup key
    const deleteButton = screen.getByTestId('delete-lookup-key-2');
    await user.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/deleted successfully/i)).toBeInTheDocument();
    });
  });

  test('error handling across components', async () => {
    // Mock various error scenarios
    server.use(
      http.get('/api/v2/system/lookup', () => {
        return HttpResponse.json(
          createErrorResponse('Database connection failed', 500),
          { status: 500 }
        );
      }),
      http.post('/api/v2/system/lookup', () => {
        return HttpResponse.json(
          createErrorResponse('Validation failed', 422),
          { status: 422 }
        );
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<LookupKeysPage />);
    
    // Check initial error state
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
    });
    
    // Test retry functionality
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  test('accessibility compliance across all components', async () => {
    const { expectAccessible } = renderWithProviders(<LookupKeysPage />);
    
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    // Test main page accessibility
    await expectAccessible();
    
    // Test form accessibility
    const user = userEvent.setup();
    const createButton = screen.getByRole('button', { name: /create lookup key/i });
    await user.click(createButton);
    
    await expectAccessible();
    
    // Test keyboard navigation
    await user.tab();
    expect(screen.getByRole('textbox', { name: /key name/i })).toHaveFocus();
    
    // Test screen reader announcements
    const nameInput = screen.getByRole('textbox', { name: /key name/i });
    expect(nameInput).toHaveAttribute('aria-describedby');
    expect(nameInput).toHaveAccessibleDescription();
  });

  test('performance characteristics and optimization', async () => {
    const startTime = performance.now();
    
    renderWithProviders(<LookupKeysPage />);
    
    await waitFor(() => {
      expect(screen.getByText('api.default_database')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Ensure render time is reasonable (< 1 second for initial render)
    expect(renderTime).toBeLessThan(1000);
    
    // Test that React Query caching is working
    const user = userEvent.setup();
    
    // Navigate away and back
    const createButton = screen.getByRole('button', { name: /create lookup key/i });
    await user.click(createButton);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Data should be available immediately from cache
    expect(screen.getByText('api.default_database')).toBeInTheDocument();
  });
});

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

/**
 * Enhanced test utilities for lookup keys testing
 * 
 * Provides additional testing utilities specific to lookup keys functionality
 * including data generators, custom matchers, and testing helpers.
 */

// Custom testing utilities
const lookupKeysTestUtils = {
  /**
   * Create a complete lookup key test scenario
   */
  createLookupKeyScenario: (overrides: Partial<any> = {}) => {
    return {
      ...createMockLookupKey(),
      ...overrides,
    };
  },

  /**
   * Simulate user interactions for lookup key management
   */
  simulateUserWorkflow: async (user: ReturnType<typeof userEvent.setup>) => {
    // Create new lookup key
    const createButton = screen.getByRole('button', { name: /create lookup key/i });
    await user.click(createButton);
    
    await user.type(screen.getByRole('textbox', { name: /key name/i }), 'test.workflow');
    await user.type(screen.getByRole('textbox', { name: /key value/i }), 'workflow_value');
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);
    
    return 'test.workflow';
  },

  /**
   * Verify lookup key data integrity
   */
  verifyDataIntegrity: (data: any[]) => {
    data.forEach(item => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('value');
      expect(item).toHaveProperty('private');
      expect(typeof item.id).toBe('number');
      expect(typeof item.name).toBe('string');
      expect(typeof item.value).toBe('string');
      expect(typeof item.private).toBe('boolean');
    });
  },
};

// Export test utilities for potential reuse
export { lookupKeysTestUtils };