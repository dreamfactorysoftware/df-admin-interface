/**
 * @fileoverview Comprehensive Vitest test suite for the field creation page component
 * using React Testing Library and Mock Service Worker for API mocking. Tests field 
 * creation form rendering, validation workflows, submission handling, error scenarios, 
 * and navigation patterns following established testing patterns from the migrated 
 * Angular component.
 * 
 * @version 1.0.0
 * @created 2024-12-28
 * 
 * Key Features:
 * - Vitest unit test scaffold per Section 4.7.1.3 Vitest Testing Infrastructure Setup
 * - MSW integration for field creation testing scenarios per Section 5.2 Component Details Testing Infrastructure  
 * - 10x faster test execution with Vitest 2.1.0 per Section 7.1.1 Framework Stack Architecture
 * - React Testing Library integration with standardized test patterns per Section 4.7.1.3 Testing Scaffold Architecture
 * - 90%+ code coverage targets per Section 0.2.3 Technical Steps testing implementation
 * 
 * Performance Targets:
 * - Individual test execution: < 100ms
 * - Complete test suite: < 5 seconds
 * - Code coverage: 90%+ for React components and hooks
 * 
 * Migration Benefits:
 * - React Hook Form testing scenarios for field creation workflow validation
 * - React Query caching and mutation testing patterns with MSW integration
 * - Next.js routing navigation testing for form submission and cancel actions
 * - Comprehensive field type selection and dynamic control testing scenarios
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

// Import the component under test
import FieldCreationPage from './page'

// Import types for type-safe testing
import type { 
  FieldFormData, 
  DreamFactoryFieldType,
  FieldApiResponse,
  DatabaseSchemaFieldType,
  FieldValidationError,
  AsyncValidationResult
} from '../field.types'

// =============================================================================
// MOCK SETUP AND CONFIGURATION
// =============================================================================

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}))

// Mock API client for field operations
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock toast notifications
vi.mock('@/components/ui/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}))

// Mock field validation hook
vi.mock('@/hooks/use-field-validation', () => ({
  useFieldValidation: vi.fn(),
}))

// =============================================================================
// TEST DATA AND FIXTURES
// =============================================================================

/**
 * Mock field form data for testing scenarios
 */
const mockFieldFormData: FieldFormData = {
  name: 'test_field',
  alias: 'testField',
  label: 'Test Field',
  description: 'A test field for unit testing',
  type: 'string' as DreamFactoryFieldType,
  dbType: 'VARCHAR',
  length: 255,
  precision: null,
  scale: 0,
  default: null,
  allowNull: true,
  autoIncrement: false,
  fixedLength: false,
  isAggregate: false,
  isForeignKey: false,
  isPrimaryKey: false,
  isUnique: false,
  isVirtual: false,
  required: false,
  supportsMultibyte: true,
  refTable: null,
  refField: null,
  refOnDelete: null,
  refOnUpdate: null,
  picklist: null,
  validation: null,
  dbFunction: [],
}

/**
 * Mock numeric field form data for testing type-specific controls
 */
const mockNumericFieldData: FieldFormData = {
  ...mockFieldFormData,
  name: 'price_field',
  type: 'decimal' as DreamFactoryFieldType,
  dbType: 'DECIMAL',
  length: null,
  precision: 10,
  scale: 2,
  default: '0.00',
}

/**
 * Mock foreign key field form data for testing relationship controls
 */
const mockForeignKeyFieldData: FieldFormData = {
  ...mockFieldFormData,
  name: 'user_id',
  type: 'integer' as DreamFactoryFieldType,
  dbType: 'INT',
  isForeignKey: true,
  refTable: 'users',
  refField: 'id',
  refOnDelete: 'CASCADE',
  refOnUpdate: 'RESTRICT',
}

/**
 * Mock API response for successful field creation
 */
const mockSuccessResponse: FieldApiResponse = {
  success: true,
  message: 'Field created successfully',
  data: {
    ...mockFieldFormData,
    native: [],
    value: [],
  } as DatabaseSchemaFieldType,
  meta: {
    timestamp: Date.now(),
    requestId: 'test-request-123',
  },
}

/**
 * Mock API response for validation errors
 */
const mockValidationErrorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Field validation failed',
    details: {
      name: ['Field name is required'],
      type: ['Field type must be specified'],
    },
  },
}

