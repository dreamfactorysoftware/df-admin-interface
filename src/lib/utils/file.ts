/**
 * File I/O utilities for browser-based file reading and downloading operations.
 * Migrated from RxJS observables to Promise-based patterns for React compatibility.
 * 
 * @fileoverview Provides utilities for file content extraction and download functionality
 * using native Web APIs, compatible with React components and Next.js environments.
 */

/**
 * Reads a file or blob as text content using FileReader API.
 * Converted from Observable<string> to Promise<string> for React compatibility.
 * 
 * @param file - File or Blob to read as text
 * @returns Promise that resolves with the file content as string
 * @throws Error if file reading fails
 * 
 * @example
 * ```typescript
 * // Usage in React component with async/await
 * const handleFileUpload = async (file: File) => {
 *   try {
 *     const content = await readAsText(file);
 *     console.log('File content:', content);
 *   } catch (error) {
 *     console.error('Failed to read file:', error);
 *   }
 * };
 * 
 * // Compatible with React Dropzone
 * const onDrop = useCallback(async (acceptedFiles: File[]) => {
 *   for (const file of acceptedFiles) {
 *     const content = await readAsText(file);
 *     // Process file content...
 *   }
 * }, []);
 * ```
 */
export function readAsText(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!file) {
      reject(new Error('File or Blob is required'));
      return;
    }

    // Check if FileReader is available (browser environment)
    if (typeof FileReader === 'undefined') {
      reject(new Error('FileReader is not available in this environment'));
      return;
    }

    const reader = new FileReader();

    // Handle successful file read
    reader.onload = () => {
      if (reader.result === null) {
        reject(new Error('Failed to read file: result is null'));
        return;
      }
      resolve(reader.result as string);
    };

    // Handle file read errors
    reader.onerror = () => {
      const error = reader.error || new Error('Unknown FileReader error');
      reject(new Error(`Failed to read file: ${error.message}`));
    };

    // Handle file read abort
    reader.onabort = () => {
      reject(new Error('File reading was aborted'));
    };

    try {
      // Read the file as text with UTF-8 encoding
      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      reject(new Error(`Failed to initiate file reading: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Creates a blob from raw data and saves it as a file download.
 * Maintains compatibility with existing API while supporting async patterns.
 * 
 * @param data - Raw data to save (string, ArrayBuffer, etc.)
 * @param filename - Name for the downloaded file
 * @param type - File type identifier for MIME type mapping
 * 
 * @example
 * ```typescript
 * // Save JSON data
 * const jsonData = JSON.stringify({ key: 'value' });
 * saveRawAsFile(jsonData, 'data.json', 'json');
 * 
 * // Save CSV data
 * const csvData = 'name,age\nJohn,30\nJane,25';
 * saveRawAsFile(csvData, 'users.csv', 'csv');
 * 
 * // Save XML data
 * const xmlData = '<?xml version="1.0"?><root><item>value</item></root>';
 * saveRawAsFile(xmlData, 'config.xml', 'xml');
 * ```
 */
export function saveRawAsFile(
  data: unknown,
  filename: string,
  type: string
): void {
  try {
    const blob = new Blob([data as BlobPart], { type: getMimeType(type) });
    saveAsFile(blob, filename);
  } catch (error) {
    console.error('Failed to save raw data as file:', error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Saves a blob as a file download using browser APIs.
 * Compatible with React components and Next.js client-side environment.
 * 
 * @param blob - Blob object to download
 * @param filename - Name for the downloaded file
 * 
 * @example
 * ```typescript
 * // Save blob from API response
 * const response = await fetch('/api/export');
 * const blob = await response.blob();
 * saveAsFile(blob, 'export.pdf');
 * 
 * // Create and save text blob
 * const textBlob = new Blob(['Hello, World!'], { type: 'text/plain' });
 * saveAsFile(textBlob, 'hello.txt');
 * ```
 */
export function saveAsFile(blob: Blob, filename: string): void {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.warn('saveAsFile called in non-browser environment (SSR), skipping download');
    return;
  }

  if (!blob) {
    throw new Error('Blob is required');
  }

  if (!filename || filename.trim() === '') {
    throw new Error('Filename is required');
  }

  try {
    const url = window.URL.createObjectURL(blob);
    saveFromUrl(url, filename);
    
    // Clean up the object URL to prevent memory leaks
    // Use setTimeout to ensure download has started
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to save file:', error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Internal helper function to trigger file download from URL.
 * Creates a temporary anchor element to initiate download.
 * 
 * @private
 * @param url - Object URL or data URL to download
 * @param filename - Name for the downloaded file
 */
function saveFromUrl(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = url;
  
  // Temporarily add to DOM for download (required in some browsers)
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  
  try {
    anchor.click();
  } finally {
    // Clean up the anchor element
    document.body.removeChild(anchor);
  }
}

/**
 * Maps file type identifiers to proper MIME types.
 * Preserved from original implementation for backward compatibility.
 * 
 * @param type - File type identifier
 * @returns Proper MIME type string
 * 
 * @example
 * ```typescript
 * getMimeType('json'); // Returns 'application/json'
 * getMimeType('xml');  // Returns 'application/xml'
 * getMimeType('csv');  // Returns 'text/csv'
 * getMimeType('application/pdf'); // Returns 'application/pdf' (pass-through)
 * ```
 */
export function getMimeType(type: string): string {
  switch (type) {
    case 'json':
      return 'application/json';
    case 'xml':
      return 'application/xml';
    case 'csv':
      return 'text/csv';
    case 'txt':
      return 'text/plain';
    case 'html':
      return 'text/html';
    case 'pdf':
      return 'application/pdf';
    case 'zip':
      return 'application/zip';
    default:
      // Return the type as-is for already-proper MIME types
      return type;
  }
}

/**
 * Type definitions for better TypeScript support in React components
 */
export type FileReadResult = string;
export type SupportedFileType = 'json' | 'xml' | 'csv' | 'txt' | 'html' | 'pdf' | 'zip' | string;

/**
 * Utility type for file processing in React components
 */
export interface FileProcessingOptions {
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Allowed file types */
  allowedTypes?: string[];
  /** Custom MIME type mapping */
  mimeTypeMap?: Record<string, string>;
}

/**
 * Enhanced file reading with validation options.
 * Useful for React components that need file size/type validation.
 * 
 * @param file - File to read
 * @param options - Processing options for validation
 * @returns Promise that resolves with file content
 * @throws Error if validation fails
 * 
 * @example
 * ```typescript
 * const options: FileProcessingOptions = {
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedTypes: ['json', 'csv', 'txt']
 * };
 * 
 * try {
 *   const content = await readAsTextWithValidation(file, options);
 *   // Process validated file content...
 * } catch (error) {
 *   // Handle validation or reading errors...
 * }
 * ```
 */
export async function readAsTextWithValidation(
  file: File,
  options: FileProcessingOptions = {}
): Promise<FileReadResult> {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [],
  } = options;

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(`File size (${file.size} bytes) exceeds maximum allowed size (${maxSize} bytes)`);
  }

  // Validate file type if restrictions are specified
  if (allowedTypes.length > 0) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedTypes.includes(fileExtension)) {
      throw new Error(`File type "${fileExtension}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  // Read the file using the standard readAsText function
  return readAsText(file);
}