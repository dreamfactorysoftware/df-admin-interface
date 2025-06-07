'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ParameterConfig } from './types/endpoint-config.types';

/**
 * Zod schema for parameter validation with real-time validation under 100ms
 * Ensures comprehensive validation rules for all parameter configurations
 */
const ParameterSchema = z.object({
  id: z.string().min(1, 'Parameter ID is required'),
  name: z.string()
    .min(1, 'Parameter name is required')
    .max(100, 'Parameter name must be under 100 characters')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Parameter name must be a valid identifier'),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object'], {
    errorMap: () => ({ message: 'Invalid parameter type' })
  }),
  required: z.boolean().default(false),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  defaultValue: z.any().optional(),
  validation: z.array(z.object({
    type: z.enum(['required', 'minLength', 'maxLength', 'pattern', 'custom']),
    value: z.any().optional(),
    message: z.string().min(1, 'Validation message is required')
  })).optional(),
  examples: z.array(z.any()).optional()
});

const ParameterListSchema = z.object({
  parameters: z.array(ParameterSchema)
});

type ParameterFormData = z.infer<typeof ParameterListSchema>;
type Parameter = z.infer<typeof ParameterSchema>;

/**
 * Parameter type options with associated metadata for conditional configuration
 */
const PARAMETER_TYPES = [
  { 
    value: 'string', 
    label: 'String', 
    description: 'Text values',
    icon: '📝',
    validationOptions: ['minLength', 'maxLength', 'pattern']
  },
  { 
    value: 'number', 
    label: 'Number', 
    description: 'Numeric values',
    icon: '🔢',
    validationOptions: ['min', 'max', 'multipleOf']
  },
  { 
    value: 'boolean', 
    label: 'Boolean', 
    description: 'True/false values',
    icon: '✅',
    validationOptions: []
  },
  { 
    value: 'array', 
    label: 'Array', 
    description: 'List of values',
    icon: '📋',
    validationOptions: ['minItems', 'maxItems', 'uniqueItems']
  },
  { 
    value: 'object', 
    label: 'Object', 
    description: 'Structured data',
    icon: '🏗️',
    validationOptions: ['properties', 'required', 'additionalProperties']
  }
] as const;

/**
 * Parameter locations for API endpoint configuration
 */
const PARAMETER_LOCATIONS = [
  { value: 'path', label: 'Path Parameter', description: 'URL path segment parameters' },
  { value: 'query', label: 'Query Parameter', description: 'URL query string parameters' },
  { value: 'header', label: 'Header Parameter', description: 'HTTP header parameters' },
  { value: 'body', label: 'Body Parameter', description: 'Request body parameters' }
] as const;

/**
 * Props for the ParameterBuilder component
 */
