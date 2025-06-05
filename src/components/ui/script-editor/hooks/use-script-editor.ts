/**
 * Main Script Editor Hook - Unified Interface
 * 
 * Main orchestrating React hook for the script editor component that combines all sub-hooks
 * into a unified interface. Manages form state with React Hook Form, coordinates file operations,
 * storage services, GitHub integration, and cache management. Provides the primary API that
 * the ScriptEditor component consumes, replacing the Angular component class logic.
 * 
 * Features:
 * - React Hook Form integration with Zod validation for real-time validation under 100ms
 * - Unified interface for all script editor functionality matching original Angular component API
 * - Integration with all storage services, file operations, GitHub import, and cache management hooks
 * - TypeScript 5.8+ strict typing with comprehensive error handling and loading state management
 * - Form state management compatible with controlled component patterns for parent form integration
 * - Storage service selection and path validation logic maintaining original component behavior
 * - Cache management with optimistic updates and background synchronization
 * - Performance optimized for React Query cache hit responses under 50ms
 * 
 * @fileoverview Main orchestrating script editor hook with React Hook Form and unified API
 * @version 1.0.0
 * @since 2024-01-01
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';

// Sub-hook imports
import { useStorageServices } from './useStorageServices';
import { useScriptFile } from './useScriptFile';
import { useGithubImport } from './useGithubImport';
import { useScriptCache } from './useScriptCache';
import { useStorageValidation } from './useStorageValidation';

// Type imports
import {
  type ScriptEditorFormData,
  type ScriptEditorFormSchema,
  type UseScriptEditorConfig,
  type UseScriptEditorReturn,
  type ScriptEditorErrorState,
  type ScriptEditorLoadingState,
  type ScriptEditorValidationState,
  type StorageService,
  type FileUploadState,
  type GitHubImportState,
  type CacheOperationResult,
  type ScriptMetadata,
  type ScriptLanguage,
  ScriptEditorFormSchema as FormSchema,
} from '../types';

// Global type imports
import { type ValidationState } from '../../../../types/ui';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default hook configuration with performance optimizations
 */
