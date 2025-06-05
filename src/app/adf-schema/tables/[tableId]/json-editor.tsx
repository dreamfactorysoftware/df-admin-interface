'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { cn } from '@/lib/utils';
import AceEditor, { AceEditorRef } from '@/components/ui/ace-editor/ace-editor';
import { AceEditorMode } from '@/components/ui/ace-editor/types';

/**
 * JSON Editor validation error interface
 * Provides detailed information about JSON parsing errors
 */
interface JsonValidationError {
  /** Line number where the error occurred (1-based) */
  line: number;
  /** Column number where the error occurred (1-based) */
  column: number;
  /** Error message description */
  message: string;
  /** Type of validation error */
  type: 'syntax' | 'format' | 'schema';
  /** Character position in the text where error occurred */
  position?: number;
}

/**
 * JSON Editor formatting options
 */
interface JsonFormattingOptions {
  /** Number of spaces for indentation */
  indent: number;
  /** Whether to sort object keys alphabetically */
  sortKeys: boolean;
  /** Maximum line length before wrapping */
  maxLineLength?: number;
  /** Whether to preserve empty lines */
  preserveEmptyLines: boolean;
}

/**
 * JSON Editor component props interface
 */
interface JsonEditorProps {
  /** Initial JSON value as string */
  value?: string;
  /** Default JSON value for uncontrolled component */
  defaultValue?: string;
  /** Callback fired when JSON content changes */
  onChange?: (value: string, isValid: boolean, errors?: JsonValidationError[]) => void;
  /** Callback fired when JSON is validated */
  onValidate?: (isValid: boolean, errors?: JsonValidationError[]) => void;
  /** Callback fired when editor is ready */
  onReady?: (editor: AceEditorRef | null) => void;
  /** Whether the editor is read-only */
  readonly?: boolean;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether to show real-time validation errors */
  showValidationErrors?: boolean;
  /** Whether to enable auto-formatting on paste */
  autoFormat?: boolean;
  /** JSON formatting options */
  formatOptions?: Partial<JsonFormattingOptions>;
  /** Custom validation function */
  customValidator?: (value: string) => JsonValidationError[] | null;
  /** CSS class name */
  className?: string;
  /** Component ID */
  id?: string;
  /** Aria label for accessibility */
  'aria-label'?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * JSON Editor imperative handle interface
 */
interface JsonEditorRef {
  /** Get current JSON value */
  getValue(): string;
  /** Set JSON value */
  setValue(value: string): void;
  /** Format the current JSON */
  format(): void;
  /** Validate the current JSON */
  validate(): JsonValidationError[] | null;
  /** Clear all content */
  clear(): void;
  /** Focus the editor */
  focus(): void;
  /** Get the underlying ACE editor instance */
  getEditor(): AceEditorRef | null;
}

/**
 * Default formatting options
 */
const DEFAULT_FORMAT_OPTIONS: JsonFormattingOptions = {
  indent: 2,
  sortKeys: false,
  preserveEmptyLines: true,
};

/**
 * Parse JSON validation error from native error
 * Extracts line and column information from JSON.parse errors
 */
const parseJsonError = (error: SyntaxError, jsonText: string): JsonValidationError => {
  const message = error.message;
  let line = 1;
  let column = 1;
  let position = 0;

  // Try to extract position from error message
  const positionMatch = message.match(/position (\d+)/i);
  if (positionMatch) {
    position = parseInt(positionMatch[1], 10);
    
    // Calculate line and column from position
    const lines = jsonText.substring(0, position).split('\n');
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  } else {
    // Try to extract line from error message
    const lineMatch = message.match(/line (\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }
    
    // Try to extract column from error message
    const columnMatch = message.match(/column (\d+)/i);
    if (columnMatch) {
      column = parseInt(columnMatch[1], 10);
    }
  }

  return {
    line,
    column,
    message: message.replace(/^JSON\.parse:\s*/i, ''),
    type: 'syntax',
    position,
  };
};

/**
 * JSON Editor Component
 * 
 * React component providing JSON editing interface for direct table schema manipulation.
 * Implements syntax highlighting, validation, and formatting capabilities. Offers advanced
 * users direct JSON access while maintaining data integrity and validation. Integrates
 * with form-based editing for synchronized updates.
 * 
 * Features:
 * - Real-time JSON syntax highlighting and validation
 * - Automatic error detection with line/column information
 * - JSON formatting and prettification
 * - Synchronized updates with external form components
 * - WCAG 2.1 AA accessibility compliance
 * - Tailwind CSS styling with dark/light theme support
 * - Advanced error recovery and user guidance
 * - Performance optimized for large JSON documents
 */
const JsonEditor = forwardRef<JsonEditorRef, JsonEditorProps>(({
  value,
  defaultValue = '{}',
  onChange,
  onValidate,
  onReady,
  readonly = false,
  disabled = false,
  showValidationErrors = true,
  autoFormat = true,
  formatOptions = {},
  customValidator,
  className,
  id,
  'aria-label': ariaLabel = 'JSON Schema Editor',
  'data-testid': dataTestId = 'json-editor',
}, ref) => {
  // State management
  const [jsonContent, setJsonContent] = useState(value || defaultValue);
  const [validationErrors, setValidationErrors] = useState<JsonValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [isFormatting, setIsFormatting] = useState(false);
  const [lastValidJson, setLastValidJson] = useState<string>('');
  
  // Refs
  const aceEditorRef = useRef<AceEditorRef>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoized formatting options
  const finalFormatOptions = useMemo<JsonFormattingOptions>(() => ({
    ...DEFAULT_FORMAT_OPTIONS,
    ...formatOptions,
  }), [formatOptions]);
  
  /**
   * Validates JSON content and returns validation errors
   */
  const validateJson = useCallback((jsonText: string): JsonValidationError[] => {
    const errors: JsonValidationError[] = [];
    
    try {
      // Basic JSON syntax validation
      JSON.parse(jsonText);
      
      // Custom validation if provided
      if (customValidator) {
        const customErrors = customValidator(jsonText);
        if (customErrors) {
          errors.push(...customErrors);
        }
      }
      
      return errors;
    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push(parseJsonError(error, jsonText));
      } else {
        errors.push({
          line: 1,
          column: 1,
          message: 'Unknown JSON validation error',
          type: 'syntax',
        });
      }
      return errors;
    }
  }, [customValidator]);
  
  /**
   * Formats JSON content with specified options
   */
  const formatJson = useCallback((jsonText: string): string => {
    try {
      const parsed = JSON.parse(jsonText);
      
      if (finalFormatOptions.sortKeys) {
        // Recursively sort object keys
        const sortKeys = (obj: any): any => {
          if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
          }
          
          const sorted: any = {};
          Object.keys(obj).sort().forEach(key => {
            sorted[key] = sortKeys(obj[key]);
          });
          return sorted;
        };
        
        const sortedObj = sortKeys(parsed);
        return JSON.stringify(sortedObj, null, finalFormatOptions.indent);
      }
      
      return JSON.stringify(parsed, null, finalFormatOptions.indent);
    } catch (error) {
      // Return original text if formatting fails
      return jsonText;
    }
  }, [finalFormatOptions]);
  
  /**
   * Debounced validation function
   * Validates JSON content with a delay to avoid excessive validation calls
   */
  const debouncedValidation = useCallback((jsonText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const errors = validateJson(jsonText);
      const valid = errors.length === 0;
      
      setValidationErrors(errors);
      setIsValid(valid);
      
      if (valid) {
        setLastValidJson(jsonText);
      }
      
      onValidate?.(valid, errors);
    }, 300); // 300ms debounce for real-time validation
  }, [validateJson, onValidate]);
  
  /**
   * Handles editor content changes
   */
  const handleChange = useCallback((newValue: string) => {
    setJsonContent(newValue);
    
    // Perform debounced validation
    debouncedValidation(newValue);
    
    // Call onChange callback
    onChange?.(newValue, isValid, validationErrors);
  }, [onChange, isValid, validationErrors, debouncedValidation]);
  
  /**
   * Handles paste events with auto-formatting
   */
  const handlePaste = useCallback(() => {
    if (autoFormat) {
      // Delay formatting to allow paste to complete
      setTimeout(() => {
        const editor = aceEditorRef.current;
        if (editor) {
          const content = editor.getValue();
          try {
            const formatted = formatJson(content);
            if (formatted !== content) {
              setIsFormatting(true);
              editor.setValue(formatted);
              setJsonContent(formatted);
              setIsFormatting(false);
            }
          } catch (error) {
            // Ignore formatting errors on paste
          }
        }
      }, 50);
    }
  }, [autoFormat, formatJson]);
  
  /**
   * Imperative handle implementation
   */
  useImperativeHandle(ref, (): JsonEditorRef => ({
    getValue: () => jsonContent,
    
    setValue: (newValue: string) => {
      setJsonContent(newValue);
      aceEditorRef.current?.setValue(newValue);
      debouncedValidation(newValue);
    },
    
    format: () => {
      const formatted = formatJson(jsonContent);
      if (formatted !== jsonContent) {
        setIsFormatting(true);
        setJsonContent(formatted);
        aceEditorRef.current?.setValue(formatted);
        setIsFormatting(false);
      }
    },
    
    validate: () => {
      const errors = validateJson(jsonContent);
      setValidationErrors(errors);
      setIsValid(errors.length === 0);
      return errors.length > 0 ? errors : null;
    },
    
    clear: () => {
      setJsonContent('{}');
      aceEditorRef.current?.clear();
      setValidationErrors([]);
      setIsValid(true);
    },
    
    focus: () => {
      aceEditorRef.current?.focus();
    },
    
    getEditor: () => aceEditorRef.current,
  }), [jsonContent, formatJson, validateJson, debouncedValidation]);
  
  // Effect to sync with external value changes
  useEffect(() => {
    if (value !== undefined && value !== jsonContent && !isFormatting) {
      setJsonContent(value);
      debouncedValidation(value);
    }
  }, [value, jsonContent, isFormatting, debouncedValidation]);
  
  // Effect to notify parent when editor is ready
  useEffect(() => {
    onReady?.(aceEditorRef.current);
  }, [onReady]);
  
  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Generate error message for display
  const errorMessage = useMemo(() => {
    if (!showValidationErrors || validationErrors.length === 0) {
      return null;
    }
    
    const primaryError = validationErrors[0];
    return `Line ${primaryError.line}, Column ${primaryError.column}: ${primaryError.message}`;
  }, [showValidationErrors, validationErrors]);
  
  // Generate editor helper text
  const helperText = useMemo(() => {
    if (readonly) {
      return 'JSON schema view (read-only)';
    }
    
    if (isValid && lastValidJson) {
      try {
        const parsed = JSON.parse(lastValidJson);
        const keys = Object.keys(parsed);
        return `Valid JSON schema with ${keys.length} root ${keys.length === 1 ? 'property' : 'properties'}`;
      } catch {
        return 'JSON schema editor';
      }
    }
    
    return 'Enter valid JSON schema structure';
  }, [readonly, isValid, lastValidJson]);
  
  return (
    <div 
      className={cn(
        'relative w-full',
        className
      )}
      data-testid={dataTestId}
    >
      {/* JSON Editor Header */}
      <div className={cn(
        'flex items-center justify-between p-3 border-b',
        'bg-gray-50 dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700'
      )}>
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            JSON Schema Editor
          </h3>
          {!isValid && (
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            )}>
              {validationErrors.length} {validationErrors.length === 1 ? 'error' : 'errors'}
            </span>
          )}
          {isValid && lastValidJson && (
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            )}>
              Valid JSON
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Format Button */}
          <button
            type="button"
            onClick={() => {
              const formatted = formatJson(jsonContent);
              if (formatted !== jsonContent) {
                setIsFormatting(true);
                setJsonContent(formatted);
                aceEditorRef.current?.setValue(formatted);
                setIsFormatting(false);
              }
            }}
            disabled={disabled || readonly || !isValid}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-700',
              'text-gray-700 dark:text-gray-200',
              'hover:bg-gray-50 dark:hover:bg-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
            aria-label="Format JSON"
          >
            Format
          </button>
          
          {/* Clear Button */}
          <button
            type="button"
            onClick={() => {
              setJsonContent('{}');
              aceEditorRef.current?.setValue('{}');
              setValidationErrors([]);
              setIsValid(true);
            }}
            disabled={disabled || readonly}
            className={cn(
              'px-3 py-1 text-sm font-medium rounded-md',
              'border border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-700',
              'text-gray-700 dark:text-gray-200',
              'hover:bg-gray-50 dark:hover:bg-gray-600',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
            aria-label="Clear JSON content"
          >
            Clear
          </button>
        </div>
      </div>
      
      {/* ACE Editor */}
      <AceEditor
        ref={aceEditorRef}
        id={id}
        value={jsonContent}
        mode={AceEditorMode.JSON}
        size="lg"
        disabled={disabled}
        readonly={readonly}
        hasError={!isValid}
        errorMessage={errorMessage}
        helperText={helperText}
        onChange={handleChange}
        onLoad={(editor) => {
          // Add paste event listener for auto-formatting
          const textArea = editor?.textInput?.getElement();
          if (textArea) {
            textArea.addEventListener('paste', handlePaste);
          }
        }}
        onValidate={(annotations) => {
          // ACE editor validation annotations
          if (annotations && annotations.length > 0) {
            const aceErrors: JsonValidationError[] = annotations.map((annotation: any) => ({
              line: annotation.row + 1,
              column: annotation.column + 1,
              message: annotation.text,
              type: annotation.type === 'error' ? 'syntax' : 'format',
            }));
            
            // Merge with JSON validation errors
            const allErrors = [...validationErrors, ...aceErrors];
            setValidationErrors(allErrors);
            setIsValid(allErrors.length === 0);
          }
        }}
        config={{
          fontSize: 14,
          showPrintMargin: false,
          showGutter: true,
          highlightActiveLine: true,
          tabSize: 2,
          wrap: true,
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showInvisibles: false,
          displayIndentGuides: true,
          useWorker: true,
          maxLines: 50,
          minLines: 10,
        }}
        aria-label={ariaLabel}
        aria-invalid={!isValid}
        aria-describedby={errorMessage ? `${id || 'json-editor'}-error` : undefined}
        className="border-0 rounded-none"
      />
      
      {/* Validation Error Details */}
      {showValidationErrors && validationErrors.length > 0 && (
        <div className={cn(
          'border-t border-gray-200 dark:border-gray-700',
          'bg-red-50 dark:bg-red-900/20',
          'p-4'
        )}>
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            JSON Validation Errors:
          </h4>
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <div 
                key={index}
                className="text-sm text-red-700 dark:text-red-300"
              >
                <span className="font-mono text-xs">
                  Line {error.line}, Col {error.column}:
                </span>{' '}
                {error.message}
              </div>
            ))}
          </div>
          
          {/* Error Recovery Suggestions */}
          <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-700">
            <p className="text-xs text-red-600 dark:text-red-400">
              💡 <strong>Tips:</strong> Ensure all strings are quoted, objects use curly braces {'{}'}, 
              arrays use square brackets [], and trailing commas are removed.
            </p>
          </div>
        </div>
      )}
      
      {/* JSON Schema Information Panel */}
      {isValid && lastValidJson && (
        <div className={cn(
          'border-t border-gray-200 dark:border-gray-700',
          'bg-blue-50 dark:bg-blue-900/20',
          'p-4'
        )}>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Schema Information
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {helperText}
              </p>
            </div>
            
            <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
              {Math.round(new Blob([lastValidJson]).size / 1024 * 100) / 100} KB
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

JsonEditor.displayName = 'JsonEditor';

export default JsonEditor;
export type { JsonEditorProps, JsonEditorRef, JsonValidationError, JsonFormattingOptions };