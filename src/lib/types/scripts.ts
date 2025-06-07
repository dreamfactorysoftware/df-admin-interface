/**
 * Script Management Types
 * 
 * Comprehensive type definitions for script management, GitHub integration, and editor
 * functionality. Maintains backward compatibility with existing API contracts while
 * enabling modern React component patterns and Next.js integration.
 * 
 * Features:
 * - Preserved ScriptObject interface for API compatibility
 * - Enhanced GitHub integration with type-safe patterns
 * - React Hook Form compatible interfaces
 * - TanStack React Query and SWR integration support
 * - Modern TypeScript patterns with strict type safety
 * - Next.js API route compatibility
 * - Ace Editor integration for React components
 */

import { ReactNode } from 'react';
import { UseFormReturn, FieldValues, Path } from 'react-hook-form';
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

// ============================================================================
// Core Script Management Types
// ============================================================================

/**
 * Core script object interface maintaining API compatibility
 * Used for script CRUD operations and backend communication
 */
export interface ScriptObject {
  /** Unique script identifier */
  name: string;
  /** Script language/type (nodejs, php, python, etc.) */
  type: string;
  /** Script source code content */
  content: string;
  /** Whether script is active/enabled */
  isActive: boolean;
  /** Whether script allows event modification */
  allowEventModification: boolean;
  /** Optional storage service identifier for file-based scripts */
  storageServiceId?: number;
  /** SCM repository URL for version control integration */
  scmRepository?: string;
  /** SCM branch or tag reference */
  scmReference?: string;
  /** Storage file path for file-based scripts */
  storagePath?: string;
  /** Additional script configuration parameters */
  config?: Record<string, any>;
  /** User ID who created the script */
  createdById?: number;
  /** Script creation timestamp */
  createdDate?: string;
  /** User ID who last modified the script */
  lastModifiedById?: number;
  /** Last modification timestamp */
  lastModifiedDate?: string;
}

/**
 * Script creation/update payload for API operations
 * Omits system-generated fields for create/update operations
 */
export type ScriptPayload = Omit<
  ScriptObject,
  'createdById' | 'createdDate' | 'lastModifiedById' | 'lastModifiedDate'
>;

/**
 * Minimal script information for list displays
 */
export interface ScriptSummary {
  name: string;
  type: string;
  isActive: boolean;
  lastModifiedDate?: string;
  storageServiceId?: number;
}

// ============================================================================
// GitHub Integration Types
// ============================================================================

/**
 * GitHub file object from GitHub API (snake_case format)
 * Preserves GitHub API response structure for compatibility
 */
export interface GithubFileObject {
  /** Base64 encoded file content */
  content: string;
  /** Direct download URL */
  download_url: string;
  /** Content encoding (typically 'base64') */
  encoding: string;
  /** Git object URL */
  git_url: string;
  /** GitHub web interface URL */
  html_url: string;
  /** File name */
  name: string;
  /** Full file path in repository */
  path: string;
  /** Git SHA hash */
  sha: string;
  /** File size in bytes */
  size: number;
  /** File type (file/dir) */
  type: string;
  /** GitHub API URL */
  url: string;
  /** GitHub API link references */
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

/**
 * GitHub repository information for script imports
 */
export interface GithubRepository {
  /** Repository owner/organization */
  owner: string;
  /** Repository name */
  repo: string;
  /** Branch or tag reference */
  ref?: string;
  /** Directory path within repository */
  path?: string;
}

/**
 * GitHub authentication credentials for private repositories
 */
export interface GithubCredentials {
  /** GitHub username */
  username: string;
  /** Personal access token or password */
  token: string;
}

/**
 * GitHub import configuration
 */
export interface GithubImportConfig extends GithubRepository {
  /** Authentication credentials for private repos */
  credentials?: GithubCredentials;
  /** Filter files by extension */
  fileExtensions?: string[];
  /** Maximum file size to import (bytes) */
  maxFileSize?: number;
}

// ============================================================================
// Editor Integration Types
// ============================================================================

/**
 * Ace Editor mode enumeration for syntax highlighting
 * Supports all major scripting languages used in DreamFactory
 */
export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  JAVASCRIPT = 'javascript',
}

/**
 * Editor configuration for React Ace Editor component
 */
