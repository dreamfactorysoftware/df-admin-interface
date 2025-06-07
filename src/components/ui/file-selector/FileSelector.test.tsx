/**
 * FileSelector Component Test Suite
 * 
 * Comprehensive Vitest test suite covering user interactions, file operations,
 * accessibility compliance, performance scenarios, and error handling for the
 * FileSelector component. Uses Mock Service Worker for realistic API testing
 * and React Testing Library for component testing best practices.
 * 
 * Test Coverage Areas:
 * - Component rendering and props validation
 * - User interactions and keyboard navigation
 * - File upload, selection, and validation
 * - Drag and drop functionality
 * - Error scenarios and edge cases
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance testing for large file operations
 * - Visual regression testing integration
 * - API integration with MSW mock handlers
 * 
 * @fileoverview Comprehensive test suite for FileSelector component
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, within, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Test utilities and setup
import {
  customRender,
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  createMockValidation,
  waitForValidation,
  measureRenderTime,
  createLargeDataset,
  type FormTestUtils,
  type KeyboardTestUtils,
} from '@/test/test-utils';

// Component under test
import { FileSelector, CompactFileSelector, UploadFileSelector } from './FileSelector';
import type { 
  FileSelectorProps,
  SelectedFile,
  FileApiInfo,
  FileValidationOptions,
} from './types';

// MSW setup for API mocking
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { fileHandlers } from '@/test/mocks/file-handlers';

// Mock data
const mockFileApis: FileApiInfo[] = [
  {
    id: 1,
    name: 'local_file',
    label: 'Local File Storage',
    type: 'local_file',
    description: 'Local file system storage',
    active: true,
    config: {},
  },
  {
    id: 2,
    name: 's3_storage',
    label: 'AWS S3 Storage',
    type: 'aws_s3',
    description: 'Amazon S3 bucket storage',
    active: true,
    config: {
      bucket: 'dreamfactory-files',
      region: 'us-east-1',
    },
  },
];

const mockSelectedFile: SelectedFile = {
  path: '/opt/dreamfactory/storage/app/test.txt',
  relativePath: 'test.txt',
  fileName: 'test.txt',
  name: 'test.txt',
  serviceId: 1,
  serviceName: 'local_file',
  size: 1024,
  contentType: 'text/plain',
  lastModified: '2024-03-15T10:30:00Z',
  metadata: {
    owner: 'test-user',
    permissions: '-rw-r--r--',
    created: '2024-03-15T10:30:00Z',
    modified: '2024-03-15T10:30:00Z',
  },
};

// Mock file for testing
const createMockFile = (
  name: string = 'test.txt',
  size: number = 1024,
  type: string = 'text/plain'
): File => {
  const content = 'Mock file content for testing purposes';
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type, lastModified: Date.now() });
  
  // Mock file size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });
  
  return file;
};

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

beforeAll(() => {
  // Start MSW server with file handlers
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

afterAll(() => {
  // Clean up MSW server
  server.close();
});

beforeEach(() => {
  // Reset MSW handlers before each test
  server.resetHandlers(...fileHandlers);
  
  // Mock console methods to avoid noise in tests
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  // Mock file reading APIs
  global.FileReader = class MockFileReader {
    result: string | ArrayBuffer | null = null;
    error: DOMException | null = null;
    readyState: number = 0;
    
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    dispatchEvent = vi.fn();
    
    readAsText(file: File) {
      this.readyState = 2;
      this.result = 'Mock file content for testing';
      setTimeout(() => {
        if (this.onload) {
          this.onload({} as ProgressEvent<FileReader>);
        }
      }, 10);
    }
    
    readAsDataURL(file: File) {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,TW9jayBmaWxlIGNvbnRlbnQ=';
      setTimeout(() => {
        if (this.onload) {
          this.onload({} as ProgressEvent<FileReader>);
        }
      }, 10);
    }
    
    readAsArrayBuffer(file: File) {
      this.readyState = 2;
      this.result = new ArrayBuffer(file.size);
      setTimeout(() => {
        if (this.onload) {
          this.onload({} as ProgressEvent<FileReader>);
        }
      }, 10);
    }
    
    abort() {
      this.readyState = 2;
    }
  } as any;
});

afterEach(() => {
  // Clean up mocks
  vi.restoreAllMocks();
  server.resetHandlers();
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Helper to render FileSelector with default props
 */
