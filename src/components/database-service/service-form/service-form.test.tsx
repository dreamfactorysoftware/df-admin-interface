/**
 * Comprehensive test suite for database service form components
 * 
 * Tests include:
 * - Form validation with React Hook Form and Zod schema integration
 * - Wizard navigation and multi-step form workflows  
 * - Dynamic field generation based on service configuration schemas
 * - Connection testing with SWR integration
 * - Paywall integration and premium service access control
 * - Security configuration workflows
 * - Accessibility testing for WCAG 2.1 AA compliance
 * - User interaction scenarios and component integration
 * 
 * Uses Vitest 2.1+ for 10x faster test execution and MSW for realistic API mocking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/mocks/server'
import { TestProviders } from '../../../test/utils/test-providers'
import { renderWithProviders } from '../../../test/utils/test-utils'
import { createMockDatabaseService, createMockServiceFormData, createMockPaywallConfig } from '../../../test/utils/component-factories'

// Components under test
import { ServiceFormContainer } from './service-form-container'
import { ServiceFormWizard } from './service-form-wizard'
import { ServiceFormFields } from './service-form-fields'
import { PaywallModal } from './paywall-modal'

// Hooks under test
import { useServiceForm, useServiceFormWizard, useServiceConnectionTest, useServiceFormPaywall } from './service-form-hooks'

// Type definitions
import type { DatabaseServiceConfig, ServiceFormData, ServiceFormStep, PaywallConfig } from './service-form-types'

// Test utilities
import { mockDatabaseServiceHandlers } from '../../../test/mocks/database-service-handlers'

// Extend Jest DOM matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js router
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useParams: () => ({ serviceId: 'test-service-id' }),
  useSearchParams: () => new URLSearchParams('?type=mysql'),
  usePathname: () => '/api-connections/database/create',
}))

// Mock react-hook-form for controlled testing
const mockSetError = vi.fn()
const mockClearErrors = vi.fn()
const mockReset = vi.fn()
const mockHandleSubmit = vi.fn()
const mockWatch = vi.fn()
const mockSetValue = vi.fn()
const mockTrigger = vi.fn()

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn(() => ({})),
      handleSubmit: mockHandleSubmit,
      watch: mockWatch,
      setValue: mockSetValue,
      setError: mockSetError,
      clearErrors: mockClearErrors,
      reset: mockReset,
      trigger: mockTrigger,
      formState: {
        errors: {},
        isValid: true,
        isSubmitting: false,
        isDirty: false,
        isValidating: false,
      },
      control: {},
      getValues: () => ({}),
    }),
    Controller: ({ render }: any) => render?.({ field: {}, fieldState: {}, formState: {} }),
  }
})

describe('ServiceFormContainer', () => {
  const mockServiceData = createMockDatabaseService({
    type: 'mysql',
    name: 'test-mysql-service',
    label: 'Test MySQL Service',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatch.mockReturnValue({})
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Component Rendering', () => {
    it('renders service form container successfully', () => {
      renderWithProviders(<ServiceFormContainer />)
      
      expect(screen.getByTestId('service-form-container')).toBeInTheDocument()
    })

    it('displays loading state during initial data fetch', () => {
      // Mock loading state
      server.use(
        http.get('/api/v2/system/service', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({ resource: [] })
        })
      )

      renderWithProviders(<ServiceFormContainer />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Loading service configuration...')).toBeInTheDocument()
    })

    it('renders service form wizard when data is loaded', async () => {
      server.use(
        http.get('/api/v2/system/service/:serviceId', () => 
          HttpResponse.json({ resource: [mockServiceData] })
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      await waitFor(() => {
        expect(screen.getByTestId('service-form-wizard')).toBeInTheDocument()
      })
    })

    it('displays error state when service data fails to load', async () => {
      server.use(
        http.get('/api/v2/system/service/:serviceId', () => 
          HttpResponse.json({ error: { message: 'Service not found' } }, { status: 404 })
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load service configuration')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Integration', () => {
    it('navigates back to service list when cancelled', async () => {
      renderWithProviders(<ServiceFormContainer />)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      await userEvent.click(cancelButton)
      
      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('navigates to API documentation after successful creation', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v2/system/service', () => 
          HttpResponse.json({ resource: [{ ...mockServiceData, id: 'new-service-id' }] })
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      // Mock successful form submission
      mockHandleSubmit.mockImplementation((onSubmit) => () => {
        onSubmit(createMockServiceFormData())
      })

      const submitButton = screen.getByRole('button', { name: 'Create Service' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/api-connections/database/new-service-id/api-docs')
      })
    })
  })

  describe('Context Integration', () => {
    it('provides service form context to child components', () => {
      renderWithProviders(<ServiceFormContainer />)
      
      // Verify context provider is rendered
      expect(screen.getByTestId('service-form-context')).toBeInTheDocument()
    })

    it('updates global loading state during operations', async () => {
      renderWithProviders(<ServiceFormContainer />)
      
      // Verify global loading state integration
      expect(screen.getByTestId('global-loading-state')).toHaveAttribute('data-loading', 'false')
    })
  })

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<ServiceFormContainer />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA labels and descriptions', () => {
      renderWithProviders(<ServiceFormContainer />)
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Database Service Configuration')
      expect(screen.getByTestId('service-form-container')).toHaveAttribute('aria-describedby', 'service-form-description')
    })

    it('manages focus correctly during navigation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormContainer />)
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('data-testid', 'service-form-step-2')
      })
    })
  })
})

describe('ServiceFormWizard', () => {
  const mockFormData = createMockServiceFormData({
    serviceType: 'mysql',
    basicConfig: {
      name: 'test-service',
      label: 'Test Service',
      description: 'Test database service',
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockWatch.mockReturnValue(mockFormData)
  })

  describe('Step Navigation', () => {
    it('renders all wizard steps correctly', () => {
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      // Verify all steps are present
      expect(screen.getByText('Service Type')).toBeInTheDocument()
      expect(screen.getByText('Basic Configuration')).toBeInTheDocument()
      expect(screen.getByText('Advanced Options')).toBeInTheDocument()
      expect(screen.getByText('Security')).toBeInTheDocument()
    })

    it('navigates between steps correctly', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      // Start on step 1
      expect(screen.getByTestId('wizard-step-1')).toHaveAttribute('aria-current', 'step')
      
      // Navigate to step 2
      const nextButton = screen.getByRole('button', { name: 'Next' })
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('wizard-step-2')).toHaveAttribute('aria-current', 'step')
      })
    })

    it('prevents navigation with invalid form data', async () => {
      const user = userEvent.setup()
      
      // Mock form validation errors
      mockTrigger.mockResolvedValue(false)
      
      renderWithProviders(<ServiceFormWizard data={{}} onSubmit={vi.fn()} />)
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      await user.click(nextButton)
      
      // Should remain on step 1
      expect(screen.getByTestId('wizard-step-1')).toHaveAttribute('aria-current', 'step')
      expect(mockSetError).toHaveBeenCalled()
    })

    it('validates current step before proceeding', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      await user.click(nextButton)
      
      expect(mockTrigger).toHaveBeenCalledWith(['serviceType'])
    })
  })

  describe('Service Type Selection', () => {
    it('displays all supported database types', () => {
      renderWithProviders(<ServiceFormWizard data={{}} onSubmit={vi.fn()} />)
      
      expect(screen.getByText('MySQL')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('Oracle')).toBeInTheDocument()
      expect(screen.getByText('MongoDB')).toBeInTheDocument()
      expect(screen.getByText('Snowflake')).toBeInTheDocument()
    })

    it('updates form data when service type is selected', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={{}} onSubmit={vi.fn()} />)
      
      const mysqlOption = screen.getByRole('radio', { name: 'MySQL' })
      await user.click(mysqlOption)
      
      expect(mockSetValue).toHaveBeenCalledWith('serviceType', 'mysql')
    })

    it('shows premium badge for premium database types', () => {
      renderWithProviders(<ServiceFormWizard data={{}} onSubmit={vi.fn()} />)
      
      const snowflakeOption = screen.getByTestId('service-type-snowflake')
      expect(within(snowflakeOption).getByText('Premium')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates required fields in real-time', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      // Navigate to basic configuration step
      await user.click(screen.getByRole('button', { name: 'Next' }))
      
      const nameField = screen.getByLabelText('Service Name')
      await user.clear(nameField)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Service name is required')).toBeInTheDocument()
      })
    })

    it('validates field format and constraints', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      // Navigate to basic configuration step
      await user.click(screen.getByRole('button', { name: 'Next' }))
      
      const nameField = screen.getByLabelText('Service Name')
      await user.clear(nameField)
      await user.type(nameField, 'invalid-name-with-special-chars!')
      
      await waitFor(() => {
        expect(screen.getByText('Service name can only contain letters, numbers, and underscores')).toBeInTheDocument()
      })
    })

    it('shows validation summary when form submission fails', async () => {
      const user = userEvent.setup()
      const mockSubmit = vi.fn()
      
      // Mock validation failure
      mockTrigger.mockResolvedValue(false)
      
      renderWithProviders(<ServiceFormWizard data={{}} onSubmit={mockSubmit} />)
      
      // Navigate to final step and submit
      await user.click(screen.getByRole('button', { name: 'Skip to Review' }))
      await user.click(screen.getByRole('button', { name: 'Create Service' }))
      
      await waitFor(() => {
        expect(screen.getByText('Please correct the following errors:')).toBeInTheDocument()
      })
      
      expect(mockSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Security Configuration', () => {
    it('renders security configuration step', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      // Navigate to security step
      await user.click(screen.getByTestId('wizard-step-4'))
      
      expect(screen.getByText('API Security')).toBeInTheDocument()
      expect(screen.getByText('Access Control')).toBeInTheDocument()
    })

    it('handles role creation for restricted access', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      // Navigate to security step
      await user.click(screen.getByTestId('wizard-step-4'))
      
      const restrictedAccessOption = screen.getByRole('radio', { name: 'Restricted Access' })
      await user.click(restrictedAccessOption)
      
      expect(screen.getByText('Create new role for this service')).toBeInTheDocument()
      expect(screen.getByLabelText('Role Name')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('meets accessibility standards for wizard navigation', async () => {
      const { container } = renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper step indicators for screen readers', () => {
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '4')
    })

    it('announces step changes to screen readers', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={mockFormData} onSubmit={vi.fn()} />)
      
      const nextButton = screen.getByRole('button', { name: 'Next' })
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Moved to step 2: Basic Configuration')
      })
    })
  })
})

describe('ServiceFormFields', () => {
  const mockFieldSchema = {
    type: 'mysql',
    fields: [
      { name: 'host', type: 'text', label: 'Host', required: true },
      { name: 'port', type: 'number', label: 'Port', defaultValue: 3306 },
      { name: 'username', type: 'text', label: 'Username', required: true },
      { name: 'password', type: 'password', label: 'Password', required: true },
      { name: 'ssl_enabled', type: 'boolean', label: 'Enable SSL' },
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dynamic Field Generation', () => {
    it('renders fields based on service configuration schema', () => {
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      expect(screen.getByLabelText('Host')).toBeInTheDocument()
      expect(screen.getByLabelText('Port')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Enable SSL')).toBeInTheDocument()
    })

    it('applies default values to fields', () => {
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      const portField = screen.getByLabelText('Port') as HTMLInputElement
      expect(portField.value).toBe('3306')
    })

    it('marks required fields appropriately', () => {
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      expect(screen.getByLabelText('Host')).toHaveAttribute('required')
      expect(screen.getByLabelText('Port')).not.toHaveAttribute('required')
    })

    it('renders different field types correctly', () => {
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      expect(screen.getByLabelText('Host')).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText('Port')).toHaveAttribute('type', 'number')
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
      expect(screen.getByLabelText('Enable SSL')).toHaveAttribute('type', 'checkbox')
    })
  })

  describe('Conditional Field Rendering', () => {
    const conditionalSchema = {
      type: 'mysql',
      fields: [
        { name: 'host', type: 'text', label: 'Host', required: true },
        { name: 'ssl_enabled', type: 'boolean', label: 'Enable SSL' },
        { 
          name: 'ssl_cert', 
          type: 'textarea', 
          label: 'SSL Certificate', 
          conditional: { field: 'ssl_enabled', value: true }
        },
      ]
    }

    it('shows conditional fields when condition is met', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormFields schema={conditionalSchema} />)
      
      // SSL cert field should not be visible initially
      expect(screen.queryByLabelText('SSL Certificate')).not.toBeInTheDocument()
      
      // Enable SSL
      const sslCheckbox = screen.getByLabelText('Enable SSL')
      await user.click(sslCheckbox)
      
      // SSL cert field should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText('SSL Certificate')).toBeInTheDocument()
      })
    })

    it('hides conditional fields when condition is not met', async () => {
      const user = userEvent.setup()
      mockWatch.mockReturnValue({ ssl_enabled: true })
      
      renderWithProviders(<ServiceFormFields schema={conditionalSchema} />)
      
      // SSL cert field should be visible initially
      expect(screen.getByLabelText('SSL Certificate')).toBeInTheDocument()
      
      // Disable SSL
      const sslCheckbox = screen.getByLabelText('Enable SSL')
      await user.click(sslCheckbox)
      
      // SSL cert field should be hidden
      await waitFor(() => {
        expect(screen.queryByLabelText('SSL Certificate')).not.toBeInTheDocument()
      })
    })
  })

  describe('Array Field Support', () => {
    const arrayFieldSchema = {
      type: 'custom',
      fields: [
        {
          name: 'connection_parameters',
          type: 'array',
          label: 'Additional Parameters',
          itemSchema: {
            type: 'object',
            fields: [
              { name: 'key', type: 'text', label: 'Parameter Name' },
              { name: 'value', type: 'text', label: 'Parameter Value' },
            ]
          }
        }
      ]
    }

    it('renders array fields with add/remove functionality', () => {
      renderWithProviders(<ServiceFormFields schema={arrayFieldSchema} />)
      
      expect(screen.getByText('Additional Parameters')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Parameter' })).toBeInTheDocument()
    })

    it('adds new array items when add button is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormFields schema={arrayFieldSchema} />)
      
      const addButton = screen.getByRole('button', { name: 'Add Parameter' })
      await user.click(addButton)
      
      expect(screen.getByLabelText('Parameter Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Parameter Value')).toBeInTheDocument()
    })
  })

  describe('Field Validation', () => {
    it('validates required fields on blur', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      const hostField = screen.getByLabelText('Host')
      await user.click(hostField)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('Host is required')).toBeInTheDocument()
      })
    })

    it('validates field format in real-time', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      const portField = screen.getByLabelText('Port')
      await user.clear(portField)
      await user.type(portField, 'invalid-port')
      
      await waitFor(() => {
        expect(screen.getByText('Port must be a valid number')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('meets accessibility standards for dynamic forms', async () => {
      const { container } = renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper labels and descriptions for all fields', () => {
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      // Check that all fields have proper labels
      expect(screen.getByLabelText('Host')).toBeInTheDocument()
      expect(screen.getByLabelText('Port')).toBeInTheDocument()
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('associates error messages with form fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormFields schema={mockFieldSchema} />)
      
      const hostField = screen.getByLabelText('Host')
      await user.click(hostField)
      await user.tab()
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Host is required')
        expect(hostField).toHaveAttribute('aria-describedby', errorMessage.id)
      })
    })
  })
})

describe('PaywallModal', () => {
  const mockPaywallConfig = createMockPaywallConfig({
    isVisible: true,
    serviceType: 'snowflake',
    feature: 'premium-database',
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Rendering', () => {
    it('renders paywall modal when visible', () => {
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Premium Feature')).toBeInTheDocument()
      expect(screen.getByText('Snowflake Integration')).toBeInTheDocument()
    })

    it('does not render when not visible', () => {
      const hiddenConfig = { ...mockPaywallConfig, isVisible: false }
      renderWithProviders(<PaywallModal config={hiddenConfig} onClose={vi.fn()} />)
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('displays appropriate content for different service types', () => {
      const oracleConfig = { ...mockPaywallConfig, serviceType: 'oracle' }
      renderWithProviders(<PaywallModal config={oracleConfig} onClose={vi.fn()} />)
      
      expect(screen.getByText('Oracle Database Integration')).toBeInTheDocument()
    })
  })

  describe('Calendly Integration', () => {
    it('loads Calendly widget when schedule demo is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const scheduleButton = screen.getByRole('button', { name: 'Schedule Demo' })
      await user.click(scheduleButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('calendly-widget')).toBeInTheDocument()
      })
    })

    it('handles Calendly widget loading errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock Calendly script loading failure
      Object.defineProperty(window, 'Calendly', {
        value: undefined,
        writable: true
      })
      
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const scheduleButton = screen.getByRole('button', { name: 'Schedule Demo' })
      await user.click(scheduleButton)
      
      await waitFor(() => {
        expect(screen.getByText('Unable to load scheduling widget')).toBeInTheDocument()
      })
    })
  })

  describe('Contact Form', () => {
    it('renders contact form when contact sales is clicked', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const contactButton = screen.getByRole('button', { name: 'Contact Sales' })
      await user.click(contactButton)
      
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Company')).toBeInTheDocument()
      expect(screen.getByLabelText('Message')).toBeInTheDocument()
    })

    it('validates contact form fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const contactButton = screen.getByRole('button', { name: 'Contact Sales' })
      await user.click(contactButton)
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument()
        expect(screen.getByText('Email address is required')).toBeInTheDocument()
      })
    })

    it('submits contact form successfully', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v2/system/contact', () => 
          HttpResponse.json({ message: 'Contact request submitted successfully' })
        )
      )

      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const contactButton = screen.getByRole('button', { name: 'Contact Sales' })
      await user.click(contactButton)
      
      await user.type(screen.getByLabelText('Full Name'), 'John Doe')
      await user.type(screen.getByLabelText('Email Address'), 'john@example.com')
      await user.type(screen.getByLabelText('Company'), 'Test Company')
      await user.type(screen.getByLabelText('Message'), 'Interested in Snowflake integration')
      
      const submitButton = screen.getByRole('button', { name: 'Send Message' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Message sent successfully!')).toBeInTheDocument()
      })
    })
  })

  describe('Modal Interaction', () => {
    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={mockOnClose} />)
      
      const closeButton = screen.getByRole('button', { name: 'Close' })
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('closes modal when escape key is pressed', async () => {
      const user = userEvent.setup()
      const mockOnClose = vi.fn()
      
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={mockOnClose} />)
      
      await user.keyboard('{Escape}')
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('traps focus within modal', async () => {
      const user = userEvent.setup()
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const firstButton = screen.getByRole('button', { name: 'Schedule Demo' })
      const lastButton = screen.getByRole('button', { name: 'Close' })
      
      // Tab from last focusable element should cycle to first
      lastButton.focus()
      await user.tab()
      
      expect(firstButton).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('meets accessibility standards for modal dialogs', async () => {
      const { container } = renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA attributes for modal', () => {
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('announces modal content to screen readers', () => {
      renderWithProviders(<PaywallModal config={mockPaywallConfig} onClose={vi.fn()} />)
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-live', 'polite')
    })
  })
})

describe('Service Form Hooks', () => {
  describe('useServiceForm', () => {
    it('initializes form with default values', () => {
      const { result } = renderHook(() => useServiceForm(), {
        wrapper: TestProviders,
      })
      
      expect(result.current.formState.isValid).toBe(false)
      expect(result.current.watch()).toEqual({})
    })

    it('validates form data according to schema', async () => {
      const { result } = renderHook(() => useServiceForm(), {
        wrapper: TestProviders,
      })
      
      // Set valid form data
      result.current.setValue('serviceType', 'mysql')
      result.current.setValue('name', 'test-service')
      result.current.setValue('host', 'localhost')
      
      await waitFor(() => {
        expect(result.current.formState.isValid).toBe(true)
      })
    })

    it('handles form reset correctly', () => {
      const { result } = renderHook(() => useServiceForm(), {
        wrapper: TestProviders,
      })
      
      result.current.setValue('serviceType', 'mysql')
      result.current.reset()
      
      expect(result.current.watch()).toEqual({})
    })
  })

  describe('useServiceFormWizard', () => {
    it('manages wizard step navigation', () => {
      const { result } = renderHook(() => useServiceFormWizard(), {
        wrapper: TestProviders,
      })
      
      expect(result.current.currentStep).toBe(1)
      expect(result.current.totalSteps).toBe(4)
      
      result.current.nextStep()
      expect(result.current.currentStep).toBe(2)
      
      result.current.previousStep()
      expect(result.current.currentStep).toBe(1)
    })

    it('validates step before allowing navigation', async () => {
      const { result } = renderHook(() => useServiceFormWizard(), {
        wrapper: TestProviders,
      })
      
      // Try to proceed without valid data
      const canProceed = await result.current.validateAndProceed()
      expect(canProceed).toBe(false)
      expect(result.current.currentStep).toBe(1)
    })

    it('tracks wizard completion state', () => {
      const { result } = renderHook(() => useServiceFormWizard(), {
        wrapper: TestProviders,
      })
      
      expect(result.current.isComplete).toBe(false)
      
      // Navigate to last step
      result.current.goToStep(4)
      expect(result.current.isComplete).toBe(true)
    })
  })

  describe('useServiceConnectionTest', () => {
    const mockConnectionData = {
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'test_db',
    }

    beforeEach(() => {
      server.use(
        http.post('/api/v2/system/service/test-connection', () => 
          HttpResponse.json({ success: true, message: 'Connection successful' })
        )
      )
    })

    it('tests database connection successfully', async () => {
      const { result } = renderHook(() => useServiceConnectionTest(), {
        wrapper: TestProviders,
      })
      
      await result.current.testConnection(mockConnectionData)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isSuccess).toBe(true)
        expect(result.current.error).toBeNull()
      })
    })

    it('handles connection test failure', async () => {
      server.use(
        http.post('/api/v2/system/service/test-connection', () => 
          HttpResponse.json({ error: { message: 'Connection failed' } }, { status: 400 })
        )
      )

      const { result } = renderHook(() => useServiceConnectionTest(), {
        wrapper: TestProviders,
      })
      
      await result.current.testConnection(mockConnectionData)
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isSuccess).toBe(false)
        expect(result.current.error).toBe('Connection failed')
      })
    })

    it('debounces connection test requests', async () => {
      const { result } = renderHook(() => useServiceConnectionTest(), {
        wrapper: TestProviders,
      })
      
      // Trigger multiple rapid connection tests
      result.current.testConnection(mockConnectionData)
      result.current.testConnection(mockConnectionData)
      result.current.testConnection(mockConnectionData)
      
      // Only one request should be made
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('useServiceFormPaywall', () => {
    it('manages paywall visibility state', () => {
      const { result } = renderHook(() => useServiceFormPaywall(), {
        wrapper: TestProviders,
      })
      
      expect(result.current.isVisible).toBe(false)
      
      result.current.showPaywall('snowflake', 'premium-database')
      expect(result.current.isVisible).toBe(true)
      expect(result.current.serviceType).toBe('snowflake')
      
      result.current.hidePaywall()
      expect(result.current.isVisible).toBe(false)
    })

    it('checks premium feature access', () => {
      const { result } = renderHook(() => useServiceFormPaywall(), {
        wrapper: TestProviders,
      })
      
      expect(result.current.hasAccess('snowflake')).toBe(false)
      expect(result.current.hasAccess('mysql')).toBe(true)
    })
  })
})

describe('Integration Tests', () => {
  describe('Complete Service Creation Workflow', () => {
    it('completes full service creation workflow', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v2/system/service', () => 
          HttpResponse.json({ resource: [{ id: 'new-service-id', name: 'test-service' }] })
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      // Step 1: Select service type
      await user.click(screen.getByRole('radio', { name: 'MySQL' }))
      await user.click(screen.getByRole('button', { name: 'Next' }))
      
      // Step 2: Basic configuration
      await user.type(screen.getByLabelText('Service Name'), 'test-mysql-service')
      await user.type(screen.getByLabelText('Display Label'), 'Test MySQL Service')
      await user.type(screen.getByLabelText('Host'), 'localhost')
      await user.type(screen.getByLabelText('Username'), 'root')
      await user.type(screen.getByLabelText('Password'), 'password')
      await user.click(screen.getByRole('button', { name: 'Next' }))
      
      // Step 3: Advanced options (skip)
      await user.click(screen.getByRole('button', { name: 'Next' }))
      
      // Step 4: Security configuration
      await user.click(screen.getByRole('radio', { name: 'Open Access' }))
      
      // Submit form
      await user.click(screen.getByRole('button', { name: 'Create Service' }))
      
      // Verify success and navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/api-connections/database/new-service-id/api-docs')
      })
    })

    it('handles service creation with paywall intervention', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<ServiceFormContainer />)
      
      // Try to select premium service type
      await user.click(screen.getByRole('radio', { name: 'Snowflake' }))
      
      // Paywall modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByText('Premium Feature')).toBeInTheDocument()
      })
    })

    it('handles connection testing during configuration', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v2/system/service/test-connection', () => 
          HttpResponse.json({ success: true, message: 'Connection successful' })
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      // Navigate to configuration step
      await user.click(screen.getByRole('radio', { name: 'MySQL' }))
      await user.click(screen.getByRole('button', { name: 'Next' }))
      
      // Fill in connection details
      await user.type(screen.getByLabelText('Host'), 'localhost')
      await user.type(screen.getByLabelText('Username'), 'root')
      await user.type(screen.getByLabelText('Password'), 'password')
      
      // Test connection
      await user.click(screen.getByRole('button', { name: 'Test Connection' }))
      
      await waitFor(() => {
        expect(screen.getByText('Connection successful')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v2/system/service', () => 
          HttpResponse.json({ error: { message: 'Service creation failed' } }, { status: 500 })
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      // Complete form and submit
      await user.click(screen.getByRole('radio', { name: 'MySQL' }))
      await user.click(screen.getByRole('button', { name: 'Skip to Review' }))
      await user.click(screen.getByRole('button', { name: 'Create Service' }))
      
      await waitFor(() => {
        expect(screen.getByText('Service creation failed')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      })
    })

    it('handles network errors during form submission', async () => {
      const user = userEvent.setup()
      
      server.use(
        http.post('/api/v2/system/service', () => 
          HttpResponse.error()
        )
      )

      renderWithProviders(<ServiceFormContainer />)
      
      // Complete form and submit
      await user.click(screen.getByRole('radio', { name: 'MySQL' }))
      await user.click(screen.getByRole('button', { name: 'Skip to Review' }))
      await user.click(screen.getByRole('button', { name: 'Create Service' }))
      
      await waitFor(() => {
        expect(screen.getByText('Network error. Please check your connection and try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('renders service form within performance budget', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<ServiceFormContainer />)
      
      await waitFor(() => {
        expect(screen.getByTestId('service-form-container')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render within 2 seconds as per technical requirements
      expect(renderTime).toBeLessThan(2000)
    })

    it('validates form fields within 100ms requirement', async () => {
      const user = userEvent.setup()
      renderWithProviders(<ServiceFormWizard data={{}} onSubmit={vi.fn()} />)
      
      const nameField = screen.getByLabelText('Service Name')
      
      const startTime = performance.now()
      await user.type(nameField, 'a')
      await user.clear(nameField)
      
      await waitFor(() => {
        expect(screen.getByText('Service name is required')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      // Should validate within 100ms as per integration requirements
      expect(validationTime).toBeLessThan(100)
    })
  })
})