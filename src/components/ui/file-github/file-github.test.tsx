/**
 * @fileoverview Comprehensive Vitest test suite for the file-github React component
 * Tests file upload functionality, GitHub import workflow, ACE editor integration,
 * accessibility compliance, and React Hook Form integration with MSW API mocking.
 * 
 * @version 1.0.0
 * @author DreamFactory Platform Team
 * @since 2024
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { server } from '../../../test/mocks/server';
import { rest } from 'msw';
import { renderWithProviders } from '../../../test/utils/test-utils';
import { createMockFile, createMockGitHubResponse } from '../../../test/utils/component-factories';
import { measureRenderPerformance, measureFileOperationTime } from '../../../test/utils/performance-helpers';
import { testKeyboardNavigation, testScreenReaderAnnouncements } from '../../../test/utils/accessibility-helpers';
import { FileGithub } from './file-github';
import type { FileGithubProps, FileUploadEvent, GitHubImportResult } from './types';
import { useForm } from 'react-hook-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock File API and FileReader for testing
Object.defineProperty(window, 'File', {
  value: class MockFile {
    constructor(public content: string[], public name: string, public options: any = {}) {
      this.lastModified = Date.now();
      this.size = content.join('').length;
      this.type = options.type || 'text/plain';
    }
    lastModified: number;
    size: number;
    type: string;
  },
});

Object.defineProperty(window, 'FileReader', {
  value: class MockFileReader {
    onload: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    result: string | ArrayBuffer | null = null;
    
    readAsText(file: File) {
      setTimeout(() => {
        this.result = (file as any).content.join('');
        if (this.onload) {
          this.onload({ target: this });
        }
      }, 10);
    }
    
    abort() {
      // Mock implementation
    }
  },
});

// Mock ACE editor component
vi.mock('../ace-editor/ace-editor', () => ({
  AceEditor: vi.fn(({ value, onChange, ...props }) => (
    <textarea
      data-testid="ace-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      {...props}
    />
  )),
}));

// Mock GitHub dialog component
vi.mock('../scripts-github-dialog/scripts-github-dialog', () => ({
  ScriptsGitHubDialog: vi.fn(({ open, onOpenChange, onSelect }) => (
    open ? (
      <div data-testid="github-dialog" role="dialog">
        <button 
          data-testid="select-github-file"
          onClick={() => onSelect?.({
            content: '// GitHub file content',
            filename: 'test-script.js',
            url: 'https://github.com/user/repo/blob/main/test-script.js'
          })}
        >
          Select File
        </button>
        <button 
          data-testid="close-github-dialog"
          onClick={() => onOpenChange?.(false)}
        >
          Close
        </button>
      </div>
    ) : null
  )),
}));

// Test wrapper component for form integration
const TestFormWrapper = ({ children, onSubmit }: { children: React.ReactNode; onSubmit?: (data: any) => void }) => {
  const form = useForm({
    defaultValues: {
      content: '',
      type: 'text/plain',
      filename: '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit || (() => {}))}>
      {children}
      <button type="submit" data-testid="form-submit">Submit</button>
    </form>
  );
};

describe('FileGithub Component', () => {
  let mockOnChange: vi.Mock;
  let mockOnFileSelect: vi.Mock;
  let mockOnGitHubImport: vi.Mock;
  let queryClient: QueryClient;

  const defaultProps: FileGithubProps = {
    value: '',
    onChange: vi.fn(),
    onFileSelect: vi.fn(),
    onGitHubImport: vi.fn(),
    accept: '.js,.ts,.json',
    maxSize: 1024 * 1024, // 1MB
    placeholder: 'Select a file or import from GitHub',
    editorMode: 'javascript',
    showEditor: true,
    'aria-label': 'File content editor',
  };

  beforeEach(() => {
    mockOnChange = vi.fn();
    mockOnFileSelect = vi.fn();
    mockOnGitHubImport = vi.fn();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });

  describe('Component Rendering', () => {
    it('renders with default props', () => {
      renderWithProviders(<FileGithub {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import from github/i })).toBeInTheDocument();
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });

    it('renders without editor when showEditor is false', () => {
      renderWithProviders(
        <FileGithub {...defaultProps} showEditor={false} />
      );
      
      expect(screen.queryByTestId('ace-editor')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
    });

    it('displays placeholder text correctly', () => {
      const customPlaceholder = 'Custom placeholder text';
      renderWithProviders(
        <FileGithub {...defaultProps} placeholder={customPlaceholder} />
      );
      
      expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
    });

    it('shows file name when file is selected', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const fileInput = screen.getByLabelText(/upload file/i);
      const mockFile = createMockFile('test-script.js', 'console.log("test");');

      await user.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(screen.getByText('test-script.js')).toBeInTheDocument();
      });
    });

    it('measures component rendering performance', async () => {
      const renderTime = await measureRenderPerformance(() => {
        renderWithProviders(<FileGithub {...defaultProps} />);
      });

      // Performance requirement: Component rendering should be under 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('File Upload Functionality', () => {
    it('handles file selection and calls onChange', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} onChange={mockOnChange} />
      );
      const fileInput = screen.getByLabelText(/upload file/i);
      const mockFile = createMockFile('test.js', 'console.log("hello");');

      const operationTime = await measureFileOperationTime(async () => {
        await user.upload(fileInput, mockFile);
      });

      // Performance requirement: File operations should be under 100ms
      expect(operationTime).toBeLessThan(100);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('console.log("hello");');
      });
    });

    it('validates file type restrictions', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} accept=".js,.ts" />
      );
      const fileInput = screen.getByLabelText(/upload file/i);
      const invalidFile = createMockFile('test.txt', 'text content', { type: 'text/plain' });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
      });
    });

    it('validates file size restrictions', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} maxSize={100} />
      );
      const fileInput = screen.getByLabelText(/upload file/i);
      const largeFile = createMockFile('large.js', 'x'.repeat(1000), { type: 'application/javascript' });

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds maximum/i)).toBeInTheDocument();
      });
    });

    it('handles file reading errors gracefully', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      
      // Mock FileReader error
      const originalFileReader = window.FileReader;
      window.FileReader = class MockErrorFileReader {
        onerror: ((event: any) => void) | null = null;
        readAsText() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({ target: { error: new Error('Read error') } });
            }
          }, 10);
        }
        abort() {}
      } as any;

      const fileInput = screen.getByLabelText(/upload file/i);
      const mockFile = createMockFile('test.js', 'content');

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/error reading file/i)).toBeInTheDocument();
      });

      // Restore original FileReader
      window.FileReader = originalFileReader;
    });

    it('calls onFileSelect callback with file metadata', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} onFileSelect={mockOnFileSelect} />
      );
      const fileInput = screen.getByLabelText(/upload file/i);
      const mockFile = createMockFile('test.js', 'content', { type: 'application/javascript' });

      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith({
          file: expect.objectContaining({
            name: 'test.js',
            type: 'application/javascript',
          }),
          content: 'content',
        });
      });
    });

    it('handles multiple file selection correctly', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const fileInput = screen.getByLabelText(/upload file/i);
      const file1 = createMockFile('test1.js', 'content1');
      const file2 = createMockFile('test2.js', 'content2');

      await user.upload(fileInput, [file1, file2]);

      // Should only process the first file
      await waitFor(() => {
        expect(screen.getByText('test1.js')).toBeInTheDocument();
        expect(screen.queryByText('test2.js')).not.toBeInTheDocument();
      });
    });
  });

  describe('GitHub Import Functionality', () => {
    beforeEach(() => {
      server.use(
        rest.get('https://api.github.com/repos/:owner/:repo/contents/:path', (req, res, ctx) => {
          return res(ctx.json(createMockGitHubResponse()));
        })
      );
    });

    it('opens GitHub dialog when import button is clicked', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const importButton = screen.getByRole('button', { name: /import from github/i });

      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByTestId('github-dialog')).toBeInTheDocument();
      });
    });

    it('handles GitHub file selection', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} onGitHubImport={mockOnGitHubImport} />
      );
      const importButton = screen.getByRole('button', { name: /import from github/i });

      await user.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('github-dialog')).toBeInTheDocument();
      });

      const selectButton = screen.getByTestId('select-github-file');
      await user.click(selectButton);

      await waitFor(() => {
        expect(mockOnGitHubImport).toHaveBeenCalledWith({
          content: '// GitHub file content',
          filename: 'test-script.js',
          url: 'https://github.com/user/repo/blob/main/test-script.js',
        });
      });
    });

    it('closes GitHub dialog on cancel', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const importButton = screen.getByRole('button', { name: /import from github/i });

      await user.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('github-dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('close-github-dialog');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('github-dialog')).not.toBeInTheDocument();
      });
    });

    it('handles GitHub API errors gracefully', async () => {
      // Mock API error
      server.use(
        rest.get('https://api.github.com/repos/:owner/:repo/contents/:path', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ message: 'Not Found' }));
        })
      );

      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const importButton = screen.getByRole('button', { name: /import from github/i });

      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/error connecting to github/i)).toBeInTheDocument();
      });
    });

    it('validates GitHub import performance', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const importButton = screen.getByRole('button', { name: /import from github/i });

      const operationTime = await measureFileOperationTime(async () => {
        await user.click(importButton);
        await waitFor(() => {
          expect(screen.getByTestId('github-dialog')).toBeInTheDocument();
        });
      });

      // Performance requirement: GitHub import should respond under 100ms
      expect(operationTime).toBeLessThan(100);
    });
  });

  describe('ACE Editor Integration', () => {
    it('displays content in ACE editor', () => {
      const content = 'console.log("test");';
      renderWithProviders(
        <FileGithub {...defaultProps} value={content} />
      );

      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveValue(content);
    });

    it('handles editor content changes', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} onChange={mockOnChange} />
      );
      const editor = screen.getByTestId('ace-editor');

      await user.clear(editor);
      await user.type(editor, 'new content');

      expect(mockOnChange).toHaveBeenCalledWith('new content');
    });

    it('applies correct editor mode', () => {
      renderWithProviders(
        <FileGithub {...defaultProps} editorMode="typescript" />
      );

      const editor = screen.getByTestId('ace-editor');
      expect(editor).toHaveAttribute('data-mode', 'typescript');
    });

    it('handles editor validation errors', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} editorMode="json" />
      );
      const editor = screen.getByTestId('ace-editor');

      await user.clear(editor);
      await user.type(editor, '{ invalid json }');

      await waitFor(() => {
        expect(screen.getByText(/invalid json syntax/i)).toBeInTheDocument();
      });
    });

    it('supports editor keyboard shortcuts', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const editor = screen.getByTestId('ace-editor');

      await user.click(editor);
      await user.keyboard('{Control>}a{/Control}');
      await user.keyboard('{Delete}');
      await user.type(editor, 'new content');

      expect(editor).toHaveValue('new content');
    });
  });

  describe('React Hook Form Integration', () => {
    it('integrates with React Hook Form', async () => {
      const mockSubmit = vi.fn();
      const { user } = renderWithProviders(
        <TestFormWrapper onSubmit={mockSubmit}>
          <FileGithub {...defaultProps} name="fileContent" />
        </TestFormWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      const mockFile = createMockFile('test.js', 'form content');

      await user.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('form content')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fileContent: 'form content',
        })
      );
    });

    it('handles form validation errors', async () => {
      const { user } = renderWithProviders(
        <TestFormWrapper>
          <FileGithub {...defaultProps} required />
        </TestFormWrapper>
      );

      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
      });
    });

    it('supports controlled component pattern', async () => {
      const TestControlledComponent = () => {
        const [value, setValue] = React.useState('initial value');
        
        return (
          <FileGithub 
            {...defaultProps} 
            value={value} 
            onChange={setValue}
          />
        );
      };

      const { user } = renderWithProviders(<TestControlledComponent />);
      const editor = screen.getByTestId('ace-editor');

      expect(editor).toHaveValue('initial value');

      await user.clear(editor);
      await user.type(editor, 'updated value');

      expect(editor).toHaveValue('updated value');
    });

    it('validates real-time form changes under 100ms', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} onChange={mockOnChange} />
      );
      const editor = screen.getByTestId('ace-editor');

      const startTime = performance.now();
      
      await user.type(editor, 'a');
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Performance requirement: Real-time validation under 100ms
      expect(validationTime).toBeLessThan(100);
    });
  });

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<FileGithub {...defaultProps} />);
      const results = await axe(container);
      
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<FileGithub {...defaultProps} />);
      
      const isNavigationAccessible = await testKeyboardNavigation([
        { element: 'button[aria-label*="upload"]', key: 'Tab' },
        { element: 'button[aria-label*="github"]', key: 'Tab' },
        { element: '[data-testid="ace-editor"]', key: 'Tab' },
      ]);

      expect(isNavigationAccessible).toBe(true);
    });

    it('provides proper ARIA labels and descriptions', () => {
      renderWithProviders(
        <FileGithub 
          {...defaultProps} 
          aria-label="Script content editor"
          aria-describedby="editor-help"
        />
      );

      expect(screen.getByLabelText('Script content editor')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload file/i }))
        .toHaveAttribute('aria-describedby');
    });

    it('announces file selection to screen readers', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      
      const announcements = await testScreenReaderAnnouncements(async () => {
        const fileInput = screen.getByLabelText(/upload file/i);
        const mockFile = createMockFile('test.js', 'content');
        await user.upload(fileInput, mockFile);
      });

      expect(announcements).toContain('File test.js selected');
    });

    it('supports high contrast mode', () => {
      renderWithProviders(
        <div className="high-contrast">
          <FileGithub {...defaultProps} />
        </div>
      );

      const uploadButton = screen.getByRole('button', { name: /upload file/i });
      const styles = window.getComputedStyle(uploadButton);
      
      // Verify sufficient contrast ratio (simplified check)
      expect(styles.border).toBeTruthy();
      expect(styles.outline).toBeTruthy();
    });

    it('handles focus management properly', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      
      await user.tab(); // Focus first element
      expect(screen.getByRole('button', { name: /upload file/i })).toHaveFocus();
      
      await user.tab(); // Focus second element  
      expect(screen.getByRole('button', { name: /import from github/i })).toHaveFocus();
      
      await user.tab(); // Focus editor
      expect(screen.getByTestId('ace-editor')).toHaveFocus();
    });
  });

  describe('Theme Integration', () => {
    it('applies dark theme styles correctly', () => {
      renderWithProviders(
        <div className="dark">
          <FileGithub {...defaultProps} />
        </div>
      );

      const container = screen.getByRole('button', { name: /upload file/i }).closest('div');
      expect(container).toHaveClass('dark');
    });

    it('applies light theme styles correctly', () => {
      renderWithProviders(
        <div className="light">
          <FileGithub {...defaultProps} />
        </div>
      );

      const container = screen.getByRole('button', { name: /upload file/i }).closest('div');
      expect(container).toHaveClass('light');
    });

    it('responds to theme changes dynamically', async () => {
      const TestThemeComponent = () => {
        const [theme, setTheme] = React.useState('light');
        
        return (
          <div className={theme}>
            <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              Toggle Theme
            </button>
            <FileGithub {...defaultProps} />
          </div>
        );
      };

      const { user } = renderWithProviders(<TestThemeComponent />);
      const themeToggle = screen.getByText('Toggle Theme');
      
      await user.click(themeToggle);
      
      const container = screen.getByRole('button', { name: /upload file/i }).closest('div');
      expect(container).toHaveClass('dark');
    });
  });

  describe('Error Handling', () => {
    it('displays user-friendly error messages', async () => {
      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const fileInput = screen.getByLabelText(/upload file/i);
      
      // Create a file that will trigger an error
      const errorFile = createMockFile('', '', { type: '' });
      
      await user.upload(fileInput, errorFile);

      await waitFor(() => {
        expect(screen.getByText(/please select a valid file/i)).toBeInTheDocument();
      });
    });

    it('recovers from network errors gracefully', async () => {
      // Mock network failure
      server.use(
        rest.get('*', (req, res) => {
          return res.networkError('Failed to connect');
        })
      );

      const { user } = renderWithProviders(<FileGithub {...defaultProps} />);
      const importButton = screen.getByRole('button', { name: /import from github/i });

      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('handles component unmounting safely', () => {
      const { unmount } = renderWithProviders(<FileGithub {...defaultProps} />);
      
      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('validates component props correctly', () => {
      // Test with invalid props
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(
        <FileGithub 
          {...defaultProps} 
          maxSize={-1} // Invalid prop
          accept={123 as any} // Invalid prop type
        />
      );

      // Component should handle invalid props gracefully
      expect(screen.getByRole('button', { name: /upload file/i })).toBeInTheDocument();
      
      consoleError.mockRestore();
    });
  });

  describe('Performance Optimization', () => {
    it('handles large files efficiently', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} maxSize={10 * 1024 * 1024} />
      );
      
      const fileInput = screen.getByLabelText(/upload file/i);
      const largeContent = 'x'.repeat(1000000); // 1MB content
      const largeFile = createMockFile('large.js', largeContent);

      const startTime = performance.now();
      
      await user.upload(fileInput, largeFile);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue(largeContent)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should handle large files within reasonable time
      expect(processingTime).toBeLessThan(2000);
    });

    it('debounces editor changes for performance', async () => {
      const { user } = renderWithProviders(
        <FileGithub {...defaultProps} onChange={mockOnChange} />
      );
      const editor = screen.getByTestId('ace-editor');

      await user.type(editor, 'rapid typing');

      // Should debounce rapid changes
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('optimizes re-renders with memo', () => {
      const renderCount = vi.fn();
      
      const TestComponent = React.memo(() => {
        renderCount();
        return <FileGithub {...defaultProps} />;
      });

      const { rerender } = renderWithProviders(<TestComponent />);
      
      expect(renderCount).toHaveBeenCalledTimes(1);
      
      // Re-render with same props should not trigger render
      rerender(<TestComponent />);
      
      expect(renderCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('works within form submission workflow', async () => {
      const { user } = renderWithProviders(
        <TestFormWrapper onSubmit={mockOnFileSelect}>
          <FileGithub {...defaultProps} />
        </TestFormWrapper>
      );

      const fileInput = screen.getByLabelText(/upload file/i);
      const mockFile = createMockFile('integration-test.js', 'integration content');

      await user.upload(fileInput, mockFile);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('integration content')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('form-submit');
      await user.click(submitButton);

      expect(mockOnFileSelect).toHaveBeenCalled();
    });

    it('maintains state across parent component updates', async () => {
      const TestParentComponent = () => {
        const [parentState, setParentState] = React.useState(0);
        
        return (
          <div>
            <button onClick={() => setParentState(prev => prev + 1)}>
              Update Parent: {parentState}
            </button>
            <FileGithub {...defaultProps} value="persistent content" />
          </div>
        );
      };

      const { user } = renderWithProviders(<TestParentComponent />);
      const updateButton = screen.getByText(/update parent/i);
      
      expect(screen.getByDisplayValue('persistent content')).toBeInTheDocument();
      
      await user.click(updateButton);
      
      // Content should persist after parent update
      expect(screen.getByDisplayValue('persistent content')).toBeInTheDocument();
    });

    it('supports multiple instances on same page', () => {
      renderWithProviders(
        <div>
          <FileGithub {...defaultProps} aria-label="First editor" />
          <FileGithub {...defaultProps} aria-label="Second editor" />
        </div>
      );

      expect(screen.getByLabelText('First editor')).toBeInTheDocument();
      expect(screen.getByLabelText('Second editor')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /upload file/i })).toHaveLength(2);
    });
  });
});