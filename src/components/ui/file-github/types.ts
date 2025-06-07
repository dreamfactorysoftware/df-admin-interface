/**
 * TypeScript interface definitions for the file-github component
 * 
 * Provides comprehensive type safety for file operations, GitHub integration,
 * editor mode configurations, and React-specific patterns including controlled
 * components, callback functions, and form integration.
 * 
 * Migrated from Angular service types to React Query compatibility with
 * enhanced TypeScript 5.8+ template literal types and improved inference.
 * 
 * @fileoverview File GitHub component type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { ChangeEvent, FocusEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { FieldPath, FieldValues, UseFormRegister, Control, FieldError } from 'react-hook-form';
import { AceEditorMode, AceEditorTheme } from '../ace-editor/types';
import { ApiResponse, ApiErrorResponse, KeyValuePair } from '@/types/api';

// ============================================================================
// Core File Operation Types
// ============================================================================

/**
 * Supported file types for GitHub import and local file operations
 * Enhanced with TypeScript 5.8+ template literal types for type safety
 */
export type SupportedFileType = 
  | 'text/plain'
  | 'application/json'
  | 'application/x-yaml'
  | 'text/yaml'
  | 'application/javascript'
  | 'text/javascript'
  | 'application/typescript'
  | 'text/x-php'
  | 'text/x-python'
  | 'text/x-python3'
  | 'text/xml'
  | 'application/xml'
  | 'text/html'
  | 'text/css'
  | 'text/markdown';

/**
 * File size constraints and validation parameters
 */
export interface FileSizeConstraints {
  /** Maximum file size in bytes (default: 5MB) */
  maxSize: number;
  /** Minimum file size in bytes (default: 0) */
  minSize: number;
  /** Warning threshold for large files (default: 1MB) */
  warningThreshold: number;
}

/**
 * File metadata for uploaded or imported files
 */
export interface FileMetadata {
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: SupportedFileType;
  /** Last modified timestamp */
  lastModified: number;
  /** File encoding (default: 'utf-8') */
  encoding?: string;
  /** GitHub-specific metadata if imported from GitHub */
  github?: GitHubFileMetadata;
  /** File content preview (first 500 characters) */
  preview?: string;
  /** File hash for content validation */
  hash?: string;
}

/**
 * GitHub-specific file metadata
 */
export interface GitHubFileMetadata {
  /** Repository owner/organization */
  owner: string;
  /** Repository name */
  repo: string;
  /** File path within repository */
  path: string;
  /** Git SHA hash */
  sha: string;
  /** Branch or tag reference */
  ref: string;
  /** File URL on GitHub */
  htmlUrl: string;
  /** Raw file download URL */
  downloadUrl: string;
  /** Commit information */
  commit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

// ============================================================================
// Event and Callback Types
// ============================================================================

/**
 * File upload event data for type-safe event handling
 * Replaces Angular EventEmitter patterns with React callback functions
 */
export interface FileUploadEvent {
  /** Uploaded file with metadata */
  file: File;
  /** File metadata including size and type validation */
  metadata: FileMetadata;
  /** File content as string */
  content: string;
  /** Upload success status */
  success: boolean;
  /** Error information if upload failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** Upload progress percentage (0-100) */
  progress?: number;
  /** Timestamp of upload completion */
  timestamp: number;
}

/**
 * GitHub import result interface for GitHub API integration
 * Enhanced with React Query compatibility for async operations
 */
export interface GitHubImportResult {
  /** Import operation success status */
  success: boolean;
  /** Imported file content */
  content: string;
  /** GitHub file metadata */
  metadata: GitHubFileMetadata;
  /** Error information if import failed */
  error?: ApiErrorResponse;
  /** Import duration in milliseconds */
  duration?: number;
  /** Cached result indicator for React Query */
  fromCache?: boolean;
}

/**
 * File selection event for file picker interactions
 */
export interface FileSelectionEvent {
  /** Selected files array */
  files: File[];
  /** File input element reference */
  target: HTMLInputElement;
  /** Selection method (click, drag, keyboard) */
  method: 'click' | 'drag' | 'keyboard';
  /** Event timestamp */
  timestamp: number;
}

/**
 * File validation result for content and metadata validation
 */
export interface FileValidationResult {
  /** Validation success status */
  valid: boolean;
  /** Validation errors array */
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  /** Validation warnings array */
  warnings: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  /** Suggested fixes for validation issues */
  suggestions?: string[];
}

// ============================================================================
// Storage Service Interface
// ============================================================================

/**
 * Storage service interface migrated from Angular service types
 * Enhanced with React Query compatibility and SWR integration patterns
 */
export interface StorageService {
  /** Upload file to storage backend */
  uploadFile: (
    file: File,
    options?: {
      folder?: string;
      overwrite?: boolean;
      metadata?: Record<string, any>;
    }
  ) => Promise<ApiResponse<{ id: string; url: string }>>;

