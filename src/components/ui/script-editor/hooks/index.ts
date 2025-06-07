/**
 * Script Editor Hooks - Barrel Export Module
 * 
 * Centralized export file providing access to all custom React hooks that replace 
 * Angular service-based architecture for script editor functionality. Enables clean 
 * imports and proper tree-shaking for the script editor hook library following 
 * established patterns from database-service and file-selector hooks.
 * 
 * This module exports comprehensive script editor functionality including:
 * - Main orchestrating hook (useScriptEditor) for unified interface
 * - Storage services integration hooks with React Query caching
 * - File upload and content management hooks with native File API
 * - GitHub import functionality with Base64 decoding and error handling
 * - Script cache management with optimistic updates and background sync
 * - Storage path validation with dynamic form validation logic
 * 
 * All hooks are implemented with React 19+ patterns, TypeScript 5.8+ strict typing,
 * and Next.js 15.1+ compatibility for server component integration.
 * 
 * @fileoverview Barrel export for script editor hooks library
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * @license MIT
 */

// ============================================================================
// MAIN ORCHESTRATING HOOK
// ============================================================================

/**
 * Main script editor hook that combines all functionality into a unified interface.
 * 
 * Provides comprehensive script editor capabilities including form management with
 * React Hook Form, storage services integration, file operations, GitHub import,
 * cache management, and auto-save functionality. Replaces Angular component class
 * logic with modern React patterns.
 * 
 * @example
 * ```typescript
 * import { useScriptEditor } from '@/components/ui/script-editor/hooks';
 * 
 * function ScriptEditor() {
 *   const {
 *     form,
 *     storageServices,
 *     fileOperations,
 *     githubImport,
 *     cacheOperations
 *   } = useScriptEditor({
 *     enableRealTimeValidation: true,
 *     autoSave: { enabled: true, interval: 30000 }
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export {
  useScriptEditor,
  type UseScriptEditorOptions,
  type UseScriptEditorReturn,
  type ScriptEditorFormData
} from './use-script-editor';

// Re-export as default for convenience
export { default as useScriptEditor } from './use-script-editor';

// ============================================================================
// STORAGE SERVICES HOOKS
// ============================================================================

/**
 * Storage services hooks for fetching available storage services with intelligent
 * caching using TanStack React Query. Provides group-based filtering for source
 * control and file services with background revalidation.
 * 
 * Includes parallel fetching capabilities for services and service types with
 * comprehensive error handling and retry strategies.
 * 
 * @example
 * ```typescript
 * import { useStorageServices, useServiceTypes } from '@/components/ui/script-editor/hooks';
 * 
 * function StorageServiceSelector() {
 *   const { services, isLoading, error } = useStorageServices({
 *     group: 'source control,file'
 *   });
 *   
 *   const { serviceTypes } = useServiceTypes();
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export {
  useStorageServices,
  useServiceTypes,
  useStorageServicesWithTypes,
  invalidateStorageServices,
  prefetchStorageServices,
  STORAGE_SERVICES_QUERY_KEYS,
  DEFAULT_STORAGE_GROUP,
  CACHE_CONFIG,
  type UseStorageServicesOptions,
  type UseStorageServicesReturn,
  type UseServiceTypesReturn
} from './useStorageServices';

// ============================================================================
// FILE OPERATIONS HOOKS
// ============================================================================

/**
 * Script file management hook providing comprehensive file upload and content
 * reading operations with native File API integration. Includes progress tracking,
 * cancellation support, validation, and React Hook Form integration.
 * 
 * Features automatic script type detection, comprehensive error handling with
 * retry logic, and memory management with proper cleanup patterns.
 * 
 * @example
 * ```typescript
 * import { useScriptFile, FileErrorCode } from '@/components/ui/script-editor/hooks';
 * 
 * function FileUploader() {
 *   const {
 *     uploadFile,
 *     uploadState,
 *     progress,
 *     cancelUpload
 *   } = useScriptFile({
 *     validation: { maxSize: 5 * 1024 * 1024 }, // 5MB
 *     enableProgress: true,
 *     enableCancellation: true
 *   });
 *   
 *   const handleFileSelect = async (file: File) => {
 *     const result = await uploadFile(file);
 *     if (result.success) {
 *       console.log('File uploaded:', result.content);
 *     }
 *   };
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export {
  useScriptFile,
  FileErrorCode,
  DEFAULT_VALIDATION,
  DEFAULT_RETRY,
  EXTENSION_TO_SCRIPT_TYPE,
  type FileValidationConfig,
  type FileUploadProgress,
  type FileOperationResult,
  type RetryOptions,
  type FormIntegrationConfig,
  type UseScriptFileConfig,
  type UseScriptFileReturn
} from './useScriptFile';

// Re-export default for convenience
export { default as useScriptFile } from './useScriptFile';

// ============================================================================
// GITHUB INTEGRATION HOOKS
// ============================================================================

/**
 * GitHub script import hook for managing GitHub script import functionality.
 * Handles dialog interactions, GitHub API integration with React Query caching,
 * and Base64 content decoding with comprehensive error handling.
 * 
 * Provides repository information fetching, file content retrieval, and
 * multiple file import capabilities with proper authentication support.
 * 
 * @example
 * ```typescript
 * import { useGithubImport } from '@/components/ui/script-editor/hooks';
 * 
 * function GitHubImporter() {
 *   const {
 *     state,
 *     openDialog,
 *     importFromUrl,
 *     validateUrl
 *   } = useGithubImport({
 *     allowedFileTypes: ['.js', '.ts', '.py'],
 *     enablePrivateRepos: true,
 *     onImportSuccess: (result) => {
 *       console.log('Imported scripts:', result.scripts);
 *     }
 *   });
 *   
 *   const handleImport = async (url: string) => {
 *     if (validateUrl(url)) {
 *       await importFromUrl(url);
 *     }
 *   };
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export {
  useGithubImport,
  type UseGitHubImportOptions,
  type UseGitHubImportReturn,
  type GitHubImportState
} from './useGithubImport';

// Re-export default for convenience
export { default as useGithubImport } from './useGithubImport';

// ============================================================================
// CACHE MANAGEMENT HOOKS
// ============================================================================

/**
 * Script cache management hook providing comprehensive cache operations including
 * viewing latest cached scripts and cache deletion with optimistic updates.
 * Implements React Query for intelligent server state management with automatic
 * format detection for JSON/file content.
 * 
 * Features background synchronization, error handling with retry strategies,
 * and user feedback integration through snackbar notifications.
 * 
 * @example
 * ```typescript
 * import { useScriptCache, FilePathUtils } from '@/components/ui/script-editor/hooks';
 * 
 * function CacheManager() {
 *   const {
 *     cacheEntries,
 *     isLoading,
 *     deleteCache,
 *     clearAllCache,
 *     getContent
 *   } = useScriptCache({
 *     enableRealTimeUpdates: true,
 *     showSuccessNotifications: true
 *   });
 *   
 *   const handleDeleteEntry = (id: string) => {
 *     deleteCache.mutate(id);
 *   };
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export {
  useScriptCache,
  FilePathUtils,
  CACHE_QUERY_KEYS,
  type ScriptCacheEntry,
  type CacheOperationResult,
  type CacheQueryParams,
  type UseScriptCacheOptions,
  type UseScriptCacheReturn,
  type SnackbarOptions
} from './useScriptCache';

// Re-export default for convenience
export { default as useScriptCache } from './useScriptCache';

// ============================================================================
// STORAGE VALIDATION HOOKS
// ============================================================================

/**
 * Storage path validation hook for managing storage path validation logic and
 * form control integration. Handles dynamic validation requirements where storage
 * path becomes required when a storage service is selected.
 * 
 * Provides real-time validation under 100ms requirement, automatic form field
 * reset behavior, and comprehensive error state management with user-friendly
 * validation messages.
 * 
 * @example
 * ```typescript
 * import { useStorageValidation } from '@/components/ui/script-editor/hooks';
 * 
 * function StorageForm() {
 *   const { handleSubmit, watch, setValue, clearErrors, setError, trigger, formState } = useForm();
 *   
 *   const {
 *     isStoragePathRequired,
 *     validateStoragePath,
 *     handleStorageServiceChange,
 *     storagePathValidationState
 *   } = useStorageValidation({
 *     watch,
 *     setValue,
 *     clearErrors,
 *     setError,
 *     trigger,
 *     errors: formState.errors,
 *     storageServices: availableServices,
 *     config: {
 *       realTimeValidation: true,
 *       debounceMs: 100
 *     }
 *   });
 *   
 *   return <div>...</div>;
 * }
 * ```
 */
