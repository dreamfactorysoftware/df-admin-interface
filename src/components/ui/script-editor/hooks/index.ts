/**
 * Script Editor Hooks - Barrel Export Module
 * 
 * Centralized export module for all script editor React hooks, providing clean import patterns
 * and optimal tree-shaking support for the Turbopack build pipeline. This module replaces the
 * Angular service-based architecture with modern React hooks patterns, supporting React 19
 * concurrent features and TypeScript 5.8+ strict typing.
 * 
 * Features:
 * - Tree-shaking optimized exports for Turbopack build pipeline per Section 3.2.5
 * - TypeScript 5.8+ module system best practices with comprehensive type exports
 * - Clean import patterns supporting both named and default imports throughout the application
 * - React 19 concurrent features compatibility with server component integration
 * - Next.js 15.1+ import/export patterns for optimal performance and developer experience
 * - Component composition patterns for reusable hook libraries across the script editor ecosystem
 * 
 * @fileoverview Barrel export module for script editor hooks with tree-shaking optimization
 * @version 1.0.0
 * @since 2024-01-01
 * 
 * @example
 * ```typescript
 * // Import primary hooks
 * import { useScriptEditor, useStorageServices, useScriptFile } from '@/components/ui/script-editor/hooks';
 * 
 * // Import specific utilities
 * import { validateGitHubUrl, detectScriptLanguage } from '@/components/ui/script-editor/hooks';
 * 
 * // Import types
 * import type { 
 *   UseScriptEditorConfig, 
 *   UseScriptEditorReturn 
 * } from '@/components/ui/script-editor/hooks';
 * ```
 */

// =============================================================================
// PRIMARY HOOK EXPORTS
// =============================================================================

/**
 * Main Script Editor Hook
 * 
 * Comprehensive orchestrating hook that integrates all script editor functionality
 * into a unified interface with React Hook Form integration, file operations,
 * storage services, GitHub integration, and cache management.
 * 
 * @see useScriptEditor for detailed documentation and usage examples
 */
export {
  useScriptEditor,
  useScriptEditorWithDefaults,
  useScriptEditorFormIntegration,
  default as useScriptEditorDefault,
} from './use-script-editor';

/**
 * Storage Services Management Hook
 * 
 * React Query-powered hook for fetching and managing storage services with
 * intelligent caching, group-based filtering, and automatic background revalidation.
 * Replaces Angular baseService.getAll() patterns with modern data fetching.
 * 
 * @see useStorageServices for detailed documentation and usage examples
 */
export {
  useStorageServices,
  default as useStorageServicesDefault,
} from './useStorageServices';

/**
 * Script File Upload Hook
 * 
 * Comprehensive file upload and content reading hook with progress tracking,
 * validation, error handling, and React Hook Form integration. Provides native
 * File API integration with comprehensive security validation.
 * 
 * @see useScriptFile for detailed documentation and usage examples
 */
export {
  useScriptFile,
  default as useScriptFileDefault,
} from './useScriptFile';

/**
 * GitHub Import Management Hook
 * 
 * React hook for managing GitHub script import functionality with React Query
 * integration, dialog state management, and comprehensive error handling.
 * Provides GitHub API integration with Base64 content decoding.
 * 
 * @see useGithubImport for detailed documentation and usage examples
 */
export {
  useGithubImport,
  default as useGithubImportDefault,
} from './useGithubImport';

/**
 * Script Cache Operations Hook
 * 
 * React hook for managing script cache operations including viewing latest
 * cached scripts and cache deletion with React Query integration, optimistic
 * updates, and comprehensive error handling.
 * 
 * @see useScriptCache for detailed documentation and usage examples
 */
export {
  useScriptCache,
  useScriptCacheWithDefaults,
  default as useScriptCacheDefault,
} from './useScriptCache';

