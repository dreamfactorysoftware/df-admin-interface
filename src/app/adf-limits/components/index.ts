/**
 * Export Barrel for ADF Limits React Components
 * 
 * Provides centralized imports for limit-form, limits-table, and limit-paywall components
 * with comprehensive type re-exports and enhanced tree-shaking optimization for Next.js 15.1+.
 * 
 * Enables clean component importing patterns and maintains consistent module structure
 * for the React 19.0.0/Next.js application architecture with TypeScript 5.8+ support.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration  
 * @since 2024-12-19
 */

// =============================================================================
// COMPONENT EXPORTS - React 19.0.0 Standards
// =============================================================================

/**
 * LimitForm - React Hook Form component for creating and editing API rate limits
 * 
 * Implements React Hook Form with Zod schema validation, real-time validation under 100ms,
 * and Headless UI components with Tailwind CSS styling per React/Next.js Integration Requirements.
 */
export { default as LimitForm } from './limit-form'
export type { LimitFormProps } from './limit-form'

/**
 * LimitsTable - React table component for displaying and managing API rate limits
 * 
 * Implements Headless UI table with TanStack React Query for intelligent caching,
 * cache hit responses under 50ms, and comprehensive CRUD operations with accessibility features.
 */
export { default as LimitsTable } from './limits-table'
export type { LimitsTableProps } from './limits-table'

/**
 * LimitPaywall - React paywall component for premium feature access control
 * 
 * Implements conditional rendering based on subscription status with Next.js middleware
 * authentication patterns and Zustand state management for seamless access control.
 */
export { default as LimitPaywall } from './limit-paywall'
export type { LimitPaywallProps } from './limit-paywall'

// =============================================================================
// TYPE RE-EXPORTS - TypeScript 5.8+ Enhanced Type Inference
// =============================================================================

/**
 * Core data types for rate limit management
 * Exported for enhanced type inference and tree-shaking optimization
 */
export type {
  // Core data interfaces
  LimitTableRowData,
  LimitTableRowData as Limit,
  LimitMetadata,
  AlertConfiguration,
  
  // Enum types for limit configuration
  LimitType,
  LimitCounter,
  
  // Form data interfaces for React Hook Form integration
  CreateLimitFormData,
  CreateLimitFormData as CreateLimitForm,
  EditLimitFormData,
  EditLimitFormData as EditLimitForm,
  
  // Form state management types
  CreateLimitFormState,
  CreateLimitFormState as CreateFormState,
  EditLimitFormState,
  EditLimitFormState as EditFormState,
  ValidationPerformanceMetrics,
  
  // React Query types for server state management
  LimitsListQueryResult,
  LimitsListQueryResult as LimitsListQuery,
  LimitDetailQueryResult,
  LimitDetailQueryResult as LimitDetailQuery,
  CreateLimitMutationResult,
  CreateLimitMutationResult as CreateLimitMutation,
  UpdateLimitMutationResult,
  UpdateLimitMutationResult as UpdateLimitMutation,
  DeleteLimitMutationResult,
  DeleteLimitMutationResult as DeleteLimitMutation,
  ToggleLimitMutationResult,
  ToggleLimitMutationResult as ToggleLimitMutation,
  
  // Query and mutation function types
  LimitsListQueryFn,
  LimitDetailQueryFn,
  CreateLimitMutationFn,
  UpdateLimitMutationFn,
  DeleteLimitMutationFn,
  
  // React Query configuration types
  LimitsListQueryConfig,
  LimitDetailQueryConfig,
  CreateLimitMutationConfig,
  UpdateLimitMutationConfig,
  
  // Component prop types for external usage
  LimitsListProps,
  LimitFormProps,
  LimitDetailProps,
  
  // Hook return types
  UseLimitsListReturn,
  UseLimitsListReturn as LimitsListHook,
  UseLimitFormReturn,
  UseLimitFormReturn as LimitFormHook,
  
  // Table and UI configuration types
  LimitsTableColumn,
  BulkAction,
  LimitDetailSection,
  QueryPerformanceMetrics,
  
  // Cache invalidation types
  LimitsCacheInvalidationFilters
} from '../types'

// =============================================================================
// ENUM RE-EXPORTS - Direct enum exports for runtime usage
// =============================================================================

/**
 * LimitType enum - Rate limit types supported by DreamFactory
 * Direct export for runtime usage and type guards
 */
export { LimitType } from '../types'

/**
 * LimitCounter enum - Rate limit counter types for tracking consumption
 * Direct export for runtime usage and form options
 */
export { LimitCounter } from '../types'

// =============================================================================
// VALIDATION SCHEMA RE-EXPORTS - Zod schemas for React Hook Form
// =============================================================================

/**
 * Zod validation schemas for React Hook Form integration
 * Real-time validation under 100ms per React/Next.js Integration Requirements
 */
export {
  LimitTypeSchema,
  LimitCounterSchema,
  LimitTableRowDataSchema,
  CreateLimitFormSchema,
  EditLimitFormSchema,
  LimitMetadataSchema
} from '../types'

