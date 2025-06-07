/**
 * File GitHub Component - Comprehensive Vitest Test Suite
 * 
 * Complete testing implementation for the file-github React component using Vitest 2.1+,
 * Mock Service Worker for realistic API mocking, React Testing Library for component
 * interaction testing, and jest-axe for WCAG 2.1 AA accessibility compliance verification.
 * 
 * Test Coverage Areas:
 * - Component rendering and props handling
 * - File upload functionality with drag and drop
 * - GitHub import workflow with MSW mocking
 * - ACE editor integration and text editing
 * - React Hook Form integration and validation
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation (sub-100ms file operations)
 * - Keyboard navigation and screen reader support
 * - Theme switching and dark mode compatibility
 * - Error handling and edge cases
 * - Storage service integration
 * - Imperative API methods
 * 
 * @fileoverview Vitest test suite for file-github component
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Custom test utilities
import {
  customRender,
  renderWithForm,
  testA11y,
  createKeyboardUtils,
  createMockValidation,
  waitForValidation,
  measureRenderTime,
  type FormTestUtils,
  type KeyboardTestUtils,
} from '@/test/test-utils';

// Component under test and related types
import { FileGithub } from './file-github';
import type { 
  FileGithubProps, 
  FileGithubRef, 
  FileUploadEvent, 
  GitHubImportResult,
  FileValidationResult,
  AceEditorMode,
  FileSelectionMode,
  ImportSource,
} from './types';

// Mock handlers for MSW
import { handlers } from '@/test/mocks/handlers';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// ============================================================================
// MSW SERVER SETUP
// ============================================================================

/**
 * MSW server setup for GitHub API mocking
 * Provides realistic API responses for GitHub import functionality
 */
