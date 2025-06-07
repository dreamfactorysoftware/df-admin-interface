/**
 * MSW File System Operation Handlers
 * 
 * Mock Service Worker handlers for comprehensive file system operations including
 * file browsing, upload, download, and directory management. Replicates the behavior
 * of DfFileApiService for testing file management features with realistic responses
 * and proper content-type headers.
 * 
 * This module provides:
 * - File system endpoint mocking for directory listing and file browsing
 * - File upload functionality with FormData handling and progress simulation
 * - File download operations returning appropriate blob responses
 * - Directory creation and file deletion operations
 * - File content retrieval with metadata and content-type headers
 * - File service discovery with fallback handling for log services
 * - Progress tracking simulation for upload operations
 * - Comprehensive error handling for file operation failures
 * 
 * File API Endpoints Covered:
 * - GET /api/v2/files/{service}/* - File browsing and listing
 * - POST /api/v2/files/{service}/* - File upload and directory creation
 * - PUT /api/v2/files/{service}/* - File updates and replacements
 * - DELETE /api/v2/files/{service}/* - File and directory deletion
 * - GET /api/v2/{service}/_schema - File service discovery
 * - GET /system/api/v2/environment - Service configuration retrieval
 */

import { http, HttpResponse } from 'msw';
import {
  validateAuthHeaders,
  extractQueryParams,
  applyPagination,
  applyFilter,
  createJsonResponse,
  createListResponse,
  createBlobResponse,
  createNotFoundError,
  createValidationError,
  createForbiddenError,
  createInternalServerError,
  simulateNetworkDelay,
  processRequestBody,
  logRequest,
  extractIdFromPath,
  formDataToObject,
  applyCaseTransformation,
  PaginationMeta,
} from './utils';
import {
  createDreamFactoryError,
  createResourceNotFoundError,
  createServiceNotFoundError,
  createFormValidationError,
  createInsufficientPermissionsError,
  createDatabaseConnectionError,
  ERROR_CODES,
} from './error-responses';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * File metadata structure from DreamFactory file services
 */
export interface FileMetadata {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content_type?: string;
  last_modified: string;
  content_length?: number;
  is_readable?: boolean;
  is_writable?: boolean;
  is_executable?: boolean;
  md5_checksum?: string;
  etag?: string;
  url?: string;
}

/**
 * File listing response structure
 */
export interface FileListingResponse {
  resource: FileMetadata[];
  count?: number;
  meta?: PaginationMeta;
}

/**
 * File upload progress tracking
 */
export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed?: number;
  timeRemaining?: number;
}

/**
 * File service configuration
 */
export interface FileServiceConfig {
  name: string;
  label: string;
  description: string;
  type: 'file';
  config: {
    container?: string;
    path?: string;
    public_path?: string;
    url?: string;
    credentials?: Record<string, unknown>;
  };
  is_active: boolean;
}

/**
 * Directory creation request
 */
export interface CreateDirectoryRequest {
  name: string;
  path?: string;
  resource?: { name: string; path?: string }[];
}

/**
 * File upload metadata
 */
export interface FileUploadMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  path?: string;
  extract?: boolean;
  clean?: boolean;
  check_exist?: boolean;
  exclude_pattern?: string;
  include_pattern?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Mock file service configurations
 */
const mockFileServices: FileServiceConfig[] = [
  {
    name: 'local_files',
    label: 'Local File System',
    description: 'Local server file system access',
    type: 'file',
    config: {
      container: 'app',
      path: '/app/storage/app',
      public_path: '/storage',
      url: '/files/local_files',
    },
    is_active: true,
  },
  {
    name: 'logs',
    label: 'System Logs',
    description: 'Application and system log files',
    type: 'file',
    config: {
      container: 'logs',
      path: '/app/storage/logs',
      public_path: '/logs',
      url: '/files/logs',
    },
    is_active: true,
  },
  {
    name: 'uploads',
    label: 'User Uploads',
    description: 'User uploaded files and documents',
    type: 'file',
    config: {
      container: 'uploads',
      path: '/app/storage/uploads',
      public_path: '/uploads',
      url: '/files/uploads',
    },
    is_active: true,
  },
];

/**
 * Mock file system structure
 */
