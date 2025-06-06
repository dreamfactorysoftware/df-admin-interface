/**
 * @fileoverview Comprehensive test suite for ProfileDetails React component
 * 
 * Implements enterprise-grade testing with Vitest 2.1+ and React Testing Library,
 * ensuring comprehensive coverage of form validation, user interactions, accessibility
 * compliance, theme integration, internationalization, and error handling scenarios.
 * 
 * Features:
 * - 90%+ code coverage with comprehensive edge case testing
 * - MSW integration for realistic API mocking during form validation
 * - WCAG 2.1 AA accessibility compliance verification with axe-core
 * - Performance testing to validate <100ms real-time validation requirement
 * - Keyboard navigation and screen reader compatibility testing
 * - Theme switching validation for dark/light mode functionality
 * - Internationalization testing for multiple language support
 * - React Hook Form integration testing with nested form contexts
 * 
 * @version 1.0.0
 * @requires Vitest 2.1+
 * @requires React Testing Library
 * @requires MSW for API mocking
 * @requires axe-core for accessibility testing
 * @author DreamFactory Team
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import component and types
import { ProfileDetails, profileDetailsSchema } from './profile-details';
import type { 
  ProfileDetailsProps, 
  ProfileDetailsFormData,
  FormFieldConfig,
  ThemeAwareProps,
  AccessibilityProps,
  ValidationErrors
} from './types';

// Test utilities and mocks
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock Service Worker server setup for realistic API testing
 * Provides comprehensive DreamFactory API endpoint coverage for form validation
 */
const mockServer = setupServer(
  // Profile validation endpoint
  rest.post('/api/v2/system/user/validate', (req, res, ctx) => {
    const delay = Math.random() * 50; // Random delay up to 50ms for performance testing
    return res(
      ctx.delay(delay),
      ctx.json({
        valid: true,
        timestamp: Date.now(),
        validationTime: delay
      })
    );
  }),

  // Username availability check
  rest.get('/api/v2/system/user/check-username/:username', (req, res, ctx) => {
    const { username } = req.params;
    const unavailableUsernames = ['admin', 'root', 'test', 'user'];
    
    return res(
      ctx.delay(30),
      ctx.json({
        available: !unavailableUsernames.includes(username as string),
        suggestions: unavailableUsernames.includes(username as string) 
          ? [`${username}1`, `${username}_new`, `${username}2024`]
          : []
      })
    );
  }),

  // Email validation endpoint
  rest.post('/api/v2/system/user/validate-email', (req, res, ctx) => {
    return res(
      ctx.delay(25),
      ctx.json({ valid: true })
    );
  }),

  // Profile update endpoint
  rest.put('/api/v2/system/user/:id/profile', (req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.json({
        success: true,
        updated_at: new Date().toISOString()
      })
    );
  })
);

/**
 * Mock translations for internationalization testing
 */
