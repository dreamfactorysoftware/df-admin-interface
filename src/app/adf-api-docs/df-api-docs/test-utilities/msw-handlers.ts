/**
 * Mock Service Worker (MSW) Request Handlers for API Documentation Testing
 * 
 * Provides comprehensive API endpoint simulation for email service testing with
 * realistic request/response patterns. Replaces Angular HTTP mock interceptors
 * with MSW for enhanced test isolation and browser-native request simulation.
 * 
 * Features:
 * - Email service API endpoint mocking per F-006 requirements
 * - Authentication and authorization simulation for security testing
 * - Request/response validation matching DreamFactory API patterns
 * - Performance testing support with configurable delays
 * - Error scenario simulation for comprehensive test coverage
 * - OpenAPI specification compliance validation
 * - Dynamic response generation based on request parameters
 * - MSW integration for both development and testing environments
 * 
 * @version 1.0.0
 * @framework React 19/Next.js 15.1/MSW 2.6.2+
 */

import { http, HttpResponse, delay } from 'msw';
import type { HttpHandler } from 'msw';
import { 
  createMockApiDocsData, 
  validateOpenAPISpecification,
  createMSWHandlers,
  type OpenAPISpecification,
  type MockApiDocsOptions,
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
  LICENSE_KEY_HEADER
} from './df-api-docs.mock';
import {
  createDatabaseServiceFactory,
  createServiceTestResultFactory,
  createAPIEndpointConfigFactory,
  createMSWResponseFactory,
  createOpenAPIPreviewFactory,
  type FactoryOptions,
  type DatabaseFactoryOptions,
  type ApiDocsFactoryOptions
} from './test-data-factories';

// ============================================================================
// CONFIGURATION TYPES AND CONSTANTS
// ============================================================================

/**
 * MSW handler configuration options for flexible testing scenarios
 */
export interface MSWHandlerOptions {
  /** Enable realistic network delays for performance testing */
  enableNetworkDelay?: boolean;
  /** Base delay in milliseconds for all requests */
  baseDelay?: number;
  /** Maximum additional random delay in milliseconds */
  maxRandomDelay?: number;
  /** Error simulation probability (0-1) */
  errorRate?: number;
  /** Authentication validation strictness */
  authValidation?: 'strict' | 'lenient' | 'disabled';
  /** Response data size for performance testing */
  responseDataSize?: 'small' | 'medium' | 'large';
  /** Enable request logging for debugging */
  enableLogging?: boolean;
  /** Cache simulation for testing React Query behavior */
  enableCaching?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * API error response structure for consistent error handling testing
 */
export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    context?: Record<string, any>;
  };
  meta: {
    timestamp: string;
    requestId: string;
    endpoint: string;
    method: string;
  };
}

/**
 * Email service request structure for comprehensive validation testing
 */
export interface EmailServiceRequest {
  template?: string;
  templateId?: number;
  to: Array<{ name?: string; email: string }>;
  cc?: Array<{ name?: string; email: string }>;
  bcc?: Array<{ name?: string; email: string }>;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  attachment?: Array<{
    service: string;
    path: string;
  }>;
}

/**
 * Email service response structure for testing success scenarios
 */
export interface EmailServiceResponse {
  count: number;
  failed?: Array<{
    email: string;
    reason: string;
    code: string;
  }>;
  messageId: string;
  deliveryStatus: 'queued' | 'sent' | 'failed' | 'partial';
  processingTime: number;
}

// Default MSW handler configuration optimized for testing performance
const DEFAULT_MSW_OPTIONS: Required<MSWHandlerOptions> = {
  enableNetworkDelay: true,
  baseDelay: 100,
  maxRandomDelay: 300,
  errorRate: 0.1,
  authValidation: 'strict',
  responseDataSize: 'medium',
  enableLogging: false,
  enableCaching: true,
  cacheTTL: 300000, // 5 minutes
};

// Authentication headers for validation
const REQUIRED_AUTH_HEADERS = [
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
  'authorization'
] as const;

// Valid email service endpoints for DreamFactory API compatibility
const EMAIL_SERVICE_ENDPOINTS = {
  SEND_EMAIL: '/api/v2/email',
  LIST_RESOURCES: '/api/v2/email',
  SERVICE_STATUS: '/api/v2/email/_status',
  SERVICE_SCHEMA: '/api/v2/email/_schema',
  SERVICE_DOCS: '/api/v2/email/_docs'
} as const;

