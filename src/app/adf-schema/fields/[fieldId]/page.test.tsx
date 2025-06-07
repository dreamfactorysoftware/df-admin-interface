/**
 * Field Edit Page Component Test Suite
 * 
 * Comprehensive Vitest test suite for the field editing page component using React Testing Library
 * and Mock Service Worker for API mocking. Tests field form validation, data fetching, user interactions,
 * and error scenarios with comprehensive coverage for all field types and attributes.
 * 
 * This test suite migrates from Angular TestBed configuration to Vitest with React Testing Library setup,
 * replacing HttpClientTestingModule with MSW for realistic API mocking and enhanced testing performance.
 * 
 * Test Coverage Areas:
 * - React Hook Form validation and submission testing
 * - All DatabaseSchemaFieldType values and attributes
 * - Next.js dynamic routing navigation with field ID parameter handling
 * - MSW integration for field management API testing scenarios
 * - Performance testing for React Hook Form validation and field type handling
 * - TanStack React Query caching and invalidation testing patterns
 * - WCAG 2.1 AA accessibility compliance validation
 * - Error boundary and loading state testing
 * - Comprehensive user interaction workflows
 * 
 * Performance Requirements:
 * - Test suite execution under 10 seconds (10x faster than Jest/Karma)
 * - Form validation response time under 100ms
 * - 90%+ code coverage for comprehensive test validation
 * - Memory usage optimization for large schema testing scenarios
 * 
 * @fileoverview Field edit page component comprehensive test suite
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Vitest 2.1.0
 */

import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi, beforeAll, type Mock } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import { QueryClient } from '@tanstack/react-query';

// Test utilities and providers
import { 
  renderWithProviders, 
  renderWithForm, 
  renderWithQuery,
  accessibilityUtils,
  headlessUIUtils,
  testUtils,
  middlewareUtils
} from '../../../../test/utils/test-utils';

// Component under test
import FieldEditPage from './page';

// Type definitions and schemas
import type { 
  DatabaseSchemaFieldType,
  FieldFormData,
  FieldDataType,
  ReferentialAction,
  FunctionUseOperation,
  TableReference
} from '../field.types';

// Mock data and utilities
import { 
  createFieldMockData,
  createTableReferenceMockData,
  createFieldFormMockData
} from '../../../../test/utils/component-factories';

// MSW handlers for field management
import { rest } from 'msw';
import { server } from '../../../../test/mocks/server';

// Performance measurement utilities
import { measureTestPerformance } from '../../../../test/utils/performance-helpers';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => '/adf-schema/fields/test-field-id'),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock React Hook Form for specific test scenarios
const mockFormMethods = {
  register: vi.fn(),
  handleSubmit: vi.fn(),
  watch: vi.fn(),
  setValue: vi.fn(),
  getValues: vi.fn(),
  trigger: vi.fn(),
  reset: vi.fn(),
  clearErrors: vi.fn(),
  setError: vi.fn(),
  formState: {
    errors: {},
    isValid: true,
    isSubmitting: false,
    isDirty: false,
    isLoading: false,
    isSubmitted: false,
    isValidating: false,
    touchedFields: {},
    dirtyFields: {},
    validatingFields: {},
    defaultValues: {},
  },
  control: {} as any,
};

// =============================================================================
// TEST DATA FACTORIES AND MOCK DATA
// =============================================================================

/**
 * Comprehensive field test data covering all DatabaseSchemaFieldType scenarios
 */
const createMockFieldData = (overrides: Partial<DatabaseSchemaFieldType> = {}): DatabaseSchemaFieldType => ({
  name: 'test_field',
  label: 'Test Field',
  alias: null,
  description: 'Test field description',
  type: 'string',
  dbType: 'VARCHAR(255)',
  length: 255,
  precision: null,
  scale: 0,
  fixedLength: false,
  supportsMultibyte: false,
  required: false,
  allowNull: true,
  isPrimaryKey: false,
  isForeignKey: false,
  isUnique: false,
  autoIncrement: false,
  isVirtual: false,
  isAggregate: false,
  default: null,
  validation: null,
  picklist: null,
  refTable: null,
  refField: null,
  refOnDelete: null,
  refOnUpdate: null,
  dbFunction: null,
  native: null,
  value: [],
  ...overrides,
});

