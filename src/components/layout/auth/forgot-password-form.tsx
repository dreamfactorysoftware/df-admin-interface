'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Import hooks - based on the established patterns
import { useSystemConfig } from '@/hooks/use-system-config';
import { useAuth } from '@/hooks/use-auth';

// Import UI components - based on the established patterns
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';

// Types based on the original Angular interfaces
interface ForgetPasswordRequest {
  username?: string;
  email?: string;
}

interface SecurityQuestion {
  securityQuestion: string;
}

interface ResetFormData {
  email?: string;
  username?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  newPassword: string;
  confirmPassword: string;
}

interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
}

// Enhanced Zod schemas with conditional validation based on login attribute
const createForgotPasswordSchema = (loginAttribute: string) => {
  if (loginAttribute === 'username') {
    return z.object({
      username: z.string().min(1, 'Username is required'),
      email: z.string().optional(),
    });
  } else {
    return z.object({
      email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
      username: z.string().optional(),
    });
  }
};

const securityQuestionSchema = z.object({
  securityQuestion: z.string().min(1, 'Security question is required'),
  securityAnswer: z.string().min(1, 'Security answer is required'),
  newPassword: z.string().min(16, 'Password must be at least 16 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
type SecurityQuestionFormData = z.infer<typeof securityQuestionSchema>;

/**
 * ForgotPasswordForm Component
 * 
 * Implements a two-step password reset workflow with dynamic form fields based on system configuration.
 * Migrated from Angular df-forgot-password component to use React Hook Form, conditional form rendering,
 * and React Query for API interactions.
 * 
 * Features:
 * - Dynamic form field switching between email and username input based on system configuration
 * - Two-step password reset workflow with initial request and optional security question forms
 * - Real-time validation with proper error messaging for invalid email/username formats
 * - Security question form display when backend requires additional verification
 * - Integration with password reset API endpoints maintaining existing backend contracts
 * - Loading states and success/error messaging with proper user feedback
 * - Responsive design ensuring accessibility and mobile compatibility
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const { data: systemConfig } = useSystemConfig();
  const { login } = useAuth();

  // Component state management
  const [alertMsg, setAlertMsg] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');

  // Get login attribute from system configuration (default to 'email')
  const loginAttribute = systemConfig?.authentication?.loginAttribute || 'email';

  // Dynamic form schema based on system configuration
  const forgotPasswordSchema = createForgotPasswordSchema(loginAttribute);

  // Initial password reset request form
  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  });

  // Security question form for second step
  const securityQuestionForm = useForm<SecurityQuestionFormData>({
    resolver: zodResolver(securityQuestionSchema),
    defaultValues: {
      securityQuestion: '',
      securityAnswer: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // API client functions mimicking the original Angular service patterns
  const requestPasswordResetAPI = async (
    data: ForgetPasswordRequest | ResetFormData,
    hasSecurityQuestion = false
  ): Promise<SecurityQuestion | { success: boolean }> => {
    const headers = {
      'Content-Type': 'application/json',
      'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
    };

    const params = new URLSearchParams({
      login: 'false',
      reset: hasSecurityQuestion ? 'false' : 'true',
    });

    try {
      // Try user password endpoint first
      const userResponse = await fetch(`/api/v2/user/password?${params}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!userResponse.ok) {
        // Fallback to admin password endpoint if user endpoint fails
        const adminResponse = await fetch(`/api/v2/system/admin/password?${params}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });

        if (!adminResponse.ok) {
          const errorData = await adminResponse.json();
          throw new Error(errorData.error?.message || 'Password reset request failed');
        }

        return await adminResponse.json();
      }

      return await userResponse.json();
    } catch (error) {
      throw error;
    }
  };

  // React Query mutation for password reset request
  const requestResetMutation = useMutation({
    mutationFn: (data: ForgetPasswordRequest) => requestPasswordResetAPI(data, false),
    onSuccess: (response) => {
      setShowAlert(false);
      
      // Check if response contains security question
      if ('securityQuestion' in response) {
        setHasSecurityQuestion(true);
        setSecurityQuestion(response.securityQuestion);
        securityQuestionForm.setValue('securityQuestion', response.securityQuestion);
      } else {
        // Show success message for email sent
        setAlertMsg('Password reset instructions have been sent to your email address.');
        setAlertType('success');
        setShowAlert(true);
      }
    },
    onError: (error: Error) => {
      setAlertMsg(error.message);
      setAlertType('error');
      setShowAlert(true);
    },
  });

  // React Query mutation for password reset with security question
  const resetPasswordMutation = useMutation({
    mutationFn: (data: ResetFormData) => requestPasswordResetAPI(data, true),
    onSuccess: async () => {
      setShowAlert(false);
      
      // Attempt automatic login after successful password reset
      try {
        const credentials: LoginCredentials = {
          password: securityQuestionForm.getValues('newPassword'),
        };

        if (loginAttribute === 'username') {
          credentials.username = forgotPasswordForm.getValues('username');
        } else {
          credentials.email = forgotPasswordForm.getValues('email');
        }

        await login(credentials);
        router.push('/');
      } catch (loginError) {
        // If auto-login fails, redirect to login page
        router.push('/login');
      }
    },
    onError: (error: Error) => {
      setAlertMsg(error.message);
      setAlertType('error');
      setShowAlert(true);
    },
  });

  // Handle initial password reset request
  const handleRequestReset = (data: ForgotPasswordFormData) => {
    const requestData: ForgetPasswordRequest = {};
    
    if (loginAttribute === 'username') {
      requestData.username = data.username;
    } else {
      requestData.email = data.email;
    }

    requestResetMutation.mutate(requestData);
  };

  // Handle password reset with security question
  const handleResetPassword = (data: SecurityQuestionFormData) => {
    const resetData: ResetFormData = {
      ...forgotPasswordForm.getValues(),
      ...data,
    };

    resetPasswordMutation.mutate(resetData);
  };

  // Handle back to login navigation
  const handleBackToLogin = () => {
    router.push('/login');
  };

  // Loading state for either mutation
  const isLoading = requestResetMutation.isPending || resetPasswordMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Alert Component */}
          {showAlert && (
            <Alert 
              variant={alertType} 
              className="mb-6"
              onClose={() => setShowAlert(false)}
            >
              {alertMsg}
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {hasSecurityQuestion 
                ? 'Answer your security question to reset your password'
                : `Enter your ${loginAttribute} to receive reset instructions`
              }
            </p>
          </div>

          <div className="border-t border-gray-200 mb-6"></div>

          {/* Initial Password Reset Form */}
          {!hasSecurityQuestion && (
            <Form {...forgotPasswordForm}>
              <form 
                onSubmit={forgotPasswordForm.handleSubmit(handleRequestReset)}
                className="space-y-6"
              >
                {loginAttribute === 'email' ? (
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email address"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={forgotPasswordForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Enter your username"
                            autoComplete="username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Request Password Reset'}
                </Button>
              </form>
            </Form>
          )}

          {/* Security Question Form */}
          {hasSecurityQuestion && (
            <Form {...securityQuestionForm}>
              <form 
                onSubmit={securityQuestionForm.handleSubmit(handleResetPassword)}
                className="space-y-6"
              >
                <FormField
                  control={securityQuestionForm.control}
                  name="securityQuestion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Question</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          readOnly
                          className="bg-gray-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={securityQuestionForm.control}
                  name="securityAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Answer</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your security answer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={securityQuestionForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your new password (minimum 16 characters)"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={securityQuestionForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </Form>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={handleBackToLogin}
              className="inline-flex items-center text-sm"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}