/**
 * Rate Limiting Types and Interfaces for React/Next.js Admin Interface
 * 
 * Provides comprehensive type definitions for rate limiting management using React Hook Form 7.52+
 * with Zod schema validation, React Query for server state management, and enhanced TypeScript
 * interfaces for React component props and state management.
 * 
 * Supports DreamFactory's rate limiting functionality with real-time validation under 100ms,
 * optimistic updates, and comprehensive error handling per Section 4.2 requirements.
 * 
 * @author DreamFactory Admin Interface Team  
 * @version React 19/Next.js 15.1 Migration
 * @since 2024-12-19
 */

import { z } from 'zod'
import { 
  UseMutationResult, 
  UseQueryResult,
  MutationFunction,
  QueryFunction,
  InvalidateQueryFilters
} from '@tanstack/react-query'
import { UseFormReturn, FieldErrors } from 'react-hook-form'
import { 
  ApiListResponse, 
  ApiCreateResponse, 
  ApiUpdateResponse, 
  ApiDeleteResponse, 
  ApiErrorResponse,
  PaginationMeta,
  ApiRequestOptions,
  MutationConfig,
  QueryConfig
} from '@/types/api'
import { 
  FormState, 
  FormConfig, 
  FieldValidationConfig,
  DatabaseType 
} from '@/types/forms'

// =============================================================================
// CORE LIMIT DATA TYPES
// =============================================================================

/**
 * Enhanced rate limit table row data with comprehensive type safety
 * 
 * Represents a single rate limit configuration in the DreamFactory system.
 * Includes support for user-based, service-based, and role-based limits
 * with flexible rate counter configurations.
 * 
 * @interface LimitTableRowData
 */
export interface LimitTableRowData {
  /** Unique identifier for the rate limit configuration */
  id: number
  /** Human-readable name for the rate limit rule */
  name: string
  /** Type of rate limiting applied - see LimitType enum */
  limitType: LimitType
  /** Rate specification (e.g., "100/minute", "1000/hour") */
  limitRate: string
  /** Counter type for rate tracking - see LimitCounter enum */
  limitCounter: LimitCounter
  /** Associated user ID (null for non-user-specific limits) */
  user: number | null
  /** Associated service ID (null for non-service-specific limits) */
  service: number | null
  /** Associated role ID (null for non-role-specific limits) */
  role: number | null
  /** Whether the rate limit is currently active */
  active: boolean
  /** Timestamp when the limit was created (ISO 8601) */
  createdAt?: string
  /** Timestamp when the limit was last modified (ISO 8601) */
  updatedAt?: string
  /** User who created this limit configuration */
  createdBy?: string
  /** Additional metadata for the limit configuration */
  metadata?: LimitMetadata
}

/**
 * Rate limit types supported by DreamFactory
 * 
 * Defines the scope and application of rate limiting rules across
 * different dimensions of API access control.
 */
export enum LimitType {
  /** Per-endpoint rate limiting */
  ENDPOINT = 'endpoint',
  /** Per-service rate limiting */
  SERVICE = 'service', 
  /** Per-user rate limiting */
  USER = 'user',
  /** Per-role rate limiting */
  ROLE = 'role',
  /** Global system-wide rate limiting */
  GLOBAL = 'global',
  /** Per-IP address rate limiting */
  IP = 'ip',
  /** Custom rule-based rate limiting */
  CUSTOM = 'custom'
}

/**
 * Rate limit counter types for tracking consumption
 * 
 * Defines how rate limit consumption is measured and tracked
 * across different time windows and reset strategies.
 */
export enum LimitCounter {
  /** Simple request count within time window */
  REQUEST = 'request',
  /** Sliding window request count */
  SLIDING_WINDOW = 'sliding_window',
  /** Fixed window request count with burst allowance */
  FIXED_WINDOW = 'fixed_window',
  /** Token bucket algorithm for bursty traffic */
  TOKEN_BUCKET = 'token_bucket',
  /** Leaky bucket algorithm for rate smoothing */
  LEAKY_BUCKET = 'leaky_bucket',
  /** Bandwidth-based limiting (bytes per second) */
  BANDWIDTH = 'bandwidth'
}

