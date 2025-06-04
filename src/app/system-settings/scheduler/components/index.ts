/**
 * @fileoverview Barrel export file for scheduler component modules
 * 
 * This file provides centralized imports for all scheduler component modules,
 * enabling clean imports throughout the application while supporting tree-shaking
 * for optimal bundle size. All components follow React 19 patterns with TypeScript
 * integration and Tailwind CSS styling.
 * 
 * @example
 * ```typescript
 * import { SchedulerTable, SchedulerForm } from '@/app/system-settings/scheduler/components'
 * ```
 */

/**
 * Confirmation dialog component that handles scheduler task deletion with user confirmation.
 * Implements Headless UI Dialog for accessibility, shows task details in confirmation message,
 * and provides cancel/confirm actions with loading states during deletion operations.
 * 
 * @component
 * @example
 * ```tsx
 * <SchedulerDeleteDialog
 *   isOpen={showDialog}
 *   task={selectedTask}
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export { default as SchedulerDeleteDialog } from './SchedulerDeleteDialog'
export type { SchedulerDeleteDialogProps } from './SchedulerDeleteDialog'

/**
 * React form component for creating and editing scheduler tasks.
 * Implements React Hook Form with Zod validation, tabbed interface with Basic and Log tabs,
 * and comprehensive form fields for task configuration including service selection,
 * HTTP method, frequency, and JSON payload editing with ACE editor integration.
 * 
 * @component
 * @example
 * ```tsx
 * <SchedulerForm
 *   mode="create"
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   initialData={defaultValues}
 * />
 * ```
 */
export { default as SchedulerForm } from './SchedulerForm'
export type { SchedulerFormProps } from './SchedulerForm'

/**
 * React component that provides an intuitive interface for selecting scheduler task execution frequency.
 * Implements dropdown selection for common frequencies (hourly, daily, weekly, monthly)
 * and custom cron expression input with validation and preview of next execution times.
 * 
 * @component
 * @example
 * ```tsx
 * <SchedulerFrequencyPicker
 *   value={frequency}
 *   onChange={setFrequency}
 *   disabled={false}
 *   showPreview={true}
 * />
 * ```
 */
export { default as SchedulerFrequencyPicker } from './SchedulerFrequencyPicker'
export type { SchedulerFrequencyPickerProps } from './SchedulerFrequencyPicker'

/**
 * React component that provides service and component selection for scheduler tasks.
 * Implements cascading dropdowns where component options update based on selected service,
 * integrates with React Query for service data fetching, and includes search functionality
 * for large service lists with accessibility support.
 * 
 * @component
 * @example
 * ```tsx
 * <SchedulerServiceSelector
 *   serviceValue={selectedService}
 *   componentValue={selectedComponent}
 *   onServiceChange={setSelectedService}
 *   onComponentChange={setSelectedComponent}
 * />
 * ```
 */
export { default as SchedulerServiceSelector } from './SchedulerServiceSelector'
export type { SchedulerServiceSelectorProps } from './SchedulerServiceSelector'

/**
 * React component that displays visual status indicators for scheduler tasks.
 * Shows active/inactive status with color-coded badges, provides tooltip information
 * for status details, and includes accessibility features for screen readers
 * with smooth transition animations.
 * 
 * @component
 * @example
 * ```tsx
 * <SchedulerStatusIndicator
 *   status="active"
 *   message="Task running normally"
 *   showTooltip={true}
 * />
 * ```
 */
export { default as SchedulerStatusIndicator } from './SchedulerStatusIndicator'
export type { SchedulerStatusIndicatorProps } from './SchedulerStatusIndicator'

/**
 * React table component that displays scheduler tasks in a sortable, filterable table.
 * Implements TanStack Virtual for performance with large datasets, integrates with
 * React Query for data fetching and caching, and provides CRUD action buttons
 * with accessibility compliance (WCAG 2.1 AA).
 * 
 * @component
 * @example
 * ```tsx
 * <SchedulerTable
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   onView={handleView}
 *   searchQuery={searchTerm}
 * />
 * ```
 */
export { default as SchedulerTable } from './SchedulerTable'
export type { SchedulerTableProps } from './SchedulerTable'

/**
 * Re-export all component types for external consumption
 * Enables importing component prop interfaces for type-safe component usage
 * 
 * @example
 * ```typescript
 * import type { SchedulerFormProps, SchedulerTableProps } from '@/app/system-settings/scheduler/components'
 * ```
 */
export type {
  SchedulerDeleteDialogProps,
  SchedulerFormProps,
  SchedulerFrequencyPickerProps,
  SchedulerServiceSelectorProps,
  SchedulerStatusIndicatorProps,
  SchedulerTableProps,
} from './types'

// Type-only exports for enhanced tree-shaking
// These exports ensure that TypeScript types don't affect runtime bundle size
export type * from './SchedulerDeleteDialog'
export type * from './SchedulerForm'
export type * from './SchedulerFrequencyPicker'
export type * from './SchedulerServiceSelector'
export type * from './SchedulerStatusIndicator'
export type * from './SchedulerTable'