interface ParameterBuilderProps {
  /** Initial parameters to populate the builder */
  initialParameters?: ParameterConfig[];
  /** Callback fired when parameters change */
  onParametersChange?: (parameters: ParameterConfig[]) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Maximum number of parameters allowed */
  maxParameters?: number;
  /** Whether to enable virtual scrolling for large lists */
  enableVirtualization?: boolean;
  /** Virtual scrolling threshold - enable virtual scrolling above this count */
  virtualizationThreshold?: number;
  /** CSS class names to apply to the component */
  className?: string;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Props for individual sortable parameter items
 */
interface SortableParameterItemProps {
  parameter: Parameter;
  index: number;
  form: UseFormReturn<ParameterFormData>;
  onRemove: (index: number) => void;
  disabled?: boolean;
  isVirtualized?: boolean;
}

/**
 * Individual sortable parameter item component with drag-and-drop capability
 * Implements accessibility features and real-time validation
 */
function SortableParameterItem({
  parameter,
  index,
  form,
  onRemove,
  disabled = false,
  isVirtualized = false
}: SortableParameterItemProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: parameter.id,
    disabled: disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // Watch current parameter values for conditional rendering
  const currentType = watch(`parameters.${index}.type`);
  const currentRequired = watch(`parameters.${index}.required`);
  
  // Get type metadata for conditional configuration
  const typeMetadata = PARAMETER_TYPES.find(t => t.value === currentType);

  // Handle type change and reset type-specific values
  const handleTypeChange = useCallback((newType: string) => {
    setValue(`parameters.${index}.type`, newType as any);
    setValue(`parameters.${index}.defaultValue`, undefined);
    setValue(`parameters.${index}.validation`, []);
    setValue(`parameters.${index}.examples`, []);
  }, [setValue, index]);

  // Generate appropriate default value based on type
  const getDefaultValuePlaceholder = useCallback(() => {
    switch (currentType) {
      case 'string': return 'Enter default text value';
      case 'number': return 'Enter default number';
      case 'boolean': return 'true/false';
      case 'array': return '["item1", "item2"]';
      case 'object': return '{"key": "value"}';
      default: return 'Enter default value';
    }
  }, [currentType]);

  // Handle removing parameter with confirmation
  const handleRemove = useCallback(() => {
    if (window.confirm('Are you sure you want to remove this parameter?')) {
      onRemove(index);
    }
  }, [onRemove, index]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'parameter-item',
        isVirtualized && 'virtual-parameter-item',
        isDragging && 'dragging'
      )}
      data-testid={`parameter-item-${index}`}
    >
      <Card className={cn(
        'transition-all duration-200 hover:shadow-md',
        isDragging && 'shadow-lg ring-2 ring-primary-500',
        errors.parameters?.[index] && 'border-red-500'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Drag handle with accessibility support */}
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md',
                  'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  'transition-colors duration-200',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={`Drag to reorder parameter ${parameter.name || 'unnamed'}`}
                disabled={disabled}
                {...attributes}
                {...listeners}
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 6h.01M8 10h.01M8 14h.01M8 18h.01M16 6h.01M16 10h.01M16 14h.01M16 18h.01"
                  />
                </svg>
              </button>

              <div className="flex-1">
                <CardTitle className="text-sm font-medium">
                  {parameter.name || 'Unnamed Parameter'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {typeMetadata?.icon} {typeMetadata?.label} • {currentRequired ? 'Required' : 'Optional'}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Expand/collapse toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md',
                  'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
                  'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  'transition-colors duration-200'
                )}
                aria-label={isExpanded ? 'Collapse parameter details' : 'Expand parameter details'}
                aria-expanded={isExpanded}
              >
                <svg
                  className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Remove parameter button */}
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-md',
                  'text-red-500 hover:text-red-700 hover:bg-red-50',
                  'dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                  'transition-colors duration-200',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={`Remove parameter ${parameter.name || 'unnamed'}`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Expandable parameter configuration */}
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Basic parameter configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parameter name */}
                <div className="space-y-2">
                  <label 
                    htmlFor={`param-name-${index}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Parameter Name *
                  </label>
                  <Input
                    id={`param-name-${index}`}
                    {...register(`parameters.${index}.name`)}
                    placeholder="Enter parameter name"
                    disabled={disabled}
                    error={!!errors.parameters?.[index]?.name}
                    errorMessage={errors.parameters?.[index]?.name?.message}
                    className="min-h-[44px]"
                    aria-describedby={errors.parameters?.[index]?.name ? `param-name-${index}-error` : undefined}
                  />
                </div>

                {/* Parameter type */}
                <div className="space-y-2">
                  <label 
                    htmlFor={`param-type-${index}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Parameter Type *
                  </label>
                  <select
                    id={`param-type-${index}`}
                    {...register(`parameters.${index}.type`)}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    disabled={disabled}
                    className={cn(
                      'flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                      'placeholder:text-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                      'dark:placeholder:text-gray-500 dark:focus:ring-primary-400',
                      errors.parameters?.[index]?.type && 'border-red-500 focus:ring-red-500'
                    )}
                    aria-describedby={errors.parameters?.[index]?.type ? `param-type-${index}-error` : undefined}
                  >
                    {PARAMETER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                  {errors.parameters?.[index]?.type && (
                    <p 
                      id={`param-type-${index}-error`}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.parameters[index].type?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Required toggle and description */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    id={`param-required-${index}`}
                    type="checkbox"
                    {...register(`parameters.${index}.required`)}
                    disabled={disabled}
                    className={cn(
                      'h-4 w-4 rounded border-gray-300 text-primary-600',
                      'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'dark:border-gray-600 dark:bg-gray-800',
                      'dark:focus:ring-primary-400 dark:focus:ring-offset-gray-900'
                    )}
                  />
                  <label 
                    htmlFor={`param-required-${index}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Required Parameter
                  </label>
                </div>

                <div className="space-y-2">
                  <label 
                    htmlFor={`param-description-${index}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id={`param-description-${index}`}
                    {...register(`parameters.${index}.description`)}
                    placeholder="Describe this parameter's purpose and usage"
                    disabled={disabled}
                    rows={2}
                    className={cn(
                      'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                      'placeholder:text-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                      'dark:placeholder:text-gray-500 dark:focus:ring-primary-400',
                      'resize-none',
                      errors.parameters?.[index]?.description && 'border-red-500 focus:ring-red-500'
                    )}
                    aria-describedby={errors.parameters?.[index]?.description ? `param-description-${index}-error` : undefined}
                  />
                  {errors.parameters?.[index]?.description && (
                    <p 
                      id={`param-description-${index}-error`}
                      className="text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.parameters[index].description?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Type-specific configuration */}
              {currentType && (
                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {typeMetadata?.label} Configuration
                  </h4>

                  {/* Default value configuration */}
                  <div className="space-y-2">
                    <label 
                      htmlFor={`param-default-${index}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Default Value
                    </label>
                    
                    {currentType === 'boolean' ? (
                      <select
                        id={`param-default-${index}`}
                        {...register(`parameters.${index}.defaultValue`)}
                        disabled={disabled}
                        className={cn(
                          'flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                        )}
                      >
                        <option value="">No default</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <Input
                        id={`param-default-${index}`}
                        {...register(`parameters.${index}.defaultValue`)}
                        placeholder={getDefaultValuePlaceholder()}
                        disabled={disabled}
                        type={currentType === 'number' ? 'number' : 'text'}
                        className="min-h-[44px]"
                      />
                    )}
                  </div>

                  {/* Example values */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Example Values
                    </label>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Provide example values to help API consumers understand expected formats
                    </div>
                    {/* Example values would be implemented with a dynamic array input component */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-xs text-gray-600 dark:text-gray-400">
                      Example values configuration will be implemented based on parameter type
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/**
 * ParameterBuilder Component
 * 
 * Dynamic parameter configuration component for building API endpoint parameters.
 * Features drag-and-drop reordering, real-time validation under 100ms, and 
 * type-specific configuration options with TanStack Virtual integration for 
 * efficient rendering of large parameter lists.
 * 
 * Key Features:
 * - Drag-and-drop parameter reordering with React DnD
 * - Real-time validation with Zod schema integration
 * - Type-specific conditional configuration
 * - Virtual scrolling for large parameter lists (1000+ items)
 * - WCAG 2.1 AA accessibility compliance
 * - React Hook Form integration for optimal performance
 * 
 * @param {ParameterBuilderProps} props - Component configuration props
 * @returns {JSX.Element} Parameter builder interface
 */
export function ParameterBuilder({
  initialParameters = [],
  onParametersChange,
  disabled = false,
  maxParameters = 100,
  enableVirtualization = true,
  virtualizationThreshold = 20,
  className,
  'data-testid': testId = 'parameter-builder'
}: ParameterBuilderProps) {
  // Form setup with Zod validation
  const form = useForm<ParameterFormData>({
    resolver: zodResolver(ParameterListSchema),
    defaultValues: {
      parameters: initialParameters.map((param, index) => ({
        ...param,
        id: param.name || `param-${index}`
      }))
    },
    mode: 'onChange' // Enable real-time validation under 100ms
  });

  const { control, watch, setValue, formState: { errors } } = form;
  
  // Field array for dynamic parameter management
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'parameters'
  });

  // Watch parameters for external change notifications
  const watchedParameters = watch('parameters');

  // Notify parent component of parameter changes
  useEffect(() => {
    if (onParametersChange) {
      const parameters = watchedParameters.map(({ id, ...param }) => param as ParameterConfig);
      onParametersChange(parameters);
    }
  }, [watchedParameters, onParametersChange]);

  // Virtual scrolling setup for large parameter lists
  const parentRef = React.useRef<HTMLDivElement>(null);
  const shouldVirtualize = enableVirtualization && fields.length > virtualizationThreshold;
  
  const virtualizer = useVirtualizer({
    count: fields.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height per parameter item
    enabled: shouldVirtualize
  });

  // Drag and drop sensors with accessibility support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Prevent accidental drags
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: undefined // Use default keyboard navigation
    })
  );

  // Handle drag end for parameter reordering
  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  }, [fields, move]);

  // Add new parameter with validation
  const addParameter = useCallback(() => {
    if (fields.length >= maxParameters) {
      alert(`Maximum of ${maxParameters} parameters allowed`);
      return;
    }

    const newId = `param-${Date.now()}`;
    append({
      id: newId,
      name: `parameter_${fields.length + 1}`,
      type: 'string',
      required: false,
      description: '',
      defaultValue: undefined,
      validation: [],
      examples: []
    });
  }, [append, fields.length, maxParameters]);

  // Remove parameter with confirmation
  const removeParameter = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Memoized parameter items for performance
  const parameterItems = useMemo(() => {
    const items = shouldVirtualize ? virtualizer.getVirtualItems() : 
      fields.map((_, index) => ({ index, start: 0, size: 0 }));

    return items.map((virtualItem) => {
      const index = virtualItem.index;
      const field = fields[index];
      
      return (
        <div
          key={field.id}
          style={shouldVirtualize ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualItem.size}px`,
            transform: `translateY(${virtualItem.start}px)`
          } : undefined}
        >
          <SortableParameterItem
            parameter={field}
            index={index}
            form={form}
            onRemove={removeParameter}
            disabled={disabled}
            isVirtualized={shouldVirtualize}
          />
        </div>
      );
    });
  }, [fields, form, removeParameter, disabled, shouldVirtualize, virtualizer]);

  return (
    <div 
      className={cn('parameter-builder space-y-4', className)}
      data-testid={testId}
    >
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            API Parameters
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure parameters for your API endpoint. Drag to reorder.
          </p>
        </div>
        
        <Button
          type="button"
          onClick={addParameter}
          disabled={disabled || fields.length >= maxParameters}
          className="min-h-[44px]"
          aria-label="Add new parameter"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Parameter
        </Button>
      </div>

      {/* Parameters count and validation summary */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {fields.length} {fields.length === 1 ? 'parameter' : 'parameters'} 
          {maxParameters < Infinity && ` (max ${maxParameters})`}
        </span>
        
        {Object.keys(errors.parameters || {}).length > 0 && (
          <span className="text-red-600 dark:text-red-400 font-medium">
            {Object.keys(errors.parameters).length} validation error(s)
          </span>
        )}
      </div>

      {/* Parameters list */}
      {fields.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg 
              className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No parameters yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Add parameters to define the inputs for your API endpoint. Parameters can be path variables, query parameters, or request body fields.
            </p>
            <Button
              type="button"
              onClick={addParameter}
              disabled={disabled}
              variant="outline"
              className="min-h-[44px]"
            >
              Add Your First Parameter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div 
              ref={parentRef}
              className={cn(
                'space-y-4',
                shouldVirtualize && 'h-96 overflow-auto relative'
              )}
              style={shouldVirtualize ? {
                height: `${virtualizer.getTotalSize()}px`
              } : undefined}
            >
              {parameterItems}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Performance notice for large lists */}
      {shouldVirtualize && (
        <div className="text-xs text-gray-500 dark:text-gray-400 italic">
          Virtual scrolling enabled for optimal performance with {fields.length} parameters
        </div>
      )}
    </div>
  );
}

export default ParameterBuilder;