/**
 * LinkService Component Test Suite
 * 
 * Comprehensive test coverage for the LinkService component using Vitest, React Testing Library,
 * and MSW integration. Tests form validation, service operations, accessibility compliance,
 * and user interactions per React/Next.js testing standards.
 * 
 * Test Coverage:
 * - Component rendering and state management
 * - React Hook Form integration with Zod validation
 * - Storage service API operations with MSW mocking
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Keyboard navigation and screen reader support
 * - Theme integration and responsive behavior
 * - Error handling and loading states
 * - Performance optimization validation
 * 
 * @fileoverview LinkService component test suite
 * @version 1.0.0
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { axe } from 'jest-axe';

// Component and utilities
import { LinkService } from './link-service';
import type { LinkServiceProps, StorageService } from './link-service.types';
import { 
  customRender, 
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  waitForValidation,
  measureRenderTime,
  type CustomRenderOptions 
} from '../../../test/test-utils';

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

/**
 * Mock storage services data for testing
 * Includes various service types to test filtering and selection
 */
const mockStorageServices: StorageService[] = [
  {
    id: 1,
    name: 'github_prod',
    label: 'Production GitHub',
    description: 'Production GitHub repository service',
    isActive: true,
    type: 'github',
    mutable: true,
    deletable: true,
    createdDate: '2024-01-15T10:30:00Z',
    lastModifiedDate: '2024-03-10T14:45:00Z',
    createdById: 1,
    lastModifiedById: 1,
    config: {
      baseUrl: 'https://api.github.com',
      authentication: 'token',
      token: '***hidden***',
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 2,
    name: 'github_staging',
    label: 'Staging GitHub',
    description: 'Staging GitHub repository service',
    isActive: true,
    type: 'github',
    mutable: true,
    deletable: true,
    createdDate: '2024-02-01T09:00:00Z',
    lastModifiedDate: '2024-03-12T11:20:00Z',
    createdById: 2,
    lastModifiedById: 1,
    config: {
      baseUrl: 'https://api.github.com',
      authentication: 'token',
      token: '***hidden***',
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 3,
    name: 'file_storage',
    label: 'Local File Storage',
    description: 'Local file system storage',
    isActive: true,
    type: 'file',
    mutable: true,
    deletable: true,
    createdDate: '2024-02-20T16:45:00Z',
    lastModifiedDate: '2024-03-08T13:30:00Z',
    createdById: 3,
    lastModifiedById: 3,
    config: {
      basePath: '/var/storage',
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
  {
    id: 4,
    name: 'dropbox_service',
    label: 'Dropbox Storage',
    description: 'Cloud storage via Dropbox',
    isActive: false,
    type: 'dropbox',
    mutable: true,
    deletable: true,
    createdDate: '2024-01-20T12:00:00Z',
    lastModifiedDate: '2024-03-01T10:15:00Z',
    createdById: 2,
    lastModifiedById: 2,
    config: {
      apiKey: '***hidden***',
    },
    serviceDocByServiceId: null,
    refresh: false,
  },
];

/**
 * Mock file content for testing file operations
 */
const mockFileContent = {
  json: '{"name": "test-config", "version": "1.0.0", "description": "Test configuration file"}',
  javascript: 'function testFunction() {\n  return "Hello World";\n}',
  text: 'This is a test file content\nLine 2\nLine 3',
};

/**
 * MSW handlers for LinkService API endpoints
 */
const linkServiceHandlers = [
  // Storage services list endpoint
  http.get('/api/storage-services', ({ request }) => {
    const url = new URL(request.url);
    const group = url.searchParams.get('group');
    
    // Filter services by group if specified
    let services = mockStorageServices;
    if (group) {
      const groupTypes = group.split(',').map(g => g.trim());
      services = mockStorageServices.filter(service => 
        groupTypes.some(type => service.type.includes(type))
      );
    }
    
    return HttpResponse.json({
      resource: services,
      meta: {
        count: services.length,
        total: services.length,
      }
    });
  }),

  // File content retrieval endpoint
  http.get('/api/storage/:path*', ({ params, request }) => {
    const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
    const url = new URL(request.url);
    const content = url.searchParams.get('content');
    
    // Simulate different file types
    if (path?.includes('.json')) {
      return new HttpResponse(mockFileContent.json, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else if (path?.includes('.js')) {
      return new HttpResponse(mockFileContent.javascript, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    } else {
      return new HttpResponse(mockFileContent.text, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  }),

  // Cache deletion endpoint
  http.delete('/api/cache/_event/:cacheKey', ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: `Cache ${params.cacheKey} deleted successfully`,
    });
  }),

  // Error scenarios for testing
  http.get('/api/storage/error-service/*', () => {
    return HttpResponse.json(
      {
        error: {
          code: 404,
          message: 'File not found',
          details: 'The requested file does not exist in the repository',
        },
      },
      { status: 404 }
    );
  }),

  http.delete('/api/cache/_event/error-cache', () => {
    return HttpResponse.json(
      {
        error: {
          code: 500,
          message: 'Cache deletion failed',
          details: 'Internal server error while deleting cache',
        },
      },
      { status: 500 }
    );
  }),
];

/**
 * Test server setup
 */
const server = setupServer(...linkServiceHandlers);

/**
 * Mock storage services hook
 */
vi.mock('@/hooks/use-storage-services', () => ({
  useStorageServices: vi.fn(() => ({
    data: mockStorageServices,
    error: null,
    isLoading: false,
  })),
}));

/**
 * Mock theme hook
 */
vi.mock('@/hooks/use-theme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    isDarkMode: false,
    setTheme: vi.fn(),
  })),
}));

/**
 * Mock utility functions
 */
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
  readAsText: vi.fn((blob: Blob) => 
    Promise.resolve(blob.text ? blob.text() : 'mocked file content')
  ),
}));

