/**
 * @fileoverview Comprehensive Vitest test suite for FileSelectorDialog component
 * Testing modal behavior, file navigation, upload workflows, keyboard accessibility,
 * drag-and-drop functionality, and file operation error scenarios.
 * 
 * Migration from Angular: Replaces Angular TestBed with React Testing Library
 * and MSW for realistic API mocking during development and testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { server } from '../../../test/mocks/server';
import { rest } from 'msw';

// Component and dependencies
import { FileSelectorDialog } from './FileSelectorDialog';
import { FileApiInfo, SelectedFile, FileMetadata } from './types';

// Test utilities and providers
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createMockFileApiInfo, createMockFileMetadata, createMockSelectedFile } from '../../../test/utils/component-factories';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * Mock file API service for testing file operations
 */
const mockFileApiService = {
  listFiles: vi.fn(),
  uploadFile: vi.fn(),
  createFolder: vi.fn(),
  deleteFile: vi.fn(),
  downloadFile: vi.fn(),
};

/**
 * Default props for FileSelectorDialog component
 */
const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSelect: vi.fn(),
  fileApiInfo: createMockFileApiInfo({
    serviceName: 'test-service',
    path: '/',
    containerName: 'test-container',
  }),
  allowMultiSelect: false,
  allowUpload: true,
  acceptedFileTypes: ['text/*', 'application/json'],
  maxFileSize: 10485760, // 10MB
  title: 'Select File',
};

/**
 * Mock large file dataset for performance testing
 */
const generateLargeFileDataset = (count: number): FileMetadata[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockFileMetadata({
      name: `file-${index.toString().padStart(4, '0')}.txt`,
      path: `/files/file-${index}.txt`,
      type: 'file',
      contentType: 'text/plain',
      size: Math.floor(Math.random() * 1048576), // Random size up to 1MB
      lastModified: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    })
  );
};

/**
 * Mock drag and drop events
 */
const createMockDragEvent = (type: string, files: File[] = []) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      types: files.length > 0 ? ['Files'] : [],
      dropEffect: 'copy',
      effectAllowed: 'copy',
    },
    writable: false,
  });
  return event;
};

