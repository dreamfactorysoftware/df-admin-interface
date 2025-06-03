/**
 * Comprehensive Middleware Types for DreamFactory Admin Interface
 * 
 * Provides TypeScript type definitions for Next.js 15.1+ middleware functionality,
 * including authentication tokens, security permissions, request/response interfaces,
 * error handling types, and performance monitoring to ensure type safety across
 * the entire middleware pipeline.
 * 
 * Key Features:
 * - Next.js middleware authentication with edge runtime optimization
 * - JWT token validation and session management (<100ms processing requirement)
 * - Role-based access control (RBAC) and permission enforcement
 * - Comprehensive error handling and audit logging
 * - API request/response transformation and header management
 * - Performance monitoring and cache hit tracking
 * - Server-side rendering (SSR) compatibility
 * - React 19 concurrent features support
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserSession, JWTPayload, AuthError, AuthErrorCode, Permission, Role } from '@/types/auth';
import { BaseUser, UserProfile } from '@/types/user';
import { HttpMethod, HttpStatusCode, ApiErrorResponse } from '@/types/api';

// ============================================================================
// Core Middleware Request/Response Types
// ============================================================================

/**
 * Enhanced middleware request context with DreamFactory-specific extensions
 * Optimized for sub-100ms processing requirement with performance tracking
 */
export interface MiddlewareRequest extends NextRequest {
  // DreamFactory-specific request properties
  readonly dreamfactory: {
    // Authentication context
    sessionToken: string | null;
    sessionId: string | null;
    apiKey: string | null;
    
    // User context
    user: Partial<UserSession> | null;
    userId: number | null;
    userEmail: string | null;
    
    // Security context
    permissions: string[];
    roleId: number | null;
    isAdmin: boolean;
    isRootAdmin: boolean;
    
    // Request metadata
    requestId: string;
    startTime: number;
    routePath: string;
    isProtectedRoute: boolean;
    isAPIRoute: boolean;
    
    // Cache and performance
    cacheKey: string | null;
    cacheHit: boolean;
    processingTimeMs: number;
    
    // Security tracking
    ipAddress: string;
    userAgent: string;
    referrer: string | null;
    origin: string | null;
  };
  
  // Method to update middleware context
  updateContext: (updates: Partial<MiddlewareRequest['dreamfactory']>) => void;
}

/**
 * Enhanced middleware response with security headers and performance metrics
 * Includes comprehensive audit logging and cache control directives
 */
export interface MiddlewareResponse extends NextResponse {
  // DreamFactory-specific response properties
  readonly dreamfactory: {
    // Processing metrics
    processingTimeMs: number;
    cacheHit: boolean;
    authenticationTime: number;
    authorizationTime: number;
    
    // Security context
    securityHeaders: SecurityHeaders;
    auditEvent: AuditEvent | null;
    
    // Error context (if applicable)
    error: MiddlewareError | null;
    
    // Response metadata
    responseId: string;
    timestamp: Date;
    statusCode: HttpStatusCode;
    
    // Performance warnings
    performanceWarnings: PerformanceWarning[];
  };
}

/**
 * Security headers configuration for middleware responses
 * Implements comprehensive security best practices for DreamFactory
 */
export interface SecurityHeaders {
  // CSRF Protection
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN';
  'X-Content-Type-Options': 'nosniff';
  'X-XSS-Protection': '1; mode=block';
  'Referrer-Policy': 'strict-origin-when-cross-origin';
  
  // Content Security Policy
  'Content-Security-Policy': string;
  
  // HTTPS enforcement
  'Strict-Transport-Security': string;
  
  // DreamFactory-specific headers
  'X-DreamFactory-Version': string;
  'X-Request-ID': string;
  'X-Processing-Time': string;
  'X-Cache-Status': 'HIT' | 'MISS' | 'BYPASS';
  
  // Authentication headers
  'WWW-Authenticate'?: string;
  'Authorization'?: string;
  
  // Custom headers
  [key: string]: string | undefined;
}

// ============================================================================
// Authentication and Session Management Types
// ============================================================================

/**
 * JWT token validation context for middleware processing
 * Enhanced with signature verification and expiration checking
 */
export interface TokenValidationContext {
  // Token properties
  token: string;
  payload: JWTPayload | null;
  signature: string;
  
  // Validation state
  isValid: boolean;
  isExpired: boolean;
  isSignatureValid: boolean;
  
  // Validation metadata
  validatedAt: Date;
  expiresAt: Date | null;
  issuer: string | null;
  audience: string | null;
  
  // Validation options
  allowRefresh: boolean;
  gracePeriodSeconds: number;
  
  // Performance tracking
  validationTimeMs: number;
  
  // Error context
  validationError: TokenValidationError | null;
}

/**
 * Token validation error types for comprehensive error handling
 */
export interface TokenValidationError {
  code: TokenValidationErrorCode;
  message: string;
  details: string;
  timestamp: Date;
  recoverable: boolean;
  suggestedAction: TokenValidationAction;
}

/**
 * Token validation error codes for specific failure scenarios
 */
