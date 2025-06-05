/**
 * LinkService Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for React 19 LinkService component system
 * that enables linking external storage services (GitHub, file services) with
 * React Hook Form integration, Zod validation, and WCAG 2.1 AA accessibility.
 * 
 * Migrated from Angular df-link-service component to modern React/Next.js patterns
 * with enhanced type safety and production-ready validation workflows.
 * 
 * @fileoverview TypeScript 5.8+ type definitions for LinkService component
 * @version 1.0.0
 */

import { type ReactNode } from 'react';
import { type UseFormReturn, type FieldValues, type Control } from 'react-hook-form';
import { type z } from 'zod';
import {
  type BaseComponentProps,
  type FormComponentProps,
  type ThemeProps,
  type AccessibilityProps,
  type ControlledProps,
  type LoadingState,
  type ValidationState,
  type AnimationProps,
  type ResponsiveProps,
  type EventHandlers,
} from '../../../types/ui';

/**
 * Storage service type definitions matching DreamFactory service architecture
 * Extends core Service interface with storage-specific configurations
 */
export interface StorageServiceType {
  /** Service type identifier */
  name: string;
  /** Human-readable service label */
  label: string;
  /** Service description for UI display */
  description: string;
  /** Service group categorization (e.g., 'source control', 'file') */
  group: string;
  /** Optional CSS class for service styling */
  class?: string;
  /** Configuration schema for service parameters */
  configSchema: Array<ServiceConfigSchema>;
}

/**
 * Configuration schema for service parameter definitions
 * Supports various input types and validation rules
 */
export interface ServiceConfigSchema {
  /** Parameter name/identifier */
  name: string;
  /** Human-readable parameter label */
  label: string;
  /** Parameter input type */
  type:
    | 'string'
    | 'text'
    | 'integer'
    | 'password'
    | 'boolean'
    | 'object'
    | 'array'
    | 'picklist'
    | 'multi_picklist'
    | 'file_certificate'
    | 'file_certificate_api'
    | 'verb_mask'
    | 'event_picklist';
  /** Parameter description for helper text */
  description?: string;
  /** Parameter alias for API mapping */
  alias: string;
  /** Native parameter options */
  native?: any[];
  /** String length constraint */
  length?: number;
  /** Numeric precision constraint */
  precision: number;
  /** Scale constraint */
  scale: any;
  /** Default parameter value */
  default: any;
  /** Required field indicator */
  required?: boolean;
  /** Allow null values */
  allowNull?: boolean;
  /** Fixed length requirement */
  fixedLength?: boolean;
  /** Multibyte character support */
  supportsMultibyte?: boolean;
  /** Primary key indicator */
  isPrimaryKey?: boolean;
  /** Unique constraint */
  isUnique?: boolean;
  /** Foreign key indicator */
  isForeignKey?: boolean;
  /** Referenced table for foreign keys */
  refTable?: string;
  /** Referenced field for foreign keys */
  refField?: string;
  /** Foreign key update action */
  refOnUpdate: any;
  /** Foreign key delete action */
  refOnDelete: any;
  /** Picklist options */
  picklist: any;
  /** Validation rules */
  validation: any;
  /** Database function integration */
  dbFunction: any;
  /** Virtual field indicator */
  isVirtual?: boolean;
  /** Aggregate field indicator */
  isAggregate?: boolean;
  /** Object type configuration */
  object?: {
    key: ServiceLabelType;
    value: ServiceLabelType;
  };
  /** Array items configuration */
  items: Array<ServiceConfigSchema> | 'string';
  /** Predefined values */
  values?: any[];
  /** Database type mapping */
  dbType?: string;
  /** Auto-increment indicator */
  autoIncrement?: boolean;
  /** Index indicator */
  isIndex?: boolean;
  /** UI columns for display */
  columns?: number;
  /** Fieldset legend for grouping */
  legend?: string;
}

/**
 * Service label type for object configurations
 */
export interface ServiceLabelType {
  /** Label text */
  label: string;
  /** Label type */
  type: string;
}

