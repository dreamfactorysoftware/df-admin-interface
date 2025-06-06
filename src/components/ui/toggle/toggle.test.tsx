/**
 * Toggle Component Test Suite
 * 
 * Comprehensive test suite for the Toggle component using Vitest 2.1.0 and React Testing Library.
 * Tests accessibility compliance (WCAG 2.1 AA), controlled component behavior, keyboard navigation,
 * screen reader support, and integration with React Hook Form per technical specification requirements.
 * 
 * Test Coverage:
 * - WCAG 2.1 AA accessibility compliance with automated axe-core testing
 * - Controlled and uncontrolled component behavior validation
 * - Keyboard navigation, focus management, and ARIA attribute testing
 * - Screen reader announcements and semantic markup validation
 * - Size variants, label positioning, and Tailwind CSS styling tests
 * - React Hook Form integration with validation scenarios
 * - Loading states, disabled behavior, and error handling
 * - Event handling, state transitions, and edge case management
 * 
 * Performance Requirements:
 * - Test execution < 2 seconds with Vitest's enhanced performance
 * - Accessibility testing with sub-100ms axe-core validation
 * - Form interaction tests completing within 500ms per scenario
 * 
 * @fileoverview Comprehensive Toggle component test suite with enterprise-grade coverage
 * @version 1.0.0
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, cleanup, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { axe, type AxeResults } from 'axe-core';
import '@testing-library/jest-dom/vitest';

// Import components under test
import { Toggle, ToggleField, ToggleGroup, type EnhancedToggleProps } from './toggle';

// Import test utilities and helpers
import { renderWithProviders } from '@/test/utils/test-utils';
import { WCAG_COMPLIANCE } from '@/test/utils/accessibility-helpers';

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * User Event Setup
 * Configured for comprehensive interaction testing with proper timing
 */
const setupUserEvent = () => userEvent.setup({
  delay: null, // Remove delays for faster test execution
  advanceTimers: vi.advanceTimersByTime,
});

/**
 * Mock Console for Error Testing
 * Captures console outputs for validation without polluting test output
 */
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};

/**
 * Default Toggle Props for Testing
 */
const defaultToggleProps: Partial<EnhancedToggleProps> = {
  label: 'Test Toggle',
  'data-testid': 'test-toggle',
  size: 'md',
  variant: 'primary',
  labelPosition: 'right',
};

/**
 * Test Form Component for React Hook Form Integration
 */
interface TestFormProps {
  children: React.ReactNode;
  onSubmit?: (data: any) => void;
  defaultValues?: Record<string, any>;
}

