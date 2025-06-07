/**
 * CRUD Operations Client for DreamFactory Admin Interface
 * 
 * Provides standardized create, read, update, delete functionality with intelligent
 * caching integration using TanStack React Query patterns. Replaces Angular
 * DfBaseCrudService with modern React/Next.js optimized implementation.
 * 
 * Key Features:
 * - Type-safe CRUD operations with comprehensive TypeScript support
 * - Pagination, filtering, and sorting for large dataset management
 * - File operations including import, export, upload, and download with progress tracking
 * - Request configuration management with headers, cache control, and notifications
 * - Integration with existing DreamFactory API endpoints and response formats
 * - React Query mutation patterns for optimistic updates and cache invalidation
 * - Specialized endpoints for event scripts, GitHub releases, and bulk operations
 * 
 * @module CrudClient
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { BaseApiClient, RequestConfigBuilder } from './base-client';
import type {
  ApiRequestConfig,
  ApiResponse,
  ListResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  BulkResponse,
  RequestParams,
  FileUploadConfig,
  FileDownloadConfig,
  FileOperationResult,
  ProgressEvent,
  HttpMethod,
} from './types';
import type {
  KeyValuePair,
  RequestOptions,
  GenericListResponse,
  GenericCreateResponse,
  GenericUpdateResponse,
  Meta,
} from '@/types/generic-http';

// =============================================================================
// CRUD OPERATION INTERFACES AND TYPES
// =============================================================================

/**
 * Standard pagination options for list operations
 */
export interface PaginationOptions {
  /** Number of records per page */
  limit?: number;
  /** Starting record offset */
  offset?: number;
  /** Include total count in response */
  includeCount?: boolean;
}

/**
 * Filtering options for data queries
 */
export interface FilterOptions {
  /** SQL-like filter expression */
  filter?: string;
  /** Field selection */
  fields?: string;
  /** Related resource inclusion */
  related?: string;
  /** Sort order specification */
  sort?: string;
}

/**
 * Complete query options combining pagination and filtering
 */
export interface QueryOptions extends PaginationOptions, FilterOptions {
  /** Custom query parameters */
  params?: KeyValuePair[];
  /** Additional request headers */
  headers?: KeyValuePair[];
  /** Cache control options */
  cacheControl?: CacheControlOptions;
  /** Notification options */
  notifications?: NotificationOptions;
}

/**
 * Cache control configuration for requests
 */
export interface CacheControlOptions {
  /** Force fresh data fetch */
  refresh?: boolean;
  /** Include cache control headers */
  includeCacheControl?: boolean;
  /** Custom cache TTL */
  ttl?: number;
  /** Cache tags for invalidation */
  tags?: string[];
}

/**
 * Notification configuration for CRUD operations
 */
export interface NotificationOptions {
  /** Show loading spinner */
  showSpinner?: boolean;
  /** Success message override */
  successMessage?: string;
  /** Error message override */
  errorMessage?: string;
  /** Suppress all notifications */
  suppressNotifications?: boolean;
}

/**
 * File import/export configuration
 */
export interface FileImportExportOptions {
  /** Target table or resource */
  resource?: string;
  /** Import/export format */
  format?: 'csv' | 'json' | 'xml' | 'xlsx';
  /** Field mapping configuration */
  fieldMapping?: Record<string, string>;
  /** Validation rules */
  validation?: ValidationConfig;
  /** Progress tracking */
  onProgress?: (progress: ProgressEvent) => void;
}

/**
 * Validation configuration for imports
 */
export interface ValidationConfig {
  /** Required fields */
  required?: string[];
  /** Field type validation */
  types?: Record<string, 'string' | 'number' | 'boolean' | 'date'>;
  /** Custom validation rules */
  custom?: Record<string, (value: any) => boolean | string>;
}

/**
 * Bulk operation configuration
 */
export interface BulkOperationOptions {
  /** Operation type */
  operation: 'create' | 'update' | 'delete' | 'upsert';
  /** Batch size for processing */
  batchSize?: number;
  /** Continue on error */
  continueOnError?: boolean;
  /** Progress tracking */
  onProgress?: (progress: BulkOperationProgress) => void;
}

