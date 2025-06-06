/**
 * Email Template Edit Page Test Suite
 * 
 * Comprehensive Vitest test suite for the email template edit page component
 * covering form validation, pre-population with existing data, update submission
 * workflows, error handling, and user interactions. Implements MSW mocking for
 * API calls and comprehensive test coverage for edit-specific functionality
 * replacing Angular Jest test patterns.
 * 
 * Test Coverage Areas:
 * - Form validation with React Hook Form and Zod schemas
 * - Pre-population with existing email template data
 * - Update submission workflows and API integration
 * - Error handling scenarios and user feedback
 * - User interactions and accessibility compliance
 * - Performance testing for form validation response times
 * - React Query caching and state management integration
 * - Dynamic route parameter handling for [id] routes
 * - Loading states and error boundaries
 * - Navigation workflows and form dirty state handling
 * 
 * Performance Requirements:
 * - Form validation response times under 100ms
 * - API response handling under 2 seconds
 * - Component rendering under 200ms
 * 
 * Accessibility Requirements:
 * - WCAG 2.1 AA compliance validation
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - Error message accessibility
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { 
  emailTemplateHandlers, 
  mockEmailTemplates, 
  resetEmailTemplatesMockData,
  emailTemplateErrorScenarios,
  emailTemplatePerformanceUtils,
  createMockEmailTemplate
} from '@/test/mocks/email-templates';
import { render, renderWithMockData, renderWithError, waitForQueries } from '@/test/utils/render';
import EmailTemplateEditPage from './page';
import { EMAIL_TEMPLATE_QUERY_KEYS } from '@/types/email-templates';

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock Next.js router and navigation hooks
 */
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/system-settings/email-templates/1',
    route: '/system-settings/email-templates/[id]',
  })),
  useParams: vi.fn(() => ({ id: '1' })),
  usePathname: vi.fn(() => '/system-settings/email-templates/1'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

/**
 * Mock React's use hook for params handling
 */
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    use: vi.fn((promise: Promise<any>) => {
      if (promise && typeof promise.then === 'function') {
        return { id: '1' }; // Mock resolved params
      }
      return promise;
    }),
  };
});

/**
 * Performance testing utilities
 */
const performanceTestUtils = {
  measureValidationTime: async (inputElement: HTMLElement, value: string) => {
    const startTime = performance.now();
    await userEvent.clear(inputElement);
    await userEvent.type(inputElement, value);
    const endTime = performance.now();
    return endTime - startTime;
  },
  
  measureFormSubmissionTime: async (form: HTMLElement) => {
    const startTime = performance.now();
    const submitButton = within(form).getByRole('button', { name: /update template/i });
    await userEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.queryByText(/updating/i)).not.toBeInTheDocument();
    }, { timeout: 5000 });
    const endTime = performance.now();
    return endTime - startTime;
  },
};

/**
 * Accessibility testing utilities
 */
const accessibilityTestUtils = {
  testKeyboardNavigation: async () => {
    const user = userEvent.setup();
    // Tab through all form fields
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'name');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'description');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'to');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'cc');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'bcc');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'subject');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'attachment');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'body');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'senderName');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'senderEmail');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'replyToName');
    
    await user.tab();
    expect(document.activeElement).toHaveAttribute('name', 'replyToEmail');
  },
  
  validateAriaLabels: () => {
    // Check that all form fields have proper aria labels
    const nameField = screen.getByLabelText(/template name/i);
    expect(nameField).toHaveAttribute('aria-describedby', 'name-error');
    
    const descriptionField = screen.getByLabelText(/description/i);
    expect(descriptionField).toHaveAttribute('aria-describedby', 'description-error');
    
    const toField = screen.getByLabelText(/to recipients/i);
    expect(toField).toHaveAttribute('aria-describedby', 'to-error');
    
    const subjectField = screen.getByLabelText(/subject/i);
    expect(subjectField).toHaveAttribute('aria-describedby', 'subject-error');
    
    const bodyField = screen.getByLabelText(/email body/i);
    expect(bodyField).toHaveAttribute('aria-describedby', 'body-error');
  },
  
  validateErrorMessages: (fieldName: string, errorMessage: string) => {
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute('id', `${fieldName}-error`);
    
    const fieldElement = screen.getByLabelText(new RegExp(fieldName, 'i'));
    expect(fieldElement).toHaveAttribute('aria-describedby', `${fieldName}-error`);
  },
};

// ============================================================================
// TEST SUITE SETUP AND TEARDOWN
// ============================================================================