const server = setupServer(
  ...handlers,
  
  // GitHub API mocks for file import testing
  http.get('https://api.github.com/repos/:owner/:repo/contents/:path', ({ params }) => {
    const { owner, repo, path } = params;
    
    // Mock different scenarios for comprehensive testing
    if (owner === 'test-error' || repo === 'error-repo') {
      return HttpResponse.json(
        { message: 'Not Found', documentation_url: 'https://docs.github.com' },
        { status: 404 }
      );
    }

    if (owner === 'rate-limited') {
      return HttpResponse.json(
        { message: 'API rate limit exceeded' },
        { status: 403, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    // Successful response with file content
    const mockContent = btoa(`// Mock content from ${owner}/${repo}/${path}\nconsole.log("Hello from GitHub!");`);
    
    return HttpResponse.json({
      name: String(path).split('/').pop() || 'file.js',
      path: String(path),
      sha: 'abc123def456',
      size: 150,
      url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      html_url: `https://github.com/${owner}/${repo}/blob/main/${path}`,
      git_url: `https://api.github.com/repos/${owner}/${repo}/git/blobs/abc123def456`,
      download_url: `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`,
      type: 'file',
      content: mockContent,
      encoding: 'base64',
      _links: {
        self: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        git: `https://api.github.com/repos/${owner}/${repo}/git/blobs/abc123def456`,
        html: `https://github.com/${owner}/${repo}/blob/main/${path}`,
      },
    });
  }),

  // GitHub repository information mock
  http.get('https://api.github.com/repos/:owner/:repo', ({ params }) => {
    const { owner, repo } = params;
    return HttpResponse.json({
      id: 12345,
      name: repo,
      full_name: `${owner}/${repo}`,
      owner: {
        login: owner,
        id: 67890,
        avatar_url: `https://github.com/images/error/octocat_happy.gif`,
        html_url: `https://github.com/${owner}`,
      },
      html_url: `https://github.com/${owner}/${repo}`,
      default_branch: 'main',
      language: 'JavaScript',
      stargazers_count: 42,
      forks_count: 10,
    });
  }),

  // Mock storage service endpoints for file upload testing
  http.post('/api/storage/upload', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return HttpResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Simulate upload processing time (but keep it fast for tests)
    await new Promise(resolve => setTimeout(resolve, 50));

    return HttpResponse.json({
      filePath: `/uploads/${file.name}`,
      fileUrl: `https://storage.example.com/uploads/${file.name}`,
      size: file.size,
      contentType: file.type,
      uploadedAt: new Date().toISOString(),
      metadata: {
        originalName: file.name,
        uploadedBy: 'test-user',
      },
    });
  }),
);

// Server lifecycle management
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

/**
 * Mock file for testing file upload functionality
 */
const createMockFile = (
  name: string = 'test.js',
  content: string = 'console.log("test");',
  type: string = 'text/javascript'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
};

/**
 * Mock large file for performance testing
 */
const createLargeFile = (sizeInMB: number = 5): File => {
  const content = 'x'.repeat(sizeInMB * 1024 * 1024);
  return createMockFile('large-file.txt', content, 'text/plain');
};

/**
 * Mock GitHub import result
 */
const createMockGitHubResult = (): GitHubImportResult => ({
  repositoryUrl: 'https://github.com/test-user/test-repo',
  filePath: 'src/example.js',
  content: '// Example GitHub content\nconsole.log("Hello from GitHub!");',
  ref: 'main',
  metadata: {
    sha: 'abc123def456',
    size: 100,
    downloadUrl: 'https://raw.githubusercontent.com/test-user/test-repo/main/src/example.js',
    lastModified: new Date(),
  },
  importedAt: new Date(),
});

/**
 * Mock storage service for testing
 */
const createMockStorageService = () => ({
  uploadFile: vi.fn().mockResolvedValue({
    filePath: '/uploads/test.js',
    fileUrl: 'https://storage.example.com/uploads/test.js',
    size: 100,
    contentType: 'text/javascript',
    uploadedAt: new Date(),
  }),
  downloadFile: vi.fn().mockResolvedValue(new Blob(['test content'], { type: 'text/plain' })),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  listFiles: vi.fn().mockResolvedValue([]),
  getFileInfo: vi.fn().mockResolvedValue({
    name: 'test.js',
    path: '/uploads/test.js',
    size: 100,
    type: 'text/javascript',
    createdAt: new Date(),
    modifiedAt: new Date(),
  }),
  fileExists: vi.fn().mockResolvedValue(true),
});

/**
 * Default test props for consistent testing
 */
const defaultProps: Partial<FileGithubProps> = {
  'data-testid': 'file-github-test',
  label: 'Test File GitHub Component',
  helperText: 'Select a file or import from GitHub',
  enableGitHubImport: true,
  enableDragDrop: true,
  showImportButtons: true,
  showFileType: true,
  showFileSize: true,
};

// ============================================================================
// COMPONENT RENDERING TESTS
// ============================================================================

describe('FileGithub Component - Core Rendering', () => {
  it('should render with default props', () => {
    const { container } = customRender(<FileGithub {...defaultProps} />);
    
    expect(screen.getByTestId('file-github-test')).toBeInTheDocument();
    expect(screen.getByText('Test File GitHub Component')).toBeInTheDocument();
    expect(screen.getByText('Select a file or import from GitHub')).toBeInTheDocument();
  });

  it('should render upload and GitHub import buttons when enabled', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        enableGitHubImport={true}
        showImportButtons={true}
      />
    );
    
    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import from github/i })).toBeInTheDocument();
  });

  it('should not render GitHub import button when disabled', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        enableGitHubImport={false}
      />
    );
    
    expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /import from github/i })).not.toBeInTheDocument();
  });

  it('should render ACE editor with correct initial content', () => {
    const initialContent = 'console.log("initial content");';
    
    customRender(
      <FileGithub 
        {...defaultProps}
        defaultValue={initialContent}
      />
    );
    
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveValue(initialContent);
  });

  it('should apply custom className and styling', () => {
    const customClass = 'custom-file-github-class';
    
    const { container } = customRender(
      <FileGithub 
        {...defaultProps}
        className={customClass}
      />
    );
    
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('should handle disabled state correctly', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        disabled={true}
      />
    );
    
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    
    expect(uploadButton).toBeDisabled();
    expect(githubButton).toBeDisabled();
    
    // Container should have disabled styling
    const container = screen.getByTestId('file-github-test');
    expect(container).toHaveClass('opacity-50', 'pointer-events-none');
  });

  it('should measure render performance under acceptable threshold', async () => {
    const { renderTime } = await measureRenderTime(() =>
      customRender(<FileGithub {...defaultProps} />)
    );
    
    // Component should render in under 100ms as per performance requirements
    expect(renderTime).toBeLessThan(100);
  });
});

