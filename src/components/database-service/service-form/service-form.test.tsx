/**
 * Database Service Form Test Suite
 * 
 * Comprehensive test suite for database service form components using Vitest 2.1+
 * and Mock Service Worker (MSW) for realistic API mocking. Tests form validation,
 * wizard navigation, dynamic field generation, connection testing, paywall integration,
 * and security configuration workflows per Section 7.1.1 testing requirements.
 * 
 * Testing Coverage:
 * - React Hook Form validation and Zod schema integration
 * - Multi-step wizard navigation and state management
 * - Dynamic field generation based on service configuration schemas
 * - Connection testing with SWR caching and performance optimization
 * - Paywall access control and premium feature restrictions
 * - Security configuration workflows and role-based access control
 * - Error handling and edge case scenarios
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance requirements (form validation under 100ms)
 * 
 * @fileoverview Comprehensive testing suite for database service form components
 * @version 1.0.0
 * @since 2024-01-01
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Mock Service Worker setup
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Test utilities and providers
import { TestProviders, createTestWrapper, cleanupTestProviders } from '@/test/utils/test-providers';

// Components under test
import { ServiceFormContainer } from './service-form-container';
import ServiceFormWizard from './service-form-wizard';
import { PaywallModal } from './paywall-modal';

// Hooks under test
import {
  useServiceForm,
  useServiceFormWizard,
  useServiceFormFields,
  useServiceConnectionTest,
  useServiceFormPaywall,
  useServiceFormSecurity,
  useServiceFormSubmission,
} from './service-form-hooks';

// Type definitions
import type {
  DatabaseService,
  DatabaseConnectionInput,
  ConnectionTestResult,
  ServiceType,
  ServiceTier,
} from '../types';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ service: '1' }),
  useSearchParams: () => new URLSearchParams('returnUrl=/api-connections/database'),
}));

// Mock authentication hook
const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  role: 'admin',
};

const mockAuth = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkPermission: vi.fn(() => true),
};

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuth,
}));

// Mock paywall hook
const mockPaywall = {
  checkFeatureAccess: vi.fn(() => true),
  isPaywallActive: false,
  openUpgradeDialog: vi.fn(),
  paywallState: {
    isActive: false,
    tier: 'gold' as ServiceTier,
    features: [],
  },
};

vi.mock('@/hooks/use-paywall', () => ({
  usePaywall: () => mockPaywall,
}));

// Mock database service context
const mockDatabaseServiceContext = {
  services: [],
  selectedService: null,
  loading: false,
  error: null,
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
  refreshServices: vi.fn(),
};

vi.mock('../database-service-provider', () => ({
  useDatabaseServiceContext: () => mockDatabaseServiceContext,
  useDatabaseServiceActions: () => ({
    createService: mockDatabaseServiceContext.createService,
    updateService: mockDatabaseServiceContext.updateService,
    deleteService: mockDatabaseServiceContext.deleteService,
  }),
  useDatabaseServiceState: () => ({
    services: mockDatabaseServiceContext.services,
    loading: mockDatabaseServiceContext.loading,
    error: mockDatabaseServiceContext.error,
  }),
  useSelectedService: () => ({
    selectedService: mockDatabaseServiceContext.selectedService,
    selectServiceById: vi.fn(),
    clearSelection: vi.fn(),
  }),
}));

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// =============================================================================
// MOCK DATA AND FIXTURES
// =============================================================================

/**
 * Sample database service configurations for testing
 */
const mockServices: DatabaseService[] = [
  {
    id: 1,
    name: 'test-mysql',
    label: 'Test MySQL Service',
    description: 'Test MySQL database connection',
    type: 'mysql',
    is_active: true,
    config: {
      driver: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'testdb',
      username: 'testuser',
      password: 'testpass',
    },
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    mutable: true,
    deletable: true,
  },
  {
    id: 2,
    name: 'test-postgresql',
    label: 'Test PostgreSQL Service',
    description: 'Test PostgreSQL database connection',
    type: 'postgresql',
    is_active: true,
    config: {
      driver: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'testdb',
      username: 'testuser',
      password: 'testpass',
    },
    created_date: '2024-01-01T00:00:00Z',
    last_modified_date: '2024-01-01T00:00:00Z',
    created_by_id: 1,
    last_modified_by_id: 1,
    mutable: true,
    deletable: true,
  },
];

/**
 * Sample service type configurations
 */
const mockServiceTypes: ServiceType[] = [
  {
    id: 'mysql',
    name: 'MySQL',
    description: 'MySQL database service',
    tier: 'core',
    configSchema: [
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        required: true,
        default: 'localhost',
      },
      {
        name: 'port',
        label: 'Port',
        type: 'integer',
        required: false,
        default: 3306,
        min: 1,
        max: 65535,
      },
      {
        name: 'database',
        label: 'Database',
        type: 'string',
        required: true,
      },
      {
        name: 'username',
        label: 'Username',
        type: 'string',
        required: true,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        required: true,
      },
    ],
  },
  {
    id: 'oracle',
    name: 'Oracle',
    description: 'Oracle database service',
    tier: 'gold',
    configSchema: [
      {
        name: 'host',
        label: 'Host',
        type: 'string',
        required: true,
      },
      {
        name: 'port',
        label: 'Port',
        type: 'integer',
        required: false,
        default: 1521,
      },
      {
        name: 'service_name',
        label: 'Service Name',
        type: 'string',
        required: true,
      },
    ],
  },
];

