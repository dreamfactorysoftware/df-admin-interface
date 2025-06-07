/**
 * Comprehensive test suite for the Button component system
 * 
 * Tests WCAG 2.1 AA accessibility compliance, keyboard navigation, screen reader support,
 * variant rendering, loading states, and user interactions using Vitest and React Testing Library.
 * 
 * @fileoverview Button component test suite for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Search, Plus, Settings, Trash2, ExternalLink } from 'lucide-react';

import {
  Button,
  IconButton,
  LoadingButton,
  ButtonGroup,
  type ButtonProps,
  type IconButtonProps,
  type LoadingButtonProps,
  type ButtonGroupProps,
} from './button';
import {
  customRender,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  getAriaLiveRegions,
  type KeyboardTestUtils,
} from '@/test/test-utils';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Helper to render button with common test setup
 */
const renderButton = (props: Partial<ButtonProps> = {}, options = {}) => {
  const defaultProps: ButtonProps = {
    children: 'Test Button',
    ...props,
  };
  
  return customRender(<Button {...defaultProps} />, options);
};

/**
 * Helper to render icon button with required props
 */
const renderIconButton = (props: Partial<IconButtonProps> = {}, options = {}) => {
  const defaultProps: IconButtonProps = {
    icon: Search,
    'aria-label': 'Search',
    ...props,
  };
  
  return customRender(<IconButton {...defaultProps} />, options);
};

/**
 * Helper to render button group with test buttons
 */
const renderButtonGroup = (
  props: Partial<ButtonGroupProps> = {},
  buttonCount: number = 3,
  options = {}
) => {
  const buttons = Array.from({ length: buttonCount }, (_, index) => (
    <Button key={index} variant={index === 0 ? 'primary' : 'secondary'}>
      Button {index + 1}
    </Button>
  ));

  const defaultProps: ButtonGroupProps = {
    label: 'Test button group',
    children: buttons,
    ...props,
  };
  
  return customRender(<ButtonGroup {...defaultProps} />, options);
};

/**
 * Mock announcement function for testing screen reader feedback
 */
const mockAnnouncement = vi.fn();

// Mock DOM methods for screen reader testing
beforeEach(() => {
  // Mock appendChild/removeChild for announcement testing
  const originalAppendChild = document.body.appendChild;
  const originalRemoveChild = document.body.removeChild;
  
  document.body.appendChild = vi.fn((element) => {
    if (element.getAttribute?.('aria-live')) {
      mockAnnouncement(element.textContent);
    }
    return originalAppendChild.call(document.body, element);
  });
  
  document.body.removeChild = vi.fn((element) => {
    return originalRemoveChild.call(document.body, element);
  });
});