/**
 * Mock API response for server errors
 */
const mockServerErrorResponse = {
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An internal server error occurred',
    details: 'Database connection failed',
  },
}

/**
 * Available field types for dropdown testing
 */
const mockFieldTypes: DreamFactoryFieldType[] = [
  'string',
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'reference',
]

/**
 * Mock reference tables for foreign key testing
 */
const mockReferenceTables = [
  { value: 'users', label: 'Users' },
  { value: 'roles', label: 'Roles' },
  { value: 'permissions', label: 'Permissions' },
]

/**
 * Mock reference fields for foreign key testing
 */
const mockReferenceFields = [
  { value: 'id', label: 'ID' },
  { value: 'uuid', label: 'UUID' },
  { value: 'email', label: 'Email' },
]

// =============================================================================
// MSW SERVER SETUP
// =============================================================================

/**
 * MSW server for API mocking during tests
 */
const server = setupServer(
  // Field creation endpoint
  rest.post('/api/v2/:service/_schema/:table', (req, res, ctx) => {
    const { service, table } = req.params
    
    // Simulate validation errors for specific test cases
    if (req.url.searchParams.get('trigger_validation_error') === 'true') {
      return res(
        ctx.status(422),
        ctx.json(mockValidationErrorResponse)
      )
    }
    
    // Simulate server errors for error testing
    if (req.url.searchParams.get('trigger_server_error') === 'true') {
      return res(
        ctx.status(500),
        ctx.json(mockServerErrorResponse)
      )
    }
    
    // Simulate network timeout for timeout testing
    if (req.url.searchParams.get('trigger_timeout') === 'true') {
      return res(ctx.delay('infinite'))
    }
    
    // Default successful response
    return res(
      ctx.status(201),
      ctx.json(mockSuccessResponse)
    )
  }),
  
  // Reference tables endpoint for foreign key dropdown
  rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: mockReferenceTables.map(table => ({
          name: table.value,
          label: table.label,
          table: true,
        })),
      })
    )
  }),
  
  // Reference fields endpoint for foreign key dropdown
  rest.get('/api/v2/:service/_schema/:table', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        field: mockReferenceFields.map(field => ({
          name: field.value,
          label: field.label,
          type: 'integer',
        })),
      })
    )
  }),
  
  // Field validation endpoint for async validation
  rest.post('/api/v2/:service/_schema/:table/_validate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        isValid: true,
        errors: [],
        timestamp: Date.now(),
        fieldName: 'test_field',
      } as AsyncValidationResult)
    )
  })
)

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Custom render function with React Query provider and router mocks
 */
function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    routerMocks = {},
    ...renderOptions
  } = {}
) {
  // Setup router mocks
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    ...routerMocks,
  }
  
  const mockParams = {
    service: 'mysql-test',
    table: 'users',
    ...routerMocks.params,
  }
  
  const mockSearchParams = new URLSearchParams()
  
  // Mock hook implementations
  ;(useRouter as any).mockReturnValue(mockRouter)
  ;(useParams as any).mockReturnValue(mockParams)
  ;(useSearchParams as any).mockReturnValue(mockSearchParams)
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
  
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockRouter,
    mockParams,
    queryClient,
  }
}

/**
 * Utility to fill out the field creation form
 */
