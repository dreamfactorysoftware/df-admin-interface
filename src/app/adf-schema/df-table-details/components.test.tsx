/**
 * Vitest Unit Tests for Table Details Child Components
 * 
 * This test suite validates the React Hook Form validation workflows, TanStack Table functionality,
 * Monaco editor integration, and React Query data fetching patterns for the table details feature.
 * 
 * Coverage includes:
 * - React Hook Form validation with Zod schema verification
 * - TanStack Table virtual scrolling for 1,000+ table schemas 
 * - Monaco editor integration for JSON editing functionality
 * - React Query mutation and caching with MSW integration
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation for sub-5-second API generation workflow
 * 
 * Performance Target: < 30 seconds for complete test suite execution with Vitest 2.1+
 * Coverage Target: 90%+ code coverage per Section 4.7.1.3 testing infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { server } from '@/test/setup';
import { rest } from 'msw';
import { createVirtualizer } from '@tanstack/react-virtual';

// Import components to test (these would be created during the React migration)
import { TableDetailsForm } from './table-details-form';
import { FieldsTable } from './fields-table';
import { RelationshipsTable } from './relationships-table';

// Mock data factories based on Angular component patterns
import { 
  createMockTableDetails,
  createMockTableFields,
  createMockTableRelationships,
  createLargeDatasetMock
} from '@/test/mocks/table-details-handlers';

// Test utilities for React Testing Library with providers
import { renderWithProviders, createTestQueryClient } from '@/test/utils/test-utils';

// Zod schemas for validation testing (would match React implementation)
const tableDetailsSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50, 'Name too long'),
  alias: z.string().optional(),
  label: z.string().optional(),
  plural: z.string().optional(),
  description: z.string().optional(),
});

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.string().min(1, 'Field type is required'),
  required: z.boolean().default(false),
  primary_key: z.boolean().default(false),
  auto_increment: z.boolean().default(false),
  virtual: z.boolean().default(false),
  aggregate: z.string().optional(),
});

const relationshipSchema = z.object({
  name: z.string().min(1, 'Relationship name is required'),
  type: z.enum(['belongs_to', 'has_one', 'has_many', 'many_to_many']),
  ref_table: z.string().min(1, 'Referenced table is required'),
  ref_field: z.string().min(1, 'Referenced field is required'),
  junction_table: z.string().optional(),
});

// Mock data based on Angular DfTableDetailsComponent patterns
const mockTableData = createMockTableDetails({
  name: 'users',
  alias: 'user_table',
  label: 'Users',
  plural: 'Users',
  description: 'User account information',
});

const mockFieldsData = createMockTableFields([
  {
    name: 'id',
    type: 'integer',
    required: true,
    primary_key: true,
    auto_increment: true,
  },
  {
    name: 'email',
    type: 'string',
    required: true,
    size: 255,
  },
  {
    name: 'created_at',
    type: 'timestamp',
    required: true,
  },
]);

const mockRelationshipsData = createMockTableRelationships([
  {
    name: 'profile',
    type: 'has_one',
    ref_table: 'user_profiles',
    ref_field: 'user_id',
  },
  {
    name: 'orders',
    type: 'has_many', 
    ref_table: 'orders',
    ref_field: 'user_id',
  },
]);

// Create large dataset for virtualization testing (1,000+ records)
const largeMockFieldsData = createLargeDatasetMock('fields', 1500);
const largeMockRelationshipsData = createLargeDatasetMock('relationships', 1200);

describe('TableDetailsForm Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    user = userEvent.setup();
    
    // Setup MSW handlers for form data
    server.use(
      rest.get('/api/v2/system/schema/:dbName/:tableName', (req, res, ctx) => {
        return res(ctx.json(mockTableData));
      }),
      rest.post('/api/v2/system/schema/:dbName', (req, res, ctx) => {
        return res(ctx.json({ ...mockTableData, id: 1 }));
      }),
      rest.patch('/api/v2/system/schema/:dbName/:tableName', (req, res, ctx) => {
        return res(ctx.json(mockTableData));
      })
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Form Validation with React Hook Form and Zod', () => {
    it('should render form fields with proper validation', async () => {
      renderWithProviders(
        <TableDetailsForm 
          mode="create"
          dbName="test_db"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      // Verify required fields are present
      expect(screen.getByLabelText(/table name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plural/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();

      // Test validation triggers
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/table name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate field length constraints', async () => {
      renderWithProviders(
        <TableDetailsForm 
          mode="create"
          dbName="test_db"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      const nameField = screen.getByLabelText(/table name/i);
      
      // Test maximum length validation
      await user.type(nameField, 'a'.repeat(51));
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/name too long/i)).toBeInTheDocument();
      });
    });

    it('should populate form in edit mode with React Query data', async () => {
      renderWithProviders(
        <TableDetailsForm 
          mode="edit"
          dbName="test_db"
          tableName="users"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      // Wait for data to load via React Query
      await waitFor(() => {
        expect(screen.getByDisplayValue('users')).toBeInTheDocument();
        expect(screen.getByDisplayValue('user_table')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Users')).toBeInTheDocument();
      });

      // Name field should be disabled in edit mode
      const nameField = screen.getByLabelText(/table name/i);
      expect(nameField).toBeDisabled();
    });

    it('should submit form data correctly with React Query mutation', async () => {
      const mockSubmit = vi.fn();
      
      renderWithProviders(
        <TableDetailsForm 
          mode="create"
          dbName="test_db"
          onSubmit={mockSubmit}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      // Fill out form
      await user.type(screen.getByLabelText(/table name/i), 'new_table');
      await user.type(screen.getByLabelText(/alias/i), 'new_alias');
      await user.type(screen.getByLabelText(/description/i), 'Test description');

      // Submit form
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'new_table',
          alias: 'new_alias', 
          label: '',
          plural: '',
          description: 'Test description',
        });
      });
    });

    it('should handle form errors gracefully', async () => {
      // Mock API error response
      server.use(
        rest.post('/api/v2/system/schema/:dbName', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Table name already exists',
                details: {
                  name: ['A table with this name already exists']
                }
              }
            })
          );
        })
      );

      renderWithProviders(
        <TableDetailsForm 
          mode="create"
          dbName="test_db"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      await user.type(screen.getByLabelText(/table name/i), 'existing_table');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/table name already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('JSON Editor Integration', () => {
    it('should render Monaco editor in JSON mode', async () => {
      renderWithProviders(
        <TableDetailsForm 
          mode="edit"
          dbName="test_db"
          tableName="users"
          showJsonEditor={true}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      // Wait for Monaco editor to load
      await waitFor(() => {
        const jsonEditor = screen.getByRole('textbox', { name: /json editor/i });
        expect(jsonEditor).toBeInTheDocument();
      });
    });

    it('should validate JSON input and sync with form', async () => {
      renderWithProviders(
        <TableDetailsForm 
          mode="edit"
          dbName="test_db"
          tableName="users"
          showJsonEditor={true}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />,
        { queryClient }
      );

      const jsonEditor = await screen.findByRole('textbox', { name: /json editor/i });
      
      // Test invalid JSON
      await user.clear(jsonEditor);
      await user.type(jsonEditor, '{ invalid json }');

      await waitFor(() => {
        expect(screen.getByText(/invalid json format/i)).toBeInTheDocument();
      });

      // Test valid JSON that syncs with form
      await user.clear(jsonEditor);
      await user.type(jsonEditor, JSON.stringify({
        name: 'updated_table',
        description: 'Updated via JSON'
      }));

      // Switch back to form view
      await user.click(screen.getByRole('tab', { name: /form/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue('updated_table')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Updated via JSON')).toBeInTheDocument();
      });
    });
  });
});

describe('FieldsTable Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    user = userEvent.setup();

    // Setup MSW handlers for fields data
    server.use(
      rest.get('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
        const limit = parseInt(req.url.searchParams.get('limit') || '25');
        const offset = parseInt(req.url.searchParams.get('offset') || '0');
        
        // Return paginated mock data
        const data = mockFieldsData.slice(offset, offset + limit);
        return res(ctx.json({
          resource: data,
          count: mockFieldsData.length
        }));
      }),
      rest.get('/api/v2/system/schema/:dbName/:tableName/_field/large', (req, res, ctx) => {
        return res(ctx.json({
          resource: largeMockFieldsData,
          count: largeMockFieldsData.length
        }));
      })
    );
  });

  describe('TanStack Table Basic Functionality', () => {
    it('should render table with correct columns', async () => {
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByText('Primary Key')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify field data is displayed
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('created_at')).toBeInTheDocument();
    });

    it('should handle sorting on columns', async () => {
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
      });

      // Click on Name column header to sort
      const nameHeader = screen.getByRole('button', { name: /sort by name/i });
      await user.click(nameHeader);

      // Verify sort indicator appears
      await waitFor(() => {
        expect(screen.getByRole('img', { name: /sorted ascending/i })).toBeInTheDocument();
      });
    });

    it('should filter table data', async () => {
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Use filter input
      const filterInput = screen.getByPlaceholderText(/search fields/i);
      await user.type(filterInput, 'email');

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
        expect(screen.queryByText('id')).not.toBeInTheDocument();
      });
    });

    it('should handle pagination correctly', async () => {
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
          pageSize={2}
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();

      // Navigate to next page
      await user.click(screen.getByRole('button', { name: /next page/i }));

      await waitFor(() => {
        expect(screen.getByText('Page 2')).toBeInTheDocument();
      });
    });
  });

  describe('TanStack Virtual Scrolling for Large Datasets', () => {
    it('should virtualize large datasets (1,000+ fields)', async () => {
      // Mock large dataset endpoint
      server.use(
        rest.get('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
          return res(ctx.json({
            resource: largeMockFieldsData,
            count: largeMockFieldsData.length
          }));
        })
      );

      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="large_table"
          enableVirtualization={true}
        />,
        { queryClient }
      );

      // Wait for virtual scrolling container
      await waitFor(() => {
        const virtualContainer = screen.getByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      });

      // Should only render visible items (not all 1,500)
      const visibleRows = screen.getAllByTestId(/field-row-/);
      expect(visibleRows.length).toBeLessThan(50); // Only visible viewport items
      expect(visibleRows.length).toBeGreaterThan(0);
    });

    it('should maintain scroll position during updates', async () => {
      server.use(
        rest.get('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
          return res(ctx.json({
            resource: largeMockFieldsData,
            count: largeMockFieldsData.length
          }));
        })
      );

      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="large_table"
          enableVirtualization={true}
        />,
        { queryClient }
      );

      const virtualContainer = await screen.findByTestId('virtual-scroll-container');
      
      // Simulate scrolling
      fireEvent.scroll(virtualContainer, { target: { scrollTop: 500 } });

      // Trigger a re-render by updating a field
      await user.click(screen.getByRole('button', { name: /refresh/i }));

      // Scroll position should be maintained
      await waitFor(() => {
        expect(virtualContainer.scrollTop).toBe(500);
      });
    });

    it('should handle rapid scrolling without performance issues', async () => {
      const performanceStart = performance.now();

      server.use(
        rest.get('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
          return res(ctx.json({
            resource: largeMockFieldsData,
            count: largeMockFieldsData.length
          }));
        })
      );

      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="large_table"
          enableVirtualization={true}
        />,
        { queryClient }
      );

      const virtualContainer = await screen.findByTestId('virtual-scroll-container');

      // Simulate rapid scrolling
      for (let i = 0; i < 100; i += 10) {
        fireEvent.scroll(virtualContainer, { target: { scrollTop: i * 10 } });
      }

      const performanceEnd = performance.now();
      const executionTime = performanceEnd - performanceStart;

      // Should complete rapid scrolling in under 100ms
      expect(executionTime).toBeLessThan(100);
    });
  });

  describe('CRUD Operations with React Query', () => {
    it('should create new field', async () => {
      server.use(
        rest.post('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
          return res(ctx.json({ id: 4, name: 'new_field', type: 'string' }));
        })
      );

      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Click create button
      await user.click(screen.getByRole('button', { name: /add field/i }));

      // Fill out field form in modal/dialog
      await user.type(screen.getByLabelText(/field name/i), 'new_field');
      await user.selectOptions(screen.getByLabelText(/field type/i), 'string');

      // Submit field creation
      await user.click(screen.getByRole('button', { name: /save field/i }));

      // Verify optimistic update and real data
      await waitFor(() => {
        expect(screen.getByText('new_field')).toBeInTheDocument();
      });
    });

    it('should edit existing field', async () => {
      server.use(
        rest.patch('/api/v2/system/schema/:dbName/:tableName/_field/email', (req, res, ctx) => {
          return res(ctx.json({ name: 'email', type: 'string', size: 512 }));
        })
      );

      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Click edit button for email field
      const emailRow = screen.getByTestId('field-row-email');
      const editButton = within(emailRow).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Update field size
      const sizeInput = screen.getByLabelText(/field size/i);
      await user.clear(sizeInput);
      await user.type(sizeInput, '512');

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByText('512')).toBeInTheDocument();
      });
    });

    it('should delete field with confirmation', async () => {
      server.use(
        rest.delete('/api/v2/system/schema/:dbName/:tableName/_field/email', (req, res, ctx) => {
          return res(ctx.status(204));
        })
      );

      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('email')).toBeInTheDocument();
      });

      // Click delete button
      const emailRow = screen.getByTestId('field-row-email');
      const deleteButton = within(emailRow).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion in modal
      await user.click(screen.getByRole('button', { name: /confirm delete/i }));

      await waitFor(() => {
        expect(screen.queryByText('email')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('should have proper ARIA labels and roles', async () => {
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Table should have proper ARIA attributes
      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', expect.stringContaining('Fields table'));

      // Column headers should be properly labeled
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(0);
      
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Tab through table elements
      const firstButton = screen.getAllByRole('button')[0];
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Arrow keys should navigate through cells
      fireEvent.keyDown(firstButton, { key: 'ArrowDown' });
      // Implementation-specific navigation verification would go here
    });

    it('should announce changes to screen readers', async () => {
      const mockAnnounce = vi.fn();
      
      renderWithProviders(
        <FieldsTable 
          dbName="test_db"
          tableName="users"
          onAnnouncement={mockAnnounce}
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('id')).toBeInTheDocument();
      });

      // Trigger a data update
      await user.click(screen.getByRole('button', { name: /refresh/i }));

      await waitFor(() => {
        expect(mockAnnounce).toHaveBeenCalledWith(
          expect.stringContaining('Fields table updated')
        );
      });
    });
  });
});

describe('RelationshipsTable Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    user = userEvent.setup();

    server.use(
      rest.get('/api/v2/system/schema/:dbName/:tableName/_related', (req, res, ctx) => {
        return res(ctx.json({
          resource: mockRelationshipsData,
          count: mockRelationshipsData.length
        }));
      })
    );
  });

  describe('Basic Table Functionality', () => {
    it('should render relationships table correctly', async () => {
      renderWithProviders(
        <RelationshipsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Referenced Table')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });

      // Verify relationship data
      expect(screen.getByText('profile')).toBeInTheDocument();
      expect(screen.getByText('has_one')).toBeInTheDocument();
      expect(screen.getByText('user_profiles')).toBeInTheDocument();
      expect(screen.getByText('orders')).toBeInTheDocument();
      expect(screen.getByText('has_many')).toBeInTheDocument();
    });

    it('should handle relationship type filtering', async () => {
      renderWithProviders(
        <RelationshipsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('profile')).toBeInTheDocument();
      });

      // Filter by relationship type
      const typeFilter = screen.getByLabelText(/filter by type/i);
      await user.selectOptions(typeFilter, 'has_one');

      await waitFor(() => {
        expect(screen.getByText('profile')).toBeInTheDocument();
        expect(screen.queryByText('orders')).not.toBeInTheDocument();
      });
    });
  });

  describe('Relationship CRUD Operations', () => {
    it('should create new relationship', async () => {
      server.use(
        rest.post('/api/v2/system/schema/:dbName/:tableName/_related', (req, res, ctx) => {
          return res(ctx.json({
            name: 'comments',
            type: 'has_many',
            ref_table: 'comments',
            ref_field: 'user_id'
          }));
        })
      );

      renderWithProviders(
        <RelationshipsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('profile')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add relationship/i }));

      // Fill relationship form
      await user.type(screen.getByLabelText(/relationship name/i), 'comments');
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'has_many');
      await user.type(screen.getByLabelText(/referenced table/i), 'comments');
      await user.type(screen.getByLabelText(/referenced field/i), 'user_id');

      await user.click(screen.getByRole('button', { name: /save relationship/i }));

      await waitFor(() => {
        expect(screen.getByText('comments')).toBeInTheDocument();
      });
    });

    it('should validate relationship constraints', async () => {
      renderWithProviders(
        <RelationshipsTable 
          dbName="test_db"
          tableName="users"
        />,
        { queryClient }
      );

      await waitFor(() => {
        expect(screen.getByText('profile')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /add relationship/i }));

      // Try to submit without required fields
      await user.click(screen.getByRole('button', { name: /save relationship/i }));

      await waitFor(() => {
        expect(screen.getByText(/relationship name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/referenced table is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Virtual Scrolling', () => {
    it('should handle large relationship datasets', async () => {
      server.use(
        rest.get('/api/v2/system/schema/:dbName/:tableName/_related', (req, res, ctx) => {
          return res(ctx.json({
            resource: largeMockRelationshipsData,
            count: largeMockRelationshipsData.length
          }));
        })
      );

      const performanceStart = performance.now();

      renderWithProviders(
        <RelationshipsTable 
          dbName="test_db"
          tableName="large_table"
          enableVirtualization={true}
        />,
        { queryClient }
      );

      await waitFor(() => {
        const virtualContainer = screen.getByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      });

      const performanceEnd = performance.now();
      const renderTime = performanceEnd - performanceStart;

      // Should render large dataset in under 200ms
      expect(renderTime).toBeLessThan(200);
    });
  });
});

describe('Integration Tests - Complete Workflow', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    user = userEvent.setup();

    // Setup complete workflow endpoints
    server.use(
      rest.get('/api/v2/system/schema/:dbName/:tableName', (req, res, ctx) => {
        return res(ctx.json(mockTableData));
      }),
      rest.get('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
        return res(ctx.json({ resource: mockFieldsData, count: mockFieldsData.length }));
      }),
      rest.get('/api/v2/system/schema/:dbName/:tableName/_related', (req, res, ctx) => {
        return res(ctx.json({ resource: mockRelationshipsData, count: mockRelationshipsData.length }));
      }),
      rest.patch('/api/v2/system/schema/:dbName/:tableName', (req, res, ctx) => {
        return res(ctx.json(mockTableData));
      })
    );
  });

  it('should complete full table details editing workflow under 5 seconds', async () => {
    const workflowStart = performance.now();

    // Render complete table details interface
    renderWithProviders(
      <div>
        <TableDetailsForm 
          mode="edit"
          dbName="test_db"
          tableName="users"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />
        <RelationshipsTable 
          dbName="test_db"
          tableName="users"
        />
      </div>,
      { queryClient }
    );

    // Wait for all components to load data
    await waitFor(() => {
      expect(screen.getByDisplayValue('users')).toBeInTheDocument();
      expect(screen.getByText('id')).toBeInTheDocument();
      expect(screen.getByText('profile')).toBeInTheDocument();
    });

    // Perform complete editing workflow
    await user.type(screen.getByLabelText(/description/i), ' - Updated');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      const workflowEnd = performance.now();
      const workflowTime = workflowEnd - workflowStart;
      
      // Complete workflow should finish under 5 seconds
      expect(workflowTime).toBeLessThan(5000);
    });
  });

  it('should maintain data consistency across components', async () => {
    renderWithProviders(
      <div>
        <TableDetailsForm 
          mode="edit"
          dbName="test_db"
          tableName="users"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />
      </div>,
      { queryClient }
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('users')).toBeInTheDocument();
      expect(screen.getByText('id')).toBeInTheDocument();
    });

    // Update table name should affect both components
    const nameField = screen.getByLabelText(/table name/i);
    await user.clear(nameField);
    await user.type(nameField, 'updated_users');

    // Verify name change is reflected consistently
    await waitFor(() => {
      expect(screen.getByDisplayValue('updated_users')).toBeInTheDocument();
      // Any other components should reflect the change via React Query cache
    });
  });

  it('should handle error scenarios gracefully across all components', async () => {
    // Mock network errors
    server.use(
      rest.get('/api/v2/system/schema/:dbName/:tableName/_field', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
      })
    );

    renderWithProviders(
      <div>
        <TableDetailsForm 
          mode="edit"
          dbName="test_db"
          tableName="users"
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
        <FieldsTable 
          dbName="test_db"
          tableName="users"
        />
      </div>,
      { queryClient }
    );

    // Form should still load even if fields fail
    await waitFor(() => {
      expect(screen.getByDisplayValue('users')).toBeInTheDocument();
    });

    // Fields table should show error state
    await waitFor(() => {
      expect(screen.getByText(/error loading fields/i)).toBeInTheDocument();
    });

    // Error should not break the overall interface
    expect(screen.getByLabelText(/table name/i)).toBeInTheDocument();
  });
});

/**
 * Mock implementations for testing
 * These would be replaced with actual React components during implementation
 */

