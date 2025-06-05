/**
 * Data Transformation Utilities - Barrel Export
 * 
 * Centralized export module for data transformation utilities that provide seamless
 * integration between React/Next.js frontend components and DreamFactory API backend.
 * 
 * This module supports:
 * - Clean import patterns throughout React application components
 * - Tree-shaking optimization for optimal bundle size in Next.js builds
 * - TypeScript type safety for all data transformation operations
 * - Functional programming patterns for API client middleware integration
 * - Server-side rendering compatibility in Next.js environment
 * 
 * @example Basic Usage
 * ```typescript
 * // Named imports for specific functions
 * import { snakeToCamelString, mapSnakeToCamel } from '@/lib/data-transform'
 * 
 * // Transform API response from backend
 * const backendData = { user_name: 'john', created_at: '2024-01-01' }
 * const frontendData = mapSnakeToCamel(backendData)
 * // Result: { userName: 'john', createdAt: '2024-01-01' }
 * ```
 * 
 * @example API Middleware Integration
 * ```typescript
 * // Usage in React Query/SWR data fetching
 * import { mapSnakeToCamel, mapCamelToSnake } from '@/lib/data-transform'
 * 
 * const { data } = useQuery({
 *   queryKey: ['database-services'],
 *   queryFn: async () => {
 *     const response = await fetch('/api/v2/db')
 *     const data = await response.json()
 *     return mapSnakeToCamel(data) // Transform backend response
 *   }
 * })
 * ```
 * 
 * @example Next.js Middleware Usage
 * ```typescript
 * // Usage in API routes and middleware
 * import { mapCamelToSnake } from '@/lib/data-transform'
 * 
 * export async function POST(request: Request) {
 *   const body = await request.json()
 *   const transformedBody = mapCamelToSnake(body) // Transform for backend
 *   // Send to DreamFactory API
 * }
 * ```
 */

// Core case conversion utilities
export {
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake
} from './case'

// Re-export types for comprehensive TypeScript support
export type {
  /**
   * Type utility for transforming object keys from snake_case to camelCase
   * Preserves the structure while converting key naming conventions
   */
  CamelCaseKeys,
  
  /**
   * Type utility for transforming object keys from camelCase to snake_case
   * Maintains type safety during API request transformations
   */
  SnakeCaseKeys,
  
  /**
   * Generic transformation function type for functional programming patterns
   * Enables composition and piping of data transformations
   */
  DataTransformFn,
  
  /**
   * Configuration options for case conversion behavior
   * Allows customization of transformation rules and special cases
   */
  CaseConversionOptions
} from './case'

/**
 * Default export object providing all transformation utilities
 * Supports alternative import patterns for different use cases
 * 
 * @example Default Import Usage
 * ```typescript
 * import dataTransform from '@/lib/data-transform'
 * 
 * const transformed = dataTransform.mapSnakeToCamel(apiResponse)
 * ```
 */
const dataTransform = {
  snakeToCamelString,
  camelToSnakeString,
  mapSnakeToCamel,
  mapCamelToSnake
} as const

export default dataTransform

/**
 * Utility object for functional composition patterns
 * Enables clean chaining and pipeline operations
 * 
 * @example Functional Pipeline Usage
 * ```typescript
 * import { transform } from '@/lib/data-transform'
 * 
 * const processApiData = (data: unknown) =>
 *   transform
 *     .fromSnakeCase(data)
 *     .validate(schema)
 *     .sanitize()
 * ```
 */
export const transform = {
  /**
   * Transform object keys from snake_case to camelCase
   * Ideal for processing API responses from DreamFactory backend
   */
  fromSnakeCase: mapSnakeToCamel,
  
  /**
   * Transform object keys from camelCase to snake_case
   * Perfect for preparing frontend data for API requests
   */
  toSnakeCase: mapCamelToSnake,
  
  /**
   * Transform individual strings from snake_case to camelCase
   * Useful for dynamic key transformations and field mapping
   */
  stringToCase: snakeToCamelString,
  
  /**
   * Transform individual strings from camelCase to snake_case
   * Essential for field name conversions and API compatibility
   */
  stringFromCase: camelToSnakeString
} as const

/**
 * Type definitions for enhanced development experience
 * Provides compile-time type checking and IntelliSense support
 */
export type DataTransformModule = typeof dataTransform
export type TransformUtilities = typeof transform

/**
 * Constants for configuration and debugging
 * Supports development tooling and performance monitoring
 */
export const DATA_TRANSFORM_VERSION = '1.0.0'
export const SUPPORTED_FEATURES = [
  'snake_case to camelCase conversion',
  'camelCase to snake_case conversion', 
  'Recursive object key transformation',
  'SAML field special case handling',
  'Next.js SSR compatibility',
  'Tree-shaking optimization',
  'TypeScript type safety'
] as const