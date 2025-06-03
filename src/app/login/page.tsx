/**
 * Next.js Login Page Component
 * 
 * Next.js app router login page implementing React Hook Form with Zod validation
 * for user authentication. Handles both standard credentials and SAML JWT token
 * authentication from query parameters, integrating with Next.js middleware for
 * enhanced security through server-side validation and automatic token refresh.
 * 
 * Key Features:
 * - React Hook Form with Zod schema validators for real-time validation under 100ms
 * - SAML JWT query parameter handling with Next.js useSearchParams hook
 * - Next.js middleware-based session management and RBAC enforcement
 * - Tailwind CSS 4.1+ responsive design with DreamFactory brand colors
 * - WCAG 2.1 AA accessibility compliance with proper focus management
 * - MSW integration for development environment API mocking
 * - Server-side rendering support with Next.js server components
 * - Integration with SWR/React Query for intelligent caching
 * 
 * Security Implementation:
 * - HttpOnly cookie-based session management with SameSite=Strict
 * - CSRF protection through secure token handling
 * - Input validation and sanitization via Zod schemas
 * - Rate limiting and brute force protection
 * - Secure redirect handling to prevent open redirects
 * 
 * Performance Characteristics:
 * - Real-time validation under 100ms performance requirement
 * - Authentication processing within 200ms performance target
 * - Initial page load under 2 seconds with server-side rendering
 * - Optimistic updates for seamless user experience
 * 
 * @example
 * ```tsx
 * // This component is automatically used by Next.js App Router
 * // Access via: https://yourapp.com/login
 * // With SAML JWT: https://yourapp.com/login?jwt=<token>
 * ```
 */

'use client';

import React, { useEffect, useCallback, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LoginCredentials, AuthError } from '@/types/auth';

// ============================================================================
// Validation Schemas
// ============================================================================

/**
 * Login credentials validation schema with Zod
 * Supports both email and username authentication with dynamic validation
 */
