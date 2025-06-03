/**
 * @fileoverview Custom React hook implementing comprehensive field validation logic with Zod schema validation 
 * and real-time validation under 100ms. Provides dynamic validation rules based on field types, constraints, 
 * and business logic requirements while maintaining compatibility with React Hook Form integration patterns.
 * 
 * This hook implements:
 * - Zod schema validators integrated with React Hook Form per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements  
 * - Comprehensive field validation per existing Angular validation patterns
 * - Type-safe validation workflows per Section 5.2 Component Details
 * - Dynamic validation schemas based on field type selection
 * - Comprehensive picklist CSV validation and JSON validation rules
 * - Field constraint validation (length, precision, scale) with type-specific rules
 * - Validation error handling compatible with React Hook Form error display patterns
 * 
 * @version 1.0.0
 * @created 2024-12-28
 */

import { z } from 'zod'
import { useMemo, useCallback, useRef } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import type { 
  FieldFormData, 
  DreamFactoryFieldType, 
  FieldValidationSchema,
  AsyncValidationResult,
  FieldValidationError,
  DbFunctionFormData
} from '../field.types'

// =============================================================================
// VALIDATION CONSTANTS AND HELPERS
// =============================================================================

/**
 * Field types that support length constraints
 */
const LENGTH_SUPPORTED_TYPES: DreamFactoryFieldType[] = [
  'string',
  'text', 
  'integer',
  'binary',
  'varbinary'
]

/**
 * Field types that support precision and scale constraints
 */
const PRECISION_SCALE_SUPPORTED_TYPES: DreamFactoryFieldType[] = [
  'decimal',
  'float',
  'double'
]

/**
 * Field types that support picklist values
 */
const PICKLIST_SUPPORTED_TYPES: DreamFactoryFieldType[] = [
  'string',
  'integer'
]

/**
 * Field types that support fixed length attribute
 */
const FIXED_LENGTH_SUPPORTED_TYPES: DreamFactoryFieldType[] = [
  'string'
]

/**
 * Field types that support multibyte characters
 */
const MULTIBYTE_SUPPORTED_TYPES: DreamFactoryFieldType[] = [
  'string'
]

/**
 * Reference foreign key actions
 */
const FOREIGN_KEY_ACTIONS = [
  'RESTRICT',
  'CASCADE', 
  'SET NULL',
  'NO ACTION',
  'SET DEFAULT'
] as const

/**
 * Database function usage contexts
 */
const FUNCTION_USE_CONTEXTS = [
  'create',
  'update',
  'read',
  'delete',
  'select',
  'insert'
] as const

// =============================================================================
// ZOD SCHEMA VALIDATORS
// =============================================================================

/**
 * JSON validation schema replacing Angular JsonValidator
 * Validates that the string is valid JSON syntax
 */
const jsonValidationSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true
      try {
        JSON.parse(value)
        return true
      } catch {
        return false
      }
    },
    {
      message: 'Invalid JSON format. Please provide valid JSON syntax.',
    }
  )

/**
 * CSV validation schema replacing Angular CsvValidator
 * Validates comma-separated values with word characters
 */
const csvValidationSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value || value.trim() === '') return true
      // Match the Angular regex: /^\w+(?:\s*,\s*\w+)*$/
      const csvRegex = /^\w+(?:\s*,\s*\w+)*$/
      return csvRegex.test(value.trim())
    },
    {
      message: 'Invalid CSV format. Use comma-separated alphanumeric values (e.g., value1, value2, value3).',
    }
  )

/**
 * Database function usage validation schema
 */
const dbFunctionSchema = z.object({
  id: z.string(),
  use: z
    .array(z.enum(FUNCTION_USE_CONTEXTS))
    .min(1, 'At least one usage context is required'),
  function: z
    .string()
    .min(1, 'Function expression is required')
    .max(255, 'Function expression cannot exceed 255 characters'),
})

/**
 * Field name validation with database naming constraints
 */
const fieldNameSchema = z
  .string()
  .min(1, 'Field name is required')
  .max(64, 'Field name cannot exceed 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
  )

/**
 * Alias validation with optional empty string
 */
