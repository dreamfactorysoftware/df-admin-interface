/**
 * Comprehensive Vitest Test Suite for LimitsTable React Component
 * 
 * Replaces Jest-based Angular table testing with React Testing Library patterns
 * and MSW for realistic API mocking. Implements comprehensive coverage of table
 * interactions, CRUD operations, React Query cache behavior, and accessibility
 * compliance per WCAG 2.1 AA standards.
 * 
 * Key Features:
 * - Vitest 2.1.0 with React Testing Library for 10x faster test execution
 * - MSW (Mock Service Worker) for realistic table data and API interaction testing
 * - React Query testing utilities for cache behavior verification
 * - Comprehensive accessibility testing with WCAG 2.1 AA compliance
 * - Optimistic updates testing for enhanced UX validation
 * - Performance monitoring to ensure sub-5-second response times
 * 
 * Test Coverage:
 * - Table rendering and data display
 * - Sorting, filtering, and pagination functionality
 * - CRUD operations with error handling
 * - Cache invalidation and background updates
 * - Loading states and error boundaries
 * - Keyboard navigation and screen reader support
 * - Responsive design and mobile interactions
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import '@testing-library/jest-dom'

// Component and types imports
import { LimitsTable } from './limits-table'
import type { 
  LimitTableRowData, 
  LimitType, 
  LimitCounter,
  LimitsListProps,
  ApiListResponse,
  ApiErrorResponse 
} from '../types'

// Test utilities and mocks
import { createTestQueryClient, renderWithProviders, mockConsoleError } from '@/test/utils/test-utils'
import { mockLimitData, createMockLimitResponse, mockPaginationMeta } from '@/test/mocks/mock-data'
import { createErrorResponse } from '@/test/mocks/error-responses'

// Add jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations)

// =============================================================================
// TEST DATA AND FIXTURES
// =============================================================================

/**
 * Mock limit data for table testing
 * Provides comprehensive dataset covering all limit types and scenarios
 */
const mockLimits: LimitTableRowData[] = [
  {
    id: 1,
    name: 'API Rate Limit',
    limitType: LimitType.ENDPOINT,
    limitRate: '100/minute',
    limitCounter: LimitCounter.REQUEST,
    user: null,
    service: 1,
    role: null,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin@dreamfactory.com'
  },
  {
    id: 2,
    name: 'User Bandwidth Limit',
    limitType: LimitType.USER,
    limitRate: '1000/hour',
    limitCounter: LimitCounter.BANDWIDTH,
    user: 123,
    service: null,
    role: null,
    active: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    createdBy: 'user@dreamfactory.com'
  },
  {
    id: 3,
    name: 'Role-based Request Limit',
    limitType: LimitType.ROLE,
    limitRate: '500/day',
    limitCounter: LimitCounter.SLIDING_WINDOW,
    user: null,
    service: null,
    role: 456,
    active: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    createdBy: 'admin@dreamfactory.com'
  },
  {
    id: 4,
    name: 'Global IP Limit',
    limitType: LimitType.IP,
    limitRate: '10000/hour',
    limitCounter: LimitCounter.TOKEN_BUCKET,
    user: null,
    service: null,
    role: null,
    active: true,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    createdBy: 'system@dreamfactory.com'
  }
]

/**
 * Mock API response for limits list with pagination
 */
const mockLimitsResponse: ApiListResponse<LimitTableRowData> = {
  resource: mockLimits,
  meta: {
    count: mockLimits.length,
    offset: 0,
    limit: 25,
    total: mockLimits.length,
    has_more: false
  }
}

/**
 * Mock props for LimitsTable component testing
 */
const defaultProps: Partial<LimitsListProps> = {
  selectable: false,
  paginated: true,
  pageSize: 25,
  filterable: true,
  sortable: true,
  testId: 'limits-table'
}

// =============================================================================
// TEST SETUP AND UTILITIES
// =============================================================================

/**
 * Creates a test wrapper with all necessary providers
 */