// ============================================================================
// TEST SETUP AND HELPERS
// ============================================================================

/**
 * Default props for LinkService component
 */
const defaultProps: LinkServiceProps = {
  storageServiceId: 'github_prod',
  onContentChange: vi.fn(),
  onStoragePathChange: vi.fn(),
};

/**
 * Helper function to render LinkService with custom options
 */
const renderLinkService = (
  props: Partial<LinkServiceProps> = {},
  options: CustomRenderOptions = {}
) => {
  const mergedProps = { ...defaultProps, ...props };
  return customRender(<LinkService {...mergedProps} />, options);
};

/**
 * Helper function to render LinkService with form provider
 */
const renderLinkServiceWithForm = (
  props: Partial<LinkServiceProps> = {},
  formOptions: { defaultValues?: any } = {}
) => {
  const mergedProps = { ...defaultProps, ...props };
  return renderWithForm(<LinkService {...mergedProps} />, formOptions);
};

/**
 * Helper function to fill form fields
 */
const fillFormFields = async (user: any, data: {
  service?: string;
  repository?: string;
  branch?: string;
  path?: string;
}) => {
  if (data.service) {
    const serviceSelect = screen.getByRole('combobox', { name: /select service/i });
    await user.selectOptions(serviceSelect, data.service);
  }
  
  if (data.repository) {
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    await user.clear(repoInput);
    await user.type(repoInput, data.repository);
  }
  
  if (data.branch) {
    const branchInput = screen.getByRole('textbox', { name: /branch/i });
    await user.clear(branchInput);
    await user.type(branchInput, data.branch);
  }
  
  if (data.path) {
    const pathInput = screen.getByRole('textbox', { name: /path/i });
    await user.clear(pathInput);
    await user.type(pathInput, data.path);
  }
};

// ============================================================================
// TEST SUITE SETUP
// ============================================================================

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
  vi.clearAllMocks();
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// COMPONENT RENDERING TESTS
// ============================================================================

describe('LinkService Component - Rendering', () => {
  it('should render component with default state', () => {
    renderLinkService();
    
    // Check for disclosure button
    expect(screen.getByRole('button', { name: /link to service/i })).toBeInTheDocument();
    
    // Panel should be collapsed by default
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('should expand panel when disclosure button is clicked', async () => {
    const { user } = renderLinkService();
    
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    await user.click(disclosureButton);
    
    // Panel should now be visible
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /select service/i })).toBeInTheDocument();
  });

  it('should render with expanded state when defaultExpanded is true', () => {
    renderLinkService({ defaultExpanded: true });
    
    // Panel should be visible immediately
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('should not render when no GitHub services are available', () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: mockStorageServices.filter(s => s.type !== 'github'),
      error: null,
      isLoading: false,
    });

    const { container } = renderLinkService();
    
    // Component should not render anything
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when services are being fetched', () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: [],
      error: null,
      isLoading: true,
    });

    renderLinkService();
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading storage services/i)).toBeInTheDocument();
  });

  it('should show error state when services fail to load', () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: [],
      error: new Error('Failed to fetch services'),
      isLoading: false,
    });

    renderLinkService();
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/failed to load storage services/i)).toBeInTheDocument();
  });
});

