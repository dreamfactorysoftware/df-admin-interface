/**
 * MSW File System Operation Handlers
 * 
 * Comprehensive Mock Service Worker handlers for file system operations including
 * file browsing, upload, download, and directory management. Replicates the behavior
 * of DfFileApiService for testing file management features in the React/Next.js
 * implementation.
 * 
 * This module provides complete file service mocking capabilities that simulate:
 * - File and directory browsing with hierarchical navigation
 * - File upload operations with FormData handling and progress simulation
 * - File download operations with proper blob responses and content-type headers
 * - Directory creation and file deletion operations
 * - File metadata retrieval with MIME type detection
 * - Log file service discovery and content access
 * - Error scenarios for comprehensive error handling testing
 * 
 * All handlers maintain compatibility with DreamFactory API patterns while
 * providing realistic testing data for the F-008 File and Log Management feature.
 */

import { http, HttpResponse } from 'msw';
import type { RequestHandler } from 'msw';
import {
  createJsonResponse,
  createErrorResponse,
  createNotFoundError,
  createForbiddenError,
  createBadRequestError,
  createServerError,
  validateAuthHeaders,
  extractQueryParams,
  paginateData,
  createPaginationMeta,
  simulateNetworkDelay,
  logRequest,
  extractServiceName,
  extractResourcePath,
  isServiceApiPath,
} from './utils';
import {
  createFieldValidationError,
  createMultipleFieldValidationErrors,
  errorScenarios,
} from './error-responses';
import { mockData } from './mock-data';

// ============================================================================
// FILE SYSTEM MOCK DATA
// ============================================================================

/**
 * File system entry interface matching DreamFactory file service responses
 */
interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  content_type?: string;
  last_modified?: string;
  is_base64?: boolean;
  content?: string;
  metadata?: {
    owner?: string;
    permissions?: string;
    created?: string;
    modified?: string;
    accessed?: string;
    [key: string]: any;
  };
}

/**
 * Directory listing response structure
 */
interface DirectoryListing {
  resource: FileSystemEntry[];
  meta?: {
    count: number;
    total: number;
    path: string;
    container?: string;
  };
}

/**
 * File upload progress simulation
 */
interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

/**
 * Mock file system data structure
 */
