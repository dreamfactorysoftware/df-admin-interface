import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { 
  renderWithProviders, 
  createMockRouter,
  accessibilityUtils,
  headlessUIUtils,
  testUtils
} from '../../../test/utils/test-utils';
import TableDetailsPage from './page';
import { TableDetailsType, TableField, TableRelated } from '../../../types/schema';

// Mock the ACE editor component to avoid issues with external dependencies
vi.mock('../../../components/ui/ace-editor', () => ({
  default: ({ value, onChange, testId }: any) => (
    <textarea
      data-testid={testId || 'ace-editor'}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="JSON Editor"
    />
  ),
}));

// Mock Next.js params and searchParams
const mockParams = { service: 'testdb' };
const mockSearchParams = new URLSearchParams();

// Mock table data for testing
const mockTableFields: TableField[] = [
  {
    name: 'id',
    alias: null,
    label: 'ID',
    description: 'Primary key',
    native: [],
    type: 'id',
    dbType: 'int',
    length: null,
    precision: null,
    scale: null,
    default: null,
    required: true,
    allowNull: false,
    fixedLength: false,
    supportsMultibyte: false,
    autoIncrement: true,
    isPrimaryKey: true,
    isUnique: true,
    isIndex: false,
    isForeignKey: false,
    refTable: null,
    refField: null,
    refOnUpdate: null,
    refOnDelete: null,
    picklist: null,
    validation: null,
    dbFunction: null,
    isVirtual: false,
    isAggregate: false,
  },
  {
    name: 'name',
    alias: null,
    label: 'Name',
    description: 'User name',
    native: [],
    type: 'string',
    dbType: 'varchar',
    length: 255,
    precision: null,
    scale: null,
    default: null,
    required: true,
    allowNull: false,
    fixedLength: false,
    supportsMultibyte: true,
    autoIncrement: false,
    isPrimaryKey: false,
    isUnique: false,
    isIndex: false,
    isForeignKey: false,
    refTable: null,
    refField: null,
    refOnUpdate: null,
    refOnDelete: null,
    picklist: null,
    validation: null,
    dbFunction: null,
    isVirtual: false,
    isAggregate: false,
  },
];

const mockTableRelated: TableRelated[] = [
  {
    name: 'user_roles',
    alias: null,
    label: 'User Roles',
    description: 'Associated user roles',
    native: [],
    type: 'has_many',
    field: 'user_id',
    isVirtual: false,
    refServiceID: 1,
    refTable: 'user_roles',
    refField: 'user_id',
    refOnUpdate: 'CASCADE',
    refOnDelete: 'CASCADE',
    junctionServiceID: null,
    junctionTable: null,
    junctionField: null,
    junctionRefField: null,
    alwaysFetch: false,
    flatten: false,
    flattenDropPrefix: false,
  },
];

const mockTableData: TableDetailsType = {
  name: 'users',
  alias: 'user',
  label: 'Users',
  description: 'User accounts table',
  native: [],
  plural: 'Users',
  isView: false,
  primaryKey: ['id'],
  nameField: 'name',
  field: mockTableFields,
  related: mockTableRelated,
  constraints: {},
  access: 7, // Full CRUD access
};

// MSW handlers for API endpoints
const tableDetailsHandlers = [
  // Get table details for edit mode
  http.get('/api/v2/testdb/_schema/users', () => {
    return HttpResponse.json({
      resource: [mockTableData],
    });
  }),

  // Create new table
  http.post('/api/v2/testdb/_schema', async ({ request }) => {
    const body = await request.json() as { resource: TableDetailsType[] };
    const newTable = body.resource[0];
    return HttpResponse.json({
      resource: [{ ...newTable, id: 'new-table-id' }],
    });
  }),

  // Update existing table
  http.patch('/api/v2/testdb/_schema/users', async ({ request }) => {
    const body = await request.json() as Partial<TableDetailsType>;
    return HttpResponse.json({
      resource: [{ ...mockTableData, ...body }],
    });
  }),

  // Error scenarios
  http.post('/api/v2/testdb/_schema/error', () => {
    return HttpResponse.json(
      { error: 'Table creation failed' },
      { status: 400 }
    );
  }),

  http.patch('/api/v2/testdb/_schema/users/error', () => {
    return HttpResponse.json(
      { error: 'Table update failed' },
      { status: 400 }
    );
  }),
];

