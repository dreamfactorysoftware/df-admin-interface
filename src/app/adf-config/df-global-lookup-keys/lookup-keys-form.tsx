'use client';

import React, { useCallback, useEffect, useMemo, useRef, startTransition } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

// Types based on the Angular implementation
interface LookupKey {
  id?: number;
  name: string;
  value: string;
  private: boolean;
  description?: string;
  created_date?: string;
  last_modified_date?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

interface LookupKeysFormProps {
  initialData?: LookupKey[];
  onSave?: (createKeys: LookupKey[], updateKeys: LookupKey[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// Zod schema for individual lookup key with custom unique name validation
const lookupKeySchema = z.object({
  id: z.number().optional(),
  name: z.string()
    .min(1, 'Name is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Name must start with a letter and contain only letters, numbers, and underscores')
    .max(64, 'Name must be 64 characters or less'),
  value: z.string().max(1024, 'Value must be 1024 characters or less'),
  private: z.boolean().default(false),
  description: z.string().optional(),
  created_date: z.string().optional(),
  last_modified_date: z.string().optional(),
  created_by_id: z.number().optional(),
  last_modified_by_id: z.number().optional(),
});

// Form schema with custom unique name validation
const formSchema = z.object({
  lookupKeys: z.array(lookupKeySchema)
    .refine((keys) => {
      const names = keys.map(key => key.name.toLowerCase());
      const uniqueNames = new Set(names);
      return names.length === uniqueNames.size;
    }, {
      message: 'Lookup key names must be unique',
      path: ['lookupKeys']
    })
});

type FormValues = z.infer<typeof formSchema>;

// Input component with accessibility features
const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    required?: boolean;
  }
>(({ className, label, error, required, id, ...props }, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  
  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className={cn(
          "block text-sm font-medium text-gray-700 dark:text-gray-300",
          required && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full px-3 py-2 border rounded-md shadow-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
          error 
            ? "border-red-300 bg-red-50 text-red-900 placeholder-red-300 focus:ring-red-500" 
            : "border-gray-300 bg-white text-gray-900 placeholder-gray-400",
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500",
          error && "dark:border-red-500 dark:bg-red-900/20 dark:text-red-100",
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <div 
          id={errorId}
          className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
});
Input.displayName = 'Input';

// Checkbox component with accessibility features
const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    description?: string;
  }
>(({ className, label, description, id, ...props }, ref) => {
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  
  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center h-5">
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors",
            "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-primary-600",
            className
          )}
          aria-describedby={descriptionId}
          {...props}
        />
      </div>
      <div className="min-w-0 flex-1">
        <label 
          htmlFor={inputId}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
});
Checkbox.displayName = 'Checkbox';

// Button component
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
  }
>(({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  );
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-6 text-lg"
  };
  
  return (
    <button
      ref={ref}
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
});
Button.displayName = 'Button';

export default function LookupKeysForm({ 
  initialData = [], 
  onSave, 
  isLoading = false,
  className 
}: LookupKeysFormProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);
  
