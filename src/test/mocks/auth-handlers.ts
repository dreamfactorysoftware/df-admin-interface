/**
 * MSW Authentication Handlers for DreamFactory API
 * 
 * Mock Service Worker handlers for authentication and session management endpoints
 * including login, logout, password reset, and session validation. Replicates the
 * authentication flow behavior from Angular services and interceptors in MSW format.
 * 
 * This module provides:
 * - User and admin authentication endpoint mocking (/api/v2/user/session, /api/v2/system/admin/session)
 * - JWT token simulation for session management testing
 * - Password reset and registration workflow support  
 * - Error handling for authentication failures (401, 403)
 * - Role-based response patterns for comprehensive RBAC testing
 * 
 * Authentication Flow:
 * 1. POST /api/v2/user/session - User login with email/password
 * 2. POST /api/v2/system/admin/session - Admin login with email/password
 * 3. DELETE /api/v2/user/session - User logout
 * 4. DELETE /api/v2/system/admin/session - Admin logout
 * 5. GET /api/v2/user/session - User session validation
 * 6. GET /api/v2/system/admin/session - Admin session validation
 * 7. POST /api/v2/user/password - Password reset request
 * 8. POST /api/v2/user/register - User registration
 */

import { http, HttpResponse } from 'msw';
import type { LoginCredentials, LoginResponse, UserSession, RegisterDetails } from '../../types/auth';
import {
  processRequestBody,
  validateAuthHeaders,
  generateMockSessionToken,
  createJsonResponse,
  simulateNetworkDelay,
  logRequest,
  applyCaseTransformation,
  extractQueryParams,
  validateRequiredFields,
} from './utils';
import {
  createInvalidCredentialsError,
  createSessionExpiredError,
  createAuthenticationRequiredError,
  createValidationError,
  createMissingApiKeyError,
  createInternalServerError,
  createNotFoundError,
  createFormValidationError,
} from './error-responses';
import { mockUsers, mockAdmins, mockRoles } from './mock-data';

// ============================================================================
// AUTHENTICATION CONSTANTS & TYPES
// ============================================================================

/**
 * Valid authentication credentials for testing
 * Includes both user and admin test accounts
 */
const VALID_CREDENTIALS = {
  users: [
    { email: 'admin@dreamfactory.com', password: 'admin123', userId: '1', type: 'user' as const },
    { email: 'john.developer@company.com', password: 'dev123', userId: '2', type: 'user' as const },
    { email: 'sarah.analyst@company.com', password: 'analyst123', userId: '3', type: 'user' as const },
  ],
  admins: [
    { email: 'super.admin@dreamfactory.com', password: 'superadmin123', userId: '1', type: 'admin' as const },
    { email: 'platform.admin@dreamfactory.com', password: 'platformadmin123', userId: '2', type: 'admin' as const },
  ],
} as const;

/**
 * Session token expiration times (in minutes)
 */
const TOKEN_EXPIRY = {
  DEFAULT: 60,
  REMEMBER_ME: 10080, // 7 days
  REFRESH: 20160, // 14 days
} as const;

/**
 * Password reset token storage for testing
 */
const passwordResetTokens = new Map<string, { email: string; token: string; expiresAt: Date }>();

/**
 * Active session storage for validation testing
 */
const activeSessions = new Map<string, { userId: string; userType: 'user' | 'admin'; expiresAt: Date }>();

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Validates user credentials against mock data
 * @param email - User email address
 * @param password - User password
 * @param userType - Type of user (user or admin)
 * @returns Validation result with user data
 */
function validateCredentials(
  email: string,
  password: string,
  userType: 'user' | 'admin'
): { isValid: boolean; userId?: string; userData?: any } {
  const credentialsList = userType === 'admin' ? VALID_CREDENTIALS.admins : VALID_CREDENTIALS.users;
  const mockDataList = userType === 'admin' ? mockAdmins : mockUsers;

  const validCredential = credentialsList.find(cred => 
    cred.email === email && cred.password === password
  );

  if (!validCredential) {
    return { isValid: false };
  }

  const userData = mockDataList.find(user => 
    user.id.toString() === validCredential.userId
  );

  return {
    isValid: true,
    userId: validCredential.userId,
    userData,
  };
}

