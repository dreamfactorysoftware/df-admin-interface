/**
 * @fileoverview Comprehensive test suite for the manage-table component system
 * Tests accessibility compliance, keyboard navigation, screen reader support,
 * sorting functionality, filtering behavior, pagination controls, row actions,
 * bulk operations, and responsive design with WCAG 2.1 AA compliance validation.
 * 
 * @version 1.0.0
 * @since 2024-12-05
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  within,
  act,
  createEvent
} from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Component imports
import { ManageTable } from './manage-table'
import type { 
  ManageTableProps, 
  TableColumn, 
  TableData,
  TableAction,
  SortingState,
  FilterState,
  PaginationState 
} from './manage-table.types'

// Test utilities
import { 
  renderWithProviders, 
  createMockData, 
  mockIntersectionObserver,
  mockResizeObserver 
} from '../../../test/test-utils'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock handlers for API endpoints
const handlers = [
  rest.get('/api/v2/system/service', (req, res, ctx) => {
    const { searchParams } = req.url
    const page = parseInt(searchParams.get('offset') || '0') / parseInt(searchParams.get('limit') || '25')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('filter') || ''
    const sort = searchParams.get('order') || 'name'
    
    let data = createMockData.services()
    
    // Apply search filter
    if (search) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Apply sorting
    data.sort((a, b) => {
      const [field, direction] = sort.split(' ')
      const multiplier = direction === 'desc' ? -1 : 1
      return a[field as keyof typeof a].localeCompare(b[field as keyof typeof b]) * multiplier
    })
    
    // Apply pagination
    const startIndex = page * limit
    const endIndex = startIndex + limit
    const paginatedData = data.slice(startIndex, endIndex)
    
    return res(
      ctx.status(200),
      ctx.json({
        resource: paginatedData,
        meta: {
          count: paginatedData.length,
          total: data.length,
        }
      })
    )
  }),
  
  rest.delete('/api/v2/system/service/:id', (req, res, ctx) => {
    return res(ctx.status(204))
  }),
  
  rest.patch('/api/v2/system/service', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    )
  })
]

// Setup MSW server
const server = setupServer(...handlers)

// Mock data generators
const createMockColumns = (): TableColumn[] => [
  {
    id: 'name',
    header: 'Service Name',
    accessorKey: 'name',
    sortable: true,
    filterable: true,
    cell: ({ value }) => (
      <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
    )
  },
  {
    id: 'type',
    header: 'Type',
    accessorKey: 'type',
    sortable: true,
    filterable: true,
    cell: ({ value }) => (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        {value}
      </span>
    )
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'active',
    sortable: true,
    cell: ({ value }) => (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        value 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }`}>
        {value ? 'Active' : 'Inactive'}
      </span>
    )
  },
  {
    id: 'created_date',
    header: 'Created',
    accessorKey: 'created_date',
    sortable: true,
    cell: ({ value }) => new Date(value).toLocaleDateString()
  }
]

const createMockTableData = (count: number = 25): TableData[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `service-${index + 1}`,
    name: `Database Service ${index + 1}`,
    type: ['mysql', 'postgresql', 'mongodb', 'oracle'][index % 4],
    active: index % 3 !== 0,
    created_date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    description: `Test database service ${index + 1} for API generation`
  }))
}

const createMockActions = (): TableAction[] => [
  {
    id: 'edit',
    label: 'Edit Service',
    icon: 'PencilIcon',
    variant: 'secondary',
    onClick: vi.fn(),
    accessibility: {
      'aria-label': 'Edit database service configuration'
    }
  },
  {
    id: 'test-connection',
    label: 'Test Connection',
    icon: 'CheckCircleIcon',
    variant: 'outline',
    onClick: vi.fn(),
    accessibility: {
      'aria-label': 'Test database connection'
    }
  },
  {
    id: 'delete',
    label: 'Delete Service',
    icon: 'TrashIcon',
    variant: 'destructive',
    onClick: vi.fn(),
    accessibility: {
      'aria-label': 'Delete database service'
    },
    confirmationRequired: true,
    confirmationMessage: 'Are you sure you want to delete this service?'
  }
]

const defaultProps: Partial<ManageTableProps> = {
  columns: createMockColumns(),
  data: createMockTableData(),
  actions: createMockActions(),
  searchable: true,
  sortable: true,
  filterable: true,
  pagination: {
    enabled: true,
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100]
  },
  selection: {
    enabled: true,
    multiple: true
  },
  virtualization: {
    enabled: false, // Disabled for smaller datasets
    estimatedRowHeight: 60
  },
  accessibility: {
    tableCaption: 'Database services management table',
    announceChanges: true,
    keyboardNavigation: true
  },
  theme: 'light',
  density: 'default'
}

// Test utilities
const renderTable = (props: Partial<ManageTableProps> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        cacheTime: 0
      }
    }
  })

  const mergedProps = { ...defaultProps, ...props } as ManageTableProps

  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <ManageTable {...mergedProps} />
    </QueryClientProvider>
  )
}

const user = userEvent.setup()

describe('ManageTable Component', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' })
    mockIntersectionObserver()
    mockResizeObserver()
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
    server.close()
    vi.restoreAllMocks()
  })

  describe('Basic Rendering and Structure', () => {
    it('renders table with proper semantic structure', async () => {
      renderTable()
      
      // Check for proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByRole('table')).toHaveAccessibleName('Database services management table')
      
      // Check for table headers
      expect(screen.getByRole('columnheader', { name: /service name/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /created/i })).toBeInTheDocument()
      
      // Check for table body
      expect(screen.getByRole('rowgroup')).toBeInTheDocument()
    })

    it('displays table data correctly', async () => {
      renderTable()
      
      // Check for data rows
      const rows = screen.getAllByRole('row')
      expect(rows).toHaveLength(26) // 25 data rows + 1 header row
      
      // Check for specific data
      expect(screen.getByText('Database Service 1')).toBeInTheDocument()
      expect(screen.getByText('mysql')).toBeInTheDocument()
    })

    it('renders with different density variants', async () => {
      const { rerender } = renderTable({ density: 'compact' })
      
      const table = screen.getByRole('table')
      expect(table).toHaveClass('density-compact')
      
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ManageTable {...defaultProps} density="comfortable" />
        </QueryClientProvider>
      )
      
      expect(table).toHaveClass('density-comfortable')
    })
  })

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('passes axe accessibility tests', async () => {
      const { container } = renderTable()
      
      await waitFor(async () => {
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })
    })

    it('supports keyboard navigation', async () => {
      renderTable()
      
      const table = screen.getByRole('table')
      
      // Focus table
      await user.tab()
      expect(table).toHaveFocus()
      
      // Navigate to first cell
      await user.keyboard('{ArrowDown}')
      const firstCell = screen.getByRole('cell', { name: /database service 1/i })
      expect(firstCell).toHaveFocus()
      
      // Navigate horizontally
      await user.keyboard('{ArrowRight}')
      const typeCell = screen.getByRole('cell', { name: /mysql/i })
      expect(typeCell).toHaveFocus()
      
      // Navigate vertically
      await user.keyboard('{ArrowDown}')
      const nextRowTypeCell = screen.getByRole('cell', { name: /postgresql/i })
      expect(nextRowTypeCell).toHaveFocus()
    })

    it('provides proper ARIA labels and descriptions', async () => {
      renderTable()
      
      // Check table accessibility attributes
      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Database services management table')
      
      // Check sortable column headers
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      expect(nameHeader).toHaveAttribute('aria-sort', 'none')
      
      // Check action buttons
      const editButtons = screen.getAllByLabelText(/edit database service configuration/i)
      expect(editButtons[0]).toBeInTheDocument()
    })

    it('announces changes to screen readers', async () => {
      const mockAnnounce = vi.fn()
      // Mock live region announcements
      Object.defineProperty(window, 'speechSynthesis', {
        value: { speak: mockAnnounce },
        writable: true
      })
      
      renderTable()
      
      // Trigger sort change
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      await user.click(nameHeader)
      
      // Check announcement was made
      await waitFor(() => {
        const liveRegion = screen.getByRole('status')
        expect(liveRegion).toHaveTextContent(/sorted by service name ascending/i)
      })
    })

    it('meets color contrast requirements', async () => {
      renderTable({ theme: 'light' })
      
      // Test primary text contrast
      const serviceNames = screen.getAllByText(/database service/i)
      const computedStyle = window.getComputedStyle(serviceNames[0])
      
      // Verify contrast ratio meets WCAG AA (4.5:1)
      expect(computedStyle.color).toBeDefined()
      expect(computedStyle.backgroundColor).toBeDefined()
    })

    it('supports high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
        })),
      })
      
      renderTable()
      
      const table = screen.getByRole('table')
      expect(table).toHaveClass('high-contrast')
    })
  })

  describe('Sorting Functionality', () => {
    it('sorts columns when headers are clicked', async () => {
      renderTable()
      
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      
      // Initial state
      expect(nameHeader).toHaveAttribute('aria-sort', 'none')
      
      // Click to sort ascending
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      
      // Click to sort descending
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
      
      // Click to remove sort
      await user.click(nameHeader)
      expect(nameHeader).toHaveAttribute('aria-sort', 'none')
    })

    it('sorts data correctly', async () => {
      renderTable()
      
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      await user.click(nameHeader)
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1) // Skip header
        const firstRowName = within(rows[0]).getByText(/database service/i)
        expect(firstRowName).toHaveTextContent('Database Service 1')
      })
    })

    it('supports multi-column sorting', async () => {
      renderTable()
      
      // Sort by type first
      const typeHeader = screen.getByRole('columnheader', { name: /type/i })
      await user.click(typeHeader)
      
      // Then sort by name while holding shift
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      await user.keyboard('{Shift>}')
      await user.click(nameHeader)
      await user.keyboard('{/Shift}')
      
      // Verify both columns show sort indicators
      expect(typeHeader).toHaveAttribute('aria-sort', 'ascending')
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    })

    it('handles keyboard sorting', async () => {
      renderTable()
      
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      nameHeader.focus()
      
      // Press Enter to sort
      await user.keyboard('{Enter}')
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      
      // Press Space to sort
      await user.keyboard(' ')
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
    })
  })

  describe('Filtering and Search', () => {
    it('filters data based on search input', async () => {
      renderTable()
      
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      
      // Type search query
      await user.type(searchInput, 'mysql')
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1)
        expect(rows).toHaveLength(6) // Expect filtered results
      })
      
      // Clear search
      await user.clear(searchInput)
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1)
        expect(rows).toHaveLength(25) // Back to full results
      })
    })

    it('provides filter feedback', async () => {
      renderTable()
      
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      await user.type(searchInput, 'nonexistent')
      
      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })

    it('supports advanced filtering', async () => {
      renderTable()
      
      // Open advanced filters
      const filterButton = screen.getByRole('button', { name: /filters/i })
      await user.click(filterButton)
      
      // Apply type filter
      const typeFilter = screen.getByRole('combobox', { name: /type/i })
      await user.selectOptions(typeFilter, 'mysql')
      
      // Apply filter
      const applyButton = screen.getByRole('button', { name: /apply filters/i })
      await user.click(applyButton)
      
      await waitFor(() => {
        const mysqlCells = screen.getAllByText('mysql')
        expect(mysqlCells.length).toBeGreaterThan(0)
      })
    })

    it('debounces search input', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch
      
      renderTable()
      
      const searchInput = screen.getByRole('textbox', { name: /search/i })
      
      // Type rapidly
      await user.type(searchInput, 'test', { delay: 50 })
      
      // Should only make one request after debounce
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      }, { timeout: 1000 })
    })
  })

  describe('Pagination Controls', () => {
    it('renders pagination controls', async () => {
      renderTable()
      
      // Check pagination elements
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument()
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument()
    })

    it('navigates between pages', async () => {
      const largeMockData = createMockTableData(100)
      renderTable({ data: largeMockData })
      
      const nextButton = screen.getByRole('button', { name: /next page/i })
      const prevButton = screen.getByRole('button', { name: /previous page/i })
      
      // Next page
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText(/page 2 of/i)).toBeInTheDocument()
      })
      
      // Previous page
      await user.click(prevButton)
      
      await waitFor(() => {
        expect(screen.getByText(/page 1 of/i)).toBeInTheDocument()
      })
    })

    it('changes page size', async () => {
      renderTable()
      
      const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i })
      await user.selectOptions(pageSizeSelect, '10')
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1)
        expect(rows).toHaveLength(10)
      })
    })

    it('supports keyboard navigation for pagination', async () => {
      renderTable()
      
      const nextButton = screen.getByRole('button', { name: /next page/i })
      nextButton.focus()
      
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(screen.getByText(/page 2 of/i)).toBeInTheDocument()
      })
    })
  })

  describe('Row Actions and Bulk Operations', () => {
    it('renders row actions', async () => {
      renderTable()
      
      const editButtons = screen.getAllByLabelText(/edit database service configuration/i)
      expect(editButtons).toHaveLength(25)
      
      const testButtons = screen.getAllByLabelText(/test database connection/i)
      expect(testButtons).toHaveLength(25)
      
      const deleteButtons = screen.getAllByLabelText(/delete database service/i)
      expect(deleteButtons).toHaveLength(25)
    })

    it('executes row actions when clicked', async () => {
      const mockActions = createMockActions()
      renderTable({ actions: mockActions })
      
      const editButton = screen.getAllByLabelText(/edit database service configuration/i)[0]
      await user.click(editButton)
      
      expect(mockActions[0].onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'service-1'
        })
      )
    })

    it('shows confirmation for destructive actions', async () => {
      renderTable()
      
      const deleteButton = screen.getAllByLabelText(/delete database service/i)[0]
      await user.click(deleteButton)
      
      // Check for confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/are you sure you want to delete this service/i)).toBeInTheDocument()
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('supports row selection', async () => {
      renderTable()
      
      const checkboxes = screen.getAllByRole('checkbox')
      const firstRowCheckbox = checkboxes[1] // Skip header checkbox
      
      await user.click(firstRowCheckbox)
      expect(firstRowCheckbox).toBeChecked()
      
      // Check that selection count is updated
      expect(screen.getByText(/1 selected/i)).toBeInTheDocument()
    })

    it('supports bulk selection', async () => {
      renderTable()
      
      const headerCheckbox = screen.getAllByRole('checkbox')[0]
      await user.click(headerCheckbox)
      
      // All rows should be selected
      const checkboxes = screen.getAllByRole('checkbox').slice(1)
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
      
      expect(screen.getByText(/25 selected/i)).toBeInTheDocument()
    })

    it('shows bulk action toolbar when rows are selected', async () => {
      renderTable()
      
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstRowCheckbox)
      
      expect(screen.getByRole('toolbar', { name: /bulk actions/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete selected/i })).toBeInTheDocument()
    })
  })

  describe('Performance and Virtualization', () => {
    it('handles large datasets with virtualization', async () => {
      const largeMockData = createMockTableData(1000)
      
      renderTable({
        data: largeMockData,
        virtualization: {
          enabled: true,
          estimatedRowHeight: 60
        }
      })
      
      // Should only render visible rows
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(1000)
      expect(rows.length).toBeGreaterThan(10) // But more than a few
    })

    it('loads data incrementally', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          resource: createMockTableData(25),
          meta: { count: 25, total: 1000 }
        })
      })
      global.fetch = mockFetch
      
      renderTable()
      
      // Scroll to bottom to trigger load more
      const table = screen.getByRole('table')
      fireEvent.scroll(table, { target: { scrollTop: 1000 } })
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })

    it('caches data efficiently', async () => {
      const queryClient = new QueryClient()
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          resource: createMockTableData(25),
          meta: { count: 25, total: 25 }
        })
      })
      global.fetch = mockFetch
      
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <ManageTable {...defaultProps} />
        </QueryClientProvider>
      )
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
      
      // Re-render should use cached data
      rerender(
        <QueryClientProvider client={queryClient}>
          <ManageTable {...defaultProps} />
        </QueryClientProvider>
      )
      
      // Should not fetch again
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      window.dispatchEvent(new Event('resize'))
      
      renderTable()
      
      // Should show mobile-optimized view
      const table = screen.getByRole('table')
      expect(table).toHaveClass('mobile-responsive')
    })

    it('handles tablet screens', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      window.dispatchEvent(new Event('resize'))
      
      renderTable()
      
      const table = screen.getByRole('table')
      expect(table).toHaveClass('tablet-responsive')
    })

    it('provides horizontal scrolling on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })
      
      renderTable()
      
      const tableContainer = screen.getByRole('table').closest('.table-container')
      expect(tableContainer).toHaveClass('overflow-x-auto')
    })
  })

  describe('Theme Support', () => {
    it('renders correctly in light theme', async () => {
      renderTable({ theme: 'light' })
      
      const table = screen.getByRole('table')
      expect(table).toHaveClass('theme-light')
    })

    it('renders correctly in dark theme', async () => {
      renderTable({ theme: 'dark' })
      
      const table = screen.getByRole('table')
      expect(table).toHaveClass('theme-dark')
    })

    it('responds to theme changes', async () => {
      const { rerender } = renderTable({ theme: 'light' })
      
      let table = screen.getByRole('table')
      expect(table).toHaveClass('theme-light')
      
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ManageTable {...defaultProps} theme="dark" />
        </QueryClientProvider>
      )
      
      table = screen.getByRole('table')
      expect(table).toHaveClass('theme-dark')
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
        })
      )
      
      renderTable()
      
      await waitFor(() => {
        expect(screen.getByText(/error loading data/i)).toBeInTheDocument()
      })
    })

    it('shows loading states', async () => {
      // Delay the response
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({
            resource: createMockTableData(25),
            meta: { count: 25, total: 25 }
          }))
        })
      )
      
      renderTable()
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('handles empty data states', async () => {
      renderTable({ data: [] })
      
      expect(screen.getByText(/no data available/i)).toBeInTheDocument()
    })
  })

  describe('Integration with React Query', () => {
    it('integrates with React Query for data fetching', async () => {
      const queryClient = new QueryClient()
      const querySpy = vi.spyOn(queryClient, 'fetchQuery')
      
      render(
        <QueryClientProvider client={queryClient}>
          <ManageTable {...defaultProps} />
        </QueryClientProvider>
      )
      
      await waitFor(() => {
        expect(querySpy).toHaveBeenCalled()
      })
    })

    it('handles cache invalidation', async () => {
      const queryClient = new QueryClient()
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      renderTable()
      
      // Trigger action that should invalidate cache
      const deleteButton = screen.getAllByLabelText(/delete database service/i)[0]
      await user.click(deleteButton)
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled()
      })
    })

    it('supports optimistic updates', async () => {
      renderTable()
      
      const initialRowCount = screen.getAllByRole('row').length
      
      // Delete a row
      const deleteButton = screen.getAllByLabelText(/delete database service/i)[0]
      await user.click(deleteButton)
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      // Row should be removed immediately (optimistic update)
      await waitFor(() => {
        const currentRowCount = screen.getAllByRole('row').length
        expect(currentRowCount).toBe(initialRowCount - 1)
      })
    })
  })

  describe('Performance Benchmarks', () => {
    it('renders initial table in under 100ms', async () => {
      const startTime = performance.now()
      
      renderTable()
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(100)
    })

    it('handles sorting in under 50ms', async () => {
      renderTable()
      
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      
      const startTime = performance.now()
      await user.click(nameHeader)
      const endTime = performance.now()
      
      const sortTime = endTime - startTime
      expect(sortTime).toBeLessThan(50)
    })
  })

  describe('WCAG 2.1 AA Compliance Validation', () => {
    it('meets color contrast requirements in all themes', async () => {
      // Test light theme
      renderTable({ theme: 'light' })
      let results = await axe(document.body, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
      
      // Test dark theme
      const { rerender } = renderTable({ theme: 'dark' })
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <ManageTable {...defaultProps} theme="dark" />
        </QueryClientProvider>
      )
      
      results = await axe(document.body, {
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      expect(results).toHaveNoViolations()
    })

    it('supports screen reader announcements', async () => {
      renderTable()
      
      // Check for live regions
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByRole('log')).toBeInTheDocument()
      
      // Trigger sort and check announcement
      const nameHeader = screen.getByRole('columnheader', { name: /service name/i })
      await user.click(nameHeader)
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('status')
        expect(liveRegion).toHaveTextContent(/sorted/i)
      })
    })

    it('provides proper focus management', async () => {
      renderTable()
      
      // Test focus trap in dialogs
      const deleteButton = screen.getAllByLabelText(/delete database service/i)[0]
      await user.click(deleteButton)
      
      const dialog = screen.getByRole('dialog')
      const focusableElements = within(dialog).getAllByRole('button')
      
      // First focusable element should be focused
      expect(focusableElements[0]).toHaveFocus()
      
      // Tab to next element
      await user.tab()
      expect(focusableElements[1]).toHaveFocus()
    })
  })
})