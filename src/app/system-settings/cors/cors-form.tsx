'use client';

/**
 * React CORS configuration form component implementing React Hook Form with Zod validation.
 * 
 * Provides comprehensive form interface for creating and editing CORS policies including
 * origins, methods, headers, credentials, and age settings with real-time validation.
 * Converts Angular DfCorsConfigDetailsComponent functionality to modern React patterns
 * with Tailwind CSS styling and error handling.
 * 
 * @fileoverview CORS configuration form component
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  CorsConfig, 
  CorsConfigCreate, 
  CorsConfigUpdate,
  HTTP_METHODS,
  DEFAULT_CORS_CONFIG 
} from '@/types/cors';
import { apiPost, apiPut } from '@/lib/api-client';

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Zod schema for CORS configuration form validation
 * Implements comprehensive validation with real-time feedback under 100ms
 */
const corsFormSchema = z.object({
  path: z.string()
    .min(1, 'Path is required')
    .max(255, 'Path must be less than 255 characters')
    .regex(/^\/.*/, 'Path must start with /'),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  
  origins: z.string()
    .min(1, 'Origins are required')
    .max(1000, 'Origins must be less than 1000 characters'),
  
  headers: z.string()
    .min(1, 'Headers are required')
    .max(1000, 'Headers must be less than 1000 characters'),
  
  exposedHeaders: z.string()
    .max(1000, 'Exposed headers must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  
  maxAge: z.number()
    .min(0, 'Max age must be 0 or greater')
    .max(86400, 'Max age must be less than 24 hours (86400 seconds)'),
  
  methods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']))
    .min(1, 'At least one HTTP method must be selected')
    .max(HTTP_METHODS.length, 'Too many methods selected'),
  
  credentials: z.boolean(),
  
  enabled: z.boolean(),
});

type CorsFormData = z.infer<typeof corsFormSchema>;

// ============================================================================
// Component Props Interface
// ============================================================================

interface CorsFormProps {
  /** Existing CORS configuration for edit mode */
  corsConfig?: CorsConfig;
  /** Form mode - create or edit */
  mode: 'create' | 'edit';
  /** Callback fired on successful form submission */
  onSuccess?: (config: CorsConfig) => void;
  /** Callback fired on form cancellation */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CORS configuration form component with React Hook Form and Zod validation
 */
export default function CorsForm({
  corsConfig,
  mode = 'create',
  onSuccess,
  onCancel,
  className = ''
}: CorsFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAllMethodsSelected, setIsAllMethodsSelected] = useState(false);

  // ========================================================================
  // Form Setup with React Hook Form and Zod
  // ========================================================================

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty, isValid },
    reset,
    clearErrors
  } = useForm<CorsFormData>({
    resolver: zodResolver(corsFormSchema),
    defaultValues: corsConfig ? {
      path: corsConfig.path,
      description: corsConfig.description || '',
      origins: corsConfig.origin,
      headers: corsConfig.header,
      exposedHeaders: corsConfig.exposedHeader || '',
      maxAge: corsConfig.maxAge,
      methods: corsConfig.method as typeof HTTP_METHODS[number][],
      credentials: corsConfig.supportsCredentials,
      enabled: corsConfig.enabled,
    } : {
      path: DEFAULT_CORS_CONFIG.path || '/*',
      description: '',
      origins: DEFAULT_CORS_CONFIG.origin || '*',
      headers: DEFAULT_CORS_CONFIG.header || 'Content-Type, X-Requested-With, Authorization',
      exposedHeaders: DEFAULT_CORS_CONFIG.exposedHeader || '',
      maxAge: DEFAULT_CORS_CONFIG.maxAge || 3600,
      methods: DEFAULT_CORS_CONFIG.method as typeof HTTP_METHODS[number][] || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: DEFAULT_CORS_CONFIG.supportsCredentials || false,
      enabled: DEFAULT_CORS_CONFIG.enabled !== false,
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch methods to track all methods selection
  const watchedMethods = watch('methods');

  useEffect(() => {
    setIsAllMethodsSelected(watchedMethods?.length === HTTP_METHODS.length);
  }, [watchedMethods]);

  // ========================================================================
  // API Mutations with React Query
  // ========================================================================

  const createCorsMutation = useMutation({
    mutationFn: async (data: CorsConfigCreate): Promise<CorsConfig> => {
      const response = await apiPost<{ resource: CorsConfig[] }>('/system/cors', {
        resource: [data]
      });
      return response.resource[0];
    },
    onSuccess: (newConfig) => {
      // Invalidate and refetch CORS list
      queryClient.invalidateQueries({ queryKey: ['cors'] });
      // Reset form state
      reset();
      setSubmitError(null);
      // Call success callback
      onSuccess?.(newConfig);
      // Navigate to the new CORS config
      router.push(`/system-settings/cors/${newConfig.id}`);
    },
    onError: (error: any) => {
      console.error('CORS creation failed:', error);
      let errorMessage = 'Failed to create CORS configuration';
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error?.context?.resource?.[0]?.message) {
          errorMessage = errorData.error.context.resource[0].message;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Keep default error message
      }
      
      setSubmitError(errorMessage);
    },
  });

  const updateCorsMutation = useMutation({
    mutationFn: async (data: CorsConfigUpdate): Promise<CorsConfig> => {
      if (!corsConfig?.id) {
        throw new Error('CORS configuration ID is required for updates');
      }
      return apiPut<CorsConfig>(`/system/cors/${corsConfig.id}`, data);
    },
    onSuccess: (updatedConfig) => {
      // Invalidate and refetch CORS list and individual config
      queryClient.invalidateQueries({ queryKey: ['cors'] });
      queryClient.invalidateQueries({ queryKey: ['cors', updatedConfig.id] });
      // Reset form dirty state
      reset(undefined, { keepValues: true });
      setSubmitError(null);
      // Call success callback
      onSuccess?.(updatedConfig);
      // Navigate to the updated CORS config
      router.push(`/system-settings/cors/${updatedConfig.id}`);
    },
    onError: (error: any) => {
      console.error('CORS update failed:', error);
      let errorMessage = 'Failed to update CORS configuration';
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Keep default error message
      }
      
      setSubmitError(errorMessage);
    },
  });

  // ========================================================================
  // Form Handlers
  // ========================================================================

  const onSubmit = useCallback((data: CorsFormData) => {
    setSubmitError(null);
    clearErrors();

    const payload = {
      path: data.path,
      description: data.description || '',
      origin: data.origins,
      header: data.headers,
      exposedHeader: data.exposedHeaders || '',
      maxAge: data.maxAge,
      method: data.methods,
      supportsCredentials: data.credentials,
      enabled: data.enabled,
    };

    if (mode === 'create') {
      createCorsMutation.mutate(payload);
    } else if (corsConfig?.id) {
      updateCorsMutation.mutate({
        id: corsConfig.id,
        ...payload,
      });
    }
  }, [mode, corsConfig?.id, createCorsMutation, updateCorsMutation, clearErrors]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    router.back();
  }, [onCancel, router]);

  const handleToggleAllMethods = useCallback(() => {
    if (isAllMethodsSelected) {
      setValue('methods', ['GET'], { shouldDirty: true, shouldValidate: true });
    } else {
      setValue('methods', [...HTTP_METHODS], { shouldDirty: true, shouldValidate: true });
    }
  }, [isAllMethodsSelected, setValue]);

  const isLoading = createCorsMutation.isPending || updateCorsMutation.isPending;

  // ========================================================================
  // Render Component
  // ========================================================================

  return (
    <div className={`cors-form-container ${className}`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {mode === 'create' ? 'Create CORS Configuration' : 'Edit CORS Configuration'}
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Configure Cross-Origin Resource Sharing (CORS) rules for your API endpoints.
        </p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {submitError}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="inline-flex rounded-md bg-red-50 dark:bg-red-900/20 p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            
            {/* Path Field */}
            <div className="sm:col-span-2">
              <Controller
                name="path"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="path" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Path <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        {...field}
                        type="text"
                        id="path"
                        placeholder="/*"
                        className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.path ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        aria-invalid={errors.path ? 'true' : 'false'}
                        aria-describedby={errors.path ? 'path-error' : undefined}
                      />
                    </div>
                    {errors.path && (
                      <p id="path-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.path.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Origins Field */}
            <div>
              <Controller
                name="origins"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="origins" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Origins <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        {...field}
                        type="text"
                        id="origins"
                        placeholder="*"
                        className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.origins ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        aria-invalid={errors.origins ? 'true' : 'false'}
                        aria-describedby={errors.origins ? 'origins-error' : undefined}
                      />
                    </div>
                    {errors.origins && (
                      <p id="origins-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.origins.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Max Age Field */}
            <div>
              <Controller
                name="maxAge"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                  <div>
                    <label htmlFor="maxAge" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Age (seconds)
                    </label>
                    <div className="mt-1">
                      <input
                        {...field}
                        type="number"
                        id="maxAge"
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
                        min="0"
                        max="86400"
                        className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.maxAge ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        aria-invalid={errors.maxAge ? 'true' : 'false'}
                        aria-describedby={errors.maxAge ? 'maxAge-error' : undefined}
                      />
                    </div>
                    {errors.maxAge && (
                      <p id="maxAge-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.maxAge.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Description Field */}
            <div className="sm:col-span-2">
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        {...field}
                        id="description"
                        rows={3}
                        placeholder="Optional description for this CORS configuration"
                        className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        aria-invalid={errors.description ? 'true' : 'false'}
                        aria-describedby={errors.description ? 'description-error' : undefined}
                      />
                    </div>
                    {errors.description && (
                      <p id="description-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Headers Field */}
            <div>
              <Controller
                name="headers"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="headers" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Headers <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        {...field}
                        type="text"
                        id="headers"
                        placeholder="Content-Type, X-Requested-With, Authorization"
                        className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.headers ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        aria-invalid={errors.headers ? 'true' : 'false'}
                        aria-describedby={errors.headers ? 'headers-error' : undefined}
                      />
                    </div>
                    {errors.headers && (
                      <p id="headers-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.headers.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Exposed Headers Field */}
            <div>
              <Controller
                name="exposedHeaders"
                control={control}
                render={({ field }) => (
                  <div>
                    <label htmlFor="exposedHeaders" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Exposed Headers
                    </label>
                    <div className="mt-1">
                      <input
                        {...field}
                        type="text"
                        id="exposedHeaders"
                        placeholder="Optional exposed headers"
                        className={`block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.exposedHeaders ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        aria-invalid={errors.exposedHeaders ? 'true' : 'false'}
                        aria-describedby={errors.exposedHeaders ? 'exposedHeaders-error' : undefined}
                      />
                    </div>
                    {errors.exposedHeaders && (
                      <p id="exposedHeaders-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.exposedHeaders.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* HTTP Methods Field */}
            <div className="sm:col-span-2">
              <Controller
                name="methods"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        HTTP Methods <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleAllMethods}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none focus:underline"
                      >
                        {isAllMethodsSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {HTTP_METHODS.map((method) => (
                        <div key={method} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`method-${method}`}
                            checked={value.includes(method)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onChange([...value, method]);
                              } else {
                                onChange(value.filter(m => m !== method));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor={`method-${method}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {method}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.methods && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        {errors.methods.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Boolean Fields */}
            <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Supports Credentials */}
              <div className="flex items-center">
                <Controller
                  name="credentials"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <>
                      <input
                        type="checkbox"
                        id="credentials"
                        checked={value}
                        onChange={onChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="credentials" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Support Credentials
                      </label>
                    </>
                  )}
                />
              </div>

              {/* Enabled */}
              <div className="flex items-center">
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <>
                      <input
                        type="checkbox"
                        id="enabled"
                        checked={value}
                        onChange={onChange}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="enabled" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Enabled
                      </label>
                    </>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              mode === 'create' ? 'Create CORS Configuration' : 'Update CORS Configuration'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}