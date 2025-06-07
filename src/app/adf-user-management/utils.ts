/**
 * Authentication utility functions for DreamFactory Admin Interface
 * 
 * Provides comprehensive authentication utilities that integrate with Next.js middleware,
 * React Query caching, and Zustand state management. These utilities replace Angular
 * JWT helpers and authentication services with modern React/Next.js patterns.
 * 
 * @fileoverview Shared authentication utility functions for token validation, session management, and form helpers
 * @version 1.0.0
 * @requires React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';

// ============================================================================
// Type Definitions (placeholder until types.ts is available)
// ============================================================================

/**
 * User session interface for authentication context
 */
interface UserSession {
  email: string;
  firstName: string;
  host: string;
  id: number;
  isRootAdmin: boolean;
  isSysAdmin: boolean;
  lastLoginDate: string;
  lastName: string;
  name: string;
  sessionId: string;
  sessionToken: string;
  tokenExpiryDate: Date;
  roleId: number;
  role_id?: number;
}

/**
 * Authentication context for Zustand store integration
 */
interface AuthContext {
  isAuthenticated: boolean;
  user: UserSession | null;
  token: string | null;
  tokenExpiry: Date | null;
  loading: boolean;
  error: string | null;
}

/**
 * Login credentials interface
 */
interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
  service?: string;
}

/**
 * Password strength validation configuration
 */
interface PasswordStrengthConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPasswords?: string[];
}

/**
 * Session management configuration
 */
interface SessionConfig {
  tokenKey: string;
  userKey: string;
  refreshThreshold: number; // minutes before expiry to trigger refresh
  maxAge: number; // maximum session age in milliseconds
  checkInterval: number; // session check interval in milliseconds
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default password strength requirements
 */
export const DEFAULT_PASSWORD_CONFIG: PasswordStrengthConfig = {
  minLength: 16,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPasswords: [
    'password', 'password123', 'admin', 'administrator', 'dreamfactory'
  ]
};

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  tokenKey: 'df_session_token',
  userKey: 'df_user_data',
  refreshThreshold: 30, // 30 minutes before expiry
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  checkInterval: 5 * 60 * 1000 // 5 minutes
};

/**
 * JWT token validation patterns
 */
export const JWT_PATTERNS = {
  header: /^[A-Za-z0-9_-]+$/,
  payload: /^[A-Za-z0-9_-]+$/,
  signature: /^[A-Za-z0-9_-]+$/,
  full: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
};

// ============================================================================
// Token Validation Utilities
// ============================================================================

/**
 * Validates JWT token structure without verifying signature
 * Used by Next.js middleware for basic token format validation
 * 
 * @param token - JWT token string
 * @returns boolean indicating if token has valid structure
 * 
 * @example
 * ```ts
 * // In Next.js middleware
 * const token = request.headers.get('authorization')?.replace('Bearer ', '');
 * if (!isValidTokenStructure(token)) {
 *   return NextResponse.redirect('/login');
 * }
 * ```
 */
export function isValidTokenStructure(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Check basic JWT structure (header.payload.signature)
  if (!JWT_PATTERNS.full.test(token)) {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Validate each part format
  return parts.every(part => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part));
}

/**
 * Extracts token payload without verification (for middleware use)
 * 
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 * 
 * @example
 * ```ts
 * const payload = extractTokenPayload(sessionToken);
 * if (payload?.exp && payload.exp * 1000 < Date.now()) {
 *   // Token expired, refresh needed
 * }
 * ```
 */
export function extractTokenPayload(token: string | null | undefined): any | null {
  if (!isValidTokenStructure(token)) {
    return null;
  }

  try {
    const payloadPart = token!.split('.')[1];
    const decodedPayload = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.warn('Failed to extract token payload:', error);
    return null;
  }
}

/**
 * Checks if token is expired or will expire within threshold
 * 
 * @param token - JWT token string
 * @param thresholdMinutes - minutes before expiry to consider token stale
 * @returns object with expiry status information
 * 
 * @example
 * ```ts
 * const { isExpired, expiresInMinutes, needsRefresh } = checkTokenExpiry(token, 30);
 * if (needsRefresh) {
 *   await refreshAuthToken();
 * }
 * ```
 */
export function checkTokenExpiry(
  token: string | null | undefined,
  thresholdMinutes: number = DEFAULT_SESSION_CONFIG.refreshThreshold
): {
  isExpired: boolean;
  expiresInMinutes: number;
  needsRefresh: boolean;
  expiryDate: Date | null;
} {
  const payload = extractTokenPayload(token);
  
  if (!payload?.exp) {
    return {
      isExpired: true,
      expiresInMinutes: 0,
      needsRefresh: true,
      expiryDate: null
    };
  }

  const expiryDate = new Date(payload.exp * 1000);
  const now = new Date();
  const timeDiffMs = expiryDate.getTime() - now.getTime();
  const expiresInMinutes = Math.floor(timeDiffMs / (1000 * 60));
  
  return {
    isExpired: timeDiffMs <= 0,
    expiresInMinutes: Math.max(0, expiresInMinutes),
    needsRefresh: expiresInMinutes <= thresholdMinutes,
    expiryDate
  };
}

/**
 * Generates headers for Next.js middleware authentication
 * 
 * @param token - JWT session token
 * @param apiKey - Optional API key for additional authentication
 * @returns headers object for fetch requests
 * 
 * @example
 * ```ts
 * // In middleware.ts
 * const headers = generateAuthHeaders(sessionToken, apiKey);
 * const response = await fetch('/api/v2/user/session', { headers });
 * ```
 */
export function generateAuthHeaders(
  token: string | null,
  apiKey?: string | null
): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-DreamFactory-API-Key': apiKey || '',
  };

  if (token && isValidTokenStructure(token)) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ============================================================================
// Session Management Utilities
// ============================================================================

/**
 * Safely retrieves session token from storage
 * Compatible with both browser and server environments
 * 
 * @param config - Session configuration
 * @returns session token or null if not found/invalid
 * 
 * @example
 * ```ts
 * const token = getSessionToken();
 * if (token && !checkTokenExpiry(token).isExpired) {
 *   // Use valid token
 * }
 * ```
 */
export function getSessionToken(config: SessionConfig = DEFAULT_SESSION_CONFIG): string | null {
  if (typeof window === 'undefined') {
    return null; // Server-side, token should come from request headers
  }

  try {
    const token = localStorage.getItem(config.tokenKey);
    return token && isValidTokenStructure(token) ? token : null;
  } catch (error) {
    console.warn('Failed to retrieve session token:', error);
    return null;
  }
}

/**
 * Safely stores session token with validation
 * 
 * @param token - JWT session token
 * @param config - Session configuration
 * @returns boolean indicating successful storage
 * 
 * @example
 * ```ts
 * const success = setSessionToken(newToken);
 * if (success) {
 *   queryClient.invalidateQueries(['user-session']);
 * }
 * ```
 */
export function setSessionToken(
  token: string | null,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): boolean {
  if (typeof window === 'undefined') {
    return false; // Server-side storage not supported
  }

  try {
    if (!token) {
      localStorage.removeItem(config.tokenKey);
      return true;
    }

    if (!isValidTokenStructure(token)) {
      console.warn('Attempted to store invalid token structure');
      return false;
    }

    localStorage.setItem(config.tokenKey, token);
    return true;
  } catch (error) {
    console.error('Failed to store session token:', error);
    return false;
  }
}

/**
 * Retrieves user data from storage with type safety
 * 
 * @param config - Session configuration
 * @returns user session data or null if not found/invalid
 * 
 * @example
 * ```ts
 * const userData = getUserData();
 * if (userData?.isSysAdmin) {
 *   // User has admin privileges
 * }
 * ```
 */
