/**
 * DreamFactory API Error Response Generators
 * 
 * Utility functions for generating consistent DreamFactory API error responses
 * that match the backend error format exactly. Provides reusable error response
 * generators for different HTTP status codes and comprehensive error scenarios
 * to support thorough testing of error handling throughout the application.
 * 
 * This module replicates the error response structure from the Angular implementation
 * while providing enhanced testing capabilities for the React/Next.js migration.
 */

import { HttpResponse } from 'msw';

/**
 * DreamFactory API Error Response Structure
 * Matches the GenericErrorResponse interface from the Angular implementation
 */
export interface DreamFactoryError {
  error: {
    code: number | string;
    message: string;
    status_code: number;
    context: 
      | string 
      | null 
      | { 
          error?: Array<any>; 
          resource?: Array<DreamFactoryError>;
          [key: string]: any;
        };
  };
}

/**
 * Validation Error Structure for Form Field Testing
 * Used for 422 Unprocessable Entity responses with field-specific errors
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * Field Error Context for Comprehensive Form Validation Testing
 */
export interface FieldErrorContext {
  error: ValidationError[];
  resource: DreamFactoryError[];
}

/**
 * Core Error Response Generator
 * Creates the base DreamFactory error response structure
 * 
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @param context - Additional error context (optional)
 * @param code - Error code (defaults to status code)
 * @returns HttpResponse with DreamFactory error format
 */
