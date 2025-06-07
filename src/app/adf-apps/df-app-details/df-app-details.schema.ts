/**
 * Zod validation schemas for application details form components.
 * 
 * Provides comprehensive type-safe validation for DreamFactory application
 * configuration including conditional validation based on storage location types,
 * real-time validation under 100ms performance targets, and integration with
 * React Hook Form for seamless user experience.
 * 
 * @fileoverview Application details form validation schemas
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import { APP_TYPES } from '@/types/apps';

// ============================================================================
// Validation Constants and Configuration
// ============================================================================

/**
 * Application name validation constants
 */
const APP_NAME_MIN_LENGTH = 1;
const APP_NAME_MAX_LENGTH = 255;

/**
 * Application description validation constants
 */
const APP_DESCRIPTION_MAX_LENGTH = 1000;

/**
 * URL validation regex pattern for application URLs
 * Supports HTTP/HTTPS protocols with optional ports and paths
 */
const URL_PATTERN = /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w._~!$&'()*+,;=:@]|%[0-9a-fA-F]{2})*)*$/;

/**
 * File path validation regex pattern for local applications
 * Supports Unix and Windows path formats with filename validation
 */
const FILE_PATH_PATTERN = /^(?:\/[^\/\0]+)+\/?$|^[a-zA-Z]:\\(?:[^\\/:*?"<>|\0]+\\)*[^\\/:*?"<>|\0]*$/;

/**
 * Container name validation pattern for cloud storage
 * Follows common cloud storage naming conventions
 */
const CONTAINER_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * API key validation pattern
 * Supports various API key formats including alphanumeric and special characters
 */
const API_KEY_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;

// ============================================================================
// Base Validation Schemas
// ============================================================================

/**
 * Application name validation schema
 * Ensures unique, non-empty names within length constraints
 */
export const AppNameSchema = z
  .string({
    required_error: 'validation.app.name.required',
    invalid_type_error: 'validation.app.name.invalid_type',
  })
  .min(APP_NAME_MIN_LENGTH, {
    message: 'validation.app.name.min_length',
  })
  .max(APP_NAME_MAX_LENGTH, {
    message: 'validation.app.name.max_length',
  })
  .trim()
  .refine(
    (name) => name.length > 0,
    {
      message: 'validation.app.name.whitespace_only',
    }
  );

/**
 * Application description validation schema
 * Optional field with length constraints
 */
export const AppDescriptionSchema = z
  .string({
    invalid_type_error: 'validation.app.description.invalid_type',
  })
  .max(APP_DESCRIPTION_MAX_LENGTH, {
    message: 'validation.app.description.max_length',
  })
  .trim()
  .optional();

/**
 * Application type validation schema
 * Validates against supported storage location types
 */
export const AppTypeSchema = z
  .number({
    required_error: 'validation.app.type.required',
    invalid_type_error: 'validation.app.type.invalid_type',
  })
  .int({
    message: 'validation.app.type.invalid_integer',
  })
  .min(0, {
    message: 'validation.app.type.min_value',
  })
  .max(3, {
    message: 'validation.app.type.max_value',
  })
  .refine(
    (type) => Object.values(APP_TYPES).includes(type),
    {
      message: 'validation.app.type.invalid_value',
    }
  );

/**
 * Role ID validation schema
 * Optional role assignment with positive integer constraint
 */
export const RoleIdSchema = z
  .number({
    invalid_type_error: 'validation.app.role_id.invalid_type',
  })
  .int({
    message: 'validation.app.role_id.invalid_integer',
  })
  .positive({
    message: 'validation.app.role_id.positive',
  })
  .optional();

/**
 * Application active status validation schema
 */
export const AppActiveSchema = z
  .boolean({
    required_error: 'validation.app.is_active.required',
    invalid_type_error: 'validation.app.is_active.invalid_type',
  })
  .default(true);

/**
 * Application URL validation schema
 * Validates HTTP/HTTPS URLs with comprehensive pattern matching
 */
export const AppUrlSchema = z
  .string({
    invalid_type_error: 'validation.app.url.invalid_type',
  })
  .trim()
  .url({
    message: 'validation.app.url.invalid_format',
  })
  .regex(URL_PATTERN, {
    message: 'validation.app.url.invalid_protocol',
  })
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      } catch {
        return false;
      }
    },
    {
      message: 'validation.app.url.parsing_error',
    }
  );

