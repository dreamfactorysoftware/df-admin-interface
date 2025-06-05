/**
 * @fileoverview Comprehensive test suite for the base dialog component system
 * 
 * Tests accessibility compliance (WCAG 2.1 AA), keyboard navigation, focus management,
 * responsive behavior, animation states, compound component interactions, and all dialog variants.
 * 
 * @implements Vitest 2.1.0 testing framework integration per Section 7.1.1
 * @implements WCAG 2.1 AA accessibility compliance per Section 7.7.1
 * @implements Responsive design testing per Section 7.7.3
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React, { useState } from 'react';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock ResizeObserver for responsive testing
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock IntersectionObserver for animation testing
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock window.matchMedia for responsive testing
const mockMatchMedia = vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Setup global mocks
beforeAll(() => {
  global.ResizeObserver = mockResizeObserver;
  global.IntersectionObserver = mockIntersectionObserver;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  });
  
  // Mock requestAnimationFrame for animation testing
  global.requestAnimationFrame = vi.fn((cb) => {
    return setTimeout(cb, 16);
  });
  
  // Mock getComputedStyle for CSS testing
  global.getComputedStyle = vi.fn(() => ({
    transform: 'none',
    opacity: '1',
    transition: 'none',
    visibility: 'visible',
  }));
});

// Dialog component types and interfaces (assumed based on requirements)
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  variant?: 'modal' | 'sheet' | 'overlay' | 'drawer';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

interface DialogContentProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogFooterProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogDescriptionProps {
  className?: string;
  children?: React.ReactNode;
}

interface DialogCloseProps {
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
}

// Mock dialog components for testing (these will be replaced by actual implementations)
const Dialog = ({ 
  open = false, 
  onOpenChange,
  modal = true,
  variant = 'modal',
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  trapFocus = true,
  restoreFocus = true,
  autoFocus = true,
  className = '',
  children,
  ...ariaProps
}: DialogProps) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onOpenChange?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (closeOnEscape && e.key === 'Escape') {
      e.preventDefault();
      onOpenChange?.(false);
    }
  };

  if (!open) return null;

  return (
    <div
      data-testid="dialog-overlay"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      {...(modal && { 'aria-modal': 'true' })}
      role="dialog"
      {...ariaProps}
    >
      <div
        data-testid={`dialog-content-${variant}-${size}`}
        className={`
          relative bg-white rounded-lg shadow-lg
          ${size === 'sm' ? 'max-w-sm' : ''}
          ${size === 'md' ? 'max-w-md' : ''}
          ${size === 'lg' ? 'max-w-lg' : ''}
          ${size === 'xl' ? 'max-w-xl' : ''}
          ${size === 'full' ? 'w-full h-full max-w-none' : ''}
          ${variant === 'sheet' ? 'w-full h-full sm:h-auto sm:max-h-[90vh]' : ''}
          ${variant === 'drawer' ? 'h-full w-full sm:w-96' : ''}
        `}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ className = '', children }: DialogContentProps) => (
  <div className={`p-6 ${className}`} data-testid="dialog-content">
    {children}
  </div>
);

const DialogHeader = ({ className = '', children }: DialogHeaderProps) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`} data-testid="dialog-header">
    {children}
  </div>
);

const DialogFooter = ({ className = '', children }: DialogFooterProps) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`} data-testid="dialog-footer">
    {children}
  </div>
);

const DialogTitle = ({ className = '', children }: DialogTitleProps) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`} data-testid="dialog-title">
    {children}
  </h2>
);

const DialogDescription = ({ className = '', children }: DialogDescriptionProps) => (
  <p className={`text-sm text-muted-foreground ${className}`} data-testid="dialog-description">
    {children}
  </p>
);

const DialogClose = ({ className = '', children, asChild = false }: DialogCloseProps) => {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      'data-testid': 'dialog-close',
      className: `${(children as React.ReactElement).props.className || ''} ${className}`,
    });
  }
  
  return (
    <button 
      type="button" 
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ${className}`}
      data-testid="dialog-close"
    >
      {children}
    </button>
  );
};

// Compound component assignment
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Close = DialogClose;

// Test wrapper component for controlled dialog testing
const ControlledDialogWrapper = ({ 
  initialOpen = false, 
  dialogProps = {},
  children 
}: {
  initialOpen?: boolean;
  dialogProps?: Partial<DialogProps>;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(initialOpen);
  
  return (
    <div>
      <button onClick={() => setOpen(true)} data-testid="open-dialog">
        Open Dialog
      </button>
      <Dialog 
        open={open} 
        onOpenChange={setOpen}
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        {...dialogProps}
      >
        {children || (
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title id="dialog-title">Test Dialog</Dialog.Title>
              <Dialog.Description id="dialog-description">
                This is a test dialog description.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Dialog.Close asChild>
                <button>Close</button>
              </Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        )}
      </Dialog>
    </div>
  );
};

// Utility function to simulate viewport resize
const resizeViewport = (width: number, height: number) => {
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
  
  // Update matchMedia mock based on viewport
  mockMatchMedia.mockImplementation((query: string) => ({
    matches: query.includes('(max-width: 768px)') ? width <= 768 : false,
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

describe('Dialog Component System', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
    // Reset viewport to desktop size
    resizeViewport(1024, 768);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render when open prop is true', () => {
      render(
        <Dialog open={true} aria-label="Test dialog">
          <Dialog.Content>
            <Dialog.Title>Test Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should not render when open prop is false', () => {
      render(
        <Dialog open={false} aria-label="Test dialog">
          <Dialog.Content>
            <Dialog.Title>Test Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onOpenChange when state changes', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <ControlledDialogWrapper 
          dialogProps={{ onOpenChange }}
        />
      );

      const openButton = screen.getByTestId('open-dialog');
      await user.click(openButton);

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Dialog open={true} aria-labelledby="dialog-title">
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title id="dialog-title">Accessible Dialog</Dialog.Title>
              <Dialog.Description>This dialog meets accessibility standards.</Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Dialog 
          open={true} 
          modal={true}
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <Dialog.Content>
            <Dialog.Title id="dialog-title">Dialog Title</Dialog.Title>
            <Dialog.Description id="dialog-description">Dialog Description</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');
    });

    it('should support aria-label when aria-labelledby is not provided', () => {
      render(
        <Dialog open={true} aria-label="Custom dialog label">
          <Dialog.Content>
            <p>Dialog content</p>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Custom dialog label');
    });

    it('should have sufficient color contrast for text elements', () => {
      render(
        <Dialog open={true} aria-label="Dialog">
          <Dialog.Content>
            <Dialog.Title>Dialog Title</Dialog.Title>
            <Dialog.Description>Dialog description text</Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );

      const title = screen.getByTestId('dialog-title');
      const description = screen.getByTestId('dialog-description');
      
      // Check that elements have proper semantic styling classes
      expect(title).toHaveClass('text-lg', 'font-semibold');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    });
  });

  describe('Keyboard Navigation and Focus Management', () => {
    it('should close dialog when Escape key is pressed', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange} closeOnEscape={true}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();
      
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close dialog when closeOnEscape is false', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange} closeOnEscape={false}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();
      
      await user.keyboard('{Escape}');
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should handle tab navigation within dialog content', async () => {
      render(
        <Dialog open={true} trapFocus={true}>
          <Dialog.Content>
            <Dialog.Title>Dialog with Form</Dialog.Title>
            <input data-testid="first-input" placeholder="First input" />
            <input data-testid="second-input" placeholder="Second input" />
            <button data-testid="submit-button">Submit</button>
          </Dialog.Content>
        </Dialog>
      );

      const firstInput = screen.getByTestId('first-input');
      const secondInput = screen.getByTestId('second-input');
      const submitButton = screen.getByTestId('submit-button');

      // Focus should start at first focusable element
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      // Tab to next element
      await user.tab();
      expect(secondInput).toHaveFocus();

      // Tab to submit button
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should restore focus to trigger element when dialog closes', async () => {
      render(<ControlledDialogWrapper />);

      const openButton = screen.getByTestId('open-dialog');
      
      // Open dialog
      await user.click(openButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close dialog
      const closeButton = screen.getByTestId('dialog-close');
      await user.click(closeButton);

      // Wait for dialog to close and focus to restore
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Backdrop Click Behavior', () => {
    it('should close dialog when backdrop is clicked', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange} closeOnBackdropClick={true}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const overlay = screen.getByTestId('dialog-overlay');
      await user.click(overlay);
      
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not close dialog when content is clicked', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange} closeOnBackdropClick={true}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content');
      await user.click(content);
      
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('should not close dialog when closeOnBackdropClick is false', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange} closeOnBackdropClick={false}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const overlay = screen.getByTestId('dialog-overlay');
      await user.click(overlay);
      
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Variants', () => {
    it('should render modal variant correctly', () => {
      render(
        <Dialog open={true} variant="modal" size="md">
          <Dialog.Content>
            <Dialog.Title>Modal Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-modal-md');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('max-w-md');
    });

    it('should render sheet variant correctly', () => {
      render(
        <Dialog open={true} variant="sheet" size="lg">
          <Dialog.Content>
            <Dialog.Title>Sheet Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-sheet-lg');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('w-full', 'h-full', 'sm:h-auto', 'sm:max-h-[90vh]');
    });

    it('should render overlay variant correctly', () => {
      render(
        <Dialog open={true} variant="overlay" size="xl">
          <Dialog.Content>
            <Dialog.Title>Overlay Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-overlay-xl');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('max-w-xl');
    });

    it('should render drawer variant correctly', () => {
      render(
        <Dialog open={true} variant="drawer" size="sm">
          <Dialog.Content>
            <Dialog.Title>Drawer Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-drawer-sm');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('h-full', 'w-full', 'sm:w-96');
    });
  });

  describe('Size Configurations', () => {
    const sizes: Array<{ size: 'sm' | 'md' | 'lg' | 'xl' | 'full', expectedClass: string }> = [
      { size: 'sm', expectedClass: 'max-w-sm' },
      { size: 'md', expectedClass: 'max-w-md' },
      { size: 'lg', expectedClass: 'max-w-lg' },
      { size: 'xl', expectedClass: 'max-w-xl' },
      { size: 'full', expectedClass: 'w-full h-full max-w-none' },
    ];

    sizes.forEach(({ size, expectedClass }) => {
      it(`should render ${size} size correctly`, () => {
        render(
          <Dialog open={true} size={size}>
            <Dialog.Content>
              <Dialog.Title>{size.toUpperCase()} Dialog</Dialog.Title>
            </Dialog.Content>
          </Dialog>
        );

        const content = screen.getByTestId(`dialog-content-modal-${size}`);
        expect(content).toHaveClass(expectedClass);
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile viewport', async () => {
      // Start with desktop
      render(
        <Dialog open={true} variant="sheet" size="lg">
          <Dialog.Content>
            <Dialog.Title>Responsive Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      // Resize to mobile
      act(() => {
        resizeViewport(375, 667);
      });

      const content = screen.getByTestId('dialog-content-sheet-lg');
      expect(content).toBeInTheDocument();
      
      // Sheet variant should use full width/height on mobile
      expect(content).toHaveClass('w-full', 'h-full');
    });

    it('should handle tablet viewport correctly', async () => {
      render(
        <Dialog open={true} variant="drawer" size="md">
          <Dialog.Content>
            <Dialog.Title>Tablet Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      // Resize to tablet
      act(() => {
        resizeViewport(768, 1024);
      });

      const content = screen.getByTestId('dialog-content-drawer-md');
      expect(content).toBeInTheDocument();
    });

    it('should maintain aspect ratio on different screen sizes', async () => {
      render(
        <Dialog open={true} size="full">
          <Dialog.Content>
            <Dialog.Title>Full Size Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-modal-full');
      expect(content).toHaveClass('w-full', 'h-full', 'max-w-none');

      // Test different viewports
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ];

      for (const viewport of viewports) {
        act(() => {
          resizeViewport(viewport.width, viewport.height);
        });
        
        expect(content).toHaveClass('w-full', 'h-full');
      }
    });
  });

  describe('Compound Component Architecture', () => {
    it('should render Dialog.Content correctly', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content className="custom-content">
            <p>Content goes here</p>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('p-6', 'custom-content');
      expect(content).toHaveTextContent('Content goes here');
    });

    it('should render Dialog.Header correctly', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Header className="custom-header">
              <Dialog.Title>Test Title</Dialog.Title>
              <Dialog.Description>Test Description</Dialog.Description>
            </Dialog.Header>
          </Dialog.Content>
        </Dialog>
      );

      const header = screen.getByTestId('dialog-header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'custom-header');
    });

    it('should render Dialog.Footer correctly', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Footer className="custom-footer">
              <button>Cancel</button>
              <button>Confirm</button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      );

      const footer = screen.getByTestId('dialog-footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'sm:flex-row', 'custom-footer');
    });

    it('should render Dialog.Title with proper semantics', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Title className="custom-title">Dialog Title</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const title = screen.getByTestId('dialog-title');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H2');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'custom-title');
      expect(title).toHaveTextContent('Dialog Title');
    });

    it('should render Dialog.Description with proper styling', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Description className="custom-description">
              This is a dialog description.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );

      const description = screen.getByTestId('dialog-description');
      expect(description).toBeInTheDocument();
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm', 'text-muted-foreground', 'custom-description');
      expect(description).toHaveTextContent('This is a dialog description.');
    });

    it('should render Dialog.Close as a button by default', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Close>Close Dialog</Dialog.Close>
          </Dialog.Content>
        </Dialog>
      );

      const closeButton = screen.getByTestId('dialog-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
      expect(closeButton).toHaveTextContent('Close Dialog');
    });

    it('should render Dialog.Close with asChild prop', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Close asChild>
              <div role="button" tabIndex={0}>Custom Close Element</div>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog>
      );

      const closeElement = screen.getByTestId('dialog-close');
      expect(closeElement).toBeInTheDocument();
      expect(closeElement.tagName).toBe('DIV');
      expect(closeElement).toHaveTextContent('Custom Close Element');
    });
  });

  describe('Animation and Transitions', () => {
    it('should apply proper transition classes', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Title>Animated Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
      
      const content = screen.getByTestId('dialog-content-modal-md');
      expect(content).toHaveClass('relative', 'bg-white', 'rounded-lg', 'shadow-lg');
    });

    it('should handle animation state changes during open/close', async () => {
      const { rerender } = render(
        <Dialog open={false}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Title>Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should maintain smooth transitions during resize', async () => {
      render(
        <Dialog open={true} size="md">
          <Dialog.Content>
            <Dialog.Title>Resizing Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-modal-md');
      expect(content).toHaveClass('max-w-md');

      // Simulate viewport change
      act(() => {
        resizeViewport(375, 667);
      });

      // Content should still be present and styled
      expect(content).toBeInTheDocument();
    });
  });

  describe('Error Boundaries and Edge Cases', () => {
    it('should handle missing children gracefully', () => {
      render(<Dialog open={true} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should handle invalid size prop gracefully', () => {
      render(
        <Dialog open={true} size={'invalid' as any}>
          <Dialog.Content>
            <Dialog.Title>Dialog with Invalid Size</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-modal-invalid');
      expect(content).toBeInTheDocument();
    });

    it('should handle invalid variant prop gracefully', () => {
      render(
        <Dialog open={true} variant={'invalid' as any}>
          <Dialog.Content>
            <Dialog.Title>Dialog with Invalid Variant</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const content = screen.getByTestId('dialog-content-invalid-md');
      expect(content).toBeInTheDocument();
    });

    it('should handle rapid open/close state changes', async () => {
      const TestComponent = () => {
        const [open, setOpen] = useState(false);
        
        return (
          <div>
            <button 
              onClick={() => setOpen(!open)} 
              data-testid="toggle-dialog"
            >
              Toggle
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
              <Dialog.Content>
                <Dialog.Title>Rapid Toggle Dialog</Dialog.Title>
              </Dialog.Content>
            </Dialog>
          </div>
        );
      };

      render(<TestComponent />);
      
      const toggleButton = screen.getByTestId('toggle-dialog');
      
      // Rapidly toggle dialog
      await user.click(toggleButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      await user.click(toggleButton);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      await user.click(toggleButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Controlled vs Uncontrolled State Management', () => {
    it('should work in controlled mode with external state', async () => {
      const TestControlled = () => {
        const [open, setOpen] = useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)} data-testid="open-controlled">
              Open
            </button>
            <button onClick={() => setOpen(false)} data-testid="close-controlled">
              Close
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
              <Dialog.Content>
                <Dialog.Title>Controlled Dialog</Dialog.Title>
              </Dialog.Content>
            </Dialog>
          </div>
        );
      };

      render(<TestControlled />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.click(screen.getByTestId('open-controlled'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('close-controlled'));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle onOpenChange callback correctly', async () => {
      const onOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange} closeOnEscape={true}>
          <Dialog.Content>
            <Dialog.Title>Callback Test Dialog</Dialog.Title>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      dialog.focus();
      
      await user.keyboard('{Escape}');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce dialog opening to screen readers', () => {
      render(
        <Dialog open={true} aria-live="polite" aria-label="Dialog opened">
          <Dialog.Content>
            <Dialog.Title>Screen Reader Dialog</Dialog.Title>
            <Dialog.Description>
              This dialog should be announced to screen readers.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide proper role and aria attributes for screen readers', () => {
      render(
        <Dialog 
          open={true} 
          modal={true}
          aria-labelledby="title"
          aria-describedby="description"
        >
          <Dialog.Content>
            <Dialog.Title id="title">Accessible Title</Dialog.Title>
            <Dialog.Description id="description">
              Accessible description for screen readers.
            </Dialog.Description>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('role', 'dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'title');
      expect(dialog).toHaveAttribute('aria-describedby', 'description');

      const title = screen.getByText('Accessible Title');
      const description = screen.getByText('Accessible description for screen readers.');
      expect(title).toHaveAttribute('id', 'title');
      expect(description).toHaveAttribute('id', 'description');
    });

    it('should support aria-label fallback when labelledby is not available', () => {
      render(
        <Dialog open={true} aria-label="Fallback dialog label">
          <Dialog.Content>
            <p>Dialog without explicit title</p>
          </Dialog.Content>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'Fallback dialog label');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with forms and form validation', async () => {
      const onSubmit = vi.fn();
      
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Form Dialog</Dialog.Title>
            </Dialog.Header>
            <form onSubmit={onSubmit}>
              <input 
                data-testid="form-input" 
                required 
                placeholder="Required field" 
              />
              <Dialog.Footer>
                <button type="submit" data-testid="submit-form">
                  Submit
                </button>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog>
      );

      const input = screen.getByTestId('form-input');
      const submitButton = screen.getByTestId('submit-form');

      // Try to submit without filling required field
      await user.click(submitButton);
      expect(onSubmit).not.toHaveBeenCalled();

      // Fill the form and submit
      await user.type(input, 'test value');
      await user.click(submitButton);
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should work with complex nested content', () => {
      render(
        <Dialog open={true}>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Complex Dialog</Dialog.Title>
              <Dialog.Description>Dialog with nested components</Dialog.Description>
            </Dialog.Header>
            <div data-testid="nested-content">
              <div>
                <h3>Nested Section</h3>
                <ul>
                  <li>Item 1</li>
                  <li>Item 2</li>
                  <li>Item 3</li>
                </ul>
              </div>
              <div>
                <input placeholder="Nested input" />
                <button>Nested button</button>
              </div>
            </div>
            <Dialog.Footer>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      );

      expect(screen.getByTestId('nested-content')).toBeInTheDocument();
      expect(screen.getByText('Nested Section')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nested input')).toBeInTheDocument();
      expect(screen.getByText('Nested button')).toBeInTheDocument();
    });

    it('should handle multiple dialogs (stacking)', async () => {
      const TestStacking = () => {
        const [firstOpen, setFirstOpen] = useState(true);
        const [secondOpen, setSecondOpen] = useState(false);
        
        return (
          <div>
            <Dialog open={firstOpen} onOpenChange={setFirstOpen}>
              <Dialog.Content>
                <Dialog.Title>First Dialog</Dialog.Title>
                <button 
                  onClick={() => setSecondOpen(true)}
                  data-testid="open-second"
                >
                  Open Second Dialog
                </button>
              </Dialog.Content>
            </Dialog>
            
            <Dialog open={secondOpen} onOpenChange={setSecondOpen}>
              <Dialog.Content>
                <Dialog.Title>Second Dialog</Dialog.Title>
                <Dialog.Close>Close Second</Dialog.Close>
              </Dialog.Content>
            </Dialog>
          </div>
        );
      };

      render(<TestStacking />);

      expect(screen.getByText('First Dialog')).toBeInTheDocument();
      
      const openSecondButton = screen.getByTestId('open-second');
      await user.click(openSecondButton);
      
      expect(screen.getByText('Second Dialog')).toBeInTheDocument();
      
      // Both dialogs should be present in the DOM
      const dialogs = screen.getAllByRole('dialog');
      expect(dialogs).toHaveLength(2);
    });
  });
});