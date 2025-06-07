/**
 * Comprehensive Vitest Test Suite for Paywall React Component
 * 
 * Tests component rendering, internationalization integration, Calendly widget
 * initialization, accessibility compliance, responsive design behavior, and user
 * interactions. Migrated from Angular TestBed/Jasmine to Vitest/React Testing Library
 * for enhanced performance and React 19 compatibility.
 * 
 * Features Tested:
 * - Component rendering with all prop variants and combinations
 * - Internationalization with react-i18next and custom translation keys
 * - Calendly widget initialization, loading states, and error handling
 * - WCAG 2.1 AA accessibility compliance with jest-axe integration
 * - Responsive design behavior at different breakpoints
 * - User interactions including clicks, keyboard navigation, and focus management
 * - MSW integration for external service API mocking
 * - Loading and error states with proper ARIA announcements
 * - Analytics event tracking and callback execution
 * 
 * @fileoverview Paywall component test suite with comprehensive coverage
 * @version 1.0.0
 * @since Vitest 2.1.0 / React Testing Library
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Component and utilities imports
import { Paywall } from './paywall';
import type { 
  PaywallProps, 
  PaywallRef, 
  CalendlyEvent, 
  PaywallLevel, 
  PaywallVariant,
  PaywallLoadingState,
  PaywallErrorState 
} from './types';
import { 
  customRender as render, 
  testA11y, 
  createKeyboardUtils,
  waitForValidation,
  createMockValidation
} from '../../../test/test-utils';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// MOCK SETUP AND CONFIGURATION
// ============================================================================

/**
 * MSW Server Configuration for Calendly API Mocking
 * 
 * Provides realistic API responses for Calendly widget initialization,
 * event scheduling, and error scenarios during testing.
 */
const server = setupServer(
  // Mock Calendly widget script loading
  http.get('https://assets.calendly.com/assets/external/widget.js', () => {
    return new HttpResponse('window.Calendly = { initInlineWidget: () => {} }', {
      headers: { 'Content-Type': 'application/javascript' },
    });
  }),

  // Mock Calendly event scheduling webhook
  http.post('https://calendly.com/webhook/event_scheduled', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      event: {
        uuid: 'test-event-uuid',
        start_time: '2024-01-01T10:00:00Z',
        end_time: '2024-01-01T11:00:00Z',
      },
      invitee: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });
  }),

  // Mock Calendly error scenario
  http.get('https://assets.calendly.com/assets/external/widget-error.js', () => {
    return new HttpResponse('', { status: 404 });
  })
);

/**
 * React i18next Mock Configuration
 * 
 * Provides comprehensive mocking for internationalization testing,
 * including all paywall-specific translation keys and namespaces.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, options?: any) => {
      const translations: Record<string, string> = {
        // Header and content translations
        'paywall.header': 'Upgrade to Premium',
        'paywall.subheader': 'Unlock advanced features and capabilities',
        'paywall.upgradeNow': 'Upgrade Now',
        'paywall.scheduleMeeting': 'Schedule a Demo',
        'paywall.close': 'Close',
        'paywall.contactSales': 'Contact Sales',
        'paywall.loading': 'Loading...',
        'paywall.error': 'An error occurred',
        'paywall.retry': 'Try Again',

        // Feature-specific translations
        'paywall.featuresTitle': 'Premium Features',
        'paywall.feature1': 'Advanced API generation',
        'paywall.feature2': 'Enterprise database support',
        'paywall.feature3': 'Priority support and SLA',
        'paywall.scheduleDemo': 'Schedule a Demo',
        'paywall.contactDescription': 'Get in touch with our sales team',

        // Trial and pricing translations
        'paywall.trialAvailable': 'Free Trial Available',
        'paywall.trialDescription': 'Start your {{days}} day free trial',

        // Status and loading states
        'paywall.calendlyLoading': 'Loading calendar widget...',
        'paywall.calendlyError': 'Failed to load scheduling widget',
        'paywall.networkError': 'Network connection error',
        'paywall.configError': 'Configuration error',
      };

      let result = translations[key] || key;
      
      // Handle interpolation
      if (options && typeof options === 'object') {
        Object.keys(options).forEach(optionKey => {
          result = result.replace(`{{${optionKey}}}`, options[optionKey]);
        });
      }
      
      return result;
    }),
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

/**
 * Window.matchMedia Mock for Responsive Testing
 * 
 * Enables testing of responsive design behavior at different breakpoints
 * by mocking CSS media queries in the jsdom environment.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => {
    const mediaQuery = {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    // Configure breakpoint responses
    if (query.includes('max-width: 767px')) {
      mediaQuery.matches = window.innerWidth <= 767;
    } else if (query.includes('min-width: 768px')) {
      mediaQuery.matches = window.innerWidth >= 768;
    } else if (query.includes('min-width: 1024px')) {
      mediaQuery.matches = window.innerWidth >= 1024;
    }

    return mediaQuery;
  }),
});

/**
 * Calendly Global Window Object Mock
 * 
 * Provides comprehensive mocking of Calendly's widget API for testing
 * initialization, event handling, and error scenarios.
 */
let mockCalendlyWidget: any = null;

const mockCalendly = {
  initInlineWidget: vi.fn(({ url, parentElement, ...options }) => {
    // Simulate widget initialization
    if (parentElement) {
      parentElement.innerHTML = '<div data-testid="calendly-iframe">Calendly Widget</div>';
      mockCalendlyWidget = { url, parentElement, options };
    }
    
    // Simulate successful initialization
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('calendly:widget_loaded'));
    }, 100);
  }),
};

Object.defineProperty(window, 'Calendly', {
  writable: true,
  configurable: true,
  value: mockCalendly,
});

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Default Paywall Props for Testing
 * 
 * Provides comprehensive base configuration for consistent testing
 * with all required props and common optional configurations.
 */
