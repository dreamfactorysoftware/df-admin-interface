/**
 * TypeScript type definitions and interfaces for the file selector component system.
 * 
 * Provides comprehensive type safety for file selection, upload, validation, and metadata
 * management within the DreamFactory Admin Interface React migration. Integrates with
 * React Hook Form, Zod validation, and Next.js streaming file operations.
 * 
 * Features:
 * - Runtime type validation with Zod schemas
 * - Generic file operation patterns for reusability  
 * - Upload progress tracking and error handling
 * - React 19 and Next.js 15.1+ compatibility
 * - Integration with DreamFactory file service APIs
 * 
 * @fileoverview File selector TypeScript definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import { ReactNode, ComponentType, ChangeEvent, DragEvent } from 'react';
import { BaseComponent, FormFieldComponent, ComponentVariant, ComponentSize, LoadingState } from '../../../types/ui';
import { ApiResponse, ApiListResponse, HttpStatusCode } from '../../../types/api';

// ============================================================================
// CORE FILE SELECTOR TYPES
// ============================================================================

/**
 * File API information structure for DreamFactory file service integration.
 * Contains metadata about available file operations and service configuration.
 */
export interface FileApiInfo {
  /** DreamFactory service name for file operations */
  serviceName: string;
  
  /** Base path for file operations within the service */
  basePath: string;
  
  /** Supported file operations */
  supportedOperations: FileOperation[];
  
  /** Maximum file size in bytes */
  maxFileSize: number;
  
  /** Maximum total upload size for multiple files */
  maxTotalSize?: number;
  
  /** Allowed file extensions (e.g., ['.pdf', '.jpg', '.png']) */
  allowedExtensions?: string[];
  
  /** Allowed MIME types */
  allowedMimeTypes?: string[];
  
  /** Whether the service supports folder operations */
  supportsFolders: boolean;
  
  /** Whether the service supports file versioning */
  supportsVersioning?: boolean;
  
  /** Current user's permissions for this service */
  permissions: FileServicePermissions;
  
  /** Service-specific configuration */
  config?: FileServiceConfig;
}

/**
 * Supported file operations within the DreamFactory file service
 */
export type FileOperation = 
  | 'read'
  | 'write' 
  | 'create'
  | 'update'
  | 'delete'
  | 'list'
  | 'upload'
  | 'download'
  | 'move'
  | 'copy'
  | 'rename'
  | 'mkdir'
  | 'rmdir';

/**
 * File service permissions for current user context
 */
export interface FileServicePermissions {
  canRead: boolean;
  canWrite: boolean;
  canCreate: boolean;
  canDelete: boolean;
  canCreateFolders: boolean;
  canUpload: boolean;
  canDownload: boolean;
  
  /** Restricted paths that user cannot access */
  restrictedPaths?: string[];
  
  /** Maximum file size user can upload */
  maxUploadSize?: number;
}

/**
 * Service-specific configuration for file operations
 */
export interface FileServiceConfig {
  /** Whether to enable chunked uploads for large files */
  chunkedUpload?: boolean;
  
  /** Chunk size for uploads in bytes */
  chunkSize?: number;
  
  /** Whether to generate thumbnails for images */
  generateThumbnails?: boolean;
  
  /** Thumbnail sizes to generate */
  thumbnailSizes?: Array<{ width: number; height: number; name: string }>;
  
  /** Whether to scan files for viruses */
  virusScanning?: boolean;
  
  /** Whether to extract metadata from files */
  extractMetadata?: boolean;
  
  /** Content delivery network configuration */
  cdnConfig?: {
    enabled: boolean;
    baseUrl: string;
    cacheTtl: number;
  };
}

// ============================================================================
// FILE METADATA AND INFORMATION
// ============================================================================

/**
 * Comprehensive file metadata structure with enhanced information
 * for DreamFactory file management and React component integration.
 */
export interface FileMetadata {
  /** Unique file identifier */
  id?: string;
  
  /** File name with extension */
  name: string;
  
  /** File path relative to service base */
  path: string;
  
  /** Full absolute path */
  fullPath?: string;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type */
  mimeType: string;
  
  /** File extension (e.g., '.pdf') */
  extension: string;
  