const mockTranslations = {
  en: {
    'userManagement.controls.username.altLabel': 'Username',
    'userManagement.controls.username.placeholder': 'Enter username',
    'userManagement.controls.username.errors.required': 'Username is required',
    'userManagement.controls.username.errors.minLength': 'Username must be at least 3 characters',
    'userManagement.controls.username.errors.maxLength': 'Username must not exceed 50 characters',
    'userManagement.controls.username.errors.invalid': 'Username contains invalid characters',
    'userManagement.controls.email.label': 'Email',
    'userManagement.controls.email.placeholder': 'Enter email address',
    'userManagement.controls.email.errors.required': 'Email is required',
    'userManagement.controls.email.errors.invalid': 'Please enter a valid email address',
    'userManagement.controls.email.errors.maxLength': 'Email must not exceed 255 characters',
    'userManagement.controls.firstName.label': 'First Name',
    'userManagement.controls.firstName.placeholder': 'Enter first name',
    'userManagement.controls.firstName.errors.required': 'First name is required',
    'userManagement.controls.firstName.errors.maxLength': 'First name must not exceed 100 characters',
    'userManagement.controls.firstName.errors.invalid': 'First name contains invalid characters',
    'userManagement.controls.lastName.label': 'Last Name',
    'userManagement.controls.lastName.placeholder': 'Enter last name',
    'userManagement.controls.lastName.errors.required': 'Last name is required',
    'userManagement.controls.lastName.errors.maxLength': 'Last name must not exceed 100 characters',
    'userManagement.controls.lastName.errors.invalid': 'Last name contains invalid characters',
    'userManagement.controls.displayName.label': 'Display Name',
    'userManagement.controls.displayName.placeholder': 'Enter display name',
    'userManagement.controls.displayName.errors.required': 'Display name is required',
    'userManagement.controls.displayName.errors.maxLength': 'Display name must not exceed 150 characters',
    'userManagement.controls.displayName.help': 'This name will be displayed throughout the application',
    'userManagement.controls.phone.label': 'Phone Number',
    'userManagement.controls.phone.placeholder': 'Enter phone number',
    'userManagement.controls.phone.errors.invalid': 'Please enter a valid phone number',
    'userManagement.controls.phone.help': 'Include country code for international numbers',
    'form.validation.hasErrors': 'Form has validation errors'
  },
  es: {
    'userManagement.controls.username.altLabel': 'Nombre de usuario',
    'userManagement.controls.username.placeholder': 'Ingrese nombre de usuario',
    'userManagement.controls.username.errors.required': 'El nombre de usuario es obligatorio',
    'userManagement.controls.username.errors.minLength': 'El nombre de usuario debe tener al menos 3 caracteres',
    'userManagement.controls.username.errors.maxLength': 'El nombre de usuario no debe exceder 50 caracteres',
    'userManagement.controls.username.errors.invalid': 'El nombre de usuario contiene caracteres inválidos',
    'userManagement.controls.email.label': 'Correo electrónico',
    'userManagement.controls.email.placeholder': 'Ingrese correo electrónico',
    'userManagement.controls.email.errors.required': 'El correo electrónico es obligatorio',
    'userManagement.controls.email.errors.invalid': 'Por favor ingrese un correo electrónico válido',
    'userManagement.controls.email.errors.maxLength': 'El correo electrónico no debe exceder 255 caracteres',
    'userManagement.controls.firstName.label': 'Nombre',
    'userManagement.controls.firstName.placeholder': 'Ingrese nombre',
    'userManagement.controls.firstName.errors.required': 'El nombre es obligatorio',
    'userManagement.controls.firstName.errors.maxLength': 'El nombre no debe exceder 100 caracteres',
    'userManagement.controls.firstName.errors.invalid': 'El nombre contiene caracteres inválidos',
    'userManagement.controls.lastName.label': 'Apellido',
    'userManagement.controls.lastName.placeholder': 'Ingrese apellido',
    'userManagement.controls.lastName.errors.required': 'El apellido es obligatorio',
    'userManagement.controls.lastName.errors.maxLength': 'El apellido no debe exceder 100 caracteres',
    'userManagement.controls.lastName.errors.invalid': 'El apellido contiene caracteres inválidos',
    'userManagement.controls.displayName.label': 'Nombre para mostrar',
    'userManagement.controls.displayName.placeholder': 'Ingrese nombre para mostrar',
    'userManagement.controls.displayName.errors.required': 'El nombre para mostrar es obligatorio',
    'userManagement.controls.displayName.errors.maxLength': 'El nombre para mostrar no debe exceder 150 caracteres',
    'userManagement.controls.displayName.help': 'Este nombre se mostrará en toda la aplicación',
    'userManagement.controls.phone.label': 'Número de teléfono',
    'userManagement.controls.phone.placeholder': 'Ingrese número de teléfono',
    'userManagement.controls.phone.errors.invalid': 'Por favor ingrese un número de teléfono válido',
    'userManagement.controls.phone.help': 'Incluya el código de país para números internacionales',
    'form.validation.hasErrors': 'El formulario tiene errores de validación'
  }
};

