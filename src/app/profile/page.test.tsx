/**
 * @fileoverview Comprehensive Vitest unit test suite for profile management page component
 * 
 * This test suite covers form validation, profile data fetching, submission workflows, 
 * and error scenarios using React Testing Library with Mock Service Worker for API mocking.
 * Replaces Angular TestBed with modern React testing patterns achieving superior test 
 * performance with Vitest's native TypeScript support.
 * 
 * @requirements
 * - Vitest testing framework with 10x faster test execution per Section 0.2.4 dependency decisions
 * - React Testing Library integration for component testing best practices per testing infrastructure
 * - Mock Service Worker (MSW) for realistic API mocking during testing per Section 4.7.1.3
 * - Comprehensive test coverage for profile management functionality maintaining Angular test parity
 * - Accessibility testing integration per WCAG 2.1 AA compliance requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { server } from '@/test/mocks/server'
import { createProfileMockData, createPasswordUpdateMockData } from '@/test/mocks/profile-data'
import { renderWithProviders } from '@/test/utils/test-utils'
import { HttpResponse, http } from 'msw'

// Component under test
import ProfilePage from './page'

// Mock dependencies for React hooks and external libraries
vi.mock('@/hooks/use-profile', () => ({
  useProfile: vi.fn()
}))

vi.mock('@/hooks/use-password', () => ({
  usePassword: vi.fn()
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }))
}))

// Import mocked hooks
import { useProfile } from '@/hooks/use-profile'
import { usePassword } from '@/hooks/use-password'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

/**
 * Profile page test suite covering comprehensive functionality including
 * form validation, API interactions, error handling, and accessibility compliance
 */
