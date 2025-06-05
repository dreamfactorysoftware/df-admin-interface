/**
 * Service and file metadata types maintaining compatibility with React component patterns
 * for file management and service listings.
 * 
 * This module provides comprehensive type definitions for DreamFactory service management,
 * file operations, and React component integration patterns while preserving all existing
 * service and file metadata contracts from the Angular implementation.
 */

import type { ReactNode } from 'react';

// ============================================================================
// Core Service Types
// ============================================================================

/**
 * Supported database service types for DreamFactory API generation.
 * Maintains compatibility with existing service configurations.
 */
export type ServiceType = 
  | 'mysql'
  | 'postgresql'
  | 'sqlserver'
  | 'oracle' 
  | 'mongodb'
  | 'snowflake'
  | 'sqlite'
  | 'mariadb'
  | 'cassandra'
  | 'couchdb'
  | 'firebird'
  | 'ibmdb2'
  | 'informix'
  | 'redis'
  | 'rethinkdb';

/**
 * Service status enumeration for tracking connection and configuration states.
 * Used in React components for conditional rendering and status indicators.
 */
export type ServiceStatus = 
  | 'active'
  | 'inactive'
  | 'testing'
  | 'error'
  | 'configuring'
  | 'connecting'
  | 'disconnected';

/**
 * Core service interface maintaining compatibility with existing DreamFactory
 * service configurations while supporting React component integration.
 */
export interface Service {
  /** Unique service identifier */
  id: number;
  
  /** Service name used in API endpoints */
  name: string;
  
  /** Human-readable service label */
  label: string;
  
  /** Service description for documentation */
  description?: string;
  
  /** Database service type */
  type: ServiceType;
  
  /** Service configuration object (database-specific) */
  config: Record<string, any>;
  
  /** Service activation status */
  is_active: boolean;
  
  /** Creation timestamp in ISO format */
  created_date: string;
  
  /** Last modification timestamp in ISO format */
  last_modified_date: string;
  
  /** ID of user who created the service */
  created_by_id?: number;
  
  /** ID of user who last modified the service */
  last_modified_by_id?: number;
  
  // Status and metadata for React component integration
  /** Current service connection status */
  status?: ServiceStatus;
  
  /** Last connection test result */
  lastConnectionTest?: ConnectionTestResult;
  
  /** Timestamp of last schema discovery */
  schemaLastDiscovered?: string;
  
  /** Number of generated API endpoints */
  apiEndpointsCount?: number;
  
  /** Service icon component for React rendering */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Service color theme for UI consistency */
  color?: string;
  
  /** Service metrics for dashboard display */
  metrics?: ServiceMetrics;
}

/**
 * Connection test result interface for service validation workflows.
 * Provides detailed feedback for React component error handling.
 */
export interface ConnectionTestResult {
  /** Test success status */
  success: boolean;
  
  /** Primary result message */
  message: string;
  
  /** Detailed error or success information */
  details?: string;
  
  /** Test execution duration in milliseconds */
  testDuration?: number;
  
  /** Test execution timestamp */
  timestamp: string;
  
  /** Specific error code for programmatic handling */
  errorCode?: string;
  
  /** Additional context for debugging */
  context?: Record<string, any>;
}

/**
 * Service metrics interface for performance monitoring and dashboard display.
 * Supports React component charts and analytics features.
 */
export interface ServiceMetrics {
  /** Total API requests processed */
  totalRequests?: number;
  
  /** Average response time in milliseconds */
  averageResponseTime?: number;
  
  /** Error rate as percentage */
  errorRate?: number;
  
  /** Last request timestamp */
  lastRequestTime?: string;
  
  /** Active connections count */
  activeConnections?: number;
  
  /** Peak connections in last 24 hours */
  peakConnections?: number;
  
  /** Data volume processed (bytes) */
  dataVolume?: number;
}

// ============================================================================
// File Management Types
// ============================================================================

/**
 * File type enumeration for categorizing files in the management interface.
 * Supports React component conditional rendering and icon selection.
 */
export type FileType = 
  | 'file'
  | 'folder'
  | 'image'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'audio'
  | 'video'
  | 'archive'
  | 'code'
  | 'text'
  | 'pdf'
  | 'unknown';