// =============================================================================
// QUERY KEY UTILITIES - React Query cache management
// =============================================================================

/**
 * Query key patterns for React Query cache management
 * Enables consistent cache key generation and invalidation for optimal performance
 */
export { LIMITS_QUERY_KEYS } from '../types'

// =============================================================================
// COMPONENT COLLECTION EXPORTS - Batch exports for convenience
// =============================================================================

/**
 * All limit management components as a collection
 * Useful for dynamic imports and feature-based routing
 */
export const LimitComponents = {
  LimitForm: () => import('./limit-form'),
  LimitsTable: () => import('./limits-table'),
  LimitPaywall: () => import('./limit-paywall')
} as const

/**
 * Component metadata for dynamic rendering and feature detection
 */
export const ComponentMetadata = {
  LimitForm: {
    name: 'LimitForm',
    description: 'React form component for creating and editing API rate limits',
    version: '1.0.0',
    dependencies: ['react-hook-form', 'zod', '@headlessui/react'],
    features: ['real-time-validation', 'form-persistence', 'accessibility']
  },
  LimitsTable: {
    name: 'LimitsTable', 
    description: 'React table component for displaying and managing API rate limits',
    version: '1.0.0',
    dependencies: ['@tanstack/react-query', '@headlessui/react', '@tanstack/react-virtual'],
    features: ['intelligent-caching', 'virtualization', 'sorting', 'filtering', 'pagination']
  },
  LimitPaywall: {
    name: 'LimitPaywall',
    description: 'React paywall component for premium feature access control', 
    version: '1.0.0',
    dependencies: ['zustand', '@headlessui/react'],
    features: ['conditional-rendering', 'subscription-integration', 'middleware-auth']
  }
} as const

// =============================================================================
// MODULE INFORMATION - Enhanced debugging and development support
// =============================================================================

/**
 * Module information for debugging and development tooling
 * Supports Next.js 15.1+ dev tools integration and build optimization
 */
export const ModuleInfo = {
  name: '@/app/adf-limits/components',
  version: '1.0.0',
  description: 'React components for API rate limit management in DreamFactory Admin Interface',
  framework: 'React 19.0.0',
  platform: 'Next.js 15.1+',
  typescript: '5.8+',
  styling: 'Tailwind CSS 4.1+',
  stateManagement: ['@tanstack/react-query', 'zustand', 'react-hook-form'],
  testing: ['vitest', '@testing-library/react', 'msw'],
  accessibility: 'WCAG 2.1 AA',
  performance: {
    validation: 'under 100ms',
    cacheHits: 'under 50ms',
    treeshaking: 'optimized',
    bundleSize: 'minimized'
  },
  exports: {
    components: ['LimitForm', 'LimitsTable', 'LimitPaywall'],
    types: 'comprehensive',
    schemas: 'zod-validated',
    utils: 'query-keys'
  }
} as const

/**
 * Type-only export for the module information
 * Enables TypeScript consumers to access metadata without runtime cost
 */
export type LimitsModuleInfo = typeof ModuleInfo

// =============================================================================
// FEATURE FLAGS - Runtime feature detection
// =============================================================================

/**
 * Feature flags for conditional functionality and A/B testing
 * Supports gradual rollout of new features and performance optimizations
 */
export const FeatureFlags = {
  /** Enable experimental virtual scrolling for large datasets */
  ENABLE_VIRTUALIZATION: true,
  /** Enable optimistic updates for mutations */
  ENABLE_OPTIMISTIC_UPDATES: true,
  /** Enable real-time validation performance monitoring */
  ENABLE_VALIDATION_METRICS: true,
  /** Enable advanced filtering and search capabilities */
  ENABLE_ADVANCED_FILTERING: true,
  /** Enable accessibility enhancements beyond WCAG 2.1 AA */
  ENABLE_ENHANCED_A11Y: true,
  /** Enable dark mode theme support */
  ENABLE_DARK_MODE: true,
  /** Enable offline capability with cache-first strategies */
  ENABLE_OFFLINE_MODE: false,
  /** Enable experimental query prefetching */
  ENABLE_QUERY_PREFETCHING: true
} as const

/**
 * Type-only export for feature flags
 * Enables compile-time feature detection and tree-shaking
 */
export type LimitsFeatureFlags = typeof FeatureFlags

// =============================================================================
// DEFAULT EXPORTS COLLECTION - Legacy compatibility
// =============================================================================

/**
 * Default export object for legacy import patterns
 * Maintains backward compatibility while encouraging named imports
 * 
 * @deprecated Use named imports for better tree-shaking: import { LimitForm } from '@/app/adf-limits/components'
 */
const LimitsComponentsDefault = {
  LimitForm: () => import('./limit-form'),
  LimitsTable: () => import('./limits-table'), 
  LimitPaywall: () => import('./limit-paywall'),
  
  // Type exports (runtime accessible)
  LimitType,
  LimitCounter,
  LIMITS_QUERY_KEYS,
  
  // Metadata exports
  ModuleInfo,
  FeatureFlags,
  ComponentMetadata
} as const

export default LimitsComponentsDefault