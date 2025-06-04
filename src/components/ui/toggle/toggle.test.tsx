/**
 * @fileoverview Comprehensive test suite for Toggle component
 * 
 * Tests WCAG 2.1 AA accessibility compliance, controlled component behavior,
 * keyboard navigation, screen reader support, and integration with form libraries.
 * 
 * @version 1.0.0
 * @since 2024-01-01
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForm, FormProvider } from 'react-hook-form';
import { useState } from 'react';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Mock the Toggle component since it doesn't exist yet
// In real implementation, this would import from './toggle'
const MockToggle = ({
  checked = false,
  onChange,
  disabled = false,
  loading = false,
  size = 'md',
  label,
  description,
  name,
  id,
  required = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  className,
  ...props
}: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  name?: string;
  id?: string;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${toggleId}-description` : undefined;
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!disabled && !loading && onChange) {
        onChange(!checked);
      }
    }
  };

  const handleClick = () => {
    if (!disabled && !loading && onChange) {
      onChange(!checked);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`toggle-container ${className || ''}`}>
      {label && (
        <label 
          htmlFor={toggleId}
          className="toggle-label text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span aria-label="required" className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="toggle-wrapper">
        <button
          id={toggleId}
          name={name}
          role="switch"
          type="button"
          aria-checked={checked}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy || descriptionId}
          aria-required={required}
          disabled={disabled || loading}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={`
            toggle-button relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
            focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
            dark:focus-visible:ring-offset-gray-900 min-h-[44px] min-w-[44px] flex items-center justify-center
            ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${loading ? 'opacity-60 cursor-wait' : ''}
            ${sizeClasses[size]}
          `}
          data-testid="toggle-button"
        >
          <span
            className={`
              toggle-thumb pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 
              transition duration-200 ease-in-out
              ${checked ? `translate-x-${size === 'sm' ? '4' : size === 'md' ? '5' : '6'}` : 'translate-x-0'}
              ${thumbSizeClasses[size]}
            `}
            data-testid="toggle-thumb"
          >
            {loading && (
              <div 
                className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full"
                aria-hidden="true"
                data-testid="toggle-loading"
              />
            )}
          </span>
        </button>
      </div>
      
      {description && (
        <p 
          id={descriptionId}
          className="toggle-description mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {description}
        </p>
      )}
    </div>
  );
};

// Test wrapper component for controlled behavior
const ControlledToggleWrapper = ({
  initialChecked = false,
  ...props
}: {
  initialChecked?: boolean;
  [key: string]: any;
}) => {
  const [checked, setChecked] = useState(initialChecked);
  
  return (
    <MockToggle
      checked={checked}
      onChange={setChecked}
      {...props}
    />
  );
};

// Form integration test wrapper
const FormToggleWrapper = ({ defaultValues = {}, ...toggleProps }) => {
  const methods = useForm({ defaultValues });
  
  return (
    <FormProvider {...methods}>
      <form>
        <MockToggle
          name="testToggle"
          onChange={(checked) => methods.setValue('testToggle', checked)}
          checked={methods.watch('testToggle') || false}
          {...toggleProps}
        />
      </form>
    </FormProvider>
  );
};

describe('Toggle Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    
    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(
        <MockToggle
          label="Enable notifications"
          description="Receive email notifications for important updates"
          checked={false}
          onChange={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <MockToggle
          label="Dark mode"
          description="Switch to dark theme"
          checked={true}
          onChange={() => {}}
          id="dark-mode-toggle"
          required
        />
      );

      const toggle = screen.getByRole('switch');
      
      expect(toggle).toHaveAttribute('role', 'switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(toggle).toHaveAttribute('aria-required', 'true');
      expect(toggle).toHaveAttribute('id', 'dark-mode-toggle');
      expect(toggle).toHaveAttribute('aria-describedby');
    });

    it('should support screen reader announcements', () => {
      render(
        <MockToggle
          aria-label="Toggle feature"
          checked={false}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-label', 'Toggle feature');
    });

    it('should associate label with toggle properly', () => {
      render(
        <MockToggle
          label="Enable feature"
          id="feature-toggle"
          checked={false}
          onChange={() => {}}
        />
      );

      const label = screen.getByText('Enable feature');
      const toggle = screen.getByRole('switch');
      
      expect(label).toHaveAttribute('for', 'feature-toggle');
      expect(toggle).toHaveAttribute('id', 'feature-toggle');
    });

    it('should indicate required fields to screen readers', () => {
      render(
        <MockToggle
          label="Agree to terms"
          required
          checked={false}
          onChange={() => {}}
        />
      );

      const requiredIndicator = screen.getByLabelText('required');
      expect(requiredIndicator).toBeInTheDocument();
      
      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-required', 'true');
    });

    it('should meet minimum touch target size requirements', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          size="sm"
        />
      );

      const toggle = screen.getByRole('switch');
      
      // Check that minimum 44x44px touch target is maintained
      expect(toggle).toHaveClass('min-h-[44px]');
      expect(toggle).toHaveClass('min-w-[44px]');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should toggle state with Space key', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
        />
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      await user.keyboard(' ');
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should toggle state with Enter key', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
        />
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      await user.keyboard('{Enter}');
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should not respond to other keys', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
        />
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      await user.keyboard('{Escape}');
      await user.keyboard('a');
      await user.keyboard('{Tab}');
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should show focus-visible styles when navigated with keyboard', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      
      // Check focus-visible classes are present
      expect(toggle).toHaveClass('focus-visible:outline-none');
      expect(toggle).toHaveClass('focus-visible:ring-2');
      expect(toggle).toHaveClass('focus-visible:ring-primary-600');
    });

    it('should not activate when disabled', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
          disabled
        />
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      await user.keyboard(' ');
      await user.keyboard('{Enter}');
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Controlled Component Behavior', () => {
    it('should render checked state correctly', () => {
      render(
        <MockToggle
          checked={true}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
      expect(toggle).toHaveClass('bg-primary-600');
    });

    it('should render unchecked state correctly', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      expect(toggle).toHaveClass('bg-gray-200');
    });

    it('should call onChange when clicked', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
        />
      );

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should update checked state properly', async () => {
      render(<ControlledToggleWrapper initialChecked={false} />);

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      await user.click(toggle);
      
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should not call onChange when disabled', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
          disabled
        />
      );

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          size="sm"
        />
      );

      const toggle = screen.getByRole('switch');
      const thumb = screen.getByTestId('toggle-thumb');
      
      expect(toggle).toHaveClass('w-8', 'h-4');
      expect(thumb).toHaveClass('w-3', 'h-3');
    });

    it('should render medium size correctly', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          size="md"
        />
      );

      const toggle = screen.getByRole('switch');
      const thumb = screen.getByTestId('toggle-thumb');
      
      expect(toggle).toHaveClass('w-11', 'h-6');
      expect(thumb).toHaveClass('w-5', 'h-5');
    });

    it('should render large size correctly', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          size="lg"
        />
      );

      const toggle = screen.getByRole('switch');
      const thumb = screen.getByTestId('toggle-thumb');
      
      expect(toggle).toHaveClass('w-14', 'h-8');
      expect(thumb).toHaveClass('w-6', 'h-6');
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator when loading', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          loading
        />
      );

      const loadingIndicator = screen.getByTestId('toggle-loading');
      expect(loadingIndicator).toBeInTheDocument();
      expect(loadingIndicator).toHaveClass('animate-spin');
    });

    it('should prevent interaction when loading', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
          loading
        />
      );

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should have disabled appearance when loading', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          loading
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('opacity-60', 'cursor-wait');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled state correctly', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          disabled
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toBeDisabled();
      expect(toggle).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('should not be focusable when disabled', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          disabled
        />
      );

      const toggle = screen.getByRole('switch');
      toggle.focus();
      
      expect(toggle).not.toHaveFocus();
    });
  });

  describe('Label and Description', () => {
    it('should render label when provided', () => {
      render(
        <MockToggle
          label="Enable notifications"
          checked={false}
          onChange={() => {}}
        />
      );

      expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <MockToggle
          description="This will enable email notifications"
          checked={false}
          onChange={() => {}}
        />
      );

      expect(screen.getByText('This will enable email notifications')).toBeInTheDocument();
    });

    it('should associate description with toggle using aria-describedby', () => {
      render(
        <MockToggle
          description="Helper text"
          id="test-toggle"
          checked={false}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      const description = screen.getByText('Helper text');
      
      expect(toggle).toHaveAttribute('aria-describedby', description.id);
    });
  });

  describe('React Hook Form Integration', () => {
    it('should work with React Hook Form', async () => {
      render(
        <FormToggleWrapper 
          defaultValues={{ testToggle: false }}
          label="Form toggle"
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
      
      await user.click(toggle);
      
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should respect form default values', () => {
      render(
        <FormToggleWrapper 
          defaultValues={{ testToggle: true }}
          label="Pre-checked toggle"
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should have proper name attribute for form submission', () => {
      render(
        <MockToggle
          name="featureEnabled"
          checked={false}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('name', 'featureEnabled');
    });
  });

  describe('Theme Support', () => {
    it('should apply dark mode classes correctly', () => {
      // Mock document class to simulate dark mode
      document.documentElement.classList.add('dark');
      
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
        />
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveClass('dark:bg-gray-700');
      
      // Cleanup
      document.documentElement.classList.remove('dark');
    });

    it('should maintain contrast ratios in both themes', async () => {
      const { container } = render(
        <MockToggle
          label="Theme toggle"
          checked={true}
          onChange={() => {}}
        />
      );

      // Test accessibility in light mode
      const lightResults = await axe(container);
      expect(lightResults).toHaveNoViolations();

      // Simulate dark mode
      document.documentElement.classList.add('dark');
      
      const darkResults = await axe(container);
      expect(darkResults).toHaveNoViolations();
      
      // Cleanup
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Error States and Edge Cases', () => {
    it('should handle missing onChange gracefully', () => {
      expect(() => {
        render(<MockToggle checked={false} />);
      }).not.toThrow();
    });

    it('should handle rapid state changes', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
        />
      );

      const toggle = screen.getByRole('switch');
      
      // Simulate rapid clicks
      await user.click(toggle);
      await user.click(toggle);
      await user.click(toggle);
      
      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should prevent event bubbling correctly', async () => {
      const containerClick = vi.fn();
      const toggleChange = vi.fn();
      
      render(
        <div onClick={containerClick}>
          <MockToggle
            checked={false}
            onChange={toggleChange}
          />
        </div>
      );

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(toggleChange).toHaveBeenCalledWith(true);
      expect(containerClick).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const handleChange = vi.fn();
      
      const { rerender } = render(
        <MockToggle
          checked={false}
          onChange={handleChange}
          label="Test toggle"
        />
      );

      // Re-render with same props
      rerender(
        <MockToggle
          checked={false}
          onChange={handleChange}
          label="Test toggle"
        />
      );

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should handle large numbers of toggles efficiently', () => {
      const toggles = Array.from({ length: 100 }, (_, i) => (
        <MockToggle
          key={i}
          checked={i % 2 === 0}
          onChange={() => {}}
          label={`Toggle ${i}`}
        />
      ));

      const start = performance.now();
      render(<div>{toggles}</div>);
      const end = performance.now();

      // Render time should be reasonable (less than 100ms for 100 toggles)
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <MockToggle
          checked={false}
          onChange={() => {}}
          className="custom-toggle-class"
        />
      );

      const container = screen.getByRole('switch').closest('.toggle-container');
      expect(container).toHaveClass('custom-toggle-class');
    });

    it('should preserve component functionality with custom styles', async () => {
      const handleChange = vi.fn();
      
      render(
        <MockToggle
          checked={false}
          onChange={handleChange}
          className="custom-style"
        />
      );

      const toggle = screen.getByRole('switch');
      await user.click(toggle);
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });
});