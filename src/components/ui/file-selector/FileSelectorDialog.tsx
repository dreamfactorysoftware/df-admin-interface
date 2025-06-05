/**
 * File Selector Dialog Component
 * 
 * A comprehensive modal dialog component for file browsing, folder navigation, and file uploads.
 * Migrated from Angular df-file-selector-dialog.component to React with enhanced functionality
 * including virtual scrolling, drag-and-drop upload, keyboard navigation, and accessibility features.
 * 
 * Key Features:
 * - Headless UI Dialog for accessibility compliance (WCAG 2.1 AA)
 * - React Query integration for intelligent file API caching
 * - Virtual scrolling for handling large directories (1000+ files)
 * - Drag-and-drop file upload with progress tracking and cancellation
 * - Comprehensive keyboard navigation support
 * - Responsive design optimized for mobile file selection
 * - Real-time file type validation and filtering
 * - Multi-service file API support
 * 
 * @fileoverview Modal dialog for comprehensive file management and selection
 * @version 1.0.0
 */

'use client';

import React, { 
  useCallback, 
  useEffect, 
  useRef, 
  useState, 
  useMemo,
  useId,
  forwardRef
} from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { 
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ChevronRightIcon,
  Bars3Icon,
  ListBulletIcon,
  PhotoIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  FolderIcon as FolderIconSolid
} from '@heroicons/react/24/solid';
import { 
  type FileApiInfo,
  type SelectedFile,
  type FileItem,
  type FileSelectorDialogProps,
  type FileSelectorDialogData,
  type FileUploadProgress,
  type FileOperationResult,
  FileErrorSchema,
  type FileError
} from './types';
import { CreateFolderDialog } from './CreateFolderDialog';

// =============================================================================
// VALIDATION SCHEMAS & TYPES
// =============================================================================

/**
 * File filter validation schema
 */
const fileFilterSchema = z.object({
  searchTerm: z.string().optional(),
  fileType: z.enum(['all', 'files', 'folders']).default('all'),
  sortBy: z.enum(['name', 'type', 'size', 'lastModified']).default('name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

type FileFilterData = z.infer<typeof fileFilterSchema>;

/**
 * Upload validation schema
 */
const uploadValidationSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, 'At least one file is required'),
  overwriteExisting: z.boolean().default(false),
});

type UploadValidationData = z.infer<typeof uploadValidationSchema>;

// =============================================================================
// CONSTANTS & CONFIGURATION
// =============================================================================

const VIRTUAL_ITEM_HEIGHT = 48; // Height of each file item in pixels
const VIRTUAL_OVERSCAN = 10; // Number of items to render outside visible area
const DRAG_DROP_ACCEPT_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  'text/*': ['.txt', '.json', '.xml', '.csv', '.log'],
  'application/*': ['.pdf', '.zip', '.tar', '.gz'],
  '.pem': ['.pem'],
  '.p8': ['.p8'],
  '.key': ['.key'],
} as const;

const FILE_SIZE_LIMITS = {
  default: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024,   // 10MB for images
  document: 25 * 1024 * 1024, // 25MB for documents
} as const;

const BREADCRUMB_MAX_ITEMS = 5; // Maximum breadcrumb items before truncation

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * File icon component with type-based rendering
 */
const FileIcon = React.memo(({ 
  file, 
  className = "h-5 w-5",
  selected = false 
}: { 
  file: FileItem; 
  className?: string;
  selected?: boolean;
}) => {
  const iconClass = `${className} ${
    file.type === 'folder' 
      ? (selected ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500 dark:text-blue-400')
      : (selected ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400')
  }`;

  if (file.type === 'folder') {
    return selected ? (
      <FolderOpenIcon className={iconClass} aria-hidden="true" />
    ) : (
      <FolderIcon className={iconClass} aria-hidden="true" />
    );
  }

  // Determine file type based on extension or content type
  const extension = file.name.toLowerCase().split('.').pop();
  const isImage = file.contentType?.startsWith('image/') || 
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '');

  if (isImage) {
    return <PhotoIcon className={iconClass} aria-hidden="true" />;
  }

  return <DocumentIcon className={iconClass} aria-hidden="true" />;
});

FileIcon.displayName = 'FileIcon';

