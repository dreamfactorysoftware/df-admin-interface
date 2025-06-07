/**
 * Script Editor Component - Barrel Export
 * 
 * Centralized export module for the comprehensive script editor component system.
 * Provides clean, tree-shakable imports for all script editor functionality including
 * the main React component, custom hooks, TypeScript definitions, validation schemas,
 * and utility functions. Follows established UI component library patterns for
 * consistent import statements throughout the application.
 * 
 * Features:
 * - Tree-shaking optimized exports for Turbopack build optimization
 * - TypeScript type definitions for external component integration
 * - Named and default export patterns for flexible usage scenarios
 * - Comprehensive hook exports for custom implementations
 * - Validation schema exports for form integration
 * - Utility function exports for standalone usage
 * - Documentation comments for all exported interfaces
 * 
 * @fileoverview Barrel export for script editor component system
 * @version 1.0.0
 * @since 2024-01-01
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Main ScriptEditor component
 * 
 * Comprehensive React 19 script editor component with ACE editor integration,
 * file upload capabilities, GitHub import functionality, storage service management,
 * and cache operations. Provides full-featured script editing with real-time
 * validation, syntax highlighting, and DreamFactory API compatibility.
 * 
 * @example
 * ```tsx
 * import { ScriptEditor } from '@/components/ui/script-editor';
 * 
 * function MyComponent() {
 *   return (
 *     <ScriptEditor
 *       value={content}
 *       onChange={handleContentChange}
 *       enableStorage={true}
 *       enableFileUpload={true}
 *       enableGitHubImport={true}
 *       language="javascript"
 *       onContentSave={handleSave}
 *     />
 *   );
 * }
 * ```
 */
export { ScriptEditor } from './script-editor';

/**
 * Default export for convenient importing
 * 
 * @example
 * ```tsx
 * import ScriptEditor from '@/components/ui/script-editor';
 * ```
 */
export { default } from './script-editor';

// =============================================================================
// CUSTOM HOOKS EXPORTS
// =============================================================================

/**
 * Main script editor hook for unified functionality
 * 
 * Comprehensive React hook that orchestrates all script editor functionality
 * including form management, storage services, file operations, GitHub integration,
 * and cache management. Provides the primary API for custom implementations.
 * 
 * @example
 * ```tsx
 * import { useScriptEditor } from '@/components/ui/script-editor';
 * 
 * function CustomScriptEditor() {
 *   const {
 *     form,
 *     storageServices,
 *     fileUpload,
 *     githubImport,
 *     cache,
 *     validation,
 *     utils
 *   } = useScriptEditor({
 *     defaultValues: { content: '', storageServiceId: '' },
 *     validation: { mode: 'onChange', debounceTime: 100 },
 *     onContentChange: handleContentChange,
 *   });
 * 
 *   return (
 *     // Custom implementation using hook data
 *   );
 * }
 * ```
 */
export {
  useScriptEditor,
  /**
   * Simplified hook with sensible defaults for common use cases
   * 
   * @example
   * ```tsx
   * const scriptEditor = useScriptEditorWithDefaults(
   *   initialContent,
   *   handleContentChange
   * );
   * ```
   */
  useScriptEditorWithDefaults,
  /**
   * Hook for integration with external form controls
   * 
   * @example
   * ```tsx
   * const scriptEditor = useScriptEditorFormIntegration(form, 'scriptContent');
   * ```
   */
  useScriptEditorFormIntegration,
} from './hooks/use-script-editor';

// =============================================================================
// TYPE DEFINITIONS EXPORTS
// =============================================================================

/**
 * Core component props and configuration interfaces
 * 
 * Essential TypeScript interfaces for script editor component usage,
 * configuration, and integration with other components.
 */
