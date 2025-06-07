/**
 * OpenAPI Preview Module - Main Export File
 * 
 * Centralized barrel export for all OpenAPI documentation and testing components,
 * implementing F-006: API Documentation and Testing requirements with comprehensive
 * @swagger-ui/react integration, MSW testing utilities, and type-safe interfaces.
 * 
 * This module provides the complete public API for OpenAPI preview functionality
 * including interactive documentation viewing, API key management, documentation
 * listing, and comprehensive testing utilities.
 * 
 * Features:
 * - OpenAPI specification viewing with SwaggerUI integration
 * - API documentation list with virtualized table rendering
 * - Secure API key selection and management
 * - Type-safe interfaces with Zod schema validation
 * - MSW integration for realistic API testing
 * - Tree-shaking friendly exports for Turbopack optimization
 * 
 * @fileoverview Main export file for OpenAPI preview module implementing F-006 requirements
 * @version 1.0.0
 * @since React 19.0.0 + Next.js 15.1 + TypeScript 5.8+
 */

// ============================================================================
// PRIMARY COMPONENTS
// ============================================================================

/**
 * Main OpenAPI viewer component with @swagger-ui/react integration
 * Supports interactive documentation, API testing, and authentication
 */
export { 
  OpenAPIViewer, 
  default as OpenAPIViewerDefault 
} from './openapi-viewer';

/**
 * API documentation list component with virtual scrolling and search
 * Implements TanStack Table for large dataset handling per F-002-RQ-002
 */
export { 
  ApiDocsList, 
  default as ApiDocsListDefault 
} from './api-docs-list';

/**
 * API key selector component with secure preview and clipboard operations
 * Provides authentication context for API documentation testing
 */
export { 
  ApiKeySelector, 
  default as ApiKeySelectorDefault 
} from './api-key-selector';

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

/**
 * Core OpenAPI specification and documentation types
 * Provides comprehensive type safety for API documentation workflows
 */
export type {
  // OpenAPI Specification Types
  OpenAPISpecification,
  OpenAPIInfo,
  OpenAPIServer,
  OpenAPIServerVariable,
  OpenAPIPathItem,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  OpenAPIMediaType,
  OpenAPISchema,
  OpenAPIComponents,
  OpenAPISecurityScheme,
  OpenAPITag,
  OpenAPIContact,
  OpenAPILicense,
  OpenAPIExample,
  OpenAPIHeader,
  OpenAPILink,
  OpenAPICallback,
  OpenAPIEncoding,
  OpenAPIOAuthFlows,
  OpenAPIOAuthFlow,
  OpenAPISecurityRequirement,
  OpenAPIExternalDocumentation,

  // API Documentation Data Types
  ApiDocsRowData,
  ApiDocParameter,
  ApiDocResponse,
  ApiDocExample,
  ApiDocExampleRequest,
  ApiDocExampleResponse,
  ApiDocConstraints,

  // API Key Management Types
  ApiKeyInfo,
  ApiKeyPermission,
  ApiKeyRateLimit,
  CreateApiKeyRequest,
  ApiKeyValidationResponse,

  // Service Information Types
  ServiceInfo,
  ServiceConfig,
  ApiDocumentationMetadata,
  ServiceEndpoint,
  ServiceHealthStatus,

  // SwaggerUI Integration Types
  SwaggerUIConfig,
  SwaggerUIComponentProps,
  SwaggerUITheme,

  // React Component Props Types
  OpenAPIPreviewProps,
  ApiDocumentationPreviewProps,
  ApiTestingInterfaceProps,
  OpenAPISpecViewerProps,
  ApiKeySelectorProps,

  // API Call and Testing Types
  ApiCallInfo,
  ApiCallResponse,
  ApiTestResult,
  PerformanceMetrics,
  AuthInfo,
  ValidationError,

  // Utility Types
  InferZodType,
  ApiDocumentationData,
  ComponentPropsUnion,
  PartialUpdate,
} from './types';

/**
 * Type guard functions for runtime type checking
 * Enables safe type assertions and validation in OpenAPI workflows
 */