/**
 * Storage service ID validation schema
 * For cloud storage applications
 */
export const StorageServiceIdSchema = z
  .number({
    invalid_type_error: 'validation.app.storage_service_id.invalid_type',
  })
  .int({
    message: 'validation.app.storage_service_id.invalid_integer',
  })
  .positive({
    message: 'validation.app.storage_service_id.positive',
  });

/**
 * Storage container validation schema
 * Validates cloud storage container names
 */
export const StorageContainerSchema = z
  .string({
    invalid_type_error: 'validation.app.storage_container.invalid_type',
  })
  .trim()
  .min(3, {
    message: 'validation.app.storage_container.min_length',
  })
  .max(63, {
    message: 'validation.app.storage_container.max_length',
  })
  .regex(CONTAINER_NAME_PATTERN, {
    message: 'validation.app.storage_container.invalid_format',
  });

/**
 * File path validation schema
 * Validates local file system paths
 */
export const FilePathSchema = z
  .string({
    invalid_type_error: 'validation.app.path.invalid_type',
  })
  .trim()
  .min(1, {
    message: 'validation.app.path.required',
  })
  .regex(FILE_PATH_PATTERN, {
    message: 'validation.app.path.invalid_format',
  })
  .refine(
    (path) => !path.includes('..'),
    {
      message: 'validation.app.path.traversal_detected',
    }
  )
  .refine(
    (path) => !path.includes('//'),
    {
      message: 'validation.app.path.double_slash',
    }
  );

/**
 * API key validation schema
 * Validates API key format and length
 */
export const ApiKeySchema = z
  .string({
    invalid_type_error: 'validation.app.api_key.invalid_type',
  })
  .trim()
  .min(8, {
    message: 'validation.app.api_key.min_length',
  })
  .max(128, {
    message: 'validation.app.api_key.max_length',
  })
  .regex(API_KEY_PATTERN, {
    message: 'validation.app.api_key.invalid_format',
  })
  .optional();

// ============================================================================
// Fullscreen Configuration Schemas
// ============================================================================

/**
 * Fullscreen requirements validation schema
 */
export const RequiresFullscreenSchema = z
  .boolean({
    invalid_type_error: 'validation.app.requires_fullscreen.invalid_type',
  })
  .default(false);

/**
 * Fullscreen toggle allowance validation schema
 */
export const AllowFullscreenToggleSchema = z
  .boolean({
    invalid_type_error: 'validation.app.allow_fullscreen_toggle.invalid_type',
  })
  .default(true);

/**
 * Toggle location validation schema
 */
export const ToggleLocationSchema = z
  .enum(['top-left', 'top-right', 'bottom-left', 'bottom-right'], {
    required_error: 'validation.app.toggle_location.required',
    invalid_type_error: 'validation.app.toggle_location.invalid_type',
  })
  .default('top-right');

// ============================================================================
// Conditional Validation Schemas
// ============================================================================

/**
 * Base application form schema without conditional fields
 * Contains fields common to all application types
 */
export const BaseAppFormSchema = z.object({
  name: AppNameSchema,
  description: AppDescriptionSchema,
  type: AppTypeSchema,
  role_id: RoleIdSchema,
  is_active: AppActiveSchema,
  requires_fullscreen: RequiresFullscreenSchema,
  allow_fullscreen_toggle: AllowFullscreenToggleSchema,
  toggle_location: ToggleLocationSchema,
});

/**
 * No storage application schema (type 0)
 * Minimal configuration for applications without storage
 */
export const NoStorageAppSchema = BaseAppFormSchema.extend({
  type: z.literal(APP_TYPES.NONE),
});

/**
 * Local file application schema (type 1)
 * Requires file path specification
 */
