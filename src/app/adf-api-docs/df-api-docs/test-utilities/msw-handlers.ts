/**
 * @fileoverview Mock Service Worker (MSW) request handlers for API documentation testing
 * @description Provides realistic API simulation for email service endpoints, replacing Angular HTTP mocking patterns
 * with MSW for enhanced test isolation and realistic request/response simulation in React Testing Library environments
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - MSW 2.4.0+ integration for in-browser API mocking per F-006 API Documentation and Testing feature
 * - Comprehensive email service endpoint simulation per OpenAPI specification requirements
 * - Request/response validation matching DreamFactory API patterns for backend compatibility
 * - Authentication and authorization simulation for comprehensive security testing coverage
 * - Performance testing support with configurable delays for API response time validation
 * - Dynamic response generation based on request parameters for realistic testing scenarios
 * - Error response simulation for comprehensive testing coverage of failure scenarios
 * - MSW handlers optimized for both development and testing environments per React/Next.js patterns
 * 
 * Migration Path:
 * - Replaces Angular HttpClientTestingModule with MSW for more realistic API testing
 * - Transforms Angular HTTP interceptor mocks to MSW response handlers
 * - Integrates with Vitest 2.1.0 testing framework for 10x faster test execution
 * - Compatible with React Testing Library and @testing-library/react for component testing
 * - Supports React Query/SWR cache validation and optimistic update testing
 */

import { http, HttpResponse, delay } from 'msw'
import type { 
  OpenAPISpecification,
  MockApiDocsConfig,
  SecurityScheme
} from './df-api-docs.mock'
import {
  createMockApiDocsData,
  createMswApiDocsResponse,
  validateOpenAPISpecification,
  assessApiDocumentationQuality,
  MockApiDocsConfigSchema
} from './df-api-docs.mock'
import type {
  Service,
  ServiceError,
  ServiceValidationError,
  OpenAPISpec,
  EndpointConfig,
  GenerationResult,
  GenerationProgress
} from './test-data-factories'
import {
  apiDocsTestDataFactory,
  createMockHandlers
} from './test-data-factories'
import type { ApiResponse, ApiError } from '@/types/api'

// =============================================================================
// CORE MSW HANDLER CONFIGURATION
// =============================================================================

/**
 * MSW handler configuration for API documentation endpoints
 * Provides flexible configuration for different testing scenarios
 */
export interface MSWHandlerConfig {
  /** Base URL for API endpoints */
  baseUrl?: string
  
  /** Default response delay in milliseconds */
  defaultDelay?: number
  
  /** Enable realistic response times */
  enableRealisticDelay?: boolean
  
  /** Authentication simulation settings */
  authentication?: {
    enabled: boolean
    validTokens: string[]
    adminTokens: string[]
    expiredTokens: string[]
  }
  
  /** Error simulation configuration */
  errorSimulation?: {
    enabled: boolean
    errorRate: number // 0-100 percentage
    networkFailureRate: number // 0-100 percentage
  }
  
  /** Performance testing configuration */
  performance?: {
    slowResponseThreshold: number // milliseconds
    timeoutThreshold: number // milliseconds
    memoryUsageSimulation: boolean
  }
  
  /** Development vs testing environment settings */
  environment?: 'development' | 'testing' | 'e2e'
}

/**
 * Default MSW handler configuration optimized for React Testing Library
 */
export const DEFAULT_MSW_CONFIG: Required<MSWHandlerConfig> = {
  baseUrl: '/api/v2',
  defaultDelay: 100, // 100ms for realistic but fast testing
  enableRealisticDelay: true,
  authentication: {
    enabled: true,
    validTokens: [
      'valid_session_token_123',
      'admin_session_token_456',
      'api_key_789abc'
    ],
    adminTokens: [
      'admin_session_token_456',
      'super_admin_token_xyz'
    ],
    expiredTokens: [
      'expired_token_old',
      'revoked_token_invalid'
    ]
  },
  errorSimulation: {
    enabled: false, // Disabled by default for stable tests
    errorRate: 5, // 5% error rate when enabled
    networkFailureRate: 2 // 2% network failure rate when enabled
  },
  performance: {
    slowResponseThreshold: 1000, // 1 second
    timeoutThreshold: 5000, // 5 seconds
    memoryUsageSimulation: false
  },
  environment: 'testing'
}

// =============================================================================
// AUTHENTICATION AND AUTHORIZATION HELPERS
// =============================================================================

/**
 * Validates authentication headers and tokens for MSW request simulation
 * Simulates DreamFactory authentication patterns for comprehensive security testing
 */
