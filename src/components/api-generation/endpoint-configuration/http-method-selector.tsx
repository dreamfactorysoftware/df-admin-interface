'use client';

import React, { useEffect, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { 
  HttpMethod, 
  HttpMethodSelectorProps, 
  HTTP_METHODS, 
  METHOD_CONFIGS, 
  getAvailableMethods,
  getMethodConfig,
  isHttpMethod
} from './types/endpoint-config.types';

/**
 * Zod schema for HTTP method validation
 */
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], {
  required_error: 'Please select an HTTP method',
  invalid_type_error: 'Invalid HTTP method selected'
});

/**
 * HTTP Method Selector Component
 * 
 * A React component for selecting HTTP methods (GET, POST, PUT, PATCH, DELETE) 
 * with dynamic endpoint configuration based on method selection. Implements 
 * Tailwind CSS styling and integrates with React Hook Form for seamless form 
 * state management.
 * 
 * Features:
 * - React Hook Form integration with real-time validation under 100ms
 * - Zod schema validation for HTTP method constraints
 * - WCAG 2.1 AA accessibility compliance
 * - Dynamic method-specific configuration options
 * - Tailwind CSS styling with consistent design system
 * - Support for method exclusion and default values
 * 
 * @param props - Configuration props for the HTTP method selector
 * @returns React functional component
 */
export function HttpMethodSelector({
  name,
  label = 'HTTP Method',
  description,
  required = true,
  disabled = false,
  defaultValue,
  excludeMethods = [],
  onMethodChange,
  showMethodConfig = false,
  className,
  'data-testid': testId = 'http-method-selector'
}: HttpMethodSelectorProps) {
  // Get form context for React Hook Form integration
  const form = useFormContext();
  
  // Set up field controller with validation
  const {
    field,
    fieldState: { error, invalid }
  } = useController({
    name,
    control: form?.control,
    rules: {
      required: required ? 'HTTP method is required' : false,
      validate: (value) => {
        if (!value) return true;
        return isHttpMethod(value) || 'Invalid HTTP method selected';
      }
    },
    defaultValue: defaultValue || ''
  });

  // Memoize available methods to prevent unnecessary re-renders
  const availableMethods = useMemo(() => {
    return getAvailableMethods(excludeMethods);
  }, [excludeMethods]);

  // Get current method configuration
  const currentMethodConfig = useMemo(() => {
    if (field.value && isHttpMethod(field.value)) {
      return getMethodConfig(field.value);
    }
    return null;
  }, [field.value]);

  // Handle method change with validation and callback
  const handleMethodChange = (value: string) => {
    // Validate the selected method
    if (isHttpMethod(value)) {
      field.onChange(value);
      
      // Trigger form validation
      if (form?.trigger) {
        form.trigger(name);
      }
      
      // Call external callback if provided
      if (onMethodChange) {
        onMethodChange(value);
      }
    }
  };

  // Set default value on mount if provided
  useEffect(() => {
    if (defaultValue && !field.value) {
      handleMethodChange(defaultValue);
    }
  }, [defaultValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate unique IDs for accessibility
  const fieldId = `${name}-http-method`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <FormField
      control={form?.control}
      name={name}
      render={() => (
        <FormItem className={cn('space-y-2', className)}>
          <FormLabel 
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              required && 'after:content-["*"] after:ml-0.5 after:text-red-500',
              error && 'text-red-600 dark:text-red-400'
            )}
          >
            {label}
          </FormLabel>
          
          <FormControl>
            <Select
              value={field.value || ''}
              onValueChange={handleMethodChange}
              disabled={disabled}
              data-testid={testId}
              aria-describedby={cn(descriptionId, errorId)}
              aria-invalid={invalid}
              aria-required={required}
            >
              <SelectTrigger 
                id={fieldId}
                className={cn(
                  'w-full',
                  error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={label}
              >
                <SelectValue 
                  placeholder="Select HTTP method..."
                  className="text-left"
                />
              </SelectTrigger>
              
              <SelectContent>
                {availableMethods.map((method) => (
                  <SelectItem 
                    key={method.value} 
                    value={method.value}
                    disabled={method.disabled}
                    className={cn(
                      'flex items-center justify-between cursor-pointer',
                      'hover:bg-gray-50 dark:hover:bg-gray-800',
                      'focus:bg-gray-50 dark:focus:bg-gray-800',
                      'data-[state=checked]:bg-blue-50 dark:data-[state=checked]:bg-blue-900/20'
                    )}
                    data-testid={`method-option-${method.value.toLowerCase()}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span 
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                          method.color === 'green' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                          method.color === 'blue' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                          method.color === 'orange' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
                          method.color === 'yellow' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
                          method.color === 'red' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        )}
                        aria-hidden="true"
                      >
                        {method.label}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {method.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          
          {description && (
            <FormDescription 
              id={descriptionId}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {description}
            </FormDescription>
          )}
          
          <FormMessage 
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          />
          
          {/* Method-specific configuration display */}
          {showMethodConfig && currentMethodConfig && field.value && (
            <div 
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              data-testid="method-config-panel"
              role="region"
              aria-labelledby={`${fieldId}-config-title`}
            >
              <h4 
                id={`${fieldId}-config-title`}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3"
              >
                {field.value} Method Configuration
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Request Body:</span>
                    <span 
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        currentMethodConfig.allowBody 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      )}
                    >
                      {currentMethodConfig.allowBody ? 'Allowed' : 'Not Allowed'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Parameters:</span>
                    <span 
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        currentMethodConfig.allowParameters 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      )}
                    >
                      {currentMethodConfig.allowParameters ? 'Allowed' : 'Not Allowed'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Caching:</span>
                    <span 
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        currentMethodConfig.supportsCaching 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      )}
                    >
                      {currentMethodConfig.supportsCaching ? 'Supported' : 'Not Supported'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Idempotent:</span>
                    <span 
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        currentMethodConfig.idempotent 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      )}
                    >
                      {currentMethodConfig.idempotent ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Safe:</span>
                    <span 
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        currentMethodConfig.safe 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      )}
                    >
                      {currentMethodConfig.safe ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Auth Required:</span>
                    <span 
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        currentMethodConfig.requireAuth 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      )}
                    >
                      {currentMethodConfig.requireAuth ? 'Required' : 'Optional'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </FormItem>
      )}
    />
  );
}

// Export the component as default for easier imports
export default HttpMethodSelector;

// Export validation schema for external use
export { httpMethodSchema };

// Export types for external use
export type { HttpMethodSelectorProps, HttpMethod };