  /** File type category */
  type: FileType;
  
  /** Creation timestamp (ISO 8601) */
  createdAt?: string;
  
  /** Last modification timestamp (ISO 8601) */
  modifiedAt?: string;
  
  /** Last access timestamp (ISO 8601) */
  accessedAt?: string;
  
  /** File owner information */
  owner?: FileOwner;
  
  /** File permissions */
  permissions?: FilePermissions;
  
  /** Whether this is a directory */
  isDirectory: boolean;
  
  /** Whether this is a symbolic link */
  isSymlink?: boolean;
  
  /** Number of child items (for directories) */
  childCount?: number;
  
  /** File content hash (for integrity checking) */
  hash?: string;
  
  /** Hash algorithm used */
  hashAlgorithm?: 'md5' | 'sha1' | 'sha256';
  
  /** Additional metadata extracted from file content */
  contentMetadata?: FileContentMetadata;
  
  /** Preview/thumbnail information */
  preview?: FilePreview;
  
  /** Custom metadata attributes */
  attributes?: Record<string, any>;
  
  /** File versions (if versioning is enabled) */
  versions?: FileVersion[];
  
  /** Tags associated with the file */
  tags?: string[];
}

/**
 * File type categories for enhanced file management
 */
export type FileType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'text'
  | 'pdf'
  | 'executable'
  | 'font'
  | 'other';

/**
 * File owner information
 */
export interface FileOwner {
  id: number | string;
  name: string;
  email?: string;
  type: 'user' | 'system' | 'service';
}

/**
 * File permission structure
 */
export interface FilePermissions {
  owner: PermissionSet;
  group: PermissionSet;
  others: PermissionSet;
  
  /** Octal representation (e.g., 755) */
  octal?: string;
  
  /** Human-readable representation */
  readable?: string;
}

export interface PermissionSet {
  read: boolean;
  write: boolean;
  execute: boolean;
}

/**
 * Content-specific metadata extracted from files
 */
export interface FileContentMetadata {
  /** Image metadata */
  image?: {
    width: number;
    height: number;
    colorSpace?: string;
    hasAlpha?: boolean;
    dpi?: { x: number; y: number };
    camera?: {
      make?: string;
      model?: string;
      exposureTime?: string;
      fNumber?: string;
      iso?: number;
      focalLength?: string;
    };
    gps?: {
      latitude?: number;
      longitude?: number;
      altitude?: number;
    };
  };
  
  /** Video metadata */
  video?: {
    duration: number;
    width: number;
    height: number;
    frameRate: number;
    bitrate?: number;
    codec?: string;
    audioCodec?: string;
  };
  
  /** Audio metadata */
  audio?: {
    duration: number;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
    codec?: string;
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: number;
  };
  
  /** Document metadata */
  document?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    pageCount?: number;
    wordCount?: number;
    language?: string;
  };
}

/**
 * Preview/thumbnail information for visual file representation
 */
export interface FilePreview {
  /** Available thumbnail sizes */
  thumbnails: Array<{
    size: string;
    url: string;
    width: number;
    height: number;
  }>;
  
  /** Whether a preview can be generated */
  canGenerate: boolean;
  
  /** Preview generation status */
  status: 'pending' | 'generating' | 'ready' | 'error';
  
  /** Error message if preview generation failed */
  error?: string;
}

/**
 * File version information for version control
 */
export interface FileVersion {
  id: string;
  version: number;
  size: number;
  createdAt: string;
  createdBy: FileOwner;
  comment?: string;
  hash: string;
  url?: string;
}

// ============================================================================
// SELECTED FILE TYPES
// ============================================================================

/**
 * Selected file interface for tracking user selections and upload state.
 * Enhanced with upload progress, validation status, and error handling.
 */
export interface SelectedFile extends FileMetadata {
  /** Original File object from browser */
  file?: File;
  
  /** Upload progress (0-100) */
  uploadProgress?: number;
  
  /** Upload state */
  uploadState: UploadState;
  
  /** Upload start timestamp */
  uploadStartedAt?: string;
  
  /** Upload completion timestamp */
  uploadCompletedAt?: string;
  
