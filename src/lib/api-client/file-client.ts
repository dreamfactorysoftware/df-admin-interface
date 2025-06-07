/**
 * Specialized file operations client for DreamFactory Admin Interface
 * 
 * Provides comprehensive file management capabilities including:
 * - File upload operations with progress tracking and chunked upload support
 * - File download functionality with proper blob handling and cross-browser compatibility
 * - Directory operations including creation, listing, deletion, and navigation workflows
 * - File metadata management with security validation including private key detection
 * - Integration with DreamFactory file services API with proper authentication
 * - Absolute URL construction for file operations bypassing Angular baseHref patterns
 * 
 * Migrated from Angular FileApiService to React-compatible implementation with
 * enhanced performance, better error handling, and modern JavaScript patterns.
 * 
 * @module FileClient
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { BaseApiClient, RequestConfigBuilder } from './base-client';
import { AuthClient, getCurrentAuthHeaders } from './auth-client';
import {
  RequestConfig,
  HttpMethod,
  ApiResponse,
  FileUploadConfig,
  FileDownloadConfig,
  FileMetadata,
  FileUploadProgress,
  FileDownloadProgress,
  FileOperationResult,
  AuthContext,
  AuthHeaders,
  KeyValuePair,
} from './types';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * File service configuration constants
 */
export const FILE_CONFIG = {
  /** Default chunk size for large file uploads (5MB) */
  DEFAULT_CHUNK_SIZE: 5 * 1024 * 1024,
  /** Maximum file size for single upload (100MB) */
  MAX_SINGLE_FILE_SIZE: 100 * 1024 * 1024,
  /** Maximum concurrent uploads */
  MAX_CONCURRENT_UPLOADS: 3,
  /** File upload timeout in milliseconds (10 minutes) */
  UPLOAD_TIMEOUT: 10 * 60 * 1000,
  /** Download timeout in milliseconds (30 minutes) */
  DOWNLOAD_TIMEOUT: 30 * 60 * 1000,
  /** Progress update interval in milliseconds */
  PROGRESS_UPDATE_INTERVAL: 100,
  /** Retry attempts for failed chunks */
  CHUNK_RETRY_ATTEMPTS: 3,
  /** Accepted file types for security validation */
  SECURITY_SCAN_EXTENSIONS: ['.pem', '.key', '.p12', '.pfx', '.crt', '.cer'],
  /** Content types for security validation */
  SECURITY_SCAN_TYPES: ['application/x-pem-file', 'application/pkcs12', 'application/x-x509-ca-cert'],
} as const;

/**
 * DreamFactory file service API endpoints
 */
export const FILE_ENDPOINTS = {
  /** Base file service path */
  BASE: '/api/v2/files',
  /** Upload endpoint */
  UPLOAD: '/api/v2/files',
  /** Download endpoint pattern */
  DOWNLOAD: '/api/v2/files',
  /** Directory operations */
  DIRECTORY: '/api/v2/files',
  /** File metadata */
  METADATA: '/api/v2/files',
  /** Batch operations */
  BATCH: '/api/v2/files',
} as const;

/**
 * Supported file operation types
 */
export type FileOperationType = 
  | 'upload'
  | 'download'
  | 'delete'
  | 'move'
  | 'copy'
  | 'mkdir'
  | 'rmdir'
  | 'list'
  | 'metadata';

/**
 * File upload chunk interface
 */
export interface FileChunk {
  /** Chunk index */
  index: number;
  /** Total chunks */
  total: number;
  /** Chunk data */
  data: Blob;
  /** Chunk size */
  size: number;
  /** Start byte position */
  start: number;
  /** End byte position */
  end: number;
  /** Upload attempt count */
  attempts: number;
}

/**
 * Directory listing item interface
 */
