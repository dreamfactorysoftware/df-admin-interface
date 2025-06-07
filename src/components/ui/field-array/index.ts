/**
 * Field Array Component System - Main Export File
 * 
 * Centralizes all field array-related exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular df-array-field components.
 * 
 * This barrel export provides clean imports for:
 * - FieldArray component (dynamic field array management with React Hook Form)
 * - Comprehensive TypeScript type definitions for all configuration modes
 * - Integration interfaces for DynamicField and VerbPicker components
 * - Table layout configuration and virtualization support
 * - Accessibility utilities and WCAG 2.1 AA compliance features
 * - Performance optimization utilities for large datasets (1000+ items)
 * 
 * Features:
 * - React Hook Form 7.52+ integration with useFieldArray hook
 * - Multiple modes: array, object, table, grid layouts
 * - WCAG 2.1 AA accessibility compliance throughout
 * - TypeScript 5.8+ type safety with schema inference
 * - Tailwind CSS 4.1+ design system integration
 * - Dark theme support via Zustand theme store
 * - Virtual scrolling for performance with large datasets
 * - Sortable arrays with keyboard navigation support
 * - Integration with DynamicField and VerbPicker components
 * 
 * @example
 * ```tsx
 * // Import the primary FieldArray component
 * import { FieldArray } from '@/components/ui/field-array';
 * 
 * // Import specific types and configurations
 * import { 
 *   type FieldArrayProps,
 *   type TableConfig,
 *   type FieldArrayItemConfig 
 * } from '@/components/ui/field-array';
 * 
 * // Complete field array example for service parameters
 * const ServiceParametersArray = () => (
 *   <FieldArray
 *     control={control}
 *     name="parameters"
 *     mode="object"
 *     itemConfig={[
 *       { key: 'name', label: 'Parameter Name', type: 'string', required: true },
 *       { key: 'value', label: 'Parameter Value', type: 'string', required: true }
 *     ]}
 *     maxItems={50}
 *     sortable={true}
 *     schema={{
 *       label: 'Service Parameters',
 *       description: 'Configure database service parameters'
 *     }}
 *   />
 * );
 * ```
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see React Hook Form Integration Requirements - useFieldArray support
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

// =============================================================================
// PRIMARY FIELD ARRAY COMPONENT EXPORTS
// =============================================================================

/**
 * Main FieldArray component - Primary export for dynamic field array management
 * 
 * Replaces Angular df-array-field component with comprehensive React Hook Form implementation featuring:
 * - React Hook Form 7.52+ integration with useFieldArray hook
 * - Multiple layout modes (array, object, table, grid) for different use cases
 * - WCAG 2.1 AA accessibility compliance with proper ARIA relationships
 * - Performance optimization for large datasets (1000+ tables in schema discovery)
 * - Sortable arrays with keyboard navigation and screen reader support
 * - Integration with DynamicField and VerbPicker components
 * - Virtual scrolling capabilities for optimal performance
 * - Theme-aware styling via Zustand theme store integration
 * - Comprehensive validation and error handling
 */
export { 
  FieldArray as default,
  FieldArray,
} from './field-array';

/**
 * FieldArray component prop interfaces and types
 * Provides comprehensive TypeScript support for all field array configurations
 */
export type { 
  FieldArrayProps,
} from './field-array';

// =============================================================================
// FIELD ARRAY TYPE DEFINITIONS AND CONFIGURATION
// =============================================================================

/**
 * Comprehensive TypeScript type definitions for the field array system
 * 
 * Provides type-safe field array development with:
 * - React Hook Form integration types with generic support
 * - Configuration schema interfaces for metadata management
 * - Table layout and virtualization configuration types
 * - Component integration interfaces (DynamicField, VerbPicker)
 * - Event handler types for comprehensive interaction support
 * - Performance and accessibility configuration types
 * - Validation and state management types
 */
