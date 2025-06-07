import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  DatabaseIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  CommandLineIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

import { SearchDialog } from './search-dialog';
import type { 
  SearchDialogProps, 
  SearchResult, 
  SearchResultGroup, 
  SearchResultType 
} from './types';
import { SearchResultType as ResultType } from './types';

// Create a QueryClient for stories that need React Query
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

/**
 * Mock search data for consistent story demonstrations
 */
const mockSearchResults: SearchResultGroup[] = [
  {
    type: ResultType.DATABASE_SERVICE,
    title: 'Database Services',
    description: 'Available database connections',
    icon: DatabaseIcon,
    results: [
      {
        id: 'mysql-main',
        type: ResultType.DATABASE_SERVICE,
        title: 'MySQL Main Database',
        subtitle: 'mysql://localhost:3306',
        description: 'Primary application database with 127 tables',
        href: '/api-connections/database/mysql-main',
        badge: '127 tables',
        badgeColor: 'primary',
        metadata: {
          database: {
            connectionStatus: 'connected',
            tableCount: 127,
            fieldCount: 1840,
            engine: 'MySQL 8.0.35',
          },
        },
      },
      {
        id: 'postgres-analytics',
        type: ResultType.DATABASE_SERVICE,
        title: 'PostgreSQL Analytics',
        subtitle: 'postgres://analytics.internal:5432',
        description: 'Analytics and reporting database',
        href: '/api-connections/database/postgres-analytics',
        badge: '45 tables',
        badgeColor: 'secondary',
        metadata: {
          database: {
            connectionStatus: 'connected',
            tableCount: 45,
            fieldCount: 892,
            engine: 'PostgreSQL 16.1',
          },
        },
      },
      {
        id: 'mongo-logs',
        type: ResultType.DATABASE_SERVICE,
        title: 'MongoDB Logs',
        subtitle: 'mongodb://logs.internal:27017',
        description: 'Application logging database',
        href: '/api-connections/database/mongo-logs',
        badge: '8 collections',
        badgeColor: 'success',
        metadata: {
          database: {
            connectionStatus: 'connected',
            tableCount: 8,
            fieldCount: 156,
            engine: 'MongoDB 7.0.4',
          },
        },
      },
    ],
  },
  {
    type: ResultType.DATABASE_TABLE,
    title: 'Database Tables',
    description: 'Tables matching your search',
    icon: FolderIcon,
    results: [
      {
        id: 'users-table',
        type: ResultType.DATABASE_TABLE,
        title: 'users',
        subtitle: 'mysql-main database',
        description: 'User accounts and authentication data',
        href: '/api-connections/database/mysql-main/schema/users',
        badge: '15 fields',
        badgeColor: 'primary',
        parent: {
          id: 'mysql-main',
          title: 'MySQL Main Database',
          type: ResultType.DATABASE_SERVICE,
        },
      },
      {
        id: 'user-profiles',
        type: ResultType.DATABASE_TABLE,
        title: 'user_profiles',
        subtitle: 'mysql-main database',
        description: 'Extended user profile information',
        href: '/api-connections/database/mysql-main/schema/user_profiles',
        badge: '22 fields',
        badgeColor: 'secondary',
        parent: {
          id: 'mysql-main',
          title: 'MySQL Main Database',
          type: ResultType.DATABASE_SERVICE,
        },
      },
      {
        id: 'user-sessions',
        type: ResultType.DATABASE_TABLE,
        title: 'user_sessions',
        subtitle: 'postgres-analytics database',
        description: 'User session tracking and analytics',
        href: '/api-connections/database/postgres-analytics/schema/user_sessions',
        badge: '8 fields',
        badgeColor: 'warning',
        parent: {
          id: 'postgres-analytics',
          title: 'PostgreSQL Analytics',
          type: ResultType.DATABASE_SERVICE,
        },
      },
    ],
  },
  {
    type: ResultType.USER,
    title: 'Users',
    description: 'System users and accounts',
    icon: UserGroupIcon,
    results: [
      {
        id: 'admin-user',
        type: ResultType.USER,
        title: 'admin@dreamfactory.com',
        subtitle: 'System Administrator',
        description: 'Primary system administrator account',
        href: '/admin-settings/users/admin-user',
        badge: 'Active',
        badgeColor: 'success',
        metadata: {
          user: {
            role: 'System Administrator',
            status: 'active',
            lastLogin: new Date('2024-01-15T10:30:00Z'),
          },
        },
      },
      {
        id: 'api-user',
        type: ResultType.USER,
        title: 'api@internal.com',
        subtitle: 'API Service Account',
        description: 'Service account for API integrations',
        href: '/admin-settings/users/api-user',
        badge: 'Service',
        badgeColor: 'secondary',
        metadata: {
          user: {
            role: 'API User',
            status: 'active',
            lastLogin: new Date('2024-01-15T09:45:00Z'),
          },
        },
      },
    ],
  },
  {
    type: ResultType.SYSTEM_SETTING,
    title: 'System Settings',
    description: 'Configuration and system settings',
    icon: CogIcon,
    results: [
      {
        id: 'cors-settings',
        type: ResultType.SYSTEM_SETTING,
        title: 'CORS Configuration',
        subtitle: 'Cross-Origin Resource Sharing',
        description: 'Configure allowed origins and methods',
        href: '/system-settings/cors',
        badge: 'Security',
        badgeColor: 'warning',
      },
      {
        id: 'email-templates',
        type: ResultType.SYSTEM_SETTING,
        title: 'Email Templates',
        subtitle: 'User notification templates',
        description: 'Manage system email templates',
        href: '/system-settings/email-templates',
        badge: '12 templates',
        badgeColor: 'primary',
      },
    ],
  },
  {
    type: ResultType.API_DOCUMENTATION,
    title: 'API Documentation',
    description: 'API endpoints and documentation',
    icon: DocumentTextIcon,
    results: [
      {
        id: 'user-api-docs',
        type: ResultType.API_DOCUMENTATION,
        title: 'User Management API',
        subtitle: '/api/v2/system/user',
        description: 'User CRUD operations and authentication',
        href: '/api-docs/system/user',
        badge: 'REST API',
        badgeColor: 'primary',
        metadata: {
          api: {
            method: 'GET',
            endpoint: '/api/v2/system/user',
            deprecated: false,
          },
        },
      },
    ],
  },
];

