'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SwaggerUI from '@swagger-ui/react';
import '@swagger-ui/react/swagger-ui-css';
import { Copy, Download, ArrowLeft, FileText } from 'lucide-react';

// Types based on Angular implementation
interface ApiKeyInfo {
  name: string;
  apiKey: string;
}

interface ServiceResponse {
  resource: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

interface OpenAPISpec {
  paths: Record<string, any>;
  [key: string]: any;
}

// Mock hooks implementations - these will be replaced by actual hooks
const useApiKeys = (serviceId: number): { data: ApiKeyInfo[]; isLoading: boolean; error: Error | null } => {
  return useQuery({
    queryKey: ['api-keys', serviceId],
    queryFn: async () => {
      if (serviceId === -1) return [];
      
      // Mock implementation - replace with actual API call
      const response = await fetch(`/api/system/service/${serviceId}/api-keys`);
      if (!response.ok) throw new Error('Failed to fetch API keys');
      return response.json();
    },
    enabled: serviceId !== -1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    // Check system preference and localStorage
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setIsDarkMode(savedTheme === 'dark' || (savedTheme === 'system' && systemPrefersDark));
  }, []);
  
  return { isDarkMode };
};

const useToast = () => ({
  toast: useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    // Mock implementation - replace with actual toast hook
    console.log(`Toast ${type}: ${message}`);
  }, [])
});

const useApiClient = () => ({
  get: useCallback(async (url: string, config?: RequestInit) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1];
    
    const response = await fetch(url, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-Session-Token': token || '',
        'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY || '',
        ...config?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }, [])
});

// File download utility
const downloadApiDoc = (data: any, filename: string = 'api-spec.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  anchor.click();
  window.URL.revokeObjectURL(url);
};

// Case transformation utilities
const mapCamelToSnake = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(mapCamelToSnake);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = mapCamelToSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const mapSnakeToCamel = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(mapSnakeToCamel);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = mapSnakeToCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

/**
 * API Documentation Page Component
 * 
 * Main Next.js page component for displaying Swagger UI documentation with React 19 integration.
 * Replaces Angular df-api-docs.component.ts with enhanced server-side rendering capabilities,
 * @swagger-ui/react integration, and modern React patterns.
 * 
 * Features:
 * - Interactive Swagger UI for API documentation viewing
 * - API key management and copying functionality
 * - Dark/light theme support with system preference detection
 * - File download capabilities for OpenAPI specifications
 * - Real-time API specification fetching with intelligent caching
 * - Enhanced error handling and loading states
 */
