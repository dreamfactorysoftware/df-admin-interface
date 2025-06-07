/**
 * Mock data for DreamFactory App Details React component testing.
 * 
 * Provides comprehensive mock implementations for React testing patterns
 * including MSW handlers, SWR/React Query scenarios, Zustand state mocks,
 * and Headless UI component testing data.
 * 
 * @fileoverview App Details component test mocks
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { z } from 'zod';
import { rest } from 'msw';
import type { AppType, AppPayload, AppListResponse, RoleType } from '@/types/apps';

// ============================================================================
// Type-Safe Mock Data with Zod Schema Validation
// ============================================================================

/**
 * Enhanced ROLES mock data with complete TypeScript types
 * Compatible with Zod schema validation and Headless UI Combobox testing
 */
export const ROLES: RoleType[] = [
  {
    id: 1,
    name: 'admin',
    description: 'Administrator role with full access',
    isActive: true,
    roleServiceAccess: [],
    lookupKeys: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z',
    createdById: 1,
    lastModifiedById: 1,
  },
  {
    id: 2,
    name: 'user',
    description: 'Standard user role with limited access',
    isActive: true,
    roleServiceAccess: [],
    lookupKeys: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z',
    createdById: 1,
    lastModifiedById: 1,
  },
  {
    id: 3,
    name: 'readonly',
    description: 'Read-only access role',
    isActive: true,
    roleServiceAccess: [],
    lookupKeys: [],
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z',
    createdById: 1,
  },
];

/**
 * Enhanced EDIT_DATA mock with complete AppType structure
 * Compatible with React Hook Form and Zod schema validation
 */
export const EDIT_DATA: AppType = {
  id: 1,
  name: 'test-app',
  apiKey: 'test_api_key_12345',
  description: 'Test application for component testing',
  isActive: true,
  type: 1, // LOCAL_FILE type
  path: '/applications/test-app',
  url: 'https://example.com/test-app',
  storageServiceId: 3,
  storageContainer: 'applications',
  requiresFullscreen: false,
  allowFullscreenToggle: true,
  toggleLocation: 'top-right',
  roleId: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModifiedDate: '2024-01-15T00:00:00Z',
  createdById: 1,
  lastModifiedById: 1,
  launchUrl: 'https://example.com/test-app',
  roleByRoleId: ROLES[0],
};

/**
 * Additional test applications for comprehensive testing scenarios
 */
export const MOCK_APPS: AppType[] = [
  EDIT_DATA,
  {
    id: 2,
    name: 'dashboard-app',
    apiKey: 'dashboard_api_key_67890',
    description: 'Main dashboard application',
    isActive: true,
    type: 2, // URL type
    url: 'https://dashboard.example.com',
    requiresFullscreen: true,
    allowFullscreenToggle: false,
    toggleLocation: 'none',
    roleId: 2,
    createdDate: '2024-01-05T00:00:00Z',
    lastModifiedDate: '2024-01-20T00:00:00Z',
    createdById: 1,
    lastModifiedById: 1,
    launchUrl: 'https://dashboard.example.com',
    roleByRoleId: ROLES[1],
  },
  {
    id: 3,
    name: 'reporting-app',
    apiKey: 'reporting_api_key_abcdef',
    description: 'Advanced reporting and analytics',
    isActive: false,
    type: 3, // CLOUD_STORAGE type
    storageServiceId: 5,
    storageContainer: 'reports',
    requiresFullscreen: false,
    allowFullscreenToggle: true,
    toggleLocation: 'top-left',
    roleId: 3,
    createdDate: '2024-01-10T00:00:00Z',
    lastModifiedDate: '2024-01-25T00:00:00Z',
    createdById: 2,
    lastModifiedById: 2,
    launchUrl: 'https://storage.example.com/reports/app',
    roleByRoleId: ROLES[2],
  },
];

// ============================================================================
// MSW Request Handlers for API Endpoints
// ============================================================================

/**
 * MSW request handlers for realistic API testing
 * Supports all CRUD operations and error scenarios
 */