/**
 * Breadcrumb navigation component
 */
const BreadcrumbNavigation = React.memo(({ 
  currentPath, 
  serviceName, 
  onNavigate,
  className = ""
}: {
  currentPath: string;
  serviceName: string;
  onNavigate: (path: string) => void;
  className?: string;
}) => {
  const pathSegments = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split('/').filter(Boolean);
  }, [currentPath]);

  const breadcrumbs = useMemo(() => {
    const items = [
      { name: serviceName, path: '', isRoot: true }
    ];

    let currentSegmentPath = '';
    for (const segment of pathSegments) {
      currentSegmentPath = currentSegmentPath ? `${currentSegmentPath}/${segment}` : segment;
      items.push({
        name: segment,
        path: currentSegmentPath,
        isRoot: false
      });
    }

    // Truncate if too many items
    if (items.length > BREADCRUMB_MAX_ITEMS) {
      return [
        items[0], // Always show root
        { name: '...', path: '', isEllipsis: true },
        ...items.slice(-(BREADCRUMB_MAX_ITEMS - 2))
      ];
    }

    return items;
  }, [serviceName, pathSegments]);

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={`${item.path}-${index}`} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon 
                className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-1" 
                aria-hidden="true" 
              />
            )}
            {item.isEllipsis ? (
              <span className="text-gray-500 dark:text-gray-400">...</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(item.path)}
                className={`font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm px-1 py-0.5 ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}
              >
                {item.name}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});

BreadcrumbNavigation.displayName = 'BreadcrumbNavigation';

/**
 * File upload progress component
 */
const UploadProgressIndicator = React.memo(({ 
  progress,
  onCancel 
}: {
  progress: FileUploadProgress;
  onCancel?: () => void;
}) => {
  const progressPercentage = Math.round(progress.progress);
  const speedMBps = progress.speed ? (progress.speed / 1024 / 1024).toFixed(1) : '0';
  const remainingTime = progress.timeRemaining 
    ? `${Math.ceil(progress.timeRemaining)}s remaining`
    : '';

  return (
    <div className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <CloudArrowUpIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Uploading {progress.file.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {speedMBps} MB/s • {remainingTime}
            </p>
          </div>
        </div>
        {onCancel && progress.status === 'uploading' && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
            aria-label="Cancel upload"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      
      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Upload progress: ${progressPercentage}%`}
        />
      </div>
      
      <div className="flex justify-between text-xs text-blue-600 dark:text-blue-300">
        <span>{progressPercentage}% complete</span>
        <span>
          {(progress.bytesUploaded / 1024 / 1024).toFixed(1)} MB / {(progress.totalBytes / 1024 / 1024).toFixed(1)} MB
        </span>
      </div>
    </div>
  );
});

UploadProgressIndicator.displayName = 'UploadProgressIndicator';

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

/**
 * Custom hook for file API operations with caching
 */
function useFileApi() {
  const queryClient = useQueryClient();

  // File listing query
  const createFileListingQuery = useCallback((serviceName: string, path: string) => ({
    queryKey: ['files', serviceName, path],
    queryFn: async (): Promise<FileItem[]> => {
      try {
        // This would be replaced with actual API call
        // For now, return mock data to demonstrate structure
        const mockFiles: FileItem[] = [
          {
            name: 'documents',
            path: path ? `${path}/documents` : 'documents',
            type: 'folder' as const,
            lastModified: new Date().toISOString(),
            selectable: true,
          },
          {
            name: 'config.json',
            path: path ? `${path}/config.json` : 'config.json',
            type: 'file' as const,
            contentType: 'application/json',
            size: 1024,
            lastModified: new Date().toISOString(),
            selectable: true,
          }
        ];
        
        return mockFiles;
      } catch (error) {
        console.error('Failed to fetch files:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.status === 404 || error?.status === 403) {
        return false; // Don't retry for these errors
      }
      return failureCount < 3;
    },
  }), []);

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ 
      serviceName, 
      file, 
      path,
      onProgress 
    }: {
      serviceName: string;
      file: File;
      path: string;
      onProgress?: (progress: number) => void;
    }): Promise<SelectedFile> => {
      // Mock upload implementation - replace with actual API call
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            onProgress?.(progress);
            
            // Return mock uploaded file result
            resolve({
              path: `/opt/dreamfactory/storage/app/${path ? `${path}/` : ''}${file.name}`,
              relativePath: path ? `${path}/${file.name}` : file.name,
              fileName: file.name,
              name: file.name,
              serviceId: 1, // Mock service ID
              serviceName: serviceName,
              size: file.size,
              contentType: file.type,
              lastModified: new Date().toISOString(),
            });
          } else {
            onProgress?.(progress);
          }
        }, 100);
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate file listings to refresh the view
      queryClient.invalidateQueries({
        queryKey: ['files', variables.serviceName, variables.path]
      });
    },
  });

  // Folder creation mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ 
      serviceName, 
      path, 
      folderName 
    }: {
      serviceName: string;
      path: string;
      folderName: string;
    }): Promise<void> => {
      // Mock folder creation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: (data, variables) => {
      // Invalidate file listings to refresh the view
      queryClient.invalidateQueries({
        queryKey: ['files', variables.serviceName, variables.path]
      });
    },
  });

  return {
    createFileListingQuery,
    uploadFile: uploadFileMutation.mutate,
    createFolder: createFolderMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    isCreatingFolder: createFolderMutation.isPending,
    uploadError: uploadFileMutation.error,
    createFolderError: createFolderMutation.error,
  };
}

