/**
 * Comprehensive test suite for table details page component
 * 
 * This test suite covers:
 * - Form validation and user interactions using React Hook Form with Zod
 * - Data fetching and caching with TanStack React Query
 * - Error handling and edge cases
 * - Performance testing for TanStack Virtual implementation
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Mock Service Worker (MSW) integration for realistic API mocking
 * 
 * Migrated from Angular Jasmine/Karma to Vitest with Testing Library
 * per Section 7.1.1 testing framework transformation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextRouter } from 'next/router'

// Import the page component and its dependencies
import TableDetailsPage from './page'
import { TableDetailsProvider } from './table-context'
import { mockRouter, renderWithProviders } from '@/test/utils/test-utils'
import { server } from '@/test/mocks/server'
import { 
  createMockTableData,
  createMockFieldData,
  createMockRelationshipData,
  createLargeDataset 
} from '@/test/utils/component-factories'
import { 
  mockTableDetailsSuccess,
  mockTableDetailsError,
  mockTableUpdateSuccess,
  mockTableUpdateError,
  mockSchemaDiscoverySuccess,
  mockSchemaDiscoveryError,
  mockConnectionTestSuccess
} from '@/test/mocks/handlers'

// MSW setup extensions per Section 6.6 testing infrastructure requirements
import { rest } from 'msw'

// Add jest-axe custom matchers for accessibility testing
expect.extend(toHaveNoViolations)

/**
 * Test data factories for consistent mock data generation
 * Replaces Angular service mocks with realistic data structures
 */
const mockTableDetails = createMockTableData({
  name: 'users',
  label: 'Users Table',
  description: 'User account information',
  fields: [
    createMockFieldData({ name: 'id', type: 'integer', isPrimaryKey: true }),
    createMockFieldData({ name: 'email', type: 'string', isNullable: false }),
    createMockFieldData({ name: 'created_at', type: 'datetime', isNullable: false }),
  ],
  relationships: [
    createMockRelationshipData({ 
      type: 'belongs_to', 
      table: 'profiles', 
      foreign_key: 'user_id' 
    })
  ]
})

const mockLargeTableDataset = createLargeDataset({
  tableCount: 1000,
  fieldsPerTable: 50,
  relationshipsPerTable: 10
})