async function fillFieldForm(fieldData: Partial<FieldFormData>) {
  const user = userEvent.setup()
  
  // Fill basic field information
  if (fieldData.name) {
    await user.type(screen.getByLabelText(/field name/i), fieldData.name)
  }
  
  if (fieldData.alias) {
    await user.type(screen.getByLabelText(/alias/i), fieldData.alias)
  }
  
  if (fieldData.label) {
    await user.type(screen.getByLabelText(/label/i), fieldData.label)
  }
  
  if (fieldData.description) {
    await user.type(screen.getByLabelText(/description/i), fieldData.description)
  }
  
  // Select field type
  if (fieldData.type) {
    const typeSelect = screen.getByLabelText(/field type/i)
    await user.selectOptions(typeSelect, fieldData.type)
  }
  
  // Fill numeric field properties
  if (fieldData.precision !== undefined && fieldData.precision !== null) {
    await user.type(screen.getByLabelText(/precision/i), fieldData.precision.toString())
  }
  
  if (fieldData.scale !== undefined) {
    await user.type(screen.getByLabelText(/scale/i), fieldData.scale.toString())
  }
  
  // Fill string field properties
  if (fieldData.length !== undefined && fieldData.length !== null) {
    await user.type(screen.getByLabelText(/length/i), fieldData.length.toString())
  }
  
  // Set boolean flags
  if (fieldData.required !== undefined) {
    const requiredCheckbox = screen.getByLabelText(/required/i)
    if (fieldData.required !== requiredCheckbox.checked) {
      await user.click(requiredCheckbox)
    }
  }
  
  if (fieldData.allowNull !== undefined) {
    const allowNullCheckbox = screen.getByLabelText(/allow null/i)
    if (fieldData.allowNull !== allowNullCheckbox.checked) {
      await user.click(allowNullCheckbox)
    }
  }
  
  // Set foreign key properties
  if (fieldData.isForeignKey) {
    await user.click(screen.getByLabelText(/foreign key/i))
    
    if (fieldData.refTable) {
      const refTableSelect = screen.getByLabelText(/reference table/i)
      await user.selectOptions(refTableSelect, fieldData.refTable)
    }
    
    if (fieldData.refField) {
      const refFieldSelect = screen.getByLabelText(/reference field/i)
      await user.selectOptions(refFieldSelect, fieldData.refField)
    }
    
    if (fieldData.refOnDelete) {
      const onDeleteSelect = screen.getByLabelText(/on delete/i)
      await user.selectOptions(onDeleteSelect, fieldData.refOnDelete)
    }
  }
  
  return user
}

// =============================================================================
// TEST SETUP AND TEARDOWN
// =============================================================================

beforeAll(() => {
  // Start MSW server
  server.listen({
    onUnhandledRequest: 'error',
  })
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
  
  // Reset MSW handlers
  server.resetHandlers()
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers()
})

// =============================================================================
// MAIN TEST SUITE
// =============================================================================

