/**
 * @fileoverview Comprehensive Vitest test suite for EmailTemplatesTable React component
 * 
 * This test suite validates the email templates table functionality including:
 * - Data table operations (sorting, filtering, pagination)
 * - CRUD operations with React Query mutations
 * - User interactions with comprehensive accessibility testing
 * - MSW-based API mocking for realistic testing scenarios
 * - Form interactions and validation workflows
 * 
 * @version 1.0.0
 * @requires vitest@2.1.0 - 10x faster test execution than Jest/Karma
 * @requires @testing-library/react - Enhanced React component testing
 * @requires msw@0.49.0 - Realistic API mocking during testing
 * @requires jest-axe - WCAG 2.1 AA accessibility compliance validation
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Component under test
import { EmailTemplatesTable } from './email-templates-table';

// Test utilities and providers
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createMockEmailTemplate, createMockPaginationResponse } from '../../../test/utils/component-factories';
import { createValidationError } from '../../../test/mocks/error-responses';

// Type definitions
import type { EmailTemplate, PaginationResponse } from '../../../types/system-config';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * Mock data for email templates following DreamFactory API structure
 */
const mockEmailTemplates: EmailTemplate[] = [
  createMockEmailTemplate({
    id: 1,
    name: 'user_invite_default',
    description: 'Default user invitation email template',
    subject: 'Welcome to DreamFactory',
    body_text: 'Welcome to our platform! Please click the link to activate your account.',
    body_html: '<h1>Welcome!</h1><p>Please click <a href="{activation_url}">here</a> to activate.</p>',
    from_name: 'DreamFactory Admin',
    from_email: 'admin@dreamfactory.com',
    reply_to_name: 'Support Team',
    reply_to_email: 'support@dreamfactory.com',
    created_date: '2024-01-15T10:30:00Z',
    last_modified_date: '2024-01-15T10:30:00Z'
  }),
  createMockEmailTemplate({
    id: 2,
    name: 'password_reset',
    description: 'Password reset email template',
    subject: 'Password Reset Request',
    body_text: 'You requested a password reset. Click the link to reset: {reset_url}',
    body_html: '<h2>Password Reset</h2><p>Click <a href="{reset_url}">here</a> to reset your password.</p>',
    from_name: 'DreamFactory Security',
    from_email: 'security@dreamfactory.com',
    reply_to_name: 'Security Team',
    reply_to_email: 'security@dreamfactory.com',
    created_date: '2024-01-10T09:15:00Z',
    last_modified_date: '2024-01-12T14:20:00Z'
  }),
  createMockEmailTemplate({
    id: 3,
    name: 'account_verification',
    description: 'Account verification email template',
    subject: 'Verify Your Account',
    body_text: 'Please verify your account by clicking: {verification_url}',
    body_html: '<div><h1>Account Verification</h1><p>Click <a href="{verification_url}">verify</a> to confirm.</p></div>',
    from_name: 'DreamFactory Verification',
    from_email: 'verify@dreamfactory.com',
    reply_to_name: 'Support',
    reply_to_email: 'support@dreamfactory.com',
    created_date: '2024-01-08T16:45:00Z',
    last_modified_date: '2024-01-08T16:45:00Z'
  })
];

/**
 * Mock API response structure for paginated email templates
 */
const mockPaginatedResponse: PaginationResponse<EmailTemplate> = createMockPaginationResponse({
  resource: mockEmailTemplates,
  count: mockEmailTemplates.length,
  meta: {
    count: mockEmailTemplates.length,
    limit: 25,
    offset: 0
  }
});

/**
 * MSW request handlers for email templates API endpoints
 */
