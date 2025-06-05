/**
 * @fileoverview Comprehensive TypeScript interface definitions for the GitHub scripts import dialog component system
 * @version 1.0.0
 * @since 2024-12-19
 * 
 * Migrated from Angular MAT_DIALOG_DATA injection pattern to React component props architecture.
 * Provides complete type safety for GitHub repository integration, authentication workflows,
 * file validation, and error handling scenarios.
 * 
 * Key Features:
 * - React Hook Form + Zod schema validation integration
 * - GitHub API v3/v4 compatibility with rate limiting awareness
 * - Private repository authentication handling
 * - Comprehensive error boundary integration
 * - WCAG 2.1 AA accessibility compliance
 * - Promise-based dialog resolution pattern
 */

import { z } from 'zod';
import { UseFormReturn, FieldErrors } from 'react-hook-form';
import { ReactNode, RefObject } from 'react';

// =============================================================================
// CORE COMPONENT INTERFACES
// =============================================================================

/**
 * Main props interface for the ScriptsGithubDialog React component.
 * Replaces Angular's MAT_DIALOG_DATA injection pattern with modern React props.
 * 
 * @interface ScriptsGithubDialogProps
 * @since 1.0.0
 */
export interface ScriptsGithubDialogProps {
  /** Whether the dialog is currently open/visible */
  isOpen: boolean;
  
  /** Callback function to handle dialog close events */
  onClose: () => void;
  
  /** Promise-based callback to handle successful script import */
  onSuccess: (scriptData: GitHubScriptContent) => Promise<void>;
  
  /** Error callback for failed import operations */
  onError: (error: GitHubDialogError) => void;
  
  /** Optional initial URL value for the GitHub file input */
  initialUrl?: string;
  
  /** Configuration for file type validation */
  fileConfig?: ScriptFileConfig;
  
  /** Whether to show debug information in development mode */
  showDebugInfo?: boolean;
  
  /** Custom CSS classes for styling customization */
  className?: string;
  
  /** Test ID for automated testing */
  testId?: string;
  
  /** Accessibility configuration */
  ariaConfig?: DialogAriaConfig;
}

/**
 * Configuration interface for dialog accessibility compliance.
 * Ensures WCAG 2.1 AA standards are met.
 * 
 * @interface DialogAriaConfig
 * @since 1.0.0
 */
export interface DialogAriaConfig {
  /** Accessible label for the dialog */
  'aria-label'?: string;
  
  /** ID of element that labels the dialog */
  'aria-labelledby'?: string;
  
  /** ID of element that describes the dialog */
  'aria-describedby'?: string;
  
  /** Whether to trap focus within the dialog */
  trapFocus?: boolean;
  
  /** Element to focus when dialog opens */
  initialFocus?: RefObject<HTMLElement>;
  
  /** Element to focus when dialog closes */
  restoreFocus?: RefObject<HTMLElement>;
}

// =============================================================================
// GITHUB API INTEGRATION TYPES
// =============================================================================

/**
 * GitHub repository metadata interface for API responses.
 * Compatible with GitHub API v3 and v4 repository endpoints.
 * 
 * @interface GitHubRepositoryInfo
 * @since 1.0.0
 */
export interface GitHubRepositoryInfo {
  /** Repository ID from GitHub */
  id: number;
  
  /** Repository name */
  name: string;
  
  /** Repository full name (owner/repo) */
  full_name: string;
  
  /** Repository owner information */
  owner: GitHubUserInfo;
  
  /** Whether the repository is private */
  private: boolean;
  
  /** Repository description */
  description: string | null;
  
  /** Whether the repository is a fork */
  fork: boolean;
  
  /** Repository URL */
  html_url: string;
  
  /** API URL for repository contents */
  contents_url: string;
  
  /** Default branch name */
  default_branch: string;
  
  /** Repository language */
  language: string | null;
  
