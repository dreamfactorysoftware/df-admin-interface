/**
 * Storybook stories for the SearchDialog component providing comprehensive documentation
 * and interactive examples. Demonstrates search functionality, keyboard navigation,
 * accessibility features, responsive behavior, loading states, and error handling.
 * 
 * Features documented:
 * - Search functionality with different result types (databases, tables, users, settings)
 * - Keyboard navigation including Cmd/Ctrl+K trigger and arrow key selection
 * - Accessibility features with ARIA labeling, focus management, and screen reader support
 * - Responsive design examples showing mobile and desktop interactions
 * - Loading states, debouncing behavior, and search result animations
 * - Recent searches functionality with persistence demonstration
 * - Error handling scenarios including network failures and empty results
 * - React Query integration for search data fetching
 * - Dark mode and theme variant examples with proper contrast ratios
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchDialog } from './search-dialog';
import { SearchResultType, type SearchResult, type SearchDialogProps } from './types';
import { Button } from '../button/button';

// Mock search handlers for realistic testing
const mockSearchResults: SearchResult[] = [
  // Database results
  {
    id: 'db-mysql-main',
    title: 'MySQL Main Database',
    description: 'Primary application database with user data and core tables',
    type: SearchResultType.DATABASE,
    url: '/api-connections/database/mysql-main',
    category: 'Database Services',
    icon: '🗄️',
    metadata: {
      parent: 'Database Services',
      tags: ['mysql', 'primary', 'production'],
      lastModified: new Date('2024-01-15'),
      usageCount: 1247
    },
    score: 0.95
  },
  {
    id: 'db-postgres-analytics',
    title: 'PostgreSQL Analytics',
    description: 'Analytics and reporting database for business intelligence',
    type: SearchResultType.DATABASE,
    url: '/api-connections/database/postgres-analytics',
    category: 'Database Services',
    icon: '📊',
    metadata: {
      parent: 'Database Services',
      tags: ['postgresql', 'analytics', 'reporting'],
      lastModified: new Date('2024-01-10'),
      usageCount: 892
    },
    score: 0.88
  },
  // Table results
  {
    id: 'table-users',
    title: 'users',
    description: 'User accounts and authentication data (25 fields)',
    type: SearchResultType.TABLE,
    url: '/api-connections/database/mysql-main/schema/users',
    category: 'Database Tables',
    icon: '👥',
    metadata: {
      parent: 'MySQL Main Database',
      tags: ['users', 'authentication', 'core'],
      lastModified: new Date('2024-01-14'),
      usageCount: 2156
    },
    score: 0.92
  },
  {
    id: 'table-orders',
    title: 'orders',
    description: 'E-commerce order data and transaction history (18 fields)',
    type: SearchResultType.TABLE,
    url: '/api-connections/database/mysql-main/schema/orders',
    category: 'Database Tables',
    icon: '📦',
    metadata: {
      parent: 'MySQL Main Database',
      tags: ['orders', 'ecommerce', 'transactions'],
      lastModified: new Date('2024-01-12'),
      usageCount: 1834
    },
    score: 0.87
  },
  // Field results
  {
    id: 'field-email',
    title: 'email',
    description: 'User email address field with unique constraint',
    type: SearchResultType.FIELD,
    url: '/api-connections/database/mysql-main/schema/users/email',
    category: 'Table Fields',
    icon: '📧',
    metadata: {
      parent: 'users table',
      tags: ['email', 'unique', 'varchar'],
      lastModified: new Date('2024-01-14'),
      usageCount: 987
    },
    score: 0.85
  },
  // User results
  {
    id: 'user-john-doe',
    title: 'John Doe',
    description: 'System Administrator - john.doe@dreamfactory.com',
    type: SearchResultType.USER,
    url: '/admin-settings/users/john-doe',
    category: 'Users',
    icon: '👤',
    metadata: {
      parent: 'System Users',
      tags: ['admin', 'system', 'active'],
      lastModified: new Date('2024-01-13'),
      usageCount: 445
    },
    score: 0.79
  },
  // Setting results
  {
    id: 'setting-cors',
    title: 'CORS Configuration',
    description: 'Cross-Origin Resource Sharing security settings',
    type: SearchResultType.SETTING,
    url: '/system-settings/cors',
    category: 'System Settings',
    icon: '🔐',
    metadata: {
      parent: 'Security Settings',
      tags: ['cors', 'security', 'http'],
      lastModified: new Date('2024-01-08'),
      usageCount: 123
    },
    score: 0.73
  },
  // Role results
  {
    id: 'role-database-admin',
    title: 'Database Administrator',
    description: 'Full access to database services and schema management',
    type: SearchResultType.ROLE,
    url: '/api-security/roles/database-admin',
    category: 'Security Roles',
    icon: '🛡️',
    metadata: {
      parent: 'Access Control',
      tags: ['role', 'database', 'admin'],
      lastModified: new Date('2024-01-11'),
      usageCount: 67
    },
    score: 0.71
  },
  // Service results
  {
    id: 'service-email-smtp',
    title: 'SMTP Email Service',
    description: 'Email delivery service for notifications and alerts',
    type: SearchResultType.SERVICE,
    url: '/system-settings/services/email-smtp',
    category: 'System Services',
    icon: '📮',
    metadata: {
      parent: 'Communication Services',
      tags: ['smtp', 'email', 'notifications'],
      lastModified: new Date('2024-01-09'),
      usageCount: 234
    },
    score: 0.68
  }
];

// Mock search function with realistic delays and filtering
const mockSearchFunction = async (query: string): Promise<SearchResult[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
  
  if (!query.trim()) {
    return [];
  }
  
  // Simulate search filtering
  const filtered = mockSearchResults.filter(result => 
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description.toLowerCase().includes(query.toLowerCase()) ||
    result.metadata?.tags?.some(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    )
  );
  
  // Sort by score descending
  return filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
};

// Error simulation function
const mockSearchWithError = async (query: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  throw new Error('Search service temporarily unavailable. Please try again later.');
};

// Empty results simulation
const mockSearchWithNoResults = async (query: string): Promise<SearchResult[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [];
};

// Query client setup for stories
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Wrapper component for stories with React Query
const SearchDialogWrapper = ({ 
  onSearch = mockSearchFunction,
  ...props 
}: Partial<SearchDialogProps> & { onSearch?: typeof mockSearchFunction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [queryClient] = useState(() => createQueryClient());

  // Global keyboard shortcut simulation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Search Dialog Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try pressing <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-mono">
                Cmd/Ctrl + K
              </kbd> to open the search dialog
            </p>
            <Button 
              onClick={() => setIsOpen(true)}
              variant="primary"
              data-testid="open-search-button"
            >
              Open Search Dialog
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Sample Content
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              This content demonstrates that the search dialog is a global overlay.
              The search functionality covers databases, tables, users, settings, and more.
            </p>
          </div>
        </div>

        <SearchDialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onSelect={(result) => {
            action('search-result-selected')(result);
            setIsOpen(false);
          }}
          onSearch={onSearch}
          {...props}
        />
      </div>
    </QueryClientProvider>
  );
};

const meta: Meta<typeof SearchDialog> = {
  title: 'UI/SearchDialog',
  component: SearchDialog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# SearchDialog Component

A global search dialog component implementing WCAG 2.1 AA accessibility standards using Headless UI primitives and Tailwind CSS. Provides command palette-style search functionality with real-time results, recent queries, keyboard navigation, and responsive design.

## Features

- **🔍 Global Search**: Command palette-style search across all application entities
- **⌨️ Keyboard Navigation**: Full keyboard support with Cmd/Ctrl+K trigger
- **♿ Accessibility**: WCAG 2.1 AA compliant with screen reader support
- **📱 Responsive**: Mobile-first design with touch optimization
- **💾 Recent Searches**: Persistent search history with localStorage
- **🎨 Theming**: Dark/light mode support with proper contrast ratios
- **🔄 React Query**: Intelligent caching and background refetching
- **🎭 Animations**: Smooth transitions and loading states

## Search Result Types

The search dialog supports multiple entity types:
- **Database Services**: Connection configurations and database instances
- **Tables**: Database tables with field counts and metadata
- **Fields**: Individual table fields with type information
- **Users**: System users and administrators
- **Roles**: Security roles and permissions
- **Settings**: System configuration options
- **Services**: System services and integrations

## Keyboard Shortcuts

- **Cmd/Ctrl + K**: Open search dialog
- **Escape**: Close dialog or clear search
- **Arrow Up/Down**: Navigate results
- **Enter**: Select highlighted result
- **Tab**: Navigate between result groups

## Accessibility Features

- **Focus Management**: Proper focus trapping and restoration
- **ARIA Labels**: Comprehensive labeling for screen readers
- **Live Regions**: Announces search results and status changes
- **Keyboard Navigation**: Full keyboard accessibility
- **High Contrast**: Supports high contrast mode preferences
- **Reduced Motion**: Respects user motion preferences
        `
      }
    },
    a11y: {
      element: '[role="dialog"]',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          },
          {
            id: 'focus-order-semantics', 
            enabled: true
          },
          {
            id: 'keyboard-navigation',
            enabled: true
          }
        ]
      }
    }
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the search dialog is currently open'
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input'
    },
    showRecentSearches: {
      control: 'boolean',
      description: 'Whether to show recent searches section'
    },
    maxRecentSearches: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Maximum number of recent searches to display'
    },
    initialQuery: {
      control: 'text',
      description: 'Initial search query'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof SearchDialog>;

/**
 * Default search dialog with comprehensive functionality and realistic search results.
 * Demonstrates the primary use case with multiple result types and keyboard navigation.
 */
