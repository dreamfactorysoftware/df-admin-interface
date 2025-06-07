/**
 * @fileoverview Comprehensive Vitest test suite for field creation page component
 * 
 * Tests field creation form rendering, validation workflows, submission handling,
 * error scenarios, and navigation patterns using React Testing Library and Mock Service Worker.
 * Migrated from Angular TestBed patterns to React/Next.js testing infrastructure.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Vitest 2.1.0
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Component and type imports
import FieldCreatePage from './page';
import type { 
  FieldFormData, 
  FieldDataType, 
  DatabaseSchemaFieldType,
  TableReference,
  FieldCreateRequest,
  ReferentialAction,
  FunctionUseOperation
} from '../field.types';

// Testing utilities and mocks
import { renderWithProviders } from '../../../../test/utils/test-utils';
import { createMockDatabaseField, createMockTableReference } from '../../../../test/utils/component-factories';
import { MockAuthProvider, TestQueryProvider } from '../../../../test/utils/mock-providers';
import { createErrorResponse } from '../../../../test/mocks/error-responses';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
  }),
  useParams: () => ({
    service: 'test-db-service',
    table: 'test-table'
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock React Query hooks
const mockMutateField = vi.fn();
const mockUseCreateField = vi.fn(() => ({
  mutate: mockMutateField,
  isPending: false,
  error: null,
  isError: false,
  isSuccess: false,
  reset: vi.fn(),
}));

vi.mock('../../../../hooks/use-field-management', () => ({
  useCreateField: mockUseCreateField,
}));

// MSW Server Setup
const server = setupServer(
  // Field creation endpoint
  http.post('/api/v2/system/service/:service/_schema/:table/_field', async ({ request, params }) => {
    const { service, table } = params;
    const body = await request.json() as FieldCreateRequest;
    
    if (body.field?.name === 'duplicate_field') {
      return HttpResponse.json(
        createErrorResponse(422, 'Field name already exists', 'DuplicateFieldException'),
        { status: 422 }
      );
    }
    
    if (body.field?.name === 'server_error') {
      return HttpResponse.json(
        createErrorResponse(500, 'Internal server error', 'ServerException'),
        { status: 500 }
      );
    }

    const createdField: DatabaseSchemaFieldType = {
      ...createMockDatabaseField(),
      ...body.field,
      name: body.field.name || 'new_field',
    };

    return HttpResponse.json({
      success: true,
      data: createdField,
    });
  }),

  // Reference tables endpoint
  http.get('/api/v2/system/service/:service/_schema', ({ params }) => {
    const { service } = params;
    
    const mockTables: TableReference[] = [
      createMockTableReference('users', ['id', 'email', 'name']),
      createMockTableReference('roles', ['id', 'name', 'description']),
      createMockTableReference('permissions', ['id', 'role_id', 'resource']),
    ];

    return HttpResponse.json({
      success: true,
      data: mockTables,
    });
  }),

  // Field validation endpoint
  http.get('/api/v2/system/service/:service/_schema/:table/_field/:fieldName/validate', ({ params }) => {
    const { fieldName } = params;
    
    if (fieldName === 'existing_field') {
      return HttpResponse.json(
        createErrorResponse(409, 'Field name already exists', 'FieldExistsException'),
        { status: 409 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { valid: true },
    });
  })
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

describe('FieldCreatePage', () => {
  const defaultProps = {
    params: { service: 'test-db-service', table: 'test-table' },
    searchParams: {},
  };

  beforeEach(() => {
    // Reset all mocks before each test
    mockPush.mockClear();
    mockBack.mockClear();
    mockReplace.mockClear();
    mockMutateField.mockClear();
    mockUseCreateField.mockReturnValue({
      mutate: mockMutateField,
      isPending: false,
      error: null,
      isError: false,
      isSuccess: false,
      reset: vi.fn(),
    });
  });

  describe('Component Rendering', () => {
    it('should render the field creation form with all required elements', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Create New Field')).toBeInTheDocument();
      });

      // Check page header elements
      expect(screen.getByText('Database Field Creation')).toBeInTheDocument();
      expect(screen.getByText('test-db-service')).toBeInTheDocument();
      expect(screen.getByText('test-table')).toBeInTheDocument();

      // Check form elements
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/field label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument();
      
      // Check action buttons
      expect(screen.getByRole('button', { name: /create field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render breadcrumb navigation correctly', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
        expect(breadcrumb).toBeInTheDocument();
      });

      // Check breadcrumb links
      expect(screen.getByText('Schema')).toBeInTheDocument();
      expect(screen.getByText('test-db-service')).toBeInTheDocument();
      expect(screen.getByText('test-table')).toBeInTheDocument();
      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should render field type selection dropdown with all available types', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/field type/i);
        expect(typeSelect).toBeInTheDocument();
      });

      // Open dropdown and check options
      const typeSelect = screen.getByLabelText(/field type/i);
      await userEvent.click(typeSelect);

      await waitFor(() => {
        expect(screen.getByText('String')).toBeInTheDocument();
        expect(screen.getByText('Integer')).toBeInTheDocument();
        expect(screen.getByText('Boolean')).toBeInTheDocument();
        expect(screen.getByText('DateTime')).toBeInTheDocument();
        expect(screen.getByText('Text')).toBeInTheDocument();
        expect(screen.getByText('I will manually enter a type')).toBeInTheDocument();
      });
    });

    it('should show manual type input when manual type selection is chosen', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/field type/i);
        expect(typeSelect).toBeInTheDocument();
      });

      // Select manual type option
      const typeSelect = screen.getByLabelText(/field type/i);
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('I will manually enter a type'));

      // Check that manual type input appears
      await waitFor(() => {
        expect(screen.getByLabelText(/manual database type/i)).toBeInTheDocument();
      });
    });

    it('should display loading state correctly', async () => {
      mockUseCreateField.mockReturnValue({
        mutate: mockMutateField,
        isPending: true,
        error: null,
        isError: false,
        isSuccess: false,
        reset: vi.fn(),
      });

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /creating.../i });
        expect(createButton).toBeInTheDocument();
        expect(createButton).toBeDisabled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required field name', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create field/i });
        expect(createButton).toBeInTheDocument();
      });

      // Try to submit without field name
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate field name format', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Enter invalid field name
      const nameInput = screen.getByLabelText(/field name/i);
      await userEvent.type(nameInput, '123invalid');

      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/field name must start with a letter/i)).toBeInTheDocument();
      });
    });

    it('should validate field label requirement', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Enter valid name but no label
      const nameInput = screen.getByLabelText(/field name/i);
      await userEvent.type(nameInput, 'valid_field_name');

      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/field label is required/i)).toBeInTheDocument();
      });
    });

    it('should validate manual type when manual selection is chosen', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/field type/i);
        expect(typeSelect).toBeInTheDocument();
      });

      // Fill required fields
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      await userEvent.type(nameInput, 'test_field');
      await userEvent.type(labelInput, 'Test Field');

      // Select manual type but don't enter manual type
      const typeSelect = screen.getByLabelText(/field type/i);
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('I will manually enter a type'));

      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/manual type must be specified/i)).toBeInTheDocument();
      });
    });

    it('should validate foreign key reference requirements', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill basic required fields
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      await userEvent.type(nameInput, 'test_field');
      await userEvent.type(labelInput, 'Test Field');

      // Enable foreign key without selecting reference
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/reference table and field must be specified/i)).toBeInTheDocument();
      });
    });

    it('should validate primary key constraints', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill basic required fields
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      await userEvent.type(nameInput, 'test_field');
      await userEvent.type(labelInput, 'Test Field');

      // Enable primary key and allow null (invalid combination)
      const primaryKeyCheckbox = screen.getByLabelText(/primary key/i);
      const allowNullCheckbox = screen.getByLabelText(/allow null/i);
      
      await userEvent.click(primaryKeyCheckbox);
      await userEvent.click(allowNullCheckbox);

      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/primary key fields cannot allow null/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Form Controls', () => {
    it('should show length and precision controls for string types', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/field type/i);
        expect(typeSelect).toBeInTheDocument();
      });

      // Select string type
      const typeSelect = screen.getByLabelText(/field type/i);
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('String'));

      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/fixed length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/supports multibyte/i)).toBeInTheDocument();
      });
    });

    it('should show precision and scale controls for decimal types', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const typeSelect = screen.getByLabelText(/field type/i);
        expect(typeSelect).toBeInTheDocument();
      });

      // Select decimal type
      const typeSelect = screen.getByLabelText(/field type/i);
      await userEvent.click(typeSelect);
      await userEvent.click(screen.getByText('Decimal'));

      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
      });
    });

    it('should show foreign key controls when foreign key is enabled', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
        expect(foreignKeyCheckbox).toBeInTheDocument();
      });

      // Enable foreign key
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/reference table/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reference field/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/on delete action/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/on update action/i)).toBeInTheDocument();
      });
    });

    it('should populate reference field options when reference table is selected', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
        expect(foreignKeyCheckbox).toBeInTheDocument();
      });

      // Enable foreign key
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i);
        expect(tableSelect).toBeInTheDocument();
      });

      // Select reference table
      const tableSelect = screen.getByLabelText(/reference table/i);
      await userEvent.click(tableSelect);
      await userEvent.click(screen.getByText('users'));

      // Check that field options are populated
      await waitFor(() => {
        const fieldSelect = screen.getByLabelText(/reference field/i);
        expect(fieldSelect).toBeInTheDocument();
        
        // Open field dropdown to check options
        userEvent.click(fieldSelect);
      });

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.getByText('name')).toBeInTheDocument();
      });
    });

    it('should show validation controls when validation is enabled', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const validationCheckbox = screen.getByLabelText(/enable validation/i);
        expect(validationCheckbox).toBeInTheDocument();
      });

      // Enable validation
      const validationCheckbox = screen.getByLabelText(/enable validation/i);
      await userEvent.click(validationCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/minimum length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/maximum length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/pattern/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/validate on change/i)).toBeInTheDocument();
      });
    });

    it('should show picklist controls when picklist is enabled', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const picklistCheckbox = screen.getByLabelText(/enable picklist/i);
        expect(picklistCheckbox).toBeInTheDocument();
      });

      // Enable picklist
      const picklistCheckbox = screen.getByLabelText(/enable picklist/i);
      await userEvent.click(picklistCheckbox);

      await waitFor(() => {
        expect(screen.getByLabelText(/picklist type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/picklist values/i)).toBeInTheDocument();
      });
    });

    it('should show database function controls when functions are enabled', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const functionsCheckbox = screen.getByLabelText(/enable database functions/i);
        expect(functionsCheckbox).toBeInTheDocument();
      });

      // Enable database functions
      const functionsCheckbox = screen.getByLabelText(/enable database functions/i);
      await userEvent.click(functionsCheckbox);

      await waitFor(() => {
        expect(screen.getByText(/add database function/i)).toBeInTheDocument();
      });

      // Add a function
      const addFunctionButton = screen.getByText(/add database function/i);
      await userEvent.click(addFunctionButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/function expression/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/select operations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    const fillBasicForm = async () => {
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      
      await userEvent.type(nameInput, 'test_field');
      await userEvent.type(labelInput, 'Test Field');
    };

    it('should submit field creation with basic data', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill basic form
      await fillBasicForm();

      // Submit form
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockMutateField).toHaveBeenCalledWith({
          service: 'test-db-service',
          table: 'test-table',
          field: expect.objectContaining({
            name: 'test_field',
            label: 'Test Field',
            type: 'string', // default type
          }),
        });
      });
    });

    it('should submit field creation with all optional configurations', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill basic form
      await fillBasicForm();

      // Configure additional options
      const descriptionInput = screen.getByLabelText(/description/i);
      await userEvent.type(descriptionInput, 'Test field description');

      const lengthInput = screen.getByLabelText(/length/i);
      await userEvent.type(lengthInput, '255');

      const requiredCheckbox = screen.getByLabelText(/required/i);
      await userEvent.click(requiredCheckbox);

      const uniqueCheckbox = screen.getByLabelText(/unique/i);
      await userEvent.click(uniqueCheckbox);

      // Submit form
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockMutateField).toHaveBeenCalledWith({
          service: 'test-db-service',
          table: 'test-table',
          field: expect.objectContaining({
            name: 'test_field',
            label: 'Test Field',
            description: 'Test field description',
            length: 255,
            required: true,
            isUnique: true,
          }),
        });
      });
    });

    it('should navigate back to fields list on successful creation', async () => {
      // Mock successful creation
      mockUseCreateField.mockReturnValue({
        mutate: mockMutateField,
        isPending: false,
        error: null,
        isError: false,
        isSuccess: true,
        reset: vi.fn(),
      });

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      // Should navigate after successful creation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields');
      });
    });

    it('should handle field creation with foreign key configuration', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill basic form
      await fillBasicForm();

      // Configure foreign key
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i);
        expect(tableSelect).toBeInTheDocument();
      });

      const tableSelect = screen.getByLabelText(/reference table/i);
      await userEvent.click(tableSelect);
      await userEvent.click(screen.getByText('users'));

      await waitFor(() => {
        const fieldSelect = screen.getByLabelText(/reference field/i);
        expect(fieldSelect).toBeInTheDocument();
      });

      const fieldSelect = screen.getByLabelText(/reference field/i);
      await userEvent.click(fieldSelect);
      await userEvent.click(screen.getByText('id'));

      // Submit form
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockMutateField).toHaveBeenCalledWith({
          service: 'test-db-service',
          table: 'test-table',
          field: expect.objectContaining({
            name: 'test_field',
            label: 'Test Field',
            isForeignKey: true,
            refTable: 'users',
            refField: 'id',
            refOnDelete: 'RESTRICT', // default
            refOnUpdate: 'RESTRICT', // default
          }),
        });
      });
    });

    it('should handle field creation with database functions', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill basic form
      await fillBasicForm();

      // Enable database functions
      const functionsCheckbox = screen.getByLabelText(/enable database functions/i);
      await userEvent.click(functionsCheckbox);

      // Add a function
      const addFunctionButton = screen.getByText(/add database function/i);
      await userEvent.click(addFunctionButton);

      await waitFor(() => {
        const functionInput = screen.getByLabelText(/function expression/i);
        expect(functionInput).toBeInTheDocument();
      });

      const functionInput = screen.getByLabelText(/function expression/i);
      await userEvent.type(functionInput, 'UPPER(??)');

      // Select operations
      const selectCheckbox = screen.getByLabelText(/SELECT/i);
      await userEvent.click(selectCheckbox);

      // Submit form
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(mockMutateField).toHaveBeenCalledWith({
          service: 'test-db-service',
          table: 'test-table',
          field: expect.objectContaining({
            name: 'test_field',
            label: 'Test Field',
            dbFunction: expect.arrayContaining([
              expect.objectContaining({
                function: 'UPPER(??)',
                use: expect.arrayContaining(['SELECT']),
              })
            ]),
          }),
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should display validation errors from server', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill form with duplicate field name
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      
      await userEvent.type(nameInput, 'duplicate_field');
      await userEvent.type(labelInput, 'Duplicate Field');

      // Submit form
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/field name already exists/i)).toBeInTheDocument();
      });
    });

    it('should display server error messages', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill form with field that triggers server error
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      
      await userEvent.type(nameInput, 'server_error');
      await userEvent.type(labelInput, 'Server Error Field');

      // Submit form
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.post('/api/v2/system/service/:service/_schema/:table/_field', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Fill and submit form
      const nameInput = screen.getByLabelText(/field name/i);
      const labelInput = screen.getByLabelText(/field label/i);
      
      await userEvent.type(nameInput, 'test_field');
      await userEvent.type(labelInput, 'Test Field');

      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should allow error dismissal and retry', async () => {
      // Mock error response
      mockUseCreateField.mockReturnValue({
        mutate: mockMutateField,
        isPending: false,
        error: { message: 'Test error message' },
        isError: true,
        isSuccess: false,
        reset: vi.fn(),
      });

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/test error message/i)).toBeInTheDocument();
      });

      // Dismiss error
      const dismissButton = screen.getByText(/dismiss/i);
      await userEvent.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByText(/test error message/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when cancel button is clicked', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should navigate back to fields list when breadcrumb link is clicked', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const fieldsLink = screen.getByText('Fields');
        expect(fieldsLink).toBeInTheDocument();
      });

      const fieldsLink = screen.getByText('Fields');
      await userEvent.click(fieldsLink);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema/fields');
    });

    it('should navigate to schema when schema breadcrumb is clicked', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const schemaLink = screen.getByText('Schema');
        expect(schemaLink).toBeInTheDocument();
      });

      const schemaLink = screen.getByText('Schema');
      await userEvent.click(schemaLink);

      expect(mockPush).toHaveBeenCalledWith('/adf-schema');
    });

    it('should prevent navigation when form has unsaved changes', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Make changes to form
      const nameInput = screen.getByLabelText(/field name/i);
      await userEvent.type(nameInput, 'unsaved_field');

      // Try to navigate away
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        // Check form has proper role
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();

        // Check required fields have aria-required
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toHaveAttribute('aria-required', 'true');

        const labelInput = screen.getByLabelText(/field label/i);
        expect(labelInput).toHaveAttribute('aria-required', 'true');
      });
    });

    it('should announce validation errors to screen readers', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create field/i });
        expect(createButton).toBeInTheDocument();
      });

      // Submit form without required fields
      const createButton = screen.getByRole('button', { name: /create field/i });
      await userEvent.click(createButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/field name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Test tab navigation
      const nameInput = screen.getByLabelText(/field name/i);
      nameInput.focus();
      expect(nameInput).toHaveFocus();

      // Tab to next field
      await userEvent.tab();
      const labelInput = screen.getByLabelText(/field label/i);
      expect(labelInput).toHaveFocus();
    });

    it('should have proper focus management for modals', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      // Type invalid name and try to submit
      const nameInput = screen.getByLabelText(/field name/i);
      await userEvent.type(nameInput, 'test');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Should focus on the confirmation dialog
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        const confirmButton = within(dialog).getByRole('button', { name: /confirm/i });
        expect(confirmButton).toHaveFocus();
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance targets', async () => {
      const startTime = performance.now();

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const form = screen.getByRole('form');
        expect(form).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 100ms for real-time validation requirements
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large reference table lists efficiently', async () => {
      // Mock large table list
      server.use(
        http.get('/api/v2/system/service/:service/_schema', () => {
          const largeTables = Array.from({ length: 1000 }, (_, i) => 
            createMockTableReference(`table_${i}`, ['id', 'name'])
          );

          return HttpResponse.json({
            success: true,
            data: largeTables,
          });
        })
      );

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
        expect(foreignKeyCheckbox).toBeInTheDocument();
      });

      // Enable foreign key to trigger table loading
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      // Should handle large list without performance issues
      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i);
        expect(tableSelect).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should debounce validation requests', async () => {
      const validateRequestSpy = vi.fn();
      
      server.use(
        http.get('/api/v2/system/service/:service/_schema/:table/_field/:fieldName/validate', ({ request }) => {
          validateRequestSpy(request.url);
          return HttpResponse.json({ success: true, data: { valid: true } });
        })
      );

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/field name/i);
        expect(nameInput).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/field name/i);
      
      // Type quickly to test debouncing
      await userEvent.type(nameInput, 'test_field');

      // Should only make one validation request after debounce period
      await waitFor(() => {
        expect(validateRequestSpy).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('React Query Integration', () => {
    it('should cache reference table data', async () => {
      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
        expect(foreignKeyCheckbox).toBeInTheDocument();
      });

      // Enable foreign key to trigger data fetching
      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i);
        expect(tableSelect).toBeInTheDocument();
      });

      // Disable and re-enable to test caching
      await userEvent.click(foreignKeyCheckbox);
      await userEvent.click(foreignKeyCheckbox);

      // Should load from cache immediately
      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i);
        expect(tableSelect).toBeInTheDocument();
      }, { timeout: 100 });
    });

    it('should handle query errors gracefully', async () => {
      // Mock query error
      server.use(
        http.get('/api/v2/system/service/:service/_schema', () => {
          return HttpResponse.json(
            createErrorResponse(500, 'Failed to load tables', 'ServerException'),
            { status: 500 }
          );
        })
      );

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
        expect(foreignKeyCheckbox).toBeInTheDocument();
      });

      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load tables/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality for failed queries', async () => {
      let requestCount = 0;
      
      server.use(
        http.get('/api/v2/system/service/:service/_schema', () => {
          requestCount++;
          if (requestCount === 1) {
            return HttpResponse.json(
              createErrorResponse(500, 'Server temporarily unavailable', 'ServerException'),
              { status: 500 }
            );
          }
          
          return HttpResponse.json({
            success: true,
            data: [createMockTableReference('users', ['id', 'name'])],
          });
        })
      );

      renderWithProviders(<FieldCreatePage {...defaultProps} />);

      await waitFor(() => {
        const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
        expect(foreignKeyCheckbox).toBeInTheDocument();
      });

      const foreignKeyCheckbox = screen.getByLabelText(/foreign key/i);
      await userEvent.click(foreignKeyCheckbox);

      // Should show error with retry button
      await waitFor(() => {
        expect(screen.getByText(/server temporarily unavailable/i)).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText(/retry/i);
      await userEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i);
        expect(tableSelect).toBeInTheDocument();
      });
    });
  });
});