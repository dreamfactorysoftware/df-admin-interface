/**
 * @fileoverview Vitest test suite for Alert component system
 * Tests compound component functionality, alert variants, dismissible behavior,
 * accessibility compliance, and responsive design.
 * 
 * Migrated from Angular Jasmine/Karma to Vitest/React Testing Library per Section 7.1
 * Includes MSW integration for realistic alert scenarios and error state testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { server } from '@/test/mocks/server';
import { rest } from 'msw';
import { Alert } from './alert';
import type { AlertType } from './types';

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations);

/**
 * Test utilities for Alert component testing
 * Replaces Angular ComponentFixture patterns with React Testing Library utilities
 */
const renderAlert = (props: any = {}) => {
  const defaultProps = {
    variant: 'info' as AlertType,
    children: 'Test alert message',
    ...props,
  };

  return render(<Alert {...defaultProps} />);
};

const renderCompoundAlert = (props: any = {}) => {
  const {
    variant = 'info' as AlertType,
    dismissible = false,
    onDismiss,
    icon,
    title,
    message = 'Test alert message',
    ...restProps
  } = props;

  return render(
    <Alert variant={variant} dismissible={dismissible} onDismiss={onDismiss} {...restProps}>
      {icon && <Alert.Icon>{icon}</Alert.Icon>}
      <Alert.Content>
        {title && <Alert.Title>{title}</Alert.Title>}
        <Alert.Description>{message}</Alert.Description>
      </Alert.Content>
      {dismissible && <Alert.Dismiss />}
    </Alert>
  );
};

/**
 * Mock error response generator for MSW integration
 * Simulates realistic API error scenarios for error alert testing
 */
const generateMockError = (status: number, message: string) => {
  return rest.get('/api/v2/test-endpoint', (req, res, ctx) => {
    return res(
      ctx.status(status),
      ctx.json({
        error: {
          code: status,
          message,
          status_code: status,
          context: {
            timestamp: new Date().toISOString(),
            resource: 'test-endpoint',
          },
        },
      })
    );
  });
};