export enum TokenValidationErrorCode {
  MISSING_TOKEN = 'MISSING_TOKEN',
  MALFORMED_TOKEN = 'MALFORMED_TOKEN',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_ISSUER = 'INVALID_ISSUER',
  INVALID_AUDIENCE = 'INVALID_AUDIENCE',
  INVALID_SUBJECT = 'INVALID_SUBJECT',
  INSUFFICIENT_CLAIMS = 'INSUFFICIENT_CLAIMS',
  BLACKLISTED_TOKEN = 'BLACKLISTED_TOKEN',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Suggested actions for token validation failures
 */
export enum TokenValidationAction {
  REDIRECT_TO_LOGIN = 'REDIRECT_TO_LOGIN',
  ATTEMPT_REFRESH = 'ATTEMPT_REFRESH',
  CLEAR_SESSION = 'CLEAR_SESSION',
  RETRY_VALIDATION = 'RETRY_VALIDATION',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  NO_ACTION = 'NO_ACTION'
}

/**
 * Session management context for middleware operations
 * Supports HttpOnly cookies and session persistence
 */
export interface SessionContext {
  // Session identification
  sessionId: string;
  sessionToken: string;
  userId: number;
  
  // Session metadata
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  
  // User context
  user: Partial<UserSession>;
  userProfile: Partial<UserProfile> | null;
  
  // Security context
  ipAddress: string;
  userAgent: string;
  createdFromIP: string;
  lastActivityIP: string;
  
  // Session configuration
  maxAge: number;
  slidingExpiration: boolean;
  renewThreshold: number;
  
  // Performance tracking
  accessCount: number;
  lastRequestDuration: number;
  averageRequestDuration: number;
  
  // Security flags
  isSecure: boolean;
  isHttpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  requiresRefresh: boolean;
  suspiciousActivity: boolean;
}

/**
 * Session validation options for middleware processing
 * Configurable validation levels for performance optimization
 */
export interface SessionValidationOptions {
  // Validation levels
  validateSignature: boolean;
  checkExpiration: boolean;
  validateUser: boolean;
  validatePermissions: boolean;
  validateSession: boolean;
  
  // Performance options
  allowCache: boolean;
  cacheTimeout: number;
  maxValidationTime: number;
  
  // Security options
  requireSecureConnection: boolean;
  validateIPAddress: boolean;
  validateUserAgent: boolean;
  checkSuspiciousActivity: boolean;
  
  // Refresh options
  allowRefresh: boolean;
  refreshThreshold: number;
  maxRefreshAttempts: number;
  
  // Audit options
  enableAuditLogging: boolean;
  logSuccessfulValidations: boolean;
  logFailedValidations: boolean;
}

// ============================================================================
// Role-Based Access Control (RBAC) Types
// ============================================================================

/**
 * Permission validation context for middleware authorization
 * Supports granular permission checking and role-based access control
 */
export interface PermissionValidationContext {
  // User context
  userId: number;
  userEmail: string;
  userRole: Role | null;
  userPermissions: Permission[];
  
  // Request context
  requestedResource: string;
  requestedAction: string;
  requestMethod: HttpMethod;
  requestPath: string;
  requestQuery: Record<string, string>;
  
  // Permission evaluation
  requiredPermissions: string[];
  hasRequiredPermissions: boolean;
  missingPermissions: string[];
  
  // Role evaluation
  requiredRoles: number[];
  hasRequiredRoles: boolean;
  missingRoles: number[];
  
  // Admin evaluation
  requiresAdmin: boolean;
  requiresRootAdmin: boolean;
  isAdminUser: boolean;
  isRootAdminUser: boolean;
  
  // Validation result
  accessGranted: boolean;
  denyReason: string | null;
  
  // Performance tracking
  evaluationTimeMs: number;
  cacheHit: boolean;
  
  // Audit context
  auditRequired: boolean;
  auditEvent: AuditEvent | null;
}

/**
 * Role-based access control configuration for route protection
 * Supports dynamic route matching and conditional access control
 */
export interface RBACConfig {
  // Resource identification
  resourceName: string;
  resourcePath: string;
  resourcePattern: string;
  
  // Access requirements
  requireAuthentication: boolean;
  requiredPermissions: string[];
  requiredRoles: number[];
  requireAdmin: boolean;
  requireRootAdmin: boolean;
  
  // Conditional access
  allowGuests: boolean;
  allowAnonymous: boolean;
  conditionalRules: ConditionalAccessRule[];
  
  // Error handling
  onAccessDenied: AccessDeniedAction;
  customErrorMessage: string | null;
  redirectUrl: string | null;
  
  // Performance options
  cachePermissions: boolean;
  cacheDuration: number;
  skipPermissionCheck: boolean;
  
  // Audit options
  auditAccess: boolean;
  auditFailures: boolean;
  sensitiveResource: boolean;
}

/**
 * Conditional access rules for dynamic permission evaluation
 */
export interface ConditionalAccessRule {
  // Rule identification
  ruleId: string;
  ruleName: string;
  description: string;
  
  // Conditions
  conditions: AccessCondition[];
  operator: 'AND' | 'OR';
  
  // Actions
  action: ConditionalAccessAction;
  permissions: string[];
  
  // Metadata
  priority: number;
  isActive: boolean;
  validFrom: Date | null;
  validTo: Date | null;
}

/**
 * Access conditions for conditional access rules
 */
export interface AccessCondition {
  type: AccessConditionType;
  field: string;
  operator: AccessConditionOperator;
  value: string | number | boolean | string[];
  caseSensitive: boolean;
}

/**
 * Access condition types for rule evaluation
 */
export enum AccessConditionType {
  USER_PROPERTY = 'USER_PROPERTY',
  REQUEST_HEADER = 'REQUEST_HEADER',
  REQUEST_QUERY = 'REQUEST_QUERY',
  REQUEST_BODY = 'REQUEST_BODY',
  IP_ADDRESS = 'IP_ADDRESS',
  USER_AGENT = 'USER_AGENT',
  TIME_OF_DAY = 'TIME_OF_DAY',
  DAY_OF_WEEK = 'DAY_OF_WEEK',
  GEOGRAPHIC_LOCATION = 'GEOGRAPHIC_LOCATION',
  CUSTOM = 'CUSTOM'
}

/**
 * Access condition operators for comparison logic
 */
export enum AccessConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  REGEX = 'REGEX',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL'
}

