'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import { createRegisterSchema, ValidationUtils, type RegisterFormData } from '../validation';
import type { 
  RegistrationFormDetails,
  RegisterComponentProps,
  RegisterComponentState,
  FormSubmissionResult 
} from '../types';

/**
 * @fileoverview React registration form component with comprehensive validation and accessibility
 * 
 * Implements React Hook Form with Zod schema validation for real-time user input validation
 * under 100ms performance requirement. Replaces Angular reactive forms with modern React
 * patterns using Tailwind CSS styling and comprehensive error handling.
 * 
 * Key Features:
 * - React Hook Form with Zod schema validators for all user inputs
 * - Real-time validation under 100ms performance requirement
 * - React Query integration for authentication service calls
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Comprehensive error handling and loading states
 * - Password strength validation with visual feedback
 * - Responsive design with Tailwind CSS
 * - Integration with authentication hooks and system configuration
 * 
 * @requires react@19.0.0
 * @requires next@15.1.0
 * @requires react-hook-form@7.52.0
 * @requires zod@3.22.0
 * @requires @tanstack/react-query@5.0.0
 */

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

const PASSWORD_STRENGTH_COLORS = {
  0: 'bg-red-500',
  1: 'bg-red-400',
  2: 'bg-yellow-500',
  3: 'bg-blue-500',
  4: 'bg-green-500',
} as const;

const PASSWORD_STRENGTH_LABELS = {
  0: 'Very Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Very Strong',
} as const;

const VALIDATION_DEBOUNCE_MS = 50; // Ensure validation happens under 100ms

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate password strength score based on multiple criteria
 */
function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} {
  if (!password) {
    return { score: 0, feedback: ['Password is required'], isValid: false };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 16) {
    score += 1;
  } else {
    feedback.push('Use at least 16 characters');
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Include numbers');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Include special characters (@$!%*?&)');

  // Additional complexity checks for higher scores
  if (password.length >= 20) score += 0.5;
  if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 0.5; // Additional special chars

  const finalScore = Math.min(4, Math.floor(score));
  const isValid = finalScore >= 4 && password.length >= 16;

  return {
    score: finalScore,
    feedback: feedback.length > 0 ? feedback : ['Password meets security requirements'],
    isValid,
  };
}

/**
 * Debounced validation function for performance optimization
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Registration form component with comprehensive validation and accessibility
 */