  /** Repository size in KB */
  size: number;
  
  /** Last update timestamp */
  updated_at: string;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Repository permissions for authenticated user */
  permissions?: GitHubRepositoryPermissions;
}

/**
 * GitHub user/organization information.
 * 
 * @interface GitHubUserInfo
 * @since 1.0.0
 */
export interface GitHubUserInfo {
  /** User ID */
  id: number;
  
  /** Username */
  login: string;
  
  /** User type (User or Organization) */
  type: 'User' | 'Organization';
  
  /** Avatar URL */
  avatar_url: string;
  
  /** Profile URL */
  html_url: string;
}

/**
 * Repository permissions for the authenticated user.
 * 
 * @interface GitHubRepositoryPermissions
 * @since 1.0.0
 */
export interface GitHubRepositoryPermissions {
  /** Can read repository contents */
  pull: boolean;
  
  /** Can push to repository */
  push: boolean;
  
  /** Has admin access */
  admin: boolean;
}

/**
 * GitHub file content response structure.
 * 
 * @interface GitHubFileContent
 * @since 1.0.0
 */
export interface GitHubFileContent {
  /** File name */
  name: string;
  
  /** File path within repository */
  path: string;
  
  /** File SHA hash */
  sha: string;
  
  /** File size in bytes */
  size: number;
  
  /** Download URL for file content */
  download_url: string;
  
  /** File content (base64 encoded for API) */
  content: string;
  
  /** Content encoding type */
  encoding: 'base64' | 'utf-8';
  
  /** File type */
  type: 'file' | 'dir';
  
  /** API URL for this file */
  url: string;
  
  /** HTML URL for file on GitHub */
  html_url: string;
}

/**
 * Processed script content with metadata.
 * 
 * @interface GitHubScriptContent
 * @since 1.0.0
 */
export interface GitHubScriptContent {
  /** Original file name */
  fileName: string;
  
  /** File extension */
  extension: ScriptFileExtension;
  
  /** Decoded file content */
  content: string;
  
  /** Content type/language */
  language: ScriptLanguage;
  
  /** File size in bytes */
  size: number;
  
  /** Repository information */
  repository: Pick<GitHubRepositoryInfo, 'name' | 'full_name' | 'html_url'>;
  
  /** File path within repository */
  path: string;
  
  /** GitHub file URL */
  url: string;
  
  /** Import timestamp */
  importedAt: string;
  
  /** File SHA for version tracking */
  sha: string;
}

// =============================================================================
// AUTHENTICATION & CREDENTIALS
// =============================================================================

/**
 * Authentication credentials for private GitHub repositories.
 * Supports username/password and personal access token authentication.
 * 
 * @interface GitHubAuthCredentials
 * @since 1.0.0
 */
export interface GitHubAuthCredentials {
  /** GitHub username */
  username: string;
  
  /** GitHub password or personal access token */
  password: string;
  
  /** Authentication type */
  authType: 'basic' | 'token';
  
  /** Whether to remember credentials (store in session) */
  rememberCredentials?: boolean;
}

/**
 * Authentication state and metadata.
 * 
 * @interface GitHubAuthState
 * @since 1.0.0
 */
export interface GitHubAuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Authentication method used */
  authMethod: 'public' | 'basic' | 'token' | 'oauth';
  
  /** Authenticated user information */
  user?: GitHubUserInfo;
  
  /** Rate limiting information */
  rateLimit?: GitHubRateLimit;
  
  /** Authentication timestamp */
  authenticatedAt?: string;
  
  /** Whether credentials are stored in session */
  hasStoredCredentials?: boolean;
}

/**
 * GitHub API rate limiting information.
 * 
 * @interface GitHubRateLimit
 * @since 1.0.0
 */
export interface GitHubRateLimit {
  /** Request limit per hour */
  limit: number;
  
  /** Remaining requests */
  remaining: number;
  
