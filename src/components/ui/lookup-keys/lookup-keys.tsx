"use client";

/**
 * Lookup Keys Component
 * 
 * React component for managing lookup key-value pairs with dynamic add/remove functionality.
 * Replaces Angular df-lookup-keys component using React Hook Form's useFieldArray for array management.
 * Features table display with inline editing, privacy toggle controls, and accordion layout options.
 * Implements WCAG 2.1 AA accessibility with proper ARIA labels, keyboard navigation, and screen reader support.
 * 
 * @fileoverview Lookup keys management component
 * @version 1.0.0
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext, FieldPath, Path, FieldValues } from 'react-hook-form';
import { Disclosure, Switch } from '@headlessui/react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { z } from 'zod';

/**
 * Lookup key entry interface - matches the Angular LookupKeyType
 */
export interface LookupKeyEntry {
  /** Unique identifier for existing entries */
  id?: number | null;
  /** Lookup key name (must be unique) */
  name: string;
  /** Lookup key value */
  value: string;
  /** Privacy flag indicating if key should be hidden */
  private: boolean;
  /** Optional description for the key */
  description?: string;
  /** Creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** Creator user ID */
  created_by_id?: number;
  /** Last modifier user ID */
  last_modified_by_id?: number;
}

/**
 * Zod schema for lookup key validation with unique name checking
 */
export const lookupKeySchema = z.object({
  id: z.number().nullable().optional(),
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Name must start with a letter or underscore and contain only letters, numbers, and underscores'),
  value: z.string().max(65535, 'Value must be 65535 characters or less'),
  private: z.boolean().default(false),
  description: z.string().optional(),
  created_date: z.string().optional(),
  last_modified_date: z.string().optional(),
  created_by_id: z.number().optional(),
  last_modified_by_id: z.number().optional(),
});

/**
 * Zod schema for lookup keys array with unique name validation
 */
export const lookupKeysArraySchema = z.array(lookupKeySchema).superRefine((lookupKeys, ctx) => {
  const nameMap = new Map<string, number>();
  
  lookupKeys.forEach((entry, index) => {
    if (!entry.name) return;
    
    if (nameMap.has(entry.name)) {
      const firstIndex = nameMap.get(entry.name)!;
      // Mark both occurrences as invalid
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Key names must be unique',
        path: [firstIndex, 'name'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Key names must be unique',
        path: [index, 'name'],
      });
    } else {
      nameMap.set(entry.name, index);
    }
  });
});

/**
 * Component props interface
 */
export interface LookupKeysProps<T extends FieldValues = FieldValues> {
  /** Field array name for React Hook Form */
  name: FieldPath<T>;
  /** Whether to show accordion wrapper (default: true) */
  showAccordion?: boolean;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional aria-label for accessibility */
  'aria-label'?: string;
  /** Optional aria-describedby for accessibility */
  'aria-describedby'?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Maximum number of entries allowed */
  maxEntries?: number;
  /** Callback when entries change */
  onEntriesChange?: (entries: LookupKeyEntry[]) => void;
}

/**
 * Table cell component for form inputs
 */
const TableCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <td className={cn("p-3", className)}>
    {children}
  </td>
);

/**
 * Table header cell component
 */
const TableHeaderCell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <th className={cn(
    "p-3 text-left font-medium text-gray-900 dark:text-gray-100",
    className
  )}>
    {children}
  </th>
);

/**
 * Form input component with error styling
 */
const FormInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
  className?: string;
}> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  disabled,
  className,
  ...ariaProps
}) => (
  <div className="w-full">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2 border rounded-md text-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
        "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
        "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100",
        "dark:focus:ring-primary-400 dark:focus:border-primary-400",
        "dark:disabled:bg-gray-700 dark:disabled:text-gray-400",
        error 
          ? "border-red-500 dark:border-red-400" 
          : "border-gray-300 dark:border-gray-600",
        className
      )}
      {...ariaProps}
    />
    {error && (
      <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
        {error}
      </p>
    )}
  </div>
);

/**
 * Action button component
 */
const ActionButton: React.FC<{
  onClick: () => void;
  variant: 'add' | 'remove';
  disabled?: boolean;
  'aria-label': string;
  className?: string;
}> = ({ onClick, variant, disabled, className, ...ariaProps }) => {
  const Icon = variant === 'add' ? Plus : Trash2;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-transparent",
        "text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === 'add' && [
          "bg-primary-600 text-white hover:bg-primary-700",
          "focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600",
          "h-8 w-8"
        ],
        variant === 'remove' && [
          "text-red-600 hover:text-red-700 hover:bg-red-50",
          "focus:ring-red-500 dark:text-red-400 dark:hover:text-red-300",
          "dark:hover:bg-red-900/20 h-8 w-8"
        ],
        className
      )}
      {...ariaProps}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

/**
 * Toggle switch component for privacy flag
 */
