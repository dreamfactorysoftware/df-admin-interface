/**
 * @fileoverview GitHub Scripts Import Dialog Component Types
 * 
 * Comprehensive TypeScript interface definitions for the GitHub scripts import dialog
 * component system, migrated from Angular dialog types to React 19/Next.js 15.1 
 * architecture with TypeScript 5.8+ compatibility.
 * 
 * Defines type-safe interfaces for:
 * - React component props and callback functions  
 * - GitHub API integration and repository metadata
 * - React Hook Form and Zod validation schemas
 * - Error handling and dialog state management
 * - Authentication and file validation workflows
 * 
 * Migration Context:
 * - Replaces Angular MAT_DIALOG_DATA injection pattern with React props
 * - Integrates with React Hook Form + Zod validation per Section 3.2.3
 * - Ensures WCAG 2.1 AA accessibility compliance per Section 7.7.1
 * - Supports real-time validation under 100ms per React integration requirements
 * - Compatible with Next.js 15.1 server components and middleware patterns
 * 
 * Performance Requirements:
 * - GitHub API responses must complete within 5 seconds
 * - Form validation must execute under 100ms
 * - File content fetching optimized with intelligent caching
 * - Repository detection supports both public and private repositories
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 */

import { type ReactNode, type ComponentPropsWithRef, type ElementRef } from 'react';
import { 
  type UseFormRegister, 
  type UseFormSetValue, 
  type UseFormGetValues, 
  type UseFormWatch, 
  type UseFormTrigger,
  type UseFormHandleSubmit,
  type UseFormReturn,
  type FieldError,
  type FieldErrors,
  type Control,
  type SubmitHandler,
  type SubmitErrorHandler
} from 'react-hook-form';
import { type ZodSchema, type ZodError, type infer as ZodInfer } from 'zod';
import { 
  type DialogProps,
  type DialogResult,
  type DialogEventHandlers,
  type DialogA11yProps
} from '../dialog/types';
import {
  type BaseComponent,
  type ComponentVariant,
  type ComponentSize,
  type ComponentState,
  type EnhancedValidationState
} from '../../types/ui';

// =============================================================================
// CORE COMPONENT INTERFACES
// =============================================================================

/**
 * Main Scripts GitHub Dialog Component Props
 * 
 * Replaces Angular MAT_DIALOG_DATA injection pattern with React props pattern.
 * Provides comprehensive configuration for GitHub repository script import
 * workflow with type safety and accessibility compliance.
 * 
 * Features:
 * - React Hook Form integration with Zod validation
 * - GitHub API authentication handling
 * - File type validation and content detection
 * - Promise-based dialog resolution
 * - WCAG 2.1 AA accessibility support
 * - Real-time validation under 100ms
 * 
 * @example
 * ```tsx
 * const ImportDialog = ({ 
 *   repositoryUrl,
 *   allowedFileTypes,
 *   onImportComplete,
 *   authCredentials
 * }: ScriptsGithubDialogProps) => {
 *   // Component implementation
 * };
 * ```
 */
export interface ScriptsGithubDialogProps extends Omit<DialogProps, 'children'> {
  /** Initial GitHub repository URL (optional pre-fill) */
  repositoryUrl?: string;
  
  /** Allowed script file extensions for validation */
  allowedFileTypes?: ScriptFileExtension[];
  
  /** Maximum file size in bytes (default: 1MB) */
  maxFileSize?: number;
  
  /** Enable private repository authentication */
  enablePrivateRepos?: boolean;
  
  /** GitHub authentication credentials (for private repos) */
  authCredentials?: GitHubAuthCredentials;
  
  /** File validation configuration */
  validationConfig?: ScriptFileValidationConfig;
  
  /** Dialog resolution callbacks */
  onImportComplete?: (result: ScriptImportResult) => void | Promise<void>;
  onImportCancel?: () => void;
  onImportError?: (error: GitHubImportError) => void;
  
  /** Custom validation function for script content */
  validateScriptContent?: (content: string, fileName: string) => Promise<ScriptValidationResult>;
  
  /** Repository filter function for repository selection */
  repositoryFilter?: (repo: GitHubRepositoryInfo) => boolean;
  
  /** Custom GitHub API base URL (for GitHub Enterprise) */
  apiBaseUrl?: string;
  
  /** Request timeout in milliseconds (default: 10000) */
  requestTimeout?: number;
  
  /** Enable file content preview before import */
  enablePreview?: boolean;
  
  /** Accessibility configuration */
  a11y?: GitHubDialogA11yProps;
  
  /** Component test identifier */
  'data-testid'?: string;
}

/**
 * Extended accessibility props for GitHub dialog
 * Ensures WCAG 2.1 AA compliance for GitHub-specific interactions
 */
export interface GitHubDialogA11yProps extends DialogA11yProps {
  /** Screen reader announcement for repository detection */
  repositoryDetectedAnnouncement?: string;
  
  /** Screen reader announcement for file validation */
  fileValidationAnnouncement?: string;
  
  /** Screen reader announcement for import progress */
  importProgressAnnouncement?: string;
  
  /** Screen reader announcement for authentication state */
  authStateAnnouncement?: string;
  
  /** ARIA label for repository URL input */
  repositoryUrlLabel?: string;
  
  /** ARIA label for file selection interface */
  fileSelectionLabel?: string;
  
  /** ARIA label for authentication form */
  authFormLabel?: string;
  
  /** ARIA label for import progress indicator */
  progressIndicatorLabel?: string;
}

// =============================================================================
// GITHUB REPOSITORY AND API TYPES
// =============================================================================

/**
 * GitHub Repository Information Interface
 * 
 * Comprehensive metadata structure for GitHub repositories discovered
 * through the GitHub API. Supports both public and private repositories
 * with authentication handling.
 * 
 * @example
 * ```tsx
 * const repository: GitHubRepositoryInfo = {
 *   id: 123456789,
 *   name: 'my-scripts',
 *   fullName: 'user/my-scripts',
 *   description: 'Collection of utility scripts',
 *   owner: { login: 'user', type: 'User' },
 *   isPrivate: false,
 *   defaultBranch: 'main',
 *   language: 'JavaScript',
 *   size: 1024,
 *   updatedAt: '2024-01-15T10:30:00Z'
 * };
 * ```
 */
export interface GitHubRepositoryInfo {
  /** Unique repository identifier */
  id: number;
  
  /** Repository name */
  name: string;
  
  /** Full repository name (owner/repo) */
  fullName: string;
  
  /** Repository description */
  description: string | null;
  
  /** Repository owner information */
  owner: GitHubOwnerInfo;
  
  /** Repository privacy status */
  isPrivate: boolean;
  
  /** Repository fork status */
  isFork: boolean;
  
  /** Default branch name */
  defaultBranch: string;
  
  /** Primary programming language */
  language: string | null;
  
  /** Repository size in KB */
  size: number;
  
  /** Star count */
  starCount: number;
  
  /** Fork count */
  forkCount: number;
  
  /** Last updated timestamp */
  updatedAt: string;
  
  /** Repository creation timestamp */
  createdAt: string;
  
  /** Repository clone URL (HTTPS) */
  cloneUrl: string;
  
  /** Repository web URL */
  htmlUrl: string;
  
  /** Repository topics/tags */
  topics?: string[];
  
  /** Repository license information */
  license?: GitHubLicenseInfo;
  
  /** Available branches */
  branches?: GitHubBranchInfo[];
  
  /** Repository archive status */
  isArchived: boolean;
  
  /** Repository disabled status */
  isDisabled: boolean;
}

/**
 * GitHub Repository Owner Information
 * Supports both user and organization accounts
 */
export interface GitHubOwnerInfo {
  /** Owner login/username */
  login: string;
  
  /** Unique owner identifier */
  id: number;
  
  /** Owner type (User or Organization) */
  type: 'User' | 'Organization';
  
  /** Owner avatar URL */
  avatarUrl: string;
  
  /** Owner profile URL */
  htmlUrl: string;
  
  /** Owner display name */
  name?: string;
  
  /** Owner email (if public) */
  email?: string;
  
  /** Owner bio/description */
  bio?: string;
  
  /** Owner location */
  location?: string;
  
  /** Owner company */
  company?: string;
  
  /** Owner website URL */
  blog?: string;
}

/**
 * GitHub Branch Information
 * Represents available branches in the repository
 */
export interface GitHubBranchInfo {
  /** Branch name */
  name: string;
  
  /** Branch commit SHA */
  commit: {
    sha: string;
    url: string;
  };
  
  /** Branch protection status */
  protected: boolean;
  
  /** Branch protection rules */
  protection?: {
    enabled: boolean;
    requiredStatusChecks?: {
      strict: boolean;
      contexts: string[];
    };
  };
}