  /** Rate limit reset timestamp */
  reset: number;
  
  /** Used requests */
  used: number;
  
  /** Resource type (core, search, etc.) */
  resource: string;
}

// =============================================================================
// FILE VALIDATION & CONFIGURATION
// =============================================================================

/**
 * Supported script file extensions.
 * 
 * @type ScriptFileExtension
 * @since 1.0.0
 */
export type ScriptFileExtension = '.js' | '.py' | '.php' | '.txt' | '.json' | '.md' | '.yml' | '.yaml';

/**
 * Supported programming languages.
 * 
 * @type ScriptLanguage
 * @since 1.0.0
 */
export type ScriptLanguage = 'javascript' | 'python' | 'php' | 'text' | 'json' | 'markdown' | 'yaml';

/**
 * Configuration for script file validation and processing.
 * 
 * @interface ScriptFileConfig
 * @since 1.0.0
 */
export interface ScriptFileConfig {
  /** Allowed file extensions */
  allowedExtensions: ScriptFileExtension[];
  
  /** Maximum file size in bytes */
  maxFileSize: number;
  
  /** Whether to validate file content */
  validateContent: boolean;
  
  /** Custom file validation function */
  customValidator?: (fileName: string, content: string) => ValidationResult;
  
  /** File processing options */
  processingOptions: FileProcessingOptions;
}

/**
 * File processing configuration options.
 * 
 * @interface FileProcessingOptions
 * @since 1.0.0
 */
export interface FileProcessingOptions {
  /** Whether to minify content */
  minify: boolean;
  
  /** Whether to validate syntax */
  validateSyntax: boolean;
  
  /** Content encoding to use */
  encoding: 'utf-8' | 'base64';
  
  /** Whether to preserve original formatting */
  preserveFormatting: boolean;
  
  /** Maximum content length */
  maxContentLength: number;
}

/**
 * File validation result.
 * 
 * @interface ValidationResult
 * @since 1.0.0
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Validation error messages */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Detected file metadata */
  metadata?: FileMetadata;
}

/**
 * File metadata information.
 * 
 * @interface FileMetadata
 * @since 1.0.0
 */
export interface FileMetadata {
  /** Detected language */
  language: ScriptLanguage;
  
  /** File size in bytes */
  size: number;
  
  /** Line count */
  lineCount: number;
  
  /** Character count */
  characterCount: number;
  
  /** Whether file contains binary data */
  isBinary: boolean;
  
  /** File encoding */
  encoding: string;
  
  /** MIME type */
  mimeType: string;
}

// =============================================================================
// FORM VALIDATION & STATE MANAGEMENT
// =============================================================================

/**
 * Form validation schema interface for React Hook Form + Zod integration.
 * 
 * @interface FormValidationSchema
 * @since 1.0.0
 */
export interface FormValidationSchema {
  /** URL validation schema */
  url: z.ZodString;
  
  /** Username validation schema (conditional) */
  username?: z.ZodString;
  
  /** Password validation schema (conditional) */
  password?: z.ZodString;
  
  /** Custom validation rules */
  customRules?: Record<string, z.ZodType>;
}

/**
 * GitHub URL form data interface.
 * 
 * @interface GitHubUrlFormData
 * @since 1.0.0
 */
export interface GitHubUrlFormData {
  /** GitHub file URL */
  url: string;
  
  /** Username for private repositories */
  username?: string;
  
  /** Password/token for private repositories */
  password?: string;
}

/**
 * Form state interface with React Hook Form integration.
 * 
 * @interface GitHubDialogFormState
 * @since 1.0.0
 */
export interface GitHubDialogFormState {
  /** React Hook Form instance */
  form: UseFormReturn<GitHubUrlFormData>;
  
  /** Current form errors */
  errors: FieldErrors<GitHubUrlFormData>;
  
  /** Whether form is currently validating */
  isValidating: boolean;
  
