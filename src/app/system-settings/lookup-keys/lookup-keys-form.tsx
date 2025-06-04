/**
 * Lookup Keys Form Component
 * 
 * React form component for managing individual global lookup key entries 
 * within the system settings interface. Implements React Hook Form with 
 * Zod schema validation for real-time form validation.
 * 
 * Features:
 * - React Hook Form with Zod schema validators per React/Next.js Integration Requirements
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Unique name constraints with custom validation
 * - Private flag management with optimistic updates
 * - WCAG 2.1 AA compliance per Section 7.6.4 accessibility requirements
 * - Headless UI with Tailwind CSS styling per Section 7.1 Core UI Technologies
 */

'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormControl, 
  FormErrorMessage, 
  FormActions,
  FormSection
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  lookupKeysFormSchema, 
  defaultLookupKeysFormValues,
  defaultLookupKeyValues,
  type LookupKeysFormData,
  type LookupKeyFormData,
  createUniqueNameValidator
} from '@/lib/validations/lookup-keys';
import { LookupKeyType } from '@/types/lookup-keys';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface LookupKeysFormProps {
  /** Initial data for the form */
  initialData?: LookupKeyType[];
  /** Whether the form is in read-only mode */
  readOnly?: boolean;
  /** Whether to show the private column */
  showPrivateColumn?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Save handler */
  onSave?: (data: LookupKeysFormData) => Promise<void>;
  /** Cancel handler */
  onCancel?: () => void;
  /** Error message to display */
  error?: string;
  /** Success message to display */
  success?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to auto-focus the first input */
  autoFocus?: boolean;
}

// ============================================================================
// LOOKUP KEYS FORM COMPONENT
// ============================================================================

