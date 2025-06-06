/**
 * Email Templates Mock Data and Handlers
 * 
 * Mock Service Worker handlers for email template CRUD operations in the
 * DreamFactory Admin Interface. Provides realistic API responses for testing
 * email template management functionality including create, read, update,
 * and delete operations with proper validation and error scenarios.
 * 
 * Replaces Angular email template service mocking with MSW patterns
 * for enhanced testing capabilities and more realistic API simulation.
 */

import { http, HttpResponse } from 'msw';
import { EmailTemplate, EmailTemplatePayload } from '@/types/email-templates';
import { createErrorResponse, createValidationErrorResponse } from './error-responses';
import { transformRequest, transformResponse, extractPagination, buildFilterQuery } from './utils';

// ============================================================================
// MOCK EMAIL TEMPLATE DATA
// ============================================================================

/**
 * Sample email template data for testing various scenarios
 */
export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    to: '{email}',
    cc: '',
    bcc: '',
    subject: 'Welcome to DreamFactory!',
    attachment: '',
    bodyText: 'Welcome to our platform!',
    bodyHtml: '<h1>Welcome to our platform!</h1><p>Thank you for joining us.</p>',
    fromName: 'DreamFactory Team',
    fromEmail: 'noreply@dreamfactory.com',
    replyToName: 'Support Team',
    replyToEmail: 'support@dreamfactory.com',
    defaults: {
      locale: 'en',
      timezone: 'UTC',
    },
    createdDate: '2024-01-15T10:30:00.000Z',
    lastModifiedDate: '2024-01-15T10:30:00.000Z',
    createdById: 1,
    lastModifiedById: 1,
  },
  {
    id: 2,
    name: 'Password Reset',
    description: 'Password reset email template',
    to: '{email}',
    cc: '',
    bcc: '',
    subject: 'Password Reset Request',
    attachment: '',
    bodyText: 'Click the link to reset your password: {reset_link}',
    bodyHtml: '<h2>Password Reset</h2><p>Click <a href="{reset_link}">here</a> to reset your password.</p>',
    fromName: 'DreamFactory Security',
    fromEmail: 'security@dreamfactory.com',
    replyToName: 'Support Team',
    replyToEmail: 'support@dreamfactory.com',
    defaults: {
      locale: 'en',
      timezone: 'UTC',
    },
    createdDate: '2024-01-15T11:00:00.000Z',
    lastModifiedDate: '2024-01-20T14:30:00.000Z',
    createdById: 1,
    lastModifiedById: 2,
  },
  {
    id: 3,
    name: 'Registration Confirmation',
    description: 'Email sent after successful registration',
    to: '{email}',
    cc: 'admin@dreamfactory.com',
    bcc: '',
    subject: 'Registration Successful',
    attachment: '/uploads/welcome-guide.pdf',
    bodyText: 'Your registration was successful. Please verify your email address.',
    bodyHtml: '<h2>Registration Successful</h2><p>Your registration was successful. Please verify your email address by clicking the link below.</p>',
    fromName: 'DreamFactory Registration',
    fromEmail: 'registration@dreamfactory.com',
    replyToName: 'Support Team',
    replyToEmail: 'support@dreamfactory.com',
    defaults: {
      locale: 'en',
      timezone: 'UTC',
    },
    createdDate: '2024-01-16T09:15:00.000Z',
    lastModifiedDate: '2024-01-22T16:45:00.000Z',
    createdById: 2,
    lastModifiedById: 1,
  },
];

/**
 * Creates a new email template with realistic defaults
 */
export function createMockEmailTemplate(override: Partial<EmailTemplate> = {}): EmailTemplate {
  const baseTemplate: EmailTemplate = {
    id: Math.floor(Math.random() * 10000) + 1000,
    name: 'Test Email Template',
    description: 'Test email template description',
    to: '{email}',
    cc: '',
    bcc: '',
    subject: 'Test Subject',
    attachment: '',
    bodyText: 'Test email body text',
    bodyHtml: '<p>Test email body HTML</p>',
    fromName: 'Test Sender',
    fromEmail: 'test@example.com',
    replyToName: 'Test Reply',
    replyToEmail: 'reply@example.com',
    defaults: {
      locale: 'en',
      timezone: 'UTC',
    },
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    createdById: 1,
    lastModifiedById: 1,
  };

  return { ...baseTemplate, ...override };
}

/**
 * Validates email template payload for testing validation scenarios
 */
