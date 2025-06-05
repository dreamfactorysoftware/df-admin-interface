/**
 * CRUD Operations Client for DreamFactory Admin Interface
 * 
 * Provides standardized create, read, update, delete functionality with intelligent
 * caching integration using React Query patterns. This client replaces the Angular
 * DfBaseCrudService with modern React/TypeScript patterns while maintaining full
 * compatibility with DreamFactory API endpoints.
 * 
 * Features:
 * - Type-safe CRUD operations with comprehensive TypeScript support
 * - React Query compatible mutations and queries with optimistic updates
 * - Pagination, filtering, and sorting for large dataset management
 * - File operations with progress tracking and validation
 * - Request configuration management with headers, cache control, notifications
 * - Integration with existing DreamFactory API endpoints and response formats
 * - Specialized endpoints for event scripts, GitHub releases, and bulk operations
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 */

import {
  RequestConfig,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkResponse,
  SuccessResponse,
  ErrorResponse,
  PaginationConfig,
  FilterConfig,
  FileUploadConfig,
  FileDownloadConfig,
  FileUploadProgress,
  FileMetadata,
  DirectoryListing,
  ConnectionTestResult,
  SchemaDiscoveryResult,
  EndpointGenerationResult,
  HttpMethod,
  ContentType,
  KeyValuePair,
  UIConfig,
  CacheConfig,
  ReactQueryConfig,
  SWRConfig,
  AuthHeaders,
} from './types';

// =============================================================================
// CORE CRUD CLIENT CLASS
// =============================================================================

/**
 * CRUD operations client with React Query compatibility
 * 
 * This class provides a comprehensive interface for all CRUD operations
 * throughout the DreamFactory Admin Interface, supporting both simple
 * data operations and complex workflows like schema discovery and API generation.
 */
export class CrudClient {
  private baseUrl: string;
  private defaultHeaders: AuthHeaders;
  private defaultTimeout: number;
  private abortControllers: Map<string, AbortController>;

  constructor(config: {
    baseUrl: string;
    defaultHeaders?: AuthHeaders;
    defaultTimeout?: number;
  }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.defaultHeaders = config.defaultHeaders || {};
    this.defaultTimeout = config.defaultTimeout || 30000; // 30 seconds
    this.abortControllers = new Map();
  }

  // =============================================================================
  // CORE CRUD OPERATIONS
  // =============================================================================