const mockFileSystem: Record<string, FileMetadata[]> = {
  'local_files': [
    {
      name: 'documents',
      path: 'documents/',
      type: 'folder',
      last_modified: '2024-03-15T10:30:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
    {
      name: 'images',
      path: 'images/',
      type: 'folder',
      last_modified: '2024-03-14T15:20:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
    {
      name: 'scripts',
      path: 'scripts/',
      type: 'folder',
      last_modified: '2024-03-13T09:45:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
    {
      name: 'readme.txt',
      path: 'readme.txt',
      type: 'file',
      content_type: 'text/plain',
      content_length: 1245,
      last_modified: '2024-03-15T08:00:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: false,
      md5_checksum: 'a1b2c3d4e5f6789012345678901234567890',
      etag: '"1245-60f8a7b2c3d4e5f6"',
    },
    {
      name: 'config.json',
      path: 'config.json',
      type: 'file',
      content_type: 'application/json',
      content_length: 892,
      last_modified: '2024-03-14T16:30:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: false,
      md5_checksum: 'b2c3d4e5f67890123456789012345678901a',
      etag: '"892-70f9a8b3c4d5e6f7"',
    },
  ],
  'local_files/documents': [
    {
      name: 'manual.pdf',
      path: 'documents/manual.pdf',
      type: 'file',
      content_type: 'application/pdf',
      content_length: 2048576,
      last_modified: '2024-03-15T10:15:00Z',
      is_readable: true,
      is_writable: false,
      is_executable: false,
      md5_checksum: 'c3d4e5f678901234567890123456789012ab',
      etag: '"2048576-80faa9b4c5d6e7f8"',
    },
    {
      name: 'report.docx',
      path: 'documents/report.docx',
      type: 'file',
      content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      content_length: 524288,
      last_modified: '2024-03-14T14:20:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: false,
      md5_checksum: 'd4e5f67890123456789012345678901234bc',
      etag: '"524288-90fbaa5c6d7e8f90"',
    },
    {
      name: 'data.xlsx',
      path: 'documents/data.xlsx',
      type: 'file',
      content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      content_length: 1048576,
      last_modified: '2024-03-13T11:45:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: false,
      md5_checksum: 'e5f678901234567890123456789012345cd',
      etag: '"1048576-a0fcbb6d7e8f9012"',
    },
  ],
  'local_files/images': [
    {
      name: 'logo.png',
      path: 'images/logo.png',
      type: 'file',
      content_type: 'image/png',
      content_length: 65536,
      last_modified: '2024-03-14T15:10:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: false,
      md5_checksum: 'f6789012345678901234567890123456de',
      etag: '"65536-b0fdcc7e8f901234"',
    },
    {
      name: 'banner.jpg',
      path: 'images/banner.jpg',
      type: 'file',
      content_type: 'image/jpeg',
      content_length: 131072,
      last_modified: '2024-03-13T09:30:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: false,
      md5_checksum: '67890123456789012345678901234567ef',
      etag: '"131072-c0fedd8f90123456"',
    },
    {
      name: 'thumbnails',
      path: 'images/thumbnails/',
      type: 'folder',
      last_modified: '2024-03-12T16:00:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
  ],
  'local_files/scripts': [
    {
      name: 'backup.sh',
      path: 'scripts/backup.sh',
      type: 'file',
      content_type: 'application/x-sh',
      content_length: 2048,
      last_modified: '2024-03-13T09:40:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
      md5_checksum: '789012345678901234567890123456780f',
      etag: '"2048-d0feee901234567a"',
    },
    {
      name: 'deploy.py',
      path: 'scripts/deploy.py',
      type: 'file',
      content_type: 'text/x-python',
      content_length: 4096,
      last_modified: '2024-03-12T14:15:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
      md5_checksum: '8901234567890123456789012345678901',
      etag: '"4096-e0ffff01234567ab"',
    },
  ],
  'logs': [
    {
      name: 'application.log',
      path: 'application.log',
      type: 'file',
      content_type: 'text/plain',
      content_length: 8388608,
      last_modified: '2024-03-15T11:45:00Z',
      is_readable: true,
      is_writable: false,
      is_executable: false,
      md5_checksum: '901234567890123456789012345678902',
      etag: '"8388608-f01001234567abc"',
    },
    {
      name: 'error.log',
      path: 'error.log',
      type: 'file',
      content_type: 'text/plain',
      content_length: 1048576,
      last_modified: '2024-03-15T11:30:00Z',
      is_readable: true,
      is_writable: false,
      is_executable: false,
      md5_checksum: '012345678901234567890123456789013',
      etag: '"1048576-01234567abcdef"',
    },
    {
      name: 'access.log',
      path: 'access.log',
      type: 'file',
      content_type: 'text/plain',
      content_length: 16777216,
      last_modified: '2024-03-15T11:40:00Z',
      is_readable: true,
      is_writable: false,
      is_executable: false,
      md5_checksum: '123456789012345678901234567890124',
      etag: '"16777216-123456789abcdef0"',
    },
    {
      name: 'archived',
      path: 'archived/',
      type: 'folder',
      last_modified: '2024-03-10T08:00:00Z',
      is_readable: true,
      is_writable: false,
      is_executable: true,
    },
  ],
  'uploads': [
    {
      name: 'user_1',
      path: 'user_1/',
      type: 'folder',
      last_modified: '2024-03-15T09:00:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
    {
      name: 'user_2',
      path: 'user_2/',
      type: 'folder',
      last_modified: '2024-03-14T16:30:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
    {
      name: 'shared',
      path: 'shared/',
      type: 'folder',
      last_modified: '2024-03-13T12:00:00Z',
      is_readable: true,
      is_writable: true,
      is_executable: true,
    },
  ],
};

/**
 * Mock file content data for testing downloads
 */
const mockFileContent: Record<string, string | Uint8Array> = {
  'readme.txt': 'Welcome to DreamFactory!\n\nThis is a comprehensive REST API generation platform.\n\nGetting Started:\n1. Configure database connections\n2. Discover database schemas\n3. Generate REST endpoints\n4. Configure security\n5. Test your APIs\n\nFor more information, visit https://www.dreamfactory.com\n\nVersion: 5.2.1\nBuild: 2024.03.15\n\nSupport: support@dreamfactory.com',
  'config.json': JSON.stringify({
    app: {
      name: 'DreamFactory Admin Interface',
      version: '5.2.1',
      environment: 'production',
      debug: false,
      timezone: 'UTC',
      locale: 'en',
    },
    database: {
      default: 'mysql',
      connections: {
        mysql: {
          driver: 'mysql',
          host: 'localhost',
          port: 3306,
          database: 'dreamfactory',
          username: 'df_admin',
          charset: 'utf8mb4',
          collation: 'utf8mb4_unicode_ci',
        },
      },
    },
    security: {
      jwt_ttl: 60,
      jwt_refresh_ttl: 20160,
      password_min_length: 8,
      max_login_attempts: 5,
      lockout_duration: 900,
    },
    cache: {
      default: 'redis',
      prefix: 'df',
      default_ttl: 3600,
    },
  }, null, 2),
  'documents/manual.pdf': new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]), // PDF header bytes
  'images/logo.png': new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG header bytes
  'scripts/backup.sh': '#!/bin/bash\n\n# DreamFactory backup script\n\necho "Starting backup..."\n\n# Database backup\nmysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql\n\n# File backup\ntar -czf files_backup_$(date +%Y%m%d_%H%M%S).tar.gz /app/storage\n\necho "Backup completed successfully!"',
  'application.log': generateMockLogContent('application'),
  'error.log': generateMockLogContent('error'),
  'access.log': generateMockLogContent('access'),
};

/**
 * Generates mock log content for testing
 */
function generateMockLogContent(type: string): string {
  const now = new Date();
  const lines: string[] = [];
  
  for (let i = 0; i < 100; i++) {
    const timestamp = new Date(now.getTime() - (i * 60000)).toISOString();
    
    switch (type) {
      case 'application':
        lines.push(`[${timestamp}] INFO: Application started successfully`);
        lines.push(`[${timestamp}] INFO: Database connection established`);
        lines.push(`[${timestamp}] INFO: Cache system initialized`);
        break;
      case 'error':
        lines.push(`[${timestamp}] ERROR: Failed to connect to external service`);
        lines.push(`[${timestamp}] WARNING: High memory usage detected`);
        lines.push(`[${timestamp}] ERROR: Database query timeout`);
        break;
      case 'access':
        lines.push(`[${timestamp}] GET /api/v2/system/service - 200 - 125ms`);
        lines.push(`[${timestamp}] POST /api/v2/mysql_prod/users - 201 - 45ms`);
        lines.push(`[${timestamp}] GET /api/v2/files/local_files - 200 - 23ms`);
        break;
    }
  }
  
  return lines.join('\n');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parses file path from URL and extracts service name and path
 */
function parseFilePath(url: string): { serviceName: string; filePath: string } {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/');
  
  // Handle both /api/v2/files/{service} and /{service} patterns
  let serviceIndex = pathSegments.findIndex(segment => segment === 'files');
  if (serviceIndex === -1) {
    // Direct service access pattern
    serviceIndex = pathSegments.findIndex(segment => segment === 'api') + 2; // Skip 'api', 'v2'
  } else {
    serviceIndex += 1; // Move to service name after 'files'
  }
  
  const serviceName = pathSegments[serviceIndex] || '';
  const filePath = pathSegments.slice(serviceIndex + 1).join('/');
  
  return { serviceName, filePath };
}

/**
 * Gets file metadata from mock file system
 */
function getFileMetadata(serviceName: string, filePath: string): FileMetadata | null {
  const key = filePath ? `${serviceName}/${filePath}` : serviceName;
  const files = mockFileSystem[key];
  
  if (!files) return null;
  
  // If requesting a specific file
  if (filePath && !filePath.endsWith('/')) {
    const fileName = filePath.split('/').pop();
    return files.find(file => file.name === fileName) || null;
  }
  
  return null;
}

/**
 * Gets directory listing from mock file system
 */
function getDirectoryListing(serviceName: string, filePath: string = ''): FileMetadata[] {
  const key = filePath ? `${serviceName}/${filePath}`.replace(/\/$/, '') : serviceName;
  return mockFileSystem[key] || [];
}

/**
 * Generates file URL for download
 */
function generateFileUrl(serviceName: string, filePath: string): string {
  const service = mockFileServices.find(s => s.name === serviceName);
  if (!service) return '';
  
  const baseUrl = service.config.url || `/files/${serviceName}`;
  return `${baseUrl}/${filePath}`;
}

/**
 * Determines content type from file extension
 */
function getContentTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    txt: 'text/plain',
    json: 'application/json',
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    sh: 'application/x-sh',
    py: 'text/x-python',
    js: 'text/javascript',
    css: 'text/css',
    html: 'text/html',
    xml: 'application/xml',
    csv: 'text/csv',
    log: 'text/plain',
  };
  
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Simulates file upload progress
 */
async function simulateFileUploadProgress(
  fileSize: number,
  onProgress?: (progress: FileUploadProgress) => void
): Promise<void> {
  const totalChunks = Math.ceil(fileSize / 1024); // 1KB chunks
  let loaded = 0;
  const startTime = Date.now();
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkSize = Math.min(1024, fileSize - loaded);
    loaded += chunkSize;
    
    const elapsed = Date.now() - startTime;
    const speed = loaded / (elapsed / 1000); // bytes per second
    const percentage = (loaded / fileSize) * 100;
    const timeRemaining = speed > 0 ? (fileSize - loaded) / speed : 0;
    
    if (onProgress) {
      onProgress({
        loaded,
        total: fileSize,
        percentage,
        speed,
        timeRemaining,
      });
    }
    
    // Simulate chunk upload delay
    await simulateNetworkDelay(50);
  }
}

/**
 * Validates file operation permissions
 */
function validateFilePermissions(
  operation: 'read' | 'write' | 'delete',
  metadata: FileMetadata
): boolean {
  switch (operation) {
    case 'read':
      return metadata.is_readable || false;
    case 'write':
      return metadata.is_writable || false;
    case 'delete':
      return metadata.is_writable || false;
    default:
      return false;
  }
}

// ============================================================================
// FILE SERVICE DISCOVERY HANDLERS
// ============================================================================

/**
 * GET /api/v2/{service}/_schema - File service discovery
 * Returns file service schema for service discovery
 */
export const fileServiceDiscoveryHandler = http.get(
  '*/api/v2/:service/_schema',
  async ({ request, params }) => {
    await simulateNetworkDelay(100);
    logRequest(request, { handler: 'fileServiceDiscovery', params });

    const { service } = params as { service: string };
    
    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file service discovery',
        401
      );
    }

    // Check if service is a file service
    const fileService = mockFileServices.find(s => s.name === service);
    if (!fileService) {
      // Return empty schema for non-file services (fallback behavior)
      return createJsonResponse({
        table: [],
        view: [],
        procedure: [],
        function: [],
        sequence: [],
      });
    }

    // Return file service schema
    const schema = {
      table: [
        {
          name: '_files',
          label: 'Files',
          description: 'File system access',
          access: fileService.is_active ? ['GET', 'POST', 'PUT', 'DELETE'] : ['GET'],
          fields: [
            {
              name: 'name',
              label: 'File Name',
              type: 'string',
              required: true,
            },
            {
              name: 'path',
              label: 'File Path',
              type: 'string',
              required: true,
            },
            {
              name: 'type',
              label: 'Type',
              type: 'string',
              enum: ['file', 'folder'],
            },
            {
              name: 'content_type',
              label: 'Content Type',
              type: 'string',
            },
            {
              name: 'content_length',
              label: 'Size',
              type: 'integer',
            },
            {
              name: 'last_modified',
              label: 'Last Modified',
              type: 'datetime',
            },
          ],
        },
      ],
      view: [],
      procedure: [],
      function: [],
      sequence: [],
    };

    return createJsonResponse(schema);
  }
);

/**
 * GET /system/api/v2/environment - Get system environment including file services
 */
export const systemEnvironmentHandler = http.get(
  '*/system/api/v2/environment',
  async ({ request }) => {
    await simulateNetworkDelay(50);
    logRequest(request, { handler: 'systemEnvironment' });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for system environment',
        401
      );
    }

    const environment = {
      platform: {
        version: '5.2.1',
        build: '2024.03.15',
        edition: 'Silver',
        license_key: 'DF-SLV-XXXX-XXXX-XXXX-XXXX',
      },
      app: {
        name: 'DreamFactory Admin Interface',
        environment: 'testing',
        debug: true,
      },
      services: {
        file: mockFileServices.filter(service => service.is_active),
      },
    };

    return createJsonResponse(environment);
  }
);