export {
  isOpenAPISpecification,
  isApiDocsRowData,
  isServiceInfo,
  isApiKeyInfo,
} from './types';

/**
 * Zod validation schemas for runtime type checking
 * Provides compile-time and runtime type safety for API data
 */
export {
  schemas,
  OpenAPISpecificationSchema,
  ApiDocsRowDataSchema,
  ApiKeyInfoSchema,
  ServiceInfoSchema,
  OpenAPIPreviewPropsSchema,
  SwaggerUIConfigSchema,
} from './types';

/**
 * Default configuration objects for common use cases
 * Provides sensible defaults for OpenAPI preview components
 */
export {
  DEFAULT_SWAGGER_CONFIG,
  DEFAULT_OPENAPI_PREVIEW_PROPS,
} from './types';

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * SwaggerUI configuration constants and theme definitions
 * Supports consistent styling and behavior across OpenAPI components
 */
export {
  SWAGGER_UI_CONFIG,
  SWAGGER_UI_THEMES,
  SWAGGER_UI_PLUGINS,
} from './constants';

/**
 * API documentation display and pagination configuration
 * Optimized for large dataset handling with virtual scrolling
 */
export {
  API_DOCS_DISPLAY,
} from './constants';

/**
 * React Query caching configuration for OpenAPI data
 * Provides intelligent caching strategies per React/Next.js Integration Requirements
 */
export {
  REACT_QUERY_CONFIG,
} from './constants';

/**
 * User experience constants for notifications and interactions
 * Ensures consistent timing and feedback across OpenAPI components
 */
export {
  USER_EXPERIENCE,
} from './constants';

/**
 * API key management configuration for security and display
 * Implements secure API key handling with preview truncation
 */
export {
  API_KEY_CONFIG,
} from './constants';

/**
 * File download configuration for OpenAPI specifications
 * Supports multiple export formats (JSON, YAML) with proper MIME types
 */
export {
  FILE_DOWNLOAD,
} from './constants';

/**
 * Error handling configuration for consistent error management
 * Provides type-specific error handling and recovery strategies
 */
export {
  ERROR_HANDLING,
} from './constants';

/**
 * Performance monitoring constants for OpenAPI components
 * Supports performance tracking and optimization per F-006 requirements
 */
export {
  PERFORMANCE,
} from './constants';

/**
 * Configuration type exports for TypeScript integration
 * Enables type-safe configuration object usage
 */
export type {
  SwaggerUIConfig as SwaggerUIConfigType,
  SwaggerUITheme as SwaggerUIThemeType,
  ApiDocsDisplay,
  ReactQueryConfig,
  UserExperience,
  ApiKeyConfig,
  ErrorHandling,
  Performance,
} from './constants';

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Comprehensive testing utilities for OpenAPI preview components
 * Supports Vitest integration with MSW handlers and React Testing Library
 */
export {
  // Test Setup and Configuration
  setupOpenAPIPreviewTests,
  cleanupOpenAPIPreviewTests,
  createTestQueryClient,
  
  // Mock Service Worker Handlers
  openApiPreviewHandlers,
  apiDocsHandlers,
  apiKeyHandlers,
  serviceHandlers,
  
  // Test Render Utilities
  renderWithOpenAPIPreviewProviders,
  renderOpenAPIViewer,
  renderApiDocsList,
  renderApiKeySelector,
  
  // Mock Data and Fixtures
  mockOpenAPISpecification,
  mockApiDocsData,
  mockApiKeyData,
  mockServiceData,
  mockServiceTypes,
  mockApiCallInfo,
  mockAuthInfo,
  mockValidationErrors,
  
  // Test Utilities and Helpers
  waitForOpenAPISpecLoad,
  waitForApiDocsLoad,
  triggerApiKeySelection,
  simulateApiCall,
  assertSwaggerUIRender,
  assertApiDocsTable,
  assertApiKeySelector,
} from './test-utilities';

/**
 * Test utility types for OpenAPI preview testing
 * Provides type safety for test utilities and mock data
 */
