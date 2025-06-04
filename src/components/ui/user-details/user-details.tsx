/**
 * @fileoverview User Details Component - React implementation migrated from Angular DfUserDetailsBaseComponent
 * @description Comprehensive user management interface with profile editing, role assignment, security settings,
 * and conditional form workflows. Supports both admin and user creation/editing modes with complex nested forms.
 * @module UserDetailsComponent
 * @version 1.0.0
 * @since 2024-12-19
 */

'use client';

import React, { 
  useCallback, 
  useEffect, 
  useMemo, 
  useState, 
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  useForm, 
  useFieldArray, 
  useWatch, 
  Controller,
  FormProvider,
  useFormContext,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Switch } from '@headlessui/react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  CogIcon,
  KeyIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Type imports
import type {
  UserDetailsProps,
  UserDetailsFormData,
  ProfileDetailsFormData,
  TabAccessItem,
  LookupKeyItem,
  AppRoleItem,
  FormMode,
  UserType,
  ValidationState,
  AccessibilityProps,
  ThemeMode,
} from './types';

// Hook imports - these will be available once created
import { useTheme } from '@/hooks/use-theme';
import { usePaywall } from '@/hooks/use-paywall';
import { useDebounce } from '@/hooks/use-debounce';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';

// Component imports - these will be available once created
import { ProfileDetails } from '@/components/ui/profile-details';
import { UserAppRoles } from '@/components/ui/user-app-roles';
import { LookupKeys } from '@/components/ui/lookup-keys';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';

// Utility imports - these will be available once created
import { cn } from '@/lib/utils';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Profile details validation schema with comprehensive field validation
 */
const profileDetailsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must not exceed 255 characters'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters'),
  name: z
    .string()
    .min(1, 'Display name is required')
    .max(200, 'Display name must not exceed 200 characters'),
  phone: z
    .string()
    .regex(/^[\+]?[0-9\(\)\-\.\s]+$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

/**
 * Tab access item validation schema
 */
const tabAccessSchema = z.object({
  id: z.string().min(1, 'Tab ID is required'),
  name: z.string().min(1, 'Tab name is required'),
  label: z.string().min(1, 'Tab label is required'),
  selected: z.boolean().default(false),
  enabled: z.boolean().default(true),
  required: z.boolean().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

/**
 * Lookup key validation schema
 */
const lookupKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Lookup key name is required')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, underscores, and hyphens'),
  value: z
    .string()
    .min(1, 'Lookup key value is required')
    .max(1000, 'Value must not exceed 1000 characters'),
  private: z.boolean().default(false),
  description: z.string().optional(),
});

/**
 * App role validation schema
 */
const appRoleSchema = z.object({
  app: z.string().min(1, 'Application is required'),
  role: z.string().min(1, 'Role is required'),
  appName: z.string().optional(),
  roleName: z.string().optional(),
  active: z.boolean().default(true),
});

/**
 * Complete user details form validation schema
 */
const userDetailsSchema = z.object({
  profileDetailsGroup: profileDetailsSchema,
  isActive: z.boolean().default(true),
  tabs: z.array(tabAccessSchema).default([]),
  lookupKeys: z.array(lookupKeySchema).default([]),
  appRoles: z.array(appRoleSchema).default([]),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .optional(),
  confirmPassword: z.string().optional(),
  setPassword: z.boolean().default(false),
  sendInvite: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Password confirmation validation
  if (data.setPassword && data.password && data.confirmPassword !== data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });
  }

  // Require password for new users when not sending invite
  if (!data.sendInvite && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Password is required when not sending an invite',
      path: ['password'],
    });
  }
});

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

/**
 * Component ref interface for parent access
 */
export interface UserDetailsRef {
  /** Submit the form programmatically */
  submit: () => Promise<void>;
  /** Reset the form to initial values */
  reset: () => void;
  /** Validate the form */
  validate: () => Promise<boolean>;
  /** Get current form values */
  getValues: () => UserDetailsFormData;
  /** Set form values */
  setValues: (values: Partial<UserDetailsFormData>) => void;
}

