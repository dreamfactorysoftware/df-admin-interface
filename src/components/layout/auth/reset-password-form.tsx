'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { ResetFormData, UpdatePasswordResponse } from '@/types/auth';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Form workflow types supported by the reset password component
 */
type WorkflowType = 'reset' | 'register' | 'invite';

/**
 * Password reset form data interface
 */
interface PasswordResetFormData {
  email?: string;
  username?: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password reset API request interface
 */
interface PasswordResetRequest {
  email?: string;
  username?: string;
  code: string;
  newPassword: string;
  admin?: boolean;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Base form validation schema with common fields
 */
const baseSchema = z.object({
  code: z.string().min(1, 'Confirmation code is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
});

/**
 * Email-based authentication schema
 */
const emailSchema = baseSchema.extend({
  email: z.string().email('Invalid email address'),
  username: z.string().optional(),
});

/**
 * Username-based authentication schema
 */
const usernameSchema = baseSchema.extend({
  username: z.string().min(1, 'Username is required'),
  email: z.string().optional(),
});

/**
 * Combined validation schema with password confirmation
 */
const createValidationSchema = (loginAttribute: string) => {
  const schema = loginAttribute === 'email' ? emailSchema : usernameSchema;
  
  return schema.refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );
};

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Password reset API call
 */
async function resetPasswordAPI(data: PasswordResetRequest): Promise<UpdatePasswordResponse> {
  const endpoint = data.admin ? '/api/auth/admin/password' : '/api/auth/user/password';
  
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: data.code,
      new_password: data.newPassword,
      ...(data.email && { email: data.email }),
      ...(data.username && { username: data.username }),
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.message || 'Password reset failed');
  }

  return response.json();
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface ResetPasswordFormProps {
  /** CSS class name for styling */
  className?: string;
  /** Custom callback on successful password reset */
  onSuccess?: (data: UpdatePasswordResponse) => void;
  /** Custom callback on error */
  onError?: (error: Error) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * React password reset form component handling multiple authentication workflows
 * 
 * Features:
 * - Multi-purpose form supporting password reset, registration confirmation, and user invitation
 * - URL parameter parsing for pre-populating email, username, and confirmation code fields
 * - Dynamic field rendering based on system login attribute configuration (email vs username)
 * - Password confirmation validation with real-time matching verification using Zod schema
 * - Automatic user login after successful password reset with session establishment
 * - React Query mutations for API operations with comprehensive error handling
 * - Responsive form design with proper accessibility features and error messaging
 * - Integration with Next.js router for navigation and parameter handling
 * 
 * @param props Component props
 * @returns JSX element for the password reset form
 */
export function ResetPasswordForm({
  className = '',
  onSuccess,
  onError,
}: ResetPasswordFormProps): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading: authLoading } = useAuth();
  const { environment } = useSystemConfig();

  // Extract URL parameters
  const urlParams = useMemo(() => ({
    email: searchParams.get('email') || '',
    username: searchParams.get('username') || '',
    code: searchParams.get('code') || '',
    admin: searchParams.get('admin') === '1',
    type: (searchParams.get('type') as WorkflowType) || 'reset',
  }), [searchParams]);

  // Get login attribute from system configuration
  const loginAttribute = environment?.authentication?.loginAttribute || 'email';

  // Create validation schema based on login attribute
  const validationSchema = useMemo(
    () => createValidationSchema(loginAttribute),
    [loginAttribute]
  );

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: urlParams.email,
      username: urlParams.username,
      code: urlParams.code,
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange', // Real-time validation
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    watch,
  } = form;

  // Watch password fields for real-time confirmation validation
  const newPassword = watch('newPassword');
  const confirmPassword = watch('confirmPassword');

  // Real-time password confirmation validation
  useEffect(() => {
    if (confirmPassword && newPassword !== confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
    } else if (confirmPassword && newPassword === confirmPassword) {
      clearErrors('confirmPassword');
    }
  }, [newPassword, confirmPassword, setError, clearErrors]);

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: PasswordResetFormData) => {
      const requestData: PasswordResetRequest = {
        code: data.code,
        newPassword: data.newPassword,
        admin: urlParams.admin,
      };

      // Add email or username based on login attribute
      if (loginAttribute === 'email') {
        requestData.email = data.email;
      } else {
        requestData.username = data.username;
      }

      return resetPasswordAPI(requestData);
    },
    onSuccess: async (response) => {
      try {
        // Automatically log in user after successful password reset
        const loginCredentials = {
          password: form.getValues('newPassword'),
          ...(loginAttribute === 'email' 
            ? { email: form.getValues('email') }
            : { username: form.getValues('username') }
          ),
        };

        await login(loginCredentials);
        
        // Call custom success callback if provided
        if (onSuccess) {
          onSuccess(response);
        }

        // Navigate to dashboard
        router.push('/');
      } catch (loginError) {
        console.error('Auto-login failed after password reset:', loginError);
        // Navigate to login page if auto-login fails
        router.push('/login?message=password_reset_success');
      }
    },
    onError: (error: Error) => {
      console.error('Password reset failed:', error);
      
      // Call custom error callback if provided
      if (onError) {
        onError(error);
      }
    },
  });

  // Form submission handler
  const onSubmit = (data: PasswordResetFormData) => {
    if (!isValid) {
      return;
    }
    resetPasswordMutation.mutate(data);
  };

  // Determine form title based on workflow type
  const getFormTitle = () => {
    switch (urlParams.type) {
      case 'register':
        return 'Registration Confirmation';
      case 'invite':
        return 'Invitation Confirmation';
      default:
        return 'Reset Password';
    }
  };

  // Determine submit button text based on workflow type
  const getSubmitButtonText = () => {
    switch (urlParams.type) {
      case 'register':
        return 'Confirm Registration';
      case 'invite':
        return 'Accept Invitation';
      default:
        return 'Reset Password';
    }
  };

  // Check if form is loading
  const isFormLoading = resetPasswordMutation.isPending || authLoading;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getFormTitle()}
          </h2>
        </div>

        {/* Error Alert */}
        {resetPasswordMutation.error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {resetPasswordMutation.error?.message || 'An error occurred during password reset'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          {/* Email Field (if using email authentication) */}
          {loginAttribute === 'email' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email address"
                disabled={isFormLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>
          )}

          {/* Username Field (if using username authentication) */}
          {loginAttribute === 'username' && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                id="username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your username"
                disabled={isFormLoading}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>
          )}

          {/* Confirmation Code Field */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmation Code
            </label>
            <input
              {...register('code')}
              type="text"
              id="code"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter confirmation code"
              disabled={isFormLoading}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.code.message}
              </p>
            )}
          </div>

          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {urlParams.type === 'reset' ? 'New Password' : 'Password'}
            </label>
            <input
              {...register('newPassword')}
              type="password"
              id="newPassword"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your password"
              disabled={isFormLoading}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {urlParams.type === 'reset' ? 'Confirm New Password' : 'Confirm Password'}
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              id="confirmPassword"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Confirm your password"
              disabled={isFormLoading}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={!isValid || isFormLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isFormLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                getSubmitButtonText()
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;