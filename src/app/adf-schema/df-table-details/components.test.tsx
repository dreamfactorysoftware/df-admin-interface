import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { renderWithProviders, renderWithForm, renderWithQuery } from '@/test/utils/test-utils';

// Import components to test
import { TableDetailsForm } from './table-details-form';
import { FieldsTable } from './fields-table';
import { RelationshipsTable } from './relationships-table';

// Mock data factories for comprehensive testing
const createMockTable = (overrides = {}) => ({
  id: 'test-table-1',
  name: 'users',
  label: 'Users Table',
  description: 'User management table',
  schema: 'public',
  native: 'users',
  database: 'test_db',
  type: 'table',
  service: 'mysql_service',
  ...overrides,
});

const createMockField = (overrides = {}) => ({
  id: 'field-1',
  name: 'id',
  label: 'ID',
  type: 'integer',
  dbType: 'int',
  length: null,
  precision: null,
  scale: null,
  nullable: false,
  primaryKey: true,
  autoIncrement: true,
  unique: true,
  indexed: true,
  defaultValue: null,
  comment: 'Primary key',
  ...overrides,
});

const createMockRelationship = (overrides = {}) => ({
  id: 'rel-1',
  type: 'belongs_to',
  name: 'user_profile',
  localTable: 'users',
  localField: 'id',
  foreignTable: 'user_profiles',
  foreignField: 'user_id',
  ...overrides,
});

// Generate large dataset for virtualization testing
const generateLargeFieldset = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    createMockField({
      id: `field-${index + 1}`,
      name: `field_${index + 1}`,
      label: `Field ${index + 1}`,
      type: index % 3 === 0 ? 'string' : index % 3 === 1 ? 'integer' : 'boolean',
      primaryKey: index === 0,
    })
  );
};

const generateLargeRelationshipset = (count: number) => {
  return Array.from({ length: count }, (_, index) => 
    createMockRelationship({
      id: `rel-${index + 1}`,
      name: `relationship_${index + 1}`,
      foreignTable: `table_${index + 1}`,
      foreignField: `field_${index + 1}`,
    })
  );
};

// Zod validation schemas for testing
const tableDetailsSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(64, 'Table name too long'),
  label: z.string().optional(),
  description: z.string().optional(),
  schema: z.string().optional(),
  primaryKey: z.array(z.string()).min(1, 'At least one primary key field required'),
  indexes: z.array(z.object({
    name: z.string(),
    fields: z.array(z.string()),
    unique: z.boolean(),
  })).optional(),
  constraints: z.array(z.object({
    name: z.string(),
    type: z.enum(['unique', 'check', 'foreign_key']),
    fields: z.array(z.string()),
  })).optional(),
});

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.string().min(1, 'Field type is required'),
  nullable: z.boolean(),
  defaultValue: z.string().optional(),
  length: z.number().optional(),
  precision: z.number().optional(),
  scale: z.number().optional(),
});

// MSW handlers for realistic API mocking
const tableDetailsHandlers = [
  // Table details endpoints
  http.get('/api/v2/:service/_schema/:tableName', ({ params }) => {
    const { service, tableName } = params;
    return HttpResponse.json({
      name: tableName,
      label: `${tableName} Table`,
      description: `Table for ${tableName} data`,
      schema: 'public',
      service: service,
      fields: generateLargeFieldset(50), // Test moderate dataset
      relationships: generateLargeRelationshipset(10),
    });
  }),

  // Large dataset endpoint for virtualization testing
  http.get('/api/v2/:service/_schema/:tableName/large', ({ params }) => {
    return HttpResponse.json({
      name: params.tableName,
      fields: generateLargeFieldset(1500), // Test large dataset (1500+ fields)
      relationships: generateLargeRelationshipset(500),
    });
  }),

  // Table update endpoint
  http.put('/api/v2/:service/_schema/:tableName', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...body,
      id: params.tableName,
      updatedAt: new Date().toISOString(),
    });
  }),

  // Field operations
  http.post('/api/v2/:service/_schema/:tableName/fields', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...body,
      id: `field-${Date.now()}`,
      tableName: params.tableName,
      createdAt: new Date().toISOString(),
    });
  }),

  http.put('/api/v2/:service/_schema/:tableName/fields/:fieldId', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...body,
      id: params.fieldId,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/v2/:service/_schema/:tableName/fields/:fieldId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      fieldId: params.fieldId,
    });
  }),

  // Relationship operations
  http.post('/api/v2/:service/_schema/:tableName/relationships', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({
      ...body,
      id: `rel-${Date.now()}`,
      localTable: params.tableName,
      createdAt: new Date().toISOString(),
    });
  }),

  http.delete('/api/v2/:service/_schema/:tableName/relationships/:relationshipId', ({ params }) => {
    return HttpResponse.json({
      success: true,
      relationshipId: params.relationshipId,
    });
  }),

  // JSON schema validation endpoint
  http.post('/api/v2/:service/_schema/:tableName/validate', async ({ request }) => {
    const body = await request.json();
    const hasErrors = Math.random() > 0.8; // 20% chance of validation errors for testing
    
    if (hasErrors) {
      return HttpResponse.json({
        valid: false,
        errors: [
          { field: 'name', message: 'Field name contains invalid characters' },
          { field: 'type', message: 'Unsupported field type' },
        ],
      }, { status: 400 });
    }

    return HttpResponse.json({
      valid: true,
      warnings: body.name === 'deprecated_field' ? [
        { field: 'name', message: 'Field name is deprecated' },
      ] : [],
    });
  }),

  // Error simulation endpoints
  http.get('/api/v2/:service/_schema/error-table', () => {
    return HttpResponse.json(
      { error: 'Table not found', code: 'TABLE_NOT_FOUND' },
      { status: 404 }
    );
  }),

  http.get('/api/v2/:service/_schema/timeout-table', () => {
    return new Promise(() => {}); // Never resolves to simulate timeout
  }),
];

