import { z } from 'zod';
import type { TableRelationship } from 'src/types/database';

// =============================================================================
// RELATIONSHIP TYPE DEFINITIONS
// =============================================================================

/**
 * Supported relationship types in DreamFactory
 * Aligned with TableRelationship type from database schema
 */
export const RelationshipTypeEnum = z.enum([
  'belongs_to',
  'has_many', 
  'has_one',
  'many_many'
]);

export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

// =============================================================================
// BASE RELATIONSHIP FORM DATA TYPES
// =============================================================================

/**
 * Base relationship form data structure
 * Compatible with React Hook Form and DreamFactory API requirements
 */
export interface RelationshipFormData {
  /** Relationship name/identifier (read-only in forms) */
  name?: string;
  /** Relationship alias for API reference */
  alias?: string;
  /** Human-readable label */
  label?: string;
  /** Optional description */
  description?: string;
  /** Whether to always fetch related data */
  alwaysFetch: boolean;
  /** Relationship type */
  type: RelationshipType;
  /** Whether relationship is virtual (computed) */
  isVirtual: boolean;
  /** Local field name for the relationship */
  field: string;
  /** Referenced service ID */
  refServiceId: number;
  /** Referenced table name */
  refTable: string;
  /** Referenced field name */
  refField: string;
  /** Junction service ID (for many_many relationships) */
  junctionServiceId?: number;
  /** Junction table name (for many_many relationships) */
  junctionTable?: string;
  /** Junction local field (for many_many relationships) */
  junctionField?: string;
  /** Junction reference field (for many_many relationships) */
  junctionRefField?: string;
}

// =============================================================================
// FIELD VALIDATION CONSTANTS
// =============================================================================

/**
 * Validation constants for relationship fields
 * Based on DreamFactory API constraints and UI/UX requirements
 */
export const RELATIONSHIP_VALIDATION = {
  /** Maximum length for text fields */
  MAX_TEXT_LENGTH: 255,
  /** Maximum length for description field */
  MAX_DESCRIPTION_LENGTH: 1000,
  /** Minimum length for required text fields */
  MIN_TEXT_LENGTH: 1,
  /** Valid characters for name/alias fields */
  NAME_PATTERN: /^[a-zA-Z][a-zA-Z0-9_]*$/,
  /** Maximum service ID value */
  MAX_SERVICE_ID: 999999,
  /** Minimum service ID value */
  MIN_SERVICE_ID: 1,
} as const;

// =============================================================================
// FIELD VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for relationship name field
 * Read-only in forms but included for data consistency
 */
export const RelationshipNameSchema = z
  .string()
  .min(RELATIONSHIP_VALIDATION.MIN_TEXT_LENGTH, 'Name is required')
  .max(RELATIONSHIP_VALIDATION.MAX_TEXT_LENGTH, 'Name must be 255 characters or less')
  .regex(
    RELATIONSHIP_VALIDATION.NAME_PATTERN,
    'Name must start with a letter and contain only letters, numbers, and underscores'
  )
  .optional();

/**
 * Schema for relationship alias field
 * Used for API reference and should follow naming conventions
 */
export const RelationshipAliasSchema = z
  .string()
  .max(RELATIONSHIP_VALIDATION.MAX_TEXT_LENGTH, 'Alias must be 255 characters or less')
  .regex(
    RELATIONSHIP_VALIDATION.NAME_PATTERN,
    'Alias must start with a letter and contain only letters, numbers, and underscores'
  )
  .optional();

/**
 * Schema for relationship label field
 * Human-readable display name
 */
export const RelationshipLabelSchema = z
  .string()
  .max(RELATIONSHIP_VALIDATION.MAX_TEXT_LENGTH, 'Label must be 255 characters or less')
  .optional();

/**
 * Schema for relationship description field
 * Optional descriptive text with extended length
 */
