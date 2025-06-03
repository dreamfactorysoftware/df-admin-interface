/**
 * CORS Configuration Details Form Component
 * 
 * React functional component for CORS configuration details form, implementing
 * React Hook Form with Zod validation for creating and editing CORS entries.
 * Provides comprehensive form controls for path, origins, methods, headers, and
 * credentials configuration with real-time validation under 100ms and accessibility
 * features including keyboard navigation and screen reader support.
 * 
 * Features:
 * - React Hook Form with Zod schema validation per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - WCAG 2.1 AA compliance with focus management per Section 7.6.4 accessibility requirements
 * - User feedback systems with loading and error states per Section 7.6.3
 * - SWR/React Query hooks for CORS configuration management per Section 4.3 state management workflows
 * - Next.js useRouter hook for navigation per Section 4.1 system workflows
 * - Comprehensive accessibility features with ARIA labels and keyboard navigation
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2, Loader2, Save, ArrowLeft, Plus, X, Info } from 'lucide-react';

// Import UI components (when available)
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Checkbox } from '../../../components/ui/checkbox';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '../../../components/ui/form';

// Import hooks and utilities
import { useCorsOperations } from './use-cors-operations';
import { CorsConfigSchema } from '../../../lib/validations/cors';
import type { CorsConfigData } from '../../../types/cors';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * CORS Configuration Form Data
 * Extends base schema with additional UI state management
 */
type CorsConfigFormData = z.infer<typeof CorsConfigSchema> & {
  id?: number;
  path?: string;
  description?: string;
};

/**
 * Component Props Interface
 */
interface CorsConfigDetailsProps {
  /**
   * CORS configuration ID for editing (undefined for creating new)
   */
  corsId?: number;
  
  /**
   * Initial data for form (useful for defaults or editing)
   */
  initialData?: Partial<CorsConfigData>;
  
  /**
   * Callback fired when form is successfully submitted
   */
  onSuccess?: (data: CorsConfigData) => void;
  
  /**
   * Callback fired when user cancels or navigates away
   */
  onCancel?: () => void;
  
  /**
   * Whether to show header and navigation controls
   */
  standalone?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

/**
 * HTTP Methods enum for CORS configuration
 */
const HTTP_METHODS = [
  { value: 'GET', label: 'GET', description: 'Retrieve data' },
  { value: 'POST', label: 'POST', description: 'Create new resources' },
  { value: 'PUT', label: 'PUT', description: 'Update existing resources' },
  { value: 'PATCH', label: 'PATCH', description: 'Partial updates' },
  { value: 'DELETE', label: 'DELETE', description: 'Remove resources' },
  { value: 'OPTIONS', label: 'OPTIONS', description: 'CORS preflight requests' },
  { value: 'HEAD', label: 'HEAD', description: 'Retrieve headers only' },
] as const;

/**
 * Common CORS headers for auto-suggestion
 */
const COMMON_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Accept-Language',
  'Cache-Control',
  'Content-Language',
  'Content-Length',
  'Content-Range',
  'Content-Encoding',
  'Date',
  'ETag',
  'Expires',
  'Last-Modified',
  'Location',
  'Range',
  'User-Agent',
  'X-API-Key',
  'X-Custom-Header',
] as const;

/**
 * Default form values with sensible CORS defaults
 */
