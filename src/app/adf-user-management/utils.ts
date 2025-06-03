/**
 * Shared authentication utility functions for token validation, session management, and form helpers.
 * Provides common functionality used across authentication components including password strength 
 * validation, token expiration checking, and authentication state helpers that integrate with 
 * Next.js middleware and React Query caching.
 */

import { type QueryClient } from '@tanstack/react-query';
import { type UseFormReturn } from 'react-hook-form';

/**
 * Token validation utilities replacing Angular JWT helpers for Next.js middleware integration
 */
export const tokenUtils = {
  /**
   * Validates JWT token structure and basic format without signature verification
   * @param token JWT token string
   * @returns boolean indicating if token has valid structure
   */
  isValidTokenFormat(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Check basic JWT format (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Validate that header and payload are valid base64 JSON
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      // Verify required JWT claims
      return !!(header.typ && payload.exp && payload.iat);
    } catch {
      return false;
    }
  },

  /**
   * Extracts token payload without signature verification (for client-side use only)
   * @param token JWT token string
   * @returns Decoded payload or null if invalid
   */
  decodeTokenPayload(token: string): Record<string, any> | null {
    if (!this.isValidTokenFormat(token)) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  },

  /**
   * Checks if token is expired based on payload exp claim
   * @param token JWT token string
   * @param bufferSeconds Optional buffer time in seconds (default: 60)
   * @returns boolean indicating if token is expired
   */
  isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return true;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferSeconds * 1000;

    return currentTime >= (expirationTime - bufferTime);
  },

  /**
   * Gets token expiration time in milliseconds
   * @param token JWT token string
   * @returns Expiration timestamp or null if invalid
   */
  getTokenExpiration(token: string): number | null {
    const payload = this.decodeTokenPayload(token);
    return payload?.exp ? payload.exp * 1000 : null;
  },

  /**
   * Calculates time until token expiration
   * @param token JWT token string
   * @returns Time until expiration in milliseconds, or null if invalid/expired
   */
  getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return null;
    }

    const timeLeft = expiration - Date.now();
    return timeLeft > 0 ? timeLeft : null;
  },

  /**
   * Determines if token needs refresh based on remaining time
   * @param token JWT token string
   * @param refreshThresholdMinutes Minutes before expiration to trigger refresh (default: 5)
   * @returns boolean indicating if refresh is needed
   */
  shouldRefreshToken(token: string, refreshThresholdMinutes: number = 5): boolean {
    const timeLeft = this.getTimeUntilExpiration(token);
    if (!timeLeft) {
      return true;
    }

    const thresholdMs = refreshThresholdMinutes * 60 * 1000;
    return timeLeft <= thresholdMs;
  }
};

/**
 * Session management utilities for React Query cache integration
 */
