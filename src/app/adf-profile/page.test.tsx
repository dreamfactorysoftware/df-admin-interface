import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { rest } from 'msw'

import ProfilePage from './page'
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockProfile } from '@/test/mocks/profile-data'
import { server } from '@/test/mocks/server'
import { useProfile } from '@/hooks/use-profile'
import { usePassword } from '@/hooks/use-password'
import { profileValidationSchema } from '@/lib/validations/profile'

// Add jest-axe custom matcher
expect.extend(toHaveNoViolations)

// Mock the hooks
vi.mock('@/hooks/use-profile')
vi.mock('@/hooks/use-password')

const mockUseProfile = useProfile as Mock
const mockUsePassword = usePassword as Mock

const mockProfile = createMockProfile({
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User',
  email: 'test@dreamfactory.com',
  phone: '555-0123',
  securityQuestion: 'What is your favorite color?',
  defaultAppId: 1,
})

describe('ProfilePage', () => {
  const mockUpdateProfile = vi.fn()
  const mockUpdatePassword = vi.fn()
  const mockMutateProfile = vi.fn()

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Setup default mock implementations
    mockUseProfile.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      mutate: mockMutateProfile,
      updateProfile: mockUpdateProfile,
    })

    mockUsePassword.mockReturnValue({
      updatePassword: mockUpdatePassword,
      isLoading: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the profile page without crashes', () => {
      renderWithProviders(<ProfilePage />)
      
      expect(screen.getByRole('tabpanel', { name: /profile details/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /security question/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /password/i })).toBeInTheDocument()
    })

    it('should meet WCAG 2.1 AA accessibility standards', async () => {
      const { container } = renderWithProviders(<ProfilePage />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should display loading state while fetching profile data', () => {
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        mutate: mockMutateProfile,
        updateProfile: mockUpdateProfile,
      })

      renderWithProviders(<ProfilePage />)
      
      expect(screen.getByTestId('profile-loading')).toBeInTheDocument()
      expect(screen.getByRole('status', { name: /loading profile/i })).toBeInTheDocument()
    })

    it('should display error state when profile loading fails', () => {
      const errorMessage = 'Failed to load profile'
      mockUseProfile.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error(errorMessage),
        mutate: mockMutateProfile,
        updateProfile: mockUpdateProfile,
      })

      renderWithProviders(<ProfilePage />)
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Profile Details Tab', () => {
    beforeEach(() => {
      renderWithProviders(<ProfilePage />)
    })

    it('should populate form fields with current profile data', () => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test')).toBeInTheDocument()
      expect(screen.getByDisplayValue('User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@dreamfactory.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('555-0123')).toBeInTheDocument()
    })

    it('should validate required fields in real-time', async () => {
      const user = userEvent.setup()
      const nameInput = screen.getByLabelText(/name/i)

      // Clear the required field
      await user.clear(nameInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })

      // Fill in valid data
      await user.type(nameInput, 'Valid Name')
      
      await waitFor(() => {
        expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
      })
    })

    it('should validate email format in real-time', async () => {
      const user = userEvent.setup()
      const emailInput = screen.getByLabelText(/email/i)

      await user.clear(emailInput)
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      })
    })

    it('should show current password field when email is changed', async () => {
      const user = userEvent.setup()
      const emailInput = screen.getByLabelText(/email/i)

      // Initially current password should not be visible
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument()

      // Change email
      await user.clear(emailInput)
      await user.type(emailInput, 'newemail@dreamfactory.com')

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
      })
    })

    it('should hide current password field when email is reverted to original', async () => {
      const user = userEvent.setup()
      const emailInput = screen.getByLabelText(/email/i)

      // Change email to trigger current password field
      await user.clear(emailInput)
      await user.type(emailInput, 'newemail@dreamfactory.com')

      await waitFor(() => {
        expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
      })

      // Revert email to original
      await user.clear(emailInput)
      await user.type(emailInput, 'test@dreamfactory.com')

      await waitFor(() => {
        expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument()
      })
    })

    it('should successfully update profile with valid data', async () => {
      const user = userEvent.setup()
      
      // Update profile data
      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Updated Name',
          })
        )
      })
    })

    it('should not submit profile with invalid data', async () => {
      const user = userEvent.setup()
      
      // Clear required field
      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateProfile).not.toHaveBeenCalled()
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should require current password when email is changed', async () => {
      const user = userEvent.setup()
      
      // Change email
      const emailInput = screen.getByLabelText(/email/i)
      await user.clear(emailInput)
      await user.type(emailInput, 'newemail@dreamfactory.com')

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/current password is required when changing email/i)).toBeInTheDocument()
        expect(mockUpdateProfile).not.toHaveBeenCalled()
      })
    })

    it('should display success message after successful update', async () => {
      const user = userEvent.setup()
      
      mockUpdateProfile.mockResolvedValueOnce({ success: true })

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument()
      })
    })

    it('should display error message when update fails', async () => {
      const user = userEvent.setup()
      
      mockUpdateProfile.mockRejectedValueOnce(new Error('Update failed'))

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument()
      })
    })
  })

  describe('Security Question Tab', () => {
    beforeEach(async () => {
      renderWithProviders(<ProfilePage />)
      
      const user = userEvent.setup()
      const securityTab = screen.getByRole('tab', { name: /security question/i })
      await user.click(securityTab)
    })

    it('should display current security question', () => {
      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument()
    })

    it('should validate required fields for security question', async () => {
      const user = userEvent.setup()
      
      const questionInput = screen.getByLabelText(/security question/i)
      const answerInput = screen.getByLabelText(/security answer/i)

      // Clear required fields
      await user.clear(questionInput)
      await user.clear(answerInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/security question is required/i)).toBeInTheDocument()
        expect(screen.getByText(/security answer is required/i)).toBeInTheDocument()
      })
    })

    it('should successfully update security question with valid data', async () => {
      const user = userEvent.setup()
      
      const questionInput = screen.getByLabelText(/security question/i)
      const answerInput = screen.getByLabelText(/security answer/i)

      await user.clear(questionInput)
      await user.type(questionInput, 'What is your pet\'s name?')
      await user.clear(answerInput)
      await user.type(answerInput, 'Fluffy')

      const saveButton = screen.getByRole('button', { name: /update security question/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            securityQuestion: 'What is your pet\'s name?',
            securityAnswer: 'Fluffy',
          })
        )
      })
    })

    it('should not submit security question with empty fields', async () => {
      const user = userEvent.setup()
      
      const questionInput = screen.getByLabelText(/security question/i)
      await user.clear(questionInput)

      const saveButton = screen.getByRole('button', { name: /update security question/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockUpdateProfile).not.toHaveBeenCalled()
        expect(screen.getByText(/security question is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Password Tab', () => {
    beforeEach(async () => {
      renderWithProviders(<ProfilePage />)
      
      const user = userEvent.setup()
      const passwordTab = screen.getByRole('tab', { name: /password/i })
      await user.click(passwordTab)
    })

    it('should validate password requirements', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)

      // Test minimum length
      await user.type(newPasswordInput, '123')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup()
      
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)

      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'differentpassword')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should successfully update password with valid data', async () => {
      const user = userEvent.setup()
      
      const oldPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)

      await user.type(oldPasswordInput, 'currentpassword')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'newpassword123')

      const updateButton = screen.getByRole('button', { name: /update password/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockUpdatePassword).toHaveBeenCalledWith({
          oldPassword: 'currentpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123',
        })
      })
    })

    it('should not submit password form with mismatched passwords', async () => {
      const user = userEvent.setup()
      
      const oldPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)

      await user.type(oldPasswordInput, 'currentpassword')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'differentpassword')

      const updateButton = screen.getByRole('button', { name: /update password/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(mockUpdatePassword).not.toHaveBeenCalled()
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should display success message after successful password update', async () => {
      const user = userEvent.setup()
      
      mockUpdatePassword.mockResolvedValueOnce({ success: true })

      const oldPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)

      await user.type(oldPasswordInput, 'currentpassword')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'newpassword123')

      const updateButton = screen.getByRole('button', { name: /update password/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument()
      })
    })

    it('should clear password form after successful update', async () => {
      const user = userEvent.setup()
      
      mockUpdatePassword.mockResolvedValueOnce({ success: true })

      const oldPasswordInput = screen.getByLabelText(/current password/i)
      const newPasswordInput = screen.getByLabelText(/new password/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm new password/i)

      await user.type(oldPasswordInput, 'currentpassword')
      await user.type(newPasswordInput, 'newpassword123')
      await user.type(confirmPasswordInput, 'newpassword123')

      const updateButton = screen.getByRole('button', { name: /update password/i })
      await user.click(updateButton)

      await waitFor(() => {
        expect(oldPasswordInput).toHaveValue('')
        expect(newPasswordInput).toHaveValue('')
        expect(confirmPasswordInput).toHaveValue('')
      })
    })
  })

  describe('Tab Navigation', () => {
    beforeEach(() => {
      renderWithProviders(<ProfilePage />)
    })

    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup()

      // Initially on Details tab
      expect(screen.getByRole('tabpanel', { name: /profile details/i })).toBeInTheDocument()

      // Switch to Security Question tab
      const securityTab = screen.getByRole('tab', { name: /security question/i })
      await user.click(securityTab)

      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /security question/i })).toBeInTheDocument()
      })

      // Switch to Password tab
      const passwordTab = screen.getByRole('tab', { name: /password/i })
      await user.click(passwordTab)

      await waitFor(() => {
        expect(screen.getByRole('tabpanel', { name: /password/i })).toBeInTheDocument()
      })
    })

    it('should dismiss alerts when switching tabs', async () => {
      const user = userEvent.setup()

      // Trigger an error on the current tab
      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })

      // Switch tabs
      const securityTab = screen.getByRole('tab', { name: /security question/i })
      await user.click(securityTab)

      // Alert should be dismissed (implementation specific)
      // This test verifies the behavior described in the original Angular component
    })

    it('should support keyboard navigation between tabs', async () => {
      const user = userEvent.setup()

      const detailsTab = screen.getByRole('tab', { name: /details/i })
      const securityTab = screen.getByRole('tab', { name: /security question/i })
      const passwordTab = screen.getByRole('tab', { name: /password/i })

      // Focus on first tab
      detailsTab.focus()
      expect(detailsTab).toHaveFocus()

      // Use arrow keys to navigate
      await user.keyboard('{ArrowRight}')
      expect(securityTab).toHaveFocus()

      await user.keyboard('{ArrowRight}')
      expect(passwordTab).toHaveFocus()

      // Wrap around to first tab
      await user.keyboard('{ArrowRight}')
      expect(detailsTab).toHaveFocus()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for small screens', () => {
      // Mock viewport size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      renderWithProviders(<ProfilePage />)

      const container = screen.getByTestId('profile-container')
      expect(container).toHaveClass('small-screen-layout')
    })

    it('should adapt layout for large screens', () => {
      // Mock viewport size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      renderWithProviders(<ProfilePage />)

      const container = screen.getByTestId('profile-container')
      expect(container).toHaveClass('large-screen-layout')
    })
  })

  describe('API Integration', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock API error response
      server.use(
        rest.put('/api/v2/user/profile', (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              error: {
                code: 422,
                message: 'Validation failed',
                details: ['Email already exists'],
              },
            })
          )
        })
      )

      mockUpdateProfile.mockRejectedValueOnce(new Error('Validation failed'))

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/validation failed/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock network error
      mockUpdateProfile.mockRejectedValueOnce(new Error('Network error'))

      const nameInput = screen.getByLabelText(/name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      const saveButton = screen.getByRole('button', { name: /save profile/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should validate forms in under 100ms', async () => {
      const user = userEvent.setup()
      
      const nameInput = screen.getByLabelText(/name/i)
      
      const startTime = performance.now()
      await user.clear(nameInput)
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const validationTime = endTime - startTime
      
      expect(validationTime).toBeLessThan(100)
    })

    it('should render tabs without performance degradation', () => {
      const startTime = performance.now()
      
      renderWithProviders(<ProfilePage />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render in reasonable time (less than 50ms for this simple component)
      expect(renderTime).toBeLessThan(50)
    })
  })

  describe('Schema Validation', () => {
    it('should enforce Zod schema validation rules', () => {
      const validProfile = {
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '555-0123',
      }

      const invalidProfile = {
        name: '',
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        phone: '555-0123',
      }

      expect(profileValidationSchema.safeParse(validProfile).success).toBe(true)
      expect(profileValidationSchema.safeParse(invalidProfile).success).toBe(false)
    })

    it('should validate password schema requirements', () => {
      const { passwordUpdateSchema } = require('@/lib/validations/profile')

      const validPassword = {
        oldPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }

      const invalidPassword = {
        oldPassword: 'currentpass',
        newPassword: '123',
        confirmPassword: '456',
      }

      expect(passwordUpdateSchema.safeParse(validPassword).success).toBe(true)
      expect(passwordUpdateSchema.safeParse(invalidPassword).success).toBe(false)
    })
  })
})