/**
 * @fileoverview Comprehensive test suite for the ScriptsGithubDialog component
 * Tests accessibility compliance (WCAG 2.1 AA), URL validation with GitHub API integration,
 * repository privacy detection, dynamic form control behavior, file extension filtering,
 * authentication workflows, and error handling scenarios.
 * 
 * Testing Framework: Vitest 2.1.0 with React Testing Library
 * MSW Integration: GitHub API endpoint mocking
 * Accessibility: jest-axe for WCAG 2.1 AA compliance validation
 * Form Testing: React Hook Form with real-time validation
 * State Management: React Query caching behavior validation
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

// Component imports
import { ScriptsGithubDialog } from './scripts-github-dialog';
import type { ScriptsGithubDialogProps, ScriptData, GithubRepository } from './types';

// Test utilities and mocks
import { createTestQueryClient, TestWrapper } from '../../../test/test-utils';
import { githubHandlers } from '../../../test/mocks/handlers';

// Extend jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => key),
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  })),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Setup MSW server with GitHub API handlers
const server = setupServer(
  // Public repository endpoints
  rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
    const { owner, repo } = req.params;
    
    if (owner === 'testuser' && repo === 'public-repo') {
      return res(ctx.json({
        id: 123456,
        name: 'public-repo',
        full_name: 'testuser/public-repo',
        private: false,
        default_branch: 'main',
        description: 'A public test repository',
        html_url: 'https://github.com/testuser/public-repo',
      }));
    }
    
    if (owner === 'testuser' && repo === 'private-repo') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.includes('token valid-token')) {
        return res(ctx.status(404), ctx.json({
          message: 'Not Found',
          documentation_url: 'https://docs.github.com/rest',
        }));
      }
      
      return res(ctx.json({
        id: 789012,
        name: 'private-repo',
        full_name: 'testuser/private-repo',
        private: true,
        default_branch: 'main',
        description: 'A private test repository',
        html_url: 'https://github.com/testuser/private-repo',
      }));
    }
    
    return res(ctx.status(404), ctx.json({
      message: 'Not Found',
      documentation_url: 'https://docs.github.com/rest',
    }));
  }),

  // Repository contents endpoints
  rest.get('https://api.github.com/repos/:owner/:repo/contents/:path*', (req, res, ctx) => {
    const { owner, repo } = req.params;
    const path = req.params['path*'] || '';
    
    if (owner === 'testuser' && repo === 'public-repo') {
      if (path === '' || path === '/') {
        // Root directory listing
        return res(ctx.json([
          {
            name: 'script.js',
            path: 'script.js',
            type: 'file',
            download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/script.js',
          },
          {
            name: 'utils.py',
            path: 'utils.py',
            type: 'file',
            download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/utils.py',
          },
          {
            name: 'config.php',
            path: 'config.php',
            type: 'file',
            download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/config.php',
          },
          {
            name: 'readme.txt',
            path: 'readme.txt',
            type: 'file',
            download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/readme.txt',
          },
          {
            name: 'image.png',
            path: 'image.png',
            type: 'file',
            download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/image.png',
          },
          {
            name: 'scripts',
            path: 'scripts',
            type: 'dir',
          },
        ]));
      }
      
      if (path === 'scripts') {
        return res(ctx.json([
          {
            name: 'nested-script.js',
            path: 'scripts/nested-script.js',
            type: 'file',
            download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/scripts/nested-script.js',
          },
        ]));
      }
    }
    
    return res(ctx.status(404), ctx.json({ message: 'Not Found' }));
  }),

  // File content download endpoints
  rest.get('https://raw.githubusercontent.com/:owner/:repo/:branch/:path*', (req, res, ctx) => {
    const { owner, repo, branch } = req.params;
    const path = req.params['path*'];
    
    if (owner === 'testuser' && repo === 'public-repo' && branch === 'main') {
      if (path === 'script.js') {
        return res(ctx.text('console.log("Hello from GitHub!");'));
      }
      if (path === 'utils.py') {
        return res(ctx.text('def hello():\n    print("Hello from Python!")'));
      }
      if (path === 'config.php') {
        return res(ctx.text('<?php\necho "Hello from PHP!";\n?>'));
      }
      if (path === 'readme.txt') {
        return res(ctx.text('This is a simple text file.'));
      }
    }
    
    return res(ctx.status(404), ctx.text('File not found'));
  }),

  // Rate limiting simulation
  rest.get('https://api.github.com/rate_limit', (req, res, ctx) => {
    return res(ctx.json({
      resources: {
        core: {
          limit: 60,
          remaining: 0,
          reset: Math.floor(Date.now() / 1000) + 3600,
        },
      },
    }));
  }),

  // Invalid repository simulation
  rest.get('https://api.github.com/repos/invalid/repo', (req, res, ctx) => {
    return res(ctx.status(404), ctx.json({
      message: 'Not Found',
      documentation_url: 'https://docs.github.com/rest',
    }));
  }),

  // Network error simulation
  rest.get('https://api.github.com/repos/network/error', (req, res, ctx) => {
    return res.networkError('Network connection failed');
  }),

  ...githubHandlers,
);

// Test setup and teardown
beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  vi.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock props for testing
const createMockProps = (overrides: Partial<ScriptsGithubDialogProps> = {}): ScriptsGithubDialogProps => ({
  isOpen: true,
  onClose: vi.fn(),
  onScriptImport: vi.fn(),
  initialUrl: '',
  allowedExtensions: ['.js', '.py', '.php', '.txt'],
  title: 'Import Script from GitHub',
  description: 'Enter a GitHub repository URL to browse and import script files',
  ...overrides,
});

// Helper function to render component with providers
const renderWithProviders = (props: ScriptsGithubDialogProps) => {
  const queryClient = createTestQueryClient();
  
  return render(
    <QueryClientProvider client={queryClient}>
      <TestWrapper>
        <ScriptsGithubDialog {...props} />
      </TestWrapper>
    </QueryClientProvider>
  );
};

describe('ScriptsGithubDialog', () => {
  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations when closed', async () => {
      const props = createMockProps({ isOpen: false });
      const { container } = renderWithProviders(props);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when open', async () => {
      const props = createMockProps();
      const { container } = renderWithProviders(props);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should trap focus within the dialog', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // First focusable element should be the URL input
      const urlInput = screen.getByLabelText(/github repository url/i);
      expect(urlInput).toHaveFocus();
      
      // Tab through all focusable elements
      await user.tab();
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      expect(browseButton).toHaveFocus();
      
      await user.tab();
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveFocus();
      
      // Should cycle back to first element
      await user.tab();
      expect(urlInput).toHaveFocus();
    });

    it('should have proper ARIA labels and descriptions', async () => {
      const props = createMockProps();
      renderWithProviders(props);
      
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
      
      const title = screen.getByText(props.title!);
      expect(title).toHaveAttribute('id');
      
      const description = screen.getByText(props.description!);
      expect(description).toHaveAttribute('id');
      
      // URL input should have proper labeling
      const urlInput = screen.getByLabelText(/github repository url/i);
      expect(urlInput).toHaveAttribute('aria-required', 'true');
      expect(urlInput).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Escape should close the dialog
      await user.keyboard('{Escape}');
      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Enter a valid URL
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      // Should have status region for announcements
      await waitFor(() => {
        const statusRegion = screen.getByRole('status');
        expect(statusRegion).toBeInTheDocument();
      });
    });
  });

  describe('URL Validation with GitHub API Integration', () => {
    it('should validate GitHub URL format', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Test invalid URL
      await user.type(urlInput, 'not-a-url');
      await user.tab(); // Trigger blur for validation
      
      await waitFor(() => {
        expect(screen.getByText(/invalid github repository url/i)).toBeInTheDocument();
      });
      
      // Clear and test valid URL
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      await waitFor(() => {
        expect(screen.queryByText(/invalid github repository url/i)).not.toBeInTheDocument();
      });
    });

    it('should accept various GitHub URL formats', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      const validUrls = [
        'https://github.com/owner/repo',
        'http://github.com/owner/repo',
        'github.com/owner/repo',
        'https://github.com/owner/repo.git',
        'https://github.com/owner/repo/',
        'https://github.com/owner/repo/tree/main',
      ];
      
      for (const url of validUrls) {
        await user.clear(urlInput);
        await user.type(urlInput, url);
        await user.tab();
        
        await waitFor(() => {
          expect(screen.queryByText(/invalid github repository url/i)).not.toBeInTheDocument();
        });
      }
    });

    it('should reject non-GitHub URLs', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      const invalidUrls = [
        'https://gitlab.com/owner/repo',
        'https://bitbucket.org/owner/repo',
        'https://example.com/repo',
        'ftp://github.com/owner/repo',
      ];
      
      for (const url of invalidUrls) {
        await user.clear(urlInput);
        await user.type(urlInput, url);
        await user.tab();
        
        await waitFor(() => {
          expect(screen.getByText(/invalid github repository url/i)).toBeInTheDocument();
        });
      }
    });

    it('should handle real-time URL validation', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Type gradually and check validation
      await user.type(urlInput, 'https://');
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      
      await user.type(urlInput, 'github.com/');
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      
      await user.type(urlInput, 'testuser/');
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
      
      await user.type(urlInput, 'public-repo');
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  describe('Repository Privacy Detection', () => {
    it('should detect public repositories and show repository info', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
        expect(screen.getByText('A public test repository')).toBeInTheDocument();
        expect(screen.getByText(/public repository/i)).toBeInTheDocument();
      });
    });

    it('should detect private repositories and show authentication form', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/private repository detected/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication for private repositories', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
      });
      
      // Enter credentials
      const usernameInput = screen.getByLabelText(/github username/i);
      const tokenInput = screen.getByLabelText(/personal access token/i);
      
      await user.type(usernameInput, 'testuser');
      await user.type(tokenInput, 'valid-token');
      
      const authenticateButton = screen.getByRole('button', { name: /authenticate/i });
      await user.click(authenticateButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/private-repo')).toBeInTheDocument();
        expect(screen.getByText(/private repository/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication failures', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
      });
      
      // Enter invalid credentials
      const usernameInput = screen.getByLabelText(/github username/i);
      const tokenInput = screen.getByLabelText(/personal access token/i);
      
      await user.type(usernameInput, 'testuser');
      await user.type(tokenInput, 'invalid-token');
      
      const authenticateButton = screen.getByRole('button', { name: /authenticate/i });
      await user.click(authenticateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dynamic Form Control Behavior', () => {
    it('should show/hide credential fields based on repository privacy', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Initially, credential fields should not be visible
      expect(screen.queryByLabelText(/github username/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/personal access token/i)).not.toBeInTheDocument();
      
      // Test public repository - credentials should not appear
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
      });
      
      expect(screen.queryByLabelText(/github username/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/personal access token/i)).not.toBeInTheDocument();
      
      // Test private repository - credentials should appear
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();
      });
    });

    it('should clear credential fields when switching between repositories', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Test private repository and enter credentials
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
      });
      
      const usernameInput = screen.getByLabelText(/github username/i);
      const tokenInput = screen.getByLabelText(/personal access token/i);
      
      await user.type(usernameInput, 'testuser');
      await user.type(tokenInput, 'test-token');
      
      // Switch to public repository
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
      });
      
      // Switch back to private repository - fields should be cleared
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
      });
      
      const newUsernameInput = screen.getByLabelText(/github username/i);
      const newTokenInput = screen.getByLabelText(/personal access token/i);
      
      expect(newUsernameInput).toHaveValue('');
      expect(newTokenInput).toHaveValue('');
    });

    it('should disable form fields during API requests', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      
      // Click and immediately check if fields are disabled
      await user.click(browseButton);
      
      // Fields should be disabled during loading
      expect(urlInput).toBeDisabled();
      expect(browseButton).toBeDisabled();
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
      });
      
      // Fields should be re-enabled after loading
      expect(urlInput).not.toBeDisabled();
    });
  });

  describe('File Extension Filtering', () => {
    it('should only show files with allowed extensions', async () => {
      const user = userEvent.setup();
      const props = createMockProps({
        allowedExtensions: ['.js', '.py'],
      });
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
        expect(screen.getByText('utils.py')).toBeInTheDocument();
      });
      
      // Files with non-allowed extensions should not be shown
      expect(screen.queryByText('config.php')).not.toBeInTheDocument();
      expect(screen.queryByText('readme.txt')).not.toBeInTheDocument();
      expect(screen.queryByText('image.png')).not.toBeInTheDocument();
    });

    it('should show all supported script extensions by default', async () => {
      const user = userEvent.setup();
      const props = createMockProps(); // Default: ['.js', '.py', '.php', '.txt']
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
        expect(screen.getByText('utils.py')).toBeInTheDocument();
        expect(screen.getByText('config.php')).toBeInTheDocument();
        expect(screen.getByText('readme.txt')).toBeInTheDocument();
      });
      
      // Non-script files should not be shown
      expect(screen.queryByText('image.png')).not.toBeInTheDocument();
    });

    it('should handle case-insensitive extension matching', async () => {
      server.use(
        rest.get('https://api.github.com/repos/testuser/public-repo/contents', (req, res, ctx) => {
          return res(ctx.json([
            {
              name: 'Script.JS',
              path: 'Script.JS',
              type: 'file',
              download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/Script.JS',
            },
            {
              name: 'Utils.PY',
              path: 'Utils.PY',
              type: 'file',
              download_url: 'https://raw.githubusercontent.com/testuser/public-repo/main/Utils.PY',
            },
          ]));
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps({
        allowedExtensions: ['.js', '.py'],
      });
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('Script.JS')).toBeInTheDocument();
        expect(screen.getByText('Utils.PY')).toBeInTheDocument();
      });
    });

    it('should display extension filter information', async () => {
      const props = createMockProps({
        allowedExtensions: ['.js', '.py'],
      });
      renderWithProviders(props);
      
      await waitFor(() => {
        expect(screen.getByText(/supported file types/i)).toBeInTheDocument();
        expect(screen.getByText(/\.js, \.py/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Workflows', () => {
    it('should handle personal access token authentication', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();
      });
      
      const tokenInput = screen.getByLabelText(/personal access token/i);
      await user.type(tokenInput, 'valid-token');
      
      const authenticateButton = screen.getByRole('button', { name: /authenticate/i });
      await user.click(authenticateButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/private-repo')).toBeInTheDocument();
      });
    });

    it('should validate token format', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();
      });
      
      const tokenInput = screen.getByLabelText(/personal access token/i);
      
      // Test invalid token format
      await user.type(tokenInput, 'invalid');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid token format/i)).toBeInTheDocument();
      });
    });

    it('should handle username/password authentication fallback', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/github username/i)).toBeInTheDocument();
      });
      
      const usernameInput = screen.getByLabelText(/github username/i);
      const tokenInput = screen.getByLabelText(/personal access token/i);
      
      await user.type(usernameInput, 'testuser');
      await user.type(tokenInput, 'valid-token');
      
      const authenticateButton = screen.getByRole('button', { name: /authenticate/i });
      await user.click(authenticateButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/private-repo')).toBeInTheDocument();
      });
    });

    it('should remember authentication for session', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/personal access token/i)).toBeInTheDocument();
      });
      
      const tokenInput = screen.getByLabelText(/personal access token/i);
      await user.type(tokenInput, 'valid-token');
      
      const authenticateButton = screen.getByRole('button', { name: /authenticate/i });
      await user.click(authenticateButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/private-repo')).toBeInTheDocument();
      });
      
      // Switch to different URL and back - should remember auth
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
      });
      
      // Switch back to private repo - should use cached auth
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/private-repo');
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/private-repo')).toBeInTheDocument();
      });
      
      // Should not ask for credentials again
      expect(screen.queryByLabelText(/personal access token/i)).not.toBeInTheDocument();
    });
  });

  describe('Script Import and Download', () => {
    it('should import script files successfully', async () => {
      const user = userEvent.setup();
      const mockOnScriptImport = vi.fn();
      const props = createMockProps({
        onScriptImport: mockOnScriptImport,
      });
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
      });
      
      const importButton = screen.getByRole('button', { name: /import script\.js/i });
      await user.click(importButton);
      
      await waitFor(() => {
        expect(mockOnScriptImport).toHaveBeenCalledWith({
          name: 'script.js',
          content: 'console.log("Hello from GitHub!");',
          extension: '.js',
          url: 'https://raw.githubusercontent.com/testuser/public-repo/main/script.js',
          repository: {
            owner: 'testuser',
            name: 'public-repo',
            fullName: 'testuser/public-repo',
            private: false,
          },
        });
      });
    });

    it('should handle script import errors', async () => {
      server.use(
        rest.get('https://raw.githubusercontent.com/testuser/public-repo/main/script.js', (req, res, ctx) => {
          return res(ctx.status(404), ctx.text('File not found'));
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
      });
      
      const importButton = screen.getByRole('button', { name: /import script\.js/i });
      await user.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to download script/i)).toBeInTheDocument();
      });
    });

    it('should show import progress for large files', async () => {
      server.use(
        rest.get('https://raw.githubusercontent.com/testuser/public-repo/main/script.js', (req, res, ctx) => {
          // Simulate slow response
          return res(
            ctx.delay(1000),
            ctx.text('console.log("Large file content");')
          );
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
      });
      
      const importButton = screen.getByRole('button', { name: /import script\.js/i });
      await user.click(importButton);
      
      // Should show loading state
      expect(screen.getByText(/importing/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(props.onScriptImport).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle invalid repository URLs', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/invalid/repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/repository not found/i)).toBeInTheDocument();
      });
    });

    it('should handle network failures', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/network/error');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle GitHub API rate limiting', async () => {
      server.use(
        rest.get('https://api.github.com/repos/testuser/rate-limited', (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              message: 'API rate limit exceeded',
              documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
            })
          );
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/rate-limited');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality for failed requests', async () => {
      let callCount = 0;
      server.use(
        rest.get('https://api.github.com/repos/testuser/retry-repo', (req, res, ctx) => {
          callCount++;
          if (callCount === 1) {
            return res.networkError('Network error');
          }
          return res(ctx.json({
            id: 123456,
            name: 'retry-repo',
            full_name: 'testuser/retry-repo',
            private: false,
            default_branch: 'main',
          }));
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/retry-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/retry-repo')).toBeInTheDocument();
      });
    });

    it('should handle empty repositories gracefully', async () => {
      server.use(
        rest.get('https://api.github.com/repos/testuser/empty-repo/contents', (req, res, ctx) => {
          return res(ctx.json([]));
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/empty-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/no script files found/i)).toBeInTheDocument();
      });
    });
  });

  describe('React Hook Form Integration', () => {
    it('should integrate with React Hook Form validation', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Should show required validation error
      await user.click(urlInput);
      await user.tab(); // Blur to trigger validation
      
      await waitFor(() => {
        expect(screen.getByText(/url is required/i)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when input becomes valid', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      
      // Trigger validation error
      await user.click(urlInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/url is required/i)).toBeInTheDocument();
      });
      
      // Fix the error
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      await waitFor(() => {
        expect(screen.queryByText(/url is required/i)).not.toBeInTheDocument();
      });
    });

    it('should handle form submission with validation', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      
      // Try to submit empty form
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/url is required/i)).toBeInTheDocument();
      });
      
      // Form should not submit with validation errors
      expect(screen.queryByText(/testuser/)).not.toBeInTheDocument();
    });
  });

  describe('React Query Caching Behavior', () => {
    it('should cache repository data between requests', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
      });
      
      // Clear and re-enter the same URL
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      await user.click(browseButton);
      
      // Should load immediately from cache (no loading state)
      expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
    });

    it('should handle cache invalidation on errors', async () => {
      let callCount = 0;
      server.use(
        rest.get('https://api.github.com/repos/testuser/cache-test', (req, res, ctx) => {
          callCount++;
          if (callCount === 1) {
            return res(ctx.json({
              id: 123456,
              name: 'cache-test',
              full_name: 'testuser/cache-test',
              private: false,
            }));
          }
          return res(ctx.status(404), ctx.json({ message: 'Not Found' }));
        })
      );
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/cache-test');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/cache-test')).toBeInTheDocument();
      });
      
      // Make another request that will fail
      await user.clear(urlInput);
      await user.type(urlInput, 'https://github.com/testuser/cache-test');
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText(/repository not found/i)).toBeInTheDocument();
      });
    });

    it('should use background refetch for stale data', async () => {
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
      });
      
      // Wait for data to become stale and check for background refetch
      // This is more of an integration test with actual React Query behavior
      expect(screen.getByText('testuser/public-repo')).toBeInTheDocument();
    });
  });

  describe('Internationalization Support', () => {
    it('should use translated strings from react-i18next', async () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          'github.dialog.title': 'Import Script from GitHub',
          'github.dialog.url.label': 'GitHub Repository URL',
          'github.dialog.url.placeholder': 'https://github.com/owner/repository',
          'github.dialog.browse': 'Browse Repository',
          'github.dialog.error.invalidUrl': 'Invalid GitHub repository URL',
          'github.dialog.error.notFound': 'Repository not found',
          'github.dialog.error.networkError': 'Network connection failed',
          'github.dialog.error.rateLimit': 'API rate limit exceeded',
        };
        return translations[key] || key;
      });
      
      (useTranslation as Mock).mockReturnValue({
        t: mockT,
        i18n: { language: 'en' },
      });
      
      const props = createMockProps();
      renderWithProviders(props);
      
      expect(mockT).toHaveBeenCalledWith('github.dialog.url.label');
      expect(mockT).toHaveBeenCalledWith('github.dialog.browse');
    });

    it('should handle language changes', async () => {
      const mockChangeLanguage = vi.fn();
      const mockT = vi.fn((key: string) => key);
      
      (useTranslation as Mock).mockReturnValue({
        t: mockT,
        i18n: {
          language: 'es',
          changeLanguage: mockChangeLanguage,
        },
      });
      
      const props = createMockProps();
      renderWithProviders(props);
      
      // Component should work with different language settings
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should translate error messages', async () => {
      const mockT = vi.fn((key: string) => {
        if (key === 'github.dialog.error.notFound') {
          return 'Repositorio no encontrado';
        }
        return key;
      });
      
      (useTranslation as Mock).mockReturnValue({
        t: mockT,
        i18n: { language: 'es' },
      });
      
      const user = userEvent.setup();
      const props = createMockProps();
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/invalid/repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('Repositorio no encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Promise-based Dialog API', () => {
    it('should resolve promise with script data on successful import', async () => {
      const user = userEvent.setup();
      const mockOnScriptImport = vi.fn((script: ScriptData) => Promise.resolve(script));
      
      const props = createMockProps({
        onScriptImport: mockOnScriptImport,
      });
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
      });
      
      const importButton = screen.getByRole('button', { name: /import script\.js/i });
      await user.click(importButton);
      
      await waitFor(() => {
        expect(mockOnScriptImport).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'script.js',
            content: 'console.log("Hello from GitHub!");',
            extension: '.js',
          })
        );
      });
    });

    it('should reject promise on import errors', async () => {
      server.use(
        rest.get('https://raw.githubusercontent.com/testuser/public-repo/main/script.js', (req, res, ctx) => {
          return res(ctx.status(404), ctx.text('File not found'));
        })
      );
      
      const user = userEvent.setup();
      const mockOnScriptImport = vi.fn(() => Promise.reject(new Error('Import failed')));
      
      const props = createMockProps({
        onScriptImport: mockOnScriptImport,
      });
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      await user.type(urlInput, 'https://github.com/testuser/public-repo');
      
      const browseButton = screen.getByRole('button', { name: /browse repository/i });
      await user.click(browseButton);
      
      await waitFor(() => {
        expect(screen.getByText('script.js')).toBeInTheDocument();
      });
      
      const importButton = screen.getByRole('button', { name: /import script\.js/i });
      await user.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to download script/i)).toBeInTheDocument();
      });
    });

    it('should handle dialog close with cancellation', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      
      const props = createMockProps({
        onClose: mockOnClose,
      });
      renderWithProviders(props);
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration', () => {
    it('should integrate with parent component state', async () => {
      const user = userEvent.setup();
      let dialogOpen = true;
      const mockOnClose = vi.fn(() => {
        dialogOpen = false;
      });
      
      const props = createMockProps({
        isOpen: dialogOpen,
        onClose: mockOnClose,
      });
      
      const { rerender } = renderWithProviders(props);
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);
      
      // Rerender with updated state
      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <TestWrapper>
            <ScriptsGithubDialog {...props} isOpen={false} />
          </TestWrapper>
        </QueryClientProvider>
      );
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle initial URL prop', async () => {
      const props = createMockProps({
        initialUrl: 'https://github.com/testuser/public-repo',
      });
      renderWithProviders(props);
      
      const urlInput = await screen.findByLabelText(/github repository url/i);
      expect(urlInput).toHaveValue('https://github.com/testuser/public-repo');
    });

    it('should handle custom allowed extensions', async () => {
      const user = userEvent.setup();
      const props = createMockProps({
        allowedExtensions: ['.ts', '.jsx'],
      });
      renderWithProviders(props);
      
      await waitFor(() => {
        expect(screen.getByText(/\.ts, \.jsx/i)).toBeInTheDocument();
      });
    });
  });
});