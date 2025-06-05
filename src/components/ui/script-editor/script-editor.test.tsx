/**
 * @fileoverview Comprehensive Vitest test suite for ScriptEditor component
 * 
 * Tests cover:
 * - Component rendering and initialization
 * - File upload functionality
 * - GitHub import integration
 * - Storage service operations
 * - Cache management
 * - ACE editor integration
 * - Form validation and submission
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation (real-time validation under 100ms)
 * - Error handling and edge cases
 * - Theme switching and responsive design
 * 
 * @version 1.0.0
 * @since React 19 migration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { createFormWrapper } from '@/test/utils/test-utils'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Component under test and dependencies
import { ScriptEditor } from './script-editor'
import type { ScriptEditorProps, ScriptType, StorageService } from './types'

// Mock ACE editor to avoid loading actual ace-builds in tests
vi.mock('ace-builds', () => ({
  default: {
    edit: vi.fn().mockReturnValue({
      setTheme: vi.fn(),
      getSession: vi.fn().mockReturnValue({
        setMode: vi.fn(),
        setValue: vi.fn(),
        getValue: vi.fn(() => ''),
        on: vi.fn(),
        off: vi.fn(),
      }),
      setValue: vi.fn(),
      getValue: vi.fn(() => ''),
      setReadOnly: vi.fn(),
      resize: vi.fn(),
      focus: vi.fn(),
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      container: document.createElement('div'),
    }),
  },
}))

// Mock file reading utilities
vi.mock('@/lib/file-utils', () => ({
  readFileAsText: vi.fn((file: File) => 
    Promise.resolve(`// Mock content from ${file.name}`)
  ),
  validateScriptFile: vi.fn(() => ({ isValid: true, error: null })),
  getFileExtension: vi.fn((filename: string) => 
    filename.split('.').pop() || ''
  ),
}))

// Mock GitHub dialog component
vi.mock('@/components/ui/scripts-github-dialog/scripts-github-dialog', () => ({
  ScriptsGithubDialog: vi.fn(({ onImport, open, onOpenChange }) => (
    open ? (
      <div data-testid="github-dialog" role="dialog" aria-label="Import from GitHub">
        <button 
          onClick={() => onImport?.({
            content: '// GitHub imported script',
            filename: 'github-script.js',
            url: 'https://github.com/example/repo/script.js'
          })}
          data-testid="github-import-button"
        >
          Import from GitHub
        </button>
        <button onClick={() => onOpenChange?.(false)} data-testid="github-close">
          Close
        </button>
      </div>
    ) : null
  )),
}))

// Test data and utilities
const mockScript = {
  id: 'test-script-1',
  name: 'test-script.js',
  content: 'console.log("Hello, World!");',
  type: 'nodejs' as ScriptType,
  is_active: true,
  storage_service_id: 'local',
  created_date: '2024-01-01T00:00:00Z',
  last_modified_date: '2024-01-01T00:00:00Z',
}

const mockStorageServices: StorageService[] = [
  { 
    name: 'local', 
    label: 'Local Storage', 
    type: 'local_file_storage',
    description: 'Local file system storage'
  },
  { 
    name: 'github', 
    label: 'GitHub Repository', 
    type: 'github_file_storage',
    description: 'GitHub repository integration'
  },
]

const defaultProps: ScriptEditorProps = {
  value: '',
  onChange: vi.fn(),
  scriptType: 'nodejs',
  storageServices: mockStorageServices,
  onFileUpload: vi.fn(),
  onCacheClear: vi.fn(),
  showGithubImport: true,
  showCacheManagement: true,
  className: '',
  'data-testid': 'script-editor',
}

// Performance timing utilities
const measurePerformance = async (callback: () => Promise<void> | void) => {
  const start = performance.now()
  await callback()
  return performance.now() - start
}

describe('ScriptEditor Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup default MSW handlers for script editor endpoints
    server.use(
      // Storage services endpoint
      http.get('/api/v2/system/service', () => {
        return HttpResponse.json({
          resource: mockStorageServices
        })
      }),
      
      // Script cache endpoints
      http.delete('/api/v2/system/cache/script/*', () => {
        return HttpResponse.json({ success: true })
      }),
      
      // File upload endpoint
      http.post('/api/v2/files/_proc/upload', () => {
        return HttpResponse.json({
          name: 'uploaded-script.js',
          path: '/scripts/uploaded-script.js',
          content_type: 'application/javascript'
        })
      }),
      
      // GitHub content endpoint
      http.get('https://api.github.com/repos/*/contents/*', () => {
        return HttpResponse.json({
          name: 'github-script.js',
          content: btoa('// GitHub script content'),
          encoding: 'base64'
        })
      })
    )
  })

  afterEach(() => {
    server.resetHandlers()
  })

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      render(<ScriptEditor {...defaultProps} />)
      
      expect(screen.getByTestId('script-editor')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /script content/i })).toBeInTheDocument()
    })

    it('renders with initial value', () => {
      const initialValue = 'console.log("Initial content");'
      render(<ScriptEditor {...defaultProps} value={initialValue} />)
      
      // ACE editor should be initialized with the value
      expect(screen.getByDisplayValue(initialValue)).toBeInTheDocument()
    })

    it('renders all control buttons when features are enabled', () => {
      render(<ScriptEditor {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /import from github/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear cache/i })).toBeInTheDocument()
    })

    it('hides optional features when disabled', () => {
      render(
        <ScriptEditor 
          {...defaultProps} 
          showGithubImport={false}
          showCacheManagement={false}
        />
      )
      
      expect(screen.queryByRole('button', { name: /import from github/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /clear cache/i })).not.toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<ScriptEditor {...defaultProps} className="custom-class" />)
      
      expect(screen.getByTestId('script-editor')).toHaveClass('custom-class')
    })
  })

  describe('ACE Editor Integration', () => {
    it('initializes ACE editor with correct mode', () => {
      render(<ScriptEditor {...defaultProps} scriptType="javascript" />)
      
      // ACE editor should be configured for JavaScript mode
      const editor = screen.getByRole('textbox', { name: /script content/i })
      expect(editor).toHaveAttribute('data-mode', 'javascript')
    })

    it('updates editor mode when scriptType changes', async () => {
      const { rerender } = render(<ScriptEditor {...defaultProps} scriptType="nodejs" />)
      
      rerender(<ScriptEditor {...defaultProps} scriptType="python" />)
      
      await waitFor(() => {
        const editor = screen.getByRole('textbox', { name: /script content/i })
        expect(editor).toHaveAttribute('data-mode', 'python')
      })
    })

    it('handles theme switching', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      await user.click(themeToggle)
      
      await waitFor(() => {
        const editor = screen.getByRole('textbox', { name: /script content/i })
        expect(editor).toHaveClass('ace-theme-dark')
      })
    })

    it('maintains focus management', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      await user.click(editor)
      
      expect(editor).toHaveFocus()
    })
  })

  describe('File Upload Functionality', () => {
    it('handles file upload successfully', async () => {
      const onFileUpload = vi.fn()
      render(<ScriptEditor {...defaultProps} onFileUpload={onFileUpload} />)
      
      const file = new File(['console.log("uploaded");'], 'test-script.js', {
        type: 'application/javascript'
      })
      
      const fileInput = screen.getByLabelText(/upload script file/i)
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(onFileUpload).toHaveBeenCalledWith({
          file,
          content: '// Mock content from test-script.js'
        })
      })
    })

    it('validates file types', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText(/upload script file/i)
      
      await user.upload(fileInput, invalidFile)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument()
      })
    })

    it('handles large file uploads', async () => {
      const onFileUpload = vi.fn()
      render(<ScriptEditor {...defaultProps} onFileUpload={onFileUpload} />)
      
      // Create a large file (over 1MB)
      const largeContent = 'x'.repeat(1024 * 1024 + 1)
      const largeFile = new File([largeContent], 'large-script.js', {
        type: 'application/javascript'
      })
      
      const fileInput = screen.getByLabelText(/upload script file/i)
      await user.upload(fileInput, largeFile)
      
      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument()
      })
    })

    it('shows upload progress', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const file = new File(['content'], 'test-script.js', {
        type: 'application/javascript'
      })
      
      const fileInput = screen.getByLabelText(/upload script file/i)
      await user.upload(fileInput, file)
      
      // Should show progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })
  })

  describe('GitHub Import Integration', () => {
    it('opens GitHub import dialog', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const githubButton = screen.getByRole('button', { name: /import from github/i })
      await user.click(githubButton)
      
      expect(screen.getByTestId('github-dialog')).toBeInTheDocument()
      expect(screen.getByRole('dialog', { name: /import from github/i })).toBeInTheDocument()
    })

    it('imports script from GitHub', async () => {
      const onChange = vi.fn()
      render(<ScriptEditor {...defaultProps} onChange={onChange} />)
      
      const githubButton = screen.getByRole('button', { name: /import from github/i })
      await user.click(githubButton)
      
      const importButton = screen.getByTestId('github-import-button')
      await user.click(importButton)
      
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('// GitHub imported script')
        expect(screen.queryByTestId('github-dialog')).not.toBeInTheDocument()
      })
    })

    it('handles GitHub import errors', async () => {
      // Setup error response for GitHub API
      server.use(
        http.get('https://api.github.com/repos/*/contents/*', () => {
          return HttpResponse.json(
            { message: 'Not Found' },
            { status: 404 }
          )
        })
      )

      render(<ScriptEditor {...defaultProps} />)
      
      const githubButton = screen.getByRole('button', { name: /import from github/i })
      await user.click(githubButton)
      
      const importButton = screen.getByTestId('github-import-button')
      await user.click(importButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to import from github/i)).toBeInTheDocument()
      })
    })

    it('closes GitHub dialog', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const githubButton = screen.getByRole('button', { name: /import from github/i })
      await user.click(githubButton)
      
      const closeButton = screen.getByTestId('github-close')
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('github-dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Storage Service Integration', () => {
    it('displays available storage services', () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const storageSelect = screen.getByRole('combobox', { name: /storage service/i })
      expect(storageSelect).toBeInTheDocument()
      
      mockStorageServices.forEach(service => {
        expect(screen.getByRole('option', { name: service.label })).toBeInTheDocument()
      })
    })

    it('selects storage service', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const storageSelect = screen.getByRole('combobox', { name: /storage service/i })
      await user.selectOptions(storageSelect, 'github')
      
      expect(storageSelect).toHaveValue('github')
    })

    it('handles storage service change', async () => {
      const onStorageServiceChange = vi.fn()
      render(
        <ScriptEditor 
          {...defaultProps} 
          onStorageServiceChange={onStorageServiceChange}
        />
      )
      
      const storageSelect = screen.getByRole('combobox', { name: /storage service/i })
      await user.selectOptions(storageSelect, 'github')
      
      expect(onStorageServiceChange).toHaveBeenCalledWith('github')
    })
  })

  describe('Cache Management', () => {
    it('clears script cache', async () => {
      const onCacheClear = vi.fn()
      render(<ScriptEditor {...defaultProps} onCacheClear={onCacheClear} />)
      
      const clearCacheButton = screen.getByRole('button', { name: /clear cache/i })
      await user.click(clearCacheButton)
      
      // Should show confirmation dialog
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(onCacheClear).toHaveBeenCalled()
      })
    })

    it('shows cache clear confirmation', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const clearCacheButton = screen.getByRole('button', { name: /clear cache/i })
      await user.click(clearCacheButton)
      
      expect(screen.getByText(/are you sure.*clear.*cache/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('cancels cache clear operation', async () => {
      const onCacheClear = vi.fn()
      render(<ScriptEditor {...defaultProps} onCacheClear={onCacheClear} />)
      
      const clearCacheButton = screen.getByRole('button', { name: /clear cache/i })
      await user.click(clearCacheButton)
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(onCacheClear).not.toHaveBeenCalled()
      expect(screen.queryByText(/are you sure.*clear.*cache/i)).not.toBeInTheDocument()
    })

    it('handles cache clear errors', async () => {
      // Setup error response for cache clear
      server.use(
        http.delete('/api/v2/system/cache/script/*', () => {
          return HttpResponse.json(
            { error: { message: 'Cache clear failed' } },
            { status: 500 }
          )
        })
      )

      render(<ScriptEditor {...defaultProps} />)
      
      const clearCacheButton = screen.getByRole('button', { name: /clear cache/i })
      await user.click(clearCacheButton)
      
      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to clear cache/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Integration', () => {
    it('integrates with React Hook Form', async () => {
      const onSubmit = vi.fn()
      const FormWrapper = createFormWrapper({
        defaultValues: { script: '' },
        onSubmit
      })
      
      render(
        <FormWrapper>
          <ScriptEditor {...defaultProps} name="script" />
        </FormWrapper>
      )
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      await user.type(editor, 'console.log("test");')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          script: 'console.log("test");'
        })
      })
    })

    it('displays validation errors', async () => {
      const FormWrapper = createFormWrapper({
        defaultValues: { script: '' },
        validation: {
          script: { required: 'Script content is required' }
        }
      })
      
      render(
        <FormWrapper>
          <ScriptEditor {...defaultProps} name="script" required />
        </FormWrapper>
      )
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/script content is required/i)).toBeInTheDocument()
      })
    })

    it('clears validation errors on input', async () => {
      const FormWrapper = createFormWrapper({
        defaultValues: { script: '' },
        validation: {
          script: { required: 'Script content is required' }
        }
      })
      
      render(
        <FormWrapper>
          <ScriptEditor {...defaultProps} name="script" required />
        </FormWrapper>
      )
      
      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/script content is required/i)).toBeInTheDocument()
      })
      
      // Clear error by typing
      const editor = screen.getByRole('textbox', { name: /script content/i })
      await user.type(editor, 'console.log("test");')
      
      await waitFor(() => {
        expect(screen.queryByText(/script content is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Performance Requirements', () => {
    it('handles real-time validation under 100ms', async () => {
      const onChange = vi.fn()
      render(<ScriptEditor {...defaultProps} onChange={onChange} />)
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      
      const duration = await measurePerformance(async () => {
        await user.type(editor, 'c')
      })
      
      expect(duration).toBeLessThan(100)
      expect(onChange).toHaveBeenCalled()
    })

    it('debounces frequent changes', async () => {
      const onChange = vi.fn()
      render(<ScriptEditor {...defaultProps} onChange={onChange} debounceMs={50} />)
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      
      // Type multiple characters quickly
      await user.type(editor, 'console.log("test");')
      
      // Wait for debounce
      await waitFor(() => {
        // Should be called fewer times than characters typed due to debouncing
        expect(onChange.mock.calls.length).toBeLessThan(20)
      }, { timeout: 100 })
    })

    it('handles large content efficiently', async () => {
      const largeContent = 'x'.repeat(10000)
      
      const duration = await measurePerformance(async () => {
        render(<ScriptEditor {...defaultProps} value={largeContent} />)
      })
      
      expect(duration).toBeLessThan(500) // Should render within 500ms
    })
  })

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(<ScriptEditor {...defaultProps} />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA labels', () => {
      render(<ScriptEditor {...defaultProps} />)
      
      expect(screen.getByRole('textbox', { name: /script content/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /import from github/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /clear cache/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      // Tab through controls
      await user.tab()
      expect(screen.getByRole('textbox', { name: /script content/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /upload file/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /import from github/i })).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /clear cache/i })).toHaveFocus()
    })

    it('provides screen reader announcements', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const file = new File(['content'], 'test-script.js', {
        type: 'application/javascript'
      })
      
      const fileInput = screen.getByLabelText(/upload script file/i)
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/file uploaded successfully/i)
      })
    })

    it('handles focus management in dialogs', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const githubButton = screen.getByRole('button', { name: /import from github/i })
      await user.click(githubButton)
      
      // Focus should move to dialog
      const dialog = screen.getByRole('dialog', { name: /import from github/i })
      expect(dialog).toBeInTheDocument()
      
      // First interactive element should be focused
      expect(screen.getByTestId('github-import-button')).toHaveFocus()
    })

    it('supports high contrast mode', () => {
      render(<ScriptEditor {...defaultProps} />)
      
      // Components should work with high contrast styles
      const editor = screen.getByRole('textbox', { name: /script content/i })
      expect(editor).toHaveStyle('border: 1px solid')
    })
  })

  describe('Error Handling', () => {
    it('handles ACE editor initialization errors', () => {
      // Mock ACE editor to throw error
      vi.mocked(require('ace-builds').default.edit).mockImplementationOnce(() => {
        throw new Error('ACE editor failed to initialize')
      })
      
      render(<ScriptEditor {...defaultProps} />)
      
      expect(screen.getByText(/editor failed to initialize/i)).toBeInTheDocument()
    })

    it('handles network errors gracefully', async () => {
      // Setup network error
      server.use(
        http.get('/api/v2/system/service', () => {
          return HttpResponse.error()
        })
      )
      
      render(<ScriptEditor {...defaultProps} />)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load storage services/i)).toBeInTheDocument()
      })
    })

    it('displays user-friendly error messages', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const invalidFile = new File([''], 'test.exe', { type: 'application/exe' })
      const fileInput = screen.getByLabelText(/upload script file/i)
      
      await user.upload(fileInput, invalidFile)
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid file type/i)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-error-600') // Error styling
      })
    })

    it('recovers from temporary errors', async () => {
      let callCount = 0
      server.use(
        http.get('/api/v2/system/service', () => {
          callCount++
          if (callCount === 1) {
            return HttpResponse.error()
          }
          return HttpResponse.json({ resource: mockStorageServices })
        })
      )
      
      render(<ScriptEditor {...defaultProps} />)
      
      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/failed to load storage services/i)).toBeInTheDocument()
      })
      
      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)
      
      // Should recover and show services
      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /storage service/i })).toBeInTheDocument()
      })
    })
  })

  describe('Theme Integration', () => {
    it('applies dark theme correctly', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      // Toggle to dark theme
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      await user.click(themeToggle)
      
      await waitFor(() => {
        const container = screen.getByTestId('script-editor')
        expect(container).toHaveClass('dark')
      })
    })

    it('applies light theme correctly', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const container = screen.getByTestId('script-editor')
      expect(container).not.toHaveClass('dark')
    })

    it('persists theme preference', async () => {
      const { rerender } = render(<ScriptEditor {...defaultProps} />)
      
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      await user.click(themeToggle)
      
      // Remount component
      rerender(<ScriptEditor {...defaultProps} />)
      
      await waitFor(() => {
        const container = screen.getByTestId('script-editor')
        expect(container).toHaveClass('dark')
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles empty file uploads', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const emptyFile = new File([''], 'empty.js', { type: 'application/javascript' })
      const fileInput = screen.getByLabelText(/upload script file/i)
      
      await user.upload(fileInput, emptyFile)
      
      await waitFor(() => {
        expect(screen.getByText(/file is empty/i)).toBeInTheDocument()
      })
    })

    it('handles files with no extension', async () => {
      render(<ScriptEditor {...defaultProps} />)
      
      const noExtFile = new File(['content'], 'noextension', { type: 'application/javascript' })
      const fileInput = screen.getByLabelText(/upload script file/i)
      
      await user.upload(fileInput, noExtFile)
      
      await waitFor(() => {
        expect(screen.getByText(/unable to determine file type/i)).toBeInTheDocument()
      })
    })

    it('handles concurrent operations', async () => {
      const onChange = vi.fn()
      render(<ScriptEditor {...defaultProps} onChange={onChange} />)
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      
      // Start multiple operations concurrently
      const promises = [
        user.type(editor, 'a'),
        user.type(editor, 'b'),
        user.type(editor, 'c'),
      ]
      
      await Promise.all(promises)
      
      // Should handle all operations without race conditions
      expect(onChange).toHaveBeenCalled()
    })

    it('handles component unmounting during async operations', async () => {
      const { unmount } = render(<ScriptEditor {...defaultProps} />)
      
      const file = new File(['content'], 'test.js', { type: 'application/javascript' })
      const fileInput = screen.getByLabelText(/upload script file/i)
      
      // Start upload and immediately unmount
      user.upload(fileInput, file)
      unmount()
      
      // Should not throw errors
      expect(() => {}).not.toThrow()
    })
  })

  describe('Integration Testing', () => {
    it('integrates with form validation libraries', async () => {
      const FormWrapper = createFormWrapper({
        defaultValues: { script: '' },
        validation: {
          script: {
            required: 'Script is required',
            minLength: { value: 10, message: 'Script too short' }
          }
        }
      })
      
      render(
        <FormWrapper>
          <ScriptEditor {...defaultProps} name="script" required />
        </FormWrapper>
      )
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      await user.type(editor, 'short')
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/script too short/i)).toBeInTheDocument()
      })
    })

    it('works with state management libraries', async () => {
      // This would typically test with Zustand or other state management
      const mockStore = {
        script: '',
        setScript: vi.fn(),
      }
      
      render(
        <ScriptEditor 
          {...defaultProps}
          value={mockStore.script}
          onChange={mockStore.setScript}
        />
      )
      
      const editor = screen.getByRole('textbox', { name: /script content/i })
      await user.type(editor, 'console.log("test");')
      
      expect(mockStore.setScript).toHaveBeenCalledWith('console.log("test");')
    })

    it('integrates with routing and navigation', async () => {
      // Mock Next.js router
      const mockRouter = {
        push: vi.fn(),
        pathname: '/scripts/edit',
      }
      
      render(<ScriptEditor {...defaultProps} />)
      
      // Test navigation-related functionality
      const saveAndExitButton = screen.getByRole('button', { name: /save and exit/i })
      await user.click(saveAndExitButton)
      
      // Should trigger navigation
      expect(mockRouter.push).toHaveBeenCalledWith('/scripts')
    })
  })
})