// ============================================================================
// FILE BROWSING HANDLERS
// ============================================================================

/**
 * GET /api/v2/files/{service}/* - File browsing and listing
 * Returns directory listings or file metadata
 */
export const fileBrowsingHandler = http.get(
  '*/api/v2/files/:service/*',
  async ({ request, params }) => {
    await simulateNetworkDelay(150);
    
    const { service } = params as { service: string };
    const { serviceName, filePath } = parseFilePath(request.url);
    
    logRequest(request, { 
      handler: 'fileBrowsing', 
      serviceName, 
      filePath,
      params 
    });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file access',
        401
      );
    }

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === serviceName);
    if (!fileService) {
      return createServiceNotFoundError(serviceName);
    }

    // Extract query parameters
    const queryParams = extractQueryParams(request);
    const { limit = 25, offset = 0, filter, fields, include_count = true } = queryParams;

    // Check if requesting specific file
    if (filePath && !filePath.endsWith('/')) {
      const metadata = getFileMetadata(serviceName, filePath);
      if (!metadata) {
        return createResourceNotFoundError('File', filePath);
      }

      // Check read permissions
      if (!validateFilePermissions('read', metadata)) {
        return createForbiddenError('Insufficient permissions to read file');
      }

      // Add download URL
      metadata.url = generateFileUrl(serviceName, filePath);

      return createJsonResponse(metadata);
    }

    // Get directory listing
    let files = getDirectoryListing(serviceName, filePath);

    // Apply filtering
    if (filter) {
      files = applyFilter(files, filter);
    }

    // Apply pagination
    const { data: paginatedFiles, meta } = applyPagination(files, limit, offset);

    // Filter fields if specified
    if (fields) {
      const fieldList = fields.split(',').map(f => f.trim());
      const filteredFiles = paginatedFiles.map(file => {
        const filtered: Partial<FileMetadata> = {};
        fieldList.forEach(field => {
          if (field in file) {
            (filtered as any)[field] = (file as any)[field];
          }
        });
        return filtered as FileMetadata;
      });
      return createListResponse(filteredFiles, meta);
    }

    // Add URLs to files
    const filesWithUrls = paginatedFiles.map(file => ({
      ...file,
      url: file.type === 'file' ? generateFileUrl(serviceName, file.path) : undefined,
    }));

    return createListResponse(filesWithUrls, meta);
  }
);

