/**
 * Script Editor Component Type Definitions
 * 
 * Comprehensive TypeScript interface definitions for the script editor component system.
 * Provides type safety for React Hook Form integration, DreamFactory service compatibility,
 * storage service configurations, and script content management with Zod validation schemas.
 * 
 * @fileoverview Script editor type definitions with React Hook Form and Zod integration
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { ReactNode, ComponentType, HTMLAttributes } from 'react';
import { FieldPath, FieldValues, UseFormRegister, Control, FieldErrors } from 'react-hook-form';
import { z } from 'zod';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  FormFieldComponent,
  LoadingState,
  DataState 
} from '@/types/ui';
import { 
  ApiResponse, 
  ApiListResponse, 
  ApiResourceResponse,
  HttpMethod 
} from '@/types/api';
import { 
  AceEditorProps, 
  AceEditorMode, 
  AceEditorRef,
  AceEditorConfig 
} from '../ace-editor/types';

// ============================================================================
// SCRIPT CONTENT AND TYPE DEFINITIONS
// ============================================================================

/**
 * Supported script types in DreamFactory
 * Maps to DreamFactory service script configuration options
 */
export enum ScriptType {
  /** Server-side JavaScript (V8 engine) */
  NODEJS = 'nodejs',
  /** PHP scripting */
  PHP = 'php',
  /** Python 2.x (legacy support) */
  PYTHON = 'python',
  /** Python 3.x */
  PYTHON3 = 'python3',
  /** Client-side JavaScript */
  JAVASCRIPT = 'javascript',
  /** JSON configuration */
  JSON = 'json',
  /** YAML configuration */
  YAML = 'yaml',
  /** Plain text */
  TEXT = 'text'
}

/**
 * Script execution context within DreamFactory services
 */
export enum ScriptContext {
  /** Pre-process scripts (before API operation) */
  PRE_PROCESS = 'pre_process',
  /** Post-process scripts (after API operation) */
  POST_PROCESS = 'post_process',
  /** Event handler scripts */
  EVENT_HANDLER = 'event_handler',
  /** Scheduled task scripts */
  SCHEDULER = 'scheduler',
  /** Custom service scripts */
  CUSTOM_SERVICE = 'custom_service',
  /** Workflow automation scripts */
  WORKFLOW = 'workflow'
}

/**
 * Script storage sources for content management
 */
export enum ScriptSource {
  /** Inline script content stored in database */
  INLINE = 'inline',
  /** Script stored in file service */
  FILE = 'file',
  /** Script stored in GitHub repository */
  GITHUB = 'github',
  /** Script stored in external URL */
  URL = 'url',
  /** Local file upload */
  UPLOAD = 'upload'
}

/**
 * Script content metadata with DreamFactory API compatibility
 */
export interface ScriptContent {
  /** Unique identifier for the script */
  id?: string | number;
  /** Script display name */
  name: string;
  /** Script description */
  description?: string;
  /** Script type for syntax highlighting and execution */
  type: ScriptType;
  /** Execution context */
  context: ScriptContext;
  /** Content source type */
  source: ScriptSource;
  /** Script content (for inline scripts) */
  content?: string;
  /** File path (for file/GitHub scripts) */
  path?: string;
  /** GitHub repository URL */
  repository_url?: string;
  /** Git branch/tag reference */
  ref?: string;
  /** External URL (for URL source) */
  url?: string;
  /** Script parameters/configuration */
  config?: Record<string, any>;
  /** Whether script is active */
  is_active?: boolean;
  /** Script version */
  version?: string;
  /** Created timestamp */
  created_date?: string;
  /** Last modified timestamp */
  last_modified_date?: string;
  /** Created by user ID */
  created_by_id?: number;
  /** Last modified by user ID */
  last_modified_by_id?: number;
}

// ============================================================================
// STORAGE SERVICE CONFIGURATION TYPES
// ============================================================================

/**
 * GitHub service configuration for script storage
 * Compatible with DreamFactory GitHub service API
 */
export interface GitHubServiceConfig {
  /** GitHub service name in DreamFactory */
  service_name: string;
  /** Repository owner/organization */
  owner: string;
  /** Repository name */
  repository: string;
  /** Default branch */
  branch?: string;
  /** Base path within repository */
  base_path?: string;
  /** GitHub API token (encrypted) */
  access_token?: string;
  /** Repository visibility */
  private?: boolean;
  /** Enable webhook notifications */
  webhook_enabled?: boolean;
  /** Webhook URL */
  webhook_url?: string;
}

