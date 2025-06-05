/**
 * File Selector Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces and Zod validation schemas for the file selector
 * component system. Provides type safety for file operations, metadata handling,
 * and UI state management throughout the file selection workflow.
 * 
 * @fileoverview Type definitions for React 19 file selector components
 * @version 1.0.0
 */

import { z } from 'zod';
import type { 
  BaseComponentProps, 
  FormComponentProps, 
  LoadingState, 
  ValidationState,
  ThemeProps,
  AccessibilityProps
} from '@/types/ui';

// =============================================================================
// CORE FILE API INTERFACES
// =============================================================================

/**
 * File service API information from DreamFactory backend
 * Represents a configured file service that can be used for file operations
 */
export interface FileApiInfo {
  /** Unique identifier for the file service */
  id: number;
  /** Internal service name used in API calls */
  name: string;
  /** Human-readable display label */
  label: string;
  /** Service type (e.g., 'local_file', 's3', 'azure_blob') */
  type: string;
  /** Service description (optional) */
  description?: string;
  /** Whether the service is active */
  active?: boolean;
  /** Service configuration metadata */
  config?: Record<string, any>;
}

/**
 * Zod schema for FileApiInfo validation
 */
export const FileApiInfoSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, 'Service name is required'),
  label: z.string().min(1, 'Service label is required'),
  type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  active: z.boolean().optional().default(true),
  config: z.record(z.any()).optional(),
});

/**
 * Selected file information returned from file selector operations
 * Contains both absolute and relative paths for different use cases
 */
export interface SelectedFile {
  /** Full absolute path including storage root (e.g., '/opt/dreamfactory/storage/app/file.txt') */
  path: string;
  /** Relative path within the file service (e.g., 'folder/file.txt') */
  relativePath?: string;
  /** Just the filename without path (e.g., 'file.txt') */
  fileName: string;
  /** Alias for fileName for template compatibility */
  name?: string;
  /** ID of the file service */
  serviceId: number;
  /** Name of the file service */
  serviceName: string;
  /** File size in bytes */
  size?: number;
  /** File content type/MIME type */
  contentType?: string;
  /** Last modified date */
  lastModified?: string;
  /** File metadata */
  metadata?: FileMetadata;
}

/**
 * Zod schema for SelectedFile validation
 */
export const SelectedFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  relativePath: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  name: z.string().optional(),
  serviceId: z.number().int().positive(),
  serviceName: z.string().min(1, 'Service name is required'),
  size: z.number().int().nonnegative().optional(),
  contentType: z.string().optional(),
  lastModified: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Enhanced file metadata for React components
 * Includes additional fields not present in the Angular version
 */
export interface FileMetadata {
  /** File checksum/hash */
  checksum?: string;
  /** File permissions */
  permissions?: string;
  /** File owner */
  owner?: string;
  /** File group */
  group?: string;
  /** Creation date */
  created?: string;
  /** Last accessed date */
  accessed?: string;
  /** File tags */
  tags?: string[];
  /** Custom metadata fields */
  custom?: Record<string, any>;
  /** Whether file is hidden */
  hidden?: boolean;
  /** Whether file is read-only */
  readOnly?: boolean;
  /** File thumbnail URL */
  thumbnailUrl?: string;
  /** File preview URL */
  previewUrl?: string;
}

/**
 * Zod schema for FileMetadata validation
 */
export const FileMetadataSchema = z.object({
  checksum: z.string().optional(),
  permissions: z.string().optional(),
  owner: z.string().optional(),
  group: z.string().optional(),
  created: z.string().optional(),
  accessed: z.string().optional(),
  tags: z.array(z.string()).optional(),
  custom: z.record(z.any()).optional(),
  hidden: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  thumbnailUrl: z.string().url().optional(),
  previewUrl: z.string().url().optional(),
});

// =============================================================================
// FILE OPERATION TYPES
// =============================================================================

/**
 * File item representation for directory listings
 */
export interface FileItem {
  /** File name */
  name: string;
  /** Full path to the file */
  path: string;
  /** File type: 'file' or 'folder' */
  type: 'file' | 'folder';
  /** MIME content type */
  contentType?: string;
  /** Last modified timestamp */
  lastModified?: string;
  /** File size in bytes */
  size?: number;
  /** File metadata */
  metadata?: FileMetadata;
  /** Whether item is selectable */
  selectable?: boolean;
  /** Whether item is hidden */
  hidden?: boolean;
}

/**
 * Zod schema for FileItem validation
 */
export const FileItemSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  path: z.string().min(1, 'File path is required'),
  type: z.enum(['file', 'folder']),
  contentType: z.string().optional(),
  lastModified: z.string().optional(),
  size: z.number().int().nonnegative().optional(),
  metadata: FileMetadataSchema.optional(),
  selectable: z.boolean().optional().default(true),
  hidden: z.boolean().optional().default(false),
});