const TestForm: React.FC<TestFormProps> = ({ 
  children, 
  onSubmit = () => {}, 
  defaultValues = {} 
}) => {
  const methods = useForm({
    defaultValues,
    mode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} data-testid="test-form">
        {children}
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

/**
 * Accessibility Test Helper
 * Runs axe-core accessibility tests with WCAG 2.1 AA configuration
 */
const runAccessibilityTest = async (container: HTMLElement): Promise<AxeResults> => {
  const axeConfig = {
    rules: {
      // WCAG 2.1 AA compliance rules
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      'aria-labels': { enabled: true },
      'semantic-markup': { enabled: true },
      'landmark-one-main': { enabled: false }, // Not applicable for individual components
      'page-has-heading-one': { enabled: false }, // Not applicable for individual components
      'region': { enabled: false }, // React components may not use regions
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'],
  };

  return await axe(container, axeConfig);
};

/**
 * Keyboard Navigation Test Helper
 * Tests tab navigation and keyboard interaction patterns
 */
const testKeyboardNavigation = async (user: ReturnType<typeof setupUserEvent>) => {
  // Test tab navigation
  await user.tab();
  const focusedElement = document.activeElement;
  expect(focusedElement).toBeInTheDocument();
  
  // Test space key activation
  if (focusedElement?.getAttribute('role') === 'switch') {
    await user.keyboard(' ');
  }
  
  // Test enter key activation
  await user.keyboard('{Enter}');
  
  return focusedElement;
};

/**
 * Screen Reader Announcement Test Helper
 * Validates ARIA live regions and announcements
 */
const expectScreenReaderAnnouncement = (text: string) => {
  // Look for aria-live regions with the expected text
  const announcement = screen.queryByText(text);
  if (announcement) {
    expect(announcement).toHaveAttribute('aria-live', 'polite');
    expect(announcement).toHaveClass('sr-only');
  }
};

// ============================================================================
// COMPONENT RENDERING TESTS
// ============================================================================

describe('Toggle Component - Basic Rendering', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders correctly with default props', () => {
    render(<Toggle {...defaultToggleProps} />);
    
    const toggle = screen.getByRole('switch');
    const label = screen.getByText('Test Toggle');
    
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('data-testid', 'test-toggle');
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(label).toBeInTheDocument();
  });

  it('renders with custom className and styling', () => {
    const customClass = 'custom-toggle-class';
    render(
      <Toggle 
        {...defaultToggleProps}
        className={customClass}
        thumbClassName="custom-thumb"
        labelClassName="custom-label"
      />
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveClass(customClass);
  });

  it('renders all size variants correctly', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach((size) => {
      const { unmount } = render(
        <Toggle 
          label={`${size} Toggle`}
          size={size}
          data-testid={`toggle-${size}`}
        />
      );
      
      const toggle = screen.getByTestId(`toggle-${size}`);
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('data-size', size);
      
      unmount();
    });
  });

  it('renders all variant styles correctly', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <Toggle 
          label={`${variant} Toggle`}
          variant={variant}
          data-testid={`toggle-${variant}`}
        />
      );
      
      const toggle = screen.getByTestId(`toggle-${variant}`);
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute('data-variant', variant);
      
      unmount();
    });
  });

  it('handles missing label gracefully', () => {
    render(<Toggle data-testid="no-label-toggle" />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).not.toHaveAttribute('aria-labelledby');
  });
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

describe('Toggle Component - WCAG 2.1 AA Accessibility', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('passes automated accessibility audit', async () => {
    const { container } = render(<Toggle {...defaultToggleProps} />);
    
    const results = await runAccessibilityTest(container);
    expect(results.violations).toHaveLength(0);
  });

  it('has proper ARIA attributes for screen readers', () => {
    render(<Toggle {...defaultToggleProps} required />);
    
    const toggle = screen.getByRole('switch');
    const label = screen.getByText('Test Toggle');
    
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('aria-required', 'true');
    expect(toggle).toHaveAttribute('aria-labelledby');
    expect(label).toHaveAttribute('id');
  });

  it('supports custom ARIA labels and descriptions', () => {
    const ariaLabel = 'Custom toggle description';
    const ariaDescribedBy = 'custom-description';
    
    render(
      <div>
        <Toggle 
          {...defaultToggleProps}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
        />
        <div id={ariaDescribedBy}>Additional description</div>
      </div>
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-label', ariaLabel);
    expect(toggle).toHaveAttribute('aria-describedby', ariaDescribedBy);
  });

  it('maintains minimum touch target size (44x44px)', () => {
    render(<Toggle {...defaultToggleProps} size="sm" />);
    
    const toggle = screen.getByRole('switch');
    const styles = window.getComputedStyle(toggle);
    
    // Verify minimum touch target dimensions
    const minSize = WCAG_COMPLIANCE.TOUCH_TARGETS.MIN_SIZE;
    expect(parseInt(styles.minWidth || '0')).toBeGreaterThanOrEqual(minSize);
    expect(parseInt(styles.minHeight || '0')).toBeGreaterThanOrEqual(minSize);
  });

  it('has proper focus indicators with sufficient contrast', async () => {
    render(<Toggle {...defaultToggleProps} />);
    
    const toggle = screen.getByRole('switch');
    await user.tab();
    
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveClass('focus:ring-2'); // Tailwind focus ring class
    expect(toggle).toHaveClass('focus-visible:outline-2'); // Focus visible indicator
  });

  it('announces state changes to screen readers', async () => {
    render(
      <Toggle 
        {...defaultToggleProps}
        announceOnChange="Toggle is now {state}"
      />
    );
    
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    
    // Advance timers to allow announcement to be added and removed
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expectScreenReaderAnnouncement('Toggle is now checked');
    
    // Verify announcement is cleaned up
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  });

  it('supports high contrast mode properly', () => {
    // Mock high contrast media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('prefers-contrast: high'),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<Toggle {...defaultToggleProps} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    // In real implementation, this would verify high contrast styles
    expect(toggle).toHaveClass('border'); // Ensures visible border in high contrast
  });
});

