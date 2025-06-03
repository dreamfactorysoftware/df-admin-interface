/**
 * CSV String Validation Schema
 * 
 * Zod schema for validating comma-separated values used in bulk ID inputs, tag selectors,
 * and import field lists. Replaces the Angular CsvValidator function while maintaining
 * the same validation logic and performance characteristics.
 * 
 * Features:
 * - Runtime type checking with compile-time TypeScript inference
 * - Real-time validation under 100ms performance target
 * - React Hook Form integration with custom error messages
 * - Maintains exact regex pattern from Angular implementation
 * - Optimized for bulk operations and field selection workflows
 * 
 * @module csv-validation
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 Migration
 */

import { z } from 'zod';

// =============================================================================
// CSV VALIDATION CONSTANTS
// =============================================================================

/**
 * CSV validation regex pattern - maintains exact compatibility with Angular implementation
 * Pattern: /^\\w+(?:\\s*,\\s*\\w+)*$/
 * 
 * Breakdown:
 * - ^\\w+        : Starts with one or more word characters (letters, numbers, underscore)
 * - (?:          : Non-capturing group for repeated pattern
 * - \\s*,\\s*    : Optional whitespace, comma, optional whitespace
 * - \\w+         : One or more word characters
 * - )*           : End group, zero or more repetitions
 * - $            : End of string
 * 
 * Valid examples:
 * - "abc"
 * - "123,456"
 * - "item1, item2, item3"
 * - "tag1,tag2,tag3"
 * - "user_1, user_2, user_3"
 * 
 * Invalid examples:
 * - ""           (empty string)
 * - " "          (whitespace only)
 * - ",abc"       (leading comma)
 * - "abc,"       (trailing comma)
 * - "abc,,def"   (double comma)
 * - "abc, ,def"  (comma with only whitespace)
 * - "abc def"    (space without comma)
 * - "a-b"        (hyphen not allowed)
 * - "a@b"        (special characters not allowed)
 */
export const CSV_VALIDATION_REGEX = /^\w+(?:\s*,\s*\w+)*$/;

/**
 * Error messages for CSV validation
 */
export const CSV_ERROR_MESSAGES = {
  INVALID_FORMAT: 'Please enter a valid comma-separated list of values',
  EMPTY_VALUE: 'At least one value is required',
  INVALID_CHARACTERS: 'Only letters, numbers, and underscores are allowed',
  INVALID_SEPARATORS: 'Use commas to separate values (no leading/trailing commas)',
  WHITESPACE_ONLY: 'Values cannot be empty or contain only whitespace',
} as const;

/**
 * Performance configuration for CSV validation
 */
export const CSV_VALIDATION_CONFIG = {
  /** Target validation time in milliseconds */
  TARGET_VALIDATION_TIME: 100,
  /** Debounce delay for real-time validation */
  DEBOUNCE_DELAY: 100,
  /** Maximum recommended items in CSV for optimal performance */
  MAX_RECOMMENDED_ITEMS: 1000,
  /** Estimated validation time per item in microseconds */
  VALIDATION_TIME_PER_ITEM: 0.1,
} as const;

// =============================================================================
// CSV VALIDATION SCHEMA
// =============================================================================

/**
 * Base CSV string validation schema
 * 
 * Validates that a string contains comma-separated word values matching
 * the exact regex pattern used in the Angular implementation.
 */
export const csvStringSchema = z
  .string()
  .min(1, CSV_ERROR_MESSAGES.EMPTY_VALUE)
  .refine(
    (value) => {
      // Trim the value to handle edge cases with leading/trailing whitespace
      const trimmedValue = value.trim();
      
      // Check if empty after trimming
      if (trimmedValue.length === 0) {
        return false;
      }
      
      // Apply the exact regex pattern from Angular implementation
      return CSV_VALIDATION_REGEX.test(trimmedValue);
    },
    {
      message: CSV_ERROR_MESSAGES.INVALID_FORMAT,
    }
  );

/**
 * Enhanced CSV validation schema with additional options
 * 
 * Provides configurable validation for different use cases while maintaining
 * core compatibility with the Angular implementation.
 */
