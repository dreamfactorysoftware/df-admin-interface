import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, catchError, map, tap, filter, throwError } from 'rxjs';
import { DfUserDataService } from './df-user-data.service';
import { SESSION_TOKEN_HEADER } from '../constants/http-headers';

export interface GenericListResponse<T> {
  resource: T[];
  meta?: {
    count: number;
    limit: number;
    offset: number;
  };
}

export interface FileService {
  id: number;
  name: string;
  label: string;
  type: string;
}

export interface FileItem {
  name: string;
  path: string;
  type: string;
  contentType?: string;
  lastModified?: string;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FileApiService {
  // Array of service names that should be excluded from file selection
  private excludedServices = ['logs', 'log'];

  constructor(
    private http: HttpClient,
    private userDataService: DfUserDataService
  ) {}

  /**
   * Get the absolute API URL by determining the base URL from the current window location
   * This bypasses the Angular baseHref and router completely
   */
  private getAbsoluteApiUrl(path: string): string {
    // Get the current origin (protocol + hostname + port)
    const origin = window.location.origin;

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // First ensure we remove any /dreamfactory/dist/ prefix if it exists in the path
    const pathWithoutPrefix = cleanPath.replace(/^(dreamfactory\/dist\/)?/, '');

    // Combine to get the absolute URL that goes directly to /api/v2 without any prefix
    const absoluteUrl = `${origin}/${pathWithoutPrefix}`;

    console.log(`🔍 Constructed absolute URL for API request: ${absoluteUrl}`);
    return absoluteUrl;
  }

  /**
   * Check if a file service should be included in the selector
   * @param service The file service to check
   * @returns True if the service should be included, false otherwise
   */
  private isSelectableFileService(service: FileService): boolean {
    // Exclude services with names containing 'log'
    if (
      this.excludedServices.some(
        exclude =>
          service.name.toLowerCase().includes(exclude) ||
          service.label.toLowerCase().includes(exclude)
      )
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get the HTTP headers for authenticated requests
   */
  private getHeaders() {
    const headers: Record<string, string> = {};
    const token = this.userDataService.token;

    if (token) {
      headers[SESSION_TOKEN_HEADER] = token;
    }

    console.log('Auth headers:', headers);
    return headers;
  }

  /**
   * Get a list of all file services
   */
  getFileServices(): Observable<GenericListResponse<FileService>> {
    console.log(
      'Getting file services, session token:',
      this.userDataService.token
    );

    // Default hardcoded services to use as fallback
    const defaultServices: GenericListResponse<FileService> = {
      resource: [
        {
          id: 3,
          name: 'files',
          label: 'Local File Storage',
          type: 'local_file',
        },
      ],
    };

    // If no session token, immediately return the default services
    if (!this.userDataService.token) {
      console.warn('No session token available, using hardcoded file services');
      return new Observable<GenericListResponse<FileService>>(observer => {
        observer.next(defaultServices);
        observer.complete();
      });
    }

    // Create an observable that will immediately emit the default services
    // This ensures we always have something to return, even if the HTTP request fails
    return new Observable<GenericListResponse<FileService>>(observer => {
      // First emit the default services to ensure the UI is responsive
      observer.next(defaultServices);

      // Direct URL construction to bypass Angular baseHref and router
      const url = `${window.location.origin}/api/v2/system/service`;
      console.log(`Loading file services from absolute URL: ${url}`);

      // Set parameters for file service filtering
      const params = {
        filter: 'type=local_file',
        fields: 'id,name,label,type',
      };

      // Get authentication headers
      const headers = this.getHeaders();

      // Then try to get the actual services from the API using direct HTTP
      this.http
        .get<GenericListResponse<FileService>>(url, { params, headers })
        .pipe(
          map(response => {
            if (
              !response ||
              !response.resource ||
              !Array.isArray(response.resource)
            ) {
              console.warn(
                'Invalid response format from API, using default services'
              );
              return defaultServices;
            }

            // Filter out non-selectable services
            response.resource = response.resource.filter(service =>
              this.isSelectableFileService(service)
            );

            // If no services are left after filtering, use defaults
            if (response.resource.length === 0) {
              console.warn(
                'No valid file services found in API response, using defaults'
              );
              return defaultServices;
            }

            return response;
          }),
          catchError(error => {
            console.error('Error fetching file services:', error);
            console.warn('API call failed, using default file services');
            return new Observable<GenericListResponse<FileService>>(
              innerObserver => {
                innerObserver.next(defaultServices);
                innerObserver.complete();
              }
            );
          })
        )
        .subscribe({
          next: apiResponse => {
            // Only emit if different from the default (to avoid duplicate emissions)
            if (
              JSON.stringify(apiResponse) !== JSON.stringify(defaultServices)
            ) {
              observer.next(apiResponse);
            }
            observer.complete();
          },
          error: () => {
            // In case of any unexpected error, complete the observable
            observer.complete();
          },
        });
    });
  }

  /**
   * List files in a directory
   * @param serviceName The name of the file service
   * @param path The path to list (optional)
   */
  listFiles(serviceName: string, path: string = ''): Observable<any> {
    // Return empty list if service name is missing
    if (!serviceName) {
      console.warn(
        'No service name provided for listFiles, returning empty list'
      );
      return new Observable(observer => {
        observer.next({ resource: [] });
        observer.complete();
      });
    }

    // Construct the path
    const apiPath = path
      ? `api/v2/${serviceName}/${path}`
      : `api/v2/${serviceName}`;

    // Log the operation
    console.log(`Listing files from path: ${apiPath}`);

    // Use DfBaseCrudService style approach to ensure consistency with admin interface
    // Just use the HTTP client directly with exact URL
    const url = `${window.location.origin}/${apiPath}`;
    console.log(`Using absolute URL: ${url}`);

    // Set specific parameters for file listing
    const params: Record<string, string> = {};
    // Ask for content-type to help identify file types
    params['include_properties'] = 'content_type';
    // Add standard fields
    params['fields'] = 'name,path,type,content_type,last_modified,size';

    // Add the session token to headers
    const headers: Record<string, string> = {};
    const token = this.userDataService.token;
    if (token) {
      headers[SESSION_TOKEN_HEADER] = token;
    }

    return this.http
      .get(url, {
        headers,
        params,
      })
      .pipe(
        tap(response => console.log('Files response:', response)),
        catchError(error => {
          console.error(`Error fetching files from ${url}:`, error);

          // Create a helpful message based on the error
          let errorMessage = 'Error loading files. ';

          if (error.status === 500) {
            errorMessage +=
              'The server encountered an internal error. This might be a temporary issue.';
          } else if (error.status === 404) {
            errorMessage += 'The specified folder does not exist.';
          } else if (error.status === 403 || error.status === 401) {
            errorMessage +=
              'You do not have permission to access this location.';
          } else {
            errorMessage += 'Please check your connection and try again.';
          }

          // Log the error message for debugging
          console.warn(errorMessage);

          // Return an empty resource array to avoid UI errors
          return new Observable(observer => {
            observer.next({
              resource: [],
              error: errorMessage,
            });
            observer.complete();
          });
        })
      );
  }

  /**
   * Upload a file
   * @param serviceName The name of the file service
   * @param file The file to upload
   * @param path The path to upload to (optional)
   */
  uploadFile(
    serviceName: string,
    file: File,
    path: string = ''
  ): Observable<any> {
    // Construct the path
    let apiPath: string;
    if (path) {
      // Ensure path doesn't end with slash and append filename
      const cleanPath = path.replace(/\/$/, '');
      apiPath = `api/v2/${serviceName}/${cleanPath}/${file.name}`;
    } else {
      apiPath = `api/v2/${serviceName}/${file.name}`;
    }

    // Use absolute URL to bypass any baseHref issues
    const url = this.getAbsoluteApiUrl(apiPath);

    console.log(
      `⭐⭐⭐ UPLOADING FILE ${file.name} (${file.size} bytes), type: ${file.type} ⭐⭐⭐`
    );
    console.log(`To absolute URL: ${url}`);
    console.log(`Current document baseURI: ${document.baseURI}`);
    console.log(`Current window location: ${window.location.href}`);

    // Check if this is a private key file (just for logging purposes)
    const isPEMFile =
      file.name.endsWith('.pem') ||
      file.name.endsWith('.p8') ||
      file.name.endsWith('.key');
    if (isPEMFile) {
      console.log(
        'Detected private key file - using standard FormData upload method'
      );
    }

    // Create FormData for the file - this works for ALL file types
    const formData = new FormData();
    // IMPORTANT: Use 'files' instead of 'file' to match the admin implementation
    formData.append('files', file);

    // Get authentication headers
    const headers = this.getHeaders();

    // Use Angular's HttpClient for the upload - this handles baseHref correctly
    return this.http.post(url, formData, { headers }).pipe(
      tap(response => console.log('Upload complete with response:', response)),
      catchError(error => {
        console.error(
          `Error uploading file: ${error.status} ${error.statusText}`,
          error
        );
        return throwError(() => ({
          status: error.status,
          error: error.error || { message: 'File upload failed' },
        }));
      })
    );
  }

  /**
   * Create a directory using POST with X-Http-Method header
   * @param serviceName The name of the file service
   * @param path The path where to create the directory
   * @param name The name of the directory
   */
  createDirectoryWithPost(
    serviceName: string,
    path: string,
    name: string
  ): Observable<any> {
    const payload = {
      resource: [
        {
          name: name,
          type: 'folder',
        },
      ],
    };

    // Construct the path
    const apiPath = path
      ? `api/v2/${serviceName}/${path}`
      : `api/v2/${serviceName}`;
    // Use absolute URL to bypass any baseHref issues
    const url = this.getAbsoluteApiUrl(apiPath);
    console.log(
      `Creating directory using POST at absolute URL: ${url}`,
      payload
    );

    // Get headers and add X-Http-Method header
    const headers = this.getHeaders();
    headers['X-Http-Method'] = 'POST';

    return this.http.post(url, payload, { headers }).pipe(
      tap(response => console.log('Create directory response:', response)),
      catchError(error => {
        console.error(`Error creating directory at ${url}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get file content
   * @param serviceName The name of the file service
   * @param path The path to the file
   */
  getFileContent(serviceName: string, path: string): Observable<any> {
    // Construct the path and use absolute URL
    const apiPath = `api/v2/${serviceName}/${path}`;
    const url = this.getAbsoluteApiUrl(apiPath);
    console.log(`Getting file content from absolute URL: ${url}`);

    return this.http
      .get(url, {
        responseType: 'blob',
        headers: this.getHeaders(),
      })
      .pipe(
        catchError(error => {
          console.error(`Error getting file content from ${url}:`, error);
          throw error;
        })
      );
  }

  /**
   * Delete a file
   * @param serviceName The name of the file service
   * @param path The path to the file
   */
  deleteFile(serviceName: string, path: string): Observable<any> {
    // Construct the path and use absolute URL
    const apiPath = `api/v2/${serviceName}/${path}`;
    const url = this.getAbsoluteApiUrl(apiPath);
    console.log(`Deleting file at absolute URL: ${url}`);

    return this.http.delete(url, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('Delete response:', response)),
      catchError(error => {
        console.error(`Error deleting file at ${url}:`, error);
        throw error;
      })
    );
  }

  /**
   * Create a directory
   * @param serviceName The name of the file service
   * @param path The path where to create the directory
   * @param name The name of the directory
   */
  createDirectory(
    serviceName: string,
    path: string,
    name: string
  ): Observable<any> {
    const payload = {
      resource: [
        {
          name: name,
          type: 'folder',
        },
      ],
    };

    // Construct the path
    const apiPath = path
      ? `api/v2/${serviceName}/${path}`
      : `api/v2/${serviceName}`;
    // Use absolute URL to bypass any baseHref issues
    const url = this.getAbsoluteApiUrl(apiPath);
    console.log(`Creating directory at absolute URL: ${url}`, payload);

    return this.http.post(url, payload, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('Create directory response:', response)),
      catchError(error => {
        console.error(`Error creating directory at ${url}:`, error);
        throw error;
      })
    );
  }
}
