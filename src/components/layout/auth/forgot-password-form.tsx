'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import type { ForgetPasswordRequest, SecurityQuestion } from '@/types/auth';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Schema for initial password reset request form
 * Dynamically validates email or username based on system configuration
 */
const createInitialFormSchema = (loginAttribute: string) => {
  if (loginAttribute === 'username') {
    return z.object({
      username: z.string().min(1, 'Username is required'),
      email: z.string().optional(),
    });
  }
  
  return z.object({
    email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
    username: z.string().optional(),
  });
};

/**
 * Schema for security question form with password validation
 */
const securityQuestionFormSchema = z.object({
  securityQuestion: z.string().min(1, 'Security question is required'),
  securityAnswer: z.string().min(1, 'Security answer is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type definitions for form data
type InitialFormData = {
  email?: string;
  username?: string;
};

type SecurityQuestionFormData = {
  securityQuestion: string;
  securityAnswer: string;
  newPassword: string;
  confirmPassword: string;
};

// =============================================================================
// API RESPONSE INTERFACES
// =============================================================================

interface PasswordResetResponse {
  success: boolean;
  message: string;
  securityQuestion?: string;
}

interface PasswordResetWithSecurityRequest extends ForgetPasswordRequest {
  securityQuestion?: string;
  securityAnswer?: string;
  newPassword?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * React forgot password form component implementing two-step password reset workflow
 * 
 * Features:
 * - Dynamic form field switching between email and username based on system configuration
 * - Two-step password reset workflow with initial request and optional security question forms
 * - Real-time validation with proper error messaging for invalid email/username formats
 * - Security question form display when backend requires additional verification
 * - Integration with password reset API endpoints maintaining existing backend contracts
 * - Loading states and success/error messaging with proper user feedback
 * - Responsive design ensuring accessibility and mobile compatibility
 * 
 * Migrated from Angular df-forgot-password component to use:
 * - React Hook Form instead of Angular reactive forms
 * - React Query mutations instead of RxJS switchMap and catchError patterns
 * - Conditional JSX rendering instead of Angular template conditional rendering (NgIf)
 * - Next.js useRouter instead of Angular router navigation
 * - Custom alert component instead of Angular alert system
 * - Tailwind CSS and Headless UI instead of Angular Material
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const { forgotPassword, login } = useAuth();
  const { environment } = useSystemConfig();
  
  // Component state
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [hasSecurityQuestion, setHasSecurityQuestion] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState('');
  
  // Extract login attribute from system configuration
  const loginAttribute = environment?.authentication?.loginAttribute || 'email';
  
  // Initial password reset request form
  const initialForm = useForm<InitialFormData>({
    resolver: zodResolver(createInitialFormSchema(loginAttribute)),
    mode: 'onChange',
    defaultValues: {
      email: '',
      username: '',
    },
  });
  
  // Security question form for second step
  const securityForm = useForm<SecurityQuestionFormData>({
    resolver: zodResolver(securityQuestionFormSchema),
    mode: 'onChange',
    defaultValues: {
      securityQuestion: '',
      securityAnswer: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // =============================================================================
  // API MUTATIONS
  // =============================================================================
  
  /**
   * Initial password reset request mutation
   * Handles the first step of password reset - requesting reset via email/username
   */
  const requestResetMutation = useMutation({
    mutationFn: async (request: ForgetPasswordRequest): Promise<PasswordResetResponse> => {
      const response = await forgotPassword(request);
      return response as PasswordResetResponse;
    },
    onSuccess: (response) => {
      setShowAlert(false);
      
      if (response.securityQuestion) {
        // Security question required - proceed to second step
        setHasSecurityQuestion(true);
        setSecurityQuestion(response.securityQuestion);
        securityForm.setValue('securityQuestion', response.securityQuestion);
      } else {
        // Password reset email sent successfully
        setAlertMessage(response.message || 'Password reset email has been sent to your email address.');
        setAlertType('success');
        setShowAlert(true);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error?.error?.message || 'An error occurred while requesting password reset.';
      setAlertMessage(errorMessage);
      setAlertType('error');
      setShowAlert(true);
    },
  });
  
  /**
   * Password reset with security question mutation
   * Handles the second step - answering security question and setting new password
   */
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: SecurityQuestionFormData): Promise<PasswordResetResponse> => {
      const initialData = initialForm.getValues();
      const request: PasswordResetWithSecurityRequest = {
        ...initialData,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
        newPassword: data.newPassword,
      };
      
      // Call password reset API with security question data
      const response = await forgotPassword(request as ForgetPasswordRequest);
      return response as PasswordResetResponse;
    },
    onSuccess: async (response, variables) => {
      setShowAlert(false);
      
      try {
        // Automatically log in user with new password
        const initialData = initialForm.getValues();
        const loginCredentials = {
          password: variables.newPassword,
          ...(loginAttribute === 'username' 
            ? { username: initialData.username } 
            : { email: initialData.email }
          ),
        };
        
        await login(loginCredentials);
        
        // Navigate to dashboard after successful login
        router.push('/');
      } catch (loginError) {
        // If auto-login fails, show success message and redirect to login
        setAlertMessage('Password reset successful. Please log in with your new password.');
        setAlertType('success');
        setShowAlert(true);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error?.error?.message || 'An error occurred while resetting your password.';
      setAlertMessage(errorMessage);
      setAlertType('error');
      setShowAlert(true);
    },
  });
  
  // =============================================================================
  // FORM HANDLERS
  // =============================================================================
  
  /**
   * Handle initial password reset request submission
   */
  const handleRequestReset = useCallback((data: InitialFormData) => {
    if (!initialForm.formState.isValid) {
      return;
    }
    
    const request: ForgetPasswordRequest = loginAttribute === 'username'
      ? { username: data.username }
      : { email: data.email };
    
    requestResetMutation.mutate(request);
  }, [initialForm.formState.isValid, loginAttribute, requestResetMutation]);
  
  /**
   * Handle security question form submission
   */
  const handleResetPassword = useCallback((data: SecurityQuestionFormData) => {
    if (!securityForm.formState.isValid) {
      return;
    }
    
    resetPasswordMutation.mutate(data);
  }, [securityForm.formState.isValid, resetPasswordMutation]);
  
  /**
   * Handle back to login navigation
   */
  const handleBackToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);
  
  /**
   * Close alert message
   */
  const handleCloseAlert = useCallback(() => {
    setShowAlert(false);
    setAlertMessage('');
  }, []);
  
  // =============================================================================
  // LOADING STATES
  // =============================================================================
  
  const isInitialLoading = requestResetMutation.isPending;
  const isSecurityLoading = resetPasswordMutation.isPending;
  const isLoading = isInitialLoading || isSecurityLoading;
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Alert Component */}
        {showAlert && (
          <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
            alertType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{alertMessage}</p>
              <button
                onClick={handleCloseAlert}
                className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close alert"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Password Reset
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Initial Password Reset Form */}
          {!hasSecurityQuestion && (
            <form onSubmit={initialForm.handleSubmit(handleRequestReset)} className="space-y-4">
              {/* Email Field (when login attribute is email) */}
              {loginAttribute === 'email' && (
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...initialForm.register('email')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      initialForm.formState.errors.email
                        ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Enter your email address"
                    disabled={isLoading}
                  />
                  {initialForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {initialForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              )}
              
              {/* Username Field (when login attribute is username) */}
              {loginAttribute === 'username' && (
                <div>
                  <label 
                    htmlFor="username" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    {...initialForm.register('username')}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      initialForm.formState.errors.username
                        ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                  {initialForm.formState.errors.username && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {initialForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !initialForm.formState.isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isInitialLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Request...
                  </div>
                ) : (
                  'Request Password Reset'
                )}
              </button>
            </form>
          )}
          
          {/* Security Question Form */}
          {hasSecurityQuestion && (
            <form onSubmit={securityForm.handleSubmit(handleResetPassword)} className="space-y-4">
              {/* Security Question (Read-only) */}
              <div>
                <label 
                  htmlFor="securityQuestion" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Security Question
                </label>
                <input
                  id="securityQuestion"
                  type="text"
                  {...securityForm.register('securityQuestion')}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                />
              </div>
              
              {/* Security Answer */}
              <div>
                <label 
                  htmlFor="securityAnswer" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Security Answer
                </label>
                <input
                  id="securityAnswer"
                  type="text"
                  {...securityForm.register('securityAnswer')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    securityForm.formState.errors.securityAnswer
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter your security answer"
                  disabled={isLoading}
                />
                {securityForm.formState.errors.securityAnswer && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {securityForm.formState.errors.securityAnswer.message}
                  </p>
                )}
              </div>
              
              {/* New Password */}
              <div>
                <label 
                  htmlFor="newPassword" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  {...securityForm.register('newPassword')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    securityForm.formState.errors.newPassword
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Enter your new password"
                  disabled={isLoading}
                />
                {securityForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {securityForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              
              {/* Confirm Password */}
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...securityForm.register('confirmPassword')}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    securityForm.formState.errors.confirmPassword
                      ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                />
                {securityForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {securityForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !securityForm.formState.isValid}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSecurityLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
          
          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackToLogin}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors focus:outline-none focus:underline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;