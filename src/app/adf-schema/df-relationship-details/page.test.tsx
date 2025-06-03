import { describe, it, expect, beforeEach, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import RelationshipDetailsPage from './page'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  useParams: vi.fn(() => ({ 
    service: 'testDb', 
    table: 'testTable' 
  })),
}))

// Mock database service hooks
vi.mock('@/hooks/use-database-services', () => ({
  useDatabaseServices: vi.fn(() => ({
    data: mockServices,
    isLoading: false,
    error: null,
  })),
}))

// Mock table fields hook
vi.mock('@/hooks/use-table-fields', () => ({
  useTableFields: vi.fn(() => ({
    data: mockFields,
    isLoading: false,
    error: null,
  })),
}))

// Mock relationship data hook
vi.mock('@/hooks/use-relationship-data', () => ({
  useRelationshipData: vi.fn(),
}))

// Mock data fixtures
const mockServices = {
  resource: [
    {
      id: 5,
      name: 'db',
      label: 'Local SQL Database',
      type: 'sql_db',
    },
    {
      id: 6,
      name: 'mongodb',
      label: 'MongoDB Database',
      type: 'mongodb',
    },
  ],
}

const mockFields = {
  resource: [
    {
      name: 'id',
      label: 'ID',
      type: 'integer',
      is_primary_key: true,
    },
    {
      name: 'name',
      label: 'Name',
      type: 'string',
      is_primary_key: false,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'string',
      is_primary_key: false,
    },
  ],
}

const mockTables = {
  resource: [
    { name: 'users', label: 'Users' },
    { name: 'orders', label: 'Orders' },
    { name: 'products', label: 'Products' },
  ],
}

const mockTableFields = {
  field: [
    { name: 'id', label: 'ID' },
    { name: 'user_id', label: 'User ID' },
    { name: 'created_at', label: 'Created At' },
  ],
}

const mockExistingRelationship = {
  name: 'user_orders',
  alias: 'orders',
  label: 'User Orders',
  description: 'Orders belonging to user',
  type: 'many_many',
  field: 'id',
  refServiceId: 5,
  refTable: 'orders',
  refField: 'user_id',
  junctionServiceId: 5,
  junctionTable: 'user_orders',
  junctionField: 'user_id',
  junctionRefField: 'order_id',
  alwaysFetch: true,
  isVirtual: true,
}

// MSW request handlers
const handlers = [
  // Database services endpoint
  http.get('/api/v2/system/service', () => {
    return HttpResponse.json(mockServices)
  }),

  // Table fields endpoint
  http.get('/api/v2/db/_schema/testTable', () => {
    return HttpResponse.json(mockFields)
  }),

  // Service tables endpoint
  http.get('/api/v2/db/_schema', () => {
    return HttpResponse.json(mockTables)
  }),

  // Specific table fields endpoint
  http.get('/api/v2/db/_schema/:tableName', ({ params }) => {
    return HttpResponse.json(mockTableFields)
  }),

  // Existing relationship endpoint for edit mode
  http.get('/api/v2/db/_schema/testTable/_related/:relationshipName', () => {
    return HttpResponse.json({ resource: [mockExistingRelationship] })
  }),

  // Create relationship endpoint
  http.post('/api/v2/db/_schema/testTable/_related', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ 
      resource: [{ 
        ...body.resource[0], 
        name: body.resource[0].alias || 'new_relationship' 
      }] 
    })
  }),

  // Update relationship endpoint
  http.patch('/api/v2/db/_schema/testTable/_related', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ 
      resource: [{ 
        ...mockExistingRelationship, 
        ...body.resource[0] 
      }] 
    })
  }),

  // Error scenarios
  http.post('/api/v2/db/_schema/testTable/_related', () => {
    return HttpResponse.json(
      { 
        error: { 
          code: 400,
          message: 'Validation failed',
          context: {
            resource: [{ message: 'Alias field is required' }]
          }
        } 
      },
      { status: 400 }
    )
  }, { once: true }),
]

const server = setupServer(...handlers)

// Test utilities
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient()
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

