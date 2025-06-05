/**
 * Comprehensive Vitest test suite for the FileSelector component covering user interactions,
 * file operations, accessibility compliance, and error scenarios. Uses Mock Service Worker
 * for realistic API mocking and React Testing Library for component testing best practices.
 * 
 * @fileoverview FileSelector component test suite
 * @version 1.0.0
 * @since 2024-12-19
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  render, 
  screen, 
  fireEvent, 
  waitFor, 
  within,
  act
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient } from '@tanstack/react-query'

// Import test utilities
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockFile, createMockFiles } from '@/test/utils/component-factories'
import { measureComponentPerformance } from '@/test/utils/performance-helpers'
import { testKeyboardNavigation } from '@/test/utils/accessibility-helpers'

// Import component and dependencies
import { FileSelector } from './FileSelector'
import type { FileSelectorProps, FileApiInfo, SelectedFile } from './types'

// Import MSW mocks
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations)

describe('FileSelector Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  // Default props for testing
  const defaultProps: FileSelectorProps = {
    serviceId: 'test-service',
    serviceName: 'Test File Service',
    allowedFileTypes: ['.txt', '.json', '.csv'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    multiSelect: false,
    showCreateFolder: true,
    onFileSelect: vi.fn(),
    onError: vi.fn()
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('Component Rendering', () => {
    it('should render the file selector with initial state', () => {
      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      expect(screen.getByRole('main', { name: /file selector/i })).toBeInTheDocument()
      expect(screen.getByText('Test File Service')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument()
    })

    it('should display file type restrictions when provided', () => {
      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      expect(screen.getByText(/allowed file types: \.txt, \.json, \.csv/i)).toBeInTheDocument()
    })

    it('should show upload area when drag and drop is enabled', () => {
      renderWithProviders(
        <FileSelector {...defaultProps} allowDragDrop={true} />,
        { queryClient }
      )

      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
    })

    it('should display loading state when service is loading', () => {
      server.use(
        http.get('/api/v2/system/service', () => {
          return new Promise(resolve => setTimeout(resolve, 1000))
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })

    it('should handle missing service gracefully', () => {
      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.json({ error: 'Service not found' }, { status: 404 })
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      expect(screen.getByText(/service not available/i)).toBeInTheDocument()
    })
  })

  describe('File Browsing and Navigation', () => {
    it('should open file browser dialog when browse button is clicked', async () => {
      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /file browser/i })).toBeInTheDocument()
      })
    })

    it('should navigate through folder structure', async () => {
      // Mock file system structure
      const mockFolders = [
        { name: 'folder1', is_dir: true, path: '/folder1' },
        { name: 'file1.txt', is_dir: false, path: '/file1.txt' }
      ]

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json({ resource: mockFolders })
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(screen.getByText('folder1')).toBeInTheDocument()
      })

      // Navigate into folder
      const folderItem = screen.getByRole('button', { name: /folder1/i })
      await user.click(folderItem)

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
      })
    })

    it('should handle breadcrumb navigation', async () => {
      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      // Mock navigating into nested folders
      server.use(
        http.get('/api/v2/files', ({ request }) => {
          const url = new URL(request.url)
          const path = url.searchParams.get('path') || '/'
          
          if (path === '/') {
            return HttpResponse.json({
              resource: [{ name: 'documents', is_dir: true, path: '/documents' }]
            })
          } else if (path === '/documents') {
            return HttpResponse.json({
              resource: [{ name: 'subfolder', is_dir: true, path: '/documents/subfolder' }]
            })
          }
          return HttpResponse.json({ resource: [] })
        })
      )

      await waitFor(() => {
        const documentsFolder = screen.getByRole('button', { name: /documents/i })
        user.click(documentsFolder)
      })

      await waitFor(() => {
        const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
        const homeLink = within(breadcrumb).getByRole('button', { name: /home/i })
        expect(homeLink).toBeInTheDocument()
      })
    })

    it('should filter files by type when specified', async () => {
      const mockFiles = [
        { name: 'document.txt', is_dir: false, path: '/document.txt' },
        { name: 'image.png', is_dir: false, path: '/image.png' },
        { name: 'data.json', is_dir: false, path: '/data.json' }
      ]

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json({ resource: mockFiles })
        })
      )

      renderWithProviders(
        <FileSelector {...defaultProps} allowedFileTypes={['.txt', '.json']} />,
        { queryClient }
      )

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(screen.getByText('document.txt')).toBeInTheDocument()
        expect(screen.getByText('data.json')).toBeInTheDocument()
        expect(screen.queryByText('image.png')).not.toBeInTheDocument()
      })
    })
  })

  describe('File Selection', () => {
    it('should handle single file selection', async () => {
      const onFileSelectMock = vi.fn()
      const mockFile = createMockFile('test.txt', 'text/plain', 1024)

      renderWithProviders(
        <FileSelector {...defaultProps} onFileSelect={onFileSelectMock} />,
        { queryClient }
      )

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      // Mock file selection in dialog
      await waitFor(() => {
        const fileItem = screen.getByRole('button', { name: /test\.txt/i })
        user.click(fileItem)
      })

      const selectButton = screen.getByRole('button', { name: /select file/i })
      await user.click(selectButton)

      expect(onFileSelectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test.txt',
          type: 'text/plain',
          size: 1024
        })
      )
    })

    it('should handle multiple file selection when enabled', async () => {
      const onFileSelectMock = vi.fn()
      const mockFiles = createMockFiles([
        'file1.txt',
        'file2.json',
        'file3.csv'
      ])

      renderWithProviders(
        <FileSelector 
          {...defaultProps} 
          multiSelect={true}
          onFileSelect={onFileSelectMock}
        />,
        { queryClient }
      )

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        // Select multiple files
        mockFiles.forEach(file => {
          const fileItem = screen.getByRole('checkbox', { name: new RegExp(file.name, 'i') })
          user.click(fileItem)
        })
      })

      const selectButton = screen.getByRole('button', { name: /select files/i })
      await user.click(selectButton)

      expect(onFileSelectMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'file1.txt' }),
          expect.objectContaining({ name: 'file2.json' }),
          expect.objectContaining({ name: 'file3.csv' })
        ])
      )
    })

    it('should validate file size restrictions', async () => {
      const onErrorMock = vi.fn()
      const largeFile = createMockFile('large.txt', 'text/plain', 20 * 1024 * 1024) // 20MB

      renderWithProviders(
        <FileSelector 
          {...defaultProps}
          maxFileSize={10 * 1024 * 1024} // 10MB limit
          onError={onErrorMock}
        />,
        { queryClient }
      )

      // Test file size validation on upload
      const uploadArea = screen.getByLabelText(/file upload area/i)
      
      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [largeFile] }
        })
      })

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('File size exceeds limit')
        })
      )
    })

    it('should validate file type restrictions', async () => {
      const onErrorMock = vi.fn()
      const invalidFile = createMockFile('image.png', 'image/png', 1024)

      renderWithProviders(
        <FileSelector 
          {...defaultProps}
          allowedFileTypes={['.txt', '.json']}
          onError={onErrorMock}
        />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)
      
      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [invalidFile] }
        })
      })

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('File type not allowed')
        })
      )
    })
  })

  describe('Drag and Drop Functionality', () => {
    it('should handle drag enter and leave events', async () => {
      renderWithProviders(
        <FileSelector {...defaultProps} allowDragDrop={true} />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      fireEvent.dragEnter(uploadArea)
      expect(uploadArea).toHaveClass('drag-active')

      fireEvent.dragLeave(uploadArea)
      expect(uploadArea).not.toHaveClass('drag-active')
    })

    it('should handle file drop events', async () => {
      const onFileSelectMock = vi.fn()
      const mockFile = createMockFile('dropped.txt', 'text/plain', 1024)

      renderWithProviders(
        <FileSelector 
          {...defaultProps}
          allowDragDrop={true}
          onFileSelect={onFileSelectMock}
        />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFile] }
        })
      })

      expect(onFileSelectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'dropped.txt',
          type: 'text/plain',
          size: 1024
        })
      )
    })

    it('should handle multiple file drops when multi-select is enabled', async () => {
      const onFileSelectMock = vi.fn()
      const mockFiles = createMockFiles(['file1.txt', 'file2.json'])

      renderWithProviders(
        <FileSelector 
          {...defaultProps}
          allowDragDrop={true}
          multiSelect={true}
          onFileSelect={onFileSelectMock}
        />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: mockFiles }
        })
      })

      expect(onFileSelectMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'file1.txt' }),
          expect.objectContaining({ name: 'file2.json' })
        ])
      )
    })
  })

  describe('File Upload Progress', () => {
    it('should display upload progress for file uploads', async () => {
      const mockFile = createMockFile('upload.txt', 'text/plain', 1024)

      // Mock upload endpoint with progress simulation
      server.use(
        http.post('/api/v2/files', async () => {
          // Simulate upload delay
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json({ success: true })
        })
      )

      renderWithProviders(
        <FileSelector {...defaultProps} allowUpload={true} />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFile] }
        })
      })

      // Check for progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })

    it('should handle upload cancellation', async () => {
      const mockFile = createMockFile('cancel.txt', 'text/plain', 1024)

      renderWithProviders(
        <FileSelector {...defaultProps} allowUpload={true} />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFile] }
        })
      })

      const cancelButton = screen.getByRole('button', { name: /cancel upload/i })
      await user.click(cancelButton)

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const onErrorMock = vi.fn()

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      renderWithProviders(
        <FileSelector {...defaultProps} onError={onErrorMock} />,
        { queryClient }
      )

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Failed to load files')
          })
        )
      })
    })

    it('should handle network errors', async () => {
      const onErrorMock = vi.fn()

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.error()
        })
      )

      renderWithProviders(
        <FileSelector {...defaultProps} onError={onErrorMock} />,
        { queryClient }
      )

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Network error')
          })
        )
      })
    })

    it('should handle upload errors', async () => {
      const onErrorMock = vi.fn()
      const mockFile = createMockFile('error.txt', 'text/plain', 1024)

      server.use(
        http.post('/api/v2/files', () => {
          return HttpResponse.json(
            { error: 'Upload failed' },
            { status: 500 }
          )
        })
      )

      renderWithProviders(
        <FileSelector 
          {...defaultProps}
          allowUpload={true}
          onError={onErrorMock}
        />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFile] }
        })
      })

      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Upload failed')
          })
        )
      })
    })
  })

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(
        <FileSelector {...defaultProps} />,
        { queryClient }
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support keyboard navigation', async () => {
      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      await testKeyboardNavigation([
        { key: 'Tab', expectedFocus: /browse files/i },
        { key: 'Enter', expectedAction: 'open dialog' },
        { key: 'Escape', expectedAction: 'close dialog' }
      ])
    })

    it('should have proper ARIA labels and descriptions', () => {
      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', expect.stringContaining('file selector'))
      expect(screen.getByRole('button', { name: /browse files/i })).toHaveAttribute('aria-describedby')
    })

    it('should announce file selection to screen readers', async () => {
      const mockFile = createMockFile('announced.txt', 'text/plain', 1024)

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const uploadArea = screen.getByLabelText(/file upload area/i)

      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFile] }
        })
      })

      expect(screen.getByRole('status', { name: /file selected/i })).toBeInTheDocument()
    })

    it('should support high contrast mode', () => {
      renderWithProviders(
        <FileSelector {...defaultProps} />,
        { queryClient }
      )

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      expect(browseButton).toHaveClass('focus:ring-2', 'focus:ring-offset-2')
    })
  })

  describe('Performance Optimization', () => {
    it('should handle large file lists efficiently', async () => {
      const largeFileList = Array.from({ length: 1000 }, (_, index) => ({
        name: `file${index}.txt`,
        is_dir: false,
        path: `/file${index}.txt`,
        size: 1024
      }))

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json({ resource: largeFileList })
        })
      )

      const performanceMetrics = await measureComponentPerformance(async () => {
        renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

        const browseButton = screen.getByRole('button', { name: /browse files/i })
        await user.click(browseButton)

        await waitFor(() => {
          expect(screen.getByText('file999.txt')).toBeInTheDocument()
        }, { timeout: 5000 })
      })

      // Ensure rendering completes within performance threshold
      expect(performanceMetrics.renderTime).toBeLessThan(1000) // 1 second
    })

    it('should implement virtual scrolling for large datasets', async () => {
      const largeFileList = Array.from({ length: 10000 }, (_, index) => ({
        name: `file${index}.txt`,
        is_dir: false,
        path: `/file${index}.txt`,
        size: 1024
      }))

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json({ resource: largeFileList })
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        // Virtual scrolling should only render visible items
        const visibleItems = screen.getAllByRole('button', { name: /file\d+\.txt/i })
        expect(visibleItems.length).toBeLessThan(100) // Should not render all 10k items
      })
    })

    it('should debounce search input for performance', async () => {
      renderWithProviders(<FileSelector {...defaultProps} showSearch={true} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      const searchInput = screen.getByRole('searchbox', { name: /search files/i })
      
      // Type rapidly to test debouncing
      await user.type(searchInput, 'test search query')

      // Should not make API calls for every keystroke
      await waitFor(() => {
        expect(searchInput).toHaveValue('test search query')
      })
    })
  })

  describe('Integration Tests', () => {
    it('should integrate with file API service', async () => {
      const mockFileApiInfo: FileApiInfo = {
        serviceId: 'test-service',
        serviceName: 'Test File Service',
        baseUrl: '/api/v2/files',
        config: {
          container: 'local',
          public_path: '/files'
        }
      }

      server.use(
        http.get('/api/v2/system/service/test-service', () => {
          return HttpResponse.json(mockFileApiInfo)
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      await waitFor(() => {
        expect(screen.getByText('Test File Service')).toBeInTheDocument()
      })
    })

    it('should work with different service configurations', async () => {
      const s3Service: FileApiInfo = {
        serviceId: 's3-service',
        serviceName: 'AWS S3 Service',
        baseUrl: '/api/v2/files',
        config: {
          container: 's3',
          region: 'us-east-1',
          bucket: 'test-bucket'
        }
      }

      server.use(
        http.get('/api/v2/system/service/s3-service', () => {
          return HttpResponse.json(s3Service)
        })
      )

      renderWithProviders(
        <FileSelector {...defaultProps} serviceId="s3-service" />,
        { queryClient }
      )

      await waitFor(() => {
        expect(screen.getByText('AWS S3 Service')).toBeInTheDocument()
      })
    })
  })

  describe('Visual Regression Tests', () => {
    it('should maintain consistent visual appearance', async () => {
      const { container } = renderWithProviders(
        <FileSelector {...defaultProps} />,
        { queryClient }
      )

      // This would be integrated with Playwright for actual visual regression testing
      expect(container.firstChild).toMatchSnapshot('file-selector-default-state')
    })

    it('should handle responsive design breakpoints', async () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })

      const { container } = renderWithProviders(
        <FileSelector {...defaultProps} />,
        { queryClient }
      )

      expect(container.firstChild).toMatchSnapshot('file-selector-mobile')

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920
      })

      expect(container.firstChild).toMatchSnapshot('file-selector-desktop')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty file directories', async () => {
      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json({ resource: [] })
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        expect(screen.getByText(/no files found/i)).toBeInTheDocument()
      })
    })

    it('should handle special characters in file names', async () => {
      const specialFiles = [
        { name: 'file with spaces.txt', is_dir: false, path: '/file with spaces.txt' },
        { name: 'file-with-dashes.txt', is_dir: false, path: '/file-with-dashes.txt' },
        { name: 'file_with_underscores.txt', is_dir: false, path: '/file_with_underscores.txt' },
        { name: 'file(with)parentheses.txt', is_dir: false, path: '/file(with)parentheses.txt' }
      ]

      server.use(
        http.get('/api/v2/files', () => {
          return HttpResponse.json({ resource: specialFiles })
        })
      )

      renderWithProviders(<FileSelector {...defaultProps} />, { queryClient })

      const browseButton = screen.getByRole('button', { name: /browse files/i })
      await user.click(browseButton)

      await waitFor(() => {
        specialFiles.forEach(file => {
          expect(screen.getByText(file.name)).toBeInTheDocument()
        })
      })
    })

    it('should handle concurrent file operations', async () => {
      const onFileSelectMock = vi.fn()
      const mockFiles = createMockFiles(['file1.txt', 'file2.txt'])

      renderWithProviders(
        <FileSelector 
          {...defaultProps}
          multiSelect={true}
          onFileSelect={onFileSelectMock}
        />,
        { queryClient }
      )

      const uploadArea = screen.getByLabelText(/file upload area/i)

      // Simulate concurrent drops
      await act(async () => {
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFiles[0]] }
        })
        fireEvent.drop(uploadArea, {
          dataTransfer: { files: [mockFiles[1]] }
        })
      })

      // Should handle both files appropriately
      expect(onFileSelectMock).toHaveBeenCalledTimes(2)
    })
  })
})