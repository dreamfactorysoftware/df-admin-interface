/**
 * @fileoverview Scheduler Hooks Barrel Export
 * 
 * Centralized export file for all scheduler-related React hooks and their associated types.
 * Provides clean imports throughout the application while supporting tree-shaking for
 * optimal bundle size with Turbopack optimization.
 * 
 * This barrel export follows TypeScript module organization patterns per Section 3.1
 * and React/Next.js Integration Requirements for consistent naming and development experience.
 * 
 * @example
 * ```tsx
 * // Import specific hooks and types
 * import { 
 *   useSchedulerTasks, 
 *   useCreateSchedulerTask,
 *   type SchedulerTasksQueryParams 
 * } from '@/app/system-settings/scheduler/hooks';
 * 
 * // Import all hooks (not recommended due to bundle size)
 * import * as schedulerHooks from '@/app/system-settings/scheduler/hooks';
 * ```
 */

// Component Access List Hook Exports
export {
  default as useComponentAccessList,
  useComponentAccessList,
  hasComponentAccessData,
  getComponentOptions
} from './useComponentAccessList';

// Create Scheduler Task Hook Exports
export {
  useCreateSchedulerTask,
  shouldCreateTask,
  prepareCreatePayload,
  useCreateSchedulerTaskAdvanced,
  type CreateSchedulerTaskOptions
} from './useCreateSchedulerTask';

// Delete Scheduler Task Hook Exports  
export {
  useDeleteSchedulerTask,
  useDeleteSchedulerTaskWithConfirmation,
  useDeleteSchedulerTaskAdvanced,
  type DeleteSchedulerTaskOptions
} from './useDeleteSchedulerTask';

// Individual Scheduler Task Hook Exports
export {
  useSchedulerTask,
  type UseSchedulerTaskResult
} from './useSchedulerTask';

// Scheduler Tasks List Hook Exports
export {
  default as useSchedulerTasks,
  useSchedulerTasks,
  type SchedulerTasksQueryParams,
  type UseSchedulerTasksReturn
} from './useSchedulerTasks';

// Services Hook Exports
export {
  default as useServices,
  useServices,
  useServiceDropdownOptions,
  type Service,
  type GenericListResponse,
  type ServiceFilterOptions,
  type UseServicesOptions,
  type UseServicesResult,
  type ServiceDropdownOption
} from './useServices';

// Update Scheduler Task Hook Exports
export {
  useUpdateSchedulerTask,
  shouldUpdateTask,
  prepareUpdatePayload
} from './useUpdateSchedulerTask';

/**
 * React hook for fetching scheduler task list with intelligent caching and pagination.
 * 
 * Replaces Angular DfManageSchedulerTableComponent data fetching patterns with modern
 * server state management using TanStack React Query. Provides comprehensive pagination,
 * filtering, and background synchronization capabilities.
 * 
 * @category Data Fetching
 * @subcategory List Management
 */
// Re-export useSchedulerTasks with JSDoc for primary hook

/**
 * React hook for fetching individual scheduler task details.
 * 
 * Implements conditional fetching based on task ID with intelligent caching
 * and automatic background synchronization for real-time data updates.
 * 
 * @category Data Fetching  
 * @subcategory Detail Management
 */
// Re-export useSchedulerTask with JSDoc for primary hook

/**
 * React mutation hook for creating new scheduler tasks with optimistic updates.
 * 
 * Provides immediate UI feedback through optimistic cache updates and automatic
 * rollback on failure. Includes comprehensive validation error handling and
 * success notification integration.
 * 
 * @category Data Mutations
 * @subcategory Create Operations
 */
// Re-export useCreateSchedulerTask with JSDoc for primary hook

/**
 * React mutation hook for updating existing scheduler tasks with optimistic updates.
 * 
 * Implements intelligent cache management for both individual tasks and task lists
 * with automatic rollback capabilities and field-specific validation error handling.
 * 
 * @category Data Mutations
 * @subcategory Update Operations  
 */
// Re-export useUpdateSchedulerTask with JSDoc for primary hook

/**
 * React mutation hook for deleting scheduler tasks with optimistic updates.
 * 
 * Provides immediate UI feedback by optimistically removing tasks from cache
 * with automatic rollback on failure and comprehensive error handling.
 * 
 * @category Data Mutations
 * @subcategory Delete Operations
 */
// Re-export useDeleteSchedulerTask with JSDoc for primary hook

/**
 * React hook for fetching available services for scheduler configuration dropdowns.
 * 
 * Implements intelligent caching for relatively static service data with filtering
 * and search capabilities for large service lists.
 * 
 * @category Data Fetching
 * @subcategory Reference Data
 */
// Re-export useServices with JSDoc for primary hook

/**
 * React hook for fetching component access lists based on selected service.
 * 
 * Implements conditional fetching with intelligent caching and automatic refetching
 * when service selection changes. Provides comprehensive error handling for
 * authentication and authorization scenarios.
 * 
 * @category Data Fetching
 * @subcategory Dynamic Configuration
 */
// Re-export useComponentAccessList with JSDoc for primary hook