  /** Whether form is valid */
  isValid: boolean;
  
  /** Whether form is dirty (has changes) */
  isDirty: boolean;
  
  /** Whether form has been submitted */
  isSubmitted: boolean;
  
  /** Current form values */
  values: Partial<GitHubUrlFormData>;
}

/**
 * Dialog workflow state enumeration.
 * Tracks the current stage of the import process.
 * 
 * @enum DialogState
 * @since 1.0.0
 */
export enum DialogState {
  /** Initial state, waiting for user input */
  IDLE = 'idle',
  
  /** Validating GitHub URL */
  VALIDATING_URL = 'validating_url',
  
  /** Checking repository privacy */
  CHECKING_PRIVACY = 'checking_privacy',
  
  /** Authenticating with credentials */
  AUTHENTICATING = 'authenticating',
  
  /** Fetching file content */
  FETCHING_CONTENT = 'fetching_content',
  
  /** Processing file content */
  PROCESSING = 'processing',
  
  /** Import completed successfully */
  SUCCESS = 'success',
  
  /** Error occurred during process */
  ERROR = 'error',
  
  /** User cancelled operation */
  CANCELLED = 'cancelled'
}

/**
 * Dialog state context with additional metadata.
 * 
 * @interface DialogStateContext
 * @since 1.0.0
 */
export interface DialogStateContext {
  /** Current dialog state */
  state: DialogState;
  
  /** Previous state */
  previousState?: DialogState;
  
  /** State change timestamp */
  timestamp: string;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Current operation message */
  message?: string;
  
  /** Additional state metadata */
  metadata?: Record<string, unknown>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Generic GitHub API response wrapper.
 * 
 * @interface GitHubApiResponse<T>
 * @template T - Response data type
 * @since 1.0.0
 */
export interface GitHubApiResponse<T = unknown> {
  /** Response data */
  data: T;
  
  /** HTTP status code */
  status: number;
  
  /** Response headers */
  headers: Record<string, string>;
  
  /** Request URL */
  url: string;
  
  /** Whether request was successful */
  ok: boolean;
  
  /** Response timestamp */
  timestamp: string;
  
  /** Rate limit information */
  rateLimit?: GitHubRateLimit;
}

/**
 * Repository information API response.
 * 
 * @type GitHubRepositoryResponse
 * @since 1.0.0
 */
export type GitHubRepositoryResponse = GitHubApiResponse<GitHubRepositoryInfo>;

/**
 * File content API response.
 * 
 * @type GitHubFileResponse
 * @since 1.0.0
 */
export type GitHubFileResponse = GitHubApiResponse<GitHubFileContent>;

/**
 * User information API response.
 * 
 * @type GitHubUserResponse
 * @since 1.0.0
 */
export type GitHubUserResponse = GitHubApiResponse<GitHubUserInfo>;

// =============================================================================
// ERROR HANDLING INTERFACES
// =============================================================================

/**
 * Comprehensive error types for GitHub dialog operations.
 * 
 * @type GitHubDialogErrorType
 * @since 1.0.0
 */
export type GitHubDialogErrorType = 
  | 'INVALID_URL'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'REPOSITORY_NOT_FOUND'
  | 'REPOSITORY_PRIVATE'
  | 'AUTHENTICATION_FAILED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'VALIDATION_ERROR'
  | 'PARSING_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * GitHub dialog error interface with comprehensive error information.
 * 
 * @interface GitHubDialogError
 * @since 1.0.0
 */
export interface GitHubDialogError extends Error {
  /** Error type classification */
  type: GitHubDialogErrorType;
  
  /** HTTP status code (if applicable) */
  statusCode?: number;
  
  /** GitHub API error code */
  apiErrorCode?: string;
  
  /** Detailed error context */
  context?: GitHubErrorContext;
  
  /** Whether error is recoverable */
  recoverable: boolean;
  
  /** Suggested recovery actions */
  recoveryActions?: string[];
  
