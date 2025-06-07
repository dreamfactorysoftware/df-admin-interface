/**
 * @fileoverview GitHub Script Import Hook
 * 
 * React hook for managing GitHub script import functionality. Handles dialog interactions,
 * GitHub API integration with React Query caching, and Base64 content decoding. Replaces
 * the Angular component's githubImport method with React Query-powered state management
 * and modern async patterns.
 * 
 * Features:
 * - React Query integration for GitHub API caching and error handling
 * - Dialog state management replacing Angular Material with Headless UI patterns
 * - Base64 content decoding with proper error handling and validation
 * - Comprehensive error handling for GitHub API failures and network connectivity
 * - TypeScript 5.8+ strict typing for GitHub API responses and content state management
 * - Integration with scripts-github-dialog component for consistent user experience
 * - Loading state management with user feedback during GitHub import operations
 * 
 * Migration Context:
 * - Migrated from Angular githubImport method to React hook with dialog state management
 * - Implemented GitHub script import dialog integration replacing Angular Material dialog
 * - Added Base64 content decoding functionality using native browser APIs
 * - Created comprehensive error handling for GitHub API failures and network issues
 * - Implemented loading states and user feedback for GitHub import operations
 * - Added TypeScript strict typing for GitHub API responses and content handling
 * - Integrated with React Query for GitHub API caching and background synchronization
 * - Added dialog state management with proper cleanup and cancellation patterns
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import type { 
  GitHubFileContent,
  GitHubUrlInfo, 
  GitHubCredentials,
  GitHubApiError,
  GitHubDialogResult,
  GitHubFileFetchOptions,
  SUPPORTED_FILE_EXTENSIONS 
} from '@/types/github';
import type {
  ScriptsGithubDialogProps,
  GitHubRepositoryInfo,
  GitHubFileInfo,
  GitHubAuthCredentials,
  ScriptImportResult,
  GitHubImportError,
  ScriptFileExtension
} from '../scripts-github-dialog/types';
import type { ScriptContent } from '../types';

// ============================================================================
// VALIDATION SCHEMAS AND CONSTANTS
// ============================================================================

/**
 * GitHub URL validation schema with comprehensive pattern matching
 */
const githubUrlSchema = z.object({
  url: z.string()
    .url('Invalid URL format')
    .refine(
      (url) => {
        const githubPattern = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/blob\/([^\/]+)\/(.+))?$/;
        return githubPattern.test(url);
      },
      { message: 'Must be a valid GitHub repository or file URL' }
    )
});

/**
 * GitHub API configuration constants
 */
const GITHUB_API_CONFIG = {
  baseUrl: 'https://api.github.com',
  timeout: 10000, // 10 seconds per technical specification
  retries: 2,
  maxFileSize: 1024 * 1024, // 1MB file size limit
} as const;

/**
 * Query keys for React Query caching
 */
const QUERY_KEYS = {
  repositoryInfo: (owner: string, repo: string) => ['github', 'repository', owner, repo],
  fileContent: (owner: string, repo: string, path: string, ref?: string) => 
    ['github', 'file', owner, repo, path, ref],
  repositoryFiles: (owner: string, repo: string, ref?: string) =>
    ['github', 'files', owner, repo, ref],
} as const;

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Hook state interface for GitHub import functionality
 */
interface GitHubImportState {
  /** Dialog open/closed state */
  isOpen: boolean;
  /** Current loading state */
  isLoading: boolean;
  /** Current error state */
  error: GitHubImportError | null;
  /** Currently selected repository */
  repository: GitHubRepositoryInfo | null;
  /** Selected files for import */
  selectedFiles: GitHubFileInfo[];
  /** Dialog configuration */
  dialogConfig: Partial<ScriptsGithubDialogProps>;
}

/**
 * Hook options interface
 */
