'use client';

import React, {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useMemo,
} from 'react';
import { cn } from '@/lib/utils';
import {
  AceEditorProps,
  AceEditorRef,
  AceEditorMode,
  AceEditorInstance,
  AceEditorConfig,
} from './types';

// ACE Editor dynamic import interface
interface AceModule {
  edit: (element: HTMLElement) => AceEditorInstance;
  config: {
    set: (key: string, value: string) => void;
    setModuleUrl: (module: string, url: string) => void;
  };
  require: (module: string) => any;
}

/**
 * Default ACE editor configuration optimized for React 19
 */
const DEFAULT_CONFIG: AceEditorConfig = {
  fontSize: 14,
  showPrintMargin: false,
  showGutter: true,
  highlightActiveLine: true,
  tabSize: 2,
  wrap: false,
  enableBasicAutocompletion: true,
  enableLiveAutocompletion: true,
  enableSnippets: true,
  showInvisibles: false,
  displayIndentGuides: true,
  animatedScroll: true,
  scrollPastEnd: false,
  focusTimeout: 0,
  useWorker: true,
  maxLines: Infinity,
  minLines: 3,
};

/**
 * ACE mode to file extension mapping for dynamic loading
 */
const ACE_MODE_MAP: Record<AceEditorMode, string> = {
  [AceEditorMode.JSON]: 'ace/mode/json',
  [AceEditorMode.YAML]: 'ace/mode/yaml',
  [AceEditorMode.TEXT]: 'ace/mode/text',
  [AceEditorMode.NODEJS]: 'ace/mode/javascript',
  [AceEditorMode.PHP]: 'ace/mode/php',
  [AceEditorMode.PYTHON]: 'ace/mode/python',
  [AceEditorMode.PYTHON3]: 'ace/mode/python',
  [AceEditorMode.JAVASCRIPT]: 'ace/mode/javascript',
};

/**
 * Simple theme hook implementation using Zustand store pattern
 * Provides theme context for ACE editor theming
 */
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    // Check system preference on mount
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const documentHasDarkClass = document.documentElement.classList.contains('dark');
    
    setTheme(documentHasDarkClass || prefersDark ? 'dark' : 'light');
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasDarkClass = document.documentElement.classList.contains('dark');
          setTheme(hasDarkClass ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  return { theme, isDarkMode: theme === 'dark' };
};

/**
 * React ACE Editor component with comprehensive TypeScript support
 * Migrated from Angular df-ace-editor to React 19 patterns
 * 
 * Features:
 * - React Hook Form integration with controlled component pattern
 * - Dynamic ACE editor loading with theme support
 * - WCAG 2.1 AA accessibility compliance
 * - TypeScript syntax highlighting and validation
 * - Tailwind CSS styling with dark/light theme support
 * - useImperativeHandle for parent component access
 * - Comprehensive error handling and validation
 */