  /** Error timestamp */
  timestamp: string;
  
  /** Request ID for debugging */
  requestId?: string;
}

/**
 * Additional error context information.
 * 
 * @interface GitHubErrorContext
 * @since 1.0.0
 */
export interface GitHubErrorContext {
  /** URL that caused the error */
  url?: string;
  
  /** Repository information */
  repository?: Partial<GitHubRepositoryInfo>;
  
  /** File path */
  filePath?: string;
  
  /** User authentication state */
  authState?: GitHubAuthState;
  
  /** Request parameters */
  requestParams?: Record<string, unknown>;
  
  /** Response data (if any) */
  responseData?: unknown;
  
  /** Rate limit information */
  rateLimit?: GitHubRateLimit;
}

/**
 * Error recovery options interface.
 * 
 * @interface ErrorRecoveryOptions
 * @since 1.0.0
 */
export interface ErrorRecoveryOptions {
  /** Whether to retry the operation */
  retry: boolean;
  
  /** Number of retry attempts */
  maxRetries: number;
  
  /** Retry delay in milliseconds */
  retryDelay: number;
  
  /** Whether to use exponential backoff */
  useBackoff: boolean;
  
  /** Custom retry strategy */
  retryStrategy?: (attempt: number, error: GitHubDialogError) => boolean;
}

// =============================================================================
// CALLBACK & EVENT HANDLER TYPES
// =============================================================================

/**
 * Callback function type for successful script import.
 * 
 * @type OnSuccessCallback
 * @since 1.0.0
 */
export type OnSuccessCallback = (scriptData: GitHubScriptContent) => Promise<void> | void;

/**
 * Callback function type for error handling.
 * 
 * @type OnErrorCallback
 * @since 1.0.0
 */
export type OnErrorCallback = (error: GitHubDialogError) => Promise<void> | void;

/**
 * Callback function type for dialog state changes.
 * 
 * @type OnStateChangeCallback
 * @since 1.0.0
 */
export type OnStateChangeCallback = (
  state: DialogState,
  context: DialogStateContext
) => Promise<void> | void;

/**
 * Callback function type for progress updates.
 * 
 * @type OnProgressCallback
 * @since 1.0.0
 */
export type OnProgressCallback = (progress: number, message?: string) => void;

/**
 * Dialog event handlers interface.
 * 
 * @interface DialogEventHandlers
 * @since 1.0.0
 */
export interface DialogEventHandlers {
  /** Called when dialog opens */
  onOpen?: () => void;
  
  /** Called when dialog closes */
  onClose?: () => void;
  
  /** Called when URL changes */
  onUrlChange?: (url: string) => void;
  
  /** Called when repository privacy is detected */
  onPrivacyDetected?: (isPrivate: boolean, repo: GitHubRepositoryInfo) => void;
  
  /** Called when authentication is required */
  onAuthRequired?: () => void;
  
  /** Called when authentication succeeds */
  onAuthSuccess?: (user: GitHubUserInfo) => void;
  
  /** Called during file processing */
  onProgress?: OnProgressCallback;
  
  /** Called when import succeeds */
  onSuccess?: OnSuccessCallback;
  
  /** Called when error occurs */
  onError?: OnErrorCallback;
  
  /** Called on state changes */
  onStateChange?: OnStateChangeCallback;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Partial dialog props for testing and mock scenarios.
 * 
 * @type PartialDialogProps
 * @since 1.0.0
 */
export type PartialDialogProps = Partial<ScriptsGithubDialogProps>;

/**
 * Required dialog props that must be provided.
 * 
 * @type RequiredDialogProps
 * @since 1.0.0
 */
export type RequiredDialogProps = Pick<
  ScriptsGithubDialogProps,
  'isOpen' | 'onClose' | 'onSuccess' | 'onError'
>;

/**
 * Dialog configuration options.
 * 
 * @type DialogConfiguration
 * @since 1.0.0
 */
export type DialogConfiguration = Omit<
  ScriptsGithubDialogProps,
  'isOpen' | 'onClose' | 'onSuccess' | 'onError'
>;

/**
 * GitHub URL parsing result.
 * 
 * @interface GitHubUrlParts
 * @since 1.0.0
 */
export interface GitHubUrlParts {
  /** Repository owner */
  owner: string;
  