export function getUserData(config: SessionConfig = DEFAULT_SESSION_CONFIG): UserSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const userData = localStorage.getItem(config.userKey);
    if (!userData) return null;

    const parsed = JSON.parse(userData) as UserSession;
    
    // Basic validation of required fields
    if (!parsed.sessionToken || !parsed.email || !parsed.id) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('Failed to retrieve user data:', error);
    return null;
  }
}

/**
 * Stores user session data with validation
 * 
 * @param userData - User session data
 * @param config - Session configuration
 * @returns boolean indicating successful storage
 * 
 * @example
 * ```ts
 * const success = setUserData(sessionData);
 * if (success) {
 *   authStore.setState({ user: sessionData, isAuthenticated: true });
 * }
 * ```
 */
export function setUserData(
  userData: UserSession | null,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (!userData) {
      localStorage.removeItem(config.userKey);
      return true;
    }

    // Validate required fields
    if (!userData.sessionToken || !userData.email || !userData.id) {
      console.warn('Attempted to store incomplete user data');
      return false;
    }

    localStorage.setItem(config.userKey, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('Failed to store user data:', error);
    return false;
  }
}

/**
 * Clears all authentication data from storage
 * 
 * @param config - Session configuration
 * @returns boolean indicating successful cleanup
 * 
 * @example
 * ```ts
 * clearSessionData();
 * authStore.setState({ 
 *   isAuthenticated: false, 
 *   user: null, 
 *   token: null 
 * });
 * ```
 */
export function clearSessionData(config: SessionConfig = DEFAULT_SESSION_CONFIG): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.userKey);
    
    // Clear any additional auth-related items
    const itemsToRemove = [
      'df_api_key',
      'df_remember_me',
      'df_last_login',
      'df_session_refresh'
    ];
    
    itemsToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore individual removal errors
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to clear session data:', error);
    return false;
  }
}

/**
 * Creates a session validation function for React Query
 * 
 * @param config - Session configuration
 * @returns function that validates current session
 * 
 * @example
 * ```ts
 * const validateSession = createSessionValidator();
 * const { data: isValid } = useQuery({
 *   queryKey: ['session-valid'],
 *   queryFn: validateSession,
 *   refetchInterval: 5 * 60 * 1000, // 5 minutes
 * });
 * ```
 */
export function createSessionValidator(
  config: SessionConfig = DEFAULT_SESSION_CONFIG
) {
  return async (): Promise<boolean> => {
    const token = getSessionToken(config);
    if (!token) return false;

    const { isExpired } = checkTokenExpiry(token);
    if (isExpired) {
      clearSessionData(config);
      return false;
    }

    return true;
  };
}

// ============================================================================
// Password Strength Validation
// ============================================================================

/**
 * Validates password strength according to configuration
 * 
 * @param password - Password to validate
 * @param config - Password strength configuration
 * @returns validation result with detailed feedback
 * 
 * @example
 * ```ts
 * const result = validatePasswordStrength(password);
 * if (!result.isValid) {
 *   setErrors({ password: result.errors.join(', ') });
 * }
 * ```
 */
export function validatePasswordStrength(
  password: string,
  config: PasswordStrengthConfig = DEFAULT_PASSWORD_CONFIG
): {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length validation
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
    suggestions.push(`Add ${config.minLength - password.length} more characters`);
  } else {
    score += 20;
  }

  // Character type validations
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
    suggestions.push('Add an uppercase letter (A-Z)');
  } else if (config.requireUppercase) {
    score += 15;
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
    suggestions.push('Add a lowercase letter (a-z)');
  } else if (config.requireLowercase) {
    score += 15;
  }

  if (config.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
    suggestions.push('Add a number (0-9)');
  } else if (config.requireNumbers) {
    score += 15;
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
    suggestions.push('Add a special character (!@#$%^&*)');
  } else if (config.requireSpecialChars) {
    score += 15;
  }

  // Forbidden password check
  if (config.forbiddenPasswords?.some(forbidden => 
    password.toLowerCase().includes(forbidden.toLowerCase())
  )) {
    errors.push('Password contains common or forbidden words');
    suggestions.push('Use a more unique password');
    score -= 30;
  }

  // Bonus points for additional complexity
  const uniqueChars = new Set(password.toLowerCase()).size;
  const complexityBonus = Math.min(20, Math.floor(uniqueChars / 2));
  score += complexityBonus;

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    isValid: errors.length === 0,
    score,
    errors,
    suggestions
  };
}

/**
 * Generates password strength indicator class names for Tailwind CSS
 * 
 * @param score - Password strength score (0-100)
 * @returns Tailwind class names for styling
 * 
 * @example
 * ```tsx
 * const strengthClasses = getPasswordStrengthClasses(result.score);
 * return <div className={strengthClasses}>Strength: {result.score}%</div>;
 * ```
 */
export function getPasswordStrengthClasses(score: number): string {
  if (score < 25) {
    return 'text-red-600 bg-red-50 border-red-200';
  }
  if (score < 50) {
    return 'text-orange-600 bg-orange-50 border-orange-200';
  }
  if (score < 75) {
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
  return 'text-green-600 bg-green-50 border-green-200';
}

/**
 * Creates a password validation function for React Hook Form
 * 
 * @param config - Password strength configuration
 * @returns validation function for React Hook Form
 * 
 * @example
 * ```ts
 * const passwordValidator = createPasswordValidator();
 * const { register } = useForm({
 *   defaultValues: { password: '' }
 * });
 * 
 * <input {...register('password', { validate: passwordValidator })} />
 * ```
 */
export function createPasswordValidator(
  config: PasswordStrengthConfig = DEFAULT_PASSWORD_CONFIG
) {
  return (password: string): string | true => {
    const result = validatePasswordStrength(password, config);
    return result.isValid ? true : result.errors[0];
  };
}

// ============================================================================
// Form Helper Utilities
// ============================================================================

/**
 * Utility function for combining CSS classes with Tailwind merge
 * Optimizes class combinations and removes duplicates
 * 
 * @param inputs - Class value inputs
 * @returns merged class string
 * 
 * @example
 * ```ts
 * const classes = cn(
 *   'base-class',
 *   isError && 'error-class',
 *   variant === 'primary' && 'primary-class'
 * );
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Creates form field error helper for React Hook Form integration
 * 
 * @param form - React Hook Form instance
 * @param fieldName - Field name to check for errors
 * @returns error information and helper functions
 * 
 * @example
 * ```ts
 * const { hasError, errorMessage, getFieldClasses } = createFieldErrorHelper(form, 'email');
 * return (
 *   <input 
 *     {...register('email')}
 *     className={getFieldClasses('input-base')}
 *     aria-invalid={hasError}
 *   />
 * );
 * ```
 */
export function createFieldErrorHelper<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: FieldPath<T>
) {
  const error = form.formState.errors[fieldName];
  const hasError = !!error;
  const errorMessage = error?.message as string | undefined;

  return {
    hasError,
    errorMessage,
    getFieldClasses: (baseClasses: string) => cn(
      baseClasses,
      hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
    ),
    getErrorClasses: () => cn(
      'text-sm mt-1',
      hasError ? 'text-red-600' : 'text-transparent'
    )
  };
}

/**
 * Creates login attribute helper for dynamic form validation
 * Supports both email and username login methods
 * 
 * @param loginAttribute - Current login attribute ('email' or 'username')
 * @returns helper functions for login form management
 * 
 * @example
 * ```ts
 * const { getLoginFieldName, getLoginValidation, isEmailMode } = 
 *   createLoginAttributeHelper(loginAttribute);
 * 
 * const validation = getLoginValidation();
 * <input {...register(getLoginFieldName(), validation)} />
 * ```
 */