/**
 * Component wrapper that provides React Query context
 */
const QueryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => createQueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

/**
 * Search dialog wrapper for story implementations
 */
const SearchDialogWrapper: React.FC<
  Partial<SearchDialogProps> & {
    mockResults?: SearchResultGroup[];
    simulateLoading?: boolean;
    simulateError?: boolean;
    delayMs?: number;
  }
> = ({ 
  mockResults = mockSearchResults,
  simulateLoading = false,
  simulateError = false,
  delayMs = 300,
  ...props 
}) => {
  const [open, setOpen] = useState(props.open ?? false);

  // Simulate search API
  const handleSearch = async (query: string): Promise<SearchResultGroup[]> => {
    if (simulateError) {
      throw new Error('Network error: Unable to reach search service');
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, delayMs));

    if (simulateLoading) {
      return [];
    }

    // Filter mock results based on query
    return mockResults
      .map(group => ({
        ...group,
        results: group.results.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase())
        ),
      }))
      .filter(group => group.results.length > 0);
  };

  return (
    <QueryWrapper>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              DreamFactory Admin Interface
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border text-xs">⌘K</kbd> to open search
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Open Search
          </button>

          <SearchDialog
            open={open}
            onOpenChange={setOpen}
            onSelectResult={(result) => {
              action('result-selected')({
                id: result.id,
                type: result.type,
                title: result.title,
                href: result.href,
              });
              setOpen(false);
            }}
            onSearch={handleSearch}
            {...props}
          />
        </div>
      </div>
    </QueryWrapper>
  );
};

