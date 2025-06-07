/**
 * Email Template Management Types
 * 
 * Comprehensive type definitions for email template administration and management.
 * Maintains full API compatibility with DreamFactory backend while supporting 
 * React component patterns for template administration.
 * 
 * Features:
 * - Full API compatibility with existing DreamFactory email template endpoints
 * - React Hook Form integration patterns for form management
 * - Zod schema validation support for comprehensive input validation
 * - SWR/React Query data fetching patterns with intelligent caching
 * - WCAG 2.1 AA accessibility compliance support
 * - Next.js API route compatibility for server-side operations
 * 
 * @fileoverview Email template type definitions for React-based admin interface
 * @version 1.0.0
 * @since 2024-12-19
 */

// =============================================================================
// CORE EMAIL TEMPLATE INTERFACES
// =============================================================================

/**
 * Complete email template entity with all fields from DreamFactory backend.
 * 
 * Represents a full email template record as returned from API endpoints.
 * Maintains exact field compatibility with existing DreamFactory REST API
 * responses from `/api/v2/system/email_template` endpoints.
 * 
 * React Usage:
 * - Use with React Query/SWR for data fetching and caching
 * - Integrate with React Hook Form for template editing
 * - Support for React component state management patterns
 * 
 * API Compatibility:
 * - GET /api/v2/system/email_template/{id} response format
 * - Maintains all audit fields and metadata from backend
 * - Preserves exact field names and data types
 */
export interface EmailTemplate {
  /** Unique identifier for the email template */
  id: number;
  
  /** Template name - must be unique across all templates */
  name: string;
  
  /** Optional template description for administrative purposes */
  description?: string;
  
  /** Default recipient email addresses (comma-separated) */
  to?: string;
  
  /** Default CC recipient email addresses (comma-separated) */
  cc?: string;
  
  /** Default BCC recipient email addresses (comma-separated) */
  bcc?: string;
  
  /** Email subject line template with placeholder support */
  subject?: string;
  
  /** File attachment paths or URLs for template attachments */
  attachment?: string;
  
  /** Plain text version of email body with placeholder support */
  bodyText?: string;
  
  /** HTML version of email body with rich formatting and placeholders */
  bodyHtml?: string;
  
  /** Sender display name for outgoing emails */
  fromName?: string;
  
  /** Sender email address for outgoing emails */
  fromEmail?: string;
  
  /** Reply-to display name for email responses */
  replyToName?: string;
  
  /** Reply-to email address for email responses */
  replyToEmail?: string;
  
  /** Default placeholder values and configuration settings */
  defaults?: Record<string, unknown>;
  
  /** ISO timestamp when template was created */
  createdDate: string;
  
  /** ISO timestamp when template was last modified */
  lastModifiedDate: string;
  
  /** User ID who created the template */
  createdById?: number;
  
  /** User ID who last modified the template */
  lastModifiedById?: number;
}

/**
 * Simplified email template data for list/table displays.
 * 
 * Lightweight representation used in template listing pages, data tables,
 * and dropdown selectors. Optimized for React component rendering performance
 * and reduced data transfer.
 * 
 * React Usage:
 * - Table/list components with TanStack Virtual for large datasets
 * - Dropdown/select components for template selection
 * - Card-based template browsers and quick previews
 * 
 * API Compatibility:
 * - GET /api/v2/system/email_template response format for lists
 * - Maintains consistent field naming with full EmailTemplate interface
 */
export interface EmailTemplateRow {
  /** Unique identifier for the email template */
  id: number;
  
  /** Template name for display in lists and selectors */
  name: string;
  
  /** Optional description for template identification */
  description?: string;
}

/**
 * Email template creation and update payload structure.
 * 
 * Defines the request body structure for creating new templates or updating
 * existing ones. Excludes server-managed fields like ID and audit timestamps.
 * Optimized for React Hook Form integration and validation.
 * 
 * React Usage:
 * - React Hook Form data structure for template forms
 * - Zod schema validation for comprehensive input validation
 * - Form state management with React component patterns
 * 
 * API Compatibility:
 * - POST /api/v2/system/email_template request body format
 * - PUT/PATCH /api/v2/system/email_template/{id} request body format
 * - Excludes read-only fields managed by server
 */
export interface EmailTemplatePayload {
  /** Template name - must be unique and non-empty */
  name: string;
  
  /** Optional template description for administrative purposes */
  description?: string;
  