/**
 * Create mock file objects for testing
 */
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileSelectorDialog', () => {
  const user = userEvent.setup();

  beforeAll(() => {
    // Setup IntersectionObserver for virtual scrolling tests
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    }));

    // Setup ResizeObserver for responsive tests
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock File API for drag-and-drop tests
    global.File = vi.fn().mockImplementation((chunks, filename, options) => ({
      name: filename,
      size: chunks.join('').length,
      type: options?.type || '',
      lastModified: Date.now(),
      webkitRelativePath: '',
      stream: vi.fn(),
      arrayBuffer: vi.fn(),
      slice: vi.fn(),
      text: vi.fn(),
    }));
  });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default MSW handlers for file operations
    server.use(
      rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
        const path = req.url.searchParams.get('path') || '/';
        const isRoot = path === '/';
        
        return res(
          ctx.json({
            resource: isRoot 
              ? [
                  createMockFileMetadata({ name: 'folder1', type: 'folder', path: '/folder1' }),
                  createMockFileMetadata({ name: 'test.txt', type: 'file', path: '/test.txt' }),
                  createMockFileMetadata({ name: 'image.png', type: 'file', path: '/image.png' }),
                ]
              : [
                  createMockFileMetadata({ name: 'subfolder', type: 'folder', path: `${path}/subfolder` }),
                  createMockFileMetadata({ name: 'document.pdf', type: 'file', path: `${path}/document.pdf` }),
                ]
          })
        );
      }),
      
      rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      }),
      
      rest.delete('/api/v2/test-service/_table/test-container/*', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Modal Behavior and Focus Management', () => {
    it('should render modal with proper ARIA attributes', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      
      const title = screen.getByText('Select File');
      expect(title).toBeInTheDocument();
    });

    it('should focus the first interactive element when opened', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toHaveFocus();
      });
    });

    it('should trap focus within the modal', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      const focusableElements = within(dialog).getAllByRole('button');
      
      // Focus should be trapped within the modal
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Simulate Tab key navigation
      await user.tab();
      expect(document.activeElement).toBe(focusableElements[1] || focusableElements[0]);
    });

    it('should close modal on Escape key press', async () => {
      const mockOnClose = vi.fn();
      renderWithProviders(
        <FileSelectorDialog {...defaultProps} onClose={mockOnClose} />
      );
      
      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal on backdrop click', async () => {
      const mockOnClose = vi.fn();
      renderWithProviders(
        <FileSelectorDialog {...defaultProps} onClose={mockOnClose} />
      );
      
      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when clicking inside content area', async () => {
      const mockOnClose = vi.fn();
      renderWithProviders(
        <FileSelectorDialog {...defaultProps} onClose={mockOnClose} />
      );
      
      const content = screen.getByRole('dialog');
      await user.click(content);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('File Navigation and Browsing', () => {
    it('should display file list on initial load', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
        expect(screen.getByText('test.txt')).toBeInTheDocument();
        expect(screen.getByText('image.png')).toBeInTheDocument();
      });
    });

    it('should navigate into folders on double-click', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
      });
      
      const folder = screen.getByText('folder1');
      await user.dblClick(folder);
      
      await waitFor(() => {
        expect(screen.getByText('subfolder')).toBeInTheDocument();
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });

    it('should navigate up using breadcrumb navigation', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      // Navigate into a folder first
      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
      });
      
      const folder = screen.getByText('folder1');
      await user.dblClick(folder);
      
      await waitFor(() => {
        expect(screen.getByText('subfolder')).toBeInTheDocument();
      });
      
      // Navigate back using breadcrumb
      const breadcrumbRoot = screen.getByText('Root');
      await user.click(breadcrumbRoot);
      
      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
    });

    it('should handle navigation errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ error: 'Folder not found' }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading files/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during navigation', async () => {
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.delay(100), ctx.json({ resource: [] }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('File Selection and Multi-Selection', () => {
    it('should select single file when clicked', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const file = screen.getByText('test.txt');
      await user.click(file);
      
      expect(file.closest('[data-selected="true"]')).toBeInTheDocument();
    });

    it('should handle multi-selection when enabled', async () => {
      renderWithProviders(
        <FileSelectorDialog {...defaultProps} allowMultiSelect={true} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
        expect(screen.getByText('image.png')).toBeInTheDocument();
      });
      
      const file1 = screen.getByText('test.txt');
      const file2 = screen.getByText('image.png');
      
      await user.click(file1);
      await user.keyboard('{Control>}');
      await user.click(file2);
      await user.keyboard('{/Control}');
      
      expect(file1.closest('[data-selected="true"]')).toBeInTheDocument();
      expect(file2.closest('[data-selected="true"]')).toBeInTheDocument();
    });

    it('should clear selection when navigating to different folder', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      // Select a file
      const file = screen.getByText('test.txt');
      await user.click(file);
      expect(file.closest('[data-selected="true"]')).toBeInTheDocument();
      
      // Navigate to folder
      const folder = screen.getByText('folder1');
      await user.dblClick(folder);
      
      await waitFor(() => {
        expect(screen.getByText('subfolder')).toBeInTheDocument();
      });
      
      // Selection should be cleared
      const selectedItems = screen.queryAllByTestId('selected-file-item');
      expect(selectedItems).toHaveLength(0);
    });

    it('should call onSelect with correct file data', async () => {
      const mockOnSelect = vi.fn();
      renderWithProviders(
        <FileSelectorDialog {...defaultProps} onSelect={mockOnSelect} />
      );
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const file = screen.getByText('test.txt');
      await user.click(file);
      
      const selectButton = screen.getByRole('button', { name: /select/i });
      await user.click(selectButton);
      
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test.txt',
          path: '/test.txt',
          type: 'file',
        })
      );
    });
  });

  describe('File Upload Functionality', () => {
    it('should show upload area when upload is enabled', () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} allowUpload={true} />);
      
      expect(screen.getByTestId('file-upload-area')).toBeInTheDocument();
      expect(screen.getByText(/drag files here or click to upload/i)).toBeInTheDocument();
    });

    it('should hide upload area when upload is disabled', () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} allowUpload={false} />);
      
      expect(screen.queryByTestId('file-upload-area')).not.toBeInTheDocument();
    });

    it('should handle file upload via file input', async () => {
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ success: true, name: 'uploaded-file.txt' }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = createMockFile('test-upload.txt', 1024, 'text/plain');
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
      });
    });

    it('should validate file type restrictions', async () => {
      renderWithProviders(
        <FileSelectorDialog 
          {...defaultProps} 
          acceptedFileTypes={['text/*']} 
        />
      );
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const invalidFile = createMockFile('test.exe', 1024, 'application/octet-stream');
      
      await user.upload(fileInput, invalidFile);
      
      await waitFor(() => {
        expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
      });
    });

    it('should validate file size restrictions', async () => {
      renderWithProviders(
        <FileSelectorDialog 
          {...defaultProps} 
          maxFileSize={1024} // 1KB limit
        />
      );
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const largeFile = createMockFile('large-file.txt', 2048, 'text/plain');
      
      await user.upload(fileInput, largeFile);
      
      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
    });

    it('should show upload progress', async () => {
      let progressCallback: ((progress: number) => void) | null = null;
      
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', async (req, res, ctx) => {
          // Simulate upload progress
          return res(
            ctx.delay(100),
            ctx.json({ success: true, name: 'uploaded-file.txt' })
          );
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = createMockFile('test-upload.txt', 1024, 'text/plain');
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should handle upload errors gracefully', async () => {
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Upload failed' }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = createMockFile('test-upload.txt', 1024, 'text/plain');
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should highlight drop area on drag enter', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const dropArea = screen.getByTestId('file-upload-area');
      const file = createMockFile('test.txt', 1024, 'text/plain');
      
      fireEvent(dropArea, createMockDragEvent('dragenter', [file]));
      
      expect(dropArea).toHaveClass('drag-over');
    });

    it('should remove highlight on drag leave', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const dropArea = screen.getByTestId('file-upload-area');
      const file = createMockFile('test.txt', 1024, 'text/plain');
      
      fireEvent(dropArea, createMockDragEvent('dragenter', [file]));
      expect(dropArea).toHaveClass('drag-over');
      
      fireEvent(dropArea, createMockDragEvent('dragleave'));
      expect(dropArea).not.toHaveClass('drag-over');
    });

    it('should handle file drop and upload', async () => {
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ success: true, name: 'dropped-file.txt' }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const dropArea = screen.getByTestId('file-upload-area');
      const file = createMockFile('test.txt', 1024, 'text/plain');
      
      fireEvent(dropArea, createMockDragEvent('drop', [file]));
      
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });
    });

    it('should handle multiple file drops when multi-upload is enabled', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} allowMultiSelect={true} />);
      
      const dropArea = screen.getByTestId('file-upload-area');
      const files = [
        createMockFile('file1.txt', 1024, 'text/plain'),
        createMockFile('file2.txt', 1024, 'text/plain'),
      ];
      
      fireEvent(dropArea, createMockDragEvent('drop', files));
      
      await waitFor(() => {
        expect(screen.getAllByText(/uploading/i)).toHaveLength(2);
      });
    });

    it('should validate dropped files against restrictions', async () => {
      renderWithProviders(
        <FileSelectorDialog 
          {...defaultProps} 
          acceptedFileTypes={['text/*']} 
        />
      );
      
      const dropArea = screen.getByTestId('file-upload-area');
      const invalidFile = createMockFile('test.exe', 1024, 'application/octet-stream');
      
      fireEvent(dropArea, createMockDragEvent('drop', [invalidFile]));
      
      await waitFor(() => {
        expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation and Accessibility', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation through file list', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const fileList = screen.getByRole('list');
      const firstFile = within(fileList).getAllByRole('listitem')[0];
      
      await user.click(firstFile);
      expect(firstFile).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      const secondFile = within(fileList).getAllByRole('listitem')[1];
      expect(secondFile).toHaveFocus();
    });

    it('should support Enter key for file selection', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const file = screen.getByText('test.txt');
      await user.click(file);
      await user.keyboard('{Enter}');
      
      expect(file.closest('[data-selected="true"]')).toBeInTheDocument();
    });

    it('should support Space key for folder navigation', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument();
      });
      
      const folder = screen.getByText('folder1');
      await user.click(folder);
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(screen.getByText('subfolder')).toBeInTheDocument();
      });
    });

    it('should announce file operations to screen readers', async () => {
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const file = screen.getByText('test.txt');
      await user.click(file);
      
      expect(screen.getByText('File selected')).toHaveAttribute('aria-live', 'polite');
    });

    it('should support high contrast mode', async () => {
      // Simulate high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('high-contrast');
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('should render large file lists efficiently with virtual scrolling', async () => {
      const largeDataset = generateLargeFileDataset(1000);
      
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ resource: largeDataset }));
        })
      );
      
      const startTime = performance.now();
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time limit (< 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Should only render visible items initially
      const visibleItems = screen.getAllByRole('listitem');
      expect(visibleItems.length).toBeLessThan(50); // Assuming 50 items per viewport
    });

    it('should maintain scroll position during navigation', async () => {
      const largeDataset = generateLargeFileDataset(100);
      
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ resource: largeDataset }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
      
      const virtualList = screen.getByTestId('virtual-list');
      
      // Scroll to middle of list
      fireEvent.scroll(virtualList, { target: { scrollTop: 500 } });
      
      // Navigate and come back
      const folder = screen.getByText('folder1');
      await user.dblClick(folder);
      
      await waitFor(() => {
        expect(screen.getByText('subfolder')).toBeInTheDocument();
      });
      
      const backButton = screen.getByText('Root');
      await user.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
      
      // Scroll position should be restored
      expect(virtualList.scrollTop).toBe(500);
    });

    it('should handle rapid scrolling without performance degradation', async () => {
      const largeDataset = generateLargeFileDataset(1000);
      
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ resource: largeDataset }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('virtual-list')).toBeInTheDocument();
      });
      
      const virtualList = screen.getByTestId('virtual-list');
      
      // Simulate rapid scrolling
      const scrollEvents = Array.from({ length: 10 }, (_, i) => i * 100);
      const startTime = performance.now();
      
      scrollEvents.forEach(scrollTop => {
        act(() => {
          fireEvent.scroll(virtualList, { target: { scrollTop } });
        });
      });
      
      const endTime = performance.now();
      const scrollTime = endTime - startTime;
      
      // Should handle rapid scrolling efficiently (< 50ms)
      expect(scrollTime).toBeLessThan(50);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API connection errors gracefully', async () => {
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/unable to connect/i)).toBeInTheDocument();
      });
      
      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle invalid file service configuration', async () => {
      const invalidProps = {
        ...defaultProps,
        fileApiInfo: createMockFileApiInfo({
          serviceName: '',
          path: '',
          containerName: '',
        }),
      };
      
      renderWithProviders(<FileSelectorDialog {...invalidProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid configuration/i)).toBeInTheDocument();
      });
    });

    it('should handle empty directory gracefully', async () => {
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ resource: [] }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no files found/i)).toBeInTheDocument();
      });
    });

    it('should handle corrupted file metadata', async () => {
      server.use(
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ 
            resource: [
              { name: null, type: 'file' }, // Invalid file
              createMockFileMetadata({ name: 'valid-file.txt', type: 'file' }),
            ]
          }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('valid-file.txt')).toBeInTheDocument();
        expect(screen.queryByText('null')).not.toBeInTheDocument();
      });
    });

    it('should handle upload cancellation', async () => {
      let abortController: AbortController;
      
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', async (req, res, ctx) => {
          abortController = new AbortController();
          return res(
            ctx.delay(1000),
            ctx.json({ success: true })
          );
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = createMockFile('test-upload.txt', 1024, 'text/plain');
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByText(/upload cancelled/i)).toBeInTheDocument();
      });
    });

    it('should handle quota exceeded errors during upload', async () => {
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(
            ctx.status(413),
            ctx.json({ error: 'Quota exceeded' })
          );
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = createMockFile('test-upload.txt', 1024, 'text/plain');
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Integration with File API Services', () => {
    it('should refresh file list after successful upload', async () => {
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ success: true, name: 'new-file.txt' }));
        }),
        rest.get('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({
            resource: [
              createMockFileMetadata({ name: 'test.txt', type: 'file' }),
              createMockFileMetadata({ name: 'new-file.txt', type: 'file' }),
            ]
          }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = createMockFile('new-file.txt', 1024, 'text/plain');
      
      await user.upload(fileInput, file);
      
      await waitFor(() => {
        expect(screen.getByText('new-file.txt')).toBeInTheDocument();
      });
    });

    it('should handle folder creation and refresh', async () => {
      server.use(
        rest.post('/api/v2/test-service/_table/test-container', (req, res, ctx) => {
          return res(ctx.json({ success: true }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      const createFolderButton = screen.getByRole('button', { name: /create folder/i });
      await user.click(createFolderButton);
      
      const folderNameInput = screen.getByLabelText(/folder name/i);
      await user.type(folderNameInput, 'new-folder');
      
      const confirmButton = screen.getByRole('button', { name: /create/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('new-folder')).toBeInTheDocument();
      });
    });

    it('should handle file deletion with confirmation', async () => {
      server.use(
        rest.delete('/api/v2/test-service/_table/test-container/test.txt', (req, res, ctx) => {
          return res(ctx.json({ success: true }));
        })
      );
      
      renderWithProviders(<FileSelectorDialog {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
      });
      
      const file = screen.getByText('test.txt');
      await user.rightClick(file);
      
      const deleteOption = screen.getByText(/delete/i);
      await user.click(deleteOption);
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
      });
    });
  });
});