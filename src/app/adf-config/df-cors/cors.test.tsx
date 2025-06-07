/**
 * CORS Management Components Test Suite
 * 
 * Comprehensive test coverage for CORS configuration management functionality
 * in the DreamFactory Admin Interface React/Next.js migration. This test suite
 * validates component rendering, user interactions, API operations, error handling,
 * and accessibility compliance using Vitest, React Testing Library, and MSW.
 * 
 * Test Coverage:
 * - CORS configuration page component (page.tsx)
 * - CORS configuration details form (cors-config-details.tsx)
 * - CORS table component with virtual scrolling (cors-table.tsx)
 * - Custom CORS operations hook (use-cors-operations.ts)
 * - MSW API handlers for realistic testing
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Error handling and edge cases
 * - Loading states and user feedback
 * - Keyboard navigation and screen reader support
 * 
 * Performance Requirements:
 * - Test execution under 30 seconds (10x faster than Jest/Karma)
 * - Real-time validation under 100ms
 * - Cache hit responses under 50ms simulation
 * - 90%+ code coverage targets
 * 
 * Technology Stack:
 * - Vitest 2.1.0 for testing framework
 * - React Testing Library for component testing
 * - MSW 0.49.0 for API mocking
 * - jest-axe for accessibility testing
 * - React Hook Form + Zod validation testing
 * - SWR/React Query testing patterns
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Component imports
import CorsPage from './page';
import CorsConfigDetails from './cors-config-details';
import CorsTable from './cors-table';

// Test utilities and providers
import { TestProviders } from '@/test/utils/test-providers';
import { createMockRouter, createMockSearchParams } from '@/test/utils/mock-router';
import { mockCorsEntries, mockCorsEntry, createMockCorsEntry } from '@/test/mocks/cors-data';

// Add jest-axe custom matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MSW HANDLERS FOR CORS API ENDPOINTS
// ============================================================================

/**
 * Mock Service Worker handlers for CORS configuration endpoints
 * Provides realistic API responses for development and testing
 */