  /** Default recipient email addresses (comma-separated) */
  to?: string;
  
  /** Default CC recipient email addresses (comma-separated) */
  cc?: string;
  
  /** Default BCC recipient email addresses (comma-separated) */
  bcc?: string;
  
  /** Email subject line template with placeholder support */
  subject?: string;
  
  /** File attachment paths or URLs for template attachments */
  attachment?: string;
  
  /** HTML version of email body with rich formatting and placeholders */
  bodyHtml?: string;
  
  /** Sender display name for outgoing emails */
  fromName?: string;
  
  /** Sender email address for outgoing emails */
  fromEmail?: string;
  
  /** Reply-to display name for email responses */
  replyToName?: string;
  
  /** Reply-to email address for email responses */
  replyToEmail?: string;
}

// =============================================================================
// REACT COMPONENT INTEGRATION TYPES
// =============================================================================

/**
 * React Hook Form integration interface for email template forms.
 * 
 * Extends EmailTemplatePayload with React-specific form handling patterns,
 * validation states, and component lifecycle management. Designed for optimal
 * integration with React Hook Form and Zod validation schemas.
 * 
 * Features:
 * - Real-time validation feedback for form fields
 * - WYSIWYG editor integration for HTML body editing
 * - Placeholder variable management and validation
 * - Email address validation and formatting
 * - Template preview and testing capabilities
 */
export interface EmailTemplateFormData extends EmailTemplatePayload {
  /** Form validation state for individual fields */
  _fieldErrors?: Record<keyof EmailTemplatePayload, string>;
  
  /** Overall form validation state */
  _isValid?: boolean;
  
  /** Form submission state for UI feedback */
  _isSubmitting?: boolean;
  
  /** Form dirty state for unsaved changes detection */
  _isDirty?: boolean;
  
  /** Template preview state for email preview functionality */
  _previewData?: EmailTemplatePreviewData;
}

/**
 * Email template preview configuration and data.
 * 
 * Supports real-time template preview functionality with placeholder
 * substitution and rendering validation. Enables users to test templates
 * before saving or sending.
 */
export interface EmailTemplatePreviewData {
  /** Sample placeholder values for preview rendering */
  placeholders: Record<string, string>;
  
  /** Rendered subject line with placeholders replaced */
  renderedSubject: string;
  
  /** Rendered HTML body with placeholders replaced */
  renderedBodyHtml: string;
  
  /** Rendered plain text body with placeholders replaced */
  renderedBodyText?: string;
  
  /** Preview generation timestamp */
  generatedAt: string;
  
  /** Preview validation errors or warnings */
  validationIssues?: EmailTemplateValidationIssue[];
}

/**
 * Template validation issue for preview and form validation.
 * 
 * Provides detailed feedback on template content validation,
 * placeholder usage, and email formatting compliance.
 */
export interface EmailTemplateValidationIssue {
  /** Issue severity level */
  severity: 'error' | 'warning' | 'info';
  
  /** Field or area where issue was detected */
  field: keyof EmailTemplatePayload | 'preview' | 'placeholders';
  
  /** Human-readable issue description */
  message: string;
  
  /** Detailed technical description for troubleshooting */
  details?: string;
  
  /** Suggested resolution or fix */
  suggestion?: string;
}

// =============================================================================
// DATA FETCHING AND STATE MANAGEMENT TYPES
// =============================================================================

/**
 * SWR/React Query configuration options for email template data fetching.
 * 
 * Optimized configuration for intelligent caching, background synchronization,
 * and efficient data management patterns for email template operations.
 */
export interface EmailTemplateQueryOptions {
  /** Cache time to live in milliseconds (default: 5 minutes) */
  staleTime?: number;
  
  /** Background refetch interval in milliseconds */
  refetchInterval?: number;
  
  /** Enable background refetching when window gains focus */
  refetchOnWindowFocus?: boolean;
  
  /** Enable background refetching when network reconnects */
  refetchOnReconnect?: boolean;
  
  /** Number of retry attempts for failed requests */
  retry?: number;
  
  /** Retry delay strategy configuration */
  retryDelay?: (attemptIndex: number) => number;
  
  /** Enable optimistic updates for mutations */
  optimisticUpdates?: boolean;
}

/**
 * Email template list query parameters and filtering options.
 * 
 * Supports efficient pagination, search, and filtering for large
 * template collections with React Query integration.
 */
