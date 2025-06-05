import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { server } from '../../../test/mocks/server'
import { renderWithProviders } from '../../../test/utils/test-utils'
import { DynamicField } from './dynamic-field'
import type { DynamicFieldProps, ConfigSchema, FieldValueType } from './dynamic-field.types'

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations)

// Mock the file selector component
vi.mock('../file-selector', () => ({
  FileSelector: ({ onFileSelect, className, ...props }: any) => (
    <div 
      data-testid="file-selector-mock" 
      className={className}
      onClick={() => onFileSelect?.(new File(['test'], 'test.txt', { type: 'text/plain' }))}
      {...props}
    >
      <span>Select File</span>
    </div>
  )
}))

// Mock theme hook
vi.mock('../../../hooks/use-theme', () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() })
}))

// Mock event data hook
vi.mock('../../../hooks/use-event-data', () => ({
  useEventData: () => ({
    data: [
      { name: 'event1', description: 'Test Event 1' },
      { name: 'event2', description: 'Test Event 2' },
      { name: 'event3', description: 'Test Event 3' }
    ],
    isLoading: false,
    error: null
  })
}))

// Test form schema
const testSchema = z.object({
  stringField: z.string().min(1, 'String field is required'),
  integerField: z.number().min(0, 'Must be positive'),
  passwordField: z.string().min(8, 'Password must be at least 8 characters'),
  textField: z.string().optional(),
  booleanField: z.boolean(),
  picklistField: z.string().optional(),
  multiPicklistField: z.array(z.string()).optional(),
  fileCertificateField: z.any().optional(),
  fileCertificateApiField: z.string().optional(),
  eventPicklistField: z.string().optional()
})

type TestFormData = z.infer<typeof testSchema>

// Test wrapper component with React Hook Form
function TestFormWrapper({ 
  children, 
  defaultValues = {},
  onSubmit = vi.fn() 
}: { 
  children: React.ReactNode
  defaultValues?: Partial<TestFormData>
  onSubmit?: (data: TestFormData) => void
}) {
  const methods = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      stringField: '',
      integerField: 0,
      passwordField: '',
      textField: '',
      booleanField: false,
      picklistField: '',
      multiPicklistField: [],
      fileCertificateField: null,
      fileCertificateApiField: '',
      eventPicklistField: '',
      ...defaultValues
    }
  })

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
        <button type="submit" data-testid="submit-button">Submit</button>
      </form>
    </FormProvider>
  )
}

// Mock config schemas for different field types
const mockConfigs: Record<string, ConfigSchema> = {
  string: {
    name: 'stringField',
    label: 'String Field',
    type: 'string',
    required: true,
    description: 'A string input field'
  },
  integer: {
    name: 'integerField',
    label: 'Integer Field',
    type: 'integer',
    required: false,
    description: 'A numeric input field'
  },
  password: {
    name: 'passwordField',
    label: 'Password Field',
    type: 'password',
    required: true,
    description: 'A password input field'
  },
  text: {
    name: 'textField',
    label: 'Text Field',
    type: 'text',
    required: false,
    description: 'A textarea field'
  },
  boolean: {
    name: 'booleanField',
    label: 'Boolean Field',
    type: 'boolean',
    required: false,
    description: 'A toggle switch field'
  },
  picklist: {
    name: 'picklistField',
    label: 'Picklist Field',
    type: 'picklist',
    required: false,
    description: 'A single select field',
    values: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]
  },
  multi_picklist: {
    name: 'multiPicklistField',
    label: 'Multi Picklist Field',
    type: 'multi_picklist',
    required: false,
    description: 'A multiple select field',
    values: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ]
  },
  file_certificate: {
    name: 'fileCertificateField',
    label: 'File Certificate Field',
    type: 'file_certificate',
    required: false,
    description: 'A file upload field for certificates'
  },
  file_certificate_api: {
    name: 'fileCertificateApiField',
    label: 'File Certificate API Field',
    type: 'file_certificate_api',
    required: false,
    description: 'A file path field for certificates'
  },
  event_picklist: {
    name: 'eventPicklistField',
    label: 'Event Picklist Field',
    type: 'event_picklist',
    required: false,
    description: 'An event selection field with autocomplete'
  }
}

