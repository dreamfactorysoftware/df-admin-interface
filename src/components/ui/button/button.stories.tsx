import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Settings, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Home,
  Database,
  Users
} from 'lucide-react';
import { useState } from 'react';

import { Button, IconButton, ButtonGroup, LoadingButton } from './button';

/**
 * # Button Component System
 * 
 * A comprehensive button component system for the DreamFactory Admin Interface,
 * built with React 19, Tailwind CSS 4.1+, and full WCAG 2.1 AA accessibility compliance.
 * 
 * ## Features
 * 
 * - **Complete Variant Coverage**: Primary, secondary, outline, ghost, destructive, and link variants
 * - **Size Flexibility**: From compact (sm) to extra-large (xl) with proper touch targets
 * - **Accessibility First**: WCAG 2.1 AA compliant with minimum 4.5:1 contrast ratios
 * - **Loading States**: Integrated loading spinner with proper screen reader announcements
 * - **Icon Support**: Left and right icon positioning with automatic sizing
 * - **Keyboard Navigation**: Full keyboard support with focus-visible indicators
 * - **Dark Mode**: Seamless light/dark theme transitions
 * - **Touch Optimized**: Minimum 44x44px touch targets for mobile users
 * 
 * ## Migration Notes
 * 
 * Replaces Angular Material buttons with modern React patterns:
 * - `mat-button` → `Button variant="ghost"`
 * - `mat-raised-button` → `Button variant="primary"`
 * - `mat-stroked-button` → `Button variant="outline"`
 * - `mat-flat-button` → `Button variant="secondary"`
 * - `mat-icon-button` → `IconButton`
 * 
 * ## Technical Implementation
 * 
 * - Built with `class-variance-authority` for type-safe variant management
 * - Uses React 19's enhanced concurrent features for optimal performance
 * - Leverages Tailwind CSS 4.1+ for 5x faster builds and utility-first styling
 * - Implements proper ARIA attributes and screen reader support
 * - Supports server-side rendering with Next.js 15.1+
 */
const meta = {
  title: 'UI/Button System',
  component: Button,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The Button component system provides a comprehensive set of interactive button variants
designed for the DreamFactory Admin Interface. Built with accessibility-first principles
and modern React patterns, these components replace all Angular Material button types
while providing enhanced functionality and better performance.

## Design System Integration

All button variants implement the DreamFactory design system with WCAG 2.1 AA
compliance, ensuring minimum 4.5:1 contrast ratios for normal text and 3:1 for 
UI components. The system supports both light and dark themes with automatic
color adjustments.

## Performance Characteristics

- Zero-config accessibility with built-in ARIA support
- Optimized for Turbopack builds (700% faster than webpack)
- Minimal bundle impact with tree-shaking support
- React 19 concurrent rendering compatibility
- SSR-ready for Next.js deployment
        `
      }
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'gray', value: '#f8fafc' }
      ]
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      description: 'Visual style variant of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' }
      }
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon-sm', 'icon-md', 'icon-lg'],
      description: 'Size variant affecting padding and typography',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' }
      }
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables interaction',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' }
      }
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button and reduces opacity',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' }
      }
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' }
      }
    },
    children: {
      control: 'text',
      description: 'Button content - text or JSX elements',
      table: {
        type: { summary: 'React.ReactNode' }
      }
    },
    onClick: { 
      action: 'clicked',
      description: 'Click event handler'
    }
  },
  args: {
    onClick: fn(),
    children: 'Button'
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Button Stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button'
  }
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button'
  }
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Item'
  }
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button'
  }
};

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="xl">Extra Large</Button>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        All sizes maintain WCAG 2.1 AA minimum 44x44px touch targets
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Button sizes are optimized for different contexts while maintaining accessibility.
All variants ensure minimum 44x44px touch targets as required by WCAG 2.1 AA.

- **Small (sm)**: Compact interfaces, secondary actions
- **Medium (md)**: Default size for most contexts  
- **Large (lg)**: Prominent actions, mobile-first designs
- **Extra Large (xl)**: Hero actions, call-to-action buttons
        `
      }
    }
  }
};

