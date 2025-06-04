/**
 * @fileoverview Comprehensive test suite for database service list components using Vitest and MSW
 * Tests component rendering, user interactions, data fetching, CRUD operations, and error handling
 * Includes integration tests for table virtualization, filtering, sorting, and real-time updates
 * 
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 * @since 2024
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Components under test
import { ServiceListContainer } from './service-list-container'
import { ServiceListTable } from './service-list-table'
import { 
  useServiceList, 
  useServiceListFilters, 
  useServiceListMutations,
  useServiceListVirtualization,
  useServiceConnectionStatus 
} from './service-list-hooks'

// Test utilities and providers
import { TestProviders } from '../../../test/utils/test-providers'
import { createMockQueryClient } from '../../../test/utils/query-test-helpers'
import { createServiceListMockData, createServiceMockData } from '../../../test/utils/component-factories'
import { renderWithProviders } from '../../../test/utils/test-utils'
import { mockAuthProvider } from '../../../test/utils/mock-providers'

// Mock data and handlers
import { databaseServiceHandlers } from '../../../test/mocks/database-service-handlers'
import { errorResponseHandlers } from '../../../test/mocks/error-responses'
import { mockServiceData, mockServiceTypes, mockEnvironmentData } from '../../../test/mocks/mock-data'

// Types
import type { DatabaseService, ServiceListState, ServiceListFilters } from './service-list-types'
import type { PaginationState, SortingState } from '../../../types/table'

// Add jest-axe matcher
expect.extend(toHaveNoViolations)

// MSW server setup for Node.js environment
const server = setupServer(...databaseServiceHandlers, ...errorResponseHandlers)

// Test data constants
const MOCK_SERVICES: DatabaseService[] = createServiceListMockData({
  count: 25,
  includeVariousStates: true,
  includeConnectionStatus: true
})

const LARGE_DATASET_SERVICES: DatabaseService[] = createServiceListMockData({
  count: 1500,
  includeVariousStates: true,
  includeConnectionStatus: true
})

const TEST_PAGINATION_CONFIG = {
  pageSize: 25,
  pageIndex: 0,
  totalItems: MOCK_SERVICES.length
}

const TEST_FILTERS: ServiceListFilters = {
  search: '',
  serviceType: 'all',
  status: 'all',
  sortBy: 'name',
  sortOrder: 'asc'
}

describe('Database Service List Components', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    // Create fresh query client for each test
    queryClient = createMockQueryClient()
    user = userEvent.setup()
    
    // Clear any existing cache
    queryClient.clear()
    
    // Reset MSW handlers
    server.resetHandlers()
    
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks()
    queryClient.clear()
  })

  afterAll(() => {
    // Stop MSW server
    server.close()
  })

  describe('ServiceListContainer Component', () => {
    it('should render service list container with proper accessibility attributes', async () => {
      const { container } = renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      // Verify basic rendering
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /database services/i })).toBeInTheDocument()

      // Test accessibility compliance
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should display paywall when user lacks permissions', async () => {
      // Mock authenticated user without admin permissions
      const mockUser = mockAuthProvider({
        isAuthenticated: true,
        user: { id: 1, name: 'Test User', isAdmin: false },
        permissions: []
      })

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient, authProvider: mockUser }
      )

      await waitFor(() => {
        expect(screen.getByTestId('paywall-component')).toBeInTheDocument()
        expect(screen.getByText(/upgrade required/i)).toBeInTheDocument()
      })
    })

    it('should load and display service types in filter dropdown', async () => {
      server.use(
        rest.get('/api/v2/system/service_type', (req, res, ctx) => {
          return res(ctx.json({ resource: mockServiceTypes }))
        })
      )

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      await waitFor(() => {
        const filterDropdown = screen.getByRole('combobox', { name: /service type/i })
        expect(filterDropdown).toBeInTheDocument()
      })

      await user.click(screen.getByRole('combobox', { name: /service type/i }))

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /mysql/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /postgresql/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /mongodb/i })).toBeInTheDocument()
      })
    })

    it('should handle route parameter changes for service type filtering', async () => {
      const mockPush = vi.fn()
      const mockSearchParams = new URLSearchParams('serviceType=mysql')

      renderWithProviders(
        <ServiceListContainer />,
        { 
          queryClient,
          routerProps: { 
            push: mockPush,
            searchParams: mockSearchParams
          }
        }
      )

      await waitFor(() => {
        const serviceTypeFilter = screen.getByDisplayValue(/mysql/i)
        expect(serviceTypeFilter).toBeInTheDocument()
      })
    })

    it('should refresh service list when refresh button is clicked', async () => {
      const refetchSpy = vi.fn()
      
      // Mock useServiceList hook to track refetch calls
      vi.mock('./service-list-hooks', async () => {
        const actual = await vi.importActual('./service-list-hooks')
        return {
          ...actual,
          useServiceList: vi.fn(() => ({
            data: { resource: MOCK_SERVICES },
            isLoading: false,
            error: null,
            refetch: refetchSpy
          }))
        }
      })

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      expect(refetchSpy).toHaveBeenCalledOnce()
    })
  })

  describe('ServiceListTable Component', () => {
    const defaultProps = {
      services: MOCK_SERVICES,
      isLoading: false,
      pagination: TEST_PAGINATION_CONFIG,
      filters: TEST_FILTERS,
      onFiltersChange: vi.fn(),
      onPaginationChange: vi.fn(),
      onServiceDelete: vi.fn(),
      onServiceTest: vi.fn()
    }

    it('should render table with proper ARIA attributes and structure', async () => {
      const { container } = renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Verify table structure
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(table).toHaveAttribute('aria-label', 'Database services table')

      // Verify column headers
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument()

      // Test accessibility compliance
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should display loading state with skeleton rows', () => {
      renderWithProviders(
        <ServiceListTable {...defaultProps} isLoading={true} services={[]} />,
        { queryClient }
      )

      // Verify loading skeleton
      expect(screen.getAllByTestId('table-skeleton-row')).toHaveLength(10)
      expect(screen.getByText(/loading services/i)).toBeInTheDocument()
    })

    it('should handle empty state gracefully', () => {
      renderWithProviders(
        <ServiceListTable {...defaultProps} services={[]} />,
        { queryClient }
      )

      expect(screen.getByText(/no database services found/i)).toBeInTheDocument()
      expect(screen.getByText(/create your first database service/i)).toBeInTheDocument()
    })

    it('should render service rows with correct data and status indicators', () => {
      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Check first service row
      const firstService = MOCK_SERVICES[0]
      expect(screen.getByText(firstService.name)).toBeInTheDocument()
      expect(screen.getByText(firstService.type)).toBeInTheDocument()
      
      // Verify status indicator
      const statusCell = screen.getByTestId(`service-status-${firstService.id}`)
      expect(statusCell).toBeInTheDocument()
    })

    it('should handle sorting by clicking column headers', async () => {
      const onFiltersChange = vi.fn()
      
      renderWithProviders(
        <ServiceListTable {...defaultProps} onFiltersChange={onFiltersChange} />,
        { queryClient }
      )

      // Click name column header to sort
      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      await user.click(nameHeader)

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...TEST_FILTERS,
        sortBy: 'name',
        sortOrder: 'desc'
      })
    })

    it('should open action menu and handle service operations', async () => {
      const onServiceDelete = vi.fn()
      const onServiceTest = vi.fn()

      renderWithProviders(
        <ServiceListTable 
          {...defaultProps} 
          onServiceDelete={onServiceDelete}
          onServiceTest={onServiceTest}
        />,
        { queryClient }
      )

      // Click action menu for first service
      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])

      // Verify menu options
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: /test connection/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
        expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
      })

      // Test connection action
      await user.click(screen.getByRole('menuitem', { name: /test connection/i }))
      expect(onServiceTest).toHaveBeenCalledWith(MOCK_SERVICES[0].id)
    })

    it('should handle pagination controls correctly', async () => {
      const onPaginationChange = vi.fn()
      const paginationProps = {
        ...TEST_PAGINATION_CONFIG,
        totalItems: 100
      }

      renderWithProviders(
        <ServiceListTable 
          {...defaultProps} 
          pagination={paginationProps}
          onPaginationChange={onPaginationChange}
        />,
        { queryClient }
      )

      // Test next page navigation
      const nextButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextButton)

      expect(onPaginationChange).toHaveBeenCalledWith({
        ...paginationProps,
        pageIndex: 1
      })
    })

    it('should filter services by search input', async () => {
      const onFiltersChange = vi.fn()

      renderWithProviders(
        <ServiceListTable {...defaultProps} onFiltersChange={onFiltersChange} />,
        { queryClient }
      )

      const searchInput = screen.getByRole('textbox', { name: /search services/i })
      await user.type(searchInput, 'mysql')

      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalledWith({
          ...TEST_FILTERS,
          search: 'mysql'
        })
      })
    })

    it('should handle service type filter changes', async () => {
      const onFiltersChange = vi.fn()

      renderWithProviders(
        <ServiceListTable {...defaultProps} onFiltersChange={onFiltersChange} />,
        { queryClient }
      )

      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      await user.click(typeFilter)
      
      await waitFor(() => {
        const mysqlOption = screen.getByRole('option', { name: /mysql/i })
        await user.click(mysqlOption)
      })

      expect(onFiltersChange).toHaveBeenCalledWith({
        ...TEST_FILTERS,
        serviceType: 'mysql'
      })
    })
  })

  describe('TanStack Virtual Table Integration', () => {
    it('should efficiently render large datasets using virtualization', async () => {
      const virtualizedProps = {
        ...defaultProps,
        services: LARGE_DATASET_SERVICES,
        pagination: {
          ...TEST_PAGINATION_CONFIG,
          totalItems: LARGE_DATASET_SERVICES.length
        }
      }

      renderWithProviders(
        <ServiceListTable {...virtualizedProps} />,
        { queryClient }
      )

      // Verify virtualization container
      expect(screen.getByTestId('virtualized-table')).toBeInTheDocument()
      
      // Only rendered rows should be in DOM (not all 1500)
      const visibleRows = screen.getAllByTestId(/^service-row-/)
      expect(visibleRows.length).toBeLessThan(50) // Should only render visible rows
      expect(visibleRows.length).toBeGreaterThan(0)
    })

    it('should maintain scroll position and performance with large datasets', async () => {
      const virtualizedProps = {
        ...defaultProps,
        services: LARGE_DATASET_SERVICES
      }

      renderWithProviders(
        <ServiceListTable {...virtualizedProps} />,
        { queryClient }
      )

      const virtualContainer = screen.getByTestId('virtualized-table')
      
      // Simulate scroll
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 500 } })

      await waitFor(() => {
        // Verify scroll position is maintained
        expect(virtualContainer.scrollTop).toBe(500)
      })

      // Performance test: operation should complete quickly
      const startTime = performance.now()
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 1000 } })
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
    })
  })

  describe('React Query Integration and Caching', () => {
    it('should cache service list data and serve from cache on subsequent requests', async () => {
      let requestCount = 0
      
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          requestCount++
          return res(ctx.json({ resource: MOCK_SERVICES }))
        })
      )

      // First render - should fetch from API
      const { unmount } = renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      await waitFor(() => {
        expect(screen.getByText(MOCK_SERVICES[0].name)).toBeInTheDocument()
      })

      expect(requestCount).toBe(1)

      unmount()

      // Second render - should serve from cache
      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      await waitFor(() => {
        expect(screen.getByText(MOCK_SERVICES[0].name)).toBeInTheDocument()
      })

      // Should not make additional API call due to caching
      expect(requestCount).toBe(1)
    })

    it('should invalidate cache and refetch after mutations', async () => {
      let fetchCount = 0
      
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          fetchCount++
          return res(ctx.json({ resource: MOCK_SERVICES }))
        }),
        rest.delete('/api/v2/system/service/:id', (req, res, ctx) => {
          return res(ctx.json({ success: true }))
        })
      )

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(MOCK_SERVICES[0].name)).toBeInTheDocument()
      })

      expect(fetchCount).toBe(1)

      // Delete a service
      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
        await user.click(deleteButton)
      })

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm delete/i })
        await user.click(confirmButton)
      })

      // Should refetch data after mutation
      await waitFor(() => {
        expect(fetchCount).toBe(2)
      })
    })

    it('should handle optimistic updates for service operations', async () => {
      server.use(
        rest.delete('/api/v2/system/service/:id', (req, res, ctx) => {
          // Simulate network delay
          return res(ctx.delay(500), ctx.json({ success: true }))
        })
      )

      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      const initialServiceCount = screen.getAllByTestId(/^service-row-/).length

      // Delete service with optimistic update
      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])
      
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteButton)

      // Service should be removed optimistically (before API response)
      await waitFor(() => {
        const currentServiceCount = screen.getAllByTestId(/^service-row-/).length
        expect(currentServiceCount).toBe(initialServiceCount - 1)
      }, { timeout: 100 })
    })

    it('should handle background refresh with stale-while-revalidate pattern', async () => {
      let responseData = MOCK_SERVICES
      
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.json({ resource: responseData }))
        })
      )

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(MOCK_SERVICES[0].name)).toBeInTheDocument()
      })

      // Update mock data to simulate server changes
      responseData = [...MOCK_SERVICES, createServiceMockData({ id: 999, name: 'New Service' })]

      // Trigger background refresh
      queryClient.invalidateQueries({ queryKey: ['services'] })

      // Should show updated data
      await waitFor(() => {
        expect(screen.getByText('New Service')).toBeInTheDocument()
      })
    })
  })

  describe('SWR Real-time Connection Status', () => {
    it('should update connection status indicators in real-time', async () => {
      let connectionStatus = 'connected'
      
      server.use(
        rest.post('/api/v2/system/service/:id/_test', (req, res, ctx) => {
          return res(ctx.json({ 
            success: connectionStatus === 'connected',
            status: connectionStatus
          }))
        })
      )

      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Initial connected status
      await waitFor(() => {
        const statusIndicator = screen.getByTestId(`service-status-${MOCK_SERVICES[0].id}`)
        expect(statusIndicator).toHaveClass('text-green-500')
      })

      // Simulate connection failure
      connectionStatus = 'disconnected'
      
      // Trigger connection test
      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])
      
      const testButton = screen.getByRole('menuitem', { name: /test connection/i })
      await user.click(testButton)

      // Status should update to disconnected
      await waitFor(() => {
        const statusIndicator = screen.getByTestId(`service-status-${MOCK_SERVICES[0].id}`)
        expect(statusIndicator).toHaveClass('text-red-500')
      })
    })

    it('should show connection testing state during async operations', async () => {
      server.use(
        rest.post('/api/v2/system/service/:id/_test', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ success: true }))
        })
      )

      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Trigger connection test
      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])
      
      const testButton = screen.getByRole('menuitem', { name: /test connection/i })
      await user.click(testButton)

      // Should show testing state
      await waitFor(() => {
        const statusIndicator = screen.getByTestId(`service-status-${MOCK_SERVICES[0].id}`)
        expect(statusIndicator).toHaveAttribute('aria-label', 'Testing connection')
        expect(screen.getByTestId('connection-testing-spinner')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should display error boundary when component crashes', () => {
      const ThrowError = () => {
        throw new Error('Test error')
      }

      const { container } = renderWithProviders(
        <ThrowError />,
        { queryClient }
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    it('should handle API errors gracefully with retry functionality', async () => {
      let failureCount = 0
      
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          failureCount++
          if (failureCount <= 2) {
            return res(ctx.status(500), ctx.json({
              error: { message: 'Internal server error' }
            }))
          }
          return res(ctx.json({ resource: MOCK_SERVICES }))
        })
      )

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      // Should show error state initially
      await waitFor(() => {
        expect(screen.getByText(/failed to load services/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      // Should eventually succeed and show data
      await waitFor(() => {
        expect(screen.getByText(MOCK_SERVICES[0].name)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('should handle network timeouts with appropriate error messages', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.delay('infinite'))
        })
      )

      renderWithProviders(
        <ServiceListContainer />,
        { queryClient }
      )

      // Should show timeout error
      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('should validate form inputs and show validation errors', async () => {
      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Open service creation form
      const createButton = screen.getByRole('button', { name: /create service/i })
      await user.click(createButton)

      // Submit form without required fields
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/service name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/service type is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should support keyboard navigation throughout the interface', async () => {
      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      const table = screen.getByRole('table')
      
      // Focus should start on table
      table.focus()
      expect(document.activeElement).toBe(table)

      // Tab through table elements
      await user.tab()
      expect(document.activeElement).toHaveAttribute('role', 'columnheader')

      // Arrow keys should navigate table cells
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toHaveAttribute('role', 'gridcell')
    })

    it('should announce status changes to screen readers', async () => {
      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Verify ARIA live region for status updates
      expect(screen.getByRole('status')).toBeInTheDocument()

      // Delete a service
      const actionButtons = screen.getAllByRole('button', { name: /actions/i })
      await user.click(actionButtons[0])
      
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteButton)

      // Should announce the action
      await waitFor(() => {
        const statusRegion = screen.getByRole('status')
        expect(statusRegion).toHaveTextContent(/service deleted successfully/i)
      })
    })

    it('should provide clear focus indicators and contrast ratios', async () => {
      const { container } = renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Test focus indicators
      const firstButton = screen.getAllByRole('button')[0]
      firstButton.focus()
      
      const computedStyles = window.getComputedStyle(firstButton, ':focus')
      expect(computedStyles.outline).not.toBe('none')

      // Test accessibility compliance
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('should handle reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      // Animations should be disabled
      const animatedElements = container.querySelectorAll('[data-animate]')
      animatedElements.forEach(element => {
        expect(element).toHaveStyle('animation: none')
      })
    })
  })

  describe('Performance and Resource Management', () => {
    it('should meet performance benchmarks for rendering time', async () => {
      const startTime = performance.now()

      renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within performance target
      expect(renderTime).toBeLessThan(100) // <100ms initial render
    })

    it('should efficiently handle component updates without unnecessary re-renders', async () => {
      const renderSpy = vi.fn()
      
      const TestComponent = () => {
        renderSpy()
        return <ServiceListTable {...defaultProps} />
      }

      renderWithProviders(
        <TestComponent />,
        { queryClient }
      )

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Update unrelated state
      queryClient.setQueryData(['unrelated'], { data: 'test' })

      // Should not trigger unnecessary re-render
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })

    it('should cleanup resources and event listeners on unmount', () => {
      const { unmount } = renderWithProviders(
        <ServiceListTable {...defaultProps} />,
        { queryClient }
      )

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      unmount()

      // Verify cleanup
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })

  describe('Integration with Service List Hooks', () => {
    it('should integrate useServiceList hook with proper caching configuration', async () => {
      const TestComponent = () => {
        const { data, isLoading, error } = useServiceList({
          filters: TEST_FILTERS,
          pagination: TEST_PAGINATION_CONFIG
        })

        if (isLoading) return <div>Loading...</div>
        if (error) return <div>Error: {error.message}</div>
        
        return (
          <div>
            {data?.resource?.map(service => (
              <div key={service.id} data-testid={`service-${service.id}`}>
                {service.name}
              </div>
            ))}
          </div>
        )
      }

      renderWithProviders(
        <TestComponent />,
        { queryClient }
      )

      await waitFor(() => {
        expect(screen.getByTestId(`service-${MOCK_SERVICES[0].id}`)).toBeInTheDocument()
      })

      // Verify cache configuration
      const cacheData = queryClient.getQueryData(['services', TEST_FILTERS, TEST_PAGINATION_CONFIG])
      expect(cacheData).toBeDefined()
    })

    it('should handle mutations through useServiceListMutations hook', async () => {
      const TestComponent = () => {
        const { deleteService } = useServiceListMutations()

        return (
          <button 
            onClick={() => deleteService.mutate(MOCK_SERVICES[0].id)}
            disabled={deleteService.isPending}
          >
            {deleteService.isPending ? 'Deleting...' : 'Delete Service'}
          </button>
        )
      }

      server.use(
        rest.delete('/api/v2/system/service/:id', (req, res, ctx) => {
          return res(ctx.json({ success: true }))
        })
      )

      renderWithProviders(
        <TestComponent />,
        { queryClient }
      )

      const deleteButton = screen.getByRole('button', { name: /delete service/i })
      await user.click(deleteButton)

      // Should show pending state
      expect(screen.getByText('Deleting...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('Delete Service')).toBeInTheDocument()
      })
    })

    it('should manage filters through useServiceListFilters hook', async () => {
      const TestComponent = () => {
        const { filters, updateFilters, resetFilters } = useServiceListFilters()

        return (
          <div>
            <div data-testid="current-search">{filters.search}</div>
            <button onClick={() => updateFilters({ search: 'mysql' })}>
              Update Search
            </button>
            <button onClick={resetFilters}>Reset Filters</button>
          </div>
        )
      }

      renderWithProviders(
        <TestComponent />,
        { queryClient }
      )

      expect(screen.getByTestId('current-search')).toHaveTextContent('')

      await user.click(screen.getByRole('button', { name: /update search/i }))
      expect(screen.getByTestId('current-search')).toHaveTextContent('mysql')

      await user.click(screen.getByRole('button', { name: /reset filters/i }))
      expect(screen.getByTestId('current-search')).toHaveTextContent('')
    })
  })
})