export type {
  /**
   * Main component props interface with comprehensive configuration options
   */
  ScriptEditorProps,
  /**
   * ACE editor specific configuration options
   */
  AceEditorConfig,
  /**
   * Layout and display configuration for the editor
   */
  ScriptEditorLayout,
  /**
   * Supported programming languages for syntax highlighting
   */
  ScriptLanguage,
  /**
   * Available editor theme options
   */
  EditorTheme,
} from './types';

/**
 * Storage service integration interfaces
 * 
 * TypeScript definitions for storage service management, configuration,
 * and DreamFactory API compatibility.
 */
export type {
  /**
   * Storage service configuration and management
   */
  StorageService,
  StorageServiceConfig,
  StorageServiceType,
  StorageServiceApiConfig,
  StorageServiceAuth,
  /**
   * Storage path validation configuration
   */
  StoragePathValidation,
  /**
   * OAuth configuration for storage services
   */
  OAuthConfig,
} from './types';

/**
 * File upload functionality interfaces
 * 
 * TypeScript definitions for file upload operations, validation,
 * progress tracking, and metadata management.
 */
export type {
  /**
   * File upload configuration and state management
   */
  FileUploadConfig,
  FileUploadState,
  FileUploadValidation,
  FileUploadResult,
  /**
   * File metadata and content information
   */
  FileMetadata,
} from './types';

/**
 * GitHub integration interfaces
 * 
 * TypeScript definitions for GitHub file import functionality,
 * authentication, and repository access management.
 */
export type {
  /**
   * GitHub integration configuration and authentication
   */
  GitHubIntegrationConfig,
  GitHubAuthConfig,
  GitHubFileFilter,
  /**
   * GitHub file metadata and import operations
   */
  GitHubFileMetadata,
  GitHubImportState,
  GitHubImportResult,
} from './types';

/**
 * Cache management interfaces
 * 
 * TypeScript definitions for script caching operations,
 * invalidation strategies, and storage backends.
 */
export type {
  /**
   * Cache configuration and management
   */
  CacheConfig,
  CacheStorageType,
  CacheInvalidationConfig,
  /**
   * Cache operation types and results
   */
  CacheOperation,
  CacheOperationResult,
  CacheContent,
} from './types';

/**
 * Form integration and validation interfaces
 * 
 * TypeScript definitions for React Hook Form integration,
 * Zod schema validation, and real-time form state management.
 */
export type {
  /**
   * Form data structure and validation
   */
  ScriptEditorFormData,
  /**
   * Hook configuration and return interfaces
   */
  UseScriptEditorConfig,
  UseScriptEditorReturn,
  /**
   * State management interfaces
   */
  ScriptEditorErrorState,
  ScriptEditorLoadingState,
  ScriptEditorValidationState,
} from './types';

/**
 * Metadata and utility interfaces
 * 
 * TypeScript definitions for script metadata, error handling,
 * event management, and theme configuration.
 */
export type {
  /**
   * Script metadata and content information
   */
  ScriptMetadata,
  /**
   * Error handling and state management
   */
  ScriptEditorError,
  /**
   * Event handler interfaces
   */
  ScriptEditorEventHandlers,
  /**
   * Theme and styling configuration
   */
  ScriptEditorThemeProps,
} from './types';

// =============================================================================
// VALIDATION SCHEMA EXPORTS
// =============================================================================

/**
 * Zod validation schemas for runtime type checking and form validation
 * 
 * Pre-configured validation schemas for all script editor form data,
 * file uploads, and GitHub import operations. Provides runtime type
 * safety and comprehensive validation rules.
 */