// ============================================================================
// FILE UPLOAD FUNCTIONALITY TESTS
// ============================================================================

describe('FileGithub Component - File Upload', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should handle file selection via file input', async () => {
    const onFileSelect = vi.fn();
    const onChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onFileSelect={onFileSelect}
        onChange={onChange}
      />
    );
    
    const mockFile = createMockFile('test.js', 'console.log("test");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile,
          fileName: 'test.js',
          content: 'console.log("test");',
        })
      );
    });
    
    expect(onChange).toHaveBeenCalledWith('console.log("test");');
  });

  it('should validate file size and show error for oversized files', async () => {
    const onValidationChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        maxFileSize={1024} // 1KB limit
        onValidationChange={onValidationChange}
      />
    );
    
    const largeFile = createLargeFile(5); // 5MB file
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, largeFile);
    
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          errors: expect.arrayContaining([
            expect.stringContaining('File size exceeds')
          ]),
        })
      );
    });
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should handle drag and drop file upload', async () => {
    const onFileSelect = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        enableDragDrop={true}
        onFileSelect={onFileSelect}
      />
    );
    
    const dropZone = screen.getByRole('button', { name: /drop files here/i });
    const mockFile = createMockFile('dropped.js', 'console.log("dropped");');
    
    // Simulate drag and drop
    fireEvent.dragEnter(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    });
    
    expect(dropZone).toHaveClass('border-blue-300', 'bg-blue-50');
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    });
    
    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile,
          fileName: 'dropped.js',
          content: 'console.log("dropped");',
        })
      );
    });
  });

  it('should show upload progress during file processing', async () => {
    const onUploadProgress = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onUploadProgress={onUploadProgress}
      />
    );
    
    const mockFile = createMockFile('progress-test.js', 'console.log("progress");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    // Should show progress indicator
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
    
    // Progress should complete
    await waitFor(() => {
      expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument();
    });
  });

  it('should perform file upload within performance threshold', async () => {
    const startTime = performance.now();
    
    customRender(<FileGithub {...defaultProps} />);
    
    const mockFile = createMockFile('perf-test.js', 'console.log("performance");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      const editor = screen.getByTestId('file-github-test-editor');
      expect(editor).toHaveValue('console.log("performance");');
    });
    
    const endTime = performance.now();
    const uploadTime = endTime - startTime;
    
    // File upload and processing should complete under 100ms as per requirements
    expect(uploadTime).toBeLessThan(100);
  });

  it('should display file information after successful upload', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        showFileType={true}
        showFileSize={true}
      />
    );
    
    const mockFile = createMockFile('info-test.js', 'console.log("info");', 'text/javascript');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(screen.getByText('info-test.js')).toBeInTheDocument();
      expect(screen.getByText(/type: text\/javascript/i)).toBeInTheDocument();
      expect(screen.getByText(/size: \d+(\.\d+)? kb/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// GITHUB IMPORT FUNCTIONALITY TESTS
// ============================================================================

describe('FileGithub Component - GitHub Import', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should open GitHub import dialog when button is clicked', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        enableGitHubImport={true}
      />
    );
    
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    await user.click(githubButton);
    
    await waitFor(() => {
      expect(screen.getByText('Import from GitHub')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/github\.com\/user\/repo/i)).toBeInTheDocument();
    });
  });

  it('should handle successful GitHub import with MSW', async () => {
    const onGitHubImport = vi.fn();
    const onChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onGitHubImport={onGitHubImport}
        onChange={onChange}
      />
    );
    
    // Open dialog
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    await user.click(githubButton);
    
    // Enter GitHub URL
    const urlInput = await screen.findByPlaceholderText(/github\.com\/user\/repo/i);
    await user.type(urlInput, 'https://github.com/test-user/test-repo/blob/main/src/example.js');
    
    // Click import button
    const importButton = screen.getByRole('button', { name: /^import$/i });
    await user.click(importButton);
    
    // Wait for import to complete (MSW will provide mock response)
    await waitFor(() => {
      expect(onGitHubImport).toHaveBeenCalledWith(
        expect.objectContaining({
          repositoryUrl: expect.stringContaining('github.com'),
          content: expect.stringContaining('Hello from GitHub'),
        })
      );
    }, { timeout: 3000 });
    
    expect(onChange).toHaveBeenCalledWith(expect.stringContaining('Hello from GitHub'));
    
    // Dialog should close
    expect(screen.queryByText('Import from GitHub')).not.toBeInTheDocument();
  });

  it('should handle GitHub import error scenarios', async () => {
    const onGitHubImportError = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onGitHubImportError={onGitHubImportError}
      />
    );
    
    // Open dialog
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    await user.click(githubButton);
    
    // Enter invalid URL that will trigger error
    const urlInput = await screen.findByPlaceholderText(/github\.com\/user\/repo/i);
    await user.type(urlInput, 'https://github.com/test-error/error-repo/blob/main/file.js');
    
    // Click import button
    const importButton = screen.getByRole('button', { name: /^import$/i });
    await user.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/github import failed/i)).toBeInTheDocument();
    });
  });

  it('should close GitHub dialog when cancel is clicked', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        enableGitHubImport={true}
      />
    );
    
    // Open dialog
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    await user.click(githubButton);
    
    // Verify dialog is open
    expect(screen.getByText('Import from GitHub')).toBeInTheDocument();
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Import from GitHub')).not.toBeInTheDocument();
    });
  });

  it('should perform GitHub import within performance threshold', async () => {
    const startTime = performance.now();
    
    customRender(<FileGithub {...defaultProps} />);
    
    // Open dialog and perform import
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    await user.click(githubButton);
    
    const urlInput = await screen.findByPlaceholderText(/github\.com\/user\/repo/i);
    await user.type(urlInput, 'https://github.com/test-user/test-repo/blob/main/src/example.js');
    
    const importButton = screen.getByRole('button', { name: /^import$/i });
    await user.click(importButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Import from GitHub')).not.toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const importTime = endTime - startTime;
    
    // GitHub import should complete under 2000ms (allowing for network simulation)
    expect(importTime).toBeLessThan(2000);
  });
});

