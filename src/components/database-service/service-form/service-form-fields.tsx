'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  Control,
  FieldPath,
  FieldValues,
  useController,
  useFieldArray,
  useWatch
} from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Plus,
  Trash2,
  Info,
  Upload,
  Eye,
  EyeOff,
  Search,
  ChevronDown
} from 'lucide-react';

// Types for field configuration
export interface ConfigSchema {
  name: string;
  label: string;
  type: FieldType;
  description?: string;
  alias: string;
  default?: any;
  required?: boolean;
  allowNull?: boolean;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  validation?: any;
  // Array and object specific
  items?: Array<ConfigSchema> | 'string';
  object?: {
    key: { label: string; type: string };
    value: { label: string; type: string };
  };
  // Picklist specific
  values?: Array<{ name: string; label: string; description?: string }>;
  // File specific
  allowedExtensions?: string[];
  maxFileSize?: number;
  // Conditional logic
  conditionalLogic?: ConditionalRule[];
  // UI specific
  columns?: number;
  legend?: string;
  showLabel?: boolean;
  placeholder?: string;
  hint?: string;
}

export type FieldType = 
  | 'string'
  | 'text'
  | 'integer'
  | 'password'
  | 'boolean'
  | 'object'
  | 'array'
  | 'picklist'
  | 'multi_picklist'
  | 'file_certificate'
  | 'file_certificate_api'
  | 'verb_mask'
  | 'event_picklist'
  | 'json'
  | 'code'
  | 'url'
  | 'email'
  | 'tel'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'color'
  | 'range'
  | 'search';

export interface ConditionalRule {
  conditions: Condition[];
  operator: 'AND' | 'OR';
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional';
}

export interface Condition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
  value: any;
}

export interface ServiceFormFieldsProps {
  schema: ConfigSchema[];
  control: Control<FieldValues>;
  errors?: Record<string, any>;
  disabled?: boolean;
  className?: string;
  serviceType?: string;
  eventList?: string[];
  onFieldChange?: (fieldName: string, value: any) => void;
}

// Zod schema for field validation
const createFieldSchema = (schema: ConfigSchema): z.ZodSchema<any> => {
  let fieldSchema: z.ZodSchema<any>;

  switch (schema.type) {
    case 'string':
    case 'text':
    case 'password':
    case 'url':
    case 'email':
    case 'tel':
    case 'search':
      fieldSchema = z.string();
      break;
    case 'integer':
      fieldSchema = z.number().or(z.string().transform(val => Number(val)));
      break;
    case 'boolean':
      fieldSchema = z.boolean();
      break;
    case 'picklist':
      fieldSchema = z.string();
      break;
    case 'multi_picklist':
      fieldSchema = z.array(z.string());
      break;
    case 'array':
      if (schema.items === 'string') {
        fieldSchema = z.array(z.string());
      } else {
        fieldSchema = z.array(z.any());
      }
      break;
    case 'object':
      fieldSchema = z.record(z.any());
      break;
    case 'file_certificate':
    case 'file_certificate_api':
      fieldSchema = z.any(); // File objects
      break;
    case 'date':
    case 'datetime-local':
    case 'time':
      fieldSchema = z.string();
      break;
    case 'color':
      fieldSchema = z.string().regex(/^#[0-9A-F]{6}$/i);
      break;
    case 'range':
      fieldSchema = z.number();
      break;
    case 'json':
    case 'code':
      fieldSchema = z.string();
      break;
    default:
      fieldSchema = z.any();
  }

  if (schema.required && !schema.allowNull) {
    fieldSchema = fieldSchema.refine(val => val !== null && val !== undefined && val !== '', {
      message: `${schema.label} is required`
    });
  } else {
    fieldSchema = fieldSchema.optional().nullable();
  }

  return fieldSchema;
};

// Password visibility hook
const usePasswordVisibility = () => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = useCallback(() => setIsVisible(prev => !prev), []);
  return { isVisible, toggleVisibility };
};

