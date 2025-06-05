/**
 * @fileoverview Comprehensive Vitest test suite for the field form component
 * 
 * Tests form validation, field type-based control enabling/disabling, submission workflows
 * for both create and edit modes, integration with function use components, and accessibility
 * compliance. Includes Mock Service Worker setup for API interaction testing.
 * 
 * Migrated from Angular TestBed and Karma to Vitest with React Testing Library per
 * Section 4.7.1.3 testing infrastructure. Replaces Angular HTTP testing with MSW for
 * API mocking per Section 3.2.4 HTTP client integration.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / Vitest 2.1.0
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, accessibilityUtils, headlessUIUtils } from '../../../test/utils/test-utils';
import { formTestUtils } from '../../../test/utils/form-test-helpers';
import { server } from '../../../test/mocks/server';
import { rest } from 'msw';
import { mockSchemaFields, mockErrorResponses } from '../../../test/mocks/mock-data';

// Component and types imports
import FieldForm from './field-form';
import type { 
  DatabaseSchemaFieldType, 
  FieldFormData, 
  FieldUpdateFormData,
  FieldFormReturn 
} from './df-field-details.types';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => ({
    tableId: 'test-table',
    fieldId: 'test-field',
    service: 'mysql_production'
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock React Query hooks
const mockUseFieldMutation = vi.fn();
const mockUseFieldQuery = vi.fn();

vi.mock('../../../hooks/use-field-management', () => ({
  useCreateFieldMutation: () => mockUseFieldMutation(),
  useUpdateFieldMutation: () => mockUseFieldMutation(),
  useFieldQuery: () => mockUseFieldQuery(),
}));

// Mock function use component
vi.mock('../df-function-use/function-use-form', () => ({
  default: ({ onFunctionsChange, value }: any) => (
    <div data-testid="function-use-form">
      <button 
        data-testid="add-function"
        onClick={() => onFunctionsChange([...value, { function: 'CONCAT', use: ['create'] }])}
      >
        Add Function
      </button>
      {value?.map((fn: any, index: number) => (
        <div key={index} data-testid={`function-${index}`}>
          {fn.function}: {fn.use.join(', ')}
        </div>
      ))}
    </div>
  )
}));

// =============================================================================
// TEST DATA AND FIXTURES
// =============================================================================

const mockFieldData: DatabaseSchemaFieldType = {
  ...mockSchemaFields[0],
  name: 'test_field',
  type: 'string',
  label: 'Test Field',
  description: 'A test field for form testing',
  allowNull: false,
  required: true,
  length: 255,
  isPrimaryKey: false,
  isForeignKey: false,
  isUnique: false,
  autoIncrement: false,
  default: null,
  validation: null,
  dbFunction: null,
  alias: null,
  dbType: 'VARCHAR',
  fixedLength: false,
  isAggregate: false,
  isVirtual: false,
  native: null,
  picklist: null,
  precision: null,
  refField: null,
  refTable: null,
  refOnDelete: null,
  refOnUpdate: null,
  scale: 0,
  supportsMultibyte: true,
  value: [],
};

const mockCreateFieldData: FieldFormData = {
  name: 'new_field',
  type: 'string',
  label: 'New Test Field',
  allowNull: false,
  required: true,
  description: 'A new field for testing',
  default: null,
  length: 100,
  precision: null,
  scale: 0,
};

const mockUpdateFieldData: FieldUpdateFormData = {
  name: 'updated_field',
  type: 'string',
  label: 'Updated Test Field',
  description: 'An updated field for testing',
  length: 200,
};

const mockForeignKeyField: DatabaseSchemaFieldType = {
  ...mockFieldData,
  name: 'user_id',
  type: 'integer',
  label: 'User ID',
  isForeignKey: true,
  refTable: 'users',
  refField: 'id',
  refOnDelete: 'CASCADE',
  refOnUpdate: 'CASCADE',
};

const mockFunctionUseField: DatabaseSchemaFieldType = {
  ...mockFieldData,
  name: 'computed_field',
  type: 'string',
  label: 'Computed Field',
  dbFunction: [
    { function: 'CONCAT', use: ['create', 'update'] },
    { function: 'UPPER', use: ['read'] }
  ],
};

// =============================================================================
// MSW HANDLERS FOR API MOCKING
// =============================================================================

const setupAPIHandlers = () => {
  // Field creation handler
  server.use(
    rest.post('/api/v2/:service/schema/:tableId/field', (req, res, ctx) => {
      return res(
        ctx.status(201),
        ctx.json({
          resource: { ...mockFieldData, ...(req.body as any) }
        })
      );
    })
  );

  // Field update handler
  server.use(
    rest.patch('/api/v2/:service/schema/:tableId/field/:fieldId', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          resource: { ...mockFieldData, ...(req.body as any) }
        })
      );
    })
  );

  // Field detail handler
  server.use(
    rest.get('/api/v2/:service/schema/:tableId/field/:fieldId', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          resource: mockFieldData
        })
      );
    })
  );

  // Validation error handler
  server.use(
    rest.post('/api/v2/:service/schema/:tableId/field/validate', (req, res, ctx) => {
      const body = req.body as any;
      if (body.name === 'duplicate_name') {
        return res(
          ctx.status(400),
          ctx.json(mockErrorResponses.validationError)
        );
      }
      return res(ctx.status(200), ctx.json({ valid: true }));
    })
  );

  // Database functions handler
  server.use(
    rest.get('/api/v2/:service/schema/:tableId/functions', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          resource: [
            { name: 'CONCAT', description: 'Concatenate strings' },
            { name: 'UPPER', description: 'Convert to uppercase' },
            { name: 'NOW', description: 'Current timestamp' },
            { name: 'SUM', description: 'Sum values' }
          ]
        })
      );
    })
  );

  // Foreign key tables handler
  server.use(
    rest.get('/api/v2/:service/schema/tables', (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          resource: [
            { name: 'users', label: 'Users' },
            { name: 'roles', label: 'Roles' },
            { name: 'categories', label: 'Categories' }
          ]
        })
      );
    })
  );
};

// =============================================================================
// TEST SETUP AND UTILITIES
// =============================================================================

describe('FieldForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    setupAPIHandlers();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseFieldMutation.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: null,
      isSuccess: false,
    });

    mockUseFieldQuery.mockReturnValue({
      data: { resource: mockFieldData },
      isLoading: false,
      error: null,
      isSuccess: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // =============================================================================
  // BASIC RENDERING AND STRUCTURE TESTS
  // =============================================================================

  describe('Component Rendering', () => {
    it('renders field form in create mode with all required fields', async () => {
      const { container } = renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      // Verify form structure
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display label/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Verify accessibility structure
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('noValidate');
      
      // Check for proper ARIA labels
      const nameField = screen.getByLabelText(/field name/i);
      expect(accessibilityUtils.hasAriaLabel(nameField)).toBe(true);
      expect(accessibilityUtils.isKeyboardAccessible(nameField)).toBe(true);
    });

    it('renders field form in edit mode with populated data', async () => {
      mockUseFieldQuery.mockReturnValue({
        data: { resource: mockFieldData },
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="test-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockFieldData.name)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockFieldData.label)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /update field/i })).toBeInTheDocument();
    });

    it('displays loading state while fetching field data', () => {
      mockUseFieldQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="test-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.queryByRole('form')).not.toBeInTheDocument();
    });

    it('displays error state when field data fails to load', () => {
      mockUseFieldQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Failed to load field data' },
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="test-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      expect(screen.getByText(/failed to load field data/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  // =============================================================================
  // FORM VALIDATION TESTS
  // =============================================================================

  describe('Form Validation', () => {
    it('validates required fields and shows appropriate error messages', async () => {
      const onSubmit = vi.fn();
      
      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/field type is required/i)).toBeInTheDocument();
        expect(screen.getByText(/field label is required/i)).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates field name format and uniqueness', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const nameField = screen.getByLabelText(/field name/i);

      // Test invalid characters
      await user.type(nameField, 'invalid-name!@#');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/field name must be a valid identifier/i)).toBeInTheDocument();
      });

      // Test duplicate name
      await user.clear(nameField);
      await user.type(nameField, 'duplicate_name');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/field name already exists/i)).toBeInTheDocument();
      });

      // Test valid name
      await user.clear(nameField);
      await user.type(nameField, 'valid_field_name');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/field name must be a valid identifier/i)).not.toBeInTheDocument();
      });
    });

    it('validates field length constraints based on type', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      const lengthField = screen.getByLabelText(/length/i);

      // Select string type
      await user.selectOptions(typeField, 'string');
      
      // Test invalid length
      await user.type(lengthField, '0');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/length must be greater than 0/i)).toBeInTheDocument();
      });

      // Test valid length
      await user.clear(lengthField);
      await user.type(lengthField, '255');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/length must be greater than 0/i)).not.toBeInTheDocument();
      });
    });

    it('validates decimal precision and scale for numeric types', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select decimal type
      await user.selectOptions(typeField, 'decimal');

      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
      });

      const precisionField = screen.getByLabelText(/precision/i);
      const scaleField = screen.getByLabelText(/scale/i);

      // Test scale greater than precision
      await user.type(precisionField, '5');
      await user.type(scaleField, '8');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/scale cannot be greater than precision/i)).toBeInTheDocument();
      });

      // Test valid precision and scale
      await user.clear(scaleField);
      await user.type(scaleField, '2');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/scale cannot be greater than precision/i)).not.toBeInTheDocument();
      });
    });

    it('validates foreign key constraints', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const isForeignKeyToggle = screen.getByRole('switch', { name: /foreign key/i });
      
      // Enable foreign key
      await user.click(isForeignKeyToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/referenced table/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/referenced field/i)).toBeInTheDocument();
      });

      // Try to submit without specifying referenced table
      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/referenced table is required/i)).toBeInTheDocument();
      });
    });

    it('performs real-time validation under 100ms performance requirement', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const nameField = screen.getByLabelText(/field name/i);

      // Measure validation performance
      const startTime = performance.now();
      await user.type(nameField, 'test_field');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Validation should complete under 100ms per requirements
        expect(duration).toBeLessThan(100);
      });
    });
  });

  // =============================================================================
  // FIELD TYPE-BASED CONTROL TESTS
  // =============================================================================

  describe('Field Type-Based Control Enabling/Disabling', () => {
    it('shows/hides appropriate controls based on string field type', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select string type
      await user.selectOptions(typeField, 'string');

      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/fixed length/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/scale/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/auto increment/i)).not.toBeInTheDocument();
      });
    });

    it('shows/hides appropriate controls based on integer field type', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select integer type
      await user.selectOptions(typeField, 'integer');

      await waitFor(() => {
        expect(screen.getByLabelText(/auto increment/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/scale/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/fixed length/i)).not.toBeInTheDocument();
      });
    });

    it('shows/hides appropriate controls based on decimal field type', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select decimal type
      await user.selectOptions(typeField, 'decimal');

      await waitFor(() => {
        expect(screen.getByLabelText(/precision/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/scale/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/auto increment/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/fixed length/i)).not.toBeInTheDocument();
      });
    });

    it('shows/hides appropriate controls based on datetime field type', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select datetime type
      await user.selectOptions(typeField, 'datetime');

      await waitFor(() => {
        expect(screen.getByLabelText(/default value/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/scale/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/auto increment/i)).not.toBeInTheDocument();
      });
    });

    it('shows/hides appropriate controls based on boolean field type', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select boolean type
      await user.selectOptions(typeField, 'boolean');

      await waitFor(() => {
        expect(screen.getByLabelText(/default value/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/length/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/precision/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/scale/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/auto increment/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/fixed length/i)).not.toBeInTheDocument();
      });
    });

    it('enables/disables foreign key controls based on toggle state', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const isForeignKeyToggle = screen.getByRole('switch', { name: /foreign key/i });
      
      // Initially foreign key controls should be hidden
      expect(screen.queryByLabelText(/referenced table/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/referenced field/i)).not.toBeInTheDocument();

      // Enable foreign key
      await user.click(isForeignKeyToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/referenced table/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/referenced field/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/on delete action/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/on update action/i)).toBeInTheDocument();
      });

      // Disable foreign key
      await user.click(isForeignKeyToggle);

      await waitFor(() => {
        expect(screen.queryByLabelText(/referenced table/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/referenced field/i)).not.toBeInTheDocument();
      });
    });

    it('disables allow null when field is primary key', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const isPrimaryKeyToggle = screen.getByRole('switch', { name: /primary key/i });
      const allowNullToggle = screen.getByRole('switch', { name: /allow null/i });
      
      // Enable primary key
      await user.click(isPrimaryKeyToggle);

      await waitFor(() => {
        expect(allowNullToggle).toBeDisabled();
        expect(allowNullToggle).not.toBeChecked();
      });

      // Disable primary key
      await user.click(isPrimaryKeyToggle);

      await waitFor(() => {
        expect(allowNullToggle).toBeEnabled();
      });
    });

    it('disables auto increment for non-integer types', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Select string type
      await user.selectOptions(typeField, 'string');

      // Auto increment should not be available for string types
      expect(screen.queryByLabelText(/auto increment/i)).not.toBeInTheDocument();

      // Select integer type
      await user.selectOptions(typeField, 'integer');

      await waitFor(() => {
        expect(screen.getByLabelText(/auto increment/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/auto increment/i)).toBeEnabled();
      });
    });
  });

  // =============================================================================
  // FORM SUBMISSION TESTS
  // =============================================================================

  describe('Form Submission Workflows', () => {
    it('submits valid create form data successfully', async () => {
      const onSubmit = vi.fn();
      const mockMutate = vi.fn();
      
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Fill form with valid data
      await formTestUtils.fillField({
        field: 'name',
        value: mockCreateFieldData.name
      }, user);

      await formTestUtils.fillField({
        field: 'type',
        value: mockCreateFieldData.type
      }, user);

      await formTestUtils.fillField({
        field: 'label',
        value: mockCreateFieldData.label
      }, user);

      await formTestUtils.fillField({
        field: 'description',
        value: mockCreateFieldData.description
      }, user);

      await formTestUtils.fillField({
        field: 'length',
        value: mockCreateFieldData.length?.toString() || ''
      }, user);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: mockCreateFieldData.name,
            type: mockCreateFieldData.type,
            label: mockCreateFieldData.label,
            description: mockCreateFieldData.description,
            length: mockCreateFieldData.length,
          })
        );
      });
    });

    it('submits valid update form data successfully', async () => {
      const onSubmit = vi.fn();
      const mockMutate = vi.fn();
      
      mockUseFieldQuery.mockReturnValue({
        data: { resource: mockFieldData },
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="test-field"
          onSubmit={onSubmit} 
          onCancel={vi.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(mockFieldData.name)).toBeInTheDocument();
      });

      // Update some fields
      const labelField = screen.getByLabelText(/display label/i);
      await user.clear(labelField);
      await user.type(labelField, mockUpdateFieldData.label);

      const descriptionField = screen.getByLabelText(/description/i);
      await user.clear(descriptionField);
      await user.type(descriptionField, mockUpdateFieldData.description || '');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            label: mockUpdateFieldData.label,
            description: mockUpdateFieldData.description,
          })
        );
      });
    });

    it('handles submission errors gracefully', async () => {
      const onSubmit = vi.fn();
      const mockMutate = vi.fn();
      
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: { message: 'Field name already exists' },
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Fill form and submit
      await formTestUtils.fillField({ field: 'name', value: 'duplicate_name' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'string' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'Duplicate Field' }, user);

      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/field name already exists/i)).toBeInTheDocument();
      });

      // Form should remain editable
      expect(screen.getByLabelText(/field name/i)).toBeEnabled();
      expect(submitButton).toBeEnabled();
    });

    it('shows loading state during submission', async () => {
      const onSubmit = vi.fn();
      const mockMutate = vi.fn();
      
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: true,
        error: null,
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Fill minimal valid form
      await formTestUtils.fillField({ field: 'name', value: 'test_field' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'string' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'Test Field' }, user);

      const submitButton = screen.getByRole('button', { name: /create field/i });
      
      // Button should show loading state
      expect(submitButton).toHaveTextContent(/creating/i);
      expect(submitButton).toBeDisabled();
      
      // Form fields should be disabled
      expect(screen.getByLabelText(/field name/i)).toBeDisabled();
      expect(screen.getByLabelText(/field type/i)).toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={onCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('submits foreign key field data correctly', async () => {
      const onSubmit = vi.fn();
      const mockMutate = vi.fn();
      
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Fill basic field data
      await formTestUtils.fillField({ field: 'name', value: 'user_id' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'integer' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'User ID' }, user);

      // Enable foreign key
      const isForeignKeyToggle = screen.getByRole('switch', { name: /foreign key/i });
      await user.click(isForeignKeyToggle);

      await waitFor(() => {
        expect(screen.getByLabelText(/referenced table/i)).toBeInTheDocument();
      });

      // Fill foreign key data
      await user.selectOptions(screen.getByLabelText(/referenced table/i), 'users');
      await user.selectOptions(screen.getByLabelText(/referenced field/i), 'id');
      await user.selectOptions(screen.getByLabelText(/on delete action/i), 'CASCADE');
      await user.selectOptions(screen.getByLabelText(/on update action/i), 'CASCADE');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'user_id',
            type: 'integer',
            isForeignKey: true,
            refTable: 'users',
            refField: 'id',
            refOnDelete: 'CASCADE',
            refOnUpdate: 'CASCADE',
          })
        );
      });
    });
  });

  // =============================================================================
  // FUNCTION USE INTEGRATION TESTS
  // =============================================================================

  describe('Function Use Component Integration', () => {
    it('renders function use component when field supports database functions', async () => {
      mockUseFieldQuery.mockReturnValue({
        data: { resource: mockFunctionUseField },
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="computed-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('function-use-form')).toBeInTheDocument();
      });

      // Check that existing functions are displayed
      expect(screen.getByTestId('function-0')).toHaveTextContent('CONCAT: create, update');
      expect(screen.getByTestId('function-1')).toHaveTextContent('UPPER: read');
    });

    it('allows adding new database functions', async () => {
      const onSubmit = vi.fn();
      const mockMutate = vi.fn();
      
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Fill basic field data
      await formTestUtils.fillField({ field: 'name', value: 'computed_field' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'string' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'Computed Field' }, user);

      // Add a database function
      const addFunctionButton = screen.getByTestId('add-function');
      await user.click(addFunctionButton);

      await waitFor(() => {
        expect(screen.getByTestId('function-0')).toHaveTextContent('CONCAT: create');
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'computed_field',
            dbFunction: [
              { function: 'CONCAT', use: ['create'] }
            ]
          })
        );
      });
    });

    it('validates function use configurations', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      // Fill basic field data
      await formTestUtils.fillField({ field: 'name', value: 'computed_field' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'string' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'Computed Field' }, user);

      // Add function without proper configuration should show validation error
      const addFunctionButton = screen.getByTestId('add-function');
      await user.click(addFunctionButton);

      // Try to submit with incomplete function configuration
      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      // Should prevent submission until function is properly configured
      await waitFor(() => {
        // Form should validate function configurations
        expect(screen.getByText(/function configuration required/i)).toBeInTheDocument();
      });
    });

    it('removes database functions correctly', async () => {
      mockUseFieldQuery.mockReturnValue({
        data: { resource: mockFunctionUseField },
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="computed-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('function-0')).toBeInTheDocument();
        expect(screen.getByTestId('function-1')).toBeInTheDocument();
      });

      // Remove first function (implementation depends on function-use-form component)
      const removeFunctionButton = within(screen.getByTestId('function-0')).getByRole('button', { name: /remove/i });
      await user.click(removeFunctionButton);

      await waitFor(() => {
        expect(screen.queryByTestId('function-0')).not.toBeInTheDocument();
        expect(screen.getByTestId('function-1')).toBeInTheDocument();
      });
    });

    it('updates function use when field type changes', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);

      // Select string type - should show function use component
      await user.selectOptions(typeField, 'string');

      await waitFor(() => {
        expect(screen.getByTestId('function-use-form')).toBeInTheDocument();
      });

      // Select boolean type - should hide function use component
      await user.selectOptions(typeField, 'boolean');

      await waitFor(() => {
        expect(screen.queryByTestId('function-use-form')).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // ACCESSIBILITY COMPLIANCE TESTS
  // =============================================================================

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('has proper ARIA labels for all form controls', () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const formControls = [
        screen.getByLabelText(/field name/i),
        screen.getByLabelText(/field type/i),
        screen.getByLabelText(/display label/i),
        screen.getByLabelText(/description/i),
        screen.getByRole('switch', { name: /allow null/i }),
        screen.getByRole('switch', { name: /required/i }),
        screen.getByRole('switch', { name: /unique/i }),
        screen.getByRole('switch', { name: /primary key/i }),
        screen.getByRole('switch', { name: /foreign key/i }),
      ];

      formControls.forEach(control => {
        expect(accessibilityUtils.hasAriaLabel(control)).toBe(true);
        expect(accessibilityUtils.isKeyboardAccessible(control)).toBe(true);
      });
    });

    it('provides proper error announcements for screen readers', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const nameField = screen.getByLabelText(/field name/i);
      
      // Trigger validation error
      await user.type(nameField, 'invalid-name!');
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('aria-live', 'assertive');
        expect(nameField).toHaveAttribute('aria-invalid', 'true');
        expect(nameField).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
      });
    });

    it('supports keyboard navigation through all interactive elements', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const form = screen.getByRole('form');
      const navigationResult = await accessibilityUtils.testKeyboardNavigation(form, user);

      expect(navigationResult.success).toBe(true);
      expect(navigationResult.focusedElements.length).toBeGreaterThan(0);
      
      // Verify all focusable elements were reached
      expect(navigationResult.focusedElements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ tagName: 'INPUT' }),
          expect.objectContaining({ tagName: 'SELECT' }),
          expect.objectContaining({ tagName: 'BUTTON' })
        ])
      );
    });

    it('provides proper focus management for conditional fields', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const isForeignKeyToggle = screen.getByRole('switch', { name: /foreign key/i });
      
      // Enable foreign key to show conditional fields
      await user.click(isForeignKeyToggle);

      await waitFor(() => {
        const refTableField = screen.getByLabelText(/referenced table/i);
        expect(refTableField).toBeInTheDocument();
        expect(accessibilityUtils.isKeyboardAccessible(refTableField)).toBe(true);
      });

      // Test focus management when disabling
      await user.click(isForeignKeyToggle);

      await waitFor(() => {
        // Focus should return to a logical position
        expect(document.activeElement).toBe(isForeignKeyToggle);
      });
    });

    it('has adequate color contrast for all visual elements', () => {
      const { container } = renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      // Test color contrast on various elements
      const elementsToTest = [
        screen.getByLabelText(/field name/i),
        screen.getByRole('button', { name: /create field/i }),
        screen.getByRole('button', { name: /cancel/i }),
      ];

      elementsToTest.forEach(element => {
        expect(accessibilityUtils.hasAdequateContrast(element)).toBe(true);
      });
    });

    it('provides descriptive help text for complex form controls', () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const nameField = screen.getByLabelText(/field name/i);
      const helpText = screen.getByText(/field name must be a valid database identifier/i);
      
      expect(nameField).toHaveAttribute('aria-describedby', expect.stringContaining(helpText.id));
    });

    it('announces dynamic content changes to screen readers', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const typeField = screen.getByLabelText(/field type/i);
      
      // Change field type to trigger dynamic content
      await user.selectOptions(typeField, 'decimal');

      await waitFor(() => {
        const precisionField = screen.getByLabelText(/precision/i);
        const announcement = screen.getByRole('status', { hidden: true });
        
        expect(announcement).toHaveTextContent(/precision and scale options are now available/i);
      });
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-contrast: high'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      // Verify high contrast styles are applied
      const form = screen.getByRole('form');
      expect(form).toHaveClass('contrast-more');
    });

    it('works with screen reader testing simulation', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      // Simulate screen reader navigation
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      // Check landmark structure
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
      
      // Verify form structure is announced properly
      const fieldsets = screen.getAllByRole('group');
      fieldsets.forEach(fieldset => {
        expect(fieldset).toHaveAttribute('aria-labelledby');
      });
    });
  });

  // =============================================================================
  // PERFORMANCE TESTS
  // =============================================================================

  describe('Performance Requirements', () => {
    it('renders form within performance targets', async () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Form should render quickly
      expect(renderTime).toBeLessThan(100);
    });

    it('maintains responsive interactions under load', async () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      const interactions = [
        () => formTestUtils.fillField({ field: 'name', value: 'test_field' }, user),
        () => formTestUtils.fillField({ field: 'type', value: 'string' }, user),
        () => formTestUtils.fillField({ field: 'label', value: 'Test Field' }, user),
        () => formTestUtils.fillField({ field: 'description', value: 'Test description' }, user),
      ];

      const performanceResults = await Promise.all(
        interactions.map(interaction => 
          formTestUtils.measureInteractionTime(interaction)
        )
      );

      // All interactions should complete under 100ms
      performanceResults.forEach(duration => {
        expect(duration).toBeLessThan(100);
      });
    });

    it('handles large form data sets efficiently', async () => {
      // Create a form with many fields and options
      const largeFieldData = {
        ...mockFieldData,
        dbFunction: Array.from({ length: 50 }, (_, i) => ({
          function: `FUNCTION_${i}`,
          use: ['create', 'update', 'read']
        }))
      };

      mockUseFieldQuery.mockReturnValue({
        data: { resource: largeFieldData },
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      const startTime = performance.now();
      
      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="large-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('function-use-form')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(500);
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        rest.get('/api/v2/:service/schema/:tableId/field/:fieldId', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      mockUseFieldQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network connection failed' },
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="test-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />
      );

      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('handles server validation errors', async () => {
      server.use(
        rest.post('/api/v2/:service/schema/:tableId/field', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: {
                code: 400,
                message: 'Validation failed',
                validation_errors: {
                  name: ['Field name already exists'],
                  length: ['Length must be positive']
                }
              }
            })
          );
        })
      );

      const mockMutate = vi.fn();
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: {
          response: {
            data: {
              error: {
                validation_errors: {
                  name: ['Field name already exists'],
                  length: ['Length must be positive']
                }
              }
            }
          }
        },
        isSuccess: false,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      // Fill form and trigger validation error
      await formTestUtils.fillField({ field: 'name', value: 'duplicate_name' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'string' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'Duplicate Field' }, user);
      await formTestUtils.fillField({ field: 'length', value: '-1' }, user);

      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/field name already exists/i)).toBeInTheDocument();
        expect(screen.getByText(/length must be positive/i)).toBeInTheDocument();
      });
    });

    it('recovers from errors gracefully', async () => {
      const mockMutate = vi.fn();
      
      // Start with error state
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: { message: 'Server error occurred' },
        isSuccess: false,
      });

      const { rerender } = renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />
      );

      expect(screen.getByText(/server error occurred/i)).toBeInTheDocument();

      // Simulate error recovery
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
        isSuccess: false,
      });

      rerender(<FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />);

      // Error should be cleared
      expect(screen.queryByText(/server error occurred/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create field/i })).toBeEnabled();
    });
  });

  // =============================================================================
  // INTEGRATION TESTS
  // =============================================================================

  describe('Integration with External Components', () => {
    it('integrates with React Query for data fetching', async () => {
      mockUseFieldQuery.mockReturnValue({
        data: { resource: mockFieldData },
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      renderWithProviders(
        <FieldForm 
          mode="edit" 
          fieldId="test-field"
          onSubmit={vi.fn()} 
          onCancel={vi.fn()} 
        />,
        {
          providerOptions: {
            queryClient: new QueryClient({
              defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
              }
            })
          }
        }
      );

      await waitFor(() => {
        expect(mockUseFieldQuery).toHaveBeenCalledWith('test-field');
        expect(screen.getByDisplayValue(mockFieldData.name)).toBeInTheDocument();
      });
    });

    it('integrates with Next.js router for navigation', async () => {
      const mockPush = vi.fn();
      
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
        refresh: vi.fn(),
      });

      const onSubmit = vi.fn();
      const mockMutate = vi.fn((data, { onSuccess }) => {
        onSuccess({ resource: { ...mockFieldData, ...data } });
      });
      
      mockUseFieldMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
        isSuccess: true,
      });

      renderWithProviders(
        <FieldForm mode="create" onSubmit={onSubmit} onCancel={vi.fn()} />
      );

      // Fill and submit form
      await formTestUtils.fillField({ field: 'name', value: 'test_field' }, user);
      await formTestUtils.fillField({ field: 'type', value: 'string' }, user);
      await formTestUtils.fillField({ field: 'label', value: 'Test Field' }, user);

      const submitButton = screen.getByRole('button', { name: /create field/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/adf-schema/mysql_production/test-table');
      });
    });

    it('integrates with theme provider for consistent styling', () => {
      renderWithProviders(
        <FieldForm mode="create" onSubmit={vi.fn()} onCancel={vi.fn()} />,
        {
          providerOptions: {
            theme: 'dark'
          }
        }
      );

      const form = screen.getByRole('form');
      expect(form).toHaveClass('dark');
      
      // Theme-specific classes should be applied
      const submitButton = screen.getByRole('button', { name: /create field/i });
      expect(submitButton).toHaveClass('bg-primary-600', 'dark:bg-primary-500');
    });
  });
});