export function validateEmailTemplatePayload(payload: EmailTemplatePayload): string[] {
  const errors: string[] = [];

  if (!payload.name || payload.name.trim().length === 0) {
    errors.push('Email template name is required');
  }

  if (payload.name && payload.name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  if (payload.description && payload.description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  if (payload.to && payload.to.length > 255) {
    errors.push('To field must be less than 255 characters');
  }

  if (payload.cc && payload.cc.length > 255) {
    errors.push('CC field must be less than 255 characters');
  }

  if (payload.bcc && payload.bcc.length > 255) {
    errors.push('BCC field must be less than 255 characters');
  }

  if (payload.subject && payload.subject.length > 255) {
    errors.push('Subject must be less than 255 characters');
  }

  if (payload.attachment && payload.attachment.length > 500) {
    errors.push('Attachment path must be less than 500 characters');
  }

  if (payload.bodyHtml && payload.bodyHtml.length > 10000) {
    errors.push('Body must be less than 10,000 characters');
  }

  if (payload.fromName && payload.fromName.length > 100) {
    errors.push('Sender name must be less than 100 characters');
  }

  if (payload.fromEmail && payload.fromEmail.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.fromEmail)) {
    errors.push('Please enter a valid sender email address');
  }

  if (payload.replyToName && payload.replyToName.length > 100) {
    errors.push('Reply-to name must be less than 100 characters');
  }

  if (payload.replyToEmail && payload.replyToEmail.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.replyToEmail)) {
    errors.push('Please enter a valid reply-to email address');
  }

  return errors;
}

// ============================================================================
// MSW HANDLERS
// ============================================================================

// Local storage for mock data during test execution
let emailTemplatesData = [...mockEmailTemplates];

/**
 * MSW handlers for email template API endpoints
 */
