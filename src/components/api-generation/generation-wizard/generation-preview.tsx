'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { Download, Copy, AlertCircle, CheckCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

// Dynamic import for SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Loading API Documentation...</span>
    </div>
  )
});

// Component imports (will be implemented)
import { Button, IconButton } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodePreview } from '@/components/ui/code-preview';

// Context and hooks
import { useWizardContext } from './wizard-provider';
import { useOpenApiPreview } from '@/hooks/use-openapi-preview';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { useApiKeys } from '@/hooks/use-api-keys';

// Types
import type { 
  WizardStep, 
  OpenApiSpec,
  ApiEndpoint,
  ValidationError,
  PreviewConfiguration 
} from './types';

// Utils
import { cn } from '@/lib/utils';
import { downloadFile } from '@/lib/file-utils';
import { validateConfiguration } from '@/lib/validation';

interface GenerationPreviewProps {
  className?: string;
}

interface ApiKeyInfo {
  id: string;
  name: string;
  apiKey: string;
  description?: string;
}

interface PreviewError {
  field: string;
  message: string;
  code: string;
}

/**
 * GenerationPreview component provides real-time preview of generated OpenAPI specification
 * and endpoint documentation. This is the third step in the API generation wizard workflow.
 * 
 * Features:
 * - Interactive OpenAPI specification preview using @swagger-ui/react
 * - Real-time preview generation via Next.js serverless functions
 * - Configuration validation and error handling
 * - API key management and testing
 * - Download functionality for API specifications
 * - Dark mode theme support
 * - Responsive design with Tailwind CSS
 */