interface UseGitHubImportOptions {
  /** Allowed file extensions for import */
  allowedFileTypes?: ScriptFileExtension[];
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Enable private repository support */
  enablePrivateRepos?: boolean;
  /** Default GitHub credentials */
  defaultCredentials?: GitHubAuthCredentials;
  /** Custom validation function for content */
  validateContent?: (content: string, fileName: string) => Promise<boolean>;
  /** Callback for successful import */
  onImportSuccess?: (result: ScriptImportResult) => void;
  /** Callback for import errors */
  onImportError?: (error: GitHubImportError) => void;
}

/**
 * Hook return interface
 */
interface UseGitHubImportReturn {
  /** Current state */
  state: GitHubImportState;
  /** Open the GitHub import dialog */
  openDialog: (config?: Partial<ScriptsGithubDialogProps>) => void;
  /** Close the GitHub import dialog */
  closeDialog: () => void;
  /** Import script from GitHub URL */
  importFromUrl: (url: string, credentials?: GitHubCredentials) => Promise<ScriptContent>;
  /** Import multiple files from repository */
  importFromRepository: (repository: GitHubRepositoryInfo, files: GitHubFileInfo[], credentials?: GitHubCredentials) => Promise<ScriptContent[]>;
  /** Validate GitHub URL */
  validateUrl: (url: string) => GitHubUrlInfo | null;
  /** Parse GitHub URL components */
  parseGitHubUrl: (url: string) => GitHubUrlInfo | null;
  /** Decode Base64 content */
  decodeContent: (content: string, encoding?: string) => string;
  /** Clear current error */
  clearError: () => void;
  /** Reset hook state */
  reset: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse GitHub URL to extract repository and file information
 */
function parseGitHubUrl(url: string): GitHubUrlInfo | null {
  try {
    // Validate URL format
    const validation = githubUrlSchema.safeParse({ url });
    if (!validation.success) {
      return null;
    }

    const githubPattern = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/blob\/([^\/]+)\/(.+))?$/;
    const match = url.match(githubPattern);
    
    if (!match) {
      return null;
    }

    const [, owner, repo, branch = 'main', filePath = ''] = match;
    
    // Check if file has valid extension
    const hasValidExtension = filePath ? 
      SUPPORTED_FILE_EXTENSIONS.some(ext => filePath.endsWith(ext)) : false;

    return {
      owner,
      repo,
      branch,
      filePath,
      isValidGitHubUrl: true,
      hasValidExtension
    };
  } catch (error) {
    console.warn('Failed to parse GitHub URL:', error);
    return null;
  }
}

/**
 * Decode Base64 content with error handling
 */
