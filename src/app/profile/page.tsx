'use client';

/**
 * Profile Management Page Component
 * 
 * Next.js page component for comprehensive user profile management implementing
 * React Hook Form with Zod validation, SWR data fetching, and tabbed interface
 * for profile details, security questions, and password updates.
 * 
 * Migrated from Angular DfProfileComponent to React 19 with:
 * - Server-side rendering for initial page loads under 2 seconds
 * - Real-time validation under 100ms with React Hook Form + Zod
 * - SWR-backed data synchronization for instant profile updates
 * - Tailwind CSS responsive design with Headless UI components
 * - WCAG 2.1 AA compliance for accessibility
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19 / Next.js 15.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { toast } from 'react-hot-toast';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  KeyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

// Type imports
import { 
  UserProfile, 
  userProfileUpdateSchema,
  changePasswordSchema,
  ApiResponse 
} from '@/types/user';

// Hook imports
import { useProfile } from '@/hooks/use-profile';
import { usePassword } from '@/hooks/use-password';
import { useAuth } from '@/hooks/use-auth';

// Component imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// API client import
import { apiClient } from '@/lib/api-client';

// ============================================================================
// Form Schemas and Types
// ============================================================================

/**
 * Security question form schema with validation
 */
const securityQuestionSchema = z.object({
  security_question: z.string()
    .min(1, 'Security question is required')
    .max(255, 'Security question too long'),
  security_answer: z.string()
    .min(1, 'Security answer is required')
    .max(255, 'Security answer too long'),
});

/**
 * Profile details form type (derived from Zod schema)
 */
type ProfileDetailsForm = z.infer<typeof userProfileUpdateSchema>;

/**
 * Security question form type
 */
type SecurityQuestionForm = z.infer<typeof securityQuestionSchema>;

/**
 * Password update form type (derived from Zod schema)
 */
type PasswordUpdateForm = z.infer<typeof changePasswordSchema>;

/**
 * Tab configuration for the profile interface
 */
interface ProfileTab {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/**
 * Alert state for user feedback
 */
interface AlertState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

// ============================================================================
// Main Profile Page Component
// ============================================================================

/**
 * Profile page component with tabbed interface for comprehensive profile management
 */
export default function ProfilePage(): React.JSX.Element {
  const router = useRouter();
  const { user, isAuthenticated, updateProfile: updateAuthProfile } = useAuth();
  
  // State management
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [alert, setAlert] = useState<AlertState>({ 
    show: false, 
    type: 'info', 
    message: '' 
  });
  const [needsCurrentPassword, setNeedsCurrentPassword] = useState<boolean>(false);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false);

