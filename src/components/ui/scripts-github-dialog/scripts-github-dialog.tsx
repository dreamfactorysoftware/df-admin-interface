/**
 * @fileoverview GitHub Scripts Import Dialog Component
 * 
 * React 19 GitHub script import dialog implementing WCAG 2.1 AA accessibility standards
 * using Headless UI Dialog primitive and Tailwind CSS. Replaces Angular DfScriptsGithubDialogComponent
 * with React Hook Form for URL validation, React Query for GitHub API calls, and dynamic
 * authentication handling for private repositories.
 * 
 * Features:
 * - Real-time URL validation with debounced GitHub API calls
 * - File extension filtering (.js, .py, .php, .txt)
 * - Repository privacy detection with dynamic credential input fields
 * - Promise-based API for modern React workflows
 * - WCAG 2.1 AA compliance with focus management and screen reader support
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  forwardRef,
  useImperativeHandle
} from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  ExternalLink, 
  Eye, 
  FileText, 
  Folder, 
  Github, 
  Key, 
  Loader2, 
  Lock, 
  LockOpen, 
  Search,
  Shield,
  X 
} from 'lucide-react';

import { Dialog } from '../dialog/dialog';
import { Button } from '../button/button';
import { Input } from '../input/input';
import { cn, debounce } from '@/lib/utils';

import type {
  ScriptsGithubDialogProps,
  ScriptsGithubDialogRef,
  GitHubImportFormData,
  GitHubRepositoryInfo,
  GitHubFileInfo,
  GitHubAuthCredentials,
  ScriptImportResult,
  GitHubImportError,
  DialogState,
  ScriptFileExtension,
  ScriptValidationResult
} from './types';

/**
 * Zod validation schema for GitHub import form
 * Implements comprehensive validation with real-time feedback
 */
