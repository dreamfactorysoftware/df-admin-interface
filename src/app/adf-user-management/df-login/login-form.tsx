'use client';

/**
 * LoginForm Component
 * 
 * React login form component implementing authentication functionality with React Hook Form,
 * Zod validation, and Tailwind CSS styling. Provides email/username authentication, LDAP
 * service selection, password validation, and theme support. Replaces the Angular
 * df-login.component.ts/.html implementation with modern React patterns including error
 * boundaries, loading states, and Next.js integration.
 * 
 * Key Features:
 * - React Hook Form 7.52+ with Zod schema validation for real-time validation under 100ms
 * - Tailwind CSS 4.1+ styling with consistent theme injection
 * - Next.js middleware authentication integration
 * - TypeScript 5.8+ static typing for React 19 compatibility
 * - Comprehensive error handling with React Error Boundaries
 * - LDAP service selection with dynamic form validation
 * - OAuth and SAML service integration
 * - Responsive design with dark/light theme support
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @component LoginForm
 * @version 1.0.0
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { ErrorBoundary } from 'react-error-boundary';

// Internal imports
import { 
  LoginCredentials,
  LoginCredentialsSchema,
  type LDAPService,
  type OAuthProvider,
  type AuthFormState,
  type AuthAlert
} from '../types';
import { 
  createLoginSchema,
  type ValidationConfig,
  type LoginFormData,
  defaultValidationConfig
} from '../validation';
import { 
  passwordUtils,
  tokenUtils,
  sessionUtils,
  formUtils
} from '../utils';

// Hook imports
import { useAuth } from '../../../hooks/useAuth';
import { useSystemConfig } from '../../../hooks/useSystemConfig';
import { useTheme } from '../../../hooks/useTheme';

// Component imports
import { Alert } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Card } from '../../../components/ui/card';

// Constants
const MINIMUM_PASSWORD_LENGTH = 16;
const VALIDATION_DEBOUNCE_MS = 300;
const AUTH_REDIRECT_TIMEOUT = 2000;

/**
 * Props interface for LoginForm component
 */
interface LoginFormProps {
  /** Optional redirect URL after successful login */
  redirectTo?: string;
  /** Optional className for styling customization */
  className?: string;
  /** Whether to show registration link */
  showRegisterLink?: boolean;
  /** Whether to show forgot password link */
  showForgotPasswordLink?: boolean;
  /** Optional callback for successful login */
  onLoginSuccess?: (user: any) => void;
  /** Optional callback for login error */
  onLoginError?: (error: Error) => void;
}

/**
 * Form data interface extending the validation schema
 */
interface LoginFormFields extends LoginFormData {
  rememberMe?: boolean;
}

/**
 * Error fallback component for login form error boundary
 */
const LoginErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({
  error,
  resetErrorBoundary
}) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <div className="p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Login Error
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred during login.'}
        </p>
        <Button onClick={resetErrorBoundary} variant="primary" size="sm">
          Try Again
        </Button>
      </div>
    </Card>
  </div>
);

