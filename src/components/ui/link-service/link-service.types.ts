/**
 * LinkService Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for linking external storage services to DreamFactory.
 * Provides type safety for React Hook Form integration, Zod validation, and service configuration.
 * 
 * Supports cloud storage (AWS S3, Azure Blob, Google Cloud), file systems, FTP/SFTP,
 * and custom storage providers with real-time validation under 100ms performance requirements.
 * 
 * @fileoverview LinkService type definitions for DreamFactory Admin Interface
 * @version 1.0.0 
 * @since React 19.0.0 / Next.js 15.1+
 */

import { type ReactNode, type ComponentType } from 'react';
import { type UseFormReturn, type FieldValues, type Path, type FieldError, type Control } from 'react-hook-form';
import { type z } from 'zod';

// Import foundational types
import { 
  type BaseComponent,
  type FormFieldComponent,
  type SelectOption,
  type ComponentVariant,
  type ComponentSize,
  type ComponentState,
  type ResponsiveValue,
  type ThemeConfig,
  type LoadingState,
  type ValidationState
} from '../../../types/ui';

import { 
  type ApiResponse,
  type ApiListResponse,
  type ApiResourceResponse,
  type ApiErrorResponse,
  type ApiRequestOptions,
  type SwrOptions,
  type MutationOptions
} from '../../../types/api';

import {
  type FormConfig,
  type FormFieldConfig,
  type FormValidationResult,
  type FormSubmissionResult,
  type UseFormResult,
  type FormFieldProps,
  type FormState,
  type FormActions,
  type DynamicFormConfig
} from '../form/form.types';

// ============================================================================
// STORAGE SERVICE TYPES
// ============================================================================

/**
 * Supported storage service types for external linking
 * Covers all major cloud providers and traditional storage systems
 */
export type StorageServiceType = 
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
 * Storage service categories for UI organization
 */
export type StorageServiceCategory = 
  | 'cloud'
  | 'filesystem'
  | 'enterprise'
  | 'custom';

/**
 * Storage service capabilities and features
 */
export interface StorageCapabilities {
  /** Supports file upload operations */
  upload: boolean;
  
  /** Supports file download operations */
  download: boolean;
  
  /** Supports directory/folder operations */
  directories: boolean;
  
  /** Supports file metadata operations */
  metadata: boolean;
  
  /** Supports file versioning */
  versioning: boolean;
  
  /** Supports access control lists */
  acl: boolean;
  
  /** Supports server-side encryption */
  encryption: boolean;
  
  /** Supports CDN distribution */
  cdn: boolean;
  
  /** Maximum file size in bytes */
  maxFileSize?: number;
  
  /** Supported file types (MIME types) */
  supportedTypes?: string[];
  
  /** Storage quota in bytes */
  storageQuota?: number;
}

/**
 * Storage service authentication methods
 */
export type StorageAuthMethod = 
  | 'api_key'
  | 'oauth2'
  | 'username_password'
  | 'certificate'
  | 'shared_key'
  | 'iam_role'
  | 'service_account'
  | 'connection_string';

// ============================================================================
// SERVICE CONFIGURATION TYPES
// ============================================================================

/**
 * Base storage service configuration
 * Common properties shared across all storage service types
 */
export interface BaseStorageConfig {
  /** Service unique identifier */
  id?: string;
  
  /** Service display name */
  name: string;
  
  /** Service description */
  description?: string;
  
  /** Storage service type */
  type: StorageServiceType;
  
  /** Service is active and available */
  active: boolean;
  
  /** Default path/container for operations */
  defaultPath?: string;
  
  /** Service capabilities */
  capabilities: StorageCapabilities;
  
  /** Connection timeout in milliseconds */
  timeout?: number;
  
  /** Maximum concurrent connections */
  maxConnections?: number;
  
  /** Enable connection pooling */
  connectionPooling?: boolean;
  
  /** Custom headers for requests */
  customHeaders?: Record<string, string>;
  
  /** Service tags for organization */
  tags?: string[];
}

/**
 * AWS S3 specific configuration
 */