export const mswHandlers = [
  // Get applications list
  rest.get('/api/v2/system/app', (req, res, ctx) => {
    const limit = req.url.searchParams.get('limit');
    const offset = req.url.searchParams.get('offset');
    const related = req.url.searchParams.get('related');
    
    const apps = related?.includes('role_by_role_id') 
      ? MOCK_APPS 
      : MOCK_APPS.map(app => ({ ...app, roleByRoleId: undefined }));
    
    const response: AppListResponse = {
      resource: apps.slice(
        Number(offset) || 0, 
        (Number(offset) || 0) + (Number(limit) || 50)
      ),
      meta: {
        count: apps.length,
        schema: ['id', 'name', 'description', 'type', 'is_active'],
      },
    };
    
    return res(ctx.json(response));
  }),

  // Get single application
  rest.get('/api/v2/system/app/:id', (req, res, ctx) => {
    const { id } = req.params;
    const app = MOCK_APPS.find(a => a.id === Number(id));
    
    if (!app) {
      return res(
        ctx.status(404),
        ctx.json({ error: { message: 'Application not found' } })
      );
    }
    
    return res(ctx.json({ resource: [app] }));
  }),

  // Create application
  rest.post('/api/v2/system/app', async (req, res, ctx) => {
    const body = await req.json() as { resource: AppPayload[] };
    const newApp = body.resource[0];
    
    // Simulate validation error for testing
    if (!newApp.name) {
      return res(
        ctx.status(400),
        ctx.json({ 
          error: { 
            message: 'Application name is required',
            context: { name: ['Name field is required'] }
          }
        })
      );
    }
    
    const createdApp: AppType = {
      id: MOCK_APPS.length + 1,
      name: newApp.name,
      apiKey: `generated_key_${Date.now()}`,
      description: newApp.description || '',
      isActive: newApp.is_active,
      type: newApp.type,
      path: newApp.path,
      url: newApp.url,
      storageServiceId: newApp.storage_service_id,
      storageContainer: newApp.storage_container,
      requiresFullscreen: newApp.requires_fullscreen || false,
      allowFullscreenToggle: newApp.allow_fullscreen_toggle || true,
      toggleLocation: newApp.toggle_location || 'top-right',
      roleId: newApp.role_id,
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString(),
      createdById: 1,
      launchUrl: newApp.url || `https://localhost/apps/${newApp.name}`,
      roleByRoleId: newApp.role_id ? ROLES.find(r => r.id === newApp.role_id) : undefined,
    };
    
    return res(ctx.json({ resource: [createdApp] }));
  }),

  // Update application
  rest.patch('/api/v2/system/app/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json() as { resource: Partial<AppPayload>[] };
    const updates = body.resource[0];
    
    const app = MOCK_APPS.find(a => a.id === Number(id));
    if (!app) {
      return res(
        ctx.status(404),
        ctx.json({ error: { message: 'Application not found' } })
      );
    }
    
    const updatedApp: AppType = {
      ...app,
      ...updates,
      lastModifiedDate: new Date().toISOString(),
      lastModifiedById: 1,
    };
    
    return res(ctx.json({ resource: [updatedApp] }));
  }),

  // Delete application
  rest.delete('/api/v2/system/app/:id', (req, res, ctx) => {
    const { id } = req.params;
    const app = MOCK_APPS.find(a => a.id === Number(id));
    
    if (!app) {
      return res(
        ctx.status(404),
        ctx.json({ error: { message: 'Application not found' } })
      );
    }
    
    return res(ctx.json({ resource: [{ id: Number(id) }] }));
  }),

  // Generate new API key
  rest.post('/api/v2/system/app/:id/generate-key', (req, res, ctx) => {
    const { id } = req.params;
    const newApiKey = `generated_key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return res(ctx.json({ 
      resource: [{ 
        id: Number(id), 
        api_key: newApiKey 
      }] 
    }));
  }),

  // Get roles for dropdown
  rest.get('/api/v2/system/role', (req, res, ctx) => {
    return res(ctx.json({ 
      resource: ROLES.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        is_active: role.isActive,
      }))
    }));
  }),
];

// ============================================================================
// SWR/React Query Testing Scenarios
// ============================================================================

/**
 * Mock data for SWR testing scenarios including loading, error, and success states
 */
export const swrTestScenarios = {
  // Loading state simulation
  loading: {
    data: undefined,
    error: undefined,
    isLoading: true,
    isValidating: true,
    mutate: jest.fn(),
  },
  
  // Success state with data
  success: {
    data: { resource: MOCK_APPS },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  },
  
  // Error state simulation
  error: {
    data: undefined,
    error: new Error('Failed to fetch applications'),
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  },
  
  // Single app success
  singleAppSuccess: {
    data: { resource: [EDIT_DATA] },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  },
  
  // Roles loading
  rolesLoading: {
    data: undefined,
    error: undefined,
    isLoading: true,
    isValidating: true,
    mutate: jest.fn(),
  },
  
  // Roles success
  rolesSuccess: {
    data: { resource: ROLES },
    error: undefined,
    isLoading: false,
    isValidating: false,
    mutate: jest.fn(),
  },
};

/**
 * React Query mock implementations for testing
 */
export const reactQueryMocks = {
  // Successful query result
  useQuery: jest.fn(() => ({
    data: { resource: MOCK_APPS },
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
    refetch: jest.fn(),
  })),
  
  // Mutation mock for create/update operations
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    reset: jest.fn(),
  })),
  
  // Query client mock
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(() => ({ resource: MOCK_APPS })),
    cancelQueries: jest.fn(),
  })),
};

// ============================================================================
// Clipboard Operations Mock
// ============================================================================

/**
 * Mock implementations for clipboard operations and API key workflows
 */
export const clipboardMocks = {
  // Clipboard API mock
  writeText: jest.fn().mockResolvedValue(undefined),
  readText: jest.fn().mockResolvedValue('mocked-clipboard-content'),
  
  // API key generation workflow
  generateApiKey: jest.fn().mockResolvedValue({
    apiKey: `generated_key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  }),
  
  // API key refresh workflow
  refreshApiKey: jest.fn().mockImplementation(async (appId: number) => {
    const newKey = `refreshed_key_${appId}_${Date.now()}`;
    return {
      appId,
      apiKey: newKey,
      previousKey: 'old_api_key',
      timestamp: new Date().toISOString(),
    };
  }),
  
  // Copy to clipboard with toast notification
  copyToClipboard: jest.fn().mockImplementation(async (text: string) => {
    await clipboardMocks.writeText(text);
    return { success: true, text };
  }),
};

