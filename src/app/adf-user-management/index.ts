/**
 * Central export file for DreamFactory Admin Interface authentication functionality
 * 
 * This module provides a single entry point for all authentication-related components,
 * types, utilities, and validation schemas. Designed to support tree-shaking optimization
 * and clean import patterns for Next.js app router integration.
 * 
 * @fileoverview Authentication module exports for React/Next.js migration
 * @version 1.0.0
 * @author DreamFactory Team
 */

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Core authentication types and interfaces
 * Provides strongly-typed definitions for all authentication workflows
 */
export type {
  // User authentication types
  LoginCredentials,
  RegisterDetails,
  UserSession,
  AuthContext,
  
  // Password management types
  PasswordResetRequest,
  SecurityQuestion,
  PasswordResetWorkflow,
  
  // External authentication types
  OAuthProvider,
  LDAPService,
  ExternalAuthConfig,
  
  // System configuration types
  SystemConfig,
  AuthenticationSettings,
  SessionSettings,
  
  // Form state types
  LoginFormData,
  RegisterFormData,
  PasswordResetFormData,
  ForgotPasswordFormData,
  
  // API response types
  AuthResponse,
  UserProfile,
  SessionInfo,
  ErrorResponse
} from './types';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod validation schemas for all authentication forms
 * Provides real-time validation under 100ms performance requirement
 */
export {
  // Login validation schemas
  loginSchema,
  loginCredentialsSchema,
  
  // Registration validation schemas
  registerSchema,
  registerDetailsSchema,
  passwordConfirmationSchema,
  
  // Password reset validation schemas
  passwordResetSchema,
  passwordResetRequestSchema,
  securityQuestionSchema,
  
  // Forgot password validation schemas
  forgotPasswordSchema,
  forgotPasswordRequestSchema,
  
  // External authentication validation schemas
  oauthProviderSchema,
  ldapServiceSchema,
  
  // System configuration validation schemas
  systemConfigSchema,
  authSettingsSchema,
  
  // Utility validation schemas
  emailSchema,
  usernameSchema,
  passwordStrengthSchema,
  tokenSchema
} from './validation';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Shared authentication utility functions
 * Provides common functionality for token validation, session management, and form helpers
 */
export {
  // Token validation utilities
  validateToken,
  isTokenExpired,
  refreshAuthToken,
  clearAuthToken,
  
  // Session management utilities
  createUserSession,
  destroyUserSession,
  updateSessionActivity,
  getSessionInfo,
  
  // Password utilities
  validatePasswordStrength,
  generateSecurePassword,
  checkPasswordPolicy,
  
  // Form helper utilities
  formatLoginAttribute,
  validateLoginCredentials,
  prepareRegistrationData,
  sanitizeUserInput,
  
  // Authentication state helpers
  isAuthenticated,
  hasPermission,
  getCurrentUser,
  getAuthStatus,
  
  // System configuration helpers
  getLoginAttributeType,
  isRegistrationEnabled,
  getPasswordPolicy,
  getSessionTimeout,
  
  // Error handling utilities
  formatAuthError,
  isAuthError,
  getErrorMessage,
  
  // Navigation helpers
  getRedirectUrl,
  handleAuthRedirect,
  getReturnPath
} from './utils';

// =============================================================================
// AUTHENTICATION COMPONENTS
// =============================================================================

/**
 * React components for authentication workflows
 * All components integrate with React Hook Form, Zod validation, and Tailwind CSS
 */

// Login components
export { default as LoginForm } from './df-login/login-form';

// Registration components
export { default as RegisterForm } from './df-register/register-form';
export { default as RegisterPage } from './df-register/page';

// Password reset components
export { default as PasswordResetForm } from './df-password-reset/password-reset-form';

// Forgot password components
export { default as ForgotPasswordForm } from './df-forgot-password';

// =============================================================================
// COMPONENT TYPE EXPORTS
// =============================================================================

/**
 * Component prop types for external usage and type checking
 */
export type {
  LoginFormProps,
  RegisterFormProps,
  PasswordResetFormProps,
  ForgotPasswordFormProps
} from './types';

// =============================================================================
// CONSTANTS AND ENUMS
// =============================================================================

/**
 * Authentication-related constants and enumerations
 */
export {
  // Authentication workflow types
  AuthWorkflowType,
  
  // Login attribute types
  LoginAttributeType,
  
  // OAuth provider types
  OAuthProviderType,
  
  // Session status types
  SessionStatus,
  
  // Error codes
  AuthErrorCode,
  
  // Default configuration values
  DEFAULT_SESSION_TIMEOUT,
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_REGISTRATION_SETTINGS
} from './types';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Convenience re-exports for commonly used external dependencies
 * These facilitate consistent usage patterns across the authentication module
 */
export type { UseFormReturn } from 'react-hook-form';
export type { z } from 'zod';

/**
 * @example
 * // Clean import pattern for authentication functionality
 * import { 
 *   LoginForm, 
 *   loginSchema, 
 *   validateToken, 
 *   LoginCredentials 
 * } from '@/app/adf-user-management';
 * 
 * // Tree-shaking optimization - only imports used functions
 * import { validatePasswordStrength } from '@/app/adf-user-management';
 * 
 * // Component usage with full type safety
 * const handleLogin = (credentials: LoginCredentials) => {
 *   if (validateToken(credentials.token)) {
 *     // Process login
 *   }
 * };
 */