// States
export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Interactive States</h3>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button loading disabled>Loading + Disabled</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Variant States</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['primary', 'secondary', 'outline', 'ghost'].map((variant) => (
            <div key={variant} className="space-y-2">
              <div className="text-sm font-medium capitalize">{variant}</div>
              <div className="space-y-1">
                <Button variant={variant as any} size="sm">Normal</Button>
                <Button variant={variant as any} size="sm" loading>Loading</Button>
                <Button variant={variant as any} size="sm" disabled>Disabled</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Comprehensive state management demonstrates how buttons behave during different
interaction states. Loading states include proper ARIA attributes and screen
reader announcements for accessibility.
        `
      }
    }
  }
};

// With Icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Left Icons</h3>
        <div className="flex flex-wrap gap-3">
          <Button icon={<Plus className="h-4 w-4" />}>Create New</Button>
          <Button variant="secondary" icon={<Download className="h-4 w-4" />}>Download</Button>
          <Button variant="outline" icon={<Upload className="h-4 w-4" />}>Upload</Button>
          <Button variant="destructive" icon={<Trash2 className="h-4 w-4" />}>Delete</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Right Icons</h3>
        <div className="flex flex-wrap gap-3">
          <Button iconRight={<ExternalLink className="h-4 w-4" />}>Open External</Button>
          <Button variant="outline" iconRight={<ChevronRight className="h-4 w-4" />}>Continue</Button>
          <Button variant="ghost" iconRight={<Settings className="h-4 w-4" />}>Settings</Button>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Both Icons</h3>
        <div className="flex flex-wrap gap-3">
          <Button 
            icon={<Save className="h-4 w-4" />}
            iconRight={<CheckCircle className="h-4 w-4" />}
          >
            Save Changes
          </Button>
          <Button 
            variant="outline"
            icon={<AlertCircle className="h-4 w-4" />}
            iconRight={<ExternalLink className="h-4 w-4" />}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Icon integration supports left, right, or both positions with automatic sizing
and proper spacing. Icons are marked as decorative (\`aria-hidden="true"\`) when
the button text provides sufficient context.
        `
      }
    }
  }
};

// Loading States
export const LoadingStates: Story = {
  render: () => {
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    
    const handleAsyncAction = async (key: string) => {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    };
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Static Loading States</h3>
          <div className="flex flex-wrap gap-3">
            <Button loading>Saving...</Button>
            <Button variant="secondary" loading>Processing</Button>
            <Button variant="outline" loading>Uploading</Button>
            <Button variant="destructive" loading>Deleting</Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Interactive Loading (Click to test)</h3>
          <div className="flex flex-wrap gap-3">
            <Button 
              loading={loadingStates.save}
              onClick={() => handleAsyncAction('save')}
              announceOnPress="Changes saved successfully"
            >
              Save Changes
            </Button>
            <Button 
              variant="secondary"
              loading={loadingStates.upload}
              onClick={() => handleAsyncAction('upload')}
              icon={<Upload className="h-4 w-4" />}
            >
              Upload File
            </Button>
            <Button 
              variant="outline"
              loading={loadingStates.process}
              onClick={() => handleAsyncAction('process')}
            >
              Process Data
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">LoadingButton Component</h3>
          <div className="flex flex-wrap gap-3">
            <LoadingButton
              asyncAction={async () => {
                await new Promise(resolve => setTimeout(resolve, 1500));
              }}
              successMessage="Database connection established"
              errorMessage="Failed to connect to database"
            >
              Test Connection
            </LoadingButton>
            <LoadingButton
              variant="destructive"
              asyncAction={async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                throw new Error('Simulated error');
              }}
              successMessage="Item deleted successfully"
              errorMessage="Failed to delete item"
            >
              Delete Item
            </LoadingButton>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Loading states provide visual feedback during async operations with proper
accessibility support. The LoadingButton component automatically manages
loading state and provides success/error announcements to screen readers.
        `
      }
    }
  }
};

// Full Width
export const FullWidth: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Button fullWidth>Full Width Primary</Button>
      <Button variant="secondary" fullWidth>Full Width Secondary</Button>
      <Button variant="outline" fullWidth icon={<Plus className="h-4 w-4" />}>
        Create New Database Connection
      </Button>
      <Button variant="destructive" fullWidth>
        Delete All Selected Items
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Full-width buttons are ideal for mobile interfaces, form submissions,
and prominent call-to-action scenarios. They maintain proper typography
and icon spacing at any width.
        `
      }
    }
  }
};

