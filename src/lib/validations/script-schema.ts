/**
 * Script Validation Schemas
 * 
 * Comprehensive Zod validation schemas for event script management
 * in the DreamFactory Admin Interface. Provides type-safe validation
 * for script creation, editing, and configuration with real-time
 * validation under 100ms performance requirement.
 * 
 * Features:
 * - Real-time field validation with React Hook Form integration
 * - Type-safe script configuration validation
 * - Storage service integration validation
 * - Event endpoint parameter validation
 * - Performance-optimized validation rules
 */

import { z } from 'zod';
import { ScriptTypes, AceEditorMode } from '@/types/scripts';

// ============================================================================
// CORE VALIDATION SCHEMAS
// ============================================================================

/**
 * Script name validation with DreamFactory naming conventions
 */
const scriptNameSchema = z.string()
  .min(1, 'Script name is required')
  .max(80, 'Script name must be 80 characters or less')
  .regex(
    /^[a-zA-Z][a-zA-Z0-9_\-\.]*$/, 
    'Script name must start with a letter and contain only letters, numbers, underscores, hyphens, and dots'
  )
  .refine(
    (name) => !name.includes('..'), 
    'Script name cannot contain consecutive dots'
  )
  .refine(
    (name) => !name.startsWith('.') && !name.endsWith('.'),
    'Script name cannot start or end with a dot'
  );

/**
 * Script type validation
 */
const scriptTypeSchema = z.enum(ScriptTypes, {
  errorMap: () => ({ message: 'Please select a valid script type' })
});

/**
 * Script content validation with size limits
 */
const scriptContentSchema = z.string()
  .min(1, 'Script content is required')
  .max(1000000, 'Script content must be less than 1MB')
  .refine(
    (content) => content.trim().length > 0,
    'Script content cannot be empty or contain only whitespace'
  );

/**
 * Storage path validation
 */
const storagePathSchema = z.string()
  .max(500, 'Storage path must be 500 characters or less')
  .regex(
    /^[a-zA-Z0-9_\-\/\.]*$/,
    'Storage path can only contain letters, numbers, underscores, hyphens, forward slashes, and dots'
  )
  .refine(
    (path) => !path.includes('//'),
    'Storage path cannot contain consecutive forward slashes'
  )
  .refine(
    (path) => !path.startsWith('/') && !path.endsWith('/'),
    'Storage path cannot start or end with a forward slash'
  )
  .optional()
  .or(z.literal(''));

/**
 * Storage service ID validation
 */
const storageServiceIdSchema = z.number()
  .int('Storage service ID must be an integer')
  .positive('Storage service ID must be positive')
  .optional();

// ============================================================================
// MAIN SCRIPT VALIDATION SCHEMA
// ============================================================================

/**
 * Complete script validation schema for creation and editing
 */
export const scriptSchema = z.object({
  name: scriptNameSchema,
  type: scriptTypeSchema,
  content: scriptContentSchema,
  storageServiceId: storageServiceIdSchema,
  storagePath: storagePathSchema,
  isActive: z.boolean().default(true),
  allowEventModification: z.boolean().default(false),
  config: z.record(z.any()).optional().default({}),
}).refine(
  (data) => {
    // If storage service is selected, storage path should be provided
    if (data.storageServiceId && (!data.storagePath || data.storagePath.trim() === '')) {
      return false;
    }
    return true;
  },
  {
    message: 'Storage path is required when a storage service is selected',
    path: ['storagePath']
  }
);

/**
 * Script creation schema (extends base with additional validations)
 */
export const scriptCreateSchema = scriptSchema.extend({
  // Additional creation-specific validations can be added here
});

/**
 * Script update schema (makes most fields optional except required ones)
 */
export const scriptUpdateSchema = scriptSchema.partial().extend({
  name: scriptNameSchema.optional(), // Name typically can't be changed in edit mode
  lastModifiedDate: z.string().optional()
});

