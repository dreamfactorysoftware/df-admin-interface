'use client';

/**
 * Real-time preview panel component for API endpoint configuration
 * Displays generated API endpoint configuration, OpenAPI specification preview,
 * and live endpoint testing interface with Next.js API route integration
 * 
 * Features:
 * - Real-time OpenAPI specification generation with syntax highlighting
 * - Live endpoint testing with sample request/response functionality
 * - Configuration export functionality for OpenAPI specs and endpoint configs
 * - Server-side preview validation via Next.js API routes per Section 5.2
 * 
 * Performance Requirements:
 * - Real-time preview generation via Next.js serverless functions
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Real-time validation under 100ms for configuration changes
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';

// Types and schemas
import {
  type PreviewPanelProps,
  type PreviewPanelState,
  type EndpointConfiguration,
  type OpenAPISpec,
  type PreviewRequest,
  type PreviewResponse,
  type ConfigurationSummary,
  type ExportOptions,
  type GeneratePreviewRequest,
  type GeneratePreviewResponse,
  type TestEndpointRequest,
  type TestEndpointResponse,
  EndpointConfigurationSchema,
  PreviewRequestSchema,
  ExportOptionsSchema,
  DEFAULT_EXPORT_OPTIONS,
} from './types/preview.types';

// API client functions (will be implemented in src/lib/api-client/preview.ts)
const generatePreview = async (request: GeneratePreviewRequest): Promise<GeneratePreviewResponse> => {
  const response = await fetch('/api/preview/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Preview generation failed: ${response.statusText}`);
  }

  return response.json();
};

const testEndpoint = async (request: TestEndpointRequest): Promise<TestEndpointResponse> => {
  const response = await fetch('/api/preview/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Endpoint test failed: ${response.statusText}`);
  }

  return response.json();
};

const exportConfiguration = async (spec: OpenAPISpec, options: ExportOptions): Promise<Blob> => {
  const response = await fetch('/api/preview/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ spec, options }),
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.blob();
};

/**
 * Main preview panel component with tabbed interface
 * Implements real-time preview functionality per Section 5.2 requirements
 */
