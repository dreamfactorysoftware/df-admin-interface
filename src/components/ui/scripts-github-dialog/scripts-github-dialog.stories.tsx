/**
 * @fileoverview Storybook stories for ScriptsGithubDialog component
 * 
 * Comprehensive documentation and interactive examples for the GitHub script import
 * dialog component. Demonstrates URL validation, repository privacy detection,
 * authentication workflows, file extension filtering, error handling scenarios,
 * accessibility features, and integration patterns.
 * 
 * @version 1.0.0
 * @since 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { ScriptsGithubDialog } from './scripts-github-dialog';
import type { 
  ScriptsGithubDialogProps, 
  GitHubRepositoryInfo, 
  GitHubAuthCredentials,
  ScriptFileConfig 
} from './types';

// Create a fresh QueryClient for stories
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
      gcTime: 0,
    },
  },
});

// Mock script file configurations
const mockScriptFiles: ScriptFileConfig[] = [
  {
    name: 'auth-handler.js',
    path: 'src/scripts/auth-handler.js',
    extension: '.js',
    type: 'javascript',
    size: 2048,
    lastModified: '2024-01-15T10:30:00Z'
  },
  {
    name: 'data-processor.py',
    path: 'scripts/data-processor.py',
    extension: '.py',
    type: 'python',
    size: 3072,
    lastModified: '2024-01-10T14:22:00Z'
  },
  {
    name: 'endpoint-logic.php',
    path: 'api/endpoint-logic.php',
    extension: '.php',
    type: 'php',
    size: 1536,
    lastModified: '2024-01-08T09:15:00Z'
  },
  {
    name: 'config.txt',
    path: 'config/config.txt',
    extension: '.txt',
    type: 'text',
    size: 512,
    lastModified: '2024-01-05T16:45:00Z'
  }
];

// Mock repository data
const publicRepositoryInfo: GitHubRepositoryInfo = {
  name: 'dreamfactory-scripts',
  fullName: 'dreamfactory/dreamfactory-scripts',
  description: 'Collection of DreamFactory server-side scripts',
  private: false,
  url: 'https://github.com/dreamfactory/dreamfactory-scripts',
  defaultBranch: 'main',
  owner: {
    login: 'dreamfactory',
    avatarUrl: 'https://avatars.githubusercontent.com/u/7894046?v=4',
    type: 'Organization'
  },
  scriptFiles: mockScriptFiles.slice(0, 2),
  lastUpdated: '2024-01-15T10:30:00Z'
};

const privateRepositoryInfo: GitHubRepositoryInfo = {
  name: 'private-scripts',
  fullName: 'company/private-scripts',
  description: 'Private collection of company scripts',
  private: true,
  url: 'https://github.com/company/private-scripts',
  defaultBranch: 'main',
  owner: {
    login: 'company',
    avatarUrl: 'https://avatars.githubusercontent.com/u/12345?v=4',
    type: 'Organization'
  },
  scriptFiles: mockScriptFiles,
  lastUpdated: '2024-01-12T08:20:00Z'
};

// MSW handlers for different scenarios
const successHandlers = [
  rest.get('https://api.github.com/repos/dreamfactory/dreamfactory-scripts', (req, res, ctx) => {
    return res(ctx.json(publicRepositoryInfo));
  }),
  rest.get('https://api.github.com/repos/dreamfactory/dreamfactory-scripts/contents', (req, res, ctx) => {
    return res(ctx.json(mockScriptFiles.slice(0, 2)));
  }),
  rest.get('https://raw.githubusercontent.com/dreamfactory/dreamfactory-scripts/main/src/scripts/auth-handler.js', (req, res, ctx) => {
    return res(ctx.text(`
// DreamFactory Auth Handler Script
function handleAuthentication(request, response) {
    // Validate JWT token
    const token = request.headers['authorization'];
    if (!token) {
        throw new Error('Authentication required');
    }
    
    // Process authentication logic
    return true;
}

module.exports = { handleAuthentication };
    `));
  })
];

const privateRepoHandlers = [
  rest.get('https://api.github.com/repos/company/private-scripts', (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.includes('Basic')) {
      return res(ctx.status(401), ctx.json({ message: 'Bad credentials' }));
    }
    return res(ctx.json(privateRepositoryInfo));
  }),
  rest.get('https://api.github.com/repos/company/private-scripts/contents', (req, res, ctx) => {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.includes('Basic')) {
      return res(ctx.status(401), ctx.json({ message: 'Bad credentials' }));
    }
    return res(ctx.json(mockScriptFiles));
  })
];

const errorHandlers = [
  rest.get('https://api.github.com/repos/invalid/repository', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({ message: 'Not Found' }));
  }),
  rest.get('https://api.github.com/repos/rate-limited/repo', (req, res, ctx) => {
    return res(
      ctx.status(403),
      ctx.set('X-RateLimit-Remaining', '0'),
      ctx.json({ 
        message: 'API rate limit exceeded for user. (But here\'s the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)' 
      })
    );
  }),
  rest.get('https://api.github.com/repos/network/error', (req, res, ctx) => {
    return res.networkError('Failed to connect');
  })
];

// Story wrapper with QueryClient
const withQueryClient = (Story: any) => {
  const queryClient = createQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
};

// Default story configuration
const meta: Meta<typeof ScriptsGithubDialog> = {
  title: 'UI Components/Dialogs/ScriptsGithubDialog',
  component: ScriptsGithubDialog,
  decorators: [withQueryClient],
  parameters: {
    docs: {
      description: {
        component: `
## GitHub Scripts Import Dialog

A comprehensive dialog component for importing scripts from GitHub repositories. Supports:

- **URL Validation**: Real-time validation of GitHub repository URLs
- **Repository Detection**: Automatic detection of public vs private repositories  
- **Authentication**: Dynamic credential fields for private repository access
- **File Filtering**: Support for .js, .py, .php, and .txt file extensions
- **Error Handling**: Comprehensive error states for various GitHub API scenarios
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support

### Key Features

- React Hook Form integration with Zod validation
- React Query powered GitHub API integration
- Promise-based API for async script import workflows
- Responsive design with Tailwind CSS
- MSW integration for development and testing

### Usage

\`\`\`typescript
import { ScriptsGithubDialog } from '@/components/ui/scripts-github-dialog';

// Basic usage
const handleImportScript = async () => {
  try {
    const scriptData = await ScriptsGithubDialog.open();
    console.log('Imported script:', scriptData);
  } catch (error) {
    console.error('Import cancelled or failed:', error);
  }
};
\`\`\`
        `,
      },
    },
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls dialog visibility',
    },
    defaultUrl: {
      control: 'text',
      description: 'Pre-populated GitHub repository URL',
    },
    supportedExtensions: {
      control: 'object',
      description: 'Array of supported file extensions',
    },
    maxFileSize: {
      control: 'number',
      description: 'Maximum file size in bytes',
    },
    onImport: {
      action: 'onImport',
      description: 'Callback when script is successfully imported',
    },
    onCancel: {
      action: 'onCancel', 
      description: 'Callback when dialog is cancelled',
    },
    onError: {
      action: 'onError',
      description: 'Callback when import fails',
    },
  },
  args: {
    isOpen: true,
    supportedExtensions: ['.js', '.py', '.php', '.txt'],
    maxFileSize: 1024 * 1024, // 1MB
    onImport: action('onImport'),
    onCancel: action('onCancel'),
    onError: action('onError'),
  },
};

export default meta;
type Story = StoryObj<typeof ScriptsGithubDialog>;

/**
 * Default story showing the basic dialog state
 */