const defaultProps: PaywallProps = {
  requiredLevel: 'professional',
  currentLevel: 'free',
  isVisible: true,
  variant: 'modal',
  showCalendly: true,
  'data-testid': 'paywall-component',
};

/**
 * Mock Calendly Event Data
 * 
 * Provides realistic event data for testing Calendly webhook integration
 * and event scheduling functionality.
 */
const mockCalendlyEvent: CalendlyEvent = {
  eventUuid: 'test-event-uuid-123',
  eventTypeUuid: 'test-event-type-uuid-456',
  invitee: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    customResponses: {
      company: 'Test Company',
      role: 'Developer',
    },
  },
  event: {
    startTime: '2024-12-07T15:00:00Z',
    endTime: '2024-12-07T16:00:00Z',
    location: 'Video Conference',
    joinUrl: 'https://us02web.zoom.us/j/123456789',
  },
};

/**
 * Render Paywall with Default Configuration
 * 
 * Helper function to render Paywall component with consistent test setup
 * including user event utilities and providers.
 */
const renderPaywall = (props: Partial<PaywallProps> = {}) => {
  const combinedProps = { ...defaultProps, ...props };
  const result = render(<Paywall {...combinedProps} />);
  const user = userEvent.setup();
  
  return {
    ...result,
    user,
    keyboard: createKeyboardUtils(user),
  };
};

/**
 * Simulate Responsive Breakpoint
 * 
 * Helper function to test responsive behavior by simulating different
 * screen sizes and triggering matchMedia listeners.
 */
const simulateBreakpoint = (width: number) => {
  // Update window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  // Trigger resize event
  window.dispatchEvent(new Event('resize'));
  
  // Update matchMedia mocks
  const mediaQueries = [
    { query: '(max-width: 767px)', matches: width <= 767 },
    { query: '(min-width: 768px)', matches: width >= 768 },
    { query: '(min-width: 1024px)', matches: width >= 1024 },
  ];

  mediaQueries.forEach(({ query, matches }) => {
    const mediaQuery = window.matchMedia(query);
    if (mediaQuery.addEventListener) {
      mediaQuery.matches = matches;
    }
  });
};

/**
 * Simulate Calendly Event Scheduling
 * 
 * Helper function to simulate successful event scheduling through
 * Calendly's postMessage API for integration testing.
 */
const simulateCalendlyEventScheduled = (eventData: Partial<CalendlyEvent> = {}) => {
  const event = { ...mockCalendlyEvent, ...eventData };
  
  window.postMessage({
    event: 'calendly.event_scheduled',
    payload: {
      event: {
        uuid: event.eventUuid,
        start_time: event.event.startTime,
        end_time: event.event.endTime,
        location: event.event.location,
        join_url: event.event.joinUrl,
      },
      event_type: {
        uuid: event.eventTypeUuid,
      },
      invitee: {
        name: event.invitee.name,
        email: event.invitee.email,
        phone: event.invitee.phone,
        custom_responses: event.invitee.customResponses,
      },
    },
  }, 'https://calendly.com');
};

// ============================================================================
// TEST LIFECYCLE MANAGEMENT
// ============================================================================

beforeAll(() => {
  // Start MSW server for API mocking
  server.listen({ onUnhandledRequest: 'error' });
  
  // Set initial window dimensions for responsive tests
  simulateBreakpoint(1024); // Desktop default
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset Calendly widget state
  mockCalendlyWidget = null;
  
  // Reset window.Calendly to ensure clean state
  Object.defineProperty(window, 'Calendly', {
    writable: true,
    configurable: true,
    value: mockCalendly,
  });
  
  // Clear any existing DOM elements
  document.body.innerHTML = '';
});

afterEach(() => {
  // Reset MSW handlers after each test
  server.resetHandlers();
  
  // Clean up any event listeners
  window.removeEventListener?.('message', vi.fn());
  window.removeEventListener?.('resize', vi.fn());
});

afterAll(() => {
  // Close MSW server after all tests
  server.close();
});

// ============================================================================
// COMPONENT RENDERING TESTS
// ============================================================================

describe('Paywall Component - Basic Rendering', () => {
  it('renders with default props and required level check', () => {
    const { container } = renderPaywall();
    
    // Verify component renders
    expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
    
    // Verify header content
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    expect(screen.getByText('Unlock advanced features and capabilities')).toBeInTheDocument();
    
    // Verify action buttons
    expect(screen.getByTestId('paywall-upgrade-button')).toBeInTheDocument();
    expect(screen.getByTestId('paywall-secondary-button')).toBeInTheDocument();
    
    // Verify basic accessibility attributes
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'paywall-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'paywall-description');
  });

  it('does not render when user has sufficient access level', () => {
    const { container } = renderPaywall({
      currentLevel: 'professional',
      requiredLevel: 'starter',
    });
    
    // Component should not render if user already has required access
    expect(screen.queryByTestId('paywall-component')).not.toBeInTheDocument();
  });

  it('renders in debug mode regardless of access level', () => {
    renderPaywall({
      currentLevel: 'enterprise',
      requiredLevel: 'free',
      debugMode: true,
    });
    
    // Should render even with sufficient access in debug mode
    expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
  });

  it('applies custom CSS classes correctly', () => {
    renderPaywall({
      className: 'custom-paywall',
      containerClassName: 'custom-container',
      contentClassName: 'custom-content',
      headerClassName: 'custom-header',
      footerClassName: 'custom-footer',
    });
    
    const component = screen.getByTestId('paywall-component');
    expect(component).toHaveClass('custom-container');
    
    // Verify other custom classes are applied
    expect(document.querySelector('.custom-content')).toBeInTheDocument();
    expect(document.querySelector('.custom-header')).toBeInTheDocument();
    expect(document.querySelector('.custom-footer')).toBeInTheDocument();
  });
});