/**
 * File service configuration for script storage
 * Compatible with DreamFactory file service API
 */
export interface FileServiceConfig {
  /** File service name in DreamFactory */
  service_name: string;
  /** Base directory for scripts */
  base_path?: string;
  /** Allowed file extensions */
  allowed_extensions?: string[];
  /** Maximum file size in bytes */
  max_file_size?: number;
  /** Enable versioning */
  versioning_enabled?: boolean;
  /** Backup retention policy */
  backup_retention_days?: number;
}

/**
 * Storage service configuration union type
 */
export type StorageServiceConfig = GitHubServiceConfig | FileServiceConfig;

/**
 * Storage service selection interface
 */
export interface StorageService {
  /** Service identifier */
  id: string;
  /** Service display name */
  name: string;
  /** Service type */
  type: 'github' | 'file' | 'local';
  /** Service configuration */
  config?: StorageServiceConfig;
  /** Whether service is available */
  available: boolean;
  /** Service capabilities */
  capabilities: {
    /** Supports versioning */
    versioning: boolean;
    /** Supports collaborative editing */
    collaboration: boolean;
    /** Supports webhook notifications */
    webhooks: boolean;
    /** Supports backup/restore */
    backup: boolean;
  };
}

// ============================================================================
// FILE OPERATIONS AND CONTENT MANAGEMENT
// ============================================================================

/**
 * File upload progress and state management
 */
export interface FileUploadState extends LoadingState {
  /** Upload progress percentage (0-100) */
  progress: number;
  /** Uploaded file size in bytes */
  uploaded_bytes?: number;
  /** Total file size in bytes */
  total_bytes?: number;
  /** Upload speed in bytes/second */
  upload_speed?: number;
  /** Estimated time remaining in seconds */
  eta?: number;
}

/**
 * File metadata for script content management
 */
export interface ScriptFile {
  /** File identifier */
  id: string;
  /** File name with extension */
  name: string;
  /** File path within storage service */
  path: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mime_type: string;
  /** File extension */
  extension: string;
  /** Script type (derived from extension) */
  script_type: ScriptType;
  /** Last modified timestamp */
  last_modified: string;
  /** File checksum for integrity verification */
  checksum?: string;
  /** File version (for versioned storage) */
  version?: string;
  /** Whether file is encrypted */
  encrypted?: boolean;
  /** File permissions */
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
}

/**
 * File operation result with error handling
 */
export interface FileOperationResult {
  /** Operation success status */
  success: boolean;
  /** File information (on success) */
  file?: ScriptFile;
  /** Error message (on failure) */
  error?: string;
  /** Additional operation metadata */
  metadata?: {
    /** Operation type */
    operation: 'upload' | 'download' | 'delete' | 'rename' | 'move';
    /** Operation timestamp */
    timestamp: string;
    /** User who performed operation */
    user_id?: number;
  };
}

// ============================================================================
// SCRIPT EDITOR COMPONENT PROPS
// ============================================================================

/**
 * Script editor validation configuration
 */
export interface ScriptEditorValidation {
  /** Whether script content is required */
  required?: boolean;
  /** Minimum content length */
  min_length?: number;
  /** Maximum content length */
  max_length?: number;
  /** Custom validation function */
  validate?: (content: string, type: ScriptType) => string | boolean | undefined;
  /** Syntax validation enabled */
  syntax_validation?: boolean;
  /** Real-time validation enabled */
  real_time_validation?: boolean;
}

/**
 * Script editor accessibility configuration
 */
export interface ScriptEditorAccessibility {
  /** Screen reader label */
  'aria-label'?: string;
  /** Element that labels the editor */
  'aria-labelledby'?: string;
  /** Element that describes the editor */
  'aria-describedby'?: string;
  /** Whether editor is required */
  'aria-required'?: boolean;
  /** Whether editor has invalid content */
  'aria-invalid'?: boolean;
  /** Current script type for screen readers */
  'aria-valuetext'?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Skip to content link */
  skipToContentText?: string;
}

/**
 * Script editor theme configuration
 */
export interface ScriptEditorTheme {
  /** Editor theme mode */
  mode: 'light' | 'dark' | 'auto';
  /** Syntax highlighting theme */
  syntax_theme?: string;
  /** Editor background color override */
  background_color?: string;
  /** Text color override */
  text_color?: string;
  /** Custom CSS classes */
  custom_classes?: string[];
}

