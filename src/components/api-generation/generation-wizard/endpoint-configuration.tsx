'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Types and interfaces for endpoint configuration
interface EndpointParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface EndpointMethodConfig {
  enabled: boolean;
  parameters: EndpointParameter[];
  requiresAuth: boolean;
  customHeaders: { key: string; value: string }[];
}

interface EndpointConfiguration {
  tableName: string;
  endpointPath: string;
  methods: {
    GET: EndpointMethodConfig;
    POST: EndpointMethodConfig;
    PUT: EndpointMethodConfig;
    PATCH: EndpointMethodConfig;
    DELETE: EndpointMethodConfig;
  };
  pagination: {
    enabled: boolean;
    defaultLimit: number;
    maxLimit: number;
  };
  filtering: {
    enabled: boolean;
    allowedFields: string[];
  };
  sorting: {
    enabled: boolean;
    defaultSort: string;
    allowedFields: string[];
  };
}

// Zod validation schema for endpoint configuration
const endpointParameterSchema = z.object({
  id: z.string().min(1, 'Parameter ID is required'),
  name: z.string().min(1, 'Parameter name is required'),
  type: z.enum(['string', 'number', 'boolean', 'array']),
  required: z.boolean(),
  description: z.string().min(1, 'Parameter description is required'),
  defaultValue: z.string().optional(),
});

const endpointMethodConfigSchema = z.object({
  enabled: z.boolean(),
  parameters: z.array(endpointParameterSchema),
  requiresAuth: z.boolean(),
  customHeaders: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
});

const endpointConfigurationSchema = z.object({
  tableName: z.string().min(1, 'Table name is required'),
  endpointPath: z.string().min(1, 'Endpoint path is required').regex(/^\/[a-zA-Z0-9_\-\/]*$/, 'Invalid endpoint path format'),
  methods: z.object({
    GET: endpointMethodConfigSchema,
    POST: endpointMethodConfigSchema,
    PUT: endpointMethodConfigSchema,
    PATCH: endpointMethodConfigSchema,
    DELETE: endpointMethodConfigSchema,
  }),
  pagination: z.object({
    enabled: z.boolean(),
    defaultLimit: z.number().min(1).max(1000),
    maxLimit: z.number().min(1).max(1000),
  }),
  filtering: z.object({
    enabled: z.boolean(),
    allowedFields: z.array(z.string()),
  }),
  sorting: z.object({
    enabled: z.boolean(),
    defaultSort: z.string(),
    allowedFields: z.array(z.string()),
  }),
});

interface EndpointConfigurationProps {
  selectedTables: string[];
  onConfigurationChange: (configuration: EndpointConfiguration) => void;
  onNext: () => void;
  onPrevious: () => void;
  initialConfiguration?: Partial<EndpointConfiguration>;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function EndpointConfiguration({
  selectedTables,
  onConfigurationChange,
  onNext,
  onPrevious,
  initialConfiguration,
}: EndpointConfigurationProps) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Initialize form with default values
  const defaultValues: EndpointConfiguration = {
    tableName: selectedTables[0] || '',
    endpointPath: selectedTables[0] ? `/${selectedTables[0].toLowerCase()}` : '/',
    methods: {
      GET: {
        enabled: true,
        parameters: [
          {
            id: 'limit',
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Maximum number of records to return',
            defaultValue: '25',
          },
          {
            id: 'offset',
            name: 'offset',
            type: 'number',
            required: false,
            description: 'Number of records to skip',
            defaultValue: '0',
          },
          {
            id: 'filter',
            name: 'filter',
            type: 'string',
            required: false,
            description: 'SQL WHERE clause filter',
          },
          {
            id: 'order',
            name: 'order',
            type: 'string',
            required: false,
            description: 'SQL ORDER BY clause',
          },
        ],
        requiresAuth: true,
        customHeaders: [],
      },
      POST: {
        enabled: true,
        parameters: [],
        requiresAuth: true,
        customHeaders: [],
      },
      PUT: {
        enabled: true,
        parameters: [
          {
            id: 'id',
            name: 'id',
            type: 'number',
            required: true,
            description: 'Record ID for update',
          },
        ],
        requiresAuth: true,
        customHeaders: [],
      },
      PATCH: {
        enabled: true,
        parameters: [
          {
            id: 'id',
            name: 'id',
            type: 'number',
            required: true,
            description: 'Record ID for partial update',
          },
        ],
        requiresAuth: true,
        customHeaders: [],
      },
      DELETE: {
        enabled: true,
        parameters: [
          {
            id: 'id',
            name: 'id',
            type: 'number',
            required: true,
            description: 'Record ID for deletion',
          },
        ],
        requiresAuth: true,
        customHeaders: [],
      },
    },
    pagination: {
      enabled: true,
      defaultLimit: 25,
      maxLimit: 1000,
    },
    filtering: {
      enabled: true,
      allowedFields: [],
    },
    sorting: {
      enabled: true,
      defaultSort: 'id ASC',
      allowedFields: [],
    },
    ...initialConfiguration,
  };

