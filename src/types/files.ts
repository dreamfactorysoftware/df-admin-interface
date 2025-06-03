/**
 * File Management Type Definitions
 * 
 * TypeScript type definitions for the DreamFactory Admin Interface file management system.
 * Provides comprehensive type safety for file operations, service configurations, and
 * entity management within the F-008: File and Log Management feature.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 * @feature F-008: File and Log Management
 */

/**
 * Complete files response from the API
 * Contains both services and service types for file management operations
 */
export interface Files {
  /** Available file services */
  services: Service[]
  /** Service type definitions */
  serviceTypes: ServiceType[]
}

/**
 * Service type definition for file services
 * Describes the available types of file services in the system
 */
export interface ServiceType {
  /** Unique service type name */
  name: string
  /** Human-readable label */
  label: string
  /** Service group classification */
  group: string
  /** Service description */
  description: string
}

/**
 * File service configuration
 * Represents a configured file service instance
 */
export interface Service {
  /** Unique service identifier */
  id: number
  /** Service name */
  name: string
  /** Display label */
  label: string
  /** Service description */
  description: string
  /** Service type identifier */
  type: string
  /** Service-specific configuration */
  config?: any
  /** Associated documentation */
  serviceDocByServiceId?: any
}

/**
 * File table row representation
 * Used for displaying files in table/list views
 */
export interface FileTableRow {
  /** Full file path */
  path: string
  /** File name */
  name: string
  /** Entity type (file or folder) */
  type: EntityType
  /** MIME content type */
  contentType: string
  /** Last modification timestamp */
  lastModified?: string
}

/**
 * Individual file entity type
 * Primary type used by the useFileEntity hook for single file operations
 */
export interface FileType {
  /** Full file path */
  path: string
  /** Last modification timestamp */
  lastModified?: string
  /** File name */
  name: string
  /** Entity type (file or folder) */
  type: EntityType
  /** MIME content type */
  contentType: string
  /** File size in bytes */
  size?: number
  /** File permissions */
  permissions?: string
  /** File owner */
  owner?: string
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Entity type enumeration
 * Defines whether an entity is a file or folder
 */
export type EntityType = 'file' | 'folder'

/**
 * File operation result
 * Response type for file manipulation operations
 */
export interface FileOperationResult {
  /** Operation success status */
  success: boolean
  /** Result message */
  message?: string
  /** Updated file information */
  file?: FileType
  /** Error details if operation failed */
  error?: string
}

/**
 * File upload configuration
 * Parameters for file upload operations
 */
export interface FileUploadConfig {
  /** Target upload path */
  path: string
  /** File to upload */
  file: File
  /** Upload progress callback */
  onProgress?: (progress: number) => void
  /** Custom headers */
  headers?: Record<string, string>
}

/**
 * File download configuration
 * Parameters for file download operations
 */
export interface FileDownloadConfig {
  /** File path to download */
  path: string
  /** Custom filename for download */
  filename?: string
  /** Download format options */
  format?: 'blob' | 'text' | 'json'
}

/**
 * Folder creation parameters
 * Configuration for creating new folders
 */
export interface CreateFolderParams {
  /** Parent folder path */
  parentPath: string
  /** New folder name */
  folderName: string
  /** Folder permissions */
  permissions?: string
}

/**
 * File search parameters
 * Configuration for file search operations
 */
export interface FileSearchParams {
  /** Search query */
  query: string
  /** Search path */
  path?: string
  /** File type filter */
  type?: EntityType
  /** Content type filter */
  contentType?: string
  /** Modified since timestamp */
  modifiedSince?: string
}

/**
 * File listing parameters
 * Configuration for retrieving file lists
 */
export interface FileListParams {
  /** Directory path to list */
  path?: string
  /** Include hidden files */
  includeHidden?: boolean
  /** Sort order */
  sortBy?: 'name' | 'size' | 'modified'
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  /** Pagination offset */
  offset?: number
  /** Number of items per page */
  limit?: number
}

/**
 * File permissions enumeration
 * Standard file permission levels
 */
export type FilePermission = 'read' | 'write' | 'execute' | 'delete'

/**
 * File operation type enumeration
 * Types of operations that can be performed on files
 */
export type FileOperation = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'copy'
  | 'move'
  | 'rename'
  | 'upload'
  | 'download'