  /** Upload speed in bytes per second */
  uploadSpeed?: number;
  
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  
  /** Validation result */
  validation: FileValidationResult;
  
  /** Error information if upload failed */
  error?: FileUploadError;
  
  /** Whether file is selected for batch operations */
  selected?: boolean;
  
  /** Temporary preview URL for display before upload */
  previewUrl?: string;
  
  /** Upload request ID for tracking */
  uploadId?: string;
  
  /** Whether upload can be paused/resumed */
  pausable?: boolean;
  
  /** Whether upload is currently paused */
  paused?: boolean;
  
  /** Additional upload options */
  uploadOptions?: UploadOptions;
}

/**
 * File upload state enumeration
 */
export type UploadState = 
  | 'pending'      // File selected but not started
  | 'validating'   // Validating file before upload
  | 'queued'       // Waiting in upload queue
  | 'uploading'    // Currently uploading
  | 'paused'       // Upload paused by user
  | 'processing'   // Server processing (e.g., thumbnail generation)
  | 'completed'    // Successfully uploaded
  | 'cancelled'    // Cancelled by user
  | 'failed'       // Upload failed
  | 'retrying';    // Retrying failed upload

/**
 * File validation result with detailed feedback
 */
export interface FileValidationResult {
  /** Whether file passed all validations */
  isValid: boolean;
  
  /** Array of validation errors */
  errors: FileValidationError[];
  
  /** Array of validation warnings */
  warnings: FileValidationWarning[];
  
  /** Validation timestamp */
  validatedAt: string;
  
  /** Validation rules that were applied */
  appliedRules: string[];
}

/**
 * File validation error details
 */
export interface FileValidationError {
  /** Error code for programmatic handling */
  code: FileValidationErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Additional error context */
  context?: Record<string, any>;
  
  /** Suggested fix for the error */
  suggestion?: string;
}

/**
 * File validation error codes
 */
export type FileValidationErrorCode = 
  | 'FILE_TOO_LARGE'
  | 'FILE_TOO_SMALL'
  | 'INVALID_EXTENSION'
  | 'INVALID_MIME_TYPE'
  | 'DUPLICATE_FILE'
  | 'FILENAME_INVALID'
  | 'PATH_TOO_LONG'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'QUOTA_EXCEEDED'
  | 'VIRUS_DETECTED'
  | 'CORRUPTED_FILE'
  | 'UNKNOWN_ERROR';

/**
 * File validation warning for non-blocking issues
 */
export interface FileValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Warning severity */
  severity: 'low' | 'medium' | 'high';
}

/**
 * File upload error with detailed information
 */
export interface FileUploadError {
  /** Error code */
  code: FileUploadErrorCode;
  
  /** Error message */
  message: string;
  
  /** HTTP status code if applicable */
  statusCode?: HttpStatusCode;
  
  /** Whether error is retryable */
  retryable: boolean;
  
  /** Retry count */
  retryCount?: number;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Error details */
  details?: any;
  
  /** Server response if available */
  response?: any;
}

/**
 * File upload error codes
 */
export type FileUploadErrorCode = 
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'FILE_NOT_FOUND'
  | 'UPLOAD_CANCELLED'
  | 'UPLOAD_TIMEOUT'
  | 'CHUNK_UPLOAD_FAILED'
  | 'PROCESSING_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

/**
 * Upload configuration options
 */
export interface UploadOptions {
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  
  /** Custom upload path */
  path?: string;
  
  /** Whether to generate thumbnails */
  generateThumbnails?: boolean;
  
  /** Whether to extract metadata */
  extractMetadata?: boolean;
  
  /** Custom metadata to attach */
  metadata?: Record<string, any>;
  
  /** Tags to apply to uploaded files */
  tags?: string[];
  
  /** Whether to make uploaded files public */
  makePublic?: boolean;
  
  /** Custom headers for upload request */
  headers?: Record<string, string>;
  
  /** Upload timeout in milliseconds */
  timeout?: number;
  
  /** Whether to use chunked upload */
  chunked?: boolean;
  
  /** Chunk size for chunked uploads */
  chunkSize?: number;
}

// ============================================================================
// FILE SELECTOR COMPONENT TYPES
// ============================================================================