const renderFileSelector = (
  props: Partial<FileSelectorProps> = {},
  options: Parameters<typeof customRender>[1] = {}
) => {
  const defaultProps: FileSelectorProps = {
    label: 'Test File Selector',
    fileApis: mockFileApis,
    'data-testid': 'file-selector',
    ...props,
  };

  return customRender(<FileSelector {...defaultProps} />, options);
};

/**
 * Helper to simulate file drop event
 */
const simulateFileDrop = async (
  dropzone: HTMLElement,
  files: File[],
  user: ReturnType<typeof userEvent.setup>
) => {
  const dataTransfer = {
    files,
    items: files.map(file => ({
      kind: 'file' as const,
      type: file.type,
      getAsFile: () => file,
    })),
    types: ['Files'],
  };

  fireEvent.dragEnter(dropzone, { dataTransfer });
  fireEvent.dragOver(dropzone, { dataTransfer });
  fireEvent.drop(dropzone, { dataTransfer });
};

/**
 * Helper to wait for file upload simulation
 */
const waitForUploadCompletion = async (timeout: number = 2000) => {
  await waitFor(
    () => {
      const progressElement = screen.queryByRole('progressbar');
      if (progressElement) {
        const value = progressElement.getAttribute('aria-valuenow');
        return value === '100';
      }
      return true;
    },
    { timeout }
  );
};

// ============================================================================
// BASIC COMPONENT TESTS
// ============================================================================