/**
 * Conditional access actions for rule outcomes
 */
export enum ConditionalAccessAction {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  REQUIRE_ADDITIONAL_AUTH = 'REQUIRE_ADDITIONAL_AUTH',
  REQUIRE_MFA = 'REQUIRE_MFA',
  RATE_LIMIT = 'RATE_LIMIT',
  LOG_ONLY = 'LOG_ONLY',
  REDIRECT = 'REDIRECT',
  CUSTOM = 'CUSTOM'
}

/**
 * Access denied actions for authorization failures
 */
export enum AccessDeniedAction {
  RETURN_403 = 'RETURN_403',
  RETURN_404 = 'RETURN_404',
  REDIRECT_TO_LOGIN = 'REDIRECT_TO_LOGIN',
  REDIRECT_TO_CUSTOM = 'REDIRECT_TO_CUSTOM',
  RETURN_CUSTOM_ERROR = 'RETURN_CUSTOM_ERROR',
  LOG_AND_CONTINUE = 'LOG_AND_CONTINUE'
}

// ============================================================================
// Error Handling and Logging Types
// ============================================================================

/**
 * Comprehensive middleware error interface with context and recovery options
 */
export interface MiddlewareError extends AuthError {
  // Middleware-specific properties
  middlewareComponent: MiddlewareComponent;
  processingStage: MiddlewareStage;
  recoverable: boolean;
  
  // Request context
  requestId: string;
  requestPath: string;
  requestMethod: HttpMethod;
  requestHeaders: Record<string, string>;
  
  // User context
  userId: number | null;
  userEmail: string | null;
  sessionId: string | null;
  
  // Error metadata
  errorId: string;
  occurredAt: Date;
  stackTrace: string | null;
  innerError: Error | null;
  
  // Performance impact
  processingTimeMs: number;
  timeoutOccurred: boolean;
  resourcesExhausted: boolean;
  
  // Recovery information
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  recoveryActions: RecoveryAction[];
  
  // Audit information
  auditEvent: AuditEvent;
  sensitiveDataExposed: boolean;
  complianceImpact: ComplianceImpact | null;
}

/**
 * Middleware components for error classification
 */
export enum MiddlewareComponent {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SESSION_MANAGEMENT = 'SESSION_MANAGEMENT',
  TOKEN_VALIDATION = 'TOKEN_VALIDATION',
  PERMISSION_CHECKING = 'PERMISSION_CHECKING',
  REQUEST_TRANSFORMATION = 'REQUEST_TRANSFORMATION',
  RESPONSE_TRANSFORMATION = 'RESPONSE_TRANSFORMATION',
  AUDIT_LOGGING = 'AUDIT_LOGGING',
  PERFORMANCE_MONITORING = 'PERFORMANCE_MONITORING',
  SECURITY_HEADERS = 'SECURITY_HEADERS',
  CACHE_MANAGEMENT = 'CACHE_MANAGEMENT',
  ERROR_HANDLING = 'ERROR_HANDLING'
}

/**
 * Middleware processing stages for error context
 */
export enum MiddlewareStage {
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  AUTHENTICATION_CHECK = 'AUTHENTICATION_CHECK',
  TOKEN_VALIDATION = 'TOKEN_VALIDATION',
  SESSION_VALIDATION = 'SESSION_VALIDATION',
  AUTHORIZATION_CHECK = 'AUTHORIZATION_CHECK',
  PERMISSION_EVALUATION = 'PERMISSION_EVALUATION',
  REQUEST_PROCESSING = 'REQUEST_PROCESSING',
  RESPONSE_GENERATION = 'RESPONSE_GENERATION',
  AUDIT_LOGGING = 'AUDIT_LOGGING',
  CLEANUP = 'CLEANUP',
  ERROR_HANDLING = 'ERROR_HANDLING'
}

/**
 * Recovery actions for error handling
 */
export interface RecoveryAction {
  action: RecoveryActionType;
  description: string;
  executed: boolean;
  executedAt: Date | null;
  result: RecoveryResult | null;
  errorMessage: string | null;
}

/**
 * Recovery action types for error recovery
 */
export enum RecoveryActionType {
  RETRY_OPERATION = 'RETRY_OPERATION',
  FALLBACK_TO_CACHE = 'FALLBACK_TO_CACHE',
  SKIP_AUTHORIZATION = 'SKIP_AUTHORIZATION',
  USE_DEFAULT_PERMISSIONS = 'USE_DEFAULT_PERMISSIONS',
  REDIRECT_TO_LOGIN = 'REDIRECT_TO_LOGIN',
  RETURN_ERROR_RESPONSE = 'RETURN_ERROR_RESPONSE',
  LOG_AND_CONTINUE = 'LOG_AND_CONTINUE',
  ESCALATE_TO_ADMIN = 'ESCALATE_TO_ADMIN'
}

/**
 * Recovery result enumeration
 */
export enum RecoveryResult {
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILURE = 'FAILURE',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

/**
 * Compliance impact assessment for errors
 */
export interface ComplianceImpact {
  severity: ComplianceSeverity;
  regulations: string[];
  dataTypes: string[];
  reportingRequired: boolean;
  retentionPeriod: number;
  escalationRequired: boolean;
}

/**
 * Compliance severity levels
 */
export enum ComplianceSeverity {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ============================================================================
// Audit Logging and Security Event Types
// ============================================================================

/**
 * Comprehensive audit event for security compliance and monitoring
 */
export interface AuditEvent {
  // Event identification
  eventId: string;
  eventType: AuditEventType;
  eventSubtype: string;
  
