/**
 * @fileoverview Barrel export file for the field array component
 * 
 * Provides centralized imports for the DreamFactory Admin Interface field array component.
 * Enables clean imports like `import { FieldArray, FieldArrayProps } from '@/components/ui/field-array'`
 * with full TypeScript support and tree-shaking optimization.
 * 
 * This component manages arrays and objects of form fields with add/remove functionality,
 * integrates with React Hook Form useFieldArray hook, and maintains WCAG 2.1 AA compliance.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

// Primary field array component
export { FieldArray } from './field-array';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Component props and configuration interfaces
export type { 
  FieldArrayProps,
  FieldArrayConfig,
  FieldArrayValue,
  FieldArrayItem
} from './field-array.types';

// Field configuration types for array and object modes
export type {
  ArrayFieldConfig,
  ObjectFieldConfig,
  FieldArrayMode,
  FieldArraySchema
} from './field-array.types';

// React Hook Form integration types
export type {
  FieldArrayMethods,
  FieldArrayControl,
  FieldArrayPath,
  FieldArrayValidation
} from './field-array.types';

// Component state and event types
export type {
  FieldArrayState,
  FieldArrayAction,
  FieldArrayEvent,
  FieldArrayError
} from './field-array.types';

// Integration types for other components
export type {
  DynamicFieldIntegration,
  VerbPickerIntegration,
  TableLayoutConfig,
  ResponsiveConfig
} from './field-array.types';

// Theme and accessibility types
export type {
  FieldArrayTheme,
  FieldArrayAccessibility,
  AriaConfig,
  KeyboardConfig
} from './field-array.types';

// Data transformation and utility types
export type {
  ValueTransformer,
  FieldValidator,
  ArrayOperations,
  ObjectOperations
} from './field-array.types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Component utility functions (if any exist in the main component file)
export { 
  createFieldArrayConfig,
  validateFieldArrayValue,
  transformArrayToObject,
  transformObjectToArray,
  generateFieldId,
  getFieldArraySchema
} from './field-array';

// =============================================================================
// CONSTANTS AND DEFAULTS
// =============================================================================

// Default configuration values
export const DEFAULT_FIELD_ARRAY_CONFIG = {
  mode: 'array' as const,
  allowAdd: true,
  allowRemove: true,
  allowReorder: false,
  minItems: 0,
  maxItems: undefined,
  showIndex: true,
  showActions: true,
  responsive: true,
  accessible: true
} as const;

// Field array modes
export const FIELD_ARRAY_MODES = [
  'array',
  'object', 
  'mixed'
] as const;

// Action types for field operations
export const FIELD_ARRAY_ACTIONS = [
  'add',
  'remove',
  'move',
  'update',
  'clear',
  'reset'
] as const;

// Validation rules
export const FIELD_ARRAY_VALIDATION = {
  maxItems: 1000,
  maxDepth: 10,
  requiredFields: ['name', 'type'],
  allowedTypes: [
    'string',
    'number',
    'boolean',
    'date',
    'email',
    'url',
    'text',
    'select',
    'multiselect'
  ]
} as const;

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid field array mode
 */
export const isValidFieldArrayMode = (mode: unknown): mode is FieldArrayMode => {
  return typeof mode === 'string' && FIELD_ARRAY_MODES.includes(mode as FieldArrayMode);
};

/**
 * Type guard to check if a value is a valid field array action
 */
export const isValidFieldArrayAction = (action: unknown): action is FieldArrayAction => {
  return typeof action === 'string' && FIELD_ARRAY_ACTIONS.includes(action as FieldArrayAction);
};

/**
 * Validates field array configuration
 */
export const validateFieldArrayConfig = (config: Partial<FieldArrayConfig>): boolean => {
  if (config.mode && !isValidFieldArrayMode(config.mode)) return false;
  if (config.maxItems && (config.maxItems < 1 || config.maxItems > FIELD_ARRAY_VALIDATION.maxItems)) return false;
  if (config.minItems && config.minItems < 0) return false;
  if (config.minItems && config.maxItems && config.minItems > config.maxItems) return false;
  return true;
};