const githubImportSchema = z.object({
  repository: z.object({
    url: z.string()
      .url('Please enter a valid GitHub repository URL')
      .refine(
        (url) => {
          const githubUrlPattern = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
          return githubUrlPattern.test(url);
        },
        { message: 'URL must be a valid GitHub repository (https://github.com/owner/repo)' }
      ),
    branch: z.string().min(1, 'Branch name is required').default('main'),
    isPrivate: z.boolean().default(false),
    owner: z.string().optional(),
    name: z.string().optional(),
  }),
  authentication: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(['personal_access_token', 'oauth_token', 'basic_auth', 'none']).default('none'),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    rememberCredentials: z.boolean().default(false),
    isTokenValid: z.boolean().optional(),
    tokenValidationError: z.string().optional(),
  }),
  fileSelection: z.object({
    selectedFiles: z.array(z.string()).default([]),
    includeSubdirectories: z.boolean().default(true),
    fileTypeFilter: z.array(z.enum([
      '.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.rb', 
      '.java', '.cs', '.go', '.rs', '.sql', '.sh', '.ps1', 
      '.lua', '.pl', '.txt'
    ])).default(['.js', '.ts', '.jsx', '.tsx', '.py', '.php']),
    maxFileSizeFilter: z.number().optional(),
    excludePatterns: z.array(z.string()).default([]),
    includePatterns: z.array(z.string()).default([]),
    customFilter: z.string().optional(),
  }),
  importOptions: z.object({
    targetDirectory: z.string().default('/scripts'),
    namingStrategy: z.enum(['preserve', 'prefix_repo', 'prefix_branch', 'custom_prefix', 'suffix_timestamp', 'suffix_hash']).default('preserve'),
    conflictResolution: z.enum(['skip', 'overwrite', 'rename', 'merge', 'prompt', 'version']).default('prompt'),
    preserveStructure: z.boolean().default(true),
    addMetadata: z.boolean().default(true),
    validateBeforeImport: z.boolean().default(true),
    createBackup: z.boolean().default(false),
    batchSize: z.number().min(1).max(50).default(10),
    enableProgressNotifications: z.boolean().default(true),
  }),
  metadata: z.object({
    formVersion: z.string().default('1.0.0'),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    userId: z.string().optional(),
    sessionId: z.string().default(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`),
  }),
}).refine(
  (data) => {
    // If authentication is enabled for private repos, require token or username/password
    if (data.authentication.enabled && data.repository.isPrivate) {
      if (data.authentication.type === 'personal_access_token' || data.authentication.type === 'oauth_token') {
        return !!data.authentication.token;
      }
      if (data.authentication.type === 'basic_auth') {
        return !!data.authentication.username && !!data.authentication.password;
      }
    }
    return true;
  },
  {
    message: 'Authentication credentials are required for private repositories',
    path: ['authentication'],
  }
);

/**
 * Mock GitHub API service
 * In production, this would be replaced with actual GitHub API integration
 */
const useGithubApi = () => {
  const validateRepository = useMutation({
    mutationFn: async (url: string): Promise<GitHubRepositoryInfo> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract owner and repo from URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL format');
      }
      
      const [, owner, repoName] = match;
      
      // Mock repository data
      const mockRepo: GitHubRepositoryInfo = {
        id: Math.floor(Math.random() * 1000000),
        name: repoName.replace(/\.git$/, ''),
        fullName: `${owner}/${repoName.replace(/\.git$/, '')}`,
        description: 'A sample repository for script imports',
        owner: {
          login: owner,
          id: Math.floor(Math.random() * 100000),
          type: 'User' as const,
          avatarUrl: `https://github.com/${owner}.png`,
          htmlUrl: `https://github.com/${owner}`,
        },
        isPrivate: Math.random() > 0.7, // 30% chance of private repo
        isFork: false,
        defaultBranch: 'main',
        language: 'JavaScript',
        size: Math.floor(Math.random() * 10000),
        starCount: Math.floor(Math.random() * 1000),
        forkCount: Math.floor(Math.random() * 100),
        updatedAt: new Date().toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        cloneUrl: url,
        htmlUrl: url,
        topics: ['javascript', 'scripts', 'automation'],
        isArchived: false,
        isDisabled: false,
      };
      
      return mockRepo;
    },
  });

  const fetchRepositoryFiles = useMutation({
    mutationFn: async ({ 
      repository, 
      credentials, 
      fileTypes 
    }: {
      repository: GitHubRepositoryInfo;
      credentials?: GitHubAuthCredentials;
      fileTypes: ScriptFileExtension[];
    }): Promise<GitHubFileInfo[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock file data
      const mockFiles: GitHubFileInfo[] = [
        {
          name: 'utils.js',
          path: 'src/utils.js',
          sha: 'abc123',
          size: 2048,
          type: 'file',
          downloadUrl: `${repository.htmlUrl}/raw/main/src/utils.js`,
          gitUrl: `${repository.htmlUrl}/git/blobs/abc123`,
          htmlUrl: `${repository.htmlUrl}/blob/main/src/utils.js`,
          language: 'JavaScript',
        },
        {
          name: 'helper.py',
          path: 'scripts/helper.py',
          sha: 'def456',
          size: 1024,
          type: 'file',
          downloadUrl: `${repository.htmlUrl}/raw/main/scripts/helper.py`,
          gitUrl: `${repository.htmlUrl}/git/blobs/def456`,
          htmlUrl: `${repository.htmlUrl}/blob/main/scripts/helper.py`,
          language: 'Python',
        },
        {
          name: 'config.php',
          path: 'config/config.php',
          sha: 'ghi789',
          size: 512,
          type: 'file',
          downloadUrl: `${repository.htmlUrl}/raw/main/config/config.php`,
          gitUrl: `${repository.htmlUrl}/git/blobs/ghi789`,
          htmlUrl: `${repository.htmlUrl}/blob/main/config/config.php`,
          language: 'PHP',
        },
      ];
      
      // Filter by file types
      return mockFiles.filter(file => 
        fileTypes.some(ext => file.name.endsWith(ext))
      );
    },
  });

  const importFiles = useMutation({
    mutationFn: async ({
      repository,
      selectedFiles,
      credentials,
      options
    }: {
      repository: GitHubRepositoryInfo;
      selectedFiles: GitHubFileInfo[];
      credentials?: GitHubAuthCredentials;
      options: any;
    }): Promise<ScriptImportResult> => {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: ScriptImportResult = {
        success: true,
        importedFiles: selectedFiles.map(file => ({
          fileName: file.name,
          filePath: `${options.targetDirectory}/${file.name}`,
          originalUrl: file.htmlUrl,
          fileSize: file.size,
          contentType: file.language === 'JavaScript' ? 'application/javascript' : 'text/plain',
          language: file.language || 'Unknown',
          importedAt: new Date(),
          validationResult: {
            isValid: true,
            errors: [],
            warnings: [],
            info: [],
            metadata: {
              language: file.language || 'Unknown',
              lineCount: Math.floor(file.size / 50),
              characterCount: file.size,
              codeLines: Math.floor(file.size / 60),
              commentLines: Math.floor(file.size / 200),
              blankLines: Math.floor(file.size / 100),
              encoding: 'utf-8',
              fileSize: file.size,
              functionCount: Math.floor(Math.random() * 10),
              classCount: Math.floor(Math.random() * 5),
              variableCount: Math.floor(Math.random() * 20),
            },
            performance: {
              totalTime: Math.floor(Math.random() * 1000),
              syntaxTime: Math.floor(Math.random() * 100),
              memoryUsage: Math.floor(Math.random() * 1000000),
              cacheHitRatio: Math.random(),
            },
            validatedAt: new Date(),
            validatedBy: 'GitHub Import Validator',
            validationConfig: 'default',
          },
          fileHash: `sha256_${Math.random().toString(36).substr(2, 32)}`,
          encoding: 'utf-8',
          lineCount: Math.floor(file.size / 50),
          characterCount: file.size,
          metadata: {
            language: file.language || 'Unknown',
            lineCount: Math.floor(file.size / 50),
            characterCount: file.size,
            codeLines: Math.floor(file.size / 60),
            commentLines: Math.floor(file.size / 200),
            blankLines: Math.floor(file.size / 100),
            encoding: 'utf-8',
            fileSize: file.size,
            functionCount: Math.floor(Math.random() * 10),
            classCount: Math.floor(Math.random() * 5),
            variableCount: Math.floor(Math.random() * 20),
          },
        })),
        skippedFiles: [],
        failedFiles: [],
        errors: [],
        warnings: [],
        statistics: {
          totalFilesProcessed: selectedFiles.length,
          successfulImports: selectedFiles.length,
          failedImports: 0,
          skippedImports: 0,
          totalProcessingTime: 2000,
          averageProcessingTime: 2000 / selectedFiles.length,
          fastestProcessingTime: 500,
          slowestProcessingTime: 3000,
          totalBytesProcessed: selectedFiles.reduce((sum, file) => sum + file.size, 0),
          averageFileSize: selectedFiles.reduce((sum, file) => sum + file.size, 0) / selectedFiles.length,
          largestFileSize: Math.max(...selectedFiles.map(file => file.size)),
          smallestFileSize: Math.min(...selectedFiles.map(file => file.size)),
          fileTypeDistribution: {} as Record<ScriptFileExtension, number>,
          languageDistribution: {},
          validationSuccessRate: 100,
          processingSuccessRate: 100,
          memoryUsage: {
            peak: 50000000,
            average: 25000000,
            final: 20000000,
          },
          networkStatistics: {
            totalRequests: selectedFiles.length + 1,
            totalBytes: selectedFiles.reduce((sum, file) => sum + file.size, 0),
            averageResponseTime: 500,
            cacheHitRate: 0.8,
          },
        },
        sourceRepository: repository,
        importConfig: options,
        importedAt: new Date(),
        importDuration: 2000,
        sessionId: `import_${Date.now()}`,
      };
      
      return mockResult;
    },
  });

  return {
    validateRepository,
    fetchRepositoryFiles,
    importFiles,
  };
};