/**
 * Core files interface for DreamFactory file service integration.
 * Maintains compatibility with existing file operations while supporting
 * React component patterns for file management interfaces.
 */
export interface Files {
  /** File name with extension */
  name: string;
  
  /** File path relative to service root */
  path: string;
  
  /** File type classification */
  type: FileType;
  
  /** File size in bytes */
  size?: number;
  
  /** File content type/MIME type */
  contentType?: string;
  
  /** Last modification timestamp */
  lastModified?: string;
  
  /** File creation timestamp */
  created?: string;
  
  /** File permissions/access level */
  permissions?: FilePermissions;
  
  /** File metadata for enhanced functionality */
  metadata?: FileMetadata;
  
  /** URL for file access/download */
  url?: string;
  
  /** Thumbnail URL for image files */
  thumbnailUrl?: string;
  
  /** File tags for organization */
  tags?: string[];
  
  /** File version information */
  version?: string;
  
  /** File checksum for integrity verification */
  checksum?: string;
  
  /** Upload progress for React components */
  uploadProgress?: number;
  
  /** File processing status */
  status?: FileStatus;
}

/**
 * File permissions interface for access control management.
 * Supports React component conditional rendering of file operations.
 */
export interface FilePermissions {
  /** Read permission */
  read: boolean;
  
  /** Write permission */
  write: boolean;
  
  /** Delete permission */
  delete: boolean;
  
  /** Execute permission (for scripts/binaries) */
  execute?: boolean;
  
  /** Share permission */
  share?: boolean;
  
  /** Owner user ID */
  owner?: number;
  
  /** Group ID for group permissions */
  group?: number;
  
  /** Public access level */
  public?: boolean;
}

/**
 * File metadata interface for enhanced file information.
 * Provides additional context for React component display and processing.
 */
export interface FileMetadata {
  /** Original filename if renamed */
  originalName?: string;
  
  /** File description or notes */
  description?: string;
  
  /** Image dimensions for media files */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /** Media duration for audio/video files */
  duration?: number;
  
  /** Color profile for images */
  colorProfile?: string;
  
  /** Compression ratio */
  compressionRatio?: number;
  
  /** Encryption status */
  encrypted?: boolean;
  
  /** Custom metadata fields */
  custom?: Record<string, any>;
}

/**
 * File processing status for upload/download operations.
 * Supports React component loading states and progress indicators.
 */
export type FileStatus = 
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error'
  | 'deleted'
  | 'archived';

// ============================================================================
// React Component Integration Types
// ============================================================================

/**
 * File table row interface optimized for React table components.
 * Extends Files interface with additional properties for table display,
 * selection state, and interaction handling.
 */
export interface FileTableRow extends Files {
  /** Unique row identifier for React keys */
  id: string;
  
  /** Row selection state for bulk operations */
  selected?: boolean;
  
  /** Row expansion state for nested content */
  expanded?: boolean;
  
  /** Row loading state for async operations */
  loading?: boolean;
  
  /** Row error state with message */
  error?: string;
  
  /** Custom actions available for this file */
  actions?: FileAction[];
  
  /** Row highlighting/emphasis state */
  highlighted?: boolean;
  
  /** Custom CSS class for styling */
  className?: string;
  
  /** Accessibility label for screen readers */
  ariaLabel?: string;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * File action interface for context menus and bulk operations.
 * Supports React component action handlers and conditional rendering.
 */
export interface FileAction {
  /** Action identifier */
  id: string;
  
  /** Action display label */
  label: string;
  
  /** Action icon component */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Action handler function */
  handler: (file: Files) => void | Promise<void>;
  
  /** Action availability condition */
  disabled?: boolean;
  
  /** Action danger level for styling */
  destructive?: boolean;
  
  /** Action keyboard shortcut */
  shortcut?: string;
  
  /** Action confirmation requirement */
  requiresConfirmation?: boolean;
  