export default function ApiDocsPage() {
  const params = useParams();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { toast } = useToast();
  const apiClient = useApiClient();
  
  // State management
  const [currentServiceId, setCurrentServiceId] = useState<number>(-1);
  const [apiDocJson, setApiDocJson] = useState<OpenAPISpec | null>(null);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  
  // Extract service name from route parameters
  const serviceName = Array.isArray(params.name) ? params.name[0] : params.name;
  
  // Fetch service ID by name
  const { data: serviceData, isLoading: serviceLoading } = useQuery({
    queryKey: ['service-by-name', serviceName],
    queryFn: async () => {
      if (!serviceName) return null;
      const response = await apiClient.get(`/api/v2/system/service?filter=name=${serviceName}`);
      return response as ServiceResponse;
    },
    enabled: !!serviceName,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  
  // Fetch API documentation data
  const { data: apiDocData, isLoading: docLoading, error: docError } = useQuery({
    queryKey: ['api-docs', serviceName],
    queryFn: async () => {
      if (!serviceName) return null;
      // This would come from route data in Angular - simulate API call
      const response = await apiClient.get(`/api/v2/${serviceName}/_schema`);
      return response as OpenAPISpec;
    },
    enabled: !!serviceName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch API keys for the current service
  const { data: apiKeys = [], isLoading: keysLoading } = useApiKeys(currentServiceId);
  
  // Update current service ID when service data changes
  useEffect(() => {
    if (serviceData?.resource?.[0]?.id) {
      const serviceId = serviceData.resource[0].id;
      setCurrentServiceId(serviceId);
      // Store in localStorage for persistence
      localStorage.setItem('current-service-id', serviceId.toString());
    }
  }, [serviceData]);
  
  // Process API documentation data
  useEffect(() => {
    if (apiDocData) {
      let processedData = apiDocData;
      
      // Apply case transformation based on service type
      if (
        processedData.paths['/']?.get &&
        processedData.paths['/']?.get.operationId &&
        processedData.paths['/']?.get.operationId === 'getSoapResources'
      ) {
        processedData = { ...processedData, paths: mapSnakeToCamel(processedData.paths) };
      } else {
        processedData = { ...processedData, paths: mapCamelToSnake(processedData.paths) };
      }
      
      setApiDocJson(processedData);
    }
  }, [apiDocData]);
  
  // Handle navigation back to service list
  const handleGoBack = useCallback(() => {
    // Clear current service from localStorage
    localStorage.removeItem('current-service-id');
    setCurrentServiceId(-1);
    router.back();
  }, [router]);
  
  // Handle API specification download
  const handleDownloadApiDoc = useCallback(() => {
    if (apiDocJson) {
      downloadApiDoc(apiDocJson, `${serviceName || 'api'}-spec.json`);
      toast('API specification downloaded successfully');
    }
  }, [apiDocJson, serviceName, toast]);
  
  // Handle API key copy to clipboard
  const handleCopyApiKey = useCallback(async (apiKey: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast(`API Key "${keyName}" copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy API key:', error);
      toast('Failed to copy API key', 'error');
    }
  }, [toast]);
  
  // Swagger UI request interceptor
  const requestInterceptor = useCallback((req: any) => {
    // Get session token from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1];
    
    // Add authentication headers
    if (token) {
      req.headers['X-DreamFactory-Session-Token'] = token;
    }
    
    if (process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY) {
      req.headers['X-DreamFactory-API-Key'] = process.env.NEXT_PUBLIC_DF_API_DOCS_API_KEY;
    }
    
    // Add selected API key if available
    if (selectedApiKey) {
      req.headers['X-DreamFactory-API-Key'] = selectedApiKey;
    }
    
    // Parse and decode URL parameters
    try {
      const url = new URL(req.url);
      const params = new URLSearchParams(url.search);
      
      // Decode all parameters
      params.forEach((value, key) => {
        params.set(key, decodeURIComponent(value));
      });
      
      // Update the URL with decoded parameters
      url.search = params.toString();
      req.url = url.toString();
    } catch (error) {
      console.warn('Failed to process URL parameters:', error);
    }
    
    return req;
  }, [selectedApiKey]);
  
  // Loading state
  if (serviceLoading || docLoading) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 bg-gray-300 rounded w-24"></div>
              <div className="h-8 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="h-96 bg-gray-300 rounded mb-4"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (docError) {
    return (
      <div className={`min-h-screen p-6 transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load API Documentation</h2>
            <p className="text-gray-500 mb-4">
              {docError.message || 'Unable to load API documentation for this service.'}
            </p>
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <button
            onClick={handleGoBack}
            className={`inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
              isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
          
          <button
            onClick={handleDownloadApiDoc}
            disabled={!apiDocJson}
            className={`inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download API Spec
          </button>
        </div>
        
        {/* API Keys Section */}
        {apiKeys.length > 0 && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg border ${
              isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <label className="block text-sm font-medium mb-3">
                API Keys for Testing
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {apiKeys.map((keyInfo, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-md border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {keyInfo.name}
                      </div>
                      <div className={`text-xs font-mono truncate ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {keyInfo.apiKey.slice(0, 8)}...
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyApiKey(keyInfo.apiKey, keyInfo.name)}
                      className={`ml-2 p-1.5 rounded-md transition-colors ${
                        isDarkMode
                          ? 'hover:bg-gray-600 text-gray-300 hover:text-white'
                          : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                      }`}
                      title="Copy API Key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* API Keys Loading State */}
        {keysLoading && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-32 mb-3"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Swagger UI Container */}
        <div className={`rounded-lg border overflow-hidden ${
          isDarkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          {apiDocJson ? (
            <div className={`swagger-ui-container ${isDarkMode ? 'swagger-ui-dark' : ''}`}>
              <SwaggerUI
                spec={apiDocJson}
                requestInterceptor={requestInterceptor}
                docExpansion="list"
                defaultModelExpandDepth={2}
                showMutatedRequest={true}
                tryItOutEnabled={true}
                filter={true}
                layout="BaseLayout"
                deepLinking={true}
                displayOperationId={false}
                defaultModelsExpandDepth={1}
                displayRequestDuration={true}
                persistAuthorization={true}
                withCredentials={true}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No API documentation available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Swagger UI Styles */}
      <style jsx global>{`
        .swagger-ui-container {
          font-family: inherit;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        ${isDarkMode ? `
          .swagger-ui {
            color: #e5e7eb;
          }
          
          .swagger-ui .scheme-container {
            background: #374151;
            border: 1px solid #4b5563;
          }
          
          .swagger-ui .opblock {
            background: #374151;
            border: 1px solid #4b5563;
          }
          
          .swagger-ui .opblock.opblock-post {
            background: #1e3a8a;
            border-color: #3b82f6;
          }
          
          .swagger-ui .opblock.opblock-get {
            background: #065f46;
            border-color: #10b981;
          }
          
          .swagger-ui .opblock.opblock-put {
            background: #92400e;
            border-color: #f59e0b;
          }
          
          .swagger-ui .opblock.opblock-delete {
            background: #991b1b;
            border-color: #ef4444;
          }
          
          .swagger-ui .btn {
            background: #4b5563;
            color: #e5e7eb;
            border: 1px solid #6b7280;
          }
          
          .swagger-ui .btn:hover {
            background: #6b7280;
          }
          
          .swagger-ui .response-col_status {
            color: #e5e7eb;
          }
          
          .swagger-ui .parameter__name {
            color: #e5e7eb;
          }
          
          .swagger-ui .parameter__type {
            color: #9ca3af;
          }
          
          .swagger-ui .model {
            background: #374151;
            border: 1px solid #4b5563;
          }
          
          .swagger-ui .model-box {
            background: #374151;
          }
          
          .swagger-ui input, 
          .swagger-ui select, 
          .swagger-ui textarea {
            background: #374151;
            color: #e5e7eb;
            border: 1px solid #4b5563;
          }
          
          .swagger-ui .response-content-type {
            color: #e5e7eb;
          }
        ` : ''}
      `}</style>
    </div>
  );
}