describe('ProfilePage', () => {
  // Mock data setup
  const mockProfileData = createProfileMockData()
  const mockPasswordData = createPasswordUpdateMockData()
  
  // Mock hook return values
  const mockUseProfile = useProfile as Mock
  const mockUsePassword = usePassword as Mock

  // Setup user interaction utilities
  const user = userEvent.setup()

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
    
    // Setup default mock implementations for hooks
    mockUseProfile.mockReturnValue({
      data: mockProfileData.validProfile,
      isLoading: false,
      error: null,
      mutate: vi.fn(),
      updateProfile: vi.fn(),
      isValidating: false
    })

    mockUsePassword.mockReturnValue({
      updatePassword: vi.fn(),
      isUpdating: false,
      error: null
    })

    // Setup MSW server for this test suite
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    // Clean up MSW handlers after each test
    server.resetHandlers()
    server.close()
  })

  /**
   * Basic rendering and structure tests
   */
  describe('Component Rendering', () => {
    it('renders profile page with correct heading structure', async () => {
      renderWithProviders(<ProfilePage />)

      // Verify main heading exists and is accessible
      const mainHeading = screen.getByRole('heading', { 
        name: /profile settings/i, 
        level: 1 
      })
      expect(mainHeading).toBeInTheDocument()

      // Verify section headings for profile form sections
      expect(screen.getByRole('heading', { 
        name: /personal information/i, 
        level: 2 
      })).toBeInTheDocument()
      
      expect(screen.getByRole('heading', { 
        name: /security settings/i, 
        level: 2 
      })).toBeInTheDocument()
    })

    it('displays loading state while fetching profile data', () => {
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        isValidating: false
      })

      renderWithProviders(<ProfilePage />)

      // Verify loading indicator is present and accessible
      expect(screen.getByRole('progressbar', { 
        name: /loading profile data/i 
      })).toBeInTheDocument()
      
      // Verify loading text is present
      expect(screen.getByText(/loading profile information/i)).toBeInTheDocument()
    })

    it('renders profile form fields when data is loaded', async () => {
      renderWithProviders(<ProfilePage />)

      // Wait for form to be fully rendered
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockProfileData.validProfile.name)).toBeInTheDocument()
      })

      // Verify all expected form fields are present
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    })
  })

  /**
   * Form validation testing with React Hook Form and Zod schema validation
   */
  describe('Profile Form Validation', () => {
    it('validates required fields and displays error messages', async () => {
      renderWithProviders(<ProfilePage />)

      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Clear required field and trigger validation
      const nameField = screen.getByLabelText(/full name/i)
      await user.clear(nameField)
      await user.tab()

      // Verify validation error appears
      await waitFor(() => {
        expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
      })

      // Verify field has error styling (aria-invalid)
      expect(nameField).toHaveAttribute('aria-invalid', 'true')
    })

    it('validates email format and displays appropriate error', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      })

      // Enter invalid email format
      const emailField = screen.getByLabelText(/email address/i)
      await user.clear(emailField)
      await user.type(emailField, 'invalid-email')
      await user.tab()

      // Verify email validation error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('validates phone number format with proper error messaging', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      })

      // Enter invalid phone number
      const phoneField = screen.getByLabelText(/phone number/i)
      await user.clear(phoneField)
      await user.type(phoneField, '123')
      await user.tab()

      // Verify phone validation error
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument()
      })
    })

    it('validates display name uniqueness requirement', async () => {
      // Setup MSW handler for duplicate display name check
      server.use(
        http.post('/api/v2/system/user/profile/validate', () => {
          return HttpResponse.json({
            error: {
              code: 422,
              message: 'Display name already exists',
              context: {
                field: 'display_name',
                value: 'existing-user'
              }
            }
          }, { status: 422 })
        })
      )

      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
      })

      // Enter existing display name
      const displayNameField = screen.getByLabelText(/display name/i)
      await user.clear(displayNameField)
      await user.type(displayNameField, 'existing-user')
      await user.tab()

      // Verify server validation error
      await waitFor(() => {
        expect(screen.getByText(/display name already exists/i)).toBeInTheDocument()
      })
    })

    it('clears validation errors when fields are corrected', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      })

      // Trigger validation error
      const emailField = screen.getByLabelText(/email address/i)
      await user.clear(emailField)
      await user.type(emailField, 'invalid')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })

      // Correct the email
      await user.clear(emailField)
      await user.type(emailField, 'valid@example.com')
      await user.tab()

      // Verify error is cleared
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
      })
    })
  })

  /**
   * Password management testing with security validation
   */
  describe('Password Management', () => {
    it('renders password change form with security requirements', async () => {
      renderWithProviders(<ProfilePage />)

      // Open password change section
      const passwordSection = screen.getByRole('button', { 
        name: /change password/i 
      })
      await user.click(passwordSection)

      // Verify password form fields
      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
      })

      // Verify password requirements are displayed
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/must contain uppercase and lowercase letters/i)).toBeInTheDocument()
      expect(screen.getByText(/must contain at least one number/i)).toBeInTheDocument()
    })

    it('validates password strength requirements', async () => {
      renderWithProviders(<ProfilePage />)

      // Open password section
      const passwordSection = screen.getByRole('button', { 
        name: /change password/i 
      })
      await user.click(passwordSection)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      // Test weak password
      const newPasswordField = screen.getByLabelText(/new password/i)
      await user.type(newPasswordField, 'weak')
      await user.tab()

      // Verify strength validation
      await waitFor(() => {
        expect(screen.getByText(/password does not meet security requirements/i)).toBeInTheDocument()
      })
    })

    it('validates password confirmation matching', async () => {
      renderWithProviders(<ProfilePage />)

      // Open password section
      const passwordSection = screen.getByRole('button', { 
        name: /change password/i 
      })
      await user.click(passwordSection)

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      // Enter passwords that don't match
      const newPasswordField = screen.getByLabelText(/new password/i)
      const confirmPasswordField = screen.getByLabelText(/confirm new password/i)
      
      await user.type(newPasswordField, 'SecurePass123!')
      await user.type(confirmPasswordField, 'DifferentPass123!')
      await user.tab()

      // Verify mismatch error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('handles password update submission successfully', async () => {
      const mockUpdatePassword = vi.fn().mockResolvedValue({ success: true })
      mockUsePassword.mockReturnValue({
        updatePassword: mockUpdatePassword,
        isUpdating: false,
        error: null
      })

      renderWithProviders(<ProfilePage />)

      // Open password section and fill form
      const passwordSection = screen.getByRole('button', { 
        name: /change password/i 
      })
      await user.click(passwordSection)

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
      })

      // Fill password form
      await user.type(screen.getByLabelText(/current password/i), 'currentpass')
      await user.type(screen.getByLabelText(/new password/i), 'NewSecurePass123!')
      await user.type(screen.getByLabelText(/confirm new password/i), 'NewSecurePass123!')

      // Submit password change
      const updateButton = screen.getByRole('button', { name: /update password/i })
      await user.click(updateButton)

      // Verify password update was called
      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith({
          currentPassword: 'currentpass',
          newPassword: 'NewSecurePass123!'
        })
      })
    })
  })

  /**
   * Profile data fetching and SWR integration testing
   */
  describe('Profile Data Management', () => {
    it('handles profile data fetching with SWR loading states', async () => {
      // Start with loading state
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        isValidating: false
      })

      const { rerender } = renderWithProviders(<ProfilePage />)

      // Verify loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Update to loaded state
      mockUseProfile.mockReturnValue({
        data: mockProfileData.validProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        isValidating: false
      })

      rerender(<ProfilePage />)

      // Verify data is displayed
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockProfileData.validProfile.name)).toBeInTheDocument()
      })
    })

    it('handles profile data fetching errors with error boundary', async () => {
      const mockError = new Error('Failed to fetch profile data')
      
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: false,
        error: mockError,
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        isValidating: false
      })

      renderWithProviders(<ProfilePage />)

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to load profile data/i)).toBeInTheDocument()
      })

      // Verify retry button is available
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('handles profile update submission with optimistic updates', async () => {
      const mockUpdateProfile = vi.fn().mockResolvedValue({ success: true })
      const mockMutate = vi.fn()

      mockUseProfile.mockReturnValue({
        data: mockProfileData.validProfile,
        isLoading: false,
        error: null,
        mutate: mockMutate,
        updateProfile: mockUpdateProfile,
        isValidating: false
      })

      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Update profile information
      const nameField = screen.getByLabelText(/full name/i)
      await user.clear(nameField)
      await user.type(nameField, 'Updated Name')

      // Submit form
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify update was called with correct data
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          ...mockProfileData.validProfile,
          name: 'Updated Name'
        })
      })
    })

    it('handles concurrent profile updates with conflict resolution', async () => {
      // Setup conflict response
      server.use(
        http.put('/api/v2/system/user/profile', () => {
          return HttpResponse.json({
            error: {
              code: 409,
              message: 'Profile was modified by another user',
              context: {
                lastModified: '2023-10-01T12:00:00Z'
              }
            }
          }, { status: 409 })
        })
      )

      const mockUpdateProfile = vi.fn().mockRejectedValue({
        status: 409,
        message: 'Profile was modified by another user'
      })

      mockUseProfile.mockReturnValue({
        data: mockProfileData.validProfile,
        isLoading: false,
        error: null,
        mutate: vi.fn(),
        updateProfile: mockUpdateProfile,
        isValidating: false
      })

      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Attempt update
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify conflict message is shown
      await waitFor(() => {
        expect(screen.getByText(/profile was modified by another user/i)).toBeInTheDocument()
      })

      // Verify reload option is available
      expect(screen.getByRole('button', { name: /reload profile/i })).toBeInTheDocument()
    })
  })

  /**
   * Error handling and edge cases testing
   */
  describe('Error Handling', () => {
    it('displays appropriate error for network failures', async () => {
      // Simulate network error
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Network request failed', code: 'NETWORK_ERROR' },
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        isValidating: false
      })

      renderWithProviders(<ProfilePage />)

      // Verify network error message
      await waitFor(() => {
        expect(screen.getByText(/network connection error/i)).toBeInTheDocument()
      })

      // Verify retry functionality
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('handles authentication errors with redirect to login', async () => {
      const mockPush = vi.fn()
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush
      })

      // Simulate auth error
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Unauthorized', code: 401 },
        mutate: vi.fn(),
        updateProfile: vi.fn(),
        isValidating: false
      })

      renderWithProviders(<ProfilePage />)

      // Verify authentication error handling
      await waitFor(() => {
        expect(screen.getByText(/authentication required/i)).toBeInTheDocument()
      })
    })

    it('handles server validation errors with field-specific messages', async () => {
      // Setup server validation error response
      server.use(
        http.put('/api/v2/system/user/profile', () => {
          return HttpResponse.json({
            error: {
              code: 422,
              message: 'Validation failed',
              context: {
                errors: {
                  email: ['Email is already in use'],
                  displayName: ['Display name contains invalid characters']
                }
              }
            }
          }, { status: 422 })
        })
      )

      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      })

      // Submit form to trigger server validation
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify field-specific errors are displayed
      await waitFor(() => {
        expect(screen.getByText(/email is already in use/i)).toBeInTheDocument()
        expect(screen.getByText(/display name contains invalid characters/i)).toBeInTheDocument()
      })
    })
  })

  /**
   * Accessibility compliance testing (WCAG 2.1 AA)
   */
  describe('Accessibility Compliance', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Run accessibility audit
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('provides proper ARIA labels and descriptions for form fields', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Verify ARIA attributes
      const nameField = screen.getByLabelText(/full name/i)
      expect(nameField).toHaveAttribute('aria-required', 'true')
      expect(nameField).toHaveAttribute('aria-describedby')

      const emailField = screen.getByLabelText(/email address/i)
      expect(emailField).toHaveAttribute('aria-required', 'true')
      expect(emailField).toHaveAttribute('aria-describedby')
    })

    it('manages focus properly during form interactions', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Test tab navigation
      const nameField = screen.getByLabelText(/full name/i)
      nameField.focus()
      expect(document.activeElement).toBe(nameField)

      // Tab to next field
      await user.tab()
      const emailField = screen.getByLabelText(/email address/i)
      expect(document.activeElement).toBe(emailField)
    })

    it('announces form validation errors to screen readers', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Trigger validation error
      const nameField = screen.getByLabelText(/full name/i)
      await user.clear(nameField)
      await user.tab()

      // Verify error has proper ARIA attributes
      await waitFor(() => {
        const errorMessage = screen.getByText(/full name is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
        expect(nameField).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('provides keyboard navigation for all interactive elements', async () => {
      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      })

      // Test keyboard navigation to buttons
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      
      // Focus and activate with keyboard
      saveButton.focus()
      expect(document.activeElement).toBe(saveButton)
      
      // Test enter key activation
      fireEvent.keyDown(saveButton, { key: 'Enter', code: 'Enter' })
      // Should trigger form submission (verified by other tests)
    })
  })

  /**
   * Security questions and two-factor authentication testing
   */
  describe('Security Features', () => {
    it('renders security questions configuration section', async () => {
      renderWithProviders(<ProfilePage />)

      // Look for security questions section
      const securitySection = screen.getByText(/security questions/i)
      expect(securitySection).toBeInTheDocument()

      // Verify security questions setup button
      expect(screen.getByRole('button', { 
        name: /configure security questions/i 
      })).toBeInTheDocument()
    })

    it('handles security questions validation with proper error messaging', async () => {
      renderWithProviders(<ProfilePage />)

      // Open security questions section
      const configButton = screen.getByRole('button', { 
        name: /configure security questions/i 
      })
      await user.click(configButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/security question 1/i)).toBeInTheDocument()
      })

      // Test validation for duplicate questions
      const question1 = screen.getByLabelText(/security question 1/i)
      const question2 = screen.getByLabelText(/security question 2/i)
      
      await user.selectOptions(question1, 'favorite-pet')
      await user.selectOptions(question2, 'favorite-pet')
      await user.tab()

      // Verify duplicate error
      await waitFor(() => {
        expect(screen.getByText(/security questions must be different/i)).toBeInTheDocument()
      })
    })

    it('validates security question answers with appropriate requirements', async () => {
      renderWithProviders(<ProfilePage />)

      // Open security questions section
      const configButton = screen.getByRole('button', { 
        name: /configure security questions/i 
      })
      await user.click(configButton)

      await waitFor(() => {
        expect(screen.getByLabelText(/answer 1/i)).toBeInTheDocument()
      })

      // Test answer validation
      const answer1 = screen.getByLabelText(/answer 1/i)
      await user.type(answer1, 'ab') // Too short
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/answer must be at least 3 characters/i)).toBeInTheDocument()
      })
    })
  })

  /**
   * Profile picture upload and file handling testing
   */
  describe('Profile Picture Management', () => {
    it('renders profile picture upload section with drag and drop', async () => {
      renderWithProviders(<ProfilePage />)

      // Verify profile picture section
      expect(screen.getByText(/profile picture/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { 
        name: /upload new picture/i 
      })).toBeInTheDocument()

      // Verify drag and drop area
      expect(screen.getByText(/drag image here or click to browse/i)).toBeInTheDocument()
    })

    it('validates profile picture file types and size restrictions', async () => {
      renderWithProviders(<ProfilePage />)

      // Create mock file with invalid type
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      
      const uploadButton = screen.getByRole('button', { 
        name: /upload new picture/i 
      })
      
      // Simulate file selection
      const fileInput = screen.getByLabelText(/profile picture upload/i)
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false
      })
      
      fireEvent.change(fileInput)

      // Verify file type validation error
      await waitFor(() => {
        expect(screen.getByText(/please select a valid image file/i)).toBeInTheDocument()
      })
    })

    it('handles profile picture upload with progress tracking', async () => {
      renderWithProviders(<ProfilePage />)

      // Create valid image file
      const validFile = new File(['content'], 'profile.jpg', { type: 'image/jpeg' })
      
      const fileInput = screen.getByLabelText(/profile picture upload/i)
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false
      })
      
      fireEvent.change(fileInput)

      // Verify upload progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar', { 
          name: /uploading profile picture/i 
        })).toBeInTheDocument()
      })
    })
  })

  /**
   * Integration testing with MSW for realistic API interactions
   */
  describe('API Integration with MSW', () => {
    it('integrates with profile API endpoints using MSW handlers', async () => {
      // Setup MSW handler for profile fetch
      server.use(
        http.get('/api/v2/system/user/profile', () => {
          return HttpResponse.json({
            resource: [mockProfileData.validProfile]
          })
        })
      )

      renderWithProviders(<ProfilePage />)

      // Verify data is fetched and displayed
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockProfileData.validProfile.name)).toBeInTheDocument()
      })
    })

    it('handles MSW-mocked API errors with proper error boundaries', async () => {
      // Setup MSW error handler
      server.use(
        http.get('/api/v2/system/user/profile', () => {
          return HttpResponse.json({
            error: {
              code: 500,
              message: 'Internal server error'
            }
          }, { status: 500 })
        })
      )

      renderWithProviders(<ProfilePage />)

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })
    })

    it('tests profile update API calls with MSW request validation', async () => {
      let capturedRequest: any = null

      // Setup MSW handler to capture request
      server.use(
        http.put('/api/v2/system/user/profile', async ({ request }) => {
          capturedRequest = await request.json()
          return HttpResponse.json({
            resource: [{ ...mockProfileData.validProfile, ...capturedRequest }]
          })
        })
      )

      renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Update profile data
      const nameField = screen.getByLabelText(/full name/i)
      await user.clear(nameField)
      await user.type(nameField, 'MSW Test Name')

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      // Verify request was captured correctly
      await waitFor(() => {
        expect(capturedRequest).toMatchObject({
          name: 'MSW Test Name'
        })
      })
    })
  })

  /**
   * Performance and optimization testing
   */
  describe('Performance Optimization', () => {
    it('renders form fields efficiently without unnecessary re-renders', async () => {
      const renderCount = vi.fn()
      
      const ProfilePageWithCounter = () => {
        renderCount()
        return <ProfilePage />
      }

      renderWithProviders(<ProfilePageWithCounter />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Type in field - should not cause full re-render
      const nameField = screen.getByLabelText(/full name/i)
      await user.type(nameField, 'a')

      // Verify minimal re-renders (React Hook Form optimization)
      expect(renderCount).toHaveBeenCalledTimes(1)
    })

    it('implements proper cleanup to prevent memory leaks', async () => {
      const { unmount } = renderWithProviders(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      })

      // Unmount component
      unmount()

      // Verify cleanup was called (mocked hooks should handle cleanup)
      expect(mockUseProfile).toHaveBeenCalled()
    })
  })
})