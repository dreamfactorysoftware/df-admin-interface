'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

// Import UI components
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import custom hooks and utilities
import { useProfile } from '@/hooks/use-profile';
import { usePassword } from '@/hooks/use-password';
import { apiClient } from '@/lib/api-client';
import { profileSchema, securityQuestionSchema, passwordUpdateSchema } from '@/lib/validations/profile';
import { UserProfile } from '@/types/user';

// Define form schemas
const profileFormSchema = z.object({
  profileDetailsGroup: z.object({
    username: z.string().optional(),
    email: z.string().email('Invalid email address'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
  }),
  currentPassword: z.string().optional(),
});

const securityQuestionFormSchema = z.object({
  securityQuestion: z.string().optional(),
  securityAnswer: z.string().optional(),
});

const passwordFormSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(16, 'Password must be at least 16 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type SecurityQuestionFormData = z.infer<typeof securityQuestionFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('error');
  const [alertMessage, setAlertMessage] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [loginAttribute, setLoginAttribute] = useState('email');

  // SWR data fetching for user profile
  const { data: currentProfile, error, mutate: mutateProfile } = useSWR<UserProfile>(
    '/api/v2/user/profile',
    apiClient.get,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
    }
  );

  // Custom hooks for profile and password operations
  const { updateProfile, isUpdating: isUpdatingProfile } = useProfile();
  const { updatePassword, updateSecurityQuestion, isUpdating: isUpdatingPassword } = usePassword();

  // Initialize React Hook Forms
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
    },
    mode: 'onChange', // Real-time validation
  });

  const securityQuestionForm = useForm<SecurityQuestionFormData>({
    resolver: zodResolver(securityQuestionFormSchema),
    defaultValues: {
      securityQuestion: '',
      securityAnswer: '',
    },
    mode: 'onChange',
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  // Load initial profile data
  useEffect(() => {
    if (currentProfile) {
      profileForm.reset({
        profileDetailsGroup: {
          username: currentProfile.username || '',
          email: currentProfile.email || '',
          firstName: currentProfile.firstName || '',
          lastName: currentProfile.lastName || '',
          name: currentProfile.name || '',
          phone: currentProfile.phone || '',
        },
      });

      securityQuestionForm.reset({
        securityQuestion: currentProfile.securityQuestion || '',
        securityAnswer: '', // Never pre-fill security answer for security
      });
    }
  }, [currentProfile, profileForm, securityQuestionForm]);

  // Monitor email changes to determine if current password is needed
  useEffect(() => {
    const subscription = profileForm.watch((value, { name }) => {
      if (name === 'profileDetailsGroup.email') {
        const currentEmail = currentProfile?.email || '';
        const newEmail = value.profileDetailsGroup?.email || '';
        
        if (currentEmail !== newEmail) {
          setNeedPassword(true);
          profileForm.setValue('currentPassword', '');
        } else {
          setNeedPassword(false);
          profileForm.unregister('currentPassword');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [profileForm, currentProfile]);

  // System configuration for login attribute
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const config = await apiClient.get('/api/v2/system/environment');
        const attr = config?.authentication?.loginAttribute || 'email';
        setLoginAttribute(attr);
        
        // Update validators based on login attribute
        if (attr === 'username') {
          profileForm.setValue('profileDetailsGroup.username', currentProfile?.username || '');
        } else {
          profileForm.setValue('profileDetailsGroup.email', currentProfile?.email || '');
        }
      } catch (error) {
        console.error('Failed to fetch system configuration:', error);
      }
    };

    fetchSystemConfig();
  }, [currentProfile, profileForm]);

  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setShowAlert(true);
    
    // Auto-hide success alerts after 5 seconds
    if (type === 'success') {
      setTimeout(() => setShowAlert(false), 5000);
    }
  };

  const onUpdateProfile = async (data: ProfileFormData) => {
    try {
      if (!currentProfile) return;

      const body: Partial<UserProfile> = {
        ...currentProfile,
        ...data.profileDetailsGroup,
      };

      if (needPassword && data.currentPassword) {
        body.currentPassword = data.currentPassword;
      }

      await updateProfile(body);
      await mutateProfile(); // Refresh data
      
      triggerAlert('success', 'Profile updated successfully');
      
      // Reset password requirement
      if (needPassword) {
        setNeedPassword(false);
        profileForm.unregister('currentPassword');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to update profile';
      triggerAlert('error', errorMessage);
    }
  };

  const onUpdateSecurityQuestion = async (data: SecurityQuestionFormData) => {
    try {
      if (!currentProfile) return;

      await updateSecurityQuestion({
        ...currentProfile,
        ...data,
      });

      await mutateProfile();
      triggerAlert('success', 'Security question updated successfully');
      
      // Clear the security answer field for security
      securityQuestionForm.setValue('securityAnswer', '');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to update security question';
      triggerAlert('error', errorMessage);
    }
  };

  const onUpdatePassword = async (data: PasswordFormData) => {
    try {
      await updatePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      triggerAlert('success', 'Password updated successfully');
      passwordForm.reset();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Failed to update password';
      triggerAlert('error', errorMessage);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setShowAlert(false); // Hide alerts when switching tabs
  };

  // Loading state
  if (!currentProfile && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
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
        <div className="border-b border-border pb-4">
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and security preferences.
          </p>
        </div>

        {/* Alert Banner */}
        {showAlert && (
          <Alert 
            className={`${
              alertType === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}
          >
            <AlertDescription 
              className={`${
                alertType === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {alertMessage}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-auto p-0 text-current"
                onClick={() => setShowAlert(false)}
                aria-label="Dismiss alert"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Profile Details</TabsTrigger>
            <TabsTrigger value="security">Security Question</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          {/* Profile Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Update your personal information and contact details.
                  </p>
                </div>

                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Username field - shown only if login attribute is username */}
                      {loginAttribute === 'username' && (
                        <FormField
                          control={profileForm.control}
                          name="profileDetailsGroup.username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username*</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter username"
                                  aria-describedby="username-error"
                                />
                              </FormControl>
                              <FormMessage id="username-error" />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Email field */}
                      <FormField
                        control={profileForm.control}
                        name="profileDetailsGroup.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Email{loginAttribute === 'email' ? '*' : ''}
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email"
                                placeholder="Enter email address"
                                aria-describedby="email-error"
                              />
                            </FormControl>
                            <FormMessage id="email-error" />
                          </FormItem>
                        )}
                      />

                      {/* Name field */}
                      <FormField
                        control={profileForm.control}
                        name="profileDetailsGroup.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name*</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter display name"
                                aria-describedby="name-error"
                              />
                            </FormControl>
                            <FormMessage id="name-error" />
                          </FormItem>
                        )}
                      />

                      {/* First Name field */}
                      <FormField
                        control={profileForm.control}
                        name="profileDetailsGroup.firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter first name"
                                aria-describedby="firstName-error"
                              />
                            </FormControl>
                            <FormMessage id="firstName-error" />
                          </FormItem>
                        )}
                      />

                      {/* Last Name field */}
                      <FormField
                        control={profileForm.control}
                        name="profileDetailsGroup.lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter last name"
                                aria-describedby="lastName-error"
                              />
                            </FormControl>
                            <FormMessage id="lastName-error" />
                          </FormItem>
                        )}
                      />

                      {/* Phone field */}
                      <FormField
                        control={profileForm.control}
                        name="profileDetailsGroup.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="tel"
                                placeholder="Enter phone number"
                                aria-describedby="phone-error"
                              />
                            </FormControl>
                            <FormMessage id="phone-error" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Current Password field - shown only when email changes */}
                    {needPassword && (
                      <FormField
                        control={profileForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password*</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                placeholder="Enter current password"
                                aria-describedby="currentPassword-error"
                              />
                            </FormControl>
                            <FormMessage id="currentPassword-error" />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingProfile}
                        className="min-w-[100px]"
                      >
                        {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>

          {/* Security Question Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Security Question</h2>
                  <p className="text-sm text-muted-foreground">
                    Set up a security question for account recovery purposes.
                  </p>
                </div>

                <Form {...securityQuestionForm}>
                  <form onSubmit={securityQuestionForm.handleSubmit(onUpdateSecurityQuestion)} className="space-y-4">
                    <FormField
                      control={securityQuestionForm.control}
                      name="securityQuestion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Question</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter your security question"
                              aria-describedby="securityQuestion-error"
                            />
                          </FormControl>
                          <FormMessage id="securityQuestion-error" />
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
                              {...field} 
                              placeholder="Enter your security answer"
                              aria-describedby="securityAnswer-error"
                            />
                          </FormControl>
                          <FormMessage id="securityAnswer-error" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingPassword}
                        className="min-w-[100px]"
                      >
                        {isUpdatingPassword ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>

          {/* Password Update Tab */}
          <TabsContent value="password" className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Change Password</h2>
                  <p className="text-sm text-muted-foreground">
                    Update your account password. Password must be at least 16 characters.
                  </p>
                </div>

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="oldPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password*</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Enter current password"
                              aria-describedby="oldPassword-error"
                            />
                          </FormControl>
                          <FormMessage id="oldPassword-error" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password*</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Enter new password (min 16 characters)"
                              aria-describedby="newPassword-error"
                            />
                          </FormControl>
                          <FormMessage id="newPassword-error" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password*</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              placeholder="Confirm new password"
                              aria-describedby="confirmPassword-error"
                            />
                          </FormControl>
                          <FormMessage id="confirmPassword-error" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isUpdatingPassword}
                        className="min-w-[100px]"
                      >
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}