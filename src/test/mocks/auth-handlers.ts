/**
 * MSW Authentication Handlers
 * 
 * Mock Service Worker handlers for authentication and session management endpoints
 * that replicate the authentication flow behavior from Angular services and interceptors.
 * Provides comprehensive JWT token simulation, user/admin session management,
 * password reset workflows, and error handling for authentication failures.
 * 
 * This module supports the React/Next.js migration by maintaining API contract
 * compatibility while enabling frontend development without backend dependencies.
 */

import { http, HttpResponse } from 'msw';
import { 
  createJsonResponse,
  createAuthErrorResponse,
  createUnauthorizedError,
  createForbiddenError,
  createValidationError,
  validateAuthHeaders,
  extractQueryParams,
  simulateNetworkDelay,
  logRequest,
  processRequestBody,
  API_KEY_HEADER,
  SESSION_TOKEN_HEADER,
} from './utils';
import {
  createInvalidCredentialsError,
  createExpiredSessionError,
  createMissingParameterError,
  createFieldValidationError,
  createMultipleFieldValidationErrors,
  formValidationErrors,
  errorScenarios,
} from './error-responses';
import { mockUsers, mockAdmins, mockRoles } from './mock-data';

// ============================================================================
// JWT TOKEN SIMULATION
// ============================================================================

/**
 * Generates a mock JWT token for testing purposes
 * Replicates the token structure from DreamFactory backend
 * 
 * @param userId - User ID for token payload
 * @param userType - Type of user ('user' | 'admin')
 * @param roleId - Role ID for permissions
 * @param sessionDuration - Session duration in minutes (default: 60)
 * @returns Mock JWT token string
 */