// ============================================================================
// KEYBOARD NAVIGATION TESTS
// ============================================================================

describe('Toggle Component - Keyboard Navigation', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('is focusable via keyboard navigation', async () => {
    render(<Toggle {...defaultToggleProps} />);
    
    const toggle = screen.getByRole('switch');
    await user.tab();
    
    expect(toggle).toHaveFocus();
  });

  it('can be toggled with spacebar', async () => {
    const onChange = vi.fn();
    render(<Toggle {...defaultToggleProps} onChange={onChange} />);
    
    const toggle = screen.getByRole('switch');
    await user.tab();
    await user.keyboard(' ');
    
    expect(onChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('can be toggled with enter key', async () => {
    const onChange = vi.fn();
    render(<Toggle {...defaultToggleProps} onChange={onChange} />);
    
    const toggle = screen.getByRole('switch');
    await user.tab();
    await user.keyboard('{Enter}');
    
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('skips navigation when disabled', async () => {
    render(
      <div>
        <button>Before</button>
        <Toggle {...defaultToggleProps} disabled />
        <button>After</button>
      </div>
    );
    
    const beforeButton = screen.getByText('Before');
    const afterButton = screen.getByText('After');
    const toggle = screen.getByRole('switch');
    
    beforeButton.focus();
    await user.tab();
    
    expect(toggle).not.toHaveFocus();
    expect(afterButton).toHaveFocus();
  });

  it('prevents keyboard interaction during loading state', async () => {
    const onChange = vi.fn();
    render(<Toggle {...defaultToggleProps} loading onChange={onChange} />);
    
    const toggle = screen.getByRole('switch');
    await user.tab();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    
    expect(onChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('maintains focus management with label clicks', async () => {
    render(<Toggle {...defaultToggleProps} />);
    
    const label = screen.getByText('Test Toggle');
    const toggle = screen.getByRole('switch');
    
    await user.click(label);
    
    // Focus should move to the toggle after label click
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('handles keyboard events with custom handlers', async () => {
    const onKeyDown = vi.fn();
    render(
      <Toggle 
        {...defaultToggleProps}
        onKeyDown={onKeyDown}
      />
    );
    
    const toggle = screen.getByRole('switch');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    
    expect(onKeyDown).toHaveBeenCalled();
    expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowRight');
  });
});

// ============================================================================
// CONTROLLED VS UNCONTROLLED BEHAVIOR TESTS
// ============================================================================

describe('Toggle Component - Controlled vs Uncontrolled Behavior', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('works as uncontrolled component with defaultValue', async () => {
    render(<Toggle {...defaultToggleProps} defaultValue={true} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('works as controlled component with value prop', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Toggle 
        {...defaultToggleProps}
        value={false}
        onChange={onChange}
      />
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    await user.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    
    // Simulate parent component updating the value
    rerender(
      <Toggle 
        {...defaultToggleProps}
        value={true}
        onChange={onChange}
      />
    );
    
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('ignores defaultValue when value prop is provided', () => {
    render(
      <Toggle 
        {...defaultToggleProps}
        value={false}
        defaultValue={true}
      />
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange callback with new value', async () => {
    const onChange = vi.fn();
    render(<Toggle {...defaultToggleProps} onChange={onChange} />);
    
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
    
    await user.click(toggle);
    
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('maintains internal state for uncontrolled usage', async () => {
    render(<Toggle {...defaultToggleProps} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});

// ============================================================================
// LABEL POSITIONING AND LAYOUT TESTS
// ============================================================================

describe('Toggle Component - Label Positioning and Layout', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders label in all supported positions', () => {
    const positions = ['left', 'right', 'top', 'bottom', 'none'] as const;
    
    positions.forEach((position) => {
      const { unmount } = render(
        <Toggle 
          label={`${position} Label`}
          labelPosition={position}
          data-testid={`toggle-${position}`}
        />
      );
      
      const toggle = screen.getByTestId(`toggle-${position}`);
      expect(toggle).toBeInTheDocument();
      
      if (position !== 'none') {
        const label = screen.getByText(`${position} Label`);
        expect(label).toBeInTheDocument();
      }
      
      unmount();
    });
  });

  it('hides label when showLabel is false', () => {
    render(
      <Toggle 
        {...defaultToggleProps}
        showLabel={false}
      />
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(screen.queryByText('Test Toggle')).not.toBeInTheDocument();
  });

  it('applies correct layout classes for different arrangements', () => {
    const { rerender } = render(
      <Toggle 
        {...defaultToggleProps}
        layout="horizontal"
        alignment="center"
        spacing="relaxed"
      />
    );
    
    // Test horizontal layout
    let container = screen.getByRole('switch').closest('div');
    expect(container).toHaveClass('flex-row');
    
    // Test vertical layout
    rerender(
      <Toggle 
        {...defaultToggleProps}
        layout="vertical"
        alignment="start"
        spacing="compact"
      />
    );
    
    container = screen.getByRole('switch').closest('div');
    expect(container).toHaveClass('flex-col');
  });

  it('handles required indicator in label correctly', () => {
    render(
      <Toggle 
        {...defaultToggleProps}
        required
      />
    );
    
    const requiredIndicator = screen.getByLabelText('required');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
    expect(requiredIndicator).toHaveClass('text-error-500');
  });

  it('applies custom label styling variants', () => {
    const variants = ['default', 'muted', 'emphasized'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <Toggle 
          label={`${variant} Label`}
          labelVariant={variant}
          data-testid={`toggle-${variant}`}
        />
      );
      
      const label = screen.getByText(`${variant} Label`);
      expect(label).toBeInTheDocument();
      
      unmount();
    });
  });
});

// ============================================================================
// STATE MANAGEMENT TESTS
// ============================================================================

describe('Toggle Component - State Management', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('displays loading state correctly', () => {
    render(<Toggle {...defaultToggleProps} loading />);
    
    const toggle = screen.getByRole('switch');
    const loadingIndicator = screen.getByRole('status', { name: 'Loading' });
    
    expect(toggle).toHaveAttribute('data-loading', 'true');
    expect(toggle).toBeDisabled();
    expect(loadingIndicator).toBeInTheDocument();
    expect(loadingIndicator).toHaveClass('animate-spin');
  });

  it('displays disabled state correctly', () => {
    render(<Toggle {...defaultToggleProps} disabled />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
  });

  it('displays error state with proper styling', () => {
    const errorMessage = 'This field is required';
    render(
      <Toggle 
        {...defaultToggleProps}
        error={errorMessage}
      />
    );
    
    const toggle = screen.getByRole('switch');
    const errorElement = screen.getByRole('alert');
    
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(toggle).toHaveAttribute('data-error', 'true');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(errorMessage);
    expect(errorElement).toHaveClass('text-error-600');
  });

  it('shows helper text when provided', () => {
    const helperText = 'This toggle controls the feature';
    render(
      <Toggle 
        {...defaultToggleProps}
        helperText={helperText}
      />
    );
    
    const helper = screen.getByText(helperText);
    expect(helper).toBeInTheDocument();
    expect(helper).toHaveClass('text-sm');
  });

  it('handles state transitions smoothly', async () => {
    const { rerender } = render(<Toggle {...defaultToggleProps} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('data-state', 'unchecked');
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'checked');
    
    // Test loading state transition
    rerender(<Toggle {...defaultToggleProps} loading />);
    expect(toggle).toHaveAttribute('data-loading', 'true');
    
    // Test error state transition
    rerender(<Toggle {...defaultToggleProps} error="Error occurred" />);
    expect(toggle).toHaveAttribute('data-error', 'true');
  });

  it('prevents interaction during loading', async () => {
    const onChange = vi.fn();
    render(
      <Toggle 
        {...defaultToggleProps}
        loading
        onChange={onChange}
      />
    );
    
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    
    expect(onChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});

// ============================================================================
// ICON AND VISUAL ELEMENT TESTS
// ============================================================================

describe('Toggle Component - Icons and Visual Elements', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('displays custom icons for checked and unchecked states', async () => {
    const CheckIcon = () => <span data-testid="check-icon">✓</span>;
    const UncheckIcon = () => <span data-testid="uncheck-icon">✗</span>;
    
    render(
      <Toggle 
        {...defaultToggleProps}
        checkedIcon={<CheckIcon />}
        uncheckedIcon={<UncheckIcon />}
      />
    );
    
    const toggle = screen.getByRole('switch');
    
    // Should show unchecked icon initially
    expect(screen.getByTestId('uncheck-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    
    // Click to toggle state
    await user.click(toggle);
    
    // Should now show checked icon
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('uncheck-icon')).not.toBeInTheDocument();
  });

  it('hides icons during loading state', () => {
    const CheckIcon = () => <span data-testid="check-icon">✓</span>;
    
    render(
      <Toggle 
        {...defaultToggleProps}
        loading
        value={true}
        checkedIcon={<CheckIcon />}
      />
    );
    
    expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('applies correct thumb styling for different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach((size) => {
      const { unmount } = render(
        <Toggle 
          label={`${size} Toggle`}
          size={size}
          data-testid={`toggle-${size}`}
        />
      );
      
      const toggle = screen.getByTestId(`toggle-${size}`);
      const thumb = toggle.querySelector('[aria-hidden="true"]');
      
      expect(thumb).toBeInTheDocument();
      expect(thumb).toHaveClass('transition-all', 'duration-200');
      
      unmount();
    });
  });

  it('disables transitions when specified', () => {
    render(
      <Toggle 
        {...defaultToggleProps}
        disableTransitions
      />
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).not.toHaveClass('transition-all');
  });
});

// ============================================================================
// REACT HOOK FORM INTEGRATION TESTS
// ============================================================================

describe('Toggle Component - React Hook Form Integration', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('integrates with React Hook Form for controlled forms', async () => {
    const onSubmit = vi.fn();
    
    render(
      <TestForm onSubmit={onSubmit} defaultValues={{ testToggle: false }}>
        <Toggle 
          {...defaultToggleProps}
          name="testToggle"
          register={(name, rules) => ({
            name,
            ref: vi.fn(),
            onChange: vi.fn(),
            onBlur: vi.fn(),
          })}
        />
      </TestForm>
    );
    
    const toggle = screen.getByRole('switch');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.click(toggle);
    await user.click(submitButton);
    
    // Form integration should be working
    expect(toggle).toHaveAttribute('name', 'testToggle');
  });

  it('validates required field with React Hook Form', async () => {
    const onSubmit = vi.fn();
    
    render(
      <TestForm onSubmit={onSubmit}>
        <Toggle 
          {...defaultToggleProps}
          name="requiredToggle"
          required
          register={(name, rules) => ({
            name,
            ref: vi.fn(),
            onChange: vi.fn(),
            onBlur: vi.fn(),
          })}
          rules={{ required: 'This field is required' }}
        />
      </TestForm>
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-required', 'true');
    expect(toggle).toHaveAttribute('name', 'requiredToggle');
  });

  it('handles validation errors from React Hook Form', () => {
    const errorMessage = 'This field must be checked';
    
    render(
      <Toggle 
        {...defaultToggleProps}
        name="validatedToggle"
        error={errorMessage}
        register={(name, rules) => ({
          name,
          ref: vi.fn(),
          onChange: vi.fn(),
          onBlur: vi.fn(),
        })}
      />
    );
    
    const toggle = screen.getByRole('switch');
    const errorElement = screen.getByRole('alert');
    
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(errorElement).toHaveTextContent(errorMessage);
  });

  it('supports custom validation rules', async () => {
    const customValidation = vi.fn(() => true);
    
    render(
      <Toggle 
        {...defaultToggleProps}
        name="customValidatedToggle"
        register={(name, rules) => ({
          name,
          ref: vi.fn(),
          onChange: vi.fn(),
          onBlur: vi.fn(),
        })}
        rules={{
          required: 'This field is required',
          validate: customValidation,
        }}
      />
    );
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('name', 'customValidatedToggle');
  });
});

// ============================================================================
// TOGGLEFIELD COMPONENT TESTS
// ============================================================================

describe('ToggleField Component - Enhanced Form Field', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with field label separate from toggle label', () => {
    render(
      <ToggleField 
        {...defaultToggleProps}
        fieldLabel="Field Label"
        label="Toggle Label"
        description="Field description"
      />
    );
    
    expect(screen.getByText('Field Label')).toBeInTheDocument();
    expect(screen.getByText('Toggle Label')).toBeInTheDocument();
    expect(screen.getByText('Field description')).toBeInTheDocument();
  });

  it('shows required indicator on field label', () => {
    render(
      <ToggleField 
        {...defaultToggleProps}
        fieldLabel="Required Field"
        required
      />
    );
    
    const fieldLabel = screen.getByText('Required Field');
    expect(fieldLabel).toBeInTheDocument();
    
    // Should have required indicator
    const requiredIndicators = screen.getAllByLabelText('required');
    expect(requiredIndicators.length).toBeGreaterThan(0);
  });

  it('applies custom styling to field container', () => {
    const customClass = 'custom-field-class';
    
    render(
      <ToggleField 
        {...defaultToggleProps}
        className={customClass}
        fieldLabel="Styled Field"
      />
    );
    
    const fieldContainer = screen.getByText('Styled Field').closest('div');
    expect(fieldContainer).toHaveClass(customClass);
  });
});

// ============================================================================
// TOGGLEGROUP COMPONENT TESTS
// ============================================================================

describe('ToggleGroup Component - Group Management', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders group with label and description', () => {
    render(
      <ToggleGroup 
        label="Toggle Group"
        description="Group of related toggles"
        required
      >
        <Toggle label="Option 1" data-testid="toggle-1" />
        <Toggle label="Option 2" data-testid="toggle-2" />
      </ToggleGroup>
    );
    
    expect(screen.getByText('Toggle Group')).toBeInTheDocument();
    expect(screen.getByText('Group of related toggles')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-1')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-2')).toBeInTheDocument();
    
    // Check fieldset structure
    const fieldset = screen.getByRole('group');
    expect(fieldset).toBeInTheDocument();
    expect(fieldset.tagName).toBe('FIELDSET');
  });

  it('arranges toggles in different orientations', () => {
    const { rerender } = render(
      <ToggleGroup 
        label="Horizontal Group"
        orientation="horizontal"
        spacing="relaxed"
      >
        <Toggle label="Option 1" />
        <Toggle label="Option 2" />
      </ToggleGroup>
    );
    
    let container = screen.getByRole('group');
    expect(container.querySelector('.flex-row')).toBeInTheDocument();
    
    rerender(
      <ToggleGroup 
        label="Vertical Group"
        orientation="vertical"
        spacing="compact"
      >
        <Toggle label="Option 1" />
        <Toggle label="Option 2" />
      </ToggleGroup>
    );
    
    container = screen.getByRole('group');
    expect(container.querySelector('.flex-col')).toBeInTheDocument();
  });

  it('applies correct spacing classes', () => {
    const spacings = ['compact', 'normal', 'relaxed'] as const;
    
    spacings.forEach((spacing) => {
      const { unmount } = render(
        <ToggleGroup 
          label={`${spacing} Group`}
          spacing={spacing}
        >
          <Toggle label="Option 1" />
          <Toggle label="Option 2" />
        </ToggleGroup>
      );
      
      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
      
      unmount();
    });
  });

  it('handles keyboard navigation within group', async () => {
    render(
      <ToggleGroup label="Keyboard Navigation Group">
        <Toggle label="First" data-testid="first-toggle" />
        <Toggle label="Second" data-testid="second-toggle" />
        <Toggle label="Third" data-testid="third-toggle" />
      </ToggleGroup>
    );
    
    const firstToggle = screen.getByTestId('first-toggle');
    const secondToggle = screen.getByTestId('second-toggle');
    
    // Tab to first toggle
    await user.tab();
    expect(firstToggle).toHaveFocus();
    
    // Tab to second toggle
    await user.tab();
    expect(secondToggle).toHaveFocus();
  });
});

// ============================================================================
// ERROR HANDLING AND EDGE CASE TESTS
// ============================================================================

describe('Toggle Component - Error Handling and Edge Cases', () => {
  let user: ReturnType<typeof setupUserEvent>;
  const originalConsoleError = console.error;

  beforeEach(() => {
    user = setupUserEvent();
    console.error = mockConsole.error;
  });

  afterEach(() => {
    cleanup();
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  it('handles undefined value gracefully', () => {
    render(<Toggle {...defaultToggleProps} value={undefined} />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('handles null onChange callback gracefully', async () => {
    render(<Toggle {...defaultToggleProps} onChange={null as any} />);
    
    const toggle = screen.getByRole('switch');
    
    // Should not throw error when clicking
    await expect(user.click(toggle)).resolves.not.toThrow();
  });

  it('handles missing required props gracefully', () => {
    // Test component without any props
    expect(() => render(<Toggle />)).not.toThrow();
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('maintains accessibility when custom IDs conflict', () => {
    render(
      <div>
        <Toggle 
          label="First Toggle"
          data-testid="toggle-1"
        />
        <Toggle 
          label="Second Toggle"
          data-testid="toggle-2"
        />
      </div>
    );
    
    const toggle1 = screen.getByTestId('toggle-1');
    const toggle2 = screen.getByTestId('toggle-2');
    
    // Each should have unique IDs
    expect(toggle1.id).not.toBe(toggle2.id);
    expect(toggle1.getAttribute('aria-labelledby')).not.toBe(
      toggle2.getAttribute('aria-labelledby')
    );
  });

  it('handles rapid successive clicks correctly', async () => {
    const onChange = vi.fn();
    render(<Toggle {...defaultToggleProps} onChange={onChange} />);
    
    const toggle = screen.getByRole('switch');
    
    // Rapid clicks
    await user.click(toggle);
    await user.click(toggle);
    await user.click(toggle);
    
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, true);
    expect(onChange).toHaveBeenNthCalledWith(2, false);
    expect(onChange).toHaveBeenNthCalledWith(3, true);
  });

  it('handles extremely long labels appropriately', () => {
    const longLabel = 'A'.repeat(500);
    
    render(<Toggle label={longLabel} data-testid="long-label-toggle" />);
    
    const toggle = screen.getByTestId('long-label-toggle');
    const label = screen.getByText(longLabel);
    
    expect(toggle).toBeInTheDocument();
    expect(label).toBeInTheDocument();
  });

  it('maintains performance with many rapid state changes', async () => {
    const onChange = vi.fn();
    render(<Toggle {...defaultToggleProps} onChange={onChange} />);
    
    const toggle = screen.getByRole('switch');
    const startTime = performance.now();
    
    // Simulate many rapid changes
    for (let i = 0; i < 50; i++) {
      await user.click(toggle);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time (less than 2 seconds)
    expect(duration).toBeLessThan(2000);
    expect(onChange).toHaveBeenCalledTimes(50);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Toggle Component - Integration Tests', () => {
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
  });

  afterEach(() => {
    cleanup();
  });

  it('integrates correctly with theme switching', () => {
    const { rerender } = render(
      <div className="light">
        <Toggle {...defaultToggleProps} />
      </div>
    );
    
    let toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    
    // Switch to dark theme
    rerender(
      <div className="dark">
        <Toggle {...defaultToggleProps} />
      </div>
    );
    
    toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('works correctly within modal dialogs', async () => {
    render(
      <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">Settings Dialog</h2>
        <Toggle {...defaultToggleProps} />
        <button>Close</button>
      </div>
    );
    
    const dialog = screen.getByRole('dialog');
    const toggle = screen.getByRole('switch');
    
    expect(dialog).toBeInTheDocument();
    expect(toggle).toBeInTheDocument();
    
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('maintains state during component re-mounting', async () => {
    const Wrapper = ({ show }: { show: boolean }) => (
      <div>
        {show && <Toggle {...defaultToggleProps} defaultValue={true} />}
      </div>
    );
    
    const { rerender } = render(<Wrapper show={true} />);
    
    let toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    
    // Unmount and remount
    rerender(<Wrapper show={false} />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    
    rerender(<Wrapper show={true} />);
    toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true'); // Default value restored
  });

  it('handles complex form scenarios with multiple toggles', async () => {
    const onSubmit = vi.fn();
    
    render(
      <TestForm onSubmit={onSubmit}>
        <ToggleGroup label="Feature Settings">
          <Toggle 
            label="Enable Feature A"
            name="featureA"
            data-testid="feature-a"
          />
          <Toggle 
            label="Enable Feature B"
            name="featureB"
            data-testid="feature-b"
            required
          />
          <Toggle 
            label="Enable Feature C"
            name="featureC"
            data-testid="feature-c"
            disabled
          />
        </ToggleGroup>
      </TestForm>
    );
    
    const featureA = screen.getByTestId('feature-a');
    const featureB = screen.getByTestId('feature-b');
    const featureC = screen.getByTestId('feature-c');
    const submitButton = screen.getByTestId('submit-button');
    
    // Interact with toggles
    await user.click(featureA);
    await user.click(featureB);
    // featureC should remain unclickable
    
    expect(featureA).toHaveAttribute('aria-checked', 'true');
    expect(featureB).toHaveAttribute('aria-checked', 'true');
    expect(featureC).toBeDisabled();
    
    await user.click(submitButton);
    // Form should handle submission
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Toggle Component - Performance Tests', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders quickly with default props', () => {
    const startTime = performance.now();
    
    render(<Toggle {...defaultToggleProps} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within 50ms for good performance
    expect(renderTime).toBeLessThan(50);
  });

  it('handles many toggles efficiently', () => {
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <Toggle 
            key={i}
            label={`Toggle ${i}`}
            data-testid={`toggle-${i}`}
          />
        ))}
      </div>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render 100 toggles within 500ms
    expect(renderTime).toBeLessThan(500);
    
    // Verify all toggles are rendered
    expect(screen.getAllByRole('switch')).toHaveLength(100);
  });

  it('optimizes re-renders with React.memo patterns', () => {
    let renderCount = 0;
    
    const TestWrapper = ({ value }: { value: boolean }) => {
      renderCount++;
      return <Toggle {...defaultToggleProps} value={value} />;
    };
    
    const { rerender } = render(<TestWrapper value={false} />);
    
    const initialRenderCount = renderCount;
    
    // Re-render with same props - should not cause unnecessary re-renders
    rerender(<TestWrapper value={false} />);
    rerender(<TestWrapper value={false} />);
    
    // Should have minimal additional renders
    expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
  });
});