export interface DirectoryItem {
  /** Item name */
  name: string;
  /** Full path */
  path: string;
  /** Item type (file or folder) */
  type: 'file' | 'folder';
  /** File size in bytes (for files) */
  size?: number;
  /** Last modified timestamp */
  lastModified: string;
  /** Content type (for files) */
  contentType?: string;
  /** Whether item is readable */
  readable: boolean;
  /** Whether item is writable */
  writable: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Directory listing response interface
 */
export interface DirectoryListing {
  /** Current path */
  path: string;
  /** Directory items */
  items: DirectoryItem[];
  /** Total item count */
  totalCount: number;
  /** Whether there are more items */
  hasMore: boolean;
  /** Parent directory path */
  parentPath?: string;
}

/**
 * File security validation result
 */
export interface SecurityValidationResult {
  /** Whether file is safe */
  isSafe: boolean;
  /** Security warnings */
  warnings: string[];
  /** Detected issues */
  issues: string[];
  /** File classification */
  classification: 'safe' | 'warning' | 'dangerous';
  /** Recommended actions */
  recommendations: string[];
}

/**
 * File operation progress tracking
 */
export interface FileOperationProgress {
  /** Operation type */
  operation: FileOperationType;
  /** File name */
  fileName: string;
  /** Bytes processed */
  processed: number;
  /** Total bytes */
  total: number;
  /** Progress percentage */
  percentage: number;
  /** Processing speed (bytes/second) */
  speed: number;
  /** Estimated time remaining (seconds) */
  timeRemaining?: number;
  /** Current status */
  status: 'pending' | 'processing' | 'complete' | 'error' | 'cancelled';
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate unique file operation ID for tracking
 */
function generateFileOperationId(): string {
  return `file_op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate file chunks for upload
 */
function calculateFileChunks(file: File, chunkSize: number = FILE_CONFIG.DEFAULT_CHUNK_SIZE): FileChunk[] {
  const chunks: FileChunk[] = [];
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkData = file.slice(start, end);
    
    chunks.push({
      index: i,
      total: totalChunks,
      data: chunkData,
      size: end - start,
      start,
      end,
      attempts: 0,
    });
  }
  
  return chunks;
}

/**
 * Validate file name for security issues
 */
function validateFileName(fileName: string): SecurityValidationResult {
  const warnings: string[] = [];
  const issues: string[] = [];
  let classification: 'safe' | 'warning' | 'dangerous' = 'safe';
  
  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.js', '.jar'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    issues.push(`Potentially dangerous file extension: ${fileExtension}`);
    classification = 'dangerous';
  }
  
  // Check for security-sensitive extensions
  if (FILE_CONFIG.SECURITY_SCAN_EXTENSIONS.includes(fileExtension)) {
    warnings.push(`Security-sensitive file type detected: ${fileExtension}`);
    if (classification !== 'dangerous') {
      classification = 'warning';
    }
  }
  
  // Check for path traversal attempts
  if (fileName.includes('..') || fileName.includes('./') || fileName.includes('.\\')) {
    issues.push('Path traversal attempt detected in filename');
    classification = 'dangerous';
  }
  
  // Check for hidden files
  if (fileName.startsWith('.') && fileName !== '.htaccess') {
    warnings.push('Hidden file detected');
    if (classification === 'safe') {
      classification = 'warning';
    }
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (issues.length > 0) {
    recommendations.push('File upload blocked due to security issues');
    recommendations.push('Rename file to remove dangerous elements');
  } else if (warnings.length > 0) {
    recommendations.push('Review file contents before uploading');
    recommendations.push('Ensure file is from trusted source');
  }
  
  return {
    isSafe: classification !== 'dangerous',
    warnings,
    issues,
    classification,
    recommendations,
  };
}

/**
 * Detect file content type from extension
 */
function detectContentType(fileName: string): string {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Calculate upload speed and time remaining
 */
function calculateTransferStats(
  bytesTransferred: number,
  totalBytes: number,
  startTime: number
): { speed: number; timeRemaining?: number } {
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const speed = bytesTransferred / elapsed;
  
  let timeRemaining: number | undefined;
  if (speed > 0) {
    timeRemaining = (totalBytes - bytesTransferred) / speed;
  }
  
  return { speed, timeRemaining };
}

/**
 * Build absolute URL for file operations bypassing baseHref
 */
function buildAbsoluteFileUrl(relativePath: string, params?: KeyValuePair[]): string {
  // Get the current origin directly
  const origin = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  
  // Build query string
  let queryString = '';
  if (params && params.length > 0) {
    const searchParams = new URLSearchParams();
    params.forEach(({ key, value }) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    queryString = searchParams.toString();
  }
  
  // Construct absolute URL
  const fullUrl = `${origin}/${cleanPath}`;
  return queryString ? `${fullUrl}?${queryString}` : fullUrl;
}

// =============================================================================
// MAIN FILE CLIENT CLASS
// =============================================================================

/**
 * Specialized file operations client for DreamFactory file services
 */
export class FileClient extends BaseApiClient {
  private uploadProgressCallbacks: Map<string, (progress: FileOperationProgress) => void> = new Map();
  private downloadProgressCallbacks: Map<string, (progress: FileOperationProgress) => void> = new Map();
  private activeOperations: Map<string, AbortController> = new Map();
  
  /**
   * Initialize file client with base API client configuration
   */
  constructor(
    baseUrl: string = '',
    authContext: AuthContext = {
      isAuthenticated: false,
      isAuthenticating: false,
    }
  ) {
    super(baseUrl, authContext);
    
    // Add file-specific middleware
    this.addRequestMiddleware({
      id: 'file-auth-headers',
      onRequest: async (config: RequestConfig) => {
        // Add authentication headers for file operations
        const authHeaders = await getCurrentAuthHeaders();
        if (!config.additionalHeaders) {
          config.additionalHeaders = [];
        }
        
        Object.entries(authHeaders).forEach(([key, value]) => {
          config.additionalHeaders!.push({ key, value });
        });
        
        return config;
      },
    });
  }
  
  // =============================================================================
  // FILE UPLOAD OPERATIONS
  // =============================================================================
  
  /**
   * Upload single file with progress tracking and validation
   */
  async uploadFile(
    file: File,
    config: FileUploadConfig & {
      onProgress?: (progress: FileOperationProgress) => void;
      validateSecurity?: boolean;
      enableChunking?: boolean;
    } = {}
  ): Promise<FileOperationResult> {
    const operationId = generateFileOperationId();
    const startTime = Date.now();
    
    try {
      // Security validation
      if (config.validateSecurity !== false) {
        const validation = validateFileName(file.name);
        if (!validation.isSafe) {
          throw new Error(`File upload blocked: ${validation.issues.join(', ')}`);
        }
        
        if (validation.warnings.length > 0) {
          console.warn('File security warnings:', validation.warnings);
        }
      }
      
      // Size validation
      if (file.size > FILE_CONFIG.MAX_SINGLE_FILE_SIZE) {
        throw new Error(`File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(FILE_CONFIG.MAX_SINGLE_FILE_SIZE)}`);
      }
      
      // Register progress callback
      if (config.onProgress) {
        this.uploadProgressCallbacks.set(operationId, config.onProgress);
      }
      
      // Create abort controller
      const abortController = new AbortController();
      this.activeOperations.set(operationId, abortController);
      
      let result: FileOperationResult;
      
      // Determine upload method
      const useChunking = config.enableChunking && file.size > FILE_CONFIG.DEFAULT_CHUNK_SIZE;
      
      if (useChunking) {
        result = await this.uploadFileInChunks(file, config, operationId, startTime, abortController.signal);
      } else {
        result = await this.uploadFileDirect(file, config, operationId, startTime, abortController.signal);
      }
      
      // Update final progress
      if (config.onProgress) {
        config.onProgress({
          operation: 'upload',
          fileName: file.name,
          processed: file.size,
          total: file.size,
          percentage: 100,
          speed: file.size / ((Date.now() - startTime) / 1000),
          status: result.success ? 'complete' : 'error',
          error: result.error?.message,
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('File upload error:', error);
      
      if (config.onProgress) {
        config.onProgress({
          operation: 'upload',
          fileName: file.name,
          processed: 0,
          total: file.size,
          percentage: 0,
          speed: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Upload failed'),
        duration: Date.now() - startTime,
      };
    } finally {
      // Cleanup
      this.uploadProgressCallbacks.delete(operationId);
      this.activeOperations.delete(operationId);
    }
  }
  
  /**
   * Upload file directly without chunking
   */
  private async uploadFileDirect(
    file: File,
    config: FileUploadConfig,
    operationId: string,
    startTime: number,
    signal: AbortSignal
  ): Promise<FileOperationResult> {
    const formData = new FormData();
    formData.append(config.fieldName || 'file', file);
    
    // Add additional form data
    if (config.data) {
      Object.entries(config.data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    
    // Build upload URL
    const uploadUrl = config.url || FILE_ENDPOINTS.UPLOAD;
    const absoluteUrl = buildAbsoluteFileUrl(uploadUrl);
    
    // Create progress tracking XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const callback = this.uploadProgressCallbacks.get(operationId);
          if (callback) {
            const stats = calculateTransferStats(event.loaded, event.total, startTime);
            callback({
              operation: 'upload',
              fileName: file.name,
              processed: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
              speed: stats.speed,
              timeRemaining: stats.timeRemaining,
              status: 'processing',
            });
          }
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            resolve({
              success: true,
              data: response,
              file: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
              },
              url: absoluteUrl,
              duration: Date.now() - startTime,
            });
          } catch (error) {
            resolve({
              success: true,
              data: xhr.responseText,
              file: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
              },
              url: absoluteUrl,
              duration: Date.now() - startTime,
            });
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });
      
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });
      
      // Handle abort signal
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
      // Open and configure request
      xhr.open(config.method || 'POST', absoluteUrl);
      
      // Add authentication headers
      config.headers = config.headers || {};
      const authHeaders = await getCurrentAuthHeaders();
      Object.assign(config.headers, authHeaders);
      
      // Set headers
      Object.entries(config.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      // Send request
      xhr.send(formData);
    });
  }
  
  /**
   * Upload file in chunks for large files
   */
  private async uploadFileInChunks(
    file: File,
    config: FileUploadConfig,
    operationId: string,
    startTime: number,
    signal: AbortSignal
  ): Promise<FileOperationResult> {
    const chunks = calculateFileChunks(file, config.chunkSize);
    const uploadedChunks: number[] = [];
    let totalUploaded = 0;
    
    // Initialize chunked upload session
    const sessionId = `upload_${operationId}`;
    
    try {
      for (const chunk of chunks) {
        if (signal.aborted) {
          throw new Error('Upload cancelled');
        }
        
        await this.uploadChunk(file, chunk, sessionId, config, signal);
        uploadedChunks.push(chunk.index);
        totalUploaded += chunk.size;
        
        // Update progress
        const callback = this.uploadProgressCallbacks.get(operationId);
        if (callback) {
          const stats = calculateTransferStats(totalUploaded, file.size, startTime);
          callback({
            operation: 'upload',
            fileName: file.name,
            processed: totalUploaded,
            total: file.size,
            percentage: Math.round((totalUploaded / file.size) * 100),
            speed: stats.speed,
            timeRemaining: stats.timeRemaining,
            status: 'processing',
          });
        }
      }
      
      // Finalize upload
      const finalizeResult = await this.finalizeChunkedUpload(sessionId, file, config);
      
      return {
        success: true,
        data: finalizeResult,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        },
        duration: Date.now() - startTime,
      };
      
    } catch (error) {
      // Cleanup partial upload
      await this.cleanupChunkedUpload(sessionId).catch(() => {
        // Ignore cleanup errors
      });
      
      throw error;
    }
  }
  
  /**
   * Upload individual chunk
   */
  private async uploadChunk(
    file: File,
    chunk: FileChunk,
    sessionId: string,
    config: FileUploadConfig,
    signal: AbortSignal
  ): Promise<void> {
    const formData = new FormData();
    formData.append('chunk', chunk.data);
    formData.append('chunkIndex', chunk.index.toString());
    formData.append('totalChunks', chunk.total.toString());
    formData.append('sessionId', sessionId);
    formData.append('fileName', file.name);
    
    const requestConfig = this.createRequest()
      .method('POST')
      .contentType('multipart/form-data')
      .timeout(FILE_CONFIG.UPLOAD_TIMEOUT)
      .signal(signal)
      .retry(FILE_CONFIG.CHUNK_RETRY_ATTEMPTS, 1000)
      .build();
    
    const uploadUrl = `${config.url || FILE_ENDPOINTS.UPLOAD}/chunk`;
    await this.request(uploadUrl, requestConfig, formData);
  }
  
  /**
   * Finalize chunked upload
   */
  private async finalizeChunkedUpload(
    sessionId: string,
    file: File,
    config: FileUploadConfig
  ): Promise<any> {
    const requestConfig = this.createRequest()
      .method('POST')
      .timeout(FILE_CONFIG.UPLOAD_TIMEOUT)
      .build();
    
    const finalizeUrl = `${config.url || FILE_ENDPOINTS.UPLOAD}/finalize`;
    const response = await this.request(finalizeUrl, requestConfig, {
      sessionId,
      fileName: file.name,
      totalSize: file.size,
      ...config.data,
    });
    
    return response;
  }
  
  /**
   * Cleanup failed chunked upload
   */
  private async cleanupChunkedUpload(sessionId: string): Promise<void> {
    const requestConfig = this.createRequest()
      .method('DELETE')
      .timeout(5000)
      .build();
    
    const cleanupUrl = `${FILE_ENDPOINTS.UPLOAD}/cleanup/${sessionId}`;
    await this.request(cleanupUrl, requestConfig);
  }
  
  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleFiles(
    files: File[],
    config: FileUploadConfig & {
      onProgress?: (progress: FileOperationProgress[]) => void;
      maxConcurrent?: number;
    } = {}
  ): Promise<FileOperationResult[]> {
    const maxConcurrent = config.maxConcurrent || FILE_CONFIG.MAX_CONCURRENT_UPLOADS;
    const results: FileOperationResult[] = [];
    const progressMap = new Map<string, FileOperationProgress>();
    
    const updateProgress = (fileName: string, progress: FileOperationProgress) => {
      progressMap.set(fileName, progress);
      if (config.onProgress) {
        config.onProgress(Array.from(progressMap.values()));
      }
    };
    
    // Process files in batches
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (file) => {
        return this.uploadFile(file, {
          ...config,
          onProgress: (progress) => updateProgress(file.name, progress),
        });
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: new Error(result.reason?.message || 'Upload failed'),
          });
        }
      });
    }
    
    return results;
  }
  
  // =============================================================================
  // FILE DOWNLOAD OPERATIONS
  // =============================================================================
  
  /**
   * Download file with progress tracking and blob handling
   */
  async downloadFile(
    config: FileDownloadConfig & {
      onProgress?: (progress: FileOperationProgress) => void;
    }
  ): Promise<FileOperationResult> {
    const operationId = generateFileOperationId();
    const startTime = Date.now();
    
    try {
      // Register progress callback
      if (config.onProgress) {
        this.downloadProgressCallbacks.set(operationId, config.onProgress);
      }
      
      // Create abort controller
      const abortController = new AbortController();
      this.activeOperations.set(operationId, abortController);
      
      // Build download URL
      const downloadUrl = buildAbsoluteFileUrl(config.url, [
        { key: 'download', value: config.forceDownload ? 'true' : 'false' },
      ]);
      
      // Fetch file with streaming
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          ...await getCurrentAuthHeaders(),
          ...config.headers,
        },
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      // Get file info from headers
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = config.filename || this.extractFileNameFromDisposition(contentDisposition) || 'download';
      
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      let downloadedSize = 0;
      
      // Create readable stream with progress tracking
      const stream = response.body;
      if (!stream) {
        throw new Error('Response body is not readable');
      }
      
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          downloadedSize += value.length;
          
          // Update progress
          const callback = this.downloadProgressCallbacks.get(operationId);
          if (callback && totalSize > 0) {
            const stats = calculateTransferStats(downloadedSize, totalSize, startTime);
            callback({
              operation: 'download',
              fileName,
              processed: downloadedSize,
              total: totalSize,
              percentage: Math.round((downloadedSize / totalSize) * 100),
              speed: stats.speed,
              timeRemaining: stats.timeRemaining,
              status: 'processing',
            });
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // Create blob from chunks
      const blob = new Blob(chunks, { type: contentType });
      
      // Trigger download if requested
      if (config.forceDownload && typeof window !== 'undefined') {
        this.triggerBrowserDownload(blob, fileName);
      }
      
      // Update final progress
      if (config.onProgress) {
        config.onProgress({
          operation: 'download',
          fileName,
          processed: downloadedSize,
          total: downloadedSize,
          percentage: 100,
          speed: downloadedSize / ((Date.now() - startTime) / 1000),
          status: 'complete',
        });
      }
      
      return {
        success: true,
        data: blob,
        file: {
          name: fileName,
          size: downloadedSize,
          type: contentType,
          lastModified: Date.now(),
        },
        url: downloadUrl,
        duration: Date.now() - startTime,
      };
      
    } catch (error) {
      console.error('File download error:', error);
      
      if (config.onProgress) {
        config.onProgress({
          operation: 'download',
          fileName: config.filename || 'download',
          processed: 0,
          total: 0,
          percentage: 0,
          speed: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Download failed'),
        duration: Date.now() - startTime,
      };
    } finally {
      // Cleanup
      this.downloadProgressCallbacks.delete(operationId);
      this.activeOperations.delete(operationId);
    }
  }
  
  /**
   * Extract filename from Content-Disposition header
   */
  private extractFileNameFromDisposition(disposition: string | null): string | null {
    if (!disposition) return null;
    
    const matches = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (matches?.[1]) {
      return matches[1].replace(/['"]/g, '');
    }
    
    return null;
  }
  
  /**
   * Trigger browser download using blob URL
   */
  private triggerBrowserDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
  
  // =============================================================================
  // DIRECTORY OPERATIONS
  // =============================================================================
  
  /**
   * List directory contents with pagination support
   */
  async listDirectory(
    path: string = '',
    options: {
      limit?: number;
      offset?: number;
      includeMetadata?: boolean;
      filter?: string;
      sort?: string;
    } = {}
  ): Promise<DirectoryListing> {
    const requestConfig = this.createRequest()
      .method('GET')
      .timeout(30000)
      .param('path', path)
      .param('limit', options.limit || 100)
      .param('offset', options.offset || 0)
      .param('include_metadata', options.includeMetadata || false)
      .build();
    
    if (options.filter) {
      requestConfig.additionalParams?.push({ key: 'filter', value: options.filter });
    }
    
    if (options.sort) {
      requestConfig.additionalParams?.push({ key: 'order', value: options.sort });
    }
    
    const response = await this.request<{
      resource: DirectoryItem[];
      meta: { count: number };
    }>(FILE_ENDPOINTS.DIRECTORY, requestConfig);
    
    const items = response.resource || [];
    const totalCount = response.meta?.count || items.length;
    
    return {
      path,
      items,
      totalCount,
      hasMore: (options.offset || 0) + items.length < totalCount,
      parentPath: this.getParentPath(path),
    };
  }
  
  /**
   * Create directory
   */
  async createDirectory(path: string, recursive: boolean = false): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      const requestConfig = this.createRequest()
        .method('POST')
        .timeout(30000)
        .build();
      
      const response = await this.request(FILE_ENDPOINTS.DIRECTORY, requestConfig, {
        path,
        type: 'folder',
        recursive,
      });
      
      return {
        success: true,
        data: response,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Directory creation failed'),
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Delete directory
   */
  async deleteDirectory(
    path: string,
    options: {
      recursive?: boolean;
      force?: boolean;
    } = {}
  ): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      const requestConfig = this.createRequest()
        .method('DELETE')
        .timeout(60000)
        .param('path', path)
        .param('recursive', options.recursive || false)
        .param('force', options.force || false)
        .build();
      
      const response = await this.request(FILE_ENDPOINTS.DIRECTORY, requestConfig);
      
      return {
        success: true,
        data: response,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Directory deletion failed'),
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Get parent directory path
   */
  private getParentPath(path: string): string | undefined {
    if (!path || path === '/') return undefined;
    
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const lastSlashIndex = normalizedPath.lastIndexOf('/');
    
    if (lastSlashIndex <= 0) return '/';
    
    return normalizedPath.substring(0, lastSlashIndex);
  }
  
  // =============================================================================
  // FILE METADATA OPERATIONS
  // =============================================================================
  
  /**
   * Get file metadata with security validation
   */
  async getFileMetadata(
    path: string,
    options: {
      includeSecurity?: boolean;
      includeExtended?: boolean;
    } = {}
  ): Promise<FileMetadata & { security?: SecurityValidationResult }> {
    const requestConfig = this.createRequest()
      .method('GET')
      .timeout(30000)
      .param('path', path)
      .param('include_metadata', true)
      .build();
    
    const response = await this.request<DirectoryItem>(FILE_ENDPOINTS.METADATA, requestConfig);
    
    const metadata: FileMetadata = {
      name: response.name,
      size: response.size || 0,
      type: response.contentType || detectContentType(response.name),
      lastModified: new Date(response.lastModified).getTime(),
    };
    
    // Add security validation if requested
    if (options.includeSecurity) {
      const security = validateFileName(response.name);
      return { ...metadata, security };
    }
    
    return metadata;
  }
  
  /**
   * Update file metadata
   */
  async updateFileMetadata(
    path: string,
    metadata: Partial<FileMetadata>
  ): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      const requestConfig = this.createRequest()
        .method('PATCH')
        .timeout(30000)
        .param('path', path)
        .build();
      
      const response = await this.request(FILE_ENDPOINTS.METADATA, requestConfig, metadata);
      
      return {
        success: true,
        data: response,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Metadata update failed'),
        duration: Date.now() - startTime,
      };
    }
  }
  
  // =============================================================================
  // FILE OPERATION UTILITIES
  // =============================================================================
  
  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      const requestConfig = this.createRequest()
        .method('DELETE')
        .timeout(30000)
        .param('path', path)
        .build();
      
      const response = await this.request(FILE_ENDPOINTS.BASE, requestConfig);
      
      return {
        success: true,
        data: response,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('File deletion failed'),
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Move/rename file
   */
  async moveFile(
    sourcePath: string,
    destinationPath: string,
    overwrite: boolean = false
  ): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      const requestConfig = this.createRequest()
        .method('PATCH')
        .timeout(30000)
        .build();
      
      const response = await this.request(FILE_ENDPOINTS.BASE, requestConfig, {
        source: sourcePath,
        destination: destinationPath,
        overwrite,
        operation: 'move',
      });
      
      return {
        success: true,
        data: response,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('File move failed'),
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Copy file
   */
  async copyFile(
    sourcePath: string,
    destinationPath: string,
    overwrite: boolean = false
  ): Promise<FileOperationResult> {
    const startTime = Date.now();
    
    try {
      const requestConfig = this.createRequest()
        .method('POST')
        .timeout(30000)
        .build();
      
      const response = await this.request(FILE_ENDPOINTS.BASE, requestConfig, {
        source: sourcePath,
        destination: destinationPath,
        overwrite,
        operation: 'copy',
      });
      
      return {
        success: true,
        data: response,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('File copy failed'),
        duration: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Cancel active file operation
   */
  cancelOperation(operationId: string): boolean {
    const controller = this.activeOperations.get(operationId);
    if (controller) {
      controller.abort();
      this.activeOperations.delete(operationId);
      return true;
    }
    return false;
  }
  
  /**
   * Cancel all active operations
   */
  cancelAllOperations(): void {
    this.activeOperations.forEach((controller) => {
      controller.abort();
    });
    this.activeOperations.clear();
    this.uploadProgressCallbacks.clear();
    this.downloadProgressCallbacks.clear();
  }
  
  /**
   * Get active operation count
   */
  getActiveOperationCount(): number {
    return this.activeOperations.size;
  }
  
  /**
   * Validate file for security issues
   */
  validateFileForSecurity(file: File): SecurityValidationResult {
    return validateFileName(file.name);
  }
  
  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }
  
  /**
   * Detect content type from filename
   */
  detectContentType(fileName: string): string {
    return detectContentType(fileName);
  }
  
  /**
   * Build absolute file URL
   */
  buildFileUrl(relativePath: string, params?: KeyValuePair[]): string {
    return buildAbsoluteFileUrl(relativePath, params);
  }
}

// =============================================================================
// FACTORY FUNCTION AND EXPORTS
// =============================================================================

/**
 * Create new FileClient instance with configuration
 */
export function createFileClient(
  baseUrl?: string,
  authContext?: AuthContext
): FileClient {
  return new FileClient(baseUrl, authContext);
}

// Export types and utilities
export type {
  FileOperationType,
  FileChunk,
  DirectoryItem,
  DirectoryListing,
  SecurityValidationResult,
  FileOperationProgress,
};

export {
  FILE_CONFIG,
  FILE_ENDPOINTS,
  generateFileOperationId,
  calculateFileChunks,
  validateFileName,
  detectContentType,
  formatFileSize,
  calculateTransferStats,
  buildAbsoluteFileUrl,
};

export default FileClient;