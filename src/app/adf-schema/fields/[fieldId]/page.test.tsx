/**
 * Comprehensive Vitest Test Suite for Field Editing Page Component
 * 
 * This test suite validates the React/Next.js implementation of the database field 
 * editing interface, covering field form validation, data fetching, user interactions, 
 * and error scenarios with comprehensive coverage for all field types and attributes.
 * 
 * Key Testing Objectives:
 * - Convert Angular TestBed configuration to Vitest with React Testing Library setup
 * - Replace HttpClientTestingModule with Mock Service Worker (MSW) for API mocking
 * - Transform Angular ComponentFixture testing to React Testing Library patterns
 * - Implement React Hook Form testing scenarios with form validation and submission
 * - Add React Query caching and invalidation testing patterns with MSW integration
 * - Test Next.js dynamic routing navigation with field ID parameter handling
 * - Convert Angular form control testing to React Hook Form field validation testing
 * 
 * Performance Targets:
 * - 10x faster test execution with Vitest 2.1.0
 * - React Hook Form validation under 100ms
 * - 90%+ code coverage for comprehensive test validation
 * - Real-time validation testing for all DatabaseSchemaFieldType values
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../test/mocks/server';

// Import the component under test
import FieldEditPage from './page';

// Import types and test utilities
import type { 
  DatabaseSchemaFieldType, 
  FieldFormData, 
  DreamFactoryFieldType,
  DbFunctionUseType,
  FieldValidationError 
} from '../field.types';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
  notFound: vi.fn(),
}));

// Mock React Hook Form for validation testing
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: vi.fn(() => ({
      control: {},
      handleSubmit: vi.fn((fn) => fn),
      formState: { 
        errors: {}, 
        isSubmitting: false, 
        isValid: true,
        isDirty: false,
        touchedFields: {},
        dirtyFields: {},
      },
      setValue: vi.fn(),
      getValues: vi.fn(),
      reset: vi.fn(),
      watch: vi.fn(),
      trigger: vi.fn(),
      clearErrors: vi.fn(),
      setError: vi.fn(),
    })),
    Controller: ({ render }: any) => render({ field: { value: '', onChange: vi.fn() } }),
  };
});

// Mock Zod schema validation
vi.mock('zod', () => ({
  z: {
    string: () => ({
      min: () => ({ max: () => ({ optional: () => ({}) }) }),
      email: () => ({ optional: () => ({}) }),
      url: () => ({ optional: () => ({}) }),
      regex: () => ({ optional: () => ({}) }),
      optional: () => ({}),
    }),
    number: () => ({
      min: () => ({ max: () => ({ optional: () => ({}) }) }),
      positive: () => ({ optional: () => ({}) }),
      int: () => ({ optional: () => ({}) }),
      optional: () => ({}),
    }),
    boolean: () => ({ optional: () => ({}) }),
    array: () => ({ optional: () => ({}) }),
    object: () => ({ optional: () => ({}) }),
    enum: () => ({ optional: () => ({}) }),
    union: () => ({ optional: () => ({}) }),
    literal: () => ({ optional: () => ({}) }),
    nullable: () => ({ optional: () => ({}) }),
    preprocess: () => ({ optional: () => ({}) }),
  },
}));

/**
 * Mock Field Data Factory for Testing All Field Types
 * Generates realistic field data covering all DatabaseSchemaFieldType properties
 */
const createMockField = (overrides: Partial<DatabaseSchemaFieldType> = {}): DatabaseSchemaFieldType => ({
  name: 'test_field',
  alias: null,
  label: 'Test Field',
  description: 'Test field description',
  type: 'string' as DreamFactoryFieldType,
  dbType: 'varchar',
  length: 255,
  precision: null,
  scale: 0,
  default: null,
  allowNull: true,
  autoIncrement: false,
  fixedLength: false,
  supportsMultibyte: true,
  isAggregate: false,
  isForeignKey: false,
  isPrimaryKey: false,
  isUnique: false,
  isVirtual: false,
  required: false,
  refTable: null,
  refField: null,
  refOnUpdate: null,
  refOnDelete: null,
  picklist: null,
  validation: null,
  dbFunction: null,
  native: [],
  value: [],
  ...overrides,
});

/**
 * Field Type Test Data Generator
 * Creates comprehensive test scenarios for all DreamFactory field types
 */
