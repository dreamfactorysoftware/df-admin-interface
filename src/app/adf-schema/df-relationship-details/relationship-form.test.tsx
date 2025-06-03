/**
 * @fileoverview Comprehensive Vitest unit tests for RelationshipForm component
 * 
 * Tests React Hook Form integration, Zod schema validation, dynamic field behavior,
 * user interactions, and form submission handling. Validates the migration from
 * Angular reactive forms to React Hook Form with enhanced performance characteristics.
 * 
 * Key Testing Areas:
 * - Form validation with Zod schema validation per React/Next.js Integration Requirements
 * - Dynamic field enabling/disabling based on relationship type (belongs_to vs many_many)
 * - Real-time validation performance under 100ms per performance requirements
 * - Form state management with React Hook Form uncontrolled components
 * - MSW integration for realistic API testing without backend dependencies
 * - User interaction patterns and accessibility compliance
 * 
 * Performance Targets:
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Test suite execution under 30 seconds for fast development feedback
 * - 90%+ code coverage for comprehensive validation testing
 * 
 * @version 1.0.0
 * @since 2024-01-15
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import the component and its dependencies
import { RelationshipForm } from './relationship-form';
import { relationshipValidationSchema } from './validation-schemas';
import type { RelationshipFormData, RelationshipType } from '../../../types/relationship';

/**
 * Test utilities and mock data setup
 * Replicates Angular TestBed configuration patterns for React testing environment
 */

// Mock data for database services (replaces Angular service mocks)
const mockDatabaseServices = [
  {
    id: 1,
    name: 'mysql-test',
    label: 'MySQL Test Database',
    type: 'mysql',
    config: {
      host: 'localhost',
      port: 3306,
      database: 'test_db',
    },
  },
  {
    id: 2,
    name: 'postgresql-test', 
    label: 'PostgreSQL Test Database',
    type: 'postgresql',
    config: {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
    },
  },
];

// Mock data for table fields (replaces Angular route resolver data)
const mockTableFields = [
  { name: 'id', label: 'ID', type: 'integer', isPrimaryKey: true },
  { name: 'name', label: 'Name', type: 'string', isRequired: true },
  { name: 'email', label: 'Email', type: 'string', isUnique: true },
  { name: 'created_at', label: 'Created At', type: 'timestamp' },
  { name: 'user_id', label: 'User ID', type: 'integer', isForeignKey: true },
];

// Mock data for reference table fields
const mockReferenceFields = [
  { name: 'id', label: 'ID', type: 'integer', isPrimaryKey: true },
  { name: 'title', label: 'Title', type: 'string', isRequired: true },
  { name: 'description', label: 'Description', type: 'text' },
];

// Mock data for junction table fields (many_many relationships)
const mockJunctionFields = [
  { name: 'id', label: 'ID', type: 'integer', isPrimaryKey: true },
  { name: 'user_id', label: 'User ID', type: 'integer', isForeignKey: true },
  { name: 'role_id', label: 'Role ID', type: 'integer', isForeignKey: true },
  { name: 'assigned_at', label: 'Assigned At', type: 'timestamp' },
];

// Valid form data for belongs_to relationship
const validBelongsToData: Partial<RelationshipFormData> = {
  alias: 'user_profile',
  label: 'User Profile',
  description: 'User profile relationship',
  type: 'belongs_to' as RelationshipType,
  field: 'user_id',
  refServiceId: 1,
  refTable: 'users',
  refField: 'id',
  alwaysFetch: false,
};

// Valid form data for many_many relationship
const validManyManyData: Partial<RelationshipFormData> = {
  alias: 'user_roles',
  label: 'User Roles',
  description: 'Many-to-many user roles relationship',
  type: 'many_many' as RelationshipType,
  field: 'id',
  refServiceId: 1,
  refTable: 'roles',
  refField: 'id',
  junctionServiceId: 2,
  junctionTable: 'user_roles',
  junctionField: 'user_id',
  junctionRefField: 'role_id',
  alwaysFetch: true,
};

// Existing relationship data for edit mode testing
const existingRelationshipData: RelationshipFormData = {
  alias: 'existing_relation',
  label: 'Existing Relationship',
  description: 'Pre-existing relationship for testing edit mode',
  type: 'belongs_to' as RelationshipType,
  field: 'category_id',
  refServiceId: 1,
  refTable: 'categories',
  refField: 'id',
  alwaysFetch: false,
  // Junction fields should be undefined for belongs_to
  junctionServiceId: undefined,
  junctionTable: undefined,
  junctionField: undefined,
  junctionRefField: undefined,
};

