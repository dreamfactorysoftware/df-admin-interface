/**
 * Database Service Hooks - Barrel Export Module
 * 
 * Provides centralized exports for all custom React hooks that replace Angular resolvers
 * in the database service management workflow. This module enables clean imports throughout
 * the application and supports tree-shaking optimization with Turbopack.
 * 
 * Architecture Alignment:
 * - Section 3.2.2: TanStack React Query for server state management
 * - Section 3.2.5: Turbopack build system optimization
 * - Section 3.2.6: Component composition patterns
 * - Section 5.2: Database Service Management Component details
 * 
 * Framework Compliance:
 * - React 19 with TypeScript 5.8+ module system
 * - Next.js 15.1+ import/export patterns
 * - Tree-shaking optimization for production builds
 * 
 * @fileoverview Centralized hook exports for database service functionality
 * @author DreamFactory Platform Team
 * @version 1.0.0
 */

// Core database service hooks
export { default as useServices } from './useServices';
export { default as useServiceTypes } from './useServiceTypes';
export { default as useSystemEvents } from './useSystemEvents';

// Export hook types for type safety and intellisense
export type {
  UseServicesOptions,
  UseServicesResult,
  ServicesQueryData,
} from './useServices';

export type {
  UseServiceTypesOptions,
  UseServiceTypesResult,
  ServiceTypesQueryData,
} from './useServiceTypes';

export type {
  UseSystemEventsOptions,
  UseSystemEventsResult,
  SystemEventsQueryData,
} from './useSystemEvents';

/**
 * Re-export common patterns for hook usage
 * 
 * These patterns follow React Query best practices and provide
 * consistent interfaces across the database service module.
 */
export type {
  QueryOptions,
  MutationOptions,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';

/**
 * Barrel export summary:
 * 
 * This module serves as the single entry point for database service hooks,
 * providing:
 * 
 * 1. **Clean Import Patterns**: 
 *    ```typescript
 *    import { useServices, useServiceTypes } from '@/components/database-service/hooks';
 *    ```
 * 
 * 2. **Tree-shaking Optimization**:
 *    Only imported hooks are included in the final bundle through Turbopack optimization
 * 
 * 3. **Type Safety**:
 *    All hook options and return types are exported for comprehensive TypeScript support
 * 
 * 4. **Development Experience**:
 *    Centralized exports improve IDE autocomplete and reduce import complexity
 * 
 * 5. **Framework Integration**:
 *    Compatible with Next.js 15.1+ and React 19 module resolution patterns
 */