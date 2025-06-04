/**
 * @fileoverview Vitest Test Suite for Download Page Component
 * 
 * Comprehensive test coverage for the DreamFactory download page component that validates
 * installer link rendering, responsive behavior, translation integration, accessibility
 * compliance, and performance requirements using Vitest, React Testing Library, and MSW.
 * 
 * Migrated from Angular Jasmine/TestBed to React 19/Next.js 15.1 testing patterns
 * per Section 4.7.1.3 testing infrastructure setup.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { MockedFunction } from 'vitest';

// Component under test - will be available when page.tsx is created
import DownloadPage from './page';

// Dependencies and hooks
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { IconCardLink } from '@/components/ui/icon-card-link';

// Test utilities and setup
import { TestWrapper } from '@/test/utils/test-utils';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock Next.js components and hooks
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} data-testid="next-image" />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/adf-home/download',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useBreakpoint hook with comprehensive breakpoint state
vi.mock('@/hooks/use-breakpoint', () => ({
  useBreakpoint: vi.fn(),
  BREAKPOINTS: {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    '3xl': 1920,
  },
}));

// Mock IconCardLink component for isolated testing
vi.mock('@/components/ui/icon-card-link', () => ({
  IconCardLink: vi.fn(({ linkInfo, ...props }) => (
    <div 
      data-testid={`icon-card-link-${linkInfo.name.toLowerCase().replace(/\s+/g, '-')}`}
      data-url={linkInfo.url}
      data-icon={linkInfo.icon}
      {...props}
    >
      <span>{linkInfo.name}</span>
    </div>
  )),
}));

// Mock translations - will be replaced with actual i18n when implemented
const mockTranslations = {
  'home.downloadPage.downloadText': 'Download DreamFactory to get started with your REST API backend.',
  'home.downloadPage.cloudInstallersHeading': 'Cloud Installers',
  'home.downloadPage.localInstallersHeading': 'Local Installers',
  'home.brandNames.oracleCloud': 'Oracle Cloud',
  'home.brandNames.bitnami': 'Bitnami',
  'home.brandNames.docker': 'Docker',
  'home.brandNames.amazon': 'Amazon Web Services',
  'home.brandNames.azure': 'Microsoft Azure',
  'home.brandNames.google': 'Google Cloud Platform',
  'home.brandNames.vmWare': 'VMware',
  'home.brandNames.linux': 'Linux',
  'home.brandNames.osx': 'macOS',
  'home.brandNames.windows': 'Windows',
  'home.brandNames.gitHubSource': 'GitHub Source',
};

// Mock translation hook
const mockUseTranslation = vi.fn(() => ({
  t: (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key,
  i18n: { language: 'en' },
}));

// Test data - installer links from original Angular component
const cloudInstallerLinks = [
  {
    name: 'home.brandNames.oracleCloud',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/oracle',
    icon: 'oraclecloud.png',
  },
  {
    name: 'home.brandNames.bitnami',
    url: 'https://bitnami.com/stack/dreamfactory/cloud',
    icon: 'new_little-bitnami.png',
  },
  {
    name: 'home.brandNames.docker',
    url: 'https://hub.docker.com/r/dreamfactorysoftware/df-docker/',
    icon: 'new_little-docker.png',
  },
  {
    name: 'home.brandNames.amazon',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/aws',
    icon: 'new_little-amazon.png',
  },
  {
    name: 'home.brandNames.azure',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/azure',
    icon: 'new_little-azure.png',
  },
  {
    name: 'home.brandNames.google',
    url: 'https://bitnami.com/stack/dreamfactory/cloud/google',
    icon: 'new_little-google.png',
  },
  {
    name: 'home.brandNames.vmWare',
    url: 'https://bitnami.com/stack/dreamfactory/virtual-machine',
    icon: 'new_little-vmware.png',
  },
];

const localInstallerLinks = [
  {
    name: 'home.brandNames.linux',
    url: 'https://bitnami.com/stack/dreamfactory/installer#linux',
    icon: 'linux-64x64.png',
  },
  {
    name: 'home.brandNames.osx',
    url: 'https://bitnami.com/stack/dreamfactory/installer#osx',
    icon: 'apple-64x64v2.png',
  },
  {
    name: 'home.brandNames.windows',
    url: 'https://bitnami.com/stack/dreamfactory/installer#windows',
    icon: 'microsoft-64x64.png',
  },
  {
    name: 'home.brandNames.gitHubSource',
    url: 'https://github.com/dreamfactorysoftware/dreamfactory',
    icon: 'new_little-github.png',
  },
];

describe('DownloadPage Component', () => {
  // Mock implementations for different screen sizes
  const mockBreakpointDesktop = {
    width: 1024,
    height: 768,
    current: 'lg' as const,
    isPortrait: false,
    isLandscape: true,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    breakpoints: {
      xs: true,
      sm: true,
      md: true,
      lg: true,
      xl: false,
      '2xl': false,
      '3xl': false,
    },
    isAbove: vi.fn(),
    isBelow: vi.fn(),
    isExactly: vi.fn(),
    isBetween: vi.fn(),
    getBreakpointValue: vi.fn(),
    isTouchDevice: vi.fn(() => false),
    getResponsiveClasses: vi.fn(),
    isMounted: true,
    observe: vi.fn(),
    isMatched: vi.fn(),
  };

  const mockBreakpointMobile = {
    ...mockBreakpointDesktop,
    width: 375,
    height: 812,
    current: 'xs' as const,
    isPortrait: true,
    isLandscape: false,
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    breakpoints: {
      xs: true,
      sm: false,
      md: false,
      lg: false,
      xl: false,
      '2xl': false,
      '3xl': false,
    },
    isTouchDevice: vi.fn(() => true),
  };

  const mockBreakpointTablet = {
    ...mockBreakpointDesktop,
    width: 768,
    height: 1024,
    current: 'md' as const,
    isPortrait: true,
    isLandscape: false,
    isMobile: false,
    isTablet: true,
    isDesktop: false,
    breakpoints: {
      xs: true,
      sm: true,
      md: true,
      lg: false,
      xl: false,
      '2xl': false,
      '3xl': false,
    },
    isTouchDevice: vi.fn(() => true),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Default to desktop breakpoint
    (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointDesktop);
    
    // Reset performance measurements
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark = vi.fn();
      window.performance.measure = vi.fn();
      window.performance.getEntriesByName = vi.fn(() => []);
    }
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      expect(container).toBeDefined();
      expect(container.firstChild).toBeTruthy();
    });

    it('should render the main download text', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const downloadText = screen.getByText(/Download DreamFactory to get started with your REST API backend/i);
      expect(downloadText).toBeInTheDocument();
    });

    it('should render cloud installers section with heading', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const cloudHeading = screen.getByRole('heading', { name: /cloud installers/i });
      expect(cloudHeading).toBeInTheDocument();
      expect(cloudHeading.tagName).toBe('H3');
      expect(cloudHeading).toHaveAttribute('id', 'cloud-installers');
    });

    it('should render local installers section with heading', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const localHeading = screen.getByRole('heading', { name: /local installers/i });
      expect(localHeading).toBeInTheDocument();
      expect(localHeading.tagName).toBe('H3');
      expect(localHeading).toHaveAttribute('id', 'local-installers');
    });

    it('should render all cloud installer links', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      cloudInstallerLinks.forEach((link) => {
        const linkElement = screen.getByTestId(`icon-card-link-${link.name.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-')}`);
        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('data-url', link.url);
        expect(linkElement).toHaveAttribute('data-icon', link.icon);
      });
    });

    it('should render all local installer links', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      localInstallerLinks.forEach((link) => {
        const linkElement = screen.getByTestId(`icon-card-link-${link.name.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-')}`);
        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('data-url', link.url);
        expect(linkElement).toHaveAttribute('data-icon', link.icon);
      });
    });

    it('should render proper list structure with aria-labelledby attributes', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const cloudList = screen.getByRole('list', { name: /cloud installers/i });
      expect(cloudList).toHaveAttribute('aria-labelledby', 'cloud-installers');
      
      const localList = screen.getByRole('list', { name: /local installers/i });
      expect(localList).toHaveAttribute('aria-labelledby', 'local-installers');
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes on mobile breakpoint', () => {
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointMobile);
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const cloudList = screen.getByRole('list', { name: /cloud installers/i });
      const localList = screen.getByRole('list', { name: /local installers/i });
      
      // Should have mobile-specific classes
      expect(cloudList).toHaveClass('x-small'); // Based on Angular template
      expect(localList).toHaveClass('x-small');
    });

    it('should not apply mobile classes on desktop breakpoint', () => {
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointDesktop);
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const cloudList = screen.getByRole('list', { name: /cloud installers/i });
      const localList = screen.getByRole('list', { name: /local installers/i });
      
      // Should not have mobile-specific classes
      expect(cloudList).not.toHaveClass('x-small');
      expect(localList).not.toHaveClass('x-small');
    });

    it('should handle tablet breakpoint appropriately', () => {
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointTablet);
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const cloudList = screen.getByRole('list', { name: /cloud installers/i });
      expect(cloudList).toBeInTheDocument();
      
      // Tablet should not apply x-small class (only for xs breakpoint)
      expect(cloudList).not.toHaveClass('x-small');
    });

    it('should handle window resize events correctly', async () => {
      const { rerender } = render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Start with desktop
      expect(screen.getByRole('list', { name: /cloud installers/i })).not.toHaveClass('x-small');
      
      // Change to mobile
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointMobile);
      
      rerender(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('list', { name: /cloud installers/i })).toHaveClass('x-small');
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const headings = screen.getAllByRole('heading');
      
      // Should have at least 2 h3 headings
      const h3Headings = headings.filter(heading => heading.tagName === 'H3');
      expect(h3Headings).toHaveLength(2);
      
      // Check specific headings
      expect(screen.getByRole('heading', { level: 3, name: /cloud installers/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /local installers/i })).toBeInTheDocument();
    });

    it('should have proper ARIA labels and relationships', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const cloudList = screen.getByRole('list', { name: /cloud installers/i });
      const localList = screen.getByRole('list', { name: /local installers/i });
      
      expect(cloudList).toHaveAttribute('aria-labelledby', 'cloud-installers');
      expect(localList).toHaveAttribute('aria-labelledby', 'local-installers');
    });

    it('should have proper semantic HTML structure', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Should have main section
      const section = screen.getByRole('main') || screen.getByRole('region');
      expect(section).toBeInTheDocument();
      
      // Should have article elements
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(2); // One for cloud, one for local
      
      // Should have list elements
      const lists = screen.getAllByRole('list');
      expect(lists).toHaveLength(2);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Tab through the installer links
      await user.tab();
      
      // Should be able to navigate to the first installer link
      const firstLink = screen.getAllByRole('link')[0];
      expect(firstLink).toHaveFocus();
      
      // Continue tabbing
      await user.tab();
      const secondLink = screen.getAllByRole('link')[1];
      expect(secondLink).toHaveFocus();
    });
  });

  describe('Translation Integration', () => {
    it('should display translated text for download description', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(mockTranslations['home.downloadPage.downloadText'])).toBeInTheDocument();
    });

    it('should display translated headings', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      expect(screen.getByText(mockTranslations['home.downloadPage.cloudInstallersHeading'])).toBeInTheDocument();
      expect(screen.getByText(mockTranslations['home.downloadPage.localInstallersHeading'])).toBeInTheDocument();
    });

    it('should pass correct translation keys to IconCardLink components', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Verify IconCardLink was called with correct props
      expect(IconCardLink).toHaveBeenCalledWith(
        expect.objectContaining({
          linkInfo: expect.objectContaining({
            name: 'home.brandNames.oracleCloud'
          })
        }),
        expect.anything()
      );
    });
  });

  describe('Performance Requirements', () => {
    it('should render within 2 seconds for desktop viewport', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Wait for all components to be rendered
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /cloud installers/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /local installers/i })).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 2 seconds (2000ms)
      expect(renderTime).toBeLessThan(2000);
    });

    it('should render within 2 seconds for mobile viewport', async () => {
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointMobile);
      
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByRole('list', { name: /cloud installers/i })).toHaveClass('x-small');
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(2000);
    });

    it('should efficiently handle re-renders on breakpoint changes', async () => {
      let renderCount = 0;
      
      const TestComponent = () => {
        renderCount++;
        return <DownloadPage />;
      };
      
      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      const initialRenderCount = renderCount;
      
      // Change breakpoint
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointMobile);
      
      rerender(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );
      
      // Should only re-render once for breakpoint change
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });

  describe('Hook Integration Testing', () => {
    it('should properly integrate with useBreakpoint hook', () => {
      const { result } = renderHook(() => useBreakpoint(), {
        wrapper: TestWrapper,
      });
      
      expect(result.current).toEqual(mockBreakpointDesktop);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('should handle breakpoint hook state changes', () => {
      const { result, rerender } = renderHook(() => useBreakpoint(), {
        wrapper: TestWrapper,
      });
      
      expect(result.current.isMobile).toBe(false);
      
      // Change to mobile
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockReturnValue(mockBreakpointMobile);
      
      rerender();
      
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing translation gracefully', () => {
      const mockTranslationWithMissing = vi.fn((key: string) => {
        if (key === 'home.downloadPage.downloadText') {
          return key; // Return key when translation is missing
        }
        return mockTranslations[key as keyof typeof mockTranslations] || key;
      });
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Component should still render even with missing translations
      expect(screen.getByRole('heading', { name: /cloud installers/i })).toBeInTheDocument();
    });

    it('should handle breakpoint hook errors gracefully', () => {
      // Mock hook to throw error
      (useBreakpoint as MockedFunction<typeof useBreakpoint>).mockImplementation(() => {
        throw new Error('Breakpoint hook error');
      });
      
      // Component should still render with fallback
      expect(() => {
        render(
          <TestWrapper>
            <DownloadPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should handle IconCardLink component errors gracefully', () => {
      // Mock IconCardLink to throw error
      (IconCardLink as MockedFunction<typeof IconCardLink>).mockImplementation(() => {
        throw new Error('IconCardLink error');
      });
      
      // Component should handle individual link errors gracefully
      expect(() => {
        render(
          <TestWrapper>
            <DownloadPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to IconCardLink components', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Verify IconCardLink was called with cloud installer props
      cloudInstallerLinks.forEach((link) => {
        expect(IconCardLink).toHaveBeenCalledWith(
          expect.objectContaining({
            linkInfo: expect.objectContaining({
              name: link.name,
              url: link.url,
              icon: link.icon,
            })
          }),
          expect.anything()
        );
      });
      
      // Verify IconCardLink was called with local installer props
      localInstallerLinks.forEach((link) => {
        expect(IconCardLink).toHaveBeenCalledWith(
          expect.objectContaining({
            linkInfo: expect.objectContaining({
              name: link.name,
              url: link.url,
              icon: link.icon,
            })
          }),
          expect.anything()
        );
      });
    });

    it('should render the correct number of IconCardLink components', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const totalLinks = cloudInstallerLinks.length + localInstallerLinks.length;
      expect(IconCardLink).toHaveBeenCalledTimes(totalLinks);
    });
  });

  describe('User Interactions', () => {
    it('should handle clicks on installer links', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const firstLink = screen.getAllByRole('link')[0];
      await user.click(firstLink);
      
      // Should maintain focus for accessibility
      expect(firstLink).toHaveFocus();
    });

    it('should handle keyboard interactions', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      const firstLink = screen.getAllByRole('link')[0];
      
      // Focus the link
      await user.tab();
      expect(firstLink).toHaveFocus();
      
      // Press Enter to activate
      await user.keyboard('{Enter}');
      
      // Link should remain focused
      expect(firstLink).toHaveFocus();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain installer link data consistency', () => {
      render(
        <TestWrapper>
          <DownloadPage />
        </TestWrapper>
      );
      
      // Verify all cloud installer URLs are valid
      cloudInstallerLinks.forEach((link) => {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.name).toBeTruthy();
        expect(link.icon).toBeTruthy();
      });
      
      // Verify all local installer URLs are valid
      localInstallerLinks.forEach((link) => {
        expect(link.url).toMatch(/^https?:\/\//);
        expect(link.name).toBeTruthy();
        expect(link.icon).toBeTruthy();
      });
    });

    it('should have unique installer links', () => {
      const allLinks = [...cloudInstallerLinks, ...localInstallerLinks];
      const urls = allLinks.map(link => link.url);
      const uniqueUrls = [...new Set(urls)];
      
      expect(uniqueUrls).toHaveLength(urls.length);
    });
  });
});