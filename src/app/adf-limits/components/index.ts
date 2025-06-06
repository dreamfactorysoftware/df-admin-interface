/**
 * ADF Limits Components Export Barrel
 * 
 * Centralized export module for all React components and types related to API rate 
 * limit management in the DreamFactory admin interface. Provides clean import patterns
 * and supports Next.js 15.1+ tree-shaking optimization for enhanced build performance.
 * 
 * This barrel export enables consistent component importing throughout the React
 * application while maintaining TypeScript 5.8+ type inference and ES6 module standards.
 * 
 * @fileoverview Export barrel for adf-limits React components and types
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

// ============================================================================
// Component Exports
// ============================================================================

/**
 * Main form component for creating and editing API rate limits
 * Supports React Hook Form with Zod validation, dynamic field rendering,
 * and comprehensive accessibility features
 */
export { LimitForm } from './limit-form';

/**
 * Table component for displaying and managing API rate limits
 * Features Headless UI table with sorting, filtering, pagination,
 * and TanStack Virtual for large dataset optimization
 */
export { LimitsTable } from './limits-table';

/**
 * Paywall component for premium feature access control
 * Implements conditional rendering based on subscription status
 * with Next.js middleware integration for seamless access control
 */
export { LimitPaywall } from './limit-paywall';

// ============================================================================
// Component Props Type Exports
// ============================================================================

/**
 * Re-export component props interfaces for external usage
 * Enables proper TypeScript inference when using components
 */
export type {
  LimitFormProps,
  LimitListTableProps,
  LimitDetailProps,
  LimitWizardProps
} from '../types';

// ============================================================================
// Core Data Type Exports
// ============================================================================

/**
 * Core limit data structures for component integration
 * Essential types for working with limit management components
 */
export type {
  LimitTableRowData,
  LimitConfiguration,
  LimitUsageStats,
  LimitType,
  LimitCounterType,
  LimitPeriodUnit
} from '../types';

// ============================================================================
// Form State and Hook Type Exports
// ============================================================================

/**
 * Form-related types for React Hook Form integration
 * Supports advanced form state management and validation
 */
export type {
  LimitFormState,
  LimitFormInstance,
  LimitFormData,
  UseLimitFormReturn,
  UseLimitsReturn
} from '../types';

// ============================================================================
// React Query Integration Type Exports
// ============================================================================

/**
 * React Query types for data fetching and mutation operations
 * Optimized for intelligent caching and real-time synchronization
 */
export type {
  LimitSwrOptions,
  LimitMutationOptions,
  CreateLimitMutationVariables,
  UpdateLimitMutationVariables,
  DeleteLimitMutationVariables,
  BulkLimitMutationVariables,
  LimitListQuery,
  LimitDetailQuery,
  LimitUsageQuery,
  CreateLimitMutation,
  UpdateLimitMutation,
  DeleteLimitMutation,
  BulkLimitMutation
} from '../types';

// ============================================================================
// Validation Schema Exports
// ============================================================================

/**
 * Zod validation schemas for runtime type checking
 * Provides comprehensive form validation and data validation
 */
export {
  LimitTypeValidation,
  LimitCounterValidation,
  PeriodUnitValidation,
  LimitFormValidation,
  LimitDataValidation,
  UsageStatsValidation
} from '../types';

// ============================================================================
// Utility Function Exports
// ============================================================================

/**
 * Utility functions for limit data manipulation and validation
 * Type-safe helper functions for common limit operations
 */
export {
  isUserLimit,
  isServiceLimit,
  isRoleLimit,
  isGlobalLimit,
  extractRateValue,
  extractRatePeriod,
  formatRateString
} from '../types';

// ============================================================================
// Type Aliases for Convenience
// ============================================================================

/**
 * Convenient type aliases for common use cases
 * Simplifies import statements for frequently used types
 */
export type {
  LimitsList,
  LimitsListResponse,
  LimitResponse,
  LimitError,
  LimitTableData
} from '../types';

// ============================================================================
// Default Export for Component Bundle
// ============================================================================

/**
 * Default export containing all components for bulk import scenarios
 * Useful for dynamic imports and code splitting optimization
 */
export default {
  LimitForm: () => import('./limit-form').then(m => m.LimitForm),
  LimitsTable: () => import('./limits-table').then(m => m.LimitsTable),
  LimitPaywall: () => import('./limit-paywall').then(m => m.LimitPaywall)
} as const;