const PrivacyToggle: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
}> = ({ checked, onChange, disabled, ...ariaProps }) => (
  <Switch
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      checked
        ? "bg-primary-600 dark:bg-primary-500"
        : "bg-gray-200 dark:bg-gray-600"
    )}
    {...ariaProps}
  >
    <span className="sr-only">Toggle privacy setting</span>
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        checked ? "translate-x-6" : "translate-x-1"
      )}
    />
  </Switch>
);

/**
 * Lookup keys table component
 */
const LookupKeysTable: React.FC<{
  fields: Array<LookupKeyEntry & { id: string }>;
  append: (entry: Partial<LookupKeyEntry>) => void;
  remove: (index: number) => void;
  update: (index: number, entry: Partial<LookupKeyEntry>) => void;
  errors?: Record<string, any>;
  disabled?: boolean;
  maxEntries?: number;
}> = ({ fields, append, remove, update, errors, disabled, maxEntries }) => {
  const { theme } = useTheme();
  
  const addEntry = useCallback(() => {
    append({
      name: '',
      value: '',
      private: false,
    });
  }, [append]);

  const removeEntry = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  const updateField = useCallback((index: number, field: keyof LookupKeyEntry, value: any) => {
    const currentEntry = fields[index];
    update(index, { ...currentEntry, [field]: value });
  }, [fields, update]);

  const canAddMore = !maxEntries || fields.length < maxEntries;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell className="w-20">Private</TableHeaderCell>
              <TableHeaderCell className="w-16">
                <ActionButton
                  onClick={addEntry}
                  variant="add"
                  disabled={disabled || !canAddMore}
                  aria-label={`Add new lookup key entry${maxEntries ? ` (${fields.length}/${maxEntries})` : ''}`}
                />
              </TableHeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {fields.length === 0 ? (
              <tr>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No lookup keys configured. Click the + button to add your first key.
                </TableCell>
              </tr>
            ) : (
              fields.map((field, index) => {
                const fieldErrors = errors?.[index];
                const isExistingEntry = field.id;
                
                return (
                  <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <FormInput
                        value={field.name}
                        onChange={(value) => updateField(index, 'name', value)}
                        placeholder="Enter key name"
                        error={fieldErrors?.name?.message}
                        disabled={disabled || isExistingEntry}
                        aria-label={`Lookup key name for entry ${index + 1}`}
                        aria-describedby={fieldErrors?.name ? `name-error-${index}` : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <FormInput
                        value={field.value}
                        onChange={(value) => updateField(index, 'value', value)}
                        placeholder="Enter key value"
                        error={fieldErrors?.value?.message}
                        disabled={disabled}
                        aria-label={`Lookup key value for entry ${index + 1}`}
                        aria-describedby={fieldErrors?.value ? `value-error-${index}` : undefined}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <PrivacyToggle
                        checked={field.private}
                        onChange={(checked) => updateField(index, 'private', checked)}
                        disabled={disabled}
                        aria-label={`Toggle privacy for ${field.name || 'entry ' + (index + 1)}`}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <ActionButton
                        onClick={() => removeEntry(index)}
                        variant="remove"
                        disabled={disabled}
                        aria-label={`Remove lookup key entry ${field.name || (index + 1)}`}
                      />
                    </TableCell>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Main lookup keys component
 */
export function LookupKeys<T extends FieldValues = FieldValues>({
  name,
  showAccordion = true,
  className,
  disabled = false,
  maxEntries,
  onEntriesChange,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: LookupKeysProps<T>) {
  const { control, formState: { errors } } = useFormContext<T>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: name as Path<T>,
  });

  const { theme } = useTheme();
  
  // Convert fields to lookup key entries for external callbacks
  const entriesAsLookupKeys: LookupKeyEntry[] = useMemo(() => 
    fields.map(field => field as LookupKeyEntry)
  , [fields]);

  // Notify parent of changes
  useEffect(() => {
    onEntriesChange?.(entriesAsLookupKeys);
  }, [entriesAsLookupKeys, onEntriesChange]);

  // Get field-level errors
  const fieldErrors = errors[name as keyof typeof errors] as Record<string, any> | undefined;

  const tableComponent = (
    <LookupKeysTable
      fields={fields as Array<LookupKeyEntry & { id: string }>}
      append={append}
      remove={remove}
      update={update}
      errors={fieldErrors}
      disabled={disabled}
      maxEntries={maxEntries}
    />
  );

  const containerClassName = cn(
    "lookup-keys-container",
    theme === 'dark' && "dark",
    className
  );

  if (!showAccordion) {
    return (
      <div 
        className={containerClassName}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        {tableComponent}
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <Disclosure.Button
              className={cn(
                "flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium",
                "text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring",
                "focus-visible:ring-primary-500 focus-visible:ring-opacity-75",
                "dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
                "transition-colors duration-200"
              )}
              aria-label={ariaLabel || "Toggle lookup keys section"}
              aria-describedby={ariaDescribedBy}
            >
              <span>Lookup Keys</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-500 transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="pt-4 pb-2 text-sm text-gray-500">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Configure key-value pairs for application settings and configuration. 
                Private keys are hidden from non-administrative users.
              </p>
              {tableComponent}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}

export default LookupKeys;