const aliasSchema = z
  .string()
  .max(64, 'Alias cannot exceed 64 characters')
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    'Alias must start with a letter or underscore and contain only letters, numbers, and underscores'
  )
  .optional()
  .or(z.literal(''))

/**
 * Label validation for display purposes
 */
const labelSchema = z
  .string()
  .max(128, 'Label cannot exceed 128 characters')
  .optional()
  .or(z.literal(''))

/**
 * Description validation for documentation
 */
const descriptionSchema = z
  .string()
  .max(500, 'Description cannot exceed 500 characters')
  .optional()
  .or(z.literal(''))

/**
 * Database type validation for manual type entry
 */
const dbTypeSchema = z
  .string()
  .max(50, 'Database type cannot exceed 50 characters')
  .optional()
  .or(z.literal(''))

// =============================================================================
// DYNAMIC CONSTRAINT VALIDATORS
// =============================================================================

/**
 * Creates length validation based on field type
 */
const createLengthValidator = (fieldType: DreamFactoryFieldType) => {
  if (!LENGTH_SUPPORTED_TYPES.includes(fieldType)) {
    return z.number().optional().or(z.null())
  }

  return z
    .number()
    .int('Length must be an integer')
    .min(1, 'Length must be greater than 0')
    .max(4294967295, 'Length cannot exceed maximum value') // Max UNSIGNED INT
    .optional()
    .or(z.null())
}

/**
 * Creates precision validation based on field type
 */
const createPrecisionValidator = (fieldType: DreamFactoryFieldType) => {
  if (!PRECISION_SCALE_SUPPORTED_TYPES.includes(fieldType)) {
    return z.number().optional().or(z.null())
  }

  return z
    .number()
    .int('Precision must be an integer')
    .min(1, 'Precision must be greater than 0')
    .max(65, 'Precision cannot exceed 65') // MySQL DECIMAL max precision
    .optional()
    .or(z.null())
}

/**
 * Creates scale validation based on field type and precision
 */
const createScaleValidator = (fieldType: DreamFactoryFieldType, precision?: number | null) => {
  if (!PRECISION_SCALE_SUPPORTED_TYPES.includes(fieldType)) {
    return z.number().default(0)
  }

  const maxScale = precision ? Math.min(precision, 30) : 30 // MySQL DECIMAL max scale

  return z
    .number()
    .int('Scale must be an integer')
    .min(0, 'Scale cannot be negative')
    .max(maxScale, `Scale cannot exceed ${maxScale}`)
    .default(0)
}

/**
 * Creates picklist validation based on field type
 */
const createPicklistValidator = (fieldType: DreamFactoryFieldType) => {
  if (!PICKLIST_SUPPORTED_TYPES.includes(fieldType)) {
    return z.undefined().optional()
  }

  return csvValidationSchema
}

/**
 * Creates reference table validation for foreign keys
 */
const createRefTableValidator = (isForeignKey: boolean) => {
  if (!isForeignKey) {
    return z.string().optional().or(z.null())
  }

  return z
    .string()
    .min(1, 'Reference table is required for foreign key fields')
    .max(64, 'Reference table name cannot exceed 64 characters')
}

/**
 * Creates reference field validation for foreign keys
 */
const createRefFieldValidator = (isForeignKey: boolean, refTable?: string | null) => {
  if (!isForeignKey || !refTable) {
    return z.string().optional().or(z.null())
  }

  return z
    .string()
    .min(1, 'Reference field is required for foreign key fields')
    .max(64, 'Reference field name cannot exceed 64 characters')
}

/**
 * Creates foreign key action validators
 */
const createForeignKeyActionValidator = (isForeignKey: boolean) => {
  if (!isForeignKey) {
    return z.string().optional().or(z.null())
  }

  return z
    .enum(FOREIGN_KEY_ACTIONS)
    .optional()
    .or(z.null())
}

// =============================================================================
// BUSINESS LOGIC VALIDATORS
// =============================================================================

/**
 * Validates business logic constraints and field combinations
 */
