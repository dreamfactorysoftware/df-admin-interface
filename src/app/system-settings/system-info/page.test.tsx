import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextRouter } from 'next/router';
import { jest } from '@jest/globals';

// Import the component to test
import SystemInfoPage from './page';

// Import types and test utilities
import { SystemInfo } from '@/types/system-info';
import { renderWithProviders } from '@/test/utils/test-utils';
import { createSystemInfoMockData } from '@/test/utils/component-factories';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  reload: vi.fn(),
  route: '/system-settings/system-info',
  pathname: '/system-settings/system-info',
  query: {},
  asPath: '/system-settings/system-info',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isReady: true,
  isPreview: false,
} as unknown as NextRouter;

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock useMediaQuery hook for responsive testing
const mockUseMediaQuery = vi.fn();
vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

// Mock authentication hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, email: 'admin@test.com', isAdmin: true },
    loading: false,
  }),
}));

// Create mock system info data using factory
const mockSystemInfoData = createSystemInfoMockData();

const mockSystemInfoWithLicense: SystemInfo = {
  ...mockSystemInfoData,
  platform: {
    ...mockSystemInfoData.platform,
    license: 'GOLD',
    licenseKey: 'test-license-key-123',
  },
};

const mockSystemInfoOpenSource: SystemInfo = {
  ...mockSystemInfoData,
  platform: {
    ...mockSystemInfoData.platform,
    license: 'OPEN SOURCE',
    licenseKey: null,
  },
};

const mockLicenseStatusResponse = {
  msg: 'Valid license',
  renewalDate: '2024-12-31',
  subscriptionStatus: 'active',
};

// MSW server setup for API mocking
const server = setupServer(
  // System info endpoint
  http.get('/api/v2/system/environment', () => {
    return HttpResponse.json(mockSystemInfoData);
  }),
  
  // License check endpoint
  http.post('/api/v2/system/license/check', () => {
    return HttpResponse.json(mockLicenseStatusResponse);
  }),
  
  // Error scenario endpoint
  http.get('/api/v2/system/environment/error', () => {
    return new HttpResponse(null, { status: 500 });
  })
);

// Start MSW server before tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Close server after tests
beforeAll(() => {
  server.close();
});