export const LocalFileAppSchema = BaseAppFormSchema.extend({
  type: z.literal(APP_TYPES.LOCAL_FILE),
  path: FilePathSchema,
});

/**
 * URL application schema (type 2)
 * Requires valid URL specification
 */
export const UrlAppSchema = BaseAppFormSchema.extend({
  type: z.literal(APP_TYPES.URL),
  url: AppUrlSchema,
});

/**
 * Cloud storage application schema (type 3)
 * Requires storage service and container configuration
 */
export const CloudStorageAppSchema = BaseAppFormSchema.extend({
  type: z.literal(APP_TYPES.CLOUD_STORAGE),
  storage_service_id: StorageServiceIdSchema,
  storage_container: StorageContainerSchema,
});

/**
 * Discriminated union schema for all application types
 * Provides type-safe validation based on the application type
 */
export const AppFormSchema = z.discriminatedUnion('type', [
  NoStorageAppSchema,
  LocalFileAppSchema,
  UrlAppSchema,
  CloudStorageAppSchema,
]);

/**
 * Application creation schema
 * Includes API key generation for new applications
 */
export const AppCreateSchema = AppFormSchema.extend({
  api_key: ApiKeySchema,
});

/**
 * Application update schema
 * All fields optional for partial updates
 */
export const AppUpdateSchema = AppFormSchema.partial().extend({
  id: z.number().int().positive(),
});

// ============================================================================
// Form State Validation Schemas
// ============================================================================

/**
 * Application form state schema
 * Tracks form submission and validation state
 */
export const AppFormStateSchema = z.object({
  isSubmitting: z.boolean().default(false),
  isValidating: z.boolean().default(false),
  isDirty: z.boolean().default(false),
  isValid: z.boolean().default(false),
  touchedFields: z.record(z.string(), z.boolean()).default({}),
  errors: z.record(z.string(), z.string()).default({}),
});

/**
 * Application form configuration schema
 * Defines form behavior and validation settings
 */
export const AppFormConfigSchema = z.object({
  mode: z.enum(['onChange', 'onBlur', 'onSubmit', 'onTouched', 'all']).default('onBlur'),
  reValidateMode: z.enum(['onChange', 'onBlur', 'onSubmit']).default('onChange'),
  shouldFocusError: z.boolean().default(true),
  shouldUnregister: z.boolean().default(false),
  shouldUseNativeValidation: z.boolean().default(false),
  criteriaMode: z.enum(['firstError', 'all']).default('firstError'),
  delayError: z.number().min(0).max(1000).default(100),
});

// ============================================================================
// TypeScript Type Definitions
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 * Provides compile-time type safety for React Hook Form integration
 */

export type AppFormData = z.infer<typeof AppFormSchema>;
export type AppCreateData = z.infer<typeof AppCreateSchema>;
export type AppUpdateData = z.infer<typeof AppUpdateSchema>;

export type NoStorageAppData = z.infer<typeof NoStorageAppSchema>;
export type LocalFileAppData = z.infer<typeof LocalFileAppSchema>;
export type UrlAppData = z.infer<typeof UrlAppSchema>;
export type CloudStorageAppData = z.infer<typeof CloudStorageAppSchema>;

export type AppFormState = z.infer<typeof AppFormStateSchema>;
export type AppFormConfig = z.infer<typeof AppFormConfigSchema>;

/**
 * Form field names type for type-safe field access
 */
export type AppFormFieldNames = keyof AppFormData;

/**
 * Form validation error type with internationalization support
 */
export interface AppFormValidationError {
  field: AppFormFieldNames;
  message: string;
  code: string;
  params?: Record<string, any>;
}

/**
 * Form validation result type
 */
export interface AppFormValidationResult {
  isValid: boolean;
  errors: AppFormValidationError[];
  warnings?: AppFormValidationError[];
}

// ============================================================================
// Validation Utilities and Helpers
// ============================================================================

/**
 * Validates application form data based on type
 * Provides runtime validation with detailed error reporting
 */
