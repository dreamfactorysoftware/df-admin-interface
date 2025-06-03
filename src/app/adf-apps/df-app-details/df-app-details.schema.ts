import { z } from 'zod';

/**
 * Storage location types for applications
 * Matches the type field from the original Angular component
 */
export const StorageLocationTypeSchema = z.enum(['0', '1', '2', '3'], {
  errorMap: () => ({ message: 'apps.validation.storageLocation.invalid' }),
});

/**
 * Role selection schema for application default role
 * Supports both ID-based selection and null values
 */
export const RoleSelectionSchema = z.object({
  id: z.number().int().positive({
    message: 'apps.validation.role.id.positive',
  }),
  name: z.string().min(1, {
    message: 'apps.validation.role.name.required',
  }),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  accessibleTabs: z.array(z.string()).optional(),
  createdById: z.number().optional(),
  createdDate: z.string().optional(),
  lastModifiedById: z.number().optional(),
  lastModifiedDate: z.string().optional(),
  lookupByRoleId: z.array(z.number()).optional(),
}).nullable();

/**
 * Base application form schema with common validation rules
 * All fields that are always present regardless of storage location type
 */
export const BaseApplicationFormSchema = z.object({
  // Application name - required, 1-100 characters, alphanumeric with spaces/hyphens/underscores
  name: z
    .string({
      required_error: 'apps.validation.name.required',
      invalid_type_error: 'apps.validation.name.invalid',
    })
    .min(1, { message: 'apps.validation.name.required' })
    .max(100, { message: 'apps.validation.name.maxLength' })
    .regex(/^[a-zA-Z0-9\s\-_]+$/, {
      message: 'apps.validation.name.format',
    }),

  // Application description - optional, max 500 characters
  description: z
    .string()
    .max(500, { message: 'apps.validation.description.maxLength' })
    .optional()
    .or(z.literal('')),

  // Default role assignment - optional role selection
  defaultRole: RoleSelectionSchema,

  // Active state - boolean with default false
  active: z.boolean().default(false),

  // Storage location type - determines conditional validation
  appLocation: StorageLocationTypeSchema,

  // Storage service ID - used for file-storage type (appLocation = '1')
  storageServiceId: z
    .number()
    .int()
    .min(1, { message: 'apps.validation.storageServiceId.positive' })
    .default(3),

  // Storage container - used for file-storage type (appLocation = '1')
  storageContainer: z
    .string()
    .min(1, { message: 'apps.validation.storageContainer.required' })
    .max(255, { message: 'apps.validation.storageContainer.maxLength' })
    .regex(/^[a-zA-Z0-9\-_.]+$/, {
      message: 'apps.validation.storageContainer.format',
    })
    .default('applications'),

  // Path - conditionally required based on appLocation
  path: z.string().optional().or(z.literal('')),

  // URL - conditionally required for remote-URL type (appLocation = '2')
  url: z.string().optional().or(z.literal('')),
});

/**
 * Application form schema with conditional validation
 * Implements dynamic validation rules based on storage location type
 */
export const ApplicationFormSchema = BaseApplicationFormSchema.superRefine(
  (data, ctx) => {
    const { appLocation, path, url } = data;

    // Conditional validation for remote-URL type (appLocation = '2')
    if (appLocation === '2') {
      // URL is required and must be valid
      if (!url || url.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['url'],
          message: 'apps.validation.url.required',
        });
      } else {
        // Validate URL format
        try {
          new URL(url);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['url'],
            message: 'apps.validation.url.invalid',
          });
        }
      }
    }

    // Conditional validation for web-server type (appLocation = '3')
    if (appLocation === '3') {
      // Path is required
      if (!path || path.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['path'],
          message: 'apps.validation.path.required',
        });
      } else {
        // Validate path format (must start with /)
        if (!path.startsWith('/')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['path'],
            message: 'apps.validation.path.format',
          });
        }
      }
    }

    // Conditional validation for file-storage type (appLocation = '1')
    if (appLocation === '1') {
      // Path is required for file storage
      if (!path || path.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['path'],
          message: 'apps.validation.path.required',
        });
      } else {
        // Validate file path format (no leading slash for file storage)
        if (path.startsWith('/')) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['path'],
            message: 'apps.validation.path.fileStorage.format',
          });
        }
      }
    }
  }
);

/**
 * API payload schema for create/update operations
 * Transforms form data to API-compatible format
 */
export const ApplicationPayloadSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  type: z.number().int().min(0).max(3),
  role_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean(),
  url: z.string().optional().nullable(),
  storage_service_id: z.number().int().positive().optional().nullable(),
  storage_container: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
});

/**
 * API key validation schema for refresh operations
 */
export const ApiKeySchema = z.object({
  apiKey: z
    .string()
    .min(32, { message: 'apps.validation.apiKey.minLength' })
    .max(128, { message: 'apps.validation.apiKey.maxLength' })
    .regex(/^[a-f0-9]+$/, {
      message: 'apps.validation.apiKey.format',
    }),
});

/**
 * Application URL generation schema for validation
 */
export const ApplicationUrlSchema = z.object({
  urlOrigin: z.string().url({ message: 'apps.validation.urlOrigin.invalid' }),
  appLocation: StorageLocationTypeSchema,
  storageServiceId: z.number().optional(),
  storageContainer: z.string().optional(),
  path: z.string().optional(),
});

/**
 * Role filtering schema for autocomplete functionality
 */
export const RoleFilterSchema = z.object({
  searchTerm: z
    .string()
    .max(100, { message: 'apps.validation.roleFilter.maxLength' })
    .optional(),
  activeOnly: z.boolean().default(true),
});