const emailTemplateHandlers = [
  // GET /api/v2/system/email_template - List email templates with pagination
  http.get('/api/v2/system/email_template', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const filter = url.searchParams.get('filter');
    const orderBy = url.searchParams.get('order');

    let filteredTemplates = [...mockEmailTemplates];

    // Apply filtering
    if (filter) {
      const filterLower = filter.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template => 
        template.name.toLowerCase().includes(filterLower) ||
        template.description.toLowerCase().includes(filterLower) ||
        template.subject.toLowerCase().includes(filterLower)
      );
    }

    // Apply sorting
    if (orderBy) {
      const [field, direction] = orderBy.split(' ');
      filteredTemplates.sort((a, b) => {
        const aVal = a[field as keyof EmailTemplate];
        const bVal = b[field as keyof EmailTemplate];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return direction === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

    return HttpResponse.json({
      resource: paginatedTemplates,
      count: filteredTemplates.length,
      meta: {
        count: filteredTemplates.length,
        limit,
        offset
      }
    });
  }),

  // GET /api/v2/system/email_template/{id} - Get single email template
  http.get('/api/v2/system/email_template/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const template = mockEmailTemplates.find(t => t.id === id);
    
    if (!template) {
      return HttpResponse.json(
        { error: { message: 'Email template not found', status_code: 404 } },
        { status: 404 }
      );
    }

    return HttpResponse.json(template);
  }),

  // POST /api/v2/system/email_template - Create new email template
  http.post('/api/v2/system/email_template', async ({ request }) => {
    const body = await request.json() as Partial<EmailTemplate>;
    
    // Validate required fields
    if (!body.name || !body.subject) {
      return HttpResponse.json(
        createValidationError({
          name: body.name ? undefined : ['Name is required'],
          subject: body.subject ? undefined : ['Subject is required']
        }),
        { status: 422 }
      );
    }

    const newTemplate: EmailTemplate = {
      id: Math.max(...mockEmailTemplates.map(t => t.id)) + 1,
      name: body.name,
      description: body.description || '',
      subject: body.subject,
      body_text: body.body_text || '',
      body_html: body.body_html || '',
      from_name: body.from_name || 'DreamFactory',
      from_email: body.from_email || 'noreply@dreamfactory.com',
      reply_to_name: body.reply_to_name || 'Support',
      reply_to_email: body.reply_to_email || 'support@dreamfactory.com',
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString()
    };

    // Add to mock data for subsequent requests
    mockEmailTemplates.push(newTemplate);

    return HttpResponse.json(newTemplate, { status: 201 });
  }),

  // PUT /api/v2/system/email_template/{id} - Update email template
  http.put('/api/v2/system/email_template/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string);
    const body = await request.json() as Partial<EmailTemplate>;
    const templateIndex = mockEmailTemplates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Email template not found', status_code: 404 } },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.subject) {
      return HttpResponse.json(
        createValidationError({
          name: body.name ? undefined : ['Name is required'],
          subject: body.subject ? undefined : ['Subject is required']
        }),
        { status: 422 }
      );
    }

    const updatedTemplate = {
      ...mockEmailTemplates[templateIndex],
      ...body,
      last_modified_date: new Date().toISOString()
    };

    mockEmailTemplates[templateIndex] = updatedTemplate;

    return HttpResponse.json(updatedTemplate);
  }),

  // DELETE /api/v2/system/email_template/{id} - Delete email template
  http.delete('/api/v2/system/email_template/:id', ({ params }) => {
    const id = parseInt(params.id as string);
    const templateIndex = mockEmailTemplates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return HttpResponse.json(
        { error: { message: 'Email template not found', status_code: 404 } },
        { status: 404 }
      );
    }

    mockEmailTemplates.splice(templateIndex, 1);

    return HttpResponse.json({ success: true });
  }),

  // DELETE /api/v2/system/email_template - Bulk delete email templates
  http.delete('/api/v2/system/email_template', async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids')?.split(',').map(id => parseInt(id)) || [];

    if (ids.length === 0) {
      return HttpResponse.json(
        { error: { message: 'No IDs provided', status_code: 400 } },
        { status: 400 }
      );
    }

    ids.forEach(id => {
      const index = mockEmailTemplates.findIndex(t => t.id === id);
      if (index !== -1) {
        mockEmailTemplates.splice(index, 1);
      }
    });

    return HttpResponse.json({ success: true, deleted_count: ids.length });
  })
];

