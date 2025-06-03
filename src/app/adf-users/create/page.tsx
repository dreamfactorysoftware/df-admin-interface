'use client';

/**
 * User Creation Page Component
 * 
 * Next.js page component for creating new users implementing React Hook Form 
 * with Zod validation, SWR data fetching, and comprehensive user profile 
 * creation workflow. Replaces Angular df-user-details component create 
 * functionality with React 19 server components, form validation, role 
 * assignment, and invitation dispatch capabilities following Next.js app 
 * router conventions.
 * 
 * Features:
 * - React Hook Form with Zod schema validators for real-time validation
 * - SWR-backed data synchronization for instant updates
 * - Tailwind CSS responsive design with Headless UI components
 * - WCAG 2.1 AA compliance with proper ARIA attributes
 * - Comprehensive error handling and loading states
 * - Role assignment and invitation workflow integration
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR, { mutate } from 'swr';
import { z } from 'zod';
import {
  CheckIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  EnvelopeIcon,
  KeyIcon,
  UserIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

// Type imports
import type {
  UserProfile,
  UserRegistrationForm,
  UserRole,
  UserApp,
  UserAppRole,
  ApiResponse,
  NotificationPreferences,
} from '@/types/user';

// API client import
import { apiClient } from '@/lib/api-client';

// User registration schema (enhanced for create page)
const createUserSchema = z.object({
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
    
  display_name: z.string()
    .max(100, 'Display name must be less than 100 characters')
    .optional(),
    
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
    
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
    
  phone: z.string()
    .regex(/^[\+]?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
    
  password_confirmation: z.string()
    .min(8, 'Password confirmation is required'),
    
  security_question: z.string()
    .max(255, 'Security question must be less than 255 characters')
    .optional(),
    
  security_answer: z.string()
    .max(255, 'Security answer must be less than 255 characters')
    .optional(),
    
  default_app_id: z.number()
    .int('App ID must be a valid integer')
    .positive('App ID must be positive')
    .optional(),
    
  is_active: z.boolean()
    .default(true),
    
  is_sys_admin: z.boolean()
    .default(false),
    
  send_invitation: z.boolean()
    .default(false),
    
  // Role assignments
  role_assignments: z.array(z.object({
    app_id: z.number().int().positive(),
    role_id: z.number().int().positive(),
  })).default([]),
  
  // Notification preferences
  notification_preferences: z.object({
    email_notifications: z.boolean().default(true),
    system_alerts: z.boolean().default(true),
    api_quota_warnings: z.boolean().default(true),
    security_notifications: z.boolean().default(true),
    maintenance_notifications: z.boolean().default(false),
    newsletter_subscription: z.boolean().default(false),
  }).default({
    email_notifications: true,
    system_alerts: true,
    api_quota_warnings: true,
    security_notifications: true,
    maintenance_notifications: false,
    newsletter_subscription: false,
  }),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
}).refine((data) => {
  // If security question is provided, answer must be provided too
  if (data.security_question && data.security_question.trim() !== '') {
    return data.security_answer && data.security_answer.trim() !== '';
  }
  return true;
}, {
  message: "Security answer is required when security question is provided",
  path: ["security_answer"],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

// Data fetching functions with SWR
const fetcher = async (url: string) => {
  const response = await apiClient.get(url);
  return response;
};

/**
 * Create User Page Component
 */