  // Timing information
  timestamp: Date;
  duration: number;
  
  // User context
  userId: number | null;
  userEmail: string | null;
  userRole: string | null;
  sessionId: string | null;
  
  // Request context
  requestId: string;
  requestPath: string;
  requestMethod: HttpMethod;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  
  // Response context
  responseStatus: HttpStatusCode;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  
  // Network context
  ipAddress: string;
  userAgent: string;
  referrer: string | null;
  geoLocation: GeoLocation | null;
  
  // Security context
  authenticationMethod: string | null;
  permissionsChecked: string[];
  accessGranted: boolean;
  denyReason: string | null;
  
  // Performance context
  processingTime: number;
  cacheHit: boolean;
  errorOccurred: boolean;
  
  // Sensitive data handling
  containsSensitiveData: boolean;
  dataClassification: DataClassification;
  
  // Metadata
  metadata: Record<string, any>;
  tags: string[];
  
  // Compliance tracking
  complianceFlags: ComplianceFlag[];
  retentionPolicy: string;
  
  // Related events
  correlationId: string;
  parentEventId: string | null;
  relatedEventIds: string[];
}

/**
 * Audit event types for comprehensive security monitoring
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_ATTEMPT = 'LOGIN_ATTEMPT',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_RENEWED = 'SESSION_RENEWED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_TERMINATED = 'SESSION_TERMINATED',
  
  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHECK = 'PERMISSION_CHECK',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  MALFORMED_REQUEST = 'MALFORMED_REQUEST',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_THEFT_SUSPECTED = 'TOKEN_THEFT_SUSPECTED',
  
  // Data access events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  
  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Compliance events
  COMPLIANCE_VIOLATION = 'COMPLIANCE_VIOLATION',
  AUDIT_LOG_ACCESS = 'AUDIT_LOG_ACCESS',
  DATA_RETENTION_POLICY = 'DATA_RETENTION_POLICY',
  PRIVACY_REQUEST = 'PRIVACY_REQUEST'
}

/**
 * Geographic location information for audit events
 */
export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string | null;
  organization: string | null;
}

/**
 * Data classification levels for audit events
 */
export enum DataClassification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED',
  TOP_SECRET = 'TOP_SECRET'
}

/**
 * Compliance flags for regulatory requirements
 */
export interface ComplianceFlag {
  regulation: string;
  requirement: string;
  met: boolean;
  evidence: string | null;
  assessor: string | null;
  assessedAt: Date;
}

// ============================================================================
// API Transformation Types
// ============================================================================

/**
 * Request transformation context for API processing
 */
export interface RequestTransformationContext {
  // Original request
  originalRequest: NextRequest;
  
  // Transformation configuration
  transformationRules: TransformationRule[];
  enableTransformation: boolean;
  
  // Headers transformation
  headerTransformations: HeaderTransformation[];
  addHeaders: Record<string, string>;
  removeHeaders: string[];
  modifyHeaders: Record<string, string>;
  
  // Body transformation
  bodyTransformation: BodyTransformation | null;
  
  // Query parameter transformation
  queryTransformations: QueryTransformation[];
  
  // Authentication injection
  injectAuthentication: boolean;
  authenticationHeaders: Record<string, string>;
  
  // Performance tracking
  transformationTime: number;
  transformationErrors: TransformationError[];
  
  // Validation
  validateTransformation: boolean;
  validationErrors: ValidationError[];
}

/**
 * Response transformation context for API processing
 */
export interface ResponseTransformationContext {
  // Original response
  originalResponse: NextResponse;
  
  // Transformation configuration
  transformationRules: TransformationRule[];
  enableTransformation: boolean;
  
  // Headers transformation
  headerTransformations: HeaderTransformation[];
  securityHeaders: SecurityHeaders;
  
  // Body transformation
  bodyTransformation: BodyTransformation | null;
  
  // Status code transformation
  statusCodeTransformation: StatusCodeTransformation | null;
  
  // Error handling
  errorTransformation: ErrorTransformation | null;
  
  // Performance tracking
  transformationTime: number;
  transformationErrors: TransformationError[];
  
  // Caching directives
  cacheDirectives: CacheDirective[];
}

/**
 * Transformation rule for request/response processing
 */
export interface TransformationRule {
  ruleId: string;
  ruleName: string;
  description: string;
  
  // Matching criteria
  pathPattern: string;
  methodPattern: HttpMethod[];
  headerPattern: Record<string, string>;
  
  // Transformation actions
  actions: TransformationAction[];
  
  // Conditions
  conditions: TransformationCondition[];
  
  // Configuration
  priority: number;
  isActive: boolean;
  
  // Performance
  maxExecutionTime: number;
  cacheable: boolean;
}

/**
 * Header transformation configuration
 */
export interface HeaderTransformation {
  action: HeaderTransformationAction;
  headerName: string;
  headerValue: string | null;
  condition: string | null;
}

/**
 * Header transformation actions
 */
export enum HeaderTransformationAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  MODIFY = 'MODIFY',
  RENAME = 'RENAME',
  CONDITIONAL_ADD = 'CONDITIONAL_ADD',
  CONDITIONAL_REMOVE = 'CONDITIONAL_REMOVE'
}

/**
 * Body transformation configuration
 */
export interface BodyTransformation {
  transformationType: BodyTransformationType;
  transformationScript: string | null;
  fieldMappings: FieldMapping[];
  validation: BodyValidation | null;
}

/**
 * Body transformation types
 */