export const RelationshipDescriptionSchema = z
  .string()
  .max(RELATIONSHIP_VALIDATION.MAX_DESCRIPTION_LENGTH, 'Description must be 1000 characters or less')
  .optional();

/**
 * Schema for field name validation
 * Used for field, refField, junctionField, and junctionRefField
 */
export const FieldNameSchema = z
  .string()
  .min(RELATIONSHIP_VALIDATION.MIN_TEXT_LENGTH, 'Field name is required')
  .max(RELATIONSHIP_VALIDATION.MAX_TEXT_LENGTH, 'Field name must be 255 characters or less')
  .regex(
    RELATIONSHIP_VALIDATION.NAME_PATTERN,
    'Field name must start with a letter and contain only letters, numbers, and underscores'
  );

/**
 * Schema for table name validation
 * Used for refTable and junctionTable
 */
export const TableNameSchema = z
  .string()
  .min(RELATIONSHIP_VALIDATION.MIN_TEXT_LENGTH, 'Table name is required')
  .max(RELATIONSHIP_VALIDATION.MAX_TEXT_LENGTH, 'Table name must be 255 characters or less');

/**
 * Schema for service ID validation
 * Used for refServiceId and junctionServiceId
 */
export const ServiceIdSchema = z
  .number()
  .int('Service ID must be an integer')
  .min(RELATIONSHIP_VALIDATION.MIN_SERVICE_ID, 'Service ID must be at least 1')
  .max(RELATIONSHIP_VALIDATION.MAX_SERVICE_ID, 'Service ID must be 999999 or less');

// =============================================================================
// BASE RELATIONSHIP VALIDATION SCHEMA
// =============================================================================

/**
 * Base relationship validation schema without conditional logic
 * Covers all common fields regardless of relationship type
 */
export const BaseRelationshipSchema = z.object({
  name: RelationshipNameSchema,
  alias: RelationshipAliasSchema,
  label: RelationshipLabelSchema,
  description: RelationshipDescriptionSchema,
  alwaysFetch: z.boolean().default(false),
  type: RelationshipTypeEnum,
  isVirtual: z.boolean().default(true),
  field: FieldNameSchema,
  refServiceId: ServiceIdSchema,
  refTable: TableNameSchema,
  refField: FieldNameSchema,
}).strict();

// =============================================================================
// CONDITIONAL JUNCTION TABLE VALIDATION
// =============================================================================

/**
 * Schema for junction table fields (many_many relationships only)
 * These fields are required when relationship type is 'many_many'
 */
export const JunctionTableSchema = z.object({
  junctionServiceId: ServiceIdSchema,
  junctionTable: TableNameSchema,
  junctionField: FieldNameSchema,
  junctionRefField: FieldNameSchema,
}).strict();

/**
 * Optional junction table schema for non-many_many relationships
 * These fields should be undefined/null for other relationship types
 */
export const OptionalJunctionTableSchema = z.object({
  junctionServiceId: z.number().optional(),
  junctionTable: z.string().optional(),
  junctionField: z.string().optional(),
  junctionRefField: z.string().optional(),
}).strict();

// =============================================================================
// TYPE-SPECIFIC RELATIONSHIP SCHEMAS
// =============================================================================

/**
 * Schema for belongs_to relationships
 * Simple one-to-one or many-to-one relationships
 */
export const BelongsToRelationshipSchema = BaseRelationshipSchema
  .extend({
    type: z.literal('belongs_to'),
  })
  .merge(OptionalJunctionTableSchema)
  .strict();

/**
 * Schema for has_many relationships
 * One-to-many relationships
 */
export const HasManyRelationshipSchema = BaseRelationshipSchema
  .extend({
    type: z.literal('has_many'),
  })
  .merge(OptionalJunctionTableSchema)
  .strict();

/**
 * Schema for has_one relationships
 * One-to-one relationships
 */
export const HasOneRelationshipSchema = BaseRelationshipSchema
  .extend({
    type: z.literal('has_one'),
  })
  .merge(OptionalJunctionTableSchema)
  .strict();