describe('SystemInfoPage Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });
    user = userEvent.setup();
    mockUseMediaQuery.mockReturnValue(false); // Default to desktop
  });

  describe('Component Rendering', () => {
    it('should render system information page successfully', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText('System Information')).toBeInTheDocument();
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Loading system information...')).toBeInTheDocument();
    });

    it('should render all system information sections', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
        expect(screen.getByText('Server Information')).toBeInTheDocument();
        expect(screen.getByText('Client Information')).toBeInTheDocument();
      });
    });
  });

  describe('System Data Loading', () => {
    it('should fetch and display system information correctly', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Platform information
        expect(screen.getByText(mockSystemInfoData.platform.version)).toBeInTheDocument();
        expect(screen.getByText(mockSystemInfoData.platform.license)).toBeInTheDocument();
        
        // Server information
        expect(screen.getByText(mockSystemInfoData.server.serverOs)).toBeInTheDocument();
        expect(screen.getByText(mockSystemInfoData.server.host)).toBeInTheDocument();
        
        // Client information
        expect(screen.getByText(mockSystemInfoData.client.ipAddress)).toBeInTheDocument();
      });
    });

    it('should handle missing optional platform data gracefully', async () => {
      const incompleteSystemInfo = {
        ...mockSystemInfoData,
        platform: {
          ...mockSystemInfoData.platform,
          logPath: undefined,
          cacheDriver: undefined,
          packages: undefined,
        },
      };

      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(incompleteSystemInfo);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });

      // These optional fields should not be present
      expect(screen.queryByText('Log Path:')).not.toBeInTheDocument();
      expect(screen.queryByText('Cache Driver:')).not.toBeInTheDocument();
      expect(screen.queryByText('Installed Packages')).not.toBeInTheDocument();
    });

    it('should display packages list when available', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Installed Packages')).toBeInTheDocument();
        
        // Check for package entries
        mockSystemInfoData.platform.packages?.forEach((pkg) => {
          expect(screen.getByText(pkg.name)).toBeInTheDocument();
          expect(screen.getByText(pkg.version)).toBeInTheDocument();
        });
      });
    });
  });

  describe('License Information Display', () => {
    it('should display license information for licensed instances', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoWithLicense);
        }),
        http.post('/api/v2/system/license/check', () => {
          return HttpResponse.json(mockLicenseStatusResponse);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('License Level:')).toBeInTheDocument();
        expect(screen.getByText('GOLD')).toBeInTheDocument();
        expect(screen.getByText('License Key:')).toBeInTheDocument();
        expect(screen.getByText('test-license-key-123')).toBeInTheDocument();
      });

      // Wait for license validation
      await waitFor(() => {
        expect(screen.getByText('Subscription Status:')).toBeInTheDocument();
        expect(screen.getByText('Valid license')).toBeInTheDocument();
        expect(screen.getByText('Renewal Date:')).toBeInTheDocument();
        expect(screen.getByText('2024-12-31')).toBeInTheDocument();
      });
    });

    it('should not display license details for open source instances', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoOpenSource);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('License Level:')).toBeInTheDocument();
        expect(screen.getByText('OPEN SOURCE')).toBeInTheDocument();
      });

      // License key should not be displayed
      expect(screen.queryByText('License Key:')).not.toBeInTheDocument();
      expect(screen.queryByText('Subscription Status:')).not.toBeInTheDocument();
    });

    it('should handle license validation errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoWithLicense);
        }),
        http.post('/api/v2/system/license/check', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('License Level:')).toBeInTheDocument();
        expect(screen.getByText('GOLD')).toBeInTheDocument();
      });

      // License validation should fail gracefully
      await waitFor(() => {
        expect(screen.queryByText('Subscription Status:')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('should apply mobile layout on small screens', async () => {
      mockUseMediaQuery.mockReturnValue(true); // Mobile breakpoint

      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const instanceSection = screen.getByTestId('system-info-instance');
        expect(instanceSection).toHaveClass('x-small');
      });
    });

    it('should apply desktop layout on large screens', async () => {
      mockUseMediaQuery.mockReturnValue(false); // Desktop breakpoint

      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const instanceSection = screen.getByTestId('system-info-instance');
        expect(instanceSection).not.toHaveClass('x-small');
      });
    });

    it('should handle dynamic responsive changes', async () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Start with desktop
      mockUseMediaQuery.mockReturnValue(false);
      rerender(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const instanceSection = screen.getByTestId('system-info-instance');
        expect(instanceSection).not.toHaveClass('x-small');
      });

      // Switch to mobile
      mockUseMediaQuery.mockReturnValue(true);
      rerender(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const instanceSection = screen.getByTestId('system-info-instance');
        expect(instanceSection).toHaveClass('x-small');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when system info fetch fails', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load system information/i)).toBeInTheDocument();
      });
    });

    it('should provide retry functionality on error', async () => {
      let callCount = 0;
      server.use(
        http.get('/api/v2/system/environment', () => {
          callCount++;
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 });
          }
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Failed to load system information/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should now load successfully
      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          throw new Error('Network error');
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Network connection failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('React Query Integration', () => {
    it('should cache system information data', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      const { unmount } = render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });

      unmount();

      // Re-render should use cached data
      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      // Should immediately show data without loading state
      expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should invalidate cache on refresh', async () => {
      let requestCount = 0;
      server.use(
        http.get('/api/v2/system/environment', () => {
          requestCount++;
          return HttpResponse.json({
            ...mockSystemInfoData,
            platform: {
              ...mockSystemInfoData.platform,
              version: `5.0.${requestCount}`,
            },
          });
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('5.0.1')).toBeInTheDocument();
      });

      // Trigger refresh
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('5.0.2')).toBeInTheDocument();
      });

      expect(requestCount).toBe(2);
    });
  });

  describe('Accessibility', () => {
    it('should meet WCAG 2.1 AA standards', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should provide proper heading hierarchy', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Main heading
        expect(screen.getByRole('heading', { level: 1, name: 'System Information' })).toBeInTheDocument();
        
        // Section headings
        expect(screen.getByRole('heading', { level: 2, name: 'DreamFactory Instance' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Server Information' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Client Information' })).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });

      // Test keyboard navigation through interactive elements
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      
      // Focus should be manageable via keyboard
      refreshButton.focus();
      expect(refreshButton).toHaveFocus();

      // Tab navigation should work
      await user.tab();
      // Next focusable element should receive focus
    });

    it('should announce dynamic content changes to screen readers', async () => {
      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe('Internationalization', () => {
    it('should display translated content', async () => {
      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        // Check that localized content is displayed
        expect(screen.getByText('License Level:')).toBeInTheDocument();
        expect(screen.getByText('DreamFactory Version:')).toBeInTheDocument();
        expect(screen.getByText('Server Information')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const startTime = performance.now();

      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(mockSystemInfoData);
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('DreamFactory Instance')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (under 1000ms for this test)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle large package lists efficiently', async () => {
      const largePackageList = Array.from({ length: 1000 }, (_, i) => ({
        name: `package-${i}`,
        version: `1.0.${i}`,
      }));

      const largeSystemInfo = {
        ...mockSystemInfoData,
        platform: {
          ...mockSystemInfoData.platform,
          packages: largePackageList,
        },
      };

      server.use(
        http.get('/api/v2/system/environment', () => {
          return HttpResponse.json(largeSystemInfo);
        })
      );

      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <SystemInfoPage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Installed Packages')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should still render efficiently with large data sets
      expect(renderTime).toBeLessThan(2000);
    });
  });
});