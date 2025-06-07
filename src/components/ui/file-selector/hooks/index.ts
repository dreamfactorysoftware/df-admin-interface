/**
 * File Selector Hooks - Barrel Export
 * 
 * Centralized export module for file selector hook library providing clean imports
 * and optimal tree-shaking support. Combines file API operations with stateful
 * file selection management for comprehensive file management functionality.
 * 
 * This module exports React hooks that enable:
 * - File API operations with React Query integration
 * - Stateful file selection with navigation history
 * - Upload progress tracking and management
 * - File validation and error handling
 * - Optimized caching and synchronization
 * 
 * @fileoverview Barrel export for file selector hooks with tree-shaking optimization
 * @version 1.0.0
 * @package @df-admin-interface/file-selector
 */

// =============================================================================
// FILE API HOOKS EXPORTS
// =============================================================================

/**
 * Primary file API operations hook providing comprehensive file management
 * capabilities including service discovery, file listing, upload functionality,
 * directory operations, and intelligent caching through React Query integration.
 * 
 * Features:
 * - File service discovery and management
 * - Directory listing with caching and pagination
 * - File upload with progress tracking and cancellation
 * - Directory creation and file deletion operations
 * - Optimized cache invalidation and synchronization
 * 
 * @example
 * ```typescript
 * import { useFileApi } from '@/components/ui/file-selector/hooks';
 * 
 * function FileManager() {
 *   const {
 *     fileServices,
 *     uploadFile,
 *     createDirectory,
 *     isLoading,
 *     uploadError
 *   } = useFileApi();
 * 
 *   return (
 *     <div>
 *       {fileServices.map(service => (
 *         <div key={service.id}>{service.label}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export {
  useFileApi,
  type FileUploadProgress,
  type FileError,
  type FileOperationResult,
  FILE_API_QUERY_KEYS,
} from './useFileApi';

/**
 * Specialized hook for file listing operations with automatic query management
 * and intelligent caching. Optimized for performance with large directory structures
 * and provides seamless integration with React Query patterns.
 * 
 * Features:
 * - Automatic query management for file listings
 * - Optimized caching with configurable stale times
 * - Background refetching and synchronization
 * - Error handling and retry logic
 * 
 * @example
 * ```typescript
 * import { useFileList } from '@/components/ui/file-selector/hooks';
 * 
 * function DirectoryListing({ serviceName, path }) {
 *   const { data: files, isLoading, error } = useFileList(serviceName, path);
 * 
 *   if (isLoading) return <div>Loading files...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 * 
 *   return (
 *     <ul>
 *       {files?.resource?.map(file => (
 *         <li key={file.path}>{file.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 */
export { useFileList } from './useFileApi';

/**
 * Specialized hook for file upload operations with comprehensive progress tracking,
 * cancellation support, and error handling. Provides optimized upload experience
 * with real-time progress updates and retry capabilities.
 * 
 * Features:
 * - File upload with progress tracking
 * - Upload cancellation and retry logic
 * - Error handling and validation
 * - Multiple file upload support
 * 
 * @example
 * ```typescript
 * import { useFileUpload } from '@/components/ui/file-selector/hooks';
 * 
 * function FileUploader() {
 *   const { uploadFile, isUploading, uploadError } = useFileUpload();
 * 
 *   const handleUpload = (file: File) => {
 *     uploadFile({
 *       serviceName: 'files',
 *       file,
 *       path: 'uploads',
 *       onProgress: (progress) => {
 *         console.log(`Upload progress: ${progress.progress}%`);
 *       }
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
 *       {isUploading && <div>Uploading...</div>}
 *       {uploadError && <div>Error: {uploadError.message}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export { useFileUpload } from './useFileApi';

// =============================================================================
// FILE SELECTOR HOOKS EXPORTS
// =============================================================================

/**
 * Primary file selector state management hook providing comprehensive file selection
 * functionality with navigation history, validation, and React Hook Form integration.
 * 
 * This hook manages the complete file selector component state including:
 * - Selected file tracking and validation
 * - Directory navigation with history management
 * - File filtering and search capabilities
 * - Upload progress monitoring
 * - Drag and drop state management
 * - Form validation and error handling
 * 
 * Features:
 * - Stateful file selection with validation
 * - Navigation history with back/forward support
 * - File filtering by name and type
 * - Upload progress tracking and management
 * - React Hook Form integration
 * - Accessibility support and keyboard navigation
 * 
 * @example
 * ```typescript
 * import { useFileSelector } from '@/components/ui/file-selector/hooks';
 * 
 * function FileSelector() {
 *   const {
 *     selectedFile,
 *     setSelectedFile,
 *     isLoading,
 *     error,
 *     validationState,
 *     form,
 *     actions
 *   } = useFileSelector({
 *     allowedExtensions: ['.pdf', '.doc', '.docx'],
 *     maxFileSize: 10 * 1024 * 1024, // 10MB
 *     onFileSelected: (file) => {
 *       console.log('Selected file:', file);
 *     }
 *   });
 * 
 *   return (
 *     <div>
 *       <button onClick={() => actions.navigateUp()}>
 *         Go Up
 *       </button>
 *       {selectedFile && (
 *         <div>Selected: {selectedFile.fileName}</div>
 *       )}
 *       {error && <div className="error">{error}</div>}
 *     </div>
 *   );
 * }
 * ```
 */