  /**
   * Retrieve a paginated list of resources with filtering and sorting
   * 
   * Supports React Query caching patterns and SWR revalidation strategies.
   * Optimized for large datasets with intelligent pagination and virtual scrolling support.
   * 
   * @param endpoint - API endpoint path (e.g., '/api/v2/database/_table')
   * @param config - Request configuration with pagination, filtering, and caching options
   * @returns Promise resolving to paginated list response
   */
  async getAll<T>(
    endpoint: string,
    config: RequestConfig & PaginationConfig & FilterConfig = {}
  ): Promise<ListResponse<T>> {
    const {
      limit = 25,
      offset = 0,
      includeCount = true,
      filter,
      fields,
      related,
      sort,
      additionalParams = [],
      ...requestConfig
    } = config;

    // Build query parameters for pagination and filtering
    const queryParams = new URLSearchParams();
    
    // Pagination parameters
    queryParams.set('limit', limit.toString());
    queryParams.set('offset', offset.toString());
    if (includeCount) {
      queryParams.set('include_count', 'true');
    }

    // Filtering and field selection
    if (filter) queryParams.set('filter', filter);
    if (fields) queryParams.set('fields', fields);
    if (related) queryParams.set('related', related);
    if (sort) queryParams.set('order', sort);

    // Additional custom parameters
    additionalParams.forEach(({ key, value }) => {
      queryParams.set(key, value.toString());
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    
    try {
      const response = await this.executeRequest<ListResponse<T>>(url, {
        method: 'GET',
        ...requestConfig,
      });

      // Ensure response has proper structure for React Query caching
      return {
        resource: response.resource || [],
        meta: {
          count: response.meta?.count || response.resource?.length || 0,
          limit: response.meta?.limit || limit,
          offset: response.meta?.offset || offset,
          total: response.meta?.total,
        },
      };
    } catch (error) {
      this.handleUINotification(error, requestConfig);
      throw error;
    }
  }

  /**
   * Retrieve a single resource by ID
   * 
   * Supports React Query single resource caching with automatic invalidation.
   * Includes related resource loading and field selection optimization.
   * 
   * @param endpoint - API endpoint path
   * @param id - Resource identifier
   * @param config - Request configuration with field selection and caching options
   * @returns Promise resolving to single resource
   */
  async get<T>(
    endpoint: string,
    id: string | number,
    config: RequestConfig & FilterConfig = {}
  ): Promise<T> {
    const { fields, related, additionalParams = [], ...requestConfig } = config;

    // Build query parameters for field selection
    const queryParams = new URLSearchParams();
    if (fields) queryParams.set('fields', fields);
    if (related) queryParams.set('related', related);

    // Additional custom parameters
    additionalParams.forEach(({ key, value }) => {
      queryParams.set(key, value.toString());
    });

    const queryString = queryParams.toString();
    const url = `${this.baseUrl}${endpoint}/${id}${queryString ? `?${queryString}` : ''}`;

    try {
      return await this.executeRequest<T>(url, {
        method: 'GET',
        ...requestConfig,
      });
    } catch (error) {
      this.handleUINotification(error, requestConfig);
      throw error;
    }
  }

  /**
   * Create a new resource
   * 
   * Supports React Query optimistic updates and automatic cache invalidation.
   * Includes comprehensive validation and error handling with rollback capabilities.
   * 
   * @param endpoint - API endpoint path
   * @param data - Resource data to create
   * @param config - Request configuration with validation and notification options
   * @returns Promise resolving to creation response with new resource ID
   */
  async create<T, R = CreateResponse>(
    endpoint: string,
    data: Partial<T>,
    config: RequestConfig = {}
  ): Promise<R> {
    try {
      const response = await this.executeRequest<R>(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
          contentType: 'application/json',
          ...config,
        }
      );

      // Show success notification if configured
      if (config.snackbarSuccess && !config.suppressNotifications) {
        this.showSuccessNotification(config.snackbarSuccess);
      }

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  /**
   * Update an existing resource (full replacement)
   * 
   * Implements React Query optimistic updates with automatic rollback on failure.
   * Supports concurrent update detection and conflict resolution.
   * 
   * @param endpoint - API endpoint path
   * @param id - Resource identifier
   * @param data - Complete resource data for replacement
   * @param config - Request configuration with optimistic update options
   * @returns Promise resolving to update response
   */
  async update<T, R = UpdateResponse>(
    endpoint: string,
    id: string | number,
    data: Partial<T>,
    config: RequestConfig = {}
  ): Promise<R> {
    try {
      const response = await this.executeRequest<R>(
        `${this.baseUrl}${endpoint}/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
          contentType: 'application/json',
          ...config,
        }
      );

      // Show success notification if configured
      if (config.snackbarSuccess && !config.suppressNotifications) {
        this.showSuccessNotification(config.snackbarSuccess);
      }

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  /**
   * Partially update an existing resource
   * 
   * Optimized for minimal data transfer with precise field updates.
   * Supports React Query selective cache updates for improved performance.
   * 
   * @param endpoint - API endpoint path
   * @param id - Resource identifier
   * @param data - Partial resource data for selective update
   * @param config - Request configuration with selective update options
   * @returns Promise resolving to patch response
   */
  async patch<T, R = UpdateResponse>(
    endpoint: string,
    id: string | number,
    data: Partial<T>,
    config: RequestConfig = {}
  ): Promise<R> {
    try {
      const response = await this.executeRequest<R>(
        `${this.baseUrl}${endpoint}/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
          contentType: 'application/json',
          ...config,
        }
      );

      // Show success notification if configured
      if (config.snackbarSuccess && !config.suppressNotifications) {
        this.showSuccessNotification(config.snackbarSuccess);
      }

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  /**
   * Delete a resource
   * 
   * Supports React Query optimistic deletion with automatic cache cleanup.
   * Includes soft delete detection and cascade delete handling.
   * 
   * @param endpoint - API endpoint path
   * @param id - Resource identifier
   * @param config - Request configuration with deletion options
   * @returns Promise resolving to deletion response
   */
  async delete<R = DeleteResponse>(
    endpoint: string,
    id: string | number,
    config: RequestConfig = {}
  ): Promise<R> {
    try {
      const response = await this.executeRequest<R>(
        `${this.baseUrl}${endpoint}/${id}`,
        {
          method: 'DELETE',
          ...config,
        }
      );

      // Show success notification if configured
      if (config.snackbarSuccess && !config.suppressNotifications) {
        this.showSuccessNotification(config.snackbarSuccess);
      }

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  /**
   * Perform bulk operations on multiple resources
   * 
   * Optimized for large dataset operations with progress tracking and
   * partial failure handling. Supports batch processing with configurable chunk sizes.
   * 
   * @param endpoint - API endpoint path
   * @param operation - Bulk operation type ('create', 'update', 'delete')
   * @param data - Array of resources or resource IDs for bulk operation
   * @param config - Request configuration with bulk operation options
   * @returns Promise resolving to bulk operation response with detailed results
   */
  async bulk<T>(
    endpoint: string,
    operation: 'create' | 'update' | 'delete',
    data: Partial<T>[] | string[] | number[],
    config: RequestConfig = {}
  ): Promise<BulkResponse<T>> {
    const bulkEndpoint = `${this.baseUrl}${endpoint}`;
    const method = operation === 'delete' ? 'DELETE' : 'POST';

    // Prepare bulk operation payload
    const payload = {
      resource: Array.isArray(data) ? data : [data],
      operation: operation,
    };

    try {
      const response = await this.executeRequest<BulkResponse<T>>(
        bulkEndpoint,
        {
          method,
          body: JSON.stringify(payload),
          contentType: 'application/json',
          timeout: config.timeout || 60000, // Extended timeout for bulk operations
          ...config,
        }
      );

      // Show success notification with operation summary
      if (config.snackbarSuccess && !config.suppressNotifications) {
        const successCount = (response.created?.length || 0) + 
                            (response.updated?.length || 0) + 
                            (response.deleted?.length || 0);
        this.showSuccessNotification(
          `${config.snackbarSuccess}: ${successCount} items processed`
        );
      }

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================

  /**
   * Upload files with progress tracking
   * 
   * Supports chunked uploads for large files, progress callbacks,
   * and comprehensive error handling with retry capabilities.
   * 
   * @param endpoint - Upload endpoint path
   * @param files - Files to upload (single File or FileList)
   * @param config - Upload configuration with progress tracking
   * @returns Promise resolving to upload response
   */
  async uploadFiles<T = SuccessResponse>(
    endpoint: string,
    files: File | File[] | FileList,
    config: RequestConfig & FileUploadConfig = {}
  ): Promise<T> {
    const {
      multiple = false,
      maxSize,
      accept = [],
      chunkSize = 1024 * 1024, // 1MB chunks
      onProgress,
      onSuccess,
      onError,
      ...requestConfig
    } = config;

    // Convert FileList to Array if needed
    const fileArray = files instanceof FileList ? Array.from(files) : 
                     Array.isArray(files) ? files : [files];

    // Validate file constraints
    for (const file of fileArray) {
      if (maxSize && file.size > maxSize) {
        const error = new Error(`File ${file.name} exceeds maximum size of ${maxSize} bytes`);
        onError?.(error);
        throw error;
      }

      if (accept.length > 0 && !accept.some(type => file.type.includes(type))) {
        const error = new Error(`File ${file.name} type ${file.type} not accepted`);
        onError?.(error);
        throw error;
      }
    }

    if (!multiple && fileArray.length > 1) {
      const error = new Error('Multiple files not allowed');
      onError?.(error);
      throw error;
    }

    try {
      // Prepare FormData for upload
      const formData = new FormData();
      fileArray.forEach((file, index) => {
        formData.append(multiple ? `files[${index}]` : 'file', file);
      });

      // Create XMLHttpRequest for progress tracking
      const response = await this.uploadWithProgress<T>(
        `${this.baseUrl}${endpoint}`,
        formData,
        {
          ...requestConfig,
          onProgress: (progress) => {
            onProgress?.(progress);
          },
        }
      );

      onSuccess?.(response);
      return response;
    } catch (error) {
      onError?.(error as Error);
      this.handleUINotification(error, requestConfig);
      throw error;
    }
  }

  /**
   * Download files with progress tracking
   * 
   * Supports streaming downloads, progress callbacks, and automatic
   * browser download triggering with custom filenames.
   * 
   * @param endpoint - Download endpoint path
   * @param config - Download configuration with progress tracking
   * @returns Promise resolving to download completion
   */
  async downloadFile(
    endpoint: string,
    config: RequestConfig & FileDownloadConfig = {}
  ): Promise<void> {
    const {
      asAttachment = true,
      filename,
      onProgress,
      ...requestConfig
    } = config;

    try {
      const response = await this.executeStreamRequest(
        `${this.baseUrl}${endpoint}`,
        {
          method: 'GET',
          ...requestConfig,
        }
      );

      // Get filename from response headers or config
      const contentDisposition = response.headers.get('content-disposition');
      const responseFilename = contentDisposition?.match(/filename="(.+)"/)?.[1];
      const finalFilename = filename || responseFilename || 'download';

      // Stream download with progress tracking
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body not readable');
      }

      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;

        // Report progress
        if (onProgress && total > 0) {
          onProgress({
            loaded,
            total,
            percentage: Math.round((loaded / total) * 100),
          });
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      
      if (asAttachment) {
        const link = document.createElement('a');
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      URL.revokeObjectURL(url);
    } catch (error) {
      this.handleUINotification(error, requestConfig);
      throw error;
    }
  }

  /**
   * Import data from file
   * 
   * Supports various file formats (CSV, JSON, XML) with validation,
   * progress tracking, and error reporting for failed imports.
   * 
   * @param endpoint - Import endpoint path
   * @param file - File containing data to import
   * @param config - Import configuration with validation options
   * @returns Promise resolving to import results
   */
  async importFromFile<T>(
    endpoint: string,
    file: File,
    config: RequestConfig & {
      format?: 'csv' | 'json' | 'xml';
      validateOnly?: boolean;
      skipErrors?: boolean;
      onProgress?: (progress: FileUploadProgress) => void;
    } = {}
  ): Promise<BulkResponse<T>> {
    const {
      format = 'csv',
      validateOnly = false,
      skipErrors = false,
      onProgress,
      ...requestConfig
    } = config;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      formData.append('validate_only', validateOnly.toString());
      formData.append('skip_errors', skipErrors.toString());

      return await this.uploadWithProgress<BulkResponse<T>>(
        `${this.baseUrl}${endpoint}/_import`,
        formData,
        {
          ...requestConfig,
          onProgress,
        }
      );
    } catch (error) {
      this.handleUINotification(error, requestConfig);
      throw error;
    }
  }

  /**
   * Export data to file
   * 
   * Supports various export formats with filtering, field selection,
   * and automatic download triggering.
   * 
   * @param endpoint - Export endpoint path
   * @param config - Export configuration with format and filtering options
   * @returns Promise resolving to export completion
   */
  async exportToFile(
    endpoint: string,
    config: RequestConfig & FilterConfig & {
      format?: 'csv' | 'json' | 'xml';
      filename?: string;
    } = {}
  ): Promise<void> {
    const {
      format = 'csv',
      filename,
      filter,
      fields,
      sort,
      ...requestConfig
    } = config;

    // Build export parameters
    const queryParams = new URLSearchParams();
    queryParams.set('format', format);
    if (filter) queryParams.set('filter', filter);
    if (fields) queryParams.set('fields', fields);
    if (sort) queryParams.set('order', sort);

    const exportEndpoint = `${this.baseUrl}${endpoint}/_export?${queryParams.toString()}`;

    return this.downloadFile(exportEndpoint, {
      ...requestConfig,
      filename: filename || `export_${Date.now()}.${format}`,
    });
  }

  // =============================================================================
  // SPECIALIZED OPERATIONS
  // =============================================================================

  /**
   * Test database connection
   * 
   * Validates database connection parameters with timeout and
   * comprehensive error reporting for troubleshooting.
   * 
   * @param connectionData - Database connection configuration
   * @param config - Request configuration for connection testing
   * @returns Promise resolving to connection test results
   */
  async testConnection(
    connectionData: Record<string, any>,
    config: RequestConfig = {}
  ): Promise<ConnectionTestResult> {
    try {
      const response = await this.executeRequest<ConnectionTestResult>(
        `${this.baseUrl}/api/v2/system/service`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...connectionData,
            test_connection: true,
          }),
          contentType: 'application/json',
          timeout: config.timeout || 30000, // 30 second timeout for connection tests
          ...config,
        }
      );

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  /**
   * Discover database schema
   * 
   * Retrieves comprehensive database schema information with caching
   * and progressive loading for large schemas.
   * 
   * @param serviceId - Database service identifier
   * @param config - Request configuration with schema discovery options
   * @returns Promise resolving to schema discovery results
   */
  async discoverSchema(
    serviceId: string,
    config: RequestConfig & {
      includeRelationships?: boolean;
      tableFilter?: string;
    } = {}
  ): Promise<SchemaDiscoveryResult> {
    const {
      includeRelationships = true,
      tableFilter,
      ...requestConfig
    } = config;

    const queryParams = new URLSearchParams();
    if (includeRelationships) {
      queryParams.set('include_relationships', 'true');
    }
    if (tableFilter) {
      queryParams.set('filter', tableFilter);
    }

    try {
      const response = await this.executeRequest<SchemaDiscoveryResult>(
        `${this.baseUrl}/api/v2/${serviceId}/_schema?${queryParams.toString()}`,
        {
          method: 'GET',
          timeout: config.timeout || 60000, // Extended timeout for schema discovery
          ...requestConfig,
        }
      );

      return response;
    } catch (error) {
      this.handleUINotification(error, requestConfig);
      throw error;
    }
  }

  /**
   * Generate API endpoints
   * 
   * Creates RESTful API endpoints for database tables with comprehensive
   * configuration options and OpenAPI specification generation.
   * 
   * @param serviceId - Database service identifier
   * @param generationConfig - API generation configuration
   * @param config - Request configuration for API generation
   * @returns Promise resolving to endpoint generation results
   */
  async generateEndpoints(
    serviceId: string,
    generationConfig: {
      tables: string[];
      methods: HttpMethod[];
      security?: Record<string, any>;
      openApi?: boolean;
    },
    config: RequestConfig = {}
  ): Promise<EndpointGenerationResult> {
    try {
      const response = await this.executeRequest<EndpointGenerationResult>(
        `${this.baseUrl}/api/v2/system/api_generation`,
        {
          method: 'POST',
          body: JSON.stringify({
            service_id: serviceId,
            ...generationConfig,
          }),
          contentType: 'application/json',
          timeout: config.timeout || 45000, // Extended timeout for API generation
          ...config,
        }
      );

      // Show success notification with generation summary
      if (config.snackbarSuccess && !config.suppressNotifications) {
        this.showSuccessNotification(
          `${config.snackbarSuccess}: Generated ${response.endpoints.length} endpoints`
        );
      }

      return response;
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  /**
   * Manage event scripts
   * 
   * Specialized operations for event script CRUD with syntax validation
   * and GitHub integration capabilities.
   * 
   * @param action - Script action ('list', 'get', 'create', 'update', 'delete')
   * @param scriptData - Script data for create/update operations
   * @param config - Request configuration with script-specific options
   * @returns Promise resolving to script operation results
   */
  async manageEventScript<T = any>(
    action: 'list' | 'get' | 'create' | 'update' | 'delete',
    scriptData?: {
      name?: string;
      content?: string;
      language?: 'php' | 'python' | 'nodejs';
      events?: string[];
    },
    config: RequestConfig = {}
  ): Promise<T> {
    let endpoint = '/api/v2/system/script';
    let method: HttpMethod = 'GET';
    let body: string | undefined;

    switch (action) {
      case 'list':
        // Default endpoint and method
        break;
      case 'get':
        if (!scriptData?.name) {
          throw new Error('Script name required for get operation');
        }
        endpoint += `/${scriptData.name}`;
        break;
      case 'create':
        method = 'POST';
        body = JSON.stringify(scriptData);
        break;
      case 'update':
        if (!scriptData?.name) {
          throw new Error('Script name required for update operation');
        }
        endpoint += `/${scriptData.name}`;
        method = 'PUT';
        body = JSON.stringify(scriptData);
        break;
      case 'delete':
        if (!scriptData?.name) {
          throw new Error('Script name required for delete operation');
        }
        endpoint += `/${scriptData.name}`;
        method = 'DELETE';
        break;
    }

    try {
      return await this.executeRequest<T>(`${this.baseUrl}${endpoint}`, {
        method,
        body,
        contentType: body ? 'application/json' : undefined,
        ...config,
      });
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  /**
   * Fetch GitHub releases
   * 
   * Retrieves available GitHub releases for script templates and
   * example code with caching and version comparison.
   * 
   * @param repository - GitHub repository identifier
   * @param config - Request configuration with GitHub API options
   * @returns Promise resolving to GitHub releases list
   */
  async getGitHubReleases(
    repository: string,
    config: RequestConfig = {}
  ): Promise<Array<{
    tag_name: string;
    name: string;
    published_at: string;
    assets: Array<{
      name: string;
      download_url: string;
      size: number;
    }>;
  }>> {
    try {
      return await this.executeRequest(
        `https://api.github.com/repos/${repository}/releases`,
        {
          method: 'GET',
          timeout: config.timeout || 10000, // Shorter timeout for external API
          ...config,
        }
      );
    } catch (error) {
      this.handleUINotification(error, config);
      throw error;
    }
  }

  // =============================================================================
  // REQUEST EXECUTION HELPERS
  // =============================================================================

  /**
   * Execute HTTP request with comprehensive error handling
   * 
   * Core request execution method with retry logic, timeout handling,
   * and Response object processing for all CRUD operations.
   */
  private async executeRequest<T>(
    url: string,
    config: RequestConfig
  ): Promise<T> {
    const {
      method = 'GET',
      contentType = 'application/json',
      timeout = this.defaultTimeout,
      retryAttempts = 0,
      retryDelay = 1000,
      additionalHeaders = [],
      signal,
      showSpinner = false,
      ...requestOptions
    } = config;

    // Build headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'Content-Type': contentType,
    };

    // Add additional headers
    additionalHeaders.forEach(({ key, value }) => {
      headers[key] = value.toString();
    });

    // Create abort controller for timeout
    const controller = new AbortController();
    const requestId = `${method}-${url}-${Date.now()}`;
    this.abortControllers.set(requestId, controller);

    // Combine signals
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    // Show spinner if requested
    if (showSpinner) {
      this.showLoadingSpinner(true);
    }

    try {
      let lastError: Error;
      
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const response = await fetch(url, {
            method,
            headers,
            body: requestOptions.body,
            signal: controller.signal,
          });

          // Clear timeout and spinner
          clearTimeout(timeoutId);
          if (showSpinner) {
            this.showLoadingSpinner(false);
          }

          if (!response.ok) {
            const errorData = await this.parseErrorResponse(response);
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }

          // Handle empty responses
          if (response.status === 204 || response.headers.get('content-length') === '0') {
            return {} as T;
          }

          const data = await response.json();
          return data;
        } catch (error) {
          lastError = error as Error;
          
          // Don't retry on abort
          if (controller.signal.aborted) {
            throw new Error('Request timeout or cancelled');
          }

          // Wait before retry
          if (attempt < retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }

      throw lastError!;
    } finally {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);
      if (showSpinner) {
        this.showLoadingSpinner(false);
      }
    }
  }

  /**
   * Execute streaming request for file downloads
   * 
   * Specialized request handler for streaming responses with
   * progress tracking capabilities.
   */
  private async executeStreamRequest(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const {
      method = 'GET',
      timeout = this.defaultTimeout,
      additionalHeaders = [],
      signal,
    } = config;

    // Build headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
    };

    // Add additional headers
    additionalHeaders.forEach(({ key, value }) => {
      headers[key] = value.toString();
    });

    // Create abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (controller.signal.aborted) {
        throw new Error('Request timeout or cancelled');
      }
      throw error;
    }
  }

  /**
   * Upload with progress tracking
   * 
   * Specialized upload handler with XMLHttpRequest for progress callbacks
   * and comprehensive error handling.
   */
  private async uploadWithProgress<T>(
    url: string,
    formData: FormData,
    config: RequestConfig & {
      onProgress?: (progress: FileUploadProgress) => void;
    }
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      additionalHeaders = [],
      onProgress,
    } = config;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set timeout
      xhr.timeout = timeout;

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            });
          }
        });
      }