  /** Download file from storage */
  downloadFile: (
    fileId: string,
    options?: {
      inline?: boolean;
      filename?: string;
    }
  ) => Promise<Blob>;

  /** Get file metadata */
  getFileMetadata: (fileId: string) => Promise<ApiResponse<FileMetadata>>;

  /** Delete file from storage */
  deleteFile: (fileId: string) => Promise<ApiResponse<{ success: boolean }>>;

  /** List files in folder */
  listFiles: (
    folder?: string,
    options?: {
      limit?: number;
      offset?: number;
      filter?: string;
    }
  ) => Promise<ApiResponse<FileMetadata[]>>;

  /** Validate file before upload */
  validateFile: (file: File) => Promise<FileValidationResult>;

  /** Generate signed upload URL */
  generateUploadUrl: (
    filename: string,
    contentType: string
  ) => Promise<ApiResponse<{ uploadUrl: string; fileId: string }>>;
}

// ============================================================================
// GitHub Service Interface
// ============================================================================

/**
 * GitHub service interface for repository file operations
 * Integrates with GitHub API v4 (GraphQL) and v3 (REST) endpoints
 */
export interface GitHubService {
  /** Import file from GitHub repository */
  importFile: (
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ) => Promise<GitHubImportResult>;

  /** Search repositories by name or topic */
  searchRepositories: (
    query: string,
    options?: {
      sort?: 'stars' | 'forks' | 'updated';
      order?: 'asc' | 'desc';
      limit?: number;
    }
  ) => Promise<ApiResponse<Array<{
    id: number;
    name: string;
    fullName: string;
    description: string;
    stars: number;
    language: string;
    updatedAt: string;
  }>>>;

  /** Get repository file tree */
  getFileTree: (
    owner: string,
    repo: string,
    ref?: string,
    recursive?: boolean
  ) => Promise<ApiResponse<Array<{
    path: string;
    type: 'file' | 'directory';
    size?: number;
    sha: string;
  }>>>;

  /** Validate GitHub repository access */
  validateRepository: (
    owner: string,
    repo: string
  ) => Promise<{ accessible: boolean; public: boolean }>;

  /** Get file content with syntax highlighting hints */
  getFileWithLanguage: (
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ) => Promise<GitHubImportResult & { language: string }>;
}

// ============================================================================
// React Component Props and Callbacks
// ============================================================================

/**
 * React-specific callback function types for controlled component behavior
 * Replaces Angular @Output decorators with modern React patterns
 */
export interface FileGithubCallbacks {
  /** Called when file content changes (controlled component) */
  onChange?: (content: string, metadata?: FileMetadata) => void;

  /** Called when file is selected from file picker */
  onFileSelect?: (event: FileSelectionEvent) => void;

  /** Called when file upload completes */
  onFileUpload?: (event: FileUploadEvent) => void;

  /** Called when GitHub import completes */
  onGitHubImport?: (result: GitHubImportResult) => void;

  /** Called when editor mode changes */
  onModeChange?: (mode: AceEditorMode) => void;

  /** Called when editor theme changes */
  onThemeChange?: (theme: AceEditorTheme) => void;