function generateMockJwtToken(
  userId: number,
  userType: 'user' | 'admin',
  roleId?: number,
  sessionDuration: number = 60
): string {
  // Mock JWT header
  const header = {
    typ: 'JWT',
    alg: 'HS256'
  };

  // Mock JWT payload with DreamFactory-specific claims
  const payload = {
    sub: userId.toString(),
    iss: 'dreamfactory',
    aud: 'dreamfactory-client',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (sessionDuration * 60),
    nbf: Math.floor(Date.now() / 1000),
    jti: `mock-jwt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    user_type: userType,
    role_id: roleId,
    session_id: `mock-session-${Date.now()}`,
  };

  // Create mock JWT (not actually signed, for testing only)
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const mockSignature = 'mock-signature-' + Math.random().toString(36).substr(2, 43);

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

/**
 * Validates and decodes a mock JWT token
 * Simulates token validation logic for testing
 * 
 * @param token - JWT token to validate
 * @returns Decoded token payload or null if invalid
 */
function validateMockJwtToken(token: string): any | null {
  try {
    if (!token || !token.includes('.')) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Creates a session response object
 * Matches the DreamFactory session response structure
 * 
 * @param user - User object (can be regular user or admin)
 * @param sessionToken - JWT session token
 * @param userType - Type of user ('user' | 'admin')
 * @returns Session response object
 */
function createSessionResponse(
  user: any,
  sessionToken: string,
  userType: 'user' | 'admin'
) {
  const role = mockRoles.find(r => r.id === user.role_id);
  
  return {
    session_token: sessionToken,
    session_id: `mock-session-${Date.now()}`,
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    username: user.username || user.email,
    is_active: user.is_active,
    is_verified: user.is_verified,
    role: role ? {
      id: role.id,
      name: role.name,
      label: role.label,
      description: role.description,
      is_active: role.is_active,
      permissions: role.permissions,
    } : null,
    role_id: user.role_id,
    last_login_date: new Date().toISOString(),
    host: 'localhost',
    user_agent: 'Mozilla/5.0 (Test Environment)',
    // User-specific fields
    ...(userType === 'user' && {
      phone: user.phone,
      security_question: user.security_question,
      default_app_id: user.default_app_id,
      oauth_provider: user.oauth_provider,
    }),
    // Admin-specific fields
    ...(userType === 'admin' && {
      is_sys_admin: user.is_sys_admin,
    }),
  };
}

// ============================================================================
// USER AUTHENTICATION HANDLERS
// ============================================================================

/**
 * POST /api/v2/user/session
 * User login endpoint with comprehensive validation and error handling
 */
export const userLoginHandler = http.post('/api/v2/user/session', async ({ request }) => {
  // Add network delay simulation
  await simulateNetworkDelay();
  
  // Log request for debugging
  logRequest(request, 'User Login');

  try {
    // Validate API key is present
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Parse request body
    const requestBody = await processRequestBody(request);
    if (!requestBody) {
      return createMissingParameterError('request body', 'body');
    }

    const { email, password, remember_me = false, duration = 0 } = requestBody;

    // Validate required fields
    const validationErrors = [];
    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    }
    if (!password) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    }

    if (validationErrors.length > 0) {
      return createMultipleFieldValidationErrors(validationErrors);
    }

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return createInvalidCredentialsError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      return createForbiddenError('User account is inactive');
    }

    // Check if user is verified
    if (!user.is_verified) {
      return createForbiddenError('User account is not verified');
    }

    // Simulate password validation (in real implementation, this would hash and compare)
    // For testing, we accept any non-empty password for existing users
    if (!password || password.length < 1) {
      return createInvalidCredentialsError('Invalid email or password');
    }

    // Generate session token
    const sessionDuration = duration > 0 ? duration : (remember_me ? 20160 : 60); // 14 days or 1 hour
    const sessionToken = generateMockJwtToken(user.id, 'user', user.role_id, sessionDuration);

    // Create successful login response
    const sessionResponse = createSessionResponse(user, sessionToken, 'user');

    return createJsonResponse(sessionResponse, { status: 200 });

  } catch (error) {
    console.error('User login error:', error);
    return errorScenarios.system.serviceUnavailable('user authentication');
  }
});

/**
 * GET /api/v2/user/session
 * User session validation and refresh endpoint
 */
export const userSessionHandler = http.get('/api/v2/user/session', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'User Session Validation');

  try {
    // Validate authentication headers
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isAuthenticated) {
      if (!authValidation.hasApiKey) {
        return errorScenarios.auth.missingApiKey();
      }
      if (!authValidation.hasSessionToken) {
        return errorScenarios.auth.missingSession();
      }
      return errorScenarios.auth.invalidSession();
    }

    // Validate session token
    const tokenPayload = validateMockJwtToken(authValidation.sessionToken!);
    if (!tokenPayload) {
      return createExpiredSessionError();
    }

    // Find user by token payload
    const user = mockUsers.find(u => u.id === tokenPayload.user_id);
    if (!user || !user.is_active) {
      return errorScenarios.auth.invalidSession();
    }

    // Return current session info
    const sessionResponse = createSessionResponse(user, authValidation.sessionToken!, 'user');
    return createJsonResponse(sessionResponse, { status: 200 });

  } catch (error) {
    console.error('User session validation error:', error);
    return errorScenarios.auth.invalidSession();
  }
});

/**
 * DELETE /api/v2/user/session
 * User logout endpoint
 */
export const userLogoutHandler = http.delete('/api/v2/user/session', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'User Logout');

  try {
    // Validate authentication headers
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Return success response regardless of session validity (logout should always succeed)
    return createJsonResponse({ success: true }, { status: 200 });

  } catch (error) {
    console.error('User logout error:', error);
    return createJsonResponse({ success: true }, { status: 200 });
  }
});

// ============================================================================
// ADMIN AUTHENTICATION HANDLERS
// ============================================================================

/**
 * POST /api/v2/system/admin/session
 * Admin login endpoint with enhanced security validation
 */
export const adminLoginHandler = http.post('/api/v2/system/admin/session', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Admin Login');

  try {
    // Validate API key is present
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Parse request body
    const requestBody = await processRequestBody(request);
    if (!requestBody) {
      return createMissingParameterError('request body', 'body');
    }

    const { email, password, remember_me = false, duration = 0 } = requestBody;

    // Validate required fields
    const validationErrors = [];
    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    }
    if (!password) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    }

    if (validationErrors.length > 0) {
      return createMultipleFieldValidationErrors(validationErrors);
    }

    // Find admin by email
    const admin = mockAdmins.find(a => a.email.toLowerCase() === email.toLowerCase());
    
    if (!admin) {
      return createInvalidCredentialsError('Invalid admin credentials');
    }

    // Check if admin is active
    if (!admin.is_active) {
      return createForbiddenError('Admin account is inactive');
    }

    // Check if admin is verified
    if (!admin.is_verified) {
      return createForbiddenError('Admin account is not verified');
    }

    // Simulate password validation
    if (!password || password.length < 1) {
      return createInvalidCredentialsError('Invalid admin credentials');
    }

    // Generate admin session token with extended duration
    const sessionDuration = duration > 0 ? duration : (remember_me ? 20160 : 120); // 14 days or 2 hours
    const sessionToken = generateMockJwtToken(admin.id, 'admin', admin.role_id, sessionDuration);

    // Create successful admin login response
    const sessionResponse = createSessionResponse(admin, sessionToken, 'admin');

    return createJsonResponse(sessionResponse, { status: 200 });

  } catch (error) {
    console.error('Admin login error:', error);
    return errorScenarios.system.serviceUnavailable('admin authentication');
  }
});

/**
 * GET /api/v2/system/admin/session
 * Admin session validation and refresh endpoint
 */
export const adminSessionHandler = http.get('/api/v2/system/admin/session', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Admin Session Validation');

  try {
    // Validate authentication headers
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isAuthenticated) {
      if (!authValidation.hasApiKey) {
        return errorScenarios.auth.missingApiKey();
      }
      if (!authValidation.hasSessionToken) {
        return errorScenarios.auth.missingSession();
      }
      return errorScenarios.auth.invalidSession();
    }

    // Validate session token
    const tokenPayload = validateMockJwtToken(authValidation.sessionToken!);
    if (!tokenPayload || tokenPayload.user_type !== 'admin') {
      return createExpiredSessionError();
    }

    // Find admin by token payload
    const admin = mockAdmins.find(a => a.id === tokenPayload.user_id);
    if (!admin || !admin.is_active) {
      return errorScenarios.auth.invalidSession();
    }

    // Return current admin session info
    const sessionResponse = createSessionResponse(admin, authValidation.sessionToken!, 'admin');
    return createJsonResponse(sessionResponse, { status: 200 });

  } catch (error) {
    console.error('Admin session validation error:', error);
    return errorScenarios.auth.invalidSession();
  }
});

/**
 * DELETE /api/v2/system/admin/session
 * Admin logout endpoint
 */
export const adminLogoutHandler = http.delete('/api/v2/system/admin/session', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Admin Logout');

  try {
    // Validate authentication headers
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Return success response regardless of session validity
    return createJsonResponse({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Admin logout error:', error);
    return createJsonResponse({ success: true }, { status: 200 });
  }
});

// ============================================================================
// PASSWORD RESET HANDLERS
// ============================================================================

/**
 * POST /api/v2/user/password
 * Password reset request endpoint
 */
export const passwordResetRequestHandler = http.post('/api/v2/user/password', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Password Reset Request');

  try {
    // Validate API key
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Parse request body
    const requestBody = await processRequestBody(request);
    if (!requestBody) {
      return createMissingParameterError('request body', 'body');
    }

    const { email, reset_url } = requestBody;

    // Validate required fields
    if (!email) {
      return formValidationErrors.requiredField('email');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return formValidationErrors.invalidEmail(email);
    }

    // Find user by email (but don't reveal if user exists for security)
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Always return success to prevent email enumeration attacks
    return createJsonResponse({
      success: true,
      message: 'Password reset instructions have been sent to your email address.',
      // In real implementation, email would be sent here
      ...(process.env.NODE_ENV === 'development' && user && {
        // Development-only: include reset token for testing
        reset_token: `mock-reset-token-${user.id}-${Date.now()}`,
        reset_url: reset_url || '/password/reset',
      }),
    }, { status: 200 });

  } catch (error) {
    console.error('Password reset request error:', error);
    return errorScenarios.system.serviceUnavailable('password reset');
  }
});

/**
 * PUT /api/v2/user/password
 * Password reset confirmation endpoint
 */
export const passwordResetConfirmHandler = http.put('/api/v2/user/password', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Password Reset Confirm');

  try {
    // Validate API key
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Parse request body
    const requestBody = await processRequestBody(request);
    if (!requestBody) {
      return createMissingParameterError('request body', 'body');
    }

    const { email, code, new_password, verify_code } = requestBody;

    // Validate required fields
    const validationErrors = [];
    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    }
    if (!code && !verify_code) {
      validationErrors.push({ field: 'code', message: 'Reset code is required' });
    }
    if (!new_password) {
      validationErrors.push({ field: 'new_password', message: 'New password is required' });
    }

    if (validationErrors.length > 0) {
      return createMultipleFieldValidationErrors(validationErrors);
    }

    // Validate password strength
    if (new_password.length < 8) {
      return formValidationErrors.weakPassword();
    }

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return createInvalidCredentialsError('Invalid reset code or email');
    }

    // Validate reset code (in real implementation, this would check against stored code)
    const resetCode = code || verify_code;
    if (!resetCode || !resetCode.includes('mock-reset-token')) {
      return createInvalidCredentialsError('Invalid reset code');
    }

    // Success response
    return createJsonResponse({
      success: true,
      message: 'Password has been reset successfully.',
    }, { status: 200 });

  } catch (error) {
    console.error('Password reset confirm error:', error);
    return errorScenarios.system.serviceUnavailable('password reset');
  }
});

// ============================================================================
// USER REGISTRATION HANDLERS
// ============================================================================

/**
 * POST /api/v2/user/register
 * User registration endpoint with comprehensive validation
 */
export const userRegisterHandler = http.post('/api/v2/user/register', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'User Registration');

  try {
    // Validate API key
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Parse request body
    const requestBody = await processRequestBody(request);
    if (!requestBody) {
      return createMissingParameterError('request body', 'body');
    }

    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone,
      confirm_password 
    } = requestBody;

    // Validate required fields
    const validationErrors = [];
    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    }
    if (!password) {
      validationErrors.push({ field: 'password', message: 'Password is required' });
    }
    if (!first_name) {
      validationErrors.push({ field: 'first_name', message: 'First name is required' });
    }
    if (!last_name) {
      validationErrors.push({ field: 'last_name', message: 'Last name is required' });
    }

    if (validationErrors.length > 0) {
      return createMultipleFieldValidationErrors(validationErrors);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return formValidationErrors.invalidEmail(email);
    }

    // Check for duplicate email
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return formValidationErrors.duplicateValue('email', email);
    }

    // Validate password strength
    if (password.length < 8) {
      return formValidationErrors.weakPassword();
    }

    // Validate password confirmation if provided
    if (confirm_password && password !== confirm_password) {
      return createFieldValidationError(
        'confirm_password',
        'Password confirmation does not match',
        'MISMATCH'
      );
    }

    // Create new user ID
    const newUserId = Math.max(...mockUsers.map(u => u.id)) + 1;

    // Success response (in real implementation, user would be created in database)
    return createJsonResponse({
      success: true,
      message: 'User registration successful.',
      id: newUserId,
      email,
      first_name,
      last_name,
      is_active: true,
      is_verified: false, // Usually requires email verification
      created_date: new Date().toISOString(),
      // Development-only: include verification token for testing
      ...(process.env.NODE_ENV === 'development' && {
        verification_token: `mock-verify-token-${newUserId}-${Date.now()}`,
      }),
    }, { status: 201 });

  } catch (error) {
    console.error('User registration error:', error);
    return errorScenarios.system.serviceUnavailable('user registration');
  }
});

/**
 * PUT /api/v2/user/verify
 * Email verification endpoint
 */
export const emailVerifyHandler = http.put('/api/v2/user/verify', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Email Verification');

  try {
    // Validate API key
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.hasApiKey) {
      return errorScenarios.auth.missingApiKey();
    }

    // Parse request body
    const requestBody = await processRequestBody(request);
    if (!requestBody) {
      return createMissingParameterError('request body', 'body');
    }

    const { email, code, verify_code } = requestBody;

    // Validate required fields
    const validationErrors = [];
    if (!email) {
      validationErrors.push({ field: 'email', message: 'Email is required' });
    }
    if (!code && !verify_code) {
      validationErrors.push({ field: 'code', message: 'Verification code is required' });
    }

    if (validationErrors.length > 0) {
      return createMultipleFieldValidationErrors(validationErrors);
    }

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return createInvalidCredentialsError('Invalid verification code or email');
    }

    // Validate verification code
    const verificationCode = code || verify_code;
    if (!verificationCode || !verificationCode.includes('mock-verify-token')) {
      return createInvalidCredentialsError('Invalid verification code');
    }

    // Success response
    return createJsonResponse({
      success: true,
      message: 'Email verification successful.',
    }, { status: 200 });

  } catch (error) {
    console.error('Email verification error:', error);
    return errorScenarios.system.serviceUnavailable('email verification');
  }
});

// ============================================================================
// SESSION VALIDATION UTILITIES
// ============================================================================

/**
 * Generic session validation handler for middleware testing
 * Can be used to test session validation in different contexts
 */
export const sessionValidationHandler = http.get('/api/v2/session/validate', async ({ request }) => {
  await simulateNetworkDelay();
  logRequest(request, 'Session Validation');

  try {
    // Extract query parameters
    const url = new URL(request.url);
    const userType = url.searchParams.get('user_type') || 'user';

    // Validate authentication headers
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isAuthenticated) {
      return createUnauthorizedError('Invalid or missing session');
    }

    // Validate session token
    const tokenPayload = validateMockJwtToken(authValidation.sessionToken!);
    if (!tokenPayload) {
      return createExpiredSessionError();
    }

    // Find user based on user type
    let user;
    if (userType === 'admin' || tokenPayload.user_type === 'admin') {
      user = mockAdmins.find(a => a.id === tokenPayload.user_id);
    } else {
      user = mockUsers.find(u => u.id === tokenPayload.user_id);
    }

    if (!user || !user.is_active) {
      return createUnauthorizedError('User not found or inactive');
    }

    // Return validation result
    return createJsonResponse({
      valid: true,
      user_id: tokenPayload.user_id,
      user_type: tokenPayload.user_type,
      role_id: tokenPayload.role_id,
      expires_at: new Date(tokenPayload.exp * 1000).toISOString(),
      session_id: tokenPayload.session_id,
    }, { status: 200 });

  } catch (error) {
    console.error('Session validation error:', error);
    return createUnauthorizedError('Session validation failed');
  }
});

// ============================================================================
// EXPORT ALL HANDLERS
// ============================================================================

/**
 * Authentication handlers array for easy registration with MSW
 * Provides comprehensive coverage of authentication scenarios for testing
 */
export const authHandlers = [
  // User authentication
  userLoginHandler,
  userSessionHandler,
  userLogoutHandler,
  
  // Admin authentication
  adminLoginHandler,
  adminSessionHandler,
  adminLogoutHandler,
  
  // Password reset
  passwordResetRequestHandler,
  passwordResetConfirmHandler,
  
  // User registration
  userRegisterHandler,
  emailVerifyHandler,
  
  // Session validation
  sessionValidationHandler,
];

/**
 * Authentication handler utilities for testing
 * Provides helper functions for test scenarios
 */
export const authTestUtils = {
  // Token utilities
  generateMockJwtToken,
  validateMockJwtToken,
  createSessionResponse,
  
  // Mock data access
  mockUsers,
  mockAdmins,
  mockRoles,
  
  // Error scenario generators
  createAuthenticationError: (scenario: string) => {
    switch (scenario) {
      case 'invalid_credentials':
        return createInvalidCredentialsError();
      case 'expired_session':
        return createExpiredSessionError();
      case 'missing_api_key':
        return errorScenarios.auth.missingApiKey();
      case 'missing_session':
        return errorScenarios.auth.missingSession();
      case 'insufficient_permissions':
        return errorScenarios.authorization.insufficientPermissions();
      default:
        return createUnauthorizedError();
    }
  },
};

/**
 * Default export provides the handler array for MSW setup
 */
export default authHandlers;