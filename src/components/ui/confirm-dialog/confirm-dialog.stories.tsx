/**
 * Storybook Stories for ConfirmDialog Component
 * 
 * Comprehensive documentation and interactive examples for the ConfirmDialog component,
 * demonstrating accessibility features, internationalization, promise-based workflows,
 * and integration patterns for the React 19/Next.js 15.1/Tailwind CSS architecture.
 * 
 * @version 1.0.0
 * @since 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from '@storybook/test';
import { useState, useCallback } from 'react';
import { ConfirmDialog } from './confirm-dialog';
import type { ConfirmDialogProps, DialogSeverity, DialogTheme } from './types';
import { Button } from '../button';
import { AlertTriangle, Trash2, Save, LogOut, Info, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

// Storybook metadata configuration for ConfirmDialog component
const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Dialog/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ConfirmDialog Component

A comprehensive confirmation dialog component implementing WCAG 2.1 AA accessibility standards 
using Headless UI Dialog primitive and Tailwind CSS. Features promise-based confirmation workflow,
internationalization support, and enhanced user experience patterns.

## Key Features

- **Promise-based API**: Returns Promise<boolean> for async confirmation workflows
- **Accessibility Compliant**: WCAG 2.1 AA with focus trapping and keyboard navigation
- **Internationalization**: react-i18next integration with translation support
- **Multiple Severities**: Info, warning, error, success, and question variants
- **Theme Support**: Default, minimal, card, overlay, and inline themes
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Dark Mode**: Automatic dark mode support with Tailwind CSS

## Migration from Angular

This component replaces the Angular \`DfConfirmDialogComponent\` with enhanced React patterns:
- Converts from Angular Material dialog to Headless UI implementation
- Replaces synchronous \`dialog.close()\` with promise-based confirmation workflow
- Migrates from Angular reactive forms to React Hook Form integration patterns
- Updates from Angular guards to Next.js middleware authentication patterns

## Usage Examples

\`\`\`tsx
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Basic confirmation
const handleDelete = async () => {
  const result = await confirmDialog({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    severity: 'error',
    destructive: true
  });
  
  if (result) {
    // Perform deletion
  }
};

// Advanced configuration
<ConfirmDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Save Changes?"
  message="You have unsaved changes that will be lost."
  severity="warning"
  confirmText="Save"
  cancelText="Discard"
  onConfirm={handleSave}
  onCancel={handleDiscard}
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
    open: {
      control: 'boolean',
      description: 'Whether the dialog is currently open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    title: {
      control: 'text',
      description: 'Dialog title displayed in the header',
      table: {
        type: { summary: 'string' },
      },
    },
    message: {
      control: 'text',
      description: 'Main message content displayed in the dialog body',
      table: {
        type: { summary: 'string' },
      },
    },
    description: {
      control: 'text',
      description: 'Optional detailed description or additional context',
      table: {
        type: { summary: 'string | undefined' },
      },
    },
    severity: {
      control: 'select',
      options: ['info', 'warning', 'error', 'success', 'question'],
      description: 'Severity level determining dialog appearance and default behavior',
      table: {
        type: { summary: "'info' | 'warning' | 'error' | 'success' | 'question'" },
        defaultValue: { summary: "'info'" },
      },
    },
    confirmText: {
      control: 'text',
      description: 'Text for the confirmation button',
      table: {
        type: { summary: 'string | undefined' },
      },
    },
    cancelText: {
      control: 'text',
      description: 'Text for the cancellation button',
      table: {
        type: { summary: 'string | undefined' },
        defaultValue: { summary: "'Cancel'" },
      },
    },
    destructive: {
      control: 'boolean',
      description: 'Whether the confirmation action is destructive (affects styling)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    showCancel: {
      control: 'boolean',
      description: 'Whether to show the cancel button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    focusConfirm: {
      control: 'boolean',
      description: 'Whether to auto-focus the confirm button instead of cancel',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state for async operations',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    error: {
      control: 'text',
      description: 'Error message to display when action fails',
      table: {
        type: { summary: 'string | null' },
      },
    },
    theme: {
      control: 'select',
      options: ['default', 'minimal', 'card', 'overlay', 'inline'],
      description: 'Theme variant for dialog appearance',
      table: {
        type: { summary: "'default' | 'minimal' | 'card' | 'overlay' | 'inline'" },
        defaultValue: { summary: "'default'" },
      },
    },
    onConfirm: { action: 'confirmed' },
    onCancel: { action: 'cancelled' },
    onOpenChange: { action: 'openChanged' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interactive stories with state management
const InteractiveConfirmDialog = ({ 
  storyTitle, 
  buttonText = 'Open Dialog',
  buttonVariant = 'primary',
  ...dialogProps 
}: { 
  storyTitle: string;
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'destructive';
} & Partial<ConfirmDialogProps>) => {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate occasional failure for error demonstration
      if (Math.random() > 0.8) {
        throw new Error('Operation failed. Please try again.');
      }
      
      setResult('✅ Confirmed');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setResult('❌ Cancelled');
    setOpen(false);
    setError(null);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setLoading(false);
      setError(null);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {storyTitle}
      </h3>
      
      <Button
        variant={buttonVariant}
        onClick={() => setOpen(true)}
        className="min-w-[120px]"
      >
        {buttonText}
      </Button>
      
      {result && (
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Last action: {result}
        </div>
      )}
      
      <ConfirmDialog
        open={open}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        loading={loading}
        error={error}
        {...dialogProps}
      />
    </div>
  );
};

// Basic Examples - Core functionality demonstrations

export const Default: Story = {
  args: {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to perform this action?',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic confirmation dialog with default styling and behavior.',
      },
    },
  },
};

export const WithDescription: Story = {
  args: {
    open: true,
    title: 'Delete Database Connection',
    message: 'This action cannot be undone.',
    description: 'Deleting this connection will remove all associated API endpoints and may break applications that depend on this database.',
    severity: 'error',
    destructive: true,
    confirmText: 'Delete',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with additional description text providing more context about the action.',
      },
    },
  },
};

export const WithCustomIcon: Story = {
  args: {
    open: true,
    title: 'Save Changes',
    message: 'You have unsaved changes. What would you like to do?',
    icon: <Save className="h-6 w-6 text-blue-500" />,
    severity: 'question',
    confirmText: 'Save',
    cancelText: 'Discard',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with custom icon and question severity for save confirmation workflows.',
      },
    },
  },
};

// Severity Variants - Different dialog types and their visual appearance

export const SeverityInfo: Story = {
  args: {
    open: true,
    title: 'Information',
    message: 'This operation will generate new API endpoints for your database.',
    icon: <Info className="h-6 w-6" />,
    severity: 'info',
    confirmText: 'Continue',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Information dialog for non-critical confirmations and general notices.',
      },
    },
  },
};

export const SeverityWarning: Story = {
  args: {
    open: true,
    title: 'Warning',
    message: 'This action will overwrite existing API configurations.',
    icon: <AlertTriangle className="h-6 w-6" />,
    severity: 'warning',
    confirmText: 'Proceed',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning dialog for potentially risky actions that require user attention.',
      },
    },
  },
};

export const SeverityError: Story = {
  args: {
    open: true,
    title: 'Delete Permanently',
    message: 'This action cannot be undone and will permanently delete all data.',
    icon: <XCircle className="h-6 w-6" />,
    severity: 'error',
    destructive: true,
    confirmText: 'Delete Forever',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error dialog for destructive actions that cannot be reversed.',
      },
    },
  },
};

export const SeveritySuccess: Story = {
  args: {
    open: true,
    title: 'Success',
    message: 'API endpoints have been generated successfully.',
    icon: <CheckCircle className="h-6 w-6" />,
    severity: 'success',
    confirmText: 'View APIs',
    showCancel: false,
    onConfirm: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Success dialog for positive confirmations and completion notices.',
      },
    },
  },
};

export const SeverityQuestion: Story = {
  args: {
    open: true,
    title: 'Choose Option',
    message: 'Would you like to create a backup before proceeding?',
    icon: <HelpCircle className="h-6 w-6" />,
    severity: 'question',
    confirmText: 'Create Backup',
    cancelText: 'Skip Backup',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Question dialog for binary choices and decision points.',
      },
    },
  },
};

// Theme Variants - Different visual themes

export const ThemeMinimal: Story = {
  args: {
    open: true,
    title: 'Minimal Theme',
    message: 'Clean, minimal appearance with reduced visual elements.',
    theme: 'minimal',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal theme with reduced visual elements for clean, simple appearance.',
      },
    },
  },
};

export const ThemeCard: Story = {
  args: {
    open: true,
    title: 'Card Theme',
    message: 'Card-style dialog with elevated appearance and drop shadow.',
    theme: 'card',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Card theme with elevated appearance and enhanced drop shadow effects.',
      },
    },
  },
};

export const ThemeOverlay: Story = {
  args: {
    open: true,
    title: 'Overlay Theme',
    message: 'Full-screen overlay style with blurred background.',
    theme: 'overlay',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Overlay theme with full-screen appearance and backdrop blur effects.',
      },
    },
  },
};

// Interactive Examples - Real-world usage patterns

export const DeleteConfirmation: Story = {
  render: () => (
    <InteractiveConfirmDialog
      storyTitle="Delete Database Connection"
      buttonText="Delete Connection"
      buttonVariant="destructive"
      title="Delete Database Connection"
      message="Are you sure you want to delete this database connection?"
      description="This action cannot be undone. All associated API endpoints will be permanently removed."
      icon={<Trash2 className="h-6 w-6" />}
      severity="error"
      destructive={true}
      confirmText="Delete Forever"
      cancelText="Keep Connection"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive delete confirmation with async operation simulation and error handling.',
      },
    },
  },
};

export const SaveConfirmation: Story = {
  render: () => (
    <InteractiveConfirmDialog
      storyTitle="Save Database Schema Changes"
      buttonText="Save Changes"
      buttonVariant="primary"
      title="Save Schema Changes"
      message="Do you want to save the changes to your database schema?"
      description="This will update your API endpoints to reflect the new schema structure."
      icon={<Save className="h-6 w-6" />}
      severity="question"
      confirmText="Save Changes"
      cancelText="Discard Changes"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive save confirmation with promise-based workflow and loading states.',
      },
    },
  },
};

export const LogoutConfirmation: Story = {
  render: () => (
    <InteractiveConfirmDialog
      storyTitle="Logout Confirmation"
      buttonText="Logout"
      buttonVariant="secondary"
      title="Confirm Logout"
      message="Are you sure you want to logout?"
      description="You will need to sign in again to access the admin interface."
      icon={<LogOut className="h-6 w-6" />}
      severity="warning"
      confirmText="Logout"
      cancelText="Stay Logged In"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive logout confirmation demonstrating session management workflow.',
      },
    },
  },
};

// Configuration Options - Advanced configuration demonstrations

export const NoCancel: Story = {
  args: {
    open: true,
    title: 'Mandatory Action',
    message: 'This action is required and cannot be cancelled.',
    severity: 'info',
    showCancel: false,
    confirmText: 'Acknowledge',
    onConfirm: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with no cancel option for mandatory actions and acknowledgments.',
      },
    },
  },
};

export const FocusConfirm: Story = {
  args: {
    open: true,
    title: 'Auto-focus Confirm',
    message: 'The confirm button will be automatically focused.',
    severity: 'info',
    focusConfirm: true,
    confirmText: 'Confirm',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with confirm button auto-focused instead of cancel button.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    open: true,
    title: 'Processing Request',
    message: 'Please wait while we process your request...',
    loading: true,
    severity: 'info',
    confirmText: 'Processing...',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog showing loading state during async operations with disabled interactions.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    open: true,
    title: 'Operation Failed',
    message: 'Failed to connect to database.',
    error: 'Connection timeout: Unable to reach database server at localhost:3306. Please check your connection settings and try again.',
    severity: 'error',
    confirmText: 'Retry',
    cancelText: 'Cancel',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog displaying error state with detailed error message and retry option.',
      },
    },
  },
};

// Internationalization Examples - Translation and locale support

export const InternationalizationEnglish: Story = {
  args: {
    open: true,
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    description: 'This action cannot be undone.',
    severity: 'error',
    destructive: true,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'English localization example with standard terminology.',
      },
    },
  },
};

export const InternationalizationSpanish: Story = {
  args: {
    open: true,
    title: 'Eliminar Elemento',
    message: '¿Estás seguro de que quieres eliminar este elemento?',
    description: 'Esta acción no se puede deshacer.',
    severity: 'error',
    destructive: true,
    confirmText: 'Eliminar',
    cancelText: 'Cancelar',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Spanish localization example demonstrating i18n integration.',
      },
    },
  },
};

export const InternationalizationFrench: Story = {
  args: {
    open: true,
    title: 'Supprimer l\'élément',
    message: 'Êtes-vous sûr de vouloir supprimer cet élément?',
    description: 'Cette action ne peut pas être annulée.',
    severity: 'error',
    destructive: true,
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'French localization example showing proper accent handling and translations.',
      },
    },
  },
};

export const InternationalizationJapanese: Story = {
  args: {
    open: true,
    title: 'アイテムを削除',
    message: 'このアイテムを削除してもよろしいですか？',
    description: 'この操作は元に戻すことができません。',
    severity: 'error',
    destructive: true,
    confirmText: '削除',
    cancelText: 'キャンセル',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Japanese localization example demonstrating CJK character support and RTL compatibility.',
      },
    },
  },
};

// Accessibility Examples - WCAG 2.1 AA compliance demonstrations

export const AccessibilityKeyboardNavigation: Story = {
  args: {
    open: true,
    title: 'Keyboard Navigation Test',
    message: 'Use Tab, Shift+Tab, Enter, and Escape keys to interact with this dialog.',
    description: 'Focus should be trapped within the dialog. Press Escape to close or Tab through the buttons.',
    severity: 'info',
    confirmText: 'Test Confirm',
    cancelText: 'Test Cancel',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog demonstrating keyboard navigation, focus trapping, and ARIA compliance.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify dialog is accessible via keyboard
    const dialog = canvas.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
    
    // Test keyboard navigation
    await userEvent.keyboard('{Tab}');
    const cancelButton = canvas.getByRole('button', { name: /test cancel/i });
    expect(cancelButton).toHaveFocus();
    
    await userEvent.keyboard('{Tab}');
    const confirmButton = canvas.getByRole('button', { name: /test confirm/i });
    expect(confirmButton).toHaveFocus();
    
    // Test Escape key closes dialog
    await userEvent.keyboard('{Escape}');
  },
};

export const AccessibilityScreenReader: Story = {
  args: {
    open: true,
    title: 'Screen Reader Optimized',
    message: 'This dialog includes proper ARIA labels and descriptions for screen reader users.',
    description: 'Screen readers will announce the dialog title, message, and available actions.',
    severity: 'info',
    confirmText: 'Accessible Confirm',
    cancelText: 'Accessible Cancel',
    'aria-label': 'Screen reader accessible confirmation dialog',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog optimized for screen readers with comprehensive ARIA labeling.',
      },
    },
  },
};

// Dark Mode Examples - Theme variants in dark mode

export const DarkModeDefault: Story = {
  args: {
    open: true,
    title: 'Dark Mode Dialog',
    message: 'This dialog automatically adapts to dark mode preferences.',
    severity: 'info',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default dialog appearance in dark mode with automatic theme adaptation.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const DarkModeError: Story = {
  args: {
    open: true,
    title: 'Dark Mode Error',
    message: 'Error dialogs maintain proper contrast ratios in dark mode.',
    icon: <XCircle className="h-6 w-6" />,
    severity: 'error',
    destructive: true,
    confirmText: 'Delete',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error dialog in dark mode ensuring WCAG contrast compliance.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

// Integration Examples - Usage with other components

export const IntegrationWithForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({ name: 'My Database', type: 'mysql' });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);

    const handleSubmit = async () => {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHasUnsavedChanges(false);
      setOpen(false);
    };

    const handleDiscard = () => {
      setFormData({ name: '', type: 'mysql' });
      setHasUnsavedChanges(false);
      setOpen(false);
    };

    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h3 className="text-lg font-semibold">Form Integration Example</h3>
        
        <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Database Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Database Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, type: e.target.value }));
                setHasUnsavedChanges(true);
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mongodb">MongoDB</option>
            </select>
          </div>
          
          <Button
            onClick={() => setOpen(true)}
            disabled={!hasUnsavedChanges}
            className="w-full"
          >
            Save Configuration
          </Button>
        </div>

        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Save Database Configuration"
          message="Are you sure you want to save these database settings?"
          description="This will update your database connection and may affect existing API endpoints."
          icon={<Save className="h-6 w-6" />}
          severity="question"
          confirmText="Save Settings"
          cancelText="Cancel"
          onConfirm={handleSubmit}
          onCancel={handleDiscard}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Integration with form components showing unsaved changes workflow.',
      },
    },
  },
};

// Complex Workflow Example - Multi-step operations

export const ComplexWorkflow: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState<'initial' | 'confirm' | 'backup' | 'processing' | 'complete'>('initial');
    const [hasBackup, setHasBackup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleStartWorkflow = () => setCurrentStep('confirm');
    const handleConfirmAction = () => setCurrentStep('backup');
    const handleBackupChoice = (createBackup: boolean) => {
      setHasBackup(createBackup);
      setCurrentStep('processing');
      processAction(createBackup);
    };
    
    const processAction = async (withBackup: boolean) => {
      setLoading(true);
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      setLoading(false);
      setCurrentStep('complete');
    };

    const resetWorkflow = () => {
      setCurrentStep('initial');
      setHasBackup(false);
      setLoading(false);
    };

    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <h3 className="text-lg font-semibold">Complex Workflow Example</h3>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Current step: <strong>{currentStep}</strong>
          </p>
          
          {currentStep === 'initial' && (
            <Button onClick={handleStartWorkflow}>
              Start Complex Operation
            </Button>
          )}
          
          {currentStep === 'complete' && (
            <div className="space-y-4">
              <div className="text-green-600 dark:text-green-400">
                ✅ Operation completed successfully!
                {hasBackup && <div>Backup was created.</div>}
              </div>
              <Button onClick={resetWorkflow} variant="secondary">
                Start Over
              </Button>
            </div>
          )}
        </div>

        {/* Initial Confirmation */}
        <ConfirmDialog
          open={currentStep === 'confirm'}
          onOpenChange={(open) => !open && setCurrentStep('initial')}
          title="Confirm Database Migration"
          message="This will migrate your database schema to the latest version."
          description="The migration process will update table structures and may take several minutes to complete."
          icon={<AlertTriangle className="h-6 w-6" />}
          severity="warning"
          confirmText="Start Migration"
          cancelText="Cancel"
          onConfirm={handleConfirmAction}
          onCancel={() => setCurrentStep('initial')}
        />

        {/* Backup Choice */}
        <ConfirmDialog
          open={currentStep === 'backup'}
          onOpenChange={(open) => !open && setCurrentStep('confirm')}
          title="Create Backup?"
          message="Would you like to create a backup before migration?"
          description="A backup will allow you to restore your database if something goes wrong during migration."
          icon={<HelpCircle className="h-6 w-6" />}
          severity="question"
          confirmText="Create Backup"
          cancelText="Skip Backup"
          onConfirm={() => handleBackupChoice(true)}
          onCancel={() => handleBackupChoice(false)}
        />

        {/* Processing */}
        <ConfirmDialog
          open={currentStep === 'processing'}
          onOpenChange={() => {}} // Prevent closing during processing
          title="Migration In Progress"
          message="Please wait while the database migration completes..."
          description={hasBackup ? "Creating backup and migrating database..." : "Migrating database..."}
          icon={<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />}
          severity="info"
          loading={loading}
          showCancel={false}
          confirmText="Processing..."
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complex multi-step workflow demonstrating chained dialogs and state management.',
      },
    },
  },
};

// Performance and Edge Cases

export const PerformanceLargeContent: Story = {
  args: {
    open: true,
    title: 'Large Content Dialog',
    message: 'This dialog contains a large amount of content to test rendering performance and scroll behavior.',
    description: `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
      
      At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.
    `,
    severity: 'info',
    onConfirm: fn(),
    onCancel: fn(),
    onOpenChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dialog with large content testing scroll behavior and performance optimization.',
      },
    },
  },
};