/**
 * Storage Path Validation Hook
 * 
 * Hook for managing storage path validation logic and form control integration.
 * Handles dynamic validation requirements where storage path becomes required
 * when a storage service is selected, with React Hook Form integration.
 * 
 * @see useStorageValidation for detailed documentation and usage examples
 */
export {
  useStorageValidation,
  default as useStorageValidationDefault,
} from './useStorageValidation';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Script Editor Utility Functions
 * 
 * Collection of utility functions for script content processing, metadata
 * generation, and error handling. These functions support the main hooks
 * and can be used independently for custom implementations.
 */
export {
  // Script content utilities
  detectScriptLanguage,
  generateScriptMetadata,
  // Error handling utilities
  createErrorState,
  createLoadingState,
} from './use-script-editor';

/**
 * Storage Services Utility Functions
 * 
 * Helper functions for filtering, sorting, and managing storage services
 * data. Provides common operations for storage service collections.
 */
export {
  // Storage service filtering and management
  filterStorageServicesByType,
  getActiveStorageServices,
  sortStorageServicesByName,
  // Query key factory for cache management
  storageServicesQueryKeys,
} from './useStorageServices';

/**
 * GitHub Import Utility Functions
 * 
 * Standalone utility functions for GitHub URL validation, Base64 content
 * decoding, and file extension checking. Can be used independently of
 * the main GitHub import hook.
 */
export {
  // GitHub URL and content utilities
  validateGitHubUrl,
  decodeBase64Content,
  isSupportedFileExtension,
} from './useGithubImport';

/**
 * Script Cache Utility Functions
 * 
 * Helper functions for cache operations, content validation, and cache
 * path construction. Supports cache management operations.
 */
export {
  // Cache operation utilities
  createCacheOperation,
} from './useScriptCache';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Script Editor Hook Types
 * 
 * Comprehensive type definitions for the main script editor hook including
 * configuration options, return interfaces, form data structures, and
 * state management types.
 */
export type {
  // Main hook types
  UseScriptEditorConfig,
  UseScriptEditorReturn,
  ScriptEditorFormData,
  ScriptEditorErrorState,
  ScriptEditorLoadingState,
  ScriptEditorValidationState,
} from './use-script-editor';

/**
 * Storage Services Hook Types
 * 
 * Type definitions for storage services management including options,
 * return interfaces, and query result types.
 */
export type {
  // Storage services types
  UseStorageServicesOptions,
  UseStorageServicesReturn,
  StorageServicesQueryResult,
} from './useStorageServices';

/**
 * Script File Upload Hook Types
 * 
 * Type definitions for file upload operations including configuration,
 * state management, and validation interfaces.
 */
export type {
  // File upload types
  UseScriptFileConfig,
  UseScriptFileReturn,
} from './useScriptFile';

/**
 * GitHub Import Hook Types
 * 
 * Type definitions for GitHub import functionality including configuration,
 * state management, dialog interfaces, and API response types.
 */
export type {
  // GitHub import types
  UseGithubImportConfig,
  UseGithubImportReturn,
  GitHubImportState,
  RepositoryAccessParams,
  FileContentParams,
} from './useGithubImport';

/**
 * Script Cache Hook Types
 * 
 * Type definitions for cache management operations including configuration,
 * return interfaces, and operation result types.
 */
export type {
  // Cache management types
  UseScriptCacheConfig,
  UseScriptCacheReturn,
  CacheServiceResponse,
  CacheContentItem,
  CacheError,
  CacheErrorType,
} from './useScriptCache';

/**
 * Storage Validation Hook Types
 * 
 * Type definitions for storage path validation including configuration,
 * validation results, and error code types.
 */
export type {
  // Storage validation types
  UseStorageValidationConfig,
  UseStorageValidationReturn,
  StorageValidationResult,
  StorageValidationErrorCode,
} from './useStorageValidation';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Convenience re-exports for commonly used patterns
 * 
 * These re-exports provide shorthand access to frequently used combinations
 * of hooks and utilities, following common usage patterns in the script editor.
 */