export interface AWSS3Config extends BaseStorageConfig {
  type: 'aws_s3';
  config: {
    /** AWS Access Key ID */
    accessKeyId: string;
    
    /** AWS Secret Access Key */
    secretAccessKey: string;
    
    /** AWS Session Token (optional) */
    sessionToken?: string;
    
    /** AWS Region */
    region: string;
    
    /** S3 Bucket name */
    bucket: string;
    
    /** Custom endpoint URL (for S3-compatible services) */
    endpoint?: string;
    
    /** Force path style URLs */
    forcePathStyle?: boolean;
    
    /** Use accelerated endpoint */
    useAccelerateEndpoint?: boolean;
    
    /** Server-side encryption configuration */
    encryption?: {
      type: 'AES256' | 'aws:kms' | 'aws:kms:dsse';
      kmsKeyId?: string;
    };
    
    /** Default ACL for uploads */
    defaultAcl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read';
    
    /** CloudFront distribution domain */
    cloudFrontDomain?: string;
  };
}

/**
 * Azure Blob Storage specific configuration
 */
export interface AzureBlobConfig extends BaseStorageConfig {
  type: 'azure_blob';
  config: {
    /** Azure Storage Account name */
    accountName: string;
    
    /** Azure Storage Account key or SAS token */
    accountKey: string;
    
    /** Container name */
    container: string;
    
    /** Custom endpoint URL */
    endpoint?: string;
    
    /** Use HTTPS */
    useHttps?: boolean;
    
    /** Default blob access tier */
    defaultAccessTier?: 'Hot' | 'Cool' | 'Archive';
    
    /** CDN endpoint */
    cdnEndpoint?: string;
  };
}

/**
 * Google Cloud Storage specific configuration
 */
export interface GoogleCloudConfig extends BaseStorageConfig {
  type: 'google_cloud';
  config: {
    /** Google Cloud Project ID */
    projectId: string;
    
    /** Service Account JSON key (base64 encoded) */
    serviceAccountKey: string;
    
    /** Storage bucket name */
    bucket: string;
    
    /** Custom endpoint URL */
    endpoint?: string;
    
    /** Default object ACL */
    defaultObjectAcl?: 'private' | 'publicRead' | 'publicReadWrite' | 'authenticatedRead';
    
    /** Enable uniform bucket-level access */
    uniformBucketLevelAccess?: boolean;
  };
}

/**
 * Local filesystem specific configuration
 */
export interface LocalFileConfig extends BaseStorageConfig {
  type: 'local_file';
  config: {
    /** Base directory path */
    basePath: string;
    
    /** Create directories if they don't exist */
    createDirectories?: boolean;
    
    /** File permissions (octal) */
    filePermissions?: string;
    
    /** Directory permissions (octal) */
    directoryPermissions?: string;
    
    /** Enable symlink following */
    followSymlinks?: boolean;
  };
}

/**
 * FTP/SFTP specific configuration
 */
export interface FtpConfig extends BaseStorageConfig {
  type: 'ftp' | 'sftp';
  config: {
    /** FTP server hostname */
    host: string;
    
    /** FTP server port */
    port?: number;
    
    /** Username for authentication */
    username: string;
    
    /** Password for authentication */
    password: string;
    
    /** Base directory path */
    basePath?: string;
    
    /** Use passive mode (FTP only) */
    passive?: boolean;
    
    /** Enable SSL/TLS */
    secure?: boolean;
    
    /** SSH private key (SFTP only) */
    privateKey?: string;
    
    /** SSH private key passphrase (SFTP only) */
    passphrase?: string;
  };
}

/**
 * Custom storage service configuration
 */
export interface CustomStorageConfig extends BaseStorageConfig {
  type: 'custom';
  config: {
    /** Custom configuration parameters */
    [key: string]: any;
    
    /** Base URL for the storage API */
    baseUrl: string;
    
    /** Authentication method */
    authMethod: StorageAuthMethod;
    
    /** Authentication credentials */
    credentials: Record<string, string>;
    
    /** Custom request headers */
    headers?: Record<string, string>;
    
    /** API endpoints mapping */
    endpoints?: {
      upload?: string;
      download?: string;
      list?: string;
      delete?: string;
      metadata?: string;
    };
  };
}

/**
 * Union type for all storage configurations
 */
export type StorageServiceConfig = 
  | AWSS3Config
  | AzureBlobConfig
  | GoogleCloudConfig
  | LocalFileConfig
  | FtpConfig
  | CustomStorageConfig;