  /** Repository name */
  repo: string;
  
  /** File path within repository */
  path: string;
  
  /** Branch name */
  branch?: string;
  
  /** Commit SHA */
  sha?: string;
  
  /** Whether URL is valid */
  isValid: boolean;
  
  /** Original URL */
  originalUrl: string;
}

/**
 * Component ref interface for imperative API.
 * 
 * @interface ScriptsGithubDialogRef
 * @since 1.0.0
 */
export interface ScriptsGithubDialogRef {
  /** Open the dialog */
  open: () => void;
  
  /** Close the dialog */
  close: () => void;
  
  /** Reset dialog state */
  reset: () => void;
  
  /** Get current form values */
  getFormValues: () => GitHubUrlFormData;
  
  /** Set form values */
  setFormValues: (values: Partial<GitHubUrlFormData>) => void;
  
  /** Trigger form validation */
  validateForm: () => Promise<boolean>;
  
  /** Get current dialog state */
  getState: () => DialogStateContext;
}

// =============================================================================
// EXPORTED TYPE UNIONS & HELPERS
// =============================================================================

/**
 * All possible dialog states union type.
 * 
 * @type DialogStates
 * @since 1.0.0
 */
export type DialogStates = keyof typeof DialogState;

/**
 * File extension mapping to language.
 * 
 * @type ExtensionLanguageMap
 * @since 1.0.0
 */
export type ExtensionLanguageMap = {
  [K in ScriptFileExtension]: ScriptLanguage;
};

/**
 * Type guard for checking if a value is a valid GitHub dialog error.
 * 
 * @param error - Value to check
 * @returns Whether the value is a GitHubDialogError
 * @since 1.0.0
 */
export function isGitHubDialogError(error: unknown): error is GitHubDialogError {
  return (
    error instanceof Error &&
    'type' in error &&
    'recoverable' in error &&
    'timestamp' in error
  );
}

/**
 * Type guard for checking if a URL points to a GitHub file.
 * 
 * @param url - URL to check
 * @returns Whether the URL is a valid GitHub file URL
 * @since 1.0.0
 */
export function isGitHubFileUrl(url: string): boolean {
  const githubPattern = /^https?:\/\/github\.com\/[^\/]+\/[^\/]+\/blob\/[^\/]+\/.+\.(js|py|php|txt|json|md|yml|yaml)$/i;
  return githubPattern.test(url);
}

/**
 * Utility type for extracting props from component type.
 * 
 * @template T - Component type
 * @since 1.0.0
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;

/**
 * Default file configuration for common script types.
 * 
 * @constant DEFAULT_FILE_CONFIG
 * @since 1.0.0
 */
export const DEFAULT_FILE_CONFIG: ScriptFileConfig = {
  allowedExtensions: ['.js', '.py', '.php', '.txt'],
  maxFileSize: 1048576, // 1MB
  validateContent: true,
  processingOptions: {
    minify: false,
    validateSyntax: true,
    encoding: 'utf-8',
    preserveFormatting: true,
    maxContentLength: 1000000, // 1M characters
  },
};

/**
 * Extension to language mapping.
 * 
 * @constant EXTENSION_LANGUAGE_MAP
 * @since 1.0.0
 */
export const EXTENSION_LANGUAGE_MAP: ExtensionLanguageMap = {
  '.js': 'javascript',
  '.py': 'python',
  '.php': 'php',
  '.txt': 'text',
  '.json': 'json',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
};