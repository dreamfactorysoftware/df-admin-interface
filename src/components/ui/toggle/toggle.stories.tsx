import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Toggle } from './toggle';
import { toggleVariants } from './toggle-variants';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A toggle switch component for binary state controls. Designed to replace Angular Material mat-slide-toggle 
with enhanced accessibility, customization options, and React 19 optimizations.

## Features

- **Accessibility**: WCAG 2.1 AA compliant with proper keyboard navigation and screen reader support
- **Variants**: Multiple sizes, colors, and label positions
- **Form Integration**: Works seamlessly with React Hook Form and validation
- **Dark Mode**: Full dark mode support with proper contrast ratios
- **Responsive**: Touch-friendly with appropriate target sizes
- **Keyboard Navigation**: Full keyboard support with Enter and Space keys
- **Loading States**: Displays loading state during async operations

## Usage

\`\`\`tsx
import { Toggle } from '@/components/ui/toggle';

// Basic usage
<Toggle label="Enable notifications" />

// Controlled component
<Toggle 
  checked={isEnabled} 
  onCheckedChange={setIsEnabled}
  label="Feature toggle"
/>

// With React Hook Form
<Controller
  name="settings.notifications"
  control={control}
  render={({ field }) => (
    <Toggle
      label="Email notifications"
      checked={field.value}
      onCheckedChange={field.onChange}
    />
  )}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Toggle size variant',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
      description: 'Toggle color variant',
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Label position relative to toggle',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable toggle interactions',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    required: {
      control: 'boolean',
      description: 'Mark toggle as required for forms',
    },
    checked: {
      control: 'boolean',
      description: 'Controlled checked state',
    },
    defaultChecked: {
      control: 'boolean',
      description: 'Default checked state for uncontrolled usage',
    },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    label: 'Default toggle',
    'aria-describedby': 'default-toggle-description',
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic toggle with default styling and medium size.',
      },
    },
  },
  render: (args) => (
    <div className="space-y-2">
      <Toggle {...args} />
      <p id="default-toggle-description" className="text-sm text-gray-600 dark:text-gray-400">
        This is the default toggle appearance with medium size.
      </p>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    label: 'Checked toggle',
    defaultChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle in checked state by default.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled toggle',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled toggle that cannot be interacted with.',
      },
    },
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled checked toggle',
    disabled: true,
    defaultChecked: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled toggle in checked state.',
      },
    },
  },
};

// Size Variants
export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Available size variants: small (sm), medium (md), and large (lg).',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <Toggle size="sm" label="Small toggle" />
      <Toggle size="md" label="Medium toggle (default)" />
      <Toggle size="lg" label="Large toggle" />
    </div>
  ),
};

// Color Variants
export const ColorVariants: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Color variants for different semantic meanings.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <Toggle variant="default" label="Default variant" defaultChecked />
      <Toggle variant="success" label="Success variant" defaultChecked />
      <Toggle variant="warning" label="Warning variant" defaultChecked />
      <Toggle variant="error" label="Error variant" defaultChecked />
    </div>
  ),
};

// Label Positioning
export const LabelPositions: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Label can be positioned to the left or right of the toggle.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <Toggle labelPosition="left" label="Label on left" />
      <Toggle labelPosition="right" label="Label on right" />
    </div>
  ),
};

// Loading State
export const Loading: Story = {
  args: {
    label: 'Loading toggle',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle showing loading state with spinner animation.',
      },
    },
  },
};

// Controlled vs Uncontrolled
export const ControlledExample: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Controlled toggle where state is managed by parent component.',
      },
    },
  },
  render: () => {
    const [checked, setChecked] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Controlled Toggles</h3>
          <div className="space-y-4">
            <Toggle
              label="Feature enabled"
              checked={checked}
              onCheckedChange={setChecked}
              description="Current state controlled by React state"
            />
            <Toggle
              label="Email notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
            <Toggle
              label="Dark mode"
              checked={darkMode}
              onCheckedChange={setDarkMode}
              variant={darkMode ? 'default' : 'default'}
            />
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Current State:</h4>
          <ul className="text-sm space-y-1">
            <li>Feature enabled: {checked ? 'Yes' : 'No'}</li>
            <li>Notifications: {notifications ? 'Enabled' : 'Disabled'}</li>
            <li>Dark mode: {darkMode ? 'On' : 'Off'}</li>
          </ul>
        </div>
      </div>
    );
  },
};

export const UncontrolledExample: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Uncontrolled toggles manage their own state internally.',
      },
    },
  },
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-3">Uncontrolled Toggles</h3>
      <Toggle
        label="Auto-save documents"
        defaultChecked={true}
        onCheckedChange={(checked) => console.log('Auto-save:', checked)}
      />
      <Toggle
        label="Show advanced options"
        defaultChecked={false}
        onCheckedChange={(checked) => console.log('Advanced options:', checked)}
      />
      <Toggle
        label="Enable analytics"
        defaultChecked={false}
        onCheckedChange={(checked) => console.log('Analytics:', checked)}
      />
    </div>
  ),
};

// Form Integration
export const FormIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Integration with React Hook Form including validation and error handling.',
      },
    },
  },
  render: () => {
    const settingsSchema = z.object({
      notifications: z.boolean(),
      emailAlerts: z.boolean(),
      marketing: z.boolean(),
      terms: z.boolean().refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
      newsletter: z.boolean().optional(),
    });

    type SettingsForm = z.infer<typeof settingsSchema>;

    const {
      control,
      handleSubmit,
      formState: { errors, isSubmitting },
      watch,
    } = useForm<SettingsForm>({
      resolver: zodResolver(settingsSchema),
      defaultValues: {
        notifications: true,
        emailAlerts: false,
        marketing: false,
        terms: false,
        newsletter: false,
      },
    });

    const watchedValues = watch();

    const onSubmit = async (data: SettingsForm) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Form submitted:', data);
      alert('Settings saved successfully!');
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
        <div>
          <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Toggle
                name="notifications"
                control={control}
                label="Push notifications"
                description="Receive notifications on your device"
              />
            </div>

            <div>
              <Toggle
                name="emailAlerts"
                control={control}
                label="Email alerts"
                description="Get important updates via email"
              />
            </div>

            <div>
              <Toggle
                name="marketing"
                control={control}
                label="Marketing emails"
                description="Receive promotional content and offers"
              />
            </div>

            <div>
              <Toggle
                name="newsletter"
                control={control}
                label="Newsletter subscription"
                description="Monthly newsletter with tips and updates"
                variant="success"
              />
            </div>

            <div>
              <Toggle
                name="terms"
                control={control}
                label="I accept the terms and conditions"
                required
                error={errors.terms?.message}
                variant={errors.terms ? 'error' : 'default'}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Current Values:</h4>
          <pre className="text-sm">
            {JSON.stringify(watchedValues, null, 2)}
          </pre>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    );
  },
};

// Accessibility Features
export const AccessibilityFeatures: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility features including keyboard navigation, ARIA attributes, and screen reader support.',
      },
    },
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
        <div className="space-y-4">
          <Toggle
            label="High contrast mode"
            description="Increases contrast for better visibility"
            aria-describedby="contrast-help"
          />
          <p id="contrast-help" className="text-sm text-gray-600 dark:text-gray-400">
            This setting will increase the contrast ratio to meet WCAG AAA standards.
          </p>

          <Toggle
            label="Screen reader announcements"
            required
            aria-describedby="sr-help"
          />
          <p id="sr-help" className="text-sm text-gray-600 dark:text-gray-400">
            Required setting for screen reader users.
          </p>

          <Toggle
            label="Keyboard navigation shortcuts"
            defaultChecked
            aria-describedby="keyboard-help"
          />
          <p id="keyboard-help" className="text-sm text-gray-600 dark:text-gray-400">
            Enable keyboard shortcuts for faster navigation.
          </p>
        </div>
      </div>

      <div className="p-4 border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Keyboard Instructions
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li><kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">Tab</kbd> - Navigate to toggle</li>
          <li><kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">Space</kbd> or <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">Enter</kbd> - Toggle state</li>
          <li><kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded">Escape</kbd> - Remove focus</li>
        </ul>
      </div>
    </div>
  ),
};

// Dark Mode Demonstration
export const DarkModeCompatibility: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Toggle appearance in both light and dark themes, ensuring proper contrast ratios.',
      },
    },
  },
  render: () => {
    const [isDark, setIsDark] = useState(false);

    return (
      <div className={isDark ? 'dark' : ''}>
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Theme Preview
            </h3>
            <Toggle
              label="Dark mode"
              checked={isDark}
              onCheckedChange={setIsDark}
            />
          </div>

          <div className="space-y-4">
            <Toggle label="Default variant" defaultChecked variant="default" />
            <Toggle label="Success variant" defaultChecked variant="success" />
            <Toggle label="Warning variant" defaultChecked variant="warning" />
            <Toggle label="Error variant" defaultChecked variant="error" />
            <Toggle label="Disabled state" disabled />
            <Toggle label="Loading state" loading />
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All variants maintain WCAG 2.1 AA contrast ratios (4.5:1) in both light and dark themes.
            </p>
          </div>
        </div>
      </div>
    );
  },
};

// Advanced Usage Patterns
export const AdvancedPatterns: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Advanced usage patterns including conditional logic, grouped toggles, and complex form scenarios.',
      },
    },
  },
  render: () => {
    const [masterEnabled, setMasterEnabled] = useState(false);
    const [features, setFeatures] = useState({
      feature1: false,
      feature2: false,
      feature3: false,
    });

    const handleMasterToggle = (checked: boolean) => {
      setMasterEnabled(checked);
      if (!checked) {
        setFeatures({ feature1: false, feature2: false, feature3: false });
      }
    };

    const handleFeatureToggle = (feature: keyof typeof features, checked: boolean) => {
      setFeatures(prev => ({ ...prev, [feature]: checked }));
    };

    return (
      <div className="space-y-6 max-w-md">
        <div>
          <h3 className="text-lg font-semibold mb-4">Master Control Pattern</h3>
          
          <Toggle
            label="Enable all features"
            checked={masterEnabled}
            onCheckedChange={handleMasterToggle}
            variant="success"
            size="lg"
          />
        </div>

        <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
          <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
            Individual Features
          </h4>
          
          <div className="space-y-3">
            <Toggle
              label="Advanced search"
              checked={features.feature1}
              onCheckedChange={(checked) => handleFeatureToggle('feature1', checked)}
              disabled={!masterEnabled}
              description="Enhanced search capabilities"
            />
            
            <Toggle
              label="Real-time sync"
              checked={features.feature2}
              onCheckedChange={(checked) => handleFeatureToggle('feature2', checked)}
              disabled={!masterEnabled}
              description="Synchronize data in real-time"
            />
            
            <Toggle
              label="Auto backup"
              checked={features.feature3}
              onCheckedChange={(checked) => handleFeatureToggle('feature3', checked)}
              disabled={!masterEnabled}
              description="Automatic data backup"
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-2">Feature Status:</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Master:</span>
              <span className={masterEnabled ? 'text-green-600' : 'text-gray-500'}>
                {masterEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active features:</span>
              <span>{Object.values(features).filter(Boolean).length}/3</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// Performance and Animation
export const InteractiveStates: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive states showing hover, focus, and active behaviors with smooth animations.',
      },
    },
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Interactive States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Normal States</h4>
            <Toggle label="Hover me" />
            <Toggle label="Focus me" />
            <Toggle label="Click me" />
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Checked States</h4>
            <Toggle label="Hover checked" defaultChecked />
            <Toggle label="Focus checked" defaultChecked />
            <Toggle label="Active checked" defaultChecked />
          </div>
        </div>
      </div>

      <div className="p-4 border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 rounded-lg">
        <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
          Animation Details
        </h4>
        <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
          <li>• Switch animation: 200ms ease-out transition</li>
          <li>• Thumb movement: Smooth slide with spring physics</li>
          <li>• Color transitions: 150ms for hover/focus states</li>
          <li>• Loading spinner: 1s linear rotation</li>
        </ul>
      </div>
    </div>
  ),
};