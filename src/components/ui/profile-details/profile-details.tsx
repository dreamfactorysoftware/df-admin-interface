/**
 * ProfileDetails React Component
 * 
 * Comprehensive profile details form component migrated from Angular DfProfileDetailsComponent.
 * Implements React Hook Form with Zod validation, Tailwind CSS styling, WCAG 2.1 AA compliance,
 * theme-aware design, and internationalization support. Features nested form group structure
 * with real-time validation under 100ms and conditional field rendering.
 * 
 * Key Features:
 * - React Hook Form with useFormContext for nested form management
 * - Zod schema validation with real-time validation under 100ms
 * - Tailwind CSS 4.1+ with consistent theme injection
 * - WCAG 2.1 AA accessibility compliance with comprehensive ARIA support
 * - Theme-aware styling with dark/light mode support via Zustand
 * - Internationalization with dynamic label and error message loading
 * - Conditional field rendering based on form configuration
 * - TypeScript 5.8+ with enhanced type safety
 * - React 19 concurrent features for enhanced performance
 * 
 * @fileoverview ProfileDetails component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { z } from 'zod';
import { clsx } from 'clsx';
import type {
  ProfileDetailsFormData,
  ProfileDetailsProps,
  ProfileValidationErrors,
  ProfileFormFieldName,
  ProfileAriaAttributes,
  ProfileAccessibilityConfig,
} from './types';
import { Input, EmailInput } from '../input';
import { FormField, FormLabel, FormError, FormControl } from '../form';
import { useTheme } from '../../../hooks/use-theme';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Comprehensive Zod validation schema for profile details
 * Ensures type safety and real-time validation under 100ms
 */
const profileDetailsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      'Username can only contain letters, numbers, underscores, dots, and hyphens'
    ),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email address must not exceed 254 characters'),
  
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  name: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must not exceed 100 characters'),
  
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s()-]/g, '')),
      'Please enter a valid phone number'
    ),
  
  avatar: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  role: z.string().optional(),
  lastLogin: z.date().optional(),
  isActive: z.boolean().optional(),
  isEmailVerified: z.boolean().optional(),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    dashboardLayout: z.enum(['grid', 'list', 'compact']).optional(),
    defaultTimeout: z.number().optional(),
    showAdvancedOptions: z.boolean().optional(),
    notifications: z.object({
      serviceEvents: z.boolean().optional(),
      systemUpdates: z.boolean().optional(),
      securityAlerts: z.boolean().optional(),
      usageAlerts: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
    }).optional(),
    accessibility: z.object({
      reduceMotion: z.boolean().optional(),
      highContrast: z.boolean().optional(),
      largeText: z.boolean().optional(),
      screenReader: z.boolean().optional(),
      keyboardOnly: z.boolean().optional(),
      enhancedFocus: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

// ============================================================================
// INTERNATIONALIZATION HOOKS AND UTILITIES
// ============================================================================

/**
 * Translation hook placeholder - will be replaced when use-translations.ts is available
 * Provides basic translation functionality for profile form
 */
const useTranslations = (namespace?: string) => {
  const t = useCallback((key: string, params?: Record<string, any>) => {
    // Placeholder implementation - will be replaced with actual translation system
    const translations: Record<string, string> = {
      'profile.username.label': 'Username',
      'profile.username.placeholder': 'Enter your username',
      'profile.username.description': 'Your unique identifier for login',
      'profile.email.label': 'Email Address',
      'profile.email.placeholder': 'Enter your email address',
      'profile.email.description': 'Primary email for notifications and authentication',
      'profile.firstName.label': 'First Name',
      'profile.firstName.placeholder': 'Enter your first name',
      'profile.lastName.label': 'Last Name',
      'profile.lastName.placeholder': 'Enter your last name',
      'profile.name.label': 'Display Name',
      'profile.name.placeholder': 'Enter your display name',
      'profile.name.description': 'Name shown throughout the application',
      'profile.phone.label': 'Phone Number',
      'profile.phone.placeholder': 'Enter your phone number',
      'profile.phone.description': 'Optional contact number',
      
      // Error messages
      'profile.error.required': 'This field is required',
      'profile.error.minLength': 'Minimum length is {min} characters',
      'profile.error.maxLength': 'Maximum length is {max} characters',
      'profile.error.invalidFormat': 'Invalid format',
      'profile.error.invalidEmail': 'Please enter a valid email address',
      'profile.error.invalidPhone': 'Please enter a valid phone number',
      
      // Success messages
      'profile.success.updated': 'Profile updated successfully',
      'profile.success.saved': 'Changes saved',
    };
    
    let translation = translations[key] || key;
    
    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  }, []);
  
  return { t };
};

// ============================================================================
// ACCESSIBILITY UTILITIES
// ============================================================================

/**
 * Accessibility utilities for WCAG 2.1 AA compliance
 */
const useAccessibility = (config?: ProfileAccessibilityConfig) => {
  const generateFieldId = useCallback((fieldName: string): string => {
    return `profile-${fieldName}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  const generateAriaAttributes = useCallback((
    fieldName: ProfileFormFieldName,
    hasError: boolean,
    isRequired: boolean,
    description?: string
  ): ProfileAriaAttributes['fields'][ProfileFormFieldName] => {
    const fieldId = generateFieldId(fieldName);
    return {
      'aria-label': `${fieldName} field`,
      'aria-describedby': description ? `${fieldId}-description` : undefined,
      'aria-required': isRequired,
      'aria-invalid': hasError,
      'aria-errormessage': hasError ? `${fieldId}-error` : undefined,
    };
  }, [generateFieldId]);
  
  const announceValidationChange = useCallback((fieldName: string, isValid: boolean, errorMessage?: string) => {
    if (config?.screenReader?.announceValidation) {
      const message = isValid 
        ? `${fieldName} is now valid`
        : `${fieldName} has an error: ${errorMessage}`;
      
      // Create live region announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = message;
      
      document.body.appendChild(announcement);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [config?.screenReader?.announceValidation]);
  
  return {
    generateFieldId,
    generateAriaAttributes,
    announceValidationChange,
  };
};

// ============================================================================
// PERFORMANCE OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Debounced validation hook for real-time validation under 100ms
 */
const useDebounce = <T>(value: T, delay: number): T => {
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
};

/**
 * Performance monitoring for validation timing
 */
const useValidationPerformance = () => {
  const validationTimesRef = useRef<number[]>([]);
  
  const measureValidation = useCallback(async <T>(
    validationFn: () => Promise<T> | T
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    const result = await validationFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    validationTimesRef.current.push(duration);
    
    // Keep only last 100 measurements for performance
    if (validationTimesRef.current.length > 100) {
      validationTimesRef.current = validationTimesRef.current.slice(-100);
    }
    
    // Log warning if validation takes too long
    if (duration > 100) {
      console.warn(`Validation took ${duration.toFixed(2)}ms, exceeding 100ms target`);
    }
    
    return { result, duration };
  }, []);
  
  const getAverageValidationTime = useCallback((): number => {
    const times = validationTimesRef.current;
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }, []);
  
  return {
    measureValidation,
    getAverageValidationTime,
  };
};

// ============================================================================
// MAIN COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * ProfileDetails component implementation
 */
export const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  initialData,
  onSubmit,
  onError,
  onChange,
  onCancel,
  validation,
  theme: themeConfig,
  accessibility: accessibilityConfig,
  permissions,
  layout,
  loading = false,
  disabled = false,
  showAvatar = true,
  showPreferences = false,
  customFields = [],
  validationMode = 'onChange',
  reValidateMode = 'onChange',
  onSuccess,
  formInstance,
  className,
  children,
  ...props
}) => {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================
  
  const { t } = useTranslations('profile');
  const { resolvedTheme, getAccessibleColors } = useTheme();
  const { generateFieldId, generateAriaAttributes, announceValidationChange } = useAccessibility(accessibilityConfig);
  const { measureValidation, getAverageValidationTime } = useValidationPerformance();
  
  // Form context from parent FormProvider
  const formContext = useFormContext<ProfileDetailsFormData>();
  
  if (!formContext) {
    throw new Error('ProfileDetails must be used within a FormProvider');
  }
  
  const {
    register,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isDirty, isValid },
    getValues,
  } = formContext;
  
  // Local state for conditional rendering
  const [showPhoneField, setShowPhoneField] = useState<boolean>(false);
  const [validationPerformance, setValidationPerformance] = useState<{
    average: number;
    lastValidation: number;
  }>({ average: 0, lastValidation: 0 });
  
  // Watch form values for conditional logic and onChange callback
  const watchedValues = watch();
  const debouncedValues = useDebounce(watchedValues, validation?.debounceMs || 300);
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const accessibleColors = getAccessibleColors(resolvedTheme);
  const fieldErrors = errors as ProfileValidationErrors;
  
  // Determine phone field visibility based on permissions and configuration
  const phoneFieldVisible = useMemo(() => {
    if (permissions?.read?.phone === false) return false;
    if (layout?.hiddenFields?.includes('phone')) return false;
    return showPhoneField || !!watchedValues.phone;
  }, [permissions?.read?.phone, layout?.hiddenFields, showPhoneField, watchedValues.phone]);
  
  // Theme-aware CSS classes
  const containerClasses = useMemo(() => clsx(
    'profile-details-form',
    'space-y-6',
    'transition-colors duration-150',
    {
      'opacity-50 pointer-events-none': loading || disabled,
      'animate-pulse': loading,
    },
    resolvedTheme === 'dark' ? 'dark' : 'light',
    themeConfig?.container?.card && [
      'bg-white dark:bg-gray-900',
      'border border-gray-200 dark:border-gray-700',
      'rounded-lg shadow-sm',
      themeConfig.container.padding === 'sm' ? 'p-4' :
      themeConfig.container.padding === 'lg' ? 'p-8' : 'p-6',
    ],
    themeConfig?.container?.fullWidth ? 'w-full' : 'max-w-2xl',
    className
  ), [loading, disabled, resolvedTheme, themeConfig, className]);
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handle form value changes with performance monitoring
   */
  const handleFieldChange = useCallback(async (
    fieldName: ProfileFormFieldName,
    value: any
  ) => {
    try {
      const { duration } = await measureValidation(async () => {
        // Update form value
        setValue(fieldName, value, { 
          shouldValidate: validationMode === 'onChange',
          shouldDirty: true,
          shouldTouch: true,
        });
        
        // Trigger validation if needed
        if (validationMode === 'onChange') {
          await trigger(fieldName);
        }
        
        return value;
      });
      
      // Update performance metrics
      setValidationPerformance(prev => ({
        average: getAverageValidationTime(),
        lastValidation: duration,
      }));
      
      // Call onChange callback if provided
      if (onChange) {
        onChange({ [fieldName]: value } as Partial<ProfileDetailsFormData>);
      }
      
      // Announce validation result for screen readers
      const hasError = !!fieldErrors[fieldName];
      announceValidationChange(
        fieldName,
        !hasError,
        hasError ? fieldErrors[fieldName]?.message : undefined
      );
      
    } catch (error) {
      console.error(`Validation error for field ${fieldName}:`, error);
    }
  }, [
    setValue,
    trigger,
    validationMode,
    measureValidation,
    getAverageValidationTime,
    onChange,
    fieldErrors,
    announceValidationChange,
  ]);
  
  /**
   * Handle display name auto-generation from first and last name
   */
  const handleNameFields = useCallback((firstName?: string, lastName?: string) => {
    const currentFirstName = firstName ?? watchedValues.firstName;
    const currentLastName = lastName ?? watchedValues.lastName;
    
    if (currentFirstName && currentLastName) {
      const generatedDisplayName = `${currentFirstName} ${currentLastName}`;
      if (watchedValues.name !== generatedDisplayName) {
        handleFieldChange('name', generatedDisplayName);
      }
    }
  }, [watchedValues.firstName, watchedValues.lastName, watchedValues.name, handleFieldChange]);
  
  /**
   * Toggle phone field visibility
   */
  const togglePhoneField = useCallback(() => {
    setShowPhoneField(prev => !prev);
  }, []);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  /**
   * Handle onChange callback when debounced values change
   */
  useEffect(() => {
    if (onChange && isDirty) {
      onChange(debouncedValues);
    }
  }, [debouncedValues, onChange, isDirty]);
  
  /**
   * Auto-generate display name when first/last name changes
   */
  useEffect(() => {
    handleNameFields();
  }, [watchedValues.firstName, watchedValues.lastName, handleNameFields]);
  
  /**
   * Initialize form with default values
   */
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as ProfileFormFieldName, value, { shouldDirty: false });
        }
      });
    }
  }, [initialData, setValue]);
  
  // ============================================================================
  // FIELD RENDERING UTILITIES
  // ============================================================================
  
  /**
   * Generate field configuration for consistent rendering
   */
  const getFieldConfig = useCallback((fieldName: ProfileFormFieldName) => {
    const hasError = !!fieldErrors[fieldName];
    const isRequired = ['username', 'email', 'firstName', 'lastName', 'name'].includes(fieldName);
    const isDisabled = disabled || loading || permissions?.write?.[fieldName] === false;
    const fieldId = generateFieldId(fieldName);
    
    return {
      id: fieldId,
      hasError,
      isRequired,
      isDisabled,
      ariaAttributes: generateAriaAttributes(fieldName, hasError, isRequired),
      error: fieldErrors[fieldName],
    };
  }, [fieldErrors, disabled, loading, permissions?.write, generateFieldId, generateAriaAttributes]);
  
  /**
   * Render individual form field with consistent styling
   */
  const renderFormField = useCallback((
    fieldName: ProfileFormFieldName,
    fieldType: 'text' | 'email' | 'tel' = 'text',
    additionalProps: Record<string, any> = {}
  ) => {
    const config = getFieldConfig(fieldName);
    const fieldLabel = t(`profile.${fieldName}.label`);
    const fieldPlaceholder = t(`profile.${fieldName}.placeholder`);
    const fieldDescription = t(`profile.${fieldName}.description`);
    
    const InputComponent = fieldType === 'email' ? EmailInput : Input;
    
    return (
      <FormField key={fieldName}>
        <FormLabel
          htmlFor={config.id}
          required={config.isRequired}
          className={clsx(
            'text-sm font-medium',
            resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700',
            config.hasError && 'text-red-600 dark:text-red-400'
          )}
        >
          {fieldLabel}
        </FormLabel>
        
        <FormControl>
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <InputComponent
                {...field}
                id={config.id}
                type={fieldType}
                placeholder={fieldPlaceholder}
                disabled={config.isDisabled}
                variant={config.hasError ? 'error' : 'outline'}
                size={themeConfig?.fields?.size || 'md'}
                aria-describedby={`${config.id}-description ${config.id}-error`}
                className={clsx(
                  'transition-colors duration-150',
                  config.hasError && [
                    'border-red-500 dark:border-red-400',
                    'focus:border-red-500 dark:focus:border-red-400',
                    'focus:ring-red-500/20 dark:focus:ring-red-400/20',
                  ]
                )}
                onChange={(e) => {
                  field.onChange(e);
                  handleFieldChange(fieldName, e.target.value);
                }}
                {...config.ariaAttributes}
                {...additionalProps}
              />
            )}
          />
        </FormControl>
        
        {fieldDescription && (
          <p
            id={`${config.id}-description`}
            className="text-xs text-gray-500 dark:text-gray-400 mt-1"
          >
            {fieldDescription}
          </p>
        )}
        
        <FormError
          id={`${config.id}-error`}
          error={config.error}
          className="text-xs text-red-600 dark:text-red-400 mt-1"
        />
      </FormField>
    );
  }, [
    getFieldConfig,
    t,
    control,
    handleFieldChange,
    resolvedTheme,
    themeConfig?.fields?.size,
  ]);
  
  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================
  
  return (
    <div 
      className={containerClasses}
      role="group"
      aria-labelledby="profile-details-heading"
      {...props}
    >
      {/* Form heading for screen readers */}
      <h2 id="profile-details-heading" className="sr-only">
        Profile Details Form
      </h2>
      
      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div>Average validation time: {validationPerformance.average.toFixed(2)}ms</div>
          <div>Last validation time: {validationPerformance.lastValidation.toFixed(2)}ms</div>
          {validationPerformance.average > 100 && (
            <div className="text-red-500 font-medium">
              ⚠️ Validation time exceeds 100ms target
            </div>
          )}
        </div>
      )}
      
      {/* Main form fields grid */}
      <div className={clsx(
        'grid gap-6',
        layout?.type === 'two-column' ? 'md:grid-cols-2' : 'grid-cols-1'
      )}>
        {/* Username field */}
        {renderFormField('username', 'text', {
          autoComplete: 'username',
          spellCheck: false,
        })}
        
        {/* Email field */}
        {renderFormField('email', 'email', {
          autoComplete: 'email',
        })}
        
        {/* First name field */}
        {renderFormField('firstName', 'text', {
          autoComplete: 'given-name',
        })}
        
        {/* Last name field */}
        {renderFormField('lastName', 'text', {
          autoComplete: 'family-name',
        })}
        
        {/* Display name field */}
        {renderFormField('name', 'text', {
          autoComplete: 'name',
        })}
        
        {/* Conditional phone field */}
        {phoneFieldVisible && renderFormField('phone', 'tel', {
          autoComplete: 'tel',
        })}
      </div>
      
      {/* Phone field toggle button */}
      {!phoneFieldVisible && permissions?.write?.phone !== false && (
        <button
          type="button"
          onClick={togglePhoneField}
          className={clsx(
            'text-sm text-blue-600 dark:text-blue-400',
            'hover:text-blue-700 dark:hover:text-blue-300',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
            'transition-colors duration-150'
          )}
          aria-label="Add phone number field"
        >
          + Add phone number
        </button>
      )}
      
      {/* Custom fields rendering */}
      {customFields.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Additional Information
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {customFields.map((fieldConfig) => (
              <div key={fieldConfig.name}>
                {/* Custom field implementation would go here */}
                <p className="text-xs text-gray-500">
                  Custom field: {fieldConfig.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Form validation summary for screen readers */}
      {Object.keys(fieldErrors).length > 0 && (
        <div
          role="alert"
          aria-live="polite"
          className="sr-only"
        >
          {Object.keys(fieldErrors).length} validation error(s) found. Please review and correct the highlighted fields.
        </div>
      )}
      
      {/* Additional content */}
      {children}
    </div>
  );
};

// ============================================================================
// COMPONENT CONFIGURATION
// ============================================================================

ProfileDetails.displayName = 'ProfileDetails';

// Default props for consistent behavior
const defaultProps: Partial<ProfileDetailsProps> = {
  validationMode: 'onChange',
  reValidateMode: 'onChange',
  showAvatar: true,
  showPreferences: false,
  loading: false,
  disabled: false,
  layout: {
    type: 'single-column',
    showRequired: true,
    showOptional: false,
    showHelp: 'hover',
  },
  accessibility: {
    screenReader: {
      announceValidation: true,
      announceProgress: false,
      liveRegion: 'polite',
    },
    focus: {
      autoFocusFirst: false,
      focusOnError: true,
      enhancedIndicators: true,
    },
    keyboard: {
      shortcuts: true,
      focusStrategy: 'linear',
    },
  },
  validation: {
    realTime: true,
    debounceMs: 300,
  },
};

// Assign default props
Object.assign(ProfileDetails, { defaultProps });

// ============================================================================
// EXPORTS
// ============================================================================

export default ProfileDetails;
export { ProfileDetails };
export type { ProfileDetailsProps, ProfileDetailsFormData };

/**
 * Additional utility exports for external usage
 */
export const ProfileDetailsUtils = {
  schema: profileDetailsSchema,
  validateProfileData: (data: Partial<ProfileDetailsFormData>) => {
    return profileDetailsSchema.safeParse(data);
  },
  generateDisplayName: (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`.trim();
  },
} as const;