/**
 * GET /api/v2/files/{service} - Root directory listing
 */
export const fileRootListingHandler = http.get(
  '*/api/v2/files/:service',
  async ({ request, params }) => {
    await simulateNetworkDelay(100);
    
    const { service } = params as { service: string };
    
    logRequest(request, { handler: 'fileRootListing', service });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file access',
        401
      );
    }

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === service);
    if (!fileService) {
      return createServiceNotFoundError(service);
    }

    // Extract query parameters
    const queryParams = extractQueryParams(request);
    const { limit = 25, offset = 0, filter } = queryParams;

    // Get root directory listing
    let files = getDirectoryListing(service);

    // Apply filtering
    if (filter) {
      files = applyFilter(files, filter);
    }

    // Apply pagination
    const { data: paginatedFiles, meta } = applyPagination(files, limit, offset);

    // Add URLs to files
    const filesWithUrls = paginatedFiles.map(file => ({
      ...file,
      url: file.type === 'file' ? generateFileUrl(service, file.path) : undefined,
    }));

    return createListResponse(filesWithUrls, meta);
  }
);

// ============================================================================
// FILE DOWNLOAD HANDLERS
// ============================================================================

/**
 * GET /files/{service}/* - File download (direct file access)
 * Returns file content as blob response
 */
