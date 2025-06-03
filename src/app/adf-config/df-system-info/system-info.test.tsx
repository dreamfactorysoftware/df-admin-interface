/**
 * System Information Page Test Suite
 * 
 * Comprehensive Vitest test suite for the system information page component,
 * implementing React Testing Library patterns with MSW for API mocking.
 * 
 * Migration from Angular Jest/Karma:
 * - Replaces Angular TestBed with React Testing Library rendering utilities
 * - Converts RxJS observable testing to React Query hook testing
 * - Migrates Angular Material component testing to Headless UI + Tailwind patterns
 * - Transforms Angular HTTP interceptor testing to MSW request handling
 * 
 * Performance Target: <5 seconds for complete test suite execution
 * Coverage Target: 90%+ line and branch coverage
 * 
 * @see Technical Specification Section 7.1.2 - Testing Configuration
 * @see React/Next.js Integration Requirements - Testing Patterns
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';

// Import the component under test
// This import will be available once the page.tsx component is created
import SystemInfoPage from './page';

// Import hooks for isolated testing
import { useSystemConfig } from '@/hooks/use-system-config';
import { useSession } from '@/hooks/use-session';

// Import test utilities and providers
import { renderWithProviders, createTestQueryClient } from '@/test/utils/test-utils';
import { createMockSystemInfo, createMockEnvironment } from '@/test/utils/component-factories';

// Extend expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js router for navigation testing
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/adf-config/df-system-info',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock system configuration hooks for isolated testing
vi.mock('@/hooks/use-system-config');
vi.mock('@/hooks/use-session');

// Type-safe mock implementations
const mockUseSystemConfig = vi.mocked(useSystemConfig);
const mockUseSession = vi.mocked(useSession);

describe('SystemInfoPage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  // Mock data matching the original Angular test structure
  const mockPlatformData = {
    version: '5.0.1',
    bitnamiDemo: false,
    isHosted: false,
    isTrial: false,
    license: 'GOLD',
    securedPackageExport: true,
    licenseKey: 'test-license-key-123',
    dbDriver: 'mysql',
    installPath: '/opt/dreamfactory/',
    logPath: '/opt/dreamfactory/storage/logs/',
    appDebug: false,
    logMode: 'stack',
    logLevel: 'debug',
    cacheDriver: 'redis',
    packages: [
      {
        name: 'dreamfactory/df-core',
        version: '5.0.1',
      },
      {
        name: 'dreamfactory/df-database',
        version: '5.0.1',
      },
    ],
    dfInstanceId: 'test-instance-123',
    rootAdminExists: true,
  };

  const mockServerData = {
    serverOs: 'linux',
    release: '5.15.49-linuxkit-pr',
    version: '#1 SMP Thu May 25 07:17:40 UTC 2023',
    host: '5cc7838e6ba1',
    machine: 'x86_64',
  };

  const mockClientData = {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    ipAddress: '192.168.0.1',
    locale: 'en',
  };

  const mockPhpData = {
    core: {
      phpVersion: '8.1.12',
    },
    general: {
      serverApi: 'fpm-fcgi',
    },
  };

  const mockEnvironmentData = {
    platform: mockPlatformData,
    server: mockServerData,
    client: mockClientData,
    php: mockPhpData,
    authentication: {
      allowOpenRegistration: false,
      openRegEmailServiceId: 0,
      allowForeverSessions: false,
      loginAttribute: 'email',
      adldap: [],
      oauth: [],
      saml: [],
    },
  };

  const mockSystemData = {
    resource: [
      { name: 'admin' },
      { name: 'api_docs' },
      { name: 'db' },
      { name: 'system' },
    ],
  };

  beforeEach(() => {
    // Create fresh query client for each test to ensure isolation
    queryClient = createTestQueryClient();
    user = userEvent.setup();

    // Setup default mock implementations
    mockUseSession.mockReturnValue({
      user: {
        id: '1',
        email: 'admin@dreamfactory.com',
        name: 'Test Admin',
        role: 'admin',
      },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      clearSession: vi.fn(),
      refreshSession: vi.fn(),
    });

    mockUseSystemConfig.mockReturnValue({
      environment: mockEnvironmentData,
      system: mockSystemData,
      isLoading: false,
      isError: false,
      error: null,
      environmentQuery: {
        data: mockEnvironmentData,
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        isStale: false,
      },
      systemQuery: {
        data: mockSystemData,
        isLoading: false,
        isError: false,
        error: null,
        isFetching: false,
        isStale: false,
      },
      refreshEnvironment: vi.fn(),
      refreshSystem: vi.fn(),
      refreshAll: vi.fn(),
      clearCache: vi.fn(),
      isConfigurationValid: vi.fn(() => true),
      hasValidLicense: vi.fn(() => true),
      isTrialEnvironment: vi.fn(() => false),
      isHostedEnvironment: vi.fn(() => false),
      isOpenRegistrationAllowed: false,
      serverVersion: '5.0.1',
      isDevelopmentMode: false,
      availableAuthServices: [],
      systemResources: ['admin', 'api_docs', 'db', 'system'],
    });

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up query client after each test
    queryClient.clear();
    
    // Reset MSW handlers to default state
    server.resetHandlers();
  });

  describe('Component Rendering', () => {
    it('should render the system information page successfully', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify main page structure is rendered
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('system-info-page')).toBeInTheDocument();
      
      // Verify page title is displayed
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /system information/i })).toBeInTheDocument();
      });
    });

    it('should display loading state while fetching system data', async () => {
      // Mock loading state
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        isLoading: true,
        environmentQuery: {
          ...mockUseSystemConfig().environmentQuery,
          isLoading: true,
        },
        systemQuery: {
          ...mockUseSystemConfig().systemQuery,
          isLoading: true,
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify loading indicators are displayed
      expect(screen.getByTestId('system-info-loading')).toBeInTheDocument();
      expect(screen.getByLabelText(/loading system information/i)).toBeInTheDocument();
      
      // Verify loading skeleton elements
      expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(4); // Platform, Server, Client, PHP sections
    });

    it('should display error state when system data fails to load', async () => {
      const mockError = new Error('Failed to fetch system information');
      
      // Mock error state
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        isError: true,
        error: mockError,
        environmentQuery: {
          ...mockUseSystemConfig().environmentQuery,
          isError: true,
          error: mockError,
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify error state is displayed
      await waitFor(() => {
        expect(screen.getByTestId('system-info-error')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to load system information/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('System Information Display', () => {
    beforeEach(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );
    });

    it('should display platform information section with correct data', async () => {
      await waitFor(() => {
        const platformSection = screen.getByTestId('platform-info-section');
        expect(platformSection).toBeInTheDocument();
      });

      const platformSection = screen.getByTestId('platform-info-section');
      
      // Verify platform details are displayed
      expect(within(platformSection).getByText('5.0.1')).toBeInTheDocument(); // Version
      expect(within(platformSection).getByText('GOLD')).toBeInTheDocument(); // License
      expect(within(platformSection).getByText('mysql')).toBeInTheDocument(); // DB Driver
      expect(within(platformSection).getByText('/opt/dreamfactory/')).toBeInTheDocument(); // Install Path
      expect(within(platformSection).getByText('redis')).toBeInTheDocument(); // Cache Driver
      
      // Verify boolean values are properly displayed
      expect(within(platformSection).getByTestId('debug-mode-value')).toHaveTextContent('Disabled');
      expect(within(platformSection).getByTestId('secured-export-value')).toHaveTextContent('Enabled');
    });

    it('should display server information section with correct data', async () => {
      await waitFor(() => {
        const serverSection = screen.getByTestId('server-info-section');
        expect(serverSection).toBeInTheDocument();
      });

      const serverSection = screen.getByTestId('server-info-section');
      
      // Verify server details are displayed
      expect(within(serverSection).getByText('linux')).toBeInTheDocument(); // Server OS
      expect(within(serverSection).getByText('5cc7838e6ba1')).toBeInTheDocument(); // Host
      expect(within(serverSection).getByText('x86_64')).toBeInTheDocument(); // Machine
      expect(within(serverSection).getByText('5.15.49-linuxkit-pr')).toBeInTheDocument(); // Release
    });

    it('should display client information section with correct data', async () => {
      await waitFor(() => {
        const clientSection = screen.getByTestId('client-info-section');
        expect(clientSection).toBeInTheDocument();
      });

      const clientSection = screen.getByTestId('client-info-section');
      
      // Verify client details are displayed
      expect(within(clientSection).getByText('192.168.0.1')).toBeInTheDocument(); // IP Address
      expect(within(clientSection).getByText('en')).toBeInTheDocument(); // Locale
      expect(within(clientSection).getByText(/Chrome\/116.0.0.0/)).toBeInTheDocument(); // User Agent (partial match)
    });

    it('should display PHP information section with correct data', async () => {
      await waitFor(() => {
        const phpSection = screen.getByTestId('php-info-section');
        expect(phpSection).toBeInTheDocument();
      });

      const phpSection = screen.getByTestId('php-info-section');
      
      // Verify PHP details are displayed
      expect(within(phpSection).getByText('8.1.12')).toBeInTheDocument(); // PHP Version
      expect(within(phpSection).getByText('fpm-fcgi')).toBeInTheDocument(); // Server API
    });

    it('should display installed packages information', async () => {
      await waitFor(() => {
        const packagesSection = screen.getByTestId('packages-info-section');
        expect(packagesSection).toBeInTheDocument();
      });

      const packagesSection = screen.getByTestId('packages-info-section');
      
      // Verify package list is displayed
      expect(within(packagesSection).getByText('dreamfactory/df-core')).toBeInTheDocument();
      expect(within(packagesSection).getByText('dreamfactory/df-database')).toBeInTheDocument();
      expect(within(packagesSection).getByText('5.0.1')).toBeInTheDocument();
    });
  });

  describe('License Validation', () => {
    it('should display valid license status for GOLD license', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const licenseSection = screen.getByTestId('license-info-section');
        expect(licenseSection).toBeInTheDocument();
      });

      const licenseSection = screen.getByTestId('license-info-section');
      
      // Verify license status indicators
      expect(within(licenseSection).getByTestId('license-status-valid')).toBeInTheDocument();
      expect(within(licenseSection).getByText('GOLD')).toBeInTheDocument();
      expect(within(licenseSection).getByTestId('license-key-display')).toHaveTextContent('test-license-key-123');
    });

    it('should display trial license warning for trial environments', async () => {
      // Mock trial environment
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        isTrialEnvironment: vi.fn(() => true),
        environment: {
          ...mockEnvironmentData,
          platform: {
            ...mockPlatformData,
            isTrial: true,
            license: 'TRIAL',
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const licenseSection = screen.getByTestId('license-info-section');
        expect(licenseSection).toBeInTheDocument();
      });

      // Verify trial warning is displayed
      expect(screen.getByTestId('trial-license-warning')).toBeInTheDocument();
      expect(screen.getByText(/trial license/i)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should display open source license information', async () => {
      // Mock open source license
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        hasValidLicense: vi.fn(() => false),
        environment: {
          ...mockEnvironmentData,
          platform: {
            ...mockPlatformData,
            license: 'OPEN SOURCE',
            licenseKey: false,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const licenseSection = screen.getByTestId('license-info-section');
        expect(licenseSection).toBeInTheDocument();
      });

      // Verify open source license display
      expect(screen.getByText('OPEN SOURCE')).toBeInTheDocument();
      expect(screen.getByTestId('open-source-license-info')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout Behavior', () => {
    beforeEach(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );
    });

    it('should display mobile layout on small screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        const container = screen.getByTestId('system-info-container');
        expect(container).toHaveClass('grid-cols-1'); // Mobile single column layout
      });

      // Verify mobile-specific classes are applied
      expect(screen.getByTestId('system-info-page')).toHaveClass('px-4', 'py-6');
    });

    it('should display tablet layout on medium screens', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        const container = screen.getByTestId('system-info-container');
        expect(container).toHaveClass('md:grid-cols-2'); // Tablet two column layout
      });
    });

    it('should display desktop layout on large screens', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        const container = screen.getByTestId('system-info-container');
        expect(container).toHaveClass('lg:grid-cols-3'); // Desktop three column layout
      });
    });
  });

  describe('Data Refresh Functionality', () => {
    it('should refresh system data when refresh button is clicked', async () => {
      const mockRefreshAll = vi.fn();
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        refreshAll: mockRefreshAll,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Find and click the refresh button
      const refreshButton = await screen.findByRole('button', { name: /refresh system information/i });
      expect(refreshButton).toBeInTheDocument();

      await user.click(refreshButton);

      // Verify refresh function was called
      expect(mockRefreshAll).toHaveBeenCalledTimes(1);
    });

    it('should show loading state during data refresh', async () => {
      const mockRefreshAll = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        refreshAll: mockRefreshAll,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      const refreshButton = await screen.findByRole('button', { name: /refresh system information/i });
      
      // Click refresh button
      await user.click(refreshButton);

      // Verify loading state during refresh
      expect(refreshButton).toBeDisabled();
      expect(within(refreshButton).getByTestId('refresh-loading-icon')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      const networkError = new Error('Network request failed');
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        isError: true,
        error: networkError,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('system-info-error')).toBeInTheDocument();
        expect(screen.getByText(/network request failed/i)).toBeInTheDocument();
      });

      // Verify error is properly announced to screen readers
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should retry failed requests when retry button is clicked', async () => {
      const mockRefreshAll = vi.fn();
      const networkError = new Error('Network request failed');
      
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        isError: true,
        error: networkError,
        refreshAll: mockRefreshAll,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Find and click retry button
      const retryButton = await screen.findByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Verify retry function was called
      expect(mockRefreshAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('SWR/React Query Integration', () => {
    it('should use React Query for intelligent caching', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify React Query hook is called
      expect(mockUseSystemConfig).toHaveBeenCalled();

      // Verify component renders with cached data
      await waitFor(() => {
        expect(screen.getByTestId('system-info-page')).toBeInTheDocument();
      });
    });

    it('should handle stale data revalidation', async () => {
      // Mock stale data state
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        environmentQuery: {
          ...mockUseSystemConfig().environmentQuery,
          isStale: true,
          isFetching: true,
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify stale data indicator is shown
      await waitFor(() => {
        expect(screen.getByTestId('data-refreshing-indicator')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('system-info-page')).toBeInTheDocument();
      });

      // Run accessibility audit
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('system-info-page')).toBeInTheDocument();
      });

      // Test tab navigation through interactive elements
      const refreshButton = screen.getByRole('button', { name: /refresh system information/i });
      
      // Simulate keyboard navigation
      await user.tab();
      expect(refreshButton).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      
      // Verify refresh was triggered
      expect(mockUseSystemConfig().refreshAll).toHaveBeenCalled();
    });

    it('should provide proper ARIA labels and descriptions', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('system-info-page')).toBeInTheDocument();
      });

      // Verify ARIA labels are present
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'System Information');
      expect(screen.getByTestId('platform-info-section')).toHaveAttribute('aria-labelledby', 'platform-heading');
      expect(screen.getByTestId('server-info-section')).toHaveAttribute('aria-labelledby', 'server-heading');
      
      // Verify descriptions are provided for complex data
      expect(screen.getByTestId('license-key-display')).toHaveAttribute('aria-describedby', 'license-key-description');
    });

    it('should announce important status changes to screen readers', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify live regions for status announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByTestId('system-status-announcer')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance Considerations', () => {
    it('should render within performance targets', async () => {
      const startTime = performance.now();
      
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('system-info-page')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      
      // Verify render time is under 100ms for initial render
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle large datasets efficiently', async () => {
      // Mock large package list
      const largePackageList = Array.from({ length: 100 }, (_, i) => ({
        name: `package-${i}`,
        version: `1.0.${i}`,
      }));

      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        environment: {
          ...mockEnvironmentData,
          platform: {
            ...mockPlatformData,
            packages: largePackageList,
          },
        },
      });

      const startTime = performance.now();
      
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('packages-info-section')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      
      // Verify performance is maintained with large datasets
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('MSW API Mocking Integration', () => {
    it('should handle successful API responses', async () => {
      // Setup MSW handler for successful response
      server.use(
        rest.get('/api/v2/system/environment', (req, res, ctx) => {
          return res(ctx.json(mockEnvironmentData));
        }),
        rest.get('/api/v2/system', (req, res, ctx) => {
          return res(ctx.json(mockSystemData));
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify successful data loading
      await waitFor(() => {
        expect(screen.getByText('5.0.1')).toBeInTheDocument();
        expect(screen.getByText('GOLD')).toBeInTheDocument();
      });
    });

    it('should handle API error responses', async () => {
      // Setup MSW handler for error response
      server.use(
        rest.get('/api/v2/system/environment', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal server error' }));
        })
      );

      // Mock error state
      mockUseSystemConfig.mockReturnValue({
        ...mockUseSystemConfig(),
        isError: true,
        error: new Error('Internal server error'),
      });

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('system-info-error')).toBeInTheDocument();
      });
    });
  });
});