// TypeScript types inferred from Zod schemas
export type StorageLocationType = z.infer<typeof StorageLocationTypeSchema>;
export type RoleSelection = z.infer<typeof RoleSelectionSchema>;
export type BaseApplicationForm = z.infer<typeof BaseApplicationFormSchema>;
export type ApplicationForm = z.infer<typeof ApplicationFormSchema>;
export type ApplicationPayload = z.infer<typeof ApplicationPayloadSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type ApplicationUrl = z.infer<typeof ApplicationUrlSchema>;
export type RoleFilter = z.infer<typeof RoleFilterSchema>;

/**
 * Form validation error type for internationalized error messages
 */
export interface FormValidationError {
  field: keyof ApplicationForm;
  message: string;
  code: string;
}

/**
 * Validation result type for form submissions
 */
export interface ValidationResult {
  success: boolean;
  data?: ApplicationForm;
  errors?: FormValidationError[];
}

/**
 * Transform form data to API payload format
 * Converts React Hook Form values to backend-compatible structure
 */
export function transformFormToPayload(
  formData: ApplicationForm
): ApplicationPayload {
  return {
    name: formData.name,
    description: formData.description || null,
    type: parseInt(formData.appLocation, 10),
    role_id: formData.defaultRole?.id || null,
    is_active: formData.active,
    url: formData.appLocation === '2' ? formData.url || null : null,
    storage_service_id:
      formData.appLocation === '1' ? formData.storageServiceId : null,
    storage_container:
      formData.appLocation === '1' ? formData.storageContainer : null,
    path:
      formData.appLocation === '1' || formData.appLocation === '3'
        ? formData.path || null
        : null,
  };
}

/**
 * Transform API response to form data format
 * Converts backend response to React Hook Form compatible structure
 */
export function transformPayloadToForm(
  payload: any,
  roles: RoleSelection[] = []
): ApplicationForm {
  const roleById = roles.find((role) => role?.id === payload.roleId);

  return {
    name: payload.name || '',
    description: payload.description || '',
    defaultRole: roleById || null,
    active: payload.isActive || false,
    appLocation: String(payload.type || 0) as StorageLocationType,
    storageServiceId: payload.storageServiceId || 3,
    storageContainer: payload.storageContainer || 'applications',
    path: payload.path || '',
    url: payload.url || '',
  };
}

/**
 * Get validation schema for specific storage location type
 * Returns optimized schema for conditional validation scenarios
 */
export function getStorageLocationSchema(locationType: StorageLocationType) {
  const baseSchema = BaseApplicationFormSchema.omit({
    path: true,
    url: true,
  });

  switch (locationType) {
    case '0': // No specific storage
      return baseSchema.extend({
        path: z.string().optional(),
        url: z.string().optional(),
      });

    case '1': // File storage
      return baseSchema.extend({
        path: z
          .string()
          .min(1, { message: 'apps.validation.path.required' })
          .refine((val) => !val.startsWith('/'), {
            message: 'apps.validation.path.fileStorage.format',
          }),
        url: z.string().optional(),
      });

    case '2': // Remote URL
      return baseSchema.extend({
        url: z
          .string()
          .min(1, { message: 'apps.validation.url.required' })
          .url({ message: 'apps.validation.url.invalid' }),
        path: z.string().optional(),
      });

    case '3': // Web server
      return baseSchema.extend({
        path: z
          .string()
          .min(1, { message: 'apps.validation.path.required' })
          .refine((val) => val.startsWith('/'), {
            message: 'apps.validation.path.format',
          }),
        url: z.string().optional(),
      });

    default:
      return ApplicationFormSchema;
  }
}

/**
 * Performance-optimized validation for real-time form validation
 * Implements debounced validation under 100ms requirement
 */
export async function validateFormField(
  field: keyof ApplicationForm,
  value: any,
  context: Partial<ApplicationForm> = {}
): Promise<ValidationResult> {
  try {
    // Create partial schema for single field validation
    const fieldSchema = ApplicationFormSchema.pick({ [field]: true });

    // For conditional fields, include related context
    if (field === 'path' || field === 'url') {
      const contextualSchema = getStorageLocationSchema(
        context.appLocation || '0'
      );
      const result = await contextualSchema
        .pick({ [field]: true })
        .safeParseAsync({ [field]: value });

      return {
        success: result.success,
        data: result.success ? result.data : undefined,
        errors: result.success
          ? undefined
          : result.error.errors.map((err) => ({
              field: err.path[0] as keyof ApplicationForm,
              message: err.message,
              code: err.code,
            })),
      };
    }

    // Standard field validation
    const result = await fieldSchema.safeParseAsync({ [field]: value });

    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success
        ? undefined
        : result.error.errors.map((err) => ({
            field: err.path[0] as keyof ApplicationForm,
            message: err.message,
            code: err.code,
          })),
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          field,
          message: 'apps.validation.generic.error',
          code: 'validation_error',
        },
      ],
    };
  }
}

/**
 * Default form values for create mode
 */
export const DEFAULT_APPLICATION_FORM: ApplicationForm = {
  name: '',
  description: '',
  defaultRole: null,
  active: false,
  appLocation: '0',
  storageServiceId: 3,
  storageContainer: 'applications',
  path: '',
  url: '',
};

/**
 * Export all schemas for external validation
 */
export const schemas = {
  baseForm: BaseApplicationFormSchema,
  form: ApplicationFormSchema,
  payload: ApplicationPayloadSchema,
  apiKey: ApiKeySchema,
  applicationUrl: ApplicationUrlSchema,
  roleFilter: RoleFilterSchema,
  storageLocationType: StorageLocationTypeSchema,
  roleSelection: RoleSelectionSchema,
} as const;