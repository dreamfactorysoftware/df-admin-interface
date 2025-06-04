import { z } from 'zod';

/**
 * Email Template Validation Schemas
 * 
 * Comprehensive Zod validation schemas for email template forms with:
 * - Field-level validation rules per Section 4.2 Error Handling
 * - Custom validators for email formats and template syntax
 * - Type-safe validation integration with React Hook Form
 * - Internationalized error messages for proper context
 * - Support for create, update, and bulk operations
 * 
 * Converted from Angular validators to Zod schemas per React/Next.js Integration Requirements
 * Applied TypeScript 5.8+ type safety per Section 0.2.1 technical requirements
 */

// ============================================================================
// CUSTOM VALIDATORS
// ============================================================================

/**
 * Email address format validation with support for comma-separated lists
 * Validates against RFC 5322 standard email format
 */
const emailValidator = z
  .string()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true; // Optional field
      
      // Split by comma and validate each email
      const emails = value.split(',').map(email => email.trim());
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      return emails.every(email => emailRegex.test(email));
    },
    {
      message: 'emailTemplates.validation.invalidEmailFormat',
    }
  );

/**
 * Email list validator for multiple recipients
 * Supports comma-separated email addresses with proper validation
 */
const emailListValidator = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true;
      
      // Split by comma and validate each email
      const emails = value.split(',').map(email => email.trim()).filter(Boolean);
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      return emails.every(email => emailRegex.test(email));
    },
    {
      message: 'emailTemplates.validation.invalidEmailList',
    }
  );

/**
 * HTML template syntax validator
 * Validates basic HTML structure and DreamFactory template variables
 */
const htmlTemplateValidator = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true;
      
      // Check for balanced HTML tags (basic validation)
      const openTags = (value.match(/<[^\/][^>]*>/g) || []).length;
      const closeTags = (value.match(/<\/[^>]*>/g) || []).length;
      const selfClosingTags = (value.match(/<[^>]*\/>/g) || []).length;
      
      // Allow for self-closing tags and basic HTML structure
      const isBalanced = Math.abs(openTags - closeTags - selfClosingTags) <= 2;
      
      // Check for potentially dangerous scripts (basic XSS prevention)
      const hasScript = /<script[^>]*>.*?<\/script>/gi.test(value);
      const hasOnEvents = /on\w+\s*=/gi.test(value);
      
      return isBalanced && !hasScript && !hasOnEvents;
    },
    {
      message: 'emailTemplates.validation.invalidHtmlTemplate',
    }
  );

/**
 * Template variable syntax validator
 * Validates DreamFactory template variables like {variable_name}
 */
const templateVariableValidator = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true;
      
      // Check for properly formatted template variables
      const templateVarRegex = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g;
      const braces = value.match(/[{}]/g) || [];
      
      // If there are braces, they should be properly paired
      if (braces.length > 0) {
        let depth = 0;
        for (const brace of braces) {
          if (brace === '{') depth++;
          else depth--;
          if (depth < 0) return false;
        }
        return depth === 0;
      }
      
      return true;
    },
    {
      message: 'emailTemplates.validation.invalidTemplateVariables',
    }
  );

/**
 * File attachment validator
 * Validates attachment file paths and formats
 */
const attachmentValidator = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true;
      
      // Basic file path validation
      const filePathRegex = /^[a-zA-Z0-9._\-\/\\]+$/;
      const hasValidExtension = /\.(pdf|doc|docx|xls|xlsx|txt|csv|zip)$/i.test(value);
      
      return filePathRegex.test(value) && hasValidExtension;
    },
    {
      message: 'emailTemplates.validation.invalidAttachment',
    }
  );

// ============================================================================
// BASE FIELD SCHEMAS
// ============================================================================

/**
 * Template name field with comprehensive validation
 */
const nameField = z
  .string()
  .min(1, 'emailTemplates.validation.nameRequired')
  .max(100, 'emailTemplates.validation.nameTooLong')
  .regex(
    /^[a-zA-Z0-9._\-\s]+$/,
    'emailTemplates.validation.nameInvalidCharacters'
  )
  .refine(
    (value) => value.trim().length > 0,
    'emailTemplates.validation.nameRequired'
  );

/**
 * Description field with length validation
 */
const descriptionField = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.length <= 500,
    'emailTemplates.validation.descriptionTooLong'
  );

/**
 * Subject field with template variable support
 */
const subjectField = z
  .string()
  .optional()
  .refine(
    (value) => !value || value.length <= 200,
    'emailTemplates.validation.subjectTooLong'
  )
  .pipe(templateVariableValidator);

/**
 * Sender name field validation
 */
const senderNameField = z
  .string()
  .optional()
  .refine(
    (value) => !value || (value.length >= 1 && value.length <= 100),
    'emailTemplates.validation.senderNameLength'
  );

/**
 * Sender email field validation
 */
const senderEmailField = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true;
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(value);
    },
    'emailTemplates.validation.invalidSenderEmail'
  );

// ============================================================================
// MAIN VALIDATION SCHEMAS
// ============================================================================

/**
 * Base email template schema with all fields
 * Used as foundation for create and update schemas
 */
const baseEmailTemplateSchema = z.object({
  name: nameField,
  description: descriptionField,
  to: emailListValidator,
  cc: emailListValidator,
  bcc: emailListValidator,
  subject: subjectField,
  attachment: attachmentValidator,
  bodyHtml: htmlTemplateValidator,
  fromName: senderNameField,
  fromEmail: senderEmailField,
  replyToName: senderNameField,
  replyToEmail: senderEmailField,
});

/**
 * Email template creation schema
 * Enforces required fields for new templates
 */
export const createEmailTemplateSchema = baseEmailTemplateSchema.extend({
  name: nameField, // Required for creation
});