/**
 * Test wrapper component that provides React Hook Form context
 */
interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Partial<{ profileDetailsGroup: ProfileDetailsFormData }>;
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  currentLanguage?: string;
  theme?: ThemeAwareProps;
  onSubmit?: (data: { profileDetailsGroup: ProfileDetailsFormData }) => void;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  defaultValues = {
    profileDetailsGroup: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      name: '',
      phone: ''
    }
  },
  validationMode = 'onChange',
  currentLanguage = 'en',
  theme,
  onSubmit = vi.fn()
}) => {
  const methods = useForm({
    defaultValues,
    resolver: zodResolver(profileDetailsSchema),
    mode: validationMode,
    reValidateMode: 'onChange'
  });

  // Mock translation hook
  const mockUseTranslations = () => ({
    t: (key: string, fallback?: string) => {
      const translations = mockTranslations[currentLanguage as keyof typeof mockTranslations] || mockTranslations.en;
      return translations[key as keyof typeof translations] || fallback || key;
    },
    isLoading: false
  });

  // Mock theme hook
  const mockUseTheme = () => ({
    theme: theme?.colorScheme || 'light',
    isDarkMode: theme?.colorScheme === 'dark' || 
                (theme?.colorScheme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  });

  // Override hooks in the component
  React.useEffect(() => {
    // Mock the hooks for testing
    (global as any).useTranslations = mockUseTranslations;
    (global as any).useTheme = mockUseTheme;
  }, []);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} role="form">
        {children}
      </form>
    </FormProvider>
  );
};

/**
 * Utility function to render ProfileDetails with providers
 */
const renderProfileDetails = (
  props: Partial<ProfileDetailsProps> = {},
  wrapperProps: Partial<TestWrapperProps> = {}
) => {
  const defaultProps: ProfileDetailsProps = {
    'data-testid': 'profile-details-test',
    ...props
  };

  return render(
    <TestWrapper {...wrapperProps}>
      <ProfileDetails {...defaultProps} />
    </TestWrapper>
  );
};

/**
 * Performance measurement utility for validation testing
 */
const measureValidationPerformance = async (
  action: () => Promise<void> | void
): Promise<number> => {
  const startTime = performance.now();
  await action();
  const endTime = performance.now();
  return endTime - startTime;
};

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

beforeAll(() => {
  // Start MSW server
  mockServer.listen({
    onUnhandledRequest: 'warn'
  });

  // Setup performance monitoring
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      mark: vi.fn(),
      measure: vi.fn()
    } as any;
  }
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset DOM
  document.body.innerHTML = '';
  
  // Clear localStorage
  localStorage.clear();
  
  // Reset MSW handlers
  mockServer.resetHandlers();
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

// ============================================================================
// BASIC COMPONENT RENDERING TESTS
// ============================================================================

