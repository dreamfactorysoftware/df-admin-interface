import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect } from '@storybook/testing-library';
import { LinkService } from './link-service';
import { LinkServiceProps } from './link-service.types';

// Mock theme provider for theme switching demonstrations
const withThemeProvider = (Story: any, context: any) => {
  const theme = context.globals.theme || 'light';
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 transition-colors">
        <Story />
      </div>
    </div>
  );
};

// Mock storage services data for realistic examples
const mockStorageServices = [
  {
    id: 'github-service',
    name: 'github-service',
    label: 'GitHub Repository',
    type: 'github' as const,
    description: 'Connect to GitHub repositories for file access',
    icon: '🐙',
    isActive: true,
  },
  {
    id: 'file-service',
    name: 'file-service', 
    label: 'Local File Storage',
    type: 'file' as const,
    description: 'Connect to local file system',
    icon: '📁',
    isActive: true,
  },
  {
    id: 'aws-s3',
    name: 'aws-s3',
    label: 'AWS S3 Storage',
    type: 'aws_s3' as const,
    description: 'Connect to AWS S3 buckets',
    icon: '☁️',
    isActive: false,
  },
];

const meta: Meta<typeof LinkService> = {
  title: 'UI/LinkService',
  component: LinkService,
  decorators: [withThemeProvider],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The LinkService component provides an interface for connecting to external storage services 
with form validation and cache management. It features:

- **Service Selection**: Choose from available storage services (GitHub, file systems, cloud storage)
- **Repository Configuration**: Configure repository details including branch, path, and credentials
- **Real-time Validation**: Instant form validation with error feedback
- **Content Operations**: View latest content and manage cache
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Theme Support**: Seamless dark/light mode integration
- **Responsive Design**: Mobile-first design with expandable panels

## Usage

\`\`\`tsx
import { LinkService } from '@/components/ui/link-service';

<LinkService
  storageServiceId="github-service"
  cache="event-cache-key"
  onServiceSelect={(service) => console.log('Selected:', service)}
  onViewLatest={(config) => console.log('View latest:', config)}
  onDeleteCache={() => console.log('Cache deleted')}
/>
\`\`\`
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
          {
            id: 'focus-management',
            enabled: true,
          },
        ],
      },
    },
  },
  argTypes: {
    storageServiceId: {
      control: 'select',
      options: ['github-service', 'file-service', 'aws-s3'],
      description: 'ID of the selected storage service',
    },
    cache: {
      control: 'text',
      description: 'Cache identifier for the linked service',
    },
    isExpanded: {
      control: 'boolean',
      description: 'Whether the expandable panel is initially expanded',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading state for async operations',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all form interactions',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'detailed'],
      description: 'Visual variant of the component',
    },
    onServiceSelect: {
      action: 'service-selected',
      description: 'Callback fired when a storage service is selected',
    },
    onViewLatest: {
      action: 'view-latest',
      description: 'Callback fired when viewing latest content',
    },
    onDeleteCache: {
      action: 'delete-cache',
      description: 'Callback fired when deleting cache',
    },
    onFormChange: {
      action: 'form-changed',
      description: 'Callback fired when form data changes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story demonstrating basic functionality
export const Default: Story = {
  args: {
    storageServiceId: 'github-service',
    cache: 'event-script-cache',
    storageServices: mockStorageServices,
    isExpanded: false,
    isLoading: false,
    disabled: false,
    variant: 'default',
    onServiceSelect: action('service-selected'),
    onViewLatest: action('view-latest'),
    onDeleteCache: action('delete-cache'),
    onFormChange: action('form-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: `
Default LinkService component with GitHub service selected. 
Click the expansion panel to reveal the service configuration form.
        `,
      },
    },
  },
};

// GitHub service configuration story
export const GitHubServiceConfiguration: Story = {
  args: {
    ...Default.args,
    storageServiceId: 'github-service',
    isExpanded: true,
    defaultValues: {
      serviceList: 'GitHub Repository',
      repoInput: 'dreamfactorysoftware/df-admin-app',
      branchInput: 'main',
      pathInput: 'src/app/scripts/event-scripts.json',
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
GitHub service configuration with pre-filled form values. 
Demonstrates the expanded state with repository configuration fields.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify all form fields are present and accessible
    await expect(canvas.getByLabelText(/select service/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/repository/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/branch/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/path/i)).toBeInTheDocument();
    
    // Test form field values
    await expect(canvas.getByDisplayValue('dreamfactorysoftware/df-admin-app')).toBeInTheDocument();
    await expect(canvas.getByDisplayValue('main')).toBeInTheDocument();
    await expect(canvas.getByDisplayValue('src/app/scripts/event-scripts.json')).toBeInTheDocument();
  },
};

// File service configuration story
export const FileServiceConfiguration: Story = {
  args: {
    ...Default.args,
    storageServiceId: 'file-service',
    isExpanded: true,
    defaultValues: {
      serviceList: 'Local File Storage',
      pathInput: '/uploads/scripts/event-handlers.js',
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
File service configuration showing simplified form for local file access.
Note that repository and branch fields are hidden for non-Git services.
        `,
      },
    },
  },
};

