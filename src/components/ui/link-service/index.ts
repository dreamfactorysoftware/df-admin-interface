/**
 * LinkService Component System - Barrel Exports
 * 
 * Centralized export file for external storage service linking functionality
 * that replaces Angular df-link-service module in the DreamFactory Admin Interface.
 * 
 * This barrel export provides comprehensive access to:
 * - LinkService component (main service linking interface)
 * - Storage service type definitions and interfaces
 * - Form validation schemas and utilities
 * - Service configuration types and metadata
 * - Connection testing and file operation utilities
 * 
 * @framework React 19 + Next.js 15.1
 * @styling Tailwind CSS 4.1+ with Headless UI components  
 * @forms React Hook Form 7.52+ with Zod schema validation
 * @accessibility WCAG 2.1 AA compliant storage service interface
 * @performance Real-time validation under 100ms per Section 0 requirements
 */

// =============================================================================
// PRIMARY COMPONENT EXPORTS
// =============================================================================

/**
 * Main LinkService component - Primary export for storage service linking
 * 
 * Replaces Angular df-link-service component with comprehensive React 19 implementation:
 * - External storage service connection (AWS S3, Azure Blob, Google Cloud, etc.)
 * - React Hook Form integration with real-time validation under 100ms
 * - Expandable service configuration with accessibility compliance
 * - Connection testing and file operation validation
 * - Service-specific configuration forms with dynamic field rendering
 * - Comprehensive error handling and loading states
 * - WCAG 2.1 AA accessibility with screen reader support
 * 
 * @example
 * ```tsx
 * import { LinkService } from '@/components/ui/link-service';
 * 
 * <LinkService
 *   onSubmit={handleServiceConfig}
 *   availableTypes={['aws_s3', 'azure_blob']}
 *   enableTesting={true}
 *   showAdvanced={false}
 * />
 * ```
 */
export { 
  LinkService as default,
  LinkService,
} from './link-service';

/**
 * LinkService component prop interfaces and configuration types
 * Provides comprehensive TypeScript support for all service linking scenarios
 */
export type { 
  LinkServiceProps,
  LinkServiceFormData,
  LinkServiceState,
  LinkServiceEventHandlers,
} from './link-service';

// =============================================================================
// STORAGE SERVICE TYPE DEFINITIONS
// =============================================================================

/**
 * Core storage service interfaces and type definitions
 * Supports all major cloud storage providers and traditional file systems
 */
export type {
  // Primary service types
  StorageService,
  StorageServiceType,
  StorageServiceCategory,
  StorageCapabilities,
  StorageAuthMethod,
  
  // Service configuration interfaces
  BaseStorageConfig,
  StorageServiceConfig,
  AWSS3Config,
  AzureBlobConfig,
  GoogleCloudConfig,
  LocalFileConfig,
  FtpConfig,
  CustomStorageConfig,
  
  // Dynamic configuration types
  ExtractServiceConfig,
} from './link-service.types';

// =============================================================================
// FORM AND VALIDATION TYPES
// =============================================================================

/**
 * Form data structures and validation schemas for service configuration
 * Integrates with React Hook Form and Zod for type-safe form handling
 */
export type {
  // Form data and validation
  LinkServiceValidationSchemas,
  DynamicLinkServiceSchema,
  
  // Component prop interfaces
  ServiceTypeSelectorProps,
  ServiceConfigFormProps,
  ConnectionTestProps,
  ServiceListProps,
  
  // Form field component interfaces
  FormFieldProps,
  FormFieldConfig,
  FormConfig,
  FormValidationResult,
  FormSubmissionResult,
  UseFormResult,
  FormState,
  FormActions,
  DynamicFormConfig,
} from './link-service.types';

// =============================================================================
// CONNECTION TESTING AND FILE OPERATIONS
// =============================================================================

/**
 * Connection testing interfaces and file operation utilities
 * Provides comprehensive service validation and file management capabilities
 */
export type {
  // Connection testing
  ConnectionTestResult,
  TestResult,
  UseStorageServicesReturn,
  
  // File operations
  FileOperations,
  FileUploadResult,
  FileDownloadResult,
  FileListResult,
  FileDeleteResult,
  FileMetadataResult,
  DirectoryCreateResult,
  FileCopyResult,
  FileMoveResult,
  
  // File and directory metadata
  FileMetadata,
  FileInfo,
  DirectoryInfo,
} from './link-service.types';

// =============================================================================
// SERVICE MANAGEMENT UTILITIES
// =============================================================================

/**
 * Storage service management utilities and configuration helpers
 * Provides service registry, cache management, and metadata utilities
 */
export type {
  // Service management
  ServiceMetadata,
  ServiceRegistry,
  ServiceCacheManager,
  CacheManagement,
  
  // API integration
  StorageServiceEndpoints,
  StorageServiceSwrConfig,
  StorageServiceMutations,
  
  // Component utilities
  ComponentVariant,
  ComponentSize,
  ComponentState,
  ResponsiveValue,
  ThemeConfig,
  LoadingState,
  ValidationState,
} from './link-service.types';

// =============================================================================
// FORM CONTROL AND VALIDATION UTILITIES
// =============================================================================

/**
 * Re-export commonly used form and validation utilities
 * Provides single import point for React Hook Form and Zod integration
 */
export type {
  // React Hook Form types
  UseFormReturn,
  FieldError,
  Control,
  FieldValues,
  Path,
  
  // Zod validation types
  z,
} from './link-service.types';

// =============================================================================
// CONSTANTS AND CONFIGURATION PRESETS
// =============================================================================

