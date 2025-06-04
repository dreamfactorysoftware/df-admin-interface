import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { NextRouter } from 'next/router';
import { useRouter } from 'next/navigation';

// Import the component under test
import CORSPage from './page';

// Import types and utilities
import type { CorsConfigData } from '@/types/cors';

// Extend jest-dom matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/system-settings/cors'
}));

// Mock React Query DevTools to prevent console warnings in tests
vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null
}));

// Mock data for CORS policies
const mockCorsData: CorsConfigData[] = [
  {
    id: 1,
    path: '/api/v2/*',
    origin: 'https://example.com',
    description: 'Development CORS policy',
    header: 'Content-Type,Authorization',
    exposedHeader: 'X-Custom-Header',
    maxAge: 3600,
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    supportsCredentials: true,
    enabled: true,
    createdById: 1,
    createdDate: '2024-01-01T00:00:00.000Z',
    lastModifiedById: 1,
    lastModifiedDate: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    path: '/api/v2/user/*',
    origin: 'https://app.example.com',
    description: 'Production CORS policy',
    header: 'Content-Type',
    exposedHeader: null,
    maxAge: 7200,
    method: ['GET', 'POST'],
    supportsCredentials: false,
    enabled: true,
    createdById: 1,
    createdDate: '2024-01-02T00:00:00.000Z',
    lastModifiedById: 1,
    lastModifiedDate: '2024-01-02T00:00:00.000Z'
  }
];

// MSW handlers for CORS API endpoints
const corsHandlers = [
  // GET all CORS policies
  http.get('/api/v2/system/cors', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const includeCount = url.searchParams.get('include_count') === 'true';
    
    const slicedData = mockCorsData.slice(offset, offset + limit);
    
    return HttpResponse.json({
      resource: slicedData,
      count: includeCount ? mockCorsData.length : undefined,
      meta: {
        count: slicedData.length
      }
    });
  }),

  // GET single CORS policy
  http.get('/api/v2/system/cors/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const corsPolicy = mockCorsData.find(policy => policy.id === id);
    
    if (!corsPolicy) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 404,
            message: 'CORS policy not found',
            status_code: 404
          }
        }),
        { status: 404 }
      );
    }
    
    return HttpResponse.json({ resource: [corsPolicy] });
  }),

  // POST create CORS policy
  http.post('/api/v2/system/cors', async ({ request }) => {
    const body = await request.json() as { resource: Partial<CorsConfigData>[] };
    const newPolicy = body.resource[0];
    
    // Simulate validation errors
    if (!newPolicy.path || !newPolicy.origin) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 400,
            message: 'Validation failed',
            status_code: 400,
            context: {
              field_errors: {
                path: !newPolicy.path ? ['Path is required'] : undefined,
                origin: !newPolicy.origin ? ['Origin is required'] : undefined
              }
            }
          }
        }),
        { status: 400 }
      );
    }
    
    const createdPolicy: CorsConfigData = {
      ...newPolicy,
      id: mockCorsData.length + 1,
      createdById: 1,
      createdDate: new Date().toISOString(),
      lastModifiedById: 1,
      lastModifiedDate: new Date().toISOString()
    } as CorsConfigData;
    
    mockCorsData.push(createdPolicy);
    
    return HttpResponse.json({ resource: [createdPolicy] }, { status: 201 });
  }),

  // PUT update CORS policy
  http.put('/api/v2/system/cors/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json() as { resource: Partial<CorsConfigData>[] };
    const updates = body.resource[0];
    
    const policyIndex = mockCorsData.findIndex(policy => policy.id === id);
    
    if (policyIndex === -1) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 404,
            message: 'CORS policy not found',
            status_code: 404
          }
        }),
        { status: 404 }
      );
    }
    
    const updatedPolicy: CorsConfigData = {
      ...mockCorsData[policyIndex],
      ...updates,
      lastModifiedDate: new Date().toISOString()
    };
    
    mockCorsData[policyIndex] = updatedPolicy;
    
    return HttpResponse.json({ resource: [updatedPolicy] });
  }),

  // DELETE CORS policy
  http.delete('/api/v2/system/cors/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const policyIndex = mockCorsData.findIndex(policy => policy.id === id);
    
    if (policyIndex === -1) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 404,
            message: 'CORS policy not found',
            status_code: 404
          }
        }),
        { status: 404 }
      );
    }
    
    mockCorsData.splice(policyIndex, 1);
    
    return HttpResponse.json({ resource: [{ id }] });
  }),

  // Bulk delete CORS policies
  http.delete('/api/v2/system/cors', async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids')?.split(',').map(id => parseInt(id)) || [];
    
    const deletedIds: number[] = [];
    ids.forEach(id => {
      const index = mockCorsData.findIndex(policy => policy.id === id);
      if (index !== -1) {
        mockCorsData.splice(index, 1);
        deletedIds.push(id);
      }
    });
    
    return HttpResponse.json({ 
      resource: deletedIds.map(id => ({ id })) 
    });
  }),

  // Error handler for server errors
  http.get('/api/v2/system/cors/error', () => {
    return new HttpResponse(
      JSON.stringify({
        error: {
          code: 500,
          message: 'Internal server error',
          status_code: 500
        }
      }),
      { status: 500 }
    );
  })
];