// ============================================================================
// FORM DATA AND VALIDATION TYPES
// ============================================================================

/**
 * Form data structure for service linking workflow
 * Integrates with React Hook Form for type-safe form handling
 */
export interface LinkServiceFormData {
  /** Service basic information */
  service: {
    name: string;
    description?: string;
    type: StorageServiceType;
    active: boolean;
    tags?: string[];
  };
  
  /** Service-specific configuration */
  config: StorageServiceConfig['config'];
  
  /** Advanced options */
  advanced?: {
    timeout?: number;
    maxConnections?: number;
    connectionPooling?: boolean;
    customHeaders?: Array<{ key: string; value: string }>;
    defaultPath?: string;
  };
  
  /** Testing and validation */
  testing?: {
    testConnection?: boolean;
    testUpload?: boolean;
    testDownload?: boolean;
    testFile?: File;
  };
}

/**
 * Zod validation schemas for each storage service type
 * Provides runtime validation and compile-time type safety
 */
export interface LinkServiceValidationSchemas {
  /** Base schema for common fields */
  base: z.ZodSchema<Pick<LinkServiceFormData, 'service'>>;
  
  /** AWS S3 configuration schema */
  aws_s3: z.ZodSchema<AWSS3Config['config']>;
  
  /** Azure Blob configuration schema */
  azure_blob: z.ZodSchema<AzureBlobConfig['config']>;
  
  /** Google Cloud configuration schema */
  google_cloud: z.ZodSchema<GoogleCloudConfig['config']>;
  
  /** Local file configuration schema */
  local_file: z.ZodSchema<LocalFileConfig['config']>;
  
  /** FTP configuration schema */
  ftp: z.ZodSchema<FtpConfig['config']>;
  
  /** SFTP configuration schema */
  sftp: z.ZodSchema<FtpConfig['config']>;
  
  /** Custom storage configuration schema */
  custom: z.ZodSchema<CustomStorageConfig['config']>;
  
  /** Advanced options schema */
  advanced: z.ZodSchema<NonNullable<LinkServiceFormData['advanced']>>;
  
  /** Testing options schema */
  testing: z.ZodSchema<NonNullable<LinkServiceFormData['testing']>>;
}

/**
 * Dynamic validation schema based on selected service type
 */
export type DynamicLinkServiceSchema<T extends StorageServiceType> = 
  T extends 'aws_s3' ? z.ZodSchema<AWSS3Config>
  : T extends 'azure_blob' ? z.ZodSchema<AzureBlobConfig>
  : T extends 'google_cloud' ? z.ZodSchema<GoogleCloudConfig>
  : T extends 'local_file' ? z.ZodSchema<LocalFileConfig>
  : T extends 'ftp' | 'sftp' ? z.ZodSchema<FtpConfig>
  : T extends 'custom' ? z.ZodSchema<CustomStorageConfig>
  : z.ZodSchema<StorageServiceConfig>;

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Main LinkService component props
 * Provides comprehensive configuration for the service linking workflow
 */
export interface LinkServiceProps extends BaseComponent {
  /** Initial service configuration (for editing) */
  initialConfig?: Partial<StorageServiceConfig>;
  
  /** Available service types to display */
  availableTypes?: StorageServiceType[];
  
  /** Form submission handler */
  onSubmit: (config: StorageServiceConfig) => Promise<void> | void;
  
  /** Form cancellation handler */
  onCancel?: () => void;
  
  /** Service type change handler */
  onTypeChange?: (type: StorageServiceType) => void;
  
  /** Connection test handler */
  onTestConnection?: (config: Partial<StorageServiceConfig>) => Promise<boolean>;
  
  /** Component variant */
  variant?: 'default' | 'wizard' | 'dialog' | 'embedded';
  
  /** Component size */
  size?: ComponentSize;
  
  /** Show advanced options */
  showAdvanced?: boolean;
  
  /** Enable connection testing */
  enableTesting?: boolean;
  
  /** Form validation mode */
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched';
  
  /** Custom form configuration */
  formConfig?: Partial<FormConfig<LinkServiceFormData>>;
  
  /** Custom field overrides */
  fieldOverrides?: Record<string, Partial<FormFieldConfig<LinkServiceFormData>>>;
  
  /** Loading state */
  loading?: boolean;
  
  /** Error message */
  error?: string;
  