/**
 * Script editor actions and toolbar configuration
 */
export interface ScriptEditorActions {
  /** Enable save action */
  save?: boolean;
  /** Enable load from file action */
  load?: boolean;
  /** Enable download action */
  download?: boolean;
  /** Enable copy to clipboard action */
  copy?: boolean;
  /** Enable format/prettify action */
  format?: boolean;
  /** Enable syntax validation action */
  validate?: boolean;
  /** Enable fullscreen mode */
  fullscreen?: boolean;
  /** Custom actions */
  custom?: Array<{
    id: string;
    label: string;
    icon?: ComponentType<{ className?: string }>;
    handler: (content: string) => void;
    disabled?: boolean;
  }>;
}

/**
 * React Hook Form integration for script editor
 */
export interface ScriptEditorFormControl<T extends FieldValues = FieldValues> {
  /** Form field name */
  name?: FieldPath<T>;
  /** React Hook Form register function */
  register?: UseFormRegister<T>;
  /** React Hook Form control object */
  control?: Control<T>;
  /** Form validation errors */
  errors?: FieldErrors<T>;
  /** Default value */
  defaultValue?: string;
  /** Form submission trigger */
  trigger?: (name?: FieldPath<T>) => Promise<boolean>;
  /** Get field values */
  getValues?: (name?: FieldPath<T>) => any;
  /** Set field value */
  setValue?: (name: FieldPath<T>, value: any) => void;
}

/**
 * Comprehensive script editor component props interface
 * Integrates ACE editor with React Hook Form and DreamFactory services
 */
export interface ScriptEditorProps<T extends FieldValues = FieldValues> 
  extends BaseComponent, 
    Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'onError'> {
  
  // ============================================================================
  // CORE CONTENT PROPERTIES
  // ============================================================================
  
  /** Script content (controlled component) */
  value?: string;
  /** Default script content (uncontrolled) */
  defaultValue?: string;
  /** Script type for syntax highlighting */
  scriptType?: ScriptType;
  /** Script execution context */
  context?: ScriptContext;
  /** Content source type */
  source?: ScriptSource;
  
  // ============================================================================
  // ACE EDITOR INTEGRATION
  // ============================================================================
  
  /** ACE editor configuration */
  editorConfig?: AceEditorConfig;
  /** ACE editor mode override */
  editorMode?: AceEditorMode;
  /** ACE editor theme */
  editorTheme?: 'light' | 'dark' | 'auto';
  /** ACE editor size */
  editorSize?: ComponentSize;
  /** ACE editor ref for imperative access */
  editorRef?: React.RefObject<AceEditorRef>;
  
  // ============================================================================
  // REACT HOOK FORM INTEGRATION
  // ============================================================================
  
  /** React Hook Form integration */
  form?: ScriptEditorFormControl<T>;
  /** Validation configuration */
  validation?: ScriptEditorValidation;
  
  // ============================================================================
  // STORAGE AND FILE MANAGEMENT
  // ============================================================================
  
  /** Available storage services */
  storageServices?: StorageService[];
  /** Currently selected storage service */
  selectedStorage?: StorageService;
  /** Enable file upload functionality */
  enableFileUpload?: boolean;
  /** Allowed file types for upload */
  allowedFileTypes?: string[];
  /** Maximum file size for upload (bytes) */
  maxFileSize?: number;
  
  // ============================================================================
  // UI CONFIGURATION
  // ============================================================================
  
  /** Component variant */
  variant?: ComponentVariant;
  /** Component size */
  size?: ComponentSize;
  /** Editor theme configuration */
  theme?: ScriptEditorTheme;
  /** Toolbar actions configuration */
  actions?: ScriptEditorActions;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Show minimap */
  showMinimap?: boolean;
  /** Enable word wrap */
  wordWrap?: boolean;
  /** Show invisible characters */
  showInvisibles?: boolean;
  
  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================
  
  /** Accessibility configuration */
  accessibility?: ScriptEditorAccessibility;
  /** Screen reader announcements */
  announceChanges?: boolean;
  /** High contrast mode */
  highContrast?: boolean;
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string | null;
  /** Disabled state */
  disabled?: boolean;
  /** Read-only state */
  readonly?: boolean;
  /** Auto-save configuration */
  autoSave?: {
    enabled: boolean;
    interval: number; // milliseconds
    indicator: boolean;
  };
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /** Content change handler */
  onChange?: (content: string, scriptType?: ScriptType) => void;
  /** Script type change handler */
  onScriptTypeChange?: (type: ScriptType) => void;
  /** Storage service change handler */
  onStorageChange?: (service: StorageService) => void;
  /** File upload handler */
  onFileUpload?: (file: File) => Promise<ScriptFile>;
  /** File save handler */
  onFileSave?: (content: string, filename?: string) => Promise<FileOperationResult>;
  /** File load handler */
  onFileLoad?: (file: ScriptFile) => Promise<string>;
  /** Error handler */
  onError?: (error: string, context?: string) => void;
  /** Focus handler */
  onFocus?: () => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Validation handler */
  onValidate?: (isValid: boolean, errors?: string[]) => void;
  
  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================
  
  /** Enable collaborative editing */
  collaborative?: boolean;
  /** Enable version history */
  versionHistory?: boolean;
  /** Enable syntax checking */
  syntaxChecking?: boolean;
  /** Enable code completion */
  codeCompletion?: boolean;
  /** Enable code folding */
  codeFolding?: boolean;
  /** Enable search and replace */
  searchReplace?: boolean;
  /** Custom keyboard shortcuts */
  keyboardShortcuts?: Record<string, () => void>;
  
  // ============================================================================
  // INTERNATIONALIZATION
  // ============================================================================
  
  /** Locale for editor messages */
  locale?: string;
  /** Custom translations */
  translations?: Record<string, string>;
  
  // ============================================================================
  // PERFORMANCE OPTIMIZATION
  // ============================================================================
  
  /** Debounce interval for change events (ms) */
  debounceInterval?: number;
  /** Virtualization for large content */
  virtualized?: boolean;
  /** Lazy loading configuration */
  lazyLoad?: boolean;
}

