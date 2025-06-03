/**
 * Comprehensive Vitest test suite for field form component
 * 
 * Tests form validation, field type-based control enabling/disabling, submission workflows
 * for both create and edit modes, integration with function use components, and accessibility
 * compliance. Includes Mock Service Worker setup for API interaction testing.
 * 
 * Implements React Testing Library integration per Section 3.2.7 compatibility requirements
 * and MSW mock service worker configuration per Section 3.2.4 HTTP client patterns.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  within,
  act,
  cleanup
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Component imports
import FieldForm from './field-form'
import type { 
  FieldFormData, 
  DatabaseSchemaFieldType,
  FieldType,
  ReferenceAction,
  FIELD_TYPES,
  REFERENCE_ACTIONS 
} from './df-field-details.types'

// Test utilities and mocks
import { createTestQueryClient, renderWithProviders } from '@/test/utils/test-utils'
import { createMockFieldData, createMockDatabaseService } from '@/test/mocks/mock-data'
import { createErrorResponse } from '@/test/mocks/error-responses'

// Add jest-axe matcher
expect.extend(toHaveNoViolations)

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace
  }),
  useParams: () => ({
    service: 'test-service',
    table: 'test-table',
    fieldId: undefined
  }),
  useSearchParams: () => new URLSearchParams()
}))

// MSW server setup for API mocking
const server = setupServer(
  // Field creation endpoint
  rest.post('/api/v2/:service/_schema/:table/_field', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        resource: [createMockFieldData()]
      })
    )
  }),

  // Field update endpoint
  rest.patch('/api/v2/:service/_schema/:table/_field/:fieldName', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        resource: [createMockFieldData({ name: req.params.fieldName as string })]
      })
    )
  }),

  // Field validation endpoint
  rest.post('/api/v2/:service/_schema/:table/_field/_validate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ valid: true })
    )
  }),

  // Reference tables endpoint
  rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: [
          { name: 'users', label: 'Users' },
          { name: 'products', label: 'Products' },
          { name: 'orders', label: 'Orders' }
        ]
      })
    )
  }),

  // Reference fields endpoint
  rest.get('/api/v2/:service/_schema/:table', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        resource: [
          { name: 'id', type: 'integer', isPrimaryKey: true },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' }
        ]
      })
    )
  })
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})

describe('FieldForm Component', () => {
  const defaultProps = {
    serviceName: 'test-service',
    tableName: 'test-table',
    isEditMode: false,
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  }

  const editModeProps = {
    ...defaultProps,
    isEditMode: true,
    fieldName: 'existing-field',
    initialData: createMockFieldData({
      name: 'existing-field',
      label: 'Existing Field',
      type: 'string',
      required: true
    })
  }

  // Test utilities
  const renderFieldForm = (props = defaultProps) => {
    return renderWithProviders(<FieldForm {...props} />)
  }

  const fillBasicFieldInfo = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/field name/i), 'test_field')
    await user.type(screen.getByLabelText(/field label/i), 'Test Field')
    await user.selectOptions(screen.getByLabelText(/field type/i), 'string')
  }

  const expectFieldToBeEnabled = (fieldName: string) => {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
    expect(field).not.toBeDisabled()
  }

  const expectFieldToBeDisabled = (fieldName: string) => {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i'))
    expect(field).toBeDisabled()
  }

  describe('Form Rendering and Initial State', () => {
    it('renders all required form fields in create mode', () => {
      renderFieldForm()

      // Basic information fields
      expect(screen.getByLabelText(/field name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/field label/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/field type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()

      // Constraint fields
      expect(screen.getByLabelText(/required/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/allow null/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/unique/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/primary key/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/auto increment/i)).toBeInTheDocument()

      // Type-specific fields
      expect(screen.getByLabelText(/length/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/precision/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/scale/i)).toBeInTheDocument()

      // Action buttons
      expect(screen.getByRole('button', { name: /create field/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('renders with initial data in edit mode', () => {
      renderFieldForm(editModeProps)

      expect(screen.getByDisplayValue('existing-field')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Existing Field')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update field/i })).toBeInTheDocument()
    })

    it('renders all field type options', () => {
      renderFieldForm()
      
      const typeSelect = screen.getByLabelText(/field type/i)
      FIELD_TYPES.forEach(type => {
        expect(within(typeSelect).getByRole('option', { name: new RegExp(type, 'i') }))
          .toBeInTheDocument()
      })
    })

    it('renders all reference action options when foreign key is enabled', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Enable foreign key to show reference actions
      await user.click(screen.getByLabelText(/foreign key/i))
      
      await waitFor(() => {
        const deleteActionSelect = screen.getByLabelText(/on delete/i)
        const updateActionSelect = screen.getByLabelText(/on update/i)

        REFERENCE_ACTIONS.forEach(action => {
          expect(within(deleteActionSelect).getByRole('option', { name: action }))
            .toBeInTheDocument()
          expect(within(updateActionSelect).getByRole('option', { name: action }))
            .toBeInTheDocument()
        })
      })
    })
  })

  describe('Field Type-Based Control Enabling/Disabling', () => {
    it('enables length field for string types', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'string')
      
      await waitFor(() => {
        expectFieldToBeEnabled('length')
      })
    })

    it('disables length field for non-string types', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'boolean')
      
      await waitFor(() => {
        expectFieldToBeDisabled('length')
      })
    })

    it('enables precision and scale for decimal types', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'decimal')
      
      await waitFor(() => {
        expectFieldToBeEnabled('precision')
        expectFieldToBeEnabled('scale')
      })
    })

    it('disables precision and scale for non-decimal types', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'string')
      
      await waitFor(() => {
        expectFieldToBeDisabled('precision')
        expectFieldToBeDisabled('scale')
      })
    })

    it('enables auto increment only for integer types', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Test integer type enables auto increment
      await user.selectOptions(screen.getByLabelText(/field type/i), 'integer')
      
      await waitFor(() => {
        expectFieldToBeEnabled('auto increment')
      })

      // Test string type disables auto increment
      await user.selectOptions(screen.getByLabelText(/field type/i), 'string')
      
      await waitFor(() => {
        expectFieldToBeDisabled('auto increment')
      })
    })

    it('enables foreign key fields when foreign key toggle is checked', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.click(screen.getByLabelText(/foreign key/i))
      
      await waitFor(() => {
        expectFieldToBeEnabled('reference table')
        expectFieldToBeEnabled('reference field')
        expectFieldToBeEnabled('on delete')
        expectFieldToBeEnabled('on update')
      })
    })

    it('disables foreign key fields when foreign key toggle is unchecked', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Foreign key should be disabled by default
      expectFieldToBeDisabled('reference table')
      expectFieldToBeDisabled('reference field')
      expectFieldToBeDisabled('on delete')
      expectFieldToBeDisabled('on update')
    })
  })

  describe('Form Validation', () => {
    it('validates required field name', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Try to submit without field name
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(screen.getByText(/field name is required/i)).toBeInTheDocument()
      })
    })

    it('validates field name format', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Enter invalid field name
      await user.type(screen.getByLabelText(/field name/i), '123invalid')
      await user.tab() // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/field name must start with a letter/i)).toBeInTheDocument()
      })
    })

    it('validates required field label', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.type(screen.getByLabelText(/field name/i), 'valid_field')
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(screen.getByText(/field label is required/i)).toBeInTheDocument()
      })
    })

    it('validates length constraints for numeric fields', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'string')
      await user.type(screen.getByLabelText(/length/i), '0')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/length must be greater than 0/i)).toBeInTheDocument()
      })
    })

    it('validates precision and scale relationship for decimal types', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'decimal')
      await user.type(screen.getByLabelText(/precision/i), '5')
      await user.type(screen.getByLabelText(/scale/i), '10')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/scale cannot be greater than precision/i)).toBeInTheDocument()
      })
    })

    it('validates auto increment requirements', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await user.selectOptions(screen.getByLabelText(/field type/i), 'integer')
      await user.click(screen.getByLabelText(/auto increment/i))
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(screen.getByText(/auto increment requires the field to be a primary key/i))
          .toBeInTheDocument()
      })
    })

    it('validates foreign key requirements', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await fillBasicFieldInfo(user)
      await user.click(screen.getByLabelText(/foreign key/i))
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(screen.getByText(/foreign key requires both reference table and field/i))
          .toBeInTheDocument()
      })
    })

    it('validates primary key cannot allow null', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await fillBasicFieldInfo(user)
      await user.click(screen.getByLabelText(/primary key/i))
      await user.click(screen.getByLabelText(/allow null/i))
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(screen.getByText(/primary key fields cannot allow null values/i))
          .toBeInTheDocument()
      })
    })

    it('validates required fields cannot allow null', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await fillBasicFieldInfo(user)
      await user.click(screen.getByLabelText(/required/i))
      await user.click(screen.getByLabelText(/allow null/i))
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(screen.getByText(/required fields cannot allow null values/i))
          .toBeInTheDocument()
      })
    })

    it('shows real-time validation for field name uniqueness', async () => {
      // Mock server response for duplicate field name
      server.use(
        rest.post('/api/v2/:service/_schema/:table/_field/_validate', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json(createErrorResponse(409, 'Field name already exists'))
          )
        })
      )

      const user = userEvent.setup()
      renderFieldForm()

      await user.type(screen.getByLabelText(/field name/i), 'existing_field')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/field name already exists/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission Workflows', () => {
    describe('Create Mode', () => {
      it('submits valid form data and calls onSubmit', async () => {
        const mockOnSubmit = vi.fn()
        const user = userEvent.setup()
        
        renderFieldForm({ ...defaultProps, onSubmit: mockOnSubmit })

        // Fill valid form data
        await fillBasicFieldInfo(user)
        await user.type(screen.getByLabelText(/description/i), 'Test field description')
        await user.click(screen.getByLabelText(/required/i))

        await user.click(screen.getByRole('button', { name: /create field/i }))

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'test_field',
              label: 'Test Field',
              type: 'string',
              description: 'Test field description',
              required: true,
              allowNull: false
            })
          )
        })
      })

      it('disables submit button during submission', async () => {
        const user = userEvent.setup()
        renderFieldForm()

        await fillBasicFieldInfo(user)

        const submitButton = screen.getByRole('button', { name: /create field/i })
        await user.click(submitButton)

        expect(submitButton).toBeDisabled()
        expect(screen.getByText(/creating field.../i)).toBeInTheDocument()
      })

      it('handles submission errors gracefully', async () => {
        // Mock server error response
        server.use(
          rest.post('/api/v2/:service/_schema/:table/_field', (req, res, ctx) => {
            return res(
              ctx.status(500),
              ctx.json(createErrorResponse(500, 'Internal server error'))
            )
          })
        )

        const user = userEvent.setup()
        renderFieldForm()

        await fillBasicFieldInfo(user)
        await user.click(screen.getByRole('button', { name: /create field/i }))

        await waitFor(() => {
          expect(screen.getByText(/failed to create field/i)).toBeInTheDocument()
          expect(screen.getByText(/internal server error/i)).toBeInTheDocument()
        })

        // Ensure form is re-enabled after error
        expect(screen.getByRole('button', { name: /create field/i })).not.toBeDisabled()
      })
    })

    describe('Edit Mode', () => {
      it('submits updated field data', async () => {
        const mockOnSubmit = vi.fn()
        const user = userEvent.setup()
        
        renderFieldForm({ ...editModeProps, onSubmit: mockOnSubmit })

        // Modify field label
        const labelInput = screen.getByDisplayValue('Existing Field')
        await user.clear(labelInput)
        await user.type(labelInput, 'Updated Field Label')

        await user.click(screen.getByRole('button', { name: /update field/i }))

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'existing-field',
              label: 'Updated Field Label'
            })
          )
        })
      })

      it('prevents modification of field name in edit mode', () => {
        renderFieldForm(editModeProps)

        const nameInput = screen.getByDisplayValue('existing-field')
        expect(nameInput).toBeDisabled()
      })

      it('shows correct button text in edit mode', () => {
        renderFieldForm(editModeProps)

        expect(screen.getByRole('button', { name: /update field/i })).toBeInTheDocument()
        expect(screen.queryByRole('button', { name: /create field/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Function Use Component Integration', () => {
    it('renders function use section when database functions are supported', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await fillBasicFieldInfo(user)
      
      // Function use section should be visible
      expect(screen.getByText(/database functions/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add function/i })).toBeInTheDocument()
    })

    it('allows adding database functions', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await fillBasicFieldInfo(user)
      await user.click(screen.getByRole('button', { name: /add function/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/function name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/function use/i)).toBeInTheDocument()
      })
    })

    it('validates function configuration', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      await fillBasicFieldInfo(user)
      await user.click(screen.getByRole('button', { name: /add function/i }))

      // Try to save without function name
      await user.click(screen.getByRole('button', { name: /save function/i }))

      await waitFor(() => {
        expect(screen.getByText(/function name is required/i)).toBeInTheDocument()
      })
    })

    it('includes function data in form submission', async () => {
      const mockOnSubmit = vi.fn()
      const user = userEvent.setup()
      
      renderFieldForm({ ...defaultProps, onSubmit: mockOnSubmit })

      await fillBasicFieldInfo(user)
      await user.click(screen.getByRole('button', { name: /add function/i }))

      // Fill function details
      await user.type(screen.getByLabelText(/function name/i), 'NOW')
      await user.selectOptions(screen.getByLabelText(/function use/i), ['INSERT', 'UPDATE'])
      await user.click(screen.getByRole('button', { name: /save function/i }))

      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            dbFunction: expect.arrayContaining([
              expect.objectContaining({
                function: 'NOW',
                use: ['INSERT', 'UPDATE']
              })
            ])
          })
        )
      })
    })
  })

  describe('User Interactions and Edge Cases', () => {
    it('handles rapid field type changes correctly', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      const typeSelect = screen.getByLabelText(/field type/i)

      // Rapidly change field types
      await user.selectOptions(typeSelect, 'string')
      await user.selectOptions(typeSelect, 'decimal')
      await user.selectOptions(typeSelect, 'boolean')
      await user.selectOptions(typeSelect, 'integer')

      // Verify final state is correct for integer
      await waitFor(() => {
        expectFieldToBeDisabled('length')
        expectFieldToBeDisabled('precision')
        expectFieldToBeDisabled('scale')
        expectFieldToBeEnabled('auto increment')
      })
    })

    it('preserves form data when switching between tabs', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Fill basic information
      await user.type(screen.getByLabelText(/field name/i), 'test_field')
      await user.type(screen.getByLabelText(/field label/i), 'Test Field')

      // Navigate to constraints tab
      await user.click(screen.getByRole('tab', { name: /constraints/i }))
      await user.click(screen.getByLabelText(/required/i))

      // Navigate back to basic tab
      await user.click(screen.getByRole('tab', { name: /basic/i }))

      // Verify data is preserved
      expect(screen.getByDisplayValue('test_field')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Field')).toBeInTheDocument()

      // Navigate back to constraints and verify state
      await user.click(screen.getByRole('tab', { name: /constraints/i }))
      expect(screen.getByLabelText(/required/i)).toBeChecked()
    })

    it('handles form reset correctly', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Fill form with data
      await fillBasicFieldInfo(user)
      await user.type(screen.getByLabelText(/description/i), 'Test description')
      await user.click(screen.getByLabelText(/required/i))

      // Reset form
      await user.click(screen.getByRole('button', { name: /reset/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/field name/i)).toHaveValue('')
        expect(screen.getByLabelText(/field label/i)).toHaveValue('')
        expect(screen.getByLabelText(/description/i)).toHaveValue('')
        expect(screen.getByLabelText(/required/i)).not.toBeChecked()
      })
    })

    it('handles cancellation correctly', async () => {
      const mockOnCancel = vi.fn()
      const user = userEvent.setup()
      
      renderFieldForm({ ...defaultProps, onCancel: mockOnCancel })

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('warns about unsaved changes when leaving form', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Make changes to form
      await user.type(screen.getByLabelText(/field name/i), 'test_field')

      // Try to navigate away (simulate beforeunload)
      const beforeUnloadEvent = new Event('beforeunload')
      Object.defineProperty(beforeUnloadEvent, 'returnValue', {
        writable: true,
        value: ''
      })

      act(() => {
        window.dispatchEvent(beforeUnloadEvent)
      })

      expect(beforeUnloadEvent.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?')
    })
  })

  describe('Accessibility Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderFieldForm()
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports keyboard navigation', async () => {
      renderFieldForm()

      const firstInput = screen.getByLabelText(/field name/i)
      firstInput.focus()

      // Tab through form elements
      await userEvent.tab()
      expect(screen.getByLabelText(/field label/i)).toHaveFocus()

      await userEvent.tab()
      expect(screen.getByLabelText(/field type/i)).toHaveFocus()

      await userEvent.tab()
      expect(screen.getByLabelText(/description/i)).toHaveFocus()
    })

    it('has proper ARIA labels and descriptions', () => {
      renderFieldForm()

      // Check form has proper labeling
      expect(screen.getByRole('form', { name: /field configuration/i })).toBeInTheDocument()

      // Check required field indicators
      const nameInput = screen.getByLabelText(/field name/i)
      expect(nameInput).toHaveAttribute('aria-required', 'true')

      const labelInput = screen.getByLabelText(/field label/i)
      expect(labelInput).toHaveAttribute('aria-required', 'true')

      // Check help text associations
      const lengthInput = screen.getByLabelText(/length/i)
      expect(lengthInput).toHaveAttribute('aria-describedby')
    })

    it('announces validation errors to screen readers', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /create field/i }))

      await waitFor(() => {
        const errorMessage = screen.getByText(/field name is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('has proper focus management for modals and dialogs', async () => {
      const user = userEvent.setup()
      renderFieldForm()

      // Open function configuration dialog
      await user.click(screen.getByRole('button', { name: /add function/i }))

      await waitFor(() => {
        const dialog = screen.getByRole('dialog', { name: /database function configuration/i })
        expect(dialog).toBeInTheDocument()
        
        // First focusable element in dialog should receive focus
        const firstInput = within(dialog).getByLabelText(/function name/i)
        expect(firstInput).toHaveFocus()
      })

      // Close dialog and verify focus returns
      await user.press('Escape')
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add function/i })).toHaveFocus()
      })
    })

    it('provides proper color contrast and visual indicators', () => {
      renderFieldForm()

      // Verify error states have sufficient contrast
      const errorElements = screen.queryAllByRole('alert')
      errorElements.forEach(element => {
        const styles = window.getComputedStyle(element)
        // Color contrast validation would typically be done with automated tools
        expect(element).toHaveClass('text-red-600') // Tailwind error color class
      })

      // Verify required field indicators
      const requiredFields = screen.getAllByText('*')
      requiredFields.forEach(indicator => {
        expect(indicator).toHaveClass('text-red-500')
      })
    })

    it('supports high contrast mode', () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(), // deprecated
          removeListener: vi.fn(), // deprecated
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }))
      })

      renderFieldForm()

      // Verify high contrast styles are applied
      const formElement = screen.getByRole('form')
      expect(formElement).toHaveClass('high-contrast')
    })
  })

  describe('Performance and Loading States', () => {
    it('shows loading state while fetching reference data', async () => {
      // Mock slow API response
      server.use(
        rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
          return res(
            ctx.delay(1000),
            ctx.status(200),
            ctx.json({ resource: [] })
          )
        })
      )

      const user = userEvent.setup()
      renderFieldForm()

      await user.click(screen.getByLabelText(/foreign key/i))

      // Should show loading state for reference tables
      expect(screen.getByText(/loading tables.../i)).toBeInTheDocument()
    })

    it('handles API errors gracefully during reference data loading', async () => {
      // Mock API error
      server.use(
        rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json(createErrorResponse(500, 'Failed to load tables'))
          )
        })
      )

      const user = userEvent.setup()
      renderFieldForm()

      await user.click(screen.getByLabelText(/foreign key/i))

      await waitFor(() => {
        expect(screen.getByText(/failed to load reference tables/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('debounces field name validation API calls', async () => {
      const validationSpy = vi.fn()
      server.use(
        rest.post('/api/v2/:service/_schema/:table/_field/_validate', (req, res, ctx) => {
          validationSpy()
          return res(ctx.status(200), ctx.json({ valid: true }))
        })
      )

      const user = userEvent.setup()
      renderFieldForm()

      const nameInput = screen.getByLabelText(/field name/i)

      // Type rapidly
      await user.type(nameInput, 'test_field_name')

      // Wait for debounce and verify only one API call was made
      await waitFor(() => {
        expect(validationSpy).toHaveBeenCalledTimes(1)
      }, { timeout: 2000 })
    })

    it('renders large lists efficiently with virtualization', async () => {
      // Mock large dataset
      const largeTables = Array.from({ length: 1000 }, (_, i) => ({
        name: `table_${i}`,
        label: `Table ${i}`
      }))

      server.use(
        rest.get('/api/v2/:service/_schema', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ resource: largeTables }))
        })
      )

      const user = userEvent.setup()
      renderFieldForm()

      await user.click(screen.getByLabelText(/foreign key/i))

      await waitFor(() => {
        const tableSelect = screen.getByLabelText(/reference table/i)
        expect(tableSelect).toBeInTheDocument()
        
        // Should use virtual scrolling for large lists
        expect(tableSelect).toHaveAttribute('data-virtualized', 'true')
      })
    })
  })
})