export interface EmailTemplateListParams {
  /** Number of templates per page (default: 25) */
  limit?: number;
  
  /** Page offset for pagination */
  offset?: number;
  
  /** Search term for template name or description */
  search?: string;
  
  /** Sort field for result ordering */
  sort?: keyof EmailTemplateRow;
  
  /** Sort direction (ascending or descending) */
  order?: 'asc' | 'desc';
  
  /** Include template usage statistics in response */
  includeStats?: boolean;
  
  /** Filter by creation date range */
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Email template list response with metadata.
 * 
 * Complete response structure for template listing API calls,
 * including pagination metadata and query performance information.
 */
export interface EmailTemplateListResponse {
  /** Array of email template records */
  data: EmailTemplateRow[];
  
  /** Total number of templates matching query */
  total: number;
  
  /** Number of templates in current page */
  count: number;
  
  /** Current page offset */
  offset: number;
  
  /** Page size used for query */
  limit: number;
  
  /** Query execution time in milliseconds */
  executionTime?: number;
  
  /** Additional metadata for advanced features */
  meta?: {
    /** Available placeholder variables across all templates */
    availablePlaceholders?: string[];
    
    /** Template usage statistics */
    usageStats?: Record<number, number>;
    
    /** Recently modified template IDs */
    recentlyModified?: number[];
  };
}

// =============================================================================
// MUTATION AND UPDATE TYPES
// =============================================================================

/**
 * Email template mutation options for create, update, and delete operations.
 * 
 * Provides comprehensive configuration for optimistic updates, error handling,
 * and cache invalidation strategies with React Query mutations.
 */
export interface EmailTemplateMutationOptions {
  /** Enable optimistic updates for immediate UI feedback */
  optimisticUpdate?: boolean;
  
  /** Invalidate related queries after successful mutation */
  invalidateQueries?: string[];
  
  /** Custom success callback for additional operations */
  onSuccess?: (data: EmailTemplate) => void;
  
  /** Custom error callback for error handling */
  onError?: (error: Error) => void;
  
  /** Custom settlement callback (runs after success or error) */
  onSettled?: (data?: EmailTemplate, error?: Error) => void;
  
  /** Retry failed mutations automatically */
  retry?: boolean;
  
  /** Maximum retry attempts for failed mutations */
  retryAttempts?: number;
}

/**
 * Email template bulk operation payload for batch updates.
 * 
 * Supports efficient batch operations for multiple templates,
 * including bulk updates, deletions, and status changes.
 */
export interface EmailTemplateBulkOperation {
  /** Operation type to perform */
  operation: 'update' | 'delete' | 'export' | 'duplicate';
  
  /** Template IDs to operate on */
  templateIds: number[];
  
  /** Update payload for bulk update operations */
  updateData?: Partial<EmailTemplatePayload>;
  
  /** Options for bulk operation execution */
  options?: {
    /** Continue operation if individual items fail */
    continueOnError?: boolean;
    
    /** Maximum batch size for processing */
    batchSize?: number;
    
    /** Progress callback for long-running operations */
    onProgress?: (completed: number, total: number) => void;
  };
}

/**
 * Email template bulk operation result with detailed feedback.
 * 
 * Provides comprehensive results for batch operations including
 * success/failure status for individual items and aggregate statistics.
 */
export interface EmailTemplateBulkResult {
  /** Overall operation success status */
  success: boolean;
  
  /** Number of successfully processed items */
  successCount: number;
  
  /** Number of failed items */
  errorCount: number;
  
  /** Total number of items processed */
  totalCount: number;
  
  /** Detailed results for individual items */
  results: Array<{
    /** Template ID that was processed */
    templateId: number;
    
    /** Operation success status for this item */
    success: boolean;
    
    /** Error message if operation failed */
    error?: string;
    
    /** Updated template data if operation succeeded */
    data?: EmailTemplate;
  }>;
  
  /** Operation execution time in milliseconds */
  executionTime: number;
}

// =============================================================================
// ACCESSIBILITY AND UI INTEGRATION TYPES
// =============================================================================

/**
 * Email template accessibility configuration for WCAG 2.1 AA compliance.
 * 
 * Ensures email template management interfaces meet accessibility standards
 * with proper ARIA labeling, keyboard navigation, and screen reader support.
 */
export interface EmailTemplateAccessibilityConfig {
  /** ARIA labels for form fields and actions */
  ariaLabels: {
    nameField: string;
    descriptionField: string;
    subjectField: string;
    bodyField: string;
    previewButton: string;
    saveButton: string;
    deleteButton: string;
  };
  