// ============================================================================
// FORM VALIDATION TESTS
// ============================================================================

describe('LinkService Component - Form Validation', () => {
  beforeEach(async () => {
    const { user } = renderLinkService();
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    await user.click(disclosureButton);
  });

  it('should show validation errors for required fields', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please select a service/i)).toBeInTheDocument();
      expect(screen.getByText(/repository name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/branch or tag is required/i)).toBeInTheDocument();
      expect(screen.getByText(/file path is required/i)).toBeInTheDocument();
    });
  });

  it('should validate repository name format', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Enter invalid repository name
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    await user.type(repoInput, 'invalid repo name!@#');
    
    await waitForValidation();
    
    expect(screen.getByText(/invalid repository name format/i)).toBeInTheDocument();
  });

  it('should validate maximum field lengths', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Enter overly long values
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    const longString = 'a'.repeat(300);
    await user.type(repoInput, longString);
    
    await waitForValidation();
    
    expect(screen.getByText(/repository name too long/i)).toBeInTheDocument();
  });

  it('should validate branch name length', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const branchInput = screen.getByRole('textbox', { name: /branch/i });
    const longBranch = 'a'.repeat(150);
    await user.clear(branchInput);
    await user.type(branchInput, longBranch);
    
    await waitForValidation();
    
    expect(screen.getByText(/branch name too long/i)).toBeInTheDocument();
  });

  it('should validate file path length', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const pathInput = screen.getByRole('textbox', { name: /path/i });
    const longPath = 'path/'.repeat(100) + 'file.js';
    await user.type(pathInput, longPath);
    
    await waitForValidation();
    
    expect(screen.getByText(/file path too long/i)).toBeInTheDocument();
  });

  it('should enable submit button when form is valid', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill all required fields with valid data
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    await waitForValidation();
    
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('should perform real-time validation on field changes', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    
    // Type invalid characters
    await user.type(repoInput, 'invalid!');
    await waitForValidation(100);
    expect(screen.getByText(/invalid repository name format/i)).toBeInTheDocument();
    
    // Clear and type valid name
    await user.clear(repoInput);
    await user.type(repoInput, 'valid-repo');
    await waitForValidation(100);
    expect(screen.queryByText(/invalid repository name format/i)).not.toBeInTheDocument();
  });
});

// ============================================================================
// SERVICE OPERATIONS TESTS
// ============================================================================