export function createDreamFactoryError(
  statusCode: number,
  message: string,
  context: any = null,
  code?: number | string
): HttpResponse {
  const errorResponse: DreamFactoryError = {
    error: {
      code: code || statusCode,
      message,
      status_code: statusCode,
      context,
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
 * 400 Bad Request Error Generators
 * For malformed requests, invalid parameters, and client-side errors
 */

/**
 * Generic bad request error
 */
export function createBadRequestError(
  message: string = 'Bad request - invalid parameters or malformed request',
  context?: any
): HttpResponse {
  return createDreamFactoryError(400, message, context, 'BAD_REQUEST');
}

/**
 * Invalid JSON payload error
 */
export function createInvalidJsonError(
  details?: string
): HttpResponse {
  return createBadRequestError(
    `Invalid JSON payload${details ? `: ${details}` : ''}`,
    { parsing_error: details || 'Malformed JSON structure' }
  );
}

/**
 * Missing required parameter error
 */
export function createMissingParameterError(
  parameterName: string,
  parameterType: 'query' | 'body' | 'header' | 'path' = 'body'
): HttpResponse {
  return createBadRequestError(
    `Missing required ${parameterType} parameter: ${parameterName}`,
    { 
      parameter: parameterName, 
      type: parameterType,
      expected: 'required',
    }
  );
}

/**
 * Invalid parameter value error
 */
export function createInvalidParameterError(
  parameterName: string,
  expectedType: string,
  actualValue?: any
): HttpResponse {
  return createBadRequestError(
    `Invalid value for parameter '${parameterName}'. Expected ${expectedType}`,
    {
      parameter: parameterName,
      expected_type: expectedType,
      provided_value: actualValue,
    }
  );
}

/**
 * 401 Unauthorized Error Generators
 * For authentication failures and invalid credentials
 */

/**
 * Generic unauthorized error
 */
export function createUnauthorizedError(
  message: string = 'Unauthorized access - authentication required'
): HttpResponse {
  return createDreamFactoryError(401, message, null, 'UNAUTHORIZED');
}

/**
 * Invalid credentials error
 */
export function createInvalidCredentialsError(
  details?: string
): HttpResponse {
  return createUnauthorizedError(
    `Invalid credentials${details ? `: ${details}` : ''}`,
  );
}

/**
 * Expired session token error
 */
export function createExpiredSessionError(): HttpResponse {
  return createUnauthorizedError(
    'Session token has expired - please login again'
  );
}

/**
 * Missing API key error
 */
export function createMissingApiKeyError(): HttpResponse {
  return createUnauthorizedError(
    'Missing API key - X-DreamFactory-API-Key header required'
  );
}

/**
 * Invalid API key error
 */
export function createInvalidApiKeyError(): HttpResponse {
  return createUnauthorizedError(
    'Invalid API key - please check your application credentials'
  );
}

/**
 * Missing session token error
 */
export function createMissingSessionTokenError(): HttpResponse {
  return createUnauthorizedError(
    'Missing session token - X-DreamFactory-Session-Token header required'
  );
}

/**
 * Invalid session token error
 */
export function createInvalidSessionTokenError(): HttpResponse {
  return createUnauthorizedError(
    'Invalid session token - please login again'
  );
}

/**
 * 403 Forbidden Error Generators
 * For authorization failures and access control violations
 */

/**
 * Generic forbidden error
 */
export function createForbiddenError(
  message: string = 'Access denied - insufficient permissions'
): HttpResponse {
  return createDreamFactoryError(403, message, null, 'FORBIDDEN');
}

/**
 * Insufficient permissions error
 */
export function createInsufficientPermissionsError(
  resource?: string,
  action?: string
): HttpResponse {
  const resourceText = resource ? ` to ${resource}` : '';
  const actionText = action ? ` for ${action} operation` : '';
  
  return createForbiddenError(
    `Insufficient permissions${resourceText}${actionText}`,
  );
}

/**
 * Role-based access denied error
 */
export function createRoleAccessDeniedError(
  requiredRole: string,
  currentRole?: string
): HttpResponse {
  return createForbiddenError(
    `Access denied - ${requiredRole} role required${currentRole ? ` (current: ${currentRole})` : ''}`,
  );
}

/**
 * Service access denied error
 */
export function createServiceAccessDeniedError(
  serviceName: string
): HttpResponse {
  return createForbiddenError(
    `Access denied to service: ${serviceName}`,
  );
}

/**
 * Database access denied error
 */
export function createDatabaseAccessDeniedError(
  databaseName: string,
  operation?: string
): HttpResponse {
  const operationText = operation ? ` for ${operation} operation` : '';
  
  return createForbiddenError(
    `Access denied to database '${databaseName}'${operationText}`,
  );
}

/**
 * 404 Not Found Error Generators
 * For missing resources and invalid endpoints
 */

/**
 * Generic not found error
 */
export function createNotFoundError(
  message: string = 'Resource not found'
): HttpResponse {
  return createDreamFactoryError(404, message, null, 'NOT_FOUND');
}

/**
 * Service not found error
 */
export function createServiceNotFoundError(
  serviceName: string
): HttpResponse {
  return createNotFoundError(
    `Service '${serviceName}' not found or is not accessible`,
  );
}

/**
 * Endpoint not found error
 */
export function createEndpointNotFoundError(
  endpoint: string
): HttpResponse {
  return createNotFoundError(
    `Endpoint '${endpoint}' not found`,
  );
}

/**
 * Database not found error
 */
export function createDatabaseNotFoundError(
  databaseName: string
): HttpResponse {
  return createNotFoundError(
    `Database '${databaseName}' not found or is not accessible`,
  );
}

/**
 * Table not found error
 */
export function createTableNotFoundError(
  tableName: string,
  serviceName?: string
): HttpResponse {
  const serviceText = serviceName ? ` in service '${serviceName}'` : '';
  
  return createNotFoundError(
    `Table '${tableName}' not found${serviceText}`,
  );
}

/**
 * Record not found error
 */
export function createRecordNotFoundError(
  recordId: string | number,
  tableName?: string
): HttpResponse {
  const tableText = tableName ? ` in table '${tableName}'` : '';
  
  return createNotFoundError(
    `Record with ID '${recordId}' not found${tableText}`,
  );
}

/**
 * 422 Unprocessable Entity Error Generators
 * For validation errors and form field testing
 */

/**
 * Generic validation error
 */
export function createValidationError(
  message: string = 'Validation failed',
  fieldErrors?: ValidationError[]
): HttpResponse {
  const context: FieldErrorContext | null = fieldErrors ? {
    error: fieldErrors,
    resource: [],
  } : null;

  return createDreamFactoryError(422, message, context, 'VALIDATION_ERROR');
}

/**
 * Single field validation error
 */
export function createFieldValidationError(
  field: string,
  message: string,
  code?: string,
  value?: any
): HttpResponse {
  const fieldError: ValidationError = {
    field,
    message,
    code,
    value,
  };

  return createValidationError(
    `Validation failed for field: ${field}`,
    [fieldError]
  );
}

/**
 * Multiple field validation errors
 */
export function createMultipleFieldValidationErrors(
  errors: Array<{ field: string; message: string; code?: string; value?: any }>
): HttpResponse {
  const fieldErrors: ValidationError[] = errors.map(error => ({
    field: error.field,
    message: error.message,
    code: error.code,
    value: error.value,
  }));

  return createValidationError(
    `Validation failed for ${errors.length} field${errors.length > 1 ? 's' : ''}`,
    fieldErrors
  );
}

/**
 * Database connection validation errors
 */
export function createConnectionValidationError(
  connectionErrors: Array<{ field: string; message: string }>
): HttpResponse {
  return createMultipleFieldValidationErrors(
    connectionErrors.map(error => ({
      ...error,
      code: 'CONNECTION_VALIDATION',
    }))
  );
}

/**
 * Schema validation errors
 */
export function createSchemaValidationError(
  schemaErrors: Array<{ field: string; message: string }>
): HttpResponse {
  return createMultipleFieldValidationErrors(
    schemaErrors.map(error => ({
      ...error,
      code: 'SCHEMA_VALIDATION',
    }))
  );
}

/**
 * Common form validation error scenarios
 */
export const formValidationErrors = {
  /**
   * Required field validation errors
   */
  requiredField: (fieldName: string) =>
    createFieldValidationError(fieldName, `${fieldName} is required`, 'REQUIRED'),

  /**
   * Email format validation error
   */
  invalidEmail: (email: string) =>
    createFieldValidationError('email', 'Invalid email format', 'INVALID_FORMAT', email),

  /**
   * Password strength validation error
   */
  weakPassword: () =>
    createFieldValidationError(
      'password',
      'Password must be at least 8 characters with uppercase, lowercase, and numbers',
      'WEAK_PASSWORD'
    ),

  /**
   * Duplicate value validation error
   */
  duplicateValue: (fieldName: string, value: any) =>
    createFieldValidationError(
      fieldName,
      `${fieldName} '${value}' already exists`,
      'DUPLICATE_VALUE',
      value
    ),

  /**
   * Invalid length validation error
   */
  invalidLength: (fieldName: string, minLength?: number, maxLength?: number) => {
    let message = `${fieldName} length is invalid`;
    if (minLength && maxLength) {
      message += ` (must be between ${minLength} and ${maxLength} characters)`;
    } else if (minLength) {
      message += ` (must be at least ${minLength} characters)`;
    } else if (maxLength) {
      message += ` (must be no more than ${maxLength} characters)`;
    }
    
    return createFieldValidationError(fieldName, message, 'INVALID_LENGTH');
  },

  /**
   * Invalid format validation error
   */
  invalidFormat: (fieldName: string, expectedFormat: string) =>
    createFieldValidationError(
      fieldName,
      `${fieldName} format is invalid (expected: ${expectedFormat})`,
      'INVALID_FORMAT'
    ),
};

/**
 * 500 Internal Server Error Generators
 * For server-side errors and system failures
 */

/**
 * Generic server error
 */
export function createServerError(
  message: string = 'Internal server error',
  details?: any
): HttpResponse {
  return createDreamFactoryError(500, message, details, 'INTERNAL_ERROR');
}

/**
 * Database connection error
 */
export function createDatabaseConnectionError(
  databaseName?: string,
  details?: string
): HttpResponse {
  const dbText = databaseName ? ` to database '${databaseName}'` : '';
  
  return createServerError(
    `Failed to connect${dbText}${details ? `: ${details}` : ''}`,
    { 
      connection_failed: true,
      database: databaseName,
      details,
    }
  );
}

/**
 * Database timeout error
 */
export function createDatabaseTimeoutError(
  operation?: string,
  timeout?: number
): HttpResponse {
  const operationText = operation ? ` during ${operation}` : '';
  const timeoutText = timeout ? ` (timeout: ${timeout}ms)` : '';
  
  return createServerError(
    `Database operation timed out${operationText}${timeoutText}`,
    {
      timeout: true,
      operation,
      timeout_ms: timeout,
    }
  );
}

/**
 * Service unavailable error
 */
export function createServiceUnavailableError(
  serviceName?: string
): HttpResponse {
  const serviceText = serviceName ? ` '${serviceName}'` : '';
  
  return createServerError(
    `Service${serviceText} is temporarily unavailable`,
    {
      service_unavailable: true,
      service: serviceName,
    }
  );
}

/**
 * Configuration error
 */
export function createConfigurationError(
  configType: string,
  details?: string
): HttpResponse {
  return createServerError(
    `Configuration error in ${configType}${details ? `: ${details}` : ''}`,
    {
      configuration_error: true,
      config_type: configType,
      details,
    }
  );
}

/**
 * Network-related Error Generators
 * For connection and network-specific scenarios
 */

/**
 * Network timeout error
 */
export function createNetworkTimeoutError(
  timeout: number = 30000
): HttpResponse {
  return createServerError(
    `Network timeout after ${timeout}ms`,
    {
      network_timeout: true,
      timeout_ms: timeout,
    }
  );
}

/**
 * Connection refused error
 */
export function createConnectionRefusedError(
  host?: string,
  port?: number
): HttpResponse {
  const locationText = host && port ? ` to ${host}:${port}` : '';
  
  return createServerError(
    `Connection refused${locationText}`,
    {
      connection_refused: true,
      host,
      port,
    }
  );
}

/**
 * DNS resolution error
 */
export function createDnsError(
  hostname?: string
): HttpResponse {
  const hostText = hostname ? ` for '${hostname}'` : '';
  
  return createServerError(
    `DNS resolution failed${hostText}`,
    {
      dns_error: true,
      hostname,
    }
  );
}

/**
 * SSL/TLS certificate error
 */
export function createSslError(
  details?: string
): HttpResponse {
  return createServerError(
    `SSL/TLS certificate error${details ? `: ${details}` : ''}`,
    {
      ssl_error: true,
      details,
    }
  );
}

/**
 * Error Scenario Testing Utilities
 * For comprehensive error handling validation
 */

/**
 * Generates a random error response for stress testing
 */
export function createRandomError(): HttpResponse {
  const errorTypes = [
    () => createBadRequestError('Random bad request for testing'),
    () => createUnauthorizedError('Random unauthorized error for testing'),
    () => createForbiddenError('Random forbidden error for testing'),
    () => createNotFoundError('Random not found error for testing'),
    () => createValidationError('Random validation error for testing'),
    () => createServerError('Random server error for testing'),
  ];

  const randomType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  return randomType();
}

/**
 * Creates an error response based on a given scenario
 */
export function createErrorScenario(
  scenario: 'network_timeout' | 'connection_refused' | 'invalid_credentials' | 
          'insufficient_permissions' | 'service_not_found' | 'validation_failed' |
          'database_error' | 'configuration_error',
  context?: any
): HttpResponse {
  switch (scenario) {
    case 'network_timeout':
      return createNetworkTimeoutError(context?.timeout);
    
    case 'connection_refused':
      return createConnectionRefusedError(context?.host, context?.port);
    
    case 'invalid_credentials':
      return createInvalidCredentialsError(context?.details);
    
    case 'insufficient_permissions':
      return createInsufficientPermissionsError(context?.resource, context?.action);
    
    case 'service_not_found':
      return createServiceNotFoundError(context?.serviceName || 'unknown');
    
    case 'validation_failed':
      return createValidationError(context?.message, context?.fieldErrors);
    
    case 'database_error':
      return createDatabaseConnectionError(context?.databaseName, context?.details);
    
    case 'configuration_error':
      return createConfigurationError(context?.configType || 'system', context?.details);
    
    default:
      return createServerError('Unknown error scenario');
  }
}

/**
 * Bulk error response generators for testing multiple error conditions
 */
export const errorScenarios = {
  // Authentication errors
  auth: {
    missingApiKey: () => createMissingApiKeyError(),
    invalidApiKey: () => createInvalidApiKeyError(),
    missingSession: () => createMissingSessionTokenError(),
    invalidSession: () => createInvalidSessionTokenError(),
    expiredSession: () => createExpiredSessionError(),
    invalidCredentials: () => createInvalidCredentialsError(),
  },

  // Authorization errors
  authorization: {
    insufficientPermissions: () => createInsufficientPermissionsError(),
    roleAccessDenied: (role: string) => createRoleAccessDeniedError(role),
    serviceAccessDenied: (service: string) => createServiceAccessDeniedError(service),
    databaseAccessDenied: (database: string) => createDatabaseAccessDeniedError(database),
  },

  // Validation errors
  validation: {
    requiredField: (field: string) => formValidationErrors.requiredField(field),
    invalidEmail: (email: string) => formValidationErrors.invalidEmail(email),
    weakPassword: () => formValidationErrors.weakPassword(),
    duplicateValue: (field: string, value: any) => formValidationErrors.duplicateValue(field, value),
    multipleFields: (errors: Array<{ field: string; message: string }>) =>
      createMultipleFieldValidationErrors(errors),
  },

  // Resource errors
  resources: {
    serviceNotFound: (service: string) => createServiceNotFoundError(service),
    databaseNotFound: (database: string) => createDatabaseNotFoundError(database),
    tableNotFound: (table: string, service?: string) => createTableNotFoundError(table, service),
    recordNotFound: (id: string | number, table?: string) => createRecordNotFoundError(id, table),
    endpointNotFound: (endpoint: string) => createEndpointNotFoundError(endpoint),
  },

  // System errors
  system: {
    databaseConnection: (database?: string, details?: string) =>
      createDatabaseConnectionError(database, details),
    databaseTimeout: (operation?: string, timeout?: number) =>
      createDatabaseTimeoutError(operation, timeout),
    serviceUnavailable: (service?: string) => createServiceUnavailableError(service),
    configuration: (configType: string, details?: string) =>
      createConfigurationError(configType, details),
  },

  // Network errors
  network: {
    timeout: (timeout?: number) => createNetworkTimeoutError(timeout),
    connectionRefused: (host?: string, port?: number) => createConnectionRefusedError(host, port),
    dnsError: (hostname?: string) => createDnsError(hostname),
    sslError: (details?: string) => createSslError(details),
  },
};

/**
 * Export all error generators for easy importing
 * Provides a comprehensive testing toolkit for error scenario validation
 */
export default {
  // Core generators
  createDreamFactoryError,
  
  // Status-specific generators
  createBadRequestError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createValidationError,
  createServerError,
  
  // Validation generators
  createFieldValidationError,
  createMultipleFieldValidationErrors,
  formValidationErrors,
  
  // Scenario generators
  createErrorScenario,
  createRandomError,
  errorScenarios,
  
  // Network generators
  createNetworkTimeoutError,
  createConnectionRefusedError,
  createDnsError,
  createSslError,
  
  // Database generators
  createDatabaseConnectionError,
  createDatabaseTimeoutError,
  
  // Service generators
  createServiceNotFoundError,
  createServiceUnavailableError,
  createConfigurationError,
};