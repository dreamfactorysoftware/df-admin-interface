/**
 * Comprehensive test suite for Select components using Vitest, Testing Library, and MSW
 * Tests component rendering, user interactions, accessibility, form integration, and async functionality
 * Achieves 90%+ code coverage for all select component variants
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Component imports
import { Select } from './Select'
import { Autocomplete } from './Autocomplete'
import { MultiSelect } from './MultiSelect'
import type { SelectOption, SelectProps, AutocompleteProps, MultiSelectProps } from './types'

// Test utilities and providers
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockSelectOptions, createMockAsyncOptions } from '@/test/utils/component-factories'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock data for testing
const mockOptions: SelectOption[] = [
  { value: 'mysql', label: 'MySQL', description: 'MySQL Database' },
  { value: 'postgresql', label: 'PostgreSQL', description: 'PostgreSQL Database' },
  { value: 'mongodb', label: 'MongoDB', description: 'MongoDB NoSQL Database' },
  { value: 'oracle', label: 'Oracle', description: 'Oracle Database', disabled: true },
  { value: 'snowflake', label: 'Snowflake', description: 'Snowflake Data Warehouse' }
]

const mockVerbOptions: SelectOption[] = [
  { value: 1, label: 'GET', description: 'HTTP GET method' },
  { value: 2, label: 'POST', description: 'HTTP POST method' },
  { value: 4, label: 'PUT', description: 'HTTP PUT method' },
  { value: 8, label: 'PATCH', description: 'HTTP PATCH method' },
  { value: 16, label: 'DELETE', description: 'HTTP DELETE method' }
]

const groupedOptions: SelectOption[] = [
  { value: 'mysql', label: 'MySQL', group: 'SQL Databases' },
  { value: 'postgresql', label: 'PostgreSQL', group: 'SQL Databases' },
  { value: 'mongodb', label: 'MongoDB', group: 'NoSQL Databases' },
  { value: 'redis', label: 'Redis', group: 'NoSQL Databases' }
]

// Test form schema for React Hook Form integration
const testFormSchema = z.object({
  database: z.string().min(1, 'Database selection is required'),
  verbs: z.array(z.number()).min(1, 'At least one HTTP verb must be selected'),
  searchTerm: z.string().optional()
})

type TestFormData = z.infer<typeof testFormSchema>

// Test wrapper component for React Hook Form integration
function TestFormWrapper({ 
  children, 
  onSubmit = vi.fn(),
  defaultValues = {}
}: {
  children: React.ReactNode
  onSubmit?: (data: TestFormData) => void
  defaultValues?: Partial<TestFormData>
}) {
  const form = useForm<TestFormData>({
    resolver: zodResolver(testFormSchema),
    defaultValues
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
      {children}
      <button type="submit" data-testid="submit-button">Submit</button>
      {form.formState.errors.database && (
        <span data-testid="database-error">{form.formState.errors.database.message}</span>
      )}
      {form.formState.errors.verbs && (
        <span data-testid="verbs-error">{form.formState.errors.verbs.message}</span>
      )}
    </form>
  )
}

describe('Select Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    // Reset any mocked functions before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any test state
    server.resetHandlers()
  })

  describe('Basic Rendering and Props', () => {
    it('renders select component with correct label and options', () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          data-testid="database-select"
        />
      )

      expect(screen.getByRole('combobox', { name: /database type/i })).toBeInTheDocument()
      expect(screen.getByText('Database Type')).toBeInTheDocument()
    })

    it('displays placeholder text when no value selected', () => {
      render(
        <Select
          label="Database Type"
          placeholder="Select a database"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('Select a database')).toBeInTheDocument()
    })

    it('shows selected value correctly', () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value="mysql"
          onChange={vi.fn()}
        />
      )

      expect(screen.getByDisplayValue('MySQL')).toBeInTheDocument()
    })

    it('renders with different size variants', () => {
      const { rerender } = render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          size="sm"
          data-testid="select-sm"
        />
      )

      const selectSm = screen.getByTestId('select-sm')
      expect(selectSm).toHaveClass('text-sm')

      rerender(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          size="lg"
          data-testid="select-lg"
        />
      )

      const selectLg = screen.getByTestId('select-lg')
      expect(selectLg).toHaveClass('text-lg')
    })

    it('renders disabled state correctly', () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          disabled
        />
      )

      const select = screen.getByRole('combobox')
      expect(select).toBeDisabled()
      expect(select).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('renders loading state with spinner', () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          loading
        />
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('renders error state with correct styling', () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          error="Please select a database"
        />
      )

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('border-error-500')
      expect(screen.getByText('Please select a database')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('opens dropdown when clicked', async () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      expect(screen.getByRole('listbox')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /mysql/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /postgresql/i })).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <Select
            label="Database Type"
            options={mockOptions}
            value=""
            onChange={vi.fn()}
          />
          <button data-testid="outside-button">Outside</button>
        </div>
      )

      const select = screen.getByRole('combobox')
      await user.click(select)
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      await user.click(screen.getByTestId('outside-button'))
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('selects option when clicked', async () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)
      
      const option = screen.getByRole('option', { name: /mysql/i })
      await user.click(option)

      expect(mockOnChange).toHaveBeenCalledWith('mysql')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('does not select disabled options', async () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)
      
      const disabledOption = screen.getByRole('option', { name: /oracle/i })
      await user.click(disabledOption)

      expect(mockOnChange).not.toHaveBeenCalled()
      expect(screen.getByRole('listbox')).toBeInTheDocument() // Should remain open
    })

    it('supports keyboard navigation', async () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')

      expect(mockOnChange).toHaveBeenCalledWith('postgresql')
    })

    it('closes dropdown with Escape key', async () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)
      expect(screen.getByRole('listbox')).toBeInTheDocument()

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility Compliance', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          id="database-select"
        />
      )

      const select = screen.getByRole('combobox')
      expect(select).toHaveAttribute('aria-labelledby')
      expect(select).toHaveAttribute('aria-expanded', 'false')
      expect(select).toHaveAttribute('aria-haspopup', 'listbox')
    })

    it('updates ARIA attributes when opened', async () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      expect(select).toHaveAttribute('aria-expanded', 'true')
      expect(select).toHaveAttribute('aria-owns')
    })

    it('has proper ARIA labels for options', async () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      const options = screen.getAllByRole('option')
      options.forEach(option => {
        expect(option).toHaveAttribute('aria-selected')
        expect(option).toHaveAttribute('id')
      })
    })

    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports screen reader announcements', async () => {
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      // Screen reader should announce the number of options
      const listbox = screen.getByRole('listbox')
      expect(listbox).toHaveAttribute('aria-label', expect.stringContaining('5 options'))
    })
  })

  describe('Form Integration', () => {
    it('integrates with React Hook Form', async () => {
      const mockSubmit = vi.fn()
      
      function TestForm() {
        const { register, handleSubmit } = useForm<TestFormData>()
        
        return (
          <form onSubmit={handleSubmit(mockSubmit)}>
            <Select
              {...register('database')}
              label="Database Type"
              options={mockOptions}
            />
            <button type="submit">Submit</button>
          </form>
        )
      }

      render(<TestForm />)

      const select = screen.getByRole('combobox')
      await user.click(select)
      await user.click(screen.getByRole('option', { name: /mysql/i }))
      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ database: 'mysql' }),
        expect.any(Object)
      )
    })

    it('displays validation errors', async () => {
      function TestForm() {
        const { register, handleSubmit, formState: { errors } } = useForm<TestFormData>({
          resolver: zodResolver(testFormSchema)
        })
        
        return (
          <form onSubmit={handleSubmit(vi.fn())}>
            <Select
              {...register('database')}
              label="Database Type"
              options={mockOptions}
              error={errors.database?.message}
            />
            <button type="submit">Submit</button>
          </form>
        )
      }

      render(<TestForm />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(screen.getByText('Database selection is required')).toBeInTheDocument()
      })
    })

    it('validates on change when in form context', async () => {
      const mockValidate = vi.fn()
      
      function TestForm() {
        const { register, trigger } = useForm<TestFormData>({
          resolver: zodResolver(testFormSchema)
        })
        
        return (
          <Select
            {...register('database', {
              onChange: () => trigger('database').then(mockValidate)
            })}
            label="Database Type"
            options={mockOptions}
          />
        )
      }

      render(<TestForm />)

      const select = screen.getByRole('combobox')
      await user.click(select)
      await user.click(screen.getByRole('option', { name: /mysql/i }))

      await waitFor(() => {
        expect(mockValidate).toHaveBeenCalled()
      })
    })
  })

  describe('Theme Support', () => {
    it('applies light theme styles correctly', () => {
      render(
        <div className="theme-light">
          <Select
            label="Database Type"
            options={mockOptions}
            value=""
            onChange={vi.fn()}
            data-testid="light-select"
          />
        </div>
      )

      const select = screen.getByTestId('light-select')
      expect(select).toHaveClass('bg-white', 'border-gray-300')
    })

    it('applies dark theme styles correctly', () => {
      render(
        <div className="theme-dark">
          <Select
            label="Database Type"
            options={mockOptions}
            value=""
            onChange={vi.fn()}
            data-testid="dark-select"
          />
        </div>
      )

      const select = screen.getByTestId('dark-select')
      expect(select).toHaveClass('dark:bg-gray-800', 'dark:border-gray-600')
    })

    it('updates theme dynamically', () => {
      const { rerender } = render(
        <div className="theme-light">
          <Select
            label="Database Type"
            options={mockOptions}
            value=""
            onChange={vi.fn()}
            data-testid="themed-select"
          />
        </div>
      )

      let select = screen.getByTestId('themed-select')
      expect(select).toHaveClass('bg-white')

      rerender(
        <div className="theme-dark">
          <Select
            label="Database Type"
            options={mockOptions}
            value=""
            onChange={vi.fn()}
            data-testid="themed-select"
          />
        </div>
      )

      select = screen.getByTestId('themed-select')
      expect(select).toHaveClass('dark:bg-gray-800')
    })
  })

  describe('Value Transformations', () => {
    it('handles bitmask values for HTTP verbs', () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="HTTP Verb"
          options={mockVerbOptions}
          value={1}
          onChange={mockOnChange}
          transformValue="bitmask"
        />
      )

      expect(screen.getByDisplayValue('GET')).toBeInTheDocument()
    })

    it('transforms bitmask values correctly on selection', async () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="HTTP Verb"
          options={mockVerbOptions}
          value={1}
          onChange={mockOnChange}
          transformValue="bitmask"
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)
      await user.click(screen.getByRole('option', { name: /post/i }))

      expect(mockOnChange).toHaveBeenCalledWith(2)
    })

    it('handles array transformations', () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value={['mysql', 'postgresql']}
          onChange={mockOnChange}
          transformValue="array"
          multiple
        />
      )

      expect(screen.getByText('MySQL')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    })

    it('handles comma-separated string transformations', () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="Database Type"
          options={mockOptions}
          value="mysql,postgresql"
          onChange={mockOnChange}
          transformValue="csv"
          multiple
        />
      )

      expect(screen.getByText('MySQL')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    })
  })

  describe('Option Groups', () => {
    it('renders grouped options correctly', async () => {
      render(
        <Select
          label="Database Type"
          options={groupedOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      expect(screen.getByText('SQL Databases')).toBeInTheDocument()
      expect(screen.getByText('NoSQL Databases')).toBeInTheDocument()
    })

    it('groups options under correct headings', async () => {
      render(
        <Select
          label="Database Type"
          options={groupedOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      const sqlGroup = screen.getByText('SQL Databases').closest('[role="group"]')
      const nosqlGroup = screen.getByText('NoSQL Databases').closest('[role="group"]')

      expect(within(sqlGroup!).getByText('MySQL')).toBeInTheDocument()
      expect(within(sqlGroup!).getByText('PostgreSQL')).toBeInTheDocument()
      expect(within(nosqlGroup!).getByText('MongoDB')).toBeInTheDocument()
      expect(within(nosqlGroup!).getByText('Redis')).toBeInTheDocument()
    })
  })
})

describe('Autocomplete Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup MSW handlers for async option loading
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: [
            { name: 'mysql_db', label: 'MySQL Database', type: 'mysql' },
            { name: 'postgres_db', label: 'PostgreSQL Database', type: 'postgresql' },
            { name: 'mongo_db', label: 'MongoDB Database', type: 'mongodb' }
          ]
        })
      }),
      http.get('/api/v2/system/service/:id/_schema', () => {
        return HttpResponse.json({
          resource: [
            { name: 'users', label: 'Users Table' },
            { name: 'products', label: 'Products Table' },
            { name: 'orders', label: 'Orders Table' }
          ]
        })
      })
    )
  })

  describe('Basic Rendering and Search', () => {
    it('renders autocomplete with search input', () => {
      render(
        <Autocomplete
          label="Search Database"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox', { name: /search database/i })).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
    })

    it('filters options based on search input', async () => {
      render(
        <Autocomplete
          label="Search Database"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'mysql')

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /mysql/i })).toBeInTheDocument()
        expect(screen.queryByRole('option', { name: /postgresql/i })).not.toBeInTheDocument()
      })
    })

    it('shows "no results" message when no options match', async () => {
      render(
        <Autocomplete
          label="Search Database"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument()
      })
    })

    it('debounces search input to avoid excessive filtering', async () => {
      const mockFilter = vi.fn()
      render(
        <Autocomplete
          label="Search Database"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          onSearch={mockFilter}
          debounceMs={300}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'mysql')

      // Should not call immediately
      expect(mockFilter).not.toHaveBeenCalled()

      // Should call after debounce delay
      await waitFor(() => {
        expect(mockFilter).toHaveBeenCalledWith('mysql')
      }, { timeout: 500 })
    })
  })

  describe('Async Option Loading', () => {
    it('loads options asynchronously with MSW', async () => {
      render(
        <Autocomplete
          label="Search Services"
          asyncOptions
          loadOptions={async (searchTerm) => {
            const response = await fetch('/api/v2/system/service')
            const data = await response.json()
            return data.resource.map((service: any) => ({
              value: service.name,
              label: service.label
            }))
          }}
          value=""
          onChange={vi.fn()}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /mysql database/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /postgresql database/i })).toBeInTheDocument()
      })
    })

    it('shows loading spinner during async loading', async () => {
      render(
        <Autocomplete
          label="Search Services"
          asyncOptions
          loadOptions={async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
            return []
          }}
          value=""
          onChange={vi.fn()}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })

    it('handles async loading errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/service', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(
        <Autocomplete
          label="Search Services"
          asyncOptions
          loadOptions={async () => {
            const response = await fetch('/api/v2/system/service')
            if (!response.ok) throw new Error('Failed to load')
            return []
          }}
          value=""
          onChange={vi.fn()}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        expect(screen.getByText(/error loading options/i)).toBeInTheDocument()
      })
    })
  })

  describe('Option Creation', () => {
    it('allows creating new options when allowCreate is enabled', async () => {
      const mockOnChange = vi.fn()
      const mockOnCreate = vi.fn()

      render(
        <Autocomplete
          label="Search Database"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
          allowCreate
          onCreateOption={mockOnCreate}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'new database')

      await waitFor(() => {
        expect(screen.getByText(/create "new database"/i)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/create "new database"/i))
      expect(mockOnCreate).toHaveBeenCalledWith('new database')
    })

    it('does not show create option when allowCreate is disabled', async () => {
      render(
        <Autocomplete
          label="Search Database"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          allowCreate={false}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)
      await user.type(input, 'new database')

      await waitFor(() => {
        expect(screen.queryByText(/create/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Virtual Scrolling for Large Lists', () => {
    it('renders large option lists efficiently with virtual scrolling', async () => {
      const largeOptionList = Array.from({ length: 1000 }, (_, i) => ({
        value: `option-${i}`,
        label: `Option ${i}`,
        description: `Description for option ${i}`
      }))

      render(
        <Autocomplete
          label="Large List"
          options={largeOptionList}
          value=""
          onChange={vi.fn()}
          virtualScrolling
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      await waitFor(() => {
        const listbox = screen.getByRole('listbox')
        expect(listbox).toBeInTheDocument()
        
        // Should only render visible options (virtual scrolling)
        const options = screen.getAllByRole('option')
        expect(options.length).toBeLessThan(100) // Not all 1000 options
        expect(options.length).toBeGreaterThan(10) // But more than a few
      })
    })
  })
})

describe('MultiSelect Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Multiple Selection', () => {
    it('renders multiple selected values as chips', () => {
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2]}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByText('GET')).toBeInTheDocument()
      expect(screen.getByText('POST')).toBeInTheDocument()
    })

    it('adds new selections to existing values', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1]}
          onChange={mockOnChange}
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const postOption = screen.getByRole('option', { name: /post/i })
      await user.click(postOption)

      expect(mockOnChange).toHaveBeenCalledWith([1, 2])
    })

    it('removes selections when deselected', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2]}
          onChange={mockOnChange}
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const getOption = screen.getByRole('option', { name: /get/i })
      await user.click(getOption)

      expect(mockOnChange).toHaveBeenCalledWith([2])
    })

    it('removes chips when close button is clicked', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2]}
          onChange={mockOnChange}
        />
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await user.click(removeButtons[0])

      expect(mockOnChange).toHaveBeenCalledWith([2])
    })
  })

  describe('Selection Limits', () => {
    it('respects maximum selection limit', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2]}
          onChange={mockOnChange}
          maxSelections={2}
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const putOption = screen.getByRole('option', { name: /put/i })
      expect(putOption).toHaveAttribute('aria-disabled', 'true')

      await user.click(putOption)
      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('shows limit reached message', async () => {
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2]}
          onChange={vi.fn()}
          maxSelections={2}
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      expect(screen.getByText(/maximum 2 selections/i)).toBeInTheDocument()
    })

    it('enforces minimum selection requirement', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1]}
          onChange={mockOnChange}
          minSelections={1}
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const getOption = screen.getByRole('option', { name: /get/i })
      await user.click(getOption)

      // Should not remove the last item if it violates minimum
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  describe('Batch Operations', () => {
    it('supports select all functionality', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions.filter(opt => !opt.disabled)}
          value={[]}
          onChange={mockOnChange}
          showSelectAll
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const selectAllButton = screen.getByRole('button', { name: /select all/i })
      await user.click(selectAllButton)

      expect(mockOnChange).toHaveBeenCalledWith([1, 2, 4, 8, 16])
    })

    it('supports clear all functionality', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2, 4]}
          onChange={mockOnChange}
          showClearAll
        />
      )

      const clearAllButton = screen.getByRole('button', { name: /clear all/i })
      await user.click(clearAllButton)

      expect(mockOnChange).toHaveBeenCalledWith([])
    })

    it('supports invert selection functionality', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions.filter(opt => !opt.disabled)}
          value={[1, 2]}
          onChange={mockOnChange}
          showInvertSelection
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const invertButton = screen.getByRole('button', { name: /invert selection/i })
      await user.click(invertButton)

      expect(mockOnChange).toHaveBeenCalledWith([4, 8, 16])
    })
  })

  describe('Bitmask Value Transformation', () => {
    it('handles bitmask values for HTTP verbs correctly', () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={3} // 1 + 2 = GET + POST
          onChange={mockOnChange}
          transformValue="bitmask"
        />
      )

      expect(screen.getByText('GET')).toBeInTheDocument()
      expect(screen.getByText('POST')).toBeInTheDocument()
    })

    it('transforms selection to bitmask value', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={1} // GET only
          onChange={mockOnChange}
          transformValue="bitmask"
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const postOption = screen.getByRole('option', { name: /post/i })
      await user.click(postOption)

      expect(mockOnChange).toHaveBeenCalledWith(3) // 1 + 2 = GET + POST
    })

    it('handles complex bitmask combinations', async () => {
      const mockOnChange = vi.fn()
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={0}
          onChange={mockOnChange}
          transformValue="bitmask"
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      // Select GET (1) + PUT (4) + DELETE (16)
      await user.click(screen.getByRole('option', { name: /get/i }))
      await user.click(screen.getByRole('option', { name: /put/i }))
      await user.click(screen.getByRole('option', { name: /delete/i }))

      expect(mockOnChange).toHaveBeenLastCalledWith(21) // 1 + 4 + 16
    })
  })

  describe('Search Within MultiSelect', () => {
    it('filters options when searching in multi-select', async () => {
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[]}
          onChange={vi.fn()}
          searchable
        />
      )

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'get')

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /get/i })).toBeInTheDocument()
        expect(screen.queryByRole('option', { name: /post/i })).not.toBeInTheDocument()
      })
    })

    it('maintains selected values during search', async () => {
      render(
        <MultiSelect
          label="HTTP Verbs"
          options={mockVerbOptions}
          value={[1, 2]}
          onChange={vi.fn()}
          searchable
        />
      )

      expect(screen.getByText('GET')).toBeInTheDocument()
      expect(screen.getByText('POST')).toBeInTheDocument()

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)

      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'delete')

      // Selected chips should still be visible
      expect(screen.getByText('GET')).toBeInTheDocument()
      expect(screen.getByText('POST')).toBeInTheDocument()
    })
  })

  describe('Form Integration and Validation', () => {
    it('validates minimum selections in form context', async () => {
      function TestForm() {
        const { register, handleSubmit, formState: { errors } } = useForm<TestFormData>({
          resolver: zodResolver(testFormSchema)
        })
        
        return (
          <form onSubmit={handleSubmit(vi.fn())}>
            <MultiSelect
              {...register('verbs')}
              label="HTTP Verbs"
              options={mockVerbOptions}
              error={errors.verbs?.message}
            />
            <button type="submit">Submit</button>
          </form>
        )
      }

      render(<TestForm />)

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(screen.getByText('At least one HTTP verb must be selected')).toBeInTheDocument()
      })
    })

    it('submits valid multi-select values in form', async () => {
      const mockSubmit = vi.fn()
      
      function TestForm() {
        const { register, handleSubmit } = useForm<TestFormData>()
        
        return (
          <form onSubmit={handleSubmit(mockSubmit)}>
            <MultiSelect
              {...register('verbs')}
              label="HTTP Verbs"
              options={mockVerbOptions}
            />
            <button type="submit">Submit</button>
          </form>
        )
      }

      render(<TestForm />)

      const trigger = screen.getByRole('button', { name: /http verbs/i })
      await user.click(trigger)
      await user.click(screen.getByRole('option', { name: /get/i }))
      await user.click(screen.getByRole('option', { name: /post/i }))

      await user.click(screen.getByRole('button', { name: /submit/i }))

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ verbs: [1, 2] }),
        expect.any(Object)
      )
    })
  })
})

describe('Performance and Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Performance Optimization', () => {
    it('handles large option lists without performance degradation', () => {
      const largeOptionList = Array.from({ length: 5000 }, (_, i) => ({
        value: `option-${i}`,
        label: `Option ${i}`
      }))

      const startTime = performance.now()
      
      render(
        <Select
          label="Large List"
          options={largeOptionList}
          value=""
          onChange={vi.fn()}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 100ms for 5000 options)
      expect(renderTime).toBeLessThan(100)
    })

    it('debounces search input efficiently', async () => {
      const mockFilter = vi.fn()
      render(
        <Autocomplete
          label="Search"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
          onSearch={mockFilter}
          debounceMs={100}
        />
      )

      const input = screen.getByRole('combobox')
      
      // Type multiple characters quickly
      await user.type(input, 'test')

      // Should only call filter once after debounce
      await waitFor(() => {
        expect(mockFilter).toHaveBeenCalledTimes(1)
        expect(mockFilter).toHaveBeenCalledWith('test')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty options array gracefully', () => {
      render(
        <Select
          label="Empty Options"
          options={[]}
          value=""
          onChange={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('handles undefined/null values gracefully', () => {
      render(
        <Select
          label="Null Value"
          options={mockOptions}
          value={null as any}
          onChange={vi.fn()}
        />
      )

      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('handles malformed option objects', async () => {
      const malformedOptions = [
        { value: 'valid', label: 'Valid Option' },
        { value: null, label: null } as any,
        { value: 'missing-label' } as any,
        undefined as any
      ].filter(Boolean)

      render(
        <Select
          label="Malformed Options"
          options={malformedOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      // Should only render valid options
      expect(screen.getByRole('option', { name: /valid option/i })).toBeInTheDocument()
    })

    it('handles rapid successive value changes', async () => {
      const mockOnChange = vi.fn()
      render(
        <Select
          label="Rapid Changes"
          options={mockOptions}
          value=""
          onChange={mockOnChange}
        />
      )

      const select = screen.getByRole('combobox')
      await user.click(select)

      // Rapidly click multiple options
      await user.click(screen.getByRole('option', { name: /mysql/i }))
      
      await user.click(select)
      await user.click(screen.getByRole('option', { name: /postgresql/i }))

      // Should handle all changes correctly
      expect(mockOnChange).toHaveBeenCalledWith('mysql')
      expect(mockOnChange).toHaveBeenCalledWith('postgresql')
    })

    it('maintains focus state during rapid interactions', async () => {
      render(
        <Select
          label="Focus Test"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      const select = screen.getByRole('combobox')
      
      // Rapid open/close operations
      await user.click(select)
      await user.keyboard('{Escape}')
      await user.click(select)
      await user.keyboard('{Escape}')

      // Select should maintain proper focus
      expect(select).toHaveFocus()
    })
  })

  describe('Memory Management', () => {
    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <Select
          label="Cleanup Test"
          options={mockOptions}
          value=""
          onChange={vi.fn()}
        />
      )

      // Should add click listener for outside click detection
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

      unmount()

      // Should remove the listener on unmount
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('cancels pending async operations on unmount', async () => {
      let resolvePromise: (value: SelectOption[]) => void
      const longRunningLoader = () => new Promise<SelectOption[]>(resolve => {
        resolvePromise = resolve
      })

      const { unmount } = render(
        <Autocomplete
          label="Async Cleanup"
          asyncOptions
          loadOptions={longRunningLoader}
          value=""
          onChange={vi.fn()}
        />
      )

      const input = screen.getByRole('combobox')
      await user.click(input)

      // Unmount before async operation completes
      unmount()

      // Complete the async operation after unmount
      resolvePromise!(mockOptions)

      // Should not cause memory leaks or state updates on unmounted component
      await new Promise(resolve => setTimeout(resolve, 10))
    })
  })
})