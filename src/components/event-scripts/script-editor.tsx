/**
 * Script Editor Component
 * 
 * Advanced code editor component for event scripts in the DreamFactory Admin Interface.
 * Built with Monaco Editor for optimal performance and features.
 * 
 * Features:
 * - Syntax highlighting for multiple languages
 * - Real-time validation and error checking
 * - Code completion and IntelliSense
 * - WCAG 2.1 AA compliant
 * - Dark/light theme support
 * - Performance optimized for large scripts
 */

import React, { useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { ScriptType, AceEditorMode, SCRIPT_TYPE_DEFINITIONS } from '@/types/scripts';
import { Button } from '@/components/ui/button';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-md">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading editor...
        </div>
      </div>
    )
  }
);

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: ScriptType;
  theme?: 'light' | 'dark' | 'auto';
  height?: string | number;
  width?: string | number;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  onValidate?: (markers: any[]) => void;
  onMount?: (editor: any, monaco: any) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  formatOnType?: boolean;
  formatOnPaste?: boolean;
}

export interface ValidationMarker {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
}

// ============================================================================
// LANGUAGE MAPPING
// ============================================================================

const MONACO_LANGUAGE_MAP: Record<ScriptType, string> = {
  nodejs: 'javascript',
  php: 'php',
  python: 'python',
  python3: 'python'
};

// ============================================================================
// SCRIPT TEMPLATES
// ============================================================================

const SCRIPT_TEMPLATES: Record<ScriptType, string> = {
  nodejs: `/**
 * DreamFactory Event Script - Node.js
 * 
 * Available objects:
 * - event: Contains event information and data
 * - platform: Platform utilities and services
 * 
 * Example:
 */

// Get event data
const eventData = event.request.body;

// Perform your logic here
console.log('Processing event:', event.name);

// Modify or return data
event.response.body = {
  success: true,
  message: 'Script executed successfully',
  data: eventData
};`,

  php: `<?php
/**
 * DreamFactory Event Script - PHP
 * 
 * Available variables:
 * $event - Contains event information and data
 * $platform - Platform utilities and services
 * 
 * Example:
 */

// Get event data
$eventData = $event['request']['body'];

// Perform your logic here
error_log('Processing event: ' . $event['name']);

// Modify or return data
$event['response']['body'] = [
    'success' => true,
    'message' => 'Script executed successfully',
    'data' => $eventData
];
?>`,

  python: `"""
DreamFactory Event Script - Python 2.7

Available objects:
- event: Contains event information and data
- platform: Platform utilities and services

Example:
"""

# Get event data
event_data = event['request']['body']

# Perform your logic here
print('Processing event: ' + event['name'])

# Modify or return data
event['response']['body'] = {
    'success': True,
    'message': 'Script executed successfully',
    'data': event_data
}`,

  python3: `"""
DreamFactory Event Script - Python 3

Available objects:
- event: Contains event information and data
- platform: Platform utilities and services

Example:
"""

# Get event data
event_data = event['request']['body']

# Perform your logic here
print(f"Processing event: {event['name']}")

# Modify or return data
event['response']['body'] = {
    'success': True,
    'message': 'Script executed successfully',
    'data': event_data
}`
};

// ============================================================================
// SCRIPT EDITOR COMPONENT
// ============================================================================

