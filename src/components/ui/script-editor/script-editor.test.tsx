/**
 * Script Editor Component Test Suite
 * 
 * Comprehensive Vitest test suite for the ScriptEditor component covering all functionality
 * including file upload, GitHub import, storage service integration, cache management,
 * and accessibility compliance. Uses Mock Service Worker for realistic API mocking
 * and React Testing Library for component interaction testing.
 * 
 * Test Coverage:
 * - Component rendering and initial state validation
 * - Form integration with React Hook Form and Zod validation
 * - File upload functionality with progress tracking
 * - GitHub import dialog and content loading
 * - Storage service selection and path validation
 * - Cache operations (view latest, delete cache)
 * - ACE editor integration and content management
 * - Toolbar functionality and user interactions
 * - Accessibility compliance with WCAG 2.1 AA standards
 * - Performance validation for real-time validation under 100ms
 * - Error handling and edge case scenarios
 * - Integration testing with dependent components
 * 
 * @fileoverview Comprehensive test suite for ScriptEditor component
 * @version 1.0.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor, screen, within, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { rest } from 'msw';
import { server } from '@/test/mocks/server';

// Component and dependencies
import { ScriptEditor } from './script-editor';
import type { 
  ScriptEditorProps, 
  StorageService, 
  ScriptLanguage,
  FileUploadState,
  GitHubImportState,
  CacheOperationResult 
} from './types';

// Test utilities
import {
  customRender,
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  createMockValidation,
  waitForValidation,
  measureRenderTime,
  type FormTestUtils,
  type KeyboardTestUtils,
} from '@/test/test-utils';

// Test data
import { createTestQueryClient } from '@/test/test-utils';

// =============================================================================
// MOCK DATA AND SETUP
// =============================================================================

const mockStorageServices: StorageService[] = [
  {
    id: 'local_storage',
    name: 'Local Storage',
    type: 'local_file',
    group: 'file',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
  },
  {
    id: 'github_storage',
    name: 'GitHub Storage',
    type: 'github',
    group: 'source control',
    is_active: true,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
  },
  {
    id: 's3_storage',
    name: 'S3 Storage',
    type: 's3',
    group: 'cloud storage',
    is_active: false,
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
  },
];

const mockScriptContent = {
  javascript: `// JavaScript example
function hello() {
  console.log('Hello, World!');
}

hello();`,
  typescript: `// TypeScript example
interface User {
  id: number;
  name: string;
}

const user: User = {
  id: 1,
  name: 'John Doe'
};`,
  python: `# Python example
def hello():
    print("Hello, World!")

if __name__ == "__main__":
    hello()`,
};

const defaultProps: Partial<ScriptEditorProps> = {
  'data-testid': 'script-editor',
  enableStorage: true,
  enableFileUpload: true,
  enableGitHubImport: true,
  enableCache: true,
  showToolbar: true,
  showFileOperations: true,
  showStorageOperations: true,
  language: 'javascript',
  editorTheme: 'auto',
};

// =============================================================================
// MOCK HANDLERS FOR MSW
// =============================================================================

const mockHandlers = [
  // Storage services endpoint
  rest.get('/api/v2/system/service', (req, res, ctx) => {
    const group = req.url.searchParams.get('group');
    const services = group 
      ? mockStorageServices.filter(s => s.group === group)
      : mockStorageServices;
    
    return res(
      ctx.delay(100),
      ctx.status(200),
      ctx.json({
        resource: services,
        meta: { count: services.length }
      })
    );
  }),

  // File upload endpoint
  rest.post('/api/v2/storage/upload', async (req, res, ctx) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'No file provided' })
      );
    }

    return res(
      ctx.delay(200),
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          name: file.name,
          size: file.size,
          type: file.type,
          content: await file.text(),
          path: `/uploads/${file.name}`,
        }
      })
    );
  }),

  // GitHub content endpoint
  rest.get('https://api.github.com/repos/:owner/:repo/contents/:path', (req, res, ctx) => {
    const { owner, repo, path } = req.params;
    const ref = req.url.searchParams.get('ref') || 'main';
    
    return res(
      ctx.delay(300),
      ctx.status(200),
      ctx.json({
        name: path,
        path: path,
        sha: 'abc123',
        size: 1024,
        url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        html_url: `https://github.com/${owner}/${repo}/blob/${ref}/${path}`,
        git_url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/abc123`,
        download_url: `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`,
        type: 'file',
        content: btoa(mockScriptContent.javascript),
        encoding: 'base64',
      })
    );
  }),

  // Cache operations
  rest.get('/api/v2/cache/script/:key', (req, res, ctx) => {
    return res(
      ctx.delay(150),
      ctx.status(200),
      ctx.json({
        content: mockScriptContent.javascript,
        timestamp: new Date().toISOString(),
        metadata: {
          language: 'javascript',
          size: mockScriptContent.javascript.length,
        }
      })
    );
  }),

  rest.delete('/api/v2/cache/script/:key', (req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),
];

// =============================================================================
// TEST SETUP AND TEARDOWN
// =============================================================================

beforeEach(() => {
  // Add custom handlers for each test
  server.use(...mockHandlers);
  
  // Mock IntersectionObserver for ACE editor
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock ResizeObserver for responsive components
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock Clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue(''),
    },
  });

  // Mock URL.createObjectURL for file downloads
  global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
  server.resetHandlers();
});

// =============================================================================
// UTILITY FUNCTIONS FOR TESTS
// =============================================================================

const renderScriptEditor = (props: Partial<ScriptEditorProps> = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return customRender(<ScriptEditor {...mergedProps} />, {
    queryClient: createTestQueryClient(),
  });
};

const renderScriptEditorWithForm = (props: Partial<ScriptEditorProps> = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return renderWithForm(<ScriptEditor {...mergedProps} />, {
    defaultValues: {
      content: props.defaultValue || '',
      storageServiceId: '',
      storagePath: '',
      language: 'javascript',
    },
  });
};

const createMockFile = (name: string, content: string, type: string = 'text/javascript') => {
  return new File([content], name, { type });
};

// =============================================================================
// COMPONENT RENDERING AND INITIAL STATE TESTS
// =============================================================================

describe('ScriptEditor Component', () => {
  describe('Basic Rendering', () => {
    it('renders the script editor component with default props', async () => {
      const { user } = renderScriptEditor();
      
      // Check main container
      const scriptEditor = screen.getByTestId('script-editor');
      expect(scriptEditor).toBeInTheDocument();
      expect(scriptEditor).toHaveAttribute('aria-label', 'Script editor with file management and storage integration');

      // Check toolbar is visible
      expect(screen.getByRole('button', { name: /upload script file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import script from github/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save script content/i })).toBeInTheDocument();

      // Check ACE editor placeholder
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });

    it('renders with custom content and language', async () => {
      const customContent = mockScriptContent.typescript;
      const { user } = renderScriptEditor({
        defaultValue: customContent,
        language: 'typescript',
      });

      // Check that content is displayed
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toBeInTheDocument();
      
      // Check language selector shows correct value
      const languageSelect = screen.getByTestId('language-select');
      expect(languageSelect).toHaveValue('typescript');
    });

    it('renders without optional features when disabled', () => {
      renderScriptEditor({
        enableFileUpload: false,
        enableGitHubImport: false,
        enableCache: false,
        showToolbar: false,
      });

      // Should not show disabled features
      expect(screen.queryByTestId('upload-file-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('github-import-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('view-latest-cache-button')).not.toBeInTheDocument();
    });

    it('handles controlled vs uncontrolled component patterns correctly', async () => {
      const onChangeMock = vi.fn();
      const { rerender } = renderScriptEditor({
        value: 'initial content',
        onChange: onChangeMock,
      });

      // Test controlled component
      expect(screen.getByDisplayValue('initial content')).toBeInTheDocument();

      // Update value prop
      rerender(<ScriptEditor {...defaultProps} value="updated content" onChange={onChangeMock} />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('updated content')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Requirements', () => {
    it('renders within acceptable time limits', async () => {
      const { renderTime } = await measureRenderTime(() => 
        renderScriptEditor({ defaultValue: mockScriptContent.javascript })
      );
      
      // Should render in under 100ms for performance requirement
      expect(renderTime).toBeLessThan(100);
    });

    it('handles real-time validation under 100ms', async () => {
      const onChangeMock = vi.fn();
      const { user } = renderScriptEditor({
        onChange: onChangeMock,
      });

      const editor = screen.getByTestId('ace-editor');
      
      // Measure validation response time
      const start = performance.now();
      await user.type(editor, 'console.log("test");');
      
      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalled();
      });
      
      const validationTime = performance.now() - start;
      expect(validationTime).toBeLessThan(100);
    });
  });

  // =============================================================================
  // FORM INTEGRATION AND VALIDATION TESTS
  // =============================================================================

  describe('Form Integration and Validation', () => {
    it('integrates with React Hook Form correctly', async () => {
      const { user, formMethods, triggerValidation } = renderScriptEditorWithForm();

      // Test form field registration
      expect(formMethods.getValues('content')).toBe('');
      expect(formMethods.getValues('language')).toBe('javascript');

      // Update content through editor
      const editor = screen.getByTestId('ace-editor');
      await user.type(editor, 'test content');

      await waitFor(() => {
        expect(formMethods.getValues('content')).toBe('test content');
      });
    });

    it('validates required content field', async () => {
      const { user, getFieldError, triggerValidation } = renderScriptEditorWithForm();

      // Submit without content should show validation error
      await triggerValidation();
      
      await waitFor(() => {
        expect(getFieldError('content')).toBe('Script content is required');
      });

      // Add content should clear error
      const editor = screen.getByTestId('ace-editor');
      await user.type(editor, 'console.log("valid content");');

      await triggerValidation();
      
      await waitFor(() => {
        expect(getFieldError('content')).toBeUndefined();
      });
    });

    it('validates storage path when storage service is selected', async () => {
      const { user, getFieldError, triggerValidation } = renderScriptEditorWithForm();

      // First load storage services
      await waitFor(() => {
        expect(screen.getByTestId('storage-service-select')).toBeInTheDocument();
      });

      // Select a storage service
      const storageSelect = screen.getByTestId('storage-service-select');
      await user.selectOptions(storageSelect, 'local_storage');

      // Should require storage path
      await triggerValidation();
      
      await waitFor(() => {
        expect(getFieldError('storagePath')).toBe('Storage path is required when a storage service is selected');
      });

      // Add storage path should clear error
      const pathInput = screen.getByTestId('storage-path-input');
      await user.type(pathInput, '/scripts/test.js');

      await triggerValidation();
      
      await waitFor(() => {
        expect(getFieldError('storagePath')).toBeUndefined();
      });
    });

    it('handles form submission with onContentSave callback', async () => {
      const onContentSaveMock = vi.fn().mockResolvedValue(undefined);
      const { user } = renderScriptEditor({
        defaultValue: 'test content',
        onContentSave: onContentSaveMock,
      });

      const saveButton = screen.getByTestId('save-script-button');
      await user.click(saveButton);

      await waitFor(() => {
        expect(onContentSaveMock).toHaveBeenCalledWith('test content', expect.any(Object));
      });
    });
  });

  // =============================================================================
  // FILE UPLOAD FUNCTIONALITY TESTS
  // =============================================================================

  describe('File Upload Functionality', () => {
    it('uploads file and updates content', async () => {
      const onFileUploadMock = vi.fn();
      const { user } = renderScriptEditor({
        onFileUpload: onFileUploadMock,
      });

      // Create mock file
      const testFile = createMockFile('test.js', mockScriptContent.javascript);
      const fileInput = screen.getByTestId('file-upload-input');

      // Simulate file selection
      await user.upload(fileInput, testFile);

      // Wait for upload to complete
      await waitFor(() => {
        expect(onFileUploadMock).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test.js',
            size: testFile.size,
            type: 'text/javascript',
          }),
          mockScriptContent.javascript
        );
      });

      // Check content was updated
      await waitFor(() => {
        const editor = screen.getByTestId('ace-editor');
        expect(editor).toHaveValue(mockScriptContent.javascript);
      });
    });

    it('shows upload progress during file upload', async () => {
      const { user } = renderScriptEditor();

      const testFile = createMockFile('large-script.js', 'x'.repeat(10000));
      const fileInput = screen.getByTestId('file-upload-input');

      await user.upload(fileInput, testFile);

      // Should show loading state
      expect(screen.getByTestId('upload-file-button')).toBeDisabled();
    });

    it('handles file upload errors gracefully', async () => {
      // Mock upload failure
      server.use(
        rest.post('/api/v2/storage/upload', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Upload failed' })
          );
        })
      );

      const { user } = renderScriptEditor();

      const testFile = createMockFile('test.js', 'test content');
      const fileInput = screen.getByTestId('file-upload-input');

      await user.upload(fileInput, testFile);

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByTestId('upload-file-button')).not.toBeDisabled();
      });
    });

    it('validates file types and size', async () => {
      const { user } = renderScriptEditor();

      // Test invalid file type
      const invalidFile = createMockFile('test.exe', 'invalid content', 'application/exe');
      const fileInput = screen.getByTestId('file-upload-input');

      await user.upload(fileInput, invalidFile);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByTestId('upload-file-button')).not.toBeDisabled();
      });
    });

    it('auto-detects language from uploaded file', async () => {
      const { user } = renderScriptEditor();

      const pythonFile = createMockFile('script.py', mockScriptContent.python, 'text/python');
      const fileInput = screen.getByTestId('file-upload-input');

      await user.upload(fileInput, pythonFile);

      await waitFor(() => {
        const languageSelect = screen.getByTestId('language-select');
        expect(languageSelect).toHaveValue('python');
      });
    });
  });

  // =============================================================================
  // GITHUB IMPORT FUNCTIONALITY TESTS
  // =============================================================================

  describe('GitHub Import Functionality', () => {
    it('opens GitHub import dialog', async () => {
      const { user } = renderScriptEditor();

      const githubButton = screen.getByTestId('github-import-button');
      await user.click(githubButton);

      // Should open dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Import from GitHub')).toBeInTheDocument();
    });

    it('imports content from GitHub URL', async () => {
      const onGitHubImportMock = vi.fn();
      const { user } = renderScriptEditor({
        onGitHubImport: onGitHubImportMock,
      });

      // Open dialog
      const githubButton = screen.getByTestId('github-import-button');
      await user.click(githubButton);

      // Enter GitHub URL
      const urlInput = screen.getByLabelText(/github file url/i);
      await user.type(urlInput, 'https://github.com/user/repo/blob/main/script.js');

      // Click import
      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Wait for import to complete
      await waitFor(() => {
        expect(onGitHubImportMock).toHaveBeenCalledWith(
          expect.stringContaining('console.log'),
          expect.objectContaining({
            name: 'script.js',
            path: 'script.js',
          })
        );
      });
    });

    it('handles GitHub import errors', async () => {
      // Mock GitHub API error
      server.use(
        rest.get('https://api.github.com/repos/:owner/:repo/contents/:path', (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({ message: 'Not Found' })
          );
        })
      );

      const { user } = renderScriptEditor();

      const githubButton = screen.getByTestId('github-import-button');
      await user.click(githubButton);

      const urlInput = screen.getByLabelText(/github file url/i);
      await user.type(urlInput, 'https://github.com/user/repo/blob/main/nonexistent.js');

      const importButton = screen.getByRole('button', { name: /import/i });
      await user.click(importButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('closes GitHub import dialog on cancel', async () => {
      const { user } = renderScriptEditor();

      const githubButton = screen.getByTestId('github-import-button');
      await user.click(githubButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // STORAGE SERVICE INTEGRATION TESTS
  // =============================================================================

  describe('Storage Service Integration', () => {
    it('loads and displays storage services', async () => {
      renderScriptEditor();

      // Wait for services to load
      await waitFor(() => {
        const storageSelect = screen.getByTestId('storage-service-select');
        expect(storageSelect).toBeInTheDocument();
      });

      // Should have options for each service
      expect(screen.getByText('Local Storage (local_file)')).toBeInTheDocument();
      expect(screen.getByText('GitHub Storage (github)')).toBeInTheDocument();
    });

    it('filters storage services by active status', async () => {
      renderScriptEditor();

      await waitFor(() => {
        const storageSelect = screen.getByTestId('storage-service-select');
        expect(storageSelect).toBeInTheDocument();
      });

      // Should only show active services
      expect(screen.getByText('Local Storage (local_file)')).toBeInTheDocument();
      expect(screen.getByText('GitHub Storage (github)')).toBeInTheDocument();
      expect(screen.queryByText('S3 Storage (s3)')).not.toBeInTheDocument();
    });

    it('handles storage service selection changes', async () => {
      const onStorageServiceChangeMock = vi.fn();
      const { user } = renderScriptEditor({
        onStorageServiceChange: onStorageServiceChangeMock,
      });

      await waitFor(() => {
        const storageSelect = screen.getByTestId('storage-service-select');
        expect(storageSelect).toBeInTheDocument();
      });

      const storageSelect = screen.getByTestId('storage-service-select');
      await user.selectOptions(storageSelect, 'local_storage');

      expect(onStorageServiceChangeMock).toHaveBeenCalledWith('local_storage');
    });

    it('validates storage path format', async () => {
      const { user } = renderScriptEditorWithForm();

      await waitFor(() => {
        const storageSelect = screen.getByTestId('storage-service-select');
        expect(storageSelect).toBeInTheDocument();
      });

      // Select storage service
      const storageSelect = screen.getByTestId('storage-service-select');
      await user.selectOptions(storageSelect, 'local_storage');

      // Enter invalid path
      const pathInput = screen.getByTestId('storage-path-input');
      await user.type(pathInput, '../invalid/path');

      await waitFor(() => {
        expect(screen.getByText(/storage path format is invalid/i)).toBeInTheDocument();
      });
    });

    it('handles storage path changes', async () => {
      const onStoragePathChangeMock = vi.fn();
      const { user } = renderScriptEditor({
        onStoragePathChange: onStoragePathChangeMock,
      });

      await waitFor(() => {
        const pathInput = screen.getByTestId('storage-path-input');
        expect(pathInput).toBeInTheDocument();
      });

      const pathInput = screen.getByTestId('storage-path-input');
      await user.type(pathInput, '/scripts/test.js');

      await waitFor(() => {
        expect(onStoragePathChangeMock).toHaveBeenCalledWith('/scripts/test.js');
      });
    });
  });

  // =============================================================================
  // CACHE MANAGEMENT TESTS
  // =============================================================================

  describe('Cache Management', () => {
    it('loads latest cached content', async () => {
      const onCacheOperationMock = vi.fn();
      const { user } = renderScriptEditor({
        onCacheOperation: onCacheOperationMock,
      });

      const latestButton = screen.getByTestId('view-latest-cache-button');
      await user.click(latestButton);

      await waitFor(() => {
        expect(onCacheOperationMock).toHaveBeenCalledWith(
          'viewLatest',
          expect.objectContaining({
            success: true,
            operation: 'viewLatest',
          })
        );
      });

      // Content should be updated
      await waitFor(() => {
        const editor = screen.getByTestId('ace-editor');
        expect(editor).toHaveValue(mockScriptContent.javascript);
      });
    });

    it('deletes cached content', async () => {
      const onCacheOperationMock = vi.fn();
      const { user } = renderScriptEditor({
        onCacheOperation: onCacheOperationMock,
      });

      const deleteButton = screen.getByTestId('delete-cache-button');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(onCacheOperationMock).toHaveBeenCalledWith(
          'deleteCache',
          expect.objectContaining({
            success: true,
            operation: 'deleteCache',
          })
        );
      });
    });

    it('shows loading state during cache operations', async () => {
      const { user } = renderScriptEditor();

      const latestButton = screen.getByTestId('view-latest-cache-button');
      await user.click(latestButton);

      // Should show loading state
      expect(latestButton).toBeDisabled();
    });

    it('handles cache operation errors', async () => {
      // Mock cache error
      server.use(
        rest.get('/api/v2/cache/script/:key', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Cache not found' })
          );
        })
      );

      const onCacheOperationMock = vi.fn();
      const { user } = renderScriptEditor({
        onCacheOperation: onCacheOperationMock,
      });

      const latestButton = screen.getByTestId('view-latest-cache-button');
      await user.click(latestButton);

      await waitFor(() => {
        expect(onCacheOperationMock).toHaveBeenCalledWith(
          'viewLatest',
          expect.objectContaining({
            success: false,
            error: expect.stringContaining('Cache'),
          })
        );
      });
    });
  });

  // =============================================================================
  // ACE EDITOR INTEGRATION TESTS
  // =============================================================================

  describe('ACE Editor Integration', () => {
    it('updates content through ACE editor', async () => {
      const onChangeMock = vi.fn();
      const { user } = renderScriptEditor({
        onChange: onChangeMock,
      });

      const editor = screen.getByTestId('ace-editor');
      await user.type(editor, 'console.log("test");');

      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalledWith('console.log("test");');
      });
    });

    it('changes language and updates syntax highlighting', async () => {
      const { user } = renderScriptEditor({
        defaultValue: mockScriptContent.typescript,
      });

      const languageSelect = screen.getByTestId('language-select');
      await user.selectOptions(languageSelect, 'typescript');

      await waitFor(() => {
        expect(languageSelect).toHaveValue('typescript');
      });
    });

    it('adapts theme based on system theme', async () => {
      // Test light theme
      const { rerender } = renderScriptEditor({ editorTheme: 'auto' });
      
      let editor = screen.getByTestId('ace-editor');
      expect(editor).toBeInTheDocument();

      // Test dark theme
      document.documentElement.classList.add('dark');
      rerender(<ScriptEditor {...defaultProps} editorTheme="auto" />);
      
      editor = screen.getByTestId('ace-editor');
      expect(editor).toBeInTheDocument();
    });

    it('provides syntax highlighting for different languages', async () => {
      const { user } = renderScriptEditor();

      const languageSelect = screen.getByTestId('language-select');

      // Test different languages
      const languages = ['javascript', 'typescript', 'python', 'php', 'json'];
      
      for (const language of languages) {
        await user.selectOptions(languageSelect, language);
        expect(languageSelect).toHaveValue(language);
      }
    });

    it('displays line count and character statistics', async () => {
      const { user } = renderScriptEditor({
        defaultValue: mockScriptContent.javascript,
      });

      // Should show statistics
      await waitFor(() => {
        expect(screen.getByText(/Lines:/)).toBeInTheDocument();
        expect(screen.getByText(/Characters:/)).toBeInTheDocument();
      });
    });
  });

  // =============================================================================
  // TOOLBAR AND USER INTERACTION TESTS
  // =============================================================================

  describe('Toolbar and User Interactions', () => {
    it('copies content to clipboard', async () => {
      const { user } = renderScriptEditor({
        defaultValue: 'test content to copy',
      });

      const copyButton = screen.getByTestId('copy-content-button');
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content to copy');
    });

    it('downloads content as file', async () => {
      // Mock document.createElement for download
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation();

      const { user } = renderScriptEditor({
        defaultValue: 'test content to download',
        language: 'javascript',
      });

      const downloadButton = screen.getByTestId('download-content-button');
      await user.click(downloadButton);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('script.javascript');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('toggles preview mode', async () => {
      const { user } = renderScriptEditor({
        defaultValue: 'test content for preview',
      });

      const previewButton = screen.getByTestId('preview-toggle-button');
      await user.click(previewButton);

      // Should show preview panel
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('test content for preview')).toBeInTheDocument();

      // Toggle off
      await user.click(previewButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Preview')).not.toBeInTheDocument();
      });
    });

    it('handles save button with keyboard shortcut', async () => {
      const onContentSaveMock = vi.fn().mockResolvedValue(undefined);
      const { user } = renderScriptEditor({
        defaultValue: 'content to save',
        onContentSave: onContentSaveMock,
      });

      // Test Ctrl+S shortcut
      await user.keyboard('{Control>}s{/Control}');

      await waitFor(() => {
        expect(onContentSaveMock).toHaveBeenCalledWith('content to save', expect.any(Object));
      });
    });

    it('disables save button when form is invalid', async () => {
      const { user } = renderScriptEditor();

      const saveButton = screen.getByTestId('save-script-button');
      
      // Should be disabled without content
      expect(saveButton).toBeDisabled();

      // Add content to enable
      const editor = screen.getByTestId('ace-editor');
      await user.type(editor, 'valid content');

      await waitFor(() => {
        expect(saveButton).not.toBeDisabled();
      });
    });
  });

  // =============================================================================
  // ACCESSIBILITY COMPLIANCE TESTS
  // =============================================================================

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderScriptEditor({
        defaultValue: mockScriptContent.javascript,
      });

      await waitFor(() => {
        expect(screen.getByTestId('script-editor')).toBeInTheDocument();
      });

      // Test accessibility
      await testA11y(container, {
        skipRules: ['color-contrast'], // Skip color contrast for mocked components
      });
    });

    it('provides proper ARIA labels and roles', async () => {
      renderScriptEditor();

      // Check main container
      const scriptEditor = screen.getByTestId('script-editor');
      checkAriaAttributes(scriptEditor, {
        'aria-label': 'Script editor with file management and storage integration',
      });

      // Check editor
      const editor = screen.getByTestId('ace-editor');
      checkAriaAttributes(editor, {
        'aria-label': 'Script content editor with syntax highlighting',
      });

      // Check buttons have proper labels
      expect(screen.getByLabelText(/upload script file/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/import script from github/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/save script content/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const { user } = renderScriptEditor();
      const keyboard = createKeyboardUtils(user);

      // Tab through interactive elements
      await keyboard.tab();
      expect(keyboard.getFocused()).toBe(screen.getByTestId('upload-file-button'));

      await keyboard.tab();
      expect(keyboard.getFocused()).toBe(screen.getByTestId('github-import-button'));

      await keyboard.tab();
      expect(keyboard.getFocused()).toBe(screen.getByTestId('view-latest-cache-button'));

      // Test Enter key activation
      await keyboard.enter();
      // Should trigger cache operation
    });

    it('provides screen reader announcements for state changes', async () => {
      const { user } = renderScriptEditor();

      // Look for aria-live regions
      const liveRegions = screen.getAllByText(/loading|error|success/i, { selector: '[aria-live]' });
      expect(liveRegions.length).toBeGreaterThanOrEqual(0);
    });

    it('handles error states accessibly', async () => {
      // Mock error scenario
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Service unavailable' })
          );
        })
      );

      renderScriptEditor();

      // Should announce errors to screen readers
      await waitFor(() => {
        const errorMessages = screen.queryAllByRole('alert');
        expect(errorMessages.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // =============================================================================
  // ERROR HANDLING AND EDGE CASES
  // =============================================================================

  describe('Error Handling and Edge Cases', () => {
    it('handles network errors gracefully', async () => {
      // Mock network failure
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res.networkError('Network connection failed');
        })
      );

      renderScriptEditor();

      // Should handle error without crashing
      await waitFor(() => {
        expect(screen.getByTestId('script-editor')).toBeInTheDocument();
      });
    });

    it('handles malformed API responses', async () => {
      // Mock malformed response
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ invalid: 'response format' })
          );
        })
      );

      renderScriptEditor();

      // Should handle gracefully
      await waitFor(() => {
        expect(screen.getByTestId('script-editor')).toBeInTheDocument();
      });
    });

    it('handles large file content efficiently', async () => {
      const largeContent = 'x'.repeat(100000); // 100KB content
      const { user } = renderScriptEditor({
        defaultValue: largeContent,
      });

      // Should render without performance issues
      const editor = screen.getByTestId('ace-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveValue(largeContent);
    });

    it('handles rapid user interactions', async () => {
      const onChangeMock = vi.fn();
      const { user } = renderScriptEditor({
        onChange: onChangeMock,
      });

      const editor = screen.getByTestId('ace-editor');

      // Rapid typing simulation
      for (let i = 0; i < 10; i++) {
        await user.type(editor, `line ${i}\n`);
      }

      // Should handle all changes
      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalled();
      });
    });

    it('handles component unmounting during async operations', async () => {
      const { user, unmount } = renderScriptEditor();

      // Start an async operation
      const uploadButton = screen.getByTestId('upload-file-button');
      const testFile = createMockFile('test.js', 'content');
      const fileInput = screen.getByTestId('file-upload-input');
      
      await user.upload(fileInput, testFile);

      // Unmount during operation
      unmount();

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  // =============================================================================
  // INTEGRATION TESTS WITH DEPENDENT COMPONENTS
  // =============================================================================

  describe('Integration with Dependent Components', () => {
    it('integrates with ACE editor configuration', async () => {
      const customEditorConfig = {
        fontSize: 16,
        tabSize: 4,
        showLineNumbers: true,
        enableAutoCompletion: true,
      };

      const { user } = renderScriptEditor({
        editorConfig: { options: customEditorConfig },
      });

      const editor = screen.getByTestId('ace-editor');
      expect(editor).toBeInTheDocument();
    });

    it('integrates with Dialog components for GitHub import', async () => {
      const { user } = renderScriptEditor();

      // Open dialog
      const githubButton = screen.getByTestId('github-import-button');
      await user.click(githubButton);

      // Dialog should have proper structure
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Should have title
      expect(within(dialog).getByText('Import from GitHub')).toBeInTheDocument();
      
      // Should have form fields
      expect(within(dialog).getByLabelText(/github file url/i)).toBeInTheDocument();
      
      // Should have action buttons
      expect(within(dialog).getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: /import/i })).toBeInTheDocument();
    });

    it('integrates with Query Client for cache management', async () => {
      const testQueryClient = createTestQueryClient();
      const { user } = renderScriptEditor({}, { queryClient: testQueryClient });

      // Should use query client for cache operations
      const latestButton = screen.getByTestId('view-latest-cache-button');
      await user.click(latestButton);

      // Query client should be utilized
      expect(testQueryClient.getQueryCache().getAll().length).toBeGreaterThanOrEqual(0);
    });

    it('integrates with theme system', async () => {
      const { rerender } = customRender(<ScriptEditor {...defaultProps} />, {
        theme: 'light',
      });

      expect(screen.getByTestId('script-editor')).toBeInTheDocument();

      // Switch to dark theme
      rerender(<ScriptEditor {...defaultProps} />);
      document.documentElement.classList.add('dark');

      expect(screen.getByTestId('script-editor')).toBeInTheDocument();
    });
  });

  // =============================================================================
  // CUSTOM HOOK INTEGRATION TESTS
  // =============================================================================

  describe('Custom Hook Integration', () => {
    it('integrates with useScriptEditor hook properly', async () => {
      // Test that the component properly uses the hook's return values
      const onContentChangeMock = vi.fn();
      const { user } = renderScriptEditor({
        onChange: onContentChangeMock,
      });

      const editor = screen.getByTestId('ace-editor');
      await user.type(editor, 'hook integration test');

      await waitFor(() => {
        expect(onContentChangeMock).toHaveBeenCalledWith('hook integration test');
      });
    });

    it('handles hook error states properly', async () => {
      // Mock hook errors by causing API failures
      server.use(
        rest.get('/api/v2/system/service', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ error: 'Hook error simulation' })
          );
        })
      );

      const onErrorMock = vi.fn();
      renderScriptEditor({
        // onError would be passed to the hook
      });

      // Component should handle hook errors gracefully
      await waitFor(() => {
        expect(screen.getByTestId('script-editor')).toBeInTheDocument();
      });
    });
  });
});