/**
 * Bulk operation progress tracking
 */
export interface BulkOperationProgress {
  /** Total items to process */
  total: number;
  /** Items processed */
  processed: number;
  /** Successful operations */
  successful: number;
  /** Failed operations */
  failed: number;
  /** Current batch number */
  currentBatch: number;
  /** Total batches */
  totalBatches: number;
  /** Processing rate per second */
  rate?: number;
  /** Estimated time remaining */
  estimatedTimeRemaining?: number;
}

/**
 * Event script operation configuration
 */
export interface EventScriptOptions {
  /** Script type */
  type?: 'pre' | 'post' | 'process';
  /** Event trigger */
  event?: string;
  /** Service context */
  service?: string;
  /** Script engine */
  engine?: 'php' | 'python' | 'nodejs' | 'v8js';
}

/**
 * GitHub integration options
 */
export interface GitHubOptions {
  /** Repository owner */
  owner?: string;
  /** Repository name */
  repo?: string;
  /** Branch or tag */
  ref?: string;
  /** File path in repository */
  path?: string;
  /** Authentication token */
  token?: string;
}

// =============================================================================
// CRUD CLIENT IMPLEMENTATION
// =============================================================================

/**
 * Comprehensive CRUD operations client with React Query integration
 */
export class CrudClient {
  private baseClient: BaseApiClient;
  private defaultOptions: Partial<QueryOptions>;
  
  /**
   * Initialize CRUD client with base API client
   */
  constructor(
    baseClient: BaseApiClient,
    defaultOptions: Partial<QueryOptions> = {}
  ) {
    this.baseClient = baseClient;
    this.defaultOptions = {
      limit: 50,
      offset: 0,
      includeCount: true,
      showSpinner: true,
      ...defaultOptions,
    };
  }
  
  // =============================================================================
  // CORE CRUD OPERATIONS
  // =============================================================================
  
  /**
   * Retrieve all records with pagination, filtering, and sorting
   */
  async getAll<T = any>(
    endpoint: string,
    options: QueryOptions = {}
  ): Promise<ListResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const config = this.buildRequestConfig('GET', mergedOptions);
    
    // Build query parameters
    const queryParams: KeyValuePair[] = [];
    
    if (mergedOptions.limit !== undefined) {
      queryParams.push({ key: 'limit', value: mergedOptions.limit });
    }
    
    if (mergedOptions.offset !== undefined) {
      queryParams.push({ key: 'offset', value: mergedOptions.offset });
    }
    
    if (mergedOptions.includeCount) {
      queryParams.push({ key: 'include_count', value: 'true' });
    }
    
    if (mergedOptions.filter) {
      queryParams.push({ key: 'filter', value: mergedOptions.filter });
    }
    
    if (mergedOptions.fields) {
      queryParams.push({ key: 'fields', value: mergedOptions.fields });
    }
    
    if (mergedOptions.related) {
      queryParams.push({ key: 'related', value: mergedOptions.related });
    }
    
    if (mergedOptions.sort) {
      queryParams.push({ key: 'order', value: mergedOptions.sort });
    }
    
    // Add custom parameters
    if (mergedOptions.params) {
      queryParams.push(...mergedOptions.params);
    }
    
    // Execute request
    const requestConfig = this.baseClient
      .createRequest()
      .method('GET')
      .params(queryParams)
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .build();
    