/**
 * Complete Script Editor Hook Suite
 * 
 * Object containing all primary hooks for comprehensive script editor functionality.
 * Useful for components that need access to multiple script editor capabilities.
 * 
 * @example
 * ```typescript
 * import { scriptEditorHooks } from '@/components/ui/script-editor/hooks';
 * 
 * const {
 *   useScriptEditor,
 *   useStorageServices,
 *   useScriptFile,
 *   useGithubImport,
 *   useScriptCache,
 *   useStorageValidation
 * } = scriptEditorHooks;
 * ```
 */
export const scriptEditorHooks = {
  useScriptEditor,
  useStorageServices,
  useScriptFile,
  useGithubImport,
  useScriptCache,
  useStorageValidation,
} as const;

/**
 * Script Editor Utilities Collection
 * 
 * Object containing all utility functions for script editor operations.
 * Provides a centralized access point for all helper functions.
 * 
 * @example
 * ```typescript
 * import { scriptEditorUtils } from '@/components/ui/script-editor/hooks';
 * 
 * const { detectScriptLanguage, validateGitHubUrl, createErrorState } = scriptEditorUtils;
 * ```
 */
export const scriptEditorUtils = {
  // Script processing utilities
  detectScriptLanguage,
  generateScriptMetadata,
  // Error handling utilities
  createErrorState,
  createLoadingState,
  // Storage utilities
  filterStorageServicesByType,
  getActiveStorageServices,
  sortStorageServicesByName,
  // GitHub utilities
  validateGitHubUrl,
  decodeBase64Content,
  isSupportedFileExtension,
  // Cache utilities
  createCacheOperation,
} as const;

// =============================================================================
// MODULE METADATA AND DOCUMENTATION
// =============================================================================

/**
 * Module metadata for development tools and debugging
 */
export const SCRIPT_EDITOR_HOOKS_METADATA = {
  version: '1.0.0',
  description: 'Script editor hooks barrel export module',
  hooks: [
    'useScriptEditor',
    'useStorageServices', 
    'useScriptFile',
    'useGithubImport',
    'useScriptCache',
    'useStorageValidation',
  ],
  utilities: [
    'detectScriptLanguage',
    'generateScriptMetadata',
    'validateGitHubUrl',
    'decodeBase64Content',
    'createErrorState',
    'createLoadingState',
  ],
  compatibility: {
    react: '19.0.0',
    nextjs: '15.1+',
    typescript: '5.8+',
  },
  buildOptimization: {
    treeShaking: true,
    turbopack: true,
    moduleFormat: 'ESM',
  },
} as const;

/**
 * Hook usage recommendations for different scenarios
 * 
 * Provides guidance on when and how to use different combinations of hooks
 * for optimal performance and developer experience.
 */
export const USAGE_RECOMMENDATIONS = {
  /**
   * For basic script editing with file upload
   */
  basic: ['useScriptEditor', 'useScriptFile'],
  
  /**
   * For script editing with storage service integration
   */
  withStorage: ['useScriptEditor', 'useStorageServices', 'useStorageValidation'],
  
  /**
   * For script editing with GitHub import capabilities
   */
  withGitHub: ['useScriptEditor', 'useGithubImport'],
  
  /**
   * For script editing with caching functionality
   */
  withCache: ['useScriptEditor', 'useScriptCache'],
  
  /**
   * For complete script editor functionality
   */
  complete: [
    'useScriptEditor',
    'useStorageServices',
    'useScriptFile',
    'useGithubImport',
    'useScriptCache',
    'useStorageValidation',
  ],
} as const;

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the main script editor hook for convenient importing
 * 
 * @example
 * ```typescript
 * import useScriptEditor from '@/components/ui/script-editor/hooks';
 * 
 * // Equivalent to:
 * import { useScriptEditor } from '@/components/ui/script-editor/hooks';
 * ```
 */
export { useScriptEditor as default };