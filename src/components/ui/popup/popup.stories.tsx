import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { userEvent, within, expect } from '@storybook/test';
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X, 
  Lock,
  Key,
  Settings,
  User,
  LogOut,
  RefreshCw
} from 'lucide-react';

import { Popup } from './popup';
import { usePopup } from './popup-service';
import { PopupVariant, PopupSize } from './types';
import { Button } from '../button/button';

// Interactive wrapper for managing popup state in stories
const PopupWrapper = ({ 
  children, 
  defaultOpen = false,
  onOpenChange,
  ...props 
}: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
    action('popup-open-change')(open);
  };

  return (
    <div>
      <Button onClick={() => handleOpenChange(true)}>
        Open Popup
      </Button>
      <Popup 
        isOpen={isOpen} 
        onClose={() => handleOpenChange(false)}
        {...props}
      >
        {children}
      </Popup>
    </div>
  );
};

// Service hook wrapper for demonstrating programmatic popup usage
const PopupServiceDemo = ({ config, children: content }: any) => {
  const popup = usePopup();
  
  const showPopup = () => {
    popup.open(content, config);
  };

  return (
    <Button onClick={showPopup}>
      Show Popup with Service
    </Button>
  );
};

const meta = {
  title: 'UI Components/Popup',
  component: Popup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Popup Component System

A comprehensive popup component system implementing WCAG 2.1 AA accessibility standards for password 
security notices, authentication workflows, and general user notifications. Replaces Angular DfPopupComponent 
with React 19/Headless UI implementation.

## Features

- ✅ **WCAG 2.1 AA Compliant**: Focus trapping, keyboard navigation, screen reader support
- ✅ **Authentication Workflows**: Password security notices, logout flows, session management
- ✅ **Internationalization**: Translation key support with RTL language compatibility
- ✅ **Responsive Design**: Mobile-first approach with touch-friendly interactions
- ✅ **Animation System**: Smooth transitions with configurable presets
- ✅ **Dark Mode**: Complete theme support with accessible contrast ratios
- ✅ **Service Integration**: Programmatic popup control through usePopup hook

## Variants

- \`default\` - General purpose notifications
- \`success\` - Success messages and confirmations
- \`warning\` - Warning notifications (password security)
- \`error\` - Error messages and critical alerts
- \`info\` - Informational messages
- \`confirmation\` - User confirmation dialogs
- \`authentication\` - Authentication workflow notices
- \`announcement\` - System announcements

## Sizes

- \`xs\` - Extra small (320px max-width)
- \`sm\` - Small (384px max-width)
- \`md\` - Medium (448px max-width, default)
- \`lg\` - Large (512px max-width)
- \`xl\` - Extra large (672px max-width)
- \`full\` - Full width

## Accessibility

All popups implement focus trapping, escape key handling, and proper ARIA labeling for 
screen reader compatibility. Password security workflows include proper announcements 
and keyboard navigation.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info', 'confirmation', 'authentication', 'announcement'],
      description: 'Popup variant with appropriate styling and semantic meaning',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'full'],
      description: 'Popup size configuration',
    },
    title: {
      control: 'text',
      description: 'Popup title for screen readers and visual identification',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show the X close button',
    },
    showRemindMeLater: {
      control: 'boolean',
      description: 'Whether to show "Remind Me Later" button for authentication workflows',
    },
    dismissOnClickOutside: {
      control: 'boolean',
      description: 'Whether clicking outside the popup should close it',
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the popup is currently open',
    },
    onClose: {
      action: 'popup-closed',
      description: 'Callback fired when popup is closed',
    },
    onRemindLater: {
      action: 'remind-later-clicked',
      description: 'Callback fired when "Remind Me Later" is clicked',
    },
    onButtonClick: {
      action: 'button-clicked',
      description: 'Callback fired on any button click with button type',
    },
  },
} satisfies Meta<typeof PopupWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic popup variants
export const Default: Story = {
  args: {
    variant: 'default',
    title: 'General Notice',
    children: 'This is a general popup notification with basic styling and functionality.',
    showCloseButton: true,
    showRemindMeLater: false,
    onClose: action('default-closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default popup variant for general purpose notifications and messages.',
      },
    },
  },
};

export const PasswordSecurityNotice: Story = {
  args: {
    variant: 'authentication',
    title: 'Password Security Notice',
    children: 'Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.',
    showCloseButton: true,
    showRemindMeLater: true,
    onClose: action('password-notice-closed'),
    onRemindLater: action('password-remind-later'),
    onButtonClick: action('password-button-clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Password security notice popup for authentication workflows. The primary use case from the original Angular implementation.',
      },
    },
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Operation Successful',
    children: 'Your database connection has been successfully created and tested.',
    showCloseButton: true,
    showRemindMeLater: false,
    onClose: action('success-closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Success popup variant for positive confirmations and completed operations.',
      },
    },
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Connection Warning',
    children: 'The database connection is experiencing high latency. Consider optimizing your queries or checking network connectivity.',
    showCloseButton: true,
    showRemindMeLater: false,
    onClose: action('warning-closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning popup variant for cautionary messages that require user attention.',
      },
    },
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Connection Failed',
    children: 'Unable to connect to the database. Please check your connection parameters and try again.',
    showCloseButton: true,
    showRemindMeLater: false,
    onClose: action('error-closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Error popup variant for critical error messages and failed operations.',
      },
    },
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'System Information',
    children: 'The system will undergo scheduled maintenance tonight from 11 PM to 2 AM EST. Please save your work.',
    showCloseButton: true,
    showRemindMeLater: false,
    onClose: action('info-closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Info popup variant for informational messages and system announcements.',
      },
    },
  },
};

export const Confirmation: Story = {
  args: {
    variant: 'confirmation',
    title: 'Confirm Delete',
    children: 'Are you sure you want to delete this database service? This action cannot be undone.',
    showCloseButton: true,
    showRemindMeLater: false,
    actions: [
      {
        label: 'Cancel',
        type: 'cancel',
        variant: 'outline',
        onClick: action('cancel-delete'),
      },
      {
        label: 'Delete Service',
        type: 'confirm',
        variant: 'destructive',
        onClick: action('confirm-delete'),
      },
    ],
    onClose: action('confirmation-closed'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Confirmation popup with custom action buttons for user decisions.',
      },
    },
  },
};

// Size variants demonstration
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as PopupSize[]).map((size) => (
        <PopupWrapper
          key={size}
          size={size}
          title={`${size.toUpperCase()} Size Popup`}
          variant="default"
          onClose={action(`${size}-size-closed`)}
        >
          This popup demonstrates the {size} size configuration with responsive 
          design considerations.
        </PopupWrapper>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available popup sizes from extra small to extra large with responsive behavior.',
      },
    },
  },
};

// Animation preset demonstrations
export const AnimationPresets: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {['fade', 'slide', 'scale'].map((preset) => (
        <PopupWrapper
          key={preset}
          title={`${preset} Animation`}
          variant="default"
          animation={{
            preset: preset as any,
            duration: 300,
            easing: 'ease-out',
            animateBackdrop: true,
          }}
          onClose={action(`${preset}-animation-closed`)}
        >
          This popup uses the {preset} animation preset for smooth transitions.
        </PopupWrapper>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different animation presets for popup transitions including fade, slide, and scale effects.',
      },
    },
  },
};

// Complex content with rich formatting
export const RichContent: Story = {
  args: {
    variant: 'authentication',
    title: 'Security Recommendation',
    children: (
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Your current password is <strong>shorter than recommended</strong> (less than 17 characters).
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Why update your password?
          </h4>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Longer passwords are exponentially harder to crack</li>
            <li>• Protects against brute force attacks</li>
            <li>• Meets current security best practices</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          We recommend using a password manager to generate and store secure passwords.
        </p>
      </div>
    ),
    showCloseButton: true,
    showRemindMeLater: true,
    onClose: action('rich-content-closed'),
    onRemindLater: action('rich-content-remind-later'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Popup with rich content including icons, formatted text, and informational callouts.',
      },
    },
  },
};

// Internationalization example
export const Internationalization: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English (LTR) */}
        <PopupWrapper
          variant="authentication"
          title="Password Security Notice"
          i18n={{
            locale: 'en',
            buttonLabels: {
              confirm: 'Update Password Now',
              remindLater: 'Remind me later',
              close: 'Close',
            },
          }}
          showRemindMeLater={true}
          onClose={action('english-closed')}
        >
          Your current password is shorter than recommended (less than 17 characters). 
          For better security, we recommend updating your password to a longer one.
        </PopupWrapper>

        {/* Spanish */}
        <PopupWrapper
          variant="authentication"
          title="Aviso de Seguridad de Contraseña"
          i18n={{
            locale: 'es',
            buttonLabels: {
              confirm: 'Actualizar Contraseña Ahora',
              remindLater: 'Recordármelo más tarde',
              close: 'Cerrar',
            },
          }}
          showRemindMeLater={true}
          onClose={action('spanish-closed')}
        >
          Su contraseña actual es más corta de lo recomendado (menos de 17 caracteres). 
          Para mayor seguridad, recomendamos actualizar su contraseña a una más larga.
        </PopupWrapper>

        {/* Arabic (RTL) */}
        <PopupWrapper
          variant="authentication"
          title="إشعار أمان كلمة المرور"
          i18n={{
            locale: 'ar',
            rtl: true,
            buttonLabels: {
              confirm: 'تحديث كلمة المرور الآن',
              remindLater: 'ذكرني لاحقاً',
              close: 'إغلاق',
            },
          }}
          showRemindMeLater={true}
          className="text-right"
          onClose={action('arabic-closed')}
        >
          كلمة المرور الحالية أقصر من المستوى المُوصى به (أقل من 17 حرفاً). 
          لمزيد من الأمان، نوصي بتحديث كلمة المرور إلى كلمة أطول.
        </PopupWrapper>

        {/* French */}
        <PopupWrapper
          variant="authentication"
          title="Avis de Sécurité du Mot de Passe"
          i18n={{
            locale: 'fr',
            buttonLabels: {
              confirm: 'Mettre à Jour le Mot de Passe',
              remindLater: 'Me rappeler plus tard',
              close: 'Fermer',
            },
          }}
          showRemindMeLater={true}
          onClose={action('french-closed')}
        >
          Votre mot de passe actuel est plus court que recommandé (moins de 17 caractères). 
          Pour une meilleure sécurité, nous recommandons de mettre à jour votre mot de passe.
        </PopupWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Internationalization examples showing popup content in multiple languages including RTL support for Arabic.',
      },
    },
  },
};

// Authentication workflow examples
export const AuthenticationWorkflows: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session Timeout */}
        <PopupWrapper
          variant="warning"
          title="Session Timeout Warning"
          actions={[
            {
              label: 'Extend Session',
              type: 'confirm',
              variant: 'primary',
              onClick: action('extend-session'),
              icon: <RefreshCw className="h-4 w-4" />,
            },
            {
              label: 'Log Out',
              type: 'custom',
              variant: 'outline',
              onClick: action('logout-session'),
              icon: <LogOut className="h-4 w-4" />,
            },
          ]}
          showCloseButton={false}
          dismissOnClickOutside={false}
          onClose={action('session-timeout-closed')}
        >
          Your session will expire in 5 minutes. Please extend your session or save your work.
        </PopupWrapper>

        {/* Account Locked */}
        <PopupWrapper
          variant="error"
          title="Account Temporarily Locked"
          actions={[
            {
              label: 'Reset Password',
              type: 'confirm',
              variant: 'primary',
              onClick: action('reset-password'),
              icon: <Key className="h-4 w-4" />,
            },
            {
              label: 'Contact Support',
              type: 'custom',
              variant: 'outline',
              onClick: action('contact-support'),
              icon: <User className="h-4 w-4" />,
            },
          ]}
          showCloseButton={true}
          onClose={action('account-locked-closed')}
        >
          Your account has been temporarily locked due to multiple failed login attempts. 
          Please reset your password or contact support for assistance.
        </PopupWrapper>

        {/* Password Expired */}
        <PopupWrapper
          variant="warning"
          title="Password Expired"
          actions={[
            {
              label: 'Update Password',
              type: 'confirm',
              variant: 'primary',
              onClick: action('update-expired-password'),
              icon: <Lock className="h-4 w-4" />,
            },
          ]}
          showCloseButton={false}
          dismissOnClickOutside={false}
          onClose={action('password-expired-closed')}
        >
          Your password has expired and must be updated to continue using the system.
        </PopupWrapper>

        {/* Maintenance Mode */}
        <PopupWrapper
          variant="info"
          title="System Maintenance"
          actions={[
            {
              label: 'View Status Page',
              type: 'custom',
              variant: 'outline',
              onClick: action('view-status'),
              icon: <Info className="h-4 w-4" />,
            },
          ]}
          showCloseButton={true}
          onClose={action('maintenance-closed')}
        >
          The system is currently undergoing scheduled maintenance. Some features may be temporarily unavailable.
        </PopupWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Authentication workflow examples including session timeouts, account locks, password expiration, and maintenance notices.',
      },
    },
  },
};

// Dark mode demonstration
export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-gray-900 p-6 rounded-lg space-y-4">
        <div className="mb-4">
          <h3 className="text-white text-lg font-medium mb-2">Dark Mode Variants</h3>
          <p className="text-gray-300 text-sm">
            All popup variants adapt to dark mode with proper contrast ratios and accessibility compliance.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['authentication', 'success', 'warning', 'error'] as PopupVariant[]).map((variant) => (
            <PopupWrapper
              key={variant}
              variant={variant}
              title={`${variant.charAt(0).toUpperCase() + variant.slice(1)} (Dark)`}
              showCloseButton={true}
              showRemindMeLater={variant === 'authentication'}
              onClose={action(`dark-${variant}-closed`)}
            >
              This {variant} popup demonstrates dark mode styling with WCAG compliant contrast ratios.
            </PopupWrapper>
          ))}
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

// Responsive behavior demonstration
export const ResponsiveBehavior: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <p>Resize your browser window to see responsive behavior:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Desktop: Full popup with all features</li>
          <li>Tablet: Adjusted spacing and button sizes</li>
          <li>Mobile: Bottom sheet style with optimized touch targets</li>
        </ul>
      </div>
      
      <PopupWrapper
        variant="authentication"
        title="Responsive Popup Example"
        showCloseButton={true}
        showRemindMeLater={true}
        size="md"
        onClose={action('responsive-closed')}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This popup adapts its layout and interaction patterns based on screen size:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 ml-4">
            <li>• Desktop: Standard modal presentation</li>
            <li>• Tablet: Adjusted padding and button spacing</li>
            <li>• Mobile: Bottom sheet with swipe-friendly interactions</li>
          </ul>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Touch targets maintain 44px minimum size across all breakpoints for accessibility.
            </p>
          </div>
        </div>
      </PopupWrapper>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Responsive popup behavior adapting to different screen sizes with mobile-first approach.',
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
          Open popup and use Tab/Shift+Tab to navigate. Press Escape to close. Focus should be trapped within popup.
        </p>
        <PopupWrapper
          variant="authentication"
          title="Keyboard Navigation Test"
          showCloseButton={true}
          showRemindMeLater={true}
          accessibility={{
            trapFocus: true,
            initialFocus: 'first',
            announceOnOpen: true,
            openAnnouncement: 'Password security notice dialog opened',
          }}
          onClose={action('keyboard-test-closed')}
        >
          This popup demonstrates keyboard accessibility. Use Tab to navigate between buttons and Escape to close.
        </PopupWrapper>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Screen Reader Announcements
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Popup includes proper ARIA labels and live region announcements for screen readers.
        </p>
        <PopupWrapper
          variant="warning"
          title="Screen Reader Test"
          accessibility={{
            role: 'alertdialog',
            ariaLabel: 'Important security warning',
            ariaDescribedBy: 'warning-description',
            announceOnOpen: true,
            openAnnouncement: 'Security warning dialog opened. Please review the password security recommendation.',
          }}
          onClose={action('screen-reader-test-closed')}
        >
          <div id="warning-description">
            This popup demonstrates screen reader compatibility with proper ARIA labeling and announcements.
          </div>
        </PopupWrapper>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Touch Target Validation
        </h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          All interactive elements maintain minimum 44x44px touch targets (outlined in red for testing).
        </p>
        <PopupWrapper
          variant="confirmation"
          title="Touch Target Test"
          actions={[
            {
              label: 'Cancel',
              type: 'cancel',
              variant: 'outline',
              onClick: action('touch-cancel'),
              className: 'ring-2 ring-red-500',
            },
            {
              label: 'Confirm',
              type: 'confirm',
              variant: 'primary',
              onClick: action('touch-confirm'),
              className: 'ring-2 ring-red-500',
            },
          ]}
          className="[&_button]:ring-2 [&_button]:ring-red-500"
          onClose={action('touch-target-test-closed')}
        >
          All buttons maintain WCAG 2.1 AA minimum touch target sizes.
        </PopupWrapper>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Accessibility testing scenarios for keyboard navigation, screen reader support, and touch target validation.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test that popup buttons have proper ARIA labels
    const buttons = canvas.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  },
};

// Service usage demonstration
export const ServiceUsage: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        <p>Programmatic popup control using the usePopup hook service:</p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <PopupServiceDemo
          config={{
            variant: 'authentication',
            title: 'Service-Controlled Popup',
            showRemindMeLater: true,
            onClose: action('service-popup-closed'),
          }}
        >
          This popup was created using the usePopup service for programmatic control.
        </PopupServiceDemo>

        <PopupServiceDemo
          config={{
            variant: 'confirmation',
            title: 'Delete Confirmation',
            actions: [
              {
                label: 'Cancel',
                type: 'cancel',
                variant: 'outline',
                onClick: action('service-cancel'),
              },
              {
                label: 'Delete',
                type: 'confirm',
                variant: 'destructive',
                onClick: action('service-confirm'),
              },
            ],
          }}
        >
          Are you sure you want to delete this item? This action cannot be undone.
        </PopupServiceDemo>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of programmatic popup usage through the usePopup service hook.',
      },
    },
  },
};

// Complex real-world scenario
export const DatabaseManagementScenario: Story = {
  render: () => {
    const [showPasswordNotice, setShowPasswordNotice] = useState(false);
    const [showSessionWarning, setShowSessionWarning] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    return (
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Database Security Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage security settings and authentication for your database services
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Button 
              variant="outline"
              onClick={() => setShowPasswordNotice(true)}
            >
              <Shield className="mr-2 h-4 w-4" />
              Check Password Security
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowSessionWarning(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Simulate Session Warning
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <X className="mr-2 h-4 w-4" />
              Delete Service
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowSuccess(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Show Success Message
            </Button>
          </div>

          {/* Password Security Notice */}
          <Popup
            isOpen={showPasswordNotice}
            onClose={() => setShowPasswordNotice(false)}
            variant="authentication"
            title="Password Security Notice"
            showRemindMeLater={true}
            onRemindLater={() => {
              setShowPasswordNotice(false);
              action('password-remind-later')();
            }}
            onButtonClick={action('password-workflow-action')}
          >
            Your current admin password is shorter than recommended (less than 17 characters). 
            For better security of your database connections, we recommend updating your password to a longer one.
          </Popup>

          {/* Session Warning */}
          <Popup
            isOpen={showSessionWarning}
            onClose={() => setShowSessionWarning(false)}
            variant="warning"
            title="Session Timeout Warning"
            showCloseButton={false}
            dismissOnClickOutside={false}
            actions={[
              {
                label: 'Extend Session',
                type: 'confirm',
                variant: 'primary',
                onClick: () => {
                  setShowSessionWarning(false);
                  action('extend-session')();
                },
                icon: <RefreshCw className="h-4 w-4" />,
              },
              {
                label: 'Log Out',
                type: 'custom',
                variant: 'outline',
                onClick: () => {
                  setShowSessionWarning(false);
                  action('logout-session')();
                },
                icon: <LogOut className="h-4 w-4" />,
              },
            ]}
          >
            Your session will expire in 5 minutes due to inactivity. Any unsaved database configurations will be lost.
          </Popup>

          {/* Delete Confirmation */}
          <Popup
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            variant="confirmation"
            title="Delete Database Service"
            actions={[
              {
                label: 'Cancel',
                type: 'cancel',
                variant: 'outline',
                onClick: () => setShowDeleteConfirm(false),
              },
              {
                label: 'Delete Service',
                type: 'confirm',
                variant: 'destructive',
                onClick: () => {
                  setShowDeleteConfirm(false);
                  setShowSuccess(true);
                  action('confirm-delete-service')();
                },
              },
            ]}
          >
            Are you sure you want to delete the "MySQL Production" database service? 
            This will remove all API endpoints and cannot be undone.
          </Popup>

          {/* Success Message */}
          <Popup
            isOpen={showSuccess}
            onClose={() => setShowSuccess(false)}
            variant="success"
            title="Service Deleted Successfully"
            autoCloseTimeout={3000}
          >
            The database service has been successfully deleted. All associated API endpoints have been removed.
          </Popup>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-world database management scenario showing multiple popup types in a cohesive workflow.',
      },
    },
  },
};

// Performance testing story
export const PerformanceTest: Story = {
  render: () => {
    const [multiplePopups, setMultiplePopups] = useState<boolean[]>([]);

    const openMultiplePopups = () => {
      setMultiplePopups(new Array(5).fill(false).map((_, i) => i < 3));
    };

    const closePopup = (index: number) => {
      setMultiplePopups(prev => prev.map((open, i) => i === index ? false : open));
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Multiple Popup Management
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Test popup stacking and z-index management with multiple concurrent popups.
          </p>
          <Button onClick={openMultiplePopups}>
            Open Multiple Popups
          </Button>
        </div>

        {multiplePopups.map((isOpen, index) => (
          <Popup
            key={index}
            isOpen={isOpen}
            onClose={() => closePopup(index)}
            variant={(['info', 'warning', 'success'] as PopupVariant[])[index % 3]}
            title={`Popup ${index + 1}`}
            zIndex={1000 + index * 10}
          >
            This is popup number {index + 1} for testing z-index stacking and performance.
          </Popup>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Performance testing with multiple concurrent popups and z-index management.',
      },
    },
  },
};