// Cache for simulating React Query/SWR behavior
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate consistent request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate authentication headers based on configuration
 */
function validateAuthentication(
  request: Request, 
  options: Required<MSWHandlerOptions>
): { valid: boolean; error?: APIErrorResponse } {
  if (options.authValidation === 'disabled') {
    return { valid: true };
  }

  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();
  const endpoint = new URL(request.url).pathname;
  const method = request.method;

  // Check for at least one authentication header
  const hasAuthHeader = REQUIRED_AUTH_HEADERS.some(header => 
    request.headers.get(header) !== null
  );

  if (!hasAuthHeader && options.authValidation === 'strict') {
    return {
      valid: false,
      error: {
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication credentials are required for this endpoint',
          details: `Missing one of: ${REQUIRED_AUTH_HEADERS.join(', ')}`,
          context: {
            supportedAuthMethods: ['api_key', 'session_token', 'bearer_token'],
            headerExamples: {
              [API_KEY_HEADER]: 'your-api-key-here',
              [SESSION_TOKEN_HEADER]: 'session-token-uuid',
              'authorization': 'Bearer jwt-token-here'
            }
          }
        },
        meta: { timestamp, requestId, endpoint, method }
      }
    };
  }

  // Validate API key format (basic validation)
  const apiKey = request.headers.get(API_KEY_HEADER);
  if (apiKey && apiKey.length < 10) {
    return {
      valid: false,
      error: {
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key format',
          details: 'API key must be at least 10 characters long',
        },
        meta: { timestamp, requestId, endpoint, method }
      }
    };
  }

  // Validate session token format (UUID-like)
  const sessionToken = request.headers.get(SESSION_TOKEN_HEADER);
  if (sessionToken && !/^[a-f0-9-]{36}$/i.test(sessionToken)) {
    return {
      valid: false,
      error: {
        error: {
          code: 'INVALID_SESSION_TOKEN',
          message: 'Invalid session token format',
          details: 'Session token must be a valid UUID',
        },
        meta: { timestamp, requestId, endpoint, method }
      }
    };
  }

  return { valid: true };
}

/**
 * Validate email service request payload
 */
function validateEmailRequest(requestBody: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!requestBody) {
    errors.push('Request body is required');
    return { valid: false, errors };
  }

  // Required fields validation
  if (!requestBody.to || !Array.isArray(requestBody.to) || requestBody.to.length === 0) {
    errors.push('At least one recipient email address is required in "to" field');
  }

  if (!requestBody.subject || typeof requestBody.subject !== 'string') {
    errors.push('Subject field is required and must be a string');
  }

  // Validate email addresses
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const validateEmailArray = (emails: any[], fieldName: string) => {
    if (!emails) return;
    
    if (!Array.isArray(emails)) {
      errors.push(`${fieldName} must be an array`);
      return;
    }

    emails.forEach((emailObj, index) => {
      if (typeof emailObj === 'string') {
        if (!emailRegex.test(emailObj)) {
          errors.push(`Invalid email format in ${fieldName}[${index}]: ${emailObj}`);
        }
      } else if (typeof emailObj === 'object' && emailObj !== null) {
        if (!emailObj.email || !emailRegex.test(emailObj.email)) {
          errors.push(`Invalid email format in ${fieldName}[${index}].email: ${emailObj.email}`);
        }
      } else {
        errors.push(`Invalid email format in ${fieldName}[${index}]`);
      }
    });
  };

  validateEmailArray(requestBody.to, 'to');
  validateEmailArray(requestBody.cc, 'cc');
  validateEmailArray(requestBody.bcc, 'bcc');

  // Validate content
  if (!requestBody.bodyText && !requestBody.bodyHtml && !requestBody.template && !requestBody.templateId) {
    errors.push('Either bodyText, bodyHtml, template, or templateId must be provided');
  }

  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Apply network delay based on configuration
 */
async function applyNetworkDelay(options: Required<MSWHandlerOptions>): Promise<void> {
  if (!options.enableNetworkDelay) return;
  
  const totalDelay = options.baseDelay + Math.random() * options.maxRandomDelay;
  await delay(totalDelay);
}