export function validateAppForm(data: unknown): AppFormValidationResult {
  try {
    AppFormSchema.parse(data);
    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: AppFormValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.') as AppFormFieldNames,
        message: err.message,
        code: err.code,
        params: err.params,
      }));

      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: false,
      errors: [{
        field: 'root' as AppFormFieldNames,
        message: 'validation.app.unknown_error',
        code: 'unknown_error',
      }],
    };
  }
}

/**
 * Validates specific application field with conditional logic
 * Enables real-time field validation for improved UX
 */
export function validateAppField(
  field: AppFormFieldNames,
  value: unknown,
  formData: Partial<AppFormData>
): AppFormValidationResult {
  try {
    // Get the appropriate schema based on application type
    const type = formData.type;
    let schema: z.ZodSchema;

    switch (type) {
      case APP_TYPES.NONE:
        schema = NoStorageAppSchema;
        break;
      case APP_TYPES.LOCAL_FILE:
        schema = LocalFileAppSchema;
        break;
      case APP_TYPES.URL:
        schema = UrlAppSchema;
        break;
      case APP_TYPES.CLOUD_STORAGE:
        schema = CloudStorageAppSchema;
        break;
      default:
        schema = BaseAppFormSchema;
        break;
    }

    // Extract field schema from the main schema
    const fieldSchema = schema.shape[field as keyof typeof schema.shape];
    if (!fieldSchema) {
      return {
        isValid: true,
        errors: [],
      };
    }

    fieldSchema.parse(value);
    return {
      isValid: true,
      errors: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: AppFormValidationError[] = error.errors.map((err) => ({
        field,
        message: err.message,
        code: err.code,
        params: err.params,
      }));

      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: false,
      errors: [{
        field,
        message: 'validation.app.field_error',
        code: 'field_error',
      }],
    };
  }
}

/**
 * Gets required fields for a specific application type
 * Helps with conditional form rendering and validation
 */
export function getRequiredFieldsForType(type: number): AppFormFieldNames[] {
  const baseFields: AppFormFieldNames[] = ['name', 'type', 'is_active'];

  switch (type) {
    case APP_TYPES.LOCAL_FILE:
      return [...baseFields, 'path'];
    case APP_TYPES.URL:
      return [...baseFields, 'url'];
    case APP_TYPES.CLOUD_STORAGE:
      return [...baseFields, 'storage_service_id', 'storage_container'];
    case APP_TYPES.NONE:
    default:
      return baseFields;
  }
}

/**
 * Gets optional fields for a specific application type
 * Helps with form field visibility management
 */
export function getOptionalFieldsForType(type: number): AppFormFieldNames[] {
  const commonOptional: AppFormFieldNames[] = [
    'description',
    'role_id',
    'requires_fullscreen',
    'allow_fullscreen_toggle',
    'toggle_location',
  ];

  return commonOptional;
}

/**
 * Transforms form data to API payload format
 * Handles field mapping and data transformation for API submission
 */
export function transformFormDataToPayload(data: AppFormData): Record<string, any> {
  const payload: Record<string, any> = {
    name: data.name,
    type: data.type,
    is_active: data.is_active,
    requires_fullscreen: data.requires_fullscreen,
    allow_fullscreen_toggle: data.allow_fullscreen_toggle,
    toggle_location: data.toggle_location,
  };

  // Add optional fields if present
  if (data.description !== undefined) {
    payload.description = data.description;
  }

  if (data.role_id !== undefined) {
    payload.role_id = data.role_id;
  }

  // Add type-specific fields
  switch (data.type) {
    case APP_TYPES.LOCAL_FILE:
      if ('path' in data && data.path) {
        payload.path = data.path;
      }
      break;
    case APP_TYPES.URL:
      if ('url' in data && data.url) {
        payload.url = data.url;
      }
      break;
    case APP_TYPES.CLOUD_STORAGE:
      if ('storage_service_id' in data && data.storage_service_id) {
        payload.storage_service_id = data.storage_service_id;
      }
      if ('storage_container' in data && data.storage_container) {
        payload.storage_container = data.storage_container;
      }
      break;
  }

  return payload;
}

