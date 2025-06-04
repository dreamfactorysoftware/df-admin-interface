/**
 * Custom React hook for managing endpoint configuration form state.
 * Integrates React Hook Form with React Query for caching and synchronization
 * per Section 4.4.3.2 API generation workflow state management.
 * 
 * Features:
 * - Real-time validation under 100ms response time
 * - React Query integration for configuration state caching
 * - Multi-step form state management with persistence
 * - Optimistic updates and error handling
 * - Auto-save functionality with debounced updates
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, UseFormReturn, FieldErrors, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash-es';
import { toast } from 'react-hot-toast';

// Schema and types
import {
  endpointConfigSchema,
  endpointConfigStepSchemas,
  validateEndpointConfig,
  validateEndpointConfigStep,
  type EndpointConfigFormData,
  type EndpointConfigStepData,
  type ValidationResult,
  type ValidationError
} from '../schemas/endpoint-config.schema';

import {
  type EndpointConfig,
  type HttpMethod,
  type MethodSpecificConfig,
  getMethodConfig
} from '../types/endpoint-config.types';

/**
 * Configuration options for the endpoint form hook
 */
export interface UseEndpointFormOptions {
  /** Initial form data */
  defaultValues?: Partial<EndpointConfigFormData>;
  /** Enable auto-save functionality */
  autoSave?: boolean;
  /** Auto-save debounce delay in milliseconds */
  autoSaveDelay?: number;
  /** Enable step-by-step validation */
  stepValidation?: boolean;
  /** Current step in multi-step form */
  currentStep?: keyof typeof endpointConfigStepSchemas;
  /** Unique identifier for caching */
  configId?: string;
  /** Callback when form data changes */
  onDataChange?: (data: Partial<EndpointConfigFormData>) => void;
  /** Callback when validation state changes */
  onValidationChange?: (isValid: boolean, errors?: FieldErrors) => void;
  /** Callback when form is successfully submitted */
  onSubmit?: (data: EndpointConfigFormData) => Promise<void> | void;
}

/**
 * Form state interface
 */
export interface EndpointFormState {
  /** Current form data */
  data: Partial<EndpointConfigFormData>;
  /** Form validation state */
  isValid: boolean;
  /** Form submission state */
  isSubmitting: boolean;
  /** Form dirty state */
  isDirty: boolean;
  /** Current validation errors */
  errors: FieldErrors<EndpointConfigFormData>;
  /** Step-specific validation states */
  stepValidation: Record<string, boolean>;
  /** Auto-save state */
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

/**
 * Return type for the hook
 */
export interface UseEndpointFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<EndpointConfigFormData>;
  /** Current form state */
  state: EndpointFormState;
  /** Form control methods */
  actions: {
    /** Submit the form */
    handleSubmit: () => Promise<void>;
    /** Reset form to initial state */
    reset: (data?: Partial<EndpointConfigFormData>) => void;
    /** Validate specific step */
    validateStep: (step: keyof typeof endpointConfigStepSchemas) => Promise<boolean>;
    /** Validate entire form */
    validateAll: () => Promise<boolean>;
    /** Save current form state */
    save: () => Promise<void>;
    /** Load saved form state */
    load: () => Promise<void>;
    /** Clear form cache */
    clearCache: () => void;
    /** Get method-specific configuration */
    getMethodConfig: () => MethodSpecificConfig | null;
  };
  /** Real-time preview data */
  preview: {
    /** Generated endpoint configuration */
    config: EndpointConfig | null;
    /** OpenAPI specification preview */
    openApiSpec: any | null;
    /** Validation preview */
    validationPreview: ValidationResult | null;
  };
}

/**
 * Query keys for React Query caching
 */
const queryKeys = {
  endpointConfig: (configId?: string) => ['endpoint-config', configId],
  endpointPreview: (data: Partial<EndpointConfigFormData>) => ['endpoint-preview', data],
  endpointValidation: (data: Partial<EndpointConfigFormData>) => ['endpoint-validation', data]
};

/**
 * Custom hook for endpoint configuration form management
 */