const mockFileSystem: Record<string, FileSystemEntry[]> = {
  // Root directory for file service
  '/': [
    {
      name: 'applications',
      path: '/applications',
      type: 'folder',
      last_modified: '2024-03-15T10:30:00Z',
      metadata: {
        owner: 'admin',
        permissions: 'drwxr-xr-x',
        created: '2024-01-01T00:00:00Z',
        modified: '2024-03-15T10:30:00Z',
        accessed: '2024-03-15T12:00:00Z',
      },
    },
    {
      name: 'logs',
      path: '/logs',
      type: 'folder',
      last_modified: '2024-03-15T11:45:00Z',
      metadata: {
        owner: 'system',
        permissions: 'drwxr--r--',
        created: '2024-01-01T00:00:00Z',
        modified: '2024-03-15T11:45:00Z',
        accessed: '2024-03-15T12:00:00Z',
      },
    },
    {
      name: 'uploads',
      path: '/uploads',
      type: 'folder',
      last_modified: '2024-03-15T12:00:00Z',
      metadata: {
        owner: 'admin',
        permissions: 'drwxrwxrwx',
        created: '2024-02-01T00:00:00Z',
        modified: '2024-03-15T12:00:00Z',
        accessed: '2024-03-15T12:00:00Z',
      },
    },
    {
      name: 'config.json',
      path: '/config.json',
      type: 'file',
      size: 2048,
      content_type: 'application/json',
      last_modified: '2024-03-10T14:30:00Z',
      content: JSON.stringify({
        version: '5.2.1',
        environment: 'production',
        features: ['api_generation', 'file_management', 'user_management'],
        last_updated: '2024-03-10T14:30:00Z',
      }, null, 2),
      metadata: {
        owner: 'admin',
        permissions: '-rw-r--r--',
        created: '2024-01-01T00:00:00Z',
        modified: '2024-03-10T14:30:00Z',
        accessed: '2024-03-15T10:00:00Z',
      },
    },
    {
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      size: 1536,
      content_type: 'text/markdown',
      last_modified: '2024-02-15T09:00:00Z',
      content: `# DreamFactory File System

This directory contains application files, configuration, and system logs.

## Directory Structure

- \`/applications\` - Application deployment files
- \`/logs\` - System and application logs  
- \`/uploads\` - User uploaded files

## File Management

Use the DreamFactory admin interface to manage files and directories.
For more information, visit: https://www.dreamfactory.com/docs/
`,
      metadata: {
        owner: 'admin',
        permissions: '-rw-r--r--',
        created: '2024-02-15T09:00:00Z',
        modified: '2024-02-15T09:00:00Z',
        accessed: '2024-03-15T10:00:00Z',
      },
    },
  ],

  // Applications directory
  '/applications': [
    {
      name: 'web-app',
      path: '/applications/web-app',
      type: 'folder',
      last_modified: '2024-03-14T16:20:00Z',
      metadata: {
        owner: 'developer',
        permissions: 'drwxr-xr-x',
        created: '2024-02-01T10:00:00Z',
        modified: '2024-03-14T16:20:00Z',
        accessed: '2024-03-15T11:00:00Z',
      },
    },
    {
      name: 'mobile-app',
      path: '/applications/mobile-app',
      type: 'folder',
      last_modified: '2024-03-12T14:15:00Z',
      metadata: {
        owner: 'developer',
        permissions: 'drwxr-xr-x',
        created: '2024-02-10T15:30:00Z',
        modified: '2024-03-12T14:15:00Z',
        accessed: '2024-03-15T09:30:00Z',
      },
    },
  ],

  // Web application directory
  '/applications/web-app': [
    {
      name: 'index.html',
      path: '/applications/web-app/index.html',
      type: 'file',
      size: 3072,
      content_type: 'text/html',
      last_modified: '2024-03-14T16:20:00Z',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DreamFactory Web Application</title>
</head>
<body>
    <h1>Welcome to DreamFactory</h1>
    <p>Your API is ready!</p>
    <script src="app.js"></script>
</body>
</html>`,
      metadata: {
        owner: 'developer',
        permissions: '-rw-r--r--',
        created: '2024-02-01T10:00:00Z',
        modified: '2024-03-14T16:20:00Z',
        accessed: '2024-03-15T11:00:00Z',
      },
    },
    {
      name: 'app.js',
      path: '/applications/web-app/app.js',
      type: 'file',
      size: 4096,
      content_type: 'application/javascript',
      last_modified: '2024-03-14T16:18:00Z',
      content: `// DreamFactory Web Application
const API_BASE = 'https://api.dreamfactory.local/api/v2';
const API_KEY = 'your-api-key-here';

async function fetchData() {
    try {
        const response = await fetch(\`\${API_BASE}/mysql/users\`, {
            headers: {
                'X-DreamFactory-API-Key': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Users data:', data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

document.addEventListener('DOMContentLoaded', fetchData);`,
      metadata: {
        owner: 'developer',
        permissions: '-rw-r--r--',
        created: '2024-02-01T10:15:00Z',
        modified: '2024-03-14T16:18:00Z',
        accessed: '2024-03-15T11:00:00Z',
      },
    },
    {
      name: 'styles.css',
      path: '/applications/web-app/styles.css',
      type: 'file',
      size: 1024,
      content_type: 'text/css',
      last_modified: '2024-03-12T11:30:00Z',
      content: `/* DreamFactory Web Application Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #5b39f3;
    text-align: center;
}

p {
    text-align: center;
    font-size: 18px;
    color: #666;
}`,
      metadata: {
        owner: 'developer',
        permissions: '-rw-r--r--',
        created: '2024-02-01T10:30:00Z',
        modified: '2024-03-12T11:30:00Z',
        accessed: '2024-03-15T11:00:00Z',
      },
    },
  ],

  // Logs directory
  '/logs': [
    {
      name: 'application.log',
      path: '/logs/application.log',
      type: 'file',
      size: 15360,
      content_type: 'text/plain',
      last_modified: '2024-03-15T11:45:00Z',
      content: `[2024-03-15 11:45:00] INFO: Application started successfully
[2024-03-15 11:44:30] INFO: Database connection established
[2024-03-15 11:44:25] INFO: Loading configuration from /config.json
[2024-03-15 11:44:20] INFO: DreamFactory initializing...
[2024-03-15 11:30:15] INFO: User 'admin' logged in successfully
[2024-03-15 11:25:42] INFO: API endpoint /api/v2/mysql/users accessed
[2024-03-15 11:20:18] INFO: File upload completed: /uploads/document.pdf
[2024-03-15 11:15:33] WARN: High memory usage detected: 85%
[2024-03-15 11:10:27] INFO: Schema discovery completed for service 'mysql_production'
[2024-03-15 11:05:45] INFO: Service 'mysql_production' connection tested successfully`,
      metadata: {
        owner: 'system',
        permissions: '-rw-r--r--',
        created: '2024-03-15T00:00:00Z',
        modified: '2024-03-15T11:45:00Z',
        accessed: '2024-03-15T11:45:00Z',
      },
    },
    {
      name: 'error.log',
      path: '/logs/error.log',
      type: 'file',
      size: 8192,
      content_type: 'text/plain',
      last_modified: '2024-03-15T09:30:00Z',
      content: `[2024-03-15 09:30:15] ERROR: Database connection timeout for service 'mysql_staging'
[2024-03-15 09:25:42] ERROR: Invalid API key provided in request header
[2024-03-15 09:20:18] ERROR: File upload failed: insufficient disk space
[2024-03-15 09:15:33] WARN: Rate limit exceeded for IP 192.168.1.100
[2024-03-15 09:10:27] ERROR: Schema discovery failed: table 'users' not found
[2024-03-15 09:05:45] ERROR: Authentication failed for user 'test@example.com'`,
      metadata: {
        owner: 'system',
        permissions: '-rw-r--r--',
        created: '2024-03-15T00:00:00Z',
        modified: '2024-03-15T09:30:00Z',
        accessed: '2024-03-15T09:30:00Z',
      },
    },
    {
      name: 'access.log',
      path: '/logs/access.log',
      type: 'file',
      size: 25600,
      content_type: 'text/plain',
      last_modified: '2024-03-15T11:45:00Z',
      content: `192.168.1.100 - admin [15/Mar/2024:11:45:00 +0000] "GET /api/v2/mysql/users HTTP/1.1" 200 2048
192.168.1.101 - developer [15/Mar/2024:11:40:30 +0000] "POST /api/v2/system/service HTTP/1.1" 201 1024
192.168.1.102 - user1 [15/Mar/2024:11:35:15 +0000] "GET /api/v2/files/ HTTP/1.1" 200 4096
192.168.1.100 - admin [15/Mar/2024:11:30:45 +0000] "GET /api/v2/mysql/_schema HTTP/1.1" 200 8192
192.168.1.103 - analyst [15/Mar/2024:11:25:20 +0000] "GET /api/v2/postgresql/products HTTP/1.1" 200 3072`,
      metadata: {
        owner: 'system',
        permissions: '-rw-r--r--',
        created: '2024-03-15T00:00:00Z',
        modified: '2024-03-15T11:45:00Z',
        accessed: '2024-03-15T11:45:00Z',
      },
    },
  ],

  // Uploads directory
  '/uploads': [
    {
      name: 'document.pdf',
      path: '/uploads/document.pdf',
      type: 'file',
      size: 204800,
      content_type: 'application/pdf',
      last_modified: '2024-03-15T11:20:00Z',
      is_base64: true,
      metadata: {
        owner: 'user1',
        permissions: '-rw-r--r--',
        created: '2024-03-15T11:20:00Z',
        modified: '2024-03-15T11:20:00Z',
        accessed: '2024-03-15T11:20:00Z',
        original_name: 'User Manual.pdf',
        upload_session: 'session_12345',
      },
    },
    {
      name: 'image.jpg',
      path: '/uploads/image.jpg',
      type: 'file',
      size: 153600,
      content_type: 'image/jpeg',
      last_modified: '2024-03-14T15:30:00Z',
      is_base64: true,
      metadata: {
        owner: 'user2',
        permissions: '-rw-r--r--',
        created: '2024-03-14T15:30:00Z',
        modified: '2024-03-14T15:30:00Z',
        accessed: '2024-03-15T10:00:00Z',
        original_name: 'product_photo.jpg',
        upload_session: 'session_67890',
        image_dimensions: '1920x1080',
      },
    },
    {
      name: 'data.csv',
      path: '/uploads/data.csv',
      type: 'file',
      size: 8192,
      content_type: 'text/csv',
      last_modified: '2024-03-13T14:45:00Z',
      content: `id,name,email,role
1,John Doe,john@example.com,admin
2,Jane Smith,jane@example.com,developer
3,Bob Wilson,bob@example.com,analyst
4,Alice Brown,alice@example.com,user`,
      metadata: {
        owner: 'analyst',
        permissions: '-rw-r--r--',
        created: '2024-03-13T14:45:00Z',
        modified: '2024-03-13T14:45:00Z',
        accessed: '2024-03-15T09:00:00Z',
        original_name: 'user_export.csv',
        upload_session: 'session_54321',
      },
    },
  ],
};

/**
 * File service types and their configurations
 */
const fileServices = {
  files: {
    name: 'files',
    label: 'Local File Storage',
    description: 'Local file system storage service',
    type: 'file',
    config: {
      container: 'local',
      public_path: '/storage/app/public',
      path: '/storage/app',
    },
    is_active: true,
  },
  logs: {
    name: 'logs',
    label: 'System Logs',
    description: 'System and application log files',
    type: 'file',
    config: {
      container: 'logs',
      public_path: '/var/log/dreamfactory',
      path: '/var/log/dreamfactory',
      read_only: true,
    },
    is_active: true,
  },
  uploads: {
    name: 'uploads',
    label: 'User Uploads',
    description: 'User uploaded files storage',
    type: 'file',
    config: {
      container: 'uploads',
      public_path: '/storage/uploads',
      path: '/storage/uploads',
      max_file_size: '50MB',
      allowed_extensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'csv', 'txt'],
    },
    is_active: true,
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    // Text files
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    log: 'text/plain',
    
    // Web files
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    
    // Archives
    zip: 'application/zip',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    
    // Audio/Video
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    
    // Default
    default: 'application/octet-stream',
  };
  
  return mimeTypes[ext || ''] || mimeTypes.default;
}

/**
 * Get file system entries for a given path
 */
function getFileSystemEntries(path: string): FileSystemEntry[] {
  // Normalize path - remove trailing slash except for root
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
  return mockFileSystem[normalizedPath] || [];
}

/**
 * Find a specific file or directory by path
 */
function findFileSystemEntry(path: string): FileSystemEntry | null {
  // Check if path exists in our mock data
  const entries = getFileSystemEntries(path);
  if (entries.length > 0) {
    // This is a directory
    return {
      name: path.split('/').pop() || path,
      path,
      type: 'folder',
      last_modified: new Date().toISOString(),
      metadata: {
        owner: 'system',
        permissions: 'drwxr-xr-x',
      },
    };
  }
  
  // Look for the file in parent directories
  const pathParts = path.split('/');
  const fileName = pathParts.pop();
  const parentPath = pathParts.join('/') || '/';
  const parentEntries = getFileSystemEntries(parentPath);
  
  return parentEntries.find(entry => entry.name === fileName) || null;
}

/**
 * Create a new file entry
 */
function createFileEntry(
  path: string,
  content: string | Buffer,
  contentType?: string,
  metadata?: any
): FileSystemEntry {
  const fileName = path.split('/').pop() || path;
  const size = typeof content === 'string' ? content.length : content.length;
  const now = new Date().toISOString();
  
  return {
    name: fileName,
    path,
    type: 'file',
    size,
    content_type: contentType || getMimeType(fileName),
    last_modified: now,
    content: typeof content === 'string' ? content : undefined,
    is_base64: typeof content !== 'string',
    metadata: {
      owner: 'user',
      permissions: '-rw-r--r--',
      created: now,
      modified: now,
      accessed: now,
      ...metadata,
    },
  };
}

/**
 * Simulate file upload progress
 */
function simulateUploadProgress(): UploadProgress[] {
  return [
    { loaded: 0, total: 100, percentage: 0, status: 'uploading', message: 'Starting upload...' },
    { loaded: 25, total: 100, percentage: 25, status: 'uploading', message: 'Uploading...' },
    { loaded: 50, total: 100, percentage: 50, status: 'uploading', message: 'Uploading...' },
    { loaded: 75, total: 100, percentage: 75, status: 'uploading', message: 'Uploading...' },
    { loaded: 90, total: 100, percentage: 90, status: 'processing', message: 'Processing file...' },
    { loaded: 100, total: 100, percentage: 100, status: 'complete', message: 'Upload complete!' },
  ];
}

// ============================================================================
// FILE SERVICE DISCOVERY HANDLERS
// ============================================================================

/**
 * Handler for file service discovery
 * GET /api/v2/system/service - Returns available file services
 */
export const getFileServicesHandler: RequestHandler = http.get(
  '/api/v2/system/service',
  async ({ request }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Services Discovery');

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = extractQueryParams(url.toString());
    const { filter, limit, offset } = queryParams;

    try {
      // Get all services and filter for file services
      let services = Object.values(fileServices);

      // Apply filter if provided
      if (filter) {
        const filterLower = filter.toLowerCase();
        services = services.filter(service => 
          service.name.toLowerCase().includes(filterLower) ||
          service.label.toLowerCase().includes(filterLower) ||
          service.type.toLowerCase().includes(filterLower)
        );
      }

      // Apply pagination
      const paginatedServices = paginateData(services, limit, offset);
      const meta = createPaginationMeta(services.length, limit, offset);

      return createJsonResponse({
        resource: paginatedServices,
        meta,
      });

    } catch (error) {
      return createServerError('Failed to retrieve file services');
    }
  }
);

/**
 * Handler for specific file service information
 * GET /api/v2/system/service/{serviceName} - Returns specific file service details
 */
export const getFileServiceHandler: RequestHandler = http.get(
  '/api/v2/system/service/:serviceName',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Service Details');

    const serviceName = params.serviceName as string;

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      const service = fileServices[serviceName as keyof typeof fileServices];
      
      if (!service) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      return createJsonResponse(service);

    } catch (error) {
      return createServerError(`Failed to retrieve service '${serviceName}'`);
    }
  }
);