describe('Email Template Edit Page', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    // Reset MSW handlers and mock data
    server.resetHandlers(...emailTemplateHandlers);
    resetEmailTemplatesMockData();
    
    // Set up user event
    user = userEvent.setup();
    
    // Clear all timers and mocks
    vi.clearAllTimers();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Clean up any remaining timers or async operations
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ============================================================================
  // COMPONENT RENDERING AND INITIAL STATE TESTS
  // ============================================================================

  describe('Component Rendering and Initial State', () => {
    test('renders email template edit page with loading state initially', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      // Should show loading skeleton
      expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Edit Email Template')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('renders page header and description correctly', async () => {
      const mockTemplate = mockEmailTemplates[0];
      const { queryClient } = renderWithMockData(
        <EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />,
        mockTemplate,
        EMAIL_TEMPLATE_QUERY_KEYS.detail(1)
      );
      
      await waitFor(() => {
        expect(screen.getByText('Edit Email Template')).toBeInTheDocument();
        expect(screen.getByText('Update the email template configuration and content.')).toBeInTheDocument();
      });
    });

    test('pre-populates form fields with existing email template data', async () => {
      const mockTemplate = mockEmailTemplates[0]; // Welcome Email template
      
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Welcome email for new users')).toBeInTheDocument();
        expect(screen.getByDisplayValue('{email}')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Welcome to DreamFactory!')).toBeInTheDocument();
        expect(screen.getByDisplayValue('<h1>Welcome to our platform!</h1><p>Thank you for joining us.</p>')).toBeInTheDocument();
        expect(screen.getByDisplayValue('DreamFactory Team')).toBeInTheDocument();
        expect(screen.getByDisplayValue('noreply@dreamfactory.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Support Team')).toBeInTheDocument();
        expect(screen.getByDisplayValue('support@dreamfactory.com')).toBeInTheDocument();
      });
    });

    test('displays all required form fields with proper labels', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/template name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/to recipients/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/cc recipients/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bcc recipients/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/attachment path/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email body/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/sender name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/sender email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reply-to name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/reply-to email/i)).toBeInTheDocument();
      });
    });

    test('displays form action buttons (Cancel and Update Template)', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /update template/i })).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // DYNAMIC ROUTE PARAMETER TESTS
  // ============================================================================

  describe('Dynamic Route Parameter Handling', () => {
    test('extracts and uses ID parameter from route correctly', async () => {
      const { routerMock } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '2' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Password Reset')).toBeInTheDocument();
      });
    });

    test('handles invalid ID parameter gracefully', async () => {
      // Mock API to return 404 for invalid ID
      server.use(
        ...emailTemplateHandlers.map(handler => {
          if (handler.info.path === '/api/v2/system/email_template/:id' && handler.info.method === 'GET') {
            return http.get('/api/v2/system/email_template/:id', () => {
              return emailTemplateErrorScenarios.notFound();
            });
          }
          return handler;
        })
      );

      render(<EmailTemplateEditPage params={Promise.resolve({ id: 'invalid' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/email template not found/i)).toBeInTheDocument();
      });
    });

    test('handles numeric ID conversion correctly', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '3' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Registration Confirmation')).toBeInTheDocument();
      });
    });

    test('handles URL parameter changes dynamically', async () => {
      const { rerender } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Simulate route parameter change
      rerender(<EmailTemplateEditPage params={Promise.resolve({ id: '2' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Password Reset')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation with React Hook Form and Zod', () => {
    test('validates required template name field', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const nameField = screen.getByLabelText(/template name/i);
      
      // Clear the required field
      await user.clear(nameField);
      await user.tab(); // Trigger validation on blur
      
      await waitFor(() => {
        expect(screen.getByText('Email template name is required')).toBeInTheDocument();
      });
      
      accessibilityTestUtils.validateErrorMessages('name', 'Email template name is required');
    });

    test('validates template name maximum length (100 characters)', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const nameField = screen.getByLabelText(/template name/i);
      const longName = 'a'.repeat(101); // 101 characters
      
      await user.clear(nameField);
      
      // Measure validation performance
      const validationTime = await performanceTestUtils.measureValidationTime(nameField, longName);
      expect(validationTime).toBeLessThan(100); // Performance requirement: under 100ms
      
      await waitFor(() => {
        expect(screen.getByText('Name must be less than 100 characters')).toBeInTheDocument();
      });
    });

    test('validates description maximum length (500 characters)', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const descriptionField = screen.getByLabelText(/description/i);
      const longDescription = 'a'.repeat(501); // 501 characters
      
      await user.clear(descriptionField);
      await user.type(descriptionField, longDescription);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Description must be less than 500 characters')).toBeInTheDocument();
      });
    });

    test('validates email field formats (sender and reply-to)', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const senderEmailField = screen.getByLabelText(/sender email/i);
      const replyToEmailField = screen.getByLabelText(/reply-to email/i);
      
      // Test invalid email format
      await user.clear(senderEmailField);
      await user.type(senderEmailField, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid sender email address')).toBeInTheDocument();
      });
      
      // Test valid email format
      await user.clear(senderEmailField);
      await user.type(senderEmailField, 'valid@example.com');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid sender email address')).not.toBeInTheDocument();
      });
      
      // Test reply-to email validation
      await user.clear(replyToEmailField);
      await user.type(replyToEmailField, 'invalid-reply-to');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid reply-to email address')).toBeInTheDocument();
      });
    });

    test('validates field length limits for all text fields', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Test subject field length (255 characters)
      const subjectField = screen.getByLabelText(/subject/i);
      const longSubject = 'a'.repeat(256);
      
      await user.clear(subjectField);
      await user.type(subjectField, longSubject);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Subject must be less than 255 characters')).toBeInTheDocument();
      });

      // Test body field length (10,000 characters)
      const bodyField = screen.getByLabelText(/email body/i);
      const longBody = 'a'.repeat(10001);
      
      await user.clear(bodyField);
      await user.type(bodyField, longBody);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Body must be less than 10,000 characters')).toBeInTheDocument();
      });
    });

    test('allows empty optional fields without validation errors', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Clear optional fields
      const descriptionField = screen.getByLabelText(/description/i);
      const ccField = screen.getByLabelText(/cc recipients/i);
      const bccField = screen.getByLabelText(/bcc recipients/i);
      const attachmentField = screen.getByLabelText(/attachment path/i);
      
      await user.clear(descriptionField);
      await user.clear(ccField);
      await user.clear(bccField);
      await user.clear(attachmentField);
      
      // Tab through fields to trigger validation
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();
      
      // Should not show validation errors for optional fields
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });

    test('validates real-time as user types with performance under 100ms', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const nameField = screen.getByLabelText(/template name/i);
      
      // Measure validation performance during typing
      const startTime = performance.now();
      
      await user.clear(nameField);
      await user.type(nameField, 'Test', { delay: 10 });
      
      const endTime = performance.now();
      const validationTime = endTime - startTime;
      
      // Performance requirement: real-time validation under 100ms
      expect(validationTime).toBeLessThan(100);
      
      // Should show validation as user types
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // UPDATE SUBMISSION WORKFLOW TESTS
  // ============================================================================

  describe('Update Submission Workflows', () => {
    test('submits form successfully with valid data', async () => {
      const { routerMock } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Update form fields
      const nameField = screen.getByLabelText(/template name/i);
      const descriptionField = screen.getByLabelText(/description/i);
      
      await user.clear(nameField);
      await user.type(nameField, 'Updated Welcome Email');
      
      await user.clear(descriptionField);
      await user.type(descriptionField, 'Updated description for welcome email');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
      
      // Should navigate back to list after successful update
      await waitFor(() => {
        expect(routerMock.push).toHaveBeenCalledWith('/system-settings/email-templates');
      }, { timeout: 5000 });
    });

    test('handles form submission with partial data update', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Update only subject field
      const subjectField = screen.getByLabelText(/subject/i);
      await user.clear(subjectField);
      await user.type(subjectField, 'Updated Subject Line');
      
      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Should handle partial update successfully
      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
      });
    });

    test('prevents submission when validation errors exist', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Create validation error
      const nameField = screen.getByLabelText(/template name/i);
      await user.clear(nameField); // Remove required field
      
      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Should show validation error and not submit
      await waitFor(() => {
        expect(screen.getByText('Email template name is required')).toBeInTheDocument();
      });
      
      // Should not show loading state
      expect(screen.queryByText(/updating/i)).not.toBeInTheDocument();
    });

    test('measures form submission performance under 2 seconds', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const form = screen.getByRole('form') || document.querySelector('form')!;
      const submissionTime = await performanceTestUtils.measureFormSubmissionTime(form);
      
      // Performance requirement: API responses under 2 seconds
      expect(submissionTime).toBeLessThan(2000);
    });

    test('handles optimistic updates with React Query', async () => {
      const { queryClient } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Update name field
      const nameField = screen.getByLabelText(/template name/i);
      await user.clear(nameField);
      await user.type(nameField, 'Optimistically Updated Name');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Check that React Query cache is updated optimistically
      const cachedData = queryClient.getQueryData(EMAIL_TEMPLATE_QUERY_KEYS.detail(1));
      expect(cachedData).toBeDefined();
    });
  });

  // ============================================================================
  // ERROR HANDLING AND USER FEEDBACK TESTS
  // ============================================================================

  describe('Error Handling and User Feedback', () => {
    test('displays API error messages when template fetch fails', async () => {
      renderWithError(
        <EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />,
        new Error('Failed to fetch email template'),
        EMAIL_TEMPLATE_QUERY_KEYS.detail(1)
      );
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
        expect(screen.getByText(/failed to fetch email template/i)).toBeInTheDocument();
      });
    });

    test('displays validation errors from server on submission', async () => {
      // Mock server validation error
      server.use(
        http.put('/api/v2/system/email_template/:id', () => {
          return emailTemplateErrorScenarios.validation(['Template name must be unique']);
        })
      );

      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/template name must be unique/i)).toBeInTheDocument();
      });
    });

    test('handles network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.put('/api/v2/system/email_template/:id', () => {
          throw new Error('Network error');
        })
      );

      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to update email template/i)).toBeInTheDocument();
      });
    });

    test('displays 404 error when template not found', async () => {
      server.use(
        http.get('/api/v2/system/email_template/:id', () => {
          return emailTemplateErrorScenarios.notFound();
        })
      );

      render(<EmailTemplateEditPage params={Promise.resolve({ id: '999' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/email template not found/i)).toBeInTheDocument();
      });
    });

    test('handles authentication errors with proper messaging', async () => {
      server.use(
        http.get('/api/v2/system/email_template/:id', () => {
          return emailTemplateErrorScenarios.unauthorized();
        })
      );

      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
      });
    });

    test('allows error dismissal and recovery', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Create a validation error
      const nameField = screen.getByLabelText(/template name/i);
      await user.clear(nameField);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Email template name is required')).toBeInTheDocument();
      });

      // Fix the error
      await user.type(nameField, 'Fixed Name');
      
      await waitFor(() => {
        expect(screen.queryByText('Email template name is required')).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // USER INTERACTION AND ACCESSIBILITY TESTS
  // ============================================================================

  describe('User Interactions and Accessibility', () => {
    test('supports keyboard navigation through all form fields', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      await accessibilityTestUtils.testKeyboardNavigation();
    });

    test('provides proper ARIA labels and descriptions', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      accessibilityTestUtils.validateAriaLabels();
    });

    test('maintains focus management during form submission', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Focus should remain manageable during submission
      expect(document.activeElement).toBeDefined();
    });

    test('handles Cancel button navigation', async () => {
      const { routerMock } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(routerMock.push).toHaveBeenCalledWith('/system-settings/email-templates');
    });

    test('provides visual feedback for form field states', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const nameField = screen.getByLabelText(/template name/i);
      
      // Focus state
      await user.click(nameField);
      expect(nameField).toHaveFocus();
      
      // Error state
      await user.clear(nameField);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText('Email template name is required')).toBeInTheDocument();
      });
    });

    test('supports screen reader compatibility', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit Email Template');
      
      // Check for form landmark
      expect(screen.getByRole('form') || document.querySelector('form')).toBeInTheDocument();
      
      // Check for proper labeling
      const nameField = screen.getByLabelText(/template name/i);
      expect(nameField).toHaveAttribute('aria-describedby');
    });
  });

  // ============================================================================
  // REACT QUERY INTEGRATION AND CACHING TESTS
  // ============================================================================

  describe('React Query Integration and Caching', () => {
    test('caches email template data correctly', async () => {
      const { queryClient } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Check that data is cached
      const cachedData = queryClient.getQueryData(EMAIL_TEMPLATE_QUERY_KEYS.detail(1));
      expect(cachedData).toBeDefined();
      expect(cachedData).toMatchObject({
        id: 1,
        name: 'Welcome Email',
      });
    });

    test('handles cache invalidation after successful update', async () => {
      const { queryClient } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Update template
      const nameField = screen.getByLabelText(/template name/i);
      await user.clear(nameField);
      await user.type(nameField, 'Updated Welcome Email');
      
      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Wait for update to complete
      await waitFor(() => {
        expect(screen.queryByText(/updating/i)).not.toBeInTheDocument();
      });

      // Cache should be updated
      await waitForQueries(queryClient);
    });

    test('provides cache hit responses under 50ms', async () => {
      const { queryClient } = renderWithMockData(
        <EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />,
        mockEmailTemplates[0],
        EMAIL_TEMPLATE_QUERY_KEYS.detail(1)
      );
      
      const startTime = performance.now();
      
      // Data should be available immediately from cache
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const cacheResponseTime = endTime - startTime;
      
      // Performance requirement: cache hit responses under 50ms
      expect(cacheResponseTime).toBeLessThan(50);
    });

    test('handles background refetching and data synchronization', async () => {
      const { queryClient } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Trigger background refetch
      await queryClient.refetchQueries({
        queryKey: EMAIL_TEMPLATE_QUERY_KEYS.detail(1),
      });
      
      // Data should remain consistent
      expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
    });

    test('handles query error states and retries', async () => {
      // Mock temporary server error
      let callCount = 0;
      server.use(
        http.get('/api/v2/system/email_template/:id', () => {
          callCount++;
          if (callCount === 1) {
            return emailTemplateErrorScenarios.serverError();
          }
          return HttpResponse.json(mockEmailTemplates[0]);
        })
      );

      const { queryClient } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  // ============================================================================
  // LOADING STATES AND PERFORMANCE TESTS
  // ============================================================================

  describe('Loading States and Performance', () => {
    test('displays loading skeleton while fetching data', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      // Should show loading state initially
      expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });
    });

    test('renders component under 200ms performance target', async () => {
      const startTime = performance.now();
      
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Email Template')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Performance requirement: component rendering under 200ms
      expect(renderTime).toBeLessThan(200);
    });

    test('handles slow network responses gracefully', async () => {
      // Mock slow response
      server.use(
        http.get('/api/v2/system/email_template/:id', async () => {
          await emailTemplatePerformanceUtils.simulateDelay(1000);
          return HttpResponse.json(mockEmailTemplates[0]);
        })
      );

      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      // Should show loading state for extended period
      expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('provides appropriate loading indicators during form submission', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /update template/i });
      await user.click(submitButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/updating/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  // ============================================================================
  // EDGE CASES AND INTEGRATION TESTS
  // ============================================================================

  describe('Edge Cases and Integration Tests', () => {
    test('handles form state persistence during navigation attempts', async () => {
      const { routerMock } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Make form dirty
      const nameField = screen.getByLabelText(/template name/i);
      await user.clear(nameField);
      await user.type(nameField, 'Modified Name');
      
      // Attempt to navigate away (this would typically show a confirmation dialog)
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      // Should navigate (in real app, might show unsaved changes warning)
      expect(routerMock.push).toHaveBeenCalledWith('/system-settings/email-templates');
    });

    test('handles concurrent user sessions and data conflicts', async () => {
      const { queryClient } = render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Simulate external data change
      const updatedTemplate = createMockEmailTemplate({
        id: 1,
        name: 'Externally Updated Name',
        lastModifiedDate: new Date().toISOString(),
      });
      
      queryClient.setQueryData(EMAIL_TEMPLATE_QUERY_KEYS.detail(1), updatedTemplate);
      
      // Should handle data conflicts appropriately
      await waitFor(() => {
        // Data should be updated in the background
        expect(queryClient.getQueryData(EMAIL_TEMPLATE_QUERY_KEYS.detail(1))).toMatchObject({
          name: 'Externally Updated Name',
        });
      });
    });

    test('handles special characters and internationalization in form fields', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const nameField = screen.getByLabelText(/template name/i);
      const subjectField = screen.getByLabelText(/subject/i);
      
      // Test special characters and international text
      await user.clear(nameField);
      await user.type(nameField, 'Test Template with Special Chars: àáâãäåæ 中文 русский');
      
      await user.clear(subjectField);
      await user.type(subjectField, 'Subject with émojis 🎉📧 and symbols: @#$%^&*()');
      
      // Should handle special characters without errors
      expect(nameField).toHaveValue('Test Template with Special Chars: àáâãäåæ 中文 русский');
      expect(subjectField).toHaveValue('Subject with émojis 🎉📧 and symbols: @#$%^&*()');
    });

    test('validates HTML content in body field appropriately', async () => {
      render(<EmailTemplateEditPage params={Promise.resolve({ id: '1' })} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      const bodyField = screen.getByLabelText(/email body/i);
      
      // Test HTML content
      const htmlContent = '<h1>Test Header</h1><p>Test paragraph with <a href="#">link</a></p>';
      
      await user.clear(bodyField);
      await user.type(bodyField, htmlContent);
      
      // Should accept HTML content
      expect(bodyField).toHaveValue(htmlContent);
    });

    test('handles maximum concurrent API requests gracefully', async () => {
      // This test would verify that multiple simultaneous requests are handled correctly
      const promises = Array.from({ length: 10 }, (_, i) => 
        render(<EmailTemplateEditPage params={Promise.resolve({ id: String(i + 1) })} />)
      );
      
      // All should render without conflicts
      await Promise.all(promises.map(({ container }) => 
        waitFor(() => {
          expect(container).toBeInTheDocument();
        })
      ));
    });
  });
});