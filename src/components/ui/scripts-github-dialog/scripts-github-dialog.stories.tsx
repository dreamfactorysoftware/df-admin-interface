import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { useState } from 'react';
import { ScriptsGitHubDialog } from './scripts-github-dialog';
import { Button } from '@/components/ui/button/button';
import type { 
  GitHubDialogResult, 
  GitHubError, 
  GitHubScriptResult,
  GitHubUrlParts 
} from './types';

const meta = {
  title: 'UI Components/Scripts GitHub Dialog',
  component: ScriptsGitHubDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Scripts GitHub Dialog Component

A comprehensive dialog component for importing scripts from GitHub repositories, replacing Angular 
DfScriptsGithubDialogComponent. Provides form-based UI for entering GitHub repository URLs, validates 
HTTP/HTTPS format and file extensions, handles private repository authentication, and returns selected script data.

## Features

- ✅ **WCAG 2.1 AA Compliant**: Dialog, form controls, and keyboard navigation
- ✅ **GitHub URL Validation**: Real-time validation with file extension filtering  
- ✅ **Private Repository Support**: Username/token authentication with auto-detection
- ✅ **React Hook Form Integration**: Real-time validation with Zod schemas
- ✅ **Error Handling**: Comprehensive error scenarios with helpful messages
- ✅ **Dark Mode**: Complete theme support with consistent styling
- ✅ **Accessible**: Screen reader support, keyboard navigation, focus management

## Supported File Types

- \`.js\` - JavaScript files
- \`.py\` - Python scripts  
- \`.php\` - PHP scripts
- \`.txt\` - Text files
- \`.json\` - JSON configuration files
- \`.ts\`, \`.tsx\`, \`.jsx\` - TypeScript/React files

## Authentication

For private repositories, the dialog automatically detects access requirements and prompts for:
- GitHub username
- Personal access token (with link to GitHub settings)

## Error Scenarios

- Invalid GitHub URLs
- Unsupported file extensions
- Network connectivity issues
- Authentication failures
- Repository/file not found
- API rate limiting
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    initialUrl: {
      control: 'text',
      description: 'Optional initial URL value',
    },
    onClose: {
      action: 'dialog-closed',
      description: 'Callback when dialog is closed',
    },
    onImport: {
      action: 'script-imported',
      description: 'Callback when script is successfully imported',
    },
  },
} satisfies Meta<typeof ScriptsGitHubDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockSuccessResult: GitHubDialogResult = {
  data: 'console.log("Hello from GitHub script!");',
  repoInfo: {
    owner: 'dreamfactory',
    repo: 'example-scripts',
    filePath: 'scripts/hello.js',
    originalUrl: 'https://github.com/dreamfactory/example-scripts/blob/main/scripts/hello.js',
    isValid: true,
  } as GitHubUrlParts,
};

const mockPrivateRepoError: GitHubError = {
  type: 'authentication_failed',
  message: 'Authentication failed. Please check your username and personal access token.',
  statusCode: 401,
  timestamp: new Date().toISOString(),
  suggestions: [
    'Verify your GitHub username is correct',
    'Generate a new personal access token at https://github.com/settings/tokens',
    'Ensure the token has appropriate repository permissions',
  ],
};

// Basic dialog states
export const Default: Story = {
  args: {
    isOpen: true,
    onClose: action('dialog-closed'),
    onImport: action('script-imported'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default dialog state with empty form ready for GitHub URL input.',
      },
    },
  },
};

export const WithInitialUrl: Story = {
  args: {
    isOpen: true,
    initialUrl: 'https://github.com/dreamfactory/example-scripts/blob/main/scripts/hello.js',
    onClose: action('dialog-closed'),
    onImport: action('script-imported'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog pre-filled with a GitHub URL for editing or validation.',
      },
    },
  },
};

export const PublicRepositoryFlow: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>
          Open GitHub Import Dialog
        </Button>
        
        <ScriptsGitHubDialog
          {...args}
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            action('dialog-closed')();
          }}
          onImport={(result) => {
            action('script-imported')(result);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete workflow for importing from a public GitHub repository. Click to open dialog and test the flow.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Open dialog
    const openButton = canvas.getByText('Open GitHub Import Dialog');
    await userEvent.click(openButton);
    
    // Wait for dialog to appear
    await waitFor(() => {
      expect(canvas.getByText('Import Script from GitHub')).toBeInTheDocument();
    });
    
    // Test URL input
    const urlInput = canvas.getByLabelText('GitHub File URL');
    await userEvent.type(urlInput, 'https://github.com/dreamfactory/example-scripts/blob/main/scripts/hello.js');
    
    // Verify URL validation
    await waitFor(() => {
      expect(urlInput).toHaveValue('https://github.com/dreamfactory/example-scripts/blob/main/scripts/hello.js');
    });
  },
};

export const PrivateRepositoryFlow: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    
    return (
      <div className="space-y-4">
        <Button onClick={() => setIsOpen(true)}>
          Open Private Repo Dialog
        </Button>
        
        <ScriptsGitHubDialog
          {...args}
          isOpen={isOpen}
          initialUrl="https://github.com/private-org/secret-scripts/blob/main/config.js"
          onClose={() => {
            setIsOpen(false);
            setShowAuth(false);
            action('dialog-closed')();
          }}
          onImport={(result) => {
            action('script-imported')(result);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Workflow for private repositories showing authentication form fields when repository access is restricted.',
      },
    },
  },
};

// URL validation demonstrations
export const UrlValidationExamples: Story = {
  render: () => {
    const [activeDialog, setActiveDialog] = useState<string | null>(null);
    
    const validUrls = [
      {
        label: 'JavaScript File',
        url: 'https://github.com/user/repo/blob/main/script.js',
        description: 'Valid JavaScript file URL',
      },
      {
        label: 'Python Script',
        url: 'https://github.com/user/repo/blob/develop/automation.py',
        description: 'Valid Python script URL',
      },
      {
        label: 'TypeScript File',
        url: 'https://github.com/user/repo/blob/main/utils.ts',
        description: 'Valid TypeScript file URL',
      },
      {
        label: 'PHP Script',
        url: 'https://github.com/user/repo/blob/main/api.php',
        description: 'Valid PHP script URL',
      },
    ];
    
    const invalidUrls = [
      {
        label: 'Non-GitHub URL',
        url: 'https://gitlab.com/user/repo/blob/main/script.js',
        description: 'Invalid: Not a GitHub URL',
      },
      {
        label: 'Repository Root',
        url: 'https://github.com/user/repo',
        description: 'Invalid: No file specified',
      },
      {
        label: 'Unsupported Extension',
        url: 'https://github.com/user/repo/blob/main/document.pdf',
        description: 'Invalid: PDF files not supported',
      },
      {
        label: 'Directory URL',
        url: 'https://github.com/user/repo/tree/main/scripts',
        description: 'Invalid: Points to directory, not file',
      },
    ];
    
    return (
      <div className="space-y-6 w-full max-w-4xl">
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Valid GitHub URLs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validUrls.map((item, index) => (
              <div key={index} className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    {item.label}
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveDialog(item.url)}
                  >
                    Test
                  </Button>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                  {item.description}
                </p>
                <code className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-1 rounded break-all">
                  {item.url}
                </code>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
            Invalid GitHub URLs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invalidUrls.map((item, index) => (
              <div key={index} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    {item.label}
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveDialog(item.url)}
                  >
                    Test
                  </Button>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  {item.description}
                </p>
                <code className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-800 px-2 py-1 rounded break-all">
                  {item.url}
                </code>
              </div>
            ))}
          </div>
        </div>
        
        {activeDialog && (
          <ScriptsGitHubDialog
            isOpen={true}
            initialUrl={activeDialog}
            onClose={() => setActiveDialog(null)}
            onImport={(result) => {
              action('script-imported')(result);
              setActiveDialog(null);
            }}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive examples of valid and invalid GitHub URLs showing real-time validation feedback.',
      },
    },
  },
};

// Error handling scenarios
export const ErrorHandlingScenarios: Story = {
  render: () => {
    const [activeError, setActiveError] = useState<string | null>(null);
    
    const errorScenarios = [
      {
        title: 'Repository Not Found',
        description: 'Attempting to access a non-existent repository',
        url: 'https://github.com/nonexistent/repo/blob/main/script.js',
        errorType: 'repository_not_found',
      },
      {
        title: 'File Not Found',
        description: 'Repository exists but file does not',
        url: 'https://github.com/dreamfactory/example/blob/main/missing-file.js',
        errorType: 'file_not_found',
      },
      {
        title: 'Authentication Required',
        description: 'Private repository requiring credentials',
        url: 'https://github.com/private/secret-repo/blob/main/config.js',
        errorType: 'authentication_failed',
      },
      {
        title: 'Rate Limit Exceeded',
        description: 'GitHub API rate limit reached',
        url: 'https://github.com/popular/repo/blob/main/script.js',
        errorType: 'rate_limit_exceeded',
      },
      {
        title: 'Network Error',
        description: 'Connection timeout or network issue',
        url: 'https://github.com/user/repo/blob/main/script.js',
        errorType: 'network_error',
      },
      {
        title: 'Invalid URL Format',
        description: 'Malformed GitHub URL',
        url: 'https://github.com/invalid-url-format',
        errorType: 'invalid_url',
      },
    ];
    
    return (
      <div className="space-y-6 w-full max-w-4xl">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            Error Handling Scenarios
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Test various error conditions and user-friendly error messages.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {errorScenarios.map((scenario, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {scenario.title}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveError(scenario.url)}
                >
                  Simulate
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {scenario.description}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Error Type: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{scenario.errorType}</code>
              </div>
            </div>
          ))}
        </div>
        
        {activeError && (
          <ScriptsGitHubDialog
            isOpen={true}
            initialUrl={activeError}
            onClose={() => setActiveError(null)}
            onImport={(result) => {
              action('script-imported')(result);
              setActiveError(null);
            }}
          />
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive error handling scenarios showing user-friendly error messages and recovery suggestions.',
      },
    },
  },
};

// Accessibility demonstration
export const AccessibilityFeatures: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="space-y-6 w-full max-w-4xl">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4 text-blue-900 dark:text-blue-100">
            Accessibility Features Test
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                Keyboard Navigation
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                • Tab to navigate between form fields and buttons
                • Enter or Space to activate buttons
                • Escape to close dialog
                • Focus visible indicators on all interactive elements
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                Screen Reader Support
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                • Dialog title and description properly announced
                • Form field labels and validation errors
                • Loading state announcements
                • Error message alerts with role="alert"
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">
                WCAG 2.1 AA Compliance
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                • 4.5:1 minimum contrast ratios
                • 44x44px minimum touch targets
                • Focus indicators with 3:1 contrast
                • Proper heading hierarchy
              </p>
            </div>
          </div>
          
          <Button 
            className="mt-4"
            onClick={() => setIsOpen(true)}
            aria-describedby="accessibility-description"
          >
            Test Accessibility Features
          </Button>
          
          <div id="accessibility-description" className="sr-only">
            Opens GitHub import dialog with full accessibility features enabled for testing
          </div>
        </div>
        
        <ScriptsGitHubDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onImport={(result) => {
            action('accessible-import')(result);
            setIsOpen(false);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility testing including keyboard navigation, screen reader support, and WCAG 2.1 AA compliance.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Open dialog
    const testButton = canvas.getByText('Test Accessibility Features');
    await userEvent.click(testButton);
    
    // Test keyboard navigation
    await userEvent.tab(); // Should focus first input
    const urlInput = canvas.getByLabelText('GitHub File URL');
    await expect(urlInput).toHaveFocus();
    
    // Test escape key
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(canvas.queryByText('Import Script from GitHub')).not.toBeInTheDocument();
    });
  },
};

// Dark mode demonstration
export const DarkModeVariants: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="dark">
        <div className="bg-gray-900 p-6 rounded-lg">
          <div className="mb-6">
            <h3 className="text-white text-lg font-medium mb-2">
              Dark Mode Dialog
            </h3>
            <p className="text-gray-300 text-sm">
              All dialog elements adapt to dark mode with proper contrast ratios.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              variant="primary" 
              onClick={() => setIsOpen(true)}
              className="w-full"
            >
              Open Dark Mode Dialog
            </Button>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-800 p-3 rounded">
                <div className="text-gray-300 mb-1">Background</div>
                <div className="text-white">Gray-800</div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-gray-300 mb-1">Panel</div>
                <div className="text-white">Gray-700</div>
              </div>
              <div className="bg-primary-600 p-3 rounded">
                <div className="text-white mb-1">Primary</div>
                <div className="text-white">Primary-600</div>
              </div>
              <div className="bg-red-600 p-3 rounded">
                <div className="text-white mb-1">Error</div>
                <div className="text-white">Red-600</div>
              </div>
            </div>
          </div>
          
          <ScriptsGitHubDialog
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onImport={(result) => {
              action('dark-mode-import')(result);
              setIsOpen(false);
            }}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Dark mode variants maintaining WCAG 2.1 AA contrast ratios in dark themes.',
      },
    },
  },
};

// Integration with other components
export const IntegrationExamples: Story = {
  render: () => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [importedScripts, setImportedScripts] = useState<GitHubScriptResult[]>([]);
    
    const handleImport = (result: GitHubDialogResult) => {
      const scriptResult: GitHubScriptResult = {
        content: result.data,
        fileData: {
          name: result.repoInfo.filePath.split('/').pop() || 'script',
          path: result.repoInfo.filePath,
          sha: Math.random().toString(36).substring(7),
          size: result.data.length,
          download_url: result.repoInfo.originalUrl,
          content: btoa(result.data),
          encoding: 'base64',
          type: 'file',
          url: result.repoInfo.originalUrl,
          git_url: result.repoInfo.originalUrl,
          html_url: result.repoInfo.originalUrl,
        },
        urlParts: result.repoInfo,
      };
      
      setImportedScripts(prev => [...prev, scriptResult]);
      setIsDialogOpen(false);
      action('integration-import')(result);
    };
    
    return (
      <div className="space-y-6 w-full max-w-4xl">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Script Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Import and manage scripts from GitHub repositories
              </p>
            </div>
            <Button 
              variant="primary"
              onClick={() => setIsDialogOpen(true)}
            >
              Import from GitHub
            </Button>
          </div>
          
          {importedScripts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No scripts imported yet</p>
              <p className="text-sm">Click "Import from GitHub" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Imported Scripts ({importedScripts.length})
              </h4>
              {importedScripts.map((script, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {script.fileData.name}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {script.urlParts.owner}/{script.urlParts.repo}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {script.fileData.size} bytes
                      </div>
                      <a
                        href={script.fileData.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        View on GitHub
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                        View Content
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                        <code>{script.content.substring(0, 200)}{script.content.length > 200 ? '...' : ''}</code>
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <ScriptsGitHubDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onImport={handleImport}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Integration example showing how the dialog works within a larger script management interface.',
      },
    },
  },
};

// Real-world workflow demonstration
export const CompleteWorkflowDemo: Story = {
  render: () => {
    const [step, setStep] = useState(1);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedScript, setSelectedScript] = useState<GitHubDialogResult | null>(null);
    
    const steps = [
      {
        number: 1,
        title: 'Open Import Dialog',
        description: 'User clicks import button to open GitHub dialog',
        action: () => setIsDialogOpen(true),
      },
      {
        number: 2,
        title: 'Enter GitHub URL',
        description: 'User enters valid GitHub file URL',
        action: () => {},
      },
      {
        number: 3,
        title: 'Handle Authentication',
        description: 'If private repo, user provides credentials',
        action: () => {},
      },
      {
        number: 4,
        title: 'Import Success',
        description: 'Script content is imported and dialog closes',
        action: () => {},
      },
    ];
    
    const handleImport = (result: GitHubDialogResult) => {
      setSelectedScript(result);
      setIsDialogOpen(false);
      setStep(4);
      action('workflow-complete')(result);
    };
    
    return (
      <div className="space-y-6 w-full max-w-4xl">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4 text-primary-900 dark:text-primary-100">
            Complete GitHub Import Workflow
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {steps.map((stepData) => (
              <div
                key={stepData.number}
                className={`p-4 rounded-lg border ${
                  step >= stepData.number
                    ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                  step >= stepData.number
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {stepData.number}
                </div>
                <h4 className={`font-medium text-sm mb-1 ${
                  step >= stepData.number
                    ? 'text-primary-900 dark:text-primary-100'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {stepData.title}
                </h4>
                <p className={`text-xs ${
                  step >= stepData.number
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {stepData.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => {
                setStep(1);
                setIsDialogOpen(true);
              }}
            >
              Start Import Workflow
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setSelectedScript(null);
              }}
            >
              Reset Demo
            </Button>
          </div>
        </div>
        
        {selectedScript && (
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-6 bg-green-50 dark:bg-green-900/20">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Import Successful!
            </h4>
            <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
              <p><strong>File:</strong> {selectedScript.repoInfo.filePath}</p>
              <p><strong>Repository:</strong> {selectedScript.repoInfo.owner}/{selectedScript.repoInfo.repo}</p>
              <p><strong>Content Length:</strong> {selectedScript.data.length} characters</p>
            </div>
          </div>
        )}
        
        <ScriptsGitHubDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onImport={handleImport}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete end-to-end workflow demonstration showing all steps of the GitHub import process.',
      },
    },
  },
};