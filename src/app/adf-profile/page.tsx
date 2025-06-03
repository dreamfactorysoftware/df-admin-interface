'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ProfileDetailsForm } from '@/components/profile/profile-details-form';
import { SecurityQuestionForm } from '@/components/profile/security-question-form';
import { PasswordUpdateForm } from '@/components/profile/password-update-form';
import { useProfile } from '@/hooks/use-profile';
import { usePassword } from '@/hooks/use-password';
import { UserProfile } from '@/types/user';
import { profileDetailsSchema, securityQuestionSchema, passwordUpdateSchema } from '@/lib/validations/profile';

// Profile details form schema
const profileFormSchema = z.object({
  profileDetailsGroup: profileDetailsSchema,
  currentPassword: z.string().optional(),
});

// Form type definitions
type ProfileFormData = z.infer<typeof profileFormSchema>;
type SecurityQuestionFormData = z.infer<typeof securityQuestionSchema>;
type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;

// Alert types
type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
  show: boolean;
  type: AlertType;
  message: string;
}

/**
 * Profile management page component implementing React Hook Form with Zod validation,
 * SWR data fetching, and comprehensive profile editing workflow.
 * 
 * Features:
 * - Three-tab interface: Details, Security Question, Password
 * - Real-time form validation under 100ms
 * - SWR-backed data synchronization for instant updates
 * - Responsive design with Tailwind CSS
 * - WCAG 2.1 AA compliance
 * - Server-side rendering support
 */
export default function ProfilePage() {
  // State management
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'info',
    message: ''
  });
  const [needPassword, setNeedPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Profile data fetching with SWR
  const { 
    profile, 
    isLoading: profileLoading, 
    error: profileError, 
    updateProfile,
    updateSecurityQuestion 
  } = useProfile();
  
  const { updatePassword, isUpdating: passwordUpdating } = usePassword();

  // Profile form setup
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      profileDetailsGroup: {
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        name: '',
        phone: '',
      },
      currentPassword: ''
    },
    mode: 'onChange' // Enable real-time validation
  });

  // Security question form setup
  const securityForm = useForm<SecurityQuestionFormData>({
    resolver: zodResolver(securityQuestionSchema),
    defaultValues: {
      securityQuestion: '',
      securityAnswer: ''
    },
    mode: 'onChange'
  });

  // Password update form setup
  const passwordForm = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    mode: 'onChange'
  });

  // Initialize forms with profile data
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        profileDetailsGroup: {
          username: profile.username || '',
          email: profile.email || '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          name: profile.name || '',
          phone: profile.phone || '',
        }
      });

      securityForm.reset({
        securityQuestion: profile.securityQuestion || '',
        securityAnswer: ''
      });
    }
  }, [profile, profileForm, securityForm]);

  // Watch email changes to determine if current password is needed
  const emailValue = profileForm.watch('profileDetailsGroup.email');
  useEffect(() => {
    if (profile && emailValue !== profile.email) {
      setNeedPassword(true);
      profileForm.setValue('currentPassword', ''); // Reset password field
    } else {
      setNeedPassword(false);
      profileForm.unregister('currentPassword');
    }
  }, [emailValue, profile, profileForm]);

  // Alert management
  const triggerAlert = (type: AlertType, message: string) => {
    setAlert({ show: true, type, message });
  };

  const dismissAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  // Handle tab change - dismiss alerts when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    dismissAlert();
  };

  // Profile update handler
  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      if (profileForm.formState.isValid && profileForm.formState.isDirty) {
        const updateData: Partial<UserProfile> = {
          ...data.profileDetailsGroup,
          ...(needPassword && data.currentPassword && { currentPassword: data.currentPassword })
        };

        await updateProfile(updateData);
        triggerAlert('success', 'Profile details updated successfully');
        
        // Refresh profile data
        mutate('/api/profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      triggerAlert('error', errorMessage);
    }
  };

  // Security question update handler
  const handleSecurityQuestionUpdate = async (data: SecurityQuestionFormData) => {
    try {
      if (securityForm.formState.isValid && securityForm.formState.isDirty) {
        await updateSecurityQuestion(data);
        triggerAlert('success', 'Security question updated successfully');
        
        // Clear the security answer field
        securityForm.setValue('securityAnswer', '');
        
        // Refresh profile data
        mutate('/api/profile');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update security question';
      triggerAlert('error', errorMessage);
    }
  };

  // Password update handler
  const handlePasswordUpdate = async (data: PasswordUpdateFormData) => {
    try {
      if (passwordForm.formState.isValid && passwordForm.formState.isDirty) {
        await updatePassword(data);
        triggerAlert('success', 'Password updated successfully');
        
        // Reset the form
        passwordForm.reset();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      triggerAlert('error', errorMessage);
    }
  };

  // Loading state
  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information, security settings, and password.
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="security">Security Question</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          {/* Profile Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="rounded-lg border p-6 bg-card">
              {alert.show && (
                <Alert 
                  variant={alert.type === 'error' ? 'destructive' : 'default'}
                  className="mb-6"
                >
                  <AlertDescription>{alert.message}</AlertDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={dismissAlert}
                  >
                    ×
                  </Button>
                </Alert>
              )}

              <Form {...profileForm}>
                <form 
                  onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                  className="space-y-6"
                  noValidate
                >
                  {/* Profile Details Fields */}
                  <ProfileDetailsForm form={profileForm} />

                  {/* Current Password Field (Conditional) */}
                  {needPassword && (
                    <FormField
                      control={profileForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your current password"
                              {...field}
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormDescription>
                            Required when changing email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    disabled={!profileForm.formState.isDirty || !profileForm.formState.isValid}
                    className="w-full sm:w-auto"
                  >
                    Save Changes
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* Security Question Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="rounded-lg border p-6 bg-card">
              {alert.show && (
                <Alert 
                  variant={alert.type === 'error' ? 'destructive' : 'default'}
                  className="mb-6"
                >
                  <AlertDescription>{alert.message}</AlertDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={dismissAlert}
                  >
                    ×
                  </Button>
                </Alert>
              )}

              <Form {...securityForm}>
                <form 
                  onSubmit={securityForm.handleSubmit(handleSecurityQuestionUpdate)}
                  className="space-y-6"
                  noValidate
                >
                  <SecurityQuestionForm form={securityForm} />

                  <Button 
                    type="submit" 
                    disabled={!securityForm.formState.isDirty || !securityForm.formState.isValid}
                    className="w-full sm:w-auto"
                  >
                    Update Security Question
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* Password Update Tab */}
          <TabsContent value="password" className="space-y-6">
            <div className="rounded-lg border p-6 bg-card">
              {alert.show && (
                <Alert 
                  variant={alert.type === 'error' ? 'destructive' : 'default'}
                  className="mb-6"
                >
                  <AlertDescription>{alert.message}</AlertDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={dismissAlert}
                  >
                    ×
                  </Button>
                </Alert>
              )}

              <Form {...passwordForm}>
                <form 
                  onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
                  className="space-y-6"
                  noValidate
                >
                  <PasswordUpdateForm form={passwordForm} />

                  <Button 
                    type="submit" 
                    disabled={!passwordForm.formState.isDirty || !passwordForm.formState.isValid || passwordUpdating}
                    className="w-full sm:w-auto"
                  >
                    {passwordUpdating ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Add page metadata for Next.js
export const metadata = {
  title: 'Profile Settings | DreamFactory',
  description: 'Manage your profile information, security settings, and password.',
};