// ============================================================================
// REACT HOOK FORM INTEGRATION TESTS
// ============================================================================

describe('FileGithub Component - React Hook Form Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should integrate with React Hook Form for controlled input', async () => {
    const defaultValues = { fileContent: 'initial content' };
    
    const TestForm = () => {
      return (
        <FileGithub 
          {...defaultProps}
          fieldName="fileContent"
          rules={{ required: 'File content is required' }}
        />
      );
    };
    
    const { formMethods } = renderWithForm(<TestForm />, { defaultValues });
    
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue('initial content');
    
    // Change content
    await user.clear(editor);
    await user.type(editor, 'updated content');
    
    await waitFor(() => {
      expect(formMethods.getValues('fileContent')).toBe('updated content');
    });
  });

  it('should validate required fields and show errors', async () => {
    const TestForm = () => {
      return (
        <FileGithub 
          {...defaultProps}
          fieldName="fileContent"
          rules={{ required: 'File content is required' }}
        />
      );
    };
    
    const { triggerValidation } = renderWithForm(<TestForm />, { 
      defaultValues: { fileContent: '' } 
    });
    
    const isValid = await triggerValidation('fileContent');
    expect(isValid).toBe(false);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('File content is required')).toBeInTheDocument();
    });
  });

  it('should perform real-time validation under 100ms threshold', async () => {
    const customValidator = vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] });
    
    customRender(
      <FileGithub 
        {...defaultProps}
        customValidator={customValidator}
      />
    );
    
    const editor = screen.getByTestId('file-github-test-editor');
    const startTime = performance.now();
    
    await user.type(editor, 'a');
    
    await waitFor(() => {
      expect(customValidator).toHaveBeenCalled();
    });
    
    const endTime = performance.now();
    const validationTime = endTime - startTime;
    
    // Real-time validation should complete under 100ms as per requirements
    expect(validationTime).toBeLessThan(100);
  });

  it('should handle validation with custom validator function', async () => {
    const customValidator = vi.fn().mockReturnValue({
      isValid: false,
      errors: ['Custom validation error'],
      warnings: ['Custom warning'],
    });
    
    const onValidationChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        customValidator={customValidator}
        onValidationChange={onValidationChange}
      />
    );
    
    const editor = screen.getByTestId('file-github-test-editor');
    await user.type(editor, 'invalid content');
    
    await waitFor(() => {
      expect(customValidator).toHaveBeenCalledWith('invalid content');
      expect(onValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          errors: ['Custom validation error'],
          warnings: ['Custom warning'],
        })
      );
    });
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Custom validation error')).toBeInTheDocument();
    expect(screen.getByText('Custom warning')).toBeInTheDocument();
  });
});

