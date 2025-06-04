'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import { createPasswordResetSchema } from '@/lib/auth-schema';
import { validatePassword } from '@/lib/password-validation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { 
  ResetPasswordRequest,
  LoginCredentials,
  PasswordResetResponse,
  AuthResponse
} from '@/types/auth';

/**
 * Form data type for password reset operations
 */
interface ResetFormData {
  email: string;
  username: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Props for the ResetPasswordForm component
 */
interface ResetPasswordFormProps {
  /** Type of form: 'reset' for password reset, 'register' for registration confirmation, 'invite' for user invitation */
  type?: 'reset' | 'register' | 'invite';
  /** Called when form submission is successful */
  onSuccess?: () => void;
  /** Called when form submission fails */
  onError?: (error: string) => void;
}

/**
 * Password reset form component supporting multiple workflows:
 * - Password reset completion
 * - Registration confirmation  
 * - User invitation acceptance
 * 
 * Features:
 * - URL parameter parsing for pre-population
 * - Real-time password confirmation validation
 * - Dynamic field rendering based on system login attribute
 * - Automatic login after successful password reset
 * - Comprehensive error handling and accessibility
 */
export function ResetPasswordForm({ 
  type = 'reset', 
  onSuccess,
  onError 
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { systemConfig } = useSystemConfig();
  
  // Extract URL parameters for form pre-population
  const urlParams = {
    email: searchParams.get('email') || '',
    username: searchParams.get('username') || '',
    code: searchParams.get('code') || '',
    admin: searchParams.get('admin') || ''
  };
  
  const isAdmin = urlParams.admin === '1';
  const loginAttribute = systemConfig?.authentication?.loginAttribute || 'email';
  
  // Create dynamic schema based on login attribute and password requirements
  const passwordResetSchema = React.useMemo(() => {
    return createPasswordResetSchema(loginAttribute, {
      requiresEmail: loginAttribute === 'email',
      requiresUsername: loginAttribute === 'username',
      passwordMinLength: 16,
      requiresConfirmation: true
    });
  }, [loginAttribute]);

  type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: urlParams.email,
      username: urlParams.username,
      code: urlParams.code,
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  });

  // Update form when URL parameters change
  useEffect(() => {
    form.setValue('email', urlParams.email);
    form.setValue('username', urlParams.username);
    form.setValue('code', urlParams.code);
  }, [urlParams.email, urlParams.username, urlParams.code, form]);

  // API mutation for password reset
  const resetPasswordMutation = useMutation<
    PasswordResetResponse,
    Error,
    ResetPasswordRequest
  >({
    mutationFn: async (data: ResetPasswordRequest) => {
      const url = isAdmin ? '/api/v2/system/admin/password' : '/api/v2/user/password';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Password reset failed');
      }

      return response.json();
    },
    onSuccess: async () => {
      // Automatically log in the user after successful password reset
      await performAutoLogin();
    },
    onError: (error) => {
      onError?.(error.message);
    }
  });

  // API mutation for automatic login after password reset
  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      return await login(credentials);
    },
    onSuccess: () => {
      onSuccess?.();
      // Navigate to dashboard after successful login
      router.push('/');
    },
    onError: (error) => {
      // Even if auto-login fails, the password reset was successful
      onError?.(`Password reset successful, but auto-login failed: ${error.message}`);
      router.push('/login');
    }
  });

  /**
   * Performs automatic login after successful password reset
   */
  const performAutoLogin = async () => {
    const formData = form.getValues();
    const credentials: LoginCredentials = {
      password: formData.newPassword
    };

    // Set login credential based on system login attribute
    if (loginAttribute === 'email') {
      credentials.email = formData.email;
    } else {
      credentials.username = formData.username;
    }

    loginMutation.mutate(credentials);
  };

  /**
   * Handles form submission for password reset
   */
  const onSubmit = async (data: PasswordResetFormData) => {
    // Additional password validation
    const passwordValidation = validatePassword(data.newPassword);
    if (!passwordValidation.isValid) {
      form.setError('newPassword', {
        type: 'manual',
        message: passwordValidation.errors[0]
      });
      return;
    }

    // Prepare reset request data
    const resetRequest: ResetPasswordRequest = {
      email: data.email,
      username: data.username,
      code: data.code,
      newPassword: data.newPassword
    };

    resetPasswordMutation.mutate(resetRequest);
  };

  /**
   * Gets the appropriate form title based on the type
   */
  const getFormTitle = () => {
    switch (type) {
      case 'register':
        return 'Registration Confirmation';
      case 'invite':
        return 'Invitation Confirmation';
      default:
        return 'Reset Password';
    }
  };

  /**
   * Gets the appropriate submit button text based on the type
   */
  const getSubmitButtonText = () => {
    switch (type) {
      case 'register':
      case 'invite':
        return 'Confirm User';
      default:
        return 'Reset Password';
    }
  };

  const isLoading = resetPasswordMutation.isPending || loginMutation.isPending;
  const error = resetPasswordMutation.error || loginMutation.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              {getFormTitle()}
            </h2>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert 
              variant="destructive" 
              className="mb-6"
              onDismiss={() => {
                resetPasswordMutation.reset();
                loginMutation.reset();
              }}
            >
              {error.message}
            </Alert>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field - shown when login attribute is email */}
              {loginAttribute === 'email' && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          autoComplete="email"
                          disabled={isLoading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Username Field - shown when login attribute is username */}
              {loginAttribute === 'username' && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your username"
                          autoComplete="username"
                          disabled={isLoading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Confirmation Code Field */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmation Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter confirmation code"
                        disabled={isLoading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password Field */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type === 'reset' ? 'New Password' : 'Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={`Enter your ${type === 'reset' ? 'new ' : ''}password`}
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Password must be at least 16 characters long
                    </p>
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {type === 'reset' ? 'Confirm New Password' : 'Confirm Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Processing...' : getSubmitButtonText()}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                disabled={isLoading}
              >
                Sign in instead
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordForm;