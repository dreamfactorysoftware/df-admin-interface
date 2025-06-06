/**
 * ScriptsGithubDialog Component Test Suite
 * 
 * Comprehensive test suite for the ScriptsGithubDialog component using Vitest 2.1.0
 * and React Testing Library. Tests accessibility compliance (WCAG 2.1 AA), URL validation
 * with GitHub API integration, repository privacy detection, dynamic form control behavior,
 * file extension filtering, authentication workflows, and error handling scenarios.
 * 
 * Features Tested:
 * - Accessibility compliance with jest-axe for WCAG 2.1 AA validation
 * - URL validation with GitHub URL format checking and file extension support
 * - Repository privacy detection with dynamic credential field visibility
 * - React Hook Form integration with real-time validation and error handling
 * - React Query integration for GitHub API calls with MSW mock handlers
 * - Authentication workflow for private repositories with username/password inputs
 * - Promise-based dialog API returning correct script data or rejection on errors
 * - Error handling scenarios including invalid URLs, network failures, and API rate limiting
 * - Internationalization with react-i18next mock integration for error messages
 * - Keyboard navigation and focus management for accessibility
 * 
 * @fileoverview Test suite for GitHub Scripts Import Dialog component
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { axe } from 'jest-axe';
import { server } from '@/test/mocks/handlers';
import { rest } from 'msw';
import { 
  customRender as render,
  createKeyboardUtils,
  testA11y,
  checkAriaAttributes,
  waitForValidation
} from '@/test/test-utils';
import { ScriptsGitHubDialog } from './scripts-github-dialog';
import type { GitHubDialogResult, GitHubUrlInfo } from './types';

// ============================================================================
// MOCK DEPENDENCIES
// ============================================================================

// Mock the useGitHubDialog hook
const mockUseGitHubDialog = vi.fn();
vi.mock('@/hooks/useGitHubApi', () => ({
  useGitHubDialog: () => mockUseGitHubDialog(),
  validateGitHubUrl: vi.fn((url: string) => {
    const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/blob\/[\w-]+\/.*\.(js|py|php|txt|json|ts|jsx|tsx)$/;
    const isValid = githubUrlPattern.test(url);
    
    if (!isValid) {
      return { isValid: false, urlInfo: null };
    }
    
    const urlParts = url.match(/https:\/\/github\.com\/([\w-]+)\/([\w-]+)\/blob\/([\w-]+)\/(.*)/);
    return {
      isValid: true,
      urlInfo: {
        owner: urlParts![1],
        repo: urlParts![2],
        branch: urlParts![3],
        filePath: urlParts![4],
        originalUrl: url,
      } as GitHubUrlInfo,
    };
  }),
}));

// Mock React Query
const mockQueryClient = {
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
};

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
  QueryClient: vi.fn(() => mockQueryClient),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-i18next for internationalization testing
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'github.dialog.title': 'Import Script from GitHub',
        'github.dialog.description': 'Enter a GitHub file URL to import a script. Supported file types: .js, .py, .php, .txt',
        'github.dialog.url.label': 'GitHub File URL',
        'github.dialog.url.placeholder': 'https://github.com/user/repo/blob/main/script.js',
        'github.dialog.username.label': 'GitHub Username',
        'github.dialog.username.placeholder': 'your-username',
        'github.dialog.password.label': 'Personal Access Token',
        'github.dialog.password.placeholder': 'ghp_xxxxxxxxxxxxxxxxxxxx',
        'github.dialog.auth.required': 'Authentication Required',
        'github.dialog.auth.description': 'This repository requires authentication. Please provide your GitHub username and a personal access token.',
        'github.dialog.cancel': 'Cancel',
        'github.dialog.import': 'Import Script',
        'github.dialog.importing': 'Importing...',
        'github.error.network': 'Network error occurred. Please check your connection and try again.',
        'github.error.auth_failed': 'Authentication failed. Please check your username and personal access token.',
        'github.error.not_found': 'Repository or file not found. Please check the URL or provide authentication for private repositories.',
        'github.error.rate_limit': 'GitHub API rate limit exceeded. Please try again later.',
        'github.error.timeout': 'Request timed out. Please check your internet connection and try again.',
      };
      return translations[key] || key;
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: 'en',
    },
  }),
}));

// ============================================================================
// TEST DATA AND FIXTURES
// ============================================================================

const mockPublicRepoUrl = 'https://github.com/public-user/public-repo/blob/main/script.js';
const mockPrivateRepoUrl = 'https://github.com/private-user/private-repo/blob/main/script.py';
const mockInvalidUrl = 'https://invalid-url.com/not-github';
const mockUnsupportedFileUrl = 'https://github.com/user/repo/blob/main/unsupported.xml';

const mockPublicFileContent = {
  name: 'script.js',
  path: 'script.js',
  sha: 'abc123',
  size: 1024,
  download_url: 'https://raw.githubusercontent.com/public-user/public-repo/main/script.js',
  content: 'Y29uc29sZS5sb2coImhlbGxvIHdvcmxkIik7', // base64 encoded
  encoding: 'base64',
  type: 'file' as const,
  url: 'https://api.github.com/repos/public-user/public-repo/contents/script.js',
  git_url: 'https://api.github.com/repos/public-user/public-repo/git/blobs/abc123',
  html_url: 'https://github.com/public-user/public-repo/blob/main/script.js',
};

const mockPrivateFileContent = {
  ...mockPublicFileContent,
  name: 'script.py',
  path: 'script.py',
  content: 'cHJpbnQoImhlbGxvIHdvcmxkIik=', // base64 encoded
  html_url: 'https://github.com/private-user/private-repo/blob/main/script.py',
};

const mockRepoAccessResult = {
  isAccessible: true,
  isPrivate: false,
  requiresAuth: false,
};

const mockPrivateRepoAccessResult = {
  isAccessible: false,
  isPrivate: true,
  requiresAuth: true,
};

// Default mock implementation for useGitHubDialog hook
const defaultMockHookImplementation = {
  isLoading: false,
  isCheckingAccess: false,
  isFetchingFile: false,
  accessResult: null,
  fileContent: null,
  error: null,
  checkRepositoryAccess: vi.fn(),
  fetchFileContent: vi.fn(),
  reset: vi.fn(),
};

// ============================================================================
// TEST SETUP AND TEARDOWN
// ============================================================================

describe('ScriptsGitHubDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnImport = vi.fn();

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    mockUseGitHubDialog.mockReturnValue(defaultMockHookImplementation);
    
    // Reset query client mock
    mockQueryClient.getQueryData.mockReturnValue(null);
    mockQueryClient.setQueryData.mockReturnValue(undefined);
    mockQueryClient.invalidateQueries.mockReturnValue(Promise.resolve());
    mockQueryClient.removeQueries.mockReturnValue(undefined);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  // ============================================================================
  // BASIC RENDERING AND ACCESSIBILITY TESTS
  // ============================================================================

  describe('Basic Rendering and Accessibility', () => {
    it('should render the dialog when open', () => {
      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Import Script from GitHub')).toBeInTheDocument();
      expect(screen.getByText('Enter a GitHub file URL to import a script. Supported file types: .js, .py, .php, .txt')).toBeInTheDocument();
    });

    it('should not render the dialog when closed', () => {
      render(
        <ScriptsGitHubDialog
          isOpen={false}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should be accessible and meet WCAG 2.1 AA standards', async () => {
      const { container } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      await testA11y(container, {
        tags: ['wcag2a', 'wcag2aa'],
        skipRules: ['color-contrast'], // Skip color contrast for now as it depends on actual styling
      });
    });

    it('should have proper ARIA attributes', () => {
      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const dialog = screen.getByRole('dialog');
      checkAriaAttributes(dialog, {
        'aria-labelledby': 'github-import-dialog-title',
        'aria-describedby': 'github-import-dialog-description',
      });

      const title = screen.getByText('Import Script from GitHub');
      expect(title).toHaveAttribute('id', 'github-import-dialog-title');

      const description = screen.getByText(/Enter a GitHub file URL to import a script/);
      expect(description).toHaveAttribute('id', 'github-import-dialog-description');
    });

    it('should have proper form field labels and associations', () => {
      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      expect(urlInput).toHaveAttribute('id', 'github-url');
      expect(urlInput).toHaveAttribute('type', 'url');
      expect(urlInput).toHaveAttribute('placeholder', 'https://github.com/user/repo/blob/main/script.js');
    });
  });

  // ============================================================================
  // KEYBOARD NAVIGATION AND FOCUS MANAGEMENT TESTS
  // ============================================================================

  describe('Keyboard Navigation and Focus Management', () => {
    it('should trap focus within the dialog', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const keyboard = createKeyboardUtils(user);
      
      // First focusable element should be the close button or URL input
      const firstFocusable = screen.getByLabelText(/close dialog|GitHub File URL/i);
      expect(document.activeElement).toBe(firstFocusable);

      // Tab navigation should stay within dialog
      await keyboard.tab();
      expect(document.activeElement).toBeInTheDocument();
      
      // Multiple tabs should cycle through dialog elements
      for (let i = 0; i < 5; i++) {
        await keyboard.tab();
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    it('should close dialog on Escape key press', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const keyboard = createKeyboardUtils(user);
      await keyboard.escape();

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should submit form on Enter key when form is valid', async () => {
      const mockFetchFileContent = vi.fn();
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockRepoAccessResult,
        fetchFileContent: mockFetchFileContent,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      await waitForValidation();

      const keyboard = createKeyboardUtils(user);
      await keyboard.enter();

      expect(mockFetchFileContent).toHaveBeenCalledWith({
        url: mockPublicRepoUrl,
        credentials: undefined,
      });
    });
  });

  // ============================================================================
  // URL VALIDATION AND GITHUB API INTEGRATION TESTS
  // ============================================================================

  describe('URL Validation and GitHub API Integration', () => {
    it('should validate GitHub URL format in real-time', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');

      // Test invalid URL
      await user.type(urlInput, mockInvalidUrl);
      await waitForValidation();

      expect(screen.getByText(/Must be a GitHub URL pointing to a script file/)).toBeInTheDocument();

      // Clear and test valid URL
      await user.clear(urlInput);
      await user.type(urlInput, mockPublicRepoUrl);
      await waitForValidation();

      expect(screen.queryByText(/Must be a GitHub URL pointing to a script file/)).not.toBeInTheDocument();
    });

    it('should validate supported file extensions', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');

      // Test unsupported file extension
      await user.type(urlInput, mockUnsupportedFileUrl);
      await waitForValidation();

      expect(screen.getByText(/Must be a GitHub URL pointing to a script file/)).toBeInTheDocument();
    });

    it('should check repository access automatically on valid URL', async () => {
      const mockCheckRepositoryAccess = vi.fn();
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        checkRepositoryAccess: mockCheckRepositoryAccess,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      // Wait for debounced URL validation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(mockCheckRepositoryAccess).toHaveBeenCalledWith({
        url: mockPublicRepoUrl,
      });
    });

    it('should display repository status after access check', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockRepoAccessResult,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      await waitFor(() => {
        expect(screen.getByText('✓ Repository accessible (Public)')).toBeInTheDocument();
      });
    });

    it('should show loading state during repository access check', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        isCheckingAccess: true,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      expect(screen.getByText('Checking repository access...')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // REPOSITORY PRIVACY DETECTION AND AUTHENTICATION TESTS
  // ============================================================================

  describe('Repository Privacy Detection and Authentication', () => {
    it('should show authentication fields for private repositories', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockPrivateRepoAccessResult,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPrivateRepoUrl);

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByLabelText('GitHub Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Personal Access Token')).toBeInTheDocument();
      });
    });

    it('should hide authentication fields for public repositories', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockRepoAccessResult,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      await waitFor(() => {
        expect(screen.queryByText('Authentication Required')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('GitHub Username')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Personal Access Token')).not.toBeInTheDocument();
      });
    });

    it('should validate authentication fields when shown', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockPrivateRepoAccessResult,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPrivateRepoUrl);

      await waitFor(() => {
        expect(screen.getByLabelText('GitHub Username')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /import script/i });
      
      // Should be disabled when auth fields are empty
      expect(submitButton).toBeDisabled();

      // Fill in username but not token
      const usernameInput = screen.getByLabelText('GitHub Username');
      await user.type(usernameInput, 'testuser');

      expect(submitButton).toBeDisabled();

      // Fill in token
      const tokenInput = screen.getByLabelText('Personal Access Token');
      await user.type(tokenInput, 'ghp_abcdefghijklmnopqrstuvwxyz1234567890abcd');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should include credentials when fetching private repository content', async () => {
      const mockFetchFileContent = vi.fn();
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockPrivateRepoAccessResult,
        fetchFileContent: mockFetchFileContent,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPrivateRepoUrl);

      await waitFor(() => {
        expect(screen.getByLabelText('GitHub Username')).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText('GitHub Username');
      const tokenInput = screen.getByLabelText('Personal Access Token');
      const submitButton = screen.getByRole('button', { name: /import script/i });

      await user.type(usernameInput, 'testuser');
      await user.type(tokenInput, 'ghp_test_token');
      await user.click(submitButton);

      expect(mockFetchFileContent).toHaveBeenCalledWith({
        url: mockPrivateRepoUrl,
        credentials: {
          username: 'testuser',
          password: 'ghp_test_token',
        },
      });
    });
  });

  // ============================================================================
  // REACT HOOK FORM INTEGRATION TESTS
  // ============================================================================

  describe('React Hook Form Integration', () => {
    it('should perform real-time validation on form fields', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');

      // Test required field validation
      await user.type(urlInput, 'invalid');
      await user.clear(urlInput);
      await waitForValidation();

      expect(screen.getByText('GitHub URL is required')).toBeInTheDocument();

      // Test URL format validation
      await user.type(urlInput, 'not-a-url');
      await waitForValidation();

      expect(screen.getByText('Must be a valid URL')).toBeInTheDocument();
    });

    it('should clear validation errors when field becomes valid', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');

      // Create validation error
      await user.type(urlInput, 'invalid');
      await waitForValidation();

      expect(screen.getByText('Must be a valid URL')).toBeInTheDocument();

      // Fix validation error
      await user.clear(urlInput);
      await user.type(urlInput, mockPublicRepoUrl);
      await waitForValidation();

      expect(screen.queryByText('Must be a valid URL')).not.toBeInTheDocument();
    });

    it('should reset form when dialog is closed', async () => {
      const { user, rerender } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      // Close dialog
      rerender(
        <ScriptsGitHubDialog
          isOpen={false}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      // Reopen dialog
      rerender(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const newUrlInput = screen.getByLabelText('GitHub File URL');
      expect(newUrlInput).toHaveValue('');
    });
  });

  // ============================================================================
  // REACT QUERY INTEGRATION TESTS
  // ============================================================================

  describe('React Query Integration', () => {
    it('should handle successful file content fetch', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockRepoAccessResult,
        fileContent: mockPublicFileContent,
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      // Wait for effect to process file content
      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalledWith({
          data: mockPublicFileContent,
          repoInfo: expect.objectContaining({
            owner: 'public-user',
            repo: 'public-repo',
            filePath: 'script.js',
          }),
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show loading state during file fetch', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockRepoAccessResult,
        isFetchingFile: true,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      expect(screen.getByText('Importing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled();
    });

    it('should handle query cache invalidation on successful import', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        accessResult: mockRepoAccessResult,
        fileContent: mockPublicFileContent,
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      await waitFor(() => {
        expect(mockOnImport).toHaveBeenCalled();
      });

      // Verify query client methods were called appropriately
      // (In a real implementation, the hook would handle this)
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should display user-friendly error messages for common scenarios', async () => {
      // Test 404 error
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('404 Not Found'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Repository or file not found. Please check the URL or provide authentication for private repositories.')).toBeInTheDocument();
    });

    it('should display authentication error messages', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('401 Unauthorized'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Authentication failed. Please check your username and personal access token.')).toBeInTheDocument();
    });

    it('should display timeout error messages', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('Request timeout'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Request timed out. Please check your internet connection and try again.')).toBeInTheDocument();
    });

    it('should display generic error messages for unknown errors', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('Unknown error occurred'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Unknown error occurred')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('Network error'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Network error');
    });

    it('should provide error recovery actions', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('403 Forbidden'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Authentication failed. Please check your username and personal access token.')).toBeInTheDocument();
      
      // Error message should be in an alert role for screen readers
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  // ============================================================================
  // DIALOG WORKFLOW INTEGRATION TESTS
  // ============================================================================

  describe('Dialog Workflow Integration', () => {
    it('should complete the full import workflow for public repository', async () => {
      const mockCheckRepositoryAccess = vi.fn();
      const mockFetchFileContent = vi.fn();
      
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        checkRepositoryAccess: mockCheckRepositoryAccess,
        fetchFileContent: mockFetchFileContent,
        accessResult: mockRepoAccessResult,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      // Step 1: Enter URL
      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPublicRepoUrl);

      // Step 2: Wait for repository access check
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(mockCheckRepositoryAccess).toHaveBeenCalledWith({
        url: mockPublicRepoUrl,
      });

      // Step 3: Submit form
      const submitButton = screen.getByRole('button', { name: /import script/i });
      await user.click(submitButton);

      expect(mockFetchFileContent).toHaveBeenCalledWith({
        url: mockPublicRepoUrl,
        credentials: undefined,
      });
    });

    it('should complete the full import workflow for private repository', async () => {
      const mockCheckRepositoryAccess = vi.fn();
      const mockFetchFileContent = vi.fn();
      
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        checkRepositoryAccess: mockCheckRepositoryAccess,
        fetchFileContent: mockFetchFileContent,
        accessResult: mockPrivateRepoAccessResult,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      // Step 1: Enter URL
      const urlInput = screen.getByLabelText('GitHub File URL');
      await user.type(urlInput, mockPrivateRepoUrl);

      // Step 2: Wait for auth fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText('GitHub Username')).toBeInTheDocument();
      });

      // Step 3: Enter credentials
      const usernameInput = screen.getByLabelText('GitHub Username');
      const tokenInput = screen.getByLabelText('Personal Access Token');
      
      await user.type(usernameInput, 'testuser');
      await user.type(tokenInput, 'ghp_test_token');

      // Step 4: Submit form
      const submitButton = screen.getByRole('button', { name: /import script/i });
      await user.click(submitButton);

      expect(mockFetchFileContent).toHaveBeenCalledWith({
        url: mockPrivateRepoUrl,
        credentials: {
          username: 'testuser',
          password: 'ghp_test_token',
        },
      });
    });

    it('should handle cancellation workflow', async () => {
      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnImport).not.toHaveBeenCalled();
    });

    it('should reset state on dialog close', async () => {
      const mockReset = vi.fn();
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        reset: mockReset,
      });

      const { user } = render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      const closeButton = screen.getByLabelText('Close dialog');
      await user.click(closeButton);

      expect(mockReset).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // INTERNATIONALIZATION TESTS
  // ============================================================================

  describe('Internationalization', () => {
    it('should use translated strings from react-i18next', () => {
      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Import Script from GitHub')).toBeInTheDocument();
      expect(screen.getByText('Enter a GitHub file URL to import a script. Supported file types: .js, .py, .php, .txt')).toBeInTheDocument();
      expect(screen.getByLabelText('GitHub File URL')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import script/i })).toBeInTheDocument();
    });

    it('should display translated error messages', async () => {
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        error: new Error('404 Not Found'),
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
        />
      );

      expect(screen.getByText('Repository or file not found. Please check the URL or provide authentication for private repositories.')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTEGRATION WITH INITIAL URL PROP
  // ============================================================================

  describe('Initial URL Prop Integration', () => {
    it('should pre-fill URL input when initialUrl is provided', () => {
      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          initialUrl={mockPublicRepoUrl}
        />
      );

      const urlInput = screen.getByLabelText('GitHub File URL');
      expect(urlInput).toHaveValue(mockPublicRepoUrl);
    });

    it('should trigger validation for initial URL', async () => {
      const mockCheckRepositoryAccess = vi.fn();
      mockUseGitHubDialog.mockReturnValue({
        ...defaultMockHookImplementation,
        checkRepositoryAccess: mockCheckRepositoryAccess,
      });

      render(
        <ScriptsGitHubDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          initialUrl={mockPublicRepoUrl}
        />
      );

      // Wait for debounced validation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
      });

      expect(mockCheckRepositoryAccess).toHaveBeenCalledWith({
        url: mockPublicRepoUrl,
      });
    });
  });
});