  /** Success message */
  success?: string;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Accessibility label */
  'aria-label'?: string;
  
  /** Test identifier */
  'data-testid'?: string;
}

/**
 * Service type selector component props
 */
export interface ServiceTypeSelectorProps extends BaseComponent {
  /** Available service types */
  types: StorageServiceType[];
  
  /** Selected service type */
  value?: StorageServiceType;
  
  /** Selection change handler */
  onChange: (type: StorageServiceType) => void;
  
  /** Display mode */
  mode?: 'grid' | 'list' | 'dropdown';
  
  /** Show service descriptions */
  showDescriptions?: boolean;
  
  /** Show service capabilities */
  showCapabilities?: boolean;
  
  /** Custom service metadata */
  serviceMetadata?: Record<StorageServiceType, {
    icon?: ComponentType<{ className?: string }>;
    description?: string;
    features?: string[];
    badge?: string;
  }>;
  
  /** Filter services by category */
  filterCategory?: StorageServiceCategory;
  
  /** Responsive grid columns */
  columns?: ResponsiveValue<number>;
  
  /** Component variant */
  variant?: ComponentVariant;
  
  /** Component size */
  size?: ComponentSize;
}

/**
 * Service configuration form props
 */
export interface ServiceConfigFormProps<T extends StorageServiceType = StorageServiceType> 
  extends FormFieldProps<LinkServiceFormData> {
  
  /** Service type for configuration */
  serviceType: T;
  
  /** Form instance */
  form: UseFormReturn<LinkServiceFormData>;
  
  /** Validation schema */
  schema: DynamicLinkServiceSchema<T>;
  
  /** Show advanced fields */
  showAdvanced?: boolean;
  
  /** Field group variant */
  groupVariant?: 'default' | 'card' | 'section' | 'inline';
  
  /** Enable conditional field display */
  enableConditionals?: boolean;
  
  /** Custom field components */
  customFields?: Record<string, ComponentType<FormFieldProps<LinkServiceFormData>>>;
  
  /** Field validation debounce delay */
  validationDelay?: number;
}

/**
 * Connection test component props
 */
export interface ConnectionTestProps extends BaseComponent {
  /** Service configuration to test */
  config: Partial<StorageServiceConfig>;
  
  /** Test execution handler */
  onTest: (config: Partial<StorageServiceConfig>) => Promise<ConnectionTestResult>;
  
  /** Test types to perform */
  testTypes?: Array<'connection' | 'upload' | 'download' | 'list' | 'metadata'>;
  
  /** Auto-test on configuration change */
  autoTest?: boolean;
  
  /** Test debounce delay */
  testDelay?: number;
  
  /** Show detailed test results */
  showDetails?: boolean;
  
  /** Test result display variant */
  resultVariant?: 'inline' | 'modal' | 'accordion';
  
  /** Component size */
  size?: ComponentSize;
}

/**
 * Service list component props for managing linked services
 */
export interface ServiceListProps extends BaseComponent {
  /** List of configured services */
  services: StorageServiceConfig[];
  
  /** Service selection handler */
  onSelect?: (service: StorageServiceConfig) => void;
  
  /** Service edit handler */
  onEdit?: (service: StorageServiceConfig) => void;
  
  /** Service delete handler */
  onDelete?: (serviceId: string) => void;
  
  /** Service toggle handler */
  onToggle?: (serviceId: string, active: boolean) => void;
  
  /** Service test handler */
  onTest?: (service: StorageServiceConfig) => Promise<ConnectionTestResult>;
  
  /** Display mode */
  mode?: 'table' | 'grid' | 'list';
  
  /** Show service actions */
  showActions?: boolean;
  
  /** Show service status */
  showStatus?: boolean;
  
  /** Show service capabilities */
  showCapabilities?: boolean;
  
  /** Enable service filtering */
  enableFiltering?: boolean;
  
  /** Enable service sorting */
  enableSorting?: boolean;
  
  /** Enable bulk operations */
  enableBulkActions?: boolean;
  
  /** Pagination configuration */
  pagination?: {
    pageSize: number;
    showSizeSelector?: boolean;
  };
  
  /** Loading state */
  loading?: boolean;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Error state */
  error?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * LinkService component state
 * Manages form data, validation, and UI state
 */
export interface LinkServiceState {
  /** Current form data */
  formData: Partial<LinkServiceFormData>;
  