  /** Action permission requirements */
  requiredPermissions?: (keyof FilePermissions)[];
}

/**
 * Entity type alias for React component compatibility.
 * Provides a unified type for entities that can be either services or files,
 * supporting polymorphic React component patterns and type safety.
 */
export type EntityType = Service | Files | FileTableRow;

// ============================================================================
// Component Configuration Types
// ============================================================================

/**
 * File management component configuration interface.
 * Provides comprehensive configuration options for React file management
 * components while maintaining backward compatibility.
 */
export interface FileManagementConfig {
  /** Component display mode */
  viewMode: 'list' | 'grid' | 'table';
  
  /** Allowed file operations */
  allowedOperations: FileOperation[];
  
  /** File upload configuration */
  uploadConfig?: FileUploadConfig;
  
  /** File filtering options */
  filterConfig?: FileFilterConfig;
  
  /** Pagination settings */
  pagination?: PaginationConfig;
  
  /** Selection mode for bulk operations */
  selectionMode?: 'none' | 'single' | 'multiple';
  
  /** Sort configuration */
  sortConfig?: FileSortConfig;
  
  /** Search configuration */
  searchConfig?: FileSearchConfig;
  
  /** Context menu configuration */
  contextMenu?: ContextMenuConfig;
  
  /** Accessibility settings */
  accessibility?: AccessibilityConfig;
}

/**
 * Supported file operations enumeration.
 * Controls which operations are available in React file management components.
 */
export type FileOperation = 
  | 'view'
  | 'download'
  | 'upload'
  | 'delete'
  | 'rename'
  | 'move'
  | 'copy'
  | 'share'
  | 'compress'
  | 'extract'
  | 'preview'
  | 'edit';

/**
 * File upload configuration interface for React upload components.
 * Provides comprehensive upload handling with progress tracking and validation.
 */
export interface FileUploadConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  
  /** Allowed file types/extensions */
  allowedTypes: string[];
  
  /** Maximum number of concurrent uploads */
  maxConcurrentUploads: number;
  
  /** Chunk size for large file uploads */
  chunkSize?: number;
  
  /** Auto-start upload on file selection */
  autoUpload?: boolean;
  
  /** Show upload progress */
  showProgress?: boolean;
  
  /** Upload retry configuration */
  retryConfig?: RetryConfig;
  
  /** Custom upload handler */
  customUploadHandler?: (file: File) => Promise<Files>;
}

/**
 * Retry configuration for failed operations.
 * Supports resilient file operations with exponential backoff.
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Initial retry delay in milliseconds */
  initialDelay: number;
  
  /** Delay multiplier for exponential backoff */
  backoffMultiplier: number;
  
  /** Maximum retry delay */
  maxDelay: number;
}

/**
 * File filtering configuration for React filter components.
 * Enables advanced file filtering with multiple criteria.
 */
export interface FileFilterConfig {
  /** Available filter types */
  availableFilters: FilterType[];
  
  /** Default active filters */
  defaultFilters?: FileFilter[];
  
  /** Show quick filter buttons */
  showQuickFilters?: boolean;
  
  /** Advanced filter panel visibility */
  showAdvancedFilters?: boolean;
  
  /** Filter presets */
  presets?: FilterPreset[];
}

/**
 * File filter types enumeration.
 * Defines available filtering criteria for file management.
 */
export type FilterType = 
  | 'type'
  | 'size'
  | 'date'
  | 'owner'
  | 'permissions'
  | 'tags'
  | 'status';

/**
 * File filter interface for advanced filtering functionality.
 * Supports complex filter expressions with multiple operators.
 */
export interface FileFilter {
  /** Filter type */
  type: FilterType;
  
  /** Filter operator */
  operator: FilterOperator;
  
  /** Filter value(s) */
  value: any;
  
  /** Filter display label */
  label?: string;
  
  /** Filter active state */
  active?: boolean;
}

/**
 * Filter operators for file filtering logic.
 * Provides comprehensive comparison operations for file attributes.
 */
export type FilterOperator = 
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Filter preset interface for saved filter configurations.
 * Enables quick application of common filter combinations.
 */
export interface FilterPreset {
  /** Preset identifier */
  id: string;
  
  /** Preset display name */
  name: string;
  
  /** Preset description */
  description?: string;
  