const generateFieldTypeTestData = (): Array<{
  fieldType: DreamFactoryFieldType;
  mockData: Partial<DatabaseSchemaFieldType>;
  formDefaults: Partial<FieldFormData>;
  validationTests: Array<{ input: any; expectedValid: boolean; description: string }>;
}> => {
  return [
    {
      fieldType: 'string',
      mockData: { type: 'string', dbType: 'varchar', length: 255 },
      formDefaults: { type: 'string', length: 255, allowNull: true },
      validationTests: [
        { input: 'Valid string', expectedValid: true, description: 'Valid string input' },
        { input: '', expectedValid: true, description: 'Empty string when allowNull is true' },
        { input: 'A'.repeat(256), expectedValid: false, description: 'String exceeding length limit' },
      ],
    },
    {
      fieldType: 'integer',
      mockData: { type: 'integer', dbType: 'int', length: 11 },
      formDefaults: { type: 'integer', length: 11, scale: 0 },
      validationTests: [
        { input: 42, expectedValid: true, description: 'Valid integer' },
        { input: 0, expectedValid: true, description: 'Zero value' },
        { input: -123, expectedValid: true, description: 'Negative integer' },
        { input: 'not_a_number', expectedValid: false, description: 'Non-numeric string' },
        { input: 3.14, expectedValid: false, description: 'Decimal value for integer field' },
      ],
    },
    {
      fieldType: 'boolean',
      mockData: { type: 'boolean', dbType: 'tinyint' },
      formDefaults: { type: 'boolean', default: false },
      validationTests: [
        { input: true, expectedValid: true, description: 'Boolean true' },
        { input: false, expectedValid: true, description: 'Boolean false' },
        { input: 'true', expectedValid: true, description: 'String "true"' },
        { input: 'false', expectedValid: true, description: 'String "false"' },
        { input: 1, expectedValid: true, description: 'Numeric 1' },
        { input: 0, expectedValid: true, description: 'Numeric 0' },
        { input: 'invalid', expectedValid: false, description: 'Invalid boolean string' },
      ],
    },
    {
      fieldType: 'datetime',
      mockData: { type: 'datetime', dbType: 'datetime' },
      formDefaults: { type: 'datetime', default: null },
      validationTests: [
        { input: '2024-01-15 10:30:00', expectedValid: true, description: 'Valid datetime string' },
        { input: '2024-01-15', expectedValid: true, description: 'Valid date string' },
        { input: 'CURRENT_TIMESTAMP', expectedValid: true, description: 'Database function' },
        { input: 'invalid-date', expectedValid: false, description: 'Invalid date format' },
        { input: '2024-13-45', expectedValid: false, description: 'Invalid date values' },
      ],
    },
    {
      fieldType: 'decimal',
      mockData: { type: 'decimal', dbType: 'decimal', precision: 10, scale: 2 },
      formDefaults: { type: 'decimal', precision: 10, scale: 2 },
      validationTests: [
        { input: 123.45, expectedValid: true, description: 'Valid decimal' },
        { input: '123.45', expectedValid: true, description: 'Valid decimal string' },
        { input: 0, expectedValid: true, description: 'Zero decimal' },
        { input: -123.45, expectedValid: true, description: 'Negative decimal' },
        { input: 12345678.123, expectedValid: false, description: 'Exceeds precision' },
        { input: 'not_a_number', expectedValid: false, description: 'Non-numeric string' },
      ],
    },
    {
      fieldType: 'email',
      mockData: { type: 'email', dbType: 'varchar', length: 320 },
      formDefaults: { type: 'email', length: 320, validation: '^[^@]+@[^@]+\\.[^@]+$' },
      validationTests: [
        { input: 'user@example.com', expectedValid: true, description: 'Valid email' },
        { input: 'test.email+tag@example.co.uk', expectedValid: true, description: 'Complex valid email' },
        { input: 'invalid.email', expectedValid: false, description: 'Missing @ symbol' },
        { input: '@example.com', expectedValid: false, description: 'Missing local part' },
        { input: 'user@', expectedValid: false, description: 'Missing domain' },
      ],
    },
    {
      fieldType: 'text',
      mockData: { type: 'text', dbType: 'text' },
      formDefaults: { type: 'text', length: null },
      validationTests: [
        { input: 'Short text', expectedValid: true, description: 'Short text' },
        { input: 'A'.repeat(10000), expectedValid: true, description: 'Long text content' },
        { input: '', expectedValid: true, description: 'Empty text when allowNull is true' },
      ],
    },
  ];
};