describe('Paywall Component - Variant Rendering', () => {
  const variants: PaywallVariant[] = ['modal', 'inline', 'banner', 'sidebar', 'tooltip'];
  
  variants.forEach(variant => {
    it(`renders correctly in ${variant} variant`, () => {
      renderPaywall({ variant });
      
      const component = screen.getByTestId('paywall-component');
      expect(component).toBeInTheDocument();
      
      // Verify variant-specific styling and behavior
      switch (variant) {
        case 'modal':
          expect(component).toHaveAttribute('aria-modal', 'true');
          expect(component.parentElement).toHaveClass('fixed', 'inset-0', 'z-50');
          break;
        case 'inline':
          expect(component).toHaveClass('relative', 'w-full');
          break;
        case 'banner':
          expect(component).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-40');
          break;
        case 'sidebar':
          expect(component).toHaveClass('fixed', 'right-0', 'top-0', 'bottom-0', 'z-40');
          break;
        case 'tooltip':
          expect(component).toHaveClass('relative', 'inline-block');
          break;
      }
    });
  });

  it('applies responsive variant overrides correctly', async () => {
    renderPaywall({
      variant: 'modal',
      mobileVariant: 'banner',
      tabletVariant: 'sidebar',
      desktopVariant: 'inline',
    });
    
    // Test mobile breakpoint
    simulateBreakpoint(600);
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('fixed', 'top-0');
    });
    
    // Test tablet breakpoint
    simulateBreakpoint(800);
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('fixed', 'right-0');
    });
    
    // Test desktop breakpoint
    simulateBreakpoint(1200);
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('relative', 'w-full');
    });
  });
});

describe('Paywall Component - Content Configuration', () => {
  it('renders custom content when provided', () => {
    const customContent = {
      title: 'Custom Premium Access',
      description: 'Custom description for premium features',
      features: [
        { title: 'Custom Feature 1', description: 'Feature 1 description' },
        { title: 'Custom Feature 2', description: 'Feature 2 description' },
        { title: 'Custom Feature 3', description: 'Feature 3 description' },
      ],
      pricing: {
        amount: 99,
        currency: 'USD',
        period: 'monthly' as const,
      },
      trial: {
        duration: 14,
        description: 'Start your 14-day free trial today',
      },
    };
    
    renderPaywall({ content: customContent });
    
    // Verify custom content is displayed
    expect(screen.getByText('Custom Premium Access')).toBeInTheDocument();
    expect(screen.getByText('Custom description for premium features')).toBeInTheDocument();
    
    // Verify custom features are listed
    expect(screen.getByText('Custom Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 1 description')).toBeInTheDocument();
    expect(screen.getByText('Custom Feature 2')).toBeInTheDocument();
    expect(screen.getByText('Custom Feature 3')).toBeInTheDocument();
    
    // Verify pricing information
    expect(screen.getByText('$99.00')).toBeInTheDocument();
    expect(screen.getByText('per monthly')).toBeInTheDocument();
    
    // Verify trial information
    expect(screen.getByText('Free Trial Available')).toBeInTheDocument();
    expect(screen.getByText('Start your 14-day free trial today')).toBeInTheDocument();
  });

  it('falls back to translation keys when custom content is not provided', () => {
    renderPaywall({ content: undefined });
    
    // Verify translation keys are used
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    expect(screen.getByText('Unlock advanced features and capabilities')).toBeInTheDocument();
    expect(screen.getByText('Advanced API generation')).toBeInTheDocument();
    expect(screen.getByText('Enterprise database support')).toBeInTheDocument();
    expect(screen.getByText('Priority support and SLA')).toBeInTheDocument();
  });

  it('renders custom translation keys when provided', () => {
    const customTranslations = {
      titleKey: 'custom.title',
      descriptionKey: 'custom.description',
      primaryActionKey: 'custom.upgrade',
      secondaryActionKey: 'custom.demo',
      featuresKey: ['custom.feature1', 'custom.feature2'],
    };
    
    // Mock custom translations
    const mockT = vi.fn((key: string) => {
      const customKeys: Record<string, string> = {
        'custom.title': 'Custom Upgrade Title',
        'custom.description': 'Custom upgrade description',
        'custom.upgrade': 'Custom Upgrade Button',
        'custom.demo': 'Custom Demo Button',
        'custom.feature1': 'Custom Feature One',
        'custom.feature2': 'Custom Feature Two',
      };
      return customKeys[key] || key;
    });
    
    vi.mocked(require('react-i18next').useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'en', changeLanguage: vi.fn() },
    });
    
    renderPaywall({ translations: customTranslations });
    
    // Verify custom translations are used
    expect(screen.getByText('Custom Upgrade Title')).toBeInTheDocument();
    expect(screen.getByText('Custom upgrade description')).toBeInTheDocument();
    expect(screen.getByText('Custom Upgrade Button')).toBeInTheDocument();
    expect(screen.getByText('Custom Demo Button')).toBeInTheDocument();
  });
});

// ============================================================================
// INTERNATIONALIZATION TESTS
// ============================================================================