  const form = useForm<EndpointConfiguration>({
    resolver: zodResolver(endpointConfigurationSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, watch, handleSubmit, formState: { errors, isValid } } = form;

  // Watch for form changes to trigger real-time preview
  const formData = watch();

  // Generate real-time preview
  useEffect(() => {
    const generatePreview = async () => {
      if (!isValid) return;

      setPreviewLoading(true);
      setPreviewError(null);

      try {
        // Call Next.js API route for OpenAPI spec generation
        const response = await fetch('/api/generation/preview-endpoint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`Preview generation failed: ${response.statusText}`);
        }

        const previewResult = await response.json();
        setPreviewData(previewResult);
        
        // Notify parent component of configuration changes
        onConfigurationChange(formData);
      } catch (error) {
        console.error('Preview generation error:', error);
        setPreviewError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setPreviewLoading(false);
      }
    };

    // Debounce preview generation to avoid excessive API calls
    const timeoutId = setTimeout(generatePreview, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, isValid, onConfigurationChange]);

  const onSubmit = (data: EndpointConfiguration) => {
    onConfigurationChange(data);
    onNext();
  };

  const addParameter = (method: string) => {
    const newParameter: EndpointParameter = {
      id: `param_${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
      description: '',
    };

    const currentParams = form.getValues(`methods.${method}.parameters` as any) || [];
    form.setValue(`methods.${method}.parameters` as any, [...currentParams, newParameter]);
  };

  const removeParameter = (method: string, index: number) => {
    const currentParams = form.getValues(`methods.${method}.parameters` as any) || [];
    const updatedParams = currentParams.filter((_: any, i: number) => i !== index);
    form.setValue(`methods.${method}.parameters` as any, updatedParams);
  };

  const addCustomHeader = (method: string) => {
    const newHeader = { key: '', value: '' };
    const currentHeaders = form.getValues(`methods.${method}.customHeaders` as any) || [];
    form.setValue(`methods.${method}.customHeaders` as any, [...currentHeaders, newHeader]);
  };

  const removeCustomHeader = (method: string, index: number) => {
    const currentHeaders = form.getValues(`methods.${method}.customHeaders` as any) || [];
    const updatedHeaders = currentHeaders.filter((_: any, i: number) => i !== index);
    form.setValue(`methods.${method}.customHeaders` as any, updatedHeaders);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configure API Endpoints
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Configure HTTP methods, parameters, and security rules for your REST API endpoints.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Basic Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Table Name
              </label>
              <select
                {...form.register('tableName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {selectedTables.map((table) => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
              {errors.tableName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.tableName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Endpoint Path
              </label>
              <input
                type="text"
                {...form.register('endpointPath')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="/table-name"
              />
              {errors.endpointPath && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.endpointPath.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* HTTP Methods Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            HTTP Methods
          </h3>
          
          {HTTP_METHODS.map((method) => (
            <div key={method} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    {...form.register(`methods.${method}.enabled`)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {method}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {method === 'GET' ? 'Read' : method === 'POST' ? 'Create' : method === 'PUT' ? 'Update' : method === 'PATCH' ? 'Partial Update' : 'Delete'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    Requires Auth
                  </label>
                  <input
                    type="checkbox"
                    {...form.register(`methods.${method}.requiresAuth`)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              {formData.methods[method].enabled && (
                <div className="space-y-4">
                  {/* Parameters */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Parameters
                      </label>
                      <button
                        type="button"
                        onClick={() => addParameter(method)}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Add Parameter
                      </button>
                    </div>
                    
                    {formData.methods[method].parameters.map((param, index) => (
                      <div key={param.id} className="grid grid-cols-12 gap-2 items-center mb-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            {...form.register(`methods.${method}.parameters.${index}.name`)}
                            placeholder="Name"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            {...form.register(`methods.${method}.parameters.${index}.type`)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                          </select>
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            {...form.register(`methods.${method}.parameters.${index}.description`)}
                            placeholder="Description"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            {...form.register(`methods.${method}.parameters.${index}.defaultValue`)}
                            placeholder="Default"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            {...form.register(`methods.${method}.parameters.${index}.required`)}
                            className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            title="Required"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeParameter(method, index)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Headers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custom Headers
                      </label>
                      <button
                        type="button"
                        onClick={() => addCustomHeader(method)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Add Header
                      </button>
                    </div>
                    
                    {formData.methods[method].customHeaders.map((header, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 items-center mb-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            {...form.register(`methods.${method}.customHeaders.${index}.key`)}
                            placeholder="Header Name"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            {...form.register(`methods.${method}.customHeaders.${index}.value`)}
                            placeholder="Header Value"
                            className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeCustomHeader(method, index)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pagination Settings
          </h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="checkbox"
              {...form.register('pagination.enabled')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable pagination
            </span>
          </div>

          {formData.pagination.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Limit
                </label>
                <input
                  type="number"
                  {...form.register('pagination.defaultLimit', { valueAsNumber: true })}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.pagination?.defaultLimit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.pagination.defaultLimit.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Limit
                </label>
                <input
                  type="number"
                  {...form.register('pagination.maxLimit', { valueAsNumber: true })}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.pagination?.maxLimit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.pagination.maxLimit.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filtering Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtering Settings
          </h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="checkbox"
              {...form.register('filtering.enabled')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable filtering
            </span>
          </div>

          {formData.filtering.enabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Allowed Filter Fields (comma-separated)
              </label>
              <input
                type="text"
                placeholder="id, name, email, created_at"
                onChange={(e) => {
                  const fields = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                  form.setValue('filtering.allowedFields', fields);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Sorting Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sorting Settings
          </h3>
          
          <div className="flex items-center space-x-4 mb-4">
            <input
              type="checkbox"
              {...form.register('sorting.enabled')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Enable sorting
            </span>
          </div>

          {formData.sorting.enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Sort
                </label>
                <input
                  type="text"
                  {...form.register('sorting.defaultSort')}
                  placeholder="id ASC"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allowed Sort Fields (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="id, name, created_at"
                  onChange={(e) => {
                    const fields = e.target.value.split(',').map(f => f.trim()).filter(f => f);
                    form.setValue('sorting.allowedFields', fields);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Real-time Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuration Preview
          </h3>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            {previewLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
                  Generating preview...
                </span>
              </div>
            )}
            
            {previewError && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Preview Error: {previewError}
                </p>
              </div>
            )}
            
            {previewData && !previewLoading && !previewError && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenAPI Preview:
                </p>
                <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded p-3 text-xs overflow-x-auto">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          
          <button
            type="submit"
            disabled={!isValid}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Security Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

export default EndpointConfiguration;