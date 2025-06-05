import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { within, userEvent, expect } from '@storybook/test';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LookupKeys } from './lookup-keys';
import type { LookupKeysProps, LookupKeyEntry } from './lookup-keys.types';
import { Button } from '../button/button';

/**
 * # LookupKeys Component
 * 
 * The LookupKeys component provides a comprehensive interface for managing dynamic key-value pairs
 * with privacy controls. Migrated from Angular df-lookup-keys to React with React Hook Form integration.
 * 
 * ## Key Features
 * 
 * - **Dynamic Array Management**: Uses React Hook Form's useFieldArray for efficient form state management
 * - **Privacy Controls**: Toggle visibility for sensitive key-value pairs
 * - **Layout Variants**: Supports both table and accordion display modes
 * - **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
 * - **Form Integration**: Seamless integration with parent forms and validation schemas
 * - **Responsive Design**: Adapts to different screen sizes with Tailwind CSS
 * - **Dark Mode Support**: Full theme system integration
 * 
 * ## Migration Notes
 * 
 * This component replaces the Angular df-lookup-keys component with the following improvements:
 * - React Hook Form replaces Angular FormArray for better performance
 * - Headless UI components replace Angular Material for better customization
 * - Tailwind CSS replaces SCSS for utility-first styling
 * - Enhanced accessibility and keyboard navigation
 * - Better TypeScript type safety
 */
const meta: Meta<typeof LookupKeys> = {
  title: 'UI Components/Forms/LookupKeys',
  component: LookupKeys,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The LookupKeys component provides dynamic key-value pair management with privacy controls.
Perfect for API configurations, environment variables, and metadata management.

Built with React Hook Form's useFieldArray for optimal performance and React 19 concurrent features.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['table', 'accordion'],
      description: 'Display variant - table view or accordion panel',
    },
    maxEntries: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Maximum number of key-value entries allowed',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all form interactions',
    },
    showPrivacyToggle: {
      control: 'boolean',
      description: 'Enable privacy toggle for each entry',
    },
    allowEmptyValues: {
      control: 'boolean',
      description: 'Allow entries with empty values',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessibility label for the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LookupKeys>;

// Validation schema for form integration examples
const lookupKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(100, 'Key name too long'),
  value: z.string().max(1000, 'Value too long'),
  private: z.boolean().default(false),
});

const formSchema = z.object({
  lookupKeys: z.array(lookupKeySchema).max(50, 'Too many lookup keys'),
  serviceName: z.string().min(1, 'Service name is required'),
});

type FormData = z.infer<typeof formSchema>;

// Default sample data
const defaultData: LookupKeyEntry[] = [
  { name: 'API_URL', value: 'https://api.example.com', private: false },
  { name: 'SECRET_KEY', value: 'sk_test_123456789', private: true },
  { name: 'TIMEOUT', value: '30000', private: false },
];

// Story decorator for form integration
const withFormProvider = (Story: any, context: any) => {
  const initialData = context.args.initialData || [];
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lookupKeys: initialData,
      serviceName: 'Example Service',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: FormData) => {
    action('form-submit')(data);
    console.log('Form submitted:', data);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Service Name
          </label>
          <input
            id="serviceName"
            {...form.register('serviceName')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            placeholder="Enter service name"
          />
          {form.formState.errors.serviceName && (
            <p className="mt-1 text-sm text-red-600">{form.formState.errors.serviceName.message}</p>
          )}
        </div>
        
        <Story />
        
        <div className="flex gap-3">
          <Button type="submit" disabled={!form.formState.isValid}>
            Save Configuration
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => form.reset()}
          >
            Reset
          </Button>
        </div>
        
        {/* Debug form state */}
        <details className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Form State (Debug)
          </summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(form.watch(), null, 2)}
          </pre>
        </details>
      </form>
    </FormProvider>
  );
};

/**
 * Default story showcasing the basic table layout with sample data.
 * Demonstrates the standard key-value management interface.
 */
export const Default: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: defaultData,
    'aria-label': 'Lookup keys configuration',
  },
  decorators: [withFormProvider],
};

/**
 * Empty state demonstrating the component with no initial data.
 * Shows the "add first entry" experience and empty state messaging.
 */
export const EmptyState: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: [],
    'aria-label': 'Empty lookup keys configuration',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Component state when no lookup keys are present. Shows helpful messaging and the add button.',
      },
    },
  },
};

