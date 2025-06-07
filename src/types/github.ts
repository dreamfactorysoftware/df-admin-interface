/**
 * GitHub API Types and Interfaces
 * 
 * TypeScript definitions for GitHub repository interactions, file content retrieval,
 * and authentication workflows. Supports both public and private repository access
 * with proper type safety for API responses.
 */

/**
 * GitHub repository information from API
 */
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    type: 'User' | 'Organization';
  };
  description: string | null;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  language: string | null;
  default_branch: string;
}

/**
 * GitHub file content response from API
 */
export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file';
  content: string; // Base64 encoded content
  encoding: 'base64';
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

/**
 * GitHub authentication credentials for private repositories
 */
export interface GitHubCredentials {
  username: string;
  password: string; // Personal Access Token
}

/**
 * GitHub URL parsing result
 */
export interface GitHubUrlInfo {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  isValidGitHubUrl: boolean;
  hasValidExtension: boolean;
}

/**
 * GitHub API error response
 */
export interface GitHubApiError {
  message: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
  documentation_url?: string;
}

/**
 * GitHub dialog form data
 */
export interface GitHubDialogFormData {
  url: string;
  username?: string;
  password?: string;
}

/**
 * GitHub dialog result when successfully imported
 */
export interface GitHubDialogResult {
  data: GitHubFileContent;
  repoInfo: GitHubUrlInfo;
}

/**
 * Supported file extensions for GitHub import
 */
export const SUPPORTED_FILE_EXTENSIONS = ['.js', '.py', '.php', '.txt'] as const;

export type SupportedFileExtension = typeof SUPPORTED_FILE_EXTENSIONS[number];

/**
 * GitHub API endpoints configuration
 */
export interface GitHubApiConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
}

/**
 * GitHub repository access check result
 */
export interface GitHubRepoAccessResult {
  isAccessible: boolean;
  isPrivate: boolean;
  requiresAuth: boolean;
  repository?: GitHubRepository;
  error?: GitHubApiError;
}

/**
 * GitHub file fetch options
 */
export interface GitHubFileFetchOptions {
  credentials?: GitHubCredentials;
  timeout?: number;
  retries?: number;
}

/**
 * GitHub URL validation result
 */
export interface GitHubUrlValidationResult {
  isValid: boolean;
  urlInfo?: GitHubUrlInfo;
  errors: string[];
}