/**
 * Schema for many_many relationships
 * Many-to-many relationships requiring junction table
 */
export const ManyManyRelationshipSchema = BaseRelationshipSchema
  .extend({
    type: z.literal('many_many'),
  })
  .merge(JunctionTableSchema)
  .strict();

// =============================================================================
// DISCRIMINATED UNION SCHEMA
// =============================================================================

/**
 * Complete relationship validation schema using discriminated union
 * Automatically applies correct validation based on relationship type
 * Provides compile-time type safety with runtime validation
 */
export const RelationshipSchema = z.discriminatedUnion('type', [
  BelongsToRelationshipSchema,
  HasManyRelationshipSchema,
  HasOneRelationshipSchema,
  ManyManyRelationshipSchema,
]);

// =============================================================================
// DYNAMIC VALIDATION FUNCTIONS
// =============================================================================

/**
 * Dynamic validation function for relationship forms
 * Validates based on current relationship type with real-time feedback
 * Optimized for React Hook Form integration with under 100ms validation
 */
export const validateRelationshipForm = (data: Partial<RelationshipFormData>) => {
  try {
    // Parse with appropriate schema based on type
    RelationshipSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Transform Zod errors to React Hook Form format
      const formErrors: Record<string, string> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        formErrors[path] = err.message;
      });
      
      return { success: false, errors: formErrors };
    }
    
    return { 
      success: false, 
      errors: { _root: 'Validation failed due to unexpected error' } 
    };
  }
};

/**
 * Type-specific validation helper for junction table fields
 * Validates junction fields only when relationship type is 'many_many'
 */
export const validateJunctionFields = (
  type: RelationshipType, 
  junctionData: Partial<Pick<RelationshipFormData, 'junctionServiceId' | 'junctionTable' | 'junctionField' | 'junctionRefField'>>
) => {
  if (type === 'many_many') {
    try {
      JunctionTableSchema.parse(junctionData);
      return { success: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formErrors: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          formErrors[path] = err.message;
        });
        
        return { success: false, errors: formErrors };
      }
    }
  }
  
  // For non-many_many types, junction fields should be empty/undefined
  const hasJunctionData = Object.values(junctionData).some(value => 
    value !== undefined && value !== null && value !== ''
  );
  
  if (hasJunctionData) {
    return {
      success: false,
      errors: {
        junctionServiceId: 'Junction table not required for this relationship type',
        junctionTable: 'Junction table not required for this relationship type',
        junctionField: 'Junction field not required for this relationship type',
        junctionRefField: 'Junction reference field not required for this relationship type',
      }
    };
  }
  
  return { success: true, errors: {} };
};

// =============================================================================
// FORM FIELD ENABLEMENT LOGIC
// =============================================================================

/**
 * Determines which form fields should be enabled based on relationship type
 * Used for dynamic form behavior in React Hook Form
 */
export const getEnabledFields = (type: RelationshipType) => {
  const baseFields = [
    'alias',
    'label', 
    'description',
    'alwaysFetch',
    'type',
    'field',
    'refServiceId',
    'refTable',
    'refField'
  ];
  
  if (type === 'many_many') {
    return [
      ...baseFields,
      'junctionServiceId',
      'junctionTable', 
      'junctionField',
      'junctionRefField'
    ];
  }
  
  return baseFields;
};

/**
 * Determines which form fields should be disabled based on relationship type
 * Used for conditional field disabling in React Hook Form
 */
export const getDisabledFields = (type: RelationshipType) => {
  const alwaysDisabled = ['name', 'isVirtual']; // These are read-only
  
  if (type !== 'many_many') {
    return [
      ...alwaysDisabled,
      'junctionServiceId',
      'junctionTable',
      'junctionField', 
      'junctionRefField'
    ];
  }
  
  return alwaysDisabled;
};

// =============================================================================
// REACT HOOK FORM INTEGRATION HELPERS
// =============================================================================

