/**
 * User and Admin Profile Fixture Factory Functions
 * 
 * Comprehensive factory functions for generating realistic user data for testing
 * authentication, authorization, and user management React components in the
 * DreamFactory Admin Interface.
 * 
 * Features:
 * - User profile mock data for authentication and authorization testing
 * - Role-based access control data for testing permission scenarios
 * - Session management data for testing JWT token validation
 * - User registration and password reset data for testing user lifecycle
 * - Multi-factor authentication data and security credential generation
 * - Support for testing user relationship data including apps and services
 * 
 * @fileoverview User fixture factories for React component testing
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import {
  UserProfile,
  AdminProfile,
  UserSession,
  UserRow,
  LoginCredentials,
  LoginResponse,
  RegisterDetails,
  ForgetPasswordRequest,
  ResetFormData,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  SecurityQuestion,
  UserAppRole,
  LookupKey,
  UserParams,
  AdminCapability,
  SystemPermission,
  SessionCookieData,
  SessionValidationResult,
  SessionError,
  JWTTokenPayload,
  TokenRefreshResult
} from '../../types/user';

import {
  RoleType,
  RoleServiceAccess,
  RoleLookup,
  RoleWithRelations,
  RoleRow,
  CreateRoleData,
  HttpVerb,
  ServiceAccessConfig,
  RolePermissionSummary
} from '../../types/role';

import {
  UserSession as AuthUserSession,
  LoginCredentials as AuthLoginCredentials,
  LoginResponse as AuthLoginResponse,
  RegisterDetails as AuthRegisterDetails,
  RolePermission,
  MiddlewareAuthContext,
  MiddlewareAuthResult,
  JWTPayload,
  AuthState,
  AuthError,
  AuthErrorCode,
  ForgetPasswordRequest as AuthForgetPasswordRequest,
  ResetFormData as AuthResetFormData,
  UpdatePasswordRequest as AuthUpdatePasswordRequest,
  UpdatePasswordResponse as AuthUpdatePasswordResponse,
  SecurityQuestion as AuthSecurityQuestion,
  OAuthLoginRequest,
  SAMLAuthParams,
  AuthCookieConfig,
  SessionStorage
} from '../../types/auth';

import { generateTestId, generateTestEmail, generateTestDate } from '../utils/component-factories';

// =============================================================================
// CORE USER PROFILE FACTORIES
// =============================================================================

/**
 * Factory function for creating user profile test data
 * Generates realistic user accounts with configurable roles and permissions
 * 
 * @param overrides - Partial user profile data to override defaults
 * @returns Complete UserProfile object for testing
 */
export const userProfileFactory = (overrides: Partial<UserProfile> = {}): UserProfile => {
  const id = overrides.id || Math.floor(Math.random() * 10000) + 1;
  const baseProfile: UserProfile = {
    // Core identification
    id,
    username: `user${id}`,
    email: `user${id}@example.com`,
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe',
    
    // Authentication & Security
    is_active: true,
    confirmed: true,
    security_question: 'What is your favorite color?',
    security_answer: 'blue',
    password_set_date: generateTestDate(-30).toISOString(),
    last_login_date: generateTestDate(-1).toISOString(),
    failed_login_attempts: 0,
    locked_until: null,
    
    // Profile details
    phone: '+1-555-123-4567',
    name: 'John Doe',
    
    // Audit trail
    created_date: generateTestDate(-90).toISOString(),
    last_modified_date: generateTestDate(-1).toISOString(),
    created_by_id: 1,
    last_modified_by_id: 1,
    
    // Relationships and metadata
    lookup_by_user_id: [],
    user_to_app_to_role_by_user_id: [],
    
    // RBAC integration
    role: roleTypeFactory(),
    permissions: ['read_profile', 'update_profile'],
    accessibleRoutes: ['/profile', '/api-connections'],
    
    // Enhanced security for Next.js SSR
    sessionId: `session_${id}_${Date.now()}`,
    tokenVersion: 1,
    lastActivity: generateTestDate().toISOString(),
  };

  return { ...baseProfile, ...overrides };
};