/**
 * Creates user session object for login response
 * @param userData - User data from mock data
 * @param userType - Type of user session
 * @param rememberMe - Whether to extend session duration
 * @returns Complete user session object
 */
function createUserSession(
  userData: any,
  userType: 'user' | 'admin',
  rememberMe: boolean = false
): UserSession {
  const tokenExpiry = rememberMe ? TOKEN_EXPIRY.REMEMBER_ME : TOKEN_EXPIRY.DEFAULT;
  const expiryDate = new Date(Date.now() + tokenExpiry * 60 * 1000);
  const sessionToken = generateMockSessionToken(userData.id.toString(), userType, tokenExpiry);
  const sessionId = `session_${userData.id}_${Date.now()}`;

  // Store active session for validation
  activeSessions.set(sessionToken, {
    userId: userData.id.toString(),
    userType,
    expiresAt: expiryDate,
  });

  return {
    id: userData.id,
    email: userData.email,
    firstName: userData.first_name,
    lastName: userData.last_name,
    name: `${userData.first_name} ${userData.last_name}`,
    host: process.env.NEXT_PUBLIC_API_HOST || 'localhost',
    sessionId,
    sessionToken,
    tokenExpiryDate: expiryDate,
    lastLoginDate: new Date().toISOString(),
    isRootAdmin: userData.is_sys_admin || false,
    isSysAdmin: userData.is_sys_admin || false,
    roleId: userData.role_id,
    role_id: userData.role_id, // Legacy compatibility
    role: mockRoles.find(role => role.id === userData.role_id),
    profile: userData.profile || {},
  };
}

/**
 * Validates session token and returns user data
 * @param sessionToken - JWT session token
 * @returns Validation result with user session
 */
function validateSessionToken(sessionToken: string): { 
  isValid: boolean; 
  userSession?: UserSession; 
  error?: string 
} {
  try {
    // Check if session exists in active sessions
    const sessionData = activeSessions.get(sessionToken);
    if (!sessionData) {
      return { isValid: false, error: 'Session not found' };
    }

    // Check if session has expired
    if (sessionData.expiresAt < new Date()) {
      activeSessions.delete(sessionToken);
      return { isValid: false, error: 'Session expired' };
    }

    // Parse JWT token payload (mock implementation)
    const tokenParts = sessionToken.split('.');
    if (tokenParts.length !== 3) {
      return { isValid: false, error: 'Invalid token format' };
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const userId = payload.sub;
    const userType = payload.type;

    // Find user data
    const userData = userType === 'admin' 
      ? mockAdmins.find(admin => admin.id.toString() === userId)
      : mockUsers.find(user => user.id.toString() === userId);

    if (!userData) {
      return { isValid: false, error: 'User not found' };
    }

    // Create session object
    const userSession = createUserSession(userData, userType);
    userSession.sessionToken = sessionToken; // Preserve original token

    return { isValid: true, userSession };
  } catch (error) {
    return { isValid: false, error: 'Token validation failed' };
  }
}

/**
 * Generates password reset token and stores it
 * @param email - User email address
 * @returns Password reset token
 */
function generatePasswordResetToken(email: string): string {
  const token = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  passwordResetTokens.set(token, { email, token, expiresAt });
  
  // Clean up expired tokens
  for (const [key, value] of passwordResetTokens.entries()) {
    if (value.expiresAt < new Date()) {
      passwordResetTokens.delete(key);
    }
  }

  return token;
}

// ============================================================================
// USER AUTHENTICATION HANDLERS
// ============================================================================

/**
 * Handles user login requests (POST /api/v2/user/session)
 * Validates credentials and returns session token with user data
 */
const userLoginHandler = http.post('/api/v2/user/session', async ({ request }) => {
  await simulateNetworkDelay(150);
  logRequest(request, { endpoint: 'user login' });

  // Validate API key
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.apiKey) {
    return createMissingApiKeyError();
  }

  try {
    // Parse request body
    const requestBody = await processRequestBody(request) as LoginCredentials;
    const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);
    const credentials = transformedRequestBody as LoginCredentials;

    // Validate required fields
    const requiredFields = ['password'];
    if (!credentials.email && !credentials.username) {
      requiredFields.push('email');
    }

    const validation = validateRequiredFields(credentials as any, requiredFields);
    if (!validation.isValid) {
      return createFormValidationError({
        [validation.missingFields[0]]: [`${validation.missingFields[0]} is required`],
      });
    }

    // Validate credentials
    const email = credentials.email || credentials.username || '';
    const { isValid, userId, userData } = validateCredentials(email, credentials.password, 'user');

    if (!isValid) {
      await simulateNetworkDelay(500); // Simulate brute force protection delay
      return createInvalidCredentialsError('Invalid email or password');
    }

    // Check if user is active
    if (!userData.is_active) {
      return createInvalidCredentialsError('User account is disabled');
    }

    // Create user session
    const userSession = createUserSession(userData, 'user', credentials.rememberMe);

    // Create login response
    const loginResponse: LoginResponse = {
      sessionToken: userSession.sessionToken,
      session_token: userSession.sessionToken, // Legacy compatibility
      user: userSession,
      expiresAt: userSession.tokenExpiryDate.toISOString(),
    };

    return createJsonResponse(transformResponse(loginResponse), 200, {
      'X-DreamFactory-Session-Token': userSession.sessionToken,
    });

  } catch (error) {
    logRequest(request, { error: error instanceof Error ? error.message : 'Unknown error' });
    return createInternalServerError('Authentication service temporarily unavailable');
  }
});