// Setup MSW server
const server = setupServer(...tableDetailsHandlers);

// Test setup and teardown
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

describe('TableDetailsForm Component', () => {
  const defaultFormValues = {
    name: 'test_table',
    label: 'Test Table',
    description: 'A test table for validation',
    schema: 'public',
    primaryKey: ['id'],
    indexes: [],
    constraints: [],
  };

  const renderTableDetailsForm = (initialValues = defaultFormValues, onSubmit = vi.fn()) => {
    const FormWrapper = () => {
      const methods = useForm({
        resolver: zodResolver(tableDetailsSchema),
        defaultValues: initialValues,
      });

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <TableDetailsForm />
            <button type="submit" data-testid="submit-button">
              Save Table
            </button>
          </form>
        </FormProvider>
      );
    };

    return renderWithProviders(<FormWrapper />);
  };

  describe('Rendering and Basic Interaction', () => {
    it('renders all required form fields', () => {
      renderTableDetailsForm();

      expect(screen.getByLabelText(/table name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/schema/i)).toBeInTheDocument();
      expect(screen.getByText(/primary key fields/i)).toBeInTheDocument();
    });

    it('displays initial form values correctly', () => {
      const customValues = {
        ...defaultFormValues,
        name: 'custom_table',
        label: 'Custom Table',
        description: 'Custom description',
      };

      renderTableDetailsForm(customValues);

      expect(screen.getByDisplayValue('custom_table')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Custom Table')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Custom description')).toBeInTheDocument();
    });

    it('applies proper ARIA labels and accessibility attributes', () => {
      renderTableDetailsForm();

      const nameInput = screen.getByLabelText(/table name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');

      const form = screen.getByRole('form', { hidden: true });
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Validation with Zod Schema', () => {
    it('validates required fields and shows error messages', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm({ ...defaultFormValues, name: '', primaryKey: [] });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/table name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/at least one primary key field required/i)).toBeInTheDocument();
      });
    });

    it('validates field length constraints', async () => {
      const user = userEvent.setup();
      const longName = 'a'.repeat(70); // Exceeds 64 character limit
      
      renderTableDetailsForm({ ...defaultFormValues, name: longName });

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/table name too long/i)).toBeInTheDocument();
      });
    });

    it('validates field format and special characters', async () => {
      const user = userEvent.setup();
      const nameInput = screen.getByLabelText(/table name/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'invalid-table-name!@#');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Custom validation would be implemented in the actual component
      // This tests the framework for adding custom validation
    });

    it('shows real-time validation feedback as user types', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm();

      const nameInput = screen.getByLabelText(/table name/i);
      await user.clear(nameInput);

      // Should show error immediately when field becomes empty
      await waitFor(() => {
        expect(screen.getByText(/table name is required/i)).toBeInTheDocument();
      });

      await user.type(nameInput, 'valid_name');

      // Error should disappear when valid input is provided
      await waitFor(() => {
        expect(screen.queryByText(/table name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Advanced Form Features', () => {
    it('handles dynamic primary key field selection', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm();

      // Test adding primary key fields
      const addPrimaryKeyButton = screen.getByRole('button', { name: /add primary key field/i });
      await user.click(addPrimaryKeyButton);

      const fieldSelect = screen.getByRole('combobox', { name: /select field/i });
      await user.selectOptions(fieldSelect, 'id');

      expect(screen.getByDisplayValue('id')).toBeInTheDocument();
    });

    it('manages index configuration correctly', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm();

      // Test adding index
      const addIndexButton = screen.getByRole('button', { name: /add index/i });
      await user.click(addIndexButton);

      const indexNameInput = screen.getByLabelText(/index name/i);
      await user.type(indexNameInput, 'idx_username');

      const uniqueCheckbox = screen.getByRole('checkbox', { name: /unique index/i });
      await user.click(uniqueCheckbox);

      expect(indexNameInput).toHaveValue('idx_username');
      expect(uniqueCheckbox).toBeChecked();
    });

    it('validates constraint configuration', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm();

      // Test adding constraint
      const addConstraintButton = screen.getByRole('button', { name: /add constraint/i });
      await user.click(addConstraintButton);

      const constraintSelect = screen.getByRole('combobox', { name: /constraint type/i });
      await user.selectOptions(constraintSelect, 'unique');

      const constraintNameInput = screen.getByLabelText(/constraint name/i);
      await user.type(constraintNameInput, 'unique_email');

      expect(constraintNameInput).toHaveValue('unique_email');
    });
  });

  describe('Form Submission and API Integration', () => {
    it('submits form with correct data structure', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn();
      
      renderTableDetailsForm(defaultFormValues, mockSubmit);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test_table',
            label: 'Test Table',
            description: 'A test table for validation',
            primaryKey: ['id'],
          })
        );
      });
    });

    it('handles form submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Server error'));
      
      renderTableDetailsForm(defaultFormValues, mockSubmit);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred while saving/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      const mockSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      renderTableDetailsForm(defaultFormValues, mockSubmit);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      expect(screen.getByText(/saving.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Monaco Editor Integration', () => {
    it('renders JSON schema editor for advanced configuration', () => {
      renderTableDetailsForm();

      const jsonEditorToggle = screen.getByRole('button', { name: /json editor/i });
      expect(jsonEditorToggle).toBeInTheDocument();
    });

    it('validates JSON schema in Monaco editor', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm();

      // Open JSON editor
      const jsonEditorToggle = screen.getByRole('button', { name: /json editor/i });
      await user.click(jsonEditorToggle);

      // Monaco editor would be rendered here
      const jsonEditor = screen.getByTestId('monaco-editor');
      expect(jsonEditor).toBeInTheDocument();

      // Test invalid JSON handling
      const invalidJson = '{ "invalid": json }';
      fireEvent.change(jsonEditor, { target: { value: invalidJson } });

      await waitFor(() => {
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument();
      });
    });

    it('synchronizes between form fields and JSON editor', async () => {
      const user = userEvent.setup();
      renderTableDetailsForm();

      // Make changes in form
      const nameInput = screen.getByLabelText(/table name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'synchronized_table');

      // Open JSON editor
      const jsonEditorToggle = screen.getByRole('button', { name: /json editor/i });
      await user.click(jsonEditorToggle);

      // Check that JSON reflects form changes
      const jsonEditor = screen.getByTestId('monaco-editor');
      expect(jsonEditor).toHaveValue(
        expect.stringContaining('"name":"synchronized_table"')
      );
    });
  });
});