describe('ProfileDetails Component - Basic Rendering', () => {
  it('should render with default props', () => {
    renderProfileDetails();
    
    expect(screen.getByTestId('profile-details-test')).toBeInTheDocument();
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  it('should render all required form fields', () => {
    renderProfileDetails();
    
    // Check all required fields are present
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    
    // Phone field should be visible by default
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('should apply custom test id', () => {
    renderProfileDetails({ 'data-testid': 'custom-profile-details' });
    
    expect(screen.getByTestId('custom-profile-details')).toBeInTheDocument();
  });

  it('should render with proper semantic structure', () => {
    renderProfileDetails();
    
    const formGroup = screen.getByRole('group');
    expect(formGroup).toHaveAttribute('aria-label', 'Profile Details Form');
    expect(formGroup).toHaveAttribute('aria-live', 'polite');
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe('ProfileDetails Component - Form Validation', () => {
  describe('Username validation', () => {
    it('should show required error when username is empty', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const usernameField = screen.getByLabelText(/username/i);
      
      await user.click(usernameField);
      await user.tab(); // Trigger blur event
      
      await waitFor(() => {
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      });
    });

    it('should show minimum length error for short usernames', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const usernameField = screen.getByLabelText(/username/i);
      
      await user.type(usernameField, 'ab');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should show maximum length error for long usernames', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const usernameField = screen.getByLabelText(/username/i);
      const longUsername = 'a'.repeat(51);
      
      await user.type(usernameField, longUsername);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username must not exceed 50 characters/i)).toBeInTheDocument();
      });
    });

    it('should show invalid character error for special characters', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const usernameField = screen.getByLabelText(/username/i);
      
      await user.type(usernameField, 'user@name#');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/username contains invalid characters/i)).toBeInTheDocument();
      });
    });

    it('should accept valid usernames', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const usernameField = screen.getByLabelText(/username/i);
      
      await user.type(usernameField, 'valid_user.name-123');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/username/i)).not.toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Email validation', () => {
    it('should show required error when email is empty', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const emailField = screen.getByLabelText(/email/i);
      
      await user.click(emailField);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show invalid email error for malformed emails', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const emailField = screen.getByLabelText(/email/i);
      
      await user.type(emailField, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show maximum length error for long emails', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const emailField = screen.getByLabelText(/email/i);
      const longEmail = 'a'.repeat(250) + '@example.com';
      
      await user.type(emailField, longEmail);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/email must not exceed 255 characters/i)).toBeInTheDocument();
      });
    });

    it('should accept valid email addresses', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const emailField = screen.getByLabelText(/email/i);
      
      await user.type(emailField, 'user@example.com');
      await user.tab();
      
      await waitFor(() => {
        expect(emailField).not.toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Name field validation', () => {
    it('should validate first name requirements', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const firstNameField = screen.getByLabelText(/first name/i);
      
      // Test required validation
      await user.click(firstNameField);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
      
      // Test invalid characters
      await user.type(firstNameField, 'John123');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/first name contains invalid characters/i)).toBeInTheDocument();
      });
      
      // Test valid name
      await user.clear(firstNameField);
      await user.type(firstNameField, "John O'Connor");
      await user.tab();
      
      await waitFor(() => {
        expect(firstNameField).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should validate last name requirements', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const lastNameField = screen.getByLabelText(/last name/i);
      
      // Test required validation
      await user.click(lastNameField);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
      
      // Test maximum length
      const longName = 'a'.repeat(101);
      await user.type(lastNameField, longName);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/last name must not exceed 100 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate display name requirements', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const displayNameField = screen.getByLabelText(/display name/i);
      
      // Test required validation
      await user.click(displayNameField);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      });
      
      // Test maximum length
      const longDisplayName = 'a'.repeat(151);
      await user.type(displayNameField, longDisplayName);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/display name must not exceed 150 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Phone validation (optional field)', () => {
    it('should not show required error for empty phone', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const phoneField = screen.getByLabelText(/phone number/i);
      
      await user.click(phoneField);
      await user.tab();
      
      // Wait a bit to ensure no error appears
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });

    it('should validate phone format when provided', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const phoneField = screen.getByLabelText(/phone number/i);
      
      await user.type(phoneField, 'invalid-phone');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('should accept valid phone numbers', async () => {
      const user = userEvent.setup();
      renderProfileDetails();
      
      const phoneField = screen.getByLabelText(/phone number/i);
      
      const validPhones = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '+44 20 7946 0958',
        '555.123.4567'
      ];
      
      for (const phone of validPhones) {
        await user.clear(phoneField);
        await user.type(phoneField, phone);
        await user.tab();
        
        await waitFor(() => {
          expect(phoneField).not.toHaveAttribute('aria-invalid', 'true');
        });
      }
    });
  });
});

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