export function createLoginAttributeHelper(loginAttribute: 'email' | 'username') {
  const isEmailMode = loginAttribute === 'email';
  
  return {
    isEmailMode,
    getLoginFieldName: () => isEmailMode ? 'email' : 'username',
    getLoginValidation: () => {
      if (isEmailMode) {
        return {
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Please enter a valid email address'
          }
        };
      }
      return {
        required: 'Username is required',
        minLength: {
          value: 3,
          message: 'Username must be at least 3 characters'
        }
      };
    },
    getPlaceholder: () => isEmailMode ? 'Enter your email' : 'Enter your username',
    getLabel: () => isEmailMode ? 'Email Address' : 'Username'
  };
}

/**
 * Creates OAuth service helper for external authentication
 * 
 * @param services - Available OAuth services
 * @returns helper functions for OAuth integration
 * 
 * @example
 * ```ts
 * const { hasOAuthServices, getOAuthUrl, getServiceIcon } = 
 *   createOAuthHelper(oauthServices);
 * 
 * if (hasOAuthServices) {
 *   services.map(service => (
 *     <a href={getOAuthUrl(service)} key={service.name}>
 *       {getServiceIcon(service.name)} Login with {service.name}
 *     </a>
 *   ));
 * }
 * ```
 */
export function createOAuthHelper(services: Array<{ name: string; [key: string]: any }>) {
  return {
    hasOAuthServices: services.length > 0,
    getOAuthUrl: (service: { name: string; [key: string]: any }) => 
      `/api/oauth/${service.name}`,
    getServiceIcon: (serviceName: string) => {
      const iconMap: Record<string, string> = {
        google: '🔍',
        github: '🐙',
        microsoft: '🪟',
        facebook: '📘',
        twitter: '🐦',
        linkedin: '💼'
      };
      return iconMap[serviceName.toLowerCase()] || '🔐';
    },
    getServiceDisplayName: (serviceName: string) => {
      return serviceName.charAt(0).toUpperCase() + serviceName.slice(1);
    }
  };
}

// ============================================================================
// Authentication State Helpers for Zustand Integration
// ============================================================================

/**
 * Creates authentication state actions for Zustand store
 * 
 * @returns object with authentication state management functions
 * 
 * @example
 * ```ts
 * const authActions = createAuthStateActions();
 * 
 * // In Zustand store
 * const useAuthStore = create((set, get) => ({
 *   ...initialAuthState,
 *   ...authActions(set, get),
 * }));
 * ```
 */
export function createAuthStateActions() {
  return {
    /**
     * Handles successful login by updating state and storage
     */
    handleLoginSuccess: (
      set: (state: Partial<AuthContext>) => void,
      userData: UserSession
    ) => {
      const success = setUserData(userData) && setSessionToken(userData.sessionToken);
      
      if (success) {
        set({
          isAuthenticated: true,
          user: userData,
          token: userData.sessionToken,
          tokenExpiry: userData.tokenExpiryDate,
          loading: false,
          error: null
        });
      } else {
        set({
          error: 'Failed to store session data',
          loading: false
        });
      }
    },

    /**
     * Handles authentication errors
     */
    handleAuthError: (
      set: (state: Partial<AuthContext>) => void,
      error: string
    ) => {
      clearSessionData();
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        tokenExpiry: null,
        loading: false,
        error
      });
    },

    /**
     * Handles logout by clearing all authentication data
     */
    handleLogout: (set: (state: Partial<AuthContext>) => void) => {
      clearSessionData();
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        tokenExpiry: null,
        loading: false,
        error: null
      });
    },

    /**
     * Handles token refresh
     */
    handleTokenRefresh: (
      set: (state: Partial<AuthContext>) => void,
      newToken: string,
      newExpiry: Date
    ) => {
      const success = setSessionToken(newToken);
      
      if (success) {
        set({
          token: newToken,
          tokenExpiry: newExpiry,
          error: null
        });
      }
    },

    /**
     * Initializes authentication state from storage
     */
    initializeAuthState: (set: (state: Partial<AuthContext>) => void) => {
      set({ loading: true });
      
      const userData = getUserData();
      const token = getSessionToken();
      
      if (userData && token && !checkTokenExpiry(token).isExpired) {
        set({
          isAuthenticated: true,
          user: userData,
          token,
          tokenExpiry: userData.tokenExpiryDate,
          loading: false,
          error: null
        });
      } else {
        clearSessionData();
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          tokenExpiry: null,
          loading: false,
          error: null
        });
      }
    }
  };
}