// ============================================================================
// Validation Error Messages (i18n Keys)
// ============================================================================

/**
 * Internationalization keys for validation error messages
 * Supports Next.js i18n patterns for multilingual validation
 */
export const VALIDATION_ERROR_KEYS = {
  APP: {
    NAME: {
      REQUIRED: 'validation.app.name.required',
      MIN_LENGTH: 'validation.app.name.min_length',
      MAX_LENGTH: 'validation.app.name.max_length',
      WHITESPACE_ONLY: 'validation.app.name.whitespace_only',
      INVALID_TYPE: 'validation.app.name.invalid_type',
    },
    DESCRIPTION: {
      MAX_LENGTH: 'validation.app.description.max_length',
      INVALID_TYPE: 'validation.app.description.invalid_type',
    },
    TYPE: {
      REQUIRED: 'validation.app.type.required',
      INVALID_TYPE: 'validation.app.type.invalid_type',
      INVALID_INTEGER: 'validation.app.type.invalid_integer',
      MIN_VALUE: 'validation.app.type.min_value',
      MAX_VALUE: 'validation.app.type.max_value',
      INVALID_VALUE: 'validation.app.type.invalid_value',
    },
    ROLE_ID: {
      INVALID_TYPE: 'validation.app.role_id.invalid_type',
      INVALID_INTEGER: 'validation.app.role_id.invalid_integer',
      POSITIVE: 'validation.app.role_id.positive',
    },
    IS_ACTIVE: {
      REQUIRED: 'validation.app.is_active.required',
      INVALID_TYPE: 'validation.app.is_active.invalid_type',
    },
    URL: {
      INVALID_TYPE: 'validation.app.url.invalid_type',
      INVALID_FORMAT: 'validation.app.url.invalid_format',
      INVALID_PROTOCOL: 'validation.app.url.invalid_protocol',
      PARSING_ERROR: 'validation.app.url.parsing_error',
    },
    STORAGE_SERVICE_ID: {
      INVALID_TYPE: 'validation.app.storage_service_id.invalid_type',
      INVALID_INTEGER: 'validation.app.storage_service_id.invalid_integer',
      POSITIVE: 'validation.app.storage_service_id.positive',
    },
    STORAGE_CONTAINER: {
      INVALID_TYPE: 'validation.app.storage_container.invalid_type',
      MIN_LENGTH: 'validation.app.storage_container.min_length',
      MAX_LENGTH: 'validation.app.storage_container.max_length',
      INVALID_FORMAT: 'validation.app.storage_container.invalid_format',
    },
    PATH: {
      INVALID_TYPE: 'validation.app.path.invalid_type',
      REQUIRED: 'validation.app.path.required',
      INVALID_FORMAT: 'validation.app.path.invalid_format',
      TRAVERSAL_DETECTED: 'validation.app.path.traversal_detected',
      DOUBLE_SLASH: 'validation.app.path.double_slash',
    },
    API_KEY: {
      INVALID_TYPE: 'validation.app.api_key.invalid_type',
      MIN_LENGTH: 'validation.app.api_key.min_length',
      MAX_LENGTH: 'validation.app.api_key.max_length',
      INVALID_FORMAT: 'validation.app.api_key.invalid_format',
    },
    REQUIRES_FULLSCREEN: {
      INVALID_TYPE: 'validation.app.requires_fullscreen.invalid_type',
    },
    ALLOW_FULLSCREEN_TOGGLE: {
      INVALID_TYPE: 'validation.app.allow_fullscreen_toggle.invalid_type',
    },
    TOGGLE_LOCATION: {
      REQUIRED: 'validation.app.toggle_location.required',
      INVALID_TYPE: 'validation.app.toggle_location.invalid_type',
    },
    UNKNOWN_ERROR: 'validation.app.unknown_error',
    FIELD_ERROR: 'validation.app.field_error',
  },
} as const;

// Export default schema for convenience
export default AppFormSchema;