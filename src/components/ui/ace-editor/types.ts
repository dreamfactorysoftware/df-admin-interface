/**
 * ACE Editor Component Types for DreamFactory Admin Interface
 * 
 * TypeScript definitions for the ACE editor component including editor modes,
 * React component props, configuration options, and accessibility compliance.
 * 
 * Migrated from Angular scripts types to React component-specific types.
 * Integrates with React Hook Form, Tailwind CSS theming, and WCAG 2.1 AA standards.
 */

import { ReactNode, RefObject, ComponentType, ChangeEvent, ForwardRefExoticComponent, RefAttributes } from 'react';
import { BaseComponent, ComponentSize, ComponentVariant, FormFieldComponent } from '@/types/ui';

// ============================================================================
// ACE EDITOR MODE DEFINITIONS
// ============================================================================

/**
 * ACE Editor mode enumeration
 * Migrated from Angular shared types to React component-specific types
 * Supports all script types used in DreamFactory event scripts and API generation
 */
export enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml', 
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python',  // Uses same ACE mode as python
  JAVASCRIPT = 'javascript',
  SQL = 'sql',
  XML = 'xml',
  MARKDOWN = 'markdown',
  HTML = 'html',
  CSS = 'css',
  TYPESCRIPT = 'typescript'
}

/**
 * ACE Editor theme options integrated with Tailwind CSS dark/light mode
 */
export enum AceEditorTheme {
  // Light themes
  CHROME = 'chrome',
  CLOUDS = 'clouds',
  CRIMSON_EDITOR = 'crimson_editor',
  DAWN = 'dawn',
  DREAMWEAVER = 'dreamweaver',
  ECLIPSE = 'eclipse',
  GITHUB = 'github',
  IPlastic = 'iplastic',
  KATZENMILCH = 'katzenmilch',
  KUROIR = 'kuroir',
  SQLSERVER = 'sqlserver',
  TEXTMATE = 'textmate',
  TOMORROW = 'tomorrow',
  XCODE = 'xcode',
  
  // Dark themes
  AMBIANCE = 'ambiance',
  CHAOS = 'chaos',
  CLOUDS_MIDNIGHT = 'clouds_midnight',
  COBALT = 'cobalt',
  DRACULA = 'dracula',
  GOB = 'gob',
  GRUVBOX = 'gruvbox',
  IDLE_FINGERS = 'idle_fingers',
  KR_THEME = 'kr_theme',
  MERBIVORE = 'merbivore',
  MERBIVORE_SOFT = 'merbivore_soft',
  MONO_INDUSTRIAL = 'mono_industrial',
  MONOKAI = 'monokai',
  NORD_DARK = 'nord_dark',
  PASTEL_ON_DARK = 'pastel_on_dark',
  SOLARIZED_DARK = 'solarized_dark',
  TERMINAL = 'terminal',
  TOMORROW_NIGHT = 'tomorrow_night',
  TOMORROW_NIGHT_BLUE = 'tomorrow_night_blue',
  TOMORROW_NIGHT_BRIGHT = 'tomorrow_night_bright',
  TOMORROW_NIGHT_EIGHTIES = 'tomorrow_night_eighties',
  TWILIGHT = 'twilight',
  VIBRANT_INK = 'vibrant_ink'
}

// ============================================================================
// EDITOR CONFIGURATION TYPES
// ============================================================================

/**
 * ACE Editor configuration options
 * Enhanced for React Hook Form integration and accessibility
 */
export interface AceEditorConfig {
  // Core editor options
  mode: AceEditorMode;
  theme: AceEditorTheme;
  value: string;
  defaultValue?: string;
  
  // Editor behavior
  readOnly?: boolean;
  highlightActiveLine?: boolean;
  highlightSelectedWord?: boolean;
  cursorStyle?: 'ace' | 'slim' | 'smooth' | 'wide';
  mergeUndoDeltas?: boolean | 'always';
  
  // Display options
  showLineNumbers?: boolean;
  showGutter?: boolean;
  showPrintMargin?: boolean;
  printMarginColumn?: number;
  fontSize?: number;
  fontFamily?: string;
  wrap?: boolean | 'free' | 'printMargin' | number;
  foldStyle?: 'markbegin' | 'markbeginend' | 'manual';
  
  // Tab and indentation
  tabSize?: number;
  useSoftTabs?: boolean;
  navigateWithinSoftTabs?: boolean;
  
  // Autocomplete and snippets
  enableBasicAutocompletion?: boolean;
  enableLiveAutocompletion?: boolean;
  enableSnippets?: boolean;
  
  // Search and replace
  enableSearchBox?: boolean;
  enableFindAndReplace?: boolean;
  
  // Performance options
  useWorker?: boolean;
  enableEmmet?: boolean;
  
  // Validation
  showInvisibles?: boolean;
  displayIndentGuides?: boolean;
  
  // Custom options for DreamFactory
  placeholder?: string;
  minLines?: number;
  maxLines?: number;
  autoScrollEditorIntoView?: boolean;
  scrollPastEnd?: number;
}

/**
 * Editor annotations for syntax highlighting and error display
 */