export {
  useStorageValidation,
  type StorageValidationConfig,
  type StorageValidationFields,
  type UseStorageValidationReturn
} from './useStorageValidation';

// Re-export default for convenience
export { default as useStorageValidation } from './useStorageValidation';

// ============================================================================
// TYPE RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * Common types and interfaces used across script editor hooks.
 * Re-exported here for convenience and to maintain API consistency.
 */

// Form and validation types
export type {
  EnhancedValidationState,
  FormFieldValidation,
  FormFieldError
} from '@/types/forms';

// Script content types
export type {
  ScriptContent,
  ScriptType,
  ScriptContext,
  ScriptSource,
  StorageService,
  ScriptEditorFormSchema,
  FileOperationResult,
  ScriptEditorValidation,
  ScriptEditorProps,
  ScriptFile,
  FileUploadState
} from '../types';

// GitHub integration types
export type {
  GitHubFileContent,
  GitHubUrlInfo,
  GitHubCredentials,
  GitHubApiError,
  GitHubDialogResult,
  GitHubFileFetchOptions
} from '@/types/github';

// API types
export type {
  ApiResponse,
  ApiErrorResponse,
  GenericListResponse
} from '@/types/api';

// ============================================================================
// UTILITY FUNCTIONS AND CONSTANTS
// ============================================================================