/**
 * GitHub License Information
 * Repository license details from GitHub API
 */
export interface GitHubLicenseInfo {
  /** License key identifier */
  key: string;
  
  /** License display name */
  name: string;
  
  /** License SPDX identifier */
  spdxId: string | null;
  
  /** License URL */
  url: string | null;
  
  /** License node ID */
  nodeId: string;
}

/**
 * GitHub File Information
 * Represents files discovered in the repository
 */
export interface GitHubFileInfo {
  /** File name */
  name: string;
  
  /** File path relative to repository root */
  path: string;
  
  /** File SHA hash */
  sha: string;
  
  /** File size in bytes */
  size: number;
  
  /** File type (file, dir, symlink, submodule) */
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  
  /** File download URL */
  downloadUrl?: string;
  
  /** File git URL */
  gitUrl: string;
  
  /** File HTML URL */
  htmlUrl: string;
  
  /** File content (if requested) */
  content?: string;
  
  /** File content encoding */
  encoding?: 'base64' | 'utf-8';
  
  /** File content type */
  contentType?: string;
  
  /** File last modified date */
  lastModified?: string;
  
  /** File language detection */
  language?: string;
  
  /** File validation result */
  validationResult?: ScriptValidationResult;
}

// =============================================================================
// AUTHENTICATION AND SECURITY TYPES
// =============================================================================

/**
 * GitHub Authentication Credentials Interface
 * 
 * Supports multiple authentication methods for private repository access
 * with secure credential handling and validation.
 * 
 * Features:
 * - Personal Access Token authentication
 * - OAuth App token authentication  
 * - GitHub App installation token authentication
 * - Credential validation and expiration handling
 * - Secure storage integration
 * 
 * @example
 * ```tsx
 * const credentials: GitHubAuthCredentials = {
 *   type: 'personal_access_token',
 *   token: 'ghp_xxxxxxxxxxxxxxxxxxxx',
 *   username: 'user123',
 *   scopes: ['repo', 'read:org'],
 *   expiresAt: new Date('2024-12-31T23:59:59Z')
 * };
 * ```
 */
export interface GitHubAuthCredentials {
  /** Authentication method type */
  type: GitHubAuthType;
  
  /** Authentication token */
  token: string;
  
  /** GitHub username (for PAT) */
  username?: string;
  
  /** Token scopes/permissions */
  scopes: string[];
  
  /** Token expiration date */
  expiresAt?: Date;
  
  /** Token creation date */
  createdAt?: Date;
  
  /** Token note/description */
  note?: string;
  
  /** OAuth app client ID (for OAuth tokens) */
  clientId?: string;
  
  /** GitHub App installation ID (for App tokens) */
  installationId?: number;
  
  /** Token validation status */
  isValid?: boolean;
  
  /** Last validation check */
  lastValidated?: Date;
  
  /** Rate limit information */
  rateLimit?: GitHubRateLimitInfo;
}

/**
 * GitHub Authentication Type Enumeration
 * Supported authentication methods for GitHub API access
 */
export type GitHubAuthType = 
  | 'personal_access_token'
  | 'oauth_token'
  | 'github_app_token'
  | 'basic_auth'
  | 'none';

/**
 * GitHub API Rate Limit Information
 * Tracks API usage and limits for authenticated requests
 */
export interface GitHubRateLimitInfo {
  /** Requests remaining in current window */
  remaining: number;
  
  /** Total requests allowed per window */
  limit: number;
  
  /** Rate limit reset timestamp */
  resetAt: Date;
  
  /** Rate limit window duration in seconds */
  windowDuration: number;
  
  /** Current rate limit resource */
  resource: 'core' | 'search' | 'graphql' | 'integration_manifest';
  
  /** Requests used in current window */
  used: number;
}

// =============================================================================
// FILE VALIDATION AND CONFIGURATION TYPES
// =============================================================================

/**
 * Script File Configuration Interface
 * 
 * Comprehensive configuration for script file validation, content type
 * detection, and import processing. Ensures only valid script files
 * are imported with proper content validation.
 * 
 * @example
 * ```tsx
 * const config: ScriptFileConfig = {
 *   extension: '.js',
 *   mimeTypes: ['application/javascript', 'text/javascript'],
 *   languageId: 'javascript',
 *   supportsModules: true,
 *   requiresTranspilation: false,
 *   validationRules: {
 *     maxSize: 1048576, // 1MB
 *     allowComments: true,
 *     requireStrict: false
 *   }
 * };
 * ```
 */
export interface ScriptFileConfig {
  /** File extension (with dot) */
  extension: ScriptFileExtension;
  
  /** Supported MIME types */
  mimeTypes: string[];
  
  /** Language identifier for syntax highlighting */
  languageId: string;
  
  /** Language display name */
  displayName: string;
  
  /** File supports ES6 modules */
  supportsModules: boolean;
  
  /** File requires transpilation */
  requiresTranspilation: boolean;
  
  /** File validation rules */
  validationRules: ScriptValidationRules;
  
  /** File processing options */
  processingOptions: ScriptProcessingOptions;
  
  /** File syntax highlighting configuration */
  syntaxHighlighting?: SyntaxHighlightingConfig;
  
  /** File linting configuration */
  lintingConfig?: LintingConfig;
  
  /** File execution environment */
  executionEnvironment: ScriptExecutionEnvironment;
  
  /** File security restrictions */
  securityRestrictions?: ScriptSecurityRestrictions;
}

/**
 * Supported Script File Extensions
 * Enumeration of valid script file types for import
 */
export type ScriptFileExtension = 
  | '.js'
  | '.ts'
  | '.jsx'
  | '.tsx'
  | '.py'
  | '.php'
  | '.rb'
  | '.java'
  | '.cs'
  | '.go'
  | '.rs'
  | '.sql'
  | '.sh'
  | '.ps1'
  | '.lua'
  | '.pl';

/**
 * Script Validation Rules Interface
 * Defines validation constraints for script content
 */
export interface ScriptValidationRules {
  /** Maximum file size in bytes */
  maxSize: number;
  
  /** Minimum file size in bytes */
  minSize?: number;
  
  /** Allow comments in script files */
  allowComments: boolean;
  
  /** Require strict mode declaration */
  requireStrict?: boolean;
  
  /** Maximum line length */
  maxLineLength?: number;
  
  /** Maximum number of lines */
  maxLines?: number;
  
  /** Prohibited patterns (regex) */
  prohibitedPatterns?: string[];
  
  /** Required patterns (regex) */
  requiredPatterns?: string[];
  
  /** Allowed function declarations */
  allowedFunctions?: string[];
  
  /** Prohibited function declarations */
  prohibitedFunctions?: string[];
  
  /** Require specific encoding */
  requiredEncoding?: 'utf-8' | 'ascii';
  
  /** Allow binary content */
  allowBinary?: boolean;
}

/**
 * Script Processing Options Interface
 * Configuration for script content processing
 */
export interface ScriptProcessingOptions {
  /** Remove comments during import */
  stripComments?: boolean;
  
  /** Minify script content */
  minify?: boolean;
  
  /** Validate syntax before import */
  validateSyntax: boolean;
  
  /** Transform imports/requires */
  transformImports?: boolean;
  
  /** Add wrapper function */
  addWrapper?: boolean;
  
  /** Wrapper function template */
  wrapperTemplate?: string;
  
  /** Auto-format code */
  autoFormat?: boolean;
  
  /** Format configuration */
  formatConfig?: CodeFormatConfig;
  
  /** Add execution timeout */
  addTimeout?: boolean;
  
  /** Timeout duration in milliseconds */
  timeoutDuration?: number;
}

/**
 * Code Format Configuration Interface
 * Settings for automatic code formatting
 */
export interface CodeFormatConfig {
  /** Indentation type */
  indentType: 'spaces' | 'tabs';
  
  /** Indentation size */
  indentSize: number;
  
  /** Line ending type */
  lineEnding: 'lf' | 'crlf' | 'cr';
  
  /** Maximum line length */
  printWidth: number;
  
  /** Use semicolons */
  useSemicolons: boolean;
  
  /** Use single quotes */
  singleQuotes: boolean;
  
  /** Add trailing commas */
  trailingCommas: 'none' | 'es5' | 'all';
  
  /** Bracket spacing */
  bracketSpacing: boolean;
  
  /** Arrow function parentheses */
  arrowParens: 'avoid' | 'always';
}

/**
 * Syntax Highlighting Configuration Interface
 * Configuration for syntax highlighting in preview
 */
export interface SyntaxHighlightingConfig {
  /** Highlighting theme */
  theme: 'light' | 'dark' | 'auto';
  