/**
 * Complete storage service definition interface
 * Represents external services that can be linked (GitHub, file services, etc.)
 */
export interface StorageService {
  /** Unique service identifier */
  id: number;
  /** Service name/key */
  name: string;
  /** Human-readable service label */
  label: string;
  /** Service description */
  description: string;
  /** Service active status */
  isActive: boolean;
  /** Service type (github, file, etc.) */
  type: string;
  /** Mutable service indicator */
  mutable: boolean;
  /** Deletable service indicator */
  deletable: boolean;
  /** Service creation timestamp */
  createdDate: string;
  /** Last modification timestamp */
  lastModifiedDate: string;
  /** Created by user ID */
  createdById: number | null;
  /** Last modified by user ID */
  lastModifiedById: number | null;
  /** Service configuration object */
  config: any;
  /** Associated service documentation ID */
  serviceDocByServiceId: number | null;
  /** Service refresh status */
  refresh: boolean;
}

/**
 * Form data interface for React Hook Form integration
 * Defines the structure of form values for service linking
 */
export interface LinkServiceFormData extends FieldValues {
  /** Selected storage service (service name or label) */
  serviceList: string;
  /** Repository name/path for source control services */
  repoInput: string;
  /** Branch or tag name for version control */
  branchInput: string;
  /** File/directory path within the repository */
  pathInput: string;
}

/**
 * Zod validation schema type for form validation
 * Provides compile-time type inference and runtime validation
 */
export type LinkServiceFormSchema = z.ZodSchema<LinkServiceFormData>;

/**
 * Form validation context for React Hook Form integration
 * Provides comprehensive form state management
 */
export interface LinkServiceFormContext {
  /** React Hook Form instance with typed methods */
  form: UseFormReturn<LinkServiceFormData>;
  /** Form control for advanced integrations */
  control: Control<LinkServiceFormData>;
  /** Form validation state */
  validation: ValidationState;
  /** Form submission handler */
  onSubmit: (data: LinkServiceFormData) => Promise<void> | void;
  /** Form reset handler */
  onReset: () => void;
}

/**
 * Cache management configuration and operations
 * Handles service content caching and invalidation
 */
export interface CacheManagement {
  /** Cache key/identifier */
  cacheKey?: string;
  /** Cache enabled status */
  enabled: boolean;
  /** Cache TTL in milliseconds */
  ttl?: number;
  /** Cache size limit */
  maxSize?: number;
  /** Cache invalidation handler */
  onInvalidate: () => Promise<void> | void;
  /** Cache clear handler */
  onClear: () => Promise<void> | void;
  /** Cache status information */
  status: {
    /** Cache hit ratio */
    hitRatio: number;
    /** Cache size in bytes */
    size: number;
    /** Last cache update timestamp */
    lastUpdated: Date;
  };
}

/**
 * File content management for storage service operations
 * Handles file reading, writing, and preview functionality
 */
export interface FileContentManagement {
  /** Current file content */
  content: string;
  /** File content type/format */
  contentType: 'text' | 'json' | 'yaml' | 'xml' | 'binary';
  /** File encoding */
  encoding: 'utf-8' | 'base64' | 'binary';
  /** Content loading state */
  loading: LoadingState;
  /** Content validation state */
  validation: ValidationState;
  /** Content update handler */
  onContentChange: (content: string) => void;
  /** File download handler */
  onDownload: () => Promise<Blob | void>;
  /** File preview configuration */
  preview: {
    /** Enable content preview */
    enabled: boolean;
    /** Maximum preview size in bytes */
    maxSize: number;
    /** Preview component renderer */
    render?: (content: string) => ReactNode;
  };
}

/**
 * Service connection configuration for external API integration
 * Defines how to connect and authenticate with storage services
 */
