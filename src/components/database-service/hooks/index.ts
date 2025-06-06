/**
 * Database Service Hooks - Barrel Export Module
 * 
 * Centralized export interface for all database service React hooks, providing clean
 * import patterns and tree-shaking optimization for the Turbopack build pipeline.
 * Enables component composition patterns throughout the database service module while
 * maintaining TypeScript 5.8+ compatibility and Next.js 15.1+ import/export standards.
 * 
 * This barrel export follows React 19 ecosystem best practices for module organization,
 * supporting both named and default imports with optimal development experience.
 * 
 * @fileoverview Centralized exports for database service hooks
 * @version 1.0.0
 * @since 2024-01-01
 */

// =============================================================================
// SERVICES HOOK EXPORTS
// =============================================================================

/**
 * Primary services management hook with comprehensive CRUD operations,
 * intelligent caching, and optimistic updates
 */
export { 
  default as useServices,
  useServices,
  useServicesInvalidation,
  useServicesCache,
  servicesQueryKeys,
} from './useServices';

/**
 * Services hook types and interfaces for TypeScript integration
 */
export type {
  UseServicesOptions,
  ServicesQueryResult, 
  UseServicesReturn,
} from './useServices';

// =============================================================================
// SERVICE TYPES HOOK EXPORTS  
// =============================================================================

/**
 * Service types hook for fetching and caching service type metadata
 * with support for group-based filtering and parallel execution
 */
export {
  default as useServiceTypes,
  useServiceTypes,
  invalidateServiceTypesCache,
  prefetchServiceTypes,
} from './useServiceTypes';

/**
 * Service types hook types and interfaces
 */
export type {
  UseServiceTypesParams,
  UseServiceTypesReturn,
} from './useServiceTypes';

// =============================================================================
// SYSTEM EVENTS HOOK EXPORTS
// =============================================================================

/**
 * System events hook for fetching system event identifiers
 * with intelligent caching and background revalidation
 */
export {
  default as useSystemEvents,
  useSystemEvents,
  systemEventsKeys,
} from './useSystemEvents';

/**
 * System events hook types and interfaces
 */
export type {
  SystemEventsQueryOptions,
  SystemEventsRequestParams,
  GenericListResponse,
} from './useSystemEvents';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * All hook functions for destructured imports
 * Enables: import { useServices, useServiceTypes, useSystemEvents } from './hooks'
 */
export {
  useServices,
  useServiceTypes, 
  useSystemEvents,
} from './useServices';
export { useServiceTypes } from './useServiceTypes';
export { useSystemEvents } from './useSystemEvents';

/**
 * All utility functions for cache management and optimization
 */
export {
  useServicesInvalidation,
  useServicesCache,
  invalidateServiceTypesCache,
  prefetchServiceTypes,
} from './useServices';
export { 
  invalidateServiceTypesCache,
  prefetchServiceTypes,
} from './useServiceTypes';

/**
 * All query key factories for external cache management
 */
export {
  servicesQueryKeys,
} from './useServices';
export {
  systemEventsKeys,
} from './useSystemEvents';

// =============================================================================
// UNIFIED TYPE EXPORTS
// =============================================================================

/**
 * Comprehensive type definitions for all database service hooks
 * Supports tree-shaking while providing complete type coverage
 */
export type {
  // Services hook types
  UseServicesOptions,
  ServicesQueryResult,
  UseServicesReturn,
  
  // Service types hook types  
  UseServiceTypesParams,
  UseServiceTypesReturn,
  
  // System events hook types
  SystemEventsQueryOptions,
  SystemEventsRequestParams,
  GenericListResponse,
} from './useServices';

export type {
  UseServiceTypesParams,
  UseServiceTypesReturn,
} from './useServiceTypes';

export type {
  SystemEventsQueryOptions,
  SystemEventsRequestParams, 
  GenericListResponse,
} from './useSystemEvents';

// =============================================================================
// DEFAULT EXPORTS AGGREGATION
// =============================================================================

/**
 * Aggregated hooks object for namespace-style imports
 * Enables: import DatabaseServiceHooks from './hooks'
 * Usage: DatabaseServiceHooks.useServices(), DatabaseServiceHooks.useServiceTypes()
 */
const DatabaseServiceHooks = {
  useServices,
  useServiceTypes,
  useSystemEvents,
  useServicesInvalidation,
  useServicesCache,
  invalidateServiceTypesCache,
  prefetchServiceTypes,
  servicesQueryKeys,
  systemEventsKeys,
} as const;

export default DatabaseServiceHooks;

// =============================================================================
// TREE-SHAKING OPTIMIZATION METADATA
// =============================================================================

/**
 * Export metadata for build tools to optimize tree-shaking
 * Indicates that all exports are side-effect free and can be safely eliminated
 * when not imported, supporting Turbopack optimization requirements
 */
export const __esModule = true;

/**
 * Module metadata for development tooling
 */
export const moduleInfo = {
  name: 'database-service-hooks',
  version: '1.0.0',
  exports: [
    'useServices',
    'useServiceTypes', 
    'useSystemEvents',
    'useServicesInvalidation',
    'useServicesCache',
    'invalidateServiceTypesCache',
    'prefetchServiceTypes',
    'servicesQueryKeys',
    'systemEventsKeys',
  ],
  types: [
    'UseServicesOptions',
    'ServicesQueryResult',
    'UseServicesReturn',
    'UseServiceTypesParams', 
    'UseServiceTypesReturn',
    'SystemEventsQueryOptions',
    'SystemEventsRequestParams',
    'GenericListResponse',
  ],
} as const;