/**
 * Custom hook for drag and drop functionality
 */
function useDragAndDrop({
  onFilesDropped,
  allowedExtensions,
  maxFileSize,
  multiple = false,
}: {
  onFilesDropped: (files: File[]) => void;
  allowedExtensions: string[];
  maxFileSize?: number;
  multiple?: boolean;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      // Check file extension
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        errors.push(`${file.name}: File type not allowed (${extension})`);
        continue;
      }

      // Check file size
      const limit = maxFileSize || FILE_SIZE_LIMITS.default;
      if (file.size > limit) {
        errors.push(`${file.name}: File too large (${(file.size / 1024 / 1024).toFixed(1)}MB > ${(limit / 1024 / 1024).toFixed(1)}MB)`);
        continue;
      }

      valid.push(file);
    }

    // Check multiple files restriction
    if (!multiple && valid.length > 1) {
      errors.push('Only one file can be uploaded at a time');
      return { valid: valid.slice(0, 1), errors };
    }

    return { valid, errors };
  }, [allowedExtensions, maxFileSize, multiple]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const { files } = e.dataTransfer;
    if (files.length > 0) {
      const fileArray = Array.from(files);
      const { valid, errors } = validateFiles(fileArray);
      
      if (errors.length > 0) {
        console.warn('File validation errors:', errors);
        // You might want to show these errors to the user
      }
      
      if (valid.length > 0) {
        onFilesDropped(valid);
      }
    }
  }, [onFilesDropped, validateFiles]);

  return {
    isDragOver,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    validateFiles,
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FileSelectorDialog({
  open,
  onClose,
  onFileSelected,
  data,
  title = 'Select File',
  size = 'lg',
  className = '',
  ...props
}: FileSelectorDialogProps) {
  // Refs for focus management and virtual scrolling
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [selectedFileApi, setSelectedFileApi] = useState<FileApiInfo | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Form management for filters and search
  const filterForm = useForm<FileFilterData>({
    resolver: zodResolver(fileFilterSchema),
    defaultValues: {
      searchTerm: '',
      fileType: 'all',
      sortBy: 'name',
      sortDirection: 'asc',
    },
  });

  // Custom hooks
  const fileApi = useFileApi();
  const dragAndDrop = useDragAndDrop({
    onFilesDropped: handleFilesDropped,
    allowedExtensions: data.allowedExtensions,
    maxFileSize: data.maxFileSize,
    multiple: data.multiple,
  });

  // File listing query
  const fileListingQuery = useQuery(
    selectedFileApi 
      ? fileApi.createFileListingQuery(selectedFileApi.name, currentPath)
      : { enabled: false }
  );

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const filteredAndSortedFiles = useMemo(() => {
    if (!fileListingQuery.data) return [];

    const { searchTerm, fileType, sortBy, sortDirection } = filterForm.watch();
    let filtered = [...fileListingQuery.data];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (fileType !== 'all') {
      filtered = filtered.filter(file => {
        if (fileType === 'files') return file.type === 'file';
        if (fileType === 'folders') return file.type === 'folder';
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      // Always sort folders first
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'type':
          comparison = (a.contentType || '').localeCompare(b.contentType || '');
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'lastModified':
          comparison = new Date(a.lastModified || 0).getTime() - new Date(b.lastModified || 0).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [fileListingQuery.data, filterForm.watch()]);

  // Virtual scrolling setup
  const virtualizer = useVirtualizer({
    count: filteredAndSortedFiles.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => VIRTUAL_ITEM_HEIGHT,
    overscan: VIRTUAL_OVERSCAN,
  });

  const isLoading = fileListingQuery.isLoading || fileApi.isUploading || fileApi.isCreatingFolder;
  const isSelectorOnly = data.selectorOnly || false;
  const hasUploadPermission = !isSelectorOnly;
  const canCreateFolders = hasUploadPermission;

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  function handleFilesDropped(files: File[]) {
    if (!hasUploadPermission || !selectedFileApi) return;
    
    files.forEach(file => {
      handleFileUpload(file);
    });
  }

  function handleFileUpload(file: File) {
    if (!selectedFileApi) return;

    const progressId = `${file.name}-${Date.now()}`;
    const initialProgress: FileUploadProgress = {
      file,
      progress: 0,
      bytesUploaded: 0,
      totalBytes: file.size,
      status: 'pending',
      startTime: new Date(),
    };

    setUploadProgress(prev => [...prev, initialProgress]);

    fileApi.uploadFile(
      {
        serviceName: selectedFileApi.name,
        file,
        path: currentPath,
        onProgress: (progress) => {
          setUploadProgress(prev => prev.map(p => 
            p.file.name === file.name 
              ? { 
                  ...p, 
                  progress, 
                  bytesUploaded: Math.round((progress / 100) * file.size),
                  status: progress === 100 ? 'completed' : 'uploading',
                  completionTime: progress === 100 ? new Date() : undefined,
                } 
              : p
          ));
        },
      },
      {
        onSuccess: (result) => {
          setUploadProgress(prev => prev.filter(p => p.file.name !== file.name));
          
          // Auto-select uploaded file if in selection mode
          if (!data.uploadMode) {
            const uploadedFileItem: FileItem = {
              name: result.fileName,
              path: result.relativePath || result.fileName,
              type: 'file',
              contentType: result.contentType,
              size: result.size,
              lastModified: result.lastModified,
              selectable: true,
            };
            setSelectedFile(uploadedFileItem);
          }
        },
        onError: (error) => {
          setUploadProgress(prev => prev.map(p => 
            p.file.name === file.name 
              ? { ...p, status: 'error', error: error.message } 
              : p
          ));
        },
      }
    );
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const { valid, errors } = dragAndDrop.validateFiles(fileArray);
      
      if (errors.length > 0) {
        console.warn('File validation errors:', errors);
        // Show validation errors to user
      }
      
      valid.forEach(file => handleFileUpload(file));
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleSelectFileApi(fileApi: FileApiInfo) {
    setSelectedFileApi(fileApi);
    setCurrentPath('');
    setNavigationStack([]);
    setSelectedFile(null);
  }

  function handleNavigateToPath(path: string) {
    if (path === currentPath) return;
    
    // Add current path to navigation stack if going deeper
    if (path.startsWith(currentPath) && path !== currentPath) {
      setNavigationStack(prev => [...prev, currentPath]);
    } else {
      // Going to a parent path or completely different path
      setNavigationStack([]);
    }
    
    setCurrentPath(path);
    setSelectedFile(null);
  }

  function handleNavigateBack() {
    if (navigationStack.length > 0) {
      const previousPath = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentPath(previousPath);
    } else if (selectedFileApi) {
      // Go back to service selection
      setSelectedFileApi(null);
      setCurrentPath('');
      setSelectedFile(null);
    }
  }

  function handleOpenFolder(folder: FileItem) {
    setNavigationStack(prev => [...prev, currentPath]);
    setCurrentPath(folder.path);
    setSelectedFile(null);
  }

  function handleSelectFile(file: FileItem) {
    // Validate file extension
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!data.allowedExtensions.includes(fileExt)) {
      console.warn(`File type ${fileExt} not allowed`);
      return;
    }

    setSelectedFile(file);
  }

  function handleConfirmSelection() {
    if (!selectedFile || !selectedFileApi || selectedFile.type !== 'file') return;

    const result: SelectedFile = {
      path: `/opt/dreamfactory/storage/app/${selectedFile.path}`,
      relativePath: selectedFile.path,
      fileName: selectedFile.name,
      name: selectedFile.name,
      serviceId: selectedFileApi.id,
      serviceName: selectedFileApi.name,
      size: selectedFile.size,
      contentType: selectedFile.contentType,
      lastModified: selectedFile.lastModified,
    };

    onFileSelected?.(result);
    onClose();
  }

  function handleCreateFolder(folderName: string) {
    if (!selectedFileApi) return;

    fileApi.createFolder({
      serviceName: selectedFileApi.name,
      path: currentPath,
      folderName,
    });
  }

  function handleClose() {
    onClose();
    // Reset state when dialog closes
    setTimeout(() => {
      setSelectedFileApi(null);
      setCurrentPath('');
      setSelectedFile(null);
      setNavigationStack([]);
      setUploadProgress([]);
      filterForm.reset();
    }, 200);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    // Escape key - close dialog
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }

    // Enter key - confirm selection if file is selected
    if (event.key === 'Enter' && selectedFile && selectedFile.type === 'file') {
      event.preventDefault();
      handleConfirmSelection();
      return;
    }

    // Backspace/Delete - navigate back
    if ((event.key === 'Backspace' || event.key === 'Delete') && !event.target) {
      event.preventDefault();
      handleNavigateBack();
      return;
    }
  }

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Reset selection when path changes
  useEffect(() => {
    setSelectedFile(null);
  }, [currentPath]);

  // Focus management
  useEffect(() => {
    if (open && initialFocusRef.current) {
      const timeoutId = setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  // Auto-select service if only one available
  useEffect(() => {
    if (open && data.fileApis.length === 1 && !selectedFileApi) {
      handleSelectFileApi(data.fileApis[0]);
    }
  }, [open, data.fileApis, selectedFileApi]);

  // Handle upload mode
  useEffect(() => {
    if (data.uploadMode && data.fileToUpload && selectedFileApi) {
      handleFileUpload(data.fileToUpload);
    }
  }, [data.uploadMode, data.fileToUpload, selectedFileApi]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderServiceSelection = () => (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Select a File Service
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.fileApis.map((fileApi) => (
          <button
            key={fileApi.id}
            type="button"
            onClick={() => handleSelectFileApi(fileApi)}
            className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <FolderIconSolid className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3" aria-hidden="true" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {fileApi.label || fileApi.name}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {fileApi.type}
              </div>
              {fileApi.description && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {fileApi.description}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFileBrowser = () => (
    <div 
      className="flex flex-col h-full"
      {...dragAndDrop.dragHandlers}
    >
      {/* Navigation Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleNavigateBack}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={`Switch to ${viewMode === 'list' ? 'grid' : 'list'} view`}
              >
                {viewMode === 'list' ? (
                  <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ListBulletIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          currentPath={currentPath}
          serviceName={selectedFileApi?.name || 'Service'}
          onNavigate={handleNavigateToPath}
          className="mb-3"
        />

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search files..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                {...filterForm.register('searchTerm')}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              {...filterForm.register('fileType')}
            >
              <option value="all">All</option>
              <option value="files">Files</option>
              <option value="folders">Folders</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              {...filterForm.register('sortBy')}
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="size">Size</option>
              <option value="lastModified">Modified</option>
            </select>
          </div>
        </div>

        {/* Action Buttons - only show if not selector-only mode */}
        {hasUploadPermission && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => setCreateFolderDialogOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              New Folder
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" aria-hidden="true" />
              Upload Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={data.multiple}
              accept={data.allowedExtensions.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              aria-label="File upload input"
            />
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
          {uploadProgress.map((progress, index) => (
            <UploadProgressIndicator
              key={`${progress.file.name}-${index}`}
              progress={progress}
              onCancel={() => {
                setUploadProgress(prev => prev.filter((_, i) => i !== index));
              }}
            />
          ))}
        </div>
      )}

      {/* File List Container */}
      <div className="flex-1 overflow-hidden">
        {/* Drag overlay */}
        {dragAndDrop.isDragOver && hasUploadPermission && (
          <div className="absolute inset-0 bg-primary-500/10 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-primary-500 mx-auto mb-2" aria-hidden="true" />
              <p className="text-primary-700 dark:text-primary-300 font-medium">
                Drop files here to upload
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !uploadProgress.length && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading files...</span>
          </div>
        )}

        {/* Error State */}
        {fileListingQuery.error && (
          <div className="p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" aria-hidden="true" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
              Failed to load files
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {fileListingQuery.error.message}
            </p>
            <button
              type="button"
              onClick={() => fileListingQuery.refetch()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fileListingQuery.error && filteredAndSortedFiles.length === 0 && (
          <div className="p-6 text-center">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
              {filterForm.watch('searchTerm') ? 'No matching files found' : 'This folder is empty'}
            </p>
            {hasUploadPermission && !filterForm.watch('searchTerm') && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <CloudArrowUpIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                Upload Files
              </button>
            )}
          </div>
        )}

        {/* File List with Virtual Scrolling */}
        {!isLoading && !fileListingQuery.error && filteredAndSortedFiles.length > 0 && (
          <div
            ref={scrollElementRef}
            className="h-full overflow-auto"
            style={{ height: '400px' }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const file = filteredAndSortedFiles[virtualItem.index];
                const isSelected = selectedFile?.path === file.path;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (file.type === 'folder') {
                          handleOpenFolder(file);
                        } else {
                          handleSelectFile(file);
                        }
                      }}
                      onDoubleClick={() => {
                        if (file.type === 'folder') {
                          handleOpenFolder(file);
                        } else if (file.type === 'file') {
                          handleConfirmSelection();
                        }
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800'
                          : 'border-transparent'
                      } border-l-4`}
                      aria-pressed={isSelected}
                      aria-label={`${file.type === 'folder' ? 'Open folder' : 'Select file'} ${file.name}`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileIcon 
                          file={file} 
                          className="h-5 w-5 mr-3 flex-shrink-0" 
                          selected={isSelected}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isSelected 
                              ? 'text-primary-900 dark:text-primary-100' 
                              : 'text-gray-900 dark:text-gray-100'
                          }`}>
                            {file.name}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{file.type === 'folder' ? 'Folder' : file.contentType || 'File'}</span>
                            {file.size && (
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                            )}
                            {file.lastModified && (
                              <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircleIconSolid 
                            className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 ml-3" 
                            aria-hidden="true" 
                          />
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selector-only info */}
      {isSelectorOnly && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You can only select existing files. To upload new files, please use the File Manager.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        className="relative z-50"
        initialFocus={initialFocusRef}
      >
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />

        {/* Dialog container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            className={`w-full max-w-4xl max-h-[90vh] rounded-lg bg-white dark:bg-gray-900 shadow-xl ring-1 ring-gray-900/10 dark:ring-gray-100/10 flex flex-col ${className}`}
            onKeyDown={handleKeyDown}
            {...props}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900">
                  {data.uploadMode ? (
                    <CloudArrowUpIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  ) : (
                    <FolderOpenIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {data.uploadMode ? 'Upload File' : title}
                  </DialogTitle>
                  {data.allowedExtensions.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Allowed file types: {data.allowedExtensions.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm p-1"
                aria-label="Close dialog"
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {!selectedFileApi ? renderServiceSelection() : renderFileBrowser()}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSelection}
                disabled={!selectedFile || selectedFile.type !== 'file' || isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                ref={initialFocusRef}
              >
                {data.uploadMode ? 'Upload' : 'Choose'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onClose={() => setCreateFolderDialogOpen(false)}
        onFolderCreated={(folderPath) => {
          setCreateFolderDialogOpen(false);
          // Refresh file listing
          if (selectedFileApi) {
            fileListingQuery.refetch();
          }
        }}
        currentPath={currentPath}
        fileService={selectedFileApi}
        createFolder={handleCreateFolder}
      />
    </>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export default FileSelectorDialog;
export type { FileSelectorDialogProps };