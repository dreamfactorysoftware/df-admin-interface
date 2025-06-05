/**
 * File Selector State Management Hook
 * 
 * React hook that manages comprehensive file selector component state including 
 * selected files, navigation history, loading states, and user interactions.
 * 
 * Provides stateful file selection logic with folder navigation, file filtering,
 * selection validation, and seamless integration with React Hook Form patterns.
 * Coordinates with useFileApi hook for server operations while maintaining
 * optimized local UI state management.
 * 
 * @fileoverview File selector state management hook with React 19 patterns
 * @version 1.0.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import type {
  FileApiInfo,
  SelectedFile,
  FileItem,
  FileValidationOptions,
  FileSelectorProps,
  UseFileSelectorReturn,
  FileError,
  FileErrorType,
  FileUploadProgress,
} from '../types';
import type { ValidationState, LoadingState } from '@/types/ui';

// =============================================================================
// HOOK STATE INTERFACES
// =============================================================================

/**
 * Navigation history entry for folder browsing
 */
interface NavigationHistoryEntry {
  /** Directory path */
  path: string;
  /** Service name */
  serviceName: string;
  /** Display label for breadcrumb */
  label: string;
  /** Timestamp of navigation */
  timestamp: Date;
  /** Whether this is the root directory */
  isRoot?: boolean;
}

/**
 * Internal hook state interface
 */
interface FileSelectorState {
  /** Currently selected file */
  selectedFile: SelectedFile | undefined;
  /** Current directory path */
  currentPath: string;
  /** Current service name */
  currentServiceName: string;
  /** Available file services */
  fileServices: FileApiInfo[];
  /** Current files in directory */
  currentFiles: FileItem[];
  /** Navigation history stack */
  navigationHistory: NavigationHistoryEntry[];
  /** Current history index */
  historyIndex: number;
  /** Upload progress tracking */
  uploadProgress: FileUploadProgress[];
  /** Loading states for different operations */
  loadingStates: Record<string, boolean>;
  /** Error state */
  error: FileError | null;
  /** Validation state */
  validationState: ValidationState;
  /** Filter text for file search */
  filterText: string;
  /** File type filter */
  fileTypeFilter: string[];
  /** Whether drag and drop is active */
  isDragActive: boolean;
  /** Whether the selector is in upload mode */
  isUploadMode: boolean;
}

/**
 * Hook configuration options
 */
interface UseFileSelectorOptions {
  /** Initial selected file path */
  initialValue?: string;
  /** Validation options */
  validation?: FileValidationOptions;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Whether to allow multiple file selection */
  multiple?: boolean;
  /** Whether to enable drag and drop */
  dragAndDrop?: boolean;
  /** Initial directory path */
  initialPath?: string;
  /** Initial service name */
  initialServiceName?: string;
  /** File selection callback */
  onFileSelected?: (file: SelectedFile | undefined) => void;
  /** Navigation callback */
  onNavigate?: (path: string, serviceName: string) => void;
  /** Error callback */
  onError?: (error: FileError) => void;
}

/**
 * Form schema for file selection validation
 */
const fileSelectionSchema = z.object({
  selectedFile: z.object({
    path: z.string().min(1, 'File path is required'),
    fileName: z.string().min(1, 'File name is required'),
    serviceName: z.string().min(1, 'Service name is required'),
    serviceId: z.number().int().positive(),
  }).optional(),
  currentPath: z.string().default(''),
  currentServiceName: z.string().min(1, 'Service must be selected'),
});

type FileSelectionFormData = z.infer<typeof fileSelectionSchema>;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates error object with consistent structure
 */
function createFileError(
  type: FileErrorType,
  message: string,
  details?: Record<string, any>
): FileError {
  return {
    type,
    message,
    details,
    timestamp: new Date(),
    retryable: type === 'NETWORK_ERROR' || type === 'SERVER_ERROR',
  };
}

/**
 * Validates file against configured restrictions
 */