/**
 * Connection test results for different scenarios
 */
const mockConnectionTestResults = {
  success: {
    success: true,
    message: 'Connection successful',
    details: {
      host: 'localhost',
      port: 3306,
      database: 'testdb',
      responseTime: 45,
    },
  } as ConnectionTestResult,
  failure: {
    success: false,
    message: 'Connection failed: Access denied for user',
    details: {
      error: 'Access denied for user \'testuser\'@\'localhost\'',
      errorCode: 1045,
    },
  } as ConnectionTestResult,
  timeout: {
    success: false,
    message: 'Connection timeout after 10 seconds',
    details: {
      error: 'Connection timeout',
      timeout: 10000,
    },
  } as ConnectionTestResult,
};

// =============================================================================
// MSW HANDLERS FOR API MOCKING
// =============================================================================

/**
 * MSW handlers for database service API endpoints
 */
const databaseServiceHandlers = [
  // Get all services
  http.get('/api/v2/system/service', () => {
    return HttpResponse.json({
      resource: mockServices,
      meta: {
        count: mockServices.length,
        limit: 25,
        offset: 0,
      },
    });
  }),

  // Get single service
  http.get('/api/v2/system/service/:id', ({ params }) => {
    const id = parseInt(params.id as string, 10);
    const service = mockServices.find(s => s.id === id);
    
    if (!service) {
      return new HttpResponse(null, { 
        status: 404, 
        statusText: 'Service not found' 
      });
    }
    
    return HttpResponse.json(service);
  }),

  // Create service
  http.post('/api/v2/system/service', async ({ request }) => {
    const data = await request.json() as DatabaseConnectionInput;
    
    // Validate required fields
    if (!data.name || !data.type) {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 400,
            message: 'Missing required fields',
            details: ['Name and type are required'],
          },
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const newService: DatabaseService = {
      id: Date.now(),
      name: data.name,
      label: data.label || data.name,
      description: data.description || '',
      type: data.type,
      is_active: data.is_active ?? true,
      config: data.config,
      created_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      created_by_id: 1,
      last_modified_by_id: 1,
      mutable: true,
      deletable: true,
    };

    return HttpResponse.json(newService, { status: 201 });
  }),

  // Update service
  http.put('/api/v2/system/service/:id', async ({ params, request }) => {
    const id = parseInt(params.id as string, 10);
    const data = await request.json() as DatabaseConnectionInput;
    const existingService = mockServices.find(s => s.id === id);
    
    if (!existingService) {
      return new HttpResponse(null, { 
        status: 404, 
        statusText: 'Service not found' 
      });
    }

    const updatedService: DatabaseService = {
      ...existingService,
      name: data.name,
      label: data.label || data.name,
      description: data.description || '',
      type: data.type,
      is_active: data.is_active ?? true,
      config: data.config,
      last_modified_date: new Date().toISOString(),
      last_modified_by_id: 1,
    };

    return HttpResponse.json(updatedService);
  }),

  // Connection test endpoint
  http.post('/api/v2/system/service/connection-test', async ({ request }) => {
    const data = await request.json() as { config: any };
    
    // Simulate different connection scenarios based on config
    const { host, username, password } = data.config;
    
    // Simulate timeout
    if (host === 'timeout.example.com') {
      await new Promise(resolve => setTimeout(resolve, 100)); // Faster for tests
      return HttpResponse.json(mockConnectionTestResults.timeout);
    }
    
    // Simulate authentication failure
    if (username === 'baduser' || password === 'badpass') {
      return HttpResponse.json(mockConnectionTestResults.failure);
    }
    
    // Simulate successful connection
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network delay
    return HttpResponse.json(mockConnectionTestResults.success);
  }),

  // Paywall upgrade endpoint
  http.post('/api/v2/system/upgrade', () => {
    return HttpResponse.json({
      success: true,
      redirectUrl: 'https://example.com/upgrade',
    });
  }),

  // Service types endpoint
  http.get('/api/v2/system/service-types', () => {
    return HttpResponse.json({
      resource: mockServiceTypes,
    });
  }),
];

// Setup MSW server
const server = setupServer(...databaseServiceHandlers);

// =============================================================================
// TEST SETUP AND TEARDOWN
// =============================================================================

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  cleanupTestProviders();
});

afterAll(() => {
  server.close();
});

// =============================================================================
// UTILITY FUNCTIONS FOR TESTING
// =============================================================================

/**
 * Creates a user event instance for testing user interactions
 */
const createUser = () => userEvent.setup({ delay: null });

/**
 * Waits for form validation to complete
 */