// ============================================================================
// FILE BROWSING HANDLERS
// ============================================================================

/**
 * Handler for directory listing and file browsing
 * GET /api/v2/{serviceName}/ - List files and directories in root
 * GET /api/v2/{serviceName}/{path} - List files and directories in specific path
 */
export const fileBrowsingHandler: RequestHandler = http.get(
  '/api/v2/:serviceName/*',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Browsing');

    const serviceName = params.serviceName as string;
    const pathParam = params['*'] as string;
    
    // Determine the path - default to root if not provided
    const requestedPath = pathParam ? `/${pathParam}` : '/';

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      if (!fileServices[serviceName as keyof typeof fileServices]) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Extract query parameters
      const url = new URL(request.url);
      const queryParams = extractQueryParams(url.toString());
      const { include_files = true, include_folders = true, limit, offset } = queryParams;

      // Get entries for the requested path
      let entries = getFileSystemEntries(requestedPath);

      // Filter by type if requested
      if (!include_files) {
        entries = entries.filter(entry => entry.type === 'folder');
      }
      if (!include_folders) {
        entries = entries.filter(entry => entry.type === 'file');
      }

      // Apply pagination
      const paginatedEntries = paginateData(entries, limit, offset);
      const meta = {
        ...createPaginationMeta(entries.length, limit, offset),
        path: requestedPath,
        container: serviceName,
      };

      const response: DirectoryListing = {
        resource: paginatedEntries,
        meta,
      };

      return createJsonResponse(response);

    } catch (error) {
      return createServerError('Failed to retrieve directory listing');
    }
  }
);

