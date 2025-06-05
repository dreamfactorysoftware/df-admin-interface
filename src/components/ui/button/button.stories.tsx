import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect } from '@storybook/test';
import { 
  Play, 
  Download, 
  Settings, 
  Plus, 
  Trash2, 
  RefreshCw,
  Database,
  Save,
  X,
  ChevronDown,
  Search
} from 'lucide-react';
import { Button } from './button';
import { IconButton } from './icon-button';
import { ButtonGroup } from './button-group';

const meta = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component System

A comprehensive button component system implementing WCAG 2.1 AA accessibility standards with 
comprehensive variant support. Replaces all Angular Material button patterns with React 19/Tailwind CSS 
implementation.

## Features

- ✅ **WCAG 2.1 AA Compliant**: 4.5:1 contrast ratios, 44x44px minimum touch targets
- ✅ **Keyboard Navigation**: Focus-visible support with 2px outline and proper offset  
- ✅ **Loading States**: Built-in spinner with disabled interaction during async operations
- ✅ **Screen Reader Support**: Proper ARIA labeling and announcements
- ✅ **Dark Mode**: Complete theme support with consistent styling
- ✅ **Responsive**: Mobile-first design with touch-friendly targets

## Variants

- \`primary\` - Main call-to-action buttons (7.14:1 contrast ratio)
- \`secondary\` - Secondary actions with subtle styling
- \`outline\` - Outlined buttons for less prominent actions
- \`ghost\` - Minimal buttons for subtle interactions
- \`destructive\` - Danger actions like delete operations

## Sizes

- \`sm\` - Small buttons (44x44px minimum)
- \`md\` - Medium buttons (48x48px default)
- \`lg\` - Large buttons (56x56px)

## Accessibility

All buttons meet WCAG 2.1 AA standards with minimum 44x44px touch targets and proper contrast ratios.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
      description: 'Button variant with different visual styles',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size (all maintain 44px minimum touch target)',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner and disable interaction',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler function',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic button variants
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Create Database Service',
    onClick: action('primary-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Primary buttons for main call-to-action. Uses primary-600 color with 7.14:1 contrast ratio for AAA compliance.',
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Cancel',
    onClick: action('secondary-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Secondary buttons for alternative actions. More subtle styling while maintaining accessibility.',
      },
    },
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'View Schema',
    onClick: action('outline-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Outline buttons for secondary actions with clear boundaries. 2px border for better visibility.',
      },
    },
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Edit Connection',
    onClick: action('ghost-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Ghost buttons for subtle interactions. Minimal styling with hover states.',
      },
    },
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Service',
    onClick: action('destructive-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Destructive buttons for dangerous actions like delete operations. High contrast error colors.',
      },
    },
  },
};

// Button sizes demonstration
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm" onClick={action('small-clicked')}>
        Small (44px min)
      </Button>
      <Button size="md" onClick={action('medium-clicked')}>
        Medium (48px)
      </Button>
      <Button size="lg" onClick={action('large-clicked')}>
        Large (56px)
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes maintain WCAG 2.1 AA minimum 44x44px touch targets for accessibility.',
      },
    },
  },
};

// Button states
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Connecting to Database...',
    onClick: action('loading-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner. Button becomes disabled during async operations.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
    onClick: action('disabled-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled state with reduced opacity and pointer-events disabled.',
      },
    },
  },
};

// Buttons with icons
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant="primary" onClick={action('save-clicked')}>
          <Save className="mr-2 h-4 w-4" />
          Save Configuration
        </Button>
        <Button variant="secondary" onClick={action('download-clicked')}>
          <Download className="mr-2 h-4 w-4" />
          Export Schema
        </Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={action('refresh-clicked')}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
        <Button variant="destructive" onClick={action('delete-clicked')}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with Lucide React icons. Icons should be 16px (h-4 w-4) with proper spacing.',
      },
    },
  },
};

// Icon-only buttons (IconButton component)
export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Circular Icon Buttons
        </h3>
        <div className="flex gap-2">
          <IconButton
            aria-label="Settings"
            onClick={action('settings-clicked')}
          >
            <Settings className="h-4 w-4" />
          </IconButton>
          <IconButton
            variant="secondary"
            aria-label="Add item"
            onClick={action('add-clicked')}
          >
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton
            variant="outline"
            aria-label="Search"
            onClick={action('search-clicked')}
          >
            <Search className="h-4 w-4" />
          </IconButton>
          <IconButton
            variant="destructive"
            aria-label="Delete item"
            onClick={action('delete-icon-clicked')}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Square Icon Buttons
        </h3>
        <div className="flex gap-2">
          <IconButton
            shape="square"
            aria-label="Database settings"
            onClick={action('db-settings-clicked')}
          >
            <Database className="h-4 w-4" />
          </IconButton>
          <IconButton
            shape="square"
            variant="outline"
            aria-label="Close dialog"
            onClick={action('close-clicked')}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Floating Action Button (FAB)
        </h3>
        <IconButton
          variant="primary"
          size="lg"
          shape="circle"
          aria-label="Create new database service"
          onClick={action('fab-clicked')}
        >
          <Plus className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icon-only buttons with mandatory ARIA labels for accessibility. Supports circular, square, and FAB variants.',
      },
    },
  },
};

// Button groups
export const ButtonGroups: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Dialog Actions (Horizontal)
        </h3>
        <ButtonGroup orientation="horizontal" className="justify-end">
          <Button variant="outline" onClick={action('cancel-clicked')}>
            Cancel
          </Button>
          <Button variant="primary" onClick={action('confirm-clicked')}>
            Confirm
          </Button>
        </ButtonGroup>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Action Group (Horizontal)
        </h3>
        <ButtonGroup orientation="horizontal">
          <Button variant="outline" onClick={action('view-clicked')}>
            <Database className="mr-2 h-4 w-4" />
            View Schema
          </Button>
          <Button variant="outline" onClick={action('generate-clicked')}>
            <Play className="mr-2 h-4 w-4" />
            Generate APIs
          </Button>
          <Button variant="outline" onClick={action('more-clicked')}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Toolbar Actions (Vertical)
        </h3>
        <ButtonGroup orientation="vertical" className="w-fit">
          <IconButton aria-label="Edit" onClick={action('edit-clicked')}>
            <Settings className="h-4 w-4" />
          </IconButton>
          <IconButton aria-label="Download" onClick={action('download-icon-clicked')}>
            <Download className="h-4 w-4" />
          </IconButton>
          <IconButton 
            variant="destructive" 
            aria-label="Delete" 
            onClick={action('delete-group-clicked')}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </ButtonGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button groups for organizing related actions. Supports horizontal and vertical layouts with proper keyboard navigation.',
      },
    },
  },
};

// Dark mode demonstration
export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-gray-900 p-6 rounded-lg">
        <div className="mb-4">
          <h3 className="text-white text-lg font-medium mb-2">Dark Mode Variants</h3>
          <p className="text-gray-300 text-sm">
            All button variants adapt to dark mode with proper contrast ratios.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={action('dark-primary-clicked')}>
            Primary Action
          </Button>
          <Button variant="secondary" onClick={action('dark-secondary-clicked')}>
            Secondary
          </Button>
          <Button variant="outline" onClick={action('dark-outline-clicked')}>
            Outline
          </Button>
          <Button variant="ghost" onClick={action('dark-ghost-clicked')}>
            Ghost
          </Button>
          <Button variant="destructive" onClick={action('dark-destructive-clicked')}>
            Destructive
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          <IconButton aria-label="Settings" onClick={action('dark-settings-clicked')}>
            <Settings className="h-4 w-4" />
          </IconButton>
          <IconButton variant="outline" aria-label="Add" onClick={action('dark-add-clicked')}>
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dark mode variants maintaining WCAG 2.1 AA contrast ratios in dark themes.',
      },
    },
  },
};

// Complex real-world scenarios
export const DatabaseManagementScenario: Story = {
  render: () => (
    <div className="w-full max-w-4xl">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Database Services
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your database connections and API services
            </p>
          </div>
          <Button variant="primary" onClick={action('create-service-clicked')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Service
          </Button>
        </div>

        <div className="space-y-4">
          {/* Service item example */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded">
                  <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    MySQL Production
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Connected • 127 tables
                  </p>
                </div>
              </div>
              
              <ButtonGroup orientation="horizontal">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={action('view-schema-clicked')}
                >
                  View Schema
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={action('generate-api-clicked')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Generate API
                </Button>
                <IconButton 
                  variant="outline"
                  size="sm"
                  aria-label="More actions"
                  onClick={action('more-actions-clicked')}
                >
                  <ChevronDown className="h-4 w-4" />
                </IconButton>
              </ButtonGroup>
            </div>
          </div>

          {/* Loading state service */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
                  <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    PostgreSQL Development
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Connecting...
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                loading
                onClick={action('connecting-clicked')}
              >
                Connecting...
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={action('refresh-list-clicked')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <ButtonGroup orientation="horizontal">
            <Button variant="outline" onClick={action('import-clicked')}>
              Import Schema
            </Button>
            <Button variant="destructive" onClick={action('delete-selected-clicked')}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world database management interface showing various button patterns and states in context.',
      },
    },
  },
};

// Accessibility testing story
export const AccessibilityTesting: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Keyboard Navigation Test
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Use Tab to navigate and Enter/Space to activate buttons. Focus rings should be clearly visible.
        </p>
        <div className="flex gap-2">
          <Button tabIndex={1} onClick={action('first-button')}>First Button</Button>
          <Button tabIndex={2} onClick={action('second-button')}>Second Button</Button>
          <IconButton tabIndex={3} aria-label="Icon button" onClick={action('icon-button')}>
            <Settings className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Touch Target Test
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          All buttons maintain minimum 44x44px touch targets (outlined in red for testing).
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="ring-2 ring-red-500"
            onClick={action('touch-target-sm')}
          >
            Small (44px min)
          </Button>
          <IconButton 
            size="sm"
            className="ring-2 ring-red-500"
            aria-label="Small icon button"
            onClick={action('touch-target-icon')}
          >
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Screen Reader Announcements
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Buttons include proper ARIA labels and state announcements.
        </p>
        <div className="flex gap-2">
          <Button 
            aria-describedby="save-description"
            onClick={action('save-with-description')}
          >
            Save Changes
          </Button>
          <div id="save-description" className="sr-only">
            Saves all pending changes to the database configuration
          </div>
          
          <Button 
            loading
            aria-label="Saving configuration, please wait"
            onClick={action('loading-announcement')}
          >
            Saving...
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility testing scenarios for keyboard navigation, touch targets, and screen reader support.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const firstButton = canvas.getByText('First Button');
    await userEvent.tab();
    await expect(firstButton).toHaveFocus();
    
    // Test touch targets
    const smallButton = canvas.getByText('Small (44px min)');
    const buttonRect = smallButton.getBoundingClientRect();
    await expect(buttonRect.width).toBeGreaterThanOrEqual(44);
    await expect(buttonRect.height).toBeGreaterThanOrEqual(44);
  },
};

// Performance testing story
export const PerformanceTest: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Rapid State Changes
        </h3>
        <div className="flex gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <Button
              key={i}
              variant={i % 2 === 0 ? 'primary' : 'secondary'}
              size="sm"
              onClick={action(`rapid-button-${i}`)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Dynamic Loading States
        </h3>
        <div className="flex gap-2">
          <Button loading onClick={action('loading-1')}>Loading 1</Button>
          <Button loading onClick={action('loading-2')}>Loading 2</Button>
          <Button loading onClick={action('loading-3')}>Loading 3</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Performance testing with multiple buttons and rapid state changes.',
      },
    },
  },
};