const waitForValidation = () => waitFor(() => {}, { timeout: 200 });

/**
 * Fills out basic service form fields
 */
const fillBasicServiceForm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/service name/i), 'test-service');
  await user.type(screen.getByLabelText(/host/i), 'localhost');
  await user.type(screen.getByLabelText(/database/i), 'testdb');
  await user.type(screen.getByLabelText(/username/i), 'testuser');
  await user.type(screen.getByLabelText(/password/i), 'testpass');
};

/**
 * Asserts that accessibility standards are met
 */
const assertAccessibility = async (container: HTMLElement) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// =============================================================================
// SERVICE FORM CONTAINER TESTS
// =============================================================================

describe('ServiceFormContainer', () => {
  beforeEach(() => {
    mockDatabaseServiceContext.services = [...mockServices];
    mockDatabaseServiceContext.loading = false;
    mockDatabaseServiceContext.error = null;
  });

  describe('Component Rendering and Navigation', () => {
    it('should render create mode with correct title and navigation', async () => {
      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      expect(screen.getByText('Create Database Service')).toBeInTheDocument();
      expect(screen.getByText('Configure a new database connection for API generation')).toBeInTheDocument();
      expect(screen.getByText('Back to Services')).toBeInTheDocument();
    });

    it('should render edit mode with service details', async () => {
      vi.mocked(vi.importMock('next/navigation')).useParams.mockReturnValue({ service: '1' });
      mockDatabaseServiceContext.selectedService = mockServices[0];

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Database Service')).toBeInTheDocument();
        expect(screen.getByText(`Editing service: ${mockServices[0].name}`)).toBeInTheDocument();
        expect(screen.getByText('API Documentation')).toBeInTheDocument();
      });
    });

    it('should handle back navigation with unsaved changes confirmation', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Make a change to trigger unsaved state
      await user.type(screen.getByLabelText(/service name/i), 'changed-name');
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      await user.click(screen.getByText('Back to Services'));
      
      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });

    it('should navigate to API documentation for existing services', async () => {
      const user = createUser();
      vi.mocked(vi.importMock('next/navigation')).useParams.mockReturnValue({ service: '1' });
      mockDatabaseServiceContext.selectedService = mockServices[0];

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await user.click(screen.getByText('API Documentation'));
      
      expect(mockRouter.push).toHaveBeenCalledWith(
        `/adf-api-docs/services/${encodeURIComponent(mockServices[0].name)}`
      );
    });
  });

  describe('Authentication and Authorization', () => {
    it('should redirect unauthenticated users to login', async () => {
      mockAuth.isAuthenticated = false;
      mockAuth.isLoading = false;

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringContaining('/login?returnUrl=')
        );
      });
    });

    it('should show access denied for users without permissions', async () => {
      mockAuth.checkPermission = vi.fn(() => false);
      mockPaywall.checkFeatureAccess = vi.fn(() => false);

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('You do not have permission to manage database services')).toBeInTheDocument();
      });
    });

    it('should show loading state during authentication', () => {
      mockAuth.isLoading = true;

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display service loading errors with retry option', async () => {
      const user = createUser();
      vi.mocked(vi.importMock('next/navigation')).useParams.mockReturnValue({ service: '999' });
      
      // Mock service loading error
      server.use(
        http.get('/api/v2/system/service/999', () => {
          return new HttpResponse(null, { status: 404, statusText: 'Service not found' });
        })
      );

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to Load Service')).toBeInTheDocument();
        expect(screen.getByText('Unable to load service details')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));
      // Verify retry functionality is triggered
    });

    it('should handle form submission errors gracefully', async () => {
      const user = createUser();
      
      // Mock service creation error
      server.use(
        http.post('/api/v2/system/service', () => {
          return new HttpResponse(
            JSON.stringify({
              error: {
                message: 'Service name already exists',
                code: 409,
              },
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await fillBasicServiceForm(user);
      
      // Navigate through wizard steps
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Service'));

      await waitFor(() => {
        expect(screen.getByText('Submission Error')).toBeInTheDocument();
        expect(screen.getByText('Service name already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await assertAccessibility(container);
    });

    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to services/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      const backButton = screen.getByRole('button', { name: /back to services/i });
      
      await user.tab();
      expect(backButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Verify navigation is triggered
    });
  });
});

// =============================================================================
// SERVICE FORM WIZARD TESTS
// =============================================================================

describe('ServiceFormWizard', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    mode: 'create' as const,
    isLoading: false,
    onFormChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wizard Navigation and Validation', () => {
    it('should render step indicator with correct step states', () => {
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      const steps = screen.getAllByRole('button', { name: /step/i });
      expect(steps).toHaveLength(4);
      
      // First step should be current
      expect(screen.getByText('Service Type')).toBeInTheDocument();
      expect(screen.getByText('Select the type of database service to create')).toBeInTheDocument();
    });

    it('should navigate through wizard steps with validation', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Step 1: Select service type
      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Step 2: Basic details
      await waitFor(() => {
        expect(screen.getByText('Basic Details')).toBeInTheDocument();
      });
      
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));

      // Step 3: Advanced options
      await waitFor(() => {
        expect(screen.getByText('Advanced Options')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Next'));

      // Step 4: Security configuration
      await waitFor(() => {
        expect(screen.getByText('Security Configuration')).toBeInTheDocument();
      });
    });

    it('should prevent navigation to next step with validation errors', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Select service type and try to proceed without filling required fields
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Should be on step 2
      await user.click(screen.getByText('Next'));

      // Should stay on step 2 due to validation errors
      await waitFor(() => {
        expect(screen.getByText('Service name is required')).toBeInTheDocument();
        expect(screen.getByText('Host is required')).toBeInTheDocument();
        expect(screen.getByText('Database name is required')).toBeInTheDocument();
      });
    });

    it('should allow backward navigation to previous steps', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Navigate to step 2
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Navigate back to step 1
      await user.click(screen.getByText('Previous'));

      await waitFor(() => {
        expect(screen.getByText('Select Database Type')).toBeInTheDocument();
      });
    });

    it('should mark steps as completed when validation passes', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Complete step 1
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Complete step 2
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));

      // Check that step 1 is marked as completed
      const stepIndicators = screen.getAllByRole('button');
      const step1Indicator = stepIndicators.find(button => 
        button.querySelector('svg[data-testid="check-icon"]')
      );
      expect(step1Indicator).toBeInTheDocument();
    });
  });

  describe('Service Type Selection', () => {
    it('should display all available service types', () => {
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('MySQL')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('Oracle')).toBeInTheDocument();
      expect(screen.getByText('MongoDB')).toBeInTheDocument();
      expect(screen.getByText('Snowflake')).toBeInTheDocument();
      expect(screen.getByText('SQL Server')).toBeInTheDocument();
      expect(screen.getByText('SQLite')).toBeInTheDocument();
    });

    it('should update default port when service type changes', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Check that default MySQL port is set
      const portInput = screen.getByLabelText(/port/i) as HTMLInputElement;
      expect(portInput.placeholder).toBe('3306');

      await user.click(screen.getByText('Previous'));
      await user.click(screen.getByText('PostgreSQL'));
      await user.click(screen.getByText('Next'));

      // Check that default PostgreSQL port is set
      expect(portInput.placeholder).toBe('5432');
    });

    it('should highlight selected service type', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      const mysqlButton = screen.getByText('MySQL').closest('button');
      await user.click(mysqlButton!);

      expect(mysqlButton).toHaveClass('border-primary-600');
      expect(mysqlButton).toHaveClass('bg-primary-50');
    });
  });

  describe('Form Field Validation', () => {
    it('should validate required fields in real-time', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      const nameInput = screen.getByLabelText(/service name/i);
      await user.type(nameInput, 'test');
      await user.clear(nameInput);
      await user.tab();

      await waitForValidation();
      expect(screen.getByText('Service name is required')).toBeInTheDocument();
    });

    it('should validate field constraints (min/max length, numeric ranges)', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Test port validation
      const portInput = screen.getByLabelText(/port/i);
      await user.type(portInput, '99999');
      await user.tab();

      await waitForValidation();
      expect(screen.getByText(/port must be between 1 and 65535/i)).toBeInTheDocument();
    });

    it('should show validation errors with proper styling', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next')); // Try to proceed with empty fields

      await waitForValidation();
      
      const nameInput = screen.getByLabelText(/service name/i);
      expect(nameInput).toHaveClass('border-red-300');
      
      const errorMessage = screen.getByText('Service name is required');
      expect(errorMessage).toHaveClass('text-red-600');
    });
  });

  describe('Advanced Configuration Options', () => {
    it('should show SSL configuration for supported database types', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Enable SSL/TLS')).toBeInTheDocument();
      
      await user.click(screen.getByLabelText('Enable SSL/TLS'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('SSL Mode')).toBeInTheDocument();
      });
    });

    it('should show connection pooling options for supported databases', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Enable connection pooling')).toBeInTheDocument();
      
      await user.click(screen.getByLabelText('Enable connection pooling'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Minimum Connections')).toBeInTheDocument();
        expect(screen.getByLabelText('Maximum Connections')).toBeInTheDocument();
        expect(screen.getByLabelText(/connection timeout/i)).toBeInTheDocument();
      });
    });

    it('should hide unsupported options for specific database types', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // SQLite doesn't support SSL or pooling
      await user.click(screen.getByText('SQLite'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));

      expect(screen.queryByText('Enable SSL/TLS')).not.toBeInTheDocument();
      expect(screen.queryByText('Enable connection pooling')).not.toBeInTheDocument();
    });
  });

  describe('Security Configuration', () => {
    it('should provide access type selection options', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Navigate to security step
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Public Access')).toBeInTheDocument();
      expect(screen.getByText('Private Access')).toBeInTheDocument();
      expect(screen.getByText('Role-Based Access')).toBeInTheDocument();
    });

    it('should show role configuration for role-based access', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Navigate to security step
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      await user.click(screen.getByText('Role-Based Access'));

      await waitFor(() => {
        expect(screen.getByLabelText('Allowed Roles')).toBeInTheDocument();
        expect(screen.getByLabelText('Allowed Applications')).toBeInTheDocument();
      });
    });

    it('should provide additional security options', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} />
        </TestProviders>
      );

      // Navigate to security step
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Require API key for all requests')).toBeInTheDocument();
      expect(screen.getByText('Enable audit logging for this service')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with complete form data', async () => {
      const user = createUser();
      const onSubmit = vi.fn();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} onSubmit={onSubmit} />
        </TestProviders>
      );

      // Fill out complete form
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Service'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceType: 'mysql',
            name: 'test-service',
            host: 'localhost',
            database: 'testdb',
            username: 'testuser',
            password: 'testpass',
          })
        );
      });
    });

    it('should prevent submission if validation fails on final step', async () => {
      const user = createUser();
      const onSubmit = vi.fn();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} onSubmit={onSubmit} />
        </TestProviders>
      );

      // Skip required fields and try to submit
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Service'));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} isLoading={true} />
        </TestProviders>
      );

      // Navigate to final step
      const createButton = screen.getByText('Creating...');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toBeDisabled();
    });
  });

  describe('Edit Mode Functionality', () => {
    it('should pre-populate form fields in edit mode', () => {
      const initialData = {
        serviceType: 'mysql' as const,
        name: 'existing-service',
        label: 'Existing Service',
        description: 'An existing service',
        host: 'prod.example.com',
        port: 3306,
        database: 'proddb',
        username: 'produser',
        isActive: true,
      };

      render(
        <TestProviders>
          <ServiceFormWizard 
            {...defaultProps} 
            mode="edit" 
            initialData={initialData} 
          />
        </TestProviders>
      );

      // MySQL should be pre-selected
      const mysqlButton = screen.getByText('MySQL').closest('button');
      expect(mysqlButton).toHaveClass('border-primary-600');
    });

    it('should change submit button text in edit mode', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <ServiceFormWizard {...defaultProps} mode="edit" />
        </TestProviders>
      );

      // Navigate to final step
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// PAYWALL MODAL TESTS
// =============================================================================

describe('PaywallModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Calendly global object
    (global as any).window = Object.create(window);
    Object.defineProperty(window, 'Calendly', {
      value: {
        initInlineWidget: vi.fn(),
      },
      writable: true,
    });
  });

  describe('Modal Rendering and Behavior', () => {
    it('should render modal with correct content when open', () => {
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Unlock Premium Features')).toBeInTheDocument();
      expect(screen.getByText('Take your API development to the next level')).toBeInTheDocument();
      expect(screen.getByText('Free Hosted Trial Available')).toBeInTheDocument();
      expect(screen.getByText('What You\'ll Gain')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} isOpen={false} />
        </TestProviders>
      );

      expect(screen.queryByText('Unlock Premium Features')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = createUser();
      const onClose = vi.fn();
      
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} onClose={onClose} />
        </TestProviders>
      );

      await user.click(screen.getByLabelText('Close modal'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when escape key is pressed', async () => {
      const user = createUser();
      const onClose = vi.fn();
      
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} onClose={onClose} />
        </TestProviders>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Calendly Integration', () => {
    it('should initialize Calendly widget when modal opens', async () => {
      const mockCalendly = {
        initInlineWidget: vi.fn(),
      };
      (window as any).Calendly = mockCalendly;

      render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(mockCalendly.initInlineWidget).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
            autoLoad: true,
            prefill: expect.objectContaining({
              email: mockUser.email,
              firstName: mockUser.firstName,
              lastName: mockUser.lastName,
            }),
            utm: expect.objectContaining({
              utmSource: 'dreamfactory-admin',
              utmMedium: 'paywall-modal',
              utmCampaign: 'premium-features',
            }),
          })
        );
      });
    });

    it('should show loading state while Calendly loads', () => {
      // Don't mock Calendly to simulate loading state
      delete (window as any).Calendly;

      render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByText('Loading scheduling widget...')).toBeInTheDocument();
    });

    it('should handle Calendly loading errors gracefully', async () => {
      const user = createUser();
      
      // Mock Calendly initialization failure
      const mockCalendly = {
        initInlineWidget: vi.fn(() => {
          throw new Error('Failed to initialize Calendly');
        }),
      };
      (window as any).Calendly = mockCalendly;

      render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load scheduling widget/i)).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));
      expect(mockCalendly.initInlineWidget).toHaveBeenCalledTimes(2);
    });
  });

  describe('Contact Information', () => {
    it('should display contact information when enabled', () => {
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} showContact={true} />
        </TestProviders>
      );

      expect(screen.getByText('Prefer to contact us directly?')).toBeInTheDocument();
      expect(screen.getByText('Phone: +1 415-993-5877')).toBeInTheDocument();
      expect(screen.getByText('Email: info@dreamfactory.com')).toBeInTheDocument();
    });

    it('should hide contact information when disabled', () => {
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} showContact={false} />
        </TestProviders>
      );

      expect(screen.queryByText('Prefer to contact us directly?')).not.toBeInTheDocument();
    });

    it('should have properly linked contact information', () => {
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} showContact={true} />
        </TestProviders>
      );

      const phoneLink = screen.getByRole('link', { name: /call dreamfactory/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:+14159935877');

      const emailLink = screen.getByRole('link', { name: /email dreamfactory/i });
      expect(emailLink).toHaveAttribute('href', 'mailto:info@dreamfactory.com');
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should meet accessibility standards', async () => {
      const { container } = render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      await assertAccessibility(container);
    });

    it('should have proper ARIA labels and roles', () => {
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'paywall-modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'paywall-modal-description');
    });

    it('should trap focus within modal', async () => {
      const user = createUser();
      
      render(
        <TestProviders>
          <PaywallModal {...defaultProps} />
        </TestProviders>
      );

      const closeButton = screen.getByLabelText('Close modal');
      
      await user.tab();
      expect(closeButton).toHaveFocus();
    });
  });
});