/**
 * Handler for specific file content retrieval
 * GET /api/v2/{serviceName}/{filePath} - Get file content with metadata
 */
export const fileContentHandler: RequestHandler = http.get(
  '/api/v2/:serviceName/:filePath+',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Content Retrieval');

    const serviceName = params.serviceName as string;
    const filePath = `/${params.filePath}`;

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      if (!fileServices[serviceName as keyof typeof fileServices]) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Find the file
      const fileEntry = findFileSystemEntry(filePath);
      
      if (!fileEntry) {
        return errorScenarios.resources.recordNotFound(filePath, 'file system');
      }

      if (fileEntry.type === 'folder') {
        // If it's a folder, return directory listing
        const entries = getFileSystemEntries(filePath);
        return createJsonResponse({
          resource: entries,
          meta: {
            count: entries.length,
            total: entries.length,
            path: filePath,
            container: serviceName,
          },
        });
      }

      // For file content, check if we should return content or metadata
      const url = new URL(request.url);
      const includeContent = url.searchParams.get('include_content') !== 'false';

      if (includeContent && fileEntry.content) {
        // Return file with content
        return createJsonResponse(fileEntry);
      } else {
        // Return file metadata only
        const { content, ...metadata } = fileEntry;
        return createJsonResponse(metadata);
      }

    } catch (error) {
      return createServerError('Failed to retrieve file content');
    }
  }
);

