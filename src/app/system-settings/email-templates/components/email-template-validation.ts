/**
 * Comprehensive Zod validation schemas for email template forms
 * Provides field-level validation rules, custom validators, and type-safe integration
 * with React Hook Form per React/Next.js Integration Requirements
 */

import { z } from 'zod';

// Email validation pattern for comprehensive RFC 5322 compliance
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Template variable pattern for validation (supports {{variable}} and {variable} formats)
const TEMPLATE_VARIABLE_REGEX = /\{\{?[a-zA-Z_][a-zA-Z0-9_]*\}?\}/g;

// HTML tag pattern for basic HTML validation
const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

// Dangerous script/style tag patterns to prevent XSS
const DANGEROUS_HTML_REGEX = /<\s*(script|style|iframe|object|embed)\b[^<]*(?:(?!<\/\s*\1\s*>)<[^<]*)*<\/\s*\1\s*>/gi;

/**
 * Custom validator for email addresses with enhanced validation
 * Supports multiple email formats: single email, comma-separated emails, template variables
 */
const validateEmailField = (value: string | undefined | null, allowEmpty = true): boolean => {
  if (!value || value.trim() === '') {
    return allowEmpty;
  }

  const trimmedValue = value.trim();
  
  // Allow template variables
  if (TEMPLATE_VARIABLE_REGEX.test(trimmedValue)) {
    return true;
  }

  // Split by comma for multiple emails
  const emails = trimmedValue.split(',').map(email => email.trim());
  
  return emails.every(email => {
    if (!email) return false;
    return EMAIL_REGEX.test(email) || TEMPLATE_VARIABLE_REGEX.test(email);
  });
};

/**
 * Custom validator for template content syntax
 * Validates template variables and basic HTML structure
 */
const validateTemplateContent = (content: string | undefined | null): boolean => {
  if (!content || content.trim() === '') {
    return true; // Allow empty content
  }

  // Check for dangerous HTML patterns
  if (DANGEROUS_HTML_REGEX.test(content)) {
    return false;
  }

  // Validate template variables are properly formatted
  const variables = content.match(TEMPLATE_VARIABLE_REGEX);
  if (variables) {
    return variables.every(variable => {
      // Check for properly closed braces
      const openBraces = (variable.match(/\{/g) || []).length;
      const closeBraces = (variable.match(/\}/g) || []).length;
      return openBraces === closeBraces && openBraces >= 1 && openBraces <= 2;
    });
  }

  return true;
};

/**
 * Custom validator for HTML content structure
 * Ensures basic HTML validity and security compliance
 */
const validateHtmlContent = (html: string | undefined | null): boolean => {
  if (!html || html.trim() === '') {
    return true;
  }

  // Check for dangerous content
  if (DANGEROUS_HTML_REGEX.test(html)) {
    return false;
  }

  // Basic HTML structure validation
  const openTags = (html.match(/<[^\/][^>]*>/g) || []).length;
  const closeTags = (html.match(/<\/[^>]*>/g) || []).length;
  const selfClosingTags = (html.match(/<[^>]*\/>/g) || []).length;

  // Allow some tolerance for self-closing tags and simple HTML
  return Math.abs(openTags - closeTags - selfClosingTags) <= 5;
};

// Internationalization error message keys for type-safe translation access
export const EMAIL_TEMPLATE_VALIDATION_ERRORS = {
  NAME_REQUIRED: 'emailTemplates.validation.errors.nameRequired',
  NAME_TOO_LONG: 'emailTemplates.validation.errors.nameTooLong',
  NAME_INVALID_CHARS: 'emailTemplates.validation.errors.nameInvalidChars',
  DESCRIPTION_TOO_LONG: 'emailTemplates.validation.errors.descriptionTooLong',
  EMAIL_INVALID_FORMAT: 'emailTemplates.validation.errors.emailInvalidFormat',
  EMAIL_MULTIPLE_INVALID: 'emailTemplates.validation.errors.emailMultipleInvalid',
  SUBJECT_TOO_LONG: 'emailTemplates.validation.errors.subjectTooLong',
  SUBJECT_REQUIRED: 'emailTemplates.validation.errors.subjectRequired',
  BODY_TEXT_INVALID_TEMPLATE: 'emailTemplates.validation.errors.bodyTextInvalidTemplate',
  BODY_HTML_INVALID_TEMPLATE: 'emailTemplates.validation.errors.bodyHtmlInvalidTemplate',
  BODY_HTML_DANGEROUS_CONTENT: 'emailTemplates.validation.errors.bodyHtmlDangerousContent',
  BODY_HTML_INVALID_STRUCTURE: 'emailTemplates.validation.errors.bodyHtmlInvalidStructure',
  FROM_NAME_TOO_LONG: 'emailTemplates.validation.errors.fromNameTooLong',
  FROM_EMAIL_INVALID: 'emailTemplates.validation.errors.fromEmailInvalid',
  FROM_EMAIL_REQUIRED: 'emailTemplates.validation.errors.fromEmailRequired',
  REPLY_TO_NAME_TOO_LONG: 'emailTemplates.validation.errors.replyToNameTooLong',
  REPLY_TO_EMAIL_INVALID: 'emailTemplates.validation.errors.replyToEmailInvalid',
  ATTACHMENT_INVALID_PATH: 'emailTemplates.validation.errors.attachmentInvalidPath',
  DEFAULTS_INVALID_JSON: 'emailTemplates.validation.errors.defaultsInvalidJson',
  BODY_CONTENT_REQUIRED: 'emailTemplates.validation.errors.bodyContentRequired',
} as const;