const createBusinessLogicValidator = () => {
  return z.object({}).refine(
    (data: any) => {
      const errors: string[] = []

      // Primary key cannot be nullable
      if (data.isPrimaryKey && data.allowNull) {
        errors.push('Primary key fields cannot allow null values')
      }

      // Auto-increment fields must be numeric
      if (data.autoIncrement && !['integer', 'bigint', 'smallint'].includes(data.type)) {
        errors.push('Auto-increment is only supported for integer field types')
      }

      // Auto-increment fields cannot be nullable
      if (data.autoIncrement && data.allowNull) {
        errors.push('Auto-increment fields cannot allow null values')
      }

      // Virtual fields cannot have auto-increment
      if (data.isVirtual && data.autoIncrement) {
        errors.push('Virtual fields cannot have auto-increment')
      }

      // Virtual fields cannot be primary keys
      if (data.isVirtual && data.isPrimaryKey) {
        errors.push('Virtual fields cannot be primary keys')
      }

      // Foreign key fields must have reference table and field
      if (data.isForeignKey && (!data.refTable || !data.refField)) {
        errors.push('Foreign key fields must specify reference table and field')
      }

      // Non-foreign key fields should not have reference data
      if (!data.isForeignKey && (data.refTable || data.refField)) {
        errors.push('Reference table and field are only applicable for foreign key fields')
      }

      // Precision must be greater than scale for decimal types
      if (
        PRECISION_SCALE_SUPPORTED_TYPES.includes(data.type) &&
        data.precision &&
        data.scale &&
        data.precision <= data.scale
      ) {
        errors.push('Precision must be greater than scale for decimal fields')
      }

      // Fixed length only applies to string types
      if (data.fixedLength && !FIXED_LENGTH_SUPPORTED_TYPES.includes(data.type)) {
        errors.push('Fixed length is only supported for string field types')
      }

      // Multibyte support only applies to string types
      if (data.supportsMultibyte && !MULTIBYTE_SUPPORTED_TYPES.includes(data.type)) {
        errors.push('Multibyte support is only applicable for string field types')
      }

      return errors.length === 0
    },
    {
      message: 'Business logic validation failed',
    }
  )
}

// =============================================================================
// HOOK INTERFACE AND TYPES
// =============================================================================

/**
 * Field validation hook options
 */
export interface UseFieldValidationOptions {
  /** Existing field names for uniqueness validation */
  existingFieldNames?: string[]
  /** Enable real-time validation */
  enableRealTimeValidation?: boolean
  /** Validation debounce delay in milliseconds */
  validationDelay?: number
  /** Enable strict validation mode */
  strictMode?: boolean
  /** Custom validation rules */
  customValidators?: Record<string, z.ZodSchema>
}

/**
 * Field validation hook return type
 */