export const emailTemplateHandlers = [
  // GET /api/v2/system/email_template - List email templates
  http.get('/api/v2/system/email_template', ({ request }) => {
    try {
      const url = new URL(request.url);
      const { limit, offset } = extractPagination(url);
      const fields = url.searchParams.get('fields');
      const sort = url.searchParams.get('sort') || 'name';
      const order = url.searchParams.get('order') || 'asc';
      const filter = url.searchParams.get('filter');

      // Apply filtering
      let filteredTemplates = [...emailTemplatesData];
      if (filter) {
        const filterQuery = buildFilterQuery(filter);
        filteredTemplates = emailTemplatesData.filter((template) => {
          // Simple filter implementation for testing
          if (filterQuery.includes('name like')) {
            const nameMatch = filterQuery.match(/name like "%(.+?)%"/);
            if (nameMatch) {
              return template.name.toLowerCase().includes(nameMatch[1].toLowerCase());
            }
          }
          if (filterQuery.includes('description like')) {
            const descMatch = filterQuery.match(/description like "%(.+?)%"/);
            if (descMatch) {
              return (template.description || '').toLowerCase().includes(descMatch[1].toLowerCase());
            }
          }
          return true;
        });
      }

      // Apply sorting
      filteredTemplates.sort((a, b) => {
        let comparison = 0;
        switch (sort) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'description':
            comparison = (a.description || '').localeCompare(b.description || '');
            break;
          case 'created_date':
            comparison = new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime();
            break;
          case 'last_modified_date':
            comparison = new Date(a.lastModifiedDate).getTime() - new Date(b.lastModifiedDate).getTime();
            break;
          default:
            comparison = a.id - b.id;
        }
        return order === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const total = filteredTemplates.length;
      const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

      // Transform response to match API format
      const transformedTemplates = paginatedTemplates.map(template => 
        transformResponse(template, fields)
      );

      return HttpResponse.json({
        resource: transformedTemplates,
        meta: {
          count: paginatedTemplates.length,
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while fetching email templates');
    }
  }),

  // GET /api/v2/system/email_template/:id - Get email template by ID
  http.get('/api/v2/system/email_template/:id', ({ params, request }) => {
    try {
      const id = parseInt(params.id as string, 10);
      const url = new URL(request.url);
      const fields = url.searchParams.get('fields');

      if (isNaN(id)) {
        return createErrorResponse(400, 'Invalid email template ID');
      }

      const template = emailTemplatesData.find(t => t.id === id);
      if (!template) {
        return createErrorResponse(404, 'Email template not found');
      }

      const transformedTemplate = transformResponse(template, fields);
      return HttpResponse.json(transformedTemplate);
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while fetching email template');
    }
  }),

  // POST /api/v2/system/email_template - Create email template
  http.post('/api/v2/system/email_template', async ({ request }) => {
    try {
      const payload = await request.json() as EmailTemplatePayload;
      const transformedPayload = transformRequest(payload);

      // Validate payload
      const validationErrors = validateEmailTemplatePayload(transformedPayload);
      if (validationErrors.length > 0) {
        return createValidationErrorResponse(validationErrors);
      }

      // Check for duplicate name
      const existingTemplate = emailTemplatesData.find(t => 
        t.name.toLowerCase() === transformedPayload.name.toLowerCase()
      );
      if (existingTemplate) {
        return createValidationErrorResponse(['Email template name must be unique']);
      }

      // Create new template
      const newTemplate = createMockEmailTemplate({
        name: transformedPayload.name,
        description: transformedPayload.description,
        to: transformedPayload.to,
        cc: transformedPayload.cc,
        bcc: transformedPayload.bcc,
        subject: transformedPayload.subject,
        attachment: transformedPayload.attachment,
        bodyHtml: transformedPayload.bodyHtml,
        fromName: transformedPayload.fromName,
        fromEmail: transformedPayload.fromEmail,
        replyToName: transformedPayload.replyToName,
        replyToEmail: transformedPayload.replyToEmail,
      });

      emailTemplatesData.push(newTemplate);
      
      const transformedTemplate = transformResponse(newTemplate);
      return HttpResponse.json(transformedTemplate, { status: 201 });
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while creating email template');
    }
  }),

  // PUT /api/v2/system/email_template/:id - Update email template (full update)
  http.put('/api/v2/system/email_template/:id', async ({ params, request }) => {
    try {
      const id = parseInt(params.id as string, 10);
      const payload = await request.json() as EmailTemplatePayload;
      const transformedPayload = transformRequest(payload);

      if (isNaN(id)) {
        return createErrorResponse(400, 'Invalid email template ID');
      }

      const templateIndex = emailTemplatesData.findIndex(t => t.id === id);
      if (templateIndex === -1) {
        return createErrorResponse(404, 'Email template not found');
      }

      // Validate payload
      const validationErrors = validateEmailTemplatePayload(transformedPayload);
      if (validationErrors.length > 0) {
        return createValidationErrorResponse(validationErrors);
      }

      // Check for duplicate name (excluding current template)
      const existingTemplate = emailTemplatesData.find(t => 
        t.id !== id && t.name.toLowerCase() === transformedPayload.name.toLowerCase()
      );
      if (existingTemplate) {
        return createValidationErrorResponse(['Email template name must be unique']);
      }

      // Update template
      const currentTemplate = emailTemplatesData[templateIndex];
      const updatedTemplate: EmailTemplate = {
        ...currentTemplate,
        name: transformedPayload.name,
        description: transformedPayload.description || '',
        to: transformedPayload.to || '',
        cc: transformedPayload.cc || '',
        bcc: transformedPayload.bcc || '',
        subject: transformedPayload.subject || '',
        attachment: transformedPayload.attachment || '',
        bodyHtml: transformedPayload.bodyHtml || '',
        fromName: transformedPayload.fromName || '',
        fromEmail: transformedPayload.fromEmail || '',
        replyToName: transformedPayload.replyToName || '',
        replyToEmail: transformedPayload.replyToEmail || '',
        lastModifiedDate: new Date().toISOString(),
        lastModifiedById: 1, // Mock current user ID
      };

      emailTemplatesData[templateIndex] = updatedTemplate;
      
      const transformedTemplate = transformResponse(updatedTemplate);
      return HttpResponse.json(transformedTemplate);
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while updating email template');
    }
  }),

  // PATCH /api/v2/system/email_template/:id - Partial update email template
  http.patch('/api/v2/system/email_template/:id', async ({ params, request }) => {
    try {
      const id = parseInt(params.id as string, 10);
      const payload = await request.json() as Partial<EmailTemplatePayload>;
      const transformedPayload = transformRequest(payload);

      if (isNaN(id)) {
        return createErrorResponse(400, 'Invalid email template ID');
      }

      const templateIndex = emailTemplatesData.findIndex(t => t.id === id);
      if (templateIndex === -1) {
        return createErrorResponse(404, 'Email template not found');
      }

      // Create full payload for validation
      const currentTemplate = emailTemplatesData[templateIndex];
      const fullPayload: EmailTemplatePayload = {
        name: transformedPayload.name ?? currentTemplate.name,
        description: transformedPayload.description ?? currentTemplate.description,
        to: transformedPayload.to ?? currentTemplate.to,
        cc: transformedPayload.cc ?? currentTemplate.cc,
        bcc: transformedPayload.bcc ?? currentTemplate.bcc,
        subject: transformedPayload.subject ?? currentTemplate.subject,
        attachment: transformedPayload.attachment ?? currentTemplate.attachment,
        bodyHtml: transformedPayload.bodyHtml ?? currentTemplate.bodyHtml,
        fromName: transformedPayload.fromName ?? currentTemplate.fromName,
        fromEmail: transformedPayload.fromEmail ?? currentTemplate.fromEmail,
        replyToName: transformedPayload.replyToName ?? currentTemplate.replyToName,
        replyToEmail: transformedPayload.replyToEmail ?? currentTemplate.replyToEmail,
      };

      // Validate full payload
      const validationErrors = validateEmailTemplatePayload(fullPayload);
      if (validationErrors.length > 0) {
        return createValidationErrorResponse(validationErrors);
      }

      // Check for duplicate name if name is being updated
      if (transformedPayload.name && transformedPayload.name !== currentTemplate.name) {
        const existingTemplate = emailTemplatesData.find(t => 
          t.id !== id && t.name.toLowerCase() === transformedPayload.name.toLowerCase()
        );
        if (existingTemplate) {
          return createValidationErrorResponse(['Email template name must be unique']);
        }
      }

      // Apply partial update
      const updatedTemplate: EmailTemplate = {
        ...currentTemplate,
        ...Object.fromEntries(
          Object.entries(transformedPayload)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, value || ''])
        ),
        lastModifiedDate: new Date().toISOString(),
        lastModifiedById: 1, // Mock current user ID
      };

      emailTemplatesData[templateIndex] = updatedTemplate;
      
      const transformedTemplate = transformResponse(updatedTemplate);
      return HttpResponse.json(transformedTemplate);
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while updating email template');
    }
  }),

  // DELETE /api/v2/system/email_template/:id - Delete email template
  http.delete('/api/v2/system/email_template/:id', ({ params }) => {
    try {
      const id = parseInt(params.id as string, 10);

      if (isNaN(id)) {
        return createErrorResponse(400, 'Invalid email template ID');
      }

      const templateIndex = emailTemplatesData.findIndex(t => t.id === id);
      if (templateIndex === -1) {
        return createErrorResponse(404, 'Email template not found');
      }

      emailTemplatesData.splice(templateIndex, 1);
      
      return new HttpResponse(null, { status: 204 });
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while deleting email template');
    }
  }),

  // DELETE /api/v2/system/email_template - Bulk delete email templates
  http.delete('/api/v2/system/email_template', async ({ request }) => {
    try {
      const payload = await request.json() as { ids: number[] };
      
      if (!payload.ids || !Array.isArray(payload.ids)) {
        return createErrorResponse(400, 'Invalid request: ids array is required');
      }

      const validIds = payload.ids.filter(id => 
        typeof id === 'number' && emailTemplatesData.some(t => t.id === id)
      );

      if (validIds.length === 0) {
        return createErrorResponse(404, 'No valid email templates found for deletion');
      }

      // Remove templates
      emailTemplatesData = emailTemplatesData.filter(template => 
        !validIds.includes(template.id)
      );

      return new HttpResponse(null, { status: 204 });
    } catch (error) {
      return createErrorResponse(500, 'Internal server error occurred while bulk deleting email templates');
    }
  }),
];

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Resets mock data to initial state for test isolation
 */
export function resetEmailTemplatesMockData(): void {
  emailTemplatesData = [...mockEmailTemplates];
}

/**
 * Gets current mock data (useful for test assertions)
 */
export function getEmailTemplatesMockData(): EmailTemplate[] {
  return [...emailTemplatesData];
}

/**
 * Adds email templates to mock data (useful for test setup)
 */
export function addEmailTemplatesToMockData(templates: EmailTemplate[]): void {
  emailTemplatesData.push(...templates);
}

/**
 * Creates error scenarios for testing error handling
 */
export const emailTemplateErrorScenarios = {
  networkError: () => {
    throw new Error('Network error');
  },
  
  serverError: () => createErrorResponse(500, 'Internal server error'),
  
  notFound: () => createErrorResponse(404, 'Email template not found'),
  
  validation: (errors: string[]) => createValidationErrorResponse(errors),
  
  unauthorized: () => createErrorResponse(401, 'Unauthorized access'),
  
  forbidden: () => createErrorResponse(403, 'Access forbidden'),
};

/**
 * Performance tracking utilities for testing response times
 */
export const emailTemplatePerformanceUtils = {
  /**
   * Simulates API delay for performance testing
   */
  async simulateDelay(ms: number = 50): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Creates a performance-tracked handler
   */
  withPerformanceTracking<T extends (...args: any[]) => any>(
    handler: T,
    maxResponseTime: number = 100
  ): T {
    return (async (...args: any[]) => {
      const startTime = performance.now();
      const result = await handler(...args);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (responseTime > maxResponseTime) {
        console.warn(`Performance warning: Handler took ${responseTime}ms (max: ${maxResponseTime}ms)`);
      }
      
      return result;
    }) as T;
  },
};

export default emailTemplateHandlers;