export const fileDownloadHandler = http.get(
  '*/files/:service/*',
  async ({ request, params }) => {
    await simulateNetworkDelay(200);
    
    const { service } = params as { service: string };
    const { serviceName, filePath } = parseFilePath(request.url.replace('/files/', '/api/v2/files/'));
    
    logRequest(request, { 
      handler: 'fileDownload', 
      serviceName, 
      filePath 
    });

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === serviceName);
    if (!fileService) {
      return createServiceNotFoundError(serviceName);
    }

    // Get file metadata
    const metadata = getFileMetadata(serviceName, filePath);
    if (!metadata || metadata.type !== 'file') {
      return createResourceNotFoundError('File', filePath);
    }

    // Check read permissions
    if (!validateFilePermissions('read', metadata)) {
      return createForbiddenError('Insufficient permissions to download file');
    }

    // Get file content
    const contentKey = filePath;
    const content = mockFileContent[contentKey] || mockFileContent[metadata.name];
    
    if (!content) {
      return createInternalServerError('File content not available');
    }

    // Return blob response with appropriate headers
    return createBlobResponse(
      content,
      metadata.content_type,
      metadata.name
    );
  }
);

// ============================================================================
// FILE UPLOAD HANDLERS
// ============================================================================

/**
 * POST /api/v2/files/{service}/* - File upload and directory creation
 * Handles FormData uploads and directory creation requests
 */