export function validateAuthentication(
  request: Request,
  config: MSWHandlerConfig = DEFAULT_MSW_CONFIG
): {
  isValid: boolean
  isAdmin: boolean
  userId?: number
  role?: string
  error?: ApiError
} {
  if (!config.authentication?.enabled) {
    return { isValid: true, isAdmin: false, userId: 1, role: 'user' }
  }

  // Extract authentication from various possible sources
  const authHeader = request.headers.get('Authorization')
  const sessionToken = request.headers.get('X-DreamFactory-Session-Token')
  const apiKey = request.headers.get('X-DreamFactory-API-Key')
  const queryToken = new URL(request.url).searchParams.get('session_token')
  const queryApiKey = new URL(request.url).searchParams.get('api_key')

  // Determine authentication token
  let token: string | null = null
  let authMethod: string = 'none'

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
    authMethod = 'bearer'
  } else if (sessionToken) {
    token = sessionToken
    authMethod = 'session'
  } else if (apiKey) {
    token = apiKey
    authMethod = 'api_key'
  } else if (queryToken) {
    token = queryToken
    authMethod = 'query_session'
  } else if (queryApiKey) {
    token = queryApiKey
    authMethod = 'query_api_key'
  }

  // No authentication provided
  if (!token) {
    return {
      isValid: false,
      isAdmin: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required. Please provide a valid session token or API key.',
        status: 401,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        details: {
          authentication_methods: [
            'Bearer token in Authorization header',
            'X-DreamFactory-Session-Token header',
            'X-DreamFactory-API-Key header',
            'session_token query parameter',
            'api_key query parameter'
          ]
        }
      }
    }
  }

  // Check for expired tokens
  if (config.authentication.expiredTokens.includes(token)) {
    return {
      isValid: false,
      isAdmin: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Session token has expired. Please log in again.',
        status: 401,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        details: {
          token_expiry: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          auth_method: authMethod
        }
      }
    }
  }

  // Check for valid tokens
  if (!config.authentication.validTokens.includes(token)) {
    return {
      isValid: false,
      isAdmin: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token provided.',
        status: 401,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        details: {
          auth_method: authMethod,
          token_format: 'valid'
        }
      }
    }
  }

  // Determine admin status and user details
  const isAdmin = config.authentication.adminTokens.includes(token)
  const userId = isAdmin ? 1 : 2
  const role = isAdmin ? 'admin' : 'user'

  return {
    isValid: true,
    isAdmin,
    userId,
    role
  }
}

/**
 * Validates role-based access control for specific operations
 * Simulates DreamFactory RBAC patterns for comprehensive security testing
 */
export function validateRolePermissions(
  method: string,
  path: string,
  isAdmin: boolean,
  role: string = 'user'
): {
  hasPermission: boolean
  error?: ApiError
} {
  // Admin users have full access
  if (isAdmin || role === 'admin') {
    return { hasPermission: true }
  }

  // Define permission rules for different endpoints
  const restrictedOperations = [
    { method: 'DELETE', path: /\/api\/v2\/system\/service/ },
    { method: 'POST', path: /\/api\/v2\/system\/service$/ },
    { method: 'PUT', path: /\/api\/v2\/system\/service/ },
    { method: 'GET', path: /\/api\/v2\/system\/admin/ },
    { method: 'POST', path: /\/api\/v2\/system\/admin/ }
  ]

  // Check if current operation is restricted
  const isRestricted = restrictedOperations.some(rule => 
    rule.method === method && rule.path.test(path)
  )

  if (isRestricted) {
    return {
      hasPermission: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions to perform this operation. Admin access required.',
        status: 403,
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}`,
        details: {
          required_role: 'admin',
          current_role: role,
          operation: `${method} ${path}`
        }
      }
    }
  }

  return { hasPermission: true }
}

// =============================================================================
// RESPONSE GENERATION UTILITIES
// =============================================================================

/**
 * Creates standardized API responses matching DreamFactory patterns
 * Ensures consistent response structure across all mock endpoints
 */
export function createApiResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
): ApiResponse<T> {
  return {
    resource: Array.isArray(data) ? data : [data],
    meta: {
      count: Array.isArray(data) ? data.length : 1,
      timestamp: new Date().toISOString(),
      ...meta
    }
  }
}

/**
 * Creates standardized error responses matching DreamFactory patterns
 * Provides consistent error structure for all failure scenarios
 */
export function createErrorResponse(
  error: Partial<ApiError>,
  status: number = 500
): ApiError {
  return {
    code: 'GENERIC_ERROR',
    message: 'An error occurred',
    status,
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}`,
    ...error
  }
}

/**
 * Simulates network conditions and performance characteristics
 * Enables realistic testing of API response times and failure scenarios
 */