/**
 * Main file selector component interface extending base form field component.
 * Provides comprehensive file selection and upload capabilities.
 */
export interface FileSelectorComponent extends Omit<FormFieldComponent, 'type'> {
  /** File API configuration */
  apiInfo: FileApiInfo;
  
  /** Currently selected files */
  selectedFiles: SelectedFile[];
  
  /** File selection change handler */
  onSelectionChange: (files: SelectedFile[]) => void;
  
  /** File upload progress handler */
  onUploadProgress?: (file: SelectedFile, progress: number) => void;
  
  /** Upload completion handler */
  onUploadComplete?: (files: SelectedFile[]) => void;
  
  /** Upload error handler */
  onUploadError?: (file: SelectedFile, error: FileUploadError) => void;
  
  /** File removal handler */
  onFileRemove?: (file: SelectedFile) => void;
  
  /** File validation handler */
  onFileValidate?: (file: File) => Promise<FileValidationResult> | FileValidationResult;
  
  /** Selection mode */
  selectionMode: FileSelectionMode;
  
  /** Upload mode configuration */
  uploadMode: UploadMode;
  
  /** File browser configuration */
  browserConfig?: FileBrowserConfig;
  
  /** Drag and drop configuration */
  dragDropConfig?: DragDropConfig;
  
  /** Preview configuration */
  previewConfig?: FilePreviewConfig;
  
  /** Upload queue configuration */
  queueConfig?: UploadQueueConfig;
  
  /** Component appearance variant */
  variant?: FileSelectorVariant;
  
  /** Component size */
  size?: ComponentSize;
  
  /** Whether component is in read-only mode */
  readOnly?: boolean;
  
  /** Maximum number of files that can be selected */
  maxFiles?: number;
  
  /** Whether to show upload progress */
  showProgress?: boolean;
  
  /** Whether to show file previews */
  showPreviews?: boolean;
  
  /** Whether to enable batch operations */
  enableBatchOperations?: boolean;
  
  /** Custom file filter function */
  fileFilter?: (file: File) => boolean;
  
  /** Custom file sorter function */
  fileSorter?: (a: SelectedFile, b: SelectedFile) => number;
  
  /** Loading state for file operations */
  loading?: LoadingState;
  
  /** Custom empty state component */
  emptyState?: ReactNode;
  
  /** Custom error state component */
  errorState?: ReactNode;
}

/**
 * File selection modes
 */
export type FileSelectionMode = 
  | 'single'      // Select one file only
  | 'multiple'    // Select multiple files
  | 'directory'   // Select entire directories
  | 'mixed';      // Select files and directories

/**
 * Upload mode configuration
 */
export type UploadMode = 
  | 'manual'      // User triggers upload manually
  | 'automatic'   // Upload starts immediately on selection
  | 'queue'       // Add to queue, process later
  | 'disabled';   // No upload, selection only

/**
 * File selector visual variants
 */
export type FileSelectorVariant = 
  | 'dropzone'    // Large drop zone area
  | 'button'      // Simple file input button
  | 'inline'      // Inline file selector
  | 'modal'       // Modal file browser
  | 'sidebar'     // Sidebar file browser
  | 'grid'        // Grid-based file browser
  | 'list';       // List-based file browser

/**
 * File browser configuration for modal/sidebar variants
 */
export interface FileBrowserConfig {
  /** Initial view mode */
  viewMode: FileBrowserViewMode;
  
  /** Whether user can change view mode */
  allowViewModeChange?: boolean;
  
  /** Whether to show hidden files */
  showHiddenFiles?: boolean;
  
  /** Whether to show file details panel */
  showDetailsPanel?: boolean;
  
  /** Whether to enable folder navigation */
  enableNavigation?: boolean;
  
  /** Initial path to open */
  initialPath?: string;
  
  /** Whether to show path breadcrumbs */
  showBreadcrumbs?: boolean;
  
  /** Whether to show search functionality */
  enableSearch?: boolean;
  
  /** Whether to show file actions (rename, delete, etc.) */
  showFileActions?: boolean;
  
  /** Custom actions for files */
  customActions?: FileAction[];
  
  /** Sort configuration */
  sorting?: FileSortConfig;
  
