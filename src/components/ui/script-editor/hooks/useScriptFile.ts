/**
 * React Hook for Script File Management
 * 
 * Provides comprehensive file upload and content reading operations for script content.
 * Handles native File API interactions with progress tracking, cancellation support,
 * and comprehensive error handling. Replaces Angular's file handling patterns with
 * modern React/Next.js patterns per technical specification requirements.
 * 
 * Features:
 * - Native File API integration with readAsText utility
 * - File upload progress tracking and cancellation support
 * - Comprehensive error handling with retry logic
 * - File validation including size restrictions and type checking
 * - TypeScript 5.8+ strict typing with proper File API interfaces
 * - React Hook Form integration for form validation and state synchronization
 * - Memory management with proper cleanup patterns for file operations
 * 
 * @fileoverview useScriptFile hook for managing local file upload operations
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { UseFormSetValue, UseFormTrigger, FieldPath, FieldValues } from 'react-hook-form';
import { ScriptType, ScriptFile, FileUploadState } from '../types';
import { LoadingState } from '@/types/ui';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * File validation configuration interface
 */
export interface FileValidationConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed file extensions (default: script extensions) */
  allowedExtensions?: string[];
  /** Allowed MIME types (default: text and script types) */
  allowedMimeTypes?: string[];
  /** Enable strict type checking */
  strictTypeCheck?: boolean;
}

/**
 * File upload progress information
 */
export interface FileUploadProgress {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Total bytes loaded */
  loaded: number;
  /** Total file size in bytes */
  total: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
  /** Current upload phase */
  phase: 'validating' | 'reading' | 'processing' | 'complete';
}

/**
 * File operation result with comprehensive error information
 */
export interface FileOperationResult {
  /** Operation success status */
  success: boolean;
  /** File content (on success) */
  content?: string;
  /** Script metadata (on success) */
  scriptFile?: ScriptFile;
  /** Error message (on failure) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: FileErrorCode;
  /** Additional error details */
  errorDetails?: {
    /** Error context */
    context: string;
    /** Original error object */
    originalError?: Error;
    /** Validation failures */
    validationErrors?: string[];
    /** Suggested retry actions */
    retryOptions?: RetryOptions;
  };
}

/**
 * Standardized file error codes
 */
export enum FileErrorCode {
  /** File size exceeds maximum allowed */
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  /** File type not supported */
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  /** File extension not allowed */
  INVALID_EXTENSION = 'INVALID_EXTENSION',
  /** File is empty or corrupted */
  EMPTY_FILE = 'EMPTY_FILE',
  /** File reading failed */
  READ_ERROR = 'READ_ERROR',
  /** Browser API not supported */
  API_NOT_SUPPORTED = 'API_NOT_SUPPORTED',
  /** Operation was cancelled by user */
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  /** Network or I/O error occurred */
  IO_ERROR = 'IO_ERROR',
  /** Generic validation failure */
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Enable automatic retry */
  enabled: boolean;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Retry delay in milliseconds */
  delay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Retry on specific error codes */
  retryOnErrorCodes: FileErrorCode[];
}

/**
 * React Hook Form integration configuration
 */
export interface FormIntegrationConfig<T extends FieldValues = FieldValues> {
  /** Form field name for content */
  contentFieldName?: FieldPath<T>;
  /** Form field name for script type */
  typeFieldName?: FieldPath<T>;
  /** Form field name for file name */
  fileNameFieldName?: FieldPath<T>;
  /** Form setValue function */
  setValue?: UseFormSetValue<T>;
  /** Form trigger validation function */
  trigger?: UseFormTrigger<T>;
  /** Auto-trigger validation after file load */
  autoTriggerValidation?: boolean;
}

/**
 * Hook configuration interface
 */