export async function simulateNetworkConditions(
  config: MSWHandlerConfig,
  isSlowOperation: boolean = false
): Promise<void> {
  if (!config.enableRealisticDelay) return

  let delayMs = config.defaultDelay || 100

  // Simulate slow operations (schema discovery, large API generation)
  if (isSlowOperation) {
    delayMs = Math.random() > 0.7 ? 2000 : 800 // 30% chance of slow response
  }

  // Simulate network variability
  if (config.environment === 'e2e') {
    delayMs += Math.random() * 200 // Add 0-200ms jitter
  }

  // Apply performance thresholds
  if (delayMs > (config.performance?.slowResponseThreshold || 1000)) {
    console.warn(`Simulated slow response: ${delayMs}ms`)
  }

  await delay(delayMs)
}

/**
 * Simulates random errors for comprehensive error handling testing
 * Configurable error rates enable testing of various failure scenarios
 */
export function shouldSimulateError(config: MSWHandlerConfig): {
  shouldError: boolean
  errorType: 'network' | 'server' | 'validation' | null
} {
  if (!config.errorSimulation?.enabled) {
    return { shouldError: false, errorType: null }
  }

  const random = Math.random() * 100

  // Network failure simulation
  if (random < (config.errorSimulation.networkFailureRate || 0)) {
    return { shouldError: true, errorType: 'network' }
  }

  // General error simulation
  if (random < (config.errorSimulation.errorRate || 0)) {
    const errorTypes: ('server' | 'validation')[] = ['server', 'validation']
    return { 
      shouldError: true, 
      errorType: errorTypes[Math.floor(Math.random() * errorTypes.length)]
    }
  }

  return { shouldError: false, errorType: null }
}

// =============================================================================
// EMAIL SERVICE MSW HANDLERS
// =============================================================================

/**
 * Creates MSW handlers for email service API endpoints
 * Provides comprehensive simulation of DreamFactory email service functionality
 */