/**
 * Accordion layout variant for more compact vertical space usage.
 * Useful in forms with multiple sections or limited vertical space.
 */
export const AccordionLayout: Story = {
  args: {
    variant: 'accordion',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: defaultData,
    'aria-label': 'Lookup keys in accordion layout',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Compact accordion layout that can be collapsed to save vertical space. Ideal for complex forms.',
      },
    },
  },
};

/**
 * Disabled state showing all interactions disabled.
 * Useful for read-only views or when form submission is in progress.
 */
export const Disabled: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    disabled: true,
    maxEntries: 20,
    initialData: defaultData,
    'aria-label': 'Disabled lookup keys configuration',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'All form controls are disabled. Used during loading states or read-only views.',
      },
    },
  },
};

/**
 * Configuration without privacy toggles for simpler use cases.
 * When privacy/visibility control is not needed.
 */
export const WithoutPrivacyToggle: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: false,
    maxEntries: 20,
    initialData: [
      { name: 'API_URL', value: 'https://api.example.com', private: false },
      { name: 'VERSION', value: 'v1.2.3', private: false },
      { name: 'ENVIRONMENT', value: 'production', private: false },
    ],
    'aria-label': 'Simple lookup keys configuration',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Simplified version without privacy controls for basic key-value management.',
      },
    },
  },
};

/**
 * Limited entry configuration demonstrating maxEntries constraint.
 * Shows the add button disabled when limit is reached.
 */
export const LimitedEntries: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 3,
    initialData: defaultData, // 3 entries (at limit)
    'aria-label': 'Limited lookup keys configuration',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the maxEntries constraint. Add button is disabled when limit is reached.',
      },
    },
  },
};

/**
 * Validation error states showing form validation in action.
 * Demonstrates how the component handles and displays validation errors.
 */
export const WithValidationErrors: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: [
      { name: '', value: 'https://api.example.com', private: false }, // Invalid: empty name
      { name: 'VERY_LONG_KEY_NAME_THAT_EXCEEDS_THE_MAXIMUM_LENGTH_ALLOWED_FOR_KEY_NAMES_IN_THIS_CONFIGURATION', value: 'value', private: false }, // Invalid: name too long
      { name: 'SECRET_KEY', value: 'sk_test_123456789', private: true },
    ],
    'aria-label': 'Lookup keys with validation errors',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Shows validation errors for empty names and names that exceed length limits.',
      },
    },
  },
};

/**
 * Large dataset demonstrating performance with many entries.
 * Tests the component's ability to handle larger numbers of key-value pairs.
 */
export const LargeDataset: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 50,
    initialData: Array.from({ length: 15 }, (_, i) => ({
      name: `CONFIG_KEY_${i + 1}`,
      value: `value_${i + 1}`,
      private: i % 3 === 0, // Every third item is private
    })),
    'aria-label': 'Large lookup keys dataset',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Performance test with 15 entries to validate smooth scrolling and interaction.',
      },
    },
  },
};

/**
 * Dark mode demonstration with custom theming.
 * Shows the component in dark theme with proper contrast ratios.
 */
export const DarkMode: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: defaultData,
    'aria-label': 'Dark mode lookup keys',
  },
  decorators: [withFormProvider],
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Component rendered in dark mode with proper contrast ratios for accessibility.',
      },
    },
  },
  // Apply dark mode classes
  render: (args) => (
    <div className="dark bg-gray-900 p-6 rounded-lg">
      <LookupKeys {...args} />
    </div>
  ),
};

/**
 * Mobile responsive layout demonstration.
 * Shows how the component adapts to smaller screen sizes.
 */
export const MobileLayout: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: defaultData.slice(0, 2), // Fewer entries for mobile demo
    'aria-label': 'Mobile lookup keys layout',
  },
  decorators: [withFormProvider],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Responsive layout optimized for mobile devices with touch-friendly controls.',
      },
    },
  },
};

/**
 * Accessibility demonstration with keyboard navigation.
 * Tests screen reader support and keyboard-only interaction.
 */
export const AccessibilityDemo: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: defaultData,
    'aria-label': 'Accessible lookup keys configuration',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA labels, keyboard navigation, and screen reader support.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard navigation
    const firstInput = canvas.getByDisplayValue('API_URL');
    await userEvent.tab(); // Focus first input
    
    // Verify accessibility attributes
    expect(firstInput).toHaveAttribute('aria-label');
    
    // Test tab navigation through form
    await userEvent.tab(); // Move to value field
    await userEvent.tab(); // Move to privacy toggle
    await userEvent.tab(); // Move to remove button
    
    // Test add button interaction
    const addButton = canvas.getByRole('button', { name: /add.*entry/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-label');
  },
};