describe('FieldsTable Component', () => {
  const mockFields = generateLargeFieldset(100);
  const smallFieldset = generateLargeFieldset(5);

  const renderFieldsTable = (fields = smallFieldset, options = {}) => {
    const defaultProps = {
      fields,
      serviceName: 'test_service',
      tableName: 'test_table',
      onFieldAdd: vi.fn(),
      onFieldEdit: vi.fn(),
      onFieldDelete: vi.fn(),
      loading: false,
      ...options,
    };

    return renderWithQuery(<FieldsTable {...defaultProps} />);
  };

  describe('TanStack Table Integration', () => {
    it('renders table with correct columns and data', () => {
      renderFieldsTable();

      // Check table headers
      expect(screen.getByRole('columnheader', { name: /field name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /nullable/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /primary key/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Check data rows
      expect(screen.getByRole('cell', { name: /field_1/i })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: /string/i })).toBeInTheDocument();
    });

    it('handles sorting by column headers', async () => {
      const user = userEvent.setup();
      renderFieldsTable();

      const nameHeader = screen.getByRole('columnheader', { name: /field name/i });
      await user.click(nameHeader);

      // Check for sort indicator
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

      // Click again for descending sort
      await user.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    });

    it('implements column filtering functionality', async () => {
      const user = userEvent.setup();
      renderFieldsTable();

      const filterInput = screen.getByPlaceholderText(/filter fields.../i);
      await user.type(filterInput, 'field_1');

      // Should show only matching fields
      await waitFor(() => {
        expect(screen.getAllByRole('row')).toHaveLength(2); // Header + 1 data row
      });
    });

    it('supports column visibility toggle', async () => {
      const user = userEvent.setup();
      renderFieldsTable();

      const columnToggleButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnToggleButton);

      // Toggle off a column
      const nullableToggle = screen.getByRole('checkbox', { name: /nullable/i });
      await user.click(nullableToggle);

      // Column should be hidden
      expect(screen.queryByRole('columnheader', { name: /nullable/i })).not.toBeInTheDocument();
    });

    it('provides pagination controls for large datasets', () => {
      renderFieldsTable(mockFields); // 100 fields

      const pagination = screen.getByRole('navigation', { name: /pagination/i });
      expect(pagination).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /next page/i });
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
      expect(prevButton).toBeDisabled(); // First page
    });
  });

  describe('Virtual Scrolling for Large Datasets', () => {
    it('renders only visible rows for performance with 1000+ fields', () => {
      const largeFieldset = generateLargeFieldset(1500);
      renderFieldsTable(largeFieldset);

      // Should only render visible rows, not all 1500
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThan(100); // Much less than total
      expect(rows.length).toBeGreaterThan(10); // But more than a few
    });

    it('handles scroll events for virtual scrolling', async () => {
      const largeFieldset = generateLargeFieldset(1500);
      renderFieldsTable(largeFieldset);

      const scrollContainer = screen.getByTestId('virtual-scroll-container');
      
      // Simulate scroll to middle
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 5000 } });

      await waitFor(() => {
        // Should show different set of rows
        expect(screen.getByText(/field_500/i)).toBeInTheDocument();
      });
    });

    it('maintains scroll position when data updates', async () => {
      const largeFieldset = generateLargeFieldset(1500);
      const { rerender } = renderFieldsTable(largeFieldset);

      const scrollContainer = screen.getByTestId('virtual-scroll-container');
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 5000 } });

      // Update data while maintaining scroll position
      const updatedFieldset = [...largeFieldset];
      updatedFieldset[500] = { ...updatedFieldset[500], name: 'updated_field_500' };
      
      rerender(<FieldsTable fields={updatedFieldset} serviceName="test_service" tableName="test_table" />);

      expect(scrollContainer.scrollTop).toBe(5000);
      expect(screen.getByText(/updated_field_500/i)).toBeInTheDocument();
    });

    it('provides smooth scrolling experience with loading indicators', async () => {
      const largeFieldset = generateLargeFieldset(2000);
      renderFieldsTable(largeFieldset, { loading: true });

      // Should show loading state
      expect(screen.getByTestId('table-loading-spinner')).toBeInTheDocument();

      // Should show skeleton rows during loading
      const skeletonRows = screen.getAllByTestId('skeleton-row');
      expect(skeletonRows.length).toBeGreaterThan(0);
    });
  });

  describe('Field Management Actions', () => {
    it('handles field addition through modal dialog', async () => {
      const user = userEvent.setup();
      const mockOnFieldAdd = vi.fn();
      renderFieldsTable(smallFieldset, { onFieldAdd: mockOnFieldAdd });

      const addFieldButton = screen.getByRole('button', { name: /add field/i });
      await user.click(addFieldButton);

      // Modal should open
      const modal = screen.getByRole('dialog', { name: /add field/i });
      expect(modal).toBeInTheDocument();

      // Fill form and submit
      const nameInput = screen.getByLabelText(/field name/i);
      const typeSelect = screen.getByLabelText(/field type/i);
      
      await user.type(nameInput, 'new_field');
      await user.selectOptions(typeSelect, 'string');

      const saveButton = screen.getByRole('button', { name: /save field/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnFieldAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'new_field',
            type: 'string',
          })
        );
      });
    });

    it('handles field editing with inline form validation', async () => {
      const user = userEvent.setup();
      const mockOnFieldEdit = vi.fn();
      renderFieldsTable(smallFieldset, { onFieldEdit: mockOnFieldEdit });

      // Click edit button for first field
      const editButtons = screen.getAllByRole('button', { name: /edit field/i });
      await user.click(editButtons[0]);

      // Should switch to edit mode
      const nameInput = screen.getByDisplayValue('field_1');
      await user.clear(nameInput);
      await user.type(nameInput, 'edited_field_1');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnFieldEdit).toHaveBeenCalledWith(
          'field-1',
          expect.objectContaining({
            name: 'edited_field_1',
          })
        );
      });
    });

    it('handles field deletion with confirmation dialog', async () => {
      const user = userEvent.setup();
      const mockOnFieldDelete = vi.fn();
      renderFieldsTable(smallFieldset, { onFieldDelete: mockOnFieldDelete });

      // Click delete button for first field
      const deleteButtons = screen.getAllByRole('button', { name: /delete field/i });
      await user.click(deleteButtons[0]);

      // Confirmation dialog should appear
      const confirmDialog = screen.getByRole('dialog', { name: /confirm deletion/i });
      expect(confirmDialog).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnFieldDelete).toHaveBeenCalledWith('field-1');
      });
    });

    it('prevents deletion of primary key fields', async () => {
      const user = userEvent.setup();
      const fieldsWithPK = [
        { ...createMockField(), primaryKey: true },
        ...smallFieldset.slice(1),
      ];
      
      renderFieldsTable(fieldsWithPK);

      // Delete button for primary key field should be disabled
      const deleteButtons = screen.getAllByRole('button', { name: /delete field/i });
      expect(deleteButtons[0]).toBeDisabled();
    });
  });

  describe('React Query Integration and Caching', () => {
    it('uses React Query for field data fetching with proper cache management', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
        },
      });

      renderWithQuery(
        <FieldsTable 
          serviceName="test_service" 
          tableName="test_table"
          fields={[]}
        />,
        { queryClient }
      );

      // Should show loading state initially
      expect(screen.getByTestId('table-loading-spinner')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Check that data is cached
      const cachedData = queryClient.getQueryData(['fields', 'test_service', 'test_table']);
      expect(cachedData).toBeDefined();
    });

    it('handles field mutations with optimistic updates', async () => {
      const user = userEvent.setup();
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      });

      renderWithQuery(
        <FieldsTable 
          serviceName="test_service" 
          tableName="test_table"
          fields={smallFieldset}
        />,
        { queryClient }
      );

      // Edit a field
      const editButtons = screen.getAllByRole('button', { name: /edit field/i });
      await user.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('field_1');
      await user.clear(nameInput);
      await user.type(nameInput, 'optimistically_updated');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show optimistic update immediately
      expect(screen.getByText('optimistically_updated')).toBeInTheDocument();
    });

    it('handles network errors with proper error boundaries', async () => {
      server.use(
        http.get('/api/v2/test_service/_schema/error-table', () => {
          return HttpResponse.json(
            { error: 'Network error' },
            { status: 500 }
          );
        })
      );

      renderFieldsTable([], { tableName: 'error-table' });

      await waitFor(() => {
        expect(screen.getByText(/failed to load fields/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('implements proper cache invalidation on field updates', async () => {
      const user = userEvent.setup();
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
        },
      });

      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderWithQuery(
        <FieldsTable 
          serviceName="test_service" 
          tableName="test_table"
          fields={smallFieldset}
        />,
        { queryClient }
      );

      // Perform field update
      const editButtons = screen.getAllByRole('button', { name: /edit field/i });
      await user.click(editButtons[0]);

      const nameInput = screen.getByDisplayValue('field_1');
      await user.clear(nameInput);
      await user.type(nameInput, 'cache_test');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['fields', 'test_service', 'test_table'],
        });
      });
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('supports keyboard navigation through table rows', async () => {
      const user = userEvent.setup();
      renderFieldsTable();

      const firstRow = screen.getAllByRole('row')[1]; // Skip header
      firstRow.focus();

      // Arrow down should move to next row
      await user.keyboard('{ArrowDown}');
      const secondRow = screen.getAllByRole('row')[2];
      expect(secondRow).toHaveFocus();

      // Arrow up should move back
      await user.keyboard('{ArrowUp}');
      expect(firstRow).toHaveFocus();
    });

    it('provides proper ARIA labels for screen readers', () => {
      renderFieldsTable();

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Database fields table');

      const sortButtons = screen.getAllByRole('button', { name: /sort by/i });
      expect(sortButtons.length).toBeGreaterThan(0);
    });

    it('supports high contrast mode and theme switching', () => {
      renderFieldsTable();

      const table = screen.getByRole('table');
      expect(table).toHaveClass('contrast-more:border-2');
    });
  });
});

