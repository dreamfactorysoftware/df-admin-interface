/**
 * File GitHub Component Type Definitions
 * 
 * TypeScript 5.8+ interface definitions for the file-github component including
 * component props, file upload events, GitHub import configuration, and storage 
 * service types. Migrated from Angular types to React-specific patterns with proper
 * typing for controlled components, callback functions, and form integration.
 * 
 * @fileoverview React component types for file operations and GitHub integration
 * @version 1.0.0
 */

import { type ReactNode, type RefObject, type ChangeEvent } from 'react';
import { type FieldValues, type Path, type UseFormRegister, type FieldError } from 'react-hook-form';
import { type AccessibilityProps, type ThemeProps, type ValidationState, type LoadingState } from '@/types/ui';

/**
 * ACE Editor mode enumeration for syntax highlighting
 * Reference to ace-editor component modes for consistent typing
 */
export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml', 
  TEXT = 'text',
  JAVASCRIPT = 'javascript',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  XML = 'xml',
  HTML = 'html',
  CSS = 'css',
  SQL = 'sql',
  MARKDOWN = 'markdown'
}

/**
 * File upload event interface for type-safe event handling
 * Replaces Angular event types with React-specific patterns
 */
export interface FileUploadEvent {
  /** Original file object from input element */
  file: File;
  /** File name for display */
  fileName: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** File content as string */
  content: string;
  /** Upload timestamp */
  timestamp: Date;
  /** Optional file metadata */
  metadata?: {
    encoding?: string;
    lastModified?: Date;
    originalPath?: string;
  };
}

/**
 * GitHub import result interface for successful imports
 */
export interface GitHubImportResult {
  /** GitHub repository URL */
  repositoryUrl: string;
  /** Imported file path within repository */
  filePath: string;
  /** File content retrieved from GitHub */
  content: string;
  /** Repository branch or commit hash */
  ref: string;
  /** GitHub API metadata */
  metadata: {
    sha: string;
    size: number;
    downloadUrl: string;
    lastModified: Date;
    author?: {
      name: string;
      email: string;
      date: Date;
    };
  };
  /** Import timestamp */
  importedAt: Date;
}

/**
 * GitHub configuration for repository access
 */
export interface GitHubConfig {
  /** GitHub personal access token */
  accessToken?: string;
  /** Default repository owner/username */
  defaultOwner?: string;
  /** Default repository name */
  defaultRepo?: string;
  /** Default branch */
  defaultBranch?: string;
  /** API base URL for GitHub Enterprise */
  apiBaseUrl?: string;
  /** Rate limiting configuration */
  rateLimit?: {
    requestsPerHour: number;
    retryAfter: number;
  };
}

/**
 * Storage service interface migrated from Angular service types
 * with React Query compatibility for data synchronization
 */
export interface StorageService {
  /** Upload file to storage */
  uploadFile: (file: File, options?: UploadOptions) => Promise<UploadResult>;
  /** Download file from storage */
  downloadFile: (filePath: string) => Promise<Blob>;
  /** Delete file from storage */
  deleteFile: (filePath: string) => Promise<void>;
  /** List files in directory */
  listFiles: (directory?: string) => Promise<FileInfo[]>;
  /** Get file metadata */
  getFileInfo: (filePath: string) => Promise<FileInfo>;
  /** Check if file exists */
  fileExists: (filePath: string) => Promise<boolean>;
}

/**
 * Upload options for storage service
 */