/**
 * Form integration with complex validation schema.
 * Demonstrates integration with parent forms and complex validation rules.
 */
export const ComplexValidation: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 10,
    initialData: [
      { name: 'API_URL', value: 'https://api.example.com', private: false },
    ],
    'aria-label': 'Complex validation lookup keys',
  },
  decorators: [
    (Story) => {
      const complexSchema = z.object({
        lookupKeys: z.array(z.object({
          name: z.string()
            .min(1, 'Key name is required')
            .max(50, 'Key name must be less than 50 characters')
            .regex(/^[A-Z_][A-Z0-9_]*$/, 'Key name must be uppercase with underscores only'),
          value: z.string()
            .min(1, 'Value is required')
            .max(500, 'Value must be less than 500 characters'),
          private: z.boolean(),
        })).min(1, 'At least one lookup key is required'),
        serviceName: z.string().min(1, 'Service name is required'),
      });

      type ComplexFormData = z.infer<typeof complexSchema>;

      const form = useForm<ComplexFormData>({
        resolver: zodResolver(complexSchema),
        defaultValues: {
          lookupKeys: [
            { name: 'API_URL', value: 'https://api.example.com', private: false },
          ],
          serviceName: 'Example Service',
        },
        mode: 'onChange',
      });

      return (
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(action('complex-form-submit'))} className="space-y-6">
            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Name
              </label>
              <input
                id="serviceName"
                {...form.register('serviceName')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Enter service name"
              />
              {form.formState.errors.serviceName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.serviceName.message}</p>
              )}
            </div>
            
            <Story />
            
            <Button type="submit" disabled={!form.formState.isValid}>
              Save Configuration
            </Button>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Validation Rules:</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Key names must be uppercase with underscores only</li>
                <li>Key names: 1-50 characters</li>
                <li>Values: 1-500 characters required</li>
                <li>At least one lookup key required</li>
              </ul>
            </div>
          </form>
        </FormProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Complex validation with strict naming conventions and required fields.',
      },
    },
  },
};

/**
 * Performance test with rapid interactions.
 * Tests the component's responsiveness under rapid user input.
 */
export const PerformanceTest: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 30,
    initialData: [],
    'aria-label': 'Performance test lookup keys',
  },
  decorators: [withFormProvider],
  parameters: {
    docs: {
      description: {
        story: 'Performance test story for rapid user interactions and form updates.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Add multiple entries rapidly
    const addButton = canvas.getByRole('button', { name: /add.*entry/i });
    
    // Add 5 entries quickly
    for (let i = 0; i < 5; i++) {
      await userEvent.click(addButton);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to see updates
    }
    
    // Fill in some data
    const nameInputs = canvas.getAllByLabelText(/key name/i);
    const valueInputs = canvas.getAllByLabelText(/key value/i);
    
    if (nameInputs.length > 0) {
      await userEvent.type(nameInputs[0], 'RAPID_TEST_KEY');
      await userEvent.type(valueInputs[0], 'test_value');
    }
  },
};

/**
 * Integration with external state management.
 * Shows how the component works with external state stores.
 */
export const ExternalStateIntegration: Story = {
  args: {
    variant: 'table',
    showPrivacyToggle: true,
    maxEntries: 20,
    initialData: defaultData,
    'aria-label': 'External state integration lookup keys',
  },
  decorators: [
    (Story) => {
      const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          lookupKeys: defaultData,
          serviceName: 'External State Service',
        },
        mode: 'onChange',
      });

      // Simulate external state changes
      const handleExternalUpdate = () => {
        const newData = [
          { name: 'EXTERNAL_KEY', value: 'external_value', private: false },
          ...form.getValues('lookupKeys'),
        ];
        form.setValue('lookupKeys', newData);
        action('external-state-update')(newData);
      };

      return (
        <FormProvider {...form}>
          <div className="space-y-6">
            <div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleExternalUpdate}
              >
                Simulate External State Update
              </Button>
            </div>
            
            <Story />
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>This story demonstrates how the component responds to external state changes.</p>
            </div>
          </div>
        </FormProvider>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates integration with external state management systems and reactive updates.',
      },
    },
  },
};