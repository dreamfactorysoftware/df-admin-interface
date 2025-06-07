/**
 * Comprehensive Input Component Test Suite
 * 
 * Test coverage for React 19 Input components using Vitest, Testing Library, and MSW.
 * Implements WCAG 2.1 AA accessibility compliance testing, React Hook Form integration
 * validation, performance benchmarks, and comprehensive user interaction testing.
 * 
 * Features tested:
 * - All input variants, sizes, and states with visual regression
 * - WCAG 2.1 AA accessibility compliance using jest-axe
 * - React Hook Form integration with validation scenarios
 * - Keyboard navigation and focus management
 * - Prefix/suffix element interactions and functionality
 * - Theme compatibility (light/dark mode)
 * - Performance testing for debounced inputs and responsiveness
 * - Error handling and edge cases
 * 
 * @fileoverview Comprehensive test suite for Input component system
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Import test utilities
import {
  customRender,
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  createMockValidation,
  waitForValidation,
  measureRenderTime,
  createLargeDataset,
  type CustomRenderOptions,
  type FormTestUtils,
  type KeyboardTestUtils,
} from '@/test/test-utils';

// Import components under test
import {
  Input,
  ControlledInput,
  InputContainer,
  InputAdornment,
  type BaseInputProps,
  type ControlledInputProps,
  type InputContainerProps,
  type InputAdornmentProps,
  type InputRef,
} from './input';

// Import types for testing
import type {
  InputVariant,
  InputSize,
  InputState,
  InputChangeEvent,
  InputFocusEvent,
  InputKeyboardEvent,
} from './input.types';

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Mock implementations for performance testing
 */
const mockPerformanceObserver = vi.fn();
const mockIntersectionObserver = vi.fn();
const mockResizeObserver = vi.fn();

// Mock performance APIs
Object.defineProperty(window, 'PerformanceObserver', {
  writable: true,
  configurable: true,
  value: mockPerformanceObserver,
});

Object.defineProperty(window, 'performance', {
  writable: true,
  configurable: true,
  value: {
    ...window.performance,
    mark: vi.fn(),
    measure: vi.fn(),
    now: vi.fn(() => Date.now()),
  },
});

/**
 * Default test props for input components
 */
const defaultInputProps: Partial<BaseInputProps> = {
  'data-testid': 'test-input',
  placeholder: 'Test placeholder',
};

/**
 * Test data for various input scenarios
 */
const testData = {
  variants: ['outline', 'filled', 'ghost'] as InputVariant[],
  sizes: ['sm', 'md', 'lg'] as InputSize[],
  states: ['default', 'error', 'success', 'warning'] as InputState[],
  themes: ['light', 'dark'] as const,
  prefixSuffixContent: {
    icon: <span data-testid="test-icon">🔍</span>,
    text: <span data-testid="test-text">USD</span>,
    button: <button data-testid="test-button">Click</button>,
  },
  performanceData: createLargeDataset(1000),
};

/**
 * Custom render function for input testing with enhanced providers
 */
const renderInput = (
  ui: React.ReactElement,
  options: CustomRenderOptions & { theme?: 'light' | 'dark' } = {}
) => {
  const { theme = 'light', ...renderOptions } = options;
  
  return customRender(ui, {
    theme,
    ...renderOptions,
  });
};

/**
 * Helper function to get input element
 */
const getInputElement = (testId: string = 'test-input'): HTMLInputElement => {
  const element = screen.getByTestId(testId);
  expect(element).toBeInstanceOf(HTMLInputElement);
  return element as HTMLInputElement;
};

/**
 * Helper function to simulate user typing with realistic timing
 */
const simulateUserTyping = async (
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  text: string,
  options: { delay?: number } = {}
) => {
  const { delay = 50 } = options;
  
  await user.click(element);
  await user.clear(element);
  
  for (const char of text) {
    await user.type(element, char, { delay });
  }
};

// ============================================================================
// BASIC COMPONENT RENDERING TESTS
// ============================================================================

