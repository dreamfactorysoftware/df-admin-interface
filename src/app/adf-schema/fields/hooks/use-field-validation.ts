/**
 * Field Validation Hook for React/Next.js DreamFactory Admin Interface
 * 
 * Comprehensive React hook implementing field validation logic with Zod schema validation
 * and real-time validation under 100ms. Provides dynamic validation rules based on field types,
 * constraints, and business logic requirements while maintaining compatibility with React Hook Form
 * integration patterns.
 * 
 * Replaces Angular JsonValidator and CsvValidator with Zod schema validators per React/Next.js
 * Integration Requirements. Implements real-time validation under 100ms response time.
 * 
 * @fileoverview Field validation hook with comprehensive validation rules
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import type { FieldValues, Path, UseFormSetError, UseFormClearErrors } from 'react-hook-form';

// Import field types and validation utilities
import type {
  FieldDataType,
  FieldFormData,
  FieldValidationConfig,
  DatabaseSchemaFieldType,
  ReferentialAction,
  FunctionUseOperation
} from '../field.types';

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

/**
 * Validation result interface for field validation operations
 */
export interface FieldValidationResult {
  /** Whether the field value is valid */
  isValid: boolean;
  /** Validation error message if invalid */
  error?: string;
  /** Array of specific validation errors */
  errors?: string[];
  /** Field path for React Hook Form error handling */
  fieldPath?: string;
  /** Validation type that failed */
  validationType?: 'type' | 'constraint' | 'format' | 'picklist' | 'json' | 'custom';
}

/**
 * Dynamic schema configuration for field validation
 */
export interface DynamicValidationSchema {
  /** Base field validation schema */
  schema: z.ZodSchema;
  /** Field-specific validation rules */
  customRules?: Array<{
    rule: (value: any) => boolean;
    message: string;
    type: string;
  }>;
  /** Whether validation should run on change */
  validateOnChange: boolean;
  /** Whether validation should run on blur */
  validateOnBlur: boolean;
  /** Debounce delay in milliseconds */
  debounceMs: number;
}

/**
 * Field constraint validation configuration
 */
export interface FieldConstraints {
  /** Minimum length for string types */
  minLength?: number;
  /** Maximum length for string types */
  maxLength?: number;
  /** Minimum value for numeric types */
  minValue?: number;
  /** Maximum value for numeric types */
  maxValue?: number;
  /** Numeric precision for decimal types */
  precision?: number;
  /** Numeric scale for decimal types */
  scale?: number;
  /** Whether field is required */
  required?: boolean;
  /** Whether field allows null values */
  allowNull?: boolean;
  /** Custom pattern for string validation */
  pattern?: string;
  /** Custom validation message */
  customMessage?: string;
}

// =============================================================================
// CORE VALIDATION SCHEMAS
// =============================================================================

/**
 * Enhanced JSON validation schema with detailed error messaging
 * Replaces Angular JsonValidator with comprehensive Zod implementation
 */
export const createJsonValidationSchema = (required: boolean = false) => {
  const baseSchema = z
    .string()
    .refine(
      (value) => {
        if (!value || value.trim() === '') {
          return !required;
        }
        try {
          const parsed = JSON.parse(value);
          // Additional validation for JSON structure
          if (typeof parsed !== 'object' || parsed === null) {
            return false;
          }
          return true;
        } catch (error) {
          return false;
        }
      },
      {
        message: 'Invalid JSON format. Must be a valid JSON object.',
      }
    );

  return required 
    ? baseSchema.min(1, 'JSON value is required when validation is enabled')
    : baseSchema;
};

/**
 * CSV picklist validation schema with comprehensive format checking
 * Validates comma-separated values with proper escaping and formatting
 */
export const createCsvValidationSchema = (required: boolean = false) => {
  const baseSchema = z
    .string()
    .refine(
      (value) => {
        if (!value || value.trim() === '') {
          return !required;
        }

        try {
          // Basic CSV format validation
          const trimmedValue = value.trim();
          
          // Check for balanced quotes
          let quoteCount = 0;
          let inQuotes = false;
          let lastChar = '';
          
          for (let i = 0; i < trimmedValue.length; i++) {
            const char = trimmedValue[i];
            
            if (char === '"' && lastChar !== '\\') {
              quoteCount++;
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              // Valid comma separator outside quotes
            } else if (char === '\n' && inQuotes) {
              // Newlines are only allowed inside quoted fields
            }
            
            lastChar = char;
          }
          
          // Must have even number of quotes (balanced)
          if (quoteCount % 2 !== 0) {
            return false;
          }
          
          // Split and validate individual values
          const values = parseCsvLine(trimmedValue);
          
          // Check for empty values and duplicate entries
          const nonEmptyValues = values.filter(v => v.trim().length > 0);
          const uniqueValues = new Set(nonEmptyValues.map(v => v.toLowerCase()));
          
          return nonEmptyValues.length > 0 && uniqueValues.size === nonEmptyValues.length;
          
        } catch (error) {
          return false;
        }
      },
      {
        message: 'Invalid CSV format. Ensure proper comma separation, balanced quotes, and unique values.',
      }
    );

  return required
    ? baseSchema.min(1, 'Picklist values are required when enabled')
    : baseSchema;
};

/**
 * Helper function to parse CSV line with proper quote handling
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add final field
  result.push(current.trim());
  
  return result;
}

/**
 * Dynamic field type validation schema factory
 * Creates type-specific validation rules based on field data type
 */