  /** Selected service type */
  serviceType?: StorageServiceType;
  
  /** Form validation state */
  validation: ValidationState;
  
  /** Form loading state */
  loading: LoadingState;
  
  /** Connection test state */
  connectionTest: {
    inProgress: boolean;
    result?: ConnectionTestResult;
    error?: string;
  };
  
  /** UI state */
  ui: {
    showAdvanced: boolean;
    currentStep: number;
    expandedSections: string[];
    selectedService?: string;
  };
  
  /** Error states */
  errors: {
    form?: string;
    connection?: string;
    submission?: string;
  };
  
  /** Success states */
  success: {
    saved?: boolean;
    tested?: boolean;
    message?: string;
  };
}

/**
 * LinkService actions for state management
 */
export interface LinkServiceActions {
  /** Update form data */
  updateFormData: (data: Partial<LinkServiceFormData>) => void;
  
  /** Set service type */
  setServiceType: (type: StorageServiceType) => void;
  
  /** Update validation state */
  updateValidation: (validation: Partial<ValidationState>) => void;
  
  /** Set loading state */
  setLoading: (loading: boolean, message?: string) => void;
  
  /** Start connection test */
  startConnectionTest: () => void;
  
  /** Set connection test result */
  setConnectionTestResult: (result: ConnectionTestResult) => void;
  
  /** Set connection test error */
  setConnectionTestError: (error: string) => void;
  
  /** Toggle advanced options */
  toggleAdvanced: () => void;
  
  /** Set current wizard step */
  setCurrentStep: (step: number) => void;
  
  /** Toggle section expansion */
  toggleSection: (sectionId: string) => void;
  
  /** Set form error */
  setFormError: (error?: string) => void;
  
  /** Set connection error */
  setConnectionError: (error?: string) => void;
  
  /** Set submission error */
  setSubmissionError: (error?: string) => void;
  
  /** Set success state */
  setSuccess: (type: 'saved' | 'tested', message?: string) => void;
  
  /** Clear all errors */
  clearErrors: () => void;
  
  /** Reset state */
  reset: () => void;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  /** Test was successful */
  success: boolean;
  
  /** Test error message */
  error?: string;
  
  /** Test duration in milliseconds */
  duration: number;
  
  /** Individual test results */
  tests: {
    connection?: TestResult;
    upload?: TestResult;
    download?: TestResult;
    list?: TestResult;
    metadata?: TestResult;
  };
  
  /** Service capabilities detected */
  capabilities?: StorageCapabilities;
  
  /** Additional metadata */
  metadata?: {
    version?: string;
    region?: string;
    storage?: {
      used?: number;
      available?: number;
      total?: number;
    };
  };
}

/**
 * Individual test result
 */
export interface TestResult {
  /** Test passed */
  success: boolean;
  
  /** Test error message */
  error?: string;
  
  /** Test duration in milliseconds */
  duration: number;
  
  /** Additional test data */
  data?: any;
}

// ============================================================================
// API INTEGRATION TYPES
// ============================================================================

/**
 * Storage service API endpoints
 */
export interface StorageServiceEndpoints {
  /** List all storage services */
  list: () => Promise<ApiListResponse<StorageServiceConfig>>;
  
  /** Get storage service by ID */
  get: (id: string) => Promise<ApiResourceResponse<StorageServiceConfig>>;
  
  /** Create new storage service */
  create: (config: Omit<StorageServiceConfig, 'id'>) => Promise<ApiResourceResponse<StorageServiceConfig>>;
  
  /** Update storage service */
  update: (id: string, config: Partial<StorageServiceConfig>) => Promise<ApiResourceResponse<StorageServiceConfig>>;
  
  /** Delete storage service */
  delete: (id: string) => Promise<ApiResponse>;
  
  /** Test storage service connection */
  test: (config: Partial<StorageServiceConfig>) => Promise<ApiResourceResponse<ConnectionTestResult>>;
  
  /** Get storage service capabilities */
  capabilities: (type: StorageServiceType) => Promise<ApiResourceResponse<StorageCapabilities>>;
  