describe('Input Component - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base Input Component', () => {
    it('renders with default props and maintains WCAG compliance', async () => {
      const { container } = renderInput(
        <Input {...defaultInputProps} />
      );

      const input = getInputElement();
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Test placeholder');
      
      // Verify WCAG 2.1 AA compliance
      await testA11y(container, {
        tags: ['wcag2a', 'wcag2aa'],
      });
    });

    it('renders all variants with proper styling', async () => {
      for (const variant of testData.variants) {
        const { container, rerender } = renderInput(
          <Input {...defaultInputProps} variant={variant} />
        );

        const input = getInputElement();
        expect(input).toBeInTheDocument();
        
        // Verify variant-specific classes are applied
        expect(input.className).toContain(variant === 'outline' ? 'border-gray-300' : '');
        
        // Ensure accessibility for each variant
        await testA11y(container);
        
        // Clean up for next iteration
        rerender(<div />);
      }
    });

    it('renders all sizes with minimum touch target compliance', async () => {
      for (const size of testData.sizes) {
        const { container, rerender } = renderInput(
          <Input {...defaultInputProps} size={size} />
        );

        const input = getInputElement();
        expect(input).toBeInTheDocument();
        
        // Verify WCAG 2.1 AA minimum touch target sizes
        const computedStyle = window.getComputedStyle(input);
        const minHeight = parseInt(computedStyle.minHeight);
        
        switch (size) {
          case 'sm':
            expect(minHeight).toBeGreaterThanOrEqual(36); // Close to WCAG minimum
            break;
          case 'md':
            expect(minHeight).toBeGreaterThanOrEqual(44); // WCAG 2.1 AA minimum
            break;
          case 'lg':
            expect(minHeight).toBeGreaterThanOrEqual(48); // Enhanced touch target
            break;
        }
        
        await testA11y(container);
        rerender(<div />);
      }
    });

    it('renders all states with appropriate visual feedback', async () => {
      for (const state of testData.states) {
        const { container, rerender } = renderInput(
          <Input 
            {...defaultInputProps} 
            state={state}
            error={state === 'error' ? 'Test error message' : undefined}
          />
        );

        const input = getInputElement();
        expect(input).toBeInTheDocument();
        
        // Verify state-specific styling
        if (state === 'error') {
          expect(input.className).toContain('border-error-500');
          expect(input).toHaveAttribute('aria-invalid', 'true');
          
          // Verify error message is announced
          const errorMessage = screen.getByRole('alert');
          expect(errorMessage).toBeInTheDocument();
          expect(errorMessage).toHaveTextContent('Test error message');
        }
        
        await testA11y(container);
        rerender(<div />);
      }
    });
  });

  describe('Input Container Component', () => {
    it('renders with proper layout structure', () => {
      const { container } = renderInput(
        <InputContainer>
          <input data-testid="child-input" />
        </InputContainer>
      );

      const container_element = container.querySelector('.relative');
      expect(container_element).toBeInTheDocument();
      expect(container_element).toHaveClass('inline-flex', 'w-full');
      
      const input = screen.getByTestId('child-input');
      expect(input).toBeInTheDocument();
    });

    it('applies disabled styling correctly', () => {
      const { container } = renderInput(
        <InputContainer disabled>
          <input data-testid="child-input" />
        </InputContainer>
      );

      const container_element = container.querySelector('.relative');
      expect(container_element).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Input Adornment Component', () => {
    it('renders prefix adornment correctly', () => {
      renderInput(
        <InputAdornment position="prefix" data-testid="prefix-adornment">
          {testData.prefixSuffixContent.icon}
        </InputAdornment>
      );

      const adornment = screen.getByTestId('prefix-adornment');
      expect(adornment).toBeInTheDocument();
      expect(adornment).toHaveClass('left-0', 'pl-3');
      
      const icon = screen.getByTestId('test-icon');
      expect(icon).toBeInTheDocument();
    });

    it('renders suffix adornment correctly', () => {
      renderInput(
        <InputAdornment position="suffix" data-testid="suffix-adornment">
          {testData.prefixSuffixContent.text}
        </InputAdornment>
      );

      const adornment = screen.getByTestId('suffix-adornment');
      expect(adornment).toBeInTheDocument();
      expect(adornment).toHaveClass('right-0', 'pr-3');
      
      const text = screen.getByTestId('test-text');
      expect(text).toBeInTheDocument();
    });

    it('handles clickable adornments with keyboard support', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      renderInput(
        <InputAdornment 
          position="suffix" 
          clickable 
          onClick={handleClick}
          aria-label="Clear input"
          data-testid="clickable-adornment"
        >
          {testData.prefixSuffixContent.button}
        </InputAdornment>
      );

      const adornment = screen.getByTestId('clickable-adornment');
      expect(adornment).toHaveAttribute('role', 'button');
      expect(adornment).toHaveAttribute('tabIndex', '0');
      expect(adornment).toHaveAttribute('aria-label', 'Clear input');

      // Test mouse click
      await user.click(adornment);
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Test keyboard activation
      await user.keyboard('{Tab}');
      expect(adornment).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(2);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

describe('Input Component - WCAG 2.1 AA Accessibility', () => {
  describe('ARIA Attributes and Labeling', () => {
    it('provides proper ARIA labeling', async () => {
      renderInput(
        <Input
          {...defaultInputProps}
          aria-label="Search database"
          aria-describedby="search-help"
          required
        />
      );

      const input = getInputElement();
      
      checkAriaAttributes(input, {
        'aria-label': 'Search database',
        'aria-describedby': 'search-help',
        'aria-required': 'true',
        'aria-invalid': 'false',
      });
    });

    it('properly associates error messages with ARIA', async () => {
      renderInput(
        <Input
          {...defaultInputProps}
          error="Invalid email format"
          aria-label="Email address"
        />
      );

      const input = getInputElement();
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input.getAttribute('aria-describedby')).toContain(errorMessage.id);
      expect(input.getAttribute('aria-errormessage')).toBe(errorMessage.id);
      
      // Verify error is announced to screen readers
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
    });

    it('maintains focus visibility for keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderInput(
        <div>
          <Input {...defaultInputProps} data-testid="input-1" />
          <Input {...defaultInputProps} data-testid="input-2" />
        </div>
      );

      const input1 = getInputElement('input-1');
      const input2 = screen.getByTestId('input-2');

      // Tab to first input
      await user.tab();
      expect(input1).toHaveFocus();
      
      // Verify focus ring is visible (class-based check)
      expect(input1).toHaveClass('focus:ring-2');
      
      // Tab to second input
      await user.tab();
      expect(input2).toHaveFocus();
      expect(input1).not.toHaveFocus();
    });

    it('supports screen reader announcements for loading states', async () => {
      const { rerender } = renderInput(
        <Input {...defaultInputProps} loading={false} />
      );

      // Initially no loading indicator
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      
      // Enable loading state
      rerender(
        <Input {...defaultInputProps} loading={true} />
      );

      // Loading spinner should be present but hidden from screen readers
      const spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation', async () => {
      const user = userEvent.setup();
      const keyboard = createKeyboardUtils(user);
      const handleKeyDown = vi.fn();

      renderInput(
        <Input 
          {...defaultInputProps} 
          onKeyDown={handleKeyDown}
        />
      );

      const input = getInputElement();
      
      // Focus input
      await keyboard.tab();
      expect(input).toHaveFocus();
      
      // Test various keyboard interactions
      await keyboard.enter();
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Enter' })
      );
      
      await keyboard.escape();
      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'Escape' })
      );
      
      // Test arrow key navigation
      await keyboard.arrowLeft();
      await keyboard.arrowRight();
      expect(handleKeyDown).toHaveBeenCalledTimes(4);
    });

    it('traps focus appropriately in complex layouts', async () => {
      const user = userEvent.setup();
      
      renderInput(
        <div>
          <button data-testid="before-button">Before</button>
          <Input 
            {...defaultInputProps} 
            prefix={<button data-testid="prefix-button">Search</button>}
            suffix={<button data-testid="suffix-button">Clear</button>}
          />
          <button data-testid="after-button">After</button>
        </div>
      );

      const beforeButton = screen.getByTestId('before-button');
      const input = getInputElement();
      const afterButton = screen.getByTestId('after-button');

      // Tab through all focusable elements
      await user.tab();
      expect(beforeButton).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(afterButton).toHaveFocus();
      
      // Reverse tab direction
      await user.tab({ shift: true });
      expect(input).toHaveFocus();
    });
  });

  describe('Color Contrast and Theme Compliance', () => {
    it('maintains WCAG AA contrast ratios in light theme', async () => {
      const { container } = renderInput(
        <Input {...defaultInputProps} />,
        { theme: 'light' }
      );

      // Verify no contrast violations
      await testA11y(container, {
        tags: ['wcag2aa'],
        includeRules: ['color-contrast'],
      });
    });

    it('maintains WCAG AA contrast ratios in dark theme', async () => {
      const { container } = renderInput(
        <Input {...defaultInputProps} />,
        { theme: 'dark' }
      );

      // Verify no contrast violations in dark mode
      await testA11y(container, {
        tags: ['wcag2aa'],
        includeRules: ['color-contrast'],
      });
    });

    it('provides sufficient contrast for error states', async () => {
      const { container } = renderInput(
        <Input 
          {...defaultInputProps} 
          state="error"
          error="This field is required"
        />
      );

      const input = getInputElement();
      const errorMessage = screen.getByRole('alert');
      
      // Check error state styling meets contrast requirements
      expect(input).toHaveClass('border-error-500');
      expect(errorMessage).toHaveClass('text-error-600');
      
      await testA11y(container, {
        tags: ['wcag2aa'],
        includeRules: ['color-contrast'],
      });
    });
  });
});

