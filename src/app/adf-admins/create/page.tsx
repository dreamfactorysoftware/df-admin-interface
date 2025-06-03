'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Admin-specific components
import { AdminForm } from '@/components/admins/admin-form';
import { ProfileDetailsSection } from '@/components/admins/profile-details-section';
import { AppRolesSection } from '@/components/admins/app-roles-section';
import { LookupKeysSection } from '@/components/admins/lookup-keys-section';
import { AccessRestrictionsSection } from '@/components/admins/access-restrictions-section';

// Hooks and services
import { useAdmins } from '@/hooks/use-admins';
import { useApps } from '@/hooks/use-apps';
import { useRoles } from '@/hooks/use-roles';
import { apiClient } from '@/lib/api-client';
import { adminSchema } from '@/lib/validations/admin';

// Types
import type { AdminProfile, UserProfile } from '@/types/admin';
import type { App } from '@/types/app';
import type { Role } from '@/types/role';

// Admin creation form schema with comprehensive validation
const createAdminSchema = z.object({
  // Profile details
  profileDetails: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
  }),
  
  // Admin status
  isActive: z.boolean().default(true),
  
  // Password or invite selection
  passwordOption: z.enum(['password', 'invite'], {
    required_error: 'Please select password or invite option',
  }),
  
  // Conditional password fields
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  
  // Access control
  accessByTabs: z.array(z.string()).default([]),
  isRestrictedAdmin: z.boolean().default(false),
  
  // Lookup keys
  lookupKeys: z.array(z.object({
    name: z.string().min(1, 'Key name is required'),
    value: z.string(),
    private: z.boolean().default(false),
  })).default([]),
  
  // App roles (for users)
  appRoles: z.array(z.object({
    appId: z.number(),
    roleId: z.number(),
  })).default([]),
}).refine((data) => {
  // Validate password confirmation when password option is selected
  if (data.passwordOption === 'password') {
    if (!data.password || data.password.length < 8) {
      return false;
    }
    if (data.password !== data.confirmPassword) {
      return false;
    }
  }
  return true;
}, {
  message: 'Password validation failed',
  path: ['password'],
});

type CreateAdminFormData = z.infer<typeof createAdminSchema>;

// Available admin tabs for access control
const ADMIN_TABS = [
  { id: 'apps', label: 'Apps', control: 'apps' },
  { id: 'users', label: 'Users', control: 'users' },
  { id: 'services', label: 'Services', control: 'services' },
  { id: 'apidocs', label: 'API Docs', control: 'apidocs' },
  { id: 'schema', label: 'Schema', control: 'schema/data' },
  { id: 'files', label: 'Files', control: 'files' },
  { id: 'scripts', label: 'Scripts', control: 'scripts' },
  { id: 'config', label: 'Config', control: 'config' },
  { id: 'packages', label: 'Package Manager', control: 'packages' },
  { id: 'limits', label: 'Limits', control: 'limits' },
  { id: 'scheduler', label: 'Scheduler', control: 'scheduler' },
];