/**
 * Additional metadata for rate limit configurations
 * 
 * Provides extensible configuration options for advanced
 * rate limiting scenarios and monitoring requirements.
 */
export interface LimitMetadata {
  /** Description or notes about this rate limit */
  description?: string
  /** Tags for categorizing and filtering limits */
  tags?: string[]
  /** Priority level for limit enforcement (1-10) */
  priority?: number
  /** Custom headers to include in rate limit responses */
  customHeaders?: Record<string, string>
  /** Webhook URL for limit exceeded notifications */
  webhookUrl?: string
  /** Alert configuration for monitoring */
  alertConfig?: AlertConfiguration
}

/**
 * Alert configuration for rate limit monitoring
 */
export interface AlertConfiguration {
  /** Enable alerts for this rate limit */
  enabled: boolean
  /** Threshold percentage for warnings (0-100) */
  warningThreshold: number
  /** Threshold percentage for critical alerts (0-100) */
  criticalThreshold: number
  /** Email addresses for alert notifications */
  emailAddresses?: string[]
  /** Slack webhook for alert notifications */
  slackWebhook?: string
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for LimitType enum validation
 */
export const LimitTypeSchema = z.nativeEnum(LimitType, {
  errorMap: () => ({ message: 'Please select a valid limit type' })
})

/**
 * Zod schema for LimitCounter enum validation  
 */
export const LimitCounterSchema = z.nativeEnum(LimitCounter, {
  errorMap: () => ({ message: 'Please select a valid counter type' })
})

/**
 * Zod schema for rate limit metadata validation
 */
export const LimitMetadataSchema = z.object({
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  tags: z.array(z.string().min(1).max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  priority: z.number().min(1).max(10).optional(),
  customHeaders: z.record(z.string()).optional(),
  webhookUrl: z.string().url('Must be a valid URL').optional(),
  alertConfig: z.object({
    enabled: z.boolean(),
    warningThreshold: z.number().min(0).max(100),
    criticalThreshold: z.number().min(0).max(100),
    emailAddresses: z.array(z.string().email()).optional(),
    slackWebhook: z.string().url().optional()
  }).optional()
}).strict()

/**
 * Comprehensive Zod schema for rate limit table row data
 * 
 * Provides runtime validation with detailed error messages optimized
 * for React Hook Form integration and real-time validation under 100ms.
 */
export const LimitTableRowDataSchema = z.object({
  id: z.number().int().positive('ID must be a positive integer'),
  name: z.string()
    .min(1, 'Limit name is required')
    .max(100, 'Limit name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  limitType: LimitTypeSchema,
  limitRate: z.string()
    .min(1, 'Rate specification is required')
    .regex(/^\d+\/(second|minute|hour|day)$/, 'Rate must be in format "number/timeunit" (e.g., "100/minute")'),
  limitCounter: LimitCounterSchema,
  user: z.number().int().positive().nullable(),
  service: z.number().int().positive().nullable(), 
  role: z.number().int().positive().nullable(),
  active: z.boolean(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().max(100).optional(),
  metadata: LimitMetadataSchema.optional()
}).strict().refine(
  (data) => {
    // Ensure at least one scope is defined (user, service, or role)
    const hasUserScope = data.user !== null
    const hasServiceScope = data.service !== null
    const hasRoleScope = data.role !== null
    const hasGlobalScope = data.limitType === LimitType.GLOBAL || data.limitType === LimitType.IP
    
    return hasUserScope || hasServiceScope || hasRoleScope || hasGlobalScope
  },
  {
    message: 'Rate limit must specify at least one scope: user, service, role, or be a global/IP limit',
    path: ['user'] // Associate error with user field for UI display
  }
)

// =============================================================================
// FORM DATA TYPES FOR REACT HOOK FORM
// =============================================================================

/**
 * Form data interface for creating new rate limits
 * 
 * Optimized for React Hook Form with enhanced validation and
 * type safety for form field management and submission.
 */
export interface CreateLimitFormData {
  /** Rate limit name - required field */
  name: string
  /** Rate limit type - required selection */
  limitType: LimitType
  /** Rate specification string - required field */
  limitRate: string
  /** Counter mechanism - required selection */
  limitCounter: LimitCounter
  /** Target user ID - optional based on limit type */
  user?: number | null
  /** Target service ID - optional based on limit type */
  service?: number | null
  /** Target role ID - optional based on limit type */
  role?: number | null
  /** Active status - defaults to true */
  active?: boolean
  /** Additional metadata - optional configuration */
  metadata?: Partial<LimitMetadata>
}

/**
 * Form data interface for editing existing rate limits
 * 
 * Extends create form with ID field and supports partial updates
 * while maintaining type safety across all form operations.
 */
export interface EditLimitFormData extends CreateLimitFormData {
  /** Unique identifier for the rate limit being edited */
  id: number
}

/**
 * Zod validation schema for create limit form
 * 
 * Provides comprehensive validation with real-time feedback
 * optimized for React Hook Form integration under 100ms response time.
 */
export const CreateLimitFormSchema = z.object({
  name: z.string()
    .min(1, 'Limit name is required')
    .max(100, 'Limit name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_-\s]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  limitType: LimitTypeSchema,
  limitRate: z.string()
    .min(1, 'Rate specification is required')
    .regex(/^\d+\/(second|minute|hour|day)$/, 'Rate must be in format "number/timeunit" (e.g., "100/minute")')
    .refine(
      (value) => {
        const [rate] = value.split('/')
        const rateNumber = parseInt(rate, 10)
        return rateNumber > 0 && rateNumber <= 1000000
      },
      { message: 'Rate number must be between 1 and 1,000,000' }
    ),
  limitCounter: LimitCounterSchema,
  user: z.number().int().positive().nullable().optional(),
  service: z.number().int().positive().nullable().optional(),
  role: z.number().int().positive().nullable().optional(),
  active: z.boolean().default(true),
  metadata: LimitMetadataSchema.optional()
}).strict().refine(
  (data) => {
    // Conditional validation based on limit type
    if (data.limitType === LimitType.USER && !data.user) {
      return false
    }
    if (data.limitType === LimitType.SERVICE && !data.service) {
      return false
    }
    if (data.limitType === LimitType.ROLE && !data.role) {
      return false
    }
    return true
  },
  {
    message: 'Must specify target ID for user, service, or role-based limits',
    path: ['user']
  }
)

/**
 * Zod validation schema for edit limit form
 * 
 * Extends create schema with ID validation for updates
 * while maintaining all validation rules and constraints.
 */
export const EditLimitFormSchema = CreateLimitFormSchema.extend({
  id: z.number().int().positive('ID must be a positive integer')
})

// =============================================================================
// FORM STATE MANAGEMENT TYPES
// =============================================================================

/**
 * Comprehensive form state for rate limit creation
 * 
 * Provides complete state management for React Hook Form with
 * loading states, error handling, and validation feedback per
 * Section 4.2 error handling requirements.
 */
export interface CreateLimitFormState extends FormState<CreateLimitFormData> {
  /** React Hook Form instance */
  form: UseFormReturn<CreateLimitFormData>
  /** Current form data values */
  values: CreateLimitFormData
  /** Form validation errors with enhanced error information */
  errors: FieldErrors<CreateLimitFormData>
  /** Form submission in progress */
  isSubmitting: boolean
  /** Real-time validation in progress */
  isValidating: boolean
  /** Form has been submitted at least once */
  isSubmitted: boolean
  /** Form has been modified from initial state */
  isDirty: boolean
  /** Form passes all validation rules */
  isValid: boolean
  /** Loading state for async operations (user/service/role lookups) */
  isLoading: boolean
  /** Number of submission attempts */
  submitCount: number
  /** Validation performance metrics */
  validationMetrics: ValidationPerformanceMetrics
}

/**
 * Comprehensive form state for rate limit editing
 * 
 * Extends create form state with additional properties for
 * update operations and optimistic updates management.
 */
export interface EditLimitFormState extends FormState<EditLimitFormData> {
  /** React Hook Form instance */
  form: UseFormReturn<EditLimitFormData>
  /** Current form data values */
  values: EditLimitFormData
  /** Form validation errors with enhanced error information */
  errors: FieldErrors<EditLimitFormData>
  /** Form submission in progress */
  isSubmitting: boolean
  /** Real-time validation in progress */
  isValidating: boolean
  /** Form has been submitted at least once */
  isSubmitted: boolean
  /** Form has been modified from initial state */
  isDirty: boolean
  /** Form passes all validation rules */
  isValid: boolean
  /** Loading state for async operations */
  isLoading: boolean
  /** Number of submission attempts */
  submitCount: number
  /** Original data before editing */
  originalData?: LimitTableRowData
  /** Optimistic update state */
  optimisticUpdate?: Partial<LimitTableRowData>
  /** Validation performance metrics */
  validationMetrics: ValidationPerformanceMetrics
}

/**
 * Validation performance metrics for monitoring
 * 
 * Tracks validation performance to ensure compliance with
 * real-time validation under 100ms requirement.
 */
export interface ValidationPerformanceMetrics {
  /** Average validation time in milliseconds */
  averageValidationTime: number
  /** Maximum validation time recorded */
  maxValidationTime: number
  /** Total number of validations performed */
  validationCount: number
  /** Number of validations that exceeded 100ms threshold */
  slowValidationCount: number
  /** Percentage of validations under 100ms */
  realtimeComplianceRate: number
  /** Last validation timestamp */
  lastValidationTime: Date
}

// =============================================================================
// REACT QUERY TYPES FOR SERVER STATE MANAGEMENT
// =============================================================================

/**
 * React Query query result type for rate limits list
 * 
 * Provides comprehensive type safety for data fetching operations
 * with SWR caching and intelligent synchronization per Section 5.2.
 */
export type LimitsListQueryResult = UseQueryResult<
  ApiListResponse<LimitTableRowData>,
  ApiErrorResponse
>

/**
 * React Query query result type for single rate limit
 * 
 * Supports detailed view and edit operations with optimistic updates
 * and cache invalidation strategies.
 */
export type LimitDetailQueryResult = UseQueryResult<
  LimitTableRowData,
  ApiErrorResponse
>

/**
 * React Query mutation result type for creating rate limits
 * 
 * Handles optimistic updates, error rollback, and cache invalidation
 * with comprehensive error handling and user feedback.
 */
export type CreateLimitMutationResult = UseMutationResult<
  ApiCreateResponse,
  ApiErrorResponse,
  CreateLimitFormData,
  unknown
>

/**
 * React Query mutation result type for updating rate limits
 * 
 * Supports partial updates with optimistic UI updates and
 * automatic cache synchronization across related queries.
 */
export type UpdateLimitMutationResult = UseMutationResult<
  ApiUpdateResponse,
  ApiErrorResponse,
  EditLimitFormData,
  { previousData?: LimitTableRowData }
>

/**
 * React Query mutation result type for deleting rate limits
 * 
 * Handles cascade delete validation, optimistic removal,
 * and rollback on error with user confirmation dialogs.
 */
export type DeleteLimitMutationResult = UseMutationResult<
  ApiDeleteResponse,
  ApiErrorResponse,
  number,
  { previousData?: LimitTableRowData; previousList?: LimitTableRowData[] }
>

/**
 * React Query mutation result type for toggling limit status
 * 
 * Optimized for quick enable/disable operations with immediate
 * UI feedback and automatic revalidation.
 */
export type ToggleLimitMutationResult = UseMutationResult<
  ApiUpdateResponse,
  ApiErrorResponse,
  { id: number; active: boolean },
  { previousData?: LimitTableRowData }
>

// =============================================================================
// QUERY AND MUTATION FUNCTION TYPES
// =============================================================================

/**
 * Query function type for fetching rate limits list
 * 
 * Supports pagination, filtering, and sorting with intelligent
 * caching strategies and performance optimization.
 */
export type LimitsListQueryFn = QueryFunction<
  ApiListResponse<LimitTableRowData>,
  [string, ApiRequestOptions?]
>

/**
 * Query function type for fetching single rate limit
 * 
 * Provides detailed rate limit information with related data
 * including user, service, and role details when applicable.
 */
export type LimitDetailQueryFn = QueryFunction<
  LimitTableRowData,
  [string, number]
>

/**
 * Mutation function type for creating rate limits
 * 
 * Handles form data validation, submission, and error handling
 * with comprehensive feedback and rollback capabilities.
 */
export type CreateLimitMutationFn = MutationFunction<
  ApiCreateResponse,
  CreateLimitFormData
>

/**
 * Mutation function type for updating rate limits
 * 
 * Supports partial updates with optimistic UI patterns
 * and automatic cache invalidation strategies.
 */
export type UpdateLimitMutationFn = MutationFunction<
  ApiUpdateResponse,
  EditLimitFormData
>

/**
 * Mutation function type for deleting rate limits
 * 
 * Includes validation for dependent resources and
 * confirmation workflows for safe deletion.
 */
export type DeleteLimitMutationFn = MutationFunction<
  ApiDeleteResponse,
  number
>

// =============================================================================
// REACT QUERY CONFIGURATION TYPES
// =============================================================================

/**
 * Query configuration for rate limits list with performance optimization
 * 
 * Configured for optimal UX with stale-while-revalidate patterns
 * and intelligent cache management per React Query best practices.
 */
export interface LimitsListQueryConfig extends QueryConfig<ApiListResponse<LimitTableRowData>> {
  /** Query key for cache identification */
  queryKey: ['limits', 'list', ApiRequestOptions?]
  /** Stale time for cache optimization (5 minutes) */
  staleTime: 300000
  /** Cache time for memory management (15 minutes) */
  cacheTime: 900000
  /** Refetch on window focus for data freshness */
  refetchOnWindowFocus: false
  /** Refetch on network reconnection */
  refetchOnReconnect: true
  /** Enable background refetching */
  refetchInterval: false
  /** Retry failed requests with exponential backoff */
  retry: 3
  /** Keep previous data during refetch for better UX */
  keepPreviousData: true
}

/**
 * Query configuration for single rate limit with optimized caching
 * 
 * Balanced between data freshness and performance for detailed views
 * with automatic invalidation on related mutations.
 */
export interface LimitDetailQueryConfig extends QueryConfig<LimitTableRowData> {
  /** Query key for cache identification */
  queryKey: ['limits', 'detail', number]
  /** Stale time for detailed view (2 minutes) */
  staleTime: 120000
  /** Cache time for memory management (10 minutes) */
  cacheTime: 600000
  /** Refetch on focus for critical data */
  refetchOnWindowFocus: true
  /** Retry configuration for reliability */
  retry: 2
  /** Enable suspense for better loading states */
  suspense: false
}

/**
 * Mutation configuration for creating rate limits with optimistic updates
 * 
 * Provides immediate user feedback with rollback capabilities
 * and comprehensive error handling per Section 4.2 requirements.
 */
export interface CreateLimitMutationConfig extends MutationConfig<
  ApiCreateResponse,
  ApiErrorResponse,
  CreateLimitFormData
> {
  /** Optimistic update handler */
  onMutate: (variables: CreateLimitFormData) => Promise<{ tempId: string }>
  /** Success handler with cache invalidation */
  onSuccess: (data: ApiCreateResponse, variables: CreateLimitFormData) => Promise<void>
  /** Error handler with user feedback */
  onError: (error: ApiErrorResponse, variables: CreateLimitFormData, context: any) => Promise<void>
  /** Settlement handler for cleanup */
  onSettled: () => Promise<void>
  /** Retry configuration */
  retry: 1
  /** Use error boundary for unhandled errors */
  useErrorBoundary: true
}

/**
 * Mutation configuration for updating rate limits with optimistic updates
 * 
 * Enables immediate UI updates with automatic rollback on errors
 * and intelligent cache synchronization across all related queries.
 */
export interface UpdateLimitMutationConfig extends MutationConfig<
  ApiUpdateResponse,
  ApiErrorResponse,
  EditLimitFormData
> {
  /** Optimistic update with previous data backup */
  onMutate: (variables: EditLimitFormData) => Promise<{ previousData: LimitTableRowData }>
  /** Success handler with selective cache updates */
  onSuccess: (data: ApiUpdateResponse, variables: EditLimitFormData) => Promise<void>
  /** Error handler with automatic rollback */
  onError: (error: ApiErrorResponse, variables: EditLimitFormData, context: any) => Promise<void>
  /** Settlement handler for final cleanup */
  onSettled: () => Promise<void>
  /** Single retry for transient failures */
  retry: 1
  /** Error boundary integration */
  useErrorBoundary: true
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

/**
 * Props for LimitsList component with comprehensive configuration
 * 
 * Supports pagination, filtering, sorting, and selection with
 * optimal performance for large datasets and responsive design.
 */
export interface LimitsListProps {
  /** Initial query parameters for data fetching */
  initialParams?: ApiRequestOptions
  /** Enable selection functionality */
  selectable?: boolean
  /** Enable pagination controls */
  paginated?: boolean
  /** Items per page (default: 25) */
  pageSize?: number
  /** Enable filtering controls */
  filterable?: boolean
  /** Enable sorting controls */
  sortable?: boolean
  /** Custom column configuration */
  columns?: LimitsTableColumn[]
  /** Selection change handler */
  onSelectionChange?: (selectedIds: number[]) => void
  /** Row click handler */
  onRowClick?: (limit: LimitTableRowData) => void
  /** Bulk action handlers */
  onBulkAction?: (action: BulkAction, selectedIds: number[]) => void
  /** Loading state override */
  loading?: boolean
  /** Error state override */
  error?: ApiErrorResponse | null
  /** Custom CSS classes */
  className?: string
  /** Component test ID for testing */
  testId?: string
}

/**
 * Props for LimitForm component with form state management
 * 
 * Provides comprehensive form handling with validation, submission,
 * and error management optimized for React Hook Form integration.
 */
export interface LimitFormProps {
  /** Form mode - create or edit */
  mode: 'create' | 'edit'
  /** Initial form data (required for edit mode) */
  initialData?: Partial<LimitTableRowData>
  /** Form submission handler */
  onSubmit: (data: CreateLimitFormData | EditLimitFormData) => void | Promise<void>
  /** Form cancellation handler */
  onCancel?: () => void
  /** Form validation success handler */
  onValidationSuccess?: () => void
  /** Form validation error handler */
  onValidationError?: (errors: FieldErrors<CreateLimitFormData | EditLimitFormData>) => void
  /** Loading state for async operations */
  loading?: boolean
  /** Submission error display */
  error?: ApiErrorResponse | null
  /** Read-only mode flag */
  readOnly?: boolean
  /** Show advanced options */
  showAdvancedOptions?: boolean
  /** Custom field configuration */
  fieldConfig?: Partial<FormConfig<CreateLimitFormData | EditLimitFormData>>
  /** Custom CSS classes */
  className?: string
  /** Component test ID */
  testId?: string
}

/**
 * Props for LimitDetail component with comprehensive data display
 * 
 * Shows detailed rate limit information with edit capabilities,
 * related data loading, and action management.
 */
export interface LimitDetailProps {
  /** Rate limit ID to display */
  limitId: number
  /** Enable edit functionality */
  editable?: boolean
  /** Enable delete functionality */
  deletable?: boolean
  /** Edit handler */
  onEdit?: (limit: LimitTableRowData) => void
  /** Delete handler */
  onDelete?: (limitId: number) => void
  /** Status toggle handler */
  onToggleStatus?: (limitId: number, active: boolean) => void
  /** Show related information (users, services, roles) */
  showRelatedInfo?: boolean
  /** Custom sections to display */
  sections?: LimitDetailSection[]
  /** Loading state override */
  loading?: boolean
  /** Error state override */
  error?: ApiErrorResponse | null
  /** Custom CSS classes */
  className?: string
  /** Component test ID */
  testId?: string
}

// =============================================================================
// TABLE AND UI CONFIGURATION TYPES
// =============================================================================

/**
 * Table column configuration for limits display
 * 
 * Provides flexible column management with sorting, filtering,
 * and custom rendering capabilities for optimal UX.
 */
export interface LimitsTableColumn {
  /** Column identifier */
  key: keyof LimitTableRowData | 'actions'
  /** Display header text */
  header: string
  /** Column is sortable */
  sortable?: boolean
  /** Column is filterable */
  filterable?: boolean
  /** Column width specification */
  width?: string | number
  /** Column minimum width */
  minWidth?: string | number
  /** Column alignment */
  align?: 'left' | 'center' | 'right'
  /** Custom cell renderer */
  render?: (value: any, row: LimitTableRowData) => React.ReactNode
  /** Custom header renderer */
  renderHeader?: (column: LimitsTableColumn) => React.ReactNode
  /** Column is hidden by default */
  hidden?: boolean
  /** Column priority for responsive hiding */
  priority?: number
}

/**
 * Bulk action configuration for selected items
 * 
 * Enables efficient batch operations with confirmation
 * dialogs and progress tracking for better UX.
 */
export interface BulkAction {
  /** Action identifier */
  id: string
  /** Display label */
  label: string
  /** Action icon component */
  icon?: React.ComponentType<{ className?: string }>
  /** Action handler */
  handler: (selectedIds: number[]) => void | Promise<void>
  /** Requires confirmation dialog */
  requiresConfirmation?: boolean
  /** Confirmation message */
  confirmationMessage?: string
  /** Action is destructive (red styling) */
  destructive?: boolean
  /** Action is disabled */
  disabled?: boolean
  /** Minimum selection count required */
  minSelection?: number
  /** Maximum selection count allowed */
  maxSelection?: number
}

/**
 * Detail view section configuration
 * 
 * Provides modular section display for limit details
 * with collapsible and conditional rendering support.
 */
export interface LimitDetailSection {
  /** Section identifier */
  id: string
  /** Section title */
  title: string
  /** Section content renderer */
  render: (limit: LimitTableRowData) => React.ReactNode
  /** Section is collapsible */
  collapsible?: boolean
  /** Section is collapsed by default */
  defaultCollapsed?: boolean
  /** Section display condition */
  condition?: (limit: LimitTableRowData) => boolean
  /** Section order/priority */
  order?: number
}

// =============================================================================
// HOOK RETURN TYPES FOR CUSTOM HOOKS
// =============================================================================

/**
 * Return type for useLimitsList custom hook
 * 
 * Provides comprehensive state management for limits list
 * with pagination, filtering, and selection capabilities.
 */
export interface UseLimitsListReturn {
  /** Query result with data and loading states */
  query: LimitsListQueryResult
  /** Current list data */
  limits: LimitTableRowData[]
  /** Pagination metadata */
  pagination: PaginationMeta
  /** Current query parameters */
  params: ApiRequestOptions
  /** Update query parameters */
  setParams: (params: Partial<ApiRequestOptions>) => void
  /** Selected item IDs */
  selectedIds: number[]
  /** Update selected items */
  setSelectedIds: (ids: number[]) => void
  /** Refresh data */
  refresh: () => Promise<void>
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: ApiErrorResponse | null
  /** Performance metrics */
  metrics: QueryPerformanceMetrics
}

/**
 * Return type for useLimitForm custom hook
 * 
 * Encapsulates form state management with validation,
 * submission handling, and performance monitoring.
 */
export interface UseLimitFormReturn<T extends CreateLimitFormData | EditLimitFormData> {
  /** Form state and methods */
  form: UseFormReturn<T>
  /** Current form values */
  values: T
  /** Validation errors */
  errors: FieldErrors<T>
  /** Form submission handler */
  handleSubmit: (data: T) => Promise<void>
  /** Form reset handler */
  handleReset: () => void
  /** Field value setter with validation */
  setValue: (field: keyof T, value: any) => void
  /** Field error getter */
  getFieldError: (field: keyof T) => string | undefined
  /** Form state indicators */
  isSubmitting: boolean
  isValidating: boolean
  isValid: boolean
  isDirty: boolean
  /** Validation metrics */
  validationMetrics: ValidationPerformanceMetrics
}

/**
 * Query performance metrics for monitoring
 * 
 * Tracks query performance to ensure optimal UX
 * and identify potential optimization opportunities.
 */
export interface QueryPerformanceMetrics {
  /** Query execution time in milliseconds */
  queryTime: number
  /** Cache hit rate percentage */
  cacheHitRate: number
  /** Number of background refetches */
  backgroundRefetchCount: number
  /** Last successful fetch timestamp */
  lastFetchTime: Date
  /** Error rate percentage */
  errorRate: number
}

// =============================================================================
// CACHE INVALIDATION AND QUERY KEY TYPES
// =============================================================================

/**
 * Query key patterns for React Query cache management
 * 
 * Provides consistent cache key generation and invalidation
 * patterns for optimal cache performance and data consistency.
 */
export const LIMITS_QUERY_KEYS = {
  /** Base key for all limits-related queries */
  all: ['limits'] as const,
  /** Key pattern for limits list queries */
  lists: () => [...LIMITS_QUERY_KEYS.all, 'list'] as const,
  /** Key pattern for specific list query */
  list: (params?: ApiRequestOptions) => [...LIMITS_QUERY_KEYS.lists(), params] as const,
  /** Key pattern for limit detail queries */
  details: () => [...LIMITS_QUERY_KEYS.all, 'detail'] as const,
  /** Key pattern for specific detail query */
  detail: (id: number) => [...LIMITS_QUERY_KEYS.details(), id] as const,
  /** Key pattern for related data queries */
  related: (id: number) => [...LIMITS_QUERY_KEYS.detail(id), 'related'] as const
} as const

/**
 * Cache invalidation filters for mutation operations
 * 
 * Defines precise cache invalidation patterns to ensure
 * data consistency across all related queries after mutations.
 */
export interface LimitsCacheInvalidationFilters {
  /** Invalidate all limits queries */
  all: InvalidateQueryFilters
  /** Invalidate limits list queries */
  lists: InvalidateQueryFilters
  /** Invalidate specific limit detail */
  detail: (id: number) => InvalidateQueryFilters
  /** Invalidate related data queries */
  related: (id: number) => InvalidateQueryFilters
}

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL USE
// =============================================================================

/**
 * Core data type exports
 */
export type {
  LimitTableRowData as Limit,
  LimitMetadata,
  AlertConfiguration
}

/**
 * Form-related type exports
 */
export type {
  CreateLimitFormData as CreateLimitForm,
  EditLimitFormData as EditLimitForm,
  CreateLimitFormState as CreateFormState,
  EditLimitFormState as EditFormState
}

/**
 * React Query type exports
 */
export type {
  LimitsListQueryResult as LimitsListQuery,
  LimitDetailQueryResult as LimitDetailQuery,
  CreateLimitMutationResult as CreateLimitMutation,
  UpdateLimitMutationResult as UpdateLimitMutation,
  DeleteLimitMutationResult as DeleteLimitMutation
}

/**
 * Component prop type exports
 */
export type {
  LimitsListProps,
  LimitFormProps,
  LimitDetailProps
}

/**
 * Hook return type exports
 */
export type {
  UseLimitsListReturn as LimitsListHook,
  UseLimitFormReturn as LimitFormHook
}

/**
 * Validation schema exports
 */
export {
  LimitTypeSchema,
  LimitCounterSchema,
  LimitTableRowDataSchema,
  CreateLimitFormSchema,
  EditLimitFormSchema
}

/**
 * Enum exports
 */
export {
  LimitType,
  LimitCounter
}

/**
 * Query key utilities export
 */
export {
  LIMITS_QUERY_KEYS
}