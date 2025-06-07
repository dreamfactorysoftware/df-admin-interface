/**
 * Rate Limiting Management Types for React/Next.js Implementation
 * 
 * Comprehensive type definitions supporting React Hook Form with Zod schema validation,
 * React Query data fetching patterns, and enterprise-grade rate limiting configurations.
 * 
 * Provides type-safe interfaces for limit management workflows including creation, editing,
 * and administration of API rate limits with user, service, and role-based associations.
 * Optimized for TypeScript 5.8+ with enhanced React 19 compatibility.
 * 
 * @fileoverview Rate limiting types for DreamFactory admin interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import type { 
  ApiListResponse, 
  ApiResourceResponse, 
  ApiErrorResponse,
  MutationOptions,
  SwrOptions,
  PaginationMeta
} from '../../types/api';
import type {
  FormSchema,
  FormFieldConfig,
  EnhancedFormInstance,
  FormFieldError,
  EnhancedValidationState,
  SubmitHandler,
  SubmitErrorHandler
} from '../../types/forms';
import type { ComponentProps, ReactNode } from 'react';

// ============================================================================
// Core Limit Data Types
// ============================================================================

/**
 * Rate limit types supported by DreamFactory
 * Defines the scope and behavior of rate limiting rules
 */
export type LimitType = 
  | 'api.calls_per_period'      // General API calls per time period
  | 'api.calls_per_minute'      // API calls per minute
  | 'api.calls_per_hour'        // API calls per hour
  | 'api.calls_per_day'         // API calls per day
  | 'db.calls_per_period'       // Database-specific calls per period
  | 'service.calls_per_period'  // Service-specific calls per period
  | 'user.calls_per_period';    // User-specific calls per period

/**
 * Rate limit counter types for tracking usage
 */
export type LimitCounterType = 
  | 'api.calls_made'        // Number of API calls made
  | 'db.calls_made'         // Number of database calls made
  | 'service.calls_made'    // Number of service calls made
  | 'user.calls_made';      // Number of user calls made

/**
 * Period units for rate limiting calculations
 */
export type LimitPeriodUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';

/**
 * Core limit table row data structure
 * Enhanced from Angular implementation with comprehensive type safety
 */
export interface LimitTableRowData {
  /** Unique identifier for the rate limit */
  id: number;
  
  /** Human-readable name for the rate limit */
  name: string;
  
  /** Type of rate limit being enforced */
  limitType: LimitType;
  
  /** Rate limit value (e.g., "100 per hour") */
  limitRate: string;
  
  /** Counter type for tracking limit usage */
  limitCounter: LimitCounterType;
  
  /** Associated user ID (null for global limits) */
  user: number | null;
  
  /** Associated service ID (null for non-service limits) */
  service: number | null;
  
  /** Associated role ID (null for non-role limits) */
  role: number | null;
  
  /** Whether the limit is currently active */
  active: boolean;
  
  /** Optional description of the limit purpose */
  description?: string;
  
  /** Limit creation timestamp */
  createdAt?: string;
  
  /** Last modification timestamp */
  updatedAt?: string;
  
  /** User who created the limit */
  createdBy?: string;
  
  /** Current usage count (if available) */
  currentUsage?: number;
  
  /** Period configuration for time-based limits */
  period?: {
    value: number;
    unit: LimitPeriodUnit;
  };
}

/**
 * Detailed limit configuration for creation and editing
 * Extends table row data with full configuration options
 */
export interface LimitConfiguration extends Omit<LimitTableRowData, 'id' | 'createdAt' | 'updatedAt'> {
  /** Rate limit value as number */
  rateValue: number;
  
  /** Period configuration */
  period: {
    value: number;
    unit: LimitPeriodUnit;
  };
  
  /** Advanced limit options */
  options?: {
    /** Allow burst requests */
    allowBurst?: boolean;
    
    /** Burst limit multiplier */
    burstMultiplier?: number;
    
    /** Reset time for the limit period */
    resetTime?: string;
    
    /** Custom error message when limit is exceeded */
    errorMessage?: string;
    
    /** Priority for overlapping limits */
    priority?: number;
  };
  
