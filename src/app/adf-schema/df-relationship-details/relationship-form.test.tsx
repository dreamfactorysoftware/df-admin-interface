/**
 * Vitest unit tests for the RelationshipForm component
 * 
 * Tests comprehensive form validation, dynamic field behavior, user interactions,
 * and submission handling with React Hook Form and Zod schema validation.
 * Validates performance requirements for real-time validation under 100ms.
 * 
 * @fileoverview React Hook Form testing with MSW integration for DreamFactory
 * relationship configuration workflow validation
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/test/mocks/server'
import { handlers } from '@/test/mocks/handlers'
import { RelationshipForm } from './relationship-form'
import { relationshipSchema } from './validation-schemas'
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockRelationship, createMockTableField } from '@/test/utils/component-factories'
import type { RelationshipFormData, RelationshipType } from '@/types/schema'

// Performance testing utilities
const measureValidationPerformance = async (action: () => Promise<void> | void): Promise<number> => {
  const startTime = performance.now()
  await action()
  const endTime = performance.now()
  return endTime - startTime
}

// Mock data factories
const mockTableFields = [
  createMockTableField({ id: 1, name: 'id', type: 'integer', is_primary_key: true }),
  createMockTableField({ id: 2, name: 'user_id', type: 'integer' }),
  createMockTableField({ id: 3, name: 'email', type: 'string' }),
  createMockTableField({ id: 4, name: 'created_at', type: 'timestamp' })
]

const mockRelatedTables = [
  { id: 1, name: 'users', schema_name: 'public' },
  { id: 2, name: 'roles', schema_name: 'public' },
  { id: 3, name: 'permissions', schema_name: 'public' }
]

const mockBelongsToRelationship = createMockRelationship({
  type: 'belongs_to' as RelationshipType,
  table_id: 1,
  local_field: 'user_id',
  foreign_table_id: 2,
  foreign_field: 'id',
  alias: 'user',
  always_fetch: false,
  native: true
})

const mockManyManyRelationship = createMockRelationship({
  type: 'many_many' as RelationshipType,
  table_id: 1,
  local_field: 'id',
  foreign_table_id: 3,
  foreign_field: 'id',
  junction_table_id: 2,
  junction_local_field: 'user_id',
  junction_foreign_field: 'role_id',
  alias: 'user_roles',
  always_fetch: true,
  native: false
})

describe('RelationshipForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeAll(() => {
    // Setup MSW server for API mocking
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    user = userEvent.setup()
    server.resetHandlers(...handlers)
    
    // Mock performance.now for consistent testing
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  })

  afterEach(() => {
    server.resetHandlers()
    vi.restoreAllMocks()
  })

  describe('Form Initialization and Rendering', () => {
    it('should render form with all required fields for new relationship', () => {
      const { container } = renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Verify form structure
      expect(screen.getByRole('form', { name: /relationship configuration/i })).toBeInTheDocument()
      
      // Required fields for all relationships
      expect(screen.getByLabelText(/relationship type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/alias/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/local field/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/foreign table/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/foreign field/i)).toBeInTheDocument()
      
      // Configuration options
      expect(screen.getByLabelText(/always fetch/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/native/i)).toBeInTheDocument()
      
      // Action buttons
      expect(screen.getByRole('button', { name: /create relationship/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()

      // Form should have proper accessibility attributes
      expect(container.querySelector('form')).toHaveAttribute('aria-label')
    })

    it('should populate form with existing relationship data in edit mode', () => {
      renderWithProviders(
        <RelationshipForm
          mode="edit"
          initialData={mockBelongsToRelationship}
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Verify pre-populated values
      expect(screen.getByDisplayValue('belongs_to')).toBeInTheDocument()
      expect(screen.getByDisplayValue('user')).toBeInTheDocument()
      expect(screen.getByDisplayValue('user_id')).toBeInTheDocument()
      
      // Button should show update text
      expect(screen.getByRole('button', { name: /update relationship/i })).toBeInTheDocument()
    })

    it('should initialize with loading state when tableFields is empty', () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={[]}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(screen.getByRole('status', { name: /loading fields/i })).toBeInTheDocument()
    })
  })

  describe('Zod Schema Validation', () => {
    it('should validate required fields with appropriate error messages', async () => {
      const onSubmit = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      )

      // Attempt to submit empty form
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/relationship type is required/i)).toBeInTheDocument()
        expect(screen.getByText(/alias is required/i)).toBeInTheDocument()
        expect(screen.getByText(/local field is required/i)).toBeInTheDocument()
        expect(screen.getByText(/foreign table is required/i)).toBeInTheDocument()
        expect(screen.getByText(/foreign field is required/i)).toBeInTheDocument()
      })

      // Form should not submit with validation errors
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should validate alias uniqueness when provided', async () => {
      const validationSpy = vi.spyOn(relationshipSchema, 'parseAsync')
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          existingAliases={['user', 'profile']}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const aliasInput = screen.getByLabelText(/alias/i)
      await user.type(aliasInput, 'user')

      // Trigger validation
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/alias must be unique/i)).toBeInTheDocument()
      })

      expect(validationSpy).toHaveBeenCalled()
    })

    it('should validate field dependencies for belongs_to relationships', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Select belongs_to relationship type
      const typeSelect = screen.getByLabelText(/relationship type/i)
      await user.selectOptions(typeSelect, 'belongs_to')

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Should validate that junction fields are not required for belongs_to
        expect(screen.queryByText(/junction table is required/i)).not.toBeInTheDocument()
        
        // But foreign fields are still required
        expect(screen.getByText(/foreign field is required/i)).toBeInTheDocument()
      })
    })

    it('should validate junction table requirements for many_many relationships', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Select many_many relationship type
      const typeSelect = screen.getByLabelText(/relationship type/i)
      await user.selectOptions(typeSelect, 'many_many')

      // Fill required basic fields
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'id')
      await user.selectOptions(screen.getByLabelText(/foreign table/i), 'users')

      // Try to submit without junction table fields
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/junction table is required for many_many relationships/i)).toBeInTheDocument()
        expect(screen.getByText(/junction local field is required/i)).toBeInTheDocument()
        expect(screen.getByText(/junction foreign field is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Dynamic Field Behavior', () => {
    it('should show/hide junction table fields based on relationship type', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Initially, junction fields should be hidden (no type selected)
      expect(screen.queryByLabelText(/junction table/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/junction local field/i)).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/junction foreign field/i)).not.toBeInTheDocument()

      // Select belongs_to - junction fields should remain hidden
      const typeSelect = screen.getByLabelText(/relationship type/i)
      await user.selectOptions(typeSelect, 'belongs_to')

      await waitFor(() => {
        expect(screen.queryByLabelText(/junction table/i)).not.toBeInTheDocument()
      })

      // Select many_many - junction fields should appear
      await user.selectOptions(typeSelect, 'many_many')

      await waitFor(() => {
        expect(screen.getByLabelText(/junction table/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/junction local field/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/junction foreign field/i)).toBeInTheDocument()
      })

      // Switch back to belongs_to - junction fields should disappear
      await user.selectOptions(typeSelect, 'belongs_to')

      await waitFor(() => {
        expect(screen.queryByLabelText(/junction table/i)).not.toBeInTheDocument()
      })
    })

    it('should update available foreign fields when foreign table changes', async () => {
      // Mock API call for foreign table fields
      server.use(
        rest.get('/api/v2/system/service/:serviceId/table/:tableName/field', (req, res, ctx) => {
          const tableName = req.params.tableName
          if (tableName === 'users') {
            return res(ctx.json({
              resource: [
                { name: 'id', type: 'integer' },
                { name: 'email', type: 'string' },
                { name: 'username', type: 'string' }
              ]
            }))
          }
          return res(ctx.json({ resource: [] }))
        })
      )

      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Select relationship type first
      const typeSelect = screen.getByLabelText(/relationship type/i)
      await user.selectOptions(typeSelect, 'belongs_to')

      // Select foreign table
      const foreignTableSelect = screen.getByLabelText(/foreign table/i)
      await user.selectOptions(foreignTableSelect, 'users')

      // Wait for foreign fields to load
      await waitFor(() => {
        const foreignFieldSelect = screen.getByLabelText(/foreign field/i)
        expect(within(foreignFieldSelect).getByRole('option', { name: /id/i })).toBeInTheDocument()
        expect(within(foreignFieldSelect).getByRole('option', { name: /email/i })).toBeInTheDocument()
        expect(within(foreignFieldSelect).getByRole('option', { name: /username/i })).toBeInTheDocument()
      })
    })

    it('should clear dependent field values when parent field changes', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="edit"
          initialData={mockManyManyRelationship}
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Verify initial values are set
      expect(screen.getByDisplayValue('many_many')).toBeInTheDocument()
      expect(screen.getByDisplayValue('user_roles')).toBeInTheDocument()

      // Change relationship type - this should clear junction table fields
      const typeSelect = screen.getByLabelText(/relationship type/i)
      await user.selectOptions(typeSelect, 'belongs_to')

      await waitFor(() => {
        // Junction fields should be cleared and hidden
        expect(screen.queryByLabelText(/junction table/i)).not.toBeInTheDocument()
      })

      // Switch back to many_many
      await user.selectOptions(typeSelect, 'many_many')

      await waitFor(() => {
        // Junction fields should reappear but be empty
        const junctionTableSelect = screen.getByLabelText(/junction table/i)
        expect(junctionTableSelect).toBeInTheDocument()
        expect(junctionTableSelect).toHaveValue('')
      })
    })
  })

  describe('User Interactions and Form State', () => {
    it('should handle form submission with valid belongs_to relationship data', async () => {
      const onSubmit = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      )

      // Fill out form with valid belongs_to data
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.type(screen.getByLabelText(/alias/i), 'user_profile')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'user_id')
      await user.selectOptions(screen.getByLabelText(/foreign table/i), 'users')
      
      // Mock foreign field loading
      await waitFor(() => {
        const foreignFieldSelect = screen.getByLabelText(/foreign field/i)
        fireEvent.change(foreignFieldSelect, { target: { value: 'id' } })
      })

      // Set configuration options
      const alwaysFetchToggle = screen.getByLabelText(/always fetch/i)
      await user.click(alwaysFetchToggle)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          type: 'belongs_to',
          alias: 'user_profile',
          local_field: 'user_id',
          foreign_table: 'users',
          foreign_field: 'id',
          always_fetch: true,
          native: true,
          // Junction fields should not be present for belongs_to
          junction_table: undefined,
          junction_local_field: undefined,
          junction_foreign_field: undefined
        })
      })
    })

    it('should handle form submission with valid many_many relationship data', async () => {
      const onSubmit = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      )

      // Fill out form with valid many_many data
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'many_many')
      await user.type(screen.getByLabelText(/alias/i), 'user_roles')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'id')
      await user.selectOptions(screen.getByLabelText(/foreign table/i), 'roles')
      await user.selectOptions(screen.getByLabelText(/foreign field/i), 'id')
      
      // Fill junction table fields
      await user.selectOptions(screen.getByLabelText(/junction table/i), 'user_roles_junction')
      await user.selectOptions(screen.getByLabelText(/junction local field/i), 'user_id')
      await user.selectOptions(screen.getByLabelText(/junction foreign field/i), 'role_id')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          type: 'many_many',
          alias: 'user_roles',
          local_field: 'id',
          foreign_table: 'roles',
          foreign_field: 'id',
          junction_table: 'user_roles_junction',
          junction_local_field: 'user_id',
          junction_foreign_field: 'role_id',
          always_fetch: false,
          native: true
        })
      })
    })

    it('should handle cancel action without submitting', async () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )

      // Fill some form data
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should reset form when reset button is clicked', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          showReset={true}
        />
      )

      // Fill form data
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')

      // Verify data is filled
      expect(screen.getByDisplayValue('belongs_to')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test_relationship')).toBeInTheDocument()

      // Click reset
      const resetButton = screen.getByRole('button', { name: /reset/i })
      await user.click(resetButton)

      // Verify form is cleared
      await waitFor(() => {
        expect(screen.getByLabelText(/relationship type/i)).toHaveValue('')
        expect(screen.getByLabelText(/alias/i)).toHaveValue('')
      })
    })
  })

  describe('Real-time Validation Performance', () => {
    it('should validate fields in under 100ms during typing', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const aliasInput = screen.getByLabelText(/alias/i)

      // Test validation performance during typing
      const validationTime = await measureValidationPerformance(async () => {
        await user.type(aliasInput, 'test')
        // Wait for validation to complete
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      // Validation should complete in under 100ms
      expect(validationTime).toBeLessThan(100)
    })

    it('should debounce validation to avoid excessive API calls', async () => {
      const validationSpy = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
          onValidationChange={validationSpy}
        />
      )

      const aliasInput = screen.getByLabelText(/alias/i)

      // Type rapidly to trigger debouncing
      await user.type(aliasInput, 'rapid_typing_test')

      // Wait for debounced validation
      await waitFor(() => {
        // Validation should be called fewer times than characters typed
        expect(validationSpy).toHaveBeenCalledTimes(1)
      }, { timeout: 1000 })
    })

    it('should provide immediate visual feedback for field validation', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      const aliasInput = screen.getByLabelText(/alias/i)

      // Enter invalid data (empty string after typing)
      await user.type(aliasInput, 'test')
      await user.clear(aliasInput)
      await user.tab() // Trigger blur validation

      // Should show validation error quickly
      await waitFor(() => {
        expect(screen.getByText(/alias is required/i)).toBeInTheDocument()
        
        // Input should have error styling
        expect(aliasInput).toHaveAttribute('aria-invalid', 'true')
        expect(aliasInput.closest('.form-field')).toHaveClass('error')
      }, { timeout: 200 })
    })
  })

  describe('Error Handling and Loading States', () => {
    it('should display loading state while submitting form', async () => {
      // Mock slow API response
      server.use(
        rest.post('/api/v2/system/service/:serviceId/relationship', (req, res, ctx) => {
          return res(ctx.delay(1000), ctx.json({ resource: { id: 1 } }))
        })
      )

      const onSubmit = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      )

      // Fill valid form data
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'user_id')
      await user.selectOptions(screen.getByLabelText(/foreign table/i), 'users')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      })
    })

    it('should handle server validation errors gracefully', async () => {
      // Mock API error response
      server.use(
        rest.post('/api/v2/system/service/:serviceId/relationship', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: {
                code: 422,
                message: 'Validation failed',
                details: {
                  alias: ['Alias already exists'],
                  foreign_table: ['Foreign table not found']
                }
              }
            })
          )
        })
      )

      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Fill and submit form
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.type(screen.getByLabelText(/alias/i), 'duplicate_alias')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'user_id')
      await user.selectOptions(screen.getByLabelText(/foreign table/i), 'invalid_table')

      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      // Should display server validation errors
      await waitFor(() => {
        expect(screen.getByText(/alias already exists/i)).toBeInTheDocument()
        expect(screen.getByText(/foreign table not found/i)).toBeInTheDocument()
      })

      // Form should remain enabled for corrections
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide proper ARIA labels and descriptions', () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Form should have proper ARIA attributes
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label', 'Relationship Configuration')

      // Required fields should be marked
      const aliasInput = screen.getByLabelText(/alias/i)
      expect(aliasInput).toHaveAttribute('aria-required', 'true')

      // Error messages should be associated with inputs
      const typeSelect = screen.getByLabelText(/relationship type/i)
      expect(typeSelect).toHaveAttribute('aria-describedby')
    })

    it('should support keyboard navigation', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Tab through form fields
      await user.tab() // Relationship type
      expect(screen.getByLabelText(/relationship type/i)).toHaveFocus()

      await user.tab() // Alias
      expect(screen.getByLabelText(/alias/i)).toHaveFocus()

      await user.tab() // Local field
      expect(screen.getByLabelText(/local field/i)).toHaveFocus()

      // Continue through all fields
      await user.tab() // Foreign table
      await user.tab() // Foreign field
      await user.tab() // Always fetch
      await user.tab() // Native
      await user.tab() // Submit button
      expect(screen.getByRole('button', { name: /create relationship/i })).toHaveFocus()
    })

    it('should announce form validation errors to screen readers', async () => {
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Submit empty form to trigger validation
      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Error messages should be announced
        const errorSummary = screen.getByRole('alert')
        expect(errorSummary).toBeInTheDocument()
        expect(errorSummary).toHaveTextContent(/form has validation errors/i)
      })
    })
  })

  describe('Integration with MSW and API Testing', () => {
    it('should integrate with MSW for realistic form submission testing', async () => {
      // Setup MSW handler for successful creation
      server.use(
        rest.post('/api/v2/system/service/:serviceId/relationship', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              resource: {
                id: 123,
                type: 'belongs_to',
                alias: 'test_relationship',
                created_at: new Date().toISOString()
              }
            })
          )
        })
      )

      const onSubmit = vi.fn()
      
      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={onSubmit}
          onCancel={vi.fn()}
        />
      )

      // Complete form submission
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'user_id')
      await user.selectOptions(screen.getByLabelText(/foreign table/i), 'users')

      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      // Verify API integration and success handling
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
          type: 'belongs_to',
          alias: 'test_relationship'
        }))
      })
    })

    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        rest.post('/api/v2/system/service/:serviceId/relationship', (req, res) => {
          return res.networkError('Network connection failed')
        })
      )

      renderWithProviders(
        <RelationshipForm
          mode="create"
          tableFields={mockTableFields}
          relatedTables={mockRelatedTables}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Fill and submit form
      await user.selectOptions(screen.getByLabelText(/relationship type/i), 'belongs_to')
      await user.type(screen.getByLabelText(/alias/i), 'test_relationship')
      await user.selectOptions(screen.getByLabelText(/local field/i), 'user_id')

      const submitButton = screen.getByRole('button', { name: /create relationship/i })
      await user.click(submitButton)

      // Should display network error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })
})