export function createEmailServiceHandlers(config: MSWHandlerConfig = DEFAULT_MSW_CONFIG) {
  const baseUrl = config.baseUrl || '/api/v2'

  return [
    // POST /api/v2/email - Send email
    http.post(`${baseUrl}/email`, async ({ request }) => {
      await simulateNetworkConditions(config)

      // Simulate random errors if enabled
      const errorCheck = shouldSimulateError(config)
      if (errorCheck.shouldError) {
        if (errorCheck.errorType === 'network') {
          return new Response(null, { status: 0 }) // Network failure
        }
        if (errorCheck.errorType === 'server') {
          return HttpResponse.json(
            createErrorResponse({
              code: 'EMAIL_SERVICE_ERROR',
              message: 'Email service temporarily unavailable',
              status: 503
            }, 503),
            { status: 503 }
          )
        }
      }

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      try {
        const body = await request.json()
        
        // Validate required fields
        if (!body.to || !Array.isArray(body.to) || body.to.length === 0) {
          return HttpResponse.json(
            createErrorResponse({
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              status: 422,
              details: {
                validation_errors: [
                  { field: 'to', message: 'To field is required and must be an array with at least one recipient' }
                ]
              }
            }, 422),
            { status: 422 }
          )
        }

        if (!body.fromEmail || !body.fromName) {
          return HttpResponse.json(
            createErrorResponse({
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              status: 422,
              details: {
                validation_errors: [
                  ...(!body.fromEmail ? [{ field: 'fromEmail', message: 'From email is required' }] : []),
                  ...(!body.fromName ? [{ field: 'fromName', message: 'From name is required' }] : [])
                ]
              }
            }, 422),
            { status: 422 }
          )
        }

        // Simulate email sending process
        const emailCount = body.to.length
        
        // Simulate processing time based on email count
        if (emailCount > 10) {
          await delay(Math.min(emailCount * 50, 2000)) // Max 2 seconds
        }

        const response = createApiResponse({
          count: emailCount,
          success: true,
          message: `Successfully sent ${emailCount} email(s)`,
          delivery_status: {
            sent: emailCount,
            failed: 0,
            pending: 0
          },
          message_ids: Array.from({ length: emailCount }, (_, i) => `msg_${Date.now()}_${i}`)
        })

        return HttpResponse.json(response, { status: 200 })

      } catch (error) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'INVALID_REQUEST_BODY',
            message: 'Invalid JSON in request body',
            status: 400
          }, 400),
          { status: 400 }
        )
      }
    }),

    // GET /api/v2/email - Get email service information
    http.get(`${baseUrl}/email`, async ({ request }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const response = createApiResponse({
        service_name: 'email',
        service_type: 'smtp',
        description: 'SMTP email service for notifications and communications',
        version: '2.0',
        available_templates: [
          { id: 1, name: 'welcome_email', description: 'Welcome email template' },
          { id: 2, name: 'password_reset', description: 'Password reset email template' },
          { id: 3, name: 'invitation', description: 'User invitation email template' }
        ],
        configuration: {
          max_recipients: 100,
          rate_limit: '100/hour',
          supported_formats: ['text', 'html', 'multipart'],
          attachment_limit: '10MB'
        }
      })

      return HttpResponse.json(response, { status: 200 })
    }),

    // POST /api/v2/email/_test - Test email service connection
    http.post(`${baseUrl}/email/_test`, async ({ request }) => {
      await simulateNetworkConditions(config, true) // Slow operation

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      // Check admin permissions for testing
      const permission = validateRolePermissions('POST', request.url, auth.isAdmin, auth.role)
      if (!permission.hasPermission) {
        return HttpResponse.json(permission.error, { status: permission.error!.status })
      }

      // Simulate connection test with realistic delay
      await delay(1500) // Simulate SMTP server connection test

      const response = createApiResponse({
        success: true,
        message: 'Email service connection test successful',
        test_results: {
          smtp_connection: 'successful',
          authentication: 'verified',
          ssl_tls: 'enabled',
          response_time: Math.floor(Math.random() * 100) + 50, // 50-150ms
          server_info: {
            host: 'smtp.example.com',
            port: 587,
            encryption: 'STARTTLS'
          }
        },
        timestamp: new Date().toISOString()
      })

      return HttpResponse.json(response, { status: 200 })
    }),

    // GET /api/v2/email/_template - List email templates
    http.get(`${baseUrl}/email/_template`, async ({ request }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const templates = [
        {
          id: 1,
          name: 'welcome_email',
          description: 'Welcome email template for new users',
          subject: 'Welcome to DreamFactory!',
          body_html: '<html><body><h1>Welcome!</h1><p>Thank you for joining us.</p></body></html>',
          body_text: 'Welcome! Thank you for joining us.',
          created_date: '2024-01-15T10:00:00Z',
          last_modified_date: '2024-01-20T14:30:00Z'
        },
        {
          id: 2,
          name: 'password_reset',
          description: 'Password reset email template',
          subject: 'Password Reset Request',
          body_html: '<html><body><h1>Password Reset</h1><p>Click the link below to reset your password.</p></body></html>',
          body_text: 'Password Reset: Click the link below to reset your password.',
          created_date: '2024-01-15T10:00:00Z',
          last_modified_date: '2024-01-18T09:15:00Z'
        },
        {
          id: 3,
          name: 'invitation',
          description: 'User invitation email template',
          subject: 'You have been invited to join our platform',
          body_html: '<html><body><h1>Invitation</h1><p>You have been invited to join our platform.</p></body></html>',
          body_text: 'Invitation: You have been invited to join our platform.',
          created_date: '2024-01-16T11:00:00Z',
          last_modified_date: '2024-01-22T16:45:00Z'
        }
      ]

      const response = createApiResponse(templates, {
        count: templates.length,
        total: templates.length
      })

      return HttpResponse.json(response, { status: 200 })
    }),

    // GET /api/v2/email/_template/{id} - Get specific email template
    http.get(`${baseUrl}/email/_template/:id`, async ({ request, params }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const templateId = parseInt(params.id as string, 10)
      
      if (isNaN(templateId) || templateId < 1 || templateId > 3) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'TEMPLATE_NOT_FOUND',
            message: `Email template with ID ${params.id} not found`,
            status: 404
          }, 404),
          { status: 404 }
        )
      }

      const templates = {
        1: {
          id: 1,
          name: 'welcome_email',
          description: 'Welcome email template for new users',
          subject: 'Welcome to DreamFactory!',
          body_html: '<html><body><h1>Welcome!</h1><p>Thank you for joining us.</p></body></html>',
          body_text: 'Welcome! Thank you for joining us.',
          from_name: 'DreamFactory Team',
          from_email: 'noreply@dreamfactory.com',
          reply_to_name: 'Support Team',
          reply_to_email: 'support@dreamfactory.com',
          created_date: '2024-01-15T10:00:00Z',
          last_modified_date: '2024-01-20T14:30:00Z',
          created_by_id: 1,
          last_modified_by_id: 1
        },
        2: {
          id: 2,
          name: 'password_reset',
          description: 'Password reset email template',
          subject: 'Password Reset Request',
          body_html: '<html><body><h1>Password Reset</h1><p>Click the link below to reset your password: <a href="{reset_url}">Reset Password</a></p></body></html>',
          body_text: 'Password Reset: Click the link below to reset your password: {reset_url}',
          from_name: 'DreamFactory Security',
          from_email: 'security@dreamfactory.com',
          reply_to_name: 'Support Team',
          reply_to_email: 'support@dreamfactory.com',
          created_date: '2024-01-15T10:00:00Z',
          last_modified_date: '2024-01-18T09:15:00Z',
          created_by_id: 1,
          last_modified_by_id: 2
        },
        3: {
          id: 3,
          name: 'invitation',
          description: 'User invitation email template',
          subject: 'You have been invited to join our platform',
          body_html: '<html><body><h1>Invitation</h1><p>You have been invited to join our platform. Click <a href="{invitation_url}">here</a> to accept.</p></body></html>',
          body_text: 'Invitation: You have been invited to join our platform. Visit: {invitation_url}',
          from_name: 'DreamFactory Team',
          from_email: 'invitations@dreamfactory.com',
          reply_to_name: 'Support Team',
          reply_to_email: 'support@dreamfactory.com',
          created_date: '2024-01-16T11:00:00Z',
          last_modified_date: '2024-01-22T16:45:00Z',
          created_by_id: 1,
          last_modified_by_id: 1
        }
      }

      const template = templates[templateId as keyof typeof templates]
      const response = createApiResponse(template)

      return HttpResponse.json(response, { status: 200 })
    })
  ]
}

