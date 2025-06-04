/**
 * Comprehensive Vitest Test Suite for Global Lookup Keys Management
 * 
 * This test suite provides comprehensive coverage for lookup keys management components
 * within the system settings section. Implements Vitest 2.1.0 with React Testing Library
 * patterns and MSW for realistic API mocking, targeting 90%+ code coverage.
 * 
 * Key Features:
 * - React Testing Library for component testing
 * - MSW (Mock Service Worker) for realistic API mocking  
 * - Accessibility testing with jest-axe
 * - Form validation testing (React Hook Form + Zod)
 * - SWR/React Query hooks testing
 * - User interaction testing
 * - Error handling and edge case coverage
 * - Performance validation (<100ms validation)
 * 
 * Conversion Notes:
 * - Migrated from Angular TestBed to React Testing Library
 * - Replaced Angular Jest/Karma with Vitest for 10x faster execution
 * - Enhanced accessibility compliance testing per WCAG 2.1 AA
 * - Added comprehensive API mocking with MSW
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Add jest-axe matcher for accessibility testing
expect.extend(toHaveNoViolations);

// Import components under test
import LookupKeysPage from './page';
import { LookupKeysForm } from './lookup-keys-form';
import { useLookupKeys } from './use-lookup-keys';

// Import test utilities and mocks
import { TestWrapper } from '@/test/utils/test-wrapper';
import { mockLookupKeysData, createMockLookupKey } from '@/test/mocks/mock-data';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock notifications/toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock validation timing for performance testing
const mockValidationTimer = vi.fn();

/**
 * Test Wrapper Component with Providers
 * 
 * Wraps components with necessary providers:
 * - SWR configuration
 * - Theme provider
 * - Error boundary
 * - Mock router context
 */
const WrapperComponent = ({ children }: { children: React.ReactNode }) => (
  <TestWrapper>
    {children}
  </TestWrapper>
);

// =============================================================================
// MOCK DATA SETUP
// =============================================================================

const mockLookupKeys = [
  {
    id: 1,
    name: 'test_key_1',
    value: 'Test Value 1',
    private: false,
  },
  {
    id: 2, 
    name: 'test_key_2',
    value: 'Test Value 2',
    private: true,
  },
  {
    id: 3,
    name: 'app_config',
    value: 'Application Configuration',
    private: false,
  },
];

const mockEmptyLookupKeys: any[] = [];

// =============================================================================
// MSW HANDLER SETUP
// =============================================================================

/**
 * Setup MSW handlers for lookup keys API endpoints
 * Provides realistic API mocking for development and testing
 */