  /** Filter configuration */
  filtering?: FileFilterConfig;
}

/**
 * File browser view modes
 */
export type FileBrowserViewMode = 
  | 'grid'        // Grid of file thumbnails
  | 'list'        // Detailed list view
  | 'table'       // Table with columns
  | 'tiles';      // Large tiles with previews

/**
 * Custom file action definition
 */
export interface FileAction {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  handler: (files: SelectedFile[]) => void | Promise<void>;
  disabled?: (files: SelectedFile[]) => boolean;
  variant?: ComponentVariant;
  position?: 'toolbar' | 'context' | 'both';
}

/**
 * File sorting configuration
 */
export interface FileSortConfig {
  /** Default sort field */
  defaultField: FileSortField;
  
  /** Default sort direction */
  defaultDirection: 'asc' | 'desc';
  
  /** Available sort fields */
  availableFields: FileSortField[];
  
  /** Whether to sort directories first */
  directoriesFirst?: boolean;
}

/**
 * File sort fields
 */
export type FileSortField = 
  | 'name'
  | 'size'
  | 'type'
  | 'modified'
  | 'created'
  | 'extension';

/**
 * File filtering configuration
 */
export interface FileFilterConfig {
  /** Available quick filters */
  quickFilters: FileQuickFilter[];
  
  /** Whether to enable custom filters */
  enableCustomFilters?: boolean;
  
  /** Default active filters */
  defaultFilters?: string[];
}

/**
 * Quick filter definition
 */
export interface FileQuickFilter {
  id: string;
  label: string;
  filter: (file: FileMetadata) => boolean;
  icon?: ComponentType<{ className?: string }>;
  active?: boolean;
}

/**
 * Drag and drop configuration
 */
export interface DragDropConfig {
  /** Whether drag and drop is enabled */
  enabled: boolean;
  
  /** Drop zone appearance variant */
  variant?: 'overlay' | 'border' | 'background';
  
  /** Custom drop zone text */
  dropText?: string;
  
  /** Custom drag over text */
  dragOverText?: string;
  
  /** Whether to highlight drop zone on drag over */
  highlightOnDragOver?: boolean;
  
  /** Whether to accept directory drops */
  acceptDirectories?: boolean;
  
  /** Custom drop validation */
  validateDrop?: (event: DragEvent) => boolean;
  
  /** Drop event handler */
  onDrop?: (event: DragEvent, files: FileList) => void;
  
  /** Drag over event handler */
  onDragOver?: (event: DragEvent) => void;
  
  /** Drag leave event handler */
  onDragLeave?: (event: DragEvent) => void;
}

/**
 * File preview configuration
 */
export interface FilePreviewConfig {
  /** Whether to enable file previews */
  enabled: boolean;
  
  /** Preview size variant */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether to show preview in modal */
  modalPreview?: boolean;
  
  /** Whether to generate thumbnails */
  generateThumbnails?: boolean;
  
  /** Supported preview types */
  supportedTypes?: FileType[];
  
  /** Maximum file size for preview generation */
  maxPreviewSize?: number;
  
  /** Custom preview component */
  customPreviewComponent?: ComponentType<{ file: SelectedFile }>;
  
  /** Preview loading component */
  loadingComponent?: ComponentType;
  
  /** Preview error component */
  errorComponent?: ComponentType<{ error: string }>;
}

/**
 * Upload queue configuration
 */
export interface UploadQueueConfig {
  /** Maximum concurrent uploads */
  maxConcurrent: number;
  
  /** Whether to auto-start queue */
  autoStart?: boolean;
  
  /** Upload retry configuration */
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier?: number;
  };
  
  /** Queue processing order */
  processingOrder?: 'fifo' | 'lifo' | 'size-asc' | 'size-desc';
  
  /** Whether to pause queue on error */
  pauseOnError?: boolean;
  
  /** Progress reporting interval in milliseconds */
  progressInterval?: number;
}

// ============================================================================
// EVENT HANDLER TYPES
// ============================================================================

/**
 * File selection event handler types for React integration
 */
export interface FileEventHandlers {
  /** File input change handler */
  onFileInputChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  
  /** File selection handler */
  onFileSelect?: (files: FileList | File[]) => void;
  