export interface UploadOptions {
  /** Target directory path */
  directory?: string;
  /** Overwrite existing file */
  overwrite?: boolean;
  /** File access permissions */
  permissions?: 'public' | 'private' | 'restricted';
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload result from storage service
 */
export interface UploadResult {
  /** File path in storage */
  filePath: string;
  /** File URL if publicly accessible */
  fileUrl?: string;
  /** File size in bytes */
  size: number;
  /** Content type */
  contentType: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Storage metadata */
  metadata?: Record<string, any>;
}

/**
 * Upload progress information
 */
export interface UploadProgress {
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Upload percentage (0-100) */
  percentage: number;
  /** Upload speed in bytes per second */
  speed?: number;
  /** Estimated time remaining in seconds */
  timeRemaining?: number;
}

/**
 * File information interface
 */
export interface FileInfo {
  /** File name */
  name: string;
  /** Full file path */
  path: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  modifiedAt: Date;
  /** File permissions */
  permissions?: {
    read: boolean;
    write: boolean;
    execute: boolean;
  };
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * File selection mode enumeration
 */
export enum FileSelectionMode {
  SINGLE = 'single',
  MULTIPLE = 'multiple'
}

/**
 * Import source enumeration
 */
export enum ImportSource {
  LOCAL = 'local',
  GITHUB = 'github',
  URL = 'url'
}

/**
 * Main FileGithub component props interface
 * React component props with controlled component pattern replacing Angular @Input decorators
 */
export interface FileGithubProps<T extends FieldValues = FieldValues> 
  extends AccessibilityProps, ThemeProps {
  
  // Core component props
  /** Unique component identifier */
  id?: string;
  /** Component name for form submission */
  name?: string;
  /** Custom CSS classes */
  className?: string;
  /** Component test identifier */
  'data-testid'?: string;
  
  // File handling props
  /** Current file content value */
  value?: string;
  /** Default file content for uncontrolled usage */
  defaultValue?: string;
  /** Accepted file types (MIME types or extensions) */
  accept?: string;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** File selection mode */
  selectionMode?: FileSelectionMode;
  /** Import source options available */
  importSources?: ImportSource[];
  
  // Editor configuration
  /** ACE editor mode for syntax highlighting */
  editorMode?: AceEditorMode;
  /** Editor theme (auto-detected from app theme) */
  editorTheme?: 'light' | 'dark' | 'auto';
  /** Read-only editor state */
  readOnly?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Enable code folding */
  enableCodeFolding?: boolean;
  /** Enable autocomplete */
  enableAutocomplete?: boolean;
  /** Tab size for indentation */
  tabSize?: number;
  /** Use soft tabs (spaces) */
  useSoftTabs?: boolean;
  
  // GitHub integration
  /** GitHub configuration */
  githubConfig?: GitHubConfig;
  /** Enable GitHub import functionality */
  enableGitHubImport?: boolean;
  /** Default GitHub repository URL */
  defaultGitHubRepo?: string;
  /** GitHub file path suggestions */
  githubFileSuggestions?: string[];
  
  // Storage integration
  /** Storage service instance */
  storageService?: StorageService;
  /** Enable file upload to storage */
  enableStorageUpload?: boolean;
  /** Storage upload options */
  storageOptions?: UploadOptions;
  
  // Form integration (React Hook Form)
  /** Form register function for React Hook Form integration */
  register?: UseFormRegister<T>;
  /** Field name for React Hook Form */
  fieldName?: Path<T>;
  /** Validation rules for React Hook Form */
  rules?: Parameters<UseFormRegister<T>>[1];
  /** Field error from React Hook Form */
  error?: FieldError;
  
  // Event handlers - React-specific callback function types
  /** File content change handler */
  onChange?: (content: string) => void;
  /** File selection handler */
  onFileSelect?: (event: FileUploadEvent) => void;
  /** GitHub import success handler */
  onGitHubImport?: (result: GitHubImportResult) => void;
  /** GitHub import error handler */
  onGitHubImportError?: (error: Error) => void;
  /** Storage upload success handler */
  onStorageUpload?: (result: UploadResult) => void;
  /** Storage upload error handler */
  onStorageUploadError?: (error: Error) => void;
  /** Upload progress handler */
  onUploadProgress?: (progress: UploadProgress) => void;
  /** Editor focus handler */
  onEditorFocus?: () => void;
  /** Editor blur handler */
  onEditorBlur?: () => void;
  /** Validation change handler */
  onValidationChange?: (validation: ValidationState) => void;
  
  // State management
  /** Component loading state */
  loading?: boolean;
  /** Component disabled state */
  disabled?: boolean;
  /** Validation state */
  validation?: ValidationState;
  /** Loading state details */
  loadingState?: LoadingState;
  
  // UI customization
  /** Component label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Placeholder text for empty state */
  placeholder?: string;
  /** Error message override */
  errorMessage?: string;
  /** Success message */
  successMessage?: string;
  /** Show file type indicator */
  showFileType?: boolean;
  /** Show file size indicator */
  showFileSize?: boolean;
  /** Show import buttons */
  showImportButtons?: boolean;
  /** Show editor toolbar */
  showEditorToolbar?: boolean;
  /** Compact layout mode */
  compact?: boolean;
  
  // Advanced features
  /** Enable drag and drop */
  enableDragDrop?: boolean;
  /** Enable paste from clipboard */
  enableClipboardPaste?: boolean;
  /** Enable undo/redo */
  enableUndoRedo?: boolean;
  /** Enable search and replace */
  enableSearchReplace?: boolean;
  /** Enable syntax validation */
  enableSyntaxValidation?: boolean;
  /** Custom validation function */
  customValidator?: (content: string) => ValidationState;
  
  // Accessibility props (extended from AccessibilityProps)
  /** Detailed aria-label for screen readers */
  'aria-label'?: string;
  /** Description reference for screen readers */
  'aria-describedby'?: string;
  /** Label reference for screen readers */
  'aria-labelledby'?: string;
  /** Invalid state for screen readers */
  'aria-invalid'?: boolean;
  /** Required state for screen readers */
  'aria-required'?: boolean;
  /** Screen reader announcements */
  announcements?: {
    onFileSelect?: string;
    onGitHubImport?: string;
    onUploadSuccess?: string;
    onError?: string;
  };
  
  // Theme integration (extended from ThemeProps)
  /** Component color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Force light/dark theme */
  forcedTheme?: 'light' | 'dark';
  
  // Advanced editor props
  /** Editor reference for imperative access */
  editorRef?: RefObject<any>;
  /** Enable vim key bindings */
  vimMode?: boolean;
  /** Enable emacs key bindings */
  emacsMode?: boolean;
  /** Custom editor commands */
  customCommands?: Array<{
    name: string;
    bindKey: string;
    exec: (editor: any) => void;
  }>;
  /** Editor completions */
  completions?: Array<{
    caption: string;
    value: string;
    meta?: string;
  }>;
}

/**
 * Component ref interface for imperative access
 */
export interface FileGithubRef {
  /** Focus the editor */
  focus: () => void;
  /** Blur the editor */
  blur: () => void;
  /** Get current editor content */
  getContent: () => string;
  /** Set editor content */
  setContent: (content: string) => void;
  /** Clear editor content */
  clear: () => void;
  /** Trigger file selection */
  selectFile: () => void;
  /** Get editor instance */
  getEditor: () => any;
  /** Insert text at cursor */
  insertText: (text: string) => void;
  /** Get current cursor position */
  getCursorPosition: () => { row: number; column: number };
  /** Set cursor position */
  setCursorPosition: (row: number, column: number) => void;
  /** Validate current content */
  validate: () => ValidationState;
}

/**
 * GitHub API error types
 */
export interface GitHubApiError extends Error {
  status: number;
  statusText: string;
  response?: {
    message: string;
    documentation_url?: string;
  };
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Is file valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** File metadata */
  metadata: {
    encoding: string;
    lineCount: number;
    charCount: number;
    hasUtfBom: boolean;
  };
}

/**
 * Export utility types for component variants and props
 */
export type FileGithubVariant = NonNullable<FileGithubProps['variant']>;
export type FileGithubSize = NonNullable<FileGithubProps['size']>;
export type FileGithubTheme = NonNullable<FileGithubProps['forcedTheme']>;

/**
 * Type guard for checking if upload event is valid
 */
export function isValidFileUploadEvent(event: any): event is FileUploadEvent {
  return (
    event &&
    typeof event === 'object' &&
    event.file instanceof File &&
    typeof event.fileName === 'string' &&
    typeof event.fileSize === 'number' &&
    typeof event.content === 'string'
  );
}

/**
 * Type guard for checking if GitHub import result is valid
 */
export function isValidGitHubImportResult(result: any): result is GitHubImportResult {
  return (
    result &&
    typeof result === 'object' &&
    typeof result.repositoryUrl === 'string' &&
    typeof result.filePath === 'string' &&
    typeof result.content === 'string' &&
    result.metadata &&
    typeof result.metadata.sha === 'string'
  );
}

/**
 * Type guard for checking if storage service implements required interface
 */
export function isValidStorageService(service: any): service is StorageService {
  return (
    service &&
    typeof service === 'object' &&
    typeof service.uploadFile === 'function' &&
    typeof service.downloadFile === 'function' &&
    typeof service.deleteFile === 'function' &&
    typeof service.listFiles === 'function' &&
    typeof service.getFileInfo === 'function' &&
    typeof service.fileExists === 'function'
  );
}

/**
 * Default component props for consistent behavior
 */
export const DEFAULT_FILE_GITHUB_PROPS: Partial<FileGithubProps> = {
  variant: 'default',
  size: 'md',
  editorMode: AceEditorMode.TEXT,
  editorTheme: 'auto',
  selectionMode: FileSelectionMode.SINGLE,
  importSources: [ImportSource.LOCAL, ImportSource.GITHUB],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  showLineNumbers: true,
  enableCodeFolding: true,
  enableAutocomplete: true,
  tabSize: 2,
  useSoftTabs: true,
  enableDragDrop: true,
  enableClipboardPaste: true,
  enableUndoRedo: true,
  enableSearchReplace: true,
  showImportButtons: true,
  showEditorToolbar: true,
  showFileType: true,
  showFileSize: true,
} as const;