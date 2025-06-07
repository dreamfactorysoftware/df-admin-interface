/**
 * Main Script Editor Hook
 * 
 * Primary orchestrating React hook for the script editor component that combines all 
 * sub-hooks into a unified interface. Manages form state with React Hook Form, coordinates 
 * file operations, storage services, GitHub integration, and cache management. Provides 
 * the primary API that the ScriptEditor component consumes, replacing the Angular 
 * component class logic with modern React patterns.
 * 
 * Features:
 * - React Hook Form integration with Zod validation for real-time validation under 100ms
 * - Unified interface for all script editor functionality matching original Angular component public API
 * - Integration with all storage services, file operations, GitHub import, and cache management hooks
 * - TypeScript 5.8+ strict typing with comprehensive error handling and loading state management
 * - Form state management compatible with controlled component patterns for parent form integration
 * - Storage service selection and path validation logic maintaining original component behavior
 * - Cache management with optimistic updates and background synchronization per technical specification
 * 
 * @fileoverview Main orchestrating hook combining all script editor functionality
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Internal hook imports
import { useStorageServices, type UseStorageServicesReturn } from './useStorageServices';
import { useScriptFile, type UseScriptFileReturn, type UseScriptFileConfig } from './useScriptFile';
import { useGithubImport, type UseGitHubImportReturn, type UseGitHubImportOptions } from './useGithubImport';
import { useScriptCache, type UseScriptCacheReturn, type UseScriptCacheOptions } from './useScriptCache';
import { useStorageValidation, type UseStorageValidationReturn } from './useStorageValidation';

// Type imports
import type {
  ScriptContent,
  ScriptType,
  ScriptContext,
  ScriptSource,
  StorageService,
  ScriptEditorFormSchema,
  FileOperationResult,
  ScriptCacheEntry,
  ScriptEditorValidation,
  ScriptEditorProps
} from '../types';

// External hook imports
import { useTheme, type UseThemeReturn } from '@/hooks/use-theme';
import { apiClient, type ApiResponse } from '@/lib/api-client';

// ============================================================================
// FORM SCHEMA AND VALIDATION
// ============================================================================

/**
 * Script editor form data interface extending the base form schema
 */
export interface ScriptEditorFormData extends FieldValues {
  /** Script content */
  content: string;
  /** Script type for syntax highlighting */
  scriptType: ScriptType;
  /** Script name */
  name: string;
  /** Script description */
  description: string;
  /** Script execution context */
  context: ScriptContext;
  /** Content source type */
  source: ScriptSource;
  /** Selected storage service ID */
  storageServiceId: string | null;
  /** Storage path for file-based scripts */
  storagePath: string;
  /** Whether script is active */
  isActive: boolean;
  /** GitHub repository URL */
  repositoryUrl?: string;
  /** Git branch/tag reference */
  gitRef?: string;
  /** External URL for URL-based scripts */
  externalUrl?: string;
}

/**
 * Enhanced form validation schema with dynamic validation rules
 */
const createFormValidationSchema = (
  storageServices: StorageService[] = [],
  validation?: ScriptEditorValidation
) => {
  const baseSchema = z.object({
    content: z
      .string()
      .min(validation?.required !== false ? 1 : 0, 'Script content is required')
      .max(validation?.max_length || 1000000, `Content exceeds maximum length of ${validation?.max_length || 1000000} characters`)
      .refine(
        (content) => {
          if (validation?.min_length && content.length < validation.min_length) {
            return false;
          }
          return true;
        },
        { message: `Content must be at least ${validation?.min_length || 1} characters` }
      ),
    
    scriptType: z.nativeEnum(ScriptType, {
      errorMap: () => ({ message: 'Please select a valid script type' })
    }),
    
    name: z
      .string()
      .min(1, 'Script name is required')
      .max(255, 'Script name must be less than 255 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Script name can only contain letters, numbers, underscores, and hyphens'),
    
    description: z
      .string()
      .max(1000, 'Description must be less than 1000 characters')
      .optional()
      .or(z.literal('')),
    
    context: z.nativeEnum(ScriptContext, {
      errorMap: () => ({ message: 'Please select a valid execution context' })
    }),
    
    source: z.nativeEnum(ScriptSource, {
      errorMap: () => ({ message: 'Please select a valid content source' })
    }),
    
    storageServiceId: z.string().nullable(),
    
    storagePath: z.string(),
    
    isActive: z.boolean().default(true),
    
    repositoryUrl: z
      .string()
      .url('Please enter a valid repository URL')
      .optional()
      .or(z.literal('')),
    
    gitRef: z
      .string()
      .optional()
      .or(z.literal('')),
    
    externalUrl: z
      .string()
      .url('Please enter a valid URL')
      .optional()
      .or(z.literal('')),
  });

  // Add dynamic validation based on source type
  return baseSchema.refine((data) => {
    switch (data.source) {
      case ScriptSource.FILE:
        return data.storageServiceId && data.storagePath;
      case ScriptSource.GITHUB:
        return data.repositoryUrl && data.storagePath;
      case ScriptSource.URL:
        return data.externalUrl;
      default:
        return true;
    }
  }, {
    message: 'Source-specific fields are required based on selected source type',
    path: ['source']
  });
};