export const sessionUtils = {
  /**
   * Invalidates authentication-related React Query cache entries
   * @param queryClient React Query client instance
   */
  async invalidateAuthCache(queryClient: QueryClient): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['user'] }),
      queryClient.invalidateQueries({ queryKey: ['session'] }),
      queryClient.invalidateQueries({ queryKey: ['permissions'] }),
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    ]);
  },

  /**
   * Clears all React Query cache and resets to initial state
   * @param queryClient React Query client instance
   */
  async clearAllCache(queryClient: QueryClient): Promise<void> {
    await queryClient.clear();
    queryClient.resetQueries();
  },

  /**
   * Prefetches user session data for improved performance
   * @param queryClient React Query client instance
   * @param userId User identifier for prefetching
   */
  async prefetchUserSession(queryClient: QueryClient, userId: string): Promise<void> {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['user', userId],
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: ['permissions', userId],
        staleTime: 10 * 60 * 1000, // 10 minutes
      })
    ]);
  },

  /**
   * Updates cached user data optimistically
   * @param queryClient React Query client instance
   * @param userId User identifier
   * @param userData Updated user data
   */
  updateUserCache(queryClient: QueryClient, userId: string, userData: any): void {
    queryClient.setQueryData(['user', userId], userData);
  },

  /**
   * Validates session storage integrity
   * @returns boolean indicating if session storage is accessible and valid
   */
  validateSessionStorage(): boolean {
    try {
      const testKey = '__df_session_test__';
      sessionStorage.setItem(testKey, 'test');
      const result = sessionStorage.getItem(testKey) === 'test';
      sessionStorage.removeItem(testKey);
      return result;
    } catch {
      return false;
    }
  },

  /**
   * Safely gets session data with error handling
   * @param key Session storage key
   * @returns Parsed session data or null if not found/invalid
   */
  getSessionData<T>(key: string): T | null {
    try {
      if (!this.validateSessionStorage()) {
        return null;
      }

      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Safely sets session data with error handling
   * @param key Session storage key
   * @param value Data to store
   * @returns boolean indicating success
   */
  setSessionData<T>(key: string, value: T): boolean {
    try {
      if (!this.validateSessionStorage()) {
        return false;
      }

      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Clears all session storage data
   */
  clearSessionData(): void {
    try {
      if (this.validateSessionStorage()) {
        sessionStorage.clear();
      }
    } catch {
      // Silent fail for session storage issues
    }
  }
};

/**
 * Password strength validation configuration
 */
interface PasswordValidationConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength?: number;
  bannedPatterns?: RegExp[];
}

/**
 * Password strength validation result
 */
interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

/**
 * Password strength validation functions with configurable requirements
 */
export const passwordUtils = {
  /**
   * Default password validation configuration per security specifications
   */
  defaultConfig: {
    minLength: 16, // 16-character minimum per security requirements
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
    bannedPatterns: [
      /(.)\1{3,}/, // No more than 3 consecutive identical characters
      /^(?:password|123456|qwerty|admin|user|guest)$/i, // Common weak passwords
      /^(?:\d{6,}|[a-z]{6,}|[A-Z]{6,})$/ // All same character type
    ]
  } as PasswordValidationConfig,

  /**
   * Validates password strength against configuration
   * @param password Password to validate
   * @param config Optional validation configuration
   * @returns Validation result with score and feedback
   */
  validatePasswordStrength(
    password: string, 
    config: PasswordValidationConfig = this.defaultConfig
  ): PasswordValidationResult {
    const feedback: string[] = [];
    let score = 0;

    // Basic length validation
    if (password.length < config.minLength) {
      feedback.push(`Password must be at least ${config.minLength} characters long`);
      return {
        isValid: false,
        score: 0,
        feedback,
        strength: 'weak'
      };
    }

    score += Math.min(25, (password.length / config.minLength) * 25);

    // Maximum length validation
    if (config.maxLength && password.length > config.maxLength) {
      feedback.push(`Password must not exceed ${config.maxLength} characters`);
      return {
        isValid: false,
        score: 0,
        feedback,
        strength: 'weak'
      };
    }

    // Character type requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

    if (config.requireUppercase && !hasUppercase) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (hasUppercase) {
      score += 15;
    }

    if (config.requireLowercase && !hasLowercase) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (hasLowercase) {
      score += 15;
    }

    if (config.requireNumbers && !hasNumbers) {
      feedback.push('Password must contain at least one number');
    } else if (hasNumbers) {
      score += 15;
    }

    if (config.requireSpecialChars && !hasSpecialChars) {
      feedback.push('Password must contain at least one special character');
    } else if (hasSpecialChars) {
      score += 15;
    }

    // Check banned patterns
    for (const pattern of config.bannedPatterns || []) {
      if (pattern.test(password)) {
        feedback.push('Password contains a common pattern that is not secure');
        score = Math.max(0, score - 20);
        break;
      }
    }

    // Additional scoring for complexity
    const uniqueChars = new Set(password).size;
    const complexity = uniqueChars / password.length;
    score += complexity * 15;

    // Cap score at 100
    score = Math.min(100, Math.round(score));

    // Determine strength level
    let strength: 'weak' | 'fair' | 'good' | 'strong';
    if (score < 40) {
      strength = 'weak';
    } else if (score < 60) {
      strength = 'fair';
    } else if (score < 80) {
      strength = 'good';
    } else {
      strength = 'strong';
    }

    const isValid = feedback.length === 0 && score >= 60;

    return {
      isValid,
      score,
      feedback,
      strength
    };
  },

  /**
   * Validates password confirmation matching
   * @param password Original password
   * @param confirmPassword Confirmation password
   * @returns boolean indicating if passwords match
   */
  validatePasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0;
  },

  /**
   * Generates password strength indicator for UI
   * @param password Password to analyze
   * @returns Object with visual indicators for password strength
   */
  getPasswordStrengthIndicator(password: string) {
    const result = this.validatePasswordStrength(password);
    
    return {
      score: result.score,
      strength: result.strength,
      color: {
        weak: 'text-red-600',
        fair: 'text-yellow-600',
        good: 'text-blue-600',
        strong: 'text-green-600'
      }[result.strength],
      bgColor: {
        weak: 'bg-red-200',
        fair: 'bg-yellow-200',
        good: 'bg-blue-200',
        strong: 'bg-green-200'
      }[result.strength],
      width: `${result.score}%`,
      label: {
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong'
      }[result.strength]
    };
  }
};

/**
 * Form helper utilities for React Hook Form integration
 */
export const formUtils = {
  /**
   * Debounces validation to improve performance
   * @param validationFn Validation function
   * @param delay Delay in milliseconds (default: 300)
   * @returns Debounced validation function
   */
  debounceValidation<T extends any[]>(
    validationFn: (...args: T) => any,
    delay: number = 300
  ) {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: T) => {
      clearTimeout(timeoutId);
      return new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(validationFn(...args));
        }, delay);
      });
    };
  },

  /**
   * Creates conditional field validation based on form state
   * @param form React Hook Form instance
   * @param condition Function that returns boolean based on form values
   * @param validationFn Validation function to apply when condition is true
   * @returns Conditional validator
   */
  createConditionalValidator<T>(
    form: UseFormReturn<T>,
    condition: (values: T) => boolean,
    validationFn: (value: any) => boolean | string
  ) {
    return (value: any) => {
      const formValues = form.getValues();
      if (condition(formValues)) {
        return validationFn(value);
      }
      return true;
    };
  },

  /**
   * Handles form submission with loading state and error handling
   * @param submitFn Async submission function
   * @param onSuccess Success callback
   * @param onError Error callback
   * @returns Form submission handler
   */
  createSubmissionHandler<T>(
    submitFn: (data: T) => Promise<any>,
    onSuccess?: (result: any) => void,
    onError?: (error: Error) => void
  ) {
    return async (data: T) => {
      try {
        const result = await submitFn(data);
        onSuccess?.(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error('Submission failed');
        onError?.(errorObj);
        throw errorObj;
      }
    };
  },

  /**
   * Transforms form data for API submission
   * @param formData Raw form data
   * @param transformMap Object mapping form fields to API fields
   * @returns Transformed data for API submission
   */
  transformFormData<T extends Record<string, any>>(
    formData: T,
    transformMap: Partial<Record<keyof T, string | ((value: any) => any)>>
  ): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const [key, value] of Object.entries(formData)) {
      const transform = transformMap[key as keyof T];
      
      if (typeof transform === 'string') {
        transformed[transform] = value;
      } else if (typeof transform === 'function') {
        const transformedValue = transform(value);
        if (transformedValue !== undefined) {
          transformed[key] = transformedValue;
        }
      } else {
        transformed[key] = value;
      }
    }

    return transformed;
  },

  /**
   * Validates required fields are not empty
   * @param data Form data object
   * @param requiredFields Array of required field names
   * @returns Validation result with missing fields
   */
  validateRequiredFields<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[]
  ): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = data[field];
      if (value === null || value === undefined || value === '') {
        missingFields.push(String(field));
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  },

  /**
   * Creates a reset handler that clears form errors and data
   * @param form React Hook Form instance
   * @param defaultValues Optional default values to reset to
   * @returns Reset handler function
   */
  createResetHandler<T>(form: UseFormReturn<T>, defaultValues?: Partial<T>) {
    return () => {
      form.reset(defaultValues);
      form.clearErrors();
    };
  }
};