// ============================================================================
// FILE UPLOAD HANDLERS
// ============================================================================

/**
 * Handler for file uploads
 * POST /api/v2/{serviceName}/ - Upload files to root directory
 * POST /api/v2/{serviceName}/{path} - Upload files to specific directory
 */
export const fileUploadHandler: RequestHandler = http.post(
  '/api/v2/:serviceName/*',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Upload');

    const serviceName = params.serviceName as string;
    const pathParam = params['*'] as string;
    const uploadPath = pathParam ? `/${pathParam}` : '/';

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      const service = fileServices[serviceName as keyof typeof fileServices];
      if (!service) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Check if service is read-only
      if (service.config.read_only) {
        return createForbiddenError('Service is read-only');
      }

      // Handle FormData uploads
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        try {
          const formData = await request.formData();
          const uploadedFiles: FileSystemEntry[] = [];

          // Process each file in the form data
          for (const [fieldName, file] of formData.entries()) {
            if (file instanceof File) {
              // Validate file size (mock 50MB limit)
              if (file.size > 50 * 1024 * 1024) {
                return createBadRequestError(
                  `File '${file.name}' exceeds maximum size limit of 50MB`,
                  { max_size: '50MB', file_size: file.size }
                );
              }

              // Validate file extension if service has restrictions
              if (service.config.allowed_extensions) {
                const ext = file.name.toLowerCase().split('.').pop();
                if (ext && !service.config.allowed_extensions.includes(ext)) {
                  return createBadRequestError(
                    `File type '.${ext}' is not allowed`,
                    { 
                      allowed_extensions: service.config.allowed_extensions,
                      file_extension: ext 
                    }
                  );
                }
              }

              // Create file entry
              const filePath = `${uploadPath}/${file.name}`.replace(/\/+/g, '/');
              const fileContent = await file.arrayBuffer();
              
              const fileEntry = createFileEntry(
                filePath,
                Buffer.from(fileContent),
                file.type || getMimeType(file.name),
                {
                  original_name: file.name,
                  upload_session: `session_${Date.now()}`,
                  upload_time: new Date().toISOString(),
                  field_name: fieldName,
                }
              );

              uploadedFiles.push(fileEntry);

              // Add to mock file system (in a real implementation, this would persist)
              const parentPath = uploadPath === '/' ? '/' : uploadPath;
              if (!mockFileSystem[parentPath]) {
                mockFileSystem[parentPath] = [];
              }
              
              // Remove existing file with same name
              mockFileSystem[parentPath] = mockFileSystem[parentPath].filter(
                entry => entry.name !== file.name
              );
              
              // Add new file
              mockFileSystem[parentPath].push(fileEntry);
            }
          }

          if (uploadedFiles.length === 0) {
            return createBadRequestError('No files found in upload request');
          }

          // Simulate upload progress completion
          const progressData = simulateUploadProgress();
          const finalProgress = progressData[progressData.length - 1];

          return createJsonResponse({
            resource: uploadedFiles,
            meta: {
              uploaded_count: uploadedFiles.length,
              upload_path: uploadPath,
              progress: finalProgress,
              message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
            },
          }, { status: 201 });

        } catch (error) {
          return createServerError('Failed to process file upload');
        }

      } else if (contentType.includes('application/json')) {
        // Handle JSON-based file creation (with base64 content)
        try {
          const jsonData = await request.json();
          
          if (!jsonData.name) {
            return createFieldValidationError('name', 'File name is required');
          }

          if (!jsonData.content && !jsonData.url) {
            return createFieldValidationError('content', 'File content or URL is required');
          }

          const filePath = `${uploadPath}/${jsonData.name}`.replace(/\/+/g, '/');
          
          const fileEntry = createFileEntry(
            filePath,
            jsonData.content || '',
            jsonData.content_type || getMimeType(jsonData.name),
            {
              description: jsonData.description,
              tags: jsonData.tags,
              source_url: jsonData.url,
            }
          );

          // Add to mock file system
          const parentPath = uploadPath === '/' ? '/' : uploadPath;
          if (!mockFileSystem[parentPath]) {
            mockFileSystem[parentPath] = [];
          }
          
          // Remove existing file with same name
          mockFileSystem[parentPath] = mockFileSystem[parentPath].filter(
            entry => entry.name !== jsonData.name
          );
          
          // Add new file
          mockFileSystem[parentPath].push(fileEntry);

          return createJsonResponse(fileEntry, { status: 201 });

        } catch (error) {
          return createBadRequestError('Invalid JSON in request body');
        }

      } else {
        return createBadRequestError('Unsupported content type for file upload');
      }

    } catch (error) {
      return createServerError('Failed to upload file');
    }
  }
);

