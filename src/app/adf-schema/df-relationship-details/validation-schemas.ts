/**
 * Zod validation schemas for relationship form data
 * 
 * Replaces Angular Validators with Zod schema validators integrated with React Hook Form
 * per React/Next.js Integration Requirements. Provides runtime type checking with 
 * compile-time inference per Section 3.2.3 validation approach.
 * 
 * Features:
 * - TypeScript 5.8+ enhanced template literal types for form validation
 * - Relationship-specific validation rules for belongs_to and many_many types
 * - Dynamic validation logic for junction table requirements
 * - React Hook Form zodResolver integration for seamless validation
 * - Real-time validation under 100ms performance target
 * - Comprehensive validation testing support
 */

import { z } from 'zod';
import type { RelationshipType, TableRelationship } from '../../types/database';

// ============================================================================
// RELATIONSHIP TYPE DEFINITIONS
// ============================================================================

/** Supported relationship types with enhanced template literal types */
export const relationshipTypes = ['belongs_to', 'has_many', 'has_one', 'many_many'] as const;

/** Enhanced TypeScript 5.8+ template literal type for relationship validation */
export type RelationshipTypeTemplate = typeof relationshipTypes[number];

/** Relationship type validation schema with runtime checking */
export const relationshipTypeSchema = z.enum(relationshipTypes, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return { 
        message: `Invalid relationship type. Must be one of: ${relationshipTypes.join(', ')}` 
      };
    }
    return { message: ctx.defaultError };
  }
});

// ============================================================================
// FIELD OPTION SCHEMAS
// ============================================================================

/** Basic option interface for dropdowns and selects */
export const basicOptionSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  value: z.union([z.string(), z.number()]),
  name: z.string().optional()
});

export type BasicOption = z.infer<typeof basicOptionSchema>;

/** Service option schema for service selection */
export const serviceOptionSchema = basicOptionSchema.extend({
  value: z.number().positive('Service ID must be a positive number'),
  name: z.string().min(1, 'Service name is required')
});

export type ServiceOption = z.infer<typeof serviceOptionSchema>;

/** Field option schema for field selection */
export const fieldOptionSchema = basicOptionSchema.extend({
  value: z.string().min(1, 'Field name is required')
});

export type FieldOption = z.infer<typeof fieldOptionSchema>;

/** Table option schema for table selection */
export const tableOptionSchema = basicOptionSchema.extend({
  value: z.string().min(1, 'Table name is required')
});

export type TableOption = z.infer<typeof tableOptionSchema>;

// ============================================================================
// BASE RELATIONSHIP SCHEMA
// ============================================================================

/** 
 * Base relationship schema with common fields and validation rules
 * Implements TypeScript 5.8+ enhanced template literal types for form validation
 */
export const baseRelationshipSchema = z.object({
  /** Relationship name - auto-generated, read-only in create mode */
  name: z.string()
    .min(1, 'Relationship name is required')
    .max(64, 'Relationship name must be 64 characters or less')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Relationship name must start with a letter or underscore and contain only letters, numbers, and underscores'
    )
    .optional(),

  /** Optional alias for the relationship */
  alias: z.string()
    .max(64, 'Alias must be 64 characters or less')
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      'Alias must start with a letter or underscore and contain only letters, numbers, and underscores'
    )
    .optional()
    .or(z.literal('')),

  /** Display label for the relationship */
  label: z.string()
    .max(255, 'Label must be 255 characters or less')
    .optional()
    .or(z.literal('')),

  /** Optional description of the relationship */
  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),

  /** Whether to always fetch related data */
  alwaysFetch: z.boolean()
    .default(false),

  /** Relationship type - required field */
  type: relationshipTypeSchema,

  /** Whether this is a virtual relationship */
  isVirtual: z.boolean()
    .default(true),

  /** Local field for the relationship - required */
  field: z.string()
    .min(1, 'Local field is required')
    .max(64, 'Field name must be 64 characters or less'),

  /** Reference service ID - required */
  refServiceId: z.number()
    .positive('Reference service is required'),

  /** Reference table - required */
  refTable: z.string()
    .min(1, 'Reference table is required')
    .max(64, 'Table name must be 64 characters or less'),

  /** Reference field - required */
  refField: z.string()
    .min(1, 'Reference field is required')
    .max(64, 'Field name must be 64 characters or less')
});

