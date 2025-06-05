/**
 * GitHub Import Hook for Script Editor
 * 
 * React hook for managing GitHub script import functionality with React Query
 * integration, dialog state management, and comprehensive error handling.
 * 
 * Features:
 * - React Query powered GitHub API integration with intelligent caching
 * - Dialog state management for GitHub import UI workflow
 * - Base64 content decoding with proper error handling and validation
 * - Comprehensive error handling for GitHub API failures and network issues
 * - TypeScript 5.8+ strict typing for GitHub API responses and state management
 * - Loading state management with user feedback during import operations
 * - Integration with scripts-github-dialog component patterns
 * 
 * @fileoverview GitHub import hook with React Query and dialog management
 * @version 1.0.0
 */

'use client';

import { useCallback, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  type GitHubDialogResult,
  type GitHubUrlInfo,
  type GitHubFileContent,
  type GitHubCredentials,
  type GitHubRepoAccessResult,
  type GitHubApiError,
  type GitHubUrlValidationResult,
  SUPPORTED_FILE_EXTENSIONS
} from '@/types/github';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * GitHub import hook configuration options
 */
export interface UseGithubImportConfig {
  /** GitHub API base URL (default: api.github.com) */
  apiBaseUrl?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retries?: number;
  /** Cache time for repository access checks in milliseconds (default: 5 minutes) */
  accessCacheTime?: number;
  /** Cache time for file content in milliseconds (default: 10 minutes) */
  contentCacheTime?: number;
  /** Enable debug logging */
  enableDebugLogging?: boolean;
}

/**
 * GitHub import state interface
 */
export interface GitHubImportState {
  /** Dialog open/closed state */
  isDialogOpen: boolean;
  /** Loading state for repository access checks */
  isCheckingAccess: boolean;
  /** Loading state for file content fetching */
  isFetchingFile: boolean;
  /** Overall loading state */
  isLoading: boolean;
  /** Current error if any */
  error: GitHubApiError | Error | null;
  /** Last successfully imported content */
  lastImport: GitHubDialogResult | null;
  /** Current repository access result */
  accessResult: GitHubRepoAccessResult | null;
  /** Current file content result */
  fileContent: GitHubFileContent | null;
}

/**
 * Repository access check parameters
 */
export interface RepositoryAccessParams {
  /** GitHub file URL to check */
  url: string;
  /** Optional credentials for private repositories */
  credentials?: GitHubCredentials;
}

/**
 * File content fetch parameters
 */
export interface FileContentParams {
  /** GitHub file URL to fetch */
  url: string;
  /** Optional credentials for private repositories */
  credentials?: GitHubCredentials;
}

/**
 * GitHub import hook return interface
 */
export interface UseGithubImportReturn {
  /** Current import state */
  state: GitHubImportState;
  
  /** Dialog management functions */
  dialog: {
    /** Open the import dialog */
    open: () => void;
    /** Close the import dialog and reset state */
    close: () => void;
    /** Toggle dialog open/closed state */
    toggle: () => void;
  };
  
  /** Repository access functions */
  access: {
    /** Check repository access for given URL */
    checkAccess: (params: RepositoryAccessParams) => Promise<GitHubRepoAccessResult>;
    /** Reset access check state */
    resetAccess: () => void;
  };
  
  /** File content functions */
  content: {
    /** Fetch file content from GitHub */
    fetchContent: (params: FileContentParams) => Promise<GitHubFileContent>;
    /** Reset file content state */
    resetContent: () => void;
  };
  
  /** Import workflow functions */
  import: {
    /** Complete import workflow (check access + fetch content) */
    importFile: (params: FileContentParams) => Promise<GitHubDialogResult>;
    /** Handle successful import callback */
    onImportSuccess: (result: GitHubDialogResult) => void;
    /** Reset all import state */
    resetImport: () => void;
  };
  