export default function CreateAdminPage() {
  const router = useRouter();
  const [alert, setAlert] = useState<{ type: 'error' | 'success' | 'warning'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching hooks
  const { createAdmin } = useAdmins();
  const { data: apps } = useApps();
  const { data: roles } = useRoles();

  // Form initialization with React Hook Form and Zod validation
  const form = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      profileDetails: {
        name: '',
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        phone: '',
      },
      isActive: true,
      passwordOption: 'invite',
      accessByTabs: ADMIN_TABS.map(tab => tab.control), // All tabs selected by default
      isRestrictedAdmin: false,
      lookupKeys: [],
      appRoles: [],
    },
    mode: 'onChange', // Real-time validation under 100ms per requirements
  });

  const { watch, setValue, getValues } = form;
  const passwordOption = watch('passwordOption');
  const accessByTabs = watch('accessByTabs');

  // Handle access tab selection changes
  const handleTabToggle = (tabControl: string, checked: boolean) => {
    const currentTabs = getValues('accessByTabs');
    if (checked) {
      setValue('accessByTabs', [...currentTabs, tabControl]);
    } else {
      setValue('accessByTabs', currentTabs.filter(tab => tab !== tabControl));
    }
    
    // Update restricted admin status
    const allTabControls = ADMIN_TABS.map(tab => tab.control);
    const isRestricted = currentTabs.length < allTabControls.length;
    setValue('isRestrictedAdmin', isRestricted);
  };

  // Handle select all tabs
  const handleSelectAllTabs = (checked: boolean) => {
    if (checked) {
      setValue('accessByTabs', ADMIN_TABS.map(tab => tab.control));
      setValue('isRestrictedAdmin', false);
    } else {
      setValue('accessByTabs', []);
      setValue('isRestrictedAdmin', true);
    }
  };

  // Handle form submission
  const onSubmit = async (data: CreateAdminFormData) => {
    try {
      setIsSubmitting(true);
      setAlert(null);

      // Build admin profile data matching Angular implementation
      const adminData: Partial<AdminProfile> = {
        ...data.profileDetails,
        isActive: data.isActive,
        accessByTabs: data.accessByTabs,
        isRestrictedAdmin: data.isRestrictedAdmin,
        lookupByUserId: data.lookupKeys.map(key => ({
          name: key.name,
          value: key.value,
          private: key.private,
          id: 0, // Will be assigned by backend
          description: '',
          userId: 0, // Will be assigned by backend
        })),
      };

      // Add password if password option is selected
      if (data.passwordOption === 'password' && data.password) {
        adminData.password = data.password;
      }

      // Determine if sending invite
      const sendInvite = data.passwordOption === 'invite';

      // Create admin with proper error handling
      const response = await createAdmin({
        resource: [adminData],
      }, {
        additionalParams: [{ key: 'send_invite', value: sendInvite }],
      });

      // Success feedback
      setAlert({
        type: 'success',
        message: 'Administrator created successfully!',
      });

      // Navigate to admin detail view matching Angular navigation pattern
      setTimeout(() => {
        router.push(`/admin-settings/admins/${response.resource[0].id}`);
      }, 1000);

    } catch (error: any) {
      console.error('Admin creation failed:', error);
      
      // Parse error message similar to Angular parseError utility
      let errorMessage = 'Failed to create administrator';
      if (error?.response?.data?.error?.context?.resource?.[0]?.message) {
        errorMessage = error.response.data.error.context.resource[0].message;
      } else if (error?.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setAlert({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if all tabs are selected
  const allTabsSelected = accessByTabs.length === ADMIN_TABS.length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Administrator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a new administrator account with role-based access controls
        </p>
      </div>

      {/* Alert Messages */}
      {alert && (
        <div className={`
          p-4 mb-6 rounded-lg border
          ${alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200' : ''}
          ${alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' : ''}
          ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200' : ''}
        `}>
          <div className="flex justify-between items-center">
            <span>{alert.message}</span>
            <button
              onClick={() => setAlert(null)}
              className="text-current hover:opacity-70"
              aria-label="Dismiss alert"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Form */}
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Profile Details Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Profile Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="profileDetails.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter display name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileDetails.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Enter email address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileDetails.username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileDetails.firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter first name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileDetails.lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter last name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profileDetails.phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Status and Authentication Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Account Settings
            </h2>

            {/* Active Status */}
            <div className="mb-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Enable or disable this administrator account
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Password vs Invite Selection */}
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  Choose whether to set a password directly or send an invitation email to the administrator.
                </p>
              </div>

              <FormField
                control={form.control}
                name="passwordOption"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Authentication Setup</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="invite"
                            value="invite"
                            checked={field.value === 'invite'}
                            onChange={() => field.onChange('invite')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor="invite" className="text-sm font-medium">
                            Send Invitation Email
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="password"
                            value="password"
                            checked={field.value === 'password'}
                            onChange={() => field.onChange('password')}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor="password" className="text-sm font-medium">
                            Set Password Directly
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Password Fields (conditional) */}
            {passwordOption === 'password' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter password" />
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Minimum 8 characters required
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Confirm password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Access Restrictions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Access Restrictions
            </h2>

            {!allTabsSelected && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Restricted Administrator:</strong> This administrator will have limited access to certain areas.
                  A role will be automatically created for this administrator.
                </p>
              </div>
            )}

            {/* Select All Toggle */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={allTabsSelected}
                  onChange={(e) => handleSelectAllTabs(e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
            </div>

            {/* Individual Tab Controls */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ADMIN_TABS.map((tab) => (
                <div key={tab.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={tab.id}
                    checked={accessByTabs.includes(tab.control)}
                    onChange={(e) => handleTabToggle(tab.control, e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor={tab.id} className="text-sm">
                    {tab.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Lookup Keys Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Lookup Keys
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Add custom lookup keys for this administrator. These can be used for additional configuration or metadata.
            </p>
            
            <LookupKeysSection />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin-settings/admins')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isValid}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Administrator'
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}