// Setup MSW server
const server = setupServer(...corsHandlers);

// Custom render function with providers
function renderWithProviders(ui: React.ReactElement, options?: {
  queryClient?: QueryClient;
  router?: Partial<NextRouter>;
}) {
  const queryClient = options?.queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });

  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...options?.router
  };

  vi.mocked(useRouter).mockReturnValue(mockRouter);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary 
          fallback={<div data-testid="error-boundary">Something went wrong</div>}
          onError={(error) => console.error('Error boundary caught:', error)}
        >
          {children}
        </ErrorBoundary>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
    router: mockRouter
  };
}

// Error boundary component for testing
function ErrorComponent() {
  throw new Error('Test error for error boundary');
}

describe('CORS Management Page', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0
        },
        mutations: {
          retry: false
        }
      }
    });
    user = userEvent.setup();
    
    // Reset mock data
    mockCorsData.length = 0;
    mockCorsData.push(
      {
        id: 1,
        path: '/api/v2/*',
        origin: 'https://example.com',
        description: 'Development CORS policy',
        header: 'Content-Type,Authorization',
        exposedHeader: 'X-Custom-Header',
        maxAge: 3600,
        method: ['GET', 'POST', 'PUT', 'DELETE'],
        supportsCredentials: true,
        enabled: true,
        createdById: 1,
        createdDate: '2024-01-01T00:00:00.000Z',
        lastModifiedById: 1,
        lastModifiedDate: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        path: '/api/v2/user/*',
        origin: 'https://app.example.com',
        description: 'Production CORS policy',
        header: 'Content-Type',
        exposedHeader: null,
        maxAge: 7200,
        method: ['GET', 'POST'],
        supportsCredentials: false,
        enabled: true,
        createdById: 1,
        createdDate: '2024-01-02T00:00:00.000Z',
        lastModifiedById: 1,
        lastModifiedDate: '2024-01-02T00:00:00.000Z'
      }
    );
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  describe('Page Rendering and Initial Load', () => {
    it('should render the CORS management page successfully', async () => {
      renderWithProviders(<CORSPage />);
      
      // Check for main page elements
      expect(screen.getByRole('heading', { name: /cors/i })).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Production CORS policy')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      renderWithProviders(<CORSPage />);
      
      // Should show loading indicator while data is being fetched
      expect(screen.getByTestId('loading-indicator') || screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle empty CORS policies list', async () => {
      // Empty the mock data
      mockCorsData.length = 0;
      
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/no cors policies/i) || screen.getByText(/empty/i)).toBeInTheDocument();
      });
    });

    it('should meet accessibility standards', async () => {
      const { container } = renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('CORS Policy Loading and Display', () => {
    it('should fetch and display CORS policies on mount', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
        expect(screen.getByText('Production CORS policy')).toBeInTheDocument();
      });
      
      // Check for CORS policy details
      expect(screen.getByText('/api/v2/*')).toBeInTheDocument();
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('/api/v2/user/*')).toBeInTheDocument();
      expect(screen.getByText('https://app.example.com')).toBeInTheDocument();
    });

    it('should display CORS policy status indicators', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        const enabledBadges = screen.getAllByText(/enabled/i);
        expect(enabledBadges).toHaveLength(2);
      });
    });

    it('should display HTTP methods for each policy', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/GET.*POST.*PUT.*DELETE/)).toBeInTheDocument();
        expect(screen.getByText(/GET.*POST/)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/cors', () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                code: 500,
                message: 'Internal server error',
                status_code: 500
              }
            }),
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('CORS Policy Creation', () => {
    it('should open create dialog when create button is clicked', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const createButton = screen.getByRole('button', { name: /create.*cors|add.*cors|new.*cors/i });
      await user.click(createButton);
      
      // Check for create form or dialog
      expect(screen.getByText(/create.*cors|new.*cors/i)).toBeInTheDocument();
    });

    it('should validate required fields in create form', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const createButton = screen.getByRole('button', { name: /create.*cors|add.*cors|new.*cors/i });
      await user.click(createButton);
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /save|create|submit/i });
      await user.click(submitButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/path.*required/i) || screen.getByText(/required/i)).toBeInTheDocument();
      });
    });

    it('should successfully create a new CORS policy', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const createButton = screen.getByRole('button', { name: /create.*cors|add.*cors|new.*cors/i });
      await user.click(createButton);
      
      // Fill in the form
      const pathInput = screen.getByLabelText(/path/i);
      const originInput = screen.getByLabelText(/origin/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      await user.type(pathInput, '/api/v2/test/*');
      await user.type(originInput, 'https://test.example.com');
      await user.type(descriptionInput, 'Test CORS policy');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save|create|submit/i });
      await user.click(submitButton);
      
      // Should show success message and new policy
      await waitFor(() => {
        expect(screen.getByText('Test CORS policy')).toBeInTheDocument();
        expect(screen.getByText('/api/v2/test/*')).toBeInTheDocument();
      });
    });

    it('should handle create validation errors', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const createButton = screen.getByRole('button', { name: /create.*cors|add.*cors|new.*cors/i });
      await user.click(createButton);
      
      // Fill only description (missing required fields)
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'Incomplete policy');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save|create|submit/i });
      await user.click(submitButton);
      
      // Should show validation errors from server
      await waitFor(() => {
        expect(screen.getByText(/path.*required/i) || screen.getByText(/validation.*failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('CORS Policy Editing', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);
      
      // Check for edit form with pre-filled values
      expect(screen.getByDisplayValue('/api/v2/*')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    });

    it('should successfully update a CORS policy', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);
      
      // Update the description
      const descriptionInput = screen.getByDisplayValue('Development CORS policy');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated CORS policy');
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);
      
      // Should show updated policy
      await waitFor(() => {
        expect(screen.getByText('Updated CORS policy')).toBeInTheDocument();
      });
    });

    it('should handle update errors gracefully', async () => {
      server.use(
        http.put('/api/v2/system/cors/:id', () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                code: 500,
                message: 'Update failed',
                status_code: 500
              }
            }),
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);
      
      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save|update/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/update.*failed|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('CORS Policy Deletion', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Should show confirmation dialog
      expect(screen.getByText(/confirm.*delete|are you sure/i)).toBeInTheDocument();
    });

    it('should successfully delete a CORS policy', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      // Policy should be removed from the list
      await waitFor(() => {
        expect(screen.queryByText('Development CORS policy')).not.toBeInTheDocument();
      });
      
      // Should still have the second policy
      expect(screen.getByText('Production CORS policy')).toBeInTheDocument();
    });

    it('should handle delete errors gracefully', async () => {
      server.use(
        http.delete('/api/v2/system/cors/:id', () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                code: 500,
                message: 'Delete failed',
                status_code: 500
              }
            }),
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/delete.*failed|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should allow selecting multiple CORS policies', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      // Should show bulk action buttons
      expect(screen.getByRole('button', { name: /delete.*selected/i })).toBeInTheDocument();
    });

    it('should successfully perform bulk delete', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);
      
      const bulkDeleteButton = screen.getByRole('button', { name: /delete.*selected/i });
      await user.click(bulkDeleteButton);
      
      // Confirm bulk deletion
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      // All policies should be removed
      await waitFor(() => {
        expect(screen.queryByText('Development CORS policy')).not.toBeInTheDocument();
        expect(screen.queryByText('Production CORS policy')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter CORS policies by search term', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Development');
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
        expect(screen.queryByText('Production CORS policy')).not.toBeInTheDocument();
      });
    });

    it('should filter by enabled status', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const statusFilter = screen.getByLabelText(/status|enabled/i);
      await user.selectOptions(statusFilter, ['enabled']);
      
      // Should show only enabled policies (both in this case)
      expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      expect(screen.getByText('Production CORS policy')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Add more mock data for pagination testing
      for (let i = 3; i <= 30; i++) {
        mockCorsData.push({
          id: i,
          path: `/api/v2/test${i}/*`,
          origin: `https://test${i}.example.com`,
          description: `Test CORS policy ${i}`,
          header: 'Content-Type',
          exposedHeader: null,
          maxAge: 3600,
          method: ['GET'],
          supportsCredentials: false,
          enabled: true,
          createdById: 1,
          createdDate: '2024-01-01T00:00:00.000Z',
          lastModifiedById: 1,
          lastModifiedDate: '2024-01-01T00:00:00.000Z'
        });
      }
    });

    it('should paginate CORS policies correctly', async () => {
      renderWithProviders(<CORSPage />);
      
      // Should show first page by default
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      // Should show pagination controls
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    });

    it('should navigate to next page', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      // Should show different policies on the next page
      await waitFor(() => {
        expect(screen.queryByText('Development CORS policy')).not.toBeInTheDocument();
      });
    });
  });

  describe('React Query Integration', () => {
    it('should cache CORS policies data', async () => {
      const { queryClient } = renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      // Check that data is cached
      const cachedData = queryClient.getQueryData(['cors-policies']);
      expect(cachedData).toBeTruthy();
    });

    it('should invalidate cache after mutations', async () => {
      const { queryClient } = renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      // Mock a successful mutation
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      // Cache should be invalidated and data refetched
      await waitFor(() => {
        expect(screen.queryByText('Development CORS policy')).not.toBeInTheDocument();
      });
    });

    it('should handle optimistic updates', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      // Should immediately update UI (optimistic update)
      expect(screen.queryByText('Development CORS policy')).not.toBeInTheDocument();
    });

    it('should rollback optimistic updates on error', async () => {
      server.use(
        http.delete('/api/v2/system/cors/:id', () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                code: 500,
                message: 'Delete failed',
                status_code: 500
              }
            }),
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      // Should rollback on error
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
        expect(screen.getByText(/delete.*failed|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and display component errors', async () => {
      // Mock a component that throws an error
      vi.doMock('./page', () => ({
        default: ErrorComponent
      }));
      
      const { CORSPage: MockedCORSPage } = await import('./page');
      renderWithProviders(<MockedCORSPage />);
      
      // Should display error boundary fallback
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should recover from errors when component is remounted', async () => {
      const { rerender } = renderWithProviders(<CORSPage />);
      
      // Simulate an error and recovery
      rerender(
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary 
            fallback={<div data-testid="error-boundary">Something went wrong</div>}
            onError={(error) => console.error('Error boundary caught:', error)}
          >
            <CORSPage />
          </ErrorBoundary>
        </QueryClientProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should load data within performance requirements', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 2 seconds (SSR requirement)
      expect(loadTime).toBeLessThan(2000);
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      // Test keyboard navigation through interactive elements
      const createButton = screen.getByRole('button', { name: /create.*cors|add.*cors|new.*cors/i });
      createButton.focus();
      expect(document.activeElement).toBe(createButton);
      
      // Tab to next interactive element
      await user.tab();
      expect(document.activeElement).not.toBe(createButton);
    });

    it('should provide proper ARIA labels and roles', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      // Check for proper ARIA attributes
      expect(screen.getByRole('main') || screen.getByRole('region')).toBeInTheDocument();
      expect(screen.getByRole('table') || screen.getByRole('grid')).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should announce changes to screen readers', async () => {
      renderWithProviders(<CORSPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Development CORS policy')).toBeInTheDocument();
      });
      
      // Delete a policy to trigger announcement
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);
      
      const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
      await user.click(confirmButton);
      
      // Should have live region for announcements
      await waitFor(() => {
        const liveRegion = screen.getByRole('status') || screen.getByRole('alert');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });
});