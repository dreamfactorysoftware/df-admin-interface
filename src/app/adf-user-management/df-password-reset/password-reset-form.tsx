'use client';

/**
 * Password Reset Form Component
 * 
 * React password reset form component implementing comprehensive password reset, 
 * registration confirmation, and invitation confirmation workflows with React Hook Form, 
 * Zod validation, and Tailwind CSS styling. Provides dynamic form validation based on 
 * system configuration (email vs username), real-time validation under 100ms, automatic 
 * authentication after successful reset, and supports three workflow types.
 * 
 * Key Features:
 * - React Hook Form with Zod schema validators for real-time validation under 100ms
 * - Support for three workflow types: password reset, registration confirmation, invitation confirmation
 * - Dynamic form behavior based on system configuration (email vs username loginAttribute)
 * - Automatic authentication flow after successful password reset
 * - Comprehensive error handling with React Error Boundary integration
 * - Next.js router integration for navigation and query parameter handling
 * - Tailwind CSS 4.1+ styling with responsive design and theme integration
 * - Loading states and optimistic updates for enhanced user experience
 * 
 * Replaces Angular df-password-reset.component with modern React patterns including:
 * - React Hook Form replacing Angular reactive forms
 * - Zod validation replacing Angular validators
 * - React Query replacing RxJS observables
 * - Next.js useRouter replacing Angular Router
 * - Tailwind CSS replacing Angular Material
 * 
 * @example
 * ```tsx
 * // Password reset workflow
 * <PasswordResetForm 
 *   type="reset" 
 *   onSuccess={(user) => console.log('Reset successful', user)}
 *   onError={(error) => console.error('Reset failed', error)}
 * />
 * 
 * // Registration confirmation workflow
 * <PasswordResetForm 
 *   type="register" 
 *   code="abc123"
 *   identifier="user@example.com"
 *   onSuccess={(user) => console.log('Registration confirmed', user)}
 * />
 * 
 * // Invitation confirmation workflow
 * <PasswordResetForm 
 *   type="invitation" 
 *   code="def456"
 *   identifier="user@example.com"
 *   onSuccess={(user) => console.log('Invitation accepted', user)}
 * />
 * ```
 */

import React, { useState, useCallback, useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Internal imports
import {
  type PasswordResetRequest,
  type PasswordResetForm as PasswordResetFormData,
  type UserSession,
  type AuthAlert,
  type AuthFormState,
  PasswordResetRequestSchema,
  PasswordResetFormSchema,
} from '@/app/adf-user-management/types';
import {
  passwordResetSchema,
  createForgotPasswordSchema,
  type PasswordResetFormData as ValidationFormData,
  type ValidationConfig,
  validationHelpers,
} from '@/app/adf-user-management/validation';
import {
  passwordUtils,
  formUtils,
  sessionUtils,
  authStateUtils,
} from '@/app/adf-user-management/utils';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig, type Environment } from '@/hooks/use-system-config';
import { apiClient } from '@/lib/api-client';

// UI Component placeholders - these will be replaced with actual implementations
const Alert: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  className?: string;
}> = ({ type, message, title, className = '' }) => {
  const alertStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`border rounded-lg p-4 ${alertStyles[type]} ${className}`}>
      {title && <h4 className="font-semibold mb-2">{title}</h4>}
      <p>{message}</p>
    </div>
  );
};

