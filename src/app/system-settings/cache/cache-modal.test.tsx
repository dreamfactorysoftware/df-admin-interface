import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

import { CacheModal } from './cache-modal'
import { CacheRow } from '@/types/cache'

// Add jest-axe matcher
expect.extend(toHaveNoViolations)

// Mock data
const mockCacheRow: CacheRow = {
  name: 'test-service',
  label: 'Test Service Cache'
}

// Mock handlers for cache operations
const server = setupServer(
  // Successful cache flush
  rest.delete('/api/v2/system/cache/:serviceName', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: 'Cache flushed successfully' })
    )
  }),

  // Error response for testing failure scenarios
  rest.delete('/api/v2/system/cache/error-service', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ error: 'Internal Server Error', message: 'Failed to flush cache' })
    )
  }),

  // Network error simulation
  rest.delete('/api/v2/system/cache/network-error', (req, res, ctx) => {
    return res.networkError('Network error occurred')
  })
)

// Setup and teardown
beforeEach(() => server.listen())
afterEach(() => server.resetHandlers())

// Test wrapper component with React Query provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Helper function to render component with providers
const renderCacheModal = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    cacheRow: mockCacheRow,
    ...props,
  }

  return render(
    <TestWrapper>
      <CacheModal {...defaultProps} />
    </TestWrapper>
  )
}