// =============================================================================
// API DOCUMENTATION ENDPOINT HANDLERS
// =============================================================================

/**
 * Creates MSW handlers for API documentation generation endpoints
 * Simulates OpenAPI specification generation and schema operations
 */
export function createApiDocumentationHandlers(config: MSWHandlerConfig = DEFAULT_MSW_CONFIG) {
  const baseUrl = config.baseUrl || '/api/v2'

  return [
    // GET /api/v2/{service}/_schema - Get OpenAPI specification
    http.get(`${baseUrl}/:service/_schema`, async ({ request, params }) => {
      await simulateNetworkConditions(config, true) // Schema generation is slow

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const serviceName = params.service as string

      // Validate service exists
      const validServices = ['email', 'mysql_customers', 'postgresql_db', 'mongodb_data']
      if (!validServices.includes(serviceName)) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'SERVICE_NOT_FOUND',
            message: `Service '${serviceName}' not found`,
            status: 404
          }, 404),
          { status: 404 }
        )
      }

      // Generate service-specific OpenAPI specification
      const serviceType = serviceName === 'email' ? 'email' : 'database'
      const openApiSpec = createMockApiDocsData({
        serviceName: serviceName,
        serviceType: serviceType,
        description: `Auto-generated API documentation for ${serviceName} service`,
        baseUrl: `${baseUrl}/${serviceName}`
      })

      // Add generation metadata
      const enhancedSpec = {
        ...openApiSpec,
        'x-generation-meta': {
          generated_at: new Date().toISOString(),
          generated_by: auth.userId,
          service_id: validServices.indexOf(serviceName) + 1,
          performance: {
            generation_time: Math.floor(Math.random() * 2000) + 1000, // 1-3 seconds
            endpoint_count: Object.keys(openApiSpec.paths).length,
            schema_count: Object.keys(openApiSpec.components?.schemas || {}).length
          }
        }
      }

      return HttpResponse.json(enhancedSpec, { status: 200 })
    }),

    // POST /api/v2/{service}/_schema/_generate - Generate API documentation
    http.post(`${baseUrl}/:service/_schema/_generate`, async ({ request, params }) => {
      await simulateNetworkConditions(config, true) // Generation is slow

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      // Check admin permissions for generation
      const permission = validateRolePermissions('POST', request.url, auth.isAdmin, auth.role)
      if (!permission.hasPermission) {
        return HttpResponse.json(permission.error, { status: permission.error!.status })
      }

      const serviceName = params.service as string

      try {
        const body = await request.json()

        // Simulate generation process with progress tracking
        const generationId = `gen_${Date.now()}_${serviceName}`
        
        // Simulate realistic generation time
        const estimatedTime = (body.tableCount || 10) * 200 // 200ms per table
        await delay(Math.min(estimatedTime, 5000)) // Max 5 seconds

        const result: GenerationResult = {
          id: generationId,
          serviceId: 1,
          status: 'success',
          message: 'API documentation generated successfully',
          service: apiDocsTestDataFactory.service.create({
            name: serviceName,
            type: serviceName === 'email' ? 'smtp' : 'mysql'
          }),
          openapi: createMockApiDocsData({
            serviceName: serviceName,
            serviceType: serviceName === 'email' ? 'email' : 'database',
            customEndpoints: body.customEndpoints || {}
          }),
          endpoints: apiDocsTestDataFactory.generation.createEndpointConfigs(),
          metadata: {
            generatedAt: new Date().toISOString(),
            generatedBy: `user_${auth.userId}`,
            version: '1.0.0',
            source: 'DreamFactory Admin Interface React',
            settings: {
              includeViews: body.includeViews || false,
              enableCaching: body.enableCaching !== false,
              enablePagination: body.enablePagination !== false,
              tableCount: body.tableCount || 10
            }
          },
          validation: validateOpenAPISpecification(createMockApiDocsData()),
          performance: {
            totalTime: estimatedTime,
            phases: {
              discovery: Math.floor(estimatedTime * 0.3),
              generation: Math.floor(estimatedTime * 0.5),
              validation: Math.floor(estimatedTime * 0.2)
            },
            resourceUsage: {
              memory: Math.floor(Math.random() * 100) + 50, // 50-150 MB
              cpu: Math.floor(Math.random() * 30) + 10 // 10-40%
            }
          }
        }

        const response = createApiResponse(result)
        return HttpResponse.json(response, { status: 201 })

      } catch (error) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'GENERATION_FAILED',
            message: 'API documentation generation failed',
            status: 500,
            details: {
              phase: 'initialization',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }, 500),
          { status: 500 }
        )
      }
    }),

    // GET /api/v2/{service}/_schema/_progress/{id} - Get generation progress
    http.get(`${baseUrl}/:service/_schema/_progress/:id`, async ({ request, params }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const progressId = params.id as string
      
      // Simulate progressive generation status
      const phases = ['initializing', 'analyzing', 'generating', 'validating', 'completing']
      const currentPhase = phases[Math.floor(Math.random() * phases.length)]
      const progress = Math.floor(Math.random() * 100)

      const progressData: GenerationProgress = {
        id: progressId,
        serviceId: 1,
        phase: currentPhase as any,
        progress,
        operation: `${currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} API documentation...`,
        message: getProgressMessage(currentPhase, progress),
        startedAt: new Date(Date.now() - 30000).toISOString(), // Started 30 seconds ago
        metrics: {
          duration: 30000 + Math.random() * 60000, // 30-90 seconds
          endpointsGenerated: Math.floor(progress / 10),
          specSize: Math.floor(progress * 1000),
          validationTime: Math.floor(Math.random() * 500)
        }
      }

      const response = createApiResponse(progressData)
      return HttpResponse.json(response, { status: 200 })
    }),

    // POST /api/v2/{service}/_schema/_validate - Validate OpenAPI specification
    http.post(`${baseUrl}/:service/_schema/_validate`, async ({ request }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      try {
        const body = await request.json()
        
        // Validate the provided OpenAPI specification
        const validation = validateOpenAPISpecification(body)
        const quality = assessApiDocumentationQuality(body)

        const response = createApiResponse({
          validation,
          quality,
          compliance: {
            openapi_version: body.openapi || 'unknown',
            specification_valid: validation.isValid,
            quality_score: quality.score,
            recommendations: quality.recommendations,
            security_analysis: {
              authentication_required: !!body.security,
              security_schemes_defined: !!body.components?.securitySchemes,
              endpoints_secured: body.paths ? 
                Object.values(body.paths).every((path: any) => 
                  Object.values(path).some((op: any) => op.security)
                ) : false
            }
          },
          timestamp: new Date().toISOString()
        })

        return HttpResponse.json(response, { status: 200 })

      } catch (error) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'VALIDATION_ERROR',
            message: 'Invalid OpenAPI specification format',
            status: 422,
            details: {
              error: error instanceof Error ? error.message : 'Parse error'
            }
          }, 422),
          { status: 422 }
        )
      }
    })
  ]
}