export interface UseFieldValidationReturn {
  /** Dynamic Zod schema for field validation */
  validationSchema: FieldValidationSchema
  /** Validates a single field value */
  validateField: (fieldName: keyof FieldFormData, value: any) => Promise<AsyncValidationResult>
  /** Validates the complete form data */
  validateForm: (data: FieldFormData) => Promise<AsyncValidationResult>
  /** Checks if field type supports specific constraint */
  supportsConstraint: (constraint: string) => boolean
  /** Gets available field types */
  getAvailableFieldTypes: () => DreamFactoryFieldType[]
  /** Gets constraint requirements for field type */
  getConstraintRequirements: (fieldType: DreamFactoryFieldType) => {
    supportsLength: boolean
    supportsPrecisionScale: boolean
    supportsPicklist: boolean
    supportsFixedLength: boolean
    supportsMultibyte: boolean
  }
  /** Validates foreign key reference */
  validateForeignKeyReference: (
    refTable: string,
    refField: string
  ) => Promise<AsyncValidationResult>
  /** Performance metrics */
  validationMetrics: {
    lastValidationTime: number
    averageValidationTime: number
  }
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Field validation hook with comprehensive Zod schemas and real-time validation
 * 
 * @param formData Current form data for dynamic validation
 * @param options Validation configuration options
 * @returns Field validation utilities and schemas
 */
export function useFieldValidation(
  formData: Partial<FieldFormData> = {},
  options: UseFieldValidationOptions = {}
): UseFieldValidationReturn {
  const {
    existingFieldNames = [],
    enableRealTimeValidation = true,
    validationDelay = 50, // Under 100ms requirement
    strictMode = true,
    customValidators = {},
  } = options

  // Performance tracking
  const validationTimes = useRef<number[]>([])
  const lastValidationTime = useRef<number>(0)

  // Debounced validation for real-time performance
  const debouncedValidation = useDebounce(validationDelay)

  /**
   * Creates dynamic validation schema based on current form data
   */
  const validationSchema = useMemo<FieldValidationSchema>(() => {
    const { type, isForeignKey, precision, refTable } = formData

    // Base schema with always-required fields
    const baseSchema = z.object({
      // Basic field information
      name: fieldNameSchema.refine(
        (name) => {
          if (!strictMode) return true
          return !existingFieldNames.includes(name)
        },
        {
          message: 'Field name already exists in this table',
        }
      ),
      alias: aliasSchema,
      label: labelSchema,
      description: descriptionSchema,

      // Type configuration
      type: z.enum([
        'string',
        'text',
        'password',
        'email',
        'url',
        'integer',
        'bigint',
        'smallint',
        'decimal',
        'float',
        'double',
        'money',
        'date',
        'time',
        'datetime',
        'timestamp',
        'boolean',
        'binary',
        'varbinary',
        'blob',
        'medium_blob',
        'long_blob',
        'reference',
        'user_id',
        'user_id_on_create',
        'user_id_on_update',
        'timestamp_on_create',
        'timestamp_on_update',
      ] as const),
      dbType: dbTypeSchema,

      // Size constraints (dynamic based on type)
      length: type ? createLengthValidator(type) : z.number().optional().or(z.null()),
      precision: type ? createPrecisionValidator(type) : z.number().optional().or(z.null()),
      scale: createScaleValidator(type || 'string', precision),

      // Default value
      default: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),

      // Boolean flags
      allowNull: z.boolean().default(false),
      autoIncrement: z.boolean().default(false),
      fixedLength: z.boolean().default(false),
      isAggregate: z.boolean().default(false),
      isForeignKey: z.boolean().default(false),
      isPrimaryKey: z.boolean().default(false),
      isUnique: z.boolean().default(false),
      isVirtual: z.boolean().default(false),
      required: z.boolean().default(false),
      supportsMultibyte: z.boolean().default(false),

      // Reference configuration (dynamic based on isForeignKey)
      refTable: createRefTableValidator(isForeignKey || false),
      refField: createRefFieldValidator(isForeignKey || false, refTable),
      refOnDelete: createForeignKeyActionValidator(isForeignKey || false),
      refOnUpdate: createForeignKeyActionValidator(isForeignKey || false),

      // Advanced configuration
      picklist: type ? createPicklistValidator(type) : z.string().optional(),
      validation: jsonValidationSchema,
      dbFunction: z.array(dbFunctionSchema).default([]),
    })

    // Apply business logic validation
    const schemaWithBusinessLogic = baseSchema.and(createBusinessLogicValidator())

    // Apply custom validators if provided
    if (Object.keys(customValidators).length > 0) {
      return schemaWithBusinessLogic.extend(customValidators) as FieldValidationSchema
    }

    return schemaWithBusinessLogic as FieldValidationSchema
  }, [formData, existingFieldNames, strictMode, customValidators])

  /**
   * Validates a single field with performance tracking
   */
  const validateField = useCallback(
    async (fieldName: keyof FieldFormData, value: any): Promise<AsyncValidationResult> => {
      const startTime = performance.now()

      try {
        // Use debounced validation for real-time scenarios
        if (enableRealTimeValidation) {
          await debouncedValidation()
        }

        // Extract field schema for single field validation
        const fieldSchema = validationSchema.shape[fieldName as keyof typeof validationSchema.shape]
        
        if (!fieldSchema) {
          return {
            isValid: true,
            timestamp: Date.now(),
            fieldName: fieldName as string,
          }
        }

        await fieldSchema.parseAsync(value)

        const endTime = performance.now()
        const validationTime = endTime - startTime
        
        // Track performance metrics
        validationTimes.current.push(validationTime)
        if (validationTimes.current.length > 100) {
          validationTimes.current = validationTimes.current.slice(-50)
        }
        lastValidationTime.current = validationTime

        return {
          isValid: true,
          timestamp: Date.now(),
          fieldName: fieldName as string,
        }
      } catch (error) {
        const endTime = performance.now()
        lastValidationTime.current = endTime - startTime

        if (error instanceof z.ZodError) {
          const errors: FieldValidationError[] = error.errors.map((err) => ({
            path: err.path,
            message: err.message,
            code: err.code,
            expected: 'expected' in err ? String(err.expected) : undefined,
            received: 'received' in err ? err.received : undefined,
          }))

          return {
            isValid: false,
            errors,
            timestamp: Date.now(),
            fieldName: fieldName as string,
          }
        }

        return {
          isValid: false,
          errors: [
            {
              path: [fieldName as string],
              message: 'Validation error',
              code: 'custom',
            },
          ],
          timestamp: Date.now(),
          fieldName: fieldName as string,
        }
      }
    },
    [validationSchema, enableRealTimeValidation, debouncedValidation]
  )

  /**
   * Validates complete form data
   */
  const validateForm = useCallback(
    async (data: FieldFormData): Promise<AsyncValidationResult> => {
      const startTime = performance.now()

      try {
        await validationSchema.parseAsync(data)

        const endTime = performance.now()
        const validationTime = endTime - startTime
        
        validationTimes.current.push(validationTime)
        lastValidationTime.current = validationTime

        return {
          isValid: true,
          timestamp: Date.now(),
          fieldName: 'form',
        }
      } catch (error) {
        const endTime = performance.now()
        lastValidationTime.current = endTime - startTime

        if (error instanceof z.ZodError) {
          const errors: FieldValidationError[] = error.errors.map((err) => ({
            path: err.path.map(String),
            message: err.message,
            code: err.code,
            expected: 'expected' in err ? String(err.expected) : undefined,
            received: 'received' in err ? err.received : undefined,
          }))

          return {
            isValid: false,
            errors,
            timestamp: Date.now(),
            fieldName: 'form',
          }
        }

        return {
          isValid: false,
          errors: [
            {
              path: ['form'],
              message: 'Form validation error',
              code: 'custom',
            },
          ],
          timestamp: Date.now(),
          fieldName: 'form',
        }
      }
    },
    [validationSchema]
  )

  /**
   * Checks if current field type supports specific constraint
   */
  const supportsConstraint = useCallback(
    (constraint: string): boolean => {
      const fieldType = formData.type

      if (!fieldType) return false

      switch (constraint) {
        case 'length':
          return LENGTH_SUPPORTED_TYPES.includes(fieldType)
        case 'precision':
        case 'scale':
          return PRECISION_SCALE_SUPPORTED_TYPES.includes(fieldType)
        case 'picklist':
          return PICKLIST_SUPPORTED_TYPES.includes(fieldType)
        case 'fixedLength':
          return FIXED_LENGTH_SUPPORTED_TYPES.includes(fieldType)
        case 'multibyte':
          return MULTIBYTE_SUPPORTED_TYPES.includes(fieldType)
        default:
          return false
      }
    },
    [formData.type]
  )

  /**
   * Gets all available field types
   */
  const getAvailableFieldTypes = useCallback((): DreamFactoryFieldType[] => {
    return [
      'string',
      'text',
      'password',
      'email',
      'url',
      'integer',
      'bigint',
      'smallint',
      'decimal',
      'float',
      'double',
      'money',
      'date',
      'time',
      'datetime',
      'timestamp',
      'boolean',
      'binary',
      'varbinary',
      'blob',
      'medium_blob',
      'long_blob',
      'reference',
      'user_id',
      'user_id_on_create',
      'user_id_on_update',
      'timestamp_on_create',
      'timestamp_on_update',
    ]
  }, [])

