/**
 * Profile Management Page Test Suite
 * 
 * Comprehensive Vitest unit test suite for the profile management page component covering
 * form validation, profile data fetching, submission workflows, and error scenarios.
 * Implements React Testing Library with Mock Service Worker for API mocking, replacing
 * Angular TestBed with modern React testing patterns and achieving superior test
 * performance with Vitest's native TypeScript support.
 * 
 * Key Features:
 * - React Hook Form validation testing with Zod schema verification
 * - SWR data fetching testing with loading states and error boundary validation
 * - MSW API mocking for realistic server interaction testing
 * - WCAG 2.1 AA accessibility compliance testing
 * - Comprehensive form interaction and submission workflows
 * 
 * Replaces: src/app/adf-profile/df-profile/df-profile.component.spec.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { screen, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-dom/extend-expect';
import { QueryClient } from '@tanstack/react-query';

// Testing utilities and setup
import { renderWithProviders, createQueryClient } from '@/test/utils/test-utils';
import { createMockProfileData, createMockUserProfile } from '@/test/mocks/profile-data';
import { server } from '@/test/mocks/server';
import { profileHandlers, errorHandlers } from '@/test/mocks/handlers';

// Component under test
import ProfilePage from './page';

// Types and hooks for testing
import type { UserProfile, ChangePasswordForm } from '@/types/user';
import { useProfile } from '@/hooks/use-profile';
import { usePassword } from '@/hooks/use-password';

// Extend expect for accessibility testing
expect.extend(toHaveNoViolations);

// Mock hooks
vi.mock('@/hooks/use-profile');
vi.mock('@/hooks/use-password');

const mockUseProfile = useProfile as MockedFunction<typeof useProfile>;
const mockUsePassword = usePassword as MockedFunction<typeof usePassword>;

describe('ProfilePage', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;
  let mockProfile: UserProfile;
  let mockUpdateProfile: MockedFunction<any>;
  let mockUpdatePassword: MockedFunction<any>;
  let mockSaveProfile: MockedFunction<any>;

  beforeEach(() => {
    // Setup user event instance for interactions
    user = userEvent.setup();
    
    // Create fresh query client for each test
    queryClient = createQueryClient();
    
    // Create mock profile data matching Angular test structure
    mockProfile = createMockUserProfile({
      username: 'whenlin',
      name: 'test-user',
      first_name: 'dev',
      last_name: 'guy',
      email: 'test@test.com',
      phone: '1212121313',
      security_question: '',
      default_app_id: 1,
      oauth_provider: '',
      adldap: '',
    });

    // Mock hook functions
    mockUpdateProfile = vi.fn().mockResolvedValue({ success: true });
    mockUpdatePassword = vi.fn().mockResolvedValue({ success: true });
    mockSaveProfile = vi.fn().mockResolvedValue({ success: true });

    // Configure useProfile hook mock
    mockUseProfile.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      mutate: mockSaveProfile,
      updateProfile: mockUpdateProfile,
      isValidating: false,
    });

    // Configure usePassword hook mock
    mockUsePassword.mockReturnValue({
      updatePassword: mockUpdatePassword,
      isLoading: false,
      error: null,
    });

    // Setup MSW handlers for profile endpoints
    server.use(...profileHandlers);
  });

  afterEach(() => {
    // Clear all mocks after each test
    vi.clearAllMocks();
    
    // Reset MSW handlers
    server.resetHandlers();
  });

  describe('Component Initialization', () => {
    it('should create and render the profile management component', async () => {
      const { container } = renderWithProviders(<ProfilePage />, { queryClient });

      // Wait for component to load and verify presence of main elements
      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });

      // Verify tab navigation is present
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /profile details/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /security question/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /password/i })).toBeInTheDocument();

      // Ensure component rendered without accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should populate profile form with initial data from SWR', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@test.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('dev')).toBeInTheDocument();
        expect(screen.getByDisplayValue('guy')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1212121313')).toBeInTheDocument();
      });
    });

    it('should handle loading state during profile data fetch', async () => {
      // Mock loading state
      mockUseProfile.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        mutate: mockSaveProfile,
        updateProfile: mockUpdateProfile,
        isValidating: true,
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      // Should show loading indicator
      expect(screen.getByTestId('profile-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
    });

    it('should handle error state during profile data fetch', async () => {
      const mockError = new Error('Failed to load profile');
      
      mockUseProfile.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        mutate: mockSaveProfile,
        updateProfile: mockUpdateProfile,
        isValidating: false,
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Details Form', () => {
    beforeEach(async () => {
      renderWithProviders(<ProfilePage />, { queryClient });
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });
    });

    it('should update profile when form input is valid and save button is clicked', async () => {
      // Update the name field
      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.type(nameField, 'asparagus');

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'asparagus',
          })
        );
      });
    });

    it('should not update profile when form input is invalid and save button is clicked', async () => {
      // Clear required fields to make form invalid
      const nameField = screen.getByLabelText(/display name/i);
      const emailField = screen.getByLabelText(/email/i);
      
      await user.clear(nameField);
      await user.clear(emailField);

      // Try to submit the form
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/display name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Should not call update function
      expect(mockUpdateProfile).not.toHaveBeenCalled();
    });

    it('should show current password field when email is changed', async () => {
      // Initially, current password field should not be visible
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();

      // Change email value
      const emailField = screen.getByLabelText(/email/i);
      await user.clear(emailField);
      await user.type(emailField, 'newemail@test.com');

      // Current password field should now be visible
      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });
    });

    it('should hide current password field when email is reverted to original', async () => {
      const emailField = screen.getByLabelText(/email/i);
      
      // Change email to trigger password field
      await user.clear(emailField);
      await user.type(emailField, 'newemail@test.com');
      
      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      });

      // Revert email back to original
      await user.clear(emailField);
      await user.type(emailField, 'test@test.com');

      // Current password field should be hidden again
      await waitFor(() => {
        expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
      });
    });

    it('should validate email format with Zod schema', async () => {
      const emailField = screen.getByLabelText(/email/i);
      
      // Enter invalid email
      await user.clear(emailField);
      await user.type(emailField, 'invalid-email');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should include current password in submission when email changed', async () => {
      // Change email
      const emailField = screen.getByLabelText(/email/i);
      await user.clear(emailField);
      await user.type(emailField, 'newemail@test.com');

      // Fill current password
      await waitFor(() => {
        const currentPasswordField = screen.getByLabelText(/current password/i);
        expect(currentPasswordField).toBeInTheDocument();
      });
      
      const currentPasswordField = screen.getByLabelText(/current password/i);
      await user.type(currentPasswordField, 'currentpassword');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'newemail@test.com',
            currentPassword: 'currentpassword',
          })
        );
      });
    });
  });

  describe('Security Question Form', () => {
    beforeEach(async () => {
      renderWithProviders(<ProfilePage />, { queryClient });
      
      // Navigate to security question tab
      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);
    });

    it('should update security question when form input is valid and save button is clicked', async () => {
      // Fill in security question form
      const questionField = screen.getByLabelText(/security question/i);
      const answerField = screen.getByLabelText(/security answer/i);
      
      await user.type(questionField, 'What is your favorite drink?');
      await user.type(answerField, 'water');

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /save security question/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockSaveProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            security_question: 'What is your favorite drink?',
            security_answer: 'water',
          })
        );
      });
    });

    it('should not update security question when form is pristine', async () => {
      // Try to submit without making changes
      const saveButton = screen.getByRole('button', { name: /save security question/i });
      await user.click(saveButton);

      // Should not call save function
      expect(mockSaveProfile).not.toHaveBeenCalled();
    });

    it('should clear security answer field after successful submission', async () => {
      const questionField = screen.getByLabelText(/security question/i);
      const answerField = screen.getByLabelText(/security answer/i);
      
      await user.type(questionField, 'What is your favorite drink?');
      await user.type(answerField, 'water');

      const saveButton = screen.getByRole('button', { name: /save security question/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(answerField).toHaveValue('');
      });
    });
  });

  describe('Password Update Form', () => {
    beforeEach(async () => {
      renderWithProviders(<ProfilePage />, { queryClient });
      
      // Navigate to password tab
      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);
    });

    it('should update password when form input is valid and save button is clicked', async () => {
      // Fill in password form
      const oldPasswordField = screen.getByLabelText(/old password/i);
      const newPasswordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      
      await user.type(oldPasswordField, 'password');
      await user.type(newPasswordField, 'password1');
      await user.type(confirmPasswordField, 'password1');

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /update password/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith({
          old_password: 'password',
          new_password: 'password1',
          new_password_confirmation: 'password1',
        });
      });
    });

    it('should not update password when passwords do not match', async () => {
      const oldPasswordField = screen.getByLabelText(/old password/i);
      const newPasswordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      
      await user.type(oldPasswordField, 'password');
      await user.type(newPasswordField, 'password1');
      await user.type(confirmPasswordField, 'password2');

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /update password/i });
      await user.click(saveButton);

      // Should show password mismatch error
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      // Should not call update function
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });

    it('should validate minimum password length with Zod schema', async () => {
      const newPasswordField = screen.getByLabelText(/new password/i);
      
      // Enter password that's too short
      await user.type(newPasswordField, '123');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password complexity requirements', async () => {
      const newPasswordField = screen.getByLabelText(/new password/i);
      
      // Enter password without required complexity
      await user.type(newPasswordField, 'password');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText(/password must contain uppercase, lowercase, and number/i)).toBeInTheDocument();
      });
    });

    it('should reset form after successful password update', async () => {
      const oldPasswordField = screen.getByLabelText(/old password/i);
      const newPasswordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      
      await user.type(oldPasswordField, 'password');
      await user.type(newPasswordField, 'NewPassword123');
      await user.type(confirmPasswordField, 'NewPassword123');

      const saveButton = screen.getByRole('button', { name: /update password/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(oldPasswordField).toHaveValue('');
        expect(newPasswordField).toHaveValue('');
        expect(confirmPasswordField).toHaveValue('');
      });
    });

    it('should not update password when form is pristine', async () => {
      // Try to submit without making changes
      const saveButton = screen.getByRole('button', { name: /update password/i });
      await user.click(saveButton);

      // Should not call update function
      expect(mockUpdatePassword).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when profile update fails', async () => {
      // Mock profile update to fail
      mockUpdateProfile.mockRejectedValue(new Error('Profile update failed'));

      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Try to update profile
      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.type(nameField, 'new-name');

      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/profile update failed/i)).toBeInTheDocument();
      });
    });

    it('should display error alert when password update fails', async () => {
      // Mock password update to fail
      mockUpdatePassword.mockRejectedValue(new Error('Password update failed'));

      renderWithProviders(<ProfilePage />, { queryClient });

      // Navigate to password tab
      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Fill form and submit
      const oldPasswordField = screen.getByLabelText(/old password/i);
      const newPasswordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      
      await user.type(oldPasswordField, 'password');
      await user.type(newPasswordField, 'NewPassword123');
      await user.type(confirmPasswordField, 'NewPassword123');

      const saveButton = screen.getByRole('button', { name: /update password/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/password update failed/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Setup MSW to return network error
      server.use(...errorHandlers);

      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Try to update profile
      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.type(nameField, 'new-name');

      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have no accessibility violations in profile details tab', async () => {
      const { container } = renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in security question tab', async () => {
      const { container } = renderWithProviders(<ProfilePage />, { queryClient });

      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations in password tab', async () => {
      const { container } = renderWithProviders(<ProfilePage />, { queryClient });

      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce form validation errors to screen readers', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Clear required field to trigger error
      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/display name is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should support keyboard navigation through form tabs', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const profileTab = screen.getByRole('tab', { name: /profile details/i });
      const securityTab = screen.getByRole('tab', { name: /security question/i });
      const passwordTab = screen.getByRole('tab', { name: /password/i });

      profileTab.focus();
      expect(profileTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(securityTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(passwordTab).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(securityTab).toHaveFocus();
    });

    it('should provide proper form labels and descriptions', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Check that all form fields have proper labels
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();

      // Check that help text is properly associated
      const emailField = screen.getByLabelText(/email/i);
      const emailDescription = screen.queryByText(/your email address used for notifications/i);
      if (emailDescription) {
        expect(emailField).toHaveAttribute('aria-describedby', expect.stringContaining(emailDescription.id));
      }
    });
  });

  describe('SWR Data Fetching Integration', () => {
    it('should handle SWR revalidation on focus', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Simulate window focus to trigger revalidation
      window.dispatchEvent(new Event('focus'));

      // SWR should attempt to revalidate
      await waitFor(() => {
        expect(mockUseProfile).toHaveBeenCalled();
      });
    });

    it('should handle SWR background revalidation', async () => {
      // Mock stale data scenario
      mockUseProfile.mockReturnValue({
        data: mockProfile,
        isLoading: false,
        error: null,
        mutate: mockSaveProfile,
        updateProfile: mockUpdateProfile,
        isValidating: true, // Background revalidation in progress
      });

      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Should show subtle loading indicator during background revalidation
      expect(screen.getByTestId('background-revalidation-indicator')).toBeInTheDocument();
    });

    it('should handle optimistic updates correctly', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Update name field
      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.type(nameField, 'updated-name');

      // Submit form - should show optimistic update
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      // Optimistic update should be reflected immediately
      expect(nameField).toHaveValue('updated-name');
      
      // Loading state should be shown
      expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    it('should track form dirty state correctly', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Initially, save button should be disabled
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      expect(saveButton).toBeDisabled();

      // Make a change to make form dirty
      const nameField = screen.getByLabelText(/display name/i);
      await user.type(nameField, ' updated');

      // Save button should now be enabled
      await waitFor(() => {
        expect(saveButton).toBeEnabled();
      });
    });

    it('should reset form dirty state after successful submission', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.type(nameField, 'updated-name');

      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      // After successful submission, form should be clean again
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
      });
    });

    it('should preserve form data during tab navigation', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Modify profile form
      const nameField = screen.getByLabelText(/display name/i);
      await user.clear(nameField);
      await user.type(nameField, 'modified-name');

      // Navigate to another tab and back
      const securityTab = screen.getByRole('tab', { name: /security question/i });
      await user.click(securityTab);

      const profileTab = screen.getByRole('tab', { name: /profile details/i });
      await user.click(profileTab);

      // Form data should be preserved
      await waitFor(() => {
        expect(screen.getByDisplayValue('modified-name')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Testing', () => {
    it('should handle complete profile update workflow', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      await waitFor(() => {
        expect(screen.getByDisplayValue('test-user')).toBeInTheDocument();
      });

      // Update multiple fields
      const nameField = screen.getByLabelText(/display name/i);
      const firstNameField = screen.getByLabelText(/first name/i);
      const phoneField = screen.getByLabelText(/phone/i);

      await user.clear(nameField);
      await user.type(nameField, 'new-display-name');
      
      await user.clear(firstNameField);
      await user.type(firstNameField, 'newfirst');
      
      await user.clear(phoneField);
      await user.type(phoneField, '9999999999');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(saveButton);

      // Verify all changes were included in the update
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'new-display-name',
            first_name: 'newfirst',
            phone: '9999999999',
          })
        );
      });

      // Should show success message
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });

    it('should handle complete password change workflow with proper validation', async () => {
      renderWithProviders(<ProfilePage />, { queryClient });

      // Navigate to password tab
      const passwordTab = screen.getByRole('tab', { name: /password/i });
      await user.click(passwordTab);

      // Fill in all password fields with valid data
      const oldPasswordField = screen.getByLabelText(/old password/i);
      const newPasswordField = screen.getByLabelText(/new password/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      
      await user.type(oldPasswordField, 'currentPassword123');
      await user.type(newPasswordField, 'NewSecurePassword123');
      await user.type(confirmPasswordField, 'NewSecurePassword123');

      // Submit form
      const saveButton = screen.getByRole('button', { name: /update password/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith({
          old_password: 'currentPassword123',
          new_password: 'NewSecurePassword123',
          new_password_confirmation: 'NewSecurePassword123',
        });
      });

      // Should show success message and reset form
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      expect(oldPasswordField).toHaveValue('');
      expect(newPasswordField).toHaveValue('');
      expect(confirmPasswordField).toHaveValue('');
    });
  });
});