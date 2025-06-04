'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  UniqueIdentifier
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useVirtualizer } from '@tanstack/react-virtual';
import { debounce } from 'lodash-es';

// Types
interface Parameter {
  id: string;
  name: string;
  type: ParameterType;
  dataType: DataType;
  required: boolean;
  description?: string;
  defaultValue?: string;
  example?: string;
  validation?: ParameterValidation;
  enumValues?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  order: number;
}

type ParameterType = 'path' | 'query' | 'header' | 'body' | 'formData';

type DataType = 
  | 'string' 
  | 'number' 
  | 'integer' 
  | 'boolean' 
  | 'array' 
  | 'object' 
  | 'file' 
  | 'date' 
  | 'datetime' 
  | 'email' 
  | 'url' 
  | 'uuid';

interface ParameterValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: string[];
  format?: string;
}

// Zod Schema for real-time validation
const parameterSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z
    .string()
    .min(1, 'Parameter name is required')
    .max(50, 'Parameter name must be 50 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Parameter name must start with a letter and contain only letters, numbers, and underscores'),
  type: z.enum(['path', 'query', 'header', 'body', 'formData'], {
    required_error: 'Parameter type is required'
  }),
  dataType: z.enum([
    'string', 'number', 'integer', 'boolean', 'array', 'object', 
    'file', 'date', 'datetime', 'email', 'url', 'uuid'
  ], {
    required_error: 'Data type is required'
  }),
  required: z.boolean(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  defaultValue: z.string().optional(),
  example: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(0).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  pattern: z.string().optional(),
  order: z.number()
});

const parametersFormSchema = z.object({
  parameters: z.array(parameterSchema)
});

type ParametersFormData = z.infer<typeof parametersFormSchema>;

interface ParameterBuilderProps {
  initialParameters?: Parameter[];
  onParametersChange?: (parameters: Parameter[]) => void;
  onValidationChange?: (isValid: boolean, errors?: Record<string, string>) => void;
  maxParameters?: number;
  allowedTypes?: ParameterType[];
  className?: string;
}

// Data type options for different parameter types
const getDataTypeOptions = (parameterType: ParameterType): { value: DataType; label: string }[] => {
  const commonTypes = [
    { value: 'string' as DataType, label: 'String' },
    { value: 'number' as DataType, label: 'Number' },
    { value: 'integer' as DataType, label: 'Integer' },
    { value: 'boolean' as DataType, label: 'Boolean' },
    { value: 'date' as DataType, label: 'Date' },
    { value: 'datetime' as DataType, label: 'DateTime' },
    { value: 'email' as DataType, label: 'Email' },
    { value: 'url' as DataType, label: 'URL' },
    { value: 'uuid' as DataType, label: 'UUID' }
  ];

  switch (parameterType) {
    case 'path':
    case 'query':
    case 'header':
      return commonTypes;
    case 'body':
      return [
        ...commonTypes,
        { value: 'array' as DataType, label: 'Array' },
        { value: 'object' as DataType, label: 'Object' }
      ];
    case 'formData':
      return [
        ...commonTypes,
        { value: 'file' as DataType, label: 'File' },
        { value: 'array' as DataType, label: 'Array' }
      ];
    default:
      return commonTypes;
  }
};