export function LookupKeysForm({
  initialData = [],
  readOnly = false,
  showPrivateColumn = true,
  isLoading = false,
  onSave,
  onCancel,
  error,
  success,
  className,
  autoFocus = false,
}: LookupKeysFormProps) {
  // ============================================================================
  // FORM SETUP
  // ============================================================================

  const form = useForm<LookupKeysFormData>({
    resolver: zodResolver(lookupKeysFormSchema),
    defaultValues: useMemo(() => ({
      lookupKeys: initialData.length > 0 
        ? initialData.map(item => ({
            id: item.id,
            name: item.name,
            value: item.value,
            private: item.private || false,
          }))
        : [{ ...defaultLookupKeyValues }]
    }), [initialData]),
    mode: 'onChange', // Enable real-time validation
  });

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isValid, isDirty, isSubmitting },
    watch,
    trigger,
    reset
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lookupKeys',
  });

  // Watch all form values for real-time validation
  const watchedValues = watch('lookupKeys');

  // ============================================================================
  // VALIDATION AND ERROR HANDLING
  // ============================================================================

  // Custom unique name validation
  const uniqueNameValidator = useMemo(() => createUniqueNameValidator(), []);

  // Check for duplicate names in real-time
  const duplicateNames = useMemo(() => {
    const nameCount = new Map<string, number>();
    const duplicates = new Set<string>();
    
    watchedValues?.forEach(item => {
      const name = item.name?.trim().toLowerCase();
      if (name) {
        const count = nameCount.get(name) || 0;
        nameCount.set(name, count + 1);
        if (count > 0) {
          duplicates.add(item.name);
        }
      }
    });
    
    return Array.from(duplicates);
  }, [watchedValues]);

  // Check if a specific field has a duplicate name
  const isDuplicateName = useCallback((index: number) => {
    const currentName = watchedValues?.[index]?.name?.trim().toLowerCase();
    if (!currentName) return false;
    
    return watchedValues?.some((item, idx) => 
      idx !== index && item.name?.trim().toLowerCase() === currentName
    ) || false;
  }, [watchedValues]);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleAddLookupKey = useCallback(() => {
    append({ ...defaultLookupKeyValues });
  }, [append]);

  const handleRemoveLookupKey = useCallback((index: number) => {
    remove(index);
    // Re-trigger validation after removal
    setTimeout(() => trigger(), 0);
  }, [remove, trigger]);

  const handleFormSubmit = useCallback(async (data: LookupKeysFormData) => {
    if (!onSave) return;
    
    try {
      await onSave(data);
    } catch (error) {
      console.error('Failed to save lookup keys:', error);
    }
  }, [onSave]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  }, [onCancel, reset]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Reset form when initial data changes
  useEffect(() => {
    const formData = initialData.length > 0 
      ? {
          lookupKeys: initialData.map(item => ({
            id: item.id,
            name: item.name,
            value: item.value,
            private: item.private || false,
          }))
        }
      : { lookupKeys: [{ ...defaultLookupKeyValues }] };
    
    reset(formData);
  }, [initialData, reset]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderLookupKeyRow = (field: LookupKeyFormData & { id: string }, index: number) => {
    const hasError = Boolean(errors.lookupKeys?.[index]);
    const isNameDuplicate = isDuplicateName(index);
    const isExistingEntry = Boolean(field.id && typeof field.id === 'number');
    
    return (
      <div
        key={field.id}
        className={cn(
          'grid grid-cols-1 gap-4 p-4 border border-gray-200 rounded-lg bg-white dark:border-gray-700 dark:bg-gray-800',
          showPrivateColumn ? 'md:grid-cols-4' : 'md:grid-cols-3',
          hasError && 'border-red-300 dark:border-red-600',
          isNameDuplicate && 'ring-2 ring-red-200 dark:ring-red-800'
        )}
        role="group"
        aria-label={`Lookup key ${index + 1}`}
      >
        {/* Name Field */}
        <FormField>
          <FormLabel 
            htmlFor={`lookupKeys.${index}.name`}
            required
            className={cn(isNameDuplicate && 'text-red-600 dark:text-red-400')}
          >
            Name
          </FormLabel>
          <FormControl>
            <Controller
              name={`lookupKeys.${index}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id={`lookupKeys.${index}.name`}
                  placeholder="Enter unique name"
                  disabled={readOnly || (isExistingEntry && isLoading)}
                  error={Boolean(fieldState.error) || isNameDuplicate}
                  autoFocus={autoFocus && index === 0}
                  aria-describedby={
                    fieldState.error || isNameDuplicate 
                      ? `lookupKeys.${index}.name-error` 
                      : undefined
                  }
                  aria-invalid={Boolean(fieldState.error) || isNameDuplicate}
                />
              )}
            />
          </FormControl>
          <FormErrorMessage 
            id={`lookupKeys.${index}.name-error`}
            error={
              errors.lookupKeys?.[index]?.name?.message || 
              (isNameDuplicate ? 'Name must be unique' : undefined)
            }
          />
        </FormField>

        {/* Value Field */}
        <FormField>
          <FormLabel htmlFor={`lookupKeys.${index}.value`}>
            Value
          </FormLabel>
          <FormControl>
            <Controller
              name={`lookupKeys.${index}.value`}
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id={`lookupKeys.${index}.value`}
                  placeholder="Enter value"
                  disabled={readOnly || isLoading}
                  error={Boolean(fieldState.error)}
                  aria-describedby={
                    fieldState.error ? `lookupKeys.${index}.value-error` : undefined
                  }
                  aria-invalid={Boolean(fieldState.error)}
                />
              )}
            />
          </FormControl>
          <FormErrorMessage 
            id={`lookupKeys.${index}.value-error`}
            error={errors.lookupKeys?.[index]?.value?.message}
          />
        </FormField>

        {/* Private Field */}
        {showPrivateColumn && (
          <FormField>
            <FormLabel htmlFor={`lookupKeys.${index}.private`}>
              Private
            </FormLabel>
            <FormControl>
              <Controller
                name={`lookupKeys.${index}.private`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={`lookupKeys.${index}.private`}
                    checked={field.value}
                    onChange={field.onChange}
                    disabled={readOnly || isLoading}
                    label="Mark as private"
                    description="Private lookup keys are not visible to end users"
                    aria-describedby={`lookupKeys.${index}.private-desc`}
                  />
                )}
              />
            </FormControl>
          </FormField>
        )}

        {/* Actions */}
        <div className="flex items-end justify-end">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => handleRemoveLookupKey(index)}
            disabled={readOnly || isLoading || fields.length === 1}
            aria-label={`Remove lookup key ${index + 1}`}
          >
            <TrashIcon className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <FormSection
      title="Global Lookup Keys"
      description="Manage global lookup key entries. Names must be unique and start with a letter."
      className={cn('space-y-6', className)}
    >
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* Status Messages */}
        {error && (
          <div 
            className="p-4 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
        
        {success && (
          <div 
            className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:text-green-200 dark:border-green-800"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        {/* Duplicate Names Warning */}
        {duplicateNames.length > 0 && (
          <div 
            className="p-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800"
            role="alert"
            aria-live="polite"
          >
            <strong>Duplicate names detected:</strong> {duplicateNames.join(', ')}. 
            Please ensure all lookup key names are unique.
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {fields.map((field, index) => renderLookupKeyRow(field, index))}
        </div>

        {/* Add Button */}
        {!readOnly && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddLookupKey}
              disabled={isLoading}
              className="w-full max-w-xs"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Lookup Key
            </Button>
          </div>
        )}

        {/* Form Actions */}
        {!readOnly && (onSave || onCancel) && (
          <FormActions justify="end">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            {onSave && (
              <Button
                type="submit"
                disabled={!isValid || !isDirty || isSubmitting || isLoading || duplicateNames.length > 0}
                loading={isSubmitting || isLoading}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            )}
          </FormActions>
        )}

        {/* Form Validation Summary for Screen Readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {errors.lookupKeys && 
            `Form has ${Object.keys(errors.lookupKeys).length} validation errors. Please review and correct the highlighted fields.`
          }
          {duplicateNames.length > 0 && 
            `${duplicateNames.length} duplicate name(s) detected. All lookup key names must be unique.`
          }
        </div>
      </Form>
    </FormSection>
  );
}

// ============================================================================
// DISPLAY NAME
// ============================================================================

LookupKeysForm.displayName = 'LookupKeysForm';

// ============================================================================
// EXPORTS
// ============================================================================

export default LookupKeysForm;
export type { LookupKeysFormProps };