  /** Language-specific highlighting rules */
  languageRules?: Record<string, any>;
  
  /** Enable line numbers */
  showLineNumbers: boolean;
  
  /** Enable syntax validation */
  enableValidation: boolean;
  
  /** Highlight errors */
  highlightErrors: boolean;
  
  /** Highlight warnings */
  highlightWarnings: boolean;
}

/**
 * Linting Configuration Interface
 * ESLint/language-specific linting settings
 */
export interface LintingConfig {
  /** Enable linting */
  enabled: boolean;
  
  /** Linting rules configuration */
  rules: Record<string, any>;
  
  /** Linting environment */
  environment: string[];
  
  /** Global variables */
  globals: Record<string, boolean>;
  
  /** Parser options */
  parserOptions?: Record<string, any>;
  
  /** Extends configurations */
  extends?: string[];
  
  /** Plugin configurations */
  plugins?: string[];
}

/**
 * Script Execution Environment Enumeration
 * Supported execution environments for scripts
 */
export type ScriptExecutionEnvironment = 
  | 'browser'
  | 'node'
  | 'deno'
  | 'webworker'
  | 'serverless'
  | 'hybrid';

/**
 * Script Security Restrictions Interface
 * Security constraints for script execution
 */
export interface ScriptSecurityRestrictions {
  /** Allow network access */
  allowNetworkAccess: boolean;
  
  /** Allow file system access */
  allowFileSystemAccess: boolean;
  
  /** Allow process execution */
  allowProcessExecution: boolean;
  
  /** Allow eval() usage */
  allowEval: boolean;
  
  /** Allow Function() constructor */
  allowFunctionConstructor: boolean;
  
  /** Allowed domains for network access */
  allowedDomains?: string[];
  
  /** Allowed file paths */
  allowedPaths?: string[];
  
  /** Maximum execution time */
  maxExecutionTime: number;
  
  /** Maximum memory usage */
  maxMemoryUsage: number;
}

/**
 * Script File Validation Configuration
 * Comprehensive validation settings for imported files
 */
export interface ScriptFileValidationConfig {
  /** File type configurations */
  fileTypes: Record<ScriptFileExtension, ScriptFileConfig>;
  
  /** Global validation rules */
  globalRules: ScriptValidationRules;
  
  /** Custom validation functions */
  customValidators?: ScriptCustomValidator[];
  
  /** Validation timeout in milliseconds */
  validationTimeout: number;
  
  /** Enable parallel validation */
  enableParallelValidation: boolean;
  
  /** Maximum parallel validations */
  maxParallelValidations: number;
  
  /** Cache validation results */
  cacheResults: boolean;
  
  /** Cache duration in milliseconds */
  cacheDuration: number;
}

/**
 * Custom Script Validator Interface
 * User-defined validation function
 */
export interface ScriptCustomValidator {
  /** Validator name */
  name: string;
  
  /** Validator description */
  description: string;
  
  /** File extensions this validator applies to */
  fileExtensions: ScriptFileExtension[];
  
  /** Validation function */
  validate: (content: string, fileName: string, fileInfo: GitHubFileInfo) => Promise<ScriptValidationResult>;
  
  /** Validator priority (higher = earlier execution) */
  priority: number;
  
  /** Validator enabled status */
  enabled: boolean;
}

// =============================================================================
// VALIDATION AND RESULT TYPES
// =============================================================================

/**
 * Script Validation Result Interface
 * 
 * Comprehensive validation result structure providing detailed feedback
 * on script file validation including errors, warnings, and metadata.
 * 
 * @example
 * ```tsx
 * const result: ScriptValidationResult = {
 *   isValid: true,
 *   errors: [],
 *   warnings: [
 *     {
 *       code: 'DEPRECATED_API',
 *       message: 'Using deprecated function setTimeout',
 *       line: 42,
 *       column: 10,
 *       severity: 'warning'
 *     }
 *   ],
 *   metadata: {
 *     language: 'javascript',
 *     lineCount: 156,
 *     characterCount: 4032
 *   }
 * };
 * ```
 */
export interface ScriptValidationResult {
  /** Overall validation status */
  isValid: boolean;
  
  /** Validation errors */
  errors: ScriptValidationError[];
  
  /** Validation warnings */
  warnings: ScriptValidationWarning[];
  
  /** Validation information messages */
  info: ScriptValidationInfo[];
  
  /** Script metadata */
  metadata: ScriptMetadata;
  
  /** Validation performance metrics */
  performance: ValidationPerformanceMetrics;
  
  /** Validation timestamp */
  validatedAt: Date;
  
  /** Validator that performed validation */
  validatedBy: string;
  
  /** Validation configuration used */
  validationConfig: string;
  
  /** Security scan results */
  securityScan?: SecurityScanResult;
  
  /** Dependency analysis */
  dependencies?: DependencyAnalysisResult;
  
  /** Code quality metrics */
  qualityMetrics?: CodeQualityMetrics;
}

/**
 * Script Validation Error Interface
 * Detailed error information from script validation
 */
export interface ScriptValidationError {
  /** Error code for categorization */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Error severity level */
  severity: 'error' | 'critical';
  
  /** Line number where error occurred */
  line?: number;
  
  /** Column number where error occurred */
  column?: number;
  
  /** Length of the error span */
  length?: number;
  
  /** Error category */
  category: ValidationErrorCategory;
  
  /** Suggested fix */
  suggestion?: string;
  
  /** Fix can be applied automatically */
  autoFixable?: boolean;
  
  /** Documentation URL for error */
  docsUrl?: string;
  
  /** Related errors */
  related?: string[];
  
  /** Error source (which validator) */
  source: string;
}

/**
 * Script Validation Warning Interface
 * Non-blocking validation issues
 */
export interface ScriptValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Warning severity */
  severity: 'warning' | 'info';
  
  /** Line number */
  line?: number;
  
  /** Column number */
  column?: number;
  
  /** Warning category */
  category: ValidationWarningCategory;
  
  /** Suggested improvement */
  suggestion?: string;
  
  /** Warning source */
  source: string;
}

/**
 * Script Validation Info Interface
 * Informational messages from validation
 */
export interface ScriptValidationInfo {
  /** Info code */
  code: string;
  
  /** Info message */
  message: string;
  
  /** Info category */
  category: ValidationInfoCategory;
  
  /** Info source */
  source: string;
}

/**
 * Validation Error Categories
 * Classification of validation errors
 */
export type ValidationErrorCategory = 
  | 'syntax'
  | 'type'
  | 'security'
  | 'performance'
  | 'compatibility'
  | 'style'
  | 'dependency'
  | 'configuration';

/**
 * Validation Warning Categories
 * Classification of validation warnings
 */
export type ValidationWarningCategory = 
  | 'deprecated'
  | 'performance'
  | 'style'
  | 'compatibility'
  | 'maintenance'
  | 'accessibility';

/**
 * Validation Info Categories
 * Classification of validation information
 */
export type ValidationInfoCategory = 
  | 'general'
  | 'statistics'
  | 'dependencies'
  | 'features'
  | 'environment';

/**
 * Script Metadata Interface
 * Extracted metadata from script analysis
 */
export interface ScriptMetadata {
  /** Detected programming language */
  language: string;
  
  /** Language version/standard */
  languageVersion?: string;
  
  /** Total line count */
  lineCount: number;
  
  /** Total character count */
  characterCount: number;
  
  /** Code lines (excluding comments/whitespace) */
  codeLines: number;
  
  /** Comment lines */
  commentLines: number;
  
  /** Blank lines */
  blankLines: number;
  
  /** Detected encoding */
  encoding: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** Estimated complexity score */
  complexityScore?: number;
  
  /** Detected frameworks/libraries */
  frameworks?: string[];
  
  /** Entry point functions */
  entryPoints?: string[];
  
  /** Exported functions/classes */
  exports?: string[];
  
  /** Imported modules */
  imports?: string[];
  
  /** Global variables */
  globals?: string[];
  
  /** Function count */
  functionCount: number;
  
  /** Class count */
  classCount: number;
  
  /** Variable count */
  variableCount: number;
}

/**
 * Validation Performance Metrics Interface
 * Performance tracking for validation process
 */
export interface ValidationPerformanceMetrics {
  /** Total validation time in milliseconds */
  totalTime: number;
  
  /** Syntax validation time */
  syntaxTime: number;
  
  /** Type checking time */
  typeCheckTime?: number;
  
  /** Security scan time */
  securityScanTime?: number;
  
  /** Linting time */
  lintingTime?: number;
  
  /** Dependency analysis time */
  dependencyTime?: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** CPU usage percentage */
  cpuUsage?: number;
  
  /** Cache hit ratio */
  cacheHitRatio: number;
}

