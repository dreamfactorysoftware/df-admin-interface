/**
 * @fileoverview Comprehensive test suite for ProfileDetails React component
 * Tests form validation, user interactions, accessibility compliance, theme integration,
 * internationalization, and error handling scenarios using Vitest and React Testing Library.
 * Includes MSW integration for API mocking and performance benchmarks.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { ProfileDetails } from './profile-details';
import { ProfileDetailsFormData, ProfileDetailsProps } from './types';
import { renderWithProviders } from '../../../test/utils/render-with-providers';

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock zustand store for theme management
const mockUseAppStore = vi.fn();
vi.mock('../../../stores/app-store', () => ({
  useAppStore: () => mockUseAppStore(),
}));

// Mock internationalization hook
const mockUseTranslations = vi.fn();
vi.mock('../../../hooks/use-translations', () => ({
  useTranslations: () => mockUseTranslations(),
}));

// Profile details validation schema for testing
const profileDetailsSchema = z.object({
  profileDetailsGroup: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    name: z.string().min(1, 'Display name is required'),
    phone: z.string().optional(),
  }),
});

// Test wrapper component with form provider
interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Partial<ProfileDetailsFormData>;
  onSubmit?: (data: ProfileDetailsFormData) => void;
  includePhoneField?: boolean;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
  includePhoneField = false,
}) => {
  const form = useForm<ProfileDetailsFormData>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      profileDetailsGroup: {
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        name: '',
        phone: includePhoneField ? '' : undefined,
        ...defaultValues.profileDetailsGroup,
      },
    },
    mode: 'onChange',
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="profile-form">
        {children}
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

// Mock translations data
const mockTranslations = {
  'userManagement.controls.username.altLabel': 'Username',
  'userManagement.controls.username.optional': '(Optional)',
  'userManagement.controls.username.errors.required': 'Username is required',
  'userManagement.controls.username.errors.minLength': 'Username must be at least 3 characters',
  'userManagement.controls.email.label': 'Email Address',
  'userManagement.controls.email.errors.required': 'Email is required',
  'userManagement.controls.email.errors.invalid': 'Invalid email address',
  'userManagement.controls.firstName.label': 'First Name',
  'userManagement.controls.firstName.errors.required': 'First name is required',
  'userManagement.controls.lastName.label': 'Last Name',
  'userManagement.controls.lastName.errors.required': 'Last name is required',
  'userManagement.controls.displayName.label': 'Display Name',
  'userManagement.controls.displayName.errors.required': 'Display name is required',
  'userManagement.controls.phone.label': 'Phone Number',
};

// Mock store data
const mockStoreData = {
  theme: 'light' as const,
  preferences: {
    defaultDatabaseType: 'mysql' as const,
    tablePageSize: 25,
    autoRefreshSchemas: true,
    showAdvancedOptions: false,
  },
};

describe('ProfileDetails Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Setup user event
    user = userEvent.setup();
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockUseAppStore.mockReturnValue(mockStoreData);
    mockUseTranslations.mockReturnValue({
      t: (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key,
      language: 'en',
      isLoading: false,
    });

    // Setup MSW handlers for profile validation
    server.use(
      http.post('/api/v2/user/profile/validate', () => {
        return HttpResponse.json({ valid: true });
      }),
      http.get('/api/v2/user/profile', () => {
        return HttpResponse.json({
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          phone: '+1234567890',
        });
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Basic Rendering', () => {
    it('renders all required form fields', () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    });

    it('conditionally renders phone field when included in form', () => {
      renderWithProviders(
        <TestWrapper includePhoneField={true}>
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    it('does not render phone field when not included in form', () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
    });

    it('applies correct field types and attributes', () => {
      renderWithProviders(
        <TestWrapper includePhoneField={true}>
          <ProfileDetails />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      const emailField = screen.getByLabelText(/email address/i);
      const firstNameField = screen.getByLabelText(/first name/i);
      const lastNameField = screen.getByLabelText(/last name/i);
      const displayNameField = screen.getByLabelText(/display name/i);
      const phoneField = screen.getByLabelText(/phone number/i);

      expect(usernameField).toHaveAttribute('type', 'text');
      expect(emailField).toHaveAttribute('type', 'email');
      expect(firstNameField).toHaveAttribute('type', 'text');
      expect(lastNameField).toHaveAttribute('type', 'text');
      expect(displayNameField).toHaveAttribute('type', 'text');
      expect(phoneField).toHaveAttribute('type', 'tel');
    });
  });

  describe('Form Validation', () => {
    it('validates required fields on blur', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      
      await user.click(emailField);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format in real-time', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);

      await user.type(emailField, 'invalid-email');
      
      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      await user.clear(emailField);
      await user.type(emailField, 'valid@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      });
    });

    it('validates username minimum length', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);

      await user.type(usernameField, 'ab');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });

      await user.type(usernameField, 'c');

      await waitFor(() => {
        expect(screen.queryByText(/username must be at least 3 characters/i)).not.toBeInTheDocument();
      });
    });

    it('validates all required fields on form submission', async () => {
      const mockSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper onSubmit={mockSubmit}>
          <ProfileDetails />
        </TestWrapper>
      );

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      const mockSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper onSubmit={mockSubmit}>
          <ProfileDetails />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/display name/i), 'John Doe');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          profileDetailsGroup: {
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            name: 'John Doe',
            phone: undefined,
          },
        });
      });
    });
  });

  describe('Performance Testing', () => {
    it('validates form fields under 100ms', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      
      const startTime = performance.now();
      await user.type(emailField, 'test@example.com');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('handles rapid input changes efficiently', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        await user.type(usernameField, `user${i}`);
        await user.clear(usernameField);
      }
      
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Accessibility Compliance', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <TestWrapper includePhoneField={true}>
          <ProfileDetails />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and descriptions', () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      expect(emailField).toHaveAttribute('aria-invalid', 'false');
      expect(emailField).toHaveAttribute('aria-describedby');
    });

    it('announces validation errors to screen readers', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      
      await user.type(emailField, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid email address/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(
        <TestWrapper includePhoneField={true}>
          <ProfileDetails />
        </TestWrapper>
      );

      const usernameField = screen.getByLabelText(/username/i);
      usernameField.focus();

      expect(document.activeElement).toBe(usernameField);

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/email address/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/first name/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/last name/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/display name/i));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByLabelText(/phone number/i));
    });

    it('provides proper field labeling for required fields', () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const requiredFields = [
        screen.getByLabelText(/email address/i),
        screen.getByLabelText(/first name/i),
        screen.getByLabelText(/last name/i),
        screen.getByLabelText(/display name/i),
      ];

      requiredFields.forEach(field => {
        expect(field).toHaveAttribute('aria-required', 'true');
      });
    });
  });

  describe('Theme Integration', () => {
    it('applies light theme styles correctly', () => {
      mockUseAppStore.mockReturnValue({
        ...mockStoreData,
        theme: 'light',
      });

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const formContainer = screen.getByTestId('profile-form');
      expect(formContainer).not.toHaveClass('dark');
    });

    it('applies dark theme styles correctly', () => {
      mockUseAppStore.mockReturnValue({
        ...mockStoreData,
        theme: 'dark',
      });

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const formContainer = screen.getByTestId('profile-form');
      expect(formContainer).toHaveClass('dark');
    });

    it('responds to theme changes dynamically', () => {
      const { rerender } = renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      // Start with light theme
      let formContainer = screen.getByTestId('profile-form');
      expect(formContainer).not.toHaveClass('dark');

      // Switch to dark theme
      mockUseAppStore.mockReturnValue({
        ...mockStoreData,
        theme: 'dark',
      });

      rerender(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      formContainer = screen.getByTestId('profile-form');
      expect(formContainer).toHaveClass('dark');
    });
  });

  describe('Internationalization', () => {
    it('displays field labels in English', () => {
      renderWithProviders(
        <TestWrapper includePhoneField={true}>
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    });

    it('displays validation errors in current language', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      
      await user.type(emailField, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('handles language switching', () => {
      const spanishTranslations = {
        ...mockTranslations,
        'userManagement.controls.email.label': 'Dirección de Email',
        'userManagement.controls.firstName.label': 'Nombre',
        'userManagement.controls.lastName.label': 'Apellido',
      };

      mockUseTranslations.mockReturnValue({
        t: (key: string) => spanishTranslations[key as keyof typeof spanishTranslations] || key,
        language: 'es',
        isLoading: false,
      });

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Dirección de Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
      expect(screen.getByLabelText('Apellido')).toBeInTheDocument();
    });

    it('shows optional field indicators correctly', () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const usernameLabel = screen.getByText(/username.*optional/i);
      expect(usernameLabel).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles API validation errors gracefully', async () => {
      // Mock API error response
      server.use(
        http.post('/api/v2/user/profile/validate', () => {
          return HttpResponse.json(
            {
              error: {
                code: 400,
                message: 'Validation failed',
                details: [
                  {
                    field: 'email',
                    message: 'Email already exists',
                  },
                ],
              },
            },
            { status: 400 }
          );
        })
      );

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      await user.type(emailField, 'existing@example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.post('/api/v2/user/profile/validate', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      await user.type(emailField, 'test@example.com');
      await user.tab();

      // Component should handle the error gracefully without crashing
      expect(emailField).toBeInTheDocument();
    });

    it('recovers from error states', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      
      // Create an error state
      await user.type(emailField, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });

      // Fix the error
      await user.clear(emailField);
      await user.type(emailField, 'valid@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form State Management', () => {
    it('preserves form data during re-renders', () => {
      const { rerender } = renderWithProviders(
        <TestWrapper
          defaultValues={{
            profileDetailsGroup: {
              username: 'testuser',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              name: 'John Doe',
            },
          }}
        >
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();

      rerender(
        <TestWrapper
          defaultValues={{
            profileDetailsGroup: {
              username: 'testuser',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              name: 'John Doe',
            },
          }}
        >
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('handles form reset correctly', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      const firstNameField = screen.getByLabelText(/first name/i);

      await user.type(emailField, 'test@example.com');
      await user.type(firstNameField, 'John');

      expect(emailField).toHaveValue('test@example.com');
      expect(firstNameField).toHaveValue('John');

      // Reset form (simulated by parent component)
      const { rerender } = renderWithProviders(
        <TestWrapper
          defaultValues={{
            profileDetailsGroup: {
              username: '',
              email: '',
              firstName: '',
              lastName: '',
              name: '',
            },
          }}
        >
          <ProfileDetails />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email address/i)).toHaveValue('');
      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long input values', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const longValue = 'a'.repeat(1000);
      const firstNameField = screen.getByLabelText(/first name/i);

      await user.type(firstNameField, longValue);

      expect(firstNameField).toHaveValue(longValue);
    });

    it('handles special characters in input values', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
      const firstNameField = screen.getByLabelText(/first name/i);

      await user.type(firstNameField, specialChars);

      expect(firstNameField).toHaveValue(specialChars);
    });

    it('handles unicode characters correctly', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const unicodeValue = '测试用户名 🎉 José María';
      const firstNameField = screen.getByLabelText(/first name/i);

      await user.type(firstNameField, unicodeValue);

      expect(firstNameField).toHaveValue(unicodeValue);
    });

    it('handles empty and whitespace-only values', async () => {
      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const firstNameField = screen.getByLabelText(/first name/i);

      await user.type(firstNameField, '   ');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Parent Form Context', () => {
    it('integrates properly with parent form provider', () => {
      const mockSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper onSubmit={mockSubmit}>
          <ProfileDetails />
        </TestWrapper>
      );

      // Component should render without errors when nested in FormProvider
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    it('validates nested form group structure correctly', async () => {
      const mockSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper onSubmit={mockSubmit}>
          <ProfileDetails />
        </TestWrapper>
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/display name/i), 'John Doe');

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          profileDetailsGroup: {
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            name: 'John Doe',
            phone: undefined,
          },
        });
      });
    });

    it('participates in parent form validation correctly', async () => {
      const mockSubmit = vi.fn();
      
      renderWithProviders(
        <TestWrapper onSubmit={mockSubmit}>
          <ProfileDetails />
        </TestWrapper>
      );

      // Submit form without filling required fields
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
      });

      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('MSW API Integration', () => {
    it('makes API calls for profile validation', async () => {
      const apiCallSpy = vi.fn();
      
      server.use(
        http.post('/api/v2/user/profile/validate', async ({ request }) => {
          const body = await request.json();
          apiCallSpy(body);
          return HttpResponse.json({ valid: true });
        })
      );

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      await user.type(emailField, 'test@example.com');
      await user.tab();

      await waitFor(() => {
        expect(apiCallSpy).toHaveBeenCalledWith({
          profileDetailsGroup: {
            email: 'test@example.com',
          },
        });
      });
    });

    it('handles successful API responses', async () => {
      server.use(
        http.post('/api/v2/user/profile/validate', () => {
          return HttpResponse.json({
            valid: true,
            suggestions: {
              displayName: 'Test User',
            },
          });
        })
      );

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      await user.type(emailField, 'test@example.com');
      await user.tab();

      // Should not show any error messages
      await waitFor(() => {
        expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      });
    });

    it('handles API rate limiting gracefully', async () => {
      server.use(
        http.post('/api/v2/user/profile/validate', () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          );
        })
      );

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails />
        </TestWrapper>
      );

      const emailField = screen.getByLabelText(/email address/i);
      await user.type(emailField, 'test@example.com');
      await user.tab();

      // Component should handle rate limiting gracefully
      expect(emailField).toBeInTheDocument();
    });
  });

  describe('Component Props Configuration', () => {
    it('accepts custom validation configuration', () => {
      const customProps: ProfileDetailsProps = {
        enableRealTimeValidation: false,
        showOptionalLabels: false,
        customFieldOrder: ['email', 'username', 'firstName', 'lastName', 'name'],
      };

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails {...customProps} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('handles disabled state correctly', () => {
      const customProps: ProfileDetailsProps = {
        disabled: true,
      };

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails {...customProps} />
        </TestWrapper>
      );

      const allInputs = screen.getAllByRole('textbox');
      allInputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('applies custom CSS classes', () => {
      const customProps: ProfileDetailsProps = {
        className: 'custom-profile-details',
      };

      renderWithProviders(
        <TestWrapper>
          <ProfileDetails {...customProps} />
        </TestWrapper>
      );

      // Should apply custom className to the component container
      const container = document.querySelector('.custom-profile-details');
      expect(container).toBeInTheDocument();
    });
  });
});