/**
 * Factory function for creating admin profile test data
 * Generates administrative user accounts with elevated privileges
 * 
 * @param overrides - Partial admin profile data to override defaults
 * @returns Complete AdminProfile object for testing
 */
export const adminProfileFactory = (overrides: Partial<AdminProfile> = {}): AdminProfile => {
  const id = overrides.id || Math.floor(Math.random() * 100) + 1000;
  const baseProfile = userProfileFactory({
    id,
    username: `admin${id}`,
    email: `admin${id}@example.com`,
    first_name: 'Admin',
    last_name: 'User',
    display_name: 'Admin User',
    role: adminRoleTypeFactory(),
    permissions: [
      'read_users', 'create_users', 'update_users', 'delete_users',
      'read_services', 'create_services', 'update_services', 'delete_services',
      'read_schema', 'update_schema', 'generate_apis', 'manage_security',
      'view_logs', 'system_backup'
    ],
    accessibleRoutes: [
      '/admin-settings', '/system-settings', '/api-security',
      '/adf-users', '/adf-admins', '/adf-services', '/adf-schema'
    ],
  });

  const adminExtensions: Partial<AdminProfile> = {
    // Admin-specific flags
    is_sys_admin: true,
    
    // Enhanced access control
    accessibleTabs: [
      'users', 'admins', 'services', 'schema', 'api-docs',
      'config', 'files', 'apps', 'scripts', 'scheduler'
    ],
    restrictedRoutes: [],
    adminCapabilities: [
      'user_management', 'service_management', 'schema_management',
      'api_generation', 'system_configuration', 'security_management',
      'audit_access', 'backup_restore'
    ] as AdminCapability[],
    
    // System-level permissions
    systemPermissions: [
      'read_users', 'create_users', 'update_users', 'delete_users',
      'read_services', 'create_services', 'update_services', 'delete_services',
      'read_schema', 'update_schema', 'generate_apis', 'manage_security',
      'view_logs', 'system_backup'
    ] as SystemPermission[],
  };

  return { ...baseProfile, ...adminExtensions, ...overrides };
};

/**
 * Factory function for creating root admin profile
 * Generates super administrator with full system access
 */
export const rootAdminProfileFactory = (overrides: Partial<AdminProfile> = {}): AdminProfile => {
  return adminProfileFactory({
    id: 1,
    username: 'root',
    email: 'root@example.com',
    first_name: 'Root',
    last_name: 'Administrator',
    display_name: 'Root Administrator',
    is_sys_admin: true,
    adminCapabilities: [
      'user_management', 'service_management', 'schema_management',
      'api_generation', 'system_configuration', 'security_management',
      'audit_access', 'backup_restore'
    ] as AdminCapability[],
    accessibleTabs: ['*'], // All tabs
    systemPermissions: [
      'read_users', 'create_users', 'update_users', 'delete_users',
      'read_services', 'create_services', 'update_services', 'delete_services',
      'read_schema', 'update_schema', 'generate_apis', 'manage_security',
      'view_logs', 'system_backup'
    ] as SystemPermission[],
    ...overrides
  });
};

/**
 * Factory function for creating user row data for table display
 * Optimized for UI rendering and table operations
 */
export const userRowFactory = (overrides: Partial<UserRow> = {}): UserRow => {
  const id = overrides.id || Math.floor(Math.random() * 10000) + 1;
  return {
    id,
    username: `user${id}`,
    email: `user${id}@example.com`,
    display_name: `User ${id}`,
    name: `User ${id}`,
    is_active: true,
    last_login_date: generateTestDate(-1).toISOString(),
    created_date: generateTestDate(-90).toISOString(),
    role: 'user',
    isLoading: false,
    isSelected: false,
    ...overrides
  };
};

// =============================================================================
// ROLE-BASED ACCESS CONTROL FACTORIES
// =============================================================================

/**
 * Factory function for creating role type data
 * Generates role configurations for RBAC testing
 */