  /** Validate storage service configuration */
  validate: (config: Partial<StorageServiceConfig>) => Promise<ApiResponse<{ valid: boolean; errors?: string[] }>>;
}

/**
 * SWR configuration for storage service data fetching
 */
export interface StorageServiceSwrConfig {
  /** Service list cache configuration */
  list: SwrOptions<ApiListResponse<StorageServiceConfig>>;
  
  /** Service detail cache configuration */
  detail: SwrOptions<ApiResourceResponse<StorageServiceConfig>>;
  
  /** Connection test cache configuration */
  test: SwrOptions<ApiResourceResponse<ConnectionTestResult>>;
  
  /** Capabilities cache configuration */
  capabilities: SwrOptions<ApiResourceResponse<StorageCapabilities>>;
}

/**
 * Mutation options for storage service operations
 */
export interface StorageServiceMutations {
  /** Create service mutation */
  create: MutationOptions<
    ApiResourceResponse<StorageServiceConfig>, 
    Omit<StorageServiceConfig, 'id'>,
    ApiErrorResponse
  >;
  
  /** Update service mutation */
  update: MutationOptions<
    ApiResourceResponse<StorageServiceConfig>, 
    { id: string; config: Partial<StorageServiceConfig> },
    ApiErrorResponse
  >;
  
  /** Delete service mutation */
  delete: MutationOptions<
    ApiResponse, 
    string,
    ApiErrorResponse
  >;
  
  /** Test connection mutation */
  test: MutationOptions<
    ApiResourceResponse<ConnectionTestResult>, 
    Partial<StorageServiceConfig>,
    ApiErrorResponse
  >;
}

// ============================================================================
// UTILITY AND HELPER TYPES
// ============================================================================

/**
 * Service metadata for UI display
 */
export interface ServiceMetadata {
  /** Service display name */
  name: string;
  
  /** Service description */
  description: string;
  
  /** Service category */
  category: StorageServiceCategory;
  
  /** Service icon component */
  icon: ComponentType<{ className?: string }>;
  
  /** Service capabilities */
  capabilities: StorageCapabilities;
  
  /** Service documentation URL */
  docsUrl?: string;
  
  /** Service is in beta */
  beta?: boolean;
  
  /** Service is enterprise only */
  enterprise?: boolean;
  
  /** Service configuration schema */
  schema: z.ZodSchema<any>;
  
  /** Default configuration */
  defaultConfig: Partial<StorageServiceConfig['config']>;
  
  /** Required environment variables */
  requiredEnvVars?: string[];
}

/**
 * Service registry for managing available storage types
 */
export interface ServiceRegistry {
  /** Register a new service type */
  register: (type: StorageServiceType, metadata: ServiceMetadata) => void;
  
  /** Get service metadata */
  get: (type: StorageServiceType) => ServiceMetadata | undefined;
  
  /** Get all registered services */
  getAll: () => Record<StorageServiceType, ServiceMetadata>;
  
  /** Get services by category */
  getByCategory: (category: StorageServiceCategory) => ServiceMetadata[];
  
  /** Check if service type is supported */
  isSupported: (type: StorageServiceType) => boolean;
  
  /** Get service validation schema */
  getSchema: (type: StorageServiceType) => z.ZodSchema<any> | undefined;
}

/**
 * Cache management for service operations
 */
export interface ServiceCacheManager {
  /** Cache service configuration */
  setConfig: (id: string, config: StorageServiceConfig) => void;
  
  /** Get cached service configuration */
  getConfig: (id: string) => StorageServiceConfig | undefined;
  
  /** Cache connection test result */
  setTestResult: (id: string, result: ConnectionTestResult) => void;
  
  /** Get cached connection test result */
  getTestResult: (id: string) => ConnectionTestResult | undefined;
  
  /** Cache service capabilities */
  setCapabilities: (type: StorageServiceType, capabilities: StorageCapabilities) => void;
  
  /** Get cached service capabilities */
  getCapabilities: (type: StorageServiceType) => StorageCapabilities | undefined;
  
  /** Clear cache for service */
  clearService: (id: string) => void;
  
  /** Clear all cache */
  clearAll: () => void;
  
  /** Get cache statistics */
  getStats: () => {
    configCount: number;
    testResultCount: number;
    capabilitiesCount: number;
    totalSize: number;
  };
}

/**
 * File operation types for storage services
 */
export interface FileOperations {
  /** Upload file to storage */
  upload: (file: File, path?: string) => Promise<FileUploadResult>;
  
