/**
 * CORS configuration validation schemas using Zod for runtime type checking
 * and React Hook Form integration.
 * 
 * Provides comprehensive validation for CORS configuration forms including
 * path patterns, origin validation, HTTP method selection, and security
 * configuration with real-time validation under 100ms.
 * 
 * @fileoverview CORS configuration Zod validation schemas
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import { HTTP_METHODS, type HttpMethod } from '../../types/cors';

// ============================================================================
// Base Validation Schemas
// ============================================================================

/**
 * HTTP Method validation schema
 */
const httpMethodSchema = z.enum(HTTP_METHODS, {
  errorMap: () => ({ message: 'Please select a valid HTTP method' }),
});

/**
 * Path pattern validation schema
 * Supports basic path patterns with wildcards
 */
const pathPatternSchema = z
  .string()
  .min(1, 'Path is required')
  .max(255, 'Path must be less than 255 characters')
  .regex(
    /^[\/\w\-\*\.\?\[\]]+$/,
    'Path can only contain letters, numbers, /, -, *, ., ?, [, and ]'
  );

/**
 * Origin validation schema
 * Supports wildcards, specific domains, and protocol schemes
 */
const originSchema = z
  .string()
  .min(1, 'Origin is required')
  .max(255, 'Origin must be less than 255 characters')
  .refine(
    (value) => {
      // Allow wildcard
      if (value === '*') return true;
      
      // Allow localhost patterns
      if (value.includes('localhost') || value.includes('127.0.0.1')) return true;
      
      // Allow valid URL patterns
      try {
        new URL(value);
        return true;
      } catch {
        // Allow domain patterns without protocol
        return /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+(\:[0-9]+)?$/.test(value);
      }
    },
    {
      message: 'Please enter a valid origin (e.g., *, https://example.com, localhost:3000)',
    }
  );

/**
 * Headers validation schema
 * Supports comma-separated header names
 */
const headersSchema = z
  .string()
  .max(1000, 'Headers must be less than 1000 characters')
  .refine(
    (value) => {
      if (!value.trim()) return true;
      
      // Split by comma and validate each header name
      const headers = value.split(',').map(h => h.trim());
      return headers.every(header => 
        /^[a-zA-Z][a-zA-Z0-9\-]*$/.test(header)
      );
    },
    {
      message: 'Headers must be valid header names separated by commas (e.g., Content-Type, Authorization)',
    }
  );

/**
 * Max age validation schema
 * Supports values from 0 to 86400 seconds (24 hours)
 */
const maxAgeSchema = z
  .number({
    required_error: 'Max age is required',
    invalid_type_error: 'Max age must be a number',
  })
  .int('Max age must be a whole number')
  .min(0, 'Max age must be 0 or greater')
  .max(86400, 'Max age cannot exceed 86400 seconds (24 hours)');

/**
 * Description validation schema
 */
const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(255, 'Description must be less than 255 characters')
  .trim();

// ============================================================================
// CORS Configuration Schemas
// ============================================================================

/**
 * CORS configuration creation schema
 * Used for new CORS configuration forms
 */