/**
 * Main LoginForm component implementation
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  redirectTo = '/home',
  className = '',
  showRegisterLink = true,
  showForgotPasswordLink = true,
  onLoginSuccess,
  onLoginError
}) => {
  // Router for navigation
  const router = useRouter();

  // Custom hooks
  const { login, isLoading: isAuthLoading, error: authError } = useAuth();
  const { 
    data: systemConfig, 
    isLoading: isConfigLoading, 
    error: configError 
  } = useSystemConfig();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  // Component state
  const [formState, setFormState] = useState<AuthFormState>({
    isSubmitting: false,
    error: null,
    success: null,
    isComplete: false
  });
  const [alert, setAlert] = useState<AuthAlert | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: 'weak' as const });

  // Extract system configuration
  const {
    loginAttribute = 'email',
    adldap: ldapServices = [],
    oauth: oauthServices = [],
    saml: samlServices = []
  } = systemConfig?.authentication || {};

  // Create validation configuration
  const validationConfig: ValidationConfig = useMemo(() => ({
    loginAttribute: loginAttribute as 'email' | 'username',
    hasLdapServices: ldapServices.length > 0,
    hasOauthServices: oauthServices.length > 0,
    hasSamlServices: samlServices.length > 0,
    minimumPasswordLength: MINIMUM_PASSWORD_LENGTH
  }), [loginAttribute, ldapServices.length, oauthServices.length, samlServices.length]);

  // Create dynamic login schema
  const loginSchema = useMemo(
    () => createLoginSchema(validationConfig),
    [validationConfig]
  );

  // Initialize React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isValid, isDirty },
    reset
  } = useForm<LoginFormFields>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      username: '',
      password: '',
      services: '',
      rememberMe: false
    }
  });

  // Watch form values for dynamic validation
  const watchedServices = watch('services');
  const watchedPassword = watch('password');
  const watchedEmail = watch('email');
  const watchedUsername = watch('username');

  // Determine current login attribute based on service selection
  const currentLoginAttribute = useMemo(() => {
    return watchedServices && watchedServices !== '' ? 'username' : loginAttribute;
  }, [watchedServices, loginAttribute]);

  // Password strength monitoring
  useEffect(() => {
    if (watchedPassword) {
      const strength = passwordUtils.getPasswordStrengthIndicator(watchedPassword);
      setPasswordStrength(strength);
    }
  }, [watchedPassword]);

  // Clear errors when switching between email/username
  useEffect(() => {
    if (currentLoginAttribute === 'email') {
      clearErrors('username');
    } else {
      clearErrors('email');
    }
  }, [currentLoginAttribute, clearErrors]);

  // Handle service selection change
  const handleServiceChange = useCallback((value: string) => {
    setValue('services', value);
    // Clear previous login attribute when switching
    if (value && value !== '') {
      setValue('email', '');
      clearErrors('email');
    } else {
      setValue('username', '');
      clearErrors('username');
    }
  }, [setValue, clearErrors]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Handle alert dismissal
  const handleAlertDismiss = useCallback(() => {
    setAlert(null);
    setFormState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // Show alert with auto-dismiss
  const showAlert = useCallback((alertData: Omit<AuthAlert, 'dismissible'>) => {
    const alert: AuthAlert = {
      ...alertData,
      dismissible: true
    };
    setAlert(alert);

    if (alert.autoHide) {
      setTimeout(() => {
        setAlert(null);
      }, alert.autoHide);
    }
  }, []);

  // Handle form submission
  const onSubmit: SubmitHandler<LoginFormFields> = useCallback(async (data) => {
    if (formState.isSubmitting) return;

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));
    setAlert(null);

    try {
      // Check password strength for warnings
      const isPasswordTooShort = data.password.length < MINIMUM_PASSWORD_LENGTH;
      
      // Prepare login credentials
      const credentials: LoginCredentials = {
        password: data.password,
        rememberMe: data.rememberMe || false
      };

      // Set LDAP service if selected
      if (ldapServices.length && data.services !== '') {
        credentials.service = data.services;
      }

      // Set login attribute based on form state
      if (currentLoginAttribute === 'username') {
        credentials.username = data.username || data.email;
        credentials.email = data.username || data.email; // DreamFactory expects both
        credentials.loginAttribute = 'username';
      } else {
        credentials.email = data.email;
        credentials.loginAttribute = 'email';
      }

      // Perform login
      const result = await login(credentials);

      // Handle successful login
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: 'Login successful! Redirecting...',
        isComplete: true 
      }));

      showAlert({
        type: 'success',
        message: 'Login successful! Redirecting...',
        autoHide: AUTH_REDIRECT_TIMEOUT
      });

      // Show password strength warning if needed
      if (isPasswordTooShort) {
        showAlert({
          type: 'warning',
          title: 'Password Security Notice',
          message: `Your current password is shorter than recommended (less than ${MINIMUM_PASSWORD_LENGTH} characters). For better security, we recommend updating your password.`,
          autoHide: 5000
        });
      }

      // Call success callback
      onLoginSuccess?.(result);

      // Navigate after short delay
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMessage 
      }));

      // Handle specific error cases
      const isPasswordTooShort = data.password.length < MINIMUM_PASSWORD_LENGTH;
      if (error instanceof Error && error.message.includes('401') && isPasswordTooShort) {
        showAlert({
          type: 'error',
          title: 'Password Too Short',
          message: `It looks like your password is too short. Our new system requires at least ${MINIMUM_PASSWORD_LENGTH} characters. Please reset your password to continue.`
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Login Failed',
          message: errorMessage
        });
      }

      // Call error callback
      onLoginError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [
    formState.isSubmitting,
    currentLoginAttribute,
    ldapServices.length,
    login,
    onLoginSuccess,
    onLoginError,
    redirectTo,
    router,
    showAlert
  ]);

  // Handle OAuth/SAML service login
  const handleExternalServiceLogin = useCallback((service: OAuthProvider, type: 'oauth' | 'saml') => {
    const redirectUrl = `/api/v2/${service.path}`;
    window.location.href = redirectUrl;
  }, []);

  // Loading state
  if (isConfigLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-700 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Configuration Error
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Unable to load system configuration. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="primary">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={LoginErrorFallback}
      onError={(error) => {
        console.error('LoginForm Error Boundary:', error);
        onLoginError?.(error);
      }}
    >
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${className}`}>
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Left Panel - Logo */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <Image
                  src="/assets/img/logo.png"
                  alt="DreamFactory Logo"
                  width={300}
                  height={120}
                  className="mx-auto dark:brightness-110"
                  priority
                />
              </div>

              {/* Theme Toggle */}
              <div className="flex justify-center mb-6">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="text-gray-600 dark:text-gray-400"
                  aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                >
                  {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? 'Light' : 'Dark'} Mode
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <Card className="w-full max-w-md">
              <div className="p-8">
                {/* Alert Display */}
                {alert && (
                  <div className="mb-6">
                    <Alert
                      type={alert.type}
                      title={alert.title}
                      dismissible={alert.dismissible}
                      onDismiss={handleAlertDismiss}
                    >
                      {alert.message}
                    </Alert>
                  </div>
                )}

                {/* Form Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Sign In
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Welcome back! Please sign in to continue.
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* LDAP Service Selection */}
                  {ldapServices.length > 0 && (
                    <div>
                      <label htmlFor="services" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                        Service
                      </label>
                      <Select
                        id="services"
                        {...register('services')}
                        onChange={handleServiceChange}
                        error={errors.services?.message}
                        placeholder="Select a service (optional)"
                      >
                        <option value="">Default</option>
                        {ldapServices.map((service) => (
                          <option key={service.id} value={service.name}>
                            {service.label || service.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {/* Email Field */}
                  {currentLoginAttribute === 'email' && (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <EnvelopeIcon className="inline h-4 w-4 mr-1" />
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        error={errors.email?.message}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    </div>
                  )}

                  {/* Username Field */}
                  {currentLoginAttribute === 'username' && (
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <UserIcon className="inline h-4 w-4 mr-1" />
                        Username
                      </label>
                      <Input
                        id="username"
                        type="text"
                        {...register('username')}
                        error={errors.username?.message}
                        placeholder="Enter your username"
                        autoComplete="username"
                        aria-describedby={errors.username ? 'username-error' : undefined}
                      />
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <LockClosedIcon className="inline h-4 w-4 mr-1" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        error={errors.password?.message}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        aria-describedby={errors.password ? 'password-error' : 'password-strength'}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {watchedPassword && (
                      <div className="mt-2" id="password-strength">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-200 ${passwordStrength.bgColor}`}
                              style={{ width: passwordStrength.width }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      {...register('rememberMe')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Remember me
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    disabled={formState.isSubmitting || !isValid}
                    loading={formState.isSubmitting}
                  >
                    {formState.isSubmitting ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>

                {/* OAuth Services */}
                {oauthServices.length > 0 && (
                  <div className="mt-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3">
                      {oauthServices.map((service) => (
                        <Button
                          key={service.id}
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleExternalServiceLogin(service, 'oauth')}
                        >
                          {service.label || service.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SAML Services */}
                {samlServices.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Enterprise Login
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {samlServices.map((service) => (
                        <Button
                          key={service.id}
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleExternalServiceLogin(service, 'saml')}
                        >
                          {service.label || service.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Links */}
                <div className="mt-8 flex flex-col space-y-3 text-center">
                  {showForgotPasswordLink && (
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Forgot your password?
                    </Link>
                  )}
                  
                  {showRegisterLink && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don't have an account?{' '}
                      <Link
                        href="/auth/register"
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        Sign up
                      </Link>
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Default export
export default LoginForm;

// Named exports for flexibility
export type { LoginFormProps, LoginFormFields };
export { LoginErrorFallback };