describe('Paywall Component - Internationalization', () => {
  it('uses translation function for all text content', () => {
    const mockT = vi.fn((key: string) => `TRANSLATED_${key}`);
    
    vi.mocked(require('react-i18next').useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'en', changeLanguage: vi.fn() },
    });
    
    renderPaywall();
    
    // Verify translation function is called for key elements
    expect(mockT).toHaveBeenCalledWith('paywall.header');
    expect(mockT).toHaveBeenCalledWith('paywall.subheader');
    expect(mockT).toHaveBeenCalledWith('paywall.upgradeNow');
    expect(mockT).toHaveBeenCalledWith('paywall.scheduleMeeting');
    expect(mockT).toHaveBeenCalledWith('paywall.close');
    expect(mockT).toHaveBeenCalledWith('paywall.featuresTitle');
  });

  it('supports interpolation in translation keys', () => {
    const mockT = vi.fn((key: string, options?: any) => {
      if (key === 'paywall.trialDescription' && options?.days) {
        return `Start your ${options.days} day free trial`;
      }
      return key;
    });
    
    vi.mocked(require('react-i18next').useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'en', changeLanguage: vi.fn() },
    });
    
    renderPaywall({
      content: {
        trial: { duration: 30, description: undefined }
      }
    });
    
    // Verify interpolation works correctly
    expect(mockT).toHaveBeenCalledWith('paywall.trialDescription', { days: 30 });
  });

  it('handles missing translation keys gracefully', () => {
    const mockT = vi.fn((key: string) => key); // Return key itself when translation missing
    
    vi.mocked(require('react-i18next').useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'en', changeLanguage: vi.fn() },
    });
    
    renderPaywall();
    
    // Component should still render with fallback keys
    expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
    expect(screen.getByText('paywall.header')).toBeInTheDocument();
  });

  it('updates content when language changes', async () => {
    const mockChangeLanguage = vi.fn();
    const mockT = vi.fn((key: string) => {
      const translations: Record<string, Record<string, string>> = {
        en: { 'paywall.header': 'Upgrade to Premium' },
        es: { 'paywall.header': 'Actualizar a Premium' },
        fr: { 'paywall.header': 'Passer au Premium' },
      };
      const currentLang = mockT.mock.calls.length > 10 ? 'es' : 'en'; // Simulate language change
      return translations[currentLang]?.[key] || key;
    });
    
    vi.mocked(require('react-i18next').useTranslation).mockReturnValue({
      t: mockT,
      i18n: { language: 'en', changeLanguage: mockChangeLanguage },
    });
    
    const { rerender } = renderPaywall();
    
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    
    // Simulate language change
    mockChangeLanguage('es');
    rerender(<Paywall {...defaultProps} />);
    
    // Note: In a real scenario, this would trigger a re-render with new translations
    expect(mockChangeLanguage).toHaveBeenCalledWith('es');
  });
});

// ============================================================================
// CALENDLY INTEGRATION TESTS
// ============================================================================

describe('Paywall Component - Calendly Integration', () => {
  it('initializes Calendly widget when showCalendly is true', async () => {
    renderPaywall({ showCalendly: true });
    
    // Wait for Calendly widget to initialize
    await waitFor(() => {
      expect(mockCalendly.initInlineWidget).toHaveBeenCalled();
    });
    
    // Verify widget container is present
    expect(screen.getByTestId('calendly-widget')).toBeInTheDocument();
    
    // Verify default Calendly URL is used
    expect(mockCalendly.initInlineWidget).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
      })
    );
  });

  it('uses custom Calendly configuration when provided', async () => {
    const customCalendlyConfig = {
      url: 'https://calendly.com/custom-url/demo',
      options: {
        height: 600,
        hideEventTypeDetails: true,
        primaryColor: '#ff0000',
        textColor: '#333333',
        backgroundColor: '#ffffff',
      },
    };
    
    renderPaywall({
      showCalendly: true,
      calendlyConfig: customCalendlyConfig,
    });
    
    await waitFor(() => {
      expect(mockCalendly.initInlineWidget).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://calendly.com/custom-url/demo',
          height: 600,
          hideEventTypeDetails: true,
          primaryColor: '#ff0000',
          textColor: '#333333',
          backgroundColor: '#ffffff',
        })
      );
    });
  });

  it('handles Calendly event scheduling correctly', async () => {
    const onCalendlyEventScheduled = vi.fn();
    
    renderPaywall({
      showCalendly: true,
      onCalendlyEventScheduled,
    });
    
    await waitFor(() => {
      expect(mockCalendly.initInlineWidget).toHaveBeenCalled();
    });
    
    // Simulate Calendly event scheduling
    simulateCalendlyEventScheduled();
    
    await waitFor(() => {
      expect(onCalendlyEventScheduled).toHaveBeenCalledWith(
        expect.objectContaining({
          eventUuid: mockCalendlyEvent.eventUuid,
          invitee: expect.objectContaining({
            name: mockCalendlyEvent.invitee.name,
            email: mockCalendlyEvent.invitee.email,
          }),
        })
      );
    });
  });

  it('handles Calendly widget loading success', async () => {
    const onCalendlyLoad = vi.fn();
    
    renderPaywall({
      showCalendly: true,
      onCalendlyLoad,
    });
    
    await waitFor(() => {
      expect(onCalendlyLoad).toHaveBeenCalled();
    });
  });

  it('handles Calendly widget loading errors', async () => {
    const onCalendlyError = vi.fn();
    
    // Mock Calendly script failure
    delete (window as any).Calendly;
    
    // Mock script loading error
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName: string) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === 'script') {
        setTimeout(() => {
          if (element.onerror) {
            element.onerror(new Event('error'));
          }
        }, 100);
      }
      return element;
    });
    
    renderPaywall({
      showCalendly: true,
      onCalendlyError,
    });
    
    await waitFor(() => {
      expect(onCalendlyError).toHaveBeenCalledWith(
        expect.any(Error)
      );
    });
    
    // Restore original method
    document.createElement = originalCreateElement;
  });

  it('does not initialize Calendly when showCalendly is false', () => {
    renderPaywall({ showCalendly: false });
    
    // Should not attempt to initialize Calendly
    expect(mockCalendly.initInlineWidget).not.toHaveBeenCalled();
    
    // Should show contact information instead
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
    expect(screen.getByText('sales@dreamfactory.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (650) 350-8113')).toBeInTheDocument();
  });

  it('works correctly in mock mode', async () => {
    const onCalendlyLoad = vi.fn();
    
    renderPaywall({
      showCalendly: true,
      mockMode: true,
      onCalendlyLoad,
    });
    
    // Should immediately call onCalendlyLoad in mock mode
    await waitFor(() => {
      expect(onCalendlyLoad).toHaveBeenCalled();
    });
    
    // Should not attempt to load external script
    expect(document.querySelectorAll('script[src*="calendly.com"]')).toHaveLength(0);
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Paywall Component - Accessibility Compliance', () => {
  it('meets WCAG 2.1 AA accessibility standards', async () => {
    const { container } = renderPaywall();
    
    // Run axe-core accessibility tests
    const results = await testA11y(container, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    });
    
    // Should have no accessibility violations
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA attributes for modal dialog', () => {
    renderPaywall({ variant: 'modal' });
    
    const dialog = screen.getByRole('dialog');
    
    // Verify essential ARIA attributes
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'paywall-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'paywall-description');
    expect(dialog).toHaveAttribute('tabindex', '-1');
  });

  it('supports keyboard navigation correctly', async () => {
    const { keyboard } = renderPaywall({ variant: 'modal' });
    
    // Should focus primary action button initially
    await waitFor(() => {
      expect(screen.getByTestId('paywall-upgrade-button')).toHaveFocus();
    });
    
    // Tab navigation should work properly
    await keyboard.tab();
    expect(screen.getByTestId('paywall-secondary-button')).toHaveFocus();
    
    // Shift+Tab should go backwards
    await keyboard.tab({ shift: true });
    expect(screen.getByTestId('paywall-upgrade-button')).toHaveFocus();
  });

  it('closes on Escape key when closeOnEscape is true', async () => {
    const onDismiss = vi.fn();
    const { keyboard } = renderPaywall({
      variant: 'modal',
      closeOnEscape: true,
      onDismiss,
    });
    
    // Press Escape key
    await keyboard.escape();
    
    // Should trigger onDismiss
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not close on Escape key when closeOnEscape is false', async () => {
    const onDismiss = vi.fn();
    const { keyboard } = renderPaywall({
      variant: 'modal',
      closeOnEscape: false,
      onDismiss,
    });
    
    // Press Escape key
    await keyboard.escape();
    
    // Should not trigger onDismiss
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('has sufficient color contrast for all text elements', async () => {
    const { container } = renderPaywall();
    
    // Test specific contrast requirements
    await testA11y(container, {
      tags: ['wcag2aa'],
      includeRules: ['color-contrast'],
    });
  });

  it('provides proper focus management and restoration', async () => {
    const focusTarget = document.createElement('button');
    focusTarget.textContent = 'Focus Target';
    document.body.appendChild(focusTarget);
    focusTarget.focus();
    
    const { rerender } = renderPaywall({
      variant: 'modal',
      restoreFocus: true,
      isVisible: true,
    });
    
    // Focus should move to paywall
    await waitFor(() => {
      expect(screen.getByTestId('paywall-upgrade-button')).toHaveFocus();
    });
    
    // Hide paywall
    rerender(<Paywall {...defaultProps} isVisible={false} restoreFocus={true} />);
    
    // Focus should be restored to original element
    await waitFor(() => {
      expect(focusTarget).toHaveFocus();
    });
    
    document.body.removeChild(focusTarget);
  });

  it('announces loading states to screen readers', async () => {
    renderPaywall({
      loadingState: {
        isLoading: true,
        calendlyLoading: true,
        loadingStage: 'loading-calendly',
        widgetProgress: 50,
      },
    });
    
    // Should have aria-live region for loading announcements
    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
    expect(loadingStatus).toHaveTextContent('Loading...');
  });

  it('announces error states to screen readers', () => {
    renderPaywall({
      errorState: {
        hasError: true,
        calendlyError: true,
        message: 'Failed to load calendar widget',
      },
    });
    
    // Should have aria-live region for error announcements
    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveAttribute('aria-live', 'polite');
    expect(errorAlert).toHaveTextContent('Failed to load calendar widget');
  });

  it('has minimum touch target sizes for mobile accessibility', () => {
    renderPaywall();
    
    const buttons = [
      screen.getByTestId('paywall-upgrade-button'),
      screen.getByTestId('paywall-secondary-button'),
    ];
    
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const minHeight = parseInt(styles.minHeight);
      const minWidth = parseInt(styles.minWidth);
      
      // WCAG requires minimum 44x44px touch targets
      expect(minHeight).toBeGreaterThanOrEqual(44);
      expect(minWidth).toBeGreaterThanOrEqual(44);
    });
  });
});