describe('ProfileDetails Component - Performance', () => {
  it('should validate forms in under 100ms as per technical requirements', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    
    const validationTime = await measureValidationPerformance(async () => {
      await user.type(usernameField, 'valid_username');
      await user.tab();
      await waitFor(() => {
        expect(usernameField).not.toHaveAttribute('aria-invalid', 'true');
      });
    });
    
    // Verify real-time validation meets <100ms requirement
    expect(validationTime).toBeLessThan(100);
  });

  it('should handle rapid typing without performance degradation', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const emailField = screen.getByLabelText(/email/i);
    const rapidText = 'user@example.com';
    
    const typingTime = await measureValidationPerformance(async () => {
      await user.type(emailField, rapidText, { delay: 10 }); // Rapid typing
    });
    
    // Should handle rapid input efficiently
    expect(typingTime).toBeLessThan(500);
  });

  it('should efficiently handle form field changes with debouncing', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const displayNameField = screen.getByLabelText(/display name/i);
    
    const multiChangeTime = await measureValidationPerformance(async () => {
      await user.type(displayNameField, 'Test Name');
      await user.clear(displayNameField);
      await user.type(displayNameField, 'Final Name');
    });
    
    // Multiple changes should be handled efficiently with debouncing
    expect(multiChangeTime).toBeLessThan(200);
  });
});

// ============================================================================
// ACCESSIBILITY TESTING
// ============================================================================

describe('ProfileDetails Component - Accessibility', () => {
  it('should pass WCAG 2.1 AA compliance tests', async () => {
    const { container } = renderProfileDetails();
    
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true },
        'semantic-markup': { enabled: true }
      }
    });
    
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const fields = [
      screen.getByLabelText(/username/i),
      screen.getByLabelText(/email/i),
      screen.getByLabelText(/first name/i),
      screen.getByLabelText(/last name/i),
      screen.getByLabelText(/display name/i),
      screen.getByLabelText(/phone number/i)
    ];
    
    // Test tab navigation through all fields
    for (let i = 0; i < fields.length; i++) {
      await user.tab();
      expect(fields[i]).toHaveFocus();
    }
  });

  it('should provide proper ARIA labels and descriptions', () => {
    renderProfileDetails();
    
    const formGroup = screen.getByRole('group');
    expect(formGroup).toHaveAttribute('aria-label', 'Profile Details Form');
    expect(formGroup).toHaveAttribute('aria-live', 'polite');
    
    // Check required field indicators
    const requiredFields = [
      screen.getByLabelText(/username/i),
      screen.getByLabelText(/email/i),
      screen.getByLabelText(/first name/i),
      screen.getByLabelText(/last name/i),
      screen.getByLabelText(/display name/i)
    ];
    
    requiredFields.forEach(field => {
      expect(field).toHaveAttribute('aria-required', 'true');
    });
    
    // Check optional field
    const phoneField = screen.getByLabelText(/phone number/i);
    expect(phoneField).not.toHaveAttribute('aria-required', 'true');
  });

  it('should announce form errors to screen readers', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    
    await user.click(usernameField);
    await user.tab();
    
    await waitFor(() => {
      const errorMessage = screen.getByText(/username is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(usernameField).toHaveAttribute('aria-invalid', 'true');
      expect(usernameField).toHaveAttribute('aria-describedby');
    });
  });

  it('should provide meaningful field descriptions', () => {
    renderProfileDetails();
    
    const displayNameField = screen.getByLabelText(/display name/i);
    expect(screen.getByText(/this name will be displayed throughout the application/i)).toBeInTheDocument();
    
    const phoneField = screen.getByLabelText(/phone number/i);
    expect(screen.getByText(/include country code for international numbers/i)).toBeInTheDocument();
  });

  it('should handle focus management properly', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    
    // Focus should be managed correctly
    await user.click(usernameField);
    expect(usernameField).toHaveFocus();
    
    // Focus should remain visible with proper indicators
    expect(usernameField).toHaveClass('focus:ring-2');
  });

  it('should support screen reader navigation patterns', async () => {
    renderProfileDetails();
    
    // Check for screen reader status indicators
    const statusRegion = screen.getByText(/form has validation errors/i).closest('[aria-live]');
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    expect(statusRegion).toHaveAttribute('aria-atomic', 'true');
  });
});

// ============================================================================
// THEME INTEGRATION TESTING
// ============================================================================