export interface EditorAnnotation {
  row: number;
  column: number;
  text: string;
  type: 'error' | 'warning' | 'info';
}

/**
 * Editor marker for highlighting code sections
 */
export interface EditorMarker {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  className: string;
  type: 'fullLine' | 'screenLine' | 'text';
  inFront?: boolean;
}

/**
 * Editor cursor position
 */
export interface CursorPosition {
  row: number;
  column: number;
}

/**
 * Editor selection range
 */
export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

// ============================================================================
// REACT COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * ACE Editor component props interface
 * Integrates React Hook Form patterns with controlled component design
 */
export interface AceEditorProps extends Omit<BaseComponent, 'children'>, FormFieldComponent {
  // Core editor props
  mode?: AceEditorMode;
  theme?: AceEditorTheme;
  value?: string;
  defaultValue?: string;
  
  // Component behavior
  readOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  
  // Size and appearance
  width?: string | number;
  height?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  fontSize?: ComponentSize | number;
  
  // Configuration
  config?: Partial<AceEditorConfig>;
  annotations?: EditorAnnotation[];
  markers?: EditorMarker[];
  
  // Event handlers with React-specific typing
  onChange?: (value: string, event?: ChangeEvent<HTMLDivElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLDivElement>, editor: AceEditorInstance) => void;
  onFocus?: (event: React.FocusEvent<HTMLDivElement>, editor: AceEditorInstance) => void;
  onLoad?: (editor: AceEditorInstance) => void;
  onSelectionChange?: (selection: SelectionRange, editor: AceEditorInstance) => void;
  onCursorChange?: (selection: SelectionRange, editor: AceEditorInstance) => void;
  onInput?: (text: string, editor: AceEditorInstance) => void;
  onValidate?: (annotations: EditorAnnotation[]) => void;
  onScroll?: (editor: AceEditorInstance) => void;
  onPaste?: (text: string, editor: AceEditorInstance) => void;
  onCopy?: (text: string, editor: AceEditorInstance) => void;
  
  // React Hook Form integration
  name?: string;
  control?: any; // React Hook Form control
  rules?: any;   // React Hook Form validation rules
  
  // Accessibility props for WCAG 2.1 AA compliance
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-expanded'?: boolean;
  'aria-multiline'?: boolean;
  role?: 'textbox' | 'code' | 'application';
  
  // Screen reader support
  announceChanges?: boolean;
  liveRegionLabel?: string;
  statusMessage?: string;
  
  // Keyboard navigation
  tabIndex?: number;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  
  // Theme integration with Tailwind CSS
  colorScheme?: 'light' | 'dark' | 'auto';
  customTheme?: CustomThemeConfig;
  
  // Loading states
  loading?: boolean;
  loadingText?: string;
  
  // Commands and shortcuts
  commands?: EditorCommand[];
  keyboardShortcuts?: Record<string, string>;
  
  // Advanced features
  enableEmmet?: boolean;
  enableVim?: boolean;
  enableMultiCursor?: boolean;
  
  // Performance options
  debounceChangePeriod?: number;
  setOptions?: Record<string, any>;
  
  // Custom styling
  className?: string;
  style?: React.CSSProperties;
  editorClassName?: string;
  wrapperClassName?: string;
}

/**
 * ACE Editor instance methods and properties
 * For forwardRef integration and imperative API access
 */
export interface AceEditorInstance {
  // Value management
  getValue(): string;
  setValue(value: string, cursorPos?: number): void;
  insert(text: string): void;
  
  // Selection and cursor
  getSelection(): SelectionRange;
  getCursorPosition(): CursorPosition;
  setCursorPosition(position: CursorPosition): void;
  selectAll(): void;
  clearSelection(): void;
  
  // Focus management
  focus(): void;
  blur(): void;
  isFocused(): boolean;
  
  // Editor state
  getReadOnly(): boolean;
  setReadOnly(readOnly: boolean): void;
  resize(force?: boolean): void;
  
  // Search and replace
  find(needle: string, options?: any): void;
  findNext(): void;
  findPrevious(): void;
  replace(replacement: string): void;
  replaceAll(replacement: string): void;
  
  // Undo/redo
  undo(): void;
  redo(): void;
  getUndoManager(): any;
  
  // Session management
  getSession(): any;
  setSession(session: any): void;
  
  // Options
  setOption(name: string, value: any): void;
  setOptions(options: Record<string, any>): void;
  getOption(name: string): any;
  
  // Theme and mode
  setTheme(theme: string): void;
  getTheme(): string;
  setMode(mode: string): void;
  getMode(): any;
  
  // Annotations and markers
  setAnnotations(annotations: EditorAnnotation[]): void;
  getAnnotations(): EditorAnnotation[];
  addMarker(range: any, className: string, type?: string): number;
  removeMarker(markerId: number): void;
  
  // Events
  on(event: string, callback: Function): void;
  off(event: string, callback?: Function): void;
  
  // Commands
  addCommand(command: EditorCommand): void;
  removeCommand(command: string): void;
  
  // Destroy
  destroy(): void;
}

/**
 * Editor command definition for custom shortcuts
 */