export enum BodyTransformationType {
  NONE = 'NONE',
  JSON_MAPPING = 'JSON_MAPPING',
  XML_TRANSFORMATION = 'XML_TRANSFORMATION',
  CUSTOM_SCRIPT = 'CUSTOM_SCRIPT',
  TEMPLATE_BASED = 'TEMPLATE_BASED'
}

/**
 * Field mapping for body transformation
 */
export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformationFunction: string | null;
  defaultValue: any;
  required: boolean;
}

/**
 * Body validation configuration
 */
export interface BodyValidation {
  schema: any; // JSON Schema or Zod schema
  strictValidation: boolean;
  allowAdditionalFields: boolean;
  errorHandling: ValidationErrorHandling;
}

/**
 * Validation error handling strategies
 */
export enum ValidationErrorHandling {
  REJECT_REQUEST = 'REJECT_REQUEST',
  SANITIZE_DATA = 'SANITIZE_DATA',
  LOG_AND_CONTINUE = 'LOG_AND_CONTINUE',
  CUSTOM_HANDLER = 'CUSTOM_HANDLER'
}

/**
 * Query transformation configuration
 */
export interface QueryTransformation {
  action: QueryTransformationAction;
  parameterName: string;
  parameterValue: string | null;
  condition: string | null;
}

/**
 * Query transformation actions
 */
export enum QueryTransformationAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  MODIFY = 'MODIFY',
  RENAME = 'RENAME',
  ENCODE = 'ENCODE',
  DECODE = 'DECODE'
}

/**
 * Status code transformation configuration
 */
export interface StatusCodeTransformation {
  originalStatusCode: HttpStatusCode;
  newStatusCode: HttpStatusCode;
  reason: string;
  preserveBody: boolean;
}

/**
 * Error transformation configuration
 */
export interface ErrorTransformation {
  transformErrorMessages: boolean;
  hideInternalErrors: boolean;
  errorMappings: ErrorMapping[];
  customErrorHandler: string | null;
}

/**
 * Error mapping for transformation
 */
export interface ErrorMapping {
  originalErrorCode: string;
  transformedErrorCode: string;
  transformedErrorMessage: string;
  transformedStatusCode: HttpStatusCode;
}

/**
 * Transformation action configuration
 */
export interface TransformationAction {
  actionType: TransformationActionType;
  actionConfig: Record<string, any>;
  executionOrder: number;
  continueOnError: boolean;
}

/**
 * Transformation action types
 */
export enum TransformationActionType {
  ADD_HEADER = 'ADD_HEADER',
  REMOVE_HEADER = 'REMOVE_HEADER',
  MODIFY_HEADER = 'MODIFY_HEADER',
  TRANSFORM_BODY = 'TRANSFORM_BODY',
  VALIDATE_REQUEST = 'VALIDATE_REQUEST',
  INJECT_AUTHENTICATION = 'INJECT_AUTHENTICATION',
  LOG_REQUEST = 'LOG_REQUEST',
  CACHE_RESPONSE = 'CACHE_RESPONSE',
  RATE_LIMIT = 'RATE_LIMIT',
  CUSTOM_LOGIC = 'CUSTOM_LOGIC'
}

/**
 * Transformation condition for conditional processing
 */
export interface TransformationCondition {
  conditionType: TransformationConditionType;
  conditionValue: string;
  operator: ConditionOperator;
  caseSensitive: boolean;
}

/**
 * Transformation condition types
 */
export enum TransformationConditionType {
  REQUEST_PATH = 'REQUEST_PATH',
  REQUEST_METHOD = 'REQUEST_METHOD',
  REQUEST_HEADER = 'REQUEST_HEADER',
  REQUEST_QUERY = 'REQUEST_QUERY',
  USER_ROLE = 'USER_ROLE',
  USER_PERMISSION = 'USER_PERMISSION',
  TIME_OF_DAY = 'TIME_OF_DAY',
  CUSTOM = 'CUSTOM'
}

/**
 * Condition operators for transformation conditions
 */
export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  REGEX_MATCH = 'REGEX_MATCH',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  IN_LIST = 'IN_LIST',
  NOT_IN_LIST = 'NOT_IN_LIST'
}

/**
 * Transformation error for error handling
 */
export interface TransformationError {
  errorId: string;
  errorType: TransformationErrorType;
  errorMessage: string;
  errorDetails: string;
  occurredAt: Date;
  transformationRule: string;
  recoverable: boolean;
}

/**
 * Transformation error types
 */
export enum TransformationErrorType {
  PARSING_ERROR = 'PARSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ============================================================================
// Cache Management Types
// ============================================================================

/**
 * Cache directive configuration for response caching
 */
export interface CacheDirective {
  directive: CacheDirectiveType;
  value: string | number | null;
  priority: number;
}

/**
 * Cache directive types
 */
export enum CacheDirectiveType {
  MAX_AGE = 'MAX_AGE',
  S_MAXAGE = 'S_MAXAGE',
  NO_CACHE = 'NO_CACHE',
  NO_STORE = 'NO_STORE',
  MUST_REVALIDATE = 'MUST_REVALIDATE',
  PROXY_REVALIDATE = 'PROXY_REVALIDATE',
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  IMMUTABLE = 'IMMUTABLE',
  STALE_WHILE_REVALIDATE = 'STALE_WHILE_REVALIDATE',
  STALE_IF_ERROR = 'STALE_IF_ERROR'
}

/**
 * Cache context for middleware caching
 */
export interface CacheContext {
  // Cache identification
  cacheKey: string;
  cacheKeyHash: string;
  
  // Cache status
  cacheHit: boolean;
  cacheValid: boolean;
  cacheAge: number;
  cacheExpiry: Date | null;
  
