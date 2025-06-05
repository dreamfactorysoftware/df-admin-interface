/**
 * Pure TypeScript utility functions for string and object key case conversion
 * between snake_case/kebab-case and camelCase.
 * 
 * Essential for data transformation between frontend React components and 
 * backend DreamFactory API contracts. Compatible with both client-side and 
 * server-side rendering contexts in Next.js.
 * 
 * @module case
 */

/**
 * Converts a snake_case or kebab-case string to camelCase.
 * 
 * Handles underscore and hyphen separated strings by converting them to camelCase format.
 * Commonly used for transforming API response keys to JavaScript-friendly property names.
 * 
 * @param str - The snake_case or kebab-case string to convert
 * @returns The converted camelCase string
 * 
 * @example
 * ```typescript
 * snakeToCamelString('user_name') // returns 'userName'
 * snakeToCamelString('api-key') // returns 'apiKey'
 * snakeToCamelString('database_connection_string') // returns 'databaseConnectionString'
 * ```
 */
export const snakeToCamelString = (str: string): string =>
  str.replace(/([-_]\w)/g, g => g[1].toUpperCase());

/**
 * Recursively converts all object keys from snake_case/kebab-case to camelCase.
 * 
 * Deep transforms nested objects and arrays, maintaining the original data structure
 * while converting all string keys to camelCase format. Essential for transforming
 * API responses from DreamFactory backend to frontend-friendly object structures.
 * 
 * @template T - The type of the input object
 * @param obj - The object, array, or primitive value to transform
 * @returns The transformed object with camelCase keys
 * 
 * @example
 * ```typescript
 * const apiResponse = {
 *   user_name: 'john',
 *   database_config: {
 *     connection_string: 'mysql://...',
 *     table_names: ['users', 'orders']
 *   }
 * };
 * 
 * const transformed = mapSnakeToCamel(apiResponse);
 * // Result: {
 * //   userName: 'john',
 * //   databaseConfig: {
 * //     connectionString: 'mysql://...',
 * //     tableNames: ['users', 'orders']
 * //   }
 * // }
 * ```
 */
export function mapSnakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapSnakeToCamel(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[snakeToCamelString(key)] = mapSnakeToCamel(
          (obj as Record<string, unknown>)[key]
        );
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}

/**
 * Converts a camelCase string to snake_case with special handling for SAML fields.
 * 
 * Transforms camelCase strings to snake_case format while preserving specific
 * SAML-related field names that require custom formatting for API compatibility.
 * These special cases maintain exact compatibility with DreamFactory's SAML
 * authentication service expectations.
 * 
 * @param str - The camelCase string to convert
 * @returns The converted snake_case string with SAML special case handling
 * 
 * @example
 * ```typescript
 * camelToSnakeString('userName') // returns 'user_name'
 * camelToSnakeString('databaseConfig') // returns 'database_config'
 * 
 * // SAML special cases:
 * camelToSnakeString('idpSingleSignOnServiceUrl') // returns 'idp_singleSignOnService_url'
 * camelToSnakeString('idpEntityId') // returns 'idp_entityId'
 * camelToSnakeString('spNameIDFormat') // returns 'sp_nameIDFormat'
 * camelToSnakeString('spPrivateKey') // returns 'sp_privateKey'
 * ```
 */
export const camelToSnakeString = (str: string): string => {
  // SAML-specific field name handling for DreamFactory API compatibility
  if (
    str === 'idpSingleSignOnServiceUrl' ||
    str === 'idp_singleSignOnService_url'
  ) {
    return 'idp_singleSignOnService_url';
  }
  if (str === 'idpEntityId' || str === 'idp_entityId') {
    return 'idp_entityId';
  }
  if (str === 'spNameIDFormat' || str === 'sp_nameIDFormat') {
    return 'sp_nameIDFormat';
  }
  if (str === 'spPrivateKey' || str === 'sp_privateKey') {
    return 'sp_privateKey';
  }
  
  // Standard camelCase to snake_case conversion
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1_$2').toLowerCase();
};

/**
 * Recursively converts all object keys from camelCase to snake_case with special handling.
 * 
 * Deep transforms nested objects and arrays while preserving the original data structure.
 * Converts all string keys to snake_case format with special handling for SAML fields
 * and preservation of 'requestBody' keys for API payload compatibility.
 * 
 * This function is essential for transforming frontend form data and component state
 * to the expected backend API format that DreamFactory Core services require.
 * 
 * @template T - The type of the input object
 * @param obj - The object, array, or primitive value to transform
 * @returns The transformed object with snake_case keys
 * 
 * @example
 * ```typescript
 * const frontendData = {
 *   userName: 'john',
 *   databaseConfig: {
 *     connectionString: 'mysql://...',
 *     tableNames: ['users', 'orders']
 *   },
 *   requestBody: {
 *     // This key is preserved as-is
 *     someData: 'value'
 *   }
 * };
 * 
 * const apiPayload = mapCamelToSnake(frontendData);
 * // Result: {
 * //   user_name: 'john',
 * //   database_config: {
 * //     connection_string: 'mysql://...',
 * //     table_names: ['users', 'orders']
 * //   },
 * //   requestBody: {
 * //     some_data: 'value'
 * //   }
 * // }
 * ```
 */
export function mapCamelToSnake<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => mapCamelToSnake(item)) as unknown as T;
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === 'requestBody') {
          // Preserve 'requestBody' key as-is for API payload compatibility
          newObj[key] = (obj as Record<string, unknown>)[key];
        } else {
          newObj[camelToSnakeString(key)] = mapCamelToSnake(
            (obj as Record<string, unknown>)[key]
          );
        }
      }
    }
    return newObj as unknown as T;
  } else {
    return obj;
  }
}