/**
 * Validates field array value structure
 */
export const validateFieldArrayValue = (value: unknown, config: FieldArrayConfig): boolean => {
  if (!Array.isArray(value) && config.mode === 'array') return false;
  if (typeof value !== 'object' && config.mode === 'object') return false;
  if (Array.isArray(value) && config.maxItems && value.length > config.maxItems) return false;
  if (Array.isArray(value) && config.minItems && value.length < config.minItems) return false;
  return true;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a new field array item with default values
 */
export const createFieldArrayItem = (schema: FieldArraySchema): FieldArrayItem => {
  const item: FieldArrayItem = {
    id: crypto.randomUUID(),
    values: {},
    errors: {},
    touched: false,
    valid: false
  };

  // Initialize default values based on schema
  schema.fields?.forEach(field => {
    switch (field.type) {
      case 'string':
      case 'email':
      case 'url':
      case 'text':
        item.values[field.name] = field.defaultValue || '';
        break;
      case 'number':
        item.values[field.name] = field.defaultValue || 0;
        break;
      case 'boolean':
        item.values[field.name] = field.defaultValue || false;
        break;
      case 'date':
        item.values[field.name] = field.defaultValue || new Date().toISOString();
        break;
      case 'select':
        item.values[field.name] = field.defaultValue || field.options?.[0]?.value || '';
        break;
      case 'multiselect':
        item.values[field.name] = field.defaultValue || [];
        break;
      default:
        item.values[field.name] = field.defaultValue || null;
    }
  });

  return item;
};

/**
 * Calculates field array statistics
 */
export const getFieldArrayStats = (value: FieldArrayValue): {
  itemCount: number;
  fieldCount: number;
  errorCount: number;
  completionRate: number;
} => {
  if (!Array.isArray(value)) {
    return {
      itemCount: 0,
      fieldCount: 0,
      errorCount: 0,
      completionRate: 0
    };
  }

  const itemCount = value.length;
  const fieldCount = value.reduce((total, item) => total + Object.keys(item.values || {}).length, 0);
  const errorCount = value.reduce((total, item) => total + Object.keys(item.errors || {}).length, 0);
  const touchedFields = value.reduce((total, item) => {
    return total + Object.values(item.values || {}).filter(val => val !== null && val !== '' && val !== undefined).length;
  }, 0);
  
  const completionRate = fieldCount > 0 ? (touchedFields / fieldCount) * 100 : 0;

  return {
    itemCount,
    fieldCount,
    errorCount,
    completionRate: Math.round(completionRate * 100) / 100
  };
};

/**
 * Optimizes field array for large datasets
 */
export const optimizeFieldArrayForLargeDataset = (config: FieldArrayConfig): FieldArrayConfig => {
  if (!config.maxItems || config.maxItems <= 100) {
    return config;
  }

  return {
    ...config,
    virtualized: true,
    lazyLoading: true,
    batchUpdates: true,
    debounceValidation: 300,
    showStats: true,
    chunkSize: 50
  };
};

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

/**
 * Generates ARIA attributes for field array accessibility
 */
export const generateFieldArrayAriaProps = (config: FieldArrayConfig, itemCount: number) => {
  return {
    'aria-label': config.label || 'Field array',
    'aria-describedby': config.description ? `${config.id}-description` : undefined,
    'aria-live': 'polite',
    'aria-atomic': 'false',
    'aria-relevant': 'additions removals',
    'aria-rowcount': itemCount,
    'role': 'table'
  };
};

/**
 * Generates keyboard navigation props for field array
 */
export const generateFieldArrayKeyboardProps = (onAction: (action: FieldArrayAction, index?: number) => void) => {
  return {
    onKeyDown: (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'Insert':
          event.preventDefault();
          onAction('add');
          break;
        case 'Delete':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onAction('clear');
          }
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onAction('add');
          }
          break;
      }
    }
  };
};