function validateFile(
  file: File | SelectedFile,
  options: FileValidationOptions = {}
): string | undefined {
  const {
    maxSize,
    minSize,
    allowedExtensions,
    allowedMimeTypes,
    customValidator,
  } = options;

  // File size validation
  if (file instanceof File) {
    if (maxSize && file.size > maxSize) {
      return `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(maxSize)}`;
    }
    if (minSize && file.size < minSize) {
      return `File size ${formatFileSize(file.size)} is below minimum required size ${formatFileSize(minSize)}`;
    }
  } else if ('size' in file && file.size) {
    if (maxSize && file.size > maxSize) {
      return `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(maxSize)}`;
    }
    if (minSize && file.size < minSize) {
      return `File size ${formatFileSize(file.size)} is below minimum required size ${formatFileSize(minSize)}`;
    }
  }

  // Extension validation
  if (allowedExtensions && allowedExtensions.length > 0) {
    const fileName = file instanceof File ? file.name : file.fileName;
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.some(ext => 
      ext.toLowerCase() === extension || ext.toLowerCase() === `.${extension}`
    )) {
      return `File type .${extension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`;
    }
  }

  // MIME type validation
  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    const mimeType = file instanceof File ? file.type : (file.contentType || '');
    
    if (!allowedMimeTypes.includes(mimeType)) {
      return `File type ${mimeType} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`;
    }
  }

  // Custom validation
  if (customValidator) {
    const customError = customValidator(file instanceof File ? file : file as any);
    if (customError) {
      return customError;
    }
  }

  return undefined;
}

/**
 * Formats file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parses initial file path to extract service and path components
 */
function parseInitialValue(initialValue: string): {
  serviceName: string;
  path: string;
} | null {
  if (!initialValue) return null;

  // Handle different path formats:
  // - service_name:path/to/file.txt
  // - /service_name/path/to/file.txt
  // - path/to/file.txt (default service)
  
  if (initialValue.includes(':')) {
    const [serviceName, ...pathParts] = initialValue.split(':');
    return {
      serviceName: serviceName.trim(),
      path: pathParts.join(':').trim(),
    };
  }

  if (initialValue.startsWith('/')) {
    const parts = initialValue.substring(1).split('/');
    if (parts.length > 1) {
      return {
        serviceName: parts[0],
        path: parts.slice(1).join('/'),
      };
    }
  }

  return {
    serviceName: '',
    path: initialValue,
  };
}

/**
 * Creates navigation history entry
 */