export function RegisterForm({
  className = '',
  initialValues = {},
  requireEmailVerification = true,
  onSuccess,
  onError,
  onSubmit: customOnSubmit,
  redirectOnSuccess = true,
  redirectTo = '/login',
  disabled = false,
  loading: externalLoading = false,
  'data-testid': testId = 'register-form',
}: RegisterComponentProps) {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================

  const { register: authRegister, isLoading: authLoading, error: authError, clearError } = useAuth();
  const { environment, isLoading: configLoading } = useSystemConfig();

  // Component state
  const [componentState, setComponentState] = useState<RegisterComponentState>({
    formData: initialValues,
    errors: {},
    isSubmitting: false,
    showPasswords: false,
    passwordStrength: {
      score: 0,
      feedback: [],
      isValid: false,
    },
    requiresEmailVerification: requireEmailVerification,
    verificationSent: false,
    currentStep: 'form',
  });

  // Form validation schema based on system configuration
  const validationSchema = useMemo(() => {
    const loginAttribute = environment?.authentication?.loginAttribute || 'email';
    return createRegisterSchema(loginAttribute as 'email' | 'username').extend({
      password: createRegisterSchema(loginAttribute as 'email' | 'username')
        .shape.password
        .refine(
          (password) => calculatePasswordStrength(password).isValid,
          'Password does not meet security requirements'
        ),
      confirmPassword: createRegisterSchema(loginAttribute as 'email' | 'username').shape.confirmPassword,
      acceptTerms: createRegisterSchema(loginAttribute as 'email' | 'username')
        .shape.acceptTerms
        .refine((value) => value === true, 'You must accept the terms of service'),
    }).refine(
      (data) => data.password === data.confirmPassword,
      {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      }
    );
  }, [environment?.authentication?.loginAttribute]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty, touchedFields },
    setError,
    clearErrors,
    reset,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(validationSchema),
    mode: 'onChange', // Real-time validation
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: initialValues.firstName || '',
      lastName: initialValues.lastName || '',
      name: initialValues.name || '',
      email: initialValues.email || '',
      username: initialValues.username || '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      subscribeNewsletter: false,
      ...initialValues,
    },
  });

  // Watch password for strength calculation
  const watchedPassword = watch('password');
  const debouncedPassword = useDebounce(watchedPassword, VALIDATION_DEBOUNCE_MS);

  // Password strength calculation with debouncing
  const passwordStrength = useMemo(() => {
    return calculatePasswordStrength(debouncedPassword || '');
  }, [debouncedPassword]);

  // Update component state when password strength changes
  useEffect(() => {
    setComponentState(prev => ({
      ...prev,
      passwordStrength,
    }));
  }, [passwordStrength]);

  // =============================================================================
  // REGISTRATION MUTATION
  // =============================================================================

  const registrationMutation = useMutation({
    mutationFn: async (formData: RegisterFormData): Promise<FormSubmissionResult<any>> => {
      const startTime = performance.now();

      try {
        const registrationDetails: RegistrationFormDetails = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: formData.name,
          email: formData.email!,
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          acceptTerms: formData.acceptTerms,
          subscribeNewsletter: formData.subscribeNewsletter,
        };

        // Use custom submit handler if provided, otherwise use auth service
        if (customOnSubmit) {
          const result = await customOnSubmit(registrationDetails);
          return {
            success: true,
            data: result,
            metadata: {
              timestamp: new Date(),
              duration: performance.now() - startTime,
            },
          };
        } else {
          await authRegister(registrationDetails);
          return {
            success: true,
            data: registrationDetails,
            metadata: {
              timestamp: new Date(),
              duration: performance.now() - startTime,
            },
          };
        }
      } catch (error: any) {
        const duration = performance.now() - startTime;

        // Handle validation errors
        if (error?.fieldErrors) {
          Object.entries(error.fieldErrors).forEach(([field, fieldError]) => {
            setError(field as keyof RegisterFormData, {
              type: 'server',
              message: (fieldError as any)?.message || 'Invalid value',
            });
          });
        }

        throw {
          success: false,
          message: error?.message || 'Registration failed',
          fieldErrors: error?.fieldErrors,
          metadata: {
            timestamp: new Date(),
            duration,
          },
        };
      }
    },
    onMutate: () => {
      setComponentState(prev => ({ ...prev, isSubmitting: true }));
      clearError(); // Clear auth errors
    },
    onSuccess: (result) => {
      setComponentState(prev => ({
        ...prev,
        isSubmitting: false,
        verificationSent: requireEmailVerification,
        currentStep: requireEmailVerification ? 'verification' : 'complete',
      }));

      onSuccess?.(result as any);

      // Handle redirect
      if (redirectOnSuccess && !requireEmailVerification) {
        window.location.href = redirectTo;
      }
    },
    onError: (error: any) => {
      setComponentState(prev => ({ ...prev, isSubmitting: false }));
      onError?.(error);
    },
  });

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleFormSubmit = useCallback(async (data: RegisterFormData) => {
    await registrationMutation.mutateAsync(data);
  }, [registrationMutation]);

  const togglePasswordVisibility = useCallback(() => {
    setComponentState(prev => ({ ...prev, showPasswords: !prev.showPasswords }));
  }, []);

  const handleFieldChange = useCallback(async (fieldName: keyof RegisterFormData) => {
    // Debounced validation trigger for performance
    const timeoutId = setTimeout(async () => {
      await trigger(fieldName);
    }, VALIDATION_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [trigger]);

  // =============================================================================
  // COMPONENT STATE DERIVED VALUES
  // =============================================================================

  const isLoading = authLoading || configLoading || externalLoading || componentState.isSubmitting;
  const hasErrors = Object.keys(errors).length > 0 || !!authError;
  const canSubmit = isValid && isDirty && !isLoading && passwordStrength.isValid;

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderPasswordStrengthIndicator = () => (
    <div className="mt-2" role="progressbar" aria-valuenow={passwordStrength.score} aria-valuemax={4} aria-label="Password strength">
      <div className="flex space-x-1 mb-2">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              level <= passwordStrength.score 
                ? PASSWORD_STRENGTH_COLORS[passwordStrength.score as keyof typeof PASSWORD_STRENGTH_COLORS]
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${
          passwordStrength.score >= 3 ? 'text-green-600' : 
          passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {PASSWORD_STRENGTH_LABELS[passwordStrength.score as keyof typeof PASSWORD_STRENGTH_LABELS]}
        </span>
        {passwordStrength.isValid && (
          <CheckCircleIcon className="w-4 h-4 text-green-500" aria-label="Password requirements met" />
        )}
      </div>
      {passwordStrength.feedback.length > 0 && (
        <ul className="mt-1 text-xs text-gray-600" role="list">
          {passwordStrength.feedback.map((feedback, index) => (
            <li key={index} className="flex items-center space-x-1">
              {passwordStrength.isValid ? (
                <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : (
                <XCircleIcon className="w-3 h-3 text-red-500 flex-shrink-0" />
              )}
              <span>{feedback}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderErrorAlert = () => {
    if (!authError && !registrationMutation.error) return null;

    const error = authError || registrationMutation.error;
    return (
      <div 
        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
        role="alert"
        aria-live="polite"
      >
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
          <p className="mt-1 text-sm text-red-700">
            {(error as any)?.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>
    );
  };

  const renderSuccessMessage = () => {
    if (componentState.currentStep !== 'verification' && componentState.currentStep !== 'complete') {
      return null;
    }

    return (
      <div 
        className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3"
        role="alert"
        aria-live="polite"
      >
        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-green-800">
            {componentState.currentStep === 'verification' ? 'Registration Successful' : 'Account Created'}
          </h3>
          <p className="mt-1 text-sm text-green-700">
            {componentState.currentStep === 'verification' 
              ? 'Please check your email for verification instructions.'
              : 'Your account has been created successfully. You can now sign in.'
            }
          </p>
        </div>
      </div>
    );
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  // Show success/verification message if registration is complete
  if (componentState.currentStep === 'verification' || componentState.currentStep === 'complete') {
    return (
      <div className={`max-w-md mx-auto ${className}`} data-testid={`${testId}-success`}>
        {renderSuccessMessage()}
        <div className="text-center">
          <a 
            href={redirectTo}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Return to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`} data-testid={testId}>
      <form 
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-6"
        noValidate
        aria-label="User registration form"
      >
        {renderErrorAlert()}

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="firstName"
                  autoComplete="given-name"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.firstName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                  disabled={disabled || isLoading}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('firstName');
                  }}
                />
              )}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="lastName"
                  autoComplete="family-name"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.lastName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                  disabled={disabled || isLoading}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('lastName');
                  }}
                />
              )}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name *
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                id="name"
                autoComplete="name"
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                disabled={disabled || isLoading}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('name');
                }}
              />
            )}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="email"
                id="email"
                autoComplete="email"
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={disabled || isLoading}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange('email');
                }}
              />
            )}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Username (if required by system config) */}
        {environment?.authentication?.loginAttribute === 'username' && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  id="username"
                  autoComplete="username"
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  disabled={disabled || isLoading}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('username');
                  }}
                />
              )}
            />
            {errors.username && (
              <p id="username-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type={componentState.showPasswords ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.password}
                  aria-describedby={`password-error password-strength`}
                  disabled={disabled || isLoading}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('password');
                  }}
                />
              )}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={togglePasswordVisibility}
              aria-label={componentState.showPasswords ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {componentState.showPasswords ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.password.message}
            </p>
          )}
          <div id="password-strength">
            {renderPasswordStrengthIndicator()}
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type={componentState.showPasswords ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  disabled={disabled || isLoading}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('confirmPassword');
                  }}
                />
              )}
            />
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={value}
                  onChange={(e) => {
                    onChange(e.target.checked);
                    handleFieldChange('acceptTerms');
                  }}
                  className={`mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                    errors.acceptTerms ? 'border-red-300' : 'border-gray-300'
                  }`}
                  aria-invalid={!!errors.acceptTerms}
                  aria-describedby={errors.acceptTerms ? 'acceptTerms-error' : undefined}
                  disabled={disabled || isLoading}
                />
              )}
            />
            <span className="text-sm text-gray-700">
              I accept the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500 underline" target="_blank">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500 underline" target="_blank">
                Privacy Policy
              </a>{' '}
              *
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        {/* Newsletter Subscription */}
        <div>
          <label className="flex items-start space-x-3 cursor-pointer">
            <Controller
              name="subscribeNewsletter"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={disabled || isLoading}
                />
              )}
            />
            <span className="text-sm text-gray-700">
              Subscribe to our newsletter for updates and announcements
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            } ${isLoading ? 'opacity-75' : ''}`}
            aria-describedby="submit-help"
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Creating Account...</span>
              </span>
            ) : (
              'Create Account'
            )}
          </button>
          <p id="submit-help" className="mt-2 text-xs text-gray-500 text-center">
            * Required fields
          </p>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default RegisterForm;