const corsHandlers = [
  // GET /api/v2/system/cors - List CORS configurations
  http.get('/api/v2/system/cors', ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit')) || 25;
    const offset = Number(url.searchParams.get('offset')) || 0;
    const includeCount = url.searchParams.get('include_count') === 'true';
    const filter = url.searchParams.get('filter');
    
    let filteredEntries = [...mockCorsEntries];
    
    // Apply filter if provided
    if (filter) {
      const filterLower = filter.toLowerCase();
      filteredEntries = mockCorsEntries.filter(entry =>
        entry.path.toLowerCase().includes(filterLower) ||
        entry.origin.toLowerCase().includes(filterLower) ||
        entry.host.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply pagination
    const paginatedEntries = filteredEntries.slice(offset, offset + limit);
    
    const response = {
      resource: paginatedEntries,
      ...(includeCount && {
        meta: {
          count: paginatedEntries.length,
          total: filteredEntries.length,
          limit,
          offset,
        },
      }),
    };
    
    return HttpResponse.json(response);
  }),

  // GET /api/v2/system/cors/:id - Get specific CORS configuration
  http.get('/api/v2/system/cors/:id', ({ params }) => {
    const { id } = params;
    const corsEntry = mockCorsEntries.find(entry => entry.id === Number(id));
    
    if (!corsEntry) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'CORS configuration not found',
            details: `No CORS configuration found with ID: ${id}`,
          },
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(corsEntry);
  }),

  // POST /api/v2/system/cors - Create new CORS configuration
  http.post('/api/v2/system/cors', async ({ request }) => {
    const corsData = await request.json() as any;
    
    // Validate required fields
    const requiredFields = ['path', 'origin'];
    const missingFields = requiredFields.filter(field => !corsData[field]);
    
    if (missingFields.length > 0) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Validation failed',
            details: 'Missing required fields',
            validation_errors: Object.fromEntries(
              missingFields.map(field => [field, [`The ${field} field is required.`]])
            ),
          },
        },
        { status: 400 }
      );
    }
    
    // Create new CORS entry
    const newEntry = createMockCorsEntry({
      ...corsData,
      id: Math.max(...mockCorsEntries.map(e => e.id)) + 1,
    });
    
    mockCorsEntries.push(newEntry);
    
    return HttpResponse.json(newEntry, { status: 201 });
  }),

  // PUT /api/v2/system/cors/:id - Update CORS configuration
  http.put('/api/v2/system/cors/:id', async ({ params, request }) => {
    const { id } = params;
    const corsData = await request.json() as any;
    const entryIndex = mockCorsEntries.findIndex(entry => entry.id === Number(id));
    
    if (entryIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'CORS configuration not found',
            details: `No CORS configuration found with ID: ${id}`,
          },
        },
        { status: 404 }
      );
    }
    
    // Update existing entry
    const updatedEntry = {
      ...mockCorsEntries[entryIndex],
      ...corsData,
      updated_at: new Date().toISOString(),
    };
    
    mockCorsEntries[entryIndex] = updatedEntry;
    
    return HttpResponse.json(updatedEntry);
  }),

  // DELETE /api/v2/system/cors/:id - Delete CORS configuration
  http.delete('/api/v2/system/cors/:id', ({ params }) => {
    const { id } = params;
    const entryIndex = mockCorsEntries.findIndex(entry => entry.id === Number(id));
    
    if (entryIndex === -1) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'CORS configuration not found',
            details: `No CORS configuration found with ID: ${id}`,
          },
        },
        { status: 404 }
      );
    }
    
    // Remove entry
    const deletedEntry = mockCorsEntries.splice(entryIndex, 1)[0];
    
    return HttpResponse.json({ success: true, resource: deletedEntry });
  }),

  // DELETE /api/v2/system/cors - Bulk delete CORS configurations
  http.delete('/api/v2/system/cors', async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids')?.split(',').map(Number) || [];
    
    if (ids.length === 0) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Bad Request',
            details: 'No IDs provided for bulk delete operation',
          },
        },
        { status: 400 }
      );
    }
    
    const deletedEntries: any[] = [];
    const notFoundIds: number[] = [];
    
    ids.forEach(id => {
      const entryIndex = mockCorsEntries.findIndex(entry => entry.id === id);
      if (entryIndex !== -1) {
        deletedEntries.push(mockCorsEntries.splice(entryIndex, 1)[0]);
      } else {
        notFoundIds.push(id);
      }
    });
    
    return HttpResponse.json({
      success: true,
      resource: deletedEntries,
      ...(notFoundIds.length > 0 && {
        warnings: [`CORS configurations not found for IDs: ${notFoundIds.join(', ')}`],
      }),
    });
  }),

  // POST /api/v2/system/cors/test - Test CORS configuration
  http.post('/api/v2/system/cors/test', async ({ request }) => {
    const corsData = await request.json() as any;
    
    // Simulate CORS validation
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate test delay
    
    const isValid = corsData.path && corsData.origin;
    const hasValidMethods = corsData.methods && corsData.methods.length > 0;
    
    return HttpResponse.json({
      success: isValid && hasValidMethods,
      message: isValid && hasValidMethods 
        ? 'CORS configuration is valid' 
        : 'CORS configuration validation failed',
      details: {
        path_valid: !!corsData.path,
        origin_valid: !!corsData.origin,
        methods_valid: hasValidMethods,
        headers_configured: corsData.headers && corsData.headers.length > 0,
        credentials_enabled: corsData.supports_credentials,
      },
    });
  }),
];

// Setup MSW server with CORS handlers
const server = setupServer(...corsHandlers);

// ============================================================================
// TEST SETUP AND TEARDOWN
// ============================================================================

beforeEach(() => {
  // Reset mock data before each test
  mockCorsEntries.length = 0;
  mockCorsEntries.push(
    createMockCorsEntry({
      id: 1,
      path: '/api/v2/*',
      origin: 'https://app.example.com',
      host: 'api.dreamfactory.local',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
      supports_credentials: true,
      max_age: 86400,
      enabled: true,
    }),
    createMockCorsEntry({
      id: 2,
      path: '/api/v2/db/*',
      origin: 'https://admin.example.com',
      host: 'api.dreamfactory.local',
      methods: ['GET', 'POST'],
      headers: ['Content-Type', 'Authorization'],
      supports_credentials: false,
      max_age: 3600,
      enabled: true,
    }),
    createMockCorsEntry({
      id: 3,
      path: '/api/v2/system/*',
      origin: '*',
      host: 'api.dreamfactory.local',
      methods: ['GET'],
      headers: ['Content-Type'],
      supports_credentials: false,
      max_age: 300,
      enabled: false,
    })
  );
  
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // Clean up after each test
  server.resetHandlers();
  vi.clearAllMocks();
});

