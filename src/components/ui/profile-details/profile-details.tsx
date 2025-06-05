/**
 * @fileoverview ProfileDetails React component - User profile form implementation
 * 
 * Migrated from Angular DfProfileDetailsComponent to React functional component.
 * Implements user profile editing with React Hook Form, Zod validation, and Tailwind CSS.
 * Features nested form group structure, conditional field display, real-time validation,
 * theme-aware styling, and proper accessibility compliance.
 * 
 * @version 1.0.0
 * @requires React 19
 * @requires React Hook Form 7.57.0+
 * @requires Zod validation
 * @requires Tailwind CSS 4.1+
 * @author DreamFactory Team
 */

'use client';

import React, { useEffect, useMemo, useCallback, memo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';

// Type definitions for the component
import type {
  ProfileDetailsProps,
  ProfileDetailsFormData,
  ProfileDetailsFieldNames,
  ValidationErrors,
  ThemeAwareProps,
  AccessibilityProps,
} from './types';

// Hooks for functionality (will be implemented later or provide fallbacks)
const useTheme = () => ({
  theme: 'light' as const,
  isDarkMode: false,
});

const useTranslations = () => ({
  t: (key: string, fallback?: string) => fallback || key,
  isLoading: false,
});

// Validation schema for profile details
const profileDetailsSchema = z.object({
  username: z
    .string()
    .min(1, 'userManagement.controls.username.errors.required')
    .min(3, 'userManagement.controls.username.errors.minLength')
    .max(50, 'userManagement.controls.username.errors.maxLength')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'userManagement.controls.username.errors.invalid'),
  
  email: z
    .string()
    .min(1, 'userManagement.controls.email.errors.required')
    .email('userManagement.controls.email.errors.invalid')
    .max(255, 'userManagement.controls.email.errors.maxLength'),
  
  firstName: z
    .string()
    .min(1, 'userManagement.controls.firstName.errors.required')
    .max(100, 'userManagement.controls.firstName.errors.maxLength')
    .regex(/^[a-zA-Z\s'-]+$/, 'userManagement.controls.firstName.errors.invalid'),
  
  lastName: z
    .string()
    .min(1, 'userManagement.controls.lastName.errors.required')
    .max(100, 'userManagement.controls.lastName.errors.maxLength')
    .regex(/^[a-zA-Z\s'-]+$/, 'userManagement.controls.lastName.errors.invalid'),
  
  name: z
    .string()
    .min(1, 'userManagement.controls.displayName.errors.required')
    .max(150, 'userManagement.controls.displayName.errors.maxLength'),
  
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\+]?[1-9][\d\-\s\(\)]{7,15}$/.test(val),
      'userManagement.controls.phone.errors.invalid'
    ),
});

// Input component for consistent styling
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  isOptional?: boolean;
  darkMode?: boolean;
  icon?: React.ReactNode;
}

const Input = memo<InputProps>(({
  label,
  error,
  required = false,
  helpText,
  isOptional = false,
  darkMode = false,
  icon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;
  
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className={cn(
          'block text-sm font-medium transition-colors duration-200',
          darkMode ? 'text-gray-200' : 'text-gray-700',
          required && 'after:content-["*"] after:ml-0.5 after:text-red-500'
        )}
      >
        {label}
        {isOptional && (
          <span className={cn(
            'ml-1 text-xs font-normal',
            darkMode ? 'text-gray-400' : 'text-gray-500'
          )}>
            (optional)
          </span>
        )}
      </label>
      
      <div className="relative">
        {icon && (
          <div className={cn(
            'absolute left-3 top-1/2 transform -translate-y-1/2 text-sm',
            darkMode ? 'text-gray-400' : 'text-gray-500'
          )}>
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={cn(
            'w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'placeholder:text-gray-400',
            icon && 'pl-10',
            // Base styling
            darkMode
              ? [
                  'bg-gray-800 border-gray-600 text-gray-100',
                  'focus:border-primary-400 focus:ring-primary-500/20',
                  'hover:border-gray-500',
                ]
              : [
                  'bg-white border-gray-300 text-gray-900',
                  'focus:border-primary-500 focus:ring-primary-500/20',
                  'hover:border-gray-400',
                ],
            // Error state
            error && (
              darkMode
                ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                : 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            ),
            // Disabled state
            props.disabled && (
              darkMode
                ? 'bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
            ),
            className
          )}
          aria-invalid={!!error}
          aria-describedby={cn(
            error && errorId,
            helpText && helpId
          )}
          {...props}
        />
      </div>
      
      {helpText && (
        <p
          id={helpId}
          className={cn(
            'text-xs',
            darkMode ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          {helpText}
        </p>
      )}
      
      {error && (
        <p
          id={errorId}
          role="alert"
          className={cn(
            'text-xs font-medium',
            darkMode ? 'text-red-400' : 'text-red-600'
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Main ProfileDetails component
export const ProfileDetails = memo<ProfileDetailsProps>(({
  className,
  theme,
  accessibility,
  fieldConfig,
  validationSchema = profileDetailsSchema,
  'data-testid': testId = 'profile-details',
  ...props
}) => {
  // Hooks
  const { isDarkMode } = useTheme();
  const { t } = useTranslations();
  
  // Form context integration
  const {
    formState: { errors, touchedFields, dirtyFields },
    register,
    setValue,
    clearErrors,
    trigger,
  } = useFormContext<{ profileDetailsGroup: ProfileDetailsFormData }>();
  
  // Watch for form changes to trigger real-time validation
  const watchedFields = useWatch({
    name: 'profileDetailsGroup',
  }) as ProfileDetailsFormData;
  
  // Determine if phone field should be shown
  const showPhoneField = useMemo(() => {
    if (fieldConfig?.phone?.hidden) return false;
    if (fieldConfig?.phone?.conditional) {
      return fieldConfig.phone.conditional.condition(watchedFields || {});
    }
    return true;
  }, [fieldConfig?.phone, watchedFields]);
  
  // Real-time validation with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedFields && Object.keys(touchedFields?.profileDetailsGroup || {}).length > 0) {
        trigger('profileDetailsGroup');
      }
    }, 100); // 100ms debounce for real-time validation under requirement
    
    return () => clearTimeout(timeoutId);
  }, [watchedFields, touchedFields, trigger]);
  
  // Helper function to get field error message
  const getFieldError = useCallback((fieldName: ProfileDetailsFieldNames): string | undefined => {
    const error = errors.profileDetailsGroup?.[fieldName];
    if (!error) return undefined;
    
    if (typeof error.message === 'string') {
      return t(error.message, error.message);
    }
    
    return undefined;
  }, [errors.profileDetailsGroup, t]);
  
  // Helper function to check if field is required
  const isFieldRequired = useCallback((fieldName: ProfileDetailsFieldNames): boolean => {
    const fieldSchema = validationSchema.shape[fieldName];
    if (!fieldSchema) return false;
    
    // Check if field is optional in Zod schema
    return !fieldSchema.isOptional();
  }, [validationSchema]);
  
  // Helper function to check if field is touched
  const isFieldTouched = useCallback((fieldName: ProfileDetailsFieldNames): boolean => {
    return !!touchedFields?.profileDetailsGroup?.[fieldName];
  }, [touchedFields]);
  
  // Accessibility configuration
  const ariaProps = useMemo(() => ({
    'aria-label': accessibility?.['aria-label'] || 'Profile Details Form',
    'aria-describedby': accessibility?.['aria-describedby'],
    'aria-labelledby': accessibility?.['aria-labelledby'],
    'aria-live': accessibility?.['aria-live'] || 'polite',
    'aria-busy': accessibility?.['aria-busy'] || false,
    role: 'group',
  }), [accessibility]);
  
  // Theme configuration
  const themeClasses = useMemo(() => {
    const darkMode = theme?.colorScheme === 'dark' || 
                    (theme?.colorScheme === 'auto' && isDarkMode);
    
    return cn(
      'space-y-6 p-6',
      // Base container styling
      darkMode ? 'bg-gray-900' : 'bg-white',
      // Border and shadow
      'border rounded-lg shadow-sm',
      darkMode ? 'border-gray-700' : 'border-gray-200',
      // Size variants
      theme?.size === 'sm' && 'p-4 space-y-4',
      theme?.size === 'lg' && 'p-8 space-y-8',
      theme?.size === 'xl' && 'p-10 space-y-10',
      className
    );
  }, [theme, isDarkMode, className]);
  
  return (
    <div
      className={themeClasses}
      data-testid={testId}
      {...ariaProps}
    >
      {/* Form Fields */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Username Field */}
        <div className="md:col-span-1">
          <Input
            {...register('profileDetailsGroup.username')}
            label={t('userManagement.controls.username.altLabel', 'Username')}
            error={getFieldError('username')}
            required={isFieldRequired('username')}
            isOptional={!isFieldRequired('username')}
            darkMode={isDarkMode}
            type="text"
            autoComplete="username"
            placeholder={t('userManagement.controls.username.placeholder', 'Enter username')}
            disabled={fieldConfig?.username?.disabled}
            readOnly={fieldConfig?.username?.readOnly}
            maxLength={fieldConfig?.username?.maxLength || 50}
            helpText={fieldConfig?.username?.helpText}
          />
        </div>
        
        {/* Email Field */}
        <div className="md:col-span-1">
          <Input
            {...register('profileDetailsGroup.email')}
            label={t('userManagement.controls.email.label', 'Email')}
            error={getFieldError('email')}
            required={isFieldRequired('email')}
            darkMode={isDarkMode}
            type="email"
            autoComplete="email"
            placeholder={t('userManagement.controls.email.placeholder', 'Enter email address')}
            disabled={fieldConfig?.email?.disabled}
            readOnly={fieldConfig?.email?.readOnly}
            maxLength={fieldConfig?.email?.maxLength || 255}
            helpText={fieldConfig?.email?.helpText}
          />
        </div>
        
        {/* First Name Field */}
        <div className="md:col-span-1">
          <Input
            {...register('profileDetailsGroup.firstName')}
            label={t('userManagement.controls.firstName.label', 'First Name')}
            error={getFieldError('firstName')}
            required={isFieldRequired('firstName')}
            darkMode={isDarkMode}
            type="text"
            autoComplete="given-name"
            placeholder={t('userManagement.controls.firstName.placeholder', 'Enter first name')}
            disabled={fieldConfig?.firstName?.disabled}
            readOnly={fieldConfig?.firstName?.readOnly}
            maxLength={fieldConfig?.firstName?.maxLength || 100}
            helpText={fieldConfig?.firstName?.helpText}
          />
        </div>
        
        {/* Last Name Field */}
        <div className="md:col-span-1">
          <Input
            {...register('profileDetailsGroup.lastName')}
            label={t('userManagement.controls.lastName.label', 'Last Name')}
            error={getFieldError('lastName')}
            required={isFieldRequired('lastName')}
            darkMode={isDarkMode}
            type="text"
            autoComplete="family-name"
            placeholder={t('userManagement.controls.lastName.placeholder', 'Enter last name')}
            disabled={fieldConfig?.lastName?.disabled}
            readOnly={fieldConfig?.lastName?.readOnly}
            maxLength={fieldConfig?.lastName?.maxLength || 100}
            helpText={fieldConfig?.lastName?.helpText}
          />
        </div>
        
        {/* Display Name Field */}
        <div className="md:col-span-2">
          <Input
            {...register('profileDetailsGroup.name')}
            label={t('userManagement.controls.displayName.label', 'Display Name')}
            error={getFieldError('name')}
            required={isFieldRequired('name')}
            darkMode={isDarkMode}
            type="text"
            autoComplete="name"
            placeholder={t('userManagement.controls.displayName.placeholder', 'Enter display name')}
            disabled={fieldConfig?.name?.disabled}
            readOnly={fieldConfig?.name?.readOnly}
            maxLength={fieldConfig?.name?.maxLength || 150}
            helpText={fieldConfig?.name?.helpText || t('userManagement.controls.displayName.help', 'This name will be displayed throughout the application')}
          />
        </div>
        
        {/* Phone Field (Conditional) */}
        {showPhoneField && (
          <div className="md:col-span-2">
            <Input
              {...register('profileDetailsGroup.phone')}
              label={t('userManagement.controls.phone.label', 'Phone Number')}
              error={getFieldError('phone')}
              required={isFieldRequired('phone')}
              isOptional={!isFieldRequired('phone')}
              darkMode={isDarkMode}
              type="tel"
              autoComplete="tel"
              placeholder={t('userManagement.controls.phone.placeholder', 'Enter phone number')}
              disabled={fieldConfig?.phone?.disabled}
              readOnly={fieldConfig?.phone?.readOnly}
              maxLength={fieldConfig?.phone?.maxLength || 20}
              helpText={fieldConfig?.phone?.helpText || t('userManagement.controls.phone.help', 'Include country code for international numbers')}
            />
          </div>
        )}
      </div>
      
      {/* Form Status Indicator */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {Object.keys(errors.profileDetailsGroup || {}).length > 0 && (
          <span>{t('form.validation.hasErrors', 'Form has validation errors')}</span>
        )}
      </div>
    </div>
  );
});

ProfileDetails.displayName = 'ProfileDetails';

// Export component and types
export default ProfileDetails;
export type { ProfileDetailsProps, ProfileDetailsFormData };

// Export validation schema for reuse
export { profileDetailsSchema };