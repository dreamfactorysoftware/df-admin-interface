import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect } from '@storybook/test';
import { useState } from 'react';
import { 
  Database,
  Search,
  Settings,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Plus,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Check,
  Upload,
  Filter,
  Calendar,
  User,
  Key,
  Mail
} from 'lucide-react';
import { Dialog, useDialog } from './dialog';
import { Button } from '../button/button';

const meta = {
  title: 'UI Components/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Dialog Component System

A comprehensive dialog component system implementing WCAG 2.1 AA accessibility standards with 
multiple variants and responsive behavior. Provides modal, sheet, overlay, and drawer presentations 
for different use cases and screen sizes.

## Features

- ✅ **WCAG 2.1 AA Compliant**: Proper focus management, keyboard navigation, and screen reader support
- ✅ **Multiple Variants**: Modal, sheet, overlay, and drawer presentations
- ✅ **Responsive Design**: Mobile-first approach with automatic variant switching
- ✅ **Compound Components**: Flexible composition with Dialog.Header, Dialog.Content, Dialog.Footer
- ✅ **Animation System**: Smooth Tailwind CSS transitions with reduced motion support
- ✅ **Dark Mode**: Complete theme support with consistent styling
- ✅ **Focus Management**: Automatic focus trapping and restoration

## Variants

- \`modal\` - Traditional centered modal dialogs for forms and confirmations
- \`sheet\` - Bottom/side sheets for mobile-friendly interactions
- \`overlay\` - Full-screen overlays with backdrop blur for immersive experiences
- \`drawer\` - Side navigation drawers for menus and settings

## Sizes

- \`sm\` - Small dialogs (max-width: 384px)
- \`md\` - Medium dialogs (max-width: 448px) - default
- \`lg\` - Large dialogs (max-width: 512px)
- \`xl\` - Extra large dialogs (max-width: 576px)
- \`full\` - Full-width dialogs with responsive constraints

## Accessibility

All dialogs implement WCAG 2.1 AA standards with automatic focus management, keyboard navigation 
(ESC to close, TAB cycling), and proper ARIA labeling for screen readers.

## Responsive Behavior

Dialogs automatically adapt to screen size:
- **Mobile (< 768px)**: Large modals become bottom sheets
- **Tablet (768px+)**: Balanced approach with sheets for larger content  
- **Desktop (1024px+)**: Full modal and drawer support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['modal', 'sheet', 'overlay', 'drawer'],
      description: 'Dialog presentation variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Dialog size configuration',
    },
    position: {
      control: 'select',
      options: ['center', 'top', 'bottom', 'left', 'right'],
      description: 'Dialog positioning',
    },
    open: {
      control: 'boolean',
      description: 'Whether the dialog is open',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Show close button in header',
    },
    disableBackdropClose: {
      control: 'boolean',
      description: 'Prevent closing by clicking backdrop',
    },
    disableEscapeKeyDown: {
      control: 'boolean',
      description: 'Prevent closing with Escape key',
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive dialog wrapper for stories
const DialogWrapper = ({ 
  children, 
  buttonText = 'Open Dialog',
  buttonVariant = 'primary' as const,
  onDialogAction = action('dialog-action'),
  ...dialogProps 
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button 
        variant={buttonVariant}
        onClick={() => setIsOpen(true)}
      >
        {buttonText}
      </Button>
      
      <Dialog
        open={isOpen}
        onClose={(reason) => {
          setIsOpen(false);
          onDialogAction(`closed-${reason}`);
        }}
        {...dialogProps}
      >
        {children}
      </Dialog>
    </>
  );
};

// Basic modal dialog variants
export const Modal: Story = {
  render: () => (
    <DialogWrapper variant="modal" size="md">
      <Dialog.Header>
        <Dialog.Title>Create Database Service</Dialog.Title>
        <Dialog.Description>
          Configure a new database connection to generate REST APIs automatically.
        </Dialog.Description>
      </Dialog.Header>
      
      <Dialog.Content>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter service name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database Type
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>MySQL</option>
              <option>PostgreSQL</option>
              <option>MongoDB</option>
              <option>Oracle</option>
            </select>
          </div>
        </div>
      </Dialog.Content>
      
      <Dialog.Footer>
        <Dialog.Close variant="outlined">Cancel</Dialog.Close>
        <Button variant="primary" onClick={action('create-service')}>
          <Database className="mr-2 h-4 w-4" />
          Create Service
        </Button>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Standard modal dialog for forms and data entry. Centers on screen with backdrop overlay.',
      },
    },
  },
};

export const Sheet: Story = {
  render: () => (
    <DialogWrapper variant="sheet" position="bottom" buttonText="Open Bottom Sheet">
      <Dialog.Header showSeparator={false}>
        <Dialog.Title>Filter Database Tables</Dialog.Title>
        <Dialog.Description>
          Apply filters to find specific tables in your database schema.
        </Dialog.Description>
      </Dialog.Header>
      
      <Dialog.Content scrollBehavior="inside" maxHeight="60vh">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Table Type</h4>
            <div className="space-y-2">
              {['All Tables', 'Views Only', 'Stored Procedures', 'Functions'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="table-type"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Schema</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {['public', 'auth', 'storage', 'realtime', 'extensions'].map((schema) => (
                <label key={schema} className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{schema}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Table Name Contains
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Search table names..."
            />
          </div>
        </div>
      </Dialog.Content>
      
      <Dialog.Footer align="space-between" sticky>
        <Button variant="ghost" onClick={action('clear-filters')}>
          Clear All
        </Button>
        <div className="flex gap-2">
          <Dialog.Close variant="outlined">Cancel</Dialog.Close>
          <Button variant="primary" onClick={action('apply-filters')}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Bottom sheet for mobile-friendly filtering and selection interfaces. Slides up from bottom.',
      },
    },
  },
};

export const Overlay: Story = {
  render: () => (
    <DialogWrapper variant="overlay" size="full" buttonText="Open Schema Viewer">
      <Dialog.Header padding="lg">
        <Dialog.Title size="xl">Database Schema Viewer</Dialog.Title>
        <Dialog.Description size="lg">
          Explore your complete database structure with interactive navigation.
        </Dialog.Description>
      </Dialog.Header>
      
      <Dialog.Content noPadding>
        <div className="flex h-[70vh]">
          {/* Schema tree sidebar */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                <Database className="h-4 w-4 mr-2 text-primary-600" />
                <span className="text-sm font-medium">production_db</span>
              </div>
              <div className="ml-6 space-y-1">
                {['users', 'products', 'orders', 'payments', 'reviews'].map((table) => (
                  <div key={table} className="flex items-center p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{table}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="flex-1 p-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a table to view details
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a table from the sidebar to see columns, relationships, and indexes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Dialog.Content>
      
      <Dialog.Footer padding="lg">
        <Dialog.Close>Close Viewer</Dialog.Close>
        <Button variant="primary" onClick={action('generate-from-schema')}>
          <Plus className="mr-2 h-4 w-4" />
          Generate APIs
        </Button>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full-screen overlay for complex interfaces like schema viewers and data explorers.',
      },
    },
  },
};

export const Drawer: Story = {
  render: () => (
    <DialogWrapper variant="drawer" position="right" buttonText="Open Settings Drawer">
      <Dialog.Header>
        <Dialog.Title>Application Settings</Dialog.Title>
      </Dialog.Header>
      
      <Dialog.Content>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Appearance</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</label>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Compact Mode</label>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Database</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Default Page Size
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                   focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                  <option>25 rows</option>
                  <option>50 rows</option>
                  <option>100 rows</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh Schema</label>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors">
                  <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition-transform" />
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Advanced</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Show Advanced Options</label>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 dark:text-gray-300">Enable Debug Mode</label>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog.Content>
      
      <Dialog.Footer>
        <Dialog.Close variant="outlined">Cancel</Dialog.Close>
        <Button variant="primary" onClick={action('save-settings')}>
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side drawer for navigation menus and settings panels. Slides in from left or right.',
      },
    },
  },
};

// Size variants demonstration
export const Sizes: Story = {
  render: () => (
    <div className="space-x-2">
      <DialogWrapper variant="modal" size="sm" buttonText="Small">
        <Dialog.Header>
          <Dialog.Title>Small Dialog</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>This is a small dialog (max-width: 384px).</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <DialogWrapper variant="modal" size="md" buttonText="Medium">
        <Dialog.Header>
          <Dialog.Title>Medium Dialog</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>This is a medium dialog (max-width: 448px) - the default size.</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <DialogWrapper variant="modal" size="lg" buttonText="Large">
        <Dialog.Header>
          <Dialog.Title>Large Dialog</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>This is a large dialog (max-width: 512px).</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <DialogWrapper variant="modal" size="xl" buttonText="Extra Large">
        <Dialog.Header>
          <Dialog.Title>Extra Large Dialog</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>This is an extra large dialog (max-width: 576px).</p>
        </Dialog.Content>
      </DialogWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different dialog sizes for various content requirements. All sizes are responsive.',
      },
    },
  },
};

// Position variants
export const Positions: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-2">
      <DialogWrapper variant="sheet" position="top" buttonText="Top Sheet">
        <Dialog.Header>
          <Dialog.Title>Top Sheet</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>Sheet positioned at the top of the screen.</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <DialogWrapper variant="modal" position="center" buttonText="Center Modal">
        <Dialog.Header>
          <Dialog.Title>Center Modal</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>Modal centered on the screen.</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <DialogWrapper variant="sheet" position="bottom" buttonText="Bottom Sheet">
        <Dialog.Header>
          <Dialog.Title>Bottom Sheet</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>Sheet positioned at the bottom of the screen.</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <DialogWrapper variant="drawer" position="left" buttonText="Left Drawer">
        <Dialog.Header>
          <Dialog.Title>Left Drawer</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>Drawer sliding in from the left.</p>
        </Dialog.Content>
      </DialogWrapper>
      
      <div></div>
      
      <DialogWrapper variant="drawer" position="right" buttonText="Right Drawer">
        <Dialog.Header>
          <Dialog.Title>Right Drawer</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>Drawer sliding in from the right.</p>
        </Dialog.Content>
      </DialogWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different positioning options for dialogs based on variant and use case.',
      },
    },
  },
};

// Compound component composition examples
export const CompoundComponents: Story = {
  render: () => (
    <DialogWrapper variant="modal" size="lg" buttonText="Compound Example">
      <Dialog.Header showSeparator padding="lg">
        <Dialog.Title size="xl">User Profile Settings</Dialog.Title>
        <Dialog.Description>
          Update your profile information and account preferences.
        </Dialog.Description>
      </Dialog.Header>
      
      <Dialog.Content scrollBehavior="inside" maxHeight="500px" padding="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                defaultValue="John"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                defaultValue="Doe"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="john.doe@example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option>Administrator</option>
              <option>Developer</option>
              <option>Viewer</option>
            </select>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Permissions</h4>
            <div className="space-y-2">
              {[
                'Create Database Services',
                'Modify API Endpoints', 
                'Delete Resources',
                'Manage Users',
                'View System Logs'
              ].map((permission) => (
                <label key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked={['Create Database Services', 'Modify API Endpoints'].includes(permission)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{permission}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Dialog.Content>
      
      <Dialog.Footer align="space-between" padding="lg" sticky>
        <Button variant="ghost" onClick={action('reset-form')}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <div className="flex gap-3">
          <Dialog.Close variant="outlined">Cancel</Dialog.Close>
          <Button variant="primary" onClick={action('save-profile')}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compound component composition showing flexible header, content, and footer arrangements.',
      },
    },
  },
};

// Controlled vs Uncontrolled patterns
export const ControlledDialog: Story = {
  render: () => {
    const ControlledExample = () => {
      const [isOpen, setIsOpen] = useState(false);
      const [step, setStep] = useState(1);
      
      const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
      const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
      
      return (
        <>
          <Button onClick={() => setIsOpen(true)}>
            Open Controlled Dialog
          </Button>
          
          <Dialog
            open={isOpen}
            onClose={() => {
              setIsOpen(false);
              setStep(1);
            }}
            variant="modal"
            size="lg"
          >
            <Dialog.Header>
              <Dialog.Title>Database Setup Wizard (Step {step} of 3)</Dialog.Title>
              <Dialog.Description>
                Follow the steps to configure your database connection.
              </Dialog.Description>
            </Dialog.Header>
            
            <Dialog.Content>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Connection Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Host"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="text"
                      placeholder="Port"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Authentication</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Username"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Confirmation</h3>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-green-800 dark:text-green-200">
                        Connection successful! Ready to create service.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Dialog.Content>
            
            <Dialog.Footer>
              {step > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button variant="primary" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setIsOpen(false)}>
                  Create Service
                </Button>
              )}
            </Dialog.Footer>
          </Dialog>
        </>
      );
    };
    
    return <ControlledExample />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Controlled dialog pattern with external state management and multi-step workflow.',
      },
    },
  },
};

// Confirmation dialog patterns
export const ConfirmationDialog: Story = {
  render: () => (
    <div className="space-x-2">
      <DialogWrapper 
        variant="modal" 
        size="sm" 
        buttonText="Delete Service" 
        buttonVariant="destructive"
      >
        <Dialog.Header>
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded-full mr-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <Dialog.Title>Confirm Deletion</Dialog.Title>
          </div>
        </Dialog.Header>
        
        <Dialog.Content>
          <Dialog.Description>
            Are you sure you want to delete the <strong>MySQL Production</strong> service? 
            This action cannot be undone and will remove all associated API endpoints.
          </Dialog.Description>
        </Dialog.Content>
        
        <Dialog.Footer>
          <Dialog.Close variant="outlined">Cancel</Dialog.Close>
          <Button variant="destructive" onClick={action('confirm-delete')}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Service
          </Button>
        </Dialog.Footer>
      </DialogWrapper>
      
      <DialogWrapper 
        variant="modal" 
        size="md" 
        buttonText="Save Changes"
        buttonVariant="primary"
      >
        <Dialog.Header>
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full mr-3">
              <Save className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <Dialog.Title>Save Configuration</Dialog.Title>
          </div>
        </Dialog.Header>
        
        <Dialog.Content>
          <Dialog.Description>
            You have unsaved changes to your database configuration. 
            Would you like to save these changes before continuing?
          </Dialog.Description>
          
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Changes:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Connection timeout updated to 30 seconds</li>
              <li>• SSL mode enabled</li>
              <li>• Connection pool size increased to 20</li>
            </ul>
          </div>
        </Dialog.Content>
        
        <Dialog.Footer>
          <Button variant="ghost" onClick={action('discard-changes')}>
            Discard Changes
          </Button>
          <Dialog.Close variant="outlined">Cancel</Dialog.Close>
          <Button variant="primary" onClick={action('save-changes')}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </Dialog.Footer>
      </DialogWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Confirmation dialog patterns for destructive and save actions with clear visual indicators.',
      },
    },
  },
};

// Search dialog example
export const SearchDialog: Story = {
  render: () => (
    <DialogWrapper variant="overlay" size="lg" buttonText="Search Database">
      <Dialog.Header showSeparator={false} padding="lg">
        <div className="flex items-center w-full">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search tables, columns, or data..."
            className="flex-1 text-lg bg-transparent border-0 focus:ring-0 focus:outline-none 
                       text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            autoFocus
          />
        </div>
      </Dialog.Header>
      
      <Dialog.Content noPadding>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[
            { type: 'table', name: 'users', description: '1,234 rows • Last updated 2 hours ago' },
            { type: 'table', name: 'user_profiles', description: '1,234 rows • Last updated 1 day ago' },
            { type: 'column', name: 'email', table: 'users', description: 'VARCHAR(255) • Unique index' },
            { type: 'column', name: 'username', table: 'users', description: 'VARCHAR(50) • Primary key' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center">
                  {item.type === 'table' ? (
                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                  ) : (
                    <div className="h-4 w-4 bg-green-600 dark:bg-green-400 rounded-full mr-2" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </span>
                  {item.table && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      in {item.table}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={action(`select-${item.name}`)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </Dialog.Content>
      
      <Dialog.Footer padding="lg">
        <div className="flex justify-between w-full text-xs text-gray-500 dark:text-gray-400">
          <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
          <span>4 results</span>
        </div>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Search dialog with command palette-style interface for database exploration.',
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
          <h3 className="text-white text-lg font-medium mb-2">Dark Mode Dialog Variants</h3>
          <p className="text-gray-300 text-sm">
            All dialog variants adapt to dark mode with proper contrast ratios and theming.
          </p>
        </div>
        
        <div className="space-x-2">
          <DialogWrapper variant="modal" buttonText="Dark Modal" buttonVariant="primary">
            <Dialog.Header>
              <Dialog.Title>Dark Mode Modal</Dialog.Title>
              <Dialog.Description>
                This modal demonstrates dark mode styling with proper contrast ratios.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Content>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="w-full px-3 py-2 border border-gray-600 rounded-md 
                             bg-gray-800 text-gray-100 placeholder-gray-400
                             focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <div className="bg-gray-800 p-3 rounded border border-gray-700">
                  <p className="text-gray-300">Dark themed content area</p>
                </div>
              </div>
            </Dialog.Content>
            <Dialog.Footer>
              <Dialog.Close variant="outlined">Cancel</Dialog.Close>
              <Button variant="primary">Save</Button>
            </Dialog.Footer>
          </DialogWrapper>
          
          <DialogWrapper variant="sheet" position="bottom" buttonText="Dark Sheet">
            <Dialog.Header>
              <Dialog.Title>Dark Mode Sheet</Dialog.Title>
            </Dialog.Header>
            <Dialog.Content>
              <p className="text-gray-300">
                Bottom sheet with dark mode theming and appropriate color contrasts.
              </p>
            </Dialog.Content>
            <Dialog.Footer>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Footer>
          </DialogWrapper>
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

// Real-world integration examples
export const DatabaseServiceCreation: Story = {
  render: () => (
    <DialogWrapper variant="modal" size="xl" buttonText="Create Database Service">
      <Dialog.Header>
        <Dialog.Title>Create Database Service</Dialog.Title>
        <Dialog.Description>
          Configure a new database connection to automatically generate REST APIs.
        </Dialog.Description>
      </Dialog.Header>
      
      <Dialog.Content scrollBehavior="inside" maxHeight="600px">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., production-mysql"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Type *
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                                 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mongodb">MongoDB</option>
                <option value="oracle">Oracle</option>
                <option value="sqlserver">SQL Server</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Host *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="localhost or database.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Port
              </label>
              <input
                type="number"
                defaultValue="3306"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="database_name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schema (Optional)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="public"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="database_user"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Advanced Options</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable SSL
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use SSL encryption for database connections
                  </p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Connection Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    defaultValue="30"
                    min="5"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Connections
                  </label>
                  <input
                    type="number"
                    defaultValue="10"
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                               focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog.Content>
      
      <Dialog.Footer align="space-between">
        <Button variant="outline" onClick={action('test-connection')}>
          <Database className="mr-2 h-4 w-4" />
          Test Connection
        </Button>
        <div className="flex gap-3">
          <Dialog.Close variant="outlined">Cancel</Dialog.Close>
          <Button variant="primary" onClick={action('create-service')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Service
          </Button>
        </div>
      </Dialog.Footer>
    </DialogWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete database service creation form with validation, advanced options, and real-world field patterns.',
      },
    },
  },
};

// Responsive behavior demonstration
export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Responsive Dialog Behavior
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Resize your browser window to see how dialogs adapt to different screen sizes.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DialogWrapper variant="modal" size="lg" buttonText="Responsive Modal">
          <Dialog.Header>
            <Dialog.Title>Responsive Modal</Dialog.Title>
            <Dialog.Description>
              This modal automatically adapts: on mobile it becomes a bottom sheet, 
              on tablet it remains a modal with adjusted size, and on desktop it uses the full modal layout.
            </Dialog.Description>
          </Dialog.Header>
          
          <Dialog.Content>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Current Breakpoint Behavior
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>📱 <strong>Mobile (&lt;768px):</strong> Converts to bottom sheet</li>
                  <li>💻 <strong>Tablet (768px+):</strong> Maintains modal with adjusted size</li>
                  <li>🖥️ <strong>Desktop (1024px+):</strong> Full modal presentation</li>
                </ul>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Field adapts to screen"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Mobile stacks vertically"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </Dialog.Content>
          
          <Dialog.Footer>
            <Dialog.Close variant="outlined">Close</Dialog.Close>
            <Button variant="primary">Continue</Button>
          </Dialog.Footer>
        </DialogWrapper>
        
        <DialogWrapper variant="drawer" position="right" buttonText="Responsive Drawer">
          <Dialog.Header>
            <Dialog.Title>Responsive Drawer</Dialog.Title>
          </Dialog.Header>
          
          <Dialog.Content>
            <div className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Drawer Adaptation
                </h4>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>📱 <strong>Mobile:</strong> Full-width overlay</li>
                  <li>💻 <strong>Tablet:</strong> 320px wide drawer</li>
                  <li>🖥️ <strong>Desktop:</strong> 384px wide drawer</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Setting 1</span>
                  <button className="h-6 w-11 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm">Setting 2</span>
                  <button className="h-6 w-11 bg-primary-600 rounded-full" />
                </div>
              </div>
            </div>
          </Dialog.Content>
          
          <Dialog.Footer>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Footer>
        </DialogWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive behavior demonstration showing how dialogs adapt to different screen sizes automatically.',
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
          Use Tab to navigate, Enter/Space to open dialogs, Escape to close. Focus should trap within open dialogs.
        </p>
        <DialogWrapper variant="modal" buttonText="Test Focus Management">
          <Dialog.Header>
            <Dialog.Title>Focus Management Test</Dialog.Title>
            <Dialog.Description>
              Focus should automatically move to this dialog and trap within it.
            </Dialog.Description>
          </Dialog.Header>
          
          <Dialog.Content>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="First focusable element"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                Focusable Button
              </button>
              <input
                type="text"
                placeholder="Last focusable element"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </Dialog.Content>
          
          <Dialog.Footer>
            <Dialog.Close variant="outlined">Cancel</Dialog.Close>
            <Button variant="primary">Confirm</Button>
          </Dialog.Footer>
        </DialogWrapper>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Screen Reader Announcements
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Dialogs include proper ARIA labels, descriptions, and role announcements for screen readers.
        </p>
        <DialogWrapper 
          variant="modal" 
          buttonText="Test Screen Reader Support"
          aria-label="Open accessibility test dialog with proper ARIA labeling"
        >
          <Dialog.Header>
            <Dialog.Title>Screen Reader Test</Dialog.Title>
            <Dialog.Description>
              This dialog demonstrates proper ARIA labeling and announcements for assistive technologies.
            </Dialog.Description>
          </Dialog.Header>
          
          <Dialog.Content>
            <div className="space-y-4">
              <div role="alert" className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This is an ARIA alert that will be announced to screen readers.
                </p>
              </div>
              
              <fieldset className="border border-gray-300 dark:border-gray-600 rounded p-4">
                <legend className="px-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Accessibility Options
                </legend>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      aria-describedby="reduce-motion-desc"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Reduce motion animations
                    </span>
                  </label>
                  <p id="reduce-motion-desc" className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                    Minimizes animations for users with vestibular disorders
                  </p>
                </div>
              </fieldset>
            </div>
          </Dialog.Content>
          
          <Dialog.Footer>
            <Dialog.Close 
              variant="outlined"
              aria-label="Cancel and close accessibility test dialog"
            >
              Cancel
            </Dialog.Close>
            <Button 
              variant="primary"
              aria-label="Save accessibility preferences and close dialog"
              onClick={action('save-accessibility-settings')}
            >
              Save Preferences
            </Button>
          </Dialog.Footer>
        </DialogWrapper>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          High Contrast and Visual Indicators
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Dialog components maintain proper contrast ratios and visual hierarchy.
        </p>
        <DialogWrapper variant="modal" buttonText="Test Visual Accessibility">
          <Dialog.Header>
            <Dialog.Title>Visual Accessibility Test</Dialog.Title>
            <Dialog.Description>
              This dialog tests contrast ratios and visual indicators for users with visual impairments.
            </Dialog.Description>
          </Dialog.Header>
          
          <Dialog.Content>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded border-l-4 border-primary-500">
                  <p className="font-medium text-primary-900 dark:text-primary-100">Success State</p>
                  <p className="text-primary-700 dark:text-primary-200">4.5:1 contrast ratio maintained</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-500">
                  <p className="font-medium text-red-900 dark:text-red-100">Error State</p>
                  <p className="text-red-700 dark:text-red-200">Clear visual error indication</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Required field with validation *
                </label>
                <input
                  type="text"
                  required
                  aria-required="true"
                  aria-invalid="true"
                  aria-describedby="field-error"
                  className="w-full px-3 py-2 border-2 border-red-500 rounded-md 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p id="field-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                  This field is required and must be filled out.
                </p>
              </div>
            </div>
          </Dialog.Content>
          
          <Dialog.Footer>
            <Dialog.Close variant="outlined">Close Test</Dialog.Close>
          </Dialog.Footer>
        </DialogWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility testing scenarios for keyboard navigation, screen readers, and visual accessibility.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const firstButton = canvas.getByText('Test Focus Management');
    await userEvent.tab();
    await expect(firstButton).toHaveFocus();
    
    // Test screen reader button
    const screenReaderButton = canvas.getByLabelText('Open accessibility test dialog with proper ARIA labeling');
    expect(screenReaderButton).toBeInTheDocument();
    expect(screenReaderButton).toHaveAttribute('aria-label');
  },
};

// Animation and transition examples
export const AnimationsAndTransitions: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Animation and Transition Examples
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Different animation patterns optimized for performance and accessibility.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DialogWrapper 
          variant="modal" 
          buttonText="Fade Modal"
          animation={{
            timing: 'normal',
            easing: 'ease-out',
            enabled: true,
            respectReducedMotion: true,
            enter: { from: 'fade', to: 'fade' },
            exit: { from: 'fade', to: 'fade' }
          }}
        >
          <Dialog.Header>
            <Dialog.Title>Fade Animation</Dialog.Title>
          </Dialog.Header>
          <Dialog.Content>
            <p>This modal uses a smooth fade animation with opacity transitions.</p>
          </Dialog.Content>
          <Dialog.Footer>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Footer>
        </DialogWrapper>
        
        <DialogWrapper 
          variant="modal" 
          buttonText="Scale Modal"
          animation={{
            timing: 'normal',
            easing: 'ease-out',
            enabled: true,
            respectReducedMotion: true,
            enter: { from: 'scale', to: 'scale' },
            exit: { from: 'scale', to: 'scale' }
          }}
        >
          <Dialog.Header>
            <Dialog.Title>Scale Animation</Dialog.Title>
          </Dialog.Header>
          <Dialog.Content>
            <p>This modal scales in from the center for a dynamic entrance effect.</p>
          </Dialog.Content>
          <Dialog.Footer>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Footer>
        </DialogWrapper>
        
        <DialogWrapper 
          variant="sheet" 
          position="bottom"
          buttonText="Slide Sheet"
          animation={{
            timing: 'normal',
            easing: 'ease-out',
            enabled: true,
            respectReducedMotion: true,
            enter: { from: 'slide-up', to: 'slide-up' },
            exit: { from: 'slide-up', to: 'slide-up' }
          }}
        >
          <Dialog.Header>
            <Dialog.Title>Slide Animation</Dialog.Title>
          </Dialog.Header>
          <Dialog.Content>
            <p>This sheet slides up from the bottom with smooth motion.</p>
          </Dialog.Content>
          <Dialog.Footer>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Footer>
        </DialogWrapper>
        
        <DialogWrapper 
          variant="drawer" 
          position="right"
          buttonText="Drawer Slide"
          animation={{
            timing: 'fast',
            easing: 'ease-out',
            enabled: true,
            respectReducedMotion: true,
            enter: { from: 'slide-right', to: 'slide-right' },
            exit: { from: 'slide-right', to: 'slide-right' }
          }}
        >
          <Dialog.Header>
            <Dialog.Title>Drawer Animation</Dialog.Title>
          </Dialog.Header>
          <Dialog.Content>
            <p>This drawer slides in from the right with fast timing.</p>
          </Dialog.Content>
          <Dialog.Footer>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Footer>
        </DialogWrapper>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          🎯 Accessibility Note
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          All animations respect the <code>prefers-reduced-motion</code> media query. 
          Users who have enabled "Reduce motion" in their OS settings will see 
          simplified transitions that maintain functionality while reducing visual motion.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Animation and transition examples showing different timing and easing options with accessibility considerations.',
      },
    },
  },
};

// Performance testing story
export const PerformanceTest: Story = {
  render: () => {
    const PerformanceExample = () => {
      const [dialogStates, setDialogStates] = useState(Array(10).fill(false));
      
      const toggleDialog = (index: number) => {
        setDialogStates(prev => prev.map((state, i) => i === index ? !state : state));
      };
      
      return (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Performance Testing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Multiple dialogs with rapid state changes to test performance and memory usage.
            </p>
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {dialogStates.map((isOpen, index) => (
              <div key={index}>
                <Button
                  variant={isOpen ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => toggleDialog(index)}
                >
                  Dialog {index + 1}
                </Button>
                
                <Dialog
                  open={isOpen}
                  onClose={() => toggleDialog(index)}
                  variant="modal"
                  size="sm"
                >
                  <Dialog.Header>
                    <Dialog.Title>Performance Test Dialog {index + 1}</Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Content>
                    <p>This is dialog number {index + 1} for performance testing.</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Rendered at: {new Date().toLocaleTimeString()}
                    </div>
                  </Dialog.Content>
                  <Dialog.Footer>
                    <Button variant="primary" onClick={() => toggleDialog(index)}>
                      Close
                    </Button>
                  </Dialog.Footer>
                </Dialog>
              </div>
            ))}
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              variant="primary"
              onClick={() => setDialogStates(Array(10).fill(true))}
            >
              Open All
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogStates(Array(10).fill(false))}
            >
              Close All
            </Button>
          </div>
        </div>
      );
    };
    
    return <PerformanceExample />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance testing with multiple dialogs and rapid state changes to ensure smooth operation.',
      },
    },
  },
};