const DEFAULT_FORM_VALUES: Partial<CorsConfigFormData> = {
  enabled: true,
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  allowCredentials: false,
  maxAge: 3600, // 1 hour
  path: '/*',
  description: '',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * CORS Configuration Details Form Component
 */
export function CorsConfigDetails({
  corsId,
  initialData,
  onSuccess,
  onCancel,
  standalone = true,
  className,
}: CorsConfigDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [newOriginInput, setNewOriginInput] = useState('');
  const [newHeaderInput, setNewHeaderInput] = useState('');
  const [newExposedHeaderInput, setNewExposedHeaderInput] = useState('');

  // CORS operations hook with SWR/React Query integration
  const {
    corsConfigurations,
    isLoading,
    error,
    createCors,
    updateCors,
    isCreating,
    isUpdating,
  } = useCorsOperations({
    refetchOnFocus: false,
    optimisticUpdates: true,
    onError: (error) => {
      console.error('CORS operation failed:', error);
    },
    onSuccess: (data) => {
      console.log('CORS operation succeeded:', data);
    },
  });

  // Determine if we're editing an existing CORS configuration
  const isEditing = Boolean(corsId);
  const editingConfig = useMemo(() => {
    if (!isEditing || !corsConfigurations) return null;
    return corsConfigurations.find(config => config.id === corsId) || null;
  }, [corsId, corsConfigurations, isEditing]);

  // Form setup with React Hook Form and Zod validation
  const form = useForm<CorsConfigFormData>({
    resolver: zodResolver(CorsConfigSchema),
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...initialData,
      ...editingConfig,
    },
    mode: 'onChange', // Real-time validation under 100ms
  });

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    getValues,
    reset,
    watch,
  } = form;

  // Watch form values for real-time updates
  const watchedValues = useWatch({ control });
  const allowedOrigins = watch('allowedOrigins', []);
  const allowedHeaders = watch('allowedHeaders', []);
  const exposedHeaders = watch('exposedHeaders', []);
  const allowedMethods = watch('allowedMethods', []);

  // =============================================================================
  // FORM HANDLERS
  // =============================================================================

  /**
   * Handle form submission with validation and API call
   */
  const onSubmit = useCallback(async (data: CorsConfigFormData) => {
    startTransition(async () => {
      try {
        let result;
        
        if (isEditing && corsId) {
          // Update existing CORS configuration
          result = await updateCors.mutateAsync({
            id: corsId,
            ...data,
          });
        } else {
          // Create new CORS configuration
          result = await createCors.mutateAsync({
            resource: [data],
          });
        }

        if (result.success) {
          // Call success callback if provided
          onSuccess?.(result.data!);
          
          // Navigate back to CORS list if standalone
          if (standalone) {
            router.push('/adf-config/df-cors');
          }
        } else {
          throw new Error(result.error || 'Failed to save CORS configuration');
        }
      } catch (error) {
        console.error('Failed to save CORS configuration:', error);
        // Error handling is managed by the mutation hook
      }
    });
  }, [corsId, isEditing, updateCors, createCors, onSuccess, standalone, router]);

  /**
   * Handle cancel action with navigation
   */
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else if (standalone) {
      router.push('/adf-config/df-cors');
    }
  }, [onCancel, standalone, router]);

  /**
   * Reset form to default values
   */
  const handleReset = useCallback(() => {
    reset({
      ...DEFAULT_FORM_VALUES,
      ...initialData,
      ...editingConfig,
    });
  }, [reset, initialData, editingConfig]);

  // =============================================================================
  // DYNAMIC FIELD HANDLERS
  // =============================================================================

  /**
   * Add new origin to allowed origins list
   */
  const addOrigin = useCallback(() => {
    if (newOriginInput.trim()) {
      const currentOrigins = getValues('allowedOrigins') || [];
      if (!currentOrigins.includes(newOriginInput.trim())) {
        setValue('allowedOrigins', [...currentOrigins, newOriginInput.trim()], {
          shouldValidate: true,
          shouldDirty: true,
        });
        setNewOriginInput('');
      }
    }
  }, [newOriginInput, getValues, setValue]);

  /**
   * Remove origin from allowed origins list
   */
  const removeOrigin = useCallback((index: number) => {
    const currentOrigins = getValues('allowedOrigins') || [];
    setValue('allowedOrigins', currentOrigins.filter((_, i) => i !== index), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [getValues, setValue]);

  /**
   * Add new header to allowed headers list
   */
  const addHeader = useCallback(() => {
    if (newHeaderInput.trim()) {
      const currentHeaders = getValues('allowedHeaders') || [];
      if (!currentHeaders.includes(newHeaderInput.trim())) {
        setValue('allowedHeaders', [...currentHeaders, newHeaderInput.trim()], {
          shouldValidate: true,
          shouldDirty: true,
        });
        setNewHeaderInput('');
      }
    }
  }, [newHeaderInput, getValues, setValue]);

  /**
   * Remove header from allowed headers list
   */
  const removeHeader = useCallback((index: number) => {
    const currentHeaders = getValues('allowedHeaders') || [];
    setValue('allowedHeaders', currentHeaders.filter((_, i) => i !== index), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [getValues, setValue]);

  /**
   * Add new exposed header
   */
  const addExposedHeader = useCallback(() => {
    if (newExposedHeaderInput.trim()) {
      const currentHeaders = getValues('exposedHeaders') || [];
      if (!currentHeaders.includes(newExposedHeaderInput.trim())) {
        setValue('exposedHeaders', [...currentHeaders, newExposedHeaderInput.trim()], {
          shouldValidate: true,
          shouldDirty: true,
        });
        setNewExposedHeaderInput('');
      }
    }
  }, [newExposedHeaderInput, getValues, setValue]);

  /**
   * Remove exposed header
   */
  const removeExposedHeader = useCallback((index: number) => {
    const currentHeaders = getValues('exposedHeaders') || [];
    setValue('exposedHeaders', currentHeaders.filter((_, i) => i !== index), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [getValues, setValue]);

  /**
   * Toggle HTTP method selection
   */
  const toggleMethod = useCallback((method: string) => {
    const currentMethods = getValues('allowedMethods') || [];
    if (currentMethods.includes(method)) {
      setValue('allowedMethods', currentMethods.filter(m => m !== method), {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      setValue('allowedMethods', [...currentMethods, method], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [getValues, setValue]);

  // =============================================================================
  // LOADING AND ERROR STATES
  // =============================================================================

  if (isLoading && isEditing) {
    return (
      <div 
        className="flex items-center justify-center p-8"
        data-testid="cors-config-loading"
        role="status"
        aria-label="Loading CORS configuration"
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary-600 mr-3" />
        <span className="text-gray-600 dark:text-gray-400">
          Loading CORS configuration...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
        data-testid="cors-config-error"
        role="alert"
        aria-describedby="error-description"
      >
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load CORS configuration
            </h3>
            <p 
              id="error-description"
              className="mt-1 text-sm text-red-700 dark:text-red-300"
            >
              {error.message || 'An unexpected error occurred while loading the CORS configuration.'}
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900/30"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  return (
    <div 
      className={`bg-white dark:bg-gray-900 ${className || ''}`}
      data-testid="cors-config-details"
    >
      {/* Header */}
      {standalone && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                data-testid="cors-config-back-button"
                aria-label="Go back to CORS configuration list"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {isEditing ? 'Edit CORS Configuration' : 'Create CORS Configuration'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure Cross-Origin Resource Sharing (CORS) settings for API endpoints
                </p>
              </div>
            </div>
            
            {/* Save indicator */}
            <div className="flex items-center space-x-3">
              {isDirty && (
                <div className="flex items-center text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Unsaved changes
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isValid ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Valid
                  </div>
                ) : (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Invalid
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Form {...form}>
          <form 
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            data-testid="cors-config-form"
            noValidate
          >
            {/* Basic Configuration Section */}
            <section 
              className="space-y-6"
              aria-labelledby="basic-config-heading"
            >
              <div className="flex items-center space-x-2">
                <h2 
                  id="basic-config-heading"
                  className="text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  Basic Configuration
                </h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Path Pattern */}
                <FormField
                  control={control}
                  name="path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel 
                        htmlFor="cors-path"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Path Pattern
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="cors-path"
                          placeholder="e.g., /api/*, /users/*, /*"
                          className="mt-1"
                          data-testid="cors-path-input"
                          aria-describedby="cors-path-description cors-path-error"
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormDescription id="cors-path-description">
                        URL path pattern this CORS rule applies to. Use * for wildcards.
                      </FormDescription>
                      <FormMessage id="cors-path-error" />
                    </FormItem>
                  )}
                />

                {/* Enabled Toggle */}
                <FormField
                  control={control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="cors-enabled"
                          data-testid="cors-enabled-checkbox"
                          aria-describedby="cors-enabled-description"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel 
                          htmlFor="cors-enabled"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Enable CORS
                        </FormLabel>
                        <FormDescription id="cors-enabled-description">
                          Enable Cross-Origin Resource Sharing for this path pattern
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel 
                      htmlFor="cors-description"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        id="cors-description"
                        placeholder="Describe the purpose of this CORS configuration..."
                        rows={3}
                        className="mt-1"
                        data-testid="cors-description-textarea"
                        aria-describedby="cors-description-description"
                      />
                    </FormControl>
                    <FormDescription id="cors-description-description">
                      Optional description to help identify this CORS configuration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Origins Section */}
            <section 
              className="space-y-6"
              aria-labelledby="origins-heading"
            >
              <div className="flex items-center space-x-2">
                <h2 
                  id="origins-heading"
                  className="text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  Allowed Origins
                </h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              {/* Add new origin */}
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <label 
                    htmlFor="new-origin-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Add Origin
                  </label>
                  <Input
                    id="new-origin-input"
                    value={newOriginInput}
                    onChange={(e) => setNewOriginInput(e.target.value)}
                    placeholder="https://example.com or *"
                    className="w-full"
                    data-testid="new-origin-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOrigin();
                      }
                    }}
                    aria-describedby="new-origin-description"
                  />
                  <p 
                    id="new-origin-description"
                    className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                  >
                    Enter a full URL (e.g., https://example.com) or * for all origins
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={addOrigin}
                  disabled={!newOriginInput.trim()}
                  size="sm"
                  data-testid="add-origin-button"
                  aria-label="Add origin to allowed list"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Origins list */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Origins ({allowedOrigins.length})
                </h3>
                <div 
                  className="space-y-2"
                  data-testid="origins-list"
                  role="list"
                  aria-label="List of allowed origins"
                >
                  {allowedOrigins.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                      No origins configured. Add at least one origin above.
                    </p>
                  ) : (
                    allowedOrigins.map((origin, index) => (
                      <div 
                        key={`${origin}-${index}`}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md"
                        role="listitem"
                        data-testid={`origin-item-${index}`}
                      >
                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1">
                          {origin}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOrigin(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 ml-2"
                          data-testid={`remove-origin-${index}`}
                          aria-label={`Remove origin ${origin}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* HTTP Methods Section */}
            <section 
              className="space-y-6"
              aria-labelledby="methods-heading"
            >
              <div className="flex items-center space-x-2">
                <h2 
                  id="methods-heading"
                  className="text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  Allowed HTTP Methods
                </h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              <div 
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
                role="group"
                aria-labelledby="methods-heading"
                data-testid="http-methods-grid"
              >
                {HTTP_METHODS.map((method) => (
                  <div 
                    key={method.value}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={`method-${method.value}`}
                      checked={allowedMethods.includes(method.value)}
                      onCheckedChange={() => toggleMethod(method.value)}
                      data-testid={`method-checkbox-${method.value}`}
                      aria-describedby={`method-description-${method.value}`}
                    />
                    <div className="space-y-1 leading-none">
                      <label 
                        htmlFor={`method-${method.value}`}
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        {method.label}
                      </label>
                      <p 
                        id={`method-description-${method.value}`}
                        className="text-xs text-gray-500 dark:text-gray-400"
                      >
                        {method.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <FormField
                control={control}
                name="allowedMethods"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* Headers Section */}
            <section 
              className="space-y-6"
              aria-labelledby="headers-heading"
            >
              <div className="flex items-center space-x-2">
                <h2 
                  id="headers-heading"
                  className="text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  Headers Configuration
                </h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              {/* Allowed Headers */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allowed Request Headers
                </h3>
                
                {/* Add new header */}
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <label 
                      htmlFor="new-header-input"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Add Header
                    </label>
                    <Input
                      id="new-header-input"
                      value={newHeaderInput}
                      onChange={(e) => setNewHeaderInput(e.target.value)}
                      placeholder="e.g., Content-Type, Authorization"
                      className="w-full"
                      list="common-headers"
                      data-testid="new-header-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addHeader();
                        }
                      }}
                      aria-describedby="new-header-description"
                    />
                    <datalist id="common-headers">
                      {COMMON_HEADERS.map((header) => (
                        <option key={header} value={header} />
                      ))}
                    </datalist>
                    <p 
                      id="new-header-description"
                      className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                    >
                      Headers that clients are allowed to send in requests
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addHeader}
                    disabled={!newHeaderInput.trim()}
                    size="sm"
                    data-testid="add-header-button"
                    aria-label="Add header to allowed list"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Headers list */}
                <div 
                  className="space-y-2"
                  data-testid="allowed-headers-list"
                  role="list"
                  aria-label="List of allowed request headers"
                >
                  {allowedHeaders.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                      No headers configured. Add headers that clients can send.
                    </p>
                  ) : (
                    allowedHeaders.map((header, index) => (
                      <div 
                        key={`${header}-${index}`}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md"
                        role="listitem"
                        data-testid={`allowed-header-item-${index}`}
                      >
                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1">
                          {header}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHeader(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 ml-2"
                          data-testid={`remove-allowed-header-${index}`}
                          aria-label={`Remove allowed header ${header}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Exposed Headers */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exposed Response Headers
                </h3>
                
                {/* Add new exposed header */}
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <label 
                      htmlFor="new-exposed-header-input"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Add Exposed Header
                    </label>
                    <Input
                      id="new-exposed-header-input"
                      value={newExposedHeaderInput}
                      onChange={(e) => setNewExposedHeaderInput(e.target.value)}
                      placeholder="e.g., X-Total-Count, ETag"
                      className="w-full"
                      list="common-headers"
                      data-testid="new-exposed-header-input"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExposedHeader();
                        }
                      }}
                      aria-describedby="new-exposed-header-description"
                    />
                    <p 
                      id="new-exposed-header-description"
                      className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                    >
                      Headers that clients can access in responses (optional)
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addExposedHeader}
                    disabled={!newExposedHeaderInput.trim()}
                    size="sm"
                    data-testid="add-exposed-header-button"
                    aria-label="Add header to exposed list"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Exposed headers list */}
                <div 
                  className="space-y-2"
                  data-testid="exposed-headers-list"
                  role="list"
                  aria-label="List of exposed response headers"
                >
                  {exposedHeaders.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic py-2">
                      No exposed headers configured. This is optional.
                    </p>
                  ) : (
                    exposedHeaders.map((header, index) => (
                      <div 
                        key={`${header}-${index}`}
                        className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-md"
                        role="listitem"
                        data-testid={`exposed-header-item-${index}`}
                      >
                        <code className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1">
                          {header}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExposedHeader(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 ml-2"
                          data-testid={`remove-exposed-header-${index}`}
                          aria-label={`Remove exposed header ${header}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Advanced Options Section */}
            <section 
              className="space-y-6"
              aria-labelledby="advanced-heading"
            >
              <div className="flex items-center space-x-2">
                <h2 
                  id="advanced-heading"
                  className="text-lg font-medium text-gray-900 dark:text-gray-100"
                >
                  Advanced Options
                </h2>
                <Info className="w-4 h-4 text-gray-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allow Credentials */}
                <FormField
                  control={control}
                  name="allowCredentials"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="cors-allow-credentials"
                          data-testid="cors-allow-credentials-checkbox"
                          aria-describedby="cors-allow-credentials-description"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel 
                          htmlFor="cors-allow-credentials"
                          className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Allow Credentials
                        </FormLabel>
                        <FormDescription id="cors-allow-credentials-description">
                          Allow requests to include credentials (cookies, authorization headers)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Max Age */}
                <FormField
                  control={control}
                  name="maxAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel 
                        htmlFor="cors-max-age"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Max Age (seconds)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          id="cors-max-age"
                          type="number"
                          min="0"
                          max="86400"
                          step="60"
                          className="mt-1"
                          data-testid="cors-max-age-input"
                          aria-describedby="cors-max-age-description cors-max-age-error"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription id="cors-max-age-description">
                        How long (in seconds) browsers can cache preflight requests (0-86400)
                      </FormDescription>
                      <FormMessage id="cors-max-age-error" />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isPending || isCreating || isUpdating}
                  data-testid="cors-config-cancel-button"
                  aria-label="Cancel changes and return to CORS list"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  disabled={isPending || isCreating || isUpdating || !isDirty}
                  data-testid="cors-config-reset-button"
                  aria-label="Reset form to original values"
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  type="submit"
                  disabled={!isValid || isPending || isCreating || isUpdating || !isDirty}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  data-testid="cors-config-save-button"
                  aria-label={isEditing ? 'Update CORS configuration' : 'Create CORS configuration'}
                >
                  {(isPending || isCreating || isUpdating) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Update' : 'Create'} CORS Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

/**
 * Default export for convenience
 */
export default CorsConfigDetails;