// ============================================================================
// FILE DOWNLOAD HANDLERS
// ============================================================================

/**
 * Handler for file downloads
 * GET /api/v2/{serviceName}/{filePath}?download=true - Download file as blob
 */
export const fileDownloadHandler: RequestHandler = http.get(
  '/api/v2/:serviceName/:filePath+',
  async ({ request, params }) => {
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';
    
    // Only handle download requests in this handler
    if (!isDownload) {
      return; // Let other handlers process this request
    }

    await simulateNetworkDelay();
    logRequest(request, 'File Download');

    const serviceName = params.serviceName as string;
    const filePath = `/${params.filePath}`;

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      if (!fileServices[serviceName as keyof typeof fileServices]) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Find the file
      const fileEntry = findFileSystemEntry(filePath);
      
      if (!fileEntry) {
        return errorScenarios.resources.recordNotFound(filePath, 'file system');
      }

      if (fileEntry.type === 'folder') {
        return createBadRequestError('Cannot download a directory');
      }

      // Generate mock file content if not present
      let content = fileEntry.content || '';
      if (!content && fileEntry.is_base64) {
        // Generate dummy binary content for binary files
        content = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      } else if (!content) {
        content = `Mock content for ${fileEntry.name}`;
      }

      // Create appropriate response based on file type
      const contentType = fileEntry.content_type || 'application/octet-stream';
      const fileName = fileEntry.name;

      if (fileEntry.is_base64) {
        // Handle binary files
        try {
          const binaryData = Buffer.from(content, 'base64');
          return new HttpResponse(binaryData, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Length': binaryData.length.toString(),
              'Cache-Control': 'no-cache',
            },
          });
        } catch (error) {
          return createServerError('Failed to decode file content');
        }
      } else {
        // Handle text files
        return new HttpResponse(content, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': content.length.toString(),
            'Cache-Control': 'no-cache',
          },
        });
      }

    } catch (error) {
      return createServerError('Failed to download file');
    }
  }
);

// ============================================================================
// FILE MANAGEMENT HANDLERS
// ============================================================================

/**
 * Handler for file updates
 * PUT /api/v2/{serviceName}/{filePath} - Update file content
 */
