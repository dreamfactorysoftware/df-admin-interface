import { RefObject, ChangeEvent, forwardRef } from 'react';
import { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form';

/**
 * ACE Editor mode enumeration for syntax highlighting
 * Migrated from Angular shared types to React component-specific types
 */
export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  JAVASCRIPT = 'javascript',
}

/**
 * Theme configuration for ACE editor
 * Supports Tailwind CSS dark/light mode integration
 */
export type AceEditorTheme = 'light' | 'dark' | 'system';

/**
 * Size variants for the ACE editor component
 */
export type AceEditorSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * ACE editor configuration options
 * Maps to ace.Ace.EditorOptions interface
 */
export interface AceEditorConfig {
  /** Font size in pixels */
  fontSize?: number;
  /** Show print margin */
  showPrintMargin?: boolean;
  /** Show line numbers in gutter */
  showGutter?: boolean;
  /** Highlight active line */
  highlightActiveLine?: boolean;
  /** Tab size in spaces */
  tabSize?: number;
  /** Maximum number of lines to display */
  maxLines?: number;
  /** Minimum number of lines to display */
  minLines?: number;
  /** Enable line wrapping */
  wrap?: boolean | 'off' | 'free' | 'printMargin';
  /** Enable auto-completion */
  enableBasicAutocompletion?: boolean;
  /** Enable live autocompletion */
  enableLiveAutocompletion?: boolean;
  /** Enable snippets */
  enableSnippets?: boolean;
  /** Show invisible characters */
  showInvisibles?: boolean;
  /** Display indent guides */
  displayIndentGuides?: boolean;
  /** Animate scrolling */
  animatedScroll?: boolean;
  /** Scroll past end of document */
  scrollPastEnd?: boolean;
  /** Focus timeout for accessibility */
  focusTimeout?: number;
  /** Use worker for syntax validation */
  useWorker?: boolean;
}

/**
 * ACE editor callback function types
 */
export interface AceEditorCallbacks {
  /** Called when editor value changes */
  onChange?: (value: string, delta?: any) => void;
  /** Called when editor loses focus */
  onBlur?: (event?: any) => void;
  /** Called when editor gains focus */
  onFocus?: (event?: any) => void;
  /** Called when cursor position changes */
  onCursorChange?: (selection?: any) => void;
  /** Called when selection changes */
  onSelectionChange?: (selection?: any) => void;
  /** Called when editor is loaded and ready */
  onLoad?: (editor?: any) => void;
  /** Called before lines change */
  onBeforeLoad?: (ace?: any) => void;
  /** Called on input change (similar to onChange but more granular) */
  onInput?: (delta?: any) => void;
  /** Called on validation errors */
  onValidate?: (annotations?: any[]) => void;
}

/**
 * ACE editor imperative handle methods
 * Exposed via useImperativeHandle for parent component access
 */
export interface AceEditorRef {
  /** Get the current editor value */
  getValue(): string;
  /** Set the editor value */
  setValue(value: string): void;
  /** Focus the editor */
  focus(): void;
  /** Blur the editor */
  blur(): void;
  /** Get the ACE editor instance */
  getEditor(): any;
  /** Clear the editor content */
  clear(): void;
  /** Insert text at cursor position */
  insert(text: string): void;
  /** Get current cursor position */
  getCursorPosition(): { row: number; column: number };
  /** Set cursor position */
  setCursorPosition(row: number, column: number): void;
  /** Get selected text */
  getSelectedText(): string;
  /** Replace selected text */
  replaceSelectedText(text: string): void;
  /** Undo last operation */
  undo(): void;
  /** Redo last undone operation */
  redo(): void;
  /** Get session (for advanced operations) */
  getSession(): any;
  /** Resize editor to fit content */
  resize(): void;
}

/**
 * React Hook Form integration types
 */
export interface AceEditorFormControl<T extends FieldValues = FieldValues> {
  /** React Hook Form field name */
  name?: FieldPath<T>;
  /** React Hook Form register function */
  register?: UseFormRegister<T>;
  /** Field rules for validation */
  rules?: any;
  /** Default value for the field */
  defaultValue?: string;
}

/**
 * Accessibility props for WCAG 2.1 AA compliance
 */
export interface AceEditorAccessibilityProps {
  /** Accessible label for screen readers */
  'aria-label'?: string;
  /** ID of element that labels this editor */
  'aria-labelledby'?: string;
  /** ID of element that describes this editor */
  'aria-describedby'?: string;
  /** Whether editor is required */
  'aria-required'?: boolean;
  /** Whether editor has invalid input */
  'aria-invalid'?: boolean;
  /** Current value of the editor for screen readers */
  'aria-valuetext'?: string;
  /** Role override for the editor */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
}

/**
 * Error state and validation props
 */
export interface AceEditorValidationProps {
  /** Whether the editor has validation errors */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Helper text to display below the editor */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Custom validation function */
  validate?: (value: string) => string | boolean | undefined;
}

/**
 * Loading and state props
 */
