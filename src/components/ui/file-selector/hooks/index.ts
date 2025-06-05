/**
 * @fileoverview File Selector Hooks Barrel Export
 * 
 * Centralized export module for file selector hooks providing clean imports
 * and proper tree-shaking optimization for the file selector hook library.
 * 
 * This barrel export enables simplified imports throughout the application:
 * 
 * @example
 * ```typescript
 * // Import specific hooks
 * import { useFileApi, useFileSelector } from '@/components/ui/file-selector/hooks';
 * 
 * // Import types
 * import type { UseFileApiReturn, UseFileSelectorReturn } from '@/components/ui/file-selector/hooks';
 * ```
 * 
 * @module FileSelector/Hooks
 * @version 1.0.0
 */

// ============================================================================
// Primary Hook Exports
// ============================================================================

/**
 * File API operations hook for managing file system interactions.
 * 
 * Provides comprehensive file management capabilities including:
 * - File and folder listing with pagination
 * - File upload with progress tracking
 * - File download operations
 * - Folder creation and management
 * - File deletion and batch operations
 * - File metadata retrieval and updates
 * 
 * @example
 * ```typescript
 * const {
 *   listFiles,
 *   uploadFile,
 *   createFolder,
 *   deleteFile,
 *   uploadProgress,
 *   isLoading,
 *   error
 * } = useFileApi();
 * ```
 */
export { useFileApi } from './useFileApi';

/**
 * File selector state management hook for component interaction logic.
 * 
 * Manages file selection state, filters, and user interactions including:
 * - Selected file(s) state management
 * - File type filtering and validation
 * - Directory navigation state
 * - Selection mode configuration (single/multiple)
 * - File size and format restrictions
 * - Drag-and-drop interaction state
 * 
 * @example
 * ```typescript
 * const {
 *   selectedFiles,
 *   currentPath,
 *   selectFile,
 *   clearSelection,
 *   setFileFilter,
 *   isSelectionValid,
 *   selectionMode
 * } = useFileSelector({
 *   maxFiles: 5,
 *   allowedTypes: ['image/*', '.pdf'],
 *   maxFileSize: 10 * 1024 * 1024 // 10MB
 * });
 * ```
 */
export { useFileSelector } from './useFileSelector';

// ============================================================================
// Type Exports for External Integration
// ============================================================================

/**
 * Type definitions for useFileApi hook return value.
 * 
 * Includes all API operation functions, state properties, and error handling
 * for comprehensive type safety in consuming components.
 */
export type { UseFileApiReturn } from './useFileApi';

/**
 * Configuration options for useFileApi hook initialization.
 * 
 * Defines service endpoints, authentication settings, and API client
 * configuration for file operations.
 */
export type { UseFileApiOptions } from './useFileApi';

/**
 * Type definitions for useFileSelector hook return value.
 * 
 * Includes selection state, navigation properties, and interaction handlers
 * for type-safe file selector component integration.
 */
export type { UseFileSelectorReturn } from './useFileSelector';

/**
 * Configuration options for useFileSelector hook initialization.
 * 
 * Defines selection constraints, file type restrictions, validation rules,
 * and behavior settings for file selector customization.
 */
export type { UseFileSelectorOptions } from './useFileSelector';

/**
 * Combined configuration interface for file selector components.
 * 
 * Merges both useFileApi and useFileSelector options for comprehensive
 * file selector setup in complex use cases.
 */
export type { FileSelectionConfig } from './useFileSelector';

// ============================================================================
// Re-exported Utility Types
// ============================================================================

/**
 * File upload progress tracking interface.
 * 
 * Provides detailed progress information for individual file uploads
 * including percentage, bytes transferred, and estimated completion time.
 */
export type { FileUploadProgress } from './useFileApi';

/**
 * File operation error interface.
 * 
 * Standardized error format for file API operations with error codes,
 * user-friendly messages, and debugging information.
 */
export type { FileApiError } from './useFileApi';

/**
 * File validation result interface.
 * 
 * Returns validation status, error messages, and suggested corrections
 * for file selection and upload operations.
 */
export type { FileValidationResult } from './useFileSelector';

// ============================================================================
// Hook Composition Utilities
// ============================================================================

/**
 * Combined file selector hooks for simplified integration.
 * 
 * Provides a unified interface combining both useFileApi and useFileSelector
 * hooks for components that need comprehensive file management capabilities.
 * 
 * @example
 * ```typescript
 * const fileSelector = useFileManager({
 *   maxFiles: 3,
 *   allowedTypes: ['image/*'],
 *   serviceUrl: '/api/files',
 *   enableUpload: true
 * });
 * 
 * // Access both API and selector functionality
 * const { api, selector } = fileSelector;
 * ```
 */
export type { UseFileManagerReturn } from './useFileSelector';

// ============================================================================
// Export Summary
// ============================================================================

/**
 * Summary of exported hooks and utilities:
 * 
 * **Core Hooks:**
 * - `useFileApi` - File system API operations and data fetching
 * - `useFileSelector` - File selection state and interaction management
 * 
 * **Type Exports:**
 * - All hook return types for external integration
 * - Configuration option interfaces
 * - Utility types for progress tracking and error handling
 * 
 * **Features:**
 * - Tree-shaking optimized exports
 * - Comprehensive TypeScript type safety
 * - Extensive JSDoc documentation
 * - Flexible configuration options
 * - Standardized error handling
 * - Progress tracking capabilities
 * 
 * **Performance Optimizations:**
 * - React Query integration for intelligent caching
 * - Optimistic updates for better UX
 * - Automatic retry logic with exponential backoff
 * - Request deduplication and batching
 * - Memory-efficient file handling for large uploads
 */