/**
 * Check if request should return error based on error rate
 */
function shouldReturnError(options: Required<MSWHandlerOptions>): boolean {
  return Math.random() < options.errorRate;
}

/**
 * Get cached response if available and not expired
 */
function getCachedResponse(cacheKey: string, options: Required<MSWHandlerOptions>): any | null {
  if (!options.enableCaching) return null;
  
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > cached.ttl;
  if (isExpired) {
    responseCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

/**
 * Cache response for future requests
 */
function cacheResponse(
  cacheKey: string, 
  data: any, 
  options: Required<MSWHandlerOptions>
): void {
  if (!options.enableCaching) return;
  
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl: options.cacheTTL
  });
}

/**
 * Generate realistic email service response data
 */
function generateEmailServiceResponse(
  request: EmailServiceRequest,
  options: Required<MSWHandlerOptions>
): EmailServiceResponse {
  const recipientCount = request.to.length + (request.cc?.length || 0) + (request.bcc?.length || 0);
  const failureRate = options.errorRate * 0.5; // Partial failures are less common
  const failedCount = Math.floor(recipientCount * failureRate);
  
  const failed = failedCount > 0 ? Array.from({ length: failedCount }, (_, index) => ({
    email: request.to[index]?.email || `failed${index}@example.com`,
    reason: 'Mailbox full',
    code: 'MAILBOX_FULL'
  })) : undefined;

  return {
    count: recipientCount - failedCount,
    failed,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    deliveryStatus: failedCount === 0 ? 'sent' : 
                   failedCount === recipientCount ? 'failed' : 'partial',
    processingTime: Math.floor(Math.random() * 500) + 100 // 100-600ms
  };
}

// ============================================================================
// MSW REQUEST HANDLERS
// ============================================================================

/**
 * Create email service POST handler for sending emails
 */
function createEmailServicePostHandler(options: Required<MSWHandlerOptions>): HttpHandler {
  return http.post(EMAIL_SERVICE_ENDPOINTS.SEND_EMAIL, async ({ request }) => {
    if (options.enableLogging) {
      console.log('[MSW] Email service POST request intercepted:', request.url);
    }

    await applyNetworkDelay(options);

    // Authentication validation
    const authResult = validateAuthentication(request, options);
    if (!authResult.valid) {
      return HttpResponse.json(authResult.error, { status: 401 });
    }

    // Simulate random errors for testing error handling
    if (shouldReturnError(options)) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'SERVICE_TEMPORARILY_UNAVAILABLE',
          message: 'Email service is temporarily unavailable',
          details: 'Please try again in a few moments',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          endpoint: EMAIL_SERVICE_ENDPOINTS.SEND_EMAIL,
          method: 'POST'
        }
      };
      return HttpResponse.json(errorResponse, { status: 503 });
    }

    try {
      // Parse and validate request body
      const requestBody = await request.json() as EmailServiceRequest;
      const validation = validateEmailRequest(requestBody);
      
      if (!validation.valid) {
        const errorResponse: APIErrorResponse = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload',
            details: validation.errors?.join('; ') || 'Validation failed',
            context: { validationErrors: validation.errors }
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: generateRequestId(),
            endpoint: EMAIL_SERVICE_ENDPOINTS.SEND_EMAIL,
            method: 'POST'
          }
        };
        return HttpResponse.json(errorResponse, { status: 400 });
      }

      // Generate realistic response
      const responseData = generateEmailServiceResponse(requestBody, options);
      
      // Add standard DreamFactory response headers
      const headers = {
        'Content-Type': 'application/json',
        'X-DreamFactory-Version': '5.0.0',
        'X-Request-ID': generateRequestId(),
        'X-Rate-Limit-Remaining': Math.floor(Math.random() * 1000).toString(),
        'X-Rate-Limit-Reset': (Date.now() + 3600000).toString()
      };

      return HttpResponse.json(responseData, { 
        status: 200,
        headers
      });

    } catch (error) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process email request',
          details: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          endpoint: EMAIL_SERVICE_ENDPOINTS.SEND_EMAIL,
          method: 'POST'
        }
      };
      return HttpResponse.json(errorResponse, { status: 500 });
    }
  });
}