export function useEndpointForm(options: UseEndpointFormOptions = {}): UseEndpointFormReturn {
  const {
    defaultValues = {},
    autoSave = true,
    autoSaveDelay = 1000,
    stepValidation = true,
    currentStep,
    configId,
    onDataChange,
    onValidationChange,
    onSubmit
  } = options;

  const queryClient = useQueryClient();
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [stepValidationState, setStepValidationState] = useState<Record<string, boolean>>({});

  // Initialize form with Zod validation
  const form = useForm<EndpointConfigFormData>({
    resolver: zodResolver(endpointConfigSchema),
    defaultValues: {
      method: 'GET',
      endpoint: '',
      description: '',
      pathParams: [],
      queryParams: [],
      responses: [{
        statusCode: 200,
        description: 'Successful response',
        schema: {},
      }],
      security: {
        authType: 'none',
        roles: [],
        permissions: []
      },
      queryConfig: {
        allowFiltering: true,
        allowSorting: true,
        allowPagination: true,
        defaultPageSize: 25,
        maxPageSize: 100
      },
      tags: [],
      deprecated: false,
      ...defaultValues
    },
    mode: 'onChange' // Enable real-time validation
  });

  // Watch form data for real-time updates
  const watchedData = useWatch({ control: form.control });
  const currentMethod = useWatch({ control: form.control, name: 'method' });

  // Load saved configuration from cache
  const { data: savedConfig } = useQuery({
    queryKey: queryKeys.endpointConfig(configId),
    queryFn: async () => {
      if (!configId) return null;
      // Simulate loading from storage/API
      const saved = localStorage.getItem(`endpoint-config-${configId}`);
      return saved ? JSON.parse(saved) : null;
    },
    enabled: !!configId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Generate real-time preview
  const { data: previewData } = useQuery({
    queryKey: queryKeys.endpointPreview(watchedData),
    queryFn: async () => {
      if (!watchedData.method || !watchedData.endpoint) return null;
      
      // Generate preview configuration
      const config: EndpointConfig = {
        method: watchedData.method,
        pathParams: watchedData.pathParams || [],
        queryParams: watchedData.queryParams || [],
        requestBody: watchedData.requestBody,
        responses: watchedData.responses || [],
        security: watchedData.security || { authType: 'none' },
        methodConfig: getMethodConfig(watchedData.method)
      };

      // Generate OpenAPI specification
      const openApiSpec = generateOpenApiSpec(config, watchedData);

      return { config, openApiSpec };
    },
    enabled: !!watchedData.method && !!watchedData.endpoint,
    staleTime: 100 // 100ms for real-time updates
  });

  // Real-time validation preview
  const { data: validationPreview } = useQuery({
    queryKey: queryKeys.endpointValidation(watchedData),
    queryFn: async () => {
      return validateEndpointConfig(watchedData);
    },
    staleTime: 100 // 100ms for real-time validation
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: Partial<EndpointConfigFormData>) => {
      if (!configId) return;
      
      setAutoSaveStatus('saving');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem(`endpoint-config-${configId}`, JSON.stringify(data));
      
      return data;
    },
    onSuccess: () => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      setAutoSaveStatus('error');
      toast.error('Failed to auto-save configuration');
      console.error('Auto-save error:', error);
    }
  });

  // Form submission mutation
  const submitMutation = useMutation({
    mutationFn: async (data: EndpointConfigFormData) => {
      // Validate before submission
      const validation = validateEndpointConfig(data);
      if (!validation.success) {
        throw new Error('Form validation failed');
      }

      // Call external submit handler if provided
      if (onSubmit) {
        await onSubmit(data);
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success('Endpoint configuration saved successfully');
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['endpoint-configs'] });
    },
    onError: (error) => {
      toast.error('Failed to save endpoint configuration');
      console.error('Submission error:', error);
    }
  });

  // Debounced auto-save function
  const debouncedAutoSave = useMemo(
    () => debounce((data: Partial<EndpointConfigFormData>) => {
      if (autoSave && configId && form.formState.isDirty) {
        autoSaveMutation.mutate(data);
      }
    }, autoSaveDelay),
    [autoSave, autoSaveDelay, configId, form.formState.isDirty, autoSaveMutation]
  );

  // Handle form data changes
  useEffect(() => {
    if (watchedData) {
      // Trigger auto-save
      debouncedAutoSave(watchedData);
      
      // Call external change handler
      if (onDataChange) {
        onDataChange(watchedData);
      }
    }
  }, [watchedData, debouncedAutoSave, onDataChange]);

  // Handle validation state changes
  useEffect(() => {
    const isValid = form.formState.isValid;
    const errors = form.formState.errors;
    
    if (onValidationChange) {
      onValidationChange(isValid, errors);
    }
  }, [form.formState.isValid, form.formState.errors, onValidationChange]);

  // Update form when saved config is loaded
  useEffect(() => {
    if (savedConfig && configId) {
      form.reset(savedConfig);
    }
  }, [savedConfig, configId, form]);

  // Form action handlers
  const actions = useMemo(() => ({
    handleSubmit: async () => {
      const isValid = await form.trigger();
      if (isValid) {
        const data = form.getValues();
        await submitMutation.mutateAsync(data);
      }
    },

    reset: (data?: Partial<EndpointConfigFormData>) => {
      form.reset({ ...defaultValues, ...data });
      setStepValidationState({});
    },

    validateStep: async (step: keyof typeof endpointConfigStepSchemas) => {
      const stepData = getStepData(step, form.getValues());
      const validation = validateEndpointConfigStep(step, stepData);
      const isValid = validation.success;
      
      setStepValidationState(prev => ({
        ...prev,
        [step]: isValid
      }));
      
      return isValid;
    },

    validateAll: async () => {
      return await form.trigger();
    },

    save: async () => {
      const data = form.getValues();
      await autoSaveMutation.mutateAsync(data);
    },

    load: async () => {
      if (configId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.endpointConfig(configId)
        });
      }
    },

    clearCache: () => {
      if (configId) {
        queryClient.removeQueries({
          queryKey: queryKeys.endpointConfig(configId)
        });
        localStorage.removeItem(`endpoint-config-${configId}`);
      }
    },

    getMethodConfig: () => {
      if (currentMethod) {
        return getMethodConfig(currentMethod);
      }
      return null;
    }
  }), [
    form,
    defaultValues,
    submitMutation,
    autoSaveMutation,
    queryClient,
    configId,
    currentMethod
  ]);

  // Form state
  const state: EndpointFormState = useMemo(() => ({
    data: watchedData,
    isValid: form.formState.isValid,
    isSubmitting: submitMutation.isPending,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
    stepValidation: stepValidationState,
    autoSaveStatus
  }), [
    watchedData,
    form.formState.isValid,
    form.formState.isDirty,
    form.formState.errors,
    submitMutation.isPending,
    stepValidationState,
    autoSaveStatus
  ]);

  // Preview data
  const preview = useMemo(() => ({
    config: previewData?.config || null,
    openApiSpec: previewData?.openApiSpec || null,
    validationPreview: validationPreview || null
  }), [previewData, validationPreview]);

  return {
    form,
    state,
    actions,
    preview
  };
}

