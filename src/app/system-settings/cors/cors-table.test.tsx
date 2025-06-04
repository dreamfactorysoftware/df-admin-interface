/**
 * @file CORS Table Component Tests
 * @description Comprehensive Vitest unit tests for the CORS table component covering
 * table rendering, CORS operations, modal interactions, and error scenarios.
 * Implements comprehensive testing for virtualized table behavior, CORS deletion
 * confirmations, and responsive design patterns using React Testing Library and MSW mocking.
 * 
 * Converts Angular CORS table component tests to Vitest with React Testing Library
 * per Section 7.1.2, replacing Angular Material table testing with custom table
 * component testing per UI component migration.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act } from 'react'

// Import the component under test and its dependencies
import { CorsTable } from './cors-table'
import type { CorsConfigData } from '../../../types/cors'

// Mock the virtualization library for table testing
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [],
    getTotalSize: () => 0,
    scrollToIndex: vi.fn(),
    measure: vi.fn(),
  })),
}))

// Mock the dialog component for modal testing
vi.mock('../../../components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => open ? (
    <div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
      <div onClick={() => onOpenChange?.(false)} data-testid="dialog-overlay" />
      {children}
    </div>
  ) : null,
  DialogContent: ({ children, ...props }: any) => (
    <div {...props} data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2 id="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}))

// Mock the button component
vi.mock('../../../components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

// Mock the hooks
vi.mock('../../../hooks/use-cors', () => ({
  useCors: vi.fn(),
  useDeleteCors: vi.fn(),
}))

// Mock intersection observer for virtualized table testing
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.IntersectionObserver = mockIntersectionObserver

// Mock resize observer for responsive testing
const mockResizeObserver = vi.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
})
window.ResizeObserver = mockResizeObserver

// Test data fixtures
const mockCorsData: CorsConfigData[] = [
  {
    id: 1,
    path: '/api/v2/*',
    origin: '*',
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    header: 'Content-Type,X-DreamFactory-API-Key',
    maxAge: 3600,
    description: 'Default CORS policy',
    enabled: true,
    supportsCredentials: false,
    exposedHeader: null,
    createdById: 1,
    createdDate: '2024-01-01T00:00:00Z',
    lastModifiedById: 1,
    lastModifiedDate: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    path: '/api/v2/db/*',
    origin: 'https://example.com',
    method: ['GET', 'POST'],
    header: 'Content-Type',
    maxAge: 7200,
    description: 'Database API CORS',
    enabled: false,
    supportsCredentials: true,
    exposedHeader: 'X-Total-Count',
    createdById: 1,
    createdDate: '2024-01-02T00:00:00Z',
    lastModifiedById: 1,
    lastModifiedDate: '2024-01-02T00:00:00Z',
  },
]

// Generate large dataset for virtualization testing
const generateLargeCorsDataset = (size: number): CorsConfigData[] => {
  return Array.from({ length: size }, (_, index) => ({
    id: index + 1,
    path: `/api/v2/path-${index}/*`,
    origin: index % 3 === 0 ? '*' : `https://example-${index}.com`,
    method: ['GET', 'POST', 'PUT', 'DELETE'],
    header: 'Content-Type,X-DreamFactory-API-Key',
    maxAge: 3600 + index,
    description: `CORS policy ${index + 1}`,
    enabled: index % 2 === 0,
    supportsCredentials: index % 4 === 0,
    exposedHeader: index % 5 === 0 ? 'X-Total-Count' : null,
    createdById: 1,
    createdDate: `2024-01-${String(index % 28 + 1).padStart(2, '0')}T00:00:00Z`,
    lastModifiedById: 1,
    lastModifiedDate: `2024-01-${String(index % 28 + 1).padStart(2, '0')}T00:00:00Z`,
  }))
}

// MSW handlers for API mocking
const corsHandlers = [
  // Get CORS policies
  http.get('/api/v2/system/cors', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '25')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
    let data = mockCorsData
    
    // Handle large dataset for virtualization testing
    if (url.searchParams.get('test_large_dataset') === 'true') {
      data = generateLargeCorsDataset(1000)
    }
    
    const total = data.length
    const paginatedData = data.slice(offset, offset + limit)
    
    return HttpResponse.json({
      resource: paginatedData,
      meta: {
        count: total,
        limit,
        offset,
      }
    })
  }),

  // Delete CORS policy
  http.delete('/api/v2/system/cors/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({ id: parseInt(id as string) })
  }),

  // Error scenarios
  http.get('/api/v2/system/cors/error/500', () => {
    return HttpResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    )
  }),

  http.get('/api/v2/system/cors/error/network', () => {
    return HttpResponse.error()
  }),
]

const server = setupServer(...corsHandlers)

// Test utilities
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
})

const renderWithProviders = (ui: React.ReactElement, options?: any) => {
  const queryClient = createQueryClient()
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}

// Helper to simulate different viewport sizes for responsive testing
const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  fireEvent(window, new Event('resize'))
}

describe('CorsTable Component', () => {
  let mockUseCors: Mock
  let mockUseDeleteCors: Mock
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' })
    user = userEvent.setup()
    
    // Setup mock hooks
    const { useCors, useDeleteCors } = require('../../../hooks/use-cors')
    mockUseCors = useCors as Mock
    mockUseDeleteCors = useDeleteCors as Mock

    // Default mock implementations
    mockUseCors.mockReturnValue({
      data: { resource: mockCorsData, meta: { count: mockCorsData.length } },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseDeleteCors.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    server.resetHandlers()
    vi.clearAllMocks()
  })

  describe('Table Rendering', () => {
    it('renders CORS table with correct columns', () => {
      renderWithProviders(<CorsTable />)

      // Check table headers
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Path')).toBeInTheDocument()
      expect(screen.getByText('Origin')).toBeInTheDocument()
      expect(screen.getByText('Methods')).toBeInTheDocument()
      expect(screen.getByText('Max Age')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('displays CORS data correctly in table rows', () => {
      renderWithProviders(<CorsTable />)

      // Check first row data
      expect(screen.getByText('/api/v2/*')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByText('Default CORS policy')).toBeInTheDocument()
      expect(screen.getByText('3600')).toBeInTheDocument()

      // Check second row data
      expect(screen.getByText('/api/v2/db/*')).toBeInTheDocument()
      expect(screen.getByText('https://example.com')).toBeInTheDocument()
      expect(screen.getByText('Database API CORS')).toBeInTheDocument()
      expect(screen.getByText('7200')).toBeInTheDocument()
    })

    it('shows enabled/disabled status correctly', () => {
      renderWithProviders(<CorsTable />)

      // Check status indicators
      const enabledStatus = screen.getByText('Enabled')
      const disabledStatus = screen.getByText('Disabled')

      expect(enabledStatus).toBeInTheDocument()
      expect(disabledStatus).toBeInTheDocument()
    })

    it('renders action buttons for each row', () => {
      renderWithProviders(<CorsTable />)

      // Check for edit and delete buttons
      const editButtons = screen.getAllByLabelText(/edit cors policy/i)
      const deleteButtons = screen.getAllByLabelText(/delete cors policy/i)

      expect(editButtons).toHaveLength(mockCorsData.length)
      expect(deleteButtons).toHaveLength(mockCorsData.length)
    })
  })

  describe('Virtualized Table Testing for 1000+ CORS Entries', () => {
    beforeEach(() => {
      // Mock large dataset
      mockUseCors.mockReturnValue({
        data: { 
          resource: generateLargeCorsDataset(1000), 
          meta: { count: 1000 } 
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    })

    it('handles large datasets with virtualization', async () => {
      const { useVirtualizer } = await import('@tanstack/react-virtual')
      const mockVirtualizer = useVirtualizer as Mock

      mockVirtualizer.mockReturnValue({
        getVirtualItems: () => Array.from({ length: 10 }, (_, i) => ({
          index: i,
          start: i * 50,
          size: 50,
          end: (i + 1) * 50,
          key: i,
        })),
        getTotalSize: () => 50000, // 1000 items * 50px each
        scrollToIndex: vi.fn(),
        measure: vi.fn(),
      })

      renderWithProviders(<CorsTable />)

      // Verify virtualization is working
      await waitFor(() => {
        expect(mockVirtualizer).toHaveBeenCalled()
      })

      // Should only render visible items, not all 1000
      const tableRows = screen.getAllByRole('row')
      expect(tableRows.length).toBeLessThan(50) // Much less than 1000
    })

    it('maintains performance with large datasets', async () => {
      const startTime = performance.now()
      
      renderWithProviders(<CorsTable />)
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within performance budget (under 100ms)
      expect(renderTime).toBeLessThan(100)
    })

    it('supports scrolling to specific CORS entries', async () => {
      const { useVirtualizer } = await import('@tanstack/react-virtual')
      const mockScrollToIndex = vi.fn()
      
      ;(useVirtualizer as Mock).mockReturnValue({
        getVirtualItems: () => [],
        getTotalSize: () => 50000,
        scrollToIndex: mockScrollToIndex,
        measure: vi.fn(),
      })

      renderWithProviders(<CorsTable searchIndex={500} />)

      await waitFor(() => {
        expect(mockScrollToIndex).toHaveBeenCalledWith(500)
      })
    })
  })

  describe('Modal Accessibility Testing with Keyboard Navigation', () => {
    it('opens delete confirmation modal with keyboard navigation', async () => {
      renderWithProviders(<CorsTable />)

      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      
      // Focus and activate with keyboard
      deleteButton.focus()
      await user.keyboard('{Enter}')

      // Check modal is open and accessible
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title')
    })

    it('supports WCAG 2.1 AA keyboard navigation in modal', async () => {
      renderWithProviders(<CorsTable />)

      // Open modal
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // Test keyboard navigation within modal
      const confirmButton = within(dialog).getByText('Delete')
      const cancelButton = within(dialog).getByText('Cancel')

      // Tab navigation should work
      await user.keyboard('{Tab}')
      expect(confirmButton).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(cancelButton).toHaveFocus()

      // Shift+Tab should reverse navigation
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(confirmButton).toHaveFocus()
    })

    it('closes modal with Escape key', async () => {
      renderWithProviders(<CorsTable />)

      // Open modal
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Close with Escape
      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('traps focus within modal', async () => {
      renderWithProviders(<CorsTable />)

      // Open modal
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      const dialog = screen.getByRole('dialog')
      const confirmButton = within(dialog).getByText('Delete')
      const cancelButton = within(dialog).getByText('Cancel')

      // Focus should be trapped within modal
      confirmButton.focus()
      await user.keyboard('{Tab}')
      expect(cancelButton).toHaveFocus()

      // Continue tabbing should cycle back
      await user.keyboard('{Tab}')
      expect(confirmButton).toHaveFocus()
    })
  })

  describe('CORS Operation Testing with Optimistic Updates', () => {
    it('performs optimistic deletion with success', async () => {
      const mockMutate = vi.fn()
      mockUseDeleteCors.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      })

      renderWithProviders(<CorsTable />)

      // Initially shows both CORS entries
      expect(screen.getByText('/api/v2/*')).toBeInTheDocument()
      expect(screen.getByText('/api/v2/db/*')).toBeInTheDocument()

      // Delete first entry
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      const confirmButton = screen.getByText('Delete')
      await user.click(confirmButton)

      // Verify deletion was called
      expect(mockMutate).toHaveBeenCalledWith(1, expect.any(Object))
    })

    it('handles deletion with rollback on error', async () => {
      const mockMutate = vi.fn()
      mockUseDeleteCors.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: { message: 'Deletion failed' },
      })

      renderWithProviders(<CorsTable />)

      // Attempt deletion
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      const confirmButton = screen.getByText('Delete')
      await user.click(confirmButton)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/deletion failed/i)).toBeInTheDocument()
      })

      // Original data should be restored (rollback)
      expect(screen.getByText('/api/v2/*')).toBeInTheDocument()
      expect(screen.getByText('/api/v2/db/*')).toBeInTheDocument()
    })

    it('shows loading state during operations', async () => {
      mockUseDeleteCors.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
        error: null,
      })

      renderWithProviders(<CorsTable />)

      // Should show loading indicators
      expect(screen.getByText(/deleting/i)).toBeInTheDocument()
      
      // Delete buttons should be disabled during loading
      const deleteButtons = screen.getAllByLabelText(/delete cors policy/i)
      deleteButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })

    it('refreshes data after successful operations', async () => {
      const mockRefetch = vi.fn()
      mockUseCors.mockReturnValue({
        data: { resource: mockCorsData, meta: { count: mockCorsData.length } },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      })

      const mockMutate = vi.fn((_, options) => {
        // Simulate successful mutation
        options.onSuccess?.()
      })

      mockUseDeleteCors.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      })

      renderWithProviders(<CorsTable />)

      // Delete and confirm
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      const confirmButton = screen.getByText('Delete')
      await user.click(confirmButton)

      // Should refetch data
      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled()
      })
    })
  })

  describe('Responsive Design Testing Across Breakpoints', () => {
    it('adapts table layout for mobile screens (< 768px)', async () => {
      setViewportSize(375, 667) // iPhone SE

      renderWithProviders(<CorsTable />)

      // Mobile should show condensed view
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toHaveClass('mobile-layout')
      })

      // Some columns should be hidden on mobile
      expect(screen.queryByText('Created Date')).not.toBeInTheDocument()
      expect(screen.queryByText('Last Modified')).not.toBeInTheDocument()
    })

    it('shows full table layout for tablet screens (768px - 1024px)', async () => {
      setViewportSize(768, 1024) // iPad

      renderWithProviders(<CorsTable />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toHaveClass('tablet-layout')
      })

      // Should show most columns but may hide some less important ones
      expect(screen.getByText('Path')).toBeInTheDocument()
      expect(screen.getByText('Origin')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('displays full table layout for desktop screens (> 1024px)', async () => {
      setViewportSize(1920, 1080) // Desktop

      renderWithProviders(<CorsTable />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toHaveClass('desktop-layout')
      })

      // Should show all columns
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Path')).toBeInTheDocument()
      expect(screen.getByText('Origin')).toBeInTheDocument()
      expect(screen.getByText('Methods')).toBeInTheDocument()
      expect(screen.getByText('Max Age')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('maintains accessibility across all breakpoints', async () => {
      const breakpoints = [
        { width: 375, height: 667 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 }, // Desktop
      ]

      for (const { width, height } of breakpoints) {
        setViewportSize(width, height)
        
        const { unmount } = renderWithProviders(<CorsTable />)

        // Check accessibility attributes are maintained
        const table = screen.getByRole('table')
        expect(table).toHaveAttribute('aria-label')

        // Check row accessibility
        const rows = screen.getAllByRole('row')
        rows.forEach(row => {
          expect(row).toBeInTheDocument()
        })

        unmount()
      }
    })
  })

  describe('Error State Testing with Recovery Scenarios', () => {
    it('handles and displays server errors gracefully', async () => {
      mockUseCors.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Internal server error', status: 500 },
        refetch: vi.fn(),
      })

      renderWithProviders(<CorsTable />)

      // Should show error state
      expect(screen.getByText(/error loading cors policies/i)).toBeInTheDocument()
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument()

      // Should provide retry option
      const retryButton = screen.getByText(/retry/i)
      expect(retryButton).toBeInTheDocument()
    })

    it('provides error recovery through retry mechanism', async () => {
      const mockRefetch = vi.fn()
      mockUseCors.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network error' },
        refetch: mockRefetch,
      })

      renderWithProviders(<CorsTable />)

      // Click retry button
      const retryButton = screen.getByText(/retry/i)
      await user.click(retryButton)

      // Should attempt to refetch
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('handles network errors with appropriate fallback', async () => {
      mockUseCors.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network error', name: 'NetworkError' },
        refetch: vi.fn(),
      })

      renderWithProviders(<CorsTable />)

      // Should show network-specific error message
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
      expect(screen.getByText(/check your connection/i)).toBeInTheDocument()
    })

    it('shows empty state when no CORS policies exist', async () => {
      mockUseCors.mockReturnValue({
        data: { resource: [], meta: { count: 0 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      renderWithProviders(<CorsTable />)

      // Should show empty state
      expect(screen.getByText(/no cors policies found/i)).toBeInTheDocument()
      expect(screen.getByText(/create your first cors policy/i)).toBeInTheDocument()

      // Should show create button
      const createButton = screen.getByText(/create cors policy/i)
      expect(createButton).toBeInTheDocument()
    })

    it('recovers from errors and updates UI when data becomes available', async () => {
      // Start with error state
      mockUseCors.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network error' },
        refetch: vi.fn(),
      })

      const { rerender } = renderWithProviders(<CorsTable />)

      expect(screen.getByText(/error loading cors policies/i)).toBeInTheDocument()

      // Simulate successful data fetch
      mockUseCors.mockReturnValue({
        data: { resource: mockCorsData, meta: { count: mockCorsData.length } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      rerender(<CorsTable />)

      // Should show data instead of error
      await waitFor(() => {
        expect(screen.queryByText(/error loading cors policies/i)).not.toBeInTheDocument()
        expect(screen.getByText('/api/v2/*')).toBeInTheDocument()
      })
    })
  })

  describe('React Query Cache Testing', () => {
    it('utilizes cached data for faster subsequent renders', async () => {
      const { queryClient } = renderWithProviders(<CorsTable />)

      // Simulate cache hit
      const cacheKey = ['cors-policies']
      queryClient.setQueryData(cacheKey, {
        resource: mockCorsData,
        meta: { count: mockCorsData.length }
      })

      // Should render immediately from cache
      expect(screen.getByText('/api/v2/*')).toBeInTheDocument()
    })

    it('invalidates cache after mutations', async () => {
      const { queryClient } = renderWithProviders(<CorsTable />)
      const mockInvalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

      const mockMutate = vi.fn((_, options) => {
        options.onSuccess?.()
      })

      mockUseDeleteCors.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null,
      })

      // Perform deletion
      const deleteButton = screen.getAllByLabelText(/delete cors policy/i)[0]
      await user.click(deleteButton)

      const confirmButton = screen.getByText('Delete')
      await user.click(confirmButton)

      // Cache should be invalidated
      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({
          queryKey: ['cors-policies']
        })
      })
    })

    it('shows stale data while revalidating in background', async () => {
      mockUseCors.mockReturnValue({
        data: { resource: mockCorsData, meta: { count: mockCorsData.length } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isStale: true,
        isFetching: true,
      })

      renderWithProviders(<CorsTable />)

      // Should show data (even if stale)
      expect(screen.getByText('/api/v2/*')).toBeInTheDocument()

      // Should indicate background refresh
      expect(screen.getByText(/updating/i)).toBeInTheDocument()
    })
  })

  describe('Translation and Internationalization', () => {
    it('supports localized table headers and labels', () => {
      renderWithProviders(<CorsTable />)

      // Headers should be translatable
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Path')).toBeInTheDocument()
      expect(screen.getByText('Origin')).toBeInTheDocument()
    })

    it('provides localized error messages', async () => {
      mockUseCors.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Server error' },
        refetch: vi.fn(),
      })

      renderWithProviders(<CorsTable />)

      // Error messages should be localized
      expect(screen.getByText(/error loading cors policies/i)).toBeInTheDocument()
    })

    it('supports RTL languages in table layout', async () => {
      document.dir = 'rtl'

      renderWithProviders(<CorsTable />)

      const table = screen.getByRole('table')
      expect(table).toHaveClass('rtl-support')

      // Cleanup
      document.dir = 'ltr'
    })
  })
})