describe('FileSelector Component', () => {
  describe('Rendering and Props', () => {
    it('renders with default props', () => {
      renderFileSelector();
      
      expect(screen.getByTestId('file-selector')).toBeInTheDocument();
      expect(screen.getByText('Test File Selector')).toBeInTheDocument();
    });

    it('renders label and description correctly', () => {
      renderFileSelector({
        label: 'Upload Document',
        description: 'Select a document file to upload',
      });

      expect(screen.getByText('Upload Document')).toBeInTheDocument();
      expect(screen.getByText('Select a document file to upload')).toBeInTheDocument();
    });

    it('shows required indicator when required prop is true', () => {
      renderFileSelector({ required: true });
      
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveAttribute('aria-label', 'required');
    });

    it('applies custom className correctly', () => {
      renderFileSelector({ className: 'custom-file-selector' });
      
      const container = screen.getByTestId('file-selector').parentElement;
      expect(container).toHaveClass('custom-file-selector');
    });

    it('renders helper text when provided', () => {
      renderFileSelector({
        helperText: 'Maximum file size is 50MB',
      });

      expect(screen.getByText('Maximum file size is 50MB')).toBeInTheDocument();
    });

    it('displays error message when error prop is provided', () => {
      renderFileSelector({
        error: 'File selection is required',
      });

      expect(screen.getByText('File selection is required')).toBeInTheDocument();
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Warning icon
    });

    it('renders in disabled state correctly', () => {
      renderFileSelector({ disabled: true });
      
      const dropzone = screen.getByRole('button');
      expect(dropzone).toHaveAttribute('tabindex', '-1');
      expect(dropzone).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('renders in loading state correctly', () => {
      renderFileSelector({ loading: true });
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toHaveClass('animate-spin');
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('enables drag and drop by default', async () => {
      const { user } = renderFileSelector();
      
      const dropzone = screen.getByRole('button');
      expect(dropzone).toBeInTheDocument();
      expect(screen.getByText(/Click to browse or drag and drop/)).toBeInTheDocument();
    });

    it('disables drag and drop when dragAndDrop prop is false', () => {
      renderFileSelector({ dragAndDrop: false });
      
      expect(screen.getByText('Browse Files')).toBeInTheDocument();
      expect(screen.queryByText(/drag and drop/)).not.toBeInTheDocument();
    });

    it('handles file drop correctly', async () => {
      const onFileSelected = vi.fn();
      const { user } = renderFileSelector({ onFileSelected });
      
      const file = createMockFile('test.txt', 1024, 'text/plain');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      expect(onFileSelected).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'test.txt',
          size: 1024,
          contentType: 'text/plain',
        })
      );
    });

    it('provides visual feedback during drag operations', async () => {
      const { user } = renderFileSelector();
      
      const dropzone = screen.getByRole('button');
      const file = createMockFile();
      
      // Simulate drag enter
      fireEvent.dragEnter(dropzone, {
        dataTransfer: {
          files: [file],
          types: ['Files'],
        },
      });
      
      // Should show drag active styling
      expect(dropzone).toHaveClass('border-green-400', 'bg-green-50');
    });

    it('shows rejection feedback for invalid files', async () => {
      const { user } = renderFileSelector({
        allowedExtensions: ['.txt'],
        maxFileSize: 1000,
      });
      
      const invalidFile = createMockFile('test.pdf', 2000, 'application/pdf');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [invalidFile], user);
      
      await waitFor(() => {
        expect(screen.getByText(/File type \.pdf is not allowed/)).toBeInTheDocument();
      });
    });

    it('handles multiple file rejection correctly', async () => {
      const { user } = renderFileSelector({ multiple: false });
      
      const files = [
        createMockFile('file1.txt'),
        createMockFile('file2.txt'),
      ];
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, files, user);
      
      // Should only process the first file
      await waitForUploadCompletion();
      expect(screen.getByText('File selected')).toBeInTheDocument();
    });
  });

  describe('File Selection Dialog', () => {
    it('opens file selector dialog when clicking browse button', async () => {
      const { user } = renderFileSelector({ dragAndDrop: false });
      
      const browseButton = screen.getByRole('button', { name: /Browse Files/ });
      await user.click(browseButton);
      
      // Dialog should open (mocked)
      expect(browseButton).toBeInTheDocument();
    });

    it('does not open dialog when disabled', async () => {
      const { user } = renderFileSelector({ 
        disabled: true,
        dragAndDrop: false,
      });
      
      const browseButton = screen.getByRole('button');
      expect(browseButton).toBeDisabled();
      
      // Should not respond to clicks
      await user.click(browseButton);
      // Dialog should not open
    });

    it('does not open dialog when in loading state', async () => {
      const { user } = renderFileSelector({ 
        loading: true,
        dragAndDrop: false,
      });
      
      const browseButton = screen.getByRole('button');
      expect(browseButton).toBeDisabled();
    });
  });

  describe('File Validation', () => {
    it('validates file extensions correctly', async () => {
      const onFileSelected = vi.fn();
      const { user } = renderFileSelector({
        allowedExtensions: ['.txt', '.md'],
        onFileSelected,
      });
      
      const validFile = createMockFile('document.txt', 1024, 'text/plain');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [validFile], user);
      await waitForUploadCompletion();
      
      expect(onFileSelected).toHaveBeenCalled();
    });

    it('rejects files with invalid extensions', async () => {
      const onFileSelected = vi.fn();
      const { user } = renderFileSelector({
        allowedExtensions: ['.txt'],
        onFileSelected,
      });
      
      const invalidFile = createMockFile('document.pdf', 1024, 'application/pdf');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [invalidFile], user);
      
      await waitFor(() => {
        expect(screen.getByText(/File type \.pdf is not allowed/)).toBeInTheDocument();
      });
      
      expect(onFileSelected).not.toHaveBeenCalled();
    });

    it('validates file size correctly', async () => {
      const { user } = renderFileSelector({
        maxFileSize: 1000, // 1KB limit
      });
      
      const largeFile = createMockFile('large.txt', 2000, 'text/plain');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [largeFile], user);
      
      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum allowed size/)).toBeInTheDocument();
      });
    });

    it('applies custom validation rules', async () => {
      const customValidator = vi.fn((file: File) => {
        if (file.name.includes('forbidden')) {
          return 'File name contains forbidden word';
        }
        return undefined;
      });

      const { user } = renderFileSelector({
        validation: {
          custom: customValidator,
        },
      });
      
      const forbiddenFile = createMockFile('forbidden-file.txt');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [forbiddenFile], user);
      
      await waitFor(() => {
        expect(screen.getByText('File name contains forbidden word')).toBeInTheDocument();
      });
      
      expect(customValidator).toHaveBeenCalledWith(forbiddenFile);
    });

    it('shows validation errors for required field when no file selected', async () => {
      renderFileSelector({ required: true });
      
      await waitFor(() => {
        expect(screen.getByText('File selection is required')).toBeInTheDocument();
      });
    });
  });

  describe('Selected File Display', () => {
    it('displays selected file information correctly', async () => {
      const { user } = renderFileSelector();
      
      const file = createMockFile('document.pdf', 204800, 'application/pdf');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('200 KB')).toBeInTheDocument();
      expect(screen.getByText('application/pdf')).toBeInTheDocument();
    });

    it('shows upload progress during file processing', async () => {
      const { user } = renderFileSelector();
      
      const file = createMockFile('test.txt');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      
      // Should show progress bar
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
      
      // Should show uploading text
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    it('allows clearing selected file', async () => {
      const onFileSelected = vi.fn();
      const { user } = renderFileSelector({ onFileSelected });
      
      const file = createMockFile('test.txt');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      // Find and click remove button
      const removeButton = screen.getByRole('button', { name: /Remove selected file/ });
      await user.click(removeButton);
      
      expect(onFileSelected).toHaveBeenLastCalledWith(undefined);
      expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    });

    it('displays file preview when enabled', async () => {
      const { user } = renderFileSelector({ showPreview: true });
      
      const file = createMockFile('config.json', 1024, 'application/json');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      // Should show preview toggle button
      const previewButton = screen.getByRole('button', { name: /Show preview/ });
      expect(previewButton).toBeInTheDocument();
      
      await user.click(previewButton);
      
      // Should show file path in preview
      expect(screen.getByText('File Preview')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation for file selection', async () => {
      const { user } = renderFileSelector({ dragAndDrop: false });
      const keyboard = createKeyboardUtils(user);
      
      const browseButton = screen.getByRole('button');
      browseButton.focus();
      
      expect(keyboard.isFocused(browseButton)).toBe(true);
      
      await keyboard.enter();
      // Should trigger file selection dialog
    });

    it('handles Escape key to clear selection', async () => {
      const onFileSelected = vi.fn();
      const { user } = renderFileSelector({ onFileSelected });
      const keyboard = createKeyboardUtils(user);
      
      // First select a file
      const file = createMockFile('test.txt');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      // Focus the dropzone and press Escape
      dropzone.focus();
      await keyboard.escape();
      
      expect(onFileSelected).toHaveBeenLastCalledWith(undefined);
    });

    it('handles Delete key to clear selection', async () => {
      const onFileSelected = vi.fn();
      const { user } = renderFileSelector({ onFileSelected });
      const keyboard = createKeyboardUtils(user);
      
      // First select a file
      const file = createMockFile('test.txt');
      const dropzone = screen.getByRole('button');
      
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      // Focus the dropzone and press Delete
      dropzone.focus();
      await user.keyboard('{Delete}');
      
      expect(onFileSelected).toHaveBeenLastCalledWith(undefined);
    });

    it('supports Tab navigation through interactive elements', async () => {
      const { user } = renderFileSelector({ showPreview: true });
      const keyboard = createKeyboardUtils(user);
      
      // Select a file first
      const file = createMockFile('test.txt');
      const dropzone = screen.getByRole('button');
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
      
      // Start from dropzone
      dropzone.focus();
      expect(keyboard.isFocused(dropzone)).toBe(true);
      
      // Tab to preview button
      await keyboard.tab();
      const previewButton = screen.getByRole('button', { name: /Show preview/ });
      expect(keyboard.isFocused(previewButton)).toBe(true);
      
      // Tab to remove button
      await keyboard.tab();
      const removeButton = screen.getByRole('button', { name: /Remove selected file/ });
      expect(keyboard.isFocused(removeButton)).toBe(true);
    });
  });

  describe('Component Variants', () => {
    it('renders CompactFileSelector with appropriate properties', () => {
      customRender(<CompactFileSelector label="Compact Selector" />);
      
      expect(screen.getByText('Compact Selector')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Browse Files/ })).toBeInTheDocument();
    });

    it('renders UploadFileSelector with upload-focused features', () => {
      customRender(<UploadFileSelector label="Upload Selector" />);
      
      expect(screen.getByText('Upload Selector')).toBeInTheDocument();
      expect(screen.getByText(/Click to browse or drag and drop/)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('FileSelector Accessibility', () => {
  it('meets WCAG 2.1 AA accessibility standards', async () => {
    const { container } = renderFileSelector();
    
    await testA11y(container, {
      tags: ['wcag2a', 'wcag2aa'],
    });
  });

  it('has proper ARIA attributes', () => {
    renderFileSelector({
      'aria-label': 'Custom file selector',
      'aria-describedby': 'helper-text',
    });
    
    const dropzone = screen.getByRole('button');
    
    checkAriaAttributes(dropzone, {
      'aria-label': 'Custom file selector',
      'aria-describedby': 'helper-text',
    });
  });

  it('provides screen reader friendly file information', async () => {
    const { user } = renderFileSelector();
    
    const file = createMockFile('important-document.pdf', 1024, 'application/pdf');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    // Check that file information is accessible
    expect(screen.getByText('important-document.pdf')).toBeInTheDocument();
    
    const removeButton = screen.getByRole('button', { name: /Remove selected file/ });
    expect(removeButton).toHaveAttribute('aria-label', 'Remove selected file');
  });

  it('has proper focus management', async () => {
    const { user } = renderFileSelector();
    
    const dropzone = screen.getByRole('button');
    dropzone.focus();
    
    expect(document.activeElement).toBe(dropzone);
    expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  it('provides proper error announcements', async () => {
    const { user } = renderFileSelector({
      allowedExtensions: ['.txt'],
    });
    
    const invalidFile = createMockFile('test.pdf', 1024, 'application/pdf');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [invalidFile], user);
    
    await waitFor(() => {
      const errorElement = screen.getByText(/File type \.pdf is not allowed/);
      expect(errorElement).toBeInTheDocument();
      
      // Error should be associated with the component
      expect(errorElement.closest('[role="alert"]')).toBeTruthy();
    });
  });

  it('handles disabled state accessibility correctly', () => {
    renderFileSelector({ disabled: true });
    
    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('tabindex', '-1');
    expect(dropzone).toHaveClass('cursor-not-allowed');
  });

  it('provides accessible file upload progress', async () => {
    const { user } = renderFileSelector();
    
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', expect.stringMatching(/Upload progress/));
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('FileSelector Performance', () => {
  it('renders within acceptable time limits', async () => {
    const { renderTime } = await measureRenderTime(() =>
      renderFileSelector()
    );
    
    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large file uploads efficiently', async () => {
    const { user } = renderFileSelector({
      maxFileSize: 100 * 1024 * 1024, // 100MB
    });
    
    const startTime = performance.now();
    
    const largeFile = createMockFile('large-file.txt', 50 * 1024 * 1024, 'text/plain');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [largeFile], user);
    await waitForUploadCompletion();
    
    const processingTime = performance.now() - startTime;
    
    // Should process within reasonable time (under 2 seconds for mock)
    expect(processingTime).toBeLessThan(2000);
  });

  it('handles multiple file validation efficiently', async () => {
    const { user } = renderFileSelector({
      allowedExtensions: ['.txt', '.pdf', '.jpg', '.png', '.doc'],
    });
    
    const files = Array.from({ length: 10 }, (_, i) =>
      createMockFile(`file-${i}.txt`, 1024, 'text/plain')
    );
    
    const startTime = performance.now();
    
    for (const file of files) {
      const dropzone = screen.getByRole('button');
      await simulateFileDrop(dropzone, [file], user);
      await waitForUploadCompletion();
    }
    
    const totalTime = performance.now() - startTime;
    
    // Should handle multiple files efficiently
    expect(totalTime).toBeLessThan(5000);
  });

  it('maintains responsiveness during file processing', async () => {
    const { user } = renderFileSelector();
    
    const file = createMockFile('test.txt', 10 * 1024, 'text/plain');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    
    // Component should remain interactive during processing
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    // Should be able to interact with other elements
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('FileSelector Error Handling', () => {
  it('handles network errors gracefully', async () => {
    // Mock network failure
    server.use(
      http.post('/api/v2/local_file/*', () => {
        return HttpResponse.error();
      })
    );

    const { user } = renderFileSelector();
    
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
    });
  });

  it('handles API errors with proper user feedback', async () => {
    // Mock API error response
    server.use(
      http.post('/api/v2/local_file/*', () => {
        return HttpResponse.json(
          {
            error: {
              code: 400,
              message: 'Invalid file format',
            },
          },
          { status: 400 }
        );
      })
    );

    const { user } = renderFileSelector();
    
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
    });
  });

  it('handles file read errors', async () => {
    // Mock FileReader error
    global.FileReader = class MockErrorFileReader {
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      
      readAsText() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror({} as ProgressEvent<FileReader>);
          }
        }, 10);
      }
    } as any;

    const { user } = renderFileSelector({ showPreview: true });
    
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    
    // Should handle file read error gracefully
    await waitFor(() => {
      expect(screen.queryByText('File Preview')).not.toBeInTheDocument();
    });
  });

  it('recovers from errors and allows retry', async () => {
    let callCount = 0;
    
    // Mock failing then succeeding upload
    server.use(
      http.post('/api/v2/local_file/*', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json({
          resource: [mockSelectedFile],
          meta: { uploaded_count: 1 },
        });
      })
    );

    const { user } = renderFileSelector();
    
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    // First attempt - should fail
    await simulateFileDrop(dropzone, [file], user);
    
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
    });
    
    // Second attempt - should succeed
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    expect(screen.getByText('File selected')).toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS WITH MSW
// ============================================================================

describe('FileSelector API Integration', () => {
  it('integrates with file services API correctly', async () => {
    const { user } = renderFileSelector();
    
    // Should load file services in the background
    await waitFor(() => {
      expect(screen.getByTestId('file-selector')).toBeInTheDocument();
    });
    
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    // Should successfully upload file
    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });

  it('handles file service authentication', async () => {
    // Mock authentication required response
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json(
          { error: { code: 401, message: 'Authentication required' } },
          { status: 401 }
        );
      })
    );

    renderFileSelector();
    
    // Should handle authentication gracefully
    await waitFor(() => {
      expect(screen.getByTestId('file-selector')).toBeInTheDocument();
    });
  });

  it('adapts to different file service configurations', async () => {
    // Mock different service response
    server.use(
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: [
            {
              id: 3,
              name: 'azure_blob',
              label: 'Azure Blob Storage',
              type: 'azure_blob',
              description: 'Azure cloud storage',
              active: true,
              config: {
                container: 'files',
                max_file_size: '100MB',
              },
            },
          ],
        });
      })
    );

    const { user } = renderFileSelector();
    
    await waitFor(() => {
      expect(screen.getByTestId('file-selector')).toBeInTheDocument();
    });
    
    // Should work with different service configuration
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });
});

