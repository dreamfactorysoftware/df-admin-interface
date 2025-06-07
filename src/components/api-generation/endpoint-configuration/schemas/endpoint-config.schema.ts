/**
 * Zod schema definitions for API endpoint configuration validation.
 * Provides comprehensive validation for endpoint configuration forms with 
 * real-time validation under 100ms per React/Next.js Integration Requirements.
 * 
 * Schemas ensure type-safe form validation for HTTP methods, parameters,
 * security settings, and endpoint configuration workflows.
 */

import { z } from 'zod';
import { HttpMethod } from '../types/endpoint-config.types';

/**
 * HTTP Method validation schema
 */
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], {
  required_error: 'HTTP method is required',
  invalid_type_error: 'Invalid HTTP method selected'
});

/**
 * Parameter configuration validation schema
 */
export const parameterConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Parameter name is required')
    .max(50, 'Parameter name must be 50 characters or less')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/, 
      'Parameter name must start with a letter and contain only letters, numbers, and underscores'
    ),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object'], {
    required_error: 'Parameter type is required'
  }),
  required: z.boolean(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
  defaultValue: z.any().optional(),
  validation: z
    .array(
      z.object({
        type: z.enum(['required', 'minLength', 'maxLength', 'pattern', 'custom']),
        value: z.any().optional(),
        message: z.string().min(1, 'Validation message is required')
      })
    )
    .optional(),
  examples: z.array(z.any()).optional()
});

/**
 * Request body configuration validation schema
 */
export const requestBodyConfigSchema = z.object({
  contentType: z
    .string()
    .min(1, 'Content type is required')
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]*\/[a-zA-Z][a-zA-Z0-9\-\+]*$/,
      'Invalid content type format'
    ),
  schema: z.any(),
  required: z.boolean(),
  example: z.any().optional()
});

/**
 * Response configuration validation schema
 */
export const responseConfigSchema = z.object({
  statusCode: z
    .number()
    .min(100, 'Status code must be between 100-599')
    .max(599, 'Status code must be between 100-599'),
  description: z
    .string()
    .min(1, 'Response description is required')
    .max(500, 'Description must be 500 characters or less'),
  schema: z.any().optional(),
  example: z.any().optional()
});

/**
 * Security configuration validation schema
 */
export const securityConfigSchema = z.object({
  authType: z.enum(['none', 'api-key', 'bearer', 'basic', 'oauth2'], {
    required_error: 'Authentication type is required'
  }),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional()
});

/**
 * Query configuration validation schema
 */
export const queryConfigSchema = z.object({
  allowFiltering: z.boolean(),
  allowSorting: z.boolean(),
  allowPagination: z.boolean(),
  defaultPageSize: z
    .number()
    .min(1, 'Page size must be at least 1')
    .max(1000, 'Page size cannot exceed 1000')
    .optional(),
  maxPageSize: z
    .number()
    .min(1, 'Max page size must be at least 1')
    .max(1000, 'Max page size cannot exceed 1000')
    .optional(),
  sortableFields: z.array(z.string()).optional(),
  filterableFields: z.array(z.string()).optional()
});

/**
 * Method-specific configuration validation schema
 */
export const methodConfigSchema = z.object({
  allowBody: z.boolean(),
  allowParameters: z.boolean(),
  requireAuth: z.boolean(),
  supportsCaching: z.boolean(),
  idempotent: z.boolean(),
  safe: z.boolean()
});

/**
 * Main endpoint configuration validation schema
 */