describe('TableDetailsPage', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Setup MSW handlers
    server.use(...tableDetailsHandlers);
    
    // Create mock router
    mockRouter = createMockRouter();
    
    // Setup user events
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    it('should render create mode correctly', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: {
            router: mockRouter,
            pathname: '/adf-schema/df-table-details',
            searchParams: new URLSearchParams('mode=create'),
          },
        }
      );

      // Check if form fields are rendered
      expect(screen.getByLabelText(/table name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plural/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

      // Check create mode specific elements
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Verify tab navigation
      expect(screen.getByRole('tab', { name: /table/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /json/i })).toBeInTheDocument();

      // Should not show fields and relationships tables in create mode
      expect(screen.queryByText(/fields/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/relationships/i)).not.toBeInTheDocument();
    });

    it('should render edit mode correctly', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={{ ...mockParams, table: 'users' }} 
          searchParams={{ mode: 'edit' }} 
        />,
        {
          providerOptions: {
            router: mockRouter,
            pathname: '/adf-schema/df-table-details/users',
            searchParams: new URLSearchParams('mode=edit'),
          },
        }
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument();
      });

      // Check if form is populated with existing data
      expect(screen.getByDisplayValue('users')).toBeInTheDocument();
      expect(screen.getByDisplayValue('user')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Users')).toBeInTheDocument();

      // Check edit mode specific elements
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();

      // Should show fields and relationships sections in edit mode
      await waitFor(() => {
        expect(screen.getByText(/fields/i)).toBeInTheDocument();
        expect(screen.getByText(/relationships/i)).toBeInTheDocument();
      });

      // Table name should be disabled in edit mode
      const nameInput = screen.getByDisplayValue('users');
      expect(nameInput).toBeDisabled();
    });

    it('should render with dark theme correctly', () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: {
            theme: 'dark',
          },
        }
      );

      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('dark');
    });
  });

  describe('Form Validation', () => {
    it('should validate required table name field', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      
      // Try to submit without entering table name
      await user.click(saveButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/table name is required/i)).toBeInTheDocument();
      });

      // Should not trigger API call
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should validate table name format', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const nameInput = screen.getByLabelText(/table name/i);
      const saveButton = screen.getByRole('button', { name: /save/i });

      // Enter invalid table name (with spaces)
      await user.type(nameInput, 'invalid table name');
      await user.click(saveButton);

      // Should show format validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid table name format/i)).toBeInTheDocument();
      });
    });

    it('should accept valid form data', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Fill out valid form data
      await user.type(screen.getByLabelText(/table name/i), 'new_table');
      await user.type(screen.getByLabelText(/alias/i), 'newTable');
      await user.type(screen.getByLabelText(/label/i), 'New Table');
      await user.type(screen.getByLabelText(/plural/i), 'New Tables');
      await user.type(screen.getByLabelText(/description/i), 'A new table for testing');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should not show validation errors
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();

      // Should trigger API call and navigation
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/adf-schema/new_table')
        );
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between Table and JSON tabs', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const tableTab = screen.getByRole('tab', { name: /table/i });
      const jsonTab = screen.getByRole('tab', { name: /json/i });

      // Initially on Table tab
      expect(tableTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByLabelText(/table name/i)).toBeVisible();

      // Switch to JSON tab
      await user.click(jsonTab);

      expect(jsonTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('ace-editor')).toBeVisible();

      // Switch back to Table tab
      await user.click(tableTab);

      expect(tableTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByLabelText(/table name/i)).toBeVisible();
    });

    it('should test tab navigation with keyboard', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const tableTab = screen.getByRole('tab', { name: /table/i });
      const jsonTab = screen.getByRole('tab', { name: /json/i });

      // Test keyboard navigation
      tableTab.focus();
      await user.keyboard('{ArrowRight}');
      
      expect(document.activeElement).toBe(jsonTab);

      await user.keyboard('{Enter}');
      expect(jsonTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('API Interactions', () => {
    it('should create new table successfully', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Fill out form
      await user.type(screen.getByLabelText(/table name/i), 'new_table');
      await user.type(screen.getByLabelText(/label/i), 'New Table');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();

      // Should navigate to new table on success
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          '/adf-schema/df-table-details/new_table?mode=edit'
        );
      });
    });

    it('should update existing table successfully', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={{ ...mockParams, table: 'users' }} 
          searchParams={{ mode: 'edit' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument();
      });

      // Update form data
      const labelInput = screen.getByDisplayValue('Users');
      await user.clear(labelInput);
      await user.type(labelInput, 'Updated Users');

      // Submit form
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);

      // Should navigate back on success
      await waitFor(() => {
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      server.use(
        http.post('/api/v2/testdb/_schema', () => {
          return HttpResponse.json(
            { error: 'Table creation failed' },
            { status: 400 }
          );
        })
      );

      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Fill out form
      await user.type(screen.getByLabelText(/table name/i), 'error_table');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/table creation failed/i)).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('JSON Editor', () => {
    it('should sync form data with JSON editor', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Fill out form
      await user.type(screen.getByLabelText(/table name/i), 'test_table');
      await user.type(screen.getByLabelText(/label/i), 'Test Table');

      // Switch to JSON tab
      const jsonTab = screen.getByRole('tab', { name: /json/i });
      await user.click(jsonTab);

      // Check if JSON reflects form data
      const jsonEditor = screen.getByTestId('ace-editor');
      const jsonValue = JSON.parse(jsonEditor.textContent || '{}');
      
      expect(jsonValue.name).toBe('test_table');
      expect(jsonValue.label).toBe('Test Table');
    });

    it('should validate JSON syntax', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Switch to JSON tab
      const jsonTab = screen.getByRole('tab', { name: /json/i });
      await user.click(jsonTab);

      // Enter invalid JSON
      const jsonEditor = screen.getByTestId('ace-editor');
      await user.clear(jsonEditor);
      await user.type(jsonEditor, '{ invalid json }');

      // Try to save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show JSON validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument();
      });
    });

    it('should save from JSON editor successfully', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Switch to JSON tab
      const jsonTab = screen.getByRole('tab', { name: /json/i });
      await user.click(jsonTab);

      // Enter valid JSON
      const jsonEditor = screen.getByTestId('ace-editor');
      const validTableJson = JSON.stringify({
        name: 'json_table',
        label: 'JSON Table',
        description: 'Created from JSON',
        field: [
          {
            name: 'id',
            type: 'id',
            required: true,
            isPrimaryKey: true,
          },
        ],
      }, null, 2);

      await user.clear(jsonEditor);
      await user.type(jsonEditor, validTableJson);

      // Save from JSON
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should navigate successfully
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when cancel is clicked', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should navigate to table list when breadcrumb is clicked', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const breadcrumbLink = screen.getByRole('link', { name: /tables/i });
      await user.click(breadcrumbLink);

      expect(mockRouter.push).toHaveBeenCalledWith('/adf-schema/tables');
    });

    it('should prevent navigation with unsaved changes', async () => {
      const mockBeforeUnload = vi.spyOn(window, 'addEventListener');
      
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Make changes to form
      await user.type(screen.getByLabelText(/table name/i), 'unsaved_table');

      // Check if beforeunload listener is added
      expect(mockBeforeUnload).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      mockBeforeUnload.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should meet WCAG 2.1 AA compliance standards', async () => {
      const { container } = renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Check form labels
      const formInputs = screen.getAllByRole('textbox');
      formInputs.forEach((input) => {
        expect(accessibilityUtils.hasAriaLabel(input)).toBe(true);
      });

      // Check button accessibility
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(accessibilityUtils.isKeyboardAccessible(button)).toBe(true);
      });

      // Test keyboard navigation
      const focusableElements = accessibilityUtils.getFocusableElements(container);
      expect(focusableElements.length).toBeGreaterThan(0);

      const navigationResult = await accessibilityUtils.testKeyboardNavigation(
        container,
        user
      );
      expect(navigationResult.success).toBe(true);
    });

    it('should have proper ARIA roles and labels', () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Check form has proper role
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-labelledby');

      // Check tabs have proper ARIA attributes
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-controls');
        expect(tab).toHaveAttribute('aria-selected');
      });

      // Check required fields are marked
      const nameInput = screen.getByLabelText(/table name/i);
      expect(nameInput).toHaveAttribute('aria-required', 'true');
    });

    it('should announce form validation errors to screen readers', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Error should be associated with input via aria-describedby
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/table name/i);
        const errorId = nameInput.getAttribute('aria-describedby');
        expect(errorId).toBeTruthy();
        
        const errorElement = screen.getByText(/table name is required/i);
        expect(errorElement).toHaveAttribute('id', errorId);
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance thresholds', async () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Component should render quickly
      await waitFor(() => {
        expect(screen.getByLabelText(/table name/i)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 100ms per React/Next.js Integration Requirements
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', async () => {
      // Create large mock dataset
      const largeTableData = {
        ...mockTableData,
        field: Array.from({ length: 100 }, (_, index) => ({
          ...mockTableFields[0],
          name: `field_${index}`,
          label: `Field ${index}`,
        })),
      };

      server.use(
        http.get('/api/v2/testdb/_schema/large_table', () => {
          return HttpResponse.json({
            resource: [largeTableData],
          });
        })
      );

      const startTime = performance.now();

      renderWithProviders(
        <TableDetailsPage 
          params={{ ...mockParams, table: 'large_table' }} 
          searchParams={{ mode: 'edit' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('large_table')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load large datasets within reasonable time
      expect(loadTime).toBeLessThan(2000);
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      // Create a component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation();

      renderWithProviders(
        <ThrowingComponent />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Should display error boundary UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Persistence', () => {
    it('should preserve form data when switching tabs', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Fill out form
      await user.type(screen.getByLabelText(/table name/i), 'persistent_table');
      await user.type(screen.getByLabelText(/label/i), 'Persistent Table');

      // Switch to JSON tab and back
      await user.click(screen.getByRole('tab', { name: /json/i }));
      await user.click(screen.getByRole('tab', { name: /table/i }));

      // Data should be preserved
      expect(screen.getByDisplayValue('persistent_table')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Persistent Table')).toBeInTheDocument();
    });

    it('should warn about unsaved changes', async () => {
      const mockLocalStorage = testUtils.mockLocalStorage();

      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Make changes
      await user.type(screen.getByLabelText(/table name/i), 'unsaved_table');

      // Should store draft data
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'table-draft',
        expect.stringContaining('unsaved_table')
      );
    });
  });

  describe('Integration Tests', () => {
    it('should complete full create workflow', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={mockParams} 
          searchParams={{ mode: 'create' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Fill out complete form
      await user.type(screen.getByLabelText(/table name/i), 'integration_test');
      await user.type(screen.getByLabelText(/alias/i), 'integrationTest');
      await user.type(screen.getByLabelText(/label/i), 'Integration Test');
      await user.type(screen.getByLabelText(/plural/i), 'Integration Tests');
      await user.type(screen.getByLabelText(/description/i), 'Table for integration testing');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      // Should navigate to edit mode for the new table
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/adf-schema/integration_test')
        );
      });
    });

    it('should complete full edit workflow', async () => {
      renderWithProviders(
        <TableDetailsPage 
          params={{ ...mockParams, table: 'users' }} 
          searchParams={{ mode: 'edit' }} 
        />,
        {
          providerOptions: { router: mockRouter },
        }
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument();
      });

      // Update description
      const descInput = screen.getByDisplayValue('User accounts table');
      await user.clear(descInput);
      await user.type(descInput, 'Updated user accounts table');

      // Submit update
      await user.click(screen.getByRole('button', { name: /update/i }));

      // Should navigate back
      await waitFor(() => {
        expect(mockRouter.back).toHaveBeenCalled();
      });
    });
  });
});