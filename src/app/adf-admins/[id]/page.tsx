"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { Loader2, Save, ArrowLeft, Send, UserCheck, Shield, Key, Settings, AlertTriangle } from 'lucide-react';

// Type imports (would be from dependency files when they exist)
import type { AdminProfile, UserAppRole, LookupKey, RoleType } from '@/types/user';

/**
 * Comprehensive admin form validation schema
 * Implements real-time validation under 100ms per React/Next.js Integration Requirements
 */
const AdminFormSchema = z.object({
  // Core profile information
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters'),
  
  first_name: z.string()
    .max(100, 'First name must not exceed 100 characters')
    .optional(),
  
  last_name: z.string()
    .max(100, 'Last name must not exceed 100 characters')
    .optional(),
  
  display_name: z.string()
    .max(100, 'Display name must not exceed 100 characters')
    .optional(),
  
  phone: z.string().optional(),
  
  // Admin-specific fields
  is_active: z.boolean().default(true),
  is_sys_admin: z.boolean().default(false),
  
  // Password update (conditional)
  setPassword: z.boolean().default(false),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .optional(),
  
  confirm_password: z.string().optional(),
  
  // Access restrictions
  accessByTabs: z.array(z.string()).default([]),
  isRestrictedAdmin: z.boolean().default(false),
  
  // App roles
  user_to_app_to_role_by_user_id: z.array(z.object({
    id: z.number().optional(),
    user_id: z.number(),
    app_id: z.number(),
    role_id: z.number(),
  })).default([]),
  
  // Lookup keys
  lookupByUserId: z.array(z.object({
    id: z.number().optional(),
    name: z.string().min(1, 'Lookup key name is required'),
    value: z.string().min(1, 'Lookup key value is required'),
    private: z.boolean().default(false),
    description: z.string().optional(),
  })).default([]),
}).refine(data => {
  if (data.setPassword && data.password) {
    return data.password === data.confirm_password;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type AdminFormData = z.infer<typeof AdminFormSchema>;

/**
 * Mock API client functions (these would be imported from actual API client)
 */
const apiClient = {
  get: async (url: string) => {
    console.log(`API GET: ${url}`);
    // Mock response for demonstration
    return {
      data: {
        id: 1,
        username: 'admin@example.com',
        email: 'admin@example.com',
        first_name: 'System',
        last_name: 'Administrator',
        display_name: 'System Admin',
        is_active: true,
        is_sys_admin: true,
        accessByTabs: ['database', 'schema', 'security'],
        isRestrictedAdmin: false,
        user_to_app_to_role_by_user_id: [],
        lookupByUserId: [],
      }
    };
  },
  
  patch: async (url: string, data: any) => {
    console.log(`API PATCH: ${url}`, data);
    return { data: { ...data, id: 1 } };
  },
  
  post: async (url: string, data: any) => {
    console.log(`API POST: ${url}`, data);
    return { data: { success: true } };
  }
};

/**
 * Mock apps and roles data (would come from actual hooks when they exist)
 */
const mockApps = [
  { id: 1, name: 'Main Application', description: 'Primary application' },
  { id: 2, name: 'API Docs', description: 'API documentation interface' },
];

const mockRoles = [
  { id: 1, name: 'Admin', description: 'Full administrative access' },
  { id: 2, name: 'Developer', description: 'Development access' },
  { id: 3, name: 'Viewer', description: 'Read-only access' },
];

/**
 * Tab options for access restrictions
 */
const tabOptions = [
  { value: 'database', label: 'Database Services' },
  { value: 'schema', label: 'Schema Management' },
  { value: 'security', label: 'Security Settings' },
  { value: 'users', label: 'User Management' },
  { value: 'system', label: 'System Configuration' },
  { value: 'logs', label: 'System Logs' },
  { value: 'files', label: 'File Management' },
];

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <Loader2 
      className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
      aria-label="Loading"
    />
  );
};

/**
 * Form section component for organized layout
 */
const FormSection: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="px-6 py-4">
      {children}
    </div>
  </div>
);

/**
 * Input field component with error handling
 */
const FormField: React.FC<{
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  error?: string;
  register: any;
}> = ({ label, name, type = 'text', required, placeholder, description, error, register }) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      {...register(name)}
      type={type}
      id={name}
      placeholder={placeholder}
      className={`
        block w-full px-3 py-2 border rounded-md shadow-sm text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:bg-gray-50 disabled:text-gray-500
        ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
      `}
      aria-describedby={description ? `${name}-description` : undefined}
      aria-invalid={error ? 'true' : 'false'}
    />
    {description && (
      <p id={`${name}-description`} className="text-xs text-gray-500">
        {description}
      </p>
    )}
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {error}
      </p>
    )}
  </div>
);

