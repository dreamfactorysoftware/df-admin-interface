/**
 * @fileoverview GitHub Scripts Import Dialog Component
 * @version 1.0.0
 * @since 2024-12-19
 * 
 * React 19 implementation of GitHub script import dialog using Headless UI Dialog primitive
 * and Tailwind CSS. Replaces Angular DfScriptsGithubDialogComponent with modern React patterns,
 * React Hook Form for validation, React Query for GitHub API calls, and promise-based workflow.
 * 
 * Key Features:
 * - WCAG 2.1 AA accessibility compliance with focus management and ARIA labeling
 * - Real-time URL validation with debounced GitHub API calls for repository verification
 * - Dynamic authentication handling for private repositories
 * - File extension filtering (.js, .py, .php, .txt) with comprehensive validation
 * - Promise-based API for modern React workflows
 * - Tailwind CSS 4.1+ styling with design system compliance
 * 
 * Migration Notes:
 * - Converted Angular reactive forms to React Hook Form with Zod validation
 * - Replaced RxJS observables with React Query for GitHub API integration
 * - Migrated Angular Material components to Headless UI with Tailwind CSS
 * - Enhanced accessibility with proper focus trapping and keyboard navigation
 * - Implemented modern React patterns including custom hooks and suspense boundaries
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useGithubApi } from '@/hooks/useGithubApi';
import type {
  ScriptsGithubDialogProps,
  GitHubUrlFormData,
  GitHubScriptContent,
  GitHubDialogError,
  DialogState,
  GitHubRepositoryInfo,
  GitHubFileContent,
  ScriptFileExtension,
  ScriptLanguage,
  DialogStateContext,
  DEFAULT_FILE_CONFIG,
  EXTENSION_LANGUAGE_MAP,
  isGitHubFileUrl,
  isGitHubDialogError
} from './types';

/**
 * GitHub URL validation schema for React Hook Form + Zod integration
 * Implements comprehensive validation rules for GitHub file URLs and credentials
 */
const createValidationSchema = (requiresAuth: boolean = false) => {
  const baseSchema = z.object({
    url: z
      .string()
      .min(1, 'GitHub URL is required')
      .url('Must be a valid URL')
      .refine(
        (url) => url.includes('github.com'),
        'URL must be from GitHub'
      )
      .refine(
        (url) => isGitHubFileUrl(url),
        'URL must point to a supported file type (.js, .py, .php, .txt, .json, .md, .yml, .yaml)'
      )
      .refine(
        (url) => url.includes('/blob/'),
        'URL must be a GitHub file URL (should contain /blob/)'
      ),
  });

  if (requiresAuth) {
    return baseSchema.extend({
      username: z
        .string()
        .min(1, 'Username is required for private repositories'),
      password: z
        .string()
        .min(1, 'Personal access token is required for private repositories')
        .min(4, 'Token must be at least 4 characters long'),
    });
  }

  return baseSchema.extend({
    username: z.string().optional(),
    password: z.string().optional(),
  });
};

/**
 * Utility function to parse GitHub URL into components
 * @param url - GitHub file URL
 * @returns Parsed URL components or null if invalid
 */
const parseGitHubUrl = (url: string): {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
} | null => {
  try {
    if (!url.includes('github.com')) return null;
    
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length < 5) return null;
    
    const [owner, repo, , branch, ...filePath] = pathParts;
    
    return {
      owner,
      repo,
      path: filePath.join('/'),
      branch,
    };
  } catch {
    return null;
  }
};

/**
 * Utility function to get file extension from URL
 * @param url - File URL
 * @returns File extension including the dot
 */
const getFileExtension = (url: string): ScriptFileExtension | null => {
  const extensions: ScriptFileExtension[] = ['.js', '.py', '.php', '.txt', '.json', '.md', '.yml', '.yaml'];
  return extensions.find(ext => url.toLowerCase().endsWith(ext)) || null;
};

/**
 * Utility function to determine programming language from file extension
 * @param extension - File extension
 * @returns Programming language identifier
 */
const getLanguageFromExtension = (extension: ScriptFileExtension): ScriptLanguage => {
  return EXTENSION_LANGUAGE_MAP[extension] || 'text';
};