const setupMockHandlers = (scenario: 'success' | 'error' | 'empty' | 'validation' = 'success') => {
  const handlers = [];

  // GET /api/v2/system/constant - Fetch lookup keys
  handlers.push(
    http.get('/api/v2/system/constant', ({ request }) => {
      const url = new URL(request.url);
      const include_count = url.searchParams.get('include_count');
      
      switch (scenario) {
        case 'error':
          return HttpResponse.json(
            {
              error: {
                code: 500,
                message: 'Internal server error retrieving lookup keys',
                status_code: 500,
              },
            },
            { status: 500 }
          );
        case 'empty':
          return HttpResponse.json({
            resource: mockEmptyLookupKeys,
            meta: include_count ? { count: 0 } : undefined,
          });
        default:
          return HttpResponse.json({
            resource: mockLookupKeys,
            meta: include_count ? { count: mockLookupKeys.length } : undefined,
          });
      }
    })
  );

  // POST /api/v2/system/constant - Create lookup keys
  handlers.push(
    http.post('/api/v2/system/constant', async ({ request }) => {
      const body = await request.json() as { resource: any[] };
      
      if (scenario === 'validation') {
        return HttpResponse.json(
          {
            error: {
              code: 422,
              message: 'Validation error',
              status_code: 422,
              context: {
                field_errors: {
                  'resource.0.name': ['Name already exists'],
                },
              },
            },
          },
          { status: 422 }
        );
      }

      if (scenario === 'error') {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Internal server error creating lookup keys',
              status_code: 500,
            },
          },
          { status: 500 }
        );
      }

      // Simulate successful creation
      const createdKeys = (body.resource || []).map((key, index) => ({
        ...key,
        id: mockLookupKeys.length + index + 1,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
      }));

      return HttpResponse.json({
        resource: createdKeys,
      });
    })
  );

  // PUT /api/v2/system/constant/{id} - Update lookup key
  handlers.push(
    http.put('/api/v2/system/constant/:id', async ({ params, request }) => {
      const { id } = params;
      const body = await request.json() as any;

      if (scenario === 'validation') {
        return HttpResponse.json(
          {
            error: {
              code: 422,
              message: 'Validation error',
              status_code: 422,
              context: {
                field_errors: {
                  name: ['Name already exists'],
                },
              },
            },
          },
          { status: 422 }
        );
      }

      if (scenario === 'error') {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Internal server error updating lookup key',
              status_code: 500,
            },
          },
          { status: 500 }
        );
      }

      // Find and update the key
      const existingKey = mockLookupKeys.find(key => key.id === parseInt(id as string));
      if (!existingKey) {
        return HttpResponse.json(
          {
            error: {
              code: 404,
              message: 'Lookup key not found',
              status_code: 404,
            },
          },
          { status: 404 }
        );
      }

      const updatedKey = {
        ...existingKey,
        ...body,
        last_modified_date: new Date().toISOString(),
      };

      return HttpResponse.json(updatedKey);
    })
  );

  // DELETE /api/v2/system/constant/{id} - Delete lookup key
  handlers.push(
    http.delete('/api/v2/system/constant/:id', ({ params }) => {
      const { id } = params;

      if (scenario === 'error') {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Internal server error deleting lookup key',
              status_code: 500,
            },
          },
          { status: 500 }
        );
      }

      return HttpResponse.json({ success: true });
    })
  );

  return handlers;
};

// =============================================================================
// MAIN TEST SUITES
// =============================================================================