export const corsConfigCreateSchema = z.object({
  description: descriptionSchema,
  enabled: z.boolean().default(true),
  path: pathPatternSchema.default('/*'),
  origin: originSchema.default('*'),
  method: z
    .array(httpMethodSchema)
    .min(1, 'At least one HTTP method must be selected')
    .default(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  header: headersSchema.default('Content-Type, X-Requested-With, Authorization'),
  exposedHeader: headersSchema.optional().default(''),
  maxAge: maxAgeSchema.default(3600),
  supportsCredentials: z.boolean().default(false),
});

/**
 * CORS configuration update schema
 * Used for editing existing CORS configurations
 */
export const corsConfigUpdateSchema = z.object({
  id: z.number().int().positive('Invalid CORS configuration ID'),
  description: descriptionSchema.optional(),
  enabled: z.boolean().optional(),
  path: pathPatternSchema.optional(),
  origin: originSchema.optional(),
  method: z
    .array(httpMethodSchema)
    .min(1, 'At least one HTTP method must be selected')
    .optional(),
  header: headersSchema.optional(),
  exposedHeader: headersSchema.optional(),
  maxAge: maxAgeSchema.optional(),
  supportsCredentials: z.boolean().optional(),
});

/**
 * CORS configuration query schema
 * Used for filtering and pagination
 */
export const corsConfigQuerySchema = z.object({
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
  filter: z.object({
    enabled: z.boolean().optional(),
    path: z.string().optional(),
    origin: z.string().optional(),
    description: z.string().optional(),
    method: z.array(httpMethodSchema).optional(),
    createdDateFrom: z.string().datetime().optional(),
    createdDateTo: z.string().datetime().optional(),
  }).optional(),
  sort: z.array(z.object({
    field: z.enum([
      'id', 'description', 'enabled', 'path', 'origin', 
      'maxAge', 'createdDate', 'lastModifiedDate'
    ]),
    direction: z.enum(['asc', 'desc']),
  })).optional(),
  fields: z.array(z.string()).optional(),
  includeCount: z.boolean().optional(),
});

/**
 * CORS configuration toggle schema
 * Used for enabling/disabling CORS configurations
 */
export const corsConfigToggleSchema = z.object({
  id: z.number().int().positive('Invalid CORS configuration ID'),
  enabled: z.boolean(),
});

/**
 * CORS configuration deletion schema
 * Used for deleting CORS configurations
 */
export const corsConfigDeleteSchema = z.object({
  id: z.number().int().positive('Invalid CORS configuration ID'),
});

// ============================================================================
// Form Field Schemas
// ============================================================================

/**
 * Method selector validation schema
 * Used for HTTP method selection components
 */
export const methodSelectorSchema = z.object({
  methods: z
    .array(httpMethodSchema)
    .min(1, 'At least one HTTP method must be selected'),
});

/**
 * Origin input validation schema with suggestions
 * Used for origin input fields with autocomplete
 */
export const originInputSchema = z.object({
  origin: originSchema,
  suggestions: z.array(z.string()).optional(),
});

/**
 * Headers input validation schema
 * Used for header input fields with validation
 */
export const headersInputSchema = z.object({
  headers: headersSchema,
  allowedHeaders: z.array(z.string()).optional(),
});

// ============================================================================
// Type Inference
// ============================================================================

/**
 * Inferred TypeScript types from Zod schemas
 */
export type CorsConfigCreateForm = z.infer<typeof corsConfigCreateSchema>;
export type CorsConfigUpdateForm = z.infer<typeof corsConfigUpdateSchema>;
export type CorsConfigQueryForm = z.infer<typeof corsConfigQuerySchema>;
export type CorsConfigToggleForm = z.infer<typeof corsConfigToggleSchema>;
export type CorsConfigDeleteForm = z.infer<typeof corsConfigDeleteSchema>;
export type MethodSelectorForm = z.infer<typeof methodSelectorSchema>;
export type OriginInputForm = z.infer<typeof originInputSchema>;
export type HeadersInputForm = z.infer<typeof headersInputSchema>;

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates a CORS configuration for creation
 */
export function validateCorsCreate(data: unknown): CorsConfigCreateForm {
  return corsConfigCreateSchema.parse(data);
}

/**
 * Validates a CORS configuration for updates
 */
export function validateCorsUpdate(data: unknown): CorsConfigUpdateForm {
  return corsConfigUpdateSchema.parse(data);
}

/**
 * Validates CORS query parameters
 */
export function validateCorsQuery(data: unknown): CorsConfigQueryForm {
  return corsConfigQuerySchema.parse(data);
}

/**
 * Validates CORS toggle operation
 */
export function validateCorsToggle(data: unknown): CorsConfigToggleForm {
  return corsConfigToggleSchema.parse(data);
}

/**
 * Validates CORS deletion operation
 */
export function validateCorsDelete(data: unknown): CorsConfigDeleteForm {
  return corsConfigDeleteSchema.parse(data);
}

/**
 * Safely validates data without throwing
 */
export function safeParseCorsCreate(data: unknown) {
  return corsConfigCreateSchema.safeParse(data);
}

/**
 * Safely validates update data without throwing
 */
export function safeParseCorsUpdate(data: unknown) {
  return corsConfigUpdateSchema.safeParse(data);
}

/**
 * Validates HTTP method array
 */
export function validateHttpMethods(methods: unknown): HttpMethod[] {
  const schema = z.array(httpMethodSchema).min(1);
  return schema.parse(methods);
}

/**
 * Validates origin string
 */
export function validateOrigin(origin: unknown): string {
  return originSchema.parse(origin);
}

/**
 * Validates path pattern
 */
export function validatePath(path: unknown): string {
  return pathPatternSchema.parse(path);
}

/**
 * Validates headers string
 */
export function validateHeaders(headers: unknown): string {
  return headersSchema.parse(headers);
}

/**
 * Checks if a string is a valid origin pattern
 */
export function isValidOrigin(origin: string): boolean {
  return originSchema.safeParse(origin).success;
}

/**
 * Checks if a string is a valid path pattern
 */
export function isValidPath(path: string): boolean {
  return pathPatternSchema.safeParse(path).success;
}

/**
 * Checks if headers string is valid
 */
export function isValidHeaders(headers: string): boolean {
  return headersSchema.safeParse(headers).success;
}

// ============================================================================
// Export all schemas and utilities
// ============================================================================

export {
  corsConfigCreateSchema,
  corsConfigUpdateSchema,
  corsConfigQuerySchema,
  corsConfigToggleSchema,
  corsConfigDeleteSchema,
  methodSelectorSchema,
  originInputSchema,
  headersInputSchema,
  httpMethodSchema,
  pathPatternSchema,
  originSchema,
  headersSchema,
  maxAgeSchema,
  descriptionSchema,
};