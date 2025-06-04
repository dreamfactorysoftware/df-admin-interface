/**
 * @file VerbPicker.test.tsx
 * @description Comprehensive test suite for VerbPicker component using Vitest, Testing Library, and MSW.
 * Tests component rendering, user interactions, value transformations, accessibility, form integration,
 * and theme switching with 90%+ code coverage targeting all selection modes and bitmask operations.
 * 
 * @requirements
 * - Vitest 2.1+ testing framework with 10x faster test execution than Jest
 * - Testing Library for component testing best practices with user-centric queries
 * - Mock Service Worker (MSW) for realistic API mocking during testing
 * - 90%+ code coverage targets for all verb picker functionality
 * 
 * @version React 19.0.0, Next.js 15.1, TypeScript 5.8+
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { VerbPicker } from './VerbPicker'
import { HttpVerb, VerbPickerMode, VerbPickerProps } from './types'
import { convertBitmaskToVerbs, convertVerbsToBitmask } from './utils'
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockVerbOptions, createMockConfigSchema } from '@/test/utils/component-factories'
import { setupServer } from 'msw/node'
import { rest } from 'msw'

// Test data constants for DreamFactory HTTP verbs and bitmask values
const HTTP_VERBS: HttpVerb[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const VERB_BITMASKS = {
  GET: 1,    // 2^0
  POST: 2,   // 2^1  
  PUT: 4,    // 2^2
  PATCH: 8,  // 2^3
  DELETE: 16 // 2^4
} as const

const ALL_VERBS_BITMASK = 31 // 1 + 2 + 4 + 8 + 16 = 31

// Mock server setup for API testing
const server = setupServer(
  rest.get('/api/v2/system/config', (req, res, ctx) => {
    return res(ctx.json({
      resource: {
        tooltip_enabled: true,
        schema_descriptions: {
          verb_mask: 'HTTP verbs allowed for this endpoint (bitmask)',
          verbs: 'HTTP verbs as array of strings'
        }
      }
    }))
  })
)

// Test wrapper component for React Hook Form integration
const TestFormWrapper = ({ 
  children, 
  onSubmit = vi.fn(),
  defaultValues = {},
  schema = z.object({})
}: {
  children: React.ReactNode
  onSubmit?: (data: any) => void
  defaultValues?: any
  schema?: z.ZodSchema
}) => {
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues
  })

  return (
    <form onSubmit={methods.handleSubmit(onSubmit)}>
      {children}
      <button type="submit" data-testid="submit-button">Submit</button>
    </form>
  )
}

describe('VerbPicker Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    server.listen()
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Component Rendering', () => {
    it('should render with default props in verb mode', () => {
      renderWithProviders(
        <VerbPicker mode="verb" />
      )

      expect(screen.getByRole('combobox', { name: /http verb/i })).toBeInTheDocument()
      expect(screen.getByText(/select verb/i)).toBeInTheDocument()
    })

    it('should render with all three selection modes', () => {
      const modes: VerbPickerMode[] = ['verb', 'verb_multiple', 'number']
      
      modes.forEach(mode => {
        const { unmount } = renderWithProviders(
          <VerbPicker mode={mode} data-testid={`picker-${mode}`} />
        )
        
        const picker = screen.getByTestId(`picker-${mode}`)
        expect(picker).toBeInTheDocument()
        
        if (mode === 'verb_multiple') {
          expect(screen.getByText(/select verbs/i)).toBeInTheDocument()
        } else if (mode === 'number') {
          expect(screen.getByText(/select verb combination/i)).toBeInTheDocument()
        }
        
        unmount()
      })
    })

    it('should render with custom label and placeholder', () => {
      const customLabel = 'API Endpoint Verbs'
      const customPlaceholder = 'Choose HTTP methods'

      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          label={customLabel}
          placeholder={customPlaceholder}
        />
      )

      expect(screen.getByText(customLabel)).toBeInTheDocument()
      expect(screen.getByText(customPlaceholder)).toBeInTheDocument()
    })

    it('should render with schema description tooltip', async () => {
      const mockSchema = createMockConfigSchema({
        description: 'HTTP verbs allowed for this endpoint'
      })

      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          schema={mockSchema}
          showTooltip={true}
        />
      )

      const tooltipTrigger = screen.getByRole('button', { name: /help/i })
      expect(tooltipTrigger).toBeInTheDocument()

      await user.hover(tooltipTrigger)
      await waitFor(() => {
        expect(screen.getByText(/HTTP verbs allowed/i)).toBeInTheDocument()
      })
    })

    it('should render disabled state correctly', () => {
      renderWithProviders(
        <VerbPicker mode="verb" disabled={true} />
      )

      const combobox = screen.getByRole('combobox')
      expect(combobox).toBeDisabled()
      expect(combobox).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('User Interactions', () => {
    it('should handle single verb selection in verb mode', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="verb" onChange={mockOnChange} />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const getOption = screen.getByRole('option', { name: 'GET' })
      await user.click(getOption)

      expect(mockOnChange).toHaveBeenCalledWith('GET')
    })

    it('should handle multiple verb selection in verb_multiple mode', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="verb_multiple" onChange={mockOnChange} />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Select GET
      const getOption = screen.getByRole('option', { name: 'GET' })
      await user.click(getOption)

      // Select POST (keeping listbox open)
      const postOption = screen.getByRole('option', { name: 'POST' })
      await user.click(postOption)

      expect(mockOnChange).toHaveBeenCalledWith(['GET', 'POST'])
    })

    it('should handle bitmask selection in number mode', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="number" onChange={mockOnChange} />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Select GET + POST (should result in bitmask 3)
      const getOption = screen.getByRole('option', { name: 'GET' })
      await user.click(getOption)

      const postOption = screen.getByRole('option', { name: 'POST' })
      await user.click(postOption)

      expect(mockOnChange).toHaveBeenCalledWith(3) // 1 + 2 = 3
    })

    it('should support keyboard navigation', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="verb" onChange={mockOnChange} />
      )

      const combobox = screen.getByRole('combobox')
      
      // Open with Enter
      combobox.focus()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')

      // Select with Enter
      await user.keyboard('{Enter}')

      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should close listbox on Escape key', async () => {
      renderWithProviders(
        <VerbPicker mode="verb" />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      })
    })

    it('should prevent selection when disabled', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="verb" disabled={true} onChange={mockOnChange} />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      // Listbox should not open
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Value Transformations', () => {
    it('should convert bitmask to verbs correctly', () => {
      // Test individual verbs
      expect(convertBitmaskToVerbs(1)).toEqual(['GET'])
      expect(convertBitmaskToVerbs(2)).toEqual(['POST'])
      expect(convertBitmaskToVerbs(4)).toEqual(['PUT'])
      expect(convertBitmaskToVerbs(8)).toEqual(['PATCH'])
      expect(convertBitmaskToVerbs(16)).toEqual(['DELETE'])

      // Test combinations
      expect(convertBitmaskToVerbs(3)).toEqual(['GET', 'POST']) // 1 + 2
      expect(convertBitmaskToVerbs(7)).toEqual(['GET', 'POST', 'PUT']) // 1 + 2 + 4
      expect(convertBitmaskToVerbs(31)).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) // All verbs
    })

    it('should convert verbs to bitmask correctly', () => {
      // Test individual verbs
      expect(convertVerbsToBitmask(['GET'])).toBe(1)
      expect(convertVerbsToBitmask(['POST'])).toBe(2)
      expect(convertVerbsToBitmask(['PUT'])).toBe(4)
      expect(convertVerbsToBitmask(['PATCH'])).toBe(8)
      expect(convertVerbsToBitmask(['DELETE'])).toBe(16)

      // Test combinations
      expect(convertVerbsToBitmask(['GET', 'POST'])).toBe(3)
      expect(convertVerbsToBitmask(['GET', 'POST', 'PUT'])).toBe(7)
      expect(convertVerbsToBitmask(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])).toBe(31)
    })

    it('should handle edge cases in value transformation', () => {
      // Empty arrays
      expect(convertVerbsToBitmask([])).toBe(0)
      expect(convertBitmaskToVerbs(0)).toEqual([])

      // Invalid bitmasks
      expect(convertBitmaskToVerbs(-1)).toEqual([])
      expect(convertBitmaskToVerbs(32)).toEqual([]) // Beyond valid range

      // Invalid verbs (should be filtered out)
      expect(convertVerbsToBitmask(['GET', 'INVALID' as HttpVerb])).toBe(1)
    })

    it('should transform values correctly for different modes', async () => {
      const TestComponent = () => {
        const [verbValue, setVerbValue] = React.useState<string>('')
        const [verbsValue, setVerbsValue] = React.useState<string[]>([])
        const [numberValue, setNumberValue] = React.useState<number>(0)

        return (
          <div>
            <VerbPicker 
              mode="verb" 
              value={verbValue}
              onChange={setVerbValue}
              data-testid="verb-picker"
            />
            <VerbPicker 
              mode="verb_multiple" 
              value={verbsValue}
              onChange={setVerbsValue}
              data-testid="verbs-picker"
            />
            <VerbPicker 
              mode="number" 
              value={numberValue}
              onChange={setNumberValue}
              data-testid="number-picker"
            />
            <div data-testid="values">
              {verbValue} | {verbsValue.join(',')} | {numberValue}
            </div>
          </div>
        )
      }

      renderWithProviders(<TestComponent />)

      // Test verb mode
      const verbPicker = screen.getByTestId('verb-picker')
      await user.click(verbPicker)
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const getOption = screen.getByRole('option', { name: 'GET' })
      await user.click(getOption)

      await waitFor(() => {
        expect(screen.getByTestId('values')).toHaveTextContent('GET | | 0')
      })
    })
  })

  describe('React Hook Form Integration', () => {
    it('should integrate with React Hook Form in verb mode', async () => {
      const mockSubmit = vi.fn()
      const schema = z.object({
        httpVerb: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
      })

      const TestForm = () => {
        const { register, control, handleSubmit } = useForm({
          resolver: zodResolver(schema),
          defaultValues: { httpVerb: 'GET' }
        })

        return (
          <form onSubmit={handleSubmit(mockSubmit)}>
            <VerbPicker 
              mode="verb"
              {...register('httpVerb')}
              control={control}
            />
            <button type="submit">Submit</button>
          </form>
        )
      }

      renderWithProviders(<TestForm />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          httpVerb: 'GET'
        })
      })
    })

    it('should handle validation errors with React Hook Form', async () => {
      const schema = z.object({
        requiredVerb: z.string().min(1, 'Verb selection is required')
      })

      const TestForm = () => {
        const { register, handleSubmit, formState: { errors } } = useForm({
          resolver: zodResolver(schema)
        })

        return (
          <form onSubmit={handleSubmit(() => {})}>
            <VerbPicker 
              mode="verb"
              {...register('requiredVerb')}
              error={errors.requiredVerb?.message}
            />
            <button type="submit">Submit</button>
          </form>
        )
      }

      renderWithProviders(<TestForm />)

      const submitButton = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Verb selection is required')).toBeInTheDocument()
      })
    })

    it('should support controlled and uncontrolled modes', async () => {
      const ControlledTest = () => {
        const [value, setValue] = React.useState<string>('GET')
        
        return (
          <div>
            <VerbPicker 
              mode="verb"
              value={value}
              onChange={setValue}
            />
            <div data-testid="controlled-value">{value}</div>
          </div>
        )
      }

      const { unmount } = renderWithProviders(<ControlledTest />)
      
      expect(screen.getByTestId('controlled-value')).toHaveTextContent('GET')
      
      unmount()

      // Uncontrolled test
      renderWithProviders(
        <VerbPicker 
          mode="verb"
          defaultValue="POST"
        />
      )

      // Should display default value
      expect(screen.getByDisplayValue('POST')).toBeInTheDocument()
    })
  })

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          label="HTTP Verb Selection"
          required={true}
        />
      )

      const combobox = screen.getByRole('combobox')
      
      expect(combobox).toHaveAttribute('aria-label', 'HTTP Verb Selection')
      expect(combobox).toHaveAttribute('aria-required', 'true')
      expect(combobox).toHaveAttribute('aria-expanded', 'false')
      expect(combobox).toHaveAttribute('aria-haspopup', 'listbox')
    })

    it('should support screen reader announcements', async () => {
      renderWithProviders(
        <VerbPicker mode="verb" />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toHaveAttribute('aria-label', 'HTTP verb options')
        
        const options = screen.getAllByRole('option')
        options.forEach((option, index) => {
          expect(option).toHaveAttribute('aria-selected')
          expect(option).toHaveAttribute('tabindex')
        })
      })
    })

    it('should maintain focus management', async () => {
      renderWithProviders(
        <VerbPicker mode="verb" />
      )

      const combobox = screen.getByRole('combobox')
      
      // Focus should be on combobox initially
      combobox.focus()
      expect(document.activeElement).toBe(combobox)

      // Open listbox
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Focus should move to first option
      const firstOption = screen.getAllByRole('option')[0]
      expect(document.activeElement).toBe(firstOption)
    })

    it('should announce selection changes to screen readers', async () => {
      renderWithProviders(
        <VerbPicker mode="verb" />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      const getOption = screen.getByRole('option', { name: 'GET' })
      await user.click(getOption)

      // Should have live region announcing the selection
      expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('GET selected')
    })

    it('should support high contrast mode', () => {
      renderWithProviders(
        <VerbPicker mode="verb" />,
        { theme: 'high-contrast' }
      )

      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveClass('ring-2', 'ring-high-contrast')
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme styles correctly', () => {
      renderWithProviders(
        <VerbPicker mode="verb" />,
        { theme: 'light' }
      )

      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveClass('bg-white', 'text-gray-900', 'border-gray-300')
    })

    it('should apply dark theme styles correctly', () => {
      renderWithProviders(
        <VerbPicker mode="verb" />,
        { theme: 'dark' }
      )

      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveClass('bg-gray-800', 'text-white', 'border-gray-600')
    })

    it('should switch themes dynamically', async () => {
      const { rerender } = renderWithProviders(
        <VerbPicker mode="verb" />,
        { theme: 'light' }
      )

      const combobox = screen.getByRole('combobox')
      expect(combobox).toHaveClass('bg-white')

      rerender(
        <VerbPicker mode="verb" />,
        { theme: 'dark' }
      )

      expect(combobox).toHaveClass('bg-gray-800')
    })
  })

  describe('Tooltip Functionality', () => {
    it('should display tooltip on hover when enabled', async () => {
      const mockSchema = createMockConfigSchema({
        description: 'Select HTTP verbs for API endpoint access'
      })

      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          schema={mockSchema}
          showTooltip={true}
        />
      )

      const tooltipTrigger = screen.getByRole('button', { name: /help/i })
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText('Select HTTP verbs for API endpoint access')).toBeInTheDocument()
      })
    })

    it('should hide tooltip when disabled', () => {
      const mockSchema = createMockConfigSchema({
        description: 'This should not be visible'
      })

      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          schema={mockSchema}
          showTooltip={false}
        />
      )

      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument()
    })

    it('should position tooltip correctly', async () => {
      const mockSchema = createMockConfigSchema({
        description: 'Tooltip content'
      })

      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          schema={mockSchema}
          showTooltip={true}
        />
      )

      const tooltipTrigger = screen.getByRole('button', { name: /help/i })
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip')
        expect(tooltip).toHaveAttribute('data-placement', 'top')
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid verb selections gracefully', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker 
          mode="verb" 
          onChange={mockOnChange}
          value="INVALID_VERB" as HttpVerb
        />
      )

      // Should reset to empty selection
      expect(screen.getByRole('combobox')).toHaveValue('')
    })

    it('should handle empty value arrays in multiple mode', () => {
      renderWithProviders(
        <VerbPicker 
          mode="verb_multiple" 
          value={[]}
        />
      )

      expect(screen.getByText(/select verbs/i)).toBeInTheDocument()
    })

    it('should handle invalid bitmask values', () => {
      renderWithProviders(
        <VerbPicker 
          mode="number" 
          value={-1}
        />
      )

      // Should display as no selection
      expect(screen.getByText(/select verb combination/i)).toBeInTheDocument()
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      server.use(
        rest.get('/api/v2/system/config', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }))
        })
      )

      renderWithProviders(
        <VerbPicker mode="verb" showTooltip={true} />
      )

      // Should still render without tooltip
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /help/i })).not.toBeInTheDocument()
    })

    it('should validate maximum selections in multiple mode', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker 
          mode="verb_multiple" 
          onChange={mockOnChange}
          maxSelections={2}
        />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Select first verb
      await user.click(screen.getByRole('option', { name: 'GET' }))

      // Select second verb
      await user.click(screen.getByRole('option', { name: 'POST' }))

      // Try to select third verb - should be disabled
      const putOption = screen.getByRole('option', { name: 'PUT' })
      expect(putOption).toHaveAttribute('aria-disabled', 'true')
    })

    it('should handle rapid successive selections', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="verb" onChange={mockOnChange} />
      )

      const combobox = screen.getByRole('combobox')
      
      // Rapid clicks
      await user.click(combobox)
      await user.click(combobox)
      await user.click(combobox)

      // Should only open once
      await waitFor(() => {
        expect(screen.getAllByRole('listbox')).toHaveLength(1)
      })
    })

    it('should preserve selection on component re-render', () => {
      const TestComponent = ({ value }: { value: string }) => (
        <VerbPicker mode="verb" value={value} />
      )

      const { rerender } = renderWithProviders(<TestComponent value="GET" />)
      
      expect(screen.getByDisplayValue('GET')).toBeInTheDocument()

      rerender(<TestComponent value="POST" />)
      
      expect(screen.getByDisplayValue('POST')).toBeInTheDocument()
    })
  })

  describe('Performance Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()
      
      const TestComponent = React.memo(({ value }: { value: string }) => {
        renderSpy()
        return <VerbPicker mode="verb" value={value} />
      })

      const { rerender } = renderWithProviders(<TestComponent value="GET" />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Rerender with same value
      rerender(<TestComponent value="GET" />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1) // Should not re-render
    })

    it('should debounce onChange events', async () => {
      const mockOnChange = vi.fn()

      renderWithProviders(
        <VerbPicker mode="verb" onChange={mockOnChange} debounceMs={100} />
      )

      const combobox = screen.getByRole('combobox')
      await user.click(combobox)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      // Rapid selections
      await user.click(screen.getByRole('option', { name: 'GET' }))
      await user.click(screen.getByRole('option', { name: 'POST' }))

      // Should only call onChange once after debounce
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1)
      }, { timeout: 200 })
    })
  })

  describe('Integration Tests', () => {
    it('should work correctly in database service configuration form', async () => {
      const mockSubmit = vi.fn()
      const schema = z.object({
        serviceName: z.string().min(1),
        allowedVerbs: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])).min(1),
        verbMask: z.number().min(1)
      })

      const DatabaseConfigForm = () => {
        const { register, handleSubmit, control } = useForm({
          resolver: zodResolver(schema),
          defaultValues: {
            serviceName: 'test-db',
            allowedVerbs: ['GET'],
            verbMask: 1
          }
        })

        return (
          <form onSubmit={handleSubmit(mockSubmit)}>
            <input {...register('serviceName')} placeholder="Service Name" />
            
            <VerbPicker 
              mode="verb_multiple"
              {...register('allowedVerbs')}
              label="Allowed HTTP Verbs"
            />
            
            <VerbPicker 
              mode="number"
              {...register('verbMask')}
              label="Verb Bitmask"
            />
            
            <button type="submit">Create Service</button>
          </form>
        )
      }

      renderWithProviders(<DatabaseConfigForm />)

      // Test form submission with verb picker values
      const submitButton = screen.getByRole('button', { name: 'Create Service' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          serviceName: 'test-db',
          allowedVerbs: ['GET'],
          verbMask: 1
        })
      })
    })

    it('should sync between multiple verb pickers', async () => {
      const SyncedVerbPickers = () => {
        const [verbs, setVerbs] = React.useState<HttpVerb[]>(['GET'])
        const [bitmask, setBitmask] = React.useState<number>(1)

        React.useEffect(() => {
          setBitmask(convertVerbsToBitmask(verbs))
        }, [verbs])

        React.useEffect(() => {
          setVerbs(convertBitmaskToVerbs(bitmask))
        }, [bitmask])

        return (
          <div>
            <VerbPicker 
              mode="verb_multiple"
              value={verbs}
              onChange={setVerbs}
              data-testid="verbs-picker"
            />
            
            <VerbPicker 
              mode="number"
              value={bitmask}
              onChange={setBitmask}
              data-testid="bitmask-picker"
            />
            
            <div data-testid="sync-values">
              Verbs: {verbs.join(',')} | Bitmask: {bitmask}
            </div>
          </div>
        )
      }

      renderWithProviders(<SyncedVerbPickers />)

      expect(screen.getByTestId('sync-values')).toHaveTextContent('Verbs: GET | Bitmask: 1')

      // Change verbs picker
      const verbsPicker = screen.getByTestId('verbs-picker')
      await user.click(verbsPicker)

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('option', { name: 'POST' }))

      await waitFor(() => {
        expect(screen.getByTestId('sync-values')).toHaveTextContent('Verbs: GET,POST | Bitmask: 3')
      })
    })
  })
})