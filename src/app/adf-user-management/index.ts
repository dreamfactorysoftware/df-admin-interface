/**
 * @fileoverview User Management Module - Authentication & User Workflows
 * 
 * Comprehensive user authentication and management system for DreamFactory Admin Interface.
 * Implements React 19 + Next.js 15.1+ authentication workflows with TypeScript 5.8+ type safety,
 * React Hook Form integration, Zod validation, and Next.js middleware authentication flow.
 * 
 * The module provides complete authentication functionality including:
 * - Login workflows with email/username support and LDAP integration per Section 4.5.1
 * - User registration with dynamic validation based on system configuration
 * - Password reset workflows with security questions and automatic authentication
 * - Forgot password flows with configurable login attributes (email/username)
 * - Real-time form validation under 100ms per React/Next.js Integration Requirements
 * - Token-based session management with JWT validation and automatic refresh
 * - OAuth and external authentication provider support
 * - WCAG 2.1 AA accessibility compliance across all authentication interfaces
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 * @author DreamFactory Admin Interface Team
 */

// =============================================================================
// AUTHENTICATION FORM COMPONENTS
// =============================================================================

/**
 * Login form component implementing email/username authentication with LDAP support.
 * Features React Hook Form integration, real-time Zod validation, and Next.js middleware authentication flow.
 */
export { LoginForm } from './df-login/login-form';
export type { LoginFormProps } from './df-login/login-form';

/**
 * User registration form component with dynamic validation and password confirmation.
 * Implements comprehensive registration workflow with React Hook Form and Zod validation.
 */
export { RegisterForm } from './df-register/register-form';
export type { RegisterFormProps } from './df-register/register-form';

/**
 * Password reset form component supporting multiple workflow types:
 * - Password reset with security questions
 * - Registration confirmation with automatic authentication
 * - User invitation confirmation workflows
 */
export { PasswordResetForm } from './df-password-reset/password-reset-form';
export type { PasswordResetFormProps, ResetWorkflowType } from './df-password-reset/password-reset-form';

/**
 * Forgot password component implementing two-step password recovery flow.
 * Provides dynamic form validation based on system configuration (email vs username).
 */
export { ForgotPassword } from './df-forgot-password/index';
export type { ForgotPasswordProps } from './df-forgot-password/index';

// =============================================================================
// NEXT.JS PAGE COMPONENTS
// =============================================================================

/**
 * Next.js app router page component for user registration route (/register).
 * Implements server-side rendering with React 19 and optimal SEO metadata.
 */
export { default as RegisterPage } from './df-register/page';
export type { RegisterPageProps } from './df-register/page';

// =============================================================================
// TYPE DEFINITIONS AND INTERFACES
// =============================================================================

/**
 * Authentication workflow type definitions for comprehensive type safety.
 * Provides strongly-typed interfaces for all authentication components and workflows.
 */
export type {
  // Core authentication types
  LoginCredentials,
  LoginMethod,
  AuthenticationMode,
  
  // User registration types
  RegisterDetails,
  UserRegistrationData,
  RegistrationStep,
  
  // Password reset and recovery types
  PasswordResetRequest,
  PasswordResetResponse,
  SecurityQuestion,
  SecurityQuestionType,
  
  // External authentication types
  OAuthProvider,
  OAuthProviderConfig,
  LDAPServiceConfig,
  ExternalAuthProvider,
  
  // Session and token management types
  UserSession,
  SessionToken,
  TokenPayload,
  AuthContext,
  AuthenticationState,
  
  // Form and validation types
  LoginFormData,
  RegisterFormData,
  PasswordResetFormData,
  ForgotPasswordFormData,
  ValidationOptions,
  
  // System configuration types
  SystemAuthConfig,
  LoginAttributeConfig,
  PasswordPolicyConfig,
  SecurityConfig,
  
  // API response types
  AuthenticationResponse,
  RegistrationResponse,
  PasswordResetRequestResponse,
  UserDataResponse,
  ValidationErrorResponse,
  
  // Component prop interfaces
  AuthComponentProps,
  FormComponentProps,
  ValidationComponentProps,
  
  // Hook return types
  UseAuthReturn,
  UseLoginReturn,
  UseRegisterReturn,
  UsePasswordResetReturn,
  UseForgotPasswordReturn,
  
  // Error and status types
  AuthenticationError,
  ValidationError,
  FormSubmissionState,
  AuthenticationStatus
} from './types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schemas for real-time form validation under 100ms performance requirement.
 * Provides comprehensive validation for all authentication workflows with React Hook Form integration.
 */