export type BaseRelationshipFormData = z.infer<typeof baseRelationshipSchema>;

// ============================================================================
// JUNCTION TABLE SCHEMAS FOR MANY-TO-MANY RELATIONSHIPS
// ============================================================================

/** 
 * Junction table schema for many-to-many relationships
 * Implements dynamic validation logic per business logic requirements
 */
export const junctionTableSchema = z.object({
  /** Junction service ID - required for many_many */
  junctionServiceId: z.number()
    .positive('Junction service is required for many-to-many relationships'),

  /** Junction table - required for many_many */
  junctionTable: z.string()
    .min(1, 'Junction table is required for many-to-many relationships')
    .max(64, 'Table name must be 64 characters or less'),

  /** Junction field (local key in junction table) - required for many_many */
  junctionField: z.string()
    .min(1, 'Junction field is required for many-to-many relationships')
    .max(64, 'Field name must be 64 characters or less'),

  /** Junction reference field (foreign key in junction table) - required for many_many */
  junctionRefField: z.string()
    .min(1, 'Junction reference field is required for many-to-many relationships')
    .max(64, 'Field name must be 64 characters or less')
});

export type JunctionTableFormData = z.infer<typeof junctionTableSchema>;

/** 
 * Optional junction table schema for non-many-to-many relationships
 * All fields are optional and nullable for other relationship types
 */
export const optionalJunctionTableSchema = z.object({
  junctionServiceId: z.number().positive().optional().nullable(),
  junctionTable: z.string().max(64).optional().nullable().or(z.literal('')),
  junctionField: z.string().max(64).optional().nullable().or(z.literal('')),
  junctionRefField: z.string().max(64).optional().nullable().or(z.literal(''))
});

export type OptionalJunctionTableFormData = z.infer<typeof optionalJunctionTableSchema>;

// ============================================================================
// RELATIONSHIP TYPE-SPECIFIC SCHEMAS
// ============================================================================

/** 
 * Schema for belongs_to relationships
 * Junction fields are optional and should be null/empty
 */
export const belongsToRelationshipSchema = baseRelationshipSchema
  .extend({
    type: z.literal('belongs_to')
  })
  .merge(optionalJunctionTableSchema);

export type BelongsToRelationshipFormData = z.infer<typeof belongsToRelationshipSchema>;

/** 
 * Schema for has_many relationships  
 * Junction fields are optional and should be null/empty
 */
export const hasManyRelationshipSchema = baseRelationshipSchema
  .extend({
    type: z.literal('has_many')
  })
  .merge(optionalJunctionTableSchema);

export type HasManyRelationshipFormData = z.infer<typeof hasManyRelationshipSchema>;

/** 
 * Schema for has_one relationships
 * Junction fields are optional and should be null/empty
 */
export const hasOneRelationshipSchema = baseRelationshipSchema
  .extend({
    type: z.literal('has_one')
  })
  .merge(optionalJunctionTableSchema);

export type HasOneRelationshipFormData = z.infer<typeof hasOneRelationshipSchema>;

/** 
 * Schema for many_many relationships with required junction table configuration
 * Implements relationship-specific validation rules per business logic requirements
 */
export const manyManyRelationshipSchema = baseRelationshipSchema
  .extend({
    type: z.literal('many_many')
  })
  .merge(junctionTableSchema);

export type ManyManyRelationshipFormData = z.infer<typeof manyManyRelationshipSchema>;

// ============================================================================
// UNIFIED RELATIONSHIP SCHEMA WITH DYNAMIC VALIDATION
// ============================================================================

/**
 * Complete relationship form schema with dynamic validation logic
 * Implements runtime type checking with compile-time inference per Section 3.2.3
 * 
 * Key Features:
 * - Type-safe discriminated union based on relationship type
 * - Dynamic validation for junction table requirements  
 * - Compile-time TypeScript inference for form data
 * - Runtime validation under 100ms performance target
 * - React Hook Form zodResolver compatibility
 */