function decodeBase64Content(content: string, encoding: string = 'base64'): string {
  try {
    if (encoding !== 'base64') {
      return content; // Already decoded
    }

    // Use native browser API for Base64 decoding
    const decoded = atob(content);
    
    // Convert to UTF-8 if needed
    try {
      return decodeURIComponent(escape(decoded));
    } catch {
      // Fallback to direct decoded content if UTF-8 conversion fails
      return decoded;
    }
  } catch (error) {
    throw new Error(`Failed to decode Base64 content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create GitHub API error from response
 */
function createGitHubError(error: unknown, context: string): GitHubImportError {
  if (error instanceof Error) {
    return {
      type: 'api_error',
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      code: error.name === 'AbortError' ? 'timeout' : 'unknown',
      details: { originalError: error.message }
    };
  }

  return {
    type: 'unknown_error',
    message: 'An unexpected error occurred',
    context,
    timestamp: new Date().toISOString(),
    code: 'unknown',
    details: { error: String(error) }
  };
}

// ============================================================================
// GITHUB API FUNCTIONS
// ============================================================================

/**
 * Fetch repository information from GitHub API
 */
async function fetchRepositoryInfo(
  owner: string, 
  repo: string, 
  credentials?: GitHubCredentials
): Promise<GitHubRepositoryInfo> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DreamFactory-Admin-Interface'
    };

    if (credentials?.password) {
      // Use Personal Access Token authentication
      headers['Authorization'] = `token ${credentials.password}`;
    }

    const response = await fetch(`${GITHUB_API_CONFIG.baseUrl}/repos/${owner}/${repo}`, {
      headers,
      signal: AbortSignal.timeout(GITHUB_API_CONFIG.timeout)
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Repository not found or is private');
      }
      if (response.status === 401) {
        throw new Error('Authentication required for private repository');
      }
      if (response.status === 403) {
        throw new Error('Access denied - check repository permissions');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform GitHub API response to our interface
    return {
      id: data.id,
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      owner: {
        login: data.owner.login,
        id: data.owner.id,
        type: data.owner.type,
        avatarUrl: data.owner.avatar_url,
        htmlUrl: data.owner.html_url
      },
      isPrivate: data.private,
      isFork: data.fork,
      defaultBranch: data.default_branch,
      language: data.language,
      size: data.size,
      starCount: data.stargazers_count,
      forkCount: data.forks_count,
      updatedAt: data.updated_at,
      createdAt: data.created_at,
      cloneUrl: data.clone_url,
      htmlUrl: data.html_url,
      topics: data.topics || [],
      isArchived: data.archived,
      isDisabled: data.disabled
    };
  } catch (error) {
    throw createGitHubError(error, `fetching repository info for ${owner}/${repo}`);
  }
}

/**
 * Fetch file content from GitHub API
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string = 'main',
  credentials?: GitHubCredentials
): Promise<GitHubFileContent> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DreamFactory-Admin-Interface'
    };

    if (credentials?.password) {
      headers['Authorization'] = `token ${credentials.password}`;
    }

    const response = await fetch(
      `${GITHUB_API_CONFIG.baseUrl}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      {
        headers,
        signal: AbortSignal.timeout(GITHUB_API_CONFIG.timeout)
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('File not found in repository');
      }
      if (response.status === 401) {
        throw new Error('Authentication required for private repository');
      }
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate file size
    if (data.size > GITHUB_API_CONFIG.maxFileSize) {
      throw new Error(`File too large: ${data.size} bytes (max: ${GITHUB_API_CONFIG.maxFileSize} bytes)`);
    }

    return data;
  } catch (error) {
    throw createGitHubError(error, `fetching file content for ${owner}/${repo}/${path}`);
  }
}

// ============================================================================
// MAIN HOOK IMPLEMENTATION
// ============================================================================

/**
 * GitHub Import Hook
 * 
 * Provides comprehensive GitHub script import functionality with React Query
 * integration, dialog state management, and error handling.
 */
export function useGithubImport(options: UseGitHubImportOptions = {}): UseGitHubImportReturn {
  const {
    allowedFileTypes = ['.js', '.ts', '.py', '.php', '.txt'],
    maxFileSize = GITHUB_API_CONFIG.maxFileSize,
    enablePrivateRepos = false,
    defaultCredentials,
    validateContent,
    onImportSuccess,
    onImportError
  } = options;

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [state, setState] = useState<GitHubImportState>({
    isOpen: false,
    isLoading: false,
    error: null,
    repository: null,
    selectedFiles: [],
    dialogConfig: {}
  });

  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========================================================================
  // MUTATIONS AND QUERIES
  // ========================================================================

  /**
   * Repository information query
   */
  const repositoryQuery = useMutation({
    mutationFn: async ({ owner, repo, credentials }: {
      owner: string;
      repo: string;
      credentials?: GitHubCredentials;
    }) => {
      return fetchRepositoryInfo(owner, repo, credentials);
    },
    onSuccess: (repository) => {
      setState(prev => ({ ...prev, repository, error: null }));
    },
    onError: (error: GitHubImportError) => {
      setState(prev => ({ ...prev, error, repository: null }));
      onImportError?.(error);
    }
  });

  /**
   * File content mutation with caching
   */
  const fileContentMutation = useMutation({
    mutationFn: async ({ owner, repo, path, ref, credentials }: {
      owner: string;
      repo: string;
      path: string;
      ref?: string;
      credentials?: GitHubCredentials;
    }) => {
      return fetchFileContent(owner, repo, path, ref, credentials);
    },
    onSuccess: (data) => {
      // Cache the successful file fetch
      queryClient.setQueryData(
        QUERY_KEYS.fileContent(data.path.split('/')[0], data.path.split('/')[1], data.path),
        data
      );
    },
    onError: (error: GitHubImportError) => {
      setState(prev => ({ ...prev, error }));
      onImportError?.(error);
    }
  });

  // ========================================================================
  // CORE FUNCTIONS
  // ========================================================================

  /**
   * Open GitHub import dialog
   */
  const openDialog = useCallback((config: Partial<ScriptsGithubDialogProps> = {}) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      error: null,
      dialogConfig: {
        allowedFileTypes,
        maxFileSize,
        enablePrivateRepos,
        authCredentials: defaultCredentials,
        ...config
      }
    }));
  }, [allowedFileTypes, maxFileSize, enablePrivateRepos, defaultCredentials]);

  /**
   * Close GitHub import dialog
   */
  const closeDialog = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isOpen: false,
      isLoading: false,
      error: null,
      repository: null,
      selectedFiles: []
    }));
  }, []);

  /**
   * Import script from GitHub URL
   */
  const importFromUrl = useCallback(async (
    url: string, 
    credentials?: GitHubCredentials
  ): Promise<ScriptContent> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Parse and validate URL
      const urlInfo = parseGitHubUrl(url);
      if (!urlInfo || !urlInfo.isValidGitHubUrl) {
        throw new Error('Invalid GitHub URL format');
      }

      if (!urlInfo.filePath) {
        throw new Error('URL must point to a specific file');
      }

      if (!urlInfo.hasValidExtension) {
        throw new Error(`File type not supported. Allowed types: ${allowedFileTypes.join(', ')}`);
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Fetch repository info
      const repository = await repositoryQuery.mutateAsync({
        owner: urlInfo.owner,
        repo: urlInfo.repo,
        credentials
      });

      // Fetch file content
      const fileContent = await fileContentMutation.mutateAsync({
        owner: urlInfo.owner,
        repo: urlInfo.repo,
        path: urlInfo.filePath,
        ref: urlInfo.branch,
        credentials
      });

      // Decode content
      const decodedContent = decodeBase64Content(fileContent.content, fileContent.encoding);

      // Validate content if validator provided
      if (validateContent) {
        const isValid = await validateContent(decodedContent, fileContent.name);
        if (!isValid) {
          throw new Error('Script content validation failed');
        }
      }

      // Create script content object
      const scriptContent: ScriptContent = {
        name: fileContent.name,
        description: `Imported from ${repository.fullName}`,
        type: getScriptTypeFromExtension(fileContent.name),
        context: 'custom_service' as const,
        source: 'github' as const,
        content: decodedContent,
        path: fileContent.path,
        repository_url: repository.htmlUrl,
        ref: urlInfo.branch,
        config: {
          importedFrom: url,
          repositoryInfo: repository,
          fileSize: fileContent.size,
          importedAt: new Date().toISOString()
        }
      };

      setState(prev => ({ ...prev, isLoading: false, error: null }));
      
      const result: ScriptImportResult = {
        scripts: [scriptContent],
        repository,
        importedFiles: [{
          name: fileContent.name,
          path: fileContent.path,
          size: fileContent.size,
          content: decodedContent
        }],
        metadata: {
          totalFiles: 1,
          totalSize: fileContent.size,
          importedAt: new Date().toISOString(),
          source: 'url'
        }
      };

      onImportSuccess?.(result);
      return scriptContent;

    } catch (error) {
      const gitHubError = createGitHubError(error, 'importing from URL');
      setState(prev => ({ ...prev, isLoading: false, error: gitHubError }));
      onImportError?.(gitHubError);
      throw error;
    }
  }, [allowedFileTypes, validateContent, onImportSuccess, onImportError, repositoryQuery, fileContentMutation]);

  /**
   * Import multiple files from repository
   */
  const importFromRepository = useCallback(async (
    repository: GitHubRepositoryInfo,
    files: GitHubFileInfo[],
    credentials?: GitHubCredentials
  ): Promise<ScriptContent[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const scriptContents: ScriptContent[] = [];
      const importedFiles: Array<{ name: string; path: string; size: number; content: string }> = [];

      for (const file of files) {
        try {
          // Fetch file content
          const fileContent = await fileContentMutation.mutateAsync({
            owner: repository.owner.login,
            repo: repository.name,
            path: file.path,
            credentials
          });

          // Decode content
          const decodedContent = decodeBase64Content(fileContent.content, fileContent.encoding);

          // Validate content if validator provided
          if (validateContent) {
            const isValid = await validateContent(decodedContent, file.name);
            if (!isValid) {
              console.warn(`Skipping file ${file.name}: validation failed`);
              continue;
            }
          }

          // Create script content object
          const scriptContent: ScriptContent = {
            name: file.name,
            description: `Imported from ${repository.fullName}`,
            type: getScriptTypeFromExtension(file.name),
            context: 'custom_service' as const,
            source: 'github' as const,
            content: decodedContent,
            path: file.path,
            repository_url: repository.htmlUrl,
            ref: repository.defaultBranch,
            config: {
              repositoryInfo: repository,
              fileSize: file.size,
              importedAt: new Date().toISOString()
            }
          };

          scriptContents.push(scriptContent);
          importedFiles.push({
            name: file.name,
            path: file.path,
            size: file.size,
            content: decodedContent
          });

        } catch (error) {
          console.warn(`Failed to import file ${file.name}:`, error);
          // Continue with other files
        }
      }

      setState(prev => ({ ...prev, isLoading: false, error: null }));

      const result: ScriptImportResult = {
        scripts: scriptContents,
        repository,
        importedFiles,
        metadata: {
          totalFiles: importedFiles.length,
          totalSize: importedFiles.reduce((sum, f) => sum + f.size, 0),
          importedAt: new Date().toISOString(),
          source: 'repository'
        }
      };

      onImportSuccess?.(result);
      return scriptContents;

    } catch (error) {
      const gitHubError = createGitHubError(error, 'importing from repository');
      setState(prev => ({ ...prev, isLoading: false, error: gitHubError }));
      onImportError?.(gitHubError);
      throw error;
    }
  }, [validateContent, onImportSuccess, onImportError, fileContentMutation]);

  /**
   * Validate GitHub URL
   */
  const validateUrl = useCallback((url: string): GitHubUrlInfo | null => {
    return parseGitHubUrl(url);
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      isOpen: false,
      isLoading: false,
      error: null,
      repository: null,
      selectedFiles: [],
      dialogConfig: {}
    });
  }, []);

  // ========================================================================
  // CLEANUP
  // ========================================================================

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ========================================================================
  // RETURN INTERFACE
  // ========================================================================

  return {
    state,
    openDialog,
    closeDialog,
    importFromUrl,
    importFromRepository,
    validateUrl,
    parseGitHubUrl: parseGitHubUrl,
    decodeContent: decodeBase64Content,
    clearError,
    reset
  };
}

// ============================================================================
// UTILITY HELPER FUNCTIONS
// ============================================================================

/**
 * Get script type from file extension
 */
function getScriptTypeFromExtension(fileName: string): any {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  const typeMap: Record<string, string> = {
    '.js': 'javascript',
    '.ts': 'javascript',
    '.jsx': 'javascript',
    '.tsx': 'javascript',
    '.py': 'python3',
    '.php': 'php',
    '.txt': 'text',
    '.md': 'text'
  };

  return typeMap[extension] || 'text';
}

// Export default hook
export default useGithubImport;

// Export types for external usage
export type {
  UseGitHubImportOptions,
  UseGitHubImportReturn,
  GitHubImportState
};