export const fileUploadHandler = http.post(
  '*/api/v2/files/:service/*',
  async ({ request, params }) => {
    await simulateNetworkDelay(300);
    
    const { service } = params as { service: string };
    const { serviceName, filePath } = parseFilePath(request.url);
    
    logRequest(request, { 
      handler: 'fileUpload', 
      serviceName, 
      filePath,
      contentType: request.headers.get('content-type')
    });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file upload',
        401
      );
    }

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === serviceName);
    if (!fileService) {
      return createServiceNotFoundError(serviceName);
    }

    // Check if service is writable
    if (!fileService.is_active) {
      return createForbiddenError('File service is not active');
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle FormData uploads
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const uploadedFiles: FileMetadata[] = [];

        // Process each file in the FormData
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            // Simulate upload progress
            await simulateFileUploadProgress(value.size);

            // Create file metadata
            const uploadPath = filePath ? `${filePath}/${value.name}` : value.name;
            const fileMetadata: FileMetadata = {
              name: value.name,
              path: uploadPath,
              type: 'file',
              content_type: value.type || getContentTypeFromExtension(value.name),
              content_length: value.size,
              last_modified: new Date().toISOString(),
              is_readable: true,
              is_writable: true,
              is_executable: value.name.endsWith('.sh') || value.name.endsWith('.py'),
              md5_checksum: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              etag: `"${value.size}-${Date.now()}"`,
              url: generateFileUrl(serviceName, uploadPath),
            };

            uploadedFiles.push(fileMetadata);

            // Store content for potential download testing
            const reader = new FileReader();
            reader.onload = () => {
              mockFileContent[uploadPath] = new Uint8Array(reader.result as ArrayBuffer);
            };
            reader.readAsArrayBuffer(value);
          }
        }

        if (uploadedFiles.length === 0) {
          return createValidationError('No files found in upload', {
            files: ['At least one file must be uploaded'],
          });
        }

        return createJsonResponse({
          resource: uploadedFiles,
          count: uploadedFiles.length,
        }, 201);
      } catch (error) {
        return createInternalServerError('Failed to process file upload');
      }
    }

    // Handle JSON requests for directory creation
    try {
      const body = await processRequestBody(request);
      const { transformedRequestBody } = applyCaseTransformation(request, body);
      const requestData = transformedRequestBody as CreateDirectoryRequest;

      if (requestData.name) {
        // Single directory creation
        const dirPath = filePath ? `${filePath}/${requestData.name}/` : `${requestData.name}/`;
        const directoryMetadata: FileMetadata = {
          name: requestData.name,
          path: dirPath,
          type: 'folder',
          last_modified: new Date().toISOString(),
          is_readable: true,
          is_writable: true,
          is_executable: true,
        };

        return createJsonResponse(directoryMetadata, 201);
      }

      if (requestData.resource && Array.isArray(requestData.resource)) {
        // Bulk directory creation
        const createdDirectories: FileMetadata[] = [];

        for (const dir of requestData.resource) {
          const dirPath = filePath ? `${filePath}/${dir.name}/` : `${dir.name}/`;
          const directoryMetadata: FileMetadata = {
            name: dir.name,
            path: dirPath,
            type: 'folder',
            last_modified: new Date().toISOString(),
            is_readable: true,
            is_writable: true,
            is_executable: true,
          };
          createdDirectories.push(directoryMetadata);
        }

        return createJsonResponse({
          resource: createdDirectories,
          count: createdDirectories.length,
        }, 201);
      }

      return createValidationError('Invalid request format', {
        name: ['Directory name is required'],
      });
    } catch (error) {
      return createInternalServerError('Failed to create directory');
    }
  }
);

