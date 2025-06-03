import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { DatabaseTable } from './database-table';
import { TestWrapper } from '@/test/test-utils';

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  pathname: '/adf-schema/df-manage-databases-table',
  query: {},
  asPath: '/adf-schema/df-manage-databases-table',
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/adf-schema/df-manage-databases-table',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock database services data
const mockDatabaseServices = [
  {
    id: 1,
    name: 'mysql_primary',
    label: 'MySQL Primary Database',
    description: 'Main MySQL database connection',
    type: 'mysql',
    is_active: true,
    created_date: '2024-01-15T10:30:00Z',
    last_modified_date: '2024-01-20T14:45:00Z',
    config: {
      host: 'localhost',
      port: 3306,
      database: 'main_db',
      username: 'admin',
    },
  },
  {
    id: 2,
    name: 'postgres_analytics',
    label: 'PostgreSQL Analytics',
    description: 'Analytics database for reporting',
    type: 'pgsql',
    is_active: true,
    created_date: '2024-01-10T09:15:00Z',
    last_modified_date: '2024-01-18T16:20:00Z',
    config: {
      host: 'analytics.db.internal',
      port: 5432,
      database: 'analytics',
      username: 'readonly',
    },
  },
  {
    id: 3,
    name: 'oracle_legacy',
    label: 'Oracle Legacy System',
    description: 'Legacy Oracle database connection',
    type: 'oracle',
    is_active: false,
    created_date: '2023-12-01T12:00:00Z',
    last_modified_date: '2024-01-05T10:30:00Z',
    config: {
      host: 'legacy.oracle.internal',
      port: 1521,
      database: 'LEGACY',
      username: 'system',
    },
  },
];

const mockServiceTypes = [
  {
    name: 'mysql',
    label: 'MySQL',
    description: 'MySQL Database Service',
    group: 'Database',
    singleton: false,
  },
  {
    name: 'pgsql',
    label: 'PostgreSQL',
    description: 'PostgreSQL Database Service',
    group: 'Database',
    singleton: false,
  },
  {
    name: 'oracle',
    label: 'Oracle',
    description: 'Oracle Database Service',
    group: 'Database',
    singleton: false,
  },
];