  // Form setup with Zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lookupKeys: initialData.length > 0 ? initialData : [{
        name: '',
        value: '',
        private: false
      }]
    },
    mode: 'onChange', // Real-time validation
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lookupKeys',
  });

  // Watch form for changes to provide real-time validation feedback
  const watchedFields = form.watch('lookupKeys');
  const formState = form.formState;

  // Memoized unique name validation for individual fields
  const nameErrors = useMemo(() => {
    const names = watchedFields.map(field => field.name?.toLowerCase() || '');
    const duplicates = new Set<number>();
    
    names.forEach((name, index) => {
      if (name && names.indexOf(name) !== index) {
        duplicates.add(index);
        duplicates.add(names.indexOf(name));
      }
    });
    
    return Array.from(duplicates);
  }, [watchedFields]);

  // Add new lookup key entry
  const addLookupKey = useCallback(() => {
    startTransition(() => {
      append({
        name: '',
        value: '',
        private: false
      });
      
      // Focus the new name input after a brief delay
      setTimeout(() => {
        lastInputRef.current?.focus();
      }, 100);
    });
  }, [append]);

  // Remove lookup key entry
  const removeLookupKey = useCallback((index: number) => {
    startTransition(() => {
      remove(index);
    });
  }, [remove]);

  // Handle form submission with optimistic updates
  const handleSubmit = useCallback(async (data: FormValues) => {
    if (!onSave) return;

    const createKeys: LookupKey[] = [];
    const updateKeys: LookupKey[] = [];

    // Determine which keys are new (no id) vs updated (has id and is dirty)
    data.lookupKeys.forEach((key, index) => {
      const originalKey = initialData[index];
      const isDirty = formState.dirtyFields.lookupKeys?.[index];
      
      if (key.id) {
        // Existing key - only include if dirty
        if (isDirty) {
          updateKeys.push(key);
        }
      } else {
        // New key - include if has content
        if (key.name.trim()) {
          createKeys.push({ ...key, id: undefined });
        }
      }
    });

    try {
      await onSave(createKeys, updateKeys);
      
      // Reset form dirty state after successful save
      form.reset(data);
    } catch (error) {
      console.error('Failed to save lookup keys:', error);
      // Form stays in dirty state so user can retry
    }
  }, [onSave, initialData, formState.dirtyFields, form]);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData.length > 0) {
      form.reset({
        lookupKeys: initialData
      });
    }
  }, [initialData, form]);

  // Keyboard navigation support
  const handleKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case 'Enter':
        if (event.shiftKey) {
          event.preventDefault();
          addLookupKey();
        }
        break;
      case 'Delete':
        if (event.ctrlKey && fields.length > 1) {
          event.preventDefault();
          removeLookupKey(index);
        }
        break;
    }
  }, [addLookupKey, removeLookupKey, fields.length]);

  const hasValidationErrors = Object.keys(formState.errors).length > 0;
  const hasUnsavedChanges = formState.isDirty && !formState.isSubmitting;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Description */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>
          Manage global lookup keys that can be referenced throughout your API endpoints. 
          Keys marked as private will not be visible in API documentation.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Table container with accessibility */}
        <div 
          ref={tableRef}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          role="table"
          aria-label="Global lookup keys management table"
          aria-describedby="lookup-keys-description"
        >
          {/* Screen reader description */}
          <div id="lookup-keys-description" className="sr-only">
            Use this table to manage global lookup keys. Each row contains fields for name, value, and privacy setting. 
            Use Shift+Enter to add a new row, Ctrl+Delete to remove the current row.
          </div>

          {/* Table header */}
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-12 gap-4 p-4">
              <div className="col-span-3">
                <div className="flex items-center space-x-1">
                  <Key className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </span>
                  <span className="text-red-500" aria-label="required">*</span>
                </div>
              </div>
              <div className="col-span-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Value
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Private
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={addLookupKey}
                  aria-label="Add new lookup key entry"
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Table body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {fields.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Key className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No lookup keys defined</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addLookupKey}
                  className="mt-2"
                >
                  Add First Key
                </Button>
              </div>
            ) : (
              fields.map((field, index) => {
                const nameError = form.formState.errors.lookupKeys?.[index]?.name?.message;
                const valueError = form.formState.errors.lookupKeys?.[index]?.value?.message;
                const hasNameDuplicate = nameErrors.includes(index);
                const isExistingKey = !!field.id;
                const isDirty = formState.dirtyFields.lookupKeys?.[index];
                
                return (
                  <div 
                    key={field.id} 
                    className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    role="row"
                    aria-rowindex={index + 2} // +2 because header is row 1
                  >
                    {/* Name field */}
                    <div className="col-span-3" role="gridcell">
                      <Controller
                        name={`lookupKeys.${index}.name`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <Input
                            {...controllerField}
                            ref={index === fields.length - 1 ? lastInputRef : undefined}
                            label="Name"
                            required
                            disabled={isExistingKey && !isDirty}
                            error={hasNameDuplicate ? 'Name must be unique' : nameError}
                            placeholder="lookup_key_name"
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            aria-describedby={`name-help-${index}`}
                          />
                        )}
                      />
                      <div id={`name-help-${index}`} className="sr-only">
                        {isExistingKey ? 'Existing lookup key name cannot be changed' : 'Enter a unique name for this lookup key'}
                      </div>
                    </div>

                    {/* Value field */}
                    <div className="col-span-4" role="gridcell">
                      <Controller
                        name={`lookupKeys.${index}.value`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <Input
                            {...controllerField}
                            label="Value"
                            error={valueError}
                            placeholder="lookup_key_value"
                            onKeyDown={(e) => handleKeyDown(e, index)}
                          />
                        )}
                      />
                    </div>

                    {/* Private field */}
                    <div className="col-span-2 flex items-end pb-1" role="gridcell">
                      <Controller
                        name={`lookupKeys.${index}.private`}
                        control={form.control}
                        render={({ field: controllerField }) => (
                          <Checkbox
                            {...controllerField}
                            checked={controllerField.value}
                            label="Private"
                            description="Hide from API documentation"
                          />
                        )}
                      />
                    </div>

                    {/* Status field */}
                    <div className="col-span-2 flex items-center" role="gridcell">
                      <div className="flex items-center space-x-1">
                        {isExistingKey ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">
                              {isDirty ? 'Modified' : 'Saved'}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-4 w-4 rounded-full bg-blue-200 dark:bg-blue-800" />
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              New
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-end justify-end pb-1" role="gridcell">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeLookupKey(index)}
                          aria-label={`Remove lookup key ${watchedFields[index]?.name || 'entry'}`}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Validation status */}
            {hasValidationErrors && (
              <div className="flex items-center space-x-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>Please fix validation errors</span>
              </div>
            )}
            
            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && !hasValidationErrors && (
              <div className="flex items-center space-x-1 text-sm text-amber-600 dark:text-amber-400">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>

          {/* Save button */}
          <Button
            type="submit"
            disabled={!hasUnsavedChanges || hasValidationErrors}
            isLoading={formState.isSubmitting || isLoading}
            aria-describedby="save-button-help"
          >
            Save Changes
          </Button>
          <div id="save-button-help" className="sr-only">
            Save all changes to lookup keys. Only modified entries will be updated.
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><span className="font-mono">Shift+Enter</span> - Add new entry</p>
          <p><span className="font-mono">Ctrl+Delete</span> - Remove current entry</p>
        </div>
      </form>

      {/* Live region for screen reader announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        role="status"
      >
        {formState.isSubmitting && "Saving lookup keys..."}
        {formState.isSubmitSuccessful && "Lookup keys saved successfully"}
        {hasValidationErrors && `Form has ${Object.keys(formState.errors).length} validation errors`}
      </div>
    </div>
  );
}