export const roleTypeFactory = (overrides: Partial<RoleType> = {}): RoleType => {
  const id = overrides.id || Math.floor(Math.random() * 100) + 1;
  return {
    id,
    name: `role_${id}`,
    description: `Test role ${id}`,
    isActive: true,
    createdById: 1,
    createdDate: generateTestDate(-30).toISOString(),
    lastModifiedById: 1,
    lastModifiedDate: generateTestDate(-1).toISOString(),
    lookupByRoleId: [],
    accessibleTabs: ['profile', 'api-connections'],
    ...overrides
  };
};

/**
 * Factory for admin role type with full permissions
 */
export const adminRoleTypeFactory = (): RoleType => {
  return roleTypeFactory({
    id: 1,
    name: 'admin',
    description: 'Administrator role with full access',
    accessibleTabs: [
      'users', 'admins', 'services', 'schema', 'api-docs',
      'config', 'files', 'apps', 'scripts', 'scheduler'
    ]
  });
};

/**
 * Factory for read-only role type
 */
export const readOnlyRoleTypeFactory = (): RoleType => {
  return roleTypeFactory({
    id: 2,
    name: 'readonly',
    description: 'Read-only access role',
    accessibleTabs: ['profile', 'api-docs']
  });
};

/**
 * Factory for API developer role type
 */
export const apiDeveloperRoleTypeFactory = (): RoleType => {
  return roleTypeFactory({
    id: 3,
    name: 'api_developer',
    description: 'API developer with service and schema access',
    accessibleTabs: ['services', 'schema', 'api-docs']
  });
};

/**
 * Factory function for role service access configuration
 * Defines service-level permissions for roles
 */
export const roleServiceAccessFactory = (overrides: Partial<RoleServiceAccess> = {}): RoleServiceAccess => {
  const id = overrides.id || Math.floor(Math.random() * 1000) + 1;
  return {
    id,
    roleId: 1,
    serviceId: 1,
    component: '*',
    verbMask: HttpVerb.GET | HttpVerb.POST, // Default to read/write
    requestorType: 1,
    filters: '',
    filterOp: 'AND',
    ...overrides
  };
};

/**
 * Factory function for role lookup configuration
 * Provides dynamic value lookups for role-based functionality
 */
export const roleLookupFactory = (overrides: Partial<RoleLookup> = {}): RoleLookup => {
  const id = overrides.id || Math.floor(Math.random() * 1000) + 1;
  return {
    id,
    roleId: 1,
    name: `lookup_key_${id}`,
    value: `lookup_value_${id}`,
    private: false,
    description: `Test lookup configuration ${id}`,
    ...overrides
  };
};

/**
 * Factory function for role permission configurations
 * Creates granular permission specifications
 */
export const rolePermissionFactory = (overrides: Partial<RolePermission> = {}): RolePermission => {
  return {
    resource: 'users',
    operations: ['read'],
    constraints: {},
    ...overrides
  };
};

/**
 * Factory for role permission summary
 * Aggregated view of role permissions for display
 */
export const rolePermissionSummaryFactory = (overrides: Partial<RolePermissionSummary> = {}): RolePermissionSummary => {
  return {
    roleId: 1,
    serviceCount: 3,
    fullAccessServices: ['user'],
    limitedAccessServices: ['system'],
    lookupCount: 2,
    isAdmin: false,
    ...overrides
  };
};

// =============================================================================
// SESSION MANAGEMENT FACTORIES
// =============================================================================

/**
 * Factory function for user session data
 * Generates authentication session data with JWT tokens
 */