describe('LinkService Component - Service Operations', () => {
  beforeEach(async () => {
    const { user } = renderLinkService();
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    await user.click(disclosureButton);
  });

  it('should fetch file content when View Latest is clicked', async () => {
    const mockOnContentChange = vi.fn();
    const { user } = renderLinkService({ onContentChange: mockOnContentChange });
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill form with valid data
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for operation to complete
    await waitFor(() => {
      expect(mockOnContentChange).toHaveBeenCalledWith(mockFileContent.json);
    });
  });

  it('should handle file content fetch errors', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill form with error-triggering service
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'error-service',
      branch: 'main',
      path: 'nonexistent.json'
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch file/i)).toBeInTheDocument();
    });
  });

  it('should delete cache when Delete Cache button is clicked', async () => {
    const { user } = renderLinkService({ cache: 'test-cache-key' });
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const deleteCacheButton = screen.getByRole('button', { name: /delete cache/i });
    await user.click(deleteCacheButton);
    
    // Should show deleting state
    expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    
    // Wait for operation to complete
    await waitFor(() => {
      expect(screen.queryByText(/deleting/i)).not.toBeInTheDocument();
    });
  });

  it('should handle cache deletion errors', async () => {
    const { user } = renderLinkService({ cache: 'error-cache' });
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const deleteCacheButton = screen.getByRole('button', { name: /delete cache/i });
    await user.click(deleteCacheButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to delete cache/i)).toBeInTheDocument();
    });
  });

  it('should not show Delete Cache button when no cache is provided', async () => {
    const { user } = renderLinkService({ cache: undefined });
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    expect(screen.queryByRole('button', { name: /delete cache/i })).not.toBeInTheDocument();
  });

  it('should update storage path when form values change', async () => {
    const mockOnStoragePathChange = vi.fn();
    const { user } = renderLinkService({ onStoragePathChange: mockOnStoragePathChange });
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill form fields one by one
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    await waitFor(() => {
      expect(mockOnStoragePathChange).toHaveBeenCalledWith(
        'Production GitHub/_repo/test-repo?branch=main&path=config/app.json'
      );
    });
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('LinkService Component - Accessibility', () => {
  it('should have no accessibility violations in default state', async () => {
    const { container } = renderLinkService();
    await testA11y(container);
  });

  it('should have no accessibility violations when expanded', async () => {
    const { container, user } = renderLinkService();
    
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    await user.click(disclosureButton);
    
    await testA11y(container);
  });

  it('should have proper ARIA attributes on disclosure button', async () => {
    const { user } = renderLinkService();
    
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    
    checkAriaAttributes(disclosureButton, {
      'aria-expanded': 'false',
      'aria-controls': 'link-service-panel',
    });
    
    await user.click(disclosureButton);
    
    checkAriaAttributes(disclosureButton, {
      'aria-expanded': 'true',
    });
  });

  it('should have proper ARIA attributes on form fields', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const serviceSelect = screen.getByRole('combobox', { name: /select service/i });
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    const branchInput = screen.getByRole('textbox', { name: /branch/i });
    const pathInput = screen.getByRole('textbox', { name: /path/i });
    
    // Check required attributes
    expect(serviceSelect).toHaveAttribute('required');
    expect(repoInput).toHaveAttribute('required');
    expect(branchInput).toHaveAttribute('required');
    expect(pathInput).toHaveAttribute('required');
  });

  it('should associate form fields with error messages', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Trigger validation error
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    await user.type(repoInput, 'invalid!');
    await waitForValidation();
    
    expect(repoInput).toHaveAttribute('aria-describedby', 'repoInput-error');
    expect(screen.getByText(/invalid repository name format/i)).toHaveAttribute('id', 'repoInput-error');
  });

  it('should provide screen reader announcements for operations', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill form and submit
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Check for loading announcement
    expect(screen.getByText(/loading file content from storage service/i)).toBeInTheDocument();
  });

  it('should support keyboard navigation', async () => {
    const { user } = renderLinkService();
    const keyboard = createKeyboardUtils(user);
    
    // Focus disclosure button and activate with Enter
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    disclosureButton.focus();
    expect(keyboard.isFocused(disclosureButton)).toBe(true);
    
    await keyboard.enter();
    
    // Panel should be expanded
    expect(screen.getByRole('form')).toBeInTheDocument();
    
    // Tab through form fields
    await keyboard.tab();
    const serviceSelect = screen.getByRole('combobox', { name: /select service/i });
    expect(keyboard.isFocused(serviceSelect)).toBe(true);
    
    await keyboard.tab();
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    expect(keyboard.isFocused(repoInput)).toBe(true);
  });

  it('should support ARIA live regions for dynamic content', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Error messages should be in live regions
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    await user.type(repoInput, 'invalid!');
    await waitForValidation();
    
    const errorMessage = screen.getByText(/invalid repository name format/i);
    const liveRegion = errorMessage.closest('[role="alert"]');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });
});

// ============================================================================
// THEME INTEGRATION TESTS
// ============================================================================