  /** File deselection handler */
  onFileDeselect?: (file: SelectedFile) => void;
  
  /** Drag and drop handlers */
  onDrop?: (event: DragEvent<HTMLElement>) => void;
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragEnter?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLElement>) => void;
  
  /** Upload lifecycle handlers */
  onUploadStart?: (file: SelectedFile) => void;
  onUploadProgress?: (file: SelectedFile, progress: number) => void;
  onUploadComplete?: (file: SelectedFile) => void;
  onUploadError?: (file: SelectedFile, error: FileUploadError) => void;
  onUploadCancel?: (file: SelectedFile) => void;
  onUploadPause?: (file: SelectedFile) => void;
  onUploadResume?: (file: SelectedFile) => void;
  
  /** Validation handlers */
  onValidationStart?: (file: File) => void;
  onValidationComplete?: (file: File, result: FileValidationResult) => void;
  onValidationError?: (file: File, error: Error) => void;
  
  /** Selection state handlers */
  onSelectionChange?: (selectedFiles: SelectedFile[]) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  
  /** File operation handlers */
  onFileDelete?: (file: SelectedFile) => void;
  onFileRename?: (file: SelectedFile, newName: string) => void;
  onFileMove?: (file: SelectedFile, newPath: string) => void;
  onFileCopy?: (file: SelectedFile, targetPath: string) => void;
  
  /** Preview handlers */
  onPreviewOpen?: (file: SelectedFile) => void;
  onPreviewClose?: (file: SelectedFile) => void;
  onPreviewError?: (file: SelectedFile, error: Error) => void;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for file API information validation
 */
export const FileApiInfoSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  basePath: z.string(),
  supportedOperations: z.array(z.enum([
    'read', 'write', 'create', 'update', 'delete', 'list',
    'upload', 'download', 'move', 'copy', 'rename', 'mkdir', 'rmdir'
  ])),
  maxFileSize: z.number().int().positive('Max file size must be positive'),
  maxTotalSize: z.number().int().positive().optional(),
  allowedExtensions: z.array(z.string()).optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
  supportsFolders: z.boolean(),
  supportsVersioning: z.boolean().optional(),
  permissions: z.object({
    canRead: z.boolean(),
    canWrite: z.boolean(),
    canCreate: z.boolean(),
    canDelete: z.boolean(),
    canCreateFolders: z.boolean(),
    canUpload: z.boolean(),
    canDownload: z.boolean(),
    restrictedPaths: z.array(z.string()).optional(),
    maxUploadSize: z.number().int().positive().optional(),
  }),
  config: z.object({
    chunkedUpload: z.boolean().optional(),
    chunkSize: z.number().int().positive().optional(),
    generateThumbnails: z.boolean().optional(),
    thumbnailSizes: z.array(z.object({
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      name: z.string(),
    })).optional(),
    virusScanning: z.boolean().optional(),
    extractMetadata: z.boolean().optional(),
    cdnConfig: z.object({
      enabled: z.boolean(),
      baseUrl: z.string().url(),
      cacheTtl: z.number().int().positive(),
    }).optional(),
  }).optional(),
});

/**
 * Zod schema for file metadata validation
 */
