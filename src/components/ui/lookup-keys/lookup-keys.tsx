/**
 * Lookup Keys Component
 * 
 * Main React component for managing lookup key-value pairs with dynamic add/remove 
 * functionality. Replaces Angular df-lookup-keys component using React Hook Form's 
 * useFieldArray for array management. Features table display with inline editing, 
 * privacy toggle controls, and accordion layout options.
 * 
 * Key Features:
 * - React Hook Form useFieldArray integration with real-time validation under 100ms
 * - WCAG 2.1 AA accessibility compliance with minimum 4.5:1 contrast ratio
 * - Proper ARIA labels, keyboard navigation, and screen reader support
 * - Tailwind CSS 4.1+ implementation with design tokens from Section 7.1.1
 * - Headless UI integration for accessible form controls and unstyled components
 * - TypeScript 5.8+ type safety with proper form value and error type inference
 * - Dark theme support via Zustand store integration
 * - Lucide React icons replacing FontAwesome (faPlus, faTrashCan)
 * - Next.js internationalization patterns replacing Transloco translation pipe
 * 
 * Replaces Angular Material components:
 * - mat-table → Custom table implementation using Tailwind CSS
 * - mat-accordion → Headless UI Disclosure for collapsible sections
 * - mat-slide-toggle → Headless UI Switch component for privacy flags
 * - Angular FormArray → React Hook Form useFieldArray
 * - Angular reactive forms → React Hook Form patterns with Zod validation
 * 
 * @fileoverview Lookup keys management component for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

'use client';

import React, { useCallback, useMemo, useId, useState } from 'react';
import { 
  useFieldArray, 
  useFormContext, 
  type Control, 
  type FieldValues, 
  type Path,
  type FieldArrayWithId 
} from 'react-hook-form';
import { Disclosure } from '@headlessui/react';
import { Plus, Trash2, ChevronDown, Lock, Unlock, Save, RotateCcw } from 'lucide-react';
import { z } from 'zod';

// Internal component imports
import { FormField } from '../form/form-field';
import { Input } from '../input/input';
import { Toggle } from '../toggle/toggle';
import { IconButton } from '../button/icon-button';

// Utility and hook imports
import { cn } from '../../../lib/utils';
import { useTheme } from '../../../hooks/use-theme';

// Type imports
import type { 
  FieldArrayComponentProps,
  ComponentAccessibilityProps,
  BaseComponentProps 
} from '../../../types/components';

// ============================================================================
// TYPE DEFINITIONS AND VALIDATION SCHEMAS
// ============================================================================

/**
 * Lookup key-value pair data structure
 * Represents individual key-value entries with optional privacy flag
 */
export interface LookupKeyItem {
  /** The lookup key identifier */
  key: string;
  /** The corresponding value for the key */
  value: string;
  /** Whether this key-value pair should be treated as private/sensitive */
  private?: boolean;
  /** Unique identifier for React list rendering */
  id?: string;
}

/**
 * Zod validation schema for lookup key items
 * Provides real-time validation under 100ms per Section 0 requirements
 */
export const lookupKeyItemSchema = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(100, 'Key must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Key can only contain letters, numbers, underscores, periods, and hyphens'),
  value: z.string()
    .min(1, 'Value is required')
    .max(1000, 'Value must be less than 1000 characters'),
  private: z.boolean().optional().default(false),
  id: z.string().optional(),
});

/**
 * Complete lookup keys array validation schema
 */
export const lookupKeysSchema = z.array(lookupKeyItemSchema)
  .min(0, 'At least one lookup key is required')
  .max(100, 'Maximum of 100 lookup keys allowed')
  .refine(
    (keys) => {
      const uniqueKeys = new Set(keys.map(item => item.key.toLowerCase()));
      return uniqueKeys.size === keys.length;
    },
    {
      message: 'Lookup keys must be unique (case-insensitive)',
    }
  );

/**
 * Layout display options for the lookup keys component
 */
export type LookupKeysLayout = 'table' | 'accordion' | 'inline';

/**
 * Size variants for the component
 */
export type LookupKeysSize = 'sm' | 'md' | 'lg';

