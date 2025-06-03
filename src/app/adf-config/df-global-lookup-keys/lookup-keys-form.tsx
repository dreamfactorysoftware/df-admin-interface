'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { FormField, FormControl, FormLabel, FormError } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

// Lookup key schema with Zod validation
const lookupKeySchema = z.object({
  id: z.number().optional().nullable(),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Name can only contain letters, numbers, underscores, and hyphens'),
  value: z.string().max(2048, 'Value must be less than 2048 characters'),
  private: z.boolean().default(false),
});

// Form schema with unique name validation
const lookupKeysFormSchema = z.object({
  lookupKeys: z.array(lookupKeySchema)
    .refine((keys) => {
      const names = keys.map(key => key.name.toLowerCase());
      return names.length === new Set(names).size;
    }, {
      message: 'Lookup key names must be unique',
      path: ['root']
    })
});

// TypeScript interfaces
export interface LookupKey {
  id?: number | null;
  name: string;
  value: string;
  private: boolean;
  description?: string;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

export interface LookupKeysFormProps {
  initialKeys?: LookupKey[];
  onSubmit: (data: { lookupKeys: LookupKey[] }) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export type LookupKeysFormData = z.infer<typeof lookupKeysFormSchema>;

/**
 * Lookup Keys Form Component
 * 
 * React form component for managing individual global lookup key entries,
 * implementing React Hook Form with Zod schema validation for real-time validation.
 * Provides comprehensive interface for adding, editing, and validating lookup key
 * entries with unique name constraints, private flag management, and optimistic updates.
 * 
 * Features:
 * - Real-time validation under 100ms using React Hook Form + Zod
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels
 * - Unique name validation with custom Zod schema refinement
 * - Dynamic field array management for add/remove operations
 * - Responsive table layout with proper keyboard navigation
 * - Dark theme support with consistent styling
 */
export function LookupKeysForm({
  initialKeys = [],
  onSubmit,
  isLoading = false,
  className
}: LookupKeysFormProps) {
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<LookupKeysFormData>({
    resolver: zodResolver(lookupKeysFormSchema),
    defaultValues: {
      lookupKeys: initialKeys.length > 0 ? initialKeys : []
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Field array for dynamic lookup key management
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lookupKeys',
  });

  // Add new lookup key entry
  const addLookupKey = useCallback(() => {
    append({
      name: '',
      value: '',
      private: false,
    });
  }, [append]);

  // Remove lookup key entry
  const removeLookupKey = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Form submission handler
  const handleSubmit = useCallback(async (data: LookupKeysFormData) => {
    if (submitting || isLoading) return;

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      // Error handling is managed by parent component
      console.error('Failed to save lookup keys:', error);
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, submitting, isLoading]);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    return form.formState.isDirty;
  }, [form.formState.isDirty]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return form.formState.isValid && fields.length > 0;
  }, [form.formState.isValid, fields.length]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Description */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Define global lookup keys that can be referenced throughout your APIs. 
        These key-value pairs provide consistent configuration values across all services.
      </div>

      {/* Form */}
      <form 
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        noValidate
      >
        {/* Lookup Keys Table */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 p-4">
              <div className="col-span-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Name
                </span>
              </div>
              <div className="col-span-4">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Value
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Private
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addLookupKey}
                  disabled={submitting || isLoading}
                  className="h-8 w-8 p-0"
                  aria-label="Add new lookup key entry"
                  data-testid="add-lookup-key-button"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {fields.length === 0 ? (
              <div 
                className="p-8 text-center text-gray-500 dark:text-gray-400"
                data-testid="no-lookup-keys-message"
              >
                No lookup keys defined. Click the + button to add your first key.
              </div>
            ) : (
              fields.map((field, index) => (
                <div 
                  key={field.id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  data-testid={`lookup-key-row-${index}`}
                >
                  {/* Name Field */}
                  <div className="col-span-4">
                    <Controller
                      name={`lookupKeys.${index}.name`}
                      control={form.control}
                      render={({ field: nameField, fieldState }) => (
                        <FormField>
                          <FormControl>
                            <Input
                              {...nameField}
                              placeholder="Enter key name"
                              disabled={
                                submitting || 
                                isLoading || 
                                (form.getValues(`lookupKeys.${index}.id`) !== undefined &&
                                 form.getValues(`lookupKeys.${index}.id`) !== null)
                              }
                              aria-label={`Lookup key name for entry ${index + 1}`}
                              aria-describedby={
                                fieldState.error ? `name-error-${index}` : undefined
                              }
                              className={cn(
                                fieldState.error && 'border-red-500 focus:ring-red-500'
                              )}
                              data-testid={`lookup-key-name-${index}`}
                            />
                          </FormControl>
                          {fieldState.error && (
                            <FormError 
                              id={`name-error-${index}`}
                              className="mt-1"
                            >
                              {fieldState.error.message}
                            </FormError>
                          )}
                        </FormField>
                      )}
                    />
                  </div>

                  {/* Value Field */}
                  <div className="col-span-4">
                    <Controller
                      name={`lookupKeys.${index}.value`}
                      control={form.control}
                      render={({ field: valueField, fieldState }) => (
                        <FormField>
                          <FormControl>
                            <Input
                              {...valueField}
                              placeholder="Enter key value"
                              disabled={submitting || isLoading}
                              aria-label={`Lookup key value for entry ${index + 1}`}
                              aria-describedby={
                                fieldState.error ? `value-error-${index}` : undefined
                              }
                              className={cn(
                                fieldState.error && 'border-red-500 focus:ring-red-500'
                              )}
                              data-testid={`lookup-key-value-${index}`}
                            />
                          </FormControl>
                          {fieldState.error && (
                            <FormError 
                              id={`value-error-${index}`}
                              className="mt-1"
                            >
                              {fieldState.error.message}
                            </FormError>
                          )}
                        </FormField>
                      )}
                    />
                  </div>

                  {/* Private Field */}
                  <div className="col-span-2 flex items-center">
                    <Controller
                      name={`lookupKeys.${index}.private`}
                      control={form.control}
                      render={({ field: privateField }) => (
                        <FormField>
                          <FormControl>
                            <Toggle
                              checked={privateField.value}
                              onCheckedChange={privateField.onChange}
                              disabled={submitting || isLoading}
                              aria-label={`Mark lookup key ${index + 1} as private`}
                              size="sm"
                              data-testid={`lookup-key-private-${index}`}
                            />
                          </FormControl>
                        </FormField>
                      )}
                    />
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeLookupKey(index)}
                      disabled={submitting || isLoading}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      aria-label={`Remove lookup key entry ${index + 1}`}
                      data-testid={`remove-lookup-key-${index}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Form Errors */}
        {form.formState.errors.root && (
          <FormError className="text-center">
            {form.formState.errors.root.message}
          </FormError>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!hasChanges || !isValid || submitting || isLoading}
            className="px-6"
            data-testid="save-lookup-keys-button"
            aria-label="Save lookup keys configuration"
          >
            {submitting || isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>

      {/* Keyboard Navigation Instructions */}
      <div className="sr-only" aria-live="polite">
        Use Tab to navigate between form fields. 
        Use the + button to add new lookup keys. 
        Use the trash button to remove lookup keys.
        {fields.length > 0 && (
          ` Currently ${fields.length} lookup key${fields.length === 1 ? '' : 's'} configured.`
        )}
      </div>
    </div>
  );
}

export default LookupKeysForm;