  /** Utility functions */
  utils: {
    /** Validate GitHub URL format and extract information */
    validateUrl: (url: string) => GitHubUrlValidationResult;
    /** Decode Base64 content with error handling */
    decodeContent: (base64Content: string) => string | null;
    /** Check if file extension is supported */
    isSupportedFile: (filename: string) => boolean;
  };
  
  /** State management functions */
  actions: {
    /** Clear all errors */
    clearError: () => void;
    /** Reset entire hook state */
    reset: () => void;
  };
}

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/** Default hook configuration */
const DEFAULT_CONFIG: Required<UseGithubImportConfig> = {
  apiBaseUrl: 'https://api.github.com',
  timeout: 10000,
  retries: 3,
  accessCacheTime: 5 * 60 * 1000, // 5 minutes
  contentCacheTime: 10 * 60 * 1000, // 10 minutes
  enableDebugLogging: false,
} as const;

/** GitHub API rate limiting and error codes */
const GITHUB_ERROR_CODES = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RATE_LIMITED: 403,
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  DECODE_ERROR: 'DECODE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

/** React Query cache keys */
const QUERY_KEYS = {
  REPO_ACCESS: 'github-repo-access',
  FILE_CONTENT: 'github-file-content',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validate GitHub URL and extract repository information
 */
export function validateGitHubUrl(url: string): GitHubUrlValidationResult {
  const errors: string[] = [];
  
  if (!url || typeof url !== 'string') {
    errors.push('URL is required');
    return { isValid: false, errors };
  }
  
  // GitHub URL regex pattern
  const githubUrlPattern = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/;
  const match = url.match(githubUrlPattern);
  
  if (!match) {
    errors.push('Invalid GitHub URL format. Expected: https://github.com/owner/repo/blob/branch/path');
    return { isValid: false, errors };
  }
  
  const [, owner, repo, branch, filePath] = match;
  
  // Validate components
  if (!owner || owner.length === 0) {
    errors.push('Repository owner is required');
  }
  
  if (!repo || repo.length === 0) {
    errors.push('Repository name is required');
  }
  
  if (!branch || branch.length === 0) {
    errors.push('Branch name is required');
  }
  
  if (!filePath || filePath.length === 0) {
    errors.push('File path is required');
  }
  
  // Check file extension
  const fileExtension = '.' + filePath.split('.').pop()?.toLowerCase();
  const hasValidExtension = SUPPORTED_FILE_EXTENSIONS.includes(fileExtension as any);
  
  if (!hasValidExtension) {
    errors.push(`Unsupported file type. Supported extensions: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`);
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  const urlInfo: GitHubUrlInfo = {
    owner,
    repo,
    branch,
    filePath,
    isValidGitHubUrl: true,
    hasValidExtension,
  };
  
  return {
    isValid: true,
    urlInfo,
    errors: [],
  };
}

/**
 * Decode Base64 content with comprehensive error handling
 */
export function decodeBase64Content(base64Content: string): string | null {
  if (!base64Content || typeof base64Content !== 'string') {
    return null;
  }
  
  try {
    // Remove whitespace and validate Base64 format
    const cleanedContent = base64Content.replace(/\s/g, '');
    
    // Check if content is valid Base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(cleanedContent)) {
      throw new Error('Invalid Base64 format');
    }
    
    // Decode using native browser API with fallback
    let decoded: string;
    
    if (typeof window !== 'undefined' && window.atob) {
      decoded = window.atob(cleanedContent);
    } else {
      // Server-side fallback using Buffer
      decoded = Buffer.from(cleanedContent, 'base64').toString('utf-8');
    }
    
    // Validate decoded content is valid UTF-8
    if (decoded.includes('\uFFFD')) {
      throw new Error('Invalid UTF-8 content after Base64 decoding');
    }
    
    return decoded;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown decoding error';
    console.error('Base64 decoding failed:', errorMessage);
    return null;
  }
}

/**
 * Check if filename has supported extension
 */
export function isSupportedFileExtension(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  const extension = '.' + filename.split('.').pop()?.toLowerCase();
  return SUPPORTED_FILE_EXTENSIONS.includes(extension as any);
}

/**
 * Create GitHub API headers with optional authentication
 */
function createGitHubHeaders(credentials?: GitHubCredentials): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DreamFactory-Admin-Interface',
  };
  
  if (credentials?.username && credentials?.password) {
    const auth = btoa(`${credentials.username}:${credentials.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }
  
  return headers;
}

/**
 * Convert GitHub URL to API endpoint
 */
function githubUrlToApiUrl(url: string, apiBaseUrl: string): string | null {
  const urlInfo = validateGitHubUrl(url);
  
  if (!urlInfo.isValid || !urlInfo.urlInfo) {
    return null;
  }
  
  const { owner, repo, branch, filePath } = urlInfo.urlInfo;
  return `${apiBaseUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
}

/**
 * Enhanced error handling for GitHub API responses
 */
function handleGitHubError(error: any): GitHubApiError {
  if (error?.response?.status) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case GITHUB_ERROR_CODES.NOT_FOUND:
        return {
          message: 'Repository or file not found. Please check the URL or provide authentication for private repositories.',
          errors: data?.errors,
          documentation_url: data?.documentation_url,
        };
      
      case GITHUB_ERROR_CODES.UNAUTHORIZED:
        return {
          message: 'Authentication failed. Please check your username and personal access token.',
          errors: data?.errors,
          documentation_url: data?.documentation_url,
        };
      
      case GITHUB_ERROR_CODES.FORBIDDEN:
        if (data?.message?.includes('rate limit')) {
          return {
            message: 'GitHub API rate limit exceeded. Please try again later or provide authentication.',
            errors: data?.errors,
            documentation_url: data?.documentation_url,
          };
        }
        return {
          message: 'Access forbidden. Please check your permissions or provide valid authentication.',
          errors: data?.errors,
          documentation_url: data?.documentation_url,
        };
      
      default:
        return {
          message: data?.message || `GitHub API error (${status})`,
          errors: data?.errors,
          documentation_url: data?.documentation_url,
        };
    }
  }
  
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      message: 'Request timed out. Please check your internet connection and try again.',
    };
  }
  
  if (error?.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return {
      message: 'Network error. Please check your internet connection.',
    };
  }
  
  return {
    message: error?.message || 'An unexpected error occurred while accessing GitHub.',
  };
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * GitHub Import Hook
 * 
 * Comprehensive React hook for managing GitHub script import functionality
 * with React Query integration, dialog state management, and error handling.
 */