/**
 * Props for the LookupKeys component
 * Extends FieldArrayComponentProps for React Hook Form integration
 */
export interface LookupKeysProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
> extends Omit<FieldArrayComponentProps<TFieldValues, TFieldName>, 'fieldArray'>,
    ComponentAccessibilityProps,
    BaseComponentProps {
  
  /** Field name for form registration */
  name: TFieldName;
  
  /** React Hook Form control instance */
  control?: Control<TFieldValues>;
  
  /** Component layout variant */
  layout?: LookupKeysLayout;
  
  /** Component size variant */
  size?: LookupKeysSize;
  
  /** Component title/label */
  title?: string;
  
  /** Component description text */
  description?: string;
  
  /** Whether the component is in read-only mode */
  readOnly?: boolean;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Whether the component is loading */
  loading?: boolean;
  
  /** Maximum number of items allowed */
  maxItems?: number;
  
  /** Minimum number of items required */
  minItems?: number;
  
  /** Whether to show the privacy toggle column */
  showPrivacyToggle?: boolean;
  
  /** Whether to show item indices */
  showIndices?: boolean;
  
  /** Whether to allow reordering items */
  allowReordering?: boolean;
  
  /** Custom add button text */
  addButtonText?: string;
  
  /** Custom remove button text */
  removeButtonText?: string;
  
  /** Empty state message */
  emptyStateMessage?: string;
  
  /** Validation error message override */
  errorMessage?: string;
  
  /** Change handler for array updates */
  onChange?: (items: LookupKeyItem[]) => void;
  
  /** Add item handler */
  onAddItem?: () => void;
  
  /** Remove item handler */
  onRemoveItem?: (index: number) => void;
  
  /** Item validation handler */
  onValidateItem?: (item: LookupKeyItem, index: number) => string | undefined;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Test identifier */
  'data-testid'?: string;
}

// ============================================================================
// COMPONENT STYLING AND LAYOUT CONFIGURATIONS
// ============================================================================

/**
 * Layout-specific CSS classes for different display modes
 */
const LAYOUT_CLASSES = {
  table: {
    container: 'w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
    header: 'bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700',
    content: 'divide-y divide-gray-200 dark:divide-gray-700',
    row: 'flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
    cell: 'flex-1 min-w-0',
    actions: 'flex items-center gap-2 flex-shrink-0',
  },
  accordion: {
    container: 'w-full space-y-2',
    header: 'w-full',
    content: 'space-y-4',
    row: 'border border-gray-200 dark:border-gray-700 rounded-lg',
    cell: 'w-full',
    actions: 'flex items-center gap-2 mt-4',
  },
  inline: {
    container: 'w-full space-y-3',
    header: 'mb-4',
    content: 'space-y-3',
    row: 'flex flex-wrap items-end gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg',
    cell: 'flex-1 min-w-[200px]',
    actions: 'flex items-center gap-2',
  },
} as const;

/**
 * Size-specific styling configurations
 */
const SIZE_CLASSES = {
  sm: {
    header: 'text-sm font-medium',
    input: 'text-sm',
    button: 'h-8 w-8',
    spacing: 'gap-2',
  },
  md: {
    header: 'text-base font-medium',
    input: 'text-sm',
    button: 'h-10 w-10',
    spacing: 'gap-3',
  },
  lg: {
    header: 'text-lg font-medium',
    input: 'text-base',
    button: 'h-12 w-12',
    spacing: 'gap-4',
  },
} as const;

/**
 * Generate unique item ID for array items
 */