/**
 * Helper function to create email field validation schema
 * Reusable for to, cc, bcc, fromEmail, replyToEmail fields
 */
const createEmailFieldSchema = (fieldName: string, required = false, allowMultiple = true) => {
  let schema = z.string().optional();

  if (required) {
    schema = z.string({
      required_error: EMAIL_TEMPLATE_VALIDATION_ERRORS.FROM_EMAIL_REQUIRED,
    });
  }

  return schema
    .refine(
      (value) => {
        if (!value || value.trim() === '') return !required;
        return validateEmailField(value, !required);
      },
      {
        message: allowMultiple 
          ? EMAIL_TEMPLATE_VALIDATION_ERRORS.EMAIL_MULTIPLE_INVALID
          : EMAIL_TEMPLATE_VALIDATION_ERRORS.EMAIL_INVALID_FORMAT,
      }
    )
    .transform((value) => value?.trim() || undefined);
};

/**
 * Base email template validation schema
 * Core fields required for all email template operations
 */
export const baseEmailTemplateSchema = z.object({
  name: z
    .string({
      required_error: EMAIL_TEMPLATE_VALIDATION_ERRORS.NAME_REQUIRED,
    })
    .min(1, EMAIL_TEMPLATE_VALIDATION_ERRORS.NAME_REQUIRED)
    .max(255, EMAIL_TEMPLATE_VALIDATION_ERRORS.NAME_TOO_LONG)
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, EMAIL_TEMPLATE_VALIDATION_ERRORS.NAME_INVALID_CHARS)
    .transform((value) => value.trim()),

  description: z
    .string()
    .max(1000, EMAIL_TEMPLATE_VALIDATION_ERRORS.DESCRIPTION_TOO_LONG)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

/**
 * Email recipient fields validation schema
 * Handles to, cc, bcc fields with multiple email support
 */
export const emailRecipientsSchema = z.object({
  to: createEmailFieldSchema('to', false, true),
  cc: createEmailFieldSchema('cc', false, true),
  bcc: createEmailFieldSchema('bcc', false, true),
});

/**
 * Email sender fields validation schema
 * Handles fromEmail, fromName, replyToEmail, replyToName fields
 */
export const emailSenderSchema = z.object({
  fromEmail: createEmailFieldSchema('fromEmail', true, false),
  fromName: z
    .string()
    .max(255, EMAIL_TEMPLATE_VALIDATION_ERRORS.FROM_NAME_TOO_LONG)
    .optional()
    .transform((value) => value?.trim() || undefined),
  replyToEmail: createEmailFieldSchema('replyToEmail', false, false),
  replyToName: z
    .string()
    .max(255, EMAIL_TEMPLATE_VALIDATION_ERRORS.REPLY_TO_NAME_TOO_LONG)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

/**
 * Email content validation schema
 * Handles subject, bodyText, bodyHtml with template syntax validation
 */
export const emailContentSchema = z.object({
  subject: z
    .string()
    .max(500, EMAIL_TEMPLATE_VALIDATION_ERRORS.SUBJECT_TOO_LONG)
    .optional()
    .refine(
      (value) => validateTemplateContent(value),
      EMAIL_TEMPLATE_VALIDATION_ERRORS.SUBJECT_REQUIRED
    )
    .transform((value) => value?.trim() || undefined),

  bodyText: z
    .string()
    .optional()
    .refine(
      (value) => validateTemplateContent(value),
      EMAIL_TEMPLATE_VALIDATION_ERRORS.BODY_TEXT_INVALID_TEMPLATE
    )
    .transform((value) => value?.trim() || undefined),

  bodyHtml: z
    .string()
    .optional()
    .refine(
      (value) => validateTemplateContent(value),
      EMAIL_TEMPLATE_VALIDATION_ERRORS.BODY_HTML_INVALID_TEMPLATE
    )
    .refine(
      (value) => validateHtmlContent(value),
      EMAIL_TEMPLATE_VALIDATION_ERRORS.BODY_HTML_INVALID_STRUCTURE
    )
    .transform((value) => value?.trim() || undefined),

  attachment: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === '') return true;
        // Basic path validation - no directory traversal
        return !value.includes('..') && !value.includes('//');
      },
      EMAIL_TEMPLATE_VALIDATION_ERRORS.ATTACHMENT_INVALID_PATH
    )
    .transform((value) => value?.trim() || undefined),
});

/**
 * Email template defaults validation schema
 * Handles the defaults object with JSON validation
 */
export const emailDefaultsSchema = z.object({
  defaults: z
    .record(z.any())
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        try {
          // Ensure it's serializable JSON
          JSON.stringify(value);
          return true;
        } catch {
          return false;
        }
      },
      EMAIL_TEMPLATE_VALIDATION_ERRORS.DEFAULTS_INVALID_JSON
    ),
});