describe('LookupKeysPage Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Setup user event with realistic timing
    user = userEvent.setup({
      delay: null, // No artificial delay for testing
    });

    // Clear all mocks
    vi.clearAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
    mockToast.mockClear();

    // Setup default successful mock handlers
    server.use(...setupMockHandlers('success'));
  });

  afterEach(() => {
    // Reset handlers after each test
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-page')).toBeInTheDocument();
      });
    });

    it('should display page title and description', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Global Lookup Keys/i);
        expect(screen.getByText(/Manage global lookup key-value pairs/i)).toBeInTheDocument();
      });
    });

    it('should render lookup keys table with data', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        // Check for table headers
        expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /value/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /private/i })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

        // Check for lookup key data
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
        expect(screen.getByText('Test Value 1')).toBeInTheDocument();
        expect(screen.getByText('test_key_2')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      expect(screen.getByTestId('lookup-keys-loading')).toBeInTheDocument();
    });

    it('should show empty state when no lookup keys exist', async () => {
      server.use(...setupMockHandlers('empty'));

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-empty-state')).toBeInTheDocument();
        expect(screen.getByText(/No lookup keys found/i)).toBeInTheDocument();
      });
    });

    it('should show error state when API fails', async () => {
      server.use(...setupMockHandlers('error'));

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-error-state')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load lookup keys/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should open create form when "Add Lookup Key" button is clicked', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-page')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);

      expect(screen.getByTestId('lookup-keys-form-dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /create lookup key/i })).toBeInTheDocument();
    });

    it('should open edit form when edit button is clicked', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByTestId('lookup-keys-form-dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /edit lookup key/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('test_key_1')).toBeInTheDocument();
    });

    it('should confirm deletion when delete button is clicked', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
    });

    it('should handle bulk operations with selected items', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      // Select multiple checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // First data row
      await user.click(checkboxes[2]); // Second data row

      // Bulk actions should now be available
      expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument();
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should show loading state briefly
      expect(screen.getByTestId('lookup-keys-loading')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('should filter lookup keys based on search input', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('textbox', { name: /search lookup keys/i });
      await user.type(searchInput, 'test_key_1');

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
        expect(screen.queryByText('test_key_2')).not.toBeInTheDocument();
      });
    });

    it('should show no results message when search yields no matches', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('textbox', { name: /search lookup keys/i });
      await user.type(searchInput, 'nonexistent_key');

      await waitFor(() => {
        expect(screen.getByText(/No lookup keys match your search/i)).toBeInTheDocument();
      });
    });

    it('should clear search when clear button is clicked', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const searchInput = screen.getByRole('textbox', { name: /search lookup keys/i });
      await user.type(searchInput, 'test');

      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(screen.getByText('test_key_1')).toBeInTheDocument();
      expect(screen.getByText('test_key_2')).toBeInTheDocument();
    });
  });

  describe('Performance Testing', () => {
    it('should load initial data within performance targets', async () => {
      const startTime = performance.now();

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load within 2 seconds as per React/Next.js Integration Requirements
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock a large dataset
      const largeMockData = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `test_key_${i + 1}`,
        value: `Test Value ${i + 1}`,
        private: i % 2 === 0,
      }));

      server.use(
        http.get('/api/v2/system/constant', () => {
          return HttpResponse.json({
            resource: largeMockData,
            meta: { count: largeMockData.length },
          });
        })
      );

      const startTime = performance.now();

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-page')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render efficiently with large datasets
      expect(renderTime).toBeLessThan(3000);
    });
  });

  describe('Error Handling', () => {
    it('should display appropriate error message when API fails', async () => {
      server.use(...setupMockHandlers('error'));

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load lookup keys/i)).toBeInTheDocument();
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
      });
    });

    it('should show retry option when data loading fails', async () => {
      server.use(...setupMockHandlers('error'));

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });

      // Clicking retry should attempt to reload
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      expect(screen.getByTestId('lookup-keys-loading')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/constant', () => {
          return HttpResponse.error();
        })
      );

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });
});

