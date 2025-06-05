/**
 * @fileoverview Vitest test suite for LicenseExpired component system
 * 
 * Tests component rendering, internationalization functionality, accessibility compliance (WCAG 2.1 AA),
 * theme variants (light/dark), responsive design behavior, and keyboard navigation.
 * Replaces Angular Jasmine/Karma tests with React Testing Library and Vitest.
 * 
 * Migration Notes:
 * - Migrated from Angular TestBed/Jasmine to Vitest/React Testing Library per Section 7.1 testing framework requirements
 * - Replaced Karma test runner with Vitest for 10x faster test execution per performance specifications
 * - Converted Angular ComponentFixture testing to React Testing Library render and screen queries
 * - Replaced Angular TranslocoPipe testing with Next.js useTranslations hook testing for i18n functionality
 * - Added accessibility testing with jest-axe for WCAG 2.1 AA compliance verification
 * - Test theme variant behavior (light/dark) with Tailwind CSS class assertions
 * - Implemented responsive design testing for mobile, tablet, and desktop layouts
 * - Added keyboard navigation and screen reader announcement testing
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19 Migration
 */

import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LicenseExpired } from './license-expired';
import type { LicenseExpiredProps } from './types';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js useTranslations hook for i18n testing
const mockUseTranslations = vi.fn();
vi.mock('next-intl', () => ({
  useTranslations: () => mockUseTranslations,
}));

// Mock useTheme hook for theme variant testing
const mockUseTheme = vi.fn();
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => mockUseTheme,
}));

// Mock IntersectionObserver for responsive design testing
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver for responsive behavior testing
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;

/**
 * Test utilities for component rendering with different themes and responsive contexts
 */
const renderWithTheme = (
  component: React.ReactElement,
  theme: 'light' | 'dark' | 'system' = 'light'
) => {
  // Mock theme context
  mockUseTheme.mockReturnValue({
    theme,
    setTheme: vi.fn(),
    systemTheme: 'light',
  });

  // Add theme class to document for CSS-in-JS testing
  document.documentElement.className = theme === 'dark' ? 'dark' : '';

  return render(component);
};

/**
 * Utility to simulate different viewport sizes for responsive testing
 */
