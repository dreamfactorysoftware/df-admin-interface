/**
 * @fileoverview Scheduler Hooks Barrel Export
 * @description Centralized export module for all scheduler-related React hooks
 * 
 * This barrel export file provides a single entry point for importing scheduler hooks
 * throughout the application, following TypeScript module organization best practices
 * per Section 3.1. Enables tree-shaking optimization and consistent import patterns
 * across React components per React/Next.js Integration Requirements.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 * 
 * @example
 * ```typescript
 * // Import individual hooks
 * import { useSchedulerTasks, useCreateSchedulerTask } from './hooks';
 * 
 * // Import with type definitions
 * import { 
 *   useSchedulerTask, 
 *   type SchedulerTaskError 
 * } from './hooks';
 * 
 * // Import utility functions
 * import { 
 *   getSchedulerTaskErrorMessage,
 *   ComponentAccessListError 
 * } from './hooks';
 * ```
 */

// =============================================================================
// SCHEDULER TASK MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook for fetching and managing scheduler task lists
 * Provides pagination, filtering, sorting, and real-time synchronization
 */
export {
  useSchedulerTasks,
  useInvalidateSchedulerTasks,
  usePrefetchSchedulerTasks
} from './useSchedulerTasks';

/**
 * Hook for fetching individual scheduler task data
 * Enables conditional fetching with intelligent caching and error handling
 */
export {
  useSchedulerTask,
  isSchedulerTaskError,
  getSchedulerTaskErrorMessage
} from './useSchedulerTask';

// =============================================================================
// SCHEDULER TASK MUTATION HOOKS
// =============================================================================

/**
 * Hook for creating new scheduler tasks
 * Implements optimistic updates with automatic rollback on failure
 */
export { useCreateSchedulerTask } from './useCreateSchedulerTask';

/**
 * Hook for updating existing scheduler tasks
 * Provides optimistic updates and comprehensive validation error handling
 */
export { useUpdateSchedulerTask } from './useUpdateSchedulerTask';

/**
 * Hook for deleting scheduler tasks
 * Implements optimistic deletion with automatic rollback and confirmation workflows
 */
export { useDeleteSchedulerTask } from './useDeleteSchedulerTask';

// =============================================================================
// SUPPORTING DATA HOOKS
// =============================================================================

/**
 * Hook for fetching available services for scheduler configuration
 * Provides filtered service options optimized for dropdown components
 */
export { useServices } from './useServices';

/**
 * Hook for component access list fetching based on selected service
 * Enables conditional fetching with service-dependent component options
 */
export { 
  useComponentAccessList,
  ComponentAccessListError 
} from './useComponentAccessList';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

// Scheduler task list hook types
export type {
  SchedulerTaskQueryParams,
  UseSchedulerTasksOptions,
  UseSchedulerTasksResult
} from './useSchedulerTasks';

// Individual scheduler task hook types
export type {
  SchedulerTaskError,
  UseSchedulerTaskOptions
} from './useSchedulerTask';

// Create scheduler task hook types
export type {
  CreateSchedulePayload,
  CreateSchedulerTaskVariables
} from './useCreateSchedulerTask';

// Update scheduler task hook types
export type {
  UpdateSchedulePayload,
  UpdateSchedulerTaskVariables
} from './useUpdateSchedulerTask';

// Services hook types
export type {
  ServiceDropdownOption,
  ServicesFilter,
  UseServicesOptions,
  UseServicesReturn
} from './useServices';

// Component access list hook types
export type {
  UseComponentAccessListParams,
  UseComponentAccessListReturn
} from './useComponentAccessList';