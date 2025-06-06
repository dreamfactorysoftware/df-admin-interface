'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SwaggerUI from '@swagger-ui/react';
import { toast } from 'sonner';
import { z } from 'zod';

// UI Components
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Hooks and Services
import { useApiKeys } from '@/hooks/use-api-keys';
import { useTheme } from '@/hooks/use-theme';
import { apiClient } from '@/lib/api-client';

// Types
import type { ApiDocsData, ApiKeyInfo, ServiceInfo } from '@/types/api-docs';

// Utilities
import { downloadFile } from '@/utils/file-download';

// Validation Schema
const serviceNameSchema = z.string().min(1, 'Service name is required');

/**
 * Main Next.js page component for API documentation viewing and interaction.
 * Serves as the primary route for displaying Swagger UI documentation with React 19 integration.
 * 
 * Features:
 * - @swagger-ui/react integration for interactive API documentation
 * - React Query for intelligent caching and synchronization 
 * - Next.js server components for initial page loads
 * - Tailwind CSS styling with dark mode support
 * - Real-time validation and error handling
 * - API key management with clipboard functionality
 * - OpenAPI specification download capabilities
 */
export default function ApiDocsPage() {
  const router = useRouter();
  const params = useParams();
  const { theme, isDarkMode } = useTheme();
  
  // State management
  const [currentServiceId, setCurrentServiceId] = useState<number | null>(null);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [swaggerConfig, setSwaggerConfig] = useState<any>(null);
  
  // Refs for SwaggerUI integration
  const swaggerRef = useRef<HTMLDivElement>(null);

  // Extract and validate service name from route parameters
  const serviceName = React.useMemo(() => {
    try {
      const rawName = Array.isArray(params?.name) ? params.name[0] : params?.name;
      return serviceNameSchema.parse(rawName);
    } catch (error) {
      console.error('Invalid service name parameter:', error);
      return null;
    }
  }, [params?.name]);

  // Fetch service information based on service name
  const {
    data: serviceInfo,
    isLoading: isLoadingService,
    error: serviceError,
    refetch: refetchService
  } = useQuery({
    queryKey: ['service-info', serviceName],
    queryFn: async (): Promise<ServiceInfo> => {
      if (!serviceName) {
        throw new Error('Service name is required');
      }
      
      const response = await apiClient.get(`/system/service`, {
        params: { filter: `name=${serviceName}` }
      });
      
      if (!response.data?.resource?.[0]) {
        throw new Error(`Service '${serviceName}' not found`);
      }
      
      return response.data.resource[0];
    },
    enabled: !!serviceName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry for 404 errors
      if (error.message.includes('not found')) return false;
      return failureCount < 3;
    }
  });

  // Fetch OpenAPI specification for the service
  const {
    data: apiDocsData,
    isLoading: isLoadingDocs,
    error: docsError,
    refetch: refetchDocs
  } = useQuery({
    queryKey: ['api-docs', serviceName],
    queryFn: async (): Promise<ApiDocsData> => {
      if (!serviceName) {
        throw new Error('Service name is required');
      }
      
      const response = await apiClient.get(`/api/v2/${serviceName}/_doc`);
      
      if (!response.data) {
        throw new Error('API documentation not available');
      }
      
      // Transform keys from snake_case to camelCase for consistency
      const transformedData = transformApiDocKeys(response.data);
      
      return {
        ...transformedData,
        servers: transformedData.servers || [{
          url: `/api/v2/${serviceName}`,
          description: `${serviceName} API Server`
        }]
      };
    },
    enabled: !!serviceName,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });

  // Fetch API keys for the current service
  const {
    data: apiKeys = [],
    isLoading: isLoadingKeys,
    error: keysError
  } = useApiKeys(currentServiceId);

  // Update current service ID when service info changes
  useEffect(() => {
    if (serviceInfo?.id) {
      setCurrentServiceId(serviceInfo.id);
    }
  }, [serviceInfo?.id]);

  // Configure SwaggerUI when data is available
  useEffect(() => {
    if (apiDocsData && !isLoadingDocs) {
      const config = {
        spec: apiDocsData,
        dom_id: '#swagger-ui-container',
        deepLinking: true,
        presets: [
          SwaggerUI.presets.apis,
          SwaggerUI.presets.standalone
        ],
        plugins: [
          SwaggerUI.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        requestInterceptor: (request: any) => {
          // Add authentication headers
          const headers = { ...request.headers };
          
          // Add session token if available
          const sessionToken = getSessionToken();
          if (sessionToken) {
            headers['X-DreamFactory-Session-Token'] = sessionToken;
          }
          
          // Add API key if selected
          if (selectedApiKey) {
            headers['X-DreamFactory-API-Key'] = selectedApiKey;
          }
          
          return {
            ...request,
            headers
          };
        },
        responseInterceptor: (response: any) => {
          // Log responses for debugging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Swagger UI Response:', response);
          }
          return response;
        },
        onComplete: () => {
          console.log('SwaggerUI loaded successfully');
        },
        onFailure: (error: any) => {
          console.error('SwaggerUI failed to load:', error);
          toast.error('Failed to load API documentation');
        }
      };
      
      setSwaggerConfig(config);
    }
  }, [apiDocsData, isLoadingDocs, selectedApiKey]);

  // Apply theme changes to SwaggerUI
  useEffect(() => {
    if (swaggerRef.current) {
      const container = swaggerRef.current;
      
      if (isDarkMode) {
        container.classList.add('swagger-ui-dark');
        container.classList.remove('swagger-ui-light');
      } else {
        container.classList.add('swagger-ui-light');
        container.classList.remove('swagger-ui-dark');
      }
    }
  }, [isDarkMode]);

  // Navigation handlers
  const handleGoBackToList = React.useCallback(() => {
    // Clear current service selection and navigate back
    setCurrentServiceId(null);
    setSelectedApiKey('');
    router.push('/adf-api-docs');
  }, [router]);

  // File download handler
  const handleDownloadApiDoc = React.useCallback(async () => {
    if (!apiDocsData) {
      toast.error('No API documentation available to download');
      return;
    }

    try {
      const filename = `${serviceName || 'api'}-spec.json`;
      const content = JSON.stringify(apiDocsData, null, 2);
      
      await downloadFile(content, filename, 'application/json');
      
      toast.success(`API specification downloaded: ${filename}`);
    } catch (error) {
      console.error('Failed to download API documentation:', error);
      toast.error('Failed to download API documentation');
    }
  }, [apiDocsData, serviceName]);

  // API key clipboard handler
  const handleCopyApiKey = React.useCallback(async (apiKey: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success('API key copied to clipboard');
    } catch (error) {
      console.error('Failed to copy API key:', error);
      toast.error('Failed to copy API key to clipboard');
    }
  }, []);

  // Handle API key selection
  const handleApiKeySelect = React.useCallback((keyValue: string) => {
    setSelectedApiKey(keyValue);
    toast.info('API key selected for authentication');
  }, []);

  // Loading state
  if (isLoadingService || isLoadingDocs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
          Loading API documentation...
        </span>
      </div>
    );
  }

  // Error state
  if (serviceError || docsError) {
    const error = serviceError || docsError;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Failed to Load API Documentation
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error?.message || 'An unexpected error occurred'}
          </p>
          <div className="space-x-3">
            <Button onClick={() => refetchService()} variant="outline">
              Retry Service
            </Button>
            <Button onClick={() => refetchDocs()} variant="outline">
              Retry Documentation
            </Button>
            <Button onClick={handleGoBackToList} variant="secondary">
              Back to List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Service not found
  if (!serviceInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Service Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The service '{serviceName}' could not be found.
          </p>
          <Button onClick={handleGoBackToList} variant="primary">
            Back to Service List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<ApiDocsErrorFallback onRetry={refetchDocs} onGoBack={handleGoBackToList} />}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleGoBackToList}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <span>Back to List</span>
            </Button>
            
            <Button 
              onClick={handleDownloadApiDoc}
              variant="secondary"
              size="sm"
              disabled={!apiDocsData}
              className="flex items-center space-x-2"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <span>Download API Spec</span>
            </Button>
          </div>

          {/* Service Information */}
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {serviceInfo.label || serviceInfo.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              API Documentation
            </p>
          </div>
        </div>

        {/* API Key Selection */}
        {apiKeys.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              API Authentication
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <Select value={selectedApiKey} onValueChange={handleApiKeySelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an API key for testing..." />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys.map((key: ApiKeyInfo) => (
                      <SelectItem key={key.apiKey} value={key.apiKey}>
                        <div className="flex flex-col">
                          <span className="font-medium">{key.name}</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {key.apiKey.substring(0, 8)}...
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedApiKey && (
                <Button
                  onClick={() => handleCopyApiKey(selectedApiKey)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <svg 
                    className="w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                  <span>Copy Key</span>
                </Button>
              )}
            </div>
            
            {isLoadingKeys && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <LoadingSpinner size="sm" />
                <span>Loading API keys...</span>
              </div>
            )}
            
            {keysError && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                Failed to load API keys: {keysError.message}
              </div>
            )}
          </div>
        )}

        {/* SwaggerUI Container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div 
            ref={swaggerRef}
            className={`swagger-ui-container ${isDarkMode ? 'swagger-ui-dark' : 'swagger-ui-light'}`}
          >
            {swaggerConfig && apiDocsData ? (
              <SwaggerUI {...swaggerConfig} />
            ) : (
              <div className="flex items-center justify-center p-12">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">
                  Initializing SwaggerUI...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Error fallback component for API docs failures
 */
function ApiDocsErrorFallback({ 
  onRetry, 
  onGoBack 
}: { 
  onRetry: () => void; 
  onGoBack: () => void; 
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          API Documentation Error
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Something went wrong while loading the API documentation.
        </p>
        <div className="space-x-3">
          <Button onClick={onRetry} variant="primary">
            Try Again
          </Button>
          <Button onClick={onGoBack} variant="outline">
            Back to List
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility function to get session token from storage or context
 * This would typically come from your authentication system
 */
function getSessionToken(): string | null {
  try {
    // This would be replaced with your actual session management
    // For example, from a React Context, localStorage, or cookies
    return localStorage.getItem('df-session-token') || 
           sessionStorage.getItem('df-session-token');
  } catch (error) {
    console.warn('Failed to get session token:', error);
    return null;
  }
}

/**
 * Transform API documentation keys from snake_case to camelCase
 * for consistency with React/TypeScript conventions
 */
function transformApiDocKeys(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(transformApiDocKeys);
  }
  
  if (typeof data === 'object') {
    const transformed: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      transformed[camelKey] = transformApiDocKeys(value);
    }
    
    return transformed;
  }
  
  return data;
}