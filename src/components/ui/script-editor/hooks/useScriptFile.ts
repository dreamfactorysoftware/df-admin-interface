/**
 * React Hook for Script File Upload Management
 * 
 * Provides comprehensive file upload and content reading operations for script files
 * with progress tracking, validation, error handling, and React Hook Form integration.
 * Replaces Angular file handling patterns with modern React hooks architecture.
 * 
 * @fileoverview Script file upload hook with File API integration
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { 
  type FileUploadState, 
  type FileUploadConfig, 
  type FileUploadValidation,
  type FileMetadata,
  type FileUploadResult,
  type ScriptEditorFormData,
  FileUploadSchema 
} from '../types';
import { type ValidationState } from '../../../../types/ui';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default file upload configuration with security-focused restrictions
 */
const DEFAULT_CONFIG: Required<FileUploadConfig> = {
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
  maxSize: 10 * 1024 * 1024, // 10MB limit for security
  multiple: false,
  enableDragDrop: true,
  trackProgress: true,
  validation: {
    validateExtension: true,
    validateMimeType: true,
    validateContent: true,
    maxSize: 10 * 1024 * 1024,
    minSize: 1, // At least 1 byte
  },
};

/**
 * Supported file extensions for script files
 */
const SCRIPT_EXTENSIONS = [
  '.js', '.mjs', '.jsx',
  '.ts', '.tsx',
  '.py', '.python',
  '.php',
  '.json',
  '.yaml', '.yml',
  '.xml',
  '.html', '.htm',
  '.css',
  '.sql',
  '.md', '.markdown',
  '.txt',
] as const;

/**
 * Error messages for different validation failures
 */
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB',
  FILE_TOO_SMALL: 'File is empty or too small',
  INVALID_TYPE: 'File type is not supported for script editing',
  INVALID_EXTENSION: 'File extension is not allowed',
  EMPTY_CONTENT: 'File content is empty',
  READ_FAILED: 'Failed to read file content',
  ENCODING_ERROR: 'File encoding is not supported',
  NETWORK_ERROR: 'Network error during file processing',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const;

/**
 * Retry configuration for failed operations
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000, // 5 seconds
  backoffMultiplier: 2,
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extracts file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex).toLowerCase();
}

/**
 * Validates file extension against allowed script extensions
 */
function isValidScriptExtension(filename: string): boolean {
  const extension = getFileExtension(filename);
  return SCRIPT_EXTENSIONS.includes(extension as any);
}

/**
 * Generates SHA-256 hash of file content for integrity verification
 */
async function generateContentHash(content: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Failed to generate content hash:', error);
    return '';
  }
}

/**
 * Detects text encoding from file content
 */
