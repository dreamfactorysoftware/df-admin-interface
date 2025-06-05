/**
 * GitHub API Hook
 * 
 * React Query-powered hook for GitHub API interactions including repository access checking,
 * file content retrieval, and authentication handling. Provides intelligent caching,
 * error handling, and optimistic updates for GitHub integration workflows.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  GitHubRepository, 
  GitHubFileContent, 
  GitHubCredentials, 
  GitHubUrlInfo,
  GitHubRepoAccessResult,
  GitHubFileFetchOptions,
  GitHubUrlValidationResult,
  SUPPORTED_FILE_EXTENSIONS
} from '@/types/github';

/**
 * Parse GitHub URL to extract repository and file information
 */
function parseGitHubUrl(url: string): GitHubUrlInfo {
  const defaultResult: GitHubUrlInfo = {
    owner: '',
    repo: '',
    branch: '',
    filePath: '',
    isValidGitHubUrl: false,
    hasValidExtension: false,
  };

  try {
    const urlObj = new URL(url);
    
    // Check if it's a GitHub URL
    if (!urlObj.hostname.includes('github.com')) {
      return defaultResult;
    }

    // Extract path parts: /owner/repo/blob/branch/file/path
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 5 || pathParts[2] !== 'blob') {
      return defaultResult;
    }

    const [owner, repo, , branch, ...filePathParts] = pathParts;
    const filePath = filePathParts.join('/');
    
    // Check if file has valid extension
    const hasValidExtension = SUPPORTED_FILE_EXTENSIONS.some(ext => 
      filePath.toLowerCase().endsWith(ext)
    );

    return {
      owner,
      repo,
      branch,
      filePath,
      isValidGitHubUrl: true,
      hasValidExtension,
    };
  } catch {
    return defaultResult;
  }
}

/**
 * Validate GitHub URL format and file extension
 */
export function validateGitHubUrl(url: string): GitHubUrlValidationResult {
  const errors: string[] = [];
  
  if (!url) {
    errors.push('GitHub URL is required');
    return { isValid: false, errors };
  }

  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }
  } catch {
    errors.push('Invalid URL format');
    return { isValid: false, errors };
  }

  const urlInfo = parseGitHubUrl(url);
  
  if (!urlInfo.isValidGitHubUrl) {
    errors.push('URL must be from github.com');
  }

  if (!urlInfo.hasValidExtension) {
    errors.push(`File must have one of these extensions: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`);
  }

  if (!urlInfo.owner || !urlInfo.repo || !urlInfo.filePath) {
    errors.push('Invalid GitHub file URL format. Expected: https://github.com/owner/repo/blob/branch/file.ext');
  }

  return {
    isValid: errors.length === 0,
    urlInfo: urlInfo.isValidGitHubUrl ? urlInfo : undefined,
    errors,
  };
}

/**
 * Check repository access and determine if authentication is required
 */
async function checkRepositoryAccess(
  owner: string, 
  repo: string,
  credentials?: GitHubCredentials
): Promise<GitHubRepoAccessResult> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DreamFactory-Admin-Interface',
  };

  // Add authentication if credentials provided
  if (credentials) {
    const auth = btoa(`${credentials.username}:${credentials.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const repository: GitHubRepository = await response.json();
      return {
        isAccessible: true,
        isPrivate: repository.private,
        requiresAuth: false,
        repository,
      };
    }

    if (response.status === 404) {
      // Repository not found - could be private
      return {
        isAccessible: false,
        isPrivate: true,
        requiresAuth: true,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        isAccessible: false,
        isPrivate: true,
        requiresAuth: true,
        error: {
          message: 'Authentication required to access this repository',
        },
      };
    }

    // Other errors
    const errorData = await response.json().catch(() => null);
    return {
      isAccessible: false,
      isPrivate: false,
      requiresAuth: false,
      error: errorData || {
        message: `HTTP ${response.status}: ${response.statusText}`,
      },
    };
  } catch (error) {
    return {
      isAccessible: false,
      isPrivate: false,
      requiresAuth: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to check repository access',
      },
    };
  }
}

/**
 * Fetch file content from GitHub repository
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
  options: GitHubFileFetchOptions = {}
): Promise<GitHubFileContent> {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'DreamFactory-Admin-Interface',
  };

  // Add authentication if credentials provided
  if (options.credentials) {
    const auth = btoa(`${options.credentials.username}:${options.credentials.password}`);
    headers['Authorization'] = `Basic ${auth}`;
  }

  const timeout = options.timeout || 15000; // 15 second default timeout
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const fileContent: GitHubFileContent = await response.json();
    
    // Verify it's a file (not a directory)
    if (fileContent.type !== 'file') {
      throw new Error('The specified path is not a file');
    }

    return fileContent;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch file content from GitHub');
  }
}

/**
 * Hook for checking repository access
 */
export function useCheckRepositoryAccess() {
  return useMutation({
    mutationFn: async ({
      url,
      credentials,
    }: {
      url: string;
      credentials?: GitHubCredentials;
    }) => {
      const validation = validateGitHubUrl(url);
      if (!validation.isValid || !validation.urlInfo) {
        throw new Error(validation.errors.join(', '));
      }

      const { owner, repo } = validation.urlInfo;
      return checkRepositoryAccess(owner, repo, credentials);
    },
    retry: 1,
  });
}

/**
 * Hook for fetching GitHub file content
 */
export function useFetchGitHubFile() {
  return useMutation({
    mutationFn: async ({
      url,
      credentials,
    }: {
      url: string;
      credentials?: GitHubCredentials;
    }) => {
      const validation = validateGitHubUrl(url);
      if (!validation.isValid || !validation.urlInfo) {
        throw new Error(validation.errors.join(', '));
      }

      const { owner, repo, filePath } = validation.urlInfo;
      return fetchFileContent(owner, repo, filePath, { credentials });
    },
    retry: 2,
  });
}

/**
 * Hook for GitHub URL validation with real-time feedback
 */
export function useValidateGitHubUrl(url: string) {
  return useQuery({
    queryKey: ['github-url-validation', url],
    queryFn: () => validateGitHubUrl(url),
    enabled: Boolean(url && url.length > 0),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Combined hook for GitHub dialog workflow
 */
export function useGitHubDialog() {
  const checkAccess = useCheckRepositoryAccess();
  const fetchFile = useFetchGitHubFile();

  return {
    // State
    isCheckingAccess: checkAccess.isPending,
    isFetchingFile: fetchFile.isPending,
    isLoading: checkAccess.isPending || fetchFile.isPending,
    
    // Data
    accessResult: checkAccess.data,
    fileContent: fetchFile.data,
    
    // Errors
    accessError: checkAccess.error,
    fetchError: fetchFile.error,
    error: checkAccess.error || fetchFile.error,
    
    // Actions
    checkRepositoryAccess: checkAccess.mutate,
    fetchFileContent: fetchFile.mutate,
    
    // Reset functions
    resetAccess: checkAccess.reset,
    resetFetch: fetchFile.reset,
    reset: () => {
      checkAccess.reset();
      fetchFile.reset();
    },
  };
}