/**
 * Storybook Stories for LookupKeys Component
 * 
 * Comprehensive documentation and interactive examples of the LookupKeys component
 * featuring React Hook Form integration, accessibility demonstrations, theme variants,
 * and various usage scenarios for development and design system documentation.
 * 
 * Covers all component states, form integration patterns, accessibility features,
 * dark mode variants, and real-world usage examples with proper validation.
 * 
 * @fileoverview Storybook 7+ stories for LookupKeys component
 * @version 1.0.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { within, userEvent, expect } from '@storybook/test';
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Component imports
import { LookupKeys } from './lookup-keys';
import type { LookupKeyEntry } from './lookup-keys';
import { lookupKeysArraySchema } from './lookup-keys';

// Provider components for theming
const ThemeProvider = ({ children, theme }: { children: React.ReactNode; theme: 'light' | 'dark' }) => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return (
    <div className={`min-h-screen bg-white dark:bg-gray-900 p-6 ${theme}`}>
      {children}
    </div>
  );
};

// Form wrapper component for React Hook Form integration
interface FormWrapperProps {
  defaultValues?: { lookupKeys: LookupKeyEntry[] };
  children: React.ReactNode;
  onSubmit?: (data: any) => void;
  schema?: z.ZodSchema;
}

const FormWrapper = ({ 
  defaultValues = { lookupKeys: [] }, 
  children, 
  onSubmit = action('form-submitted'),
  schema
}: FormWrapperProps) => {
  const formSchema = schema || z.object({
    lookupKeys: lookupKeysArraySchema
  });

  const methods = useForm({
    defaultValues,
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  });

  const handleSubmit = (data: any) => {
    onSubmit(data);
    action('form-data')(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-6">
        {children}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     dark:bg-primary-500 dark:hover:bg-primary-600"
          >
            Save Lookup Keys
          </button>
          <button
            type="button"
            onClick={() => methods.reset()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                     dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Reset Form
          </button>
        </div>
        
        {/* Form state debug info */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
            Debug: Form State
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs overflow-auto">
            {JSON.stringify({
              values: methods.watch(),
              errors: methods.formState.errors,
              isValid: methods.formState.isValid,
              isDirty: methods.formState.isDirty
            }, null, 2)}
          </pre>
        </details>
      </form>
    </FormProvider>
  );
};

// Sample data for stories
const sampleLookupKeys: LookupKeyEntry[] = [
  {
    id: '1',
    name: 'api_version',
    value: 'v2.0',
    private: false,
    description: 'Current API version'
  },
  {
    id: '2',
    name: 'max_connections',
    value: '100',
    private: false,
    description: 'Maximum database connections'
  },
  {
    id: '3',
    name: 'secret_key',
    value: 'super-secret-value',
    private: true,
    description: 'Secret API key for authentication'
  },
  {
    id: '4',
    name: 'debug_mode',
    value: 'false',
    private: false,
    description: 'Enable debug logging'
  }
];

const largeLookupKeysDataset: LookupKeyEntry[] = Array.from({ length: 15 }, (_, i) => ({
  id: `large-${i + 1}`,
  name: `config_key_${i + 1}`,
  value: `configuration_value_${i + 1}`,
  private: i % 3 === 0,
  description: `Sample configuration entry ${i + 1} with detailed description`
}));

// Meta configuration
const meta: Meta<typeof LookupKeys> = {
  title: 'UI Components/LookupKeys',
  component: LookupKeys,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The LookupKeys component provides a dynamic interface for managing key-value pairs with advanced form integration capabilities. 

## Key Features

- **React Hook Form Integration**: Uses useFieldArray for dynamic entry management
- **Real-time Validation**: Zod schema validation with unique name checking
- **Privacy Controls**: Toggle privacy state for sensitive configuration values
- **Accessibility**: Full WCAG 2.1 AA compliance with keyboard navigation and screen reader support
- **Responsive Design**: Table layout with mobile-friendly responsive behavior
- **Theme Support**: Light/dark mode with proper contrast ratios
- **Form States**: Comprehensive error handling and validation feedback

## Usage

The component requires React Hook Form context and should be wrapped with FormProvider. It uses the useFieldArray hook for managing dynamic arrays of lookup key entries.

\`\`\`tsx
import { useForm, FormProvider } from 'react-hook-form';
import { LookupKeys } from '@/components/ui/lookup-keys';

const MyForm = () => {
  const methods = useForm({
    defaultValues: { lookupKeys: [] }
  });

  return (
    <FormProvider {...methods}>
      <LookupKeys name="lookupKeys" />
    </FormProvider>
  );
};
\`\`\`
        `
      }
    },
    controls: {
      exclude: ['onEntriesChange']
    }
  },
  argTypes: {
    name: {
      description: 'Field array name for React Hook Form integration',
      control: 'text'
    },
    showAccordion: {
      description: 'Whether to wrap the component in an accordion interface',
      control: 'boolean'
    },
    disabled: {
      description: 'Disable all form interactions',
      control: 'boolean'
    },
    maxEntries: {
      description: 'Maximum number of entries allowed',
      control: { type: 'number', min: 1, max: 50 }
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text'
    },
    'aria-label': {
      description: 'Accessibility label for screen readers',
      control: 'text'
    },
    'aria-describedby': {
      description: 'ID of element that describes the component',
      control: 'text'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with basic functionality
export const Default: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Manage lookup keys configuration'
  }
};