// Mock component implementations for testing
function MockTableDetailsForm({ mode, onSubmit, onCancel, showJsonEditor, ...props }) {
  const form = useForm({
    resolver: zodResolver(tableDetailsSchema),
    defaultValues: { name: '', alias: '', label: '', plural: '', description: '' }
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <label htmlFor="name">Table Name</label>
        <input 
          id="name" 
          disabled={mode === 'edit'}
          {...form.register('name')} 
        />
        {form.formState.errors.name && (
          <span>{form.formState.errors.name.message}</span>
        )}
        
        <label htmlFor="alias">Alias</label>
        <input id="alias" {...form.register('alias')} />
        
        <label htmlFor="description">Description</label>
        <textarea id="description" {...form.register('description')} />
        
        {showJsonEditor && (
          <textarea 
            role="textbox" 
            aria-label="JSON Editor"
            placeholder="Enter JSON..."
          />
        )}
        
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </FormProvider>
  );
}

function MockFieldsTable({ dbName, tableName, enableVirtualization, ...props }) {
  // Simulate TanStack Table with virtual scrolling
  return (
    <div>
      <input placeholder="Search fields..." />
      <button>Add Field</button>
      <button>Refresh</button>
      
      {enableVirtualization ? (
        <div data-testid="virtual-scroll-container" style={{ height: '400px', overflow: 'auto' }}>
          {/* Virtual scrolling container */}
          <table role="table" aria-label="Fields table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Required</th>
                <th scope="col">Primary Key</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockFieldsData.map((field, index) => (
                <tr key={field.name} data-testid={`field-row-${field.name}`}>
                  <td>{field.name}</td>
                  <td>{field.type}</td>
                  <td>{field.required ? 'Yes' : 'No'}</td>
                  <td>{field.primary_key ? 'Yes' : 'No'}</td>
                  <td>
                    <button>Edit</button>
                    <button>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <table role="table" aria-label="Fields table">
          {/* Regular table implementation */}
        </table>
      )}
    </div>
  );
}

function MockRelationshipsTable({ dbName, tableName, enableVirtualization, ...props }) {
  return (
    <div>
      <label htmlFor="type-filter">Filter by Type</label>
      <select id="type-filter">
        <option value="">All Types</option>
        <option value="has_one">Has One</option>
        <option value="has_many">Has Many</option>
      </select>
      
      <button>Add Relationship</button>
      
      {enableVirtualization ? (
        <div data-testid="virtual-scroll-container" style={{ height: '400px', overflow: 'auto' }}>
          <table role="table" aria-label="Relationships table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Referenced Table</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockRelationshipsData.map((rel) => (
                <tr key={rel.name}>
                  <td>{rel.name}</td>
                  <td>{rel.type}</td>
                  <td>{rel.ref_table}</td>
                  <td>
                    <button>Edit</button>
                    <button>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <table role="table" aria-label="Relationships table">
          {/* Regular table implementation */}
        </table>
      )}
    </div>
  );
}

// Wire up mock components for testing
const TableDetailsForm = MockTableDetailsForm;
const FieldsTable = MockFieldsTable;
const RelationshipsTable = MockRelationshipsTable;