/**
 * Mock form data for all field types and configurations
 */
const createMockFormData = (overrides: Partial<FieldFormData> = {}): FieldFormData => ({
  name: 'test_field',
  label: 'Test Field',
  alias: '',
  description: 'Test field description',
  typeSelection: 'predefined',
  type: 'string',
  dbType: 'VARCHAR(255)',
  manualType: '',
  length: 255,
  precision: undefined,
  scale: 0,
  fixedLength: false,
  supportsMultibyte: false,
  required: false,
  allowNull: true,
  isPrimaryKey: false,
  isForeignKey: false,
  isUnique: false,
  autoIncrement: false,
  isVirtual: false,
  isAggregate: false,
  default: '',
  hasDefaultValue: false,
  enableValidation: false,
  validationRules: undefined,
  enablePicklist: false,
  picklistType: 'csv',
  picklistValues: '',
  picklistOptions: [],
  referenceTable: '',
  referenceField: '',
  onDeleteAction: 'RESTRICT',
  onUpdateAction: 'RESTRICT',
  enableDbFunctions: false,
  dbFunctions: [],
  ...overrides,
});

/**
 * Mock table references for foreign key testing
 */
const createMockTableReferences = (): TableReference[] => [
  {
    name: 'users',
    label: 'Users',
    fields: [
      createMockFieldData({ name: 'id', type: 'id', isPrimaryKey: true }),
      createMockFieldData({ name: 'email', type: 'string', required: true }),
      createMockFieldData({ name: 'name', type: 'string' }),
    ],
    schema: 'public',
  },
  {
    name: 'roles',
    label: 'Roles',
    fields: [
      createMockFieldData({ name: 'id', type: 'id', isPrimaryKey: true }),
      createMockFieldData({ name: 'name', type: 'string', required: true }),
      createMockFieldData({ name: 'permissions', type: 'json' }),
    ],
    schema: 'public',
  },
];

/**
 * All field type test scenarios for comprehensive coverage
 */
const allFieldTypes: FieldDataType[] = [
  'id', 'string', 'integer', 'text', 'boolean', 'binary',
  'float', 'double', 'decimal', 'datetime', 'date', 'time',
  'timestamp', 'timestamp_on_create', 'timestamp_on_update',
  'user_id', 'user_id_on_create', 'user_id_on_update',
  'reference', 'json', 'xml', 'uuid', 'blob', 'clob',
  'geometry', 'point', 'linestring', 'polygon', 'enum', 'set'
];

/**
 * Referential action test scenarios
 */
const allReferentialActions: ReferentialAction[] = [
  'CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION', 'SET DEFAULT'
];

/**
 * Function use operation test scenarios
 */
const allFunctionUseOperations: FunctionUseOperation[] = [
  'SELECT', 'FILTER', 'INSERT', 'UPDATE'
];

// =============================================================================
// MSW API HANDLERS FOR FIELD MANAGEMENT TESTING
// =============================================================================

/**
 * MSW handlers for comprehensive field management API testing
 */