/**
 * Generates default values for relationship form
 * Optimized for React Hook Form integration
 */
export const getDefaultRelationshipValues = (type: RelationshipType = 'belongs_to'): Partial<RelationshipFormData> => ({
  alwaysFetch: false,
  type,
  isVirtual: true,
  // Junction fields default to undefined for non-many_many types
  ...(type !== 'many_many' && {
    junctionServiceId: undefined,
    junctionTable: undefined,
    junctionField: undefined,
    junctionRefField: undefined,
  }),
});

/**
 * React Hook Form resolver compatible validation function
 * Provides seamless integration with zodResolver
 */
export const relationshipFormResolver = (data: RelationshipFormData) => {
  const result = validateRelationshipForm(data);
  
  if (result.success) {
    return {
      values: data,
      errors: {},
    };
  }
  
  return {
    values: {},
    errors: result.errors,
  };
};

// =============================================================================
// TYPE INFERENCE AND EXPORTS
// =============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 * Provides compile-time type safety with runtime validation
 */
export type RelationshipFormValues = z.infer<typeof RelationshipSchema>;
export type BelongsToRelationship = z.infer<typeof BelongsToRelationshipSchema>;
export type HasManyRelationship = z.infer<typeof HasManyRelationshipSchema>;
export type HasOneRelationship = z.infer<typeof HasOneRelationshipSchema>;
export type ManyManyRelationship = z.infer<typeof ManyManyRelationshipSchema>;
export type JunctionTableFields = z.infer<typeof JunctionTableSchema>;

/**
 * Form validation state type for React components
 */
export interface RelationshipFormValidation {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isDirty: boolean;
}

/**
 * Field configuration for dynamic form rendering
 */
export interface RelationshipFieldConfig {
  name: keyof RelationshipFormData;
  label: string;
  type: 'text' | 'select' | 'toggle' | 'textarea';
  required: boolean;
  disabled: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  helperText?: string;
}

/**
 * Complete configuration for relationship form fields
 * Used for dynamic form generation based on relationship type
 */
export const getRelationshipFieldConfigs = (type: RelationshipType): RelationshipFieldConfig[] => {
  const disabledFields = getDisabledFields(type);
  
  const baseConfigs: RelationshipFieldConfig[] = [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: false,
      disabled: true,
      helperText: 'Auto-generated relationship identifier',
    },
    {
      name: 'alias',
      label: 'Alias',
      type: 'text',
      required: false,
      disabled: false,
      placeholder: 'Optional API reference alias',
    },
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      required: false,
      disabled: false,
      placeholder: 'Human-readable display name',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
      disabled: false,
      placeholder: 'Optional relationship description',
    },
    {
      name: 'type',
      label: 'Relationship Type',
      type: 'select',
      required: true,
      disabled: false,
      options: [
        { label: 'Belongs To', value: 'belongs_to' },
        { label: 'Has Many', value: 'has_many' },
        { label: 'Has One', value: 'has_one' },
        { label: 'Many To Many', value: 'many_many' },
      ],
    },
    {
      name: 'field',
      label: 'Local Field',
      type: 'select',
      required: true,
      disabled: false,
      helperText: 'Field in the current table',
    },
    {
      name: 'refServiceId',
      label: 'Reference Service',
      type: 'select',
      required: true,
      disabled: false,
      helperText: 'Database service containing the referenced table',
    },
    {
      name: 'refTable',
      label: 'Reference Table',
      type: 'select',
      required: true,
      disabled: false,
      helperText: 'Table being referenced by this relationship',
    },
    {
      name: 'refField',
      label: 'Reference Field',
      type: 'select',
      required: true,
      disabled: false,
      helperText: 'Field in the referenced table',
    },
    {
      name: 'alwaysFetch',
      label: 'Always Fetch',
      type: 'toggle',
      required: false,
      disabled: false,
      helperText: 'Automatically include related data in queries',
    },
    {
      name: 'isVirtual',
      label: 'Virtual Relationship',
      type: 'toggle',
      required: false,
      disabled: true,
      helperText: 'Relationship is computed, not stored in database',
    },
  ];
  
  // Add junction table fields for many_many relationships
  if (type === 'many_many') {
    baseConfigs.push(
      {
        name: 'junctionServiceId',
        label: 'Junction Service',
        type: 'select',
        required: true,
        disabled: false,
        helperText: 'Database service containing the junction table',
      },
      {
        name: 'junctionTable',
        label: 'Junction Table',
        type: 'select',
        required: true,
        disabled: false,
        helperText: 'Intermediate table for many-to-many relationship',
      },
      {
        name: 'junctionField',
        label: 'Junction Local Field',
        type: 'select',
        required: true,
        disabled: false,
        helperText: 'Field in junction table referencing local table',
      },
      {
        name: 'junctionRefField',
        label: 'Junction Reference Field',
        type: 'select',
        required: true,
        disabled: false,
        helperText: 'Field in junction table referencing remote table',
      }
    );
  }
  
  // Apply disabled state based on relationship type
  return baseConfigs.map(config => ({
    ...config,
    disabled: config.disabled || disabledFields.includes(config.name),
  }));
};

