/**
 * Comprehensive test suite for the input component system using Vitest, Testing Library, and MSW.
 * Tests all input variants, accessibility features, validation integration, and user interactions
 * to ensure robust input functionality per Section 7.1.1 testing requirements.
 * 
 * @fileoverview Input component test suite for React 19/Next.js 15.1 migration
 * @version 1.0.0
 * @requires vitest@2.1.0 - 10x faster test execution than Jest/Karma
 * @requires @testing-library/react@16.0.0 - Enhanced React component testing
 * @requires jest-axe - WCAG 2.1 AA accessibility compliance testing
 * @requires msw@2.4.0 - Realistic API mocking for form validation
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Import components - these will be created by other tasks
import { Input } from './input'
import { SearchInput } from './search-input'
import { TextArea } from './textarea'
import { NumberInput } from './number-input'
import { PasswordInput } from './password-input'
import { EmailInput } from './email-input'
import type { 
  InputProps, 
  InputVariant, 
  InputSize,
  InputState 
} from './input.types'

// Import test utilities
import { renderWithProviders, createMockQueryClient } from '@/test/utils/test-utils'
import { createMockUser, createMockDatabaseService } from '@/test/utils/component-factories'
import { 
  testKeyboardNavigation, 
  testScreenReaderAnnouncements,
  testFocusManagement,
  testColorContrast
} from '@/test/utils/accessibility-helpers'
import { 
  measureRenderTime,
  measureInputLatency,
  measureMemoryUsage
} from '@/test/utils/performance-helpers'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// MSW server setup for validation testing
const validationHandlers = [
  // Mock validation endpoint for email checking
  http.post('/api/v2/system/admin/validate-email', async ({ request }) => {
    const { email } = await request.json() as { email: string }
    
    if (email === 'invalid@domain.com') {
      return HttpResponse.json(
        { error: { message: 'Email already exists', code: 400 } },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({ valid: true })
  }),
  
  // Mock password strength validation
  http.post('/api/v2/system/admin/validate-password', async ({ request }) => {
    const { password } = await request.json() as { password: string }
    
    const strength = {
      score: password.length >= 8 ? 3 : 1,
      feedback: password.length >= 8 ? 'Strong password' : 'Password too short'
    }
    
    return HttpResponse.json({ strength })
  }),
  
  // Mock database connection test for form validation
  http.post('/api/v2/system/admin/service/:id/test', () => {
    return HttpResponse.json({ success: true, message: 'Connection successful' })
  })
]

const server = setupServer(...validationHandlers)

// Form validation schemas for testing
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const databaseConfigSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1).max(65535, 'Port must be between 1-65535'),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().optional(),
  timeout: z.coerce.number().min(1).max(300).optional()
})

// Test wrapper component for React Hook Form integration
function TestFormWrapper({ 
  children, 
  schema = loginSchema,
  onSubmit = vi.fn(),
  defaultValues = {}
}: {
  children: React.ReactNode
  schema?: z.ZodSchema
  onSubmit?: (data: any) => void
  defaultValues?: Record<string, any>
}) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        {children}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  )
}

describe('Input Component System', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  describe('Base Input Component', () => {
    describe('Rendering and Basic Functionality', () => {
      it('renders with default props', () => {
        render(<Input data-testid="input" />)
        
        const input = screen.getByTestId('input')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'text')
        expect(input).not.toBeDisabled()
      })

      it('supports all input variants', () => {
        const variants: InputVariant[] = ['outline', 'filled', 'ghost']
        
        variants.forEach(variant => {
          const { rerender } = render(
            <Input variant={variant} data-testid={`input-${variant}`} />
          )
          
          const input = screen.getByTestId(`input-${variant}`)
          expect(input).toHaveClass(`input-${variant}`)
          
          rerender(<div />)
        })
      })

      it('supports all input sizes', () => {
        const sizes: InputSize[] = ['sm', 'md', 'lg', 'xl']
        
        sizes.forEach(size => {
          const { rerender } = render(
            <Input size={size} data-testid={`input-${size}`} />
          )
          
          const input = screen.getByTestId(`input-${size}`)
          expect(input).toHaveClass(`input-${size}`)
          
          rerender(<div />)
        })
      })

      it('handles input states correctly', () => {
        const states: InputState[] = ['default', 'error', 'success', 'warning']
        
        states.forEach(state => {
          const { rerender } = render(
            <Input state={state} data-testid={`input-${state}`} />
          )
          
          const input = screen.getByTestId(`input-${state}`)
          if (state !== 'default') {
            expect(input).toHaveClass(`input-${state}`)
          }
          
          rerender(<div />)
        })
      })
    })

    describe('User Interaction Tests', () => {
      it('handles text input and change events', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()
        
        render(<Input onChange={handleChange} data-testid="input" />)
        
        const input = screen.getByTestId('input')
        await user.type(input, 'Hello World')
        
        expect(input).toHaveValue('Hello World')
        expect(handleChange).toHaveBeenCalledTimes(11) // One for each character
      })

      it('handles focus and blur events', async () => {
        const user = userEvent.setup()
        const handleFocus = vi.fn()
        const handleBlur = vi.fn()
        
        render(
          <Input 
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-testid="input"
          />
        )
        
        const input = screen.getByTestId('input')
        
        await user.click(input)
        expect(handleFocus).toHaveBeenCalledTimes(1)
        expect(input).toHaveFocus()
        
        await user.tab()
        expect(handleBlur).toHaveBeenCalledTimes(1)
        expect(input).not.toHaveFocus()
      })

      it('supports keyboard navigation', async () => {
        const user = userEvent.setup()
        
        render(
          <div>
            <Input data-testid="input1" />
            <Input data-testid="input2" />
          </div>
        )
        
        const input1 = screen.getByTestId('input1')
        const input2 = screen.getByTestId('input2')
        
        await user.click(input1)
        expect(input1).toHaveFocus()
        
        await user.tab()
        expect(input2).toHaveFocus()
        
        await user.tab({ shift: true })
        expect(input1).toHaveFocus()
      })

      it('handles disabled state correctly', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()
        
        render(<Input disabled onChange={handleChange} data-testid="input" />)
        
        const input = screen.getByTestId('input')
        expect(input).toBeDisabled()
        
        await user.type(input, 'test')
        expect(input).toHaveValue('')
        expect(handleChange).not.toHaveBeenCalled()
      })

      it('handles readonly state correctly', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()
        
        render(
          <Input 
            readOnly 
            value="readonly value"
            onChange={handleChange} 
            data-testid="input" 
          />
        )
        
        const input = screen.getByTestId('input')
        expect(input).toHaveAttribute('readonly')
        expect(input).toHaveValue('readonly value')
        
        await user.type(input, 'test')
        expect(input).toHaveValue('readonly value')
        expect(handleChange).not.toHaveBeenCalled()
      })
    })

    describe('Prefix and Suffix Elements', () => {
      it('renders prefix elements correctly', () => {
        const prefix = <span data-testid="prefix">$</span>
        
        render(<Input prefix={prefix} data-testid="input" />)
        
        expect(screen.getByTestId('prefix')).toBeInTheDocument()
        expect(screen.getByTestId('input')).toBeInTheDocument()
      })

      it('renders suffix elements correctly', () => {
        const suffix = <button data-testid="suffix">Clear</button>
        
        render(<Input suffix={suffix} data-testid="input" />)
        
        expect(screen.getByTestId('suffix')).toBeInTheDocument()
        expect(screen.getByTestId('input')).toBeInTheDocument()
      })

      it('handles click events on suffix elements', async () => {
        const user = userEvent.setup()
        const handleSuffixClick = vi.fn()
        
        const suffix = (
          <button data-testid="clear-button" onClick={handleSuffixClick}>
            Clear
          </button>
        )
        
        render(<Input suffix={suffix} data-testid="input" />)
        
        await user.click(screen.getByTestId('clear-button'))
        expect(handleSuffixClick).toHaveBeenCalledTimes(1)
      })

      it('maintains proper tab order with prefix and suffix', async () => {
        const user = userEvent.setup()
        
        const prefix = <button data-testid="prefix-btn">Prefix</button>
        const suffix = <button data-testid="suffix-btn">Suffix</button>
        
        render(
          <div>
            <button data-testid="before">Before</button>
            <Input 
              prefix={prefix}
              suffix={suffix}
              data-testid="input"
            />
            <button data-testid="after">After</button>
          </div>
        )
        
        const beforeBtn = screen.getByTestId('before')
        const prefixBtn = screen.getByTestId('prefix-btn')
        const input = screen.getByTestId('input')
        const suffixBtn = screen.getByTestId('suffix-btn')
        const afterBtn = screen.getByTestId('after')
        
        await user.click(beforeBtn)
        expect(beforeBtn).toHaveFocus()
        
        await user.tab()
        expect(prefixBtn).toHaveFocus()
        
        await user.tab()
        expect(input).toHaveFocus()
        
        await user.tab()
        expect(suffixBtn).toHaveFocus()
        
        await user.tab()
        expect(afterBtn).toHaveFocus()
      })
    })

    describe('React Hook Form Integration', () => {
      it('integrates with React Hook Form validation', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn()
        
        render(
          <TestFormWrapper onSubmit={onSubmit}>
            <Input
              {...{ register: vi.fn(() => ({ name: 'email' })) }}
              name="email"
              data-testid="email-input"
            />
          </TestFormWrapper>
        )
        
        const input = screen.getByTestId('email-input')
        const submitBtn = screen.getByRole('button', { name: 'Submit' })
        
        // Test invalid email
        await user.type(input, 'invalid-email')
        await user.click(submitBtn)
        
        await waitFor(() => {
          expect(screen.getByText('Invalid email format')).toBeInTheDocument()
        })
        
        expect(onSubmit).not.toHaveBeenCalled()
        
        // Test valid email
        await user.clear(input)
        await user.type(input, 'valid@example.com')
        await user.click(submitBtn)
        
        await waitFor(() => {
          expect(onSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'valid@example.com' })
          )
        })
      })

      it('displays validation errors correctly', async () => {
        const user = userEvent.setup()
        
        render(
          <TestFormWrapper>
            <Input
              {...{ register: vi.fn(() => ({ name: 'email' })) }}
              name="email"
              error="Email is required"
              data-testid="email-input"
            />
          </TestFormWrapper>
        )
        
        const input = screen.getByTestId('email-input')
        expect(input).toHaveClass('input-error')
        expect(screen.getByText('Email is required')).toBeInTheDocument()
      })

      it('shows validation state in real-time', async () => {
        const user = userEvent.setup()
        
        render(
          <TestFormWrapper>
            <Input
              {...{ register: vi.fn(() => ({ name: 'email' })) }}
              name="email"
              data-testid="email-input"
            />
          </TestFormWrapper>
        )
        
        const input = screen.getByTestId('email-input')
        
        // Type invalid email
        await user.type(input, 'invalid')
        await waitFor(() => {
          expect(input).toHaveClass('input-error')
        })
        
        // Complete valid email
        await user.type(input, '@example.com')
        await waitFor(() => {
          expect(input).not.toHaveClass('input-error')
        })
      })
    })

    describe('Theme and Dark Mode Support', () => {
      it('applies correct classes for light theme', () => {
        render(
          <div data-theme="light">
            <Input data-testid="input" />
          </div>
        )
        
        const input = screen.getByTestId('input')
        expect(input).toHaveClass('bg-white', 'text-gray-900')
      })

      it('applies correct classes for dark theme', () => {
        render(
          <div data-theme="dark">
            <Input data-testid="input" />
          </div>
        )
        
        const input = screen.getByTestId('input')
        expect(input).toHaveClass('bg-gray-800', 'text-white')
      })

      it('maintains 4.5:1 contrast ratio requirement', async () => {
        const { container } = render(<Input data-testid="input" />)
        
        const contrastResults = await testColorContrast(container)
        expect(contrastResults.violations).toHaveLength(0)
      })
    })
  })

  describe('Specialized Input Components', () => {
    describe('SearchInput Component', () => {
      it('renders with search icon and clear button', () => {
        render(<SearchInput data-testid="search-input" />)
        
        const input = screen.getByTestId('search-input')
        const searchIcon = screen.getByTestId('search-icon')
        const clearButton = screen.getByTestId('clear-button')
        
        expect(input).toBeInTheDocument()
        expect(searchIcon).toBeInTheDocument()
        expect(clearButton).toBeInTheDocument()
      })

      it('handles debounced search correctly', async () => {
        const user = userEvent.setup()
        const handleSearch = vi.fn()
        
        render(
          <SearchInput 
            onSearch={handleSearch}
            debounceMs={300}
            data-testid="search-input" 
          />
        )
        
        const input = screen.getByTestId('search-input')
        
        await user.type(input, 'search query')
        
        // Should not call immediately
        expect(handleSearch).not.toHaveBeenCalled()
        
        // Should call after debounce period
        await waitFor(() => {
          expect(handleSearch).toHaveBeenCalledWith('search query')
        }, { timeout: 400 })
      })

      it('clears input when clear button is clicked', async () => {
        const user = userEvent.setup()
        
        render(<SearchInput defaultValue="test query" data-testid="search-input" />)
        
        const input = screen.getByTestId('search-input')
        const clearButton = screen.getByTestId('clear-button')
        
        expect(input).toHaveValue('test query')
        
        await user.click(clearButton)
        expect(input).toHaveValue('')
      })

      it('supports keyboard shortcuts (Ctrl+K for focus, Escape for clear)', async () => {
        const user = userEvent.setup()
        
        render(
          <div>
            <button>Other element</button>
            <SearchInput data-testid="search-input" />
          </div>
        )
        
        const input = screen.getByTestId('search-input')
        
        // Test Ctrl+K for focus
        await user.keyboard('{Control>}k{/Control}')
        expect(input).toHaveFocus()
        
        // Add some text
        await user.type(input, 'test query')
        expect(input).toHaveValue('test query')
        
        // Test Escape for clear
        await user.keyboard('{Escape}')
        expect(input).toHaveValue('')
      })
    })

    describe('NumberInput Component', () => {
      it('renders with increment/decrement buttons', () => {
        render(<NumberInput data-testid="number-input" />)
        
        const input = screen.getByTestId('number-input')
        const incrementBtn = screen.getByTestId('increment-button')
        const decrementBtn = screen.getByTestId('decrement-button')
        
        expect(input).toHaveAttribute('type', 'number')
        expect(incrementBtn).toBeInTheDocument()
        expect(decrementBtn).toBeInTheDocument()
      })

      it('handles increment/decrement button clicks', async () => {
        const user = userEvent.setup()
        
        render(<NumberInput defaultValue={5} step={1} data-testid="number-input" />)
        
        const input = screen.getByTestId('number-input')
        const incrementBtn = screen.getByTestId('increment-button')
        const decrementBtn = screen.getByTestId('decrement-button')
        
        expect(input).toHaveValue('5')
        
        await user.click(incrementBtn)
        expect(input).toHaveValue('6')
        
        await user.click(decrementBtn)
        await user.click(decrementBtn)
        expect(input).toHaveValue('4')
      })

      it('respects min/max constraints', async () => {
        const user = userEvent.setup()
        
        render(
          <NumberInput 
            min={0}
            max={10}
            defaultValue={5}
            data-testid="number-input" 
          />
        )
        
        const input = screen.getByTestId('number-input')
        const incrementBtn = screen.getByTestId('increment-button')
        const decrementBtn = screen.getByTestId('decrement-button')
        
        // Test max constraint
        await user.clear(input)
        await user.type(input, '10')
        await user.click(incrementBtn)
        expect(input).toHaveValue('10') // Should not exceed max
        
        // Test min constraint
        await user.clear(input)
        await user.type(input, '0')
        await user.click(decrementBtn)
        expect(input).toHaveValue('0') // Should not go below min
      })

      it('handles keyboard increment/decrement (arrow keys)', async () => {
        const user = userEvent.setup()
        
        render(<NumberInput defaultValue={5} data-testid="number-input" />)
        
        const input = screen.getByTestId('number-input')
        await user.click(input)
        
        await user.keyboard('{ArrowUp}')
        expect(input).toHaveValue('6')
        
        await user.keyboard('{ArrowDown}')
        expect(input).toHaveValue('5')
      })

      it('formats numbers with locale support', () => {
        render(
          <NumberInput 
            value={1234.56}
            locale="en-US"
            formatOptions={{ style: 'currency', currency: 'USD' }}
            data-testid="number-input"
          />
        )
        
        const input = screen.getByTestId('number-input')
        expect(input).toHaveDisplayValue('$1,234.56')
      })
    })

    describe('PasswordInput Component', () => {
      it('renders with show/hide toggle button', () => {
        render(<PasswordInput data-testid="password-input" />)
        
        const input = screen.getByTestId('password-input')
        const toggleBtn = screen.getByTestId('password-toggle')
        
        expect(input).toHaveAttribute('type', 'password')
        expect(toggleBtn).toBeInTheDocument()
      })

      it('toggles password visibility', async () => {
        const user = userEvent.setup()
        
        render(<PasswordInput data-testid="password-input" />)
        
        const input = screen.getByTestId('password-input')
        const toggleBtn = screen.getByTestId('password-toggle')
        
        expect(input).toHaveAttribute('type', 'password')
        
        await user.click(toggleBtn)
        expect(input).toHaveAttribute('type', 'text')
        
        await user.click(toggleBtn)
        expect(input).toHaveAttribute('type', 'password')
      })

      it('maintains cursor position when toggling visibility', async () => {
        const user = userEvent.setup()
        
        render(<PasswordInput data-testid="password-input" />)
        
        const input = screen.getByTestId('password-input') as HTMLInputElement
        const toggleBtn = screen.getByTestId('password-toggle')
        
        await user.type(input, 'password123')
        
        // Set cursor position
        input.setSelectionRange(4, 4) // After "pass"
        const cursorPosition = input.selectionStart
        
        await user.click(toggleBtn)
        expect(input.selectionStart).toBe(cursorPosition)
      })

      it('displays password strength meter', async () => {
        const user = userEvent.setup()
        
        render(<PasswordInput showStrengthMeter data-testid="password-input" />)
        
        const input = screen.getByTestId('password-input')
        
        // Weak password
        await user.type(input, '123')
        await waitFor(() => {
          expect(screen.getByTestId('strength-meter')).toHaveClass('strength-weak')
        })
        
        // Strong password
        await user.clear(input)
        await user.type(input, 'StrongP@ssw0rd123!')
        await waitFor(() => {
          expect(screen.getByTestId('strength-meter')).toHaveClass('strength-strong')
        })
      })

      it('validates password confirmation matching', async () => {
        const user = userEvent.setup()
        
        render(
          <TestFormWrapper>
            <PasswordInput
              {...{ register: vi.fn(() => ({ name: 'password' })) }}
              name="password"
              data-testid="password"
            />
            <PasswordInput
              {...{ register: vi.fn(() => ({ name: 'confirmPassword' })) }}
              name="confirmPassword"
              data-testid="confirm-password"
            />
          </TestFormWrapper>
        )
        
        const password = screen.getByTestId('password')
        const confirmPassword = screen.getByTestId('confirm-password')
        const submitBtn = screen.getByRole('button', { name: 'Submit' })
        
        await user.type(password, 'password123')
        await user.type(confirmPassword, 'different123')
        await user.click(submitBtn)
        
        await waitFor(() => {
          expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
        })
      })
    })

    describe('EmailInput Component', () => {
      it('renders with email input type', () => {
        render(<EmailInput data-testid="email-input" />)
        
        const input = screen.getByTestId('email-input')
        expect(input).toHaveAttribute('type', 'email')
      })

      it('provides domain autocomplete suggestions', async () => {
        const user = userEvent.setup()
        
        render(<EmailInput showSuggestions data-testid="email-input" />)
        
        const input = screen.getByTestId('email-input')
        
        await user.type(input, 'user@gmai')
        
        await waitFor(() => {
          expect(screen.getByText('user@gmail.com')).toBeInTheDocument()
        })
      })

      it('detects and suggests typo corrections', async () => {
        const user = userEvent.setup()
        
        render(<EmailInput detectTypos data-testid="email-input" />)
        
        const input = screen.getByTestId('email-input')
        
        await user.type(input, 'user@gmial.com') // Typo: gmial instead of gmail
        
        await waitFor(() => {
          expect(screen.getByText('Did you mean gmail.com?')).toBeInTheDocument()
        })
      })

      it('handles multiple email input with delimiters', async () => {
        const user = userEvent.setup()
        const handleChange = vi.fn()
        
        render(
          <EmailInput 
            multiple
            onChange={handleChange}
            data-testid="email-input" 
          />
        )
        
        const input = screen.getByTestId('email-input')
        
        await user.type(input, 'user1@example.com, user2@example.com; user3@example.com')
        
        expect(handleChange).toHaveBeenCalledWith(
          expect.objectContaining({
            target: expect.objectContaining({
              value: expect.arrayContaining([
                'user1@example.com',
                'user2@example.com',
                'user3@example.com'
              ])
            })
          })
        )
      })

      it('validates email format in real-time', async () => {
        const user = userEvent.setup()
        
        render(<EmailInput data-testid="email-input" />)
        
        const input = screen.getByTestId('email-input')
        
        // Invalid email
        await user.type(input, 'invalid-email')
        await waitFor(() => {
          expect(input).toHaveClass('input-error')
        })
        
        // Valid email
        await user.clear(input)
        await user.type(input, 'valid@example.com')
        await waitFor(() => {
          expect(input).not.toHaveClass('input-error')
        })
      })
    })

    describe('TextArea Component', () => {
      it('renders as textarea element', () => {
        render(<TextArea data-testid="textarea" />)
        
        const textarea = screen.getByTestId('textarea')
        expect(textarea.tagName).toBe('TEXTAREA')
      })

      it('auto-resizes with content', async () => {
        const user = userEvent.setup()
        
        render(<TextArea autoResize data-testid="textarea" />)
        
        const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
        const initialHeight = textarea.style.height
        
        await user.type(textarea, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5')
        
        await waitFor(() => {
          expect(textarea.style.height).not.toBe(initialHeight)
        })
      })

      it('displays character count', async () => {
        const user = userEvent.setup()
        
        render(<TextArea showCharCount maxLength={100} data-testid="textarea" />)
        
        const textarea = screen.getByTestId('textarea')
        const charCount = screen.getByTestId('char-count')
        
        expect(charCount).toHaveTextContent('0/100')
        
        await user.type(textarea, 'Hello World')
        expect(charCount).toHaveTextContent('11/100')
      })

      it('handles max height constraint with scrolling', async () => {
        const user = userEvent.setup()
        
        render(
          <TextArea 
            autoResize
            maxHeight={100}
            data-testid="textarea" 
          />
        )
        
        const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
        
        // Add enough content to exceed max height
        const longText = Array(50).fill('This is a long line of text').join('\n')
        await user.type(textarea, longText)
        
        await waitFor(() => {
          const height = parseInt(textarea.style.height)
          expect(height).toBeLessThanOrEqual(100)
          expect(textarea.style.overflowY).toBe('auto')
        })
      })
    })
  })

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('passes axe accessibility audit', async () => {
      const { container } = render(
        <div>
          <Input 
            label="Email Address"
            placeholder="Enter your email"
            data-testid="input"
          />
          <NumberInput 
            label="Port Number"
            min={1}
            max={65535}
            data-testid="number-input"
          />
          <PasswordInput 
            label="Password"
            data-testid="password-input"
          />
        </div>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports proper labeling and descriptions', () => {
      render(
        <Input
          label="Database Host"
          description="Enter the hostname or IP address of your database server"
          error="Host is required"
          data-testid="input"
        />
      )
      
      const input = screen.getByTestId('input')
      const label = screen.getByText('Database Host')
      const description = screen.getByText('Enter the hostname or IP address of your database server')
      const error = screen.getByText('Host is required')
      
      expect(input).toHaveAttribute('aria-labelledby', label.id)
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(description.id))
      expect(input).toHaveAttribute('aria-describedby', expect.stringContaining(error.id))
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('announces validation errors to screen readers', async () => {
      const user = userEvent.setup()
      
      render(
        <TestFormWrapper>
          <Input
            {...{ register: vi.fn(() => ({ name: 'email' })) }}
            name="email"
            label="Email Address"
            data-testid="email-input"
          />
        </TestFormWrapper>
      )
      
      const input = screen.getByTestId('email-input')
      const submitBtn = screen.getByRole('button', { name: 'Submit' })
      
      await user.type(input, 'invalid-email')
      await user.click(submitBtn)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Invalid email format')
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(errorMessage).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('supports keyboard navigation patterns', async () => {
      const navigationResults = await testKeyboardNavigation([
        'input[data-testid="input1"]',
        'input[data-testid="input2"]',
        'button[data-testid="button1"]'
      ])
      
      expect(navigationResults.tabOrderCorrect).toBe(true)
      expect(navigationResults.focusVisibleOnAll).toBe(true)
    })

    it('provides screen reader announcements for state changes', async () => {
      const announcements = await testScreenReaderAnnouncements(async () => {
        const user = userEvent.setup()
        
        render(<NumberInput data-testid="number-input" />)
        
        const incrementBtn = screen.getByTestId('increment-button')
        await user.click(incrementBtn)
      })
      
      expect(announcements).toContain('Value increased')
    })

    it('maintains focus management for complex interactions', async () => {
      const focusResults = await testFocusManagement(async () => {
        const user = userEvent.setup()
        
        render(<PasswordInput data-testid="password-input" />)
        
        const input = screen.getByTestId('password-input')
        const toggleBtn = screen.getByTestId('password-toggle')
        
        await user.click(input)
        await user.click(toggleBtn)
        
        return input
      })
      
      expect(focusResults.maintainedFocus).toBe(true)
      expect(focusResults.noFocusLoss).toBe(true)
    })

    it('meets color contrast requirements', async () => {
      const { container } = render(
        <div>
          <Input variant="outline" data-testid="outline-input" />
          <Input variant="filled" data-testid="filled-input" />
          <Input variant="ghost" data-testid="ghost-input" />
        </div>
      )
      
      const contrastResults = await testColorContrast(container)
      expect(contrastResults.violations).toHaveLength(0)
      expect(contrastResults.minimumRatio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe('Performance Testing', () => {
    it('renders inputs within performance targets', async () => {
      const renderTime = await measureRenderTime(() => {
        render(
          <div>
            {Array.from({ length: 50 }, (_, i) => (
              <Input key={i} data-testid={`input-${i}`} />
            ))}
          </div>
        )
      })
      
      // Should render 50 inputs in under 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('handles high-frequency input events efficiently', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      
      render(<Input onChange={handleChange} data-testid="input" />)
      
      const input = screen.getByTestId('input')
      
      const inputLatency = await measureInputLatency(async () => {
        await user.type(input, 'rapid typing test for performance measurement')
      })
      
      // Each keystroke should process in under 50ms
      expect(inputLatency.averageLatency).toBeLessThan(50)
      expect(inputLatency.maxLatency).toBeLessThan(100)
    })

    it('manages memory efficiently with large forms', async () => {
      const initialMemory = await measureMemoryUsage()
      
      render(
        <TestFormWrapper schema={databaseConfigSchema}>
          {Array.from({ length: 100 }, (_, i) => (
            <Input 
              key={i}
              {...{ register: vi.fn(() => ({ name: `field${i}` })) }}
              name={`field${i}`}
              data-testid={`input-${i}`}
            />
          ))}
        </TestFormWrapper>
      )
      
      const finalMemory = await measureMemoryUsage()
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable for 100 form fields
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
    })

    it('handles debounced inputs without performance degradation', async () => {
      const user = userEvent.setup()
      const handleSearch = vi.fn()
      
      render(
        <SearchInput 
          onSearch={handleSearch}
          debounceMs={100}
          data-testid="search-input" 
        />
      )
      
      const input = screen.getByTestId('search-input')
      
      const startTime = performance.now()
      
      // Rapid typing to test debounce performance
      await user.type(input, 'rapid search query input')
      
      // Wait for debounce to complete
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('rapid search query input')
      }, { timeout: 200 })
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // Total time should be reasonable despite debouncing
      expect(totalTime).toBeLessThan(300) // Under 300ms total
      expect(handleSearch).toHaveBeenCalledTimes(1) // Debounced to single call
    })
  })

  describe('Integration with Forms and Validation', () => {
    it('integrates with complex database configuration form', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn()
      
      render(
        <TestFormWrapper schema={databaseConfigSchema} onSubmit={onSubmit}>
          <Input
            {...{ register: vi.fn(() => ({ name: 'name' })) }}
            name="name"
            label="Service Name"
            data-testid="service-name"
          />
          <Input
            {...{ register: vi.fn(() => ({ name: 'host' })) }}
            name="host"
            label="Database Host"
            data-testid="host"
          />
          <NumberInput
            {...{ register: vi.fn(() => ({ name: 'port' })) }}
            name="port"
            label="Port"
            min={1}
            max={65535}
            data-testid="port"
          />
          <Input
            {...{ register: vi.fn(() => ({ name: 'database' })) }}
            name="database"
            label="Database Name"
            data-testid="database"
          />
          <Input
            {...{ register: vi.fn(() => ({ name: 'username' })) }}
            name="username"
            label="Username"
            data-testid="username"
          />
          <PasswordInput
            {...{ register: vi.fn(() => ({ name: 'password' })) }}
            name="password"
            label="Password"
            data-testid="password"
          />
        </TestFormWrapper>
      )
      
      // Fill out valid form data
      await user.type(screen.getByTestId('service-name'), 'Test Database')
      await user.type(screen.getByTestId('host'), 'localhost')
      await user.type(screen.getByTestId('port'), '3306')
      await user.type(screen.getByTestId('database'), 'testdb')
      await user.type(screen.getByTestId('username'), 'testuser')
      await user.type(screen.getByTestId('password'), 'testpass123')
      
      const submitBtn = screen.getByRole('button', { name: 'Submit' })
      await user.click(submitBtn)
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Test Database',
          host: 'localhost',
          port: 3306,
          database: 'testdb',
          username: 'testuser',
          password: 'testpass123'
        })
      })
    })

    it('handles cross-field validation errors', async () => {
      const user = userEvent.setup()
      
      render(
        <TestFormWrapper>
          <PasswordInput
            {...{ register: vi.fn(() => ({ name: 'password' })) }}
            name="password"
            label="Password"
            data-testid="password"
          />
          <PasswordInput
            {...{ register: vi.fn(() => ({ name: 'confirmPassword' })) }}
            name="confirmPassword"
            label="Confirm Password"
            data-testid="confirm-password"
          />
        </TestFormWrapper>
      )
      
      const password = screen.getByTestId('password')
      const confirmPassword = screen.getByTestId('confirm-password')
      const submitBtn = screen.getByRole('button', { name: 'Submit' })
      
      await user.type(password, 'password123')
      await user.type(confirmPassword, 'different123')
      await user.click(submitBtn)
      
      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
        expect(confirmPassword).toHaveClass('input-error')
        expect(confirmPassword).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('provides real-time validation feedback', async () => {
      const user = userEvent.setup()
      
      render(
        <TestFormWrapper>
          <EmailInput
            {...{ register: vi.fn(() => ({ name: 'email' })) }}
            name="email"
            label="Email Address"
            data-testid="email"
          />
          <NumberInput
            {...{ register: vi.fn(() => ({ name: 'port' })) }}
            name="port"
            label="Port Number"
            min={1}
            max={65535}
            data-testid="port"
          />
        </TestFormWrapper>
      )
      
      const email = screen.getByTestId('email')
      const port = screen.getByTestId('port')
      
      // Test email validation
      await user.type(email, 'invalid')
      await waitFor(() => {
        expect(email).toHaveClass('input-error')
      })
      
      await user.type(email, '@example.com')
      await waitFor(() => {
        expect(email).not.toHaveClass('input-error')
        expect(email).toHaveClass('input-success')
      })
      
      // Test number validation
      await user.type(port, '99999') // Exceeds max
      await waitFor(() => {
        expect(port).toHaveClass('input-error')
      })
      
      await user.clear(port)
      await user.type(port, '3306')
      await waitFor(() => {
        expect(port).not.toHaveClass('input-error')
        expect(port).toHaveClass('input-success')
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles malformed input gracefully', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      
      render(<NumberInput onChange={handleChange} data-testid="number-input" />)
      
      const input = screen.getByTestId('number-input')
      
      // Try to enter non-numeric characters
      await user.type(input, 'abc123def')
      
      // Should filter out non-numeric characters
      expect(input).toHaveValue('123')
      expect(handleChange).toHaveBeenCalled()
    })

    it('recovers from API validation errors', async () => {
      const user = userEvent.setup()
      
      // Mock server error for email validation
      server.use(
        http.post('/api/v2/system/admin/validate-email', () => {
          return HttpResponse.json(
            { error: { message: 'Validation service unavailable', code: 500 } },
            { status: 500 }
          )
        })
      )
      
      render(
        <EmailInput 
          validateOnServer
          data-testid="email-input" 
        />
      )
      
      const input = screen.getByTestId('email-input')
      
      await user.type(input, 'test@example.com')
      
      // Should gracefully handle server error
      await waitFor(() => {
        expect(screen.getByText('Unable to validate email. Please try again.')).toBeInTheDocument()
      })
    })

    it('handles large text input without performance issues', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      
      render(<TextArea onChange={handleChange} data-testid="textarea" />)
      
      const textarea = screen.getByTestId('textarea')
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(1000) // ~27KB
      
      const startTime = performance.now()
      await user.type(textarea, largeText)
      const endTime = performance.now()
      
      expect(textarea).toHaveValue(largeText)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
      expect(handleChange).toHaveBeenCalled()
    })

    it('maintains state during theme changes', async () => {
      const user = userEvent.setup()
      
      const { rerender } = render(
        <div data-theme="light">
          <Input data-testid="input" />
        </div>
      )
      
      const input = screen.getByTestId('input')
      await user.type(input, 'test value')
      
      expect(input).toHaveValue('test value')
      
      // Change theme
      rerender(
        <div data-theme="dark">
          <Input data-testid="input" />
        </div>
      )
      
      // Value should be preserved
      expect(input).toHaveValue('test value')
    })

    it('handles rapid mount/unmount cycles without memory leaks', async () => {
      const initialMemory = await measureMemoryUsage()
      
      // Rapidly mount and unmount components
      for (let i = 0; i < 100; i++) {
        const { unmount } = render(<Input data-testid={`input-${i}`} />)
        unmount()
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = await measureMemoryUsage()
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB
    })
  })
})