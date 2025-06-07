'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { useDebounce } from '@/hooks/use-debounce';
import type { LoginCredentials, AuthError } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Login form validation schema with dynamic email/username validation
 * Supports real-time validation under 100ms performance requirement
 */
const createLoginSchema = (loginAttribute: 'email' | 'username', hasServices: boolean) => {
  const baseSchema = z.object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional().default(false),
    service: hasServices ? z.string().optional() : z.string().optional(),
  });

  if (loginAttribute === 'email') {
    return baseSchema.extend({
      email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
      username: z.string().optional(),
    });
  } else {
    return baseSchema.extend({
      username: z
        .string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters'),
      email: z.string().optional(),
    });
  }
};

// SAML JWT validation schema for query parameters
const samlJwtSchema = z.object({
  jwt: z.string().optional(),
  saml_response: z.string().optional(),
  RelayState: z.string().optional(),
});

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface LoginFormData {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
  service?: string;
}

interface AuthServiceConfig {
  name: string;
  label: string;
  type: 'ldap' | 'oauth' | 'saml';
  enabled: boolean;
}

interface SystemAuthConfig {
  loginAttribute: 'email' | 'username';
  allowRegistration: boolean;
  allowPasswordReset: boolean;
  adldap: AuthServiceConfig[];
  oauth: AuthServiceConfig[];
  saml: AuthServiceConfig[];
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Next.js App Router Login Page Component
 * 
 * Implements React Hook Form with Zod validation for user authentication.
 * Handles both standard credentials and SAML JWT token authentication from
 * query parameters, integrating with Next.js middleware for enhanced security
 * through server-side validation and automatic token refresh capabilities.
 * 
 * Features:
 * - React Hook Form with Zod schema validators
 * - Real-time validation under 100ms performance
 * - SAML JWT query parameter handling with Next.js useSearchParams
 * - Next.js middleware-based session management
 * - Tailwind CSS 4.1+ responsive design with DreamFactory branding
 * - MSW integration for development environment API mocking
 * - Server-side rendering support with initial page loads under 2 seconds
 */
export default function LoginPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { showNotification } = useNotifications();
  
  // Authentication hooks
  const {
    isAuthenticated,
    isLoading: authLoading,
    error: authError,
    login,
    loginWithToken,
    clearError,
  } = useAuth({
    redirectIfUnauthenticated: false,
    enableAutoRefresh: true,
  });

  // System configuration for authentication options
  const {
    data: systemConfig,
    isLoading: configLoading,
    error: configError,
  } = useSystemConfig();

  // =============================================================================
  // STATE MANAGEMENT
  // =============================================================================