/**
 * POST /api/v2/files/{service} - Root level upload
 */
export const fileRootUploadHandler = http.post(
  '*/api/v2/files/:service',
  async ({ request, params }) => {
    await simulateNetworkDelay(250);
    
    const { service } = params as { service: string };
    
    logRequest(request, { 
      handler: 'fileRootUpload', 
      service,
      contentType: request.headers.get('content-type')
    });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file upload',
        401
      );
    }

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === service);
    if (!fileService) {
      return createServiceNotFoundError(service);
    }

    // Check if service is writable
    if (!fileService.is_active) {
      return createForbiddenError('File service is not active');
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle FormData uploads
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const uploadedFiles: FileMetadata[] = [];

        // Process each file in the FormData
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            // Simulate upload progress
            await simulateFileUploadProgress(value.size);

            // Create file metadata
            const fileMetadata: FileMetadata = {
              name: value.name,
              path: value.name,
              type: 'file',
              content_type: value.type || getContentTypeFromExtension(value.name),
              content_length: value.size,
              last_modified: new Date().toISOString(),
              is_readable: true,
              is_writable: true,
              is_executable: value.name.endsWith('.sh') || value.name.endsWith('.py'),
              md5_checksum: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              etag: `"${value.size}-${Date.now()}"`,
              url: generateFileUrl(service, value.name),
            };

            uploadedFiles.push(fileMetadata);
          }
        }

        if (uploadedFiles.length === 0) {
          return createValidationError('No files found in upload', {
            files: ['At least one file must be uploaded'],
          });
        }

        return createJsonResponse({
          resource: uploadedFiles,
          count: uploadedFiles.length,
        }, 201);
      } catch (error) {
        return createInternalServerError('Failed to process file upload');
      }
    }

    return createValidationError('Unsupported content type for file upload');
  }
);