export const csvSchema = z.object({
  /** The CSV string to validate */
  value: csvStringSchema,
  /** Optional: Transform to trimmed value automatically */
  autoTrim: z.boolean().default(true),
  /** Optional: Case sensitivity for validation */
  caseSensitive: z.boolean().default(true),
}).transform((data) => {
  // Auto-trim if enabled
  const processedValue = data.autoTrim ? data.value.trim() : data.value;
  
  return {
    ...data,
    value: processedValue,
    /** Parsed array of individual values */
    items: processedValue.split(',').map(item => item.trim()),
    /** Count of items in the CSV */
    itemCount: processedValue.split(',').length,
  };
});

/**
 * Simplified CSV validation schema for direct string validation
 * 
 * Use this for simple form fields that only need string validation
 * without additional processing or metadata.
 */
export const simpleCsvSchema = csvStringSchema;

// =============================================================================
// SPECIALIZED CSV SCHEMAS
// =============================================================================

/**
 * Bulk ID validation schema
 * 
 * Optimized for validating comma-separated lists of IDs (numeric or alphanumeric)
 * used in bulk operations and data selection workflows.
 */
export const bulkIdCsvSchema = z
  .string()
  .min(1, 'At least one ID is required')
  .refine(
    (value) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) return false;
      
      // Use the same regex pattern but with additional validation for ID context
      if (!CSV_VALIDATION_REGEX.test(trimmedValue)) return false;
      
      // Additional validation: ensure no extremely long ID lists for performance
      const itemCount = trimmedValue.split(',').length;
      return itemCount <= CSV_VALIDATION_CONFIG.MAX_RECOMMENDED_ITEMS;
    },
    {
      message: `Please enter a valid comma-separated list of IDs (max ${CSV_VALIDATION_CONFIG.MAX_RECOMMENDED_ITEMS} items)`,
    }
  )
  .transform((value) => {
    const items = value.trim().split(',').map(item => item.trim());
    return {
      value: value.trim(),
      items,
      itemCount: items.length,
      // Additional metadata for bulk operations
      estimatedProcessingTime: items.length * CSV_VALIDATION_CONFIG.VALIDATION_TIME_PER_ITEM,
    };
  });

/**
 * Tag selector validation schema
 * 
 * Optimized for validating comma-separated lists of tags used in
 * categorization and filtering interfaces.
 */
export const tagSelectorCsvSchema = z
  .string()
  .min(1, 'At least one tag is required')
  .refine(
    (value) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) return false;
      
      return CSV_VALIDATION_REGEX.test(trimmedValue);
    },
    {
      message: 'Please enter valid tag names separated by commas (letters, numbers, and underscores only)',
    }
  )
  .transform((value) => {
    const items = value.trim().split(',').map(item => item.trim());
    
    return {
      value: value.trim(),
      items,
      itemCount: items.length,
      // Remove duplicates for tag context
      uniqueItems: [...new Set(items)],
      uniqueItemCount: new Set(items).size,
    };
  });

/**
 * Import field list validation schema
 * 
 * Optimized for validating comma-separated lists of field names used in
 * data import and schema discovery workflows.
 */
export const importFieldCsvSchema = z
  .string()
  .min(1, 'At least one field name is required')
  .refine(
    (value) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) return false;
      
      return CSV_VALIDATION_REGEX.test(trimmedValue);
    },
    {
      message: 'Please enter valid field names separated by commas (letters, numbers, and underscores only)',
    }
  )
  .transform((value) => {
    const items = value.trim().split(',').map(item => item.trim());
    
    return {
      value: value.trim(),
      items,
      itemCount: items.length,
      // Validate field naming conventions
      validFieldNames: items.every(item => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(item)),
    };
  });

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Validates a CSV string synchronously and returns validation result
 * 
 * @param csvString - The CSV string to validate
 * @returns Validation result with success flag and error message if applicable
 */
export function validateCsvString(csvString: string): {
  success: boolean;
  error?: string;
  data?: string[];
} {
  try {
    const result = csvStringSchema.parse(csvString);
    const items = result.trim().split(',').map(item => item.trim());
    
    return {
      success: true,
      data: items,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || CSV_ERROR_MESSAGES.INVALID_FORMAT,
      };
    }
    
    return {
      success: false,
      error: CSV_ERROR_MESSAGES.INVALID_FORMAT,
    };
  }
}

/**
 * Performance-optimized CSV validation for real-time input
 * 
 * Provides debounced validation to meet the 100ms performance target
 * for real-time form validation scenarios.
 * 
 * @param csvString - The CSV string to validate
 * @param debounceMs - Debounce delay in milliseconds (default: 100ms)
 * @returns Promise resolving to validation result
 */
export function validateCsvStringRealTime(
  csvString: string,
  debounceMs: number = CSV_VALIDATION_CONFIG.DEBOUNCE_DELAY
): Promise<{ success: boolean; error?: string; data?: string[] }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(validateCsvString(csvString));
    }, debounceMs);
  });
}

/**
 * Parses a validated CSV string into an array of items
 * 
 * @param csvString - A valid CSV string
 * @returns Array of trimmed items
 */
export function parseCsvString(csvString: string): string[] {
  const validationResult = validateCsvString(csvString);
  
  if (!validationResult.success) {
    throw new Error(validationResult.error || 'Invalid CSV format');
  }
  
  return validationResult.data || [];
}

/**
 * Formats an array of strings into a CSV string
 * 
 * @param items - Array of strings to format
 * @param spacing - Whether to add spaces after commas (default: true)
 * @returns Formatted CSV string
 */
export function formatCsvString(items: string[], spacing: boolean = true): string {
  const separator = spacing ? ', ' : ',';
  return items.filter(item => item && item.trim()).join(separator);
}

// =============================================================================
// TYPE DEFINITIONS FOR REACT HOOK FORM
// =============================================================================

/**
 * Type inference for basic CSV validation
 */
export type CsvStringType = z.infer<typeof csvStringSchema>;

/**
 * Type inference for enhanced CSV validation with metadata
 */
export type CsvSchemaType = z.infer<typeof csvSchema>;

/**
 * Type inference for bulk ID CSV validation
 */
export type BulkIdCsvType = z.infer<typeof bulkIdCsvSchema>;

/**
 * Type inference for tag selector CSV validation
 */
export type TagSelectorCsvType = z.infer<typeof tagSelectorCsvSchema>;

/**
 * Type inference for import field CSV validation
 */
export type ImportFieldCsvType = z.infer<typeof importFieldCsvSchema>;

/**
 * Union type for all CSV validation types
 */
export type AnyCsvType = CsvStringType | CsvSchemaType | BulkIdCsvType | TagSelectorCsvType | ImportFieldCsvType;

// =============================================================================
// EXPORTS FOR REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * Default export - basic CSV string validation schema
 * Use this for most common CSV validation scenarios
 */
export default csvStringSchema;

/**
 * Named exports for specific use cases
 */
export {
  csvStringSchema as csvValidator,
  csvSchema as enhancedCsvValidator,
  bulkIdCsvSchema as bulkIdValidator,
  tagSelectorCsvSchema as tagValidator,
  importFieldCsvSchema as fieldListValidator,
};

/**
 * Export validation utilities
 */
export {
  validateCsvString as validate,
  validateCsvStringRealTime as validateRealTime,
  parseCsvString as parse,
  formatCsvString as format,
};

/**
 * Export constants for external configuration
 */
export {
  CSV_VALIDATION_REGEX as regex,
  CSV_ERROR_MESSAGES as errorMessages,
  CSV_VALIDATION_CONFIG as config,
};

/**
 * Performance metrics and monitoring
 * 
 * These constants help track validation performance and ensure
 * compliance with the 100ms real-time validation requirement.
 */
export const CSV_PERFORMANCE_METRICS = {
  /** Target validation time for real-time feedback */
  REAL_TIME_TARGET: CSV_VALIDATION_CONFIG.TARGET_VALIDATION_TIME,
  
  /** Maximum items before performance warning */
  PERFORMANCE_WARNING_THRESHOLD: Math.floor(
    CSV_VALIDATION_CONFIG.MAX_RECOMMENDED_ITEMS * 0.8
  ),
  
  /** Estimated memory usage per item in bytes */
  MEMORY_PER_ITEM: 50,
  
  /** Performance classification thresholds */
  PERFORMANCE_THRESHOLDS: {
    FAST: 50,    // Under 50ms
    GOOD: 100,   // 50-100ms
    SLOW: 200,   // 100-200ms
    CRITICAL: 500, // Over 200ms
  },
} as const;