// ============================================================================
// ACCESSIBILITY TESTING
// ============================================================================

describe('FileGithub Component - Accessibility (WCAG 2.1 AA)', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let keyboard: KeyboardTestUtils;
  
  beforeEach(() => {
    user = userEvent.setup();
    keyboard = createKeyboardUtils(user);
  });

  it('should pass WCAG 2.1 AA accessibility audit', async () => {
    const { container } = customRender(
      <FileGithub 
        {...defaultProps}
        aria-label="File upload and GitHub import component"
        aria-describedby="file-help-text"
      />
    );
    
    await testA11y(container, {
      tags: ['wcag2a', 'wcag2aa'],
      skipRules: [], // Test all accessibility rules
    });
  });

  it('should have proper ARIA attributes', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        aria-label="Test file component"
        aria-describedby="help-text"
        aria-labelledby="label-id"
        aria-required={true}
        aria-invalid={false}
      />
    );
    
    const container = screen.getByTestId('file-github-test');
    const editor = screen.getByTestId('file-github-test-editor');
    
    expect(editor).toHaveAttribute('aria-label', expect.stringContaining('editor'));
    expect(editor).toHaveAttribute('aria-describedby');
  });

  it('should support keyboard navigation', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        enableDragDrop={true}
      />
    );
    
    const uploadButton = screen.getByRole('button', { name: /upload file/i });
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    const dropZone = screen.getByRole('button', { name: /drop files here/i });
    
    // Test tab navigation
    uploadButton.focus();
    expect(keyboard.isFocused(uploadButton)).toBe(true);
    
    await keyboard.tab();
    expect(keyboard.isFocused(githubButton)).toBe(true);
    
    await keyboard.tab();
    expect(keyboard.isFocused(dropZone)).toBe(true);
    
    // Test activation with Enter and Space
    await keyboard.enter();
    // Should trigger file selection
    
    dropZone.focus();
    await keyboard.space();
    // Should also trigger file selection
  });

  it('should provide proper screen reader announcements', async () => {
    const announcements = {
      onFileSelect: 'File selected successfully',
      onGitHubImport: 'File imported from GitHub',
      onUploadSuccess: 'File uploaded successfully',
      onError: 'An error occurred',
    };
    
    customRender(
      <FileGithub 
        {...defaultProps}
        announcements={announcements}
      />
    );
    
    // Test that aria-live regions exist for announcements
    const container = screen.getByTestId('file-github-test');
    const liveRegions = container.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    
    expect(liveRegions.length).toBeGreaterThan(0);
  });

  it('should handle error states with proper ARIA attributes', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        error={{ message: 'Test error message' }}
        aria-invalid={true}
      />
    );
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Test error message');
    
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveAttribute('aria-invalid', 'true');
  });

  it('should maintain focus management during dialog interactions', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        enableGitHubImport={true}
      />
    );
    
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    
    // Open dialog
    await user.click(githubButton);
    
    // Focus should move to dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { hidden: true }) || 
                   screen.getByText('Import from GitHub').closest('[role="dialog"]') ||
                   screen.getByText('Import from GitHub');
      
      expect(dialog).toBeInTheDocument();
    });
    
    // Close dialog with Escape
    await keyboard.escape();
    
    // Focus should return to trigger button
    await waitFor(() => {
      expect(keyboard.isFocused(githubButton)).toBe(true);
    });
  });
});

// ============================================================================
// THEME AND VISUAL TESTING
// ============================================================================