// File selector component
const FileSelector: React.FC<{
  value?: File | string | null;
  onChange: (value: File | string | null) => void;
  allowedExtensions?: string[];
  label: string;
  description?: string;
  disabled?: boolean;
}> = ({ value, onChange, allowedExtensions, label, description, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  useEffect(() => {
    if (value instanceof File) {
      setSelectedFileName(value.name);
    } else if (typeof value === 'string') {
      setSelectedFileName(value.split('/').pop() || value);
    } else {
      setSelectedFileName('');
    }
  }, [value]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (allowedExtensions && allowedExtensions.length > 0) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(extension)) {
          return;
        }
      }
      onChange(file);
    }
  }, [onChange, allowedExtensions, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onChange(files[0]);
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive && "border-primary bg-primary/10",
          !dragActive && "border-gray-300 dark:border-gray-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {selectedFileName || 'Choose a file or drag and drop'}
          </p>
          {allowedExtensions && (
            <p className="text-xs text-gray-500">
              Supported formats: {allowedExtensions.join(', ')}
            </p>
          )}
          <input
            type="file"
            className="hidden"
            id={`file-input-${label}`}
            onChange={handleFileInput}
            accept={allowedExtensions?.join(',')}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-input-${label}`)?.click()}
            disabled={disabled}
          >
            Select File
          </Button>
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

// Array field component
const ArrayFieldRenderer: React.FC<{
  schema: ConfigSchema;
  control: Control<FieldValues>;
  fieldPath: FieldPath<FieldValues>;
  disabled?: boolean;
}> = ({ schema, control, fieldPath, disabled }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldPath,
  });

  const isStringArray = schema.items === 'string';
  const itemSchemas = isStringArray ? null : (schema.items as ConfigSchema[]);

  const addNewItem = useCallback(() => {
    if (isStringArray) {
      append('');
    } else {
      const newItem: Record<string, any> = {};
      itemSchemas?.forEach(itemSchema => {
        newItem[itemSchema.name] = itemSchema.default || '';
      });
      append(newItem);
    }
  }, [append, isStringArray, itemSchemas]);

  if (isStringArray) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">{schema.label}</CardTitle>
              {schema.description && (
                <Info className="h-4 w-4 text-gray-400" title={schema.description} />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addNewItem}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={control}
                  name={`${fieldPath}.${index}` as FieldPath<FieldValues>}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={schema.placeholder || `${schema.label} ${index + 1}`}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No items added yet. Click "Add" to create your first entry.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{schema.label}</CardTitle>
            {schema.description && (
              <Info className="h-4 w-4 text-gray-400" title={schema.description} />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNewItem}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {fields.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {itemSchemas?.map(itemSchema => (
                  <TableHead key={itemSchema.name}>{itemSchema.label}</TableHead>
                ))}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  {itemSchemas?.map(itemSchema => (
                    <TableCell key={itemSchema.name}>
                      <ServiceFormField
                        schema={itemSchema}
                        control={control}
                        fieldPath={`${fieldPath}.${index}.${itemSchema.name}` as FieldPath<FieldValues>}
                        disabled={disabled}
                        showLabel={false}
                        compact
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {fields.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No items added yet. Click "Add" to create your first entry.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Object field component (key-value pairs)
const ObjectFieldRenderer: React.FC<{
  schema: ConfigSchema;
  control: Control<FieldValues>;
  fieldPath: FieldPath<FieldValues>;
  disabled?: boolean;
}> = ({ schema, control, fieldPath, disabled }) => {
  const watchedValue = useWatch({ control, name: fieldPath }) || {};
  
  const entries = Object.entries(watchedValue);

  const { field } = useController({
    control,
    name: fieldPath,
  });

  const addNewEntry = useCallback(() => {
    const newKey = `key_${Date.now()}`;
    const newValue = schema.object?.value.type === 'integer' ? 0 : '';
    field.onChange({
      ...field.value,
      [newKey]: newValue
    });
  }, [field, schema]);

  const removeEntry = useCallback((keyToRemove: string) => {
    const newValue = { ...field.value };
    delete newValue[keyToRemove];
    field.onChange(newValue);
  }, [field]);

  const updateEntry = useCallback((oldKey: string, newKey: string, newValue: any) => {
    const updated = { ...field.value };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    updated[newKey] = newValue;
    field.onChange(updated);
  }, [field]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{schema.label}</CardTitle>
            {schema.description && (
              <Info className="h-4 w-4 text-gray-400" title={schema.description} />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNewEntry}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{schema.object?.key.label || 'Key'}</TableHead>
                <TableHead>{schema.object?.value.label || 'Value'}</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(([key, value], index) => (
                <TableRow key={`${key}-${index}`}>
                  <TableCell>
                    <Input
                      value={key}
                      onChange={(e) => updateEntry(key, e.target.value, value)}
                      placeholder="Key"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={value as string}
                      onChange={(e) => updateEntry(key, key, e.target.value)}
                      placeholder="Value"
                      type={schema.object?.value.type === 'integer' ? 'number' : 'text'}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(key)}
                      disabled={disabled}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {entries.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No entries added yet. Click "Add" to create your first key-value pair.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Event picklist with autocomplete
const EventPicklistField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  eventList?: string[];
  placeholder?: string;
  disabled?: boolean;
}> = ({ value, onChange, eventList = [], placeholder, disabled }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    if (!searchTerm || !eventList) return eventList;
    return eventList.filter(event =>
      event.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [eventList, searchTerm]);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  return (
    <div className="relative">
      <Input
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-8"
      />
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      
      {isOpen && filteredEvents.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredEvents.map((event, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              onClick={() => {
                onChange(event);
                setSearchTerm(event);
                setIsOpen(false);
              }}
            >
              {event}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Individual field renderer
const ServiceFormField: React.FC<{
  schema: ConfigSchema;
  control: Control<FieldValues>;
  fieldPath: FieldPath<FieldValues>;
  disabled?: boolean;
  showLabel?: boolean;
  compact?: boolean;
  eventList?: string[];
}> = ({ 
  schema, 
  control, 
  fieldPath, 
  disabled = false, 
  showLabel = true, 
  compact = false,
  eventList 
}) => {
  const { isVisible, toggleVisibility } = usePasswordVisibility();

  // Check conditional logic
  const watchedValues = useWatch({ control });
  const shouldShow = useMemo(() => {
    if (!schema.conditionalLogic) return true;

    return schema.conditionalLogic.every(rule => {
      const conditionResults = rule.conditions.map(condition => {
        const fieldValue = watchedValues[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            return fieldValue === condition.value;
          case 'notEquals':
            return fieldValue !== condition.value;
          case 'contains':
            return String(fieldValue).includes(String(condition.value));
          case 'notContains':
            return !String(fieldValue).includes(String(condition.value));
          case 'isEmpty':
            return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);
          case 'isNotEmpty':
            return fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);
          default:
            return true;
        }
      });

      return rule.operator === 'AND' 
        ? conditionResults.every(Boolean)
        : conditionResults.some(Boolean);
    });
  }, [schema.conditionalLogic, watchedValues]);

  if (!shouldShow) {
    return null;
  }

  // Handle array and object types
  if (schema.type === 'array') {
    return (
      <div className={cn("space-y-2", compact && "space-y-1")}>
        <ArrayFieldRenderer
          schema={schema}
          control={control}
          fieldPath={fieldPath}
          disabled={disabled}
        />
      </div>
    );
  }

  if (schema.type === 'object') {
    return (
      <div className={cn("space-y-2", compact && "space-y-1")}>
        <ObjectFieldRenderer
          schema={schema}
          control={control}
          fieldPath={fieldPath}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <FormField
      control={control}
      name={fieldPath}
      render={({ field, fieldState }) => (
        <FormItem className={cn("space-y-2", compact && "space-y-1")}>
          {showLabel && (
            <FormLabel className={cn(
              "text-sm font-medium",
              schema.required && "after:content-['*'] after:ml-0.5 after:text-red-500",
              compact && "text-xs"
            )}>
              {schema.label}
              {schema.description && !compact && (
                <Info className="inline-block ml-1 h-3 w-3 text-gray-400" title={schema.description} />
              )}
            </FormLabel>
          )}
          
          <FormControl>
            {/* Text inputs */}
            {['string', 'text', 'url', 'email', 'tel', 'search'].includes(schema.type) && (
              <Input
                {...field}
                type={schema.type === 'string' ? 'text' : schema.type}
                placeholder={schema.placeholder || `Enter ${schema.label.toLowerCase()}`}
                disabled={disabled}
                className={cn(compact && "h-8 text-xs")}
              />
            )}

            {/* Password input */}
            {schema.type === 'password' && (
              <div className="relative">
                <Input
                  {...field}
                  type={isVisible ? 'text' : 'password'}
                  placeholder={schema.placeholder || 'Enter password'}
                  disabled={disabled}
                  className={cn("pr-10", compact && "h-8 text-xs")}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={toggleVisibility}
                  disabled={disabled}
                >
                  {isVisible ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            )}

            {/* Textarea */}
            {schema.type === 'text' && schema.columns && schema.columns > 1 && (
              <Textarea
                {...field}
                placeholder={schema.placeholder || `Enter ${schema.label.toLowerCase()}`}
                disabled={disabled}
                rows={schema.columns}
                className={cn(compact && "text-xs")}
              />
            )}

            {/* Number input */}
            {schema.type === 'integer' && (
              <Input
                {...field}
                type="number"
                placeholder={schema.placeholder || '0'}
                disabled={disabled}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
                className={cn(compact && "h-8 text-xs")}
              />
            )}

            {/* Boolean/Switch */}
            {schema.type === 'boolean' && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
                {!showLabel && (
                  <span className={cn("text-sm", compact && "text-xs")}>{schema.label}</span>
                )}
              </div>
            )}

            {/* Select dropdown */}
            {schema.type === 'picklist' && (
              <Select
                value={field.value || ''}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger className={cn(compact && "h-8 text-xs")}>
                  <SelectValue placeholder={`Select ${schema.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {schema.values?.map((option) => (
                    <SelectItem key={option.name} value={option.name}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-gray-500">{option.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Multi-select */}
            {schema.type === 'multi_picklist' && (
              <div className="space-y-2">
                {schema.values?.map((option) => (
                  <div key={option.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${fieldPath}-${option.name}`}
                      checked={(field.value || []).includes(option.name)}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || [];
                        if (checked) {
                          field.onChange([...currentValue, option.name]);
                        } else {
                          field.onChange(currentValue.filter((val: string) => val !== option.name));
                        }
                      }}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`${fieldPath}-${option.name}`}
                      className={cn("text-sm font-medium", compact && "text-xs")}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* File upload */}
            {['file_certificate', 'file_certificate_api'].includes(schema.type) && (
              <FileSelector
                value={field.value}
                onChange={field.onChange}
                allowedExtensions={schema.allowedExtensions}
                label={schema.label}
                description={schema.description}
                disabled={disabled}
              />
            )}

            {/* Event picklist with autocomplete */}
            {schema.type === 'event_picklist' && (
              <EventPicklistField
                value={field.value || ''}
                onChange={field.onChange}
                eventList={eventList}
                placeholder={schema.placeholder || 'Search events...'}
                disabled={disabled}
              />
            )}

            {/* Date/time inputs */}
            {['date', 'datetime-local', 'time'].includes(schema.type) && (
              <Input
                {...field}
                type={schema.type}
                disabled={disabled}
                className={cn(compact && "h-8 text-xs")}
              />
            )}

            {/* Color picker */}
            {schema.type === 'color' && (
              <div className="flex items-center space-x-2">
                <Input
                  {...field}
                  type="color"
                  disabled={disabled}
                  className="w-16 h-10 p-1 border rounded"
                />
                <Input
                  value={field.value || '#000000'}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder="#000000"
                  disabled={disabled}
                  className={cn("flex-1", compact && "h-8 text-xs")}
                />
              </div>
            )}

            {/* Range slider */}
            {schema.type === 'range' && (
              <div className="space-y-2">
                <Input
                  {...field}
                  type="range"
                  disabled={disabled}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-500">
                  {field.value || 0}
                </div>
              </div>
            )}

            {/* JSON/Code editor */}
            {['json', 'code'].includes(schema.type) && (
              <Textarea
                {...field}
                placeholder={schema.type === 'json' ? '{}' : 'Enter code...'}
                disabled={disabled}
                rows={6}
                className={cn("font-mono", compact && "text-xs")}
              />
            )}
          </FormControl>

          {schema.description && showLabel && !compact && (
            <FormDescription className="text-xs text-gray-500">
              {schema.description}
            </FormDescription>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Main component
export const ServiceFormFields: React.FC<ServiceFormFieldsProps> = ({
  schema,
  control,
  errors,
  disabled = false,
  className,
  serviceType,
  eventList,
  onFieldChange
}) => {
  // Filter and sort fields based on service type and conditional logic
  const visibleFields = useMemo(() => {
    return schema.filter(field => {
      // Basic service type filtering could be added here
      // For now, return all fields
      return true;
    });
  }, [schema, serviceType]);

  // Group fields by sections if needed
  const fieldGroups = useMemo(() => {
    const groups: { [key: string]: ConfigSchema[] } = {};
    
    visibleFields.forEach(field => {
      const group = field.legend || 'General';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(field);
    });

    return groups;
  }, [visibleFields]);

  // Handle field change callback
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (onFieldChange) {
      onFieldChange(fieldName, value);
    }
  }, [onFieldChange]);

  if (visibleFields.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No configuration fields are available for this service type.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {Object.entries(fieldGroups).map(([groupName, fields]) => (
        <div key={groupName} className="space-y-4">
          {groupName !== 'General' && (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{groupName}</h3>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          )}
          
          <div className="grid gap-4 md:gap-6">
            {fields.map((field) => (
              <ServiceFormField
                key={field.name}
                schema={field}
                control={control}
                fieldPath={field.name as FieldPath<FieldValues>}
                disabled={disabled}
                eventList={eventList}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceFormFields;