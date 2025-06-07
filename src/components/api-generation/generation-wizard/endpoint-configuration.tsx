'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  useWizard, 
  useWizardNavigation, 
  WIZARD_STEPS,
  type EndpointConfiguration,
  type DatabaseTable,
  type HTTPMethod 
} from './wizard-provider';
import {
  HTTPMethod as HTTPMethodEnum,
  ParameterType,
  FilterOperator,
  EndpointConfigurationSchema,
  type EndpointParameter,
  type MethodConfiguration
} from './types';

// UI Components
import { Form, FormField, FormLabel, FormControl, FormError } from '@/components/ui/form';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/toggle';
import { Input, NumberInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

// Utilities
import { cn } from '@/lib/utils';

/**
 * Endpoint Configuration Component for API Generation Wizard
 * 
 * Implements the second step of the API generation workflow where users configure
 * HTTP methods, parameters, security rules, and endpoint settings for selected tables.
 * 
 * Features:
 * - React Hook Form with Zod schema validation for real-time validation under 100ms
 * - HTTP method selection (GET, POST, PUT, PATCH, DELETE) with dynamic form fields  
 * - Parameter configuration for query parameters, filtering, sorting, and pagination
 * - Real-time endpoint preview with Next.js serverless functions
 * - Integration with wizard state management and navigation
 * 
 * Supports F-003: REST API Endpoint Generation per Section 2.1 Feature Catalog
 * with React/Next.js Integration Requirements compliance.
 */

// ============================================================================
// Form Schema and Types
// ============================================================================

const httpMethodOptions = [
  { value: HTTPMethodEnum.GET, label: 'GET - Read data' },
  { value: HTTPMethodEnum.POST, label: 'POST - Create new records' },
  { value: HTTPMethodEnum.PUT, label: 'PUT - Replace entire records' },
  { value: HTTPMethodEnum.PATCH, label: 'PATCH - Update partial records' },
  { value: HTTPMethodEnum.DELETE, label: 'DELETE - Remove records' },
];

const parameterTypeOptions = [
  { value: ParameterType.QUERY, label: 'Query Parameter' },
  { value: ParameterType.PATH, label: 'Path Parameter' },
  { value: ParameterType.HEADER, label: 'Header Parameter' },
];

const filterOperatorOptions = [
  { value: FilterOperator.EQUALS, label: 'Equals (=)' },
  { value: FilterOperator.NOT_EQUALS, label: 'Not Equals (!=)' },
  { value: FilterOperator.CONTAINS, label: 'Contains' },
  { value: FilterOperator.STARTS_WITH, label: 'Starts With' },
  { value: FilterOperator.ENDS_WITH, label: 'Ends With' },
  { value: FilterOperator.GREATER_THAN, label: 'Greater Than (>)' },
  { value: FilterOperator.LESS_THAN, label: 'Less Than (<)' },
  { value: FilterOperator.GREATER_EQUAL, label: 'Greater or Equal (>=)' },
  { value: FilterOperator.LESS_EQUAL, label: 'Less or Equal (<=)' },
  { value: FilterOperator.IN, label: 'In List' },
  { value: FilterOperator.NOT_IN, label: 'Not In List' },
  { value: FilterOperator.IS_NULL, label: 'Is Null' },
  { value: FilterOperator.IS_NOT_NULL, label: 'Is Not Null' },
];

// Form schema for endpoint configuration per table
const endpointConfigFormSchema = z.object({
  tableName: z.string(),
  basePath: z.string().min(1, 'Base path is required'),
  enabledMethods: z.array(z.nativeEnum(HTTPMethodEnum)).min(1, 'At least one HTTP method must be enabled'),
  
  // Global pagination settings
  enablePagination: z.boolean(),
  maxPageSize: z.number().min(1).max(10000),
  defaultPageSize: z.number().min(1).max(1000),
  
  // Global filtering settings
  enableFiltering: z.boolean(),
  enableSorting: z.boolean(),
  
  // Custom parameters
  customParameters: z.array(z.object({
    name: z.string().min(1, 'Parameter name is required'),
    type: z.nativeEnum(ParameterType),
    required: z.boolean(),
    description: z.string().optional(),
    defaultValue: z.string().optional(),
  })),
  
  // Security settings
  requireAuth: z.boolean(),
  allowedRoles: z.array(z.string()),
  
  enabled: z.boolean(),
});

type EndpointConfigFormData = z.infer<typeof endpointConfigFormSchema>;

// ============================================================================
// Component Interface
// ============================================================================

interface EndpointConfigurationProps {
  className?: string;
  'data-testid'?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export const EndpointConfiguration: React.FC<EndpointConfigurationProps> = ({
  className,
  'data-testid': testId = 'endpoint-configuration',
}) => {
  const wizard = useWizard();
  const navigation = useWizardNavigation();
  
  // Get selected tables and their current configurations
  const selectedTables = useMemo(() => 
    Array.from(wizard.selectedTables.values()),
    [wizard.selectedTables]
  );
  
  const currentTableId = useMemo(() => 
    selectedTables[0]?.id || null,
    [selectedTables]
  );
  
  const currentConfiguration = useMemo(() => 
    currentTableId ? wizard.endpointConfigurations.get(currentTableId) : null,
    [wizard.endpointConfigurations, currentTableId]
  );

  // ============================================================================
  // Form Setup
  // ============================================================================

  const form = useForm<EndpointConfigFormData>({
    resolver: zodResolver(endpointConfigFormSchema),
    mode: 'onChange', // Real-time validation under 100ms
    defaultValues: {
      tableName: currentTableId || '',
      basePath: currentTableId ? `/${currentTableId}` : '',
      enabledMethods: [HTTPMethodEnum.GET, HTTPMethodEnum.POST],
      enablePagination: true,
      maxPageSize: 1000,
      defaultPageSize: 100,
      enableFiltering: true,
      enableSorting: true,
      customParameters: [],
      requireAuth: true,
      allowedRoles: [],
      enabled: true,
    },
  });

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isValid, isDirty } } = form;
  
  // Field arrays for dynamic parameters
  const { 
    fields: parameterFields, 
    append: appendParameter, 
    remove: removeParameter 
  } = useFieldArray({
    control,
    name: 'customParameters',
  });

  // Watch for changes to trigger real-time preview
  const watchedValues = watch();
  const enabledMethods = watch('enabledMethods');

  // ============================================================================
  // Effects and Handlers
  // ============================================================================

  // Initialize form with current configuration when table changes
  useEffect(() => {
    if (currentConfiguration && currentTableId) {
      reset({
        tableName: currentTableId,
        basePath: currentConfiguration.basePath || `/${currentTableId}`,
        enabledMethods: currentConfiguration.enabledMethods || [HTTPMethodEnum.GET, HTTPMethodEnum.POST],
        enablePagination: currentConfiguration.enablePagination ?? true,
        maxPageSize: currentConfiguration.maxPageSize || 1000,
        defaultPageSize: currentConfiguration.defaultPageSize || 100,
        enableFiltering: currentConfiguration.enableFiltering ?? true,
        enableSorting: currentConfiguration.enableSorting ?? true,
        customParameters: currentConfiguration.customParameters || [],
        requireAuth: currentConfiguration.security?.requireAuth ?? true,
        allowedRoles: currentConfiguration.security?.requiredRoles || [],
        enabled: currentConfiguration.enabled ?? true,
      });
    }
  }, [currentConfiguration, currentTableId, reset]);

  // Auto-save configuration changes to wizard state
  useEffect(() => {
    if (isDirty && isValid && currentTableId) {
      const values = watchedValues;
      
      // Convert form data to EndpointConfiguration format
      const config: Partial<EndpointConfiguration> = {
        tableName: values.tableName,
        basePath: values.basePath,
        enabledMethods: values.enabledMethods,
        enablePagination: values.enablePagination,
        maxPageSize: values.maxPageSize,
        defaultPageSize: values.defaultPageSize,
        enableFiltering: values.enableFiltering,
        enableSorting: values.enableSorting,
        customParameters: values.customParameters,
        security: {
          requireAuth: values.requireAuth,
          requiredRoles: values.allowedRoles,
          apiKeyPermissions: [],
        },
        enabled: values.enabled,
      };
      
      // Update wizard state with debouncing to prevent excessive updates
      const timeoutId = setTimeout(() => {
        wizard.updateEndpointConfiguration(currentTableId, config);
      }, 150); // Debounce for 150ms to optimize performance
      
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, isValid, currentTableId, wizard]);

  // Handle form submission
  const onSubmit = useCallback(async (data: EndpointConfigFormData) => {
    if (!currentTableId) return;
    
    try {
      // Convert to full EndpointConfiguration
      const configuration: EndpointConfiguration = {
        tableName: data.tableName,
        basePath: data.basePath,
        enabledMethods: data.enabledMethods,
        methodConfigurations: createMethodConfigurations(data),
        security: {
          requireAuth: data.requireAuth,
          requiredRoles: data.allowedRoles,
          apiKeyPermissions: [],
        },
        customParameters: data.customParameters,
        enabled: data.enabled,
        enablePagination: data.enablePagination,
        maxPageSize: data.maxPageSize,
        defaultPageSize: data.defaultPageSize,
        enableFiltering: data.enableFiltering,
        enableSorting: data.enableSorting,
      };
      
      // Update wizard state
      wizard.updateEndpointConfiguration(currentTableId, configuration);
      
      // Mark step as completed
      navigation.markStepCompleted(WIZARD_STEPS.ENDPOINT_CONFIGURATION);
      
      // Move to next step if valid
      if (navigation.canGoNext) {
        navigation.goToNextStep();
      }
    } catch (error) {
      console.error('Failed to save endpoint configuration:', error);
    }
  }, [currentTableId, wizard, navigation]);

  // Helper function to create method configurations
  const createMethodConfigurations = useCallback((data: EndpointConfigFormData): Record<HTTPMethod, MethodConfiguration> => {
    const configs: Record<HTTPMethod, MethodConfiguration> = {} as Record<HTTPMethod, MethodConfiguration>;
    
    // Create configuration for each enabled method
    data.enabledMethods.forEach(method => {
      configs[method] = {
        enabled: true,
        parameters: [
          ...(data.enablePagination && method === HTTPMethodEnum.GET ? [
            {
              name: 'limit',
              type: ParameterType.QUERY,
              dataType: 'integer' as any,
              required: false,
              description: 'Number of records to return',
              defaultValue: data.defaultPageSize,
            },
            {
              name: 'offset',
              type: ParameterType.QUERY,
              dataType: 'integer' as any,
              required: false,
              description: 'Number of records to skip',
              defaultValue: 0,
            }
          ] : []),
          ...(data.enableSorting && method === HTTPMethodEnum.GET ? [
            {
              name: 'order',
              type: ParameterType.QUERY,
              dataType: 'string' as any,
              required: false,
              description: 'Sort order (field ASC/DESC)',
            }
          ] : []),
          ...(data.enableFiltering && method === HTTPMethodEnum.GET ? [
            {
              name: 'filter',
              type: ParameterType.QUERY,
              dataType: 'string' as any,
              required: false,
              description: 'Filter expression',
            }
          ] : []),
          ...data.customParameters,
        ],
        responseSchema: {
          includedFields: [],
          excludedFields: [],
          includeMetadata: true,
          formatOptions: {
            includeNulls: true,
            flattenNested: false,
            fieldTransforms: {},
          },
        },
        description: `${method} operation for ${data.tableName}`,
        tags: [data.tableName],
      };
    });
    
    // Fill in configurations for disabled methods
    Object.values(HTTPMethodEnum).forEach(method => {
      if (!configs[method]) {
        configs[method] = {
          enabled: false,
          parameters: [],
          responseSchema: {
            includedFields: [],
            excludedFields: [],
            includeMetadata: false,
            formatOptions: {
              includeNulls: false,
              flattenNested: false,
              fieldTransforms: {},
            },
          },
          tags: [],
        };
      }
    });
    
    return configs;
  }, []);

  // Handle adding new parameter
  const handleAddParameter = useCallback(() => {
    appendParameter({
      name: '',
      type: ParameterType.QUERY,
      required: false,
      description: '',
      defaultValue: '',
    });
  }, [appendParameter]);

  // Handle applying global configuration to all tables
  const handleApplyToAll = useCallback(() => {
    if (isValid) {
      wizard.applyGlobalConfigToSelected();
    }
  }, [wizard, isValid]);

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderHttpMethodSelector = () => (
    <FormField
      name="enabledMethods"
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FormControl>
          <FormLabel required>HTTP Methods</FormLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {httpMethodOptions.map(option => (
              <label 
                key={option.value}
                className={cn(
                  'flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer transition-colors',
                  'hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500',
                  field.value.includes(option.value) && 'bg-blue-50 border-blue-300'
                )}
              >
                <input
                  type="checkbox"
                  checked={field.value.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      field.onChange([...field.value, option.value]);
                    } else {
                      field.onChange(field.value.filter(method => method !== option.value));
                    }
                  }}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <div className="font-medium text-sm">{option.value}</div>
                  <div className="text-xs text-gray-600">{option.label.split(' - ')[1]}</div>
                </div>
              </label>
            ))}
          </div>
          {error && <FormError>{error.message}</FormError>}
        </FormControl>
      )}
    />
  );

  const renderPaginationSettings = () => (
    <div className="space-y-4">
      <FormField
        name="enablePagination"
        control={control}
        render={({ field }) => (
          <FormControl>
            <div className="flex items-center space-x-3">
              <Switch
                checked={field.value}
                onChange={field.onChange}
                id="enable-pagination"
              />
              <FormLabel htmlFor="enable-pagination">Enable Pagination</FormLabel>
            </div>
          </FormControl>
        )}
      />
      
      {watch('enablePagination') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6">
          <FormField
            name="defaultPageSize"
            control={control}
            render={({ field }) => (
              <FormControl>
                <FormLabel>Default Page Size</FormLabel>
                <NumberInput
                  {...field}
                  min={1}
                  max={1000}
                  placeholder="100"
                />
              </FormControl>
            )}
          />
          
          <FormField
            name="maxPageSize"
            control={control}
            render={({ field }) => (
              <FormControl>
                <FormLabel>Maximum Page Size</FormLabel>
                <NumberInput
                  {...field}
                  min={1}
                  max={10000}
                  placeholder="1000"
                />
              </FormControl>
            )}
          />
        </div>
      )}
    </div>
  );

  const renderFilteringSettings = () => (
    <div className="space-y-4">
      <FormField
        name="enableFiltering"
        control={control}
        render={({ field }) => (
          <FormControl>
            <div className="flex items-center space-x-3">
              <Switch
                checked={field.value}
                onChange={field.onChange}
                id="enable-filtering"
              />
              <FormLabel htmlFor="enable-filtering">Enable Filtering</FormLabel>
            </div>
          </FormControl>
        )}
      />
      
      <FormField
        name="enableSorting"
        control={control}
        render={({ field }) => (
          <FormControl>
            <div className="flex items-center space-x-3">
              <Switch
                checked={field.value}
                onChange={field.onChange}
                id="enable-sorting"
              />
              <FormLabel htmlFor="enable-sorting">Enable Sorting</FormLabel>
            </div>
          </FormControl>
        )}
      />
    </div>
  );

  const renderCustomParameters = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FormLabel>Custom Parameters</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddParameter}
        >
          Add Parameter
        </Button>
      </div>
      
      {parameterFields.length === 0 ? (
        <div className="text-sm text-gray-500 italic p-4 border border-gray-200 rounded-lg text-center">
          No custom parameters defined. Click "Add Parameter" to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {parameterFields.map((field, index) => (
            <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Parameter {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParameter(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  name={`customParameters.${index}.name`}
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>Name</FormLabel>
                      <Input {...field} placeholder="parameter_name" />
                    </FormControl>
                  )}
                />
                
                <FormField
                  name={`customParameters.${index}.type`}
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        options={parameterTypeOptions}
                      />
                    </FormControl>
                  )}
                />
                
                <FormField
                  name={`customParameters.${index}.required`}
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <div className="flex items-center space-x-2 pt-8">
                        <Switch
                          checked={field.value}
                          onChange={field.onChange}
                          id={`param-required-${index}`}
                        />
                        <FormLabel htmlFor={`param-required-${index}`}>Required</FormLabel>
                      </div>
                    </FormControl>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  name={`customParameters.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Input {...field} placeholder="Parameter description" />
                    </FormControl>
                  )}
                />
                
                <FormField
                  name={`customParameters.${index}.defaultValue`}
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <FormLabel>Default Value</FormLabel>
                      <Input {...field} placeholder="Default value" />
                    </FormControl>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-4">
      <FormField
        name="requireAuth"
        control={control}
        render={({ field }) => (
          <FormControl>
            <div className="flex items-center space-x-3">
              <Switch
                checked={field.value}
                onChange={field.onChange}
                id="require-auth"
              />
              <FormLabel htmlFor="require-auth">Require Authentication</FormLabel>
            </div>
          </FormControl>
        )}
      />
      
      <div className="text-sm text-gray-600">
        Advanced security settings including role-based access control and API key management 
        will be configured in the next step.
      </div>
    </div>
  );

  // ============================================================================
  // Error Handling
  // ============================================================================

  if (selectedTables.length === 0) {
    return (
      <div className={cn('p-6', className)} data-testid={testId}>
        <Alert variant="warning">
          <Alert.Title>No Tables Selected</Alert.Title>
          <Alert.Description>
            Please go back to the table selection step and choose at least one table to configure endpoints for.
          </Alert.Description>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={cn('space-y-6', className)} data-testid={testId}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Endpoint Configuration</h2>
        <p className="mt-2 text-gray-600">
          Configure HTTP methods, parameters, and settings for your API endpoints. 
          These settings will be applied to generate REST APIs for your selected tables.
        </p>
      </div>

      {/* Current Table Indicator */}
      {currentTableId && (
        <Alert variant="info">
          <Alert.Title>Configuring: {currentTableId}</Alert.Title>
          <Alert.Description>
            Settings will be applied to the "{currentTableId}" table. 
            {selectedTables.length > 1 && ` You can apply these settings to all ${selectedTables.length} selected tables using the "Apply to All" button.`}
          </Alert.Description>
        </Alert>
      )}

      {/* Configuration Form */}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Configuration</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                name="basePath"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <FormControl>
                    <FormLabel required>Base Path</FormLabel>
                    <Input 
                      {...field} 
                      placeholder="/table_name"
                      className="font-mono"
                    />
                    {error && <FormError>{error.message}</FormError>}
                  </FormControl>
                )}
              />
              
              <FormField
                name="enabled"
                control={control}
                render={({ field }) => (
                  <FormControl>
                    <div className="flex items-center space-x-3 pt-8">
                      <Switch
                        checked={field.value}
                        onChange={field.onChange}
                        id="endpoint-enabled"
                      />
                      <FormLabel htmlFor="endpoint-enabled">Enable Endpoint</FormLabel>
                    </div>
                  </FormControl>
                )}
              />
            </div>
            
            {renderHttpMethodSelector()}
          </div>

          {/* Parameter Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Parameter Configuration</h3>
            
            {renderPaginationSettings()}
            {renderFilteringSettings()}
            {renderCustomParameters()}
          </div>

          {/* Security Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Security Configuration</h3>
            {renderSecuritySettings()}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={navigation.goToPreviousStep}
                disabled={!navigation.canGoPrevious}
              >
                Previous
              </Button>
              
              {selectedTables.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyToAll}
                  disabled={!isValid}
                >
                  Apply to All Tables
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
              >
                Reset
              </Button>
              
              <Button
                type="submit"
                disabled={!isValid}
                loading={wizard.generationProgress.isGenerating}
              >
                Continue to Security
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Real-time Validation Feedback */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="error">
          <Alert.Title>Configuration Issues</Alert.Title>
          <Alert.Description>
            Please fix the highlighted issues before continuing to the next step.
          </Alert.Description>
        </Alert>
      )}
    </div>
  );
};

export default EndpointConfiguration;