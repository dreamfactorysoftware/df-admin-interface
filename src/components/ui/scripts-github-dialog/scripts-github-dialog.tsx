/**
 * GitHub Scripts Import Dialog Component
 * 
 * React dialog component for GitHub script import functionality, replacing Angular
 * DfScriptsGithubDialogComponent. Provides form-based UI for entering GitHub repository
 * URLs, validates HTTP/HTTPS format and file extensions, handles private repository
 * authentication, and returns selected script data.
 * 
 * Features:
 * - Headless UI Dialog primitive with WCAG 2.1 AA accessibility
 * - React Hook Form with Zod validation for real-time feedback
 * - React Query integration for GitHub API data fetching
 * - Automatic private repository detection
 * - Responsive design with Tailwind CSS styling
 * - Comprehensive error handling and user feedback
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGitHubDialog, validateGitHubUrl } from '@/hooks/useGitHubApi';
import { gitHubDialogFormSchema, type GitHubDialogFormData } from '@/lib/validation-schemas';
import { GitHubDialogResult, GitHubUrlInfo } from '@/types/github';

interface ScriptsGitHubDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog is closed */
  onClose: () => void;
  /** Callback when script is successfully imported */
  onImport: (result: GitHubDialogResult) => void;
  /** Optional initial URL value */
  initialUrl?: string;
}

/**
 * GitHub Scripts Import Dialog Component
 */
export function ScriptsGitHubDialog({
  isOpen,
  onClose,
  onImport,
  initialUrl = '',
}: ScriptsGitHubDialogProps) {
  // State management
  const [isPrivateRepo, setIsPrivateRepo] = useState(false);
  const [urlInfo, setUrlInfo] = useState<GitHubUrlInfo | null>(null);
  const [hasCheckedRepo, setHasCheckedRepo] = useState(false);

  // GitHub API hook
  const {
    isLoading,
    isCheckingAccess,
    isFetchingFile,
    accessResult,
    fileContent,
    error,
    checkRepositoryAccess,
    fetchFileContent,
    reset,
  } = useGitHubDialog();

  // Form setup with React Hook Form and Zod validation
  const form = useForm<GitHubDialogFormData>({
    resolver: zodResolver(gitHubDialogFormSchema),
    defaultValues: {
      url: initialUrl,
      username: '',
      password: '',
    },
    mode: 'onChange', // Real-time validation
  });

  const { register, handleSubmit, watch, formState, setValue, clearErrors } = form;
  const { errors, isValid } = formState;
  const watchedUrl = watch('url');

  // Real-time URL validation effect
  useEffect(() => {
    if (!watchedUrl) {
      setUrlInfo(null);
      setIsPrivateRepo(false);
      setHasCheckedRepo(false);
      return;
    }

    // Debounce URL validation and repository checking
    const timeoutId = setTimeout(() => {
      const validation = validateGitHubUrl(watchedUrl);
      
      if (validation.isValid && validation.urlInfo) {
        setUrlInfo(validation.urlInfo);
        
        // Check repository access automatically
        checkRepositoryAccess({
          url: watchedUrl,
        });
        setHasCheckedRepo(true);
      } else {
        setUrlInfo(null);
        setIsPrivateRepo(false);
        setHasCheckedRepo(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [watchedUrl, checkRepositoryAccess]);

  // Handle repository access check results
  useEffect(() => {
    if (accessResult) {
      const requiresAuth = !accessResult.isAccessible || accessResult.requiresAuth;
      setIsPrivateRepo(requiresAuth);
      
      if (requiresAuth) {
        // Add authentication fields dynamically
        setValue('username', '');
        setValue('password', '');
      }
    }
  }, [accessResult, setValue]);

  // Handle successful file fetch
  useEffect(() => {
    if (fileContent && urlInfo) {
      const result: GitHubDialogResult = {
        data: fileContent,
        repoInfo: urlInfo,
      };
      onImport(result);
      handleClose();
    }
  }, [fileContent, urlInfo, onImport]);

  // Close dialog handler
  const handleClose = () => {
    form.reset();
    setIsPrivateRepo(false);
    setUrlInfo(null);
    setHasCheckedRepo(false);
    reset();
    onClose();
  };

  // Form submission handler
  const onSubmit = (data: GitHubDialogFormData) => {
    if (!urlInfo) {
      return;
    }

    const credentials = data.username && data.password ? {
      username: data.username,
      password: data.password,
    } : undefined;

    fetchFileContent({
      url: data.url,
      credentials,
    });
  };

  // Get current error message
  const getErrorMessage = () => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      // Provide helpful error messages for common scenarios
      if (errorMessage.includes('404')) {
        return 'Repository or file not found. Please check the URL or provide authentication for private repositories.';
      }
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        return 'Authentication failed. Please check your username and personal access token.';
      }
      if (errorMessage.includes('timeout')) {
        return 'Request timed out. Please check your internet connection and try again.';
      }
      
      return errorMessage;
    }
    return null;
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
      aria-labelledby="github-import-dialog-title"
      aria-describedby="github-import-dialog-description"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <DialogTitle
              id="github-import-dialog-title"
              className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
            >
              Import Script from GitHub
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label="Close dialog"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          <Description
            id="github-import-dialog-description"
            className="text-sm text-gray-600 dark:text-gray-400 mb-6"
          >
            Enter a GitHub file URL to import a script. Supported file types: .js, .py, .php, .txt
          </Description>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* GitHub URL Input */}
            <div>
              <label
                htmlFor="github-url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                GitHub File URL
              </label>
              <Input
                id="github-url"
                type="url"
                placeholder="https://github.com/user/repo/blob/main/script.js"
                aria-describedby={errors.url ? 'url-error' : undefined}
                aria-invalid={!!errors.url}
                {...register('url')}
                className="w-full"
              />
              {errors.url && (
                <p
                  id="url-error"
                  role="alert"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.url.message}
                </p>
              )}
              
              {/* Repository status indicator */}
              {hasCheckedRepo && urlInfo && !errors.url && (
                <div className="mt-2">
                  {isCheckingAccess ? (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Checking repository access...
                    </p>
                  ) : accessResult?.isAccessible ? (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ Repository accessible ({accessResult.isPrivate ? 'Private' : 'Public'})
                    </p>
                  ) : (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Repository requires authentication
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Authentication fields for private repositories */}
            {isPrivateRepo && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Authentication Required
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  This repository requires authentication. Please provide your GitHub username and a personal access token.
                </p>

                {/* Username field */}
                <div>
                  <label
                    htmlFor="github-username"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    GitHub Username
                  </label>
                  <Input
                    id="github-username"
                    type="text"
                    placeholder="your-username"
                    aria-describedby={errors.username ? 'username-error' : undefined}
                    aria-invalid={!!errors.username}
                    {...register('username')}
                    className="w-full"
                  />
                  {errors.username && (
                    <p
                      id="username-error"
                      role="alert"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Personal Access Token field */}
                <div>
                  <label
                    htmlFor="github-token"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Personal Access Token
                  </label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                    className="w-full"
                  />
                  {errors.password && (
                    <p
                      id="password-error"
                      role="alert"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.password.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Generate a token at{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      GitHub Settings
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {getErrorMessage() && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              >
                <p className="text-sm">{getErrorMessage()}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isLoading || !urlInfo}
                loading={isFetchingFile}
              >
                {isFetchingFile ? 'Importing...' : 'Import Script'}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

export default ScriptsGitHubDialog;