/**
 * Main GitHub Scripts Import Dialog Component
 * 
 * Implements WCAG 2.1 AA accessibility standards using Headless UI Dialog primitive
 * and Tailwind CSS. Provides real-time URL validation, repository privacy detection,
 * and configurable credential input fields for modern React workflows.
 * 
 * @param props - Component props including dialog state and event handlers
 * @returns JSX element representing the dialog
 */
export function ScriptsGithubDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
  initialUrl = '',
  fileConfig = DEFAULT_FILE_CONFIG,
  showDebugInfo = false,
  className,
  testId = 'scripts-github-dialog',
  ariaConfig = {
    'aria-label': 'Import GitHub Script Dialog',
    trapFocus: true,
  },
}: ScriptsGithubDialogProps) {
  // State management for dialog workflow
  const [dialogState, setDialogState] = useState<DialogState>(DialogState.IDLE);
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);
  const [repositoryInfo, setRepositoryInfo] = useState<GitHubRepositoryInfo | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [stateMessage, setStateMessage] = useState<string>('');
  
  // Refs for focus management
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const finalFocusRef = useRef<HTMLButtonElement>(null);
  
  // GitHub API integration
  const { checkRepository, getFileContent } = useGithubApi();
  
  // Create validation schema based on auth requirements
  const validationSchema = useMemo(
    () => createValidationSchema(requiresAuth),
    [requiresAuth]
  );
  
  // Initialize React Hook Form with Zod validation
  const {
    control,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<GitHubUrlFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      url: initialUrl,
      username: '',
      password: '',
    },
    mode: 'onChange',
  });
  
  // Watch URL field for real-time validation
  const watchedUrl = watch('url');
  const [debouncedUrl] = useDebounce(watchedUrl, 500);
  
  /**
   * Repository privacy check query
   * Automatically triggered when URL changes and is valid
   */
  const repositoryQuery = useQuery({
    queryKey: ['github-repository', debouncedUrl],
    queryFn: async () => {
      if (!debouncedUrl || !isGitHubFileUrl(debouncedUrl)) {
        return null;
      }
      
      const urlParts = parseGitHubUrl(debouncedUrl);
      if (!urlParts) {
        throw new Error('Invalid GitHub URL format');
      }
      
      setDialogState(DialogState.CHECKING_PRIVACY);
      setProgress(25);
      setStateMessage('Checking repository access...');
      
      try {
        const repoInfo = await checkRepository(urlParts.owner, urlParts.repo);
        setRepositoryInfo(repoInfo);
        
        if (repoInfo.private && !requiresAuth) {
          setRequiresAuth(true);
          setDialogState(DialogState.AUTHENTICATING);
          setProgress(50);
          setStateMessage('Private repository detected. Authentication required.');
        } else {
          setDialogState(DialogState.IDLE);
          setProgress(0);
          setStateMessage('');
        }
        
        return repoInfo;
      } catch (error) {
        // If repository check fails, assume it might be private
        if (!requiresAuth) {
          setRequiresAuth(true);
          setDialogState(DialogState.AUTHENTICATING);
          setProgress(50);
          setStateMessage('Repository access check failed. Credentials may be required.');
        }
        return null;
      }
    },
    enabled: !!debouncedUrl && isGitHubFileUrl(debouncedUrl),
    retry: false,
    staleTime: 30000, // 30 seconds
  });
  
  /**
   * File content fetch mutation
   * Handles the actual script import process
   */
  const importMutation = useMutation({
    mutationFn: async (formData: GitHubUrlFormData): Promise<GitHubScriptContent> => {
      const urlParts = parseGitHubUrl(formData.url);
      if (!urlParts) {
        throw new Error('Invalid GitHub URL format');
      }
      
      setDialogState(DialogState.FETCHING_CONTENT);
      setProgress(75);
      setStateMessage('Fetching file content...');
      
      // Get file content with optional authentication
      const fileContent = await getFileContent(
        urlParts.owner,
        urlParts.repo,
        urlParts.path,
        formData.username,
        formData.password
      );
      
      setDialogState(DialogState.PROCESSING);
      setProgress(90);
      setStateMessage('Processing file content...');
      
      // Validate file size
      if (fileContent.size > fileConfig.maxFileSize) {
        throw new Error(`File size (${fileContent.size} bytes) exceeds maximum allowed size (${fileConfig.maxFileSize} bytes)`);
      }
      
      // Decode content
      let decodedContent: string;
      if (fileContent.encoding === 'base64') {
        try {
          decodedContent = atob(fileContent.content);
        } catch {
          throw new Error('Failed to decode base64 content');
        }
      } else {
        decodedContent = fileContent.content;
      }
      
      // Validate file extension
      const extension = getFileExtension(fileContent.name);
      if (!extension || !fileConfig.allowedExtensions.includes(extension)) {
        throw new Error(`File type not supported. Allowed extensions: ${fileConfig.allowedExtensions.join(', ')}`);
      }
      
      // Validate content length
      if (decodedContent.length > fileConfig.processingOptions.maxContentLength) {
        throw new Error(`Content length exceeds maximum allowed (${fileConfig.processingOptions.maxContentLength} characters)`);
      }
      
      setDialogState(DialogState.SUCCESS);
      setProgress(100);
      setStateMessage('Import completed successfully!');
      
      // Return processed script content
      const scriptContent: GitHubScriptContent = {
        fileName: fileContent.name,
        extension,
        content: decodedContent,
        language: getLanguageFromExtension(extension),
        size: fileContent.size,
        repository: repositoryInfo ? {
          name: repositoryInfo.name,
          full_name: repositoryInfo.full_name,
          html_url: repositoryInfo.html_url,
        } : {
          name: urlParts.repo,
          full_name: `${urlParts.owner}/${urlParts.repo}`,
          html_url: `https://github.com/${urlParts.owner}/${urlParts.repo}`,
        },
        path: urlParts.path,
        url: formData.url,
        importedAt: new Date().toISOString(),
        sha: fileContent.sha,
      };
      
      return scriptContent;
    },
    onSuccess: async (scriptContent) => {
      try {
        await onSuccess(scriptContent);
        handleClose();
      } catch (error) {
        const dialogError: GitHubDialogError = {
          name: 'Success Handler Error',
          message: error instanceof Error ? error.message : 'Failed to process imported script',
          type: 'UNKNOWN_ERROR',
          recoverable: true,
          timestamp: new Date().toISOString(),
          context: {
            url: watchedUrl,
          },
        };
        onError(dialogError);
        setDialogState(DialogState.ERROR);
        setStateMessage('Failed to process imported script');
      }
    },
    onError: (error: unknown) => {
      const dialogError: GitHubDialogError = {
        name: 'GitHub Import Error',
        message: error instanceof Error ? error.message : 'Failed to import script from GitHub',
        type: 'UNKNOWN_ERROR',
        recoverable: true,
        timestamp: new Date().toISOString(),
        context: {
          url: watchedUrl,
          repository: repositoryInfo || undefined,
        },
      };
      
      // Determine specific error type
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          dialogError.type = 'FILE_NOT_FOUND';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          dialogError.type = 'AUTHENTICATION_FAILED';
        } else if (error.message.includes('rate limit')) {
          dialogError.type = 'RATE_LIMITED';
        } else if (error.message.includes('size')) {
          dialogError.type = 'FILE_TOO_LARGE';
        } else if (error.message.includes('extension') || error.message.includes('type')) {
          dialogError.type = 'UNSUPPORTED_FILE_TYPE';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          dialogError.type = 'NETWORK_ERROR';
        }
      }
      
      onError(dialogError);
      setDialogState(DialogState.ERROR);
      setProgress(0);
      setStateMessage(dialogError.message);
    },
  });
  
  /**
   * Handle form submission
   * Validates form and initiates import process
   */
  const onSubmit = useCallback(async (data: GitHubUrlFormData) => {
    clearErrors();
    
    try {
      await importMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error('Import failed:', error);
    }
  }, [importMutation, clearErrors]);
  
  /**
   * Handle dialog close with cleanup
   * Resets form state and progress indicators
   */
  const handleClose = useCallback(() => {
    if (isSubmitting) return; // Prevent closing during submission
    
    setDialogState(DialogState.CANCELLED);
    setProgress(0);
    setStateMessage('');
    setRequiresAuth(false);
    setRepositoryInfo(null);
    reset();
    onClose();
  }, [isSubmitting, reset, onClose]);
  
  /**
   * Handle URL field changes with validation
   * Clears auth requirements when URL changes significantly
   */
  useEffect(() => {
    if (watchedUrl !== debouncedUrl) {
      // Reset auth state when URL is being typed
      setRequiresAuth(false);
      setRepositoryInfo(null);
      setDialogState(DialogState.IDLE);
      setProgress(0);
      setStateMessage('');
    }
  }, [watchedUrl, debouncedUrl]);
  
  /**
   * Handle escape key for dialog close
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isSubmitting, handleClose]);
  
  /**
   * Determine if submit button should be disabled
   */
  const isSubmitDisabled = useMemo(() => {
    return !isValid || isSubmitting || repositoryQuery.isLoading || dialogState === DialogState.PROCESSING;
  }, [isValid, isSubmitting, repositoryQuery.isLoading, dialogState]);
  
  /**
   * Get current progress percentage for accessibility
   */
  const progressPercentage = useMemo(() => {
    if (dialogState === DialogState.IDLE) return 0;
    if (dialogState === DialogState.SUCCESS) return 100;
    return Math.max(progress, repositoryQuery.isLoading ? 25 : 0);
  }, [dialogState, progress, repositoryQuery.isLoading]);
  
  /**
   * Create dialog state context for advanced debugging
   */
  const stateContext: DialogStateContext = useMemo(() => ({
    state: dialogState,
    timestamp: new Date().toISOString(),
    progress: progressPercentage,
    message: stateMessage,
    metadata: {
      requiresAuth,
      repositoryInfo,
      isValid,
      isSubmitting,
      hasErrors: Object.keys(errors).length > 0,
    },
  }), [dialogState, progressPercentage, stateMessage, requiresAuth, repositoryInfo, isValid, isSubmitting, errors]);
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        initialFocus={ariaConfig.initialFocus || initialFocusRef}
        onClose={ariaConfig.trapFocus !== false ? () => {} : handleClose}
        aria-label={ariaConfig['aria-label']}
        aria-labelledby={ariaConfig['aria-labelledby']}
        aria-describedby={ariaConfig['aria-describedby']}
        data-testid={testId}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Dialog container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full max-w-md transform overflow-hidden rounded-lg',
                  'bg-white dark:bg-gray-900 text-left align-middle shadow-xl transition-all',
                  'border border-gray-200 dark:border-gray-700',
                  className
                )}
              >
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                    id="github-dialog-title"
                  >
                    Import Script from GitHub
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Import a script file directly from a GitHub repository. Supports .js, .py, .php, and .txt files.
                  </Dialog.Description>
                </div>

                {/* Progress indicator */}
                {progressPercentage > 0 && (
                  <div className="bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-1 bg-primary-600 transition-all duration-300 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                      role="progressbar"
                      aria-valuenow={progressPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Import progress"
                    />
                  </div>
                )}

                {/* Status message */}
                {stateMessage && (
                  <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">{stateMessage}</p>
                    </div>
                  </div>
                )}

                {/* Main content */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                  {/* URL Input */}
                  <div>
                    <label
                      htmlFor="github-url"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      GitHub File URL
                      <span className="text-red-500 ml-1" aria-label="required">*</span>
                    </label>
                    <Controller
                      name="url"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          ref={initialFocusRef}
                          id="github-url"
                          type="url"
                          placeholder="https://github.com/user/repo/blob/main/script.js"
                          className={cn(
                            'input-accessible w-full px-3 py-2 border rounded-md shadow-sm',
                            'placeholder-gray-400 dark:placeholder-gray-500',
                            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                            'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                            errors.url
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                              : 'border-gray-300 dark:border-gray-600'
                          )}
                          disabled={isSubmitting}
                          aria-invalid={!!errors.url}
                          aria-describedby={errors.url ? 'url-error' : 'url-hint'}
                        />
                      )}
                    />
                    {errors.url && (
                      <p
                        id="url-error"
                        className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center"
                        role="alert"
                      >
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                        {errors.url.message}
                      </p>
                    )}
                    {!errors.url && (
                      <p id="url-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Enter the complete GitHub URL to a script file. The repository can be public or private.
                      </p>
                    )}
                  </div>

                  {/* Authentication fields (shown for private repos) */}
                  {requiresAuth && (
                    <Transition
                      show={requiresAuth}
                      enter="transition-opacity duration-200"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                      leave="transition-opacity duration-150"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center mb-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            Private Repository Detected
                          </p>
                        </div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                          This repository appears to be private. Please provide your GitHub credentials.
                        </p>
                        
                        {/* Username field */}
                        <div>
                          <label
                            htmlFor="github-username"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            GitHub Username
                            <span className="text-red-500 ml-1" aria-label="required">*</span>
                          </label>
                          <Controller
                            name="username"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                id="github-username"
                                type="text"
                                placeholder="your-username"
                                className={cn(
                                  'input-accessible w-full px-3 py-2 border rounded-md shadow-sm',
                                  'placeholder-gray-400 dark:placeholder-gray-500',
                                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                  'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                                  errors.username
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                )}
                                disabled={isSubmitting}
                                aria-invalid={!!errors.username}
                                aria-describedby={errors.username ? 'username-error' : undefined}
                              />
                            )}
                          />
                          {errors.username && (
                            <p
                              id="username-error"
                              className="mt-1 text-sm text-red-600 dark:text-red-400"
                              role="alert"
                            >
                              {errors.username.message}
                            </p>
                          )}
                        </div>

                        {/* Password/Token field */}
                        <div>
                          <label
                            htmlFor="github-token"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Personal Access Token
                            <span className="text-red-500 ml-1" aria-label="required">*</span>
                          </label>
                          <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                id="github-token"
                                type="password"
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                className={cn(
                                  'input-accessible w-full px-3 py-2 border rounded-md shadow-sm',
                                  'placeholder-gray-400 dark:placeholder-gray-500',
                                  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                  'disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed',
                                  errors.password
                                    ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                )}
                                disabled={isSubmitting}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                              />
                            )}
                          />
                          {errors.password && (
                            <p
                              id="password-error"
                              className="mt-1 text-sm text-red-600 dark:text-red-400"
                              role="alert"
                            >
                              {errors.password.message}
                            </p>
                          )}
                          {!errors.password && (
                            <p id="password-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Use a personal access token instead of your password for better security.
                              <a
                                href="https://github.com/settings/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
                              >
                                Create token
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                    </Transition>
                  )}

                  {/* Repository info (if available) */}
                  {repositoryInfo && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                      <div className="flex items-center mb-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Repository Found
                        </p>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {repositoryInfo.full_name} • {repositoryInfo.private ? 'Private' : 'Public'}
                        {repositoryInfo.description && ` • ${repositoryInfo.description}`}
                      </p>
                    </div>
                  )}

                  {/* Debug information (development only) */}
                  {showDebugInfo && process.env.NODE_ENV === 'development' && (
                    <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Debug Information
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                        {JSON.stringify(stateContext, null, 2)}
                      </pre>
                    </details>
                  )}
                </form>

                {/* Footer actions */}
                <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                  <button
                    ref={finalFocusRef}
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className={cn(
                      'btn-accessible px-4 py-2 text-sm font-medium rounded-md',
                      'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700',
                      'border border-gray-300 dark:border-gray-600',
                      'hover:bg-gray-50 dark:hover:bg-gray-600',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="github-import-form"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitDisabled}
                    className={cn(
                      'btn-accessible px-4 py-2 text-sm font-medium rounded-md',
                      'text-white bg-primary-600 hover:bg-primary-700',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'flex items-center space-x-2'
                    )}
                  >
                    {isSubmitting && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{isSubmitting ? 'Importing...' : 'Import Script'}</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Export component and types for external usage
export default ScriptsGithubDialog;
export type { ScriptsGithubDialogProps, GitHubScriptContent, GitHubDialogError };