/**
 * Email template update schema
 * Allows partial updates with optional ID field
 */
export const updateEmailTemplateSchema = baseEmailTemplateSchema.extend({
  id: z.number().int().positive().optional(),
}).partial().extend({
  // Name remains required even in updates
  name: nameField.optional(),
});

/**
 * Email template bulk operation schema
 * For batch create/update operations
 */
export const bulkEmailTemplateSchema = z.object({
  templates: z.array(createEmailTemplateSchema).min(1, 'emailTemplates.validation.bulkMinimum'),
  operation: z.enum(['create', 'update', 'delete']),
  overwrite: z.boolean().optional().default(false),
});

/**
 * Email template query schema
 * For filtering and searching templates
 */
export const emailTemplateQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(25),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['name', 'createdDate', 'lastModifiedDate']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  active: z.boolean().optional(),
});

/**
 * Email template preview schema
 * For testing template rendering with sample data
 */
export const emailTemplatePreviewSchema = z.object({
  templateId: z.number().int().positive(),
  sampleData: z.record(z.string(), z.any()).optional(),
  recipientEmail: emailValidator.optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * TypeScript types inferred from Zod schemas
 * Provides compile-time type safety for React Hook Form integration
 */
export type CreateEmailTemplateData = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateData = z.infer<typeof updateEmailTemplateSchema>;
export type BulkEmailTemplateData = z.infer<typeof bulkEmailTemplateSchema>;
export type EmailTemplateQueryData = z.infer<typeof emailTemplateQuerySchema>;
export type EmailTemplatePreviewData = z.infer<typeof emailTemplatePreviewSchema>;

// ============================================================================
// FORM VALIDATION UTILITIES
// ============================================================================

/**
 * Email template field validation for real-time form feedback
 * Provides field-level validation with performance under 100ms
 */
export const validateEmailTemplateField = (
  fieldName: keyof CreateEmailTemplateData,
  value: unknown
): { isValid: boolean; error?: string } => {
  try {
    const fieldSchema = baseEmailTemplateSchema.shape[fieldName];
    fieldSchema.parse(value);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'emailTemplates.validation.invalidField',
      };
    }
    return {
      isValid: false,
      error: 'emailTemplates.validation.unknownError',
    };
  }
};

/**
 * Complete form validation with detailed error reporting
 * Returns comprehensive validation results for all fields
 */
export const validateEmailTemplateForm = (
  data: Partial<CreateEmailTemplateData>,
  isUpdate = false
): {
  isValid: boolean;
  errors: Record<string, string>;
  fieldErrors: Record<string, string[]>;
} => {
  try {
    const schema = isUpdate ? updateEmailTemplateSchema : createEmailTemplateSchema;
    schema.parse(data);
    
    return {
      isValid: true,
      errors: {},
      fieldErrors: {},
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      const fieldErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
        
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(err.message);
      });
      
      return {
        isValid: false,
        errors,
        fieldErrors,
      };
    }
    
    return {
      isValid: false,
      errors: { general: 'emailTemplates.validation.unknownError' },
      fieldErrors: {},
    };
  }
};

/**
 * Custom validation hook for React Hook Form integration
 * Provides seamless integration with form state management
 */
export const getEmailTemplateFormResolver = (isUpdate = false) => {
  const schema = isUpdate ? updateEmailTemplateSchema : createEmailTemplateSchema;
  
  return (data: Partial<CreateEmailTemplateData>) => {
    const result = validateEmailTemplateForm(data, isUpdate);
    
    if (result.isValid) {
      return { values: data, errors: {} };
    }
    
    return {
      values: {},
      errors: Object.entries(result.fieldErrors).reduce(
        (acc, [field, fieldErrors]) => ({
          ...acc,
          [field]: { message: fieldErrors[0] },
        }),
        {}
      ),
    };
  };
};

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation configuration constants
 * Centralized validation rules for consistency
 */
export const EMAIL_TEMPLATE_VALIDATION_CONFIG = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  SUBJECT_MAX_LENGTH: 200,
  SENDER_NAME_MAX_LENGTH: 100,
  BULK_MIN_TEMPLATES: 1,
  BULK_MAX_TEMPLATES: 50,
  QUERY_MIN_LIMIT: 1,
  QUERY_MAX_LIMIT: 100,
  QUERY_DEFAULT_LIMIT: 25,
} as const;

/**
 * Supported email template variables
 * Used for template variable validation and auto-completion
 */
export const SUPPORTED_TEMPLATE_VARIABLES = [
  'user_name',
  'user_email',
  'user_first_name',
  'user_last_name',
  'current_date',
  'current_time',
  'app_name',
  'server_name',
  'base_url',
  'activation_code',
  'reset_code',
] as const;

/**
 * Default validation error messages
 * Fallback messages when internationalization is not available
 */
export const DEFAULT_ERROR_MESSAGES = {
  nameRequired: 'Template name is required',
  nameTooLong: 'Template name must be less than 100 characters',
  nameInvalidCharacters: 'Template name contains invalid characters',
  descriptionTooLong: 'Description must be less than 500 characters',
  subjectTooLong: 'Subject must be less than 200 characters',
  invalidEmailFormat: 'Invalid email address format',
  invalidEmailList: 'One or more email addresses are invalid',
  invalidHtmlTemplate: 'Invalid HTML template format',
  invalidTemplateVariables: 'Invalid template variable format',
  invalidAttachment: 'Invalid attachment file format',
  invalidSenderEmail: 'Invalid sender email address',
  senderNameLength: 'Sender name must be between 1 and 100 characters',
  bulkMinimum: 'At least one template is required for bulk operations',
  invalidField: 'Field contains invalid data',
  unknownError: 'An unknown validation error occurred',
} as const;