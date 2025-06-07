'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  EndpointConfiguration, 
  OpenAPISpec, 
  PreviewRequest, 
  PreviewResponse, 
  TestingState,
  ConfigurationSummary,
  ExportOptions,
  PreviewPanelState,
  HttpMethod,
  DEFAULT_EXPORT_OPTIONS,
  EndpointConfigurationSchema,
  PreviewRequestSchema,
  ExportOptionsSchema
} from './types/preview.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Real-time preview panel component for API endpoint configuration
 * 
 * Displays generated API endpoint configuration, OpenAPI specification preview,
 * and live endpoint testing interface. Integrates with Next.js API routes for 
 * server-side preview functionality per Section 5.2.
 * 
 * Features:
 * - Real-time OpenAPI specification generation and preview
 * - Live endpoint testing interface with sample request/response
 * - Configuration summary display with collapsible sections
 * - Export functionality for OpenAPI specifications and configurations
 * - Next.js API route integration for server-side validation
 */

interface PreviewPanelProps {
  configuration: EndpointConfiguration | null;
  onConfigurationChange?: (config: EndpointConfiguration) => void;
  onExport?: (format: ExportOptions['format']) => void;
  className?: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  configuration,
  onConfigurationChange,
  onExport,
  className = ''
}) => {
  // Component state management
  const [state, setState] = useState<PreviewPanelState>({
    activeTab: 'configuration',
    configuration: null,
    openApiSpec: null,
    testingState: {
      isLoading: false,
      activeRequest: null,
      lastResponse: null,
      error: null,
      requestHistory: []
    },
    exportOptions: DEFAULT_EXPORT_OPTIONS,
    isGenerating: false,
    lastUpdated: null
  });

  const [expandedSections, setExpandedSections] = useState({
    endpoints: true,
    security: false,
    parameters: false,
    validation: false
  });

  // Update internal state when configuration prop changes
  useEffect(() => {
    if (configuration) {
      setState(prev => ({
        ...prev,
        configuration,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [configuration]);

  // Generate OpenAPI specification from configuration
  const generateOpenApiSpec = useCallback(async (config: EndpointConfiguration): Promise<OpenAPISpec> => {
    try {
      setState(prev => ({ ...prev, isGenerating: true }));

      // Call Next.js API route for server-side generation
      const response = await fetch('/api/preview/openapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration: config,
          options: {
            includeExamples: state.exportOptions.includeExamples,
            validateSchema: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.openApiSpec) {
        throw new Error(data.error || 'Failed to generate OpenAPI specification');
      }

      return data.openApiSpec;
    } catch (error) {
      console.error('OpenAPI generation failed:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [state.exportOptions.includeExamples]);

  // Generate configuration summary
  const generateConfigurationSummary = useCallback((config: EndpointConfiguration): ConfigurationSummary => {
    const endpoints = config.enabledMethods.map(method => ({
      method: method as HttpMethod,
      path: `${config.apiPrefix}/${config.serviceName}/${config.tableName}`,
      description: getMethodDescription(method, config.tableName),
      requiresAuth: config.security.requireAuth
    }));

    return {
      service: {
        name: config.serviceName,
        type: 'Database Service',
        database: config.tableName
      },
      endpoints,
      security: {
        authenticationRequired: config.security.requireAuth,
        roleBasedAccess: config.security.allowedRoles.length > 0,
        rateLimitingEnabled: config.security.rateLimiting?.enabled || false
      },
      features: {
        pagination: config.parameters.pagination.enabled,
        filtering: config.parameters.filtering.enabled,
        sorting: config.parameters.sorting.enabled,
        validation: config.validation.strict
      }
    };
  }, []);

  // Helper function to get method descriptions
  const getMethodDescription = (method: string, tableName: string): string => {
    const descriptions = {
      GET: `Retrieve ${tableName} records`,
      POST: `Create new ${tableName} record`,
      PUT: `Update ${tableName} record`,
      PATCH: `Partially update ${tableName} record`,
      DELETE: `Delete ${tableName} record`
    };
    return descriptions[method as keyof typeof descriptions] || `${method} operation on ${tableName}`;
  };

  // Update OpenAPI spec when configuration changes
  useEffect(() => {
    if (configuration) {
      generateOpenApiSpec(configuration)
        .then(spec => {
          setState(prev => ({
            ...prev,
            openApiSpec: spec,
            lastUpdated: new Date().toISOString()
          }));
        })
        .catch(error => {
          console.error('Failed to generate OpenAPI spec:', error);
          setState(prev => ({
            ...prev,
            testingState: {
              ...prev.testingState,
              error: `OpenAPI generation failed: ${error.message}`
            }
          }));
        });
    }
  }, [configuration, generateOpenApiSpec]);

  // Test endpoint functionality
  const testEndpoint = async (request: PreviewRequest) => {
    try {
      // Validate request using Zod schema
      PreviewRequestSchema.parse(request);

      setState(prev => ({
        ...prev,
        testingState: {
          ...prev.testingState,
          isLoading: true,
          activeRequest: request,
          error: null
        }
      }));

      const startTime = Date.now();

      // Call Next.js API route for endpoint testing
      const response = await fetch('/api/preview/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuration,
          testRequest: request
        })
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.json();

      const previewResponse: PreviewResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        timestamp: new Date().toISOString(),
        responseTime
      };

      setState(prev => ({
        ...prev,
        testingState: {
          ...prev.testingState,
          isLoading: false,
          lastResponse: previewResponse,
          requestHistory: [
            ...prev.testingState.requestHistory.slice(-9), // Keep last 10 requests
            { request, response: previewResponse, timestamp: previewResponse.timestamp }
          ]
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        testingState: {
          ...prev.testingState,
          isLoading: false,
          error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    }
  };

  // Export functionality
  const handleExport = async (format: ExportOptions['format']) => {
    try {
      const options = { ...state.exportOptions, format };
      ExportOptionsSchema.parse(options);

      if (!state.openApiSpec) {
        throw new Error('No OpenAPI specification available for export');
      }

      const response = await fetch('/api/preview/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          openApiSpec: state.openApiSpec,
          configuration,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Trigger download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${configuration?.serviceName}-${configuration?.tableName}-api.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onExport?.(format);
    } catch (error) {
      console.error('Export failed:', error);
      setState(prev => ({
        ...prev,
        testingState: {
          ...prev.testingState,
          error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    }
  };

  // Tab switching
  const switchTab = (tab: 'configuration' | 'openapi' | 'testing') => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Sample request generation for testing
  const generateSampleRequest = (method: HttpMethod): PreviewRequest => {
    const baseUrl = configuration?.baseUrl || 'https://api.example.com';
    const apiPrefix = configuration?.apiPrefix || '/api/v2';
    const serviceName = configuration?.serviceName || 'db';
    const tableName = configuration?.tableName || 'table';

    const url = `${baseUrl}${apiPrefix}/${serviceName}/_table/${tableName}`;

    const sampleRequests: Record<HttpMethod, PreviewRequest> = {
      GET: {
        method: 'GET',
        url,
        headers: { 'Content-Type': 'application/json' },
        queryParams: { limit: '10', offset: '0' }
      },
      POST: {
        method: 'POST',
        url,
        headers: { 'Content-Type': 'application/json' },
        body: { name: 'Sample Record', active: true }
      },
      PUT: {
        method: 'PUT',
        url: `${url}/1`,
        headers: { 'Content-Type': 'application/json' },
        body: { id: 1, name: 'Updated Record', active: false }
      },
      PATCH: {
        method: 'PATCH',
        url: `${url}/1`,
        headers: { 'Content-Type': 'application/json' },
        body: { active: false }
      },
      DELETE: {
        method: 'DELETE',
        url: `${url}/1`,
        headers: { 'Content-Type': 'application/json' }
      }
    };

    return sampleRequests[method];
  };

  // Render configuration summary
  const renderConfigurationSummary = () => {
    if (!configuration) return null;

    const summary = generateConfigurationSummary(configuration);

    return (
      <div className="space-y-4">
        {/* Service Information */}
        <div>
          <button
            onClick={() => toggleSection('endpoints')}
            className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Service: {summary.service.name}
            </h4>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.endpoints ? '−' : '+'}
            </span>
          </button>
          {expandedSections.endpoints && (
            <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{summary.service.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Table:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">{summary.service.database}</span>
                </div>
              </div>
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoints:</h5>
                <div className="space-y-2">
                  {summary.endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodBadgeClass(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{endpoint.path}</span>
                      </div>
                      {endpoint.requiresAuth && (
                        <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded">
                          Auth Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Configuration */}
        <div>
          <button
            onClick={() => toggleSection('security')}
            className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Security Configuration</h4>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.security ? '−' : '+'}
            </span>
          </button>
          {expandedSections.security && (
            <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.security.authenticationRequired ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Authentication {summary.security.authenticationRequired ? 'Required' : 'Optional'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.security.roleBasedAccess ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Role-Based Access {summary.security.roleBasedAccess ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.security.rateLimitingEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Rate Limiting {summary.security.rateLimitingEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Configuration */}
        <div>
          <button
            onClick={() => toggleSection('parameters')}
            className="flex items-center justify-between w-full p-3 text-left bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Features & Parameters</h4>
            <span className="text-gray-500 dark:text-gray-400">
              {expandedSections.parameters ? '−' : '+'}
            </span>
          </button>
          {expandedSections.parameters && (
            <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.features.pagination ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Pagination</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.features.filtering ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Filtering</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.features.sorting ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Sorting</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${summary.features.validation ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>Validation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render OpenAPI specification
  const renderOpenApiSpec = () => {
    if (state.isGenerating) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Generating OpenAPI specification...</p>
          </div>
        </div>
      );
    }

    if (!state.openApiSpec) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No OpenAPI specification available</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Configure an endpoint to generate the specification</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">OpenAPI 3.0.3 Specification</h4>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleExport('json')}
              className="text-xs"
            >
              Export JSON
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleExport('yaml')}
              className="text-xs"
            >
              Export YAML
            </Button>
          </div>
        </div>
        
        {/* OpenAPI Spec Display */}
        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
          <pre className="text-sm text-gray-100 whitespace-pre-wrap">
            {JSON.stringify(state.openApiSpec, null, 2)}
          </pre>
        </div>

        {/* Specification Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{Object.keys(state.openApiSpec.paths || {}).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Endpoints</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{Object.keys(state.openApiSpec.components?.schemas || {}).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Schemas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{state.openApiSpec.openapi}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Version</div>
          </div>
        </div>
      </div>
    );
  };

  // Render endpoint testing interface
  const renderEndpointTesting = () => {
    if (!configuration) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No configuration available for testing</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Configure an endpoint to enable testing</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Method Selection */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Test Endpoint</h4>
          <div className="flex flex-wrap gap-2">
            {configuration.enabledMethods.map(method => (
              <Button
                key={method}
                size="sm"
                variant="outline"
                onClick={() => {
                  const sampleRequest = generateSampleRequest(method as HttpMethod);
                  testEndpoint(sampleRequest);
                }}
                disabled={state.testingState.isLoading}
                className="text-xs"
              >
                Test {method}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {state.testingState.isLoading && (
          <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-700 dark:text-blue-300">Testing endpoint...</span>
          </div>
        )}

        {/* Error Display */}
        {state.testingState.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">Test Error</h5>
            <p className="text-sm text-red-700 dark:text-red-300">{state.testingState.error}</p>
          </div>
        )}

        {/* Active Request */}
        {state.testingState.activeRequest && (
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900 dark:text-gray-100">Request</h5>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodBadgeClass(state.testingState.activeRequest.method)}`}>
                  {state.testingState.activeRequest.method}
                </span>
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{state.testingState.activeRequest.url}</span>
              </div>
              {state.testingState.activeRequest.body && (
                <div className="mt-3">
                  <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Request Body</h6>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(state.testingState.activeRequest.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Last Response */}
        {state.testingState.lastResponse && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-900 dark:text-gray-100">Response</h5>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span className={`px-2 py-1 text-xs font-medium rounded ${
                  state.testingState.lastResponse.status >= 200 && state.testingState.lastResponse.status < 300 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {state.testingState.lastResponse.status} {state.testingState.lastResponse.statusText}
                </span>
                <span>{state.testingState.lastResponse.responseTime}ms</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(state.testingState.lastResponse.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Request History */}
        {state.testingState.requestHistory.length > 0 && (
          <div className="space-y-4">
            <h5 className="font-medium text-gray-900 dark:text-gray-100">Recent Tests</h5>
            <div className="space-y-2">
              {state.testingState.requestHistory.slice(-5).reverse().map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getMethodBadgeClass(item.request.method)}`}>
                      {item.request.method}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    item.response.status >= 200 && item.response.status < 300 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {item.response.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function for method badge classes
  const getMethodBadgeClass = (method: string): string => {
    const classes = {
      GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return classes[method as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>API Preview</CardTitle>
        <CardDescription>
          Real-time preview of your API configuration, OpenAPI specification, and endpoint testing
        </CardDescription>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {(['configuration', 'openapi', 'testing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                state.activeTab === tab
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Tab Content */}
        <div className="mt-6">
          {state.activeTab === 'configuration' && renderConfigurationSummary()}
          {state.activeTab === 'openapi' && renderOpenApiSpec()}
          {state.activeTab === 'testing' && renderEndpointTesting()}
        </div>

        {/* Footer with last updated info */}
        {state.lastUpdated && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(state.lastUpdated).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PreviewPanel;