  // Cache configuration
  cacheable: boolean;
  cacheStrategy: CacheStrategy;
  cacheDuration: number;
  cacheHeaders: Record<string, string>;
  
  // Performance tracking
  cacheRetrievalTime: number;
  cacheStorageTime: number;
  
  // Cache metadata
  cacheSource: CacheSource;
  cacheVersion: string;
  cacheSize: number;
  
  // Invalidation
  invalidationTriggers: string[];
  lastInvalidated: Date | null;
}

/**
 * Cache strategies for different scenarios
 */
export enum CacheStrategy {
  NO_CACHE = 'NO_CACHE',
  CACHE_FIRST = 'CACHE_FIRST',
  NETWORK_FIRST = 'NETWORK_FIRST',
  STALE_WHILE_REVALIDATE = 'STALE_WHILE_REVALIDATE',
  CACHE_ONLY = 'CACHE_ONLY',
  NETWORK_ONLY = 'NETWORK_ONLY'
}

/**
 * Cache sources for tracking
 */
export enum CacheSource {
  MEMORY = 'MEMORY',
  REDIS = 'REDIS',
  DATABASE = 'DATABASE',
  CDN = 'CDN',
  BROWSER = 'BROWSER',
  EDGE = 'EDGE'
}

// ============================================================================
// Performance Monitoring Types
// ============================================================================

/**
 * Performance metrics for middleware monitoring
 */
export interface PerformanceMetrics {
  // Overall performance
  totalProcessingTime: number;
  averageProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  
  // Component-specific timings
  authenticationTime: number;
  authorizationTime: number;
  tokenValidationTime: number;
  permissionCheckTime: number;
  transformationTime: number;
  auditLoggingTime: number;
  
  // Request/response metrics
  requestSize: number;
  responseSize: number;
  headerCount: number;
  
  // Cache metrics
  cacheHitRate: number;
  cacheRetrievalTime: number;
  cacheStorageTime: number;
  
  // Error metrics
  errorRate: number;
  errorCount: number;
  timeoutCount: number;
  
  // Resource utilization
  memoryUsage: number;
  cpuUsage: number;
  
  // Network metrics
  networkLatency: number;
  dnsLookupTime: number;
  connectTime: number;
}

/**
 * Performance warning for threshold violations
 */
export interface PerformanceWarning {
  warningType: PerformanceWarningType;
  warningMessage: string;
  threshold: number;
  actualValue: number;
  severity: PerformanceWarningSeverity;
  timestamp: Date;
  component: MiddlewareComponent;
  requestId: string;
  userId: number | null;
  
  // Mitigation suggestions
  suggestedActions: string[];
  automaticMitigation: boolean;
  mitigationApplied: boolean;
  
  // Tracking
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

/**
 * Performance warning types
 */
export enum PerformanceWarningType {
  PROCESSING_TIME_EXCEEDED = 'PROCESSING_TIME_EXCEEDED',
  MEMORY_USAGE_HIGH = 'MEMORY_USAGE_HIGH',
  CACHE_MISS_RATE_HIGH = 'CACHE_MISS_RATE_HIGH',
  ERROR_RATE_HIGH = 'ERROR_RATE_HIGH',
  TIMEOUT_RATE_HIGH = 'TIMEOUT_RATE_HIGH',
  REQUEST_SIZE_LARGE = 'REQUEST_SIZE_LARGE',
  RESPONSE_SIZE_LARGE = 'RESPONSE_SIZE_LARGE',
  AUTHENTICATION_SLOW = 'AUTHENTICATION_SLOW',
  AUTHORIZATION_SLOW = 'AUTHORIZATION_SLOW',
  TRANSFORMATION_SLOW = 'TRANSFORMATION_SLOW'
}

/**
 * Performance warning severity levels
 */
export enum PerformanceWarningSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

// ============================================================================
// Next.js Middleware Configuration Types
// ============================================================================

/**
 * Next.js middleware configuration for DreamFactory integration
 */
export interface NextjsMiddlewareConfig {
  // Matching configuration
  matcher: MiddlewareMatcher[];
  
  // Processing configuration
  enableMiddleware: boolean;
  processingTimeout: number;
  maxProcessingTime: number;
  
  // Authentication configuration
  authenticationConfig: AuthenticationConfig;
  
  // Authorization configuration
  authorizationConfig: AuthorizationConfig;
  
  // Transformation configuration
  transformationConfig: TransformationConfig;
  
  // Caching configuration
  cacheConfig: CacheConfig;
  
  // Audit configuration
  auditConfig: AuditConfig;
  
  // Performance configuration
  performanceConfig: PerformanceConfig;
  
  // Error handling configuration
  errorConfig: ErrorConfig;
  
  // Security configuration
  securityConfig: SecurityConfig;
}

/**
 * Middleware matcher configuration for route matching
 */
export interface MiddlewareMatcher {
  // Path matching
  source: string;
  has?: MatcherCondition[];
  missing?: MatcherCondition[];
  
  // Locale configuration
  locale?: boolean;
  