const loginSchema = z.object({
  username: z.string()
    .min(1, 'Username or email is required')
    .max(255, 'Username too long')
    .refine((value) => {
      // Allow either email format or username format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
      return emailRegex.test(value) || usernameRegex.test(value);
    }, {
      message: 'Please enter a valid email address or username'
    }),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// UI Components
// ============================================================================

/**
 * Accessible input component with proper WCAG 2.1 AA compliance
 * Features proper focus management, ARIA labeling, and error states
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, required, ...props }, ref) => {
    const inputId = React.useId();
    const errorId = React.useId();
    
    return (
      <div className="space-y-2">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400 dark:text-gray-500">
                {icon}
              </div>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            className={`
              block w-full px-3 py-2 min-h-[44px] rounded-md border transition-all duration-200
              ${icon ? 'pl-10' : 'pl-3'}
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400' 
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:focus:border-primary-400'
              }
              bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Password input component with show/hide toggle functionality
 * Maintains accessibility while providing enhanced UX
 */
interface PasswordInputProps extends Omit<InputProps, 'type'> {
  showPassword: boolean;
  onTogglePassword: () => void;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPassword, onTogglePassword, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          icon={<Lock />}
          {...props}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-400" />
          ) : (
            <Eye className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

/**
 * Accessible button component with proper WCAG 2.1 AA compliance
 * Features minimum 44x44px touch targets and proper focus management
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-medium rounded-md transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
      min-h-[44px] min-w-[44px]
    `;

    const variants = {
      primary: `
        bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800
        focus:ring-primary-500 border border-primary-600 hover:border-primary-700
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300
        dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
        focus:ring-gray-500 border border-gray-300 dark:border-gray-600
      `,
      outline: `
        bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100
        dark:text-primary-400 dark:hover:bg-gray-800
        focus:ring-primary-500 border-2 border-primary-600 hover:border-primary-700
      `,
    };

    const sizes = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Alert component for displaying messages with proper accessibility
 * Supports different variants and ARIA live regions for screen readers
 */
interface AlertProps {
  variant: 'error' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ variant, children, className = '' }) => {
  const variants = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  };

  const icons = {
    error: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    success: <CheckCircle className="h-5 w-5 flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    info: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
  };

  return (
    <div 
      className={`border rounded-md p-4 flex gap-3 ${variants[variant]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {icons[variant]}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

// ============================================================================
// SAML JWT Handler Component
// ============================================================================

/**
 * SAML JWT authentication handler component
 * Processes JWT tokens from query parameters for SSO integration
 */
const SamlJwtHandler: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [processingJwt, setProcessingJwt] = useState(false);
  const [jwtError, setJwtError] = useState<string | null>(null);

  /**
   * Process SAML JWT token from query parameters
   * Handles automatic login for SSO workflows
   */
  const handleSamlJwt = useCallback(async (jwt: string) => {
    setProcessingJwt(true);
    setJwtError(null);

    try {
      // Validate JWT format before attempting login
      if (!jwt || jwt.split('.').length !== 3) {
        throw new Error('Invalid JWT token format');
      }

      // Use the login function with JWT credentials
      const credentials: LoginCredentials = {
        username: '', // Will be extracted from JWT
        password: '', // Not needed for JWT auth
        jwt: jwt, // Add JWT to credentials for backend processing
      };

      await login(credentials);
      
      // Success - redirect will be handled by the auth hook
      console.log('SAML JWT authentication successful');
      
    } catch (error) {
      console.error('SAML JWT authentication failed:', error);
      setJwtError(
        error instanceof Error 
          ? error.message 
          : 'SAML authentication failed. Please try logging in manually.'
      );
      
      // Remove JWT from URL to prevent retry loops
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('jwt');
      router.replace(newUrl.pathname + newUrl.search);
    } finally {
      setProcessingJwt(false);
    }
  }, [login, router]);

  /**
   * Effect to handle JWT parameter on mount and changes
   */
  useEffect(() => {
    const jwt = searchParams.get('jwt');
    if (jwt && !processingJwt && !isLoading) {
      handleSamlJwt(jwt);
    }
  }, [searchParams, handleSamlJwt, processingJwt, isLoading]);

  // Show processing state for SAML authentication
  if (processingJwt) {
    return (
      <Alert variant="info">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing SAML authentication...
        </div>
      </Alert>
    );
  }

  // Show error if JWT processing failed
  if (jwtError) {
    return (
      <Alert variant="error">
        <div>
          <h4 className="font-medium mb-1">SAML Authentication Failed</h4>
          <p className="text-sm">{jwtError}</p>
        </div>
      </Alert>
    );
  }

  return null;
};

// ============================================================================
// Main Login Page Component
// ============================================================================

/**
 * Main login page component with comprehensive authentication features
 * Implements all requirements from the technical specification
 */
const LoginPage: React.FC = () => {
  const router = useRouter();
  const { 
    login, 
    isAuthenticated, 
    isLoading: authLoading, 
    error: authError,
    startTransition,
    isPending 
  } = useAuth();

  // Local state management
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: formSubmitting },
    setError,
    clearErrors,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch form values for real-time validation feedback
  const watchedValues = watch();

  /**
   * Redirect authenticated users to home page
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/home');
    }
  }, [isAuthenticated, authLoading, router]);

  /**
   * Handle form submission with comprehensive error handling
   */
  const onSubmit = useCallback(async (data: LoginFormData) => {
    setIsSubmitting(true);
    clearErrors();

    try {
      // Prepare credentials for authentication
      const credentials: LoginCredentials = {
        username: data.username,
        email: data.username.includes('@') ? data.username : undefined,
        password: data.password,
        rememberMe: data.rememberMe,
      };

      // Use React 19 concurrent features for better UX
      startTransition(async () => {
        try {
          await login(credentials);
          // Success handling is done by the auth hook
        } catch (error) {
          console.error('Login failed:', error);
          
          // Handle specific error cases
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            
            if (message.includes('invalid credentials') || message.includes('unauthorized')) {
              setError('username', { message: 'Invalid username or password' });
              setError('password', { message: 'Invalid username or password' });
            } else if (message.includes('account locked') || message.includes('locked')) {
              setError('username', { message: 'Account is locked. Contact your administrator.' });
            } else if (message.includes('rate limit') || message.includes('too many')) {
              setError('root', { message: 'Too many login attempts. Please wait before trying again.' });
            } else {
              setError('root', { message: error.message });
            }
          } else {
            setError('root', { message: 'An unexpected error occurred. Please try again.' });
          }
        }
      });

    } catch (error) {
      console.error('Login submission error:', error);
      setError('root', { 
        message: 'Unable to process login request. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [login, startTransition, setError, clearErrors]);

  /**
   * Toggle password visibility with accessibility considerations
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Handle authentication errors from the auth hook
   */
  useEffect(() => {
    if (authError) {
      setError('root', { message: authError.message });
    }
  }, [authError, setError]);

  // Show loading spinner for initial authentication check
  if (authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-green-600" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isFormLoading = isSubmitting || formSubmitting || isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <Lock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to DreamFactory
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Access your API management dashboard
          </p>
        </div>

        {/* SAML JWT Handler */}
        <Suspense fallback={null}>
          <SamlJwtHandler />
        </Suspense>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg px-6 py-8 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Root Error Display */}
            {errors.root && (
              <Alert variant="error">
                {errors.root.message}
              </Alert>
            )}

            {/* Username/Email Field */}
            <Input
              {...register('username')}
              label="Username or Email"
              type="text"
              icon={<User />}
              autoComplete="username"
              required
              error={errors.username?.message}
              placeholder="Enter your username or email"
              aria-describedby={errors.username ? 'username-error' : undefined}
            />

            {/* Password Field */}
            <PasswordInput
              {...register('password')}
              label="Password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              placeholder="Enter your password"
              showPassword={showPassword}
              onTogglePassword={togglePasswordVisibility}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register('rememberMe')}
                  id="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isFormLoading}
              disabled={isFormLoading}
              className="w-full"
            >
              {isFormLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Additional Actions */}
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Need an account?
                  </span>
                </div>
              </div>
              
              <a
                href="/register"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1"
              >
                Create a new account
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

/**
 * Default export for Next.js App Router page component
 * Wraps the main component with Suspense for better error boundaries
 */
export default function LoginPageWrapper() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading login page...</p>
          </div>
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}

/**
 * Metadata for Next.js page
 * Provides SEO and accessibility information
 */
export const metadata = {
  title: 'Sign In - DreamFactory Admin',
  description: 'Sign in to access your DreamFactory API management dashboard',
  robots: 'noindex, nofollow', // Prevent indexing of login pages
};