export function useGithubImport(config: UseGithubImportConfig = {}): UseGithubImportReturn {
  // Configuration with defaults
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { apiBaseUrl, timeout, retries, accessCacheTime, contentCacheTime, enableDebugLogging } = mergedConfig;
  
  // Query client for cache management
  const queryClient = useQueryClient();
  
  // Local state management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastImport, setLastImport] = useState<GitHubDialogResult | null>(null);
  const [currentError, setCurrentError] = useState<GitHubApiError | Error | null>(null);
  
  // Refs for stable function references
  const configRef = useRef(mergedConfig);
  configRef.current = mergedConfig;
  
  // Debug logging utility
  const debugLog = useCallback((message: string, data?: any) => {
    if (enableDebugLogging) {
      console.log(`[useGithubImport] ${message}`, data);
    }
  }, [enableDebugLogging]);
  
  // =============================================================================
  // REPOSITORY ACCESS MUTATION
  // =============================================================================
  
  /**
   * Repository access check mutation with React Query
   */
  const accessMutation = useMutation({
    mutationKey: [QUERY_KEYS.REPO_ACCESS],
    mutationFn: async (params: RepositoryAccessParams): Promise<GitHubRepoAccessResult> => {
      debugLog('Checking repository access', params);
      
      const urlValidation = validateGitHubUrl(params.url);
      if (!urlValidation.isValid || !urlValidation.urlInfo) {
        throw new Error(urlValidation.errors.join(', '));
      }
      
      const { owner, repo } = urlValidation.urlInfo;
      const repoApiUrl = `${apiBaseUrl}/repos/${owner}/${repo}`;
      const headers = createGitHubHeaders(params.credentials);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(repoApiUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const repository = await response.json();
          debugLog('Repository access successful', repository);
          
          return {
            isAccessible: true,
            isPrivate: repository.private,
            requiresAuth: false,
            repository,
          };
        } else if (response.status === GITHUB_ERROR_CODES.NOT_FOUND) {
          // Repository might be private or not exist
          return {
            isAccessible: false,
            isPrivate: true,
            requiresAuth: true,
            error: {
              message: 'Repository not found or requires authentication',
            },
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw { response: { status: response.status, data: errorData } };
        }
      } catch (error) {
        debugLog('Repository access failed', error);
        throw error;
      }
    },
    onError: (error) => {
      const githubError = handleGitHubError(error);
      setCurrentError(githubError);
      debugLog('Repository access error', githubError);
    },
    onSuccess: (data) => {
      setCurrentError(null);
      debugLog('Repository access success', data);
    },
    retry: retries,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // =============================================================================
  // FILE CONTENT MUTATION
  // =============================================================================
  
  /**
   * File content fetch mutation with React Query
   */
  const contentMutation = useMutation({
    mutationKey: [QUERY_KEYS.FILE_CONTENT],
    mutationFn: async (params: FileContentParams): Promise<GitHubFileContent> => {
      debugLog('Fetching file content', params);
      
      const apiUrl = githubUrlToApiUrl(params.url, apiBaseUrl);
      if (!apiUrl) {
        throw new Error('Invalid GitHub URL format');
      }
      
      const headers = createGitHubHeaders(params.credentials);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw { response: { status: response.status, data: errorData } };
        }
        
        const fileData: GitHubFileContent = await response.json();
        
        // Validate file type
        if (fileData.type !== 'file') {
          throw new Error('The provided URL does not point to a file');
        }
        
        // Validate file extension
        if (!isSupportedFileExtension(fileData.name)) {
          throw new Error(`Unsupported file type: ${fileData.name}. Supported extensions: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`);
        }
        
        debugLog('File content fetched successfully', fileData);
        return fileData;
      } catch (error) {
        debugLog('File content fetch failed', error);
        throw error;
      }
    },
    onError: (error) => {
      const githubError = handleGitHubError(error);
      setCurrentError(githubError);
      debugLog('File content error', githubError);
    },
    onSuccess: (data) => {
      setCurrentError(null);
      debugLog('File content success', data);
    },
    retry: retries,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // =============================================================================
  // DIALOG MANAGEMENT FUNCTIONS
  // =============================================================================
  
  const openDialog = useCallback(() => {
    debugLog('Opening GitHub import dialog');
    setIsDialogOpen(true);
    setCurrentError(null);
  }, [debugLog]);
  
  const closeDialog = useCallback(() => {
    debugLog('Closing GitHub import dialog');
    setIsDialogOpen(false);
    setCurrentError(null);
    accessMutation.reset();
    contentMutation.reset();
  }, [debugLog, accessMutation, contentMutation]);
  
  const toggleDialog = useCallback(() => {
    if (isDialogOpen) {
      closeDialog();
    } else {
      openDialog();
    }
  }, [isDialogOpen, closeDialog, openDialog]);
  
  // =============================================================================
  // IMPORT WORKFLOW FUNCTIONS
  // =============================================================================
  
  const importFile = useCallback(async (params: FileContentParams): Promise<GitHubDialogResult> => {
    debugLog('Starting complete import workflow', params);
    
    try {
      // Step 1: Check repository access (optional for public repos)
      let accessResult: GitHubRepoAccessResult | null = null;
      try {
        accessResult = await accessMutation.mutateAsync(params);
      } catch (error) {
        // Access check failed - might still be able to fetch file if public
        debugLog('Access check failed, attempting direct file fetch', error);
      }
      
      // Step 2: Fetch file content
      const fileContent = await contentMutation.mutateAsync(params);
      
      // Step 3: Create import result
      const urlValidation = validateGitHubUrl(params.url);
      if (!urlValidation.isValid || !urlValidation.urlInfo) {
        throw new Error('Invalid GitHub URL after successful fetch');
      }
      
      const result: GitHubDialogResult = {
        data: fileContent,
        repoInfo: urlValidation.urlInfo,
      };
      
      debugLog('Import workflow completed successfully', result);
      return result;
    } catch (error) {
      debugLog('Import workflow failed', error);
      throw error;
    }
  }, [accessMutation, contentMutation, debugLog]);
  
  const onImportSuccess = useCallback((result: GitHubDialogResult) => {
    debugLog('Import success callback', result);
    setLastImport(result);
    setCurrentError(null);
    closeDialog();
  }, [debugLog, closeDialog]);
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  const validateUrl = useCallback((url: string): GitHubUrlValidationResult => {
    return validateGitHubUrl(url);
  }, []);
  
  const decodeContent = useCallback((base64Content: string): string | null => {
    return decodeBase64Content(base64Content);
  }, []);
  
  const isSupportedFile = useCallback((filename: string): boolean => {
    return isSupportedFileExtension(filename);
  }, []);
  
  // =============================================================================
  // STATE MANAGEMENT FUNCTIONS
  // =============================================================================
  
  const clearError = useCallback(() => {
    debugLog('Clearing error state');
    setCurrentError(null);
  }, [debugLog]);
  
  const reset = useCallback(() => {
    debugLog('Resetting all hook state');
    setIsDialogOpen(false);
    setLastImport(null);
    setCurrentError(null);
    accessMutation.reset();
    contentMutation.reset();
    
    // Clear React Query cache for this hook
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.REPO_ACCESS] });
    queryClient.removeQueries({ queryKey: [QUERY_KEYS.FILE_CONTENT] });
  }, [debugLog, accessMutation, contentMutation, queryClient]);
  
  const resetAccess = useCallback(() => {
    debugLog('Resetting access state');
    accessMutation.reset();
  }, [debugLog, accessMutation]);
  
  const resetContent = useCallback(() => {
    debugLog('Resetting content state');
    contentMutation.reset();
  }, [debugLog, contentMutation]);
  
  const resetImport = useCallback(() => {
    debugLog('Resetting import state');
    setLastImport(null);
    setCurrentError(null);
    accessMutation.reset();
    contentMutation.reset();
  }, [debugLog, accessMutation, contentMutation]);
  
  // =============================================================================
  // COMPUTED STATE
  // =============================================================================
  
  const state: GitHubImportState = {
    isDialogOpen,
    isCheckingAccess: accessMutation.isPending,
    isFetchingFile: contentMutation.isPending,
    isLoading: accessMutation.isPending || contentMutation.isPending,
    error: currentError || accessMutation.error || contentMutation.error || null,
    lastImport,
    accessResult: accessMutation.data || null,
    fileContent: contentMutation.data || null,
  };
  
  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================
  
  return {
    state,
    
    dialog: {
      open: openDialog,
      close: closeDialog,
      toggle: toggleDialog,
    },
    
    access: {
      checkAccess: accessMutation.mutateAsync,
      resetAccess,
    },
    
    content: {
      fetchContent: contentMutation.mutateAsync,
      resetContent,
    },
    
    import: {
      importFile,
      onImportSuccess,
      resetImport,
    },
    
    utils: {
      validateUrl,
      decodeContent,
      isSupportedFile,
    },
    
    actions: {
      clearError,
      reset,
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default useGithubImport;

/**
 * Re-export utility functions for standalone usage
 */
export {
  validateGitHubUrl,
  decodeBase64Content,
  isSupportedFileExtension,
};

/**
 * Re-export types for external usage
 */
export type {
  UseGithubImportConfig,
  UseGithubImportReturn,
  GitHubImportState,
  RepositoryAccessParams,
  FileContentParams,
};