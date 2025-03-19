import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Observable, catchError, map, tap, filter } from 'rxjs';
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
  providedIn: 'root'
})
export class FileApiService {
  // Array of service names that should be excluded from file selection
  private excludedServices = ['logs', 'log'];
  
  constructor(
    private http: HttpClient,
    private userDataService: DfUserDataService
  ) { }

  /**
   * Check if a file service should be included in the selector
   * @param service The file service to check
   * @returns True if the service should be included, false otherwise
   */
  private isSelectableFileService(service: FileService): boolean {
    // Exclude services with names containing 'log'
    if (this.excludedServices.some(exclude => 
        service.name.toLowerCase().includes(exclude) || 
        service.label.toLowerCase().includes(exclude))) {
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
    console.log('Getting file services, session token:', this.userDataService.token);
    
    // Default hardcoded services to use as fallback
    const defaultServices: GenericListResponse<FileService> = {
      resource: [
        {
          id: 3,
          name: 'files',
          label: 'Local File Storage',
          type: 'local_file'
        }
      ]
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
      
      // Then try to get the actual services from the API
      // Using direct URL format that matches the server expectation
      // Notice the format change from filter[type] to filter=type=
      this.http.get<GenericListResponse<FileService>>('api/v2/system/service', {
        params: {
          'filter': 'type=local_file',
          'fields': 'id,name,label,type'
        },
        headers: this.getHeaders()
      }).pipe(
        map(response => {
          if (!response || !response.resource || !Array.isArray(response.resource)) {
            console.warn('Invalid response format from API, using default services');
            return defaultServices;
          }
          
          // Filter out non-selectable services
          response.resource = response.resource.filter(service => 
            this.isSelectableFileService(service)
          );
          
          // If no services are left after filtering, use defaults
          if (response.resource.length === 0) {
            console.warn('No valid file services found in API response, using defaults');
            return defaultServices;
          }
          
          return response;
        }),
        catchError(error => {
          console.error('Error fetching file services:', error);
          console.warn('API call failed, using default file services');
          return new Observable<GenericListResponse<FileService>>(innerObserver => {
            innerObserver.next(defaultServices);
            innerObserver.complete();
          });
        })
      ).subscribe({
        next: (apiResponse) => {
          // Only emit if different from the default (to avoid duplicate emissions)
          if (JSON.stringify(apiResponse) !== JSON.stringify(defaultServices)) {
            observer.next(apiResponse);
          }
          observer.complete();
        },
        error: () => {
          // In case of any unexpected error, complete the observable
          observer.complete();
        }
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
      console.warn('No service name provided for listFiles, returning empty list');
      return new Observable(observer => {
        observer.next({ resource: [] });
        observer.complete();
      });
    }
    
    const url = path ? `api/v2/${serviceName}/${path}` : `api/v2/${serviceName}`;
    console.log(`Listing files from ${url}`);
    
    // Set specific parameters for file listing
    const params: Record<string, string> = {};
    // Ask for content-type to help identify file types
    params['include_properties'] = 'content_type';
    // Add standard fields
    params['fields'] = 'name,path,type,content_type,last_modified,size';
    
    return this.http.get(url, { 
      headers: this.getHeaders(),
      params: params 
    }).pipe(
      tap(response => console.log('Files response:', response)),
      catchError(error => {
        console.error(`Error fetching files from ${url}:`, error);
        
        // Create a helpful message based on the error
        let errorMessage = 'Error loading files. ';
        
        if (error.status === 500) {
          errorMessage += 'The server encountered an internal error. This might be a temporary issue.';
        } else if (error.status === 404) {
          errorMessage += 'The specified folder does not exist.';
        } else if (error.status === 403 || error.status === 401) {
          errorMessage += 'You do not have permission to access this location.';
        } else {
          errorMessage += 'Please check your connection and try again.';
        }
        
        // Log the error message for debugging
        console.warn(errorMessage);
        
        // Return an empty resource array to avoid UI errors
        return new Observable(observer => {
          observer.next({
            resource: [],
            error: errorMessage
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
  uploadFile(serviceName: string, file: File, path: string = ''): Observable<any> {
    // Build the URL properly including the filename
    let url: string;
    if (path) {
      // Ensure path doesn't end with slash and append filename
      const cleanPath = path.replace(/\/$/, '');
      url = `api/v2/${serviceName}/${cleanPath}/${file.name}`;
    } else {
      url = `api/v2/${serviceName}/${file.name}`;
    }
    
    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    console.log(`To URL: ${url}`);
    
    // Check if this is a private key file that needs special handling
    const isPEMFile = file.name.endsWith('.pem') || file.name.endsWith('.p8') || file.name.endsWith('.key');
    
    if (isPEMFile) {
      console.log('Detected private key file - using binary upload method for proper content preservation');
      return this.uploadBinaryFile(url, file);
    }
    
    // Get authentication headers
    const headers = this.getHeaders();
    
    // Use a more direct XMLHttpRequest approach with explicit binary handling
    return new Observable(observer => {
      // Create a new XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentDone = Math.round(100 * event.loaded / event.total);
          console.log(`Upload progress: ${percentDone}%`);
          observer.next({ type: 'progress', progress: percentDone });
        }
      };
      
      // Handle various events
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {
            response = xhr.responseText;
          }
          console.log('Upload complete with response:', response);
          observer.next(response);
          observer.complete();
        } else {
          let errorResponse;
          try {
            errorResponse = JSON.parse(xhr.responseText);
          } catch (e) {
            errorResponse = { error: xhr.statusText };
          }
          console.error(`Error uploading file: ${xhr.status} ${xhr.statusText}`, errorResponse);
          observer.error({ status: xhr.status, error: errorResponse });
        }
      };
      
      xhr.onerror = () => {
        console.error('Network error during file upload');
        observer.error({ status: 0, error: 'Network error during file upload' });
      };
      
      xhr.ontimeout = () => {
        console.error('Timeout during file upload');
        observer.error({ status: 408, error: 'Request timeout' });
      };
      
      // Open the request (POST for file upload)
      xhr.open('POST', url, true);
      
      // Add authentication and other needed headers
      Object.keys(headers).forEach(key => {
        xhr.setRequestHeader(key, headers[key]);
      });
      
      // Create FormData for the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the file size again right before sending
      console.log(`Sending file with size: ${file.size} bytes`);
      
      // Send the request with the file data
      xhr.send(formData);
      
      // Return an unsubscribe function
      return () => {
        if (xhr && xhr.readyState !== 4) {
          xhr.abort();
        }
      };
    });
  }

  /**
   * Upload a binary file (like PEM, P8, or private key files) using binary transmission
   * to ensure content is preserved properly
   * @param url The URL to upload to
   * @param file The file to upload as binary
   */
  private uploadBinaryFile(url: string, file: File): Observable<any> {
    console.log(`Uploading binary file: ${file.name}, size: ${file.size} bytes`);
    
    // Get authentication headers
    const headers = this.getHeaders();
    
    return new Observable(observer => {
      // First read the file
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result;
        
        if (!content) {
          observer.error({ status: 500, error: 'Failed to read file content' });
          return;
        }
        
        console.log(`File content read successfully, content length: ${(content as ArrayBuffer).byteLength} bytes`);
        
        // Create a new XMLHttpRequest for binary upload
        const xhr = new XMLHttpRequest();
        
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentDone = Math.round(100 * event.loaded / event.total);
            console.log(`Upload progress: ${percentDone}%`);
            observer.next({ type: 'progress', progress: percentDone });
          }
        };
        
        // Handle various events
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            try {
              response = JSON.parse(xhr.responseText);
            } catch (e) {
              response = xhr.responseText;
            }
            console.log('Binary upload complete with response:', response);
            observer.next(response);
            observer.complete();
          } else {
            let errorResponse;
            try {
              errorResponse = JSON.parse(xhr.responseText);
            } catch (e) {
              errorResponse = { error: xhr.statusText };
            }
            console.error(`Error uploading binary file: ${xhr.status} ${xhr.statusText}`, errorResponse);
            observer.error({ status: xhr.status, error: errorResponse });
          }
        };
        
        xhr.onerror = () => {
          console.error('Network error during binary file upload');
          observer.error({ status: 0, error: 'Network error during binary file upload' });
        };
        
        xhr.ontimeout = () => {
          console.error('Timeout during binary file upload');
          observer.error({ status: 408, error: 'Request timeout' });
        };
        
        // Open the request (POST for file upload)
        xhr.open('POST', url, true);
        
        // Add authentication headers
        Object.keys(headers).forEach(key => {
          xhr.setRequestHeader(key, headers[key]);
        });
        
        // Add content type header for binary data
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        
        // Send the binary data directly
        xhr.send(content);
        
        // Return an unsubscribe function
        return () => {
          if (xhr && xhr.readyState !== 4) {
            xhr.abort();
          }
        };
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        observer.error({ status: 500, error: 'Failed to read file: ' + (error.target?.error?.message || 'Unknown error') });
      };
      
      // Read the file as an ArrayBuffer (binary content)
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get file content
   * @param serviceName The name of the file service
   * @param path The path to the file
   */
  getFileContent(serviceName: string, path: string): Observable<any> {
    const url = `api/v2/${serviceName}/${path}`;
    console.log(`Getting file content from ${url}`);
    
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
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
    const url = `api/v2/${serviceName}/${path}`;
    console.log(`Deleting file at ${url}`);
    
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
  createDirectory(serviceName: string, path: string, name: string): Observable<any> {
    const payload = {
      resource: [
        {
          name: name,
          type: 'folder'
        }
      ]
    };
    
    const url = path ? `api/v2/${serviceName}/${path}` : `api/v2/${serviceName}`;
    console.log(`Creating directory at ${url}`, payload);
    
    return this.http.post(url, payload, { headers: this.getHeaders() }).pipe(
      tap(response => console.log('Create directory response:', response)),
      catchError(error => {
        console.error(`Error creating directory at ${url}:`, error);
        throw error;
      })
    );
  }
} 