/**
 * Main GitHub Scripts Import Dialog Component
 * 
 * Implements WCAG 2.1 AA accessibility standards with comprehensive
 * GitHub repository integration for script file imports.
 */
export const ScriptsGithubDialog = forwardRef<ScriptsGithubDialogRef, ScriptsGithubDialogProps>(
  ({
    repositoryUrl = '',
    allowedFileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.php'],
    maxFileSize = 1048576, // 1MB
    enablePrivateRepos = true,
    authCredentials,
    validationConfig,
    onImportComplete,
    onImportCancel,
    onImportError,
    validateScriptContent,
    repositoryFilter,
    apiBaseUrl = 'https://api.github.com',
    requestTimeout = 10000,
    enablePreview = true,
    a11y = {},
    'data-testid': dataTestId = 'scripts-github-dialog',
    ...dialogProps
  }, ref) => {
    // Internationalization
    const { t } = useTranslation('scripts');
    
    // Dialog state management
    const [dialogState, setDialogState] = useState<DialogState>('idle' as DialogState);
    const [currentRepository, setCurrentRepository] = useState<GitHubRepositoryInfo | null>(null);
    const [availableFiles, setAvailableFiles] = useState<GitHubFileInfo[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<GitHubFileInfo[]>([]);
    const [importProgress, setImportProgress] = useState(0);
    
    // API hooks
    const githubApi = useGithubApi();
    
    // Form management
    const form = useForm<GitHubImportFormData>({
      resolver: zodResolver(githubImportSchema),
      defaultValues: {
        repository: {
          url: repositoryUrl,
          branch: 'main',
          isPrivate: false,
        },
        authentication: {
          enabled: false,
          type: 'none',
          rememberCredentials: false,
        },
        fileSelection: {
          selectedFiles: [],
          includeSubdirectories: true,
          fileTypeFilter: allowedFileTypes,
          excludePatterns: [],
          includePatterns: [],
        },
        importOptions: {
          targetDirectory: '/scripts',
          namingStrategy: 'preserve',
          conflictResolution: 'prompt',
          preserveStructure: true,
          addMetadata: true,
          validateBeforeImport: true,
          createBackup: false,
          batchSize: 10,
          enableProgressNotifications: true,
        },
        metadata: {
          formVersion: '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      },
      mode: 'onChange',
    });

    const { 
      control, 
      handleSubmit, 
      watch, 
      setValue, 
      formState: { errors, isValid, isDirty },
      reset: resetForm,
      trigger
    } = form;

    // Watch form values for dynamic behavior
    const repositoryUrl_ = watch('repository.url');
    const authEnabled = watch('authentication.enabled');
    const authType = watch('authentication.type');
    const isPrivateRepo = watch('repository.isPrivate');
    const selectedFilesList = watch('fileSelection.selectedFiles');

    // Refs for imperative API
    const dialogRef = useRef<HTMLDivElement>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    // Debounced repository validation
    const debouncedValidateRepository = useMemo(
      () => debounce(async (url: string) => {
        if (!url || !url.includes('github.com')) return;
        
        try {
          setDialogState('validating' as DialogState);
          const repository = await githubApi.validateRepository.mutateAsync(url);
          setCurrentRepository(repository);
          setValue('repository.isPrivate', repository.isPrivate);
          setValue('repository.owner', repository.owner.login);
          setValue('repository.name', repository.name);
          setValue('authentication.enabled', repository.isPrivate);
          setDialogState('idle' as DialogState);
        } catch (error) {
          console.error('Repository validation failed:', error);
          setCurrentRepository(null);
          setDialogState('error' as DialogState);
          onImportError?.(error as GitHubImportError);
        }
      }, 500),
      [githubApi.validateRepository, setValue, onImportError]
    );

    // Effect to validate repository URL changes
    useEffect(() => {
      if (repositoryUrl_) {
        debouncedValidateRepository(repositoryUrl_);
      } else {
        setCurrentRepository(null);
        setDialogState('idle' as DialogState);
      }
    }, [repositoryUrl_, debouncedValidateRepository]);

    // Fetch files when repository is validated and private repo auth is handled
    const handleFetchFiles = useCallback(async () => {
      if (!currentRepository) return;
      
      try {
        setDialogState('fetching' as DialogState);
        const credentials = authEnabled ? {
          type: authType,
          token: form.getValues('authentication.token'),
          username: form.getValues('authentication.username'),
          scopes: ['repo'],
        } as GitHubAuthCredentials : undefined;

        const files = await githubApi.fetchRepositoryFiles.mutateAsync({
          repository: currentRepository,
          credentials,
          fileTypes: allowedFileTypes,
        });
        
        setAvailableFiles(files);
        setDialogState('selecting' as DialogState);
      } catch (error) {
        console.error('Failed to fetch repository files:', error);
        setDialogState('error' as DialogState);
        onImportError?.(error as GitHubImportError);
      }
    }, [
      currentRepository, 
      authEnabled, 
      authType, 
      allowedFileTypes, 
      githubApi.fetchRepositoryFiles, 
      form, 
      onImportError
    ]);

    // Handle file selection
    const handleFileSelect = useCallback((file: GitHubFileInfo, selected: boolean) => {
      const currentSelected = selectedFiles;
      let newSelected: GitHubFileInfo[];
      
      if (selected) {
        newSelected = [...currentSelected, file];
      } else {
        newSelected = currentSelected.filter(f => f.path !== file.path);
      }
      
      setSelectedFiles(newSelected);
      setValue('fileSelection.selectedFiles', newSelected.map(f => f.path));
    }, [selectedFiles, setValue]);

    // Handle import execution
    const handleImport = useCallback(async (formData: GitHubImportFormData) => {
      if (!currentRepository || selectedFiles.length === 0) return;
      
      try {
        setDialogState('importing' as DialogState);
        setImportProgress(0);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setImportProgress(prev => Math.min(prev + 10, 90));
        }, 200);
        
        const credentials = formData.authentication.enabled ? {
          type: formData.authentication.type,
          token: formData.authentication.token,
          username: formData.authentication.username,
          scopes: ['repo'],
        } as GitHubAuthCredentials : undefined;

        const result = await githubApi.importFiles.mutateAsync({
          repository: currentRepository,
          selectedFiles,
          credentials,
          options: formData.importOptions,
        });
        
        clearInterval(progressInterval);
        setImportProgress(100);
        setDialogState('success' as DialogState);
        
        // Announce success to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
        announcement.textContent = t('import.success.announcement', { 
          count: result.importedFiles.length 
        }) || `Successfully imported ${result.importedFiles.length} files`;
        document.body.appendChild(announcement);
        setTimeout(() => {
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
        }, 1000);
        
        onImportComplete?.(result);
        
      } catch (error) {
        console.error('Import failed:', error);
        setDialogState('error' as DialogState);
        onImportError?.(error as GitHubImportError);
      }
    }, [
      currentRepository, 
      selectedFiles, 
      githubApi.importFiles, 
      onImportComplete, 
      onImportError,
      t
    ]);

    // Handle dialog close
    const handleClose = useCallback((reason?: string) => {
      if (dialogState === 'importing') {
        // Prevent closing during import
        return;
      }
      
      setDialogState('cancelled' as DialogState);
      resetForm();
      setCurrentRepository(null);
      setAvailableFiles([]);
      setSelectedFiles([]);
      setImportProgress(0);
      onImportCancel?.();
    }, [dialogState, resetForm, onImportCancel]);

    // Imperative API for ref
    useImperativeHandle(ref, () => ({
      open: () => {
        if (dialogProps.open === undefined) {
          // Only control if uncontrolled
          setDialogState('idle' as DialogState);
        }
      },
      close: () => handleClose('api'),
      reset: () => {
        resetForm();
        setCurrentRepository(null);
        setAvailableFiles([]);
        setSelectedFiles([]);
        setImportProgress(0);
        setDialogState('idle' as DialogState);
      },
      getState: () => dialogState,
      getFormData: () => form.getValues(),
      getValidationErrors: () => errors,
      validateForm: () => trigger(),
      submitForm: () => handleSubmit(handleImport)(),
      updateProgress: (progress) => setImportProgress(progress.stepProgress || 0),
      setError: (error) => {
        if (error) {
          setDialogState('error' as DialogState);
          onImportError?.(error);
        } else {
          setDialogState('idle' as DialogState);
        }
      },
      focusField: (fieldName) => {
        if (fieldName === 'repository.url') {
          urlInputRef.current?.focus();
        }
      },
    }), [
      dialogState, 
      dialogProps.open, 
      handleClose, 
      resetForm, 
      form, 
      errors, 
      trigger, 
      handleSubmit, 
      handleImport,
      onImportError
    ]);

    // Render repository validation status
    const renderRepositoryStatus = () => {
      if (githubApi.validateRepository.isPending) {
        return (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>{t('repository.validating') || 'Validating repository...'}</span>
          </div>
        );
      }

      if (currentRepository) {
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{t('repository.valid') || 'Repository found'}</span>
            {currentRepository.isPrivate && (
              <div className="flex items-center gap-1 ml-2">
                <Lock className="h-3 w-3" aria-hidden="true" />
                <span className="text-xs">{t('repository.private') || 'Private'}</span>
              </div>
            )}
          </div>
        );
      }

      if (githubApi.validateRepository.error) {
        return (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <span>{t('repository.error') || 'Repository not found or invalid'}</span>
          </div>
        );
      }

      return null;
    };

    // Render file list
    const renderFileList = () => {
      if (availableFiles.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2" aria-hidden="true" />
            <p>{t('files.none_found') || 'No script files found in this repository'}</p>
          </div>
        );
      }

      return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableFiles.map((file) => {
            const isSelected = selectedFiles.some(f => f.path === file.path);
            return (
              <label
                key={file.path}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
                  isSelected 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleFileSelect(file, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-describedby={`file-${file.path}-description`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </span>
                    {file.language && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {file.language}
                      </span>
                    )}
                  </div>
                  <div 
                    id={`file-${file.path}-description`}
                    className="text-sm text-gray-500 dark:text-gray-400 truncate"
                  >
                    {file.path} • {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                {enablePreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(file.htmlUrl, '_blank', 'noopener,noreferrer');
                    }}
                    aria-label={t('files.preview', { fileName: file.name }) || `Preview ${file.name}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </label>
            );
          })}
        </div>
      );
    };

    // Render import progress
    const renderImportProgress = () => {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('import.importing') || 'Importing Files...'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('import.progress', { count: selectedFiles.length }) || 
               `Importing ${selectedFiles.length} selected files`}
            </p>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
              role="progressbar"
              aria-valuenow={importProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('import.progress_label') || 'Import progress'}
            />
          </div>
          
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {importProgress}% {t('import.complete') || 'complete'}
          </div>
        </div>
      );
    };

    // Render success state
    const renderSuccess = () => {
      return (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('import.success.title') || 'Import Successful!'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('import.success.message', { count: selectedFiles.length }) || 
             `Successfully imported ${selectedFiles.length} files to your script library.`}
          </p>
          <Button onClick={() => handleClose('success')}>
            {t('import.success.done') || 'Done'}
          </Button>
        </div>
      );
    };

    // Render error state
    const renderError = () => {
      const error = githubApi.validateRepository.error || githubApi.fetchRepositoryFiles.error || githubApi.importFiles.error;
      
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('import.error.title') || 'Import Failed'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || t('import.error.message') || 'An error occurred during the import process.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setDialogState('idle' as DialogState)}
            >
              {t('import.error.retry') || 'Try Again'}
            </Button>
            <Button onClick={() => handleClose('error')}>
              {t('import.error.close') || 'Close'}
            </Button>
          </div>
        </div>
      );
    };

    // Main dialog content based on state
    const renderDialogContent = () => {
      switch (dialogState) {
        case 'importing':
          return renderImportProgress();
        case 'success':
          return renderSuccess();
        case 'error':
          return renderError();
        default:
          return (
            <form onSubmit={handleSubmit(handleImport)} className="space-y-6">
              {/* Repository URL Input */}
              <div className="space-y-2">
                <label 
                  htmlFor="repository-url"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t('repository.url_label') || 'GitHub Repository URL'}
                  <span className="text-red-500 ml-1" aria-label="required">*</span>
                </label>
                <Controller
                  name="repository.url"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      ref={urlInputRef}
                      id="repository-url"
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      error={errors.repository?.url?.message}
                      prefix={<Github className="h-4 w-4" />}
                      aria-describedby="repository-url-help"
                      data-testid="repository-url-input"
                    />
                  )}
                />
                <div id="repository-url-help" className="text-xs text-gray-500 dark:text-gray-400">
                  {t('repository.url_help') || 'Enter the complete GitHub repository URL'}
                </div>
                {renderRepositoryStatus()}
              </div>

              {/* Authentication Section */}
              {currentRepository?.isPrivate && (
                <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {t('auth.private_repo.title') || 'Private Repository Authentication'}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('auth.private_repo.description') || 
                     'This repository is private. Please provide authentication credentials to access it.'}
                  </p>

                  <div className="space-y-3">
                    <Controller
                      name="authentication.type"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('auth.type_label') || 'Authentication Method'}
                          </label>
                          <select 
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="personal_access_token">
                              {t('auth.types.pat') || 'Personal Access Token'}
                            </option>
                            <option value="oauth_token">
                              {t('auth.types.oauth') || 'OAuth Token'}
                            </option>
                            <option value="basic_auth">
                              {t('auth.types.basic') || 'Username & Password'}
                            </option>
                          </select>
                        </div>
                      )}
                    />

                    {(authType === 'personal_access_token' || authType === 'oauth_token') && (
                      <Controller
                        name="authentication.token"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="password"
                            placeholder={t('auth.token_placeholder') || 'Enter your access token'}
                            error={errors.authentication?.token?.message}
                            prefix={<Key className="h-4 w-4" />}
                            aria-label={t('auth.token_label') || 'Access token'}
                          />
                        )}
                      />
                    )}

                    {authType === 'basic_auth' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Controller
                          name="authentication.username"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              placeholder={t('auth.username_placeholder') || 'Username'}
                              error={errors.authentication?.username?.message}
                              aria-label={t('auth.username_label') || 'GitHub username'}
                            />
                          )}
                        />
                        <Controller
                          name="authentication.password"
                          control={control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              type="password"
                              placeholder={t('auth.password_placeholder') || 'Password'}
                              error={errors.authentication?.password?.message}
                              aria-label={t('auth.password_label') || 'GitHub password'}
                            />
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* File Selection */}
              {currentRepository && availableFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {t('files.select_title') || 'Select Files to Import'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedFiles.length} {t('files.selected') || 'selected'}
                    </span>
                  </div>
                  {renderFileList()}
                </div>
              )}

              {/* Import Options */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {t('options.title') || 'Import Options'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="importOptions.targetDirectory"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('options.target_directory') || 'Target Directory'}
                          </label>
                          <Input
                            {...field}
                            placeholder="/scripts"
                            prefix={<Folder className="h-4 w-4" />}
                          />
                        </div>
                      )}
                    />
                    
                    <Controller
                      name="importOptions.conflictResolution"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('options.conflict_resolution') || 'If File Exists'}
                          </label>
                          <select 
                            {...field}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="prompt">{t('options.conflicts.prompt') || 'Ask me'}</option>
                            <option value="skip">{t('options.conflicts.skip') || 'Skip'}</option>
                            <option value="overwrite">{t('options.conflicts.overwrite') || 'Overwrite'}</option>
                            <option value="rename">{t('options.conflicts.rename') || 'Rename'}</option>
                          </select>
                        </div>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Controller
                      name="importOptions.validateBeforeImport"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={onChange}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {t('options.validate') || 'Validate files before import'}
                          </span>
                        </label>
                      )}
                    />
                    
                    <Controller
                      name="importOptions.preserveStructure"
                      control={control}
                      render={({ field: { value, onChange } }) => (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={onChange}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {t('options.preserve_structure') || 'Preserve folder structure'}
                          </span>
                        </label>
                      )}
                    />
                  </div>
                </div>
              )}
            </form>
          );
      }
    };

    // Dialog footer buttons based on state
    const renderDialogFooter = () => {
      switch (dialogState) {
        case 'importing':
        case 'success':
        case 'error':
          return null;
        default:
          return (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => handleClose('cancel')}
                disabled={githubApi.validateRepository.isPending}
              >
                {t('actions.cancel') || 'Cancel'}
              </Button>
              
              <div className="flex items-center gap-2">
                {currentRepository && availableFiles.length === 0 && (
                  <Button
                    onClick={handleFetchFiles}
                    disabled={githubApi.fetchRepositoryFiles.isPending}
                    loading={githubApi.fetchRepositoryFiles.isPending}
                  >
                    {t('actions.fetch_files') || 'Load Files'}
                  </Button>
                )}
                
                {selectedFiles.length > 0 && (
                  <Button
                    type="submit"
                    onClick={handleSubmit(handleImport)}
                    disabled={!isValid || githubApi.importFiles.isPending}
                    loading={githubApi.importFiles.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t('actions.import', { count: selectedFiles.length }) || 
                     `Import ${selectedFiles.length} files`}
                  </Button>
                )}
              </div>
            </div>
          );
      }
    };

    return (
      <Dialog
        {...dialogProps}
        onClose={handleClose}
        className="max-w-4xl"
        data-testid={dataTestId}
        aria-labelledby="github-dialog-title"
        aria-describedby="github-dialog-description"
      >
        <Dialog.Header>
          <Dialog.Title id="github-dialog-title">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" aria-hidden="true" />
              {t('dialog.title') || 'Import Scripts from GitHub'}
            </div>
          </Dialog.Title>
          <Dialog.Description id="github-dialog-description">
            {t('dialog.description') || 
             'Import script files directly from GitHub repositories into your script library.'}
          </Dialog.Description>
        </Dialog.Header>

        <Dialog.Content className="max-h-[70vh] overflow-y-auto">
          {renderDialogContent()}
        </Dialog.Content>

        {renderDialogFooter() && (
          <Dialog.Footer>
            {renderDialogFooter()}
          </Dialog.Footer>
        )}
      </Dialog>
    );
  }
);

ScriptsGithubDialog.displayName = 'ScriptsGithubDialog';

export default ScriptsGithubDialog;
export type { ScriptsGithubDialogProps, ScriptsGithubDialogRef };