export {
  useFileSelector,
  default as useFileSelectorDefault,
} from './useFileSelector';

/**
 * Specialized hook for managing file selector navigation state including
 * directory navigation, history management, and path tracking. Provides
 * lightweight navigation functionality without full file selector state.
 * 
 * Features:
 * - Directory navigation with path tracking
 * - Navigation history with back/forward support
 * - Service switching and root navigation
 * - Breadcrumb path generation
 * 
 * @example
 * ```typescript
 * import { useFileSelectorNavigation } from '@/components/ui/file-selector/hooks';
 * 
 * function NavigationControls() {
 *   const {
 *     currentPath,
 *     currentServiceName,
 *     canGoBack,
 *     canGoForward,
 *     navigate,
 *     goBack,
 *     goForward
 *   } = useFileSelectorNavigation('', 'files');
 * 
 *   return (
 *     <div>
 *       <button onClick={goBack} disabled={!canGoBack}>
 *         Back
 *       </button>
 *       <span>{currentPath || 'Root'}</span>
 *       <button onClick={goForward} disabled={!canGoForward}>
 *         Forward
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export { useFileSelectorNavigation } from './useFileSelector';

/**
 * Specialized hook for file validation providing configurable validation rules,
 * error handling, and validation state management. Supports custom validation
 * functions and comprehensive file constraint checking.
 * 
 * Features:
 * - File size and type validation
 * - Custom validation function support
 * - MIME type and extension checking
 * - Validation state tracking
 * - Error message generation
 * 
 * @example
 * ```typescript
 * import { useFileValidation } from '@/components/ui/file-selector/hooks';
 * 
 * function FileValidator() {
 *   const { validationState, validateFile, clearValidation } = useFileValidation({
 *     maxSize: 5 * 1024 * 1024, // 5MB
 *     allowedExtensions: ['.jpg', '.png', '.gif'],
 *     customValidator: (file) => {
 *       if (file.name.includes('temp')) {
 *         return 'Temporary files are not allowed';
 *       }
 *       return undefined;
 *     }
 *   });
 * 
 *   const handleFileSelect = (file: File) => {
 *     const error = validateFile(file);
 *     if (error) {
 *       console.error('Validation failed:', error);
 *     } else {
 *       console.log('File is valid');
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <input type="file" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
 *       {validationState.error && (
 *         <div className="error">{validationState.error}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export { useFileValidation } from './useFileSelector';

// =============================================================================
// TYPE EXPORTS FOR EXTERNAL INTEGRATION
// =============================================================================

/**
 * Re-export types from file selector components for external integration
 * and type safety in consuming components. These types provide comprehensive
 * type definitions for all file selector operations and state management.
 */
export type {
  // Core file types
  FileApiInfo,
  SelectedFile,
  FileItem,
  
  // Validation and options
  FileValidationOptions,
  
  // Component props and interfaces
  FileSelectorProps,
  UseFileSelectorReturn,
  
  // Error handling
  FileError,
  FileErrorType,
  
  // Upload and progress
  FileUploadProgress,
  FileOperationResult,
  
  // UI state management
  ValidationState,
  LoadingState,
} from '../types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Re-export query keys for advanced React Query integration and cache management.
 * These constants enable external components to interact with the file API cache
 * for invalidation, prefetching, and custom query management.
 * 
 * @example
 * ```typescript
 * import { FILE_API_QUERY_KEYS } from '@/components/ui/file-selector/hooks';
 * import { useQueryClient } from '@tanstack/react-query';
 * 
 * function FileManager() {
 *   const queryClient = useQueryClient();
 * 
 *   const refreshFileList = (serviceName: string, path: string) => {
 *     queryClient.invalidateQueries({
 *       queryKey: FILE_API_QUERY_KEYS.fileList(serviceName, path)
 *     });
 *   };
 * 
 *   return <button onClick={() => refreshFileList('files', '')}>Refresh</button>;
 * }
 * ```
 */
export { FILE_API_QUERY_KEYS } from './useFileApi';

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module version information for dependency tracking and compatibility checking
 */
export const FILE_SELECTOR_HOOKS_VERSION = '1.0.0' as const;

/**
 * Supported React version for compatibility validation
 */
export const REACT_VERSION_REQUIREMENT = '>=18.0.0' as const;

/**
 * Module feature flags for conditional functionality
 */
export const FEATURE_FLAGS = {
  DRAG_AND_DROP: true,
  UPLOAD_PROGRESS: true,
  NAVIGATION_HISTORY: true,
  FILE_VALIDATION: true,
  REACT_QUERY_INTEGRATION: true,
} as const;