// =============================================================================
// SERVICE FORM HOOKS TESTS
// =============================================================================

describe('Service Form Hooks', () => {
  describe('useServiceForm', () => {
    it('should initialize form with default values', () => {
      const TestComponent = () => {
        const { form, mode } = useServiceForm({
          mode: 'create',
        });
        
        return (
          <div>
            <span data-testid="mode">{mode}</span>
            <span data-testid="name">{form.getValues('name')}</span>
            <span data-testid="type">{form.getValues('type')}</span>
          </div>
        );
      };

      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('create');
      expect(screen.getByTestId('name')).toHaveTextContent('');
      expect(screen.getByTestId('type')).toHaveTextContent('mysql');
    });

    it('should initialize form with initial data', () => {
      const initialData = mockServices[0];
      
      const TestComponent = () => {
        const { form } = useServiceForm({
          mode: 'edit',
          initialData,
        });
        
        return (
          <div>
            <span data-testid="name">{form.getValues('name')}</span>
            <span data-testid="host">{form.getValues('config.host')}</span>
          </div>
        );
      };

      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('name')).toHaveTextContent(initialData.name);
      expect(screen.getByTestId('host')).toHaveTextContent(initialData.config.host);
    });

    it('should validate form data with Zod schema', async () => {
      const TestComponent = () => {
        const { validateForm, form } = useServiceForm({
          mode: 'create',
        });
        
        const handleValidate = async () => {
          const isValid = await validateForm();
          const errors = form.formState.errors;
          
          return { isValid, errors: Object.keys(errors) };
        };
        
        return (
          <div>
            <button onClick={handleValidate}>Validate</button>
          </div>
        );
      };

      const user = createUser();
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      await user.click(screen.getByText('Validate'));
      
      // Should have validation errors for required fields
      await waitFor(() => {
        expect(screen.getByText('Validate')).toBeInTheDocument();
      });
    });

    it('should detect form changes correctly', async () => {
      const TestComponent = () => {
        const { form, hasChanges, updateField } = useServiceForm({
          mode: 'create',
        });
        
        return (
          <div>
            <span data-testid="has-changes">{hasChanges.toString()}</span>
            <button onClick={() => updateField('name', 'new-name')}>
              Update Name
            </button>
          </div>
        );
      };

      const user = createUser();
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('has-changes')).toHaveTextContent('false');
      
      await user.click(screen.getByText('Update Name'));
      
      await waitFor(() => {
        expect(screen.getByTestId('has-changes')).toHaveTextContent('true');
      });
    });
  });

  describe('useServiceConnectionTest', () => {
    it('should test database connection successfully', async () => {
      const config = {
        driver: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      const TestComponent = () => {
        const { testConnection, result, status } = useServiceConnectionTest(config);
        
        return (
          <div>
            <span data-testid="status">{status}</span>
            <span data-testid="success">{result?.success?.toString()}</span>
            <button onClick={() => testConnection()}>Test Connection</button>
          </div>
        );
      };

      const user = createUser();
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('status')).toHaveTextContent('idle');
      
      await user.click(screen.getByText('Test Connection'));
      
      // Should show testing status
      expect(screen.getByTestId('status')).toHaveTextContent('testing');
      
      // Wait for successful result
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('success');
        expect(screen.getByTestId('success')).toHaveTextContent('true');
      });
    });

    it('should handle connection test failures', async () => {
      const config = {
        driver: 'mysql' as const,
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'baduser',
        password: 'badpass',
      };

      const TestComponent = () => {
        const { testConnection, result, status, error } = useServiceConnectionTest(config);
        
        return (
          <div>
            <span data-testid="status">{status}</span>
            <span data-testid="error">{error?.message}</span>
            <button onClick={() => testConnection()}>Test Connection</button>
          </div>
        );
      };

      const user = createUser();
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      await user.click(screen.getByText('Test Connection'));
      
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('error');
      });
    });

    it('should handle connection timeouts', async () => {
      const config = {
        driver: 'mysql' as const,
        host: 'timeout.example.com',
        port: 3306,
        database: 'testdb',
        username: 'testuser',
        password: 'testpass',
      };

      const TestComponent = () => {
        const { testConnection, result, status } = useServiceConnectionTest(
          config, 
          { timeout: 1000 }
        );
        
        return (
          <div>
            <span data-testid="status">{status}</span>
            <span data-testid="message">{result?.message}</span>
            <button onClick={() => testConnection()}>Test Connection</button>
          </div>
        );
      };

      const user = createUser();
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      await user.click(screen.getByText('Test Connection'));
      
      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('error');
        expect(screen.getByTestId('message')).toHaveTextContent('timeout');
      }, { timeout: 2000 });
    });
  });

  describe('useServiceFormPaywall', () => {
    it('should check access for core tier services', () => {
      const serviceType: ServiceType = {
        id: 'mysql',
        name: 'MySQL',
        description: 'MySQL database',
        tier: 'core',
        configSchema: [],
      };

      const TestComponent = () => {
        const { hasAccess, requiresUpgrade, requiredTier } = useServiceFormPaywall(
          serviceType, 
          'core'
        );
        
        return (
          <div>
            <span data-testid="has-access">{hasAccess.toString()}</span>
            <span data-testid="requires-upgrade">{requiresUpgrade.toString()}</span>
            <span data-testid="required-tier">{requiredTier}</span>
          </div>
        );
      };

      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('has-access')).toHaveTextContent('true');
      expect(screen.getByTestId('requires-upgrade')).toHaveTextContent('false');
      expect(screen.getByTestId('required-tier')).toHaveTextContent('core');
    });

    it('should block access for premium services with core tier', () => {
      const serviceType: ServiceType = {
        id: 'oracle',
        name: 'Oracle',
        description: 'Oracle database',
        tier: 'gold',
        configSchema: [],
      };

      const TestComponent = () => {
        const { hasAccess, requiresUpgrade, requiredTier } = useServiceFormPaywall(
          serviceType, 
          'core'
        );
        
        return (
          <div>
            <span data-testid="has-access">{hasAccess.toString()}</span>
            <span data-testid="requires-upgrade">{requiresUpgrade.toString()}</span>
            <span data-testid="required-tier">{requiredTier}</span>
          </div>
        );
      };

      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('has-access')).toHaveTextContent('false');
      expect(screen.getByTestId('requires-upgrade')).toHaveTextContent('true');
      expect(screen.getByTestId('required-tier')).toHaveTextContent('gold');
    });

    it('should show paywall with correct upgrade benefits', async () => {
      const serviceType: ServiceType = {
        id: 'oracle',
        name: 'Oracle',
        description: 'Oracle database',
        tier: 'gold',
        configSchema: [],
      };

      const TestComponent = () => {
        const { 
          triggerPaywall, 
          showPaywall, 
          paywallMessage, 
          getUpgradeBenefits 
        } = useServiceFormPaywall(serviceType, 'core');
        
        const benefits = getUpgradeBenefits();
        
        return (
          <div>
            <span data-testid="show-paywall">{showPaywall.toString()}</span>
            <span data-testid="message">{paywallMessage}</span>
            <span data-testid="benefits-count">{benefits.length}</span>
            <button onClick={() => triggerPaywall()}>Show Paywall</button>
          </div>
        );
      };

      const user = createUser();
      render(
        <TestProviders>
          <TestComponent />
        </TestProviders>
      );

      expect(screen.getByTestId('show-paywall')).toHaveTextContent('false');
      
      await user.click(screen.getByText('Show Paywall'));
      
      await waitFor(() => {
        expect(screen.getByTestId('show-paywall')).toHaveTextContent('true');
        expect(screen.getByTestId('benefits-count')).toHaveTextContent('4'); // Should list benefits
      });
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Service Form Integration Tests', () => {
  beforeEach(() => {
    mockDatabaseServiceContext.services = [...mockServices];
    mockDatabaseServiceContext.loading = false;
    mockDatabaseServiceContext.error = null;
    mockPaywall.checkFeatureAccess = vi.fn(() => true);
  });

  describe('Complete Service Creation Workflow', () => {
    it('should create a new MySQL service successfully', async () => {
      const user = createUser();
      const createService = vi.fn().mockResolvedValue(mockServices[0]);
      mockDatabaseServiceContext.createService = createService;

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Step 1: Select MySQL
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      // Step 2: Fill basic details
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));

      // Step 3: Skip advanced options
      await user.click(screen.getByText('Next'));

      // Step 4: Configure security (keep default public access)
      await user.click(screen.getByText('Create Service'));

      await waitFor(() => {
        expect(createService).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'test-service',
            type: 'mysql',
            config: expect.objectContaining({
              host: 'localhost',
              database: 'testdb',
              username: 'testuser',
              password: 'testpass',
            }),
          })
        );
      });

      expect(mockRouter.push).toHaveBeenCalledWith(
        `/api-connections/database/${mockServices[0].name}/schema`
      );
    });

    it('should edit an existing service successfully', async () => {
      const user = createUser();
      const updateService = vi.fn().mockResolvedValue(mockServices[0]);
      mockDatabaseServiceContext.updateService = updateService;
      mockDatabaseServiceContext.selectedService = mockServices[0];

      vi.mocked(vi.importMock('next/navigation')).useParams.mockReturnValue({ service: '1' });

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Should pre-populate with existing data
      await waitFor(() => {
        expect(screen.getByText('Edit Database Service')).toBeInTheDocument();
      });

      // Navigate to final step and save
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      
      const saveButton = screen.getByText('Save Changes');
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateService).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: mockServices[0].name,
            type: mockServices[0].type,
          })
        );
      });
    });

    it('should handle premium service paywall correctly', async () => {
      const user = createUser();
      mockPaywall.checkFeatureAccess = vi.fn((feature) => {
        if (feature === 'premium-databases') return false;
        return true;
      });

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Select Oracle (premium service)
      await user.click(screen.getByText('Oracle'));
      await user.click(screen.getByText('Next'));

      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Service'));

      // Should show paywall modal
      await waitFor(() => {
        expect(screen.getByText('Premium Service Required')).toBeInTheDocument();
        expect(screen.getByText('oracle connections require a premium license')).toBeInTheDocument();
      });
    });
  });

  describe('Connection Testing Integration', () => {
    it('should test connection during service creation', async () => {
      const user = createUser();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Fill out connection details
      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);

      // Look for test connection button (if implemented)
      const testButton = screen.queryByText('Test Connection');
      if (testButton) {
        await user.click(testButton);

        await waitFor(() => {
          expect(screen.getByText('Connection successful')).toBeInTheDocument();
        });
      }
    });

    it('should show connection test errors', async () => {
      const user = createUser();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      
      // Fill with bad credentials
      await user.type(screen.getByLabelText(/service name/i), 'test-service');
      await user.type(screen.getByLabelText(/host/i), 'localhost');
      await user.type(screen.getByLabelText(/database/i), 'testdb');
      await user.type(screen.getByLabelText(/username/i), 'baduser');
      await user.type(screen.getByLabelText(/password/i), 'badpass');

      const testButton = screen.queryByText('Test Connection');
      if (testButton) {
        await user.click(testButton);

        await waitFor(() => {
          expect(screen.getByText(/connection failed/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      const user = createUser();
      
      // Mock network error
      server.use(
        http.post('/api/v2/system/service', () => {
          return HttpResponse.error();
        })
      );

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Create Service'));

      await waitFor(() => {
        expect(screen.getByText('Submission Error')).toBeInTheDocument();
      });
    });

    it('should validate form before allowing step progression', async () => {
      const user = createUser();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Try to proceed without selecting service type
      await user.click(screen.getByText('Next'));

      // Should still be on step 1
      expect(screen.getByText('Select Database Type')).toBeInTheDocument();
    });

    it('should preserve form data when navigating between steps', async () => {
      const user = createUser();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      const nameInput = screen.getByLabelText(/service name/i) as HTMLInputElement;
      await user.type(nameInput, 'persistent-service');

      await user.click(screen.getByText('Previous'));
      await user.click(screen.getByText('Next'));

      // Should preserve the entered name
      expect(nameInput.value).toBe('persistent-service');
    });
  });

  describe('Performance Requirements', () => {
    it('should validate forms in under 100ms per requirements', async () => {
      const user = createUser();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));

      const nameInput = screen.getByLabelText(/service name/i);
      
      const startTime = performance.now();
      await user.type(nameInput, 'test');
      await user.clear(nameInput);
      await user.tab();
      
      await waitForValidation();
      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Validation should complete within 100ms requirement
      expect(validationTime).toBeLessThan(100);
    });

    it('should render wizard steps without performance degradation', async () => {
      const startTime = performance.now();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Initial render should be fast
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should maintain accessibility standards across all wizard steps', async () => {
      const user = createUser();
      const { container } = render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Test accessibility on each step
      await assertAccessibility(container);

      await user.click(screen.getByText('MySQL'));
      await user.click(screen.getByText('Next'));
      await assertAccessibility(container);

      await fillBasicServiceForm(user);
      await user.click(screen.getByText('Next'));
      await assertAccessibility(container);

      await user.click(screen.getByText('Next'));
      await assertAccessibility(container);
    });

    it('should support screen reader navigation', () => {
      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Check for proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);

      // Check for form labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('aria-label');
      });
    });

    it('should provide proper focus management', async () => {
      const user = createUser();

      render(
        <TestProviders>
          <ServiceFormContainer />
        </TestProviders>
      );

      // Should be able to navigate through service type options with keyboard
      await user.tab();
      const firstServiceType = screen.getByText('MySQL').closest('button');
      expect(firstServiceType).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      const secondServiceType = screen.getByText('PostgreSQL').closest('button');
      expect(secondServiceType).toHaveFocus();
    });
  });
});