export const userSessionFactory = (overrides: Partial<UserSession> = {}): UserSession => {
  const id = overrides.id || Math.floor(Math.random() * 10000) + 1;
  const sessionId = `session_${id}_${Date.now()}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return {
    // Core session data
    id,
    session_token: `jwt_token_${sessionId}`,
    sessionToken: `jwt_token_${sessionId}`,
    user_id: id,
    username: `user${id}`,
    email: `user${id}@example.com`,
    display_name: `User ${id}`,
    
    // Enhanced for Next.js middleware
    host: 'localhost',
    is_sys_admin: false,
    is_active: true,
    token_map: {
      session: `jwt_token_${sessionId}`,
      refresh: `refresh_${sessionId}`
    },
    
    // Session metadata
    created_date: generateTestDate().toISOString(),
    expires_at: expiresAt.toISOString(),
    last_activity: generateTestDate().toISOString(),
    user_agent: 'Mozilla/5.0 (compatible; Test Browser)',
    ip_address: '127.0.0.1',
    
    // RBAC data for middleware
    role: roleTypeFactory(),
    permissions: ['read_profile', 'update_profile'],
    accessibleRoutes: ['/profile', '/api-connections'],
    restrictedRoutes: ['/admin-settings', '/system-settings'],
    
    // Security enhancements
    tokenVersion: 1,
    refreshToken: `refresh_${sessionId}`,
    csrfToken: `csrf_${sessionId}`,
    
    // Next.js specific
    isServerSide: false,
    cookieData: sessionCookieDataFactory({ sessionId }),
    
    ...overrides
  };
};

/**
 * Factory for admin user session with elevated privileges
 */
export const adminSessionFactory = (overrides: Partial<UserSession> = {}): UserSession => {
  const baseSession = userSessionFactory({
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    display_name: 'Admin User',
    is_sys_admin: true,
    role: adminRoleTypeFactory(),
    permissions: [
      'read_users', 'create_users', 'update_users', 'delete_users',
      'read_services', 'create_services', 'update_services', 'delete_services',
      'manage_security', 'view_logs'
    ],
    accessibleRoutes: [
      '/admin-settings', '/system-settings', '/api-security',
      '/adf-users', '/adf-admins', '/adf-services'
    ],
    restrictedRoutes: [],
    ...overrides
  });

  return baseSession;
};

/**
 * Factory for session cookie data
 * Used for Next.js middleware hydration
 */
export const sessionCookieDataFactory = (overrides: Partial<SessionCookieData> = {}): SessionCookieData => {
  const sessionId = overrides.sessionId || `session_${Date.now()}`;
  return {
    sessionId,
    userId: 1,
    tokenVersion: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    ...overrides
  };
};

/**
 * Factory for session validation results
 * Used for middleware processing
 */
export const sessionValidationResultFactory = (
  isValid: boolean = true,
  overrides: Partial<SessionValidationResult> = {}
): SessionValidationResult => {
  const base: SessionValidationResult = {
    isValid,
    session: isValid ? userSessionFactory() : undefined,
    error: isValid ? undefined : 'token_expired' as SessionError,
    requiresRefresh: false,
    redirectTo: isValid ? undefined : '/login'
  };

  return { ...base, ...overrides };
};

/**
 * Factory for JWT token payload
 * Creates JWT payload for server-side validation
 */
export const jwtTokenPayloadFactory = (overrides: Partial<JWTTokenPayload> = {}): JWTTokenPayload => {
  const userId = overrides.sub || Math.floor(Math.random() * 10000) + 1;
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: userId.toString(),
    username: `user${userId}`,
    email: `user${userId}@example.com`,
    role: 'user',
    permissions: ['read_profile', 'update_profile'],
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours
    jti: `jwt_${userId}_${now}`,
    aud: 'dreamfactory-admin',
    iss: 'dreamfactory',
    tokenVersion: 1,
    sessionId: `session_${userId}_${now}`,
    ...overrides
  };
};

/**
 * Factory for token refresh results
 * Used for automatic token renewal testing
 */
export const tokenRefreshResultFactory = (
  success: boolean = true,
  overrides: Partial<TokenRefreshResult> = {}
): TokenRefreshResult => {
  const sessionId = `refresh_${Date.now()}`;
  
  return {
    success,
    accessToken: success ? `jwt_new_${sessionId}` : undefined,
    refreshToken: success ? `refresh_new_${sessionId}` : undefined,
    expiresIn: success ? 86400 : undefined, // 24 hours
    error: success ? undefined : 'refresh_token_expired',
    requiresReauth: !success,
    ...overrides
  };
};

// =============================================================================
// AUTHENTICATION FLOW FACTORIES
// =============================================================================

/**
 * Factory function for login credentials
 * Creates various login credential scenarios for testing
 */
export const loginCredentialsFactory = (overrides: Partial<LoginCredentials> = {}): LoginCredentials => {
  return {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'SecurePassword123!',
    remember: false,
    service: undefined,
    captcha: undefined,
    twoFactorCode: undefined,
    deviceId: `device_${Date.now()}`,
    ...overrides
  };
};

/**
 * Factory for admin login credentials
 */
export const adminLoginCredentialsFactory = (): LoginCredentials => {
  return loginCredentialsFactory({
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPassword123!'
  });
};

/**
 * Factory function for login response data
 * Creates successful and failed login responses
 */
export const loginResponseFactory = (
  success: boolean = true,
  overrides: Partial<LoginResponse> = {}
): LoginResponse => {
  if (!success) {
    return {
      error: 'invalid_credentials',
      error_description: 'Invalid username or password',
      ...overrides
    };
  }

  const sessionToken = `jwt_${Date.now()}`;
  const user = userProfileFactory();

  return {
    session_token: sessionToken,
    sessionToken,
    refresh_token: `refresh_${Date.now()}`,
    expires_in: 86400, // 24 hours
    token_type: 'Bearer',
    user,
    permissions: user.permissions,
    sessionId: user.sessionId,
    tokenVersion: user.tokenVersion,
    csrfToken: `csrf_${Date.now()}`,
    ...overrides
  };
};

/**
 * Factory function for user registration details
 * Creates registration data for new user account testing
 */
export const registerDetailsFactory = (overrides: Partial<RegisterDetails> = {}): RegisterDetails => {
  const id = Math.floor(Math.random() * 10000) + 1;
  return {
    username: `newuser${id}`,
    email: `newuser${id}@example.com`,
    password: 'NewUserPassword123!',
    confirmPassword: 'NewUserPassword123!',
    first_name: 'New',
    last_name: 'User',
    display_name: 'New User',
    phone: '+1-555-987-6543',
    security_question: 'What is your pet\'s name?',
    security_answer: 'Fluffy',
    acceptTerms: true,
    acceptPrivacy: true,
    source: 'web_registration',
    referral: undefined,
    ...overrides
  };
};

// =============================================================================
// PASSWORD MANAGEMENT FACTORIES
// =============================================================================

/**
 * Factory function for forget password requests
 * Creates password reset request data
 */
export const forgetPasswordRequestFactory = (overrides: Partial<ForgetPasswordRequest> = {}): ForgetPasswordRequest => {
  return {
    email: 'user@example.com',
    username: undefined,
    captcha: undefined,
    ...overrides
  };
};

/**
 * Factory function for password reset form data
 * Creates password reset form submissions
 */
export const resetFormDataFactory = (overrides: Partial<ResetFormData> = {}): ResetFormData => {
  return {
    code: 'RESET123456',
    password: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
    email: 'user@example.com',
    username: 'user',
    deviceId: `device_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Factory function for password update requests
 * Creates password change request data
 */
export const updatePasswordRequestFactory = (overrides: Partial<UpdatePasswordRequest> = {}): UpdatePasswordRequest => {
  return {
    old_password: 'OldPassword123!',
    new_password: 'NewPassword123!',
    confirm_password: 'NewPassword123!',
    force_logout_all: false,
    sessionId: `session_${Date.now()}`,
    ...overrides
  };
};

/**
 * Factory function for password update responses
 * Creates password update response data
 */
export const updatePasswordResponseFactory = (
  success: boolean = true,
  overrides: Partial<UpdatePasswordResponse> = {}
): UpdatePasswordResponse => {
  return {
    success,
    message: success ? 'Password updated successfully' : 'Password update failed',
    session_token: success ? `jwt_new_${Date.now()}` : undefined,
    sessionToken: success ? `jwt_new_${Date.now()}` : undefined,
    requiresReauth: !success,
    loggedOutSessions: success ? 3 : 0,
    ...overrides
  };
};

/**
 * Factory function for security questions
 * Creates security question data
 */
export const securityQuestionFactory = (overrides: Partial<SecurityQuestion> = {}): SecurityQuestion => {
  const questions = [
    'What is your favorite color?',
    'What is your pet\'s name?',
    'What city were you born in?',
    'What is your mother\'s maiden name?',
    'What was your first car?'
  ];

  return {
    id: Math.floor(Math.random() * questions.length),
    question: questions[Math.floor(Math.random() * questions.length)],
    answer: undefined, // Never include answer in response
    is_default: true,
    ...overrides
  };
};

// =============================================================================
// MULTI-FACTOR AUTHENTICATION FACTORIES
// =============================================================================

/**
 * Factory for OAuth login requests
 * Creates external authentication provider data
 */
export const oauthLoginRequestFactory = (overrides: Partial<OAuthLoginRequest> = {}): OAuthLoginRequest => {
  return {
    oauthToken: `oauth_token_${Date.now()}`,
    code: `auth_code_${Date.now()}`,
    state: `state_${Date.now()}`,
    provider: 'google',
    ...overrides
  };
};

/**
 * Factory for SAML authentication parameters
 * Creates SAML-based single sign-on data
 */
export const samlAuthParamsFactory = (overrides: Partial<SAMLAuthParams> = {}): SAMLAuthParams => {
  return {
    samlResponse: `saml_response_${Date.now()}`,
    relayState: `relay_state_${Date.now()}`,
    provider: 'enterprise_sso',
    ...overrides
  };
};

/**
 * Factory for authentication cookie configuration
 * Creates secure cookie settings for session storage
 */
export const authCookieConfigFactory = (overrides: Partial<AuthCookieConfig> = {}): AuthCookieConfig => {
  return {
    name: 'df-session',
    maxAge: 86400, // 24 hours
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    domain: undefined,
    path: '/',
    ...overrides
  };
};

// =============================================================================
// USER RELATIONSHIP FACTORIES
// =============================================================================

/**
 * Factory function for user-app role mappings
 * Creates multi-app access control data
 */
export const userAppRoleFactory = (overrides: Partial<UserAppRole> = {}): UserAppRole => {
  const id = overrides.id || Math.floor(Math.random() * 1000) + 1;
  return {
    id,
    user_id: 1,
    app_id: 1,
    role_id: 1,
    created_date: generateTestDate(-30).toISOString(),
    last_modified_date: generateTestDate(-1).toISOString(),
    created_by_id: 1,
    last_modified_by_id: 1,
    ...overrides
  };
};

/**
 * Factory function for lookup keys
 * Creates additional user metadata and configuration
 */
export const lookupKeyFactory = (overrides: Partial<LookupKey> = {}): LookupKey => {
  const id = overrides.id || Math.floor(Math.random() * 1000) + 1;
  return {
    id,
    name: `lookup_key_${id}`,
    value: `lookup_value_${id}`,
    private: false,
    description: `Test lookup key ${id}`,
    created_date: generateTestDate(-30).toISOString(),
    last_modified_date: generateTestDate(-1).toISOString(),
    created_by_id: 1,
    last_modified_by_id: 1,
    ...overrides
  };
};

/**
 * Factory function for user parameters
 * Creates routing and API call parameters
 */
export const userParamsFactory = (overrides: Partial<UserParams> = {}): UserParams => {
  return {
    admin: false,
    code: undefined,
    email: undefined,
    username: undefined,
    id: undefined,
    tab: undefined,
    action: undefined,
    returnUrl: undefined,
    ...overrides
  };
};

// =============================================================================
// MIDDLEWARE AUTHENTICATION FACTORIES
// =============================================================================

/**
 * Factory for middleware authentication context
 * Creates request context for server-side authentication
 */
export const middlewareAuthContextFactory = (overrides: Partial<MiddlewareAuthContext> = {}): MiddlewareAuthContext => {
  const sessionToken = `jwt_${Date.now()}`;
  return {
    headers: {
      'authorization': `Bearer ${sessionToken}`,
      'user-agent': 'Mozilla/5.0 (compatible; Test Browser)',
      'x-forwarded-for': '127.0.0.1'
    },
    sessionToken,
    refreshToken: `refresh_${Date.now()}`,
    pathname: '/dashboard',
    userAgent: 'Mozilla/5.0 (compatible; Test Browser)',
    clientIP: '127.0.0.1',
    ...overrides
  };
};

/**
 * Factory for middleware authentication results
 * Creates authentication processing decisions
 */
export const middlewareAuthResultFactory = (
  isAuthenticated: boolean = true,
  isAuthorized: boolean = true,
  overrides: Partial<MiddlewareAuthResult> = {}
): MiddlewareAuthResult => {
  return {
    isAuthenticated,
    isAuthorized,
    user: isAuthenticated ? userSessionFactory() : undefined,
    redirectTo: (!isAuthenticated || !isAuthorized) ? '/login' : undefined,
    updatedToken: undefined,
    error: undefined,
    headers: {},
    ...overrides
  };
};

/**
 * Factory for JWT payload for middleware validation
 * Creates server-side JWT token data
 */
export const jwtPayloadFactory = (overrides: Partial<JWTPayload> = {}): JWTPayload => {
  const userId = Math.floor(Math.random() * 10000) + 1;
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: userId.toString(),
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours
    iss: 'dreamfactory',
    user: {
      id: userId,
      email: `user${userId}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      roleId: 1,
      isRootAdmin: false,
      isSysAdmin: false
    },
    permissions: ['read_profile', 'update_profile'],
    sessionId: `session_${userId}_${now}`,
    ...overrides
  };
};

// =============================================================================
// AUTHENTICATION STATE FACTORIES
// =============================================================================

/**
 * Factory for authentication state
 * Creates application-wide authentication state
 */
export const authStateFactory = (overrides: Partial<AuthState> = {}): AuthState => {
  return {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    error: null,
    isRefreshing: false,
    ...overrides
  };
};

/**
 * Factory for authenticated state
 */
export const authenticatedStateFactory = (user?: UserSession): AuthState => {
  return authStateFactory({
    isAuthenticated: true,
    user: user || userSessionFactory(),
    error: null
  });
};

/**
 * Factory for authentication errors
 * Creates detailed error reporting data
 */
export const authErrorFactory = (overrides: Partial<AuthError> = {}): AuthError => {
  return {
    code: AuthErrorCode.INVALID_CREDENTIALS,
    message: 'Invalid username or password',
    statusCode: 401,
    context: 'login_form',
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}`,
    ...overrides
  };
};

// =============================================================================
// COLLECTION FACTORIES FOR COMPREHENSIVE TESTING
// =============================================================================

/**
 * Factory for creating complete user management test datasets
 * Provides comprehensive data for testing user management interfaces
 */
export const createUserManagementTestDataSet = () => {
  return {
    // User profiles
    users: {
      basicUser: userProfileFactory(),
      adminUser: adminProfileFactory(),
      rootAdmin: rootAdminProfileFactory(),
      inactiveUser: userProfileFactory({ is_active: false }),
      unconfirmedUser: userProfileFactory({ confirmed: false }),
      lockedUser: userProfileFactory({ 
        locked_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        failed_login_attempts: 5
      })
    },

    // User rows for table display
    userRows: Array.from({ length: 10 }, (_, i) => userRowFactory({ id: i + 1 })),

    // Roles
    roles: {
      admin: adminRoleTypeFactory(),
      user: roleTypeFactory(),
      readonly: readOnlyRoleTypeFactory(),
      apiDeveloper: apiDeveloperRoleTypeFactory()
    },

    // Sessions
    sessions: {
      userSession: userSessionFactory(),
      adminSession: adminSessionFactory(),
      expiredSession: userSessionFactory({
        expires_at: generateTestDate(-1).toISOString()
      })
    },

    // Authentication flows
    auth: {
      loginCredentials: loginCredentialsFactory(),
      adminLoginCredentials: adminLoginCredentialsFactory(),
      successfulLogin: loginResponseFactory(true),
      failedLogin: loginResponseFactory(false),
      registration: registerDetailsFactory()
    },

    // Password management
    passwords: {
      forgetRequest: forgetPasswordRequestFactory(),
      resetForm: resetFormDataFactory(),
      updateRequest: updatePasswordRequestFactory(),
      updateResponse: updatePasswordResponseFactory(true),
      securityQuestion: securityQuestionFactory()
    },

    // Relationships
    relationships: {
      userAppRole: userAppRoleFactory(),
      lookupKey: lookupKeyFactory(),
      userParams: userParamsFactory()
    },

    // Middleware
    middleware: {
      authContext: middlewareAuthContextFactory(),
      authResult: middlewareAuthResultFactory(),
      jwtPayload: jwtPayloadFactory()
    }
  };
};

/**
 * Factory for creating specific test scenarios
 * Provides targeted test data for common testing scenarios
 */
export const createUserTestScenario = (scenario: string) => {
  const scenarios = {
    'successful-login': () => ({
      credentials: loginCredentialsFactory(),
      response: loginResponseFactory(true),
      session: userSessionFactory(),
      user: userProfileFactory()
    }),

    'failed-login': () => ({
      credentials: loginCredentialsFactory({ password: 'wrong_password' }),
      response: loginResponseFactory(false),
      error: authErrorFactory()
    }),

    'admin-management': () => ({
      currentAdmin: adminProfileFactory(),
      users: [
        userProfileFactory({ id: 1 }),
        userProfileFactory({ id: 2, is_active: false }),
        adminProfileFactory({ id: 3 })
      ],
      roles: [
        adminRoleTypeFactory(),
        roleTypeFactory(),
        readOnlyRoleTypeFactory()
      ]
    }),

    'password-reset': () => ({
      forgetRequest: forgetPasswordRequestFactory(),
      resetForm: resetFormDataFactory(),
      securityQuestion: securityQuestionFactory(),
      response: updatePasswordResponseFactory(true)
    }),

    'multi-factor-auth': () => ({
      credentials: loginCredentialsFactory({ twoFactorCode: '123456' }),
      oauthRequest: oauthLoginRequestFactory(),
      samlParams: samlAuthParamsFactory()
    }),

    'session-management': () => ({
      activeSession: userSessionFactory(),
      expiredSession: userSessionFactory({
        expires_at: generateTestDate(-1).toISOString()
      }),
      refreshResult: tokenRefreshResultFactory(true),
      cookieConfig: authCookieConfigFactory()
    }),

    'role-based-access': () => ({
      adminUser: adminProfileFactory(),
      regularUser: userProfileFactory(),
      readOnlyUser: userProfileFactory({ role: readOnlyRoleTypeFactory() }),
      rolePermissions: [
        rolePermissionFactory({ resource: 'users', operations: ['read', 'create', 'update', 'delete'] }),
        rolePermissionFactory({ resource: 'services', operations: ['read'] }),
        rolePermissionFactory({ resource: 'schema', operations: ['read', 'update'] })
      ]
    })
  };

  const scenarioFn = scenarios[scenario as keyof typeof scenarios];
  if (!scenarioFn) {
    throw new Error(`Unknown user test scenario: ${scenario}`);
  }

  return scenarioFn();
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Core user factories
  userProfileFactory,
  adminProfileFactory,
  rootAdminProfileFactory,
  userRowFactory,

  // Role factories
  roleTypeFactory,
  adminRoleTypeFactory,
  readOnlyRoleTypeFactory,
  apiDeveloperRoleTypeFactory,
  roleServiceAccessFactory,
  roleLookupFactory,
  rolePermissionFactory,
  rolePermissionSummaryFactory,

  // Session factories
  userSessionFactory,
  adminSessionFactory,
  sessionCookieDataFactory,
  sessionValidationResultFactory,
  jwtTokenPayloadFactory,
  tokenRefreshResultFactory,

  // Authentication factories
  loginCredentialsFactory,
  adminLoginCredentialsFactory,
  loginResponseFactory,
  registerDetailsFactory,

  // Password management factories
  forgetPasswordRequestFactory,
  resetFormDataFactory,
  updatePasswordRequestFactory,
  updatePasswordResponseFactory,
  securityQuestionFactory,

  // MFA factories
  oauthLoginRequestFactory,
  samlAuthParamsFactory,
  authCookieConfigFactory,

  // Relationship factories
  userAppRoleFactory,
  lookupKeyFactory,
  userParamsFactory,

  // Middleware factories
  middlewareAuthContextFactory,
  middlewareAuthResultFactory,
  jwtPayloadFactory,

  // State factories
  authStateFactory,
  authenticatedStateFactory,
  authErrorFactory,

  // Collection factories
  createUserManagementTestDataSet,
  createUserTestScenario
};