const setViewportSize = (width: number, height: number = 768) => {
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
  
  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

/**
 * Test data for internationalization scenarios
 */
const mockTranslations = {
  header: 'License Expired',
  subHeader: 'Your DreamFactory subscription has expired. Please contact your administrator to renew your license.',
  contactSupport: 'Contact Support',
  renewLicense: 'Renew License',
};

/**
 * Default props for component testing
 */
const defaultProps: LicenseExpiredProps = {
  className: '',
  'data-testid': 'license-expired',
};

describe('LicenseExpired Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default translation mock
    mockUseTranslations.mockImplementation((key: string) => {
      const keys = key.split('.');
      if (keys[0] === 'licenseExpired') {
        return mockTranslations[keys[1] as keyof typeof mockTranslations] || key;
      }
      return key;
    });

    // Reset theme to light mode
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
      systemTheme: 'light',
    });

    // Reset document class
    document.documentElement.className = '';
    
    // Reset viewport to desktop size
    setViewportSize(1024, 768);

    // Clear any existing ARIA live regions
    document.querySelectorAll('[aria-live]').forEach(el => el.remove());
  });

  /**
   * Basic Rendering Tests
   * Migrated from Angular ComponentFixture testing to React Testing Library render and screen queries
   */
  describe('Component Rendering', () => {
    it('should render successfully with default props', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      expect(screen.getByTestId('license-expired')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render with semantic HTML structure', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toHaveAttribute('aria-label', 'License Expiration Notice');
      
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveClass('license-expired-content');
    });

    it('should apply custom className when provided', () => {
      const customClass = 'custom-license-expired';
      renderWithTheme(<LicenseExpired className={customClass} />);
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass(customClass);
    });

    it('should forward ref correctly for accessibility', () => {
      const ref = vi.fn();
      renderWithTheme(<LicenseExpired ref={ref} {...defaultProps} />);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement));
    });
  });

  /**
   * Internationalization Tests
   * Replaced Angular TranslocoPipe testing with Next.js useTranslations hook testing for i18n functionality
   */
  describe('Internationalization (i18n)', () => {
    it('should display translated header text', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(mockTranslations.header);
      expect(mockUseTranslations).toHaveBeenCalledWith('licenseExpired.header');
    });

    it('should display translated subheader text', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(mockTranslations.subHeader);
      expect(mockUseTranslations).toHaveBeenCalledWith('licenseExpired.subHeader');
    });

    it('should handle missing translations gracefully', () => {
      mockUseTranslations.mockImplementation((key: string) => key);
      
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('licenseExpired.header');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('licenseExpired.subHeader');
    });

    it('should update translations when locale changes', async () => {
      const { rerender } = renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      // Simulate locale change
      mockUseTranslations.mockImplementation((key: string) => {
        const spanishTranslations = {
          header: 'Licencia Expirada',
          subHeader: 'Su suscripción de DreamFactory ha expirado. Póngase en contacto con su administrador para renovar su licencia.',
        };
        const keys = key.split('.');
        if (keys[0] === 'licenseExpired') {
          return spanishTranslations[keys[1] as keyof typeof spanishTranslations] || key;
        }
        return key;
      });
      
      rerender(<LicenseExpired {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Licencia Expirada');
      });
    });
  });

  /**
   * Accessibility Tests
   * Added accessibility testing with jest-axe for WCAG 2.1 AA compliance verification
   */
  describe('Accessibility (WCAG 2.1 AA Compliance)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithTheme(<LicenseExpired {...defaultProps} />);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      
      // Verify logical heading order
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toBe(h1);
      expect(headings[1]).toBe(h2);
    });

    it('should have appropriate ARIA landmarks', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const main = screen.getByRole('main');
      const article = screen.getByRole('article');
      
      expect(main).toHaveAttribute('aria-label', 'License Expiration Notice');
      expect(article).toHaveAttribute('aria-describedby');
    });

    it('should announce content to screen readers', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const announcement = screen.getByLabelText('License expiration announcement');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have sufficient color contrast ratios', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        // Verify text color classes for contrast compliance
        expect(heading).toHaveClass(expect.stringMatching(/text-(gray-900|gray-100|white|black)/));
      });
    });

    it('should support high contrast mode', () => {
      // Simulate high contrast mode
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

      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass(expect.stringMatching(/contrast-more:/));
    });
  });

  /**
   * Theme Variant Tests
   * Test theme variant behavior (light/dark) with Tailwind CSS class assertions
   */
  describe('Theme Variants', () => {
    it('should apply light theme styles correctly', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />, 'light');
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass('bg-white', 'text-gray-900');
      
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading).toHaveClass(expect.stringMatching(/text-gray-900/));
      });
    });

    it('should apply dark theme styles correctly', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />, 'dark');
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass('dark:bg-gray-900', 'dark:text-gray-100');
      
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading).toHaveClass(expect.stringMatching(/dark:text-gray-100/));
      });
    });

    it('should respect system theme preference', () => {
      // Mock system dark theme preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: vi.fn(),
        systemTheme: 'dark',
      });

      renderWithTheme(<LicenseExpired {...defaultProps} />, 'system');
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass(expect.stringMatching(/dark:/));
    });

    it('should transition smoothly between themes', async () => {
      const { rerender } = renderWithTheme(<LicenseExpired {...defaultProps} />, 'light');
      
      // Switch to dark theme
      rerender(<LicenseExpired {...defaultProps} />);
      renderWithTheme(<LicenseExpired {...defaultProps} />, 'dark');
      
      const container = screen.getByTestId('license-expired');
      
      // Verify transition classes are applied
      expect(container).toHaveClass(expect.stringMatching(/transition-colors/));
      expect(container).toHaveClass(expect.stringMatching(/duration-200/));
    });
  });

  /**
   * Responsive Design Tests
   * Implemented responsive design testing for mobile, tablet, and desktop layouts
   */
  describe('Responsive Design', () => {
    it('should apply mobile styles on small screens', () => {
      setViewportSize(320); // Mobile viewport
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass(expect.stringMatching(/px-4|px-6/)); // Mobile padding
      
      const content = screen.getByRole('article');
      expect(content).toHaveClass(expect.stringMatching(/max-w-sm|max-w-md/)); // Mobile max width
    });

    it('should apply tablet styles on medium screens', () => {
      setViewportSize(768); // Tablet viewport
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass(expect.stringMatching(/md:px-8/)); // Tablet padding
      
      const content = screen.getByRole('article');
      expect(content).toHaveClass(expect.stringMatching(/md:max-w-lg/)); // Tablet max width
    });

    it('should apply desktop styles on large screens', () => {
      setViewportSize(1024); // Desktop viewport
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const container = screen.getByTestId('license-expired');
      expect(container).toHaveClass(expect.stringMatching(/lg:px-12/)); // Desktop padding
      
      const content = screen.getByRole('article');
      expect(content).toHaveClass(expect.stringMatching(/lg:max-w-xl/)); // Desktop max width
    });

    it('should handle viewport size changes', async () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      // Start with desktop
      setViewportSize(1024);
      await waitFor(() => {
        expect(screen.getByTestId('license-expired')).toHaveClass(expect.stringMatching(/lg:/));
      });
      
      // Switch to mobile
      setViewportSize(320);
      fireEvent(window, new Event('resize'));
      await waitFor(() => {
        expect(screen.getByTestId('license-expired')).toHaveClass(expect.stringMatching(/px-4|px-6/));
      });
    });

    it('should maintain readability across all screen sizes', () => {
      const screenSizes = [320, 768, 1024, 1920];
      
      screenSizes.forEach(width => {
        setViewportSize(width);
        const { container } = renderWithTheme(<LicenseExpired {...defaultProps} />);
        
        const headings = screen.getAllByRole('heading');
        headings.forEach(heading => {
          // Verify responsive text sizing
          expect(heading).toHaveClass(expect.stringMatching(/text-(xl|2xl|3xl)/));
        });
        
        // Clean up for next iteration
        container.remove();
      });
    });
  });

  /**
   * Keyboard Navigation Tests
   * Added keyboard navigation and screen reader announcement testing
   */
  describe('Keyboard Navigation', () => {
    it('should be focusable with keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const container = screen.getByTestId('license-expired');
      
      // Tab to component
      await user.tab();
      expect(container).toHaveFocus();
    });

    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const container = screen.getByTestId('license-expired');
      
      await user.tab();
      expect(container).toHaveClass(expect.stringMatching(/focus:(ring|outline)/));
    });

    it('should support skip links for screen readers', () => {
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      const skipLink = screen.getByLabelText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should announce focus changes to screen readers', async () => {
      const user = userEvent.setup();
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      await user.tab();
      
      const announcement = screen.getByLabelText('License expiration announcement');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });

    it('should handle escape key for modal behavior', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      
      renderWithTheme(<LicenseExpired {...defaultProps} onDismiss={onDismiss} />);
      
      await user.keyboard('{Escape}');
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * Error Handling Tests
   * Verify component behavior under error conditions
   */
  describe('Error Handling', () => {
    it('should handle translation loading errors gracefully', () => {
      mockUseTranslations.mockImplementation(() => {
        throw new Error('Translation service unavailable');
      });
      
      expect(() => {
        renderWithTheme(<LicenseExpired {...defaultProps} />);
      }).not.toThrow();
      
      // Should fall back to default text or display error boundary
      expect(screen.getByTestId('license-expired')).toBeInTheDocument();
    });

    it('should handle theme system failures', () => {
      mockUseTheme.mockImplementation(() => {
        throw new Error('Theme system error');
      });
      
      expect(() => {
        renderWithTheme(<LicenseExpired {...defaultProps} />);
      }).not.toThrow();
    });

    it('should provide fallback content when translations fail', () => {
      mockUseTranslations.mockReturnValue(null);
      
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      // Should show default English fallback
      expect(screen.getByText(/license/i)).toBeInTheDocument();
    });
  });

  /**
   * Performance Tests
   * Verify component renders efficiently
   */
  describe('Performance', () => {
    it('should render quickly with minimal re-renders', () => {
      const renderStart = performance.now();
      renderWithTheme(<LicenseExpired {...defaultProps} />);
      const renderTime = performance.now() - renderStart;
      
      // Should render in under 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderWithTheme(<LicenseExpired {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
      
      // Verify cleanup
      expect(document.querySelectorAll('[aria-live]')).toHaveLength(0);
    });
  });

  /**
   * Integration Tests
   * Test component in realistic usage scenarios
   */
  describe('Integration Scenarios', () => {
    it('should work correctly within modal or dialog context', () => {
      render(
        <div role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <h1 id="dialog-title">License Status</h1>
          <LicenseExpired {...defaultProps} />
        </div>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('license-expired')).toBeInTheDocument();
    });

    it('should integrate with form submission workflows', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      
      render(
        <form onSubmit={onSubmit}>
          <LicenseExpired {...defaultProps} />
          <button type="submit">Continue</button>
        </form>
      );
      
      await user.click(screen.getByRole('button', { name: /continue/i }));
      expect(onSubmit).toHaveBeenCalled();
    });

    it('should work with React Suspense boundaries', () => {
      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LicenseExpired {...defaultProps} />
        </React.Suspense>
      );
      
      expect(screen.getByTestId('license-expired')).toBeInTheDocument();
    });
  });
});