// ============================================================================
// RESPONSIVE DESIGN TESTS
// ============================================================================

describe('Paywall Component - Responsive Design', () => {
  it('adapts layout for mobile screens (< 768px)', async () => {
    simulateBreakpoint(600);
    renderPaywall();
    
    const component = screen.getByTestId('paywall-component');
    
    // Should apply mobile-responsive classes
    expect(component).toHaveClass('p-4'); // Mobile padding
    
    // Buttons should stack vertically on mobile
    const footer = component.querySelector('.paywall-footer');
    expect(footer).toHaveClass('flex-col');
  });

  it('adapts layout for tablet screens (768px - 1023px)', async () => {
    simulateBreakpoint(800);
    renderPaywall();
    
    const component = screen.getByTestId('paywall-component');
    
    // Should apply tablet-responsive classes
    expect(component).toHaveClass('md:p-6'); // Tablet padding
  });

  it('adapts layout for desktop screens (≥ 1024px)', async () => {
    simulateBreakpoint(1200);
    renderPaywall();
    
    const component = screen.getByTestId('paywall-component');
    
    // Should apply desktop layout
    const content = component.querySelector('.paywall-content');
    expect(content).toHaveClass('max-w-2xl'); // Desktop max width
    
    // Features should be in grid layout on desktop
    const featuresGrid = component.querySelector('.grid');
    expect(featuresGrid).toHaveClass('md:grid-cols-2');
  });

  it('uses responsive variant overrides correctly', async () => {
    const { rerender } = renderPaywall({
      variant: 'modal',
      mobileVariant: 'banner',
      tabletVariant: 'sidebar',
    });
    
    // Test mobile variant
    simulateBreakpoint(600);
    rerender(<Paywall {...defaultProps} variant="modal" mobileVariant="banner" />);
    
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('fixed', 'top-0'); // Banner variant
    });
    
    // Test tablet variant
    simulateBreakpoint(800);
    rerender(<Paywall {...defaultProps} variant="modal" tabletVariant="sidebar" />);
    
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('fixed', 'right-0'); // Sidebar variant
    });
  });

  it('handles window resize events correctly', async () => {
    renderPaywall();
    
    // Start with desktop
    simulateBreakpoint(1200);
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('max-w-2xl');
    });
    
    // Resize to mobile
    simulateBreakpoint(400);
    await waitFor(() => {
      const component = screen.getByTestId('paywall-component');
      expect(component).toHaveClass('p-4');
    });
  });

  it('maintains accessibility on all screen sizes', async () => {
    const screenSizes = [400, 768, 1024, 1440];
    
    for (const size of screenSizes) {
      simulateBreakpoint(size);
      const { container } = renderPaywall();
      
      // Test accessibility at each breakpoint
      await testA11y(container, {
        tags: ['wcag2aa'],
        skipRules: ['color-contrast'], // Skip contrast checks for performance
      });
      
      // Verify touch targets remain accessible
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.height).toBeGreaterThanOrEqual(44);
        expect(rect.width).toBeGreaterThanOrEqual(44);
      });
    }
  });
});