export interface UseScriptFileConfig<T extends FieldValues = FieldValues> {
  /** File validation configuration */
  validation?: FileValidationConfig;
  /** Retry configuration */
  retry?: RetryOptions;
  /** React Hook Form integration */
  formIntegration?: FormIntegrationConfig<T>;
  /** Enable progress tracking */
  enableProgress?: boolean;
  /** Enable cancellation support */
  enableCancellation?: boolean;
  /** Custom error message handler */
  onError?: (error: FileOperationResult) => void;
  /** Progress update callback */
  onProgress?: (progress: FileUploadProgress) => void;
  /** File load success callback */
  onSuccess?: (result: FileOperationResult) => void;
}

/**
 * Hook return interface
 */
export interface UseScriptFileReturn {
  /** Upload and read file content */
  uploadFile: (file: File) => Promise<FileOperationResult>;
  /** Current upload state */
  uploadState: FileUploadState;
  /** Current progress information */
  progress: FileUploadProgress | null;
  /** Cancel current upload operation */
  cancelUpload: () => void;
  /** Retry last failed operation */
  retryUpload: () => Promise<FileOperationResult | null>;
  /** Reset hook state */
  reset: () => void;
  /** Current file being processed */
  currentFile: File | null;
  /** Validate file without uploading */
  validateFile: (file: File) => Promise<{ valid: boolean; errors: string[] }>;
  /** Check if operation can be retried */
  canRetry: boolean;
  /** Last operation result */
  lastResult: FileOperationResult | null;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default file validation configuration
 */
const DEFAULT_VALIDATION: FileValidationConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.js', '.mjs', '.ts', '.php', '.py', '.json', '.yaml', '.yml', '.txt', '.md'],
  allowedMimeTypes: [
    'text/javascript',
    'application/javascript',
    'text/x-javascript',
    'application/x-javascript',
    'text/typescript',
    'application/typescript',
    'text/x-php',
    'application/x-php',
    'text/x-python',
    'application/x-python',
    'application/json',
    'text/json',
    'text/yaml',
    'application/yaml',
    'application/x-yaml',
    'text/x-yaml',
    'text/plain',
    'text/markdown',
    'text/*'
  ],
  strictTypeCheck: true
};

/**
 * Default retry configuration
 */
const DEFAULT_RETRY: RetryOptions = {
  enabled: true,
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  retryOnErrorCodes: [
    FileErrorCode.READ_ERROR,
    FileErrorCode.IO_ERROR,
    FileErrorCode.API_NOT_SUPPORTED
  ]
};

/**
 * Map file extensions to script types
 */
const EXTENSION_TO_SCRIPT_TYPE: Record<string, ScriptType> = {
  '.js': ScriptType.JAVASCRIPT,
  '.mjs': ScriptType.NODEJS,
  '.ts': ScriptType.JAVASCRIPT, // TypeScript treated as JavaScript for syntax highlighting
  '.php': ScriptType.PHP,
  '.py': ScriptType.PYTHON3,
  '.python': ScriptType.PYTHON,
  '.json': ScriptType.JSON,
  '.yaml': ScriptType.YAML,
  '.yml': ScriptType.YAML,
  '.txt': ScriptType.TEXT,
  '.md': ScriptType.TEXT
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract file extension from filename
 */
const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
};

/**
 * Determine script type from file extension
 */
const getScriptTypeFromFile = (file: File): ScriptType => {
  const extension = getFileExtension(file.name);
  return EXTENSION_TO_SCRIPT_TYPE[extension] || ScriptType.TEXT;
};

/**
 * Generate a unique file ID
 */
const generateFileId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate upload speed and time remaining
 */
const calculateProgressMetrics = (
  loaded: number,
  total: number,
  startTime: number
): { speed: number; timeRemaining: number } => {
  const elapsed = (Date.now() - startTime) / 1000;
  const speed = elapsed > 0 ? loaded / elapsed : 0;
  const remaining = total - loaded;
  const timeRemaining = speed > 0 ? remaining / speed : 0;
  
  return { speed, timeRemaining };
};

/**
 * Create user-friendly error messages
 */