function createTestWrapper() {
  const queryClient = createTestQueryClient()
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

/**
 * Renders LimitsTable with test providers and default props
 */
function renderLimitsTable(props: Partial<LimitsListProps> = {}) {
  const mergedProps = { ...defaultProps, ...props }
  const Wrapper = createTestWrapper()
  
  return render(<LimitsTable {...mergedProps} />, { wrapper: Wrapper })
}

/**
 * Waits for table data to load and returns table element
 */
async function waitForTableToLoad() {
  const table = await screen.findByRole('table', { name: /limits/i })
  expect(table).toBeInTheDocument()
  return table
}

/**
 * Gets all table rows excluding header
 */
function getTableRows() {
  const table = screen.getByRole('table')
  return within(table).getAllByRole('row').slice(1) // Exclude header row
}

/**
 * Gets table cells for a specific row
 */
function getRowCells(row: HTMLElement) {
  return within(row).getAllByRole('cell')
}

// =============================================================================
// MSW HANDLERS FOR API MOCKING
// =============================================================================

/**
 * Default successful limits list handler
 */
const defaultLimitsHandler = http.get('/api/v2/system/limit', () => {
  return HttpResponse.json(mockLimitsResponse)
})

/**
 * Handler for empty limits response
 */
const emptyLimitsHandler = http.get('/api/v2/system/limit', () => {
  return HttpResponse.json({
    resource: [],
    meta: { count: 0, offset: 0, limit: 25, total: 0, has_more: false }
  })
})

/**
 * Handler for server error response
 */
const errorLimitsHandler = http.get('/api/v2/system/limit', () => {
  return HttpResponse.json(
    createErrorResponse(500, 'Internal Server Error', 'Database connection failed'),
    { status: 500 }
  )
})

/**
 * Handler for delete operation
 */
const deleteLimitHandler = http.delete('/api/v2/system/limit/:id', ({ params }) => {
  const { id } = params
  return HttpResponse.json({ success: true, message: `Limit ${id} deleted successfully` })
})

/**
 * Handler for update operation
 */
const updateLimitHandler = http.patch('/api/v2/system/limit/:id', async ({ request, params }) => {
  const { id } = params
  const data = await request.json()
  
  return HttpResponse.json({
    ...data,
    id: parseInt(id as string),
    updatedAt: new Date().toISOString()
  })
})

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

describe('LimitsTable Component', () => {
  let user: ReturnType<typeof userEvent.setup>
  
  beforeAll(() => {
    // Mock console.error to avoid cluttering test output
    mockConsoleError()
  })
  
  beforeEach(() => {
    // Set up user event with reasonable delay for realistic interactions
    user = userEvent.setup({ delay: null })
    
    // Use default successful handlers
    server.use(defaultLimitsHandler)
  })
  
  afterEach(() => {
    cleanup()
    server.resetHandlers()
    vi.clearAllMocks()
  })
  
  // ===========================================================================
  // BASIC RENDERING TESTS
  // ===========================================================================
  
  describe('Basic Rendering', () => {
    it('should render table structure correctly', async () => {
      renderLimitsTable()
      
      // Wait for table to load
      const table = await waitForTableToLoad()
      
      // Verify table structure
      expect(table).toHaveAttribute('role', 'table')
      expect(table).toHaveAccessibleName(/limits/i)
      
      // Verify header row
      const headerRow = within(table).getByRole('row', { name: /table headers/i })
      expect(headerRow).toBeInTheDocument()
      
      // Verify required columns are present
      expect(within(headerRow).getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
      expect(within(headerRow).getByRole('columnheader', { name: /type/i })).toBeInTheDocument()
      expect(within(headerRow).getByRole('columnheader', { name: /rate/i })).toBeInTheDocument()
      expect(within(headerRow).getByRole('columnheader', { name: /counter/i })).toBeInTheDocument()
      expect(within(headerRow).getByRole('columnheader', { name: /active/i })).toBeInTheDocument()
      expect(within(headerRow).getByRole('columnheader', { name: /actions/i })).toBeInTheDocument()
    })
    
    it('should display loading state initially', () => {
      renderLimitsTable()
      
      // Should show loading indicator
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
      expect(screen.getByText(/loading limits/i)).toBeInTheDocument()
    })
    
    it('should render all limit data correctly', async () => {
      renderLimitsTable()
      
      await waitForTableToLoad()
      
      // Verify all mock limits are displayed
      for (const limit of mockLimits) {
        expect(screen.getByText(limit.name)).toBeInTheDocument()
        expect(screen.getByText(limit.limitType)).toBeInTheDocument()
        expect(screen.getByText(limit.limitRate)).toBeInTheDocument()
        expect(screen.getByText(limit.limitCounter)).toBeInTheDocument()
      }
    })
    
    it('should display empty state when no limits exist', async () => {
      server.use(emptyLimitsHandler)
      renderLimitsTable()
      
      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText(/no limits found/i)).toBeInTheDocument()
      })
      
      // Verify empty state elements
      expect(screen.getByRole('img', { name: /no data illustration/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create new limit/i })).toBeInTheDocument()
    })
  })
  
  // ===========================================================================
  // DATA DISPLAY AND FORMATTING TESTS
  // ===========================================================================
  
  describe('Data Display and Formatting', () => {
    it('should format active status correctly', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const rows = getTableRows()
      
      // Check active status for first limit (active: true)
      const activeLimit = rows[0]
      const activeCells = getRowCells(activeLimit)
      expect(within(activeCells[0]).getByRole('switch')).toBeChecked()
      expect(within(activeCells[0]).getByLabelText(/active/i)).toBeInTheDocument()
      
      // Check inactive status for second limit (active: false)
      const inactiveLimit = rows[1]
      const inactiveCells = getRowCells(inactiveLimit)
      expect(within(inactiveCells[0]).getByRole('switch')).not.toBeChecked()
    })
    
    it('should display limit types with proper formatting', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Verify limit types are displayed with proper casing
      expect(screen.getByText('endpoint')).toBeInTheDocument()
      expect(screen.getByText('user')).toBeInTheDocument()
      expect(screen.getByText('role')).toBeInTheDocument()
      expect(screen.getByText('ip')).toBeInTheDocument()
    })
    
    it('should display rate information with proper units', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Verify rate formats
      expect(screen.getByText('100/minute')).toBeInTheDocument()
      expect(screen.getByText('1000/hour')).toBeInTheDocument()
      expect(screen.getByText('500/day')).toBeInTheDocument()
      expect(screen.getByText('10000/hour')).toBeInTheDocument()
    })
    
    it('should handle null values appropriately', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // First limit has null user and role
      const firstRowCells = getRowCells(getTableRows()[0])
      expect(within(firstRowCells[5]).getByText('—')).toBeInTheDocument() // user column
      expect(within(firstRowCells[7]).getByText('—')).toBeInTheDocument() // role column
      
      // Second limit has null service and role
      const secondRowCells = getRowCells(getTableRows()[1])
      expect(within(secondRowCells[6]).getByText('—')).toBeInTheDocument() // service column
      expect(within(secondRowCells[7]).getByText('—')).toBeInTheDocument() // role column
    })
  })
  
  // ===========================================================================
  // SORTING FUNCTIONALITY TESTS
  // ===========================================================================
  
  describe('Sorting Functionality', () => {
    it('should sort by name column when header is clicked', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      const sortButton = within(nameHeader).getByRole('button', { name: /sort by name/i })
      
      // Initial state - should be unsorted
      expect(sortButton).toHaveAttribute('aria-sort', 'none')
      
      // Click to sort ascending
      await user.click(sortButton)
      
      await waitFor(() => {
        expect(sortButton).toHaveAttribute('aria-sort', 'ascending')
      })
      
      // Verify sort indicator
      expect(within(nameHeader).getByLabelText(/sorted ascending/i)).toBeInTheDocument()
      
      // Click to sort descending
      await user.click(sortButton)
      
      await waitFor(() => {
        expect(sortButton).toHaveAttribute('aria-sort', 'descending')
      })
      
      // Verify sort indicator changed
      expect(within(nameHeader).getByLabelText(/sorted descending/i)).toBeInTheDocument()
    })
    
    it('should sort by rate column correctly', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const rateHeader = screen.getByRole('columnheader', { name: /rate/i })
      const sortButton = within(rateHeader).getByRole('button', { name: /sort by rate/i })
      
      await user.click(sortButton)
      
      // Verify API call was made with sort parameter
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.objectContaining({
              sort: 'limitRate'
            })
          })
        )
      })
    })
    
    it('should clear sort when clicking sorted column third time', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      const sortButton = within(nameHeader).getByRole('button', { name: /sort by name/i })
      
      // Click three times: none -> ascending -> descending -> none
      await user.click(sortButton) // ascending
      await user.click(sortButton) // descending
      await user.click(sortButton) // clear
      
      await waitFor(() => {
        expect(sortButton).toHaveAttribute('aria-sort', 'none')
      })
    })
  })
  
  // ===========================================================================
  // FILTERING FUNCTIONALITY TESTS
  // ===========================================================================
  
  describe('Filtering Functionality', () => {
    it('should filter by name when typing in search field', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const searchInput = screen.getByRole('searchbox', { name: /search limits/i })
      expect(searchInput).toBeInTheDocument()
      
      // Type search query
      await user.type(searchInput, 'API Rate')
      
      // Verify debounced search is triggered
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.objectContaining({
              filter: expect.stringContaining('API Rate')
            })
          })
        )
      }, { timeout: 1000 })
    })
    
    it('should filter by limit type using dropdown', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      
      // Open dropdown and select endpoint type
      await user.click(typeFilter)
      
      const endpointOption = await screen.findByRole('option', { name: /endpoint/i })
      await user.click(endpointOption)
      
      // Verify filter is applied
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.objectContaining({
              filter: expect.stringContaining('limitType=endpoint')
            })
          })
        )
      })
    })
    
    it('should filter by active status', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
      
      // Select active only
      await user.click(statusFilter)
      const activeOption = await screen.findByRole('option', { name: /active only/i })
      await user.click(activeOption)
      
      // Verify filter is applied
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.objectContaining({
              filter: expect.stringContaining('active=true')
            })
          })
        )
      })
    })
    
    it('should clear all filters when clear button is clicked', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Apply some filters first
      const searchInput = screen.getByRole('searchbox', { name: /search limits/i })
      await user.type(searchInput, 'test')
      
      const clearButton = screen.getByRole('button', { name: /clear filters/i })
      await user.click(clearButton)
      
      // Verify filters are cleared
      expect(searchInput).toHaveValue('')
      
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.not.objectContaining({
              filter: expect.any(String)
            })
          })
        )
      })
    })
  })
  
  // ===========================================================================
  // PAGINATION TESTS
  // ===========================================================================
  
  describe('Pagination Functionality', () => {
    beforeEach(() => {
      // Mock large dataset for pagination testing
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockLimits[0],
        id: i + 1,
        name: `Limit ${i + 1}`
      }))
      
      server.use(
        http.get('/api/v2/system/limit', ({ request }) => {
          const url = new URL(request.url)
          const offset = parseInt(url.searchParams.get('offset') || '0')
          const limit = parseInt(url.searchParams.get('limit') || '25')
          
          const paginatedData = largeDataset.slice(offset, offset + limit)
          
          return HttpResponse.json({
            resource: paginatedData,
            meta: {
              count: paginatedData.length,
              offset,
              limit,
              total: largeDataset.length,
              has_more: offset + limit < largeDataset.length
            }
          })
        })
      )
    })
    
    it('should display pagination controls for large datasets', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Verify pagination controls are present
      const pagination = screen.getByRole('navigation', { name: /pagination/i })
      expect(pagination).toBeInTheDocument()
      
      // Check for page numbers
      expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
      
      // Verify page info
      expect(screen.getByText(/showing 1 to 25 of 100 results/i)).toBeInTheDocument()
    })
    
    it('should navigate to next page when next button is clicked', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const nextButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextButton)
      
      // Verify page 2 is loaded
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /page 2/i })).toHaveAttribute('aria-current', 'page')
      })
      
      // Verify API call with offset
      expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
        expect.objectContaining({
          searchParams: expect.objectContaining({
            offset: '25'
          })
        })
      )
    })
    
    it('should change page size when items per page is modified', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i })
      
      // Change to 50 items per page
      await user.click(pageSizeSelect)
      const fiftyOption = await screen.findByRole('option', { name: /50/i })
      await user.click(fiftyOption)
      
      // Verify API call with new limit
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.objectContaining({
              limit: '50'
            })
          })
        )
      })
    })
    
    it('should disable navigation buttons appropriately', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // On first page, previous should be disabled
      const prevButton = screen.getByRole('button', { name: /previous page/i })
      expect(prevButton).toBeDisabled()
      
      // Navigate to last page
      const lastPageButton = screen.getByRole('button', { name: /page 4/i })
      await user.click(lastPageButton)
      
      await waitFor(() => {
        // On last page, next should be disabled
        const nextButton = screen.getByRole('button', { name: /next page/i })
        expect(nextButton).toBeDisabled()
      })
    })
  })
  
  // ===========================================================================
  // CRUD OPERATIONS TESTS
  // ===========================================================================
  
  describe('CRUD Operations', () => {
    it('should toggle limit status when switch is clicked', async () => {
      server.use(updateLimitHandler)
      renderLimitsTable()
      await waitForTableToLoad()
      
      const rows = getTableRows()
      const firstRowCells = getRowCells(rows[0])
      const statusSwitch = within(firstRowCells[0]).getByRole('switch')
      
      // Initially checked (active: true)
      expect(statusSwitch).toBeChecked()
      
      // Click to toggle
      await user.click(statusSwitch)
      
      // Verify optimistic update
      expect(statusSwitch).not.toBeChecked()
      
      // Verify API call
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit/1']).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'PATCH',
            body: expect.objectContaining({
              active: false
            })
          })
        )
      })
    })
    
    it('should open edit dialog when edit action is clicked', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const rows = getTableRows()
      const firstRowCells = getRowCells(rows[0])
      const actionsCell = firstRowCells[firstRowCells.length - 1]
      
      const editButton = within(actionsCell).getByRole('button', { name: /edit/i })
      await user.click(editButton)
      
      // Verify edit dialog opens
      const editDialog = await screen.findByRole('dialog', { name: /edit limit/i })
      expect(editDialog).toBeInTheDocument()
      
      // Verify form is pre-filled with existing data
      expect(screen.getByDisplayValue('API Rate Limit')).toBeInTheDocument()
      expect(screen.getByDisplayValue('100/minute')).toBeInTheDocument()
    })
    
    it('should delete limit when delete action is confirmed', async () => {
      server.use(deleteLimitHandler)
      renderLimitsTable()
      await waitForTableToLoad()
      
      const rows = getTableRows()
      const firstRowCells = getRowCells(rows[0])
      const actionsCell = firstRowCells[firstRowCells.length - 1]
      
      const deleteButton = within(actionsCell).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      // Verify confirmation dialog
      const confirmDialog = await screen.findByRole('dialog', { name: /confirm deletion/i })
      expect(confirmDialog).toBeInTheDocument()
      
      const confirmButton = within(confirmDialog).getByRole('button', { name: /delete/i })
      await user.click(confirmButton)
      
      // Verify API call
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit/1']).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'DELETE'
          })
        )
      })
      
      // Verify table refresh after deletion
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET'
          })
        )
      })
    })
    
    it('should refresh individual row when refresh action is clicked', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const rows = getTableRows()
      const firstRowCells = getRowCells(rows[0])
      const actionsCell = firstRowCells[firstRowCells.length - 1]
      
      const refreshButton = within(actionsCell).getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)
      
      // Verify cache invalidation for specific limit
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit/1']).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET'
          })
        )
      })
    })
    
    it('should handle bulk operations when multiple rows are selected', async () => {
      renderLimitsTable({ selectable: true })
      await waitForTableToLoad()
      
      const rows = getTableRows()
      
      // Select first two rows
      const firstCheckbox = within(rows[0]).getByRole('checkbox')
      const secondCheckbox = within(rows[1]).getByRole('checkbox')
      
      await user.click(firstCheckbox)
      await user.click(secondCheckbox)
      
      // Verify bulk actions toolbar appears
      const bulkActions = screen.getByRole('toolbar', { name: /bulk actions/i })
      expect(bulkActions).toBeInTheDocument()
      
      // Test bulk delete
      const bulkDeleteButton = within(bulkActions).getByRole('button', { name: /delete selected/i })
      await user.click(bulkDeleteButton)
      
      // Verify confirmation dialog for bulk operation
      const confirmDialog = await screen.findByRole('dialog', { name: /confirm bulk deletion/i })
      expect(confirmDialog).toBeInTheDocument()
      expect(screen.getByText(/delete 2 selected limits/i)).toBeInTheDocument()
    })
  })
  
  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================
  
  describe('Error Handling', () => {
    it('should display error message when API request fails', async () => {
      server.use(errorLimitsHandler)
      renderLimitsTable()
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to load limits/i)).toBeInTheDocument()
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument()
      })
      
      // Verify retry button is available
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()
    })
    
    it('should retry API request when retry button is clicked', async () => {
      server.use(errorLimitsHandler)
      renderLimitsTable()
      
      // Wait for error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      
      // Click retry and switch to success handler
      server.use(defaultLimitsHandler)
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)
      
      // Verify data loads successfully
      await waitForTableToLoad()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    
    it('should show network error when request times out', async () => {
      server.use(
        http.get('/api/v2/system/limit', () => {
          return HttpResponse.error()
        })
      )
      
      renderLimitsTable()
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
    
    it('should handle individual operation errors gracefully', async () => {
      server.use(
        http.delete('/api/v2/system/limit/:id', () => {
          return HttpResponse.json(
            createErrorResponse(403, 'Forbidden', 'Insufficient permissions'),
            { status: 403 }
          )
        })
      )
      
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Attempt to delete
      const rows = getTableRows()
      const deleteButton = within(rows[0]).getByRole('button', { name: /delete/i })
      await user.click(deleteButton)
      
      const confirmButton = await screen.findByRole('button', { name: /delete/i })
      await user.click(confirmButton)
      
      // Verify error toast/notification
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
      })
    })
  })
  
  // ===========================================================================
  // REACT QUERY CACHE BEHAVIOR TESTS
  // ===========================================================================
  
  describe('React Query Cache Behavior', () => {
    it('should cache initial data and serve from cache on subsequent renders', async () => {
      const { unmount } = renderLimitsTable()
      await waitForTableToLoad()
      
      // Unmount and remount component
      unmount()
      renderLimitsTable()
      
      // Data should be available immediately from cache
      expect(await screen.findByRole('table')).toBeInTheDocument()
      
      // Verify no additional API call was made
      expect(server.requests['/api/v2/system/limit'].length).toBe(1)
    })
    
    it('should invalidate cache when mutations occur', async () => {
      server.use(updateLimitHandler)
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Perform mutation (toggle status)
      const statusSwitch = screen.getAllByRole('switch')[0]
      await user.click(statusSwitch)
      
      // Verify cache is invalidated and data is refetched
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit'].length).toBeGreaterThan(1)
      })
    })
    
    it('should handle stale-while-revalidate pattern correctly', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Mock stale data scenario
      const staleData = [{ ...mockLimits[0], name: 'Stale Limit' }]
      server.use(
        http.get('/api/v2/system/limit', () => {
          return HttpResponse.json({
            resource: staleData,
            meta: mockPaginationMeta
          })
        })
      )
      
      // Force background refetch
      fireEvent.focus(window)
      
      // Verify stale data is shown while fresh data loads
      expect(screen.getByText('API Rate Limit')).toBeInTheDocument()
      
      // Wait for fresh data
      await waitFor(() => {
        expect(screen.getByText('Stale Limit')).toBeInTheDocument()
      })
    })
    
    it('should optimize queries with proper cache keys', async () => {
      renderLimitsTable({ 
        initialParams: { limit: 10, filter: 'test' }
      })
      await waitForTableToLoad()
      
      // Render with different params
      renderLimitsTable({
        initialParams: { limit: 20, filter: 'different' }
      })
      
      // Verify separate cache entries
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit'].length).toBe(2)
      })
    })
  })
  
  // ===========================================================================
  // ACCESSIBILITY TESTS (WCAG 2.1 AA COMPLIANCE)
  // ===========================================================================
  
  describe('Accessibility (WCAG 2.1 AA Compliance)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderLimitsTable()
      await waitForTableToLoad()
      
      // Run axe accessibility tests
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
    
    it('should support keyboard navigation', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const table = screen.getByRole('table')
      
      // Focus should move through interactive elements
      await user.tab()
      expect(screen.getByRole('searchbox')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('combobox', { name: /filter by type/i })).toHaveFocus()
      
      // Navigate to table
      await user.tab()
      await user.tab()
      expect(table.querySelector('[tabindex="0"]')).toHaveFocus()
    })
    
    it('should announce table updates to screen readers', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Verify aria-live region exists
      const liveRegion = screen.getByRole('status', { name: /table status/i })
      expect(liveRegion).toBeInTheDocument()
      
      // Test sorting announcement
      const nameHeader = screen.getByRole('columnheader', { name: /name/i })
      const sortButton = within(nameHeader).getByRole('button')
      
      await user.click(sortButton)
      
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/sorted by name ascending/i)
      })
    })
    
    it('should provide descriptive labels for all interactive elements', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Verify all buttons have accessible names
      const editButtons = screen.getAllByRole('button', { name: /edit.*limit/i })
      expect(editButtons).toHaveLength(mockLimits.length)
      
      const deleteButtons = screen.getAllByRole('button', { name: /delete.*limit/i })
      expect(deleteButtons).toHaveLength(mockLimits.length)
      
      const refreshButtons = screen.getAllByRole('button', { name: /refresh.*limit/i })
      expect(refreshButtons).toHaveLength(mockLimits.length)
    })
    
    it('should support high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })
      
      renderLimitsTable()
      await waitForTableToLoad()
      
      const table = screen.getByRole('table')
      
      // Verify high contrast styles are applied
      expect(table).toHaveClass('high-contrast')
      
      // Verify sufficient color contrast ratios
      const rows = getTableRows()
      rows.forEach(row => {
        expect(row).toHaveStyle({
          borderColor: expect.stringMatching(/#000000|#ffffff/i)
        })
      })
    })
    
    it('should respect reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      })
      
      renderLimitsTable()
      await waitForTableToLoad()
      
      // Verify animations are disabled
      const loadingSpinner = screen.queryByRole('status', { name: /loading/i })
      if (loadingSpinner) {
        expect(loadingSpinner).toHaveClass('motion-reduce')
      }
    })
  })
  
  // ===========================================================================
  // PERFORMANCE TESTS
  // ===========================================================================
  
  describe('Performance', () => {
    it('should render large datasets efficiently', async () => {
      // Mock dataset with 1000 items
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockLimits[0],
        id: i + 1,
        name: `Limit ${i + 1}`
      }))
      
      server.use(
        http.get('/api/v2/system/limit', () => {
          return HttpResponse.json({
            resource: largeDataset,
            meta: {
              count: largeDataset.length,
              offset: 0,
              limit: 1000,
              total: largeDataset.length,
              has_more: false
            }
          })
        })
      )
      
      const startTime = performance.now()
      renderLimitsTable({ pageSize: 1000 })
      await waitForTableToLoad()
      const endTime = performance.now()
      
      // Verify rendering completes within performance budget (< 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000)
    })
    
    it('should debounce search input appropriately', async () => {
      renderLimitsTable()
      await waitForTableToLoad()
      
      const searchInput = screen.getByRole('searchbox')
      
      // Type multiple characters quickly
      await user.type(searchInput, 'search query', { delay: 50 })
      
      // Wait for debounce period
      await waitFor(() => {
        // Should only make one API call after debounce
        expect(server.requests['/api/v2/system/limit'].length).toBe(2) // initial + search
      }, { timeout: 1000 })
    })
    
    it('should implement virtual scrolling for large tables', async () => {
      renderLimitsTable({ 
        pageSize: 1000,
        virtualScrolling: true 
      })
      await waitForTableToLoad()
      
      // Verify only visible rows are rendered
      const renderedRows = getTableRows()
      expect(renderedRows.length).toBeLessThan(50) // Should render ~20-30 visible rows
      
      // Verify scroll container exists
      const scrollContainer = screen.getByRole('region', { name: /virtual scroll/i })
      expect(scrollContainer).toBeInTheDocument()
    })
  })
  
  // ===========================================================================
  // INTEGRATION TESTS
  // ===========================================================================
  
  describe('Integration Tests', () => {
    it('should work correctly with React Query provider', async () => {
      const queryClient = createTestQueryClient()
      
      render(
        <QueryClientProvider client={queryClient}>
          <LimitsTable {...defaultProps} />
        </QueryClientProvider>
      )
      
      await waitForTableToLoad()
      
      // Verify query client has cached data
      const cachedData = queryClient.getQueryData(['limits', 'list'])
      expect(cachedData).toBeDefined()
      expect((cachedData as any).resource).toHaveLength(mockLimits.length)
    })
    
    it('should handle prop changes correctly', async () => {
      const { rerender } = renderLimitsTable({ pageSize: 25 })
      await waitForTableToLoad()
      
      // Change props
      rerender(<LimitsTable {...defaultProps} pageSize={50} />)
      
      // Verify new page size is applied
      await waitFor(() => {
        expect(server.requests['/api/v2/system/limit']).toHaveBeenCalledWith(
          expect.objectContaining({
            searchParams: expect.objectContaining({
              limit: '50'
            })
          })
        )
      })
    })
    
    it('should cleanup properly on unmount', async () => {
      const { unmount } = renderLimitsTable()
      await waitForTableToLoad()
      
      // Unmount component
      unmount()
      
      // Verify no memory leaks or hanging promises
      await waitFor(() => {
        // All async operations should be cleaned up
        expect(document.querySelector('[data-testid="limits-table"]')).not.toBeInTheDocument()
      })
    })
  })
})