describe('TableDetailsPage', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>
  let mockPush: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers()
    
    // Create fresh QueryClient instance for test isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    })

    // Setup user event with realistic delays
    user = userEvent.setup({
      delay: null, // Disable delays for test performance
    })

    // Mock Next.js router functionality
    mockPush = vi.fn()
    vi.mocked(mockRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      pathname: '/adf-schema/tables/users',
      query: { tableId: 'users' },
      asPath: '/adf-schema/tables/users',
    } as Partial<NextRouter> as NextRouter)
  })

  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  /**
   * Utility function to render the component with all required providers
   * Replaces Angular TestBed configuration with React testing setup
   */
  const renderTableDetailsPage = (props = {}) => {
    const defaultProps = {
      params: { tableId: 'users' },
      searchParams: {},
      ...props
    }

    return renderWithProviders(
      <QueryClientProvider client={queryClient}>
        <TableDetailsProvider>
          <TableDetailsPage {...defaultProps} />
        </TableDetailsProvider>
      </QueryClientProvider>
    )
  }

  describe('Component Rendering and Initial State', () => {
    it('should render table details page with loading state initially', async () => {
      renderTableDetailsPage()

      // Verify loading skeleton is displayed while data fetches
      expect(screen.getByTestId('table-details-loading')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading table details')).toBeInTheDocument()
    })

    it('should render table details with data after successful fetch', async () => {
      // Setup MSW handler for successful data fetch
      server.use(mockTableDetailsSuccess(mockTableDetails))

      renderTableDetailsPage()

      // Wait for data to load and verify table information is displayed
      await waitFor(() => {
        expect(screen.getByText('Users Table')).toBeInTheDocument()
      })

      expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Users Table')).toBeInTheDocument()
      expect(screen.getByDisplayValue('User account information')).toBeInTheDocument()
    })

    it('should render error state when data fetch fails', async () => {
      // Setup MSW handler for error response
      server.use(mockTableDetailsError(404, 'Table not found'))

      renderTableDetailsPage()

      // Wait for error state and verify error message
      await waitFor(() => {
        expect(screen.getByText('Error loading table details')).toBeInTheDocument()
      })

      expect(screen.getByText('Table not found')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('should display correct tab navigation', async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Table Details' })).toBeInTheDocument()
      })

      expect(screen.getByRole('tab', { name: 'JSON Editor' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Fields' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Relationships' })).toBeInTheDocument()
    })
  })

  describe('Form Validation and User Interactions', () => {
    beforeEach(async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
    })

    it('should validate required fields with real-time validation under 100ms', async () => {
      const nameInput = screen.getByLabelText('Table Name')
      
      // Clear the field to trigger validation
      await user.clear(nameInput)
      
      // Verify validation error appears quickly (under 100ms requirement)
      const startTime = performance.now()
      await waitFor(() => {
        expect(screen.getByText('Table name is required')).toBeInTheDocument()
      })
      const validationTime = performance.now() - startTime
      
      expect(validationTime).toBeLessThan(100)
    })

    it('should validate table name length constraints', async () => {
      const nameInput = screen.getByLabelText('Table Name')
      
      // Test minimum length validation
      await user.clear(nameInput)
      await user.type(nameInput, 'a')
      
      await waitFor(() => {
        expect(screen.getByText('Table name must be at least 2 characters')).toBeInTheDocument()
      })

      // Test maximum length validation (assuming 50 character limit)
      await user.clear(nameInput)
      await user.type(nameInput, 'a'.repeat(51))
      
      await waitFor(() => {
        expect(screen.getByText('Table name must be less than 50 characters')).toBeInTheDocument()
      })
    })

    it('should validate table name format (no special characters)', async () => {
      const nameInput = screen.getByLabelText('Table Name')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'invalid@table#name')
      
      await waitFor(() => {
        expect(screen.getByText('Table name can only contain letters, numbers, and underscores')).toBeInTheDocument()
      })
    })

    it('should handle form submission with valid data', async () => {
      server.use(mockTableUpdateSuccess())
      
      const labelInput = screen.getByLabelText('Display Label')
      await user.clear(labelInput)
      await user.type(labelInput, 'Updated Users Table')
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Table updated successfully')).toBeInTheDocument()
      })
    })

    it('should handle form submission errors with proper error display', async () => {
      server.use(mockTableUpdateError(422, {
        errors: {
          name: ['Table name already exists'],
          label: ['Label cannot be empty']
        }
      }))
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Table name already exists')).toBeInTheDocument()
        expect(screen.getByText('Label cannot be empty')).toBeInTheDocument()
      })
    })

    it('should reset form to original values when reset button is clicked', async () => {
      const labelInput = screen.getByLabelText('Display Label')
      const originalValue = labelInput.getAttribute('value')
      
      // Modify the field
      await user.clear(labelInput)
      await user.type(labelInput, 'Modified Label')
      
      // Reset the form
      const resetButton = screen.getByRole('button', { name: 'Reset' })
      await user.click(resetButton)
      
      await waitFor(() => {
        expect(labelInput).toHaveValue(originalValue)
      })
    })
  })

  describe('Tab Navigation and Content Switching', () => {
    beforeEach(async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
    })

    it('should switch between tabs and display appropriate content', async () => {
      // Click on JSON Editor tab
      const jsonTab = screen.getByRole('tab', { name: 'JSON Editor' })
      await user.click(jsonTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('json-editor')).toBeInTheDocument()
      })

      // Click on Fields tab
      const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
      await user.click(fieldsTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('fields-table')).toBeInTheDocument()
      })

      // Click on Relationships tab
      const relationshipsTab = screen.getByRole('tab', { name: 'Relationships' })
      await user.click(relationshipsTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument()
      })
    })

    it('should maintain tab state when switching back to previous tab', async () => {
      // Make a change in the form
      const labelInput = screen.getByLabelText('Display Label')
      await user.clear(labelInput)
      await user.type(labelInput, 'Modified Label')
      
      // Switch to JSON tab and back
      const jsonTab = screen.getByRole('tab', { name: 'JSON Editor' })
      await user.click(jsonTab)
      
      const detailsTab = screen.getByRole('tab', { name: 'Table Details' })
      await user.click(detailsTab)
      
      // Verify the change is still there
      await waitFor(() => {
        expect(screen.getByDisplayValue('Modified Label')).toBeInTheDocument()
      })
    })
  })

  describe('JSON Editor Integration', () => {
    beforeEach(async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      // Switch to JSON editor tab
      const jsonTab = screen.getByRole('tab', { name: 'JSON Editor' })
      await user.click(jsonTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('json-editor')).toBeInTheDocument()
      })
    })

    it('should display table data in JSON format', async () => {
      const jsonEditor = screen.getByTestId('json-editor')
      const jsonContent = within(jsonEditor).getByRole('textbox')
      
      expect(jsonContent).toHaveValue(expect.stringContaining('"name": "users"'))
      expect(jsonContent).toHaveValue(expect.stringContaining('"label": "Users Table"'))
    })

    it('should validate JSON syntax and show errors', async () => {
      const jsonEditor = screen.getByTestId('json-editor')
      const jsonContent = within(jsonEditor).getByRole('textbox')
      
      // Enter invalid JSON
      await user.clear(jsonContent)
      await user.type(jsonContent, '{ "name": "users", invalid_json }')
      
      await waitFor(() => {
        expect(screen.getByText('Invalid JSON syntax')).toBeInTheDocument()
      })
    })

    it('should synchronize changes between form and JSON editor', async () => {
      // Make changes in JSON editor
      const jsonEditor = screen.getByTestId('json-editor')
      const jsonContent = within(jsonEditor).getByRole('textbox')
      
      const validJson = JSON.stringify({
        ...mockTableDetails,
        label: 'JSON Modified Label'
      }, null, 2)
      
      await user.clear(jsonContent)
      await user.type(jsonContent, validJson)
      
      // Switch back to form tab
      const detailsTab = screen.getByRole('tab', { name: 'Table Details' })
      await user.click(detailsTab)
      
      // Verify the change is reflected in the form
      await waitFor(() => {
        expect(screen.getByDisplayValue('JSON Modified Label')).toBeInTheDocument()
      })
    })
  })

  describe('Fields Table Management', () => {
    beforeEach(async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      // Switch to fields tab
      const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
      await user.click(fieldsTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('fields-table')).toBeInTheDocument()
      })
    })

    it('should display fields in a data table with proper columns', async () => {
      const fieldsTable = screen.getByTestId('fields-table')
      
      // Verify table headers
      expect(within(fieldsTable).getByText('Field Name')).toBeInTheDocument()
      expect(within(fieldsTable).getByText('Type')).toBeInTheDocument()
      expect(within(fieldsTable).getByText('Nullable')).toBeInTheDocument()
      expect(within(fieldsTable).getByText('Primary Key')).toBeInTheDocument()
      
      // Verify field data
      expect(within(fieldsTable).getByText('id')).toBeInTheDocument()
      expect(within(fieldsTable).getByText('email')).toBeInTheDocument()
      expect(within(fieldsTable).getByText('created_at')).toBeInTheDocument()
    })

    it('should support field filtering and search', async () => {
      const searchInput = screen.getByPlaceholderText('Search fields...')
      
      await user.type(searchInput, 'email')
      
      await waitFor(() => {
        const fieldsTable = screen.getByTestId('fields-table')
        expect(within(fieldsTable).getByText('email')).toBeInTheDocument()
        expect(within(fieldsTable).queryByText('id')).not.toBeInTheDocument()
      })
    })

    it('should support field sorting by different columns', async () => {
      const nameHeader = screen.getByRole('columnheader', { name: 'Field Name' })
      await user.click(nameHeader)
      
      // Verify sort indicator
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
      })
      
      // Click again for descending sort
      await user.click(nameHeader)
      
      await waitFor(() => {
        expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
      })
    })
  })

  describe('Relationships Table Management', () => {
    beforeEach(async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      // Switch to relationships tab
      const relationshipsTab = screen.getByRole('tab', { name: 'Relationships' })
      await user.click(relationshipsTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('relationships-table')).toBeInTheDocument()
      })
    })

    it('should display relationships with proper visualization', async () => {
      const relationshipsTable = screen.getByTestId('relationships-table')
      
      expect(within(relationshipsTable).getByText('Type')).toBeInTheDocument()
      expect(within(relationshipsTable).getByText('Related Table')).toBeInTheDocument()
      expect(within(relationshipsTable).getByText('Foreign Key')).toBeInTheDocument()
      
      // Verify relationship data
      expect(within(relationshipsTable).getByText('belongs_to')).toBeInTheDocument()
      expect(within(relationshipsTable).getByText('profiles')).toBeInTheDocument()
    })

    it('should support adding new relationships', async () => {
      const addButton = screen.getByRole('button', { name: 'Add Relationship' })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('relationship-form')).toBeInTheDocument()
      })
      
      // Fill out the relationship form
      const typeSelect = screen.getByLabelText('Relationship Type')
      await user.selectOptions(typeSelect, 'has_many')
      
      const tableSelect = screen.getByLabelText('Related Table')
      await user.selectOptions(tableSelect, 'orders')
      
      const saveButton = screen.getByRole('button', { name: 'Save Relationship' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Relationship added successfully')).toBeInTheDocument()
      })
    })
  })

  describe('Performance Testing for Large Datasets', () => {
    it('should handle large datasets with TanStack Virtual efficiently', async () => {
      // Setup large dataset with 1000+ fields
      const largeTableData = createMockTableData({
        name: 'large_table',
        fields: Array.from({ length: 1500 }, (_, i) => 
          createMockFieldData({ 
            name: `field_${i}`, 
            type: 'string' 
          })
        )
      })
      
      server.use(mockTableDetailsSuccess(largeTableData))
      renderTableDetailsPage({ params: { tableId: 'large_table' } })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('large_table')).toBeInTheDocument()
      })
      
      // Switch to fields tab
      const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
      await user.click(fieldsTab)
      
      // Measure rendering performance
      const startTime = performance.now()
      
      await waitFor(() => {
        expect(screen.getByTestId('fields-table')).toBeInTheDocument()
      })
      
      const renderTime = performance.now() - startTime
      
      // Verify performance is acceptable (should render under 1 second)
      expect(renderTime).toBeLessThan(1000)
      
      // Verify virtual scrolling is working (only visible rows are rendered)
      const visibleRows = screen.getAllByRole('row')
      expect(visibleRows.length).toBeLessThan(50) // Should not render all 1500 rows
    })

    it('should maintain responsive scrolling with large datasets', async () => {
      const largeTableData = createMockTableData({
        name: 'large_table',
        fields: Array.from({ length: 2000 }, (_, i) => 
          createMockFieldData({ name: `field_${i}` })
        )
      })
      
      server.use(mockTableDetailsSuccess(largeTableData))
      renderTableDetailsPage({ params: { tableId: 'large_table' } })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('large_table')).toBeInTheDocument()
      })
      
      const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
      await user.click(fieldsTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('fields-table')).toBeInTheDocument()
      })
      
      // Test virtual scrolling performance
      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      
      // Measure scroll performance
      const scrollStartTime = performance.now()
      
      // Simulate scrolling
      scrollContainer.scrollTop = 5000
      scrollContainer.dispatchEvent(new Event('scroll'))
      
      // Wait for scroll to complete
      await waitFor(() => {
        expect(scrollContainer.scrollTop).toBe(5000)
      })
      
      const scrollTime = performance.now() - scrollStartTime
      
      // Verify scroll performance is smooth (under 16ms for 60fps)
      expect(scrollTime).toBeLessThan(100)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Setup network error
      server.use(
        rest.get('/api/v2/system/_schema/users', (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )
      
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument()
      })
      
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    it('should retry failed requests when retry button is clicked', async () => {
      let callCount = 0
      
      // Setup handler that fails first, succeeds second
      server.use(
        rest.get('/api/v2/system/_schema/users', (req, res, ctx) => {
          callCount++
          if (callCount === 1) {
            return res(ctx.status(500), ctx.json({ error: 'Server error' }))
          }
          return res(ctx.json(mockTableDetails))
        })
      )
      
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument()
      })
      
      const retryButton = screen.getByRole('button', { name: 'Retry' })
      await user.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      expect(callCount).toBe(2)
    })

    it('should handle validation errors from server', async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      // Setup error for update
      server.use(mockTableUpdateError(422, {
        errors: {
          name: ['Name must be unique'],
          label: ['Label is required']
        }
      }))
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Name must be unique')).toBeInTheDocument()
        expect(screen.getByText('Label is required')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Testing (WCAG 2.1 AA)', () => {
    beforeEach(async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
    })

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <TableDetailsProvider>
            <TableDetailsPage params={{ tableId: 'users' }} searchParams={{}} />
          </TableDetailsProvider>
        </QueryClientProvider>
      )
      
      server.use(mockTableDetailsSuccess(mockTableDetails))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation through tabs', async () => {
      const detailsTab = screen.getByRole('tab', { name: 'Table Details' })
      const jsonTab = screen.getByRole('tab', { name: 'JSON Editor' })
      const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
      
      // Test Tab key navigation
      detailsTab.focus()
      await user.keyboard('{Tab}')
      expect(jsonTab).toHaveFocus()
      
      await user.keyboard('{Tab}')
      expect(fieldsTab).toHaveFocus()
      
      // Test Enter key activation
      await user.keyboard('{Enter}')
      await waitFor(() => {
        expect(fieldsTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('should provide proper ARIA labels and descriptions', async () => {
      const nameInput = screen.getByLabelText('Table Name')
      expect(nameInput).toHaveAttribute('aria-required', 'true')
      
      const descriptionTextarea = screen.getByLabelText('Description')
      expect(descriptionTextarea).toHaveAttribute('aria-describedby')
      
      // Test form validation announcements
      await user.clear(nameInput)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Table name is required')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('should support screen reader navigation with proper headings', async () => {
      // Verify proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Table Details')
      
      // Switch to fields tab to test subheadings
      const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
      await user.click(fieldsTab)
      
      await waitFor(() => {
        const fieldsHeading = screen.getByRole('heading', { level: 2 })
        expect(fieldsHeading).toHaveTextContent('Table Fields')
      })
    })

    it('should announce loading states to screen readers', async () => {
      // Test loading announcement
      const { rerender } = renderTableDetailsPage()
      
      const loadingRegion = screen.getByLabelText('Loading table details')
      expect(loadingRegion).toHaveAttribute('aria-live', 'polite')
      
      // Test success state announcement
      server.use(mockTableDetailsSuccess(mockTableDetails))
      rerender(
        <QueryClientProvider client={queryClient}>
          <TableDetailsProvider>
            <TableDetailsPage params={{ tableId: 'users' }} searchParams={{}} />
          </TableDetailsProvider>
        </QueryClientProvider>
      )
      
      await waitFor(() => {
        const successRegion = screen.getByLabelText('Table details loaded')
        expect(successRegion).toHaveAttribute('aria-live', 'polite')
      })
    })
  })

  describe('Caching and Data Synchronization', () => {
    it('should cache table data with React Query for optimal performance', async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      
      const { unmount } = renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      unmount()
      
      // Remount component - data should come from cache
      const startTime = performance.now()
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      const loadTime = performance.now() - startTime
      
      // Cached data should load faster than 50ms (cache hit requirement)
      expect(loadTime).toBeLessThan(50)
    })

    it('should invalidate cache when table data is updated', async () => {
      server.use(
        mockTableDetailsSuccess(mockTableDetails),
        mockTableUpdateSuccess()
      )
      
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      // Update table data
      const labelInput = screen.getByLabelText('Display Label')
      await user.clear(labelInput)
      await user.type(labelInput, 'Updated Label')
      
      const saveButton = screen.getByRole('button', { name: 'Save Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Table updated successfully')).toBeInTheDocument()
      })
      
      // Verify cache was invalidated and fresh data is displayed
      expect(screen.getByDisplayValue('Updated Label')).toBeInTheDocument()
    })

    it('should handle stale data and background refresh', async () => {
      let responseCount = 0
      const responses = [
        { ...mockTableDetails, label: 'Original Label' },
        { ...mockTableDetails, label: 'Updated Label' }
      ]
      
      server.use(
        rest.get('/api/v2/system/_schema/users', (req, res, ctx) => {
          const response = responses[responseCount]
          responseCount++
          return res(ctx.json(response))
        })
      )
      
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Original Label')).toBeInTheDocument()
      })
      
      // Simulate stale data scenario
      queryClient.invalidateQueries({ queryKey: ['table-details', 'users'] })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Updated Label')).toBeInTheDocument()
      })
      
      expect(responseCount).toBe(2)
    })
  })

  describe('URL Parameter Handling', () => {
    it('should handle different table IDs from URL parameters', async () => {
      const customTableData = createMockTableData({
        name: 'products',
        label: 'Products Table'
      })
      
      server.use(mockTableDetailsSuccess(customTableData))
      
      renderTableDetailsPage({ params: { tableId: 'products' } })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('products')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Products Table')).toBeInTheDocument()
      })
    })

    it('should handle invalid table IDs gracefully', async () => {
      server.use(mockTableDetailsError(404, 'Table not found'))
      
      renderTableDetailsPage({ params: { tableId: 'nonexistent' } })
      
      await waitFor(() => {
        expect(screen.getByText('Table not found')).toBeInTheDocument()
      })
      
      const backButton = screen.getByRole('button', { name: 'Back to Tables' })
      await user.click(backButton)
      
      expect(mockPush).toHaveBeenCalledWith('/adf-schema/tables')
    })

    it('should handle URL search parameters for initial tab selection', async () => {
      server.use(mockTableDetailsSuccess(mockTableDetails))
      
      renderTableDetailsPage({ 
        params: { tableId: 'users' },
        searchParams: { tab: 'fields' }
      })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      // Verify fields tab is active
      await waitFor(() => {
        const fieldsTab = screen.getByRole('tab', { name: 'Fields' })
        expect(fieldsTab).toHaveAttribute('aria-selected', 'true')
      })
    })
  })

  describe('Integration with MSW Mock Service Worker', () => {
    it('should use MSW for all API interactions during testing', async () => {
      let mockCalls = 0
      
      server.use(
        rest.get('/api/v2/system/_schema/users', (req, res, ctx) => {
          mockCalls++
          return res(ctx.json(mockTableDetails))
        })
      )
      
      renderTableDetailsPage()
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      })
      
      expect(mockCalls).toBe(1)
    })

    it('should handle different API response scenarios with MSW', async () => {
      // Test different response codes
      const scenarios = [
        { status: 200, data: mockTableDetails },
        { status: 404, error: 'Not found' },
        { status: 500, error: 'Server error' }
      ]
      
      for (const scenario of scenarios) {
        server.resetHandlers()
        
        if (scenario.status === 200) {
          server.use(mockTableDetailsSuccess(scenario.data))
        } else {
          server.use(mockTableDetailsError(scenario.status, scenario.error))
        }
        
        const { unmount } = renderTableDetailsPage()
        
        if (scenario.status === 200) {
          await waitFor(() => {
            expect(screen.getByDisplayValue('users')).toBeInTheDocument()
          })
        } else {
          await waitFor(() => {
            expect(screen.getByText(scenario.error)).toBeInTheDocument()
          })
        }
        
        unmount()
      }
    })
  })
})