/**
 * Checkbox field component
 */
const CheckboxField: React.FC<{
  label: string;
  name: string;
  description?: string;
  register: any;
}> = ({ label, name, description, register }) => (
  <div className="flex items-start space-x-3">
    <input
      {...register(name)}
      type="checkbox"
      id={name}
      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
    />
    <div className="flex-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  </div>
);

/**
 * Button component with variants
 */
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled, 
  loading,
  icon,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

/**
 * Admin Edit Page Component
 * 
 * Next.js page component for editing existing administrator accounts implementing 
 * React Hook Form with Zod validation, SWR data fetching for pre-populated form data, 
 * and comprehensive admin profile editing workflow.
 * 
 * Features:
 * - Dynamic route parameter handling for admin ID extraction
 * - SWR-backed data synchronization for instant admin update feedback
 * - Real-time validation under 100ms response times
 * - Comprehensive admin-specific form sections
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Server-side rendering support
 */
export default function AdminEditPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params?.id as string;
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // SWR data fetching for admin profile
  const { data: adminData, error, isLoading, mutate: refetchAdmin } = useSWR(
    adminId ? `/api/v2/system/admin/${adminId}` : null,
    apiClient.get,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  // SWR data fetching for apps and roles
  const { data: appsData } = useSWR('/api/v2/system/app', apiClient.get);
  const { data: rolesData } = useSWR('/api/v2/system/role', apiClient.get);

  // React Hook Form setup with Zod validation
  const methods = useForm<AdminFormData>({
    resolver: zodResolver(AdminFormSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      is_active: true,
      is_sys_admin: false,
      setPassword: false,
      accessByTabs: [],
      isRestrictedAdmin: false,
      user_to_app_to_role_by_user_id: [],
      lookupByUserId: [],
    },
  });

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    reset, 
    watch, 
    setValue,
    getValues
  } = methods;

  const watchSetPassword = watch('setPassword');

  // Populate form when admin data loads
  useEffect(() => {
    if (adminData?.data) {
      const admin = adminData.data;
      reset({
        username: admin.username || '',
        email: admin.email || '',
        first_name: admin.first_name || '',
        last_name: admin.last_name || '',
        display_name: admin.display_name || '',
        phone: admin.phone || '',
        is_active: admin.is_active ?? true,
        is_sys_admin: admin.is_sys_admin ?? false,
        setPassword: false,
        password: '',
        confirm_password: '',
        accessByTabs: admin.accessByTabs || [],
        isRestrictedAdmin: admin.isRestrictedAdmin ?? false,
        user_to_app_to_role_by_user_id: admin.user_to_app_to_role_by_user_id || [],
        lookupByUserId: admin.lookupByUserId || [],
      });
    }
  }, [adminData, reset]);

  // Handle password section visibility
  useEffect(() => {
    setShowPasswordSection(watchSetPassword);
    if (!watchSetPassword) {
      setValue('password', '');
      setValue('confirm_password', '');
    }
  }, [watchSetPassword, setValue]);

  // Form submission handler
  const onSubmit = async (data: AdminFormData) => {
    if (!adminId) return;

    setIsSubmitting(true);
    try {
      // Prepare update payload
      const updatePayload: any = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name,
        phone: data.phone,
        is_active: data.is_active,
        is_sys_admin: data.is_sys_admin,
        accessByTabs: data.accessByTabs,
        isRestrictedAdmin: data.isRestrictedAdmin,
        user_to_app_to_role_by_user_id: data.user_to_app_to_role_by_user_id,
        lookupByUserId: data.lookupByUserId,
      };

      // Add password if updating
      if (data.setPassword && data.password) {
        updatePayload.password = data.password;
      }

      // Update admin via API
      await apiClient.patch(`/api/v2/system/admin/${adminId}`, updatePayload);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Administrator updated successfully',
      });

      // Refresh admin data
      await refetchAdmin();

      // Clear dirty state
      reset(data);

    } catch (error: any) {
      console.error('Failed to update admin:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to update administrator',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send invitation handler
  const handleSendInvite = async () => {
    if (!adminId) return;

    try {
      await apiClient.post(`/api/v2/system/admin/${adminId}/invite`, {});
      setNotification({
        type: 'success',
        message: 'Invitation sent successfully',
      });
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to send invitation',
      });
    }
  };

  // Handle navigation back
  const handleBack = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/adf-admins');
      }
    } else {
      router.push('/adf-admins');
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading administrator details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Administrator</h2>
          <p className="mt-2 text-gray-600">
            {error.message || 'Failed to load administrator details'}
          </p>
          <div className="mt-6 space-x-4">
            <Button onClick={() => refetchAdmin()} variant="primary">
              Try Again
            </Button>
            <Button onClick={handleBack} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Admins
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Administrator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Modify administrator profile and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSendInvite}
              variant="outline"
              icon={<Send className="h-4 w-4" />}
            >
              Send Invitation
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="primary"
              loading={isSubmitting}
              disabled={!isDirty}
              icon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`
          fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md
          ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
          ${notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
          ${notification.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}
        `}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <UserCheck className="h-5 w-5" />}
            {notification.type === 'error' && <AlertTriangle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Profile Details Section */}
            <FormSection
              title="Profile Details"
              description="Basic administrator information and contact details"
              icon={<UserCheck className="h-5 w-5 text-blue-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Username"
                  name="username"
                  required
                  placeholder="Enter username"
                  error={errors.username?.message}
                  register={register}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  required
                  placeholder="Enter email address"
                  error={errors.email?.message}
                  register={register}
                />
                <FormField
                  label="First Name"
                  name="first_name"
                  placeholder="Enter first name"
                  error={errors.first_name?.message}
                  register={register}
                />
                <FormField
                  label="Last Name"
                  name="last_name"
                  placeholder="Enter last name"
                  error={errors.last_name?.message}
                  register={register}
                />
                <FormField
                  label="Display Name"
                  name="display_name"
                  placeholder="Enter display name"
                  description="Name shown in the interface"
                  error={errors.display_name?.message}
                  register={register}
                />
                <FormField
                  label="Phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  error={errors.phone?.message}
                  register={register}
                />
              </div>
              
              <div className="mt-6 space-y-4">
                <CheckboxField
                  label="Active"
                  name="is_active"
                  description="Allow this administrator to log in"
                  register={register}
                />
                <CheckboxField
                  label="System Administrator"
                  name="is_sys_admin"
                  description="Grant full system administrator privileges"
                  register={register}
                />
              </div>
            </FormSection>

            {/* Password Section */}
            <FormSection
              title="Password Management"
              description="Update administrator password"
              icon={<Key className="h-5 w-5 text-amber-600" />}
            >
              <div className="space-y-4">
                <CheckboxField
                  label="Change Password"
                  name="setPassword"
                  description="Check to update the administrator's password"
                  register={register}
                />
                
                {showPasswordSection && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                    <FormField
                      label="New Password"
                      name="password"
                      type="password"
                      required={showPasswordSection}
                      placeholder="Enter new password"
                      description="Minimum 8 characters with uppercase, lowercase, and number"
                      error={errors.password?.message}
                      register={register}
                    />
                    <FormField
                      label="Confirm Password"
                      name="confirm_password"
                      type="password"
                      required={showPasswordSection}
                      placeholder="Confirm new password"
                      error={errors.confirm_password?.message}
                      register={register}
                    />
                  </div>
                )}
              </div>
            </FormSection>

            {/* Access Restrictions Section */}
            <FormSection
              title="Access Restrictions"
              description="Configure administrator access permissions"
              icon={<Shield className="h-5 w-5 text-red-600" />}
            >
              <div className="space-y-6">
                <CheckboxField
                  label="Restricted Administrator"
                  name="isRestrictedAdmin"
                  description="Limit access to specific application areas"
                  register={register}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Accessible Tabs
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {tabOptions.map((tab) => (
                      <div key={tab.value} className="flex items-center space-x-2">
                        <input
                          {...register('accessByTabs')}
                          type="checkbox"
                          value={tab.value}
                          id={`tab-${tab.value}`}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`tab-${tab.value}`}
                          className="text-sm text-gray-700"
                        >
                          {tab.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* System Configuration Section */}
            <FormSection
              title="System Configuration"
              description="Advanced administrator settings and metadata"
              icon={<Settings className="h-5 w-5 text-gray-600" />}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Lookup Keys
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Custom key-value pairs for administrator metadata
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 text-center">
                      Lookup keys management will be implemented when the lookup keys component is available.
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Application Roles
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Assign roles for specific applications
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 text-center">
                      Application roles management will be implemented when the app roles component is available.
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>

          </form>
        </FormProvider>
      </div>
    </div>
  );
}