/**
 * MSW request handlers for API endpoint mocking
 * Replaces Angular HTTP interceptors with realistic API simulation
 */
const relationshipHandlers = [
  // Database services endpoint
  http.get('/api/v2/system/service', () => {
    return HttpResponse.json({
      resource: mockDatabaseServices,
      meta: { count: mockDatabaseServices.length },
    });
  }),

  // Table fields endpoint
  http.get('/api/v2/:service/_schema/:table', ({ params }) => {
    const { service, table } = params;
    let fields = mockTableFields;
    
    // Return different fields based on table name for realistic testing
    if (table === 'roles') {
      fields = mockReferenceFields;
    } else if (table === 'user_roles') {
      fields = mockJunctionFields;
    }
    
    return HttpResponse.json({
      field: fields,
      meta: { count: fields.length },
    });
  }),

  // Table listing endpoint for junction table selection
  http.get('/api/v2/:service/_schema', ({ params }) => {
    const tables = [
      { name: 'users', label: 'Users' },
      { name: 'roles', label: 'Roles' },
      { name: 'user_roles', label: 'User Roles Junction' },
      { name: 'categories', label: 'Categories' },
    ];
    
    return HttpResponse.json({
      resource: tables,
      meta: { count: tables.length },
    });
  }),

  // Relationship creation endpoint
  http.post('/api/v2/:service/_schema/:table/_related', async ({ request, params }) => {
    const body = await request.json() as RelationshipFormData;
    const { service, table } = params;
    
    // Simulate validation errors for testing
    if (!body.alias) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Validation failed',
            details: {
              alias: ['Relationship alias is required'],
            },
          },
        },
        { status: 400 }
      );
    }
    
    // Simulate successful creation with response timing under 2 seconds
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay for realistic testing
    
    return HttpResponse.json({
      alias: body.alias,
      label: body.label,
      description: body.description,
      type: body.type,
      field: body.field,
      ref_service_id: body.refServiceId,
      ref_table: body.refTable,
      ref_field: body.refField,
      junction_service_id: body.junctionServiceId,
      junction_table: body.junctionTable,
      junction_field: body.junctionField,
      junction_ref_field: body.junctionRefField,
      always_fetch: body.alwaysFetch,
    });
  }),

  // Relationship update endpoint
  http.put('/api/v2/:service/_schema/:table/_related/:alias', async ({ request, params }) => {
    const body = await request.json() as RelationshipFormData;
    const { service, table, alias } = params;
    
    // Simulate update delay for performance testing
    await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay
    
    return HttpResponse.json({
      alias: body.alias,
      label: body.label,
      description: body.description,
      type: body.type,
      field: body.field,
      ref_service_id: body.refServiceId,
      ref_table: body.refTable,
      ref_field: body.refField,
      junction_service_id: body.junctionServiceId,
      junction_table: body.junctionTable,
      junction_field: body.junctionField,
      junction_ref_field: body.junctionRefField,
      always_fetch: body.alwaysFetch,
    });
  }),

  // Error response handler for testing error scenarios
  http.post('/api/v2/error-test/_schema/test/_related', () => {
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Internal server error',
          details: 'Database connection failed',
        },
      },
      { status: 500 }
    );
  }),
];

/**
 * Test wrapper component with React Query provider
 * Replaces Angular TestBed module configuration
 */
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retry for faster test execution
        staleTime: 0, // Ensure fresh data for each test
        gcTime: 0, // Disable garbage collection delay
      },
      mutations: {
        retry: false,
      },
    },
  })
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
};

/**
 * Custom render function with providers
 * Replaces Angular TestBed.createComponent() pattern
 */
const renderWithProviders = (
  ui: React.ReactElement,
  options: {
    queryClient?: QueryClient;
    [key: string]: any;
  } = {}
) => {
  const { queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>
        {children}
      </TestWrapper>
    ),
    ...renderOptions,
  });
};

/**
 * Performance testing utility for validation timing
 * Ensures real-time validation under 100ms per requirements
 */
const measureValidationPerformance = async (
  callback: () => Promise<void> | void
): Promise<number> => {
  const startTime = performance.now();
  await callback();
  const endTime = performance.now();
  return endTime - startTime;
};

/**
 * Setup and teardown for each test
 * Replicates Angular beforeEach/afterEach patterns
 */
describe('RelationshipForm Component', () => {
  let queryClient: QueryClient;
  let mockOnSubmit: Mock;
  let mockOnCancel: Mock;

  beforeEach(() => {
    // Setup MSW handlers for this test suite
    server.use(...relationshipHandlers);
    
    // Create fresh QueryClient for each test to prevent cache interference
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Create mock functions for form callbacks
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();

    // Mock console.error to suppress expected validation error messages
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
    
    // Clear React Query cache
    queryClient.clear();
    
    // Reset MSW handlers to default state
    server.resetHandlers();
    
    // Restore console.error
    vi.restoreAllMocks();
  });

  /**
   * Basic component rendering and initialization tests
   * Validates component mounts correctly with proper form structure
   */
  describe('Component Rendering and Initialization', () => {
    it('should render the relationship form with all required fields', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Verify form structure is rendered
      expect(screen.getByRole('form')).toBeInTheDocument();
      
      // Verify all required form fields are present
      expect(screen.getByLabelText(/relationship alias/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/relationship label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/local field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference service/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/always fetch/i)).toBeInTheDocument();

      // Verify action buttons are present
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should initialize with default form values for create mode', () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Verify default values
      const aliasInput = screen.getByLabelText(/relationship alias/i) as HTMLInputElement;
      const typeSelect = screen.getByLabelText(/relationship type/i) as HTMLSelectElement;
      const alwaysFetchCheckbox = screen.getByLabelText(/always fetch/i) as HTMLInputElement;

      expect(aliasInput.value).toBe('');
      expect(typeSelect.value).toBe('belongs_to'); // Default relationship type
      expect(alwaysFetchCheckbox.checked).toBe(false); // Default always fetch state
    });

    it('should populate form with existing data in edit mode', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="edit"
          serviceId="test-service"
          tableName="test-table"
          initialData={existingRelationshipData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Wait for form to populate with existing data
      await waitFor(() => {
        const aliasInput = screen.getByLabelText(/relationship alias/i) as HTMLInputElement;
        expect(aliasInput.value).toBe(existingRelationshipData.alias);
      });

      // Verify all fields are populated correctly
      const labelInput = screen.getByLabelText(/relationship label/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      const typeSelect = screen.getByLabelText(/relationship type/i) as HTMLSelectElement;

      expect(labelInput.value).toBe(existingRelationshipData.label);
      expect(descriptionInput.value).toBe(existingRelationshipData.description);
      expect(typeSelect.value).toBe(existingRelationshipData.type);
    });

    it('should render with proper WCAG 2.1 AA accessibility attributes', () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Verify form has proper accessibility attributes
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', expect.stringMatching(/relationship/i));

      // Verify required fields have proper aria-required attribute
      const aliasInput = screen.getByLabelText(/relationship alias/i);
      expect(aliasInput).toHaveAttribute('aria-required', 'true');

      // Verify error containers have proper aria-live attributes for screen readers
      const errorContainers = screen.getAllByRole('alert');
      errorContainers.forEach(container => {
        expect(container).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  /**
   * Form validation testing with Zod schema integration
   * Validates comprehensive input validation per React/Next.js Integration Requirements
   */
  describe('Form Validation with Zod Schema', () => {
    it('should show validation errors for required fields when submitted empty', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText(/relationship alias is required/i)).toBeInTheDocument();
      });

      // Verify multiple validation errors are displayed
      expect(screen.getByText(/relationship label is required/i)).toBeInTheDocument();
      expect(screen.getByText(/local field is required/i)).toBeInTheDocument();
      expect(screen.getByText(/reference service is required/i)).toBeInTheDocument();

      // Verify onSubmit was not called due to validation errors
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate alias field for proper format and uniqueness', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      const aliasInput = screen.getByLabelText(/relationship alias/i);

      // Test invalid characters
      await user.type(aliasInput, 'invalid-alias!@#');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/alias can only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });

      // Test valid alias format
      await user.clear(aliasInput);
      await user.type(aliasInput, 'valid_alias_123');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/alias can only contain letters, numbers, and underscores/i)).not.toBeInTheDocument();
      });
    });

    it('should validate field dependencies for belongs_to relationships', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in basic required fields
      await user.type(screen.getByLabelText(/relationship alias/i), 'test_relation');
      await user.type(screen.getByLabelText(/relationship label/i), 'Test Relation');
      
      // Select belongs_to type (should be default)
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, 'belongs_to');

      // Try to submit without reference service
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reference service is required/i)).toBeInTheDocument();
        expect(screen.getByText(/reference table is required/i)).toBeInTheDocument();
        expect(screen.getByText(/reference field is required/i)).toBeInTheDocument();
      });

      // Verify junction fields are not required for belongs_to
      expect(screen.queryByText(/junction service is required/i)).not.toBeInTheDocument();
    });

    it('should validate junction table requirements for many_many relationships', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in basic required fields
      await user.type(screen.getByLabelText(/relationship alias/i), 'many_relation');
      await user.type(screen.getByLabelText(/relationship label/i), 'Many Relation');
      
      // Select many_many type
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, 'many_many');

      // Wait for dynamic fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
      });

      // Try to submit without junction fields
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/junction service is required for many-to-many relationships/i)).toBeInTheDocument();
      });
    });

    it('should perform real-time validation under 100ms performance requirement', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      const aliasInput = screen.getByLabelText(/relationship alias/i);

      // Measure validation performance
      const validationTime = await measureValidationPerformance(async () => {
        await user.type(aliasInput, 'test_alias');
        await user.tab(); // Trigger validation
        
        // Wait for validation to complete
        await waitFor(() => {
          expect(screen.queryByText(/relationship alias is required/i)).not.toBeInTheDocument();
        }, { timeout: 100 }); // Ensure validation completes within 100ms
      });

      // Verify validation performance meets requirements
      expect(validationTime).toBeLessThan(100); // Real-time validation under 100ms
    });
  });

  /**
   * Dynamic field behavior testing
   * Validates field enabling/disabling based on relationship type per business logic
   */
  describe('Dynamic Field Behavior Based on Relationship Type', () => {
    it('should disable junction fields when relationship type is belongs_to', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Select belongs_to type (should be default)
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, 'belongs_to');

      // Verify junction fields are not visible or are disabled
      await waitFor(() => {
        expect(screen.queryByLabelText(/junction service/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/junction table/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/junction field/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/junction reference field/i)).not.toBeInTheDocument();
      });

      // Verify core relationship fields are still enabled
      expect(screen.getByLabelText(/local field/i)).toBeEnabled();
      expect(screen.getByLabelText(/reference service/i)).toBeEnabled();
      expect(screen.getByLabelText(/reference table/i)).toBeEnabled();
      expect(screen.getByLabelText(/reference field/i)).toBeEnabled();
    });

    it('should enable junction fields when relationship type is many_many', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Select many_many type
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, 'many_many');

      // Wait for junction fields to appear and be enabled
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/junction service/i)).toBeEnabled();
      });

      // Verify all junction fields are present and initially in correct state
      expect(screen.getByLabelText(/junction table/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/junction field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/junction reference field/i)).toBeInTheDocument();

      // Junction table should be disabled until junction service is selected
      expect(screen.getByLabelText(/junction table/i)).toBeDisabled();
      expect(screen.getByLabelText(/junction field/i)).toBeDisabled();
      expect(screen.getByLabelText(/junction reference field/i)).toBeDisabled();
    });

    it('should enable junction table when junction service is selected', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Select many_many type
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, 'many_many');

      // Wait for junction service to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
      });

      // Select a junction service
      const junctionServiceSelect = screen.getByLabelText(/junction service/i);
      await user.selectOptions(junctionServiceSelect, '1');

      // Wait for junction table to be enabled
      await waitFor(() => {
        expect(screen.getByLabelText(/junction table/i)).toBeEnabled();
      });

      // Junction fields should still be disabled until table is selected
      expect(screen.getByLabelText(/junction field/i)).toBeDisabled();
      expect(screen.getByLabelText(/junction reference field/i)).toBeDisabled();
    });

    it('should enable junction fields when junction table is selected', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Select many_many type
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, 'many_many');

      // Wait for junction service to appear and select it
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
      });
      
      const junctionServiceSelect = screen.getByLabelText(/junction service/i);
      await user.selectOptions(junctionServiceSelect, '1');

      // Wait for junction table to be enabled and select it
      await waitFor(() => {
        expect(screen.getByLabelText(/junction table/i)).toBeEnabled();
      });
      
      const junctionTableSelect = screen.getByLabelText(/junction table/i);
      await user.selectOptions(junctionTableSelect, 'user_roles');

      // Wait for junction fields to be enabled
      await waitFor(() => {
        expect(screen.getByLabelText(/junction field/i)).toBeEnabled();
        expect(screen.getByLabelText(/junction reference field/i)).toBeEnabled();
      });
    });

    it('should clear junction field values when switching from many_many to belongs_to', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      const typeSelect = screen.getByLabelText(/relationship type/i);

      // Start with many_many and fill junction fields
      await user.selectOptions(typeSelect, 'many_many');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
      });

      // Fill junction service
      const junctionServiceSelect = screen.getByLabelText(/junction service/i);
      await user.selectOptions(junctionServiceSelect, '1');

      // Switch back to belongs_to
      await user.selectOptions(typeSelect, 'belongs_to');

      // Verify junction fields are hidden/cleared
      await waitFor(() => {
        expect(screen.queryByLabelText(/junction service/i)).not.toBeInTheDocument();
      });

      // Switch back to many_many to verify fields are cleared
      await user.selectOptions(typeSelect, 'many_many');
      
      await waitFor(() => {
        const junctionServiceAfterSwitch = screen.getByLabelText(/junction service/i) as HTMLSelectElement;
        expect(junctionServiceAfterSwitch.value).toBe(''); // Should be cleared
      });
    });
  });

  /**
   * Form submission and API integration testing
   * Validates MSW integration and proper form submission handling
   */
  describe('Form Submission and API Integration', () => {
    it('should submit valid belongs_to relationship data successfully', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in valid belongs_to relationship data
      await user.type(screen.getByLabelText(/relationship alias/i), validBelongsToData.alias!);
      await user.type(screen.getByLabelText(/relationship label/i), validBelongsToData.label!);
      await user.type(screen.getByLabelText(/description/i), validBelongsToData.description!);
      
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, validBelongsToData.type!);

      await user.type(screen.getByLabelText(/local field/i), validBelongsToData.field!);
      
      const refServiceSelect = screen.getByLabelText(/reference service/i);
      await user.selectOptions(refServiceSelect, validBelongsToData.refServiceId!.toString());

      await user.type(screen.getByLabelText(/reference table/i), validBelongsToData.refTable!);
      await user.type(screen.getByLabelText(/reference field/i), validBelongsToData.refField!);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Wait for form submission to complete
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            alias: validBelongsToData.alias,
            label: validBelongsToData.label,
            description: validBelongsToData.description,
            type: validBelongsToData.type,
            field: validBelongsToData.field,
            refServiceId: validBelongsToData.refServiceId,
            refTable: validBelongsToData.refTable,
            refField: validBelongsToData.refField,
            alwaysFetch: validBelongsToData.alwaysFetch,
          })
        );
      });
    });

    it('should submit valid many_many relationship data successfully', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in valid many_many relationship data
      await user.type(screen.getByLabelText(/relationship alias/i), validManyManyData.alias!);
      await user.type(screen.getByLabelText(/relationship label/i), validManyManyData.label!);
      await user.type(screen.getByLabelText(/description/i), validManyManyData.description!);
      
      const typeSelect = screen.getByLabelText(/relationship type/i);
      await user.selectOptions(typeSelect, validManyManyData.type!);

      // Wait for junction fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/local field/i), validManyManyData.field!);
      
      const refServiceSelect = screen.getByLabelText(/reference service/i);
      await user.selectOptions(refServiceSelect, validManyManyData.refServiceId!.toString());

      await user.type(screen.getByLabelText(/reference table/i), validManyManyData.refTable!);
      await user.type(screen.getByLabelText(/reference field/i), validManyManyData.refField!);

      // Fill junction fields
      const junctionServiceSelect = screen.getByLabelText(/junction service/i);
      await user.selectOptions(junctionServiceSelect, validManyManyData.junctionServiceId!.toString());

      await waitFor(() => {
        expect(screen.getByLabelText(/junction table/i)).toBeEnabled();
      });

      await user.type(screen.getByLabelText(/junction table/i), validManyManyData.junctionTable!);

      await waitFor(() => {
        expect(screen.getByLabelText(/junction field/i)).toBeEnabled();
      });

      await user.type(screen.getByLabelText(/junction field/i), validManyManyData.junctionField!);
      await user.type(screen.getByLabelText(/junction reference field/i), validManyManyData.junctionRefField!);

      // Enable always fetch
      const alwaysFetchCheckbox = screen.getByLabelText(/always fetch/i);
      await user.click(alwaysFetchCheckbox);

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Wait for form submission to complete
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            alias: validManyManyData.alias,
            label: validManyManyData.label,
            type: validManyManyData.type,
            junctionServiceId: validManyManyData.junctionServiceId,
            junctionTable: validManyManyData.junctionTable,
            junctionField: validManyManyData.junctionField,
            junctionRefField: validManyManyData.junctionRefField,
            alwaysFetch: true,
          })
        );
      });
    });

    it('should handle API errors gracefully during form submission', async () => {
      const user = userEvent.setup();
      
      // Set up error handler for testing
      server.use(
        http.post('/api/v2/test-service/_schema/test-table/_related', () => {
          return HttpResponse.json(
            {
              error: {
                code: 500,
                message: 'Internal server error',
                details: 'Database connection failed',
              },
            },
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/relationship alias/i), 'test_relation');
      await user.type(screen.getByLabelText(/relationship label/i), 'Test Relation');
      await user.type(screen.getByLabelText(/local field/i), 'test_field');
      
      const refServiceSelect = screen.getByLabelText(/reference service/i);
      await user.selectOptions(refServiceSelect, '1');

      await user.type(screen.getByLabelText(/reference table/i), 'test_table');
      await user.type(screen.getByLabelText(/reference field/i), 'id');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
      });

      // Verify onSubmit was not called due to API error
      expect(mockOnSubmit).not.toHaveBeenCalled();

      // Verify form remains editable after error
      expect(screen.getByLabelText(/relationship alias/i)).toBeEnabled();
      expect(submitButton).toBeEnabled();
    });

    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in minimal valid data
      await user.type(screen.getByLabelText(/relationship alias/i), 'test_relation');
      await user.type(screen.getByLabelText(/relationship label/i), 'Test Relation');
      await user.type(screen.getByLabelText(/local field/i), 'test_field');
      
      const refServiceSelect = screen.getByLabelText(/reference service/i);
      await user.selectOptions(refServiceSelect, '1');

      await user.type(screen.getByLabelText(/reference table/i), 'test_table');
      await user.type(screen.getByLabelText(/reference field/i), 'id');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Verify loading state is shown immediately
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('should handle form cancellation correctly', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in some data
      await user.type(screen.getByLabelText(/relationship alias/i), 'test_relation');
      await user.type(screen.getByLabelText(/relationship label/i), 'Test Relation');

      // Click cancel button
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify onCancel was called
      expect(mockOnCancel).toHaveBeenCalled();

      // Verify onSubmit was not called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  /**
   * User interaction and accessibility testing
   * Validates proper user experience and WCAG 2.1 AA compliance
   */
  describe('User Interactions and Accessibility', () => {
    it('should support keyboard navigation through form fields', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      const aliasInput = screen.getByLabelText(/relationship alias/i);
      
      // Focus first field
      aliasInput.focus();
      expect(document.activeElement).toBe(aliasInput);

      // Tab through fields
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/relationship label/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/description/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/relationship type/i));

      // Continue tabbing through remaining fields
      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/local field/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/reference service/i));
    });

    it('should announce validation errors to screen readers', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Submit empty form to trigger validation errors
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/relationship alias is required/i)).toBeInTheDocument();
      });

      // Verify error messages have proper aria-live attributes
      const errorMessages = screen.getAllByRole('alert');
      errorMessages.forEach(error => {
        expect(error).toHaveAttribute('aria-live', 'polite');
      });

      // Verify form fields are associated with error messages
      const aliasInput = screen.getByLabelText(/relationship alias/i);
      const aliasError = screen.getByText(/relationship alias is required/i);
      
      expect(aliasInput).toHaveAttribute('aria-describedby', expect.stringContaining(aliasError.id));
    });

    it('should provide clear focus indicators for all interactive elements', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Test focus indicators on form fields
      const aliasInput = screen.getByLabelText(/relationship alias/i);
      await user.click(aliasInput);
      
      // Verify focus styles are applied (would be tested with visual regression in full implementation)
      expect(aliasInput).toHaveFocus();
      expect(aliasInput).toHaveClass('focus:ring-2'); // Tailwind focus class

      // Test focus indicators on buttons
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.tab(); // Navigate to button
      // The button should receive focus through keyboard navigation
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.tab(); // Navigate to cancel button
      // The cancel button should receive focus through keyboard navigation
    });

    it('should maintain form state during component re-renders', async () => {
      const user = userEvent.setup();
      
      const { rerender } = renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Fill in some form data
      await user.type(screen.getByLabelText(/relationship alias/i), 'persistent_alias');
      await user.type(screen.getByLabelText(/relationship label/i), 'Persistent Label');

      // Re-render component with same props
      rerender(
        <TestWrapper queryClient={queryClient}>
          <RelationshipForm
            mode="create"
            serviceId="test-service"
            tableName="test-table"
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Verify form state is maintained
      const aliasInput = screen.getByLabelText(/relationship alias/i) as HTMLInputElement;
      const labelInput = screen.getByLabelText(/relationship label/i) as HTMLInputElement;

      expect(aliasInput.value).toBe('persistent_alias');
      expect(labelInput.value).toBe('Persistent Label');
    });
  });

  /**
   * Performance and optimization testing
   * Validates component performance meets React/Next.js Integration Requirements
   */
  describe('Performance and Optimization', () => {
    it('should render initial component within acceptable time limits', async () => {
      const renderStartTime = performance.now();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Wait for component to be fully rendered
      await waitFor(() => {
        expect(screen.getByRole('form')).toBeInTheDocument();
      });

      const renderEndTime = performance.now();
      const renderTime = renderEndTime - renderStartTime;

      // Verify component renders quickly (under 100ms for good UX)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently in select dropdowns', async () => {
      // Mock large dataset for services
      const largeServiceDataset = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        name: `service-${index + 1}`,
        label: `Service ${index + 1}`,
        type: 'mysql',
      }));

      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({
            resource: largeServiceDataset,
            meta: { count: largeServiceDataset.length },
          });
        })
      );

      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      // Wait for services to load
      await waitFor(() => {
        const refServiceSelect = screen.getByLabelText(/reference service/i);
        expect(refServiceSelect).toBeEnabled();
      });

      // Measure time to open dropdown with large dataset
      const dropdownOpenTime = await measureValidationPerformance(async () => {
        const refServiceSelect = screen.getByLabelText(/reference service/i);
        await user.click(refServiceSelect);
      });

      // Verify dropdown opens quickly even with large dataset
      expect(dropdownOpenTime).toBeLessThan(200); // Should open within 200ms
    });

    it('should optimize re-renders when form values change', async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      // Component with render counter
      const TestRelationshipForm = (props: any) => {
        renderCount++;
        return <RelationshipForm {...props} />;
      };
      
      renderWithProviders(
        <TestRelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      const initialRenderCount = renderCount;

      // Type in alias field
      const aliasInput = screen.getByLabelText(/relationship alias/i);
      await user.type(aliasInput, 'test');

      // Verify renders are optimized (React Hook Form should minimize re-renders)
      const finalRenderCount = renderCount;
      const additionalRenders = finalRenderCount - initialRenderCount;

      // Should not re-render for every keystroke (React Hook Form optimization)
      expect(additionalRenders).toBeLessThan(10); // Allow some re-renders but not excessive
    });

    it('should efficiently handle relationship type switching', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          serviceId="test-service"
          tableName="test-table"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />,
        { queryClient }
      );

      const typeSelect = screen.getByLabelText(/relationship type/i);

      // Measure time to switch relationship types
      const switchTime = await measureValidationPerformance(async () => {
        // Switch from belongs_to to many_many
        await user.selectOptions(typeSelect, 'many_many');
        
        // Wait for junction fields to appear
        await waitFor(() => {
          expect(screen.getByLabelText(/junction service/i)).toBeInTheDocument();
        });

        // Switch back to belongs_to
        await user.selectOptions(typeSelect, 'belongs_to');
        
        // Wait for junction fields to disappear
        await waitFor(() => {
          expect(screen.queryByLabelText(/junction service/i)).not.toBeInTheDocument();
        });
      });

      // Verify type switching is performant
      expect(switchTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});