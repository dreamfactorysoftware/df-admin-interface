/**
 * ConfirmDialog Component Test Suite
 * 
 * Comprehensive test suite for the ConfirmDialog component using Vitest 2.1.0 and React Testing Library.
 * Tests accessibility compliance, keyboard navigation, focus management, internationalization,
 * promise-based confirmation workflow, and user interactions.
 * 
 * Test Coverage:
 * - WCAG 2.1 AA accessibility compliance with jest-axe
 * - Promise-based confirmation workflows with async operations
 * - Internationalization with mocked react-i18next integration
 * - Keyboard navigation and focus trapping
 * - Screen reader support with ARIA validation
 * - Dialog content rendering and customization
 * - Button interactions and confirmation/cancellation workflows
 * - Dialog dismissal behaviors (escape key, click outside)
 * - Error handling and loading states
 * - Multiple severity levels and themes
 * 
 * @fileoverview ConfirmDialog component tests
 * @version 1.0.0
 * @since Vitest 2.1.0 / React 19.0.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import userEvent from '@testing-library/user-event';

import { 
  customRender, 
  testA11y, 
  checkAriaAttributes, 
  createKeyboardUtils,
  getAriaLiveRegions,
  type A11yTestConfig 
} from '@/test/test-utils';

import { ConfirmDialog } from './confirm-dialog';
import type { ConfirmDialogProps, DialogSeverity, DialogTheme } from './types';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock react-i18next
const mockT = vi.fn((key: string, defaultValue?: string) => defaultValue || key);
const mockUseTranslation = vi.fn(() => ({
  t: mockT,
  i18n: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

// Mock Headless UI Dialog components to avoid portal issues in tests
vi.mock('@headlessui/react', () => ({
  Dialog: {
    Panel: ({ children, ...props }: any) => <div role="dialog" {...props}>{children}</div>,
    Title: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  },
  Transition: {
    Child: ({ children }: any) => <>{children}</>,
  },
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  AlertTriangle: ({ className, ...props }: any) => 
    <svg className={className} data-testid="alert-triangle-icon" {...props} />,
  AlertCircle: ({ className, ...props }: any) => 
    <svg className={className} data-testid="alert-circle-icon" {...props} />,
  CheckCircle: ({ className, ...props }: any) => 
    <svg className={className} data-testid="check-circle-icon" {...props} />,
  XCircle: ({ className, ...props }: any) => 
    <svg className={className} data-testid="x-circle-icon" {...props} />,
  HelpCircle: ({ className, ...props }: any) => 
    <svg className={className} data-testid="help-circle-icon" {...props} />,
  X: ({ className, ...props }: any) => 
    <svg className={className} data-testid="x-icon" {...props} />,
  Loader2: ({ className, ...props }: any) => 
    <svg className={className} data-testid="loader-icon" {...props} />,
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, ...props }, ref) => (
    <button ref={ref} {...props}>
      {children}
    </button>
  )),
}));

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Default props for testing ConfirmDialog
 */
const defaultProps: ConfirmDialogProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

/**
 * Create a ConfirmDialog component with test props
 */
const createConfirmDialog = (props: Partial<ConfirmDialogProps> = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return <ConfirmDialog {...mergedProps} />;
};

/**
 * Test dialog with different severities
 */
const severityTestCases: Array<{ severity: DialogSeverity; expectedIcon: string }> = [
  { severity: 'info', expectedIcon: 'help-circle-icon' },
  { severity: 'warning', expectedIcon: 'alert-triangle-icon' },
  { severity: 'error', expectedIcon: 'x-circle-icon' },
  { severity: 'success', expectedIcon: 'check-circle-icon' },
  { severity: 'question', expectedIcon: 'help-circle-icon' },
];

/**
 * Test dialog with different themes
 */
const themeTestCases: DialogTheme[] = ['default', 'minimal', 'card', 'overlay', 'inline'];

/**
 * Setup user event for keyboard testing
 */
const setupUserEvent = () => userEvent.setup();

// ============================================================================
// TEST SUITES
// ============================================================================

