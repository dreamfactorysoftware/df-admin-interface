/**
 * Email Template Type Definitions
 * 
 * Comprehensive type definitions for DreamFactory email template management.
 * Provides interfaces for email template configuration, content management,
 * and template validation with support for various email types and formats.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

/**
 * Base email template interface
 */
export interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
  defaults?: EmailTemplateDefaults;
  is_active: boolean;
  created_date: string;
  last_modified_date: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

/**
 * Email template defaults for common placeholders
 */
export interface EmailTemplateDefaults {
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
  subject_prefix?: string;
  body_wrapper?: string;
}

/**
 * Email template creation/update payload
 */
export interface EmailTemplateRequest {
  name: string;
  description?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text?: string;
  body_html?: string;
  from_name?: string;
  from_email?: string;
  reply_to_name?: string;
  reply_to_email?: string;
  defaults?: EmailTemplateDefaults;
  is_active?: boolean;
}

/**
 * Email template validation interface
 */
export interface EmailTemplateValidation {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern?: string;
  };
  subject: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  email: {
    pattern: string;
    message: string;
  };
  body: {
    minLength: number;
    requiresContent: boolean;
  };
}

/**
 * Email template preview interface
 */
export interface EmailTemplatePreview {
  rendered_subject: string;
  rendered_body_text?: string;
  rendered_body_html?: string;
  variables_used: string[];
  missing_variables: string[];
}

/**
 * Email template test interface
 */
export interface EmailTemplateTest {
  template_id: number;
  test_email: string;
  test_data?: Record<string, any>;
  send_actual_email?: boolean;
}

/**
 * Email template test result
 */
export interface EmailTemplateTestResult {
  success: boolean;
  message: string;
  preview?: EmailTemplatePreview;
  sent_email?: {
    to: string;
    subject: string;
    timestamp: string;
  };
  errors?: string[];
}

/**
 * Email template list query parameters
 */
export interface EmailTemplateQueryParams {
  filter?: string;
  sort?: string;
  fields?: string;
  limit?: number;
  offset?: number;
  include_count?: boolean;
  include_inactive?: boolean;
}

/**
 * Email template form field types
 */
export type EmailTemplateFormField = 
  | 'name'
  | 'description'
  | 'to'
  | 'cc'
  | 'bcc'
  | 'subject'
  | 'body_text'
  | 'body_html'
  | 'from_name'
  | 'from_email'
  | 'reply_to_name'
  | 'reply_to_email'
  | 'is_active';

/**
 * Email template content types
 */
export type EmailContentType = 'text' | 'html' | 'both';

/**
 * Email template variables for dynamic content
 */
export interface EmailTemplateVariable {
  name: string;
  description: string;
  example?: string;
  required?: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
}

/**
 * Email template category for organization
 */
export interface EmailTemplateCategory {
  id: string;
  name: string;
  description?: string;
  templates?: EmailTemplate[];
}

/**
 * System email template types (predefined)
 */
export type SystemEmailTemplateType = 
  | 'user_registration'
  | 'password_reset'
  | 'email_verification'
  | 'user_invite'
  | 'password_changed'
  | 'account_locked'
  | 'login_notification'
  | 'system_alert';

/**
 * Email template settings and configuration
 */
export interface EmailTemplateSettings {
  default_from_name: string;
  default_from_email: string;
  default_reply_to_name?: string;
  default_reply_to_email?: string;
  max_recipients: number;
  allow_html: boolean;
  require_authentication: boolean;
  enable_tracking: boolean;
  enable_unsubscribe: boolean;
}

/**
 * Email template statistics for monitoring
 */
export interface EmailTemplateStats {
  template_id: number;
  total_sent: number;
  total_opened?: number;
  total_clicked?: number;
  total_bounced?: number;
  last_sent?: string;
  success_rate: number;
}

/**
 * Email template export/import formats
 */
export type EmailTemplateExportFormat = 'json' | 'csv' | 'html' | 'text';

/**
 * Email template export/import interface
 */
export interface EmailTemplateExport {
  templates: EmailTemplate[];
  metadata: {
    exported_at: string;
    exported_by: string;
    total_count: number;
    format: EmailTemplateExportFormat;
  };
}

/**
 * Email template error types for validation and operations
 */
export interface EmailTemplateError {
  field?: EmailTemplateFormField;
  message: string;
  code: string;
  details?: any;
}

/**
 * Email template operation result
 */
export interface EmailTemplateOperationResult {
  success: boolean;
  data?: EmailTemplate;
  message?: string;
  errors?: EmailTemplateError[];
}

/**
 * API response types for email templates
 */
export interface EmailTemplateListResponse {
  resource: EmailTemplate[];
  meta: {
    count: number;
  };
}

export interface EmailTemplateResponse {
  resource: EmailTemplate[];
}

export interface EmailTemplateCreateResponse {
  resource: Array<{ id: number }>;
}

export interface EmailTemplateUpdateResponse {
  id: number;
}

/**
 * Email template hook configuration
 */
export interface EmailTemplateHookConfig {
  enableOptimisticUpdates?: boolean;
  enableCache?: boolean;
  cacheTime?: number;
  staleTime?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Export all types for external use
 */
export type {
  EmailTemplate,
  EmailTemplateRequest,
  EmailTemplateValidation,
  EmailTemplatePreview,
  EmailTemplateTest,
  EmailTemplateTestResult,
  EmailTemplateQueryParams,
  EmailTemplateFormField,
  EmailContentType,
  EmailTemplateVariable,
  EmailTemplateCategory,
  SystemEmailTemplateType,
  EmailTemplateSettings,
  EmailTemplateStats,
  EmailTemplateExportFormat,
  EmailTemplateExport,
  EmailTemplateError,
  EmailTemplateOperationResult,
  EmailTemplateListResponse,
  EmailTemplateResponse,
  EmailTemplateCreateResponse,
  EmailTemplateUpdateResponse,
  EmailTemplateHookConfig,
  EmailTemplateDefaults
};