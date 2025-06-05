/**
 * LinkService Component System - Barrel Exports
 * 
 * Centralized export module for React 19 LinkService component system that provides
 * external storage service linking functionality with comprehensive TypeScript support,
 * React Hook Form integration, and WCAG 2.1 AA accessibility compliance.
 * 
 * This barrel export follows Next.js 15.1 app router patterns and modern React
 * component library conventions with optimized tree-shaking support for production builds.
 * 
 * @fileoverview Centralized exports for LinkService component and utilities
 * @version 1.0.0
 * @since React 19, Next.js 15.1, TypeScript 5.8+
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Main LinkService Component
 * 
 * React 19 component for linking external storage services (GitHub, file services)
 * with comprehensive form validation, caching, and accessibility features.
 * 
 * Features:
 * - React Hook Form integration with Zod validation
 * - SWR-powered data fetching and caching
 * - WCAG 2.1 AA accessibility compliance
 * - Headless UI components with Tailwind CSS styling
 * - Progressive enhancement and loading states
 * - Real-time form validation under 100ms
 * 
 * @example
 * ```tsx
 * import { LinkService } from '@/components/ui/link-service';
 * 
 * function MyComponent() {
 *   return (
 *     <LinkService
 *       storageServiceId="github-service"
 *       onContentChange={(content) => console.log(content)}
 *       onStoragePathChange={(path) => console.log(path)}
 *     />
 *   );
 * }
 * ```
 */
export { LinkService } from './link-service';

/**
 * Default export for LinkService component
 * Supports both named and default import patterns for compatibility
 */
export { default } from './link-service';

// =============================================================================
// TYPE DEFINITIONS EXPORTS
// =============================================================================

/**
 * Core Component Props and Interfaces
 * Essential type definitions for LinkService component usage
 */
export type {
  LinkServiceProps,
  LinkServiceFormData,
  LinkServiceFormContext,
  LinkServiceState,
  LinkServiceEventHandlers,
  LinkServiceTheme,
} from './link-service.types';

/**
 * Storage Service Type Definitions
 * Comprehensive interfaces for external storage service integration
 */
export type {
  StorageService,
  StorageServiceType,
  StorageServiceAPI,
  ServiceConnectionConfig,
  ServiceConfigSchema,
  ServiceLabelType,
} from './link-service.types';

/**
 * Form Management Types
 * React Hook Form and validation-related type definitions
 */
export type {
  LinkServiceFormSchema,
  LinkServiceFormFields,
  UseLinkServiceFormReturn,
} from './link-service.types';

/**
 * Cache and File Management Types
 * Types for content caching and file operations
 */
export type {
  CacheManagement,
  FileContentManagement,
  CacheOperations,
  FileOperations,
} from './link-service.types';

/**
 * Hook Return Types
 * Type definitions for custom React hooks used by LinkService
 */
export type {
  UseStorageServicesReturn,
} from './link-service.types';

/**
 * Utility and Helper Types
 * Additional type utilities for advanced usage patterns
 */
export type {
  StorageServiceTypes,
  ServiceConfigurationKeys,
} from './link-service.types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Type Guard Functions
 * Runtime type checking utilities for storage service and form data validation
 * 
 * @example
 * ```tsx
 * import { isStorageService, isLinkServiceFormData } from '@/components/ui/link-service';
 * 
 * if (isStorageService(data)) {
 *   // TypeScript knows data is StorageService
 *   console.log(data.name);
 * }
 * ```
 */
export {
  isStorageService,
  isLinkServiceFormData,
} from './link-service.types';

// =============================================================================
// CONFIGURATION CONSTANTS EXPORTS
// =============================================================================

/**
 * Default Configuration Constants
 * Production-ready default values for LinkService configuration
 * 
 * @example
 * ```tsx
 * import { LINK_SERVICE_DEFAULTS } from '@/components/ui/link-service';
 * 
 * const cacheConfig = {
 *   ttl: LINK_SERVICE_DEFAULTS.CACHE_TTL,
 *   timeout: LINK_SERVICE_DEFAULTS.REQUEST_TIMEOUT,
 * };
 * ```
 */
