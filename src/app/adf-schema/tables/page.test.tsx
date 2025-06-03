import { describe, it, expect, beforeEach, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import TablesPage from './page'

// Mock data for testing
const mockTableData = Array.from({ length: 1250 }, (_, index) => ({
  name: `table_${index + 1}`,
  label: `Table ${index + 1}`,
  id: `table_${index + 1}`,
  description: `Description for table ${index + 1}`,
  type: 'table',
  access: ['read', 'write'],
  primaryKey: 'id',
  foreignKeys: index % 3 === 0 ? [`fk_${index}`] : [],
  indexes: [`idx_${index}_created`, `idx_${index}_updated`],
  isVirtual: false,
  allowUpsert: true,
  maxRecords: 1000,
  cacheEnabled: true,
  cacheTime: 300
}))

const mockSmallTableSet = mockTableData.slice(0, 25)
const mockLargeTableSet = mockTableData

// MSW request handlers for schema discovery API endpoints
const handlers = [
  // Schema discovery endpoint - tables listing
  http.get('/api/v2/:service/_schema', ({ request, params }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const filter = url.searchParams.get('filter')
    const refresh = url.searchParams.get('refresh') === 'true'
    const fields = url.searchParams.get('fields')?.split(',') || ['name', 'label']

    let filteredData = mockLargeTableSet

    // Apply filtering if specified
    if (filter) {
      const filterLower = filter.toLowerCase()
      filteredData = mockLargeTableSet.filter(table => 
        table.name.toLowerCase().includes(filterLower) ||
        table.label.toLowerCase().includes(filterLower)
      )
    }

    // Apply pagination
    const paginatedData = filteredData.slice(offset, offset + limit)

    // Apply field selection
    const responseData = paginatedData.map(table => {
      if (fields.length === 2 && fields.includes('name') && fields.includes('label')) {
        return {
          name: table.name,
          label: table.label,
          id: table.id
        }
      }
      return table
    })

    return HttpResponse.json({
      resource: responseData,
      meta: {
        count: responseData.length,
        total: filteredData.length,
        limit,
        offset,
        schema: ['name', 'label', 'description']
      }
    })
  }),

  // Individual table schema endpoint
  http.get('/api/v2/:service/_schema/:tableName', ({ params }) => {
    const { tableName } = params
    const table = mockLargeTableSet.find(t => t.name === tableName)
    
    if (!table) {
      return new HttpResponse(null, { status: 404 })
    }

    return HttpResponse.json({
      resource: {
        ...table,
        fields: [
          {
            name: 'id',
            label: 'ID',
            type: 'integer',
            isPrimaryKey: true,
            isRequired: true,
            isAutoIncrement: true
          },
          {
            name: 'name',
            label: 'Name',
            type: 'string',
            maxLength: 255,
            isRequired: true
          },
          {
            name: 'created_at',
            label: 'Created At',
            type: 'timestamp',
            isRequired: true
          },
          {
            name: 'updated_at',
            label: 'Updated At',
            type: 'timestamp',
            isRequired: true
          }
        ]
      }
    })
  }),

  // Service configuration endpoint
  http.get('/api/v2/system/service/:serviceId', ({ params }) => {
    return HttpResponse.json({
      resource: {
        id: parseInt(params.serviceId as string),
        name: 'test_database',
        label: 'Test Database',
        type: 'mysql',
        isActive: true,
        config: {
          host: 'localhost',
          port: 3306,
          database: 'test_db'
        }
      }
    })
  }),

  // Error scenarios for testing error handling
  http.get('/api/v2/error_service/_schema', () => {
    return new HttpResponse(null, { status: 500 })
  }),

  // Slow response for testing loading states
  http.get('/api/v2/slow_service/_schema', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return HttpResponse.json({
      resource: mockSmallTableSet.slice(0, 5),
      meta: { count: 5, total: 5 }
    })
  })
]

// Test server setup
const server = setupServer(...handlers)

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0
    },
    mutations: {
      retry: false
    }
  }
})

