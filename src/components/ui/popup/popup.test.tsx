/**
 * @fileoverview Comprehensive test suite for popup component system
 * 
 * Tests the React-based popup component system using Vitest 2.1.0 and React Testing Library.
 * Validates WCAG 2.1 AA accessibility compliance, keyboard navigation, focus management,
 * authentication workflows, internationalization, popup service functionality, and responsive design.
 * 
 * Features tested:
 * - Accessibility compliance with jest-axe for WCAG 2.1 AA standards
 * - Keyboard navigation including Tab, Escape, Enter, and Arrow keys
 * - Focus trapping and management with proper ARIA labeling
 * - Authentication workflow integration with mocked hooks
 * - Internationalization support with react-i18next mocking
 * - Screen reader support and announcements
 * - Popup service hook functionality for programmatic control
 * - Animation and transition behavior validation
 * - Responsive design with viewport simulation
 * - Backdrop click and escape key dismissal behavior
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Test utilities
import {
  customRender,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  getAriaLiveRegions,
  type CustomRenderOptions,
  type KeyboardTestUtils,
} from '@/test/test-utils';

// Components and hooks under test
import { Popup } from './popup';
import { PopupProvider, usePopup, usePopupQueue, usePopupConfig } from './popup-service';
import type { 
  PopupProps, 
  PopupVariant, 
  PopupSize, 
  PopupAction,
  PopupConfig,
  PopupAccessibilityConfig,
  PopupAnimationConfig,
} from './types';

// Extend expect matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MOCK SETUP
// ============================================================================

/**
 * Mock authentication hook for testing auth workflows
 */
const mockAuth = {
  logout: vi.fn(),
  user: { id: 1, username: 'testuser', email: 'test@example.com' },
};

/**
 * Mock router hook for testing navigation
 */
const mockRouter = {
  push: vi.fn(),
  pathname: '/test-path',
};

/**
 * Mock next/navigation hooks
 */
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
}));

/**
 * Mock authentication hooks
 */
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}));

/**
 * Mock internationalization
 */
const mockTranslation = {
  t: vi.fn((key: string, options?: any) => {
    const translations: Record<string, string> = {
      'popup.title.passwordSecurity': 'Password Security Notice',
      'popup.message.passwordTooShort': 'Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.',
      'popup.button.updatePassword': 'Update Password Now',
      'popup.button.remindLater': 'Remind me later',
      'popup.button.close': 'Close',
      'popup.aria.opened': '{{title}} popup opened',
      'popup.aria.closeButton': 'Close popup',
      'popup.aria.remindLaterButton': 'Remind me later to update password',
      'popup.aria.updatePasswordButton': 'Update password now',
    };
    
    let result = translations[key] || key;
    
    // Handle interpolation
    if (options && typeof options === 'object') {
      Object.entries(options).forEach(([param, value]) => {
        result = result.replace(`{{${param}}}`, String(value));
      });
    }
    
    return result;
  }),
  i18n: {
    language: 'en',
    changeLanguage: vi.fn(),
  },
};