/**
 * Security Scan Result Interface
 * Results from security vulnerability scanning
 */
export interface SecurityScanResult {
  /** Overall security score (0-100) */
  securityScore: number;
  
  /** Security vulnerabilities found */
  vulnerabilities: SecurityVulnerability[];
  
  /** Security best practices compliance */
  bestPracticesCompliance: number;
  
  /** Scan timestamp */
  scannedAt: Date;
  
  /** Scanner used */
  scanner: string;
  
  /** Scanner version */
  scannerVersion: string;
}

/**
 * Security Vulnerability Interface
 * Individual security vulnerability details
 */
export interface SecurityVulnerability {
  /** Vulnerability ID */
  id: string;
  
  /** Vulnerability name */
  name: string;
  
  /** Vulnerability description */
  description: string;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** CVSS score */
  cvssScore?: number;
  
  /** CWE identifier */
  cweId?: string;
  
  /** Line number */
  line?: number;
  
  /** Column number */
  column?: number;
  
  /** Affected code snippet */
  codeSnippet?: string;
  
  /** Mitigation recommendation */
  mitigation: string;
  
  /** Reference links */
  references?: string[];
}

/**
 * Dependency Analysis Result Interface
 * Analysis of script dependencies
 */
export interface DependencyAnalysisResult {
  /** Direct dependencies */
  directDependencies: ScriptDependency[];
  
  /** Transitive dependencies */
  transitiveDependencies: ScriptDependency[];
  
  /** Circular dependencies */
  circularDependencies: CircularDependency[];
  
  /** Missing dependencies */
  missingDependencies: string[];
  
  /** Outdated dependencies */
  outdatedDependencies: OutdatedDependency[];
  
  /** Dependency tree depth */
  dependencyTreeDepth: number;
  
  /** Total dependency count */
  totalDependencyCount: number;
}

/**
 * Script Dependency Interface
 * Individual dependency information
 */
export interface ScriptDependency {
  /** Dependency name */
  name: string;
  
  /** Dependency version */
  version?: string;
  
  /** Dependency type */
  type: 'npm' | 'internal' | 'cdn' | 'file' | 'url';
  
  /** Dependency source */
  source: string;
  
  /** Is development dependency */
  isDev: boolean;
  
  /** Is optional dependency */
  isOptional: boolean;
  
  /** License information */
  license?: string;
  
  /** Security vulnerabilities */
  vulnerabilities?: SecurityVulnerability[];
}

/**
 * Circular Dependency Interface
 * Circular dependency chain information
 */
export interface CircularDependency {
  /** Dependency chain forming the circle */
  chain: string[];
  
  /** Chain length */
  chainLength: number;
  
  /** Severity of circular dependency */
  severity: 'warning' | 'error';
}

/**
 * Outdated Dependency Interface
 * Information about outdated dependencies
 */
export interface OutdatedDependency {
  /** Dependency name */
  name: string;
  
  /** Current version */
  currentVersion: string;
  
  /** Latest version */
  latestVersion: string;
  
  /** Version difference type */
  versionDiff: 'patch' | 'minor' | 'major';
  
  /** Breaking changes flag */
  hasBreakingChanges: boolean;
  
  /** Security updates available */
  hasSecurityUpdates: boolean;
}

/**
 * Code Quality Metrics Interface
 * Various code quality measurements
 */
export interface CodeQualityMetrics {
  /** Cyclomatic complexity */
  cyclomaticComplexity: number;
  
  /** Halstead metrics */
  halsteadMetrics: HalsteadMetrics;
  
  /** Maintainability index */
  maintainabilityIndex: number;
  
  /** Technical debt ratio */
  technicalDebtRatio: number;
  
  /** Code duplication percentage */
  duplicationPercentage: number;
  
  /** Test coverage percentage */
  testCoverage?: number;
  
  /** Documentation coverage */
  documentationCoverage: number;
  
  /** Code smells count */
  codeSmellsCount: number;
  
  /** Refactoring opportunities */
  refactoringOpportunities: RefactoringOpportunity[];
}

/**
 * Halstead Metrics Interface
 * Software complexity measurements
 */
export interface HalsteadMetrics {
  /** Distinct operators */
  distinctOperators: number;
  
  /** Distinct operands */
  distinctOperands: number;
  
  /** Total operators */
  totalOperators: number;
  
  /** Total operands */
  totalOperands: number;
  
  /** Program length */
  programLength: number;
  
  /** Program vocabulary */
  vocabulary: number;
  
  /** Program volume */
  volume: number;
  
  /** Program difficulty */
  difficulty: number;
  
  /** Programming effort */
  effort: number;
  
  /** Programming time */
  programmingTime: number;
  
  /** Estimated bugs */
  estimatedBugs: number;
}

/**
 * Refactoring Opportunity Interface
 * Identified code improvement opportunities
 */
export interface RefactoringOpportunity {
  /** Opportunity type */
  type: RefactoringType;
  
  /** Opportunity description */
  description: string;
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high';
  
  /** Estimated effort */
  estimatedEffort: 'small' | 'medium' | 'large';
  
  /** Affected code location */
  location: {
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
  };
  
  /** Suggested approach */
  suggestion: string;
  
  /** Expected benefits */
  benefits: string[];
}

/**
 * Refactoring Type Enumeration
 * Types of refactoring opportunities
 */
export type RefactoringType = 
  | 'extract_method'
  | 'extract_variable'
  | 'inline_method'
  | 'move_method'
  | 'rename'
  | 'split_variable'
  | 'remove_duplicate'
  | 'simplify_conditional'
  | 'replace_magic_number'
  | 'improve_naming';

// =============================================================================
// GITHUB API RESPONSE TYPES
// =============================================================================

/**
 * GitHub API Response Interface
 * 
 * Generic interface for GitHub API responses with consistent error handling,
 * pagination support, and rate limiting information.
 * 
 * @template T - Response data type
 * 
 * @example
 * ```tsx
 * const response: GitHubApiResponse<GitHubRepositoryInfo[]> = {
 *   data: [repository1, repository2],
 *   success: true,
 *   status: 200,
 *   headers: {
 *     'x-ratelimit-remaining': '4999',
 *     'x-ratelimit-limit': '5000'
 *   },
 *   rateLimit: {
 *     remaining: 4999,
 *     limit: 5000,
 *     resetAt: new Date('2024-01-15T11:00:00Z'),
 *     windowDuration: 3600,
 *     resource: 'core',
 *     used: 1
 *   }
 * };
 * ```
 */
export interface GitHubApiResponse<T = any> {
  /** Response data */
  data: T;
  
  /** Request success status */
  success: boolean;
  
  /** HTTP status code */
  status: number;
  
  /** HTTP status text */
  statusText: string;
  
  /** Response headers */
  headers: Record<string, string>;
  
  /** Rate limit information */
  rateLimit: GitHubRateLimitInfo;
  
  /** Request URL */
  url: string;
  
  /** Request method */
  method: string;
  
  /** Request timestamp */
  requestedAt: Date;
  
  /** Response timestamp */
  respondedAt: Date;
  
  /** Request duration in milliseconds */
  duration: number;
  
  /** Response from cache */
  fromCache: boolean;
  
  /** Pagination information (if applicable) */
  pagination?: GitHubPaginationInfo;
  
  /** API version used */
  apiVersion: string;
  
  /** Request ID for tracking */
  requestId?: string;
}

/**
 * GitHub API Error Response Interface
 * Standardized error response from GitHub API
 */
export interface GitHubApiErrorResponse {
  /** Error message */
  message: string;
  
  /** Error documentation URL */
  documentation_url?: string;
  
  /** Individual field errors */
  errors?: GitHubFieldError[];
  
  /** Error type */
  error?: string;
  
  /** Error description */
  error_description?: string;
  
  /** Error URI */
  error_uri?: string;
}

/**
 * GitHub Field Error Interface
 * Individual field validation error
 */
export interface GitHubFieldError {
  /** Error resource type */
  resource: string;
  
  /** Field name */
  field: string;
  
  /** Error code */
  code: string;
  
  /** Error message */
  message?: string;
}

/**
 * GitHub Pagination Information Interface
 * Pagination metadata for paginated responses
 */
export interface GitHubPaginationInfo {
  /** Current page number */
  page: number;
  
  /** Items per page */
  perPage: number;
  
  /** Total number of items */
  totalCount?: number;
  
  /** Total number of pages */
  totalPages?: number;
  
  /** Has next page */
  hasNext: boolean;
  
  /** Has previous page */
  hasPrevious: boolean;
  
  /** First page URL */
  firstUrl?: string;
  
  /** Last page URL */
  lastUrl?: string;
  
  /** Next page URL */
  nextUrl?: string;
  