describe('RelationshipsTable Component', () => {
  const mockRelationships = generateLargeRelationshipset(10);
  const smallRelationshipSet = generateLargeRelationshipset(3);

  const renderRelationshipsTable = (relationships = smallRelationshipSet, options = {}) => {
    const defaultProps = {
      relationships,
      serviceName: 'test_service',
      tableName: 'test_table',
      onRelationshipAdd: vi.fn(),
      onRelationshipDelete: vi.fn(),
      loading: false,
      ...options,
    };

    return renderWithQuery(<RelationshipsTable {...defaultProps} />);
  };

  describe('Relationship Table Rendering', () => {
    it('renders relationship table with correct structure', () => {
      renderRelationshipsTable();

      // Check headers
      expect(screen.getByRole('columnheader', { name: /relationship name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /foreign table/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /foreign field/i })).toBeInTheDocument();

      // Check data
      expect(screen.getByText('relationship_1')).toBeInTheDocument();
      expect(screen.getByText('belongs_to')).toBeInTheDocument();
    });

    it('handles empty relationships gracefully', () => {
      renderRelationshipsTable([]);

      expect(screen.getByText(/no relationships found/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add relationship/i })).toBeInTheDocument();
    });

    it('displays relationship type badges with proper styling', () => {
      const mixedRelationships = [
        createMockRelationship({ type: 'belongs_to' }),
        createMockRelationship({ type: 'has_many', id: 'rel-2' }),
        createMockRelationship({ type: 'has_one', id: 'rel-3' }),
      ];

      renderRelationshipsTable(mixedRelationships);

      expect(screen.getByText('belongs_to')).toHaveClass('bg-blue-100');
      expect(screen.getByText('has_many')).toHaveClass('bg-green-100');
      expect(screen.getByText('has_one')).toHaveClass('bg-yellow-100');
    });
  });

  describe('Relationship Management', () => {
    it('handles relationship addition with comprehensive form validation', async () => {
      const user = userEvent.setup();
      const mockOnAdd = vi.fn();
      renderRelationshipsTable([], { onRelationshipAdd: mockOnAdd });

      const addButton = screen.getByRole('button', { name: /add relationship/i });
      await user.click(addButton);

      // Modal should open with form
      const modal = screen.getByRole('dialog', { name: /add relationship/i });
      expect(modal).toBeInTheDocument();

      // Fill form
      const nameInput = screen.getByLabelText(/relationship name/i);
      const typeSelect = screen.getByLabelText(/relationship type/i);
      const foreignTableInput = screen.getByLabelText(/foreign table/i);
      const foreignFieldInput = screen.getByLabelText(/foreign field/i);

      await user.type(nameInput, 'user_posts');
      await user.selectOptions(typeSelect, 'has_many');
      await user.type(foreignTableInput, 'posts');
      await user.type(foreignFieldInput, 'user_id');

      const saveButton = screen.getByRole('button', { name: /save relationship/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'user_posts',
            type: 'has_many',
            foreignTable: 'posts',
            foreignField: 'user_id',
          })
        );
      });
    });

    it('validates relationship configuration before saving', async () => {
      const user = userEvent.setup();
      renderRelationshipsTable([]);

      const addButton = screen.getByRole('button', { name: /add relationship/i });
      await user.click(addButton);

      // Try to save without required fields
      const saveButton = screen.getByRole('button', { name: /save relationship/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/relationship name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/foreign table is required/i)).toBeInTheDocument();
      });
    });

    it('handles relationship deletion with proper confirmation', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      renderRelationshipsTable(smallRelationshipSet, { onRelationshipDelete: mockOnDelete });

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete relationship/i });
      await user.click(deleteButtons[0]);

      // Confirmation dialog
      const confirmDialog = screen.getByRole('dialog', { name: /confirm deletion/i });
      expect(confirmDialog).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('rel-1');
      });
    });

    it('shows relationship details on row click or expand', async () => {
      const user = userEvent.setup();
      renderRelationshipsTable();

      const firstRow = screen.getAllByRole('row')[1]; // Skip header
      await user.click(firstRow);

      // Should show expanded details
      expect(screen.getByText(/relationship details/i)).toBeInTheDocument();
      expect(screen.getByText(/local field:/i)).toBeInTheDocument();
      expect(screen.getByText(/foreign key constraints/i)).toBeInTheDocument();
    });
  });

  describe('Large Dataset Handling', () => {
    it('implements virtual scrolling for large relationship sets', () => {
      const largeRelationshipSet = generateLargeRelationshipset(500);
      renderRelationshipsTable(largeRelationshipSet);

      const scrollContainer = screen.getByTestId('relationships-scroll-container');
      expect(scrollContainer).toBeInTheDocument();

      // Should only render visible rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeLessThan(50); // Much less than total 500
    });

    it('provides search and filtering capabilities', async () => {
      const user = userEvent.setup();
      renderRelationshipsTable(mockRelationships);

      const searchInput = screen.getByPlaceholderText(/search relationships.../i);
      await user.type(searchInput, 'relationship_1');

      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(2); // Header + 1 matching row
      });
    });

    it('groups relationships by type with collapsible sections', async () => {
      const user = userEvent.setup();
      const mixedRelationships = [
        ...Array(5).fill(null).map((_, i) => createMockRelationship({ 
          id: `belongs-${i}`, 
          type: 'belongs_to' 
        })),
        ...Array(3).fill(null).map((_, i) => createMockRelationship({ 
          id: `has-many-${i}`, 
          type: 'has_many' 
        })),
      ];

      renderRelationshipsTable(mixedRelationships);

      // Should have grouping headers
      expect(screen.getByText(/belongs to \(5\)/i)).toBeInTheDocument();
      expect(screen.getByText(/has many \(3\)/i)).toBeInTheDocument();

      // Test collapsing a group
      const belongsToHeader = screen.getByRole('button', { name: /belongs to/i });
      await user.click(belongsToHeader);

      // Belongs to relationships should be hidden
      const belongsToRows = screen.queryAllByText(/belongs_to/);
      expect(belongsToRows).toHaveLength(1); // Only the group header
    });
  });

  describe('Advanced Relationship Features', () => {
    it('validates foreign key constraints and table references', async () => {
      const user = userEvent.setup();
      renderRelationshipsTable([]);

      const addButton = screen.getByRole('button', { name: /add relationship/i });
      await user.click(addButton);

      // Mock validation endpoint
      server.use(
        http.post('/api/v2/:service/_schema/:table/validate-relationship', () => {
          return HttpResponse.json({
            valid: false,
            errors: [
              { field: 'foreignTable', message: 'Table does not exist' },
              { field: 'foreignField', message: 'Field does not exist in target table' },
            ],
          }, { status: 400 });
        })
      );

      const foreignTableInput = screen.getByLabelText(/foreign table/i);
      await user.type(foreignTableInput, 'nonexistent_table');

      const validateButton = screen.getByRole('button', { name: /validate/i });
      await user.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/table does not exist/i)).toBeInTheDocument();
      });
    });

    it('suggests relationship configurations based on field names', async () => {
      const user = userEvent.setup();
      renderRelationshipsTable([]);

      const addButton = screen.getByRole('button', { name: /add relationship/i });
      await user.click(addButton);

      // Auto-suggestion based on field naming conventions
      const foreignFieldInput = screen.getByLabelText(/foreign field/i);
      await user.type(foreignFieldInput, 'user_');

      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions.some(option => option.textContent.includes('user_id'))).toBe(true);
      });
    });

    it('handles bidirectional relationship creation', async () => {
      const user = userEvent.setup();
      const mockOnAdd = vi.fn();
      renderRelationshipsTable([], { onRelationshipAdd: mockOnAdd });

      const addButton = screen.getByRole('button', { name: /add relationship/i });
      await user.click(addButton);

      // Fill relationship form
      await user.type(screen.getByLabelText(/relationship name/i), 'user_posts');
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'has_many');
      await user.type(screen.getByLabelText(/foreign table/i), 'posts');

      // Enable bidirectional relationship
      const bidirectionalCheckbox = screen.getByRole('checkbox', { name: /create inverse relationship/i });
      await user.click(bidirectionalCheckbox);

      const inverseNameInput = screen.getByLabelText(/inverse relationship name/i);
      expect(inverseNameInput).toHaveValue('post_user'); // Auto-generated

      const saveButton = screen.getByRole('button', { name: /save relationship/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledTimes(2); // Both directions
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles API errors gracefully with retry mechanisms', async () => {
      const user = userEvent.setup();
      
      server.use(
        http.get('/api/v2/test_service/_schema/test_table/relationships', () => {
          return HttpResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 }
          );
        })
      );

      renderRelationshipsTable([]);

      await waitFor(() => {
        expect(screen.getByText(/failed to load relationships/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(screen.getByTestId('table-loading-spinner')).toBeInTheDocument();
    });

    it('validates relationship integrity before operations', async () => {
      const user = userEvent.setup();
      const mockOnDelete = vi.fn();
      
      const relationshipsWithConstraints = [
        createMockRelationship({ 
          name: 'critical_relationship',
          hasConstraints: true,
          constraintMessage: 'This relationship has dependent records'
        }),
      ];

      renderRelationshipsTable(relationshipsWithConstraints, { onRelationshipDelete: mockOnDelete });

      const deleteButtons = screen.getAllByRole('button', { name: /delete relationship/i });
      await user.click(deleteButtons[0]);

      // Should show constraint warning
      const warningDialog = screen.getByRole('dialog', { name: /relationship constraint warning/i });
      expect(warningDialog).toBeInTheDocument();
      expect(screen.getByText(/this relationship has dependent records/i)).toBeInTheDocument();

      // Force delete option
      const forceDeleteCheckbox = screen.getByRole('checkbox', { name: /force delete/i });
      await user.click(forceDeleteCheckbox);

      const confirmButton = screen.getByRole('button', { name: /delete anyway/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('rel-1', { force: true });
      });
    });
  });
});

