/**
 * User Registration Form Component for DreamFactory Admin Interface
 * 
 * React registration form component implementing self-registration workflow with profile details
 * collection, email validation, and completion confirmation. Migrated from Angular df-register
 * component to use React Hook Form with nested form groups, Zod validation, and responsive
 * Tailwind CSS design.
 * 
 * Key Features:
 * - React Hook Form with nested form group validation for profile details
 * - Dynamic field validation based on system configuration (email vs username-based registration)
 * - Registration completion flow with success confirmation and login page navigation
 * - Responsive form design with proper error message display and accessibility features
 * - Integration with authentication API endpoints maintaining existing registration flow
 * - Loading states during registration API calls with proper user feedback
 * - Form reset and error handling for registration failures with actionable error messages
 * 
 * @fileoverview Registration form component with comprehensive validation and accessibility
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/use-auth';
import { useSystemConfig } from '@/hooks/use-system-config';
import { 
  createRegistrationSchema, 
  getFieldRequirements,
  type RegistrationFormData,
  type ProfileDetailsFormData,
} from '@/lib/auth-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { AuthError } from '@/types/auth';

// =============================================================================
// COMPONENT INTERFACES AND TYPES
// =============================================================================

/**
 * Registration form component props
 * Minimal interface for clean component composition
 */
export interface RegisterFormProps {
  /**
   * Additional CSS classes for styling customization
   */
  className?: string;
  
  /**
   * Custom callback when registration is successful
   * Useful for tracking analytics or custom navigation
   */
  onRegistrationSuccess?: (userData: ProfileDetailsFormData) => void;
  
  /**
   * Custom callback when registration fails
   * Enables custom error handling or logging
   */
  onRegistrationError?: (error: AuthError) => void;
}

/**
 * Profile details form field component props
 * Encapsulates individual form field rendering
 */
interface ProfileFieldProps {
  name: keyof ProfileDetailsFormData;
  label: string;
  type?: 'text' | 'email';
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  autoComplete?: string;
  'data-testid'?: string;
}

// =============================================================================
// PROFILE DETAILS FORM FIELDS COMPONENT
// =============================================================================

/**
 * ProfileDetailsFields component rendering all profile form fields
 * Replaces the Angular df-profile-details component with React implementation
 * 
 * Features:
 * - Dynamic field requirements based on system configuration
 * - WCAG 2.1 AA compliant form labels and error messaging
 * - Real-time validation with React Hook Form integration
 * - Responsive design with consistent field spacing
 * - Accessibility enhancements including proper ARIA attributes
 */