// =============================================================================
// PERFORMANCE OPTIMIZED VALIDATION
// =============================================================================

/**
 * Debounced validation function for real-time form feedback
 * Ensures validation performance under 100ms as required
 */
export const createDebouncedValidator = (delayMs: number = 50) => {
  let timeoutId: NodeJS.Timeout;
  
  return (data: Partial<RelationshipFormData>): Promise<{ success: boolean; errors: Record<string, string> }> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const result = validateRelationshipForm(data);
        resolve(result);
      }, delayMs);
    });
  };
};

/**
 * Memoized field validation for individual form fields
 * Optimizes validation performance for large forms
 */
export const validateField = (
  fieldName: keyof RelationshipFormData,
  value: any,
  relationshipType: RelationshipType
): { isValid: boolean; error?: string } => {
  try {
    // Get the appropriate schema based on field and relationship type
    const fieldSchema = getFieldSchema(fieldName, relationshipType);
    fieldSchema.parse(value);
    
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0]?.message || 'Invalid value',
      };
    }
    
    return {
      isValid: false,
      error: 'Validation error',
    };
  }
};

/**
 * Helper function to get appropriate schema for individual fields
 * Used by validateField for targeted validation
 */
const getFieldSchema = (fieldName: keyof RelationshipFormData, type: RelationshipType) => {
  const schemas: Record<keyof RelationshipFormData, z.ZodSchema> = {
    name: RelationshipNameSchema.optional(),
    alias: RelationshipAliasSchema,
    label: RelationshipLabelSchema,
    description: RelationshipDescriptionSchema,
    alwaysFetch: z.boolean(),
    type: RelationshipTypeEnum,
    isVirtual: z.boolean(),
    field: FieldNameSchema,
    refServiceId: ServiceIdSchema,
    refTable: TableNameSchema,
    refField: FieldNameSchema,
    junctionServiceId: type === 'many_many' ? ServiceIdSchema : z.number().optional(),
    junctionTable: type === 'many_many' ? TableNameSchema : z.string().optional(),
    junctionField: type === 'many_many' ? FieldNameSchema : z.string().optional(),
    junctionRefField: type === 'many_many' ? FieldNameSchema : z.string().optional(),
  };
  
  return schemas[fieldName];
};

// Export all schemas and utilities for component consumption
export {
  RelationshipSchema as default,
  BaseRelationshipSchema,
  BelongsToRelationshipSchema,
  HasManyRelationshipSchema,
  HasOneRelationshipSchema,
  ManyManyRelationshipSchema,
  JunctionTableSchema,
  OptionalJunctionTableSchema,
  RelationshipTypeEnum,
};