// Pre-populated with sample data
export const WithSampleData: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Lookup keys with sample data'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the component with pre-populated sample data including public and private entries.'
      }
    }
  }
};

// Table layout without accordion
export const TableLayout: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: false,
    'aria-label': 'Lookup keys table view'
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component in table-only mode without the accordion wrapper for cleaner integration.'
      }
    }
  }
};

// Dark mode theme
export const DarkMode: Story = {
  render: (args) => (
    <ThemeProvider theme="dark">
      <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Lookup keys in dark mode'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the dark mode theme with proper contrast ratios and accessibility compliance.'
      }
    }
  }
};

// Disabled state
export const DisabledState: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    disabled: true,
    'aria-label': 'Disabled lookup keys interface'
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the component in disabled state with proper visual feedback and accessibility attributes.'
      }
    }
  }
};

// Limited entries scenario
export const LimitedEntries: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys.slice(0, 2) }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    maxEntries: 3,
    showAccordion: true,
    'aria-label': 'Lookup keys with entry limit'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the maxEntries functionality with visual feedback when approaching the limit.'
      }
    }
  }
};

// Large dataset for performance testing
export const LargeDataset: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper defaultValues={{ lookupKeys: largeLookupKeysDataset }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Lookup keys with large dataset'
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component performance with a larger dataset (15 entries) to verify scrolling and rendering behavior.'
      }
    }
  }
};

// Validation errors demonstration
export const ValidationErrors: Story = {
  render: (args) => {
    const invalidData: LookupKeyEntry[] = [
      {
        id: '1',
        name: 'valid_key',
        value: 'valid_value',
        private: false
      },
      {
        id: '2',
        name: '', // Invalid: empty name
        value: 'some_value',
        private: false
      },
      {
        id: '3',
        name: 'invalid-key!', // Invalid: contains special characters
        value: '',
        private: true
      },
      {
        id: '4',
        name: 'valid_key', // Invalid: duplicate name
        value: 'another_value',
        private: false
      }
    ];

    return (
      <ThemeProvider theme="light">
        <FormWrapper defaultValues={{ lookupKeys: invalidData }}>
          <LookupKeys {...args} />
        </FormWrapper>
      </ThemeProvider>
    );
  },
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Lookup keys with validation errors'
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates validation error states including empty names, invalid characters, and duplicate entries.'
      }
    }
  }
};

// Accessibility focused story
export const AccessibilityDemo: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Accessibility Features Demonstration
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Tab through all interactive elements</li>
            <li>• Use arrow keys within the table for navigation</li>
            <li>• Screen reader announcements for state changes</li>
            <li>• Proper ARIA labels and descriptions</li>
            <li>• High contrast mode support</li>
            <li>• Keyboard shortcuts: Enter to add, Delete to remove</li>
          </ul>
        </div>
        
        <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys }}>
          <LookupKeys {...args} />
        </FormWrapper>
        
        {/* Additional accessibility info */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
            WCAG 2.1 AA Compliance Features:
          </h4>
          <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <li>• Minimum 4.5:1 contrast ratio for all text</li>
            <li>• Focus indicators visible and high contrast</li>
            <li>• Touch targets minimum 44x44 pixels</li>
            <li>• Screen reader compatible form labels</li>
            <li>• Error messages properly associated with fields</li>
          </ul>
        </div>
      </div>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Accessible lookup keys management interface',
    'aria-describedby': 'lookup-keys-help'
  },
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive accessibility demonstration showcasing WCAG 2.1 AA compliance features and keyboard navigation.'
      }
    }
  }
};