/**
 * Complete email template validation schema for create operations
 * Combines all validation schemas with body content requirement
 */
export const createEmailTemplateSchema = baseEmailTemplateSchema
  .merge(emailRecipientsSchema)
  .merge(emailSenderSchema)
  .merge(emailContentSchema)
  .merge(emailDefaultsSchema)
  .refine(
    (data) => {
      // At least one body content is required (text or HTML)
      return !!(data.bodyText?.trim() || data.bodyHtml?.trim());
    },
    {
      message: EMAIL_TEMPLATE_VALIDATION_ERRORS.BODY_CONTENT_REQUIRED,
      path: ['bodyText'], // Show error on bodyText field
    }
  );

/**
 * Email template validation schema for update operations
 * Same as create but allows partial updates
 */
export const updateEmailTemplateSchema = createEmailTemplateSchema.partial().extend({
  id: z.number().int().positive(),
});

/**
 * Bulk email template operations validation schema
 * For handling multiple template operations
 */
export const bulkEmailTemplateSchema = z.object({
  operation: z.enum(['delete', 'duplicate', 'export']),
  templateIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one template must be selected')
    .max(50, 'Cannot process more than 50 templates at once'),
  options: z
    .object({
      prefix: z.string().max(50).optional(), // For duplicate operations
      format: z.enum(['json', 'xml']).optional(), // For export operations
    })
    .optional(),
});

/**
 * Email template search and filter validation schema
 * For validating search parameters and filters
 */
export const emailTemplateFilterSchema = z.object({
  search: z.string().max(255).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  tags: z.array(z.string()).max(10).optional(),
  sortBy: z.enum(['name', 'createdDate', 'lastModifiedDate']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

/**
 * Email template test validation schema
 * For validating email template test operations
 */
export const emailTemplateTestSchema = z.object({
  templateId: z.number().int().positive(),
  testEmail: createEmailFieldSchema('testEmail', true, false),
  testData: z.record(z.any()).optional(),
  previewOnly: z.boolean().default(false),
});

// Type exports for React Hook Form integration
export type CreateEmailTemplateForm = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateForm = z.infer<typeof updateEmailTemplateSchema>;
export type BulkEmailTemplateForm = z.infer<typeof bulkEmailTemplateSchema>;
export type EmailTemplateFilterForm = z.infer<typeof emailTemplateFilterSchema>;
export type EmailTemplateTestForm = z.infer<typeof emailTemplateTestSchema>;

// Validation schema registry for different operations
export const EMAIL_TEMPLATE_VALIDATION_SCHEMAS = {
  create: createEmailTemplateSchema,
  update: updateEmailTemplateSchema,
  bulk: bulkEmailTemplateSchema,
  filter: emailTemplateFilterSchema,
  test: emailTemplateTestSchema,
  base: baseEmailTemplateSchema,
  recipients: emailRecipientsSchema,
  sender: emailSenderSchema,
  content: emailContentSchema,
  defaults: emailDefaultsSchema,
} as const;

/**
 * Utility function to get validation schema by operation type
 * Provides type-safe access to validation schemas
 */
export const getEmailTemplateValidationSchema = <T extends keyof typeof EMAIL_TEMPLATE_VALIDATION_SCHEMAS>(
  operation: T
): typeof EMAIL_TEMPLATE_VALIDATION_SCHEMAS[T] => {
  return EMAIL_TEMPLATE_VALIDATION_SCHEMAS[operation];
};

/**
 * Utility function to validate email template field in real-time
 * Optimized for React Hook Form field-level validation under 100ms
 */
export const validateEmailTemplateField = <T extends keyof CreateEmailTemplateForm>(
  fieldName: T,
  value: CreateEmailTemplateForm[T],
  schema = createEmailTemplateSchema
): { isValid: boolean; error?: string } => {
  try {
    const fieldSchema = schema.shape[fieldName];
    if (!fieldSchema) {
      return { isValid: true };
    }

    fieldSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Validation error',
      };
    }
    return { isValid: false, error: 'Unknown validation error' };
  }
};

/**
 * Utility function for async validation (e.g., unique name checking)
 * Returns a Promise for integration with React Hook Form async validation
 */
export const validateEmailTemplateNameUnique = async (
  name: string,
  excludeId?: number
): Promise<{ isValid: boolean; error?: string }> => {
  // This would typically call an API to check uniqueness
  // For now, return a mock implementation
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock validation - in real implementation, this would call the API
      const isValid = !['duplicate', 'reserved', 'system'].includes(name.toLowerCase());
      resolve({
        isValid,
        error: isValid ? undefined : 'Template name already exists',
      });
    }, 50); // Keep under 100ms performance requirement
  });
};

// Export custom validators for external use
export const customValidators = {
  validateEmailField,
  validateTemplateContent,
  validateHtmlContent,
  validateEmailTemplateNameUnique,
};

// Export error message constants for internationalization
export { EMAIL_TEMPLATE_VALIDATION_ERRORS };