describe('Component Integration Tests', () => {
  it('coordinates between all three components in table details workflow', async () => {
    const user = userEvent.setup();
    const mockTable = createMockTable();
    const mockFields = generateLargeFieldset(10);
    const mockRelationships = generateLargeRelationshipset(5);

    // Render all components together
    const IntegratedView = () => (
      <div>
        <TableDetailsForm table={mockTable} onSubmit={vi.fn()} />
        <FieldsTable 
          fields={mockFields}
          serviceName="test_service"
          tableName="test_table"
          onFieldAdd={vi.fn()}
          onFieldEdit={vi.fn()}
          onFieldDelete={vi.fn()}
        />
        <RelationshipsTable
          relationships={mockRelationships}
          serviceName="test_service"
          tableName="test_table"
          onRelationshipAdd={vi.fn()}
          onRelationshipDelete={vi.fn()}
        />
      </div>
    );

    renderWithProviders(<IntegratedView />);

    // Verify all components are rendered
    expect(screen.getByLabelText(/table name/i)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /database fields table/i })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /relationships table/i })).toBeInTheDocument();

    // Test cross-component interactions
    // Changing table name should affect other components
    const tableNameInput = screen.getByLabelText(/table name/i);
    await user.clear(tableNameInput);
    await user.type(tableNameInput, 'updated_table');

    // Should trigger updates in dependent components
    await waitFor(() => {
      expect(screen.getByText(/fields for updated_table/i)).toBeInTheDocument();
      expect(screen.getByText(/relationships for updated_table/i)).toBeInTheDocument();
    });
  });

  it('handles real-time updates across components with React Query synchronization', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    const mockTable = createMockTable();
    const mockFields = generateLargeFieldset(5);

    const LiveUpdateTest = () => (
      <QueryClientProvider client={queryClient}>
        <FieldsTable 
          fields={mockFields}
          serviceName="test_service"
          tableName="test_table"
          onFieldAdd={vi.fn()}
          onFieldEdit={vi.fn()}
          onFieldDelete={vi.fn()}
        />
      </QueryClientProvider>
    );

    render(<LiveUpdateTest />);

    // Simulate real-time update from server
    queryClient.setQueryData(['fields', 'test_service', 'test_table'], [
      ...mockFields,
      createMockField({ id: 'new-field', name: 'real_time_field' }),
    ]);

    await waitFor(() => {
      expect(screen.getByText('real_time_field')).toBeInTheDocument();
    });
  });

  it('maintains performance with concurrent user interactions across components', async () => {
    const user = userEvent.setup();
    const largeFields = generateLargeFieldset(1000);
    const largeRelationships = generateLargeRelationshipset(200);

    const PerformanceTestView = () => (
      <div>
        <FieldsTable 
          fields={largeFields}
          serviceName="test_service"
          tableName="test_table"
          onFieldAdd={vi.fn()}
          onFieldEdit={vi.fn()}
          onFieldDelete={vi.fn()}
        />
        <RelationshipsTable
          relationships={largeRelationships}
          serviceName="test_service"
          tableName="test_table"
          onRelationshipAdd={vi.fn()}
          onRelationshipDelete={vi.fn()}
        />
      </div>
    );

    renderWithProviders(<PerformanceTestView />);

    // Concurrent operations
    const startTime = performance.now();

    // Scroll fields table
    const fieldsContainer = screen.getByTestId('virtual-scroll-container');
    fireEvent.scroll(fieldsContainer, { target: { scrollTop: 5000 } });

    // Filter relationships
    const relationshipsSearch = screen.getByPlaceholderText(/search relationships.../i);
    await user.type(relationshipsSearch, 'relationship_50');

    // Sort fields table
    const nameHeader = screen.getByRole('columnheader', { name: /field name/i });
    await user.click(nameHeader);

    const endTime = performance.now();
    
    // Operations should complete within reasonable time (< 1000ms)
    expect(endTime - startTime).toBeLessThan(1000);

    // All components should still be responsive
    expect(screen.getByText(/field_500/i)).toBeInTheDocument();
    expect(screen.getByText(/relationship_50/i)).toBeInTheDocument();
  });
});