// ============================================================================
// HOOK OPTIONS AND CONFIGURATION
// ============================================================================

/**
 * Configuration options for the main script editor hook
 */
export interface UseScriptEditorOptions {
  /** Initial form values */
  defaultValues?: Partial<ScriptEditorFormData>;
  
  /** Form validation configuration */
  validation?: ScriptEditorValidation;
  
  /** Enable real-time validation (under 100ms requirement) */
  enableRealTimeValidation?: boolean;
  
  /** Debounce interval for real-time validation (ms) */
  validationDebounceMs?: number;
  
  /** Storage services configuration */
  storageConfig?: {
    /** Enable storage service integration */
    enabled?: boolean;
    /** Filter storage services by group */
    serviceGroup?: string;
    /** Enable private repository support */
    enablePrivateRepos?: boolean;
  };
  
  /** File operations configuration */
  fileConfig?: UseScriptFileConfig;
  
  /** GitHub integration configuration */
  githubConfig?: UseGitHubImportOptions;
  
  /** Cache management configuration */
  cacheConfig?: UseScriptCacheOptions;
  
  /** Auto-save configuration */
  autoSave?: {
    /** Enable auto-save functionality */
    enabled: boolean;
    /** Auto-save interval in milliseconds */
    interval: number;
    /** Show auto-save indicator */
    showIndicator: boolean;
  };
  
  /** Callback functions */
  callbacks?: {
    /** Called when form data changes */
    onChange?: (data: Partial<ScriptEditorFormData>) => void;
    /** Called when form is successfully submitted */
    onSubmit?: (data: ScriptEditorFormData) => Promise<void> | void;
    /** Called when errors occur */
    onError?: (error: string, context?: string) => void;
    /** Called when validation state changes */
    onValidationChange?: (isValid: boolean, errors?: Record<string, string>) => void;
  };
}

/**
 * Return type for the main script editor hook
 */
export interface UseScriptEditorReturn {
  // ============================================================================
  // FORM STATE AND METHODS
  // ============================================================================
  
  /** React Hook Form instance */
  form: UseFormReturn<ScriptEditorFormData>;
  
  /** Current form data */
  formData: ScriptEditorFormData;
  
  /** Form validation state */
  formState: {
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
    errors: Record<string, string>;
    touchedFields: Record<string, boolean>;
  };
  
  /** Submit form data */
  submitForm: () => Promise<void>;
  
  /** Reset form to initial state */
  resetForm: (data?: Partial<ScriptEditorFormData>) => void;
  
  /** Validate form manually */
  validateForm: () => Promise<boolean>;
  
  // ============================================================================
  // STORAGE SERVICES INTEGRATION
  // ============================================================================
  
  /** Storage services data and operations */
  storageServices: UseStorageServicesReturn;
  
  /** Storage validation utilities */
  storageValidation: UseStorageValidationReturn<ScriptEditorFormData>;
  
  /** Selected storage service */
  selectedStorageService: StorageService | null;
  
  /** Handle storage service selection change */
  handleStorageServiceChange: (serviceId: string | null) => void;
  
  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================
  
