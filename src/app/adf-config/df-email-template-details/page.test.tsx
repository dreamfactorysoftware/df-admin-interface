/**
 * Comprehensive Vitest test suite for the email template details page component.
 * Tests both create and edit workflows with React Testing Library and MSW integration.
 * 
 * @file page.test.tsx
 * @description Replaces Angular/Jest tests with modern React testing patterns including
 * user event simulation, accessibility testing, and realistic API mocking for complete
 * test coverage of email template management workflows.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { server } from '@/test/mocks/server'
import { rest } from 'msw'
import { EmailTemplateDetailsPage } from './page'
import { EmailTemplateForm } from './email-template-form'
import { useEmailTemplate } from './use-email-template'
import { renderWithProviders } from '@/test/utils/test-utils'
import { createMockEmailTemplate, createMockEmailTemplatePayload } from '@/test/utils/component-factories'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock Next.js navigation
const mockPush = vi.fn()
const mockBack = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: undefined }),
}))

// Mock react-hook-form for form testing
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useForm: vi.fn(),
  }
})

// Mock custom hook
vi.mock('./use-email-template', () => ({
  useEmailTemplate: vi.fn(),
}))

const mockUseEmailTemplate = useEmailTemplate as MockedFunction<typeof useEmailTemplate>

/**
 * Test suite for EmailTemplateDetailsPage component - Create workflow
 * Tests form initialization, validation, submission, and error handling for new templates
 */