/**
 * Handles user logout requests (DELETE /api/v2/user/session)
 * Invalidates session token and clears server-side session
 */
const userLogoutHandler = http.delete('/api/v2/user/session', async ({ request }) => {
  await simulateNetworkDelay(100);
  logRequest(request, { endpoint: 'user logout' });

  // Validate headers
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.sessionToken) {
    return createAuthenticationRequiredError('Session token required for logout');
  }

  // Remove session from active sessions
  activeSessions.delete(authValidation.sessionToken);

  return createJsonResponse({ success: true }, 200);
});

/**
 * Handles user session validation (GET /api/v2/user/session)
 * Validates current session and returns user data
 */
const userSessionValidationHandler = http.get('/api/v2/user/session', async ({ request }) => {
  await simulateNetworkDelay(50);
  logRequest(request, { endpoint: 'user session validation' });

  // Validate headers
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.sessionToken) {
    return createAuthenticationRequiredError('Session token required');
  }

  // Validate session token
  const sessionValidation = validateSessionToken(authValidation.sessionToken);
  if (!sessionValidation.isValid) {
    if (sessionValidation.error === 'Session expired') {
      return createSessionExpiredError();
    }
    return createInvalidCredentialsError('Invalid session token');
  }

  // Apply case transformation for response
  const { transformResponse } = applyCaseTransformation(request, sessionValidation.userSession);

  return createJsonResponse(transformResponse(sessionValidation.userSession), 200);
});

// ============================================================================
// ADMIN AUTHENTICATION HANDLERS
// ============================================================================

/**
 * Handles admin login requests (POST /api/v2/system/admin/session)
 * Validates admin credentials and returns admin session
 */
const adminLoginHandler = http.post('/api/v2/system/admin/session', async ({ request }) => {
  await simulateNetworkDelay(200);
  logRequest(request, { endpoint: 'admin login' });

  // Validate API key
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.apiKey) {
    return createMissingApiKeyError();
  }

  try {
    // Parse request body
    const requestBody = await processRequestBody(request) as LoginCredentials;
    const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);
    const credentials = transformedRequestBody as LoginCredentials;

    // Validate required fields
    const requiredFields = ['password'];
    if (!credentials.email && !credentials.username) {
      requiredFields.push('email');
    }

    const validation = validateRequiredFields(credentials as any, requiredFields);
    if (!validation.isValid) {
      return createFormValidationError({
        [validation.missingFields[0]]: [`${validation.missingFields[0]} is required`],
      });
    }

    // Validate admin credentials
    const email = credentials.email || credentials.username || '';
    const { isValid, userId, userData } = validateCredentials(email, credentials.password, 'admin');

    if (!isValid) {
      await simulateNetworkDelay(750); // Longer delay for admin login attempts
      return createInvalidCredentialsError('Invalid admin credentials');
    }

    // Check if admin is active
    if (!userData.is_active) {
      return createInvalidCredentialsError('Admin account is disabled');
    }

    // Create admin session
    const userSession = createUserSession(userData, 'admin', credentials.rememberMe);

    // Create login response with admin-specific properties
    const loginResponse: LoginResponse = {
      sessionToken: userSession.sessionToken,
      session_token: userSession.sessionToken, // Legacy compatibility
      user: {
        ...userSession,
        isRootAdmin: userData.is_sys_admin || false,
        isSysAdmin: userData.is_sys_admin || false,
      },
      expiresAt: userSession.tokenExpiryDate.toISOString(),
    };

    return createJsonResponse(transformResponse(loginResponse), 200, {
      'X-DreamFactory-Session-Token': userSession.sessionToken,
    });

  } catch (error) {
    logRequest(request, { error: error instanceof Error ? error.message : 'Unknown error' });
    return createInternalServerError('Admin authentication service temporarily unavailable');
  }
});