  // SWR data fetching for profile
  const { 
    data: profileData, 
    error: profileError, 
    isLoading: profileLoading,
    mutate: mutateProfile 
  } = useSWR<UserProfile>(
    isAuthenticated ? '/api/profile' : null,
    apiClient.get,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  // Hooks for profile and password operations
  const { updateProfile, isUpdating: profileUpdating } = useProfile();
  const { updatePassword, isUpdating: passwordUpdating } = usePassword();

  // ============================================================================
  // Form Setup with React Hook Form + Zod
  // ============================================================================

  // Profile details form
  const profileForm = useForm<ProfileDetailsForm>({
    resolver: zodResolver(userProfileUpdateSchema),
    mode: 'onChange', // Real-time validation under 100ms
    defaultValues: {
      first_name: '',
      last_name: '',
      display_name: '',
      email: '',
      username: '',
      phone: '',
      is_active: true,
    },
  });

  // Security question form
  const securityForm = useForm<SecurityQuestionForm>({
    resolver: zodResolver(securityQuestionSchema),
    mode: 'onChange',
    defaultValues: {
      security_question: '',
      security_answer: '',
    },
  });

  // Password update form
  const passwordForm = useForm<PasswordUpdateForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  });

  // ============================================================================
  // Effects and Event Handlers
  // ============================================================================

  /**
   * Initialize responsive breakpoint detection
   */
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /**
   * Populate forms when profile data loads
   */
  useEffect(() => {
    if (profileData) {
      // Populate profile form
      profileForm.reset({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        display_name: profileData.display_name || '',
        email: profileData.email || '',
        username: profileData.username || '',
        phone: profileData.phone || '',
        is_active: profileData.is_active ?? true,
      });

      // Populate security form
      securityForm.reset({
        security_question: profileData.security_question || '',
        security_answer: '', // Never pre-populate answer for security
      });
    }
  }, [profileData, profileForm, securityForm]);

  /**
   * Monitor email changes to determine if current password is needed
   */
  useEffect(() => {
    const subscription = profileForm.watch((value, { name }) => {
      if (name === 'email' && profileData) {
        const emailChanged = value.email !== profileData.email;
        setNeedsCurrentPassword(emailChanged);
        
        if (emailChanged) {
          profileForm.setValue('current_password', '', { shouldValidate: true });
        } else {
          profileForm.unregister('current_password');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [profileForm, profileData]);

  /**
   * Clear alerts when switching tabs
   */
  useEffect(() => {
    setAlert({ show: false, type: 'info', message: '' });
  }, [selectedTabIndex]);

  /**
   * Handle authentication redirect
   */
  useEffect(() => {
    if (!isAuthenticated && !profileLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, profileLoading, router]);

  // ============================================================================
  // Form Submission Handlers
  // ============================================================================

  /**
   * Handle profile details update with optimistic updates
   */
  const handleProfileUpdate = useCallback(async (data: ProfileDetailsForm) => {
    if (!profileData) return;

    try {
      setAlert({ show: false, type: 'info', message: '' });

      const updatePayload: Partial<UserProfile> = {
        ...data,
        ...(needsCurrentPassword && { current_password: data.current_password }),
      };

      // Optimistic update
      const optimisticData = { ...profileData, ...updatePayload };
      mutateProfile(optimisticData, false);

      const updatedProfile = await updateProfile(updatePayload);

      // Update authentication context
      updateAuthProfile(updatedProfile);

      // Show success message
      setAlert({
        show: true,
        type: 'success',
        message: 'Profile updated successfully'
      });

      // Reset form state
      profileForm.reset(data);
      setNeedsCurrentPassword(false);

      // Revalidate data
      mutateProfile();

    } catch (error: any) {
      console.error('Profile update error:', error);
      
      // Rollback optimistic update
      mutateProfile();
      
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to update profile'
      });
    }
  }, [profileData, needsCurrentPassword, updateProfile, updateAuthProfile, profileForm, mutateProfile]);

  /**
   * Handle security question update
   */
  const handleSecurityQuestionUpdate = useCallback(async (data: SecurityQuestionForm) => {
    if (!profileData) return;

    try {
      setAlert({ show: false, type: 'info', message: '' });

      const updatePayload: Partial<UserProfile> = {
        security_question: data.security_question,
        security_answer: data.security_answer,
      };

      await updateProfile(updatePayload);

      setAlert({
        show: true,
        type: 'success',
        message: 'Security question updated successfully'
      });

      // Clear security answer for security
      securityForm.setValue('security_answer', '');
      
      // Revalidate data
      mutateProfile();

    } catch (error: any) {
      console.error('Security question update error:', error);
      
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to update security question'
      });
    }
  }, [profileData, updateProfile, securityForm, mutateProfile]);

  /**
   * Handle password update
   */
  const handlePasswordUpdate = useCallback(async (data: PasswordUpdateForm) => {
    try {
      setAlert({ show: false, type: 'info', message: '' });

      await updatePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      });

      setAlert({
        show: true,
        type: 'success',
        message: 'Password updated successfully'
      });

      // Reset password form
      passwordForm.reset();

    } catch (error: any) {
      console.error('Password update error:', error);
      
      setAlert({
        show: true,
        type: 'error',
        message: error.message || 'Failed to update password'
      });
    }
  }, [updatePassword, passwordForm]);

  /**
   * Dismiss alert
   */
  const dismissAlert = useCallback(() => {
    setAlert({ show: false, type: 'info', message: '' });
  }, []);

  // ============================================================================
  // Tab Configuration
  // ============================================================================

  const tabs: ProfileTab[] = [
    {
      id: 'details',
      name: 'Profile Details',
      icon: UserIcon,
      description: 'Manage your personal information and contact details',
    },
    {
      id: 'security',
      name: 'Security Question',
      icon: ShieldCheckIcon,
      description: 'Set up your security question for account recovery',
    },
    {
      id: 'password',
      name: 'Change Password',
      icon: KeyIcon,
      description: 'Update your account password',
    },
  ];

  // ============================================================================
  // Loading and Error States
  // ============================================================================

  if (!isAuthenticated) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (profileLoading || !profileData) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  // ============================================================================
  // Render Component
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Account Management
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <Tab.Group 
              selectedIndex={selectedTabIndex} 
              onChange={setSelectedTabIndex}
              as="div"
              className={isSmallScreen ? 'space-y-4' : 'flex'}
            >
              {/* Tab Navigation */}
              <Tab.List 
                className={`
                  ${isSmallScreen 
                    ? 'flex overflow-x-auto border-b border-gray-200 dark:border-gray-700' 
                    : 'flex-col w-64 border-r border-gray-200 dark:border-gray-700'
                  }
                  bg-gray-50 dark:bg-gray-800
                `}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={tab.id}
                    className={({ selected }) => `
                      ${isSmallScreen ? 'flex-shrink-0 px-4 py-3' : 'w-full px-6 py-4 text-left'}
                      flex items-center space-x-3 cursor-pointer transition-colors duration-200
                      ${selected
                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-blue-500'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${isSmallScreen && selected ? 'border-b-2' : ''}
                      ${!isSmallScreen && selected ? 'border-r-2' : ''}
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                    `}
                    aria-describedby={`tab-${tab.id}-description`}
                  >
                    <tab.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    <div className={isSmallScreen ? 'hidden sm:block' : ''}>
                      <div className="font-medium">{tab.name}</div>
                      {!isSmallScreen && (
                        <div 
                          id={`tab-${tab.id}-description`}
                          className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                        >
                          {tab.description}
                        </div>
                      )}
                    </div>
                  </Tab>
                ))}
              </Tab.List>

              {/* Tab Panels */}
              <Tab.Panels className={isSmallScreen ? '' : 'flex-1'}>
                {/* Profile Details Tab */}
                <Tab.Panel className="p-6 focus:outline-none">
                  {alert.show && (
                    <Alert 
                      className={`mb-6 ${
                        alert.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
                        alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                        'border-blue-200 bg-blue-50 text-blue-800'
                      }`}
                      role="alert"
                      aria-live="polite"
                    >
                      {alert.type === 'success' ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {alert.message}
                        <button
                          onClick={dismissAlert}
                          className="ml-4 text-sm underline hover:no-underline"
                          aria-label="Dismiss alert"
                        >
                          Dismiss
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormProvider {...profileForm}>
                    <form 
                      onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                      className="space-y-6"
                      noValidate
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="First Name"
                          name="first_name"
                          type="text"
                          autoComplete="given-name"
                          required
                          aria-describedby="first-name-error"
                        />

                        <Input
                          label="Last Name"
                          name="last_name"
                          type="text"
                          autoComplete="family-name"
                          required
                          aria-describedby="last-name-error"
                        />

                        <Input
                          label="Display Name"
                          name="display_name"
                          type="text"
                          autoComplete="name"
                          className="md:col-span-2"
                          aria-describedby="display-name-error"
                        />

                        <Input
                          label="Email Address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className="md:col-span-2"
                          aria-describedby="email-error"
                        />

                        <Input
                          label="Username"
                          name="username"
                          type="text"
                          autoComplete="username"
                          aria-describedby="username-error"
                        />

                        <Input
                          label="Phone Number"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          aria-describedby="phone-error"
                        />

                        {needsCurrentPassword && (
                          <Input
                            label="Current Password"
                            name="current_password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="md:col-span-2"
                            aria-describedby="current-password-error"
                            description="Required when changing email address"
                          />
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            profileForm.reset();
                            setNeedsCurrentPassword(false);
                          }}
                          disabled={profileUpdating}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={profileUpdating || !profileForm.formState.isValid}
                          loading={profileUpdating}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </FormProvider>
                </Tab.Panel>

                {/* Security Question Tab */}
                <Tab.Panel className="p-6 focus:outline-none">
                  {alert.show && (
                    <Alert 
                      className={`mb-6 ${
                        alert.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
                        alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                        'border-blue-200 bg-blue-50 text-blue-800'
                      }`}
                      role="alert"
                      aria-live="polite"
                    >
                      {alert.type === 'success' ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {alert.message}
                        <button
                          onClick={dismissAlert}
                          className="ml-4 text-sm underline hover:no-underline"
                          aria-label="Dismiss alert"
                        >
                          Dismiss
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormProvider {...securityForm}>
                    <form 
                      onSubmit={securityForm.handleSubmit(handleSecurityQuestionUpdate)}
                      className="space-y-6"
                      noValidate
                    >
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Set up a security question to help recover your account if you forget your password.
                        </p>

                        <Input
                          label="Security Question"
                          name="security_question"
                          type="text"
                          placeholder="e.g., What was the name of your first pet?"
                          required
                          aria-describedby="security-question-error"
                        />

                        <Input
                          label="Security Answer"
                          name="security_answer"
                          type="text"
                          placeholder="Enter your answer"
                          required
                          aria-describedby="security-answer-error"
                          description="This answer will be used to verify your identity"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => securityForm.reset()}
                          disabled={profileUpdating}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={profileUpdating || !securityForm.formState.isValid}
                          loading={profileUpdating}
                        >
                          Update Security Question
                        </Button>
                      </div>
                    </form>
                  </FormProvider>
                </Tab.Panel>

                {/* Password Update Tab */}
                <Tab.Panel className="p-6 focus:outline-none">
                  {alert.show && (
                    <Alert 
                      className={`mb-6 ${
                        alert.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
                        alert.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                        'border-blue-200 bg-blue-50 text-blue-800'
                      }`}
                      role="alert"
                      aria-live="polite"
                    >
                      {alert.type === 'success' ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {alert.message}
                        <button
                          onClick={dismissAlert}
                          className="ml-4 text-sm underline hover:no-underline"
                          aria-label="Dismiss alert"
                        >
                          Dismiss
                        </button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormProvider {...passwordForm}>
                    <form 
                      onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
                      className="space-y-6"
                      noValidate
                    >
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose a strong password with at least 8 characters including uppercase, lowercase, and numbers.
                        </p>

                        <Input
                          label="Current Password"
                          name="old_password"
                          type="password"
                          autoComplete="current-password"
                          required
                          aria-describedby="old-password-error"
                        />

                        <Input
                          label="New Password"
                          name="new_password"
                          type="password"
                          autoComplete="new-password"
                          required
                          aria-describedby="new-password-error"
                        />

                        <Input
                          label="Confirm New Password"
                          name="new_password_confirmation"
                          type="password"
                          autoComplete="new-password"
                          required
                          aria-describedby="new-password-confirmation-error"
                        />
                      </div>

                      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => passwordForm.reset()}
                          disabled={passwordUpdating}
                        >
                          Reset
                        </Button>
                        <Button
                          type="submit"
                          disabled={passwordUpdating || !passwordForm.formState.isValid}
                          loading={passwordUpdating}
                        >
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </FormProvider>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}