export type {
  OpenAPIPreviewTestOptions,
  MockOpenAPISpecificationOptions,
  MockApiDocsOptions,
  MockApiKeyOptions,
  TestRenderOptions,
  ApiCallSimulationOptions,
} from './test-utilities';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

/**
 * Re-export commonly used external types for convenience
 * Reduces import complexity for consumers of this module
 */
export type {
  // React types for component integration
  ComponentProps,
  ReactNode,
  
  // External library types used in OpenAPI components
  SwaggerUIBundle,
} from './types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility functions for OpenAPI specification manipulation
 * Provides helper functions for common OpenAPI operations
 */
export const OpenAPIUtils = {
  /**
   * Validates an OpenAPI specification using Zod schema
   */
  validateOpenAPISpec: (spec: unknown): spec is OpenAPISpecification => {
    return isOpenAPISpecification(spec);
  },
  
  /**
   * Extracts service endpoints from OpenAPI specification
   */
  extractEndpoints: (spec: OpenAPISpecification): ServiceEndpoint[] => {
    const endpoints: ServiceEndpoint[] = [];
    
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return;
      
      const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
      methods.forEach(method => {
        const operation = pathItem[method];
        if (operation) {
          endpoints.push({
            path,
            method: method.toUpperCase() as ServiceEndpoint['method'],
            operationId: operation.operationId,
            summary: operation.summary,
            description: operation.description,
            tags: operation.tags,
            parameters: operation.parameters,
            authenticated: !!operation.security?.length,
            deprecated: !!operation['x-deprecated'],
          });
        }
      });
    });
    
    return endpoints;
  },
  
  /**
   * Generates API key authentication headers
   */
  generateAuthHeaders: (apiKey: string, sessionToken?: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    
    if (apiKey) {
      headers['X-DreamFactory-API-Key'] = apiKey;
    }
    
    if (sessionToken) {
      headers['X-DreamFactory-Session-Token'] = sessionToken;
    }
    
    return headers;
  },
  
  /**
   * Formats API documentation data for display
   */
  formatApiDocsData: (services: ServiceInfo[]): ApiDocsRowData[] => {
    return services
      .filter(service => service.isActive)
      .map(service => ({
        name: service.name,
        label: service.label,
        description: service.description,
        group: service.type,
        type: service.type,
        endpoint: `/api/v2/${service.name}`,
        lastModified: service.lastModifiedDate,
        deprecated: false,
      }));
  },
} as const;

/**
 * Constants for OpenAPI preview module metadata
 * Provides version and feature information for the module
 */
export const OpenAPIPreviewModule = {
  version: '1.0.0',
  features: [
    'Interactive OpenAPI documentation with SwaggerUI',
    'API documentation list with virtual scrolling',
    'Secure API key management and selection',
    'Comprehensive testing utilities with MSW',
    'Type-safe interfaces with Zod validation',
    'Tree-shaking optimized exports',
  ],
  requirements: [
    'F-006: API Documentation and Testing',
    'React/Next.js Integration Requirements',
    'Turbopack build optimization',
    'Section 3.6 Enhanced Testing Pipeline',
  ],
  dependencies: {
    react: '^19.0.0',
    next: '^15.1.0',
    '@swagger-ui/react': 'latest',
    '@tanstack/react-query': '^5.0.0',
    '@tanstack/react-table': '^8.0.0',
    '@tanstack/react-virtual': '^3.0.0',
    '@headlessui/react': '^2.0.0',
    'tailwindcss': '^4.1.0',
    'zod': '^3.22.0',
    'msw': '^2.0.0',
    'vitest': '^2.1.0',
  },
} as const;

// ============================================================================
// MODULE METADATA
// ============================================================================

/**
 * OpenAPI Preview Module Metadata
 * Provides comprehensive information about the module capabilities
 */
export default {
  // Primary exports
  OpenAPIViewer,
  ApiDocsList,
  ApiKeySelector,
  
  // Utilities
  OpenAPIUtils,
  
  // Module information
  ...OpenAPIPreviewModule,
} as const;