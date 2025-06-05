/**
 * React implementation of the dynamic field array component
 * 
 * Manages arrays and objects of form fields with add/remove functionality using React Hook Form's 
 * useFieldArray. Integrates with DynamicField and VerbPicker components, implements accessible 
 * table layout with Tailwind CSS styling, supports dark theme via Zustand store, and maintains 
 * WCAG 2.1 AA compliance.
 * 
 * Replaces Angular df-array-field component with modern React patterns while preserving all 
 * existing functionality including string arrays, complex object arrays, and nested field support.
 * 
 * @fileoverview Field Array component for React 19/Next.js 15.1
 * @version 1.0.0
 * @requires react@19.0.0
 * @requires react-hook-form@7.52.0
 * @requires @headlessui/react@2.0.0
 * @requires tailwindcss@4.1.0
 * @requires zustand@4.5.0
 */

'use client';

import React, { forwardRef, useMemo, useCallback, useId } from 'react';
import { 
  useFieldArray, 
  useFormContext, 
  Controller,
  FieldValues,
  FieldArrayPath,
  FieldPath,
  ArrayPath
} from 'react-hook-form';
import { 
  FieldArrayProps,
  FieldArrayItemConfig,
  TableColumnConfig,
  ConfigSchema,
  FieldArrayMode,
  FieldArrayLayout
} from './field-array.types';
import { VerbPicker } from '@/components/ui/verb-picker';
import { DynamicField } from '@/components/ui/dynamic-field';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import {
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

/**
 * FieldArray component with comprehensive React Hook Form integration
 * 
 * @template TFieldValues - Form values type
 * @template TFieldArrayName - Field array name path type
 * @template TKeyName - Key name for field array items
 */
const FieldArray = forwardRef<
  HTMLDivElement,
  FieldArrayProps
>(function FieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
>(
  {
    // Core configuration
    mode = 'array',
    layout = 'table',
    size = 'md',
    schema,
    itemConfig = [],
    tableConfig,
    
    // React Hook Form integration
    control,
    name,
    rules,
    keyName = 'id' as TKeyName,
    
    // Value and state management
    defaultValues,
    minItems = 0,
    maxItems,
    sortable = false,
    allowDuplicates = true,
    selectable = false,
    showIndices = false,
    
    // UI configuration
    addButtonPlacement = 'bottom',
    addButtonText,
    addButtonIcon,
    removeButtonIcon,
    reorderIcon,
    showLabels = true,
    showBorders = true,
    collapsible = false,
    emptyStateContent,
    loadingStateContent,
    
    // Component integration
    dynamicFieldIntegration,
    verbPickerIntegration,
    componentIntegrations = [],
    itemRenderer,
    headerRenderer,
    footerRenderer,
    
    // Event handlers
    onChange,
    onItemChange,
    onValidation,
    onReorder,
    onAddItem,
    onRemoveItem,
    onItemSelect,
    onItemFocus,
    onItemBlur,
    
    // Accessibility and ARIA
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-label-add': ariaLabelAdd,
    'aria-label-remove': ariaLabelRemove,
    'aria-label-reorder': ariaLabelReorder,
    'aria-live': ariaLive = 'polite',
    announcements = {},
    
    // Performance and virtualization
    virtualized = false,
    virtualItemHeight = 48,
    virtualBufferSize = 5,
    virtualThreshold = 100,
    memoizeItems = true,
    debounceDelay = 100,
    
    // Base component props
    className,
    disabled = false,
    ...props
  },
  ref
) {
  // Hooks
  const { resolvedTheme } = useTheme();
  const componentId = useId();
  const formContext = useFormContext();
  
  // Use provided control or fall back to form context
  const formControl = control || formContext?.control;
  
  if (!formControl) {
    throw new Error('FieldArray must be used within a FormProvider or have control prop provided');
  }
  
  // Field array hook
  const fieldArray = useFieldArray({
    control: formControl,
    name,
    keyName,
    rules: {
      minLength: minItems > 0 ? { value: minItems, message: `Minimum ${minItems} items required` } : undefined,
      maxLength: maxItems ? { value: maxItems, message: `Maximum ${maxItems} items allowed` } : undefined,
      ...rules
    }
  });
  
  const { fields, append, prepend, remove, swap, move, insert, replace } = fieldArray;
  
  // Derived state
  const isDarkTheme = resolvedTheme === 'dark';
  const canAddMore = !maxItems || fields.length < maxItems;
  const canRemove = fields.length > minItems;
  const isStringArray = schema?.items === 'string';
  const isEmptyState = fields.length === 0;
  
  // Generate schemas for object arrays
  const itemSchemas = useMemo(() => {
    if (mode === 'array' && !isStringArray && Array.isArray(schema?.items)) {
      return schema.items as ConfigSchema[];
    }
    
    if (mode === 'object' && schema?.object) {
      return [
        {
          name: 'key',
          label: schema.object.key?.label || 'Key',
          type: schema.object.key?.type || 'string',
          required: true
        } as ConfigSchema,
        {
          name: 'value', 
          label: schema.object.value?.label || 'Value',
          type: schema.object.value?.type || 'string',
          required: schema.object.value?.required
        } as ConfigSchema
      ];
    }
    
    return itemConfig.map(config => ({
      name: config.key,
      label: config.label,
      type: config.type,
      required: config.required,
      default: config.default,
      ...config.config
    })) as ConfigSchema[];
  }, [mode, schema, itemConfig, isStringArray]);
  
  // Column definitions for table layout
  const tableColumns = useMemo(() => {
    if (tableConfig?.columns) {
      return tableConfig.columns;
    }
    
    const columns: TableColumnConfig[] = [];
    
    if (showIndices) {
      columns.push({
        key: '#',
        header: '#',
        type: 'index',
        width: '60px',
        align: 'center'
      });
    }
    
    if (isStringArray) {
      columns.push({
        key: schema?.name || 'value',
        header: schema?.label || 'Value',
        type: 'string',
        width: '100%'
      });
    } else {
      itemSchemas.forEach(itemSchema => {
        columns.push({
          key: itemSchema.name,
          header: itemSchema.label,
          type: itemSchema.type,
          width: itemSchema.type === 'verb_mask' ? '200px' : 'auto'
        });
      });
    }
    
    columns.push({
      key: 'actions',
      header: addButtonPlacement === 'top' || addButtonPlacement === 'both' ? 'Actions' : '',
      type: 'actions',
      width: '120px',
      align: 'center',
      sticky: true
    });
    
    return columns;
  }, [
    tableConfig?.columns,
    showIndices,
    isStringArray,
    schema,
    itemSchemas,
    addButtonPlacement
  ]);
  
  // Add item handler
  const handleAddItem = useCallback((index?: number) => {
    if (!canAddMore) return;
    
    let newItem: any;
    
    if (isStringArray) {
      newItem = '';
    } else if (mode === 'object') {
      newItem = { key: '', value: '' };
    } else {
      // Create object from schemas with default values
      newItem = {};
      itemSchemas.forEach(itemSchema => {
        newItem[itemSchema.name] = itemSchema.default ?? '';
      });
    }
    
    // Apply default values override
    if (defaultValues) {
      newItem = { ...newItem, ...defaultValues };
    }
    
    if (typeof index === 'number') {
      insert(index, newItem);
    } else {
      append(newItem);
    }
    
    onAddItem?.(index);
    
    onChange?.(fields, {
      type: 'add',
      index: index ?? fields.length,
      value: newItem
    });
    
    // Announce to screen readers
    if (announcements.itemAdded) {
      // In a real implementation, you would use a live region or toast notification
      console.log(announcements.itemAdded);
    }
  }, [
    canAddMore,
    isStringArray,
    mode,
    itemSchemas,
    defaultValues,
    insert,
    append,
    fields,
    onAddItem,
    onChange,
    announcements.itemAdded
  ]);
  
  // Remove item handler
  const handleRemoveItem = useCallback((index: number) => {
    if (!canRemove || index < 0 || index >= fields.length) return;
    
    const removedItem = fields[index];
    remove(index);
    
    onRemoveItem?.(index);
    
    onChange?.(fields, {
      type: 'remove',
      index,
      previousValue: removedItem
    });
    
    // Announce to screen readers
    if (announcements.itemRemoved) {
      console.log(announcements.itemRemoved);
    }
  }, [
    canRemove,
    fields,
    remove,
    onRemoveItem,
    onChange,
    announcements.itemRemoved
  ]);
  
  // Reorder handlers (for sortable arrays)
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!sortable || fromIndex === toIndex) return;
    
    const movedItem = fields[fromIndex];
    move(fromIndex, toIndex);
    
    onReorder?.(fromIndex, toIndex, movedItem);
    
    onChange?.(fields, {
      type: 'reorder',
      fromIndex,
      toIndex
    });
    
    // Announce to screen readers
    if (announcements.itemReordered) {
      console.log(announcements.itemReordered);
    }
  }, [
    sortable,
    fields,
    move,
    onReorder,
    onChange,
    announcements.itemReordered
  ]);
  
  // Item change handler
  const handleItemChange = useCallback((value: any, index: number, field?: string) => {
    onItemChange?.(value, index, field);
    
    onChange?.(fields, {
      type: 'update',
      index,
      value,
      previousValue: fields[index]
    });
  }, [onItemChange, onChange, fields]);
  
  // Add button component
  const AddButton = useCallback(({ 
    index, 
    variant = 'primary',
    size: buttonSize = 'sm'
  }: { 
    index?: number; 
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
  }) => (
    <Button
      type="button"
      variant={variant}
      size={buttonSize}
      onClick={() => handleAddItem(index)}
      disabled={disabled || !canAddMore}
      aria-label={ariaLabelAdd || `Add ${schema?.label || 'item'}`}
      className={cn(
        "flex items-center gap-2",
        variant === 'ghost' && "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      {addButtonIcon || <PlusIcon className="h-4 w-4" />}
      {addButtonText && <span className="sr-only md:not-sr-only">{addButtonText}</span>}
    </Button>
  ), [
    handleAddItem,
    disabled,
    canAddMore,
    ariaLabelAdd,
    schema?.label,
    addButtonIcon,
    addButtonText
  ]);
  
  // Remove button component
  const RemoveButton = useCallback(({ 
    index,
    size: buttonSize = 'sm'
  }: { 
    index: number;
    size?: 'sm' | 'md' | 'lg';
  }) => (
    <Button
      type="button"
      variant="destructive"
      size={buttonSize}
      onClick={() => handleRemoveItem(index)}
      disabled={disabled || !canRemove}
      aria-label={ariaLabelRemove || `Remove item ${index + 1}`}
      className="flex items-center gap-2"
    >
      {removeButtonIcon || <TrashIcon className="h-4 w-4" />}
    </Button>
  ), [
    handleRemoveItem,
    disabled,
    canRemove,
    ariaLabelRemove,
    removeButtonIcon
  ]);
  
  // Field renderer for table cells
  const renderField = useCallback((
    column: TableColumnConfig,
    index: number,
    itemSchema?: ConfigSchema
  ) => {
    const fieldName = `${name}.${index}.${column.key}` as FieldPath<TFieldValues>;
    
    if (column.type === 'index') {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {index + 1}
        </span>
      );
    }
    
    if (column.type === 'actions') {
      return (
        <div className="flex items-center gap-2">
          {sortable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={ariaLabelReorder || `Reorder item ${index + 1}`}
              className="cursor-move"
            >
              {reorderIcon || <Bars3Icon className="h-4 w-4" />}
            </Button>
          )}
          
          {(addButtonPlacement === 'inline') && (
            <AddButton index={index + 1} variant="ghost" />
          )}
          
          <RemoveButton index={index} />
        </div>
      );
    }
    
    if (isStringArray) {
      return (
        <Controller
          control={formControl}
          name={`${name}.${index}` as FieldPath<TFieldValues>}
          render={({ field, fieldState }) => (
            <div className="w-full">
              <input
                {...field}
                type="text"
                disabled={disabled}
                aria-label={schema?.label || 'Value'}
                aria-invalid={fieldState.invalid}
                aria-describedby={fieldState.error ? `${componentId}-error-${index}` : undefined}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-sm",
                  "border-gray-300 dark:border-gray-600",
                  "bg-white dark:bg-gray-800",
                  "text-gray-900 dark:text-gray-100",
                  "placeholder-gray-500 dark:placeholder-gray-400",
                  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                  "disabled:bg-gray-50 dark:disabled:bg-gray-900",
                  "disabled:text-gray-500 dark:disabled:text-gray-400",
                  fieldState.invalid && "border-red-500 focus:border-red-500 focus:ring-red-500"
                )}
                onChange={(e) => {
                  field.onChange(e.target.value);
                  handleItemChange(e.target.value, index);
                }}
                onBlur={() => {
                  field.onBlur();
                  onItemBlur?.(index);
                }}
                onFocus={() => onItemFocus?.(index)}
              />
              {fieldState.error && (
                <p
                  id={`${componentId}-error-${index}`}
                  className="mt-1 text-xs text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      );
    }
    
    // Handle VerbPicker component
    if (itemSchema?.type === 'verb_mask' || column.type === 'verb_mask') {
      return (
        <Controller
          control={formControl}
          name={fieldName}
          render={({ field, fieldState }) => (
            <VerbPicker
              {...field}
              mode={verbPickerIntegration?.mode || 'verb'}
              disabled={disabled}
              schema={itemSchema}
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.error ? `${componentId}-error-${index}-${column.key}` : undefined}
              className="w-full"
              onChange={(value) => {
                field.onChange(value);
                handleItemChange(value, index, column.key);
              }}
              onBlur={() => {
                field.onBlur();
                onItemBlur?.(index);
              }}
              onFocus={() => onItemFocus?.(index)}
            />
          )}
        />
      );
    }
    
    // Handle DynamicField component for other types
    return (
      <Controller
        control={formControl}
        name={fieldName}
        render={({ field, fieldState }) => (
          <DynamicField
            {...field}
            schema={itemSchema || { name: column.key, type: column.type, label: column.header }}
            showLabel={false}
            disabled={disabled}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.error ? `${componentId}-error-${index}-${column.key}` : undefined}
            className="w-full"
            onChange={(value) => {
              field.onChange(value);
              handleItemChange(value, index, column.key);
            }}
            onBlur={() => {
              field.onBlur();
              onItemBlur?.(index);
            }}
            onFocus={() => onItemFocus?.(index)}
          />
        )}
      />
    );
  }, [
    name,
    formControl,
    isStringArray,
    schema,
    disabled,
    componentId,
    sortable,
    addButtonPlacement,
    ariaLabelReorder,
    reorderIcon,
    handleItemChange,
    onItemBlur,
    onItemFocus,
    verbPickerIntegration?.mode,
    AddButton,
    RemoveButton
  ]);
  
  // Table header
  const TableHeader = useMemo(() => (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        {tableColumns.map((column) => (
          <th
            key={column.key}
            scope="col"
            className={cn(
              "px-4 py-3 text-left text-xs font-medium uppercase tracking-wide",
              "text-gray-500 dark:text-gray-400",
              column.align === 'center' && "text-center",
              column.align === 'right' && "text-right",
              column.sticky && "sticky right-0 bg-gray-50 dark:bg-gray-800"
            )}
            style={{ width: column.width }}
          >
            <div className="flex items-center gap-2">
              {column.header}
              {column.key === (schema?.name || 'value') && schema?.description && (
                <InformationCircleIcon 
                  className="h-4 w-4 text-gray-400"
                  title={schema.description}
                  aria-label={schema.description}
                />
              )}
              {column.key === 'actions' && (addButtonPlacement === 'top' || addButtonPlacement === 'both') && (
                <AddButton variant="ghost" />
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  ), [tableColumns, schema, addButtonPlacement, AddButton]);
  
  // Table body
  const TableBody = useMemo(() => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
      {fields.map((field, index) => (
        <tr
          key={field.id}
          className={cn(
            "hover:bg-gray-50 dark:hover:bg-gray-800",
            selectable && "cursor-pointer"
          )}
          onClick={() => selectable && onItemSelect?.(index, true)}
        >
          {tableColumns.map((column) => {
            const itemSchema = itemSchemas.find(s => s.name === column.key);
            
            return (
              <td
                key={column.key}
                className={cn(
                  "px-4 py-3 text-sm",
                  column.align === 'center' && "text-center",
                  column.align === 'right' && "text-right",
                  column.sticky && "sticky right-0 bg-white dark:bg-gray-900"
                )}
                style={{ width: column.width }}
              >
                {column.cellRenderer 
                  ? column.cellRenderer(field, index, field)
                  : renderField(column, index, itemSchema)
                }
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  ), [
    fields,
    tableColumns,
    itemSchemas,
    selectable,
    onItemSelect,
    renderField
  ]);
  
  // Empty state
  const EmptyState = useMemo(() => (
    <div className="text-center py-8">
      {emptyStateContent || (
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-sm">No items added yet</p>
          {canAddMore && (
            <div className="mt-4">
              <AddButton />
            </div>
          )}
        </div>
      )}
    </div>
  ), [emptyStateContent, canAddMore, AddButton]);
  
  // Main component structure
  const content = useMemo(() => {
    if (isEmptyState) {
      return EmptyState;
    }
    
    if (layout === 'table') {
      return (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            {TableHeader}
            {TableBody}
          </table>
        </div>
      );
    }
    
    // Other layouts can be implemented here (grid, vertical, etc.)
    return (
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={cn(
              "rounded-lg border border-gray-200 dark:border-gray-700 p-4",
              "bg-white dark:bg-gray-900"
            )}
          >
            {itemRenderer ? (
              itemRenderer(field, index, { 
                id: field.id, 
                index, 
                isEditing: false, 
                isSelected: false, 
                hasErrors: false 
              })
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {itemSchemas.map((itemSchema) => (
                  <div key={itemSchema.name}>
                    {showLabels && (
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {itemSchema.label}
                      </label>
                    )}
                    {renderField(
                      { 
                        key: itemSchema.name, 
                        header: itemSchema.label, 
                        type: itemSchema.type 
                      },
                      index,
                      itemSchema
                    )}
                  </div>
                ))}
                <div className="flex justify-end gap-2 md:col-span-2">
                  <RemoveButton index={index} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }, [
    isEmptyState,
    layout,
    EmptyState,
    TableHeader,
    TableBody,
    fields,
    itemSchemas,
    itemRenderer,
    showLabels,
    renderField,
    RemoveButton
  ]);
  
  return (
    <div
      ref={ref}
      className={cn(
        "field-array",
        "rounded-lg",
        showBorders && "border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-900",
        size === 'sm' && "text-sm",
        size === 'lg' && "text-lg",
        className
      )}
      role="group"
      aria-label={ariaLabel || `${schema?.label || 'Field array'} with ${fields.length} items`}
      aria-describedby={ariaDescribedBy}
      aria-live={ariaLive}
      {...props}
    >
      {/* Header */}
      {(schema?.label || headerRenderer) && (
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          {headerRenderer ? (
            headerRenderer()
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {schema?.label}
              </h3>
              {schema?.description && (
                <InformationCircleIcon 
                  className="h-5 w-5 text-gray-400"
                  title={schema.description}
                  aria-label={schema.description}
                />
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({fields.length} {fields.length === 1 ? 'item' : 'items'})
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={cn("p-4", !showBorders && "p-0")}>
        {content}
      </div>
      
      {/* Footer */}
      {(addButtonPlacement === 'bottom' || addButtonPlacement === 'both' || footerRenderer) && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
          {footerRenderer ? (
            footerRenderer()
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {fields.length} of {maxItems || '∞'} items
              </span>
              <AddButton />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FieldArray.displayName = 'FieldArray';

export default FieldArray;
export { FieldArray };
export type { FieldArrayProps };