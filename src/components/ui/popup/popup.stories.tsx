import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { useState } from 'react';
import { AlertTriangle, Lock, Shield, Eye, EyeOff, Check, X, Globe } from 'lucide-react';

import { Popup } from './popup';
import { PopupService } from './popup-service';
import { Button } from '../button/button';

/**
 * Popup Component Stories
 * 
 * The Popup component system provides modal dialogs for user interactions,
 * featuring accessibility compliance, responsive design, and comprehensive
 * internationalization support. Stories demonstrate password security notices,
 * authentication workflows, and various configuration scenarios.
 */
const meta = {
  title: 'UI Components/Popup',
  component: Popup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Popup component provides modal dialog functionality for the DreamFactory Admin Interface.
It supports various use cases including password security notices, authentication workflows,
and user confirmations with full WCAG 2.1 AA accessibility compliance.

## Key Features
- **Accessibility**: Full keyboard navigation, screen reader support, focus management
- **Responsive Design**: Mobile-first approach with cross-device compatibility  
- **Internationalization**: Complete i18n support with existing translation keys
- **Theme Support**: Dark/light mode variants with system preference detection
- **Animation**: Smooth fade-in effects and transition behaviors
- **Service Integration**: Programmatic control via PopupService for authentication flows

## Usage Patterns
- Password security notices and updates
- Authentication workflow dialogs
- User confirmations and alerts
- Form validation messages
- System notifications

## Accessibility Features
- Focus trap management
- ARIA dialog attributes
- Keyboard navigation (Escape to close, Tab cycling)
- Screen reader announcements
- High contrast support
- Minimum 44x44px touch targets
        `,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'gray', value: '#f8fafc' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls the popup visibility state',
    },
    title: {
      control: 'text',
      description: 'Main heading displayed in the popup header',
    },
    message: {
      control: 'text',
      description: 'Primary content message in the popup body',
    },
    type: {
      control: { type: 'select' },
      options: ['info', 'warning', 'error', 'success', 'password-security'],
      description: 'Visual style variant for different popup types',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size variant for different content amounts',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Whether to show the X close button in header',
    },
    closeOnOverlayClick: {
      control: 'boolean',
      description: 'Whether clicking the overlay closes the popup',
    },
    closeOnEscape: {
      control: 'boolean',
      description: 'Whether pressing Escape closes the popup',
    },
    primaryButtonText: {
      control: 'text',
      description: 'Text for the primary action button',
    },
    secondaryButtonText: {
      control: 'text',
      description: 'Text for the secondary action button',
    },
    onClose: { 
      action: 'closed',
      description: 'Callback fired when popup is closed',
    },
    onPrimaryAction: { 
      action: 'primary-action',
      description: 'Callback fired when primary button is clicked',
    },
    onSecondaryAction: { 
      action: 'secondary-action',
      description: 'Callback fired when secondary button is clicked',
    },
  },
} satisfies Meta<typeof Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

// Demo component to trigger popups for interactive testing
const PopupDemo = ({ children, ...args }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    args.onClose?.();
  };

  return (
    <div>
      <Button onClick={handleOpen} variant="primary">
        Open Popup
      </Button>
      <Popup
        {...args}
        isOpen={isOpen}
        onClose={handleClose}
        onPrimaryAction={() => {
          args.onPrimaryAction?.();
          handleClose();
        }}
        onSecondaryAction={() => {
          args.onSecondaryAction?.();
          handleClose();
        }}
      >
        {children}
      </Popup>
    </div>
  );
};

/**
 * Default popup with basic configuration showing standard dialog behavior
 */
export const Default: Story = {
  render: (args) => <PopupDemo {...args} />,
  args: {
    title: 'Confirmation Required',
    message: 'Are you sure you want to proceed with this action?',
    type: 'info',
    size: 'md',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    primaryButtonText: 'Confirm',
    secondaryButtonText: 'Cancel',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const openButton = canvas.getByRole('button', { name: /open popup/i });
    
    // Test opening popup
    await userEvent.click(openButton);
    
    // Verify popup is visible and accessible
    const dialog = canvas.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveFocus();
    
    // Test keyboard navigation
    await userEvent.keyboard('{Escape}');
    expect(dialog).not.toBeInTheDocument();
  },
};

/**
 * Password Security Notice - Primary use case for user authentication flows
 */
export const PasswordSecurityNotice: Story = {
  render: (args) => <PopupDemo {...args} />,
  args: {
    title: 'Password Security Update',
    message: 'Your password has expired and must be updated to continue accessing the system. Please update your password now to maintain account security.',
    type: 'password-security',
    size: 'md',
    showCloseButton: false,
    closeOnOverlayClick: false,
    closeOnEscape: false,
    primaryButtonText: 'Update Password',
    secondaryButtonText: 'Log Out',
  },
  parameters: {
    docs: {
      description: {
        story: `
Password security notice popup used in authentication workflows. This variant:
- Prevents dismissal via overlay click or escape key
- Forces user action for security compliance
- Uses warning visual styling with lock icon
- Provides clear password update action flow
        `,
      },
    },
  },
};

/**
 * Multi-language Support demonstrating internationalization capabilities
 */
export const InternationalizationExample: Story = {
  render: (args) => {
    const [language, setLanguage] = useState('en');
    
    const translations = {
      en: {
        title: 'Database Connection Test',
        message: 'Testing connection to MySQL database "production_db". This may take a few moments.',
        primary: 'Retry Connection',
        secondary: 'Cancel Test',
      },
      es: {
        title: 'Prueba de Conexión de Base de Datos',
        message: 'Probando conexión a la base de datos MySQL "production_db". Esto puede tomar unos momentos.',
        primary: 'Reintentar Conexión',
        secondary: 'Cancelar Prueba',
      },
      fr: {
        title: 'Test de Connexion à la Base de Données',
        message: 'Test de connexion à la base de données MySQL "production_db". Cela peut prendre quelques instants.',
        primary: 'Réessayer la Connexion',
        secondary: 'Annuler le Test',
      },
      de: {
        title: 'Datenbankverbindungstest',
        message: 'Teste Verbindung zur MySQL-Datenbank "production_db". Dies kann einen Moment dauern.',
        primary: 'Verbindung Wiederholen',
        secondary: 'Test Abbrechen',
      },
    };

    const t = translations[language as keyof typeof translations];

    return (
      <div>
        <div className="mb-4 flex gap-2">
          <Button
            variant={language === 'en' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
          >
            <Globe className="w-4 h-4 mr-1" />
            English
          </Button>
          <Button
            variant={language === 'es' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setLanguage('es')}
          >
            <Globe className="w-4 h-4 mr-1" />
            Español
          </Button>
          <Button
            variant={language === 'fr' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setLanguage('fr')}
          >
            <Globe className="w-4 h-4 mr-1" />
            Français
          </Button>
          <Button
            variant={language === 'de' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setLanguage('de')}
          >
            <Globe className="w-4 h-4 mr-1" />
            Deutsch
          </Button>
        </div>
        <PopupDemo
          {...args}
          title={t.title}
          message={t.message}
          primaryButtonText={t.primary}
          secondaryButtonText={t.secondary}
        />
      </div>
    );
  },
  args: {
    type: 'info',
    size: 'md',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates internationalization support with multiple languages. The popup integrates
with the existing i18n system and shows how content adapts to different locales while
maintaining consistent UI structure and accessibility features.
        `,
      },
    },
  },
};

