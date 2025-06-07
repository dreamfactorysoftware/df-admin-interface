import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { useState } from 'react';
import { SWRConfig } from 'swr';

import { LinkService } from './link-service';
import type { LinkServiceProps, StorageService } from './link-service.types';

// Mock theme provider for dark mode testing
const ThemeProvider = ({ children, theme = 'light' }: { children: React.ReactNode; theme?: 'light' | 'dark' }) => (
  <div className={theme === 'dark' ? 'dark' : ''} data-theme={theme}>
    <div className={theme === 'dark' ? 'bg-gray-900 text-white min-h-screen p-8' : 'bg-white text-gray-900 min-h-screen p-8'}>
      {children}
    </div>
  </div>
);

// Comprehensive mock storage services for realistic demonstrations
const mockStorageServices: StorageService[] = [
  {
    id: 1,
    name: 'github_primary',
    label: 'GitHub (Primary)',
    description: 'Primary GitHub organization repository access',
    isActive: true,
    type: 'github',
    mutable: true,
    deletable: true,
    createdDate: '2024-01-15T10:00:00Z',
    lastModifiedDate: '2024-03-10T14:30:00Z',
    createdById: 1,
    lastModifiedById: 1,
    config: {
      token: 'ghp_************************************',
      organization: 'dreamfactory-software',
      defaultBranch: 'main',
      apiUrl: 'https://api.github.com',
      timeout: 30000,
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 2,
    name: 'github_secondary',
    label: 'GitHub (Development)',
    description: 'Development team GitHub repositories',
    isActive: true,
    type: 'github',
    mutable: true,
    deletable: true,
    createdDate: '2024-02-01T09:30:00Z',
    lastModifiedDate: '2024-03-12T11:15:00Z',
    createdById: 2,
    lastModifiedById: 2,
    config: {
      token: 'ghp_************************************',
      organization: 'df-dev-team',
      defaultBranch: 'develop',
      apiUrl: 'https://api.github.com',
      timeout: 30000,
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 3,
    name: 'gitlab_enterprise',
    label: 'GitLab Enterprise',
    description: 'Enterprise GitLab instance for private repositories',
    isActive: true,
    type: 'gitlab',
    mutable: true,
    deletable: true,
    createdDate: '2024-01-20T16:45:00Z',
    lastModifiedDate: '2024-03-08T13:20:00Z',
    createdById: 1,
    lastModifiedById: 3,
    config: {
      token: 'glpat-****************************',
      baseUrl: 'https://gitlab.company.com',
      defaultBranch: 'main',
      timeout: 45000,
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 4,
    name: 'aws_s3_documents',
    label: 'AWS S3 (Documents)',
    description: 'Amazon S3 bucket for document storage',
    isActive: true,
    type: 'file',
    mutable: true,
    deletable: true,
    createdDate: '2024-01-10T08:00:00Z',
    lastModifiedDate: '2024-03-01T10:15:00Z',
    createdById: 1,
    lastModifiedById: 1,
    config: {
      bucket: 'df-documents-prod',
      region: 'us-east-1',
      accessKeyId: 'AKIA**********************',
      secretAccessKey: '****************************************',
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 5,
    name: 'ftp_legacy',
    label: 'FTP (Legacy Files)',
    description: 'Legacy FTP server for historical files',
    isActive: false,
    type: 'file',
    mutable: true,
    deletable: true,
    createdDate: '2023-12-01T12:00:00Z',
    lastModifiedDate: '2024-02-15T16:30:00Z',
    createdById: 1,
    lastModifiedById: 2,
    config: {
      host: 'legacy.ftp.company.com',
      port: 21,
      username: 'ftpuser',
      password: '****************',
      passive: true,
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
];

// Mock SWR data fetcher for realistic async behavior
const mockFetcher = async (url: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (url.includes('storage-services')) {
    // Filter to only return GitHub-type services for LinkService
    return mockStorageServices.filter(service => service.type === 'github');
  }
  
  throw new Error('Unknown endpoint');
};

// SWR provider wrapper for stories
const SWRWrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig 
    value={{
      fetcher: mockFetcher,
      dedupingInterval: 0, // Disable deduping for testing
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }}
  >
    {children}
  </SWRConfig>
);

const meta = {
  title: 'UI Components/LinkService',
  component: LinkService,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# LinkService Component

A comprehensive React component for connecting to external storage services with form validation
and cache management. Migrated from Angular df-link-service component to modern React/Next.js patterns.

## Features

- ✅ **WCAG 2.1 AA Compliant**: Full accessibility support with ARIA labeling and keyboard navigation
- ✅ **Real-time Validation**: React Hook Form integration with Zod validation under 100ms response
- ✅ **Intelligent Caching**: SWR/React Query for optimal data fetching and synchronization
- ✅ **Dark Mode Support**: Complete theme compatibility with Tailwind CSS utilities
- ✅ **Expandable Interface**: Headless UI Disclosure component for space-efficient design
- ✅ **Service Integration**: Support for GitHub, GitLab, and other source control services
- ✅ **Error Handling**: Comprehensive error states with user-friendly messaging
- ✅ **Cache Management**: Built-in cache operations with progress indicators

## Component States

- **Loading**: Service discovery and content fetching states
- **Success**: Successful service connection and file content retrieval
- **Error**: Network errors, validation failures, and service unavailability
- **Empty**: No services available or initial state

## Accessibility Features

- **Screen Reader Support**: ARIA live regions for dynamic content updates
- **Keyboard Navigation**: Full keyboard accessibility with proper focus management
- **High Contrast**: WCAG AA compliant color ratios for all text and interactive elements
- **Touch Targets**: Minimum 44x44px touch targets for mobile accessibility
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <SWRWrapper>
        <ThemeProvider>
          <Story />
        </ThemeProvider>
      </SWRWrapper>
    ),
  ],
  argTypes: {
    storageServiceId: {
      control: 'select',
      options: ['github_primary', 'github_secondary', 'gitlab_enterprise'],
      description: 'Selected storage service identifier',
    },
    cache: {
      control: 'text',
      description: 'Cache key for service content caching',
    },
    onContentChange: {
      action: 'content-changed',
      description: 'Callback when file content is updated',
    },
    onStoragePathChange: {
      action: 'storage-path-changed', 
      description: 'Callback when storage path is modified',
    },
    onError: {
      action: 'error-occurred',
      description: 'Callback when an error occurs',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for styling',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessibility label for the component',
    },
  },
} satisfies Meta<typeof LinkService>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// PRIMARY STORY EXAMPLES
// ============================================================================

/**
 * Default LinkService component showing standard GitHub service connection
 * with expandable panel and form validation.
 */
export const Default: Story = {
  args: {
    storageServiceId: 'github_primary',
    cache: 'script_cache_12345',
    onContentChange: action('content-changed'),
    onStoragePathChange: action('storage-path-changed'),
    onError: action('error-occurred'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default LinkService with GitHub service selection, form validation, and cache management capabilities.',
      },
    },
  },
};

/**
 * Component in expanded state showing all form fields and action buttons
 * for immediate interaction without requiring user expansion.
 */
export const Expanded: Story = {
  args: {
    ...Default.args,
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'LinkService in expanded state showing all form fields immediately accessible to users.',
      },
    },
  },
};