// =============================================================================
// SERVICE MANAGEMENT HANDLERS
// =============================================================================

/**
 * Creates MSW handlers for service management operations
 * Simulates CRUD operations for DreamFactory services
 */
export function createServiceManagementHandlers(config: MSWHandlerConfig = DEFAULT_MSW_CONFIG) {
  const baseUrl = config.baseUrl || '/api/v2'

  return [
    // GET /api/v2/system/service - List all services
    http.get(`${baseUrl}/system/service`, async ({ request }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      // Parse query parameters for filtering and pagination
      const url = new URL(request.url)
      const limit = parseInt(url.searchParams.get('limit') || '25', 10)
      const offset = parseInt(url.searchParams.get('offset') || '0', 10)
      const filter = url.searchParams.get('filter')
      const fields = url.searchParams.get('fields')

      // Generate services data
      let services = apiDocsTestDataFactory.service.createMany(15)

      // Apply filtering
      if (filter) {
        services = services.filter(service => 
          service.name.toLowerCase().includes(filter.toLowerCase()) ||
          service.type.toLowerCase().includes(filter.toLowerCase())
        )
      }

      // Apply pagination
      const total = services.length
      const paginatedServices = services.slice(offset, offset + limit)

      // Apply field selection
      if (fields) {
        const fieldList = fields.split(',').map(f => f.trim())
        // In real implementation, would filter object properties
      }

      const response = createApiResponse(paginatedServices, {
        count: paginatedServices.length,
        offset,
        limit,
        total,
        has_more: offset + limit < total
      })

      return HttpResponse.json(response, { status: 200 })
    }),

    // POST /api/v2/system/service - Create new service
    http.post(`${baseUrl}/system/service`, async ({ request }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      // Check admin permissions
      const permission = validateRolePermissions('POST', request.url, auth.isAdmin, auth.role)
      if (!permission.hasPermission) {
        return HttpResponse.json(permission.error, { status: permission.error!.status })
      }

      try {
        const body = await request.json()

        // Validate required fields
        const requiredFields = ['name', 'type', 'config']
        const missingFields = requiredFields.filter(field => !body[field])

        if (missingFields.length > 0) {
          return HttpResponse.json(
            createErrorResponse({
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              status: 422,
              details: {
                validation_errors: missingFields.map(field => ({
                  field,
                  message: `${field} is required`
                }))
              }
            }, 422),
            { status: 422 }
          )
        }

        // Create service
        const service = apiDocsTestDataFactory.service.create({
          id: Math.floor(Math.random() * 10000) + 1000,
          name: body.name,
          type: body.type,
          label: body.label || body.name,
          description: body.description || '',
          config: body.config,
          createdById: auth.userId,
          lastModifiedById: auth.userId
        })

        const response = createApiResponse(service)
        return HttpResponse.json(response, { status: 201 })

      } catch (error) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'INVALID_REQUEST_BODY',
            message: 'Invalid JSON in request body',
            status: 400
          }, 400),
          { status: 400 }
        )
      }
    }),

    // GET /api/v2/system/service/{id} - Get specific service
    http.get(`${baseUrl}/system/service/:id`, async ({ request, params }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const serviceId = parseInt(params.id as string, 10)

      if (isNaN(serviceId)) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'INVALID_SERVICE_ID',
            message: 'Service ID must be a valid integer',
            status: 400
          }, 400),
          { status: 400 }
        )
      }

      // Check if service exists (simulate some services don't exist)
      if (serviceId > 100) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'SERVICE_NOT_FOUND',
            message: `Service with ID ${serviceId} not found`,
            status: 404
          }, 404),
          { status: 404 }
        )
      }

      const service = apiDocsTestDataFactory.service.create({ id: serviceId })
      const response = createApiResponse(service)

      return HttpResponse.json(response, { status: 200 })
    }),

    // PUT /api/v2/system/service/{id} - Update service
    http.put(`${baseUrl}/system/service/:id`, async ({ request, params }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      // Check admin permissions
      const permission = validateRolePermissions('PUT', request.url, auth.isAdmin, auth.role)
      if (!permission.hasPermission) {
        return HttpResponse.json(permission.error, { status: permission.error!.status })
      }

      const serviceId = parseInt(params.id as string, 10)

      if (isNaN(serviceId)) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'INVALID_SERVICE_ID',
            message: 'Service ID must be a valid integer',
            status: 400
          }, 400),
          { status: 400 }
        )
      }

      try {
        const body = await request.json()

        const service = apiDocsTestDataFactory.service.create({
          id: serviceId,
          ...body,
          lastModifiedById: auth.userId,
          lastModifiedDate: new Date().toISOString()
        })

        const response = createApiResponse(service)
        return HttpResponse.json(response, { status: 200 })

      } catch (error) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'INVALID_REQUEST_BODY',
            message: 'Invalid JSON in request body',
            status: 400
          }, 400),
          { status: 400 }
        )
      }
    }),

    // DELETE /api/v2/system/service/{id} - Delete service
    http.delete(`${baseUrl}/system/service/:id`, async ({ request, params }) => {
      await simulateNetworkConditions(config)

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      // Check admin permissions
      const permission = validateRolePermissions('DELETE', request.url, auth.isAdmin, auth.role)
      if (!permission.hasPermission) {
        return HttpResponse.json(permission.error, { status: permission.error!.status })
      }

      const serviceId = parseInt(params.id as string, 10)

      if (isNaN(serviceId)) {
        return HttpResponse.json(
          createErrorResponse({
            code: 'INVALID_SERVICE_ID',
            message: 'Service ID must be a valid integer',
            status: 400
          }, 400),
          { status: 400 }
        )
      }

      // Simulate deletion
      const response = createApiResponse({
        id: serviceId,
        success: true,
        message: `Service ${serviceId} deleted successfully`
      })

      return HttpResponse.json(response, { status: 200 })
    }),

    // POST /api/v2/system/service/{id}/_test - Test service connection
    http.post(`${baseUrl}/system/service/:id/_test`, async ({ request, params }) => {
      await simulateNetworkConditions(config, true) // Connection testing is slow

      // Validate authentication
      const auth = validateAuthentication(request, config)
      if (!auth.isValid) {
        return HttpResponse.json(auth.error, { status: auth.error!.status })
      }

      const serviceId = parseInt(params.id as string, 10)

      // Simulate connection test with realistic results
      await delay(Math.random() * 2000 + 1000) // 1-3 seconds

      // Simulate occasional connection failures
      if (Math.random() < 0.1) { // 10% failure rate
        return HttpResponse.json(
          createErrorResponse({
            code: 'CONNECTION_FAILED',
            message: 'Unable to connect to service',
            status: 503,
            details: {
              service_id: serviceId,
              connection_error: 'Network timeout',
              suggested_actions: [
                'Check network connectivity',
                'Verify service configuration',
                'Check firewall settings'
              ]
            }
          }, 503),
          { status: 503 }
        )
      }

      const response = createApiResponse({
        success: true,
        service_id: serviceId,
        message: 'Service connection test successful',
        test_results: {
          connection_status: 'successful',
          response_time: Math.floor(Math.random() * 500) + 50, // 50-550ms
          ssl_verification: 'passed',
          authentication: 'verified',
          timestamp: new Date().toISOString()
        }
      })

      return HttpResponse.json(response, { status: 200 })
    })
  ]
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets progress message based on current phase and progress percentage
 */