export interface ServiceConnectionConfig {
  /** Service base URL */
  baseUrl: string;
  /** Authentication configuration */
  auth: {
    /** Authentication type */
    type: 'token' | 'oauth' | 'basic' | 'none';
    /** Authentication credentials */
    credentials?: {
      /** API token or access token */
      token?: string;
      /** OAuth configuration */
      oauth?: {
        clientId: string;
        clientSecret: string;
        scope: string[];
      };
      /** Basic auth configuration */
      basic?: {
        username: string;
        password: string;
      };
    };
  };
  /** Request timeout in milliseconds */
  timeout: number;
  /** Retry configuration */
  retry: {
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Retry delay in milliseconds */
    delay: number;
    /** Backoff strategy */
    backoff: 'linear' | 'exponential';
  };
  /** Request headers */
  headers: Record<string, string>;
}

/**
 * API operation definitions for storage service interactions
 * Defines available operations and their configurations
 */
export interface StorageServiceAPI {
  /** Fetch file content operation */
  fetchContent: {
    /** HTTP method */
    method: 'GET';
    /** Endpoint template */
    endpoint: string;
    /** Request parameters */
    params: {
      service: string;
      repository: string;
      branch: string;
      path: string;
    };
    /** Response type */
    response: {
      content: string;
      encoding: string;
      type: string;
    };
  };
  /** List repository contents operation */
  listContents: {
    /** HTTP method */
    method: 'GET';
    /** Endpoint template */
    endpoint: string;
    /** Request parameters */
    params: {
      service: string;
      repository: string;
      branch?: string;
      path?: string;
    };
    /** Response type */
    response: Array<{
      name: string;
      path: string;
      type: 'file' | 'directory';
      size?: number;
      lastModified?: string;
    }>;
  };
  /** Delete cache operation */
  deleteCache: {
    /** HTTP method */
    method: 'DELETE';
    /** Endpoint template */
    endpoint: string;
    /** Request parameters */
    params: {
      cacheKey: string;
    };
    /** Response type */
    response: {
      success: boolean;
      message: string;
    };
  };
}

/**
 * Component state interface for LinkService
 * Manages the overall component state and behavior
 */
export interface LinkServiceState {
  /** Available storage services */
  services: StorageService[];
  /** Currently selected service */
  selectedService: StorageService | null;
  /** Service loading state */
  servicesLoading: LoadingState;
  /** Component expansion state (for accordion) */
  isExpanded: boolean;
  /** Service type detection state */
  serviceType: {
    /** Service type identifier */
    type: string;
    /** Service supports repository operations */
    supportsRepository: boolean;
    /** Service supports branch operations */
    supportsBranches: boolean;
    /** Service supports file operations */
    supportsFiles: boolean;
  };
  /** Operation states */
  operations: {
    /** View latest content operation */
    viewLatest: LoadingState;
    /** Delete cache operation */
    deleteCache: LoadingState;
  };
}

/**
 * Event handler definitions for LinkService component
 * Provides type-safe event handling for user interactions
 */
export interface LinkServiceEventHandlers extends EventHandlers {
  /** Service selection change handler */
  onServiceSelect: (service: StorageService) => void;
  /** Repository input change handler */
  onRepositoryChange: (repository: string) => void;
  /** Branch input change handler */
  onBranchChange: (branch: string) => void;
  /** Path input change handler */
  onPathChange: (path: string) => void;
  /** View latest content handler */
  onViewLatest: () => Promise<void> | void;
  /** Delete cache handler */
  onDeleteCache: () => Promise<void> | void;
  /** Panel expansion toggle handler */
  onToggleExpansion: (expanded: boolean) => void;
  /** Form submission handler */
  onFormSubmit: (data: LinkServiceFormData) => Promise<void> | void;
  /** Form reset handler */
  onFormReset: () => void;
  /** Error handler */
  onError: (error: Error) => void;
}

/**
 * Main LinkService component props interface
 * Comprehensive props definition with accessibility and theme support
 */