// ============================================================================
// FILE UPDATE HANDLERS
// ============================================================================

/**
 * PUT /api/v2/files/{service}/* - File replacement and updates
 */
export const fileUpdateHandler = http.put(
  '*/api/v2/files/:service/*',
  async ({ request, params }) => {
    await simulateNetworkDelay(200);
    
    const { service } = params as { service: string };
    const { serviceName, filePath } = parseFilePath(request.url);
    
    logRequest(request, { 
      handler: 'fileUpdate', 
      serviceName, 
      filePath 
    });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file update',
        401
      );
    }

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === serviceName);
    if (!fileService) {
      return createServiceNotFoundError(serviceName);
    }

    // Check if file exists
    const metadata = getFileMetadata(serviceName, filePath);
    if (!metadata) {
      return createResourceNotFoundError('File', filePath);
    }

    // Check write permissions
    if (!validateFilePermissions('write', metadata)) {
      return createForbiddenError('Insufficient permissions to update file');
    }

    const contentType = request.headers.get('content-type') || '';

    // Handle FormData uploads
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return createValidationError('No file provided for update');
        }

        // Simulate upload progress
        await simulateFileUploadProgress(file.size);

        // Update file metadata
        const updatedMetadata: FileMetadata = {
          ...metadata,
          content_type: file.type || getContentTypeFromExtension(file.name),
          content_length: file.size,
          last_modified: new Date().toISOString(),
          md5_checksum: `updated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          etag: `"${file.size}-${Date.now()}"`,
          url: generateFileUrl(serviceName, filePath),
        };

        return createJsonResponse(updatedMetadata);
      } catch (error) {
        return createInternalServerError('Failed to update file');
      }
    }

    return createValidationError('Unsupported content type for file update');
  }
);

// ============================================================================
// FILE DELETION HANDLERS
// ============================================================================

/**
 * DELETE /api/v2/files/{service}/* - File and directory deletion
 */
export const fileDeletionHandler = http.delete(
  '*/api/v2/files/:service/*',
  async ({ request, params }) => {
    await simulateNetworkDelay(100);
    
    const { service } = params as { service: string };
    const { serviceName, filePath } = parseFilePath(request.url);
    
    logRequest(request, { 
      handler: 'fileDeletion', 
      serviceName, 
      filePath 
    });

    // Validate authentication
    const authResult = validateAuthHeaders(request);
    if (!authResult.isValid) {
      return createDreamFactoryError(
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required for file deletion',
        401
      );
    }

    // Check if service exists
    const fileService = mockFileServices.find(s => s.name === serviceName);
    if (!fileService) {
      return createServiceNotFoundError(serviceName);
    }

    // Check if file/directory exists
    const metadata = getFileMetadata(serviceName, filePath);
    if (!metadata) {
      return createResourceNotFoundError('File', filePath);
    }

    // Check delete permissions
    if (!validateFilePermissions('delete', metadata)) {
      return createForbiddenError('Insufficient permissions to delete file');
    }

    // For log service, prevent deletion of log files
    if (serviceName === 'logs' && metadata.type === 'file') {
      return createForbiddenError('Log files cannot be deleted');
    }

    // Return success response
    return createJsonResponse({
      name: metadata.name,
      path: metadata.path,
      deleted: true,
      timestamp: new Date().toISOString(),
    });
  }
);

// ============================================================================
// EXPORT HANDLERS
// ============================================================================

/**
 * All file operation handlers for MSW
 */
export const fileHandlers = [
  fileServiceDiscoveryHandler,
  systemEnvironmentHandler,
  fileBrowsingHandler,
  fileRootListingHandler,
  fileDownloadHandler,
  fileUploadHandler,
  fileRootUploadHandler,
  fileUpdateHandler,
  fileDeletionHandler,
];

export default fileHandlers;