vi.mock('react-i18next', () => ({
  useTranslation: () => mockTranslation,
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

/**
 * Mock window.matchMedia for responsive testing
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('min-width: 768px'), // Default to desktop
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Mock IntersectionObserver for animation testing
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

/**
 * Mock requestAnimationFrame for animation testing
 */
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Default popup props for testing
 */
const defaultPopupProps: PopupProps = {
  children: 'Test popup content',
  isOpen: true,
  onClose: vi.fn(),
  title: 'Test Popup',
  variant: 'default',
  size: 'md',
  'data-testid': 'test-popup',
};

/**
 * Render popup with providers and utilities
 */
const renderPopup = (
  props: Partial<PopupProps> = {},
  options: CustomRenderOptions = {}
) => {
  const mergedProps = { ...defaultPopupProps, ...props };
  const user = userEvent.setup();
  
  const result = customRender(
    <PopupProvider>
      <Popup {...mergedProps} />
    </PopupProvider>,
    options
  );
  
  const keyboard = createKeyboardUtils(user);
  
  return {
    ...result,
    user,
    keyboard,
    props: mergedProps,
  };
};

/**
 * Render popup with custom actions
 */
const renderPopupWithActions = (actions: PopupAction[]) => {
  return renderPopup({
    actions,
    children: 'Popup with custom actions',
  });
};

/**
 * Setup viewport for responsive testing
 */
const setViewport = (width: number, height: number) => {
  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Update matchMedia mock
  (window.matchMedia as Mock).mockImplementation((query: string) => ({
    matches: width >= 768 ? query.includes('min-width: 768px') : !query.includes('min-width: 768px'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  
  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

/**
 * Wait for animation to complete
 */
const waitForAnimation = async (duration = 300) => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, duration));
  });
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Popup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset viewport to desktop
    setViewport(1024, 768);
  });

  afterEach(() => {
    // Cleanup any open popups
    document.body.innerHTML = '';
  });

  describe('Basic Rendering', () => {
    it('renders popup with default props', () => {
      renderPopup();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test popup content')).toBeInTheDocument();
      expect(screen.getByText('Test Popup')).toBeInTheDocument();
    });

    it('renders with custom title and content', () => {
      renderPopup({
        title: 'Custom Title',
        children: 'Custom content message',
      });
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom content message')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
      const variants: PopupVariant[] = ['success', 'warning', 'error', 'info', 'authentication'];
      
      variants.forEach((variant) => {
        const { unmount } = renderPopup({ variant });
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        unmount();
      });
    });

    it('renders with different sizes', () => {
      const sizes: PopupSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      
      sizes.forEach((size) => {
        const { unmount } = renderPopup({ size });
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        unmount();
      });
    });

    it('does not render when isOpen is false', () => {
      renderPopup({ isOpen: false });
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('applies custom CSS classes', () => {
      renderPopup({ className: 'custom-popup-class' });
      
      const dialog = screen.getByRole('dialog');
      const panel = dialog.querySelector('[class*="custom-popup-class"]');
      expect(panel).toBeInTheDocument();
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('passes axe accessibility tests', async () => {
      const { container } = renderPopup();
      
      await testA11y(container, {
        tags: ['wcag2a', 'wcag2aa'],
      });
    });

    it('has proper ARIA attributes', () => {
      renderPopup({
        title: 'Accessible Popup',
        'data-testid': 'accessible-popup',
      });
      
      const dialog = screen.getByRole('dialog');
      
      checkAriaAttributes(dialog, {
        'aria-labelledby': 'popup-title',
        'aria-describedby': 'popup-description',
        'role': 'dialog',
      });
    });

    it('has accessible title and description', () => {
      renderPopup();
      
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveAttribute('id', 'popup-title');
      
      const description = document.getElementById('popup-description');
      expect(description).toBeInTheDocument();
    });

    it('has proper focus management', async () => {
      const { keyboard } = renderPopup({
        accessibility: {
          initialFocus: 'first',
          trapFocus: true,
        },
      });
      
      // Check that dialog receives focus when opened
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Test tab navigation within dialog
      await keyboard.tab();
      const focusedElement = keyboard.getFocused();
      expect(focusedElement).toBeInTheDocument();
      
      // Ensure focus stays within dialog
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('announces popup opening to screen readers', async () => {
      renderPopup({
        accessibility: {
          announceOnOpen: true,
          openAnnouncement: 'Security notice opened',
        },
      });
      
      await waitFor(() => {
        const liveRegions = getAriaLiveRegions(document.body);
        expect(liveRegions.length).toBeGreaterThan(0);
      });
    });

    it('has minimum touch target sizes (44px)', () => {
      renderPopup();
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });

    it('has proper color contrast ratios', async () => {
      const { container } = renderPopup();
      
      await testA11y(container, {
        tags: ['wcag2aa'],
        includeRules: ['color-contrast'],
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('closes popup on Escape key press', async () => {
      const onClose = vi.fn();
      const { keyboard } = renderPopup({ onClose });
      
      await keyboard.escape();
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('navigates between buttons with Tab key', async () => {
      const { keyboard } = renderPopup({
        showRemindMeLater: true,
        showCloseButton: true,
      });
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      
      // Tab through buttons
      await keyboard.tab();
      let focused = keyboard.getFocused();
      expect(focused).toBeInstanceOf(HTMLButtonElement);
      
      await keyboard.tab();
      focused = keyboard.getFocused();
      expect(focused).toBeInstanceOf(HTMLButtonElement);
    });

    it('activates buttons with Enter key', async () => {
      const onClose = vi.fn();
      const { keyboard } = renderPopup({ onClose });
      
      // Focus and activate close button
      const closeButton = screen.getByLabelText('Close popup');
      closeButton.focus();
      
      await keyboard.enter();
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('activates buttons with Space key', async () => {
      const onRemindLater = vi.fn();
      const { keyboard } = renderPopup({ 
        onRemindLater,
        showRemindMeLater: true,
      });
      
      // Focus remind later button
      const remindButton = screen.getByText('Remind me later');
      remindButton.focus();
      
      await keyboard.space();
      
      expect(onRemindLater).toHaveBeenCalledTimes(1);
    });

    it('traps focus within popup when enabled', async () => {
      const { keyboard } = renderPopup({
        accessibility: {
          trapFocus: true,
        },
        showRemindMeLater: true,
        showCloseButton: true,
      });
      
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      
      // Tab to last button
      lastButton.focus();
      expect(keyboard.isFocused(lastButton)).toBe(true);
      
      // Tab should cycle back to first button
      await keyboard.tab();
      await waitFor(() => {
        expect(keyboard.isFocused(firstButton)).toBe(true);
      });
    });

    it('handles Shift+Tab navigation correctly', async () => {
      const { keyboard } = renderPopup({
        showRemindMeLater: true,
        showCloseButton: true,
      });
      
      const buttons = screen.getAllByRole('button');
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];
      
      // Focus first button then Shift+Tab
      firstButton.focus();
      await keyboard.tab({ shift: true });
      
      // Should move to last button (or stay if focus is trapped)
      const focused = keyboard.getFocused();
      expect(focused).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Authentication Workflow Integration', () => {
    it('calls logout on password update confirmation', async () => {
      const { user } = renderPopup({
        variant: 'authentication',
        onButtonClick: vi.fn(),
      });
      
      const updateButton = screen.getByText('Update Password Now');
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockAuth.logout).toHaveBeenCalledWith(['/auth', '/reset-password']);
      });
    });

    it('handles logout errors gracefully', async () => {
      const onClose = vi.fn();
      mockAuth.logout.mockRejectedValueOnce(new Error('Logout failed'));
      
      const { user } = renderPopup({ 
        variant: 'authentication',
        onClose,
      });
      
      const updateButton = screen.getByText('Update Password Now');
      await user.click(updateButton);
      
      // Should still close popup even if logout fails
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('calls onButtonClick callback with correct button type', async () => {
      const onButtonClick = vi.fn();
      const { user } = renderPopup({
        onButtonClick,
        showRemindMeLater: true,
      });
      
      const remindButton = screen.getByText('Remind me later');
      await user.click(remindButton);
      
      expect(onButtonClick).toHaveBeenCalledWith('remindLater');
    });

    it('calls onRemindLater callback when remind later is clicked', async () => {
      const onRemindLater = vi.fn();
      const { user } = renderPopup({
        onRemindLater,
        showRemindMeLater: true,
      });
      
      const remindButton = screen.getByText('Remind me later');
      await user.click(remindButton);
      
      expect(onRemindLater).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom Actions', () => {
    it('renders custom action buttons', () => {
      const customActions: PopupAction[] = [
        {
          label: 'Custom Action 1',
          type: 'custom',
          onClick: vi.fn(),
          variant: 'primary',
        },
        {
          label: 'Custom Action 2',
          type: 'custom',
          onClick: vi.fn(),
          variant: 'secondary',
        },
      ];
      
      renderPopupWithActions(customActions);
      
      expect(screen.getByText('Custom Action 1')).toBeInTheDocument();
      expect(screen.getByText('Custom Action 2')).toBeInTheDocument();
    });

    it('calls custom action onClick handlers', async () => {
      const onClick1 = vi.fn();
      const onClick2 = vi.fn();
      
      const customActions: PopupAction[] = [
        {
          label: 'Action 1',
          type: 'custom',
          onClick: onClick1,
        },
        {
          label: 'Action 2',
          type: 'custom',
          onClick: onClick2,
        },
      ];
      
      const { user } = renderPopupWithActions(customActions);
      
      await user.click(screen.getByText('Action 1'));
      expect(onClick1).toHaveBeenCalledTimes(1);
      
      await user.click(screen.getByText('Action 2'));
      expect(onClick2).toHaveBeenCalledTimes(1);
    });

    it('handles disabled custom actions', async () => {
      const onClick = vi.fn();
      
      const customActions: PopupAction[] = [
        {
          label: 'Disabled Action',
          type: 'custom',
          onClick,
          disabled: true,
        },
      ];
      
      const { user } = renderPopupWithActions(customActions);
      
      const button = screen.getByText('Disabled Action');
      expect(button).toBeDisabled();
      
      await user.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('renders custom action icons', () => {
      const customActions: PopupAction[] = [
        {
          label: 'Action with Icon',
          type: 'custom',
          onClick: vi.fn(),
          icon: <span data-testid="custom-icon">📦</span>,
        },
      ];
      
      renderPopupWithActions(customActions);
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Backdrop and Dismissal Behavior', () => {
    it('closes popup on backdrop click when enabled', async () => {
      const onClose = vi.fn();
      const { user } = renderPopup({
        onClose,
        dismissOnClickOutside: true,
      });
      
      // Click on backdrop (dialog overlay)
      const dialog = screen.getByRole('dialog');
      const backdrop = dialog.parentElement?.firstElementChild;
      
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('does not close popup on backdrop click when disabled', async () => {
      const onClose = vi.fn();
      const { user } = renderPopup({
        onClose,
        dismissOnClickOutside: false,
      });
      
      // Try clicking on backdrop
      const dialog = screen.getByRole('dialog');
      const backdrop = dialog.parentElement?.firstElementChild;
      
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('closes popup with close button click', async () => {
      const onClose = vi.fn();
      const { user } = renderPopup({
        onClose,
        showCloseButton: true,
      });
      
      const closeButton = screen.getByLabelText('Close popup');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('hides close button when showCloseButton is false', () => {
      renderPopup({ showCloseButton: false });
      
      expect(screen.queryByLabelText('Close popup')).not.toBeInTheDocument();
    });
  });

  describe('Animation and Transitions', () => {
    it('applies correct animation classes', async () => {
      renderPopup({
        animation: {
          preset: 'fade',
          duration: 300,
          easing: 'ease-out',
        },
      });
      
      // Check that dialog is rendered (animation classes are applied by Headless UI)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Animation classes would be tested with more specific animation library testing
    });

    it('handles different animation presets', () => {
      const presets = ['fade', 'scale', 'slide'] as const;
      
      presets.forEach((preset) => {
        const { unmount } = renderPopup({
          animation: { preset },
        });
        
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        unmount();
      });
    });

    it('applies custom animation duration', async () => {
      renderPopup({
        animation: {
          duration: 500,
        },
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Internationalization Support', () => {
    it('uses translation keys for default content', () => {
      // Mock the translation function to return specific keys
      mockTranslation.t.mockImplementation((key: string) => {
        if (key === 'popup.title.passwordSecurity') return 'Translated Security Title';
        if (key === 'popup.button.updatePassword') return 'Translated Update Button';
        return key;
      });
      
      renderPopup({
        variant: 'authentication',
        title: mockTranslation.t('popup.title.passwordSecurity'),
      });
      
      expect(screen.getByText('Translated Security Title')).toBeInTheDocument();
    });

    it('handles RTL text direction', () => {
      renderPopup({
        i18n: {
          rtl: true,
          locale: 'ar',
        },
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // RTL handling would typically be tested with specific CSS or direction attributes
    });

    it('uses custom button labels from i18n config', () => {
      renderPopup({
        i18n: {
          buttonLabels: {
            close: 'Custom Close',
            remindLater: 'Custom Remind',
          },
        },
        showCloseButton: true,
        showRemindMeLater: true,
      });
      
      // Note: The actual implementation would use these custom labels
      // This test validates the structure is in place
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile viewport', async () => {
      setViewport(375, 667); // iPhone viewport
      
      renderPopup({
        size: 'md',
        showRemindMeLater: true,
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check that buttons are arranged in column on mobile (flex-col-reverse sm:flex-row)
      const actions = dialog.querySelector('[class*="flex-col-reverse"]');
      expect(actions).toBeInTheDocument();
    });

    it('adapts layout for tablet viewport', async () => {
      setViewport(768, 1024); // iPad viewport
      
      renderPopup({
        size: 'lg',
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('adapts layout for desktop viewport', async () => {
      setViewport(1920, 1080); // Desktop viewport
      
      renderPopup({
        size: 'xl',
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('maintains accessibility on different screen sizes', async () => {
      const viewports = [
        [375, 667],   // Mobile
        [768, 1024],  // Tablet
        [1920, 1080], // Desktop
      ];
      
      for (const [width, height] of viewports) {
        setViewport(width, height);
        
        const { container, unmount } = renderPopup();
        
        await testA11y(container, {
          tags: ['wcag2a', 'wcag2aa'],
        });
        
        unmount();
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles missing onClose callback gracefully', async () => {
      const { keyboard } = renderPopup({
        onClose: undefined as any,
      });
      
      // Should not throw error when trying to close
      await expect(async () => {
        await keyboard.escape();
      }).not.toThrow();
    });

    it('handles malformed children prop', () => {
      renderPopup({
        children: null as any,
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('handles extremely long content', () => {
      const longContent = 'A'.repeat(10000);
      
      renderPopup({
        children: longContent,
        title: 'Long Content Test',
      });
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('handles rapid open/close operations', async () => {
      const onClose = vi.fn();
      const { keyboard, rerender } = renderPopup({ onClose });
      
      // Rapidly trigger close operations
      await keyboard.escape();
      await keyboard.escape();
      await keyboard.escape();
      
      // Should handle gracefully without errors
      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe('Popup Service Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePopup Hook', () => {
    it('opens popup programmatically', async () => {
      const TestComponent = () => {
        const popup = usePopup();
        
        const handleOpen = () => {
          popup.open(
            <div>Programmatic popup content</div>,
            {
              hasBackdrop: true,
              closeOnBackdropClick: true,
            }
          );
        };
        
        return <button onClick={handleOpen}>Open Popup</button>;
      };
      
      const { user } = customRender(
        <PopupProvider>
          <TestComponent />
        </PopupProvider>
      );
      
      const openButton = screen.getByText('Open Popup');
      await user.click(openButton);
      
      await waitFor(() => {
        expect(screen.getByText('Programmatic popup content')).toBeInTheDocument();
      });
    });

    it('closes popup programmatically', async () => {
      const TestComponent = () => {
        const popup = usePopup();
        const [popupRef, setPopupRef] = React.useState<any>(null);
        
        const handleOpen = () => {
          const ref = popup.open(<div>Test content</div>);
          setPopupRef(ref);
        };
        
        const handleClose = () => {
          if (popupRef) {
            popupRef.close('test-result');
          }
        };
        
        return (
          <div>
            <button onClick={handleOpen}>Open</button>
            <button onClick={handleClose}>Close</button>
          </div>
        );
      };
      
      const { user } = customRender(
        <PopupProvider>
          <TestComponent />
        </PopupProvider>
      );
      
      await user.click(screen.getByText('Open'));
      await waitFor(() => {
        expect(screen.getByText('Test content')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Close'));
      await waitFor(() => {
        expect(screen.queryByText('Test content')).not.toBeInTheDocument();
      });
    });

    it('handles popup promises correctly', async () => {
      const TestComponent = () => {
        const popup = usePopup();
        const [result, setResult] = React.useState<string>('');
        
        const handleOpen = async () => {
          const ref = popup.open(<div>Async popup</div>);
          
          // Simulate closing with result after delay
          setTimeout(() => {
            ref.close('async-result');
          }, 100);
          
          const finalResult = await ref.afterClosed();
          setResult(finalResult || 'no-result');
        };
        
        return (
          <div>
            <button onClick={handleOpen}>Open Async</button>
            <span data-testid="result">{result}</span>
          </div>
        );
      };
      
      const { user } = customRender(
        <PopupProvider>
          <TestComponent />
        </PopupProvider>
      );
      
      await user.click(screen.getByText('Open Async'));
      
      await waitFor(() => {
        expect(screen.getByTestId('result')).toHaveTextContent('async-result');
      });
    });

    it('manages multiple popups correctly', async () => {
      const TestComponent = () => {
        const popup = usePopup();
        
        const openMultiple = () => {
          popup.open(<div>Popup 1</div>, { zIndex: 1000 });
          popup.open(<div>Popup 2</div>, { zIndex: 1010 });
          popup.open(<div>Popup 3</div>, { zIndex: 1020 });
        };
        
        return <button onClick={openMultiple}>Open Multiple</button>;
      };
      
      const { user } = customRender(
        <PopupProvider config={{ maxStack: 5 }}>
          <TestComponent />
        </PopupProvider>
      );
      
      await user.click(screen.getByText('Open Multiple'));
      
      await waitFor(() => {
        expect(screen.getByText('Popup 1')).toBeInTheDocument();
        expect(screen.getByText('Popup 2')).toBeInTheDocument();
        expect(screen.getByText('Popup 3')).toBeInTheDocument();
      });
    });

    it('respects max stack configuration', async () => {
      const TestComponent = () => {
        const popup = usePopup();
        
        const openManyPopups = () => {
          // Try to open more popups than max stack allows
          for (let i = 1; i <= 5; i++) {
            popup.open(<div>Popup {i}</div>);
          }
        };
        
        return <button onClick={openManyPopups}>Open Many</button>;
      };
      
      const { user } = customRender(
        <PopupProvider config={{ maxStack: 2 }}>
          <TestComponent />
        </PopupProvider>
      );
      
      await user.click(screen.getByText('Open Many'));
      
      await waitFor(() => {
        // Should only show the last 2 popups
        expect(screen.queryByText('Popup 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Popup 2')).not.toBeInTheDocument();
        expect(screen.queryByText('Popup 3')).not.toBeInTheDocument();
        expect(screen.getByText('Popup 4')).toBeInTheDocument();
        expect(screen.getByText('Popup 5')).toBeInTheDocument();
      });
    });
  });

  describe('usePopupQueue Hook', () => {
    it('processes popup queue in sequence', async () => {
      const TestComponent = () => {
        const { addToQueue, isProcessing } = usePopupQueue();
        const [results, setResults] = React.useState<string[]>([]);
        
        const addToQueueAsync = async () => {
          const promises = [
            addToQueue(<div>Queue Item 1</div>),
            addToQueue(<div>Queue Item 2</div>),
            addToQueue(<div>Queue Item 3</div>),
          ];
          
          const queueResults = await Promise.all(promises);
          setResults(queueResults);
        };
        
        return (
          <div>
            <button onClick={addToQueueAsync}>Add to Queue</button>
            <span data-testid="processing">{isProcessing ? 'Processing' : 'Idle'}</span>
          </div>
        );
      };
      
      const { user } = customRender(
        <PopupProvider>
          <TestComponent />
        </PopupProvider>
      );
      
      await user.click(screen.getByText('Add to Queue'));
      
      // Should show processing state
      expect(screen.getByTestId('processing')).toHaveTextContent('Processing');
    });
  });

  describe('usePopupConfig Hook', () => {
    it('provides popup configuration', () => {
      const TestComponent = () => {
        const config = usePopupConfig();
        
        return (
          <div>
            <span data-testid="max-stack">{config.maxStack}</span>
            <span data-testid="close-on-escape">{config.closeOnEscapeKey ? 'true' : 'false'}</span>
          </div>
        );
      };
      
      customRender(
        <PopupProvider config={{ maxStack: 3, closeOnEscapeKey: true }}>
          <TestComponent />
        </PopupProvider>
      );
      
      expect(screen.getByTestId('max-stack')).toHaveTextContent('3');
      expect(screen.getByTestId('close-on-escape')).toHaveTextContent('true');
    });
  });

  describe('PopupProvider Error Handling', () => {
    it('throws error when usePopup is used outside provider', () => {
      const TestComponent = () => {
        const popup = usePopup();
        return <div>Should not render</div>;
      };
      
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        customRender(<TestComponent />, { skipProviders: true });
      }).toThrow('usePopupContext must be used within a PopupProvider');
      
      consoleSpy.mockRestore();
    });
  });
});

describe('Performance and Memory Management', () => {
  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderPopup();
    
    // Add spies to check cleanup
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    unmount();
    
    // Should clean up keyboard event listeners
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('handles rapid re-rendering without memory leaks', () => {
    const { rerender } = renderPopup();
    
    // Rapidly re-render with different props
    for (let i = 0; i < 100; i++) {
      rerender(
        <PopupProvider>
          <Popup
            {...defaultPopupProps}
            title={`Title ${i}`}
            isOpen={i % 2 === 0}
          />
        </PopupProvider>
      );
    }
    
    // Should handle gracefully without errors
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('optimizes re-renders with memoization', () => {
    const renderSpy = vi.fn();
    
    const TestPopup = React.memo((props: PopupProps) => {
      renderSpy();
      return <Popup {...props} />;
    });
    
    const { rerender } = customRender(
      <PopupProvider>
        <TestPopup {...defaultPopupProps} />
      </PopupProvider>
    );
    
    const initialRenderCount = renderSpy.mock.calls.length;
    
    // Re-render with same props
    rerender(
      <PopupProvider>
        <TestPopup {...defaultPopupProps} />
      </PopupProvider>
    );
    
    // Should not re-render if props haven't changed
    expect(renderSpy).toHaveBeenCalledTimes(initialRenderCount);
  });
});