/**
 * Create email service GET handler for listing resources
 */
function createEmailServiceGetHandler(options: Required<MSWHandlerOptions>): HttpHandler {
  return http.get(EMAIL_SERVICE_ENDPOINTS.LIST_RESOURCES, async ({ request }) => {
    if (options.enableLogging) {
      console.log('[MSW] Email service GET request intercepted:', request.url);
    }

    await applyNetworkDelay(options);

    // Check cache first
    const cacheKey = `email-resources-${request.url}`;
    const cachedResponse = getCachedResponse(cacheKey, options);
    if (cachedResponse) {
      return HttpResponse.json(cachedResponse, { status: 200 });
    }

    // Authentication validation
    const authResult = validateAuthentication(request, options);
    if (!authResult.valid) {
      return HttpResponse.json(authResult.error, { status: 401 });
    }

    // Simulate random errors
    if (shouldReturnError(options)) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Email service resources not available',
          details: 'Service may be misconfigured or disabled',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          endpoint: EMAIL_SERVICE_ENDPOINTS.LIST_RESOURCES,
          method: 'GET'
        }
      };
      return HttpResponse.json(errorResponse, { status: 404 });
    }

    // Generate resource list response
    const responseData = {
      resource: [
        'send',
        'template',
        'status',
        'logs',
        'config'
      ],
      meta: {
        count: 5,
        schema: '/api/v2/email/_schema',
        docs: '/api/v2/email/_docs'
      }
    };

    // Cache the response
    cacheResponse(cacheKey, responseData, options);

    const headers = {
      'Content-Type': 'application/json',
      'X-DreamFactory-Version': '5.0.0',
      'X-Request-ID': generateRequestId(),
      'Cache-Control': `max-age=${Math.floor(options.cacheTTL / 1000)}`,
      'ETag': `"${Math.random().toString(36).substr(2, 9)}"`
    };

    return HttpResponse.json(responseData, { 
      status: 200,
      headers
    });
  });
}

/**
 * Create service status handler for health checks
 */
function createServiceStatusHandler(options: Required<MSWHandlerOptions>): HttpHandler {
  return http.get(EMAIL_SERVICE_ENDPOINTS.SERVICE_STATUS, async ({ request }) => {
    if (options.enableLogging) {
      console.log('[MSW] Service status request intercepted:', request.url);
    }

    await applyNetworkDelay(options);

    // Authentication validation
    const authResult = validateAuthentication(request, options);
    if (!authResult.valid) {
      return HttpResponse.json(authResult.error, { status: 401 });
    }

    // Generate service status using factory
    const serviceStatus = createServiceTestResultFactory({
      useRealisticData: true,
      overrides: {
        success: !shouldReturnError(options),
        connectionTime: Math.floor(Math.random() * 1000) + 100
      }
    });

    const responseData = {
      status: serviceStatus.success ? 'healthy' : 'unhealthy',
      lastChecked: new Date().toISOString(),
      responseTime: serviceStatus.connectionTime,
      version: '2.0.0',
      dependencies: {
        smtpServer: serviceStatus.success ? 'connected' : 'disconnected',
        database: 'connected',
        redis: 'connected'
      },
      metrics: {
        emailsSentToday: Math.floor(Math.random() * 10000),
        averageDeliveryTime: Math.floor(Math.random() * 3000) + 500,
        successRate: serviceStatus.success ? 98.5 : 75.2
      }
    };

    return HttpResponse.json(responseData, { 
      status: serviceStatus.success ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Version': '5.0.0',
        'X-Request-ID': generateRequestId()
      }
    });
  });
}

/**
 * Create OpenAPI documentation handler
 */