  /** Limit scope configuration */
  scope?: {
    /** Apply to specific endpoints */
    endpoints?: string[];
    
    /** Apply to specific HTTP methods */
    methods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
    
    /** IP address restrictions */
    ipRestrictions?: string[];
  };
}

/**
 * Limit usage statistics for monitoring and analytics
 */
export interface LimitUsageStats {
  /** Limit ID */
  limitId: number;
  
  /** Current period usage */
  currentUsage: number;
  
  /** Maximum allowed for current period */
  maxAllowed: number;
  
  /** Percentage of limit used */
  usagePercentage: number;
  
  /** Time until limit resets */
  timeUntilReset: number;
  
  /** Total violations in the last period */
  violations: number;
  
  /** Historical usage data */
  history?: Array<{
    period: string;
    usage: number;
    violations: number;
  }>;
}

// ============================================================================
// Zod Schema Definitions for Form Validation
// ============================================================================

/**
 * Zod schema for limit type validation
 * Provides runtime type checking and error messages
 */
export const LimitTypeSchema = z.enum([
  'api.calls_per_period',
  'api.calls_per_minute', 
  'api.calls_per_hour',
  'api.calls_per_day',
  'db.calls_per_period',
  'service.calls_per_period',
  'user.calls_per_period'
], {
  errorMap: () => ({ message: 'Please select a valid limit type' })
});

/**
 * Zod schema for limit counter type validation
 */
export const LimitCounterTypeSchema = z.enum([
  'api.calls_made',
  'db.calls_made', 
  'service.calls_made',
  'user.calls_made'
], {
  errorMap: () => ({ message: 'Please select a valid counter type' })
});

/**
 * Zod schema for period unit validation
 */
export const LimitPeriodUnitSchema = z.enum(['minute', 'hour', 'day', 'week', 'month'], {
  errorMap: () => ({ message: 'Please select a valid period unit' })
});

/**
 * Zod schema for period configuration
 */
export const LimitPeriodSchema = z.object({
  value: z.number()
    .int('Period value must be a whole number')
    .min(1, 'Period value must be at least 1')
    .max(365, 'Period value cannot exceed 365'),
  unit: LimitPeriodUnitSchema
});

/**
 * Zod schema for basic limit table row data validation
 * Used for API responses and data validation
 */
export const LimitTableRowDataSchema = z.object({
  id: z.number().int().positive('ID must be a positive integer'),
  name: z.string()
    .min(1, 'Limit name is required')
    .max(100, 'Limit name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Limit name contains invalid characters'),
  limitType: LimitTypeSchema,
  limitRate: z.string().min(1, 'Limit rate is required'),
  limitCounter: LimitCounterTypeSchema,
  user: z.number().int().positive().nullable(),
  service: z.number().int().positive().nullable(),
  role: z.number().int().positive().nullable(),
  active: z.boolean(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdBy: z.string().max(100).optional(),
  currentUsage: z.number().int().min(0).optional(),
  period: LimitPeriodSchema.optional()
});

/**
 * Comprehensive Zod schema for limit configuration form validation
 * Includes advanced validation rules and cross-field dependencies
 */
export const LimitConfigurationSchema = z.object({
  name: z.string()
    .min(1, 'Limit name is required')
    .max(100, 'Limit name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Limit name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  limitType: LimitTypeSchema,
  limitCounter: LimitCounterTypeSchema,
  
  rateValue: z.number()
    .int('Rate value must be a whole number')
    .min(1, 'Rate value must be at least 1')
    .max(1000000, 'Rate value cannot exceed 1,000,000'),
  
  period: LimitPeriodSchema,
  
  user: z.number().int().positive().nullable(),
  service: z.number().int().positive().nullable(),
  role: z.number().int().positive().nullable(),
  
  active: z.boolean().default(true),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  
  options: z.object({
    allowBurst: z.boolean().optional(),
    burstMultiplier: z.number()
      .min(1, 'Burst multiplier must be at least 1')
      .max(10, 'Burst multiplier cannot exceed 10')
      .optional(),
    resetTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Reset time must be in HH:MM format').optional(),
    errorMessage: z.string().max(200, 'Error message must be less than 200 characters').optional(),
    priority: z.number().int().min(1).max(100).optional()
  }).optional(),
  
  scope: z.object({
    endpoints: z.array(z.string().max(200)).optional(),
    methods: z.array(z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])).optional(),
    ipRestrictions: z.array(z.string().ip()).optional()
  }).optional()
}).refine(
  (data) => {
    // At least one of user, service, or role must be null for global limits
    const hasSpecificTarget = data.user !== null || data.service !== null || data.role !== null;
    return hasSpecificTarget || data.limitType.includes('api.calls_per_');
  },
  {
    message: 'Global limits require API-specific limit types',
    path: ['limitType']
  }
).refine(
  (data) => {
    // Service limits require a service ID
    if (data.limitType.includes('service.calls_per_')) {
      return data.service !== null;
    }
    return true;
  },
  {
    message: 'Service-specific limits require a service selection',
    path: ['service']
  }
).refine(
  (data) => {
    // User limits require a user ID
    if (data.limitType.includes('user.calls_per_')) {
      return data.user !== null;
    }
    return true;
  },
  {
    message: 'User-specific limits require a user selection',
    path: ['user']
  }
);