const DEFAULT_CONFIG: Required<UseScriptEditorConfig> = {
  defaultValues: {
    content: '',
    storageServiceId: '',
    storagePath: '',
    language: 'javascript',
    metadata: {
      name: '',
      description: '',
      version: '1.0.0',
      author: '',
      tags: [],
    },
  },
  validation: {
    mode: 'onChange', // Real-time validation for under 100ms requirement
    reValidateMode: 'onChange',
    debounceTime: 50, // Optimized for performance requirement
  },
  storage: {
    services: [],
    pathValidation: {
      requiredWhenServiceSelected: true,
      maxLength: 255,
      minLength: 1,
      allowedPatterns: ['^[a-zA-Z0-9._/-]+$'],
      forbiddenPatterns: ['^\\.', '\\.\\.', '//'],
    },
  },
  fileUpload: {
    acceptedTypes: [
      'text/plain',
      'text/javascript',
      'application/javascript',
      'text/typescript',
      'application/typescript',
      'text/python',
      'application/json',
      'text/yaml',
      'application/yaml',
      'text/xml',
      'application/xml',
      'text/html',
      'text/css',
      'text/sql',
      'text/markdown',
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    enableDragDrop: true,
    trackProgress: true,
    validation: {
      validateExtension: true,
      validateMimeType: true,
      validateContent: true,
    },
  },
  github: {
    apiBaseUrl: 'https://api.github.com',
    defaultBranch: 'main',
  },
  cache: {
    enabled: true,
    keyPrefix: 'script_editor',
    defaultTtl: 3600, // 1 hour
    storage: 'memory',
    invalidation: {
      invalidateOnChange: true,
      ttlBased: true,
      manualTriggers: ['content_change', 'storage_change'],
    },
  },
  onContentChange: undefined,
  onStorageServiceChange: undefined,
  onError: undefined,
} as const;

/**
 * Error message constants for consistency
 */
const ERROR_MESSAGES = {
  FORM_VALIDATION: 'Form validation failed',
  STORAGE_SERVICE_LOAD: 'Failed to load storage services',
  FILE_UPLOAD_FAILED: 'File upload failed',
  GITHUB_IMPORT_FAILED: 'GitHub import failed',
  CACHE_OPERATION_FAILED: 'Cache operation failed',
  STORAGE_PATH_INVALID: 'Storage path validation failed',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

/**
 * Loading operation types for precise state management
 */
type LoadingOperation = 
  | 'loading_services'
  | 'uploading_file'
  | 'importing_github'
  | 'cache_operation'
  | 'saving_content'
  | 'validating_content'
  | 'validating_storage';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a standardized error state object
 */
function createErrorState(
  type: ScriptEditorErrorState['type'],
  message: string,
  details?: string,
  code?: string | number,
  recoverable: boolean = true
): ScriptEditorErrorState {
  return {
    type,
    message,
    details,
    code,
    timestamp: new Date(),
    recovery: recoverable ? ['Try again', 'Check your input', 'Refresh the page'] : [],
    recoverable,
  };
}

/**
 * Creates a loading state object
 */
function createLoadingState(
  isLoading: boolean,
  operation?: LoadingOperation,
  details?: string,
  cancellable: boolean = false
): ScriptEditorLoadingState {
  return {
    isLoading,
    operation,
    operationDetails: details,
    cancellable,
    error: null,
  };
}

/**
 * Detects script language from content and filename
 */
function detectScriptLanguage(content: string, filename?: string): ScriptLanguage {
  // Check file extension first
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'js':
      case 'mjs':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'py':
      case 'python':
        return 'python';
      case 'php':
        return 'php';
      case 'json':
        return 'json';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'xml':
        return 'xml';
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'sql':
        return 'sql';
      case 'md':
      case 'markdown':
        return 'markdown';
      default:
        break;
    }
  }

  // Check content patterns
  const trimmedContent = content.trim();
  
  // JSON detection
  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    try {
      JSON.parse(trimmedContent);
      return 'json';
    } catch {
      // Not JSON, continue checking
    }
  }

  // TypeScript/JavaScript patterns
  if (/^import\s+.*from|^export\s+.*|interface\s+\w+|type\s+\w+\s*=/.test(trimmedContent)) {
    return /interface\s+\w+|type\s+\w+\s*=|:\s*\w+/.test(trimmedContent) ? 'typescript' : 'javascript';
  }

  // Python patterns
  if (/^def\s+\w+|^class\s+\w+|^import\s+\w+|^from\s+\w+\s+import/.test(trimmedContent)) {
    return 'python';
  }

  // PHP patterns
  if (trimmedContent.startsWith('<?php') || /\$\w+\s*=|\bfunction\s+\w+\s*\(/.test(trimmedContent)) {
    return 'php';
  }

  // HTML patterns
  if (/<html|<head|<body|<!DOCTYPE/i.test(trimmedContent)) {
    return 'html';
  }

  // CSS patterns
  if (/^\s*[\w.-]+\s*\{|@media|@import|@keyframes/.test(trimmedContent)) {
    return 'css';
  }

  // SQL patterns
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s+/i.test(trimmedContent)) {
    return 'sql';
  }

  // YAML patterns
  if (/^---|\w+:\s*|\s+-\s+/.test(trimmedContent)) {
    return 'yaml';
  }

  // XML patterns
  if (trimmedContent.startsWith('<?xml') || /<\w+[^>]*>/.test(trimmedContent)) {
    return 'xml';
  }

  // Markdown patterns
  if (/^#\s+|^\*\s+|^\d+\.\s+|^\[.*\]\(.*\)/.test(trimmedContent)) {
    return 'markdown';
  }

  // Default to text
  return 'text';
}

/**
 * Generates script metadata from content and context
 */