  /**
   * Gets constraint requirements for specific field type
   */
  const getConstraintRequirements = useCallback(
    (fieldType: DreamFactoryFieldType) => {
      return {
        supportsLength: LENGTH_SUPPORTED_TYPES.includes(fieldType),
        supportsPrecisionScale: PRECISION_SCALE_SUPPORTED_TYPES.includes(fieldType),
        supportsPicklist: PICKLIST_SUPPORTED_TYPES.includes(fieldType),
        supportsFixedLength: FIXED_LENGTH_SUPPORTED_TYPES.includes(fieldType),
        supportsMultibyte: MULTIBYTE_SUPPORTED_TYPES.includes(fieldType),
      }
    },
    []
  )

  /**
   * Validates foreign key reference (async validation against API)
   */
  const validateForeignKeyReference = useCallback(
    async (refTable: string, refField: string): Promise<AsyncValidationResult> => {
      const startTime = performance.now()

      try {
        // Simulate API validation - in real implementation, this would make an API call
        // to verify that the reference table and field exist
        await new Promise((resolve) => setTimeout(resolve, 10)) // Simulate API delay

        // Basic format validation
        if (!refTable || refTable.trim() === '') {
          return {
            isValid: false,
            errors: [
              {
                path: ['refTable'],
                message: 'Reference table is required',
                code: 'required',
              },
            ],
            timestamp: Date.now(),
            fieldName: 'refTable',
          }
        }

        if (!refField || refField.trim() === '') {
          return {
            isValid: false,
            errors: [
              {
                path: ['refField'],
                message: 'Reference field is required',
                code: 'required',
              },
            ],
            timestamp: Date.now(),
            fieldName: 'refField',
          }
        }

        const endTime = performance.now()
        lastValidationTime.current = endTime - startTime

        return {
          isValid: true,
          timestamp: Date.now(),
          fieldName: 'foreignKeyReference',
        }
      } catch (error) {
        const endTime = performance.now()
        lastValidationTime.current = endTime - startTime

        return {
          isValid: false,
          errors: [
            {
              path: ['foreignKeyReference'],
              message: 'Failed to validate foreign key reference',
              code: 'api_error',
            },
          ],
          timestamp: Date.now(),
          fieldName: 'foreignKeyReference',
        }
      }
    },
    []
  )

  /**
   * Calculate performance metrics
   */
  const validationMetrics = useMemo(() => {
    const times = validationTimes.current
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0

    return {
      lastValidationTime: lastValidationTime.current,
      averageValidationTime: averageTime,
    }
  }, [validationTimes.current, lastValidationTime.current])

  return {
    validationSchema,
    validateField,
    validateForm,
    supportsConstraint,
    getAvailableFieldTypes,
    getConstraintRequirements,
    validateForeignKeyReference,
    validationMetrics,
  }
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Pre-configured validation schemas for common use cases
 */
export const ValidationSchemas = {
  json: jsonValidationSchema,
  csv: csvValidationSchema,
  fieldName: fieldNameSchema,
  alias: aliasSchema,
  label: labelSchema,
  description: descriptionSchema,
  dbType: dbTypeSchema,
  dbFunction: dbFunctionSchema,
} as const

/**
 * Field type constraint mappings
 */
export const FieldConstraints = {
  LENGTH_SUPPORTED_TYPES,
  PRECISION_SCALE_SUPPORTED_TYPES,
  PICKLIST_SUPPORTED_TYPES,
  FIXED_LENGTH_SUPPORTED_TYPES,
  MULTIBYTE_SUPPORTED_TYPES,
  FOREIGN_KEY_ACTIONS,
  FUNCTION_USE_CONTEXTS,
} as const

/**
 * Validation utilities
 */
export const ValidationUtils = {
  isValidJson: (value: string): boolean => {
    try {
      JSON.parse(value)
      return true
    } catch {
      return false
    }
  },
  isValidCsv: (value: string): boolean => {
    const csvRegex = /^\w+(?:\s*,\s*\w+)*$/
    return csvRegex.test(value.trim())
  },
  getValidationErrorMessage: (error: FieldValidationError): string => {
    return error.message
  },
} as const

// Default export
export default useFieldValidation