  /** Called when file validation completes */
  onValidation?: (result: FileValidationResult) => void;

  /** Called when component gains focus */
  onFocus?: (event: FocusEvent<HTMLElement>) => void;

  /** Called when component loses focus */
  onBlur?: (event: FocusEvent<HTMLElement>) => void;

  /** Called on keyboard interactions */
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;

  /** Called on error conditions */
  onError?: (error: ApiErrorResponse) => void;

  /** Called when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * React Hook Form integration types for form control
 * Enhanced with TypeScript 5.8+ conditional type patterns
 */
export interface FileGithubFormControl<T extends FieldValues = FieldValues> {
  /** React Hook Form field name */
  name?: FieldPath<T>;

  /** React Hook Form register function */
  register?: UseFormRegister<T>;

  /** React Hook Form control instance */
  control?: Control<T>;

  /** Field validation rules */
  rules?: {
    required?: boolean | string;
    validate?: (value: string) => string | boolean | undefined;
    maxLength?: number | { value: number; message: string };
    minLength?: number | { value: number; message: string };
  };

  /** Default value for the field */
  defaultValue?: string;

  /** Field error from React Hook Form */
  error?: FieldError;

  /** Whether field is touched */
  touched?: boolean;

  /** Whether field is dirty (value changed from default) */
  dirty?: boolean;
}

/**
 * Accessibility props for WCAG 2.1 AA compliance
 * Enhanced with comprehensive screen reader support
 */
export interface FileGithubAccessibilityProps {
  /** Accessible label for screen readers */
  'aria-label'?: string;

  /** ID of element that labels this component */
  'aria-labelledby'?: string;

  /** ID of element that describes this component */
  'aria-describedby'?: string;

  /** Whether file selection is required */
  'aria-required'?: boolean;

  /** Whether component has invalid input */
  'aria-invalid'?: boolean;

  /** Current file information for screen readers */
  'aria-valuetext'?: string;

  /** Role override for the component */
  role?: string;

  /** Tab index for keyboard navigation */
  tabIndex?: number;

  /** Additional ARIA attributes */
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;

  /** Keyboard shortcuts announcement */
  'aria-keyshortcuts'?: string;

  /** Roledescription for complex components */
  'aria-roledescription'?: string;
}

/**
 * Component state and configuration props
 */
export interface FileGithubStateProps {
  /** Whether component is in loading state */
  loading?: boolean;

  /** Whether component is disabled */
  disabled?: boolean;

  /** Whether component is read-only */
  readOnly?: boolean;

  /** Placeholder text when no file is selected */
  placeholder?: string;

  /** Whether to auto-focus on mount */
  autoFocus?: boolean;

  /** Maximum number of files to accept */
  maxFiles?: number;

  /** File size constraints */
  sizeConstraints?: FileSizeConstraints;

  /** Accepted file types */
  acceptedFileTypes?: SupportedFileType[];

  /** Whether to show file preview */
  showPreview?: boolean;

  /** Whether to enable drag and drop */
  enableDragDrop?: boolean;

  /** Whether to show GitHub import option */
  enableGitHubImport?: boolean;

  /** GitHub repository suggestions */
  githubSuggestions?: Array<{
    owner: string;
    repo: string;
    description: string;
  }>;
}

/**
 * Theme and styling props for Tailwind CSS integration
 */
export interface FileGithubThemeProps {
  /** Theme mode (integrates with Tailwind CSS dark mode) */
  theme?: AceEditorTheme;

  /** Component size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';

  /** Border radius variant */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /** Shadow variant */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  /** Whether to show border */
  bordered?: boolean;

  /** Custom CSS classes */
  className?: string;