export {
  // Core authentication schemas
  loginSchema,
  loginCredentialsSchema,
  
  // Registration validation schemas
  registerSchema,
  userRegistrationSchema,
  passwordConfirmationSchema,
  
  // Password reset and recovery schemas
  passwordResetSchema,
  passwordResetRequestSchema,
  securityQuestionSchema,
  
  // Forgot password workflow schemas
  forgotPasswordSchema,
  forgotPasswordRequestSchema,
  
  // External authentication schemas
  oauthProviderSchema,
  ldapServiceSchema,
  externalAuthSchema,
  
  // System configuration schemas
  systemAuthConfigSchema,
  passwordPolicySchema,
  loginAttributeConfigSchema,
  
  // Dynamic validation schemas
  createDynamicLoginSchema,
  createDynamicPasswordSchema,
  createConditionalValidationSchema,
  
  // Combined validation schemas for complex workflows
  authenticationWorkflowSchema,
  registrationWorkflowSchema,
  passwordRecoveryWorkflowSchema
} from './validation';

// Inferred types from validation schemas
export type {
  LoginSchemaType,
  RegisterSchemaType,
  PasswordResetSchemaType,
  ForgotPasswordSchemaType,
  OAuthProviderSchemaType,
  SystemAuthConfigSchemaType
} from './validation';

// =============================================================================
// UTILITY FUNCTIONS AND HELPERS
// =============================================================================

/**
 * Authentication utility functions for token validation, session management, and form helpers.
 * Provides common functionality across authentication components with Next.js middleware integration.
 */
export {
  // Token validation and management utilities
  validateSessionToken,
  checkTokenExpiration,
  refreshAuthenticationToken,
  clearExpiredTokens,
  extractTokenPayload,
  
  // Session management utilities
  initializeUserSession,
  updateSessionActivity,
  clearUserSession,
  validateSessionState,
  getSessionMetadata,
  
  // Password validation and security utilities
  validatePasswordStrength,
  generatePasswordPolicy,
  checkPasswordRequirements,
  calculatePasswordScore,
  validatePasswordMatch,
  
  // Form helper utilities for React Hook Form integration
  createFormDefaultValues,
  buildValidationResolver,
  formatValidationErrors,
  createFormFieldConfig,
  generateDynamicFormSchema,
  
  // Authentication state helpers for Zustand store integration
  createAuthenticationState,
  updateAuthenticationContext,
  clearAuthenticationState,
  validateAuthenticationState,
  buildAuthenticationActions,
  
  // System configuration helpers
  getLoginAttributeConfig,
  buildDynamicValidationRules,
  determineAuthenticationMode,
  extractSystemAuthSettings,
  
  // Error handling and messaging utilities
  formatAuthenticationError,
  createValidationErrorMessage,
  buildUserFriendlyErrorMessage,
  extractApiErrorDetails,
  
  // URL and navigation utilities
  buildAuthenticationRedirectUrl,
  parseAuthenticationCallback,
  createSecureRedirectHandler,
  validateRedirectDestination,
  
  // Development and testing utilities
  createMockAuthenticationData,
  generateTestUserCredentials,
  createAuthenticationTestHelpers,
  validateComponentIntegration
} from './utils';

// =============================================================================
// AUTHENTICATION HOOKS
// =============================================================================

/**
 * Custom React hooks for authentication workflows and state management.
 * Provides React Query integration with intelligent caching and Next.js middleware compatibility.
 */
