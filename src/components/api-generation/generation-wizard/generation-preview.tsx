'use client';

/**
 * Generation Preview Component - Third Wizard Step
 * 
 * React component for the third wizard step providing real-time preview of generated OpenAPI 
 * specification and endpoint documentation. Integrates with @swagger-ui/react for interactive 
 * API preview and validation before final generation.
 * 
 * Features:
 * - Real-time OpenAPI specification preview via Next.js serverless functions
 * - Interactive Swagger UI integration with @swagger-ui/react
 * - Configuration validation and error handling per Section 4.4.5 Error Handling Implementation
 * - Dynamic preview regeneration based on endpoint configurations
 * - Comprehensive error boundaries with fallback UI rendering
 * - Performance optimization with intelligent caching via React Query
 * 
 * Requirements Satisfied:
 * - F-003 REST API Endpoint Generation with real-time OpenAPI preview per Section 2.1 Feature Catalog
 * - @swagger-ui/react integration for interactive API documentation preview per React/Next.js Integration Requirements
 * - Next.js serverless functions for real-time preview generation per technical implementation requirements
 * - Configuration validation and error handling before API generation per Section 4.4.5 Error Handling Implementation
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 2.1 - FEATURE CATALOG (F-003)
 * @see Technical Specification Section 4.4 - TECHNICAL IMPLEMENTATION FLOWS
 * @see React/Next.js Integration Requirements - @swagger-ui/react integration
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, CheckCircle, RefreshCw, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Wizard context and types
import { useWizard, useWizardNavigation, WIZARD_STEPS } from './wizard-provider';
import type { 
  OpenAPISpec, 
  GenerationPreviewProps, 
  EndpointConfiguration,
  GenerationStatus 
} from './types';

// UI Components with Tailwind CSS styling
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, Tab } from '@/components/ui/tabs';

// Dynamic import of SwaggerUI with SSR disabled for Next.js compatibility
// This resolves the "Class extends value undefined" error in server components
const SwaggerUI = dynamic(
  () => import('swagger-ui-react'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading OpenAPI Preview...</p>
        </div>
      </div>
    )
  }
);

// Import Swagger UI CSS
import 'swagger-ui-react/swagger-ui.css';

/**
 * Code Preview Component for raw OpenAPI JSON display
 */
const CodePreview: React.FC<{ spec: OpenAPISpec | null; isLoading: boolean }> = ({ spec, isLoading }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    if (spec) {
      await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [spec]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Generating specification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              Copied
            </>
          ) : (
            'Copy JSON'
          )}
        </Button>
      </div>
      <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-xs overflow-auto h-96 font-mono">
        <code className="text-gray-800 dark:text-gray-200">
          {spec ? JSON.stringify(spec, null, 2) : 'No specification generated'}
        </code>
      </pre>
    </div>
  );
};

/**
 * Validation Summary Component
 */
const ValidationSummary: React.FC<{
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
}> = ({ isValid, validationErrors, warnings }) => {
  if (isValid && warnings.length === 0) {
    return (
      <Alert variant="success" className="mb-6">
        <CheckCircle className="h-4 w-4" />
        <div>
          <h4 className="font-medium">Configuration Valid</h4>
          <p className="text-sm">Your API configuration is ready for generation.</p>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Configuration Errors</h4>
            <ul className="text-sm mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        </Alert>
      )}
      
      {warnings.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Configuration Warnings</h4>
            <ul className="text-sm mt-2 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </Alert>
      )}
    </div>
  );
};

/**
 * Configuration Summary Component
 */