function createNavigationEntry(
  path: string,
  serviceName: string,
  label?: string,
  isRoot = false
): NavigationHistoryEntry {
  return {
    path,
    serviceName,
    label: label || (isRoot ? 'Root' : path.split('/').pop() || path),
    timestamp: new Date(),
    isRoot,
  };
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * File selector state management hook
 * 
 * Provides comprehensive file selection state management including navigation
 * history, file validation, loading states, and React Hook Form integration.
 * 
 * @param options Configuration options for the file selector
 * @returns File selector state and control functions
 */
export function useFileSelector(
  options: UseFileSelectorOptions = {}
): UseFileSelectorReturn & {
  // Extended return interface with additional state management
  form: UseFormReturn<FileSelectionFormData>;
  state: FileSelectorState;
  actions: {
    navigateToPath: (path: string, serviceName?: string) => void;
    navigateUp: () => void;
    navigateBack: () => void;
    navigateForward: () => void;
    setCurrentService: (serviceName: string) => void;
    setFilter: (filter: string) => void;
    setFileTypeFilter: (types: string[]) => void;
    addToUploadProgress: (progress: FileUploadProgress) => void;
    updateUploadProgress: (fileId: string, updates: Partial<FileUploadProgress>) => void;
    removeFromUploadProgress: (fileId: string) => void;
    setDragActive: (active: boolean) => void;
    setUploadMode: (mode: boolean) => void;
    setError: (error: FileError | null) => void;
    setLoading: (operation: string, loading: boolean) => void;
    refreshCurrentDirectory: () => void;
  };
} {
  const {
    initialValue,
    validation = {},
    allowedExtensions = [],
    maxFileSize,
    multiple = false,
    dragAndDrop = true,
    initialPath = '',
    initialServiceName = '',
    onFileSelected,
    onNavigate,
    onError,
  } = options;

  // Parse initial value
  const initialParsed = useMemo(() => {
    if (initialValue) {
      return parseInitialValue(initialValue);
    }
    return null;
  }, [initialValue]);

  // Initialize state
  const [state, setState] = useState<FileSelectorState>(() => ({
    selectedFile: undefined,
    currentPath: initialParsed?.path || initialPath || '',
    currentServiceName: initialParsed?.serviceName || initialServiceName || '',
    fileServices: [],
    currentFiles: [],
    navigationHistory: [],
    historyIndex: -1,
    uploadProgress: [],
    loadingStates: {},
    error: null,
    validationState: {
      isValid: true,
      isDirty: false,
      isTouched: false,
    },
    filterText: '',
    fileTypeFilter: [],
    isDragActive: false,
    isUploadMode: false,
  }));

  // React Hook Form integration
  const form = useForm<FileSelectionFormData>({
    resolver: zodResolver(fileSelectionSchema),
    defaultValues: {
      selectedFile: undefined,
      currentPath: state.currentPath,
      currentServiceName: state.currentServiceName,
    },
    mode: 'onChange',
  });

  // Refs for stable callbacks
  const onFileSelectedRef = useRef(onFileSelected);
  const onNavigateRef = useRef(onNavigate);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onFileSelectedRef.current = onFileSelected;
    onNavigateRef.current = onNavigate;
    onErrorRef.current = onError;
  }, [onFileSelected, onNavigate, onError]);

  // =============================================================================
  // STATE MANAGEMENT ACTIONS
  // =============================================================================

  const setSelectedFile = useCallback((file: SelectedFile | undefined) => {
    setState(prev => ({ ...prev, selectedFile: file }));
    
    // Update form state
    form.setValue('selectedFile', file ? {
      path: file.path,
      fileName: file.fileName,
      serviceName: file.serviceName,
      serviceId: file.serviceId,
    } : undefined);

    // Validate file if provided
    if (file) {
      const validationError = validateFile(file, {
        ...validation,
        allowedExtensions,
        maxSize: maxFileSize,
      });

      setState(prev => ({
        ...prev,
        validationState: {
          isValid: !validationError,
          isDirty: true,
          isTouched: true,
          error: validationError,
        },
      }));
    }

    // Notify parent component
    if (onFileSelectedRef.current) {
      onFileSelectedRef.current(file);
    }
  }, [form, validation, allowedExtensions, maxFileSize]);

  const navigateToPath = useCallback((path: string, serviceName?: string) => {
    const targetService = serviceName || state.currentServiceName;
    
    if (!targetService) {
      const error = createFileError(
        'VALIDATION_ERROR',
        'Service must be selected before navigation'
      );
      setState(prev => ({ ...prev, error }));
      if (onErrorRef.current) {
        onErrorRef.current(error);
      }
      return;
    }

    // Create navigation entry
    const navEntry = createNavigationEntry(path, targetService, undefined, path === '');

    setState(prev => {
      // If we're at the end of history, add new entry
      if (prev.historyIndex === prev.navigationHistory.length - 1) {
        return {
          ...prev,
          currentPath: path,
          currentServiceName: targetService,
          navigationHistory: [...prev.navigationHistory, navEntry],
          historyIndex: prev.navigationHistory.length,
          error: null,
        };
      } else {
        // If we're in the middle of history, truncate and add new entry
        const newHistory = prev.navigationHistory.slice(0, prev.historyIndex + 1);
        return {
          ...prev,
          currentPath: path,
          currentServiceName: targetService,
          navigationHistory: [...newHistory, navEntry],
          historyIndex: newHistory.length,
          error: null,
        };
      }
    });

    // Update form
    form.setValue('currentPath', path);
    form.setValue('currentServiceName', targetService);

    // Notify parent
    if (onNavigateRef.current) {
      onNavigateRef.current(path, targetService);
    }
  }, [state.currentServiceName, form]);

  const navigateUp = useCallback(() => {
    const parentPath = state.currentPath.split('/').slice(0, -1).join('/');
    navigateToPath(parentPath);
  }, [state.currentPath, navigateToPath]);

  const navigateBack = useCallback(() => {
    if (state.historyIndex > 0) {
      const prevEntry = state.navigationHistory[state.historyIndex - 1];
      setState(prev => ({
        ...prev,
        currentPath: prevEntry.path,
        currentServiceName: prevEntry.serviceName,
        historyIndex: prev.historyIndex - 1,
        error: null,
      }));

      form.setValue('currentPath', prevEntry.path);
      form.setValue('currentServiceName', prevEntry.serviceName);

      if (onNavigateRef.current) {
        onNavigateRef.current(prevEntry.path, prevEntry.serviceName);
      }
    }
  }, [state.historyIndex, state.navigationHistory, form]);

  const navigateForward = useCallback(() => {
    if (state.historyIndex < state.navigationHistory.length - 1) {
      const nextEntry = state.navigationHistory[state.historyIndex + 1];
      setState(prev => ({
        ...prev,
        currentPath: nextEntry.path,
        currentServiceName: nextEntry.serviceName,
        historyIndex: prev.historyIndex + 1,
        error: null,
      }));

      form.setValue('currentPath', nextEntry.path);
      form.setValue('currentServiceName', nextEntry.serviceName);

      if (onNavigateRef.current) {
        onNavigateRef.current(nextEntry.path, nextEntry.serviceName);
      }
    }
  }, [state.historyIndex, state.navigationHistory, form]);

  const setCurrentService = useCallback((serviceName: string) => {
    setState(prev => ({
      ...prev,
      currentServiceName: serviceName,
      currentPath: '', // Reset to root when changing service
      error: null,
    }));

    form.setValue('currentServiceName', serviceName);
    form.setValue('currentPath', '');

    // Navigate to root of new service
    navigateToPath('', serviceName);
  }, [form, navigateToPath]);

  const setFilter = useCallback((filter: string) => {
    setState(prev => ({ ...prev, filterText: filter }));
  }, []);

  const setFileTypeFilter = useCallback((types: string[]) => {
    setState(prev => ({ ...prev, fileTypeFilter: types }));
  }, []);

  const addToUploadProgress = useCallback((progress: FileUploadProgress) => {
    setState(prev => ({
      ...prev,
      uploadProgress: [...prev.uploadProgress, progress],
    }));
  }, []);

  const updateUploadProgress = useCallback((
    fileId: string,
    updates: Partial<FileUploadProgress>
  ) => {
    setState(prev => ({
      ...prev,
      uploadProgress: prev.uploadProgress.map(item =>
        item.file.name === fileId ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  const removeFromUploadProgress = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      uploadProgress: prev.uploadProgress.filter(item => item.file.name !== fileId),
    }));
  }, []);

  const setDragActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, isDragActive: active }));
  }, []);

  const setUploadMode = useCallback((mode: boolean) => {
    setState(prev => ({ ...prev, isUploadMode: mode }));
  }, []);

  const setError = useCallback((error: FileError | null) => {
    setState(prev => ({ ...prev, error }));
    
    if (error && onErrorRef.current) {
      onErrorRef.current(error);
    }
  }, []);

  const setLoading = useCallback((operation: string, loading: boolean) => {
    setState(prev => ({
      ...prev,
      loadingStates: {
        ...prev.loadingStates,
        [operation]: loading,
      },
    }));
  }, []);

  const refreshCurrentDirectory = useCallback(() => {
    // This would typically trigger a refetch of the current directory
    // Implementation depends on the useFileApi hook integration
    setLoading('refresh', true);
    
    // Simulate async operation
    setTimeout(() => {
      setLoading('refresh', false);
    }, 1000);
  }, [setLoading]);

  const clearSelection = useCallback(() => {
    setSelectedFile(undefined);
  }, [setSelectedFile]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isLoading = useMemo(() => {
    return Object.values(state.loadingStates).some(loading => loading);
  }, [state.loadingStates]);

  const canNavigateBack = useMemo(() => {
    return state.historyIndex > 0;
  }, [state.historyIndex]);

  const canNavigateForward = useMemo(() => {
    return state.historyIndex < state.navigationHistory.length - 1;
  }, [state.historyIndex, state.navigationHistory.length]);

  const canNavigateUp = useMemo(() => {
    return state.currentPath !== '';
  }, [state.currentPath]);

  const filteredFiles = useMemo(() => {
    let files = state.currentFiles;

    // Apply text filter
    if (state.filterText) {
      const filter = state.filterText.toLowerCase();
      files = files.filter(file =>
        file.name.toLowerCase().includes(filter)
      );
    }

    // Apply file type filter
    if (state.fileTypeFilter.length > 0) {
      files = files.filter(file => {
        if (file.type === 'folder') return true;
        
        const extension = file.name.split('.').pop()?.toLowerCase();
        return extension && state.fileTypeFilter.some(type =>
          type.toLowerCase() === extension || type.toLowerCase() === `.${extension}`
        );
      });
    }

    return files;
  }, [state.currentFiles, state.filterText, state.fileTypeFilter]);

  // =============================================================================
  // INITIALIZATION EFFECTS
  // =============================================================================

  // Initialize navigation history
  useEffect(() => {
    if (state.navigationHistory.length === 0 && state.currentServiceName) {
      const rootEntry = createNavigationEntry('', state.currentServiceName, 'Root', true);
      setState(prev => ({
        ...prev,
        navigationHistory: [rootEntry],
        historyIndex: 0,
      }));
    }
  }, [state.currentServiceName, state.navigationHistory.length]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Core UseFileSelectorReturn interface
    selectedFile: state.selectedFile,
    setSelectedFile,
    uploadProgress: state.uploadProgress,
    isLoading,
    error: state.error?.message || null,
    clearSelection,
    validationState: state.validationState,

    // Extended interface
    form,
    state,
    actions: {
      navigateToPath,
      navigateUp,
      navigateBack,
      navigateForward,
      setCurrentService,
      setFilter,
      setFileTypeFilter,
      addToUploadProgress,
      updateUploadProgress,
      removeFromUploadProgress,
      setDragActive,
      setUploadMode,
      setError,
      setLoading,
      refreshCurrentDirectory,
    },
  };
}

