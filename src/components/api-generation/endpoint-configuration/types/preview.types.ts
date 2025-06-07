/**
 * TypeScript type definitions for API endpoint preview functionality
 * Supporting real-time preview, OpenAPI specification generation, and live endpoint testing
 * Integrates with Next.js API routes for server-side preview validation per Section 5.2
 */

import { z } from 'zod';

// HTTP Methods supported for API generation
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// OpenAPI specification schema for validation
export const OpenAPISpecSchema = z.object({
  openapi: z.string().default('3.0.3'),
  info: z.object({
    title: z.string(),
    version: z.string(),
    description: z.string().optional(),
  }),
  servers: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
  paths: z.record(z.object({
    get: z.object({
      summary: z.string().optional(),
      parameters: z.array(z.any()).optional(),
      responses: z.record(z.any()),
    }).optional(),
    post: z.object({
      summary: z.string().optional(),
      requestBody: z.any().optional(),
      responses: z.record(z.any()),
    }).optional(),
    put: z.object({
      summary: z.string().optional(),
      requestBody: z.any().optional(),
      responses: z.record(z.any()),
    }).optional(),
    patch: z.object({
      summary: z.string().optional(),
      requestBody: z.any().optional(),
      responses: z.record(z.any()),
    }).optional(),
    delete: z.object({
      summary: z.string().optional(),
      responses: z.record(z.any()),
    }).optional(),
  })),
  components: z.object({
    schemas: z.record(z.any()).optional(),
    securitySchemes: z.record(z.any()).optional(),
  }).optional(),
});

export type OpenAPISpec = z.infer<typeof OpenAPISpecSchema>;

// Endpoint configuration interface
export interface EndpointConfiguration {
  serviceName: string;
  tableName: string;
  enabledMethods: HttpMethod[];
  baseUrl: string;
  apiPrefix: string;
  security: {
    requireAuth: boolean;
    allowedRoles: string[];
    rateLimiting?: {
      enabled: boolean;
      requestsPerMinute: number;
    };
  };
  parameters: {
    pagination: {
      enabled: boolean;
      defaultLimit: number;
      maxLimit: number;
    };
    filtering: {
      enabled: boolean;
      allowedFields: string[];
    };
    sorting: {
      enabled: boolean;
      allowedFields: string[];
    };
  };
  validation: {
    strict: boolean;
    customRules: Record<string, any>;
  };
}

// Preview request/response structures for live testing
export interface PreviewRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
}

export interface PreviewResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timestamp: string;
  responseTime: number;
}

// Configuration summary for display
export interface ConfigurationSummary {
  service: {
    name: string;
    type: string;
    database: string;
  };
  endpoints: {
    method: HttpMethod;
    path: string;
    description: string;
    requiresAuth: boolean;
  }[];
  security: {
    authenticationRequired: boolean;
    roleBasedAccess: boolean;
    rateLimitingEnabled: boolean;
  };
  features: {
    pagination: boolean;
    filtering: boolean;
    sorting: boolean;
    validation: boolean;
  };
}

// Export options for generated specifications
export interface ExportOptions {
  format: 'json' | 'yaml' | 'postman';
  includeExamples: boolean;
  includeSchemas: boolean;
  minifyOutput: boolean;
}

// Live testing state management
export interface TestingState {
  isLoading: boolean;
  activeRequest: PreviewRequest | null;
  lastResponse: PreviewResponse | null;
  error: string | null;
  requestHistory: Array<{
    request: PreviewRequest;
    response: PreviewResponse;
    timestamp: string;
  }>;
}

// Preview panel state for React hooks
export interface PreviewPanelState {
  activeTab: 'configuration' | 'openapi' | 'testing';
  configuration: EndpointConfiguration | null;
  openApiSpec: OpenAPISpec | null;
  testingState: TestingState;
  exportOptions: ExportOptions;
  isGenerating: boolean;
  lastUpdated: string | null;
}

// API route payload structures for Next.js integration
export interface GeneratePreviewRequest {
  configuration: EndpointConfiguration;
  options?: {
    includeExamples?: boolean;
    validateSchema?: boolean;
  };
}

export interface GeneratePreviewResponse {
  success: boolean;
  openApiSpec?: OpenAPISpec;
  summary?: ConfigurationSummary;
  validationErrors?: string[];
  generatedAt: string;
}

export interface TestEndpointRequest {
  configuration: EndpointConfiguration;
  testRequest: PreviewRequest;
}

export interface TestEndpointResponse {
  success: boolean;
  response?: PreviewResponse;
  error?: string;
  validationErrors?: string[];
}

// Error types for enhanced error handling
export interface PreviewError {
  type: 'validation' | 'generation' | 'testing' | 'export';
  message: string;
  details?: any;
  code?: string;
}

// Component props interfaces
export interface PreviewPanelProps {
  configuration: EndpointConfiguration | null;
  onConfigurationChange?: (config: EndpointConfiguration) => void;
  onExport?: (format: ExportOptions['format']) => void;
  className?: string;
}

export interface ConfigurationDisplayProps {
  summary: ConfigurationSummary;
  onEdit?: () => void;
}

export interface OpenAPIViewerProps {
  spec: OpenAPISpec;
  onExport?: (format: 'json' | 'yaml') => void;
}

export interface EndpointTesterProps {
  configuration: EndpointConfiguration;
  onTest?: (request: PreviewRequest) => void;
  testingState: TestingState;
}

// Constants for configuration defaults
export const DEFAULT_PREVIEW_CONFIG: Partial<EndpointConfiguration> = {
  enabledMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  security: {
    requireAuth: true,
    allowedRoles: [],
  },
  parameters: {
    pagination: {
      enabled: true,
      defaultLimit: 25,
      maxLimit: 1000,
    },
    filtering: {
      enabled: true,
      allowedFields: [],
    },
    sorting: {
      enabled: true,
      allowedFields: [],
    },
  },
  validation: {
    strict: true,
    customRules: {},
  },
};

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'json',
  includeExamples: true,
  includeSchemas: true,
  minifyOutput: false,
};

// Validation schemas for runtime type checking
export const EndpointConfigurationSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  tableName: z.string().min(1, 'Table name is required'),
  enabledMethods: z.array(z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])).min(1, 'At least one HTTP method must be enabled'),
  baseUrl: z.string().url('Invalid base URL'),
  apiPrefix: z.string().default('/api/v2'),
  security: z.object({
    requireAuth: z.boolean(),
    allowedRoles: z.array(z.string()),
    rateLimiting: z.object({
      enabled: z.boolean(),
      requestsPerMinute: z.number().min(1).max(10000),
    }).optional(),
  }),
  parameters: z.object({
    pagination: z.object({
      enabled: z.boolean(),
      defaultLimit: z.number().min(1).max(1000),
      maxLimit: z.number().min(1).max(10000),
    }),
    filtering: z.object({
      enabled: z.boolean(),
      allowedFields: z.array(z.string()),
    }),
    sorting: z.object({
      enabled: z.boolean(),
      allowedFields: z.array(z.string()),
    }),
  }),
  validation: z.object({
    strict: z.boolean(),
    customRules: z.record(z.any()),
  }),
});

export const PreviewRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url(),
  headers: z.record(z.string()),
  body: z.any().optional(),
  queryParams: z.record(z.string()).optional(),
});

export const ExportOptionsSchema = z.object({
  format: z.enum(['json', 'yaml', 'postman']),
  includeExamples: z.boolean(),
  includeSchemas: z.boolean(),
  minifyOutput: z.boolean(),
});