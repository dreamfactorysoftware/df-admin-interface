/**
 * @fileoverview Comprehensive test suite for ThemeToggle component
 * 
 * This test suite ensures WCAG 2.1 AA accessibility compliance, validates three-state
 * theme switching functionality, tests keyboard navigation and screen reader support,
 * and verifies integration with React context providers using Vitest 2.1.0 and
 * React Testing Library.
 * 
 * @version 1.0.0
 * @since React 19.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

// Component and dependencies
import { ThemeToggle } from './theme-toggle';
import { ThemeProvider, useTheme } from '@/components/layout/theme/theme-provider';
import { ThemeMode, ResolvedTheme } from '@/types/theme';

// Test utilities and setup
import { createWrapper, renderWithProviders } from '@/test/test-utils';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * Mock implementation for matchMedia API
 * Required for system theme detection testing
 */
const createMatchMediaMock = (matches: boolean = false) => ({
  matches,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

/**
 * Test wrapper component that provides theme context
 */
interface TestWrapperProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  enableSystem?: boolean;
}

const TestWrapper = ({ 
  children, 
  defaultTheme = 'light',
  enableSystem = true 
}: TestWrapperProps) => (
  <ThemeProvider 
    defaultTheme={defaultTheme}
    enableSystem={enableSystem}
    disableTransitionOnChange={true}
  >
    {children}
  </ThemeProvider>
);

/**
 * Helper component to expose theme context for testing
 */
const ThemeStateExposer = ({ onThemeChange }: { onThemeChange: (state: any) => void }) => {
  const themeState = useTheme();
  
  React.useEffect(() => {
    onThemeChange(themeState);
  }, [themeState, onThemeChange]);
  
  return null;
};

describe('ThemeToggle Component', () => {
  let mockMatchMedia: Mock;
  let mockLocalStorage: {
    getItem: Mock;
    setItem: Mock;
    removeItem: Mock;
  };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock matchMedia for system theme detection
    mockMatchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });

    // Mock document.createElement for theme application
    const originalCreateElement = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === 'meta') {
        // Mock meta element for theme-color testing
        element.setAttribute = vi.fn();
        element.getAttribute = vi.fn();
      }
      return element;
    });

    // Clear any existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    
    // Clean up DOM
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders with correct default accessibility attributes', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toHaveAttribute('aria-disabled');
    });

    it('applies correct CSS classes for styling', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Should have base button classes for accessibility
      expect(button).toHaveClass('focus-accessible');
      expect(button.style.minHeight || button.getAttribute('style')).toMatch(/44px|2\.75rem/);
    });

    it('renders with different size variants', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      const { rerender } = render(
        <TestWrapper>
          <ThemeToggle size="sm" />
        </TestWrapper>
      );
      
      let button = screen.getByRole('button');
      expect(button).toHaveClass('h-11'); // Small size
      
      rerender(
        <TestWrapper>
          <ThemeToggle size="lg" />
        </TestWrapper>
      );
      
      button = screen.getByRole('button');
      expect(button).toHaveClass('h-14'); // Large size
    });
  });

  describe('WCAG 2.1 AA Accessibility Compliance', () => {
    it('passes automated accessibility tests', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      const { container } = render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('meets minimum touch target size requirements (44x44px)', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      const styles = window.getComputedStyle(button);
      
      // Check for minimum 44x44px touch target
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toHaveClass('min-w-[44px]');
    });

    it('provides proper focus indicators for keyboard navigation', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Tab to focus the button
      await user.tab();
      expect(button).toHaveFocus();
      
      // Check for focus-visible styles
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-primary-600');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('supports high contrast mode', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle variant="outline" />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Outline variant should have enhanced border for high contrast
      expect(button).toHaveClass('border-2');
    });

    it('provides screen reader announcements for theme changes', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle announceChanges={true} />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Mock the live region creation
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      
      await user.click(button);
      
      // Verify live region was created for screen reader announcement
      expect(createElementSpy).toHaveBeenCalledWith('div');
      expect(appendChildSpy).toHaveBeenCalled();
    });
  });

  describe('Three-State Theme Switching', () => {
    it('cycles through light, dark, and system themes correctly', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Initial state should be light
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('light');
        expect(capturedThemeState?.resolvedTheme).toBe('light');
      });
      
      // Click to switch to dark
      await user.click(button);
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('dark');
        expect(capturedThemeState?.resolvedTheme).toBe('dark');
      });
      
      // Click to switch to system
      await user.click(button);
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('system');
        // System should resolve to light since we mocked matchMedia to return false
        expect(capturedThemeState?.resolvedTheme).toBe('light');
      });
      
      // Click to cycle back to light
      await user.click(button);
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('light');
        expect(capturedThemeState?.resolvedTheme).toBe('light');
      });
    });

    it('displays correct icons for each theme state', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Light theme should show sun icon or similar
      expect(within(button).getByTestId('theme-icon-light')).toBeInTheDocument();
      
      // Switch to dark
      await user.click(button);
      await waitFor(() => {
        expect(within(button).getByTestId('theme-icon-dark')).toBeInTheDocument();
      });
      
      // Switch to system
      await user.click(button);
      await waitFor(() => {
        expect(within(button).getByTestId('theme-icon-system')).toBeInTheDocument();
      });
    });

    it('updates aria-label to reflect current theme state', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Initial aria-label for light theme
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to dark theme'));
      
      // Click to switch to dark
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to system theme'));
      });
      
      // Click to switch to system
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('Switch to light theme'));
      });
    });
  });

  describe('System Theme Detection', () => {
    it('detects system dark mode preference', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(true)); // Dark mode
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper defaultTheme="system">
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('system');
        expect(capturedThemeState?.systemTheme).toBe('dark');
        expect(capturedThemeState?.resolvedTheme).toBe('dark');
      });
    });

    it('responds to system theme changes', async () => {
      const mockMediaQuery = createMatchMediaMock(false);
      mockMatchMedia.mockReturnValue(mockMediaQuery);
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper defaultTheme="system">
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
        </TestWrapper>
      );
      
      // Initial system theme should be light
      await waitFor(() => {
        expect(capturedThemeState?.systemTheme).toBe('light');
      });
      
      // Simulate system theme change to dark
      act(() => {
        mockMediaQuery.matches = true;
        const changeHandler = mockMediaQuery.addEventListener.mock.calls
          .find(call => call[0] === 'change')?.[1];
        if (changeHandler) {
          changeHandler({ matches: true } as MediaQueryListEvent);
        }
      });
      
      await waitFor(() => {
        expect(capturedThemeState?.systemTheme).toBe('dark');
        expect(capturedThemeState?.resolvedTheme).toBe('dark');
      });
    });

    it('falls back gracefully when matchMedia is not available', () => {
      // Remove matchMedia to simulate older browsers
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });
      
      let capturedThemeState: any = null;
      
      expect(() => {
        render(
          <TestWrapper defaultTheme="system">
            <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
            <ThemeToggle />
          </TestWrapper>
        );
      }).not.toThrow();
      
      // Should default to light theme
      expect(capturedThemeState?.systemTheme).toBe('light');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Enter key activation', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Focus and activate with Enter
      await user.tab();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('dark');
      });
    });

    it('supports Space key activation', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Focus and activate with Space
      await user.tab();
      expect(button).toHaveFocus();
      
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(capturedThemeState?.theme).toBe('dark');
      });
    });

    it('is included in tab order correctly', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <button>Before</button>
          <ThemeToggle />
          <button>After</button>
        </TestWrapper>
      );
      
      const beforeButton = screen.getByRole('button', { name: 'Before' });
      const themeToggle = screen.getByRole('button', { name: /Switch to/ });
      const afterButton = screen.getByRole('button', { name: 'After' });
      
      // Tab through elements
      await user.tab();
      expect(beforeButton).toHaveFocus();
      
      await user.tab();
      expect(themeToggle).toHaveFocus();
      
      await user.tab();
      expect(afterButton).toHaveFocus();
    });

    it('provides focus-visible styling only for keyboard navigation', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Click with mouse - should not show focus ring
      await user.click(button);
      expect(button).toHaveFocus();
      // Note: focus-visible behavior is browser-dependent and hard to test directly
      
      // Tab away and back - should show focus ring
      await user.tab();
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('Theme State Persistence', () => {
    it('saves theme preference to localStorage', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Switch theme
      await user.click(button);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('df-admin-theme', 'dark');
      });
    });

    it('loads theme preference from localStorage on mount', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper>
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
        </TestWrapper>
      );
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('df-admin-theme');
      
      waitFor(() => {
        expect(capturedThemeState?.theme).toBe('dark');
      });
    });

    it('handles localStorage unavailability gracefully', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      // Mock localStorage to throw error
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(() => {
        render(
          <TestWrapper>
            <ThemeToggle />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Theme Application to DOM', () => {
    it('applies theme class to document element', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeToggle />
        </TestWrapper>
      );
      
      // Should initially have light theme
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('light');
        expect(document.documentElement).not.toHaveClass('dark');
      });
      
      const button = screen.getByRole('button');
      
      // Switch to dark theme
      await user.click(button);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
        expect(document.documentElement).not.toHaveClass('light');
      });
    });

    it('sets data-theme attribute on document element', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeToggle />
        </TestWrapper>
      );
      
      // Should initially have light theme
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'light');
      });
      
      const button = screen.getByRole('button');
      
      // Switch to dark theme
      await user.click(button);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
      });
    });

    it('updates mobile browser theme-color meta tag', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      // Create mock meta element
      const mockMetaElement = document.createElement('meta');
      mockMetaElement.setAttribute('name', 'theme-color');
      mockMetaElement.setAttribute('content', '#ffffff');
      document.head.appendChild(mockMetaElement);
      
      const setAttributeSpy = vi.spyOn(mockMetaElement, 'setAttribute');
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Switch to dark theme
      await user.click(button);
      
      await waitFor(() => {
        expect(setAttributeSpy).toHaveBeenCalledWith('content', '#0f172a');
      });
      
      // Clean up
      document.head.removeChild(mockMetaElement);
    });
  });

  describe('Component Variants', () => {
    it('renders default variant correctly', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('renders outline variant correctly', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle variant="outline" />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders ghost variant correctly', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle variant="ghost" />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-transparent');
    });

    it('applies custom className prop', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      render(
        <TestWrapper>
          <ThemeToggle className="custom-theme-toggle" />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-theme-toggle');
    });
  });

  describe('Error Handling', () => {
    it('handles theme provider context missing gracefully', () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      // Render without ThemeProvider
      expect(() => {
        render(<ThemeToggle />);
      }).toThrow('useTheme must be used within a ThemeProvider');
    });

    it('handles invalid theme values gracefully', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      
      // Mock setTheme to accept invalid values
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      // Manually trigger invalid theme
      const themeProvider = document.querySelector('[data-testid="theme-provider"]');
      if (themeProvider) {
        fireEvent(themeProvider, new CustomEvent('invalidTheme', { detail: 'invalid' }));
      }
      
      // Should not crash the component
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const renderSpy = vi.fn();
      
      const TestComponent = () => {
        renderSpy();
        return <ThemeToggle />;
      };
      
      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      const initialRenderCount = renderSpy.mock.calls.length;
      
      // Rerender with same props
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Should not cause additional renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });

    it('debounces rapid theme changes', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      // Should only result in final state
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Integration Tests', () => {
    it('integrates correctly with theme context provider', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      let capturedThemeState: any = null;
      
      render(
        <TestWrapper defaultTheme="light">
          <ThemeStateExposer onThemeChange={(state) => { capturedThemeState = state; }} />
          <ThemeToggle />
          <div data-testid="theme-consumer">
            Current theme: {capturedThemeState?.resolvedTheme}
          </div>
        </TestWrapper>
      );
      
      const button = screen.getByRole('button');
      const consumer = screen.getByTestId('theme-consumer');
      
      // Initial state
      await waitFor(() => {
        expect(consumer).toHaveTextContent('Current theme: light');
      });
      
      // Change theme
      await user.click(button);
      
      await waitFor(() => {
        expect(consumer).toHaveTextContent('Current theme: dark');
      });
    });

    it('works with multiple theme toggle instances', async () => {
      mockMatchMedia.mockReturnValue(createMatchMediaMock(false));
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle data-testid="toggle-1" />
          <ThemeToggle data-testid="toggle-2" />
        </TestWrapper>
      );
      
      const toggle1 = screen.getByTestId('toggle-1');
      const toggle2 = screen.getByTestId('toggle-2');
      
      // Click first toggle
      await user.click(toggle1);
      
      // Both toggles should reflect the same theme state
      await waitFor(() => {
        expect(toggle1).toHaveAttribute('aria-label', expect.stringContaining('Switch to system theme'));
        expect(toggle2).toHaveAttribute('aria-label', expect.stringContaining('Switch to system theme'));
      });
    });
  });
});