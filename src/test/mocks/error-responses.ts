/**
 * DreamFactory API Error Response Generators
 * 
 * Utility functions for generating consistent DreamFactory API error responses that match
 * the backend error format. Provides reusable error response generators for different HTTP
 * status codes and error scenarios to enable comprehensive error handling testing.
 * 
 * This module provides:
 * - Standardized error response generators matching DreamFactory API error format
 * - Status-specific error responses (400, 401, 403, 404, 422, 500)
 * - Error response structure with code, message, status_code, and context fields
 * - Validation error responses for form field errors
 * - Error scenario testing utilities for comprehensive error handling validation
 * 
 * Error Format:
 * The DreamFactory API returns errors in a consistent structure:
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human readable error message",
 *     "status_code": 400,
 *     "context": {
 *       "field_errors": { "field": ["Error message"] },
 *       "additional_context": "value"
 *     }
 *   }
 * }
 */

import { HttpResponse } from 'msw';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * DreamFactory API error structure
 */
export interface DreamFactoryError {
  error: {
    code: string;
    message: string;
    status_code: number;
    context?: Record<string, unknown>;
  };
}

/**
 * Field-specific validation errors
 */
export interface FieldErrors {
  [fieldName: string]: string[];
}

/**
 * Validation error context structure
 */
export interface ValidationErrorContext {
  field_errors?: FieldErrors;
  invalid_fields?: string[];
  validation_rules?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Authentication error context
 */
export interface AuthErrorContext {
  session_expired?: boolean;
  invalid_token?: boolean;
  missing_credentials?: boolean;
  required_role?: string;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * Server error context
 */
export interface ServerErrorContext {
  error_id?: string;
  timestamp?: string;
  request_id?: string;
  service?: string;
  operation?: string;
  [key: string]: unknown;
}

// ============================================================================
// ERROR CODE CONSTANTS
// ============================================================================

/**
 * Standard DreamFactory error codes by category
 */
export const ERROR_CODES = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATA_FORMAT: 'INVALID_DATA_FORMAT',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  
  // Authentication & Authorization (401/403)
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  
  // Not Found (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  
  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Database-specific errors
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  SQL_ERROR: 'SQL_ERROR',
  SCHEMA_NOT_FOUND: 'SCHEMA_NOT_FOUND',
  TABLE_NOT_FOUND: 'TABLE_NOT_FOUND',
  INVALID_QUERY: 'INVALID_QUERY',
  
