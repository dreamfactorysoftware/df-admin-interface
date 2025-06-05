/**
 * Validation Schemas with Zod
 * 
 * Comprehensive Zod validation schemas for form inputs, API payloads, and user data.
 * Provides runtime type checking with compile-time inference for enhanced type safety
 * throughout the React application. Optimized for real-time validation under 100ms.
 */

import { z } from 'zod';
import { SUPPORTED_FILE_EXTENSIONS } from '@/types/github';

/**
 * Utility function to validate HTTP/HTTPS URLs
 */
function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * GitHub URL validation schema
 */
export const gitHubUrlSchema = z
  .string()
  .min(1, 'GitHub URL is required')
  .refine(isValidHttpUrl, {
    message: 'Please enter a valid HTTP or HTTPS URL',
  })
  .refine((url) => url.includes('github.com'), {
    message: 'URL must be from github.com',
  })
  .refine(
    (url) => {
      return SUPPORTED_FILE_EXTENSIONS.some((ext) => url.includes(ext));
    },
    {
      message: `File must have one of the following extensions: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`,
    }
  )
  .refine(
    (url) => {
      // Check if URL follows GitHub file URL pattern
      const githubFilePattern = /github\.com\/[^\/]+\/[^\/]+\/blob\/[^\/]+\//;
      return githubFilePattern.test(url);
    },
    {
      message: 'Please enter a valid GitHub file URL (e.g., https://github.com/user/repo/blob/main/file.js)',
    }
  );

/**
 * GitHub credentials schema for private repositories
 */
export const gitHubCredentialsSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required for private repositories')
    .max(39, 'GitHub username cannot exceed 39 characters')
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/, {
      message: 'Invalid GitHub username format',
    }),
  password: z
    .string()
    .min(1, 'Personal access token is required for private repositories')
    .min(40, 'GitHub personal access token must be at least 40 characters')
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Invalid personal access token format',
    }),
});

/**
 * GitHub dialog form schema
 */
export const gitHubDialogFormSchema = z
  .object({
    url: gitHubUrlSchema,
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // If username is provided, password must also be provided and vice versa
    if (data.username && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Personal access token is required when username is provided',
        path: ['password'],
      });
    }
    if (data.password && !data.username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Username is required when personal access token is provided',
        path: ['username'],
      });
    }
    
    // If both username and password are provided, validate them
    if (data.username && data.password) {
      const credentialsResult = gitHubCredentialsSchema.safeParse({
        username: data.username,
        password: data.password,
      });
      
      if (!credentialsResult.success) {
        credentialsResult.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: issue.path,
          });
        });
      }
    }
  });

/**
 * Database connection string validation schema
 */
export const databaseConnectionSchema = z.object({
  host: z
    .string()
    .min(1, 'Host is required')
    .max(253, 'Host name is too long')
    .regex(/^[a-zA-Z0-9.-]+$/, {
      message: 'Invalid host format',
    }),
  port: z
    .number()
    .int('Port must be an integer')
    .min(1, 'Port must be greater than 0')
    .max(65535, 'Port must be less than 65536'),
  database: z
    .string()
    .min(1, 'Database name is required')
    .max(64, 'Database name is too long'),
  username: z
    .string()
    .min(1, 'Username is required')
    .max(32, 'Username is too long'),
  password: z.string().optional(),
});

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long');

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one number')
  .regex(/^(?=.*[@$!%*?&])/, 'Password must contain at least one special character');

/**
 * Service name validation schema
 */
export const serviceNameSchema = z
  .string()
  .min(1, 'Service name is required')
  .max(64, 'Service name is too long')
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, {
    message: 'Service name must start with a letter and contain only letters, numbers, underscores, and hyphens',
  });

/**
 * Table name validation schema
 */
export const tableNameSchema = z
  .string()
  .min(1, 'Table name is required')
  .max(64, 'Table name is too long')
  .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: 'Table name must start with a letter and contain only letters, numbers, and underscores',
  });

/**
 * API endpoint validation schema
 */
export const apiEndpointSchema = z
  .string()
  .min(1, 'API endpoint is required')
  .regex(/^\/[a-zA-Z0-9\/_-]*$/, {
    message: 'API endpoint must start with / and contain only valid URL characters',
  });

/**
 * JSON validation schema
 */
export const jsonSchema = z
  .string()
  .min(1, 'JSON content is required')
  .refine(
    (value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid JSON format',
    }
  );

/**
 * SQL query validation schema
 */
export const sqlQuerySchema = z
  .string()
  .min(1, 'SQL query is required')
  .max(10000, 'SQL query is too long')
  .refine(
    (value) => {
      // Basic SQL injection protection - block dangerous keywords
      const dangerousKeywords = [
        'drop',
        'delete',
        'truncate',
        'alter',
        'create',
        'insert',
        'update',
        'exec',
        'execute',
        'script',
      ];
      const lowerValue = value.toLowerCase();
      return !dangerousKeywords.some((keyword) => lowerValue.includes(keyword));
    },
    {
      message: 'SQL query contains potentially dangerous operations',
    }
  );

/**
 * Type exports for form data
 */
export type GitHubDialogFormData = z.infer<typeof gitHubDialogFormSchema>;
export type GitHubCredentialsData = z.infer<typeof gitHubCredentialsSchema>;
export type DatabaseConnectionData = z.infer<typeof databaseConnectionSchema>;
export type EmailData = z.infer<typeof emailSchema>;
export type PasswordData = z.infer<typeof passwordSchema>;
export type ServiceNameData = z.infer<typeof serviceNameSchema>;
export type TableNameData = z.infer<typeof tableNameSchema>;
export type ApiEndpointData = z.infer<typeof apiEndpointSchema>;
export type JsonData = z.infer<typeof jsonSchema>;
export type SqlQueryData = z.infer<typeof sqlQuerySchema>;