  /** Screen reader announcements for dynamic content */
  announcements: {
    templateSaved: string;
    templateDeleted: string;
    validationError: string;
    previewGenerated: string;
  };
  
  /** Keyboard navigation configuration */
  keyboardNavigation: {
    /** Enable keyboard shortcuts for common actions */
    enableShortcuts: boolean;
    
    /** Keyboard shortcut mappings */
    shortcuts: Record<string, string>;
  };
  
  /** High contrast mode support */
  highContrast: {
    /** Enable high contrast color scheme */
    enabled: boolean;
    
    /** Custom color mapping for high contrast mode */
    colorScheme?: Record<string, string>;
  };
}

/**
 * Email template UI component configuration and theming.
 * 
 * Supports consistent theming and component configuration across
 * all email template management interfaces with Tailwind CSS integration.
 */
export interface EmailTemplateUIConfig {
  /** Tailwind CSS theme configuration */
  theme: {
    /** Primary color scheme for template management */
    primary: string;
    
    /** Secondary color scheme for supporting elements */
    secondary: string;
    
    /** Success state colors for validation feedback */
    success: string;
    
    /** Error state colors for validation feedback */
    error: string;
    
    /** Warning state colors for validation feedback */
    warning: string;
  };
  
  /** Component size variants */
  sizes: {
    /** Small size variant for compact interfaces */
    small: string;
    
    /** Medium size variant for standard interfaces */
    medium: string;
    
    /** Large size variant for detailed interfaces */
    large: string;
  };
  
  /** Animation and transition configuration */
  animations: {
    /** Enable smooth transitions for state changes */
    enableTransitions: boolean;
    
    /** Animation duration in milliseconds */
    duration: number;
    
    /** Easing function for transitions */
    easing: string;
  };
  
  /** Responsive breakpoints for different screen sizes */
  breakpoints: {
    /** Mobile breakpoint configuration */
    mobile: string;
    
    /** Tablet breakpoint configuration */
    tablet: string;
    
    /** Desktop breakpoint configuration */
    desktop: string;
  };
}

// =============================================================================
// TYPE UNIONS AND UTILITY TYPES
// =============================================================================

/**
 * Union type for all email template-related entities.
 * 
 * Provides type safety for functions and components that work
 * with different email template data structures.
 */
export type EmailTemplateEntity = EmailTemplate | EmailTemplateRow | EmailTemplatePayload;

/**
 * Email template field names for form validation and field references.
 * 
 * Ensures type safety when referencing email template fields in
 * validation schemas, form configurations, and component props.
 */
export type EmailTemplateField = keyof EmailTemplatePayload;

/**
 * Email template operation types for audit logging and permission checks.
 * 
 * Defines all possible operations that can be performed on email templates
 * for comprehensive audit trails and role-based access control.
 */
export type EmailTemplateOperation = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'list'
  | 'preview'
  | 'send'
  | 'export'
  | 'import'
  | 'duplicate'
  | 'bulk_update'
  | 'bulk_delete';

/**
 * Email template status for workflow and approval processes.
 * 
 * Supports template lifecycle management with draft, review,
 * and approval workflows for enterprise template governance.
 */
export type EmailTemplateStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'active'
  | 'archived'
  | 'deprecated';

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Default export containing all email template types for convenience.
 * 
 * Provides a single import point for all email template-related types
 * when comprehensive type coverage is needed.
 */
export default {
  // Core interfaces
  EmailTemplate,
  EmailTemplateRow,
  EmailTemplatePayload,
  
  // React integration types
  EmailTemplateFormData,
  EmailTemplatePreviewData,
  EmailTemplateValidationIssue,
  
  // Data fetching types
  EmailTemplateQueryOptions,
  EmailTemplateListParams,
  EmailTemplateListResponse,
  
  // Mutation types
  EmailTemplateMutationOptions,
  EmailTemplateBulkOperation,
  EmailTemplateBulkResult,
  
  // UI and accessibility types
  EmailTemplateAccessibilityConfig,
  EmailTemplateUIConfig,
  
  // Utility types
  EmailTemplateEntity,
  EmailTemplateField,
  EmailTemplateOperation,
  EmailTemplateStatus,
} as const;