// Sortable Parameter Row Component
const SortableParameterRow: React.FC<{
  parameter: Parameter;
  index: number;
  onUpdate: (index: number, field: keyof Parameter, value: any) => void;
  onRemove: (index: number) => void;
  errors?: Record<string, any>;
  register: any;
  control: any;
}> = ({ parameter, index, onUpdate, onRemove, errors, register, control }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: parameter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const watchedType = useWatch({
    control,
    name: `parameters.${index}.type`,
    defaultValue: parameter.type,
  });

  const watchedDataType = useWatch({
    control,
    name: `parameters.${index}.dataType`,
    defaultValue: parameter.dataType,
  });

  const dataTypeOptions = useMemo(() => getDataTypeOptions(watchedType), [watchedType]);

  // Show conditional validation fields based on data type
  const showStringValidation = ['string', 'email', 'url'].includes(watchedDataType);
  const showNumberValidation = ['number', 'integer'].includes(watchedDataType);
  const showEnumValidation = ['string', 'number', 'integer'].includes(watchedDataType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm
        hover:shadow-md transition-shadow duration-200
        ${isDragging ? 'shadow-lg border-blue-300' : ''}
      `}
    >
      {/* Drag handle and basic info */}
      <div className="flex items-start gap-4 mb-4">
        <button
          type="button"
          className="mt-2 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder parameter ${parameter.name}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 2C9.55 2 10 2.45 10 3S9.55 4 9 4 8 3.55 8 3 8.45 2 9 2M15 2C15.55 2 16 2.45 16 3S15.55 4 15 4 14 3.55 14 3 14.45 2 15 2M9 6C9.55 6 10 6.45 10 7S9.55 8 9 8 8 7.55 8 7 8.45 6 9 6M15 6C15.55 6 16 6.45 16 7S15.55 8 15 8 14 7.55 14 7 14.45 6 15 6M9 10C9.55 10 10 10.45 10 11S9.55 12 9 12 8 11.55 8 11 8.45 10 9 10M15 10C15.55 10 16 10.45 16 11S15.55 12 15 12 14 11.55 14 11 14.45 10 15 10M9 14C9.55 14 10 14.45 10 15S9.55 16 9 16 8 15.55 8 15 8.45 14 9 14M15 14C15.55 14 16 14.45 16 15S15.55 16 15 16 14 15.55 14 15 14.45 14 15 14M9 18C9.55 18 10 18.45 10 19S9.55 20 9 20 8 19.55 8 19 8.45 18 9 18M15 18C15.55 18 16 18.45 16 19S15.55 20 15 20 14 19.55 14 19 14.45 18 15 18M9 22C9.55 22 10 22.45 10 23S9.55 24 9 24 8 23.55 8 23 8.45 22 9 22M15 22C15.55 22 16 22.45 16 23S15.55 24 15 24 14 23.55 14 23 14.45 22 15 22Z"/>
          </svg>
        </button>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Parameter Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameter Name *
            </label>
            <input
              {...register(`parameters.${index}.name`)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors?.parameters?.[index]?.name ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="parameterName"
            />
            {errors?.parameters?.[index]?.name && (
              <p className="mt-1 text-sm text-red-600">{errors.parameters[index].name.message}</p>
            )}
          </div>

          {/* Parameter Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parameter Type *
            </label>
            <select
              {...register(`parameters.${index}.type`)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors?.parameters?.[index]?.type ? 'border-red-300' : 'border-gray-300'}
              `}
            >
              <option value="">Select type...</option>
              <option value="path">Path Parameter</option>
              <option value="query">Query Parameter</option>
              <option value="header">Header Parameter</option>
              <option value="body">Body Parameter</option>
              <option value="formData">Form Data</option>
            </select>
            {errors?.parameters?.[index]?.type && (
              <p className="mt-1 text-sm text-red-600">{errors.parameters[index].type.message}</p>
            )}
          </div>

          {/* Data Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Type *
            </label>
            <select
              {...register(`parameters.${index}.dataType`)}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors?.parameters?.[index]?.dataType ? 'border-red-300' : 'border-gray-300'}
              `}
            >
              <option value="">Select data type...</option>
              {dataTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors?.parameters?.[index]?.dataType && (
              <p className="mt-1 text-sm text-red-600">{errors.parameters[index].dataType.message}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="mt-2 p-2 text-red-400 hover:text-red-600 transition-colors"
          aria-label={`Remove parameter ${parameter.name}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Additional Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Required Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            {...register(`parameters.${index}.required`)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 text-sm text-gray-700">Required parameter</label>
        </div>

        {/* Default Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Value
          </label>
          <input
            {...register(`parameters.${index}.defaultValue`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Default value"
          />
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register(`parameters.${index}.description`)}
          rows={2}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${errors?.parameters?.[index]?.description ? 'border-red-300' : 'border-gray-300'}
          `}
          placeholder="Describe this parameter"
        />
        {errors?.parameters?.[index]?.description && (
          <p className="mt-1 text-sm text-red-600">{errors.parameters[index].description.message}</p>
        )}
      </div>

      {/* Conditional Validation Fields */}
      {(showStringValidation || showNumberValidation || showEnumValidation) && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Validation Rules</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* String validation */}
            {showStringValidation && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Length
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register(`parameters.${index}.minLength`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Length
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register(`parameters.${index}.maxLength`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pattern (Regex)
                  </label>
                  <input
                    {...register(`parameters.${index}.pattern`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="^[a-zA-Z0-9]+$"
                  />
                </div>
              </>
            )}

            {/* Number validation */}
            {showNumberValidation && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Value
                  </label>
                  <input
                    type="number"
                    {...register(`parameters.${index}.minimum`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Value
                  </label>
                  <input
                    type="number"
                    {...register(`parameters.${index}.maximum`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Enum values */}
          {showEnumValidation && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowed Values (comma-separated)
              </label>
              <input
                {...register(`parameters.${index}.enumValues`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="value1, value2, value3"
                onChange={(e) => {
                  const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                  onUpdate(index, 'enumValues', values.length > 0 ? values : undefined);
                }}
              />
            </div>
          )}

          {/* Example */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Example Value
            </label>
            <input
              {...register(`parameters.${index}.example`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Example value for documentation"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Parameter Builder Component
const ParameterBuilder: React.FC<ParameterBuilderProps> = ({
  initialParameters = [],
  onParametersChange,
  onValidationChange,
  maxParameters = 50,
  allowedTypes = ['path', 'query', 'header', 'body', 'formData'],
  className = ''
}) => {
  const [nextId, setNextId] = useState(1);

  const form = useForm<ParametersFormData>({
    resolver: zodResolver(parametersFormSchema),
    defaultValues: {
      parameters: initialParameters.length > 0 ? initialParameters : []
    },
    mode: 'onChange' // Real-time validation
  });

  const { control, register, handleSubmit, formState: { errors, isValid }, watch, setValue } = form;

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'parameters'
  });

  const watchedParameters = watch('parameters');

  // Debounced validation and change notification (under 100ms)
  const debouncedOnChange = useMemo(
    () => debounce((parameters: Parameter[], isFormValid: boolean, formErrors: any) => {
      onParametersChange?.(parameters);
      onValidationChange?.(isFormValid, formErrors);
    }, 50),
    [onParametersChange, onValidationChange]
  );

  // Real-time parameter updates
  useEffect(() => {
    if (watchedParameters && Array.isArray(watchedParameters)) {
      const validParameters = watchedParameters.filter(p => p && p.id);
      debouncedOnChange(validParameters, isValid, errors);
    }
  }, [watchedParameters, isValid, errors, debouncedOnChange]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add new parameter
  const addParameter = useCallback(() => {
    if (fields.length >= maxParameters) {
      return;
    }

    const newParameter: Parameter = {
      id: `param-${nextId}`,
      name: '',
      type: 'query',
      dataType: 'string',
      required: false,
      order: fields.length
    };

    append(newParameter);
    setNextId(prev => prev + 1);
  }, [fields.length, maxParameters, nextId, append]);

  // Update parameter field
  const updateParameter = useCallback((index: number, field: keyof Parameter, value: any) => {
    setValue(`parameters.${index}.${field}`, value, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  }, [setValue]);

  // Remove parameter
  const removeParameter = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id);
      const newIndex = fields.findIndex(field => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
        
        // Update order values
        const reorderedParameters = arrayMove(watchedParameters, oldIndex, newIndex);
        reorderedParameters.forEach((param, index) => {
          setValue(`parameters.${index}.order`, index, { shouldValidate: true });
        });
      }
    }
  }, [fields, move, watchedParameters, setValue]);

  // Virtual scrolling for large parameter lists
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: fields.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated height per parameter row
    overscan: 5
  });

  const items = virtualizer.getVirtualItems();

  // Parameter type distribution for UI insights
  const parameterTypeStats = useMemo(() => {
    const stats = watchedParameters.reduce((acc, param) => {
      if (param?.type) {
        acc[param.type] = (acc[param.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<ParameterType, number>);
    return stats;
  }, [watchedParameters]);

  return (
    <div className={`parameter-builder ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Parameters</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure endpoint parameters with validation rules and documentation.
            {fields.length > 0 && ` ${fields.length} parameter${fields.length !== 1 ? 's' : ''} defined.`}
          </p>
        </div>
        
        <button
          type="button"
          onClick={addParameter}
          disabled={fields.length >= maxParameters}
          className={`
            px-4 py-2 rounded-md font-medium transition-colors
            ${fields.length >= maxParameters
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }
          `}
        >
          Add Parameter
        </button>
      </div>

      {/* Parameter type statistics */}
      {fields.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Parameter Distribution</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(parameterTypeStats).map(([type, count]) => (
              <span 
                key={type}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parameters List */}
      {fields.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No parameters defined</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first API parameter.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={addParameter}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Parameter
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
            {/* Virtual scrolling container for large lists */}
            {fields.length > 10 ? (
              <div 
                ref={parentRef}
                className="h-96 overflow-auto"
                style={{ contain: 'strict' }}
              >
                <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                  {items.map((virtualItem) => {
                    const field = fields[virtualItem.index];
                    if (!field) return null;

                    return (
                      <div
                        key={field.id}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <SortableParameterRow
                          parameter={field}
                          index={virtualItem.index}
                          onUpdate={updateParameter}
                          onRemove={removeParameter}
                          errors={errors}
                          register={register}
                          control={control}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                {fields.map((field, index) => (
                  <SortableParameterRow
                    key={field.id}
                    parameter={field}
                    index={index}
                    onUpdate={updateParameter}
                    onRemove={removeParameter}
                    errors={errors}
                    register={register}
                    control={control}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      )}

      {/* Form validation summary */}
      {Object.keys(errors).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                {Array.isArray(error) 
                  ? error.map((e, i) => e && <div key={i}>Parameter {i + 1}: {Object.values(e).join(', ')}</div>)
                  : String(error.message || error)
                }
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick actions */}
      {fields.length > 0 && (
        <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
          <span>
            {fields.length} of {maxParameters} parameters used
          </span>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => {
                // Clear all parameters
                while (fields.length > 0) {
                  remove(0);
                }
              }}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParameterBuilder;