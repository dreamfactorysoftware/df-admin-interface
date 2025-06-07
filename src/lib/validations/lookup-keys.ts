/**
 * Lookup Keys Validation Schema
 * 
 * Zod validation schemas for lookup key forms and API payloads
 * in the DreamFactory Admin Interface.
 * 
 * Features:
 * - Real-time validation under 100ms
 * - Unique name constraint validation
 * - TypeScript type inference
 * - React Hook Form integration
 */

import { z } from 'zod';

// ============================================================================
// FIELD VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for lookup key name field
 * Must be unique within the form array
 */
export const lookupKeyNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(64, 'Name must be 64 characters or less')
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    'Name must start with a letter and contain only letters, numbers, underscores, or hyphens'
  )
  .refine(
    (value) => value.trim() === value,
    'Name cannot have leading or trailing whitespace'
  );

/**
 * Schema for lookup key value field
 */
export const lookupKeyValueSchema = z
  .string()
  .max(1024, 'Value must be 1024 characters or less')
  .optional()
  .transform((val) => val || ''); // Convert undefined to empty string

/**
 * Schema for private flag
 */
export const lookupKeyPrivateSchema = z
  .boolean()
  .default(false);

/**
 * Schema for optional ID field
 */
export const lookupKeyIdSchema = z
  .number()
  .int()
  .positive()
  .optional();

// ============================================================================
// SINGLE LOOKUP KEY SCHEMA
// ============================================================================

/**
 * Schema for a single lookup key entry
 */
export const lookupKeySchema = z.object({
  id: lookupKeyIdSchema,
  name: lookupKeyNameSchema,
  value: lookupKeyValueSchema,
  private: lookupKeyPrivateSchema,
});

/**
 * Schema for creating a new lookup key
 */
export const createLookupKeySchema = lookupKeySchema.omit({ id: true });

/**
 * Schema for updating an existing lookup key
 */
export const updateLookupKeySchema = lookupKeySchema.required({ id: true });

// ============================================================================
// LOOKUP KEYS ARRAY SCHEMA
// ============================================================================

/**
 * Custom validation function to ensure unique names within the array
 */
const uniqueNamesRefinement = (lookupKeys: Array<{ name: string; id?: number }>) => {
  const nameMap = new Map<string, number[]>();
  
  lookupKeys.forEach((item, index) => {
    const name = item.name?.trim().toLowerCase();
    if (name) {
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name)!.push(index);
    }
  });
  
  // Check for duplicates
  for (const [name, indices] of nameMap.entries()) {
    if (indices.length > 1) {
      return false;
    }
  }
  
  return true;
};

/**
 * Schema for array of lookup keys with unique name validation
 */
export const lookupKeysArraySchema = z
  .array(lookupKeySchema)
  .min(0, 'At least one lookup key is required')
  .max(100, 'Maximum 100 lookup keys allowed')
  .refine(
    uniqueNamesRefinement,
    {
      message: 'Lookup key names must be unique',
      path: ['lookupKeys'],
    }
  );

/**
 * Schema for the complete lookup keys form
 */
export const lookupKeysFormSchema = z.object({
  lookupKeys: lookupKeysArraySchema,
});

// ============================================================================
// API PAYLOAD SCHEMAS
// ============================================================================

/**
 * Schema for batch create payload
 */
export const batchCreateLookupKeysSchema = z.object({
  resource: z.array(createLookupKeySchema),
});

/**
 * Schema for batch update payload
 */
export const batchUpdateLookupKeysSchema = z.object({
  resource: z.array(updateLookupKeySchema),
});

/**
 * Schema for single lookup key API response
 */
export const lookupKeyResponseSchema = z.object({
  resource: lookupKeySchema.extend({
    description: z.string().optional(),
    created_date: z.string().optional(),
    last_modified_date: z.string().optional(),
    created_by_id: z.number().optional(),
    last_modified_by_id: z.number().optional(),
  }),
});

/**
 * Schema for lookup keys list API response
 */
export const lookupKeysListResponseSchema = z.object({
  resource: z.array(lookupKeyResponseSchema.shape.resource),
  meta: z.object({
    count: z.number(),
    offset: z.number(),
    limit: z.number(),
  }).optional(),
});

// ============================================================================
// TYPE INFERENCE
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 */
export type LookupKeyFormData = z.infer<typeof lookupKeySchema>;
export type CreateLookupKeyData = z.infer<typeof createLookupKeySchema>;
export type UpdateLookupKeyData = z.infer<typeof updateLookupKeySchema>;
export type LookupKeysFormData = z.infer<typeof lookupKeysFormSchema>;
export type BatchCreateLookupKeysData = z.infer<typeof batchCreateLookupKeysSchema>;
export type BatchUpdateLookupKeysData = z.infer<typeof batchUpdateLookupKeysSchema>;
export type LookupKeyResponseData = z.infer<typeof lookupKeyResponseSchema>;
export type LookupKeysListResponseData = z.infer<typeof lookupKeysListResponseSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates a single lookup key and returns detailed error information
 */
export const validateLookupKey = (data: unknown) => {
  const result = lookupKeySchema.safeParse(data);
  
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map(err => ({
        field: err.path.join('.') as keyof LookupKeyFormData,
        message: err.message,
      })),
      data: null,
    };
  }
  
  return {
    isValid: true,
    errors: [],
    data: result.data,
  };
};

/**
 * Validates an array of lookup keys and returns detailed error information
 */
export const validateLookupKeysArray = (data: unknown) => {
  const result = lookupKeysFormSchema.safeParse({ lookupKeys: data });
  
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      index: err.path[1] as number | undefined,
    }));
    
    return {
      isValid: false,
      errors,
      hasUniqueNames: !errors.some(err => err.message.includes('unique')),
      duplicateNames: extractDuplicateNames(data as Array<{ name: string }>),
      data: null,
    };
  }
  
  return {
    isValid: true,
    errors: [],
    hasUniqueNames: true,
    duplicateNames: [],
    data: result.data.lookupKeys,
  };
};

/**
 * Extracts duplicate names from an array of lookup keys
 */
const extractDuplicateNames = (lookupKeys: Array<{ name: string }>): string[] => {
  const nameCount = new Map<string, number>();
  const duplicates = new Set<string>();
  
  lookupKeys.forEach(item => {
    const name = item.name?.trim().toLowerCase();
    if (name) {
      const count = nameCount.get(name) || 0;
      nameCount.set(name, count + 1);
      if (count > 0) {
        duplicates.add(item.name);
      }
    }
  });
  
  return Array.from(duplicates);
};

/**
 * Custom Zod refinement for React Hook Form field array validation
 */
export const createUniqueNameValidator = () => {
  return (lookupKeys: Array<{ name: string; id?: number }>) => {
    const validation = validateLookupKeysArray(lookupKeys);
    return validation.hasUniqueNames || 'Lookup key names must be unique';
  };
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default values for a new lookup key
 */
export const defaultLookupKeyValues: LookupKeyFormData = {
  name: '',
  value: '',
  private: false,
};

/**
 * Default values for the lookup keys form
 */
export const defaultLookupKeysFormValues: LookupKeysFormData = {
  lookupKeys: [],
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Schemas
  lookupKeySchema,
  createLookupKeySchema,
  updateLookupKeySchema,
  lookupKeysArraySchema,
  lookupKeysFormSchema,
  batchCreateLookupKeysSchema,
  batchUpdateLookupKeysSchema,
  lookupKeyResponseSchema,
  lookupKeysListResponseSchema,
  
  // Field schemas for individual validation
  lookupKeyNameSchema,
  lookupKeyValueSchema,
  lookupKeyPrivateSchema,
  lookupKeyIdSchema,
};