/**
 * Handles admin logout requests (DELETE /api/v2/system/admin/session)
 * Invalidates admin session token
 */
const adminLogoutHandler = http.delete('/api/v2/system/admin/session', async ({ request }) => {
  await simulateNetworkDelay(100);
  logRequest(request, { endpoint: 'admin logout' });

  // Validate headers
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.sessionToken) {
    return createAuthenticationRequiredError('Session token required for logout');
  }

  // Remove session from active sessions
  activeSessions.delete(authValidation.sessionToken);

  return createJsonResponse({ success: true }, 200);
});

/**
 * Handles admin session validation (GET /api/v2/system/admin/session)
 * Validates current admin session and returns admin data
 */
const adminSessionValidationHandler = http.get('/api/v2/system/admin/session', async ({ request }) => {
  await simulateNetworkDelay(50);
  logRequest(request, { endpoint: 'admin session validation' });

  // Validate headers
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.sessionToken) {
    return createAuthenticationRequiredError('Session token required');
  }

  // Validate session token
  const sessionValidation = validateSessionToken(authValidation.sessionToken);
  if (!sessionValidation.isValid) {
    if (sessionValidation.error === 'Session expired') {
      return createSessionExpiredError();
    }
    return createInvalidCredentialsError('Invalid session token');
  }

  // Ensure this is an admin session
  const sessionData = activeSessions.get(authValidation.sessionToken);
  if (!sessionData || sessionData.userType !== 'admin') {
    return createInvalidCredentialsError('Invalid admin session');
  }

  // Apply case transformation for response
  const { transformResponse } = applyCaseTransformation(request, sessionValidation.userSession);

  return createJsonResponse(transformResponse(sessionValidation.userSession), 200);
});

// ============================================================================
// PASSWORD RESET HANDLERS
// ============================================================================

/**
 * Handles password reset requests (POST /api/v2/user/password)
 * Generates password reset token and simulates email sending
 */
const passwordResetHandler = http.post('/api/v2/user/password', async ({ request }) => {
  await simulateNetworkDelay(300);
  logRequest(request, { endpoint: 'password reset' });

  // Validate API key
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.apiKey) {
    return createMissingApiKeyError();
  }

  try {
    // Parse request body
    const requestBody = await processRequestBody(request) as { email: string };
    const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);
    const { email } = transformedRequestBody as { email: string };

    // Validate required fields
    if (!email) {
      return createValidationError('Email address is required');
    }

    // Check if user exists (for security, always return success to prevent email enumeration)
    const userExists = mockUsers.some(user => user.email === email) || 
                      mockAdmins.some(admin => admin.email === email);

    // Generate reset token regardless of whether user exists
    const resetToken = generatePasswordResetToken(email);

    // Simulate email delay
    await simulateNetworkDelay(500);

    const response = {
      success: true,
      message: userExists 
        ? 'Password reset instructions have been sent to your email address'
        : 'If an account with that email exists, password reset instructions have been sent',
      // Include token in development for testing purposes
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };

    return createJsonResponse(transformResponse(response), 200);

  } catch (error) {
    logRequest(request, { error: error instanceof Error ? error.message : 'Unknown error' });
    return createInternalServerError('Password reset service temporarily unavailable');
  }
});

/**
 * Handles password reset confirmation (PUT /api/v2/user/password)
 * Validates reset token and updates password
 */