export {
  /**
   * Main form validation schema for script editor
   * 
   * @example
   * ```tsx
   * import { ScriptEditorFormSchema } from '@/components/ui/script-editor';
   * 
   * const form = useForm({
   *   resolver: zodResolver(ScriptEditorFormSchema),
   *   defaultValues: { content: '', storageServiceId: '' }
   * });
   * ```
   */
  ScriptEditorFormSchema,
  /**
   * File upload validation schema
   * 
   * @example
   * ```tsx
   * const isValid = FileUploadSchema.safeParse({
   *   file: selectedFile,
   *   size: selectedFile.size,
   *   type: selectedFile.type
   * }).success;
   * ```
   */
  FileUploadSchema,
  /**
   * GitHub import validation schema
   * 
   * @example
   * ```tsx
   * const validation = GitHubImportSchema.safeParse({
   *   owner: 'username',
   *   repo: 'repository',
   *   branch: 'main',
   *   path: 'scripts/example.js'
   * });
   * ```
   */
  GitHubImportSchema,
} from './types';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Utility functions for standalone usage and custom implementations
 * 
 * Helper functions extracted from the main hook for use in custom
 * implementations, testing, or standalone script processing.
 */
export {
  /**
   * Automatically detect script language from content and filename
   * 
   * @param content - Script content to analyze
   * @param filename - Optional filename for extension-based detection
   * @returns Detected script language type
   * 
   * @example
   * ```tsx
   * import { detectScriptLanguage } from '@/components/ui/script-editor';
   * 
   * const language = detectScriptLanguage(
   *   'function hello() { console.log("Hello!"); }',
   *   'script.js'
   * ); // Returns 'javascript'
   * ```
   */
  detectScriptLanguage,
  /**
   * Generate comprehensive script metadata from content and context
   * 
   * @param content - Script content
   * @param filename - Optional filename
   * @param storageServiceId - Optional storage service ID
   * @param storagePath - Optional storage path
   * @returns Generated script metadata object
   * 
   * @example
   * ```tsx
   * const metadata = generateScriptMetadata(
   *   scriptContent,
   *   'my-script.js',
   *   'github_service',
   *   '/scripts/my-script.js'
   * );
   * ```
   */
  generateScriptMetadata,
  /**
   * Create standardized error state objects
   * 
   * @param type - Error type classification
   * @param message - Human-readable error message
   * @param details - Optional error details
   * @param code - Optional error code
   * @param recoverable - Whether error is recoverable
   * @returns Standardized error state object
   * 
   * @example
   * ```tsx
   * const error = createErrorState(
   *   'validation_error',
   *   'Content validation failed',
   *   'Line 5: Syntax error',
   *   'VALIDATION_001',
   *   true
   * );
   * ```
   */
  createErrorState,
  /**
   * Create loading state objects for operation tracking
   * 
   * @param isLoading - Loading status
   * @param operation - Optional operation type
   * @param details - Optional operation details
   * @param cancellable - Whether operation can be cancelled
   * @returns Standardized loading state object
   * 
   * @example
   * ```tsx
   * const loading = createLoadingState(
   *   true,
   *   'uploading_file',
   *   'Uploading script.js...',
   *   true
   * );
   * ```
   */
  createLoadingState,
} from './hooks/use-script-editor';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Re-export common UI component types for convenience
 * 
 * Makes frequently used base component interfaces available
 * from the script editor module for consistent typing.
 */
export type {
  /**
   * Base component props for HTML elements
   */
  BaseComponentProps,
  /**
   * Form-specific component props
   */
  FormComponentProps,
  /**
   * Theme-aware component props
   */
  ThemeProps,
  /**
   * Accessibility-focused component props
   */
  AccessibilityProps,
  /**
   * Loading state interface
   */
  LoadingState,
  /**
   * Validation state interface
   */
  ValidationState,
} from '../../../types/ui';

// =============================================================================
// TYPE-ONLY EXPORTS
// =============================================================================

/**
 * Type-only exports for advanced use cases
 * 
 * Additional type exports that are only available as types
 * for advanced usage scenarios and type-level programming.
 */
export type {
  /**
   * Generic API response wrapper type
   */
  ApiResponse,
  /**
   * DreamFactory-compatible list response format
   */
  GenericListResponse,
  /**
   * Service group classification type
   */
  ServiceGroup,
  /**
   * Cache invalidation trigger types
   */
  CacheInvalidationTrigger,
  /**
   * File upload data type from schema
   */
  FileUploadData,
  /**
   * GitHub import data type from schema
   */
  GitHubImportData,
} from './types';