const ScriptEditor = React.forwardRef<HTMLDivElement, ScriptEditorProps>(
  ({
    value,
    onChange,
    language,
    theme = 'auto',
    height = 400,
    width = '100%',
    readOnly = false,
    showLineNumbers = true,
    showMinimap = false,
    fontSize = 14,
    tabSize = 2,
    wordWrap = 'on',
    onValidate,
    onMount,
    className,
    placeholder,
    autoFocus = false,
    formatOnType = true,
    formatOnPaste = true,
    ...props
  }, ref) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const [currentTheme, setCurrentTheme] = React.useState<'light' | 'dark'>('light');
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    
    // Determine theme based on system preference
    useEffect(() => {
      if (theme === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
        
        const handleChange = (e: MediaQueryListEvent) => {
          setCurrentTheme(e.matches ? 'dark' : 'light');
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        setCurrentTheme(theme);
      }
    }, [theme]);
    
    // Handle Monaco Editor mount
    const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      
      // Configure editor options
      editor.updateOptions({
        lineNumbers: showLineNumbers ? 'on' : 'off',
        minimap: { enabled: showMinimap },
        fontSize,
        tabSize,
        insertSpaces: true,
        wordWrap,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'gutter',
        formatOnType,
        formatOnPaste,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        quickSuggestions: true,
        parameterHints: { enabled: true },
        folding: true,
        foldingStrategy: 'auto',
        showFoldingControls: 'mouseover',
        matchBrackets: 'always',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        autoSurround: 'languageDefined',
      });
      
      // Add keyboard shortcuts
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Handle save - could trigger form submission
        console.log('Save triggered');
      });
      
      editor.addCommand(monaco.KeyCode.F11, () => {
        toggleFullscreen();
      });
      
      // Auto-focus if requested
      if (autoFocus) {
        editor.focus();
      }
      
      // Call external onMount handler
      if (onMount) {
        onMount(editor, monaco);
      }
    }, [showLineNumbers, showMinimap, fontSize, tabSize, wordWrap, formatOnType, formatOnPaste, autoFocus, onMount]);
    
    // Handle validation changes
    const handleValidationChange = useCallback((markers: any[]) => {
      if (onValidate) {
        const validationMarkers: ValidationMarker[] = markers.map(marker => ({
          startLineNumber: marker.startLineNumber,
          startColumn: marker.startColumn,
          endLineNumber: marker.endLineNumber,
          endColumn: marker.endColumn,
          message: marker.message,
          severity: marker.severity === 8 ? 'error' : 
                   marker.severity === 4 ? 'warning' : 
                   marker.severity === 2 ? 'info' : 'hint'
        }));
        onValidate(validationMarkers);
      }
    }, [onValidate]);
    
    // Toggle fullscreen mode
    const toggleFullscreen = useCallback(() => {
      setIsFullscreen(!isFullscreen);
    }, [isFullscreen]);
    
    // Insert template
    const insertTemplate = useCallback(() => {
      if (editorRef.current && SCRIPT_TEMPLATES[language]) {
        const template = SCRIPT_TEMPLATES[language];
        editorRef.current.setValue(template);
        editorRef.current.focus();
      }
    }, [language]);
    
    // Format code
    const formatCode = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.getAction('editor.action.formatDocument').run();
      }
    }, []);
    
    // Get Monaco language for script type
    const monacoLanguage = MONACO_LANGUAGE_MAP[language] || 'text';
    
    // Get script type definition
    const scriptTypeDef = SCRIPT_TYPE_DEFINITIONS.find(def => def.value === language);
    
    return (
      <div 
        ref={ref}
        className={cn(
          'relative border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden',
          isFullscreen && 'fixed inset-0 z-50 border-0 rounded-none',
          className
        )}
        {...props}
      >
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {scriptTypeDef?.label || language}
            </span>
            {scriptTypeDef?.extension && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                (.{scriptTypeDef.extension})
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={insertTemplate}
              title="Insert template"
              className="h-7 px-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={formatCode}
              title="Format code"
              className="h-7 px-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="h-7 px-2"
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </Button>
          </div>
        </div>
        
        {/* Monaco Editor */}
        <div className={cn(
          'relative',
          isFullscreen ? 'h-[calc(100vh-49px)]' : typeof height === 'number' ? `h-[${height}px]` : height
        )}>
          <MonacoEditor
            width={width}
            height="100%"
            language={monacoLanguage}
            theme={currentTheme === 'dark' ? 'vs-dark' : 'vs'}
            value={value || ''}
            onChange={(val) => onChange(val || '')}
            onMount={handleEditorDidMount}
            onValidate={handleValidationChange}
            options={{
              readOnly,
              selectOnLineNumbers: true,
              roundedSelection: false,
              scrollBeyondLastLine: false,
              cursorStyle: 'line',
              automaticLayout: true,
              glyphMargin: true,
              useTabStops: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'gutter',
              scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              },
              ...(placeholder && !value && {
                'semanticHighlighting.enabled': true
              })
            }}
          />
          
          {/* Placeholder overlay */}
          {placeholder && !value && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="p-4 text-gray-500 dark:text-gray-400 font-mono text-sm">
                {placeholder}
              </div>
            </div>
          )}
        </div>
        
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Lines: {value ? value.split('\n').length : 0}</span>
            <span>Characters: {value ? value.length : 0}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>{monacoLanguage}</span>
            <span>UTF-8</span>
          </div>
        </div>
      </div>
    );
  }
);

ScriptEditor.displayName = 'ScriptEditor';

export { ScriptEditor };
export type { ScriptEditorProps, ValidationMarker };