export interface AceEditorStateProps {
  /** Whether the editor is in loading state */
  loading?: boolean;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether the editor is read-only */
  readonly?: boolean;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether to auto-focus the editor on mount */
  autoFocus?: boolean;
}

/**
 * Comprehensive ACE Editor component props interface
 * Supports React 19 patterns with forwardRef and controlled component behavior
 */
export interface AceEditorProps<T extends FieldValues = FieldValues>
  extends AceEditorCallbacks,
    AceEditorFormControl<T>,
    AceEditorAccessibilityProps,
    AceEditorValidationProps,
    AceEditorStateProps {
  /** Unique identifier for the editor */
  id?: string;
  /** CSS class names */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Editor content value (controlled component) */
  value?: string;
  /** Default value for uncontrolled component */
  defaultValue?: string;
  /** Editor syntax highlighting mode */
  mode?: AceEditorMode;
  /** Editor theme (integrates with Tailwind CSS theme) */
  theme?: AceEditorTheme;
  /** Editor size variant */
  size?: AceEditorSize;
  /** Editor configuration options */
  config?: AceEditorConfig;
  /** Container element ref */
  containerRef?: RefObject<HTMLDivElement>;
  /** Data test ID for testing */
  'data-testid'?: string;
  /** Additional data attributes */
  [key: `data-${string}`]: any;
}

/**
 * ACE Editor component type with forwardRef support
 * Enables parent components to access editor methods via ref
 */
export type AceEditorComponent = React.ForwardRefExoticComponent<
  AceEditorProps & React.RefAttributes<AceEditorRef>
>;

/**
 * Theme context type for ACE editor theming
 */
export interface AceEditorThemeContext {
  /** Current theme mode */
  theme: AceEditorTheme;
  /** Whether dark mode is active */
  isDarkMode: boolean;
  /** Toggle theme mode */
  toggleTheme: () => void;
  /** Set specific theme */
  setTheme: (theme: AceEditorTheme) => void;
  /** System theme preference */
  systemTheme: 'light' | 'dark';
}

/**
 * Editor instance methods type
 * Provides type safety for ACE editor instance operations
 */
export interface AceEditorInstance {
  /** Editor configuration */
  setOptions(options: AceEditorConfig): void;
  /** Get editor value */
  getValue(): string;
  /** Set editor value */
  setValue(value: string, cursorPos?: number): void;
  /** Get session object */
  getSession(): any;
  /** Set editor mode */
  setMode(mode: string): void;
  /** Set editor theme */
  setTheme(theme: string): void;
  /** Focus editor */
  focus(): void;
  /** Blur editor */
  blur(): void;
  /** Resize editor */
  resize(force?: boolean): void;
  /** Destroy editor instance */
  destroy(): void;
  /** Add event listener */
  on(event: string, callback: Function): void;
  /** Remove event listener */
  off(event: string, callback: Function): void;
  /** Execute command */
  execCommand(command: string): void;
  /** Get/set read-only state */
  setReadOnly(readonly: boolean): void;
  /** Get commands */
  commands: any;
  /** Editor renderer */
  renderer: any;
  /** Editor container */
  container: HTMLElement;
}

/**
 * Event types for ACE editor
 */
export interface AceEditorEvents {
  change: { delta: any; value: string };
  changeSelection: { selection: any };
  changeCursor: { cursor: any };
  focus: { event: FocusEvent };
  blur: { event: FocusEvent };
  paste: { text: string };
  copy: { text: string };
  cut: { text: string };
}

/**
 * Utility type for ACE editor mode mapping
 * Maps enum values to ACE mode strings
 */
export type AceEditorModeMap = {
  [K in AceEditorMode]: string;
};

/**
 * Template literal type for ACE mode paths
 * Provides type safety for ACE mode imports
 */
export type AceModePath = `ace/mode/${string}`;

/**
 * Template literal type for ACE theme paths
 * Provides type safety for ACE theme imports
 */
export type AceThemePath = `ace/theme/${string}`;

/**
 * ACE editor configuration with enhanced TypeScript 5.8+ patterns
 */
export interface EnhancedAceEditorConfig extends AceEditorConfig {
  /** Custom keyboard shortcuts */
  keyboardShortcuts?: Record<string, string>;
  /** Custom commands */
  commands?: Array<{
    name: string;
    bindKey: string | { win: string; mac: string };
    exec: (editor: AceEditorInstance) => void;
  }>;
  /** Language-specific options */
  languageOptions?: {
    [K in AceEditorMode]?: {
      /** Language-specific snippets */
      snippets?: string[];
      /** Language-specific completions */
      completions?: string[];
      /** Language-specific validation rules */
      validationRules?: any[];
    };
  };
}

/**
 * Export all types for external usage
 */
export type {
  AceEditorRef,
  AceEditorCallbacks,
  AceEditorConfig,
  AceEditorFormControl,
  AceEditorAccessibilityProps,
  AceEditorValidationProps,
  AceEditorStateProps,
  AceEditorThemeContext,
  AceEditorInstance,
  AceEditorEvents,
  AceEditorModeMap,
  EnhancedAceEditorConfig,
};