/**
 * Authentication Workflow with dynamic content and state management
 */
export const AuthenticationWorkflow: Story = {
  render: (args) => {
    const [step, setStep] = useState<'password-prompt' | 'updating' | 'success' | 'error'>('password-prompt');
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');

    const handlePasswordUpdate = async () => {
      setStep('updating');
      
      // Simulate API call
      setTimeout(() => {
        if (password.length >= 8) {
          setStep('success');
          setTimeout(() => {
            setStep('password-prompt');
            setPassword('');
          }, 2000);
        } else {
          setStep('error');
          setTimeout(() => setStep('password-prompt'), 3000);
        }
      }, 1500);
    };

    const stepContent = {
      'password-prompt': {
        title: 'Update Password Required',
        type: 'password-security' as const,
        primaryText: 'Update Password',
        secondaryText: 'Log Out',
        showClose: false,
        content: (
          <div className="space-y-4">
            <p>Your password has expired. Please enter a new password to continue.</p>
            <div className="space-y-2">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password"
                  minLength={8}
                  required
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p id="password-requirements" className="text-xs text-gray-500 dark:text-gray-400">
                Password must be at least 8 characters long
              </p>
            </div>
          </div>
        ),
      },
      'updating': {
        title: 'Updating Password...',
        type: 'info' as const,
        primaryText: '',
        secondaryText: '',
        showClose: false,
        content: (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p>Please wait while we update your password...</p>
          </div>
        ),
      },
      'success': {
        title: 'Password Updated Successfully',
        type: 'success' as const,
        primaryText: '',
        secondaryText: '',
        showClose: false,
        content: (
          <div className="text-center space-y-4">
            <Check className="w-12 h-12 text-green-500 mx-auto" />
            <p>Your password has been updated successfully. Redirecting...</p>
          </div>
        ),
      },
      'error': {
        title: 'Password Update Failed',
        type: 'error' as const,
        primaryText: '',
        secondaryText: '',
        showClose: false,
        content: (
          <div className="text-center space-y-4">
            <X className="w-12 h-12 text-red-500 mx-auto" />
            <p>Password must be at least 8 characters long. Please try again.</p>
          </div>
        ),
      },
    };

    const currentContent = stepContent[step];

    return (
      <PopupDemo
        {...args}
        title={currentContent.title}
        type={currentContent.type}
        showCloseButton={currentContent.showClose}
        closeOnOverlayClick={false}
        closeOnEscape={false}
        primaryButtonText={currentContent.primaryText}
        secondaryButtonText={currentContent.secondaryText}
        onPrimaryAction={step === 'password-prompt' ? handlePasswordUpdate : undefined}
      >
        {currentContent.content}
      </PopupDemo>
    );
  },
  args: {
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: `
Complex authentication workflow demonstrating multi-step popups with:
- Dynamic content based on current state
- Form input validation and accessibility
- Loading states with progress indicators  
- Success and error state handling
- Password visibility toggle with screen reader support
        `,
      },
    },
  },
};