const createErrorMessage = (errorCode: FileErrorCode, context?: string): string => {
  const messages: Record<FileErrorCode, string> = {
    [FileErrorCode.FILE_TOO_LARGE]: 'File size exceeds the maximum allowed limit. Please choose a smaller file.',
    [FileErrorCode.INVALID_FILE_TYPE]: 'File type is not supported. Please select a valid script file.',
    [FileErrorCode.INVALID_EXTENSION]: 'File extension is not allowed. Please choose a file with a supported extension.',
    [FileErrorCode.EMPTY_FILE]: 'File appears to be empty or corrupted. Please choose a different file.',
    [FileErrorCode.READ_ERROR]: 'Failed to read file content. Please try again.',
    [FileErrorCode.API_NOT_SUPPORTED]: 'File operations are not supported in this browser. Please use a modern browser.',
    [FileErrorCode.OPERATION_CANCELLED]: 'File upload was cancelled.',
    [FileErrorCode.IO_ERROR]: 'An I/O error occurred while processing the file. Please try again.',
    [FileErrorCode.VALIDATION_ERROR]: 'File validation failed. Please check the file and try again.'
  };
  
  const baseMessage = messages[errorCode] || 'An unexpected error occurred.';
  return context ? `${baseMessage} Context: ${context}` : baseMessage;
};

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * useScriptFile Hook
 * 
 * Provides comprehensive file upload and content reading operations for script content.
 * Integrates with React Hook Form and provides progress tracking, error handling,
 * and cancellation support.
 */