export {
  LINK_SERVICE_DEFAULTS,
} from './link-service.types';

/**
 * Service Type Configuration Mapping
 * Predefined configurations for different storage service types
 * 
 * @example
 * ```tsx
 * import { SERVICE_TYPE_CONFIG } from '@/components/ui/link-service';
 * 
 * const githubConfig = SERVICE_TYPE_CONFIG.github;
 * if (githubConfig.supportsRepository) {
 *   // Enable repository-specific features
 * }
 * ```
 */
export {
  SERVICE_TYPE_CONFIG,
} from './link-service.types';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Convenient re-exports of commonly used types
 * Grouped exports for simplified imports in consumer components
 */

/**
 * Form-related exports
 * All types and utilities needed for form integration
 */
export type {
  LinkServiceProps as Props,
  LinkServiceFormData as FormData,
  LinkServiceFormContext as FormContext,
  LinkServiceEventHandlers as EventHandlers,
} from './link-service.types';

/**
 * Service-related exports  
 * All types needed for storage service integration
 */
export type {
  StorageService as Service,
  StorageServiceType as ServiceType,
  ServiceConnectionConfig as ConnectionConfig,
} from './link-service.types';

/**
 * State management exports
 * Types for component state and operations
 */
export type {
  LinkServiceState as State,
  CacheManagement as Cache,
  FileContentManagement as FileContent,
} from './link-service.types';

// =============================================================================
// TREE-SHAKING OPTIMIZATION
// =============================================================================

/**
 * Named export collections for optimized tree-shaking
 * Organized by functional area to enable selective imports
 */

/**
 * Component exports - Main component and related UI elements
 */
export const Component = {
  LinkService,
} as const;

/**
 * Types exports - Core type definitions organized by category
 */
export const Types = {
  // Component props and state
  Props: {} as LinkServiceProps,
  FormData: {} as LinkServiceFormData,
  State: {} as LinkServiceState,
  
  // Service definitions
  Service: {} as StorageService,
  ServiceType: {} as StorageServiceType,
  
  // Configuration types
  ConnectionConfig: {} as ServiceConnectionConfig,
  CacheConfig: {} as CacheManagement,
  
  // Hook return types
  FormReturn: {} as UseLinkServiceFormReturn,
  ServicesReturn: {} as UseStorageServicesReturn,
} as const;

/**
 * Utilities exports - Helper functions and type guards
 */
export const Utils = {
  isStorageService,
  isLinkServiceFormData,
} as const;

/**
 * Constants exports - Configuration defaults and mappings
 */
export const Constants = {
  DEFAULTS: LINK_SERVICE_DEFAULTS,
  SERVICE_TYPES: SERVICE_TYPE_CONFIG,
} as const;

// =============================================================================
// METADATA AND DOCUMENTATION
// =============================================================================

/**
 * Component metadata for development tools and documentation
 */
export const LinkServiceMeta = {
  displayName: 'LinkService',
  version: '1.0.0',
  description: 'External storage service linking component with form validation and caching',
  category: 'Form',
  subcategory: 'Storage Integration',
  tags: ['storage', 'github', 'form', 'validation', 'accessibility'],
  status: 'stable',
  framework: 'React 19',
  dependencies: {
    'react-hook-form': '^7.52.0',
    'zod': '^3.22.0',
    'swr': '^2.2.0',
    '@headlessui/react': '^2.0.0',
  },
  accessibility: {
    wcag: '2.1 AA',
    screenReader: true,
    keyboard: true,
    colorContrast: true,
    focusManagement: true,
  },
  testing: {
    unit: true,
    integration: true,
    accessibility: true,
    performance: true,
  },
} as const;

/**
 * Export metadata for development tools
 */
export const meta = LinkServiceMeta;