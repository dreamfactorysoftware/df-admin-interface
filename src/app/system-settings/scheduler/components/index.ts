/**
 * Scheduler Components Barrel Export
 * 
 * Centralized export file for all scheduler-related React components following
 * TypeScript module organization best practices. Provides clean imports and
 * supports tree-shaking for optimal bundle size.
 * 
 * @fileoverview System settings scheduler components module exports
 * @module SystemSettings/Scheduler/Components
 */

// =============================================================================
// COMPONENT EXPORTS (Alphabetical Order)
// =============================================================================

/**
 * SchedulerDeleteDialog - Confirmation dialog for scheduler task deletion
 * 
 * Features:
 * - Displays task details in confirmation message
 * - Implements Headless UI Dialog for accessibility (WCAG 2.1 AA)
 * - React Query integration for optimistic updates
 * - Proper loading states and error handling
 * - Auto-closes on successful deletion with notifications
 * 
 * @example
 * ```tsx
 * import { SchedulerDeleteDialog } from '@/app/system-settings/scheduler/components';
 * 
 * <SchedulerDeleteDialog
 *   isOpen={isDeleteModalOpen}
 *   onClose={() => setIsDeleteModalOpen(false)}
 *   task={selectedTask}
 * />
 * ```
 */
export { default as SchedulerDeleteDialog } from './SchedulerDeleteDialog';

/**
 * SchedulerForm - Comprehensive form component for scheduler task creation and editing
 * 
 * Features:
 * - React Hook Form with Zod validation
 * - Tabbed interface (Basic configuration, Execution logs)
 * - Service and component selection with dynamic loading
 * - HTTP method selection with conditional payload field
 * - Frequency configuration with validation
 * - Real-time JSON payload validation with ACE editor
 * - Next.js navigation integration
 * 
 * @example
 * ```tsx
 * import { SchedulerForm } from '@/app/system-settings/scheduler/components';
 * 
 * <SchedulerForm
 *   taskId={taskId}
 *   onSubmit={(data) => console.log('Form submitted:', data)}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export { default as SchedulerForm } from './SchedulerForm';

/**
 * SchedulerFrequencyPicker - Advanced frequency selection component with cron support
 * 
 * Features:
 * - Predefined frequency options (5min, 15min, 30min, hourly, daily, weekly, monthly)
 * - Custom cron expression input with real-time validation
 * - Next execution times preview (shows upcoming 3 executions)
 * - React Hook Form integration with proper error handling
 * - Searchable dropdown with Headless UI Combobox
 * - Accessibility compliant with ARIA labels and keyboard navigation
 * 
 * @example
 * ```tsx
 * import { SchedulerFrequencyPicker } from '@/app/system-settings/scheduler/components';
 * 
 * <SchedulerFrequencyPicker
 *   name="frequency"
 *   control={control}
 *   label="Execution Frequency"
 *   required={true}
 * />
 * ```
 */
export { default as SchedulerFrequencyPicker } from './SchedulerFrequencyPicker';

/**
 * SchedulerServiceSelector - Dual combobox component for service and component selection
 * 
 * Features:
 * - Two-stage selection: Service first, then available components
 * - React Query integration for service and component data
 * - Search/filter functionality for both services and components
 * - Loading states and error handling for API calls
 * - Access level badges and tooltips for component information
 * - Real-time validation with React Hook Form
 * - Automatic component reset when service changes
 * 
 * @example
 * ```tsx
 * import { SchedulerServiceSelector } from '@/app/system-settings/scheduler/components';
 * 
 * <SchedulerServiceSelector
 *   name="service-selector"
 *   control={control}
 *   serviceFieldName="serviceId"
 *   componentFieldName="component"
 *   required={true}
 * />
 * ```
 */
export { default as SchedulerServiceSelector } from './SchedulerServiceSelector';

/**
 * SchedulerStatusIndicator - Visual status indicator for scheduler task states
 * 
 * Features:
 * - Color-coded badges for active/inactive states
 * - Dynamic icons (CheckIcon for active, XMarkIcon for inactive)
 * - Configurable sizes (sm, md, lg) using class-variance-authority
 * - Tooltip support with status details
 * - Loading state with pulse animation
 * - Accessibility support with proper ARIA labels
 * - Dark mode compatible styling
 * 
 * @example
 * ```tsx
 * import { SchedulerStatusIndicator } from '@/app/system-settings/scheduler/components';
 * 
 * <SchedulerStatusIndicator
 *   status={task.isActive}
 *   size="md"
 *   showTooltip={true}
 *   statusMessage="Task will execute every 5 minutes"
 * />
 * ```
 */
export { default as SchedulerStatusIndicator } from './SchedulerStatusIndicator';

/**
 * SchedulerTable - High-performance data table for scheduler task management
 * 
 * Features:
 * - TanStack Table with virtual scrolling for 1000+ tasks
 * - TanStack Virtual for optimal performance with large datasets
 * - React Query for data fetching, caching, and real-time updates
 * - Global search across task names and descriptions
 * - Column sorting, filtering, and pagination
 * - Inline actions (view, edit, delete) with proper accessibility
 * - Responsive design with Tailwind CSS
 * - Confirmation dialogs for destructive actions
 * - Loading and error states with retry functionality
 * 
 * @example
 * ```tsx
 * import { SchedulerTable } from '@/app/system-settings/scheduler/components';
 * 
 * <SchedulerTable />
 * ```
 */
export { default as SchedulerTable } from './SchedulerTable';

// =============================================================================
// TYPE EXPORTS (Alphabetical Order)
// =============================================================================

/**
 * Type definitions for SchedulerDeleteDialog component props and related interfaces
 */
export type {
  SchedulerTask,
  SchedulerDeleteDialogProps
} from './SchedulerDeleteDialog';

/**
 * Type definitions for SchedulerFrequencyPicker component and utility functions
 */
export type {
  SchedulerFrequencyPickerProps
} from './SchedulerFrequencyPicker';

/**
 * Type definitions and enums for SchedulerStatusIndicator component
 */
export type {
  SchedulerStatusIndicatorProps
} from './SchedulerStatusIndicator';

// =============================================================================
// UTILITY EXPORTS (Alphabetical Order)
// =============================================================================

/**
 * Utility constants and functions from SchedulerFrequencyPicker for external use
 * 
 * - FREQUENCY_OPTIONS: Predefined frequency options array
 * - cronSchema: Zod schema for cron expression validation
 * - getNextExecutionTimes: Function to calculate next execution times from cron
 */
export {
  FREQUENCY_OPTIONS,
  cronSchema,
  getNextExecutionTimes
} from './SchedulerFrequencyPicker';

/**
 * Scheduler task status enum for type-safe status handling across components
 */
export {
  SchedulerTaskStatus
} from './SchedulerStatusIndicator';

// =============================================================================
// RE-EXPORTS FOR COMPONENT VARIANTS
// =============================================================================

/**
 * Named export of SchedulerStatusIndicator component for consistent importing
 * (in addition to default export for flexibility)
 */
export {
  SchedulerStatusIndicator
} from './SchedulerStatusIndicator';

/**
 * Named export of SchedulerServiceSelector component for consistent importing
 * (in addition to default export for flexibility)
 */
export {
  SchedulerServiceSelector
} from './SchedulerServiceSelector';