/**
 * Helper function to extract step data from form values
 */
function getStepData(
  step: keyof typeof endpointConfigStepSchemas,
  formData: Partial<EndpointConfigFormData>
): any {
  const stepFields = Object.keys(endpointConfigStepSchemas[step].shape);
  const stepData: any = {};
  
  stepFields.forEach(field => {
    if (field in formData) {
      stepData[field] = formData[field as keyof EndpointConfigFormData];
    }
  });
  
  return stepData;
}

/**
 * Helper function to generate OpenAPI specification preview
 */
function generateOpenApiSpec(
  config: EndpointConfig,
  formData: Partial<EndpointConfigFormData>
): any {
  const pathItem: any = {};
  const methodKey = config.method.toLowerCase();
  
  pathItem[methodKey] = {
    summary: formData.summary || `${config.method} ${formData.endpoint}`,
    description: formData.description || '',
    operationId: formData.operationId || `${methodKey}${formData.endpoint?.replace(/[^a-zA-Z0-9]/g, '')}`,
    tags: formData.tags || [],
    deprecated: formData.deprecated || false,
    parameters: [
      ...(config.pathParams || []).map(param => ({
        name: param.name,
        in: 'path',
        required: param.required,
        description: param.description,
        schema: { type: param.type }
      })),
      ...(config.queryParams || []).map(param => ({
        name: param.name,
        in: 'query',
        required: param.required,
        description: param.description,
        schema: { type: param.type }
      }))
    ],
    responses: Object.fromEntries(
      (config.responses || []).map(response => [
        response.statusCode.toString(),
        {
          description: response.description,
          content: response.schema ? {
            'application/json': {
              schema: response.schema
            }
          } : undefined
        }
      ])
    )
  };

  // Add request body for methods that support it
  if (config.requestBody && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
    pathItem[methodKey].requestBody = {
      required: config.requestBody.required,
      content: {
        [config.requestBody.contentType]: {
          schema: config.requestBody.schema
        }
      }
    };
  }

  // Add security requirements
  if (config.security && config.security.authType !== 'none') {
    pathItem[methodKey].security = [
      { [config.security.authType]: config.security.roles || [] }
    ];
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'Generated API',
      version: '1.0.0'
    },
    paths: {
      [formData.endpoint || '/']: pathItem
    }
  };
}

/**
 * Export hook and related types
 */
export type {
  UseEndpointFormOptions,
  UseEndpointFormReturn,
  EndpointFormState
};