describe('FileGithub Component - Theme Integration', () => {
  it('should apply light theme styling correctly', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        forcedTheme="light"
      />,
      { theme: 'light' }
    );
    
    const container = screen.getByTestId('file-github-test');
    expect(container).not.toHaveClass('file-github-dark');
    
    // Light theme specific classes should be applied
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).not.toHaveClass('dark:bg-gray-900');
  });

  it('should apply dark theme styling correctly', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        forcedTheme="dark"
      />,
      { theme: 'dark' }
    );
    
    const container = screen.getByTestId('file-github-test');
    expect(container).toHaveClass('file-github-dark');
  });

  it('should auto-detect theme when set to auto', () => {
    // Test auto theme detection with dark system preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    customRender(
      <FileGithub 
        {...defaultProps}
        editorTheme="auto"
      />
    );
    
    // Should detect system dark mode preference
    const container = screen.getByTestId('file-github-test');
    expect(container).toHaveClass('file-github-dark');
  });

  it('should handle theme switching dynamically', async () => {
    const { rerender } = customRender(
      <FileGithub 
        {...defaultProps}
        forcedTheme="light"
      />,
      { theme: 'light' }
    );
    
    const container = screen.getByTestId('file-github-test');
    expect(container).not.toHaveClass('file-github-dark');
    
    // Switch to dark theme
    rerender(
      <FileGithub 
        {...defaultProps}
        forcedTheme="dark"
      />
    );
    
    expect(container).toHaveClass('file-github-dark');
  });
});

// ============================================================================
// STORAGE SERVICE INTEGRATION TESTS
// ============================================================================

describe('FileGithub Component - Storage Service Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockStorageService: ReturnType<typeof createMockStorageService>;
  
  beforeEach(() => {
    user = userEvent.setup();
    mockStorageService = createMockStorageService();
  });

  it('should upload file to storage service when enabled', async () => {
    const onStorageUpload = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        enableStorageUpload={true}
        storageService={mockStorageService}
        onStorageUpload={onStorageUpload}
      />
    );
    
    const mockFile = createMockFile('storage-test.js', 'console.log("storage");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        undefined // No custom storage options
      );
    });
    
    expect(onStorageUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: '/uploads/storage-test.js',
        size: expect.any(Number),
      })
    );
  });

  it('should handle storage upload errors gracefully', async () => {
    const onStorageUploadError = vi.fn();
    const failingStorageService = {
      ...mockStorageService,
      uploadFile: vi.fn().mockRejectedValue(new Error('Storage upload failed')),
    };
    
    customRender(
      <FileGithub 
        {...defaultProps}
        enableStorageUpload={true}
        storageService={failingStorageService}
        onStorageUploadError={onStorageUploadError}
      />
    );
    
    const mockFile = createMockFile('error-test.js', 'console.log("error");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(onStorageUploadError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Storage upload failed',
        })
      );
    });
    
    // File should still be loaded into editor despite storage error
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue('console.log("error");');
  });

  it('should pass custom storage options to upload', async () => {
    const storageOptions = {
      directory: '/custom',
      overwrite: true,
      permissions: 'public' as const,
      metadata: { purpose: 'test' },
    };
    
    customRender(
      <FileGithub 
        {...defaultProps}
        enableStorageUpload={true}
        storageService={mockStorageService}
        storageOptions={storageOptions}
      />
    );
    
    const mockFile = createMockFile('options-test.js', 'console.log("options");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        storageOptions
      );
    });
  });
});

// ============================================================================
// IMPERATIVE API TESTS
// ============================================================================