const passwordResetConfirmHandler = http.put('/api/v2/user/password', async ({ request }) => {
  await simulateNetworkDelay(200);
  logRequest(request, { endpoint: 'password reset confirm' });

  // Validate API key
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.apiKey) {
    return createMissingApiKeyError();
  }

  try {
    // Parse request body
    const requestBody = await processRequestBody(request) as { 
      token: string; 
      password: string; 
      confirmPassword: string;
    };
    const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);
    const { token, password, confirmPassword } = transformedRequestBody as any;

    // Validate required fields
    const validation = validateRequiredFields({ token, password, confirmPassword }, ['token', 'password', 'confirmPassword']);
    if (!validation.isValid) {
      return createFormValidationError({
        [validation.missingFields[0]]: [`${validation.missingFields[0]} is required`],
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return createFormValidationError({
        confirmPassword: ['Passwords do not match'],
      });
    }

    // Validate password strength (basic)
    if (password.length < 8) {
      return createFormValidationError({
        password: ['Password must be at least 8 characters long'],
      });
    }

    // Validate reset token
    const resetData = passwordResetTokens.get(token);
    if (!resetData) {
      return createValidationError('Invalid or expired reset token');
    }

    if (resetData.expiresAt < new Date()) {
      passwordResetTokens.delete(token);
      return createValidationError('Reset token has expired');
    }

    // Remove used token
    passwordResetTokens.delete(token);

    const response = {
      success: true,
      message: 'Password has been successfully updated',
    };

    return createJsonResponse(transformResponse(response), 200);

  } catch (error) {
    logRequest(request, { error: error instanceof Error ? error.message : 'Unknown error' });
    return createInternalServerError('Password reset service temporarily unavailable');
  }
});

// ============================================================================
// USER REGISTRATION HANDLERS
// ============================================================================

/**
 * Handles user registration requests (POST /api/v2/user/register)
 * Creates new user account with email verification
 */
const userRegistrationHandler = http.post('/api/v2/user/register', async ({ request }) => {
  await simulateNetworkDelay(400);
  logRequest(request, { endpoint: 'user registration' });

  // Validate API key
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.apiKey) {
    return createMissingApiKeyError();
  }

  try {
    // Parse request body
    const requestBody = await processRequestBody(request) as RegisterDetails;
    const { transformedRequestBody, transformResponse } = applyCaseTransformation(request, requestBody);
    const userDetails = transformedRequestBody as RegisterDetails;

    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'username'];
    const validation = validateRequiredFields(userDetails as any, requiredFields);
    if (!validation.isValid) {
      return createFormValidationError({
        [validation.missingFields[0]]: [`${validation.missingFields[0]} is required`],
      });
    }

    // Check if email already exists
    const emailExists = mockUsers.some(user => user.email === userDetails.email) ||
                       mockAdmins.some(admin => admin.email === userDetails.email);
    
    if (emailExists) {
      return createFormValidationError({
        email: ['An account with this email address already exists'],
      });
    }

    // Check if username already exists
    const usernameExists = mockUsers.some(user => user.username === userDetails.username);
    if (usernameExists) {
      return createFormValidationError({
        username: ['This username is already taken'],
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userDetails.email)) {
      return createFormValidationError({
        email: ['Please enter a valid email address'],
      });
    }

    // Simulate user creation delay
    await simulateNetworkDelay(600);

    const response = {
      success: true,
      message: 'Registration successful. Please check your email for verification instructions.',
      user: {
        id: Math.floor(Math.random() * 1000) + 100, // Mock user ID
        email: userDetails.email,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        username: userDetails.username,
        name: userDetails.name || `${userDetails.firstName} ${userDetails.lastName}`,
        isActive: false, // Requires email verification
        isVerified: false,
        createdDate: new Date().toISOString(),
      },
    };

    return createJsonResponse(transformResponse(response), 201);

  } catch (error) {
    logRequest(request, { error: error instanceof Error ? error.message : 'Unknown error' });
    return createInternalServerError('User registration service temporarily unavailable');
  }
});

// ============================================================================
// SESSION REFRESH HANDLERS
// ============================================================================

/**
 * Handles session token refresh (POST /api/v2/user/session/refresh)
 * Validates refresh token and issues new session token
 */