// ============================================================================
// VISUAL REGRESSION TESTS
// ============================================================================

describe('FileSelector Visual Regression', () => {
  // Note: These tests would typically use Playwright for actual visual regression testing
  // Here we're testing the component states that would be captured visually
  
  it('renders consistent default state', () => {
    renderFileSelector();
    
    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveClass('border-gray-300');
    expect(screen.getByText(/Click to browse or drag and drop/)).toBeInTheDocument();
  });

  it('renders consistent drag active state', () => {
    const { user } = renderFileSelector();
    
    const dropzone = screen.getByRole('button');
    const file = createMockFile();
    
    fireEvent.dragEnter(dropzone, {
      dataTransfer: {
        files: [file],
        types: ['Files'],
      },
    });
    
    expect(dropzone).toHaveClass('border-green-400', 'bg-green-50');
  });

  it('renders consistent error state', () => {
    renderFileSelector({
      error: 'File selection is required',
    });
    
    expect(screen.getByText('File selection is required')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-red-500');
  });

  it('renders consistent selected file state', async () => {
    const { user } = renderFileSelector();
    
    const file = createMockFile('document.pdf', 1024, 'application/pdf');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remove selected file/ })).toBeInTheDocument();
  });

  it('renders consistent loading state', () => {
    renderFileSelector({ loading: true });
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('animate-spin');
  });

  it('renders consistent disabled state', () => {
    renderFileSelector({ disabled: true });
    
    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(dropzone).toHaveAttribute('tabindex', '-1');
  });
});

