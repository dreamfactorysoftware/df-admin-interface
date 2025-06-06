'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Internal imports
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { 
  LoginCredentials, 
  AuthError, 
  AuthErrorCode 
} from '@/types/auth';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Authentication validation constants aligned with security requirements
 */
const VALIDATION_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 16, // Enhanced security requirement from specification
  PASSWORD_MAX_LENGTH: 255,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  VALIDATION_DEBOUNCE_MS: 100, // Real-time validation under 100ms requirement
} as const;

/**
 * WCAG 2.1 AA compliant error messages with clear instructions
 */
const ERROR_MESSAGES = {
  EMAIL_REQUIRED: 'Email address is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: `Username must be at least ${VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH} characters`,
  USERNAME_TOO_LONG: `Username must be less than ${VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH} characters`,
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH} characters for security`,
  LOGIN_FIELD_REQUIRED: 'Either email or username is required',
  AUTHENTICATION_FAILED: 'Invalid credentials. Please check your email/username and password.',
  SERVICE_SELECTION_REQUIRED: 'Please select an LDAP service',
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection and try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
} as const;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Dynamic login form schema with conditional validation
 * Supports both email and username authentication based on system configuration
 */
const createLoginSchema = (loginAttribute: 'email' | 'username', hasLdapServices: boolean) => {
  const baseSchema = z.object({
    email: loginAttribute === 'email' 
      ? z.string()
          .min(1, ERROR_MESSAGES.EMAIL_REQUIRED)
          .email(ERROR_MESSAGES.EMAIL_INVALID)
      : z.string().optional(),
    username: loginAttribute === 'username'
      ? z.string()
          .min(VALIDATION_CONSTANTS.USERNAME_MIN_LENGTH, ERROR_MESSAGES.USERNAME_TOO_SHORT)
          .max(VALIDATION_CONSTANTS.USERNAME_MAX_LENGTH, ERROR_MESSAGES.USERNAME_TOO_LONG)
      : z.string().optional(),
    password: z.string()
      .min(1, ERROR_MESSAGES.PASSWORD_REQUIRED)
      .min(VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH, ERROR_MESSAGES.PASSWORD_TOO_SHORT),
    service: hasLdapServices 
      ? z.string().optional()
      : z.string().optional(),
    rememberMe: z.boolean().optional(),
  });

  // Add conditional validation for either email or username when both are optional
  if (loginAttribute === 'email') {
    return baseSchema;
  } else {
    return baseSchema.refine(
      (data) => data.email || data.username,
      {
        message: ERROR_MESSAGES.LOGIN_FIELD_REQUIRED,
        path: ['email'],
      }
    );
  }
};

// =============================================================================
// INTERFACES
// =============================================================================

interface LoginFormData {
  email?: string;
  username?: string;
  password: string;
  service?: string;
  rememberMe?: boolean;
}

interface AuthServiceDisplayData {
  name: string;
  label: string;
  type: 'oauth' | 'saml';
  iconClass?: string;
  path: string;
}

interface LdapService {
  name: string;
  label: string;
  type: 'ldap';
}

// =============================================================================
// COMPONENT IMPLEMENTATION
// =============================================================================

/**
 * LoginForm Component
 * 
 * Comprehensive authentication form supporting multiple login methods:
 * - Email/username credentials with dynamic field switching
 * - LDAP service selection for enterprise authentication
 * - OAuth/SAML external authentication providers
 * - Real-time validation with performance under 100ms
 * - WCAG 2.1 AA compliant accessibility features
 * - Dark mode support with theme context integration
 * 
 * @returns {JSX.Element} Login form component
 */
export function LoginForm(): JSX.Element {
  // =============================================================================
  // HOOKS AND STATE MANAGEMENT
  // =============================================================================

  const router = useRouter();
  const { 
    login, 
    isLoading: authLoading, 
    error: authError, 
    clearError 
  } = useAuth();
  
  const { 
    environment, 
    isLoading: configLoading,
    error: configError
  } = useSystemConfig();

  // Local component state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentLoginAttribute, setCurrentLoginAttribute] = useState<'email' | 'username'>('email');

  // =============================================================================
  // DERIVED STATE AND MEMOIZED VALUES
  // =============================================================================

  /**
   * Extract authentication configuration from system environment
   */
  const authConfig = useMemo(() => {
    if (!environment) {
      return {
        loginAttribute: 'email' as const,
        ldapServices: [] as LdapService[],
        oauthServices: [] as AuthServiceDisplayData[],
        samlServices: [] as AuthServiceDisplayData[],
      };
    }

    return {
      loginAttribute: (environment.authentication?.loginAttribute || 'email') as 'email' | 'username',
      ldapServices: environment.authentication?.adldap || [],
      oauthServices: (environment.authentication?.oauth || []).map(service => ({
        ...service,
        type: 'oauth' as const,
      })),
      samlServices: (environment.authentication?.saml || []).map(service => ({
        ...service,
        type: 'saml' as const,
      })),
    };
  }, [environment]);

  /**
   * Dynamic validation schema based on current form state
   */
  const validationSchema = useMemo(() => {
    return createLoginSchema(currentLoginAttribute, authConfig.ldapServices.length > 0);
  }, [currentLoginAttribute, authConfig.ldapServices.length]);

  // =============================================================================
  // FORM SETUP WITH REACT HOOK FORM
  // =============================================================================

  const {
    register,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      email: '',
      username: '',
      password: '',
      service: '',
      rememberMe: false,
    },
  });

  // Watch service selection to update login attribute
  const selectedService = watch('service');

  // =============================================================================
  // EFFECTS AND EVENT HANDLERS
  // =============================================================================

  /**
   * Update login attribute based on system configuration and service selection
   */
  useEffect(() => {
    if (selectedService && authConfig.ldapServices.length > 0) {
      // When LDAP service is selected, switch to username
      setCurrentLoginAttribute('username');
    } else {
      // Use system default login attribute
      setCurrentLoginAttribute(authConfig.loginAttribute);
    }
  }, [selectedService, authConfig.loginAttribute, authConfig.ldapServices.length]);

  /**
   * Clear authentication errors when form data changes
   */
  useEffect(() => {
    if (authError && isDirty) {
      clearError();
    }
  }, [isDirty, authError, clearError]);

  /**
   * Handle form submission with comprehensive error handling
   */
  const onSubmit = useCallback(async (data: LoginFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    clearError();

    try {
      // Build credentials object based on current login attribute
      const credentials: LoginCredentials = {
        password: data.password,
        rememberMe: data.rememberMe,
      };

      // Add service if LDAP is selected
      if (selectedService && authConfig.ldapServices.length > 0) {
        credentials.service = selectedService;
      }

      // Set username or email based on current login attribute
      if (currentLoginAttribute === 'username') {
        credentials.username = data.username || data.email;
        credentials.email = data.username || data.email; // Some APIs expect both
      } else {
        credentials.email = data.email;
      }

      // Perform authentication
      await login(credentials);

      // Success - navigation will be handled by useAuth hook
      router.push('/');
      
    } catch (error) {
      // Error handling is managed by useAuth hook
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedService, authConfig.ldapServices.length, currentLoginAttribute, login, clearError, router]);

  /**
   * Handle OAuth/SAML authentication
   */
  const handleExternalAuth = useCallback((service: AuthServiceDisplayData) => {
    // Redirect to DreamFactory's OAuth/SAML endpoint
    // This follows the original Angular implementation pattern
    const authUrl = `/api/v2/${service.path}`;
    window.location.href = authUrl;
  }, []);

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Format error messages for user display
   */
  const getDisplayError = useCallback((error: AuthError | null): string => {
    if (!error) return '';

    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return ERROR_MESSAGES.AUTHENTICATION_FAILED;
      case 'NETWORK_ERROR':
        return ERROR_MESSAGES.NETWORK_ERROR;
      case 'SERVER_ERROR':
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return error.message || ERROR_MESSAGES.SERVER_ERROR;
    }
  }, []);

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading authentication configuration...
          </p>
        </div>
      </div>
    );
  }

  // =============================================================================
  // ERROR STATE
  // =============================================================================

  if (configError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuration Error
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Unable to load authentication settings. Please try refreshing the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  const isLoading = authLoading || isSubmitting;
  const hasError = !!authError;
  const displayError = getDisplayError(authError);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Authentication Error Alert */}
      {hasError && (
        <div 
          className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Authentication Failed
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {displayError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* LDAP Service Selection */}
        {authConfig.ldapServices.length > 0 && (
          <div className="space-y-2">
            <label 
              htmlFor="service"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              LDAP Service
            </label>
            <select
              id="service"
              {...register('service')}
              className={cn(
                'block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300',
                'placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600',
                'dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 dark:placeholder:text-gray-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                errors.service && 'ring-red-500 focus:ring-red-500'
              )}
              disabled={isLoading}
              aria-describedby={errors.service ? 'service-error' : undefined}
            >
              <option value="">Select LDAP Service</option>
              {authConfig.ldapServices.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.label || service.name}
                </option>
              ))}
            </select>
            {errors.service && (
              <p id="service-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.service.message}
              </p>
            )}
          </div>
        )}

        {/* Email Field (when email login is active) */}
        {currentLoginAttribute === 'email' && (
          <div className="space-y-2">
            <label 
              htmlFor="email"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={cn(
                  'pl-10',
                  errors.email && 'ring-red-500 focus:ring-red-500'
                )}
                placeholder="Enter your email address"
                disabled={isLoading}
                error={!!errors.email}
                errorMessage={errors.email?.message}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
          </div>
        )}

        {/* Username Field (when username login is active) */}
        {currentLoginAttribute === 'username' && (
          <div className="space-y-2">
            <label 
              htmlFor="username"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                {...register('username')}
                className={cn(
                  'pl-10',
                  errors.username && 'ring-red-500 focus:ring-red-500'
                )}
                placeholder="Enter your username"
                disabled={isLoading}
                error={!!errors.username}
                errorMessage={errors.username?.message}
                aria-describedby={errors.username ? 'username-error' : undefined}
              />
            </div>
          </div>
        )}

        {/* Password Field */}
        <div className="space-y-2">
          <label 
            htmlFor="password"
            className="block text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={cn(
                'pl-10 pr-10',
                errors.password && 'ring-red-500 focus:ring-red-500'
              )}
              placeholder="Enter your password"
              disabled={isLoading}
              error={!!errors.password}
              errorMessage={errors.password?.message}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            {...register('rememberMe')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
            Remember me
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !isValid}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <a
            href="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Forgot your password?
          </a>
        </div>
      </form>

      {/* OAuth Authentication Services */}
      {authConfig.oauthServices.length > 0 && (
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with OAuth
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {authConfig.oauthServices.map((service) => (
              <Button
                key={service.name}
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleExternalAuth(service)}
                disabled={isLoading}
                className="w-full"
              >
                {service.label || service.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* SAML Authentication Services */}
      {authConfig.samlServices.length > 0 && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with SAML
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {authConfig.samlServices.map((service) => (
              <Button
                key={service.name}
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleExternalAuth(service)}
                disabled={isLoading}
                className="w-full"
              >
                {service.label || service.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;