// ============================================================================
// CORS PAGE COMPONENT TESTS
// ============================================================================

describe('CorsPage Component', () => {
  test('renders CORS management page with correct structure', async () => {
    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Verify page heading
    expect(screen.getByRole('heading', { name: /cors configuration/i })).toBeInTheDocument();
    
    // Verify description
    expect(screen.getByText(/configure cross-origin resource sharing/i)).toBeInTheDocument();
    
    // Verify create button
    expect(screen.getByRole('button', { name: /create cors rule/i })).toBeInTheDocument();
    
    // Wait for CORS table to load
    await waitFor(() => {
      expect(screen.getByTestId('cors-table-container')).toBeInTheDocument();
    });
  });

  test('displays loading state while fetching CORS configurations', async () => {
    // Delay the MSW response to test loading state
    server.use(
      http.get('/api/v2/system/cors', () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(HttpResponse.json({ resource: mockCorsEntries }));
          }, 1000);
        });
      })
    );

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Verify loading state
    expect(screen.getByTestId('cors-table-loading')).toBeInTheDocument();
    expect(screen.getByText(/loading cors configurations/i)).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('cors-table-loading')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('handles CORS configuration fetch errors gracefully', async () => {
    // Mock API error response
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Internal Server Error',
              details: 'Failed to fetch CORS configurations',
            },
          },
          { status: 500 }
        );
      })
    );

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('cors-table-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load cors configurations/i)).toBeInTheDocument();
    expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
  });

  test('opens create CORS dialog when create button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Click create button
    const createButton = screen.getByRole('button', { name: /create cors rule/i });
    await user.click(createButton);

    // Verify dialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /create cors configuration/i })).toBeInTheDocument();
    });

    expect(screen.getByTestId('cors-config-details-form')).toBeInTheDocument();
  });

  test('meets accessibility requirements', async () => {
    const { container } = render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getByTestId('cors-table-container')).toBeInTheDocument();
    });

    // Run accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByTestId('cors-table-container')).toBeInTheDocument();
    });

    // Test keyboard navigation to create button
    await user.tab();
    expect(screen.getByRole('button', { name: /create cors rule/i })).toHaveFocus();

    // Test Enter key activation
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CORS CONFIG DETAILS COMPONENT TESTS
// ============================================================================