  /** Inline styles override */
  style?: React.CSSProperties;
}

// ============================================================================
// Main Component Props Interface
// ============================================================================

/**
 * Comprehensive FileGithub component props interface
 * Created for React component props with controlled component pattern
 * replacing Angular @Input decorators with modern React patterns
 */
export interface FileGithubProps<T extends FieldValues = FieldValues>
  extends FileGithubCallbacks,
    FileGithubFormControl<T>,
    FileGithubAccessibilityProps,
    FileGithubStateProps,
    FileGithubThemeProps {
  /** Unique identifier for the component */
  id?: string;

  /** Current file content value (controlled component) */
  value?: string;

  /** Default value for uncontrolled component */
  defaultValue?: string;

  /** Editor syntax highlighting mode */
  mode?: AceEditorMode;

  /** Storage service instance */
  storageService?: StorageService;

  /** GitHub service instance */
  githubService?: GitHubService;

  /** Component container ref */
  containerRef?: RefObject<HTMLDivElement>;

  /** File input element ref */
  fileInputRef?: RefObject<HTMLInputElement>;

  /** Editor element ref */
  editorRef?: RefObject<any>;

  /** Data test ID for testing */
  'data-testid'?: string;

  /** Additional data attributes for testing and tracking */
  [key: `data-${string}`]: any;
}

// ============================================================================
// Component Reference Interface
// ============================================================================

/**
 * FileGithub component imperative handle methods
 * Exposed via useImperativeHandle for parent component access
 */
export interface FileGithubRef {
  /** Get current file content */
  getValue(): string;

  /** Set file content programmatically */
  setValue(content: string, metadata?: FileMetadata): void;

  /** Trigger file picker dialog */
  openFilePicker(): void;

  /** Clear current file content */
  clear(): void;

  /** Validate current file content */
  validate(): Promise<FileValidationResult>;

  /** Focus the component */
  focus(): void;

  /** Blur the component */
  blur(): void;

  /** Get current file metadata */
  getMetadata(): FileMetadata | null;

  /** Import file from GitHub */
  importFromGitHub(owner: string, repo: string, path: string, ref?: string): Promise<GitHubImportResult>;

  /** Upload current content to storage */
  uploadToStorage(filename?: string): Promise<ApiResponse<{ id: string; url: string }>>;

  /** Get editor instance (if using ACE editor) */
  getEditor(): any;

  /** Set editor mode */
  setMode(mode: AceEditorMode): void;

  /** Set editor theme */
  setTheme(theme: AceEditorTheme): void;

  /** Export current content as file */
  exportAsFile(filename?: string, mimeType?: SupportedFileType): void;
}

// ============================================================================
// Utility Types and Template Literals
// ============================================================================

/**
 * GitHub repository URL pattern validation
 * Enhanced with TypeScript 5.8+ template literal types
 */
export type GitHubRepoUrl = `https://github.com/${string}/${string}`;

/**
 * GitHub file path pattern validation
 */
export type GitHubFilePath = `${string}/${'main' | 'master' | 'develop' | string}/${string}`;

/**
 * File extension to MIME type mapping
 */
export type FileExtensionMap = {
  '.txt': 'text/plain';
  '.json': 'application/json';
  '.yaml': 'text/yaml';
  '.yml': 'text/yaml';
  '.js': 'application/javascript';
  '.ts': 'application/typescript';
  '.php': 'text/x-php';
  '.py': 'text/x-python';
  '.xml': 'application/xml';
  '.html': 'text/html';
  '.css': 'text/css';
  '.md': 'text/markdown';
};

/**
 * Editor mode to file extension mapping
 */
export type ModeToExtensionMap = {
  [K in AceEditorMode]: string;
};

/**
 * Component configuration with enhanced TypeScript 5.8+ patterns
 */
export interface FileGithubConfig {
  /** Default file size constraints */
  defaultSizeConstraints: FileSizeConstraints;

  /** Default accepted file types */
  defaultAcceptedTypes: SupportedFileType[];

  /** GitHub API configuration */
  github: {
    /** API base URL */
    apiUrl: string;
    /** Default branch for repository operations */
    defaultBranch: string;
    /** Request timeout in milliseconds */
    timeout: number;
    /** Rate limit configuration */
    rateLimit: {
      requests: number;
      windowMs: number;
    };
  };