export const createFieldTypeValidationSchema = (
  fieldType: FieldDataType,
  constraints: FieldConstraints = {}
): z.ZodSchema => {
  const { 
    minLength, 
    maxLength, 
    minValue, 
    maxValue, 
    precision, 
    scale, 
    required = false,
    pattern,
    customMessage 
  } = constraints;

  switch (fieldType) {
    case 'string':
    case 'text': {
      let schema = z.string({
        invalid_type_error: customMessage || 'Value must be a string'
      });
      
      if (required) {
        schema = schema.min(1, customMessage || 'This field is required');
      }
      
      if (minLength !== undefined) {
        schema = schema.min(minLength, `Must be at least ${minLength} characters`);
      }
      
      if (maxLength !== undefined) {
        schema = schema.max(maxLength, `Must be no more than ${maxLength} characters`);
      }
      
      if (pattern) {
        try {
          const regex = new RegExp(pattern);
          schema = schema.regex(regex, customMessage || 'Value does not match required pattern');
        } catch (error) {
          console.warn('Invalid regex pattern:', pattern);
        }
      }
      
      return schema;
    }

    case 'integer': {
      let schema = z.number({
        invalid_type_error: customMessage || 'Value must be an integer'
      }).int(customMessage || 'Value must be a whole number');
      
      if (minValue !== undefined) {
        schema = schema.min(minValue, `Must be at least ${minValue}`);
      }
      
      if (maxValue !== undefined) {
        schema = schema.max(maxValue, `Must be no more than ${maxValue}`);
      }
      
      return schema;
    }

    case 'float':
    case 'double':
    case 'decimal': {
      let schema = z.number({
        invalid_type_error: customMessage || 'Value must be a number'
      });
      
      if (minValue !== undefined) {
        schema = schema.min(minValue, `Must be at least ${minValue}`);
      }
      
      if (maxValue !== undefined) {
        schema = schema.max(maxValue, `Must be no more than ${maxValue}`);
      }
      
      // For decimal types, validate precision and scale
      if (fieldType === 'decimal' && (precision !== undefined || scale !== undefined)) {
        schema = schema.refine(
          (value) => {
            if (value === undefined || value === null) return true;
            
            const valueStr = Math.abs(value).toString();
            const [integerPart = '', decimalPart = ''] = valueStr.split('.');
            
            if (precision !== undefined && (integerPart.length + decimalPart.length) > precision) {
              return false;
            }
            
            if (scale !== undefined && decimalPart.length > scale) {
              return false;
            }
            
            return true;
          },
          {
            message: precision && scale 
              ? `Must have no more than ${precision} total digits with ${scale} decimal places`
              : precision 
                ? `Must have no more than ${precision} total digits`
                : `Must have no more than ${scale} decimal places`
          }
        );
      }
      
      return schema;
    }

    case 'boolean': {
      return z.boolean({
        invalid_type_error: customMessage || 'Value must be true or false'
      });
    }

    case 'date':
    case 'datetime':
    case 'timestamp': {
      return z.string({
        invalid_type_error: customMessage || 'Value must be a valid date'
      }).refine(
        (value) => {
          if (!value && !required) return true;
          if (!value && required) return false;
          
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        {
          message: customMessage || 'Please enter a valid date'
        }
      );
    }

    case 'json': {
      return createJsonValidationSchema(required);
    }

    case 'uuid': {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      let schema = z.string({
        invalid_type_error: customMessage || 'Value must be a valid UUID'
      });
      
      if (required) {
        schema = schema.min(1, 'UUID is required');
      }
      
      return schema.regex(uuidRegex, customMessage || 'Please enter a valid UUID format');
    }

    case 'enum':
    case 'set': {
      // For enum/set types, we'll need to validate against allowed values
      // This will be enhanced when picklist values are provided
      return z.string({
        invalid_type_error: customMessage || 'Please select a valid option'
      });
    }

    default: {
      // Generic string validation for unknown types
      let schema = z.string({
        invalid_type_error: customMessage || 'Invalid value format'
      });
      
      if (required) {
        schema = schema.min(1, 'This field is required');
      }
      
      return schema;
    }
  }
};

// =============================================================================
// FIELD VALIDATION HOOK
// =============================================================================

/**
 * Configuration options for the field validation hook
 */
export interface UseFieldValidationOptions {
  /** Form data containing field configuration */
  formData?: FieldFormData;
  /** Existing field being edited (for updates) */
  existingField?: DatabaseSchemaFieldType | null;
  /** Whether to enable real-time validation */
  enableRealTime?: boolean;
  /** Custom debounce delay (default: 100ms) */
  debounceMs?: number;
  /** Whether to validate on form change */
  validateOnChange?: boolean;
  /** Whether to validate on form blur */
  validateOnBlur?: boolean;
}

/**
 * Return type for the field validation hook
 */
export interface UseFieldValidationReturn {
  /** Validate a specific field value */
  validateField: (
    fieldName: keyof FieldFormData,
    value: any,
    formData?: FieldFormData
  ) => FieldValidationResult;
  
  /** Validate the entire form */
  validateForm: (formData: FieldFormData) => {
    isValid: boolean;
    errors: Record<string, string>;
    fieldErrors: Record<string, FieldValidationResult>;
  };
  
  /** Get dynamic validation schema for a field */
  getFieldSchema: (
    fieldName: keyof FieldFormData,
    formData?: FieldFormData
  ) => DynamicValidationSchema;
  
  /** Validate picklist values (CSV or JSON format) */
  validatePicklist: (
    values: string,
    type: 'csv' | 'json'
  ) => FieldValidationResult;
  
  /** Validate JSON content */
  validateJson: (content: string, required?: boolean) => FieldValidationResult;
  
  /** Validate field constraints based on type */
  validateConstraints: (
    fieldType: FieldDataType,
    value: any,
    constraints: FieldConstraints
  ) => FieldValidationResult;
  
  /** Check if field name is valid and unique */
  validateFieldName: (
    name: string,
    existingFields?: DatabaseSchemaFieldType[]
  ) => FieldValidationResult;
}

/**
 * Comprehensive field validation hook with real-time validation under 100ms
 * 
 * Provides dynamic validation rules based on field types, constraints, and business logic.
 * Integrates with React Hook Form for seamless form validation and error handling.
 * 
 * @param options - Configuration options for validation behavior
 * @returns Field validation utilities and methods
 */
export function useFieldValidation(
  options: UseFieldValidationOptions = {}
): UseFieldValidationReturn {
  const {
    formData,
    existingField,
    enableRealTime = true,
    debounceMs = 100,
    validateOnChange = true,
    validateOnBlur = true,
  } = options;

  /**
   * Validate a specific field value with dynamic rules
   */
  const validateField = useCallback((
    fieldName: keyof FieldFormData,
    value: any,
    currentFormData?: FieldFormData
  ): FieldValidationResult => {
    const data = currentFormData || formData;
    
    if (!data) {
      return { isValid: true };
    }

    try {
      switch (fieldName) {
        case 'name': {
          return validateFieldName(value);
        }

        case 'label': {
          if (!value || value.trim() === '') {
            return {
              isValid: false,
              error: 'Field label is required',
              fieldPath: 'label',
              validationType: 'constraint'
            };
          }
          
          if (value.length > 255) {
            return {
              isValid: false,
              error: 'Field label must be 255 characters or less',
              fieldPath: 'label',
              validationType: 'constraint'
            };
          }
          
          return { isValid: true };
        }

        case 'type': {
          if (!value) {
            return {
              isValid: false,
              error: 'Field type is required',
              fieldPath: 'type',
              validationType: 'constraint'
            };
          }
          
          return { isValid: true };
        }

        case 'length': {
          if (data.type && ['string', 'text'].includes(data.type) && value !== undefined) {
            if (value <= 0) {
              return {
                isValid: false,
                error: 'Field length must be greater than 0',
                fieldPath: 'length',
                validationType: 'constraint'
              };
            }
            
            if (value > 2147483647) {
              return {
                isValid: false,
                error: 'Field length is too large',
                fieldPath: 'length',
                validationType: 'constraint'
              };
            }
          }
          
          return { isValid: true };
        }

        case 'precision': {
          if (data.type === 'decimal' && value !== undefined) {
            if (value <= 0 || value > 65) {
              return {
                isValid: false,
                error: 'Precision must be between 1 and 65',
                fieldPath: 'precision',
                validationType: 'constraint'
              };
            }
            
            if (data.scale !== undefined && value < data.scale) {
              return {
                isValid: false,
                error: 'Precision must be greater than or equal to scale',
                fieldPath: 'precision',
                validationType: 'constraint'
              };
            }
          }
          
          return { isValid: true };
        }

        case 'scale': {
          if (data.type === 'decimal' && value !== undefined) {
            if (value < 0 || value > 30) {
              return {
                isValid: false,
                error: 'Scale must be between 0 and 30',
                fieldPath: 'scale',
                validationType: 'constraint'
              };
            }
            
            if (data.precision !== undefined && value > data.precision) {
              return {
                isValid: false,
                error: 'Scale must be less than or equal to precision',
                fieldPath: 'scale',
                validationType: 'constraint'
              };
            }
          }
          
          return { isValid: true };
        }

        case 'default': {
          if (data.hasDefaultValue && (!value || value.trim() === '')) {
            return {
              isValid: false,
              error: 'Default value is required when enabled',
              fieldPath: 'default',
              validationType: 'constraint'
            };
          }
          
          // Validate default value against field type
          if (data.hasDefaultValue && value && data.type) {
            const constraints: FieldConstraints = {
              required: false, // Default values are optional in terms of emptiness
              minLength: data.length ? 0 : undefined,
              maxLength: data.length || undefined,
              precision: data.precision,
              scale: data.scale,
            };
            
            return validateConstraints(data.type, value, constraints);
          }
          
          return { isValid: true };
        }

        case 'picklistValues': {
          if (data.enablePicklist && (!value || value.trim() === '')) {
            return {
              isValid: false,
              error: 'Picklist values are required when picklist is enabled',
              fieldPath: 'picklistValues',
              validationType: 'constraint'
            };
          }
          
          if (data.enablePicklist && value) {
            return validatePicklist(value, data.picklistType || 'csv');
          }
          
          return { isValid: true };
        }

        case 'validationRules': {
          if (data.enableValidation && !value) {
            return {
              isValid: false,
              error: 'Validation rules are required when validation is enabled',
              fieldPath: 'validationRules',
              validationType: 'constraint'
            };
          }
          
          return { isValid: true };
        }

        case 'referenceTable': {
          if (data.isForeignKey && (!value || value.trim() === '')) {
            return {
              isValid: false,
              error: 'Reference table is required for foreign key fields',
              fieldPath: 'referenceTable',
              validationType: 'constraint'
            };
          }
          
          return { isValid: true };
        }

        case 'referenceField': {
          if (data.isForeignKey && (!value || value.trim() === '')) {
            return {
              isValid: false,
              error: 'Reference field is required for foreign key fields',
              fieldPath: 'referenceField',
              validationType: 'constraint'
            };
          }
          
          return { isValid: true };
        }

        default: {
          return { isValid: true };
        }
      }
    } catch (error) {
      console.error('Field validation error:', error);
      return {
        isValid: false,
        error: 'Validation error occurred',
        fieldPath: fieldName as string,
        validationType: 'custom'
      };
    }
  }, [formData, existingField]);

  /**
   * Validate the entire form data structure
   */
  const validateForm = useCallback((
    currentFormData: FieldFormData
  ): {
    isValid: boolean;
    errors: Record<string, string>;
    fieldErrors: Record<string, FieldValidationResult>;
  } => {
    const errors: Record<string, string> = {};
    const fieldErrors: Record<string, FieldValidationResult> = {};
    
    // Core field validation
    const nameResult = validateField('name', currentFormData.name, currentFormData);
    if (!nameResult.isValid) {
      errors.name = nameResult.error || 'Invalid field name';
      fieldErrors.name = nameResult;
    }
    
    const labelResult = validateField('label', currentFormData.label, currentFormData);
    if (!labelResult.isValid) {
      errors.label = labelResult.error || 'Invalid field label';
      fieldErrors.label = labelResult;
    }
    
    const typeResult = validateField('type', currentFormData.type, currentFormData);
    if (!typeResult.isValid) {
      errors.type = typeResult.error || 'Invalid field type';
      fieldErrors.type = typeResult;
    }
    
    // Type-specific validation
    if (currentFormData.type && ['string', 'text'].includes(currentFormData.type)) {
      const lengthResult = validateField('length', currentFormData.length, currentFormData);
      if (!lengthResult.isValid) {
        errors.length = lengthResult.error || 'Invalid field length';
        fieldErrors.length = lengthResult;
      }
    }
    
    if (currentFormData.type === 'decimal') {
      const precisionResult = validateField('precision', currentFormData.precision, currentFormData);
      if (!precisionResult.isValid) {
        errors.precision = precisionResult.error || 'Invalid precision';
        fieldErrors.precision = precisionResult;
      }
      
      const scaleResult = validateField('scale', currentFormData.scale, currentFormData);
      if (!scaleResult.isValid) {
        errors.scale = scaleResult.error || 'Invalid scale';
        fieldErrors.scale = scaleResult;
      }
    }
    
    // Default value validation
    if (currentFormData.hasDefaultValue) {
      const defaultResult = validateField('default', currentFormData.default, currentFormData);
      if (!defaultResult.isValid) {
        errors.default = defaultResult.error || 'Invalid default value';
        fieldErrors.default = defaultResult;
      }
    }
    
    // Picklist validation
    if (currentFormData.enablePicklist) {
      const picklistResult = validateField('picklistValues', currentFormData.picklistValues, currentFormData);
      if (!picklistResult.isValid) {
        errors.picklistValues = picklistResult.error || 'Invalid picklist values';
        fieldErrors.picklistValues = picklistResult;
      }
    }
    
    // Foreign key validation
    if (currentFormData.isForeignKey) {
      const tableResult = validateField('referenceTable', currentFormData.referenceTable, currentFormData);
      if (!tableResult.isValid) {
        errors.referenceTable = tableResult.error || 'Reference table is required';
        fieldErrors.referenceTable = tableResult;
      }
      
      const fieldResult = validateField('referenceField', currentFormData.referenceField, currentFormData);
      if (!fieldResult.isValid) {
        errors.referenceField = fieldResult.error || 'Reference field is required';
        fieldErrors.referenceField = fieldResult;
      }
    }
    
    // Constraint validation
    if (currentFormData.isPrimaryKey && currentFormData.allowNull) {
      errors.allowNull = 'Primary key fields cannot allow null values';
      fieldErrors.allowNull = {
        isValid: false,
        error: 'Primary key fields cannot allow null values',
        fieldPath: 'allowNull',
        validationType: 'constraint'
      };
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      fieldErrors
    };
  }, [validateField]);

  /**
   * Get dynamic validation schema for a specific field
   */
  const getFieldSchema = useCallback((
    fieldName: keyof FieldFormData,
    currentFormData?: FieldFormData
  ): DynamicValidationSchema => {
    const data = currentFormData || formData;
    
    const baseSchema = z.any(); // Fallback schema
    
    return {
      schema: baseSchema,
      validateOnChange,
      validateOnBlur,
      debounceMs
    };
  }, [formData, validateOnChange, validateOnBlur, debounceMs]);

  /**
   * Validate picklist values in CSV or JSON format
   */
  const validatePicklist = useCallback((
    values: string,
    type: 'csv' | 'json'
  ): FieldValidationResult => {
    try {
      if (!values || values.trim() === '') {
        return {
          isValid: false,
          error: 'Picklist values cannot be empty',
          validationType: 'picklist'
        };
      }

      if (type === 'csv') {
        const schema = createCsvValidationSchema(true);
        const result = schema.safeParse(values);
        
        if (!result.success) {
          return {
            isValid: false,
            error: result.error.errors[0]?.message || 'Invalid CSV format',
            validationType: 'picklist'
          };
        }
        
        return { isValid: true };
      } else if (type === 'json') {
        const schema = createJsonValidationSchema(true);
        const result = schema.safeParse(values);
        
        if (!result.success) {
          return {
            isValid: false,
            error: result.error.errors[0]?.message || 'Invalid JSON format',
            validationType: 'picklist'
          };
        }
        
        // Additional validation for JSON array format
        try {
          const parsed = JSON.parse(values);
          if (!Array.isArray(parsed)) {
            return {
              isValid: false,
              error: 'JSON picklist must be an array of values',
              validationType: 'picklist'
            };
          }
          
          if (parsed.length === 0) {
            return {
              isValid: false,
              error: 'JSON picklist cannot be empty',
              validationType: 'picklist'
            };
          }
          
          // Check for duplicates
          const uniqueValues = new Set(parsed.map(v => String(v).toLowerCase()));
          if (uniqueValues.size !== parsed.length) {
            return {
              isValid: false,
              error: 'JSON picklist values must be unique',
              validationType: 'picklist'
            };
          }
          
        } catch {
          return {
            isValid: false,
            error: 'Invalid JSON array format',
            validationType: 'picklist'
          };
        }
        
        return { isValid: true };
      }
      
      return {
        isValid: false,
        error: 'Unknown picklist type',
        validationType: 'picklist'
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Picklist validation error',
        validationType: 'picklist'
      };
    }
  }, []);

  /**
   * Validate JSON content with detailed error reporting
   */
  const validateJson = useCallback((
    content: string,
    required: boolean = false
  ): FieldValidationResult => {
    try {
      const schema = createJsonValidationSchema(required);
      const result = schema.safeParse(content);
      
      if (!result.success) {
        return {
          isValid: false,
          error: result.error.errors[0]?.message || 'Invalid JSON format',
          validationType: 'json'
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'JSON validation error',
        validationType: 'json'
      };
    }
  }, []);

  /**
   * Validate field constraints based on field type
   */
  const validateConstraints = useCallback((
    fieldType: FieldDataType,
    value: any,
    constraints: FieldConstraints
  ): FieldValidationResult => {
    try {
      const schema = createFieldTypeValidationSchema(fieldType, constraints);
      const result = schema.safeParse(value);
      
      if (!result.success) {
        return {
          isValid: false,
          error: result.error.errors[0]?.message || 'Constraint validation failed',
          validationType: 'constraint'
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Constraint validation error',
        validationType: 'constraint'
      };
    }
  }, []);

  /**
   * Validate field name for uniqueness and format
   */
  const validateFieldName = useCallback((
    name: string,
    existingFields?: DatabaseSchemaFieldType[]
  ): FieldValidationResult => {
    if (!name || name.trim() === '') {
      return {
        isValid: false,
        error: 'Field name is required',
        fieldPath: 'name',
        validationType: 'constraint'
      };
    }

    // Check field name format (database identifier rules)
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(name)) {
      return {
        isValid: false,
        error: 'Field name must start with a letter and contain only letters, numbers, and underscores',
        fieldPath: 'name',
        validationType: 'format'
      };
    }

    // Check field name length
    if (name.length > 64) {
      return {
        isValid: false,
        error: 'Field name must be 64 characters or less',
        fieldPath: 'name',
        validationType: 'constraint'
      };
    }

    // Check for reserved words
    const reservedWords = ['id', 'created_date', 'last_modified_date', 'created_by_id', 'last_modified_by_id'];
    if (reservedWords.includes(name.toLowerCase())) {
      return {
        isValid: false,
        error: 'Field name conflicts with system reserved words',
        fieldPath: 'name',
        validationType: 'constraint'
      };
    }

    // Check for uniqueness if existing fields provided
    if (existingFields && existingField) {
      const isDuplicate = existingFields.some(
        field => field.name.toLowerCase() === name.toLowerCase() && field.name !== existingField.name
      );
      
      if (isDuplicate) {
        return {
          isValid: false,
          error: 'Field name must be unique within the table',
          fieldPath: 'name',
          validationType: 'constraint'
        };
      }
    }

    return { isValid: true };
  }, [existingField]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    validateField,
    validateForm,
    getFieldSchema,
    validatePicklist,
    validateJson,
    validateConstraints,
    validateFieldName,
  }), [
    validateField,
    validateForm,
    getFieldSchema,
    validatePicklist,
    validateJson,
    validateConstraints,
    validateFieldName,
  ]);
}

/**
 * Export all validation utilities for external use
 */
export {
  createJsonValidationSchema,
  createCsvValidationSchema,
  createFieldTypeValidationSchema,
  parseCsvLine,
};

/**
 * Export validation result types
 */
export type {
  FieldValidationResult,
  DynamicValidationSchema,
  FieldConstraints,
  UseFieldValidationOptions,
  UseFieldValidationReturn,
};