/**
 * @fileoverview Script Editor Component
 * 
 * Comprehensive React 19 script editor component migrated from Angular df-script-editor.
 * Provides full-featured script editing with ACE editor integration, file upload,
 * GitHub import, storage service management, and intelligent caching. Implements
 * React Hook Form with Zod validation for real-time validation under 100ms,
 * React Query for API operations with cache hit responses under 50ms, and
 * Tailwind CSS styling with WCAG 2.1 AA accessibility compliance.
 * 
 * Features:
 * - React 19 functional component with TypeScript 5.8+ strict typing
 * - React Hook Form integration with Zod validation for type-safe form handling  
 * - React Query for intelligent caching and API synchronization
 * - ACE editor integration with syntax highlighting and auto-completion
 * - File upload functionality with progress tracking and validation
 * - GitHub import dialog with repository access validation
 * - Storage service selection and path validation
 * - Cache management with optimistic updates
 * - Dark theme support via Zustand store integration
 * - WCAG 2.1 AA accessibility compliance with ARIA attributes
 * - Real-time validation under 100ms performance requirement
 * - Controlled component pattern for parent form integration
 * 
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 * @author DreamFactory Admin Interface Team
 * @license MIT
 */

'use client';

import React, {
  forwardRef,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useImperativeHandle,
  memo,
} from 'react';
import { Controller } from 'react-hook-form';
import { 
  Upload, 
  Download, 
  Github, 
  Save, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileText,
  Code,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Copy,
  Search,
  RotateCcw,
  MoreVertical,
  FolderOpen,
  Clock,
  Info,
} from 'lucide-react';

// Component imports
import { AceEditor } from '../ace-editor/ace-editor';
import { Button } from '../button/button';
import { FormField } from '../form/form-field';
import { FormLabel } from '../form/form-label';
import { Input } from '../input/input';
import { ScriptsGithubDialog } from '../scripts-github-dialog/scripts-github-dialog';

// Hook imports
import { useScriptEditor } from './hooks/use-script-editor';
import { useTheme } from '../../../hooks/use-theme';

// Utility imports
import { cn, debounce, formatBytes, formatDuration } from '../../../lib/utils';

// Type imports
import type {
  ScriptEditorProps,
  ScriptType,
  ScriptSource,
  ScriptContext,
  StorageService,
  ScriptFile,
  FileUploadState,
  ScriptEditorValidation,
  ScriptEditorAccessibility,
  ScriptEditorTheme,
  ScriptEditorActions,
  scriptTypeToAceMode,
  defaultEditorConfig,
} from './types';
import type { 
  AceEditorRef, 
  AceEditorMode,
  AceEditorConfig,
} from '../ace-editor/types';
import type { ComponentSize, ComponentVariant } from '../../../types/ui';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default script editor configuration with performance optimization
 */