/**
 * Zod schema for limit usage statistics validation
 */
export const LimitUsageStatsSchema = z.object({
  limitId: z.number().int().positive(),
  currentUsage: z.number().int().min(0),
  maxAllowed: z.number().int().positive(),
  usagePercentage: z.number().min(0).max(100),
  timeUntilReset: z.number().min(0),
  violations: z.number().int().min(0),
  history: z.array(z.object({
    period: z.string(),
    usage: z.number().int().min(0),
    violations: z.number().int().min(0)
  })).optional()
});

// ============================================================================
// Form State Types and Interfaces
// ============================================================================

/**
 * Form state for limit creation and editing operations
 * Includes loading, error, and validation states for optimal UX
 */
export interface LimitFormState {
  /** Current form data */
  data: Partial<LimitConfiguration>;
  
  /** Form submission loading state */
  isSubmitting: boolean;
  
  /** Form validation loading state */
  isValidating: boolean;
  
  /** Form dirty state (has unsaved changes) */
  isDirty: boolean;
  
  /** Form touched state (user has interacted) */
  isTouched: boolean;
  
  /** Form validation state */
  isValid: boolean;
  
  /** Current form errors */
  errors: Record<string, FormFieldError>;
  
  /** Field validation states */
  fieldStates: Record<string, EnhancedValidationState>;
  
  /** Form mode (create or edit) */
  mode: 'create' | 'edit';
  
  /** Loading state for dependent data (users, services, roles) */
  dependentDataLoading: {
    users: boolean;
    services: boolean;
    roles: boolean;
  };
  
  /** Available options for form fields */
  fieldOptions: {
    users: Array<{ id: number; name: string; email: string }>;
    services: Array<{ id: number; name: string; type: string }>;
    roles: Array<{ id: number; name: string; description?: string }>;
  };
  
  /** Connection test state for service limits */
  connectionTest?: {
    isRunning: boolean;
    success: boolean | null;
    error: string | null;
    lastTested: Date | null;
  };
}

/**
 * Enhanced form instance specifically for limit management
 * Extends base form functionality with limit-specific operations
 */
export interface LimitFormInstance extends EnhancedFormInstance<LimitConfiguration> {
  /** Test service connection for service-based limits */
  testServiceConnection: (serviceId: number) => Promise<boolean>;
  
  /** Validate limit configuration against current usage */
  validateAgainstUsage: () => Promise<boolean>;
  
  /** Preview the generated limit rate string */
  previewRateString: () => string;
  
  /** Check for conflicting limits */
  checkForConflicts: () => Promise<string[]>;
  
  /** Reset form to default limit template */
  resetToTemplate: (template: 'user' | 'service' | 'role' | 'global') => void;
}

/**
 * Props for limit form components
 * Supports both creation and editing workflows
 */