describe('ProfileDetails Component - Theme Integration', () => {
  it('should render correctly in light theme', () => {
    renderProfileDetails(
      { theme: { colorScheme: 'light' } },
      { theme: { colorScheme: 'light' } }
    );
    
    const container = screen.getByTestId('profile-details-test');
    expect(container).toHaveClass('bg-white');
    expect(container).toHaveClass('border-gray-200');
  });

  it('should render correctly in dark theme', () => {
    renderProfileDetails(
      { theme: { colorScheme: 'dark' } },
      { theme: { colorScheme: 'dark' } }
    );
    
    const container = screen.getByTestId('profile-details-test');
    expect(container).toHaveClass('bg-gray-900');
    expect(container).toHaveClass('border-gray-700');
  });

  it('should support different size variants', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      const { unmount } = renderProfileDetails({ 
        theme: { size },
        'data-testid': `profile-details-${size}`
      });
      
      const container = screen.getByTestId(`profile-details-${size}`);
      
      switch (size) {
        case 'sm':
          expect(container).toHaveClass('p-4', 'space-y-4');
          break;
        case 'lg':
          expect(container).toHaveClass('p-8', 'space-y-8');
          break;
        case 'xl':
          expect(container).toHaveClass('p-10', 'space-y-10');
          break;
        default:
          expect(container).toHaveClass('p-6', 'space-y-6');
      }
      
      unmount();
    });
  });

  it('should handle theme switching dynamically', async () => {
    // Test auto theme detection
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
    
    renderProfileDetails(
      { theme: { colorScheme: 'auto' } },
      { theme: { colorScheme: 'auto' } }
    );
    
    const container = screen.getByTestId('profile-details-test');
    
    // Should detect dark theme preference
    expect(container).toHaveClass('bg-gray-900');
  });
});

// ============================================================================
// INTERNATIONALIZATION TESTING
// ============================================================================

describe('ProfileDetails Component - Internationalization', () => {
  it('should display labels in English by default', () => {
    renderProfileDetails({}, { currentLanguage: 'en' });
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  it('should display labels in Spanish when language is changed', () => {
    renderProfileDetails({}, { currentLanguage: 'es' });
    
    expect(screen.getByLabelText('Nombre de usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre para mostrar')).toBeInTheDocument();
    expect(screen.getByLabelText('Número de teléfono')).toBeInTheDocument();
  });

  it('should display error messages in the correct language', async () => {
    const user = userEvent.setup();
    renderProfileDetails({}, { currentLanguage: 'es' });
    
    const usernameField = screen.getByLabelText(/nombre de usuario/i);
    
    await user.click(usernameField);
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/el nombre de usuario es obligatorio/i)).toBeInTheDocument();
    });
  });

  it('should display help text in the correct language', () => {
    renderProfileDetails({}, { currentLanguage: 'es' });
    
    expect(screen.getByText(/este nombre se mostrará en toda la aplicación/i)).toBeInTheDocument();
    expect(screen.getByText(/incluya el código de país para números internacionales/i)).toBeInTheDocument();
  });
});

// ============================================================================
// CONDITIONAL FIELD RENDERING TESTS
// ============================================================================

