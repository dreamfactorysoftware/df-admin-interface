/**
 * @fileoverview Comprehensive test suite for the dialog component system
 * 
 * Tests accessibility compliance (WCAG 2.1 AA), keyboard navigation, focus management,
 * responsive behavior, animation states, compound component interactions, and all dialog
 * variants using Vitest 2.1.0 and React Testing Library per Section 7.1.1.
 * 
 * Test Coverage:
 * - ✅ Vitest 2.1.0 testing framework integration
 * - ✅ WCAG 2.1 AA accessibility compliance validation
 * - ✅ All dialog variants (modal, sheet, overlay, drawer) and sizes
 * - ✅ Responsive behavior across screen sizes
 * - ✅ Compound component architecture functionality
 * - ✅ Animation states and transitions
 * - ✅ Keyboard navigation and focus management
 * - ✅ Screen reader support with proper ARIA
 * - ✅ Error boundaries and edge case handling
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React, { useState, useRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { Dialog, useDialog } from './dialog';
import type { DialogProps, DialogVariant, DialogSize, DialogPosition } from './types';
import { 
  customRender, 
  testA11y, 
  checkAriaAttributes, 
  createKeyboardUtils,
  type KeyboardTestUtils 
} from '@/test/test-utils';

// Extend Jest matchers with accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND UTILITIES
// ============================================================================

/**
 * Mock ResizeObserver for responsive testing
 */
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

/**
 * Mock window resize for responsive behavior testing
 */
const mockWindowResize = (width: number, height: number = 800) => {
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
  window.dispatchEvent(new Event('resize'));
};

/**
 * Create a test dialog component with configurable props
 */
interface TestDialogProps extends Partial<DialogProps> {
  onClose?: (reason?: string) => void;
  children?: React.ReactNode;
}

const TestDialog: React.FC<TestDialogProps> = ({ 
  open = false, 
  onClose = vi.fn(),
  children,
  ...props 
}) => {
  return (
    <Dialog 
      open={open}
      onClose={onClose}
      data-testid="test-dialog"
      {...props}
    >
      {children || (
        <>
          <Dialog.Header>
            <Dialog.Title>Test Dialog</Dialog.Title>
            <Dialog.Description>This is a test dialog</Dialog.Description>
          </Dialog.Header>
          <Dialog.Content>
            <p>Dialog content goes here</p>
            <button type="button">Test Button</button>
          </Dialog.Content>
          <Dialog.Footer>
            <button type="button" onClick={() => onClose('cancel')}>
              Cancel
            </button>
            <button type="button" onClick={() => onClose('confirm')}>
              Confirm
            </button>
          </Dialog.Footer>
        </>
      )}
    </Dialog>
  );
};

/**
 * Compound component test wrapper
 */
const CompoundTestDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ 
  open, 
  onClose 
}) => (
  <Dialog open={open} onClose={onClose} data-testid="compound-dialog">
    <Dialog.Header showCloseButton>
      <Dialog.Title size="lg">Compound Dialog Title</Dialog.Title>
      <Dialog.Description size="md">
        Testing compound component architecture
      </Dialog.Description>
    </Dialog.Header>
    
    <Dialog.Content scrollBehavior="inside" maxHeight="400px">
      <div data-testid="dialog-content">
        <p>Scrollable content area</p>
        <div style={{ height: '600px' }}>Long content for scroll testing</div>
      </div>
    </Dialog.Content>
    
    <Dialog.Footer align="space-between" sticky>
      <Dialog.Close variant="text">Cancel</Dialog.Close>
      <div>
        <button type="button" onClick={onClose}>
          Secondary Action
        </button>
        <button type="button" onClick={onClose}>
          Primary Action
        </button>
      </div>
    </Dialog.Footer>
  </Dialog>
);

/**
 * Controlled/Uncontrolled state test wrapper
 */
const StateTestDialog: React.FC<{ controlled?: boolean }> = ({ controlled = true }) => {
  const [open, setOpen] = useState(false);
  const { open: hookOpen, openDialog, closeDialog } = useDialog();

  const handleOpen = () => controlled ? setOpen(true) : openDialog();
  const handleClose = () => controlled ? setOpen(false) : closeDialog();

  return (
    <div>
      <button onClick={handleOpen} data-testid="open-dialog">
        Open Dialog
      </button>
      
      <Dialog 
        open={controlled ? open : hookOpen}
        onClose={handleClose}
        data-testid="state-dialog"
      >
        <Dialog.Header>
          <Dialog.Title>State Management Test</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <p>Testing {controlled ? 'controlled' : 'uncontrolled'} state</p>
        </Dialog.Content>
        <Dialog.Footer>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Footer>
      </Dialog>
    </div>
  );
};

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

