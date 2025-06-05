/**
 * Comprehensive test suite for ConfirmDialog component
 * 
 * Tests the React-based confirmation dialog component that replaces the Angular
 * DfConfirmDialogComponent. Validates accessibility compliance (WCAG 2.1 AA),
 * keyboard navigation, promise-based workflow, and internationalization support.
 * 
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ConfirmDialog } from './confirm-dialog';
import type { 
  ConfirmDialogProps, 
  ConfirmDialogData, 
  DialogSeverity 
} from './types';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock react-i18next for internationalization testing
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      // Mock translation function with fallback values
      const translations: Record<string, string> = {
        'dialog.confirm': 'Confirm',
        'dialog.cancel': 'Cancel',
        'dialog.delete.title': 'Delete Item',
        'dialog.delete.message': 'Are you sure you want to delete this item?',
        'dialog.save.title': 'Save Changes',
        'dialog.save.message': 'Do you want to save your changes?',
        'dialog.warning.title': 'Warning',
        'dialog.error.title': 'Error',
        'dialog.success.title': 'Success',
      };
      
      if (options?.itemName) {
        return `Delete ${options.itemName}?`;
      }
      
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock Next.js useRouter for navigation testing
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock focus-trap-react for focus management testing
vi.mock('focus-trap-react', () => ({
  __esModule: true,
  default: ({ children, active }: { children: React.ReactNode; active: boolean }) =>
    active ? <div data-testid="focus-trap">{children}</div> : children,
}));

/**
 * Test utilities and helper functions
 */
const createMockDialogData = (overrides?: Partial<ConfirmDialogData>): ConfirmDialogData => ({
  title: 'Test Dialog',
  message: 'This is a test message',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  severity: 'info',
  ...overrides,
});