export const Default: Story = {
  name: '🎯 Default State',
  parameters: {
    docs: {
      description: {
        story: 'Basic dialog state with empty URL input ready for user interaction.',
      },
    },
    msw: {
      handlers: successHandlers,
    },
  },
};

/**
 * Story with pre-populated URL for public repository
 */
export const WithDefaultUrl: Story = {
  name: '🔗 Pre-populated URL',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with pre-populated GitHub URL for quick script import workflows.',
      },
    },
    msw: {
      handlers: successHandlers,
    },
  },
};

/**
 * Story demonstrating public repository detection and validation
 */
export const PublicRepositoryValidation: Story = {
  name: '🌍 Public Repository Detection',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates automatic repository validation and script file discovery for public repositories.',
      },
    },
    msw: {
      handlers: successHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for the dialog to load
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // The URL should be pre-populated
    const urlInput = canvas.getByLabelText(/github repository url/i);
    expect(urlInput).toHaveValue('https://github.com/dreamfactory/dreamfactory-scripts');

    // Repository info should appear after validation
    await waitFor(() => {
      expect(canvas.getByText('dreamfactory-scripts')).toBeInTheDocument();
      expect(canvas.getByText('Collection of DreamFactory server-side scripts')).toBeInTheDocument();
    });

    // Should show available script files
    await waitFor(() => {
      expect(canvas.getByText('auth-handler.js')).toBeInTheDocument();
      expect(canvas.getByText('data-processor.py')).toBeInTheDocument();
    });
  },
};