export const relationshipFormSchema = z.discriminatedUnion('type', [
  belongsToRelationshipSchema,
  hasManyRelationshipSchema,
  hasOneRelationshipSchema,
  manyManyRelationshipSchema
]);

export type RelationshipFormData = z.infer<typeof relationshipFormSchema>;

// ============================================================================
// RELATIONSHIP FORM SCHEMA WITH OPTIONAL FIELDS FOR CREATION
// ============================================================================

/**
 * Relationship creation schema with relaxed validation for initial form state
 * Allows partial form data during form building and dynamic field updates
 */
export const relationshipCreationSchema = baseRelationshipSchema
  .extend({
    // Make relationship type optional for initial form state
    type: relationshipTypeSchema.optional(),
    
    // Make required fields optional for progressive form completion
    field: z.string().max(64).optional().or(z.literal('')),
    refServiceId: z.number().positive().optional().nullable(),
    refTable: z.string().max(64).optional().or(z.literal('')),
    refField: z.string().max(64).optional().or(z.literal(''))
  })
  .merge(optionalJunctionTableSchema);

export type RelationshipCreationFormData = z.infer<typeof relationshipCreationSchema>;

// ============================================================================
// RELATIONSHIP FORM VALIDATION UTILITIES
// ============================================================================

/**
 * Enhanced validation function with TypeScript 5.8+ template literal types
 * Provides runtime type checking and compile-time inference
 * 
 * @param data - Form data to validate
 * @param mode - Validation mode: 'create' | 'edit' | 'submit'
 * @returns Validation result with type-safe error information
 */
export function validateRelationshipForm(
  data: Partial<RelationshipFormData>,
  mode: 'create' | 'edit' | 'submit' = 'submit'
): {
  success: boolean;
  data?: RelationshipFormData;
  errors?: z.ZodError;
  fieldErrors?: Record<string, string[]>;
} {
  try {
    // Use creation schema for progressive validation
    if (mode === 'create') {
      const result = relationshipCreationSchema.parse(data);
      return { success: true, data: result as RelationshipFormData };
    }

    // Use full schema for final validation
    const result = relationshipFormSchema.parse(data);
    return { success: true, data: result };

  } catch (error) {
    if (error instanceof z.ZodError) {
      // Transform Zod errors into field-level error map for React Hook Form
      const fieldErrors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const fieldPath = err.path.join('.');
        if (!fieldErrors[fieldPath]) {
          fieldErrors[fieldPath] = [];
        }
        fieldErrors[fieldPath].push(err.message);
      });

      return {
        success: false,
        errors: error,
        fieldErrors
      };
    }

    // Handle unexpected errors
    return {
      success: false,
      errors: new z.ZodError([{
        code: z.ZodIssueCode.custom,
        message: 'Unexpected validation error',
        path: []
      }])
    };
  }
}

/**
 * Type guard to check if relationship requires junction table
 * Implements business logic requirements for many_many relationships
 */
export function requiresJunctionTable(type: RelationshipType): type is 'many_many' {
  return type === 'many_many';
}

/**
 * Type guard to check if form data is valid for many-to-many relationship
 * Ensures all junction fields are present when required
 */
export function isValidManyManyRelationship(
  data: Partial<RelationshipFormData>
): data is ManyManyRelationshipFormData {
  if (data.type !== 'many_many') return false;
  
  return !!(
    data.junctionServiceId &&
    data.junctionTable &&
    data.junctionField &&
    data.junctionRefField
  );
}

/**
 * Utility to get default form values based on relationship type
 * Optimizes form initialization for different relationship types
 */
export function getDefaultRelationshipFormValues(
  type?: RelationshipType
): Partial<RelationshipFormData> {
  const baseDefaults: Partial<RelationshipFormData> = {
    alias: '',
    label: '',
    description: '',
    alwaysFetch: false,
    isVirtual: true,
    field: '',
    refServiceId: undefined,
    refTable: '',
    refField: ''
  };

  if (type === 'many_many') {
    return {
      ...baseDefaults,
      type,
      junctionServiceId: undefined,
      junctionTable: '',
      junctionField: '',
      junctionRefField: ''
    };
  }

  return {
    ...baseDefaults,
    type,
    junctionServiceId: null,
    junctionTable: null,
    junctionField: null,
    junctionRefField: null
  };
}