// Storybook Meta Configuration
const meta = {
  title: 'UI Components/Search Dialog',
  component: SearchDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Search Dialog Component

A comprehensive global search dialog implementing WCAG 2.1 AA accessibility standards with real-time search,
keyboard navigation, and responsive design. Replaces Angular search functionality with React 19/Next.js 15.1
implementation.

## Features

- ✅ **WCAG 2.1 AA Compliant**: Keyboard navigation, screen reader support, proper focus management
- ✅ **Real-time Search**: Debounced search with React Query caching and intelligent revalidation
- ✅ **Keyboard Navigation**: Cmd/Ctrl+K trigger, arrow key navigation, Enter selection, Escape close
- ✅ **Recent Searches**: Persistent search history with local storage and automatic cleanup
- ✅ **Responsive Design**: Mobile-first approach with touch-friendly interactions
- ✅ **Dark Mode**: Complete theme support with proper contrast ratios
- ✅ **Error Handling**: Network errors, empty states, and retry functionality
- ✅ **Performance**: Virtual scrolling for large result sets, optimized rendering

## Search Result Types

- **Database Services**: MySQL, PostgreSQL, MongoDB connections
- **Database Tables**: Schema tables with field counts and metadata
- **Database Fields**: Individual table columns and properties
- **Users**: System users and administrators
- **System Settings**: Configuration panels and options
- **API Documentation**: Endpoint documentation and examples
- **Applications**: Configured applications and services

## Accessibility

- **Keyboard Navigation**: Full keyboard support with arrow keys, Enter, Escape
- **Screen Reader**: Proper ARIA labels, announcements, and descriptions
- **Focus Management**: Focus trapping, restoration, and visible indicators
- **Touch Targets**: Minimum 44x44px touch targets for mobile accessibility
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the search dialog is open',
    },
    placeholder: {
      control: 'text',
      description: 'Search input placeholder text',
    },
    initialQuery: {
      control: 'text',
      description: 'Initial search query',
    },
    onSelectResult: {
      action: 'result-selected',
      description: 'Callback when a search result is selected',
    },
    onOpenChange: {
      action: 'open-changed',
      description: 'Callback when dialog open state changes',
    },
  },
} satisfies Meta<typeof SearchDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic search dialog stories
export const Default: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    placeholder: 'Search databases, tables, users...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default search dialog with all result types and standard functionality.',
      },
    },
  },
};

export const InitialState: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    placeholder: 'Search DreamFactory...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Initial state showing recent searches and empty query suggestions.',
      },
    },
  },
};

export const WithInitialQuery: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    initialQuery: 'user',
    placeholder: 'Search databases, tables, users...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search dialog with pre-populated query showing filtered results.',
      },
    },
  },
};

// Search functionality stories
export const DatabaseSearch: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      mockResults={mockSearchResults.filter(group => 
        group.type === ResultType.DATABASE_SERVICE || 
        group.type === ResultType.DATABASE_TABLE
      )}
    />
  ),
  args: {
    open: true,
    initialQuery: 'mysql',
    placeholder: 'Search database services and tables...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Database-focused search showing services and tables with connection metadata.',
      },
    },
  },
};

export const UserSearch: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      mockResults={mockSearchResults.filter(group => 
        group.type === ResultType.USER || 
        group.type === ResultType.ADMIN
      )}
    />
  ),
  args: {
    open: true,
    initialQuery: 'admin',
    placeholder: 'Search users and administrators...',
  },
  parameters: {
    docs: {
      description: {
        story: 'User management search showing administrators and service accounts.',
      },
    },
  },
};

export const SystemSettingsSearch: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      mockResults={mockSearchResults.filter(group => 
        group.type === ResultType.SYSTEM_SETTING ||
        group.type === ResultType.API_DOCUMENTATION
      )}
    />
  ),
  args: {
    open: true,
    initialQuery: 'cors',
    placeholder: 'Search system settings and configuration...',
  },
  parameters: {
    docs: {
      description: {
        story: 'System configuration search showing settings and API documentation.',
      },
    },
  },
};