export {
  // Core authentication hooks
  useAuthentication,
  useAuthenticationContext,
  useAuthenticationState,
  
  // Login workflow hooks
  useLogin,
  useLoginForm,
  useLoginValidation,
  
  // Registration workflow hooks
  useRegistration,
  useRegisterForm,
  useRegistrationValidation,
  
  // Password reset workflow hooks
  usePasswordReset,
  usePasswordResetForm,
  usePasswordResetValidation,
  
  // Forgot password workflow hooks
  useForgotPassword,
  useForgotPasswordForm,
  useForgotPasswordValidation,
  
  // Session management hooks
  useSessionManagement,
  useTokenValidation,
  useSessionRefresh,
  
  // System configuration hooks
  useSystemAuthConfig,
  usePasswordPolicy,
  useLoginAttributeConfig,
  
  // External authentication hooks
  useOAuthAuthentication,
  useLDAPAuthentication,
  useExternalAuthProviders
} from './hooks';

// Hook return types
export type {
  UseAuthenticationReturn,
  UseLoginReturn,
  UseRegistrationReturn,
  UsePasswordResetReturn,
  UseForgotPasswordReturn,
  UseSessionManagementReturn,
  UseSystemAuthConfigReturn
} from './hooks';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Authentication constants, configuration values, and default settings.
 * Provides centralized configuration for optimal performance and security.
 */
export {
  // Authentication modes and methods
  AUTHENTICATION_MODES,
  LOGIN_METHODS,
  REGISTRATION_MODES,
  
  // Password policy constants
  PASSWORD_REQUIREMENTS,
  PASSWORD_STRENGTH_LEVELS,
  DEFAULT_PASSWORD_POLICY,
  
  // Session and token configuration
  SESSION_TIMEOUTS,
  TOKEN_REFRESH_THRESHOLDS,
  SESSION_STORAGE_KEYS,
  
  // Validation timing and performance constants
  VALIDATION_DEBOUNCE_MS,
  FORM_SUBMISSION_TIMEOUT_MS,
  REAL_TIME_VALIDATION_THRESHOLD,
  
  // API endpoint configurations
  AUTHENTICATION_ENDPOINTS,
  USER_MANAGEMENT_ENDPOINTS,
  EXTERNAL_AUTH_ENDPOINTS,
  
  // External authentication provider configurations
  OAUTH_PROVIDERS,
  LDAP_SERVICE_TYPES,
  SUPPORTED_AUTH_PROVIDERS,
  
  // Error codes and messages
  AUTHENTICATION_ERROR_CODES,
  VALIDATION_ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  
  // Form field configurations
  LOGIN_FORM_FIELDS,
  REGISTER_FORM_FIELDS,
  PASSWORD_RESET_FORM_FIELDS,
  
  // Security and compliance constants
  SECURITY_HEADERS,
  CSRF_PROTECTION_CONFIG,
  ACCESSIBILITY_CONFIG,
  
  // Performance and optimization constants
  CACHE_TTL_SECONDS,
  DEBOUNCE_DELAYS,
  RETRY_CONFIGURATIONS,
  
  // Feature flags and capabilities
  AUTHENTICATION_FEATURES,
  SUPPORTED_WORKFLOWS,
  EXPERIMENTAL_FEATURES
} from './constants';

// =============================================================================
// CONVENIENCE EXPORTS FOR COMMON PATTERNS
// =============================================================================

/**
 * Pre-configured combinations and convenience exports for enhanced developer experience.
 * Provides ready-to-use patterns for common authentication scenarios.
 */

// Combined authentication components for rapid development
export const AuthenticationComponents = {
  // Form components
  Forms: {
    Login: LoginForm,
    Register: RegisterForm,
    PasswordReset: PasswordResetForm,
    ForgotPassword
  },
  
  // Page components
  Pages: {
    Register: RegisterPage
  }
};

// Comprehensive authentication hooks collection
export const AuthenticationHooks = {
  // Core authentication
  useAuth: useAuthentication,
  useAuthContext: useAuthenticationContext,
  useAuthState: useAuthenticationState,
  
  // Workflow-specific hooks
  useLogin,
  useRegistration,
  usePasswordReset,
  useForgotPassword,
  
  // Session and token management
  useSession: useSessionManagement,
  useTokens: useTokenValidation,
  
  // Configuration and settings
  useSystemConfig: useSystemAuthConfig,
  usePasswordPolicy,
  
  // External authentication
  useOAuth: useOAuthAuthentication,
  useLDAP: useLDAPAuthentication
};