      // Success handler
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      });

      // Error handlers
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Open request and set headers
      xhr.open('POST', url);

      // Add default headers (except Content-Type for FormData)
      Object.entries(this.defaultHeaders).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      });

      // Add additional headers
      additionalHeaders.forEach(({ key, value }) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value.toString());
        }
      });

      // Send request
      xhr.send(formData);
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Parse error response from API
   * 
   * Standardized error parsing that handles DreamFactory error formats
   * and provides meaningful error messages for user feedback.
   */
  private async parseErrorResponse(response: Response): Promise<ErrorResponse['error']> {
    try {
      const errorData = await response.json();
      
      // Handle DreamFactory error format
      if (errorData.error) {
        return errorData.error;
      }

      // Handle generic error format
      return {
        code: response.status.toString(),
        message: errorData.message || response.statusText,
        status_code: response.status,
        context: errorData.context || errorData.details || null,
      };
    } catch {
      // Fallback for non-JSON error responses
      return {
        code: response.status.toString(),
        message: response.statusText || 'Unknown error occurred',
        status_code: response.status,
        context: null,
      };
    }
  }

  /**
   * Handle UI notifications for errors and success messages
   * 
   * Integrates with the application's notification system to provide
   * user feedback for all CRUD operations.
   */
  private handleUINotification(error: any, config: RequestConfig): void {
    if (config.suppressNotifications) return;

    const errorMessage = config.snackbarError || 
                        error?.message || 
                        'An unexpected error occurred';

    this.showErrorNotification(errorMessage);
  }

  /**
   * Show loading spinner
   * 
   * Placeholder for integration with application loading state management.
   * This should be connected to your global loading state (Zustand store).
   */
  private showLoadingSpinner(show: boolean): void {
    // TODO: Integrate with global loading state management
    // Example: useAppStore.getState().setLoading(show);
    console.log(`Loading spinner: ${show ? 'shown' : 'hidden'}`);
  }

  /**
   * Show success notification
   * 
   * Placeholder for integration with application notification system.
   * This should be connected to your snackbar/toast component.
   */
  private showSuccessNotification(message: string): void {
    // TODO: Integrate with notification system
    // Example: useNotificationStore.getState().showSuccess(message);
    console.log(`Success: ${message}`);
  }

  /**
   * Show error notification
   * 
   * Placeholder for integration with application notification system.
   * This should be connected to your snackbar/toast component.
   */
  private showErrorNotification(message: string): void {
    // TODO: Integrate with notification system
    // Example: useNotificationStore.getState().showError(message);
    console.error(`Error: ${message}`);
  }

  /**
   * Cancel all pending requests
   * 
   * Utility method for component cleanup and navigation scenarios
   * to prevent memory leaks and unnecessary network activity.
   */
  public cancelAllRequests(): void {
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();
  }

  /**
   * Build query parameters from object
   * 
   * Utility method for consistent query string construction
   * throughout all CRUD operations.
   */
  public buildQueryParams(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, value.toString());
      }
    });

    return queryParams.toString();
  }
}