export const FileMetadataSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'File name is required'),
  path: z.string(),
  fullPath: z.string().optional(),
  size: z.number().int().min(0, 'File size cannot be negative'),
  mimeType: z.string().min(1, 'MIME type is required'),
  extension: z.string(),
  type: z.enum([
    'image', 'video', 'audio', 'document', 'spreadsheet', 'presentation',
    'archive', 'code', 'text', 'pdf', 'executable', 'font', 'other'
  ]),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
  accessedAt: z.string().datetime().optional(),
  owner: z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    email: z.string().email().optional(),
    type: z.enum(['user', 'system', 'service']),
  }).optional(),
  permissions: z.object({
    owner: z.object({
      read: z.boolean(),
      write: z.boolean(),
      execute: z.boolean(),
    }),
    group: z.object({
      read: z.boolean(),
      write: z.boolean(),
      execute: z.boolean(),
    }),
    others: z.object({
      read: z.boolean(),
      write: z.boolean(),
      execute: z.boolean(),
    }),
    octal: z.string().optional(),
    readable: z.string().optional(),
  }).optional(),
  isDirectory: z.boolean(),
  isSymlink: z.boolean().optional(),
  childCount: z.number().int().min(0).optional(),
  hash: z.string().optional(),
  hashAlgorithm: z.enum(['md5', 'sha1', 'sha256']).optional(),
  contentMetadata: z.record(z.any()).optional(),
  preview: z.object({
    thumbnails: z.array(z.object({
      size: z.string(),
      url: z.string().url(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })),
    canGenerate: z.boolean(),
    status: z.enum(['pending', 'generating', 'ready', 'error']),
    error: z.string().optional(),
  }).optional(),
  attributes: z.record(z.any()).optional(),
  versions: z.array(z.object({
    id: z.string(),
    version: z.number().int().positive(),
    size: z.number().int().min(0),
    createdAt: z.string().datetime(),
    createdBy: z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string(),
      email: z.string().email().optional(),
      type: z.enum(['user', 'system', 'service']),
    }),
    comment: z.string().optional(),
    hash: z.string(),
    url: z.string().url().optional(),
  })).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Zod schema for selected file validation
 */
export const SelectedFileSchema = FileMetadataSchema.extend({
  uploadProgress: z.number().min(0).max(100).optional(),
  uploadState: z.enum([
    'pending', 'validating', 'queued', 'uploading', 'paused',
    'processing', 'completed', 'cancelled', 'failed', 'retrying'
  ]),
  uploadStartedAt: z.string().datetime().optional(),
  uploadCompletedAt: z.string().datetime().optional(),
  uploadSpeed: z.number().min(0).optional(),
  estimatedTimeRemaining: z.number().min(0).optional(),
  validation: z.object({
    isValid: z.boolean(),
    errors: z.array(z.object({
      code: z.enum([
        'FILE_TOO_LARGE', 'FILE_TOO_SMALL', 'INVALID_EXTENSION',
        'INVALID_MIME_TYPE', 'DUPLICATE_FILE', 'FILENAME_INVALID',
        'PATH_TOO_LONG', 'INSUFFICIENT_PERMISSIONS', 'QUOTA_EXCEEDED',
        'VIRUS_DETECTED', 'CORRUPTED_FILE', 'UNKNOWN_ERROR'
      ]),
      message: z.string(),
      context: z.record(z.any()).optional(),
      suggestion: z.string().optional(),
    })),
    warnings: z.array(z.object({
      code: z.string(),
      message: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })),
    validatedAt: z.string().datetime(),
    appliedRules: z.array(z.string()),
  }),
  error: z.object({
    code: z.enum([
      'NETWORK_ERROR', 'SERVER_ERROR', 'AUTHENTICATION_ERROR',
      'AUTHORIZATION_ERROR', 'FILE_NOT_FOUND', 'UPLOAD_CANCELLED',
      'UPLOAD_TIMEOUT', 'CHUNK_UPLOAD_FAILED', 'PROCESSING_FAILED',
      'QUOTA_EXCEEDED', 'SERVICE_UNAVAILABLE', 'UNKNOWN_ERROR'
    ]),
    message: z.string(),
    statusCode: z.number().int().optional(),
    retryable: z.boolean(),
    retryCount: z.number().int().min(0).optional(),
    maxRetries: z.number().int().min(0).optional(),
    details: z.any().optional(),
    response: z.any().optional(),
  }).optional(),
  selected: z.boolean().optional(),
  previewUrl: z.string().url().optional(),
  uploadId: z.string().optional(),
  pausable: z.boolean().optional(),
  paused: z.boolean().optional(),
  uploadOptions: z.object({
    overwrite: z.boolean().optional(),
    path: z.string().optional(),
    generateThumbnails: z.boolean().optional(),
    extractMetadata: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    makePublic: z.boolean().optional(),
    headers: z.record(z.string()).optional(),
    timeout: z.number().int().positive().optional(),
    chunked: z.boolean().optional(),
    chunkSize: z.number().int().positive().optional(),
  }).optional(),
});

/**
 * Zod schema for upload options validation
 */