const ConfigurationSummary: React.FC<{
  selectedTables: Map<string, any>;
  endpointConfigurations: Map<string, EndpointConfiguration>;
}> = ({ selectedTables, endpointConfigurations }) => {
  const totalEndpoints = useMemo(() => {
    let count = 0;
    endpointConfigurations.forEach((config) => {
      Object.values(config.httpMethods).forEach((enabled) => {
        if (enabled) count++;
      });
    });
    return count;
  }, [endpointConfigurations]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
      <h3 className="font-medium mb-3">Configuration Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Tables Selected</span>
          <p className="font-medium">{selectedTables.size}</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Total Endpoints</span>
          <p className="font-medium">{totalEndpoints}</p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">GET Endpoints</span>
          <p className="font-medium">
            {Array.from(endpointConfigurations.values()).filter(c => c.httpMethods.GET).length}
          </p>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Write Operations</span>
          <p className="font-medium">
            {Array.from(endpointConfigurations.values()).filter(c => 
              c.httpMethods.POST || c.httpMethods.PUT || c.httpMethods.PATCH || c.httpMethods.DELETE
            ).length}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Generation Preview Component
 */
export const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  className = '',
  'data-testid': testId = 'generation-preview'
}) => {
  // Wizard state management
  const wizard = useWizard();
  const navigation = useWizardNavigation();
  const queryClient = useQueryClient();
  
  // Local state
  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'validation'>('preview');
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);

  // Extract wizard state
  const {
    serviceId,
    serviceName,
    selectedTables,
    endpointConfigurations,
    openApiPreview,
    generationProgress,
    isNavigationLocked
  } = wizard;

  // OpenAPI preview generation via Next.js serverless functions
  const {
    data: previewData,
    isLoading: isGeneratingPreview,
    error: previewError,
    refetch: regeneratePreview
  } = useQuery({
    queryKey: ['openapi-preview', serviceId, Array.from(selectedTables.keys()), endpointConfigurations],
    queryFn: async () => {
      if (!serviceId || selectedTables.size === 0) {
        throw new Error('Service ID and selected tables are required for preview generation');
      }

      // Construct preview request payload
      const previewPayload = {
        serviceId,
        serviceName,
        tables: Array.from(selectedTables.values()),
        configurations: Object.fromEntries(endpointConfigurations),
        timestamp: new Date().toISOString()
      };

      // Call Next.js API route for real-time preview generation
      const response = await fetch(`/api/preview/openapi/${serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(previewPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Preview generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Validate the returned OpenAPI specification
      if (!result.specification || typeof result.specification !== 'object') {
        throw new Error('Invalid OpenAPI specification returned from server');
      }

      return result;
    },
    enabled: Boolean(serviceId && selectedTables.size > 0),
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error?.message?.includes('Invalid') || error?.message?.includes('required')) {
        return false;
      }
      return failureCount < 2;
    },
    onSuccess: (data) => {
      // Update wizard state with generated preview
      wizard.updateOpenApiPreview({
        specification: data.specification,
        isValid: true,
        validationErrors: [],
      });
    },
    onError: (error) => {
      // Update wizard state with error
      wizard.updateOpenApiPreview({
        specification: null,
        isValid: false,
        validationErrors: [error.message],
      });
    }
  });

  // API generation mutation
  const generateApiMutation = useMutation({
    mutationFn: async () => {
      if (!serviceId || selectedTables.size === 0) {
        throw new Error('Service ID and selected tables are required for API generation');
      }

      const generationPayload = {
        serviceId,
        serviceName,
        tables: Array.from(selectedTables.values()),
        configurations: Object.fromEntries(endpointConfigurations),
        generateDocumentation: true,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`/api/generate/endpoints/${serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API generation failed: ${response.statusText}`);
      }

      return response.json();
    },
    onMutate: () => {
      wizard.startGeneration();
    },
    onSuccess: (data) => {
      wizard.completeGeneration(data.endpoints || []);
      wizard.markStepCompleted(WIZARD_STEPS.PREVIEW_AND_GENERATE);
      
      // Navigate to the next step (generation progress)
      if (navigation.canGoNext) {
        navigation.goToNextStep();
      }
    },
    onError: (error) => {
      wizard.setGenerationError(error.message);
    }
  });

  // Configuration validation
  const validationResult = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate service context
    if (!serviceId || !serviceName) {
      errors.push('Service information is missing. Please go back and select a valid database service.');
    }

    // Validate table selection
    if (selectedTables.size === 0) {
      errors.push('No tables selected. Please go back and select at least one table for API generation.');
    }

    // Validate endpoint configurations
    if (endpointConfigurations.size === 0) {
      errors.push('No endpoint configurations found. Please configure endpoints for your selected tables.');
    }

    // Validate each table has at least one HTTP method enabled
    let tablesWithoutMethods = 0;
    endpointConfigurations.forEach((config, tableName) => {
      const hasEnabledMethods = Object.values(config.httpMethods).some(enabled => enabled);
      if (!hasEnabledMethods) {
        tablesWithoutMethods++;
      }
    });

    if (tablesWithoutMethods > 0) {
      errors.push(`${tablesWithoutMethods} table(s) have no HTTP methods enabled. Each table must have at least one endpoint type.`);
    }

    // Check for potential security issues
    const tablesWithoutAuth = Array.from(endpointConfigurations.values()).filter(
      config => config.securityRules.length === 0
    ).length;

    if (tablesWithoutAuth > 0) {
      warnings.push(`${tablesWithoutAuth} table(s) have no security rules configured. Consider adding authentication requirements.`);
    }

    // Check for OpenAPI specification validity
    if (openApiPreview.specification) {
      if (!openApiPreview.specification.info?.title) {
        warnings.push('OpenAPI specification is missing a title. This may affect documentation quality.');
      }
      
      if (!openApiPreview.specification.info?.version) {
        warnings.push('OpenAPI specification is missing a version. This may affect API versioning.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [serviceId, serviceName, selectedTables, endpointConfigurations, openApiPreview.specification]);

  // Download OpenAPI specification
  const handleDownloadSpec = useCallback(() => {
    if (openApiPreview.specification) {
      const blob = new Blob([JSON.stringify(openApiPreview.specification, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${serviceName || 'api'}-openapi-spec.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [openApiPreview.specification, serviceName]);

  // Handle manual regeneration
  const handleRegeneratePreview = useCallback(() => {
    regeneratePreview();
  }, [regeneratePreview]);

  // Handle API generation
  const handleGenerateApi = useCallback(() => {
    if (validationResult.isValid) {
      setShowGenerationDialog(true);
    }
  }, [validationResult.isValid]);

  const confirmGeneration = useCallback(() => {
    setShowGenerationDialog(false);
    generateApiMutation.mutate();
  }, [generateApiMutation]);

  // Update wizard state when step becomes active
  useEffect(() => {
    if (navigation.currentStep === WIZARD_STEPS.PREVIEW_AND_GENERATE) {
      wizard.markStepCompleted(WIZARD_STEPS.PREVIEW_AND_GENERATE);
    }
  }, [navigation.currentStep, wizard]);

  // Error boundary fallback
  if (previewError && !isGeneratingPreview) {
    return (
      <div className={`space-y-6 ${className}`} data-testid={testId}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Preview Generation Failed</h4>
            <p className="text-sm mt-1">{previewError.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegeneratePreview}
              className="mt-3"
              disabled={isGeneratingPreview}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
              Retry Preview Generation
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid={testId}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          API Preview & Generation
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review your OpenAPI specification and generate your REST API endpoints.
        </p>
      </div>

      {/* Configuration Summary */}
      <ConfigurationSummary
        selectedTables={selectedTables}
        endpointConfigurations={endpointConfigurations}
      />

      {/* Validation Summary */}
      <ValidationSummary
        isValid={validationResult.isValid}
        validationErrors={validationResult.errors}
        warnings={validationResult.warnings}
      />

      {/* Preview Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Tab value="preview">Interactive Preview</Tab>
              <Tab value="json">OpenAPI JSON</Tab>
              <Tab value="validation">Validation Details</Tab>
            </Tabs>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegeneratePreview}
                disabled={isGeneratingPreview}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
              
              {openApiPreview.specification && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSpec}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'preview' && (
            <div className="min-h-[600px]">
              {isGeneratingPreview ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <h3 className="text-lg font-medium mb-2">Generating OpenAPI Preview</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Creating interactive documentation for your API endpoints...
                    </p>
                  </div>
                </div>
              ) : openApiPreview.specification ? (
                <div className="swagger-ui-wrapper">
                  <SwaggerUI
                    spec={openApiPreview.specification}
                    displayOperationId={true}
                    displayRequestDuration={true}
                    defaultModelsExpandDepth={1}
                    defaultModelExpandDepth={1}
                    docExpansion="list"
                    filter={true}
                    showExtensions={true}
                    showCommonExtensions={true}
                    tryItOutEnabled={true}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Configure your endpoints and tables to generate a preview.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleRegeneratePreview}
                      disabled={isGeneratingPreview}
                    >
                      Generate Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'json' && (
            <CodePreview
              spec={openApiPreview.specification}
              isLoading={isGeneratingPreview}
            />
          )}

          {activeTab === 'validation' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Validation Report</h3>
              
              {validationResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Errors</h4>
                  <ul className="space-y-2">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-2">Warnings</h4>
                  <ul className="space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {validationResult.isValid && validationResult.warnings.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">All Validations Passed</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your configuration is ready for API generation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={navigation.goToPreviousStep}
          disabled={!navigation.canGoPrevious || isNavigationLocked}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={handleGenerateApi}
          disabled={!validationResult.isValid || isNavigationLocked || generateApiMutation.isLoading}
          className="min-w-[140px]"
        >
          {generateApiMutation.isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              Generate API
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Generation Confirmation Dialog */}
      <Dialog
        isOpen={showGenerationDialog}
        onClose={() => setShowGenerationDialog(false)}
        title="Confirm API Generation"
      >
        <div className="space-y-4">
          <p>
            You are about to generate REST API endpoints for <strong>{selectedTables.size}</strong> table(s) 
            in the <strong>{serviceName}</strong> service.
          </p>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium mb-2">What will be generated:</h4>
            <ul className="text-sm space-y-1">
              <li>• REST API endpoints for all configured HTTP methods</li>
              <li>• OpenAPI 3.0 specification document</li>
              <li>• Interactive API documentation</li>
              <li>• Security rules and access controls</li>
            </ul>
          </div>
          
          {validationResult.warnings.length > 0 && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <h4 className="font-medium">Please Review Warnings</h4>
                <p className="text-sm">
                  There are {validationResult.warnings.length} warning(s) in your configuration. 
                  You can proceed, but consider reviewing them first.
                </p>
              </div>
            </Alert>
          )}
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowGenerationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmGeneration}
              disabled={generateApiMutation.isLoading}
            >
              {generateApiMutation.isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate API'
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Custom Swagger UI Styling */}
      <style jsx global>{`
        .swagger-ui-wrapper .swagger-ui {
          font-family: inherit;
        }
        
        .swagger-ui-wrapper .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui-wrapper .swagger-ui .scheme-container {
          background: transparent;
          border: none;
          padding: 0;
        }
        
        .swagger-ui-wrapper .swagger-ui .info .title {
          color: var(--tw-prose-headings);
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .swagger-ui-wrapper .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid rgb(229 231 235);
        }
        
        .dark .swagger-ui-wrapper .swagger-ui .opblock {
          border-color: rgb(55 65 81);
        }
        
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-get {
          border-color: rgb(34 197 94);
        }
        
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-post {
          border-color: rgb(59 130 246);
        }
        
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-put {
          border-color: rgb(245 158 11);
        }
        
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-delete {
          border-color: rgb(239 68 68);
        }
      `}</style>
    </div>
  );
};

export default GenerationPreview;