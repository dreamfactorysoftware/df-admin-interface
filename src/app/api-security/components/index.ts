/**
 * API Security Components Export Barrel
 * 
 * Centralized export point for all API security-related React components.
 * Enables clean importing patterns and tree-shaking optimization for Next.js 15.1+.
 * 
 * @fileoverview Export barrel following React 19.0.0 component organization standards
 * @version 1.0.0
 */

// Navigation Components
export { default as SecurityNav } from './security-nav';
export type { SecurityNavProps } from './security-nav';

// Overview and Dashboard Components
export { default as SecurityOverview } from './security-overview';
export type { SecurityOverviewProps } from './security-overview';

// Statistics and Metrics Components
export { default as SecurityStats } from './security-stats';
export type { SecurityStatsProps } from './security-stats';

// Data Display Components
export { default as SecurityTable } from './security-table';
export type { SecurityTableProps } from './security-table';

// Form Components
export { default as SecurityForm } from './security-form';
export type { SecurityFormProps } from './security-form';

// Specialized Form Components
export { default as AccessControlForm } from './access-control-form';
export type { AccessControlFormProps } from './access-control-form';

/**
 * Re-export all component types for enhanced TypeScript 5.8+ support
 * Enables type inference and intellisense across the application
 */
export type {
  // Navigation types
  SecurityNavProps,
  
  // Overview types
  SecurityOverviewProps,
  
  // Statistics types
  SecurityStatsProps,
  
  // Table types
  SecurityTableProps,
  
  // Form types
  SecurityFormProps,
  AccessControlFormProps,
} from './types';

/**
 * Convenience exports for common component groups
 * Enables grouped imports for related functionality
 */
export const SecurityComponents = {
  Nav: SecurityNav,
  Overview: SecurityOverview,
  Stats: SecurityStats,
  Table: SecurityTable,
  Form: SecurityForm,
  AccessControlForm: AccessControlForm,
} as const;

/**
 * Export barrel provides:
 * - Named exports for tree-shaking optimization (Next.js 15.1+)
 * - TypeScript 5.8+ enhanced type inference
 * - Consistent component importing patterns
 * - Centralized access point for api-security module
 * 
 * Usage examples:
 * 
 * // Individual component imports
 * import { SecurityNav, SecurityOverview } from '@/app/api-security/components';
 * 
 * // Type imports
 * import type { SecurityNavProps } from '@/app/api-security/components';
 * 
 * // Grouped imports
 * import { SecurityComponents } from '@/app/api-security/components';
 * const { Nav, Overview } = SecurityComponents;
 */