// =============================================================================
// ADDITIONAL HOOK EXPORTS
// =============================================================================

/**
 * Hook for managing file selector navigation state only
 */
export function useFileSelectorNavigation(
  initialPath = '',
  initialServiceName = ''
) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [currentServiceName, setCurrentServiceName] = useState(initialServiceName);
  const [history, setHistory] = useState<NavigationHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const navigate = useCallback((path: string, serviceName?: string) => {
    const targetService = serviceName || currentServiceName;
    const entry = createNavigationEntry(path, targetService);
    
    setCurrentPath(path);
    setCurrentServiceName(targetService);
    
    setHistory(prev => {
      if (historyIndex === prev.length - 1) {
        return [...prev, entry];
      } else {
        return [...prev.slice(0, historyIndex + 1), entry];
      }
    });
    
    setHistoryIndex(prev => prev + 1);
  }, [currentServiceName, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1];
      setCurrentPath(prevEntry.path);
      setCurrentServiceName(prevEntry.serviceName);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      setCurrentPath(nextEntry.path);
      setCurrentServiceName(nextEntry.serviceName);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  return {
    currentPath,
    currentServiceName,
    history,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1,
    navigate,
    goBack,
    goForward,
  };
}

/**
 * Hook for managing file validation state
 */
export function useFileValidation(options: FileValidationOptions = {}) {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    isDirty: false,
    isTouched: false,
  });

  const validateFile = useCallback((file: File | SelectedFile) => {
    const error = validateFile(file, options);
    
    setValidationState({
      isValid: !error,
      isDirty: true,
      isTouched: true,
      error,
    });

    return error;
  }, [options]);

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      isDirty: false,
      isTouched: false,
    });
  }, []);

  return {
    validationState,
    validateFile,
    clearValidation,
  };
}

export default useFileSelector;