describe('EmailTemplatesTable Component', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Setup user event handler for realistic user interactions
    user = userEvent.setup();
    
    // Reset mock data to initial state
    mockEmailTemplates.length = 0;
    mockEmailTemplates.push(
      createMockEmailTemplate({
        id: 1,
        name: 'user_invite_default',
        description: 'Default user invitation email template',
        subject: 'Welcome to DreamFactory'
      }),
      createMockEmailTemplate({
        id: 2,
        name: 'password_reset',
        description: 'Password reset email template',
        subject: 'Password Reset Request'
      }),
      createMockEmailTemplate({
        id: 3,
        name: 'account_verification',
        description: 'Account verification email template',
        subject: 'Verify Your Account'
      })
    );

    // Register MSW handlers for email templates API
    server.use(...emailTemplateHandlers);
  });

  afterEach(() => {
    // Reset handlers after each test
    server.resetHandlers();
  });

  describe('Component Rendering and Accessibility', () => {
    it('should render email templates table with proper WCAG 2.1 AA compliance', async () => {
      const { container } = renderWithProviders(<EmailTemplatesTable />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify table structure and accessibility
      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Email Templates');
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /description/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /subject/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();

      // Accessibility audit
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should display loading state with accessible spinner', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      // Verify loading state
      const loadingSpinner = screen.getByRole('status', { name: /loading email templates/i });
      expect(loadingSpinner).toBeInTheDocument();
      expect(loadingSpinner).toHaveAttribute('aria-live', 'polite');
    });

    it('should display empty state when no email templates exist', async () => {
      // Override handler to return empty results
      server.use(
        http.get('/api/v2/system/email_template', () => {
          return HttpResponse.json({
            resource: [],
            count: 0,
            meta: { count: 0, limit: 25, offset: 0 }
          });
        })
      );

      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByText(/no email templates found/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /create first template/i })).toBeInTheDocument();
    });

    it('should handle API errors gracefully with user-friendly messages', async () => {
      // Override handler to return error
      server.use(
        http.get('/api/v2/system/email_template', () => {
          return HttpResponse.json(
            { error: { message: 'Internal server error', status_code: 500 } },
            { status: 500 }
          );
        })
      );

      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to load email templates/i)).toBeInTheDocument();
      });

      // Verify retry button is accessible
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).toHaveAttribute('aria-describedby');
    });
  });

  describe('Data Table Functionality', () => {
    it('should display email templates data in table format', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify data is displayed
      expect(screen.getByText('user_invite_default')).toBeInTheDocument();
      expect(screen.getByText('Default user invitation email template')).toBeInTheDocument();
      expect(screen.getByText('Welcome to DreamFactory')).toBeInTheDocument();

      expect(screen.getByText('password_reset')).toBeInTheDocument();
      expect(screen.getByText('Password reset email template')).toBeInTheDocument();
      expect(screen.getByText('Password Reset Request')).toBeInTheDocument();
    });

    it('should support column sorting with proper accessibility announcements', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test sorting by name column
      const nameHeader = screen.getByRole('columnheader', { name: /name/i });
      const sortButton = within(nameHeader).getByRole('button');
      
      // Verify initial sort state
      expect(sortButton).toHaveAttribute('aria-sort', 'none');

      // Click to sort ascending
      await user.click(sortButton);

      await waitFor(() => {
        expect(sortButton).toHaveAttribute('aria-sort', 'ascending');
      });

      // Verify sort is applied (first item should be 'account_verification' alphabetically)
      const firstRow = screen.getAllByRole('row')[1]; // Skip header row
      expect(within(firstRow).getByText('account_verification')).toBeInTheDocument();

      // Click again to sort descending
      await user.click(sortButton);

      await waitFor(() => {
        expect(sortButton).toHaveAttribute('aria-sort', 'descending');
      });

      // Verify descending sort (first item should be 'user_invite_default')
      const firstRowDesc = screen.getAllByRole('row')[1];
      expect(within(firstRowDesc).getByText('user_invite_default')).toBeInTheDocument();
    });

    it('should support filtering with real-time search', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and use search input
      const searchInput = screen.getByRole('searchbox', { name: /search email templates/i });
      expect(searchInput).toBeInTheDocument();

      // Search for 'password'
      await user.type(searchInput, 'password');

      await waitFor(() => {
        // Should only show password reset template
        expect(screen.getByText('password_reset')).toBeInTheDocument();
        expect(screen.queryByText('user_invite_default')).not.toBeInTheDocument();
        expect(screen.queryByText('account_verification')).not.toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        // All templates should be visible again
        expect(screen.getByText('user_invite_default')).toBeInTheDocument();
        expect(screen.getByText('password_reset')).toBeInTheDocument();
        expect(screen.getByText('account_verification')).toBeInTheDocument();
      });
    });

    it('should support pagination with proper navigation controls', async () => {
      // Override handler to return more data for pagination testing
      server.use(
        http.get('/api/v2/system/email_template', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '2');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const allTemplates = [...mockEmailTemplates];
          const paginatedData = allTemplates.slice(offset, offset + limit);

          return HttpResponse.json({
            resource: paginatedData,
            count: allTemplates.length,
            meta: {
              count: allTemplates.length,
              limit,
              offset
            }
          });
        })
      );

      renderWithProviders(<EmailTemplatesTable pageSize={2} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify pagination controls
      const pagination = screen.getByRole('navigation', { name: /pagination/i });
      expect(pagination).toBeInTheDocument();

      const nextButton = screen.getByRole('button', { name: /next page/i });
      const prevButton = screen.getByRole('button', { name: /previous page/i });

      // Previous should be disabled on first page
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeEnabled();

      // Navigate to next page
      await user.click(nextButton);

      await waitFor(() => {
        expect(prevButton).toBeEnabled();
      });

      // Verify different data is shown
      expect(screen.getByText('account_verification')).toBeInTheDocument();
      expect(screen.queryByText('user_invite_default')).not.toBeInTheDocument();
    });
  });

  describe('CRUD Operations with React Query', () => {
    it('should create new email template with form validation', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create email template/i });
      await user.click(createButton);

      // Verify modal/form opens
      const dialog = screen.getByRole('dialog', { name: /create email template/i });
      expect(dialog).toBeInTheDocument();

      // Fill form fields
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      const subjectInput = screen.getByRole('textbox', { name: /subject/i });

      await user.type(nameInput, 'test_template');
      await user.type(descriptionInput, 'Test email template');
      await user.type(subjectInput, 'Test Subject');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create template/i });
      await user.click(submitButton);

      // Verify optimistic update and success
      await waitFor(() => {
        expect(screen.getByText('test_template')).toBeInTheDocument();
        expect(screen.getByText('Test email template')).toBeInTheDocument();
      });

      // Verify success message
      expect(screen.getByRole('alert', { name: /success/i })).toBeInTheDocument();
      expect(screen.getByText(/email template created successfully/i)).toBeInTheDocument();
    });

    it('should handle form validation errors properly', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByRole('button', { name: /create email template/i });
      await user.click(createButton);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create template/i });
      await user.click(submitButton);

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      });

      // Verify form fields have error states
      const nameInput = screen.getByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });

    it('should edit existing email template with optimistic updates', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and click edit button for first template
      const firstRow = screen.getAllByRole('row')[1];
      const editButton = within(firstRow).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Verify edit modal opens with pre-filled data
      const dialog = screen.getByRole('dialog', { name: /edit email template/i });
      expect(dialog).toBeInTheDocument();

      const nameInput = screen.getByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveValue('user_invite_default');

      // Update the description
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated invitation template');

      // Submit changes
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify optimistic update
      await waitFor(() => {
        expect(screen.getByText('Updated invitation template')).toBeInTheDocument();
      });
    });

    it('should delete email template with confirmation', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Find and click delete button for first template
      const firstRow = screen.getAllByRole('row')[1];
      const deleteButton = within(firstRow).getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Verify confirmation dialog
      const confirmDialog = screen.getByRole('dialog', { name: /confirm deletion/i });
      expect(confirmDialog).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete template/i });
      await user.click(confirmButton);

      // Verify optimistic removal
      await waitFor(() => {
        expect(screen.queryByText('user_invite_default')).not.toBeInTheDocument();
      });

      // Verify success message
      expect(screen.getByRole('alert', { name: /success/i })).toBeInTheDocument();
      expect(screen.getByText(/email template deleted successfully/i)).toBeInTheDocument();
    });

    it('should support bulk delete operations', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Select multiple templates
      const checkboxes = screen.getAllByRole('checkbox');
      const firstTemplateCheckbox = checkboxes[1]; // Skip header checkbox
      const secondTemplateCheckbox = checkboxes[2];

      await user.click(firstTemplateCheckbox);
      await user.click(secondTemplateCheckbox);

      // Verify bulk actions are enabled
      const bulkDeleteButton = screen.getByRole('button', { name: /delete selected/i });
      expect(bulkDeleteButton).toBeEnabled();

      await user.click(bulkDeleteButton);

      // Verify bulk confirmation dialog
      const confirmDialog = screen.getByRole('dialog', { name: /confirm bulk deletion/i });
      expect(confirmDialog).toBeInTheDocument();
      expect(screen.getByText(/delete 2 selected templates/i)).toBeInTheDocument();

      // Confirm bulk deletion
      const confirmButton = screen.getByRole('button', { name: /delete templates/i });
      await user.click(confirmButton);

      // Verify templates are removed
      await waitFor(() => {
        expect(screen.queryByText('user_invite_default')).not.toBeInTheDocument();
        expect(screen.queryByText('password_reset')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interactions and Keyboard Navigation', () => {
    it('should support keyboard navigation throughout the table', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const searchInput = screen.getByRole('searchbox', { name: /search email templates/i });
      searchInput.focus();

      // Tab through table elements
      await user.tab();
      expect(screen.getByRole('button', { name: /create email template/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('columnheader', { name: /name/i }).querySelector('button')).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        const sortButton = screen.getByRole('columnheader', { name: /name/i }).querySelector('button');
        expect(sortButton).toHaveAttribute('aria-sort', 'ascending');
      });
    });

    it('should handle row selection with keyboard', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Navigate to first row checkbox
      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      firstRowCheckbox.focus();

      // Select with spacebar
      await user.keyboard(' ');

      expect(firstRowCheckbox).toBeChecked();

      // Navigate to actions
      await user.tab();
      await user.tab();
      
      const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
      expect(editButton).toHaveFocus();

      // Activate edit with Enter
      await user.keyboard('{Enter}');

      expect(screen.getByRole('dialog', { name: /edit email template/i })).toBeInTheDocument();
    });

    it('should provide proper focus management in modals', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /create email template/i });
      await user.click(createButton);

      // Verify focus is trapped in modal
      const dialog = screen.getByRole('dialog', { name: /create email template/i });
      expect(dialog).toBeInTheDocument();

      const nameInput = screen.getByRole('textbox', { name: /name/i });
      expect(nameInput).toHaveFocus();

      // Test Escape key closes modal
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Focus should return to create button
      expect(createButton).toHaveFocus();
    });
  });

  describe('Responsive Design and Performance', () => {
    it('should adapt table layout for mobile devices', async () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify mobile-optimized layout
      const table = screen.getByRole('table');
      expect(table).toHaveClass('mobile-responsive');

      // Verify cards layout is used on mobile
      const templateCards = screen.getAllByTestId('template-card');
      expect(templateCards).toHaveLength(mockEmailTemplates.length);
    });

    it('should implement virtual scrolling for large datasets', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, index) => 
        createMockEmailTemplate({
          id: index + 1,
          name: `template_${index + 1}`,
          description: `Template ${index + 1} description`,
          subject: `Subject ${index + 1}`
        })
      );

      server.use(
        http.get('/api/v2/system/email_template', () => {
          return HttpResponse.json({
            resource: largeDataset.slice(0, 50), // Return first 50 items
            count: largeDataset.length,
            meta: {
              count: largeDataset.length,
              limit: 50,
              offset: 0
            }
          });
        })
      );

      renderWithProviders(<EmailTemplatesTable virtualScrolling={true} />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify virtual scrolling container exists
      const virtualContainer = screen.getByTestId('virtual-scroll-container');
      expect(virtualContainer).toBeInTheDocument();

      // Verify only visible items are rendered
      const visibleRows = screen.getAllByRole('row');
      expect(visibleRows.length).toBeLessThan(1000); // Should be much less than total
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock a network timeout
      server.use(
        http.get('/api/v2/system/email_template', () => {
          return HttpResponse.error();
        })
      );

      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Verify retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle concurrent modification conflicts', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Simulate concurrent modification error
      server.use(
        http.put('/api/v2/system/email_template/:id', () => {
          return HttpResponse.json(
            { error: { message: 'Resource has been modified by another user', status_code: 409 } },
            { status: 409 }
          );
        })
      );

      // Try to edit template
      const firstRow = screen.getAllByRole('row')[1];
      const editButton = within(firstRow).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      await user.type(descriptionInput, ' updated');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify conflict handling
      await waitFor(() => {
        expect(screen.getByRole('alert', { name: /warning/i })).toBeInTheDocument();
        expect(screen.getByText(/resource has been modified/i)).toBeInTheDocument();
      });

      // Verify refresh option is provided
      expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument();
    });

    it('should validate email template name uniqueness', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Mock duplicate name validation error
      server.use(
        http.post('/api/v2/system/email_template', () => {
          return HttpResponse.json(
            createValidationError({
              name: ['Template name must be unique']
            }),
            { status: 422 }
          );
        })
      );

      // Try to create template with duplicate name
      const createButton = screen.getByRole('button', { name: /create email template/i });
      await user.click(createButton);

      const nameInput = screen.getByRole('textbox', { name: /name/i });
      await user.type(nameInput, 'user_invite_default'); // Existing name

      const subjectInput = screen.getByRole('textbox', { name: /subject/i });
      await user.type(subjectInput, 'Test Subject');

      const submitButton = screen.getByRole('button', { name: /create template/i });
      await user.click(submitButton);

      // Verify validation error
      await waitFor(() => {
        expect(screen.getByText(/template name must be unique/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with React Query and State Management', () => {
    it('should cache data properly and handle cache invalidation', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Verify initial data load
      expect(screen.getByText('user_invite_default')).toBeInTheDocument();

      // Create new template (should invalidate cache)
      const createButton = screen.getByRole('button', { name: /create email template/i });
      await user.click(createButton);

      const nameInput = screen.getByRole('textbox', { name: /name/i });
      const subjectInput = screen.getByRole('textbox', { name: /subject/i });

      await user.type(nameInput, 'new_template');
      await user.type(subjectInput, 'New Template Subject');

      const submitButton = screen.getByRole('button', { name: /create template/i });
      await user.click(submitButton);

      // Verify cache is updated with new data
      await waitFor(() => {
        expect(screen.getByText('new_template')).toBeInTheDocument();
      });
    });

    it('should handle optimistic updates correctly', async () => {
      renderWithProviders(<EmailTemplatesTable />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      // Edit template
      const firstRow = screen.getAllByRole('row')[1];
      const editButton = within(firstRow).getByRole('button', { name: /edit/i });
      await user.click(editButton);

      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Optimistically updated');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      // Verify optimistic update is visible immediately
      expect(screen.getByText('Optimistically updated')).toBeInTheDocument();

      // Verify final state after server response
      await waitFor(() => {
        expect(screen.getByText('Optimistically updated')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});