export const fileUpdateHandler: RequestHandler = http.put(
  '/api/v2/:serviceName/:filePath+',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Update');

    const serviceName = params.serviceName as string;
    const filePath = `/${params.filePath}`;

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      const service = fileServices[serviceName as keyof typeof fileServices];
      if (!service) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Check if service is read-only
      if (service.config.read_only) {
        return createForbiddenError('Service is read-only');
      }

      // Find the existing file
      const existingFile = findFileSystemEntry(filePath);
      if (!existingFile || existingFile.type === 'folder') {
        return errorScenarios.resources.recordNotFound(filePath, 'file system');
      }

      try {
        const updateData = await request.json();
        
        // Update file content and metadata
        const updatedFile: FileSystemEntry = {
          ...existingFile,
          content: updateData.content || existingFile.content,
          content_type: updateData.content_type || existingFile.content_type,
          last_modified: new Date().toISOString(),
          size: updateData.content ? updateData.content.length : existingFile.size,
          metadata: {
            ...existingFile.metadata,
            modified: new Date().toISOString(),
            editor: authValidation.sessionToken ? 'authenticated_user' : 'api_user',
            ...updateData.metadata,
          },
        };

        // Update in mock file system
        const pathParts = filePath.split('/');
        const fileName = pathParts.pop();
        const parentPath = pathParts.join('/') || '/';
        
        if (mockFileSystem[parentPath]) {
          const fileIndex = mockFileSystem[parentPath].findIndex(entry => entry.name === fileName);
          if (fileIndex !== -1) {
            mockFileSystem[parentPath][fileIndex] = updatedFile;
          }
        }

        return createJsonResponse(updatedFile);

      } catch (error) {
        return createBadRequestError('Invalid JSON in request body');
      }

    } catch (error) {
      return createServerError('Failed to update file');
    }
  }
);

/**
 * Handler for file and directory deletion
 * DELETE /api/v2/{serviceName}/{path} - Delete file or directory
 */
export const fileDeleteHandler: RequestHandler = http.delete(
  '/api/v2/:serviceName/:filePath+',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'File Delete');

    const serviceName = params.serviceName as string;
    const filePath = `/${params.filePath}`;

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      const service = fileServices[serviceName as keyof typeof fileServices];
      if (!service) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Check if service is read-only
      if (service.config.read_only) {
        return createForbiddenError('Service is read-only');
      }

      // Find the file or directory
      const entry = findFileSystemEntry(filePath);
      if (!entry) {
        return errorScenarios.resources.recordNotFound(filePath, 'file system');
      }

      // Check if it's a directory with contents
      if (entry.type === 'folder') {
        const url = new URL(request.url);
        const force = url.searchParams.get('force') === 'true';
        
        const contents = getFileSystemEntries(filePath);
        if (contents.length > 0 && !force) {
          return createBadRequestError(
            'Directory is not empty. Use force=true to delete recursively.',
            { 
              path: filePath,
              contents_count: contents.length,
              suggestion: 'Add ?force=true to delete recursively'
            }
          );
        }

        // Delete directory and its contents
        delete mockFileSystem[filePath];
        
        // Remove from parent directory listing
        const pathParts = filePath.split('/');
        const dirName = pathParts.pop();
        const parentPath = pathParts.join('/') || '/';
        
        if (mockFileSystem[parentPath]) {
          mockFileSystem[parentPath] = mockFileSystem[parentPath].filter(
            e => e.name !== dirName
          );
        }
      } else {
        // Delete file
        const pathParts = filePath.split('/');
        const fileName = pathParts.pop();
        const parentPath = pathParts.join('/') || '/';
        
        if (mockFileSystem[parentPath]) {
          mockFileSystem[parentPath] = mockFileSystem[parentPath].filter(
            e => e.name !== fileName
          );
        }
      }

      return createJsonResponse({
        message: `${entry.type === 'folder' ? 'Directory' : 'File'} deleted successfully`,
        path: filePath,
        type: entry.type,
        deleted_at: new Date().toISOString(),
      });

    } catch (error) {
      return createServerError('Failed to delete file or directory');
    }
  }
);

/**
 * Handler for directory creation
 * POST /api/v2/{serviceName}/ with folder=true - Create directory
 */
