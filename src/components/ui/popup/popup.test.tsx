import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// Extend expect matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => '/test'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock authentication hooks
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

// Mock popup service and components (will be replaced when actual files exist)
const mockPopupService = {
  open: vi.fn(),
  close: vi.fn(),
  isOpen: false,
  config: null,
};

vi.mock('@/components/ui/popup/popup-service', () => ({
  usePopupService: () => mockPopupService,
  popupService: mockPopupService,
}));

// Mock popup component interfaces
interface PopupConfig {
  title?: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  allowBackdropClick?: boolean;
  allowEscapeKey?: boolean;
  focusTrap?: boolean;
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Mock Popup component implementation
const MockPopup = ({ 
  isOpen = false, 
  config = null,
  onClose = vi.fn()
}: {
  isOpen?: boolean;
  config?: PopupConfig | null;
  onClose?: () => void;
}) => {
  if (!isOpen || !config) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && config.allowBackdropClick) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && config.allowEscapeKey) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={config.ariaLabel || config.title}
      aria-describedby={config.ariaDescribedBy || 'popup-message'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid="popup-overlay"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-transform duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
        data-testid="popup-content"
      >
        {config.title && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {config.title}
            </h2>
          </div>
        )}
        
        <div className="px-6 py-4">
          <p 
            id="popup-message"
            className="text-gray-700 dark:text-gray-300"
          >
            {config.message}
          </p>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
          {config.showCancelButton && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              onClick={config.onCancel || onClose}
              data-testid="popup-cancel-button"
            >
              {config.cancelButtonText || 'Cancel'}
            </button>
          )}
          
          {config.showConfirmButton && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={config.onConfirm}
              data-testid="popup-confirm-button"
            >
              {config.confirmButtonText || 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div id="test-root">
        {children}
      </div>
    </QueryClientProvider>
  );
};