  /** Preset filter configuration */
  filters: FileFilter[];
  
  /** Preset icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Preset is default */
  default?: boolean;
}

/**
 * Pagination configuration interface for React table components.
 * Provides comprehensive pagination control with performance optimization.
 */
export interface PaginationConfig {
  /** Current page number (0-based) */
  currentPage: number;
  
  /** Total number of pages */
  totalPages: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Total number of items */
  totalItems: number;
  
  /** Page change handler */
  onPageChange: (page: number) => void;
  
  /** Page size change handler */
  onPageSizeChange: (size: number) => void;
  
  /** Show page size selector */
  showPageSizeSelector?: boolean;
  
  /** Available page size options */
  pageSizeOptions?: number[];
  
  /** Show page information */
  showPageInfo?: boolean;
  
  /** Show navigation buttons */
  showNavigation?: boolean;
  
  /** Show jump to page input */
  showJumpToPage?: boolean;
}

/**
 * File sorting configuration for React table components.
 * Enables multi-column sorting with custom sort functions.
 */
export interface FileSortConfig {
  /** Current sort field */
  field?: keyof Files;
  
  /** Current sort direction */
  direction?: 'asc' | 'desc';
  
  /** Sort change handler */
  onSortChange: (field: keyof Files, direction: 'asc' | 'desc') => void;
  
  /** Enable multi-column sorting */
  multiSort?: boolean;
  
  /** Sort indicators visibility */
  showSortIndicators?: boolean;
  
  /** Default sort configuration */
  defaultSort?: {
    field: keyof Files;
    direction: 'asc' | 'desc';
  };
  
  /** Custom sort functions */
  customSortFunctions?: Record<string, (a: any, b: any) => number>;
}

/**
 * File search configuration for React search components.
 * Provides comprehensive search functionality with multiple search modes.
 */
export interface FileSearchConfig {
  /** Search placeholder text */
  placeholder?: string;
  
  /** Search fields to include */
  searchFields: (keyof Files)[];
  
  /** Search mode */
  searchMode: 'instant' | 'debounced' | 'manual';
  
  /** Debounce delay for instant search */
  debounceDelay?: number;
  
  /** Minimum search term length */
  minSearchLength?: number;
  
  /** Case sensitive search */
  caseSensitive?: boolean;
  
  /** Enable regex search */
  enableRegex?: boolean;
  
  /** Search suggestions */
  suggestions?: string[];
  
  /** Search history */
  enableHistory?: boolean;
  
  /** Maximum history items */
  maxHistoryItems?: number;
}

/**
 * Context menu configuration for React context menu components.
 * Defines available actions and their organization in context menus.
 */
export interface ContextMenuConfig {
  /** Available menu items */
  items: ContextMenuItem[];
  
  /** Menu trigger mode */
  trigger: 'rightClick' | 'longPress' | 'button';
  
  /** Menu positioning */
  position: 'cursor' | 'element';
  
  /** Menu animation */
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  
  /** Menu theme */
  theme?: 'light' | 'dark' | 'auto';
  
  /** Custom menu renderer */
  customRenderer?: React.ComponentType<{ items: ContextMenuItem[] }>;
}

/**
 * Context menu item interface for file operations.
 * Defines individual menu items with actions and conditional display.
 */
export interface ContextMenuItem {
  /** Item identifier */
  id: string;
  
  /** Item label */
  label: string;
  
  /** Item icon */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** Item action handler */
  action: (files: Files[]) => void | Promise<void>;
  
  /** Item availability condition */
  condition?: (files: Files[]) => boolean;
  
  /** Item is destructive */
  destructive?: boolean;
  
  /** Item keyboard shortcut */
  shortcut?: string;
  
  /** Sub-menu items */
  submenu?: ContextMenuItem[];
  
  /** Item is separator */
  separator?: boolean;
  
  /** Item is disabled */
  disabled?: boolean;
}

/**
 * Accessibility configuration for React file management components.
 * Ensures WCAG 2.1 AA compliance and enhanced screen reader support.
 */
export interface AccessibilityConfig {
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean;
  
  /** Enable screen reader announcements */
  screenReaderAnnouncements?: boolean;
  