/**
 * Accessibility Features showcase for keyboard navigation and screen reader support
 */
export const AccessibilityShowcase: Story = {
  render: (args) => {
    const [announcements, setAnnouncements] = useState<string[]>([]);
    
    const addAnnouncement = (message: string) => {
      setAnnouncements(prev => [...prev, message]);
      setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 3000);
    };

    return (
      <div>
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Accessibility Features:</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Keyboard Navigation:</strong> Use Tab to navigate, Escape to close</li>
            <li>• <strong>Focus Management:</strong> Focus is trapped within popup</li>
            <li>• <strong>Screen Reader:</strong> Proper ARIA labels and live regions</li>
            <li>• <strong>High Contrast:</strong> All colors meet WCAG 2.1 AA requirements</li>
            <li>• <strong>Touch Targets:</strong> Minimum 44x44px interactive areas</li>
          </ul>
        </div>
        
        {announcements.length > 0 && (
          <div 
            aria-live="polite" 
            aria-atomic="true"
            className="mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded border-l-4 border-green-500"
          >
            <strong>Screen Reader Announcement:</strong> {announcements[announcements.length - 1]}
          </div>
        )}

        <PopupDemo
          {...args}
          onClose={() => addAnnouncement('Security notice popup closed')}
          onPrimaryAction={() => addAnnouncement('Password update initiated')}
          onSecondaryAction={() => addAnnouncement('User logged out for security')}
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  This popup demonstrates full accessibility compliance including proper
                  ARIA attributes, keyboard navigation, and screen reader support.
                </p>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <p><strong>Try these accessibility features:</strong></p>
                  <ul className="list-disc ml-4 mt-1 space-y-1">
                    <li>Navigate with Tab key between buttons</li>
                    <li>Press Escape to close the popup</li>
                    <li>Screen reader will announce popup opening and content</li>
                    <li>Focus is automatically managed and trapped</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </PopupDemo>
      </div>
    );
  },
  args: {
    title: 'Accessibility-Compliant Security Notice',
    type: 'warning',
    size: 'lg',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    primaryButtonText: 'Update Password',
    secondaryButtonText: 'Log Out',
  },
  parameters: {
    docs: {
      description: {
        story: `
Comprehensive accessibility demonstration showing WCAG 2.1 AA compliance features:
- Keyboard navigation with proper tab order and focus management
- Screen reader support with ARIA labels and live region announcements
- High contrast colors meeting accessibility requirements
- Proper semantic markup and focus trap implementation
- Minimum touch target sizes for mobile accessibility
        `,
      },
    },
  },
};