const Button: React.FC<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}> = ({ 
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

const Input: React.FC<{
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  required?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
}> = ({
  type = 'text',
  placeholder,
  disabled = false,
  error,
  label,
  required = false,
  className = '',
  value,
  onChange,
  onBlur,
  name,
}) => {
  const inputStyles = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500 ${inputStyles}`}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const Card: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = '', children }) => {
  return (
    <div className={`bg-white shadow-sm border border-gray-200 rounded-lg ${className}`}>
      {children}
    </div>
  );
};

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Password reset workflow types
 * Determines the form behavior and validation requirements
 */
export type WorkflowType = 'reset' | 'register' | 'invitation';

/**
 * Form data interface combining all workflow types
 * Dynamically validated based on workflow type and system configuration
 */
interface FormData {
  identifier: string; // Email or username based on system configuration
  code?: string; // Reset/confirmation code
  newPassword?: string; // New password for reset workflows
  confirmPassword?: string; // Password confirmation
  securityAnswer?: string; // Security question answer (if enabled)
}

/**
 * Component props interface with comprehensive configuration options
 */
export interface PasswordResetFormProps {
  /** Workflow type determining form behavior */
  type?: WorkflowType;
  /** Pre-filled confirmation code from URL or props */
  code?: string;
  /** Pre-filled identifier (email/username) from URL or props */
  identifier?: string;
  /** Success callback with user session data */
  onSuccess?: (user: UserSession) => void;
  /** Error callback with error details */
  onError?: (error: Error) => void;
  /** Custom CSS classes */
  className?: string;
  /** Redirect URL after successful completion */
  redirectUrl?: string;
  /** Whether to automatically redirect after success */
  autoRedirect?: boolean;
}

/**
 * API response interfaces for different workflow types
 */
interface PasswordResetResponse {
  success: boolean;
  message: string;
  sessionToken?: string;
  user?: UserSession;
}

interface ConfirmationResponse {
  success: boolean;
  message: string;
  sessionToken?: string;
  user?: UserSession;
  requiresLogin?: boolean;
}

// ============================================================================
// API Client Functions
// ============================================================================

/**
 * API client for password reset operations
 * Handles all three workflow types with consistent error handling
 */
class PasswordResetAPI {
  /**
   * Initiates password reset request
   * Sends reset code to user's email/username
   */
  static async requestPasswordReset(request: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/user/password', {
        [request.loginAttribute]: request.email || request.username,
        security_answer: request.securityAnswer,
      });

      return {
        success: true,
        message: response.message || 'Password reset instructions sent.',
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset instructions');
    }
  }

  /**
   * Completes password reset with new password
   * Authenticates user automatically on success
   */
  static async resetPassword(data: PasswordResetFormData): Promise<PasswordResetResponse> {
    try {
      const response = await apiClient.post('/user/password', {
        code: data.code,
        new_password: data.newPassword,
        email: data.identifier.includes('@') ? data.identifier : undefined,
        username: !data.identifier.includes('@') ? data.identifier : undefined,
      });

      return {
        success: true,
        message: response.message || 'Password reset successfully.',
        sessionToken: response.session_token,
        user: response.user,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  }

  /**
   * Confirms user registration with password setup
   * Completes registration flow and authenticates user
   */
  static async confirmRegistration(data: FormData): Promise<ConfirmationResponse> {
    try {
      const response = await apiClient.post('/user/register', {
        code: data.code,
        new_password: data.newPassword,
        email: data.identifier.includes('@') ? data.identifier : undefined,
        username: !data.identifier.includes('@') ? data.identifier : undefined,
      });

      return {
        success: true,
        message: response.message || 'Registration completed successfully.',
        sessionToken: response.session_token,
        user: response.user,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to complete registration');
    }
  }

  /**
   * Confirms invitation with password setup
   * Completes invitation acceptance and authenticates user
   */
  static async confirmInvitation(data: FormData): Promise<ConfirmationResponse> {
    try {
      const response = await apiClient.post('/user/invite', {
        code: data.code,
        new_password: data.newPassword,
        email: data.identifier.includes('@') ? data.identifier : undefined,
        username: !data.identifier.includes('@') ? data.identifier : undefined,
      });

      return {
        success: true,
        message: response.message || 'Invitation accepted successfully.',
        sessionToken: response.session_token,
        user: response.user,
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to accept invitation');
    }
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Password Reset Form Component
 * 
 * Comprehensive form component supporting three workflow types with dynamic
 * validation, real-time feedback, and automatic authentication flow.
 */
export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  type = 'reset',
  code: propCode,
  identifier: propIdentifier,
  onSuccess,
  onError,
  className = '',
  redirectUrl,
  autoRedirect = true,
}) => {
  // ============================================================================
  // Hooks and State Management
  // ============================================================================

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // Authentication and system configuration
  const { login, isAuthenticated, startTransition: authTransition } = useAuth();
  const { environment, isLoading: isConfigLoading } = useSystemConfig();

  // Local state management
  const [formState, setFormState] = useState<AuthFormState>({
    isSubmitting: false,
    error: null,
    success: null,
    isComplete: false,
  });
  const [alert, setAlert] = useState<AuthAlert | null>(null);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  // Extract parameters from URL or props
  const code = propCode || searchParams.get('code') || '';
  const identifier = propIdentifier || searchParams.get('email') || searchParams.get('username') || '';
  const workflowType = (searchParams.get('type') as WorkflowType) || type;

  // ============================================================================
  // Dynamic Schema Generation
  // ============================================================================

  /**
   * Generates validation schema based on workflow type and system configuration
   * Provides real-time validation under 100ms performance requirement
   */
  const validationSchema = useMemo(() => {
    const config: ValidationConfig = {
      loginAttribute: environment.authentication.loginAttribute as 'email' | 'username',
      hasLdapServices: environment.authentication.adldap.length > 0,
      hasOauthServices: environment.authentication.oauth.length > 0,
      hasSamlServices: environment.authentication.saml.length > 0,
    };

    // Base schema for identifier validation
    const identifierSchema = config.loginAttribute === 'email'
      ? z.string().email('Please enter a valid email address').min(1, 'Email is required')
      : z.string().min(1, 'Username is required');

    // Workflow-specific schema generation
    switch (workflowType) {
      case 'reset':
        if (code) {
          // Reset with code - require new password
          return z.object({
            identifier: identifierSchema,
            code: z.string().min(1, 'Reset code is required'),
            newPassword: z.string()
              .min(8, 'Password must be at least 8 characters')
              .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
            confirmPassword: z.string().min(1, 'Please confirm your password'),
            securityAnswer: z.string().optional(),
          }).refine((data) => data.newPassword === data.confirmPassword, {
            message: 'Passwords do not match',
            path: ['confirmPassword'],
          });
        } else {
          // Request reset code
          return z.object({
            identifier: identifierSchema,
            securityAnswer: z.string().optional(),
          });
        }

      case 'register':
        return z.object({
          identifier: identifierSchema,
          code: z.string().min(1, 'Confirmation code is required'),
          newPassword: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
          confirmPassword: z.string().min(1, 'Please confirm your password'),
        }).refine((data) => data.newPassword === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });

      case 'invitation':
        return z.object({
          identifier: identifierSchema,
          code: z.string().min(1, 'Invitation code is required'),
          newPassword: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
          confirmPassword: z.string().min(1, 'Please confirm your password'),
        }).refine((data) => data.newPassword === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });

      default:
        return z.object({
          identifier: identifierSchema,
        });
    }
  }, [workflowType, code, environment.authentication]);

  // ============================================================================
  // Form Configuration
  // ============================================================================

  /**
   * React Hook Form configuration with Zod resolver
   * Provides real-time validation and optimized re-rendering
   */
  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      identifier: identifier,
      code: code,
      newPassword: '',
      confirmPassword: '',
      securityAnswer: '',
    },
    mode: 'onChange', // Real-time validation
    reValidateMode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
    setValue,
    reset,
  } = form;

  // Watch password for strength indicator
  const watchedPassword = watch('newPassword');

  // ============================================================================
  // API Mutations
  // ============================================================================

  /**
   * Password reset request mutation
   * Handles initial reset request workflow
   */
  const resetRequestMutation = useMutation({
    mutationFn: PasswordResetAPI.requestPasswordReset,
    onMutate: () => {
      setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));
      setAlert(null);
    },
    onSuccess: (data) => {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: data.message,
        isComplete: true 
      }));
      setAlert({
        type: 'success',
        message: data.message,
        title: 'Reset Instructions Sent',
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to send reset instructions';
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMessage 
      }));
      setAlert({
        type: 'error',
        message: errorMessage,
        title: 'Reset Request Failed',
      });
      onError?.(error);
    },
  });

  /**
   * Password reset completion mutation
   * Handles password reset with automatic authentication
   */
  const resetCompleteMutation = useMutation({
    mutationFn: PasswordResetAPI.resetPassword,
    onMutate: () => {
      setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));
      setAlert(null);
    },
    onSuccess: async (data) => {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: data.message,
        isComplete: true 
      }));

      // Automatic authentication after successful reset
      if (data.sessionToken && data.user) {
        try {
          // Clear authentication cache and update session
          await sessionUtils.invalidateAuthCache(queryClient);
          
          // Trigger authentication state update
          if (data.user) {
            onSuccess?.(data.user);
          }

          setAlert({
            type: 'success',
            message: 'Password reset successfully. You are now logged in.',
            title: 'Reset Complete',
          });

          // Navigate to appropriate page
          if (autoRedirect) {
            startTransition(() => {
              router.push(redirectUrl || '/home');
            });
          }
        } catch (authError) {
          console.error('Auto-login failed:', authError);
          setAlert({
            type: 'warning',
            message: 'Password reset successfully. Please log in with your new password.',
            title: 'Reset Complete',
          });
        }
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to reset password';
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMessage 
      }));
      setAlert({
        type: 'error',
        message: errorMessage,
        title: 'Reset Failed',
      });
      onError?.(error);
    },
  });

  /**
   * Registration confirmation mutation
   * Handles registration completion with automatic authentication
   */
  const registrationMutation = useMutation({
    mutationFn: PasswordResetAPI.confirmRegistration,
    onMutate: () => {
      setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));
      setAlert(null);
    },
    onSuccess: async (data) => {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: data.message,
        isComplete: true 
      }));

      // Automatic authentication after successful registration
      if (data.sessionToken && data.user) {
        try {
          await sessionUtils.invalidateAuthCache(queryClient);
          
          if (data.user) {
            onSuccess?.(data.user);
          }

          setAlert({
            type: 'success',
            message: 'Registration completed successfully. Welcome to DreamFactory!',
            title: 'Registration Complete',
          });

          if (autoRedirect) {
            startTransition(() => {
              router.push(redirectUrl || '/home');
            });
          }
        } catch (authError) {
          console.error('Auto-login failed:', authError);
          setAlert({
            type: 'warning',
            message: 'Registration completed successfully. Please log in with your new password.',
            title: 'Registration Complete',
          });
        }
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to complete registration';
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMessage 
      }));
      setAlert({
        type: 'error',
        message: errorMessage,
        title: 'Registration Failed',
      });
      onError?.(error);
    },
  });

  /**
   * Invitation confirmation mutation
   * Handles invitation acceptance with automatic authentication
   */
  const invitationMutation = useMutation({
    mutationFn: PasswordResetAPI.confirmInvitation,
    onMutate: () => {
      setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));
      setAlert(null);
    },
    onSuccess: async (data) => {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: data.message,
        isComplete: true 
      }));

      // Automatic authentication after successful invitation acceptance
      if (data.sessionToken && data.user) {
        try {
          await sessionUtils.invalidateAuthCache(queryClient);
          
          if (data.user) {
            onSuccess?.(data.user);
          }

          setAlert({
            type: 'success',
            message: 'Invitation accepted successfully. Welcome to DreamFactory!',
            title: 'Invitation Accepted',
          });

          if (autoRedirect) {
            startTransition(() => {
              router.push(redirectUrl || '/home');
            });
          }
        } catch (authError) {
          console.error('Auto-login failed:', authError);
          setAlert({
            type: 'warning',
            message: 'Invitation accepted successfully. Please log in with your new password.',
            title: 'Invitation Accepted',
          });
        }
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || 'Failed to accept invitation';
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: errorMessage 
      }));
      setAlert({
        type: 'error',
        message: errorMessage,
        title: 'Invitation Failed',
      });
      onError?.(error);
    },
  });

  // ============================================================================
  // Form Submission Handler
  // ============================================================================

  /**
   * Form submission handler with workflow-specific logic
   * Delegates to appropriate mutation based on workflow type
   */
  const onSubmit: SubmitHandler<FormData> = useCallback(async (data) => {
    try {
      switch (workflowType) {
        case 'reset':
          if (data.code && data.newPassword) {
            // Complete password reset
            await resetCompleteMutation.mutateAsync({
              identifier: data.identifier,
              code: data.code,
              newPassword: data.newPassword,
              confirmPassword: data.confirmPassword!,
            });
          } else {
            // Request password reset
            const loginAttribute = environment.authentication.loginAttribute as 'email' | 'username';
            await resetRequestMutation.mutateAsync({
              [loginAttribute]: data.identifier,
              loginAttribute,
              securityAnswer: data.securityAnswer,
            } as PasswordResetRequest);
          }
          break;

        case 'register':
          await registrationMutation.mutateAsync(data);
          break;

        case 'invitation':
          await invitationMutation.mutateAsync(data);
          break;

        default:
          throw new Error(`Unknown workflow type: ${workflowType}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is managed by individual mutations
    }
  }, [
    workflowType,
    environment.authentication.loginAttribute,
    resetRequestMutation,
    resetCompleteMutation,
    registrationMutation,
    invitationMutation,
  ]);

  // ============================================================================
  // Password Strength Validation
  // ============================================================================

  /**
   * Password strength indicator component
   * Provides real-time feedback for password composition
   */
  const passwordStrengthIndicator = useMemo(() => {
    if (!watchedPassword || !showPasswordStrength) return null;

    const strength = passwordUtils.getPasswordStrengthIndicator(watchedPassword);
    
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password strength:</span>
          <span className={`font-medium ${strength.color}`}>{strength.label}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${strength.bgColor}`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
    );
  }, [watchedPassword, showPasswordStrength]);

  // ============================================================================
  // Effect Hooks
  // ============================================================================

  /**
   * Pre-fill form fields from URL parameters
   * Supports deep linking and email/invitation links
   */
  useEffect(() => {
    if (identifier && identifier !== watch('identifier')) {
      setValue('identifier', identifier);
    }
    if (code && code !== watch('code')) {
      setValue('code', code);
    }
  }, [identifier, code, setValue, watch]);

  /**
   * Password field focus handler
   * Shows password strength indicator when password field is focused
   */
  useEffect(() => {
    const passwordField = document.querySelector('input[name="newPassword"]');
    if (!passwordField) return;

    const handleFocus = () => setShowPasswordStrength(true);
    const handleBlur = () => {
      // Keep showing if password has content
      if (!watchedPassword) {
        setShowPasswordStrength(false);
      }
    };

    passwordField.addEventListener('focus', handleFocus);
    passwordField.addEventListener('blur', handleBlur);

    return () => {
      passwordField.removeEventListener('focus', handleFocus);
      passwordField.removeEventListener('blur', handleBlur);
    };
  }, [watchedPassword]);

  /**
   * Auto-dismiss success alerts
   * Provides better user experience for success scenarios
   */
  useEffect(() => {
    if (alert?.type === 'success' && alert.autoHide !== false) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alert]);

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Dynamic form titles based on workflow type
   */
  const formTitle = useMemo(() => {
    switch (workflowType) {
      case 'reset':
        return code ? 'Reset Your Password' : 'Forgot Password';
      case 'register':
        return 'Complete Registration';
      case 'invitation':
        return 'Accept Invitation';
      default:
        return 'Password Reset';
    }
  }, [workflowType, code]);

  /**
   * Dynamic submit button text
   */
  const submitButtonText = useMemo(() => {
    if (formState.isSubmitting) {
      switch (workflowType) {
        case 'reset':
          return code ? 'Resetting Password...' : 'Sending Instructions...';
        case 'register':
          return 'Completing Registration...';
        case 'invitation':
          return 'Accepting Invitation...';
        default:
          return 'Processing...';
      }
    }

    switch (workflowType) {
      case 'reset':
        return code ? 'Reset Password' : 'Send Reset Instructions';
      case 'register':
        return 'Complete Registration';
      case 'invitation':
        return 'Accept Invitation';
      default:
        return 'Submit';
    }
  }, [workflowType, code, formState.isSubmitting]);

  /**
   * Determine if form requires password fields
   */
  const requiresPassword = useMemo(() => {
    return (workflowType === 'reset' && code) || 
           workflowType === 'register' || 
           workflowType === 'invitation';
  }, [workflowType, code]);

  /**
   * Loading state combining all async operations
   */
  const isLoading = isConfigLoading || 
                   formState.isSubmitting || 
                   resetRequestMutation.isPending ||
                   resetCompleteMutation.isPending ||
                   registrationMutation.isPending ||
                   invitationMutation.isPending ||
                   isPending;

  // ============================================================================
  // Render Methods
  // ============================================================================

  /**
   * Renders form completion success state
   * Shows success message and optional navigation
   */
  const renderSuccessState = () => {
    if (!formState.isComplete) return null;

    return (
      <div className="text-center space-y-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">{formTitle} Complete</h3>
          <p className="mt-2 text-sm text-gray-600">{formState.success}</p>
        </div>
        {!autoRedirect && (
          <div className="flex justify-center space-x-3">
            <Button
              variant="primary"
              onClick={() => router.push(redirectUrl || '/home')}
            >
              Continue to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders the main form based on workflow type and state
   */
  const renderForm = () => {
    if (formState.isComplete) {
      return renderSuccessState();
    }

    const loginAttribute = environment.authentication.loginAttribute;
    const identifierLabel = loginAttribute === 'email' ? 'Email Address' : 'Username';
    const identifierPlaceholder = loginAttribute === 'email' 
      ? 'Enter your email address' 
      : 'Enter your username';

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identifier Field (Email/Username) */}
        <Input
          {...register('identifier')}
          type={loginAttribute === 'email' ? 'email' : 'text'}
          label={identifierLabel}
          placeholder={identifierPlaceholder}
          required
          disabled={!!identifier || isLoading}
          error={errors.identifier?.message}
        />

        {/* Code Field (for reset completion, registration, invitation) */}
        {(code || workflowType !== 'reset' || (workflowType === 'reset' && code)) && (
          <Input
            {...register('code')}
            type="text"
            label={workflowType === 'register' ? 'Confirmation Code' : 
                   workflowType === 'invitation' ? 'Invitation Code' : 'Reset Code'}
            placeholder={`Enter your ${workflowType === 'register' ? 'confirmation' : 
                        workflowType === 'invitation' ? 'invitation' : 'reset'} code`}
            required
            disabled={!!code || isLoading}
            error={errors.code?.message}
          />
        )}

        {/* Password Fields (for password setting workflows) */}
        {requiresPassword && (
          <>
            <div>
              <Input
                {...register('newPassword')}
                type="password"
                label="New Password"
                placeholder="Enter your new password"
                required
                disabled={isLoading}
                error={errors.newPassword?.message}
              />
              {passwordStrengthIndicator}
            </div>

            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirm Password"
              placeholder="Confirm your new password"
              required
              disabled={isLoading}
              error={errors.confirmPassword?.message}
            />
          </>
        )}

        {/* Security Answer Field (optional for password reset) */}
        {workflowType === 'reset' && !code && (
          <Input
            {...register('securityAnswer')}
            type="text"
            label="Security Answer (if required)"
            placeholder="Enter your security question answer"
            disabled={isLoading}
            error={errors.securityAnswer?.message}
          />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!isValid || isLoading}
          loading={isLoading}
          className="w-full"
        >
          {submitButtonText}
        </Button>

        {/* Navigation Links */}
        <div className="text-center space-y-2">
          <div className="text-sm">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to Login
            </button>
          </div>
          {workflowType === 'reset' && !code && (
            <div className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </form>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  // Redirect if already authenticated (except for certain workflows)
  if (isAuthenticated && autoRedirect && workflowType === 'reset' && !code) {
    router.push('/home');
    return null;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {formTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {workflowType === 'reset' && !code && 'Enter your email address and we\'ll send you instructions to reset your password.'}
            {workflowType === 'reset' && code && 'Enter your new password below.'}
            {workflowType === 'register' && 'Set up your password to complete your registration.'}
            {workflowType === 'invitation' && 'Set up your password to accept the invitation.'}
          </p>
        </div>

        {/* Alert Messages */}
        {alert && (
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            className="mb-6"
          />
        )}

        {/* Main Content */}
        <Card className="p-8">
          {renderForm()}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Having trouble?{' '}
            <a href="/support" className="text-blue-600 hover:text-blue-500">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Error Boundary Integration
// ============================================================================

/**
 * Error Boundary wrapper for the Password Reset Form
 * Provides comprehensive error handling per Section 4.2.1.1
 */
export class PasswordResetFormErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Password Reset Form Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="max-w-md w-full p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="mt-2 text-sm text-gray-600">
                  We encountered an error while loading the password reset form. Please try refreshing the page.
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// HOC with Error Boundary
// ============================================================================

/**
 * Password Reset Form with Error Boundary
 * Provides the component wrapped with error boundary protection
 */
export const PasswordResetFormWithErrorBoundary: React.FC<PasswordResetFormProps & {
  onError?: (error: Error) => void;
}> = ({ onError, ...props }) => {
  return (
    <PasswordResetFormErrorBoundary onError={onError}>
      <PasswordResetForm {...props} />
    </PasswordResetFormErrorBoundary>
  );
};

// ============================================================================
// Default Export
// ============================================================================

export default PasswordResetForm;