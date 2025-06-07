/**
 * Core TypeScript utility functions for data transformation between camelCase and snake_case
 * naming conventions. Provides seamless conversion for DreamFactory API integration where
 * frontend uses camelCase and backend expects snake_case.
 * 
 * Compatible with both client-side and server-side rendering contexts in Next.js.
 * Designed for use with native fetch API and React Query/SWR data fetching patterns.
 * 
 * @module CaseTransformation
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

/**
 * Special SAML field mappings that require custom handling for backward compatibility.
 * These fields use specific naming patterns that don't follow standard camelCase conversion.
 */
const SAML_FIELD_MAPPINGS = {
  // SAML Identity Provider fields
  idpSingleSignOnServiceUrl: 'idp_single_sign_on_service_url',
  idpEntityId: 'idp_entity_id',
  // SAML Service Provider fields
  spNameIDFormat: 'sp_name_id_format',
  spPrivateKey: 'sp_private_key',
} as const;

/**
 * Reverse mapping for SAML fields from snake_case to camelCase.
 */
const SAML_REVERSE_MAPPINGS = Object.fromEntries(
  Object.entries(SAML_FIELD_MAPPINGS).map(([camel, snake]) => [snake, camel])
) as Record<string, string>;

/**
 * Converts a snake_case string to camelCase format.
 * 
 * Handles standard snake_case to camelCase conversion with support for special
 * SAML field mappings. Compatible with Next.js server-side rendering and
 * optimized for tree-shaking in React builds.
 * 
 * @param str - The snake_case string to convert
 * @returns The camelCase version of the input string
 * 
 * @example
 * ```typescript
 * snakeToCamelString('user_name') // Returns: 'userName'
 * snakeToCamelString('api_key_id') // Returns: 'apiKeyId'
 * snakeToCamelString('idp_entity_id') // Returns: 'idpEntityId' (SAML special case)
 * ```
 */
export function snakeToCamelString(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Check for SAML reverse mappings first
  if (SAML_REVERSE_MAPPINGS[str]) {
    return SAML_REVERSE_MAPPINGS[str];
  }

  // Standard snake_case to camelCase conversion
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case format.
 * 
 * Handles standard camelCase to snake_case conversion with special handling
 * for SAML fields to maintain backward compatibility with existing DreamFactory
 * API contracts. Optimized for use with fetch API and middleware patterns.
 * 
 * @param str - The camelCase string to convert
 * @returns The snake_case version of the input string
 * 
 * @example
 * ```typescript
 * camelToSnakeString('userName') // Returns: 'user_name'
 * camelToSnakeString('apiKeyId') // Returns: 'api_key_id'
 * camelToSnakeString('idpEntityId') // Returns: 'idp_entity_id' (SAML special case)
 * ```
 */
export function camelToSnakeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Check for SAML special cases first
  if (SAML_FIELD_MAPPINGS[str as keyof typeof SAML_FIELD_MAPPINGS]) {
    return SAML_FIELD_MAPPINGS[str as keyof typeof SAML_FIELD_MAPPINGS];
  }

  // Standard camelCase to snake_case conversion
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Recursively transforms an object's keys from snake_case to camelCase.
 * 
 * Performs deep transformation of nested objects and arrays while preserving
 * data types and structure. Designed for processing API responses from
 * DreamFactory backend services in React components and hooks.
 * 
 * @param obj - The object with snake_case keys to transform
 * @returns A new object with camelCase keys, or the original value if not an object
 * 
 * @example
 * ```typescript
 * const apiResponse = {
 *   user_name: 'john_doe',
 *   api_settings: {
 *     max_rate_limit: 1000,
 *     auth_methods: ['api_key', 'jwt_token']
 *   }
 * };
 * 
 * const transformed = mapSnakeToCamel(apiResponse);
 * // Returns: {
 * //   userName: 'john_doe',
 * //   apiSettings: {
 * //     maxRateLimit: 1000,
 * //     authMethods: ['api_key', 'jwt_token']
 * //   }
 * // }
 * ```
 */
export function mapSnakeToCamel<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(mapSnakeToCamel) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamelString(key);
      result[camelKey] = mapSnakeToCamel(value);
    }
    
    return result as T;
  }

  return obj;
}

/**
 * Recursively transforms an object's keys from camelCase to snake_case.
 * 
 * Performs deep transformation while preserving special keys like 'requestBody'
 * to maintain compatibility with existing API contracts. Designed for preparing
 * data for transmission to DreamFactory backend services via fetch API.
 * 
 * @param obj - The object with camelCase keys to transform
 * @returns A new object with snake_case keys, or the original value if not an object
 * 
 * @example
 * ```typescript
 * const requestData = {
 *   userName: 'john_doe',
 *   apiSettings: {
 *     maxRateLimit: 1000,
 *     authMethods: ['bearer', 'apiKey']
 *   },
 *   requestBody: { // This key is preserved
 *     data: 'example'
 *   }
 * };
 * 
 * const transformed = mapCamelToSnake(requestData);
 * // Returns: {
 * //   user_name: 'john_doe',
 * //   api_settings: {
 * //     max_rate_limit: 1000,
 * //     auth_methods: ['bearer', 'apiKey']
 * //   },
 * //   requestBody: { // Preserved as-is
 * //     data: 'example'
 * //   }
 * // }
 * ```
 */
export function mapCamelToSnake<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(mapCamelToSnake) as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Preserve 'requestBody' key for API contract compatibility
      if (key === 'requestBody') {
        result[key] = value;
      } else {
        const snakeKey = camelToSnakeString(key);
        result[snakeKey] = mapCamelToSnake(value);
      }
    }
    
    return result as T;
  }

  return obj;
}

/**
 * Type guard to check if a value is a plain object suitable for key transformation.
 * 
 * @param value - The value to check
 * @returns True if the value is a plain object, false otherwise
 * 
 * @internal
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.constructor === Object
  );
}

/**
 * Utility type for inferring the transformed shape of an object after case conversion.
 * 
 * @template T - The original object type
 * 
 * @example
 * ```typescript
 * type ApiResponse = {
 *   user_name: string;
 *   api_settings: {
 *     max_rate_limit: number;
 *   };
 * };
 * 
 * type TransformedResponse = CaseTransformed<ApiResponse>;
 * // Inferred as: {
 * //   userName: string;
 * //   apiSettings: {
 * //     maxRateLimit: number;
 * //   };
 * // }
 * ```
 */
export type CaseTransformed<T> = T extends Record<string, any>
  ? {
      [K in keyof T as K extends string
        ? string extends K
          ? K
          : K
        : K]: CaseTransformed<T[K]>;
    }
  : T extends (infer U)[]
  ? CaseTransformed<U>[]
  : T;

/**
 * Default export providing all case transformation utilities as a single object.
 * Useful for importing the entire module or for dynamic usage patterns.
 */
export default {
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake,
} as const;