// Loading and error states
export const LoadingState: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      simulateLoading={true}
      delayMs={2000}
    />
  ),
  args: {
    open: true,
    initialQuery: 'searching...',
    placeholder: 'Search with loading state...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner during search API calls.',
      },
    },
  },
};

export const ErrorState: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      simulateError={true}
    />
  ),
  args: {
    open: true,
    initialQuery: 'error test',
    placeholder: 'Search with error simulation...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Error state with retry functionality when search API fails.',
      },
    },
  },
};

export const NoResults: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      mockResults={[]}
    />
  ),
  args: {
    open: true,
    initialQuery: 'nonexistent query',
    placeholder: 'Search with no results...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no search results are found.',
      },
    },
  },
};

// Keyboard navigation and accessibility
export const KeyboardNavigation: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    initialQuery: 'user',
    placeholder: 'Test keyboard navigation...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of keyboard navigation with arrow keys, Enter, and Escape.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for dialog to be rendered
    await waitFor(async () => {
      await expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    const searchInput = canvas.getByRole('textbox');
    
    // Test keyboard shortcuts
    await userEvent.click(searchInput);
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      const firstResult = canvas.getAllByRole('option')[0];
      expect(firstResult).toHaveAttribute('aria-selected', 'true');
    });
    
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
  },
};

export const ScreenReaderSupport: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    initialQuery: 'mysql',
    placeholder: 'Test screen reader announcements...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Screen reader support with ARIA labels, descriptions, and live regions.',
      },
    },
  },
};

export const GlobalKeyboardShortcut: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          setOpen(true);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
      <QueryWrapper>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Global Keyboard Shortcut Test
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Press <kbd className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded border text-sm font-mono">⌘K</kbd> or <kbd className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded border text-sm font-mono">Ctrl+K</kbd> to open search
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Try the keyboard shortcut now! Works from anywhere in the application.
                </p>
              </div>
            </div>

            <SearchDialog
              open={open}
              onOpenChange={setOpen}
              onSelectResult={(result) => {
                action('global-shortcut-result-selected')(result);
                setOpen(false);
              }}
              placeholder="Search triggered by global shortcut..."
              {...args}
            />
          </div>
        </div>
      </QueryWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Global Cmd/Ctrl+K keyboard shortcut to open search from anywhere.',
      },
    },
  },
};

// Recent searches functionality
export const RecentSearches: Story = {
  render: (args) => {
    return (
      <SearchDialogWrapper 
        {...args}
        config={{
          recentSearches: {
            enabled: true,
            maxCount: 5,
            searches: [
              {
                query: 'mysql database',
                timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
                resultCount: 3,
                primaryResultType: ResultType.DATABASE_SERVICE,
                wasSuccessful: true,
              },
              {
                query: 'user admin',
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                resultCount: 2,
                primaryResultType: ResultType.USER,
                wasSuccessful: true,
              },
              {
                query: 'cors settings',
                timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
                resultCount: 1,
                primaryResultType: ResultType.SYSTEM_SETTING,
                wasSuccessful: true,
              },
            ],
            frequencies: {
              'mysql database': 5,
              'user admin': 3,
              'cors settings': 2,
            },
            cleanup: {
              maxAgeDays: 30,
              removeUnsuccessful: true,
              minFrequency: 1,
            },
          },
        }}
      />
    );
  },
  args: {
    open: true,
    placeholder: 'Search or select from recent searches...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Recent searches with persistence and intelligent suggestions.',
      },
    },
  },
};

// Responsive design stories
export const MobileView: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    initialQuery: 'database',
    placeholder: 'Search on mobile...',
    config: {
      responsive: {
        mobile: {
          fullScreen: true,
          showSuggestions: true,
          touchFriendlySpacing: true,
          optimizeForVirtualKeyboard: true,
        },
      },
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-optimized view with full-screen dialog and touch-friendly interactions.',
      },
    },
  },
};