  // Service-specific errors
  SERVICE_CONFIGURATION_ERROR: 'SERVICE_CONFIGURATION_ERROR',
  API_GENERATION_FAILED: 'API_GENERATION_FAILED',
  OPENAPI_GENERATION_ERROR: 'OPENAPI_GENERATION_ERROR',
} as const;

// ============================================================================
// CORE ERROR RESPONSE GENERATORS
// ============================================================================

/**
 * Creates a DreamFactory-formatted error response
 * 
 * @param code - Error code from ERROR_CODES
 * @param message - Human readable error message
 * @param statusCode - HTTP status code
 * @param context - Additional error context
 * @returns MSW HttpResponse with DreamFactory error format
 */
export function createDreamFactoryError(
  code: string,
  message: string,
  statusCode: number,
  context?: Record<string, unknown>
): HttpResponse {
  const errorResponse: DreamFactoryError = {
    error: {
      code,
      message,
      status_code: statusCode,
      ...(context && { context }),
    },
  };

  return HttpResponse.json(errorResponse, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Generates a unique error ID for tracking
 * @returns Unique error identifier
 */
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets current ISO timestamp for error context
 * @returns ISO timestamp string
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// 400 BAD REQUEST ERRORS
// ============================================================================

/**
 * Creates a generic bad request error (400)
 */
export function createBadRequestError(
  message: string = 'Bad request',
  context?: Record<string, unknown>
): HttpResponse {
  return createDreamFactoryError(
    ERROR_CODES.BAD_REQUEST,
    message,
    400,
    context
  );
}

/**
 * Creates a validation error response (400)
 */
export function createValidationError(
  message: string = 'Validation failed',
  fieldErrors?: FieldErrors,
  additionalContext?: Record<string, unknown>
): HttpResponse {
  const context: ValidationErrorContext = {
    ...additionalContext,
  };

  if (fieldErrors) {
    context.field_errors = fieldErrors;
    context.invalid_fields = Object.keys(fieldErrors);
  }

  return createDreamFactoryError(
    ERROR_CODES.VALIDATION_ERROR,
    message,
    400,
    context
  );
}

/**
 * Creates a missing required field error (400)
 */
export function createMissingFieldError(
  fieldName: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Required field '${fieldName}' is missing`;
  const fieldErrors: FieldErrors = {
    [fieldName]: [message || `${fieldName} is required`],
  };

  return createValidationError(
    message || defaultMessage,
    fieldErrors,
    { missing_field: fieldName }
  );
}

/**
 * Creates an invalid data format error (400)
 */
export function createInvalidDataFormatError(
  fieldName: string,
  expectedFormat: string,
  receivedValue?: unknown
): HttpResponse {
  const message = `Invalid data format for field '${fieldName}'. Expected: ${expectedFormat}`;
  const fieldErrors: FieldErrors = {
    [fieldName]: [`Invalid format. Expected: ${expectedFormat}`],
  };

  const context: ValidationErrorContext = {
    field_errors: fieldErrors,
    expected_format: expectedFormat,
    ...(receivedValue !== undefined && { received_value: receivedValue }),
  };

  return createDreamFactoryError(
    ERROR_CODES.INVALID_DATA_FORMAT,
    message,
    400,
    context
  );
}

/**
 * Creates an invalid parameter error (400)
 */
export function createInvalidParameterError(
  parameterName: string,
  message?: string,
  allowedValues?: string[]
): HttpResponse {
  const defaultMessage = `Invalid parameter: ${parameterName}`;
  const context: Record<string, unknown> = {
    parameter: parameterName,
  };

  if (allowedValues) {
    context.allowed_values = allowedValues;
  }

  return createDreamFactoryError(
    ERROR_CODES.INVALID_PARAMETER,
    message || defaultMessage,
    400,
    context
  );
}

// ============================================================================
// 401 AUTHENTICATION ERRORS
// ============================================================================

/**
 * Creates an authentication required error (401)
 */
export function createAuthenticationRequiredError(
  message: string = 'Authentication required',
  context?: AuthErrorContext
): HttpResponse {
  return createDreamFactoryError(
    ERROR_CODES.AUTHENTICATION_REQUIRED,
    message,
    401,
    context
  );
}

/**
 * Creates an invalid credentials error (401)
 */
export function createInvalidCredentialsError(
  message: string = 'Invalid credentials provided',
  context?: AuthErrorContext
): HttpResponse {
  return createDreamFactoryError(
    ERROR_CODES.INVALID_CREDENTIALS,
    message,
    401,
    context
  );
}

/**
 * Creates a session expired error (401)
 */
export function createSessionExpiredError(
  message: string = 'Session has expired',
  sessionId?: string
): HttpResponse {
  const context: AuthErrorContext = {
    session_expired: true,
    ...(sessionId && { session_id: sessionId }),
  };

  return createDreamFactoryError(
    ERROR_CODES.SESSION_EXPIRED,
    message,
    401,
    context
  );
}

/**
 * Creates an invalid token error (401)
 */
export function createInvalidTokenError(
  message: string = 'Invalid or malformed token',
  tokenType: string = 'session_token'
): HttpResponse {
  const context: AuthErrorContext = {
    invalid_token: true,
    token_type: tokenType,
  };

  return createDreamFactoryError(
    ERROR_CODES.INVALID_TOKEN,
    message,
    401,
    context
  );
}

/**
 * Creates a missing API key error (401)
 */
export function createMissingApiKeyError(
  message: string = 'API key is required'
): HttpResponse {
  const context: AuthErrorContext = {
    missing_credentials: true,
    required_header: 'X-DreamFactory-API-Key',
  };

  return createDreamFactoryError(
    ERROR_CODES.AUTHENTICATION_REQUIRED,
    message,
    401,
    context
  );
}

// ============================================================================
// 403 AUTHORIZATION ERRORS
// ============================================================================

/**
 * Creates a forbidden access error (403)
 */
export function createForbiddenError(
  message: string = 'Access forbidden',
  context?: AuthErrorContext
): HttpResponse {
  return createDreamFactoryError(
    ERROR_CODES.FORBIDDEN,
    message,
    403,
    context
  );
}

/**
 * Creates an insufficient permissions error (403)
 */
export function createInsufficientPermissionsError(
  requiredRole: string,
  userRole?: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Insufficient permissions. Required role: ${requiredRole}`;
  const context: AuthErrorContext = {
    required_role: requiredRole,
    ...(userRole && { user_role: userRole }),
  };

  return createDreamFactoryError(
    ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    message || defaultMessage,
    403,
    context
  );
}

/**
 * Creates a role required error (403)
 */
export function createRoleRequiredError(
  requiredRole: string,
  operation: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Role '${requiredRole}' required for operation: ${operation}`;
  const context: AuthErrorContext = {
    required_role: requiredRole,
    operation,
  };

  return createDreamFactoryError(
    ERROR_CODES.ROLE_REQUIRED,
    message || defaultMessage,
    403,
    context
  );
}

// ============================================================================
// 404 NOT FOUND ERRORS
// ============================================================================

/**
 * Creates a generic not found error (404)
 */
export function createNotFoundError(
  message: string = 'Resource not found',
  context?: Record<string, unknown>
): HttpResponse {
  return createDreamFactoryError(
    ERROR_CODES.NOT_FOUND,
    message,
    404,
    context
  );
}

/**
 * Creates a resource not found error (404)
 */
export function createResourceNotFoundError(
  resourceType: string,
  resourceId: string | number,
  message?: string
): HttpResponse {
  const defaultMessage = `${resourceType} with ID '${resourceId}' not found`;
  const context = {
    resource_type: resourceType,
    resource_id: resourceId.toString(),
  };

  return createDreamFactoryError(
    ERROR_CODES.RESOURCE_NOT_FOUND,
    message || defaultMessage,
    404,
    context
  );
}

/**
 * Creates a service not found error (404)
 */
export function createServiceNotFoundError(
  serviceName: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Service '${serviceName}' not found`;
  const context = {
    service_name: serviceName,
    available_services: [], // Could be populated with actual service list
  };

  return createDreamFactoryError(
    ERROR_CODES.SERVICE_NOT_FOUND,
    message || defaultMessage,
    404,
    context
  );
}

/**
 * Creates an endpoint not found error (404)
 */
export function createEndpointNotFoundError(
  endpoint: string,
  method: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Endpoint '${method} ${endpoint}' not found`;
  const context = {
    endpoint,
    method,
  };

  return createDreamFactoryError(
    ERROR_CODES.ENDPOINT_NOT_FOUND,
    message || defaultMessage,
    404,
    context
  );
}

// ============================================================================
// 422 UNPROCESSABLE ENTITY ERRORS
// ============================================================================

/**
 * Creates a comprehensive validation error with field-specific errors (422)
 * This is commonly used for form validation failures
 */
export function createFormValidationError(
  fieldErrors: FieldErrors,
  message: string = 'Validation failed'
): HttpResponse {
  const context: ValidationErrorContext = {
    field_errors: fieldErrors,
    invalid_fields: Object.keys(fieldErrors),
    total_errors: Object.values(fieldErrors).reduce((sum, errors) => sum + errors.length, 0),
  };

  return createDreamFactoryError(
    ERROR_CODES.VALIDATION_ERROR,
    message,
    422,
    context
  );
}

/**
 * Creates a database connection validation error (422)
 */
export function createDatabaseConnectionValidationError(
  fieldErrors: FieldErrors,
  testConnectionError?: string
): HttpResponse {
  const context: ValidationErrorContext = {
    field_errors: fieldErrors,
    invalid_fields: Object.keys(fieldErrors),
    ...(testConnectionError && { connection_test_error: testConnectionError }),
  };

  return createDreamFactoryError(
    ERROR_CODES.DATABASE_CONNECTION_FAILED,
    'Database connection validation failed',
    422,
    context
  );
}

/**
 * Creates a schema validation error (422)
 */
export function createSchemaValidationError(
  schemaErrors: string[],
  tableName?: string
): HttpResponse {
  const context = {
    schema_errors: schemaErrors,
    ...(tableName && { table_name: tableName }),
  };

  return createDreamFactoryError(
    ERROR_CODES.INVALID_QUERY,
    'Schema validation failed',
    422,
    context
  );
}

// ============================================================================
// 500 SERVER ERRORS
// ============================================================================

/**
 * Creates a generic internal server error (500)
 */
export function createInternalServerError(
  message: string = 'Internal server error',
  context?: ServerErrorContext
): HttpResponse {
  const errorContext: ServerErrorContext = {
    error_id: generateErrorId(),
    timestamp: getCurrentTimestamp(),
    ...context,
  };

  return createDreamFactoryError(
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    message,
    500,
    errorContext
  );
}

/**
 * Creates a database connection error (500)
 */
export function createDatabaseConnectionError(
  databaseType: string,
  connectionDetails?: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Failed to connect to ${databaseType} database`;
  const context: ServerErrorContext = {
    error_id: generateErrorId(),
    timestamp: getCurrentTimestamp(),
    database_type: databaseType,
    ...(connectionDetails && { connection_details: connectionDetails }),
  };

  return createDreamFactoryError(
    ERROR_CODES.DATABASE_CONNECTION_FAILED,
    message || defaultMessage,
    500,
    context
  );
}

/**
 * Creates a service unavailable error (503)
 */
export function createServiceUnavailableError(
  serviceName: string,
  retryAfter?: number,
  message?: string
): HttpResponse {
  const defaultMessage = `Service '${serviceName}' is temporarily unavailable`;
  const context: ServerErrorContext = {
    error_id: generateErrorId(),
    timestamp: getCurrentTimestamp(),
    service: serviceName,
    ...(retryAfter && { retry_after: retryAfter }),
  };

  const response = createDreamFactoryError(
    ERROR_CODES.SERVICE_UNAVAILABLE,
    message || defaultMessage,
    503,
    context
  );

  // Add Retry-After header if specified
  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * Creates a timeout error (500)
 */
export function createTimeoutError(
  operation: string,
  timeoutDuration: number,
  message?: string
): HttpResponse {
  const defaultMessage = `Operation '${operation}' timed out after ${timeoutDuration}ms`;
  const context: ServerErrorContext = {
    error_id: generateErrorId(),
    timestamp: getCurrentTimestamp(),
    operation,
    timeout_duration: timeoutDuration,
  };

  return createDreamFactoryError(
    ERROR_CODES.TIMEOUT_ERROR,
    message || defaultMessage,
    500,
    context
  );
}

// ============================================================================
// DATABASE-SPECIFIC ERRORS
// ============================================================================

/**
 * Creates a SQL execution error (500)
 */
export function createSqlError(
  sqlError: string,
  query?: string,
  message?: string
): HttpResponse {
  const defaultMessage = 'SQL execution failed';
  const context: ServerErrorContext = {
    error_id: generateErrorId(),
    timestamp: getCurrentTimestamp(),
    sql_error: sqlError,
    ...(query && { query }),
  };

  return createDreamFactoryError(
    ERROR_CODES.SQL_ERROR,
    message || defaultMessage,
    500,
    context
  );
}

/**
 * Creates a schema not found error (404)
 */
export function createSchemaNotFoundError(
  schemaName: string,
  serviceName: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Schema '${schemaName}' not found in service '${serviceName}'`;
  const context = {
    schema_name: schemaName,
    service_name: serviceName,
  };

  return createDreamFactoryError(
    ERROR_CODES.SCHEMA_NOT_FOUND,
    message || defaultMessage,
    404,
    context
  );
}

/**
 * Creates a table not found error (404)
 */
export function createTableNotFoundError(
  tableName: string,
  schemaName?: string,
  serviceName?: string,
  message?: string
): HttpResponse {
  const defaultMessage = `Table '${tableName}' not found`;
  const context: Record<string, unknown> = {
    table_name: tableName,
    ...(schemaName && { schema_name: schemaName }),
    ...(serviceName && { service_name: serviceName }),
  };

  return createDreamFactoryError(
    ERROR_CODES.TABLE_NOT_FOUND,
    message || defaultMessage,
    404,
    context
  );
}

// ============================================================================
// CONVENIENCE ERROR GENERATORS FOR COMMON SCENARIOS
// ============================================================================

/**
 * Creates form validation errors for database service creation
 */
export function createDatabaseServiceValidationErrors(): HttpResponse {
  const fieldErrors: FieldErrors = {
    name: ['Service name is required', 'Service name must be unique'],
    type: ['Database type is required'],
    host: ['Host is required', 'Invalid host format'],
    port: ['Port must be a valid number between 1 and 65535'],
    username: ['Username is required'],
    password: ['Password is required', 'Password must be at least 8 characters'],
    database: ['Database name is required'],
  };

  return createFormValidationError(fieldErrors, 'Database service validation failed');
}

/**
 * Creates API generation validation errors
 */
export function createApiGenerationValidationErrors(): HttpResponse {
  const fieldErrors: FieldErrors = {
    service_name: ['Service name is required'],
    tables: ['At least one table must be selected'],
    endpoints: ['At least one endpoint type must be selected'],
    authentication: ['Authentication method is required'],
  };

  return createFormValidationError(fieldErrors, 'API generation validation failed');
}

/**
 * Creates authentication form validation errors
 */
export function createAuthenticationValidationErrors(): HttpResponse {
  const fieldErrors: FieldErrors = {
    email: ['Email is required', 'Invalid email format'],
    password: ['Password is required', 'Password must be at least 8 characters'],
  };

  return createFormValidationError(fieldErrors, 'Authentication validation failed');
}

/**
 * Creates user management validation errors
 */
export function createUserValidationErrors(): HttpResponse {
  const fieldErrors: FieldErrors = {
    name: ['Name is required'],
    email: ['Email is required', 'Email must be unique'],
    first_name: ['First name is required'],
    last_name: ['Last name is required'],
    password: ['Password is required', 'Password must contain uppercase, lowercase, number and special character'],
    confirm_password: ['Password confirmation is required', 'Passwords do not match'],
  };

  return createFormValidationError(fieldErrors, 'User validation failed');
}

// ============================================================================
// ERROR TESTING UTILITIES
// ============================================================================

/**
 * Generates a random error response for testing error handling robustness
 */
export function createRandomError(): HttpResponse {
  const errorTypes = [
    () => createBadRequestError('Random bad request error'),
    () => createValidationError('Random validation error'),
    () => createAuthenticationRequiredError('Random auth error'),
    () => createForbiddenError('Random forbidden error'),
    () => createNotFoundError('Random not found error'),
    () => createInternalServerError('Random server error'),
  ];

  const randomErrorGenerator = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  return randomErrorGenerator();
}

/**
 * Creates an error response based on a test scenario name
 * Useful for systematic error scenario testing
 */
export function createErrorByScenario(scenario: string): HttpResponse {
  const scenarios: Record<string, () => HttpResponse> = {
    'missing-api-key': () => createMissingApiKeyError(),
    'invalid-credentials': () => createInvalidCredentialsError(),
    'session-expired': () => createSessionExpiredError(),
    'insufficient-permissions': () => createInsufficientPermissionsError('admin', 'user'),
    'service-not-found': () => createServiceNotFoundError('test-service'),
    'database-connection-failed': () => createDatabaseConnectionError('MySQL'),
    'validation-failed': () => createDatabaseServiceValidationErrors(),
    'server-error': () => createInternalServerError(),
    'timeout': () => createTimeoutError('database-connection', 30000),
    'service-unavailable': () => createServiceUnavailableError('api-service', 60),
  };

  const errorGenerator = scenarios[scenario];
  if (!errorGenerator) {
    return createBadRequestError(`Unknown error scenario: ${scenario}`);
  }

  return errorGenerator();
}

/**
 * Creates a collection of all possible error responses for comprehensive testing
 * Useful for testing error handling across all scenarios
 */
export function getAllErrorScenarios(): Record<string, HttpResponse> {
  return {
    // 400 errors
    'bad-request': createBadRequestError(),
    'validation-error': createValidationError(),
    'missing-field': createMissingFieldError('required_field'),
    'invalid-format': createInvalidDataFormatError('email', 'email address'),
    'invalid-parameter': createInvalidParameterError('sort_order', undefined, ['asc', 'desc']),

    // 401 errors
    'auth-required': createAuthenticationRequiredError(),
    'invalid-credentials': createInvalidCredentialsError(),
    'session-expired': createSessionExpiredError(),
    'invalid-token': createInvalidTokenError(),
    'missing-api-key': createMissingApiKeyError(),

    // 403 errors
    'forbidden': createForbiddenError(),
    'insufficient-permissions': createInsufficientPermissionsError('admin'),
    'role-required': createRoleRequiredError('admin', 'delete-user'),

    // 404 errors
    'not-found': createNotFoundError(),
    'resource-not-found': createResourceNotFoundError('User', '123'),
    'service-not-found': createServiceNotFoundError('test-service'),
    'endpoint-not-found': createEndpointNotFoundError('/api/v2/test', 'GET'),
    'schema-not-found': createSchemaNotFoundError('test_schema', 'mysql-service'),
    'table-not-found': createTableNotFoundError('users', 'public', 'postgresql-service'),

    // 422 errors
    'form-validation': createFormValidationError({
      name: ['Name is required'],
      email: ['Invalid email format'],
    }),
    'database-validation': createDatabaseConnectionValidationErrors(),
    'api-generation-validation': createApiGenerationValidationErrors(),

    // 500 errors
    'server-error': createInternalServerError(),
    'database-connection-error': createDatabaseConnectionError('PostgreSQL'),
    'sql-error': createSqlError('Table does not exist'),
    'timeout-error': createTimeoutError('schema-discovery', 30000),

    // 503 errors
    'service-unavailable': createServiceUnavailableError('database-service', 60),
  };
}