export const GenerationPreview: React.FC<GenerationPreviewProps> = ({ 
  className 
}) => {
  // Hooks
  const { t } = useTranslation();
  const { 
    currentStep, 
    wizardData, 
    updateWizardData, 
    nextStep, 
    previousStep,
    validateCurrentStep 
  } = useWizardContext();
  
  const { showNotification } = useNotifications();
  const { theme } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'endpoints'>('preview');
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<PreviewError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Refs
  const swaggerContainerRef = useRef<HTMLDivElement>(null);
  
  // API Preview Hook - handles real-time OpenAPI generation
  const {
    openApiSpec,
    isGenerating,
    error: previewError,
    regeneratePreview,
    downloadSpec
  } = useOpenApiPreview({
    selectedTables: wizardData.selectedTables,
    endpointConfiguration: wizardData.endpointConfiguration,
    securityConfiguration: wizardData.securityConfiguration,
    enabled: currentStep === WizardStep.PREVIEW
  });
  
  // API Keys for testing
  const { 
    apiKeys, 
    isLoading: isLoadingApiKeys 
  } = useApiKeys(wizardData.serviceId);
  
  // Memoized configuration validation
  const configurationValidation = useMemo(() => {
    if (!wizardData.endpointConfiguration) return { isValid: false, errors: [] };
    
    return validateConfiguration({
      selectedTables: wizardData.selectedTables,
      endpointConfiguration: wizardData.endpointConfiguration,
      securityConfiguration: wizardData.securityConfiguration
    });
  }, [wizardData]);
  
  // Extract endpoint information for endpoint tab
  const extractedEndpoints = useMemo((): ApiEndpoint[] => {
    if (!openApiSpec?.paths) return [];
    
    return Object.entries(openApiSpec.paths).flatMap(([path, methods]) =>
      Object.entries(methods as Record<string, any>).map(([method, spec]) => ({
        path,
        method: method.toUpperCase(),
        operationId: spec.operationId,
        summary: spec.summary,
        description: spec.description,
        parameters: spec.parameters || [],
        responses: spec.responses || {},
        tags: spec.tags || []
      }))
    );
  }, [openApiSpec]);
  
  // Validation effect
  useEffect(() => {
    if (currentStep === WizardStep.PREVIEW && !isGenerating) {
      setIsValidating(true);
      
      const errors: PreviewError[] = [];
      
      // Validate selected tables
      if (!wizardData.selectedTables?.length) {
        errors.push({
          field: 'selectedTables',
          message: t('wizard.validation.noTablesSelected'),
          code: 'MISSING_TABLES'
        });
      }
      
      // Validate endpoint configuration
      if (!wizardData.endpointConfiguration) {
        errors.push({
          field: 'endpointConfiguration',
          message: t('wizard.validation.noEndpointConfiguration'),
          code: 'MISSING_ENDPOINT_CONFIG'
        });
      }
      
      // Add configuration validation errors
      if (!configurationValidation.isValid) {
        errors.push(...configurationValidation.errors.map(error => ({
          field: error.field,
          message: error.message,
          code: error.code
        })));
      }
      
      setValidationErrors(errors);
      setIsValidating(false);
    }
  }, [currentStep, wizardData, configurationValidation, isGenerating, t]);
  
  // Handle API key copy
  const handleCopyApiKey = async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      showNotification({
        type: 'success',
        message: t('apiDocs.apiKeys.copied'),
        duration: 3000
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: t('apiDocs.apiKeys.copyFailed'),
        duration: 5000
      });
    }
  };
  
  // Handle download API specification
  const handleDownloadSpec = async () => {
    if (!openApiSpec) return;
    
    try {
      await downloadFile(
        JSON.stringify(openApiSpec, null, 2),
        'api-specification.json',
        'application/json'
      );
      
      showNotification({
        type: 'success',
        message: t('wizard.preview.downloadSuccess'),
        duration: 3000
      });
    } catch (error) {
      showNotification({
        type: 'error',
        message: t('wizard.preview.downloadError'),
        duration: 5000
      });
    }
  };
  
  // Handle wizard navigation
  const handleNext = async () => {
    if (validationErrors.length > 0) {
      showNotification({
        type: 'error',
        message: t('wizard.preview.validationErrors'),
        duration: 5000
      });
      return;
    }
    
    // Update wizard data with final preview data
    updateWizardData({
      openApiSpec,
      selectedApiKey,
      validationPassed: true
    });
    
    await nextStep();
  };
  
  const handlePrevious = () => {
    previousStep();
  };
  
  // Regenerate preview when configuration changes
  const handleRegeneratePreview = () => {
    regeneratePreview();
  };
  
  // Swagger UI configuration
  const swaggerConfig = useMemo(() => ({
    spec: openApiSpec,
    docExpansion: 'list' as const,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add authentication headers
      if (selectedApiKey) {
        req.headers['X-DreamFactory-API-Key'] = selectedApiKey;
      }
      
      // Add session token from user context
      const sessionToken = localStorage.getItem('df_session_token');
      if (sessionToken) {
        req.headers['X-DreamFactory-Session-Token'] = sessionToken;
      }
      
      return req;
    },
    theme: theme === 'dark' ? 'dark' : 'light'
  }), [openApiSpec, selectedApiKey, theme]);
  
  // Loading state
  if (isGenerating || isValidating) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isGenerating ? t('wizard.preview.generating') : t('wizard.preview.validating')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('wizard.preview.pleaseWait')}
        </p>
      </div>
    );
  }
  
  // Error state
  if (previewError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-semibold">{t('wizard.preview.error.title')}</h4>
            <p className="mt-1">{previewError.message}</p>
          </div>
        </Alert>
        
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('wizard.previous')}</span>
          </Button>
          
          <Button 
            onClick={handleRegeneratePreview}
            className="flex items-center space-x-2"
          >
            <span>{t('wizard.preview.retry')}</span>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('wizard.preview.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t('wizard.preview.description')}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Download Button */}
          <Button
            variant="outline"
            onClick={handleDownloadSpec}
            disabled={!openApiSpec}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{t('wizard.preview.download')}</span>
          </Button>
          
          {/* Regenerate Button */}
          <Button
            variant="outline"
            onClick={handleRegeneratePreview}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>{t('wizard.preview.regenerate')}</span>
            )}
          </Button>
        </div>
      </div>
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-semibold">{t('wizard.preview.validationErrors')}</h4>
            <ul className="mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        </Alert>
      )}
      
      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>{t('wizard.preview.configuration')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('wizard.preview.selectedTables')}
              </p>
              <p className="text-lg font-semibold">
                {wizardData.selectedTables?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('wizard.preview.endpoints')}
              </p>
              <p className="text-lg font-semibold">
                {extractedEndpoints.length}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('wizard.preview.httpMethods')}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {wizardData.endpointConfiguration?.enabledMethods?.map(method => (
                  <Badge key={method} variant="secondary" className="text-xs">
                    {method}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* API Keys */}
      {apiKeys && apiKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('wizard.preview.apiKeys.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('wizard.preview.apiKeys.description')}
              </p>
              
              <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('wizard.preview.apiKeys.select')} />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((key: ApiKeyInfo) => (
                    <SelectItem key={key.id} value={key.apiKey}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{key.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {key.apiKey.slice(0, 8)}...
                          </span>
                        </div>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyApiKey(key.apiKey);
                          }}
                          className="ml-2"
                        >
                          <Copy className="h-3 w-3" />
                        </IconButton>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* API Preview Tabs */}
      <Card className="min-h-[600px]">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab as any}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">
                {t('wizard.preview.tabs.interactive')}
              </TabsTrigger>
              <TabsTrigger value="endpoints">
                {t('wizard.preview.tabs.endpoints')}
              </TabsTrigger>
              <TabsTrigger value="raw">
                {t('wizard.preview.tabs.specification')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab as any}>
            {/* Interactive Swagger UI Preview */}
            <TabsContent value="preview" className="mt-0">
              <div 
                ref={swaggerContainerRef}
                className="w-full min-h-[500px] bg-white dark:bg-gray-900"
              >
                {openApiSpec ? (
                  <SwaggerUI 
                    {...swaggerConfig}
                    presets={[
                      // @ts-ignore - SwaggerUI types issue
                      SwaggerUI.presets?.apis,
                      SwaggerUI.presets?.standalone
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">{t('wizard.preview.noSpec')}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Endpoints List */}
            <TabsContent value="endpoints" className="mt-0">
              <div className="p-6 space-y-4">
                {extractedEndpoints.length > 0 ? (
                  <div className="space-y-3">
                    {extractedEndpoints.map((endpoint, index) => (
                      <Card key={index} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Badge 
                                variant={endpoint.method === 'GET' ? 'default' : 
                                       endpoint.method === 'POST' ? 'secondary' :
                                       endpoint.method === 'PUT' ? 'outline' :
                                       endpoint.method === 'DELETE' ? 'destructive' : 'default'}
                                className="font-mono text-xs"
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                            </div>
                            <div className="flex items-center space-x-2">
                              {endpoint.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {endpoint.summary && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {endpoint.summary}
                            </p>
                          )}
                          
                          {endpoint.description && endpoint.description !== endpoint.summary && (
                            <p className="mt-1 text-xs text-gray-500">
                              {endpoint.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t('wizard.preview.noEndpoints')}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Raw OpenAPI Specification */}
            <TabsContent value="raw" className="mt-0">
              <div className="p-6">
                {openApiSpec ? (
                  <CodePreview 
                    code={JSON.stringify(openApiSpec, null, 2)}
                    language="json"
                    showLineNumbers
                    className="max-h-[500px]"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">{t('wizard.preview.noSpec')}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('wizard.previous')}</span>
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={validationErrors.length > 0 || !openApiSpec}
          className="flex items-center space-x-2"
        >
          <span>{t('wizard.next')}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default GenerationPreview;