export interface LinkServiceProps
  extends BaseComponentProps<HTMLDivElement>,
    FormComponentProps,
    ThemeProps,
    AccessibilityProps,
    AnimationProps,
    ResponsiveProps {
  
  /** Cache key for service content caching */
  cache?: string;
  
  /** Storage service ID (required) */
  storageServiceId: string;
  
  /** Storage path form control integration */
  storagePath?: ControlledProps<string>;
  
  /** Content form control integration */
  content?: ControlledProps<string>;
  
  /** Available storage services */
  services?: StorageService[];
  
  /** Service loading state */
  servicesLoading?: boolean;
  
  /** Default expanded state for accordion panel */
  defaultExpanded?: boolean;
  
  /** Controlled expansion state */
  expanded?: boolean;
  
  /** Event handlers */
  onServiceSelect?: (service: StorageService) => void;
  onViewLatest?: () => Promise<void> | void;
  onDeleteCache?: () => Promise<void> | void;
  onToggleExpansion?: (expanded: boolean) => void;
  onContentChange?: (content: string) => void;
  onError?: (error: Error) => void;
  
  /** Cache management configuration */
  cacheConfig?: Partial<CacheManagement>;
  
  /** File content management configuration */
  fileConfig?: Partial<FileContentManagement>;
  
  /** Service connection configuration */
  connectionConfig?: Partial<ServiceConnectionConfig>;
  
  /** Form validation schema */
  validationSchema?: LinkServiceFormSchema;
  
  /** Custom form defaults */
  defaultValues?: Partial<LinkServiceFormData>;
  
  /** Panel title override */
  title?: string;
  
  /** Panel description override */
  description?: string;
  
  /** Custom action buttons */
  customActions?: ReactNode;
  
  /** Hide default action buttons */
  hideActions?: boolean;
  
  /** Action button variant */
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  /** Action button size */
  actionSize?: 'sm' | 'md' | 'lg';
  
  /** Form layout configuration */
  layout?: 'vertical' | 'horizontal' | 'inline';
  
  /** Field spacing configuration */
  fieldSpacing?: 'compact' | 'normal' | 'relaxed';
  
  /** Show service type indicators */
  showServiceTypes?: boolean;
  
  /** Enable real-time validation */
  enableRealTimeValidation?: boolean;
  
  /** Validation debounce delay in milliseconds */
  validationDelay?: number;
  
  /** Custom field renderers */
  fieldRenderers?: {
    serviceSelect?: (props: any) => ReactNode;
    repositoryInput?: (props: any) => ReactNode;
    branchInput?: (props: any) => ReactNode;
    pathInput?: (props: any) => ReactNode;
  };
  
  /** Loading indicator customization */
  loadingIndicator?: ReactNode;
  
  /** Error boundary fallback */
  errorFallback?: (error: Error) => ReactNode;
  
  /** Accessibility announcements */
  announcements?: {
    onServiceSelect?: string;
    onContentLoaded?: string;
    onCacheCleared?: string;
    onError?: string;
  };
  
  /** Test identifiers */
  testIds?: {
    container?: string;
    form?: string;
    serviceSelect?: string;
    repositoryInput?: string;
    branchInput?: string;
    pathInput?: string;
    viewLatestButton?: string;
    deleteCacheButton?: string;
  };
}

/**
 * Hook return type for useStorageServices data fetching
 * Provides typed interface for service management operations
 */
export interface UseStorageServicesReturn {
  /** Available storage services */
  services: StorageService[];
  /** Services loading state */
  isLoading: boolean;
  /** Services error state */
  error: Error | null;
  /** Services refetch function */
  refetch: () => Promise<void>;
  /** Service mutation functions */
  mutations: {
    /** Create new service */
    create: (service: Partial<StorageService>) => Promise<StorageService>;
    /** Update existing service */
    update: (id: number, updates: Partial<StorageService>) => Promise<StorageService>;
    /** Delete service */
    delete: (id: number) => Promise<void>;
    /** Test service connection */
    testConnection: (config: ServiceConnectionConfig) => Promise<boolean>;
  };
}

/**
 * Hook return type for useLinkServiceForm form management
 * Provides comprehensive form state and operations
 */