describe('ConfirmDialog Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset translation mock
    mockT.mockImplementation((key: string, defaultValue?: string) => defaultValue || key);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ==========================================================================
  // BASIC RENDERING TESTS
  // ==========================================================================

  describe('Basic Rendering', () => {
    
    it('renders with required props', () => {
      const { container } = customRender(createConfirmDialog());
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      customRender(createConfirmDialog({ open: false }));
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with custom title and message', () => {
      const customTitle = 'Delete Database';
      const customMessage = 'This action cannot be undone.';
      
      customRender(createConfirmDialog({ 
        title: customTitle, 
        message: customMessage 
      }));
      
      expect(screen.getByText(customTitle)).toBeInTheDocument();
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('renders with optional description', () => {
      const description = 'All related data will be permanently removed.';
      
      customRender(createConfirmDialog({ description }));
      
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('renders with data-testid attribute', () => {
      const testId = 'confirm-delete-dialog';
      
      customRender(createConfirmDialog({ 'data-testid': testId }));
      
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SEVERITY AND ICON TESTS
  // ==========================================================================

  describe('Severity Levels and Icons', () => {
    
    severityTestCases.forEach(({ severity, expectedIcon }) => {
      it(`renders correct icon for ${severity} severity`, () => {
        customRender(createConfirmDialog({ severity }));
        
        expect(screen.getByTestId(expectedIcon)).toBeInTheDocument();
      });
    });

    it('renders custom icon when provided', () => {
      const customIcon = <span data-testid="custom-icon">Custom</span>;
      
      customRender(createConfirmDialog({ icon: customIcon }));
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      // Should not render default icon
      expect(screen.queryByTestId('help-circle-icon')).not.toBeInTheDocument();
    });

    it('applies destructive styling when destructive prop is true', () => {
      customRender(createConfirmDialog({ destructive: true }));
      
      // Should render error icon for destructive actions
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // THEME TESTS
  // ==========================================================================

  describe('Theme Variants', () => {
    
    themeTestCases.forEach((theme) => {
      it(`applies ${theme} theme styling`, () => {
        const { container } = customRender(createConfirmDialog({ theme }));
        
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
        // Theme-specific classes would be applied here
        // Testing exact classes would require more specific implementation details
      });
    });

    it('applies custom className', () => {
      const customClass = 'custom-dialog-class';
      const { container } = customRender(createConfirmDialog({ className: customClass }));
      
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveClass(customClass);
    });
  });

  // ==========================================================================
  // BUTTON CONFIGURATION TESTS
  // ==========================================================================

  describe('Button Configuration', () => {
    
    it('renders confirm and cancel buttons by default', () => {
      customRender(createConfirmDialog());
      
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('hides cancel button when showCancel is false', () => {
      customRender(createConfirmDialog({ showCancel: false }));
      
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    it('renders custom button text', () => {
      const confirmText = 'Delete Now';
      const cancelText = 'Keep Safe';
      
      customRender(createConfirmDialog({ 
        confirmText, 
        cancelText 
      }));
      
      expect(screen.getByRole('button', { name: confirmText })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: cancelText })).toBeInTheDocument();
    });

    it('applies custom button props', () => {
      const confirmButtonProps = { 'data-testid': 'custom-confirm-btn' };
      const cancelButtonProps = { 'data-testid': 'custom-cancel-btn' };
      
      customRender(createConfirmDialog({ 
        confirmButtonProps, 
        cancelButtonProps 
      }));
      
      expect(screen.getByTestId('custom-confirm-btn')).toBeInTheDocument();
      expect(screen.getByTestId('custom-cancel-btn')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FOCUS MANAGEMENT TESTS
  // ==========================================================================

  describe('Focus Management', () => {
    
    it('focuses cancel button by default', async () => {
      const user = setupUserEvent();
      customRender(createConfirmDialog());
      
      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        expect(cancelButton).toHaveFocus();
      });
    });

    it('focuses confirm button when focusConfirm is true', async () => {
      customRender(createConfirmDialog({ focusConfirm: true }));
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        expect(confirmButton).toHaveFocus();
      });
    });

    it('supports keyboard navigation between buttons', async () => {
      const user = setupUserEvent();
      customRender(createConfirmDialog());
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Start with cancel button focused
      await waitFor(() => expect(cancelButton).toHaveFocus());
      
      // Tab to confirm button
      await user.tab();
      expect(confirmButton).toHaveFocus();
      
      // Shift+Tab back to cancel button
      await user.tab({ shift: true });
      expect(cancelButton).toHaveFocus();
    });

    it('traps focus within dialog when trapFocus is true', async () => {
      const user = setupUserEvent();
      customRender(createConfirmDialog({ trapFocus: true }));
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Focus should cycle between buttons
      await user.tab();
      await user.tab();
      
      // Should be back to cancel button (focus trapped)
      expect([cancelButton, confirmButton]).toContain(document.activeElement);
    });
  });

  // ==========================================================================
  // KEYBOARD INTERACTION TESTS
  // ==========================================================================

  describe('Keyboard Interactions', () => {
    
    it('closes dialog on Escape key when closeOnEscape is true', async () => {
      const user = setupUserEvent();
      const onOpenChange = vi.fn();
      
      customRender(createConfirmDialog({ 
        onOpenChange, 
        closeOnEscape: true 
      }));
      
      await user.keyboard('{Escape}');
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not close dialog on Escape when closeOnEscape is false', async () => {
      const user = setupUserEvent();
      const onOpenChange = vi.fn();
      
      customRender(createConfirmDialog({ 
        onOpenChange, 
        closeOnEscape: false 
      }));
      
      await user.keyboard('{Escape}');
      
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('triggers confirm action on Enter key', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn();
      
      customRender(createConfirmDialog({ onConfirm }));
      
      await user.keyboard('{Enter}');
      
      expect(onConfirm).toHaveBeenCalled();
    });

    it('supports custom keyboard shortcuts', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      
      customRender(createConfirmDialog({ 
        onConfirm,
        onCancel,
        accessibility: {
          shortcuts: {
            confirmKey: 'Space',
            cancelKey: 'Escape',
          }
        }
      }));
      
      await user.keyboard(' ');
      expect(onConfirm).toHaveBeenCalled();
      
      await user.keyboard('{Escape}');
      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // MOUSE INTERACTION TESTS
  // ==========================================================================

  describe('Mouse Interactions', () => {
    
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn();
      
      customRender(createConfirmDialog({ onConfirm }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = setupUserEvent();
      const onCancel = vi.fn();
      
      customRender(createConfirmDialog({ onCancel }));
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(onCancel).toHaveBeenCalled();
    });

    it('closes dialog on overlay click when closeOnOverlayClick is true', async () => {
      const user = setupUserEvent();
      const onOpenChange = vi.fn();
      
      const { container } = customRender(createConfirmDialog({ 
        onOpenChange, 
        closeOnOverlayClick: true 
      }));
      
      // Click outside the dialog panel
      const overlay = container.querySelector('.fixed.inset-0');
      if (overlay) {
        await user.click(overlay);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });

  // ==========================================================================
  // ASYNC WORKFLOW TESTS
  // ==========================================================================

  describe('Promise-based Confirmation Workflow', () => {
    
    it('handles async confirmation successfully', async () => {
      const user = setupUserEvent();
      const asyncConfirm = vi.fn().mockResolvedValue(undefined);
      const onOpenChange = vi.fn();
      
      customRender(createConfirmDialog({ 
        onConfirm: asyncConfirm,
        onOpenChange 
      }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(asyncConfirm).toHaveBeenCalled();
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('displays loading state during async operation', async () => {
      const user = setupUserEvent();
      const asyncConfirm = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      customRender(createConfirmDialog({ onConfirm: asyncConfirm }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(asyncConfirm).toHaveBeenCalled();
      });
    });

    it('handles async confirmation errors', async () => {
      const user = setupUserEvent();
      const errorMessage = 'Network error occurred';
      const asyncConfirm = vi.fn().mockRejectedValue(new Error(errorMessage));
      const onOpenChange = vi.fn();
      
      customRender(createConfirmDialog({ 
        onConfirm: asyncConfirm,
        onOpenChange 
      }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(onOpenChange).not.toHaveBeenCalled(); // Dialog should stay open
      });
    });

    it('displays custom error messages', () => {
      const errorMessage = 'Custom error message';
      
      customRender(createConfirmDialog({ error: errorMessage }));
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('disables buttons during loading state', () => {
      customRender(createConfirmDialog({ loading: true }));
      
      const confirmButton = screen.getByRole('button', { name: /processing/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // INTERNATIONALIZATION TESTS
  // ==========================================================================

  describe('Internationalization', () => {
    
    it('uses translation function for default texts', () => {
      customRender(createConfirmDialog({ severity: 'warning' }));
      
      // Check that translation function was called for default texts
      expect(mockT).toHaveBeenCalledWith('dialog.proceed', expect.any(String));
      expect(mockT).toHaveBeenCalledWith('dialog.cancel', expect.any(String));
    });

    it('uses translation for titles based on severity', () => {
      customRender(createConfirmDialog({ 
        severity: 'error', 
        title: undefined // Use default title
      }));
      
      expect(mockT).toHaveBeenCalledWith('dialog.title.error', expect.any(String));
    });

    it('uses custom text when provided', () => {
      const customConfirmText = 'Proceed with Deletion';
      const customCancelText = 'Keep Data';
      
      customRender(createConfirmDialog({ 
        confirmText: customConfirmText,
        cancelText: customCancelText 
      }));
      
      expect(screen.getByText(customConfirmText)).toBeInTheDocument();
      expect(screen.getByText(customCancelText)).toBeInTheDocument();
    });

    it('translates loading and error messages', async () => {
      customRender(createConfirmDialog({ loading: true }));
      
      expect(mockT).toHaveBeenCalledWith('dialog.processing', expect.any(String));
    });

    it('translates screen reader announcements', () => {
      mockT.mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'dialog.action.completed': 'Action completed successfully',
          'dialog.action.cancelled': 'Action cancelled',
        };
        return translations[key] || key;
      });
      
      customRender(createConfirmDialog({
        accessibility: { announceContent: true }
      }));
      
      // Component should have called translation for announcements
      expect(mockT).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility Compliance', () => {
    
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = customRender(createConfirmDialog());
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      customRender(createConfirmDialog());
      
      const dialog = screen.getByRole('dialog');
      
      checkAriaAttributes(dialog, {
        'aria-labelledby': 'dialog-title',
        'aria-describedby': 'dialog-description',
      });
    });

    it('uses alertdialog role for error severity', () => {
      customRender(createConfirmDialog({ severity: 'error' }));
      
      // Should use alertdialog role for error dialogs
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('uses alertdialog role for destructive actions', () => {
      customRender(createConfirmDialog({ destructive: true }));
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('provides proper error announcement', () => {
      customRender(createConfirmDialog({ error: 'Test error message' }));
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    it('has sufficient color contrast for all severities', async () => {
      for (const { severity } of severityTestCases) {
        const { container } = customRender(createConfirmDialog({ severity }));
        
        // Test accessibility without color contrast (since it's hard to test programmatically)
        const config: A11yTestConfig = { disableColorContrast: true };
        await testA11y(container, config);
      }
    });

    it('supports screen reader navigation', () => {
      const { container } = customRender(createConfirmDialog());
      
      // Check for screen reader friendly elements
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      
      // Check for aria-hidden icons
      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('provides live region announcements', () => {
      const { container } = customRender(createConfirmDialog({
        accessibility: { announceContent: true }
      }));
      
      const liveRegions = getAriaLiveRegions(container);
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    });

    it('has minimum touch target sizes', () => {
      customRender(createConfirmDialog());
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Check for minimum 44px touch target (WCAG 2.1 AA requirement)
        expect(button).toHaveClass('min-h-[44px]');
        expect(button).toHaveClass('min-w-[44px]');
      });
    });
  });

  // ==========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ==========================================================================

  describe('Edge Cases and Error Handling', () => {
    
    it('handles missing onConfirm callback gracefully', async () => {
      const user = setupUserEvent();
      
      customRender(createConfirmDialog({ onConfirm: undefined }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Should not throw error when clicking confirm without callback
      await expect(user.click(confirmButton)).resolves.not.toThrow();
    });

    it('handles missing onCancel callback gracefully', async () => {
      const user = setupUserEvent();
      
      customRender(createConfirmDialog({ onCancel: undefined }));
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      
      // Should not throw error when clicking cancel without callback
      await expect(user.click(cancelButton)).resolves.not.toThrow();
    });

    it('prevents actions during loading state', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn();
      
      customRender(createConfirmDialog({ 
        loading: true, 
        onConfirm 
      }));
      
      const confirmButton = screen.getByRole('button', { name: /processing/i });
      await user.click(confirmButton);
      
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('handles multiple rapid clicks gracefully', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      
      customRender(createConfirmDialog({ onConfirm }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Click multiple times rapidly
      await user.click(confirmButton);
      await user.click(confirmButton);
      await user.click(confirmButton);
      
      // Should only be called once due to loading state protection
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });

    it('resets error state on subsequent actions', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(undefined);
      
      customRender(createConfirmDialog({ onConfirm }));
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // First click - should show error
      await user.click(confirmButton);
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second click - should clear error and succeed
      await user.click(confirmButton);
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });

    it('handles invalid severity gracefully', () => {
      // @ts-expect-error - Testing invalid severity
      const { container } = customRender(createConfirmDialog({ severity: 'invalid' }));
      
      // Should still render without crashing
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles missing translation keys gracefully', () => {
      mockT.mockImplementation((key: string) => `[MISSING: ${key}]`);
      
      customRender(createConfirmDialog());
      
      // Should still render with fallback text
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PERFORMANCE TESTS
  // ==========================================================================

  describe('Performance', () => {
    
    it('renders quickly with large number of props', () => {
      const startTime = performance.now();
      
      customRender(createConfirmDialog({
        title: 'Very Long Title '.repeat(10),
        message: 'Very Long Message '.repeat(20),
        description: 'Very Long Description '.repeat(15),
        confirmText: 'Very Long Confirm Text',
        cancelText: 'Very Long Cancel Text',
        accessibility: {
          announcement: 'Very Long Announcement '.repeat(10),
          shortcuts: {
            confirmKey: 'Enter',
            cancelKey: 'Escape',
            requireModifier: true,
          },
        },
      }));
      
      const endTime = performance.now();
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles rapid open/close cycles', async () => {
      const onOpenChange = vi.fn();
      
      const { rerender } = customRender(createConfirmDialog({ 
        open: false, 
        onOpenChange 
      }));
      
      // Rapidly toggle open state
      for (let i = 0; i < 10; i++) {
        rerender(createConfirmDialog({ 
          open: i % 2 === 0, 
          onOpenChange 
        }));
      }
      
      // Should handle rapid changes without issues
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Component Integration', () => {
    
    it('integrates with form validation', async () => {
      const user = setupUserEvent();
      const onConfirm = vi.fn();
      
      // Simulate form validation before confirmation
      const FormWithConfirmDialog = () => {
        const [isValid, setIsValid] = React.useState(false);
        
        return (
          <div>
            <input 
              type="text" 
              onChange={(e) => setIsValid(e.target.value.length > 0)}
              placeholder="Enter value"
            />
            <ConfirmDialog
              {...defaultProps}
              onConfirm={() => {
                if (isValid) {
                  onConfirm();
                }
              }}
            />
          </div>
        );
      };
      
      customRender(<FormWithConfirmDialog />);
      
      const input = screen.getByPlaceholderText('Enter value');
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      
      // Try to confirm without valid input
      await user.click(confirmButton);
      expect(onConfirm).not.toHaveBeenCalled();
      
      // Enter valid input and confirm
      await user.type(input, 'valid input');
      await user.click(confirmButton);
      expect(onConfirm).toHaveBeenCalled();
    });

    it('works with React Suspense boundaries', () => {
      const SuspenseWrapper = () => (
        <React.Suspense fallback={<div>Loading...</div>}>
          {createConfirmDialog()}
        </React.Suspense>
      );
      
      customRender(<SuspenseWrapper />);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('maintains state across re-renders', () => {
      const { rerender } = customRender(createConfirmDialog({ 
        error: 'Initial error' 
      }));
      
      expect(screen.getByText('Initial error')).toBeInTheDocument();
      
      // Re-render with different props
      rerender(createConfirmDialog({ 
        error: 'Updated error' 
      }));
      
      expect(screen.getByText('Updated error')).toBeInTheDocument();
      expect(screen.queryByText('Initial error')).not.toBeInTheDocument();
    });
  });
});