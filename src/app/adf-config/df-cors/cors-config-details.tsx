/**
 * CORS Configuration Details Form Component
 * 
 * React functional component for creating and editing CORS (Cross-Origin Resource Sharing)
 * configuration entries. Provides comprehensive form controls for path patterns, origins,
 * HTTP methods, headers, and security settings with real-time validation under 100ms.
 * 
 * Features:
 * - React Hook Form integration with Zod schema validation
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - WCAG 2.1 AA accessibility compliance with focus management and screen reader support
 * - Comprehensive error handling with user feedback systems
 * - Dark/light theme support via Zustand theme store
 * - HTTP method selection with checkbox group
 * - Origin and path validation with helpful error messages
 * - Auto-save functionality and form persistence
 * - Keyboard navigation and accessibility features
 * 
 * @fileoverview CORS configuration details form component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { 
  useCallback, 
  useEffect, 
  useMemo, 
  useState,
  useRef,
  type ReactNode 
} from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Save, TestTube, AlertCircle, Check, X, Globe, Shield, Clock } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../hooks/use-theme';
import { Button } from '../../../components/ui/button';
import { Form } from '../../../components/ui/form';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { useCorsOperations } from './use-cors-operations';
import {
  corsConfigCreateSchema,
  corsConfigUpdateSchema,
  type CorsConfigCreateForm,
  type CorsConfigUpdateForm,
} from '../../../lib/validations/cors';
import type {
  CorsConfig,
  CorsConfigCreate,
  CorsConfigUpdate,
  HttpMethod,
  HTTP_METHODS,
  COMMON_CORS_HEADERS,
  DEFAULT_CORS_CONFIG,
} from '../../../types/cors';

// ============================================================================
// Component Props and Types
// ============================================================================

/**
 * Props interface for CORS configuration details component
 */
export interface CorsConfigDetailsProps {
  /** 
   * CORS configuration ID for editing existing entries
   * If undefined, creates a new CORS configuration
   */
  corsId?: number;
  
  /**
   * Callback fired when form is successfully submitted
   */
  onSuccess?: (config: CorsConfig) => void;
  
  /**
   * Callback fired when user cancels the form
   */
  onCancel?: () => void;
  
  /**
   * Whether to show the back navigation button
   * @default true
   */
  showBackButton?: boolean;
  
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  
  /**
   * Component test identifier
   */
  'data-testid'?: string;
}

/**
 * Form data type union for create and update operations
 */
type FormData = CorsConfigCreateForm | CorsConfigUpdateForm;

/**
 * Validation performance metrics for monitoring sub-100ms requirement
 */
interface ValidationMetrics {
  lastValidationTime: number;
  averageValidationTime: number;
  validationCount: number;
  exceededThresholdCount: number;
}

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Form configuration constants
 */
const FORM_CONFIG = {
  VALIDATION_TIMEOUT: 100, // Maximum validation time in milliseconds
  AUTO_SAVE_DELAY: 2000, // Auto-save delay in milliseconds
  DEBOUNCE_DELAY: 300, // Input debounce delay in milliseconds
  MAX_DESCRIPTION_LENGTH: 255,
  MAX_PATH_LENGTH: 255,
  MAX_ORIGIN_LENGTH: 255,
  MAX_HEADERS_LENGTH: 1000,
  DEFAULT_MAX_AGE: 3600,
  MIN_MAX_AGE: 0,
  MAX_MAX_AGE: 86400, // 24 hours
} as const;

/**
 * Common origin suggestions for better UX
 */
const ORIGIN_SUGGESTIONS = [
  '*',
  'https://localhost:3000',
  'https://localhost:8080',
  'https://localhost:4200',
  'https://example.com',
  'https://*.example.com',
] as const;

/**
 * Common path pattern suggestions
 */
const PATH_SUGGESTIONS = [
  '/*',
  '/api/*',
  '/api/v2/*',
  '/public/*',
  '/assets/*',
] as const;

/**
 * HTTP method labels for accessibility
 */