  /** Previous page URL */
  prevUrl?: string;
}

// =============================================================================
// FORM INTEGRATION TYPES
// =============================================================================

/**
 * GitHub Import Form Schema Interface
 * 
 * React Hook Form and Zod integration interface providing type-safe
 * form validation for GitHub repository URL, authentication, and
 * file selection workflows.
 * 
 * Features:
 * - Real-time validation under 100ms
 * - Zod schema integration for runtime type checking
 * - Multi-step form support
 * - Conditional validation rules
 * - Custom validation functions
 * 
 * @example
 * ```tsx
 * const schema: GitHubImportFormSchema = {
 *   repositoryUrl: z.string().url('Invalid repository URL').min(1, 'Repository URL is required'),
 *   branch: z.string().optional(),
 *   authentication: z.object({
 *     enabled: z.boolean(),
 *     token: z.string().optional()
 *   }).refine(data => !data.enabled || data.token, {
 *     message: 'Token required for private repositories',
 *     path: ['token']
 *   })
 * };
 * ```
 */
export interface GitHubImportFormSchema {
  /** Repository URL validation schema */
  repositoryUrl: ZodSchema<string>;
  
  /** Branch name validation schema */
  branch: ZodSchema<string>;
  
  /** Authentication configuration schema */
  authentication: ZodSchema<GitHubAuthFormData>;
  
  /** File selection validation schema */
  fileSelection: ZodSchema<FileSelectionFormData>;
  
  /** Import options validation schema */
  importOptions: ZodSchema<ImportOptionsFormData>;
  
  /** Custom validation rules */
  customValidation?: ZodSchema<any>;
}

/**
 * GitHub Authentication Form Data Interface
 * Form data structure for GitHub authentication
 */
export interface GitHubAuthFormData {
  /** Authentication enabled flag */
  enabled: boolean;
  
  /** Authentication type */
  type: GitHubAuthType;
  
  /** Authentication token */
  token?: string;
  
  /** Username (for basic auth) */
  username?: string;
  
  /** Password (for basic auth) */
  password?: string;
  
  /** Remember credentials flag */
  rememberCredentials: boolean;
  
  /** Token validation status */
  isTokenValid?: boolean;
  
  /** Token validation error */
  tokenValidationError?: string;
}

/**
 * File Selection Form Data Interface
 * Form data structure for file selection
 */
export interface FileSelectionFormData {
  /** Selected files */
  selectedFiles: string[];
  
  /** Include subdirectories */
  includeSubdirectories: boolean;
  
  /** File type filter */
  fileTypeFilter: ScriptFileExtension[];
  
  /** Maximum file size filter */
  maxFileSizeFilter?: number;
  
  /** Exclude patterns */
  excludePatterns: string[];
  
  /** Include patterns */
  includePatterns: string[];
  
  /** Custom file filter function */
  customFilter?: string;
}

/**
 * Import Options Form Data Interface
 * Form data structure for import configuration
 */
export interface ImportOptionsFormData {
  /** Target directory for imported files */
  targetDirectory: string;
  
  /** File naming strategy */
  namingStrategy: FileNamingStrategy;
  
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;
  
  /** Preserve file structure */
  preserveStructure: boolean;
  
  /** Add file metadata */
  addMetadata: boolean;
  
  /** Validate files before import */
  validateBeforeImport: boolean;
  
  /** Create backup before import */
  createBackup: boolean;
  
  /** Import batch size */
  batchSize: number;
  
  /** Enable progress notifications */
  enableProgressNotifications: boolean;
}

/**
 * File Naming Strategy Enumeration
 * Strategies for naming imported files
 */
export type FileNamingStrategy = 
  | 'preserve'
  | 'prefix_repo'
  | 'prefix_branch'
  | 'custom_prefix'
  | 'suffix_timestamp'
  | 'suffix_hash';

/**
 * Conflict Resolution Strategy Enumeration
 * Strategies for handling file name conflicts
 */
export type ConflictResolutionStrategy = 
  | 'skip'
  | 'overwrite'
  | 'rename'
  | 'merge'
  | 'prompt'
  | 'version';

/**
 * Form Validation Schema Configuration Interface
 * Configuration for React Hook Form + Zod integration
 */
export interface FormValidationSchemaConfig {
  /** Base validation schema */
  baseSchema: ZodSchema<GitHubImportFormData>;
  
  /** Conditional validation rules */
  conditionalRules: ConditionalValidationRule[];
  
  /** Custom validators */
  customValidators: FormCustomValidator[];
  
  /** Validation timing configuration */
  validationTiming: ValidationTimingConfig;
  
  /** Error message configuration */
  errorMessages: ErrorMessageConfig;
  
  /** Field dependencies */
  fieldDependencies: FieldDependencyConfig[];
  
  /** Async validation configuration */
  asyncValidation: AsyncValidationConfig;
}

/**
 * Conditional Validation Rule Interface
 * Rules that apply conditionally based on form state
 */
export interface ConditionalValidationRule {
  /** Rule name */
  name: string;
  
  /** Condition function */
  condition: (formData: any) => boolean;
  
  /** Validation schema when condition is true */
  schema: ZodSchema<any>;
  
  /** Fields affected by this rule */
  affectedFields: string[];
  
  /** Rule priority */
  priority: number;
}

/**
 * Form Custom Validator Interface
 * Custom validation function for React Hook Form
 */
export interface FormCustomValidator {
  /** Validator name */
  name: string;
  
  /** Fields this validator applies to */
  fields: string[];
  
  /** Validation function */
  validate: (value: any, formData: any) => Promise<boolean | string>;
  
  /** Validator dependencies */
  dependencies?: string[];
  
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
}

/**
 * Validation Timing Configuration Interface
 * Configuration for when validation should occur
 */
export interface ValidationTimingConfig {
  /** Validate on change */
  onChange: boolean;
  
  /** Validate on blur */
  onBlur: boolean;
  
  /** Validate on submit */
  onSubmit: boolean;
  
  /** Validate on mount */
  onMount: boolean;
  
  /** Debounce delay for onChange validation */
  debounceDelay: number;
  
  /** Async validation timeout */
  asyncTimeout: number;
  
  /** Revalidate on form reset */
  revalidateOnReset: boolean;
}

/**
 * Error Message Configuration Interface
 * Configuration for validation error messages
 */
export interface ErrorMessageConfig {
  /** Default error messages */
  defaults: Record<string, string>;
  
  /** Field-specific error messages */
  fieldMessages: Record<string, Record<string, string>>;
  
  /** Error message templates */
  templates: Record<string, string>;
  
  /** Internationalization support */
  i18n: boolean;
  
  /** Locale for error messages */
  locale: string;
  
  /** Error message formatting function */
  formatter?: (error: FieldError, fieldName: string) => string;
}

/**
 * Field Dependency Configuration Interface
 * Configuration for field dependencies
 */
export interface FieldDependencyConfig {
  /** Dependent field name */
  field: string;
  
  /** Fields this field depends on */
  dependencies: string[];
  
  /** Dependency type */
  type: 'validation' | 'visibility' | 'options' | 'value';
  
  /** Dependency function */
  resolver: (dependencyValues: any[]) => any;
  
  /** Update timing */
  updateTiming: 'immediate' | 'debounced' | 'onBlur';
  
  /** Debounce delay */
  debounceDelay?: number;
}

/**
 * Async Validation Configuration Interface
 * Configuration for asynchronous validation
 */
export interface AsyncValidationConfig {
  /** Enable async validation */
  enabled: boolean;
  
  /** Async validation timeout */
  timeout: number;
  
  /** Retry attempts for failed validations */
  retryAttempts: number;
  
  /** Retry delay in milliseconds */
  retryDelay: number;
  
  /** Cache async validation results */
  cacheResults: boolean;
  
  /** Cache duration in milliseconds */
  cacheDuration: number;
  
  /** Concurrent validation limit */
  concurrentLimit: number;
}

/**
 * Complete GitHub Import Form Data Interface
 * Complete form data structure for GitHub import workflow
 */
export interface GitHubImportFormData {
  /** Repository information */
  repository: {
    url: string;
    branch: string;
    isPrivate: boolean;
    owner: string;
    name: string;
  };
  
  /** Authentication data */
  authentication: GitHubAuthFormData;
  
  /** File selection data */
  fileSelection: FileSelectionFormData;
  
  /** Import options data */
  importOptions: ImportOptionsFormData;
  
  /** Form metadata */
  metadata: {
    formVersion: string;
    createdAt: Date;
    updatedAt: Date;
    userId?: string;
    sessionId: string;
  };
}

// =============================================================================
// DIALOG STATE AND WORKFLOW TYPES
// =============================================================================