// Validation schemas collection for easy access
export const AuthenticationSchemas = {
  // Core workflow schemas
  login: loginSchema,
  register: registerSchema,
  passwordReset: passwordResetSchema,
  forgotPassword: forgotPasswordSchema,
  
  // Configuration schemas
  systemAuth: systemAuthConfigSchema,
  passwordPolicy: passwordPolicySchema,
  
  // External authentication schemas
  oauth: oauthProviderSchema,
  ldap: ldapServiceSchema,
  
  // Dynamic schema builders
  createDynamicLogin: createDynamicLoginSchema,
  createDynamicPassword: createDynamicPasswordSchema
};

// Utility function collections
export const AuthenticationUtils = {
  // Token and session utilities
  tokens: {
    validate: validateSessionToken,
    checkExpiration: checkTokenExpiration,
    refresh: refreshAuthenticationToken,
    extract: extractTokenPayload
  },
  
  // Session management utilities
  session: {
    initialize: initializeUserSession,
    update: updateSessionActivity,
    clear: clearUserSession,
    validate: validateSessionState
  },
  
  // Password utilities
  password: {
    validate: validatePasswordStrength,
    generatePolicy: generatePasswordPolicy,
    checkRequirements: checkPasswordRequirements,
    validateMatch: validatePasswordMatch
  },
  
  // Form utilities
  forms: {
    createDefaults: createFormDefaultValues,
    buildResolver: buildValidationResolver,
    formatErrors: formatValidationErrors,
    createFieldConfig: createFormFieldConfig
  },
  
  // Error handling utilities
  errors: {
    formatAuth: formatAuthenticationError,
    createValidation: createValidationErrorMessage,
    buildUserFriendly: buildUserFriendlyErrorMessage,
    extractApiDetails: extractApiErrorDetails
  }
};

// Configuration objects for easy access
export const AuthenticationConfig = {
  // Authentication modes and methods
  modes: AUTHENTICATION_MODES,
  methods: LOGIN_METHODS,
  
  // Password and security configuration
  password: DEFAULT_PASSWORD_POLICY,
  security: {
    sessions: SESSION_TIMEOUTS,
    tokens: TOKEN_REFRESH_THRESHOLDS,
    headers: SECURITY_HEADERS
  },
  
  // API endpoints
  endpoints: {
    auth: AUTHENTICATION_ENDPOINTS,
    users: USER_MANAGEMENT_ENDPOINTS,
    external: EXTERNAL_AUTH_ENDPOINTS
  },
  
  // External authentication providers
  providers: {
    oauth: OAUTH_PROVIDERS,
    ldap: LDAP_SERVICE_TYPES,
    supported: SUPPORTED_AUTH_PROVIDERS
  },
  
  // Performance and optimization
  performance: {
    validation: VALIDATION_DEBOUNCE_MS,
    cache: CACHE_TTL_SECONDS,
    retry: RETRY_CONFIGURATIONS
  },
  
  // Messages and feedback
  messages: {
    errors: AUTHENTICATION_ERROR_CODES,
    validation: VALIDATION_ERROR_MESSAGES,
    success: SUCCESS_MESSAGES
  },
  
  // Features and capabilities
  features: AUTHENTICATION_FEATURES,
  workflows: SUPPORTED_WORKFLOWS
};

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guards and runtime validators for authentication data structures.
 * Provides type-safe runtime validation for authentication workflows.
 */
export {
  // Authentication type guards
  isValidLoginCredentials,
  isValidRegistrationData,
  isValidPasswordResetRequest,
  isValidSecurityQuestion,
  
  // Session and token validators
  isValidSessionToken,
  isValidUserSession,
  isValidAuthenticationState,
  
  // External authentication validators
  isValidOAuthProvider,
  isValidLDAPService,
  isValidExternalAuthConfig,
  
  // Configuration validators
  isValidSystemAuthConfig,
  isValidPasswordPolicy,
  isValidLoginAttributeConfig,
  
  // Form data validators
  isValidFormData,
  isValidValidationResult,
  isValidSubmissionState,
  
  // Error and response validators
  isAuthenticationError,
  isValidationError,
  isValidApiResponse
} from './validators';