export type {
  // =========================================================================
  // Core Configuration Types
  // =========================================================================
  
  /** Field array operational modes */
  FieldArrayMode,
  
  /** Field array value type unions */
  FieldArrayValueType,
  
  /** Layout orientation options */
  FieldArrayLayout,
  
  /** Add button placement options */
  AddButtonPlacement,
  
  /** Field array size variants */
  FieldArraySize,
  
  // =========================================================================
  // Configuration Schema Interfaces
  // =========================================================================
  
  /** Configuration schema for field array metadata */
  ConfigSchema,
  
  /** Item configuration for object-type field arrays */
  FieldArrayItemConfig,
  
  // =========================================================================
  // Table Layout Configuration
  // =========================================================================
  
  /** Table column configuration for table mode */
  TableColumnConfig,
  
  /** Table configuration with virtualization support */
  TableConfig,
  
  // =========================================================================
  // Component Integration Interfaces
  // =========================================================================
  
  /** DynamicField component integration configuration */
  DynamicFieldIntegration,
  
  /** VerbPicker component integration configuration */
  VerbPickerIntegration,
  
  /** Component integration registry for custom components */
  ComponentIntegration,
  
  // =========================================================================
  // Event Handler Types
  // =========================================================================
  
  /** Field array value change event handler */
  FieldArrayChangeHandler,
  
  /** Individual item change event handler */
  FieldArrayItemChangeHandler,
  
  /** Validation event handler */
  FieldArrayValidationHandler,
  
  /** Reorder event handler for sortable arrays */
  FieldArrayReorderHandler,
  
  // =========================================================================
  // Component State Types
  // =========================================================================
  
  /** Field array item state interface */
  FieldArrayItemState,
  
  /** Overall field array state interface */
  FieldArrayState,
  
  // =========================================================================
  // Hook Return Types
  // =========================================================================
  
  /** Return type for useFieldArray integration hook */
  UseFieldArrayIntegrationReturn,
  
  // =========================================================================
  // Validation Types
  // =========================================================================
  
  /** Field array validation function type */
  FieldArrayValidator,
  
  /** Item validation function type */
  FieldArrayItemValidator,
  
  /** Validation configuration for field arrays */
  FieldArrayValidationConfig,
  
  // =========================================================================
  // Utility Types
  // =========================================================================
  
  /** Extract field array value type from form values */
  ExtractFieldArrayType,
  
  /** Field array item type utility */
  FieldArrayItem,
  
  /** Conditional props based on mode */
  ConditionalFieldArrayProps,
  
  /** Theme variant props for field array styling */
  FieldArrayThemeProps,
  
  // =========================================================================
  // Convenience Type Aliases
  // =========================================================================
  
  /** Props for simple array field arrays */
  SimpleFieldArrayProps,
  
  /** Props for object field arrays with complex item structures */
  ObjectFieldArrayProps,
  
  /** Props for table-mode field arrays */
  TableFieldArrayProps,
  
} from './field-array.types';

// =============================================================================
// REACT HOOK FORM TYPE RE-EXPORTS
// =============================================================================

/**
 * React Hook Form types re-exported for convenience
 * Enables seamless integration without additional imports
 */
export type {
  /** Field path type for type-safe field references */
  FieldPath,
  
  /** Field values generic type */
  FieldValues,
  
  /** useFieldArray hook return type */
  UseFieldArrayReturn,
  
  /** useController props type */
  UseControllerProps,
  
  /** Field array path type for name resolution */
  FieldArrayPath,
  
  /** React Hook Form control type */
  Control,
  
  /** Field error type for validation */
  FieldError,
  
  /** Array path type for nested arrays */
  ArrayPath,
  
  /** Field array type from React Hook Form */
  FieldArray,
  
} from './field-array.types';

// =============================================================================
// UI TYPES RE-EXPORTS
// =============================================================================

/**
 * Base UI component types re-exported for convenience
 * Provides foundational types for component composition
 */
export type {
  /** Base component props interface */
  BaseComponentProps,
  
  /** Form component props interface */
  FormComponentProps,
  
  /** Theme props interface */
  ThemeProps,
  
  /** Responsive props interface */
  ResponsiveProps,
  
  /** Accessibility props interface */
  AccessibilityProps,
  
  /** Layout props interface */
  LayoutProps,
  
  /** Animation props interface */
  AnimationProps,
  
  /** Validation state interface */
  ValidationState,
  
} from './field-array.types';