export interface LimitFormProps {
  /** Initial data for editing (undefined for creation) */
  initialData?: Partial<LimitConfiguration>;
  
  /** Form submission handler */
  onSubmit: SubmitHandler<LimitConfiguration>;
  
  /** Error handler for form submission */
  onError?: SubmitErrorHandler<LimitConfiguration>;
  
  /** Cancel handler */
  onCancel?: () => void;
  
  /** Loading state override */
  loading?: boolean;
  
  /** Disabled state override */
  disabled?: boolean;
  
  /** Hide advanced options initially */
  hideAdvancedOptions?: boolean;
  
  /** Show connection testing for service limits */
  enableConnectionTest?: boolean;
  
  /** Custom validation functions */
  customValidation?: {
    name?: (name: string) => Promise<string | undefined>;
    rateValue?: (value: number, type: LimitType) => Promise<string | undefined>;
  };
  
  /** Theme and styling props */
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  
  /** Accessibility props */
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// ============================================================================
// React Query Integration Types
// ============================================================================

/**
 * SWR configuration for limit data fetching
 * Optimized for real-time limit monitoring and management
 */
export interface LimitSwrOptions extends SwrOptions<ApiListResponse<LimitTableRowData>> {
  /** Refresh interval for active limits monitoring */
  refreshInterval?: number;
  
  /** Enable real-time usage updates */
  enableRealtimeUpdates?: boolean;
  
  /** Filter options for limit queries */
  filters?: {
    active?: boolean;
    userId?: number;
    serviceId?: number;
    roleId?: number;
    limitType?: LimitType;
  };
  
  /** Sort options */
  sort?: {
    field: keyof LimitTableRowData;
    direction: 'asc' | 'desc';
  };
}

/**
 * React Query types for limit mutations
 * Supports create, update, delete, and bulk operations
 */
export interface LimitMutationOptions<TData = any, TVariables = any> 
  extends MutationOptions<TData, TVariables, ApiErrorResponse> {
  /** Optimistic update configuration */
  optimisticUpdate?: {
    enabled: boolean;
    rollbackOnError: boolean;
  };
  
  /** Cache invalidation patterns */
  invalidateQueries?: string[];
  
  /** Success notification configuration */
  successNotification?: {
    title: string;
    message: string;
    duration?: number;
  };
  
  /** Error notification configuration */
  errorNotification?: {
    title: string;
    fallbackMessage: string;
  };
}

/**
 * Limit creation mutation variables
 */
export interface CreateLimitMutationVariables {
  data: LimitConfiguration;
  testConnection?: boolean;
}

/**
 * Limit update mutation variables
 */
export interface UpdateLimitMutationVariables {
  id: number;
  data: Partial<LimitConfiguration>;
  testConnection?: boolean;
}

/**
 * Limit deletion mutation variables
 */
export interface DeleteLimitMutationVariables {
  id: number;
  force?: boolean;
}

/**
 * Bulk limit operations mutation variables
 */
export interface BulkLimitMutationVariables {
  operation: 'activate' | 'deactivate' | 'delete';
  limitIds: number[];
  force?: boolean;
}

/**
 * Query types for limit data fetching
 */
export type LimitListQuery = ApiListResponse<LimitTableRowData>;
export type LimitDetailQuery = ApiResourceResponse<LimitTableRowData>;
export type LimitUsageQuery = ApiResourceResponse<LimitUsageStats>;

/**
 * Mutation response types
 */
export type CreateLimitMutation = ApiResourceResponse<LimitTableRowData>;
export type UpdateLimitMutation = ApiResourceResponse<LimitTableRowData>;
export type DeleteLimitMutation = { success: boolean; message: string };
export type BulkLimitMutation = { 
  success: boolean; 
  message: string; 
  results: Array<{ id: number; success: boolean; error?: string }>;
};

// ============================================================================
// Component Props and State Types
// ============================================================================

/**
 * Props for the limits list table component
 * Supports sorting, filtering, pagination, and bulk operations
 */
export interface LimitListTableProps extends ComponentProps<'div'> {
  /** Limit data to display */
  data: LimitTableRowData[];
  