describe('FileGithub Component - Imperative API', () => {
  let fileGithubRef: React.RefObject<FileGithubRef>;
  
  beforeEach(() => {
    fileGithubRef = React.createRef();
  });

  it('should expose imperative methods via ref', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        ref={fileGithubRef}
      />
    );
    
    expect(fileGithubRef.current).not.toBeNull();
    expect(fileGithubRef.current?.focus).toBeInstanceOf(Function);
    expect(fileGithubRef.current?.blur).toBeInstanceOf(Function);
    expect(fileGithubRef.current?.getContent).toBeInstanceOf(Function);
    expect(fileGithubRef.current?.setContent).toBeInstanceOf(Function);
    expect(fileGithubRef.current?.clear).toBeInstanceOf(Function);
    expect(fileGithubRef.current?.selectFile).toBeInstanceOf(Function);
    expect(fileGithubRef.current?.validate).toBeInstanceOf(Function);
  });

  it('should get and set content programmatically', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        ref={fileGithubRef}
        defaultValue="initial content"
      />
    );
    
    // Get content
    expect(fileGithubRef.current?.getContent()).toBe('initial content');
    
    // Set content
    fileGithubRef.current?.setContent('programmatic content');
    
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue('programmatic content');
    expect(fileGithubRef.current?.getContent()).toBe('programmatic content');
  });

  it('should clear content and file selection', async () => {
    const user = userEvent.setup();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        ref={fileGithubRef}
        showFileType={true}
      />
    );
    
    // Upload a file first
    const mockFile = createMockFile('clear-test.js', 'console.log("clear");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    // Verify file is loaded
    await waitFor(() => {
      expect(screen.getByText('clear-test.js')).toBeInTheDocument();
    });
    
    // Clear everything
    fileGithubRef.current?.clear();
    
    // Content should be cleared
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue('');
    expect(fileGithubRef.current?.getContent()).toBe('');
    
    // File info should be removed
    expect(screen.queryByText('clear-test.js')).not.toBeInTheDocument();
  });

  it('should trigger file selection programmatically', async () => {
    const onFileSelect = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        ref={fileGithubRef}
        onFileSelect={onFileSelect}
      />
    );
    
    // Mock file input click
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
    
    fileGithubRef.current?.selectFile();
    
    expect(clickSpy).toHaveBeenCalled();
    
    clickSpy.mockRestore();
  });

  it('should validate content using custom validator', () => {
    const customValidator = vi.fn().mockReturnValue({
      isValid: false,
      errors: ['Validation error'],
      warnings: [],
    });
    
    customRender(
      <FileGithub 
        {...defaultProps}
        ref={fileGithubRef}
        customValidator={customValidator}
        defaultValue="test content"
      />
    );
    
    const result = fileGithubRef.current?.validate();
    
    expect(customValidator).toHaveBeenCalledWith('test content');
    expect(result).toEqual({
      isValid: false,
      errors: ['Validation error'],
      warnings: [],
    });
  });

  it('should focus and blur editor programmatically', () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        ref={fileGithubRef}
      />
    );
    
    const editor = screen.getByTestId('file-github-test-editor');
    
    // Focus
    fileGithubRef.current?.focus();
    expect(document.activeElement).toBe(editor);
    
    // Blur
    fileGithubRef.current?.blur();
    expect(document.activeElement).not.toBe(editor);
  });
});

// ============================================================================
// ERROR HANDLING AND EDGE CASES
// ============================================================================