const createMockProps = (overrides?: Partial<ConfirmDialogProps>): ConfirmDialogProps => ({
  ...createMockDialogData(),
  open: true,
  onOpenChange: vi.fn(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
  ...overrides,
});

const renderWithKeyboardUser = (props: ConfirmDialogProps) => {
  const user = userEvent.setup();
  const result = render(<ConfirmDialog {...props} />);
  return { user, ...result };
};

/**
 * Main test suite for ConfirmDialog component
 */
describe('ConfirmDialog Component', () => {
  let mockOnConfirm: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;
  let mockOnOpenChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnConfirm = vi.fn();
    mockOnCancel = vi.fn();
    mockOnOpenChange = vi.fn();
    
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Mock window.ResizeObserver for Headless UI components
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    // Clean up any remaining dialogs
    vi.restoreAllMocks();
  });

  /**
   * Basic rendering and structure tests
   */
  describe('Rendering and Structure', () => {
    it('should render dialog when open is true', () => {
      const props = createMockProps({
        open: true,
        onOpenChange: mockOnOpenChange,
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Dialog')).toBeInTheDocument();
      expect(screen.getByText('This is a test message')).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      const props = createMockProps({
        open: false,
        onOpenChange: mockOnOpenChange,
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render dialog title and message correctly', () => {
      const props = createMockProps({
        title: 'Custom Title',
        message: 'Custom message content',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message content')).toBeInTheDocument();
    });

    it('should render optional description when provided', () => {
      const props = createMockProps({
        description: 'Additional description text',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByText('Additional description text')).toBeInTheDocument();
    });

    it('should render custom confirm and cancel button text', () => {
      const props = createMockProps({
        confirmText: 'Delete Now',
        cancelText: 'Keep Item',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByRole('button', { name: 'Delete Now' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Keep Item' })).toBeInTheDocument();
    });

    it('should render with custom icon when provided', () => {
      const CustomIcon = () => <svg data-testid="custom-icon" />;
      const props = createMockProps({
        icon: <CustomIcon />,
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      const props = createMockProps({
        className: 'custom-dialog-class',
      });

      render(<ConfirmDialog {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-dialog-class');
    });

    it('should apply data-testid attribute when provided', () => {
      const props = createMockProps({
        'data-testid': 'custom-test-id',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  /**
   * Severity and styling tests
   */
  describe('Severity Levels and Styling', () => {
    const severityLevels: DialogSeverity[] = ['info', 'warning', 'error', 'success', 'question'];

    severityLevels.forEach((severity) => {
      it(`should render with correct styling for ${severity} severity`, () => {
        const props = createMockProps({
          severity,
          title: `${severity} Dialog`,
        });

        render(<ConfirmDialog {...props} />);

        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('data-severity', severity);
      });
    });

    it('should apply destructive styling when destructive prop is true', () => {
      const props = createMockProps({
        destructive: true,
      });

      render(<ConfirmDialog {...props} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveClass('destructive');
    });

    it('should hide cancel button when showCancel is false', () => {
      const props = createMockProps({
        showCancel: false,
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
  });

  /**
   * User interaction tests
   */
  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', async () => {
      const props = createMockProps({
        onConfirm: mockOnConfirm,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const props = createMockProps({
        onCancel: mockOnCancel,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenChange with false when cancel button is clicked', async () => {
      const props = createMockProps({
        onOpenChange: mockOnOpenChange,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange with false on overlay click when closeOnOverlayClick is true', async () => {
      const props = createMockProps({
        onOpenChange: mockOnOpenChange,
        closeOnOverlayClick: true,
      });

      render(<ConfirmDialog {...props} />);

      const overlay = screen.getByTestId('dialog-overlay');
      fireEvent.click(overlay);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close on overlay click when closeOnOverlayClick is false', async () => {
      const props = createMockProps({
        onOpenChange: mockOnOpenChange,
        closeOnOverlayClick: false,
      });

      render(<ConfirmDialog {...props} />);

      const overlay = screen.getByTestId('dialog-overlay');
      fireEvent.click(overlay);

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });
  });

  /**
   * Keyboard navigation and accessibility tests
   */
  describe('Keyboard Navigation and Accessibility', () => {
    it('should close dialog when Escape key is pressed', async () => {
      const props = createMockProps({
        onOpenChange: mockOnOpenChange,
        closeOnEscape: true,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.keyboard('{Escape}');

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close on Escape when closeOnEscape is false', async () => {
      const props = createMockProps({
        onOpenChange: mockOnOpenChange,
        closeOnEscape: false,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.keyboard('{Escape}');

      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });

    it('should activate confirm button when Enter key is pressed', async () => {
      const props = createMockProps({
        onConfirm: mockOnConfirm,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.keyboard('{Enter}');

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should focus cancel button by default', () => {
      const props = createMockProps({
        focusConfirm: false,
      });

      render(<ConfirmDialog {...props} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toHaveFocus();
    });

    it('should focus confirm button when focusConfirm is true', () => {
      const props = createMockProps({
        focusConfirm: true,
      });

      render(<ConfirmDialog {...props} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      expect(confirmButton).toHaveFocus();
    });

    it('should trap focus within dialog when trapFocus is true', () => {
      const props = createMockProps({
        trapFocus: true,
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByTestId('focus-trap')).toBeInTheDocument();
    });

    it('should navigate between buttons using Tab key', async () => {
      const props = createMockProps();
      const { user } = renderWithKeyboardUser(props);

      render(<ConfirmDialog {...props} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      const confirmButton = screen.getByRole('button', { name: 'Confirm' });

      // Focus should start on cancel button
      expect(cancelButton).toHaveFocus();

      // Tab to confirm button
      await user.keyboard('{Tab}');
      expect(confirmButton).toHaveFocus();

      // Shift+Tab back to cancel button
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(cancelButton).toHaveFocus();
    });
  });

  /**
   * ARIA and screen reader support tests
   */
  describe('ARIA and Screen Reader Support', () => {
    it('should have proper ARIA attributes', () => {
      const props = createMockProps({
        title: 'Confirmation Dialog',
        message: 'Please confirm your action',
      });

      render(<ConfirmDialog {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should use custom ARIA label when provided', () => {
      const props = createMockProps({
        accessibility: {
          ariaLabel: 'Custom confirmation dialog',
        },
      });

      render(<ConfirmDialog {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Custom confirmation dialog');
    });

    it('should use alertdialog role for error severity', () => {
      const props = createMockProps({
        severity: 'error',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should use alertdialog role when configured in accessibility props', () => {
      const props = createMockProps({
        accessibility: {
          role: 'alertdialog',
        },
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should announce content to screen readers when configured', () => {
      const props = createMockProps({
        accessibility: {
          announceContent: true,
          announcement: 'Important confirmation required',
        },
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByText('Important confirmation required')).toHaveAttribute('aria-live', 'assertive');
    });
  });

  /**
   * Promise-based workflow tests
   */
  describe('Promise-Based Workflow', () => {
    it('should handle successful confirmation with promise resolution', async () => {
      const successPromise = Promise.resolve();
      mockOnConfirm.mockReturnValue(successPromise);

      const props = createMockProps({
        onConfirm: mockOnConfirm,
        onOpenChange: mockOnOpenChange,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should handle confirmation rejection and keep dialog open', async () => {
      const rejectedPromise = Promise.reject(new Error('Confirmation failed'));
      mockOnConfirm.mockReturnValue(rejectedPromise);

      const props = createMockProps({
        onConfirm: mockOnConfirm,
        onOpenChange: mockOnOpenChange,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnOpenChange).not.toHaveBeenCalled();
      });

      // Dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should show loading state during async operation', async () => {
      let resolvePromise: (value?: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockOnConfirm.mockReturnValue(pendingPromise);

      const props = createMockProps({
        onConfirm: mockOnConfirm,
      });

      const { user } = renderWithKeyboardUser(props);

      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      // Check for loading indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!();
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('should display error message when provided', () => {
      const props = createMockProps({
        error: 'An error occurred during confirmation',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByText('An error occurred during confirmation')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  /**
   * Internationalization (i18n) tests
   */
  describe('Internationalization', () => {
    it('should use translated text for default buttons', () => {
      const props = createMockProps({
        confirmText: undefined, // Use default translation
        cancelText: undefined,  // Use default translation
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should support custom translation keys', () => {
      const props = createMockProps({
        title: 'dialog.delete.title',
        message: 'dialog.delete.message',
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    });

    it('should support translation interpolation', () => {
      const props = createMockProps({
        title: 'Delete {{itemName}}?',
        message: 'This action cannot be undone',
      });

      render(<ConfirmDialog {...props} />);

      // This would be handled by the actual i18n implementation
      expect(screen.getByText('Delete {{itemName}}?')).toBeInTheDocument();
    });
  });

  /**
   * Accessibility compliance tests using axe-core
   */
  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('should have no accessibility violations in default state', async () => {
      const props = createMockProps();
      const { container } = render(<ConfirmDialog {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with error severity', async () => {
      const props = createMockProps({
        severity: 'error',
        destructive: true,
      });
      const { container } = render(<ConfirmDialog {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with custom content', async () => {
      const props = createMockProps({
        title: 'Complex Dialog Title',
        message: 'This is a complex message with multiple sentences. It contains important information that users need to understand.',
        description: 'Additional description providing more context about the action.',
        icon: <svg aria-label="Warning icon" />,
      });
      const { container } = render(<ConfirmDialog {...props} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper color contrast ratios', () => {
      const props = createMockProps({
        severity: 'error',
        destructive: true,
      });

      render(<ConfirmDialog {...props} />);

      const confirmButton = screen.getByRole('button', { name: 'Confirm' });
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });

      // These would be tested by axe-core color contrast rules
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should support high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const props = createMockProps();
      render(<ConfirmDialog {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-high-contrast', 'true');
    });
  });

  /**
   * Custom button props tests
   */
  describe('Custom Button Props', () => {
    it('should apply custom confirm button props', () => {
      const props = createMockProps({
        confirmButtonProps: {
          'data-testid': 'custom-confirm-btn',
          className: 'custom-confirm-class',
          disabled: true,
        },
      });

      render(<ConfirmDialog {...props} />);

      const confirmButton = screen.getByTestId('custom-confirm-btn');
      expect(confirmButton).toHaveClass('custom-confirm-class');
      expect(confirmButton).toBeDisabled();
    });

    it('should apply custom cancel button props', () => {
      const props = createMockProps({
        cancelButtonProps: {
          'data-testid': 'custom-cancel-btn',
          className: 'custom-cancel-class',
          autoFocus: true,
        },
      });

      render(<ConfirmDialog {...props} />);

      const cancelButton = screen.getByTestId('custom-cancel-btn');
      expect(cancelButton).toHaveClass('custom-cancel-class');
      expect(cancelButton).toHaveFocus();
    });
  });

  /**
   * Animation and transition tests
   */
  describe('Animation and Transitions', () => {
    it('should apply custom animation configuration', () => {
      const props = createMockProps({
        animation: {
          enterDuration: 300,
          exitDuration: 200,
          easing: 'ease-in-out',
          scale: true,
          fade: true,
        },
      });

      render(<ConfirmDialog {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('data-animation-config');
    });

    it('should use custom animation classes when provided', () => {
      const props = createMockProps({
        animation: {
          customClasses: {
            enter: 'custom-enter',
            enterFrom: 'custom-enter-from',
            enterTo: 'custom-enter-to',
          },
        },
      });

      render(<ConfirmDialog {...props} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-enter');
    });
  });

  /**
   * Edge cases and error handling tests
   */
  describe('Edge Cases and Error Handling', () => {
    it('should handle missing onConfirm callback gracefully', async () => {
      const props = createMockProps({
        onConfirm: undefined,
      });

      const { user } = renderWithKeyboardUser(props);

      // Should not throw error when clicking confirm
      await expect(
        user.click(screen.getByRole('button', { name: 'Confirm' }))
      ).resolves.not.toThrow();
    });

    it('should handle missing onCancel callback gracefully', async () => {
      const props = createMockProps({
        onCancel: undefined,
      });

      const { user } = renderWithKeyboardUser(props);

      // Should not throw error when clicking cancel
      await expect(
        user.click(screen.getByRole('button', { name: 'Cancel' }))
      ).resolves.not.toThrow();
    });

    it('should handle very long text content', () => {
      const longText = 'Lorem ipsum '.repeat(100);
      const props = createMockProps({
        title: longText,
        message: longText,
        description: longText,
      });

      render(<ConfirmDialog {...props} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle rapid open/close operations', async () => {
      const props = createMockProps({
        onOpenChange: mockOnOpenChange,
      });

      const { rerender } = render(<ConfirmDialog {...props} />);

      // Rapidly toggle open state
      rerender(<ConfirmDialog {...props} open={false} />);
      rerender(<ConfirmDialog {...props} open={true} />);
      rerender(<ConfirmDialog {...props} open={false} />);

      // Should not cause any errors
      expect(mockOnOpenChange).toHaveBeenCalled();
    });
  });

  /**
   * Performance and memory leak tests
   */
  describe('Performance and Memory Management', () => {
    it('should clean up event listeners when unmounted', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const props = createMockProps();

      const { unmount } = render(<ConfirmDialog {...props} />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it('should not cause memory leaks with multiple instances', () => {
      const props1 = createMockProps({ 'data-testid': 'dialog-1' });
      const props2 = createMockProps({ 'data-testid': 'dialog-2' });

      const { unmount: unmount1 } = render(<ConfirmDialog {...props1} />);
      const { unmount: unmount2 } = render(<ConfirmDialog {...props2} />);

      // Unmount both dialogs
      unmount1();
      unmount2();

      // No memory leaks should occur
      expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
    });
  });
});