const DEFAULT_EDITOR_CONFIG: ScriptEditorProps = {
  scriptType: ScriptType.JAVASCRIPT,
  context: ScriptContext.CUSTOM_SERVICE,
  source: ScriptSource.INLINE,
  size: 'md',
  variant: 'default',
  enableFileUpload: true,
  allowedFileTypes: ['.js', '.py', '.php', '.json', '.yaml', '.yml', '.txt'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  showLineNumbers: true,
  showMinimap: false,
  wordWrap: false,
  showInvisibles: false,
  autoSave: {
    enabled: false,
    interval: 30000, // 30 seconds
    indicator: true,
  },
  theme: {
    mode: 'auto',
  },
  validation: {
    required: false,
    min_length: 0,
    max_length: 1000000,
    syntax_validation: true,
    real_time_validation: true,
  },
  accessibility: {
    'aria-label': 'Script editor',
    tabIndex: 0,
    announceChanges: true,
  },
  debounceInterval: 100,
  virtualized: false,
  lazyLoad: true,
};

/**
 * Script type display names for UI
 */
const SCRIPT_TYPE_LABELS: Record<ScriptType, string> = {
  [ScriptType.NODEJS]: 'Node.js',
  [ScriptType.PHP]: 'PHP',
  [ScriptType.PYTHON]: 'Python 2.x',
  [ScriptType.PYTHON3]: 'Python 3.x',
  [ScriptType.JAVASCRIPT]: 'JavaScript',
  [ScriptType.JSON]: 'JSON',
  [ScriptType.YAML]: 'YAML',
  [ScriptType.TEXT]: 'Plain Text',
};

/**
 * Action button configurations with accessibility
 */
const DEFAULT_ACTIONS: Required<ScriptEditorActions> = {
  save: true,
  load: true,
  download: true,
  copy: true,
  format: true,
  validate: true,
  fullscreen: true,
  custom: [],
};

/**
 * Performance thresholds for monitoring
 */
const PERFORMANCE_THRESHOLDS = {
  VALIDATION_TIME: 100, // ms - requirement from spec
  CACHE_HIT_TIME: 50, // ms - requirement from spec  
  RENDER_TIME: 16, // ms - 60fps target
  DEBOUNCE_TIME: 100, // ms - optimized for responsiveness
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Determines if content is likely minified for display optimization
 */
function isContentMinified(content: string): boolean {
  if (!content || content.length < 1000) return false;
  
  const lines = content.split('\n');
  const avgLineLength = content.length / lines.length;
  
  return lines.length < 10 && avgLineLength > 100;
}

/**
 * Calculates content statistics for display
 */
function getContentStats(content: string): {
  characters: number;
  lines: number;
  words: number;
  size: string;
} {
  const characters = content.length;
  const lines = content.split('\n').length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const size = formatBytes(new Blob([content]).size);
  
  return { characters, lines, words, size };
}

/**
 * Creates accessibility announcement for content changes
 */
function createContentChangeAnnouncement(
  oldContent: string,
  newContent: string,
  scriptType: ScriptType
): string {
  const oldStats = getContentStats(oldContent);
  const newStats = getContentStats(newContent);
  
  if (newStats.characters === 0) {
    return 'Script content cleared';
  }
  
  if (oldStats.characters === 0) {
    return `${SCRIPT_TYPE_LABELS[scriptType]} script loaded with ${newStats.lines} lines`;
  }
  
  const lineDiff = newStats.lines - oldStats.lines;
  if (Math.abs(lineDiff) > 5) {
    return `Script updated: ${lineDiff > 0 ? 'added' : 'removed'} ${Math.abs(lineDiff)} lines`;
  }
  
  return 'Script content updated';
}

// =============================================================================
// SCRIPT EDITOR COMPONENT
// =============================================================================

/**
 * Script Editor Component Implementation
 * 
 * Comprehensive script editing component with all required functionality.
 * Implements controlled component pattern for seamless integration with parent forms
 * while maintaining internal state management for complex editor operations.
 */
export const ScriptEditor = memo(forwardRef<HTMLDivElement, ScriptEditorProps>(
  function ScriptEditor(props, ref) {
    // =============================================================================
    // PROPS DESTRUCTURING AND DEFAULTS
    // =============================================================================
    
    const {
      // Core content properties
      value,
      defaultValue = '',
      scriptType = DEFAULT_EDITOR_CONFIG.scriptType!,
      context = DEFAULT_EDITOR_CONFIG.context!,
      source = DEFAULT_EDITOR_CONFIG.source!,
      
      // ACE Editor integration
      editorConfig: userEditorConfig,
      editorMode: userEditorMode,
      editorTheme = 'auto',
      editorSize = DEFAULT_EDITOR_CONFIG.size!,
      editorRef: userEditorRef,
      
      // React Hook Form integration
      form: userForm,
      validation = DEFAULT_EDITOR_CONFIG.validation!,
      
      // Storage and file management
      storageServices = [],
      selectedStorage,
      enableFileUpload = DEFAULT_EDITOR_CONFIG.enableFileUpload!,
      allowedFileTypes = DEFAULT_EDITOR_CONFIG.allowedFileTypes!,
      maxFileSize = DEFAULT_EDITOR_CONFIG.maxFileSize!,
      
      // UI Configuration
      variant = DEFAULT_EDITOR_CONFIG.variant!,
      size = DEFAULT_EDITOR_CONFIG.size!,
      theme: userTheme = DEFAULT_EDITOR_CONFIG.theme!,
      actions: userActions = DEFAULT_ACTIONS,
      showLineNumbers = DEFAULT_EDITOR_CONFIG.showLineNumbers!,
      showMinimap = DEFAULT_EDITOR_CONFIG.showMinimap!,
      wordWrap = DEFAULT_EDITOR_CONFIG.wordWrap!,
      showInvisibles = DEFAULT_EDITOR_CONFIG.showInvisibles!,
      
      // Accessibility
      accessibility = DEFAULT_EDITOR_CONFIG.accessibility!,
      announceChanges = DEFAULT_EDITOR_CONFIG.accessibility!.announceChanges!,
      highContrast = false,
      
      // State management
      loading: externalLoading = false,
      error: externalError = null,
      disabled = false,
      readonly = false,
      autoSave = DEFAULT_EDITOR_CONFIG.autoSave!,
      
      // Event handlers
      onChange,
      onScriptTypeChange,
      onStorageChange,
      onFileUpload,
      onFileSave,
      onFileLoad,
      onError,
      onFocus,
      onBlur,
      onValidate,
      
      // Advanced features
      collaborative = false,
      versionHistory = false,
      syntaxChecking = true,
      codeCompletion = true,
      codeFolding = true,
      searchReplace = true,
      keyboardShortcuts = {},
      
      // Internationalization
      locale = 'en',
      translations = {},
      
      // Performance optimization
      debounceInterval = DEFAULT_EDITOR_CONFIG.debounceInterval!,
      virtualized = DEFAULT_EDITOR_CONFIG.virtualized!,
      lazyLoad = DEFAULT_EDITOR_CONFIG.lazyLoad!,
      
      // HTML attributes
      className,
      id: userProvidedId,
      style,
      ...htmlProps
    } = props;

    // =============================================================================
    // STATE AND REFS
    // =============================================================================
    
    // Generate stable component ID
    const componentId = useMemo(() => 
      userProvidedId || `script-editor-${Math.random().toString(36).substr(2, 9)}`,
      [userProvidedId]
    );
    
    // Component refs
    const containerRef = useRef<HTMLDivElement>(null);
    const aceEditorRef = useRef<AceEditorRef>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastContentRef = useRef<string>(defaultValue);
    const validationTimeoutRef = useRef<NodeJS.Timeout>();
    
    // Expose ref to parent component
    useImperativeHandle(ref, () => containerRef.current!);
    
    // Internal state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showGithubDialog, setShowGithubDialog] = useState(false);
    const [autoSaveIndicator, setAutoSaveIndicator] = useState(false);
    const [validationInProgress, setValidationInProgress] = useState(false);
    const [lastValidationTime, setLastValidationTime] = useState<number>(0);
    
    // =============================================================================
    // HOOKS INTEGRATION
    // =============================================================================
    
    // Theme management
    const { theme: systemTheme, isDarkMode } = useTheme();
    const resolvedTheme = userTheme.mode === 'auto' ? systemTheme : userTheme.mode;
    
    // Script editor hook integration
    const scriptEditor = useScriptEditor({
      defaultValues: {
        content: value || defaultValue,
        storageServiceId: selectedStorage?.id || '',
        storagePath: '',
        language: scriptType,
        metadata: {
          name: 'Untitled Script',
          description: '',
          version: '1.0.0',
          author: '',
          tags: [],
        },
      },
      validation: {
        mode: 'onChange',
        debounceTime: Math.min(debounceInterval, PERFORMANCE_THRESHOLDS.VALIDATION_TIME),
        reValidateMode: 'onChange',
      },
      storage: {
        services: storageServices,
        pathValidation: {
          requiredWhenServiceSelected: true,
          maxLength: 255,
          minLength: 1,
          allowedPatterns: ['^[a-zA-Z0-9._/-]+$'],
          forbiddenPatterns: ['^\\.', '\\.\\.', '//'],
        },
      },
      fileUpload: {
        acceptedTypes: allowedFileTypes.map(ext => {
          const mimeTypes: Record<string, string> = {
            '.js': 'text/javascript',
            '.py': 'text/python',
            '.php': 'text/x-php',
            '.json': 'application/json',
            '.yaml': 'text/yaml',
            '.yml': 'text/yaml',
            '.txt': 'text/plain',
          };
          return mimeTypes[ext] || 'text/plain';
        }),
        maxSize: maxFileSize,
        multiple: false,
        enableDragDrop: true,
        trackProgress: true,
      },
      onContentChange: onChange,
      onStorageServiceChange: onStorageChange,
      onError,
    });

    // =============================================================================
    // COMPUTED VALUES
    // =============================================================================
    
    // Merge configurations
    const editorConfig: AceEditorConfig = useMemo(() => ({
      ...defaultEditorConfig[scriptType],
      ...userEditorConfig,
      fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14,
      showGutter: showLineNumbers,
      wrap: wordWrap,
      showInvisibles,
      enableBasicAutocompletion: codeCompletion,
      enableLiveAutocompletion: codeCompletion,
      enableSnippets: codeCompletion,
      useSoftTabs: true,
      navigateWithinSoftTabs: true,
      useWorker: syntaxChecking,
    }), [
      scriptType,
      userEditorConfig,
      size,
      showLineNumbers,
      wordWrap,
      showInvisibles,
      codeCompletion,
      syntaxChecking,
    ]);
    
    // Determine ACE editor mode
    const aceMode: AceEditorMode = useMemo(() => 
      userEditorMode || scriptTypeToAceMode[scriptType],
      [userEditorMode, scriptType]
    );
    
    // Merge actions configuration
    const actions: Required<ScriptEditorActions> = useMemo(() => ({
      ...DEFAULT_ACTIONS,
      ...userActions,
    }), [userActions]);
    
    // Combined loading state
    const isLoading = useMemo(() => 
      externalLoading || 
      scriptEditor.loading.isLoading || 
      validationInProgress,
      [externalLoading, scriptEditor.loading.isLoading, validationInProgress]
    );
    
    // Combined error state
    const currentError = useMemo(() => 
      externalError || 
      scriptEditor.error?.message || 
      null,
      [externalError, scriptEditor.error]
    );
    
    // Content statistics
    const contentStats = useMemo(() => {
      const content = scriptEditor.form.watch('content') || '';
      return getContentStats(content);
    }, [scriptEditor.form.watch('content')]);

    // =============================================================================
    // EVENT HANDLERS
    // =============================================================================
    
    /**
     * Handle content changes with debounced validation
     */
    const handleContentChange = useCallback(
      debounce(async (newContent: string) => {
        const startTime = performance.now();
        
        try {
          // Update form value
          scriptEditor.form.setValue('content', newContent, { shouldValidate: false });
          
          // Perform real-time validation if enabled
          if (validation.real_time_validation && syntaxChecking) {
            setValidationInProgress(true);
            
            const isValid = await scriptEditor.utils.validateContent(newContent);
            onValidate?.(isValid, isValid ? [] : ['Syntax validation failed']);
            
            setValidationInProgress(false);
          }
          
          // Track validation performance
          const validationTime = performance.now() - startTime;
          setLastValidationTime(validationTime);
          
          if (validationTime > PERFORMANCE_THRESHOLDS.VALIDATION_TIME) {
            console.warn(`Validation took ${validationTime.toFixed(2)}ms, exceeding threshold of ${PERFORMANCE_THRESHOLDS.VALIDATION_TIME}ms`);
          }
          
          // Create accessibility announcement
          if (announceChanges) {
            const announcement = createContentChangeAnnouncement(
              lastContentRef.current,
              newContent,
              scriptType
            );
            
            // Use live region for announcements
            const liveRegion = document.getElementById(`${componentId}-live-region`);
            if (liveRegion) {
              liveRegion.textContent = announcement;
            }
          }
          
          lastContentRef.current = newContent;
          
          // Trigger external onChange if provided
          onChange?.(newContent, scriptType);
          
        } catch (error) {
          console.error('Content change validation error:', error);
          setValidationInProgress(false);
          onError?.(error instanceof Error ? error.message : 'Validation error', 'content_change');
        }
      }, debounceInterval),
      [
        scriptEditor.form,
        scriptEditor.utils,
        validation.real_time_validation,
        syntaxChecking,
        onValidate,
        announceChanges,
        componentId,
        scriptType,
        onChange,
        onError,
        debounceInterval,
      ]
    );
    
    /**
     * Handle script type changes with mode switching
     */
    const handleScriptTypeChange = useCallback((newType: ScriptType) => {
      scriptEditor.form.setValue('language', newType, { shouldValidate: true });
      onScriptTypeChange?.(newType);
      
      // Announce script type change
      if (announceChanges) {
        const liveRegion = document.getElementById(`${componentId}-live-region`);
        if (liveRegion) {
          liveRegion.textContent = `Script type changed to ${SCRIPT_TYPE_LABELS[newType]}`;
        }
      }
    }, [scriptEditor.form, onScriptTypeChange, announceChanges, componentId]);
    
    /**
     * Handle file upload with progress tracking
     */
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      const file = files[0];
      
      try {
        // Validate file
        const isValid = scriptEditor.fileUpload.validateFile(file);
        if (!isValid) {
          throw new Error('Invalid file type or size');
        }
        
        // Upload file
        await scriptEditor.fileUpload.uploadFile(file);
        
        // Call external handler if provided
        if (onFileUpload) {
          const scriptFile: ScriptFile = {
            id: `file-${Date.now()}`,
            name: file.name,
            path: file.name,
            size: file.size,
            mime_type: file.type,
            extension: file.name.split('.').pop() || '',
            script_type: scriptType,
            last_modified: new Date().toISOString(),
          };
          
          await onFileUpload(file);
        }
        
        // Clear file input
        event.target.value = '';
        
      } catch (error) {
        console.error('File upload error:', error);
        onError?.(error instanceof Error ? error.message : 'File upload failed', 'file_upload');
      }
    }, [scriptEditor.fileUpload, onFileUpload, scriptType, onError]);
    
    /**
     * Handle GitHub import completion
     */
    const handleGithubImport = useCallback(async (url: string, credentials?: any) => {
      try {
        await scriptEditor.githubImport.importFile(url, credentials);
        setShowGithubDialog(false);
        
        // Announce successful import
        if (announceChanges) {
          const liveRegion = document.getElementById(`${componentId}-live-region`);
          if (liveRegion) {
            liveRegion.textContent = 'Script imported successfully from GitHub';
          }
        }
      } catch (error) {
        console.error('GitHub import error:', error);
        onError?.(error instanceof Error ? error.message : 'GitHub import failed', 'github_import');
      }
    }, [scriptEditor.githubImport, announceChanges, componentId, onError]);
    
    /**
     * Handle save operation
     */
    const handleSave = useCallback(async () => {
      try {
        const content = scriptEditor.form.getValues('content');
        await scriptEditor.utils.saveContent(content);
        
        if (onFileSave) {
          await onFileSave(content);
        }
        
        // Show auto-save indicator
        if (autoSave.indicator) {
          setAutoSaveIndicator(true);
          setTimeout(() => setAutoSaveIndicator(false), 2000);
        }
        
        // Announce save completion
        if (announceChanges) {
          const liveRegion = document.getElementById(`${componentId}-live-region`);
          if (liveRegion) {
            liveRegion.textContent = 'Script saved successfully';
          }
        }
      } catch (error) {
        console.error('Save error:', error);
        onError?.(error instanceof Error ? error.message : 'Save failed', 'save');
      }
    }, [
      scriptEditor.form,
      scriptEditor.utils,
      onFileSave,
      autoSave.indicator,
      announceChanges,
      componentId,
      onError,
    ]);
    
    /**
     * Handle download operation
     */
    const handleDownload = useCallback(() => {
      try {
        const content = scriptEditor.form.getValues('content');
        const scriptMetadata = scriptEditor.form.getValues('metadata');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = scriptMetadata.name || 'script.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // Announce download
        if (announceChanges) {
          const liveRegion = document.getElementById(`${componentId}-live-region`);
          if (liveRegion) {
            liveRegion.textContent = `Script downloaded as ${link.download}`;
          }
        }
      } catch (error) {
        console.error('Download error:', error);
        onError?.(error instanceof Error ? error.message : 'Download failed', 'download');
      }
    }, [scriptEditor.form, announceChanges, componentId, onError]);
    
    /**
     * Handle copy to clipboard
     */
    const handleCopy = useCallback(async () => {
      try {
        const content = scriptEditor.form.getValues('content');
        await navigator.clipboard.writeText(content);
        
        // Announce copy completion
        if (announceChanges) {
          const liveRegion = document.getElementById(`${componentId}-live-region`);
          if (liveRegion) {
            liveRegion.textContent = 'Script copied to clipboard';
          }
        }
      } catch (error) {
        console.error('Copy error:', error);
        onError?.(error instanceof Error ? error.message : 'Copy failed', 'copy');
      }
    }, [scriptEditor.form, announceChanges, componentId, onError]);
    
    /**
     * Handle fullscreen toggle
     */
    const handleFullscreenToggle = useCallback(() => {
      setIsFullscreen(!isFullscreen);
      
      // Announce fullscreen change
      if (announceChanges) {
        const liveRegion = document.getElementById(`${componentId}-live-region`);
        if (liveRegion) {
          liveRegion.textContent = isFullscreen ? 'Exited fullscreen mode' : 'Entered fullscreen mode';
        }
      }
    }, [isFullscreen, announceChanges, componentId]);

    // =============================================================================
    // AUTO-SAVE IMPLEMENTATION
    // =============================================================================
    
    useEffect(() => {
      if (!autoSave.enabled) return;
      
      const content = scriptEditor.form.watch('content');
      if (!content || content === lastContentRef.current) return;
      
      const autoSaveTimer = setTimeout(async () => {
        try {
          await handleSave();
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }, autoSave.interval);
      
      return () => clearTimeout(autoSaveTimer);
    }, [scriptEditor.form.watch('content'), autoSave, handleSave]);

    // =============================================================================
    // CONTROLLED COMPONENT SYNC
    // =============================================================================
    
    useEffect(() => {
      if (value !== undefined && value !== scriptEditor.form.getValues('content')) {
        scriptEditor.form.setValue('content', value, { shouldValidate: false });
      }
    }, [value, scriptEditor.form]);

    // =============================================================================
    // RENDER HELPER FUNCTIONS
    // =============================================================================
    
    /**
     * Renders action toolbar with all available actions
     */
    const renderActionToolbar = useCallback(() => (
      <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          {/* Script Type Selector */}
          <div className="flex items-center gap-2">
            <FormLabel htmlFor={`${componentId}-script-type`} className="text-sm font-medium">
              Type:
            </FormLabel>
            <select
              id={`${componentId}-script-type`}
              value={scriptType}
              onChange={(e) => handleScriptTypeChange(e.target.value as ScriptType)}
              disabled={disabled || readonly}
              className="text-sm border border-input bg-background px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              aria-label="Select script type"
            >
              {Object.entries(SCRIPT_TYPE_LABELS).map(([type, label]) => (
                <option key={type} value={type}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Content Statistics */}
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-4">
            <span>Lines: {contentStats.lines}</span>
            <span>Characters: {contentStats.characters}</span>
            <span>Size: {contentStats.size}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {/* File Upload */}
          {actions.load && enableFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={allowedFileTypes.join(',')}
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload script file"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                icon={<Upload className="w-4 h-4" />}
                ariaLabel="Upload file"
                title="Upload file"
              >
                <span className="sr-only">Upload</span>
              </Button>
            </>
          )}
          
          {/* GitHub Import */}
          {actions.load && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGithubDialog(true)}
              disabled={disabled || isLoading}
              icon={<Github className="w-4 h-4" />}
              ariaLabel="Import from GitHub"
              title="Import from GitHub"
            >
              <span className="sr-only">GitHub</span>
            </Button>
          )}
          
          {/* Save */}
          {actions.save && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={disabled || readonly || isLoading}
              loading={isLoading && scriptEditor.loading.operation === 'saving_content'}
              icon={autoSaveIndicator ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
              ariaLabel="Save script"
              title="Save script"
            >
              <span className="sr-only">Save</span>
            </Button>
          )}
          
          {/* Download */}
          {actions.download && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={disabled || isLoading}
              icon={<Download className="w-4 h-4" />}
              ariaLabel="Download script"
              title="Download script"
            >
              <span className="sr-only">Download</span>
            </Button>
          )}
          
          {/* Copy */}
          {actions.copy && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={disabled || isLoading}
              icon={<Copy className="w-4 h-4" />}
              ariaLabel="Copy to clipboard"
              title="Copy to clipboard"
            >
              <span className="sr-only">Copy</span>
            </Button>
          )}
          
          {/* Cache Operations */}
          {scriptEditor.cache && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scriptEditor.cache.deleteCache()}
              disabled={disabled || isLoading}
              icon={<Trash2 className="w-4 h-4" />}
              ariaLabel="Clear cache"
              title="Clear cache"
            >
              <span className="sr-only">Clear Cache</span>
            </Button>
          )}
          
          {/* Fullscreen Toggle */}
          {actions.fullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFullscreenToggle}
              disabled={disabled}
              icon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              ariaLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <span className="sr-only">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
            </Button>
          )}
          
          {/* Custom Actions */}
          {actions.custom.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              onClick={() => action.handler(scriptEditor.form.getValues('content'))}
              disabled={disabled || isLoading || action.disabled}
              icon={action.icon && <action.icon className="w-4 h-4" />}
              ariaLabel={action.label}
              title={action.label}
            >
              <span className="sr-only">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    ), [
      componentId,
      scriptType,
      handleScriptTypeChange,
      contentStats,
      actions,
      enableFileUpload,
      allowedFileTypes,
      handleFileUpload,
      disabled,
      readonly,
      isLoading,
      handleSave,
      handleDownload,
      handleCopy,
      autoSaveIndicator,
      scriptEditor,
      handleFullscreenToggle,
      isFullscreen,
    ]);
    
    /**
     * Renders status bar with validation info and performance metrics
     */
    const renderStatusBar = useCallback(() => (
      <div className="flex items-center justify-between gap-2 p-2 border-t border-border bg-background/50 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {/* Validation Status */}
          {validation.real_time_validation && (
            <div className="flex items-center gap-1">
              {validationInProgress ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : scriptEditor.validation.isValid ? (
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
              <span>
                {validationInProgress ? 'Validating...' : 
                 scriptEditor.validation.isValid ? 'Valid' : 'Errors'}
              </span>
            </div>
          )}
          
          {/* Performance Metrics */}
          {process.env.NODE_ENV === 'development' && lastValidationTime > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Validation: {lastValidationTime.toFixed(0)}ms</span>
            </div>
          )}
          
          {/* Auto-save Status */}
          {autoSave.enabled && (
            <div className="flex items-center gap-1">
              <Save className="w-3 h-3" />
              <span>Auto-save: {formatDuration(autoSave.interval)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Editor Mode */}
          <span>Mode: {SCRIPT_TYPE_LABELS[scriptType]}</span>
          
          {/* Theme */}
          <span>Theme: {resolvedTheme}</span>
          
          {/* Encoding */}
          <span>UTF-8</span>
        </div>
      </div>
    ), [
      validation.real_time_validation,
      validationInProgress,
      scriptEditor.validation.isValid,
      lastValidationTime,
      autoSave,
      scriptType,
      resolvedTheme,
    ]);

    // =============================================================================
    // MAIN RENDER
    // =============================================================================
    
    return (
      <div
        ref={containerRef}
        id={componentId}
        className={cn(
          // Base styles
          "relative flex flex-col border rounded-lg overflow-hidden bg-background",
          
          // Size variants
          size === 'sm' && "min-h-[200px]",
          size === 'md' && "min-h-[300px]",
          size === 'lg' && "min-h-[400px]",
          
          // Variant styles
          variant === 'default' && "border-border",
          variant === 'ghost' && "border-transparent bg-transparent",
          variant === 'outline' && "border-2 border-border",
          
          // State styles
          disabled && "opacity-50 cursor-not-allowed",
          readonly && "bg-muted/30",
          currentError && "border-destructive",
          isFullscreen && "fixed inset-0 z-50 min-h-screen",
          
          // Accessibility styles
          highContrast && "contrast-more:border-2 contrast-more:border-foreground",
          
          // Custom className
          className
        )}
        style={style}
        {...htmlProps}
        // Accessibility attributes
        role="region"
        aria-label={accessibility['aria-label']}
        aria-labelledby={accessibility['aria-labelledby']}
        aria-describedby={accessibility['aria-describedby']}
        aria-invalid={currentError ? 'true' : 'false'}
        aria-required={validation.required ? 'true' : 'false'}
        tabIndex={accessibility.tabIndex}
      >
        {/* Action Toolbar */}
        {renderActionToolbar()}
        
        {/* Storage Service Selection */}
        {storageServices.length > 0 && (
          <div className="p-3 border-b border-border bg-background/50">
            <FormField
              label="Storage Service"
              description="Select a storage service for script persistence"
            >
              <Controller
                name="storageServiceId"
                control={scriptEditor.form.control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={disabled || readonly}
                    className="w-full border border-input bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    aria-label="Select storage service"
                  >
                    <option value="">No storage service</option>
                    {storageServices.map((service) => (
                      <option key={service.id} value={service.id} disabled={!service.available}>
                        {service.name} {!service.available && '(unavailable)'}
                      </option>
                    ))}
                  </select>
                )}
              />
            </FormField>
            
            {/* Storage Path Input */}
            {scriptEditor.form.watch('storageServiceId') && (
              <div className="mt-2">
                <FormField
                  label="Storage Path"
                  description="File path within the selected storage service"
                >
                  <Controller
                    name="storagePath"
                    control={scriptEditor.form.control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        placeholder="path/to/script.js"
                        disabled={disabled || readonly}
                        error={fieldState.error?.message}
                        aria-label="Storage path"
                      />
                    )}
                  />
                </FormField>
              </div>
            )}
          </div>
        )}
        
        {/* Main Editor Area */}
        <div className="flex-1 relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">
                  {scriptEditor.loading.operationDetails || 'Loading...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Error Display */}
          {currentError && (
            <div className="p-3 bg-destructive/10 border-b border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{currentError}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={scriptEditor.utils.clearError}
                className="ml-auto"
                ariaLabel="Clear error"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* ACE Editor */}
          <Controller
            name="content"
            control={scriptEditor.form.control}
            render={({ field, fieldState }) => (
              <AceEditor
                ref={aceEditorRef}
                value={field.value}
                onChange={handleContentChange}
                onFocus={onFocus}
                onBlur={onBlur}
                mode={aceMode}
                theme={resolvedTheme === 'dark' ? 'monokai' : 'github'}
                config={editorConfig}
                disabled={disabled}
                readOnly={readonly}
                className="h-full"
                placeholder="Start writing your script..."
                showPrintMargin={false}
                setOptions={{
                  enableBasicAutocompletion: editorConfig.enableBasicAutocompletion,
                  enableLiveAutocompletion: editorConfig.enableLiveAutocompletion,
                  enableSnippets: editorConfig.enableSnippets,
                  showLineNumbers: editorConfig.showGutter,
                  tabSize: editorConfig.tabSize,
                  wrap: editorConfig.wrap,
                  showInvisibles: editorConfig.showInvisibles,
                  fontSize: editorConfig.fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  displayIndentGuides: editorConfig.displayIndentGuides,
                  animatedScroll: editorConfig.animatedScroll,
                  scrollPastEnd: editorConfig.scrollPastEnd,
                  useWorker: editorConfig.useWorker,
                  maxLines: editorConfig.maxLines,
                  minLines: editorConfig.minLines,
                }}
                annotations={fieldState.error ? [{
                  row: 0,
                  column: 0,
                  text: fieldState.error.message,
                  type: 'error'
                }] : []}
                markers={validation.real_time_validation && !scriptEditor.validation.isValid ? [{
                  startRow: 0,
                  startCol: 0,
                  endRow: 0,
                  endCol: 0,
                  className: 'ace_error-marker',
                  type: 'background'
                }] : []}
                aria-label={`Script editor for ${SCRIPT_TYPE_LABELS[scriptType]}`}
                aria-describedby={currentError ? `${componentId}-error` : undefined}
                aria-invalid={currentError ? 'true' : 'false'}
                aria-required={validation.required ? 'true' : 'false'}
              />
            )}
          />
        </div>
        
        {/* Status Bar */}
        {renderStatusBar()}
        
        {/* GitHub Import Dialog */}
        {showGithubDialog && (
          <ScriptsGithubDialog
            open={showGithubDialog}
            onClose={() => setShowGithubDialog(false)}
            onImport={handleGithubImport}
            title="Import Script from GitHub"
            description="Import a script file directly from a GitHub repository"
          />
        )}
        
        {/* Live Region for Screen Reader Announcements */}
        <div
          id={`${componentId}-live-region`}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        />
        
        {/* Error Message for Screen Readers */}
        {currentError && (
          <div
            id={`${componentId}-error`}
            className="sr-only"
            role="alert"
            aria-live="assertive"
          >
            {currentError}
          </div>
        )}
      </div>
    );
  }
));

// =============================================================================
// COMPONENT DISPLAY NAME AND EXPORTS
// =============================================================================

ScriptEditor.displayName = 'ScriptEditor';

export default ScriptEditor;

// Re-export types for external usage
export type {
  ScriptEditorProps,
  ScriptType,
  ScriptSource,
  ScriptContext,
  StorageService,
  ScriptFile,
  FileUploadState,
  ScriptEditorValidation,
  ScriptEditorAccessibility,
  ScriptEditorTheme,
  ScriptEditorActions,
};

// Re-export enums
export {
  ScriptType,
  ScriptSource,
  ScriptContext,
} from './types';