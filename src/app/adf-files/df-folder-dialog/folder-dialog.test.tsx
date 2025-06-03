import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { server } from '../../../test/mocks/server';
import FolderDialog from './folder-dialog';

// Mock the file operations hook
const mockCreateFolder = vi.fn();
const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

vi.mock('../../../hooks/use-file-operations', () => ({
  useFileOperations: () => ({
    createFolder: mockCreateFolder,
    isCreatingFolder: false,
  }),
}));

// Test wrapper component with React Query provider
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('FolderDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
    currentPath: '/test-path',
    serviceId: 'test-service',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateFolder.mockResolvedValue({ success: true });
  });

  describe('Component Rendering', () => {
    it('should render the dialog when open', () => {
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Folder')).toBeInTheDocument();
      expect(screen.getByLabelText(/folder name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should not render the dialog when closed', () => {
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display the current path in the dialog', () => {
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} currentPath="/documents/reports" />
        </TestWrapper>
      );

      expect(screen.getByText(/creating folder in:/i)).toBeInTheDocument();
      expect(screen.getByText('/documents/reports')).toBeInTheDocument();
    });

    it('should focus the folder name input when dialog opens', async () => {
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show required field error when folder name is empty', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/folder name is required/i)).toBeInTheDocument();
    });

    it('should show error for folder names with invalid characters', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'folder/with\\invalid:characters');
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/folder name contains invalid characters/i)).toBeInTheDocument();
    });

    it('should show error for folder names that are too long', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      const longName = 'a'.repeat(256); // Assuming max length is 255
      await user.type(input, longName);
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/folder name is too long/i)).toBeInTheDocument();
    });

    it('should show error for folder names starting with dots', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, '.hidden-folder');
      
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/folder name cannot start with a dot/i)).toBeInTheDocument();
    });

    it('should validate folder name in real-time', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      
      // Type invalid characters
      await user.type(input, 'invalid/name');
      
      // Validation should appear without submitting
      expect(await screen.findByText(/folder name contains invalid characters/i)).toBeInTheDocument();
      
      // Clear and type valid name
      await user.clear(input);
      await user.type(input, 'valid-folder-name');
      
      // Error should disappear
      expect(screen.queryByText(/folder name contains invalid characters/i)).not.toBeInTheDocument();
    });

    it('should disable create button when form is invalid', async () => {
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create/i });
      expect(createButton).toBeDisabled();
    });

    it('should enable create button when form is valid', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'valid-folder-name');

      const createButton = screen.getByRole('button', { name: /create/i });
      await waitFor(() => {
        expect(createButton).toBeEnabled();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when escape key is pressed', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside the dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      const backdrop = dialog.parentElement;
      
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should allow folder name input via keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'my-new-folder');

      expect(input).toHaveValue('my-new-folder');
    });

    it('should submit form when Enter key is pressed in input field', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'test-folder');
      await user.keyboard('{Enter}');

      expect(mockCreateFolder).toHaveBeenCalledWith({
        name: 'test-folder',
        path: '/test-path',
        serviceId: 'test-service',
      });
    });
  });

  describe('API Integration', () => {
    it('should create folder successfully with valid input', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'new-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(mockCreateFolder).toHaveBeenCalledWith({
        name: 'new-folder',
        path: '/test-path',
        serviceId: 'test-service',
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state during folder creation', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockCreateFolder.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'new-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Should show loading state
      expect(screen.getByText(/creating/i)).toBeInTheDocument();
      expect(createButton).toBeDisabled();
    });

    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      const errorMessage = 'Folder already exists';
      mockCreateFolder.mockRejectedValue(new Error(errorMessage));

      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'existing-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle network errors with retry option', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockCreateFolder.mockRejectedValueOnce(new Error('Network error'))
                     .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'test-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Should show error
      expect(await screen.findByText(/network error/i)).toBeInTheDocument();

      // Should show retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle permission errors appropriately', async () => {
      const user = userEvent.setup();
      
      // Mock permission error
      mockCreateFolder.mockRejectedValue({
        status: 403,
        message: 'Insufficient permissions to create folder'
      });

      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'restricted-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/insufficient permissions/i)).toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    it('should trap focus within the dialog', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      const createButton = screen.getByRole('button', { name: /create/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Tab should cycle through focusable elements
      await user.tab();
      expect(createButton).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should restore focus to trigger element when dialog closes', () => {
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Create Folder';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={true} />
        </TestWrapper>
      );

      // Close dialog
      rerender(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      expect(triggerButton).toHaveFocus();
      document.body.removeChild(triggerButton);
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      const errorMessage = await screen.findByText(/folder name is required/i);
      expect(errorMessage).toHaveAttribute('role', 'alert');
    });
  });

  describe('Form Reset and State Management', () => {
    it('should reset form when dialog opens', () => {
      const { rerender } = render(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={true} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      expect(input).toHaveValue('');
    });

    it('should clear errors when dialog closes', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={true} />
        </TestWrapper>
      );

      // Trigger validation error
      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/folder name is required/i)).toBeInTheDocument();

      // Close dialog
      rerender(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={false} />
        </TestWrapper>
      );

      // Reopen dialog
      rerender(
        <TestWrapper>
          <FolderDialog {...defaultProps} isOpen={true} />
        </TestWrapper>
      );

      // Error should be cleared
      expect(screen.queryByText(/folder name is required/i)).not.toBeInTheDocument();
    });

    it('should preserve form state during validation errors', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'invalid/name');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Form value should be preserved despite validation error
      expect(input).toHaveValue('invalid/name');
      expect(await screen.findByText(/folder name contains invalid characters/i)).toBeInTheDocument();
    });
  });

  describe('Integration with MSW', () => {
    it('should handle MSW mocked successful response', async () => {
      const user = userEvent.setup();
      
      // Override MSW handler for this test
      server.use(
        rest.post('/api/v2/files/:serviceId', (req, res, ctx) => {
          return res(
            ctx.status(201),
            ctx.json({
              success: true,
              resource: [{
                name: 'new-folder',
                type: 'folder',
                path: '/test-path/new-folder'
              }]
            })
          );
        })
      );

      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'new-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle MSW mocked error response', async () => {
      const user = userEvent.setup();
      
      // Override MSW handler for error scenario
      server.use(
        rest.post('/api/v2/files/:serviceId', (req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({
              error: {
                message: 'Folder already exists',
                code: 409
              }
            })
          );
        })
      );

      render(
        <TestWrapper>
          <FolderDialog {...defaultProps} />
        </TestWrapper>
      );

      const input = screen.getByLabelText(/folder name/i);
      await user.type(input, 'existing-folder');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      expect(await screen.findByText(/folder already exists/i)).toBeInTheDocument();
    });
  });
});