  const [showPassword, setShowPassword] = useState(false);
  const [authAlert, setAuthAlert] = useState<{ type: 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [isProcessingSaml, setIsProcessingSaml] = useState(false);
  const [loginAttribute, setLoginAttribute] = useState<'email' | 'username'>('email');
  const [availableServices, setAvailableServices] = useState<AuthServiceConfig[]>([]);

  // Debounced form validation for performance optimization
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const debouncedValidation = useDebounce(validationErrors, 100);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  // Extract authentication configuration from system config
  const authConfig = useMemo((): SystemAuthConfig => {
    const defaultConfig: SystemAuthConfig = {
      loginAttribute: 'email',
      allowRegistration: false,
      allowPasswordReset: true,
      adldap: [],
      oauth: [],
      saml: [],
    };

    if (!systemConfig?.authentication) return defaultConfig;

    return {
      loginAttribute: systemConfig.authentication.loginAttribute || 'email',
      allowRegistration: systemConfig.authentication.allowRegistration || false,
      allowPasswordReset: systemConfig.authentication.allowPasswordReset || true,
      adldap: systemConfig.authentication.adldap || [],
      oauth: systemConfig.authentication.oauth || [],
      saml: systemConfig.authentication.saml || [],
    };
  }, [systemConfig]);

  // Determine if external services are available
  const hasExternalServices = useMemo(() => {
    return availableServices.length > 0;
  }, [availableServices]);

  // Create dynamic validation schema
  const loginSchema = useMemo(() => {
    return createLoginSchema(loginAttribute, hasExternalServices);
  }, [loginAttribute, hasExternalServices]);

  // =============================================================================
  // FORM SETUP
  // =============================================================================

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      rememberMe: false,
      service: '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form;

  // Watch form values for dynamic validation
  const watchedService = watch('service');
  const watchedPassword = watch('password');

  // =============================================================================
  // EFFECTS AND INITIALIZATION
  // =============================================================================

  // Initialize authentication configuration when system config loads
  useEffect(() => {
    if (authConfig) {
      setLoginAttribute(authConfig.loginAttribute);
      
      // Combine all available services
      const allServices = [
        ...authConfig.adldap,
        ...authConfig.oauth,
        ...authConfig.saml,
      ].filter(service => service.enabled);
      
      setAvailableServices(allServices);
    }
  }, [authConfig]);

  // Handle dynamic login attribute switching based on service selection
  useEffect(() => {
    if (watchedService && watchedService !== '') {
      // When service is selected, use username
      setLoginAttribute('username');
    } else {
      // When no service, use system default
      setLoginAttribute(authConfig.loginAttribute);
    }
  }, [watchedService, authConfig.loginAttribute]);

  // Handle SAML JWT token from query parameters
  useEffect(() => {
    const handleSamlLogin = async () => {
      try {
        const queryParams = Object.fromEntries(searchParams.entries());
        const samlParams = samlJwtSchema.parse(queryParams);

        if (samlParams.jwt && !isProcessingSaml) {
          setIsProcessingSaml(true);
          setAuthAlert({
            type: 'info',
            message: 'Processing SAML authentication...',
          });

          try {
            await loginWithToken(samlParams.jwt);
            
            // Clear query parameters after successful login
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('jwt');
            newUrl.searchParams.delete('saml_response');
            newUrl.searchParams.delete('RelayState');
            window.history.replaceState({}, '', newUrl.toString());
            
            showNotification({
              type: 'success',
              title: 'Login Successful',
              message: 'You have been successfully authenticated via SAML.',
            });

            // Navigate to dashboard
            router.push('/');
          } catch (error) {
            console.error('SAML login failed:', error);
            setAuthAlert({
              type: 'error',
              message: 'SAML authentication failed. Please try logging in manually.',
            });
            
            // Clear invalid query parameters
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('jwt');
            newUrl.searchParams.delete('saml_response');
            newUrl.searchParams.delete('RelayState');
            window.history.replaceState({}, '', newUrl.toString());
          } finally {
            setIsProcessingSaml(false);
          }
        }
      } catch (error) {
        // Invalid query parameters, ignore silently
        console.debug('No valid SAML parameters found in URL');
      }
    };

    handleSamlLogin();
  }, [searchParams, loginWithToken, router, showNotification, isProcessingSaml]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading && !isProcessingSaml) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router, isProcessingSaml]);

  // Handle authentication errors
  useEffect(() => {
    if (authError) {
      const errorMessage = getErrorMessage(authError);
      setAuthAlert({
        type: 'error',
        message: errorMessage,
      });

      // Handle specific error types
      if (authError.code === 'VALIDATION_ERROR') {
        // Focus on first invalid field
        const firstErrorField = Object.keys(errors)[0];
        if (firstErrorField) {
          const fieldElement = document.getElementById(firstErrorField);
          fieldElement?.focus();
        }
      }
    }
  }, [authError, errors]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Handles form submission with comprehensive validation and error handling
   */
  const onSubmit = useCallback(async (data: LoginFormData): Promise<void> => {
    try {
      // Clear previous alerts
      setAuthAlert(null);
      clearError();

      // Prepare login credentials based on current login attribute
      const credentials: LoginCredentials = {
        password: data.password,
        rememberMe: data.rememberMe,
      };

      // Add service if selected
      if (data.service && availableServices.length > 0) {
        credentials.service = data.service;
      }

      // Add appropriate login identifier
      if (loginAttribute === 'email') {
        credentials.email = data.email;
      } else {
        credentials.username = data.username;
        // For backward compatibility, also set email to username
        credentials.email = data.username;
      }

      // Validate password length for security warning
      const isPasswordShort = data.password.length < 16;
      
      await login(credentials);

      // Show password security warning if applicable
      if (isPasswordShort) {
        showNotification({
          type: 'warning',
          title: 'Password Recommendation',
          message: `Your password is shorter than recommended (less than 16 characters). For better security, consider updating to a longer password.`,
          duration: 8000,
        });
      }

      showNotification({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome to DreamFactory Admin Interface!',
      });

      // Navigation is handled by the useAuth hook and middleware
      
    } catch (error) {
      console.error('Login failed:', error);
      
      // Handle specific error scenarios
      if (error instanceof Error) {
        if (error.message.includes('password') && data.password.length < 16) {
          setAuthAlert({
            type: 'warning',
            message: `It looks like your password is too short. Our system requires at least 16 characters for enhanced security. Please reset your password to continue.`,
          });
        } else {
          setAuthAlert({
            type: 'error',
            message: error.message || 'Login failed. Please check your credentials and try again.',
          });
        }
      }
    }
  }, [login, clearError, loginAttribute, availableServices, showNotification]);

  /**
   * Toggles password visibility with accessibility support
   */
  const togglePasswordVisibility = useCallback((): void => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Handles service selection change
   */
  const handleServiceChange = useCallback((serviceValue: string): void => {
    setValue('service', serviceValue);
    
    // Reset username/email when service changes
    if (serviceValue) {
      setValue('email', '');
      setValue('username', '');
    }
  }, [setValue]);

  /**
   * Clears authentication alert
   */
  const dismissAlert = useCallback((): void => {
    setAuthAlert(null);
    clearError();
  }, [clearError]);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Converts authentication error to user-friendly message
   */
  function getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'Invalid email/username or password. Please check your credentials and try again.';
      case 'TOKEN_EXPIRED':
        return 'Your session has expired. Please log in again.';
      case 'TOKEN_INVALID':
        return 'Invalid authentication token. Please log in again.';
      case 'UNAUTHORIZED':
        return 'Authentication required. Please log in to continue.';
      case 'FORBIDDEN':
        return 'Access denied. You do not have permission to access this resource.';
      case 'NETWORK_ERROR':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'VALIDATION_ERROR':
        return error.message || 'Please correct the highlighted fields and try again.';
      case 'SERVER_ERROR':
        return 'Server error occurred. Please try again later or contact support if the problem persists.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // =============================================================================
  // LOADING STATES
  // =============================================================================

  // Show loading spinner while configuration loads
  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading authentication configuration...</p>
        </div>
      </div>
    );
  }

  // Handle configuration error
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Unable to load authentication configuration. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 items-center justify-center p-8">
        <div className="text-center text-white space-y-6 max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-4">
              <SparklesIcon className="w-10 h-10 text-primary-600" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold">DreamFactory</h1>
              <p className="text-primary-200 text-sm">Admin Interface</p>
            </div>
          </div>
          
          {/* Welcome Message */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">
              Generate APIs in
              <span className="block text-yellow-300">Under 5 Minutes</span>
            </h2>
            <p className="text-primary-100 text-lg leading-relaxed">
              Connect to any database and instantly create comprehensive REST APIs with 
              enterprise-grade security, documentation, and monitoring.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span className="text-primary-100">Database-driven API generation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span className="text-primary-100">Automatic OpenAPI documentation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
              <span className="text-primary-100">Role-based access control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-4">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mr-3">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">DreamFactory</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Admin Interface</p>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Sign in to your DreamFactory admin account
            </CardDescription>
          </CardHeader>

          <Separator className="mb-6" />

          <CardContent className="space-y-6">
            {/* Authentication Alert */}
            {authAlert && (
              <Alert 
                variant={authAlert.type === 'error' ? 'destructive' : 'default'}
                className={`animate-fade-in ${
                  authAlert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                  authAlert.type === 'info' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : ''
                }`}
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {authAlert.message}
                </AlertDescription>
                <button
                  onClick={dismissAlert}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Dismiss alert"
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </Alert>
            )}

            {/* Login Form */}
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Service Selection (LDAP/OAuth/SAML) */}
                {hasExternalServices && (
                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                          Authentication Service
                        </FormLabel>
                        <Select 
                          onValueChange={handleServiceChange} 
                          value={field.value}
                          disabled={authLoading || isSubmitting}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500">
                              <SelectValue placeholder="Select service (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Default Authentication</SelectItem>
                            {availableServices.map((service) => (
                              <SelectItem key={service.name} value={service.name}>
                                {service.label} ({service.type.toUpperCase()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-600 dark:text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Email Field */}
                {loginAttribute === 'email' && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Enter your email address"
                            className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                            disabled={authLoading || isSubmitting}
                            autoComplete="email"
                            autoFocus={!hasExternalServices}
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 dark:text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Username Field */}
                {loginAttribute === 'username' && (
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            placeholder="Enter your username"
                            className="h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                            disabled={authLoading || isSubmitting}
                            autoComplete="username"
                            autoFocus={!hasExternalServices}
                          />
                        </FormControl>
                        <FormMessage className="text-red-600 dark:text-red-400 text-sm" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-200 font-medium">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            className="h-11 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500"
                            disabled={authLoading || isSubmitting}
                            autoComplete="current-password"
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            disabled={authLoading || isSubmitting}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="w-5 h-5" />
                            ) : (
                              <EyeIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-600 dark:text-red-400 text-sm" />
                      {watchedPassword && watchedPassword.length > 0 && watchedPassword.length < 16 && (
                        <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                          For enhanced security, consider using a password with at least 16 characters.
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Remember Me */}
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={authLoading || isSubmitting}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </FormControl>
                      <FormLabel className="text-sm text-gray-600 dark:text-gray-300 font-normal cursor-pointer">
                        Remember me for 30 days
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={authLoading || isSubmitting || isProcessingSaml || !isValid}
                  className="w-full h-11 bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 text-white font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(authLoading || isSubmitting || isProcessingSaml) ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isProcessingSaml ? 'Processing SAML...' : 'Signing In...'}
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            {/* Forgot Password Link */}
            {authConfig.allowPasswordReset && (
              <div className="text-center">
                <button
                  onClick={() => router.push('/forgot-password')}
                  disabled={authLoading || isSubmitting}
                  className="text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Registration Link */}
            {authConfig.allowRegistration && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Don't have an account?{' '}
                  <button
                    onClick={() => router.push('/register')}
                    disabled={authLoading || isSubmitting}
                    className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200 disabled:opacity-50"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}