describe('LinkService Component - Theme Integration', () => {
  it('should apply light theme styles correctly', () => {
    const { useTheme } = require('@/hooks/use-theme');
    useTheme.mockReturnValue({
      theme: 'light',
      isDarkMode: false,
      setTheme: vi.fn(),
    });

    renderLinkService();
    
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    expect(disclosureButton).toHaveClass('bg-white', 'text-gray-900');
  });

  it('should apply dark theme styles correctly', () => {
    const { useTheme } = require('@/hooks/use-theme');
    useTheme.mockReturnValue({
      theme: 'dark',
      isDarkMode: true,
      setTheme: vi.fn(),
    });

    renderLinkService();
    
    const disclosureButton = screen.getByRole('button', { name: /link to service/i });
    expect(disclosureButton).toHaveClass('bg-gray-800', 'text-white');
  });

  it('should handle theme transitions smoothly', async () => {
    const { useTheme } = require('@/hooks/use-theme');
    const setTheme = vi.fn();
    
    useTheme.mockReturnValue({
      theme: 'light',
      isDarkMode: false,
      setTheme,
    });

    const { rerender, user } = renderLinkService();
    
    // Start with light theme
    expect(screen.getByRole('button', { name: /link to service/i })).toHaveClass('bg-white');
    
    // Switch to dark theme
    useTheme.mockReturnValue({
      theme: 'dark',
      isDarkMode: true,
      setTheme,
    });
    
    rerender(<LinkService {...defaultProps} />);
    
    // Should now have dark theme classes
    expect(screen.getByRole('button', { name: /link to service/i })).toHaveClass('bg-gray-800');
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('LinkService Component - Performance', () => {
  it('should render within acceptable time limits', async () => {
    const { renderTime } = await measureRenderTime(() => renderLinkService());
    
    // Component should render in under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('should handle large service lists efficiently', async () => {
    // Mock a large number of services
    const largeServiceList = Array.from({ length: 1000 }, (_, index) => ({
      ...mockStorageServices[0],
      id: index + 1,
      name: `service_${index}`,
      label: `Service ${index}`,
    }));

    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: largeServiceList,
      error: null,
      isLoading: false,
    });

    const { renderTime } = await measureRenderTime(() => renderLinkService());
    
    // Should still render quickly even with many services
    expect(renderTime).toBeLessThan(200);
  });

  it('should debounce validation to avoid excessive API calls', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    
    // Type rapidly
    await user.type(repoInput, 'test-repo', { delay: 10 });
    
    // Validation should be debounced
    await waitForValidation(400);
    
    // Should not show validation errors for rapid typing
    expect(screen.queryByText(/invalid repository name format/i)).not.toBeInTheDocument();
  });

  it('should minimize re-renders during form interactions', async () => {
    const renderCount = { count: 0 };
    
    const TestComponent = (props: LinkServiceProps) => {
      renderCount.count++;
      return <LinkService {...props} />;
    };

    const { user } = customRender(<TestComponent {...defaultProps} />);
    
    const initialRenderCount = renderCount.count;
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill multiple fields
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    // Should not have excessive re-renders
    expect(renderCount.count - initialRenderCount).toBeLessThan(10);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('LinkService Component - Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    // Mock network error
    server.use(
      http.get('/api/storage/*', () => {
        return HttpResponse.error();
      })
    );

    const { user } = renderLinkService();
    
    // Expand panel and submit
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load file content/i)).toBeInTheDocument();
    });
  });

  it('should handle timeout errors', async () => {
    // Mock slow response
    server.use(
      http.get('/api/storage/*', async () => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        return HttpResponse.json({ content: 'slow response' });
      })
    );

    const { user } = renderLinkService();
    
    // Set shorter timeout for testing
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => 
      Promise.reject(new Error('Request timeout'))
    ));

    // Expand panel and submit
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Should handle timeout error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('should clear previous errors when form is resubmitted', async () => {
    // First submission with error
    server.use(
      http.get('/api/storage/*', () => {
        return HttpResponse.json(
          { error: { message: 'File not found' } },
          { status: 404 }
        );
      })
    );

    const { user } = renderLinkService();
    
    // Expand panel and submit
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    
    // Reset server to successful response
    server.resetHandlers();
    server.use(...linkServiceHandlers);
    
    // Submit again
    await user.click(submitButton);
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('LinkService Component - Integration', () => {
  it('should integrate properly with React Hook Form', async () => {
    const onSubmit = vi.fn();
    const { user, formMethods } = renderLinkServiceWithForm();
    
    // Set up form submission handler
    formMethods.handleSubmit(onSubmit);
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Fill form
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    // Form should be valid
    expect(formMethods.formState.isValid).toBe(true);
    
    // Form data should be correct
    const formData = formMethods.getValues();
    expect(formData).toEqual({
      serviceList: 'Production GitHub',
      repoInput: 'test-repo',
      branchInput: 'main',
      pathInput: 'config/app.json',
    });
  });

  it('should work with custom validation schema', async () => {
    const customSchema = z.object({
      serviceList: z.string().min(1),
      repoInput: z.string().min(5, 'Repository name must be at least 5 characters'),
      branchInput: z.string().min(1),
      pathInput: z.string().min(1),
    });

    const { user } = renderLinkService({ validationSchema: customSchema });
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Test custom validation
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    await user.type(repoInput, 'abc');
    await waitForValidation();
    
    expect(screen.getByText(/repository name must be at least 5 characters/i)).toBeInTheDocument();
  });

  it('should integrate with storage service loading states', async () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    
    // Start with loading state
    useStorageServices.mockReturnValue({
      data: [],
      error: null,
      isLoading: true,
    });

    const { rerender } = renderLinkService();
    
    // Should show loading state
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Switch to loaded state
    useStorageServices.mockReturnValue({
      data: mockStorageServices,
      error: null,
      isLoading: false,
    });
    
    rerender(<LinkService {...defaultProps} />);
    
    // Should now show the component
    expect(screen.getByRole('button', { name: /link to service/i })).toBeInTheDocument();
  });

  it('should handle service filtering correctly', () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    
    // Mock with mixed service types
    useStorageServices.mockReturnValue({
      data: mockStorageServices,
      error: null,
      isLoading: false,
    });

    renderLinkService();
    
    // Component should render (has GitHub services)
    expect(screen.getByRole('button', { name: /link to service/i })).toBeInTheDocument();
    
    // Mock with no GitHub services
    useStorageServices.mockReturnValue({
      data: mockStorageServices.filter(s => s.type !== 'github'),
      error: null,
      isLoading: false,
    });

    const { rerender } = renderLinkService();
    rerender(<LinkService {...defaultProps} />);
    
    // Component should not render
    expect(screen.queryByRole('button', { name: /link to service/i })).not.toBeInTheDocument();
  });
});