export interface UseLinkServiceFormReturn {
  /** Form instance with typed methods */
  form: UseFormReturn<LinkServiceFormData>;
  /** Form state information */
  formState: {
    /** Form is valid */
    isValid: boolean;
    /** Form is dirty */
    isDirty: boolean;
    /** Form is submitting */
    isSubmitting: boolean;
    /** Form errors */
    errors: Record<keyof LinkServiceFormData, string>;
  };
  /** Form operations */
  operations: {
    /** Submit form */
    submit: () => Promise<void>;
    /** Reset form */
    reset: () => void;
    /** Validate form */
    validate: () => Promise<boolean>;
    /** Set field value */
    setValue: <K extends keyof LinkServiceFormData>(field: K, value: LinkServiceFormData[K]) => void;
    /** Get field value */
    getValue: <K extends keyof LinkServiceFormData>(field: K) => LinkServiceFormData[K];
  };
}

/**
 * Theme configuration for LinkService component
 * Provides consistent theming across component variants
 */
export interface LinkServiceTheme {
  /** Container styling variants */
  container: {
    base: string;
    variants: {
      expanded: string;
      collapsed: string;
      loading: string;
      error: string;
    };
  };
  /** Panel styling variants */
  panel: {
    base: string;
    header: string;
    content: string;
    variants: {
      size: Record<'sm' | 'md' | 'lg', string>;
      variant: Record<'default' | 'bordered' | 'elevated', string>;
    };
  };
  /** Form styling configuration */
  form: {
    base: string;
    field: string;
    label: string;
    input: string;
    error: string;
    helper: string;
  };
  /** Action button styling */
  actions: {
    container: string;
    button: {
      base: string;
      variants: Record<'primary' | 'secondary' | 'outline' | 'ghost', string>;
      sizes: Record<'sm' | 'md' | 'lg', string>;
    };
  };
  /** Loading and state indicators */
  indicators: {
    loading: string;
    success: string;
    error: string;
    warning: string;
  };
}

/**
 * Export utility types for external usage
 */
export type LinkServiceFormFields = keyof LinkServiceFormData;
export type StorageServiceTypes = StorageService['type'];
export type ServiceConfigurationKeys = keyof ServiceConnectionConfig;
export type CacheOperations = keyof CacheManagement;
export type FileOperations = keyof FileContentManagement;

/**
 * Type guards for runtime type checking
 */
export const isStorageService = (value: any): value is StorageService => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string'
  );
};

export const isLinkServiceFormData = (value: any): value is LinkServiceFormData => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.serviceList === 'string' &&
    typeof value.repoInput === 'string' &&
    typeof value.branchInput === 'string' &&
    typeof value.pathInput === 'string'
  );
};

/**
 * Default configuration constants
 */
export const LINK_SERVICE_DEFAULTS = {
  /** Default cache TTL in milliseconds (5 minutes) */
  CACHE_TTL: 5 * 60 * 1000,
  /** Default request timeout in milliseconds (30 seconds) */
  REQUEST_TIMEOUT: 30 * 1000,
  /** Default validation delay in milliseconds (300ms) */
  VALIDATION_DELAY: 300,
  /** Default maximum file preview size (1MB) */
  MAX_PREVIEW_SIZE: 1024 * 1024,
  /** Default retry attempts */
  MAX_RETRY_ATTEMPTS: 3,
  /** Default retry delay in milliseconds */
  RETRY_DELAY: 1000,
} as const;

/**
 * Service type configuration mapping
 */
export const SERVICE_TYPE_CONFIG = {
  github: {
    supportsRepository: true,
    supportsBranches: true,
    supportsFiles: true,
    requiredFields: ['serviceList', 'repoInput', 'branchInput', 'pathInput'],
  },
  file: {
    supportsRepository: false,
    supportsBranches: false,
    supportsFiles: true,
    requiredFields: ['serviceList', 'pathInput'],
  },
  'source control': {
    supportsRepository: true,
    supportsBranches: true,
    supportsFiles: true,
    requiredFields: ['serviceList', 'repoInput', 'pathInput'],
  },
} as const;