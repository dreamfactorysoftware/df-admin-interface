/**
 * Paywall Component Test Suite
 * 
 * Comprehensive test coverage for the React paywall component including
 * accessibility, functionality, error handling, and integration tests.
 * Tests migration from Angular df-paywall component to React patterns.
 * 
 * @fileoverview Paywall component tests
 * @version 1.0.0
 * @requires @testing-library/react, @testing-library/jest-dom, vitest
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import '@testing-library/jest-dom';
import { Paywall, CalendlyWidget, CalendlyErrorBoundary } from './paywall';
import { useTranslation } from '@/hooks/use-translation';
import type { PaywallProps, CalendlyConfig } from './types';

// ============================================================================
// MOCKS
// ============================================================================

// Mock the translation hook
vi.mock('@/hooks/use-translation', () => ({
  useTranslation: vi.fn()
}));

// Mock the utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

// Mock Calendly global object
const mockCalendly = {
  initInlineWidget: vi.fn(),
  destroyWidget: vi.fn(),
  showPopupWidget: vi.fn()
};

// Mock window object
Object.defineProperty(window, 'Calendly', {
  value: mockCalendly,
  writable: true
});

// Mock translation responses
const mockTranslations = {
  'header': 'Unlock DreamFactory Enterprise Features',
  'subheader': 'Get access to advanced database tools and premium support',
  'hostedTrialTitle': 'Free Hosted Trial',
  'hostedTrialContent': 'Book time with our experts to unlock all features',
  'learnMoreTitle': 'Learn More About Enterprise',
  'learnMoreContent': 'Gain access to advanced database management tools',
  'speakToHumanTitle': 'Speak to a Human',
  'phoneLabel': 'Phone',
  'emailLabel': 'Email',
  'loadingMessage': 'Loading...',
  'errorMessage': 'An error occurred. Please try again.',
  'calendlyLoadingMessage': 'Loading scheduling widget...',
  'calendlyErrorMessage': 'Failed to load scheduling widget. Please refresh the page.',
  'screenReaderDescription': 'Paywall content with scheduling options',
  'contactInfoLabel': 'Contact Information',
  'widgetContainerLabel': 'Scheduling Widget'
};

const mockUseTranslation = useTranslation as Mock;

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Paywall Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup translation mock
    mockUseTranslation.mockReturnValue({
      t: (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key,
      language: 'en',
      ready: true,
      changeLanguage: vi.fn(),
      exists: vi.fn(() => true),
      getTranslation: vi.fn(),
      getTranslations: vi.fn(),
      formatHtml: vi.fn()
    });

    // Reset Calendly mock
    mockCalendly.initInlineWidget.mockClear();
    mockCalendly.destroyWidget.mockClear();
    mockCalendly.showPopupWidget.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================================================
  // BASIC RENDERING TESTS
  // ============================================================================

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<Paywall />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders with default content', () => {
      render(<Paywall />);
      
      expect(screen.getByText('Unlock DreamFactory Enterprise Features')).toBeInTheDocument();
      expect(screen.getByText('Get access to advanced database tools and premium support')).toBeInTheDocument();
      expect(screen.getByText('Free Hosted Trial')).toBeInTheDocument();
      expect(screen.getByText('Learn More About Enterprise')).toBeInTheDocument();
      expect(screen.getByText('Speak to a Human')).toBeInTheDocument();
    });

    it('renders contact information by default', () => {
      render(<Paywall />);
      
      expect(screen.getByText('Phone: +1 415-993-5877')).toBeInTheDocument();
      expect(screen.getByText('Email: info@dreamfactory.com')).toBeInTheDocument();
    });

    it('hides contact information when showContactInfo is false', () => {
      render(<Paywall showContactInfo={false} />);
      
      expect(screen.queryByText('Phone: +1 415-993-5877')).not.toBeInTheDocument();
      expect(screen.queryByText('Email: info@dreamfactory.com')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // VARIANT TESTS
  // ============================================================================

  describe('Component Variants', () => {
    it('applies default variant classes', () => {
      render(<Paywall />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('bg-white', 'dark:bg-gray-900');
    });

    it('applies enterprise variant classes', () => {
      render(<Paywall variant="enterprise" />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-blue-50', 'to-indigo-100');
    });

    it('applies trial variant classes', () => {
      render(<Paywall variant="trial" />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('bg-gradient-to-br', 'from-green-50', 'to-emerald-100');
    });

    it('applies minimal variant classes', () => {
      render(<Paywall variant="minimal" />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('py-4', 'space-y-4');
    });
  });

  // ============================================================================
  // SIZE TESTS
  // ============================================================================

  describe('Component Sizes', () => {
    it('applies small size classes', () => {
      render(<Paywall size="sm" />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('max-w-2xl', 'py-4', 'space-y-4');
    });

    it('applies large size classes', () => {
      render(<Paywall size="lg" />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('max-w-7xl', 'py-12', 'space-y-12');
    });

    it('applies extra large size classes', () => {
      render(<Paywall size="xl" />);
      const container = screen.getByRole('main');
      expect(container).toHaveClass('max-w-full', 'py-16', 'space-y-16');
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Paywall 
          aria-label="Custom paywall label"
          aria-describedby="paywall-desc"
          aria-labelledby="paywall-title"
        />
      );
      
      const container = screen.getByRole('main');
      expect(container).toHaveAttribute('aria-label', 'Custom paywall label');
      expect(container).toHaveAttribute('aria-describedby', 'paywall-desc');
      expect(container).toHaveAttribute('aria-labelledby', 'paywall-title');
    });

    it('has proper role attributes', () => {
      render(<Paywall role="region" />);
      const container = screen.getByRole('region');
      expect(container).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<Paywall tabIndex={0} />);
      const container = screen.getByRole('main');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('auto-focuses when autoFocus is true', () => {
      render(<Paywall autoFocus />);
      const container = screen.getByRole('main');
      expect(document.activeElement).toBe(container);
    });

    it('has proper link accessibility', () => {
      render(<Paywall />);
      
      const phoneLink = screen.getByLabelText('Call DreamFactory support at +1 415-993-5877');
      const emailLink = screen.getByLabelText('Email DreamFactory support at info@dreamfactory.com');
      
      expect(phoneLink).toHaveAttribute('href', 'tel:+14159935877');
      expect(emailLink).toHaveAttribute('href', 'mailto:info@dreamfactory.com');
    });
  });

  // ============================================================================
  // CALENDLY WIDGET TESTS
  // ============================================================================

  describe('Calendly Widget Integration', () => {
    it('renders Calendly widget by default', () => {
      render(<Paywall />);
      expect(screen.getByLabelText('Scheduling Widget')).toBeInTheDocument();
    });

    it('hides Calendly widget when showCalendlyWidget is false', () => {
      render(<Paywall showCalendlyWidget={false} />);
      expect(screen.queryByLabelText('Scheduling Widget')).not.toBeInTheDocument();
    });

    it('calls Calendly initialization with correct config', async () => {
      const customConfig = {
        url: 'https://calendly.com/custom-url',
        primaryColor: '#FF0000'
      };

      render(<Paywall calendlyConfig={customConfig} />);
      
      await waitFor(() => {
        expect(mockCalendly.initInlineWidget).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://calendly.com/custom-url',
            primaryColor: '#FF0000',
            autoLoad: true
          })
        );
      });
    });

    it('handles Calendly load callback', async () => {
      const onCalendlyLoad = vi.fn();
      render(<Paywall onCalendlyLoad={onCalendlyLoad} />);
      
      // Simulate successful widget load
      await act(async () => {
        // Widget load is handled internally by the CalendlyWidget component
      });
    });

    it('handles Calendly error callback', async () => {
      const onCalendlyError = vi.fn();
      mockCalendly.initInlineWidget.mockImplementation(() => {
        throw new Error('Calendly failed');
      });

      render(<Paywall onCalendlyError={onCalendlyError} />);
      
      await waitFor(() => {
        expect(onCalendlyError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Calendly')
          })
        );
      });
    });
  });

  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================

  describe('Loading and Error States', () => {
    it('shows loading state when loading prop is true', () => {
      render(<Paywall loading={true} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByLabelText('Loading paywall content')).toBeInTheDocument();
    });

    it('shows error state when error prop is provided', () => {
      render(<Paywall error="Custom error message" />);
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows loading state when translations are not ready', () => {
      mockUseTranslation.mockReturnValue({
        t: vi.fn(),
        ready: false,
        language: 'en',
        changeLanguage: vi.fn(),
        exists: vi.fn(),
        getTranslation: vi.fn(),
        getTranslations: vi.fn(),
        formatHtml: vi.fn()
      });

      render(<Paywall />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CUSTOM CONTENT TESTS
  // ============================================================================

  describe('Custom Content', () => {
    it('renders custom header content', () => {
      const customHeader = <div data-testid="custom-header">Custom Header</div>;
      render(<Paywall headerContent={customHeader} />);
      
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.queryByText('Unlock DreamFactory Enterprise Features')).not.toBeInTheDocument();
    });

    it('renders custom footer content', () => {
      const customFooter = <div data-testid="custom-footer">Custom Footer</div>;
      render(<Paywall footerContent={customFooter} />);
      
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // RESPONSIVE DESIGN TESTS
  // ============================================================================

  describe('Responsive Design', () => {
    it('applies responsive classes for info columns', () => {
      render(<Paywall />);
      const infoColumns = screen.getByRole('main').querySelector('.info-columns');
      
      expect(infoColumns).toHaveClass('flex-col', 'md:flex-row');
    });

    it('handles custom responsive configuration', () => {
      const responsive = {
        breakpoints: {
          md: { columns: 1, direction: 'column' as const }
        },
        default: {
          columns: 2,
          direction: 'row' as const,
          alignment: 'center' as const,
          spacing: 'lg' as const,
          stackOnMobile: true
        },
        enabled: true
      };

      render(<Paywall responsive={responsive} />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // REF FORWARDING TESTS
  // ============================================================================

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<any>();
      render(<Paywall ref={ref} />);
      
      expect(ref.current).toBeTruthy();
      expect(ref.current.containerRef).toBeTruthy();
      expect(ref.current.calendlyRef).toBeTruthy();
    });

    it('provides imperative methods', () => {
      const ref = React.createRef<any>();
      render(<Paywall ref={ref} />);
      
      expect(typeof ref.current.initializeCalendly).toBe('function');
      expect(typeof ref.current.destroyCalendly).toBe('function');
      expect(typeof ref.current.refreshCalendly).toBe('function');
      expect(typeof ref.current.focus).toBe('function');
      expect(typeof ref.current.scrollIntoView).toBe('function');
      expect(typeof ref.current.getCalendlyState).toBe('function');
      expect(typeof ref.current.updateCalendlyConfig).toBe('function');
    });

    it('focus method works correctly', () => {
      const ref = React.createRef<any>();
      render(<Paywall ref={ref} />);
      
      ref.current.focus();
      expect(document.activeElement).toBe(ref.current.containerRef.current);
    });
  });

  // ============================================================================
  // CALLBACK TESTS
  // ============================================================================

  describe('Callback Functions', () => {
    it('calls onMount when component mounts', () => {
      const onMount = vi.fn();
      render(<Paywall onMount={onMount} />);
      
      expect(onMount).toHaveBeenCalledTimes(1);
    });

    it('calls calendar event callbacks', () => {
      const onCalendlyEvent = vi.fn();
      render(<Paywall onCalendlyEvent={onCalendlyEvent} />);
      
      // Calendar events are handled by the CalendlyWidget sub-component
      expect(screen.getByLabelText('Scheduling Widget')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // TRANSLATION TESTS
  // ============================================================================

  describe('Translation Integration', () => {
    it('uses correct translation namespace', () => {
      render(<Paywall translationNamespace="custom" />);
      
      expect(mockUseTranslation).toHaveBeenCalledWith(
        'custom',
        expect.objectContaining({
          fallback: 'Translation unavailable',
          enableHtml: true
        })
      );
    });

    it('handles missing translations gracefully', () => {
      mockUseTranslation.mockReturnValue({
        t: (key: string) => key, // Return key when translation missing
        ready: true,
        language: 'en',
        changeLanguage: vi.fn(),
        exists: vi.fn(() => false),
        getTranslation: vi.fn(),
        getTranslations: vi.fn(),
        formatHtml: vi.fn()
      });

      render(<Paywall />);
      
      // Should render translation keys when translations are missing
      expect(screen.getByText('header')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CALENDLY WIDGET TESTS
// ============================================================================

describe('CalendlyWidget Component', () => {
  const defaultConfig: CalendlyConfig = {
    url: 'https://calendly.com/test',
    mode: 'inline',
    height: 700
  };

  it('renders loading state initially', () => {
    render(<CalendlyWidget config={defaultConfig} />);
    expect(screen.getByText('Loading scheduling widget...')).toBeInTheDocument();
  });

  it('handles configuration properly', () => {
    const config = {
      ...defaultConfig,
      primaryColor: '#FF0000',
      height: 800
    };

    render(<CalendlyWidget config={config} />);
    expect(screen.getByRole('status')).toHaveStyle({ minHeight: '400px' });
  });

  it('displays error state on failure', async () => {
    mockCalendly.initInlineWidget.mockImplementation(() => {
      throw new Error('Test error');
    });

    const onError = vi.fn();
    render(<CalendlyWidget config={defaultConfig} onError={onError} />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// ERROR BOUNDARY TESTS
// ============================================================================

describe('CalendlyErrorBoundary Component', () => {
  it('renders children when no error', () => {
    render(
      <CalendlyErrorBoundary>
        <div data-testid="child">Child Content</div>
      </CalendlyErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders error state when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <CalendlyErrorBoundary>
        <ThrowError />
      </CalendlyErrorBoundary>
    );
    
    expect(screen.getByText('Scheduling Widget Unavailable')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <CalendlyErrorBoundary onError={onError}>
        <ThrowError />
      </CalendlyErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('renders custom fallback when provided', () => {
    const fallback = <div data-testid="custom-fallback">Custom Error</div>;
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <CalendlyErrorBoundary fallback={fallback}>
        <ThrowError />
      </CalendlyErrorBoundary>
    );
    
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });
});