export const UploadOptionsSchema = z.object({
  overwrite: z.boolean().optional(),
  path: z.string().optional(),
  generateThumbnails: z.boolean().optional(),
  extractMetadata: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  makePublic: z.boolean().optional(),
  headers: z.record(z.string()).optional(),
  timeout: z.number().int().positive().optional(),
  chunked: z.boolean().optional(),
  chunkSize: z.number().int().positive().optional(),
});

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Generic file operation result type for consistent API responses
 */
export type FileOperationResult<T = any> = ApiResponse<T>;

/**
 * File list response type for DreamFactory API integration
 */
export type FileListResponse = ApiListResponse<FileMetadata>;

/**
 * File upload response type
 */
export interface FileUploadResponse {
  /** Uploaded file metadata */
  file: FileMetadata;
  
  /** Upload statistics */
  stats: {
    uploadTime: number;
    averageSpeed: number;
    totalBytes: number;
  };
  
  /** Generated URLs */
  urls: {
    download?: string;
    preview?: string;
    thumbnail?: string;
  };
  
  /** Processing results */
  processing: {
    thumbnailsGenerated: boolean;
    metadataExtracted: boolean;
    virusScanned?: boolean;
    virusScanResult?: 'clean' | 'infected' | 'unknown';
  };
}

/**
 * Batch file operation result
 */
export interface BatchFileOperationResult<T = any> {
  /** Successful operations */
  successful: Array<{
    file: FileMetadata;
    result: T;
  }>;
  
  /** Failed operations */
  failed: Array<{
    file: FileMetadata;
    error: FileUploadError;
  }>;
  
  /** Overall statistics */
  stats: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

/**
 * File validation rule definition
 */
export interface FileValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (file: File, context?: any) => FileValidationError[] | Promise<FileValidationError[]>;
  enabled: boolean;
  order: number;
}

/**
 * File filter definition for advanced filtering
 */
export interface FileFilter {
  id: string;
  name: string;
  description: string;
  filter: (file: FileMetadata) => boolean;
  icon?: ComponentType<{ className?: string }>;
  category?: string;
}

/**
 * Type guard functions for runtime type checking
 */
export function isFileMetadata(obj: any): obj is FileMetadata {
  return FileMetadataSchema.safeParse(obj).success;
}

export function isSelectedFile(obj: any): obj is SelectedFile {
  return SelectedFileSchema.safeParse(obj).success;
}

export function isFileApiInfo(obj: any): obj is FileApiInfo {
  return FileApiInfoSchema.safeParse(obj).success;
}

/**
 * Utility type for extracting file types
 */
export type ExtractFileType<T> = T extends { type: infer U } ? U : never;

/**
 * Utility type for making file properties optional
 */
export type PartialFile<T extends FileMetadata> = Partial<T> & Pick<T, 'name' | 'path' | 'size' | 'mimeType' | 'isDirectory'>;

/**
 * File operation context for tracking operations
 */
export interface FileOperationContext {
  operationId: string;
  operationType: FileOperation;
  startTime: number;
  endTime?: number;
  user?: {
    id: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

// ============================================================================
// EXPORT ALIASES FOR CONVENIENCE
// ============================================================================

// Re-export commonly used types for easy importing
export type {
  ReactNode,
  ComponentType,
  ChangeEvent,
  DragEvent,
} from 'react';

// Export validation schemas for external use
export {
  FileApiInfoSchema,
  FileMetadataSchema,
  SelectedFileSchema,
  UploadOptionsSchema,
};

// Export default configurations
export const DEFAULT_FILE_SELECTOR_CONFIG: Partial<FileSelectorComponent> = {
  selectionMode: 'multiple',
  uploadMode: 'automatic',
  variant: 'dropzone',
  size: 'md',
  maxFiles: 10,
  showProgress: true,
  showPreviews: true,
  enableBatchOperations: true,
  dragDropConfig: {
    enabled: true,
    variant: 'overlay',
    highlightOnDragOver: true,
    acceptDirectories: false,
  },
  queueConfig: {
    maxConcurrent: 3,
    autoStart: true,
    retry: {
      enabled: true,
      maxAttempts: 3,
      delayMs: 1000,
    },
    processingOrder: 'fifo',
    progressInterval: 100,
  },
};