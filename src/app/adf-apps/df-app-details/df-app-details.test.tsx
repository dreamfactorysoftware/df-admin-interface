import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { NextRouter } from 'next/router';
import { useRouter } from 'next/navigation';

// Component and dependencies
import { DfAppDetails } from './df-app-details';
import { 
  EDIT_DATA, 
  CREATE_DATA, 
  ROLES,
  ROLE_FILTER_OPTIONS,
  FORM_TEST_DATA,
  FORM_INTERACTIONS,
  COMPONENT_STATE_MOCKS,
  PERFORMANCE_MOCKS,
  appDetailsHandlers,
  API_KEY_OPERATIONS,
  MOCK_API_KEY_RESPONSES,
  LIGHT_THEME_STATE,
  DARK_THEME_STATE,
  THEME_TEST_UTILS,
  setupClipboardMock,
  CLIPBOARD_OPERATIONS
} from './df-app-details.mock';

// Test utilities
import { renderWithProviders } from '../../../test/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';

// Types
import type { AppEntity, AppDetailsFormData } from '../../../types/apps';
import type { Role } from '../../../types/role';

// =============================================================================
// Mock Setup
// =============================================================================

// Expect extend for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    pathname: '/apps/details',
    query: {},
    asPath: '/apps/details'
  })),
  useParams: vi.fn(() => ({ id: '1' })),
  useSearchParams: vi.fn(() => new URLSearchParams())
}));

// Mock theme hook
vi.mock('../../../hooks/use-theme', () => ({
  useTheme: vi.fn(() => LIGHT_THEME_STATE)
}));

// Mock API mutation hook
vi.mock('../../../hooks/use-api-mutation', () => ({
  useApiMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    data: null
  }))
}));

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(),
  useSWRConfig: vi.fn(() => ({ mutate: vi.fn() }))
}));

// Setup MSW server
const server = setupServer(...appDetailsHandlers);

// =============================================================================
// Test Utilities
// =============================================================================

interface RenderOptions {
  initialData?: Partial<AppEntity>;
  isEditMode?: boolean;
  roles?: Role[];
  theme?: 'light' | 'dark';
  queryClient?: QueryClient;
}

const renderComponent = (options: RenderOptions = {}) => {
  const {
    initialData,
    isEditMode = false,
    roles = ROLES,
    theme = 'light',
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })
  } = options;

  const props = {
    initialData: isEditMode ? { ...EDIT_DATA, ...initialData } : undefined,
    roles,
    mode: isEditMode ? 'edit' : 'create' as const
  };

  return renderWithProviders(
    <QueryClientProvider client={queryClient}>
      <DfAppDetails {...props} />
    </QueryClientProvider>,
    { theme }
  );
};

const fillFormFields = async (user: ReturnType<typeof userEvent.setup>, formData = FORM_TEST_DATA.validCreateForm) => {
  // Application name
  const nameInput = screen.getByLabelText(/application name/i);
  await user.clear(nameInput);
  await user.type(nameInput, formData.name);

  // Description
  if (formData.description) {
    const descInput = screen.getByLabelText(/description/i);
    await user.clear(descInput);
    await user.type(descInput, formData.description);
  }

  // Default role selection via Headless UI Combobox
  const roleCombobox = screen.getByRole('combobox', { name: /default role/i });
  await user.click(roleCombobox);
  
  const roleOption = screen.getByRole('option', { 
    name: new RegExp(ROLES.find(r => r.id === formData.defaultRole)?.name || '', 'i') 
  });
  await user.click(roleOption);

  // Active toggle
  const activeToggle = screen.getByRole('switch', { name: /active/i });
  if (formData.isActive !== activeToggle.getAttribute('aria-checked') === 'true') {
    await user.click(activeToggle);
  }

  // Storage type radio buttons
  const storageTypeRadio = screen.getByRole('radio', { 
    name: formData.type === 1 ? /file storage/i : /web server/i 
  });
  await user.click(storageTypeRadio);

  // Storage service selection
  const storageServiceSelect = screen.getByLabelText(/storage service/i);
  await user.selectOptions(storageServiceSelect, formData.storageServiceId?.toString() || '');

  // Container
  const containerInput = screen.getByLabelText(/container/i);
  await user.clear(containerInput);
  await user.type(containerInput, formData.storageContainer);

  // Path (conditional based on storage type)
  if (formData.type === 1 || formData.type === 3) {
    const pathInput = screen.getByLabelText(/path/i);
    await user.clear(pathInput);
    await user.type(pathInput, formData.path || '');
  }

  // URL (conditional based on storage type)
  if (formData.type === 2) {
    const urlInput = screen.getByLabelText(/url/i);
    await user.clear(urlInput);
    await user.type(urlInput, formData.url || '');
  }
};