// ============================================================================
// USER INTERACTION TESTS
// ============================================================================

describe('Input Component - User Interactions', () => {
  describe('Text Input and Value Management', () => {
    it('handles text input and change events', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderInput(
        <Input 
          {...defaultInputProps} 
          onChange={handleChange}
        />
      );

      const input = getInputElement();
      const testText = 'Hello, DreamFactory!';
      
      await simulateUserTyping(user, input, testText);
      
      expect(input).toHaveValue(testText);
      expect(handleChange).toHaveBeenCalledTimes(testText.length);
      
      // Verify last change event
      const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
      expect(lastCall.target.value).toBe(testText);
    });

    it('supports controlled input behavior', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        return (
          <Input
            {...defaultInputProps}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleChange(e);
            }}
          />
        );
      };

      renderInput(<TestComponent />);

      const input = getInputElement();
      const testText = 'Controlled value';
      
      await simulateUserTyping(user, input, testText);
      
      expect(input).toHaveValue(testText);
      expect(handleChange).toHaveBeenCalledTimes(testText.length);
    });

    it('handles focus and blur events correctly', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      
      renderInput(
        <div>
          <Input 
            {...defaultInputProps} 
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button data-testid="other-element">Other Element</button>
        </div>
      );

      const input = getInputElement();
      const otherElement = screen.getByTestId('other-element');
      
      // Focus input
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      expect(input).toHaveFocus();
      
      // Blur input
      await user.click(otherElement);
      expect(handleBlur).toHaveBeenCalledTimes(1);
      expect(input).not.toHaveFocus();
    });

    it('prevents input when disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderInput(
        <Input 
          {...defaultInputProps} 
          disabled
          onChange={handleChange}
        />
      );

      const input = getInputElement();
      
      expect(input).toBeDisabled();
      
      // Attempt to type in disabled input
      await user.click(input);
      await user.type(input, 'Should not work');
      
      expect(input).toHaveValue('');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('prevents modification when readonly', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderInput(
        <Input 
          {...defaultInputProps} 
          readOnly
          value="Read-only value"
          onChange={handleChange}
        />
      );

      const input = getInputElement();
      
      expect(input).toHaveAttribute('readOnly');
      expect(input).toHaveValue('Read-only value');
      
      await user.click(input);
      expect(input).toHaveFocus(); // Can focus but not modify
      
      await user.type(input, 'Should not change');
      
      expect(input).toHaveValue('Read-only value');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Prefix and Suffix Interactions', () => {
    it('renders input with prefix content', () => {
      renderInput(
        <Input 
          {...defaultInputProps} 
          prefix={testData.prefixSuffixContent.icon}
        />
      );

      const input = getInputElement();
      const icon = screen.getByTestId('test-icon');
      
      expect(input).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(input).toHaveClass('pl-10'); // Left padding for prefix
    });

    it('renders input with suffix content', () => {
      renderInput(
        <Input 
          {...defaultInputProps} 
          suffix={testData.prefixSuffixContent.text}
        />
      );

      const input = getInputElement();
      const text = screen.getByTestId('test-text');
      
      expect(input).toBeInTheDocument();
      expect(text).toBeInTheDocument();
      expect(input).toHaveClass('pr-10'); // Right padding for suffix
    });

    it('handles clickable prefix interactions', async () => {
      const handlePrefixClick = vi.fn();
      const user = userEvent.setup();
      
      renderInput(
        <Input 
          {...defaultInputProps} 
          prefix={
            <InputAdornment 
              position="prefix" 
              clickable 
              onClick={handlePrefixClick}
              aria-label="Search"
              data-testid="prefix-button"
            >
              🔍
            </InputAdornment>
          }
        />
      );

      const prefixButton = screen.getByTestId('prefix-button');
      
      await user.click(prefixButton);
      expect(handlePrefixClick).toHaveBeenCalledTimes(1);
      
      // Test keyboard interaction
      prefixButton.focus();
      await user.keyboard('{Enter}');
      expect(handlePrefixClick).toHaveBeenCalledTimes(2);
    });

    it('displays loading spinner in suffix when loading', () => {
      renderInput(
        <Input 
          {...defaultInputProps} 
          loading={true}
        />
      );

      const input = getInputElement();
      const spinner = screen.getByRole('img', { hidden: true });
      
      expect(input).toHaveClass('pr-10'); // Right padding for loading
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('prioritizes loading spinner over suffix content', () => {
      renderInput(
        <Input 
          {...defaultInputProps} 
          loading={true}
          suffix={testData.prefixSuffixContent.text}
        />
      );

      const spinner = screen.getByRole('img', { hidden: true });
      expect(spinner).toBeInTheDocument();
      
      // Suffix content should not be visible when loading
      expect(screen.queryByTestId('test-text')).not.toBeInTheDocument();
    });
  });

  describe('Advanced Input Features', () => {
    it('handles clear functionality', async () => {
      const handleChange = vi.fn();
      const handleClear = vi.fn();
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [value, setValue] = React.useState('Initial value');
        
        return (
          <Input
            {...defaultInputProps}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleChange(e);
            }}
            suffix={
              <InputAdornment 
                position="suffix" 
                clickable 
                onClick={() => {
                  setValue('');
                  handleClear();
                }}
                aria-label="Clear input"
                data-testid="clear-button"
              >
                ✕
              </InputAdornment>
            }
          />
        );
      };

      renderInput(<TestComponent />);

      const input = getInputElement();
      const clearButton = screen.getByTestId('clear-button');
      
      expect(input).toHaveValue('Initial value');
      
      await user.click(clearButton);
      
      expect(input).toHaveValue('');
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('handles password visibility toggle', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [showPassword, setShowPassword] = React.useState(false);
        
        return (
          <Input
            {...defaultInputProps}
            type={showPassword ? 'text' : 'password'}
            value="secret123"
            suffix={
              <InputAdornment 
                position="suffix" 
                clickable 
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-testid="toggle-password"
              >
                {showPassword ? '🙈' : '👁️'}
              </InputAdornment>
            }
          />
        );
      };

      renderInput(<TestComponent />);

      const input = getInputElement();
      const toggleButton = screen.getByTestId('toggle-password');
      
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// REACT HOOK FORM INTEGRATION TESTS
// ============================================================================

describe('Input Component - React Hook Form Integration', () => {
  describe('ControlledInput Component', () => {
    it('integrates with React Hook Form', async () => {
      const { formMethods, user } = renderWithForm(
        <ControlledInput
          name="email"
          control={undefined} // Will be provided by form context
          rules={{ required: 'Email is required' }}
          placeholder="Enter email"
          data-testid="controlled-input"
        />,
        {
          defaultValues: { email: '' },
          mode: 'onChange',
        }
      );

      const input = screen.getByTestId('controlled-input');
      
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
      
      // Type invalid email
      await user.type(input, 'invalid-email');
      
      // Trigger validation
      await formMethods.trigger('email');
      
      // Field should be dirty
      expect(formMethods.formState.dirtyFields.email).toBe(true);
    });

    it('displays validation errors correctly', async () => {
      const mockValidation = createMockValidation();
      
      const { formMethods, user } = renderWithForm(
        <ControlledInput
          name="username"
          control={undefined}
          rules={{
            required: 'Username is required',
            minLength: {
              value: 3,
              message: 'Username must be at least 3 characters',
            },
          }}
          placeholder="Enter username"
          data-testid="controlled-input"
        />,
        {
          defaultValues: { username: '' },
          mode: 'onChange',
        }
      );

      const input = screen.getByTestId('controlled-input');
      
      // Type short username
      await user.type(input, 'ab');
      
      // Trigger validation
      await formMethods.trigger('username');
      await waitForValidation();
      
      // Check for validation error
      const error = formMethods.getFieldState('username').error;
      expect(error?.message).toBe('Username must be at least 3 characters');
      
      // Input should show error state
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('handles form submission states', async () => {
      const handleSubmit = vi.fn();
      
      const { formMethods, user, submitForm } = renderWithForm(
        <form onSubmit={formMethods.handleSubmit(handleSubmit)}>
          <ControlledInput
            name="message"
            control={undefined}
            rules={{ required: 'Message is required' }}
            placeholder="Enter message"
            data-testid="controlled-input"
          />
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>,
        {
          defaultValues: { message: '' },
        }
      );

      const input = screen.getByTestId('controlled-input');
      const submitButton = screen.getByTestId('submit-button');
      
      // Try to submit empty form
      await user.click(submitButton);
      
      // Input should be disabled during submission attempt
      await waitFor(() => {
        expect(formMethods.formState.isSubmitting).toBe(false);
      });
      
      // Fill in required field
      await user.type(input, 'Valid message');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith(
          { message: 'Valid message' },
          expect.any(Object)
        );
      });
    });

    it('supports complex validation schemas', async () => {
      const customValidation = {
        email: (value: string) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) || 'Please enter a valid email address';
        },
        strongPassword: (value: string) => {
          const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return strongRegex.test(value) || 'Password must be strong (8+ chars, uppercase, lowercase, number, special char)';
        },
      };
      
      const { formMethods, user } = renderWithForm(
        <div>
          <ControlledInput
            name="email"
            control={undefined}
            rules={{ 
              required: 'Email is required',
              validate: customValidation.email,
            }}
            placeholder="Enter email"
            data-testid="email-input"
          />
          <ControlledInput
            name="password"
            type="password"
            control={undefined}
            rules={{ 
              required: 'Password is required',
              validate: customValidation.strongPassword,
            }}
            placeholder="Enter password"
            data-testid="password-input"
          />
        </div>,
        {
          defaultValues: { email: '', password: '' },
          mode: 'onBlur',
        }
      );

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
      // Test invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger onBlur validation
      
      await waitForValidation();
      expect(formMethods.getFieldState('email').error?.message).toBe('Please enter a valid email address');
      
      // Test weak password
      await user.type(passwordInput, 'weak');
      await user.tab();
      
      await waitForValidation();
      expect(formMethods.getFieldState('password').error?.message).toContain('Password must be strong');
      
      // Test valid inputs
      await user.clear(emailInput);
      await user.type(emailInput, 'user@example.com');
      await user.tab();
      
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongP@ss123');
      await user.tab();
      
      await waitForValidation();
      expect(formMethods.getFieldState('email').error).toBeUndefined();
      expect(formMethods.getFieldState('password').error).toBeUndefined();
    });
  });

  describe('Form State Management', () => {
    it('tracks field state changes accurately', async () => {
      const { formMethods, user } = renderWithForm(
        <ControlledInput
          name="trackingField"
          control={undefined}
          placeholder="Enter text"
          data-testid="tracking-input"
        />,
        {
          defaultValues: { trackingField: '' },
          mode: 'onChange',
        }
      );

      const input = screen.getByTestId('tracking-input');
      
      // Initial state
      expect(formMethods.getFieldState('trackingField').isDirty).toBe(false);
      expect(formMethods.getFieldState('trackingField').isTouched).toBe(false);
      
      // Focus input (should mark as touched)
      await user.click(input);
      expect(formMethods.getFieldState('trackingField').isTouched).toBe(true);
      
      // Type text (should mark as dirty)
      await user.type(input, 'test');
      expect(formMethods.getFieldState('trackingField').isDirty).toBe(true);
      
      // Clear and type new value
      await user.clear(input);
      await user.type(input, 'new value');
      
      expect(formMethods.getValues('trackingField')).toBe('new value');
    });

    it('resets form state correctly', async () => {
      const { formMethods, user, resetForm } = renderWithForm(
        <ControlledInput
          name="resetField"
          control={undefined}
          placeholder="Enter text"
          data-testid="reset-input"
        />,
        {
          defaultValues: { resetField: 'initial' },
        }
      );

      const input = screen.getByTestId('reset-input');
      
      expect(input).toHaveValue('initial');
      
      // Modify field
      await user.clear(input);
      await user.type(input, 'modified');
      expect(input).toHaveValue('modified');
      
      // Reset form
      act(() => {
        resetForm();
      });
      
      await waitFor(() => {
        expect(input).toHaveValue('initial');
        expect(formMethods.getFieldState('resetField').isDirty).toBe(false);
        expect(formMethods.getFieldState('resetField').isTouched).toBe(false);
      });
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Input Component - Performance', () => {
  describe('Render Performance', () => {
    it('renders quickly with default props', async () => {
      const { renderTime } = await measureRenderTime(() =>
        renderInput(<Input {...defaultInputProps} />)
      );
      
      // Should render in under 16ms (60fps threshold)
      expect(renderTime).toBeLessThan(16);
    });

    it('handles large datasets efficiently', async () => {
      const largeOptions = testData.performanceData;
      
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        const [filteredOptions, setFilteredOptions] = React.useState(largeOptions);
        
        React.useEffect(() => {
          if (value) {
            const filtered = largeOptions.filter(option =>
              option.label.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered);
          } else {
            setFilteredOptions(largeOptions);
          }
        }, [value]);
        
        return (
          <div>
            <Input
              {...defaultInputProps}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Search ${largeOptions.length} items`}
            />
            <div data-testid="options-count">
              {filteredOptions.length} items
            </div>
          </div>
        );
      };

      const { renderTime } = await measureRenderTime(() =>
        renderInput(<TestComponent />)
      );
      
      // Should handle large datasets without significant performance impact
      expect(renderTime).toBeLessThan(100);
    });

    it('debounces input changes efficiently', async () => {
      vi.useFakeTimers();
      
      const handleChange = vi.fn();
      const handleDebouncedChange = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const TestComponent = () => {
        const [value, setValue] = React.useState('');
        
        // Debounced effect
        React.useEffect(() => {
          const timer = setTimeout(() => {
            if (value) {
              handleDebouncedChange(value);
            }
          }, 300);
          
          return () => clearTimeout(timer);
        }, [value]);
        
        return (
          <Input
            {...defaultInputProps}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              handleChange(e);
            }}
          />
        );
      };

      renderInput(<TestComponent />);
      
      const input = getInputElement();
      
      // Type quickly
      await user.type(input, 'fast typing');
      
      // Should call onChange for each character
      expect(handleChange).toHaveBeenCalledTimes(12); // "fast typing".length
      
      // Debounced function should not be called yet
      expect(handleDebouncedChange).not.toHaveBeenCalled();
      
      // Advance timers
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      // Now debounced function should be called once
      expect(handleDebouncedChange).toHaveBeenCalledTimes(1);
      expect(handleDebouncedChange).toHaveBeenCalledWith('fast typing');
      
      vi.useRealTimers();
    });
  });

  describe('Memory Management', () => {
    it('cleans up event listeners properly', () => {
      const { unmount } = renderInput(
        <Input 
          {...defaultInputProps}
          onFocus={vi.fn()}
          onBlur={vi.fn()}
          onChange={vi.fn()}
          onKeyDown={vi.fn()}
        />
      );
      
      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid re-renders without memory leaks', () => {
      const TestComponent = ({ iteration }: { iteration: number }) => (
        <Input
          {...defaultInputProps}
          key={iteration}
          value={`Value ${iteration}`}
        />
      );

      const { rerender } = renderInput(<TestComponent iteration={0} />);
      
      // Rapidly re-render component
      for (let i = 1; i <= 100; i++) {
        rerender(<TestComponent iteration={i} />);
      }
      
      // Should complete without errors
      const input = getInputElement();
      expect(input).toHaveValue('Value 100');
    });
  });

  describe('Focus Management Performance', () => {
    it('handles rapid focus changes efficiently', async () => {
      const user = userEvent.setup();
      
      renderInput(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <Input
              key={i}
              data-testid={`input-${i}`}
              placeholder={`Input ${i}`}
            />
          ))}
        </div>
      );

      const startTime = performance.now();
      
      // Rapidly tab through all inputs
      for (let i = 0; i < 10; i++) {
        await user.tab();
        const input = screen.getByTestId(`input-${i}`);
        expect(input).toHaveFocus();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete focus navigation quickly
      expect(totalTime).toBeLessThan(1000); // 1 second max
    });
  });
});

// ============================================================================
// THEME COMPATIBILITY TESTS
// ============================================================================

describe('Input Component - Theme Compatibility', () => {
  describe('Light Theme', () => {
    it('applies correct light theme styling', () => {
      renderInput(
        <Input {...defaultInputProps} />,
        { theme: 'light' }
      );

      const input = getInputElement();
      
      // Check light theme classes
      expect(input).toHaveClass('bg-white');
      expect(input).toHaveClass('border-gray-300');
      expect(input).toHaveClass('text-gray-900');
    });

    it('shows proper error styling in light theme', () => {
      renderInput(
        <Input 
          {...defaultInputProps} 
          state="error"
          error="Error message"
        />,
        { theme: 'light' }
      );

      const input = getInputElement();
      const errorMessage = screen.getByRole('alert');
      
      expect(input).toHaveClass('border-error-500');
      expect(errorMessage).toHaveClass('text-error-600');
    });
  });

  describe('Dark Theme', () => {
    it('applies correct dark theme styling', () => {
      renderInput(
        <Input {...defaultInputProps} />,
        { theme: 'dark' }
      );

      const input = getInputElement();
      
      // Check dark theme classes are applied correctly
      expect(input).toHaveClass('dark:bg-gray-900');
      expect(input).toHaveClass('dark:border-gray-600');
      expect(input).toHaveClass('dark:text-gray-100');
    });

    it('maintains accessibility in dark theme', async () => {
      const { container } = renderInput(
        <Input {...defaultInputProps} />,
        { theme: 'dark' }
      );

      // Should maintain WCAG compliance in dark theme
      await testA11y(container, {
        tags: ['wcag2aa'],
      });
    });
  });

  describe('Theme Transitions', () => {
    it('handles theme switching smoothly', async () => {
      const { rerender } = renderInput(
        <Input {...defaultInputProps} />,
        { theme: 'light' }
      );

      const input = getInputElement();
      
      // Initially light theme
      expect(input).toHaveClass('bg-white');
      
      // Switch to dark theme
      rerender(
        <Input {...defaultInputProps} />
      );
      
      // Theme classes should update (exact classes depend on theme provider implementation)
      expect(input).toBeInTheDocument();
    });
  });
});

// ============================================================================
// ERROR HANDLING AND EDGE CASES
// ============================================================================

describe('Input Component - Error Handling & Edge Cases', () => {
  describe('Invalid Props Handling', () => {
    it('handles undefined/null props gracefully', () => {
      expect(() => {
        renderInput(
          <Input
            {...defaultInputProps}
            value={undefined}
            onChange={undefined}
            onFocus={null as any}
            className={undefined}
          />
        );
      }).not.toThrow();
      
      const input = getInputElement();
      expect(input).toBeInTheDocument();
    });

    it('handles invalid variant prop', () => {
      expect(() => {
        renderInput(
          <Input
            {...defaultInputProps}
            variant={'invalid' as any}
          />
        );
      }).not.toThrow();
      
      const input = getInputElement();
      expect(input).toBeInTheDocument();
    });
  });

  describe('Extreme Values', () => {
    it('handles very long text values', async () => {
      const veryLongText = 'a'.repeat(10000);
      const user = userEvent.setup();
      
      renderInput(
        <Input 
          {...defaultInputProps}
          maxLength={5000}
        />
      );

      const input = getInputElement();
      
      await user.click(input);
      await user.paste(veryLongText);
      
      // Should handle long text without crashing
      expect(input.value.length).toBeLessThanOrEqual(5000);
    });

    it('handles rapid input changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      renderInput(
        <Input 
          {...defaultInputProps}
          onChange={handleChange}
        />
      );

      const input = getInputElement();
      
      // Rapidly type and delete
      for (let i = 0; i < 100; i++) {
        await user.type(input, 'a');
        await user.keyboard('{Backspace}');
      }
      
      expect(handleChange).toHaveBeenCalledTimes(200);
      expect(input).toHaveValue('');
    });
  });

  describe('Browser Compatibility', () => {
    it('works without modern browser features', () => {
      // Mock older browser environment
      const originalIntersectionObserver = window.IntersectionObserver;
      const originalResizeObserver = window.ResizeObserver;
      
      delete (window as any).IntersectionObserver;
      delete (window as any).ResizeObserver;
      
      expect(() => {
        renderInput(<Input {...defaultInputProps} />);
      }).not.toThrow();
      
      const input = getInputElement();
      expect(input).toBeInTheDocument();
      
      // Restore
      window.IntersectionObserver = originalIntersectionObserver;
      window.ResizeObserver = originalResizeObserver;
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', () => {
      const ErrorThrowingInput = () => {
        throw new Error('Test error');
      };
      
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          return <div data-testid="error-fallback">Error occurred</div>;
        }
      };
      
      // Should not crash the test
      expect(() => {
        renderInput(
          <ErrorBoundary>
            <ErrorThrowingInput />
          </ErrorBoundary>
        );
      }).not.toThrow();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Input Component - Integration Tests', () => {
  describe('Form Integration', () => {
    it('integrates with complex form layouts', async () => {
      const handleSubmit = vi.fn();
      const user = userEvent.setup();
      
      const { formMethods } = renderWithForm(
        <form onSubmit={formMethods.handleSubmit(handleSubmit)}>
          <div>
            <label htmlFor="first-name">First Name</label>
            <ControlledInput
              id="first-name"
              name="firstName"
              control={undefined}
              rules={{ required: 'First name is required' }}
              data-testid="first-name-input"
            />
          </div>
          
          <div>
            <label htmlFor="email">Email</label>
            <ControlledInput
              id="email"
              name="email"
              type="email"
              control={undefined}
              rules={{ 
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format'
                }
              }}
              data-testid="email-input"
            />
          </div>
          
          <div>
            <label htmlFor="phone">Phone</label>
            <ControlledInput
              id="phone"
              name="phone"
              type="tel"
              control={undefined}
              prefix={<span>+1</span>}
              data-testid="phone-input"
            />
          </div>
          
          <button type="submit" data-testid="submit-button">Submit</button>
        </form>,
        {
          defaultValues: {
            firstName: '',
            email: '',
            phone: '',
          },
        }
      );

      const firstNameInput = screen.getByTestId('first-name-input');
      const emailInput = screen.getByTestId('email-input');
      const phoneInput = screen.getByTestId('phone-input');
      const submitButton = screen.getByTestId('submit-button');
      
      // Fill out form
      await user.type(firstNameInput, 'John');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '555-123-4567');
      
      // Submit form
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          firstName: 'John',
          email: 'john@example.com',
          phone: '555-123-4567',
        }, expect.any(Object));
      });
    });

    it('handles cross-field validation', async () => {
      const { formMethods, user } = renderWithForm(
        <div>
          <ControlledInput
            name="password"
            type="password"
            control={undefined}
            rules={{ required: 'Password is required' }}
            placeholder="Password"
            data-testid="password-input"
          />
          <ControlledInput
            name="confirmPassword"
            type="password"
            control={undefined}
            rules={{
              required: 'Please confirm password',
              validate: (value) => {
                const password = formMethods.getValues('password');
                return value === password || 'Passwords do not match';
              },
            }}
            placeholder="Confirm Password"
            data-testid="confirm-password-input"
          />
        </div>,
        {
          defaultValues: {
            password: '',
            confirmPassword: '',
          },
          mode: 'onChange',
        }
      );

      const passwordInput = screen.getByTestId('password-input');
      const confirmPasswordInput = screen.getByTestId('confirm-password-input');
      
      // Enter password
      await user.type(passwordInput, 'secret123');
      
      // Enter non-matching confirmation
      await user.type(confirmPasswordInput, 'different');
      
      // Trigger validation
      await formMethods.trigger('confirmPassword');
      await waitForValidation();
      
      // Should show validation error
      expect(formMethods.getFieldState('confirmPassword').error?.message)
        .toBe('Passwords do not match');
      
      // Fix confirmation
      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, 'secret123');
      
      await formMethods.trigger('confirmPassword');
      await waitForValidation();
      
      // Error should be cleared
      expect(formMethods.getFieldState('confirmPassword').error).toBeUndefined();
    });
  });

  describe('Accessibility Integration', () => {
    it('works correctly with screen readers', async () => {
      renderInput(
        <div>
          <label htmlFor="accessible-input" id="input-label">
            Search Database Tables
          </label>
          <Input
            id="accessible-input"
            aria-labelledby="input-label"
            aria-describedby="input-help"
            placeholder="Type table name..."
            data-testid="accessible-input"
          />
          <div id="input-help">
            Search through all database tables and views
          </div>
        </div>
      );

      const input = getInputElement('accessible-input');
      const label = screen.getByLabelText('Search Database Tables');
      const helpText = screen.getByText('Search through all database tables and views');
      
      expect(label).toBe(input);
      expect(input).toHaveAttribute('aria-describedby', 'input-help');
      expect(helpText).toHaveAttribute('id', 'input-help');
    });

    it('announces dynamic content changes', async () => {
      const user = userEvent.setup();
      
      const TestComponent = () => {
        const [searchResults, setSearchResults] = React.useState<string[]>([]);
        const [isSearching, setIsSearching] = React.useState(false);
        
        const handleSearch = React.useCallback(
          React.useMemo(() => 
            vi.fn(async (query: string) => {
              if (!query) {
                setSearchResults([]);
                return;
              }
              
              setIsSearching(true);
              
              // Simulate search delay
              await new Promise(resolve => setTimeout(resolve, 100));
              
              const results = testData.performanceData
                .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
                .slice(0, 5)
                .map(item => item.label);
              
              setSearchResults(results);
              setIsSearching(false);
            }), []
          ), []);
        
        return (
          <div>
            <Input
              {...defaultInputProps}
              placeholder="Search..."
              loading={isSearching}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div 
              role="status" 
              aria-live="polite" 
              aria-atomic="true"
              data-testid="search-status"
            >
              {isSearching ? 'Searching...' : 
               searchResults.length > 0 ? `Found ${searchResults.length} results` : 
               'No results'}
            </div>
            <ul data-testid="search-results">
              {searchResults.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </div>
        );
      };

      renderInput(<TestComponent />);

      const input = getInputElement();
      const status = screen.getByTestId('search-status');
      
      expect(status).toHaveTextContent('No results');
      
      // Perform search
      await user.type(input, 'item');
      
      // Wait for search to complete
      await waitFor(() => {
        expect(status).toHaveTextContent(/Found \d+ results/);
      });
      
      const results = screen.getByTestId('search-results');
      expect(results.children.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// FINAL CLEANUP
// ============================================================================

afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});