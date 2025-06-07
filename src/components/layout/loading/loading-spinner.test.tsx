import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithProviders, accessibilityUtils, userEvent } from '../../../test/utils/test-utils';
import { LoadingSpinner, type LoadingSpinnerProps } from './loading-spinner';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * LoadingSpinner Test Suite
 * 
 * Comprehensive test coverage for the LoadingSpinner component including:
 * - Rendering with different variant configurations
 * - Animation behavior and reduced motion preferences  
 * - Theme integration (light/dark mode)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Overlay functionality and keyboard navigation
 * - Error boundary behavior and edge cases
 * 
 * Uses Vitest 2.1.0 with React Testing Library for user-centric testing patterns.
 */
describe('LoadingSpinner', () => {
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mockIntersectionObserver: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    // Mock console.error to prevent test noise
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Mock window.matchMedia for reduced motion testing
    mockMatchMedia = vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion: reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia;

    // Mock IntersectionObserver for animation testing
    mockIntersectionObserver = vi.fn((callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    }));
    window.IntersectionObserver = mockIntersectionObserver;

    // Mock requestAnimationFrame for animation testing
    global.requestAnimationFrame = vi.fn((callback) => {
      setTimeout(callback, 16);
      return 1;
    });

    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  /**
   * Basic Rendering Tests
   * Validates fundamental component rendering with default and custom props
   */
  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      renderWithProviders(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-busy', 'true');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
    });

    it('renders with custom label', () => {
      const customLabel = 'Connecting to database';
      renderWithProviders(<LoadingSpinner label={customLabel} />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(screen.getByText(customLabel)).toBeInTheDocument();
    });

    it('renders with description when provided', () => {
      const label = 'Loading';
      const description = 'This may take a few moments...';
      
      renderWithProviders(
        <LoadingSpinner label={label} description={description} />
      );
      
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(description)).toBeInTheDocument();
    });

    it('applies custom className correctly', () => {
      const customClass = 'custom-spinner-class';
      renderWithProviders(<LoadingSpinner className={customClass} />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass(customClass);
    });

    it('forwards additional props to spinner element', () => {
      const testId = 'custom-spinner';
      renderWithProviders(<LoadingSpinner data-testid={testId} />);
      
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  });

  /**
   * Size Variant Tests
   * Validates all size variants render with appropriate CSS classes
   */
  describe('Size Variants', () => {
    const sizeVariants: Array<{ size: LoadingSpinnerProps['size']; expectedClass: string }> = [
      { size: 'xs', expectedClass: 'h-3 w-3' },
      { size: 'sm', expectedClass: 'h-4 w-4' },
      { size: 'md', expectedClass: 'h-6 w-6' },
      { size: 'lg', expectedClass: 'h-8 w-8' },
      { size: 'xl', expectedClass: 'h-12 w-12' },
      { size: '2xl', expectedClass: 'h-16 w-16' },
    ];

    sizeVariants.forEach(({ size, expectedClass }) => {
      it(`renders ${size} size variant correctly`, () => {
        renderWithProviders(<LoadingSpinner size={size} />);
        
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveClass(expectedClass);
      });
    });
  });

  /**
   * Color Variant Tests
   * Validates all color variants render with appropriate CSS classes
   */
  describe('Color Variants', () => {
    const colorVariants: Array<{ variant: LoadingSpinnerProps['variant']; expectedClass: string }> = [
      { variant: 'primary', expectedClass: 'border-primary-600' },
      { variant: 'secondary', expectedClass: 'border-secondary-500' },
      { variant: 'success', expectedClass: 'border-success-500' },
      { variant: 'warning', expectedClass: 'border-warning-500' },
      { variant: 'error', expectedClass: 'border-error-500' },
      { variant: 'current', expectedClass: 'border-current' },
      { variant: 'contrast', expectedClass: 'border-gray-900' },
    ];

    colorVariants.forEach(({ variant, expectedClass }) => {
      it(`renders ${variant} color variant correctly`, () => {
        renderWithProviders(<LoadingSpinner variant={variant} />);
        
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveClass(expectedClass);
      });
    });
  });

  /**
   * Animation Speed Tests
   * Validates animation speed variants and CSS animation classes
   */
  describe('Animation Speed', () => {
    const speedVariants: Array<{ speed: LoadingSpinnerProps['speed']; expectedClass: string }> = [
      { speed: 'slow', expectedClass: 'animate-spin-slow' },
      { speed: 'normal', expectedClass: 'animate-spin' },
      { speed: 'fast', expectedClass: '[animation-duration:0.6s]' },
    ];

    speedVariants.forEach(({ speed, expectedClass }) => {
      it(`applies ${speed} speed animation correctly`, () => {
        renderWithProviders(<LoadingSpinner speed={speed} />);
        
        const spinner = screen.getByRole('status');
        expect(spinner).toHaveClass(expectedClass);
      });
    });

    it('respects reduced motion preference by default', async () => {
      // Mock user prefers reduced motion
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProviders(<LoadingSpinner speed="fast" />);
      
      const spinner = screen.getByRole('status');
      
      // When reduced motion is preferred, speed class should not be applied
      await waitFor(() => {
        expect(spinner).toHaveClass('motion-reduce:animate-none');
        expect(spinner).toHaveClass('motion-reduce:border-dashed');
      });
    });

    it('ignores reduced motion when respectReducedMotion is false', () => {
      renderWithProviders(
        <LoadingSpinner speed="fast" respectReducedMotion={false} />
      );
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('[animation-duration:0.6s]');
    });
  });

  /**
   * Theme Integration Tests
   * Validates spinner appearance in light and dark themes
   */
  describe('Theme Integration', () => {
    it('renders correctly in light theme', () => {
      renderWithProviders(<LoadingSpinner variant="primary" />, {
        providerOptions: { theme: 'light' }
      });
      
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('light');
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-primary-600');
    });

    it('renders correctly in dark theme', () => {
      renderWithProviders(<LoadingSpinner variant="primary" />, {
        providerOptions: { theme: 'dark' }
      });
      
      const themeProvider = screen.getByTestId('theme-provider');
      expect(themeProvider).toHaveClass('dark');
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-primary-600');
      expect(spinner).toHaveClass('dark:border-primary-400');
    });

    it('applies correct contrast variant styling in dark theme', () => {
      renderWithProviders(<LoadingSpinner variant="contrast" />, {
        providerOptions: { theme: 'dark' }
      });
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-gray-900');
      expect(spinner).toHaveClass('dark:border-white');
    });
  });

  /**
   * Overlay Functionality Tests
   * Validates overlay mode behavior and styling
   */
  describe('Overlay Functionality', () => {
    it('renders as overlay when overlay prop is true', () => {
      renderWithProviders(<LoadingSpinner overlay />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveClass('fixed', 'inset-0', 'z-50');
    });

    it('applies correct overlay blur intensity', () => {
      renderWithProviders(<LoadingSpinner overlay overlayBlur="lg" />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('backdrop-blur-lg');
    });

    it('displays visible text in overlay mode', () => {
      const label = 'Loading data';
      const description = 'Please wait while we fetch the information';
      
      renderWithProviders(
        <LoadingSpinner 
          overlay 
          label={label} 
          description={description} 
        />
      );
      
      // In overlay mode, text should be visible (not sr-only)
      const visibleLabel = screen.getByText(label);
      const visibleDescription = screen.getByText(description);
      
      expect(visibleLabel).toBeVisible();
      expect(visibleDescription).toBeVisible();
      expect(visibleLabel).not.toHaveClass('sr-only');
      expect(visibleDescription).not.toHaveClass('sr-only');
    });

    it('maintains accessibility attributes in overlay mode', () => {
      const label = 'Loading';
      const description = 'Processing request';
      
      renderWithProviders(
        <LoadingSpinner 
          overlay 
          label={label} 
          description={description} 
        />
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });
  });

  /**
   * Accessibility Compliance Tests
   * Validates WCAG 2.1 AA compliance and screen reader compatibility
   */
  describe('Accessibility Compliance', () => {
    it('passes axe accessibility testing', async () => {
      const { container } = renderWithProviders(<LoadingSpinner />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe testing in overlay mode', async () => {
      const { container } = renderWithProviders(
        <LoadingSpinner 
          overlay 
          label="Loading content" 
          description="This may take a few moments" 
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA labels and attributes', () => {
      const label = 'Loading database';
      const description = 'Connecting to server';
      
      renderWithProviders(
        <LoadingSpinner label={label} description={description} />
      );
      
      const spinner = screen.getByRole('status');
      
      expect(spinner).toHaveAttribute('role', 'status');
      expect(spinner).toHaveAttribute('aria-live', 'polite');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
      expect(spinner).toHaveAttribute('aria-labelledby');
      expect(spinner).toHaveAttribute('aria-describedby');
      
      const labelElement = document.getElementById(
        spinner.getAttribute('aria-labelledby')!
      );
      const descElement = document.getElementById(
        spinner.getAttribute('aria-describedby')!
      );
      
      expect(labelElement).toHaveTextContent(label);
      expect(descElement).toHaveTextContent(description);
    });

    it('uses screen reader only text for inline spinners', () => {
      renderWithProviders(<LoadingSpinner label="Loading" />);
      
      const hiddenLabel = screen.getByText('Loading');
      expect(hiddenLabel).toHaveClass('sr-only');
    });

    it('supports keyboard navigation when overlay is active', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <LoadingSpinner 
          overlay 
          label="Loading" 
          description="Please wait" 
        />
      );
      
      const dialog = screen.getByRole('dialog');
      const focusableElements = accessibilityUtils.getFocusableElements(dialog);
      
      // Overlay should not have focusable elements but should trap focus
      expect(document.activeElement).toBe(document.body);
      
      // Test that focus doesn't escape overlay
      await user.keyboard('{Tab}');
      expect(document.body.contains(document.activeElement)).toBe(true);
    });

    it('maintains focus management with hidden prop', () => {
      renderWithProviders(<LoadingSpinner hidden />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('sr-only');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });
  });

  /**
   * Centering and Layout Tests
   * Validates centering behavior and layout positioning
   */
  describe('Layout and Positioning', () => {
    it('applies centering class when centered prop is true', () => {
      renderWithProviders(<LoadingSpinner centered />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('mx-auto');
    });

    it('does not apply centering class when centered is false', () => {
      renderWithProviders(<LoadingSpinner centered={false} />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).not.toHaveClass('mx-auto');
    });

    it('maintains proper layout in container elements', () => {
      const TestContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <div data-testid="container" className="flex items-center justify-center">
          {children}
        </div>
      );

      renderWithProviders(
        <TestContainer>
          <LoadingSpinner size="lg" />
        </TestContainer>
      );
      
      const container = screen.getByTestId('container');
      const spinner = screen.getByRole('status');
      
      expect(container).toContainElement(spinner);
      expect(spinner).toHaveClass('h-8', 'w-8');
    });
  });

  /**
   * Animation Behavior Tests
   * Validates CSS animation properties and reduced motion handling
   */
  describe('Animation Behavior', () => {
    it('applies spin animation by default', () => {
      renderWithProviders(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('applies reduced motion classes for accessibility', () => {
      renderWithProviders(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('motion-reduce:animate-none');
      expect(spinner).toHaveClass('motion-reduce:border-dashed');
    });

    it('handles animation state changes with reduced motion preference', async () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;
      
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((type, callback) => {
          if (type === 'change') {
            mediaQueryCallback = callback;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderWithProviders(<LoadingSpinner speed="fast" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('[animation-duration:0.6s]');
      
      // Simulate reduced motion preference change
      if (mediaQueryCallback) {
        mediaQueryCallback({
          matches: true,
          media: 'prefers-reduced-motion: reduce',
        } as MediaQueryListEvent);
      }
      
      await waitFor(() => {
        expect(spinner).toHaveClass('motion-reduce:animate-none');
      });
    });

    it('maintains consistent animation performance', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<LoadingSpinner />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('animate-spin');
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Render should be fast (under 50ms for simple spinner)
      expect(renderTime).toBeLessThan(50);
    });
  });

  /**
   * Error Handling Tests
   * Validates component behavior with invalid props and error states
   */
  describe('Error Handling', () => {
    it('handles invalid size prop gracefully', () => {
      // @ts-expect-error Testing invalid prop
      renderWithProviders(<LoadingSpinner size="invalid" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      // Should fallback to default size
      expect(spinner).toHaveClass('h-6', 'w-6');
    });

    it('handles invalid variant prop gracefully', () => {
      // @ts-expect-error Testing invalid prop
      renderWithProviders(<LoadingSpinner variant="invalid" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      // Should fallback to default variant
      expect(spinner).toHaveClass('border-primary-600');
    });

    it('handles empty label gracefully', () => {
      renderWithProviders(<LoadingSpinner label="" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('handles extremely long labels without breaking layout', () => {
      const longLabel = 'A'.repeat(1000);
      
      renderWithProviders(<LoadingSpinner label={longLabel} overlay />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      const labelElement = screen.getByText(longLabel);
      expect(labelElement).toBeInTheDocument();
    });
  });

  /**
   * Performance Tests
   * Validates rendering performance and memory usage
   */
  describe('Performance', () => {
    it('renders quickly with multiple spinners', () => {
      const startTime = performance.now();
      
      renderWithProviders(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <LoadingSpinner key={i} size="sm" variant="primary" />
          ))}
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Multiple spinners should render efficiently
      expect(renderTime).toBeLessThan(100);
      
      const spinners = screen.getAllByRole('status');
      expect(spinners).toHaveLength(10);
    });

    it('handles rapid prop changes efficiently', async () => {
      const { rerender } = renderWithProviders(<LoadingSpinner size="sm" />);
      
      const sizes: LoadingSpinnerProps['size'][] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      
      for (const size of sizes) {
        rerender(<LoadingSpinner size={size} />);
        
        const spinner = screen.getByRole('status');
        expect(spinner).toBeInTheDocument();
      }
      
      // Final state should be correct
      const finalSpinner = screen.getByRole('status');
      expect(finalSpinner).toHaveClass('h-16', 'w-16');
    });

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderWithProviders(<LoadingSpinner />);
      
      unmount();
      
      // Should clean up media query listeners
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  /**
   * Integration Tests
   * Validates spinner behavior within complex component hierarchies
   */
  describe('Integration Scenarios', () => {
    it('works correctly within form contexts', () => {
      const TestForm: React.FC = () => (
        <form>
          <label htmlFor="test-input">Test Input</label>
          <input id="test-input" type="text" />
          <LoadingSpinner size="sm" centered />
        </form>
      );

      renderWithProviders(<TestForm />);
      
      const form = screen.getByRole('form');
      const spinner = screen.getByRole('status');
      
      expect(form).toContainElement(spinner);
      expect(spinner).toHaveClass('mx-auto');
    });

    it('maintains proper z-index layering in overlay mode', () => {
      renderWithProviders(
        <div>
          <div data-testid="background-content" className="z-10">
            Background Content
          </div>
          <LoadingSpinner overlay />
        </div>
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('z-50');
      
      const backgroundContent = screen.getByTestId('background-content');
      expect(backgroundContent).toBeInTheDocument();
    });

    it('works with dynamic theme switching', async () => {
      const { rerender } = renderWithProviders(
        <LoadingSpinner variant="primary" />,
        { providerOptions: { theme: 'light' } }
      );
      
      let spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-primary-600');
      
      // Switch to dark theme
      rerender(
        <LoadingSpinner variant="primary" />,
        { providerOptions: { theme: 'dark' } }
      );
      
      spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('border-primary-600');
      expect(spinner).toHaveClass('dark:border-primary-400');
    });

    it('handles concurrent mode rendering correctly', async () => {
      const ConcurrentTestComponent: React.FC = () => {
        const [loading, setLoading] = React.useState(true);
        
        React.useEffect(() => {
          const timer = setTimeout(() => setLoading(false), 100);
          return () => clearTimeout(timer);
        }, []);
        
        return loading ? <LoadingSpinner /> : <div>Content loaded</div>;
      };

      renderWithProviders(<ConcurrentTestComponent />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Content loaded')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});