describe('FileGithub Component - Error Handling', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  beforeEach(() => {
    user = userEvent.setup();
  });

  it('should handle FileReader errors gracefully', async () => {
    // Mock FileReader to throw error
    const originalFileReader = global.FileReader;
    global.FileReader = class MockFileReader {
      readAsText() {
        setTimeout(() => {
          this.onerror && this.onerror(new Event('error'));
        }, 0);
      }
    } as any;
    
    const onValidationChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onValidationChange={onValidationChange}
      />
    );
    
    const mockFile = createMockFile('error-test.js', 'console.log("error");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          errors: expect.arrayContaining([
            expect.stringContaining('Failed to read file'),
          ]),
        })
      );
    });
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    
    // Restore FileReader
    global.FileReader = originalFileReader;
  });

  it('should handle empty file selection', async () => {
    customRender(<FileGithub {...defaultProps} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Trigger change event with no files
    fireEvent.change(fileInput, { target: { files: [] } });
    
    // Should not crash or show errors
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should handle multiple file selection when only single is allowed', async () => {
    customRender(
      <FileGithub 
        {...defaultProps}
        selectionMode={FileSelectionMode.SINGLE}
      />
    );
    
    const file1 = createMockFile('file1.js', 'console.log("file1");');
    const file2 = createMockFile('file2.js', 'console.log("file2");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Simulate selecting multiple files (browser would typically prevent this)
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      configurable: true,
    });
    
    fireEvent.change(fileInput);
    
    // Should only process the first file
    await waitFor(() => {
      const editor = screen.getByTestId('file-github-test-editor');
      expect(editor).toHaveValue('console.log("file1");');
    });
  });

  it('should handle unsupported file types with warnings', async () => {
    const onValidationChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onValidationChange={onValidationChange}
      />
    );
    
    // Create a binary file that's not typically text-editable
    const binaryFile = new File([new ArrayBuffer(100)], 'image.jpg', { 
      type: 'image/jpeg' 
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, binaryFile);
    
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          warnings: expect.arrayContaining([
            expect.stringContaining('File type may not be supported'),
          ]),
        })
      );
    });
    
    expect(screen.getByText(/file type may not be supported/i)).toBeInTheDocument();
  });

  it('should handle network errors during GitHub import', async () => {
    // Setup network error scenario
    server.use(
      http.get('https://api.github.com/repos/network-error/repo/contents/*', () => {
        return HttpResponse.error();
      })
    );
    
    const onGitHubImportError = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onGitHubImportError={onGitHubImportError}
      />
    );
    
    // Open dialog and attempt import
    const githubButton = screen.getByRole('button', { name: /import from github/i });
    await user.click(githubButton);
    
    const urlInput = await screen.findByPlaceholderText(/github\.com\/user\/repo/i);
    await user.type(urlInput, 'https://github.com/network-error/repo/blob/main/file.js');
    
    const importButton = screen.getByRole('button', { name: /^import$/i });
    await user.click(importButton);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/github import failed/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// PERFORMANCE AND STRESS TESTING
// ============================================================================

describe('FileGithub Component - Performance', () => {
  it('should handle large file content efficiently', async () => {
    const largeContent = 'x'.repeat(50000); // 50KB of content
    const startTime = performance.now();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        defaultValue={largeContent}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render large content quickly
    expect(renderTime).toBeLessThan(200);
    
    const editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue(largeContent);
  });

  it('should maintain performance during rapid content changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    customRender(
      <FileGithub 
        {...defaultProps}
        onChange={onChange}
      />
    );
    
    const editor = screen.getByTestId('file-github-test-editor');
    const startTime = performance.now();
    
    // Simulate rapid typing
    for (let i = 0; i < 50; i++) {
      await user.type(editor, 'a', { delay: 0 });
    }
    
    const endTime = performance.now();
    const typingTime = endTime - startTime;
    
    // Should handle rapid changes efficiently
    expect(typingTime).toBeLessThan(1000);
    expect(onChange).toHaveBeenCalledTimes(50);
  });

  it('should efficiently handle multiple component instances', () => {
    const startTime = performance.now();
    
    const MultipleInstances = () => (
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <FileGithub
            key={i}
            {...defaultProps}
            data-testid={`file-github-${i}`}
          />
        ))}
      </div>
    );
    
    customRender(<MultipleInstances />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render multiple instances efficiently
    expect(renderTime).toBeLessThan(500);
    
    // All instances should be rendered
    for (let i = 0; i < 10; i++) {
      expect(screen.getByTestId(`file-github-${i}`)).toBeInTheDocument();
    }
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('FileGithub Component - Integration', () => {
  it('should work within a complex form with multiple fields', async () => {
    const user = userEvent.setup();
    
    const ComplexForm = () => {
      return (
        <form>
          <input name="title" placeholder="Title" />
          <FileGithub 
            {...defaultProps}
            fieldName="content"
            label="File Content"
          />
          <textarea name="description" placeholder="Description" />
          <button type="submit">Submit</button>
        </form>
      );
    };
    
    const { formMethods } = renderWithForm(<ComplexForm />, {
      defaultValues: { title: '', content: '', description: '' }
    });
    
    // Fill out the form
    await user.type(screen.getByPlaceholderText('Title'), 'Test Title');
    
    const mockFile = createMockFile('integration.js', 'console.log("integration");');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, mockFile);
    
    await user.type(screen.getByPlaceholderText('Description'), 'Test Description');
    
    // Verify form values
    await waitFor(() => {
      const values = formMethods.getValues();
      expect(values.title).toBe('Test Title');
      expect(values.content).toBe('console.log("integration");');
      expect(values.description).toBe('Test Description');
    });
  });

  it('should maintain state across re-renders', () => {
    const { rerender } = customRender(
      <FileGithub 
        {...defaultProps}
        value="initial content"
      />
    );
    
    let editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue('initial content');
    
    // Re-render with new props
    rerender(
      <FileGithub 
        {...defaultProps}
        value="updated content"
        disabled={true}
      />
    );
    
    editor = screen.getByTestId('file-github-test-editor');
    expect(editor).toHaveValue('updated content');
    expect(screen.getByRole('button', { name: /upload file/i })).toBeDisabled();
  });
});