describe('Popup Component System', () => {
  const mockPush = vi.fn();
  const mockT = vi.fn((key: string) => key);
  const mockAuth = {
    user: { id: 1, email: 'test@example.com' },
    isAuthenticated: true,
    logout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup router mock
    (useRouter as any).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });

    // Setup i18n mock
    (useTranslation as any).mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });

    // Setup auth mock
    const { useAuth } = vi.mocked(await import('@/hooks/use-auth'));
    (useAuth as any).mockReturnValue(mockAuth);

    // Reset popup service
    mockPopupService.isOpen = false;
    mockPopupService.config = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Popup Component Rendering', () => {
    it('renders popup with required message content', () => {
      const config: PopupConfig = {
        message: 'Test popup message',
        showConfirmButton: true,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(screen.getByText('Test popup message')).toBeInTheDocument();
      expect(screen.getByTestId('popup-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('popup-content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const config: PopupConfig = {
        message: 'Test popup message',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={false} config={config} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('popup-overlay')).not.toBeInTheDocument();
    });

    it('renders with optional title', () => {
      const config: PopupConfig = {
        title: 'Test Title',
        message: 'Test message',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('renders different popup types with appropriate styling', () => {
      const types: Array<PopupConfig['type']> = ['info', 'warning', 'error', 'success', 'confirm'];
      
      types.forEach((type) => {
        const config: PopupConfig = {
          message: `Test ${type} message`,
          type,
        };

        const { unmount } = render(
          <TestWrapper>
            <MockPopup isOpen={true} config={config} />
          </TestWrapper>
        );

        expect(screen.getByText(`Test ${type} message`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Button Configuration', () => {
    it('renders confirm button when showConfirmButton is true', () => {
      const config: PopupConfig = {
        message: 'Test message',
        showConfirmButton: true,
        confirmButtonText: 'Custom Confirm',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const confirmButton = screen.getByTestId('popup-confirm-button');
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toHaveTextContent('Custom Confirm');
    });

    it('renders cancel button when showCancelButton is true', () => {
      const config: PopupConfig = {
        message: 'Test message',
        showCancelButton: true,
        cancelButtonText: 'Custom Cancel',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const cancelButton = screen.getByTestId('popup-cancel-button');
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toHaveTextContent('Custom Cancel');
    });

    it('uses default button text when not specified', () => {
      const config: PopupConfig = {
        message: 'Test message',
        showConfirmButton: true,
        showCancelButton: true,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        showConfirmButton: true,
        onConfirm,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-confirm-button'));

      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        showCancelButton: true,
        onCancel,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-cancel-button'));

      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('has no accessibility violations', async () => {
      const config: PopupConfig = {
        title: 'Accessible Popup',
        message: 'This popup follows WCAG 2.1 AA guidelines',
        showConfirmButton: true,
        showCancelButton: true,
        ariaLabel: 'Confirmation dialog',
      };

      const { container } = render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes', () => {
      const config: PopupConfig = {
        title: 'Test Title',
        message: 'Test message',
        ariaLabel: 'Custom aria label',
        ariaDescribedBy: 'custom-description',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Custom aria label');
      expect(dialog).toHaveAttribute('aria-describedby', 'custom-description');
    });

    it('uses title as aria-label fallback', () => {
      const config: PopupConfig = {
        title: 'Fallback Title',
        message: 'Test message',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Fallback Title');
    });

    it('associates message content with aria-describedby', () => {
      const config: PopupConfig = {
        message: 'Test message content',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      const messageElement = screen.getByText('Test message content');
      
      expect(dialog).toHaveAttribute('aria-describedby', 'popup-message');
      expect(messageElement).toHaveAttribute('id', 'popup-message');
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Escape key when allowEscapeKey is true', () => {
      const onClose = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        allowEscapeKey: true,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} onClose={onClose} />
        </TestWrapper>
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('ignores Escape key when allowEscapeKey is false', () => {
      const onClose = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        allowEscapeKey: false,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} onClose={onClose} />
        </TestWrapper>
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('supports tab navigation between buttons', async () => {
      const config: PopupConfig = {
        message: 'Test message',
        showConfirmButton: true,
        showCancelButton: true,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const cancelButton = screen.getByTestId('popup-cancel-button');
      const confirmButton = screen.getByTestId('popup-confirm-button');

      // Tab to first button
      await user.tab();
      expect(cancelButton).toHaveFocus();

      // Tab to second button
      await user.tab();
      expect(confirmButton).toHaveFocus();
    });

    it('activates buttons with Enter and Space keys', async () => {
      const onConfirm = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        showConfirmButton: true,
        onConfirm,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const confirmButton = screen.getByTestId('popup-confirm-button');
      confirmButton.focus();

      // Test Enter key
      await user.keyboard('{Enter}');
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Test Space key
      await user.keyboard(' ');
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });
  });

  describe('Backdrop Click Behavior', () => {
    it('closes popup on backdrop click when allowBackdropClick is true', async () => {
      const onClose = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        allowBackdropClick: true,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} onClose={onClose} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-overlay'));

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('ignores backdrop click when allowBackdropClick is false', async () => {
      const onClose = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        allowBackdropClick: false,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} onClose={onClose} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-overlay'));

      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not close when clicking on popup content', async () => {
      const onClose = vi.fn();
      const config: PopupConfig = {
        message: 'Test message',
        allowBackdropClick: true,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} onClose={onClose} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-content'));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Authentication Workflow Integration', () => {
    it('handles authentication-related popup actions', async () => {
      const config: PopupConfig = {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again.',
        showConfirmButton: true,
        confirmButtonText: 'Login',
        onConfirm: () => {
          mockAuth.logout();
          mockPush('/login');
        },
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-confirm-button'));

      expect(mockAuth.logout).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('displays user-specific information in popup', () => {
      const config: PopupConfig = {
        title: 'Welcome',
        message: `Hello, ${mockAuth.user.email}! Your account is ready.`,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(screen.getByText('Hello, test@example.com! Your account is ready.')).toBeInTheDocument();
    });
  });

  describe('Internationalization Integration', () => {
    it('uses translated strings from i18n', () => {
      mockT.mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'popup.confirm': 'Confirmer',
          'popup.cancel': 'Annuler',
          'popup.title.warning': 'Avertissement',
        };
        return translations[key] || key;
      });

      const config: PopupConfig = {
        title: mockT('popup.title.warning'),
        message: 'Test message',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: mockT('popup.confirm'),
        cancelButtonText: mockT('popup.cancel'),
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(screen.getByText('Avertissement')).toBeInTheDocument();
      expect(screen.getByText('Confirmer')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    it('updates content when language changes', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockPopup 
            isOpen={true} 
            config={{
              message: mockT('popup.message.test'),
            }} 
          />
        </TestWrapper>
      );

      // English
      mockT.mockReturnValue('Test message in English');
      rerender(
        <TestWrapper>
          <MockPopup 
            isOpen={true} 
            config={{
              message: mockT('popup.message.test'),
            }} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test message in English')).toBeInTheDocument();

      // Spanish
      mockT.mockReturnValue('Mensaje de prueba en español');
      rerender(
        <TestWrapper>
          <MockPopup 
            isOpen={true} 
            config={{
              message: mockT('popup.message.test'),
            }} 
          />
        </TestWrapper>
      );

      expect(screen.getByText('Mensaje de prueba en español')).toBeInTheDocument();
    });
  });

  describe('Popup Service Hook Integration', () => {
    it('opens popup through service', () => {
      const config: PopupConfig = {
        message: 'Service test message',
      };

      act(() => {
        mockPopupService.open(config);
      });

      expect(mockPopupService.open).toHaveBeenCalledWith(config);
    });

    it('closes popup through service', () => {
      act(() => {
        mockPopupService.close();
      });

      expect(mockPopupService.close).toHaveBeenCalledOnce();
    });

    it('tracks popup state through service', () => {
      expect(mockPopupService.isOpen).toBe(false);

      act(() => {
        mockPopupService.isOpen = true;
        mockPopupService.config = { message: 'Test' };
      });

      expect(mockPopupService.isOpen).toBe(true);
      expect(mockPopupService.config).toEqual({ message: 'Test' });
    });
  });

  describe('Animation and Transition Behavior', () => {
    it('applies correct Tailwind CSS classes for transitions', () => {
      const config: PopupConfig = {
        message: 'Animated popup',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const overlay = screen.getByTestId('popup-overlay');
      const content = screen.getByTestId('popup-content');

      expect(overlay).toHaveClass('transition-opacity', 'duration-300');
      expect(content).toHaveClass('transform', 'transition-transform', 'duration-300', 'scale-100');
    });

    it('supports custom CSS classes', () => {
      const config: PopupConfig = {
        message: 'Custom styled popup',
        className: 'custom-popup-class',
      };

      const { container } = render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(container.querySelector('.custom-popup-class')).toBeInTheDocument();
    });
  });

  describe('Responsive Design and Mobile Support', () => {
    beforeEach(() => {
      // Mock matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('renders responsively on mobile viewports', () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const config: PopupConfig = {
        message: 'Mobile responsive popup',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const content = screen.getByTestId('popup-content');
      expect(content).toHaveClass('max-w-md', 'w-full', 'mx-4');
    });

    it('adjusts button layout on small screens', () => {
      const config: PopupConfig = {
        message: 'Mobile buttons test',
        showConfirmButton: true,
        showCancelButton: true,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const buttonContainer = screen.getByTestId('popup-cancel-button').parentElement;
      expect(buttonContainer).toHaveClass('flex', 'space-x-2');
    });

    it('maintains touch-friendly button sizes on mobile', () => {
      const config: PopupConfig = {
        message: 'Touch-friendly test',
        showConfirmButton: true,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const button = screen.getByTestId('popup-confirm-button');
      expect(button).toHaveClass('px-4', 'py-2');
    });
  });

  describe('Focus Management', () => {
    it('traps focus within popup when focusTrap is enabled', async () => {
      const config: PopupConfig = {
        message: 'Focus trap test',
        showConfirmButton: true,
        showCancelButton: true,
        focusTrap: true,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const cancelButton = screen.getByTestId('popup-cancel-button');
      const confirmButton = screen.getByTestId('popup-confirm-button');

      // Start from cancel button
      cancelButton.focus();
      expect(cancelButton).toHaveFocus();

      // Tab forward to confirm button
      await user.tab();
      expect(confirmButton).toHaveFocus();

      // Tab forward should cycle back to cancel button (focus trap)
      await user.tab();
      expect(cancelButton).toHaveFocus();

      // Shift+Tab should go to confirm button
      await user.tab({ shift: true });
      expect(confirmButton).toHaveFocus();
    });

    it('sets initial focus to first interactive element', () => {
      const config: PopupConfig = {
        message: 'Initial focus test',
        showConfirmButton: true,
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const confirmButton = screen.getByTestId('popup-confirm-button');
      expect(confirmButton).toHaveFocus();
    });

    it('restores focus to trigger element when popup closes', async () => {
      // Create a trigger button
      const TriggerComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        
        return (
          <>
            <button 
              onClick={() => setIsOpen(true)}
              data-testid="trigger-button"
            >
              Open Popup
            </button>
            <MockPopup 
              isOpen={isOpen} 
              config={{ message: 'Test' }}
              onClose={() => setIsOpen(false)}
            />
          </>
        );
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <TriggerComponent />
        </TestWrapper>
      );

      const triggerButton = screen.getByTestId('trigger-button');
      
      // Open popup
      await user.click(triggerButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close popup (focus should return to trigger)
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      expect(triggerButton).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('announces popup opening to screen readers', () => {
      const config: PopupConfig = {
        title: 'Important Notification',
        message: 'This is an important message for screen readers',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Important Notification');
    });

    it('provides proper button descriptions for screen readers', () => {
      const config: PopupConfig = {
        message: 'Confirm deletion',
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const confirmButton = screen.getByTestId('popup-confirm-button');
      const cancelButton = screen.getByTestId('popup-cancel-button');

      expect(confirmButton).toHaveAccessibleName('Delete');
      expect(cancelButton).toHaveAccessibleName('Cancel');
    });

    it('associates content with proper ARIA relationships', () => {
      const config: PopupConfig = {
        title: 'Confirmation Required',
        message: 'Are you sure you want to proceed?',
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      const message = screen.getByText('Are you sure you want to proceed?');

      expect(dialog).toHaveAttribute('aria-describedby', 'popup-message');
      expect(message).toHaveAttribute('id', 'popup-message');
    });
  });

  describe('Error Handling', () => {
    it('handles async onConfirm errors gracefully', async () => {
      const onConfirm = vi.fn().mockRejectedValue(new Error('Async error'));
      const config: PopupConfig = {
        message: 'Async test',
        showConfirmButton: true,
        onConfirm,
      };

      const user = userEvent.setup();

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      await user.click(screen.getByTestId('popup-confirm-button'));

      expect(onConfirm).toHaveBeenCalledOnce();
      // Component should not crash on async errors
      expect(screen.getByTestId('popup-content')).toBeInTheDocument();
    });

    it('handles missing configuration gracefully', () => {
      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={null} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('popup-overlay')).not.toBeInTheDocument();
    });

    it('provides fallback values for missing properties', () => {
      const config: PopupConfig = {
        message: 'Minimal config test',
        // Missing optional properties should use defaults
      };

      render(
        <TestWrapper>
          <MockPopup isOpen={true} config={config} />
        </TestWrapper>
      );

      expect(screen.getByText('Minimal config test')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});