// ============================================================================
// EVENT ENDPOINT VALIDATION SCHEMAS
// ============================================================================

/**
 * Event endpoint selection validation
 */
export const eventEndpointSchema = z.object({
  serviceName: z.string()
    .min(1, 'Service name is required')
    .max(50, 'Service name must be 50 characters or less'),
  eventType: z.string()
    .min(1, 'Event type is required')
    .max(50, 'Event type must be 50 characters or less'),
  endpoint: z.string()
    .min(1, 'Endpoint is required')
    .max(200, 'Endpoint must be 200 characters or less'),
  tableName: z.string()
    .max(100, 'Table name must be 100 characters or less')
    .optional(),
  procedureName: z.string()
    .max(100, 'Procedure name must be 100 characters or less')
    .optional(),
  functionName: z.string()
    .max(100, 'Function name must be 100 characters or less')
    .optional(),
});

/**
 * Complete script name generation validation
 */
export const completeScriptNameSchema = z.object({
  baseRoute: z.string().min(1, 'Base route is required'),
  tableName: z.string().optional(),
  procedureName: z.string().optional(),
  functionName: z.string().optional(),
}).refine(
  (data) => {
    // Validate that the generated name will be valid
    const generatedName = data.tableName 
      ? data.baseRoute.replace('{table_name}', data.tableName)
      : data.baseRoute;
    
    return scriptNameSchema.safeParse(generatedName).success;
  },
  {
    message: 'Generated script name would be invalid',
    path: ['baseRoute']
  }
);

// ============================================================================
// STORAGE SERVICE VALIDATION SCHEMAS
// ============================================================================

/**
 * Storage service configuration validation
 */
export const storageServiceConfigSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1, 'Service name is required'),
  label: z.string().min(1, 'Service label is required'),
  type: z.enum(['local_file', 'aws_s3', 'azure_blob', 'gcs', 'ftp'], {
    errorMap: () => ({ message: 'Please select a valid storage service type' })
  }),
  config: z.object({
    container: z.string().optional(),
    path: z.string().optional(),
    region: z.string().optional(),
  }).optional().default({})
});

/**
 * Storage service link validation
 */
export const storageServiceLinkSchema = z.object({
  serviceId: storageServiceIdSchema,
  serviceName: z.string().optional(),
  path: storagePathSchema,
  autoSync: z.boolean().default(false),
  compression: z.boolean().default(false),
  backup: z.boolean().default(true),
});

// ============================================================================
// SCRIPT EDITOR VALIDATION SCHEMAS
// ============================================================================

/**
 * Script editor configuration validation
 */
export const scriptEditorConfigSchema = z.object({
  mode: z.nativeEnum(AceEditorMode),
  theme: z.enum(['light', 'dark']).default('light'),
  fontSize: z.number().int().min(8).max(24).default(14),
  tabSize: z.number().int().min(1).max(8).default(2),
  useSoftTabs: z.boolean().default(true),
  showLineNumbers: z.boolean().default(true),
  showGutter: z.boolean().default(true),
  highlightActiveLine: z.boolean().default(true),
  enableLiveAutocompletion: z.boolean().default(true),
  enableSnippets: z.boolean().default(true),
  wrapEnabled: z.boolean().default(false),
});

/**
 * Script validation result schema
 */
export const scriptValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    line: z.number().int().min(1),
    column: z.number().int().min(0),
    message: z.string(),
    severity: z.enum(['error', 'warning'])
  })).optional(),
  warnings: z.array(z.object({
    line: z.number().int().min(1),
    column: z.number().int().min(0),
    message: z.string()
  })).optional()
});

// ============================================================================
// WORKFLOW VALIDATION SCHEMAS
// ============================================================================

/**
 * Script creation workflow step validation
 */
export const scriptCreationStepSchema = z.object({
  id: z.string().min(1, 'Step ID is required'),
  title: z.string().min(1, 'Step title is required'),
  description: z.string().min(1, 'Step description is required'),
  completed: z.boolean().default(false),
  required: z.boolean().default(true),
  data: z.any().optional()
});