export interface EditorCommand {
  name: string;
  bindKey: {
    win: string;
    mac: string;
  };
  exec: (editor: AceEditorInstance) => void;
  readOnly?: boolean;
  description?: string;
}

/**
 * Custom theme configuration for Tailwind CSS integration
 */
export interface CustomThemeConfig {
  // Background colors
  background?: string;
  foreground?: string;
  
  // Syntax highlighting colors
  keyword?: string;
  string?: string;
  comment?: string;
  number?: string;
  operator?: string;
  
  // UI colors
  gutter?: string;
  selection?: string;
  activeLine?: string;
  cursor?: string;
  
  // Border and margin
  printMargin?: string;
  fold?: string;
  
  // Error and warning colors
  error?: string;
  warning?: string;
  info?: string;
}

// ============================================================================
// FORWARD REF COMPONENT TYPE
// ============================================================================

/**
 * ACE Editor component with forwardRef support
 * Enables parent components to access editor instance methods
 */
export type AceEditorComponent = ForwardRefExoticComponent<
  AceEditorProps & RefAttributes<AceEditorInstance>
>;

/**
 * ACE Editor ref type for React.useRef()
 */
export type AceEditorRef = RefObject<AceEditorInstance>;

// ============================================================================
// FORM INTEGRATION TYPES
// ============================================================================

/**
 * ACE Editor field definition for dynamic forms
 * Extends FormField for React Hook Form integration
 */
export interface AceEditorFieldConfig {
  type: 'ace-editor';
  mode: AceEditorMode;
  theme?: AceEditorTheme;
  height?: string | number;
  config?: Partial<AceEditorConfig>;
  validation?: AceEditorValidation;
  
  // Form-specific options
  allowModeChange?: boolean;
  allowThemeChange?: boolean;
  showModeSelector?: boolean;
  showThemeSelector?: boolean;
  
  // Preset configurations
  presets?: EditorPreset[];
  defaultPreset?: string;
}

/**
 * Editor validation rules specific to code content
 */
export interface AceEditorValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  syntax?: boolean; // Enable syntax validation
  customValidator?: (value: string) => string | boolean;
  
  // Language-specific validation
  json?: {
    allowComments?: boolean;
    allowTrailingCommas?: boolean;
  };
  yaml?: {
    allowDuplicateKeys?: boolean;
  };
  javascript?: {
    allowES6?: boolean;
    allowJSX?: boolean;
  };
}

/**
 * Editor preset for common configurations
 */
export interface EditorPreset {
  id: string;
  name: string;
  description?: string;
  mode: AceEditorMode;
  theme: AceEditorTheme;
  config: Partial<AceEditorConfig>;
  
  // Preset metadata
  category?: 'script' | 'config' | 'data' | 'template';
  tags?: string[];
  readOnly?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Editor mode utilities
 */
export type EditorModeInfo = {
  [K in AceEditorMode]: {
    name: string;
    extensions: string[];
    description: string;
    category: 'script' | 'data' | 'markup' | 'config';
    aceMode: string;
    supportsSnippets: boolean;
    supportsAutocompletion: boolean;
  };
};

/**
 * Theme utilities for automatic theme selection
 */
export type ThemeCategory = 'light' | 'dark';

export type ThemeInfo = {
  [K in AceEditorTheme]: {
    name: string;
    category: ThemeCategory;
    description: string;
    recommended: boolean;
  };
};

/**
 * Editor state for React state management
 */
export interface EditorState {
  value: string;
  mode: AceEditorMode;
  theme: AceEditorTheme;
  readOnly: boolean;
  loading: boolean;
  error?: string;
  annotations: EditorAnnotation[];
  cursorPosition: CursorPosition;
  selection: SelectionRange;
  modified: boolean;
}

/**
 * Editor action types for useReducer pattern
 */
export type EditorAction =
  | { type: 'SET_VALUE'; payload: string }
  | { type: 'SET_MODE'; payload: AceEditorMode }
  | { type: 'SET_THEME'; payload: AceEditorTheme }
  | { type: 'SET_READONLY'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | undefined }
  | { type: 'SET_ANNOTATIONS'; payload: EditorAnnotation[] }
  | { type: 'SET_CURSOR_POSITION'; payload: CursorPosition }
  | { type: 'SET_SELECTION'; payload: SelectionRange }
  | { type: 'SET_MODIFIED'; payload: boolean }
  | { type: 'RESET' };

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  // Core interfaces
  AceEditorProps,
  AceEditorInstance,
  AceEditorConfig,
  AceEditorComponent,
  AceEditorRef,
  
  // Configuration types
  EditorAnnotation,
  EditorMarker,
  CursorPosition,
  SelectionRange,
  EditorCommand,
  CustomThemeConfig,
  
  // Form integration
  AceEditorFieldConfig,
  AceEditorValidation,
  EditorPreset,
  
  // State management
  EditorState,
  EditorAction,
  
  // Utility types
  EditorModeInfo,
  ThemeInfo,
  ThemeCategory,
};

// Export enums
export { AceEditorMode, AceEditorTheme };

// Default export for main configuration
export default AceEditorProps;