function getProgressMessage(phase: string, progress: number): string {
  const messages = {
    initializing: [
      'Initializing API generation process...',
      'Setting up generation environment...',
      'Validating service configuration...'
    ],
    analyzing: [
      'Analyzing database schema structure...',
      'Discovering table relationships...',
      'Mapping field types and constraints...',
      'Processing table metadata...'
    ],
    generating: [
      'Generating OpenAPI paths and operations...',
      'Creating schema definitions...',
      'Building endpoint configurations...',
      'Optimizing API structure...'
    ],
    validating: [
      'Validating OpenAPI specification...',
      'Running quality assessments...',
      'Checking compliance standards...',
      'Finalizing documentation...'
    ],
    completing: [
      'Finalizing API documentation...',
      'Generating completion report...',
      'Cleaning up temporary resources...'
    ]
  }

  const phaseMessages = messages[phase as keyof typeof messages] || ['Processing...']
  const messageIndex = Math.floor((progress / 100) * phaseMessages.length)
  return phaseMessages[Math.min(messageIndex, phaseMessages.length - 1)]
}

// =============================================================================
// MAIN HANDLER EXPORT
// =============================================================================

/**
 * Creates comprehensive MSW handlers for API documentation testing
 * Combines all handler categories for complete API simulation
 * 
 * @param config - MSW handler configuration options
 * @returns Array of MSW request handlers
 * 
 * @example
 * ```typescript
 * import { setupServer } from 'msw/node'
 * import { createApiDocsHandlers } from './msw-handlers'
 * 
 * // Setup MSW server for testing
 * const server = setupServer(...createApiDocsHandlers())
 * 
 * // Custom configuration
 * const handlers = createApiDocsHandlers({
 *   baseUrl: '/api/v2',
 *   defaultDelay: 50,
 *   authentication: { enabled: false }
 * })
 * ```
 */
