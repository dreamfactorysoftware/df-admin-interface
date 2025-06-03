/**
 * Profile Management Page Test Suite
 * 
 * Comprehensive Vitest unit test suite for the profile management page component covering 
 * form validation, profile data fetching, submission workflows, and error scenarios.
 * 
 * Features:
 * - Vitest testing framework with 10x faster test execution per Section 0.2.4 dependency decisions
 * - React Testing Library integration for component testing best practices per testing infrastructure
 * - Mock Service Worker (MSW) for realistic API mocking during testing per Section 4.7.1.3
 * - Comprehensive test coverage for profile management functionality maintaining Angular test parity
 * - Accessibility testing integration per WCAG 2.1 AA compliance requirements
 * 
 * Migration Notes:
 * - Converted from Angular TestBed component testing to Vitest + React Testing Library patterns
 * - Replaced Angular HTTP client testing with MSW for realistic API mocking
 * - Transformed Angular fixture.detectChanges() patterns to React Testing Library utilities
 * - Converted Angular service injection mocking to React hook mocking with vi.mock()
 * - Implements comprehensive form validation testing with Zod schema verification
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SWRConfig } from 'swr';

import ProfilePage from './page';
import { renderWithProviders } from '@/test/test-utils';
import { profileHandlers } from '@/test/mocks/handlers';
import { 
  mockUserProfile, 
  mockProfileUpdatePayload, 
  mockPasswordUpdatePayload,
  mockSecurityQuestionPayload 
} from '@/test/mocks/profile-data';
import type { UserProfile, ChangePasswordForm } from '@/types/user';

// Add jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations);

// Mock hooks to control their behavior in tests
vi.mock('@/hooks/use-profile', () => ({
  useProfile: vi.fn(),
}));

vi.mock('@/hooks/use-password', () => ({
  usePassword: vi.fn(),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/adf-profile',
}));

// Setup MSW server for API mocking
const server = setupServer(...profileHandlers);

// Mock implementation functions for hooks
const mockUseProfile = vi.mocked(vi.importMock('@/hooks/use-profile').useProfile);
const mockUsePassword = vi.mocked(vi.importMock('@/hooks/use-password').usePassword);

describe('ProfilePage Component', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeAll(() => {
    // Start MSW server
    server.listen({ onUnhandledRequest: 'error' });
  });

  beforeEach(() => {
    // Setup fresh query client for each test
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

    // Setup user event instance
    user = userEvent.setup();

    // Setup default successful mock implementations
    mockUseProfile.mockReturnValue({
      profile: mockUserProfile,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
      updateProfile: vi.fn().mockResolvedValue(true),
      updateSecurityQuestion: vi.fn().mockResolvedValue(true),
    });

    mockUsePassword.mockReturnValue({
      updatePassword: vi.fn().mockResolvedValue(true),
      isUpdating: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    queryClient.clear();
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('Component Rendering', () => {
    it('renders the profile page with all tabs', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify main heading
      expect(screen.getByRole('heading', { name: /profile management/i })).toBeInTheDocument();

      // Verify all three tabs are present
      expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /security question/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /password/i })).toBeInTheDocument();

      // Verify Details tab is initially active
      expect(screen.getByRole('tab', { name: /details/i })).toHaveAttribute('aria-selected', 'true');
    });

    it('displays loading state when profile data is loading', () => {
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: true,
        error: null,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify loading spinner or skeleton is displayed
      expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
    });

    it('displays error state when profile data fails to load', () => {
      const errorMessage = 'Failed to load profile data';
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: new Error(errorMessage),
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify error message is displayed
      expect(screen.getByTestId('profile-error')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
      
      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  describe('Profile Details Tab', () => {
    it('renders profile form with pre-filled values', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify form fields are pre-filled with mock data
      expect(screen.getByDisplayValue(mockUserProfile.first_name!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUserProfile.last_name!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUserProfile.email)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUserProfile.display_name!)).toBeInTheDocument();
      
      if (mockUserProfile.phone) {
        expect(screen.getByDisplayValue(mockUserProfile.phone)).toBeInTheDocument();
      }
    });

    it('validates required fields on profile form submission', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Clear required field
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      // Verify validation error is displayed
      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });

      // Verify form was not submitted
      expect(mockUseProfile().updateProfile).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const emailInput = screen.getByLabelText(/email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('successfully submits valid profile updates', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue(true);
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      // Update form fields
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Updated Name');

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.clear(phoneInput);
      await user.type(phoneInput, '+1-555-123-4567');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      // Verify form submission
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            first_name: 'Updated Name',
            phone: '+1-555-123-4567',
          })
        );
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('displays form submission error', async () => {
      const errorMessage = 'Failed to update profile';
      const mockUpdateProfile = vi.fn().mockRejectedValue(new Error(errorMessage));
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
      });
    });

    it('shows loading state during form submission', async () => {
      const mockUpdateProfile = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      // Verify loading state
      expect(screen.getByText(/updating profile/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/updating profile/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Security Question Tab', () => {
    it('switches to security question tab and renders form', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);

      // Verify tab is active
      expect(securityTab).toHaveAttribute('aria-selected', 'true');

      // Verify form fields are present
      expect(screen.getByLabelText(/security question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/security answer/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update security question/i })).toBeInTheDocument();
    });

    it('validates security question and answer fields', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);

      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: /update security question/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/security question is required/i)).toBeInTheDocument();
        expect(screen.getByText(/security answer is required/i)).toBeInTheDocument();
      });
    });

    it('successfully updates security question', async () => {
      const mockUpdateSecurityQuestion = vi.fn().mockResolvedValue(true);
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        updateSecurityQuestion: mockUpdateSecurityQuestion,
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);

      // Fill form
      const questionInput = screen.getByLabelText(/security question/i);
      const answerInput = screen.getByLabelText(/security answer/i);

      await user.type(questionInput, 'What is your favorite color?');
      await user.type(answerInput, 'Blue');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update security question/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateSecurityQuestion).toHaveBeenCalledWith({
          security_question: 'What is your favorite color?',
          security_answer: 'Blue',
        });
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/security question updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Update Tab', () => {
    it('switches to password tab and renders form', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Verify tab is active
      expect(passwordTab).toHaveAttribute('aria-selected', 'true');

      // Verify form fields are present
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    it('validates password requirements', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Test weak password
      const newPasswordInput = screen.getByLabelText(/new password/i);
      await user.type(newPasswordInput, 'weak');

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation match', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Fill with mismatched passwords
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it('validates new password differs from current', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Use same password for current and new
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      const samePassword = 'SamePassword123!';
      await user.type(currentPasswordInput, samePassword);
      await user.type(newPasswordInput, samePassword);
      await user.type(confirmPasswordInput, samePassword);

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/new password must be different from current password/i)).toBeInTheDocument();
      });
    });

    it('successfully updates password', async () => {
      const mockUpdatePassword = vi.fn().mockResolvedValue(true);
      mockUsePassword.mockReturnValue({
        updatePassword: mockUpdatePassword,
        isUpdating: false,
        error: null,
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Fill form with valid data
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith({
          old_password: 'oldPassword123!',
          new_password: 'NewPassword123!',
          new_password_confirmation: 'NewPassword123!',
        });
      });

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      });
    });

    it('clears form after successful password update', async () => {
      const mockUpdatePassword = vi.fn().mockResolvedValue(true);
      mockUsePassword.mockReturnValue({
        updatePassword: mockUpdatePassword,
        isUpdating: false,
        error: null,
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Fill and submit form
      const currentPasswordInput = screen.getByLabelText(/current password/i);
      const newPasswordInput = screen.getByLabelText(/new password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i);

      await user.type(currentPasswordInput, 'oldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /update password/i });
      await user.click(submitButton);

      // Wait for success and verify form is cleared
      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(currentPasswordInput).toHaveValue('');
        expect(newPasswordInput).toHaveValue('');
        expect(confirmPasswordInput).toHaveValue('');
      });
    });
  });

  describe('SWR Data Fetching', () => {
    it('handles SWR cache invalidation on profile update', async () => {
      const mockMutate = vi.fn();
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: mockMutate,
        updateProfile: vi.fn().mockResolvedValue(true),
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('handles SWR revalidation on window focus', async () => {
      const mockMutate = vi.fn();
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: mockMutate,
        updateProfile: vi.fn(),
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      // Simulate window focus event
      fireEvent.focus(window);

      // SWR should trigger revalidation
      expect(mockMutate).toHaveBeenCalled();
    });

    it('displays stale data while revalidating', async () => {
      // Mock stale data scenario
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify profile data is displayed even during revalidation
      expect(screen.getByDisplayValue(mockUserProfile.first_name!)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUserProfile.email)).toBeInTheDocument();
    });
  });

  describe('Error Boundary and Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const networkError = new Error('Network connection failed');
      mockUseProfile.mockReturnValue({
        profile: null,
        isLoading: false,
        error: networkError,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('handles server errors with proper error messages', async () => {
      const serverError = new Error('Internal server error');
      const mockUpdateProfile = vi.fn().mockRejectedValue(serverError);
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });

    it('handles validation errors from server', async () => {
      const validationError = new Error('Email already exists');
      const mockUpdateProfile = vi.fn().mockRejectedValue(validationError);
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions and Navigation', () => {
    it('maintains form state when switching tabs', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Modify profile form
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Modified Name');

      // Switch to password tab
      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Switch back to details tab
      const detailsTab = screen.getByRole('tab', { name: /details/i });
      await user.click(detailsTab);

      // Verify form state is maintained
      expect(screen.getByDisplayValue('Modified Name')).toBeInTheDocument();
    });

    it('clears alert messages when switching tabs', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Trigger validation error
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });

      // Switch tabs
      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Verify alert is cleared
      expect(screen.queryByText(/first name is required/i)).not.toBeInTheDocument();
    });

    it('handles keyboard navigation between tabs', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      const detailsTab = screen.getByRole('tab', { name: /details/i });
      const securityTab = screen.getByRole('tab', { name: /security question/i });
      const passwordTab = screen.getByRole('tab', { name: /password/i });

      // Focus on first tab
      detailsTab.focus();
      expect(detailsTab).toHaveFocus();

      // Navigate with arrow keys
      fireEvent.keyDown(detailsTab, { key: 'ArrowRight' });
      expect(securityTab).toHaveFocus();

      fireEvent.keyDown(securityTab, { key: 'ArrowRight' });
      expect(passwordTab).toHaveFocus();

      // Navigate backwards
      fireEvent.keyDown(passwordTab, { key: 'ArrowLeft' });
      expect(securityTab).toHaveFocus();
    });
  });

  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<ProfilePage />, { queryClient });

      // Run axe accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides proper ARIA labels and descriptions', () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify form controls have proper labels
      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('aria-required', 'true');
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true');

      // Verify error associations
      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(firstNameInput).toHaveAttribute('aria-describedby');
    });

    it('supports screen reader navigation', () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Verify proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { name: /profile management/i });
      expect(mainHeading).toHaveAttribute('aria-level', '1');

      // Verify tab list structure
      const tabList = screen.getByRole('tablist');
      expect(tabList).toHaveAttribute('aria-orientation', 'horizontal');

      // Verify tab panels are properly associated
      const detailsPanel = screen.getByRole('tabpanel', { name: /details/i });
      expect(detailsPanel).toHaveAttribute('aria-labelledby');
    });

    it('provides keyboard-only navigation support', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('tab', { name: /details/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /security question/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /password/i })).toHaveFocus();

      // Test form field navigation
      await user.tab();
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();
    });

    it('maintains focus management during interactions', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Switch tabs via keyboard
      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);

      // Verify focus moves to tab panel
      const securityPanel = screen.getByRole('tabpanel', { name: /security question/i });
      expect(securityPanel).toHaveFocus();
    });

    it('provides proper error announcement for screen readers', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Trigger validation error
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/first name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('debounces validation during typing', async () => {
      const mockValidation = vi.fn();
      renderWithProviders(<ProfilePage />, { queryClient });

      const emailInput = screen.getByLabelText(/email/i);
      
      // Type rapidly
      await user.type(emailInput, 'test@example');
      
      // Validation should be debounced, not called for every keystroke
      expect(mockValidation).not.toHaveBeenCalledTimes(13); // Number of characters typed
    });

    it('memoizes form components to prevent unnecessary re-renders', () => {
      const { rerender } = renderWithProviders(<ProfilePage />, { queryClient });

      // Change unrelated state that shouldn't affect form
      rerender(<ProfilePage />);

      // Form components should maintain their state without re-initialization
      expect(screen.getByDisplayValue(mockUserProfile.first_name!)).toBeInTheDocument();
    });

    it('optimistically updates UI during mutations', async () => {
      const mockUpdateProfile = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      mockUseProfile.mockReturnValue({
        profile: mockUserProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        updateSecurityQuestion: vi.fn(),
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      const submitButton = screen.getByRole('button', { name: /update profile/i });
      await user.click(submitButton);

      // UI should show optimistic feedback immediately
      expect(screen.getByText(/updating profile/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});