const HTTP_METHOD_LABELS: Record<HttpMethod, string> = {
  GET: 'GET - Retrieve data',
  POST: 'POST - Create new resources',
  PUT: 'PUT - Update entire resources',
  PATCH: 'PATCH - Partial updates',
  DELETE: 'DELETE - Remove resources',
  HEAD: 'HEAD - Retrieve headers only',
  OPTIONS: 'OPTIONS - Preflight requests',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats validation time for display
 */
function formatValidationTime(milliseconds: number): string {
  return `${milliseconds.toFixed(1)}ms`;
}

/**
 * Checks if validation time exceeds threshold
 */
function isValidationSlow(milliseconds: number): boolean {
  return milliseconds > FORM_CONFIG.VALIDATION_TIMEOUT;
}

/**
 * Creates accessibility description for HTTP methods
 */
function createMethodsDescription(methods: HttpMethod[]): string {
  if (methods.length === 0) return 'No HTTP methods selected';
  if (methods.length === 1) return `${methods[0]} method selected`;
  if (methods.length === HTTP_METHODS.length) return 'All HTTP methods selected';
  return `${methods.length} HTTP methods selected: ${methods.join(', ')}`;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CORS Configuration Details Form Component
 */
export function CorsConfigDetails({
  corsId,
  onSuccess,
  onCancel,
  showBackButton = true,
  className,
  'data-testid': testId = 'cors-config-details',
}: CorsConfigDetailsProps): ReactNode {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const formRef = useRef<HTMLFormElement>(null);
  
  // CORS operations hook for data fetching and mutations
  const {
    useCorsDetail,
    useCorsCreate,
    useCorsUpdate,
  } = useCorsOperations();
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationMetrics, setValidationMetrics] = useState<ValidationMetrics>({
    lastValidationTime: 0,
    averageValidationTime: 0,
    validationCount: 0,
    exceededThresholdCount: 0,
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Determine if this is an edit operation
  const isEditing = corsId !== undefined;
  
  // Fetch existing CORS configuration for editing
  const {
    data: corsConfigResponse,
    isLoading: isLoadingConfig,
    error: loadError,
  } = useCorsDetail(corsId!, {
    enabled: isEditing,
    refetchOnMount: true,
  });
  
  const existingConfig = corsConfigResponse?.resource;
  
  // Form configuration with dynamic schema based on operation type
  const formSchema = useMemo(() => {
    return isEditing ? corsConfigUpdateSchema : corsConfigCreateSchema;
  }, [isEditing]);
  
  // Form default values
  const defaultValues = useMemo(() => {
    if (isEditing && existingConfig) {
      return {
        id: existingConfig.id,
        description: existingConfig.description,
        enabled: existingConfig.enabled,
        path: existingConfig.path,
        origin: existingConfig.origin,
        method: existingConfig.method,
        header: existingConfig.header,
        exposedHeader: existingConfig.exposedHeader || '',
        maxAge: existingConfig.maxAge,
        supportsCredentials: existingConfig.supportsCredentials,
      } satisfies CorsConfigUpdateForm;
    } else {
      return {
        description: '',
        enabled: DEFAULT_CORS_CONFIG.enabled!,
        path: DEFAULT_CORS_CONFIG.path!,
        origin: DEFAULT_CORS_CONFIG.origin!,
        method: DEFAULT_CORS_CONFIG.method!,
        header: DEFAULT_CORS_CONFIG.header!,
        exposedHeader: DEFAULT_CORS_CONFIG.exposedHeader!,
        maxAge: DEFAULT_CORS_CONFIG.maxAge!,
        supportsCredentials: DEFAULT_CORS_CONFIG.supportsCredentials!,
      } satisfies CorsConfigCreateForm;
    }
  }, [isEditing, existingConfig]);
  
  // Initialize form with performance monitoring
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange', // Enable real-time validation
    revalidateMode: 'onChange',
    shouldFocusError: true,
    criteriaMode: 'all',
  });
  
  const {
    control,
    handleSubmit,
    reset,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { 
      errors, 
      isValid, 
      isDirty, 
      isValidating,
      touchedFields,
    },
  } = form;
  
  // Watch form values for auto-save and live validation
  const watchedValues = useWatch({ control });
  const enabledValue = useWatch({ control, name: 'enabled' });
  const methodsValue = useWatch({ control, name: 'method' });
  const supportsCredentialsValue = useWatch({ control, name: 'supportsCredentials' });
  
  // Performance monitoring for validation times
  const trackValidationPerformance = useCallback((startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setValidationMetrics(prev => {
      const newCount = prev.validationCount + 1;
      const newAverage = (prev.averageValidationTime * prev.validationCount + duration) / newCount;
      const newExceededCount = prev.exceededThresholdCount + (isValidationSlow(duration) ? 1 : 0);
      
      // Log performance warning if validation is slow
      if (isValidationSlow(duration)) {
        console.warn(
          `[CorsConfigDetails] Validation exceeded ${FORM_CONFIG.VALIDATION_TIMEOUT}ms threshold: ${formatValidationTime(duration)}`
        );
      }
      
      return {
        lastValidationTime: duration,
        averageValidationTime: newAverage,
        validationCount: newCount,
        exceededThresholdCount: newExceededCount,
      };
    });
  }, []);
  
  // Trigger validation with performance monitoring
  const validateWithMetrics = useCallback(async (fieldName?: string) => {
    const startTime = performance.now();
    const result = await trigger(fieldName as any);
    trackValidationPerformance(startTime);
    return result;
  }, [trigger, trackValidationPerformance]);
  
  // Mutation hooks for create and update operations
  const createMutation = useCorsCreate({
    onSuccess: (response) => {
      setIsSubmitting(false);
      onSuccess?.(response.resource);
      
      // Navigate to CORS list if no success callback provided
      if (!onSuccess) {
        router.push('/adf-config/df-cors');
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error('[CorsConfigDetails] Create failed:', error);
    },
  });
  
  const updateMutation = useCorsUpdate({
    onSuccess: (response) => {
      setIsSubmitting(false);
      reset(response.resource);
      onSuccess?.(response.resource);
      
      // Navigate to CORS list if no success callback provided
      if (!onSuccess) {
        router.push('/adf-config/df-cors');
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      console.error('[CorsConfigDetails] Update failed:', error);
    },
  });
  
  // Form submission handler
  const onSubmit: SubmitHandler<FormData> = useCallback(async (data) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data as CorsConfigUpdateForm);
      } else {
        await createMutation.mutateAsync(data as CorsConfigCreateForm);
      }
    } catch (error) {
      setIsSubmitting(false);
      // Error is handled by mutation onError callbacks
    }
  }, [isEditing, createMutation, updateMutation]);
  
  // Navigation handlers
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/adf-config/df-cors');
    }
  }, [onCancel, router]);
  
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // Reset form when existing config loads
  useEffect(() => {
    if (existingConfig && isEditing) {
      reset(defaultValues);
    }
  }, [existingConfig, defaultValues, isEditing, reset]);
  
  // Auto-save functionality for form persistence
  useEffect(() => {
    if (!isDirty || !isValid) return;
    
    const timeoutId = setTimeout(() => {
      const values = getValues();
      try {
        localStorage.setItem(
          `cors-config-draft-${corsId || 'new'}`,
          JSON.stringify(values)
        );
      } catch (error) {
        console.warn('[CorsConfigDetails] Failed to auto-save:', error);
      }
    }, FORM_CONFIG.AUTO_SAVE_DELAY);
    
    return () => clearTimeout(timeoutId);
  }, [watchedValues, isDirty, isValid, getValues, corsId]);
  
  // Load auto-saved draft for new configurations
  useEffect(() => {
    if (!isEditing) {
      try {
        const draft = localStorage.getItem('cors-config-draft-new');
        if (draft) {
          const savedValues = JSON.parse(draft);
          reset(savedValues);
        }
      } catch (error) {
        console.warn('[CorsConfigDetails] Failed to load draft:', error);
      }
    }
  }, [isEditing, reset]);
  
  // HTTP method toggle handler
  const handleMethodToggle = useCallback((method: HttpMethod, checked: boolean) => {
    const currentMethods = getValues('method') || [];
    const updatedMethods = checked
      ? [...currentMethods, method].filter((m, i, arr) => arr.indexOf(m) === i)
      : currentMethods.filter(m => m !== method);
    
    setValue('method', updatedMethods, { 
      shouldValidate: true, 
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Trigger validation with performance monitoring
    validateWithMetrics('method');
  }, [getValues, setValue, validateWithMetrics]);
  
  // Header suggestions handler
  const handleHeaderSuggestion = useCallback((header: string) => {
    const currentHeaders = getValues('header') || '';
    const headers = currentHeaders.split(',').map(h => h.trim()).filter(Boolean);
    
    if (!headers.includes(header)) {
      const newHeaders = [...headers, header].join(', ');
      setValue('header', newHeaders, { 
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true,
      });
      validateWithMetrics('header');
    }
  }, [getValues, setValue, validateWithMetrics]);
  
  // Show loading state while fetching existing config
  if (isEditing && (isLoadingConfig || !existingConfig)) {
    return (
      <div 
        className="flex items-center justify-center min-h-[400px]"
        data-testid={`${testId}-loading`}
        role="status"
        aria-label="Loading CORS configuration"
      >
        <div className="flex items-center space-x-3">
          <svg
            className="animate-spin h-6 w-6 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Loading CORS configuration...
          </span>
        </div>
      </div>
    );
  }
  
  // Show error state if config loading failed
  if (isEditing && loadError) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-[400px] space-y-4"
        data-testid={`${testId}-error`}
        role="alert"
      >
        <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load CORS Configuration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {loadError.message || 'An error occurred while loading the CORS configuration.'}
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleBack}
              data-testid={`${testId}-back-button`}
            >
              <ChevronLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              data-testid={`${testId}-retry-button`}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn(
        'w-full max-w-4xl mx-auto space-y-6',
        className
      )}
      data-testid={testId}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
              data-testid={`${testId}-back-nav`}
              aria-label="Go back to previous page"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit CORS Configuration' : 'Create CORS Configuration'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isEditing 
                ? 'Modify the cross-origin resource sharing settings for this entry.'
                : 'Configure cross-origin resource sharing settings for your API endpoints.'
              }
            </p>
          </div>
        </div>
        
        {/* Configuration Status Indicator */}
        {isEditing && existingConfig && (
          <div 
            className={cn(
              'flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium',
              existingConfig.enabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            )}
            data-testid={`${testId}-status-indicator`}
            aria-label={`CORS configuration is currently ${existingConfig.enabled ? 'enabled' : 'disabled'}`}
          >
            {existingConfig.enabled ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <X className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{existingConfig.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        )}
      </div>
      
      {/* Main Form */}
      <Form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
        data-testid={`${testId}-form`}
        aria-label={`${isEditing ? 'Edit' : 'Create'} CORS configuration form`}
      >
        {/* Basic Configuration Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Globe className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Basic Configuration
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description Field */}
            <div className="md:col-span-2">
              <label 
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description <span className="text-red-500" aria-label="required">*</span>
              </label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="e.g., Allow frontend app access to API"
                maxLength={FORM_CONFIG.MAX_DESCRIPTION_LENGTH}
                error={!!errors.description}
                aria-describedby={errors.description ? 'description-error' : 'description-help'}
                data-testid={`${testId}-description-input`}
              />
              {errors.description && (
                <p 
                  id="description-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.description.message}
                </p>
              )}
              <p 
                id="description-help"
                className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                Provide a clear description of what this CORS configuration is for.
              </p>
            </div>
            
            {/* Enabled Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="enabled"
                  {...form.register('enabled')}
                  checked={enabledValue}
                  onCheckedChange={(checked) => {
                    setValue('enabled', checked as boolean, { 
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                  data-testid={`${testId}-enabled-checkbox`}
                  aria-describedby="enabled-help"
                />
                <label 
                  htmlFor="enabled"
                  className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                >
                  Enable this CORS configuration
                </label>
              </div>
              <p 
                id="enabled-help"
                className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                Disabled configurations will not apply to requests.
              </p>
            </div>
            
            {/* Path Pattern */}
            <div>
              <label 
                htmlFor="path"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Path Pattern <span className="text-red-500" aria-label="required">*</span>
              </label>
              <Input
                id="path"
                {...form.register('path')}
                placeholder="e.g., /api/*, /*"
                maxLength={FORM_CONFIG.MAX_PATH_LENGTH}
                error={!!errors.path}
                aria-describedby={errors.path ? 'path-error' : 'path-help'}
                data-testid={`${testId}-path-input`}
              />
              {errors.path && (
                <p 
                  id="path-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.path.message}
                </p>
              )}
              <div id="path-help" className="mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  URL path pattern this CORS rule applies to. Supports wildcards (*).
                </p>
                <div className="flex flex-wrap gap-1">
                  {PATH_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setValue('path', suggestion, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        validateWithMetrics('path');
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      data-testid={`${testId}-path-suggestion-${suggestion.replace(/[/*]/g, '-')}`}
                      aria-label={`Set path pattern to ${suggestion}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Origin */}
            <div>
              <label 
                htmlFor="origin"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Allowed Origins <span className="text-red-500" aria-label="required">*</span>
              </label>
              <Input
                id="origin"
                {...form.register('origin')}
                placeholder="e.g., https://example.com, *"
                maxLength={FORM_CONFIG.MAX_ORIGIN_LENGTH}
                error={!!errors.origin}
                aria-describedby={errors.origin ? 'origin-error' : 'origin-help'}
                data-testid={`${testId}-origin-input`}
              />
              {errors.origin && (
                <p 
                  id="origin-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.origin.message}
                </p>
              )}
              <div id="origin-help" className="mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Domain(s) allowed to make cross-origin requests. Use * for all origins.
                </p>
                <div className="flex flex-wrap gap-1">
                  {ORIGIN_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setValue('origin', suggestion, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                        validateWithMetrics('origin');
                      }}
                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      data-testid={`${testId}-origin-suggestion-${suggestion.replace(/[*:.]/g, '-')}`}
                      aria-label={`Set origin to ${suggestion}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* HTTP Methods Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TestTube className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              HTTP Methods
            </h2>
          </div>
          
          <div 
            role="group"
            aria-labelledby="methods-label"
            aria-describedby="methods-description"
            data-testid={`${testId}-methods-group`}
          >
            <div 
              id="methods-label"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Allowed HTTP Methods <span className="text-red-500" aria-label="required">*</span>
            </div>
            <div 
              id="methods-description"
              className="text-xs text-gray-500 dark:text-gray-400 mb-4"
            >
              Select the HTTP methods that should be allowed for cross-origin requests.
              <span className="sr-only">
                {createMethodsDescription(methodsValue || [])}
              </span>
            </div>
            
            {errors.method && (
              <p 
                className="mb-4 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {errors.method.message}
              </p>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HTTP_METHODS.map((method) => (
                <div 
                  key={method}
                  className="flex items-start space-x-3"
                >
                  <Checkbox
                    id={`method-${method}`}
                    checked={methodsValue?.includes(method) || false}
                    onCheckedChange={(checked) => handleMethodToggle(method, checked as boolean)}
                    data-testid={`${testId}-method-${method.toLowerCase()}`}
                    aria-describedby={`method-${method}-description`}
                  />
                  <div className="flex-1">
                    <label 
                      htmlFor={`method-${method}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                    >
                      {method}
                    </label>
                    <p 
                      id={`method-${method}-description`}
                      className="text-xs text-gray-500 dark:text-gray-400"
                    >
                      {HTTP_METHOD_LABELS[method]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Headers Configuration Section */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Headers Configuration
            </h2>
          </div>
          
          <div className="space-y-6">
            {/* Allowed Headers */}
            <div>
              <label 
                htmlFor="header"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Allowed Headers
              </label>
              <Textarea
                id="header"
                {...form.register('header')}
                placeholder="Content-Type, Authorization, X-Requested-With"
                maxLength={FORM_CONFIG.MAX_HEADERS_LENGTH}
                rows={3}
                error={!!errors.header}
                aria-describedby={errors.header ? 'header-error' : 'header-help'}
                data-testid={`${testId}-header-textarea`}
              />
              {errors.header && (
                <p 
                  id="header-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {errors.header.message}
                </p>
              )}
              <div id="header-help" className="mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Comma-separated list of headers that can be used during the actual request.
                </p>
                <div className="flex flex-wrap gap-1">
                  {COMMON_CORS_HEADERS.map((header) => (
                    <button
                      key={header}
                      type="button"
                      onClick={() => handleHeaderSuggestion(header)}
                      className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      data-testid={`${testId}-header-suggestion-${header.toLowerCase().replace(/[^a-z]/g, '-')}`}
                      aria-label={`Add ${header} to allowed headers`}
                    >
                      {header}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Advanced Options Toggle */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center space-x-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                data-testid={`${testId}-advanced-toggle`}
                aria-expanded={showAdvancedOptions}
                aria-controls="advanced-options"
              >
                <span>{showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options</span>
                <svg
                  className={cn(
                    'h-4 w-4 transition-transform',
                    showAdvancedOptions && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            
            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div 
                id="advanced-options"
                className="space-y-6 border-l-2 border-primary-200 dark:border-primary-800 pl-4"
                data-testid={`${testId}-advanced-options`}
              >
                {/* Exposed Headers */}
                <div>
                  <label 
                    htmlFor="exposedHeader"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Exposed Headers
                  </label>
                  <Textarea
                    id="exposedHeader"
                    {...form.register('exposedHeader')}
                    placeholder="X-Total-Count, X-Page-Size"
                    maxLength={FORM_CONFIG.MAX_HEADERS_LENGTH}
                    rows={2}
                    error={!!errors.exposedHeader}
                    aria-describedby={errors.exposedHeader ? 'exposedHeader-error' : 'exposedHeader-help'}
                    data-testid={`${testId}-exposed-header-textarea`}
                  />
                  {errors.exposedHeader && (
                    <p 
                      id="exposedHeader-error"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {errors.exposedHeader.message}
                    </p>
                  )}
                  <p 
                    id="exposedHeader-help"
                    className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                  >
                    Headers that browsers are allowed to access from JavaScript.
                  </p>
                </div>
                
                {/* Max Age */}
                <div>
                  <label 
                    htmlFor="maxAge"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Cache Duration (Max Age)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="maxAge"
                      type="number"
                      {...form.register('maxAge', { valueAsNumber: true })}
                      min={FORM_CONFIG.MIN_MAX_AGE}
                      max={FORM_CONFIG.MAX_MAX_AGE}
                      error={!!errors.maxAge}
                      aria-describedby={errors.maxAge ? 'maxAge-error' : 'maxAge-help'}
                      data-testid={`${testId}-max-age-input`}
                      className="w-32"
                    />
                    <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">seconds</span>
                  </div>
                  {errors.maxAge && (
                    <p 
                      id="maxAge-error"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {errors.maxAge.message}
                    </p>
                  )}
                  <p 
                    id="maxAge-help"
                    className="mt-1 text-xs text-gray-500 dark:text-gray-400"
                  >
                    How long (in seconds) browsers can cache preflight response. Default: 3600 (1 hour).
                  </p>
                </div>
                
                {/* Supports Credentials */}
                <div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="supportsCredentials"
                      {...form.register('supportsCredentials')}
                      checked={supportsCredentialsValue}
                      onCheckedChange={(checked) => {
                        setValue('supportsCredentials', checked as boolean, { 
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                      data-testid={`${testId}-credentials-checkbox`}
                      aria-describedby="credentials-help"
                    />
                    <label 
                      htmlFor="supportsCredentials"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Support Credentials
                    </label>
                  </div>
                  <p 
                    id="credentials-help"
                    className="mt-1 text-xs text-gray-500 dark:text-gray-400 pl-7"
                  >
                    Allow cookies, authorization headers, and TLS client certificates to be included in cross-origin requests.
                    <strong className="text-orange-600 dark:text-orange-400 block mt-1">
                      Warning: Cannot be used with wildcard origins (*) for security reasons.
                    </strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Validation Performance Indicator (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <div>
                  Validation: {formatValidationTime(validationMetrics.lastValidationTime)}
                  {isValidationSlow(validationMetrics.lastValidationTime) && (
                    <span className="text-orange-500 ml-1">⚠️</span>
                  )}
                </div>
                {validationMetrics.validationCount > 0 && (
                  <div>
                    Avg: {formatValidationTime(validationMetrics.averageValidationTime)} 
                    ({validationMetrics.validationCount} validations)
                  </div>
                )}
              </div>
            )}
            
            {/* Form Status */}
            {isDirty && (
              <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                  aria-hidden="true"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              data-testid={`${testId}-cancel-button`}
            >
              Cancel
            </Button>
            
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="min-w-[120px]"
              data-testid={`${testId}-submit-button`}
              aria-describedby="submit-help"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  {isEditing ? 'Update Configuration' : 'Create Configuration'}
                </>
              )}
            </Button>
          </div>
          
          {/* Screen reader submit help */}
          <p id="submit-help" className="sr-only">
            {isValid 
              ? `Ready to ${isEditing ? 'update' : 'create'} CORS configuration`
              : 'Please fix validation errors before submitting'
            }
          </p>
        </div>
      </Form>
    </div>
  );
}

// Export default component
export default CorsConfigDetails;

/**
 * Export component metadata for testing and documentation
 */
export const CorsConfigDetailsMeta = {
  name: 'CorsConfigDetails',
  description: 'CORS configuration details form component',
  version: '1.0.0',
  accessibility: {
    wcag: '2.1 AA',
    features: [
      'Keyboard navigation',
      'Screen reader support',
      'Focus management',
      'ARIA attributes',
      'High contrast support',
      'Minimum touch targets',
    ],
  },
  performance: {
    validation: '<100ms',
    rendering: 'Optimized with React 19',
    bundle: 'Tree-shakeable',
  },
  dependencies: [
    'react-hook-form',
    'zod',
    '@hookform/resolvers/zod',
    'lucide-react',
    'next/navigation',
  ],
};