/**
 * Utility constants and helper functions for script editor hooks.
 * These are commonly used across multiple hooks and provide consistent behavior.
 */

/**
 * Default configuration values used across script editor hooks
 */
export const SCRIPT_EDITOR_DEFAULTS = {
  /** Default validation debounce time (100ms for under 100ms requirement) */
  VALIDATION_DEBOUNCE_MS: 100,
  
  /** Default auto-save interval (30 seconds) */
  AUTO_SAVE_INTERVAL_MS: 30000,
  
  /** Default file upload chunk size (1MB) */
  UPLOAD_CHUNK_SIZE: 1024 * 1024,
  
  /** Default cache refresh interval (5 minutes) */
  CACHE_REFRESH_INTERVAL_MS: 5 * 60 * 1000,
  
  /** Default maximum file size (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  /** Default maximum retry attempts */
  MAX_RETRY_ATTEMPTS: 3,
  
  /** Default GitHub API timeout (10 seconds) */
  GITHUB_API_TIMEOUT_MS: 10000
} as const;

/**
 * Common query key factories for React Query cache management
 */
export const SCRIPT_EDITOR_QUERY_KEYS = {
  /** Base key for all script editor queries */
  all: ['script-editor'] as const,
  
  /** Storage services queries */
  storageServices: ['script-editor', 'storage-services'] as const,
  
  /** File operations queries */
  fileOperations: ['script-editor', 'file-operations'] as const,
  
  /** GitHub integration queries */
  github: ['script-editor', 'github'] as const,
  
  /** Cache management queries */
  cache: ['script-editor', 'cache'] as const,
  
  /** Validation queries */
  validation: ['script-editor', 'validation'] as const
} as const;

// ============================================================================
// MODULE METADATA
// ============================================================================

/**
 * Module version and compatibility information
 */
export const MODULE_INFO = {
  /** Module version */
  version: '1.0.0',
  
  /** Minimum React version required */
  minReactVersion: '19.0.0',
  
  /** Minimum Next.js version required */
  minNextJsVersion: '15.1.0',
  
  /** TypeScript version used */
  typescriptVersion: '5.8+',
  
  /** Last updated timestamp */
  lastUpdated: '2024-12-19T00:00:00.000Z',
  
  /** License information */
  license: 'MIT'
} as const;

/**
 * Tree-shaking optimization marker for Turbopack
 * This ensures the module is properly optimized during build
 */
export const __TREE_SHAKING_SUPPORTED__ = true;