// IconButton Stories
export const IconButtons: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Basic Icon Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <IconButton icon={Search} ariaLabel="Search" />
          <IconButton icon={Settings} ariaLabel="Settings" variant="secondary" />
          <IconButton icon={Edit} ariaLabel="Edit item" variant="outline" />
          <IconButton icon={Trash2} ariaLabel="Delete item" variant="destructive" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Icon Button Sizes</h3>
        <div className="flex items-center gap-3">
          <IconButton icon={Plus} ariaLabel="Add small" size="sm" />
          <IconButton icon={Plus} ariaLabel="Add medium" size="default" />
          <IconButton icon={Plus} ariaLabel="Add large" size="lg" />
          <IconButton icon={Plus} ariaLabel="Add extra large" size="xl" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Icon Button States</h3>
        <div className="flex flex-wrap gap-3">
          <IconButton icon={Save} ariaLabel="Save" />
          <IconButton icon={Save} ariaLabel="Saving..." loading />
          <IconButton icon={Save} ariaLabel="Save (disabled)" disabled />
          <IconButton icon={Save} ariaLabel="Save with tooltip" tooltip="Save changes" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Floating Action Buttons</h3>
        <div className="relative h-32 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Floating action buttons positioned in container
          </p>
          <IconButton 
            icon={Plus} 
            ariaLabel="Add new item"
            variant="primary"
            shape="circle"
            elevation="medium"
            className="absolute bottom-4 right-4"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
IconButton components provide compact interactive elements with proper accessibility.
All icon buttons require an \`ariaLabel\` prop for screen reader support and maintain
minimum 44x44px touch targets.

### Shape Variants
- **Square (default)**: Standard interface actions
- **Circle**: Floating action buttons and compact actions

### Elevation Support
- **None**: Flat design integration  
- **Low/Medium/High**: Progressive elevation for FABs
        `
      }
    }
  }
};

// ButtonGroup Stories
export const ButtonGroups: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Horizontal Button Groups</h3>
        <div className="space-y-4">
          <ButtonGroup orientation="horizontal" label="View options">
            <Button variant="outline">List View</Button>
            <Button variant="outline">Grid View</Button>
            <Button variant="outline">Card View</Button>
          </ButtonGroup>
          
          <ButtonGroup orientation="horizontal" label="Text formatting" attached>
            <Button variant="outline" size="sm">Bold</Button>
            <Button variant="outline" size="sm">Italic</Button>
            <Button variant="outline" size="sm">Underline</Button>
          </ButtonGroup>
          
          <ButtonGroup orientation="horizontal" label="Database actions">
            <Button icon={<Database className="h-4 w-4" />}>Connect</Button>
            <Button variant="secondary" icon={<Settings className="h-4 w-4" />}>Configure</Button>
            <Button variant="outline" icon={<Trash2 className="h-4 w-4" />}>Remove</Button>
          </ButtonGroup>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Vertical Button Groups</h3>
        <div className="flex gap-8">
          <ButtonGroup orientation="vertical" label="Navigation menu">
            <Button variant="ghost" icon={<Home className="h-4 w-4" />}>Dashboard</Button>
            <Button variant="ghost" icon={<Database className="h-4 w-4" />}>Databases</Button>
            <Button variant="ghost" icon={<Users className="h-4 w-4" />}>Users</Button>
            <Button variant="ghost" icon={<Settings className="h-4 w-4" />}>Settings</Button>
          </ButtonGroup>
          
          <ButtonGroup orientation="vertical" label="Quick actions" fullWidth>
            <Button>Create New Service</Button>
            <Button variant="secondary">Import Schema</Button>
            <Button variant="outline">Export Data</Button>
          </ButtonGroup>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Dialog Actions</h3>
        <div className="max-w-sm p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="text-lg font-medium mb-2">Confirm Deletion</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Are you sure you want to delete this database service? This action cannot be undone.
          </p>
          <ButtonGroup orientation="horizontal" label="Dialog actions" className="justify-end">
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete Service</Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
ButtonGroup provides semantic grouping for related actions with proper ARIA
labeling and keyboard navigation support.

### Features
- **Orientation**: Horizontal or vertical layouts
- **Attached Mode**: Seamless visual connection between buttons
- **Keyboard Navigation**: Arrow key navigation between grouped buttons
- **Full Width**: Equal width distribution for form layouts
- **Accessibility**: ARIA group labeling and navigation announcements

### Use Cases
- **Dialog Actions**: Cancel/Confirm button pairs
- **View Toggles**: List/Grid/Card view selection
- **Form Actions**: Save/Reset/Cancel combinations
- **Navigation**: Sidebar menu groupings
        `
      }
    }
  }
};

// Accessibility Demonstration
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Keyboard Navigation</h3>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
            <strong>Try keyboard navigation:</strong> Use Tab to focus buttons, Enter/Space to activate.
            Focus indicators only appear during keyboard navigation (focus-visible).
          </p>
          <div className="flex flex-wrap gap-3">
            <Button>First Button</Button>
            <Button variant="secondary">Second Button</Button>
            <Button variant="outline">Third Button</Button>
            <Button variant="ghost">Fourth Button</Button>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Screen Reader Support</h3>
        <div className="space-y-4">
          <Button 
            ariaLabel="Delete user account for John Doe"
            ariaDescribedBy="delete-help-text"
            announceOnPress="User account deleted successfully"
            variant="destructive"
          >
            Delete Account
          </Button>
          <p id="delete-help-text" className="text-sm text-gray-600 dark:text-gray-400">
            This action will permanently remove the user account and all associated data.
          </p>
          
          <Button 
            loading
            loadingText="Connecting to MySQL database server"
            icon={<Database className="h-4 w-4" />}
          >
            Connect to Database
          </Button>
          
          <IconButton 
            icon={Search}
            ariaLabel="Search database schemas"
            tooltip="Search for tables, views, and procedures"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Touch Target Compliance</h3>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 mb-3">
            <strong>WCAG 2.1 AA Compliance:</strong> All buttons maintain minimum 44x44px touch targets,
            even the small variant. Contrast ratios meet 4.5:1 for normal text and 3:1 for UI components.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small (44px min)</Button>
            <Button size="md">Medium (48px)</Button>
            <Button size="lg">Large (56px)</Button>
            <IconButton icon={Plus} ariaLabel="Add item" size="sm" />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">High Contrast Mode</h3>
        <div className="p-4 border-2 border-gray-900 dark:border-gray-100 rounded-lg">
          <p className="text-sm mb-3">
            Buttons maintain visibility and contrast in high contrast display modes:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button className="forced-colors:border-[ButtonBorder] forced-colors:bg-[ButtonFace]">
              High Contrast Button
            </Button>
            <Button variant="outline" className="forced-colors:border-2">
              Outline Button
            </Button>
            <IconButton 
              icon={Settings} 
              ariaLabel="Settings"
              className="forced-colors:border-[ButtonBorder]"
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Comprehensive accessibility implementation following WCAG 2.1 AA guidelines:

### Keyboard Navigation
- **Focus Management**: focus-visible indicators for keyboard-only navigation
- **Activation**: Enter and Space key support for button activation
- **Group Navigation**: Arrow key navigation within ButtonGroups

### Screen Reader Support  
- **ARIA Labels**: Descriptive labels for context-rich announcements
- **Live Regions**: Dynamic announcements for state changes
- **Loading States**: Proper aria-busy and loading text support

### Visual Accessibility
- **Contrast Compliance**: 4.5:1 minimum for text, 3:1 for UI components
- **Touch Targets**: 44x44px minimum for mobile accessibility
- **High Contrast**: Forced colors mode compatibility
- **Focus Indicators**: 2px outline with 2px offset for visibility

### Implementation Details
- **aria-label**: Provides accessible names for screen readers
- **aria-describedby**: Links to additional context elements
- **announceOnPress**: Custom success/action announcements
- **loadingText**: Specific loading state descriptions
        `
      }
    }
  }
};

// Dark Mode
export const DarkMode: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-6 bg-gray-900 text-white rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark Theme Buttons</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button icon={<Plus className="h-4 w-4" />}>Create New</Button>
            <Button variant="outline" loading>Loading</Button>
            <Button variant="secondary" disabled>Disabled</Button>
            <IconButton icon={Settings} ariaLabel="Settings" />
            <IconButton icon={Trash2} ariaLabel="Delete" variant="destructive" />
          </div>
          
          <ButtonGroup orientation="horizontal" label="Dark mode actions">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </ButtonGroup>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <strong>Dark Mode Support:</strong> All button variants automatically adapt their
        colors for dark themes while maintaining WCAG contrast requirements. Colors are
        optimized for both light and dark viewing environments.
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Seamless dark mode support with automatic color adaptation. All variants
maintain proper contrast ratios and visual hierarchy in dark environments.

The design system automatically adjusts:
- Background and text colors for optimal contrast
- Border colors for proper component definition  
- Focus indicators for consistent keyboard navigation
- Loading and disabled states for clear feedback
        `
      }
    }
  }
};

// Use Cases / Examples
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Database Service Management</h3>
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">MySQL Production Server</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" icon={<Edit className="h-4 w-4" />}>
                Edit
              </Button>
              <Button size="sm" variant="secondary" icon={<Settings className="h-4 w-4" />}>
                Configure
              </Button>
              <Button size="sm" variant="destructive" icon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connection Status</p>
                <p className="text-green-600 dark:text-green-400 font-medium">Connected</p>
              </div>
              <Button variant="outline" size="sm">Test Connection</Button>
            </div>
            
            <ButtonGroup orientation="horizontal" label="Database actions" className="justify-end">
              <Button variant="outline">Export Schema</Button>
              <Button icon={<Plus className="h-4 w-4" />}>Generate API</Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Schema Discovery Interface</h3>
        <div className="max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" icon={<ChevronRight className="h-4 w-4" />}>
                All Tables (1,247)
              </Button>
              <Button variant="outline" size="sm">
                Refresh Schema
              </Button>
            </div>
            <div className="flex gap-2">
              <IconButton icon={Search} ariaLabel="Search tables" />
              <Button variant="secondary" size="sm" icon={<Download className="h-4 w-4" />}>
                Export
              </Button>
              <Button size="sm" icon={<Plus className="h-4 w-4" />}>
                Create Table
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            {['users', 'products', 'orders', 'categories'].map((table) => (
              <div key={table} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                <div>
                  <span className="font-medium">{table}</span>
                  <span className="text-sm text-gray-500 ml-2">(24 columns)</span>
                </div>
                <ButtonGroup orientation="horizontal" label={`Actions for ${table} table`}>
                  <Button variant="ghost" size="sm">View Data</Button>
                  <Button variant="outline" size="sm">Generate API</Button>
                  <IconButton icon={Settings} ariaLabel={`Configure ${table} table`} size="sm" />
                </ButtonGroup>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Form Actions</h3>
        <div className="max-w-md p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h4 className="font-medium mb-4">Create Database Connection</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Connection Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder="Production MySQL"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Database Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md">
                <option>MySQL</option>
                <option>PostgreSQL</option>
                <option>MongoDB</option>
              </select>
            </div>
            
            <ButtonGroup orientation="horizontal" label="Form actions" className="justify-end">
              <Button variant="outline">Cancel</Button>
              <Button variant="secondary">Test Connection</Button>
              <Button>Create Service</Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Real-world usage examples demonstrating button components in typical
DreamFactory Admin Interface scenarios:

### Database Management
- Service listing with action buttons
- Connection status and testing
- Schema discovery and table management

### Form Interfaces  
- Create/Edit workflows with proper action hierarchy
- Cancel/Save/Test action groups
- Validation and submission states

### Navigation Patterns
- Icon buttons for compact toolbars
- Button groups for related actions
- Full-width buttons for mobile-first forms

These examples show how the button system maintains consistency
across different interface patterns while providing appropriate
visual hierarchy and accessibility support.
        `
      }
    }
  }
};

