import { http, HttpResponse } from 'msw';
import type { 
  AppDetailsFormData, 
  AppEntity, 
  CreateAppRequest, 
  UpdateAppRequest 
} from '../../../types/apps';
import type { Role } from '../../../types/role';

// =============================================================================
// TypeScript Types for React Component Testing
// =============================================================================

export interface MockAppConfig {
  id?: number;
  name: string;
  description?: string;
  defaultRole: number;
  isActive: boolean;
  type: number;
  storageServiceId: number;
  storageContainer: string;
  path?: string;
  url?: string;
  apiKey?: string;
  roleByRoleId?: Role | null;
  createdDate?: string;
  lastModifiedDate?: string;
}

export interface ReactQueryState<T> {
  data?: T;
  error?: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

export interface SWRState<T> {
  data?: T;
  error?: Error;
  isValidating: boolean;
  mutate: (data?: T) => Promise<T | undefined>;
}

// =============================================================================
// Enhanced Role Data with TypeScript Types for Headless UI Combobox
// =============================================================================

export const ROLES: Role[] = [
  {
    id: 1,
    name: 'admin',
    description: 'Administrator role with full system access',
    isActive: true,
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'user',
    description: 'Standard user role with limited access',
    isActive: true,
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'readonly',
    description: 'Read-only access role for viewing data',
    isActive: true,
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'developer',
    description: 'Developer role with API access',
    isActive: true,
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedDate: '2024-01-01T00:00:00Z'
  }
];

// Role filtering data for Headless UI Combobox component testing
export const ROLE_FILTER_OPTIONS = ROLES.map(role => ({
  id: role.id,
  name: role.name,
  label: `${role.name} - ${role.description}`,
  value: role.id.toString(),
  disabled: !role.isActive
}));

// =============================================================================
// Enhanced App Data with Zod Schema Compatibility
// =============================================================================

export const EDIT_DATA: MockAppConfig = {
  id: 1,
  name: 'sample-app',
  description: 'Sample application for testing',
  defaultRole: 1,
  isActive: true,
  type: 1, // File storage type
  storageServiceId: 3,
  storageContainer: 'applications',
  path: 'sample-app',
  url: 'https://sample-app.dreamfactory.com',
  apiKey: 'df_test_api_key_12345',
  roleByRoleId: ROLES[0],
  createdDate: '2024-01-01T00:00:00Z',
  lastModifiedDate: '2024-01-15T10:30:00Z'
};

export const CREATE_DATA: Omit<MockAppConfig, 'id' | 'apiKey' | 'createdDate' | 'lastModifiedDate'> = {
  name: 'new-test-app',
  description: 'New application being created',
  defaultRole: 2,
  isActive: true,
  type: 2, // Web server type
  storageServiceId: 1,
  storageContainer: 'apps',
  path: '/var/www/new-app',
  url: 'https://new-app.example.com',
  roleByRoleId: ROLES[1]
};

// =============================================================================
// SWR/React Query Testing Scenarios
// =============================================================================

// Loading state mock
export const LOADING_STATE: ReactQueryState<AppEntity> = {
  data: undefined,
  error: null,
  isLoading: true,
  isError: false,
  isSuccess: false
};

// Success state mock
export const SUCCESS_STATE: ReactQueryState<AppEntity> = {
  data: EDIT_DATA as AppEntity,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true
};

// Error state mock
export const ERROR_STATE: ReactQueryState<AppEntity> = {
  data: undefined,
  error: new Error('Failed to fetch application data'),
  isLoading: false,
  isError: true,
  isSuccess: false
};

// SWR state mocks
export const SWR_LOADING_STATE: SWRState<AppEntity> = {
  data: undefined,
  error: undefined,
  isValidating: true,
  mutate: async () => undefined
};

export const SWR_SUCCESS_STATE: SWRState<AppEntity> = {
  data: EDIT_DATA as AppEntity,
  error: undefined,
  isValidating: false,
  mutate: async (data) => data || EDIT_DATA as AppEntity
};

export const SWR_ERROR_STATE: SWRState<AppEntity> = {
  data: undefined,
  error: new Error('Network error occurred'),
  isValidating: false,
  mutate: async () => undefined
};

// =============================================================================
// Mock Clipboard Operations
// =============================================================================

export const mockClipboardAPI = {
  writeText: jest.fn().mockResolvedValue(undefined),
  readText: jest.fn().mockResolvedValue('mocked-clipboard-content')
};

// Global clipboard mock for testing
export const setupClipboardMock = () => {
  Object.assign(navigator, {
    clipboard: mockClipboardAPI
  });
};

// Clipboard operation helpers
export const CLIPBOARD_OPERATIONS = {
  copyApiKey: async (apiKey: string) => {
    await mockClipboardAPI.writeText(apiKey);
    return { success: true, message: 'API key copied to clipboard' };
  },
  copyAppUrl: async (url: string) => {
    await mockClipboardAPI.writeText(url);
    return { success: true, message: 'Application URL copied to clipboard' };
  }
};

// =============================================================================
// API Key Generation/Refresh Workflow Mocks
// =============================================================================

export const API_KEY_OPERATIONS = {
  generate: (): string => {
    const timestamp = Date.now();
    return `df_generated_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  refresh: (currentKey: string): string => {
    const timestamp = Date.now();
    return `df_refreshed_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  validate: (apiKey: string): boolean => {
    return apiKey.startsWith('df_') && apiKey.length >= 20;
  }
};

// Mock API key generation responses
export const MOCK_API_KEY_RESPONSES = {
  generate: {
    success: true,
    data: {
      apiKey: 'df_generated_1705304400000_abcd12345',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  },
  refresh: {
    success: true,
    data: {
      apiKey: 'df_refreshed_1705304400000_efgh67890',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
};

// =============================================================================
// Zustand Theme State Mocks
// =============================================================================

export interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  actualTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

export const LIGHT_THEME_STATE: ThemeState = {
  theme: 'light',
  actualTheme: 'light',
  setTheme: jest.fn(),
  toggleTheme: jest.fn()
};

export const DARK_THEME_STATE: ThemeState = {
  theme: 'dark',
  actualTheme: 'dark',
  setTheme: jest.fn(),
  toggleTheme: jest.fn()
};

export const SYSTEM_THEME_STATE: ThemeState = {
  theme: 'system',
  actualTheme: 'light', // Assumes system preference is light
  setTheme: jest.fn(),
  toggleTheme: jest.fn()
};

// Theme testing utilities
export const THEME_TEST_UTILS = {
  mockMatchMedia: (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  },
  
  simulateSystemThemeChange: (isDark: boolean) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.onchange) {
      mediaQuery.onchange({ matches: isDark } as MediaQueryListEvent);
    }
  }
};

// =============================================================================
// MSW Request Handlers for React Component Testing
// =============================================================================

const API_BASE = '/api/v2';

export const appDetailsHandlers = [
  // Get application by ID
  http.get(`${API_BASE}/system/app/:id`, ({ params }) => {
    const { id } = params;
    
    if (id === '1') {
      return HttpResponse.json({
        resource: [EDIT_DATA]
      });
    }
    
    if (id === 'not-found') {
      return HttpResponse.json(
        { 
          error: { 
            code: 404, 
            message: 'Application not found',
            status_code: 404 
          } 
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      resource: [EDIT_DATA]
    });
  }),

  // Get all roles for dropdown
  http.get(`${API_BASE}/system/role`, () => {
    return HttpResponse.json({
      resource: ROLES
    });
  }),

  // Create new application
  http.post(`${API_BASE}/system/app`, async ({ request }) => {
    const body = await request.json() as CreateAppRequest;
    
    const newApp = {
      ...body,
      id: Math.floor(Math.random() * 1000) + 100,
      apiKey: API_KEY_OPERATIONS.generate(),
      createdDate: new Date().toISOString(),
      lastModifiedDate: new Date().toISOString()
    };
    
    return HttpResponse.json({
      resource: [newApp]
    }, { status: 201 });
  }),

  // Update existing application
  http.put(`${API_BASE}/system/app/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as UpdateAppRequest;
    
    const updatedApp = {
      ...EDIT_DATA,
      ...body,
      id: parseInt(id as string),
      lastModifiedDate: new Date().toISOString()
    };
    
    return HttpResponse.json({
      resource: [updatedApp]
    });
  }),

  // Delete application
  http.delete(`${API_BASE}/system/app/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      resource: [{ id: parseInt(id as string) }]
    });
  }),

  // Generate API key
  http.post(`${API_BASE}/system/app/:id/api-key`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      resource: [{
        id: parseInt(id as string),
        apiKey: API_KEY_OPERATIONS.generate()
      }]
    });
  }),

  // Refresh API key
  http.put(`${API_BASE}/system/app/:id/api-key`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      resource: [{
        id: parseInt(id as string),
        apiKey: API_KEY_OPERATIONS.refresh(EDIT_DATA.apiKey || '')
      }]
    });
  }),

  // Test application URL connectivity
  http.post(`${API_BASE}/system/app/:id/test`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      message: 'Application URL is accessible',
      data: {
        id: parseInt(id as string),
        status: 'online',
        responseTime: Math.floor(Math.random() * 100) + 50
      }
    });
  }),

  // Error scenarios for testing
  http.get(`${API_BASE}/system/app/error-test`, () => {
    return HttpResponse.json(
      { 
        error: { 
          code: 500, 
          message: 'Internal server error',
          status_code: 500 
        } 
      },
      { status: 500 }
    );
  }),

  // Validation error scenario
  http.post(`${API_BASE}/system/app/validation-error`, () => {
    return HttpResponse.json(
      {
        error: {
          code: 422,
          message: 'Validation failed',
          status_code: 422,
          context: {
            name: ['Application name is required'],
            storageServiceId: ['Storage service must be selected']
          }
        }
      },
      { status: 422 }
    );
  })
];