describe('EmailTemplateDetailsPage - Create Workflow', () => {
  const user = userEvent.setup()
  
  const defaultHookReturn = {
    emailTemplate: undefined,
    isLoading: false,
    isError: false,
    error: null,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    isCreating: false,
    isUpdating: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEmailTemplate.mockReturnValue(defaultHookReturn)
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should render create form with initial empty state', () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /recipient/i })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /subject/i })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /body/i })).toHaveValue('')
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should display proper form validation for required fields', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const nameInput = screen.getByRole('textbox', { name: /template name/i })
    const saveButton = screen.getByRole('button', { name: /save/i })
    
    // Try to submit without required field
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText(/template name is required/i)).toBeInTheDocument()
    })
    
    // Fill required field and verify validation passes
    await user.type(nameInput, 'Test Template')
    
    await waitFor(() => {
      expect(screen.queryByText(/template name is required/i)).not.toBeInTheDocument()
    })
  })

  it('should validate email format for sender and reply-to fields', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const senderEmailInput = screen.getByRole('textbox', { name: /sender email/i })
    const replyToEmailInput = screen.getByRole('textbox', { name: /reply-to email/i })
    
    // Test invalid email format
    await user.type(senderEmailInput, 'invalid-email')
    await user.type(replyToEmailInput, 'also-invalid')
    await user.tab()
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
    })
    
    // Test valid email format
    await user.clear(senderEmailInput)
    await user.clear(replyToEmailInput)
    await user.type(senderEmailInput, 'sender@example.com')
    await user.type(replyToEmailInput, 'reply@example.com')
    
    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument()
    })
  })

  it('should call createTemplate when form is submitted with valid data', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 1 })
    mockUseEmailTemplate.mockReturnValue({
      ...defaultHookReturn,
      createTemplate: mockCreate,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Fill form with valid data
    await user.type(screen.getByRole('textbox', { name: /template name/i }), 'Test Template')
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Test Description')
    await user.type(screen.getByRole('textbox', { name: /recipient/i }), 'test@example.com')
    await user.type(screen.getByRole('textbox', { name: /subject/i }), 'Test Subject')
    await user.type(screen.getByRole('textbox', { name: /body/i }), '<p>Test HTML Body</p>')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test Template',
        description: 'Test Description',
        to: 'test@example.com',
        subject: 'Test Subject',
        bodyHtml: '<p>Test HTML Body</p>',
        cc: '',
        bcc: '',
        attachment: '',
        fromName: '',
        fromEmail: '',
        replyToName: '',
        replyToEmail: '',
      })
    })
  })

  it('should prevent submission when form is invalid', async () => {
    const mockCreate = vi.fn()
    mockUseEmailTemplate.mockReturnValue({
      ...defaultHookReturn,
      createTemplate: mockCreate,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Try to submit without required fields
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    // Should not call create function
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('should navigate back when cancel button is clicked', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    expect(mockBack).toHaveBeenCalled()
  })

  it('should display loading state during creation', () => {
    mockUseEmailTemplate.mockReturnValue({
      ...defaultHookReturn,
      isCreating: true,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('button', { name: /creating\.\.\./i })).toBeDisabled()
  })

  it('should display error message when creation fails', async () => {
    const errorMessage = 'Failed to create email template'
    mockUseEmailTemplate.mockReturnValue({
      ...defaultHookReturn,
      isError: true,
      error: new Error(errorMessage),
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
  })

  it('should meet accessibility standards', async () => {
    const { container } = renderWithProviders(<EmailTemplateDetailsPage />)
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should support keyboard navigation', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const nameInput = screen.getByRole('textbox', { name: /template name/i })
    const descriptionInput = screen.getByRole('textbox', { name: /description/i })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    
    // Test tab navigation
    nameInput.focus()
    expect(nameInput).toHaveFocus()
    
    await user.tab()
    expect(descriptionInput).toHaveFocus()
    
    // Navigate to buttons
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    await user.tab()
    expect(cancelButton).toHaveFocus()
  })
})

/**
 * Test suite for EmailTemplateDetailsPage component - Edit workflow
 * Tests form initialization with existing data, updates, and edit-specific behaviors
 */
describe('EmailTemplateDetailsPage - Edit Workflow', () => {
  const user = userEvent.setup()
  const mockTemplate = createMockEmailTemplate({
    id: 1,
    name: 'Existing Template',
    description: 'Existing Description',
    to: 'existing@example.com',
    subject: 'Existing Subject',
    bodyHtml: '<p>Existing HTML Body</p>',
    fromName: 'Existing Sender',
    fromEmail: 'sender@example.com',
  })

  const editHookReturn = {
    emailTemplate: mockTemplate,
    isLoading: false,
    isError: false,
    error: null,
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    isCreating: false,
    isUpdating: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock useParams to return an ID for edit mode
    vi.mocked(vi.importActual('next/navigation')).useParams = vi.fn(() => ({ id: '1' }))
    mockUseEmailTemplate.mockReturnValue(editHookReturn)
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should render edit form with existing template data', () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Existing Template')
    expect(screen.getByRole('textbox', { name: /description/i })).toHaveValue('Existing Description')
    expect(screen.getByRole('textbox', { name: /recipient/i })).toHaveValue('existing@example.com')
    expect(screen.getByRole('textbox', { name: /subject/i })).toHaveValue('Existing Subject')
    expect(screen.getByRole('textbox', { name: /body/i })).toHaveValue('<p>Existing HTML Body</p>')
    expect(screen.getByRole('textbox', { name: /sender name/i })).toHaveValue('Existing Sender')
    expect(screen.getByRole('textbox', { name: /sender email/i })).toHaveValue('sender@example.com')
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  it('should call updateTemplate when form is submitted with changes', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ id: 1 })
    mockUseEmailTemplate.mockReturnValue({
      ...editHookReturn,
      updateTemplate: mockUpdate,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Modify the template name
    const nameInput = screen.getByRole('textbox', { name: /template name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Template Name')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /update/i }))
    
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(1, {
        name: 'Updated Template Name',
        description: 'Existing Description',
        to: 'existing@example.com',
        subject: 'Existing Subject',
        bodyHtml: '<p>Existing HTML Body</p>',
        cc: '',
        bcc: '',
        attachment: '',
        fromName: 'Existing Sender',
        fromEmail: 'sender@example.com',
        replyToName: '',
        replyToEmail: '',
      })
    })
  })

  it('should display loading state during update', () => {
    mockUseEmailTemplate.mockReturnValue({
      ...editHookReturn,
      isUpdating: true,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('button', { name: /updating\.\.\./i })).toBeDisabled()
  })

  it('should display error message when update fails', () => {
    const errorMessage = 'Failed to update email template'
    mockUseEmailTemplate.mockReturnValue({
      ...editHookReturn,
      isError: true,
      error: new Error(errorMessage),
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
  })

  it('should display loading state while fetching template data', () => {
    mockUseEmailTemplate.mockReturnValue({
      ...editHookReturn,
      emailTemplate: undefined,
      isLoading: true,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByText(/loading template data\.\.\./i)).toBeInTheDocument()
  })
})

/**
 * Test suite for responsive design and theme functionality
 * Tests dark mode, responsive breakpoints, and mobile accessibility
 */
describe('EmailTemplateDetailsPage - Responsive and Theme Testing', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEmailTemplate.mockReturnValue({
      emailTemplate: undefined,
      isLoading: false,
      isError: false,
      error: null,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      isCreating: false,
      isUpdating: false,
    })
  })

  it('should apply dark mode styles when theme is dark', () => {
    // Mock theme context to return dark mode
    const DarkThemeWrapper = ({ children }: { children: React.ReactNode }) => (
      <div className="dark">{children}</div>
    )
    
    render(
      <DarkThemeWrapper>
        <EmailTemplateDetailsPage />
      </DarkThemeWrapper>
    )
    
    const container = screen.getByTestId('email-template-container')
    expect(container).toHaveClass('dark:bg-gray-900')
  })

  it('should handle mobile viewport correctly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveClass('flex-col', 'space-y-4')
  })

  it('should maintain form usability on tablet viewport', () => {
    // Mock tablet viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const form = screen.getByRole('form')
    expect(form).toHaveClass('md:grid-cols-2')
  })

  it('should handle text area auto-resize', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const bodyTextarea = screen.getByRole('textbox', { name: /body/i })
    
    // Type a long text to test auto-resize
    const longText = 'This is a very long email body content that should cause the textarea to expand. '.repeat(10)
    await user.type(bodyTextarea, longText)
    
    expect(bodyTextarea).toHaveValue(longText)
    // Verify textarea has grown (min-height increases)
    expect(bodyTextarea).toHaveStyle('min-height: 120px')
  })
})

/**
 * Test suite for error boundary and network error handling
 * Tests API error scenarios, network failures, and error recovery
 */
describe('EmailTemplateDetailsPage - Error Handling', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('should handle API validation errors gracefully', async () => {
    // Mock API to return validation errors
    server.use(
      rest.post('/api/v2/system/email_template', (req, res, ctx) => {
        return res(
          ctx.status(422),
          ctx.json({
            error: {
              code: 422,
              message: 'Validation failed',
              context: {
                resource: [{
                  message: 'The name field is required.',
                  details: [{ name: ['The name field is required.'] }]
                }]
              }
            }
          })
        )
      })
    )

    const mockCreate = vi.fn().mockRejectedValue(new Error('Validation failed'))
    mockUseEmailTemplate.mockReturnValue({
      emailTemplate: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Validation failed'),
      createTemplate: mockCreate,
      updateTemplate: vi.fn(),
      isCreating: false,
      isUpdating: false,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed')
  })

  it('should handle network timeout errors', async () => {
    server.use(
      rest.post('/api/v2/system/email_template', (req, res, ctx) => {
        return res.networkError('Network timeout')
      })
    )

    const mockCreate = vi.fn().mockRejectedValue(new Error('Network timeout'))
    mockUseEmailTemplate.mockReturnValue({
      emailTemplate: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network timeout'),
      createTemplate: mockCreate,
      updateTemplate: vi.fn(),
      isCreating: false,
      isUpdating: false,
    })
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('alert')).toHaveTextContent('Network timeout')
  })

  it('should provide retry functionality after error', async () => {
    const mockCreate = vi.fn()
    let hasError = true
    
    mockUseEmailTemplate.mockImplementation(() => ({
      emailTemplate: undefined,
      isLoading: false,
      isError: hasError,
      error: hasError ? new Error('Temporary error') : null,
      createTemplate: mockCreate,
      updateTemplate: vi.fn(),
      isCreating: false,
      isUpdating: false,
    }))
    
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    expect(screen.getByRole('alert')).toHaveTextContent('Temporary error')
    
    const retryButton = screen.getByRole('button', { name: /retry/i })
    
    // Simulate successful retry
    hasError = false
    await user.click(retryButton)
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

/**
 * Test suite for performance and optimization
 * Tests form debouncing, validation performance, and memory management
 */
describe('EmailTemplateDetailsPage - Performance Testing', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEmailTemplate.mockReturnValue({
      emailTemplate: undefined,
      isLoading: false,
      isError: false,
      error: null,
      createTemplate: vi.fn(),
      updateTemplate: vi.fn(),
      isCreating: false,
      isUpdating: false,
    })
  })

  it('should debounce validation to avoid excessive re-renders', async () => {
    const { container } = renderWithProviders(<EmailTemplateDetailsPage />)
    
    const nameInput = screen.getByRole('textbox', { name: /template name/i })
    
    // Type rapidly to test debouncing
    await user.type(nameInput, 'Test')
    
    // Verify only final state is rendered
    expect(nameInput).toHaveValue('Test')
    
    // Check for performance markers
    const performanceEntries = performance.getEntriesByType('measure')
    expect(performanceEntries.length).toBeGreaterThan(0)
  })

  it('should handle large form data efficiently', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const bodyTextarea = screen.getByRole('textbox', { name: /body/i })
    
    // Create large HTML content
    const largeContent = '<div>' + 'Large content '.repeat(1000) + '</div>'
    
    const startTime = performance.now()
    await user.type(bodyTextarea, largeContent)
    const endTime = performance.now()
    
    expect(bodyTextarea).toHaveValue(largeContent)
    // Verify performance is acceptable (under 100ms for large content)
    expect(endTime - startTime).toBeLessThan(100)
  })

  it('should properly cleanup resources on unmount', () => {
    const { unmount } = renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Verify no memory leaks after unmount
    unmount()
    
    // Check that event listeners are cleaned up
    expect(document.querySelectorAll('[data-testid="email-template-container"]')).toHaveLength(0)
  })
})

/**
 * Test suite for user experience and interaction testing
 * Tests realistic user workflows, form interactions, and edge cases
 */
describe('EmailTemplateDetailsPage - User Experience Testing', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEmailTemplate.mockReturnValue({
      emailTemplate: undefined,
      isLoading: false,
      isError: false,
      error: null,
      createTemplate: vi.fn().mockResolvedValue({ id: 1 }),
      updateTemplate: vi.fn(),
      isCreating: false,
      isUpdating: false,
    })
  })

  it('should complete full create workflow successfully', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Fill out complete form
    await user.type(screen.getByRole('textbox', { name: /template name/i }), 'Welcome Email')
    await user.type(screen.getByRole('textbox', { name: /description/i }), 'Welcome new users')
    await user.type(screen.getByRole('textbox', { name: /recipient/i }), '{user_email}')
    await user.type(screen.getByRole('textbox', { name: /cc/i }), 'admin@example.com')
    await user.type(screen.getByRole('textbox', { name: /subject/i }), 'Welcome to DreamFactory!')
    await user.type(screen.getByRole('textbox', { name: /body/i }), '<h1>Welcome!</h1><p>Thanks for joining us.</p>')
    await user.type(screen.getByRole('textbox', { name: /sender name/i }), 'DreamFactory Team')
    await user.type(screen.getByRole('textbox', { name: /sender email/i }), 'noreply@dreamfactory.com')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    // Verify success flow
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/system-settings/email-templates')
    })
  })

  it('should handle unsaved changes warning', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Make changes to form
    await user.type(screen.getByRole('textbox', { name: /template name/i }), 'Modified Template')
    
    // Try to navigate away
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    
    // Should show confirmation dialog
    expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /discard changes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue editing/i })).toBeInTheDocument()
  })

  it('should provide helpful tooltips and guidance', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    // Hover over help icon for body field
    const helpIcon = screen.getByLabelText(/html body help/i)
    await user.hover(helpIcon)
    
    await waitFor(() => {
      expect(screen.getByText(/you can use html tags and template variables/i)).toBeInTheDocument()
    })
  })

  it('should support template variable suggestions', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const bodyTextarea = screen.getByRole('textbox', { name: /body/i })
    
    // Type opening brace to trigger suggestions
    await user.type(bodyTextarea, 'Hello {')
    
    await waitFor(() => {
      expect(screen.getByText(/user_email/i)).toBeInTheDocument()
      expect(screen.getByText(/user_name/i)).toBeInTheDocument()
      expect(screen.getByText(/app_name/i)).toBeInTheDocument()
    })
  })

  it('should validate HTML content in body field', async () => {
    renderWithProviders(<EmailTemplateDetailsPage />)
    
    const bodyTextarea = screen.getByRole('textbox', { name: /body/i })
    
    // Type invalid HTML
    await user.type(bodyTextarea, '<div><p>Unclosed tags')
    
    await waitFor(() => {
      expect(screen.getByText(/html syntax error/i)).toBeInTheDocument()
    })
    
    // Fix HTML
    await user.type(bodyTextarea, '</p></div>')
    
    await waitFor(() => {
      expect(screen.queryByText(/html syntax error/i)).not.toBeInTheDocument()
    })
  })
})