// Interactive Playground
export const InteractivePlayground: Story = {
  render: () => {
    const [config, setConfig] = useState({
      variant: 'primary' as const,
      size: 'md' as const,
      loading: false,
      disabled: false,
      fullWidth: false,
      hasIcon: false,
      hasRightIcon: false,
      text: 'Interactive Button'
    });
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Variant</label>
              <select 
                value={config.variant}
                onChange={(e) => setConfig(prev => ({ ...prev, variant: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="ghost">Ghost</option>
                <option value="destructive">Destructive</option>
                <option value="link">Link</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <select 
                value={config.size}
                onChange={(e) => setConfig(prev => ({ ...prev, size: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Button Text</label>
              <input 
                type="text"
                value={config.text}
                onChange={(e) => setConfig(prev => ({ ...prev, text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={config.loading}
                  onChange={(e) => setConfig(prev => ({ ...prev, loading: e.target.checked }))}
                  className="mr-2"
                />
                Loading State
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={config.disabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, disabled: e.target.checked }))}
                  className="mr-2"
                />
                Disabled
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={config.fullWidth}
                  onChange={(e) => setConfig(prev => ({ ...prev, fullWidth: e.target.checked }))}
                  className="mr-2"
                />
                Full Width
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={config.hasIcon}
                  onChange={(e) => setConfig(prev => ({ ...prev, hasIcon: e.target.checked }))}
                  className="mr-2"
                />
                Left Icon
              </label>
              
              <label className="flex items-center">
                <input 
                  type="checkbox"
                  checked={config.hasRightIcon}
                  onChange={(e) => setConfig(prev => ({ ...prev, hasRightIcon: e.target.checked }))}
                  className="mr-2"
                />
                Right Icon
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Button
                variant={config.variant}
                size={config.size}
                loading={config.loading}
                disabled={config.disabled}
                fullWidth={config.fullWidth}
                icon={config.hasIcon ? <Plus className="h-4 w-4" /> : undefined}
                iconRight={config.hasRightIcon ? <ChevronRight className="h-4 w-4" /> : undefined}
              >
                {config.text}
              </Button>
            </div>
            
            <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              <pre>{`<Button
  variant="${config.variant}"
  size="${config.size}"${config.loading ? '\n  loading' : ''}${config.disabled ? '\n  disabled' : ''}${config.fullWidth ? '\n  fullWidth' : ''}${config.hasIcon ? '\n  icon={<Plus className="h-4 w-4" />}' : ''}${config.hasRightIcon ? '\n  iconRight={<ChevronRight className="h-4 w-4" />}' : ''}
>
  ${config.text}
</Button>`}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive playground for testing all button configuration options.
Experiment with different variants, sizes, states, and icon combinations
to see how they affect the visual appearance and generated code.
        `
      }
    }
  }
};