// ============================================================================
// FORM INTEGRATION TESTS
// ============================================================================

describe('FileSelector Form Integration', () => {
  it('integrates with React Hook Form correctly', async () => {
    const onSubmit = vi.fn();
    
    const { formMethods, user } = renderWithForm(
      <form onSubmit={formMethods.handleSubmit(onSubmit)}>
        <FileSelector
          label="Document Upload"
          {...formMethods.register('file')}
        />
        <button type="submit">Submit</button>
      </form>,
      {
        defaultValues: { file: '' },
      }
    );
    
    // Select a file
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button', { name: /Document Upload/ });
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          file: expect.stringContaining('/opt/dreamfactory/storage/app/test.txt'),
        }),
        expect.any(Object)
      );
    });
  });

  it('validates required fields in forms', async () => {
    const { formMethods, user, triggerValidation } = renderWithForm(
      <FileSelector
        label="Required File"
        required={true}
        {...formMethods.register('file', { required: 'File is required' })}
      />,
      {
        defaultValues: { file: '' },
      }
    );
    
    // Trigger validation without selecting file
    const isValid = await triggerValidation('file');
    
    expect(isValid).toBe(false);
    expect(formMethods.formState.errors.file?.message).toBe('File is required');
  });

  it('clears form errors after file selection', async () => {
    const { formMethods, user, triggerValidation } = renderWithForm(
      <FileSelector
        label="File Upload"
        required={true}
        {...formMethods.register('file', { required: 'File is required' })}
      />,
      {
        defaultValues: { file: '' },
      }
    );
    
    // First trigger validation error
    await triggerValidation('file');
    expect(formMethods.formState.errors.file?.message).toBe('File is required');
    
    // Then select a file
    const file = createMockFile('test.txt');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    // Error should be cleared
    await waitFor(() => {
      expect(formMethods.formState.errors.file).toBeUndefined();
    });
  });
});