export interface EditorConfig {
  /** Syntax highlighting mode */
  mode: AceEditorMode;
  /** Editor theme (light/dark) */
  theme?: 'github' | 'monokai' | 'tomorrow' | 'twilight';
  /** Font size in pixels */
  fontSize?: number;
  /** Tab size in spaces */
  tabSize?: number;
  /** Show line numbers */
  showGutter?: boolean;
  /** Show print margin */
  showPrintMargin?: boolean;
  /** Highlight active line */
  highlightActiveLine?: boolean;
  /** Enable code folding */
  enableFolding?: boolean;
  /** Enable auto-completion */
  enableAutoComplete?: boolean;
  /** Maximum lines before scrolling */
  maxLines?: number;
  /** Minimum lines */
  minLines?: number;
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * Script language configuration
 */
export interface ScriptLanguage {
  /** Display label */
  label: string;
  /** Language identifier */
  value: AceEditorMode;
  /** Default file extension */
  extension: string;
  /** Default template content */
  template?: string;
  /** Validation patterns */
  validation?: {
    /** Required imports/dependencies */
    requiredImports?: string[];
    /** Forbidden patterns */
    forbiddenPatterns?: RegExp[];
  };
}

// ============================================================================
// Event System Types
// ============================================================================

/**
 * Script event configuration
 */
export interface ScriptEvent {
  /** Event name/identifier */
  name: string;
  /** API endpoints that trigger this event */
  endpoints: string[];
  /** Additional event parameters */
  [key: string]: any;
}

/**
 * Script event response from API
 * Represents available events grouped by service/resource
 */
export interface ScriptEventResponse {
  [serviceName: string]: {
    [resourceName: string]: {
      /** Event type */
      type: string;
      /** Available endpoints */
      endpoints: string[];
      /** Optional parameters for endpoints */
      parameter?: Record<string, string[]>;
    };
  };
}

/**
 * Processed event structure for React components
 */
export interface ProcessedScriptEvent {
  /** Service name */
  service: string;
  /** Resource name */
  resource: string;
  /** Event type */
  type: string;
  /** Full endpoint paths */
  endpoints: string[];
  /** Available parameters */
  parameters?: Record<string, string[]>;
  /** Display label */
  label: string;
  /** Event description */
  description?: string;
}

// ============================================================================
// React Component Integration Types
// ============================================================================

/**
 * Props for script editor React component
 */
export interface ScriptEditorProps {
  /** Current script content */
  value?: string;
  /** Script language/mode */
  language: AceEditorMode;
  /** Editor configuration */
  config?: EditorConfig;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Props for GitHub import dialog component
 */
export interface GithubImportDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Import success handler */
  onImport: (files: GithubFileObject[]) => void;
  /** Default import configuration */
  defaultConfig?: Partial<GithubImportConfig>;
  /** Available file extensions */
  allowedExtensions?: string[];
  /** Maximum files to import */
  maxFiles?: number;
}

/**
 * Props for script form component using React Hook Form
 */
export interface ScriptFormProps<T extends FieldValues = ScriptPayload> {
  /** Form instance from useForm hook */
  form: UseFormReturn<T>;
  /** Available script languages */
  languages: ScriptLanguage[];
  /** Available storage services */
  storageServices?: Array<{ id: number; name: string; type: string }>;
  /** Available events for event script configuration */
  events?: ProcessedScriptEvent[];
  /** Form submission handler */
  onSubmit: (data: T) => void;
  /** Loading state */
  loading?: boolean;
  /** Initial values */
  defaultValues?: Partial<T>;
  /** Form mode (create/edit) */
  mode?: 'create' | 'edit';
  /** Custom validation schema */
  validationSchema?: any;
}

/**
 * Props for script list component
 */
export interface ScriptListProps {
  /** Script data from API */
  scripts: ScriptSummary[];
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Selection handler */
  onSelect?: (script: ScriptSummary) => void;
  /** Edit handler */
  onEdit?: (script: ScriptSummary) => void;
  /** Delete handler */
  onDelete?: (script: ScriptSummary) => void;
  /** Create new script handler */
  onCreate?: () => void;
  /** Search/filter functionality */
  onSearch?: (query: string) => void;
  /** Current search query */
  searchQuery?: string;
  /** Pagination configuration */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

// ============================================================================
// React Query Integration Types
// ============================================================================

/**
 * React Query hook return type for script operations
 */
export interface UseScriptsQuery extends UseQueryResult<ScriptObject[], Error> {
  /** Refetch scripts data */
  refetch: () => Promise<any>;
  /** Current data or empty array */
  scripts: ScriptObject[];
}

/**
 * React Query mutation for script operations
 */
export interface UseScriptMutation extends UseMutationResult<
  ScriptObject,
  Error,
  ScriptPayload,
  unknown
> {
  /** Create new script */
  createScript: (script: ScriptPayload) => Promise<ScriptObject>;
  /** Update existing script */
  updateScript: (name: string, script: ScriptPayload) => Promise<ScriptObject>;
  /** Delete script */
  deleteScript: (name: string) => Promise<void>;
}

/**
 * GitHub import mutation result
 */
export interface UseGithubImportMutation extends UseMutationResult<
  GithubFileObject[],
  Error,
  GithubImportConfig,
  unknown
> {
  /** Import files from GitHub */
  importFromGithub: (config: GithubImportConfig) => Promise<GithubFileObject[]>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Script validation result
 */
export interface ScriptValidationResult {
  /** Whether script is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Warnings */
  warnings: string[];
  /** Syntax check result */
  syntax?: {
    isValid: boolean;
    line?: number;
    column?: number;
    message?: string;
  };
}

/**
 * Script execution context for testing
 */
export interface ScriptExecutionContext {
  /** Request object */
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  /** Response object */
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: any;
  };
  /** Event data */
  event?: {
    name: string;
    data: any;
  };
  /** Platform information */
  platform?: {
    version: string;
    config: Record<string, any>;
  };
}

/**
 * Script test result
 */
export interface ScriptTestResult {
  /** Test success status */
  success: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Script output */
  output?: any;
  /** Error message if failed */
  error?: string;
  /** Console logs */
  logs: string[];
  /** Performance metrics */
  metrics?: {
    memoryUsage: number;
    cpuTime: number;
  };
}

// ============================================================================
// Next.js API Route Types
// ============================================================================

/**
 * API request type for script operations
 */
export interface ScriptApiRequest {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Script identifier */
  name?: string;
  /** Request body */
  body?: ScriptPayload;
  /** Query parameters */
  query?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    active?: boolean;
  };
}

/**
 * API response type for script operations
 */
export interface ScriptApiResponse<T = any> {
  /** Response status */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message */
  error?: string;
  /** Additional metadata */
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Default script languages configuration
 */
export const DEFAULT_SCRIPT_LANGUAGES: ScriptLanguage[] = [
  {
    label: 'Node.js',
    value: AceEditorMode.NODEJS,
    extension: 'js',
    template: '// Node.js script\nconst event = platform.api.event;\n\n// Your code here\n',
  },
  {
    label: 'PHP',
    value: AceEditorMode.PHP,
    extension: 'php',
    template: '<?php\n// PHP script\n$event = $platform["api"]["event"];\n\n// Your code here\n',
  },
  {
    label: 'Python',
    value: AceEditorMode.PYTHON,
    extension: 'py',
    template: '# Python script\nevent = platform.api.event\n\n# Your code here\n',
  },
  {
    label: 'Python 3',
    value: AceEditorMode.PYTHON3,
    extension: 'py',
    template: '# Python 3 script\nevent = platform.api.event\n\n# Your code here\n',
  },
];

/**
 * Default editor configuration
 */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  mode: AceEditorMode.NODEJS,
  theme: 'github',
  fontSize: 14,
  tabSize: 2,
  showGutter: true,
  showPrintMargin: false,
  highlightActiveLine: true,
  enableFolding: true,
  enableAutoComplete: true,
  maxLines: Infinity,
  minLines: 10,
  readOnly: false,
};

/**
 * File size limits for different operations
 */
export const FILE_SIZE_LIMITS = {
  /** Maximum script content size (1MB) */
  SCRIPT_CONTENT: 1024 * 1024,
  /** Maximum GitHub import file size (512KB) */
  GITHUB_IMPORT: 512 * 1024,
  /** Maximum total import size (5MB) */
  TOTAL_IMPORT: 5 * 1024 * 1024,
} as const;

/**
 * Script validation patterns
 */
export const VALIDATION_PATTERNS = {
  /** Script name pattern */
  SCRIPT_NAME: /^[a-zA-Z0-9_-]+$/,
  /** File path pattern */
  FILE_PATH: /^[^<>:"|?*\x00-\x1f]*$/,
  /** GitHub URL pattern */
  GITHUB_URL: /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/,
} as const;

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if an object is a valid ScriptObject
 */
export const isScriptObject = (obj: any): obj is ScriptObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.isActive === 'boolean' &&
    typeof obj.allowEventModification === 'boolean'
  );
};

/**
 * Type guard to check if an object is a valid GithubFileObject
 */
export const isGithubFileObject = (obj: any): obj is GithubFileObject => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.content === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.type === 'string' &&
    typeof obj._links === 'object'
  );
};

/**
 * Utility to convert AceEditorMode to file extension
 */
export const getFileExtension = (mode: AceEditorMode): string => {
  const language = DEFAULT_SCRIPT_LANGUAGES.find(lang => lang.value === mode);
  return language?.extension || 'txt';
};

/**
 * Utility to get editor mode from file extension
 */
export const getEditorMode = (extension: string): AceEditorMode => {
  const language = DEFAULT_SCRIPT_LANGUAGES.find(lang => lang.extension === extension);
  return language?.value || AceEditorMode.TEXT;
};

/**
 * Utility to decode GitHub file content
 */
export const decodeGithubContent = (content: string): string => {
  try {
    return atob(content.replace(/\s/g, ''));
  } catch (error) {
    throw new Error('Failed to decode GitHub file content');
  }
};

/**
 * Utility to validate script content size
 */
export const validateScriptSize = (content: string, maxSize: number = FILE_SIZE_LIMITS.SCRIPT_CONTENT): boolean => {
  return new Blob([content]).size <= maxSize;
};