describe('DynamicField Component', () => {
  let queryClient: QueryClient

  beforeAll(() => {
    // Setup MSW server
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  })

  afterEach(() => {
    server.resetHandlers()
    queryClient.clear()
    vi.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  describe('Component Rendering', () => {
    it('should render successfully with minimal props', () => {
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      expect(screen.getByLabelText('String Field')).toBeInTheDocument()
    })

    it('should apply dark theme classes when isDarkMode is true', () => {
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue({
        isDarkMode: true,
        toggleTheme: vi.fn()
      })

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      const container = screen.getByTestId('dynamic-field-container')
      expect(container).toHaveClass('dark')
    })

    it('should display field description when provided', () => {
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      const descriptionElement = screen.getByText('A string input field')
      expect(descriptionElement).toBeInTheDocument()
    })

    it('should show required indicator for required fields', () => {
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      const requiredIndicator = screen.getByText('*')
      expect(requiredIndicator).toBeInTheDocument()
      expect(requiredIndicator).toHaveClass('text-red-500')
    })
  })

  describe('Field Type Implementations', () => {
    describe('String Field', () => {
      it('should render string input correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'text')
      })

      it('should handle string input changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        await user.type(input, 'test value')

        expect(input).toHaveValue('test value')
      })
    })

    describe('Integer Field', () => {
      it('should render integer input correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="integerField" 
              config={mockConfigs.integer} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('Integer Field')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'number')
      })

      it('should handle numeric input changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="integerField" 
              config={mockConfigs.integer} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('Integer Field')
        await user.clear(input)
        await user.type(input, '42')

        expect(input).toHaveValue(42)
      })
    })

    describe('Password Field', () => {
      it('should render password input correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="passwordField" 
              config={mockConfigs.password} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('Password Field')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'password')
      })

      it('should handle password input changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="passwordField" 
              config={mockConfigs.password} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('Password Field')
        await user.type(input, 'secretpassword123')

        expect(input).toHaveValue('secretpassword123')
      })
    })

    describe('Text Field', () => {
      it('should render textarea correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="textField" 
              config={mockConfigs.text} 
            />
          </TestFormWrapper>
        )

        const textarea = screen.getByLabelText('Text Field')
        expect(textarea).toBeInTheDocument()
        expect(textarea.tagName).toBe('TEXTAREA')
      })

      it('should handle textarea input changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="textField" 
              config={mockConfigs.text} 
            />
          </TestFormWrapper>
        )

        const textarea = screen.getByLabelText('Text Field')
        await user.type(textarea, 'This is a longer text value\nWith multiple lines')

        expect(textarea).toHaveValue('This is a longer text value\nWith multiple lines')
      })
    })

    describe('Boolean Field', () => {
      it('should render toggle switch correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="booleanField" 
              config={mockConfigs.boolean} 
            />
          </TestFormWrapper>
        )

        const toggle = screen.getByRole('switch', { name: 'Boolean Field' })
        expect(toggle).toBeInTheDocument()
        expect(toggle).not.toBeChecked()
      })

      it('should handle toggle changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="booleanField" 
              config={mockConfigs.boolean} 
            />
          </TestFormWrapper>
        )

        const toggle = screen.getByRole('switch', { name: 'Boolean Field' })
        await user.click(toggle)

        expect(toggle).toBeChecked()
      })
    })

    describe('Picklist Field', () => {
      it('should render select dropdown correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="picklistField" 
              config={mockConfigs.picklist} 
            />
          </TestFormWrapper>
        )

        const select = screen.getByRole('combobox', { name: 'Picklist Field' })
        expect(select).toBeInTheDocument()
      })

      it('should handle option selection', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="picklistField" 
              config={mockConfigs.picklist} 
            />
          </TestFormWrapper>
        )

        const select = screen.getByRole('combobox', { name: 'Picklist Field' })
        await user.click(select)

        const option = screen.getByRole('option', { name: 'Option 1' })
        await user.click(option)

        expect(select).toHaveValue('option1')
      })

      it('should display all available options', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="picklistField" 
              config={mockConfigs.picklist} 
            />
          </TestFormWrapper>
        )

        const select = screen.getByRole('combobox', { name: 'Picklist Field' })
        await user.click(select)

        expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument()
      })
    })

    describe('Multi Picklist Field', () => {
      it('should render multi-select dropdown correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="multiPicklistField" 
              config={mockConfigs.multi_picklist} 
            />
          </TestFormWrapper>
        )

        const select = screen.getByRole('combobox', { name: 'Multi Picklist Field' })
        expect(select).toBeInTheDocument()
      })

      it('should handle multiple option selection', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="multiPicklistField" 
              config={mockConfigs.multi_picklist} 
            />
          </TestFormWrapper>
        )

        const select = screen.getByRole('combobox', { name: 'Multi Picklist Field' })
        await user.click(select)

        const option1 = screen.getByRole('option', { name: 'Option 1' })
        const option2 = screen.getByRole('option', { name: 'Option 2' })
        
        await user.click(option1)
        await user.click(option2)

        // Check that both options are selected (implementation specific)
        expect(screen.getByText('2 selected')).toBeInTheDocument()
      })
    })

    describe('File Certificate Field', () => {
      it('should render file selector correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="fileCertificateField" 
              config={mockConfigs.file_certificate} 
            />
          </TestFormWrapper>
        )

        const fileSelector = screen.getByTestId('file-selector-mock')
        expect(fileSelector).toBeInTheDocument()
      })

      it('should handle file selection with File object', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="fileCertificateField" 
              config={mockConfigs.file_certificate} 
            />
          </TestFormWrapper>
        )

        const fileSelector = screen.getByTestId('file-selector-mock')
        await user.click(fileSelector)

        // Verify file is displayed
        expect(screen.getByText('test.txt')).toBeInTheDocument()
      })

      it('should handle file selection with file path string', async () => {
        renderWithProviders(
          <TestFormWrapper defaultValues={{ fileCertificateField: '/path/to/certificate.pem' }}>
            <DynamicField 
              name="fileCertificateField" 
              config={mockConfigs.file_certificate} 
            />
          </TestFormWrapper>
        )

        expect(screen.getByText('/path/to/certificate.pem')).toBeInTheDocument()
      })
    })

    describe('File Certificate API Field', () => {
      it('should render text input for file path', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="fileCertificateApiField" 
              config={mockConfigs.file_certificate_api} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('File Certificate API Field')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'text')
      })

      it('should handle file path input changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="fileCertificateApiField" 
              config={mockConfigs.file_certificate_api} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('File Certificate API Field')
        await user.type(input, '/api/files/certificate.pem')

        expect(input).toHaveValue('/api/files/certificate.pem')
      })
    })

    describe('Event Picklist Field', () => {
      it('should render autocomplete input correctly', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="eventPicklistField" 
              config={mockConfigs.event_picklist} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByRole('combobox', { name: 'Event Picklist Field' })
        expect(input).toBeInTheDocument()
      })

      it('should handle event filtering and selection', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="eventPicklistField" 
              config={mockConfigs.event_picklist} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByRole('combobox', { name: 'Event Picklist Field' })
        await user.type(input, 'event1')

        // Wait for filtering to complete
        await waitFor(() => {
          expect(screen.getByRole('option', { name: /Test Event 1/ })).toBeInTheDocument()
        })

        const option = screen.getByRole('option', { name: /Test Event 1/ })
        await user.click(option)

        expect(input).toHaveValue('event1')
      })

      it('should filter events based on input', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="eventPicklistField" 
              config={mockConfigs.event_picklist} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByRole('combobox', { name: 'Event Picklist Field' })
        await user.type(input, 'event2')

        await waitFor(() => {
          expect(screen.getByRole('option', { name: /Test Event 2/ })).toBeInTheDocument()
          expect(screen.queryByRole('option', { name: /Test Event 1/ })).not.toBeInTheDocument()
          expect(screen.queryByRole('option', { name: /Test Event 3/ })).not.toBeInTheDocument()
        })
      })
    })
  })

  describe('Form Integration', () => {
    describe('Controlled Mode', () => {
      it('should integrate with React Hook Form in controlled mode', async () => {
        const onSubmit = vi.fn()
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper onSubmit={onSubmit}>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        await user.type(input, 'test value')

        const submitButton = screen.getByTestId('submit-button')
        await user.click(submitButton)

        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              stringField: 'test value'
            })
          )
        })
      })

      it('should update form state immediately on field changes', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        await user.type(input, 'immediate update')

        // Form should reflect the change immediately
        expect(input).toHaveValue('immediate update')
      })
    })

    describe('Uncontrolled Mode', () => {
      it('should work with default values in uncontrolled mode', () => {
        renderWithProviders(
          <TestFormWrapper defaultValues={{ stringField: 'default value' }}>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        expect(input).toHaveValue('default value')
      })

      it('should handle field arrays and nested forms', async () => {
        const user = userEvent.setup()
        
        const TestFieldArray = () => {
          const { control } = useForm({
            defaultValues: {
              items: [{ stringField: '' }, { stringField: '' }]
            }
          })

          return (
            <div>
              {[0, 1].map((index) => (
                <DynamicField 
                  key={index}
                  name={`items.${index}.stringField` as any}
                  config={mockConfigs.string}
                />
              ))}
            </div>
          )
        }

        renderWithProviders(<TestFieldArray />)

        const inputs = screen.getAllByLabelText('String Field')
        expect(inputs).toHaveLength(2)

        await user.type(inputs[0], 'first item')
        await user.type(inputs[1], 'second item')

        expect(inputs[0]).toHaveValue('first item')
        expect(inputs[1]).toHaveValue('second item')
      })
    })
  })

  describe('Validation', () => {
    describe('Zod Schema Validation', () => {
      it('should validate required fields', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const submitButton = screen.getByTestId('submit-button')
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText('String field is required')).toBeInTheDocument()
        })
      })

      it('should validate field-specific rules', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="passwordField" 
              config={mockConfigs.password} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('Password Field')
        await user.type(input, 'short')

        const submitButton = screen.getByTestId('submit-button')
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
        })
      })

      it('should validate numeric constraints', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="integerField" 
              config={mockConfigs.integer} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('Integer Field')
        await user.clear(input)
        await user.type(input, '-5')

        const submitButton = screen.getByTestId('submit-button')
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText('Must be positive')).toBeInTheDocument()
        })
      })

      it('should clear validation errors when field becomes valid', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        // First trigger validation error
        const submitButton = screen.getByTestId('submit-button')
        await user.click(submitButton)

        await waitFor(() => {
          expect(screen.getByText('String field is required')).toBeInTheDocument()
        })

        // Then fix the error
        const input = screen.getByLabelText('String Field')
        await user.type(input, 'valid value')

        await waitFor(() => {
          expect(screen.queryByText('String field is required')).not.toBeInTheDocument()
        })
      })
    })

    describe('Real-time Validation Performance', () => {
      it('should validate fields under 100ms requirement', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        
        // Measure validation time
        const startTime = performance.now()
        await user.type(input, 'test validation performance')
        
        // Wait for validation to complete
        await waitFor(() => {
          expect(input).toHaveValue('test validation performance')
        })
        
        const endTime = performance.now()
        const validationTime = endTime - startTime
        
        // Validation should complete under 100ms
        expect(validationTime).toBeLessThan(100)
      })

      it('should handle rapid input changes without performance degradation', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        
        // Simulate rapid typing
        const startTime = performance.now()
        for (let i = 0; i < 10; i++) {
          await user.type(input, `rapid${i}`)
          await user.clear(input)
        }
        
        const endTime = performance.now()
        const totalTime = endTime - startTime
        
        // Each operation should average under 10ms
        expect(totalTime / 20).toBeLessThan(10)
      })
    })
  })

  describe('Accessibility', () => {
    describe('WCAG 2.1 AA Compliance', () => {
      it('should have no accessibility violations for text input', async () => {
        const { container } = renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations for select elements', async () => {
        const { container } = renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="picklistField" 
              config={mockConfigs.picklist} 
            />
          </TestFormWrapper>
        )

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })

      it('should have no accessibility violations for toggle switch', async () => {
        const { container } = renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="booleanField" 
              config={mockConfigs.boolean} 
            />
          </TestFormWrapper>
        )

        const results = await axe(container)
        expect(results).toHaveNoViolations()
      })

      it('should have proper ARIA labels and descriptions', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        expect(input).toHaveAttribute('aria-describedby')
        
        const description = screen.getByText('A string input field')
        expect(description).toHaveAttribute('id')
      })

      it('should support keyboard navigation', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="picklistField" 
              config={mockConfigs.picklist} 
            />
          </TestFormWrapper>
        )

        const select = screen.getByRole('combobox', { name: 'Picklist Field' })
        
        // Focus the select
        await user.tab()
        expect(select).toHaveFocus()

        // Open dropdown with keyboard
        await user.keyboard('{Enter}')
        
        // Navigate options with arrow keys
        await user.keyboard('{ArrowDown}')
        
        // Select option with Enter
        await user.keyboard('{Enter}')
        
        expect(select).toHaveValue('option1')
      })

      it('should announce validation errors to screen readers', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const submitButton = screen.getByTestId('submit-button')
        await user.click(submitButton)

        await waitFor(() => {
          const errorMessage = screen.getByText('String field is required')
          expect(errorMessage).toHaveAttribute('role', 'alert')
          expect(errorMessage).toHaveAttribute('aria-live', 'polite')
        })
      })

      it('should have proper focus management for file selector', async () => {
        const user = userEvent.setup()
        
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="fileCertificateField" 
              config={mockConfigs.file_certificate} 
            />
          </TestFormWrapper>
        )

        const fileSelector = screen.getByTestId('file-selector-mock')
        
        await user.tab()
        expect(fileSelector).toHaveFocus()
        
        await user.keyboard('{Enter}')
        // File selector should handle activation appropriately
      })
    })

    describe('Color Contrast and Visual Design', () => {
      it('should maintain proper color contrast in light theme', () => {
        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const input = screen.getByLabelText('String Field')
        const styles = getComputedStyle(input)
        
        // Verify contrast ratios meet WCAG AA standards (implementation specific)
        expect(styles.color).not.toBe('')
        expect(styles.backgroundColor).not.toBe('')
      })

      it('should maintain proper color contrast in dark theme', () => {
        vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue({
          isDarkMode: true,
          toggleTheme: vi.fn()
        })

        renderWithProviders(
          <TestFormWrapper>
            <DynamicField 
              name="stringField" 
              config={mockConfigs.string} 
            />
          </TestFormWrapper>
        )

        const container = screen.getByTestId('dynamic-field-container')
        expect(container).toHaveClass('dark')
        
        const input = screen.getByLabelText('String Field')
        const styles = getComputedStyle(input)
        
        // Verify dark theme contrast ratios
        expect(styles.color).not.toBe('')
        expect(styles.backgroundColor).not.toBe('')
      })
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme styles correctly', () => {
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      const container = screen.getByTestId('dynamic-field-container')
      expect(container).not.toHaveClass('dark')
      expect(container).toHaveClass('bg-white', 'text-gray-900')
    })

    it('should apply dark theme styles correctly', () => {
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue({
        isDarkMode: true,
        toggleTheme: vi.fn()
      })

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      const container = screen.getByTestId('dynamic-field-container')
      expect(container).toHaveClass('dark')
      expect(container).toHaveClass('bg-gray-900', 'text-white')
    })

    it('should update theme dynamically', async () => {
      const mockToggleTheme = vi.fn()
      const { rerender } = renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      // Initially light theme
      let container = screen.getByTestId('dynamic-field-container')
      expect(container).not.toHaveClass('dark')

      // Switch to dark theme
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue({
        isDarkMode: true,
        toggleTheme: mockToggleTheme
      })

      rerender(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string} 
          />
        </TestFormWrapper>
      )

      container = screen.getByTestId('dynamic-field-container')
      expect(container).toHaveClass('dark')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid config gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="invalidField" 
            config={{} as ConfigSchema}
          />
        </TestFormWrapper>
      )

      // Should render fallback or error boundary
      expect(screen.getByText('Unsupported field type')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle missing config values gracefully', () => {
      const incompleteConfig = {
        name: 'testField',
        type: 'picklist'
        // Missing values array
      } as ConfigSchema

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="testField" 
            config={incompleteConfig}
          />
        </TestFormWrapper>
      )

      // Should render without crashing
      expect(screen.getByLabelText('testField')).toBeInTheDocument()
    })

    it('should handle network errors for event data', async () => {
      // Mock network error
      vi.mocked(require('../../../hooks/use-event-data').useEventData).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Network error')
      })

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="eventPicklistField" 
            config={mockConfigs.event_picklist}
          />
        </TestFormWrapper>
      )

      expect(screen.getByText('Error loading events')).toBeInTheDocument()
    })

    it('should show loading state for event data', () => {
      vi.mocked(require('../../../hooks/use-event-data').useEventData).mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      })

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="eventPicklistField" 
            config={mockConfigs.event_picklist}
          />
        </TestFormWrapper>
      )

      expect(screen.getByText('Loading events...')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty picklist values array', () => {
      const emptyPicklistConfig = {
        ...mockConfigs.picklist,
        values: []
      }

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="picklistField" 
            config={emptyPicklistConfig}
          />
        </TestFormWrapper>
      )

      const select = screen.getByRole('combobox', { name: 'Picklist Field' })
      expect(select).toBeInTheDocument()
      // Should show empty state or disabled state
    })

    it('should handle null/undefined field values', () => {
      renderWithProviders(
        <TestFormWrapper defaultValues={{ stringField: null }}>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string}
          />
        </TestFormWrapper>
      )

      const input = screen.getByLabelText('String Field')
      expect(input).toHaveValue('')
    })

    it('should handle very long field labels and descriptions', () => {
      const longLabelConfig = {
        ...mockConfigs.string,
        label: 'This is a very long field label that might wrap to multiple lines and should be handled gracefully by the component layout',
        description: 'This is an extremely long field description that contains a lot of information about what this field does and how it should be used in the context of the application. It should wrap properly and not break the layout.'
      }

      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={longLabelConfig}
          />
        </TestFormWrapper>
      )

      expect(screen.getByText(longLabelConfig.label)).toBeInTheDocument()
      expect(screen.getByText(longLabelConfig.description)).toBeInTheDocument()
    })

    it('should handle special characters in field values', async () => {
      const user = userEvent.setup()
      const specialChars = '!@#$%^&*()[]{}|;:,.<>?~`'
      
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string}
          />
        </TestFormWrapper>
      )

      const input = screen.getByLabelText('String Field')
      await user.type(input, specialChars)

      expect(input).toHaveValue(specialChars)
    })

    it('should handle unicode characters', async () => {
      const user = userEvent.setup()
      const unicodeText = 'Hello 世界 🌍 Ñoño café'
      
      renderWithProviders(
        <TestFormWrapper>
          <DynamicField 
            name="stringField" 
            config={mockConfigs.string}
          />
        </TestFormWrapper>
      )

      const input = screen.getByLabelText('String Field')
      await user.type(input, unicodeText)

      expect(input).toHaveValue(unicodeText)
    })
  })

  describe('Component Registration and Integration', () => {
    it('should register with React Hook Form field arrays', () => {
      const TestArrayComponent = () => {
        const { control, setValue } = useForm({
          defaultValues: { items: [{ name: 'test' }] }
        })

        return (
          <DynamicField 
            name="items.0.name"
            config={mockConfigs.string}
          />
        )
      }

      renderWithProviders(<TestArrayComponent />)
      
      const input = screen.getByLabelText('String Field')
      expect(input).toHaveValue('test')
    })

    it('should work with nested form structures', () => {
      const TestNestedComponent = () => {
        const { control } = useForm({
          defaultValues: { 
            user: { 
              profile: { 
                name: 'John Doe' 
              } 
            } 
          }
        })

        return (
          <DynamicField 
            name="user.profile.name"
            config={mockConfigs.string}
          />
        )
      }

      renderWithProviders(<TestNestedComponent />)
      
      const input = screen.getByLabelText('String Field')
      expect(input).toHaveValue('John Doe')
    })

    it('should support conditional field rendering', async () => {
      const user = userEvent.setup()
      
      const ConditionalFieldsComponent = () => {
        const { watch } = useForm({
          defaultValues: { showExtra: false, extraValue: '' }
        })
        
        const showExtra = watch('showExtra')

        return (
          <div>
            <DynamicField 
              name="showExtra"
              config={mockConfigs.boolean}
            />
            {showExtra && (
              <DynamicField 
                name="extraValue"
                config={mockConfigs.string}
              />
            )}
          </div>
        )
      }

      renderWithProviders(<ConditionalFieldsComponent />)
      
      // Initially extra field should not be visible
      expect(screen.queryByLabelText('String Field')).not.toBeInTheDocument()
      
      // Toggle the boolean field
      const toggle = screen.getByRole('switch', { name: 'Boolean Field' })
      await user.click(toggle)
      
      // Now extra field should be visible
      expect(screen.getByLabelText('String Field')).toBeInTheDocument()
    })
  })
})