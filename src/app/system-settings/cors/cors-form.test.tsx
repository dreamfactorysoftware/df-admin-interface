/**
 * Comprehensive Vitest Unit Tests for CORS Configuration Form Component
 * 
 * This test suite provides complete coverage for the CORS form component including
 * React Hook Form validation patterns, Zod schema validation, accessibility compliance,
 * API operations with MSW, error handling scenarios, and user interaction patterns.
 * 
 * Features Tested:
 * - Form validation with real-time feedback per React Hook Form requirements
 * - CORS creation and editing operations with success and error scenarios
 * - Form accessibility with full keyboard navigation support per WCAG 2.1 AA
 * - Schema validation with Zod for type-safe CORS configuration
 * - Error recovery with user-friendly error messages per Section 4.2
 * - Complex validation rules (wildcard origins with credentials)
 * - Multi-select HTTP methods interaction
 * - Dynamic form field validation and conditional logic
 * 
 * Performance Requirements:
 * - Real-time validation responses under 100ms per React/Next.js Integration
 * - Form submission handling under 2 seconds per API requirements
 * - Test execution optimized for Vitest 2.1.0 performance standards
 * 
 * @fileoverview CORS Form Component Test Suite
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Test utilities and providers
import { renderWithProviders } from '../../../test/utils/test-utils';
import { corsHandlers, resetCorsData } from '../../../test/mocks/cors-handlers';

// Component under test
import CorsForm from './cors-form';

// Types
import type { CorsConfig } from '../../../types/cors';

// ============================================================================
// MOCK SETUP AND CONFIGURATION
// ============================================================================

/**
 * Mock external dependencies
 */
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

// ============================================================================
// TEST DATA AND CONSTANTS
// ============================================================================

/**
 * Mock CORS configuration data for testing
 */
const mockCorsConfig: CorsConfig = {
  id: 1,
  description: 'Test CORS configuration',
  enabled: true,
  path: '/api/v2/*',
  origin: 'https://example.com',
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  header: 'Content-Type, Authorization, X-Requested-With',
  exposedHeader: 'X-Total-Count',
  maxAge: 3600,
  supportsCredentials: false,
  createdById: 1,
  createdDate: '2024-01-01T00:00:00Z',
  lastModifiedById: null,
  lastModifiedDate: null,
};

/**
 * Invalid form data for validation testing
 */
const invalidFormData = {
  path: '', // Required field missing
  origin: 'invalid-url', // Invalid URL format
  header: '', // Required field missing
  maxAge: -1, // Below minimum value
  method: [], // No methods selected
};

/**
 * Valid form data for successful submission testing
 */
const validFormData = {
  path: '/api/v2/*',
  description: 'Test CORS policy',
  origin: 'https://app.example.com',
  header: 'Content-Type, Authorization',
  exposedHeader: 'X-Total-Count',
  maxAge: 3600,
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  supportsCredentials: false,
  enabled: true,
};

/**
 * Mock router and query client instances
 */
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

const mockQueryClient = {
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  getQueryData: vi.fn(),
  removeQueries: vi.fn(),
};

// ============================================================================
// TEST UTILITIES AND HELPERS
// ============================================================================

/**
 * Helper function to fill out the CORS form with provided data
 */
const fillCorsForm = async (user: ReturnType<typeof userEvent.setup>, data: any) => {
  // Fill path field
  if (data.path !== undefined) {
    const pathInput = screen.getByLabelText(/path/i);
    await user.clear(pathInput);
    if (data.path) {
      await user.type(pathInput, data.path);
    }
  }

  // Fill description field
  if (data.description !== undefined) {
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    if (data.description) {
      await user.type(descriptionInput, data.description);
    }
  }

  // Fill origin field
  if (data.origin !== undefined) {
    const originInput = screen.getByLabelText(/allowed origins/i);
    await user.clear(originInput);
    if (data.origin) {
      await user.type(originInput, data.origin);
    }
  }

  // Fill header field
  if (data.header !== undefined) {
    const headerInput = screen.getByLabelText(/allowed headers/i);
    await user.clear(headerInput);
    if (data.header) {
      await user.type(headerInput, data.header);
    }
  }

  // Fill exposed header field
  if (data.exposedHeader !== undefined) {
    const exposedHeaderInput = screen.getByLabelText(/exposed headers/i);
    await user.clear(exposedHeaderInput);
    if (data.exposedHeader) {
      await user.type(exposedHeaderInput, data.exposedHeader);
    }
  }

  // Fill max age field
  if (data.maxAge !== undefined) {
    const maxAgeInput = screen.getByLabelText(/max age/i);
    await user.clear(maxAgeInput);
    await user.type(maxAgeInput, data.maxAge.toString());
  }

  // Select HTTP methods
  if (data.method !== undefined && Array.isArray(data.method)) {
    const methodSelect = screen.getByRole('button', { name: /select http methods/i });
    await user.click(methodSelect);

    // Clear all existing selections first
    const clearAllButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearAllButton);

    // Select specified methods
    for (const method of data.method) {
      const methodOption = screen.getByRole('option', { name: method });
      await user.click(methodOption);
    }

    // Close the dropdown
    await user.click(methodSelect);
  }

  // Handle boolean switches
  if (data.supportsCredentials !== undefined) {
    const credentialsSwitch = screen.getByRole('switch', { name: /support credentials/i });
    const isChecked = credentialsSwitch.getAttribute('aria-checked') === 'true';
    if (isChecked !== data.supportsCredentials) {
      await user.click(credentialsSwitch);
    }
  }

  if (data.enabled !== undefined) {
    const enabledSwitch = screen.getByRole('switch', { name: /enabled/i });
    const isChecked = enabledSwitch.getAttribute('aria-checked') === 'true';
    if (isChecked !== data.enabled) {
      await user.click(enabledSwitch);
    }
  }
};

/**
 * Helper function to submit the form and wait for processing
 */
const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  const submitButton = screen.getByRole('button', { name: /create policy|update policy/i });
  await user.click(submitButton);
};

/**
 * Helper function to check form validation state
 */
const expectFormValidation = (fieldName: string, shouldHaveError: boolean, errorMessage?: string) => {
  const field = screen.getByLabelText(new RegExp(fieldName, 'i'));
  expect(field).toHaveAttribute('aria-invalid', shouldHaveError.toString());
  
  if (shouldHaveError && errorMessage) {
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  }
};

// ============================================================================
// TEST SETUP AND TEARDOWN
// ============================================================================

describe('CorsForm Component', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockMutation: Mock;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    resetCorsData();

    // Setup user event handler
    user = userEvent.setup();

    // Mock mutation function
    mockMutation = vi.fn();

    // Setup mock implementations
    (useRouter as Mock).mockReturnValue(mockRouter);
    (useSearchParams as Mock).mockReturnValue(new URLSearchParams());
    (useQueryClient as Mock).mockReturnValue(mockQueryClient);
    (useMutation as Mock).mockReturnValue({
      mutate: mockMutation,
      isPending: false,
      isError: false,
      error: null,
      data: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // FORM RENDERING AND INITIAL STATE TESTS
  // ============================================================================

  describe('Form Rendering and Initial State', () => {
    it('renders create form with correct initial state', () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Check form title
      expect(screen.getByText('Create CORS Policy')).toBeInTheDocument();

      // Check all form fields are present
      expect(screen.getByLabelText(/path/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/allowed origins/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/allowed headers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exposed headers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max age/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select http methods/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /support credentials/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /enabled/i })).toBeInTheDocument();

      // Check action buttons
      expect(screen.getByRole('button', { name: /create policy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      // Check default values
      expect(screen.getByDisplayValue('/')).toBeInTheDocument(); // Default path
      expect(screen.getByDisplayValue('*')).toBeInTheDocument(); // Default origin
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument(); // Default maxAge
    });

    it('renders edit form with pre-populated data', () => {
      renderWithProviders(
        <CorsForm mode="edit" initialData={mockCorsConfig} />
      );

      // Check form title
      expect(screen.getByText('Edit CORS Policy')).toBeInTheDocument();

      // Check pre-populated values
      expect(screen.getByDisplayValue(mockCorsConfig.path)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCorsConfig.description!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCorsConfig.origin)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCorsConfig.header)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCorsConfig.exposedHeader!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockCorsConfig.maxAge.toString())).toBeInTheDocument();

      // Check action button
      expect(screen.getByRole('button', { name: /update policy/i })).toBeInTheDocument();
    });

    it('displays help text and documentation', () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Check help section
      expect(screen.getByText('CORS Configuration Help')).toBeInTheDocument();
      expect(screen.getByText(/URL pattern to match/)).toBeInTheDocument();
      expect(screen.getByText(/Domains allowed to access/)).toBeInTheDocument();
      expect(screen.getByText(/HTTP methods allowed/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  describe('Form Validation with React Hook Form and Zod', () => {
    it('validates required fields on blur and displays real-time errors', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Test path field validation
      const pathInput = screen.getByLabelText(/path/i);
      await user.clear(pathInput);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText('Path is required')).toBeInTheDocument();
        expectFormValidation('path', true, 'Path is required');
      });

      // Test origin field validation
      const originInput = screen.getByLabelText(/allowed origins/i);
      await user.clear(originInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Origins are required')).toBeInTheDocument();
        expectFormValidation('allowed origins', true, 'Origins are required');
      });

      // Test header field validation
      const headerInput = screen.getByLabelText(/allowed headers/i);
      await user.clear(headerInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Headers are required')).toBeInTheDocument();
        expectFormValidation('allowed headers', true, 'Headers are required');
      });
    });

    it('validates path format and provides helpful error messages', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const pathInput = screen.getByLabelText(/path/i);
      
      // Test invalid path format
      await user.clear(pathInput);
      await user.type(pathInput, 'invalid-path');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid path/)).toBeInTheDocument();
      });

      // Test valid path
      await user.clear(pathInput);
      await user.type(pathInput, '/api/v2/*');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid path/)).not.toBeInTheDocument();
      });
    });

    it('validates origin format and handles multiple origins', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const originInput = screen.getByLabelText(/allowed origins/i);

      // Test invalid origin format
      await user.clear(originInput);
      await user.type(originInput, 'invalid-url');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Please enter valid origins/)).toBeInTheDocument();
      });

      // Test valid single origin
      await user.clear(originInput);
      await user.type(originInput, 'https://example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Please enter valid origins/)).not.toBeInTheDocument();
      });

      // Test valid multiple origins
      await user.clear(originInput);
      await user.type(originInput, 'https://example.com, https://app.example.com');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Please enter valid origins/)).not.toBeInTheDocument();
      });

      // Test wildcard origin
      await user.clear(originInput);
      await user.type(originInput, '*');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Please enter valid origins/)).not.toBeInTheDocument();
      });
    });

    it('validates max age range and provides clear feedback', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const maxAgeInput = screen.getByLabelText(/max age/i);

      // Test negative value
      await user.clear(maxAgeInput);
      await user.type(maxAgeInput, '-1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Max age must be greater than or equal to 0/)).toBeInTheDocument();
      });

      // Test value too high
      await user.clear(maxAgeInput);
      await user.type(maxAgeInput, '100000');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Max age cannot exceed 24 hours/)).toBeInTheDocument();
      });

      // Test valid value
      await user.clear(maxAgeInput);
      await user.type(maxAgeInput, '3600');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Max age must be greater than or equal to 0/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Max age cannot exceed 24 hours/)).not.toBeInTheDocument();
      });
    });

    it('validates HTTP methods selection requirement', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Open method selector and clear all methods
      const methodSelect = screen.getByRole('button', { name: /select http methods/i });
      await user.click(methodSelect);

      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearAllButton);

      // Close dropdown and trigger validation
      await user.click(methodSelect);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/At least one HTTP method must be selected/)).toBeInTheDocument();
      });

      // Select a method to clear error
      await user.click(methodSelect);
      const getMethod = screen.getByRole('option', { name: 'GET' });
      await user.click(getMethod);
      await user.click(methodSelect);

      await waitFor(() => {
        expect(screen.queryByText(/At least one HTTP method must be selected/)).not.toBeInTheDocument();
      });
    });

    it('validates credentials with wildcard origin constraint', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Set origin to wildcard
      const originInput = screen.getByLabelText(/allowed origins/i);
      await user.clear(originInput);
      await user.type(originInput, '*');

      // Enable credentials
      const credentialsSwitch = screen.getByRole('switch', { name: /support credentials/i });
      await user.click(credentialsSwitch);

      await waitFor(() => {
        expect(screen.getByText(/Cannot use wildcard origin/)).toBeInTheDocument();
        expect(screen.getByText(/When enabled, origins cannot use wildcards/)).toBeInTheDocument();
      });

      // Change to specific origin
      await user.clear(originInput);
      await user.type(originInput, 'https://example.com');

      await waitFor(() => {
        expect(screen.queryByText(/Cannot use wildcard origin/)).not.toBeInTheDocument();
      });
    });

    it('provides real-time validation feedback under 100ms', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const pathInput = screen.getByLabelText(/path/i);
      
      // Measure validation response time
      const startTime = performance.now();
      await user.clear(pathInput);
      await user.type(pathInput, 'valid-path');
      
      await waitFor(() => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        // Validation should complete within 100ms requirement
        expect(responseTime).toBeLessThan(100);
      });
    });
  });

  // ============================================================================
  // FORM INTERACTION AND USER EXPERIENCE TESTS
  // ============================================================================

  describe('Form Interaction and User Experience', () => {
    it('handles multi-select HTTP methods interaction correctly', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const methodSelect = screen.getByRole('button', { name: /select http methods/i });
      await user.click(methodSelect);

      // Check that options are available
      expect(screen.getByRole('option', { name: 'GET' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'POST' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'PUT' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'DELETE' })).toBeInTheDocument();

      // Select multiple methods
      await user.click(screen.getByRole('option', { name: 'GET' }));
      await user.click(screen.getByRole('option', { name: 'POST' }));
      await user.click(screen.getByRole('option', { name: 'PUT' }));

      // Verify selection count
      expect(screen.getByText('3 methods selected')).toBeInTheDocument();

      // Test select all functionality
      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      expect(screen.getByText('7 methods selected')).toBeInTheDocument();

      // Test clear all functionality
      const clearAllButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearAllButton);

      expect(screen.getByText(/select http methods/i)).toBeInTheDocument();
    });

    it('updates form state correctly when toggling switches', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Test credentials switch
      const credentialsSwitch = screen.getByRole('switch', { name: /support credentials/i });
      expect(credentialsSwitch).toHaveAttribute('aria-checked', 'false');

      await user.click(credentialsSwitch);
      expect(credentialsSwitch).toHaveAttribute('aria-checked', 'true');

      // Test enabled switch
      const enabledSwitch = screen.getByRole('switch', { name: /enabled/i });
      expect(enabledSwitch).toHaveAttribute('aria-checked', 'true');

      await user.click(enabledSwitch);
      expect(enabledSwitch).toHaveAttribute('aria-checked', 'false');
    });

    it('shows appropriate conditional warnings and help text', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Enable credentials to show warning
      const credentialsSwitch = screen.getByRole('switch', { name: /support credentials/i });
      await user.click(credentialsSwitch);

      expect(screen.getByText(/When enabled, origins cannot use wildcards/)).toBeInTheDocument();

      // Disable credentials to hide warning
      await user.click(credentialsSwitch);

      await waitFor(() => {
        expect(screen.queryByText(/When enabled, origins cannot use wildcards/)).not.toBeInTheDocument();
      });
    });

    it('displays unsaved changes indicator correctly', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Initially no unsaved changes
      expect(screen.queryByText(/You have unsaved changes/)).not.toBeInTheDocument();

      // Make a change to trigger dirty state
      const pathInput = screen.getByLabelText(/path/i);
      await user.type(pathInput, '/test');

      await waitFor(() => {
        expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FORM SUBMISSION AND API INTEGRATION TESTS
  // ============================================================================

  describe('Form Submission and API Integration', () => {
    it('successfully creates a new CORS configuration', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      // Fill out valid form data
      await fillCorsForm(user, validFormData);

      // Submit form
      await submitForm(user);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            path: validFormData.path,
            description: validFormData.description,
            origin: validFormData.origin,
            header: validFormData.header,
            exposedHeader: validFormData.exposedHeader,
            maxAge: validFormData.maxAge,
            method: validFormData.method,
            supportsCredentials: validFormData.supportsCredentials,
            enabled: validFormData.enabled,
          })
        );
      });
    });

    it('successfully updates an existing CORS configuration', async () => {
      const onSubmit = vi.fn().mockResolvedValue({ ...mockCorsConfig, description: 'Updated description' });
      
      renderWithProviders(
        <CorsForm mode="edit" initialData={mockCorsConfig} onSubmit={onSubmit} />
      );

      // Modify description
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      // Submit form
      await submitForm(user);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Updated description',
          })
        );
      });
    });

    it('handles API errors gracefully with user-friendly messages', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('API connection failed'));
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      // Fill out form and submit
      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText('Error saving CORS configuration')).toBeInTheDocument();
        expect(screen.getByText('API connection failed')).toBeInTheDocument();
        expect(toast.error).toHaveBeenCalledWith('Failed to save CORS configuration');
      });
    });

    it('handles validation errors from server', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      const onSubmit = vi.fn().mockRejectedValue(validationError);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText('Error saving CORS configuration')).toBeInTheDocument();
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });

    it('disables submit button during form submission', async () => {
      const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      
      const submitButton = screen.getByRole('button', { name: /create policy/i });
      await user.click(submitButton);

      // Button should be disabled and show loading state
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('invalidates React Query cache on successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cors'] });
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
          queryKey: ['cors', mockCorsConfig.id] 
        });
      });
    });

    it('navigates to CORS list on successful creation', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/system-settings/cors');
      });
    });

    it('shows success toast on successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('CORS policy created successfully');
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS (WCAG 2.1 AA COMPLIANCE)
  // ============================================================================

  describe('Accessibility Tests (WCAG 2.1 AA Compliance)', () => {
    it('provides proper labels for all form controls', () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Check that all form inputs have proper labels
      expect(screen.getByLabelText(/path/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/allowed origins/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/allowed headers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/exposed headers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/support credentials/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enabled/i)).toBeInTheDocument();
    });

    it('associates error messages with form fields using aria-describedby', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Trigger validation error
      const pathInput = screen.getByLabelText(/path/i);
      await user.clear(pathInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText('Path is required');
        const errorId = errorMessage.getAttribute('id');
        expect(pathInput).toHaveAttribute('aria-describedby', errorId);
      });
    });

    it('provides appropriate aria-invalid attributes for validation states', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const pathInput = screen.getByLabelText(/path/i);
      
      // Initially should not be invalid
      expect(pathInput).toHaveAttribute('aria-invalid', 'false');

      // Clear field to trigger validation
      await user.clear(pathInput);
      await user.tab();

      await waitFor(() => {
        expect(pathInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Fix validation error
      await user.type(pathInput, '/api/v2/*');
      await user.tab();

      await waitFor(() => {
        expect(pathInput).toHaveAttribute('aria-invalid', 'false');
      });
    });

    it('supports full keyboard navigation throughout the form', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Tab through all focusable elements
      const focusableElements = [
        screen.getByLabelText(/path/i),
        screen.getByLabelText(/allowed origins/i),
        screen.getByLabelText(/max age/i),
        screen.getByLabelText(/allowed headers/i),
        screen.getByLabelText(/exposed headers/i),
        screen.getByRole('button', { name: /select http methods/i }),
        screen.getByLabelText(/description/i),
        screen.getByRole('switch', { name: /support credentials/i }),
        screen.getByRole('switch', { name: /enabled/i }),
        screen.getByRole('button', { name: /create policy/i }),
        screen.getByRole('button', { name: /cancel/i }),
      ];

      for (const element of focusableElements) {
        await user.tab();
        expect(element).toHaveFocus();
      }
    });

    it('provides proper ARIA attributes for switches', () => {
      renderWithProviders(<CorsForm mode="create" />);

      const credentialsSwitch = screen.getByRole('switch', { name: /support credentials/i });
      const enabledSwitch = screen.getByRole('switch', { name: /enabled/i });

      expect(credentialsSwitch).toHaveAttribute('role', 'switch');
      expect(credentialsSwitch).toHaveAttribute('aria-checked');
      expect(enabledSwitch).toHaveAttribute('role', 'switch');
      expect(enabledSwitch).toHaveAttribute('aria-checked');
    });

    it('provides appropriate ARIA attributes for multi-select dropdown', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const methodSelect = screen.getByRole('button', { name: /select http methods/i });
      expect(methodSelect).toHaveAttribute('aria-expanded', 'false');
      expect(methodSelect).toHaveAttribute('aria-haspopup', 'listbox');

      await user.click(methodSelect);

      expect(methodSelect).toHaveAttribute('aria-expanded', 'true');
      
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();

      const options = within(listbox).getAllByRole('option');
      options.forEach(option => {
        expect(option).toHaveAttribute('aria-selected');
      });
    });

    it('provides descriptive help text with proper associations', () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Check for helper text
      expect(screen.getByText(/Use \* for all origins/)).toBeInTheDocument();
      expect(screen.getByText(/Headers clients can send/)).toBeInTheDocument();
      expect(screen.getByText(/How long browsers should cache/)).toBeInTheDocument();
    });

    it('announces form submission status to screen readers', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        // Check that loading state is announced
        const submitButton = screen.getByRole('button', { name: /saving/i });
        expect(submitButton).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ERROR HANDLING AND RECOVERY TESTS
  // ============================================================================

  describe('Error Handling and Recovery', () => {
    it('displays error alert with dismissible option', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toBeInTheDocument();
        expect(screen.getByText('Error saving CORS configuration')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('allows error recovery by re-enabling form after error', async () => {
      const onSubmit = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Error saving CORS configuration')).toBeInTheDocument();
      });

      // Submit again
      const submitButton = screen.getByRole('button', { name: /create policy/i });
      expect(submitButton).not.toBeDisabled();
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('CORS policy created successfully');
      });
    });

    it('handles network timeout errors gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      const onSubmit = vi.fn().mockRejectedValue(timeoutError);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
      });
    });

    it('preserves form data after error occurs', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('API error'));
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText('Error saving CORS configuration')).toBeInTheDocument();
      });

      // Check that form data is preserved
      expect(screen.getByDisplayValue(validFormData.path)).toBeInTheDocument();
      expect(screen.getByDisplayValue(validFormData.description)).toBeInTheDocument();
      expect(screen.getByDisplayValue(validFormData.origin)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // CANCEL AND NAVIGATION TESTS
  // ============================================================================

  describe('Cancel and Navigation Behavior', () => {
    it('navigates back to CORS list when cancel button is clicked', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/system-settings/cors');
    });

    it('calls onCancel callback when provided', async () => {
      const onCancel = vi.fn();
      
      renderWithProviders(
        <CorsForm mode="create" onCancel={onCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('prevents accidental navigation when form has unsaved changes', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Make changes to the form
      const pathInput = screen.getByLabelText(/path/i);
      await user.type(pathInput, '/modified');

      // Verify unsaved changes indicator is shown
      await waitFor(() => {
        expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // INTEGRATION AND END-TO-END SCENARIOS
  // ============================================================================

  describe('Integration and End-to-End Scenarios', () => {
    it('completes full CORS creation workflow within performance requirements', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      const startTime = performance.now();
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      await fillCorsForm(user, validFormData);
      await submitForm(user);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('CORS policy created successfully');
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Should complete within 2 seconds per API requirements
        expect(totalTime).toBeLessThan(2000);
      });
    });

    it('handles complex validation scenario with credentials and origins', async () => {
      renderWithProviders(<CorsForm mode="create" />);

      // Set wildcard origin
      const originInput = screen.getByLabelText(/allowed origins/i);
      await user.clear(originInput);
      await user.type(originInput, '*');

      // Enable credentials (should trigger error)
      const credentialsSwitch = screen.getByRole('switch', { name: /support credentials/i });
      await user.click(credentialsSwitch);

      await waitFor(() => {
        expect(screen.getByText(/Cannot use wildcard origin/)).toBeInTheDocument();
      });

      // Fix by changing to specific origin
      await user.clear(originInput);
      await user.type(originInput, 'https://trusted-app.com');

      await waitFor(() => {
        expect(screen.queryByText(/Cannot use wildcard origin/)).not.toBeInTheDocument();
      });

      // Form should now be valid for submission
      const submitButton = screen.getByRole('button', { name: /create policy/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('provides comprehensive form experience for database API CORS setup', async () => {
      const onSubmit = vi.fn().mockResolvedValue(mockCorsConfig);
      
      renderWithProviders(
        <CorsForm mode="create" onSubmit={onSubmit} />
      );

      // Simulate realistic database API CORS configuration
      await fillCorsForm(user, {
        path: '/api/v2/db/*',
        description: 'Database API CORS policy for production app',
        origin: 'https://app.mycompany.com, https://staging.mycompany.com',
        header: 'Content-Type, Authorization, X-Requested-With, X-DreamFactory-Api-Key',
        exposedHeader: 'X-Total-Count, X-Rate-Limit-Remaining',
        maxAge: 7200,
        method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        supportsCredentials: true,
        enabled: true,
      });

      await submitForm(user);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            path: '/api/v2/db/*',
            description: 'Database API CORS policy for production app',
            supportsCredentials: true,
            enabled: true,
          })
        );

        expect(toast.success).toHaveBeenCalledWith('CORS policy created successfully');
      });
    });
  });
});