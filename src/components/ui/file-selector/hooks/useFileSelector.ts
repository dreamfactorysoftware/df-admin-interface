/**
 * File Selector State Management Hook
 * 
 * React hook that manages file selector component state including selected files,
 * navigation history, loading states, and user interactions. Provides stateful file
 * selection logic with folder navigation, file filtering, and selection validation.
 * 
 * Integrates with useFileApi hook for server operations while maintaining local UI state.
 * Supports React Hook Form integration, file validation, and comprehensive navigation
 * history management for optimal user experience.
 * 
 * @fileoverview File selector state management hook with React 19 patterns
 * @version 1.0.0
 * @migrated_from Angular reactive forms and services
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import { z } from 'zod';
import type {
  SelectedFile,
  FileMetadata,
  FileApiInfo,
  FileValidationResult,
  FileValidationError,
  FileValidationErrorCode,
  FileSelectionMode,
  UploadMode,
  FileSelectorVariant,
  FileEventHandlers,
  UploadOptions,
  FileFilter,
  LoadingState,
} from '../types';
import {
  SelectedFileSchema,
  FileMetadataSchema,
  isSelectedFile,
  isFileMetadata,
} from '../types';
import { useFileApi, useFileList } from './useFileApi';
import type { LoadingState as UILoadingState } from '../../../types/ui';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Default file validation configuration
 */
const DEFAULT_VALIDATION_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  allowedExtensions: [] as string[], // Empty means all allowed
  allowedMimeTypes: [] as string[], // Empty means all allowed
  validateOnSelection: true,
  validateOnNavigation: false,
} as const;

/**
 * Default navigation configuration
 */
const DEFAULT_NAVIGATION_CONFIG = {
  maxHistorySize: 50,
  enableBackButton: true,
  enableForwardButton: true,
  enableBreadcrumbs: true,
  rememberLastPath: true,
} as const;

/**
 * Default upload configuration
 */
const DEFAULT_UPLOAD_CONFIG: UploadOptions = {
  overwrite: false,
  generateThumbnails: true,
  extractMetadata: true,
  chunked: true,
  chunkSize: 1024 * 1024, // 1MB chunks
  timeout: 30000, // 30 seconds
} as const;

/**
 * File size units for human-readable display
 */
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for file selector configuration validation
 */
const FileSelectorConfigSchema = z.object({
  apiInfo: z.object({
    serviceName: z.string().min(1, 'Service name is required'),
    basePath: z.string(),
    maxFileSize: z.number().int().positive(),
    allowedExtensions: z.array(z.string()).optional(),
    allowedMimeTypes: z.array(z.string()).optional(),
    permissions: z.object({
      canRead: z.boolean(),
      canWrite: z.boolean(),
      canUpload: z.boolean(),
      canCreateFolders: z.boolean(),
    }),
  }),
  selectionMode: z.enum(['single', 'multiple', 'directory', 'mixed']),
  uploadMode: z.enum(['manual', 'automatic', 'queue', 'disabled']),
  maxFiles: z.number().int().positive().optional(),
  validation: z.object({
    maxFileSize: z.number().int().positive(),
    allowedExtensions: z.array(z.string()),
    allowedMimeTypes: z.array(z.string()),
    validateOnSelection: z.boolean(),
  }).optional(),
});

/**
 * Navigation history entry schema
 */