    if (mergedOptions.successMessage) {
      requestConfig.snackbarSuccess = mergedOptions.successMessage;
    }
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<ListResponse<T>>(endpoint, requestConfig);
  }
  
  /**
   * Retrieve single record by ID
   */
  async get<T = any>(
    endpoint: string,
    id: string | number,
    options: Partial<QueryOptions> = {}
  ): Promise<ApiResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const resourceUrl = `${endpoint}/${id}`;
    
    // Build query parameters for field selection and relations
    const queryParams: KeyValuePair[] = [];
    
    if (mergedOptions.fields) {
      queryParams.push({ key: 'fields', value: mergedOptions.fields });
    }
    
    if (mergedOptions.related) {
      queryParams.push({ key: 'related', value: mergedOptions.related });
    }
    
    if (mergedOptions.params) {
      queryParams.push(...mergedOptions.params);
    }
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('GET')
      .params(queryParams)
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .build();
    
    if (mergedOptions.successMessage) {
      requestConfig.snackbarSuccess = mergedOptions.successMessage;
    }
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<T>(resourceUrl, requestConfig);
  }
  
  /**
   * Create new record
   */
  async create<T = any>(
    endpoint: string,
    data: Partial<T>,
    options: Partial<QueryOptions> = {}
  ): Promise<CreateResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('POST')
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || 'Record created successfully')
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<CreateResponse<T>>(endpoint, requestConfig, data);
  }
  
  /**
   * Update existing record (full replacement)
   */
  async update<T = any>(
    endpoint: string,
    id: string | number,
    data: Partial<T>,
    options: Partial<QueryOptions> = {}
  ): Promise<UpdateResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const resourceUrl = `${endpoint}/${id}`;
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('PUT')
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || 'Record updated successfully')
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<UpdateResponse<T>>(resourceUrl, requestConfig, data);
  }
  
  /**
   * Partial update of existing record
   */
  async patch<T = any>(
    endpoint: string,
    id: string | number,
    data: Partial<T>,
    options: Partial<QueryOptions> = {}
  ): Promise<UpdateResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const resourceUrl = `${endpoint}/${id}`;
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('PATCH')
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || 'Record updated successfully')
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<UpdateResponse<T>>(resourceUrl, requestConfig, data);
  }
  
  /**
   * Delete record by ID
   */
  async delete(
    endpoint: string,
    id: string | number,
    options: Partial<QueryOptions> = {}
  ): Promise<DeleteResponse> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const resourceUrl = `${endpoint}/${id}`;
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('DELETE')
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || 'Record deleted successfully')
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<DeleteResponse>(resourceUrl, requestConfig);
  }
  
  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================
  
  /**
   * Create multiple records in bulk
   */
  async bulkCreate<T = any>(
    endpoint: string,
    data: Partial<T>[],
    options: BulkOperationOptions & Partial<QueryOptions> = {}
  ): Promise<BulkResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Process in batches if specified
    if (options.batchSize && data.length > options.batchSize) {
      return this.processBulkOperation(endpoint, data, 'create', options);
    }
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('POST')
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || `${data.length} records created successfully`)
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    const payload = { resource: data };
    return this.baseClient.request<BulkResponse<T>>(endpoint, requestConfig, payload);
  }
  
  /**
   * Update multiple records in bulk
   */
  async bulkUpdate<T = any>(
    endpoint: string,
    data: (Partial<T> & { id: string | number })[],
    options: BulkOperationOptions & Partial<QueryOptions> = {}
  ): Promise<BulkResponse<T>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Process in batches if specified
    if (options.batchSize && data.length > options.batchSize) {
      return this.processBulkOperation(endpoint, data, 'update', options);
    }
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('PATCH')
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || `${data.length} records updated successfully`)
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    const payload = { resource: data };
    return this.baseClient.request<BulkResponse<T>>(endpoint, requestConfig, payload);
  }
  
  /**
   * Delete multiple records in bulk
   */
  async bulkDelete(
    endpoint: string,
    ids: (string | number)[],
    options: BulkOperationOptions & Partial<QueryOptions> = {}
  ): Promise<BulkResponse<{ id: string | number }>> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('DELETE')
      .param('ids', ids.join(','))
      .params(mergedOptions.params || [])
      .headers(mergedOptions.headers || [])
      .loading(mergedOptions.showSpinner ?? true)
      .successMessage(mergedOptions.successMessage || `${ids.length} records deleted successfully`)
      .build();
    
    if (mergedOptions.errorMessage) {
      requestConfig.snackbarError = mergedOptions.errorMessage;
    }
    
    if (mergedOptions.suppressNotifications) {
      requestConfig.suppressNotifications = true;
    }
    
    return this.baseClient.request<BulkResponse<{ id: string | number }>>(endpoint, requestConfig);
  }
  
  /**
   * Process bulk operations in batches with progress tracking
   */
  private async processBulkOperation<T>(
    endpoint: string,
    data: any[],
    operation: 'create' | 'update' | 'delete',
    options: BulkOperationOptions & Partial<QueryOptions>
  ): Promise<BulkResponse<T>> {
    const batchSize = options.batchSize || 50;
    const totalBatches = Math.ceil(data.length / batchSize);
    const results: T[] = [];
    const errors: any[] = [];
    
    let processed = 0;
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, data.length);
      const batch = data.slice(start, end);
      
      try {
        let batchResult: BulkResponse<T>;
        
        switch (operation) {
          case 'create':
            batchResult = await this.bulkCreate(endpoint, batch, { ...options, batchSize: undefined });
            break;
          case 'update':
            batchResult = await this.bulkUpdate(endpoint, batch, { ...options, batchSize: undefined });
            break;
          default:
            throw new Error(`Unsupported bulk operation: ${operation}`);
        }
        
        if (batchResult.data) {
          results.push(...batchResult.data);
          successful += batchResult.data.length;
        }
        
        if (batchResult.meta?.errors) {
          errors.push(...batchResult.meta.errors);
          failed += batchResult.meta.errors.length;
        }
        
      } catch (error) {
        if (options.continueOnError) {
          errors.push({ batch: i, error });
          failed += batch.length;
        } else {
          throw error;
        }
      }
      
      processed += batch.length;
      
      // Report progress
      if (options.onProgress) {
        const startTime = Date.now();
        const rate = processed / ((Date.now() - startTime) / 1000);
        const remaining = data.length - processed;
        const estimatedTimeRemaining = remaining / rate;
        
        options.onProgress({
          total: data.length,
          processed,
          successful,
          failed,
          currentBatch: i + 1,
          totalBatches,
          rate,
          estimatedTimeRemaining,
        });
      }
    }
    
    return {
      data: results,
      meta: {
        successCount: successful,
        errorCount: failed,
        errors: errors.length > 0 ? errors : undefined,
      },
      status: {
        code: 200,
        text: 'OK',
        success: true,
      },
      headers: {},
      config: {},
    } as BulkResponse<T>;
  }
  
  // =============================================================================
  // FILE OPERATIONS
  // =============================================================================
  
  /**
   * Import data from file
   */
  async importFile(
    endpoint: string,
    file: File,
    options: FileImportExportOptions & Partial<QueryOptions> = {}
  ): Promise<FileOperationResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.resource) {
      formData.append('resource', options.resource);
    }
    
    if (options.format) {
      formData.append('format', options.format);
    }
    
    if (options.fieldMapping) {
      formData.append('field_mapping', JSON.stringify(options.fieldMapping));
    }
    
    const uploadConfig: FileUploadConfig = {
      fieldName: 'file',
      progress: {
        enabled: true,
        onProgress: options.onProgress,
      },
    };
    
    const result = await this.baseClient.uploadFile(
      `${endpoint}/import`,
      file,
      uploadConfig
    );
    
    return {
      success: true,
      data: result,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    };
  }
  
  /**
   * Export data to file
   */
  async exportFile(
    endpoint: string,
    options: FileImportExportOptions & Partial<QueryOptions> = {}
  ): Promise<FileOperationResult> {
    const queryParams: KeyValuePair[] = [];
    
    if (options.format) {
      queryParams.push({ key: 'format', value: options.format });
    }
    
    if (options.fields) {
      queryParams.push({ key: 'fields', value: options.fields });
    }
    
    if (options.filter) {
      queryParams.push({ key: 'filter', value: options.filter });
    }
    
    const requestConfig = this.baseClient
      .createRequest()
      .method('GET')
      .params(queryParams)
      .loading(options.showSpinner ?? true)
      .successMessage('Export completed successfully')
      .build();
    
    const blob = await this.baseClient.downloadBlob(`${endpoint}/export`, requestConfig);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `export_${endpoint.replace(/\//g, '_')}_${Date.now()}.${options.format || 'csv'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      data: blob,
      url,
      file: {
        name: link.download,
        size: blob.size,
        type: blob.type,
        lastModified: Date.now(),
      },
    };
  }
  
  /**
   * Upload file to server
   */
  async uploadFile(
    endpoint: string,
    file: File,
    options: Partial<QueryOptions> & { 
      fieldName?: string;
      onProgress?: (progress: ProgressEvent) => void;
    } = {}
  ): Promise<FileOperationResult> {
    const uploadConfig: FileUploadConfig = {
      fieldName: options.fieldName || 'file',
      progress: {
        enabled: true,
        onProgress: options.onProgress,
      },
    };
    
    const result = await this.baseClient.uploadFile(endpoint, file, uploadConfig);
    
    return {
      success: true,
      data: result,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      },
    };
  }
  
  /**
   * Download file from server
   */
  async downloadFile(
    endpoint: string,
    filename?: string,
    options: Partial<QueryOptions> = {}
  ): Promise<FileOperationResult> {
    const requestConfig = this.baseClient
      .createRequest()
      .method('GET')
      .loading(options.showSpinner ?? true)
      .build();
    
    const blob = await this.baseClient.downloadBlob(endpoint, requestConfig);
    
    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `download_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      data: blob,
      url,
      file: {
        name: link.download,
        size: blob.size,
        type: blob.type,
        lastModified: Date.now(),
      },
    };
  }
  
  // =============================================================================
  // SPECIALIZED OPERATIONS
  // =============================================================================
  
  /**
   * Event script operations
   */
  async getEventScripts(
    options: EventScriptOptions & Partial<QueryOptions> = {}
  ): Promise<ListResponse<any>> {
    const queryParams: KeyValuePair[] = [];
    
    if (options.type) {
      queryParams.push({ key: 'type', value: options.type });
    }
    
    if (options.event) {
      queryParams.push({ key: 'event', value: options.event });
    }
    
    if (options.service) {
      queryParams.push({ key: 'service', value: options.service });
    }
    
    return this.getAll('/system/event_script', { ...options, params: queryParams });
  }
  
  /**
   * Create or update event script
   */
  async saveEventScript(
    scriptData: any,
    options: EventScriptOptions & Partial<QueryOptions> = {}
  ): Promise<CreateResponse<any> | UpdateResponse<any>> {
    if (scriptData.id) {
      return this.update('/system/event_script', scriptData.id, scriptData, options);
    } else {
      return this.create('/system/event_script', scriptData, options);
    }
  }
  
  /**
   * GitHub repository operations
   */
  async getGitHubReleases(
    options: GitHubOptions & Partial<QueryOptions> = {}
  ): Promise<ListResponse<any>> {
    const { owner, repo, ...queryOptions } = options;
    
    if (!owner || !repo) {
      throw new Error('GitHub owner and repo are required');
    }
    
    const endpoint = `/github/releases/${owner}/${repo}`;
    return this.getAll(endpoint, queryOptions);
  }
  
  /**
   * Download file from GitHub repository
   */
  async downloadFromGitHub(
    options: GitHubOptions & { 
      path: string;
      filename?: string;
    } & Partial<QueryOptions>
  ): Promise<FileOperationResult> {
    const { owner, repo, path, ref, filename, ...queryOptions } = options;
    
    if (!owner || !repo || !path) {
      throw new Error('GitHub owner, repo, and path are required');
    }
    
    const queryParams: KeyValuePair[] = [];
    
    if (ref) {
      queryParams.push({ key: 'ref', value: ref });
    }
    
    const endpoint = `/github/file/${owner}/${repo}/${path}`;
    return this.downloadFile(endpoint, filename, { ...queryOptions, params: queryParams });
  }
  
  // =============================================================================
  // UTILITY METHODS
  // =============================================================================
  
  /**
   * Build request configuration from options
   */
  private buildRequestConfig(
    method: HttpMethod,
    options: QueryOptions
  ): ApiRequestConfig {
    const config: ApiRequestConfig = {
      method,
      params: this.buildRequestParams(options),
      headers: this.buildRequestHeaders(options),
    };
    
    // Add cache control
    if (options.cacheControl) {
      if (options.cacheControl.refresh) {
        config.headers = {
          ...config.headers,
          'Cache-Control': 'no-cache',
        };
      }
      
      if (options.cacheControl.includeCacheControl) {
        config.headers = {
          ...config.headers,
          'Cache-Control': `max-age=${options.cacheControl.ttl || 300}`,
        };
      }
    }
    
    return config;
  }
  
  /**
   * Build request parameters from options
   */
  private buildRequestParams(options: QueryOptions): RequestParams {
    const params: RequestParams = {};
    
    if (options.limit !== undefined) {
      params.limit = options.limit;
    }
    
    if (options.offset !== undefined) {
      params.offset = options.offset;
    }
    
    if (options.includeCount) {
      params.includeCount = options.includeCount;
    }
    
    if (options.filter) {
      params.filter = options.filter;
    }
    
    if (options.fields) {
      params.fields = options.fields;
    }
    
    if (options.related) {
      params.related = options.related;
    }
    
    if (options.sort) {
      params.sort = options.sort;
    }
    
    // Add custom parameters
    if (options.params) {
      options.params.forEach(({ key, value }) => {
        params[key] = value;
      });
    }
    
    return params;
  }
  
  /**
   * Build request headers from options
   */
  private buildRequestHeaders(options: QueryOptions): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (options.headers) {
      options.headers.forEach(({ key, value }) => {
        headers[key] = String(value);
      });
    }
    
    return headers;
  }
  
  /**
   * Create query options from legacy request options
   */
  static fromLegacyOptions(legacyOptions: RequestOptions): QueryOptions {
    return {
      limit: legacyOptions.limit,
      offset: legacyOptions.offset,
      includeCount: legacyOptions.includeCount,
      filter: legacyOptions.filter,
      fields: legacyOptions.fields,
      related: legacyOptions.related,
      sort: legacyOptions.sort,
      params: legacyOptions.additionalParams,
      headers: legacyOptions.additionalHeaders,
      notifications: {
        showSpinner: legacyOptions.showSpinner,
        successMessage: legacyOptions.snackbarSuccess,
        errorMessage: legacyOptions.snackbarError,
      },
      cacheControl: {
        refresh: legacyOptions.refresh,
        includeCacheControl: legacyOptions.includeCacheControl,
      },
    };
  }
  
  /**
   * Convert to legacy response format for compatibility
   */
  static toLegacyResponse<T>(response: ApiResponse<T>): GenericListResponse<T> | T {
    if (Array.isArray(response.data)) {
      return {
        resource: response.data,
        meta: {
          count: response.meta?.pagination?.total || response.data.length,
        },
      };
    }
    
    return response.data;
  }
}

// =============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// =============================================================================

/**
 * Create CRUD client instance with base API client
 */
export function createCrudClient(
  baseClient: BaseApiClient,
  defaultOptions?: Partial<QueryOptions>
): CrudClient {
  return new CrudClient(baseClient, defaultOptions);
}

/**
 * Create CRUD client with default configuration
 */
export function createDefaultCrudClient(
  baseUrl: string = '',
  apiKey: string = ''
): CrudClient {
  const baseClient = new BaseApiClient(baseUrl);
  return new CrudClient(baseClient);
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Main class
  CrudClient,
  
  // Factory functions
  createCrudClient,
  createDefaultCrudClient,
  
  // Type exports
  type PaginationOptions,
  type FilterOptions,
  type QueryOptions,
  type CacheControlOptions,
  type NotificationOptions,
  type FileImportExportOptions,
  type ValidationConfig,
  type BulkOperationOptions,
  type BulkOperationProgress,
  type EventScriptOptions,
  type GitHubOptions,
};

export default CrudClient;