function createApiDocsHandler(options: Required<MSWHandlerOptions>): HttpHandler {
  return http.get(EMAIL_SERVICE_ENDPOINTS.SERVICE_DOCS, async ({ request }) => {
    if (options.enableLogging) {
      console.log('[MSW] API docs request intercepted:', request.url);
    }

    await applyNetworkDelay(options);

    // Check cache first
    const cacheKey = `api-docs-${request.url}`;
    const cachedResponse = getCachedResponse(cacheKey, options);
    if (cachedResponse) {
      return HttpResponse.json(cachedResponse, { status: 200 });
    }

    // Authentication validation (docs might be public)
    if (options.authValidation === 'strict') {
      const authResult = validateAuthentication(request, options);
      if (!authResult.valid) {
        return HttpResponse.json(authResult.error, { status: 401 });
      }
    }

    // Generate OpenAPI specification
    const openApiSpec = createMockApiDocsData({
      serviceName: 'Email Service',
      serviceType: 'email',
      version: '2.0',
      includeAdvancedAuth: options.authValidation === 'strict',
      includeCustomSchemas: true
    });

    // Validate the generated spec
    if (!validateOpenAPISpecification(openApiSpec)) {
      const errorResponse: APIErrorResponse = {
        error: {
          code: 'INVALID_OPENAPI_SPEC',
          message: 'Generated OpenAPI specification is invalid',
          details: 'Internal error in specification generation',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: generateRequestId(),
          endpoint: EMAIL_SERVICE_ENDPOINTS.SERVICE_DOCS,
          method: 'GET'
        }
      };
      return HttpResponse.json(errorResponse, { status: 500 });
    }

    // Cache the spec
    cacheResponse(cacheKey, openApiSpec, options);

    return HttpResponse.json(openApiSpec, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Version': '5.0.0',
        'X-Request-ID': generateRequestId(),
        'Cache-Control': `max-age=${Math.floor(options.cacheTTL / 1000)}`,
        'X-OpenAPI-Version': openApiSpec.openapi
      }
    });
  });
}

/**
 * Create schema definition handler
 */
function createSchemaHandler(options: Required<MSWHandlerOptions>): HttpHandler {
  return http.get(EMAIL_SERVICE_ENDPOINTS.SERVICE_SCHEMA, async ({ request }) => {
    if (options.enableLogging) {
      console.log('[MSW] Schema request intercepted:', request.url);
    }

    await applyNetworkDelay(options);

    // Authentication validation
    const authResult = validateAuthentication(request, options);
    if (!authResult.valid) {
      return HttpResponse.json(authResult.error, { status: 401 });
    }

    // Generate schema definition for email service
    const schemaData = {
      paths: [
        {
          path: '/api/v2/email',
          operations: [
            {
              method: 'POST',
              summary: 'Send email',
              parameters: ['template', 'template_id', 'attachment'],
              requestBody: {
                $ref: '#/components/schemas/EmailRequest'
              },
              responses: {
                '200': { $ref: '#/components/responses/EmailResponse' },
                '400': { $ref: '#/components/responses/Error' },
                '401': { $ref: '#/components/responses/Error' }
              }
            },
            {
              method: 'GET',
              summary: 'List email resources',
              responses: {
                '200': { $ref: '#/components/responses/ResourceList' }
              }
            }
          ]
        }
      ],
      components: {
        schemas: {
          EmailRequest: {
            type: 'object',
            required: ['to', 'subject'],
            properties: {
              to: {
                type: 'array',
                items: { $ref: '#/components/schemas/EmailAddress' }
              },
              subject: { type: 'string' },
              bodyText: { type: 'string' },
              bodyHtml: { type: 'string' }
            }
          },
          EmailAddress: {
            type: 'object',
            required: ['email'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' }
            }
          }
        }
      }
    };

    return HttpResponse.json(schemaData, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Version': '5.0.0',
        'X-Request-ID': generateRequestId()
      }
    });
  });
}

// ============================================================================
// MAIN HANDLER FACTORY FUNCTION
// ============================================================================

/**
 * Create complete MSW handlers for email service API testing
 * 
 * @param options - Configuration options for handler behavior
 * @returns Array of MSW HTTP handlers for comprehensive email service testing
 */
export function createEmailServiceHandlers(
  options: Partial<MSWHandlerOptions> = {}
): HttpHandler[] {
  const config = { ...DEFAULT_MSW_OPTIONS, ...options };
  
  if (config.enableLogging) {
    console.log('[MSW] Creating email service handlers with config:', config);
  }

  return [
    createEmailServicePostHandler(config),
    createEmailServiceGetHandler(config),
    createServiceStatusHandler(config),
    createApiDocsHandler(config),
    createSchemaHandler(config)
  ];
}