export function createApiDocsHandlers(config: Partial<MSWHandlerConfig> = {}) {
  const finalConfig = { ...DEFAULT_MSW_CONFIG, ...config }

  return [
    ...createEmailServiceHandlers(finalConfig),
    ...createApiDocumentationHandlers(finalConfig),
    ...createServiceManagementHandlers(finalConfig)
  ]
}

/**
 * Pre-configured MSW handlers for common testing scenarios
 */
export const apiDocsHandlers = createApiDocsHandlers()

export const apiDocsHandlersWithErrors = createApiDocsHandlers({
  errorSimulation: {
    enabled: true,
    errorRate: 10,
    networkFailureRate: 5
  }
})

export const apiDocsHandlersNoAuth = createApiDocsHandlers({
  authentication: {
    enabled: false,
    validTokens: [],
    adminTokens: [],
    expiredTokens: []
  }
})

export const apiDocsHandlersFast = createApiDocsHandlers({
  defaultDelay: 0,
  enableRealisticDelay: false
})

export const apiDocsHandlersSlow = createApiDocsHandlers({
  defaultDelay: 1000,
  performance: {
    slowResponseThreshold: 500,
    timeoutThreshold: 10000,
    memoryUsageSimulation: true
  }
})

// =============================================================================
// TYPE EXPORTS FOR CONSUMER USE
// =============================================================================

export type {
  MSWHandlerConfig
} from './msw-handlers'

// Re-export MSW utilities for convenience
export { http, HttpResponse, delay } from 'msw'

/**
 * Default export for convenience
 */
export default apiDocsHandlers