export const endpointConfigSchema = z.object({
  // Basic endpoint configuration
  method: httpMethodSchema,
  endpoint: z
    .string()
    .min(1, 'Endpoint path is required')
    .regex(/^\//, 'Endpoint path must start with /')
    .max(255, 'Endpoint path must be 255 characters or less'),
  
  // Optional description
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
  
  // Path parameters
  pathParams: z.array(parameterConfigSchema).optional(),
  
  // Query parameters
  queryParams: z.array(parameterConfigSchema).optional(),
  
  // Request body (only for POST, PUT, PATCH)
  requestBody: requestBodyConfigSchema.optional(),
  
  // Response configurations
  responses: z
    .array(responseConfigSchema)
    .min(1, 'At least one response configuration is required'),
  
  // Security configuration
  security: securityConfigSchema,
  
  // Query configuration
  queryConfig: queryConfigSchema.optional(),
  
  // Method-specific configuration
  methodConfig: methodConfigSchema.optional(),
  
  // Additional metadata
  tags: z.array(z.string()).optional(),
  summary: z
    .string()
    .max(255, 'Summary must be 255 characters or less')
    .optional(),
  operationId: z
    .string()
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      'Operation ID must start with a letter and contain only letters, numbers, and underscores'
    )
    .optional(),
  deprecated: z.boolean().optional()
}).refine(
  (data) => {
    // Validate that request body is only allowed for certain methods
    const methodsWithBody: HttpMethod[] = ['POST', 'PUT', 'PATCH'];
    if (data.requestBody && !methodsWithBody.includes(data.method)) {
      return false;
    }
    return true;
  },
  {
    message: 'Request body is not allowed for GET and DELETE methods',
    path: ['requestBody']
  }
).refine(
  (data) => {
    // Validate that required responses include at least one success response
    const hasSuccessResponse = data.responses.some(
      response => response.statusCode >= 200 && response.statusCode < 300
    );
    return hasSuccessResponse;
  },
  {
    message: 'At least one success response (2xx) is required',
    path: ['responses']
  }
).refine(
  (data) => {
    // Validate pagination configuration consistency
    if (data.queryConfig?.allowPagination) {
      if (data.queryConfig.defaultPageSize && data.queryConfig.maxPageSize) {
        return data.queryConfig.defaultPageSize <= data.queryConfig.maxPageSize;
      }
    }
    return true;
  },
  {
    message: 'Default page size cannot exceed maximum page size',
    path: ['queryConfig', 'defaultPageSize']
  }
);

/**
 * Form step validation schemas for multi-step form validation
 */
export const endpointConfigStepSchemas = {
  // Step 1: Basic configuration
  basic: z.object({
    method: httpMethodSchema,
    endpoint: endpointConfigSchema.shape.endpoint,
    description: endpointConfigSchema.shape.description,
    summary: endpointConfigSchema.shape.summary
  }),
  
  // Step 2: Parameters configuration
  parameters: z.object({
    pathParams: endpointConfigSchema.shape.pathParams,
    queryParams: endpointConfigSchema.shape.queryParams
  }),
  
  // Step 3: Request/Response configuration
  requestResponse: z.object({
    requestBody: endpointConfigSchema.shape.requestBody,
    responses: endpointConfigSchema.shape.responses
  }),
  
  // Step 4: Security configuration
  security: z.object({
    security: endpointConfigSchema.shape.security
  }),
  
  // Step 5: Query configuration
  query: z.object({
    queryConfig: endpointConfigSchema.shape.queryConfig
  }),
  
  // Step 6: Metadata
  metadata: z.object({
    tags: endpointConfigSchema.shape.tags,
    operationId: endpointConfigSchema.shape.operationId,
    deprecated: endpointConfigSchema.shape.deprecated
  })
};

/**
 * Endpoint configuration form data type
 */
export type EndpointConfigFormData = z.infer<typeof endpointConfigSchema>;

/**
 * Individual step form data types
 */
export type EndpointConfigStepData = {
  [K in keyof typeof endpointConfigStepSchemas]: z.infer<typeof endpointConfigStepSchemas[K]>;
};

/**
 * Validation error type for enhanced error handling
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  data?: EndpointConfigFormData;
  errors?: ValidationError[];
}

/**
 * Helper function to validate endpoint configuration
 */
export function validateEndpointConfig(data: unknown): ValidationResult {
  try {
    const result = endpointConfigSchema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      const errors: ValidationError[] = result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
      }));
      
      return {
        success: false,
        errors
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'root',
        message: 'Validation failed due to unexpected error',
        code: 'unknown_error'
      }]
    };
  }
}

/**
 * Helper function to validate individual form steps
 */
export function validateEndpointConfigStep<T extends keyof typeof endpointConfigStepSchemas>(
  step: T,
  data: unknown
): ValidationResult {
  try {
    const schema = endpointConfigStepSchemas[step];
    const result = schema.safeParse(data);
    
    if (result.success) {
      return {
        success: true,
        data: result.data as EndpointConfigFormData
      };
    } else {
      const errors: ValidationError[] = result.error.errors.map(error => ({
        field: error.path.join('.'),
        message: error.message,
        code: error.code
      }));
      
      return {
        success: false,
        errors
      };
    }
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'root',
        message: 'Step validation failed due to unexpected error',
        code: 'unknown_error'
      }]
    };
  }
}

/**
 * Export all schemas for external use
 */
export {
  httpMethodSchema,
  parameterConfigSchema,
  requestBodyConfigSchema,
  responseConfigSchema,
  securityConfigSchema,
  queryConfigSchema,
  methodConfigSchema,
  endpointConfigSchema
};