/**
 * Story showing private repository detection with authentication fields
 */
export const PrivateRepositoryAuthentication: Story = {
  name: '🔒 Private Repository Authentication',
  args: {
    defaultUrl: 'https://github.com/company/private-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows dynamic authentication fields when a private repository is detected.',
      },
    },
    msw: {
      handlers: privateRepoHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for the dialog to load
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Enter private repository URL
    const urlInput = canvas.getByLabelText(/github repository url/i);
    await userEvent.clear(urlInput);
    await userEvent.type(urlInput, 'https://github.com/company/private-scripts');

    // Authentication fields should appear
    await waitFor(() => {
      expect(canvas.getByLabelText(/username/i)).toBeInTheDocument();
      expect(canvas.getByLabelText(/password/i)).toBeInTheDocument();
    });

    // Enter credentials
    const usernameInput = canvas.getByLabelText(/username/i);
    const passwordInput = canvas.getByLabelText(/password/i);
    
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'testpass');

    // Repository should be accessible after authentication
    await waitFor(() => {
      expect(canvas.getByText('private-scripts')).toBeInTheDocument();
      expect(canvas.getByText('Private collection of company scripts')).toBeInTheDocument();
    });
  },
};

/**
 * Story demonstrating file extension filtering
 */
export const FileExtensionFiltering: Story = {
  name: '📁 File Extension Filtering',
  args: {
    defaultUrl: 'https://github.com/company/private-scripts',
    supportedExtensions: ['.js', '.py'], // Only JavaScript and Python
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates file filtering based on supported extensions (.js, .py only in this example).',
      },
    },
    msw: {
      handlers: privateRepoHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Should show filtered files (only .js and .py)
    await waitFor(() => {
      expect(canvas.getByText('auth-handler.js')).toBeInTheDocument();
      expect(canvas.getByText('data-processor.py')).toBeInTheDocument();
      
      // .php and .txt files should not be shown
      expect(canvas.queryByText('endpoint-logic.php')).not.toBeInTheDocument();
      expect(canvas.queryByText('config.txt')).not.toBeInTheDocument();
    });
  },
};

/**
 * Story showing invalid URL error handling
 */