describe('Field Creation Page', () => {
  
  // ===========================================================================
  // COMPONENT RENDERING TESTS
  // ===========================================================================
  
  describe('Component Rendering', () => {
    it('should render the field creation page with all required elements', async () => {
      renderWithProviders(<FieldCreationPage />)
      
      // Check page title and breadcrumbs
      expect(screen.getByRole('heading', { name: /create new field/i })).toBeInTheDocument()
      expect(screen.getByText(/schema/i)).toBeInTheDocument()
      expect(screen.getByText(/fields/i)).toBeInTheDocument()
      expect(screen.getByText(/new/i)).toBeInTheDocument()
      
      // Check form sections
      expect(screen.getByText(/basic information/i)).toBeInTheDocument()
      expect(screen.getByText(/field properties/i)).toBeInTheDocument()
      expect(screen.getByText(/constraints/i)).toBeInTheDocument()
      
      // Check form fields
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument()
      
      // Check action buttons
      expect(screen.getByRole('button', { name: /create field/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
    
    it('should render loading state while fetching reference data', async () => {
      // Mock loading state
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { 
            retry: false,
            refetchOnWindowFocus: false,
            staleTime: 0,
          },
        },
      })
      
      renderWithProviders(<FieldCreationPage />, { queryClient })
      
      // Should show loading indicators for reference data
      await waitFor(() => {
        expect(screen.getByText(/loading field types/i)).toBeInTheDocument()
      })
    })
    
    it('should render error state when reference data fails to load', async () => {
      // Mock error response for reference data
      server.use(
        rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Failed to load tables' }))
        })
      )
      
      renderWithProviders(<FieldCreationPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load reference data/i)).toBeInTheDocument()
      })
      
      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })
  
  // ===========================================================================
  // FORM VALIDATION TESTS
  // ===========================================================================
  
  describe('Form Validation', () => {
    it('should validate required fields on form submission', async () => {
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await user.click(submitButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/field type is required/i)).toBeInTheDocument()
      })
      
      // Should not navigate or submit
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
    
    it('should validate field name format and uniqueness', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      const nameInput = screen.getByLabelText(/field name/i)
      
      // Test invalid characters
      await user.type(nameInput, 'invalid-field-name!')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/field name must contain only letters, numbers, and underscores/i)).toBeInTheDocument()
      })
      
      // Test valid name
      await user.clear(nameInput)
      await user.type(nameInput, 'valid_field_name')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.queryByText(/field name must contain only letters/i)).not.toBeInTheDocument()
      })
    })
    
    it('should validate numeric field constraints', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      // Select decimal type to enable precision/scale fields
      const typeSelect = screen.getByLabelText(/field type/i)
      await user.selectOptions(typeSelect, 'decimal')
      
      // Wait for dynamic fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/scale/i)).toBeInTheDocument()
      })
      
      // Test invalid precision (too large)
      const precisionInput = screen.getByLabelText(/precision/i)
      await user.type(precisionInput, '100')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/precision must be between 1 and 65/i)).toBeInTheDocument()
      })
      
      // Test scale greater than precision
      const scaleInput = screen.getByLabelText(/scale/i)
      await user.clear(precisionInput)
      await user.type(precisionInput, '5')
      await user.type(scaleInput, '10')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/scale cannot be greater than precision/i)).toBeInTheDocument()
      })
    })
    
    it('should validate string field length constraints', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      // Select string type to enable length field
      const typeSelect = screen.getByLabelText(/field type/i)
      await user.selectOptions(typeSelect, 'string')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument()
      })
      
      // Test invalid length (too large for VARCHAR)
      const lengthInput = screen.getByLabelText(/length/i)
      await user.type(lengthInput, '70000')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/length cannot exceed 65535 for VARCHAR/i)).toBeInTheDocument()
      })
    })
    
    it('should validate foreign key configuration', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      // Enable foreign key
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i)
      await user.click(foreignKeyCheckbox)
      
      // Wait for foreign key fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument()
      })
      
      // Try to submit with incomplete foreign key configuration
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/reference table is required for foreign keys/i)).toBeInTheDocument()
        expect(screen.getByText(/reference field is required for foreign keys/i)).toBeInTheDocument()
      })
    })
  })
  
  // ===========================================================================
  // DYNAMIC FORM CONTROL TESTS
  // ===========================================================================
  
  describe('Dynamic Form Controls', () => {
    it('should show/hide fields based on field type selection', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      const typeSelect = screen.getByLabelText(/field type/i)
      
      // Test string type - should show length field
      await user.selectOptions(typeSelect, 'string')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/scale/i)).not.toBeInTheDocument()
      })
      
      // Test decimal type - should show precision and scale
      await user.selectOptions(typeSelect, 'decimal')
      
      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/scale/i)).toBeInTheDocument()
        expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument()
      })
      
      // Test boolean type - should hide numeric fields
      await user.selectOptions(typeSelect, 'boolean')
      
      await waitFor(() => {
        expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/scale/i)).not.toBeInTheDocument()
      })
    })
    
    it('should enable/disable auto-increment based on field type', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      const typeSelect = screen.getByLabelText(/field type/i)
      const autoIncrementCheckbox = screen.getByLabelText(/auto increment/i)
      
      // Test string type - auto-increment should be disabled
      await user.selectOptions(typeSelect, 'string')
      
      await waitFor(() => {
        expect(autoIncrementCheckbox).toBeDisabled()
      })
      
      // Test integer type - auto-increment should be enabled
      await user.selectOptions(typeSelect, 'integer')
      
      await waitFor(() => {
        expect(autoIncrementCheckbox).toBeEnabled()
      })
    })
    
    it('should show foreign key fields when foreign key is enabled', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i)
      
      // Initially foreign key fields should be hidden
      expect(screen.queryByLabelText(/reference table/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/reference field/i)).not.toBeInTheDocument()
      
      // Enable foreign key
      await user.click(foreignKeyCheckbox)
      
      // Foreign key fields should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/on delete/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/on update/i)).toBeInTheDocument()
      })
      
      // Disable foreign key
      await user.click(foreignKeyCheckbox)
      
      // Fields should be hidden again
      await waitFor(() => {
        expect(screen.queryByLabelText(/reference table/i)).not.toBeInTheDocument()
        expect(screen.queryByLabelText(/reference field/i)).not.toBeInTheDocument()
      })
    })
    
    it('should load reference fields when reference table is selected', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      // Enable foreign key
      await user.click(screen.getByLabelText(/foreign key/i))
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument()
      })
      
      // Select a reference table
      const refTableSelect = screen.getByLabelText(/reference table/i)
      await user.selectOptions(refTableSelect, 'users')
      
      // Reference field dropdown should be populated
      await waitFor(() => {
        const refFieldSelect = screen.getByLabelText(/reference field/i)
        expect(refFieldSelect).toBeInTheDocument()
        expect(within(refFieldSelect).getByText('ID')).toBeInTheDocument()
        expect(within(refFieldSelect).getByText('UUID')).toBeInTheDocument()
      })
    })
  })
  
  // ===========================================================================
  // FORM SUBMISSION TESTS
  // ===========================================================================
  
  describe('Form Submission', () => {
    it('should successfully create a basic field', async () => {
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      
      // Fill out the form
      await fillFieldForm(mockFieldFormData)
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/creating field/i)).toBeInTheDocument()
      })
      
      // Should show success message and navigate
      await waitFor(() => {
        expect(screen.getByText(/field created successfully/i)).toBeInTheDocument()
        expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields')
      })
    })
    
    it('should successfully create a numeric field with precision and scale', async () => {
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      
      // Fill out numeric field form
      await fillFieldForm(mockNumericFieldData)
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should create field with correct numeric properties
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields')
      })
    })
    
    it('should successfully create a foreign key field', async () => {
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      
      // Fill out foreign key field form
      await fillFieldForm(mockForeignKeyFieldData)
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should create field with foreign key relationship
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields')
      })
    })
    
    it('should handle API validation errors gracefully', async () => {
      // Configure server to return validation error
      server.use(
        rest.post('/api/v2/:service/_schema/:table', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json(mockValidationErrorResponse)
          )
        })
      )
      
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      
      // Fill out the form
      await fillFieldForm(mockFieldFormData)
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/field validation failed/i)).toBeInTheDocument()
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/field type must be specified/i)).toBeInTheDocument()
      })
      
      // Should not navigate
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
    
    it('should handle server errors with retry option', async () => {
      // Configure server to return server error
      server.use(
        rest.post('/api/v2/:service/_schema/:table', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json(mockServerErrorResponse)
          )
        })
      )
      
      renderWithProviders(<FieldCreationPage />)
      
      // Fill out the form
      await fillFieldForm(mockFieldFormData)
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should show error message with retry option
      await waitFor(() => {
        expect(screen.getByText(/an internal server error occurred/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
    
    it('should handle network timeouts appropriately', async () => {
      // Configure server to timeout
      server.use(
        rest.post('/api/v2/:service/_schema/:table', (req, res, ctx) => {
          return res(ctx.delay('infinite'))
        })
      )
      
      renderWithProviders(<FieldCreationPage />)
      
      // Fill out the form
      await fillFieldForm(mockFieldFormData)
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should show loading state
      expect(screen.getByText(/creating field/i)).toBeInTheDocument()
      
      // Should show timeout error after delay (using fake timers)
      vi.useFakeTimers()
      vi.advanceTimersByTime(30000) // 30 second timeout
      
      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
      })
      
      vi.useRealTimers()
    })
  })
  
  // ===========================================================================
  // NAVIGATION TESTS
  // ===========================================================================
  
  describe('Navigation', () => {
    it('should navigate back to fields list when cancel is clicked', async () => {
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)
      
      expect(mockRouter.back).toHaveBeenCalled()
    })
    
    it('should show confirmation dialog when leaving with unsaved changes', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      // Make some changes to the form
      await user.type(screen.getByLabelText(/field name/i), 'test_field')
      
      // Try to navigate away
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to leave/i)).toBeInTheDocument()
      })
      
      // Should have confirm and cancel options
      expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /stay/i })).toBeInTheDocument()
    })
    
    it('should navigate to fields list after successful creation', async () => {
      const { mockRouter } = renderWithProviders(<FieldCreationPage />)
      
      // Fill and submit form
      await fillFieldForm(mockFieldFormData)
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should navigate to fields list
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields')
      })
    })
  })
  
  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(<FieldCreationPage />)
      
      // Check form has proper role
      expect(screen.getByRole('form')).toBeInTheDocument()
      
      // Check all form controls have labels
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument()
      
      // Check buttons have accessible names
      expect(screen.getByRole('button', { name: /create field/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
    
    it('should have proper error announcements for screen readers', async () => {
      renderWithProviders(<FieldCreationPage />)
      
      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Check error messages have proper ARIA attributes
      await waitFor(() => {
        const errorMessage = screen.getByText(/field name is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })
    
    it('should support keyboard navigation', async () => {
      renderWithProviders(<FieldCreationPage />)
      
      // Test tab navigation through form
      const firstInput = screen.getByLabelText(/field name/i)
      firstInput.focus()
      expect(firstInput).toHaveFocus()
      
      // Tab to next field
      await userEvent.tab()
      expect(screen.getByLabelText(/alias/i)).toHaveFocus()
      
      // Continue through form
      await userEvent.tab()
      expect(screen.getByLabelText(/label/i)).toHaveFocus()
    })
  })
  
  // ===========================================================================
  // PERFORMANCE TESTS
  // ===========================================================================
  
  describe('Performance', () => {
    it('should render within performance targets', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<FieldCreationPage />)
      
      // Wait for component to be fully rendered
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create new field/i })).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render within 500ms target
      expect(renderTime).toBeLessThan(500)
    })
    
    it('should handle form validation with minimal delay', async () => {
      renderWithProviders(<FieldCreationPage />)
      const user = userEvent.setup()
      
      const nameInput = screen.getByLabelText(/field name/i)
      
      const startTime = performance.now()
      
      // Type invalid input
      await user.type(nameInput, 'invalid!')
      await user.tab()
      
      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText(/field name must contain only letters/i)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Validation should occur within 100ms target
      expect(validationTime).toBeLessThan(100)
    })
  })
  
  // ===========================================================================
  // REACT QUERY INTEGRATION TESTS
  // ===========================================================================
  
  describe('React Query Integration', () => {
    it('should cache reference data between renders', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 300000 }, // 5 minute cache
        },
      })
      
      // First render
      const { unmount } = renderWithProviders(<FieldCreationPage />, { queryClient })
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByLabelText(/field type/i)).toBeInTheDocument()
      })
      
      // Unmount and remount
      unmount()
      renderWithProviders(<FieldCreationPage />, { queryClient })
      
      // Data should be available immediately from cache
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument()
    })
    
    it('should handle query invalidation after successful creation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      
      renderWithProviders(<FieldCreationPage />, { queryClient })
      
      // Fill and submit form
      await fillFieldForm(mockFieldFormData)
      const submitButton = screen.getByRole('button', { name: /create field/i })
      await userEvent.click(submitButton)
      
      // Should invalidate related queries
      await waitFor(() => {
        expect(queryClient.getQueryState(['fields', 'mysql-test', 'users'])?.isInvalidated).toBe(true)
      })
    })
  })
})

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Field Creation Integration Tests', () => {
  it('should handle complete field creation workflow', async () => {
    const { mockRouter } = renderWithProviders(<FieldCreationPage />)
    
    // Complete the entire workflow
    await fillFieldForm({
      ...mockFieldFormData,
      name: 'integration_test_field',
      type: 'string',
      length: 100,
      required: true,
    })
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create field/i })
    await userEvent.click(submitButton)
    
    // Verify the complete workflow
    await waitFor(() => {
      expect(screen.getByText(/field created successfully/i)).toBeInTheDocument()
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields')
    }, { timeout: 5000 })
  })
  
  it('should handle foreign key creation with reference data loading', async () => {
    renderWithProviders(<FieldCreationPage />)
    
    // Create foreign key field
    await fillFieldForm({
      name: 'user_id',
      type: 'integer',
      isForeignKey: true,
      refTable: 'users',
      refField: 'id',
      refOnDelete: 'CASCADE',
    })
    
    // Verify foreign key configuration
    await waitFor(() => {
      expect(screen.getByDisplayValue('users')).toBeInTheDocument()
      expect(screen.getByDisplayValue('id')).toBeInTheDocument()
      expect(screen.getByDisplayValue('CASCADE')).toBeInTheDocument()
    })
    
    // Submit should work with foreign key
    const submitButton = screen.getByRole('button', { name: /create field/i })
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/field created successfully/i)).toBeInTheDocument()
    })
  })
})