/**
 * Dialog State Enumeration
 * 
 * Tracks the current state of the GitHub import dialog workflow
 * enabling proper UI updates and user feedback throughout the
 * multi-step import process.
 * 
 * States:
 * - idle: Initial state, waiting for user input
 * - validating: Validating repository URL and authentication
 * - fetching: Fetching repository metadata and file list
 * - selecting: User selecting files to import
 * - importing: Importing selected files
 * - success: Import completed successfully
 * - error: Error occurred during process
 * - cancelled: User cancelled the import
 * 
 * @example
 * ```tsx
 * const [dialogState, setDialogState] = useState<DialogState>(DialogState.IDLE);
 * 
 * // Update state during workflow
 * setDialState(DialogState.VALIDATING);
 * ```
 */
export enum DialogState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  FETCHING = 'fetching',
  SELECTING = 'selecting',
  IMPORTING = 'importing',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

/**
 * Dialog Step Information Interface
 * Information about each step in the import workflow
 */
export interface DialogStepInfo {
  /** Step identifier */
  id: string;
  
  /** Step name */
  name: string;
  
  /** Step description */
  description: string;
  
  /** Step index */
  index: number;
  
  /** Step is completed */
  completed: boolean;
  
  /** Step is current */
  current: boolean;
  
  /** Step is enabled */
  enabled: boolean;
  
  /** Step validation status */
  isValid?: boolean;
  
  /** Step validation errors */
  errors?: FieldError[];
  
  /** Step progress percentage */
  progress?: number;
  
  /** Step icon */
  icon?: string;
  
  /** Step estimated duration */
  estimatedDuration?: number;
  
  /** Step actual duration */
  actualDuration?: number;
}

/**
 * Dialog Progress Information Interface
 * Tracks progress through the import workflow
 */
export interface DialogProgressInfo {
  /** Current step index */
  currentStep: number;
  
  /** Total number of steps */
  totalSteps: number;
  
  /** Overall progress percentage */
  overallProgress: number;
  
  /** Current step progress percentage */
  stepProgress: number;
  
  /** All step information */
  steps: DialogStepInfo[];
  
  /** Workflow start time */
  startTime: Date;
  
  /** Current time */
  currentTime: Date;
  
  /** Estimated completion time */
  estimatedCompletion?: Date;
  
  /** Time remaining in milliseconds */
  timeRemaining?: number;
  
  /** Time elapsed in milliseconds */
  timeElapsed: number;
}

/**
 * Dialog Context Interface
 * React context for sharing dialog state across components
 */
export interface GitHubDialogContextType {
  /** Current dialog state */
  state: DialogState;
  
  /** Update dialog state */
  setState: (state: DialogState) => void;
  
  /** Dialog progress information */
  progress: DialogProgressInfo;
  
  /** Update progress */
  updateProgress: (progress: Partial<DialogProgressInfo>) => void;
  
  /** Form methods from React Hook Form */
  form: UseFormReturn<GitHubImportFormData>;
  
  /** Current repository information */
  repository: GitHubRepositoryInfo | null;
  
  /** Set repository information */
  setRepository: (repo: GitHubRepositoryInfo | null) => void;
  
  /** Available files in repository */
  availableFiles: GitHubFileInfo[];
  
  /** Set available files */
  setAvailableFiles: (files: GitHubFileInfo[]) => void;
  
  /** Selected files for import */
  selectedFiles: GitHubFileInfo[];
  
  /** Set selected files */
  setSelectedFiles: (files: GitHubFileInfo[]) => void;
  
  /** Current error state */
  error: GitHubImportError | null;
  
  /** Set error state */
  setError: (error: GitHubImportError | null) => void;
  
  /** Authentication credentials */
  credentials: GitHubAuthCredentials | null;
  
  /** Set authentication credentials */
  setCredentials: (credentials: GitHubAuthCredentials | null) => void;
  
  /** Validation configuration */
  validationConfig: ScriptFileValidationConfig;
  
  /** Dialog callbacks */
  callbacks: {
    onImportComplete?: (result: ScriptImportResult) => void | Promise<void>;
    onImportCancel?: () => void;
    onImportError?: (error: GitHubImportError) => void;
  };
  
  /** Dialog options */
  options: {
    allowedFileTypes: ScriptFileExtension[];
    maxFileSize: number;
    enablePrivateRepos: boolean;
    apiBaseUrl: string;
    requestTimeout: number;
    enablePreview: boolean;
  };
}

// =============================================================================
// RESULT AND ERROR TYPES
// =============================================================================

/**
 * Script Import Result Interface
 * 
 * Comprehensive result structure returned upon successful completion
 * of the GitHub script import workflow, providing detailed information
 * about imported files and any issues encountered.
 * 
 * @example
 * ```tsx
 * const result: ScriptImportResult = {
 *   success: true,
 *   importedFiles: [
 *     {
 *       fileName: 'utility.js',
 *       filePath: '/scripts/utility.js',
 *       originalUrl: 'https://github.com/user/repo/blob/main/utility.js',
 *       fileSize: 2048,
 *       contentType: 'application/javascript',
 *       importedAt: new Date(),
 *       validationResult: { isValid: true, errors: [], warnings: [] }
 *     }
 *   ],
 *   skippedFiles: [],
 *   errors: [],
 *   warnings: [],
 *   statistics: {
 *     totalFilesProcessed: 1,
 *     successfulImports: 1,
 *     failedImports: 0,
 *     skippedImports: 0,
 *     totalProcessingTime: 1250
 *   }
 * };
 * ```
 */
export interface ScriptImportResult {
  /** Import operation success status */
  success: boolean;
  
  /** Successfully imported files */
  importedFiles: ImportedFileInfo[];
  
  /** Files skipped during import */
  skippedFiles: SkippedFileInfo[];
  
  /** Files that failed to import */
  failedFiles: FailedFileInfo[];
  
  /** Import operation errors */
  errors: GitHubImportError[];
  
  /** Import operation warnings */
  warnings: ImportWarning[];
  
  /** Import statistics */
  statistics: ImportStatistics;
  
  /** Source repository information */
  sourceRepository: GitHubRepositoryInfo;
  
  /** Import configuration used */
  importConfig: ImportOptionsFormData;
  
  /** Import timestamp */
  importedAt: Date;
  
  /** Import duration in milliseconds */
  importDuration: number;
  
  /** Import session ID */
  sessionId: string;
  
  /** User who performed import */
  importedBy?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Imported File Information Interface
 * Details about successfully imported files
 */
export interface ImportedFileInfo {
  /** Original file name */
  fileName: string;
  
  /** Imported file path */
  filePath: string;
  
  /** Original GitHub URL */
  originalUrl: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** File content type */
  contentType: string;
  
  /** File language */
  language: string;
  
  /** Import timestamp */
  importedAt: Date;
  
  /** File validation result */
  validationResult: ScriptValidationResult;
  
  /** File processing result */
  processingResult?: FileProcessingResult;
  
  /** File hash (for integrity checking) */
  fileHash: string;
  
  /** File encoding */
  encoding: string;
  
  /** File line count */
  lineCount: number;
  
  /** File character count */
  characterCount: number;
  
  /** File metadata */
  metadata: ScriptMetadata;
}

/**
 * Skipped File Information Interface
 * Details about files that were skipped during import
 */
export interface SkippedFileInfo {
  /** File name */
  fileName: string;
  
  /** File path in repository */
  filePath: string;
  
  /** GitHub file URL */
  fileUrl: string;
  
  /** Reason for skipping */
  reason: SkipReason;
  
  /** Detailed skip message */
  message: string;
  
  /** File information (if available) */
  fileInfo?: GitHubFileInfo;
  
  /** Skip timestamp */
  skippedAt: Date;
}

/**
 * Failed File Information Interface
 * Details about files that failed to import
 */
export interface FailedFileInfo {
  /** File name */
  fileName: string;
  
  /** File path in repository */
  filePath: string;
  
  /** GitHub file URL */
  fileUrl: string;
  
  /** Failure reason */
  error: GitHubImportError;
  
  /** Failure timestamp */
  failedAt: Date;
  
  /** Retry attempts made */
  retryAttempts: number;
  
  /** File information (if available) */
  fileInfo?: GitHubFileInfo;
}

/**
 * Skip Reason Enumeration
 * Reasons why files might be skipped during import
 */
export type SkipReason = 
  | 'file_too_large'
  | 'unsupported_type'
  | 'validation_failed'
  | 'already_exists'
  | 'user_filter'
  | 'permissions'
  | 'corruption'
  | 'duplicate'
  | 'excluded_pattern';

/**
 * Import Warning Interface
 * Non-blocking warnings during import process
 */
export interface ImportWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Warning severity */
  severity: 'low' | 'medium' | 'high';
  