// ============================================================================
// EDGE CASES AND BOUNDARY TESTS
// ============================================================================

describe('LinkService Component - Edge Cases', () => {
  it('should handle empty storage services array', () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: [],
      error: null,
      isLoading: false,
    });

    const { container } = renderLinkService();
    
    // Component should not render
    expect(container.firstChild).toBeNull();
  });

  it('should handle malformed service data', () => {
    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: [
        { id: 1, name: 'test' }, // Missing required properties
        null,
        undefined,
        { ...mockStorageServices[0], type: 'github' }, // Valid service
      ],
      error: null,
      isLoading: false,
    });

    // Should not crash and should render properly
    renderLinkService();
    expect(screen.getByRole('button', { name: /link to service/i })).toBeInTheDocument();
  });

  it('should handle very long service names', async () => {
    const longServiceName = 'Very Long Service Name That Exceeds Normal Length Expectations And Tests UI Handling';
    const serviceWithLongName = {
      ...mockStorageServices[0],
      name: longServiceName,
      label: longServiceName,
    };

    const { useStorageServices } = require('@/hooks/use-storage-services');
    useStorageServices.mockReturnValue({
      data: [serviceWithLongName],
      error: null,
      isLoading: false,
    });

    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Should render service option without breaking layout
    const serviceSelect = screen.getByRole('combobox', { name: /select service/i });
    expect(within(serviceSelect).getByText(longServiceName)).toBeInTheDocument();
  });

  it('should handle rapid form interactions', async () => {
    const { user } = renderLinkService();
    
    // Expand panel
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    
    // Rapidly change form values
    const repoInput = screen.getByRole('textbox', { name: /repository/i });
    
    for (let i = 0; i < 10; i++) {
      await user.clear(repoInput);
      await user.type(repoInput, `repo-${i}`, { delay: 1 });
    }
    
    // Should handle rapid changes without errors
    expect(repoInput).toHaveValue('repo-9');
  });

  it('should handle component unmounting during async operations', async () => {
    const { user, unmount } = renderLinkService();
    
    // Start async operation
    await user.click(screen.getByRole('button', { name: /link to service/i }));
    await fillFormFields(user, {
      service: 'Production GitHub',
      repository: 'test-repo',
      branch: 'main',
      path: 'config/app.json'
    });
    
    const submitButton = screen.getByRole('button', { name: /view latest/i });
    await user.click(submitButton);
    
    // Unmount component before operation completes
    unmount();
    
    // Should not throw errors or warnings
    // This is primarily testing that cleanup is handled properly
  });
});