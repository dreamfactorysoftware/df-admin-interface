/**
 * OpenAPI Viewer Component
 * 
 * Main React component for displaying interactive OpenAPI documentation using @swagger-ui/react.
 * Integrates SwaggerUI with theme support, API key authentication, file download capabilities,
 * and navigation controls. Replaces the Angular df-api-docs.component.ts with React hooks
 * for state management and Next.js patterns for authentication header injection.
 * 
 * Features:
 * - @swagger-ui/react integration for OpenAPI documentation rendering
 * - Theme support (light/dark) with automatic detection
 * - API key authentication and management
 * - File download capabilities for OpenAPI specifications
 * - Navigation controls using Next.js useRouter
 * - React Query for intelligent caching and synchronization
 * - MSW integration for API testing capabilities
 * - Accessibility features and responsive design
 * - Error boundaries and loading states
 * 
 * @fileoverview OpenAPI viewer component implementing F-006 API Documentation and Testing requirements
 * @version 1.0.0
 * @since React 19.0.0 + Next.js 15.1 + TypeScript 5.8+
 */

'use client';

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  Suspense 
} from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import SwaggerUI from '@swagger-ui/react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

// Component imports
import { ApiKeySelector } from './api-key-selector';
import { Button } from '@/components/ui/button';

// Type imports
import type { 
  OpenAPIPreviewProps,
  OpenAPISpecification,
  ApiKeyInfo,
  ServiceInfo,
  SwaggerUIConfig,
  ApiCallInfo,
  AuthInfo,
  ValidationError
} from './types';

// Hook imports - these will be created as part of the migration
import { useApiDocs } from '@/hooks/use-api-docs';
import { useTheme } from '@/hooks/use-theme';

// Utility imports - these will be created as part of the migration
import { downloadFile, saveAsFile } from '@/lib/file-utils';
import { createSwaggerUIConfig, injectAuthHeaders } from '@/lib/swagger-ui';

// Icon imports
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  ClipboardIcon,
  ExclamationTriangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Default Swagger UI configuration for DreamFactory
 */
const DEFAULT_SWAGGER_CONFIG: Partial<SwaggerUIConfig> = {
  layout: 'BaseLayout',
  deepLinking: true,
  displayOperationId: false,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  defaultModelRendering: 'example',
  displayRequestDuration: true,
  docExpansion: 'list',
  filter: true,
  showExtensions: false,
  showCommonExtensions: false,
  tryItOutEnabled: true,
  persistAuthorization: true,
  validatorUrl: null, // Disable validator for better performance
  oauth2RedirectUrl: undefined,
  // DreamFactory-specific extensions
  'x-dreamfactory-baseUrl': process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v2',
};

/**
 * MSW handlers for API testing (development only)
 */
const MSW_ENABLED = process.env.NODE_ENV === 'development' && 
                   process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Props validation schema
 */
const OpenAPIViewerPropsSchema = z.object({
  serviceId: z.string().optional(),
  serviceName: z.string().optional(),
  openApiSpec: z.any().optional(), // OpenAPISpecification schema is complex
  apiKey: z.string().optional(),
  sessionToken: z.string().optional(),
  baseUrl: z.string().url().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional().default('auto'),
  className: z.string().optional(),
  style: z.any().optional(),
  showTryItOut: z.boolean().optional().default(true),
  showCodeSamples: z.boolean().optional().default(true),
  enableAuth: z.boolean().optional().default(true),
  autoLoadSpec: z.boolean().optional().default(true),
  refreshInterval: z.number().positive().optional(),
  onSpecLoaded: z.function().optional(),
  onApiCall: z.function().optional(),
  onError: z.function().optional(),
  onAuthSuccess: z.function().optional(),
  onAuthFailure: z.function().optional(),
  fallback: z.any().optional(),
  loadingComponent: z.any().optional(),
  errorBoundary: z.any().optional(),
}).strict();

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook for managing OpenAPI spec loading and caching
 */