const sessionRefreshHandler = http.post('/api/v2/user/session/refresh', async ({ request }) => {
  await simulateNetworkDelay(100);
  logRequest(request, { endpoint: 'session refresh' });

  // Validate headers
  const authValidation = validateAuthHeaders(request);
  if (!authValidation.sessionToken) {
    return createAuthenticationRequiredError('Session token required for refresh');
  }

  try {
    // Validate session token
    const sessionValidation = validateSessionToken(authValidation.sessionToken);
    if (!sessionValidation.isValid) {
      return createSessionExpiredError('Cannot refresh expired or invalid session');
    }

    // Generate new session token
    const userSession = sessionValidation.userSession!;
    const sessionData = activeSessions.get(authValidation.sessionToken);
    const newTokenExpiry = TOKEN_EXPIRY.DEFAULT;
    const newSessionToken = generateMockSessionToken(
      userSession.id.toString(), 
      sessionData?.userType || 'user', 
      newTokenExpiry
    );

    // Update session storage
    activeSessions.delete(authValidation.sessionToken);
    activeSessions.set(newSessionToken, {
      userId: userSession.id.toString(),
      userType: sessionData?.userType || 'user',
      expiresAt: new Date(Date.now() + newTokenExpiry * 60 * 1000),
    });

    // Update user session
    const updatedSession = {
      ...userSession,
      sessionToken: newSessionToken,
      tokenExpiryDate: new Date(Date.now() + newTokenExpiry * 60 * 1000),
    };

    // Apply case transformation for response
    const { transformResponse } = applyCaseTransformation(request, updatedSession);

    return createJsonResponse(transformResponse({
      sessionToken: newSessionToken,
      session_token: newSessionToken, // Legacy compatibility
      expiresAt: updatedSession.tokenExpiryDate.toISOString(),
      user: updatedSession,
    }), 200, {
      'X-DreamFactory-Session-Token': newSessionToken,
    });

  } catch (error) {
    logRequest(request, { error: error instanceof Error ? error.message : 'Unknown error' });
    return createInternalServerError('Session refresh service temporarily unavailable');
  }
});

// ============================================================================
// EXPORTED HANDLERS ARRAY
// ============================================================================

/**
 * Complete collection of authentication MSW handlers
 * Supports both user and admin authentication workflows with comprehensive
 * error handling and role-based response patterns
 */
export const authHandlers = [
  // User authentication endpoints
  userLoginHandler,
  userLogoutHandler,
  userSessionValidationHandler,

  // Admin authentication endpoints
  adminLoginHandler,
  adminLogoutHandler,
  adminSessionValidationHandler,

  // Password reset endpoints
  passwordResetHandler,
  passwordResetConfirmHandler,

  // User registration endpoints
  userRegistrationHandler,

  // Session management endpoints
  sessionRefreshHandler,
];

// Export default for convenient importing
export default authHandlers;

// ============================================================================
// ADDITIONAL UTILITIES FOR TESTING
// ============================================================================

/**
 * Utility to clear all active sessions (useful for test cleanup)
 */
export function clearAllSessions(): void {
  activeSessions.clear();
}

/**
 * Utility to clear all password reset tokens (useful for test cleanup)
 */
export function clearPasswordResetTokens(): void {
  passwordResetTokens.clear();
}

/**
 * Utility to check if a session token is active
 * @param sessionToken - Token to check
 * @returns Boolean indicating if session is active
 */
export function isSessionActive(sessionToken: string): boolean {
  const sessionData = activeSessions.get(sessionToken);
  return sessionData !== undefined && sessionData.expiresAt > new Date();
}

/**
 * Utility to get active session data for testing
 * @param sessionToken - Token to look up
 * @returns Session data or undefined
 */
export function getSessionData(sessionToken: string) {
  return activeSessions.get(sessionToken);
}

/**
 * Utility to manually add a session for testing
 * @param sessionToken - Token to add
 * @param userId - User ID
 * @param userType - User type
 * @param expiresAt - Expiration date
 */
export function addTestSession(
  sessionToken: string, 
  userId: string, 
  userType: 'user' | 'admin', 
  expiresAt: Date
): void {
  activeSessions.set(sessionToken, { userId, userType, expiresAt });
}