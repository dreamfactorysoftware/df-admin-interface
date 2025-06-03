/**
 * @fileoverview Vitest test suite for API Documentation Table Component
 * 
 * Comprehensive test coverage for the React/Next.js API documentation table component,
 * validating table functionality, data fetching, pagination, virtualization, and user interactions.
 * Converts Angular component testing patterns to modern React testing with MSW integration.
 * 
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent, within, act } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

import { ApiDocsTable } from './api-docs-table'
import { createTestWrapper } from '../../../test/test-utils'
import { apiDocsHandlers } from '../../../test/mocks/handlers'
import { 
  mockApiDocsServices, 
  mockLargeDataset, 
  mockPaginatedResponse,
  mockEmptyResponse
} from '../../../test/mocks/service-data'

// MSW server setup for realistic API testing
const server = setupServer(...apiDocsHandlers)

// Mock Next.js router for navigation testing
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/adf-api-docs',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock react-query for testing data fetching patterns
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Disable caching for tests
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Mock virtual scrolling for performance testing
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => mockApiDocsServices.slice(0, 10),
    getTotalSize: () => 500,
    scrollToIndex: vi.fn(),
    measure: vi.fn(),
  })),
}))

// Mock accessibility announcements
const mockAnnounce = vi.fn()
vi.mock('@react-aria/live-announcer', () => ({
  announce: mockAnnounce,
}))

// Mock intersection observer for virtual scrolling
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
global.IntersectionObserver = mockIntersectionObserver

describe('ApiDocsTable Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    queryClient = createTestQueryClient()
    user = userEvent.setup()
    
    // Reset all mocks
    vi.clearAllMocks()
    mockAnnounce.mockClear()
    mockPush.mockClear()
    mockReplace.mockClear()
    mockBack.mockClear()
  })

  afterEach(() => {
    server.resetHandlers()
    queryClient.clear()
  })

  afterAll(() => {
    server.close()
  })

  const renderApiDocsTable = (props = {}) => {
    const defaultProps = {
      searchQuery: '',
      sortField: 'name',
      sortDirection: 'asc' as const,
      currentPage: 1,
      pageSize: 10,
      onSearch: vi.fn(),
      onSort: vi.fn(),
      onPageChange: vi.fn(),
      onRowClick: vi.fn(),
      ...props,
    }

    return render(
      <QueryClientProvider client={queryClient}>
        <ApiDocsTable {...defaultProps} />
      </QueryClientProvider>,
      { wrapper: createTestWrapper() }
    )
  }

  describe('Component Rendering and Structure', () => {
    it('should render the API docs table with proper accessibility attributes', async () => {
      renderApiDocsTable()

      // Verify table structure with accessibility attributes
      const table = await screen.findByRole('table', { 
        name: /api documentation services/i 
      })
      expect(table).toBeInTheDocument()
      expect(table).toHaveAttribute('aria-label', 'API Documentation Services')

      // Verify column headers with sorting capabilities
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      expect(nameHeader).toBeInTheDocument()
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')

      const labelHeader = screen.getByRole('columnheader', { name: /display label/i })
      expect(labelHeader).toBeInTheDocument()

      const descriptionHeader = screen.getByRole('columnheader', { name: /description/i })
      expect(descriptionHeader).toBeInTheDocument()

      const typeHeader = screen.getByRole('columnheader', { name: /service type/i })
      expect(typeHeader).toBeInTheDocument()

      const actionsHeader = screen.getByRole('columnheader', { name: /actions/i })
      expect(actionsHeader).toBeInTheDocument()
    })

    it('should render loading state with appropriate accessibility announcements', () => {
      // Mock loading state
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.delay('infinite'))
        })
      )

      renderApiDocsTable()

      const loadingIndicator = screen.getByRole('status', { name: /loading api documentation/i })
      expect(loadingIndicator).toBeInTheDocument()
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite')
    })

    it('should render empty state when no services are available', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json(mockEmptyResponse))
        })
      )

      renderApiDocsTable()

      const emptyMessage = await screen.findByText(/no api documentation services found/i)
      expect(emptyMessage).toBeInTheDocument()
      expect(emptyMessage).toHaveAttribute('role', 'status')
    })

    it('should render error state with retry functionality', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
        })
      )

      renderApiDocsTable()

      const errorMessage = await screen.findByText(/failed to load api documentation/i)
      expect(errorMessage).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })
  })

  describe('Data Fetching and State Management', () => {
    it('should fetch API documentation services using React Query', async () => {
      renderApiDocsTable()

      // Wait for data to be fetched and rendered
      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Verify service data is displayed correctly
      expect(screen.getByText('Database API')).toBeInTheDocument()
      expect(screen.getByText('User Authentication')).toBeInTheDocument()
      
      // Verify service types are displayed
      expect(screen.getByText('mysql')).toBeInTheDocument()
      expect(screen.getByText('postgresql')).toBeInTheDocument()
    })

    it('should implement intelligent caching with SWR semantics', async () => {
      const { rerender } = renderApiDocsTable()

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Rerender component - should use cached data
      rerender(
        <QueryClientProvider client={queryClient}>
          <ApiDocsTable
            searchQuery=""
            sortField="name"
            sortDirection="asc"
            currentPage={1}
            pageSize={10}
            onSearch={vi.fn()}
            onSort={vi.fn()}
            onPageChange={vi.fn()}
            onRowClick={vi.fn()}
          />
        </QueryClientProvider>
      )

      // Data should be immediately available from cache
      expect(screen.getByText('Email Service')).toBeInTheDocument()
    })

    it('should handle background data refetching', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Simulate background refetch with updated data
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json({
            resource: [
              ...mockApiDocsServices,
              { 
                id: 999, 
                name: 'new-service', 
                label: 'New Service', 
                description: 'Recently added service',
                type: 'mysql',
                is_active: true 
              }
            ]
          }))
        })
      )

      // Trigger refetch
      act(() => {
        queryClient.invalidateQueries({ queryKey: ['api-docs-services'] })
      })

      await waitFor(() => {
        expect(screen.getByText('New Service')).toBeInTheDocument()
      })
    })

    it('should handle request cancellation on component unmount', async () => {
      const { unmount } = renderApiDocsTable()

      // Start request but unmount before completion
      unmount()

      // Verify no memory leaks or warnings
      expect(console.warn).not.toHaveBeenCalled()
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Table Functionality and Virtualization', () => {
    it('should implement virtual scrolling for large datasets', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json({ resource: mockLargeDataset }))
        })
      )

      renderApiDocsTable()

      await waitFor(() => {
        const tableBody = screen.getByTestId('virtualized-table-body')
        expect(tableBody).toBeInTheDocument()
      })

      // Verify only visible rows are rendered (performance optimization)
      const visibleRows = screen.getAllByRole('row')
      expect(visibleRows.length).toBeLessThanOrEqual(15) // Header + ~10 visible rows + buffer

      // Verify virtual scrolling container has proper ARIA attributes
      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      expect(scrollContainer).toHaveAttribute('role', 'grid')
      expect(scrollContainer).toHaveAttribute('aria-rowcount', mockLargeDataset.length.toString())
    })

    it('should handle scrolling performance with 1000+ table entries', async () => {
      const performanceStart = performance.now()

      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json({ resource: mockLargeDataset }))
        })
      )

      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-table-body')).toBeInTheDocument()
      })

      const performanceEnd = performance.now()
      const renderTime = performanceEnd - performanceStart

      // Verify rendering performance meets requirements
      expect(renderTime).toBeLessThan(1000) // Should render within 1 second
    })

    it('should maintain scroll position during data updates', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Simulate scroll to middle of table
      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } })

      // Update data while maintaining scroll position
      act(() => {
        queryClient.setQueryData(['api-docs-services'], {
          resource: [...mockApiDocsServices, { 
            id: 100, 
            name: 'additional-service', 
            label: 'Additional Service',
            description: 'Added during scroll test',
            type: 'mysql',
            is_active: true 
          }]
        })
      })

      // Verify scroll position is maintained
      expect(scrollContainer.scrollTop).toBe(500)
    })
  })

  describe('Pagination and Navigation', () => {
    it('should implement React-based pagination with proper controls', async () => {
      const onPageChange = vi.fn()
      
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json(mockPaginatedResponse))
        })
      )

      renderApiDocsTable({ onPageChange, pageSize: 5 })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Verify pagination controls
      const pagination = screen.getByRole('navigation', { name: /pagination/i })
      expect(pagination).toBeInTheDocument()

      const nextButton = screen.getByRole('button', { name: /next page/i })
      expect(nextButton).toBeInTheDocument()
      expect(nextButton).not.toBeDisabled()

      const prevButton = screen.getByRole('button', { name: /previous page/i })
      expect(prevButton).toBeInTheDocument()
      expect(prevButton).toBeDisabled() // First page

      // Test page change
      await user.click(nextButton)
      expect(onPageChange).toHaveBeenCalledWith(2)
    })

    it('should handle page size changes correctly', async () => {
      const onPageChange = vi.fn()
      const { rerender } = renderApiDocsTable({ onPageChange, pageSize: 10 })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Change page size
      rerender(
        <QueryClientProvider client={queryClient}>
          <ApiDocsTable
            searchQuery=""
            sortField="name"
            sortDirection="asc"
            currentPage={1}
            pageSize={25}
            onSearch={vi.fn()}
            onSort={vi.fn()}
            onPageChange={onPageChange}
            onRowClick={vi.fn()}
          />
        </QueryClientProvider>
      )

      // Verify page resets to 1 when page size changes
      expect(onPageChange).toHaveBeenCalledWith(1)
    })

    it('should display correct pagination information', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json(mockPaginatedResponse))
        })
      )

      renderApiDocsTable({ pageSize: 5 })

      await waitFor(() => {
        const paginationInfo = screen.getByText(/showing 1-5 of 15 services/i)
        expect(paginationInfo).toBeInTheDocument()
      })
    })
  })

  describe('Search and Filtering', () => {
    it('should implement real-time search functionality', async () => {
      const onSearch = vi.fn()
      renderApiDocsTable({ onSearch })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('searchbox', { name: /search services/i })
      expect(searchInput).toBeInTheDocument()

      // Test search input
      await user.type(searchInput, 'email')
      
      // Debounced search should be called
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('email')
      }, { timeout: 600 }) // Account for debounce delay
    })

    it('should filter results based on search query', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          const url = new URL(req.url)
          const filter = url.searchParams.get('filter')
          
          if (filter?.includes('email')) {
            return res(ctx.json({
              resource: mockApiDocsServices.filter(service => 
                service.name.toLowerCase().includes('email') ||
                service.label.toLowerCase().includes('email')
              )
            }))
          }
          
          return res(ctx.json({ resource: mockApiDocsServices }))
        })
      )

      renderApiDocsTable({ searchQuery: 'email' })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
        expect(screen.queryByText('Database API')).not.toBeInTheDocument()
      })
    })

    it('should handle empty search results', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json({ resource: [] }))
        })
      )

      renderApiDocsTable({ searchQuery: 'nonexistent' })

      await waitFor(() => {
        const noResultsMessage = screen.getByText(/no services match your search/i)
        expect(noResultsMessage).toBeInTheDocument()
      })
    })

    it('should clear search results when search is cleared', async () => {
      const onSearch = vi.fn()
      renderApiDocsTable({ onSearch, searchQuery: 'email' })

      const searchInput = screen.getByRole('searchbox', { name: /search services/i })
      
      // Clear search
      await user.clear(searchInput)
      
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('')
      })
    })
  })

  describe('Sorting and Column Management', () => {
    it('should implement sortable columns with visual indicators', async () => {
      const onSort = vi.fn()
      renderApiDocsTable({ onSort })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      
      // Test sorting
      await user.click(nameHeader)
      expect(onSort).toHaveBeenCalledWith('name', 'desc')

      // Verify sort indicator
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
    })

    it('should handle multi-column sorting scenarios', async () => {
      const onSort = vi.fn()
      renderApiDocsTable({ onSort, sortField: 'type' })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const typeHeader = screen.getByRole('columnheader', { name: /service type/i })
      expect(typeHeader).toHaveAttribute('aria-sort', 'ascending')

      // Change sort to name column
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      await user.click(nameHeader)

      expect(onSort).toHaveBeenCalledWith('name', 'asc')
    })

    it('should maintain sort state during data updates', async () => {
      renderApiDocsTable({ sortField: 'label', sortDirection: 'desc' })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const labelHeader = screen.getByRole('columnheader', { name: /display label/i })
      expect(labelHeader).toHaveAttribute('aria-sort', 'descending')

      // Update data
      act(() => {
        queryClient.invalidateQueries({ queryKey: ['api-docs-services'] })
      })

      // Sort state should be maintained
      expect(labelHeader).toHaveAttribute('aria-sort', 'descending')
    })
  })

  describe('Row Interactions and Navigation', () => {
    it('should handle row click navigation using Next.js router', async () => {
      const onRowClick = vi.fn()
      renderApiDocsTable({ onRowClick })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const emailServiceRow = screen.getByRole('row', { name: /email service/i })
      await user.click(emailServiceRow)

      expect(onRowClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          name: 'email',
          label: 'Email Service'
        })
      )
    })

    it('should support keyboard navigation for accessibility', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const firstRow = screen.getAllByRole('row')[1] // Skip header row
      
      // Test keyboard navigation
      firstRow.focus()
      await user.keyboard('{Enter}')

      // Should trigger row selection
      expect(mockAnnounce).toHaveBeenCalledWith('Selected Email Service')
    })

    it('should handle action button clicks within rows', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const viewDocsButton = screen.getAllByRole('button', { name: /view documentation/i })[0]
      await user.click(viewDocsButton)

      expect(mockPush).toHaveBeenCalledWith('/adf-api-docs/df-api-docs/email')
    })

    it('should prevent row click when action buttons are clicked', async () => {
      const onRowClick = vi.fn()
      renderApiDocsTable({ onRowClick })

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const viewDocsButton = screen.getAllByRole('button', { name: /view documentation/i })[0]
      await user.click(viewDocsButton)

      // Row click should not be triggered when action button is clicked
      expect(onRowClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility and WCAG 2.1 AA Compliance', () => {
    it('should provide proper ARIA labels and roles', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Verify table accessibility
      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'API Documentation Services')

      // Verify column headers have proper ARIA attributes
      const columnHeaders = screen.getAllByRole('columnheader')
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })

      // Verify row groups
      const rowGroups = screen.getAllByRole('rowgroup')
      expect(rowGroups).toHaveLength(2) // thead and tbody
    })

    it('should support screen reader announcements', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Test live announcements for data loading
      expect(mockAnnounce).toHaveBeenCalledWith('API documentation services loaded')

      // Test sorting announcements
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      await user.click(nameHeader)

      expect(mockAnnounce).toHaveBeenCalledWith('Table sorted by Service Name, descending')
    })

    it('should maintain focus management during interactions', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      const searchInput = screen.getByRole('searchbox')
      searchInput.focus()
      expect(document.activeElement).toBe(searchInput)

      // Test focus trap in modal dialogs (if any)
      const viewButton = screen.getAllByRole('button', { name: /view documentation/i })[0]
      await user.click(viewButton)

      // Focus should move appropriately
      expect(document.activeElement).not.toBe(searchInput)
    })

    it('should provide keyboard shortcuts for common actions', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Test keyboard shortcuts
      await user.keyboard('{Control>}f{/Control}')
      
      const searchInput = screen.getByRole('searchbox')
      expect(document.activeElement).toBe(searchInput)
    })

    it('should have proper color contrast for all text elements', async () => {
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Verify high contrast elements are present
      const tableHeaders = screen.getAllByRole('columnheader')
      tableHeaders.forEach(header => {
        const styles = window.getComputedStyle(header)
        expect(styles.color).not.toBe('rgb(128, 128, 128)') // Avoid low contrast gray
      })
    })
  })

  describe('Performance and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res.networkError('Network connection failed')
        })
      )

      renderApiDocsTable()

      await waitFor(() => {
        const errorMessage = screen.getByText(/network error occurred/i)
        expect(errorMessage).toBeInTheDocument()
      })

      // Verify retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Should attempt to refetch data
      expect(queryClient.getQueryState(['api-docs-services'])?.status).toBe('pending')
    })

    it('should implement proper loading states during transitions', async () => {
      renderApiDocsTable()

      // Initial loading state
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Loading state should be cleared
      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
    })

    it('should handle component unmounting during async operations', async () => {
      const { unmount } = renderApiDocsTable()

      // Unmount component immediately
      unmount()

      // Should not cause memory leaks or console warnings
      await waitFor(() => {
        expect(console.warn).not.toHaveBeenCalled()
        expect(console.error).not.toHaveBeenCalled()
      })
    })

    it('should optimize re-renders for large datasets', async () => {
      const renderCount = vi.fn()
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderCount()
        return <>{children}</>
      }

      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json({ resource: mockLargeDataset }))
        })
      )

      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <TestWrapper>
            <ApiDocsTable
              searchQuery=""
              sortField="name"
              sortDirection="asc"
              currentPage={1}
              pageSize={10}
              onSearch={vi.fn()}
              onSort={vi.fn()}
              onPageChange={vi.fn()}
              onRowClick={vi.fn()}
            />
          </TestWrapper>
        </QueryClientProvider>,
        { wrapper: createTestWrapper() }
      )

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-table-body')).toBeInTheDocument()
      })

      const initialRenderCount = renderCount.mock.calls.length

      // Change props that shouldn't cause full re-render
      rerender(
        <QueryClientProvider client={queryClient}>
          <TestWrapper>
            <ApiDocsTable
              searchQuery=""
              sortField="name"
              sortDirection="asc"
              currentPage={1}
              pageSize={10}
              onSearch={vi.fn()}
              onSort={vi.fn()}
              onPageChange={vi.fn()}
              onRowClick={vi.fn()}
            />
          </TestWrapper>
        </QueryClientProvider>
      )

      // Should not cause excessive re-renders
      expect(renderCount.mock.calls.length - initialRenderCount).toBeLessThanOrEqual(2)
    })
  })

  describe('MSW Integration and Realistic API Testing', () => {
    it('should work with MSW request handlers for complete integration testing', async () => {
      // MSW handlers are already set up in beforeAll
      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Verify all expected data is rendered
      expect(screen.getByText('Database API')).toBeInTheDocument()
      expect(screen.getByText('User Authentication')).toBeInTheDocument()
      expect(screen.getByText('File Storage')).toBeInTheDocument()
    })

    it('should handle different API response scenarios', async () => {
      // Test different response scenarios with MSW
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(
            ctx.delay(100),
            ctx.json({
              resource: mockApiDocsServices.map(service => ({
                ...service,
                status: Math.random() > 0.5 ? 'active' : 'inactive'
              }))
            })
          )
        })
      )

      renderApiDocsTable()

      await waitFor(() => {
        expect(screen.getByText('Email Service')).toBeInTheDocument()
      })

      // Verify status indicators are displayed
      const statusBadges = screen.getAllByTestId(/status-badge/i)
      expect(statusBadges.length).toBeGreaterThan(0)
    })

    it('should validate request parameters sent to API', async () => {
      const requestSpy = vi.fn()
      
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          requestSpy(req.url.searchParams.toString())
          return res(ctx.json({ resource: mockApiDocsServices }))
        })
      )

      renderApiDocsTable({ 
        searchQuery: 'email', 
        sortField: 'label', 
        sortDirection: 'desc',
        currentPage: 2,
        pageSize: 5
      })

      await waitFor(() => {
        expect(requestSpy).toHaveBeenCalledWith(
          expect.stringContaining('filter=email')
        )
        expect(requestSpy).toHaveBeenCalledWith(
          expect.stringContaining('sort=-label')
        )
        expect(requestSpy).toHaveBeenCalledWith(
          expect.stringContaining('offset=5')
        )
        expect(requestSpy).toHaveBeenCalledWith(
          expect.stringContaining('limit=5')
        )
      })
    })
  })

  describe('Form Integration and Input Validation', () => {
    it('should integrate with React Hook Form for search functionality', async () => {
      renderApiDocsTable()

      const searchInput = screen.getByRole('searchbox', { name: /search services/i })
      
      // Test form validation
      await user.type(searchInput, 'a'.repeat(101)) // Exceed max length
      
      await waitFor(() => {
        const validationMessage = screen.getByText(/search query too long/i)
        expect(validationMessage).toBeInTheDocument()
      })
    })

    it('should validate input with Zod schema integration', async () => {
      renderApiDocsTable()

      const searchInput = screen.getByRole('searchbox')
      
      // Test invalid characters
      await user.type(searchInput, '<script>alert("xss")</script>')
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('scriptalert("xss")/script') // Sanitized
      })
    })
  })
})