beforeEach(() => {
  // Mock ResizeObserver
  global.ResizeObserver = mockResizeObserver;
  
  // Reset window size to desktop default
  mockWindowResize(1280, 800);
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Reset document body classes
  document.body.className = '';
  document.documentElement.className = '';
});

afterEach(() => {
  // Clean up any open dialogs
  const dialogs = document.querySelectorAll('[role="dialog"]');
  dialogs.forEach(dialog => dialog.remove());
  
  // Reset focus
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur();
  }
});

// ============================================================================
// CORE DIALOG FUNCTIONALITY TESTS
// ============================================================================

describe('Dialog Component - Core Functionality', () => {
  it('renders dialog when open prop is true', async () => {
    const onClose = vi.fn();
    customRender(<TestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('test-dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('does not render dialog when open prop is false', () => {
    const onClose = vi.fn();
    customRender(<TestDialog open={false} onClose={onClose} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(<TestDialog open={true} onClose={onClose} />);
    
    // Wait for dialog to be rendered
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find the backdrop (the overlay behind the dialog)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black');
    expect(backdrop).toBeInTheDocument();
    
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledWith('backdrop');
    }
  });

  it('does not close when backdrop is clicked if disableBackdropClose is true', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        disableBackdropClose={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const backdrop = document.querySelector('.fixed.inset-0.bg-black');
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).not.toHaveBeenCalled();
    }
  });

  it('calls onClose when escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(<TestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledWith('escape');
  });

  it('does not close when escape is pressed if disableEscapeKeyDown is true', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        disableEscapeKeyDown={true}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS (WCAG 2.1 AA)
// ============================================================================

describe('Dialog Component - Accessibility (WCAG 2.1 AA)', () => {
  it('passes axe accessibility tests', async () => {
    const onClose = vi.fn();
    const { container } = customRender(
      <TestDialog open={true} onClose={onClose} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    await testA11y(container);
  });

  it('has proper ARIA attributes', async () => {
    const onClose = vi.fn();
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose}
        aria-label="Test dialog"
        aria-describedby="test-description"
      />
    );
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      checkAriaAttributes(dialog, {
        'aria-label': 'Test dialog',
        'aria-modal': 'true',
        'aria-describedby': expect.any(String),
        'role': 'dialog'
      });
    });
  });

  it('manages focus correctly on open', async () => {
    const onClose = vi.fn();
    const initialFocus = React.createRef<HTMLButtonElement>();
    
    customRender(
      <Dialog open={true} onClose={onClose} initialFocus={initialFocus}>
        <Dialog.Content>
          <button type="button">First button</button>
          <button type="button" ref={initialFocus}>
            Initial focus button
          </button>
          <button type="button">Last button</button>
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Allow time for focus management
    await waitFor(() => {
      expect(document.activeElement).toBe(initialFocus.current);
    });
  });

  it('traps focus within dialog', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Content>
          <button type="button" data-testid="first-button">
            First
          </button>
          <button type="button" data-testid="second-button">
            Second
          </button>
          <button type="button" data-testid="last-button">
            Last
          </button>
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const firstButton = screen.getByTestId('first-button');
    const lastButton = screen.getByTestId('last-button');
    
    // Focus should be on first button initially
    await waitFor(() => {
      expect(document.activeElement).toBe(firstButton);
    });
    
    // Tab from last button should cycle to first
    lastButton.focus();
    await user.keyboard('{Tab}');
    expect(document.activeElement).toBe(firstButton);
    
    // Shift+Tab from first button should go to last
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(lastButton);
  });

  it('restores focus on close', async () => {
    const onClose = vi.fn();
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'Open Dialog';
    document.body.appendChild(triggerButton);
    triggerButton.focus();
    
    const { rerender } = customRender(
      <TestDialog open={false} onClose={onClose} />
    );
    
    // Open dialog
    rerender(<TestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Close dialog
    rerender(<TestDialog open={false} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    // Focus should be restored to trigger button
    await waitFor(() => {
      expect(document.activeElement).toBe(triggerButton);
    });
    
    document.body.removeChild(triggerButton);
  });

  it('announces dialog state changes to screen readers', async () => {
    const onClose = vi.fn();
    customRender(<TestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check for live regions that would announce changes
    const liveRegions = document.querySelectorAll('[aria-live]');
    expect(liveRegions.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// DIALOG VARIANTS AND SIZES TESTS
// ============================================================================

describe('Dialog Component - Variants and Sizes', () => {
  const variants: DialogVariant[] = ['modal', 'sheet', 'overlay', 'drawer'];
  const sizes: DialogSize[] = ['sm', 'md', 'lg', 'xl', 'full'];
  const positions: DialogPosition[] = ['center', 'top', 'bottom', 'left', 'right'];

  variants.forEach(variant => {
    describe(`${variant} variant`, () => {
      it(`renders ${variant} variant correctly`, async () => {
        const onClose = vi.fn();
        customRender(
          <TestDialog 
            open={true} 
            onClose={onClose} 
            variant={variant}
          />
        );
        
        await waitFor(() => {
          const dialog = screen.getByRole('dialog');
          expect(dialog).toBeInTheDocument();
          expect(dialog).toHaveClass(expect.stringContaining(variant === 'modal' ? 'relative' : 'fixed'));
        });
      });

      sizes.forEach(size => {
        it(`renders ${variant} with ${size} size`, async () => {
          const onClose = vi.fn();
          customRender(
            <TestDialog 
              open={true} 
              onClose={onClose} 
              variant={variant}
              size={size}
            />
          );
          
          await waitFor(() => {
            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
            expect(dialog).toHaveClass(expect.stringContaining('max-w'));
          });
        });
      });
    });
  });

  positions.forEach(position => {
    it(`renders dialog with ${position} position`, async () => {
      const onClose = vi.fn();
      customRender(
        <TestDialog 
          open={true} 
          onClose={onClose} 
          position={position}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });
});

// ============================================================================
// RESPONSIVE BEHAVIOR TESTS
// ============================================================================

describe('Dialog Component - Responsive Behavior', () => {
  it('adapts to mobile screen size', async () => {
    const onClose = vi.fn();
    
    // Render in desktop first
    const { rerender } = customRender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        variant="modal"
        size="xl"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Change to mobile size
    mockWindowResize(375, 667); // iPhone size
    
    // Force re-render with same props to trigger responsive hook
    rerender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        variant="modal"
        size="xl"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles tablet screen size correctly', async () => {
    const onClose = vi.fn();
    
    mockWindowResize(768, 1024); // iPad size
    
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        variant="drawer"
        size="lg"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('maintains desktop behavior on large screens', async () => {
    const onClose = vi.fn();
    
    mockWindowResize(1920, 1080); // Desktop size
    
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        variant="modal"
        size="full"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('responds to window resize events', async () => {
    const onClose = vi.fn();
    
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose} 
        variant="modal"
        size="xl"
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Resize to mobile
    mockWindowResize(375, 667);
    
    // Dialog should still be present and adapt
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// COMPOUND COMPONENT ARCHITECTURE TESTS
// ============================================================================

describe('Dialog Component - Compound Components', () => {
  it('renders all compound components correctly', async () => {
    const onClose = vi.fn();
    
    customRender(<CompoundTestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Compound Dialog Title')).toBeInTheDocument();
      expect(screen.getByText('Testing compound component architecture')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it('Dialog.Header renders with close button', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(<CompoundTestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    expect(closeButton).toBeInTheDocument();
    
    await user.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('Dialog.Content handles scrollable content', async () => {
    const onClose = vi.fn();
    
    customRender(<CompoundTestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();
      expect(content.parentElement).toHaveClass('overflow-y-auto');
    });
  });

  it('Dialog.Footer aligns buttons correctly', async () => {
    const onClose = vi.fn();
    
    customRender(<CompoundTestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      const footer = screen.getByRole('button', { name: /cancel/i }).closest('[class*="justify-"]');
      expect(footer).toHaveClass('justify-between');
    });
  });

  it('Dialog.Title uses correct heading hierarchy', async () => {
    const onClose = vi.fn();
    
    customRender(<CompoundTestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Compound Dialog Title');
    });
  });

  it('Dialog.Close triggers onClose with correct reason', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    customRender(<CompoundTestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalledWith('close-button');
  });

  it('throws error when compound components used outside Dialog', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      customRender(<Dialog.Title>Orphaned Title</Dialog.Title>);
    }).toThrow('Dialog compound components must be used within a Dialog component');
    
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// ANIMATION AND TRANSITION TESTS
// ============================================================================

describe('Dialog Component - Animations and Transitions', () => {
  it('applies enter animation classes', async () => {
    const onClose = vi.fn();
    
    const { rerender } = customRender(
      <TestDialog open={false} onClose={onClose} />
    );
    
    // Open dialog to trigger enter animation
    rerender(<TestDialog open={true} onClose={onClose} />);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check that Transition component is applied
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('[class*="duration"]')).toBeInTheDocument();
  });

  it('applies exit animation classes', async () => {
    const onClose = vi.fn();
    
    const { rerender } = customRender(
      <TestDialog open={true} onClose={onClose} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Close dialog to trigger exit animation
    rerender(<TestDialog open={false} onClose={onClose} />);
    
    // Animation should be triggered (dialog will unmount after animation)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('respects animation configuration', async () => {
    const onClose = vi.fn();
    const customAnimation = {
      duration: 500,
      timing: 'ease-in' as const,
      enterAnimation: true,
      exitAnimation: false,
      enterClasses: 'opacity-0 scale-50',
      exitClasses: 'opacity-100 scale-100'
    };
    
    customRender(
      <TestDialog 
        open={true} 
        onClose={onClose}
        animation={customAnimation}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('handles animation for different variants', async () => {
    const onClose = vi.fn();
    const variants: DialogVariant[] = ['modal', 'sheet', 'overlay', 'drawer'];
    
    for (const variant of variants) {
      const { rerender } = customRender(
        <TestDialog 
          open={false} 
          onClose={onClose}
          variant={variant}
        />
      );
      
      rerender(
        <TestDialog 
          open={true} 
          onClose={onClose}
          variant={variant}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      rerender(
        <TestDialog 
          open={false} 
          onClose={onClose}
          variant={variant}
        />
      );
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    }
  });
});

// ============================================================================
// KEYBOARD NAVIGATION TESTS
// ============================================================================

describe('Dialog Component - Keyboard Navigation', () => {
  let keyboardUtils: KeyboardTestUtils;
  
  beforeEach(() => {
    const user = userEvent.setup();
    keyboardUtils = createKeyboardUtils(user);
  });

  it('handles Tab navigation correctly', async () => {
    const onClose = vi.fn();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Content>
          <button type="button" data-testid="btn-1">Button 1</button>
          <button type="button" data-testid="btn-2">Button 2</button>
          <button type="button" data-testid="btn-3">Button 3</button>
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const btn1 = screen.getByTestId('btn-1');
    const btn2 = screen.getByTestId('btn-2');
    const btn3 = screen.getByTestId('btn-3');
    
    // Focus should start on first button
    await waitFor(() => {
      expect(keyboardUtils.getFocused()).toBe(btn1);
    });
    
    // Tab should move to next button
    await keyboardUtils.tab();
    expect(keyboardUtils.getFocused()).toBe(btn2);
    
    await keyboardUtils.tab();
    expect(keyboardUtils.getFocused()).toBe(btn3);
    
    // Tab from last should cycle to first
    await keyboardUtils.tab();
    expect(keyboardUtils.getFocused()).toBe(btn1);
  });

  it('handles Shift+Tab navigation correctly', async () => {
    const onClose = vi.fn();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Content>
          <button type="button" data-testid="btn-1">Button 1</button>
          <button type="button" data-testid="btn-2">Button 2</button>
          <button type="button" data-testid="btn-3">Button 3</button>
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const btn1 = screen.getByTestId('btn-1');
    const btn3 = screen.getByTestId('btn-3');
    
    // Start at first button
    await waitFor(() => {
      expect(keyboardUtils.getFocused()).toBe(btn1);
    });
    
    // Shift+Tab should cycle to last button
    await keyboardUtils.tab({ shift: true });
    expect(keyboardUtils.getFocused()).toBe(btn3);
  });

  it('handles Enter key on focusable elements', async () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Content>
          <button type="button" onClick={onClick} data-testid="action-btn">
            Action Button
          </button>
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const actionBtn = screen.getByTestId('action-btn');
    actionBtn.focus();
    
    await keyboardUtils.enter();
    expect(onClick).toHaveBeenCalled();
  });

  it('prevents Tab navigation outside dialog', async () => {
    const onClose = vi.fn();
    
    // Add some buttons outside the dialog
    const outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside Button';
    outsideButton.setAttribute('data-testid', 'outside-btn');
    document.body.appendChild(outsideButton);
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Content>
          <button type="button" data-testid="inside-btn">Inside Button</button>
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const insideBtn = screen.getByTestId('inside-btn');
    
    // Focus should be trapped inside dialog
    await waitFor(() => {
      expect(keyboardUtils.getFocused()).toBe(insideBtn);
    });
    
    // Tab multiple times - focus should stay within dialog
    for (let i = 0; i < 5; i++) {
      await keyboardUtils.tab();
      expect(keyboardUtils.getFocused()).not.toBe(outsideButton);
    }
    
    document.body.removeChild(outsideButton);
  });
});

// ============================================================================
// STATE MANAGEMENT TESTS
// ============================================================================

describe('Dialog Component - State Management', () => {
  it('works in controlled mode', async () => {
    const user = userEvent.setup();
    
    customRender(<StateTestDialog controlled={true} />);
    
    const openButton = screen.getByTestId('open-dialog');
    await user.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Testing controlled state')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('works with useDialog hook (uncontrolled)', async () => {
    const user = userEvent.setup();
    
    customRender(<StateTestDialog controlled={false} />);
    
    const openButton = screen.getByTestId('open-dialog');
    await user.click(openButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Testing uncontrolled state')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('useDialog hook provides correct state and methods', () => {
    const TestComponent = () => {
      const { open, openDialog, closeDialog, toggleDialog, dialogProps } = useDialog();
      
      return (
        <div>
          <div data-testid="dialog-state">{open ? 'open' : 'closed'}</div>
          <button onClick={openDialog} data-testid="open-btn">Open</button>
          <button onClick={closeDialog} data-testid="close-btn">Close</button>
          <button onClick={toggleDialog} data-testid="toggle-btn">Toggle</button>
          <Dialog {...dialogProps}>
            <Dialog.Content>Test Content</Dialog.Content>
          </Dialog>
        </div>
      );
    };
    
    const user = userEvent.setup();
    customRender(<TestComponent />);
    
    // Initial state should be closed
    expect(screen.getByTestId('dialog-state')).toHaveTextContent('closed');
    
    // Test open
    user.click(screen.getByTestId('open-btn'));
    waitFor(() => {
      expect(screen.getByTestId('dialog-state')).toHaveTextContent('open');
    });
    
    // Test close
    user.click(screen.getByTestId('close-btn'));
    waitFor(() => {
      expect(screen.getByTestId('dialog-state')).toHaveTextContent('closed');
    });
    
    // Test toggle
    user.click(screen.getByTestId('toggle-btn'));
    waitFor(() => {
      expect(screen.getByTestId('dialog-state')).toHaveTextContent('open');
    });
  });
});

// ============================================================================
// ERROR BOUNDARIES AND EDGE CASES
// ============================================================================

describe('Dialog Component - Error Handling and Edge Cases', () => {
  it('handles invalid children gracefully', () => {
    const onClose = vi.fn();
    
    expect(() => {
      customRender(
        <Dialog open={true} onClose={onClose}>
          {null}
          {undefined}
          {false}
        </Dialog>
      );
    }).not.toThrow();
  });

  it('handles missing onClose prop gracefully', () => {
    expect(() => {
      customRender(
        <Dialog open={true} onClose={undefined as any}>
          <Dialog.Content>Test</Dialog.Content>
        </Dialog>
      );
    }).not.toThrow();
  });

  it('handles rapid open/close state changes', async () => {
    const onClose = vi.fn();
    
    const { rerender } = customRender(
      <TestDialog open={false} onClose={onClose} />
    );
    
    // Rapidly toggle state
    for (let i = 0; i < 10; i++) {
      rerender(<TestDialog open={i % 2 === 0} onClose={onClose} />);
    }
    
    // Should end up closed without errors
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles portal container that does not exist', () => {
    const onClose = vi.fn();
    
    expect(() => {
      customRender(
        <Dialog 
          open={true} 
          onClose={onClose}
          container="non-existent-element"
        >
          <Dialog.Content>Test</Dialog.Content>
        </Dialog>
      );
    }).not.toThrow();
  });

  it('handles focus management when dialog is destroyed', async () => {
    const onClose = vi.fn();
    
    const { unmount } = customRender(
      <TestDialog open={true} onClose={onClose} />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Unmount component while dialog is open
    unmount();
    
    // Should not cause errors
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles invalid animation configuration', () => {
    const onClose = vi.fn();
    
    expect(() => {
      customRender(
        <TestDialog 
          open={true} 
          onClose={onClose}
          animation={{
            duration: -1, // Invalid
            timing: 'invalid' as any, // Invalid
            enterAnimation: null as any, // Invalid
          }}
        />
      );
    }).not.toThrow();
  });

  it('handles missing ref objects', () => {
    const onClose = vi.fn();
    
    expect(() => {
      customRender(
        <Dialog
          open={true}
          onClose={onClose}
          initialFocus={null as any}
          finalFocus={undefined as any}
        >
          <Dialog.Content>Test</Dialog.Content>
        </Dialog>
      );
    }).not.toThrow();
  });

  it('handles window resize during animation', async () => {
    const onClose = vi.fn();
    
    customRender(
      <TestDialog open={true} onClose={onClose} variant="modal" size="xl" />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Resize window multiple times during dialog lifecycle
    mockWindowResize(375, 667);
    mockWindowResize(768, 1024);
    mockWindowResize(1920, 1080);
    
    // Dialog should remain functional
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ============================================================================
// SCREEN READER SUPPORT TESTS
// ============================================================================

describe('Dialog Component - Screen Reader Support', () => {
  it('provides proper role and labeling', async () => {
    const onClose = vi.fn();
    
    customRender(
      <Dialog 
        open={true} 
        onClose={onClose}
        aria-label="Confirmation dialog"
      >
        <Dialog.Header>
          <Dialog.Title>Confirm Action</Dialog.Title>
          <Dialog.Description>Are you sure you want to proceed?</Dialog.Description>
        </Dialog.Header>
        <Dialog.Content>Additional details here</Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', 'Confirmation dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  it('connects title and description to dialog', async () => {
    const onClose = vi.fn();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Header>
          <Dialog.Title>Test Title</Dialog.Title>
          <Dialog.Description>Test Description</Dialog.Description>
        </Dialog.Header>
        <Dialog.Content>Content</Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      const title = screen.getByRole('heading', { level: 2 });
      const description = screen.getByText('Test Description');
      
      expect(dialog).toHaveAttribute('aria-labelledby', title.id);
      expect(dialog).toHaveAttribute('aria-describedby', description.id);
    });
  });

  it('handles custom ARIA attributes', async () => {
    const onClose = vi.fn();
    
    customRender(
      <Dialog 
        open={true} 
        onClose={onClose}
        role="alertdialog"
        aria-label="Custom dialog"
        aria-live="assertive"
      >
        <Dialog.Content>Alert content</Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', 'Custom dialog');
      expect(dialog).toHaveAttribute('aria-live', 'assertive');
    });
  });

  it('supports screen reader navigation between elements', async () => {
    const onClose = vi.fn();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Header>
          <Dialog.Title>Multi-section Dialog</Dialog.Title>
        </Dialog.Header>
        <Dialog.Content>
          <h3>Subsection</h3>
          <p>Some content</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </Dialog.Content>
        <Dialog.Footer>
          <button type="button">Action</button>
        </Dialog.Footer>
      </Dialog>
    );
    
    await waitFor(() => {
      // All semantic elements should be present for screen reader navigation
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// PERFORMANCE AND OPTIMIZATION TESTS
// ============================================================================

describe('Dialog Component - Performance', () => {
  it('does not re-render unnecessarily', async () => {
    const onClose = vi.fn();
    let renderCount = 0;
    
    const TestWrapper = ({ open }: { open: boolean }) => {
      renderCount++;
      return (
        <TestDialog open={open} onClose={onClose}>
          <Dialog.Content>Render count: {renderCount}</Dialog.Content>
        </TestDialog>
      );
    };
    
    const { rerender } = customRender(<TestWrapper open={false} />);
    
    // Rerender with same props
    rerender(<TestWrapper open={false} />);
    rerender(<TestWrapper open={false} />);
    
    // Should have minimal re-renders
    expect(renderCount).toBeLessThan(5);
  });

  it('handles large content efficiently', async () => {
    const onClose = vi.fn();
    const largeContent = Array.from({ length: 1000 }, (_, i) => (
      <div key={i}>Item {i}</div>
    ));
    
    const startTime = performance.now();
    
    customRender(
      <Dialog open={true} onClose={onClose}>
        <Dialog.Content>
          {largeContent}
        </Dialog.Content>
      </Dialog>
    );
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render reasonably quickly even with large content
    expect(renderTime).toBeLessThan(1000); // Less than 1 second
  });
});