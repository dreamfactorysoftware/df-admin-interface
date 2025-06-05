/**
 * File Selector Component System
 * 
 * Centralized barrel export for the file selector component library providing
 * comprehensive file selection, browsing, and upload capabilities.
 * 
 * This module exports all file selector components, hooks, and types for
 * seamless integration throughout the DreamFactory Admin Interface.
 * 
 * @module FileSelector
 * @version 1.0.0
 * @since React 19, Next.js 15.1+
 */

// =============================================================================
// MAIN COMPONENTS
// =============================================================================

/**
 * Primary file selector component for inline file selection workflows.
 * Provides comprehensive file selection functionality with upload capabilities,
 * service integration, and accessibility compliance.
 * 
 * @example
 * ```tsx
 * import { FileSelector } from '@/components/ui/file-selector';
 * 
 * <FileSelector
 *   onFileSelect={(file) => handleFileSelection(file)}
 *   acceptedTypes={['.json', '.xml']}
 *   serviceId="my-service"
 * />
 * ```
 */
export { default as FileSelector } from './FileSelector';

/**
 * Modal dialog component for file browsing, folder navigation, and file uploads.
 * Implements hierarchical folder navigation, file upload with progress tracking,
 * file type filtering, and service selection in a modal interface.
 * 
 * @example
 * ```tsx
 * import { FileSelectorDialog } from '@/components/ui/file-selector';
 * 
 * <FileSelectorDialog
 *   isOpen={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onFileSelect={(file) => handleFileSelection(file)}
 *   allowMultiple={true}
 * />
 * ```
 */
export { default as FileSelectorDialog } from './FileSelectorDialog';

/**
 * Simple folder creation dialog component for inline folder creation workflows.
 * Provides form-based folder creation with validation and error handling.
 * 
 * @example
 * ```tsx
 * import { CreateFolderDialog } from '@/components/ui/file-selector';
 * 
 * <CreateFolderDialog
 *   isOpen={showCreateFolder}
 *   onClose={() => setShowCreateFolder(false)}
 *   onFolderCreate={(folderName) => handleFolderCreation(folderName)}
 *   currentPath="/uploads"
 * />
 * ```
 */
export { default as CreateFolderDialog } from './CreateFolderDialog';

// =============================================================================
// REACT HOOKS
// =============================================================================

/**
 * React hook providing all file API operations including service discovery,
 * file listing, upload functionality, and directory creation.
 * Uses React Query for intelligent caching, error handling, and background synchronization.
 * 
 * @example
 * ```tsx
 * import { useFileApi } from '@/components/ui/file-selector';
 * 
 * const {
 *   services,
 *   listFiles,
 *   uploadFile,
 *   createFolder,
 *   isLoading,
 *   error
 * } = useFileApi();
 * ```
 */
export { useFileApi } from './hooks/useFileApi';

/**
 * React hook managing file selector component state including selected files,
 * navigation history, loading states, and user interactions.
 * Provides stateful file selection logic with folder navigation and validation.
 * 
 * @example
 * ```tsx
 * import { useFileSelector } from '@/components/ui/file-selector';
 * 
 * const {
 *   selectedFiles,
 *   currentPath,
 *   isLoading,
 *   selectFile,
 *   navigateToFolder,
 *   goBack
 * } = useFileSelector({
 *   allowMultiple: true,
 *   acceptedTypes: ['.pdf', '.doc']
 * });
 * ```
 */
export { useFileSelector } from './hooks/useFileSelector';

// =============================================================================
// TYPESCRIPT TYPES & INTERFACES
// =============================================================================

/**
 * Core file selector component types and interfaces.
 * Provides comprehensive type definitions for file metadata, selection state,
 * API responses, and component configuration.
 */
export type {
  /**
   * Configuration object for file API service information.
   * Contains service metadata, connection details, and capabilities.
   */
  FileApiInfo,
  
  /**
   * Represents a selected file with metadata and selection state.
   * Used throughout the file selector component system for file tracking.
   */
  SelectedFile,
  
  /**
   * Comprehensive file metadata interface including system properties,
   * permissions, and additional attributes for file management.
   */
  FileMetadata,
  
  /**
   * Directory metadata interface for folder representations
   * including nested structure and permission information.
   */
  DirectoryMetadata,
  
  /**
   * File upload progress tracking interface with cancellation support.
   * Provides real-time upload status and control mechanisms.
   */
  FileUploadProgress,
  
  /**
   * File selector component configuration options.
   * Defines component behavior, validation rules, and UI preferences.
   */
  FileSelectorProps,
  
  /**
   * File selector dialog component configuration options.
   * Extends base selector props with modal-specific settings.
   */
  FileSelectorDialogProps,
  
  /**
   * Create folder dialog component configuration options.
   * Defines folder creation workflow parameters and validation.
   */
  CreateFolderDialogProps,
  
  /**
   * File API hook configuration and return types.
   * Provides type safety for all file operation methods and state.
   */
  UseFileApiOptions,
  UseFileApiReturn,
  
  /**
   * File selector hook configuration and return types.
   * Ensures type safety for component state management and interactions.
   */
  UseFileSelectorOptions,
  UseFileSelectorReturn,
  
  /**
   * File filter configuration for restricting selectable files.
   * Supports extension-based, MIME type, and size-based filtering.
   */
  FileFilter,
  
  /**
   * File service configuration for different storage backends.
   * Supports local, cloud, and custom storage service integration.
   */
  FileServiceConfig,
  
  /**
   * Error interfaces for comprehensive file operation error handling.
   * Provides structured error information for user feedback.
   */
  FileApiError,
  FileUploadError,
  FileSelectorError,
} from './types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schemas for runtime type checking and form validation.
 * Ensures data integrity and provides developer-friendly error messages.
 */
export {
  /**
   * Validation schema for file metadata objects.
   * Ensures file information conforms to expected structure.
   */
  FileMetadataSchema,
  
  /**
   * Validation schema for directory metadata objects.
   * Validates folder structure and permission information.
   */
  DirectoryMetadataSchema,
  
  /**
   * Validation schema for file API service configuration.
   * Validates service connection parameters and capabilities.
   */
  FileApiInfoSchema,
  
  /**
   * Validation schema for file selector component props.
   * Ensures component configuration is valid and complete.
   */
  FileSelectorPropsSchema,
  
  /**
   * Validation schema for file upload progress tracking.
   * Validates upload status and progress information.
   */
  FileUploadProgressSchema,
} from './types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Re-export hooks barrel for convenience.
 * Provides access to all file selector hooks through a single import.
 * 
 * @example
 * ```tsx
 * import * as FileHooks from '@/components/ui/file-selector/hooks';
 * // or
 * import { useFileApi, useFileSelector } from '@/components/ui/file-selector/hooks';
 * ```
 */
export * from './hooks';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the main FileSelector component for convenience.
 * Enables both named and default import patterns for flexible usage.
 * 
 * @example
 * ```tsx
 * // Named import (recommended)
 * import { FileSelector } from '@/components/ui/file-selector';
 * 
 * // Default import (alternative)
 * import FileSelector from '@/components/ui/file-selector';
 * ```
 */
export { default } from './FileSelector';