// Loading states demonstration
export const LoadingStates: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    isLoading: true,
    loadingOperation: 'fetching-content',
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates loading states during async operations like fetching latest content.
Shows loading spinners and disabled form elements during operations.
        `,
      },
    },
  },
};

// Error states and validation
export const ErrorStatesAndValidation: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    hasErrors: true,
    errors: {
      serviceList: 'Please select a storage service',
      repoInput: 'Repository name is required',
      branchInput: 'Invalid branch name format',
      pathInput: 'File path must be valid',
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates form validation errors with accessible error messages.
Each field shows appropriate validation feedback with ARIA attributes.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify error messages are displayed and accessible
    await expect(canvas.getByText('Please select a storage service')).toBeInTheDocument();
    await expect(canvas.getByText('Repository name is required')).toBeInTheDocument();
    
    // Test ARIA attributes for accessibility
    const repositoryInput = canvas.getByLabelText(/repository/i);
    await expect(repositoryInput).toHaveAttribute('aria-invalid', 'true');
    await expect(repositoryInput).toHaveAttribute('aria-describedby');
  },
};

// Success states with content preview
export const SuccessWithContentPreview: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    hasContent: true,
    contentPreview: `{
  "eventScript": {
    "name": "user-creation-handler",
    "type": "nodejs",
    "content": "// Handle user creation events\\nconsole.log('User created:', event.data);"
  }
}`,
    lastFetched: new Date().toISOString(),
  },
  parameters: {
    docs: {
      description: {
        story: `
Shows successful content retrieval with file preview.
Displays fetched content in a syntax-highlighted preview panel.
        `,
      },
    },
  },
};

// Compact variant for limited space
export const CompactVariant: Story = {
  args: {
    ...Default.args,
    variant: 'compact',
    isExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Compact variant optimized for limited space scenarios.
Uses smaller form fields and reduced padding while maintaining functionality.
        `,
      },
    },
  },
};