// ============================================================================
// SERVICE API TYPES
// ============================================================================

/**
 * DreamFactory script service API response types
 */
export interface ScriptServiceResponse extends ApiResourceResponse<ScriptContent> {}
export interface ScriptListResponse extends ApiListResponse<ScriptContent> {}

/**
 * Script service API endpoints
 */
export interface ScriptServiceAPI {
  /** List all scripts */
  list: (params?: { filter?: string; limit?: number; offset?: number }) => Promise<ScriptListResponse>;
  /** Get script by ID */
  get: (id: string | number) => Promise<ScriptServiceResponse>;
  /** Create new script */
  create: (script: Omit<ScriptContent, 'id'>) => Promise<ScriptServiceResponse>;
  /** Update existing script */
  update: (id: string | number, script: Partial<ScriptContent>) => Promise<ScriptServiceResponse>;
  /** Delete script */
  delete: (id: string | number) => Promise<ApiResponse>;
  /** Execute script */
  execute: (id: string | number, params?: Record<string, any>) => Promise<ApiResponse>;
  /** Validate script syntax */
  validate: (content: string, type: ScriptType) => Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }>;
}

/**
 * Storage service API for file operations
 */
export interface StorageServiceAPI {
  /** Upload file */
  upload: (file: File, path?: string) => Promise<FileOperationResult>;
  /** Download file */
  download: (path: string) => Promise<Blob>;
  /** Delete file */
  delete: (path: string) => Promise<FileOperationResult>;
  /** List files */
  list: (path?: string) => Promise<ScriptFile[]>;
  /** Get file metadata */
  metadata: (path: string) => Promise<ScriptFile>;
  /** Create directory */
  createDirectory: (path: string) => Promise<FileOperationResult>;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for script type validation
 */
export const ScriptTypeSchema = z.nativeEnum(ScriptType);

/**
 * Zod schema for script context validation
 */
export const ScriptContextSchema = z.nativeEnum(ScriptContext);

/**
 * Zod schema for script source validation
 */
export const ScriptSourceSchema = z.nativeEnum(ScriptSource);

/**
 * Zod schema for script content validation
 */
export const ScriptContentSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string().min(1, 'Script name is required').max(255, 'Script name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  type: ScriptTypeSchema,
  context: ScriptContextSchema,
  source: ScriptSourceSchema,
  content: z.string().optional(),
  path: z.string().optional(),
  repository_url: z.string().url('Invalid repository URL').optional(),
  ref: z.string().optional(),
  url: z.string().url('Invalid URL').optional(),
  config: z.record(z.any()).optional(),
  is_active: z.boolean().optional().default(true),
  version: z.string().optional(),
  created_date: z.string().optional(),
  last_modified_date: z.string().optional(),
  created_by_id: z.number().optional(),
  last_modified_by_id: z.number().optional(),
}).refine((data) => {
  // Validate that content source has corresponding data
  switch (data.source) {
    case ScriptSource.INLINE:
      return data.content !== undefined && data.content.length > 0;
    case ScriptSource.FILE:
    case ScriptSource.GITHUB:
      return data.path !== undefined && data.path.length > 0;
    case ScriptSource.URL:
      return data.url !== undefined;
    default:
      return true;
  }
}, {
  message: 'Content source requires corresponding data (content, path, or url)',
});