const NavigationHistoryEntrySchema = z.object({
  path: z.string(),
  timestamp: z.number(),
  files: z.array(FileMetadataSchema).optional(),
  selectedFiles: z.array(z.string()).optional(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size for human-readable display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = 2;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${FILE_SIZE_UNITS[i]}`;
}

/**
 * Extract file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : '';
}

/**
 * Check if file extension is allowed
 */
function isExtensionAllowed(filename: string, allowedExtensions: string[]): boolean {
  if (allowedExtensions.length === 0) return true;
  
  const extension = getFileExtension(filename);
  return allowedExtensions.some(allowed => 
    allowed.toLowerCase() === extension || 
    allowed.toLowerCase() === extension.substring(1) // Handle both ".jpg" and "jpg"
  );
}

/**
 * Check if MIME type is allowed
 */
function isMimeTypeAllowed(mimeType: string, allowedMimeTypes: string[]): boolean {
  if (allowedMimeTypes.length === 0) return true;
  
  return allowedMimeTypes.some(allowed => {
    // Support wildcards like "image/*"
    if (allowed.endsWith('/*')) {
      const baseType = allowed.substring(0, allowed.length - 2);
      return mimeType.startsWith(baseType);
    }
    return allowed.toLowerCase() === mimeType.toLowerCase();
  });
}

/**
 * Create a file validation error
 */
function createValidationError(
  code: FileValidationErrorCode,
  message: string,
  context?: Record<string, any>,
  suggestion?: string
): FileValidationError {
  return {
    code,
    message,
    context,
    suggestion,
  };
}

/**
 * Convert File object to SelectedFile
 */
function fileToSelectedFile(
  file: File,
  serviceName: string,
  path: string = '',
  uploadOptions?: UploadOptions
): SelectedFile {
  const relativePath = path ? `${path}/${file.name}` : file.name;
  
  return {
    file,
    path: relativePath,
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    extension: getFileExtension(file.name),
    type: determineFileType(file.type),
    isDirectory: false,
    uploadState: 'pending',
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: new Date().toISOString(),
      appliedRules: [],
    },
    uploadOptions,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date(file.lastModified).toISOString(),
  };
}

/**
 * Determine file type category from MIME type
 */
function determineFileType(mimeType: string): SelectedFile['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('text/') || mimeType.includes('application/json')) return 'text';
  if (mimeType.includes('application/vnd.ms-excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
  if (mimeType.includes('application/vnd.ms-powerpoint') || mimeType.includes('presentation')) return 'presentation';
  if (mimeType.includes('application/msword') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('application/zip') || mimeType.includes('compressed')) return 'archive';
  if (mimeType.includes('application/javascript') || mimeType.includes('text/x-')) return 'code';
  if (mimeType.includes('font/')) return 'font';
  if (mimeType.includes('application/octet-stream')) return 'executable';
  
  return 'other';
}

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * File selector configuration interface
 */
export interface FileSelectorConfig {
  /** File API information and constraints */
  apiInfo: FileApiInfo;
  
  /** File selection mode */
  selectionMode: FileSelectionMode;
  
  /** Upload mode behavior */
  uploadMode: UploadMode;
  
  /** Maximum number of files that can be selected */
  maxFiles?: number;
  
  /** File validation configuration */
  validation?: {
    maxFileSize: number;
    allowedExtensions: string[];
    allowedMimeTypes: string[];
    validateOnSelection: boolean;
  };
  
  /** Navigation configuration */
  navigation?: {
    maxHistorySize: number;
    enableBackButton: boolean;
    enableForwardButton: boolean;
    enableBreadcrumbs: boolean;
    rememberLastPath: boolean;
  };
  
  /** Upload configuration */
  uploadOptions?: UploadOptions;
  
  /** Initial path to open */
  initialPath?: string;
  
  /** Initial selected files */
  initialValue?: string | string[] | SelectedFile | SelectedFile[];
  
  /** Custom file filters */
  customFilters?: FileFilter[];
  
  /** Event handlers */
  eventHandlers?: Partial<FileEventHandlers>;
}

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  path: string;
  timestamp: number;
  files?: FileMetadata[];
  selectedFiles?: string[];
}

/**
 * File selector state interface
 */
export interface FileSelectorState {
  // Selection state
  selectedFiles: SelectedFile[];
  currentPath: string;
  
  // Navigation state
  navigationHistory: NavigationHistoryEntry[];
  historyIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;
  
  // UI state
  loading: UILoadingState;
  isDialogOpen: boolean;
  viewMode: 'grid' | 'list' | 'table';
  searchTerm: string;
  activeFilters: FileFilter[];
  
  // Validation state
  validationErrors: Record<string, FileValidationError[]>;
  hasValidationErrors: boolean;
  
  // Upload state
  uploadProgress: Record<string, number>;
  activeUploads: string[];
}

/**
 * File selector actions interface
 */
export interface FileSelectorActions {
  // File selection
  selectFile: (file: FileMetadata | File) => void;
  deselectFile: (fileId: string) => void;
  selectMultipleFiles: (files: (FileMetadata | File)[]) => void;
  clearSelection: () => void;
  selectAll: (files: FileMetadata[]) => void;
  
  // Navigation
  navigateTo: (path: string) => void;
  navigateBack: () => void;
  navigateForward: () => void;
  refreshCurrentPath: () => void;
  
  // File operations
  uploadSelectedFiles: () => Promise<void>;
  removeFile: (fileId: string) => void;
  createFolder: (name: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  
  // UI operations
  openDialog: () => void;
  closeDialog: () => void;
  setViewMode: (mode: 'grid' | 'list' | 'table') => void;
  setSearchTerm: (term: string) => void;
  toggleFilter: (filter: FileFilter) => void;
  
  // Validation
  validateFile: (file: File) => FileValidationResult;
  validateSelection: () => boolean;
  
  // Form integration
  setValue: (value: string | string[] | SelectedFile | SelectedFile[]) => void;
  getValue: () => string | string[] | SelectedFile | SelectedFile[];
  
  // Programmatic control
  setInitialValue: (value: string | string[] | SelectedFile | SelectedFile[]) => void;
  resetToInitial: () => void;
}

/**
 * useFileSelector hook return type
 */
export interface UseFileSelectorReturn extends FileSelectorState, FileSelectorActions {
  // File listing from API
  files: FileMetadata[];
  isLoadingFiles: boolean;
  filesError: Error | null;
  
  // File services
  fileServices: FileApiInfo[];
  isLoadingServices: boolean;
  
  // Hook configuration
  config: FileSelectorConfig;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * useFileSelector Hook
 * 
 * Comprehensive file selector state management with React 19 patterns,
 * navigation history, validation, and React Hook Form integration.
 */
export function useFileSelector(
  config: FileSelectorConfig,
  formFieldName?: string
): UseFileSelectorReturn {
  
  // =========================================================================
  // CONFIGURATION VALIDATION
  // =========================================================================
  
  const validatedConfig = useMemo(() => {
    try {
      return FileSelectorConfigSchema.parse(config);
    } catch (error) {
      console.error('Invalid file selector configuration:', error);
      throw new Error('File selector configuration validation failed');
    }
  }, [config]);

  // =========================================================================
  // EXTERNAL DEPENDENCIES
  // =========================================================================
  
  const {
    fileServices,
    isLoadingServices,
    createFileListQuery,
    uploadFile,
    uploadFileAsync,
    isUploading,
    uploadError,
    createDirectory,
    createDirectoryAsync,
    isCreatingDirectory,
    deleteFile: deleteFileApi,
    deleteFileAsync,
    isDeletingFile,
    invalidateFileList,
  } = useFileApi();

  // React Hook Form integration (optional)
  const formContext = useFormContext();
  const controller = formFieldName && formContext 
    ? useController({ 
        name: formFieldName,
        control: formContext.control,
        defaultValue: config.initialValue || (config.selectionMode === 'single' ? '' : []),
      })
    : null;

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [currentPath, setCurrentPath] = useState(config.initialPath || '');
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([
    { path: config.initialPath || '', timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewModeState] = useState<'grid' | 'list' | 'table'>('grid');
  const [searchTerm, setSearchTermState] = useState('');
  const [activeFilters, setActiveFilters] = useState<FileFilter[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, FileValidationError[]>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<UILoadingState>({
    loading: false,
    error: null,
    progress: 0,
    message: '',
  });

  // Refs for stable callbacks
  const eventHandlersRef = useRef(config.eventHandlers || {});
  const uploadOptionsRef = useRef(config.uploadOptions || DEFAULT_UPLOAD_CONFIG);
  const validationConfigRef = useRef(config.validation || DEFAULT_VALIDATION_CONFIG);
  const navigationConfigRef = useRef(config.navigation || DEFAULT_NAVIGATION_CONFIG);

  // Update refs when config changes
  useEffect(() => {
    eventHandlersRef.current = config.eventHandlers || {};
    uploadOptionsRef.current = config.uploadOptions || DEFAULT_UPLOAD_CONFIG;
    validationConfigRef.current = config.validation || DEFAULT_VALIDATION_CONFIG;
    navigationConfigRef.current = config.navigation || DEFAULT_NAVIGATION_CONFIG;
  }, [config]);

  // =========================================================================
  // FILE LISTING INTEGRATION
  // =========================================================================
  
  const fileListQuery = useFileList(config.apiInfo.serviceName, currentPath);
  
  const files = useMemo(() => {
    return fileListQuery.data?.resource || [];
  }, [fileListQuery.data]);

  const isLoadingFiles = fileListQuery.isLoading;
  const filesError = fileListQuery.error;

  // =========================================================================
  // COMPUTED STATE
  // =========================================================================
  
  const canGoBack = useMemo(() => historyIndex > 0, [historyIndex]);
  const canGoForward = useMemo(() => historyIndex < navigationHistory.length - 1, [historyIndex, navigationHistory]);
  
  const hasValidationErrors = useMemo(() => {
    return Object.values(validationErrors).some(errors => errors.length > 0);
  }, [validationErrors]);

  const activeUploads = useMemo(() => {
    return selectedFiles
      .filter(file => file.uploadState === 'uploading' || file.uploadState === 'pending')
      .map(file => file.path);
  }, [selectedFiles]);

  // =========================================================================
  // VALIDATION FUNCTIONS
  // =========================================================================
  
  const validateFile = useCallback((file: File): FileValidationResult => {
    const errors: FileValidationError[] = [];
    const warnings: FileValidationError[] = [];
    const config = validationConfigRef.current;

    // File size validation
    if (file.size > config.maxFileSize) {
      errors.push(createValidationError(
        'FILE_TOO_LARGE',
        `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(config.maxFileSize)}`,
        { fileSize: file.size, maxFileSize: config.maxFileSize },
        `Please select a file smaller than ${formatFileSize(config.maxFileSize)}`
      ));
    }

    // Extension validation
    if (!isExtensionAllowed(file.name, config.allowedExtensions)) {
      errors.push(createValidationError(
        'INVALID_EXTENSION',
        `File extension "${getFileExtension(file.name)}" is not allowed`,
        { fileName: file.name, allowedExtensions: config.allowedExtensions },
        config.allowedExtensions.length > 0 
          ? `Allowed extensions: ${config.allowedExtensions.join(', ')}`
          : 'Please check the allowed file types'
      ));
    }

    // MIME type validation
    if (!isMimeTypeAllowed(file.type, config.allowedMimeTypes)) {
      errors.push(createValidationError(
        'INVALID_MIME_TYPE',
        `File type "${file.type}" is not allowed`,
        { mimeType: file.type, allowedMimeTypes: config.allowedMimeTypes },
        config.allowedMimeTypes.length > 0
          ? `Allowed types: ${config.allowedMimeTypes.join(', ')}`
          : 'Please check the allowed file types'
      ));
    }

    // Duplicate file validation
    const isDuplicate = selectedFiles.some(selected => 
      selected.name === file.name && selected.size === file.size
    );
    if (isDuplicate) {
      errors.push(createValidationError(
        'DUPLICATE_FILE',
        `File "${file.name}" is already selected`,
        { fileName: file.name },
        'Please select a different file or remove the existing one'
      ));
    }

    // File count validation
    const currentCount = selectedFiles.length;
    const maxFiles = validatedConfig.maxFiles || config.maxFileSize;
    if (validatedConfig.selectionMode !== 'single' && currentCount >= maxFiles) {
      errors.push(createValidationError(
        'QUOTA_EXCEEDED',
        `Cannot select more than ${maxFiles} files`,
        { currentCount, maxFiles },
        `Please remove some files before adding new ones`
      ));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
      appliedRules: ['size', 'extension', 'mime-type', 'duplicate', 'count'],
    };
  }, [selectedFiles, validatedConfig]);

  const validateSelection = useCallback((): boolean => {
    const errors: Record<string, FileValidationError[]> = {};
    
    selectedFiles.forEach(file => {
      if (file.file) {
        const validation = validateFile(file.file);
        if (!validation.isValid) {
          errors[file.path] = validation.errors;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedFiles, validateFile]);

  // =========================================================================
  // NAVIGATION FUNCTIONS
  // =========================================================================
  
  const addToHistory = useCallback((path: string, files?: FileMetadata[]) => {
    const config = navigationConfigRef.current;
    const entry: NavigationHistoryEntry = {
      path,
      timestamp: Date.now(),
      files,
      selectedFiles: selectedFiles.map(f => f.path),
    };

    setNavigationHistory(prev => {
      // Remove any forward history when navigating to a new path
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(entry);
      
      // Limit history size
      if (newHistory.length > config.maxHistorySize) {
        return newHistory.slice(-config.maxHistorySize);
      }
      
      return newHistory;
    });

    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, selectedFiles]);

  const navigateTo = useCallback((path: string) => {
    if (path === currentPath) return;
    
    setCurrentPath(path);
    addToHistory(path);
    
    // Clear search when navigating
    setSearchTermState('');
    
    // Trigger navigation event
    eventHandlersRef.current.onNavigate?.(path);
  }, [currentPath, addToHistory]);

  const navigateBack = useCallback(() => {
    if (!canGoBack) return;
    
    const newIndex = historyIndex - 1;
    const entry = navigationHistory[newIndex];
    
    setHistoryIndex(newIndex);
    setCurrentPath(entry.path);
    
    // Restore previous selection if available
    if (entry.selectedFiles) {
      const restored = selectedFiles.filter(file => 
        entry.selectedFiles!.includes(file.path)
      );
      setSelectedFiles(restored);
    }
  }, [canGoBack, historyIndex, navigationHistory, selectedFiles]);

  const navigateForward = useCallback(() => {
    if (!canGoForward) return;
    
    const newIndex = historyIndex + 1;
    const entry = navigationHistory[newIndex];
    
    setHistoryIndex(newIndex);
    setCurrentPath(entry.path);
    
    // Restore selection if available
    if (entry.selectedFiles) {
      const restored = selectedFiles.filter(file => 
        entry.selectedFiles!.includes(file.path)
      );
      setSelectedFiles(restored);
    }
  }, [canGoForward, historyIndex, navigationHistory, selectedFiles]);

  const refreshCurrentPath = useCallback(() => {
    invalidateFileList(config.apiInfo.serviceName, currentPath);
  }, [config.apiInfo.serviceName, currentPath, invalidateFileList]);

  // =========================================================================
  // FILE SELECTION FUNCTIONS
  // =========================================================================
  
  const selectFile = useCallback((file: FileMetadata | File) => {
    const isFileObject = file instanceof File;
    let selectedFile: SelectedFile;

    if (isFileObject) {
      // Validate file before selection
      if (validationConfigRef.current.validateOnSelection) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          setValidationErrors(prev => ({
            ...prev,
            [file.name]: validation.errors,
          }));
          eventHandlersRef.current.onValidationError?.(file, new Error(validation.errors[0]?.message));
          return;
        }
      }

      selectedFile = fileToSelectedFile(
        file,
        config.apiInfo.serviceName,
        currentPath,
        uploadOptionsRef.current
      );
    } else {
      // Convert FileMetadata to SelectedFile
      selectedFile = {
        ...file,
        uploadState: 'pending',
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
          validatedAt: new Date().toISOString(),
          appliedRules: [],
        },
      };
    }

    setSelectedFiles(prev => {
      if (config.selectionMode === 'single') {
        return [selectedFile];
      } else {
        // Check for duplicates
        const exists = prev.some(f => f.path === selectedFile.path || f.name === selectedFile.name);
        if (exists) return prev;
        
        return [...prev, selectedFile];
      }
    });

    // Clear any validation errors for this file
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[selectedFile.path];
      delete updated[selectedFile.name];
      return updated;
    });

    // Trigger selection event
    eventHandlersRef.current.onFileSelect?.(isFileObject ? [file] : [file]);
    eventHandlersRef.current.onSelectionChange?.(selectedFiles);

    // Auto-upload if configured
    if (config.uploadMode === 'automatic' && isFileObject) {
      uploadFile({
        serviceName: config.apiInfo.serviceName,
        file,
        path: currentPath,
        onProgress: (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [selectedFile.path]: progress.progress,
          }));
        },
      });
    }
  }, [
    config.selectionMode,
    config.uploadMode,
    config.apiInfo.serviceName,
    currentPath,
    selectedFiles,
    validateFile,
    uploadFile,
  ]);

  const deselectFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(file => 
      file.path !== fileId && file.name !== fileId
    ));

    // Clear validation errors for this file
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });

    // Clear upload progress
    setUploadProgress(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });

    eventHandlersRef.current.onSelectionChange?.(selectedFiles);
  }, [selectedFiles]);

  const selectMultipleFiles = useCallback((files: (FileMetadata | File)[]) => {
    if (config.selectionMode === 'single') {
      if (files.length > 0) {
        selectFile(files[0]);
      }
      return;
    }

    files.forEach(file => selectFile(file));
  }, [config.selectionMode, selectFile]);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setValidationErrors({});
    setUploadProgress({});
    
    eventHandlersRef.current.onDeselectAll?.();
    eventHandlersRef.current.onSelectionChange?.([]);
  }, []);

  const selectAll = useCallback((files: FileMetadata[]) => {
    if (config.selectionMode === 'single') return;
    
    const newSelected = files.map(file => ({
      ...file,
      uploadState: 'pending' as const,
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
        validatedAt: new Date().toISOString(),
        appliedRules: [],
      },
    }));

    setSelectedFiles(newSelected);
    eventHandlersRef.current.onSelectAll?.();
    eventHandlersRef.current.onSelectionChange?.(newSelected);
  }, [config.selectionMode]);

  // =========================================================================
  // FILE OPERATION FUNCTIONS
  // =========================================================================
  
  const uploadSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setLoading({
      loading: true,
      error: null,
      progress: 0,
      message: 'Uploading files...',
    });

    try {
      const fileUploads = selectedFiles
        .filter(file => file.file && file.uploadState === 'pending')
        .map(async (selectedFile, index) => {
          const { file } = selectedFile;
          if (!file) return;

          try {
            await uploadFileAsync({
              serviceName: config.apiInfo.serviceName,
              file,
              path: currentPath,
              onProgress: (progress) => {
                setUploadProgress(prev => ({
                  ...prev,
                  [selectedFile.path]: progress.progress,
                }));
              },
            });

            // Update file state to completed
            setSelectedFiles(prev => prev.map(f => 
              f.path === selectedFile.path 
                ? { ...f, uploadState: 'completed' as const }
                : f
            ));

            eventHandlersRef.current.onUploadComplete?.(selectedFile);
          } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error);
            
            // Update file state to failed
            setSelectedFiles(prev => prev.map(f => 
              f.path === selectedFile.path 
                ? { 
                    ...f, 
                    uploadState: 'failed' as const,
                    error: {
                      code: 'UPLOAD_FAILED',
                      message: error instanceof Error ? error.message : 'Upload failed',
                      retryable: true,
                    },
                  }
                : f
            ));

            eventHandlersRef.current.onUploadError?.(selectedFile, {
              code: 'UPLOAD_FAILED',
              message: error instanceof Error ? error.message : 'Upload failed',
              retryable: true,
            });
          }
        });

      await Promise.allSettled(fileUploads);
      
      // Refresh file list after uploads
      refreshCurrentPath();
      
    } catch (error) {
      console.error('Batch upload failed:', error);
      setLoading({
        loading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        progress: 0,
        message: '',
      });
    } finally {
      setLoading({
        loading: false,
        error: null,
        progress: 100,
        message: '',
      });
    }
  }, [selectedFiles, config.apiInfo.serviceName, currentPath, uploadFileAsync, refreshCurrentPath]);

  const removeFile = useCallback((fileId: string) => {
    deselectFile(fileId);
    eventHandlersRef.current.onFileRemove?.(
      selectedFiles.find(f => f.path === fileId || f.name === fileId)!
    );
  }, [deselectFile, selectedFiles]);

  const createFolder = useCallback(async (name: string) => {
    if (!name.trim()) return;

    setLoading({
      loading: true,
      error: null,
      progress: 0,
      message: 'Creating folder...',
    });

    try {
      await createDirectoryAsync({
        serviceName: config.apiInfo.serviceName,
        path: currentPath,
        name: name.trim(),
      });

      refreshCurrentPath();
      
      setLoading({
        loading: false,
        error: null,
        progress: 100,
        message: 'Folder created successfully',
      });
    } catch (error) {
      console.error('Folder creation failed:', error);
      setLoading({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create folder',
        progress: 0,
        message: '',
      });
    }
  }, [config.apiInfo.serviceName, currentPath, createDirectoryAsync, refreshCurrentPath]);

  const deleteFile = useCallback(async (path: string) => {
    setLoading({
      loading: true,
      error: null,
      progress: 0,
      message: 'Deleting file...',
    });

    try {
      await deleteFileAsync({
        serviceName: config.apiInfo.serviceName,
        path,
      });

      // Remove from selection if selected
      deselectFile(path);
      refreshCurrentPath();
      
      setLoading({
        loading: false,
        error: null,
        progress: 100,
        message: 'File deleted successfully',
      });
    } catch (error) {
      console.error('File deletion failed:', error);
      setLoading({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
        progress: 0,
        message: '',
      });
    }
  }, [config.apiInfo.serviceName, deleteFileAsync, deselectFile, refreshCurrentPath]);

  // =========================================================================
  // UI OPERATION FUNCTIONS
  // =========================================================================
  
  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const setViewMode = useCallback((mode: 'grid' | 'list' | 'table') => {
    setViewModeState(mode);
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const toggleFilter = useCallback((filter: FileFilter) => {
    setActiveFilters(prev => {
      const exists = prev.find(f => f.id === filter.id);
      if (exists) {
        return prev.filter(f => f.id !== filter.id);
      } else {
        return [...prev, filter];
      }
    });
  }, []);

  // =========================================================================
  // FORM INTEGRATION FUNCTIONS
  // =========================================================================
  
  const setValue = useCallback((value: string | string[] | SelectedFile | SelectedFile[]) => {
    if (typeof value === 'string') {
      if (config.selectionMode === 'single') {
        // Find file by path and select it
        const file = files.find(f => f.path === value);
        if (file) {
          selectFile(file);
        }
      } else {
        // Parse multiple paths
        const paths = value.split(',').map(p => p.trim());
        const matchingFiles = files.filter(f => paths.includes(f.path));
        selectMultipleFiles(matchingFiles);
      }
    } else if (Array.isArray(value)) {
      if (typeof value[0] === 'string') {
        const matchingFiles = files.filter(f => (value as string[]).includes(f.path));
        selectMultipleFiles(matchingFiles);
      } else {
        setSelectedFiles(value as SelectedFile[]);
      }
    } else if (isSelectedFile(value)) {
      setSelectedFiles([value]);
    } else if (isFileMetadata(value)) {
      selectFile(value);
    }

    // Update form value if integrated
    if (controller) {
      controller.field.onChange(value);
    }
  }, [config.selectionMode, files, selectFile, selectMultipleFiles, controller]);

  const getValue = useCallback((): string | string[] | SelectedFile | SelectedFile[] => {
    if (config.selectionMode === 'single') {
      return selectedFiles.length > 0 ? selectedFiles[0] : '';
    } else {
      return selectedFiles;
    }
  }, [config.selectionMode, selectedFiles]);

  const setInitialValue = useCallback((value: string | string[] | SelectedFile | SelectedFile[]) => {
    setValue(value);
  }, [setValue]);

  const resetToInitial = useCallback(() => {
    if (config.initialValue) {
      setValue(config.initialValue);
    } else {
      clearSelection();
    }
  }, [config.initialValue, setValue, clearSelection]);

  // =========================================================================
  // EFFECTS
  // =========================================================================
  
  // Initialize with initial value
  useEffect(() => {
    if (config.initialValue && selectedFiles.length === 0) {
      setInitialValue(config.initialValue);
    }
  }, [config.initialValue, selectedFiles.length, setInitialValue]);

  // Update form value when selection changes
  useEffect(() => {
    if (controller) {
      const value = getValue();
      controller.field.onChange(value);
    }
  }, [selectedFiles, controller, getValue]);

  // Auto-validate selection when it changes
  useEffect(() => {
    if (validationConfigRef.current.validateOnSelection && selectedFiles.length > 0) {
      validateSelection();
    }
  }, [selectedFiles, validateSelection]);

  // Update loading state based on external operations
  useEffect(() => {
    const isLoading = isUploading || isCreatingDirectory || isDeletingFile || isLoadingFiles;
    
    setLoading(prev => ({
      ...prev,
      loading: isLoading,
      message: isUploading 
        ? 'Uploading files...'
        : isCreatingDirectory 
        ? 'Creating folder...'
        : isDeletingFile
        ? 'Deleting file...'
        : isLoadingFiles
        ? 'Loading files...'
        : '',
    }));
  }, [isUploading, isCreatingDirectory, isDeletingFile, isLoadingFiles]);

  // =========================================================================
  // RETURN HOOK API
  // =========================================================================
  
  return useMemo(() => ({
    // State
    selectedFiles,
    currentPath,
    navigationHistory,
    historyIndex,
    canGoBack,
    canGoForward,
    loading,
    isDialogOpen,
    viewMode,
    searchTerm,
    activeFilters,
    validationErrors,
    hasValidationErrors,
    uploadProgress,
    activeUploads,

    // External data
    files,
    isLoadingFiles,
    filesError,
    fileServices,
    isLoadingServices,

    // Configuration
    config: validatedConfig,

    // Actions
    selectFile,
    deselectFile,
    selectMultipleFiles,
    clearSelection,
    selectAll,
    navigateTo,
    navigateBack,
    navigateForward,
    refreshCurrentPath,
    uploadSelectedFiles,
    removeFile,
    createFolder,
    deleteFile,
    openDialog,
    closeDialog,
    setViewMode,
    setSearchTerm,
    toggleFilter,
    validateFile,
    validateSelection,
    setValue,
    getValue,
    setInitialValue,
    resetToInitial,
  }), [
    // State dependencies
    selectedFiles,
    currentPath,
    navigationHistory,
    historyIndex,
    canGoBack,
    canGoForward,
    loading,
    isDialogOpen,
    viewMode,
    searchTerm,
    activeFilters,
    validationErrors,
    hasValidationErrors,
    uploadProgress,
    activeUploads,
    files,
    isLoadingFiles,
    filesError,
    fileServices,
    isLoadingServices,
    validatedConfig,
    
    // Action dependencies
    selectFile,
    deselectFile,
    selectMultipleFiles,
    clearSelection,
    selectAll,
    navigateTo,
    navigateBack,
    navigateForward,
    refreshCurrentPath,
    uploadSelectedFiles,
    removeFile,
    createFolder,
    deleteFile,
    openDialog,
    closeDialog,
    setViewMode,
    setSearchTerm,
    toggleFilter,
    validateFile,
    validateSelection,
    setValue,
    getValue,
    setInitialValue,
    resetToInitial,
  ]);
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * useFileSelectorForm Hook
 * 
 * Specialized hook for React Hook Form integration with automatic registration
 */
export function useFileSelectorForm(
  name: string,
  config: FileSelectorConfig,
  options?: {
    rules?: any;
    defaultValue?: any;
  }
) {
  const formContext = useFormContext();
  
  if (!formContext) {
    throw new Error('useFileSelectorForm must be used within a FormProvider');
  }

  const fileSelector = useFileSelector(
    {
      ...config,
      initialValue: options?.defaultValue || config.initialValue,
    },
    name
  );

  // Register field with form
  const { field, fieldState } = useController({
    name,
    control: formContext.control,
    rules: options?.rules,
    defaultValue: options?.defaultValue || config.initialValue,
  });

  return {
    ...fileSelector,
    field,
    fieldState,
    formError: fieldState.error?.message,
  };
}

/**
 * useFileSelectorValidation Hook
 * 
 * Specialized hook for file validation with custom rules
 */
export function useFileSelectorValidation(
  customRules?: Array<(file: File) => FileValidationResult>
) {
  const validateFileWithCustomRules = useCallback((file: File): FileValidationResult => {
    if (!customRules || customRules.length === 0) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        validatedAt: new Date().toISOString(),
        appliedRules: [],
      };
    }

    const allErrors: FileValidationError[] = [];
    const allWarnings: FileValidationError[] = [];
    const appliedRules: string[] = [];

    customRules.forEach((rule, index) => {
      try {
        const result = rule(file);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
        appliedRules.push(...result.appliedRules);
      } catch (error) {
        console.error(`Custom validation rule ${index} failed:`, error);
        allErrors.push(createValidationError(
          'UNKNOWN_ERROR',
          `Custom validation rule failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { ruleIndex: index, error }
        ));
      }
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      validatedAt: new Date().toISOString(),
      appliedRules: Array.from(new Set(appliedRules)),
    };
  }, [customRules]);

  return {
    validateFileWithCustomRules,
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  FileSelectorConfig,
  NavigationHistoryEntry,
  FileSelectorState,
  FileSelectorActions,
  UseFileSelectorReturn,
};