export const Default: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Search databases, tables, users, and settings...',
    showRecentSearches: true,
    maxRecentSearches: 5
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Open search dialog', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      await waitFor(() => {
        expect(canvas.getByRole('dialog')).toBeInTheDocument();
      });
    });

    await step('Test search functionality', async () => {
      const searchInput = canvas.getByRole('combobox');
      await userEvent.type(searchInput, 'mysql');
      
      await waitFor(() => {
        expect(canvas.getByText('MySQL Main Database')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    await step('Test keyboard navigation', async () => {
      const searchInput = canvas.getByRole('combobox');
      await userEvent.keyboard('{ArrowDown}');
      
      // Verify first result is highlighted
      await waitFor(() => {
        const firstResult = canvas.getByText('MySQL Main Database').closest('[role="option"]');
        expect(firstResult).toHaveAttribute('aria-selected', 'true');
      });
    });
  }
};

/**
 * Demonstrates keyboard shortcuts, particularly the global Cmd/Ctrl+K trigger.
 * Shows how the search dialog integrates with global keyboard navigation patterns.
 */
export const KeyboardShortcuts: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Press Cmd/Ctrl+K to open, Escape to close...',
    showRecentSearches: true
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates global keyboard shortcuts for the search dialog:

- **Cmd/Ctrl + K**: Opens the search dialog from anywhere in the application
- **Escape**: Closes the dialog or clears the search input
- **Arrow Keys**: Navigate between search results
- **Enter**: Select the highlighted result
- **Tab/Shift+Tab**: Navigate between result groups

The keyboard shortcuts follow platform conventions and work consistently across the application.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    await step('Test global keyboard shortcut', async () => {
      // Simulate Cmd+K (or Ctrl+K)
      await userEvent.keyboard('{Meta>}k{/Meta}');
      
      await waitFor(() => {
        const dialog = within(canvasElement).getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });

    await step('Test escape to close', async () => {
      await userEvent.keyboard('{Escape}');
      
      await waitFor(() => {
        expect(within(canvasElement).queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  }
};

/**
 * Loading states demonstration showing search debouncing, loading indicators,
 * and smooth transitions during search operations.
 */
export const LoadingStates: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Type to see loading states in action...',
    showRecentSearches: false,
    onSearch: async (query: string) => {
      // Extended delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1500));
      return mockSearchFunction(query);
    }
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates loading states and debouncing behavior:

- **Debounced Input**: Search requests are debounced by 300ms to prevent excessive API calls
- **Loading Indicators**: Spinner and loading text during search operations
- **Progressive Loading**: Results appear smoothly as they load
- **Search Cancellation**: Previous searches are cancelled when new ones start

The loading states provide clear feedback to users while optimizing performance.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Open dialog and trigger loading state', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      const searchInput = canvas.getByRole('combobox');
      await userEvent.type(searchInput, 'database');
      
      // Verify loading indicator appears
      await waitFor(() => {
        expect(canvas.getByText(/searching/i)).toBeInTheDocument();
      });
    });
  }
};

/**
 * Error handling scenarios including network failures, timeout errors,
 * and appropriate user feedback mechanisms.
 */
export const ErrorHandling: Story = {
  render: (args) => <SearchDialogWrapper {...args} onSearch={mockSearchWithError} />,
  args: {
    placeholder: 'Search to trigger error state...',
    showRecentSearches: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates comprehensive error handling:

- **Network Errors**: Graceful handling of connection failures
- **Timeout Errors**: Appropriate feedback for slow responses
- **Service Unavailable**: Clear messaging when search service is down
- **Retry Mechanisms**: Options to retry failed searches
- **Error Recovery**: Ability to clear errors and continue searching

Error states maintain accessibility and provide actionable feedback to users.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Trigger error state', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      const searchInput = canvas.getByRole('combobox');
      await userEvent.type(searchInput, 'error');
      
      // Wait for error message to appear
      await waitFor(() => {
        expect(canvas.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  }
};

/**
 * Empty results state showing appropriate messaging and suggestions
 * when no search results are found.
 */
export const EmptyResults: Story = {
  render: (args) => <SearchDialogWrapper {...args} onSearch={mockSearchWithNoResults} />,
  args: {
    placeholder: 'Search for something that does not exist...',
    showRecentSearches: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates empty search results handling:

- **No Results Found**: Clear messaging when search returns no results
- **Search Suggestions**: Helpful tips for refining search queries
- **Alternative Actions**: Suggestions for what users can do next
- **Maintained State**: Search input remains available for modification

The empty state provides constructive guidance while maintaining search functionality.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Search with no results', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      const searchInput = canvas.getByRole('combobox');
      await userEvent.type(searchInput, 'nonexistent-item-xyz');
      
      await waitFor(() => {
        expect(canvas.getByText(/no results found/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  }
};

/**
 * Recent searches functionality demonstrating localStorage persistence,
 * search history management, and quick access to previous searches.
 */
export const RecentSearches: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Previous searches will appear below...',
    showRecentSearches: true,
    maxRecentSearches: 8
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates recent searches functionality:

- **Persistent History**: Search history stored in localStorage
- **Quick Access**: Click on recent searches to repeat them
- **History Management**: Automatic cleanup and size limits
- **Clear History**: Option to clear all recent searches
- **Privacy Aware**: Respects user privacy preferences

Recent searches improve user efficiency by providing quick access to previous queries.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Perform multiple searches to build history', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      const searchInput = canvas.getByRole('combobox');
      
      // Perform several searches
      const searchTerms = ['users', 'database', 'settings'];
      
      for (const term of searchTerms) {
        await userEvent.clear(searchInput);
        await userEvent.type(searchInput, term);
        await waitFor(() => {
          expect(canvas.queryByText(/searching/i)).not.toBeInTheDocument();
        });
      }
      
      // Clear search to show recent searches
      await userEvent.clear(searchInput);
      
      // Verify recent searches appear
      await waitFor(() => {
        expect(canvas.getByText(/recent searches/i)).toBeInTheDocument();
      });
    });
  }
};

/**
 * Responsive design demonstration showing how the search dialog adapts
 * to different screen sizes and touch interactions.
 */
export const ResponsiveDesign: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Responsive design adapts to screen size...',
    showRecentSearches: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: `
Demonstrates responsive design features:

- **Mobile-First**: Optimized for mobile devices with touch interactions
- **Fullscreen Mobile**: Full-screen experience on mobile devices
- **Touch Optimization**: Larger touch targets and gesture support
- **Adaptive Layout**: Layout adjusts based on available screen space
- **Virtual Keyboard**: Proper handling of virtual keyboard appearance

The responsive design ensures consistent user experience across all devices.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Test mobile interaction', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      // Verify dialog appears and is properly sized for mobile
      await waitFor(() => {
        const dialog = canvas.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveClass('fixed', 'inset-0'); // Full screen on mobile
      });
    });
  }
};

/**
 * Dark mode theme demonstration showing proper contrast ratios,
 * theme-aware styling, and accessibility in dark theme.
 */
export const DarkMode: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Dark mode with proper contrast ratios...',
    showRecentSearches: true
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: `
Demonstrates dark mode support:

- **Theme Consistency**: Matches application theme automatically
- **Proper Contrast**: WCAG 2.1 AA compliant contrast ratios
- **Theme-Aware Icons**: Icons adapt to theme context
- **Accessibility**: Maintains accessibility in dark theme
- **User Preference**: Respects system theme preferences

Dark mode provides a comfortable viewing experience in low-light conditions.
        `
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    )
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Verify dark mode styling', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      await waitFor(() => {
        const dialog = canvas.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        // Verify dark mode classes are applied
        expect(document.documentElement).toHaveClass('dark');
      });
    });
  }
};

/**
 * Accessibility demonstration showcasing screen reader support,
 * keyboard navigation, and WCAG 2.1 AA compliance features.
 */
export const AccessibilityFeatures: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Fully accessible with screen reader support...',
    showRecentSearches: true,
    a11y: {
      dialogLabel: 'Global search dialog',
      dialogDescription: 'Search for databases, tables, users, and system settings',
      announceResults: true,
      announceLoading: true,
      focus: {
        trapFocus: true,
        initialFocus: 'input',
        returnFocus: 'trigger'
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates comprehensive accessibility features:

- **Screen Reader Support**: Full compatibility with NVDA, JAWS, and VoiceOver
- **Focus Management**: Proper focus trapping and restoration
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Announces search results and status changes
- **Keyboard Navigation**: Complete keyboard accessibility
- **High Contrast**: Supports high contrast mode preferences

All accessibility features are tested and validated for WCAG 2.1 AA compliance.
        `
      }
    }
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Verify accessibility attributes', async () => {
      const openButton = canvas.getByTestId('open-search-button');
      await userEvent.click(openButton);
      
      await waitFor(() => {
        const dialog = canvas.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-label', 'Global search dialog');
        
        const searchInput = canvas.getByRole('combobox');
        expect(searchInput).toHaveAttribute('aria-expanded');
        expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      });
    });

    await step('Test keyboard navigation', async () => {
      const searchInput = canvas.getByRole('combobox');
      await userEvent.type(searchInput, 'test');
      
      await waitFor(() => {
        // Test that results are properly announced
        const resultsList = canvas.getByRole('listbox');
        expect(resultsList).toBeInTheDocument();
        expect(resultsList).toHaveAttribute('aria-live');
      });
    });
  }
};

/**
 * Performance demonstration showing debouncing, caching behavior,
 * and optimization features for large result sets.
 */
export const PerformanceOptimization: Story = {
  render: (args) => <SearchDialogWrapper {...args} />,
  args: {
    placeholder: 'Optimized for performance with caching...',
    showRecentSearches: true,
    onSearch: async (query: string) => {
      // Simulate variable response times
      const delay = Math.random() * 100 + 50;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Return larger result set for performance testing
      const baseResults = await mockSearchFunction(query);
      return baseResults.concat(
        ...Array.from({ length: 20 }, (_, i) => ({
          ...baseResults[0],
          id: `${baseResults[0]?.id}-${i}`,
          title: `${baseResults[0]?.title} ${i + 1}`,
          score: Math.random() * 0.5 + 0.3
        }))
      );
    }
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates performance optimization features:

- **Debounced Search**: 300ms debounce prevents excessive API calls
- **React Query Caching**: Intelligent caching of search results
- **Virtual Scrolling**: Efficient rendering of large result sets
- **Background Refetching**: Automatic cache updates in background
- **Request Cancellation**: Cancels previous requests when new ones start
- **Memory Management**: Proper cleanup and garbage collection

Performance optimizations ensure smooth user experience even with large datasets.
        `
      }
    }
  }
};