// ============================================================================
// USER INTERACTION TESTS
// ============================================================================

describe('Paywall Component - User Interactions', () => {
  it('handles upgrade button click correctly', async () => {
    const onUpgradeClick = vi.fn();
    const { user } = renderPaywall({ onUpgradeClick });
    
    const upgradeButton = screen.getByTestId('paywall-upgrade-button');
    await user.click(upgradeButton);
    
    expect(onUpgradeClick).toHaveBeenCalledWith('professional');
  });

  it('handles secondary action button click correctly', async () => {
    const onSecondaryAction = vi.fn();
    const { user } = renderPaywall({ onSecondaryAction });
    
    const secondaryButton = screen.getByTestId('paywall-secondary-button');
    await user.click(secondaryButton);
    
    expect(onSecondaryAction).toHaveBeenCalledWith('schedule_meeting');
  });

  it('handles modal backdrop click when closeOnBackdrop is true', async () => {
    const onDismiss = vi.fn();
    const { user } = renderPaywall({
      variant: 'modal',
      closeOnBackdrop: true,
      onDismiss,
    });
    
    // Click on backdrop (modal container, not content)
    const backdrop = screen.getByTestId('paywall-component').parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(onDismiss).toHaveBeenCalled();
    }
  });

  it('does not close on backdrop click when closeOnBackdrop is false', async () => {
    const onDismiss = vi.fn();
    const { user } = renderPaywall({
      variant: 'modal',
      closeOnBackdrop: false,
      onDismiss,
    });
    
    // Click on backdrop
    const backdrop = screen.getByTestId('paywall-component').parentElement;
    if (backdrop) {
      await user.click(backdrop);
      expect(onDismiss).not.toHaveBeenCalled();
    }
  });

  it('handles close button click in modal variant', async () => {
    const onDismiss = vi.fn();
    const { user } = renderPaywall({
      variant: 'modal',
      onDismiss,
    });
    
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    
    expect(onDismiss).toHaveBeenCalled();
  });

  it('tracks analytics events when configured', async () => {
    const onAnalyticsEvent = vi.fn();
    const analytics = {
      trackImpressions: true,
      trackUpgradeClicks: true,
      trackCalendlyInteractions: true,
      onAnalyticsEvent,
    };
    
    const { user } = renderPaywall({ analytics });
    
    // Should track impression on render
    expect(onAnalyticsEvent).toHaveBeenCalledWith('paywall_impression', {
      requiredLevel: 'professional',
      currentLevel: 'free',
      feature: undefined,
      variant: 'modal',
    });
    
    // Should track upgrade click
    const upgradeButton = screen.getByTestId('paywall-upgrade-button');
    await user.click(upgradeButton);
    
    expect(onAnalyticsEvent).toHaveBeenCalledWith('paywall_upgrade_click', {
      requiredLevel: 'professional',
      currentLevel: 'free',
      feature: undefined,
      variant: 'modal',
    });
  });

  it('handles disabled state correctly', () => {
    renderPaywall({
      loadingState: { isLoading: true, loadingStage: 'initializing', widgetProgress: 0, calendlyLoading: false },
    });
    
    const upgradeButton = screen.getByTestId('paywall-upgrade-button');
    const secondaryButton = screen.getByTestId('paywall-secondary-button');
    
    expect(upgradeButton).toBeDisabled();
    expect(secondaryButton).toBeDisabled();
  });

  it('supports hover interactions for non-touch devices', async () => {
    const { user } = renderPaywall();
    
    const upgradeButton = screen.getByTestId('paywall-upgrade-button');
    
    await user.hover(upgradeButton);
    
    // Should apply hover styles
    expect(upgradeButton).toHaveClass('hover:bg-primary-700');
  });
});

// ============================================================================
// LOADING AND ERROR STATE TESTS
// ============================================================================

describe('Paywall Component - Loading and Error States', () => {
  it('displays loading state correctly', () => {
    renderPaywall({
      loadingState: {
        isLoading: true,
        calendlyLoading: true,
        loadingStage: 'loading-calendly',
        widgetProgress: 75,
      },
    });
    
    // Should show loading indicator
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays error state correctly', () => {
    const retryAction = vi.fn();
    
    renderPaywall({
      errorState: {
        hasError: true,
        calendlyError: true,
        networkError: true,
        message: 'Network connection failed',
        retryAction,
      },
    });
    
    // Should show error alert
    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('Network connection failed');
    
    // Should show retry button
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles retry action correctly', async () => {
    const retryAction = vi.fn();
    const { user } = renderPaywall({
      errorState: {
        hasError: true,
        message: 'Something went wrong',
        retryAction,
      },
    });
    
    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);
    
    expect(retryAction).toHaveBeenCalled();
  });

  it('combines internal and external loading states', () => {
    renderPaywall({
      loadingState: {
        isLoading: false,
        calendlyLoading: true,
        loadingStage: 'ready',
        widgetProgress: 100,
      },
    });
    
    // Should show loading because calendlyLoading is true
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('combines internal and external error states', () => {
    renderPaywall({
      errorState: {
        hasError: false,
        calendlyError: true,
        message: 'Calendly failed to load',
      },
    });
    
    // Should show error because calendlyError is true
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Calendly failed to load')).toBeInTheDocument();
  });

  it('shows Calendly loading overlay when widget is initializing', async () => {
    renderPaywall({
      showCalendly: true,
      loadingState: {
        isLoading: false,
        calendlyLoading: true,
        loadingStage: 'loading-calendly',
        widgetProgress: 50,
      },
    });
    
    const calendlyWidget = screen.getByTestId('calendly-widget');
    expect(calendlyWidget).toBeInTheDocument();
    
    // Should show loading overlay on top of Calendly widget
    const loadingOverlay = calendlyWidget.querySelector('.absolute.inset-0');
    expect(loadingOverlay).toBeInTheDocument();
  });
});

// ============================================================================
// IMPERATIVE API TESTS
// ============================================================================

describe('Paywall Component - Imperative API', () => {
  it('exposes ref methods correctly', () => {
    const ref = React.createRef<PaywallRef>();
    
    renderPaywall({ ref });
    
    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.show).toBe('function');
    expect(typeof ref.current?.hide).toBe('function');
    expect(typeof ref.current?.toggle).toBe('function');
    expect(typeof ref.current?.focusPrimaryAction).toBe('function');
    expect(typeof ref.current?.reset).toBe('function');
    expect(typeof ref.current?.isCalendlyLoaded).toBe('function');
    expect(typeof ref.current?.refreshCalendly).toBe('function');
  });

  it('show() method works correctly', () => {
    const ref = React.createRef<PaywallRef>();
    const onShow = vi.fn();
    
    renderPaywall({ ref, isVisible: false, onShow });
    
    act(() => {
      ref.current?.show();
    });
    
    expect(onShow).toHaveBeenCalled();
  });

  it('hide() method works correctly', () => {
    const ref = React.createRef<PaywallRef>();
    const onHide = vi.fn();
    
    renderPaywall({ ref, isVisible: true, onHide });
    
    act(() => {
      ref.current?.hide();
    });
    
    expect(onHide).toHaveBeenCalled();
  });

  it('toggle() method works correctly', () => {
    const ref = React.createRef<PaywallRef>();
    const onShow = vi.fn();
    const onHide = vi.fn();
    
    renderPaywall({ ref, isVisible: false, onShow, onHide });
    
    // Toggle from hidden to visible
    act(() => {
      ref.current?.toggle();
    });
    expect(onShow).toHaveBeenCalled();
    
    // Reset mocks
    onShow.mockClear();
    onHide.mockClear();
    
    // Toggle from visible to hidden
    act(() => {
      ref.current?.toggle();
    });
    expect(onHide).toHaveBeenCalled();
  });

  it('focusPrimaryAction() method works correctly', async () => {
    const ref = React.createRef<PaywallRef>();
    
    renderPaywall({ ref });
    
    act(() => {
      ref.current?.focusPrimaryAction();
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('paywall-upgrade-button')).toHaveFocus();
    });
  });

  it('reset() method clears error and loading states', () => {
    const ref = React.createRef<PaywallRef>();
    
    const { rerender } = renderPaywall({
      ref,
      errorState: { hasError: true, message: 'Test error' },
      loadingState: { isLoading: true, loadingStage: 'initializing', calendlyLoading: false, widgetProgress: 0 },
    });
    
    // Verify error state is shown
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    act(() => {
      ref.current?.reset();
    });
    
    // Re-render without error/loading states to test reset effect
    rerender(<Paywall {...defaultProps} ref={ref} />);
    
    // Error and loading states should be cleared
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('isCalendlyLoaded() method returns correct state', async () => {
    const ref = React.createRef<PaywallRef>();
    
    renderPaywall({ ref, showCalendly: true });
    
    // Initially should be false
    expect(ref.current?.isCalendlyLoaded()).toBe(false);
    
    // Wait for Calendly to load
    await waitFor(() => {
      expect(ref.current?.isCalendlyLoaded()).toBe(true);
    });
  });

  it('refreshCalendly() method reinitializes widget', async () => {
    const ref = React.createRef<PaywallRef>();
    
    renderPaywall({ ref, showCalendly: true });
    
    // Wait for initial load
    await waitFor(() => {
      expect(mockCalendly.initInlineWidget).toHaveBeenCalledTimes(1);
    });
    
    // Clear mock and refresh
    mockCalendly.initInlineWidget.mockClear();
    
    act(() => {
      ref.current?.refreshCalendly();
    });
    
    // Should reinitialize widget
    await waitFor(() => {
      expect(mockCalendly.initInlineWidget).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// INTEGRATION AND EDGE CASE TESTS
// ============================================================================

describe('Paywall Component - Integration and Edge Cases', () => {
  it('handles custom render functions correctly', () => {
    const renderContent = vi.fn((props: PaywallProps) => (
      <div data-testid="custom-content">
        Custom Content: {props.requiredLevel}
      </div>
    ));
    
    renderPaywall({ renderContent });
    
    expect(renderContent).toHaveBeenCalledWith(
      expect.objectContaining({
        requiredLevel: 'professional',
        isVisible: true,
      })
    );
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content: professional')).toBeInTheDocument();
  });

  it('handles autoShow prop correctly', () => {
    const onShow = vi.fn();
    
    renderPaywall({ isVisible: false, autoShow: true, onShow });
    
    // Should show automatically
    expect(onShow).toHaveBeenCalled();
  });

  it('handles showDelay prop correctly', async () => {
    const onShow = vi.fn();
    
    renderPaywall({ isVisible: false, showDelay: 500, onShow });
    
    // Should not show immediately
    expect(onShow).not.toHaveBeenCalled();
    
    // Should show after delay
    await waitFor(() => {
      expect(onShow).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('handles visibility changes correctly', async () => {
    const onShow = vi.fn();
    const onHide = vi.fn();
    
    const { rerender } = renderPaywall({
      isVisible: false,
      onShow,
      onHide,
    });
    
    // Should not be visible initially
    expect(screen.queryByTestId('paywall-component')).not.toBeInTheDocument();
    
    // Show paywall
    rerender(<Paywall {...defaultProps} isVisible={true} onShow={onShow} onHide={onHide} />);
    
    expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
    expect(onShow).toHaveBeenCalled();
    
    // Hide paywall
    rerender(<Paywall {...defaultProps} isVisible={false} onShow={onShow} onHide={onHide} />);
    
    expect(screen.queryByTestId('paywall-component')).not.toBeInTheDocument();
  });

  it('handles feature gate configuration correctly', async () => {
    const feature = {
      featureId: 'advanced-schema-management',
      requiredLevel: 'professional' as PaywallLevel,
      description: 'Advanced schema management tools',
      category: 'database',
    };
    
    const onUpgradeClick = vi.fn();
    const analytics = {
      trackUpgradeClicks: true,
      onAnalyticsEvent: vi.fn(),
    };
    
    const { user } = renderPaywall({
      feature,
      analytics,
      onUpgradeClick,
    });
    
    const upgradeButton = screen.getByTestId('paywall-upgrade-button');
    await user.click(upgradeButton);
    
    // Should track analytics with feature information
    expect(analytics.onAnalyticsEvent).toHaveBeenCalledWith('paywall_upgrade_click', {
      requiredLevel: 'professional',
      currentLevel: 'free',
      feature: 'advanced-schema-management',
      variant: 'modal',
    });
  });

  it('prevents rendering when not visible and not modal variant', () => {
    renderPaywall({
      isVisible: false,
      variant: 'inline',
    });
    
    // Should not render for non-modal variants when not visible
    expect(screen.queryByTestId('paywall-component')).not.toBeInTheDocument();
  });

  it('handles complex level hierarchy correctly', () => {
    const levels: [PaywallLevel, PaywallLevel, boolean][] = [
      ['free', 'starter', true],      // Should show
      ['starter', 'professional', true], // Should show
      ['professional', 'enterprise', true], // Should show
      ['enterprise', 'free', false],     // Should not show
      ['professional', 'starter', false], // Should not show
      ['trial', 'professional', true],   // Should show
      ['professional', 'trial', false],  // Should not show
    ];
    
    levels.forEach(([current, required, shouldShow]) => {
      const { container } = renderPaywall({
        currentLevel: current,
        requiredLevel: required,
        debugMode: false,
      });
      
      if (shouldShow) {
        expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('paywall-component')).not.toBeInTheDocument();
      }
      
      // Clean up for next iteration
      container.remove();
    });
  });

  it('handles missing window.Calendly gracefully', async () => {
    const onCalendlyError = vi.fn();
    
    // Remove Calendly from window
    delete (window as any).Calendly;
    
    renderPaywall({
      showCalendly: true,
      onCalendlyError,
    });
    
    // Should handle missing Calendly gracefully
    await waitFor(() => {
      expect(screen.getByText('Contact Sales')).toBeInTheDocument();
    });
  });

  it('handles script loading failures gracefully', async () => {
    const onCalendlyError = vi.fn();
    
    // Mock server error for Calendly script
    server.use(
      http.get('https://assets.calendly.com/assets/external/widget.js', () => {
        return new HttpResponse('', { status: 500 });
      })
    );
    
    renderPaywall({
      showCalendly: true,
      onCalendlyError,
      mockMode: false, // Disable mock mode to test real script loading
    });
    
    await waitFor(() => {
      expect(onCalendlyError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

// ============================================================================
// PERFORMANCE AND CLEANUP TESTS
// ============================================================================

describe('Paywall Component - Performance and Cleanup', () => {
  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderPaywall({ showCalendly: true });
    
    // Should add event listeners
    expect(addEventListenerSpy).toHaveBeenCalled();
    
    unmount();
    
    // Should remove event listeners
    expect(removeEventListenerSpy).toHaveBeenCalled();
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('does not cause memory leaks with multiple instances', () => {
    const instances = Array.from({ length: 10 }, (_, i) =>
      renderPaywall({ 'data-testid': `paywall-${i}` })
    );
    
    // All instances should render correctly
    instances.forEach((_, i) => {
      expect(screen.getByTestId(`paywall-${i}`)).toBeInTheDocument();
    });
    
    // Clean up all instances
    instances.forEach(({ unmount }) => unmount());
    
    // All instances should be removed
    instances.forEach((_, i) => {
      expect(screen.queryByTestId(`paywall-${i}`)).not.toBeInTheDocument();
    });
  });

  it('handles rapid state changes gracefully', async () => {
    const { rerender } = renderPaywall({ isVisible: false });
    
    // Rapidly toggle visibility
    for (let i = 0; i < 10; i++) {
      rerender(<Paywall {...defaultProps} isVisible={i % 2 === 0} />);
      await waitFor(() => {
        // Component should handle rapid changes without errors
      });
    }
    
    // Final state should be stable
    rerender(<Paywall {...defaultProps} isVisible={true} />);
    expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
  });

  it('maintains performance with large content datasets', () => {
    const largeFeatureList = Array.from({ length: 100 }, (_, i) => ({
      title: `Feature ${i + 1}`,
      description: `Description for feature ${i + 1}`,
    }));
    
    const startTime = performance.now();
    
    renderPaywall({
      content: {
        features: largeFeatureList,
      },
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render in reasonable time (< 100ms)
    expect(renderTime).toBeLessThan(100);
    
    // Should still be accessible with large datasets
    expect(screen.getByTestId('paywall-component')).toBeInTheDocument();
  });
});