const ProfileDetailsFields: React.FC<{
  loginAttribute: 'email' | 'username';
  fieldRequirements: ReturnType<typeof getFieldRequirements>;
}> = ({ loginAttribute, fieldRequirements }) => {
  
  /**
   * Profile form field configuration
   * Matches Angular template structure with enhanced accessibility
   */
  const profileFields: ProfileFieldProps[] = [
    {
      name: 'username',
      label: fieldRequirements.usernameRequired ? 'Username' : 'Username (Optional)',
      type: 'text',
      required: fieldRequirements.usernameRequired,
      optional: fieldRequirements.usernameOptional,
      placeholder: 'Enter your username',
      autoComplete: 'username',
      'data-testid': 'registration-username-input',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: fieldRequirements.emailRequired,
      optional: fieldRequirements.emailOptional,
      placeholder: 'Enter your email address',
      autoComplete: 'email',
      'data-testid': 'registration-email-input',
    },
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your first name',
      autoComplete: 'given-name',
      'data-testid': 'registration-first-name-input',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your last name',
      autoComplete: 'family-name',
      'data-testid': 'registration-last-name-input',
    },
    {
      name: 'name',
      label: 'Display Name',
      type: 'text',
      required: true,
      placeholder: 'Enter your display name',
      autoComplete: 'name',
      'data-testid': 'registration-display-name-input',
    },
  ];

  return (
    <div className="space-y-4">
      {profileFields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Input
            name={`profileDetailsGroup.${field.name}`}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            required={field.required}
            data-testid={field['data-testid']}
            className="w-full"
            size="md"
            variant="outline"
          />
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// MAIN REGISTRATION FORM COMPONENT
// =============================================================================

/**
 * RegisterForm component implementing complete user registration workflow
 * 
 * Replaces Angular df-register component with React implementation featuring:
 * - React Hook Form with Zod schema validation
 * - System configuration-aware field validation
 * - Registration completion flow with success state
 * - Comprehensive error handling with user-friendly messages
 * - Loading states during API operations
 * - WCAG 2.1 AA accessibility compliance
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <RegisterForm />
 * 
 * // With custom callbacks
 * <RegisterForm
 *   onRegistrationSuccess={(userData) => {
 *     analytics.track('User Registered', userData);
 *   }}
 *   onRegistrationError={(error) => {
 *     logger.error('Registration failed', error);
 *   }}
 * />
 * ```
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({
  className,
  onRegistrationSuccess,
  onRegistrationError,
}) => {
  // =============================================================================
  // STATE AND HOOKS
  // =============================================================================

  const { register, isLoading: authLoading } = useAuth();
  const { environment, isLoading: configLoading } = useSystemConfig();
  
  // Registration completion state
  const [isComplete, setIsComplete] = useState(false);
  const [registeredUserData, setRegisteredUserData] = useState<ProfileDetailsFormData | null>(null);
  
  // Error state management
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // System configuration derived state
  const loginAttribute = environment?.authentication?.loginAttribute || 'email';
  const fieldRequirements = getFieldRequirements(loginAttribute);
  const registrationSchema = createRegistrationSchema(loginAttribute);

  // =============================================================================
  // FORM CONFIGURATION
  // =============================================================================

  /**
   * React Hook Form configuration with Zod validation
   * Provides real-time validation with performance under 100ms
   */
  const formMethods = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange', // Real-time validation for immediate feedback
    reValidateMode: 'onChange',
    defaultValues: {
      profileDetailsGroup: {
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        name: '',
      },
    },
  });

  const {
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
    reset,
    setValue,
  } = formMethods;

  // =============================================================================
  // FORM FIELD EFFECTS
  // =============================================================================

  /**
   * Auto-generate display name from first and last name
   * Provides user-friendly default while allowing customization
   */
  const firstName = watch('profileDetailsGroup.firstName');
  const lastName = watch('profileDetailsGroup.lastName');

  useEffect(() => {
    if (firstName && lastName) {
      const displayName = `${firstName} ${lastName}`.trim();
      setValue('profileDetailsGroup.name', displayName, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [firstName, lastName, setValue]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Registration form submission handler
   * Processes user registration with comprehensive error handling
   */
  const onSubmit = useCallback(async (data: RegistrationFormData) => {
    try {
      // Clear any existing errors
      setRegistrationError(null);
      setShowError(false);

      // Extract profile details for registration
      const profileData = data.profileDetailsGroup;
      
      // Validate required fields based on system configuration
      if (fieldRequirements.emailRequired && !profileData.email) {
        throw new Error('Email address is required for registration');
      }
      
      if (fieldRequirements.usernameRequired && !profileData.username) {
        throw new Error('Username is required for registration');
      }

      // Call authentication service register method
      await register(profileData);

      // Registration successful - update state
      setRegisteredUserData(profileData);
      setIsComplete(true);
      
      // Call success callback if provided
      onRegistrationSuccess?.(profileData);

    } catch (error) {
      console.error('Registration failed:', error);
      
      // Extract user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Registration failed. Please try again.';
      
      setRegistrationError(errorMessage);
      setShowError(true);
      
      // Call error callback if provided
      if (onRegistrationError && error instanceof Error) {
        onRegistrationError({
          code: 'REGISTRATION_FAILED',
          message: errorMessage,
          timestamp: new Date().toISOString(),
        } as AuthError);
      }
    }
  }, [register, fieldRequirements, onRegistrationSuccess, onRegistrationError]);

  /**
   * Error alert dismissal handler
   * Clears error state when user dismisses alert
   */
  const handleErrorDismiss = useCallback(() => {
    setShowError(false);
    setRegistrationError(null);
  }, []);

  /**
   * Form reset handler for starting new registration
   * Allows user to register another account if needed
   */
  const handleStartNewRegistration = useCallback(() => {
    setIsComplete(false);
    setRegisteredUserData(null);
    setRegistrationError(null);
    setShowError(false);
    reset();
  }, [reset]);

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  // Show loading spinner while system configuration is loading
  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading registration form...</span>
      </div>
    );
  }

  // =============================================================================
  // REGISTRATION COMPLETION STATE
  // =============================================================================

  /**
   * Registration success state component
   * Displays completion confirmation with navigation options
   */
  if (isComplete && registeredUserData) {
    return (
      <div className={cn("w-full max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700", className)}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Registration Successful
          </h1>
        </div>
        
        <div className="px-6 py-6 space-y-6">
          <div className="text-center space-y-4">
            {/* Success icon */}
            <div className="mx-auto w-12 h-12 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            
            {/* Success message */}
            <div className="space-y-2">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Welcome, {registeredUserData.name}!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your account has been successfully created. You can now log in to access the DreamFactory Admin Interface.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button 
                className="w-full" 
                size="lg"
                data-testid="login-redirect-button"
              >
                Go to Login
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full" 
              size="lg"
              onClick={handleStartNewRegistration}
              data-testid="new-registration-button"
            >
              Register Another Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // REGISTRATION FORM RENDER
  // =============================================================================

  return (
    <div className={cn("w-full max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700", className)}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Create Account
        </h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          Register for a new DreamFactory account
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Error Alert */}
        {showError && registrationError && (
          <div className="mb-6">
            <Alert type="error" dismissible onDismiss={handleErrorDismiss}>
              <Alert.Icon />
              <Alert.Content>
                <Alert.Title>Registration Failed</Alert.Title>
                <Alert.Description>
                  {registrationError}
                </Alert.Description>
              </Alert.Content>
            </Alert>
          </div>
        )}

        {/* Registration Form */}
        <FormProvider {...formMethods}>
          <form 
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
            data-testid="registration-form"
          >
            {/* Profile Details Section */}
            <fieldset className="space-y-4">
              <legend className="sr-only">Profile Details</legend>
              <ProfileDetailsFields 
                loginAttribute={loginAttribute}
                fieldRequirements={fieldRequirements}
              />
            </fieldset>

            {/* Form Validation Summary for Screen Readers */}
            {Object.keys(errors.profileDetailsGroup || {}).length > 0 && (
              <div 
                role="alert" 
                aria-live="polite"
                className="sr-only"
                data-testid="form-errors-summary"
              >
                There are {Object.keys(errors.profileDetailsGroup || {}).length} errors in the form. Please review and correct them.
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isSubmitting || authLoading}
              disabled={!isValid || isSubmitting || authLoading}
              data-testid="register-submit-button"
              aria-describedby="submit-button-help"
            >
              {isSubmitting || authLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Submit Button Help Text */}
            <p 
              id="submit-button-help"
              className="text-xs text-gray-500 dark:text-gray-400 text-center"
            >
              By creating an account, you agree to the terms of service and privacy policy.
            </p>
          </form>
        </FormProvider>

        {/* Navigation Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              data-testid="login-link"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// COMPONENT DISPLAY NAME AND EXPORTS
// =============================================================================

RegisterForm.displayName = 'RegisterForm';

export default RegisterForm;

// Export types for external usage
export type { RegisterFormProps, ProfileDetailsFormData };