// =============================================================================
// COMPONENT COLLECTION EXPORT
// =============================================================================

/**
 * Complete field array component collection for bulk imports
 * Useful for component libraries and documentation systems
 * 
 * @example
 * ```tsx
 * import { FieldArrayComponents } from '@/components/ui/field-array';
 * 
 * // Access all components through the collection
 * const { FieldArray } = FieldArrayComponents;
 * ```
 */
export const FieldArrayComponents = {
  FieldArray,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for field array system
 * Consolidates all TypeScript interfaces and types for easy import
 */
export interface FieldArraySystemTypes {
  FieldArrayProps: FieldArrayProps;
  ConfigSchema: ConfigSchema;
  FieldArrayItemConfig: FieldArrayItemConfig;
  TableColumnConfig: TableColumnConfig;
  TableConfig: TableConfig;
  DynamicFieldIntegration: DynamicFieldIntegration;
  VerbPickerIntegration: VerbPickerIntegration;
  ComponentIntegration: ComponentIntegration;
  FieldArrayItemState: FieldArrayItemState;
  FieldArrayState: FieldArrayState;
  FieldArrayValidationConfig: FieldArrayValidationConfig;
}

/**
 * Field array mode type union for dynamic component creation
 * Useful for configuration-driven field array rendering
 */
export type FieldArrayModeUnion = 'array' | 'object' | 'table' | 'grid';

/**
 * Field array layout type union for dynamic layout control
 */
export type FieldArrayLayoutUnion = 'vertical' | 'horizontal' | 'grid' | 'table';

/**
 * Field array size type union for dynamic sizing
 */
export type FieldArraySizeUnion = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Add button placement type union for dynamic positioning
 */
export type AddButtonPlacementUnion = 'top' | 'bottom' | 'both' | 'inline' | 'none';

// =============================================================================
// ACCESSIBILITY AND PERFORMANCE CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for field array system
 * Provides reference values for accessibility validation
 */
export const FIELD_ARRAY_ACCESSIBILITY_CONSTANTS = {
  /**
   * Minimum touch target size per WCAG guidelines
   */
  MIN_TOUCH_TARGET: {
    width: 44,
    height: 44,
  },
  
  /**
   * Minimum contrast ratios for AA compliance
   */
  CONTRAST_RATIOS: {
    normalText: 4.5,
    uiComponents: 3.0,
    enhancedText: 7.0, // AAA level
  },
  
  /**
   * Focus ring specifications for field array elements
   */
  FOCUS_RING: {
    width: 2,
    offset: 2,
    borderRadius: 4,
  },
  
  /**
   * Animation and transition constants
   */
  TIMING: {
    transition: 200, // milliseconds
    announcement: 1000, // milliseconds for screen reader announcements
    reorderAnnouncementDelay: 150, // milliseconds for reorder operations
  },
  
  /**
   * ARIA live region settings for field arrays
   */
  LIVE_REGIONS: {
    itemChangePoliteness: 'polite' as const,
    errorPoliteness: 'polite' as const,
    urgentPoliteness: 'assertive' as const,
  },
  
  /**
   * Keyboard navigation keys for field arrays
   */
  KEYBOARD_NAVIGATION: {
    addItem: ['Enter', ' '], // Enter or Space
    removeItem: ['Delete', 'Backspace'],
    reorderUp: ['ArrowUp'],
    reorderDown: ['ArrowDown'],
    selectItem: ['Enter', ' '],
  },
} as const;

/**
 * Performance optimization constants for field array system
 * Ensures optimal performance with large datasets (1000+ items)
 */
export const FIELD_ARRAY_PERFORMANCE_CONSTANTS = {
  /**
   * Virtual scrolling thresholds and configuration
   */
  VIRTUALIZATION: {
    threshold: 100, // items before virtualization kicks in
    itemHeight: 48, // default item height in pixels
    bufferSize: 5, // number of items to render outside viewport
    overscan: 2, // additional items to render for smooth scrolling
  },
  
  /**
   * Debounce delays for performance optimization
   */
  DEBOUNCE: {
    onChange: 100, // milliseconds for onChange events
    onValidation: 300, // milliseconds for validation
    onFilter: 200, // milliseconds for filtering
    onSearch: 250, // milliseconds for search
  },
  
  /**
   * Performance monitoring thresholds
   */
  PERFORMANCE_THRESHOLDS: {
    rendering: 16, // milliseconds (60fps)
    itemUpdate: 50, // milliseconds per item update
    validation: 100, // milliseconds per validation cycle
    reorder: 200, // milliseconds for reorder operations
  },
  
  /**
   * Maximum recommended limits for optimal performance
   */
  LIMITS: {
    maxItems: 1000, // maximum items before warning
    maxConcurrentOperations: 10, // maximum concurrent async operations
    maxTableColumns: 20, // maximum table columns before horizontal scroll
  },
  
  /**
   * Memory optimization settings
   */
  MEMORY: {
    itemCacheSize: 500, // maximum cached item components
    validationCacheSize: 100, // maximum cached validation results
    gcThreshold: 1000, // items before garbage collection consideration
  },
} as const;

/**
 * Default field array configuration for consistent application defaults
 */
export const DEFAULT_FIELD_ARRAY_CONFIG = {
  mode: 'array' as FieldArrayModeUnion,
  layout: 'table' as FieldArrayLayoutUnion,
  size: 'md' as FieldArraySizeUnion,
  addButtonPlacement: 'bottom' as AddButtonPlacementUnion,
  minItems: 0,
  maxItems: undefined,
  sortable: false,
  allowDuplicates: true,
  selectable: false,
  showIndices: false,
  showLabels: true,
  showBorders: true,
  collapsible: false,
  virtualized: false,
  memoizeItems: true,
  debounceDelay: 100,
  
  // Accessibility defaults
  ariaLive: 'polite' as const,
  announcements: {
    itemAdded: 'Item added to array',
    itemRemoved: 'Item removed from array',
    itemReordered: 'Item position changed',
    validationError: 'Validation error in field array',
  },
  
  // Performance defaults
  virtualItemHeight: 48,
  virtualBufferSize: 5,
  virtualThreshold: 100,
} as const;

/**
 * Default table configuration for table mode field arrays
 */
export const DEFAULT_TABLE_CONFIG: Partial<TableConfig> = {
  virtualized: false,
  itemHeight: 48,
  maxHeight: '400px',
  stickyHeader: true,
  bordered: true,
  striped: false,
  hoverable: true,
  responsive: true,
  responsiveBreakpoint: 'md',
} as const;

/**
 * Default item configuration for object mode field arrays
 */
export const DEFAULT_ITEM_CONFIG: Partial<FieldArrayItemConfig> = {
  required: false,
  width: undefined,
  fullWidth: false,
  order: undefined,
} as const;

// =============================================================================
// UTILITY CONSTANTS
// =============================================================================

/**
 * Field array integration constants for component compatibility
 */
export const FIELD_ARRAY_INTEGRATION_CONSTANTS = {
  /**
   * Supported field types for DynamicField integration
   */
  SUPPORTED_FIELD_TYPES: [
    'string',
    'number',
    'boolean',
    'select',
    'multiselect',
    'date',
    'datetime-local',
    'time',
    'url',
    'email',
    'tel',
    'password',
    'textarea',
    'verb_mask',
    'file',
    'color',
    'range',
  ] as const,
  
  /**
   * Supported VerbPicker modes
   */
  VERB_PICKER_MODES: [
    'verb',
    'verb_multiple',
    'number',
  ] as const,
  
  /**
   * Default component mappings
   */
  COMPONENT_MAPPINGS: {
    string: 'Input',
    number: 'NumberInput',
    boolean: 'Checkbox',
    select: 'Select',
    multiselect: 'MultiSelect',
    textarea: 'Textarea',
    verb_mask: 'VerbPicker',
    date: 'DatePicker',
    file: 'FileInput',
  } as const,
} as const;