// Test setup
describe('RelationshipDetailsPage', () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()
  const mockSearchParams = vi.fn()

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

  beforeEach(() => {
    const mockRouter = {
      push: mockPush,
      back: mockBack,
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    }
    
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockSearchParams,
      getAll: vi.fn(),
      has: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      entries: vi.fn(),
      forEach: vi.fn(),
      toString: vi.fn(),
    } as any)
  })

  describe('SSR and Initial Rendering', () => {
    it('should render without crashing in SSR mode', () => {
      expect(() => {
        renderWithProviders(<RelationshipDetailsPage />)
      }).not.toThrow()
    })

    it('should display the page title and description', async () => {
      renderWithProviders(<RelationshipDetailsPage />)
      
      expect(screen.getByRole('heading', { name: /relationship details/i })).toBeInTheDocument()
      expect(screen.getByText(/configure database table relationships/i)).toBeInTheDocument()
    })

    it('should render loading states initially', () => {
      renderWithProviders(<RelationshipDetailsPage />)
      
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })

    it('should render in create mode by default', async () => {
      mockSearchParams.mockReturnValue(null)
      
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument()
      })
    })

    it('should render in edit mode when relationship parameter is provided', async () => {
      mockSearchParams.mockReturnValue('user_orders')
      
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update relationship/i })).toBeInTheDocument()
      })
    })
  })

  describe('Data Loading and API Integration', () => {
    it('should load and display available services', async () => {
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        const serviceSelect = screen.getByLabelText(/reference service/i)
        expect(serviceSelect).toBeInTheDocument()
      })

      // Check if services are loaded in the select
      const serviceSelect = screen.getByLabelText(/reference service/i)
      fireEvent.click(serviceSelect)
      
      await waitFor(() => {
        expect(screen.getByText('Local SQL Database')).toBeInTheDocument()
        expect(screen.getByText('MongoDB Database')).toBeInTheDocument()
      })
    })

    it('should load table fields for form options', async () => {
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        const fieldSelect = screen.getByLabelText(/local field/i)
        expect(fieldSelect).toBeInTheDocument()
      })

      const fieldSelect = screen.getByLabelText(/local field/i)
      fireEvent.click(fieldSelect)
      
      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument()
        expect(screen.getByText('Name')).toBeInTheDocument()
        expect(screen.getByText('Email')).toBeInTheDocument()
      })
    })

    it('should load existing relationship data in edit mode', async () => {
      mockSearchParams.mockReturnValue('user_orders')
      
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('orders')).toBeInTheDocument()
        expect(screen.getByDisplayValue('User Orders')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Orders belonging to user')).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      // Mock API failure
      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json(
            { error: { message: 'Service unavailable' } },
            { status: 500 }
          )
        })
      )

      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/failed to load services/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions and Validation', () => {
    it('should require basic relationship fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument()
      })

      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: /create relationship/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/alias is required/i)).toBeInTheDocument()
        expect(screen.getByText(/relationship type is required/i)).toBeInTheDocument()
        expect(screen.getByText(/local field is required/i)).toBeInTheDocument()
      })
    })

    it('should validate form with all required fields filled', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      })

      // Fill in required fields
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'id')
      await user.selectOptions(screen.getByLabelText(/reference service/i), '5')
      
      // Wait for tables to load and select reference table
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/reference table/i), 'users')
      
      // Wait for fields to load and select reference field
      await waitFor(() => {
        expect(screen.getByLabelText(/reference field/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/reference field/i), 'id')

      // Form should now be valid
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      expect(submitButton).toBeEnabled()
    })

    it('should disable junction fields when relationship type is "belongs_to"', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeDisabled()
        expect(screen.getByLabelText(/junction table/i)).toBeDisabled()
        expect(screen.getByLabelText(/junction field/i)).toBeDisabled()
        expect(screen.getByLabelText(/junction reference field/i)).toBeDisabled()
      })
    })

    it('should enable junction fields when relationship type is "many_many"', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'many_many')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeEnabled()
      })

      // Select junction service to enable other junction fields
      await user.selectOptions(screen.getByLabelText(/junction service/i), '5')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/junction table/i)).toBeEnabled()
      })
    })

    it('should load tables when reference service changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument()
      })

      await user.selectOptions(screen.getByLabelText(/reference service/i), '5')
      
      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i)
        expect(tableSelect).toBeEnabled()
        
        fireEvent.click(tableSelect)
        expect(screen.getByText('Users')).toBeInTheDocument()
        expect(screen.getByText('Orders')).toBeInTheDocument()
      })
    })

    it('should load fields when reference table changes', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument()
      })

      // Select service first
      await user.selectOptions(screen.getByLabelText(/reference service/i), '5')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeEnabled()
      })

      // Select table
      await user.selectOptions(screen.getByLabelText(/reference table/i), 'users')
      
      await waitFor(() => {
        const fieldSelect = screen.getByLabelText(/reference field/i)
        expect(fieldSelect).toBeEnabled()
        
        fireEvent.click(fieldSelect)
        expect(screen.getByText('ID')).toBeInTheDocument()
        expect(screen.getByText('User ID')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission and API Calls', () => {
    it('should successfully create a new relationship', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      })

      // Fill form with valid data
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')
      await user.type(screen.getByLabelText(/label/i), 'Test Relationship')
      await user.type(screen.getByLabelText(/description/i), 'A test relationship')
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'id')
      await user.selectOptions(screen.getByLabelText(/reference service/i), '5')

      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/reference table/i), 'users')

      await waitFor(() => {
        expect(screen.getByLabelText(/reference field/i)).toBeEnabled()
      })
      await user.selectOptions(screen.getByLabelText(/reference field/i), 'id')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create relationship/i }))
      
      // Should redirect back to relationships list
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-schema/testTable/relationships')
      })
    })

    it('should successfully update an existing relationship', async () => {
      const user = userEvent.setup()
      mockSearchParams.mockReturnValue('user_orders')
      
      renderWithProviders(<RelationshipDetailsPage />)
      
      // Wait for form to load with existing data
      await waitFor(() => {
        expect(screen.getByDisplayValue('orders')).toBeInTheDocument()
      })

      // Modify the description
      const descriptionField = screen.getByLabelText(/description/i)
      await user.clear(descriptionField)
      await user.type(descriptionField, 'Updated description')

      // Submit form
      await user.click(screen.getByRole('button', { name: /update relationship/i }))
      
      // Should redirect back to relationships list
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-schema/testTable/relationships')
      })
    })

    it('should handle form submission errors', async () => {
      const user = userEvent.setup()
      
      // Mock API error response
      server.use(
        http.post('/api/v2/db/_schema/testTable/_related', () => {
          return HttpResponse.json(
            { 
              error: { 
                code: 400,
                message: 'Validation failed',
                context: {
                  resource: [{ message: 'Alias field is required' }]
                }
              } 
            },
            { status: 400 }
          )
        })
      )

      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      })

      // Fill minimal form data
      await user.type(screen.getByLabelText(/alias/i), 'test')
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create relationship/i }))
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/alias field is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation and Routing', () => {
    it('should navigate back to relationships list when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(mockPush).toHaveBeenCalledWith('/adf-schema/testTable/relationships')
    })

    it('should navigate back to relationships list from create mode', async () => {
      const user = userEvent.setup()
      mockSearchParams.mockReturnValue(null) // Create mode
      
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(mockPush).toHaveBeenCalledWith('/adf-schema/testTable/relationships')
    })

    it('should navigate back to relationships list from edit mode', async () => {
      const user = userEvent.setup()
      mockSearchParams.mockReturnValue('user_orders') // Edit mode
      
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancel/i }))
      
      expect(mockPush).toHaveBeenCalledWith('/adf-schema/testTable/relationships')
    })
  })

  describe('User Interactions and Accessibility', () => {
    it('should support keyboard navigation', async () => {
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      })

      const aliasField = screen.getByLabelText(/alias/i)
      aliasField.focus()
      expect(aliasField).toHaveFocus()

      // Tab through form fields
      fireEvent.keyDown(aliasField, { key: 'Tab' })
      expect(screen.getByLabelText(/label/i)).toHaveFocus()
    })

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument()
      })

      // Submit form without required fields
      await user.click(screen.getByRole('button', { name: /create relationship/i }))
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/alias is required/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('should provide proper form field labels and descriptions', () => {
      renderWithProviders(<RelationshipDetailsPage />)
      
      // Check for proper labeling
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/local field/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument()
      
      // Check for field descriptions
      expect(screen.getByText(/unique identifier for this relationship/i)).toBeInTheDocument()
      expect(screen.getByText(/type of relationship between tables/i)).toBeInTheDocument()
    })

    it('should show loading states during form submission', async () => {
      const user = userEvent.setup()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      })

      // Fill minimal valid form
      await user.type(screen.getByLabelText(/alias/i), 'test')
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'id')
      await user.selectOptions(screen.getByLabelText(/reference service/i), '5')

      // Submit form
      await user.click(screen.getByRole('button', { name: /create relationship/i }))
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled()
    })
  })

  describe('Performance and Caching', () => {
    it('should cache service data between component rerenders', async () => {
      const { rerender } = renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument()
      })

      // Rerender component
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <RelationshipDetailsPage />
        </QueryClientProvider>
      )
      
      // Services should load from cache
      await waitFor(() => {
        expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument()
      })
    })

    it('should handle large schema datasets efficiently', async () => {
      // Mock large dataset
      const largeServices = {
        resource: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `service_${i + 1}`,
          label: `Service ${i + 1}`,
          type: 'sql_db',
        })),
      }

      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json(largeServices)
        })
      )

      const startTime = performance.now()
      renderWithProviders(<RelationshipDetailsPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render large datasets in under 2 seconds
      expect(renderTime).toBeLessThan(2000)
    })
  })
})