/**
 * Internal component state interface
 */
interface UserDetailsState {
  /** Current validation state */
  validationState: ValidationState;
  /** Whether component is mounted */
  isMounted: boolean;
  /** Current step in multi-step workflow */
  currentStep: number;
  /** Total steps in workflow */
  totalSteps: number;
  /** Password visibility toggle */
  showPassword: boolean;
  /** Confirm password visibility toggle */
  showConfirmPassword: boolean;
  /** Whether form has been submitted */
  hasSubmitted: boolean;
  /** Loading states for async operations */
  loading: {
    submit: boolean;
    validate: boolean;
    reset: boolean;
  };
}

/**
 * Tab management interface
 */
interface TabManager {
  /** Select all tabs */
  selectAll: () => void;
  /** Deselect all tabs */
  deselectAll: () => void;
  /** Toggle individual tab selection */
  toggleTab: (tabId: string) => void;
  /** Check if all tabs are selected */
  isAllSelected: boolean;
  /** Check if some tabs are selected */
  isSomeSelected: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Default tab access items for admin users
 */
const getDefaultTabs = (): TabAccessItem[] => [
  {
    id: 'api-docs',
    name: 'api-docs',
    label: 'API Documentation',
    selected: false,
    enabled: true,
    description: 'Access to API documentation and testing interfaces',
    category: 'development',
  },
  {
    id: 'schema',
    name: 'schema',
    label: 'Schema Management',
    selected: false,
    enabled: true,
    description: 'Database schema viewing and management capabilities',
    category: 'database',
  },
  {
    id: 'services',
    name: 'services',
    label: 'Service Configuration',
    selected: false,
    enabled: true,
    description: 'Service configuration and management access',
    category: 'administration',
  },
  {
    id: 'files',
    name: 'files',
    label: 'File Management',
    selected: false,
    enabled: true,
    description: 'File system access and management capabilities',
    category: 'data',
  },
  {
    id: 'apps',
    name: 'apps',
    label: 'Application Management',
    selected: false,
    enabled: true,
    description: 'Application configuration and deployment management',
    category: 'administration',
  },
  {
    id: 'users',
    name: 'users',
    label: 'User Management',
    selected: false,
    enabled: true,
    description: 'User account creation and management capabilities',
    category: 'security',
  },
  {
    id: 'roles',
    name: 'roles',
    label: 'Role Management',
    selected: false,
    enabled: true,
    description: 'Role definition and permission management',
    category: 'security',
  },
  {
    id: 'config',
    name: 'config',
    label: 'System Configuration',
    selected: false,
    enabled: true,
    description: 'System-wide configuration and settings management',
    category: 'administration',
  },
];

/**
 * Generate default form values based on mode and user type
 */
const getDefaultFormValues = (
  mode: FormMode,
  userType: UserType,
  currentProfile?: Partial<UserDetailsFormData>
): UserDetailsFormData => {
  const baseValues: UserDetailsFormData = {
    profileDetailsGroup: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      name: '',
      phone: '',
    },
    isActive: true,
    tabs: userType === 'admins' ? getDefaultTabs() : [],
    lookupKeys: [],
    appRoles: [],
    setPassword: mode === 'create',
    sendInvite: mode === 'create',
  };

  // Merge with current profile data for edit mode
  if (mode === 'edit' && currentProfile) {
    return {
      ...baseValues,
      ...currentProfile,
      profileDetailsGroup: {
        ...baseValues.profileDetailsGroup,
        ...currentProfile.profileDetailsGroup,
      },
    };
  }

  return baseValues;
};

/**
 * Debounce utility for form validation
 */