  /** Related file (if applicable) */
  fileName?: string;
  
  /** Warning category */
  category: 'validation' | 'processing' | 'security' | 'performance' | 'compatibility';
  
  /** Warning timestamp */
  timestamp: Date;
  
  /** Suggested action */
  suggestion?: string;
  
  /** Warning can be ignored */
  canIgnore: boolean;
}

/**
 * Import Statistics Interface
 * Statistical information about the import operation
 */
export interface ImportStatistics {
  /** Total files processed */
  totalFilesProcessed: number;
  
  /** Successful imports */
  successfulImports: number;
  
  /** Failed imports */
  failedImports: number;
  
  /** Skipped imports */
  skippedImports: number;
  
  /** Total processing time in milliseconds */
  totalProcessingTime: number;
  
  /** Average processing time per file */
  averageProcessingTime: number;
  
  /** Fastest file processing time */
  fastestProcessingTime: number;
  
  /** Slowest file processing time */
  slowestProcessingTime: number;
  
  /** Total bytes processed */
  totalBytesProcessed: number;
  
  /** Average file size */
  averageFileSize: number;
  
  /** Largest file size */
  largestFileSize: number;
  
  /** Smallest file size */
  smallestFileSize: number;
  
  /** File type distribution */
  fileTypeDistribution: Record<ScriptFileExtension, number>;
  
  /** Language distribution */
  languageDistribution: Record<string, number>;
  
  /** Validation success rate */
  validationSuccessRate: number;
  
  /** Processing success rate */
  processingSuccessRate: number;
  
  /** Memory usage during import */
  memoryUsage: {
    peak: number;
    average: number;
    final: number;
  };
  
  /** Network statistics */
  networkStatistics: {
    totalRequests: number;
    totalBytes: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
}

/**
 * File Processing Result Interface
 * Results from processing imported files
 */
export interface FileProcessingResult {
  /** Processing success status */
  success: boolean;
  
  /** Processing errors */
  errors: ProcessingError[];
  
  /** Processing warnings */
  warnings: ProcessingWarning[];
  
  /** Applied transformations */
  transformations: AppliedTransformation[];
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Original content size */
  originalSize: number;
  
  /** Processed content size */
  processedSize: number;
  
  /** Size reduction percentage */
  sizeReduction: number;
  
  /** Processing configuration used */
  processingConfig: ScriptProcessingOptions;
}

/**
 * Processing Error Interface
 * Errors that occurred during file processing
 */
export interface ProcessingError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error severity */
  severity: 'error' | 'critical';
  
  /** Processing stage where error occurred */
  stage: ProcessingStage;
  
  /** Line number (if applicable) */
  line?: number;
  
  /** Column number (if applicable) */
  column?: number;
  
  /** Error context */
  context?: string;
  
  /** Recovery suggestion */
  suggestion?: string;
}

/**
 * Processing Warning Interface
 * Warnings from file processing
 */
export interface ProcessingWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Processing stage */
  stage: ProcessingStage;
  
  /** Line number (if applicable) */
  line?: number;
  
  /** Column number (if applicable) */
  column?: number;
  
  /** Warning context */
  context?: string;
}

/**
 * Applied Transformation Interface
 * Transformations applied during processing
 */
export interface AppliedTransformation {
  /** Transformation name */
  name: string;
  
  /** Transformation description */
  description: string;
  
  /** Transformation type */
  type: TransformationType;
  
  /** Lines affected */
  linesAffected: number;
  
  /** Characters changed */
  charactersChanged: number;
  
  /** Transformation success */
  success: boolean;
  
  /** Transformation time */
  duration: number;
}

/**
 * Processing Stage Enumeration
 * Stages of file processing
 */
export type ProcessingStage = 
  | 'parsing'
  | 'validation'
  | 'transformation'
  | 'optimization'
  | 'formatting'
  | 'output';

/**
 * Transformation Type Enumeration
 * Types of transformations that can be applied
 */
export type TransformationType = 
  | 'syntax'
  | 'import'
  | 'format'
  | 'minify'
  | 'wrapper'
  | 'comment'
  | 'optimization';

/**
 * GitHub Import Error Interface
 * 
 * Comprehensive error interface for GitHub import failures with
 * detailed categorization, recovery suggestions, and debugging
 * information to assist users in resolving issues.
 * 
 * @example
 * ```tsx
 * const error: GitHubImportError = {
 *   code: 'REPOSITORY_NOT_FOUND',
 *   message: 'Repository not found or access denied',
 *   category: 'api',
 *   severity: 'error',
 *   retryable: false,
 *   details: {
 *     repositoryUrl: 'https://github.com/user/nonexistent',
 *     statusCode: 404,
 *     githubMessage: 'Not Found'
 *   },
 *   suggestions: [
 *     'Verify the repository URL is correct',
 *     'Check if repository is private and requires authentication',
 *     'Ensure you have access to the repository'
 *   ],
 *   timestamp: new Date(),
 *   requestId: 'req_123456789'
 * };
 * ```
 */
export interface GitHubImportError extends Error {
  /** Error code for categorization */
  code: GitHubErrorCode;
  
  /** Human-readable error message */
  message: string;
  
  /** Error category */
  category: GitHubErrorCategory;
  
  /** Error severity level */
  severity: 'warning' | 'error' | 'critical';
  
  /** Error is retryable */
  retryable: boolean;
  
  /** Detailed error information */
  details: GitHubErrorDetails;
  
  /** Recovery suggestions */
  suggestions: string[];
  
  /** Error timestamp */
  timestamp: Date;
  
  /** Original error (if wrapping) */
  originalError?: Error;
  
  /** Request ID for tracking */
  requestId?: string;
  
  /** GitHub API response (if applicable) */
  githubResponse?: GitHubApiErrorResponse;
  
  /** Retry count */
  retryCount?: number;
  
  /** Context information */
  context?: Record<string, any>;
  
  /** User action that caused error */
  userAction?: string;
  
  /** Error documentation URL */
  docsUrl?: string;
  
  /** Error can be reported */
  reportable: boolean;
}

/**
 * GitHub Error Code Enumeration
 * Specific error codes for different failure scenarios
 */
export type GitHubErrorCode = 
  | 'REPOSITORY_NOT_FOUND'
  | 'REPOSITORY_PRIVATE'
  | 'INVALID_URL'
  | 'AUTHENTICATION_FAILED'
  | 'TOKEN_EXPIRED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'RATE_LIMIT_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_FAILED'
  | 'FILE_TOO_LARGE'
  | 'FILE_NOT_FOUND'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'PROCESSING_FAILED'
  | 'IMPORT_CANCELLED'
  | 'QUOTA_EXCEEDED'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * GitHub Error Category Enumeration
 * High-level categorization of errors
 */
export type GitHubErrorCategory = 
  | 'authentication'
  | 'authorization'
  | 'api'
  | 'network'
  | 'validation'
  | 'processing'
  | 'quota'
  | 'system'
  | 'user';

/**
 * GitHub Error Details Interface
 * Detailed error information for debugging
 */
export interface GitHubErrorDetails {
  /** HTTP status code (if applicable) */
  statusCode?: number;
  
  /** GitHub API error message */
  githubMessage?: string;
  
  /** Repository URL that caused error */
  repositoryUrl?: string;
  
  /** File path that caused error */
  filePath?: string;
  
  /** Authentication type used */
  authType?: GitHubAuthType;
  
  /** Request method */
  requestMethod?: string;
  
  /** Request URL */
  requestUrl?: string;
  
  /** Response headers */
  responseHeaders?: Record<string, string>;
  
  /** Rate limit information */
  rateLimit?: GitHubRateLimitInfo;
  
  /** Network timeout */
  timeout?: number;
  
  /** Validation errors */
  validationErrors?: FieldError[];
  
  /** Processing stage */
  processingStage?: ProcessingStage;
  
  /** Stack trace */
  stackTrace?: string;
  
  /** Additional context */
  context?: Record<string, any>;
}

// =============================================================================
// CALLBACK AND EVENT HANDLER TYPES
// =============================================================================

/**
 * Dialog Callback Function Types
 * 
 * Promise-based callback functions for dialog lifecycle events
 * enabling asynchronous workflow management and user interaction
 * handling with proper error boundaries and state management.
 */

/**
 * Import Complete Callback Type
 * Called when import operation completes successfully
 */
export type ImportCompleteCallback = (result: ScriptImportResult) => void | Promise<void>;

/**
 * Import Cancel Callback Type
 * Called when user cancels the import operation
 */
export type ImportCancelCallback = () => void;

/**
 * Import Error Callback Type
 * Called when import operation encounters an error
 */