/**
 * Storage service constants and default configurations
 * Maintains consistency across storage service implementations
 */
export {
  // Default configurations
  LINK_SERVICE_DEFAULTS,
  SERVICE_TYPE_CONFIG,
  STORAGE_SERVICE_CONSTANTS,
} from './link-service.types';

// =============================================================================
// COMPONENT COLLECTIONS FOR BULK IMPORTS
// =============================================================================

/**
 * Complete LinkService component collection for bulk imports
 * Useful for component libraries and documentation systems
 * 
 * @example
 * ```tsx
 * import { LinkServiceComponents } from '@/components/ui/link-service';
 * 
 * // Access all components through the collection
 * const { LinkService } = LinkServiceComponents;
 * ```
 */
export const LinkServiceComponents = {
  LinkService,
} as const;

/**
 * LinkService utilities collection for bulk imports
 * Provides access to all service management and validation utilities
 * 
 * @example
 * ```tsx
 * import { LinkServiceUtils } from '@/components/ui/link-service';
 * 
 * // Access utilities through the collection
 * const config = LinkServiceUtils.SERVICE_TYPE_CONFIG.aws_s3;
 * ```
 */
export const LinkServiceUtils = {
  LINK_SERVICE_DEFAULTS,
  SERVICE_TYPE_CONFIG,
  STORAGE_SERVICE_CONSTANTS,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for LinkService system
 * Consolidates all TypeScript interfaces and types for easy import
 * 
 * @example
 * ```tsx
 * import type { LinkServiceSystemTypes } from '@/components/ui/link-service';
 * 
 * type MyServiceConfig = LinkServiceSystemTypes['StorageServiceConfig'];
 * ```
 */
export interface LinkServiceSystemTypes {
  // Core component types
  LinkServiceProps: LinkServiceProps;
  LinkServiceFormData: LinkServiceFormData;
  LinkServiceState: LinkServiceState;
  
  // Storage service types
  StorageService: StorageService;
  StorageServiceConfig: StorageServiceConfig;
  StorageCapabilities: StorageCapabilities;
  
  // Connection and testing types
  ConnectionTestResult: ConnectionTestResult;
  FileOperations: FileOperations;
  
  // Configuration types
  ServiceMetadata: ServiceMetadata;
  ServiceRegistry: ServiceRegistry;
}

// =============================================================================
// STORAGE SERVICE TYPE UNIONS
// =============================================================================

/**
 * Storage service type unions for dynamic component creation
 * Useful for configuration-driven service rendering and type narrowing
 */
export type StorageServiceVariant = 
  | 'aws_s3'
  | 'azure_blob' 
  | 'google_cloud'
  | 'local_file'
  | 'ftp'
  | 'sftp'
  | 'dropbox'
  | 'onedrive'
  | 'box'
  | 'rackspace'
  | 'openstack'
  | 'custom';

/**
 * Storage service categories for UI organization and filtering
 */
export type StorageCategory = 'cloud' | 'filesystem' | 'enterprise' | 'custom';

/**
 * Authentication method variants for service configuration
 */
export type AuthMethodVariant = 
  | 'api_key'
  | 'oauth2'
  | 'username_password'
  | 'certificate'
  | 'shared_key'
  | 'iam_role'
  | 'service_account'
  | 'connection_string';

// =============================================================================
// ACCESSIBILITY AND COMPLIANCE CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for LinkService component system
 * Provides reference values for accessibility validation and testing
 */
export const LINK_SERVICE_ACCESSIBILITY = {
  /**
   * ARIA labels for storage service components
   */
  ARIA_LABELS: {
    serviceSelector: 'Select storage service type',
    configurationForm: 'Storage service configuration form',
    connectionTest: 'Test storage service connection',
    advancedOptions: 'Advanced configuration options',
    serviceStatus: 'Storage service connection status',
  },
  
  /**
   * Minimum interaction target sizes per WCAG guidelines
   */
  TOUCH_TARGETS: {
    minimum: { width: 44, height: 44 },
    recommended: { width: 48, height: 48 },
  },
  
  /**
   * Screen reader announcements and live regions
   */
  LIVE_REGIONS: {
    connectionStatus: 'polite',
    validationErrors: 'assertive',
    operationProgress: 'polite',
  },
  
  /**
   * Focus management settings
   */
  FOCUS_MANAGEMENT: {
    trapFocus: true,
    restoreFocus: true,
    skipLinks: true,
  },
} as const;

/**
 * Default LinkService configuration for consistent application defaults
 * Ensures proper accessibility, performance, and user experience settings
 */
export const DEFAULT_LINK_SERVICE_CONFIG = {
  // Component behavior
  enableRealTimeValidation: true,
  validationDelay: 300, // milliseconds
  enableConnectionTesting: true,
  showAdvancedOptions: false,
  
  // UI preferences
  variant: 'default' as const,
  size: 'md' as const,
  mode: 'form' as const,
  
  // Accessibility settings
  enableKeyboardNavigation: true,
  announceStateChanges: true,
  useAriaLiveRegions: true,
  
  // Performance settings
  cacheConnectionTests: true,
  debounceValidation: true,
  enableOptimisticUpdates: false,
} as const;

// =============================================================================
// LEGACY COMPATIBILITY (DEPRECATED)
// =============================================================================

/**
 * Default export object for backward compatibility
 * @deprecated Use named exports instead for better tree-shaking and explicit imports
 */
const LinkServiceModule = {
  LinkService,
  LinkServiceComponents,
  LinkServiceUtils,
} as const;

// Note: Not exporting default module to encourage named imports
// export default LinkServiceModule;