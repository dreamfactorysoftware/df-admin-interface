'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Mail, User, Shield, AlertCircle } from 'lucide-react';

// Types and interfaces
interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  service?: string;
}

interface LdapService {
  name: string;
  label: string;
}

interface AuthService {
  name: string;
  label: string;
  path: string;
  iconClass?: string;
}

interface SystemEnvironment {
  authentication: {
    loginAttribute: 'email' | 'username';
    adldap: LdapService[];
    oauth: AuthService[];
    saml: AuthService[];
  };
}

// Zod validation schemas
const baseSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(16, 'Password must be at least 16 characters for security'),
  service: z.string().optional(),
});

const emailSchema = baseSchema.extend({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  username: z.string().optional(),
});

const usernameSchema = baseSchema.extend({
  username: z.string().min(1, 'Username is required'),
  email: z.string().optional(),
});

// UI Components (simplified versions based on the expected interfaces)
const Alert: React.FC<{
  children: React.ReactNode;
  variant?: 'error' | 'warning' | 'success' | 'info';
  onClose?: () => void;
}> = ({ children, variant = 'error', onClose }) => {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
  };

  return (
    <div className={`relative rounded-md border px-4 py-3 ${variantStyles[variant]}`} role="alert">
      <div className="flex items-start">
        <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">{children}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 flex-shrink-0 text-current hover:opacity-70"
            aria-label="Close alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

const Button: React.FC<{
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  href,
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  };

  const sizeStyles = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-lg',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={combinedClassName}>
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClassName}
    >
      {loading && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}> = ({ className = '', ...props }) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:ring-blue-400 ${className}`}
      {...props}
    />
  );
};

const Select: React.FC<{
  children: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}> = ({ children, className = '', ...props }) => {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-400 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

const FormField: React.FC<{
  children: React.ReactNode;
  error?: string;
  className?: string;
}> = ({ children, error, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {children}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

const Label: React.FC<{
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}> = ({ children, htmlFor, required, className = '' }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
      {required && <span className="ml-1 text-red-500" aria-label="Required">*</span>}
    </label>
  );
};

// Mock hooks (these would be replaced with actual implementations)
const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Mock implementation - replace with actual API call
      const response = await fetch('/api/v2/user/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Login failed');
      }
      
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
};

const useSystemConfig = () => {
  const [config, setConfig] = useState<SystemEnvironment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock implementation - replace with actual API call
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        // Mock data based on Angular component structure
        const mockConfig: SystemEnvironment = {
          authentication: {
            loginAttribute: 'email',
            adldap: [],
            oauth: [],
            saml: [],
          },
        };
        setConfig(mockConfig);
      } catch (error) {
        console.error('Failed to fetch system config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { config, isLoading };
};

// Main LoginForm component
export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading: isAuthLoading } = useAuth();
  const { config, isLoading: isConfigLoading } = useSystemConfig();
  
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [loginAttribute, setLoginAttribute] = useState<'email' | 'username'>('email');

  // Dynamic schema based on login attribute
  const validationSchema = loginAttribute === 'email' ? emailSchema : usernameSchema;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      service: '',
    },
  });

  const selectedService = watch('service');

  // Update login attribute based on service selection or environment config
  useEffect(() => {
    if (config) {
      if (selectedService) {
        setLoginAttribute('username');
      } else {
        setLoginAttribute(config.authentication.loginAttribute);
      }
    }
  }, [selectedService, config]);

  // Clear validation errors when switching between email/username
  useEffect(() => {
    clearErrors(['email', 'username']);
    setValue('email', '');
    setValue('username', '');
  }, [loginAttribute, clearErrors, setValue]);

  const onSubmit = async (data: z.infer<typeof validationSchema>) => {
    try {
      setShowAlert(false);
      
      const credentials: LoginCredentials = {
        password: data.password,
      };

      // Add service if LDAP is selected
      if (config?.authentication.adldap.length && data.service) {
        credentials.service = data.service;
      }

      // Set username or email based on login attribute
      if (loginAttribute === 'username') {
        credentials.username = data.username;
        credentials.email = data.username; // Backend expects both fields
      } else {
        credentials.email = data.email;
      }

      await login(credentials);
      
      // Handle password length warning (maintained from original Angular logic)
      const isPasswordTooShort = data.password.length < 16;
      if (isPasswordTooShort) {
        // This would integrate with a notification system or modal
        console.warn('Password is shorter than recommended (16 characters)');
      }

      // Redirect to dashboard on successful login
      router.push('/home');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAlertMessage(errorMessage);
      setShowAlert(true);

      // Handle specific password length error scenario
      if (error instanceof Error && error.message.includes('401') && data.password.length < 16) {
        setAlertMessage(
          `It looks like your password is too short. Our new system requires at least 16 characters. Please reset your password to continue.`
        );
      }
    }
  };

  const handleOAuthSamlLogin = (service: AuthService) => {
    // Redirect to OAuth/SAML authentication endpoint
    window.location.href = `/api/v2/${service.path}`;
  };

  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ldapServices = config?.authentication.adldap || [];
  const oauthServices = config?.authentication.oauth || [];
  const samlServices = config?.authentication.saml || [];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Logo */}
      <div className="hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900">
        <div className="text-center">
          <img
            src="/assets/img/logo.png"
            alt="DreamFactory Logo"
            className="h-16 w-auto mx-auto mb-8"
          />
          <h1 className="text-3xl font-bold text-white mb-2">DreamFactory</h1>
          <p className="text-blue-100">Generate REST APIs in under 5 minutes</p>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Sign in to your account
              </h2>
            </div>

            {/* Error Alert */}
            {showAlert && (
              <div className="mb-6">
                <Alert variant="error" onClose={() => setShowAlert(false)}>
                  {alertMessage}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* LDAP Service Selection */}
              {ldapServices.length > 0 && (
                <FormField error={errors.service?.message}>
                  <Label htmlFor="service">Service</Label>
                  <Select
                    {...register('service')}
                    id="service"
                    aria-invalid={!!errors.service}
                    aria-describedby={errors.service ? 'service-error' : undefined}
                  >
                    <option value="">Select a service...</option>
                    {ldapServices.map((service) => (
                      <option key={service.name} value={service.name}>
                        {service.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}

              {/* Email Field */}
              {loginAttribute === 'email' && (
                <FormField error={errors.email?.message}>
                  <Label htmlFor="email" required>
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...register('email')}
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </div>
                </FormField>
              )}

              {/* Username Field */}
              {loginAttribute === 'username' && (
                <FormField error={errors.username?.message}>
                  <Label htmlFor="username" required>
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...register('username')}
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className="pl-10"
                      aria-invalid={!!errors.username}
                      aria-describedby={errors.username ? 'username-error' : undefined}
                    />
                  </div>
                </FormField>
              )}

              {/* Password Field */}
              <FormField error={errors.password?.message}>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password (min 16 characters)"
                    className="pl-10 pr-10"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting || isAuthLoading}
                loading={isSubmitting || isAuthLoading}
                className="w-full"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
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
                      Or continue with OAuth
                    </span>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {oauthServices.map((service) => (
                    <Button
                      key={service.name}
                      variant="outline"
                      onClick={() => handleOAuthSamlLogin(service)}
                      className="w-full"
                    >
                      {service.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* SAML Services */}
            {samlServices.length > 0 && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or continue with SAML
                    </span>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {samlServices.map((service) => (
                    <Button
                      key={service.name}
                      variant="outline"
                      onClick={() => handleOAuthSamlLogin(service)}
                      className="w-full"
                    >
                      {service.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="mt-6 text-center">
              <a
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot your password?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}