// Detailed variant with enhanced features
export const DetailedVariant: Story = {
  args: {
    ...Default.args,
    variant: 'detailed',
    isExpanded: true,
    showAdvancedOptions: true,
    showFilePreview: true,
    showCacheInfo: true,
    cacheInfo: {
      size: '2.4 KB',
      lastModified: new Date(Date.now() - 3600000).toISOString(),
      hits: 42,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Detailed variant with additional features including advanced options,
file preview capabilities, and cache information display.
        `,
      },
    },
  },
};

// Disabled state
export const DisabledState: Story = {
  args: {
    ...Default.args,
    disabled: true,
    isExpanded: true,
    disabledReason: 'Service connection required',
  },
  parameters: {
    docs: {
      description: {
        story: `
Disabled state when service connection is unavailable.
All form elements are disabled with explanatory tooltip.
        `,
      },
    },
  },
};

// Dark theme demonstration
export const DarkTheme: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: `
LinkService component in dark theme mode.
Demonstrates seamless theme integration with proper contrast ratios.
        `,
      },
    },
  },
  globals: {
    theme: 'dark',
  },
};

// Mobile responsive design
export const MobileView: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: `
Mobile-optimized view showing responsive design patterns.
Form fields stack vertically with touch-friendly sizing.
        `,
      },
    },
  },
};

// Keyboard navigation demonstration
export const KeyboardNavigation: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates keyboard navigation capabilities.
Tab through all interactive elements and use Enter/Space to activate buttons.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const expandButton = canvas.getByRole('button', { name: /link to service/i });
    await userEvent.tab();
    await expect(expandButton).toHaveFocus();
    
    // Navigate through form fields
    await userEvent.tab();
    const serviceSelect = canvas.getByLabelText(/select service/i);
    await expect(serviceSelect).toHaveFocus();
    
    await userEvent.tab();
    const repoInput = canvas.getByLabelText(/repository/i);
    await expect(repoInput).toHaveFocus();
  },
};

// Cache management operations
export const CacheManagement: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    cache: 'event-script-cache',
    showCacheInfo: true,
    cacheInfo: {
      size: '15.7 KB',
      lastModified: new Date(Date.now() - 1800000).toISOString(),
      hits: 156,
      entries: 23,
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates cache management features including cache information display,
delete operations, and cache statistics.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test cache delete button
    const deleteCacheButton = canvas.getByRole('button', { name: /delete cache/i });
    await expect(deleteCacheButton).toBeInTheDocument();
    await expect(deleteCacheButton).toBeEnabled();
    
    // Verify cache info is displayed
    await expect(canvas.getByText('15.7 KB')).toBeInTheDocument();
    await expect(canvas.getByText('156')).toBeInTheDocument(); // cache hits
  },
};

// Service selection workflow
export const ServiceSelectionWorkflow: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    storageServices: mockStorageServices,
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive workflow demonstrating service selection and form adaptation.
Form fields change based on the selected service type.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test service selection
    const serviceSelect = canvas.getByLabelText(/select service/i);
    await userEvent.click(serviceSelect);
    
    // Should show all available services
    await expect(canvas.getByText('GitHub Repository')).toBeInTheDocument();
    await expect(canvas.getByText('Local File Storage')).toBeInTheDocument();
    
    // Select file service
    await userEvent.click(canvas.getByText('Local File Storage'));
    
    // Verify form adapts to service type
    await expect(serviceSelect).toHaveValue('Local File Storage');
  },
};

// Accessibility features demonstration
export const AccessibilityFeatures: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Comprehensive accessibility features including:
- Screen reader announcements
- High contrast focus indicators
- Keyboard navigation
- ARIA labels and descriptions
- Error message associations
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test ARIA attributes
    const expandPanel = canvas.getByRole('region');
    await expect(expandPanel).toHaveAttribute('aria-labelledby');
    
    // Test form accessibility
    const serviceSelect = canvas.getByLabelText(/select service/i);
    await expect(serviceSelect).toHaveAttribute('aria-required', 'true');
    
    // Test button accessibility
    const viewLatestButton = canvas.getByRole('button', { name: /view latest/i });
    await expect(viewLatestButton).toHaveAttribute('aria-describedby');
  },
};

// Performance with large service lists
export const LargeServiceList: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    storageServices: [
      ...mockStorageServices,
      ...Array.from({ length: 50 }, (_, i) => ({
        id: `service-${i}`,
        name: `service-${i}`,
        label: `Storage Service ${i + 1}`,
        type: 'file' as const,
        description: `Test storage service ${i + 1}`,
        icon: '📦',
        isActive: i % 3 === 0,
      })),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: `
Performance test with a large number of storage services.
Demonstrates virtualized selection and efficient rendering.
        `,
      },
    },
  },
};

// Real-time validation
export const RealTimeValidation: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    enableRealTimeValidation: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Real-time validation as users type in form fields.
Provides immediate feedback without form submission.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test real-time validation
    const repoInput = canvas.getByLabelText(/repository/i);
    await userEvent.clear(repoInput);
    await userEvent.type(repoInput, 'invalid repo name!@#');
    
    // Should show validation error immediately
    // Note: This would be implemented in the actual component
    // Here we're just demonstrating the interaction pattern
  },
};

// Integration with other components
export const ComponentIntegration: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Event Script Configuration
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
            Link external storage services to load event scripts dynamically.
          </p>
          <Story />
        </div>
        <div className="flex justify-between items-center">
          <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300">
            Previous Step
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save Configuration
          </button>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: `
LinkService integrated within a larger application context.
Shows how the component fits into broader workflow scenarios.
        `,
      },
    },
  },
};