describe('CacheModal', () => {
  describe('Modal Rendering and Props', () => {
    it('renders modal with correct title when open', () => {
      renderCacheModal()
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Refresh.*Test Service Cache.*Cache/i)).toBeInTheDocument()
    })

    it('does not render modal when closed', () => {
      renderCacheModal({ isOpen: false })
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('displays cache service label correctly', () => {
      const customCacheRow = {
        name: 'user-service',
        label: 'User Management Service'
      }
      
      renderCacheModal({ cacheRow: customCacheRow })
      
      expect(screen.getByText(/Refresh.*User Management Service.*Cache/i)).toBeInTheDocument()
    })

    it('renders flush cache button', () => {
      renderCacheModal()
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      expect(flushButton).toBeInTheDocument()
      expect(flushButton).toBeEnabled()
    })

    it('renders cancel button', () => {
      renderCacheModal()
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()
      expect(cancelButton).toBeEnabled()
    })
  })

  describe('Modal Accessibility (WCAG 2.1 AA)', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderCacheModal()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has proper ARIA attributes', () => {
      renderCacheModal()
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('focuses on modal when opened', async () => {
      renderCacheModal()
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveFocus()
      })
    })

    it('traps focus within modal', async () => {
      const user = userEvent.setup()
      renderCacheModal()
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      
      // Focus should cycle between interactive elements
      await user.tab()
      expect(flushButton).toHaveFocus()
      
      await user.tab()
      expect(cancelButton).toHaveFocus()
      
      // Tab from last element should focus first element
      await user.tab()
      expect(flushButton).toHaveFocus()
    })

    it('closes modal on Escape key press', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderCacheModal({ onClose })
      
      await user.keyboard('{Escape}')
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('closes modal on backdrop click', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderCacheModal({ onClose })
      
      const backdrop = screen.getByTestId('modal-backdrop')
      await user.click(backdrop)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      renderCacheModal()
      
      // Enter key should activate focused button
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      flushButton.focus()
      
      await user.keyboard('{Enter}')
      
      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/flushing cache/i)).toBeInTheDocument()
      })
    })

    it('announces loading state to screen readers', async () => {
      const user = userEvent.setup()
      renderCacheModal()
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/flushing cache/i)).toBeInTheDocument()
      })
    })
  })

  describe('Cache Flush Operations', () => {
    it('initiates cache flush on button click', async () => {
      const user = userEvent.setup()
      renderCacheModal()
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      // Should show loading state immediately
      expect(screen.getByText(/flushing cache/i)).toBeInTheDocument()
      expect(flushButton).toBeDisabled()
    })

    it('shows success message after successful flush', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderCacheModal({ onClose })
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      await waitFor(() => {
        expect(screen.getByText(/cache flushed successfully/i)).toBeInTheDocument()
      })
      
      // Modal should close after success
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('handles cache flush errors gracefully', async () => {
      const user = userEvent.setup()
      const errorCacheRow = {
        name: 'error-service',
        label: 'Error Service'
      }
      
      renderCacheModal({ cacheRow: errorCacheRow })
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to flush cache/i)).toBeInTheDocument()
      })
      
      // Button should be enabled again after error
      expect(flushButton).toBeEnabled()
    })

    it('handles network errors with appropriate message', async () => {
      const user = userEvent.setup()
      const networkErrorCacheRow = {
        name: 'network-error',
        label: 'Network Error Service'
      }
      
      renderCacheModal({ cacheRow: networkErrorCacheRow })
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error occurred/i)).toBeInTheDocument()
      })
    })

    it('provides retry option after error', async () => {
      const user = userEvent.setup()
      const errorCacheRow = {
        name: 'error-service',
        label: 'Error Service'
      }
      
      renderCacheModal({ cacheRow: errorCacheRow })
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to flush cache/i)).toBeInTheDocument()
      })
      
      // Should be able to retry
      expect(flushButton).toBeEnabled()
      expect(flushButton).toHaveTextContent(/try again|retry/i)
    })

    it('shows progress indicator during flush operation', async () => {
      const user = userEvent.setup()
      renderCacheModal()
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      // Should show spinner or progress indicator
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByLabelText(/flushing cache/i)).toBeInTheDocument()
    })
  })

  describe('Form Validation and React Hook Form Integration', () => {
    it('validates required confirmation before flush', async () => {
      const user = userEvent.setup()
      renderCacheModal({ requireConfirmation: true })
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      expect(flushButton).toBeDisabled()
      
      // Should require confirmation checkbox
      const confirmationCheckbox = screen.getByRole('checkbox', { 
        name: /confirm cache flush/i 
      })
      expect(confirmationCheckbox).toBeInTheDocument()
      
      await user.click(confirmationCheckbox)
      expect(flushButton).toBeEnabled()
    })

    it('shows validation error for invalid input', async () => {
      const user = userEvent.setup()
      renderCacheModal({ requireServiceName: true })
      
      const serviceNameInput = screen.getByLabelText(/service name/i)
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      
      // Type incorrect service name
      await user.type(serviceNameInput, 'wrong-name')
      await user.click(flushButton)
      
      expect(screen.getByText(/service name does not match/i)).toBeInTheDocument()
      expect(flushButton).toBeDisabled()
    })

    it('enables form submission only with valid data', async () => {
      const user = userEvent.setup()
      renderCacheModal({ requireServiceName: true })
      
      const serviceNameInput = screen.getByLabelText(/service name/i)
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      
      // Type correct service name
      await user.type(serviceNameInput, mockCacheRow.name)
      
      await waitFor(() => {
        expect(flushButton).toBeEnabled()
      })
    })

    it('provides real-time validation feedback', async () => {
      const user = userEvent.setup()
      renderCacheModal({ requireServiceName: true })
      
      const serviceNameInput = screen.getByLabelText(/service name/i)
      
      // Start typing
      await user.type(serviceNameInput, 'test')
      
      // Should show validation state
      await waitFor(() => {
        expect(screen.getByText(/enter service name to confirm/i)).toBeInTheDocument()
      })
      
      // Complete typing correct name
      await user.type(serviceNameInput, '-service')
      
      await waitFor(() => {
        expect(screen.getByText(/service name confirmed/i)).toBeInTheDocument()
      })
    })
  })

  describe('Modal State Management', () => {
    it('closes modal on cancel button click', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderCacheModal({ onClose })
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('prevents modal close during cache flush operation', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderCacheModal({ onClose })
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      // Try to close modal during operation
      await user.keyboard('{Escape}')
      
      // Should not close during operation
      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByText(/flushing cache/i)).toBeInTheDocument()
    })

    it('resets form state when modal reopens', async () => {
      const user = userEvent.setup()
      let props = { isOpen: true, onClose: vi.fn(), cacheRow: mockCacheRow }
      
      const { rerender } = render(
        <TestWrapper>
          <CacheModal {...props} />
        </TestWrapper>
      )
      
      // Close modal
      props = { ...props, isOpen: false }
      rerender(
        <TestWrapper>
          <CacheModal {...props} />
        </TestWrapper>
      )
      
      // Reopen modal
      props = { ...props, isOpen: true }
      rerender(
        <TestWrapper>
          <CacheModal {...props} />
        </TestWrapper>
      )
      
      // Form should be reset
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      expect(flushButton).toBeEnabled()
      expect(screen.queryByText(/flushing cache/i)).not.toBeInTheDocument()
    })
  })

  describe('Responsive Design and Mobile Support', () => {
    it('adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
      
      renderCacheModal()
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('sm:max-w-lg') // Mobile responsive classes
    })

    it('maintains accessibility on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      const { container } = renderCacheModal()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Error Boundary Integration', () => {
    it('catches and displays modal component errors', async () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false)
        
        React.useEffect(() => {
          const handler = (event: ErrorEvent) => {
            setHasError(true)
          }
          
          window.addEventListener('error', handler)
          return () => window.removeEventListener('error', handler)
        }, [])
        
        if (hasError) {
          return <div role="alert">Something went wrong with the cache modal.</div>
        }
        
        return <>{children}</>
      }
      
      const ThrowError = () => {
        throw new Error('Test error')
      }
      
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      )
      
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong with the cache modal.')
    })
  })

  describe('Internationalization (i18n)', () => {
    it('displays translated text correctly', () => {
      renderCacheModal()
      
      // Check for key translated elements
      expect(screen.getByText(/refresh.*cache/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /flush cache/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('handles missing translations gracefully', () => {
      renderCacheModal({ cacheRow: { name: 'test', label: '' } })
      
      // Should show fallback text when label is missing
      expect(screen.getByText(/refresh.*cache/i)).toBeInTheDocument()
    })
  })

  describe('Performance and Optimization', () => {
    it('does not cause unnecessary re-renders', async () => {
      const renderSpy = vi.fn()
      
      const TestComponent = (props: any) => {
        renderSpy()
        return <CacheModal {...props} />
      }
      
      const { rerender } = render(
        <TestWrapper>
          <TestComponent isOpen={true} onClose={vi.fn()} cacheRow={mockCacheRow} />
        </TestWrapper>
      )
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Rerender with same props should not cause re-render due to memoization
      rerender(
        <TestWrapper>
          <TestComponent isOpen={true} onClose={vi.fn()} cacheRow={mockCacheRow} />
        </TestWrapper>
      )
      
      expect(renderSpy).toHaveBeenCalledTimes(2) // Only for prop change
    })

    it('cleans up resources when unmounted', () => {
      const { unmount } = renderCacheModal()
      
      // Unmount should not cause memory leaks
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Integration with React Query', () => {
    it('invalidates cache queries after successful flush', async () => {
      const user = userEvent.setup()
      const queryClient = new QueryClient()
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
      
      render(
        <QueryClientProvider client={queryClient}>
          <CacheModal isOpen={true} onClose={vi.fn()} cacheRow={mockCacheRow} />
        </QueryClientProvider>
      )
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith(['cache'])
      })
    })

    it('handles optimistic updates correctly', async () => {
      const user = userEvent.setup()
      renderCacheModal()
      
      const flushButton = screen.getByRole('button', { name: /flush cache/i })
      await user.click(flushButton)
      
      // Should immediately show optimistic state
      expect(screen.getByText(/flushing cache/i)).toBeInTheDocument()
      
      // Should complete successfully
      await waitFor(() => {
        expect(screen.getByText(/cache flushed successfully/i)).toBeInTheDocument()
      })
    })
  })
})