function generateScriptMetadata(
  content: string,
  filename?: string,
  storageServiceId?: string,
  storagePath?: string
): ScriptMetadata {
  const language = detectScriptLanguage(content, filename);
  const lines = content.split('\n');
  
  return {
    name: filename || 'Untitled Script',
    language,
    size: content.length,
    lineCount: lines.length,
    characterCount: content.length,
    createdAt: new Date(),
    modifiedAt: new Date(),
    storage: storageServiceId && storagePath ? {
      serviceId: storageServiceId,
      path: storagePath,
    } : undefined,
    tags: [],
    properties: {
      hasComments: /\/\*[\s\S]*?\*\/|\/\/.*$/m.test(content),
      hasImports: /^import\s+.*from|^#include|^require\s*\(/.test(content),
      isMinified: lines.length === 1 && content.length > 1000,
    },
  };
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Main Script Editor Hook
 * 
 * Comprehensive React hook that orchestrates all script editor functionality
 * into a unified interface. Integrates React Hook Form with Zod validation,
 * manages all sub-hooks, and provides the primary API for the ScriptEditor component.
 * 
 * @param config - Configuration options for the script editor hook
 * @returns Unified hook interface with form, state management, and operations
 * 
 * @example
 * ```tsx
 * const scriptEditor = useScriptEditor({
 *   defaultValues: { content: '', storageServiceId: '', storagePath: '' },
 *   validation: { mode: 'onChange', debounceTime: 100 },
 *   onContentChange: (content) => console.log('Content changed:', content),
 *   onError: (error) => console.error('Script editor error:', error),
 * });
 * 
 * // Use in component
 * const { form, storageServices, fileUpload, validation } = scriptEditor;
 * ```
 */
export function useScriptEditor(config: UseScriptEditorConfig = {}): UseScriptEditorReturn {
  // Merge configuration with defaults
  const mergedConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
    defaultValues: { ...DEFAULT_CONFIG.defaultValues, ...config.defaultValues },
    validation: { ...DEFAULT_CONFIG.validation, ...config.validation },
    storage: { ...DEFAULT_CONFIG.storage, ...config.storage },
    fileUpload: { ...DEFAULT_CONFIG.fileUpload, ...config.fileUpload },
    github: { ...DEFAULT_CONFIG.github, ...config.github },
    cache: { ...DEFAULT_CONFIG.cache, ...config.cache },
  }), [config]);

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  // Internal state for error and loading management
  const [currentError, setCurrentError] = useState<ScriptEditorErrorState | null>(null);
  const [loadingState, setLoadingState] = useState<ScriptEditorLoadingState>(
    createLoadingState(false)
  );
  
  // Refs for stable function references and cleanup
  const configRef = useRef(mergedConfig);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Update config ref when config changes
  configRef.current = mergedConfig;

  // Query client for cache management
  const queryClient = useQueryClient();

  // =============================================================================
  // FORM SETUP WITH REACT HOOK FORM
  // =============================================================================

  /**
   * React Hook Form setup with Zod validation
   * Configured for real-time validation under 100ms requirement
   */
  const form: UseFormReturn<ScriptEditorFormData> = useForm<ScriptEditorFormData>({
    resolver: zodResolver(FormSchema),
    mode: mergedConfig.validation.mode,
    reValidateMode: mergedConfig.validation.reValidateMode,
    defaultValues: mergedConfig.defaultValues,
    // Performance optimization for real-time validation
    criteriaMode: 'firstError',
    shouldFocusError: true,
    shouldUseNativeValidation: false,
  });

  // Watch form values for reactive updates
  const formValues = form.watch();
  const { content, storageServiceId, storagePath, language } = formValues;

  // =============================================================================
  // SUB-HOOKS INTEGRATION
  // =============================================================================

  /**
   * Storage Services Hook Integration
   * Provides available storage services with React Query caching
   */
  const storageServicesHook = useStorageServices({
    groups: 'source control,file',
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes for cache hit under 50ms
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });

  /**
   * Storage Validation Hook Integration
   * Manages dynamic validation based on storage service selection
   */
  const storageValidationHook = useStorageValidation({
    form,
    storageServices: storageServicesHook.services,
    pathValidation: mergedConfig.storage.pathValidation,
    debounceTime: mergedConfig.validation.debounceTime,
    realTimeValidation: mergedConfig.validation.mode === 'onChange',
    errorMessages: {
      pathRequired: 'Storage path is required when a storage service is selected',
      pathInvalid: 'Storage path format is invalid',
      serviceRequired: 'Storage service selection is required',
    },
  });

  /**
   * File Upload Hook Integration
   * Handles file upload operations with progress tracking
   */
  const fileUploadHook = useScriptFile({
    form,
    fieldName: 'content',
    autoUpdateForm: true,
    ...mergedConfig.fileUpload,
    onProgress: useCallback((progress: number) => {
      setLoadingState(createLoadingState(
        true,
        'uploading_file',
        `Uploading file: ${progress}%`,
        true
      ));
    }, []),
    onSuccess: useCallback((content: string, metadata) => {
      setLoadingState(createLoadingState(false));
      
      // Auto-detect language and update form
      const detectedLanguage = detectScriptLanguage(content, metadata.name);
      form.setValue('language', detectedLanguage, { shouldValidate: true });
      
      // Update metadata
      const scriptMetadata = generateScriptMetadata(content, metadata.name);
      form.setValue('metadata', scriptMetadata, { shouldValidate: true });
      
      // Trigger content change callback
      mergedConfig.onContentChange?.(content);
      
      setCurrentError(null);
    }, [form, mergedConfig]),
    onError: useCallback((error: string) => {
      setLoadingState(createLoadingState(false));
      const errorState = createErrorState('file_upload_error', error, undefined, 'FILE_UPLOAD_ERROR');
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
    }, [mergedConfig]),
  });

  /**
   * GitHub Import Hook Integration
   * Manages GitHub file import functionality
   */
  const githubImportHook = useGithubImport({
    ...mergedConfig.github,
    enableDebugLogging: process.env.NODE_ENV === 'development',
  });

  /**
   * Cache Operations Hook Integration
   * Provides cache management with optimistic updates
   */
  const cacheHook = useScriptCache({
    storageServiceId,
    storagePath,
    enableAutoRevalidation: true,
    revalidationInterval: 5 * 60 * 1000, // 5 minutes
    enableOptimisticUpdates: true,
    enableErrorLogging: process.env.NODE_ENV === 'development',
  });

  // =============================================================================
  // ERROR HANDLING INTEGRATION
  // =============================================================================

  /**
   * Unified error handling for all sub-hooks
   */
  useEffect(() => {
    // Storage services error
    if (storageServicesHook.error) {
      const errorState = createErrorState(
        'storage_service_error',
        storageServicesHook.error,
        ERROR_MESSAGES.STORAGE_SERVICE_LOAD,
        'STORAGE_SERVICES_ERROR'
      );
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
    }

    // File upload error (handled in onError callback)
    
    // GitHub import error
    if (githubImportHook.state.error) {
      const errorState = createErrorState(
        'github_import_error',
        githubImportHook.state.error.message || ERROR_MESSAGES.GITHUB_IMPORT_FAILED,
        githubImportHook.state.error.documentation_url,
        'GITHUB_IMPORT_ERROR'
      );
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
    }

    // Cache operation error
    if (cacheHook.deleteCache.error || cacheHook.latestCache.error) {
      const error = cacheHook.deleteCache.error || cacheHook.latestCache.error;
      const errorState = createErrorState(
        'cache_operation_error',
        error || ERROR_MESSAGES.CACHE_OPERATION_FAILED,
        undefined,
        'CACHE_OPERATION_ERROR'
      );
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
    }

    // Storage validation error
    if (!storageValidationHook.validationState.isValid && storageValidationHook.validationState.error) {
      const errorState = createErrorState(
        'validation_error',
        storageValidationHook.validationState.error,
        ERROR_MESSAGES.STORAGE_PATH_INVALID,
        storageValidationHook.validationState.errorCode
      );
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
    }
  }, [
    storageServicesHook.error,
    githubImportHook.state.error,
    cacheHook.deleteCache.error,
    cacheHook.latestCache.error,
    storageValidationHook.validationState,
    mergedConfig,
  ]);

  // =============================================================================
  // LOADING STATE INTEGRATION
  // =============================================================================

  /**
   * Unified loading state management
   */
  useEffect(() => {
    let operation: LoadingOperation | undefined;
    let details: string | undefined;
    let isLoading = false;

    // Check various loading states
    if (storageServicesHook.isLoading) {
      isLoading = true;
      operation = 'loading_services';
      details = 'Loading available storage services...';
    } else if (fileUploadHook.isUploading()) {
      isLoading = true;
      operation = 'uploading_file';
      details = `Uploading file: ${fileUploadHook.state.progress || 0}%`;
    } else if (githubImportHook.state.isLoading) {
      isLoading = true;
      operation = 'importing_github';
      details = githubImportHook.state.isCheckingAccess 
        ? 'Checking repository access...' 
        : 'Importing file from GitHub...';
    } else if (cacheHook.latestCache.isLoading || cacheHook.deleteCache.isLoading) {
      isLoading = true;
      operation = 'cache_operation';
      details = cacheHook.latestCache.isLoading 
        ? 'Loading cached content...' 
        : 'Deleting cache...';
    }

    setLoadingState(createLoadingState(isLoading, operation, details, true));
  }, [
    storageServicesHook.isLoading,
    fileUploadHook.state.isLoading,
    githubImportHook.state.isLoading,
    githubImportHook.state.isCheckingAccess,
    cacheHook.latestCache.isLoading,
    cacheHook.deleteCache.isLoading,
  ]);

  // =============================================================================
  // CONTENT CHANGE HANDLERS
  // =============================================================================

  /**
   * Handle content changes with debounced language detection
   */
  useEffect(() => {
    if (content && mergedConfig.onContentChange) {
      const timeoutId = setTimeout(() => {
        mergedConfig.onContentChange!(content);
        
        // Auto-detect language if not set or if content significantly changed
        if (!language || language === 'text') {
          const detectedLanguage = detectScriptLanguage(content);
          if (detectedLanguage !== language) {
            form.setValue('language', detectedLanguage, { shouldValidate: false });
          }
        }
      }, mergedConfig.validation.debounceTime);

      return () => clearTimeout(timeoutId);
    }
  }, [content, language, form, mergedConfig]);

  /**
   * Handle storage service changes
   */
  useEffect(() => {
    if (mergedConfig.onStorageServiceChange) {
      mergedConfig.onStorageServiceChange(storageServiceId || null);
    }
  }, [storageServiceId, mergedConfig]);

  // =============================================================================
  // GITHUB IMPORT INTEGRATION
  // =============================================================================

  /**
   * Enhanced GitHub import with form integration
   */
  const handleGitHubImport = useCallback(async (url: string, credentials?: any) => {
    try {
      setLoadingState(createLoadingState(true, 'importing_github', 'Importing from GitHub...', true));
      
      const result = await githubImportHook.import.importFile({ url, credentials });
      
      if (result.data.content) {
        // Decode content
        const decodedContent = githubImportHook.utils.decodeContent(result.data.content);
        if (decodedContent) {
          // Update form with imported content
          form.setValue('content', decodedContent, { shouldValidate: true });
          
          // Auto-detect language
          const detectedLanguage = detectScriptLanguage(decodedContent, result.data.name);
          form.setValue('language', detectedLanguage, { shouldValidate: true });
          
          // Generate metadata
          const metadata = generateScriptMetadata(decodedContent, result.data.name);
          form.setValue('metadata', {
            ...metadata,
            name: result.data.name,
            properties: {
              ...metadata.properties,
              githubImport: {
                url,
                sha: result.data.sha,
                importedAt: new Date().toISOString(),
              },
            },
          }, { shouldValidate: true });
          
          // Trigger success callback
          githubImportHook.import.onImportSuccess(result);
          
          // Clear any errors
          setCurrentError(null);
        } else {
          throw new Error('Failed to decode GitHub file content');
        }
      }
      
      setLoadingState(createLoadingState(false));
    } catch (error) {
      setLoadingState(createLoadingState(false));
      const errorMessage = error instanceof Error ? error.message : 'GitHub import failed';
      const errorState = createErrorState('github_import_error', errorMessage, undefined, 'GITHUB_IMPORT_ERROR');
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
    }
  }, [githubImportHook, form, mergedConfig]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Reset form to default state
   */
  const resetForm = useCallback(() => {
    form.reset(mergedConfig.defaultValues);
    fileUploadHook.clearFile();
    storageValidationHook.validation.resetStorageFields();
    setCurrentError(null);
    setLoadingState(createLoadingState(false));
  }, [form, fileUploadHook, storageValidationHook, mergedConfig]);

  /**
   * Save content with validation and metadata generation
   */
  const saveContent = useCallback(async (content: string): Promise<void> => {
    try {
      setLoadingState(createLoadingState(true, 'saving_content', 'Saving content...', false));
      
      // Validate content
      const isValid = await form.trigger('content');
      if (!isValid) {
        throw new Error('Content validation failed');
      }
      
      // Generate updated metadata
      const metadata = generateScriptMetadata(content, undefined, storageServiceId, storagePath);
      form.setValue('metadata', metadata, { shouldValidate: true });
      
      // Simulate save operation (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoadingState(createLoadingState(false));
      setCurrentError(null);
    } catch (error) {
      setLoadingState(createLoadingState(false));
      const errorMessage = error instanceof Error ? error.message : 'Save operation failed';
      const errorState = createErrorState('unknown_error', errorMessage, undefined, 'SAVE_ERROR');
      setCurrentError(errorState);
      mergedConfig.onError?.(errorState);
      throw error;
    }
  }, [form, storageServiceId, storagePath, mergedConfig]);

  /**
   * Validate content against schema and business rules
   */
  const validateContent = useCallback(async (content: string): Promise<boolean> => {
    try {
      setLoadingState(createLoadingState(true, 'validating_content', 'Validating content...', false));
      
      // Update form with content for validation
      form.setValue('content', content, { shouldValidate: false });
      
      // Trigger validation
      const isValid = await form.trigger('content');
      
      setLoadingState(createLoadingState(false));
      return isValid;
    } catch (error) {
      setLoadingState(createLoadingState(false));
      return false;
    }
  }, [form]);

  /**
   * Get content metadata with auto-detection
   */
  const getContentMetadata = useCallback((content: string): ScriptMetadata => {
    return generateScriptMetadata(content, undefined, storageServiceId, storagePath);
  }, [storageServiceId, storagePath]);

  /**
   * Clear all errors
   */
  const clearError = useCallback(() => {
    setCurrentError(null);
    form.clearErrors();
    storageValidationHook.validation.clearValidationErrors();
  }, [form, storageValidationHook]);

  /**
   * Cancel ongoing operations
   */
  const cancelOperations = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    fileUploadHook.cancelUpload();
    githubImportHook.actions.reset();
    setLoadingState(createLoadingState(false));
  }, [fileUploadHook, githubImportHook]);

  // =============================================================================
  // VALIDATION STATE AGGREGATION
  // =============================================================================

  /**
   * Aggregated validation state for all form fields
   */
  const validationState: ScriptEditorValidationState = useMemo(() => {
    const { formState } = form;
    const { errors, touchedFields, dirtyFields } = formState;

    return {
      isValid: Object.keys(errors).length === 0 && storageValidationHook.validationState.isValid,
      isDirty: Object.keys(dirtyFields).length > 0 || storageValidationHook.validationState.isDirty,
      isTouched: Object.keys(touchedFields).length > 0 || storageValidationHook.validationState.isTouched,
      error: currentError?.message,
      fields: {
        content: {
          isValid: !errors.content,
          isDirty: Boolean(dirtyFields.content),
          isTouched: Boolean(touchedFields.content),
          error: errors.content?.message,
        },
        storageServiceId: {
          isValid: !errors.storageServiceId,
          isDirty: Boolean(dirtyFields.storageServiceId),
          isTouched: Boolean(touchedFields.storageServiceId),
          error: errors.storageServiceId?.message,
        },
        storagePath: {
          isValid: !errors.storagePath && storageValidationHook.validationState.isValid,
          isDirty: Boolean(dirtyFields.storagePath) || storageValidationHook.validationState.isDirty,
          isTouched: Boolean(touchedFields.storagePath) || storageValidationHook.validationState.isTouched,
          error: errors.storagePath?.message || storageValidationHook.validationState.error,
        },
        language: {
          isValid: !errors.language,
          isDirty: Boolean(dirtyFields.language),
          isTouched: Boolean(touchedFields.language),
          error: errors.language?.message,
        },
        metadata: {
          isValid: !errors.metadata,
          isDirty: Boolean(dirtyFields.metadata),
          isTouched: Boolean(touchedFields.metadata),
          error: errors.metadata?.message,
        },
      },
      realTimeValidation: mergedConfig.validation.mode === 'onChange',
      debounceTime: mergedConfig.validation.debounceTime,
    };
  }, [form, storageValidationHook.validationState, currentError, mergedConfig]);

  // =============================================================================
  // CLEANUP EFFECTS
  // =============================================================================

  /**
   * Cleanup effect for aborting operations on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    // Form control instance
    form,

    // Storage services state
    storageServices: {
      data: storageServicesHook.services,
      loading: storageServicesHook.isLoading,
      error: storageServicesHook.error,
      refetch: storageServicesHook.refetch,
    },

    // File upload state and operations
    fileUpload: {
      ...fileUploadHook.state,
      uploadFile: fileUploadHook.uploadFile,
      clearFile: fileUploadHook.clearFile,
      cancelUpload: fileUploadHook.cancelUpload,
      retryUpload: fileUploadHook.retryUpload,
      validateFile: fileUploadHook.validateFile,
      getContent: fileUploadHook.getContent,
      getMetadata: fileUploadHook.getMetadata,
      isUploading: fileUploadHook.isUploading,
      hasFile: fileUploadHook.hasFile,
    },

    // GitHub import state and operations
    githubImport: {
      ...githubImportHook.state,
      openDialog: githubImportHook.dialog.open,
      closeDialog: githubImportHook.dialog.close,
      importFile: handleGitHubImport,
      validateUrl: githubImportHook.utils.validateUrl,
      checkAccess: githubImportHook.access.checkAccess,
      fetchContent: githubImportHook.content.fetchContent,
    },

    // Cache operations
    cache: {
      viewLatest: cacheHook.viewLatest.execute,
      deleteCache: cacheHook.deleteCache.mutate,
      loading: cacheHook.latestCache.isLoading || cacheHook.deleteCache.isLoading,
      error: cacheHook.latestCache.error || cacheHook.deleteCache.error,
      data: cacheHook.latestCache.data,
      lastUpdated: cacheHook.latestCache.lastUpdated,
    },

    // Validation state
    validation: validationState,

    // Error state
    error: currentError,

    // Loading state
    loading: loadingState,

    // Utility functions
    utils: {
      resetForm,
      saveContent,
      validateContent,
      getContentMetadata,
      clearError,
      cancelOperations,
      // Storage validation utilities
      ...storageValidationHook.validation,
      // Storage handlers
      ...storageValidationHook.handlers,
    },
  };
}

// =============================================================================
// UTILITY HOOKS AND HELPERS
// =============================================================================

/**
 * Higher-order hook with sensible defaults for most use cases
 */
