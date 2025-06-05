/**
 * Script Editor Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for the script editor component system
 * following React 19/Next.js 15.1 patterns with React Hook Form integration,
 * Zod schema validation, and DreamFactory API compatibility.
 * 
 * @fileoverview Script editor component type definitions with form validation
 * @version 1.0.0
 */

import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { type z } from 'zod';
import { type UseFormReturn, type FieldValues, type Control } from 'react-hook-form';
import { 
  type BaseComponentProps, 
  type FormComponentProps, 
  type ThemeProps,
  type AccessibilityProps,
  type LoadingState,
  type ValidationState 
} from '../../../types/ui';

// =============================================================================
// CORE SCRIPT EDITOR INTERFACES
// =============================================================================

/**
 * Main ScriptEditor component props interface
 * Provides comprehensive configuration for the script editor with form integration,
 * storage services, and GitHub import capabilities
 */
export interface ScriptEditorProps extends 
  BaseComponentProps<HTMLDivElement>,
  FormComponentProps,
  ThemeProps,
  AccessibilityProps {
  
  /** Current script content value */
  value?: string;
  /** Default script content for uncontrolled usage */
  defaultValue?: string;
  /** Content change handler */
  onChange?: (content: string) => void;
  
  /** ACE editor configuration */
  editorConfig?: AceEditorConfig;
  /** Enable/disable syntax highlighting */
  syntaxHighlighting?: boolean;
  /** Programming language for syntax highlighting */
  language?: ScriptLanguage;
  /** Editor theme (auto uses global theme) */
  editorTheme?: EditorTheme | 'auto';
  
  /** Storage service configuration */
  storageConfig?: StorageServiceConfig;
  /** Enable storage service integration */
  enableStorage?: boolean;
  /** Default storage service ID */
  defaultStorageServiceId?: string;
  /** Default storage path */
  defaultStoragePath?: string;
  
  /** File upload configuration */
  fileUploadConfig?: FileUploadConfig;
  /** Enable file upload functionality */
  enableFileUpload?: boolean;
  /** Accepted file types for upload */
  acceptedFileTypes?: string[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  
  /** GitHub integration configuration */
  githubConfig?: GitHubIntegrationConfig;
  /** Enable GitHub import functionality */
  enableGitHubImport?: boolean;
  
  /** Cache management configuration */
  cacheConfig?: CacheConfig;
  /** Enable cache operations */
  enableCache?: boolean;
  
  /** Form integration props */
  form?: UseFormReturn<any>;
  /** Field name for form registration */
  name?: string;
  /** Control instance for external form management */
  control?: Control<FieldValues>;
  
  /** Layout and display options */
  layout?: ScriptEditorLayout;
  /** Show/hide toolbar */
  showToolbar?: boolean;
  /** Show/hide file operations */
  showFileOperations?: boolean;
  /** Show/hide storage operations */
  showStorageOperations?: boolean;
  
  /** Event handlers */
  onContentSave?: (content: string, metadata?: ScriptMetadata) => void;
  onFileUpload?: (file: File, content: string) => void;
  onGitHubImport?: (content: string, metadata: GitHubFileMetadata) => void;
  onCacheOperation?: (operation: CacheOperation, result: CacheOperationResult) => void;
  onStorageServiceChange?: (serviceId: string | null) => void;
  onStoragePathChange?: (path: string) => void;
  
  /** Accessibility overrides */
  editorAriaLabel?: string;
  toolbarAriaLabel?: string;
  /** Screen reader announcements */
  announceContentChanges?: boolean;
}

/**
 * ACE editor configuration interface
 * Provides configuration options for the underlying ACE code editor
 */
export interface AceEditorConfig {
  /** Editor mode (language) */
  mode?: string;
  /** Editor theme */
  theme?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show gutter */
  showGutter?: boolean;
  /** Enable word wrap */
  wordWrap?: boolean;
  /** Tab size */
  tabSize?: number;
  /** Use soft tabs (spaces) */
  useSoftTabs?: boolean;
  /** Enable auto-completion */
  enableAutoCompletion?: boolean;
  /** Enable live auto-completion */
  enableLiveAutocompletion?: boolean;
  /** Enable snippets */
  enableSnippets?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Highlight active line */
  highlightActiveLine?: boolean;
  /** Show print margin */
  showPrintMargin?: boolean;
  /** Print margin column */
  printMarginColumn?: number;
  /** Additional ACE editor options */
  options?: Record<string, any>;
}

/**
 * Supported script languages for syntax highlighting
 */
export type ScriptLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'php'
  | 'json'
  | 'yaml'
  | 'xml'
  | 'html'
  | 'css'
  | 'sql'
  | 'markdown'
  | 'text';

/**
 * Editor theme options
 */
export type EditorTheme = 
  | 'github'
  | 'github_dark'
  | 'monokai'
  | 'tomorrow'
  | 'tomorrow_night'
  | 'solarized_light'
  | 'solarized_dark'
  | 'textmate'
  | 'terminal';

/**
 * Script editor layout configurations
 */
export interface ScriptEditorLayout {
  /** Layout orientation */
  orientation?: 'vertical' | 'horizontal';
  /** Toolbar position */
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right';
  /** Editor height */
  editorHeight?: string | number;
  /** Minimum editor height */
  minEditorHeight?: string | number;
  /** Maximum editor height */
  maxEditorHeight?: string | number;
  /** Enable resizable editor */
  resizable?: boolean;
  /** Show borders */
  showBorders?: boolean;
  /** Panel spacing */
  spacing?: 'compact' | 'normal' | 'relaxed';
}

// =============================================================================
// STORAGE SERVICE INTERFACES
// =============================================================================

/**
 * Storage service configuration for script management
 */
export interface StorageServiceConfig {
  /** Available storage services */
  services?: StorageService[];
  /** Default service selection */
  defaultServiceId?: string;
  /** Path validation rules */
  pathValidation?: StoragePathValidation;
  /** Service-specific options */
  serviceOptions?: Record<string, any>;
}

/**
 * Storage service interface compatible with DreamFactory API
 */
export interface StorageService {
  /** Service unique identifier */
  id: string;
  /** Service name */
  name: string;
  /** Display label */
  label?: string;
  /** Service description */
  description?: string;
  /** Service type */
  type: StorageServiceType;
  /** Service group */
  group?: ServiceGroup;
  /** Service configuration */
  config?: StorageServiceApiConfig;
  /** Service status */
  is_active?: boolean;
  /** Creation metadata */
  created_date?: string;
  /** Last modification metadata */
  last_modified_date?: string;
}

/**
 * Storage service types supported by DreamFactory
 */
export type StorageServiceType = 
  | 'file'
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 's3'
  | 'azure_blob'
  | 'google_cloud'
  | 'local_file'
  | 'ftp'
  | 'sftp';

/**
 * Service groups for categorization
 */
export type ServiceGroup = 'source control' | 'file' | 'cloud storage' | 'database';

/**
 * Storage service API configuration
 */
export interface StorageServiceApiConfig {
  /** Base URL for API endpoints */
  base_url?: string;
  /** Authentication configuration */
  auth?: StorageServiceAuth;
  /** Connection parameters */
  connection?: Record<string, any>;
  /** Service-specific options */
  options?: Record<string, any>;
}

/**
 * Storage service authentication configuration
 */
export interface StorageServiceAuth {
  /** Authentication type */
  type?: 'token' | 'oauth' | 'basic' | 'key';
  /** Authentication token/key */
  token?: string;
  /** Username for basic auth */
  username?: string;
  /** Password for basic auth */
  password?: string;
  /** OAuth configuration */
  oauth?: OAuthConfig;
}

/**
 * OAuth configuration for storage services
 */
export interface OAuthConfig {
  /** Client ID */
  client_id?: string;
  /** Client secret */
  client_secret?: string;
  /** Redirect URI */
  redirect_uri?: string;
  /** Access token */
  access_token?: string;
  /** Refresh token */
  refresh_token?: string;
  /** Token expiration */
  expires_at?: string;
}

/**
 * Storage path validation configuration
 */
export interface StoragePathValidation {
  /** Path is required when service is selected */
  requiredWhenServiceSelected?: boolean;
  /** Allowed path patterns */
  allowedPatterns?: string[];
  /** Forbidden path patterns */
  forbiddenPatterns?: string[];
  /** Maximum path length */
  maxLength?: number;
  /** Minimum path length */
  minLength?: number;
  /** Custom validation function */
  customValidator?: (path: string, serviceType: StorageServiceType) => string | null;
}

// =============================================================================
// FILE UPLOAD INTERFACES
// =============================================================================

/**
 * File upload configuration
 */
export interface FileUploadConfig {
  /** Accepted MIME types */
  acceptedTypes?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Enable drag and drop */
  enableDragDrop?: boolean;
  /** Upload progress tracking */
  trackProgress?: boolean;
  /** Validation rules */
  validation?: FileUploadValidation;
}

/**
 * File upload validation rules
 */
export interface FileUploadValidation {
  /** Check file extension */
  validateExtension?: boolean;
  /** Check MIME type */
  validateMimeType?: boolean;
  /** Check file content */
  validateContent?: boolean;
  /** Maximum file size */
  maxSize?: number;
  /** Minimum file size */
  minSize?: number;
  /** Custom validation function */
  customValidator?: (file: File) => Promise<string | null>;
}

/**
 * File upload state interface
 */
export interface FileUploadState extends LoadingState {
  /** Selected file */
  file?: File;
  /** Upload progress (0-100) */
  progress?: number;
  /** File content */
  content?: string;
  /** File metadata */
  metadata?: FileMetadata;
  /** Upload result */
  result?: FileUploadResult;
}

/**
 * File metadata interface
 */
export interface FileMetadata {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Last modified date */
  lastModified: number;
  /** File extension */
  extension?: string;
  /** Detected encoding */
  encoding?: string;
  /** Content hash */
  hash?: string;
}

/**
 * File upload result interface
 */
export interface FileUploadResult {
  /** Upload success status */
  success: boolean;
  /** Result message */
  message?: string;
  /** Error details */
  error?: string;
  /** Uploaded file path */
  path?: string;
  /** Upload timestamp */
  timestamp: Date;
}

// =============================================================================
// GITHUB INTEGRATION INTERFACES
// =============================================================================

/**
 * GitHub integration configuration
 */
export interface GitHubIntegrationConfig {
  /** GitHub API base URL */
  apiBaseUrl?: string;
  /** Default repository owner */
  defaultOwner?: string;
  /** Default repository name */
  defaultRepo?: string;
  /** Default branch */
  defaultBranch?: string;
  /** Authentication configuration */
  auth?: GitHubAuthConfig;
  /** File filters */
  fileFilters?: GitHubFileFilter[];
}

/**
 * GitHub authentication configuration
 */
export interface GitHubAuthConfig {
  /** Personal access token */
  token?: string;
  /** OAuth app configuration */
  oauth?: {
    clientId: string;
    clientSecret?: string;
    redirectUri?: string;
  };
}

/**
 * GitHub file filter configuration
 */
export interface GitHubFileFilter {
  /** File extension pattern */
  extension?: string;
  /** File name pattern */
  namePattern?: RegExp;
  /** Path pattern */
  pathPattern?: RegExp;
  /** Include/exclude filter */
  include: boolean;
}

/**
 * GitHub file metadata from API
 */
export interface GitHubFileMetadata {
  /** File name */
  name: string;
  /** File path in repository */
  path: string;
  /** File SHA hash */
  sha: string;
  /** File size in bytes */
  size: number;
  /** Download URL */
  download_url: string;
  /** Git URL */
  git_url: string;
  /** HTML URL */
  html_url: string;
  /** File type */
  type: 'file' | 'dir';
  /** Repository information */
  repository?: {
    owner: string;
    name: string;
    branch: string;
  };
  /** Commit information */
  commit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

/**
 * GitHub import state interface
 */
export interface GitHubImportState extends LoadingState {
  /** Dialog open state */
  dialogOpen: boolean;
  /** Repository information */
  repository?: {
    owner: string;
    name: string;
    branch: string;
  };
  /** Available files */
  files?: GitHubFileMetadata[];
  /** Selected file */
  selectedFile?: GitHubFileMetadata;
  /** File content */
  content?: string;
  /** Import result */
  result?: GitHubImportResult;
}

/**
 * GitHub import result interface
 */
export interface GitHubImportResult {
  /** Import success status */
  success: boolean;
  /** Result message */
  message?: string;
  /** Error details */
  error?: string;
  /** Imported content */
  content?: string;
  /** File metadata */
  metadata?: GitHubFileMetadata;
  /** Import timestamp */
  timestamp: Date;
}

// =============================================================================
// CACHE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Cache configuration for script management
 */
export interface CacheConfig {
  /** Enable cache operations */
  enabled?: boolean;
  /** Cache key prefix */
  keyPrefix?: string;
  /** Default TTL in seconds */
  defaultTtl?: number;
  /** Cache storage backend */
  storage?: CacheStorageType;
  /** Cache invalidation rules */
  invalidation?: CacheInvalidationConfig;
}

/**
 * Cache storage types
 */
export type CacheStorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB' | 'server';

/**
 * Cache invalidation configuration
 */
export interface CacheInvalidationConfig {
  /** Automatic invalidation on content change */
  invalidateOnChange?: boolean;
  /** Invalidation patterns */
  patterns?: string[];
  /** TTL-based invalidation */
  ttlBased?: boolean;
  /** Manual invalidation triggers */
  manualTriggers?: CacheInvalidationTrigger[];
}

/**
 * Cache invalidation triggers
 */
export type CacheInvalidationTrigger = 'content_change' | 'storage_change' | 'service_change' | 'manual';

/**
 * Cache operation types
 */
export type CacheOperation = 'get' | 'set' | 'delete' | 'clear' | 'viewLatest' | 'deleteCache';

/**
 * Cache operation result interface
 */
export interface CacheOperationResult {
  /** Operation success status */
  success: boolean;
  /** Operation type */
  operation: CacheOperation;
  /** Result data */
  data?: any;
  /** Error message */
  error?: string;
  /** Cache key affected */
  key?: string;
  /** Operation timestamp */
  timestamp: Date;
}

/**
 * Cache content interface
 */
export interface CacheContent {
  /** Content value */
  content: string;
  /** Content metadata */
  metadata?: ScriptMetadata;
  /** Cache timestamp */
  cachedAt: Date;
  /** Cache expiry */
  expiresAt?: Date;
  /** Content hash for validation */
  hash?: string;
}

// =============================================================================
// SCRIPT METADATA INTERFACES
// =============================================================================

/**
 * Script metadata interface
 */
export interface ScriptMetadata {
  /** Script name/title */
  name?: string;
  /** Script description */
  description?: string;
  /** Script language */
  language?: ScriptLanguage;
  /** Script version */
  version?: string;
  /** Author information */
  author?: string;
  /** Creation date */
  createdAt?: Date;
  /** Last modification date */
  modifiedAt?: Date;
  /** File size in bytes */
  size?: number;
  /** Line count */
  lineCount?: number;
  /** Character count */
  characterCount?: number;
  /** Storage information */
  storage?: {
    serviceId?: string;
    path?: string;
    url?: string;
  };
  /** Tags */
  tags?: string[];
  /** Custom properties */
  properties?: Record<string, any>;
}

// =============================================================================
// FORM VALIDATION SCHEMAS (ZOD)
// =============================================================================

/**
 * Zod schema for script editor form validation
 * Provides runtime type checking and form validation integration
 */
export const ScriptEditorFormSchema = z.object({
  /** Script content */
  content: z.string().min(1, 'Script content is required'),
  
  /** Storage service ID */
  storageServiceId: z.string().optional(),
  
  /** Storage path - required when storage service is selected */
  storagePath: z.string().optional(),
  
  /** Script language */
  language: z.enum([
    'javascript', 'typescript', 'python', 'php', 'json', 
    'yaml', 'xml', 'html', 'css', 'sql', 'markdown', 'text'
  ]).optional(),
  
  /** Script metadata */
  metadata: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
}).refine(
  (data) => {
    // Storage path is required when storage service is selected
    if (data.storageServiceId && !data.storagePath) {
      return false;
    }
    return true;
  },
  {
    message: "Storage path is required when a storage service is selected",
    path: ["storagePath"],
  }
);

/**
 * Inferred TypeScript type from Zod schema
 */
export type ScriptEditorFormData = z.infer<typeof ScriptEditorFormSchema>;

/**
 * Zod schema for file upload validation
 */
export const FileUploadSchema = z.object({
  /** File object */
  file: z.instanceof(File, { message: 'Valid file is required' }),
  
  /** File size validation */
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  
  /** File type validation */
  type: z.string().refine(
    (type) => [
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
    ].includes(type),
    { message: 'Unsupported file type' }
  ),
});

/**
 * Inferred TypeScript type for file upload
 */
export type FileUploadData = z.infer<typeof FileUploadSchema>;

/**
 * Zod schema for GitHub import validation
 */
export const GitHubImportSchema = z.object({
  /** Repository owner */
  owner: z.string().min(1, 'Repository owner is required'),
  
  /** Repository name */
  repo: z.string().min(1, 'Repository name is required'),
  
  /** Branch name */
  branch: z.string().default('main'),
  
  /** File path */
  path: z.string().min(1, 'File path is required'),
});

/**
 * Inferred TypeScript type for GitHub import
 */
export type GitHubImportData = z.infer<typeof GitHubImportSchema>;

// =============================================================================
// ERROR HANDLING AND STATE INTERFACES
// =============================================================================

/**
 * Script editor error types
 */
export type ScriptEditorError = 
  | 'validation_error'
  | 'file_upload_error'
  | 'github_import_error'
  | 'cache_operation_error'
  | 'storage_service_error'
  | 'editor_error'
  | 'network_error'
  | 'authentication_error'
  | 'permission_error'
  | 'unknown_error';

/**
 * Error state interface for script editor
 */
export interface ScriptEditorErrorState {
  /** Error type */
  type: ScriptEditorError;
  /** Error message */
  message: string;
  /** Error details */
  details?: string;
  /** Error code */
  code?: string | number;
  /** Error timestamp */
  timestamp: Date;
  /** Recovery suggestions */
  recovery?: string[];
  /** Is error recoverable */
  recoverable: boolean;
}

/**
 * Loading state interface for async operations
 */
export interface ScriptEditorLoadingState extends LoadingState {
  /** Current operation */
  operation?: 'loading_services' | 'uploading_file' | 'importing_github' | 'cache_operation' | 'saving_content';
  /** Operation details */
  operationDetails?: string;
  /** Can cancel operation */
  cancellable?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
}

/**
 * Validation state interface for form fields
 */
export interface ScriptEditorValidationState extends ValidationState {
  /** Field-specific validation states */
  fields: {
    content: ValidationState;
    storageServiceId: ValidationState;
    storagePath: ValidationState;
    language: ValidationState;
    metadata: ValidationState;
  };
  /** Real-time validation enabled */
  realTimeValidation: boolean;
  /** Validation debounce time in ms */
  debounceTime: number;
}

// =============================================================================
// HOOK INTERFACES
// =============================================================================

/**
 * Return type for useScriptEditor hook
 */
export interface UseScriptEditorReturn {
  /** Form control instance */
  form: UseFormReturn<ScriptEditorFormData>;
  
  /** Storage services state */
  storageServices: {
    data: StorageService[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
  };
  
  /** File upload state */
  fileUpload: FileUploadState & {
    uploadFile: (file: File) => Promise<void>;
    clearFile: () => void;
  };
  
  /** GitHub import state */
  githubImport: GitHubImportState & {
    openDialog: () => void;
    closeDialog: () => void;
    importFile: (metadata: GitHubFileMetadata) => Promise<void>;
  };
  
  /** Cache operations */
  cache: {
    viewLatest: () => Promise<void>;
    deleteCache: (key?: string) => Promise<void>;
    loading: boolean;
    error: string | null;
  };
  
  /** Validation state */
  validation: ScriptEditorValidationState;
  
  /** Error state */
  error: ScriptEditorErrorState | null;
  
  /** Loading state */
  loading: ScriptEditorLoadingState;
  
  /** Utility functions */
  utils: {
    resetForm: () => void;
    saveContent: (content: string) => Promise<void>;
    validateContent: (content: string) => Promise<boolean>;
    getContentMetadata: (content: string) => ScriptMetadata;
  };
}

/**
 * Configuration options for useScriptEditor hook
 */
export interface UseScriptEditorConfig {
  /** Default form values */
  defaultValues?: Partial<ScriptEditorFormData>;
  /** Validation configuration */
  validation?: {
    mode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
    reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
    debounceTime?: number;
  };
  /** Storage configuration */
  storage?: StorageServiceConfig;
  /** File upload configuration */
  fileUpload?: FileUploadConfig;
  /** GitHub configuration */
  github?: GitHubIntegrationConfig;
  /** Cache configuration */
  cache?: CacheConfig;
  /** Event handlers */
  onContentChange?: (content: string) => void;
  onStorageServiceChange?: (serviceId: string | null) => void;
  onError?: (error: ScriptEditorErrorState) => void;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Response success status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message */
  error?: string;
  /** Response metadata */
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
  };
}

/**
 * Generic list response format (DreamFactory compatible)
 */
export interface GenericListResponse<T = any> {
  /** Response data array */
  resource: T[];
  /** Response metadata */
  meta?: {
    count?: number;
    offset?: number;
    limit?: number;
    total?: number;
  };
}

/**
 * Event handler types for script editor
 */
export interface ScriptEditorEventHandlers {
  onContentChange?: (content: string, metadata?: ScriptMetadata) => void;
  onContentSave?: (content: string, metadata?: ScriptMetadata) => Promise<void>;
  onFileUpload?: (file: File, content: string) => Promise<void>;
  onGitHubImport?: (content: string, metadata: GitHubFileMetadata) => Promise<void>;
  onCacheOperation?: (operation: CacheOperation, result: CacheOperationResult) => void;
  onStorageServiceChange?: (serviceId: string | null, service?: StorageService) => void;
  onStoragePathChange?: (path: string, valid: boolean) => void;
  onLanguageChange?: (language: ScriptLanguage) => void;
  onThemeChange?: (theme: EditorTheme) => void;
  onValidationChange?: (state: ScriptEditorValidationState) => void;
  onError?: (error: ScriptEditorErrorState) => void;
  onLoadingChange?: (loading: ScriptEditorLoadingState) => void;
}

/**
 * Theme-aware prop types for script editor components
 */
export interface ScriptEditorThemeProps {
  /** Component variant */
  variant?: 'default' | 'compact' | 'expanded';
  /** Color scheme */
  colorScheme?: 'light' | 'dark' | 'auto';
  /** Border style */
  bordered?: boolean;
  /** Shadow style */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  /** Corner radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Background style */
  background?: 'default' | 'muted' | 'accent' | 'transparent';
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Re-export common types for convenience
 */
export type {
  BaseComponentProps,
  FormComponentProps,
  ThemeProps,
  AccessibilityProps,
  LoadingState,
  ValidationState
} from '../../../types/ui';

/**
 * Default export containing all main interfaces
 */
export default {
  ScriptEditorProps,
  StorageService,
  FileUploadState,
  GitHubImportState,
  CacheConfig,
  ScriptMetadata,
  UseScriptEditorReturn,
  UseScriptEditorConfig,
  ScriptEditorFormSchema,
  FileUploadSchema,
  GitHubImportSchema,
} as const;