  /** Storage configuration */
  storage: {
    /** Default upload folder */
    defaultFolder: string;
    /** Chunk size for large file uploads */
    chunkSize: number;
    /** Maximum concurrent uploads */
    maxConcurrent: number;
  };

  /** Editor configuration */
  editor: {
    /** Default editor mode */
    defaultMode: AceEditorMode;
    /** Default theme */
    defaultTheme: AceEditorTheme;
    /** Auto-detect mode from file extension */
    autoDetectMode: boolean;
  };

  /** Validation configuration */
  validation: {
    /** Enable content validation */
    enableContentValidation: boolean;
    /** Enable size validation */
    enableSizeValidation: boolean;
    /** Enable type validation */
    enableTypeValidation: boolean;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * FileGithub-specific error types
 */
export interface FileGithubError extends ApiErrorResponse {
  error: {
    code: 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE' | 'UPLOAD_FAILED' | 'GITHUB_IMPORT_FAILED' | 'VALIDATION_FAILED' | 'NETWORK_ERROR';
    message: string;
    status_code: number;
    context?: {
      filename?: string;
      fileSize?: number;
      maxSize?: number;
      fileType?: string;
      acceptedTypes?: SupportedFileType[];
      githubRepo?: string;
      githubPath?: string;
      validationErrors?: FileValidationResult;
    };
  };
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Mock data factory for testing
 */
export interface FileGithubTestUtils {
  /** Create mock file object */
  createMockFile: (
    name: string,
    content: string,
    type?: SupportedFileType
  ) => File;

  /** Create mock file metadata */
  createMockMetadata: (overrides?: Partial<FileMetadata>) => FileMetadata;

  /** Create mock GitHub import result */
  createMockGitHubResult: (overrides?: Partial<GitHubImportResult>) => GitHubImportResult;

  /** Create mock storage service */
  createMockStorageService: () => StorageService;

  /** Create mock GitHub service */
  createMockGitHubService: () => GitHubService;
}

// ============================================================================
// Type Exports
// ============================================================================

/**
 * Component type with forwardRef support
 */
export type FileGithubComponent = React.ForwardRefExoticComponent<
  FileGithubProps & React.RefAttributes<FileGithubRef>
>;

/**
 * Export all types for external usage
 */
export type {
  SupportedFileType,
  FileSizeConstraints,
  FileMetadata,
  GitHubFileMetadata,
  FileUploadEvent,
  GitHubImportResult,
  FileSelectionEvent,
  FileValidationResult,
  StorageService,
  GitHubService,
  FileGithubCallbacks,
  FileGithubFormControl,
  FileGithubAccessibilityProps,
  FileGithubStateProps,
  FileGithubThemeProps,
  FileGithubRef,
  FileGithubConfig,
  FileGithubError,
  FileGithubTestUtils,
};

/**
 * Re-export AceEditorMode for convenience
 */
export { AceEditorMode };

/**
 * Default configuration values
 */
export const DEFAULT_FILE_GITHUB_CONFIG: FileGithubConfig = {
  defaultSizeConstraints: {
    maxSize: 5 * 1024 * 1024, // 5MB
    minSize: 0,
    warningThreshold: 1024 * 1024, // 1MB
  },
  defaultAcceptedTypes: [
    'text/plain',
    'application/json',
    'text/yaml',
    'application/javascript',
    'application/typescript',
    'text/x-php',
    'text/x-python',
    'text/markdown',
  ],
  github: {
    apiUrl: 'https://api.github.com',
    defaultBranch: 'main',
    timeout: 30000,
    rateLimit: {
      requests: 5000,
      windowMs: 3600000, // 1 hour
    },
  },
  storage: {
    defaultFolder: 'uploads',
    chunkSize: 1024 * 1024, // 1MB chunks
    maxConcurrent: 3,
  },
  editor: {
    defaultMode: AceEditorMode.TEXT,
    defaultTheme: 'light',
    autoDetectMode: true,
  },
  validation: {
    enableContentValidation: true,
    enableSizeValidation: true,
    enableTypeValidation: true,
  },
};