// =============================================================================
// HELPER FUNCTIONS AND UTILITIES
// =============================================================================

/**
 * Helper to wait for specific table state
 */
async function waitForTableState(state: 'loading' | 'error' | 'success' | 'empty') {
  switch (state) {
    case 'loading':
      await waitFor(() => {
        expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
      })
      break
    case 'error':
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
      break
    case 'success':
      await waitForTableToLoad()
      break
    case 'empty':
      await waitFor(() => {
        expect(screen.getByText(/no limits found/i)).toBeInTheDocument()
      })
      break
  }
}

/**
 * Helper to simulate table interactions
 */
const tableInteractions = {
  async sort(columnName: string, direction: 'asc' | 'desc' | 'none') {
    const header = screen.getByRole('columnheader', { name: new RegExp(columnName, 'i') })
    const sortButton = within(header).getByRole('button')
    
    // Click appropriate number of times based on current state
    const currentSort = sortButton.getAttribute('aria-sort')
    let clickCount = 0
    
    if (direction === 'asc' && currentSort === 'none') clickCount = 1
    else if (direction === 'desc' && currentSort === 'none') clickCount = 2
    else if (direction === 'desc' && currentSort === 'ascending') clickCount = 1
    else if (direction === 'none' && currentSort === 'descending') clickCount = 1
    
    for (let i = 0; i < clickCount; i++) {
      await userEvent.click(sortButton)
    }
  },
  
  async filter(type: 'search' | 'type' | 'status', value: string) {
    let filterElement: HTMLElement
    
    switch (type) {
      case 'search':
        filterElement = screen.getByRole('searchbox', { name: /search/i })
        await userEvent.clear(filterElement)
        await userEvent.type(filterElement, value)
        break
      case 'type':
      case 'status':
        filterElement = screen.getByRole('combobox', { name: new RegExp(`filter by ${type}`, 'i') })
        await userEvent.click(filterElement)
        const option = await screen.findByRole('option', { name: new RegExp(value, 'i') })
        await userEvent.click(option)
        break
    }
  },
  
  async paginate(action: 'next' | 'prev' | 'page', value?: number) {
    switch (action) {
      case 'next':
        await userEvent.click(screen.getByRole('button', { name: /next page/i }))
        break
      case 'prev':
        await userEvent.click(screen.getByRole('button', { name: /previous page/i }))
        break
      case 'page':
        await userEvent.click(screen.getByRole('button', { name: new RegExp(`page ${value}`, 'i') }))
        break
    }
  }
}

/**
 * Export helper functions for use in other test files
 */
export {
  renderLimitsTable,
  waitForTableToLoad,
  waitForTableState,
  tableInteractions,
  getTableRows,
  getRowCells,
  mockLimits,
  mockLimitsResponse
}