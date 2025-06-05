import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Settings, Search, AlertTriangle, Plus, Database, FileText, User, X } from 'lucide-react';

// Import Dialog components (assumed interface based on technical specification)
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  variant?: 'modal' | 'sheet' | 'overlay' | 'drawer';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogCloseProps {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

// Mock implementations for Storybook demonstration
const Dialog = ({ open, onOpenChange, children, variant = 'modal', size = 'md', className }: DialogProps) => {
  if (!open) return null;
  
  const baseClasses = "fixed inset-0 z-50 flex";
  const backdropClasses = "absolute inset-0 bg-black/50 backdrop-blur-sm";
  
  const variantClasses = {
    modal: "items-center justify-center p-4",
    sheet: "items-end justify-center sm:items-center",
    overlay: "items-start justify-center pt-20",
    drawer: "items-center justify-end"
  };
  
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg", 
    xl: "max-w-xl",
    full: "max-w-full w-full h-full"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}>
      <div 
        className={backdropClasses}
        onClick={() => onOpenChange?.(false)}
      />
      <div className={`relative ${sizeClasses[size]} w-full`}>
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className }: DialogContentProps) => (
  <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 ${className || ''}`}>
    {children}
  </div>
);

const DialogHeader = ({ children, className }: DialogHeaderProps) => (
  <div className={`p-6 pb-4 ${className || ''}`}>
    {children}
  </div>
);

const DialogFooter = ({ children, className }: DialogFooterProps) => (
  <div className={`p-6 pt-4 flex gap-3 justify-end ${className || ''}`}>
    {children}
  </div>
);

const DialogTitle = ({ children, className }: DialogTitleProps) => (
  <h2 className={`text-lg font-semibold text-gray-900 dark:text-white ${className || ''}`}>
    {children}
  </h2>
);

const DialogDescription = ({ children, className }: DialogDescriptionProps) => (
  <p className={`mt-2 text-sm text-gray-600 dark:text-gray-400 ${className || ''}`}>
    {children}
  </p>
);

const DialogClose = ({ children, className, asChild }: DialogCloseProps) => (
  <button 
    className={`absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className || ''}`}
    aria-label="Close dialog"
  >
    {children || <X className="h-4 w-4" />}
  </button>
);

// Mock Button component based on technical specification
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled, 
  className = '',
  ...props 
}: any) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border border-primary-600",
    secondary: "bg-secondary-100 text-secondary-900 hover:bg-secondary-200 border border-secondary-300",
    outline: "bg-transparent text-primary-600 hover:bg-primary-50 border-2 border-primary-600",
    ghost: "bg-transparent text-secondary-700 hover:bg-secondary-100 border border-transparent",
    destructive: "bg-error-600 text-white hover:bg-error-700 border border-error-600"
  };

  const sizes = {
    sm: "h-11 px-4 text-sm min-w-[44px]",
    md: "h-12 px-6 text-base min-w-[48px]",
    lg: "h-14 px-8 text-lg min-w-[56px]"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Input component for form examples
const Input = ({ className = '', ...props }: any) => (
  <input
    className={`block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] ${className}`}
    {...props}
  />
);

const Label = ({ children, className = '', ...props }: any) => (
  <label className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ${className}`} {...props}>
    {children}
  </label>
);