export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // SWR data fetching for roles and apps
  const { data: rolesData, error: rolesError, isLoading: rolesLoading } = useSWR<ApiResponse<UserRole[]>>(
    '/system/role',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  const { data: appsData, error: appsError, isLoading: appsLoading } = useSWR<ApiResponse<UserApp[]>>(
    '/system/app',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, touchedFields },
    reset,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      is_active: true,
      is_sys_admin: false,
      send_invitation: false,
      role_assignments: [],
      notification_preferences: {
        email_notifications: true,
        system_alerts: true,
        api_quota_warnings: true,
        security_notifications: true,
        maintenance_notifications: false,
        newsletter_subscription: false,
      },
    },
  });

  // Watch form values for conditional logic
  const watchedValues = watch();
  const sendInvitation = watch('send_invitation');
  const isSystemAdmin = watch('is_sys_admin');

  // Available roles and apps
  const availableRoles = rolesData?.data || [];
  const availableApps = appsData?.data || [];

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare user creation payload
      const userPayload = {
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name || `${data.first_name} ${data.last_name}`,
        email: data.email,
        username: data.username,
        phone: data.phone || undefined,
        password: data.password,
        security_question: data.security_question || undefined,
        security_answer: data.security_answer || undefined,
        default_app_id: data.default_app_id || undefined,
        is_active: data.is_active,
        is_sys_admin: data.is_sys_admin,
        notification_preferences: data.notification_preferences,
      };

      // Create user via API
      const createUserResponse = await apiClient.post('/system/user', {
        resource: [userPayload],
      });

      if (!createUserResponse.success) {
        throw new Error(createUserResponse.error?.message || 'Failed to create user');
      }

      const createdUser = createUserResponse.data[0] as UserProfile;
      const userId = createdUser.id;

      // Assign roles if specified and not system admin
      if (!data.is_sys_admin && data.role_assignments.length > 0) {
        const roleAssignments = data.role_assignments.map((assignment) => ({
          user_id: userId,
          app_id: assignment.app_id,
          role_id: assignment.role_id,
        }));

        await apiClient.post('/system/user_to_app_to_role', {
          resource: roleAssignments,
        });
      }

      // Send invitation email if requested
      if (data.send_invitation) {
        try {
          await apiClient.post('/system/admin/password', {
            email: data.email,
            reset: false,
            subject: 'Welcome to DreamFactory Admin Interface',
            body_text: `You have been invited to join the DreamFactory Admin Interface. Please log in with your credentials.`,
          });
        } catch (inviteError) {
          console.warn('User created but invitation email failed:', inviteError);
          // Don't fail the entire operation for invitation errors
        }
      }

      // Invalidate related SWR caches
      await mutate('/system/user');
      await mutate('/system/user_to_app_to_role');

      // Navigate to user list with success message
      router.push('/adf-users?created=true');

    } catch (error) {
      console.error('Create user error:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while creating the user. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  /**
   * Handle step navigation
   */
  const nextStep = useCallback(async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  /**
   * Get fields to validate for each step
   */
  const getFieldsForStep = (step: number): (keyof CreateUserFormData)[] => {
    switch (step) {
      case 1:
        return ['first_name', 'last_name', 'display_name', 'email'];
      case 2:
        return ['username', 'phone', 'password', 'password_confirmation'];
      case 3:
        return ['security_question', 'security_answer', 'default_app_id'];
      case 4:
        return ['is_active', 'is_sys_admin', 'send_invitation', 'role_assignments'];
      default:
        return [];
    }
  };

  /**
   * Add role assignment
   */
  const addRoleAssignment = useCallback(() => {
    const currentAssignments = watch('role_assignments');
    setValue('role_assignments', [
      ...currentAssignments,
      { app_id: 0, role_id: 0 },
    ]);
  }, [setValue, watch]);

  /**
   * Remove role assignment
   */
  const removeRoleAssignment = useCallback((index: number) => {
    const currentAssignments = watch('role_assignments');
    setValue('role_assignments', currentAssignments.filter((_, i) => i !== index));
  }, [setValue, watch]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    router.push('/adf-users');
  }, [router]);

  // Loading state for initial data
  if (rolesLoading || appsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading user creation form...</p>
        </div>
      </div>
    );
  }

  // Error state for initial data
  if (rolesError || appsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Failed to load required data for user creation. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <UserPlusIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                <p className="text-sm text-gray-500">
                  Add a new user to the DreamFactory Admin Interface
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Progress" className="py-4">
            <ol role="list" className="flex items-center">
              {[
                { id: 1, name: 'Basic Information', icon: UserIcon },
                { id: 2, name: 'Authentication', icon: KeyIcon },
                { id: 3, name: 'Security Settings', icon: ShieldCheckIcon },
                { id: 4, name: 'Roles & Preferences', icon: Cog6ToothIcon },
              ].map((step, stepIdx) => (
                <li key={step.id} className={stepIdx !== 3 ? 'pr-8 sm:pr-20' : ''}>
                  <div className="relative">
                    {step.id < currentStep ? (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-blue-600" />
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-200" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-0.5 w-full bg-gray-200" />
                      </div>
                    )}
                    <button
                      className={`relative w-8 h-8 flex items-center justify-center rounded-full ${
                        step.id < currentStep
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : step.id === currentStep
                          ? 'border-2 border-blue-600 bg-white'
                          : 'border-2 border-gray-300 bg-white hover:border-gray-400'
                      }`}
                      onClick={() => setCurrentStep(step.id)}
                      disabled={step.id > currentStep}
                      aria-current={step.id === currentStep ? 'step' : undefined}
                    >
                      {step.id < currentStep ? (
                        <CheckIcon className="w-5 h-5 text-white" aria-hidden="true" />
                      ) : (
                        <step.icon 
                          className={`w-5 h-5 ${
                            step.id === currentStep ? 'text-blue-600' : 'text-gray-500'
                          }`} 
                          aria-hidden="true" 
                        />
                      )}
                    </button>
                    <span className="sr-only">{step.name}</span>
                  </div>
                  <span
                    className={`ml-9 text-sm font-medium ${
                      step.id === currentStep ? 'text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Error Alert */}
          {submitError && (
            <div className="rounded-md bg-red-50 p-4" role="alert">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error Creating User
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{submitError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-500">
                  Enter the user's basic profile information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* First Name */}
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('first_name')}
                    type="text"
                    id="first_name"
                    autoComplete="given-name"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.first_name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter first name"
                    aria-describedby={errors.first_name ? 'first_name-error' : undefined}
                    aria-invalid={errors.first_name ? 'true' : 'false'}
                  />
                  {errors.first_name && (
                    <p className="mt-2 text-sm text-red-600" id="first_name-error" role="alert">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('last_name')}
                    type="text"
                    id="last_name"
                    autoComplete="family-name"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter last name"
                    aria-describedby={errors.last_name ? 'last_name-error' : undefined}
                    aria-invalid={errors.last_name ? 'true' : 'false'}
                  />
                  {errors.last_name && (
                    <p className="mt-2 text-sm text-red-600" id="last_name-error" role="alert">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <input
                    {...register('display_name')}
                    type="text"
                    id="display_name"
                    autoComplete="name"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.display_name ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter display name (optional)"
                    aria-describedby={errors.display_name ? 'display_name-error' : undefined}
                    aria-invalid={errors.display_name ? 'true' : 'false'}
                  />
                  {errors.display_name && (
                    <p className="mt-2 text-sm text-red-600" id="display_name-error" role="alert">
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter email address"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600" id="email-error" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Authentication */}
          {currentStep === 2 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Authentication Credentials</h2>
                <p className="text-sm text-gray-500">
                  Set up the user's login credentials and contact information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    id="username"
                    autoComplete="username"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter username (optional)"
                    aria-describedby={errors.username ? 'username-error' : undefined}
                    aria-invalid={errors.username ? 'true' : 'false'}
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600" id="username-error" role="alert">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    autoComplete="tel"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter phone number (optional)"
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    aria-invalid={errors.phone ? 'true' : 'false'}
                  />
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600" id="phone-error" role="alert">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      className={`block w-full px-3 py-2 pr-10 border ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Enter secure password"
                      aria-describedby={errors.password ? 'password-error' : 'password-help'}
                      aria-invalid={errors.password ? 'true' : 'false'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600" id="password-error" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                  {!errors.password && (
                    <p className="mt-2 text-sm text-gray-500" id="password-help">
                      Must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  )}
                </div>

                {/* Password Confirmation */}
                <div>
                  <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      {...register('password_confirmation')}
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      id="password_confirmation"
                      autoComplete="new-password"
                      className={`block w-full px-3 py-2 pr-10 border ${
                        errors.password_confirmation ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="Confirm password"
                      aria-describedby={errors.password_confirmation ? 'password_confirmation-error' : undefined}
                      aria-invalid={errors.password_confirmation ? 'true' : 'false'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                    >
                      {showPasswordConfirmation ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="mt-2 text-sm text-red-600" id="password_confirmation-error" role="alert">
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Security Settings */}
          {currentStep === 3 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-500">
                  Configure additional security options and default application access.
                </p>
              </div>

              <div className="space-y-6">
                {/* Security Question */}
                <div>
                  <label htmlFor="security_question" className="block text-sm font-medium text-gray-700">
                    Security Question
                  </label>
                  <input
                    {...register('security_question')}
                    type="text"
                    id="security_question"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.security_question ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter a security question (optional)"
                    aria-describedby={errors.security_question ? 'security_question-error' : undefined}
                    aria-invalid={errors.security_question ? 'true' : 'false'}
                  />
                  {errors.security_question && (
                    <p className="mt-2 text-sm text-red-600" id="security_question-error" role="alert">
                      {errors.security_question.message}
                    </p>
                  )}
                </div>

                {/* Security Answer */}
                <div>
                  <label htmlFor="security_answer" className="block text-sm font-medium text-gray-700">
                    Security Answer
                  </label>
                  <input
                    {...register('security_answer')}
                    type="text"
                    id="security_answer"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.security_answer ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Enter security answer (required if question is provided)"
                    aria-describedby={errors.security_answer ? 'security_answer-error' : undefined}
                    aria-invalid={errors.security_answer ? 'true' : 'false'}
                  />
                  {errors.security_answer && (
                    <p className="mt-2 text-sm text-red-600" id="security_answer-error" role="alert">
                      {errors.security_answer.message}
                    </p>
                  )}
                </div>

                {/* Default App */}
                <div>
                  <label htmlFor="default_app_id" className="block text-sm font-medium text-gray-700">
                    Default Application
                  </label>
                  <select
                    {...register('default_app_id', { 
                      setValueAs: (value) => value === '' ? undefined : Number(value) 
                    })}
                    id="default_app_id"
                    className={`mt-1 block w-full px-3 py-2 border ${
                      errors.default_app_id ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    aria-describedby={errors.default_app_id ? 'default_app_id-error' : undefined}
                    aria-invalid={errors.default_app_id ? 'true' : 'false'}
                  >
                    <option value="">Select default application (optional)</option>
                    {availableApps
                      .filter((app) => app.is_active)
                      .map((app) => (
                        <option key={app.id} value={app.id}>
                          {app.name}
                        </option>
                      ))}
                  </select>
                  {errors.default_app_id && (
                    <p className="mt-2 text-sm text-red-600" id="default_app_id-error" role="alert">
                      {errors.default_app_id.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Roles & Preferences */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* User Status and Admin Settings */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900">User Status & Administrator Settings</h2>
                  <p className="text-sm text-gray-500">
                    Configure user activation status, administrative privileges, and invitation settings.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      {...register('is_active')}
                      id="is_active"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                      Active User
                    </label>
                  </div>

                  {/* System Admin */}
                  <div className="flex items-center">
                    <input
                      {...register('is_sys_admin')}
                      id="is_sys_admin"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_sys_admin" className="ml-2 block text-sm text-gray-900">
                      System Administrator
                    </label>
                  </div>

                  {/* Send Invitation */}
                  <div className="flex items-center">
                    <input
                      {...register('send_invitation')}
                      id="send_invitation"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="send_invitation" className="ml-2 block text-sm text-gray-900">
                      Send invitation email to user
                    </label>
                  </div>
                </div>
              </div>

              {/* Role Assignments */}
              {!isSystemAdmin && (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Role Assignments</h2>
                    <p className="text-sm text-gray-500">
                      Assign the user to specific application roles. System administrators have access to all applications.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {watch('role_assignments').map((assignment, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        {/* App Selection */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Application
                          </label>
                          <Controller
                            control={control}
                            name={`role_assignments.${index}.app_id`}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              >
                                <option value={0}>Select application</option>
                                {availableApps
                                  .filter((app) => app.is_active)
                                  .map((app) => (
                                    <option key={app.id} value={app.id}>
                                      {app.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          />
                        </div>

                        {/* Role Selection */}
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                          </label>
                          <Controller
                            control={control}
                            name={`role_assignments.${index}.role_id`}
                            render={({ field }) => (
                              <select
                                {...field}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              >
                                <option value={0}>Select role</option>
                                {availableRoles
                                  .filter((role) => role.is_active)
                                  .map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {role.name}
                                    </option>
                                  ))}
                              </select>
                            )}
                          />
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeRoleAssignment(index)}
                          className="p-2 text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
                          aria-label="Remove role assignment"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addRoleAssignment}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Role Assignment
                    </button>
                  </div>
                </div>
              )}

              {/* Notification Preferences */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
                  <p className="text-sm text-gray-500">
                    Configure default notification settings for the user.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'email_notifications', label: 'Email Notifications' },
                    { key: 'system_alerts', label: 'System Alerts' },
                    { key: 'api_quota_warnings', label: 'API Quota Warnings' },
                    { key: 'security_notifications', label: 'Security Notifications' },
                    { key: 'maintenance_notifications', label: 'Maintenance Notifications' },
                    { key: 'newsletter_subscription', label: 'Newsletter Subscription' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center">
                      <input
                        {...register(`notification_preferences.${key}` as const)}
                        id={`notification_${key}`}
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`notification_${key}`} className="ml-2 block text-sm text-gray-900">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentStep === 1
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                Previous
              </button>

              <div className="flex space-x-3">
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      isSubmitting || !isValid
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating User...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}