// =============================================================================
// DOCUMENTATION AND EXAMPLES
// =============================================================================

/**
 * Usage Examples and Best Practices
 * 
 * @example Basic Script Editor Usage
 * ```tsx
 * import { ScriptEditor } from '@/components/ui/script-editor';
 * 
 * function BasicEditor() {
 *   const [content, setContent] = useState('');
 * 
 *   return (
 *     <ScriptEditor
 *       value={content}
 *       onChange={setContent}
 *       language="javascript"
 *       enableFileUpload={true}
 *       onContentSave={async (content) => {
 *         await saveScript(content);
 *       }}
 *     />
 *   );
 * }
 * ```
 * 
 * @example Advanced Hook Usage
 * ```tsx
 * import { useScriptEditor } from '@/components/ui/script-editor';
 * 
 * function AdvancedEditor() {
 *   const {
 *     form,
 *     storageServices,
 *     fileUpload,
 *     githubImport,
 *     cache,
 *     validation,
 *     utils
 *   } = useScriptEditor({
 *     defaultValues: {
 *       content: initialContent,
 *       storageServiceId: 'github_service',
 *       storagePath: '/scripts/main.js',
 *       language: 'javascript'
 *     },
 *     validation: {
 *       mode: 'onChange',
 *       debounceTime: 100
 *     },
 *     storage: {
 *       pathValidation: {
 *         requiredWhenServiceSelected: true,
 *         allowedPatterns: ['^/scripts/.*\\.js$']
 *       }
 *     },
 *     onContentChange: (content) => {
 *       console.log('Content changed:', content.length, 'characters');
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * 
 *   return (
 *     <form onSubmit={form.handleSubmit(handleSave)}>
 *       <Controller
 *         control={form.control}
 *         name="content"
 *         render={({ field }) => (
 *           <AceEditor
 *             value={field.value}
 *             onChange={field.onChange}
 *             mode={form.getValues('language')}
 *           />
 *         )}
 *       />
 *       {/* Additional form controls */}
 *     </form>
 *   );
 * }
 * ```
 * 
 * @example Type-Safe Configuration
 * ```tsx
 * import type {
 *   ScriptEditorProps,
 *   UseScriptEditorConfig,
 *   StorageService
 * } from '@/components/ui/script-editor';
 * 
 * const editorConfig: UseScriptEditorConfig = {
 *   defaultValues: {
 *     content: '',
 *     language: 'typescript'
 *   },
 *   validation: {
 *     mode: 'onChange',
 *     debounceTime: 50
 *   }
 * };
 * 
 * const storageServices: StorageService[] = [
 *   {
 *     id: 'github',
 *     name: 'GitHub Storage',
 *     type: 'github',
 *     group: 'source control',
 *     is_active: true
 *   }
 * ];
 * ```
 */

// =============================================================================
// COMPONENT METADATA
// =============================================================================

/**
 * Component metadata for development tools and documentation
 */
if (process.env.NODE_ENV === 'development') {
  /**
   * Development-only metadata for component introspection
   */
  (ScriptEditor as any).__componentMetadata = {
    displayName: 'ScriptEditor',
    version: '1.0.0',
    dependencies: [
      'react',
      'react-hook-form',
      'zod',
      '@tanstack/react-query',
      'lucide-react'
    ],
    features: [
      'ACE editor integration',
      'File upload support',
      'GitHub import functionality',
      'Storage service management',
      'Cache operations',
      'Real-time validation',
      'Syntax highlighting',
      'Theme support',
      'Accessibility compliance'
    ],
    performance: {
      validationResponseTime: '< 100ms',
      cacheHitResponseTime: '< 50ms',
      treeshakingOptimized: true,
      turbopackCompatible: true
    }
  };
}