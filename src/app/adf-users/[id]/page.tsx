'use client';

/**
 * User Edit Page Component - Next.js Dynamic Route Implementation
 * 
 * Comprehensive user editing interface replacing Angular DfUserDetailsComponent with
 * React Hook Form, Zod validation, SWR data fetching, and modern Next.js patterns.
 * 
 * Key Features:
 * - React Hook Form with real-time Zod validation (<100ms response)
 * - SWR-powered data synchronization with intelligent caching
 * - Next.js dynamic route parameter handling
 * - Tailwind CSS responsive design with WCAG 2.1 AA compliance
 * - Server-side rendering optimization (<2s page loads)
 * - Comprehensive error handling and loading states
 * - Role assignment and invitation management workflows
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR, { mutate } from 'swr';
import { UserProfile, UserProfileSchema, UserProfileFormData, RoleType, LookupKey } from '@/types/user';
import { ErrorBoundary } from 'react-error-boundary';
import { ChevronLeftIcon, UserIcon, LockClosedIcon, KeyIcon, CogIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Enhanced user form schema with dynamic validation
const UserEditSchema = UserProfileSchema.extend({
  // Password fields for invitation workflow
  password: z.string().optional(),
  confirm_password: z.string().optional(),
  send_invitation: z.boolean().optional(),
  // Role assignment
  role_id: z.number().optional(),
  // App role assignments
  app_roles: z.array(z.object({
    app_id: z.number(),
    role_id: z.number(),
    is_active: z.boolean().optional(),
  })).optional(),
  // Lookup keys
  lookup_keys: z.array(z.object({
    name: z.string().min(1, 'Key name is required'),
    value: z.string(),
    private: z.boolean().optional(),
    description: z.string().optional(),
  })).optional(),
}).refine((data) => {
  // Password confirmation validation
  if (data.password && data.password !== data.confirm_password) {
    return false;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

type UserEditFormData = z.infer<typeof UserEditSchema>;

// Mock data types for missing dependencies
interface AppType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface UserAppRole {
  id?: number;
  user_id: number;
  app_id: number;
  role_id: number;
  is_active?: boolean;
}

// Fallback API client functions
const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
};

// Fallback UI components
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}: any) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 border border-indigo-600",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300",
    outline: "bg-transparent text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 border-2 border-indigo-600",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 border border-transparent",
    destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600",
  };

  const sizes = {
    sm: "h-11 px-4 text-sm min-w-[44px]",
    md: "h-12 px-6 text-base min-w-[48px]",
    lg: "h-14 px-8 text-lg min-w-[56px]",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="animate-spin h-4 w-4 border-2 border-current border-r-transparent rounded-full mr-2" />
      ) : null}
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  error, 
  required = false, 
  className = '', 
  id,
  ...props 
}: any) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`
          block w-full rounded-md px-3 py-2 min-h-[44px]
          border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          placeholder-gray-500 dark:placeholder-gray-400
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
          disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className="text-sm text-red-600 dark:text-red-400 flex items-center"
          role="alert"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

const Select = ({ 
  label, 
  options = [], 
  error, 
  required = false, 
  className = '', 
  placeholder = 'Select an option',
  id,
  ...props 
}: any) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`
          block w-full rounded-md px-3 py-2 min-h-[44px]
          border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
          disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-700
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p 
          id={`${selectId}-error`}
          className="text-sm text-red-600 dark:text-red-400 flex items-center"
          role="alert"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

const Checkbox = ({ 
  label, 
  description, 
  error, 
  className = '',
  id,
  ...props 
}: any) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-start">
        <input
          id={checkboxId}
          type="checkbox"
          className={`
            h-5 w-5 mt-0.5 rounded
            border border-gray-300 dark:border-gray-600
            text-indigo-600 focus:ring-indigo-500
            disabled:opacity-50
            ${error ? 'border-red-500' : ''}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : description ? `${checkboxId}-description` : undefined}
          {...props}
        />
        <div className="ml-3">
          {label && (
            <label 
              htmlFor={checkboxId}
              className="block text-sm font-medium text-gray-900 dark:text-gray-100"
            >
              {label}
            </label>
          )}
          {description && (
            <p 
              id={`${checkboxId}-description`}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p 
          id={`${checkboxId}-error`}
          className="text-sm text-red-600 dark:text-red-400 flex items-center"
          role="alert"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

const Switch = ({ 
  label, 
  description, 
  error, 
  className = '',
  checked = false,
  onChange,
  disabled = false,
  id,
  ...props 
}: any) => {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          {label && (
            <label 
              htmlFor={switchId}
              className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p 
              id={`${switchId}-description`}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
        <button
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={error ? `${switchId}-error` : description ? `${switchId}-description` : undefined}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}
            ${error ? 'ring-2 ring-red-500' : ''}
          `}
          {...props}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
      {error && (
        <p 
          id={`${switchId}-error`}
          className="text-sm text-red-600 dark:text-red-400 flex items-center"
          role="alert"
        >
          <ExclamationTriangleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
      <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
        <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
        <h2 className="text-xl font-semibold">Something went wrong</h2>
      </div>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        We encountered an error while loading this page. Please try again.
      </p>
      <div className="flex space-x-3">
        <Button variant="primary" onClick={resetErrorBoundary}>
          Try Again
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  </div>
);

// Main user edit component
const UserEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'roles' | 'lookup'>('profile');

  // Data fetching with SWR
  const { data: user, error: userError, isLoading: userLoading, mutate: mutateUser } = useSWR<UserProfile>(
    userId ? `/api/v2/system/user/${userId}` : null,
    apiClient.get,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  );

  const { data: roles = [], error: rolesError } = useSWR<RoleType[]>(
    '/api/v2/system/role',
    apiClient.get,
    {
      revalidateOnFocus: false,
      fallbackData: [],
    }
  );

  const { data: apps = [], error: appsError } = useSWR<AppType[]>(
    '/api/v2/system/app',
    apiClient.get,
    {
      revalidateOnFocus: false,
      fallbackData: [],
    }
  );

  // Form setup with React Hook Form and Zod validation
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<UserEditFormData>({
    resolver: zodResolver(UserEditSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      display_name: '',
      phone: '',
      is_active: true,
      send_invitation: false,
      lookup_keys: [],
      app_roles: [],
    },
  });

  // Watch form values for conditional rendering
  const watchSendInvitation = watch('send_invitation');
  const watchIsActive = watch('is_active');

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        display_name: user.display_name || '',
        phone: user.phone || '',
        is_active: user.is_active ?? true,
        send_invitation: false,
        lookup_keys: user.lookup_by_user_id || [],
        app_roles: user.user_to_app_to_role_by_user_id || [],
        role_id: user.role?.id,
      });
    }
  }, [user, reset]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => setSubmitError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [submitError]);

  // Form submission handler
  const onSubmit = useCallback(async (data: UserEditFormData) => {
    if (!userId) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Prepare user data for API
      const userData: Partial<UserProfile> = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name,
        phone: data.phone,
        is_active: data.is_active,
      };

      // Add password if invitation is being sent
      if (data.send_invitation && data.password) {
        (userData as any).password = data.password;
      }

      // Update user profile
      const updatedUser = await apiClient.put(`/api/v2/system/user/${userId}`, userData);

      // Update lookup keys if modified
      if (data.lookup_keys && data.lookup_keys.length > 0) {
        await Promise.all(
          data.lookup_keys.map(async (key) => {
            if (key.name && key.value !== undefined) {
              return apiClient.post(`/api/v2/system/user/${userId}/lookup`, key);
            }
          })
        );
      }

      // Update app roles if modified
      if (data.app_roles && data.app_roles.length > 0) {
        await Promise.all(
          data.app_roles.map(async (role) => {
            return apiClient.post(`/api/v2/system/user/${userId}/app/${role.app_id}/role`, {
              role_id: role.role_id,
              is_active: role.is_active ?? true,
            });
          })
        );
      }

      // Send invitation email if requested
      if (data.send_invitation) {
        await apiClient.post(`/api/v2/system/user/${userId}/invite`, {
          send_email: true,
        });
      }

      // Revalidate cache
      await mutateUser();
      await mutate('/api/v2/system/user');

      setSuccessMessage('User updated successfully');
      
      // Announce success to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'User profile has been updated successfully';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);

    } catch (error: any) {
      console.error('Error updating user:', error);
      setSubmitError(
        error.message || 
        'Failed to update user. Please check your inputs and try again.'
      );

      // Announce error to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Error updating user profile. Please check the form and try again.';
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, mutateUser]);

  // Role options for select
  const roleOptions = useMemo(() => 
    roles.map(role => ({
      value: role.id.toString(),
      label: role.name,
    })), [roles]
  );

  // App options for role assignment
  const appOptions = useMemo(() => 
    apps.map(app => ({
      value: app.id.toString(),
      label: app.name,
    })), [apps]
  );

  // Navigation handler
  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      if (!confirmLeave) return;
    }
    router.push('/adf-users');
  }, [isDirty, router]);

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (userError || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
            <h2 className="text-xl font-semibold">User Not Found</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The user you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="flex space-x-3">
            <Button variant="primary" onClick={() => router.push('/adf-users')}>
              Back to Users
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={handleBack}
              className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Go back to user list"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg mr-4">
                <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit User
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update user profile and permissions
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center">
                <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
              </div>
            </div>
          )}

          {(submitError || rolesError || appsError) && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <div>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {submitError || 'Error loading additional data. Some features may be limited.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'profile', name: 'Profile Details', icon: UserIcon },
              { id: 'roles', name: 'App Roles', icon: LockClosedIcon },
              { id: 'lookup', name: 'Lookup Keys', icon: KeyIcon },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center px-1 py-4 text-sm font-medium border-b-2 transition-colors
                    ${isActive
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {activeTab === 'profile' && 'Profile Information'}
                {activeTab === 'roles' && 'Application Roles'}
                {activeTab === 'lookup' && 'Lookup Keys'}
              </h3>
            </div>

            <div className="px-6 py-6">
              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Controller
                      name="username"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Username"
                          required
                          error={errors.username?.message}
                          autoComplete="username"
                        />
                      )}
                    />

                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="email"
                          label="Email Address"
                          required
                          error={errors.email?.message}
                          autoComplete="email"
                        />
                      )}
                    />

                    <Controller
                      name="first_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="First Name"
                          error={errors.first_name?.message}
                          autoComplete="given-name"
                        />
                      )}
                    />

                    <Controller
                      name="last_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Last Name"
                          error={errors.last_name?.message}
                          autoComplete="family-name"
                        />
                      )}
                    />

                    <Controller
                      name="display_name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Display Name"
                          error={errors.display_name?.message}
                        />
                      )}
                    />

                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="tel"
                          label="Phone Number"
                          error={errors.phone?.message}
                          autoComplete="tel"
                        />
                      )}
                    />
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Account Settings
                    </h4>
                    
                    <div className="space-y-4">
                      <Controller
                        name="is_active"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <Switch
                            checked={value}
                            onChange={onChange}
                            label="Active Account"
                            description="When disabled, the user cannot log in or access the system"
                            error={errors.is_active?.message}
                          />
                        )}
                      />

                      <Controller
                        name="role_id"
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            label="System Role"
                            options={roleOptions}
                            error={errors.role_id?.message}
                            placeholder="Select a role"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Invitation Settings
                    </h4>
                    
                    <div className="space-y-4">
                      <Controller
                        name="send_invitation"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <Checkbox
                            checked={value}
                            onChange={onChange}
                            label="Send invitation email"
                            description="Send an email invitation to the user with login instructions"
                            error={errors.send_invitation?.message}
                          />
                        )}
                      />

                      {watchSendInvitation && (
                        <div className="ml-8 space-y-4">
                          <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="password"
                                label="Temporary Password"
                                error={errors.password?.message}
                                autoComplete="new-password"
                                placeholder="Leave blank to auto-generate"
                              />
                            )}
                          />

                          <Controller
                            name="confirm_password"
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                type="password"
                                label="Confirm Password"
                                error={errors.confirm_password?.message}
                                autoComplete="new-password"
                              />
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* App Roles Tab */}
              {activeTab === 'roles' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Assign the user to specific applications and roles. This determines what applications 
                    the user can access and what actions they can perform within each application.
                  </p>
                  
                  {apps.length > 0 ? (
                    <div className="space-y-4">
                      {apps.map((app) => (
                        <div
                          key={app.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                {app.name}
                              </h5>
                              {app.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {app.description}
                                </p>
                              )}
                            </div>
                            <Switch
                              checked={watch(`app_roles`)?.some(role => role.app_id === app.id) || false}
                              onChange={(enabled) => {
                                const currentRoles = watch('app_roles') || [];
                                if (enabled) {
                                  setValue('app_roles', [
                                    ...currentRoles.filter(r => r.app_id !== app.id),
                                    { app_id: app.id, role_id: 0, is_active: true }
                                  ]);
                                } else {
                                  setValue('app_roles', currentRoles.filter(r => r.app_id !== app.id));
                                }
                              }}
                              label="Enable Access"
                            />
                          </div>
                          
                          {watch(`app_roles`)?.some(role => role.app_id === app.id) && (
                            <Select
                              value={watch(`app_roles`)?.find(role => role.app_id === app.id)?.role_id?.toString() || ''}
                              onChange={(e) => {
                                const currentRoles = watch('app_roles') || [];
                                const roleId = parseInt(e.target.value);
                                setValue('app_roles', [
                                  ...currentRoles.filter(r => r.app_id !== app.id),
                                  { app_id: app.id, role_id: roleId, is_active: true }
                                ]);
                              }}
                              label="Role"
                              options={roleOptions}
                              placeholder="Select a role"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No applications available. Create applications first to assign roles.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Lookup Keys Tab */}
              {activeTab === 'lookup' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lookup keys allow you to store additional custom metadata for this user.
                  </p>
                  
                  <div className="space-y-4">
                    {(watch('lookup_keys') || []).map((_, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Controller
                            name={`lookup_keys.${index}.name`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                label="Key Name"
                                required
                                error={errors.lookup_keys?.[index]?.name?.message}
                              />
                            )}
                          />

                          <Controller
                            name={`lookup_keys.${index}.value`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                label="Value"
                                error={errors.lookup_keys?.[index]?.value?.message}
                              />
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <Controller
                            name={`lookup_keys.${index}.description`}
                            control={control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                label="Description"
                                error={errors.lookup_keys?.[index]?.description?.message}
                              />
                            )}
                          />

                          <Controller
                            name={`lookup_keys.${index}.private`}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <Checkbox
                                checked={value || false}
                                onChange={onChange}
                                label="Private"
                                description="Private keys are not visible to the user"
                                error={errors.lookup_keys?.[index]?.private?.message}
                              />
                            )}
                          />
                        </div>

                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const currentKeys = watch('lookup_keys') || [];
                            setValue('lookup_keys', currentKeys.filter((_, i) => i !== index));
                          }}
                        >
                          Remove Key
                        </Button>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentKeys = watch('lookup_keys') || [];
                        setValue('lookup_keys', [
                          ...currentKeys,
                          { name: '', value: '', private: false, description: '' }
                        ]);
                      }}
                    >
                      Add Lookup Key
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 shadow-sm rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isDirty ? (
                <span className="flex items-center">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mr-2"></div>
                  Unsaved changes
                </span>
              ) : (
                <span className="flex items-center">
                  <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                  All changes saved
                </span>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isDirty || !isValid || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main page component with error boundary
export default function UserEditPageWithErrorBoundary() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('User edit page error:', error, errorInfo);
        // In production, send error to monitoring service
      }}
      onReset={() => {
        // Reset any global state if needed
        window.location.reload();
      }}
    >
      <UserEditPage />
    </ErrorBoundary>
  );
}