/**
 * Authentication state helpers for Zustand store integration
 */
export const authStateUtils = {
  /**
   * Creates authentication state update handler
   * @param updateFn Zustand state update function
   * @returns State update handlers
   */
  createAuthStateHandlers<T extends { user: any; isAuthenticated: boolean; token: string | null }>(
    updateFn: (updater: (state: T) => T) => void
  ) {
    return {
      /**
       * Sets authenticated user state
       */
      setAuthenticated: (user: any, token: string) => {
        updateFn((state) => ({
          ...state,
          user,
          token,
          isAuthenticated: true
        }));
      },

      /**
       * Clears authentication state
       */
      clearAuthenticated: () => {
        updateFn((state) => ({
          ...state,
          user: null,
          token: null,
          isAuthenticated: false
        }));
      },

      /**
       * Updates user data without affecting authentication status
       */
      updateUser: (userData: Partial<any>) => {
        updateFn((state) => ({
          ...state,
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      /**
       * Updates token without affecting user data
       */
      updateToken: (newToken: string) => {
        updateFn((state) => ({
          ...state,
          token: newToken
        }));
      }
    };
  },

  /**
   * Creates authentication persistence handlers for localStorage/sessionStorage
   * @param storage Storage mechanism ('localStorage' | 'sessionStorage')
   * @param storageKey Key for storing auth state
   * @returns Persistence handlers
   */
  createPersistenceHandlers(
    storage: 'localStorage' | 'sessionStorage' = 'sessionStorage',
    storageKey: string = 'df_auth_state'
  ) {
    const storageObj = storage === 'localStorage' ? localStorage : sessionStorage;

    return {
      /**
       * Saves authentication state to storage
       */
      saveAuthState: (state: { user: any; token: string | null; isAuthenticated: boolean }) => {
        try {
          storageObj.setItem(storageKey, JSON.stringify(state));
          return true;
        } catch {
          return false;
        }
      },

      /**
       * Loads authentication state from storage
       */
      loadAuthState: (): { user: any; token: string | null; isAuthenticated: boolean } | null => {
        try {
          const stored = storageObj.getItem(storageKey);
          return stored ? JSON.parse(stored) : null;
        } catch {
          return null;
        }
      },

      /**
       * Clears authentication state from storage
       */
      clearAuthState: () => {
        try {
          storageObj.removeItem(storageKey);
          return true;
        } catch {
          return false;
        }
      }
    };
  },

  /**
   * Creates authentication state validator
   * @param queryClient React Query client for cache validation
   * @returns State validation functions
   */
  createStateValidator(queryClient: QueryClient) {
    return {
      /**
       * Validates authentication state consistency
       */
      validateAuthState: async (state: { user: any; token: string | null; isAuthenticated: boolean }) => {
        if (!state.isAuthenticated) {
          return { isValid: true, reason: 'Not authenticated' };
        }

        if (!state.token) {
          return { isValid: false, reason: 'Missing token' };
        }

        if (!state.user) {
          return { isValid: false, reason: 'Missing user data' };
        }

        // Check token validity
        if (tokenUtils.isTokenExpired(state.token)) {
          return { isValid: false, reason: 'Token expired' };
        }

        return { isValid: true, reason: 'Valid' };
      },

      /**
       * Synchronizes Zustand state with React Query cache
       */
      syncWithCache: async (state: { user: any; token: string | null }) => {
        if (state.user) {
          sessionUtils.updateUserCache(queryClient, state.user.id, state.user);
        }
      },

      /**
       * Validates and repairs authentication state
       */
      repairAuthState: async (
        currentState: { user: any; token: string | null; isAuthenticated: boolean },
        setStateFn: (state: any) => void
      ) => {
        const validation = await this.validateAuthState(currentState);
        
        if (!validation.isValid) {
          // Clear invalid state
          setStateFn({
            user: null,
            token: null,
            isAuthenticated: false
          });
          
          // Clear related caches
          await sessionUtils.invalidateAuthCache(queryClient);
          
          return false;
        }

        return true;
      }
    };
  }
};

/**
 * General utility functions for authentication workflows
 */
export const authUtils = {
  /**
   * Generates a secure random string for CSRF tokens
   * @param length Length of random string (default: 32)
   * @returns Random string
   */
  generateSecureRandom(length: number = 32): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += characters[array[i] % characters.length];
      }
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < length; i++) {
        result += characters[Math.floor(Math.random() * characters.length)];
      }
    }
    
    return result;
  },

  /**
   * Safely parses JSON with error handling
   * @param jsonString JSON string to parse
   * @param defaultValue Default value if parsing fails
   * @returns Parsed object or default value
   */
  safeJsonParse<T>(jsonString: string, defaultValue: T): T {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  },

  /**
   * Creates a timeout promise for race conditions
   * @param ms Timeout in milliseconds
   * @param errorMessage Error message for timeout
   * @returns Promise that rejects after timeout
   */
  createTimeout(ms: number, errorMessage: string = 'Operation timed out'): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), ms);
    });
  },

  /**
   * Retries an async operation with exponential backoff
   * @param operation Async operation to retry
   * @param maxRetries Maximum number of retries
   * @param baseDelay Base delay in milliseconds
   * @returns Promise with result or final error
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
};