function useOpenAPISpec(serviceId?: string, serviceName?: string, autoLoad = true) {
  const { data: spec, isLoading, error, refetch } = useQuery({
    queryKey: ['openapi-spec', serviceId, serviceName],
    queryFn: async (): Promise<OpenAPISpecification> => {
      if (!serviceId && !serviceName) {
        throw new Error('Either serviceId or serviceName is required');
      }

      // Build the API endpoint
      let endpoint = '/api/v2/system/service';
      if (serviceId) {
        endpoint += `/${serviceId}/_spec`;
      } else if (serviceName) {
        endpoint += `?filter=name=${encodeURIComponent(serviceName)}`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers if available
          ...(typeof window !== 'undefined' && sessionStorage.getItem('session_token') && {
            'X-DreamFactory-Session-Token': sessionStorage.getItem('session_token')!
          }),
          ...(typeof window !== 'undefined' && sessionStorage.getItem('api_key') && {
            'X-DreamFactory-API-Key': sessionStorage.getItem('api_key')!
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (serviceName && data.resource && Array.isArray(data.resource)) {
        // If we searched by name, take the first result and fetch its spec
        const service = data.resource[0];
        if (!service) {
          throw new Error(`Service not found: ${serviceName}`);
        }
        
        // Fetch the actual spec
        const specResponse = await fetch(`/api/v2/system/service/${service.id}/_spec`, {
          headers: response.headers,
        });
        
        if (!specResponse.ok) {
          throw new Error(`Failed to fetch spec for service ${service.id}`);
        }
        
        return await specResponse.json();
      }
      
      return data;
    },
    enabled: autoLoad && (!!serviceId || !!serviceName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for 404s
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    spec,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for managing API keys for the current service
 */
function useServiceApiKeys(serviceId?: string) {
  const { data: apiKeys = [], isLoading, error, refetch } = useQuery({
    queryKey: ['service-api-keys', serviceId],
    queryFn: async (): Promise<ApiKeyInfo[]> => {
      if (!serviceId || serviceId === '-1') {
        return [];
      }

      // Fetch roles with service access
      const rolesResponse = await fetch(
        `/api/v2/system/role?related=role_service_access_by_role_id&filter=role_service_access_by_role_id.service_id=${serviceId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-DreamFactory-Session-Token': sessionStorage.getItem('session_token') || '',
          },
        }
      );

      // Fetch apps with role access
      const appsResponse = await fetch(
        `/api/v2/system/app?filter=role_id=${serviceId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-DreamFactory-Session-Token': sessionStorage.getItem('session_token') || '',
          },
        }
      );

      const [rolesData, appsData] = await Promise.all([
        rolesResponse.ok ? rolesResponse.json() : { resource: [] },
        appsResponse.ok ? appsResponse.json() : { resource: [] },
      ]);

      const apiKeys: ApiKeyInfo[] = [];

      // Process roles
      if (rolesData.resource) {
        rolesData.resource.forEach((role: any) => {
          if (role.name && role.id) {
            apiKeys.push({
              id: `role-${role.id}`,
              name: `Role: ${role.name}`,
              key: role.api_key || '',
              createdAt: role.created_date || new Date().toISOString(),
              permissions: [{
                resource: `service-${serviceId}`,
                actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
              }],
              isActive: true,
            });
          }
        });
      }

      // Process apps
      if (appsData.resource) {
        appsData.resource.forEach((app: any) => {
          if (app.name && app.api_key) {
            apiKeys.push({
              id: `app-${app.id}`,
              name: `App: ${app.name}`,
              key: app.api_key,
              createdAt: app.created_date || new Date().toISOString(),
              permissions: [{
                resource: `service-${serviceId}`,
                actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
              }],
              isActive: app.is_active !== false,
            });
          }
        });
      }

      return apiKeys;
    },
    enabled: !!serviceId && serviceId !== '-1',
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    apiKeys,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for clipboard operations with user feedback
 */
function useClipboard() {
  const [status, setStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      setStatus('copying');
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Copy command failed');
        }
      }
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
      return false;
    }
  }, []);

  return { copyToClipboard, status };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * OpenAPI Viewer Component
 * 
 * Main component for displaying interactive OpenAPI documentation with authentication,
 * theming, and file download capabilities.
 */
export function OpenAPIViewer({
  serviceId,
  serviceName,
  openApiSpec: providedSpec,
  apiKey: providedApiKey,
  sessionToken: providedSessionToken,
  baseUrl = '/api/v2',
  theme = 'auto',
  className,
  style,
  showTryItOut = true,
  showCodeSamples = true,
  enableAuth = true,
  autoLoadSpec = true,
  refreshInterval,
  onSpecLoaded,
  onApiCall,
  onError,
  onAuthSuccess,
  onAuthFailure,
  fallback,
  loadingComponent,
  errorBoundary,
}: OpenAPIPreviewProps) {
  // Props validation
  const validationResult = OpenAPIViewerPropsSchema.safeParse({
    serviceId,
    serviceName,
    openApiSpec: providedSpec,
    apiKey: providedApiKey,
    sessionToken: providedSessionToken,
    baseUrl,
    theme,
    className,
    style,
    showTryItOut,
    showCodeSamples,
    enableAuth,
    autoLoadSpec,
    refreshInterval,
    onSpecLoaded,
    onApiCall,
    onError,
    onAuthSuccess,
    onAuthFailure,
    fallback,
    loadingComponent,
    errorBoundary,
  });

  if (!validationResult.success) {
    console.error('Invalid props for OpenAPIViewer:', validationResult.error);
  }

  // Router and params
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Extract service info from URL params if not provided
  const currentServiceId = serviceId || (params?.serviceId as string);
  const currentServiceName = serviceName || (params?.serviceName as string);

  // State management
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string | null>(null);
  const [swaggerInstance, setSwaggerInstance] = useState<any>(null);
  const [apiCallHistory, setApiCallHistory] = useState<ApiCallInfo[]>([]);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Refs
  const swaggerContainerRef = useRef<HTMLDivElement>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const { theme: currentTheme, isDark } = useTheme();
  const { spec: fetchedSpec, isLoading: isLoadingSpec, error: specError, refetch: refetchSpec } = useOpenAPISpec(
    currentServiceId, 
    currentServiceName, 
    autoLoadSpec && !providedSpec
  );
  const { apiKeys, isLoading: isLoadingKeys, error: keysError, refetch: refetchKeys } = useServiceApiKeys(currentServiceId);
  const { copyToClipboard, status: clipboardStatus } = useClipboard();

  // Determine the final OpenAPI spec to use
  const openApiSpec = useMemo(() => {
    return providedSpec || fetchedSpec;
  }, [providedSpec, fetchedSpec]);

  // Selected API key info
  const selectedApiKey = useMemo(() => {
    return selectedApiKeyId ? apiKeys.find(key => key.id === selectedApiKeyId) : null;
  }, [selectedApiKeyId, apiKeys]);

  // Auto-select first API key if available
  useEffect(() => {
    if (!selectedApiKeyId && apiKeys.length > 0 && enableAuth) {
      const firstActiveKey = apiKeys.find(key => key.isActive);
      if (firstActiveKey) {
        setSelectedApiKeyId(firstActiveKey.id);
      }
    }
  }, [selectedApiKeyId, apiKeys, enableAuth]);

  // Handle spec loading callback
  useEffect(() => {
    if (openApiSpec && onSpecLoaded) {
      onSpecLoaded(openApiSpec);
    }
  }, [openApiSpec, onSpecLoaded]);

  // Auto-refresh functionality
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimeoutRef.current = setInterval(() => {
        refetchSpec();
        refetchKeys();
      }, refreshInterval);

      return () => {
        if (refreshTimeoutRef.current) {
          clearInterval(refreshTimeoutRef.current);
        }
      };
    }
  }, [refreshInterval, refetchSpec, refetchKeys]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearInterval(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Create Swagger UI configuration
  const swaggerConfig = useMemo((): SwaggerUIConfig => {
    const config: SwaggerUIConfig = {
      ...DEFAULT_SWAGGER_CONFIG,
      spec: openApiSpec,
      domNode: swaggerContainerRef.current,
      tryItOutEnabled: showTryItOut,
      showCommonExtensions: showCodeSamples,
      requestInterceptor: (request: any) => {
        try {
          // Track API calls
          const callInfo: ApiCallInfo = {
            id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            method: request.method || 'GET',
            url: request.url || '',
            headers: { ...request.headers },
            body: request.body,
            status: 'pending',
          };

          setApiCallHistory(prev => [...prev.slice(-9), callInfo]);

          if (onApiCall) {
            onApiCall(callInfo);
          }

          // Inject authentication headers
          const authHeaders = injectAuthHeaders(
            selectedApiKey?.key || providedApiKey,
            providedSessionToken || (typeof window !== 'undefined' ? sessionStorage.getItem('session_token') : null),
            baseUrl
          );

          Object.assign(request.headers, authHeaders);

          // URL parameter decoding
          if (request.url) {
            try {
              const url = new URL(request.url);
              const params = new URLSearchParams(url.search);
              
              // Decode all parameters
              const decodedParams = new URLSearchParams();
              params.forEach((value, key) => {
                decodedParams.set(key, decodeURIComponent(value));
              });
              
              url.search = decodedParams.toString();
              request.url = url.toString();
            } catch (urlError) {
              console.warn('Failed to process URL parameters:', urlError);
            }
          }

          return request;
        } catch (error) {
          console.error('Request interceptor error:', error);
          return request;
        }
      },
      responseInterceptor: (response: any) => {
        try {
          // Update API call history with response
          setApiCallHistory(prev => 
            prev.map(call => 
              call.status === 'pending' && 
              Math.abs(new Date(call.timestamp).getTime() - Date.now()) < 30000
                ? {
                    ...call,
                    status: response.status >= 200 && response.status < 300 ? 'success' as const : 'error' as const,
                    response: {
                      statusCode: response.status,
                      statusText: response.statusText || '',
                      headers: response.headers || {},
                      body: response.body,
                      size: response.body ? JSON.stringify(response.body).length : 0,
                      contentType: response.headers?.['content-type'] || '',
                    },
                    duration: Math.abs(new Date(call.timestamp).getTime() - Date.now()),
                  }
                : call
            )
          );

          return response;
        } catch (error) {
          console.error('Response interceptor error:', error);
          return response;
        }
      },
      onComplete: () => {
        console.log('SwaggerUI loaded successfully');
      },
      onFailure: (error: any) => {
        console.error('SwaggerUI failed to load:', error);
        if (onError) {
          onError(error);
        }
      },
      // DreamFactory-specific extensions
      'x-dreamfactory-service': currentServiceName,
      'x-dreamfactory-baseUrl': baseUrl,
      'x-dreamfactory-apiKey': selectedApiKey?.key || providedApiKey,
      'x-dreamfactory-sessionToken': providedSessionToken,
    };

    return config;
  }, [
    openApiSpec,
    showTryItOut,
    showCodeSamples,
    selectedApiKey,
    providedApiKey,
    providedSessionToken,
    baseUrl,
    currentServiceName,
    onApiCall,
    onError,
  ]);

  // Navigation handlers
  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDownloadSpec = useCallback(async () => {
    if (!openApiSpec) {
      console.warn('No OpenAPI spec available for download');
      return;
    }

    try {
      const filename = `api-spec-${currentServiceName || currentServiceId || 'unknown'}.json`;
      const content = JSON.stringify(openApiSpec, null, 2);
      
      await saveAsFile(content, filename, 'application/json');
    } catch (error) {
      console.error('Failed to download API spec:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [openApiSpec, currentServiceName, currentServiceId, onError]);

  const handleApiKeySelect = useCallback((keyId: string | null, keyInfo: ApiKeyInfo | null) => {
    setSelectedApiKeyId(keyId);
    
    if (keyInfo) {
      const authInfo: AuthInfo = {
        type: 'apiKey',
        value: keyInfo.key,
        expiresAt: keyInfo.expiresAt,
        permissions: keyInfo.permissions.map(p => p.resource),
      };
      
      setAuthInfo(authInfo);
      
      if (onAuthSuccess) {
        onAuthSuccess(authInfo);
      }
    } else {
      setAuthInfo(null);
    }
  }, [onAuthSuccess]);

  const handleApiKeyCopied = useCallback(async (keyId: string, success: boolean) => {
    if (success) {
      console.log(`API key ${keyId} copied to clipboard`);
    } else {
      console.error(`Failed to copy API key ${keyId}`);
    }
  }, []);

  // Error handling
  const hasError = specError || keysError;
  const errorMessage = specError?.message || keysError?.message || 'Unknown error occurred';

  // Loading state
  const isLoading = isLoadingSpec || isLoadingKeys;

  // Render loading state
  if (isLoading && !openApiSpec) {
    const LoadingComponent = loadingComponent || (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-sm text-muted-foreground">Loading OpenAPI documentation...</span>
      </div>
    );

    return (
      <div className={cn('openapi-viewer', className)} style={style}>
        {LoadingComponent}
      </div>
    );
  }

  // Render error state
  if (hasError) {
    const ErrorComponent = fallback || (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load API Documentation</h3>
          <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={() => { refetchSpec(); refetchKeys(); }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );

    return (
      <div className={cn('openapi-viewer', className)} style={style}>
        {ErrorComponent}
      </div>
    );
  }

  // Render no spec state
  if (!openApiSpec) {
    return (
      <div className={cn('openapi-viewer', className)} style={style}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center max-w-md">
            <BeakerIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No API Documentation Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The selected service does not have OpenAPI documentation available.
            </p>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'openapi-viewer',
      'w-full min-h-screen',
      isDark && 'dark',
      className
    )} style={style}>
      {/* Header Controls */}
      <div className={cn(
        'flex items-center justify-between gap-4 p-4 border-b border-border',
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      )}>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button variant="outline" onClick={handleDownloadSpec}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Download Spec
          </Button>
        </div>

        {/* API Key Selector */}
        {enableAuth && apiKeys.length > 0 && (
          <div className="max-w-md">
            <ApiKeySelector
              selectedKeyId={selectedApiKeyId}
              onKeySelect={handleApiKeySelect}
              onKeyCopied={handleApiKeyCopied}
              serviceId={currentServiceId}
              showCopyButton={true}
              showKeyPreview={true}
              previewLength={8}
              placeholder="Select API key for testing"
              className="min-w-[280px]"
            />
          </div>
        )}
      </div>

      {/* Swagger UI Container */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2 text-sm text-muted-foreground">Initializing API documentation...</span>
        </div>
      }>
        <div className="swagger-ui-container">
          <SwaggerUI
            spec={openApiSpec}
            {...swaggerConfig}
          />
        </div>
      </Suspense>

      {/* Custom Styles for Swagger UI Integration */}
      <style jsx global>{`
        .swagger-ui-container {
          min-height: calc(100vh - 80px);
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .scheme-container {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        
        /* Dark theme adjustments */
        .dark .swagger-ui {
          filter: invert(1) hue-rotate(180deg);
        }
        
        .dark .swagger-ui img {
          filter: invert(1) hue-rotate(180deg);
        }
        
        /* Button integration */
        .swagger-ui .btn {
          font-family: inherit;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .openapi-viewer .flex {
            flex-direction: column;
            align-items: stretch;
          }
          
          .swagger-ui-container {
            min-height: calc(100vh - 120px);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// Component Exports and Display Name
// ============================================================================

OpenAPIViewer.displayName = 'OpenAPIViewer';

export default OpenAPIViewer;

// Export additional types for external use
export type { 
  OpenAPIPreviewProps,
  SwaggerUIConfig,
  ApiCallInfo,
  AuthInfo
};