describe('LookupKeysForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ delay: null });
    vi.clearAllMocks();
    server.use(...setupMockHandlers('success'));
  });

  describe('Form Rendering', () => {
    it('should render create form with empty fields', () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /create lookup key/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/value/i)).toHaveValue('');
      expect(screen.getByLabelText(/private/i)).not.toBeChecked();
    });

    it('should render edit form with pre-filled data', () => {
      const mockKey = mockLookupKeys[0];

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
            initialData={mockKey}
          />
        </WrapperComponent>
      );

      expect(screen.getByRole('heading', { name: /edit lookup key/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('test_key_1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Value 1')).toBeInTheDocument();
      expect(screen.getByLabelText(/private/i)).not.toBeChecked();
    });

    it('should display required field indicators', () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      // Check for required field indicators (usually asterisks or aria-required)
      const nameField = screen.getByLabelText(/name/i);
      expect(nameField).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      const onSuccess = vi.fn();

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={onSuccess}
          />
        </WrapperComponent>
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should validate name uniqueness', async () => {
      server.use(...setupMockHandlers('validation'));

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const valueField = screen.getByLabelText(/value/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameField, 'duplicate_name');
      await user.type(valueField, 'Some value');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name already exists/i)).toBeInTheDocument();
      });
    });

    it('should validate name format (no spaces, special characters)', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameField, 'invalid name with spaces');
      await user.type(screen.getByLabelText(/value/i), 'Some value');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });
    });

    it('should perform real-time validation under 100ms', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const startTime = performance.now();

      await user.type(nameField, 'invalid name');

      await waitFor(() => {
        expect(screen.getByText(/Name must only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Should validate within 100ms as per React/Next.js Integration Requirements
      expect(validationTime).toBeLessThan(100);
    });

    it('should clear validation errors when input is corrected', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);

      // Enter invalid input
      await user.type(nameField, 'invalid name');
      await waitFor(() => {
        expect(screen.getByText(/Name must only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });

      // Clear and enter valid input
      await user.clear(nameField);
      await user.type(nameField, 'valid_name');

      await waitFor(() => {
        expect(screen.queryByText(/Name must only contain letters, numbers, and underscores/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should successfully create new lookup key', async () => {
      const onSuccess = vi.fn();

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={onSuccess}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const valueField = screen.getByLabelText(/value/i);
      const privateField = screen.getByLabelText(/private/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameField, 'new_test_key');
      await user.type(valueField, 'New Test Value');
      await user.click(privateField);
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lookup key created successfully',
        });
      });
    });

    it('should successfully update existing lookup key', async () => {
      const onSuccess = vi.fn();
      const mockKey = mockLookupKeys[0];

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={onSuccess}
            initialData={mockKey}
          />
        </WrapperComponent>
      );

      const valueField = screen.getByDisplayValue('Test Value 1');
      const submitButton = screen.getByRole('button', { name: /update/i });

      await user.clear(valueField);
      await user.type(valueField, 'Updated Test Value');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lookup key updated successfully',
        });
      });
    });

    it('should disable submit button while form is submitting', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const valueField = screen.getByLabelText(/value/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameField, 'new_key');
      await user.type(valueField, 'New Value');

      // Submit form
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/creating/i);
    });

    it('should handle server errors during submission', async () => {
      server.use(...setupMockHandlers('error'));

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const valueField = screen.getByLabelText(/value/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameField, 'new_key');
      await user.type(valueField, 'New Value');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: expect.stringContaining('Internal server error'),
          variant: 'destructive',
        });
      });
    });
  });

  describe('Form State Management', () => {
    it('should mark form as dirty when fields are modified', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      
      // Initially form should not show unsaved changes warning
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();

      // Type in field to make form dirty
      await user.type(nameField, 'test');

      // Form should now indicate unsaved changes
      await waitFor(() => {
        expect(screen.getByTestId('form-dirty-indicator')).toBeInTheDocument();
      });
    });

    it('should reset form when cancelled', async () => {
      const onClose = vi.fn();

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={onClose}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.type(nameField, 'test_input');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should warn about unsaved changes when closing dirty form', async () => {
      const onClose = vi.fn();

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={onClose}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const closeButton = screen.getByRole('button', { name: /close/i });

      await user.type(nameField, 'test_input');
      await user.click(closeButton);

      // Should show confirmation dialog
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility Testing', () => {
    it('should have no accessibility violations in create mode', async () => {
      const { container } = render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in edit mode', async () => {
      const mockKey = mockLookupKeys[0];

      const { container } = render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
            initialData={mockKey}
          />
        </WrapperComponent>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Test tab navigation through form fields
      const nameField = screen.getByLabelText(/name/i);
      const valueField = screen.getByLabelText(/value/i);
      const privateField = screen.getByLabelText(/private/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      nameField.focus();
      expect(nameField).toHaveFocus();

      await user.tab();
      expect(valueField).toHaveFocus();

      await user.tab();
      expect(privateField).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should announce form errors to screen readers', async () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should provide proper field descriptions', () => {
      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={vi.fn()}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const nameField = screen.getByLabelText(/name/i);
      const privateField = screen.getByLabelText(/private/i);

      expect(nameField).toHaveAttribute('aria-describedby');
      expect(privateField).toHaveAttribute('aria-describedby');

      // Check for helper text
      expect(screen.getByText(/Unique identifier for the lookup key/i)).toBeInTheDocument();
      expect(screen.getByText(/Mark as private to restrict access/i)).toBeInTheDocument();
    });

    it('should escape key to close dialog', async () => {
      const onClose = vi.fn();

      render(
        <WrapperComponent>
          <LookupKeysForm 
            isOpen={true}
            onClose={onClose}
            onSuccess={vi.fn()}
          />
        </WrapperComponent>
      );

      const dialog = screen.getByRole('dialog');
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('useLookupKeys Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.use(...setupMockHandlers('success'));
  });

  describe('Data Fetching', () => {
    it('should fetch lookup keys successfully', async () => {
      const TestComponent = () => {
        const { data, isLoading, error } = useLookupKeys();
        
        if (isLoading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error">{error.message}</div>;
        
        return (
          <div data-testid="success">
            {data?.map(key => (
              <div key={key.id} data-testid={`key-${key.id}`}>
                {key.name}: {key.value}
              </div>
            ))}
          </div>
        );
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // Should show data after loading
      await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
        expect(screen.getByTestId('key-1')).toHaveTextContent('test_key_1: Test Value 1');
        expect(screen.getByTestId('key-2')).toHaveTextContent('test_key_2: Test Value 2');
      });
    });

    it('should handle fetch errors gracefully', async () => {
      server.use(...setupMockHandlers('error'));

      const TestComponent = () => {
        const { data, isLoading, error } = useLookupKeys();
        
        if (isLoading) return <div data-testid="loading">Loading...</div>;
        if (error) return <div data-testid="error">{error.message}</div>;
        
        return <div data-testid="success">Success</div>;
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
      });
    });

    it('should support data revalidation', async () => {
      const TestComponent = () => {
        const { data, isLoading, mutate } = useLookupKeys();
        
        return (
          <div>
            <div data-testid="count">{data?.length || 0}</div>
            <button 
              onClick={() => mutate()}
              data-testid="revalidate"
            >
              Revalidate
            </button>
          </div>
        );
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3');
      });

      // Change mock data and revalidate
      server.use(
        http.get('/api/v2/system/constant', () => {
          return HttpResponse.json({
            resource: [...mockLookupKeys, { id: 4, name: 'new_key', value: 'New Value', private: false }],
          });
        })
      );

      const revalidateButton = screen.getByTestId('revalidate');
      await user.click(revalidateButton);

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('4');
      });
    });
  });

  describe('CRUD Operations', () => {
    it('should create lookup key with optimistic updates', async () => {
      const TestComponent = () => {
        const { data, createLookupKey } = useLookupKeys();
        
        const handleCreate = () => {
          createLookupKey({
            name: 'optimistic_key',
            value: 'Optimistic Value',
            private: false,
          });
        };
        
        return (
          <div>
            <div data-testid="count">{data?.length || 0}</div>
            <button onClick={handleCreate} data-testid="create">
              Create
            </button>
          </div>
        );
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3');
      });

      const createButton = screen.getByTestId('create');
      await user.click(createButton);

      // Should optimistically update count immediately
      expect(screen.getByTestId('count')).toHaveTextContent('4');

      // Should maintain optimistic update after API response
      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('4');
      });
    });

    it('should update lookup key with optimistic updates', async () => {
      const TestComponent = () => {
        const { data, updateLookupKey } = useLookupKeys();
        
        const handleUpdate = () => {
          if (data && data[0]) {
            updateLookupKey(data[0].id, {
              ...data[0],
              value: 'Updated Value',
            });
          }
        };
        
        return (
          <div>
            <div data-testid="first-value">{data?.[0]?.value || 'Loading'}</div>
            <button onClick={handleUpdate} data-testid="update">
              Update
            </button>
          </div>
        );
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('first-value')).toHaveTextContent('Test Value 1');
      });

      const updateButton = screen.getByTestId('update');
      await user.click(updateButton);

      // Should optimistically show updated value
      expect(screen.getByTestId('first-value')).toHaveTextContent('Updated Value');
    });

    it('should delete lookup key with optimistic updates', async () => {
      const TestComponent = () => {
        const { data, deleteLookupKey } = useLookupKeys();
        
        const handleDelete = () => {
          if (data && data[0]) {
            deleteLookupKey(data[0].id);
          }
        };
        
        return (
          <div>
            <div data-testid="count">{data?.length || 0}</div>
            <button onClick={handleDelete} data-testid="delete">
              Delete
            </button>
          </div>
        );
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3');
      });

      const deleteButton = screen.getByTestId('delete');
      await user.click(deleteButton);

      // Should optimistically reduce count
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });

    it('should rollback optimistic updates on API failure', async () => {
      server.use(...setupMockHandlers('error'));

      const TestComponent = () => {
        const { data, createLookupKey } = useLookupKeys();
        
        const handleCreate = () => {
          createLookupKey({
            name: 'failing_key',
            value: 'This will fail',
            private: false,
          });
        };
        
        return (
          <div>
            <div data-testid="count">{data?.length || 0}</div>
            <button onClick={handleCreate} data-testid="create">
              Create
            </button>
          </div>
        );
      };

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3');
      });

      const createButton = screen.getByTestId('create');
      await user.click(createButton);

      // Should optimistically update first
      expect(screen.getByTestId('count')).toHaveTextContent('4');

      // Should rollback after API failure
      await waitFor(() => {
        expect(screen.getByTestId('count')).toHaveTextContent('3');
      });
    });
  });

  describe('SWR Cache Management', () => {
    it('should cache responses for performance', async () => {
      let requestCount = 0;

      server.use(
        http.get('/api/v2/system/constant', () => {
          requestCount++;
          return HttpResponse.json({
            resource: mockLookupKeys,
          });
        })
      );

      const TestComponent1 = () => {
        const { data, isLoading } = useLookupKeys();
        return <div data-testid="component1">{isLoading ? 'Loading' : 'Loaded'}</div>;
      };

      const TestComponent2 = () => {
        const { data, isLoading } = useLookupKeys();
        return <div data-testid="component2">{isLoading ? 'Loading' : 'Loaded'}</div>;
      };

      render(
        <WrapperComponent>
          <TestComponent1 />
          <TestComponent2 />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('component1')).toHaveTextContent('Loaded');
        expect(screen.getByTestId('component2')).toHaveTextContent('Loaded');
      });

      // Should only make one request due to caching
      expect(requestCount).toBe(1);
    });

    it('should provide cache hit responses under 50ms', async () => {
      const TestComponent = () => {
        const { data, isLoading } = useLookupKeys();
        return <div data-testid="status">{isLoading ? 'Loading' : 'Loaded'}</div>;
      };

      // First render to populate cache
      const { unmount } = render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Loaded');
      });

      unmount();

      // Second render should use cache
      const startTime = performance.now();

      render(
        <WrapperComponent>
          <TestComponent />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('Loaded');
      });

      const endTime = performance.now();
      const cacheHitTime = endTime - startTime;

      // Should be much faster on cache hit (under 50ms per requirements)
      expect(cacheHitTime).toBeLessThan(50);
    });
  });
});