/**
 * Zod schema for GitHub service configuration
 */
export const GitHubServiceConfigSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  owner: z.string().min(1, 'Repository owner is required'),
  repository: z.string().min(1, 'Repository name is required'),
  branch: z.string().optional().default('main'),
  base_path: z.string().optional(),
  access_token: z.string().optional(),
  private: z.boolean().optional().default(false),
  webhook_enabled: z.boolean().optional().default(false),
  webhook_url: z.string().url('Invalid webhook URL').optional(),
});

/**
 * Zod schema for file service configuration
 */
export const FileServiceConfigSchema = z.object({
  service_name: z.string().min(1, 'Service name is required'),
  base_path: z.string().optional(),
  allowed_extensions: z.array(z.string()).optional().default([
    '.js', '.php', '.py', '.json', '.yaml', '.yml', '.txt'
  ]),
  max_file_size: z.number().positive('File size must be positive').optional().default(10 * 1024 * 1024), // 10MB
  versioning_enabled: z.boolean().optional().default(false),
  backup_retention_days: z.number().positive('Retention days must be positive').optional().default(30),
});

/**
 * Zod schema for storage service configuration
 */
export const StorageServiceSchema = z.object({
  id: z.string().min(1, 'Service ID is required'),
  name: z.string().min(1, 'Service name is required'),
  type: z.enum(['github', 'file', 'local']),
  config: z.union([GitHubServiceConfigSchema, FileServiceConfigSchema]).optional(),
  available: z.boolean(),
  capabilities: z.object({
    versioning: z.boolean(),
    collaboration: z.boolean(),
    webhooks: z.boolean(),
    backup: z.boolean(),
  }),
});

/**
 * Zod schema for script file validation
 */
export const ScriptFileSchema = z.object({
  id: z.string().min(1, 'File ID is required'),
  name: z.string().min(1, 'File name is required'),
  path: z.string().min(1, 'File path is required'),
  size: z.number().nonnegative('File size must be non-negative'),
  mime_type: z.string().min(1, 'MIME type is required'),
  extension: z.string().min(1, 'File extension is required'),
  script_type: ScriptTypeSchema,
  last_modified: z.string(),
  checksum: z.string().optional(),
  version: z.string().optional(),
  encrypted: z.boolean().optional().default(false),
  permissions: z.object({
    read: z.boolean(),
    write: z.boolean(),
    execute: z.boolean(),
  }).optional(),
});

/**
 * Zod schema for file upload validation
 */
export const FileUploadSchema = z.object({
  file: z.instanceof(File, 'Invalid file object'),
  path: z.string().optional(),
  overwrite: z.boolean().optional().default(false),
  validate_type: z.boolean().optional().default(true),
}).refine((data) => {
  // Validate file type if validation is enabled
  if (data.validate_type) {
    const allowedTypes = [
      'text/javascript',
      'application/javascript',
      'text/x-php',
      'text/x-python',
      'application/json',
      'text/yaml',
      'application/x-yaml',
      'text/plain',
    ];
    return allowedTypes.includes(data.file.type) || 
           data.file.name.match(/\.(js|php|py|json|yaml|yml|txt)$/i);
  }
  return true;
}, {
  message: 'Invalid file type for script content',
});

/**
 * Zod schema for script editor form validation
 */