/**
 * Controlled component with external state management demonstrating
 * integration with parent form components and state synchronization.
 */
export const Controlled: Story = {
  render: (args) => {
    const [content, setContent] = useState('');
    const [storagePath, setStoragePath] = useState('');
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            External State
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-medium">Storage Path:</span>
              <p className="text-gray-600 dark:text-gray-400 break-all">
                {storagePath || 'Not set'}
              </p>
            </div>
            <div>
              <span className="font-medium">Content Length:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {content.length} characters
              </p>
            </div>
            <div>
              <span className="font-medium">Panel State:</span>
              <p className="text-gray-600 dark:text-gray-400">
                {expanded ? 'Expanded' : 'Collapsed'}
              </p>
            </div>
          </div>
        </div>
        
        <LinkService
          {...args}
          content={{ value: content, onChange: setContent }}
          storagePath={{ value: storagePath, onChange: setStoragePath }}
          expanded={expanded}
          onToggleExpansion={setExpanded}
          onContentChange={setContent}
          onStoragePathChange={setStoragePath}
        />
      </div>
    );
  },
  args: {
    storageServiceId: 'github_primary',
    cache: 'controlled_cache_67890',
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled LinkService with external state management showing integration patterns with parent components.',
      },
    },
  },
};

// ============================================================================
// SERVICE CONFIGURATION EXAMPLES
// ============================================================================