export const TabletView: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    initialQuery: 'system',
    placeholder: 'Search on tablet...',
    config: {
      responsive: {
        tablet: {
          dialogWidth: '85%',
          showFilterSidebar: false,
          useGridLayout: false,
        },
      },
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Tablet-optimized view with adjusted dialog sizing and layout.',
      },
    },
  },
};

// Dark mode
export const DarkMode: Story = {
  render: (args) => (
    <div className="dark">
      <SearchDialogWrapper {...args} />
    </div>
  ),
  args: {
    open: true,
    initialQuery: 'user',
    placeholder: 'Search in dark mode...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dark mode variant with proper contrast ratios and theme-aware styling.',
      },
    },
  },
};

// Performance testing
export const LargeResultSet: Story = {
  render: (args) => {
    // Generate large mock dataset
    const largeMockResults: SearchResultGroup[] = [
      {
        type: ResultType.DATABASE_TABLE,
        title: 'Database Tables',
        description: 'Large result set with virtual scrolling',
        icon: FolderIcon,
        results: Array.from({ length: 100 }, (_, i) => ({
          id: `table-${i}`,
          type: ResultType.DATABASE_TABLE,
          title: `table_${i.toString().padStart(3, '0')}`,
          subtitle: 'mysql-main database',
          description: `Auto-generated table ${i} for performance testing`,
          href: `/api-connections/database/mysql-main/schema/table_${i}`,
          badge: `${Math.floor(Math.random() * 50) + 5} fields`,
          badgeColor: 'secondary' as const,
          parent: {
            id: 'mysql-main',
            title: 'MySQL Main Database',
            type: ResultType.DATABASE_SERVICE,
          },
        })),
      },
    ];

    return (
      <SearchDialogWrapper 
        {...args}
        mockResults={largeMockResults}
      />
    );
  },
  args: {
    open: true,
    initialQuery: 'table',
    placeholder: 'Performance test with large result set...',
    config: {
      performance: {
        enableVirtualization: true,
        lazyLoadDetails: true,
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance testing with large result sets and virtual scrolling.',
      },
    },
  },
};

// Complex real-world scenario
export const DatabaseManagementScenario: Story = {
  render: (args) => (
    <SearchDialogWrapper 
      {...args}
      mockResults={[
        {
          type: ResultType.DATABASE_SERVICE,
          title: 'Database Services',
          description: 'Production database connections',
          icon: DatabaseIcon,
          results: [
            {
              id: 'prod-mysql',
              type: ResultType.DATABASE_SERVICE,
              title: 'Production MySQL',
              subtitle: 'mysql://prod.internal:3306',
              description: 'Primary production database cluster',
              href: '/api-connections/database/prod-mysql',
              badge: 'Connected',
              badgeColor: 'success',
              metadata: {
                database: {
                  connectionStatus: 'connected',
                  tableCount: 247,
                  fieldCount: 3821,
                  engine: 'MySQL 8.0.35',
                },
              },
            },
            {
              id: 'staging-postgres',
              type: ResultType.DATABASE_SERVICE,
              title: 'Staging PostgreSQL',
              subtitle: 'postgres://staging.internal:5432',
              description: 'Staging environment database',
              href: '/api-connections/database/staging-postgres',
              badge: 'Connecting...',
              badgeColor: 'warning',
              metadata: {
                database: {
                  connectionStatus: 'disconnected',
                  tableCount: 198,
                  fieldCount: 2947,
                  engine: 'PostgreSQL 16.1',
                },
              },
            },
          ],
        },
        {
          type: ResultType.DATABASE_TABLE,
          title: 'Critical Tables',
          description: 'High-priority database tables',
          icon: FolderIcon,
          results: [
            {
              id: 'users-prod',
              type: ResultType.DATABASE_TABLE,
              title: 'users',
              subtitle: 'Production MySQL',
              description: 'Production user accounts (2.3M records)',
              href: '/api-connections/database/prod-mysql/schema/users',
              badge: '2.3M records',
              badgeColor: 'primary',
              parent: {
                id: 'prod-mysql',
                title: 'Production MySQL',
                type: ResultType.DATABASE_SERVICE,
              },
            },
            {
              id: 'orders-prod',
              type: ResultType.DATABASE_TABLE,
              title: 'orders',
              subtitle: 'Production MySQL',
              description: 'Customer orders and transactions',
              href: '/api-connections/database/prod-mysql/schema/orders',
              badge: '8.7M records',
              badgeColor: 'primary',
              parent: {
                id: 'prod-mysql',
                title: 'Production MySQL',
                type: ResultType.DATABASE_SERVICE,
              },
            },
          ],
        },
        {
          type: ResultType.API_DOCUMENTATION,
          title: 'API Endpoints',
          description: 'Generated REST API documentation',
          icon: DocumentTextIcon,
          results: [
            {
              id: 'users-api',
              type: ResultType.API_DOCUMENTATION,
              title: 'Users API',
              subtitle: 'GET /api/v2/mysql/_table/users',
              description: 'User management REST endpoints',
              href: '/api-docs/mysql/users',
              badge: 'REST API',
              badgeColor: 'primary',
              metadata: {
                api: {
                  method: 'GET',
                  endpoint: '/api/v2/mysql/_table/users',
                  deprecated: false,
                },
              },
            },
          ],
        },
      ]}
    />
  ),
  args: {
    open: true,
    initialQuery: 'production',
    placeholder: 'Search production environment...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world database management scenario with production data and API endpoints.',
      },
    },
  },
};