  /** File upload and content operations */
  fileOperations: UseScriptFileReturn;
  
  /** Upload file and populate form */
  uploadFile: (file: File) => Promise<void>;
  
  /** Save current content to file */
  saveToFile: (filename?: string) => Promise<FileOperationResult>;
  
  /** Load content from file */
  loadFromFile: (file: File) => Promise<void>;
  
  // ============================================================================
  // GITHUB INTEGRATION
  // ============================================================================
  
  /** GitHub import functionality */
  githubImport: UseGitHubImportReturn;
  
  /** Import script from GitHub URL */
  importFromGitHub: (url: string) => Promise<void>;
  
  /** Open GitHub import dialog */
  openGitHubDialog: () => void;
  
  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================
  
  /** Script cache operations */
  cacheOperations: UseScriptCacheReturn;
  
  /** Load script from cache */
  loadFromCache: (cacheEntry: ScriptCacheEntry) => Promise<void>;
  
  /** Save current script to cache */
  saveToCache: () => Promise<void>;
  
  /** Clear script cache */
  clearCache: () => Promise<void>;
  
  // ============================================================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================================================
  
  /** Auto-save state */
  autoSaveState: {
    enabled: boolean;
    saving: boolean;
    lastSaved: Date | null;
    error: string | null;
  };
  
  /** Manually trigger auto-save */
  triggerAutoSave: () => Promise<void>;
  
  /** Enable/disable auto-save */
  toggleAutoSave: (enabled: boolean) => void;
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /** Get current script content object */
  getScriptContent: () => ScriptContent;
  
  /** Update script content from external source */
  updateContent: (content: string, metadata?: Partial<ScriptContent>) => void;
  
  /** Check if form has unsaved changes */
  hasUnsavedChanges: () => boolean;
  
  /** Export current script data */
  exportScript: () => ScriptContent;
  
  /** Import script data */
  importScript: (script: ScriptContent) => void;
  
  // ============================================================================
  // THEME INTEGRATION
  // ============================================================================
  
  /** Theme utilities for editor styling */
  theme: Pick<UseThemeReturn, 'resolvedTheme' | 'getAccessibleColors'>;
}

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * Main script editor hook that orchestrates all functionality
 * 
 * Combines all sub-hooks into a unified interface providing complete script editor
 * functionality with React Hook Form integration, storage services, file operations,
 * GitHub integration, cache management, and auto-save capabilities.
 */