describe('Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ delay: null });
    vi.clearAllMocks();
    server.use(...setupMockHandlers('success'));
  });

  describe('Complete Workflow Tests', () => {
    it('should complete full CRUD workflow', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      // CREATE: Add new lookup key
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);

      const nameField = screen.getByLabelText(/name/i);
      const valueField = screen.getByLabelText(/value/i);
      const createButton = screen.getByRole('button', { name: /create/i });

      await user.type(nameField, 'integration_test_key');
      await user.type(valueField, 'Integration Test Value');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lookup key created successfully',
        });
      });

      // READ: Verify new key appears in list
      await waitFor(() => {
        expect(screen.getByText('integration_test_key')).toBeInTheDocument();
      });

      // UPDATE: Edit the new key
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const newKeyEditButton = editButtons.find(button => 
        button.closest('tr')?.textContent?.includes('integration_test_key')
      );
      
      if (newKeyEditButton) {
        await user.click(newKeyEditButton);

        const editValueField = screen.getByDisplayValue('Integration Test Value');
        const updateButton = screen.getByRole('button', { name: /update/i });

        await user.clear(editValueField);
        await user.type(editValueField, 'Updated Integration Test Value');
        await user.click(updateButton);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Success',
            description: 'Lookup key updated successfully',
          });
        });
      }

      // DELETE: Remove the key
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      const newKeyDeleteButton = deleteButtons.find(button => 
        button.closest('tr')?.textContent?.includes('integration_test_key')
      );
      
      if (newKeyDeleteButton) {
        await user.click(newKeyDeleteButton);

        const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Success',
            description: 'Lookup key deleted successfully',
          });
        });
      }
    });

    it('should handle form validation throughout workflow', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-page')).toBeInTheDocument();
      });

      // Open create form
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);

      // Test validation on empty submit
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      // Test validation on invalid name
      const nameField = screen.getByLabelText(/name/i);
      await user.type(nameField, 'invalid name with spaces');

      await waitFor(() => {
        expect(screen.getByText(/Name must only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });

      // Test successful submission with valid data
      await user.clear(nameField);
      await user.type(nameField, 'valid_test_key');
      await user.type(screen.getByLabelText(/value/i), 'Valid Test Value');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lookup key created successfully',
        });
      });
    });

    it('should maintain data consistency across operations', async () => {
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
        expect(screen.getByText('test_key_2')).toBeInTheDocument();
        expect(screen.getByText('app_config')).toBeInTheDocument();
      });

      // Count initial items
      const initialRows = screen.getAllByRole('row').length - 1; // Subtract header row
      expect(initialRows).toBe(3);

      // Add new item and verify count increases
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);

      await user.type(screen.getByLabelText(/name/i), 'consistency_test');
      await user.type(screen.getByLabelText(/value/i), 'Consistency Test');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        const newRows = screen.getAllByRole('row').length - 1;
        expect(newRows).toBe(4);
      });

      // Verify data integrity
      expect(screen.getByText('consistency_test')).toBeInTheDocument();
      expect(screen.getByText('Consistency Test')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Tests', () => {
    it('should recover from temporary network failures', async () => {
      // Start with successful state
      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
      });

      // Simulate network failure
      server.use(...setupMockHandlers('error'));

      // Try to refresh data
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load lookup keys/i)).toBeInTheDocument();
      });

      // Restore network and retry
      server.use(...setupMockHandlers('success'));

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('test_key_1')).toBeInTheDocument();
        expect(screen.queryByText(/Failed to load lookup keys/i)).not.toBeInTheDocument();
      });
    });

    it('should handle validation errors gracefully', async () => {
      server.use(...setupMockHandlers('validation'));

      render(
        <WrapperComponent>
          <LookupKeysPage />
        </WrapperComponent>
      );

      await waitFor(() => {
        expect(screen.getByTestId('lookup-keys-page')).toBeInTheDocument();
      });

      // Try to create duplicate
      const addButton = screen.getByRole('button', { name: /add lookup key/i });
      await user.click(addButton);

      await user.type(screen.getByLabelText(/name/i), 'duplicate_key');
      await user.type(screen.getByLabelText(/value/i), 'Duplicate Value');
      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/Name already exists/i)).toBeInTheDocument();
      });

      // Form should remain open for correction
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Correct the name and retry
      const nameField = screen.getByLabelText(/name/i);
      await user.clear(nameField);
      await user.type(nameField, 'unique_key');

      // Switch back to success scenario
      server.use(...setupMockHandlers('success'));

      await user.click(screen.getByRole('button', { name: /create/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Lookup key created successfully',
        });
      });
    });
  });
});