describe('DatabaseTable Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    mockPush.mockClear();

    // Setup default MSW handlers for database services
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: mockDatabaseServices,
          meta: {
            count: mockDatabaseServices.length,
            schema: ['id', 'name', 'label', 'description', 'type', 'is_active'],
          },
        });
      }),

      http.get('/api/v2/system/service_type', () => {
        return HttpResponse.json({
          resource: mockServiceTypes,
          meta: {
            count: mockServiceTypes.length,
            schema: ['name', 'label', 'description', 'group'],
          },
        });
      }),

      // Connection test endpoint
      http.get('/api/v2/:serviceName/_table', ({ params }) => {
        const { serviceName } = params;
        if (serviceName === 'mysql_primary' || serviceName === 'postgres_analytics') {
          return HttpResponse.json({
            resource: [],
            meta: { count: 0 },
          });
        }
        return HttpResponse.error();
      }),

      // Service deletion endpoint
      http.delete('/api/v2/system/service/:id', ({ params }) => {
        const { id } = params;
        const serviceId = parseInt(id as string);
        const serviceExists = mockDatabaseServices.some(s => s.id === serviceId);
        
        if (serviceExists) {
          return HttpResponse.json({ success: true });
        }
        return HttpResponse.error();
      })
    );
  });

  it('renders database table component successfully', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    // Verify the table header is rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('loads and displays database services from API', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    // Wait for services to load
    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Verify all mock services are displayed
    expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    expect(screen.getByText('MySQL Primary Database')).toBeInTheDocument();
    expect(screen.getByText('postgres_analytics')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL Analytics')).toBeInTheDocument();
    expect(screen.getByText('oracle_legacy')).toBeInTheDocument();
    expect(screen.getByText('Oracle Legacy System')).toBeInTheDocument();
  });

  it('displays correct service type labels', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Verify service type labels are mapped correctly
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Oracle')).toBeInTheDocument();
  });

  it('shows active and inactive service status indicators', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Verify status indicators
    const activeIndicators = screen.getAllByText('Active');
    const inactiveIndicators = screen.getAllByText('Inactive');
    
    expect(activeIndicators).toHaveLength(2); // mysql_primary and postgres_analytics
    expect(inactiveIndicators).toHaveLength(1); // oracle_legacy
  });

  it('navigates to database detail view when clicking view action', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Find and click the first view button
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    await user.click(viewButtons[0]);

    // Verify navigation was called
    expect(mockPush).toHaveBeenCalledWith('/adf-schema/df-manage-databases-table/mysql_primary');
  });

  it('navigates to create new service page when clicking create button', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    // Find and click the create button
    const createButton = screen.getByRole('button', { name: /create new service/i });
    await user.click(createButton);

    // Verify navigation was called
    expect(mockPush).toHaveBeenCalledWith('/adf-schema/df-manage-databases-table/create');
  });

  it('performs connection test when clicking test connection action', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Find and click the first test connection button
    const testButtons = screen.getAllByRole('button', { name: /test connection/i });
    await user.click(testButtons[0]);

    // Verify connection test success indicator appears
    await waitFor(() => {
      expect(screen.getByText(/connection test successful/i)).toBeInTheDocument();
    });
  });

  it('handles connection test failure gracefully', async () => {
    // Override MSW handler to simulate connection failure
    server.use(
      http.get('/api/v2/oracle_legacy/_table', () => {
        return HttpResponse.json(
          { error: { message: 'Connection timeout' } },
          { status: 500 }
        );
      })
    );

    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('oracle_legacy')).toBeInTheDocument();
    });

    // Find and click the test connection button for oracle_legacy
    const testButtons = screen.getAllByRole('button', { name: /test connection/i });
    await user.click(testButtons[2]); // Third button for oracle_legacy

    // Verify connection test failure indicator appears
    await waitFor(() => {
      expect(screen.getByText(/connection test failed/i)).toBeInTheDocument();
    });
  });

  it('handles service deletion with confirmation', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Find and click the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Verify confirmation dialog appears
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/service deleted successfully/i)).toBeInTheDocument();
    });
  });

  it('cancels service deletion when dialog is dismissed', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Find and click the first delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Verify confirmation dialog appears
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    // Cancel deletion
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify dialog is dismissed and service still exists
    expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument();
    expect(screen.getByText('mysql_primary')).toBeInTheDocument();
  });

  it('filters services by search query', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Find search input and type query
    const searchInput = screen.getByPlaceholderText(/search services/i);
    await user.type(searchInput, 'mysql');

    // Verify only MySQL service is shown
    expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    expect(screen.queryByText('postgres_analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('oracle_legacy')).not.toBeInTheDocument();
  });

  it('handles API error states gracefully', async () => {
    // Override MSW handler to simulate API error
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json(
          { error: { message: 'Internal server error' } },
          { status: 500 }
        );
      })
    );

    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load services/i)).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching services', () => {
    // Override MSW handler to delay response
    server.use(
      http.get('/api/v2/system/service', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({
          resource: mockDatabaseServices,
          meta: { count: mockDatabaseServices.length },
        });
      })
    );

    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    // Verify loading indicator is shown
    expect(screen.getByText(/loading services/i)).toBeInTheDocument();
  });

  it('handles empty service list state', async () => {
    // Override MSW handler to return empty list
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: [],
          meta: { count: 0 },
        });
      })
    );

    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    // Verify empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText(/no database services found/i)).toBeInTheDocument();
    });

    // Verify create button is still available
    expect(screen.getByRole('button', { name: /create new service/i })).toBeInTheDocument();
  });

  it('sorts services by different columns', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Click on Name column header to sort
    const nameHeader = screen.getByRole('button', { name: /sort by name/i });
    await user.click(nameHeader);

    // Verify sorting indicator appears
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // Click again to reverse sort
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('refreshes service list when refresh button is clicked', async () => {
    const refreshSpy = vi.fn();
    
    render(
      <TestWrapper>
        <DatabaseTable onRefresh={refreshSpy} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Verify refresh callback was called
    expect(refreshSpy).toHaveBeenCalled();
  });

  it('maintains accessibility standards', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Verify table has proper ARIA labels
    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', /database services/i);

    // Verify column headers have proper roles
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(4); // Name, Type, Status, Actions

    // Verify row data has proper structure
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows

    // Verify buttons have proper labels
    const actionButtons = screen.getAllByRole('button');
    actionButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('handles keyboard navigation properly', async () => {
    render(
      <TestWrapper>
        <DatabaseTable />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('mysql_primary')).toBeInTheDocument();
    });

    // Test tab navigation through action buttons
    const viewButtons = screen.getAllByRole('button', { name: /view/i });
    const firstViewButton = viewButtons[0];

    // Focus the first view button
    firstViewButton.focus();
    expect(firstViewButton).toHaveFocus();

    // Test Enter key activation
    fireEvent.keyDown(firstViewButton, { key: 'Enter', code: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/adf-schema/df-manage-databases-table/mysql_primary');
  });
});