export const directoryCreateHandler: RequestHandler = http.post(
  '/api/v2/:serviceName/*',
  async ({ request, params }) => {
    const url = new URL(request.url);
    const isFolder = url.searchParams.get('folder') === 'true';
    
    // Only handle directory creation requests
    if (!isFolder) {
      return; // Let file upload handler process this
    }

    await simulateNetworkDelay();
    logRequest(request, 'Directory Creation');

    const serviceName = params.serviceName as string;
    const pathParam = params['*'] as string;
    const basePath = pathParam ? `/${pathParam}` : '/';

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check if service exists
      const service = fileServices[serviceName as keyof typeof fileServices];
      if (!service) {
        return errorScenarios.resources.serviceNotFound(serviceName);
      }

      // Check if service is read-only
      if (service.config.read_only) {
        return createForbiddenError('Service is read-only');
      }

      try {
        const requestData = await request.json();
        
        if (!requestData.name) {
          return createFieldValidationError('name', 'Directory name is required');
        }

        const dirPath = `${basePath}/${requestData.name}`.replace(/\/+/g, '/');
        
        // Check if directory already exists
        const existingEntry = findFileSystemEntry(dirPath);
        if (existingEntry) {
          return createBadRequestError(
            `Directory '${requestData.name}' already exists`,
            { path: dirPath, existing_type: existingEntry.type }
          );
        }

        // Create directory entry
        const now = new Date().toISOString();
        const dirEntry: FileSystemEntry = {
          name: requestData.name,
          path: dirPath,
          type: 'folder',
          last_modified: now,
          metadata: {
            owner: authValidation.sessionToken ? 'authenticated_user' : 'api_user',
            permissions: 'drwxr-xr-x',
            created: now,
            modified: now,
            accessed: now,
            description: requestData.description,
          },
        };

        // Add to mock file system
        mockFileSystem[dirPath] = [];
        
        // Add to parent directory listing
        if (!mockFileSystem[basePath]) {
          mockFileSystem[basePath] = [];
        }
        mockFileSystem[basePath].push(dirEntry);

        return createJsonResponse(dirEntry, { status: 201 });

      } catch (error) {
        return createBadRequestError('Invalid JSON in request body');
      }

    } catch (error) {
      return createServerError('Failed to create directory');
    }
  }
);

// ============================================================================
// LOG FILE HANDLERS
// ============================================================================

/**
 * Handler for log file operations with fallback handling
 * GET /api/v2/logs/ - List log files
 * GET /api/v2/logs/{logFile} - Get log file content
 */
export const logFileHandler: RequestHandler = http.get(
  '/api/v2/logs/*',
  async ({ request, params }) => {
    await simulateNetworkDelay();
    logRequest(request, 'Log File Access');

    const pathParam = params['*'] as string;
    const logPath = pathParam ? `/logs/${pathParam}` : '/logs';

    // Validate authentication
    const authValidation = validateAuthHeaders(request);
    if (!authValidation.isValid) {
      return authValidation.hasApiKey 
        ? errorScenarios.auth.invalidSession()
        : errorScenarios.auth.missingApiKey();
    }

    try {
      // Check for read permissions
      if (!authValidation.isAuthenticated) {
        return createForbiddenError('Log file access requires authentication');
      }

      if (!pathParam) {
        // List log files
        const logEntries = getFileSystemEntries('/logs');
        return createJsonResponse({
          resource: logEntries,
          meta: {
            count: logEntries.length,
            total: logEntries.length,
            path: '/logs',
            container: 'logs',
          },
        });
      } else {
        // Get specific log file content
        const logFile = findFileSystemEntry(logPath);
        
        if (!logFile) {
          return errorScenarios.resources.recordNotFound(pathParam, 'log files');
        }

        if (logFile.type === 'folder') {
          return createBadRequestError('Cannot retrieve directory as log file');
        }

        // Return log file with content
        return createJsonResponse(logFile);
      }

    } catch (error) {
      return createServerError('Failed to access log files');
    }
  }
);

// ============================================================================
// EXPORT ALL FILE HANDLERS
// ============================================================================

/**
 * Complete collection of file operation handlers for MSW setup
 */
export const fileHandlers: RequestHandler[] = [
  // Service discovery
  getFileServicesHandler,
  getFileServiceHandler,
  
  // Directory operations
  directoryCreateHandler,
  
  // File operations (order matters - more specific first)
  fileDownloadHandler,
  fileUpdateHandler,
  fileDeleteHandler,
  fileUploadHandler,
  fileContentHandler,
  fileBrowsingHandler,
  
  // Log file operations
  logFileHandler,
];

/**
 * Export individual handlers for testing
 */
export {
  getFileServicesHandler,
  getFileServiceHandler,
  fileBrowsingHandler,
  fileContentHandler,
  fileUploadHandler,
  fileDownloadHandler,
  fileUpdateHandler,
  fileDeleteHandler,
  directoryCreateHandler,
  logFileHandler,
};

/**
 * Export utility functions for testing
 */
export {
  getMimeType,
  getFileSystemEntries,
  findFileSystemEntry,
  createFileEntry,
  simulateUploadProgress,
  mockFileSystem,
  fileServices,
};

/**
 * Export type definitions
 */
export type {
  FileSystemEntry,
  DirectoryListing,
  UploadProgress,
};

/**
 * Default export for easy importing
 */
export default fileHandlers;