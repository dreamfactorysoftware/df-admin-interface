/**
 * File Selector Component System - Barrel Exports
 * 
 * Centralized export file for the comprehensive file selector component system.
 * Provides clean import statements and tree-shaking optimized exports for React 19/Next.js 15.1
 * file selection, upload, and management functionality.
 * 
 * This barrel export enables clean imports throughout the application:
 * 
 * @example
 * ```typescript
 * // Import main components
 * import { FileSelector, FileSelectorDialog } from '@/components/ui/file-selector';
 * 
 * // Import hooks
 * import { useFileApi, useFileSelector } from '@/components/ui/file-selector';
 * 
 * // Import types
 * import type { SelectedFile, FileApiInfo } from '@/components/ui/file-selector';
 * ```
 * 
 * @fileoverview Barrel exports for file selector component system
 * @version 1.0.0
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Core file selector components
 * Export both named and default exports for flexible usage patterns
 */
export {
  FileSelector,
  CompactFileSelector,
  UploadFileSelector,
  default as DefaultFileSelector,
} from './FileSelector';

export {
  FileSelectorDialog,
  default as DefaultFileSelectorDialog,
} from './FileSelectorDialog';

export {
  CreateFolderDialog,
  default as DefaultCreateFolderDialog,
} from './CreateFolderDialog';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * File API operation hooks
 * Provides React Query integration for file operations
 */
export {
  useFileApi,
  useFileList,
  useFileUpload,
  FILE_API_QUERY_KEYS,
} from './hooks/useFileApi';

/**
 * File selector state management hooks
 * Provides comprehensive state management for file selection workflows
 */
export {
  useFileSelector,
  useFileSelectorNavigation,
  useFileValidation,
  default as defaultUseFileSelector,
} from './hooks/useFileSelector';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Core data interfaces for file operations
 * Essential types for file handling and API integration
 */
export type {
  FileApiInfo,
  SelectedFile,
  FileItem,
  FileMetadata,
  FileUploadProgress,
  FileOperationResult,
  ApiResponse,
} from './types';

/**
 * Component prop interfaces
 * TypeScript interfaces for component configuration and usage
 */
export type {
  FileSelectorProps,
  FileSelectorDialogProps,
  FileSelectorDialogData,
  CreateFolderDialogProps,
} from './types';

/**
 * Hook interfaces and return types
 * TypeScript interfaces for hook usage and return values
 */
export type {
  UseFileApiReturn,
  UseFileSelectorReturn,
  FileValidationOptions,
  PaginationOptions,
} from './types';

/**
 * Error handling types
 * Comprehensive error types for file operations
 */
export type {
  FileError,
  FileErrorType,
} from './types';

/**
 * Utility and configuration types
 * Additional types for advanced usage and configuration
 */
export type {
  FileSizeFormatOptions,
} from './types';

// =============================================================================
// VALIDATION SCHEMA EXPORTS
// =============================================================================

/**
 * Zod validation schemas for runtime type checking
 * Exported for external validation needs and form integration
 */
export {
  FileApiInfoSchema,
  SelectedFileSchema,
  FileMetadataSchema,
  FileItemSchema,
  FileUploadProgressSchema,
  FileOperationResultSchema,
  FileSelectorDialogDataSchema,
  FileErrorSchema,
  FileValidationOptionsSchema,
  ApiResponseSchema,
  PaginationOptionsSchema,
} from './types';

// =============================================================================
// TYPE GUARD EXPORTS
// =============================================================================

/**
 * Runtime type checking utilities
 * Type guards for validating object structures at runtime
 */
export {
  isFileApiInfo,
  isSelectedFile,
  isFileItem,
  isFileError,
} from './types';

// =============================================================================
// COMPONENT VARIANT EXPORTS
// =============================================================================

/**
 * Re-export component variants for direct access
 * Enables specific component variant imports for optimized bundle size
 */
export { CompactFileSelector as FileSelector_Compact } from './FileSelector';
export { UploadFileSelector as FileSelector_Upload } from './FileSelector';

// =============================================================================
// FORM DATA EXPORTS
// =============================================================================

/**
 * Form data types from individual components
 * Exported for React Hook Form integration and external form handling
 */
export type { CreateFolderFormData } from './CreateFolderDialog';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export for primary component
 * Enables default import syntax: import FileSelector from '@/components/ui/file-selector'
 */
export { FileSelector as default } from './FileSelector';

// =============================================================================
// UTILITY CONSTANTS
// =============================================================================

/**
 * Query key constants for React Query cache management
 * Exported for external cache invalidation and management
 */
export { FILE_API_QUERY_KEYS } from './hooks/useFileApi';

// =============================================================================
// DOCUMENTATION EXPORTS
// =============================================================================

/**
 * Component documentation interfaces
 * These exports provide TypeScript IntelliSense support and documentation
 * for component props, helping developers understand available options.
 */

/**
 * @namespace FileSelectorComponents
 * @description Collection of file selector components for different use cases
 * 
 * @component FileSelector - Main file selector with full functionality
 * @component CompactFileSelector - Minimal file selector for forms
 * @component UploadFileSelector - Upload-focused file selector
 * @component FileSelectorDialog - Modal dialog for file selection
 * @component CreateFolderDialog - Dialog for creating new folders
 */

/**
 * @namespace FileSelectorHooks
 * @description React hooks for file operations and state management
 * 
 * @hook useFileApi - File API operations with React Query
 * @hook useFileSelector - File selector state management
 * @hook useFileList - File listing with automatic caching
 * @hook useFileUpload - File upload with progress tracking
 * @hook useFileSelectorNavigation - Navigation state management
 * @hook useFileValidation - File validation utilities
 */

/**
 * @namespace FileSelectorTypes
 * @description TypeScript interfaces and types for file operations
 * 
 * @interface FileApiInfo - File service configuration
 * @interface SelectedFile - Selected file information
 * @interface FileItem - File or folder item in listings
 * @interface FileUploadProgress - Upload progress tracking
 * @interface FileError - Error handling structure
 */

// =============================================================================
// VERSION INFORMATION
// =============================================================================

/**
 * Component version information
 * Used for debugging and compatibility checking
 */
export const FILE_SELECTOR_VERSION = '1.0.0';

/**
 * Migration information
 * Indicates source Angular component for reference
 */
export const MIGRATION_SOURCE = 'df-file-selector.component.ts';

/**
 * Feature compatibility matrix
 * Documents React 19 and Next.js 15.1 feature usage
 */
export const FEATURE_COMPATIBILITY = {
  react: '19.0.0',
  nextjs: '15.1.0',
  typescript: '5.8.0',
  tailwind: '4.1.0',
  reactQuery: '5.0.0',
  reactHookForm: '7.52.0',
  headlessUI: '2.0.0',
  zod: '3.22.0',
} as const;