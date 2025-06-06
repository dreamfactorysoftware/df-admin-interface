/**
 * Toggle Component Stories
 * 
 * Comprehensive Storybook 7+ documentation for Toggle, ToggleField, and ToggleGroup components
 * demonstrating all variants, accessibility features, and integration patterns for the
 * DreamFactory Admin Interface React/Next.js modernization.
 * 
 * Features demonstrated:
 * - WCAG 2.1 AA compliance with proper contrast ratios and touch targets
 * - All size variants (sm, md, lg) and styling options
 * - Label positioning (left, right, top, bottom, none) and variants
 * - State management (default, loading, disabled, error)
 * - Color variants (primary, secondary, success, warning, error, outline, ghost)
 * - Accessibility features including keyboard navigation and screen reader support
 * - React Hook Form integration patterns
 * - Dark mode compatibility and theme adaptation
 * - Controlled and uncontrolled component usage
 * 
 * @fileoverview Storybook stories for Toggle component system
 * @version 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useArgs } from '@storybook/preview-api';
import { Toggle, ToggleField, ToggleGroup, type EnhancedToggleProps } from './toggle';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Story metadata
const meta = {
  title: 'UI Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The Toggle component is a comprehensive, WCAG 2.1 AA compliant switch control built with Headless UI Switch primitive.
It replaces Angular Material mat-slide-toggle with enhanced accessibility, proper keyboard navigation, and responsive design support.

## Key Features

- **Accessibility First**: WCAG 2.1 AA compliance with proper contrast ratios (4.5:1 for text, 3:1 for UI)
- **Touch-Friendly**: Minimum 44x44px touch targets for mobile accessibility
- **Keyboard Navigation**: Focus-visible keyboard navigation with 2px outline system
- **Screen Reader Support**: Proper ARIA labeling and announcements
- **Form Integration**: React Hook Form integration for validation and state management
- **Responsive Design**: Size variants (sm, md, lg) with responsive touch targets
- **Flexible Styling**: Multiple variants, label positions, and custom styling options
- **State Management**: Loading, disabled, and error states with visual feedback
- **Theme Support**: Dark mode compatibility with automatic color adaptation

## Usage Examples

The component supports both controlled and uncontrolled usage patterns, with comprehensive form integration capabilities.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Core toggle props
    value: {
      control: 'boolean',
      description: 'Controlled value of the toggle',
    },
    defaultValue: {
      control: 'boolean',
      description: 'Default value for uncontrolled usage',
    },
    onChange: {
      action: 'changed',
      description: 'Callback fired when toggle value changes',
    },
    
    // Styling variants
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant affecting touch target and visual scale',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'outline', 'ghost'],
      description: 'Visual style variant with different color schemes',
    },
    state: {
      control: 'select',
      options: ['default', 'loading', 'disabled', 'error'],
      description: 'Component state affecting interaction and appearance',
    },
    
    // Label configuration
    label: {
      control: 'text',
      description: 'Toggle label text',
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right', 'top', 'bottom', 'none'],
      description: 'Position of the label relative to the toggle',
    },
    labelVariant: {
      control: 'select',
      options: ['default', 'muted', 'emphasis'],
      description: 'Label styling variant',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to display the label',
    },
    
    // Accessibility props
    'aria-label': {
      control: 'text',
      description: 'Accessible label for screen readers',
    },
    announceOnChange: {
      control: 'text',
      description: 'Message announced to screen readers on state change',
    },
    
    // Form props
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
    },
    loading: {
      control: 'boolean',
      description: 'Whether the toggle is in loading state',
    },
    required: {
      control: 'boolean',
      description: 'Whether the toggle is required in forms',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text displayed below toggle',
    },
    
    // Layout props
    layout: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Layout direction for toggle and label',
    },
    alignment: {
      control: 'select',
      options: ['start', 'center', 'end', 'between'],
      description: 'Alignment of toggle and label within container',
    },
    spacing: {
      control: 'select',
      options: ['compact', 'normal', 'relaxed'],
      description: 'Spacing between toggle and label',
    },
  },
  args: {
    // Default values
    onChange: fn(),
    size: 'md',
    variant: 'primary',
    state: 'default',
    labelPosition: 'right',
    labelVariant: 'default',
    showLabel: true,
    layout: 'horizontal',
    alignment: 'start',
    spacing: 'normal',
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic toggle stories
export const Default: Story = {
  args: {
    label: 'Enable notifications',
    defaultValue: false,
  },
};

export const Checked: Story = {
  args: {
    label: 'Enable notifications',
    defaultValue: true,
  },
};

export const WithoutLabel: Story = {
  args: {
    'aria-label': 'Toggle notifications',
    showLabel: false,
    defaultValue: false,
  },
};

// Size variants
export const SizeVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Size Variants</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          All sizes maintain WCAG 2.1 AA compliance with minimum 44px touch targets
        </p>
      </div>
      
      <div className="space-y-4">
        <Toggle
          size="sm"
          label="Small (44px height)"
          defaultValue={false}
        />
        <Toggle
          size="md"
          label="Medium (48px height) - Default"
          defaultValue={true}
        />
        <Toggle
          size="lg"
          label="Large (56px height)"
          defaultValue={false}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toggle component supports three size variants, all maintaining WCAG accessibility requirements.',
      },
    },
  },
};

// Color variants
export const ColorVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Color Variants</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          All variants maintain proper contrast ratios for accessibility
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Toggle
          variant="primary"
          label="Primary (7.14:1 contrast)"
          defaultValue={true}
        />
        <Toggle
          variant="secondary"
          label="Secondary (7.25:1 contrast)"
          defaultValue={true}
        />
        <Toggle
          variant="success"
          label="Success (4.89:1 contrast)"
          defaultValue={true}
        />
        <Toggle
          variant="warning"
          label="Warning (4.68:1 contrast)"
          defaultValue={true}
        />
        <Toggle
          variant="error"
          label="Error (5.25:1 contrast)"
          defaultValue={true}
        />
        <Toggle
          variant="outline"
          label="Outline variant"
          defaultValue={true}
        />
        <Toggle
          variant="ghost"
          label="Ghost variant"
          defaultValue={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Color variants provide semantic meaning while maintaining accessibility standards.',
      },
    },
  },
};

// Label positioning
export const LabelPositions: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Label Positioning</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Labels can be positioned in multiple ways for different design needs
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Toggle
          labelPosition="left"
          label="Left positioned label"
          defaultValue={false}
        />
        <Toggle
          labelPosition="right"
          label="Right positioned label"
          defaultValue={true}
        />
        <Toggle
          labelPosition="top"
          label="Top positioned label"
          defaultValue={false}
        />
        <Toggle
          labelPosition="bottom"
          label="Bottom positioned label"
          defaultValue={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Labels can be positioned in four directions around the toggle switch.',
      },
    },
  },
};

// States demonstration
export const States: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Component States</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Different states provide visual feedback for various interaction scenarios
        </p>
      </div>
      
      <div className="space-y-4">
        <Toggle
          state="default"
          label="Default state"
          defaultValue={false}
        />
        <Toggle
          state="loading"
          label="Loading state"
          defaultValue={true}
        />
        <Toggle
          state="disabled"
          label="Disabled state"
          defaultValue={false}
        />
        <Toggle
          state="error"
          label="Error state"
          error="Please enable this option"
          defaultValue={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'States provide visual feedback for loading, disabled, and error conditions.',
      },
    },
  },
};

// Accessibility demonstration
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Accessibility Features</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          WCAG 2.1 AA compliant with proper ARIA labeling and keyboard navigation
        </p>
      </div>
      
      <div className="space-y-4">
        <Toggle
          label="Screen reader announcements"
          announceOnChange="Notifications are now {state}"
          defaultValue={false}
          helperText="Changes will be announced to screen readers"
        />
        <Toggle
          label="Required field"
          required
          defaultValue={false}
          helperText="This toggle is required for form submission"
        />
        <Toggle
          aria-label="Hidden label toggle"
          showLabel={false}
          defaultValue={true}
          helperText="Label is hidden but accessible to screen readers"
        />
        <Toggle
          label="Keyboard navigation focus"
          defaultValue={false}
          helperText="Use Tab to focus, Space or Enter to toggle"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates comprehensive accessibility features including ARIA support and keyboard navigation.',
      },
    },
  },
};

// Controlled vs Uncontrolled
export const ControlledExample: Story = {
  render: function ControlledToggle() {
    const [args, updateArgs] = useArgs();
    
    const handleChange = (newValue: boolean) => {
      updateArgs({ value: newValue });
    };
    
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Controlled Component</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Value: {args.value ? 'true' : 'false'}
          </p>
        </div>
        
        <Toggle
          value={args.value}
          onChange={handleChange}
          label="Controlled toggle"
          helperText="State is managed externally"
        />
        
        <button
          type="button"
          onClick={() => handleChange(!args.value)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Toggle from external button
        </button>
      </div>
    );
  },
  args: {
    value: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates controlled usage where the parent component manages the toggle state.',
      },
    },
  },
};

// Form integration with React Hook Form
export const FormIntegration: Story = {
  render: function FormExample() {
    const {
      register,
      handleSubmit,
      watch,
      formState: { errors },
      setValue,
    } = useForm({
      defaultValues: {
        emailNotifications: true,
        pushNotifications: false,
        autoSync: false,
        darkMode: false,
      },
    });
    
    const watchedValues = watch();
    
    const onSubmit = (data: any) => {
      alert(`Form submitted with values: ${JSON.stringify(data, null, 2)}`);
    };
    
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">React Hook Form Integration</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Demonstrates integration with React Hook Form for validation and state management
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Toggle
            {...register('emailNotifications')}
            label="Email notifications"
            variant="primary"
            helperText="Receive updates via email"
          />
          
          <Toggle
            {...register('pushNotifications', {
              required: 'Push notifications are required',
            })}
            label="Push notifications (Required)"
            variant="secondary"
            required
            error={errors.pushNotifications?.message}
            helperText="Browser push notifications"
          />
          
          <Toggle
            {...register('autoSync')}
            label="Auto-sync data"
            variant="success"
            helperText="Automatically sync data in background"
          />
          
          <Toggle
            {...register('darkMode')}
            label="Dark mode"
            variant="outline"
            helperText="Use dark theme"
          />
          
          <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <h4 className="text-sm font-medium mb-2">Current Values:</h4>
            <pre className="text-xs bg-secondary-100 dark:bg-secondary-800 p-3 rounded">
              {JSON.stringify(watchedValues, null, 2)}
            </pre>
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Submit Form
          </button>
        </form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how to integrate Toggle with React Hook Form including validation and error handling.',
      },
    },
  },
};

// Toggle with icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Toggle with Icons</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Icons provide visual context for checked and unchecked states
        </p>
      </div>
      
      <div className="space-y-4">
        <Toggle
          label="With check/x icons"
          checkedIcon={<CheckIcon className="h-3 w-3" />}
          uncheckedIcon={<XMarkIcon className="h-3 w-3" />}
          defaultValue={true}
        />
        <Toggle
          label="Only checked icon"
          checkedIcon={<CheckIcon className="h-4 w-4" />}
          size="lg"
          defaultValue={false}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toggles can display icons to provide additional visual context for their states.',
      },
    },
  },
};

// Dark mode demonstration
export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <div className="bg-secondary-900 p-6 rounded-lg space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Dark Mode Compatibility</h3>
          <p className="text-sm text-secondary-400">
            All variants automatically adapt to dark mode with proper contrast ratios
          </p>
        </div>
        
        <div className="space-y-4">
          <Toggle
            variant="primary"
            label="Primary in dark mode"
            defaultValue={true}
          />
          <Toggle
            variant="success"
            label="Success in dark mode"
            defaultValue={true}
          />
          <Toggle
            variant="outline"
            label="Outline in dark mode"
            defaultValue={false}
          />
          <Toggle
            state="error"
            label="Error state in dark mode"
            error="Error message in dark mode"
            defaultValue={true}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how Toggle components automatically adapt to dark mode while maintaining accessibility.',
      },
    },
  },
};

// ToggleField stories
export const ToggleFieldExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">ToggleField Component</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Enhanced form field wrapper with additional labeling and description capabilities
        </p>
      </div>
      
      <div className="space-y-6">
        <ToggleField
          fieldLabel="Notification Settings"
          description="Control how you receive notifications from the system"
          label="Enable email notifications"
          defaultValue={true}
          helperText="You can change this later in your profile"
        />
        
        <ToggleField
          fieldLabel="Security Features"
          description="Additional security measures for your account"
          label="Two-factor authentication"
          required
          variant="success"
          defaultValue={false}
          helperText="Highly recommended for account security"
        />
        
        <ToggleField
          fieldLabel="Developer Options"
          description="Advanced features for developers and power users"
          label="Enable debug mode"
          variant="warning"
          defaultValue={false}
          error="Debug mode should only be enabled in development"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ToggleField provides enhanced form integration with field labels and descriptions.',
      },
    },
  },
};

// ToggleGroup stories
export const ToggleGroupExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">ToggleGroup Component</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400">
          Group related toggles with coordinated labeling and layout
        </p>
      </div>
      
      <div className="space-y-8">
        <ToggleGroup
          label="Notification Preferences"
          description="Choose which types of notifications you want to receive"
          orientation="vertical"
          spacing="normal"
        >
          <Toggle
            label="Email notifications"
            defaultValue={true}
            helperText="Daily digest emails"
          />
          <Toggle
            label="Push notifications"
            defaultValue={false}
            helperText="Browser push notifications"
          />
          <Toggle
            label="SMS notifications"
            defaultValue={false}
            helperText="Text message alerts"
          />
        </ToggleGroup>
        
        <ToggleGroup
          label="Privacy Settings"
          description="Control your privacy and data sharing preferences"
          orientation="horizontal"
          spacing="relaxed"
          required
        >
          <Toggle
            label="Public profile"
            variant="outline"
            defaultValue={false}
          />
          <Toggle
            label="Share analytics"
            variant="outline"
            defaultValue={false}
          />
          <Toggle
            label="Marketing emails"
            variant="outline"
            defaultValue={true}
          />
        </ToggleGroup>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ToggleGroup organizes related toggles with group labeling and coordinated layout options.',
      },
    },
  },
};

// Performance demonstration
export const PerformanceExample: Story = {
  render: function PerformanceDemo() {
    const [count, setCount] = useState(0);
    
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Performance Characteristics</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Optimized for minimal re-renders and efficient state updates
          </p>
          <p className="text-xs text-secondary-500">
            Render count: {count}
          </p>
        </div>
        
        <div className="space-y-4">
          <Toggle
            label="Optimized toggle"
            onChange={() => setCount(c => c + 1)}
            defaultValue={false}
            helperText="Each toggle updates the render counter"
          />
          
          <Toggle
            label="Another optimized toggle"
            onChange={() => setCount(c => c + 1)}
            defaultValue={true}
            helperText="Independent state management"
          />
          
          <button
            type="button"
            onClick={() => setCount(0)}
            className="px-3 py-1 text-sm bg-secondary-200 text-secondary-700 rounded hover:bg-secondary-300"
          >
            Reset Counter
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates performance characteristics and efficient re-rendering behavior.',
      },
    },
  },
};

// Complete integration example
export const CompleteExample: Story = {
  render: function CompleteExample() {
    const {
      register,
      handleSubmit,
      watch,
      setValue,
      formState: { errors, isSubmitting },
    } = useForm({
      defaultValues: {
        serviceEnabled: true,
        autoBackup: false,
        notifications: true,
        advancedMode: false,
      },
    });
    
    const [loading, setLoading] = useState(false);
    const watchedValues = watch();
    
    const onSubmit = async (data: any) => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setLoading(false);
      alert(`Configuration saved: ${JSON.stringify(data, null, 2)}`);
    };
    
    return (
      <div className="max-w-2xl space-y-8">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Complete Integration Example</h3>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">
            Real-world example showing all Toggle features together
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ToggleGroup
            label="Service Configuration"
            description="Configure your DreamFactory service settings"
            orientation="vertical"
            spacing="normal"
            required
          >
            <ToggleField
              {...register('serviceEnabled', {
                required: 'Service must be enabled',
              })}
              fieldLabel="Database Service"
              description="Enable database connection and API generation"
              label="Service enabled"
              variant="primary"
              size="lg"
              required
              error={errors.serviceEnabled?.message}
              helperText="Required for API endpoint generation"
            />
            
            <ToggleField
              {...register('autoBackup')}
              fieldLabel="Backup Configuration"
              description="Automatic backup settings for your database schemas"
              label="Enable automatic backups"
              variant="success"
              loading={loading && watchedValues.autoBackup}
              helperText="Backups run daily at 2 AM UTC"
            />
            
            <ToggleField
              {...register('notifications')}
              fieldLabel="System Notifications"
              description="Receive alerts about system status and updates"
              label="Enable notifications"
              variant="secondary"
              announceOnChange="Notifications are now {state}"
              checkedIcon={<CheckIcon className="h-4 w-4" />}
              uncheckedIcon={<XMarkIcon className="h-4 w-4" />}
              helperText="Get notified about important system events"
            />
            
            <ToggleField
              {...register('advancedMode')}
              fieldLabel="Advanced Features"
              description="Enable advanced configuration options for power users"
              label="Advanced mode"
              variant="warning"
              labelPosition="left"
              helperText="Enables additional configuration options"
            />
          </ToggleGroup>
          
          <div className="border-t border-secondary-200 dark:border-secondary-700 pt-6">
            <h4 className="text-sm font-medium mb-3">Current Configuration:</h4>
            <div className="bg-secondary-50 dark:bg-secondary-800 p-4 rounded-lg">
              <pre className="text-xs text-secondary-700 dark:text-secondary-300">
                {JSON.stringify(watchedValues, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting || loading ? 'Saving...' : 'Save Configuration'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setValue('serviceEnabled', true);
                setValue('autoBackup', false);
                setValue('notifications', true);
                setValue('advancedMode', false);
              }}
              className="px-4 py-2 bg-secondary-200 text-secondary-700 rounded-md hover:bg-secondary-300 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </form>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete example showing Toggle components in a realistic form configuration scenario.',
      },
    },
  },
};