/**
 * Script creation workflow validation
 */
export const scriptCreationWorkflowSchema = z.object({
  currentStep: z.number().int().min(0),
  steps: z.array(scriptCreationStepSchema).min(1, 'At least one step is required'),
  scriptData: scriptSchema.partial(),
  selectedService: z.string().optional(),
  selectedEvent: z.string().optional(),
  selectedRoute: z.string().optional(),
  selectedTable: z.string().optional(),
  completeName: z.string().optional()
}).refine(
  (data) => data.currentStep < data.steps.length,
  {
    message: 'Current step must be within the range of available steps',
    path: ['currentStep']
  }
);

// ============================================================================
// PERFORMANCE VALIDATION SCHEMAS
// ============================================================================

/**
 * Script execution validation (for testing)
 */
export const scriptExecutionSchema = z.object({
  name: scriptNameSchema,
  type: scriptTypeSchema,
  content: scriptContentSchema,
  timeout: z.number().int().min(1000).max(30000).default(5000), // 1-30 seconds
  memoryLimit: z.number().int().min(64).max(512).default(128), // 64-512 MB
  parameters: z.record(z.any()).optional().default({})
});

/**
 * Script performance metrics validation
 */
export const scriptMetricsSchema = z.object({
  executionTime: z.number().min(0),
  memoryUsage: z.number().min(0).optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
  timestamp: z.string().datetime()
});

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

/**
 * Real-time validation helper for React Hook Form
 * Optimized for sub-100ms validation performance
 */
export const validateScriptField = (fieldName: keyof z.infer<typeof scriptSchema>, value: any) => {
  try {
    const fieldSchema = scriptSchema.shape[fieldName];
    const result = fieldSchema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  } catch (error) {
    return 'Validation error occurred';
  }
};

/**
 * Validate script name uniqueness (for async validation)
 */
export const validateScriptNameUnique = async (name: string, existingNames: string[] = []) => {
  if (existingNames.includes(name)) {
    return 'Script name already exists';
  }
  return undefined;
};

/**
 * Validate script content syntax (basic validation)
 */
export const validateScriptSyntax = (content: string, type: z.infer<typeof scriptTypeSchema>) => {
  try {
    switch (type) {
      case 'nodejs':
        // Basic JavaScript syntax validation
        new Function(content);
        break;
      case 'python':
      case 'python3':
        // Basic Python syntax validation would require additional libraries
        // For now, just check for basic structure
        if (!content.trim()) {
          return 'Python script cannot be empty';
        }
        break;
      case 'php':
        // Basic PHP syntax validation
        if (!content.includes('<?php') && !content.trim().startsWith('<?')) {
          return 'PHP script should start with <?php tag';
        }
        break;
    }
    return undefined;
  } catch (error) {
    return `Syntax error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export inferred types for use in components
export type ScriptFormData = z.infer<typeof scriptSchema>;
export type ScriptCreateData = z.infer<typeof scriptCreateSchema>;
export type ScriptUpdateData = z.infer<typeof scriptUpdateSchema>;
export type EventEndpointData = z.infer<typeof eventEndpointSchema>;
export type StorageServiceConfigData = z.infer<typeof storageServiceConfigSchema>;
export type ScriptEditorConfigData = z.infer<typeof scriptEditorConfigSchema>;
export type ScriptCreationWorkflowData = z.infer<typeof scriptCreationWorkflowSchema>;
export type ScriptExecutionData = z.infer<typeof scriptExecutionSchema>;

// Export all schemas for external use
export {
  scriptSchema as default,
  scriptCreateSchema,
  scriptUpdateSchema,
  eventEndpointSchema,
  storageServiceConfigSchema,
  scriptEditorConfigSchema,
  scriptCreationWorkflowSchema,
  scriptExecutionSchema
};