describe('CorsConfigDetails Component', () => {
  test('renders create form with all required fields', () => {
    render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
      </TestProviders>
    );

    // Verify form fields
    expect(screen.getByLabelText(/^path/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^origin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allowed methods/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/allowed headers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supports credentials/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enabled/i)).toBeInTheDocument();

    // Verify action buttons
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('renders edit form with pre-populated data', () => {
    const existingCors = mockCorsEntries[0];

    render(
      <TestProviders>
        <CorsConfigDetails 
          mode="edit" 
          corsId={existingCors.id}
          onSuccess={vi.fn()} 
          onCancel={vi.fn()} 
        />
      </TestProviders>
    );

    // Wait for form to load with existing data
    waitFor(() => {
      const pathInput = screen.getByDisplayValue(existingCors.path);
      const originInput = screen.getByDisplayValue(existingCors.origin);
      
      expect(pathInput).toBeInTheDocument();
      expect(originInput).toBeInTheDocument();
    });
  });

  test('validates required fields in real-time', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
      </TestProviders>
    );

    const pathInput = screen.getByLabelText(/^path/i);
    const originInput = screen.getByLabelText(/^origin/i);

    // Test empty field validation
    await user.click(pathInput);
    await user.tab(); // Blur the field

    await waitFor(() => {
      expect(screen.getByText(/path is required/i)).toBeInTheDocument();
    });

    // Test valid input removes error
    await user.type(pathInput, '/api/v2/*');
    await waitFor(() => {
      expect(screen.queryByText(/path is required/i)).not.toBeInTheDocument();
    });

    // Test origin validation
    await user.click(originInput);
    await user.type(originInput, 'invalid-origin');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/invalid origin format/i)).toBeInTheDocument();
    });

    // Test valid origin
    await user.clear(originInput);
    await user.type(originInput, 'https://example.com');
    await waitFor(() => {
      expect(screen.queryByText(/invalid origin format/i)).not.toBeInTheDocument();
    });
  });

  test('submits form with correct data format', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={onSuccess} onCancel={vi.fn()} />
      </TestProviders>
    );

    // Fill in form fields
    await user.type(screen.getByLabelText(/^path/i), '/api/v2/test/*');
    await user.type(screen.getByLabelText(/^origin/i), 'https://test.example.com');
    await user.type(screen.getByLabelText(/^host/i), 'api.test.com');
    
    // Select HTTP methods
    const methodsSelect = screen.getByLabelText(/allowed methods/i);
    await user.click(methodsSelect);
    await user.click(screen.getByText('GET'));
    await user.click(screen.getByText('POST'));

    // Submit form
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Wait for successful submission
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    // Verify the API was called with correct data
    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/test/*',
        origin: 'https://test.example.com',
        host: 'api.test.com',
        methods: expect.arrayContaining(['GET', 'POST']),
      })
    );
  });

  test('handles form submission errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock API error response
    server.use(
      http.post('/api/v2/system/cors', () => {
        return HttpResponse.json(
          {
            error: {
              code: 400,
              message: 'Validation Error',
              details: 'Invalid CORS configuration',
              validation_errors: {
                path: ['Path must start with /'],
                origin: ['Origin must be a valid URL'],
              },
            },
          },
          { status: 400 }
        );
      })
    );

    render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
      </TestProviders>
    );

    // Fill in invalid data
    await user.type(screen.getByLabelText(/^path/i), 'invalid-path');
    await user.type(screen.getByLabelText(/^origin/i), 'invalid-origin');

    // Submit form
    const createButton = screen.getByRole('button', { name: /create/i });
    await user.click(createButton);

    // Wait for error messages
    await waitFor(() => {
      expect(screen.getByText(/path must start with \//i)).toBeInTheDocument();
      expect(screen.getByText(/origin must be a valid url/i)).toBeInTheDocument();
    });
  });

  test('supports CORS configuration testing', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
      </TestProviders>
    );

    // Fill in test configuration
    await user.type(screen.getByLabelText(/^path/i), '/api/v2/test/*');
    await user.type(screen.getByLabelText(/^origin/i), 'https://test.example.com');
    
    // Click test configuration button
    const testButton = screen.getByRole('button', { name: /test configuration/i });
    await user.click(testButton);

    // Verify loading state
    expect(screen.getByText(/testing cors configuration/i)).toBeInTheDocument();

    // Wait for test results
    await waitFor(() => {
      expect(screen.getByTestId('cors-test-results')).toBeInTheDocument();
    });

    expect(screen.getByText(/cors configuration is valid/i)).toBeInTheDocument();
  });

  test('meets accessibility requirements with proper labeling', async () => {
    const { container } = render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
      </TestProviders>
    );

    // Run accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Verify ARIA labels
    expect(screen.getByLabelText(/^path/i)).toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText(/^origin/i)).toHaveAttribute('aria-describedby');

    // Verify error handling accessibility
    const pathInput = screen.getByLabelText(/^path/i);
    expect(pathInput).toHaveAttribute('aria-invalid', 'false');
  });
});

// ============================================================================
// CORS TABLE COMPONENT TESTS
// ============================================================================

describe('CorsTable Component', () => {
  test('renders CORS table with correct columns and data', async () => {
    render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={vi.fn()} />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify table headers
    expect(screen.getByRole('columnheader', { name: /path/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /origin/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /methods/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

    // Verify data rows
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(mockCorsEntries.length + 1); // +1 for header

    // Verify first row data
    expect(screen.getByText('/api/v2/*')).toBeInTheDocument();
    expect(screen.getByText('https://app.example.com')).toBeInTheDocument();
  });

  test('supports table filtering and search functionality', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={vi.fn()} />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Test search functionality
    const searchInput = screen.getByPlaceholderText(/search cors configurations/i);
    await user.type(searchInput, 'admin');

    // Wait for filtered results
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(2); // Header + 1 matching row
    });

    expect(screen.getByText('https://admin.example.com')).toBeInTheDocument();
    expect(screen.queryByText('https://app.example.com')).not.toBeInTheDocument();
  });

  test('handles pagination for large datasets', async () => {
    // Add more mock data
    for (let i = 4; i <= 30; i++) {
      mockCorsEntries.push(
        createMockCorsEntry({
          id: i,
          path: `/api/v2/test${i}/*`,
          origin: `https://test${i}.example.com`,
        })
      );
    }

    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={vi.fn()} />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Verify pagination controls
    expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();
    expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();

    // Test next page navigation
    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/page 2 of/i)).toBeInTheDocument();
    });
  });

  test('supports row selection and bulk operations', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={onDelete} />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Select multiple rows
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First data row
    await user.click(checkboxes[2]); // Second data row

    // Verify bulk actions are available
    expect(screen.getByTestId('bulk-actions-toolbar')).toBeInTheDocument();
    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();

    // Test bulk delete
    const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
    await user.click(bulkDeleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);

    // Wait for deletion to complete
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith([1, 2]);
    });
  });

  test('handles edit and delete actions correctly', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TestProviders>
        <CorsTable onEdit={onEdit} onDelete={onDelete} />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Test edit action
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockCorsEntries[0]);

    // Test delete action
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Confirm deletion dialog
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith([mockCorsEntries[0].id]);
    });
  });

  test('supports keyboard navigation and accessibility', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={vi.fn()} />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Test keyboard navigation
    const firstRow = screen.getAllByRole('row')[1]; // Skip header row
    firstRow.focus();

    // Test arrow key navigation
    await user.keyboard('{ArrowDown}');
    const secondRow = screen.getAllByRole('row')[2];
    expect(secondRow).toHaveFocus();

    // Test Enter key for selection
    await user.keyboard('{Enter}');
    const checkbox = within(secondRow).getByRole('checkbox');
    expect(checkbox).toBeChecked();

    // Run accessibility tests
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('displays appropriate empty state when no data', async () => {
    // Clear mock data
    mockCorsEntries.length = 0;

    render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={vi.fn()} />
      </TestProviders>
    );

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByTestId('cors-table-empty-state')).toBeInTheDocument();
    });

    expect(screen.getByText(/no cors configurations found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first cors rule/i })).toBeInTheDocument();
  });
});

// ============================================================================
// CORS OPERATIONS HOOK TESTS
// ============================================================================

describe('useCorsOperations Hook', () => {
  test('provides CORS data fetching functionality', async () => {
    const TestComponent = () => {
      const { data, isLoading, error } = useCorsOperations();
      
      if (isLoading) return <div data-testid="loading">Loading...</div>;
      if (error) return <div data-testid="error">Error: {error.message}</div>;
      
      return (
        <div data-testid="cors-data">
          {data?.resource.map((cors: any) => (
            <div key={cors.id} data-testid={`cors-item-${cors.id}`}>
              {cors.path} - {cors.origin}
            </div>
          ))}
        </div>
      );
    };

    render(
      <TestProviders>
        <TestComponent />
      </TestProviders>
    );

    // Verify loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('cors-data')).toBeInTheDocument();
    });

    // Verify CORS data is displayed
    expect(screen.getByTestId('cors-item-1')).toBeInTheDocument();
    expect(screen.getByText('/api/v2/* - https://app.example.com')).toBeInTheDocument();
  });

  test('handles CORS creation mutations', async () => {
    const TestComponent = () => {
      const { createCors, isCreating } = useCorsOperations();
      
      const handleCreate = () => {
        createCors.mutate({
          path: '/api/v2/new/*',
          origin: 'https://new.example.com',
          methods: ['GET', 'POST'],
          headers: ['Content-Type'],
          supports_credentials: false,
          max_age: 3600,
          enabled: true,
        });
      };
      
      return (
        <div>
          <button onClick={handleCreate} disabled={isCreating} data-testid="create-button">
            {isCreating ? 'Creating...' : 'Create CORS'}
          </button>
          {createCors.isSuccess && <div data-testid="success">CORS created successfully</div>}
          {createCors.error && <div data-testid="error">Error: {createCors.error.message}</div>}
        </div>
      );
    };

    const user = userEvent.setup();

    render(
      <TestProviders>
        <TestComponent />
      </TestProviders>
    );

    // Click create button
    const createButton = screen.getByTestId('create-button');
    await user.click(createButton);

    // Verify loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();

    // Wait for success
    await waitFor(() => {
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });

  test('handles optimistic updates and rollback on error', async () => {
    // Mock API error for testing rollback
    server.use(
      http.post('/api/v2/system/cors', () => {
        return HttpResponse.json(
          {
            error: {
              code: 500,
              message: 'Server Error',
              details: 'Failed to create CORS configuration',
            },
          },
          { status: 500 }
        );
      })
    );

    const TestComponent = () => {
      const { data, createCors } = useCorsOperations();
      
      const handleCreate = () => {
        createCors.mutate({
          path: '/api/v2/error/*',
          origin: 'https://error.example.com',
        });
      };
      
      return (
        <div>
          <button onClick={handleCreate} data-testid="create-button">Create CORS</button>
          <div data-testid="cors-count">Count: {data?.resource.length || 0}</div>
          {createCors.error && <div data-testid="error">Error occurred</div>}
        </div>
      );
    };

    const user = userEvent.setup();

    render(
      <TestProviders>
        <TestComponent />
      </TestProviders>
    );

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getByText('Count: 3')).toBeInTheDocument();
    });

    // Trigger failed creation
    const createButton = screen.getByTestId('create-button');
    await user.click(createButton);

    // Wait for error and rollback
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    // Verify count is back to original (rollback occurred)
    expect(screen.getByText('Count: 3')).toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('CORS Management Integration', () => {
  test('complete CORS creation workflow', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /cors configuration/i })).toBeInTheDocument();
    });

    // Start creation process
    const createButton = screen.getByRole('button', { name: /create cors rule/i });
    await user.click(createButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Fill out form
    await user.type(screen.getByLabelText(/^path/i), '/api/v2/integration/*');
    await user.type(screen.getByLabelText(/^origin/i), 'https://integration.example.com');
    await user.type(screen.getByLabelText(/^host/i), 'api.integration.com');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Wait for success and dialog to close
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify new CORS entry appears in table
    await waitFor(() => {
      expect(screen.getByText('/api/v2/integration/*')).toBeInTheDocument();
      expect(screen.getByText('https://integration.example.com')).toBeInTheDocument();
    });
  });

  test('complete CORS editing workflow', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Click edit on first CORS entry
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    // Wait for edit dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /edit cors configuration/i })).toBeInTheDocument();
    });

    // Modify the path
    const pathInput = screen.getByLabelText(/^path/i);
    await user.clear(pathInput);
    await user.type(pathInput, '/api/v2/updated/*');

    // Submit changes
    const updateButton = screen.getByRole('button', { name: /update/i });
    await user.click(updateButton);

    // Wait for dialog to close and table to refresh
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify updated data appears
    await waitFor(() => {
      expect(screen.getByText('/api/v2/updated/*')).toBeInTheDocument();
    });
  });

  test('complete CORS deletion workflow', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsPage />
      </TestProviders>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Get initial row count
    const initialRows = screen.getAllByRole('row');
    const initialCount = initialRows.length;

    // Click delete on first CORS entry
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    await user.click(confirmButton);

    // Wait for dialog to close and table to refresh
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify row was removed
    await waitFor(() => {
      const updatedRows = screen.getAllByRole('row');
      expect(updatedRows).toHaveLength(initialCount - 1);
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('CORS Management Performance', () => {
  test('table renders efficiently with large datasets', async () => {
    // Add many CORS entries for performance testing
    const largeMockData = [];
    for (let i = 1; i <= 1000; i++) {
      largeMockData.push(
        createMockCorsEntry({
          id: i,
          path: `/api/v2/perf${i}/*`,
          origin: `https://perf${i}.example.com`,
        })
      );
    }

    // Override MSW handler for large dataset
    server.use(
      http.get('/api/v2/system/cors', () => {
        return HttpResponse.json({ resource: largeMockData });
      })
    );

    const startTime = performance.now();

    render(
      <TestProviders>
        <CorsTable onEdit={vi.fn()} onDelete={vi.fn()} />
      </TestProviders>
    );

    // Wait for table to render
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Verify performance requirement (should render in under 2 seconds)
    expect(renderTime).toBeLessThan(2000);

    // Verify virtual scrolling is working (not all items rendered)
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThan(100); // Virtual scrolling limits visible rows
  });

  test('form validation responds under 100ms', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <CorsConfigDetails mode="create" onSuccess={vi.fn()} onCancel={vi.fn()} />
      </TestProviders>
    );

    const pathInput = screen.getByLabelText(/^path/i);

    // Measure validation response time
    const startTime = performance.now();
    
    await user.type(pathInput, 'invalid');
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByText(/path must start with \//i)).toBeInTheDocument();
    });

    const endTime = performance.now();
    const validationTime = endTime - startTime;

    // Verify validation performance requirement
    expect(validationTime).toBeLessThan(100);
  });
});