  // Custom matcher logic
  customMatcher?: (request: NextRequest) => boolean;
}

/**
 * Matcher condition for conditional routing
 */
export interface MatcherCondition {
  type: 'header' | 'query' | 'cookie';
  key: string;
  value?: string;
}

/**
 * Authentication configuration for middleware
 */
export interface AuthenticationConfig {
  enabled: boolean;
  tokenValidation: TokenValidationConfig;
  sessionManagement: SessionManagementConfig;
  cookieConfig: CookieConfig;
  oauthConfig: OAuthMiddlewareConfig | null;
  customAuthHandlers: CustomAuthHandler[];
}

/**
 * Token validation configuration
 */
export interface TokenValidationConfig {
  jwtSecret: string;
  jwtAlgorithm: string;
  issuer: string;
  audience: string;
  clockTolerance: number;
  cacheValidation: boolean;
  validationTimeout: number;
}

/**
 * Session management configuration
 */
export interface SessionManagementConfig {
  sessionTimeout: number;
  slidingExpiration: boolean;
  maxConcurrentSessions: number;
  sessionStorage: SessionStorageType;
  sessionEncryption: boolean;
  sessionValidationInterval: number;
}

/**
 * Session storage types
 */
export enum SessionStorageType {
  MEMORY = 'MEMORY',
  REDIS = 'REDIS',
  DATABASE = 'DATABASE',
  ENCRYPTED_COOKIE = 'ENCRYPTED_COOKIE'
}

/**
 * Cookie configuration for middleware
 */
export interface CookieConfig {
  sessionCookieName: string;
  domain: string | null;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  encryptCookies: boolean;
}

/**
 * OAuth middleware configuration
 */
export interface OAuthMiddlewareConfig {
  providers: OAuthProvider[];
  defaultProvider: string;
  callbackPath: string;
  stateCookieName: string;
  pkceRequired: boolean;
}

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string[];
  pkceRequired: boolean;
}

/**
 * Custom authentication handler
 */
export interface CustomAuthHandler {
  name: string;
  description: string;
  handler: (request: NextRequest) => Promise<AuthenticationResult>;
  priority: number;
  enabled: boolean;
}

/**
 * Authentication result from custom handlers
 */
export interface AuthenticationResult {
  authenticated: boolean;
  user: Partial<UserSession> | null;
  error: AuthError | null;
  redirectUrl: string | null;
  headers: Record<string, string>;
}

/**
 * Authorization configuration for middleware
 */
export interface AuthorizationConfig {
  enabled: boolean;
  rbacConfig: RBACMiddlewareConfig;
  permissionCaching: PermissionCachingConfig;
  customAuthorizationHandlers: CustomAuthorizationHandler[];
}

/**
 * RBAC middleware configuration
 */
export interface RBACMiddlewareConfig {
  defaultDenyAll: boolean;
  adminBypass: boolean;
  roleHierarchy: RoleHierarchy[];
  resourcePermissions: ResourcePermission[];
}

/**
 * Role hierarchy configuration
 */
export interface RoleHierarchy {
  roleId: number;
  roleName: string;
  parentRoleId: number | null;
  inheritPermissions: boolean;
}

/**
 * Resource permission configuration
 */
export interface ResourcePermission {
  resourcePattern: string;
  requiredPermissions: string[];
  requiredRoles: number[];
  requireAdmin: boolean;
  allowAnonymous: boolean;
}

/**
 * Permission caching configuration
 */
export interface PermissionCachingConfig {
  enabled: boolean;
  cacheDuration: number;
  cacheSize: number;
  invalidateOnRoleChange: boolean;
  preloadCommonPermissions: boolean;
}

/**
 * Custom authorization handler
 */
export interface CustomAuthorizationHandler {
  name: string;
  description: string;
  handler: (request: NextRequest, user: UserSession) => Promise<AuthorizationResult>;
  priority: number;
  enabled: boolean;
}

/**
 * Authorization result from custom handlers
 */
export interface AuthorizationResult {
  authorized: boolean;
  permissions: string[];
  denyReason: string | null;
  redirectUrl: string | null;
  additionalContext: Record<string, any>;
}

/**
 * Transformation configuration for middleware
 */
export interface TransformationConfig {
  enabled: boolean;
  requestTransformation: boolean;
  responseTransformation: boolean;
  transformationRules: TransformationRule[];
  maxTransformationTime: number;
  cacheTransformations: boolean;
}

/**
 * Cache configuration for middleware
 */
export interface CacheConfig {
  enabled: boolean;
  defaultStrategy: CacheStrategy;
  defaultDuration: number;
  maxCacheSize: number;
  cacheKeyStrategy: CacheKeyStrategy;
  invalidationStrategy: CacheInvalidationStrategy;
}

/**
 * Cache key strategy
 */
export enum CacheKeyStrategy {
  PATH_ONLY = 'PATH_ONLY',
  PATH_AND_QUERY = 'PATH_AND_QUERY',
  USER_SPECIFIC = 'USER_SPECIFIC',
  CUSTOM = 'CUSTOM'
}

/**
 * Cache invalidation strategy
 */
export enum CacheInvalidationStrategy {
  TTL_ONLY = 'TTL_ONLY',
  EVENT_BASED = 'EVENT_BASED',
  MANUAL = 'MANUAL',
  HYBRID = 'HYBRID'
}

/**
 * Audit configuration for middleware
 */
export interface AuditConfig {
  enabled: boolean;
  auditAllRequests: boolean;
  auditFailuresOnly: boolean;
  auditSuccessfulAuth: boolean;
  auditPermissionChecks: boolean;
  auditSensitiveOperations: boolean;
  retentionPeriod: number;
  anonymizePersonalData: boolean;
}

/**
 * Performance configuration for middleware
 */
export interface PerformanceConfig {
  enableMonitoring: boolean;
  processingTimeThreshold: number;
  memoryUsageThreshold: number;
  errorRateThreshold: number;
  enableWarnings: boolean;
  enableAutomaticMitigation: boolean;
  metricsCollectionInterval: number;
}

/**
 * Error configuration for middleware
 */
export interface ErrorConfig {
  handleErrors: boolean;
  returnDetailedErrors: boolean;
  logAllErrors: boolean;
  errorTransformation: boolean;
  customErrorHandlers: CustomErrorHandler[];
  maxRecoveryAttempts: number;
}

/**
 * Custom error handler
 */
export interface CustomErrorHandler {
  name: string;
  description: string;
  handler: (error: MiddlewareError, request: NextRequest) => Promise<NextResponse>;
  errorTypes: MiddlewareComponent[];
  priority: number;
  enabled: boolean;
}

/**
 * Security configuration for middleware
 */
export interface SecurityConfig {
  enableSecurityHeaders: boolean;
  securityHeaders: SecurityHeaders;
  csrfProtection: boolean;
  rateLimiting: RateLimitConfig | null;
  ipWhitelist: string[];
  ipBlacklist: string[];
  userAgentBlacklist: string[];
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
  keyGenerator: (request: NextRequest) => string;
  onLimitReached: (request: NextRequest) => NextResponse;
}

// ============================================================================
// Utility Types and Helper Functions
// ============================================================================

/**
 * Middleware result type for comprehensive operation results
 */
export type MiddlewareResult<T = any> = {
  success: boolean;
  data?: T;
  error?: MiddlewareError;
  warnings?: PerformanceWarning[];
  metrics?: PerformanceMetrics;
  auditEvent?: AuditEvent;
  cacheContext?: CacheContext;
  processingTimeMs: number;
};

/**
 * Middleware operation context for tracking operations
 */
export interface MiddlewareOperationContext {
  operationId: string;
  operationType: MiddlewareOperationType;
  startTime: number;
  endTime?: number;
  request: MiddlewareRequest;
  response?: MiddlewareResponse;
  user?: Partial<UserSession>;
  error?: MiddlewareError;
  metrics?: PerformanceMetrics;
}

/**
 * Middleware operation types
 */
export enum MiddlewareOperationType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  REQUEST_TRANSFORMATION = 'REQUEST_TRANSFORMATION',
  RESPONSE_TRANSFORMATION = 'RESPONSE_TRANSFORMATION',
  AUDIT_LOGGING = 'AUDIT_LOGGING',
  CACHE_OPERATION = 'CACHE_OPERATION',
  PERFORMANCE_MONITORING = 'PERFORMANCE_MONITORING',
  ERROR_HANDLING = 'ERROR_HANDLING'
}

