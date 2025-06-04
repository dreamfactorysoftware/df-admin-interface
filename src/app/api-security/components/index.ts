/**
 * API Security Components Export Barrel
 * 
 * Centralized export file for all API security-related React components.
 * Provides clean importing patterns following React 19.0.0 standards and 
 * enables Next.js 15.1+ tree-shaking optimization through named exports.
 * 
 * @module ApiSecurityComponents
 * @version 1.0.0
 * @since 2024
 */

// Navigation Components
export { default as SecurityNav } from './security-nav';
export type { SecurityNavProps } from './security-nav';

// Dashboard Overview Components
export { default as SecurityOverview } from './security-overview';
export type { SecurityOverviewProps } from './security-overview';

// Statistics Display Components
export { default as SecurityStats } from './security-stats';
export type { SecurityStatsProps, SecurityMetrics } from './security-stats';

// Table Components
export { default as SecurityTable } from './security-table';
export type { 
  SecurityTableProps,
  SecurityTableColumn,
  SecurityTableData,
  SecurityTableActions
} from './security-table';

// Form Components
export { default as SecurityForm } from './security-form';
export type { 
  SecurityFormProps,
  SecurityFormData,
  SecurityFormMode,
  SecurityFormValidation
} from './security-form';

// Access Control Form Components
export { default as AccessControlForm } from './access-control-form';
export type { 
  AccessControlFormProps,
  AccessControlData,
  PermissionRule,
  ServicePermission
} from './access-control-form';

/**
 * Re-export all components as a grouped object for destructured imports
 * Enables flexible import patterns while maintaining tree-shaking benefits
 * 
 * @example
 * ```typescript
 * import { Components } from './components';
 * const { SecurityNav, SecurityForm } = Components;
 * ```
 */
export const Components = {
  SecurityNav: require('./security-nav').default,
  SecurityOverview: require('./security-overview').default,
  SecurityStats: require('./security-stats').default,
  SecurityTable: require('./security-table').default,
  SecurityForm: require('./security-form').default,
  AccessControlForm: require('./access-control-form').default,
} as const;

/**
 * Type-only exports for enhanced TypeScript 5.8+ inference
 * Provides centralized access to all component prop types
 */
export type {
  SecurityNavProps,
  SecurityOverviewProps,
  SecurityStatsProps,
  SecurityTableProps,
  SecurityFormProps,
  AccessControlFormProps,
} from './types';

/**
 * Barrel export for shared types and interfaces
 * Enables consistent type imports across the api-security module
 */
export type {
  SecurityMetrics,
  SecurityTableColumn,
  SecurityTableData,
  SecurityTableActions,
  SecurityFormData,
  SecurityFormMode,
  SecurityFormValidation,
  AccessControlData,
  PermissionRule,
  ServicePermission,
} from './types';