const meta: Meta<typeof Dialog> = {
  title: 'Components/UI/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Dialog Component System

A comprehensive, accessible dialog component system built with React 19, Headless UI, and Tailwind CSS 4.1+. 
Provides WCAG 2.1 AA compliant modal dialogs, sheets, overlays, and drawers with compound component architecture.

## Features

- **Accessibility First**: WCAG 2.1 AA compliant with proper focus management, keyboard navigation, and screen reader support
- **Multiple Variants**: Modal, sheet, overlay, and drawer layouts for different use cases  
- **Responsive Design**: Mobile-first approach with adaptive sizing and touch-friendly interactions
- **Compound Components**: Flexible composition with Dialog.Content, Dialog.Header, Dialog.Footer, etc.
- **Dark Mode Support**: Full theme integration with automatic color adjustments
- **Animation System**: Smooth transitions using Tailwind CSS with reduced motion support

## Usage

\`\`\`tsx
import { Dialog } from '@/components/ui/dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Description>Dialog description text</Dialog.Description>
        </Dialog.Header>
        <div className="p-6">Content goes here</div>
        <Dialog.Footer>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
\`\`\`
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['modal', 'sheet', 'overlay', 'drawer'],
      description: 'Dialog presentation variant'
    },
    size: {
      control: 'select', 
      options: ['sm', 'md', 'lg', 'xl', 'full'],
      description: 'Dialog size configuration'
    },
    open: {
      control: 'boolean',
      description: 'Controls dialog visibility'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// Story wrapper component for interactive examples
const StoryWrapper = ({ children, triggerLabel = "Open Dialog" }: { children: (props: { open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode; triggerLabel?: string }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)} variant="primary">
        {triggerLabel}
      </Button>
      {children({ open, onOpenChange: setOpen })}
    </div>
  );
};

/**
 * Basic Modal Dialog
 * 
 * Standard modal dialog with centered positioning and backdrop overlay.
 * Demonstrates basic compound component structure and accessibility features.
 */
export const BasicModal: Story = {
  render: () => (
    <StoryWrapper>
      {({ open, onOpenChange }) => (
        <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size="md">
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Header>
              <Dialog.Title>Basic Modal Dialog</Dialog.Title>
              <Dialog.Description>
                This is a basic modal dialog demonstrating the fundamental structure and accessibility features.
                The dialog uses proper ARIA labeling and focus management.
              </Dialog.Description>
            </Dialog.Header>
            <div className="p-6 pt-0">
              <p className="text-gray-600 dark:text-gray-400">
                Modal dialogs are ideal for important actions that require user attention before continuing.
                They block interaction with the underlying page until dismissed.
              </p>
            </div>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => onOpenChange(false)}>
                Confirm
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </StoryWrapper>
  )
};

/**
 * Dialog Variants
 * 
 * Demonstrates all available dialog presentation variants: modal, sheet, overlay, and drawer.
 * Each variant has different positioning and animation behavior.
 */
export const DialogVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      {(['modal', 'sheet', 'overlay', 'drawer'] as const).map((variant) => (
        <StoryWrapper key={variant} triggerLabel={`Open ${variant.charAt(0).toUpperCase() + variant.slice(1)}`}>
          {({ open, onOpenChange }) => (
            <Dialog open={open} onOpenChange={onOpenChange} variant={variant} size="md">
              <Dialog.Content>
                <Dialog.Close />
                <Dialog.Header>
                  <Dialog.Title>{variant.charAt(0).toUpperCase() + variant.slice(1)} Dialog</Dialog.Title>
                  <Dialog.Description>
                    This is a {variant} dialog variant with unique positioning and behavior.
                  </Dialog.Description>
                </Dialog.Header>
                <div className="p-6 pt-0">
                  <p className="text-gray-600 dark:text-gray-400">
                    {variant === 'modal' && 'Modal dialogs center content and block all background interaction.'}
                    {variant === 'sheet' && 'Sheet dialogs slide up from bottom on mobile, center on desktop.'}
                    {variant === 'overlay' && 'Overlay dialogs appear from top with minimal backdrop interference.'}
                    {variant === 'drawer' && 'Drawer dialogs slide in from the side, perfect for navigation or filters.'}
                  </p>
                </div>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog>
          )}
        </StoryWrapper>
      ))}
    </div>
  )
};

/**
 * Size Configurations
 * 
 * Shows all available dialog sizes from small to full-screen.
 * Demonstrates responsive behavior and appropriate use cases for each size.
 */
export const SizeConfigurations: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
        <StoryWrapper key={size} triggerLabel={`Size ${size.toUpperCase()}`}>
          {({ open, onOpenChange }) => (
            <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size={size}>
              <Dialog.Content>
                <Dialog.Close />
                <Dialog.Header>
                  <Dialog.Title>Size {size.toUpperCase()} Dialog</Dialog.Title>
                  <Dialog.Description>
                    This dialog demonstrates the {size} size configuration.
                  </Dialog.Description>
                </Dialog.Header>
                <div className="p-6 pt-0">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {size === 'sm' && 'Small dialogs (max-width: 384px) are perfect for simple confirmations and alerts.'}
                    {size === 'md' && 'Medium dialogs (max-width: 448px) work well for forms and standard content.'}
                    {size === 'lg' && 'Large dialogs (max-width: 512px) accommodate complex forms and detailed content.'}
                    {size === 'xl' && 'Extra large dialogs (max-width: 576px) are ideal for data tables and rich content.'}
                    {size === 'full' && 'Full-screen dialogs take up the entire viewport for immersive experiences.'}
                  </p>
                  {size === 'full' && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">Full-screen Content Example</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                          <h4 className="font-medium mb-2">Section 1</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Content area for complex layouts.</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                          <h4 className="font-medium mb-2">Section 2</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Additional content with rich formatting.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Dialog.Footer>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog>
          )}
        </StoryWrapper>
      ))}
    </div>
  )
};

/**
 * Confirmation Dialog
 * 
 * Real-world example of a destructive action confirmation dialog.
 * Demonstrates proper warning styling, clear messaging, and accessible button hierarchy.
 */
export const ConfirmationDialog: Story = {
  render: () => (
    <StoryWrapper triggerLabel="Delete Database Service">
      {({ open, onOpenChange }) => (
        <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size="sm">
          <Dialog.Content>
            <Dialog.Header>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-error-100 dark:bg-error-900/20 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-error-600 dark:text-error-400" />
                </div>
                <div>
                  <Dialog.Title>Delete Database Service</Dialog.Title>
                  <Dialog.Description>
                    This action cannot be undone. This will permanently delete the database service and all associated API endpoints.
                  </Dialog.Description>
                </div>
              </div>
            </Dialog.Header>
            <div className="p-6 pt-0">
              <div className="bg-error-50 dark:bg-error-900/10 border border-error-200 dark:border-error-800 rounded-lg p-4">
                <h4 className="font-medium text-error-900 dark:text-error-100 mb-1">Service to be deleted:</h4>
                <p className="text-sm text-error-700 dark:text-error-300">production-mysql-db</p>
                <p className="text-xs text-error-600 dark:text-error-400 mt-2">
                  • 24 active API endpoints will be disabled<br/>
                  • Database connections will be terminated<br/>
                  • Generated documentation will be removed
                </p>
              </div>
            </div>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => onOpenChange(false)}>
                Delete Service
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </StoryWrapper>
  )
};

/**
 * Search Dialog
 * 
 * Interactive search dialog with real-time filtering and keyboard navigation.
 * Demonstrates form integration, dynamic content updates, and accessibility patterns.
 */
export const SearchDialog: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchResults = [
      { type: 'service', name: 'MySQL Production DB', description: 'Primary production database service' },
      { type: 'table', name: 'users', description: 'User account information table' },
      { type: 'endpoint', name: 'GET /api/v2/users', description: 'Retrieve user list endpoint' },
      { type: 'table', name: 'products', description: 'Product catalog table' },
      { type: 'service', name: 'PostgreSQL Analytics', description: 'Analytics data warehouse' },
    ].filter(item => 
      searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <StoryWrapper triggerLabel="Open Search">
        {({ open, onOpenChange }) => (
          <Dialog open={open} onOpenChange={onOpenChange} variant="overlay" size="lg">
            <Dialog.Content>
              <Dialog.Close />
              <Dialog.Header>
                <Dialog.Title>Search Services & Endpoints</Dialog.Title>
                <Dialog.Description>
                  Search across database services, tables, and API endpoints to quickly find what you need.
                </Dialog.Description>
              </Dialog.Header>
              <div className="p-6 pt-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search services, tables, endpoints..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No results found for "{searchTerm}"
                    </div>
                  ) : (
                    searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onClick={() => onOpenChange(false)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded">
                            {result.type === 'service' && <Database className="h-4 w-4 text-primary-600" />}
                            {result.type === 'table' && <FileText className="h-4 w-4 text-success-600" />}
                            {result.type === 'endpoint' && <Settings className="h-4 w-4 text-warning-600" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{result.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{result.description}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                            {result.type}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        )}
      </StoryWrapper>
    );
  }
};

/**
 * Form Dialog
 * 
 * Complex form dialog for creating a new database service.
 * Demonstrates form validation, error states, and progressive disclosure.
 */
export const FormDialog: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'mysql',
      host: '',
      port: '3306',
      database: '',
      username: '',
      password: '',
      ssl: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [testing, setTesting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: Record<string, string> = {};
      
      if (!formData.name.trim()) newErrors.name = 'Service name is required';
      if (!formData.host.trim()) newErrors.host = 'Host is required';
      if (!formData.database.trim()) newErrors.database = 'Database name is required';
      if (!formData.username.trim()) newErrors.username = 'Username is required';
      
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        alert('Database service created successfully!');
      }
    };

    const testConnection = async () => {
      setTesting(true);
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTesting(false);
      alert('Connection test successful!');
    };

    return (
      <StoryWrapper triggerLabel="Create Database Service">
        {({ open, onOpenChange }) => (
          <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size="lg">
            <Dialog.Content>
              <Dialog.Close />
              <Dialog.Header>
                <Dialog.Title>Create Database Service</Dialog.Title>
                <Dialog.Description>
                  Configure a new database connection. We'll test the connection and generate REST APIs automatically.
                </Dialog.Description>
              </Dialog.Header>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-6 pt-0 space-y-4 max-h-96 overflow-y-auto">
                  <div>
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: any) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., production-mysql"
                      className={errors.name ? 'border-error-500 focus:ring-error-500' : ''}
                    />
                    {errors.name && <p className="mt-1 text-sm text-error-600">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="type">Database Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e: any) => setFormData({...formData, type: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[44px]"
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="sqlserver">SQL Server</option>
                      <option value="oracle">Oracle</option>
                      <option value="mongodb">MongoDB</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="host">Host *</Label>
                      <Input
                        id="host"
                        value={formData.host}
                        onChange={(e: any) => setFormData({...formData, host: e.target.value})}
                        placeholder="localhost or IP address"
                        className={errors.host ? 'border-error-500 focus:ring-error-500' : ''}
                      />
                      {errors.host && <p className="mt-1 text-sm text-error-600">{errors.host}</p>}
                    </div>
                    <div>
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        value={formData.port}
                        onChange={(e: any) => setFormData({...formData, port: e.target.value})}
                        placeholder="3306"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="database">Database Name *</Label>
                    <Input
                      id="database"
                      value={formData.database}
                      onChange={(e: any) => setFormData({...formData, database: e.target.value})}
                      placeholder="Database name to connect to"
                      className={errors.database ? 'border-error-500 focus:ring-error-500' : ''}
                    />
                    {errors.database && <p className="mt-1 text-sm text-error-600">{errors.database}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e: any) => setFormData({...formData, username: e.target.value})}
                        placeholder="Database user"
                        className={errors.username ? 'border-error-500 focus:ring-error-500' : ''}
                      />
                      {errors.username && <p className="mt-1 text-sm text-error-600">{errors.username}</p>}
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e: any) => setFormData({...formData, password: e.target.value})}
                        placeholder="Database password"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ssl"
                      checked={formData.ssl}
                      onChange={(e) => setFormData({...formData, ssl: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <Label htmlFor="ssl" className="mb-0">Enable SSL Connection</Label>
                  </div>
                </div>

                <Dialog.Footer>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={testConnection}
                    disabled={testing}
                    className="mr-auto"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Service
                  </Button>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog>
        )}
      </StoryWrapper>
    );
  }
};

/**
 * Responsive Behavior
 * 
 * Demonstrates how dialogs adapt to different screen sizes and orientations.
 * Shows mobile-first design approach with touch-friendly interactions.
 */
export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Responsive Design Features</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Mobile: Sheet dialogs slide up from bottom for easier thumb access</li>
          <li>• Tablet: Modal dialogs with optimized touch targets (44px minimum)</li>
          <li>• Desktop: Full modal experience with keyboard navigation</li>
          <li>• Large screens: Content constraints prevent excessive line lengths</li>
        </ul>
      </div>
      
      <StoryWrapper triggerLabel="Open Responsive Dialog">
        {({ open, onOpenChange }) => (
          <Dialog open={open} onOpenChange={onOpenChange} variant="sheet" size="md">
            <Dialog.Content>
              <Dialog.Close />
              <Dialog.Header>
                <Dialog.Title>Responsive Dialog Example</Dialog.Title>
                <Dialog.Description>
                  This dialog adapts its behavior based on screen size and device capabilities.
                </Dialog.Description>
              </Dialog.Header>
              <div className="p-6 pt-0 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Current Behavior</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="sm:hidden">Mobile: Sheet layout with bottom slide animation</span>
                    <span className="hidden sm:block md:hidden">Tablet: Modal with touch-optimized controls</span>
                    <span className="hidden md:block">Desktop: Full modal with keyboard shortcuts</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <h5 className="font-medium">Touch Optimized</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">44px minimum touch targets</p>
                  </button>
                  <button className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <h5 className="font-medium">Keyboard Friendly</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tab navigation support</p>
                  </button>
                </div>
              </div>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        )}
      </StoryWrapper>
    </div>
  )
};

/**
 * Accessibility Demonstration
 * 
 * Comprehensive example showcasing WCAG 2.1 AA compliance features.
 * Includes focus management, keyboard navigation, and screen reader support.
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">WCAG 2.1 AA Compliance Features</h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• ✓ 4.5:1 minimum contrast ratios for all text</li>
          <li>• ✓ Keyboard navigation with visible focus indicators</li>
          <li>• ✓ Screen reader announcements and ARIA labeling</li>
          <li>• ✓ Focus trapping within dialog boundary</li>
          <li>• ✓ Escape key and backdrop click dismissal</li>
          <li>• ✓ 44px minimum touch targets for mobile</li>
        </ul>
      </div>

      <StoryWrapper triggerLabel="Test Accessibility Features">
        {({ open, onOpenChange }) => (
          <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size="md">
            <Dialog.Content>
              <Dialog.Close />
              <Dialog.Header>
                <Dialog.Title>Accessibility Test Dialog</Dialog.Title>
                <Dialog.Description>
                  Use Tab to navigate, Enter/Space to activate, and Escape to close. 
                  Screen readers will announce content and state changes.
                </Dialog.Description>
              </Dialog.Header>
              <div className="p-6 pt-0 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Try these keyboard interactions:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Tab / Shift+Tab</span>
                      <span className="text-gray-600 dark:text-gray-400">Navigate between elements</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Enter / Space</span>
                      <span className="text-gray-600 dark:text-gray-400">Activate focused button</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span>Escape</span>
                      <span className="text-gray-600 dark:text-gray-400">Close dialog</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Focusable Button 1
                  </Button>
                  <Input placeholder="Focusable input field" />
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Focusable Button 2
                  </Button>
                </div>
              </div>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => onOpenChange(false)}>
                  Save Changes
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        )}
      </StoryWrapper>
    </div>
  )
};

/**
 * Dark Mode Support
 * 
 * Demonstrates automatic dark mode adaptation with proper contrast maintenance.
 * Shows how dialogs integrate with the application's theme system.
 */
export const DarkModeSupport: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Theme Integration</h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Dialogs automatically adapt to your system theme preference or manual selection. 
          All contrast ratios remain WCAG compliant in both light and dark modes.
        </p>
      </div>

      <StoryWrapper triggerLabel="Open Themed Dialog">
        {({ open, onOpenChange }) => (
          <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size="md">
            <Dialog.Content>
              <Dialog.Close />
              <Dialog.Header>
                <Dialog.Title>Dark Mode Example</Dialog.Title>
                <Dialog.Description>
                  This dialog demonstrates automatic theme adaptation with maintained accessibility standards.
                </Dialog.Description>
              </Dialog.Header>
              <div className="p-6 pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                    <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">Primary Theme</h4>
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                      Brand colors maintain contrast in both themes
                    </p>
                  </div>
                  <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                    <h4 className="font-medium text-success-900 dark:text-success-100 mb-2">Success State</h4>
                    <p className="text-sm text-success-700 dark:text-success-300">
                      Status colors are theme-aware
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Sample Form in Current Theme</Label>
                  <Input placeholder="Input fields adapt automatically" />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm">Primary Action</Button>
                    <Button variant="outline" size="sm">Secondary Action</Button>
                  </div>
                </div>
              </div>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        )}
      </StoryWrapper>
    </div>
  )
};

/**
 * Compound Component Architecture
 * 
 * Advanced example showing flexible dialog composition with nested components.
 * Demonstrates the full power of the compound component pattern.
 */
export const CompoundComponents: Story = {
  render: () => (
    <StoryWrapper triggerLabel="Complex Composition Example">
      {({ open, onOpenChange }) => (
        <Dialog open={open} onOpenChange={onOpenChange} variant="modal" size="xl">
          <Dialog.Content>
            <Dialog.Close />
            <Dialog.Header>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                  <Plus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <Dialog.Title>Advanced Dialog Composition</Dialog.Title>
                  <Dialog.Description>
                    This example demonstrates complex layouts using the compound component architecture.
                  </Dialog.Description>
                </div>
              </div>
            </Dialog.Header>
            
            <div className="flex-1 overflow-hidden">
              <div className="flex h-96">
                {/* Sidebar */}
                <div className="w-48 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="font-medium mb-3">Categories</h4>
                  <nav className="space-y-1">
                    {['Services', 'Tables', 'Endpoints', 'Schemas'].map((item) => (
                      <button
                        key={item}
                        className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {item}
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Main content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Database Services</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { name: 'Production MySQL', status: 'Active', tables: 24 },
                          { name: 'Analytics PostgreSQL', status: 'Active', tables: 12 },
                          { name: 'Cache Redis', status: 'Inactive', tables: 0 },
                          { name: 'Backup Archive', status: 'Active', tables: 156 }
                        ].map((service, index) => (
                          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{service.name}</h5>
                              <span className={`px-2 py-1 text-xs rounded ${
                                service.status === 'Active' 
                                  ? 'bg-success-100 text-success-700 dark:bg-success-900/20 dark:text-success-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {service.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {service.tables} tables configured
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Recent Activity</h4>
                      <div className="space-y-2">
                        {[
                          'User table schema updated',
                          'New API endpoint generated',
                          'Database connection tested',
                          'Documentation regenerated'
                        ].map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 text-sm">
                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                            <span>{activity}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-auto">
                              {index + 1}h ago
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Dialog.Footer>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => onOpenChange(false)}>
                Save Configuration
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      )}
    </StoryWrapper>
  )
};