/**
 * Database Function Usage Test Data
 * Mock data for testing function usage configurations
 */
const createMockDbFunction = (overrides: Partial<DbFunctionUseType> = {}): DbFunctionUseType => ({
  use: ['insert', 'update'],
  function: 'NOW()',
  ...overrides,
});

/**
 * Test Component Wrapper with React Query and Form Providers
 * Provides necessary providers for isolated testing environment
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Helper function to render component with all required providers
 */
const renderWithProviders = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('FieldEditPage Component', () => {
  // Mock implementations for Next.js navigation
  const mockPush = vi.fn();
  const mockReplace = vi.fn();
  const mockBack = vi.fn();
  const mockRefresh = vi.fn();

  // Test field data for different scenarios
  const mockStringField = createMockField({
    name: 'username',
    type: 'string',
    dbType: 'varchar',
    length: 50,
    required: true,
    isUnique: true,
    validation: '^[a-zA-Z0-9_]+$',
  });

  const mockIntegerField = createMockField({
    name: 'age',
    type: 'integer',
    dbType: 'int',
    length: 11,
    allowNull: true,
    default: 0,
  });

  const mockForeignKeyField = createMockField({
    name: 'user_id',
    type: 'integer',
    dbType: 'int',
    length: 11,
    isForeignKey: true,
    refTable: 'users',
    refField: 'id',
    refOnDelete: 'CASCADE',
    refOnUpdate: 'CASCADE',
  });

  const mockDateTimeField = createMockField({
    name: 'created_at',
    type: 'datetime',
    dbType: 'datetime',
    default: 'CURRENT_TIMESTAMP',
    dbFunction: [createMockDbFunction({ use: ['insert'], function: 'NOW()' })],
  });

  beforeAll(() => {
    // Setup MSW handlers for field management API endpoints
    server.use(
      // Field detail retrieval endpoint
      http.get('/api/v2/:serviceName/_schema/:tableName/:fieldName', ({ params }) => {
        const { serviceName, tableName, fieldName } = params;
        
        // Return different mock data based on field name for testing
        let fieldData: DatabaseSchemaFieldType;
        
        switch (fieldName) {
          case 'username':
            fieldData = mockStringField;
            break;
          case 'age':
            fieldData = mockIntegerField;
            break;
          case 'user_id':
            fieldData = mockForeignKeyField;
            break;
          case 'created_at':
            fieldData = mockDateTimeField;
            break;
          case 'nonexistent_field':
            return HttpResponse.json(
              { error: { code: 404, message: 'Field not found' } },
              { status: 404 }
            );
          default:
            fieldData = mockStringField;
        }
        
        return HttpResponse.json({
          resource: [fieldData],
          meta: { count: 1 },
        });
      }),

      // Field update endpoint
      http.patch('/api/v2/:serviceName/_schema/:tableName/:fieldName', async ({ request, params }) => {
        const body = await request.json();
        const { fieldName } = params;
        
        // Simulate validation error for testing
        if (body.name === 'invalid_field_name') {
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'Invalid field name',
                details: { name: ['Field name contains invalid characters'] },
              },
            },
            { status: 400 }
          );
        }

        // Simulate server error for testing
        if (fieldName === 'error_field') {
          return HttpResponse.json(
            {
              error: {
                code: 500,
                message: 'Internal server error',
              },
            },
            { status: 500 }
          );
        }

        return HttpResponse.json({
          success: true,
          message: `Field ${fieldName} updated successfully`,
          resource: { ...mockStringField, ...body },
        });
      }),

      // Field deletion endpoint
      http.delete('/api/v2/:serviceName/_schema/:tableName/:fieldName', ({ params }) => {
        const { fieldName } = params;
        
        if (fieldName === 'protected_field') {
          return HttpResponse.json(
            {
              error: {
                code: 403,
                message: 'Cannot delete protected field',
              },
            },
            { status: 403 }
          );
        }

        return HttpResponse.json({
          success: true,
          message: `Field ${fieldName} deleted successfully`,
        });
      }),

      // Related tables endpoint for foreign key testing
      http.get('/api/v2/:serviceName/_schema', () => {
        return HttpResponse.json({
          resource: [
            { name: 'users', label: 'Users' },
            { name: 'profiles', label: 'User Profiles' },
            { name: 'orders', label: 'Orders' },
          ],
        });
      }),

      // Table fields endpoint for reference field dropdown
      http.get('/api/v2/:serviceName/_schema/:tableName', ({ params }) => {
        const { tableName } = params;
        
        const fields = {
          users: [
            { name: 'id', type: 'id' },
            { name: 'username', type: 'string' },
            { name: 'email', type: 'email' },
          ],
          profiles: [
            { name: 'id', type: 'id' },
            { name: 'user_id', type: 'integer' },
            { name: 'display_name', type: 'string' },
          ],
        };

        return HttpResponse.json({
          resource: fields[tableName as keyof typeof fields] || [],
        });
      }),

      // Field validation endpoint for real-time validation
      http.post('/api/v2/:serviceName/_schema/:tableName/_validate_field', async ({ request }) => {
        const body = await request.json();
        const validationErrors: FieldValidationError[] = [];

        // Simulate field validation logic
        if (body.name === '') {
          validationErrors.push({
            path: ['name'],
            message: 'Field name is required',
            code: 'required',
          });
        }

        if (body.name && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(body.name)) {
          validationErrors.push({
            path: ['name'],
            message: 'Field name must start with a letter and contain only letters, numbers, and underscores',
            code: 'invalid_format',
          });
        }

        if (body.type === 'string' && (!body.length || body.length <= 0)) {
          validationErrors.push({
            path: ['length'],
            message: 'String fields must have a positive length',
            code: 'invalid_length',
          });
        }

        if (body.type === 'decimal' && (!body.precision || body.precision <= 0)) {
          validationErrors.push({
            path: ['precision'],
            message: 'Decimal fields must have a positive precision',
            code: 'invalid_precision',
          });
        }

        return HttpResponse.json({
          isValid: validationErrors.length === 0,
          errors: validationErrors,
          timestamp: Date.now(),
          fieldName: body.name,
        });
      }),

      // Error scenario endpoints
      http.get('/api/v2/error-service/_schema/error-table/error-field', () => {
        return HttpResponse.json(
          { error: { code: 500, message: 'Internal server error' } },
          { status: 500 }
        );
      }),

      http.get('/api/v2/network-error/_schema/test-table/test-field', () => {
        return HttpResponse.error();
      }),
    );
  });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementations
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      refresh: mockRefresh,
      prefetch: vi.fn(),
    });

    (useParams as any).mockReturnValue({
      service: 'test-service',
      table: 'test-table',
      fieldId: 'username',
    });
  });

  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  describe('Component Rendering and Initial State', () => {
    it('should render the field editing page with correct heading', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /edit field/i })).toBeInTheDocument();
      });

      expect(screen.getByText(/username/i)).toBeInTheDocument();
      expect(screen.getByText(/configure field properties/i)).toBeInTheDocument();
    });

    it('should display loading state during initial field data fetch', () => {
      renderWithProviders(<FieldEditPage />);

      expect(screen.getByTestId('field-edit-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading field data/i)).toBeInTheDocument();
    });

    it('should display field breadcrumb navigation', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb-navigation')).toBeInTheDocument();
      });

      expect(screen.getByText('test-service')).toBeInTheDocument();
      expect(screen.getByText('test-table')).toBeInTheDocument();
      expect(screen.getByText('username')).toBeInTheDocument();
    });

    it('should render field form with all essential input fields', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/field label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/allow null/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/required/i)).toBeInTheDocument();
    });

    it('should populate form fields with existing field data', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('username')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Test Field')).toBeInTheDocument();
      expect(screen.getByDisplayValue('string')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });
  });

  describe('React Hook Form Integration and Validation', () => {
    it('should display validation errors in real-time under 100ms', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      const fieldNameInput = screen.getByLabelText(/field name/i);
      
      // Clear the field and enter invalid data
      await user.clear(fieldNameInput);
      await user.type(fieldNameInput, '123invalid');

      // Verify real-time validation occurs quickly
      const startTime = performance.now();
      
      await waitFor(() => {
        expect(screen.getByText(/field name must start with a letter/i)).toBeInTheDocument();
      });

      const validationTime = performance.now() - startTime;
      expect(validationTime).toBeLessThan(100); // Under 100ms requirement
    });

    it('should validate required fields and display appropriate errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      const fieldNameInput = screen.getByLabelText(/field name/i);
      
      // Clear required field
      await user.clear(fieldNameInput);
      await user.tab(); // Trigger blur event

      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('field-name-error')).toHaveClass('text-red-600');
    });

    it('should validate field length constraints based on field type', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
      });

      const lengthInput = screen.getByLabelText(/length/i);
      
      // Enter invalid length
      await user.clear(lengthInput);
      await user.type(lengthInput, '0');

      await waitFor(() => {
        expect(screen.getByText(/string fields must have a positive length/i)).toBeInTheDocument();
      });
    });

    it('should validate decimal precision and scale for numeric fields', async () => {
      // Switch to integer field to test precision validation
      (useParams as any).mockReturnValue({
        service: 'test-service',
        table: 'test-table',
        fieldId: 'age',
      });

      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field type/i)).toBeInTheDocument();
      });

      // Change to decimal type
      const typeSelect = screen.getByLabelText(/field type/i);
      await user.selectOptions(typeSelect, 'decimal');

      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
      });

      const precisionInput = screen.getByLabelText(/precision/i);
      await user.clear(precisionInput);
      await user.type(precisionInput, '0');

      await waitFor(() => {
        expect(screen.getByText(/decimal fields must have a positive precision/i)).toBeInTheDocument();
      });
    });

    it('should validate email format for email field types', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field type/i)).toBeInTheDocument();
      });

      // Change to email type
      const typeSelect = screen.getByLabelText(/field type/i);
      await user.selectOptions(typeSelect, 'email');

      await waitFor(() => {
        expect(screen.getByLabelText(/validation/i)).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue(/\^.*@.*\$/)).toBeInTheDocument(); // Email regex pattern
    });

    it('should clear validation errors when valid data is entered', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      const fieldNameInput = screen.getByLabelText(/field name/i);
      
      // Enter invalid data first
      await user.clear(fieldNameInput);
      await user.type(fieldNameInput, '123invalid');

      await waitFor(() => {
        expect(screen.getByText(/field name must start with a letter/i)).toBeInTheDocument();
      });

      // Enter valid data
      await user.clear(fieldNameInput);
      await user.type(fieldNameInput, 'valid_field_name');

      await waitFor(() => {
        expect(screen.queryByText(/field name must start with a letter/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Field Type-Specific Form Controls', () => {
    generateFieldTypeTestData().forEach(({ fieldType, mockData, formDefaults, validationTests }) => {
      describe(`${fieldType} field type`, () => {
        beforeEach(() => {
          // Mock field data for specific type
          server.use(
            http.get('/api/v2/test-service/_schema/test-table/test-field', () => {
              return HttpResponse.json({
                resource: [createMockField(mockData)],
                meta: { count: 1 },
              });
            })
          );
          
          (useParams as any).mockReturnValue({
            service: 'test-service',
            table: 'test-table',
            fieldId: 'test-field',
          });
        });

        it(`should display correct form controls for ${fieldType} field`, async () => {
          renderWithProviders(<FieldEditPage />);

          await waitFor(() => {
            expect(screen.getByDisplayValue(fieldType)).toBeInTheDocument();
          });

          // Check type-specific controls are visible
          if (fieldType === 'string' || fieldType === 'text') {
            expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
          }
          
          if (fieldType === 'decimal' || fieldType === 'float') {
            expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
          }
          
          if (fieldType === 'integer' || fieldType === 'bigint') {
            expect(screen.getByLabelText(/auto increment/i)).toBeInTheDocument();
          }
        });

        validationTests.forEach(({ input, expectedValid, description }) => {
          it(`should ${expectedValid ? 'accept' : 'reject'} ${description}`, async () => {
            const user = userEvent.setup();
            renderWithProviders(<FieldEditPage />);

            await waitFor(() => {
              expect(screen.getByLabelText(/default value/i)).toBeInTheDocument();
            });

            const defaultValueInput = screen.getByLabelText(/default value/i);
            await user.clear(defaultValueInput);
            await user.type(defaultValueInput, String(input));

            if (!expectedValid) {
              await waitFor(() => {
                expect(screen.getByTestId('default-value-error')).toBeInTheDocument();
              });
            } else {
              await waitFor(() => {
                expect(screen.queryByTestId('default-value-error')).not.toBeInTheDocument();
              });
            }
          });
        });
      });
    });

    it('should show foreign key configuration when isForeignKey is enabled', async () => {
      (useParams as any).mockReturnValue({
        service: 'test-service',
        table: 'test-table',
        fieldId: 'user_id',
      });

      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/is foreign key/i)).toBeInTheDocument();
      });

      const foreignKeyToggle = screen.getByLabelText(/is foreign key/i);
      
      // Should already be checked for user_id field
      expect(foreignKeyToggle).toBeChecked();
      
      // Foreign key configuration should be visible
      expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/on delete action/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/on update action/i)).toBeInTheDocument();
    });

    it('should hide foreign key configuration when isForeignKey is disabled', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/is foreign key/i)).toBeInTheDocument();
      });

      const foreignKeyToggle = screen.getByLabelText(/is foreign key/i);
      
      if (foreignKeyToggle.checked) {
        await user.click(foreignKeyToggle);
      }

      await waitFor(() => {
        expect(screen.queryByLabelText(/reference table/i)).not.toBeInTheDocument();
      });

      expect(screen.queryByLabelText(/reference field/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/on delete action/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/on update action/i)).not.toBeInTheDocument();
    });

    it('should show function usage configuration when dbFunction is configured', async () => {
      (useParams as any).mockReturnValue({
        service: 'test-service',
        table: 'test-table',
        fieldId: 'created_at',
      });

      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByText(/database functions/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('function-usage-table')).toBeInTheDocument();
      expect(screen.getByText('NOW()')).toBeInTheDocument();
      expect(screen.getByText('insert')).toBeInTheDocument();
    });
  });

  describe('Form Submission and Data Persistence', () => {
    it('should submit form data successfully and show success message', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/field updated successfully/i)).toBeInTheDocument();
    });

    it('should handle server validation errors and display them in form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      // Enter invalid field name that will trigger server error
      const fieldNameInput = screen.getByLabelText(/field name/i);
      await user.clear(fieldNameInput);
      await user.type(fieldNameInput, 'invalid_field_name');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid field name/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/field name contains invalid characters/i)).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      (useParams as any).mockReturnValue({
        service: 'test-service',
        table: 'test-table',
        fieldId: 'error_field',
      });

      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Check for loading state immediately after click
      expect(screen.getByTestId('form-submitting')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
      expect(screen.getByText(/saving changes/i)).toBeInTheDocument();
    });

    it('should prevent duplicate submissions while saving', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      
      // Click multiple times rapidly
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);

      // Verify button is disabled and only one request is made
      expect(saveButton).toBeDisabled();
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      });
    });

    it('should track form dirty state and warn about unsaved changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field label/i)).toBeInTheDocument();
      });

      // Modify a field to make form dirty
      const labelInput = screen.getByLabelText(/field label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Modified Label');

      // Check that form is marked as dirty
      expect(screen.getByTestId('form-dirty-indicator')).toBeInTheDocument();
      expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('Field Deletion Functionality', () => {
    it('should show delete confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete field/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should delete field successfully and redirect to field list', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete field/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields?service=test-service&table=test-table');
      });
    });

    it('should handle deletion errors and show appropriate message', async () => {
      (useParams as any).mockReturnValue({
        service: 'test-service',
        table: 'test-table',
        fieldId: 'protected_field',
      });

      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete field/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/cannot delete protected field/i)).toBeInTheDocument();
      });

      expect(screen.getByTestId('deletion-error-message')).toBeInTheDocument();
    });

    it('should cancel deletion when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /delete field/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      });

      // Verify no navigation occurred
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Navigation and Routing', () => {
    it('should navigate back to fields list when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to fields/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /back to fields/i });
      await user.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields?service=test-service&table=test-table');
    });

    it('should navigate to field creation page when duplicate button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /duplicate field/i })).toBeInTheDocument();
      });

      const duplicateButton = screen.getByRole('button', { name: /duplicate field/i });
      await user.click(duplicateButton);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields/new?service=test-service&table=test-table&duplicate=username');
    });

    it('should handle 404 error when field is not found', async () => {
      (useParams as any).mockReturnValue({
        service: 'test-service',
        table: 'test-table',
        fieldId: 'nonexistent_field',
      });

      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('field-not-found')).toBeInTheDocument();
      });

      expect(screen.getByText(/field not found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to fields/i })).toBeInTheDocument();
    });

    it('should update URL parameters when navigating between fields', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByText('test-service')).toBeInTheDocument();
      });

      expect(screen.getByText('test-table')).toBeInTheDocument();
      expect(screen.getByText('username')).toBeInTheDocument();
    });
  });

  describe('React Query Caching and Data Management', () => {
    it('should cache field data and display cache status', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('field-cache-status')).toBeInTheDocument();
      });

      expect(screen.getByText(/cached/i)).toBeInTheDocument();
    });

    it('should invalidate cache after successful update', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('cache-invalidated-indicator')).toBeInTheDocument();
      });
    });

    it('should implement optimistic updates for better user experience', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field label/i)).toBeInTheDocument();
      });

      const labelInput = screen.getByLabelText(/field label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Optimistically Updated Label');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify optimistic update appears immediately
      expect(screen.getByTestId('optimistic-update-active')).toBeInTheDocument();
    });

    it('should handle stale data and background refetch appropriately', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('data-freshness-indicator')).toBeInTheDocument();
      });

      // Simulate stale data scenario
      expect(screen.getByText(/data may be stale/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network connectivity issues gracefully', async () => {
      (useParams as any).mockReturnValue({
        service: 'network-error',
        table: 'test-table',
        fieldId: 'test-field',
      });

      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('network-error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/network error/i)).toBeInTheDocument();
      expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should provide retry functionality after errors', async () => {
      (useParams as any).mockReturnValue({
        service: 'error-service',
        table: 'error-table',
        fieldId: 'error-field',
      });

      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(screen.getByTestId('field-edit-loading')).toBeInTheDocument();
    });

    it('should handle concurrent modification conflicts', async () => {
      // Mock concurrent modification scenario
      server.use(
        http.patch('/api/v2/test-service/_schema/test-table/username', () => {
          return HttpResponse.json(
            {
              error: {
                code: 409,
                message: 'Conflict: Field was modified by another user',
                details: { version: 'outdated' },
              },
            },
            { status: 409 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('conflict-resolution-dialog')).toBeInTheDocument();
      });

      expect(screen.getByText(/field was modified by another user/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload latest version/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /overwrite changes/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and semantic structure', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      expect(screen.getByRole('form')).toHaveAttribute('aria-label', 'Edit field form');
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check form fieldsets have proper labels
      expect(screen.getByRole('group', { name: /basic properties/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /constraints/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /advanced options/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation throughout the form', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      // Test tab navigation through form fields
      await user.tab();
      expect(screen.getByLabelText(/field name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/field label/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/field type/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();
    });

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      const fieldNameInput = screen.getByLabelText(/field name/i);
      await user.clear(fieldNameInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByRole('alert')).toHaveTextContent(/field name is required/i);
    });

    it('should provide clear focus indicators for all interactive elements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      saveButton.focus();

      expect(saveButton).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    it('should maintain focus context during dynamic content changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/is foreign key/i)).toBeInTheDocument();
      });

      const foreignKeyToggle = screen.getByLabelText(/is foreign key/i);
      await user.click(foreignKeyToggle);

      // Check that focus moves to the newly revealed reference table field
      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toHaveFocus();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should render form within performance requirements', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(100); // Initial render under 100ms
    });

    it('should implement debounced validation to reduce API calls', async () => {
      const user = userEvent.setup();
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      });

      const fieldNameInput = screen.getByLabelText(/field name/i);
      
      // Type rapidly to test debouncing
      await user.type(fieldNameInput, 'rapid_typing_test');

      // Verify debounced validation indicator
      await waitFor(() => {
        expect(screen.getByTestId('validation-debounce-indicator')).toHaveTextContent(/debounced/i);
      });
    });

    it('should use React.memo for expensive form sections', async () => {
      renderWithProviders(<FieldEditPage />);

      await waitFor(() => {
        expect(screen.getByTestId('memoized-form-section')).toBeInTheDocument();
      });

      // Verify component render count optimization
      expect(screen.getByTestId('form-section-render-count')).toHaveTextContent('1');
    });

    it('should lazy load complex form components for better initial load', async () => {
      renderWithProviders(<FieldEditPage />);

      // Check that complex components are lazy loaded
      expect(screen.getByTestId('function-usage-lazy-loading')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByTestId('function-usage-loaded')).toBeInTheDocument();
      });
    });
  });
});