export const InvalidUrlError: Story = {
  name: '❌ Invalid URL Error',
  args: {
    defaultUrl: 'https://github.com/invalid/repository',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling for invalid or non-existent GitHub repositories.',
      },
    },
    msw: {
      handlers: errorHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Error message should appear
    await waitFor(() => {
      expect(canvas.getByText(/repository not found/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Import button should be disabled
    const importButton = canvas.getByRole('button', { name: /import script/i });
    expect(importButton).toBeDisabled();
  },
};

/**
 * Story showing API rate limit error
 */
export const RateLimitError: Story = {
  name: '⚡ Rate Limit Error',
  args: {
    defaultUrl: 'https://github.com/rate-limited/repo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling for GitHub API rate limit scenarios.',
      },
    },
    msw: {
      handlers: errorHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Rate limit error message should appear
    await waitFor(() => {
      expect(canvas.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

/**
 * Story showing network error handling
 */
export const NetworkError: Story = {
  name: '🌐 Network Error',
  args: {
    defaultUrl: 'https://github.com/network/error',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling for network connectivity issues.',
      },
    },
    msw: {
      handlers: errorHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Network error message should appear
    await waitFor(() => {
      expect(canvas.getByText(/network error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

/**
 * Story demonstrating loading states
 */
export const LoadingStates: Story = {
  name: '⏳ Loading States',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows loading indicators during repository validation and script fetching.',
      },
    },
    msw: {
      handlers: [
        rest.get('https://api.github.com/repos/dreamfactory/dreamfactory-scripts', (req, res, ctx) => {
          // Add delay to show loading state
          return res(ctx.delay(2000), ctx.json(publicRepositoryInfo));
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Should show loading indicator
    await waitFor(() => {
      expect(canvas.getByRole('status')).toBeInTheDocument();
      expect(canvas.getByText(/validating repository/i)).toBeInTheDocument();
    });
  },
};

/**
 * Story demonstrating successful script import workflow
 */
export const SuccessfulImport: Story = {
  name: '✅ Successful Import',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete workflow showing successful script selection and import.',
      },
    },
    msw: {
      handlers: successHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Wait for repository to load
    await waitFor(() => {
      expect(canvas.getByText('auth-handler.js')).toBeInTheDocument();
    });

    // Select a script file
    const scriptFile = canvas.getByRole('radio', { name: /auth-handler\.js/i });
    await userEvent.click(scriptFile);

    // Import button should be enabled
    const importButton = canvas.getByRole('button', { name: /import script/i });
    expect(importButton).toBeEnabled();

    // Click import
    await userEvent.click(importButton);

    // Should trigger import callback
    await waitFor(() => {
      expect(importButton).toHaveTextContent(/importing/i);
    });
  },
};

/**
 * Story demonstrating keyboard navigation
 */
export const KeyboardNavigation: Story = {
  name: '⌨️ Keyboard Navigation',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates keyboard navigation and accessibility features.',
      },
    },
    msw: {
      handlers: successHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Test ESC key to close dialog
    await userEvent.keyboard('{Escape}');
    
    // Test Tab navigation
    await userEvent.tab();
    
    // Test Enter key to submit
    await userEvent.keyboard('{Enter}');
  },
};

/**
 * Story demonstrating dark mode
 */
export const DarkMode: Story = {
  name: '🌙 Dark Mode',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog appearance in dark mode with proper contrast and accessibility.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
    msw: {
      handlers: successHandlers,
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-gray-900 min-h-screen p-8">
          <Story />
        </div>
      </div>
    ),
  ],
};

/**
 * Story demonstrating mobile responsive design
 */
export const MobileResponsive: Story = {
  name: '📱 Mobile Responsive',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog optimized for mobile devices with touch-friendly interactions.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
    msw: {
      handlers: successHandlers,
    },
  },
};

/**
 * Story showing all supported file extensions
 */
export const AllFileExtensions: Story = {
  name: '📄 All File Extensions',
  args: {
    defaultUrl: 'https://github.com/company/private-scripts',
    supportedExtensions: ['.js', '.py', '.php', '.txt'],
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows all supported file extensions and their handling.',
      },
    },
    msw: {
      handlers: privateRepoHandlers,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });

    // Should show all file types
    await waitFor(() => {
      expect(canvas.getByText('auth-handler.js')).toBeInTheDocument(); // JavaScript
      expect(canvas.getByText('data-processor.py')).toBeInTheDocument(); // Python
      expect(canvas.getByText('endpoint-logic.php')).toBeInTheDocument(); // PHP
      expect(canvas.getByText('config.txt')).toBeInTheDocument(); // Text
    });

    // Each file should have appropriate icons/indicators
    expect(canvas.getByText(/javascript/i)).toBeInTheDocument();
    expect(canvas.getByText(/python/i)).toBeInTheDocument();
    expect(canvas.getByText(/php/i)).toBeInTheDocument();
    expect(canvas.getByText(/text/i)).toBeInTheDocument();
  },
};

/**
 * Story demonstrating integration with other components
 */
export const IntegrationExample: Story = {
  name: '🔗 Integration Example',
  args: {
    defaultUrl: 'https://github.com/dreamfactory/dreamfactory-scripts',
  },
  parameters: {
    docs: {
      description: {
        story: 'Example of integrating the dialog with other application components.',
      },
    },
    msw: {
      handlers: successHandlers,
    },
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Script Management Interface
          </h3>
          <p className="text-blue-700 text-sm mb-4">
            Import scripts from GitHub repositories to enhance your API functionality.
          </p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={action('openGithubDialog')}
          >
            Import from GitHub
          </button>
        </div>
        <Story />
      </div>
    ),
  ],
};

/**
 * Playground story for interactive testing
 */
export const Playground: Story = {
  name: '🎮 Playground',
  parameters: {
    docs: {
      description: {
        story: 'Interactive playground for testing all dialog features and configurations.',
      },
    },
    msw: {
      handlers: [...successHandlers, ...privateRepoHandlers, ...errorHandlers],
    },
  },
  argTypes: {
    defaultUrl: {
      control: 'text',
      description: 'Try different GitHub URLs to test validation',
    },
    supportedExtensions: {
      control: 'check',
      options: ['.js', '.py', '.php', '.txt'],
      description: 'Select which file extensions to support',
    },
    maxFileSize: {
      control: { type: 'range', min: 1024, max: 10485760, step: 1024 },
      description: 'Maximum file size in bytes (1KB - 10MB)',
    },
  },
};