export function useScriptEditorWithDefaults(
  initialContent?: string,
  onContentChange?: (content: string) => void
): UseScriptEditorReturn {
  return useScriptEditor({
    defaultValues: {
      content: initialContent || '',
      storageServiceId: '',
      storagePath: '',
      language: 'javascript',
    },
    validation: {
      mode: 'onChange',
      debounceTime: 100,
    },
    onContentChange,
  });
}

/**
 * Hook for form-integrated usage with external form control
 */
export function useScriptEditorFormIntegration(
  form: UseFormReturn<any>,
  fieldName: string = 'content'
): Omit<UseScriptEditorReturn, 'form'> {
  const scriptEditor = useScriptEditor({
    defaultValues: {
      content: form.getValues(fieldName) || '',
      storageServiceId: '',
      storagePath: '',
    },
    onContentChange: (content) => {
      form.setValue(fieldName, content, { shouldValidate: true });
    },
  });

  // Sync external form changes to script editor
  useEffect(() => {
    const subscription = form.watch((data) => {
      const content = data[fieldName];
      if (content !== scriptEditor.form.getValues('content')) {
        scriptEditor.form.setValue('content', content || '', { shouldValidate: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [form, fieldName, scriptEditor.form]);

  // Exclude the internal form from return to avoid conflicts
  const { form: _, ...rest } = scriptEditor;
  return rest;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useScriptEditor;

/**
 * Re-export utility functions for standalone usage
 */
export { detectScriptLanguage, generateScriptMetadata, createErrorState, createLoadingState };

/**
 * Re-export types for external usage
 */
export type {
  UseScriptEditorConfig,
  UseScriptEditorReturn,
  ScriptEditorFormData,
  ScriptEditorErrorState,
  ScriptEditorLoadingState,
  ScriptEditorValidationState,
};