  /** Loading state */
  loading?: boolean;
  
  /** Error state */
  error?: ApiErrorResponse | null;
  
  /** Pagination metadata */
  pagination?: PaginationMeta;
  
  /** Selection handlers */
  selection?: {
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    onSelectAll: () => void;
    onClearSelection: () => void;
  };
  
  /** Sort configuration */
  sort?: {
    field: keyof LimitTableRowData;
    direction: 'asc' | 'desc';
    onSortChange: (field: keyof LimitTableRowData, direction: 'asc' | 'desc') => void;
  };
  
  /** Filter configuration */
  filters?: {
    active: boolean | undefined;
    search: string;
    limitType: LimitType | undefined;
    onFilterChange: (filters: any) => void;
  };
  
  /** Action handlers */
  actions?: {
    onEdit: (limit: LimitTableRowData) => void;
    onDelete: (limit: LimitTableRowData) => void;
    onToggleActive: (limit: LimitTableRowData) => void;
    onBulkAction: (action: 'activate' | 'deactivate' | 'delete', ids: number[]) => void;
  };
  
  /** Display options */
  display?: {
    showUsageStats: boolean;
    showActions: boolean;
    showSelection: boolean;
    compact: boolean;
  };
  
  /** Accessibility configuration */
  accessibility?: {
    tableCaption: string;
    announceChanges: boolean;
  };
}

/**
 * Props for individual limit detail components
 */
export interface LimitDetailProps extends ComponentProps<'div'> {
  /** Limit data to display */
  limit: LimitTableRowData;
  
  /** Usage statistics */
  usage?: LimitUsageStats;
  
  /** Loading state for usage data */
  usageLoading?: boolean;
  
  /** Edit mode toggle */
  editMode?: boolean;
  
  /** Action handlers */
  onEdit?: () => void;
  onSave?: (data: Partial<LimitConfiguration>) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  
  /** Display configuration */
  showUsageChart?: boolean;
  showHistory?: boolean;
  showAdvancedDetails?: boolean;
  
  /** Theme variant */
  variant?: 'card' | 'panel' | 'modal';
}

/**
 * Props for limit creation/editing wizard components
 */
export interface LimitWizardProps extends ComponentProps<'div'> {
  /** Current step in the wizard */
  currentStep: number;
  
  /** Total number of steps */
  totalSteps: number;
  
  /** Form data */
  formData: Partial<LimitConfiguration>;
  
  /** Form state */
  formState: LimitFormState;
  
  /** Step navigation handlers */
  onNext: () => void;
  onPrevious: () => void;
  onStepChange: (step: number) => void;
  
  /** Form handlers */
  onDataChange: (data: Partial<LimitConfiguration>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  
  /** Validation handlers */
  onValidateStep: (step: number) => Promise<boolean>;
  
  /** Step configuration */
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    fields: string[];
    optional?: boolean;
  }>;
  
  /** Theme and layout */
  layout?: 'horizontal' | 'vertical';
  showProgress?: boolean;
  allowSkipping?: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useLimits hook
 * Provides comprehensive limit management functionality
 */
export interface UseLimitsReturn {
  /** Current limits data */
  limits: LimitTableRowData[];
  
  /** Loading states */
  loading: {
    list: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
  };
  
  /** Error states */
  errors: {
    list: ApiErrorResponse | null;
    create: ApiErrorResponse | null;
    update: ApiErrorResponse | null;
    delete: ApiErrorResponse | null;
  };
  
  /** Pagination state */
  pagination: PaginationMeta;
  
  /** CRUD operations */
  operations: {
    create: (data: LimitConfiguration) => Promise<LimitTableRowData>;
    update: (id: number, data: Partial<LimitConfiguration>) => Promise<LimitTableRowData>;
    delete: (id: number) => Promise<void>;
    bulkUpdate: (ids: number[], data: Partial<LimitConfiguration>) => Promise<void>;
    refresh: () => Promise<void>;
  };
  