/**
 * Responsive Design showing mobile-first approach and cross-device compatibility
 */
export const ResponsiveDesign: Story = {
  render: (args) => {
    const [viewport, setViewport] = useState('desktop');
    
    const viewports = {
      mobile: { width: '375px', label: 'Mobile (375px)' },
      tablet: { width: '768px', label: 'Tablet (768px)' },
      desktop: { width: '100%', label: 'Desktop (100%)' },
    };

    return (
      <div>
        <div className="mb-4 flex gap-2 flex-wrap">
          {Object.entries(viewports).map(([key, { label }]) => (
            <Button
              key={key}
              variant={viewport === key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewport(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        
        <div 
          className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden"
          style={{ 
            width: viewports[viewport as keyof typeof viewports].width,
            minHeight: '500px',
            margin: '0 auto'
          }}
        >
          <div className="h-full bg-gray-50 dark:bg-gray-900 relative">
            <PopupDemo {...args}>
              <div className="space-y-4">
                <p>
                  This popup adapts to different screen sizes using mobile-first responsive design principles.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <h4 className="font-medium text-sm">Mobile</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Full-width layout with stacked buttons
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <h4 className="font-medium text-sm">Desktop</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Centered with optimal reading width
                    </p>
                  </div>
                </div>
              </div>
            </PopupDemo>
          </div>
        </div>
      </div>
    );
  },
  args: {
    title: 'Responsive Popup Example',
    type: 'info',
    size: 'md',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    primaryButtonText: 'Confirm Action',
    secondaryButtonText: 'Cancel',
  },
  parameters: {
    docs: {
      description: {
        story: `
Responsive design demonstration showing how the popup adapts to different screen sizes:
- Mobile-first approach with touch-friendly interaction areas
- Responsive typography and spacing that scales appropriately
- Adaptive button layouts (stacked on mobile, inline on desktop)
- Optimized content flow for different viewport sizes
- Consistent experience across all device types
        `,
      },
    },
  },
};

/**
 * Dark Mode Theme variants showing consistent appearance across themes
 */
export const DarkModeVariants: Story = {
  render: (args) => {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
    
    return (
      <div>
        <div className="mb-4 flex gap-2">
          <Button
            variant={theme === 'light' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
          >
            ☀️ Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
          >
            🌙 Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTheme('system')}
          >
            💻 System
          </Button>
        </div>
        
        <div className={theme === 'dark' ? 'dark' : ''}>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <PopupDemo {...args}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-orange-500" aria-hidden="true" />
                  <span className="font-medium">Theme Adaptation</span>
                </div>
                <p>
                  This popup automatically adapts to light and dark themes while maintaining
                  accessibility contrast requirements in both modes.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-medium">Light Theme</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Optimized for bright environments
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-medium">Dark Theme</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Reduced eye strain in low light
                    </div>
                  </div>
                </div>
              </div>
            </PopupDemo>
          </div>
        </div>
      </div>
    );
  },
  args: {
    title: 'Theme-Aware Security Notice',
    type: 'password-security',
    size: 'md',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    primaryButtonText: 'Update Password',
    secondaryButtonText: 'Remind Later',
  },
  parameters: {
    docs: {
      description: {
        story: `
Dark mode theme variants demonstrating consistent appearance and accessibility
across different theme preferences:
- Automatic adaptation to system theme preference
- Maintained contrast ratios in both light and dark modes
- Consistent visual hierarchy and branding
- Smooth transitions between theme states
- Proper color token usage for theme compatibility
        `,
      },
    },
  },
};

/**
 * Animation and Transitions showing smooth fade-in effects
 */
export const AnimationShowcase: Story = {
  render: (args) => {
    const [animationSpeed, setAnimationSpeed] = useState('normal');
    
    const speeds = {
      fast: { duration: '150ms', label: 'Fast (150ms)' },
      normal: { duration: '300ms', label: 'Normal (300ms)' },
      slow: { duration: '500ms', label: 'Slow (500ms)' },
    };

    return (
      <div>
        <div className="mb-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Animation Speed:</label>
            <div className="flex gap-2 mt-1">
              {Object.entries(speeds).map(([key, { label }]) => (
                <Button
                  key={key}
                  variant={animationSpeed === key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setAnimationSpeed(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Animation features smooth fade-in effects with configurable timing for different user preferences.
          </div>
        </div>
        
        <PopupDemo 
          {...args}
          style={{ 
            '--popup-animation-duration': speeds[animationSpeed as keyof typeof speeds].duration 
          } as any}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" aria-hidden="true" />
              <span className="font-medium">Animation Demo</span>
            </div>
            <p>
              This popup demonstrates smooth fade-in animations with configurable timing.
              The animation respects user preferences for reduced motion when set in their system.
            </p>
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border-l-4 border-amber-500">
              <p className="text-sm">
                <strong>Accessibility Note:</strong> Animations respect the `prefers-reduced-motion` 
                media query to provide a better experience for users with vestibular disorders.
              </p>
            </div>
          </div>
        </PopupDemo>
      </div>
    );
  },
  args: {
    title: 'Animation & Transition Demo',
    type: 'warning',
    size: 'lg',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    primaryButtonText: 'Acknowledge',
    secondaryButtonText: 'Dismiss',
  },
  parameters: {
    docs: {
      description: {
        story: `
Animation and transition showcase demonstrating:
- Smooth fade-in effects with CSS transitions
- Configurable animation timing for different preferences  
- Respect for user's reduced motion preferences
- Overlay and modal animations that feel natural
- Performance-optimized transitions using CSS transforms
        `,
      },
    },
  },
};

/**
 * Programmatic Control via PopupService for authentication workflows
 */
export const ProgrammaticControl: Story = {
  render: (args) => {
    const [logs, setLogs] = useState<string[]>([]);
    
    const addLog = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-5));
    };

    const showPasswordExpiredPopup = () => {
      addLog('Triggering password expired popup via service');
      PopupService.show({
        title: 'Password Expired',
        message: 'Your password has expired and must be updated immediately.',
        type: 'password-security',
        size: 'md',
        showCloseButton: false,
        closeOnOverlayClick: false,
        closeOnEscape: false,
        primaryButtonText: 'Update Now',
        secondaryButtonText: 'Log Out',
        onPrimaryAction: () => {
          addLog('User chose to update password');
          PopupService.hide();
          showPasswordUpdatePopup();
        },
        onSecondaryAction: () => {
          addLog('User chose to log out');
          PopupService.hide();
        },
      });
    };

    const showPasswordUpdatePopup = () => {
      addLog('Showing password update form');
      PopupService.show({
        title: 'Update Your Password',
        type: 'info',
        size: 'md',
        showCloseButton: false,
        closeOnOverlayClick: false,
        closeOnEscape: false,
        primaryButtonText: 'Save Password',
        secondaryButtonText: 'Cancel',
        onPrimaryAction: () => {
          addLog('Password update initiated');
          PopupService.hide();
          showSuccessPopup();
        },
        onSecondaryAction: () => {
          addLog('Password update cancelled');
          PopupService.hide();
        },
        children: (
          <div className="space-y-4">
            <p>Please enter your new password below:</p>
            <input
              type="password"
              placeholder="New password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        ),
      });
    };

    const showSuccessPopup = () => {
      addLog('Showing success confirmation');
      PopupService.show({
        title: 'Password Updated Successfully',
        message: 'Your password has been updated. You can now continue using the application.',
        type: 'success',
        size: 'sm',
        showCloseButton: false,
        closeOnOverlayClick: false,
        closeOnEscape: false,
        primaryButtonText: 'Continue',
        onPrimaryAction: () => {
          addLog('User acknowledged password update');
          PopupService.hide();
        },
      });
    };

    const showApiErrorPopup = () => {
      addLog('Simulating API error popup');
      PopupService.show({
        title: 'Database Connection Failed',
        message: 'Unable to connect to the database server. Please check your connection settings and try again.',
        type: 'error',
        size: 'md',
        showCloseButton: true,
        closeOnOverlayClick: true,
        closeOnEscape: true,
        primaryButtonText: 'Retry Connection',
        secondaryButtonText: 'Cancel',
        onPrimaryAction: () => {
          addLog('Retrying database connection');
          PopupService.hide();
        },
        onSecondaryAction: () => {
          addLog('Database connection cancelled');
          PopupService.hide();
        },
      });
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={showPasswordExpiredPopup} variant="primary">
            🔒 Password Expired Flow
          </Button>
          <Button onClick={showApiErrorPopup} variant="outline">
            ❌ API Error Popup
          </Button>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Service Usage Log:</h3>
          <div className="space-y-1 text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">
                Click a button above to see PopupService in action...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-gray-700 dark:text-gray-300">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>PopupService Usage:</strong></p>
          <ul className="list-disc ml-4 mt-1 space-y-1">
            <li>Programmatic popup control for authentication workflows</li>
            <li>Chained popup sequences for multi-step processes</li>
            <li>Global popup state management</li>
            <li>Integration with API error handling</li>
          </ul>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: `
Programmatic popup control demonstration using PopupService for complex workflows:
- Authentication flow management with chained popups
- API error handling with retry mechanisms
- Global popup state management
- Integration with form validation and user management
- Service-based popup triggering for automated workflows
        `,
      },
    },
  },
};

/**
 * Size Variants showing different popup sizes for various content types
 */
export const SizeVariants: Story = {
  render: (args) => {
    const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
    
    const sizeContent = {
      sm: {
        title: 'Quick Confirmation',
        message: 'Are you sure?',
        content: 'Small popups are perfect for simple confirmations and alerts.',
      },
      md: {
        title: 'Password Security Notice',
        message: 'Your password needs to be updated for security compliance.',
        content: 'Medium popups work well for most content including forms and detailed messages.',
      },
      lg: {
        title: 'Database Schema Import Configuration',
        message: 'Configure your database schema import settings before proceeding with the operation.',
        content: 'Large popups accommodate more complex content like configuration forms, detailed explanations, and multi-step processes.',
      },
      xl: {
        title: 'Comprehensive API Documentation Viewer',
        message: 'Review the complete API documentation and examples for your database service endpoints.',
        content: 'Extra large popups are ideal for comprehensive content like documentation, detailed forms, or data visualization that requires maximum screen real estate.',
      },
    };

    const currentContent = sizeContent[selectedSize];

    return (
      <div>
        <div className="mb-4">
          <label className="text-sm font-medium">Select Size:</label>
          <div className="flex gap-2 mt-1">
            {Object.keys(sizeContent).map((size) => (
              <Button
                key={size}
                variant={selectedSize === size ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedSize(size as any)}
              >
                {size.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        
        <PopupDemo
          {...args}
          size={selectedSize}
          title={currentContent.title}
          message={currentContent.message}
        >
          <div className="space-y-4">
            <p>{currentContent.content}</p>
            {selectedSize === 'lg' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <h4 className="font-medium text-sm">Import Options</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                    <li>• Tables and views</li>
                    <li>• Relationships</li>
                    <li>• Stored procedures</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                  <h4 className="font-medium text-sm">Validation</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                    <li>• Schema integrity</li>
                    <li>• Data type mapping</li>
                    <li>• Constraint validation</li>
                  </ul>
                </div>
              </div>
            )}
            {selectedSize === 'xl' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                  <h4 className="font-medium mb-2">API Endpoints</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">GET /api/v2/db</code>
                      <span className="text-green-600">200 OK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">POST /api/v2/db</code>
                      <span className="text-green-600">201 Created</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">PUT /api/v2/db/{id}</code>
                      <span className="text-green-600">200 OK</span>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded">
                  <h4 className="font-medium mb-2">Authentication</h4>
                  <p className="text-sm">All API endpoints require authentication via API key or session token.</p>
                </div>
              </div>
            )}
          </div>
        </PopupDemo>
      </div>
    );
  },
  args: {
    type: 'info',
    showCloseButton: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    primaryButtonText: 'Proceed',
    secondaryButtonText: 'Cancel',
  },
  parameters: {
    docs: {
      description: {
        story: `
Size variants demonstration showing appropriate popup sizes for different content types:
- **Small (sm)**: Quick confirmations and simple alerts
- **Medium (md)**: Standard forms and notifications (default)
- **Large (lg)**: Complex forms and detailed content
- **Extra Large (xl)**: Comprehensive documentation and data-heavy interfaces

Each size maintains responsive behavior and accessibility standards.
        `,
      },
    },
  },
};