// =============================================================================
// TESTING UTILITIES
// =============================================================================

/**
 * Testing utilities and mock data generators for authentication components.
 * Provides comprehensive testing support with MSW integration and realistic mock data.
 */
export {
  // Mock data generators
  createMockLoginCredentials,
  createMockRegistrationData,
  createMockUserSession,
  createMockAuthenticationState,
  
  // Test utilities
  createAuthenticationTestWrapper,
  setupAuthenticationMocks,
  createMockAuthProviders,
  generateTestAuthScenarios,
  
  // MSW handlers for authentication testing
  authenticationHandlers,
  registrationHandlers,
  passwordResetHandlers,
  sessionManagementHandlers,
  
  // Component testing utilities
  renderWithAuthProvider,
  createAuthTestContext,
  simulateAuthenticationFlow,
  validateComponentAccessibility
} from './testing';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export provides the main authentication components and utilities
 * for convenient import patterns: import UserManagement from './adf-user-management'
 */
export default {
  // Components
  Components: AuthenticationComponents,
  
  // Hooks
  Hooks: AuthenticationHooks,
  
  // Schemas
  Schemas: AuthenticationSchemas,
  
  // Utilities
  Utils: AuthenticationUtils,
  
  // Configuration
  Config: AuthenticationConfig,
  
  // Constants
  Constants: {
    AUTHENTICATION_MODES,
    LOGIN_METHODS,
    PASSWORD_REQUIREMENTS,
    SESSION_TIMEOUTS,
    AUTHENTICATION_ENDPOINTS
  }
};

// =============================================================================
// MODULE METADATA AND VERSIONING
// =============================================================================

/**
 * Module metadata for version tracking and compatibility checking.
 * Provides comprehensive information about dependencies and capabilities.
 */
export const UserManagementModule = {
  version: '1.0.0',
  compatible: {
    react: '>=19.0.0',
    nextjs: '>=15.1.0',
    typescript: '>=5.8.0',
    node: '>=20.0.0'
  },
  dependencies: {
    '@tanstack/react-query': '^5.79.2',
    'react-hook-form': '^7.52.0',
    'zod': '^3.22.0',
    '@headlessui/react': '^2.0.0',
    'tailwindcss': '^4.1.0',
    'zustand': '^4.5.0',
    'swr': '^2.2.0',
    'jsonwebtoken': '^9.0.0',
    '@heroicons/react': '^2.0.0'
  },
  devDependencies: {
    'vitest': '^2.1.0',
    '@testing-library/react': '^16.0.0',
    '@testing-library/jest-dom': '^6.0.0',
    'msw': '^2.0.0',
    '@axe-core/react': '^4.8.0'
  },
  features: {
    authentication: [
      'Email/Username login with LDAP integration',
      'User registration with dynamic validation',
      'Password reset with security questions',
      'Forgot password workflows',
      'JWT token management with automatic refresh',
      'OAuth and external authentication provider support'
    ],
    security: [
      'Next.js middleware integration',
      'Real-time form validation under 100ms',
      'CSRF protection and security headers',
      'Session management with automatic cleanup',
      'Token validation and expiration handling'
    ],
    accessibility: [
      'WCAG 2.1 AA compliance',
      'Keyboard navigation support',
      'Screen reader compatibility',
      'High contrast mode support',
      'Focus management and ARIA labels'
    ],
    performance: [
      'React Query intelligent caching',
      'Zustand optimized state management',
      'Tree-shaking optimization',
      'Lazy loading and code splitting',
      'Server-side rendering support'
    ]
  },
  description: 'Comprehensive user authentication and management system for React/Next.js applications',
  author: 'DreamFactory Admin Interface Team',
  license: 'MIT',
  homepage: 'https://github.com/dreamfactorysoftware/df-admin-interface',
  repository: 'https://github.com/dreamfactorysoftware/df-admin-interface.git',
  keywords: [
    'authentication',
    'user-management',
    'react',
    'nextjs',
    'typescript',
    'zod',
    'react-hook-form',
    'jwt',
    'oauth',
    'ldap',
    'session-management',
    'password-reset',
    'security'
  ]
} as const;