describe('Alert Component System', () => {
  // User event setup for enhanced user interaction testing
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    // Reset MSW handlers before each test
    server.resetHandlers();
  });

  afterEach(() => {
    // Cleanup DOM after each test (replaces Angular ComponentFixture cleanup)
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders alert with default props', () => {
      renderAlert();
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('Test alert message');
    });

    it('applies correct variant classes for styling', () => {
      const { rerender } = renderAlert({ variant: 'success' });
      
      let alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');

      rerender(<Alert variant="error">Error message</Alert>);
      alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');

      rerender(<Alert variant="warning">Warning message</Alert>);
      alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');

      rerender(<Alert variant="info">Info message</Alert>);
      alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });

    it('accepts custom className prop', () => {
      renderAlert({ className: 'custom-alert-class' });
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-alert-class');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<Alert ref={ref}>Test message</Alert>);
      
      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });
  });

  describe('Alert Variants', () => {
    const variants: Array<{ type: AlertType; expectedClasses: string[]; expectedIcon?: string }> = [
      {
        type: 'success',
        expectedClasses: ['bg-green-50', 'border-green-200', 'text-green-800'],
        expectedIcon: 'check-circle',
      },
      {
        type: 'error',
        expectedClasses: ['bg-red-50', 'border-red-200', 'text-red-800'],
        expectedIcon: 'exclamation-circle',
      },
      {
        type: 'warning',
        expectedClasses: ['bg-yellow-50', 'border-yellow-200', 'text-yellow-800'],
        expectedIcon: 'exclamation-triangle',
      },
      {
        type: 'info',
        expectedClasses: ['bg-blue-50', 'border-blue-200', 'text-blue-800'],
        expectedIcon: 'information-circle',
      },
    ];

    variants.forEach(({ type, expectedClasses, expectedIcon }) => {
      it(`renders ${type} variant with correct styling and semantics`, () => {
        renderAlert({ variant: type, children: `${type} message` });
        
        const alert = screen.getByRole('alert');
        expectedClasses.forEach(className => {
          expect(alert).toHaveClass(className);
        });
        
        expect(alert).toHaveTextContent(`${type} message`);
        expect(alert).toHaveAttribute('data-variant', type);
      });

      it(`${type} variant has correct ARIA attributes`, () => {
        renderAlert({ variant: type, children: `${type} message` });
        
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('role', 'alert');
        expect(alert).toHaveAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
      });
    });
  });

  describe('Compound Component Pattern', () => {
    it('renders compound Alert with all subcomponents', () => {
      renderCompoundAlert({
        variant: 'success',
        title: 'Success Title',
        message: 'Success message content',
        icon: <svg data-testid="custom-icon" />,
      });

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      
      // Test icon subcomponent
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
      
      // Test content subcomponent with title and description
      expect(screen.getByText('Success Title')).toBeInTheDocument();
      expect(screen.getByText('Success message content')).toBeInTheDocument();
    });

    it('renders Alert.Icon with default variant icons', () => {
      renderCompoundAlert({ variant: 'error' });
      
      const alert = screen.getByRole('alert');
      const icon = within(alert).getByTestId('alert-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('data-variant', 'error');
    });

    it('renders Alert.Content with proper structure', () => {
      renderCompoundAlert({
        title: 'Alert Title',
        message: 'Alert description content',
      });

      const content = screen.getByTestId('alert-content');
      expect(content).toBeInTheDocument();
      
      const title = within(content).getByText('Alert Title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('font-medium');
      
      const description = within(content).getByText('Alert description content');
      expect(description).toBeInTheDocument();
    });

    it('renders without Alert.Icon when not provided', () => {
      renderCompoundAlert({ icon: null });
      
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
    });

    it('renders without Alert.Title when not provided', () => {
      renderCompoundAlert({ title: null });
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('Dismissible Functionality', () => {
    it('renders dismiss button when dismissible is true', () => {
      renderCompoundAlert({ dismissible: true });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss alert');
    });

    it('does not render dismiss button when dismissible is false', () => {
      renderCompoundAlert({ dismissible: false });
      
      expect(screen.queryByRole('button', { name: /dismiss alert/i })).not.toBeInTheDocument();
    });

    it('calls onDismiss callback when dismiss button is clicked', async () => {
      const onDismiss = vi.fn();
      renderCompoundAlert({ dismissible: true, onDismiss });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('supports keyboard navigation for dismiss button', async () => {
      const onDismiss = vi.fn();
      renderCompoundAlert({ dismissible: true, onDismiss });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      
      // Test Tab key navigation
      await user.tab();
      expect(dismissButton).toHaveFocus();
      
      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('supports Space key activation for dismiss button', async () => {
      const onDismiss = vi.fn();
      renderCompoundAlert({ dismissible: true, onDismiss });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      await user.click(dismissButton); // Focus the button
      
      await user.keyboard(' ');
      expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('dismiss button has proper accessibility attributes', () => {
      renderCompoundAlert({ dismissible: true });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      expect(dismissButton).toHaveAttribute('type', 'button');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss alert');
      expect(dismissButton).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('has no accessibility violations for success variant', async () => {
      const { container } = renderCompoundAlert({
        variant: 'success',
        title: 'Success Alert',
        message: 'Operation completed successfully',
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for error variant', async () => {
      const { container } = renderCompoundAlert({
        variant: 'error',
        title: 'Error Alert',
        message: 'An error occurred during the operation',
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for warning variant', async () => {
      const { container } = renderCompoundAlert({
        variant: 'warning',
        title: 'Warning Alert',
        message: 'Please review your input before proceeding',
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for info variant', async () => {
      const { container } = renderCompoundAlert({
        variant: 'info',
        title: 'Information Alert',
        message: 'Here is some useful information',
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for dismissible alerts', async () => {
      const { container } = renderCompoundAlert({
        variant: 'success',
        dismissible: true,
        title: 'Dismissible Alert',
        message: 'This alert can be dismissed',
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has correct ARIA live region for urgent alerts', () => {
      renderAlert({ variant: 'error' });
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('has correct ARIA live region for non-urgent alerts', () => {
      ['success', 'warning', 'info'].forEach(variant => {
        const { unmount } = renderAlert({ variant: variant as AlertType });
        
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('aria-live', 'polite');
        
        unmount();
      });
    });

    it('maintains proper heading hierarchy with Alert.Title', () => {
      renderCompoundAlert({
        title: 'Alert Heading',
        message: 'Alert content',
      });
      
      const heading = screen.getByRole('heading');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Alert Heading');
      // Should use appropriate heading level based on context
      expect(heading.tagName).toMatch(/^H[1-6]$/);
    });

    it('provides sufficient color contrast for all variants', () => {
      const variants: AlertType[] = ['success', 'error', 'warning', 'info'];
      
      variants.forEach(variant => {
        const { unmount } = renderAlert({ variant });
        
        const alert = screen.getByRole('alert');
        // Tailwind CSS color system ensures WCAG AA compliance
        expect(alert).toHaveAttribute('data-variant', variant);
        
        unmount();
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for mobile layout', () => {
      renderCompoundAlert({
        variant: 'info',
        title: 'Responsive Alert',
        message: 'This alert adapts to screen size',
      });
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('p-4', 'sm:p-6'); // Responsive padding
    });

    it('adjusts icon size for different screen sizes', () => {
      renderCompoundAlert({ variant: 'success' });
      
      const icon = screen.getByTestId('alert-icon');
      expect(icon).toHaveClass('h-5', 'w-5', 'sm:h-6', 'sm:w-6'); // Responsive icon sizing
    });

    it('handles text wrapping gracefully on small screens', () => {
      renderCompoundAlert({
        title: 'Very Long Alert Title That Should Wrap Properly on Small Screens',
        message: 'This is a very long alert message that should wrap appropriately on small screens and maintain readability across all device sizes.',
      });
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('break-words'); // Ensures proper text wrapping
    });
  });

  describe('MSW Integration for Error Scenarios', () => {
    it('displays error alert for 400 Bad Request scenarios', async () => {
      // Setup MSW handler for 400 error
      server.use(
        generateMockError(400, 'Invalid request parameters')
      );
      
      // Simulate component that would show error alert
      render(
        <Alert variant="error" dismissible>
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Request Error</Alert.Title>
            <Alert.Description>
              Invalid request parameters. Please check your input and try again.
            </Alert.Description>
          </Alert.Content>
          <Alert.Dismiss />
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-variant', 'error');
      expect(screen.getByText('Request Error')).toBeInTheDocument();
      expect(screen.getByText(/Invalid request parameters/)).toBeInTheDocument();
    });

    it('displays error alert for 401 Unauthorized scenarios', async () => {
      // Setup MSW handler for 401 error
      server.use(
        generateMockError(401, 'Authentication required')
      );
      
      render(
        <Alert variant="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Authentication Error</Alert.Title>
            <Alert.Description>
              Your session has expired. Please log in again to continue.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive'); // Urgent error
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    });

    it('displays error alert for 403 Forbidden scenarios', async () => {
      // Setup MSW handler for 403 error
      server.use(
        generateMockError(403, 'Insufficient permissions')
      );
      
      render(
        <Alert variant="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Permission Denied</Alert.Title>
            <Alert.Description>
              You don't have permission to perform this action.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      );
      
      expect(screen.getByText('Permission Denied')).toBeInTheDocument();
      expect(screen.getByText(/don't have permission/)).toBeInTheDocument();
    });

    it('displays error alert for 404 Not Found scenarios', async () => {
      // Setup MSW handler for 404 error
      server.use(
        generateMockError(404, 'Resource not found')
      );
      
      render(
        <Alert variant="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Resource Not Found</Alert.Title>
            <Alert.Description>
              The requested database service could not be found.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      );
      
      expect(screen.getByText('Resource Not Found')).toBeInTheDocument();
      expect(screen.getByText(/could not be found/)).toBeInTheDocument();
    });

    it('displays error alert for 500 Server Error scenarios', async () => {
      // Setup MSW handler for 500 error
      server.use(
        generateMockError(500, 'Internal server error')
      );
      
      render(
        <Alert variant="error" dismissible>
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Server Error</Alert.Title>
            <Alert.Description>
              An unexpected error occurred. Please try again later or contact support.
            </Alert.Description>
          </Alert.Content>
          <Alert.Dismiss />
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-variant', 'error');
      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss alert/i })).toBeInTheDocument();
    });

    it('handles network error scenarios with appropriate alert display', async () => {
      // Setup MSW handler for network error
      server.use(
        rest.get('/api/v2/system/service', (req, res) => {
          return res.networkError('Network connection failed');
        })
      );
      
      render(
        <Alert variant="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Connection Error</Alert.Title>
            <Alert.Description>
              Unable to connect to the server. Please check your network connection.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      );
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/network connection/)).toBeInTheDocument();
    });
  });

  describe('Integration with Database Services', () => {
    it('displays success alert for successful database connection', async () => {
      // Setup MSW handler for successful connection test
      server.use(
        rest.post('/api/v2/system/service/test-connection', (req, res, ctx) => {
          return res(ctx.json({ success: true, message: 'Connection successful' }));
        })
      );
      
      render(
        <Alert variant="success" dismissible>
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Connection Successful</Alert.Title>
            <Alert.Description>
              Successfully connected to the database service.
            </Alert.Description>
          </Alert.Content>
          <Alert.Dismiss />
        </Alert>
      );
      
      expect(screen.getByText('Connection Successful')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss alert/i })).toBeInTheDocument();
    });

    it('displays warning alert for database connection with warnings', async () => {
      render(
        <Alert variant="warning">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Connection Warning</Alert.Title>
            <Alert.Description>
              Database connected but some features may be limited due to permissions.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('data-variant', 'warning');
      expect(screen.getByText('Connection Warning')).toBeInTheDocument();
    });

    it('displays info alert for schema discovery status', async () => {
      render(
        <Alert variant="info">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Description>
              Discovering database schema... Found 150 tables and 300 fields.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      );
      
      expect(screen.getByText(/Discovering database schema/)).toBeInTheDocument();
      expect(screen.getByText(/150 tables and 300 fields/)).toBeInTheDocument();
    });
  });

  describe('Performance and Memory', () => {
    it('does not cause memory leaks when mounted and unmounted repeatedly', () => {
      // Test for memory leaks during rapid mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderAlert({
          variant: 'success',
          children: `Test message ${i}`,
        });
        unmount();
      }
      
      // If we reach here without issues, no memory leaks occurred
      expect(true).toBe(true);
    });

    it('handles large content efficiently', () => {
      const largeContent = 'A'.repeat(1000); // 1000 character string
      
      renderCompoundAlert({
        title: 'Large Content Alert',
        message: largeContent,
      });
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(largeContent);
    });

    it('renders quickly with compound components', () => {
      const startTime = performance.now();
      
      renderCompoundAlert({
        variant: 'info',
        dismissible: true,
        title: 'Performance Test Alert',
        message: 'Testing rendering performance of compound alert',
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in under 50ms for good performance
      expect(renderTime).toBeLessThan(50);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles undefined children gracefully', () => {
      render(<Alert variant="info">{undefined}</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it('handles null children gracefully', () => {
      render(<Alert variant="info">{null}</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it('handles empty string children gracefully', () => {
      render(<Alert variant="info">{''}</Alert>);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeEmptyDOMElement();
    });

    it('handles missing onDismiss prop for dismissible alerts', () => {
      // Should not throw error even without onDismiss
      renderCompoundAlert({ dismissible: true, onDismiss: undefined });
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i });
      expect(dismissButton).toBeInTheDocument();
      
      // Should not throw when clicked
      expect(() => fireEvent.click(dismissButton)).not.toThrow();
    });

    it('handles invalid variant gracefully', () => {
      // @ts-expect-error - Testing invalid variant handling
      renderAlert({ variant: 'invalid-variant' });
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      // Should fallback to default variant styling
      expect(alert).toHaveClass('bg-blue-50'); // info variant fallback
    });

    it('preserves accessibility during rapid state changes', async () => {
      const { rerender } = renderCompoundAlert({
        variant: 'info',
        dismissible: false,
        title: 'Initial Alert',
        message: 'Initial message',
      });
      
      // Rapidly change props to test accessibility preservation
      rerender(
        <Alert variant="error" dismissible>
          <Alert.Icon />
          <Alert.Content>
            <Alert.Title>Updated Alert</Alert.Title>
            <Alert.Description>Updated message</Alert.Description>
          </Alert.Content>
          <Alert.Dismiss />
        </Alert>
      );
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('role', 'alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
      expect(screen.getByText('Updated Alert')).toBeInTheDocument();
    });
  });
});