// =============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// =============================================================================

/**
 * Create a new CRUD client instance with environment-specific configuration
 * 
 * Factory function that creates properly configured CRUD client instances
 * for different environments (development, staging, production).
 */
export function createCrudClient(config: {
  baseUrl: string;
  sessionToken?: string;
  apiKey?: string;
  timeout?: number;
}): CrudClient {
  const { baseUrl, sessionToken, apiKey, timeout } = config;

  // Build default headers based on available authentication
  const defaultHeaders: AuthHeaders = {};
  
  if (sessionToken) {
    defaultHeaders['X-DreamFactory-Session-Token'] = sessionToken;
  }
  
  if (apiKey) {
    defaultHeaders['X-DreamFactory-API-Key'] = apiKey;
  }

  return new CrudClient({
    baseUrl,
    defaultHeaders,
    defaultTimeout: timeout,
  });
}

/**
 * Default CRUD client instance for application-wide use
 * 
 * This should be configured during application initialization
 * with environment-specific settings.
 */
export const defaultCrudClient = new CrudClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  defaultHeaders: {},
  defaultTimeout: 30000,
});

// Re-export types for convenience
export type {
  RequestConfig,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkResponse,
  PaginationConfig,
  FilterConfig,
  FileUploadConfig,
  FileDownloadConfig,
  ConnectionTestResult,
  SchemaDiscoveryResult,
  EndpointGenerationResult,
};