const generateItemId = (): string => {
  return `lookup-key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create default lookup key item
 */
const createDefaultItem = (): LookupKeyItem => ({
  key: '',
  value: '',
  private: false,
  id: generateItemId(),
});

// ============================================================================
// MAIN COMPONENT IMPLEMENTATION
// ============================================================================

/**
 * LookupKeys Component
 * 
 * Comprehensive lookup key-value management component with full accessibility 
 * compliance, React Hook Form integration, and responsive design. Supports 
 * multiple layout modes and maintains WCAG 2.1 AA standards throughout.
 */
export const LookupKeys = <
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends Path<TFieldValues> = Path<TFieldValues>
>({
  name,
  control,
  layout = 'table',
  size = 'md',
  title = 'Lookup Keys',
  description,
  readOnly = false,
  disabled = false,
  loading = false,
  maxItems = 100,
  minItems = 0,
  showPrivacyToggle = true,
  showIndices = false,
  allowReordering = false,
  addButtonText = 'Add Lookup Key',
  removeButtonText = 'Remove',
  emptyStateMessage = 'No lookup keys configured. Click the add button to create your first key-value pair.',
  errorMessage,
  onChange,
  onAddItem,
  onRemoveItem,
  onValidateItem,
  className,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': testId,
  ...props
}: LookupKeysProps<TFieldValues, TFieldName>) => {
  
  // ========================================================================
  // HOOKS AND STATE MANAGEMENT
  // ========================================================================
  
  // Get form context for React Hook Form integration
  const formContext = useFormContext<TFieldValues>();
  const finalControl = control || formContext?.control;
  
  if (!finalControl) {
    throw new Error('LookupKeys component must be used within a FormProvider or receive a control prop');
  }
  
  // Field array management with useFieldArray
  const fieldArray = useFieldArray({
    control: finalControl,
    name,
  });
  
  const { fields, append, remove, move, update } = fieldArray;
  
  // Theme management for dark mode support
  const { resolvedTheme } = useTheme();
  
  // Component state
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Map<number, string>>(new Map());
  
  // Generate unique IDs for accessibility
  const componentId = useId();
  const titleId = `${componentId}-title`;
  const descriptionId = description ? `${componentId}-description` : undefined;
  const tableId = `${componentId}-table`;
  const emptyStateId = `${componentId}-empty`;
  
  // ========================================================================
  // COMPUTED VALUES AND MEMOIZED CALCULATIONS
  // ========================================================================
  
  // Layout and size classes
  const layoutClasses = LAYOUT_CLASSES[layout];
  const sizeClasses = SIZE_CLASSES[size];
  
  // Container classes with accessibility support
  const containerClasses = cn(
    'lookup-keys-container',
    layoutClasses.container,
    disabled && 'opacity-60 pointer-events-none',
    loading && 'animate-pulse',
    className
  );
  
  // Determine if add button should be disabled
  const canAddItems = useMemo(() => {
    return !readOnly && !disabled && !loading && fields.length < maxItems;
  }, [readOnly, disabled, loading, fields.length, maxItems]);
  
  // Determine if remove buttons should be disabled
  const canRemoveItems = useMemo(() => {
    return !readOnly && !disabled && !loading && fields.length > minItems;
  }, [readOnly, disabled, loading, fields.length, minItems]);
  
  // Generate ARIA describedby string
  const combinedDescribedBy = useMemo(() => {
    const ids = [ariaDescribedBy, descriptionId].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [ariaDescribedBy, descriptionId]);
  
  // ========================================================================
  // EVENT HANDLERS AND CALLBACKS
  // ========================================================================
  
  /**
   * Handle adding a new lookup key item
   */
  const handleAddItem = useCallback(() => {
    if (!canAddItems) return;
    
    const newItem = createDefaultItem();
    append(newItem as any);
    
    // Notify parent component
    onAddItem?.();
    onChange?.(fieldArray.fields as LookupKeyItem[]);
    
    // Focus the new item's key input after a brief delay
    setTimeout(() => {
      const newIndex = fields.length;
      const keyInput = document.getElementById(`${componentId}-key-${newIndex}`);\n      keyInput?.focus();
    }, 100);
  }, [canAddItems, append, onAddItem, onChange, fieldArray.fields, fields.length, componentId]);
  
  /**
   * Handle removing a lookup key item
   */
  const handleRemoveItem = useCallback((index: number) => {
    if (!canRemoveItems) return;
    
    remove(index);
    
    // Clean up validation errors
    setValidationErrors(prev => {
      const next = new Map(prev);
      next.delete(index);
      // Shift down error indices for items after removed index
      for (const [errorIndex, error] of prev) {
        if (errorIndex > index) {
          next.delete(errorIndex);
          next.set(errorIndex - 1, error);
        }
      }
      return next;
    });
    
    // Clean up expanded state
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.delete(index);
      // Shift down expanded indices for items after removed index
      for (const expandedIndex of prev) {
        if (expandedIndex > index) {
          next.delete(expandedIndex);
          next.add(expandedIndex - 1);
        }
      }
      return next;
    });
    
    // Notify parent component
    onRemoveItem?.(index);
    onChange?.(fieldArray.fields as LookupKeyItem[]);
    
    // Announce removal to screen readers
    const announcement = `Lookup key item ${index + 1} removed`;
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = announcement;
    document.body.appendChild(announcer);
    setTimeout(() => document.body.removeChild(announcer), 1000);
  }, [canRemoveItems, remove, onRemoveItem, onChange, fieldArray.fields]);
  
  /**
   * Handle moving items (for reordering functionality)
   */
  const handleMoveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (!allowReordering || readOnly || disabled) return;
    
    move(fromIndex, toIndex);
    onChange?.(fieldArray.fields as LookupKeyItem[]);
  }, [allowReordering, readOnly, disabled, move, onChange, fieldArray.fields]);
  
  /**
   * Handle toggling accordion expansion
   */
  const handleToggleExpansion = useCallback((index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);
  
  /**
   * Handle item validation
   */
  const handleValidateItem = useCallback((item: LookupKeyItem, index: number) => {
    const error = onValidateItem?.(item, index);
    
    setValidationErrors(prev => {
      const next = new Map(prev);
      if (error) {
        next.set(index, error);
      } else {
        next.delete(index);
      }
      return next;
    });
    
    return error;
  }, [onValidateItem]);
  
  // ========================================================================
  // RENDER HELPER FUNCTIONS
  // ========================================================================
  
  /**
   * Render the component header with title and controls
   */
  const renderHeader = useCallback(() => (
    <div className={cn(layoutClasses.header, 'flex items-center justify-between')}>
      <div className="flex-1 min-w-0">
        <h3 
          id={titleId}
          className={cn(
            sizeClasses.header,
            'text-gray-900 dark:text-gray-100 font-semibold'
          )}
        >
          {title}
        </h3>
        {description && (
          <p 
            id={descriptionId}
            className="mt-1 text-sm text-gray-600 dark:text-gray-400"
          >
            {description}
          </p>
        )}
      </div>
      
      {/* Add button */}
      <IconButton
        variant="primary"
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        onClick={handleAddItem}
        disabled={!canAddItems}
        aria-label={addButtonText}
        data-testid={`${testId || 'lookup-keys'}-add-button`}
      >
        <Plus className="h-4 w-4" />
      </IconButton>
    </div>
  ), [
    layoutClasses.header,
    sizeClasses.header,
    titleId,
    title,
    description,
    descriptionId,
    size,
    handleAddItem,
    canAddItems,
    addButtonText,
    testId
  ]);
  
  /**
   * Render individual lookup key item
   */
  const renderItem = useCallback((
    field: FieldArrayWithId<TFieldValues, TFieldName>,
    index: number
  ) => {
    const fieldError = validationErrors.get(index);
    const isExpanded = expandedItems.has(index);
    
    // Common form field props
    const baseFieldProps = {
      control: finalControl,
      size,
      disabled: disabled || readOnly,
    };
    
    // Render table layout item
    if (layout === 'table') {
      return (
        <div 
          key={field.id}
          className={cn(layoutClasses.row, fieldError && 'bg-error-50 dark:bg-error-900/20')}
          data-testid={`${testId || 'lookup-keys'}-item-${index}`}
        >
          {/* Index column (optional) */}
          {showIndices && (
            <div className="w-12 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {index + 1}
            </div>
          )}
          
          {/* Key input */}
          <div className={layoutClasses.cell}>
            <FormField
              {...baseFieldProps}
              name={`${name}.${index}.key` as Path<TFieldValues>}
              config={{
                label: 'Key',
                placeholder: 'Enter key name',
                required: true,
                hideLabel: true,
              }}
            >
              <Input
                id={`${componentId}-key-${index}`}
                placeholder="Enter key name"
                aria-label={`Lookup key ${index + 1} name`}
                data-testid={`${testId || 'lookup-keys'}-key-${index}`}
              />
            </FormField>
          </div>
          
          {/* Value input */}
          <div className={layoutClasses.cell}>
            <FormField
              {...baseFieldProps}
              name={`${name}.${index}.value` as Path<TFieldValues>}
              config={{
                label: 'Value',
                placeholder: 'Enter value',
                required: true,
                hideLabel: true,
              }}
            >
              <Input
                id={`${componentId}-value-${index}`}
                placeholder="Enter value"
                aria-label={`Lookup key ${index + 1} value`}
                data-testid={`${testId || 'lookup-keys'}-value-${index}`}
              />
            </FormField>
          </div>
          
          {/* Privacy toggle (optional) */}
          {showPrivacyToggle && (
            <div className="w-16 flex-shrink-0 flex justify-center">
              <FormField
                {...baseFieldProps}
                name={`${name}.${index}.private` as Path<TFieldValues>}
                config={{
                  label: 'Private',
                  hideLabel: true,
                }}
              >
                <Toggle
                  aria-label={`Mark lookup key ${index + 1} as private`}
                  size={size}
                  data-testid={`${testId || 'lookup-keys'}-private-${index}`}
                />
              </FormField>
            </div>
          )}
          
          {/* Action buttons */}
          <div className={layoutClasses.actions}>
            <IconButton
              variant="destructive"
              size={size === 'sm' ? 'sm' : 'default'}
              onClick={() => handleRemoveItem(index)}
              disabled={!canRemoveItems}
              aria-label={`${removeButtonText} lookup key ${index + 1}`}
              data-testid={`${testId || 'lookup-keys'}-remove-${index}`}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      );
    }
    
    // Render accordion layout item
    if (layout === 'accordion') {
      return (
        <Disclosure key={field.id} defaultOpen={isExpanded}>
          {({ open }) => (
            <div className={layoutClasses.row}>
              <Disclosure.Button
                className={cn(
                  'w-full flex items-center justify-between p-4 text-left',
                  'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
                  fieldError && 'bg-error-50 dark:bg-error-900/20'
                )}
                onClick={() => handleToggleExpansion(index)}
                aria-expanded={open}
                aria-controls={`${componentId}-content-${index}`}
                data-testid={`${testId || 'lookup-keys'}-accordion-${index}`}
              >
                <div className="flex items-center gap-3">
                  {showIndices && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {index + 1}
                    </span>
                  )}
                  <span className={cn(sizeClasses.header, 'text-gray-900 dark:text-gray-100')}>
                    Lookup Key {index + 1}
                  </span>
                  {fieldError && (
                    <span className="text-sm text-error-600 dark:text-error-400">
                      ({fieldError})
                    </span>
                  )}
                </div>
                <ChevronDown 
                  className={cn(
                    'h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-150',
                    open && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </Disclosure.Button>
              
              <Disclosure.Panel
                id={`${componentId}-content-${index}`}
                className="p-4 space-y-4"
                static
              >
                {/* Key input */}
                <FormField
                  {...baseFieldProps}
                  name={`${name}.${index}.key` as Path<TFieldValues>}
                  config={{
                    label: 'Key',
                    placeholder: 'Enter key name',
                    required: true,
                    description: 'A unique identifier for this lookup value',
                  }}
                >
                  <Input
                    id={`${componentId}-key-${index}`}
                    data-testid={`${testId || 'lookup-keys'}-key-${index}`}
                  />
                </FormField>
                
                {/* Value input */}
                <FormField
                  {...baseFieldProps}
                  name={`${name}.${index}.value` as Path<TFieldValues>}
                  config={{
                    label: 'Value',
                    placeholder: 'Enter value',
                    required: true,
                    description: 'The value associated with this key',
                  }}
                >
                  <Input
                    id={`${componentId}-value-${index}`}
                    data-testid={`${testId || 'lookup-keys'}-value-${index}`}
                  />
                </FormField>
                
                {/* Privacy toggle and actions */}
                <div className="flex items-center justify-between pt-2">
                  {showPrivacyToggle && (
                    <FormField
                      {...baseFieldProps}
                      name={`${name}.${index}.private` as Path<TFieldValues>}
                      config={{
                        label: 'Mark as Private',
                        description: 'Private keys are not exposed in API documentation',
                      }}
                      layout={{ orientation: 'horizontal' }}
                    >
                      <Toggle
                        size={size}
                        data-testid={`${testId || 'lookup-keys'}-private-${index}`}
                      />
                    </FormField>
                  )}
                  
                  <IconButton
                    variant="destructive"
                    size={size === 'sm' ? 'sm' : 'default'}
                    onClick={() => handleRemoveItem(index)}
                    disabled={!canRemoveItems}
                    aria-label={`${removeButtonText} lookup key ${index + 1}`}
                    data-testid={`${testId || 'lookup-keys'}-remove-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </Disclosure.Panel>
            </div>
          )}
        </Disclosure>
      );
    }
    
    // Render inline layout item
    return (
      <div 
        key={field.id}
        className={cn(layoutClasses.row, fieldError && 'border-error-300 dark:border-error-700')}
        data-testid={`${testId || 'lookup-keys'}-item-${index}`}
      >
        {/* Index (optional) */}
        {showIndices && (
          <div className="w-12 flex-shrink-0">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {index + 1}
            </span>
          </div>
        )}
        
        {/* Key input */}
        <div className={layoutClasses.cell}>
          <FormField
            {...baseFieldProps}
            name={`${name}.${index}.key` as Path<TFieldValues>}
            config={{
              label: 'Key',
              placeholder: 'Enter key name',
              required: true,
            }}
          >
            <Input
              id={`${componentId}-key-${index}`}
              data-testid={`${testId || 'lookup-keys'}-key-${index}`}
            />
          </FormField>
        </div>
        
        {/* Value input */}
        <div className={layoutClasses.cell}>
          <FormField
            {...baseFieldProps}
            name={`${name}.${index}.value` as Path<TFieldValues>}
            config={{
              label: 'Value',
              placeholder: 'Enter value',
              required: true,
            }}
          >
            <Input
              id={`${componentId}-value-${index}`}
              data-testid={`${testId || 'lookup-keys'}-value-${index}`}
            />
          </FormField>
        </div>
        
        {/* Privacy toggle (optional) */}
        {showPrivacyToggle && (
          <div className="w-32 flex-shrink-0">
            <FormField
              {...baseFieldProps}
              name={`${name}.${index}.private` as Path<TFieldValues>}
              config={{
                label: 'Private',
              }}
            >
              <Toggle
                size={size}
                data-testid={`${testId || 'lookup-keys'}-private-${index}`}
              />
            </FormField>
          </div>
        )}
        
        {/* Action buttons */}
        <div className={layoutClasses.actions}>
          <IconButton
            variant="destructive"
            size={size === 'sm' ? 'sm' : 'default'}
            onClick={() => handleRemoveItem(index)}
            disabled={!canRemoveItems}
            aria-label={`${removeButtonText} lookup key ${index + 1}`}
            data-testid={`${testId || 'lookup-keys'}-remove-${index}`}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    );
  }, [
    layout,
    layoutClasses,
    sizeClasses,
    showIndices,
    showPrivacyToggle,
    validationErrors,
    expandedItems,
    finalControl,
    size,
    disabled,
    readOnly,
    name,
    componentId,
    testId,
    handleToggleExpansion,
    handleRemoveItem,
    canRemoveItems,
    removeButtonText,
  ]);
  
  /**
   * Render empty state when no items exist
   */
  const renderEmptyState = useCallback(() => (
    <div 
      id={emptyStateId}
      className="flex flex-col items-center justify-center p-8 text-center"
      data-testid={`${testId || 'lookup-keys'}-empty-state`}
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No Lookup Keys
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        {emptyStateMessage}
      </p>
      {canAddItems && (
        <IconButton
          variant="primary"
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
          onClick={handleAddItem}
          aria-label={addButtonText}
          data-testid={`${testId || 'lookup-keys'}-empty-add-button`}
        >
          <Plus className="h-4 w-4" />
        </IconButton>
      )}
    </div>
  ), [
    emptyStateId,
    testId,
    emptyStateMessage,
    canAddItems,
    size,
    handleAddItem,
    addButtonText,
  ]);
  
  // ========================================================================
  // MAIN COMPONENT RENDER
  // ========================================================================
  
  return (
    <div
      className={containerClasses}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={combinedDescribedBy}
      data-testid={testId || 'lookup-keys'}
      data-layout={layout}
      data-size={size}
      data-theme={resolvedTheme}
      data-readonly={readOnly}
      data-disabled={disabled}
      data-loading={loading}
      data-item-count={fields.length}
      {...props}
    >
      {/* Component Header */}
      {renderHeader()}
      
      {/* Main Content Area */}
      <div className={layoutClasses.content}>
        {fields.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Table Headers (for table layout only) */}
            {layout === 'table' && (
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2">
                <div className={cn(layoutClasses.row, 'font-medium text-sm text-gray-700 dark:text-gray-300')}>
                  {showIndices && (
                    <div className="w-12 flex-shrink-0">#</div>
                  )}
                  <div className={layoutClasses.cell}>Key</div>
                  <div className={layoutClasses.cell}>Value</div>
                  {showPrivacyToggle && (
                    <div className="w-16 flex-shrink-0 text-center">Private</div>
                  )}
                  <div className="w-24 flex-shrink-0 text-center">Actions</div>
                </div>
              </div>
            )}
            
            {/* Lookup Key Items */}
            <div 
              className={layout === 'table' ? 'divide-y divide-gray-200 dark:divide-gray-700' : layoutClasses.content}
              role={layout === 'table' ? 'table' : undefined}
              aria-label={layout === 'table' ? 'Lookup keys table' : undefined}
            >
              {fields.map((field, index) => renderItem(field, index))}
            </div>
          </>
        )}
      </div>
      
      {/* Screen Reader Status Updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {loading && 'Loading lookup keys...'}
        {fields.length === 1 && '1 lookup key configured'}
        {fields.length > 1 && `${fields.length} lookup keys configured`}
        {fields.length === 0 && 'No lookup keys configured'}
      </div>
      
      {/* Validation Summary (Screen Reader Only) */}
      {validationErrors.size > 0 && (
        <div className="sr-only" aria-live="assertive">
          {`${validationErrors.size} validation ${validationErrors.size === 1 ? 'error' : 'errors'} in lookup keys`}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENT METADATA AND EXPORTS
// ============================================================================

// Set display name for debugging
LookupKeys.displayName = 'LookupKeys';

/**
 * Default export for convenient importing
 */
export default LookupKeys;

/**
 * Export validation schemas for external use
 */
export { lookupKeyItemSchema, lookupKeysSchema };

/**
 * Export type definitions for external use
 */
export type { 
  LookupKeysProps, 
  LookupKeyItem, 
  LookupKeysLayout, 
  LookupKeysSize 
};

/**
 * Component constants for consistent behavior
 */
export const LOOKUP_KEYS_CONSTANTS = {
  /** Default layout */
  DEFAULT_LAYOUT: 'table' as LookupKeysLayout,
  
  /** Default size */
  DEFAULT_SIZE: 'md' as LookupKeysSize,
  
  /** Default maximum items */
  DEFAULT_MAX_ITEMS: 100,
  
  /** Default minimum items */
  DEFAULT_MIN_ITEMS: 0,
  
  /** Default add button text */
  DEFAULT_ADD_BUTTON_TEXT: 'Add Lookup Key',
  
  /** Default remove button text */
  DEFAULT_REMOVE_BUTTON_TEXT: 'Remove',
  
  /** Default empty state message */
  DEFAULT_EMPTY_STATE_MESSAGE: 'No lookup keys configured. Click the add button to create your first key-value pair.',
  
  /** Component accessibility role */
  COMPONENT_ROLE: 'group',
  
  /** Validation debounce delay (ms) */
  VALIDATION_DEBOUNCE_DELAY: 100,
} as const;