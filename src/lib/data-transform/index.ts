/**
 * Data Transformation Utilities
 * 
 * Comprehensive barrel export file providing centralized access to data transformation
 * utilities for the DreamFactory Admin Interface React/Next.js application. Enables
 * seamless conversion between frontend camelCase and backend snake_case conventions
 * while supporting tree-shaking optimization for optimal bundle size.
 * 
 * This module integrates with API client middleware using functional programming
 * patterns and provides both named and default import capabilities for maximum
 * flexibility across the application architecture.
 * 
 * @module DataTransform
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 * 
 * @example
 * ```typescript
 * // Named imports (tree-shakable)
 * import { mapSnakeToCamel, mapCamelToSnake } from '@/lib/data-transform'
 * 
 * // Default import (entire module)
 * import dataTransform from '@/lib/data-transform'
 * 
 * // Type-only imports
 * import type { CaseTransformed } from '@/lib/data-transform'
 * ```
 */

// Re-export all functions with explicit named exports for optimal tree-shaking
export {
  /**
   * Converts snake_case strings to camelCase format with SAML field support.
   * 
   * @function
   * @see {@link ./case.ts#snakeToCamelString} for implementation details
   */
  snakeToCamelString,
  
  /**
   * Converts camelCase strings to snake_case format with SAML field support.
   * 
   * @function
   * @see {@link ./case.ts#camelToSnakeString} for implementation details
   */
  camelToSnakeString,
  
  /**
   * Recursively transforms object keys from snake_case to camelCase.
   * Ideal for processing API responses from DreamFactory backend services.
   * 
   * @function
   * @see {@link ./case.ts#mapSnakeToCamel} for implementation details
   */
  mapSnakeToCamel,
  
  /**
   * Recursively transforms object keys from camelCase to snake_case.
   * Designed for preparing data for transmission to DreamFactory backend services.
   * 
   * @function
   * @see {@link ./case.ts#mapCamelToSnake} for implementation details
   */
  mapCamelToSnake,
} from './case';

// Re-export TypeScript utility types for comprehensive type safety
export type {
  /**
   * Utility type for inferring the transformed shape of an object after case conversion.
   * Provides compile-time type safety for data transformation operations.
   * 
   * @template T - The original object type to transform
   * @see {@link ./case.ts#CaseTransformed} for implementation details
   */
  CaseTransformed,
} from './case';

// Re-export the default export from case.ts as a named export for alternative import patterns
export {
  /**
   * Complete data transformation utilities object containing all functions.
   * Useful for dynamic usage patterns and functional composition.
   * 
   * @see {@link ./case.ts} for implementation details
   */
  default as caseTransforms,
} from './case';

/**
 * Default export providing the complete data transformation API.
 * 
 * Offers a comprehensive interface that includes all case conversion functions
 * and utility types in a single importable object. This pattern supports both
 * destructuring and direct method access while maintaining compatibility with
 * Next.js build system optimizations.
 * 
 * @example
 * ```typescript
 * import dataTransform from '@/lib/data-transform'
 * 
 * // Use with destructuring
 * const { mapSnakeToCamel, mapCamelToSnake } = dataTransform
 * 
 * // Use direct method access
 * const camelData = dataTransform.mapSnakeToCamel(apiResponse)
 * const snakeData = dataTransform.mapCamelToSnake(requestPayload)
 * ```
 */
const dataTransform = {
  // String transformation functions
  snakeToCamelString,
  camelToSnakeString,
  
  // Object transformation functions  
  mapSnakeToCamel,
  mapCamelToSnake,
} as const;

// Import the individual functions for the default export
import {
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake,
} from './case';

export default dataTransform;