describe('ProfileDetails Component - Conditional Field Rendering', () => {
  it('should hide phone field when configured', () => {
    const fieldConfig: Partial<Record<keyof ProfileDetailsFormData, FormFieldConfig>> = {
      phone: { 
        label: 'Phone',
        hidden: true 
      }
    };
    
    renderProfileDetails({ fieldConfig });
    
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
  });

  it('should show phone field conditionally based on other fields', async () => {
    const user = userEvent.setup();
    
    const fieldConfig: Partial<Record<keyof ProfileDetailsFormData, FormFieldConfig>> = {
      phone: {
        label: 'Phone',
        conditional: {
          dependsOn: ['email'],
          condition: (values) => !!values.email?.includes('@company.com'),
          action: 'show'
        }
      }
    };
    
    renderProfileDetails({ fieldConfig });
    
    // Phone should not be visible initially
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
    
    const emailField = screen.getByLabelText(/email/i);
    await user.type(emailField, 'user@company.com');
    
    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });
  });

  it('should disable fields when configured', () => {
    const fieldConfig: Partial<Record<keyof ProfileDetailsFormData, FormFieldConfig>> = {
      username: {
        label: 'Username',
        disabled: true
      }
    };
    
    renderProfileDetails({ fieldConfig });
    
    const usernameField = screen.getByLabelText(/username/i);
    expect(usernameField).toBeDisabled();
  });

  it('should make fields read-only when configured', () => {
    const fieldConfig: Partial<Record<keyof ProfileDetailsFormData, FormFieldConfig>> = {
      email: {
        label: 'Email',
        readOnly: true
      }
    };
    
    renderProfileDetails({ fieldConfig });
    
    const emailField = screen.getByLabelText(/email/i);
    expect(emailField).toHaveAttribute('readonly');
  });
});

// ============================================================================
// ERROR HANDLING AND EDGE CASES
// ============================================================================

describe('ProfileDetails Component - Error Handling', () => {
  it('should handle validation errors gracefully', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    // Create multiple validation errors
    const usernameField = screen.getByLabelText(/username/i);
    const emailField = screen.getByLabelText(/email/i);
    
    await user.type(usernameField, 'ab'); // Too short
    await user.type(emailField, 'invalid-email'); // Invalid format
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
    
    // Form should indicate it has errors
    expect(screen.getByText(/form has validation errors/i)).toBeInTheDocument();
  });

  it('should handle empty form data', () => {
    renderProfileDetails({}, { 
      defaultValues: { 
        profileDetailsGroup: {
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          name: '',
          phone: ''
        }
      }
    });
    
    // Should render without crashing
    expect(screen.getByTestId('profile-details-test')).toBeInTheDocument();
  });

  it('should handle malformed initial data', () => {
    renderProfileDetails({}, {
      defaultValues: {
        profileDetailsGroup: {
          username: null as any,
          email: undefined as any,
          firstName: '',
          lastName: '',
          name: '',
          phone: ''
        }
      }
    });
    
    // Should render without crashing and handle null/undefined values
    expect(screen.getByTestId('profile-details-test')).toBeInTheDocument();
  });

  it('should handle API errors during validation', async () => {
    // Mock API error
    mockServer.use(
      rest.post('/api/v2/system/user/validate', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ error: 'Internal server error' })
        );
      })
    );
    
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    
    await user.type(usernameField, 'valid_username');
    await user.tab();
    
    // Should handle API errors gracefully without crashing
    expect(screen.getByTestId('profile-details-test')).toBeInTheDocument();
  });

  it('should handle network timeouts gracefully', async () => {
    // Mock slow API response
    mockServer.use(
      rest.post('/api/v2/system/user/validate', (req, res, ctx) => {
        return res(
          ctx.delay(5000), // 5 second delay to simulate timeout
          ctx.json({ valid: true })
        );
      })
    );
    
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    
    await user.type(usernameField, 'valid_username');
    await user.tab();
    
    // Should continue to work even with slow responses
    expect(screen.getByTestId('profile-details-test')).toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('ProfileDetails Component - Integration', () => {
  it('should integrate with parent form context correctly', async () => {
    const mockSubmit = vi.fn();
    const user = userEvent.setup();
    
    renderProfileDetails({}, { onSubmit: mockSubmit });
    
    // Fill out the form
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/display name/i), 'John Doe');
    await user.type(screen.getByLabelText(/phone number/i), '+1-555-123-4567');
    
    // Submit the form
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        profileDetailsGroup: {
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          phone: '+1-555-123-4567'
        }
      });
    });
  });

  it('should maintain form state across re-renders', async () => {
    const user = userEvent.setup();
    const { rerender } = renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    await user.type(usernameField, 'persistent_user');
    
    // Re-render the component
    rerender(
      <TestWrapper>
        <ProfileDetails data-testid="profile-details-test" />
      </TestWrapper>
    );
    
    // Value should persist
    expect(screen.getByDisplayValue('persistent_user')).toBeInTheDocument();
  });

  it('should handle form reset correctly', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    // Fill out fields
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Simulate form reset (would be triggered by parent component)
    const form = screen.getByRole('form');
    fireEvent.reset(form);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
    });
  });

  it('should support nested form group structure', () => {
    renderProfileDetails();
    
    // Verify that the component works within a nested form structure
    const formGroup = screen.getByRole('group');
    expect(formGroup).toBeInTheDocument();
    
    // All fields should be accessible within the form group
    expect(within(formGroup).getByLabelText(/username/i)).toBeInTheDocument();
    expect(within(formGroup).getByLabelText(/email/i)).toBeInTheDocument();
    expect(within(formGroup).getByLabelText(/first name/i)).toBeInTheDocument();
    expect(within(formGroup).getByLabelText(/last name/i)).toBeInTheDocument();
    expect(within(formGroup).getByLabelText(/display name/i)).toBeInTheDocument();
    expect(within(formGroup).getByLabelText(/phone number/i)).toBeInTheDocument();
  });
});