/**
 * Different storage service configurations demonstrating 
 * various source control and file service integrations.
 */
export const ServiceConfigurations: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">GitHub Primary Organization</h3>
        <LinkService
          storageServiceId="github_primary"
          cache="github_cache_1"
          defaultExpanded={true}
          onContentChange={action('github-primary-content')}
          onStoragePathChange={action('github-primary-path')}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">GitHub Development Team</h3>
        <LinkService
          storageServiceId="github_secondary"
          cache="github_cache_2"
          defaultExpanded={true}
          onContentChange={action('github-secondary-content')}
          onStoragePathChange={action('github-secondary-path')}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">GitLab Enterprise</h3>
        <LinkService
          storageServiceId="gitlab_enterprise"
          cache="gitlab_cache_1"
          defaultExpanded={true}
          onContentChange={action('gitlab-content')}
          onStoragePathChange={action('gitlab-path')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple service configurations showing different storage providers and their unique characteristics.',
      },
    },
  },
};

// ============================================================================
// FORM VALIDATION EXAMPLES
// ============================================================================

/**
 * Form validation scenarios demonstrating real-time validation,
 * error states, and user feedback patterns.
 */
export const FormValidation: Story = {
  render: () => {
    const [validationDemo, setValidationDemo] = useState({
      scenario: 'valid',
      repository: 'dreamfactory-admin',
      branch: 'main',
      path: 'src/components/LinkService.tsx',
    });

    const scenarios = {
      valid: {
        repository: 'dreamfactory-admin',
        branch: 'main', 
        path: 'src/components/LinkService.tsx',
      },
      emptyFields: {
        repository: '',
        branch: '',
        path: '',
      },
      invalidRepository: {
        repository: 'invalid@repo#name',
        branch: 'main',
        path: 'src/file.js',
      },
      longPath: {
        repository: 'my-repo',
        branch: 'feature/very-long-branch-name-that-exceeds-normal-limits',
        path: 'src/very/deep/directory/structure/with/many/nested/folders/and/a/very/long/filename/that/might/cause/issues.js',
      },
    };

    return (
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
            Validation Scenarios
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => setValidationDemo({ scenario: key, ...scenario })}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  validationDemo.scenario === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-700'
                }`}
              >
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <LinkService
          storageServiceId="github_primary"
          cache="validation_cache"
          defaultExpanded={true}
          defaultValues={{
            serviceList: 'GitHub (Primary)',
            repoInput: validationDemo.repository,
            branchInput: validationDemo.branch,
            pathInput: validationDemo.path,
          }}
          enableRealTimeValidation={true}
          validationDelay={100}
          onContentChange={action('validation-content')}
          onStoragePathChange={action('validation-path')}
          onError={action('validation-error')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-time form validation with different error scenarios and user feedback patterns.',
      },
    },
  },
};

// ============================================================================
// ACCESSIBILITY EXAMPLES  
// ============================================================================

/**
 * Comprehensive accessibility demonstration including keyboard navigation,
 * screen reader support, and ARIA features.
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
          ♿ Accessibility Features
        </h3>
        <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
          <li>• <kbd className="px-1 py-0.5 bg-green-200 dark:bg-green-800 rounded">Tab</kbd> to navigate between form fields</li>
          <li>• <kbd className="px-1 py-0.5 bg-green-200 dark:bg-green-800 rounded">Space</kbd> or <kbd className="px-1 py-0.5 bg-green-200 dark:bg-green-800 rounded">Enter</kbd> to expand/collapse panel</li>
          <li>• <kbd className="px-1 py-0.5 bg-green-200 dark:bg-green-800 rounded">Enter</kbd> to submit form when focused on submit button</li>
          <li>• Screen reader announcements for loading states and errors</li>
          <li>• ARIA live regions for dynamic content updates</li>
          <li>• High contrast focus indicators (2px outline)</li>
        </ul>
      </div>

      <LinkService
        storageServiceId="github_primary"
        cache="accessibility_cache"
        aria-label="GitHub repository file linking service with full keyboard and screen reader support"
        announcements={{
          onServiceSelect: 'Storage service selected, form fields updated',
          onContentLoaded: 'File content loaded successfully from repository',
          onCacheCleared: 'Service cache cleared, fresh data will be fetched',
          onError: 'An error occurred while processing your request',
        }}
        testIds={{
          container: 'link-service-container',
          form: 'link-service-form',
          serviceSelect: 'service-select-field',
          repositoryInput: 'repository-input-field',
          branchInput: 'branch-input-field',
          pathInput: 'path-input-field',
          viewLatestButton: 'view-latest-button',
          deleteCacheButton: 'delete-cache-button',
        }}
        onContentChange={action('accessible-content')}
        onStoragePathChange={action('accessible-path')}
        onError={action('accessible-error')}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility features including keyboard navigation, screen reader support, and ARIA compliance.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const expandButton = canvas.getByRole('button', { name: /link to service/i });
    await userEvent.tab();
    expect(expandButton).toHaveFocus();
    
    // Test panel expansion with keyboard
    await userEvent.keyboard(' ');
    await waitFor(() => {
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
    
    // Test form field navigation
    await userEvent.tab();
    const serviceSelect = canvas.getByRole('combobox', { name: /select service/i });
    expect(serviceSelect).toHaveFocus();
  },
};

// ============================================================================
// THEME AND VISUAL EXAMPLES
// ============================================================================

/**
 * Dark mode demonstration showing complete theme compatibility
 * and visual consistency across all component states.
 */
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <SWRWrapper>
        <ThemeProvider theme="dark">
          <Story />
        </ThemeProvider>
      </SWRWrapper>
    ),
  ],
  args: {
    storageServiceId: 'github_primary',
    cache: 'dark_mode_cache',
    defaultExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'LinkService in dark mode showing complete theme compatibility and visual consistency.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
};

/**
 * Side-by-side theme comparison showing light and dark mode variants
 * for design system documentation and consistency validation.
 */
export const ThemeComparison: Story = {
  render: (args) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Light Mode</h3>
        <SWRWrapper>
          <ThemeProvider theme="light">
            <LinkService
              {...args}
              storageServiceId="github_primary"
              cache="light_theme_cache"
              defaultExpanded={true}
            />
          </ThemeProvider>
        </SWRWrapper>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Dark Mode</h3>
        <SWRWrapper>
          <ThemeProvider theme="dark">
            <LinkService
              {...args}
              storageServiceId="github_primary"
              cache="dark_theme_cache"
              defaultExpanded={true}
            />
          </ThemeProvider>
        </SWRWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of light and dark themes for design system consistency validation.',
      },
    },
  },
};

// ============================================================================
// STATE EXAMPLES
// ============================================================================

/**
 * Loading state demonstration showing various async operation indicators
 * and user feedback during service discovery and content fetching.
 */
export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Discovery Loading</h3>
        <SWRConfig value={{ fetcher: () => new Promise(() => {}) }}>
          <LinkService
            storageServiceId="github_primary"
            cache="loading_cache_1"
            onContentChange={action('loading-content')}
            onStoragePathChange={action('loading-path')}
          />
        </SWRConfig>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Content Fetching (Simulated)</h3>
        <LinkService
          storageServiceId="github_primary"
          cache="loading_cache_2"
          defaultExpanded={true}
          onContentChange={action('fetching-content')}
          onStoragePathChange={action('fetching-path')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Various loading states during service discovery and content fetching operations.',
      },
    },
  },
};

/**
 * Error state scenarios including network errors, validation failures,
 * and service unavailability with appropriate user messaging.
 */
export const ErrorStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Discovery Error</h3>
        <SWRConfig value={{ 
          fetcher: () => Promise.reject(new Error('Failed to load storage services')) 
        }}>
          <LinkService
            storageServiceId="github_primary"
            cache="error_cache_1"
            onContentChange={action('error-content')}
            onStoragePathChange={action('error-path')}
            onError={action('service-error')}
          />
        </SWRConfig>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">No GitHub Services Available</h3>
        <SWRConfig value={{ 
          fetcher: () => Promise.resolve(mockStorageServices.filter(s => s.type === 'file'))
        }}>
          <LinkService
            storageServiceId="aws_s3_documents"
            cache="error_cache_2"
            onContentChange={action('no-github-content')}
            onStoragePathChange={action('no-github-path')}
          />
        </SWRConfig>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error states including service discovery failures and incompatible service types.',
      },
    },
  },
};

// ============================================================================
// INTERACTION EXAMPLES
// ============================================================================

/**
 * Cache management operations demonstrating cache clearing,
 * progress indicators, and state synchronization.
 */
export const CacheManagement: Story = {
  render: () => {
    const [cacheOperations, setCacheOperations] = useState<Record<string, boolean>>({});

    const handleCacheOperation = (cacheKey: string, operation: string) => {
      setCacheOperations(prev => ({ ...prev, [cacheKey]: true }));
      
      // Simulate async operation
      setTimeout(() => {
        setCacheOperations(prev => ({ ...prev, [cacheKey]: false }));
        action(`cache-${operation}`)(cacheKey);
      }, 2000);
    };

    return (
      <div className="space-y-6">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Cache Management Features
          </h3>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Cache keys identify stored file content for quick retrieval</li>
            <li>• Delete cache operations force fresh content fetching</li>
            <li>• Progress indicators show operation status</li>
            <li>• Cache state synchronization across components</li>
          </ul>
        </div>

        <div className="space-y-4">
          {['cache_key_12345', 'cache_key_67890', 'cache_key_abcdef'].map((cacheKey, index) => (
            <div key={cacheKey}>
              <h4 className="text-sm font-medium mb-2">Service {index + 1} - Cache: {cacheKey}</h4>
              <LinkService
                storageServiceId="github_primary"
                cache={cacheKey}
                defaultExpanded={true}
                onContentChange={action(`service-${index + 1}-content`)}
                onStoragePathChange={action(`service-${index + 1}-path`)}
                onDeleteCache={() => handleCacheOperation(cacheKey, 'delete')}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Cache management operations with progress indicators and state synchronization.',
      },
    },
  },
};

/**
 * Interactive workflow demonstration showing complete user journey
 * from service selection to file content retrieval.
 */
export const CompleteWorkflow: Story = {
  render: () => {
    const [workflowState, setWorkflowState] = useState({
      step: 1,
      selectedService: '',
      repository: '',
      branch: '',
      path: '',
      content: '',
      storagePath: '',
    });

    const steps = [
      'Expand Service Panel',
      'Select Storage Service', 
      'Enter Repository Details',
      'Specify File Path',
      'Fetch Content',
      'Review Results',
    ];

    return (
      <div className="space-y-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-3">
            Workflow Progress
          </h3>
          <div className="flex flex-wrap gap-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  index + 1 <= workflowState.step
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                {index + 1}. {step}
              </div>
            ))}
          </div>
        </div>

        <LinkService
          storageServiceId="github_primary"
          cache="workflow_cache"
          onContentChange={(content) => {
            setWorkflowState(prev => ({ ...prev, content, step: Math.max(prev.step, 6) }));
            action('workflow-content')(content);
          }}
          onStoragePathChange={(path) => {
            setWorkflowState(prev => ({ ...prev, storagePath: path, step: Math.max(prev.step, 5) }));
            action('workflow-path')(path);
          }}
          onToggleExpansion={(expanded) => {
            if (expanded) {
              setWorkflowState(prev => ({ ...prev, step: Math.max(prev.step, 2) }));
            }
          }}
        />

        {workflowState.content && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Workflow Complete
            </h4>
            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <div><strong>Storage Path:</strong> {workflowState.storagePath}</div>
              <div><strong>Content Length:</strong> {workflowState.content.length} characters</div>
            </div>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete user workflow from service selection to content retrieval with progress tracking.',
      },
    },
  },
};

// ============================================================================
// RESPONSIVE DESIGN EXAMPLES
// ============================================================================

/**
 * Responsive design demonstration showing component behavior
 * across different screen sizes and device orientations.
 */
export const ResponsiveDesign: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile View (320px)</h3>
        <div className="w-80 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <LinkService
            storageServiceId="github_primary"
            cache="mobile_cache"
            defaultExpanded={true}
            layout="vertical"
            fieldSpacing="compact"
            actionSize="sm"
            onContentChange={action('mobile-content')}
            onStoragePathChange={action('mobile-path')}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet View (768px)</h3>
        <div className="max-w-3xl border border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <LinkService
            storageServiceId="github_primary"
            cache="tablet_cache"
            defaultExpanded={true}
            layout="horizontal"
            fieldSpacing="normal"
            actionSize="md"
            onContentChange={action('tablet-content')}
            onStoragePathChange={action('tablet-path')}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop View (1200px+)</h3>
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <LinkService
            storageServiceId="github_primary"
            cache="desktop_cache"
            defaultExpanded={true}
            layout="inline"
            fieldSpacing="relaxed"
            actionSize="lg"
            onContentChange={action('desktop-content')}
            onStoragePathChange={action('desktop-path')}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive design patterns showing optimal layouts for different screen sizes and device types.',
      },
    },
  },
};

// ============================================================================
// INTEGRATION EXAMPLES
// ============================================================================

/**
 * Custom styling and branding demonstration showing how to customize
 * the component appearance while maintaining accessibility.
 */
export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Corporate Branding</h3>
        <LinkService
          storageServiceId="github_primary"
          cache="branded_cache"
          defaultExpanded={true}
          className="border-2 border-blue-500 rounded-xl shadow-lg"
          title="🔗 Enterprise Repository Connection"
          description="Connect to your organization's GitHub repositories for script management"
          actionVariant="primary"
          fieldSpacing="relaxed"
          onContentChange={action('branded-content')}
          onStoragePathChange={action('branded-path')}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Minimal Design</h3>
        <LinkService
          storageServiceId="github_primary"
          cache="minimal_cache"
          defaultExpanded={true}
          className="border border-gray-200 dark:border-gray-700 rounded-md"
          actionVariant="ghost"
          fieldSpacing="compact"
          hideActions={false}
          onContentChange={action('minimal-content')}
          onStoragePathChange={action('minimal-path')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom styling examples showing branding and design system integration possibilities.',
      },
    },
  },
};

/**
 * Performance optimization demonstration showing the component
 * under various load conditions and optimization strategies.
 */
export const PerformanceOptimized: Story = {
  render: () => {
    const [performanceMetrics, setPerformanceMetrics] = useState({
      renderTime: 0,
      validationTime: 0,
      cacheHitRatio: 0.85,
    });

    return (
      <div className="space-y-6">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-3">
            ⚡ Performance Metrics
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-purple-700 dark:text-purple-300">Render Time:</span>
              <p className="font-mono text-purple-600 dark:text-purple-400">&lt;16ms</p>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">Validation:</span>
              <p className="font-mono text-purple-600 dark:text-purple-400">&lt;100ms</p>
            </div>
            <div>
              <span className="text-purple-700 dark:text-purple-300">Cache Hit:</span>
              <p className="font-mono text-purple-600 dark:text-purple-400">85%</p>
            </div>
          </div>
        </div>

        <LinkService
          storageServiceId="github_primary"
          cache="performance_cache"
          defaultExpanded={true}
          enableRealTimeValidation={true}
          validationDelay={50} // Optimized for performance
          cacheConfig={{
            enabled: true,
            ttl: 300000, // 5 minutes
            maxSize: 1000,
            onInvalidate: action('cache-invalidated'),
            onClear: action('cache-cleared'),
            status: {
              hitRatio: performanceMetrics.cacheHitRatio,
              size: 1024 * 256, // 256KB
              lastUpdated: new Date(),
            },
          }}
          onContentChange={action('performance-content')}
          onStoragePathChange={action('performance-path')}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance-optimized configuration with metrics monitoring and cache management.',
      },
    },
  },
};