export const ScriptEditorFormSchema = z.object({
  content: z.string().min(1, 'Script content is required'),
  type: ScriptTypeSchema,
  name: z.string().min(1, 'Script name is required').max(255, 'Script name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  context: ScriptContextSchema,
  source: ScriptSourceSchema,
  storage_service: z.string().optional(),
  file_path: z.string().optional(),
  is_active: z.boolean().optional().default(true),
}).refine((data) => {
  // Validate content length based on script type
  const maxLengths = {
    [ScriptType.NODEJS]: 1000000,    // 1MB
    [ScriptType.PHP]: 1000000,       // 1MB
    [ScriptType.PYTHON]: 1000000,    // 1MB
    [ScriptType.PYTHON3]: 1000000,   // 1MB
    [ScriptType.JAVASCRIPT]: 500000, // 500KB
    [ScriptType.JSON]: 100000,       // 100KB
    [ScriptType.YAML]: 100000,       // 100KB
    [ScriptType.TEXT]: 100000,       // 100KB
  };
  
  const maxLength = maxLengths[data.type] || 100000;
  return data.content.length <= maxLength;
}, {
  message: 'Script content exceeds maximum length for this script type',
});

// ============================================================================
// UTILITY TYPES AND TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if storage config is GitHub config
 */
export function isGitHubConfig(config: StorageServiceConfig): config is GitHubServiceConfig {
  return 'owner' in config && 'repository' in config;
}

/**
 * Type guard to check if storage config is file config
 */
export function isFileConfig(config: StorageServiceConfig): config is FileServiceConfig {
  return 'service_name' in config && !('owner' in config);
}

/**
 * Map script type to ACE editor mode
 */
export const scriptTypeToAceMode: Record<ScriptType, AceEditorMode> = {
  [ScriptType.NODEJS]: AceEditorMode.NODEJS,
  [ScriptType.PHP]: AceEditorMode.PHP,
  [ScriptType.PYTHON]: AceEditorMode.PYTHON,
  [ScriptType.PYTHON3]: AceEditorMode.PYTHON3,
  [ScriptType.JAVASCRIPT]: AceEditorMode.JAVASCRIPT,
  [ScriptType.JSON]: AceEditorMode.JSON,
  [ScriptType.YAML]: AceEditorMode.YAML,
  [ScriptType.TEXT]: AceEditorMode.TEXT,
};

/**
 * Map file extension to script type
 */
export const extensionToScriptType: Record<string, ScriptType> = {
  '.js': ScriptType.JAVASCRIPT,
  '.mjs': ScriptType.NODEJS,
  '.php': ScriptType.PHP,
  '.py': ScriptType.PYTHON3,
  '.python': ScriptType.PYTHON,
  '.json': ScriptType.JSON,
  '.yaml': ScriptType.YAML,
  '.yml': ScriptType.YAML,
  '.txt': ScriptType.TEXT,
  '.md': ScriptType.TEXT,
};

/**
 * Default editor configuration for each script type
 */
export const defaultEditorConfig: Record<ScriptType, Partial<AceEditorConfig>> = {
  [ScriptType.NODEJS]: {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    tabSize: 2,
  },
  [ScriptType.PHP]: {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    tabSize: 4,
  },
  [ScriptType.PYTHON]: {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    tabSize: 4,
  },
  [ScriptType.PYTHON3]: {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    tabSize: 4,
  },
  [ScriptType.JAVASCRIPT]: {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    tabSize: 2,
  },
  [ScriptType.JSON]: {
    enableBasicAutocompletion: false,
    enableLiveAutocompletion: false,
    enableSnippets: false,
    tabSize: 2,
    wrap: true,
  },
  [ScriptType.YAML]: {
    enableBasicAutocompletion: false,
    enableLiveAutocompletion: false,
    enableSnippets: false,
    tabSize: 2,
    wrap: true,
  },
  [ScriptType.TEXT]: {
    enableBasicAutocompletion: false,
    enableLiveAutocompletion: false,
    enableSnippets: false,
    tabSize: 4,
    wrap: true,
  },
};

// ============================================================================
// EXPORT TYPES FOR EXTERNAL USAGE
// ============================================================================

export type {
  ScriptContent,
  ScriptFile,
  ScriptServiceAPI,
  StorageServiceAPI,
  FileOperationResult,
  FileUploadState,
  GitHubServiceConfig,
  FileServiceConfig,
  StorageService,
  ScriptEditorValidation,
  ScriptEditorAccessibility,
  ScriptEditorTheme,
  ScriptEditorActions,
  ScriptEditorFormControl,
};

// Export schemas for runtime validation
export {
  ScriptContentSchema,
  GitHubServiceConfigSchema,
  FileServiceConfigSchema,
  StorageServiceSchema,
  ScriptFileSchema,
  FileUploadSchema,
  ScriptEditorFormSchema,
};

// Export enums
export {
  ScriptType,
  ScriptContext,
  ScriptSource,
};

// Export utility functions
export {
  isGitHubConfig,
  isFileConfig,
  scriptTypeToAceMode,
  extensionToScriptType,
  defaultEditorConfig,
};