// Form integration patterns
export const FormIntegrationPatterns: Story = {
  render: (args) => {
    const complexFormSchema = z.object({
      serviceName: z.string().min(1, 'Service name is required'),
      description: z.string().optional(),
      lookupKeys: lookupKeysArraySchema,
      isEnabled: z.boolean().default(true)
    });

    const defaultValues = {
      serviceName: 'Database Service',
      description: 'Primary database connection service',
      lookupKeys: sampleLookupKeys.slice(0, 2),
      isEnabled: true
    };

    return (
      <ThemeProvider theme="light">
        <FormWrapper 
          defaultValues={defaultValues}
          schema={complexFormSchema}
          onSubmit={action('complex-form-submitted')}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="serviceName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500
                           dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter service name"
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="isEnabled"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Service Enabled
                  </span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500
                         dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                placeholder="Optional service description"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Configuration Settings
              </h3>
              <LookupKeys {...args} />
            </div>
          </div>
        </FormWrapper>
      </ThemeProvider>
    );
  },
  args: {
    name: 'lookupKeys',
    showAccordion: false,
    'aria-label': 'Service configuration lookup keys'
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows integration within a larger form context with other form fields and complex validation schemas.'
      }
    }
  }
};

// Privacy toggle demonstration
export const PrivacyToggleDemo: Story = {
  render: (args) => {
    const privacyFocusedData: LookupKeyEntry[] = [
      {
        id: '1',
        name: 'public_api_endpoint',
        value: 'https://api.example.com/v1',
        private: false,
        description: 'Public API endpoint URL'
      },
      {
        id: '2',
        name: 'private_api_key',
        value: 'sk_test_abcd1234567890',
        private: true,
        description: 'Secret API key for authentication'
      },
      {
        id: '3',
        name: 'database_host',
        value: 'localhost',
        private: false,
        description: 'Database server hostname'
      },
      {
        id: '4',
        name: 'database_password',
        value: 'super_secret_password',
        private: true,
        description: 'Database connection password'
      }
    ];

    return (
      <ThemeProvider theme="light">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Privacy Toggle Functionality
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Toggle the privacy switches to see how sensitive data is handled. Private entries 
              have visual indicators and would be hidden from non-administrative users in production.
            </p>
          </div>
          
          <FormWrapper defaultValues={{ lookupKeys: privacyFocusedData }}>
            <LookupKeys {...args} />
          </FormWrapper>
        </div>
      </ThemeProvider>
    );
  },
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Privacy-focused lookup keys management'
  },
  parameters: {
    docs: {
      description: {
        story: 'Highlights the privacy toggle functionality for managing sensitive configuration data.'
      }
    }
  }
};

// Responsive behavior story
export const ResponsiveBehavior: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
            Responsive Design Test
          </h3>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            Resize your browser window or view on different device sizes to see responsive behavior.
            The table adapts gracefully to smaller screens with horizontal scrolling when needed.
          </p>
        </div>
        
        <FormWrapper defaultValues={{ lookupKeys: sampleLookupKeys }}>
          <LookupKeys {...args} />
        </FormWrapper>
      </div>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Responsive lookup keys interface'
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests responsive design behavior across different screen sizes and device types.'
      }
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1200px', height: '800px' } }
      }
    }
  }
};

// Interactive play function for testing
export const InteractiveDemo: Story = {
  render: (args) => (
    <ThemeProvider theme="light">
      <FormWrapper defaultValues={{ lookupKeys: [] }}>
        <LookupKeys {...args} />
      </FormWrapper>
    </ThemeProvider>
  ),
  args: {
    name: 'lookupKeys',
    showAccordion: true,
    'aria-label': 'Interactive lookup keys demo'
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the add button and click it
    const addButton = canvas.getByLabelText(/add new lookup key/i);
    await userEvent.click(addButton);
    
    // Fill in the first entry
    const nameInputs = canvas.getAllByLabelText(/lookup key name/i);
    const valueInputs = canvas.getAllByLabelText(/lookup key value/i);
    
    if (nameInputs.length > 0 && valueInputs.length > 0) {
      await userEvent.type(nameInputs[0], 'test_key');
      await userEvent.type(valueInputs[0], 'test_value');
    }
    
    // Add another entry
    await userEvent.click(addButton);
    
    // Fill in the second entry
    if (nameInputs.length > 1 && valueInputs.length > 1) {
      await userEvent.type(nameInputs[1], 'another_key');
      await userEvent.type(valueInputs[1], 'another_value');
      
      // Toggle privacy for the second entry
      const privacyToggles = canvas.getAllByLabelText(/toggle privacy/i);
      if (privacyToggles.length > 1) {
        await userEvent.click(privacyToggles[1]);
      }
    }
    
    // Verify entries were added
    expect(canvas.getAllByDisplayValue('test_key')).toHaveLength(1);
    expect(canvas.getAllByDisplayValue('another_key')).toHaveLength(1);
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration with automated actions showing typical user workflows.'
      }
    }
  }
};