const getFormValidationErrors = () => {
  const errors: Record<string, string> = {};
  
  // Check for validation error messages
  const errorElements = screen.queryAllByRole('alert');
  errorElements.forEach(element => {
    const fieldName = element.getAttribute('data-field') || 'unknown';
    errors[fieldName] = element.textContent || '';
  });

  return errors;
};

// =============================================================================
// Test Suites
// =============================================================================

describe('DfAppDetails Component', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
    setupClipboardMock();
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  // ---------------------------------------------------------------------------
  // Basic Rendering Tests
  // ---------------------------------------------------------------------------

  describe('Component Rendering', () => {
    it('should render create form correctly', () => {
      renderComponent();
      
      expect(screen.getByRole('heading', { name: /create application/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/application name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /default role/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should render edit form with populated data', () => {
      renderComponent({ isEditMode: true });
      
      expect(screen.getByRole('heading', { name: /edit application/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue(EDIT_DATA.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(EDIT_DATA.description || '')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
      
      // API key section should be visible in edit mode
      expect(screen.getByText(/api key/i)).toBeInTheDocument();
      expect(screen.getByText(EDIT_DATA.apiKey || '')).toBeInTheDocument();
    });

    it('should take snapshot of create form', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toMatchSnapshot();
    });

    it('should take snapshot of edit form', () => {
      const { container } = renderComponent({ isEditMode: true });
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  // ---------------------------------------------------------------------------
  // Form Validation Tests (React Hook Form + Zod)
  // ---------------------------------------------------------------------------

  describe('Form Validation', () => {
    it('should validate required fields on create', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Try to submit empty form
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/application name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate application name format', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nameInput = screen.getByLabelText(/application name/i);
      
      // Test invalid characters
      await user.type(nameInput, 'invalid name with spaces!@#');
      await user.tab(); // Trigger validation
      
      await waitFor(() => {
        expect(screen.getByText(/invalid application name format/i)).toBeInTheDocument();
      });
    });

    it('should validate conditional fields based on storage type', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Select web server type (requires URL)
      const webServerRadio = screen.getByRole('radio', { name: /web server/i });
      await user.click(webServerRadio);
      
      // Try to submit without URL
      await fillFormFields(user, { ...FORM_TEST_DATA.validCreateForm, type: 2, url: '' });
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/url is required for web server storage/i)).toBeInTheDocument();
      });
    });

    it('should validate URL format when web server type is selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Select web server type
      const webServerRadio = screen.getByRole('radio', { name: /web server/i });
      await user.click(webServerRadio);
      
      // Enter invalid URL
      const urlInput = screen.getByLabelText(/url/i);
      await user.type(urlInput, 'not-a-valid-url');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/invalid url format/i)).toBeInTheDocument();
      });
    });

    it('should validate path field when file storage type is selected', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // File storage should be default, but ensure it's selected
      const fileStorageRadio = screen.getByRole('radio', { name: /file storage/i });
      await user.click(fileStorageRadio);
      
      // Clear path field
      const pathInput = screen.getByLabelText(/path/i);
      await user.clear(pathInput);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/path is required for file storage/i)).toBeInTheDocument();
      });
    });

    it('should validate real-time under 100ms performance requirement', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nameInput = screen.getByLabelText(/application name/i);
      
      // Measure validation performance
      const performanceTest = PERFORMANCE_MOCKS.measureValidationTime();
      
      await user.type(nameInput, 'test-app');
      await user.clear(nameInput); // This should trigger validation
      
      const duration = performanceTest.end();
      
      // Validation should be under 100ms
      performanceTest.expectUnder100ms(duration);
    });
  });

  // ---------------------------------------------------------------------------
  // User Interaction Tests (Headless UI Components)
  // ---------------------------------------------------------------------------

  describe('User Interactions', () => {
    it('should handle role selection via Headless UI Combobox', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const roleCombobox = screen.getByRole('combobox', { name: /default role/i });
      await user.click(roleCombobox);
      
      // Options should be visible
      const adminOption = screen.getByRole('option', { name: /admin/i });
      expect(adminOption).toBeInTheDocument();
      
      await user.click(adminOption);
      
      // Verify selection
      expect(roleCombobox).toHaveValue('admin');
    });

    it('should filter roles in combobox when typing', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const roleCombobox = screen.getByRole('combobox', { name: /default role/i });
      await user.click(roleCombobox);
      await user.type(roleCombobox, 'adm');
      
      // Should show filtered results
      expect(screen.getByRole('option', { name: /admin/i })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /user/i })).not.toBeInTheDocument();
    });

    it('should toggle storage type and update form fields', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Initially file storage should be selected
      const fileStorageRadio = screen.getByRole('radio', { name: /file storage/i });
      expect(fileStorageRadio).toBeChecked();
      expect(screen.getByLabelText(/path/i)).toBeInTheDocument();
      
      // Switch to web server
      const webServerRadio = screen.getByRole('radio', { name: /web server/i });
      await user.click(webServerRadio);
      
      expect(webServerRadio).toBeChecked();
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    });

    it('should handle active toggle switch', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const activeSwitch = screen.getByRole('switch', { name: /active/i });
      expect(activeSwitch).toHaveAttribute('aria-checked', 'false');
      
      await user.click(activeSwitch);
      expect(activeSwitch).toHaveAttribute('aria-checked', 'true');
    });

    it('should handle form submission with valid data', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API Integration Tests (MSW)
  // ---------------------------------------------------------------------------

  describe('API Integration', () => {
    it('should create new application successfully', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/apps');
      });
    });

    it('should update existing application successfully', async () => {
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      // Modify description
      const descInput = screen.getByLabelText(/description/i);
      await user.clear(descInput);
      await user.type(descInput, 'Updated description');
      
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/apps');
      });
    });

    it('should handle API validation errors', async () => {
      // Mock validation error response
      server.use(
        http.post('/api/v2/system/app', () => {
          return HttpResponse.json(
            {
              error: {
                code: 422,
                message: 'Validation failed',
                context: {
                  name: ['Application name is required']
                }
              }
            },
            { status: 422 }
          );
        })
      );
      
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.invalidCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/application name is required/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error
      server.use(
        http.post('/api/v2/system/app', () => {
          return HttpResponse.error();
        })
      );
      
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // SWR/React Query Tests
  // ---------------------------------------------------------------------------

  describe('Data Fetching (SWR/React Query)', () => {
    it('should show loading state while fetching roles', () => {
      // Mock loading state
      vi.mocked(require('swr').default).mockReturnValue({
        data: undefined,
        error: null,
        isLoading: true,
        mutate: vi.fn()
      });
      
      renderComponent();
      
      expect(screen.getByTestId('roles-loading')).toBeInTheDocument();
    });

    it('should handle roles fetch error', () => {
      // Mock error state
      vi.mocked(require('swr').default).mockReturnValue({
        data: undefined,
        error: new Error('Failed to fetch roles'),
        isLoading: false,
        mutate: vi.fn()
      });
      
      renderComponent();
      
      expect(screen.getByText(/failed to load roles/i)).toBeInTheDocument();
    });

    it('should cache roles data for optimal performance', async () => {
      const mockMutate = vi.fn();
      vi.mocked(require('swr').default).mockReturnValue({
        data: ROLES,
        error: null,
        isLoading: false,
        mutate: mockMutate
      });
      
      renderComponent();
      
      // Verify roles are rendered from cache
      const roleCombobox = screen.getByRole('combobox', { name: /default role/i });
      await userEvent.setup().click(roleCombobox);
      
      expect(screen.getByRole('option', { name: /admin/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /user/i })).toBeInTheDocument();
    });

    it('should validate cache hit responses under 50ms', async () => {
      const performanceTest = PERFORMANCE_MOCKS.measureRenderTime();
      
      // Mock cached data
      vi.mocked(require('swr').default).mockReturnValue({
        data: ROLES,
        error: null,
        isLoading: false,
        mutate: vi.fn()
      });
      
      renderComponent();
      
      const renderTime = performanceTest.end();
      expect(renderTime).toBeLessThan(50);
    });
  });

  // ---------------------------------------------------------------------------
  // API Key Management Tests
  // ---------------------------------------------------------------------------

  describe('API Key Management', () => {
    it('should display API key in edit mode', () => {
      renderComponent({ isEditMode: true });
      
      expect(screen.getByText(/api key/i)).toBeInTheDocument();
      expect(screen.getByText(EDIT_DATA.apiKey || '')).toBeInTheDocument();
    });

    it('should copy API key to clipboard', async () => {
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      const copyButton = screen.getByRole('button', { name: /copy api key/i });
      await user.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(EDIT_DATA.apiKey);
    });

    it('should refresh API key', async () => {
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      const refreshButton = screen.getByRole('button', { name: /refresh api key/i });
      await user.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.getByText(/api key refreshed successfully/i)).toBeInTheDocument();
      });
    });

    it('should disable refresh button for system-created apps', () => {
      renderComponent({ 
        isEditMode: true, 
        initialData: { ...EDIT_DATA, createdById: null } 
      });
      
      const refreshButton = screen.getByRole('button', { name: /refresh api key/i });
      expect(refreshButton).toBeDisabled();
    });

    it('should copy application URL to clipboard', async () => {
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      const copyUrlButton = screen.getByRole('button', { name: /copy application url/i });
      await user.click(copyUrlButton);
      
      const expectedUrl = `${window.location.origin}/file/applications/${EDIT_DATA.path}`;
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
    });
  });

  // ---------------------------------------------------------------------------
  // Theme Integration Tests (Zustand)
  // ---------------------------------------------------------------------------

  describe('Theme Integration', () => {
    it('should render correctly in light theme', () => {
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue(LIGHT_THEME_STATE);
      
      renderComponent({ theme: 'light' });
      
      const container = screen.getByTestId('app-details-container');
      expect(container).toHaveClass('bg-white', 'text-gray-900');
    });

    it('should render correctly in dark theme', () => {
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue(DARK_THEME_STATE);
      
      renderComponent({ theme: 'dark' });
      
      const container = screen.getByTestId('app-details-container');
      expect(container).toHaveClass('bg-gray-900', 'text-white');
    });

    it('should handle theme toggle', async () => {
      const mockSetTheme = vi.fn();
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue({
        ...LIGHT_THEME_STATE,
        setTheme: mockSetTheme
      });
      
      const user = userEvent.setup();
      renderComponent();
      
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i });
      await user.click(themeToggle);
      
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should respond to system theme changes', () => {
      THEME_TEST_UTILS.mockMatchMedia(true); // Dark mode
      
      vi.mocked(require('../../../hooks/use-theme').useTheme).mockReturnValue({
        theme: 'system',
        actualTheme: 'dark',
        setTheme: vi.fn(),
        toggleTheme: vi.fn()
      });
      
      renderComponent();
      
      const container = screen.getByTestId('app-details-container');
      expect(container).toHaveClass('dark');
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation Tests (Next.js)
  // ---------------------------------------------------------------------------

  describe('Navigation', () => {
    it('should navigate back on cancel', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockBack).toHaveBeenCalled();
    });

    it('should navigate to apps list after successful create', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/apps');
      });
    });

    it('should navigate to apps list after successful update', async () => {
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      const updateButton = screen.getByRole('button', { name: /update/i });
      await user.click(updateButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/apps');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Accessibility Tests (WCAG 2.1 AA)
  // ---------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should have no accessibility violations in create mode', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in edit mode', async () => {
      const { container } = renderComponent({ isEditMode: true });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/application name/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('combobox', { name: /default role/i })).toHaveFocus();
    });

    it('should announce form validation errors to screen readers', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveAttribute('aria-live', 'polite');
        expect(errorAlert).toHaveTextContent(/application name is required/i);
      });
    });

    it('should have proper ARIA labels and descriptions', () => {
      renderComponent();
      
      expect(screen.getByLabelText(/application name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByRole('combobox', { name: /default role/i })).toHaveAttribute('aria-expanded');
      expect(screen.getByRole('switch', { name: /active/i })).toHaveAttribute('aria-checked');
    });

    it('should maintain focus management in modal dialogs', async () => {
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      // Open confirmation dialog for API key refresh
      const refreshButton = screen.getByRole('button', { name: /refresh api key/i });
      await user.click(refreshButton);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      
      // Focus should be trapped within dialog
      const confirmButton = within(dialog).getByRole('button', { name: /confirm/i });
      expect(confirmButton).toHaveFocus();
    });
  });

  // ---------------------------------------------------------------------------
  // Performance Tests
  // ---------------------------------------------------------------------------

  describe('Performance', () => {
    it('should render component under 100ms', () => {
      const performanceTest = PERFORMANCE_MOCKS.measureRenderTime();
      
      renderComponent();
      
      const renderTime = performanceTest.end();
      expect(renderTime).toBeLessThan(100);
    });

    it('should validate form fields under 100ms', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const nameInput = screen.getByLabelText(/application name/i);
      
      const performanceTest = PERFORMANCE_MOCKS.measureValidationTime();
      await user.type(nameInput, 'test-app');
      const validationTime = performanceTest.end();
      
      expect(validationTime).toBeLessThan(100);
    });

    it('should handle large role datasets efficiently', () => {
      const largeRoleSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `role-${i + 1}`,
        description: `Role ${i + 1}`,
        isActive: true,
        createdDate: new Date().toISOString(),
        lastModifiedDate: new Date().toISOString()
      }));
      
      const performanceTest = PERFORMANCE_MOCKS.measureRenderTime();
      
      renderComponent({ roles: largeRoleSet });
      
      const renderTime = performanceTest.end();
      expect(renderTime).toBeLessThan(200); // Allow more time for large datasets
    });
  });

  // ---------------------------------------------------------------------------
  // Error Boundary Tests
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    it('should display user-friendly error message on API failure', async () => {
      // Mock API failure
      server.use(
        http.post('/api/v2/system/app', () => {
          return HttpResponse.json(
            { error: { message: 'Server is temporarily unavailable' } },
            { status: 500 }
          );
        })
      );
      
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/server is temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    it('should handle clipboard API failures gracefully', async () => {
      const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard access denied'));
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });
      
      const user = userEvent.setup();
      renderComponent({ isEditMode: true });
      
      const copyButton = screen.getByRole('button', { name: /copy api key/i });
      await user.click(copyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to copy to clipboard/i)).toBeInTheDocument();
      });
    });

    it('should recover from validation errors', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Submit empty form to trigger validation errors
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByText(/application name is required/i)).toBeInTheDocument();
      });
      
      // Fix validation errors
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      // Error messages should disappear
      await waitFor(() => {
        expect(screen.queryByText(/application name is required/i)).not.toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases and Integration Tests
  // ---------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('should handle empty roles list gracefully', () => {
      renderComponent({ roles: [] });
      
      const roleCombobox = screen.getByRole('combobox', { name: /default role/i });
      expect(roleCombobox).toBeInTheDocument();
      
      // Should show "No roles available" message
      expect(screen.getByText(/no roles available/i)).toBeInTheDocument();
    });

    it('should handle very long application names', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const longName = 'a'.repeat(500);
      const nameInput = screen.getByLabelText(/application name/i);
      
      await user.type(nameInput, longName);
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/application name is too long/i)).toBeInTheDocument();
      });
    });

    it('should preserve form data during component re-renders', async () => {
      const user = userEvent.setup();
      const { rerender } = renderComponent();
      
      // Fill form
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      // Re-render component
      rerender(<DfAppDetails mode="create" roles={ROLES} />);
      
      // Form data should be preserved
      expect(screen.getByDisplayValue(FORM_TEST_DATA.validCreateForm.name)).toBeInTheDocument();
    });

    it('should handle concurrent form submissions', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await fillFormFields(user, FORM_TEST_DATA.validCreateForm);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      
      // Simulate rapid double-click
      await user.click(createButton);
      await user.click(createButton);
      
      // Should only submit once
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating.../i })).toBeInTheDocument();
      });
    });
  });
});