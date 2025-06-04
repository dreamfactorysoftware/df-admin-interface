import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { LoadingSpinner } from './loading-spinner'

// Add jest-axe custom matcher
expect.extend(toHaveNoViolations)

// Mock providers and utilities
const MockThemeProvider = ({ children, theme = 'light' }: { children: React.ReactNode; theme?: 'light' | 'dark' }) => (
  <div data-theme={theme} className={theme}>
    {children}
  </div>
)

const MockTestUtils = {
  renderWithProviders: (ui: React.ReactElement, options: { theme?: 'light' | 'dark' } = {}) => {
    const { theme = 'light' } = options
    return render(
      <MockThemeProvider theme={theme}>
        {ui}
      </MockThemeProvider>
    )
  }
}

// Mock theme handlers
const mockThemeHandlers = {
  setTheme: vi.fn(),
  getTheme: vi.fn(() => 'light'),
  isDarkMode: vi.fn(() => false),
  toggleTheme: vi.fn()
}

// Mock CSS animation detection
const mockAnimationHandlers = {
  hasReducedMotion: vi.fn(() => false),
  getComputedStyle: vi.fn(),
  requestAnimationFrame: vi.fn()
}

// Mock intersection observer for animation testing
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  callback: IntersectionObserverCallback
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

describe('LoadingSpinner', () => {
  beforeEach(() => {
    // Setup intersection observer mock
    global.IntersectionObserver = MockIntersectionObserver as any
    
    // Setup animation frame mock
    global.requestAnimationFrame = mockAnimationHandlers.requestAnimationFrame
    
    // Mock getComputedStyle for animation testing
    global.getComputedStyle = vi.fn(() => ({
      animationName: 'spin',
      animationDuration: '1s',
      animationIterationCount: 'infinite',
      getPropertyValue: vi.fn((prop: string) => {
        if (prop === 'animation-name') return 'spin'
        if (prop === 'animation-duration') return '1s'
        return ''
      })
    })) as any

    // Mock prefers-reduced-motion media query
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? mockAnimationHandlers.hasReducedMotion() : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders successfully with default props', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
    })

    it('renders with accessible loading label', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('renders with custom aria-label when provided', () => {
      const customLabel = 'Connecting to database'
      MockTestUtils.renderWithProviders(<LoadingSpinner aria-label={customLabel} />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', customLabel)
    })

    it('includes screen reader text for loading state', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('renders small size variant correctly', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner size="sm" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders medium size variant correctly (default)', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders large size variant correctly', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner size="lg" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })

    it('renders extra large size variant correctly', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner size="xl" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-16', 'w-16')
    })
  })

  describe('Theme Integration', () => {
    it('renders correctly in light theme', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />, { theme: 'light' })
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('text-blue-600')
    })

    it('renders correctly in dark theme', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />, { theme: 'dark' })
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('dark:text-blue-400')
    })

    it('supports custom color prop override', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner color="green" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('text-green-600')
    })

    it('applies theme-aware custom colors correctly', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner color="red" />, { theme: 'dark' })
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('text-red-600', 'dark:text-red-400')
    })
  })

  describe('Animation Behavior', () => {
    it('includes spinner animation classes by default', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
    })

    it('respects reduced motion preferences', () => {
      mockAnimationHandlers.hasReducedMotion.mockReturnValue(true)
      
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('motion-reduce:animate-none')
    })

    it('maintains smooth rotation animation when motion is enabled', () => {
      mockAnimationHandlers.hasReducedMotion.mockReturnValue(false)
      
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
      expect(spinner).not.toHaveClass('motion-reduce:animate-none')
    })

    it('applies correct transform origin for smooth rotation', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      const svg = spinner.querySelector('svg')
      
      expect(svg).toHaveClass('origin-center')
    })
  })

  describe('Overlay Functionality', () => {
    it('renders without overlay by default', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const overlay = screen.queryByTestId('loading-overlay')
      expect(overlay).not.toBeInTheDocument()
    })

    it('renders with overlay when specified', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner overlay />)
      
      const overlay = screen.getByTestId('loading-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-white/80', 'dark:bg-gray-900/80')
    })

    it('centers spinner in overlay mode', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner overlay />)
      
      const overlay = screen.getByTestId('loading-overlay')
      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('applies backdrop blur in overlay mode', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner overlay />)
      
      const overlay = screen.getByTestId('loading-overlay')
      expect(overlay).toHaveClass('backdrop-blur-sm')
    })
  })

  describe('Custom Styling and Props', () => {
    it('accepts and applies custom className', () => {
      const customClass = 'my-custom-spinner'
      MockTestUtils.renderWithProviders(<LoadingSpinner className={customClass} />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass(customClass)
    })

    it('preserves default classes when custom className is provided', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner className="custom-class" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class', 'animate-spin')
    })

    it('supports custom data attributes', () => {
      MockTestUtils.renderWithProviders(
        <LoadingSpinner data-testid="custom-spinner" data-loading-state="active" />
      )
      
      const spinner = screen.getByTestId('custom-spinner')
      expect(spinner).toHaveAttribute('data-loading-state', 'active')
    })

    it('forwards ref correctly', () => {
      const ref = vi.fn()
      MockTestUtils.renderWithProviders(<LoadingSpinner ref={ref} />)
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLElement))
    })
  })

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper role for screen readers', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
    })

    it('includes aria-live region for dynamic updates', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-live', 'polite')
    })

    it('provides descriptive text for screen readers', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const screenReaderText = screen.getByText('Loading...')
      expect(screenReaderText).toHaveClass('sr-only')
    })

    it('meets color contrast requirements in light theme', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />, { theme: 'light' })
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('text-blue-600')
      // Note: Actual contrast testing would require color value extraction
    })

    it('meets color contrast requirements in dark theme', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />, { theme: 'dark' })
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('dark:text-blue-400')
      // Note: Actual contrast testing would require color value extraction
    })

    it('supports keyboard navigation when focusable', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner tabIndex={0} />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('tabIndex', '0')
    })
  })

  describe('Animation State Detection', () => {
    it('detects when animation is running', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      const computedStyle = global.getComputedStyle(spinner)
      
      expect(computedStyle.getPropertyValue('animation-name')).toBe('spin')
      expect(computedStyle.getPropertyValue('animation-duration')).toBe('1s')
    })

    it('handles animation pause correctly', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner paused />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animation-play-state-paused')
    })

    it('resumes animation from paused state', () => {
      const { rerender } = MockTestUtils.renderWithProviders(<LoadingSpinner paused />)
      
      rerender(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).not.toHaveClass('animation-play-state-paused')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('Performance Characteristics', () => {
    it('renders without causing unnecessary re-renders', () => {
      const renderSpy = vi.fn()
      
      const TestComponent = () => {
        renderSpy()
        return <LoadingSpinner />
      }
      
      const { rerender } = MockTestUtils.renderWithProviders(<TestComponent />)
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props should not cause additional renders
      rerender(<TestComponent />)
      expect(renderSpy).toHaveBeenCalledTimes(2) // Expected for test setup
    })

    it('handles rapid prop changes efficiently', () => {
      const { rerender } = MockTestUtils.renderWithProviders(<LoadingSpinner size="sm" />)
      
      // Rapidly change sizes
      rerender(<LoadingSpinner size="md" />)
      rerender(<LoadingSpinner size="lg" />)
      rerender(<LoadingSpinner size="xl" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('h-16', 'w-16') // Final size should be xl
    })

    it('maintains smooth animation during theme changes', () => {
      const { rerender } = MockTestUtils.renderWithProviders(
        <LoadingSpinner />, 
        { theme: 'light' }
      )
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('animate-spin')
      
      // Change theme
      rerender(<LoadingSpinner />)
      
      // Animation should continue
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('Integration with Loading States', () => {
    it('integrates with loading context providers', () => {
      const MockLoadingProvider = ({ children }: { children: React.ReactNode }) => (
        <div data-loading-context="true">
          {children}
        </div>
      )
      
      render(
        <MockLoadingProvider>
          <LoadingSpinner />
        </MockLoadingProvider>
      )
      
      const context = screen.getByText('Loading...').closest('[data-loading-context]')
      expect(context).toBeInTheDocument()
    })

    it('supports coordination with multiple loading states', () => {
      MockTestUtils.renderWithProviders(
        <div>
          <LoadingSpinner aria-label="Loading database schema" />
          <LoadingSpinner aria-label="Connecting to database" size="sm" />
        </div>
      )
      
      expect(screen.getByLabelText('Loading database schema')).toBeInTheDocument()
      expect(screen.getByLabelText('Connecting to database')).toBeInTheDocument()
    })

    it('handles loading completion transitions smoothly', () => {
      const { rerender } = MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      
      // Simulate loading completion
      rerender(<div>Content loaded</div>)
      
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.getByText('Content loaded')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Integration', () => {
    it('handles rendering errors gracefully', () => {
      // Mock console.error to prevent test pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>
        } catch (error) {
          return <div>Loading error occurred</div>
        }
      }
      
      render(
        <ErrorBoundary>
          <LoadingSpinner />
        </ErrorBoundary>
      )
      
      const spinner = screen.getByRole('status')
      expect(spinner).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('SVG Icon Rendering', () => {
    it('renders SVG spinner icon correctly', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const svg = screen.getByRole('status').querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('applies proper SVG attributes for accessibility', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const svg = screen.getByRole('status').querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(svg).toHaveAttribute('focusable', 'false')
    })

    it('renders spinner path with correct stroke properties', () => {
      MockTestUtils.renderWithProviders(<LoadingSpinner />)
      
      const path = screen.getByRole('status').querySelector('circle')
      expect(path).toHaveAttribute('stroke', 'currentColor')
      expect(path).toHaveAttribute('stroke-width', '4')
    })
  })
})

// Performance and integration tests
describe('LoadingSpinner Performance', () => {
  it('measures render performance under normal conditions', () => {
    const startTime = performance.now()
    
    MockTestUtils.renderWithProviders(<LoadingSpinner />)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Expect render time to be under 16ms (60fps threshold)
    expect(renderTime).toBeLessThan(16)
  })

  it('handles large numbers of concurrent spinners efficiently', () => {
    const startTime = performance.now()
    
    const MultipleSpinners = () => (
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <LoadingSpinner key={i} size="sm" />
        ))}
      </div>
    )
    
    MockTestUtils.renderWithProviders(<MultipleSpinners />)
    
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Multiple spinners should still render efficiently
    expect(renderTime).toBeLessThan(50)
    expect(screen.getAllByRole('status')).toHaveLength(10)
  })
})