const useFormValidation = (form: any, delay: number = 300) => {
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const debouncedValidation = useDebounce(
    async () => {
      setValidationState('pending');
      try {
        const isValid = await form.trigger();
        setValidationState(isValid ? 'valid' : 'invalid');
        return isValid;
      } catch (error) {
        setValidationState('invalid');
        return false;
      }
    },
    delay
  );

  return { validationState, validateForm: debouncedValidation };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * UserDetails Component
 * 
 * Comprehensive user management interface that handles user creation and editing
 * workflows with support for profile details, role assignments, security settings,
 * and conditional form behaviors. Migrated from Angular DfUserDetailsBaseComponent
 * with enhanced React patterns, accessibility, and performance optimizations.
 */
export const UserDetails = forwardRef<UserDetailsRef, UserDetailsProps>(
  (
    {
      mode,
      userType,
      disabled = false,
      loading = false,
      defaultValues,
      validation,
      schemas,
      callbacks,
      apps = [],
      roles = [],
      availableTabs,
      currentProfile,
      paywall,
      showPasswordFields = true,
      showInviteFeature = true,
      showAdminAccess = true,
      showAppRoles = true,
      showLookupKeys = true,
      layout = { columns: 1, gap: 'md', responsive: true },
      fieldVisibility,
      fieldLabels,
      fieldPlaceholders,
      cancelRoute,
      customActions = [],
      customRenderers,
      conditionalFields = [],
      sections = [],
      className,
      'data-testid': dataTestId,
      theme: themeOverride,
      darkMode,
      locale = 'en',
      namespace = 'userDetails',
      translations,
      size = 'md',
      ...accessibilityProps
    },
    ref
  ) => {
    // ========================================================================
    // HOOKS AND STATE
    // ========================================================================

    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, isDarkMode } = useTheme();
    const { isActive: paywallActive, restrictedFeatures } = usePaywall();
    const { isMobile, isTablet, isDesktop } = useBreakpoint();
    const { showNotification } = useNotifications();
    const { user } = useAuth();

    // Component state management
    const [state, setState] = useState<UserDetailsState>({
      validationState: 'idle',
      isMounted: false,
      currentStep: 1,
      totalSteps: 4,
      showPassword: false,
      showConfirmPassword: false,
      hasSubmitted: false,
      loading: {
        submit: false,
        validate: false,
        reset: false,
      },
    });

    // Form setup with React Hook Form
    const formDefaultValues = useMemo(
      () => getDefaultFormValues(mode, userType, currentProfile || defaultValues),
      [mode, userType, currentProfile, defaultValues]
    );

    const form = useForm<UserDetailsFormData>({
      resolver: zodResolver(schemas?.userDetailsSchema || userDetailsSchema),
      defaultValues: formDefaultValues,
      mode: validation?.mode || 'onChange',
      reValidateMode: validation?.reValidateMode || 'onChange',
      shouldFocusError: validation?.shouldFocusError ?? true,
      delayError: validation?.delayError || 100,
    });

    const {
      control,
      handleSubmit,
      formState: { errors, isDirty, isSubmitting, isValid },
      watch,
      setValue,
      getValues,
      reset,
      trigger,
      unregister,
      register,
    } = form;

    // Field arrays for dynamic collections
    const tabsFieldArray = useFieldArray({
      control,
      name: 'tabs',
    });

    const lookupKeysFieldArray = useFieldArray({
      control,
      name: 'lookupKeys',
    });

    const appRolesFieldArray = useFieldArray({
      control,
      name: 'appRoles',
    });

    // Watch form values for conditional logic
    const watchedValues = useWatch({ control });
    const setPassword = watch('setPassword');
    const sendInvite = watch('sendInvite');
    const isActive = watch('isActive');
    const tabs = watch('tabs');

    // Form validation hook
    const { validationState, validateForm } = useFormValidation(form);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    // Theme computation
    const effectiveTheme = themeOverride || theme;
    const isEffectiveDarkMode = darkMode ?? (effectiveTheme === 'dark' || 
      (effectiveTheme === 'system' && isDarkMode));

    // Paywall restrictions
    const isPaywallRestricted = paywallActive && paywall?.isActive;
    const restrictedTabAccess = restrictedFeatures.includes('tab-access');
    const restrictedLookupKeys = restrictedFeatures.includes('lookup-keys');
    const restrictedAppRoles = restrictedFeatures.includes('app-roles');

    // Layout responsive classes
    const layoutClasses = useMemo(() => {
      const baseClasses = 'space-y-6';
      const responsiveClasses = layout.responsive
        ? {
            'grid-cols-1': isMobile,
            'grid-cols-1 md:grid-cols-2': isTablet && layout.columns >= 2,
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': isDesktop && layout.columns >= 3,
          }
        : { [`grid-cols-${layout.columns}`]: true };

      const gapClasses = {
        xs: 'gap-2',
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8',
        xl: 'gap-10',
      };

      return cn(
        baseClasses,
        layout.columns > 1 && 'grid',
        responsiveClasses,
        gapClasses[layout.gap || 'md']
      );
    }, [layout, isMobile, isTablet, isDesktop]);

    // ========================================================================
    // TAB MANAGEMENT
    // ========================================================================

    const tabManager: TabManager = useMemo(() => {
      const selectAll = () => {
        const updatedTabs = tabs.map(tab => ({ ...tab, selected: true }));
        setValue('tabs', updatedTabs, { shouldDirty: true, shouldValidate: true });
      };

      const deselectAll = () => {
        const updatedTabs = tabs.map(tab => ({ ...tab, selected: false }));
        setValue('tabs', updatedTabs, { shouldDirty: true, shouldValidate: true });
      };

      const toggleTab = (tabId: string) => {
        const updatedTabs = tabs.map(tab =>
          tab.id === tabId ? { ...tab, selected: !tab.selected } : tab
        );
        setValue('tabs', updatedTabs, { shouldDirty: true, shouldValidate: true });
      };

      const selectedTabs = tabs.filter(tab => tab.selected);
      const isAllSelected = tabs.length > 0 && selectedTabs.length === tabs.length;
      const isSomeSelected = selectedTabs.length > 0 && selectedTabs.length < tabs.length;

      return {
        selectAll,
        deselectAll,
        toggleTab,
        isAllSelected,
        isSomeSelected,
      };
    }, [tabs, setValue]);

    // ========================================================================
    // CONDITIONAL FIELD LOGIC
    // ========================================================================

    // Password field management
    useEffect(() => {
      if (mode === 'create') {
        if (sendInvite) {
          unregister('password');
          unregister('confirmPassword');
        } else if (setPassword) {
          register('password');
          register('confirmPassword');
        }
      } else if (mode === 'edit') {
        if (setPassword) {
          register('password');
          register('confirmPassword');
        } else {
          unregister('password');
          unregister('confirmPassword');
        }
      }
    }, [mode, setPassword, sendInvite, register, unregister]);

    // Paywall enforcement for tabs
    useEffect(() => {
      if (restrictedTabAccess && tabs.length > 0) {
        setValue('tabs', [], { shouldDirty: true });
      }
    }, [restrictedTabAccess, setValue, tabs.length]);

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================

    /**
     * Form submission handler with comprehensive error handling
     */
    const onSubmit = useCallback(async (data: UserDetailsFormData) => {
      setState(prev => ({ ...prev, loading: { ...prev.loading, submit: true } }));

      try {
        // Validate form before submission
        const isValid = await trigger();
        if (!isValid) {
          throw new Error('Form validation failed');
        }

        // Execute callback if provided
        if (callbacks?.onSubmit) {
          await callbacks.onSubmit(data);
        }

        // Success notification
        showNotification({
          type: 'success',
          title: mode === 'create' ? 'User Created' : 'User Updated',
          message: `User ${data.profileDetailsGroup.name} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
        });

        // Execute success callback
        if (callbacks?.onSuccess) {
          callbacks.onSuccess(data);
        }

        setState(prev => ({ ...prev, hasSubmitted: true }));
      } catch (error) {
        console.error('Form submission error:', error);
        
        // Error notification
        showNotification({
          type: 'error',
          title: 'Submission Failed',
          message: error instanceof Error ? error.message : 'An unexpected error occurred.',
        });

        // Execute error callback
        if (callbacks?.onError) {
          callbacks.onError(error as Error);
        }
      } finally {
        setState(prev => ({ ...prev, loading: { ...prev.loading, submit: false } }));
      }
    }, [trigger, callbacks, mode, showNotification]);

    /**
     * Form reset handler
     */
    const onReset = useCallback(() => {
      setState(prev => ({ ...prev, loading: { ...prev.loading, reset: true } }));
      
      reset(formDefaultValues);
      setState(prev => ({
        ...prev,
        hasSubmitted: false,
        showPassword: false,
        showConfirmPassword: false,
        loading: { ...prev.loading, reset: false },
      }));

      if (callbacks?.onReset) {
        callbacks.onReset();
      }
    }, [reset, formDefaultValues, callbacks]);

    /**
     * Cancel handler with navigation
     */
    const onCancel = useCallback(() => {
      if (callbacks?.onCancel) {
        callbacks.onCancel();
      } else if (cancelRoute) {
        router.push(cancelRoute);
      } else {
        router.back();
      }
    }, [callbacks, cancelRoute, router]);

    /**
     * Lookup key management
     */
    const addLookupKey = useCallback(() => {
      lookupKeysFieldArray.append({
        name: '',
        value: '',
        private: false,
        description: '',
      });
    }, [lookupKeysFieldArray]);

    const removeLookupKey = useCallback((index: number) => {
      lookupKeysFieldArray.remove(index);
    }, [lookupKeysFieldArray]);

    /**
     * App role management
     */
    const addAppRole = useCallback(() => {
      appRolesFieldArray.append({
        app: '',
        role: '',
        active: true,
      });
    }, [appRolesFieldArray]);

    const removeAppRole = useCallback((index: number) => {
      appRolesFieldArray.remove(index);
    }, [appRolesFieldArray]);

    // ========================================================================
    // IMPERATIVE HANDLE FOR REF
    // ========================================================================

    useImperativeHandle(ref, () => ({
      submit: async () => {
        await handleSubmit(onSubmit)();
      },
      reset: onReset,
      validate: async () => {
        setState(prev => ({ ...prev, loading: { ...prev.loading, validate: true } }));
        try {
          const isValid = await trigger();
          return isValid;
        } finally {
          setState(prev => ({ ...prev, loading: { ...prev.loading, validate: false } }));
        }
      },
      getValues,
      setValues: (values: Partial<UserDetailsFormData>) => {
        Object.entries(values).forEach(([key, value]) => {
          setValue(key as keyof UserDetailsFormData, value, { shouldDirty: true });
        });
      },
    }), [handleSubmit, onSubmit, onReset, trigger, getValues, setValue]);

    // ========================================================================
    // LIFECYCLE EFFECTS
    // ========================================================================

    useEffect(() => {
      setState(prev => ({ ...prev, isMounted: true }));
      return () => {
        setState(prev => ({ ...prev, isMounted: false }));
      };
    }, []);

    // Auto-save for draft mode (if configured)
    useEffect(() => {
      if (isDirty && callbacks?.onChange) {
        const subscription = form.watch((value) => {
          callbacks.onChange(value as Partial<UserDetailsFormData>);
        });
        return () => subscription.unsubscribe();
      }
    }, [isDirty, callbacks, form]);

    // ========================================================================
    // RENDER FUNCTIONS
    // ========================================================================

    /**
     * Render password fields with conditional logic
     */
    const renderPasswordFields = () => {
      if (!showPasswordFields) return null;

      const showPasswordControls = mode === 'create' ? !sendInvite : setPassword;

      return (
        <div className="space-y-4">
          {mode === 'create' && (
            <div className="flex items-center justify-between">
              <Controller
                name="sendInvite"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    label="Send email invitation"
                    description="User will receive an email to set their password"
                    disabled={disabled}
                    className="text-sm"
                    aria-describedby="send-invite-description"
                  />
                )}
              />
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex items-center justify-between">
              <Controller
                name="setPassword"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    label="Set password"
                    description="Manually set a password for this user"
                    disabled={disabled}
                    className="text-sm"
                    aria-describedby="set-password-description"
                  />
                )}
              />
            </div>
          )}

          {showPasswordControls && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        type={state.showPassword ? 'text' : 'password'}
                        label="Password"
                        placeholder="Enter password"
                        error={fieldState.error?.message}
                        disabled={disabled}
                        required
                        aria-describedby="password-requirements"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setState(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        aria-label={state.showPassword ? 'Hide password' : 'Show password'}
                      >
                        {state.showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}
                />
                <p id="password-requirements" className="mt-1 text-sm text-gray-500">
                  Must contain at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="relative">
                      <Input
                        {...field}
                        type={state.showConfirmPassword ? 'text' : 'password'}
                        label="Confirm Password"
                        placeholder="Confirm password"
                        error={fieldState.error?.message}
                        disabled={disabled}
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setState(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                        aria-label={state.showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {state.showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>
      );
    };

    /**
     * Render admin access tab controls
     */
    const renderTabAccessControl = () => {
      if (!showAdminAccess || userType !== 'admins') return null;

      if (restrictedTabAccess) {
        return (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Premium Feature Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Tab access control is available with a premium license.
                </p>
                {paywall?.upgradeUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(paywall.upgradeUrl, '_blank')}
                  >
                    Upgrade Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Admin Access Control
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={tabManager.selectAll}
                disabled={disabled || tabManager.isAllSelected}
                className="text-xs"
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={tabManager.deselectAll}
                disabled={disabled || tabs.filter(t => t.selected).length === 0}
                className="text-xs"
              >
                Deselect All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tabsFieldArray.fields.map((tab, index) => (
              <div
                key={tab.id}
                className={cn(
                  'relative flex items-center p-3 rounded-lg border',
                  'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                  'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
                  tab.selected
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                )}
              >
                <Controller
                  name={`tabs.${index}.selected`}
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={disabled || !tab.enabled}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-describedby={`tab-${tab.id}-description`}
                    />
                  )}
                />
                <div className="ml-3 flex-1">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {tab.label}
                  </label>
                  {tab.description && (
                    <p id={`tab-${tab.id}-description`} className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tab.description}
                    </p>
                  )}
                </div>
                {tab.required && (
                  <span className="text-red-500 text-xs font-medium">Required</span>
                )}
              </div>
            ))}
          </div>

          {tabs.filter(t => t.selected).length > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {tabs.filter(t => t.selected).length} of {tabs.length} tabs selected
            </div>
          )}
        </div>
      );
    };

    /**
     * Render lookup keys section
     */
    const renderLookupKeys = () => {
      if (!showLookupKeys) return null;

      if (restrictedLookupKeys) {
        return (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Premium Feature Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Lookup keys are available with a premium license.
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Lookup Keys
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLookupKey}
              disabled={disabled}
              className="flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Key
            </Button>
          </div>

          <div className="space-y-3">
            {lookupKeysFieldArray.fields.map((lookupKey, index) => (
              <div
                key={lookupKey.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name={`lookupKeys.${index}.name`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        label="Key Name"
                        placeholder="e.g., api_key"
                        error={fieldState.error?.message}
                        disabled={disabled}
                        required
                      />
                    )}
                  />
                  <Controller
                    name={`lookupKeys.${index}.value`}
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        label="Key Value"
                        placeholder="Enter value"
                        error={fieldState.error?.message}
                        disabled={disabled}
                        required
                      />
                    )}
                  />
                  <div className="flex items-end space-x-2">
                    <Controller
                      name={`lookupKeys.${index}.private`}
                      control={control}
                      render={({ field }) => (
                        <Toggle
                          checked={field.value}
                          onChange={field.onChange}
                          label="Private"
                          description="Hide value in API responses"
                          disabled={disabled}
                          size="sm"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLookupKey(index)}
                      disabled={disabled}
                      className="flex items-center"
                      aria-label={`Remove lookup key ${lookupKey.name || index + 1}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {lookupKeysFieldArray.fields.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No lookup keys configured. Click "Add Key" to create one.
              </div>
            )}
          </div>
        </div>
      );
    };

    /**
     * Render app roles section
     */
    const renderAppRoles = () => {
      if (!showAppRoles) return null;

      if (restrictedAppRoles) {
        return (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Premium Feature Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  App role assignments are available with a premium license.
                </p>
              </div>
            </div>
          </div>
        );
      }

      return (
        <UserAppRoles
          apps={apps}
          roles={roles}
          fieldArray={appRolesFieldArray}
          control={control}
          errors={errors.appRoles}
          disabled={disabled}
        />
      );
    };

    /**
     * Render form actions
     */
    const renderFormActions = () => (
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled || state.loading.submit}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={disabled || state.loading.submit || !isDirty}
            loading={state.loading.reset}
          >
            Reset
          </Button>
        </div>

        <div className="flex space-x-3">
          {customActions.map((action, index) => (
            <Button
              key={index}
              type="button"
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
              disabled={disabled || action.disabled || state.loading.submit}
              loading={action.loading}
            >
              {action.label}
            </Button>
          ))}
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || !isValid}
            loading={state.loading.submit}
            className="min-w-[120px]"
          >
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </div>
      </div>
    );

    // ========================================================================
    // MAIN RENDER
    // ========================================================================

    if (loading) {
      return (
        <div 
          className="flex items-center justify-center p-8"
          role="status"
          aria-label="Loading user details form"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading user details...</span>
        </div>
      );
    }

    return (
      <FormProvider {...form}>
        <div
          className={cn(
            'max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg',
            'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2',
            isEffectiveDarkMode && 'ring-offset-gray-900',
            className
          )}
          data-testid={dataTestId}
          {...accessibilityProps}
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {mode === 'create'
                ? `Create a new ${userType === 'admins' ? 'administrator' : 'user'} account with appropriate permissions and access controls.`
                : `Modify user profile, permissions, and access settings for this ${userType === 'admins' ? 'administrator' : 'user'}.`
              }
            </p>
          </div>

          {/* Progress indicator for multi-step workflow */}
          {state.totalSteps > 1 && (
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {Array.from({ length: state.totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center',
                      i < state.totalSteps - 1 && 'flex-1'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                        i + 1 <= state.currentStep
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {i + 1 < state.currentStep ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i < state.totalSteps - 1 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 mx-4',
                          i + 1 < state.currentStep
                            ? 'bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form content */}
          <form onSubmit={handleSubmit(onSubmit)} className={layoutClasses} noValidate>
            {/* User Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  User Status
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isActive ? 'User account is active and can log in' : 'User account is disabled'}
                </p>
              </div>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={disabled}
                    label="Active"
                    className="ml-4"
                  />
                )}
              />
            </div>

            {/* Profile Details Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Profile Information
              </h2>
              <ProfileDetails
                control={control}
                errors={errors.profileDetailsGroup}
                disabled={disabled}
                fieldLabels={fieldLabels}
                fieldPlaceholders={fieldPlaceholders}
              />
            </div>

            {/* Password Management Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <KeyIcon className="h-5 w-5 mr-2" />
                Password Settings
              </h2>
              {renderPasswordFields()}
            </div>

            {/* Admin Access Control Section */}
            {userType === 'admins' && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Access Control
                </h2>
                {renderTabAccessControl()}
              </div>
            )}

            {/* Lookup Keys Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <CogIcon className="h-5 w-5 mr-2" />
                Configuration
              </h2>
              {renderLookupKeys()}
            </div>

            {/* App Roles Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Role Assignments
              </h2>
              {renderAppRoles()}
            </div>

            {/* Global form errors */}
            {Object.keys(errors).length > 0 && (
              <Alert
                type="error"
                title="Form Validation Errors"
                message="Please correct the errors below before submitting the form."
                className="mt-4"
              />
            )}

            {/* Form Actions */}
            {renderFormActions()}
          </form>
        </div>
      </FormProvider>
    );
  }
);

UserDetails.displayName = 'UserDetails';

export type { UserDetailsProps, UserDetailsFormData, UserDetailsRef };
export default UserDetails;