/**
 * Type guards for middleware types
 */
export const MiddlewareTypeGuards = {
  isMiddlewareRequest: (obj: any): obj is MiddlewareRequest => {
    return obj && typeof obj === 'object' && 'dreamfactory' in obj;
  },
  
  isMiddlewareResponse: (obj: any): obj is MiddlewareResponse => {
    return obj && typeof obj === 'object' && 'dreamfactory' in obj;
  },
  
  isMiddlewareError: (obj: any): obj is MiddlewareError => {
    return obj && typeof obj === 'object' && 'middlewareComponent' in obj;
  },
  
  isAuditEvent: (obj: any): obj is AuditEvent => {
    return obj && typeof obj === 'object' && 'eventType' in obj && 'eventId' in obj;
  },
  
  isTokenValidationContext: (obj: any): obj is TokenValidationContext => {
    return obj && typeof obj === 'object' && 'token' in obj && 'isValid' in obj;
  },
  
  isSessionContext: (obj: any): obj is SessionContext => {
    return obj && typeof obj === 'object' && 'sessionId' in obj && 'sessionToken' in obj;
  },
  
  isPermissionValidationContext: (obj: any): obj is PermissionValidationContext => {
    return obj && typeof obj === 'object' && 'userId' in obj && 'requiredPermissions' in obj;
  }
};

/**
 * Default configuration constants
 */
export const MIDDLEWARE_DEFAULTS = {
  PROCESSING_TIMEOUT: 100, // 100ms requirement from spec
  MAX_PROCESSING_TIME: 5000, // 5 second maximum
  CACHE_DURATION: 300, // 5 minutes
  SESSION_TIMEOUT: 1800, // 30 minutes
  TOKEN_REFRESH_THRESHOLD: 300, // 5 minutes
  MAX_RECOVERY_ATTEMPTS: 3,
  PERFORMANCE_WARNING_THRESHOLD: 75, // 75ms
  ERROR_RATE_THRESHOLD: 0.05, // 5%
  CACHE_HIT_RATE_TARGET: 0.8, // 80%
  MAX_AUDIT_RETENTION_DAYS: 365,
  DEFAULT_SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  } as SecurityHeaders
} as const;

/**
 * Route patterns for middleware matching
 */
export const MIDDLEWARE_ROUTE_PATTERNS = {
  PROTECTED_ROUTES: [
    '/admin-settings/:path*',
    '/system-settings/:path*',
    '/api-security/:path*',
    '/api-connections/:path*',
    '/profile/:path*',
    '/adf-:path*'
  ],
  PUBLIC_ROUTES: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/saml-callback',
    '/_next/:path*',
    '/favicon.ico',
    '/public/:path*'
  ],
  API_ROUTES: [
    '/api/:path*'
  ],
  BYPASS_ROUTES: [
    '/_next/static/:path*',
    '/_next/image/:path*',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ]
} as const;

// Export all types for comprehensive type coverage
export type {
  // Re-export commonly used types for convenience
  NextRequest as MiddlewareNextRequest,
  NextResponse as MiddlewareNextResponse,
  MiddlewareRequest as DreamFactoryRequest,
  MiddlewareResponse as DreamFactoryResponse,
  MiddlewareError as DreamFactoryError,
  AuditEvent as SecurityAuditEvent,
  PerformanceMetrics as MiddlewareMetrics,
  NextjsMiddlewareConfig as MiddlewareConfig
};