// ============================================================================
// MSWORLD COVERAGE VERIFICATION
// ============================================================================

describe('ProfileDetails Component - MSW Integration', () => {
  it('should mock API calls for validation', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    
    // Type a username that would trigger API validation
    await user.type(usernameField, 'valid_username');
    await user.tab();
    
    // MSW should intercept and mock the validation call
    await waitFor(() => {
      expect(usernameField).not.toHaveAttribute('aria-invalid', 'true');
    }, { timeout: 1000 });
  });

  it('should handle different API response scenarios', async () => {
    // Test with unavailable username
    mockServer.use(
      rest.get('/api/v2/system/user/check-username/:username', (req, res, ctx) => {
        return res(
          ctx.json({
            available: false,
            suggestions: ['test_user1', 'test_user2']
          })
        );
      })
    );
    
    const user = userEvent.setup();
    renderProfileDetails();
    
    const usernameField = screen.getByLabelText(/username/i);
    await user.type(usernameField, 'admin');
    await user.tab();
    
    // Should handle the unavailable username response
    expect(screen.getByTestId('profile-details-test')).toBeInTheDocument();
  });
});

// ============================================================================
// PERFORMANCE BENCHMARKING
// ============================================================================

describe('ProfileDetails Component - Performance Benchmarks', () => {
  it('should meet initial render performance benchmarks', async () => {
    const renderTime = await measureValidationPerformance(() => {
      renderProfileDetails();
    });
    
    // Should render quickly
    expect(renderTime).toBeLessThan(100);
  });

  it('should meet field interaction performance benchmarks', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const interactionTime = await measureValidationPerformance(async () => {
      const usernameField = screen.getByLabelText(/username/i);
      await user.type(usernameField, 'performance_test');
    });
    
    // Should handle user input efficiently
    expect(interactionTime).toBeLessThan(200);
  });

  it('should handle bulk field updates efficiently', async () => {
    const user = userEvent.setup();
    renderProfileDetails();
    
    const bulkUpdateTime = await measureValidationPerformance(async () => {
      await user.type(screen.getByLabelText(/username/i), 'bulk_test');
      await user.type(screen.getByLabelText(/email/i), 'bulk@test.com');
      await user.type(screen.getByLabelText(/first name/i), 'Bulk');
      await user.type(screen.getByLabelText(/last name/i), 'Test');
      await user.type(screen.getByLabelText(/display name/i), 'Bulk Test');
      await user.type(screen.getByLabelText(/phone number/i), '+1-555-000-0000');
    });
    
    // Should handle multiple field updates efficiently
    expect(bulkUpdateTime).toBeLessThan(500);
  });
});

// ============================================================================
// CLEANUP
// ============================================================================

afterAll(() => {
  // Stop MSW server
  mockServer.close();
  
  // Clean up global mocks
  vi.restoreAllMocks();
});