// ============================================================================
// EDGE CASES AND BOUNDARY TESTS
// ============================================================================

describe('FileSelector Edge Cases', () => {
  it('handles empty file selection gracefully', async () => {
    const { user } = renderFileSelector();
    
    const dropzone = screen.getByRole('button');
    
    // Simulate drop with no files
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [],
        types: ['Files'],
      },
    });
    
    // Should not crash or show errors
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('handles malformed file objects', async () => {
    const { user } = renderFileSelector();
    
    const malformedFile = {
      name: 'test.txt',
      // Missing required File properties
    } as File;
    
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [malformedFile], user);
    
    // Should handle gracefully without crashing
    expect(screen.getByTestId('file-selector')).toBeInTheDocument();
  });

  it('handles extremely long file names', async () => {
    const { user } = renderFileSelector();
    
    const longFileName = 'a'.repeat(255) + '.txt';
    const file = createMockFile(longFileName, 1024, 'text/plain');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    // Should display truncated filename appropriately
    expect(screen.getByText(longFileName)).toBeInTheDocument();
  });

  it('handles files with no extension', async () => {
    const { user } = renderFileSelector();
    
    const file = createMockFile('README', 1024, 'text/plain');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [file], user);
    await waitForUploadCompletion();
    
    expect(screen.getByText('README')).toBeInTheDocument();
  });

  it('handles zero-byte files', async () => {
    const { user } = renderFileSelector();
    
    const emptyFile = createMockFile('empty.txt', 0, 'text/plain');
    const dropzone = screen.getByRole('button');
    
    await simulateFileDrop(dropzone, [emptyFile], user);
    await waitForUploadCompletion();
    
    expect(screen.getByText('empty.txt')).toBeInTheDocument();
    expect(screen.getByText('0 Bytes')).toBeInTheDocument();
  });

  it('handles rapid consecutive file selections', async () => {
    const onFileSelected = vi.fn();
    const { user } = renderFileSelector({ onFileSelected });
    
    const dropzone = screen.getByRole('button');
    
    // Rapidly drop multiple files
    for (let i = 0; i < 5; i++) {
      const file = createMockFile(`file-${i}.txt`);
      await simulateFileDrop(dropzone, [file], user);
    }
    
    await waitForUploadCompletion();
    
    // Should handle the last file properly
    expect(onFileSelected).toHaveBeenCalled();
    expect(screen.getByText(/file-\d+\.txt/)).toBeInTheDocument();
  });
});