const AceEditor = forwardRef<AceEditorRef, AceEditorProps>(({
  id,
  className,
  style,
  value = '',
  defaultValue,
  mode = AceEditorMode.JSON,
  theme: themeOverride,
  size = 'md',
  config: userConfig,
  disabled = false,
  readonly = false,
  placeholder,
  autoFocus = false,
  loading = false,
  hasError = false,
  errorMessage,
  helperText,
  required = false,
  onChange,
  onBlur,
  onFocus,
  onLoad,
  onValidate,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  role = 'textbox',
  tabIndex = 0,
  'data-testid': dataTestId,
  ...props
}, ref) => {
  // Refs and state
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<AceEditorInstance | null>(null);
  const aceRef = useRef<AceModule | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [aceLoaded, setAceLoaded] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  
  // Theme integration
  const { theme, isDarkMode } = useTheme();
  const activeTheme = themeOverride || theme;
  
  // Memoized configuration
  const finalConfig = useMemo((): AceEditorConfig => ({
    ...DEFAULT_CONFIG,
    ...userConfig,
  }), [userConfig]);
  
  // Memoized size classes
  const sizeClasses = useMemo(() => {
    const sizes = {
      sm: 'min-h-[120px] text-sm',
      md: 'min-h-[200px] text-base',
      lg: 'min-h-[300px] text-lg',
      xl: 'min-h-[400px] text-lg',
    };
    return sizes[size];
  }, [size]);
  
  /**
   * Dynamically loads ACE editor from assets
   * Configures module paths for proper loading
   */
  const loadAceEditor = useCallback(async (): Promise<AceModule | null> => {
    try {
      // Set ACE configuration for asset paths
      if (typeof window !== 'undefined') {
        // Configure ACE to load from assets directory
        window.ace_config = {
          basePath: '/assets/ace-builds/src-min-noconflict/',
          modePath: '/assets/ace-builds/src-min-noconflict/',
          themePath: '/assets/ace-builds/src-min-noconflict/',
          workerPath: '/assets/ace-builds/src-min-noconflict/',
        };
        
        // Dynamic import of ACE editor
        const ace = await import('/assets/ace-builds/src-min-noconflict/ace.js');
        
        // Configure module paths
        ace.config.set('basePath', '/assets/ace-builds/src-min-noconflict/');
        ace.config.set('modePath', '/assets/ace-builds/src-min-noconflict/');
        ace.config.set('themePath', '/assets/ace-builds/src-min-noconflict/');
        ace.config.set('workerPath', '/assets/ace-builds/src-min-noconflict/');
        
        return ace as AceModule;
      }
      return null;
    } catch (error) {
      console.error('Failed to load ACE editor:', error);
      setEditorError('Failed to load code editor. Please refresh the page.');
      return null;
    }
  }, []);
  
  /**
   * Initializes ACE editor instance with configuration
   */
  const initializeEditor = useCallback(async () => {
    if (!containerRef.current || aceLoaded || loading) {
      return;
    }
    
    try {
      const ace = await loadAceEditor();
      if (!ace) {
        return;
      }
      
      aceRef.current = ace;
      setAceLoaded(true);
      
      // Create editor instance
      const editor = ace.edit(containerRef.current);
      editorRef.current = editor;
      
      // Apply configuration
      editor.setOptions(finalConfig);
      
      // Set mode
      const modePath = ACE_MODE_MAP[mode];
      if (modePath) {
        await import(`/assets/ace-builds/src-min-noconflict/mode-${mode}.js`);
        editor.session.setMode(modePath);
      }
      
      // Set theme
      const themeToUse = isDarkMode ? 'monokai' : 'chrome';
      await import(`/assets/ace-builds/src-min-noconflict/theme-${themeToUse}.js`);
      editor.setTheme(`ace/theme/${themeToUse}`);
      
      // Set initial value
      const initialValue = value || defaultValue || '';
      editor.setValue(initialValue, -1);
      
      // Configure accessibility
      const textArea = editor.textInput.getElement();
      if (textArea) {
        textArea.setAttribute('role', role);
        textArea.setAttribute('tabindex', tabIndex.toString());
        
        if (ariaLabel) textArea.setAttribute('aria-label', ariaLabel);
        if (ariaLabelledBy) textArea.setAttribute('aria-labelledby', ariaLabelledBy);
        if (ariaDescribedBy) textArea.setAttribute('aria-describedby', ariaDescribedBy);
        if (ariaRequired || required) textArea.setAttribute('aria-required', 'true');
        if (ariaInvalid || hasError) textArea.setAttribute('aria-invalid', 'true');
        if (placeholder) textArea.setAttribute('aria-placeholder', placeholder);
      }
      
      // Set editor state
      editor.setReadOnly(disabled || readonly);
      
      // Event listeners
      editor.on('change', (delta: any) => {
        const newValue = editor.getValue();
        onChange?.(newValue, delta);
      });
      
      editor.on('blur', (event: any) => {
        onBlur?.(event);
      });
      
      editor.on('focus', (event: any) => {
        onFocus?.(event);
      });
      
      // Validation listener
      editor.session.on('changeAnnotation', () => {
        const annotations = editor.session.getAnnotations();
        onValidate?.(annotations);
      });
      
      // Auto focus if requested
      if (autoFocus) {
        editor.focus();
      }
      
      setIsEditorReady(true);
      onLoad?.(editor);
      
    } catch (error) {
      console.error('Failed to initialize ACE editor:', error);
      setEditorError('Failed to initialize code editor.');
    }
  }, [
    aceLoaded,
    loading,
    finalConfig,
    mode,
    isDarkMode,
    value,
    defaultValue,
    disabled,
    readonly,
    autoFocus,
    onChange,
    onBlur,
    onFocus,
    onLoad,
    onValidate,
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    ariaRequired,
    ariaInvalid,
    required,
    hasError,
    placeholder,
    role,
    tabIndex,
  ]);
  
  /**
   * Updates editor theme when theme changes
   */
  const updateTheme = useCallback(async () => {
    if (!editorRef.current || !aceRef.current) {
      return;
    }
    
    try {
      const themeToUse = isDarkMode ? 'monokai' : 'chrome';
      await import(`/assets/ace-builds/src-min-noconflict/theme-${themeToUse}.js`);
      editorRef.current.setTheme(`ace/theme/${themeToUse}`);
    } catch (error) {
      console.error('Failed to update editor theme:', error);
    }
  }, [isDarkMode]);
  
  /**
   * Updates editor mode when mode prop changes
   */
  const updateMode = useCallback(async () => {
    if (!editorRef.current || !aceRef.current) {
      return;
    }
    
    try {
      const modePath = ACE_MODE_MAP[mode];
      if (modePath) {
        await import(`/assets/ace-builds/src-min-noconflict/mode-${mode}.js`);
        editorRef.current.session.setMode(modePath);
      }
    } catch (error) {
      console.error('Failed to update editor mode:', error);
    }
  }, [mode]);
  
  // Initialize editor on mount
  useEffect(() => {
    initializeEditor();
    
    return () => {
      // Cleanup editor on unmount
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [initializeEditor]);
  
  // Update value when prop changes
  useEffect(() => {
    if (editorRef.current && isEditorReady && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value || '', -1);
    }
  }, [value, isEditorReady]);
  
  // Update theme when it changes
  useEffect(() => {
    if (isEditorReady) {
      updateTheme();
    }
  }, [activeTheme, updateTheme, isEditorReady]);
  
  // Update mode when it changes
  useEffect(() => {
    if (isEditorReady) {
      updateMode();
    }
  }, [mode, updateMode, isEditorReady]);
  
  // Update disabled/readonly state
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      editorRef.current.setReadOnly(disabled || readonly);
    }
  }, [disabled, readonly, isEditorReady]);
  
  // Update configuration
  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      editorRef.current.setOptions(finalConfig);
    }
  }, [finalConfig, isEditorReady]);
  
  /**
   * Imperative handle for parent component access
   * Provides complete ACE editor instance control
   */
  useImperativeHandle(ref, (): AceEditorRef => ({
    getValue: () => editorRef.current?.getValue() || '',
    setValue: (newValue: string) => {
      if (editorRef.current) {
        editorRef.current.setValue(newValue, -1);
      }
    },
    focus: () => {
      editorRef.current?.focus();
    },
    blur: () => {
      editorRef.current?.blur();
    },
    getEditor: () => editorRef.current,
    clear: () => {
      if (editorRef.current) {
        editorRef.current.setValue('', -1);
      }
    },
    insert: (text: string) => {
      if (editorRef.current) {
        editorRef.current.insert(text);
      }
    },
    getCursorPosition: () => {
      const position = editorRef.current?.getCursorPosition();
      return position || { row: 0, column: 0 };
    },
    setCursorPosition: (row: number, column: number) => {
      if (editorRef.current) {
        editorRef.current.moveCursorTo(row, column);
      }
    },
    getSelectedText: () => editorRef.current?.getSelectedText() || '',
    replaceSelectedText: (text: string) => {
      if (editorRef.current) {
        editorRef.current.session.replace(editorRef.current.selection.getRange(), text);
      }
    },
    undo: () => {
      editorRef.current?.undo();
    },
    redo: () => {
      editorRef.current?.redo();
    },
    getSession: () => editorRef.current?.session,
    resize: () => {
      editorRef.current?.resize();
    },
  }), []);
  
  // Generate unique ID for accessibility
  const editorId = id || `ace-editor-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${editorId}-error`;
  const helperId = `${editorId}-helper`;
  
  return (
    <div 
      className={cn(
        'relative w-full',
        className
      )}
      style={style}
      data-testid={dataTestId}
      {...props}
    >
      {/* Editor container */}
      <div
        ref={containerRef}
        id={editorId}
        className={cn(
          'w-full border rounded-md transition-colors duration-200',
          sizeClasses,
          // Theme-aware styling
          isDarkMode ? [
            'bg-gray-900 border-gray-700',
            'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
          ] : [
            'bg-white border-gray-300',
            'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
          ],
          // Error states
          hasError && [
            isDarkMode ? 'border-red-500' : 'border-red-400',
            'focus-within:border-red-500 focus-within:ring-red-500',
          ],
          // Disabled state
          (disabled || readonly) && [
            'opacity-60 cursor-not-allowed',
            isDarkMode ? 'bg-gray-800' : 'bg-gray-50',
          ],
          // Loading state
          loading && 'animate-pulse'
        )}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={cn(
          ariaDescribedBy,
          errorMessage && errorId,
          helperText && helperId
        )}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          'bg-white/80 dark:bg-gray-900/80',
          'rounded-md'
        )}>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Loading editor...
            </span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {(errorMessage || editorError) && (
        <div 
          id={errorId}
          className="mt-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {errorMessage || editorError}
        </div>
      )}
      
      {/* Helper text */}
      {helperText && !errorMessage && !editorError && (
        <div 
          id={helperId}
          className="mt-1 text-sm text-gray-600 dark:text-gray-400"
        >
          {helperText}
        </div>
      )}
      
      {/* Required indicator */}
      {required && (
        <span 
          className="absolute top-2 right-2 text-red-500 text-sm"
          aria-label="Required field"
        >
          *
        </span>
      )}
      
      {/* Placeholder for empty state */}
      {!loading && !isEditorReady && !editorError && (
        <div className={cn(
          'absolute inset-2 flex items-start justify-start p-3',
          'text-gray-500 dark:text-gray-400 pointer-events-none'
        )}>
          {placeholder || 'Loading editor...'}
        </div>
      )}
    </div>
  );
});

AceEditor.displayName = 'AceEditor';

export default AceEditor;
export type { AceEditorProps, AceEditorRef };