// ============================================================================
// REACT HOOK FORM INTEGRATION SCHEMAS
// ============================================================================

/**
 * Form field validation schema for React Hook Form integration
 * Ensures seamless validation integration per Section 3.2.3 form implementation patterns
 */
export const relationshipFormFieldsSchema = z.object({
  name: z.string().optional(),
  alias: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  alwaysFetch: z.boolean(),
  type: relationshipTypeSchema,
  isVirtual: z.boolean(),
  field: z.string().min(1),
  refServiceId: z.number().positive(),
  refTable: z.string().min(1),
  refField: z.string().min(1),
  junctionServiceId: z.number().positive().optional().nullable(),
  junctionTable: z.string().optional().nullable(),
  junctionField: z.string().optional().nullable(),
  junctionRefField: z.string().optional().nullable()
});

/**
 * Form field validation with conditional requirements
 * Implements dynamic validation logic for junction table requirements
 */
export const conditionalRelationshipFormSchema = relationshipFormFieldsSchema
  .refine((data) => {
    // Validate junction fields are present for many_many relationships
    if (data.type === 'many_many') {
      return !!(
        data.junctionServiceId &&
        data.junctionTable &&
        data.junctionField &&
        data.junctionRefField
      );
    }
    return true;
  }, {
    message: 'Junction table configuration is required for many-to-many relationships',
    path: ['junctionServiceId']
  })
  .refine((data) => {
    // Validate junction fields are not present for non-many_many relationships
    if (data.type !== 'many_many') {
      return !(
        data.junctionServiceId ||
        data.junctionTable ||
        data.junctionField ||
        data.junctionRefField
      );
    }
    return true;
  }, {
    message: 'Junction table configuration should not be set for non-many-to-many relationships',
    path: ['junctionServiceId']
  });

export type ConditionalRelationshipFormData = z.infer<typeof conditionalRelationshipFormSchema>;

// ============================================================================
// PERFORMANCE OPTIMIZED VALIDATION SCHEMAS
// ============================================================================

/**
 * Lightweight validation schema for real-time field validation
 * Optimized for under 100ms validation performance per requirements
 */
export const quickValidationSchema = z.object({
  field: z.string().min(1).optional(),
  type: relationshipTypeSchema.optional(),
  refServiceId: z.number().positive().optional(),
  refTable: z.string().min(1).optional(),
  refField: z.string().min(1).optional()
});

/**
 * Field-specific validation schemas for incremental validation
 * Enables optimized real-time validation of individual form fields
 */
export const fieldValidationSchemas = {
  name: z.string().min(1).max(64).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  alias: z.string().max(64).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/).optional(),
  label: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
  type: relationshipTypeSchema,
  field: z.string().min(1).max(64),
  refServiceId: z.number().positive(),
  refTable: z.string().min(1).max(64),
  refField: z.string().min(1).max(64),
  junctionServiceId: z.number().positive().optional(),
  junctionTable: z.string().min(1).max(64).optional(),
  junctionField: z.string().min(1).max(64).optional(),
  junctionRefField: z.string().min(1).max(64).optional()
} as const;

// ============================================================================
// TYPE EXPORTS FOR CONVENIENCE
// ============================================================================

/** All form data types for type safety */
export type RelationshipFormDataUnion = 
  | BelongsToRelationshipFormData
  | HasManyRelationshipFormData  
  | HasOneRelationshipFormData
  | ManyManyRelationshipFormData;

/** Validation result type for form submission */
export interface RelationshipValidationResult {
  isValid: boolean;
  data?: RelationshipFormData;
  errors?: Record<string, string[]>;
  performance?: {
    validationTime: number;
    fieldCount: number;
  };
}

/** Form mode type for different validation contexts */
export type ValidationMode = 'create' | 'edit' | 'submit' | 'realtime';

// Re-export database types for convenience
export type { RelationshipType, TableRelationship } from '../../types/database';