/**
 * Create handlers for API documentation testing scenarios
 * 
 * @param scenario - Testing scenario configuration
 * @returns MSW handlers configured for specific testing scenarios
 */
export function createApiDocsTestHandlers(
  scenario: 'success' | 'error' | 'slow' | 'auth-error' | 'validation-error' = 'success'
): HttpHandler[] {
  const scenarioConfigs: Record<string, Partial<MSWHandlerOptions>> = {
    success: {
      errorRate: 0,
      enableNetworkDelay: false,
      authValidation: 'lenient'
    },
    error: {
      errorRate: 1.0,
      enableNetworkDelay: false,
      authValidation: 'lenient'
    },
    slow: {
      errorRate: 0,
      enableNetworkDelay: true,
      baseDelay: 2000,
      maxRandomDelay: 3000,
      authValidation: 'lenient'
    },
    'auth-error': {
      errorRate: 0,
      enableNetworkDelay: false,
      authValidation: 'strict'
    },
    'validation-error': {
      errorRate: 0,
      enableNetworkDelay: false,
      authValidation: 'disabled'
    }
  };

  return createEmailServiceHandlers(scenarioConfigs[scenario]);
}

/**
 * Create performance testing handlers with large response data
 * 
 * @param dataSize - Response data size configuration
 * @returns MSW handlers optimized for performance testing
 */
export function createPerformanceTestHandlers(
  dataSize: 'small' | 'medium' | 'large' = 'medium'
): HttpHandler[] {
  const performanceConfig: Partial<MSWHandlerOptions> = {
    responseDataSize: dataSize,
    enableCaching: true,
    cacheTTL: 60000, // 1 minute for performance testing
    enableLogging: true,
    errorRate: 0 // No errors for clean performance metrics
  };

  return createEmailServiceHandlers(performanceConfig);
}

/**
 * Clear MSW response cache for testing isolation
 */
export function clearMSWCache(): void {
  responseCache.clear();
}

/**
 * Get MSW cache statistics for testing validation
 */
export function getMSWCacheStats(): { 
  size: number; 
  entries: Array<{ key: string; timestamp: number; ttl: number }> 
} {
  return {
    size: responseCache.size,
    entries: Array.from(responseCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      ttl: value.ttl
    }))
  };
}

// ============================================================================
// TESTING UTILITIES AND EXPORTS
// ============================================================================

/**
 * Validate MSW handler setup for testing completeness
 */
export function validateMSWSetup(handlers: HttpHandler[]): {
  valid: boolean;
  coverage: string[];
  missing: string[];
} {
  const expectedEndpoints = Object.values(EMAIL_SERVICE_ENDPOINTS);
  const handlerEndpoints = handlers
    .map(handler => {
      // Extract endpoint from handler info (MSW internal structure)
      return handler.info.header;
    })
    .filter(Boolean);

  const coverage = expectedEndpoints.filter(endpoint =>
    handlerEndpoints.some(handler => handler.includes(endpoint))
  );

  const missing = expectedEndpoints.filter(endpoint =>
    !handlerEndpoints.some(handler => handler.includes(endpoint))
  );

  return {
    valid: missing.length === 0,
    coverage,
    missing
  };
}

/**
 * Create minimal MSW setup for unit testing
 */
export function createMinimalMSWSetup(): HttpHandler[] {
  return [
    createEmailServicePostHandler(DEFAULT_MSW_OPTIONS),
    createEmailServiceGetHandler(DEFAULT_MSW_OPTIONS)
  ];
}

// Export configuration constants for testing
export {
  DEFAULT_MSW_OPTIONS,
  EMAIL_SERVICE_ENDPOINTS,
  REQUIRED_AUTH_HEADERS,
  type MSWHandlerOptions,
  type APIErrorResponse,
  type EmailServiceRequest,
  type EmailServiceResponse
};

// Export factory functions from dependencies for convenience
export {
  createMockApiDocsData,
  validateOpenAPISpecification,
  createMSWHandlers,
  createDatabaseServiceFactory,
  createServiceTestResultFactory,
  createAPIEndpointConfigFactory,
  createMSWResponseFactory,
  createOpenAPIPreviewFactory
};

/**
 * Default export: Complete MSW handler setup for email service testing
 */
export default createEmailServiceHandlers();