function detectEncoding(content: string): string {
  // Basic encoding detection - can be enhanced with more sophisticated detection
  try {
    // Check for UTF-8 BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      return 'utf-8-bom';
    }
    
    // Assume UTF-8 for most text files
    return 'utf-8';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Implements exponential backoff for retry logic
 */
function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Creates a sleep function for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// HOOK INTERFACE AND TYPES
// =============================================================================

/**
 * Configuration options for useScriptFile hook
 */
export interface UseScriptFileConfig extends Partial<FileUploadConfig> {
  /** React Hook Form instance for integration */
  form?: UseFormReturn<ScriptEditorFormData>;
  /** Field name for form registration */
  fieldName?: string;
  /** Enable automatic form value updates */
  autoUpdateForm?: boolean;
  /** Custom validation function */
  customValidator?: (file: File, content: string) => Promise<string | null>;
  /** Progress callback */
  onProgress?: (progress: number) => void;
  /** Success callback */
  onSuccess?: (content: string, metadata: FileMetadata) => void;
  /** Error callback */
  onError?: (error: string, details?: any) => void;
}

/**
 * Return type for useScriptFile hook
 */
export interface UseScriptFileReturn {
  /** Current file upload state */
  state: FileUploadState;
  /** Validation state for the file */
  validation: ValidationState;
  /** Upload file and read content */
  uploadFile: (file: File) => Promise<void>;
  /** Clear current file and reset state */
  clearFile: () => void;
  /** Cancel ongoing upload operation */
  cancelUpload: () => void;
  /** Retry failed upload */
  retryUpload: () => Promise<void>;
  /** Validate file without uploading */
  validateFile: (file: File) => Promise<string | null>;
  /** Get file content as text */
  getContent: () => string | null;
  /** Get file metadata */
  getMetadata: () => FileMetadata | null;
  /** Check if upload is in progress */
  isUploading: () => boolean;
  /** Check if file has been uploaded */
  hasFile: () => boolean;
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom React hook for managing script file uploads with comprehensive
 * error handling, progress tracking, and form integration.
 * 
 * Features:
 * - Native File API integration with progress tracking
 * - Comprehensive validation (size, type, content)
 * - Retry logic with exponential backoff
 * - React Hook Form integration
 * - Memory management and cleanup
 * - Cancellation support
 * 
 * @param config - Configuration options for file upload behavior
 * @returns Hook interface with state and methods
 */
export function useScriptFile(config: UseScriptFileConfig = {}): UseScriptFileReturn {
  // Merge configuration with defaults
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // File upload state
  const [state, setState] = useState<FileUploadState>({
    isLoading: false,
    progress: 0,
    error: null,
  });
  
  // Validation state
  const [validation, setValidation] = useState<ValidationState>({
    isValid: true,
    isDirty: false,
    isTouched: false,
  });
  
  // Internal state
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);

  // =============================================================================
  // VALIDATION FUNCTIONS
  // =============================================================================

  /**
   * Validates file against all configured validation rules
   */
  const validateFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Validate with Zod schema first
      const schemaResult = FileUploadSchema.safeParse({
        file,
        size: file.size,
        type: file.type,
      });
      
      if (!schemaResult.success) {
        return schemaResult.error.errors[0]?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
      }

      // File size validation
      if (mergedConfig.validation.maxSize && file.size > mergedConfig.validation.maxSize) {
        return ERROR_MESSAGES.FILE_TOO_LARGE;
      }
      
      if (mergedConfig.validation.minSize && file.size < mergedConfig.validation.minSize) {
        return ERROR_MESSAGES.FILE_TOO_SMALL;
      }

      // MIME type validation
      if (mergedConfig.validation.validateMimeType) {
        if (!mergedConfig.acceptedTypes.includes(file.type)) {
          return ERROR_MESSAGES.INVALID_TYPE;
        }
      }

      // File extension validation
      if (mergedConfig.validation.validateExtension) {
        if (!isValidScriptExtension(file.name)) {
          return ERROR_MESSAGES.INVALID_EXTENSION;
        }
      }

      // Custom validation if provided
      if (config.customValidator) {
        // Read file content for custom validation
        const content = await readFileContent(file);
        const customError = await config.customValidator(file, content);
        if (customError) {
          return customError;
        }
      }

      return null; // Valid file
    } catch (error) {
      console.error('File validation error:', error);
      return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }, [mergedConfig, config.customValidator]);

  // =============================================================================
  // FILE READING FUNCTIONS
  // =============================================================================

  /**
   * Reads file content as text with progress tracking and cancellation support
   */
  const readFileContent = useCallback(async (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      // Create new AbortController for this operation
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Create FileReader instance
      const reader = new FileReader();
      fileReaderRef.current = reader;

      // Progress tracking
      reader.onprogress = (event) => {
        if (event.lengthComputable && mergedConfig.trackProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setState(prev => ({ ...prev, progress }));
          config.onProgress?.(progress);
        }
      };

      // Success handler
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        if (!content || content.trim().length === 0) {
          reject(new Error(ERROR_MESSAGES.EMPTY_CONTENT));
          return;
        }

        resolve(content);
      };

      // Error handler
      reader.onerror = () => {
        const error = reader.error || new Error(ERROR_MESSAGES.READ_FAILED);
        reject(error);
      };

      // Abort handler
      reader.onabort = () => {
        reject(new Error('File reading was cancelled'));
      };

      // Handle cancellation
      signal.addEventListener('abort', () => {
        reader.abort();
      });

      // Start reading the file
      try {
        reader.readAsText(file);
      } catch (error) {
        reject(error);
      }
    });
  }, [mergedConfig.trackProgress, config.onProgress]);

  /**
   * Creates file metadata from File object and content
   */
  const createFileMetadata = useCallback(async (file: File, content: string): Promise<FileMetadata> => {
    const extension = getFileExtension(file.name);
    const encoding = detectEncoding(content);
    const hash = await generateContentHash(content);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension,
      encoding,
      hash,
    };
  }, []);

  // =============================================================================
  // MAIN UPLOAD FUNCTION
  // =============================================================================

  /**
   * Main file upload function with comprehensive error handling and retry logic
   */
  const uploadFile = useCallback(async (file: File): Promise<void> => {
    // Update touched state
    setValidation(prev => ({ ...prev, isTouched: true }));

    // Reset retry count for new file
    if (lastFile !== file) {
      setRetryCount(0);
      setLastFile(file);
    }

    // Increment retry count
    const currentRetry = retryCount + 1;
    setRetryCount(currentRetry);

    try {
      // Set loading state
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        progress: 0,
      }));

      // Validate file first
      const validationError = await validateFile(file);
      if (validationError) {
        setValidation(prev => ({
          ...prev,
          isValid: false,
          error: validationError,
        }));
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: validationError,
        }));
        
        config.onError?.(validationError);
        return;
      }

      // Read file content
      const content = await readFileContent(file);
      
      // Content validation
      if (mergedConfig.validation.validateContent && content.trim().length === 0) {
        throw new Error(ERROR_MESSAGES.EMPTY_CONTENT);
      }

      // Create metadata
      const metadata = await createFileMetadata(file, content);

      // Create successful result
      const result: FileUploadResult = {
        success: true,
        message: `Successfully loaded ${file.name}`,
        path: file.name,
        timestamp: new Date(),
      };

      // Update state with success
      setState(prev => ({
        ...prev,
        isLoading: false,
        progress: 100,
        file,
        content,
        metadata,
        result,
        error: null,
      }));

      // Update validation state
      setValidation(prev => ({
        ...prev,
        isValid: true,
        isDirty: true,
        error: undefined,
      }));

      // Update form if configured
      if (config.form && config.autoUpdateForm !== false) {
        const fieldName = config.fieldName || 'content';
        config.form.setValue(fieldName as any, content, { 
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
      }

      // Reset retry count on success
      setRetryCount(0);

      // Success callback
      config.onSuccess?.(content, metadata);

    } catch (error) {
      console.error('File upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      
      // Check if we should retry
      if (currentRetry < RETRY_CONFIG.maxAttempts && 
          !errorMessage.includes('cancelled') &&
          !errorMessage.includes('abort')) {
        
        // Calculate retry delay
        const delay = calculateRetryDelay(currentRetry);
        
        // Wait before retry
        await sleep(delay);
        
        // Retry if not cancelled
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          return uploadFile(file);
        }
      }

      // Create error result
      const result: FileUploadResult = {
        success: false,
        error: errorMessage,
        message: `Failed to load ${file.name}`,
        timestamp: new Date(),
      };

      // Update state with error
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        result,
      }));

      // Update validation state
      setValidation(prev => ({
        ...prev,
        isValid: false,
        error: errorMessage,
      }));

      // Error callback
      config.onError?.(errorMessage, error);
    }
  }, [lastFile, retryCount, validateFile, readFileContent, createFileMetadata, mergedConfig, config]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Clears current file and resets all state
   */
  const clearFile = useCallback(() => {
    // Cancel any ongoing operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state
    setState({
      isLoading: false,
      progress: 0,
      error: null,
    });

    setValidation({
      isValid: true,
      isDirty: false,
      isTouched: false,
    });

    setLastFile(null);
    setRetryCount(0);

    // Clear form field if configured
    if (config.form && config.autoUpdateForm !== false) {
      const fieldName = config.fieldName || 'content';
      config.form.setValue(fieldName as any, '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [config.form, config.autoUpdateForm, config.fieldName]);

  /**
   * Cancels ongoing upload operation
   */
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Upload cancelled by user',
    }));
  }, []);

  /**
   * Retries failed upload with the last file
   */
  const retryUpload = useCallback(async (): Promise<void> => {
    if (lastFile) {
      await uploadFile(lastFile);
    }
  }, [lastFile, uploadFile]);

  /**
   * Gets current file content
   */
  const getContent = useCallback((): string | null => {
    return state.content || null;
  }, [state.content]);

  /**
   * Gets current file metadata
   */
  const getMetadata = useCallback((): FileMetadata | null => {
    return state.metadata || null;
  }, [state.metadata]);

  /**
   * Checks if upload is currently in progress
   */
  const isUploading = useCallback((): boolean => {
    return state.isLoading;
  }, [state.isLoading]);

  /**
   * Checks if a file has been successfully uploaded
   */
  const hasFile = useCallback((): boolean => {
    return !!state.file && !!state.content;
  }, [state.file, state.content]);

  // =============================================================================
  // CLEANUP EFFECTS
  // =============================================================================

  /**
   * Cleanup effect to abort ongoing operations on unmount
   */
  useEffect(() => {
    return () => {
      // Cancel any ongoing operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clean up FileReader
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
      }
    };
  }, []);

  // =============================================================================
  // RETURN HOOK INTERFACE
  // =============================================================================

  return {
    state,
    validation,
    uploadFile,
    clearFile,
    cancelUpload,
    retryUpload,
    validateFile,
    getContent,
    getMetadata,
    isUploading,
    hasFile,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useScriptFile;
export type { UseScriptFileConfig, UseScriptFileReturn };