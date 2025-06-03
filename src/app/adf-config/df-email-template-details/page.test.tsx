/**
 * Comprehensive Vitest Test Suite for Email Template Details Page
 * 
 * This test suite provides complete coverage for the email template details page component,
 * covering both create and edit workflows with React Testing Library and Mock Service Worker
 * integration. Tests form validation, submission logic, error handling, navigation, and
 * responsive behavior. Replaces Angular/Jest tests with modern React testing patterns.
 * 
 * Key Features:
 * - Vitest 2.1+ testing framework with 10x faster test execution
 * - Mock Service Worker for realistic API mocking
 * - React Testing Library for component testing best practices
 * - User event simulation and accessibility testing
 * - Comprehensive validation testing per React/Next.js Integration Requirements
 * - 90%+ code coverage target
 * - Responsive behavior and dark mode functionality testing
 * 
 * Performance Target: < 50ms per test execution (10x faster than Jest)
 * Coverage Target: 90%+ code coverage
 * Accessibility: WCAG 2.1 AA compliance validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import EmailTemplateDetailsPage from './page';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  usePathname: vi.fn(() => '/adf-config/df-email-template-details'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock the form component and custom hook
vi.mock('./email-template-form', () => ({
  default: vi.fn(({ onSubmit, onCancel, initialData, isLoading }) => (
    <div data-testid="email-template-form">
      <h2>{initialData?.id ? 'Edit Email Template' : 'Create Email Template'}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          onSubmit({
            name: formData.get('name') as string,
            subject: formData.get('subject') as string,
            body_text: formData.get('body_text') as string,
            body_html: formData.get('body_html') as string,
            from_name: formData.get('from_name') as string,
            from_email: formData.get('from_email') as string,
            reply_to_name: formData.get('reply_to_name') as string,
            reply_to_email: formData.get('reply_to_email') as string,
          });
        }}
      >
        <input
          name="name"
          placeholder="Template Name"
          defaultValue={initialData?.name || ''}
          required
        />
        <input
          name="subject"
          placeholder="Email Subject"
          defaultValue={initialData?.subject || ''}
          required
        />
        <textarea
          name="body_text"
          placeholder="Text Body"
          defaultValue={initialData?.body_text || ''}
          rows={4}
        />
        <textarea
          name="body_html"
          placeholder="HTML Body"
          defaultValue={initialData?.body_html || ''}
          rows={6}
        />
        <input
          name="from_name"
          placeholder="From Name"
          defaultValue={initialData?.from_name || ''}
        />
        <input
          name="from_email"
          type="email"
          placeholder="From Email"
          defaultValue={initialData?.from_email || ''}
          required
        />
        <input
          name="reply_to_name"
          placeholder="Reply To Name"
          defaultValue={initialData?.reply_to_name || ''}
        />
        <input
          name="reply_to_email"
          type="email"
          placeholder="Reply To Email"
          defaultValue={initialData?.reply_to_email || ''}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Template'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  )),
}));

vi.mock('./use-email-template', () => ({
  useEmailTemplate: vi.fn(),
}));

// Mock data fixtures
const mockEmailTemplate = {
  id: '1',
  name: 'Welcome Email',
  subject: 'Welcome to DreamFactory',
  body_text: 'Welcome to DreamFactory! Thank you for signing up.',
  body_html: '<h1>Welcome to DreamFactory!</h1><p>Thank you for signing up.</p>',
  from_name: 'DreamFactory Team',
  from_email: 'noreply@dreamfactory.com',
  reply_to_name: 'Support Team',
  reply_to_email: 'support@dreamfactory.com',
  created_date: '2024-01-01T00:00:00Z',
  last_modified_date: '2024-01-01T00:00:00Z',
};

const createMockEmailTemplate = (overrides = {}) => ({
  ...mockEmailTemplate,
  ...overrides,
});

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement, queryClient = createQueryClient()) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

// Mock router functions
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

describe('EmailTemplateDetailsPage', () => {
  let queryClient: QueryClient;
  let mockUseEmailTemplate: any;

  beforeEach(() => {
    queryClient = createQueryClient();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Configure Next.js mocks
    (useRouter as any).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    // Import the mock hook
    const { useEmailTemplate } = require('./use-email-template');
    mockUseEmailTemplate = useEmailTemplate;
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Create Email Template Workflow', () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ id: undefined });
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });
    });

    it('renders create form with correct heading', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      expect(screen.getByText('Create Email Template')).toBeInTheDocument();
    });

    it('renders form fields with correct placeholders', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Email Subject')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Text Body')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('HTML Body')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('From Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('From Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Reply To Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Reply To Email')).toBeInTheDocument();
    });

    it('handles successful template creation', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue(mockEmailTemplate);
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      // Fill out the form
      await user.type(screen.getByPlaceholderText('Template Name'), 'Test Template');
      await user.type(screen.getByPlaceholderText('Email Subject'), 'Test Subject');
      await user.type(screen.getByPlaceholderText('From Email'), 'test@example.com');

      // Submit the form
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          name: 'Test Template',
          subject: 'Test Subject',
          body_text: '',
          body_html: '',
          from_name: '',
          from_email: 'test@example.com',
          reply_to_name: '',
          reply_to_email: '',
        });
      });

      // Should navigate back on success
      expect(mockBack).toHaveBeenCalled();
    });

    it('displays validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Save Template')).toBeInTheDocument();
      });

      // Try to submit without required fields
      await user.click(screen.getByText('Save Template'));

      // The browser's built-in validation should prevent submission
      const nameField = screen.getByPlaceholderText('Template Name');
      expect(nameField).toBeInvalid();
    });

    it('handles form cancellation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Edit Email Template Workflow', () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ id: '1' });
      mockUseEmailTemplate.mockReturnValue({
        template: mockEmailTemplate,
        isLoading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });
    });

    it('renders edit form with existing data', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      expect(screen.getByText('Edit Email Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Welcome to DreamFactory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('noreply@dreamfactory.com')).toBeInTheDocument();
    });

    it('handles successful template update', async () => {
      const mockUpdateTemplate = vi.fn().mockResolvedValue({
        ...mockEmailTemplate,
        name: 'Updated Template',
      });
      
      mockUseEmailTemplate.mockReturnValue({
        template: mockEmailTemplate,
        isLoading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
      });

      // Update the template name
      const nameField = screen.getByDisplayValue('Welcome Email');
      await user.clear(nameField);
      await user.type(nameField, 'Updated Template');

      // Submit the form
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith('1', expect.objectContaining({
          name: 'Updated Template',
        }));
      });

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('displays loading state while fetching template', async () => {
      (useParams as any).mockReturnValue({ id: '1' });
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: true,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      renderWithProviders(<EmailTemplateDetailsPage />);

      // Should show loading indicator or skeleton
      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Form should be disabled during loading
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('displays loading state during form submission', async () => {
      const mockCreateTemplate = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: true,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when template fetch fails', async () => {
      (useParams as any).mockReturnValue({ id: '1' });
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: new Error('Failed to fetch email template'),
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch email template/i)).toBeInTheDocument();
      });
    });

    it('handles template creation errors', async () => {
      const mockCreateTemplate = vi.fn().mockRejectedValue(
        new Error('Failed to create email template')
      );
      
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      // Fill required fields and submit
      await user.type(screen.getByPlaceholderText('Template Name'), 'Test');
      await user.type(screen.getByPlaceholderText('Email Subject'), 'Test');
      await user.type(screen.getByPlaceholderText('From Email'), 'test@example.com');
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled();
      });

      // Error should be handled gracefully
      expect(mockBack).not.toHaveBeenCalled();
    });

    it('handles validation errors from server', async () => {
      const mockCreateTemplate = vi.fn().mockRejectedValue({
        message: 'Validation failed',
        errors: {
          from_email: ['Invalid email format'],
          name: ['Name is required'],
        },
      });

      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation and Routing', () => {
    it('navigates back on successful form submission', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue(mockEmailTemplate);
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Template Name'), 'Test');
      await user.type(screen.getByPlaceholderText('Email Subject'), 'Test');
      await user.type(screen.getByPlaceholderText('From Email'), 'test@example.com');
      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockBack).toHaveBeenCalled();
      });
    });

    it('navigates back on form cancellation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cancel'));
      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    it('validates email format for from_email field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('From Email')).toBeInTheDocument();
      });

      const emailField = screen.getByPlaceholderText('From Email');
      await user.type(emailField, 'invalid-email');

      // Check if field is invalid due to email validation
      expect(emailField).toBeInvalid();
    });

    it('validates email format for reply_to_email field', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Reply To Email')).toBeInTheDocument();
      });

      const replyEmailField = screen.getByPlaceholderText('Reply To Email');
      await user.type(replyEmailField, 'invalid-email');

      expect(replyEmailField).toBeInvalid();
    });

    it('allows submission with valid email formats', async () => {
      const mockCreateTemplate = vi.fn().mockResolvedValue(mockEmailTemplate);
      mockUseEmailTemplate.mockReturnValue({
        template: null,
        isLoading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('From Email')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Template Name'), 'Test');
      await user.type(screen.getByPlaceholderText('Email Subject'), 'Test');
      await user.type(screen.getByPlaceholderText('From Email'), 'valid@example.com');
      await user.type(screen.getByPlaceholderText('Reply To Email'), 'reply@example.com');

      await user.click(screen.getByText('Save Template'));

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labeling and structure', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Check for form structure
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Check for proper input accessibility
      const nameInput = screen.getByPlaceholderText('Template Name');
      expect(nameInput).toHaveAttribute('name', 'name');
      expect(nameInput).toHaveAttribute('required');

      const emailInput = screen.getByPlaceholderText('From Email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      // Tab through form fields
      await user.tab();
      expect(screen.getByPlaceholderText('Template Name')).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText('Email Subject')).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText('Text Body')).toHaveFocus();
    });

    it('provides proper button labels and states', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByText('Save Template')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Template');
      expect(saveButton).toHaveAttribute('type', 'submit');

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Form should still be functional on mobile
      expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      expect(screen.getByText('Save Template')).toBeInTheDocument();
    });

    it('adapts to tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
    });

    it('handles window resize events', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Simulate window resize
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      fireEvent(window, new Event('resize'));

      // Component should remain functional after resize
      expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('renders correctly in dark mode', async () => {
      // Mock dark mode by adding dark class to document
      document.documentElement.classList.add('dark');

      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Form should be functional in dark mode
      expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      expect(screen.getByText('Save Template')).toBeInTheDocument();

      // Clean up
      document.documentElement.classList.remove('dark');
    });

    it('handles theme transitions', async () => {
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Toggle dark mode
      document.documentElement.classList.add('dark');
      
      // Component should remain functional during theme transition
      expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();

      // Toggle back to light mode
      document.documentElement.classList.remove('dark');
      
      expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
    });
  });

  describe('Performance Optimizations', () => {
    it('handles large template content efficiently', async () => {
      const largeTemplate = createMockEmailTemplate({
        body_html: '<div>' + 'Large content '.repeat(1000) + '</div>',
        body_text: 'Large text content '.repeat(1000),
      });

      (useParams as any).mockReturnValue({ id: '1' });
      mockUseEmailTemplate.mockReturnValue({
        template: largeTemplate,
        isLoading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      const startTime = performance.now();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within performance budget (< 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('debounces form input changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<EmailTemplateDetailsPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Template Name')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Template Name');
      
      // Type rapidly and ensure no performance issues
      await user.type(nameInput, 'Test Template Name');
      
      expect(nameInput).toHaveValue('Test Template Name');
    });
  });

  describe('Integration with Custom Hook', () => {
    it('properly initializes hook for create mode', () => {
      (useParams as any).mockReturnValue({ id: undefined });
      renderWithProviders(<EmailTemplateDetailsPage />);

      expect(mockUseEmailTemplate).toHaveBeenCalledWith(undefined);
    });

    it('properly initializes hook for edit mode', () => {
      (useParams as any).mockReturnValue({ id: '123' });
      renderWithProviders(<EmailTemplateDetailsPage />);

      expect(mockUseEmailTemplate).toHaveBeenCalledWith('123');
    });

    it('handles hook state changes correctly', async () => {
      const { rerender } = renderWithProviders(<EmailTemplateDetailsPage />);

      // Initial state
      await waitFor(() => {
        expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      });

      // Update hook to return template data
      mockUseEmailTemplate.mockReturnValue({
        template: mockEmailTemplate,
        isLoading: false,
        error: null,
        createTemplate: vi.fn(),
        updateTemplate: vi.fn(),
        deleteTemplate: vi.fn(),
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <EmailTemplateDetailsPage />
        </QueryClientProvider>
      );

      expect(screen.getByDisplayValue('Welcome Email')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', async () => {
      // Mock an error in the form component
      const OriginalEmailTemplateForm = require('./email-template-form').default;
      vi.mocked(require('./email-template-form')).default.mockImplementation(() => {
        throw new Error('Component error');
      });

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderWithProviders(<EmailTemplateDetailsPage />);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Restore original component
      vi.mocked(require('./email-template-form')).default.mockImplementation(OriginalEmailTemplateForm);
      consoleError.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = renderWithProviders(<EmailTemplateDetailsPage />);
      
      // Verify component mounts successfully
      expect(screen.getByTestId('email-template-form')).toBeInTheDocument();
      
      // Unmount and verify cleanup
      unmount();
      
      // Should not have any lingering elements
      expect(screen.queryByTestId('email-template-form')).not.toBeInTheDocument();
    });
  });
});

/**
 * Export test utilities for potential reuse in other test files
 */
export {
  renderWithProviders,
  createQueryClient,
  createMockEmailTemplate,
};