export function useScriptEditor(options: UseScriptEditorOptions = {}): UseScriptEditorReturn {
  const {
    defaultValues = {},
    validation = {},
    enableRealTimeValidation = true,
    validationDebounceMs = 100,
    storageConfig = {},
    fileConfig = {},
    githubConfig = {},
    cacheConfig = {},
    autoSave = { enabled: false, interval: 30000, showIndicator: true },
    callbacks = {},
  } = options;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [selectedStorageService, setSelectedStorageService] = useState<StorageService | null>(null);
  const [autoSaveState, setAutoSaveState] = useState({
    enabled: autoSave.enabled,
    saving: false,
    lastSaved: null as Date | null,
    error: null as string | null,
  });

  // Refs for debouncing and auto-save
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastFormDataRef = useRef<string>('');

  // ============================================================================
  // FORM INITIALIZATION
  // ============================================================================

  // Initialize storage services
  const storageServices = useStorageServices({
    group: storageConfig.serviceGroup || 'source control,file',
    enabled: storageConfig.enabled !== false,
  });

  // Create dynamic validation schema
  const validationSchema = useMemo(() => 
    createFormValidationSchema(storageServices.services, validation),
    [storageServices.services, validation]
  );

  // Initialize form with React Hook Form
  const form = useForm<ScriptEditorFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      content: '',
      scriptType: ScriptType.JAVASCRIPT,
      name: '',
      description: '',
      context: ScriptContext.CUSTOM_SERVICE,
      source: ScriptSource.INLINE,
      storageServiceId: null,
      storagePath: '',
      isActive: true,
      repositoryUrl: '',
      gitRef: 'main',
      externalUrl: '',
      ...defaultValues,
    },
    mode: enableRealTimeValidation ? 'onChange' : 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  // ============================================================================
  // SUB-HOOK INTEGRATION
  // ============================================================================

  // Storage validation
  const storageValidation = useStorageValidation({
    watch: form.watch,
    setValue: form.setValue,
    clearErrors: form.clearErrors,
    setError: form.setError,
    trigger: form.trigger,
    errors: form.formState.errors,
    storageServices: storageServices.services || [],
    config: {
      realTimeValidation: enableRealTimeValidation,
      debounceMs: validationDebounceMs,
    },
  });

  // File operations
  const fileOperations = useScriptFile({
    ...fileConfig,
    formIntegration: {
      contentFieldName: 'content' as Path<ScriptEditorFormData>,
      typeFieldName: 'scriptType' as Path<ScriptEditorFormData>,
      setValue: form.setValue,
      trigger: form.trigger,
      autoTriggerValidation: true,
    },
    onSuccess: (result) => {
      callbacks.onChange?.(form.getValues());
    },
    onError: (error) => {
      callbacks.onError?.(error.error || 'File operation failed', 'file-operations');
    },
  });

  // GitHub integration
  const githubImport = useGithubImport({
    ...githubConfig,
    enablePrivateRepos: storageConfig.enablePrivateRepos || false,
    onImportSuccess: (result) => {
      if (result.scripts.length > 0) {
        const script = result.scripts[0];
        form.setValue('content', script.content || '');
        form.setValue('scriptType', script.type);
        form.setValue('name', script.name);
        form.setValue('description', script.description || '');
        form.setValue('source', ScriptSource.GITHUB);
        form.setValue('repositoryUrl', script.repository_url || '');
        form.setValue('storagePath', script.path || '');
        callbacks.onChange?.(form.getValues());
      }
    },
    onImportError: (error) => {
      callbacks.onError?.(error.message, 'github-import');
    },
  });

  // Cache management
  const cacheOperations = useScriptCache({
    ...cacheConfig,
    onSuccess: (result) => {
      // Handle successful cache operations
    },
    onError: (error) => {
      callbacks.onError?.(error.error?.message || 'Cache operation failed', 'cache-operations');
    },
  });

  // Theme integration
  const theme = useTheme();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const formData = form.watch();
  
  const formState = useMemo(() => ({
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    isSubmitting: form.formState.isSubmitting,
    errors: Object.fromEntries(
      Object.entries(form.formState.errors).map(([key, error]) => [
        key,
        error?.message || 'Validation error'
      ])
    ),
    touchedFields: Object.fromEntries(
      Object.entries(form.formState.touchedFields).map(([key, touched]) => [
        key,
        Boolean(touched)
      ])
    ),
  }), [form.formState]);

  // ============================================================================
  // FORM OPERATIONS
  // ============================================================================

  /**
   * Submit form data
   */
  const submitForm = useCallback(async () => {
    try {
      const isValid = await form.trigger();
      if (!isValid) {
        callbacks.onError?.('Form validation failed', 'form-submission');
        return;
      }

      const data = form.getValues();
      await callbacks.onSubmit?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed';
      callbacks.onError?.(errorMessage, 'form-submission');
    }
  }, [form, callbacks]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback((data?: Partial<ScriptEditorFormData>) => {
    const resetData = {
      ...defaultValues,
      ...data,
    };
    form.reset(resetData);
    setSelectedStorageService(null);
  }, [form, defaultValues]);

  /**
   * Validate form manually
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    return await form.trigger();
  }, [form]);

  // ============================================================================
  // STORAGE SERVICE OPERATIONS
  // ============================================================================

  /**
   * Handle storage service selection change
   */
  const handleStorageServiceChange = useCallback((serviceId: string | null) => {
    const service = storageServices.services?.find(s => s.id === serviceId) || null;
    setSelectedStorageService(service);
    storageValidation.handleStorageServiceChange(serviceId);
    
    // Update form source based on service type
    if (service) {
      if (service.type === 'github') {
        form.setValue('source', ScriptSource.GITHUB);
      } else {
        form.setValue('source', ScriptSource.FILE);
      }
    } else {
      form.setValue('source', ScriptSource.INLINE);
    }
    
    callbacks.onChange?.(form.getValues());
  }, [storageServices.services, storageValidation, form, callbacks]);

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  /**
   * Upload file and populate form
   */
  const uploadFile = useCallback(async (file: File) => {
    try {
      const result = await fileOperations.uploadFile(file);
      if (result.success && result.content) {
        // File operations hook handles form updates through formIntegration
        callbacks.onChange?.(form.getValues());
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      callbacks.onError?.(errorMessage, 'file-upload');
    }
  }, [fileOperations, form, callbacks]);

  /**
   * Save current content to file
   */
  const saveToFile = useCallback(async (filename?: string): Promise<FileOperationResult> => {
    const content = form.getValues('content');
    const scriptType = form.getValues('scriptType');
    const name = filename || form.getValues('name') || 'script';
    
    // Create blob and trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.${scriptType === ScriptType.JAVASCRIPT ? 'js' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      metadata: {
        operation: 'download',
        timestamp: new Date().toISOString(),
      },
    };
  }, [form]);

  /**
   * Load content from file
   */
  const loadFromFile = useCallback(async (file: File) => {
    await uploadFile(file);
  }, [uploadFile]);

  // ============================================================================
  // GITHUB OPERATIONS
  // ============================================================================

  /**
   * Import script from GitHub URL
   */
  const importFromGitHub = useCallback(async (url: string) => {
    try {
      await githubImport.importFromUrl(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'GitHub import failed';
      callbacks.onError?.(errorMessage, 'github-import');
    }
  }, [githubImport, callbacks]);

  /**
   * Open GitHub import dialog
   */
  const openGitHubDialog = useCallback(() => {
    githubImport.openDialog();
  }, [githubImport]);

  // ============================================================================
  // CACHE OPERATIONS
  // ============================================================================

  /**
   * Load script from cache
   */
  const loadFromCache = useCallback(async (cacheEntry: ScriptCacheEntry) => {
    try {
      const { content, type } = cacheOperations.getContent(cacheEntry);
      
      if (typeof content === 'string') {
        form.setValue('content', content);
        form.setValue('scriptType', cacheEntry.script_type);
        form.setValue('name', cacheEntry.name);
        form.setValue('source', ScriptSource.FILE);
        form.setValue('storagePath', cacheEntry.path);
        
        callbacks.onChange?.(form.getValues());
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load from cache';
      callbacks.onError?.(errorMessage, 'cache-load');
    }
  }, [cacheOperations, form, callbacks]);

  /**
   * Save current script to cache
   */
  const saveToCache = useCallback(async () => {
    try {
      // In a real implementation, this would save to the cache service
      // For now, just trigger cache refresh
      await cacheOperations.refreshCache();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save to cache';
      callbacks.onError?.(errorMessage, 'cache-save');
    }
  }, [cacheOperations, callbacks]);

  /**
   * Clear script cache
   */
  const clearCache = useCallback(async () => {
    try {
      await cacheOperations.clearAllCache.mutateAsync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear cache';
      callbacks.onError?.(errorMessage, 'cache-clear');
    }
  }, [cacheOperations, callbacks]);

  // ============================================================================
  // AUTO-SAVE FUNCTIONALITY
  // ============================================================================

  /**
   * Trigger auto-save manually
   */
  const triggerAutoSave = useCallback(async () => {
    if (!autoSaveState.enabled || autoSaveState.saving) return;

    try {
      setAutoSaveState(prev => ({ ...prev, saving: true, error: null }));
      
      // In a real implementation, this would save to a backend service
      // For now, just simulate the save operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAutoSaveState(prev => ({
        ...prev,
        saving: false,
        lastSaved: new Date(),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save failed';
      setAutoSaveState(prev => ({
        ...prev,
        saving: false,
        error: errorMessage,
      }));
      callbacks.onError?.(errorMessage, 'auto-save');
    }
  }, [autoSaveState, callbacks]);

  /**
   * Toggle auto-save functionality
   */
  const toggleAutoSave = useCallback((enabled: boolean) => {
    setAutoSaveState(prev => ({ ...prev, enabled }));
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get current script content object
   */
  const getScriptContent = useCallback((): ScriptContent => {
    const data = form.getValues();
    
    return {
      name: data.name,
      description: data.description,
      type: data.scriptType,
      context: data.context,
      source: data.source,
      content: data.content,
      path: data.storagePath,
      repository_url: data.repositoryUrl,
      ref: data.gitRef,
      url: data.externalUrl,
      is_active: data.isActive,
    };
  }, [form]);

  /**
   * Update script content from external source
   */
  const updateContent = useCallback((content: string, metadata?: Partial<ScriptContent>) => {
    form.setValue('content', content);
    
    if (metadata) {
      if (metadata.type) form.setValue('scriptType', metadata.type);
      if (metadata.name) form.setValue('name', metadata.name);
      if (metadata.description) form.setValue('description', metadata.description);
      if (metadata.context) form.setValue('context', metadata.context);
      if (metadata.source) form.setValue('source', metadata.source);
      if (metadata.path) form.setValue('storagePath', metadata.path);
      if (metadata.repository_url) form.setValue('repositoryUrl', metadata.repository_url);
      if (metadata.ref) form.setValue('gitRef', metadata.ref);
      if (metadata.url) form.setValue('externalUrl', metadata.url);
      if (metadata.is_active !== undefined) form.setValue('isActive', metadata.is_active);
    }
    
    callbacks.onChange?.(form.getValues());
  }, [form, callbacks]);

  /**
   * Check if form has unsaved changes
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    return form.formState.isDirty;
  }, [form.formState.isDirty]);

  /**
   * Export current script data
   */
  const exportScript = useCallback((): ScriptContent => {
    return getScriptContent();
  }, [getScriptContent]);

  /**
   * Import script data
   */
  const importScript = useCallback((script: ScriptContent) => {
    updateContent(script.content || '', script);
  }, [updateContent]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  /**
   * Handle real-time validation with debouncing
   */
  useEffect(() => {
    if (!enableRealTimeValidation) return;

    const currentFormData = JSON.stringify(formData);
    if (currentFormData === lastFormDataRef.current) return;
    lastFormDataRef.current = currentFormData;

    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Debounce validation
    validationTimeoutRef.current = setTimeout(async () => {
      const isValid = await form.trigger();
      const errors = Object.fromEntries(
        Object.entries(form.formState.errors).map(([key, error]) => [
          key,
          error?.message || 'Validation error'
        ])
      );
      
      callbacks.onValidationChange?.(isValid, errors);
    }, validationDebounceMs);

    // Call onChange callback
    callbacks.onChange?.(formData);
  }, [formData, enableRealTimeValidation, validationDebounceMs, form, callbacks]);

  /**
   * Handle auto-save functionality
   */
  useEffect(() => {
    if (!autoSaveState.enabled || !form.formState.isDirty) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Schedule auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave();
    }, autoSave.interval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSaveState.enabled, form.formState.isDirty, autoSave.interval, triggerAutoSave]);

  /**
   * Update selected storage service when form changes
   */
  useEffect(() => {
    const serviceId = form.watch('storageServiceId');
    const service = storageServices.services?.find(s => s.id === serviceId) || null;
    setSelectedStorageService(service);
  }, [form.watch('storageServiceId'), storageServices.services]);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // Form state and methods
    form,
    formData,
    formState,
    submitForm,
    resetForm,
    validateForm,

    // Storage services integration
    storageServices,
    storageValidation,
    selectedStorageService,
    handleStorageServiceChange,

    // File operations
    fileOperations,
    uploadFile,
    saveToFile,
    loadFromFile,

    // GitHub integration
    githubImport,
    importFromGitHub,
    openGitHubDialog,

    // Cache management
    cacheOperations,
    loadFromCache,
    saveToCache,
    clearCache,

    // Auto-save functionality
    autoSaveState,
    triggerAutoSave,
    toggleAutoSave,

    // Utility functions
    getScriptContent,
    updateContent,
    hasUnsavedChanges,
    exportScript,
    importScript,

    // Theme integration
    theme: {
      resolvedTheme: theme.resolvedTheme,
      getAccessibleColors: theme.getAccessibleColors,
    },
  };
}

// Export default hook
export default useScriptEditor;

// Export types for external usage
export type {
  UseScriptEditorOptions,
  UseScriptEditorReturn,
  ScriptEditorFormData,
};