  /** Download file from storage */
  download: (path: string) => Promise<FileDownloadResult>;
  
  /** List files in directory */
  list: (path?: string) => Promise<FileListResult>;
  
  /** Delete file from storage */
  delete: (path: string) => Promise<FileDeleteResult>;
  
  /** Get file metadata */
  metadata: (path: string) => Promise<FileMetadataResult>;
  
  /** Create directory */
  createDirectory: (path: string) => Promise<DirectoryCreateResult>;
  
  /** Copy file */
  copy: (sourcePath: string, destinationPath: string) => Promise<FileCopyResult>;
  
  /** Move file */
  move: (sourcePath: string, destinationPath: string) => Promise<FileMoveResult>;
}

/**
 * File operation results
 */
export interface FileUploadResult {
  success: boolean;
  path?: string;
  url?: string;
  metadata?: FileMetadata;
  error?: string;
}

export interface FileDownloadResult {
  success: boolean;
  data?: Blob;
  metadata?: FileMetadata;
  error?: string;
}

export interface FileListResult {
  success: boolean;
  files?: FileInfo[];
  directories?: DirectoryInfo[];
  pagination?: {
    hasMore: boolean;
    nextToken?: string;
  };
  error?: string;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

export interface FileMetadataResult {
  success: boolean;
  metadata?: FileMetadata;
  error?: string;
}

export interface DirectoryCreateResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface FileCopyResult {
  success: boolean;
  destinationPath?: string;
  error?: string;
}

export interface FileMoveResult {
  success: boolean;
  destinationPath?: string;
  error?: string;
}

/**
 * File metadata structure
 */
export interface FileMetadata {
  /** File name */
  name: string;
  
  /** File path */
  path: string;
  
  /** File size in bytes */
  size: number;
  
  /** File MIME type */
  mimeType: string;
  
  /** File last modified timestamp */
  lastModified: Date;
  
  /** File creation timestamp */
  created?: Date;
  
  /** File MD5 hash */
  md5?: string;
  
  /** File ETag */
  etag?: string;
  
  /** File access URL */
  url?: string;
  
  /** File custom metadata */
  custom?: Record<string, string>;
}

/**
 * File information for listings
 */
export interface FileInfo extends FileMetadata {
  /** File is accessible */
  accessible: boolean;
  
  /** File permissions */
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

/**
 * Directory information for listings
 */
export interface DirectoryInfo {
  /** Directory name */
  name: string;
  
  /** Directory path */
  path: string;
  
  /** Directory last modified timestamp */
  lastModified: Date;
  
  /** Directory creation timestamp */
  created?: Date;
  
  /** Number of files in directory */
  fileCount?: number;
  
  /** Number of subdirectories */
  directoryCount?: number;
  
  /** Directory is accessible */
  accessible: boolean;
  
  /** Directory permissions */
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    create: boolean;
  };
}

// ============================================================================
// TYPE EXPORTS AND CONSTANTS
// ============================================================================

/**
 * Storage service constants
 */
export const STORAGE_SERVICE_CONSTANTS = {
  /** Default connection timeout (ms) */
  DEFAULT_TIMEOUT: 30000,
  
  /** Default max connections */
  DEFAULT_MAX_CONNECTIONS: 10,
  
  /** Default test timeout (ms) */
  DEFAULT_TEST_TIMEOUT: 10000,
  
  /** Maximum file size for testing (bytes) */
  MAX_TEST_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  /** Cache TTL for connection tests (ms) */
  CONNECTION_TEST_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  /** Cache TTL for service capabilities (ms) */
  CAPABILITIES_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  
  /** Validation debounce delay (ms) */
  VALIDATION_DEBOUNCE_DELAY: 300,
  
  /** Maximum retry attempts for connection tests */
  MAX_RETRY_ATTEMPTS: 3,
} as const;

/**
 * Export utility type for extracting service config by type
 */
export type ExtractServiceConfig<T extends StorageServiceType> = 
  Extract<StorageServiceConfig, { type: T }>;

/**
 * Export all component types for convenience
 */
export type {
  // Re-export React Hook Form types
  UseFormReturn,
  FieldError,
  Control,
  FieldValues,
  Path,
  
  // Re-export Zod types
  z,
};