// ============================================================================
// Headless UI Combobox Mock Data
// ============================================================================

/**
 * Mock role filtering data for Headless UI Combobox component testing
 */
export const comboboxMocks = {
  // Role options for combobox
  roleOptions: ROLES.map(role => ({
    id: role.id,
    name: role.name,
    description: role.description,
    disabled: !role.isActive,
  })),
  
  // Filtered roles based on search query
  getFilteredRoles: jest.fn((query: string) => {
    if (!query) return comboboxMocks.roleOptions;
    
    return comboboxMocks.roleOptions.filter(role =>
      role.name.toLowerCase().includes(query.toLowerCase()) ||
      role.description?.toLowerCase().includes(query.toLowerCase())
    );
  }),
  
  // Combobox state management
  comboboxState: {
    selectedRole: null,
    setSelectedRole: jest.fn(),
    query: '',
    setQuery: jest.fn(),
    filteredRoles: comboboxMocks.roleOptions,
  },
};

// ============================================================================
// Zustand Store Mocks for Theme and State Management
// ============================================================================

/**
 * Theme state mocks for dark/light mode testing with Zustand store integration
 */
export const zustandStoreMocks = {
  // Theme store mock
  useThemeStore: jest.fn(() => ({
    theme: 'light' as 'light' | 'dark',
    setTheme: jest.fn(),
    toggleTheme: jest.fn(),
    systemTheme: 'light' as 'light' | 'dark',
    resolvedTheme: 'light' as 'light' | 'dark',
  })),
  
  // App store mock for global application state
  useAppStore: jest.fn(() => ({
    user: {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    },
    sidebarCollapsed: false,
    setSidebarCollapsed: jest.fn(),
    currentApp: EDIT_DATA,
    setCurrentApp: jest.fn(),
    apps: MOCK_APPS,
    setApps: jest.fn(),
    roles: ROLES,
    setRoles: jest.fn(),
  })),
  
  // UI store mock for component state
  useUIStore: jest.fn(() => ({
    modals: {
      deleteConfirm: false,
      apiKeyGenerate: false,
    },
    setModal: jest.fn(),
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    loading: {
      apps: false,
      roles: false,
      generating: false,
    },
    setLoading: jest.fn(),
  })),
};

// ============================================================================
// Form Testing Mocks
// ============================================================================

/**
 * React Hook Form mocks for form testing scenarios
 */
export const formMocks = {
  // Form state for successful validation
  validFormState: {
    register: jest.fn(),
    handleSubmit: jest.fn((onSubmit) => (e) => {
      e.preventDefault();
      onSubmit(EDIT_DATA);
    }),
    formState: {
      errors: {},
      isValid: true,
      isSubmitting: false,
      isDirty: true,
      isSubmitted: false,
    },
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(() => EDIT_DATA),
    reset: jest.fn(),
    control: {} as any,
  },
  
  // Form state with validation errors
  errorFormState: {
    register: jest.fn(),
    handleSubmit: jest.fn(),
    formState: {
      errors: {
        name: { message: 'Application name is required' },
        type: { message: 'Application type must be selected' },
      },
      isValid: false,
      isSubmitting: false,
      isDirty: true,
      isSubmitted: true,
    },
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
    control: {} as any,
  },
  
  // Form submission states
  submittingFormState: {
    ...formMocks.validFormState,
    formState: {
      ...formMocks.validFormState.formState,
      isSubmitting: true,
    },
  },
};

// ============================================================================
// Export All Mocks
// ============================================================================

export default {
  ROLES,
  EDIT_DATA,
  MOCK_APPS,
  mswHandlers,
  swrTestScenarios,
  reactQueryMocks,
  clipboardMocks,
  comboboxMocks,
  zustandStoreMocks,
  formMocks,
};