/**
 * File upload progress tracking
 */
export interface FileUploadProgress {
  /** File being uploaded */
  file: File;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Bytes uploaded */
  bytesUploaded: number;
  /** Total bytes to upload */
  totalBytes: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
  /** Upload status */
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  /** Error message if upload failed */
  error?: string;
  /** Upload start time */
  startTime?: Date;
  /** Upload completion time */
  completionTime?: Date;
}

/**
 * Zod schema for FileUploadProgress validation
 */
export const FileUploadProgressSchema = z.object({
  file: z.instanceof(File),
  progress: z.number().min(0).max(100),
  bytesUploaded: z.number().int().nonnegative(),
  totalBytes: z.number().int().positive(),
  speed: z.number().nonnegative().optional(),
  timeRemaining: z.number().nonnegative().optional(),
  status: z.enum(['pending', 'uploading', 'completed', 'error', 'cancelled']),
  error: z.string().optional(),
  startTime: z.date().optional(),
  completionTime: z.date().optional(),
});

/**
 * File operation result type
 */
export interface FileOperationResult<T = any> {
  /** Operation success status */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message if operation failed */
  error?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Generic Zod schema for FileOperationResult
 */
export const FileOperationResultSchema = <T extends z.ZodTypeAny>(dataSchema?: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema ? dataSchema.optional() : z.any().optional(),
    error: z.string().optional(),
    statusCode: z.number().int().optional(),
    metadata: z.record(z.any()).optional(),
  });

// =============================================================================
// FILE SELECTOR COMPONENT PROPS
// =============================================================================

/**
 * File selector dialog data interface
 */
export interface FileSelectorDialogData {
  /** Available file services */
  fileApis: FileApiInfo[];
  /** Allowed file extensions */
  allowedExtensions: string[];
  /** Upload mode flag */
  uploadMode?: boolean;
  /** File to upload in upload mode */
  fileToUpload?: File;
  /** Selector-only mode (no upload/folder creation) */
  selectorOnly?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Multiple file selection */
  multiple?: boolean;
  /** Initial directory path */
  initialPath?: string;
  /** File type filter */
  fileTypeFilter?: string[];
}

/**
 * Zod schema for FileSelectorDialogData validation
 */
export const FileSelectorDialogDataSchema = z.object({
  fileApis: z.array(FileApiInfoSchema),
  allowedExtensions: z.array(z.string()),
  uploadMode: z.boolean().optional().default(false),
  fileToUpload: z.instanceof(File).optional(),
  selectorOnly: z.boolean().optional().default(false),
  maxFileSize: z.number().int().positive().optional(),
  multiple: z.boolean().optional().default(false),
  initialPath: z.string().optional(),
  fileTypeFilter: z.array(z.string()).optional(),
});

/**
 * File selector component props
 */