export default function PreviewPanel({
  configuration,
  onConfigurationChange,
  onExport,
  className = '',
}: PreviewPanelProps) {
  const queryClient = useQueryClient();

  // Component state management with React hooks
  const [state, setState] = useState<PreviewPanelState>({
    activeTab: 'configuration',
    configuration,
    openApiSpec: null,
    testingState: {
      isLoading: false,
      activeRequest: null,
      lastResponse: null,
      error: null,
      requestHistory: [],
    },
    exportOptions: DEFAULT_EXPORT_OPTIONS,
    isGenerating: false,
    lastUpdated: null,
  });

  // Real-time preview generation with React Query
  const { data: previewData, error: previewError, isLoading: isGeneratingPreview } = useQuery({
    queryKey: ['preview', configuration],
    queryFn: () => generatePreview({ 
      configuration: configuration!,
      options: { 
        includeExamples: true, 
        validateSchema: true 
      }
    }),
    enabled: !!configuration,
    staleTime: 30000, // 30 seconds staleness for real-time updates
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Endpoint testing mutation with optimistic updates
  const testMutation = useMutation({
    mutationFn: testEndpoint,
    onMutate: (variables) => {
      setState(prev => ({
        ...prev,
        testingState: {
          ...prev.testingState,
          isLoading: true,
          activeRequest: variables.testRequest,
          error: null,
        }
      }));
    },
    onSuccess: (data, variables) => {
      if (data.success && data.response) {
        setState(prev => ({
          ...prev,
          testingState: {
            ...prev.testingState,
            isLoading: false,
            lastResponse: data.response!,
            requestHistory: [
              {
                request: variables.testRequest,
                response: data.response!,
                timestamp: new Date().toISOString(),
              },
              ...prev.testingState.requestHistory.slice(0, 9), // Keep last 10 requests
            ],
          }
        }));
        toast.success('Endpoint test completed successfully');
      } else {
        setState(prev => ({
          ...prev,
          testingState: {
            ...prev.testingState,
            isLoading: false,
            error: data.error || 'Test failed',
          }
        }));
        toast.error('Endpoint test failed');
      }
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        testingState: {
          ...prev.testingState,
          isLoading: false,
          error: error.message,
        }
      }));
      toast.error('Endpoint test error');
    },
  });

  // Export functionality with file download
  const exportMutation = useMutation({
    mutationFn: ({ spec, options }: { spec: OpenAPISpec, options: ExportOptions }) =>
      exportConfiguration(spec, options),
    onSuccess: (blob, variables) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const extension = variables.options.format === 'yaml' ? 'yml' : 
                       variables.options.format === 'postman' ? 'json' : 'json';
      link.download = `api-configuration.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Configuration exported as ${variables.options.format.toUpperCase()}`);
      onExport?.(variables.options.format);
    },
    onError: () => {
      toast.error('Export failed');
    },
  });

  // Update state when preview data changes
  useEffect(() => {
    if (previewData?.success) {
      setState(prev => ({
        ...prev,
        openApiSpec: previewData.openApiSpec || null,
        lastUpdated: previewData.generatedAt,
      }));
    }
  }, [previewData]);

  // Handle configuration changes with debounced updates
  useEffect(() => {
    if (configuration) {
      setState(prev => ({
        ...prev,
        configuration,
      }));
    }
  }, [configuration]);

  // Tab navigation handler
  const handleTabChange = useCallback((tab: PreviewPanelState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  // Test endpoint handler
  const handleTestEndpoint = useCallback((request: PreviewRequest) => {
    if (!configuration) return;
    
    testMutation.mutate({
      configuration,
      testRequest: request,
    });
  }, [configuration, testMutation]);

  // Export handler
  const handleExport = useCallback((format: ExportOptions['format']) => {
    if (!state.openApiSpec) {
      toast.error('No OpenAPI specification available to export');
      return;
    }

    const exportOptions: ExportOptions = {
      ...state.exportOptions,
      format,
    };

    exportMutation.mutate({
      spec: state.openApiSpec,
      options: exportOptions,
    });
  }, [state.openApiSpec, state.exportOptions, exportMutation]);

  // Render loading state
  if (!configuration) {
    return (
      <div className={`preview-panel ${className}`}>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-gray-500 mb-2">No configuration available</div>
            <div className="text-sm text-gray-400">
              Configure your API endpoints to see the preview
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`preview-panel bg-white rounded-lg shadow-lg ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Preview tabs">
          {[
            { id: 'configuration', label: 'Configuration Summary', icon: '⚙️' },
            { id: 'openapi', label: 'OpenAPI Specification', icon: '📋' },
            { id: 'testing', label: 'Live Testing', icon: '🧪' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as PreviewPanelState['activeTab'])}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                state.activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              type="button"
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {state.activeTab === 'configuration' && (
          <ConfigurationSummaryTab
            configuration={configuration}
            summary={previewData?.summary}
            isLoading={isGeneratingPreview}
            error={previewError?.message}
            onEdit={() => onConfigurationChange?.(configuration)}
          />
        )}

        {state.activeTab === 'openapi' && (
          <OpenAPISpecificationTab
            spec={state.openApiSpec}
            isLoading={isGeneratingPreview}
            error={previewError?.message}
            onExport={handleExport}
            exportOptions={state.exportOptions}
            onExportOptionsChange={(options) => 
              setState(prev => ({ ...prev, exportOptions: options }))
            }
          />
        )}

        {state.activeTab === 'testing' && (
          <LiveTestingTab
            configuration={configuration}
            testingState={state.testingState}
            onTest={handleTestEndpoint}
            isLoading={testMutation.isPending}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>
              Status: {isGeneratingPreview ? (
                <span className="text-blue-600">Generating...</span>
              ) : previewError ? (
                <span className="text-red-600">Error</span>
              ) : (
                <span className="text-green-600">Ready</span>
              )}
            </span>
            {state.lastUpdated && (
              <span>
                Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['preview'] })}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              disabled={isGeneratingPreview}
              type="button"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Configuration Summary Tab Component
 * Displays endpoint configuration in an organized, collapsible format
 */
function ConfigurationSummaryTab({
  configuration,
  summary,
  isLoading,
  error,
  onEdit,
}: {
  configuration: EndpointConfiguration;
  summary?: ConfigurationSummary;
  isLoading: boolean;
  error?: string;
  onEdit: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <h3 className="text-red-800 font-medium">Configuration Error</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={onEdit}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          type="button"
        >
          Edit Configuration
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Service Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-blue-700">Service Name</label>
            <p className="text-blue-900">{configuration.serviceName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700">Table</label>
            <p className="text-blue-900">{configuration.tableName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700">Base URL</label>
            <p className="text-blue-900 font-mono text-sm">{configuration.baseUrl}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-blue-700">API Prefix</label>
            <p className="text-blue-900 font-mono text-sm">{configuration.apiPrefix}</p>
          </div>
        </div>
      </div>

      {/* Enabled Endpoints */}
      <div className="bg-green-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-3">Enabled Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {configuration.enabledMethods.map((method) => (
            <div key={method} className="bg-white rounded p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  method === 'GET' ? 'bg-blue-100 text-blue-800' :
                  method === 'POST' ? 'bg-green-100 text-green-800' :
                  method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                  method === 'PATCH' ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {method}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 font-mono">
                {configuration.apiPrefix}/{configuration.serviceName}/{configuration.tableName}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Configuration */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">Security Configuration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-yellow-800">Authentication Required</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              configuration.security.requireAuth 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {configuration.security.requireAuth ? 'Yes' : 'No'}
            </span>
          </div>
          
          {configuration.security.allowedRoles.length > 0 && (
            <div>
              <span className="text-yellow-800 text-sm font-medium">Allowed Roles:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {configuration.security.allowedRoles.map((role) => (
                  <span key={role} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {configuration.security.rateLimiting && (
            <div className="flex items-center justify-between">
              <span className="text-yellow-800">Rate Limiting</span>
              <span className="text-yellow-900 text-sm">
                {configuration.security.rateLimiting.requestsPerMinute} req/min
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Features Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Pagination', enabled: configuration.parameters.pagination.enabled },
            { name: 'Filtering', enabled: configuration.parameters.filtering.enabled },
            { name: 'Sorting', enabled: configuration.parameters.sorting.enabled },
            { name: 'Strict Validation', enabled: configuration.validation.strict },
          ].map((feature) => (
            <div key={feature.name} className="text-center">
              <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                feature.enabled ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                <span className="text-xl">
                  {feature.enabled ? '✅' : '⚪'}
                </span>
              </div>
              <span className={`text-sm ${
                feature.enabled ? 'text-green-700' : 'text-gray-500'
              }`}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onEdit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          type="button"
        >
          Edit Configuration
        </button>
      </div>
    </div>
  );
}

/**
 * OpenAPI Specification Tab Component
 * Displays formatted OpenAPI spec with syntax highlighting and export options
 */
function OpenAPISpecificationTab({
  spec,
  isLoading,
  error,
  onExport,
  exportOptions,
  onExportOptionsChange,
}: {
  spec: OpenAPISpec | null;
  isLoading: boolean;
  error?: string;
  onExport: (format: ExportOptions['format']) => void;
  exportOptions: ExportOptions;
  onExportOptionsChange: (options: ExportOptions) => void;
}) {
  const formattedSpec = useMemo(() => {
    if (!spec) return '';
    return JSON.stringify(spec, null, 2);
  }, [spec]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <h3 className="text-red-800 font-medium">OpenAPI Generation Error</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500 mb-2">No OpenAPI specification available</div>
        <div className="text-sm text-gray-400">
          The specification will be generated automatically when configuration is complete
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Export Options</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Format:</label>
            <select
              value={exportOptions.format}
              onChange={(e) => onExportOptionsChange({
                ...exportOptions,
                format: e.target.value as ExportOptions['format']
              })}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="postman">Postman Collection</option>
            </select>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.includeExamples}
              onChange={(e) => onExportOptionsChange({
                ...exportOptions,
                includeExamples: e.target.checked
              })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Include Examples</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.includeSchemas}
              onChange={(e) => onExportOptionsChange({
                ...exportOptions,
                includeSchemas: e.target.checked
              })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Include Schemas</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={exportOptions.minifyOutput}
              onChange={(e) => onExportOptionsChange({
                ...exportOptions,
                minifyOutput: e.target.checked
              })}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Minify Output</span>
          </label>
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => onExport('json')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
            type="button"
          >
            Export JSON
          </button>
          <button
            onClick={() => onExport('yaml')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
            type="button"
          >
            Export YAML
          </button>
          <button
            onClick={() => onExport('postman')}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors text-sm"
            type="button"
          >
            Export Postman
          </button>
        </div>
      </div>

      {/* OpenAPI Specification Display */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">OpenAPI 3.0.3 Specification</h3>
          <button
            onClick={() => navigator.clipboard.writeText(formattedSpec)}
            className="text-gray-300 hover:text-white transition-colors text-sm"
            type="button"
          >
            📋 Copy
          </button>
        </div>
        <pre className="text-green-400 text-sm overflow-auto max-h-96 font-mono">
          <code>{formattedSpec}</code>
        </pre>
      </div>

      {/* Specification Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Specification Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {spec.paths ? Object.keys(spec.paths).length : 0}
            </div>
            <div className="text-sm text-blue-700">Endpoints</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {spec.components?.schemas ? Object.keys(spec.components.schemas).length : 0}
            </div>
            <div className="text-sm text-blue-700">Schemas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {spec.info.version}
            </div>
            <div className="text-sm text-blue-700">API Version</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">
              {spec.servers?.length || 1}
            </div>
            <div className="text-sm text-blue-700">Servers</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Live Testing Tab Component
 * Provides interface for testing generated endpoints with sample requests
 */
function LiveTestingTab({
  configuration,
  testingState,
  onTest,
  isLoading,
}: {
  configuration: EndpointConfiguration;
  testingState: PreviewPanelState['testingState'];
  onTest: (request: PreviewRequest) => void;
  isLoading: boolean;
}) {
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [requestBody, setRequestBody] = useState('{}');
  const [queryParams, setQueryParams] = useState('');
  const [customHeaders, setCustomHeaders] = useState('{}');

  const { register, handleSubmit, formState: { errors } } = useForm<PreviewRequest>({
    resolver: zodResolver(PreviewRequestSchema),
  });

  const baseUrl = `${configuration.baseUrl}${configuration.apiPrefix}/${configuration.serviceName}/${configuration.tableName}`;

  const handleTestSubmit = useCallback((data: Partial<PreviewRequest>) => {
    try {
      const parsedHeaders = customHeaders ? JSON.parse(customHeaders) : {};
      const parsedParams = queryParams ? 
        Object.fromEntries(new URLSearchParams(queryParams)) : {};

      const testRequest: PreviewRequest = {
        method: selectedMethod,
        url: baseUrl + (queryParams ? `?${queryParams}` : ''),
        headers: {
          'Content-Type': 'application/json',
          ...parsedHeaders,
        },
        body: selectedMethod !== 'GET' && requestBody ? JSON.parse(requestBody) : undefined,
        queryParams: parsedParams,
      };

      onTest(testRequest);
    } catch (error) {
      toast.error('Invalid JSON in request body or headers');
    }
  }, [selectedMethod, baseUrl, queryParams, customHeaders, requestBody, onTest]);

  return (
    <div className="space-y-6">
      {/* Request Configuration */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Request</h3>
        
        <form onSubmit={handleSubmit(handleTestSubmit)} className="space-y-4">
          {/* HTTP Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Method</label>
            <div className="flex space-x-2">
              {configuration.enabledMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method as any)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    selectedMethod === method
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* URL Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint URL</label>
            <div className="bg-gray-100 rounded p-3 font-mono text-sm text-gray-800">
              {baseUrl}
            </div>
          </div>

          {/* Query Parameters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Query Parameters <span className="text-gray-500">(URL format: key=value&key2=value2)</span>
            </label>
            <input
              type="text"
              value={queryParams}
              onChange={(e) => setQueryParams(e.target.value)}
              placeholder="limit=10&offset=0&sort=name"
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
            />
          </div>

          {/* Request Headers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Headers <span className="text-gray-500">(JSON format)</span>
            </label>
            <textarea
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder='{"X-Custom-Header": "value"}'
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
            />
          </div>

          {/* Request Body (for POST, PUT, PATCH) */}
          {selectedMethod !== 'GET' && selectedMethod !== 'DELETE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Body <span className="text-gray-500">(JSON format)</span>
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"name": "example", "value": 123}'
                rows={5}
                className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded font-medium transition-colors ${
              isLoading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Testing...' : `Test ${selectedMethod} Request`}
          </button>
        </form>
      </div>

      {/* Response Display */}
      {(testingState.lastResponse || testingState.error) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Response</h3>
          
          {testingState.error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-center mb-2">
                <span className="text-red-600 mr-2">❌</span>
                <span className="font-medium text-red-800">Request Failed</span>
              </div>
              <p className="text-red-700">{testingState.error}</p>
            </div>
          ) : testingState.lastResponse && (
            <div className="space-y-4">
              {/* Response Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    testingState.lastResponse.status < 300
                      ? 'bg-green-100 text-green-800'
                      : testingState.lastResponse.status < 400
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {testingState.lastResponse.status} {testingState.lastResponse.statusText}
                  </span>
                  <span className="text-sm text-gray-600">
                    Response time: {testingState.lastResponse.responseTime}ms
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(testingState.lastResponse.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Response Headers */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Response Headers</h4>
                <div className="bg-gray-900 rounded p-3">
                  <pre className="text-green-400 text-sm font-mono">
                    {JSON.stringify(testingState.lastResponse.headers, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Response Body */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Response Body</h4>
                <div className="bg-gray-900 rounded p-3">
                  <pre className="text-green-400 text-sm font-mono overflow-auto max-h-64">
                    {JSON.stringify(testingState.lastResponse.data, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Request History */}
      {testingState.requestHistory.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Request History</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {testingState.requestHistory.map((item, index) => (
              <div key={index} className="bg-white rounded p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.request.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      item.request.method === 'POST' ? 'bg-green-100 text-green-800' :
                      item.request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.request.method}
                    </span>
                    <span className="text-sm text-gray-600 font-mono">
                      {item.request.url.replace(baseUrl, '')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.response.status < 300
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.response.status}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}