const fieldApiHandlers = [
  // Get field details
  rest.get('/api/v2/:service/_schema/:table/:fieldId', (req, res, ctx) => {
    const { service, table, fieldId } = req.params;
    
    if (fieldId === 'non-existent-field') {
      return res(
        ctx.status(404),
        ctx.json({
          error: { code: 404, message: 'Field not found' }
        })
      );
    }

    if (fieldId === 'error-field') {
      return res(
        ctx.status(500),
        ctx.json({
          error: { code: 500, message: 'Internal server error' }
        })
      );
    }

    const mockField = createMockFieldData({
      name: fieldId as string,
      label: `${fieldId} Field`,
      type: fieldId === 'foreign-key-field' ? 'reference' : 'string',
      isForeignKey: fieldId === 'foreign-key-field',
      refTable: fieldId === 'foreign-key-field' ? 'users' : null,
      refField: fieldId === 'foreign-key-field' ? 'id' : null,
    });

    return res(
      ctx.status(200),
      ctx.json({
        resource: [mockField]
      })
    );
  }),

  // Update field
  rest.patch('/api/v2/:service/_schema/:table/:fieldId', (req, res, ctx) => {
    const { fieldId } = req.params;
    
    if (fieldId === 'readonly-field') {
      return res(
        ctx.status(403),
        ctx.json({
          error: { code: 403, message: 'Field is read-only and cannot be modified' }
        })
      );
    }

    if (fieldId === 'validation-error-field') {
      return res(
        ctx.status(422),
        ctx.json({
          error: { 
            code: 422, 
            message: 'Validation failed',
            details: {
              name: ['Field name must be unique'],
              length: ['Length must be greater than 0']
            }
          }
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        resource: [createMockFieldData({ name: fieldId as string })]
      })
    );
  }),

  // Get table references for foreign key configuration
  rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
    const service = req.params.service;
    
    if (service === 'error-service') {
      return res(
        ctx.status(500),
        ctx.json({
          error: { code: 500, message: 'Failed to fetch schema' }
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        resource: [
          {
            name: 'users',
            label: 'Users',
            access: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            field: [
              createMockFieldData({ name: 'id', type: 'id', isPrimaryKey: true }),
              createMockFieldData({ name: 'email', type: 'string', required: true }),
              createMockFieldData({ name: 'name', type: 'string' }),
            ]
          },
          {
            name: 'roles',
            label: 'Roles', 
            access: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            field: [
              createMockFieldData({ name: 'id', type: 'id', isPrimaryKey: true }),
              createMockFieldData({ name: 'name', type: 'string', required: true }),
            ]
          }
        ]
      })
    );
  }),

  // Test database connection
  rest.post('/api/v2/system/service/test', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Connection successful'
      })
    );
  }),
];

// =============================================================================
// TEST SUITE SETUP AND CONFIGURATION
// =============================================================================

describe('FieldEditPage Component', () => {
  let mockRouter: {
    push: Mock;
    replace: Mock;
    back: Mock;
    refresh: Mock;
    prefetch: Mock;
  };

  let mockParams: {
    service: string;
    table: string;
    fieldId: string;
  };

  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Add field management API handlers to MSW server
    server.use(...fieldApiHandlers);
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock router
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    };

    // Setup mock params
    mockParams = {
      service: 'test-db',
      table: 'test-table',
      fieldId: 'test-field-id',
    };

    // Setup React Query client with optimized settings for testing
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    // Setup user event
    user = userEvent.setup();

    // Configure Next.js navigation mocks
    (useRouter as Mock).mockReturnValue(mockRouter);
    (useParams as Mock).mockReturnValue(mockParams);
  });

  afterEach(() => {
    // Clear query client cache
    queryClient.clear();
    
    // Reset MSW handlers
    server.resetHandlers();
  });

  // =============================================================================
  // COMPONENT RENDERING AND BASIC FUNCTIONALITY TESTS
  // =============================================================================

  describe('Component Rendering', () => {
    test('renders field edit form with loading state initially', async () => {
      const { container } = renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      // Check initial loading state
      expect(screen.getByTestId('field-edit-loading')).toBeInTheDocument();
      
      // Verify accessibility of loading state
      expect(screen.getByTestId('field-edit-loading')).toHaveAttribute('aria-live', 'polite');
      expect(screen.getByTestId('field-edit-loading')).toHaveAttribute('aria-label', 'Loading field data');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Verify form accessibility
      expect(screen.getByTestId('field-edit-form')).toHaveAttribute('role', 'form');
      expect(screen.getByTestId('field-edit-form')).toHaveAttribute('aria-label', 'Edit field configuration');
      
      // Check container has proper structure
      expect(container.firstChild).toHaveClass('field-edit-page');
    });

    test('renders error state when field data fails to load', async () => {
      mockParams.fieldId = 'error-field';
      (useParams as Mock).mockReturnValue(mockParams);

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-error')).toBeInTheDocument();
      });

      // Verify error message accessibility
      expect(screen.getByTestId('field-edit-error')).toHaveAttribute('role', 'alert');
      expect(screen.getByTestId('field-edit-error')).toHaveAttribute('aria-live', 'assertive');
      
      // Check error message content
      expect(screen.getByText(/failed to load field data/i)).toBeInTheDocument();
      
      // Verify retry button is present and accessible
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    test('renders not found state for non-existent field', async () => {
      mockParams.fieldId = 'non-existent-field';
      (useParams as Mock).mockReturnValue(mockParams);

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-not-found')).toBeInTheDocument();
      });

      // Verify not found message
      expect(screen.getByText(/field not found/i)).toBeInTheDocument();
      
      // Check navigation options
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view all fields/i })).toBeInTheDocument();
    });

    test('handles navigation parameters correctly', () => {
      const customParams = {
        service: 'custom-service',
        table: 'custom-table',
        fieldId: 'custom-field',
      };
      
      (useParams as Mock).mockReturnValue(customParams);

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      // Verify the component uses the correct parameters for API calls
      expect(useParams).toHaveBeenCalled();
      
      // Check that the service and table info is displayed
      expect(screen.getByText(new RegExp(customParams.service, 'i'))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(customParams.table, 'i'))).toBeInTheDocument();
    });
  });

  // =============================================================================
  // FORM FIELD TESTING AND VALIDATION
  // =============================================================================

  describe('Form Field Testing', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });
    });

    test('validates required field name input', async () => {
      const nameInput = screen.getByLabelText(/field name/i);
      
      // Clear the field name
      await user.clear(nameInput);
      await user.tab();

      // Check validation error appears
      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
      });

      // Verify error message accessibility
      const errorMessage = screen.getByText(/field name is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });

    test('validates field name format and reserved words', async () => {
      const nameInput = screen.getByLabelText(/field name/i);

      // Test invalid format
      await user.clear(nameInput);
      await user.type(nameInput, '123invalid');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/field name must start with a letter/i)).toBeInTheDocument();
      });

      // Test reserved word
      await user.clear(nameInput);
      await user.type(nameInput, 'id');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/field name conflicts with system reserved words/i)).toBeInTheDocument();
      });

      // Test valid name
      await user.clear(nameInput);
      await user.type(nameInput, 'valid_field_name');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/field name/i)).not.toBeInTheDocument();
      });
    });

    test('validates field label requirements', async () => {
      const labelInput = screen.getByLabelText(/field label/i);

      // Test empty label
      await user.clear(labelInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/field label is required/i)).toBeInTheDocument();
      });

      // Test label too long
      await user.clear(labelInput);
      await user.type(labelInput, 'a'.repeat(256));
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/field label must be 255 characters or less/i)).toBeInTheDocument();
      });

      // Test valid label
      await user.clear(labelInput);
      await user.type(labelInput, 'Valid Field Label');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/field label/i)).not.toBeInTheDocument();
      });
    });

    test('handles field type selection and type-specific options', async () => {
      const typeSelect = screen.getByLabelText(/field type/i);

      // Test string type selection
      await user.selectOptions(typeSelect, 'string');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument();
      });

      // Test decimal type selection
      await user.selectOptions(typeSelect, 'decimal');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
      });

      // Test reference type selection
      await user.selectOptions(typeSelect, 'reference');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument();
      });
    });

    test('validates numeric constraints for length and precision', async () => {
      const typeSelect = screen.getByLabelText(/field type/i);
      
      // Select decimal type to show precision/scale fields
      await user.selectOptions(typeSelect, 'decimal');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
      });

      const precisionInput = screen.getByLabelText(/precision/i);
      const scaleInput = screen.getByLabelText(/scale/i);

      // Test invalid precision
      await user.clear(precisionInput);
      await user.type(precisionInput, '0');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/precision must be at least 1/i)).toBeInTheDocument();
      });

      // Test scale greater than precision
      await user.clear(precisionInput);
      await user.type(precisionInput, '5');
      await user.clear(scaleInput);
      await user.type(scaleInput, '10');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/scale cannot be greater than precision/i)).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // COMPREHENSIVE FIELD TYPE TESTING
  // =============================================================================

  describe('All Field Types Testing', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });
    });

    test.each(allFieldTypes)('handles %s field type configuration', async (fieldType) => {
      const typeSelect = screen.getByLabelText(/field type/i);
      
      await user.selectOptions(typeSelect, fieldType);
      
      // Wait for type-specific fields to appear
      await waitFor(() => {
        expect(typeSelect).toHaveValue(fieldType);
      });

      // Verify type-specific fields are shown/hidden correctly
      switch (fieldType) {
        case 'string':
        case 'text':
          expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
          expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument();
          break;
          
        case 'decimal':
        case 'float':
        case 'double':
          expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
          if (fieldType === 'decimal') {
            expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
          }
          break;
          
        case 'reference':
          expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
          expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument();
          break;
          
        case 'id':
          expect(screen.getByLabelText(/auto increment/i)).toBeChecked();
          expect(screen.getByLabelText(/primary key/i)).toBeChecked();
          break;
          
        case 'timestamp_on_create':
        case 'timestamp_on_update':
          expect(screen.queryByLabelText(/default value/i)).not.toBeInTheDocument();
          break;
      }

      // Verify accessibility attributes
      expect(typeSelect).toHaveAttribute('aria-label');
      expect(typeSelect).not.toHaveAttribute('aria-invalid');
    });

    test('validates field type constraints and compatibility', async () => {
      const typeSelect = screen.getByLabelText(/field type/i);
      const primaryKeyCheckbox = screen.getByLabelText(/primary key/i);
      const allowNullCheckbox = screen.getByLabelText(/allow null/i);

      // Test primary key constraint
      await user.check(primaryKeyCheckbox);
      
      await waitFor(() => {
        expect(allowNullCheckbox).not.toBeChecked();
        expect(allowNullCheckbox).toBeDisabled();
      });

      // Test auto-increment with non-numeric type
      await user.selectOptions(typeSelect, 'string');
      const autoIncrementCheckbox = screen.getByLabelText(/auto increment/i);
      
      await user.check(autoIncrementCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText(/auto increment is only available for numeric types/i)).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // FOREIGN KEY AND RELATIONSHIP TESTING
  // =============================================================================

  describe('Foreign Key Configuration', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Set up foreign key field
      const typeSelect = screen.getByLabelText(/field type/i);
      await user.selectOptions(typeSelect, 'reference');
      
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await user.check(foreignKeyCheckbox);
    });

    test('loads and displays available reference tables', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
      });

      const tableSelect = screen.getByLabelText(/reference table/i);
      
      // Verify tables are loaded
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /users/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /roles/i })).toBeInTheDocument();
      });
    });

    test('loads reference fields when table is selected', async () => {
      const tableSelect = screen.getByLabelText(/reference table/i);
      
      await user.selectOptions(tableSelect, 'users');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument();
      });

      const fieldSelect = screen.getByLabelText(/reference field/i);
      
      // Verify fields are loaded for selected table
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /id/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /email/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /name/i })).toBeInTheDocument();
      });
    });

    test.each(allReferentialActions)('handles %s referential action', async (action) => {
      const onDeleteSelect = screen.getByLabelText(/on delete action/i);
      const onUpdateSelect = screen.getByLabelText(/on update action/i);

      await user.selectOptions(onDeleteSelect, action);
      await user.selectOptions(onUpdateSelect, action);

      expect(onDeleteSelect).toHaveValue(action);
      expect(onUpdateSelect).toHaveValue(action);

      // Verify help text is updated for the selected action
      await waitFor(() => {
        const helpText = screen.getByText(new RegExp(action, 'i'));
        expect(helpText).toBeInTheDocument();
      });
    });

    test('validates foreign key configuration requirements', async () => {
      const tableSelect = screen.getByLabelText(/reference table/i);
      const fieldSelect = screen.getByLabelText(/reference field/i);

      // Try to submit without selecting table
      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reference table must be specified/i)).toBeInTheDocument();
      });

      // Select table but not field
      await user.selectOptions(tableSelect, 'users');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reference field must be specified/i)).toBeInTheDocument();
      });

      // Complete configuration
      await user.selectOptions(fieldSelect, 'id');
      
      // Should no longer show validation errors
      await waitFor(() => {
        expect(screen.queryByText(/reference table must be specified/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/reference field must be specified/i)).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // DATABASE FUNCTION TESTING
  // =============================================================================

  describe('Database Function Configuration', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Enable database functions
      const enableFunctionsCheckbox = screen.getByLabelText(/enable database functions/i);
      await user.check(enableFunctionsCheckbox);
    });

    test('adds and removes database function configurations', async () => {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add function/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add function/i });
      
      // Add first function
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/function expression/i)).toBeInTheDocument();
      });

      // Add second function
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/function expression/i)).toHaveLength(2);
      });

      // Remove first function
      const removeButtons = screen.getAllByRole('button', { name: /remove function/i });
      await user.click(removeButtons[0]);
      
      await waitFor(() => {
        expect(screen.getAllByLabelText(/function expression/i)).toHaveLength(1);
      });
    });

    test.each(allFunctionUseOperations)('configures %s function operation', async (operation) => {
      const addButton = screen.getByRole('button', { name: /add function/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/function expression/i)).toBeInTheDocument();
      });

      const operationCheckbox = screen.getByLabelText(new RegExp(operation, 'i'));
      await user.check(operationCheckbox);

      expect(operationCheckbox).toBeChecked();

      // Verify help text for operation
      const helpText = screen.getByText(new RegExp(`apply function during ${operation.toLowerCase()}`, 'i'));
      expect(helpText).toBeInTheDocument();
    });

    test('validates function expression syntax', async () => {
      const addButton = screen.getByRole('button', { name: /add function/i });
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/function expression/i)).toBeInTheDocument();
      });

      const functionInput = screen.getByLabelText(/function expression/i);
      
      // Test empty function
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/function expression is required/i)).toBeInTheDocument();
      });

      // Test valid function
      await user.type(functionInput, 'UPPER({field})');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/function expression is required/i)).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // VALIDATION AND PICKLIST TESTING
  // =============================================================================

  describe('Validation and Picklist Configuration', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });
    });

    test('configures field validation rules', async () => {
      const enableValidationCheckbox = screen.getByLabelText(/enable validation/i);
      await user.check(enableValidationCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/minimum length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/maximum length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/pattern/i)).toBeInTheDocument();
      });

      // Configure string validation
      const minLengthInput = screen.getByLabelText(/minimum length/i);
      const maxLengthInput = screen.getByLabelText(/maximum length/i);
      const patternInput = screen.getByLabelText(/pattern/i);

      await user.type(minLengthInput, '5');
      await user.type(maxLengthInput, '50');
      await user.type(patternInput, '^[A-Za-z]+$');

      expect(minLengthInput).toHaveValue(5);
      expect(maxLengthInput).toHaveValue(50);
      expect(patternInput).toHaveValue('^[A-Za-z]+$');
    });

    test('validates validation rule constraints', async () => {
      const enableValidationCheckbox = screen.getByLabelText(/enable validation/i);
      await user.check(enableValidationCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/minimum length/i)).toBeInTheDocument();
      });

      const minLengthInput = screen.getByLabelText(/minimum length/i);
      const maxLengthInput = screen.getByLabelText(/maximum length/i);

      // Test max length less than min length
      await user.type(minLengthInput, '50');
      await user.type(maxLengthInput, '10');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/maximum length must be greater than or equal to minimum length/i)).toBeInTheDocument();
      });
    });

    test('configures picklist values', async () => {
      const enablePicklistCheckbox = screen.getByLabelText(/enable picklist/i);
      await user.check(enablePicklistCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/picklist type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/picklist values/i)).toBeInTheDocument();
      });

      // Test CSV format
      const typeSelect = screen.getByLabelText(/picklist type/i);
      await user.selectOptions(typeSelect, 'csv');

      const valuesInput = screen.getByLabelText(/picklist values/i);
      await user.type(valuesInput, 'Option 1,Option 2,Option 3');

      expect(valuesInput).toHaveValue('Option 1,Option 2,Option 3');

      // Test JSON format
      await user.selectOptions(typeSelect, 'json');
      await user.clear(valuesInput);
      await user.type(valuesInput, '["Option 1","Option 2","Option 3"]');

      expect(valuesInput).toHaveValue('["Option 1","Option 2","Option 3"]');
    });

    test('validates picklist value format', async () => {
      const enablePicklistCheckbox = screen.getByLabelText(/enable picklist/i);
      await user.check(enablePicklistCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/picklist values/i)).toBeInTheDocument();
      });

      const typeSelect = screen.getByLabelText(/picklist type/i);
      const valuesInput = screen.getByLabelText(/picklist values/i);

      // Test invalid JSON format
      await user.selectOptions(typeSelect, 'json');
      await user.type(valuesInput, 'invalid json');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument();
      });

      // Test valid JSON format
      await user.clear(valuesInput);
      await user.type(valuesInput, '["valid","json"]');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid json format/i)).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // FORM SUBMISSION AND ERROR HANDLING
  // =============================================================================

  describe('Form Submission and Error Handling', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });
    });

    test('submits valid field configuration successfully', async () => {
      // Fill out form with valid data
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'new_field_name');
      await user.clear(labelInput);
      await user.type(labelInput, 'New Field Label');
      await user.type(descriptionInput, 'Field description');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });

      // Check success state
      await waitFor(() => {
        expect(screen.getByText(/field saved successfully/i)).toBeInTheDocument();
      });

      // Verify navigation back to field list
      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/fields');
    });

    test('handles validation errors from server', async () => {
      mockParams.fieldId = 'validation-error-field';
      (useParams as Mock).mockReturnValue(mockParams);

      // Submit form to trigger validation error
      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
        expect(screen.getByText(/field name must be unique/i)).toBeInTheDocument();
        expect(screen.getByText(/length must be greater than 0/i)).toBeInTheDocument();
      });

      // Verify form fields show error states
      const nameInput = screen.getByLabelText(/field name/i);
      const lengthInput = screen.getByLabelText(/length/i);

      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(lengthInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('handles server errors gracefully', async () => {
      mockParams.fieldId = 'readonly-field';
      (useParams as Mock).mockReturnValue(mockParams);

      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/field is read-only and cannot be modified/i)).toBeInTheDocument();
      });

      // Verify error alert accessibility
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    });

    test('prevents submission when form is invalid', async () => {
      const nameInput = screen.getByLabelText(/field name/i);
      
      // Clear required field
      await user.clear(nameInput);
      
      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      // Button should remain enabled (not submit)
      expect(submitButton).not.toBeDisabled();
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // PERFORMANCE AND OPTIMIZATION TESTING
  // =============================================================================

  describe('Performance and Optimization', () => {
    test('form validation completes within performance requirements', async () => {
      const performanceTest = measureTestPerformance('form-validation', async () => {
        renderWithQuery(<FieldEditPage />, {
          queryClient,
          providerOptions: {
            router: mockRouter,
          },
        });

        await waitFor(() => {
          expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
        });

        const nameInput = screen.getByLabelText(/field name/i);
        
        // Trigger validation
        const startTime = performance.now();
        await user.type(nameInput, 'test_field');
        await user.tab();
        const endTime = performance.now();

        // Validation should complete within 100ms
        expect(endTime - startTime).toBeLessThan(100);
      });

      const duration = await performanceTest();
      expect(duration).toBeLessThan(1000); // Overall test should complete in under 1 second
    });

    test('handles large schema data efficiently', async () => {
      // Mock large schema response
      server.use(
        rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
          const largeTables = Array.from({ length: 100 }, (_, i) => ({
            name: `table_${i}`,
            label: `Table ${i}`,
            access: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            field: Array.from({ length: 50 }, (_, j) => 
              createMockFieldData({ 
                name: `field_${j}`, 
                type: 'string',
                label: `Field ${j}`
              })
            )
          }));

          return res(
            ctx.status(200),
            ctx.json({ resource: largeTables })
          );
        })
      );

      const startTime = performance.now();
      
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Enable foreign key to trigger schema loading
      const typeSelect = screen.getByLabelText(/field type/i);
      await user.selectOptions(typeSelect, 'reference');
      
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await user.check(foreignKeyCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      
      // Should handle large data sets efficiently
      expect(endTime - startTime).toBeLessThan(3000);
    });

    test('optimizes React Query cache usage', async () => {
      // Pre-populate cache
      queryClient.setQueryData(['field', 'test-db', 'test-table', 'test-field-id'], 
        createMockFieldData({ name: 'cached_field' })
      );

      const startTime = performance.now();

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      // Should load immediately from cache
      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      const endTime = performance.now();
      
      // Cache hit should be very fast
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  // =============================================================================
  // ACCESSIBILITY TESTING
  // =============================================================================

  describe('Accessibility Compliance', () => {
    beforeEach(async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });
    });

    test('meets WCAG 2.1 AA compliance requirements', async () => {
      const form = screen.getByTestId('field-edit-form');
      
      // Test basic accessibility requirements
      expect(accessibilityUtils.hasAriaLabel(form)).toBe(true);
      expect(accessibilityUtils.isKeyboardAccessible(form)).toBe(true);
      
      // Test all form fields have proper labels
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        expect(accessibilityUtils.hasAriaLabel(input as HTMLElement)).toBe(true);
      });
    });

    test('supports keyboard navigation throughout form', async () => {
      const form = screen.getByTestId('field-edit-form');
      
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(form, user);
      
      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
      
      // Verify tab order is logical
      const focusableElements = accessibilityUtils.getFocusableElements(form);
      expect(focusableElements.length).toBeGreaterThan(5); // Should have multiple focusable elements
    });

    test('provides proper error announcements for screen readers', async () => {
      const nameInput = screen.getByLabelText(/field name/i);
      
      // Trigger validation error
      await user.clear(nameInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/field name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });

      // Verify input has aria-invalid
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });

    test('maintains focus management in dynamic content', async () => {
      const enableFunctionsCheckbox = screen.getByLabelText(/enable database functions/i);
      await user.check(enableFunctionsCheckbox);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add function/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /add function/i });
      await user.click(addButton);

      await waitFor(() => {
        const functionInput = screen.getByLabelText(/function expression/i);
        expect(functionInput).toBeInTheDocument();
        
        // Focus should be managed properly
        expect(document.activeElement).toBe(functionInput);
      });
    });

    test('provides sufficient color contrast and text sizing', async () => {
      const form = screen.getByTestId('field-edit-form');
      const allElements = form.querySelectorAll('*');
      
      // Test color contrast for text elements
      Array.from(allElements).forEach(element => {
        if (element.textContent && element.textContent.trim()) {
          expect(accessibilityUtils.hasAdequateContrast(element as HTMLElement)).toBe(true);
        }
      });
    });
  });

  // =============================================================================
  // NAVIGATION AND ROUTING TESTING
  // =============================================================================

  describe('Navigation and Routing', () => {
    test('navigates back to field list on cancel', async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    test('shows unsaved changes warning on navigation', async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Make changes to form
      const nameInput = screen.getByLabelText(/field name/i);
      await user.type(nameInput, '_modified');

      // Try to navigate away
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue editing/i })).toBeInTheDocument();
      });
    });

    test('handles invalid field ID parameter', async () => {
      mockParams.fieldId = '';
      (useParams as Mock).mockReturnValue(mockParams);

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid field identifier/i)).toBeInTheDocument();
      });
    });

    test('updates URL when field name changes', async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/field name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'new_field_name');

      // Submit to save
      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining('new_field_name')
        );
      });
    });
  });

  // =============================================================================
  // REACT QUERY INTEGRATION TESTING
  // =============================================================================

  describe('React Query Integration', () => {
    test('invalidates related queries on successful update', async () => {
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/field saved successfully/i)).toBeInTheDocument();
      });

      // Verify cache invalidation
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['fields', 'test-db', 'test-table']
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['schema', 'test-db', 'test-table']
      });
    });

    test('handles optimistic updates correctly', async () => {
      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      const labelInput = screen.getByLabelText(/field label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Updated Label');

      // Check optimistic update in cache
      const cachedData = queryClient.getQueryData(['field', 'test-db', 'test-table', 'test-field-id']);
      expect(cachedData).toBeDefined();
    });

    test('shows stale data indicator when appropriate', async () => {
      // Set stale time to 0 to force stale state
      queryClient.setQueryDefaults(['field'], { staleTime: 0 });

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      // Wait for data to become stale
      await waitFor(() => {
        expect(screen.getByTestId('stale-data-indicator')).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // ERROR BOUNDARY TESTING
  // =============================================================================

  describe('Error Boundary Testing', () => {
    test('catches and displays field loading errors', async () => {
      // Mock console.error to prevent test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Force an error by using invalid service
      mockParams.service = 'error-service';
      (useParams as Mock).mockReturnValue(mockParams);

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Verify error boundary UI
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    test('recovers from errors when retry is clicked', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Start with error
      mockParams.service = 'error-service';
      (useParams as Mock).mockReturnValue(mockParams);

      renderWithQuery(<FieldEditPage />, {
        queryClient,
        providerOptions: {
          router: mockRouter,
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Fix the error condition
      mockParams.service = 'test-db';
      (useParams as Mock).mockReturnValue(mockParams);

      // Click retry
      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('field-edit-form')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});