// =============================================================================
// React Testing Library Utilities
// =============================================================================

export const FORM_TEST_DATA = {
  validCreateForm: {
    name: 'test-app',
    description: 'Test application',
    defaultRole: 1,
    isActive: true,
    type: 1,
    storageServiceId: 3,
    storageContainer: 'applications',
    path: 'test-app'
  },
  
  invalidCreateForm: {
    name: '', // Invalid: required field
    description: 'Test app with missing name',
    defaultRole: -1, // Invalid: negative role ID
    isActive: true,
    type: 999, // Invalid: unknown type
    storageServiceId: null, // Invalid: required field
    storageContainer: '',
    path: ''
  },
  
  validEditForm: {
    ...EDIT_DATA,
    description: 'Updated description'
  }
};

// Form interaction helpers for testing
export const FORM_INTERACTIONS = {
  fillCreateForm: (getByLabelText: any, data = FORM_TEST_DATA.validCreateForm) => {
    // Helper function to simulate user filling out the create form
    const actions = [
      () => getByLabelText(/application name/i).type(data.name),
      () => getByLabelText(/description/i).type(data.description || ''),
      () => getByLabelText(/default role/i).selectOption(data.defaultRole.toString()),
      () => getByLabelText(/active/i).check(data.isActive),
      () => getByLabelText(/storage type/i).selectOption(data.type.toString()),
      () => getByLabelText(/storage service/i).selectOption(data.storageServiceId?.toString() || ''),
      () => getByLabelText(/container/i).type(data.storageContainer),
      () => getByLabelText(/path/i).type(data.path || '')
    ];
    
    return actions;
  },
  
  submitForm: (getByRole: any) => {
    return () => getByRole('button', { name: /save|create/i }).click();
  }
};

// =============================================================================
// Component State Mocks for React Hooks
// =============================================================================

export const COMPONENT_STATE_MOCKS = {
  loading: {
    isLoading: true,
    isSubmitting: false,
    errors: {},
    isDirty: false,
    isValid: true
  },
  
  submitting: {
    isLoading: false,
    isSubmitting: true,
    errors: {},
    isDirty: true,
    isValid: true
  },
  
  success: {
    isLoading: false,
    isSubmitting: false,
    errors: {},
    isDirty: false,
    isValid: true
  },
  
  validationError: {
    isLoading: false,
    isSubmitting: false,
    errors: {
      name: { message: 'Application name is required' },
      storageServiceId: { message: 'Storage service must be selected' }
    },
    isDirty: true,
    isValid: false
  }
};

// =============================================================================
// Performance Testing Utilities
// =============================================================================

export const PERFORMANCE_MOCKS = {
  measureValidationTime: () => {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        return duration;
      },
      expectUnder100ms: (duration: number) => {
        expect(duration).toBeLessThan(100);
      }
    };
  },
  
  measureRenderTime: () => {
    const start = performance.now();
    return {
      end: () => performance.now() - start
    };
  }
};

// Export all handlers for MSW setup
export { appDetailsHandlers as handlers };