export type ImportErrorCallback = (error: GitHubImportError) => void;

/**
 * Repository Validation Callback Type
 * Called when repository URL validation completes
 */
export type RepositoryValidationCallback = (
  isValid: boolean, 
  repository?: GitHubRepositoryInfo, 
  error?: GitHubImportError
) => void | Promise<void>;

/**
 * File Selection Change Callback Type
 * Called when user changes file selection
 */
export type FileSelectionChangeCallback = (selectedFiles: GitHubFileInfo[]) => void;

/**
 * Authentication Status Change Callback Type
 * Called when authentication status changes
 */
export type AuthStatusChangeCallback = (
  isAuthenticated: boolean,
  credentials?: GitHubAuthCredentials,
  error?: GitHubImportError
) => void;

/**
 * Progress Update Callback Type
 * Called during import progress updates
 */
export type ProgressUpdateCallback = (progress: DialogProgressInfo) => void;

/**
 * State Change Callback Type
 * Called when dialog state changes
 */
export type StateChangeCallback = (
  newState: DialogState,
  previousState: DialogState,
  context?: any
) => void;

/**
 * Validation Complete Callback Type
 * Called when file validation completes
 */
export type ValidationCompleteCallback = (
  fileName: string,
  result: ScriptValidationResult
) => void;

/**
 * Custom Script Content Validator Type
 * User-provided function for custom script validation
 */
export type CustomScriptValidator = (
  content: string,
  fileName: string,
  fileInfo: GitHubFileInfo
) => Promise<ScriptValidationResult>;

/**
 * Repository Filter Function Type
 * User-provided function for filtering repositories
 */
export type RepositoryFilterFunction = (repository: GitHubRepositoryInfo) => boolean;

/**
 * File Filter Function Type
 * User-provided function for filtering files
 */
export type FileFilterFunction = (file: GitHubFileInfo) => boolean;

/**
 * GitHub Dialog Event Handlers Interface
 * Comprehensive event handler interface for dialog lifecycle
 */
export interface GitHubDialogEventHandlers extends DialogEventHandlers {
  /** Repository URL validation events */
  onRepositoryValidation?: RepositoryValidationCallback;
  
  /** File selection change events */
  onFileSelectionChange?: FileSelectionChangeCallback;
  
  /** Authentication status change events */
  onAuthStatusChange?: AuthStatusChangeCallback;
  
  /** Import progress update events */
  onProgressUpdate?: ProgressUpdateCallback;
  
  /** Dialog state change events */
  onStateChange?: StateChangeCallback;
  
  /** File validation complete events */
  onValidationComplete?: ValidationCompleteCallback;
  
  /** Repository detection events */
  onRepositoryDetected?: (repository: GitHubRepositoryInfo) => void;
  
  /** File discovery events */
  onFilesDiscovered?: (files: GitHubFileInfo[]) => void;
  
  /** Authentication required events */
  onAuthRequired?: () => void;
  
  /** Rate limit warning events */
  onRateLimitWarning?: (rateLimit: GitHubRateLimitInfo) => void;
  
  /** Network error events */
  onNetworkError?: (error: GitHubImportError) => void;
  
  /** Quota warning events */
  onQuotaWarning?: (usage: number, limit: number) => void;
}

// =============================================================================
// COMPONENT REF TYPES
// =============================================================================

/**
 * Scripts GitHub Dialog Component Ref Type
 * React 19 compatible ref type for imperative operations
 */
export type ScriptsGithubDialogRef = ElementRef<'div'> & {
  /** Open the dialog programmatically */
  open: () => void;
  
  /** Close the dialog programmatically */
  close: () => void;
  
  /** Reset the dialog to initial state */
  reset: () => void;
  
  /** Get current dialog state */
  getState: () => DialogState;
  
  /** Get current form data */
  getFormData: () => GitHubImportFormData;
  
  /** Get validation errors */
  getValidationErrors: () => FieldErrors<GitHubImportFormData>;
  
  /** Trigger form validation */
  validateForm: () => Promise<boolean>;
  
  /** Submit the form programmatically */
  submitForm: () => Promise<void>;
  
  /** Update dialog progress */
  updateProgress: (progress: Partial<DialogProgressInfo>) => void;
  
  /** Set dialog error state */
  setError: (error: GitHubImportError | null) => void;
  
  /** Focus specific form field */
  focusField: (fieldName: keyof GitHubImportFormData) => void;
};

// =============================================================================
// MODULE EXPORTS AND UTILITIES
// =============================================================================

/**
 * Component Props with Ref Type
 * Combined props and ref interface for forwardRef components
 */
export type ScriptsGithubDialogPropsWithRef = ComponentPropsWithRef<'div'> & ScriptsGithubDialogProps;

/**
 * Default Configuration Constants
 * Default values for GitHub dialog configuration
 */
export const DEFAULT_GITHUB_DIALOG_CONFIG = {
  allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.py', '.php'] as ScriptFileExtension[],
  maxFileSize: 1048576, // 1MB
  enablePrivateRepos: true,
  apiBaseUrl: 'https://api.github.com',
  requestTimeout: 10000,
  enablePreview: true,
  validateBeforeImport: true,
  batchSize: 10,
  enableProgressNotifications: true
} as const;

/**
 * Supported File Extensions Array
 * Array of all supported file extensions for validation
 */
export const SUPPORTED_FILE_EXTENSIONS: readonly ScriptFileExtension[] = [
  '.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.rb', '.java', 
  '.cs', '.go', '.rs', '.sql', '.sh', '.ps1', '.lua', '.pl'
] as const;

/**
 * GitHub API Rate Limit Constants
 * Standard GitHub API rate limits
 */
export const GITHUB_RATE_LIMITS = {
  UNAUTHENTICATED: 60,
  AUTHENTICATED: 5000,
  SEARCH: 30,
  GRAPHQL: 5000
} as const;

/**
 * Dialog Step Constants
 * Standard dialog steps for import workflow
 */
export const DIALOG_STEPS = {
  REPOSITORY: 'repository',
  AUTHENTICATION: 'authentication',
  FILE_SELECTION: 'file_selection',
  IMPORT_OPTIONS: 'import_options',
  CONFIRMATION: 'confirmation',
  IMPORT: 'import',
  COMPLETION: 'completion'
} as const;

/**
 * Type Guards and Utility Functions
 */

/**
 * Type guard for GitHubRepositoryInfo
 */
export function isGitHubRepositoryInfo(obj: any): obj is GitHubRepositoryInfo {
  return obj && typeof obj === 'object' && 
         typeof obj.id === 'number' &&
         typeof obj.name === 'string' &&
         typeof obj.fullName === 'string' &&
         typeof obj.owner === 'object';
}

/**
 * Type guard for GitHubFileInfo
 */
export function isGitHubFileInfo(obj: any): obj is GitHubFileInfo {
  return obj && typeof obj === 'object' &&
         typeof obj.name === 'string' &&
         typeof obj.path === 'string' &&
         typeof obj.type === 'string';
}

/**
 * Type guard for GitHubImportError
 */
export function isGitHubImportError(obj: any): obj is GitHubImportError {
  return obj && typeof obj === 'object' &&
         typeof obj.code === 'string' &&
         typeof obj.message === 'string' &&
         typeof obj.category === 'string';
}

/**
 * Type guard for ScriptValidationResult
 */
export function isScriptValidationResult(obj: any): obj is ScriptValidationResult {
  return obj && typeof obj === 'object' &&
         typeof obj.isValid === 'boolean' &&
         Array.isArray(obj.errors) &&
         Array.isArray(obj.warnings);
}

// =============================================================================
// MODULE METADATA AND VERSION INFO
// =============================================================================

/**
 * Component Version Information
 * Version and compatibility metadata for the GitHub scripts dialog
 */
export const SCRIPTS_GITHUB_DIALOG_VERSION = '1.0.0' as const;

/**
 * Framework Compatibility Information
 * Supported framework versions for compatibility checking
 */
export const FRAMEWORK_COMPATIBILITY = {
  react: '>=19.0.0',
  nextjs: '>=15.1.0',
  typescript: '>=5.8.0',
  'react-hook-form': '>=7.52.0',
  zod: '>=3.0.0',
  tailwindcss: '>=4.1.0'
} as const;

/**
 * Feature Flags
 * Available features for progressive enhancement
 */
export const FEATURE_FLAGS = {
  PRIVATE_REPOS: true,
  FILE_PREVIEW: true,
  BATCH_IMPORT: true,
  CUSTOM_VALIDATION: true,
  PROGRESS_TRACKING: true,
  ERROR_RECOVERY: true,
  ACCESSIBILITY: true,
  INTERNATIONALIZATION: false // Future feature
} as const;