/**
 * Creates session monitoring utility for automatic token refresh
 * 
 * @param onTokenRefresh - Callback for token refresh
 * @param onSessionExpired - Callback for session expiration
 * @param config - Session configuration
 * @returns cleanup function
 * 
 * @example
 * ```ts
 * const cleanup = createSessionMonitor(
 *   (newToken) => authStore.setState({ token: newToken }),
 *   () => authStore.getState().handleLogout(),
 *   sessionConfig
 * );
 * 
 * // Cleanup on component unmount
 * useEffect(() => cleanup, []);
 * ```
 */
export function createSessionMonitor(
  onTokenRefresh: (token: string) => void,
  onSessionExpired: () => void,
  config: SessionConfig = DEFAULT_SESSION_CONFIG
): () => void {
  const checkSession = () => {
    const token = getSessionToken(config);
    
    if (!token) {
      onSessionExpired();
      return;
    }

    const { isExpired, needsRefresh } = checkTokenExpiry(token);
    
    if (isExpired) {
      onSessionExpired();
    } else if (needsRefresh) {
      // In a real implementation, this would call the refresh API
      console.log('Token refresh needed');
    }
  };

  // Initial check
  checkSession();

  // Set up interval
  const intervalId = setInterval(checkSession, config.checkInterval);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Creates React Query cache key generator for authentication-related queries
 * 
 * @param userId - Current user ID
 * @returns object with cache key generators
 * 
 * @example
 * ```ts
 * const cacheKeys = createAuthCacheKeys(user?.id);
 * 
 * const { data } = useQuery({
 *   queryKey: cacheKeys.userProfile(),
 *   queryFn: fetchUserProfile,
 * });
 * ```
 */
export function createAuthCacheKeys(userId?: number) {
  return {
    userProfile: () => ['user-profile', userId] as const,
    userPermissions: () => ['user-permissions', userId] as const,
    userSessions: () => ['user-sessions', userId] as const,
    authStatus: () => ['auth-status'] as const,
    systemConfig: () => ['system-config'] as const,
    oauthServices: () => ['oauth-services'] as const,
    ldapServices: () => ['ldap-services'] as const
  };
}

// ============================================================================
// Export Summary
// ============================================================================

/**
 * Summary of exported utilities for authentication workflows:
 * 
 * Token Validation:
 * - isValidTokenStructure: Basic JWT format validation
 * - extractTokenPayload: Extract payload without verification
 * - checkTokenExpiry: Check token expiration with threshold
 * - generateAuthHeaders: Create headers for API requests
 * 
 * Session Management:
 * - getSessionToken/setSessionToken: Token storage management
 * - getUserData/setUserData: User data storage management
 * - clearSessionData: Complete session cleanup
 * - createSessionValidator: React Query validation function
 * 
 * Password Validation:
 * - validatePasswordStrength: Comprehensive password validation
 * - getPasswordStrengthClasses: Tailwind classes for UI feedback
 * - createPasswordValidator: React Hook Form validator
 * 
 * Form Helpers:
 * - cn: Tailwind class utility function
 * - createFieldErrorHelper: Form error management
 * - createLoginAttributeHelper: Dynamic login field handling
 * - createOAuthHelper: OAuth service integration
 * 
 * Zustand Integration:
 * - createAuthStateActions: Authentication state management
 * - createSessionMonitor: Automatic session monitoring
 * - createAuthCacheKeys: React Query cache key generation
 */