  /** High contrast mode support */
  highContrastMode?: boolean;
  
  /** Reduced motion support */
  reduceMotion?: boolean;
  
  /** Focus management */
  focusManagement?: FocusManagementConfig;
  
  /** ARIA labels configuration */
  ariaLabels?: AriaLabelsConfig;
  
  /** Keyboard shortcuts */
  keyboardShortcuts?: KeyboardShortcutsConfig;
}

/**
 * Focus management configuration for accessibility.
 * Controls focus behavior for keyboard navigation.
 */
export interface FocusManagementConfig {
  /** Auto-focus first item */
  autoFocusFirst?: boolean;
  
  /** Wrap focus in lists */
  wrapFocus?: boolean;
  
  /** Focus trap in modals */
  trapFocus?: boolean;
  
  /** Restore focus on close */
  restoreFocus?: boolean;
  
  /** Focus ring visibility */
  showFocusRing?: boolean;
}

/**
 * ARIA labels configuration for accessibility.
 * Provides comprehensive labeling for screen readers.
 */
export interface AriaLabelsConfig {
  /** File list label */
  fileList?: string;
  
  /** File item label template */
  fileItem?: string;
  
  /** Upload area label */
  uploadArea?: string;
  
  /** Search input label */
  searchInput?: string;
  
  /** Filter controls label */
  filterControls?: string;
  
  /** Sort controls label */
  sortControls?: string;
  
  /** Pagination controls label */
  paginationControls?: string;
  
  /** Context menu label */
  contextMenu?: string;
}

/**
 * Keyboard shortcuts configuration for accessibility.
 * Defines keyboard shortcuts for common file operations.
 */
export interface KeyboardShortcutsConfig {
  /** Enable keyboard shortcuts */
  enabled?: boolean;
  
  /** Shortcut definitions */
  shortcuts?: Record<string, KeyboardShortcut>;
  
  /** Show shortcut hints */
  showHints?: boolean;
  
  /** Custom shortcut handler */
  customHandler?: (event: KeyboardEvent) => boolean;
}

/**
 * Keyboard shortcut definition interface.
 * Defines individual keyboard shortcuts with key combinations and actions.
 */
export interface KeyboardShortcut {
  /** Key combination */
  keys: string[];
  
  /** Shortcut description */
  description: string;
  
  /** Shortcut action */
  action: () => void;
  
  /** Shortcut scope */
  scope?: 'global' | 'component';
  
  /** Prevent default behavior */
  preventDefault?: boolean;
  
  /** Stop event propagation */
  stopPropagation?: boolean;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if an entity is a Service.
 * Enables safe type narrowing in React components.
 */
export function isService(entity: EntityType): entity is Service {
  return 'type' in entity && 'config' in entity && 'is_active' in entity;
}

/**
 * Type guard to check if an entity is a Files object.
 * Enables safe type narrowing in React components.
 */
export function isFiles(entity: EntityType): entity is Files {
  return 'name' in entity && 'path' in entity && 'type' in entity && !('config' in entity);
}

/**
 * Type guard to check if an entity is a FileTableRow.
 * Enables safe type narrowing in React table components.
 */
export function isFileTableRow(entity: EntityType): entity is FileTableRow {
  return isFiles(entity) && 'id' in entity;
}

/**
 * Utility type for partial entity updates.
 * Supports React component state management patterns.
 */
export type PartialEntity<T extends EntityType> = Partial<T> & { 
  id: T extends Service ? number : string 
};

/**
 * Utility type for entity creation payloads.
 * Supports React form integration and validation patterns.
 */
export type CreateEntityPayload<T extends EntityType> = Omit<T, 
  T extends Service 
    ? 'id' | 'created_date' | 'last_modified_date' | 'created_by_id' | 'last_modified_by_id' 
    : 'id'
>;

/**
 * Utility type for entity update payloads.
 * Supports React form integration with partial updates.
 */
export type UpdateEntityPayload<T extends EntityType> = PartialEntity<T>;

// ============================================================================
// Export Statement
// ============================================================================

// Re-export commonly used types for convenience
export type {
  ReactNode
} from 'react';