export interface FileSelectorProps extends 
  BaseComponentProps,
  FormComponentProps,
  ThemeProps,
  AccessibilityProps {
  /** Component label */
  label?: string;
  /** Component description */
  description?: string;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Initial selected file path */
  initialValue?: string;
  /** File selection callback */
  onFileSelected?: (file: SelectedFile | undefined) => void;
  /** Available file services */
  fileApis?: FileApiInfo[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Multiple file selection */
  multiple?: boolean;
  /** Show file preview */
  showPreview?: boolean;
  /** Allow file upload */
  allowUpload?: boolean;
  /** Allow folder creation */
  allowFolderCreation?: boolean;
  /** Drag and drop enabled */
  dragAndDrop?: boolean;
  /** File type filter */
  fileTypeFilter?: string[];
  /** Validation rules */
  validation?: {
    required?: boolean;
    maxSize?: number;
    allowedTypes?: string[];
    custom?: (file: SelectedFile) => string | undefined;
  };
}

/**
 * File selector dialog props
 */
export interface FileSelectorDialogProps extends BaseComponentProps {
  /** Dialog open state */
  open: boolean;
  /** Dialog close callback */
  onClose: () => void;
  /** File selection callback */
  onFileSelected?: (file: SelectedFile | undefined) => void;
  /** Dialog configuration data */
  data: FileSelectorDialogData;
  /** Dialog title */
  title?: string;
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// =============================================================================
// HOOK TYPES
// =============================================================================

/**
 * File API hook return type
 */
export interface UseFileApiReturn {
  /** List files in directory */
  listFiles: (serviceName: string, path?: string) => Promise<FileItem[]>;
  /** Upload file */
  uploadFile: (serviceName: string, file: File, path?: string) => Promise<SelectedFile>;
  /** Create directory */
  createDirectory: (serviceName: string, path: string, name: string) => Promise<void>;
  /** Delete file or directory */
  deleteFile: (serviceName: string, path: string) => Promise<void>;
  /** Get file services */
  getFileServices: () => Promise<FileApiInfo[]>;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * File selector hook return type
 */
export interface UseFileSelectorReturn {
  /** Selected file */
  selectedFile: SelectedFile | undefined;
  /** Set selected file */
  setSelectedFile: (file: SelectedFile | undefined) => void;
  /** Upload progress */
  uploadProgress: FileUploadProgress[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Clear selection */
  clearSelection: () => void;
  /** Validation state */
  validationState: ValidationState;
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

/**
 * File operation error types
 */
export type FileErrorType = 
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'UNKNOWN_ERROR';

/**
 * File operation error interface
 */
export interface FileError {
  /** Error type */
  type: FileErrorType;
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  details?: Record<string, any>;
  /** Retry information */
  retryable?: boolean;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Zod schema for FileError validation
 */
export const FileErrorSchema = z.object({
  type: z.enum([
    'INVALID_FILE_TYPE',
    'FILE_TOO_LARGE',
    'UPLOAD_FAILED',
    'ACCESS_DENIED',
    'NOT_FOUND',
    'SERVER_ERROR',
    'NETWORK_ERROR',
    'VALIDATION_ERROR',
    'QUOTA_EXCEEDED',
    'UNKNOWN_ERROR',
  ]),
  message: z.string().min(1, 'Error message is required'),
  code: z.string().optional(),
  statusCode: z.number().int().optional(),
  details: z.record(z.any()).optional(),
  retryable: z.boolean().optional().default(false),
  timestamp: z.date().optional(),
});

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * File size formatting options
 */
export interface FileSizeFormatOptions {
  /** Number of decimal places */
  precision?: number;
  /** Use binary (1024) or decimal (1000) units */
  binary?: boolean;
  /** Show unit in output */
  showUnit?: boolean;
  /** Locale for number formatting */
  locale?: string;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Allowed file extensions */
  allowedExtensions?: string[];
  /** Allowed MIME types */
  allowedMimeTypes?: string[];
  /** Custom validation function */
  customValidator?: (file: File) => string | undefined;
}

/**
 * Zod schema for FileValidationOptions
 */
export const FileValidationOptionsSchema = z.object({
  maxSize: z.number().int().positive().optional(),
  minSize: z.number().int().nonnegative().optional(),
  allowedExtensions: z.array(z.string()).optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
  customValidator: z.function().optional(),
});

// =============================================================================
// GENERIC UTILITY TYPES
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Response data */
  resource?: T;
  /** Success status */
  success?: boolean;
  /** Error message */
  error?: string;
  /** Metadata */
  meta?: {
    count?: number;
    offset?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Generic Zod schema for API responses
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema?: T) =>
  z.object({
    resource: dataSchema ? dataSchema.optional() : z.any().optional(),
    success: z.boolean().optional(),
    error: z.string().optional(),
    meta: z.object({
      count: z.number().int().nonnegative().optional(),
      offset: z.number().int().nonnegative().optional(),
      limit: z.number().int().positive().optional(),
      total: z.number().int().nonnegative().optional(),
    }).optional(),
  });

/**
 * Pagination options for file listings
 */
export interface PaginationOptions {
  /** Page offset */
  offset?: number;
  /** Page limit */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Search filter */
  filter?: string;
}

/**
 * Zod schema for PaginationOptions validation
 */
export const PaginationOptionsSchema = z.object({
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  filter: z.string().optional(),
});

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if an object is a valid FileApiInfo
 */
export function isFileApiInfo(obj: any): obj is FileApiInfo {
  return FileApiInfoSchema.safeParse(obj).success;
}

/**
 * Type guard to check if an object is a valid SelectedFile
 */
export function isSelectedFile(obj: any): obj is SelectedFile {
  return SelectedFileSchema.safeParse(obj).success;
}

/**
 * Type guard to check if an object is a valid FileItem
 */
export function isFileItem(obj: any): obj is FileItem {
  return FileItemSchema.safeParse(obj).success;
}

/**
 * Type guard to check if an object is a valid FileError
 */
export function isFileError(obj: any): obj is FileError {
  return FileErrorSchema.safeParse(obj).success;
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export all types for easy importing
export type {
  BaseComponentProps,
  FormComponentProps,
  LoadingState,
  ValidationState,
  ThemeProps,
  AccessibilityProps,
} from '@/types/ui';

// Export all Zod schemas for runtime validation
export {
  FileApiInfoSchema,
  SelectedFileSchema,
  FileMetadataSchema,
  FileItemSchema,
  FileUploadProgressSchema,
  FileOperationResultSchema,
  FileSelectorDialogDataSchema,
  FileErrorSchema,
  FileValidationOptionsSchema,
  ApiResponseSchema,
  PaginationOptionsSchema,
};