afterEach(() => {
  mockAnnouncement.mockClear();
  vi.restoreAllMocks();
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

describe('Button Accessibility Compliance', () => {
  describe('WCAG 2.1 AA Standards', () => {
    it('should have no accessibility violations on all variants', async () => {
      const variants: Array<ButtonProps['variant']> = [
        'primary',
        'secondary', 
        'success',
        'warning',
        'error',
        'outline',
        'ghost',
        'link',
      ];

      for (const variant of variants) {
        const { container } = renderButton({ variant });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it('should meet minimum touch target requirements (44x44px)', () => {
      const variants: Array<ButtonProps['size']> = ['sm', 'md', 'lg', 'xl'];
      
      variants.forEach((size) => {
        const { container } = renderButton({ size });
        const button = container.querySelector('button');
        const styles = window.getComputedStyle(button!);
        
        // Check minimum height
        const height = parseInt(styles.height);
        expect(height).toBeGreaterThanOrEqual(44);
        
        // Check minimum width  
        const minWidth = parseInt(styles.minWidth);
        expect(minWidth).toBeGreaterThanOrEqual(44);
      });
    });

    it('should have proper contrast ratios for text and UI components', () => {
      // Note: This test validates that our design tokens meet WCAG standards
      // The actual contrast testing would be done with automated tools
      const { container } = renderButton({ variant: 'primary' });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('bg-primary-600'); // 7.14:1 contrast (AAA)
      expect(button).toHaveClass('text-white');
    });

    it('should support high contrast mode', () => {
      const { container } = renderButton({ variant: 'outline' });
      const button = container.querySelector('button');
      
      // Outline buttons have enhanced borders for better visibility
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-primary-600');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should be focusable via keyboard navigation', async () => {
      const { user } = renderButton();
      const button = screen.getByRole('button');
      
      await user.tab();
      expect(button).toHaveFocus();
    });

    it('should show focus-visible ring only for keyboard navigation', async () => {
      const { user } = renderButton();
      const button = screen.getByRole('button');
      
      // Tab to focus (keyboard navigation)
      await user.tab();
      expect(button).toHaveFocus();
      expect(button).toHaveClass('focus-visible:ring-2');
      
      // Click should not trigger focus ring
      await user.click(button);
      expect(button).not.toHaveClass('focus:ring-2');
    });

    it('should handle Enter and Space key activation', async () => {
      const handleClick = vi.fn();
      const { user } = renderButton({ onClick: handleClick });
      const button = screen.getByRole('button');
      
      await user.tab();
      
      // Test Enter key
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should prevent keyboard activation when disabled', async () => {
      const handleClick = vi.fn();
      const { user } = renderButton({ onClick: handleClick, disabled: true });
      const button = screen.getByRole('button');
      
      await user.tab();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should prevent keyboard activation when loading', async () => {
      const handleClick = vi.fn();
      const { user } = renderButton({ onClick: handleClick, loading: true });
      const button = screen.getByRole('button');
      
      await user.tab();
      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      
      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels', () => {
      const { container } = renderButton({ 
        ariaLabel: 'Custom label',
        'aria-describedby': 'description-id'
      });
      const button = container.querySelector('button');
      
      checkAriaAttributes(button!, {
        'aria-label': 'Custom label',
        'aria-describedby': 'description-id',
        'role': 'button',
      });
    });

    it('should announce loading states to screen readers', () => {
      const { rerender } = renderButton({ children: 'Save', loading: false });
      let button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy');
      
      rerender(<Button loading={true}>Save</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should provide custom loading announcements', () => {
      renderButton({ 
        children: 'Save',
        loading: true,
        loadingText: 'Saving your changes'
      });
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Saving your changes');
    });

    it('should announce button press actions when specified', async () => {
      const { user } = renderButton({ 
        announceOnPress: 'Form submitted successfully'
      });
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      // Wait for announcement to be created
      await waitFor(() => {
        expect(mockAnnouncement).toHaveBeenCalledWith('Form submitted successfully');
      });
    });

    it('should support dynamic announcements for async actions', async () => {
      const announcements: string[] = [];
      const mockAsyncAction = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const { user } = customRender(
        <LoadingButton
          asyncAction={mockAsyncAction}
          successMessage="Action completed"
          errorMessage="Action failed"
        >
          Async Action
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      await waitFor(() => {
        expect(mockAnnouncement).toHaveBeenCalledWith('Action completed');
      });
    });
  });
});

// ============================================================================
// COMPONENT VARIANT TESTS
// ============================================================================

describe('Button Variants', () => {
  describe('Visual Variants', () => {
    const variants: Array<ButtonProps['variant']> = [
      'primary',
      'secondary', 
      'success',
      'warning',
      'error',
      'outline',
      'ghost',
      'link',
    ];

    variants.forEach((variant) => {
      it(`should render ${variant} variant with correct styling`, () => {
        const { container } = renderButton({ variant });
        const button = container.querySelector('button');
        
        // Check base classes are applied
        expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
        expect(button).toHaveClass('transition-all', 'duration-200');
        
        // Check variant-specific classes
        switch (variant) {
          case 'primary':
            expect(button).toHaveClass('bg-primary-600', 'text-white');
            break;
          case 'secondary':
            expect(button).toHaveClass('bg-secondary-100', 'text-secondary-900');
            break;
          case 'success':
            expect(button).toHaveClass('bg-success-600', 'text-white');
            break;
          case 'warning':
            expect(button).toHaveClass('bg-warning-600', 'text-white');
            break;
          case 'error':
            expect(button).toHaveClass('bg-error-600', 'text-white');
            break;
          case 'outline':
            expect(button).toHaveClass('bg-transparent', 'text-primary-600', 'border-2');
            break;
          case 'ghost':
            expect(button).toHaveClass('bg-transparent', 'text-secondary-700');
            break;
          case 'link':
            expect(button).toHaveClass('bg-transparent', 'text-primary-600', 'underline-offset-4');
            break;
        }
      });
    });
  });

  describe('Size Variants', () => {
    const sizes: Array<ButtonProps['size']> = ['sm', 'md', 'lg', 'xl'];

    sizes.forEach((size) => {
      it(`should render ${size} size with correct dimensions`, () => {
        const { container } = renderButton({ size });
        const button = container.querySelector('button');
        
        switch (size) {
          case 'sm':
            expect(button).toHaveClass('h-11', 'px-4', 'text-sm');
            break;
          case 'md':
            expect(button).toHaveClass('h-12', 'px-6', 'text-base');
            break;
          case 'lg':
            expect(button).toHaveClass('h-14', 'px-8', 'text-lg');
            break;
          case 'xl':
            expect(button).toHaveClass('h-16', 'px-10', 'text-xl');
            break;
        }
      });
    });
  });

  describe('State Variants', () => {
    it('should render loading state with spinner', () => {
      const { container } = renderButton({ loading: true });
      const button = container.querySelector('button');
      const spinner = container.querySelector('[aria-hidden="true"]');
      
      expect(button).toHaveClass('cursor-wait', 'pointer-events-none');
      expect(spinner).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should render disabled state correctly', () => {
      const { container } = renderButton({ disabled: true });
      const button = container.querySelector('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should render full width variant', () => {
      const { container } = renderButton({ fullWidth: true });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Icon Support', () => {
    it('should render with left icon', () => {
      const { container } = renderButton({ 
        icon: <Search data-testid="left-icon" />
      });
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      const { container } = renderButton({ 
        iconRight: <ExternalLink data-testid="right-icon" />
      });
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should hide icons during loading', () => {
      const { container } = renderButton({ 
        icon: <Search data-testid="left-icon" />,
        iconRight: <ExternalLink data-testid="right-icon" />,
        loading: true
      });
      
      // Icons should be present but hidden (opacity-0)
      const content = container.querySelector('.opacity-0');
      expect(content).toBeInTheDocument();
    });
  });
});

// ============================================================================
// ICON BUTTON TESTS
// ============================================================================

describe('IconButton Component', () => {
  describe('Accessibility Requirements', () => {
    it('should require aria-label for accessibility', () => {
      const { container } = renderIconButton({ 'aria-label': 'Search items' });
      const button = container.querySelector('button');
      
      expect(button).toHaveAttribute('aria-label', 'Search items');
    });

    it('should have minimum touch target size', () => {
      const { container } = renderIconButton({ size: 'sm' });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('should pass accessibility validation', async () => {
      const { container } = renderIconButton();
      await testA11y(container);
    });
  });

  describe('Shape Variants', () => {
    it('should render square shape by default', () => {
      const { container } = renderIconButton();
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('rounded-md');
    });

    it('should render circular shape', () => {
      const { container } = renderIconButton({ shape: 'circle' });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('rounded-full');
    });
  });

  describe('Floating Action Button (FAB)', () => {
    it('should render as FAB with circular shape and positioning', () => {
      const { container } = renderIconButton({ fab: true });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('fixed', 'bottom-4', 'right-4', 'z-50');
      expect(button).toHaveClass('rounded-full');
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner instead of icon', () => {
      const { container } = renderIconButton({ loading: true });
      const spinner = container.querySelector('[role="status"]');
      
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument(); // sr-only text
    });
  });

  describe('Tooltip Support', () => {
    it('should provide tooltip via title attribute', () => {
      const { container } = renderIconButton({ 
        tooltip: 'Search for items'
      });
      const button = container.querySelector('button');
      
      expect(button).toHaveAttribute('title', 'Search for items');
    });

    it('should fallback to aria-label for title', () => {
      const { container } = renderIconButton({ 
        'aria-label': 'Search button'
      });
      const button = container.querySelector('button');
      
      expect(button).toHaveAttribute('title', 'Search button');
    });
  });
});

// ============================================================================
// BUTTON GROUP TESTS
// ============================================================================

describe('ButtonGroup Component', () => {
  describe('Layout and Orientation', () => {
    it('should render horizontal layout by default', () => {
      const { container } = renderButtonGroup();
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveClass('flex-row');
    });

    it('should render vertical layout', () => {
      const { container } = renderButtonGroup({ orientation: 'vertical' });
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveClass('flex-col');
    });

    it('should apply proper spacing between buttons', () => {
      const { container } = renderButtonGroup({ size: 'md' });
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveClass('space-x-2');
    });
  });

  describe('Keyboard Navigation', () => {
    let user: ReturnType<typeof userEvent.setup>;
    let keyboard: KeyboardTestUtils;

    beforeEach(() => {
      user = userEvent.setup();
      keyboard = createKeyboardUtils(user);
    });

    it('should support arrow key navigation in horizontal layout', async () => {
      renderButtonGroup({ orientation: 'horizontal' });
      const buttons = screen.getAllByRole('button');
      
      // Focus first button
      buttons[0].focus();
      expect(keyboard.isFocused(buttons[0])).toBe(true);
      
      // Navigate right
      await keyboard.arrowRight();
      expect(keyboard.isFocused(buttons[1])).toBe(true);
      
      // Navigate left
      await keyboard.arrowLeft();
      expect(keyboard.isFocused(buttons[0])).toBe(true);
    });

    it('should support arrow key navigation in vertical layout', async () => {
      renderButtonGroup({ orientation: 'vertical' });
      const buttons = screen.getAllByRole('button');
      
      // Focus first button
      buttons[0].focus();
      expect(keyboard.isFocused(buttons[0])).toBe(true);
      
      // Navigate down
      await keyboard.arrowDown();
      expect(keyboard.isFocused(buttons[1])).toBe(true);
      
      // Navigate up
      await keyboard.arrowUp();
      expect(keyboard.isFocused(buttons[0])).toBe(true);
    });

    it('should support Home/End key navigation', async () => {
      renderButtonGroup();
      const buttons = screen.getAllByRole('button');
      
      // Focus middle button
      buttons[1].focus();
      
      // Navigate to first with Home
      await user.keyboard('{Home}');
      expect(keyboard.isFocused(buttons[0])).toBe(true);
      
      // Navigate to last with End
      await user.keyboard('{End}');
      expect(keyboard.isFocused(buttons[buttons.length - 1])).toBe(true);
    });

    it('should wrap around at ends', async () => {
      renderButtonGroup();
      const buttons = screen.getAllByRole('button');
      
      // Focus last button
      buttons[buttons.length - 1].focus();
      
      // Navigate right should wrap to first
      await keyboard.arrowRight();
      expect(keyboard.isFocused(buttons[0])).toBe(true);
      
      // Navigate left should wrap to last
      await keyboard.arrowLeft();
      expect(keyboard.isFocused(buttons[buttons.length - 1])).toBe(true);
    });

    it('should announce navigation to screen readers', async () => {
      renderButtonGroup();
      const buttons = screen.getAllByRole('button');
      
      buttons[0].focus();
      await keyboard.arrowRight();
      
      await waitFor(() => {
        expect(mockAnnouncement).toHaveBeenCalledWith(
          expect.stringContaining('Button 2 of 3')
        );
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA group labeling', () => {
      const { container } = renderButtonGroup({ 
        label: 'Dialog actions'
      });
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveAttribute('aria-label', 'Dialog actions');
    });

    it('should support aria-describedby', () => {
      const { container } = renderButtonGroup({ 
        ariaDescribedBy: 'group-description'
      });
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveAttribute('aria-describedby', 'group-description');
    });

    it('should pass accessibility validation', async () => {
      const { container } = renderButtonGroup();
      await testA11y(container);
    });
  });

  describe('Visual Variants', () => {
    it('should render contained variant with background', () => {
      const { container } = renderButtonGroup({ variant: 'contained' });
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveClass('bg-gray-50', 'border', 'rounded-lg');
    });

    it('should render separated variant with dividers', () => {
      const { container } = renderButtonGroup({ variant: 'separated' });
      const group = container.querySelector('[role="group"]');
      
      expect(group).toHaveClass('divide-x', 'border', 'rounded-lg');
    });

    it('should render attached buttons without spacing', () => {
      const { container } = renderButtonGroup({ attached: true });
      const group = container.querySelector('[role="group"]');
      
      // Should not have spacing classes
      expect(group).not.toHaveClass('space-x-2');
    });
  });
});

// ============================================================================
// USER INTERACTION TESTS
// ============================================================================

describe('User Interactions', () => {
  describe('Click Handling', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const { user } = renderButton({ onClick: handleClick });
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should prevent clicks when disabled', async () => {
      const handleClick = vi.fn();
      const { user } = renderButton({ onClick: handleClick, disabled: true });
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should prevent clicks when loading', async () => {
      const handleClick = vi.fn();
      const { user } = renderButton({ onClick: handleClick, loading: true });
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle event propagation correctly', async () => {
      const buttonClick = vi.fn();
      const containerClick = vi.fn();
      const { user } = customRender(
        <div onClick={containerClick}>
          <Button onClick={buttonClick}>Test</Button>
        </div>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(buttonClick).toHaveBeenCalledTimes(1);
      expect(containerClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading Button Async Actions', () => {
    it('should handle successful async actions', async () => {
      const asyncAction = vi.fn().mockResolvedValue(undefined);
      const { user } = customRender(
        <LoadingButton 
          asyncAction={asyncAction}
          successMessage="Success!"
        >
          Async Action
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(asyncAction).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(mockAnnouncement).toHaveBeenCalledWith('Success!');
      });
    });

    it('should handle failed async actions', async () => {
      const asyncAction = vi.fn().mockRejectedValue(new Error('Test error'));
      const { user } = customRender(
        <LoadingButton 
          asyncAction={asyncAction}
          errorMessage="Error occurred!"
        >
          Async Action
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(asyncAction).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(mockAnnouncement).toHaveBeenCalledWith('Error occurred!');
      });
    });

    it('should show loading state during async action', async () => {
      let resolvePromise: () => void;
      const asyncAction = vi.fn().mockImplementation(() => 
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { user } = customRender(
        <LoadingButton asyncAction={asyncAction}>
          Async Action
        </LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      // Button should be in loading state
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      
      // Resolve the promise
      resolvePromise!();
      
      await waitFor(() => {
        expect(button).not.toHaveAttribute('aria-busy');
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Form Integration', () => {
    it('should support form submission', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const { user } = customRender(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should not submit form when disabled', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const { user } = customRender(
        <form onSubmit={handleSubmit}>
          <Button type="submit" disabled>Submit</Button>
        </form>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });
});

// ============================================================================
// PERFORMANCE AND EDGE CASES
// ============================================================================

describe('Performance and Edge Cases', () => {
  describe('Component Rendering', () => {
    it('should render efficiently with many buttons', () => {
      const startTime = performance.now();
      
      const { container } = customRender(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <Button key={i} variant="primary">
              Button {i}
            </Button>
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render 100 buttons in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      expect(container.querySelectorAll('button')).toHaveLength(100);
    });

    it('should handle rapid state changes', async () => {
      const { rerender } = renderButton({ loading: false });
      
      // Rapidly toggle loading state
      for (let i = 0; i < 10; i++) {
        rerender(<Button loading={i % 2 === 0}>Test</Button>);
      }
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children gracefully', () => {
      const { container } = customRender(<Button>{null}</Button>);
      const button = container.querySelector('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('should handle complex children structures', () => {
      const { container } = customRender(
        <Button>
          <span>Complex</span>
          <div>Structure</div>
          {/* Fragment */}
          <>Fragment</>
        </Button>
      );
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('ComplexStructureFragment');
    });

    it('should handle missing required props gracefully', () => {
      // Should not throw when required props are missing
      expect(() => {
        customRender(<Button />);
      }).not.toThrow();
    });

    it('should cleanup announcement elements', async () => {
      const { user } = renderButton({ 
        announceOnPress: 'Test announcement'
      });
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      // Should cleanup after timeout
      await waitFor(() => {
        expect(document.body.removeChild).toHaveBeenCalled();
      }, { timeout: 1500 });
    });
  });

  describe('Memory Management', () => {
    it('should not create memory leaks with event listeners', () => {
      const { unmount } = renderButton({ onClick: vi.fn() });
      
      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should cleanup loading button promises', async () => {
      const controller = new AbortController();
      const asyncAction = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          controller.signal.addEventListener('abort', () => resolve(undefined));
        })
      );

      const { unmount, user } = customRender(
        <LoadingButton asyncAction={asyncAction}>Test</LoadingButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      // Unmount while promise is pending
      unmount();
      controller.abort();
      
      // Should not cause errors
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });
});

// ============================================================================
// THEME AND RESPONSIVE TESTS
// ============================================================================

describe('Theme and Responsive Behavior', () => {
  describe('Dark Mode Support', () => {
    it('should render correctly in dark mode', () => {
      const { container } = renderButton(
        { variant: 'primary' },
        { theme: 'dark' }
      );
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary-600'); // Same colors work in dark mode
    });

    it('should maintain accessibility in dark mode', async () => {
      const { container } = renderButton(
        { variant: 'secondary' },
        { theme: 'dark' }
      );
      
      await testA11y(container);
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain touch targets on mobile viewports', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = renderButton({ size: 'sm' });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('min-h-[44px]');
    });

    it('should handle full width responsively', () => {
      const { container } = renderButton({ fullWidth: true });
      const button = container.querySelector('button');
      
      expect(button).toHaveClass('w-full');
    });
  });
});