  /** Filtering and sorting */
  filters: {
    active?: boolean;
    search?: string;
    limitType?: LimitType;
    setFilters: (filters: any) => void;
    clearFilters: () => void;
  };
  
  /** Selection management */
  selection: {
    selectedIds: number[];
    setSelectedIds: (ids: number[]) => void;
    selectAll: () => void;
    clearSelection: () => void;
  };
}

/**
 * Return type for useLimitForm hook
 * Provides form management with validation and submission
 */
export interface UseLimitFormReturn {
  /** Form instance */
  form: LimitFormInstance;
  
  /** Form state */
  state: LimitFormState;
  
  /** Form actions */
  actions: {
    submit: () => Promise<void>;
    reset: () => void;
    resetToTemplate: (template: 'user' | 'service' | 'role' | 'global') => void;
    validateField: (field: string) => Promise<void>;
    clearErrors: () => void;
  };
  
  /** Dependent data */
  dependentData: {
    users: { data: any[]; loading: boolean; error: ApiErrorResponse | null };
    services: { data: any[]; loading: boolean; error: ApiErrorResponse | null };
    roles: { data: any[]; loading: boolean; error: ApiErrorResponse | null };
  };
  
  /** Helper functions */
  helpers: {
    previewRateString: () => string;
    testServiceConnection: (serviceId: number) => Promise<boolean>;
    checkForConflicts: () => Promise<string[]>;
  };
}

// ============================================================================
// Utility Types and Type Guards
// ============================================================================

/**
 * Type guard to check if a limit is user-specific
 */
export function isUserLimit(limit: LimitTableRowData): boolean {
  return limit.user !== null || limit.limitType.includes('user');
}

/**
 * Type guard to check if a limit is service-specific
 */
export function isServiceLimit(limit: LimitTableRowData): boolean {
  return limit.service !== null || limit.limitType.includes('service');
}

/**
 * Type guard to check if a limit is role-specific
 */
export function isRoleLimit(limit: LimitTableRowData): boolean {
  return limit.role !== null;
}

/**
 * Type guard to check if a limit is global
 */
export function isGlobalLimit(limit: LimitTableRowData): boolean {
  return !isUserLimit(limit) && !isServiceLimit(limit) && !isRoleLimit(limit);
}

/**
 * Extract the numeric rate value from a rate string
 */
export function extractRateValue(rateString: string): number {
  const match = rateString.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Extract the period from a rate string
 */
export function extractRatePeriod(rateString: string): { value: number; unit: LimitPeriodUnit } | null {
  const match = rateString.match(/per\s+(\d+)?\s*(minute|hour|day|week|month)s?/i);
  if (match) {
    return {
      value: match[1] ? parseInt(match[1], 10) : 1,
      unit: match[2].toLowerCase() as LimitPeriodUnit
    };
  }
  return null;
}

/**
 * Format a rate configuration into a human-readable string
 */
export function formatRateString(
  rateValue: number, 
  period: { value: number; unit: LimitPeriodUnit }
): string {
  const pluralUnit = period.value === 1 ? period.unit : `${period.unit}s`;
  return `${rateValue} per ${period.value > 1 ? `${period.value} ` : ''}${pluralUnit}`;
}

// ============================================================================
// Type Exports for Convenience
// ============================================================================

// Export form-related types
export type LimitFormData = z.infer<typeof LimitConfigurationSchema>;
export type LimitTableData = z.infer<typeof LimitTableRowDataSchema>;

// Export common type aliases
export type LimitsList = LimitTableRowData[];
export type LimitsListResponse = ApiListResponse<LimitTableRowData>;
export type LimitResponse = ApiResourceResponse<LimitTableRowData>;
export type LimitError = ApiErrorResponse;

// Export all schemas for external validation
export {
  LimitTypeSchema as LimitTypeValidation,
  LimitCounterTypeSchema as LimitCounterValidation,
  LimitPeriodUnitSchema as PeriodUnitValidation,
  LimitConfigurationSchema as LimitFormValidation,
  LimitTableRowDataSchema as LimitDataValidation,
  LimitUsageStatsSchema as UsageStatsValidation
};