export function useScriptFile<T extends FieldValues = FieldValues>(
  config: UseScriptFileConfig<T> = {}
): UseScriptFileReturn {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [uploadState, setUploadState] = useState<FileUploadState>({
    loading: false,
    error: null,
    progress: 0
  });
  
  const [progress, setProgress] = useState<FileUploadProgress | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [lastResult, setLastResult] = useState<FileOperationResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  
  // ========================================================================
  // REFS AND CONFIGURATION
  // ========================================================================
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFileRef = useRef<File | null>(null);
  
  const validation = { ...DEFAULT_VALIDATION, ...config.validation };
  const retry = { ...DEFAULT_RETRY, ...config.retry };
  const formIntegration = config.formIntegration;
  
  // ========================================================================
  // CLEANUP EFFECTS
  // ========================================================================
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }
    };
  }, []);
  
  // ========================================================================
  // VALIDATION FUNCTIONS
  // ========================================================================
  
  /**
   * Validate file against configuration rules
   */
  const validateFile = useCallback(async (file: File): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > validation.maxSize!) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(validation.maxSize! / 1024 / 1024).toFixed(2)}MB)`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
      errors.push('File is empty');
    }
    
    // Check file extension
    const extension = getFileExtension(file.name);
    if (validation.allowedExtensions?.length && !validation.allowedExtensions.includes(extension)) {
      errors.push(`File extension "${extension}" is not allowed. Supported extensions: ${validation.allowedExtensions.join(', ')}`);
    }
    
    // Check MIME type if strict checking is enabled
    if (validation.strictTypeCheck && validation.allowedMimeTypes?.length) {
      const mimeTypeAllowed = validation.allowedMimeTypes.some(allowedType => {
        if (allowedType.endsWith('/*')) {
          const prefix = allowedType.slice(0, -2);
          return file.type.startsWith(prefix);
        }
        return file.type === allowedType;
      });
      
      if (!mimeTypeAllowed) {
        errors.push(`File type "${file.type}" is not allowed. Supported types: ${validation.allowedMimeTypes.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }, [validation]);
  
  // ========================================================================
  // PROGRESS TRACKING
  // ========================================================================
  
  /**
   * Update progress with metrics calculation
   */
  const updateProgress = useCallback((phase: FileUploadProgress['phase'], loaded: number, total: number) => {
    if (!config.enableProgress) return;
    
    const progressPercentage = total > 0 ? (loaded / total) * 100 : 0;
    const metrics = calculateProgressMetrics(loaded, total, startTimeRef.current);
    
    const progressInfo: FileUploadProgress = {
      progress: Math.min(100, Math.max(0, progressPercentage)),
      loaded,
      total,
      phase,
      speed: metrics.speed,
      timeRemaining: metrics.timeRemaining
    };
    
    setProgress(progressInfo);
    setUploadState(prev => ({
      ...prev,
      progress: progressInfo.progress
    }));
    
    config.onProgress?.(progressInfo);
  }, [config]);
  
  // ========================================================================
  // FORM INTEGRATION
  // ========================================================================
  
  /**
   * Update form fields with file content and metadata
   */
  const updateFormFields = useCallback(async (content: string, file: File) => {
    if (!formIntegration?.setValue) return;
    
    const { setValue, trigger, contentFieldName, typeFieldName, fileNameFieldName, autoTriggerValidation } = formIntegration;
    
    // Update content field
    if (contentFieldName) {
      setValue(contentFieldName, content as any);
    }
    
    // Update script type field
    if (typeFieldName) {
      const scriptType = getScriptTypeFromFile(file);
      setValue(typeFieldName, scriptType as any);
    }
    
    // Update file name field
    if (fileNameFieldName) {
      setValue(fileNameFieldName, file.name as any);
    }
    
    // Trigger validation if enabled
    if (autoTriggerValidation && trigger) {
      await trigger();
    }
  }, [formIntegration]);
  
  // ========================================================================
  // FILE READING IMPLEMENTATION
  // ========================================================================
  
  /**
   * Read file content using FileReader API with progress tracking
   */
  const readFileContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      fileReaderRef.current = reader;
      
      reader.onloadstart = () => {
        updateProgress('reading', 0, file.size);
      };
      
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          updateProgress('reading', event.loaded, event.total);
        }
      };
      
      reader.onload = () => {
        updateProgress('processing', file.size, file.size);
        
        const result = reader.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => {
        const error = reader.error || new Error('File reading failed');
        reject(error);
      };
      
      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };
      
      // Start reading the file as text
      reader.readAsText(file, 'UTF-8');
    });
  }, [updateProgress]);
  
  // ========================================================================
  // RETRY LOGIC
  // ========================================================================
  
  /**
   * Execute operation with retry logic
   */
  const executeWithRetry = useCallback(async <TResult>(
    operation: () => Promise<TResult>,
    errorCode: FileErrorCode,
    context: string
  ): Promise<TResult> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retry.maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry with exponential backoff
          const delay = retry.delay * Math.pow(retry.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await operation();
        setRetryCount(0); // Reset retry count on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry this error
        const shouldRetry = retry.enabled && 
                           retry.retryOnErrorCodes.includes(errorCode) && 
                           attempt < retry.maxAttempts;
        
        if (!shouldRetry) {
          break;
        }
        
        setRetryCount(attempt + 1);
      }
    }
    
    throw lastError!;
  }, [retry]);
  
  // ========================================================================
  // MAIN UPLOAD FUNCTION
  // ========================================================================
  
  /**
   * Upload and process file with comprehensive error handling
   */
  const uploadFile = useCallback(async (file: File): Promise<FileOperationResult> => {
    // Reset state
    setUploadState({ loading: true, error: null, progress: 0 });
    setProgress(null);
    setCurrentFile(file);
    setCanRetry(false);
    startTimeRef.current = Date.now();
    lastFileRef.current = file;
    
    // Create abort controller for cancellation support
    if (config.enableCancellation) {
      abortControllerRef.current = new AbortController();
    }
    
    try {
      // Phase 1: Validation
      updateProgress('validating', 0, file.size);
      
      const validationResult = await validateFile(file);
      if (!validationResult.valid) {
        const result: FileOperationResult = {
          success: false,
          error: 'File validation failed',
          errorCode: FileErrorCode.VALIDATION_ERROR,
          errorDetails: {
            context: 'File validation',
            validationErrors: validationResult.errors
          }
        };
        
        setLastResult(result);
        setUploadState({ loading: false, error: result.error!, progress: 0 });
        config.onError?.(result);
        return result;
      }
      
      // Phase 2: Reading
      const content = await executeWithRetry(
        () => readFileContent(file),
        FileErrorCode.READ_ERROR,
        'File content reading'
      );
      
      // Check for cancellation
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Operation was cancelled');
      }
      
      // Phase 3: Processing
      updateProgress('processing', file.size, file.size);
      
      // Create script file metadata
      const scriptFile: ScriptFile = {
        id: generateFileId(),
        name: file.name,
        path: file.name,
        size: file.size,
        mime_type: file.type,
        extension: getFileExtension(file.name),
        script_type: getScriptTypeFromFile(file),
        last_modified: new Date(file.lastModified).toISOString(),
        permissions: {
          read: true,
          write: true,
          execute: false
        }
      };
      
      // Update form fields if integration is configured
      await updateFormFields(content, file);
      
      // Complete
      updateProgress('complete', file.size, file.size);
      
      const result: FileOperationResult = {
        success: true,
        content,
        scriptFile
      };
      
      setLastResult(result);
      setUploadState({ loading: false, error: null, progress: 100 });
      config.onSuccess?.(result);
      
      return result;
      
    } catch (error) {
      const isAborted = abortControllerRef.current?.signal.aborted || 
                       error instanceof Error && error.message.includes('abort');
      
      const errorCode = isAborted ? FileErrorCode.OPERATION_CANCELLED : 
                       error instanceof Error && error.name === 'NotReadableError' ? FileErrorCode.READ_ERROR :
                       FileErrorCode.IO_ERROR;
      
      const result: FileOperationResult = {
        success: false,
        error: createErrorMessage(errorCode),
        errorCode,
        errorDetails: {
          context: 'File upload and processing',
          originalError: error instanceof Error ? error : new Error(String(error)),
          retryOptions: retry.enabled && retry.retryOnErrorCodes.includes(errorCode) ? retry : undefined
        }
      };
      
      setLastResult(result);
      setCanRetry(retry.enabled && retry.retryOnErrorCodes.includes(errorCode));
      setUploadState({ loading: false, error: result.error!, progress: 0 });
      config.onError?.(result);
      
      return result;
    } finally {
      setCurrentFile(null);
      abortControllerRef.current = null;
      fileReaderRef.current = null;
    }
  }, [config, validateFile, updateProgress, readFileContent, executeWithRetry, updateFormFields, retry]);
  
  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  
  /**
   * Cancel current upload operation
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (fileReaderRef.current) {
      fileReaderRef.current.abort();
    }
    
    setUploadState({ loading: false, error: 'Upload cancelled', progress: 0 });
    setProgress(null);
    setCurrentFile(null);
  }, []);
  
  /**
   * Retry last failed operation
   */
  const retryUpload = useCallback(async (): Promise<FileOperationResult | null> => {
    if (!canRetry || !lastFileRef.current) {
      return null;
    }
    
    return uploadFile(lastFileRef.current);
  }, [canRetry, uploadFile]);
  
  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    cancelUpload();
    setUploadState({ loading: false, error: null, progress: 0 });
    setProgress(null);
    setCurrentFile(null);
    setLastResult(null);
    setRetryCount(0);
    setCanRetry(false);
    lastFileRef.current = null;
  }, [cancelUpload]);
  
  // ========================================================================
  // RETURN HOOK INTERFACE
  // ========================================================================
  
  return {
    uploadFile,
    uploadState,
    progress,
    cancelUpload,
    retryUpload,
    reset,
    currentFile,
    validateFile,
    canRetry,
    lastResult
  };
}

export default useScriptFile;

// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

export type {
  FileValidationConfig,
  FileUploadProgress,
  FileOperationResult,
  RetryOptions,
  FormIntegrationConfig,
  UseScriptFileConfig,
  UseScriptFileReturn
};

export {
  FileErrorCode,
  DEFAULT_VALIDATION,
  DEFAULT_RETRY,
  EXTENSION_TO_SCRIPT_TYPE
};