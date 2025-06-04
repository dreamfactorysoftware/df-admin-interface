/**
 * OpenAPI Preview Module
 * 
 * Centralized exports for OpenAPI documentation and testing components implementing 
 * F-006: API Documentation and Testing with @swagger-ui/react integration.
 * 
 * This module provides a clean public API surface for:
 * - Interactive OpenAPI documentation viewing with SwaggerUI
 * - API documentation service management and listing
 * - API key selection and management
 * - Type-safe interfaces and configuration constants
 * - Comprehensive testing utilities with MSW integration
 * 
 * @see Technical Specification Section 2.1 Feature Catalog F-006
 * @see React/Next.js Integration Requirements for modular component architecture
 */

// Primary Components
export { default as OpenAPIViewer } from './openapi-viewer';
export { default as ApiDocsList } from './api-docs-list';
export { default as ApiKeySelector } from './api-key-selector';

// Types and Interfaces
export type {
  OpenAPIViewerProps,
  ApiDocsListProps,
  ApiKeySelectorProps,
  OpenAPISpecification,
  APIDocumentationInfo,
  APIKeyInfo,
  ServiceDocumentationData,
  SwaggerUIConfig,
  DocumentationTheme,
  PreviewSettings,
  APITestingConfig,
} from './types';

// Constants and Configuration
export {
  SWAGGER_UI_CONFIG,
  DEFAULT_SWAGGER_THEME,
  API_DOCS_PAGINATION,
  PREVIEW_SETTINGS,
  CLIPBOARD_SETTINGS,
  QUERY_KEYS,
  ERROR_MESSAGES,
  DOCUMENTATION_PATHS,
} from './constants';

// Zod Schemas for Validation
export {
  openAPISpecificationSchema,
  apiDocumentationInfoSchema,
  apiKeyInfoSchema,
  swaggerUIConfigSchema,
  previewSettingsSchema,
} from './types';

// Re-export commonly used hooks for OpenAPI functionality
// These hooks are imported from the global hooks directory but re-exported
// here for convenience when working with OpenAPI preview components
export { useAPIKeys } from '../../hooks/use-api-keys';
export { useApiDocs } from '../../hooks/use-api-docs';
export { useClipboard } from '../../hooks/use-clipboard';
export { useTheme } from '../../hooks/use-theme';
export { useServices } from '../../hooks/use-services';

// Test Utilities
// Re-export comprehensive testing infrastructure for OpenAPI preview components
export * from './test-utilities';

/**
 * Default export providing the main OpenAPI documentation viewer component
 * for convenient single-component imports
 */
export { default } from './openapi-viewer';