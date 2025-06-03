/**
 * Comprehensive test suite for Table Details Page component
 * 
 * Tests the React 19/Next.js 15.1+ table details page functionality including:
 * - Form validation with React Hook Form and Zod schemas
 * - Data fetching with TanStack React Query
 * - User interactions and accessibility
 * - Performance testing for large datasets
 * - MSW integration for realistic API mocking
 * 
 * Migration Note: Replaces Angular Jasmine/Karma tests with Vitest + Testing Library
 * achieving 10x faster test execution as per Section 0.2.4 dependency decisions
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextRouter } from 'next/router'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Component imports (will be created)
import TableDetailsPage from './page'
import { TableDetailsProvider } from './types'
import { useTableDetails, useTableFields, useTableRelationships } from './hooks'

// Test utilities and mocks
import { 
  renderWithProviders, 
  createMockTable,
  createMockField,
  createMockRelationship,
  createMockSchemaResponse,
  waitForLoadingToFinish 
} from '@/test/utils/test-utils'
import { 
  createMockQueryClient,
  mockSuccessfulQuery,
  mockFailedQuery,
  mockMutationSuccess,
  mockMutationError 
} from '@/test/utils/query-test-helpers'
import { 
  mockFormValidation,
  fillFormField,
  submitForm,
  expectFormError 
} from '@/test/utils/form-test-helpers'
import { 
  testKeyboardNavigation,
  testScreenReaderAnnouncements,
  testFocusManagement 
} from '@/test/utils/accessibility-helpers'
import { 
  measureRenderTime,
  measureMemoryUsage,
  testVirtualizationPerformance 
} from '@/test/utils/performance-helpers'

// Mock Next.js router
const mockRouter: Partial<NextRouter> = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  query: { tableId: 'users', service: 'mysql_service' },
  pathname: '/adf-schema/tables/[tableId]',
  isReady: true
}

vi.mock('next/router', () => ({
  useRouter: () => mockRouter
}))

// Mock data setup
const mockTableData = createMockTable({
  name: 'users',
  label: 'Users Table',
  description: 'System users and authentication data',
  fieldCount: 1250, // Large dataset for performance testing
  isView: false,
  isSystem: false
})

const mockFieldsData = Array.from({ length: 1250 }, (_, index) => 
  createMockField({
    name: `field_${index}`,
    type: index % 3 === 0 ? 'varchar' : index % 3 === 1 ? 'integer' : 'datetime',
    required: index % 5 === 0,
    primaryKey: index === 0,
    foreignKey: index % 10 === 0 && index > 0
  })
)

const mockRelationshipsData = Array.from({ length: 25 }, (_, index) =>
  createMockRelationship({
    type: 'belongsTo',
    refTable: `ref_table_${index}`,
    field: `field_${index * 10}`,
    refField: 'id'
  })
)

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

describe('TableDetailsPage', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Setup MSW server for realistic API mocking
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    // Create fresh query client for each test to avoid state pollution
    queryClient = createMockQueryClient()
    user = userEvent.setup()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default successful API responses
    server.use(
      http.get('/api/v2/mysql_service/_schema/users', () => {
        return HttpResponse.json(createMockSchemaResponse({
          table: mockTableData,
          fields: mockFieldsData.slice(0, 50), // Initial load for virtualization
          relationships: mockRelationshipsData
        }))
      }),
      
      http.get('/api/v2/mysql_service/_schema/users/_field', ({ request }) => {
        const url = new URL(request.url)
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        
        return HttpResponse.json({
          resource: mockFieldsData.slice(offset, offset + limit),
          meta: {
            count: mockFieldsData.length,
            offset,
            limit
          }
        })
      }),
      
      http.put('/api/v2/mysql_service/_schema/users', () => {
        return HttpResponse.json({ success: true })
      })
    )
  })

  afterEach(() => {
    server.resetHandlers()
    queryClient.clear()
  })

  describe('Component Rendering', () => {
    it('renders table details with loading state initially', async () => {
      // Test initial loading state while data is being fetched
      render(
        <TableDetailsProvider tableId="users" serviceId="mysql_service">
          <TableDetailsPage />
        </TableDetailsProvider>,
        { 
          wrapper: ({ children }) => (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          )
        }
      )

      // Verify loading indicators are shown
      expect(screen.getByTestId('table-details-skeleton')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading table details')).toBeInTheDocument()

      // Wait for data to load and verify content
      await waitForLoadingToFinish()
      
      expect(screen.getByRole('heading', { name: /users table/i })).toBeInTheDocument()
      expect(screen.getByText('System users and authentication data')).toBeInTheDocument()
      expect(screen.getByText('1,250 fields')).toBeInTheDocument()
    })

    it('displays table metadata and configuration options', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Verify table metadata sections
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /fields/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /relationships/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /indexes/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /permissions/i })).toBeInTheDocument()

      // Verify configuration options are available
      expect(screen.getByRole('button', { name: /edit table/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add field/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export schema/i })).toBeInTheDocument()
    })

    it('handles table not found scenario gracefully', async () => {
      // Mock 404 response for non-existent table
      server.use(
        http.get('/api/v2/mysql_service/_schema/nonexistent', () => {
          return new HttpResponse(null, { 
            status: 404,
            statusText: 'Table not found'
          })
        })
      )

      const nonExistentRouter = {
        ...mockRouter,
        query: { tableId: 'nonexistent', service: 'mysql_service' }
      }

      renderWithProviders(<TableDetailsPage />, {
        router: nonExistentRouter,
        queryClient
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/table not found/i)).toBeInTheDocument()
      })

      // Verify error recovery options
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation and Editing', () => {
    it('validates table name changes with Zod schema', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Click edit button to enter edit mode
      await user.click(screen.getByRole('button', { name: /edit table/i }))

      // Test invalid table name validation
      const nameInput = screen.getByLabelText(/table name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'invalid name with spaces')

      await waitFor(() => {
        expect(screen.getByText(/table name must contain only alphanumeric characters/i)).toBeInTheDocument()
      })

      // Test valid table name
      await user.clear(nameInput)
      await user.type(nameInput, 'valid_table_name')

      await waitFor(() => {
        expect(screen.queryByText(/table name must contain only/i)).not.toBeInTheDocument()
      })
    })

    it('submits table updates with optimistic UI updates', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Enter edit mode
      await user.click(screen.getByRole('button', { name: /edit table/i }))

      // Update description
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Updated table description')

      // Submit form
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      // Verify optimistic update shows immediately
      expect(screen.getByText('Updated table description')).toBeInTheDocument()
      expect(screen.getByText(/saving changes/i)).toBeInTheDocument()

      // Wait for actual update to complete
      await waitFor(() => {
        expect(screen.getByText(/changes saved successfully/i)).toBeInTheDocument()
      })
    })

    it('handles form submission errors gracefully', async () => {
      // Mock server error for table updates
      server.use(
        http.put('/api/v2/mysql_service/_schema/users', () => {
          return new HttpResponse(null, { 
            status: 422,
            statusText: 'Validation Error'
          })
        })
      )

      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Attempt to save changes
      await user.click(screen.getByRole('button', { name: /edit table/i }))
      await user.type(screen.getByLabelText(/description/i), 'New description')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to save changes/i)).toBeInTheDocument()
      })

      // Verify form remains in edit mode for correction
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })
  })

  describe('Fields Management with Virtualization', () => {
    it('renders large field list using TanStack Virtual', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Navigate to fields tab
      await user.click(screen.getByRole('tab', { name: /fields/i }))

      // Verify virtualized list is rendered
      const fieldsList = screen.getByTestId('virtualized-fields-list')
      expect(fieldsList).toBeInTheDocument()

      // Verify only visible items are rendered (performance optimization)
      const renderedFields = within(fieldsList).getAllByTestId(/field-row-/)
      expect(renderedFields).toHaveLength(50) // Initial viewport items

      // Verify field count indicator
      expect(screen.getByText('Showing 50 of 1,250 fields')).toBeInTheDocument()
    })

    it('supports infinite scrolling for large field datasets', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()
      await user.click(screen.getByRole('tab', { name: /fields/i }))

      const fieldsList = screen.getByTestId('virtualized-fields-list')
      
      // Scroll to trigger loading more fields
      fireEvent.scroll(fieldsList, { target: { scrollTop: 2000 } })

      // Wait for additional fields to load
      await waitFor(() => {
        expect(screen.getByText('Loading more fields...')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Showing 100 of 1,250 fields')).toBeInTheDocument()
      })
    })

    it('filters and searches fields efficiently', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()
      await user.click(screen.getByRole('tab', { name: /fields/i }))

      // Test field search functionality
      const searchInput = screen.getByPlaceholderText(/search fields/i)
      await user.type(searchInput, 'field_1')

      // Verify filtered results
      await waitFor(() => {
        const filteredFields = screen.getAllByTestId(/field-row-/)
        expect(filteredFields.length).toBeLessThan(50)
        filteredFields.forEach(field => {
          expect(field).toHaveTextContent(/field_1/)
        })
      })

      // Test field type filter
      const typeFilter = screen.getByLabelText(/filter by type/i)
      await user.selectOptions(typeFilter, 'varchar')

      await waitFor(() => {
        const filteredFields = screen.getAllByTestId(/field-row-/)
        filteredFields.forEach(field => {
          expect(field).toHaveTextContent(/varchar/i)
        })
      })
    })
  })

  describe('Data Fetching and Caching', () => {
    it('implements intelligent caching with React Query', async () => {
      const queryKey = ['table-details', 'mysql_service', 'users']
      
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Verify data is cached
      const cachedData = queryClient.getQueryData(queryKey)
      expect(cachedData).toBeDefined()

      // Navigate away and back to verify cache hit
      mockRouter.push = vi.fn()
      await user.click(screen.getByRole('button', { name: /back to schema/i }))

      // Re-render component - should use cached data
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      // Verify immediate render from cache (no loading state)
      expect(screen.queryByTestId('table-details-skeleton')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /users table/i })).toBeInTheDocument()
    })

    it('handles background refresh and stale-while-revalidate', async () => {
      const { rerender } = renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Simulate stale data scenario
      vi.advanceTimersByTime(300000) // 5 minutes = stale time

      // Mock updated data response
      const updatedTableData = { ...mockTableData, description: 'Updated description in background' }
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', () => {
          return HttpResponse.json(createMockSchemaResponse({
            table: updatedTableData,
            fields: mockFieldsData.slice(0, 50),
            relationships: mockRelationshipsData
          }))
        })
      )

      // Re-render should trigger background refresh
      rerender(<TableDetailsPage />)

      // Verify stale data is shown immediately
      expect(screen.getByText('System users and authentication data')).toBeInTheDocument()

      // Wait for background update
      await waitFor(() => {
        expect(screen.getByText('Updated description in background')).toBeInTheDocument()
      })
    })

    it('handles network errors with retry mechanisms', async () => {
      // Mock network failure
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', () => {
          return new HttpResponse(null, { 
            status: 500,
            statusText: 'Internal Server Error'
          })
        })
      )

      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      // Verify error state
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to load table details/i)).toBeInTheDocument()
      })

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i })
      expect(retryButton).toBeInTheDocument()

      // Mock successful retry response
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', () => {
          return HttpResponse.json(createMockSchemaResponse({
            table: mockTableData,
            fields: mockFieldsData.slice(0, 50),
            relationships: mockRelationshipsData
          }))
        })
      )

      await user.click(retryButton)

      // Verify successful retry
      await waitForLoadingToFinish()
      expect(screen.getByRole('heading', { name: /users table/i })).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('supports tab navigation between sections', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Test tab navigation
      const fieldsTab = screen.getByRole('tab', { name: /fields/i })
      await user.click(fieldsTab)

      expect(fieldsTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('virtualized-fields-list')).toBeInTheDocument()

      // Navigate to relationships tab
      const relationshipsTab = screen.getByRole('tab', { name: /relationships/i })
      await user.click(relationshipsTab)

      expect(relationshipsTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByTestId('relationships-diagram')).toBeInTheDocument()
    })

    it('provides field editing modal functionality', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()
      await user.click(screen.getByRole('tab', { name: /fields/i }))

      // Click on a field to edit
      const firstField = screen.getAllByTestId(/field-row-/)[0]
      const editButton = within(firstField).getByRole('button', { name: /edit field/i })
      await user.click(editButton)

      // Verify modal opens
      const modal = screen.getByRole('dialog', { name: /edit field/i })
      expect(modal).toBeInTheDocument()

      // Test field editing form
      const fieldNameInput = within(modal).getByLabelText(/field name/i)
      await user.clear(fieldNameInput)
      await user.type(fieldNameInput, 'updated_field_name')

      // Save changes
      const saveButton = within(modal).getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify modal closes and changes are reflected
      await waitFor(() => {
        expect(modal).not.toBeInTheDocument()
      })
    })

    it('supports bulk field operations', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()
      await user.click(screen.getByRole('tab', { name: /fields/i }))

      // Select multiple fields
      const fieldCheckboxes = screen.getAllByRole('checkbox', { name: /select field/i })
      await user.click(fieldCheckboxes[0])
      await user.click(fieldCheckboxes[1])
      await user.click(fieldCheckboxes[2])

      // Verify bulk actions become available
      expect(screen.getByRole('button', { name: /delete selected fields/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export selected fields/i })).toBeInTheDocument()

      // Test bulk delete operation
      await user.click(screen.getByRole('button', { name: /delete selected fields/i }))

      // Verify confirmation dialog
      const confirmDialog = screen.getByRole('dialog', { name: /confirm deletion/i })
      expect(confirmDialog).toBeInTheDocument()
      expect(within(confirmDialog).getByText(/delete 3 selected fields/i)).toBeInTheDocument()
    })
  })

  describe('Performance Testing', () => {
    it('renders large datasets efficiently with virtualization', async () => {
      const { renderTime, memoryUsage } = await measureRenderTime(async () => {
        renderWithProviders(<TableDetailsPage />, {
          router: mockRouter,
          queryClient
        })

        await waitForLoadingToFinish()
        await user.click(screen.getByRole('tab', { name: /fields/i }))
      })

      // Verify performance targets are met
      expect(renderTime).toBeLessThan(2000) // Under 2 seconds as per Section 0.1.1
      expect(memoryUsage).toBeLessThan(50 * 1024 * 1024) // Under 50MB for large datasets

      // Test virtualization performance
      const virtualizationMetrics = await testVirtualizationPerformance(
        screen.getByTestId('virtualized-fields-list'),
        1250 // Total items
      )

      expect(virtualizationMetrics.visibleItems).toBeLessThanOrEqual(50)
      expect(virtualizationMetrics.scrollPerformance).toBeLessThan(16) // 60fps target
    })

    it('maintains responsive interactions under load', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()
      await user.click(screen.getByRole('tab', { name: /fields/i }))

      // Test rapid scrolling performance
      const fieldsList = screen.getByTestId('virtualized-fields-list')
      const startTime = performance.now()

      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(fieldsList, { target: { scrollTop: i * 500 } })
        await new Promise(resolve => setTimeout(resolve, 16)) // 60fps
      }

      const endTime = performance.now()
      const scrollDuration = endTime - startTime

      // Verify scrolling remains smooth
      expect(scrollDuration).toBeLessThan(500) // Should complete quickly
    })
  })

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA standards', async () => {
      const { container } = renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Run axe accessibility audit
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports keyboard navigation patterns', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Test tab navigation
      await testKeyboardNavigation({
        startElement: screen.getByRole('tab', { name: /overview/i }),
        expectedElements: [
          screen.getByRole('tab', { name: /fields/i }),
          screen.getByRole('tab', { name: /relationships/i }),
          screen.getByRole('tab', { name: /indexes/i }),
          screen.getByRole('tab', { name: /permissions/i })
        ]
      })

      // Test action button accessibility
      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /edit table/i })).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(screen.getByRole('form', { name: /edit table/i })).toBeInTheDocument()
    })

    it('provides proper screen reader announcements', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Test loading announcements
      await testScreenReaderAnnouncements([
        { trigger: 'component mount', expectedText: 'Table details loaded successfully' },
        { trigger: 'tab navigation', expectedText: 'Navigated to fields section' },
        { trigger: 'form submission', expectedText: 'Changes saved successfully' }
      ])
    })

    it('maintains focus management in interactive elements', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Test focus management in modal dialogs
      await user.click(screen.getByRole('button', { name: /edit table/i }))

      await testFocusManagement({
        modal: screen.getByRole('dialog', { name: /edit table/i }),
        expectedFocusElement: screen.getByLabelText(/table name/i),
        trapFocus: true
      })
    })
  })

  describe('Error Handling', () => {
    it('displays contextual error messages for different failure scenarios', async () => {
      // Test network timeout
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', async () => {
          await new Promise(resolve => setTimeout(resolve, 10000)) // Simulate timeout
          return new HttpResponse(null, { status: 408 })
        })
      )

      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })

      // Test permissions error
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', () => {
          return new HttpResponse(null, { 
            status: 403,
            statusText: 'Forbidden'
          })
        })
      )

      await user.click(screen.getByRole('button', { name: /retry/i }))

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /contact administrator/i })).toBeInTheDocument()
      })
    })

    it('handles malformed data gracefully', async () => {
      // Mock malformed response
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', () => {
          return HttpResponse.json({ invalid: 'data structure' })
        })
      )

      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/invalid data format/i)).toBeInTheDocument()
      })

      // Verify fallback UI is displayed
      expect(screen.getByText(/unable to display table details/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
    })
  })

  describe('Integration Testing', () => {
    it('integrates properly with Next.js router for navigation', async () => {
      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Test navigation to related tables
      await user.click(screen.getByRole('tab', { name: /relationships/i }))
      
      const relationshipLink = screen.getByRole('link', { name: /ref_table_0/i })
      await user.click(relationshipLink)

      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/tables/ref_table_0?service=mysql_service')
    })

    it('preserves query parameters across navigation', async () => {
      const routerWithParams = {
        ...mockRouter,
        query: { 
          tableId: 'users', 
          service: 'mysql_service',
          tab: 'fields',
          filter: 'primary_keys'
        }
      }

      renderWithProviders(<TableDetailsPage />, {
        router: routerWithParams,
        queryClient
      })

      await waitForLoadingToFinish()

      // Verify query parameters are applied
      expect(screen.getByRole('tab', { name: /fields/i })).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByDisplayValue('primary_keys')).toBeInTheDocument()
    })
  })

  describe('MSW Integration Testing', () => {
    it('uses realistic mock responses for development workflow', async () => {
      // Verify MSW is intercepting requests
      let requestIntercepted = false
      
      server.use(
        http.get('/api/v2/mysql_service/_schema/users', ({ request }) => {
          requestIntercepted = true
          expect(request.headers.get('content-type')).toContain('application/json')
          return HttpResponse.json(createMockSchemaResponse({
            table: mockTableData,
            fields: mockFieldsData.slice(0, 50),
            relationships: mockRelationshipsData
          }))
        })
      )

      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      expect(requestIntercepted).toBe(true)
      expect(screen.getByRole('heading', { name: /users table/i })).toBeInTheDocument()
    })

    it('handles MSW request/response transformation correctly', async () => {
      // Test camelCase to snake_case transformation
      server.use(
        http.put('/api/v2/mysql_service/_schema/users', async ({ request }) => {
          const body = await request.json()
          expect(body).toHaveProperty('table_name') // snake_case
          expect(body).not.toHaveProperty('tableName') // camelCase should be transformed
          
          return HttpResponse.json({ success: true })
        })
      )

      renderWithProviders(<TableDetailsPage />, {
        router: mockRouter,
        queryClient
      })

      await waitForLoadingToFinish()

      // Submit form with camelCase data
      await user.click(screen.getByRole('button', { name: /edit table/i }))
      await user.type(screen.getByLabelText(/table name/i), 'new_table_name')
      await user.click(screen.getByRole('button', { name: /save changes/i }))

      await waitFor(() => {
        expect(screen.getByText(/changes saved successfully/i)).toBeInTheDocument()
      })
    })
  })
})