// Accessibility testing
export const AccessibilityCompliance: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    open: true,
    initialQuery: 'accessibility',
    placeholder: 'WCAG 2.1 AA compliance test...',
    config: {
      accessibility: {
        keyboard: {
          arrowKeyNavigation: true,
          enterKeySelection: true,
          escapeKeyClose: true,
          announceNavigation: true,
        },
        screenReader: {
          announceResultCount: true,
          announceSelection: true,
          announceStatus: true,
          liveRegionPoliteness: 'polite',
          includeDescriptions: true,
        },
        focus: {
          trapFocus: true,
          restoreFocus: true,
          autoFocusInput: true,
          focusVisible: true,
        },
        touch: {
          minTouchTargetSize: 44,
          gestureSupport: true,
        },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility testing with WCAG 2.1 AA compliance validation.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test ARIA attributes
    const dialog = canvas.getByRole('dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-label');
    
    // Test keyboard navigation
    const searchInput = canvas.getByRole('textbox');
    await expect(searchInput).toHaveAttribute('aria-describedby');
    
    // Test minimum touch targets
    const results = canvas.getAllByRole('option');
    if (results.length > 0) {
      const firstResult = results[0];
      const rect = firstResult.getBoundingClientRect();
      await expect(rect.height).toBeGreaterThanOrEqual(44);
    }
  },
};

// Integration testing
export const ReactQueryIntegration: Story = {
  render: (args) => {
    const [queryCount, setQueryCount] = useState(0);
    
    const handleSearch = async (query: string): Promise<SearchResultGroup[]> => {
      setQueryCount(prev => prev + 1);
      // Simulate React Query behavior
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return mockSearchResults
        .map(group => ({
          ...group,
          results: group.results.filter(result =>
            result.title.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter(group => group.results.length > 0);
    };

    return (
      <QueryWrapper>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                React Query Integration Test
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Search queries executed: <span className="font-mono font-semibold">{queryCount}</span>
              </p>
            </div>

            <SearchDialog
              open={args.open}
              onOpenChange={args.onOpenChange}
              onSelectResult={args.onSelectResult}
              onSearch={handleSearch}
              placeholder="Test React Query caching..."
              config={{
                debounceDelay: 300,
                minQueryLength: 2,
              }}
            />
          </div>
        </div>
      </QueryWrapper>
    );
  },
  args: {
    open: true,
    onSelectResult: action('react-query-result-selected'),
    onOpenChange: action('react-query-open-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'React Query integration with caching, deduplication, and background updates.',
      },
    },
  },
};