const renderWithProviders = (
  component: React.ReactElement,
  { 
    initialRoute = '/adf-schema/tables',
    serviceName = 'test_database'
  } = {}
) => {
  const queryClient = createTestQueryClient()
  
  const router = createMemoryRouter([
    {
      path: '/adf-schema/tables',
      element: component
    },
    {
      path: '/adf-schema/tables/:tableId',
      element: <div data-testid="table-details">Table Details Page</div>
    }
  ], {
    initialEntries: [initialRoute]
  })

  // Mock URL parameters for service name
  vi.spyOn(require('next/navigation'), 'useParams').mockReturnValue({
    service: serviceName
  })

  vi.spyOn(require('next/navigation'), 'useRouter').mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

// Test suite
describe('TablesPage', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  describe('Basic Rendering and Data Fetching', () => {
    it('should render tables page with loading state initially', async () => {
      renderWithProviders(<TablesPage />)

      // Verify loading skeleton is displayed
      expect(screen.getByTestId('tables-loading')).toBeInTheDocument()
      expect(screen.getByText(/loading tables/i)).toBeInTheDocument()
    })

    it('should render table list after successful data fetch', async () => {
      renderWithProviders(<TablesPage />)

      // Wait for data to load
      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Verify table list is rendered
      expect(screen.getByTestId('tables-list')).toBeInTheDocument()
      expect(screen.getByText('table_1')).toBeInTheDocument()
      expect(screen.getByText('Table 1')).toBeInTheDocument()
    })

    it('should display error state when API request fails', async () => {
      renderWithProviders(<TablesPage />, { serviceName: 'error_service' })

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByTestId('tables-error')).toBeInTheDocument()
      })

      expect(screen.getByText(/failed to load tables/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('TanStack Virtual Integration for Large Datasets', () => {
    it('should handle large dataset with virtualization (1000+ tables)', async () => {
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Verify virtual scrolling container
      const virtualContainer = screen.getByTestId('virtual-table-container')
      expect(virtualContainer).toBeInTheDocument()

      // Check that not all 1250 tables are rendered in DOM (only visible ones)
      const renderedTableRows = screen.getAllByTestId(/^table-row-/)
      expect(renderedTableRows.length).toBeLessThan(mockLargeTableSet.length)
      expect(renderedTableRows.length).toBeGreaterThan(0)

      // Verify virtual scrolling properties
      expect(virtualContainer).toHaveAttribute('data-virtual-total', '1250')
    })

    it('should update visible items when scrolling through large dataset', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const virtualContainer = screen.getByTestId('virtual-table-container')
      const scrollableArea = screen.getByTestId('virtual-scrollable-area')

      // Get initial visible items
      const initialItems = screen.getAllByTestId(/^table-row-/)
      const firstItemText = initialItems[0].textContent

      // Scroll down significantly
      await user.click(scrollableArea)
      fireEvent.scroll(scrollableArea, { target: { scrollTop: 5000 } })

      // Wait for new items to render
      await waitFor(() => {
        const newItems = screen.getAllByTestId(/^table-row-/)
        expect(newItems[0].textContent).not.toBe(firstItemText)
      })

      // Verify scroll position updated
      expect(scrollableArea.scrollTop).toBeGreaterThan(0)
    })

    it('should maintain performance with rapid scrolling', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const scrollableArea = screen.getByTestId('virtual-scrollable-area')
      
      // Simulate rapid scrolling
      const startTime = performance.now()
      
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(scrollableArea, { target: { scrollTop: i * 1000 } })
      }

      const endTime = performance.now()
      const scrollTime = endTime - startTime

      // Verify scrolling completes quickly (under 100ms for 10 scroll events)
      expect(scrollTime).toBeLessThan(100)

      // Verify DOM remains stable
      expect(screen.getByTestId('virtual-table-container')).toBeInTheDocument()
    })
  })

  describe('React Query Caching and Invalidation', () => {
    it('should cache table data and serve from cache on subsequent renders', async () => {
      const { rerender } = renderWithProviders(<TablesPage />)

      // Wait for initial load
      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))
      expect(screen.getByText('table_1')).toBeInTheDocument()

      // Track API calls
      let apiCallCount = 0
      server.use(
        http.get('/api/v2/:service/_schema', () => {
          apiCallCount++
          return HttpResponse.json({
            resource: mockSmallTableSet,
            meta: { count: 25, total: 25 }
          })
        })
      )

      // Rerender component
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <TablesPage />
        </QueryClientProvider>
      )

      // Verify data is served from cache (no loading state)
      expect(screen.queryByTestId('tables-loading')).not.toBeInTheDocument()
      expect(apiCallCount).toBe(0) // No additional API call
    })

    it('should invalidate cache and refetch when refresh is triggered', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Setup API call tracking
      let refreshCallCount = 0
      server.use(
        http.get('/api/v2/:service/_schema', ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('refresh') === 'true') {
            refreshCallCount++
          }
          return HttpResponse.json({
            resource: [{ name: 'refreshed_table', label: 'Refreshed Table', id: 'refreshed_table' }],
            meta: { count: 1, total: 1 }
          })
        })
      )

      // Trigger refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      // Verify cache invalidation and refresh
      await waitFor(() => {
        expect(screen.getByText('Refreshed Table')).toBeInTheDocument()
      })
      expect(refreshCallCount).toBe(1)
    })

    it('should handle cache with TTL configuration for background refetching', async () => {
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Mock a scenario where data changes in background
      server.use(
        http.get('/api/v2/:service/_schema', () => {
          return HttpResponse.json({
            resource: [{ name: 'background_updated_table', label: 'Background Updated', id: 'bg_table' }],
            meta: { count: 1, total: 1 }
          })
        })
      )

      // Wait for background refetch (staleTime should trigger update)
      await waitFor(() => {
        expect(screen.getByText('Background Updated')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Filtering and Search Functionality', () => {
    it('should filter tables based on search input', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Find search input
      const searchInput = screen.getByPlaceholderText(/search tables/i)
      expect(searchInput).toBeInTheDocument()

      // Perform search
      await user.type(searchInput, 'table_1')

      // Wait for filtered results
      await waitFor(() => {
        // Should show tables matching the filter
        expect(screen.getByText('table_1')).toBeInTheDocument()
        // Should not show unmatched tables
        expect(screen.queryByText('table_20')).not.toBeInTheDocument()
      })
    })

    it('should clear search filter when search input is cleared', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const searchInput = screen.getByPlaceholderText(/search tables/i)

      // Apply filter
      await user.type(searchInput, 'nonexistent')
      await waitFor(() => {
        expect(screen.getByTestId('no-tables-found')).toBeInTheDocument()
      })

      // Clear filter
      await user.clear(searchInput)

      // Verify all tables are shown again
      await waitFor(() => {
        expect(screen.queryByTestId('no-tables-found')).not.toBeInTheDocument()
        expect(screen.getByText('table_1')).toBeInTheDocument()
      })
    })

    it('should handle case-insensitive filtering', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const searchInput = screen.getByPlaceholderText(/search tables/i)

      // Search with different case
      await user.type(searchInput, 'TABLE_1')

      await waitFor(() => {
        expect(screen.getByText('table_1')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation and Routing', () => {
    it('should navigate to table details when table row is clicked', async () => {
      const user = userEvent.setup()
      const mockRouter = vi.mocked(require('next/navigation').useRouter())
      
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Click on first table row
      const firstTableRow = screen.getByTestId('table-row-table_1')
      await user.click(firstTableRow)

      // Verify navigation was called
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/tables/table_1')
    })

    it('should navigate to table details via action button', async () => {
      const user = userEvent.setup()
      const mockRouter = vi.mocked(require('next/navigation').useRouter())
      
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Click on view details button for first table
      const viewButton = screen.getByTestId('view-table-table_1')
      await user.click(viewButton)

      // Verify navigation was called
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/tables/table_1')
    })

    it('should handle keyboard navigation for accessibility', async () => {
      const user = userEvent.setup()
      const mockRouter = vi.mocked(require('next/navigation').useRouter())
      
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Focus first table row
      const firstTableRow = screen.getByTestId('table-row-table_1')
      await user.tab()
      expect(firstTableRow).toHaveFocus()

      // Press Enter to navigate
      await user.keyboard('{Enter}')

      // Verify navigation was called
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/tables/table_1')
    })
  })

  describe('User Interactions and Accessibility', () => {
    it('should support keyboard navigation through table rows', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Navigate through rows using Tab
      await user.tab() // Focus search input
      await user.tab() // Focus first table row
      expect(screen.getByTestId('table-row-table_1')).toHaveFocus()

      await user.tab() // Focus second table row
      expect(screen.getByTestId('table-row-table_2')).toHaveFocus()
    })

    it('should announce loading state to screen readers', async () => {
      renderWithProviders(<TablesPage />)

      // Verify ARIA live region for loading
      const loadingAnnouncement = screen.getByRole('status')
      expect(loadingAnnouncement).toHaveTextContent(/loading tables/i)
    })

    it('should provide proper ARIA labels for interactive elements', async () => {
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      // Verify ARIA labels
      expect(screen.getByLabelText(/search tables/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/refresh table list/i)).toBeInTheDocument()
      
      // Verify table accessibility
      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Database tables')
    })

    it('should handle focus management when filtering', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const searchInput = screen.getByPlaceholderText(/search tables/i)
      
      // Focus should remain on search input during filtering
      await user.type(searchInput, 'table_5')
      expect(searchInput).toHaveFocus()

      // Results should update without losing focus
      await waitFor(() => {
        expect(screen.getByText('table_5')).toBeInTheDocument()
      })
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should display retry button when initial load fails', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TablesPage />, { serviceName: 'error_service' })

      await waitFor(() => {
        expect(screen.getByTestId('tables-error')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()

      // Test retry functionality
      server.use(
        http.get('/api/v2/error_service/_schema', () => {
          return HttpResponse.json({
            resource: mockSmallTableSet.slice(0, 3),
            meta: { count: 3, total: 3 }
          })
        })
      )

      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByText('table_1')).toBeInTheDocument()
      })
    })

    it('should handle empty table list gracefully', async () => {
      server.use(
        http.get('/api/v2/:service/_schema', () => {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0, total: 0 }
          })
        })
      )

      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      expect(screen.getByTestId('no-tables-found')).toBeInTheDocument()
      expect(screen.getByText(/no tables found/i)).toBeInTheDocument()
    })

    it('should handle slow network responses with appropriate loading states', async () => {
      renderWithProviders(<TablesPage />, { serviceName: 'slow_service' })

      // Verify loading state is shown
      expect(screen.getByTestId('tables-loading')).toBeInTheDocument()

      // Wait for slow response
      await waitFor(() => {
        expect(screen.getByText('table_1')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.queryByTestId('tables-loading')).not.toBeInTheDocument()
    })
  })

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily during scrolling', async () => {
      const user = userEvent.setup()
      let renderCount = 0
      
      // Mock component to track renders
      const TestWrapper = () => {
        renderCount++
        return <TablesPage />
      }

      renderWithProviders(<TestWrapper />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const initialRenderCount = renderCount
      const scrollableArea = screen.getByTestId('virtual-scrollable-area')

      // Perform multiple scroll operations
      for (let i = 0; i < 5; i++) {
        fireEvent.scroll(scrollableArea, { target: { scrollTop: i * 500 } })
      }

      // Allow time for any potential re-renders
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify minimal re-renders occurred
      expect(renderCount - initialRenderCount).toBeLessThan(3)
    })

    it('should debounce search input to avoid excessive API calls', async () => {
      const user = userEvent.setup()
      let searchCallCount = 0

      server.use(
        http.get('/api/v2/:service/_schema', ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('filter')) {
            searchCallCount++
          }
          return HttpResponse.json({
            resource: mockSmallTableSet,
            meta: { count: 25, total: 25 }
          })
        })
      )

      renderWithProviders(<TablesPage />)

      await waitForElementToBeRemoved(() => screen.queryByTestId('tables-loading'))

      const searchInput = screen.getByPlaceholderText(/search tables/i)

      // Rapidly type search terms
      await user.type(searchInput, 'test_search', { delay: 50 })

      // Wait for debounce to complete
      await waitFor(() => {
        expect(searchCallCount).toBe(1)
      }, { timeout: 1000 })

      // Verify only one API call was made despite multiple keystrokes
      expect(searchCallCount).toBe(1)
    })
  })
})