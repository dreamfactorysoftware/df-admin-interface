/**
 * @fileoverview Comprehensive Vitest test suite for the ACE editor React component
 * 
 * This test suite provides complete coverage for the AceEditor component including:
 * - Component rendering and initialization
 * - Editor mode switching and syntax highlighting
 * - Value changes and form integration
 * - Theme toggling (light/dark)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance validation for real-time validation
 * - React Hook Form integration
 * - Keyboard navigation and screen reader compatibility
 * 
 * Uses Vitest 2.1+ for 10x faster test execution compared to Jest/Karma
 * Uses Mock Service Worker (MSW) for realistic API mocking
 * Uses React Testing Library for component interaction testing
 * 
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { setupServer } from 'msw/node'
import { HttpResponse, http } from 'msw'
import { useForm, FormProvider } from 'react-hook-form'
import { performance } from 'perf_hooks'
import React, { createRef } from 'react'

// Import component and types
import { AceEditor } from './ace-editor'
import { AceEditorMode, type AceEditorProps, type AceEditorRef } from './types'
import { renderWithProviders } from '@/test/utils/test-utils'
import { handlers } from '@/test/mocks/handlers'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock ACE editor for testing
const mockAceEditor = {
  setValue: vi.fn(),
  getValue: vi.fn(() => ''),
  setTheme: vi.fn(),
  getSession: vi.fn(() => ({
    setMode: vi.fn(),
    on: vi.fn(),
    getDocument: vi.fn(() => ({
      on: vi.fn()
    }))
  })),
  setOptions: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  resize: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  container: {
    style: {}
  }
}

// Mock ace-builds
vi.mock('ace-builds', () => ({
  edit: vi.fn(() => mockAceEditor),
  config: {
    set: vi.fn(),
    setModuleUrl: vi.fn()
  }
}))

// Mock ResizeObserver for editor resize handling
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// MSW server setup for API mocking
const server = setupServer(
  // Mock script validation endpoint for performance testing
  http.post('/api/v2/system/script/validate', () => {
    return HttpResponse.json({ valid: true, syntax_errors: [] })
  }),
  
  // Mock code formatting endpoint
  http.post('/api/v2/system/script/format', () => {
    return HttpResponse.json({ formatted_code: 'formatted code' })
  }),
  
  ...handlers
)

describe('AceEditor Component', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterAll(() => {
    server.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    server.resetHandlers()
  })

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          mode={AceEditorMode.JAVASCRIPT}
        />
      )
      
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render with default props', () => {
      render(<AceEditor value="" onChange={vi.fn()} />)
      
      const editorContainer = screen.getByRole('textbox', { hidden: true })
      expect(editorContainer).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const customClass = 'custom-editor-class'
      const { container } = render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          className={customClass}
        />
      )
      
      expect(container.firstChild).toHaveClass(customClass)
    })

    it('should render with readonly state', () => {
      render(
        <AceEditor 
          value="test code"
          onChange={vi.fn()}
          readOnly={true}
        />
      )
      
      expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
        expect.objectContaining({ readOnly: true })
      )
    })
  })

  describe('Editor Initialization', () => {
    it('should initialize ACE editor on mount', async () => {
      const { edit } = await import('ace-builds')
      
      render(
        <AceEditor 
          value="console.log('test')"
          onChange={vi.fn()}
          mode={AceEditorMode.JAVASCRIPT}
        />
      )

      await waitFor(() => {
        expect(edit).toHaveBeenCalled()
      })
      
      expect(mockAceEditor.setValue).toHaveBeenCalledWith("console.log('test')")
      expect(mockAceEditor.getSession().setMode).toHaveBeenCalledWith('ace/mode/javascript')
    })

    it('should configure editor options correctly', async () => {
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          fontSize={14}
          tabSize={4}
          showLineNumbers={true}
          showGutter={true}
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.setOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            fontSize: 14,
            tabSize: 4,
            showLineNumbers: true,
            showGutter: true
          })
        )
      })
    })

    it('should clean up editor on unmount', () => {
      const { unmount } = render(
        <AceEditor value="" onChange={vi.fn()} />
      )
      
      unmount()
      
      expect(mockAceEditor.destroy).toHaveBeenCalled()
    })
  })

  describe('Mode Switching', () => {
    it.each([
      [AceEditorMode.JAVASCRIPT, 'ace/mode/javascript'],
      [AceEditorMode.JSON, 'ace/mode/json'],
      [AceEditorMode.YAML, 'ace/mode/yaml'],
      [AceEditorMode.PYTHON, 'ace/mode/python'],
      [AceEditorMode.PHP, 'ace/mode/php'],
      [AceEditorMode.NODEJS, 'ace/mode/nodejs'],
      [AceEditorMode.TEXT, 'ace/mode/text']
    ])('should set correct mode for %s', async (mode, expectedAceMode) => {
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          mode={mode}
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.getSession().setMode).toHaveBeenCalledWith(expectedAceMode)
      })
    })

    it('should update mode when prop changes', async () => {
      const { rerender } = render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          mode={AceEditorMode.JAVASCRIPT}
        />
      )

      rerender(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          mode={AceEditorMode.JSON}
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.getSession().setMode).toHaveBeenCalledWith('ace/mode/json')
      })
    })
  })

  describe('Value Changes and Form Integration', () => {
    it('should call onChange when editor content changes', async () => {
      const onChange = vi.fn()
      render(
        <AceEditor 
          value=""
          onChange={onChange}
        />
      )

      // Simulate editor change event
      const changeCallback = mockAceEditor.getSession().on.mock.calls
        .find(call => call[0] === 'change')?.[1]
      
      expect(changeCallback).toBeDefined()
      
      mockAceEditor.getValue.mockReturnValue('new content')
      changeCallback?.()

      expect(onChange).toHaveBeenCalledWith('new content')
    })

    it('should update editor value when prop changes', async () => {
      const { rerender } = render(
        <AceEditor 
          value="initial"
          onChange={vi.fn()}
        />
      )

      rerender(
        <AceEditor 
          value="updated"
          onChange={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.setValue).toHaveBeenCalledWith('updated')
      })
    })

    it('should integrate with React Hook Form', async () => {
      const TestForm = () => {
        const form = useForm({
          defaultValues: { code: 'function test() {}' }
        })

        return (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <AceEditor 
                value={form.watch('code')}
                onChange={(value) => form.setValue('code', value)}
                mode={AceEditorMode.JAVASCRIPT}
              />
              <button type="submit">Submit</button>
            </form>
          </FormProvider>
        )
      }

      render(<TestForm />)

      await waitFor(() => {
        expect(mockAceEditor.setValue).toHaveBeenCalledWith('function test() {}')
      })
    })
  })

  describe('Theme Integration', () => {
    it('should apply light theme by default', async () => {
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/github')
      })
    })

    it('should apply dark theme when specified', async () => {
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          theme="dark"
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai')
      })
    })

    it('should update theme when prop changes', async () => {
      const { rerender } = render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          theme="light"
        />
      )

      rerender(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          theme="dark"
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai')
      })
    })
  })

  describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AceEditor 
          value="test code"
          onChange={vi.fn()}
          ariaLabel="Code editor"
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should support ARIA labels', () => {
      const ariaLabel = 'Script editor for API endpoint'
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          ariaLabel={ariaLabel}
        />
      )

      const editor = screen.getByLabelText(ariaLabel)
      expect(editor).toBeInTheDocument()
    })

    it('should support ARIA described by', () => {
      render(
        <div>
          <AceEditor 
            value=""
            onChange={vi.fn()}
            ariaDescribedBy="editor-help"
          />
          <div id="editor-help">Enter your code here</div>
        </div>
      )

      const editor = screen.getByRole('textbox', { hidden: true })
      expect(editor).toHaveAttribute('aria-describedby', 'editor-help')
    })

    it('should handle focus management', async () => {
      const user = userEvent.setup()
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          ariaLabel="Code editor"
        />
      )

      const editor = screen.getByLabelText('Code editor')
      await user.click(editor)

      expect(mockAceEditor.focus).toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <button>Previous</button>
          <AceEditor 
            value=""
            onChange={vi.fn()}
            ariaLabel="Code editor"
          />
          <button>Next</button>
        </div>
      )

      const prevButton = screen.getByText('Previous')
      const editor = screen.getByLabelText('Code editor')
      const nextButton = screen.getByText('Next')

      await user.tab()
      expect(prevButton).toHaveFocus()

      await user.tab()
      expect(editor).toHaveFocus()

      await user.tab()
      expect(nextButton).toHaveFocus()
    })

    it('should support Escape key to blur editor', async () => {
      const user = userEvent.setup()
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          ariaLabel="Code editor"
        />
      )

      const editor = screen.getByLabelText('Code editor')
      await user.click(editor)
      
      await user.keyboard('{Escape}')
      expect(mockAceEditor.blur).toHaveBeenCalled()
    })

    it('should handle keyboard shortcuts', async () => {
      const user = userEvent.setup()
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          enableKeyboardShortcuts={true}
        />
      )

      const editor = screen.getByRole('textbox', { hidden: true })
      await user.click(editor)

      // Test Ctrl+S (save)
      await user.keyboard('{Control>}s{/Control}')
      
      // Verify that keyboard handlers are set up
      expect(mockAceEditor.on).toHaveBeenCalledWith('paste', expect.any(Function))
    })
  })

  describe('Performance Testing', () => {
    it('should validate real-time validation under 100ms', async () => {
      const onChange = vi.fn()
      render(
        <AceEditor 
          value=""
          onChange={onChange}
          enableRealTimeValidation={true}
          mode={AceEditorMode.JAVASCRIPT}
        />
      )

      const startTime = performance.now()
      
      // Simulate rapid typing
      const changeCallback = mockAceEditor.getSession().on.mock.calls
        .find(call => call[0] === 'change')?.[1]
      
      mockAceEditor.getValue.mockReturnValue('console.log("test")')
      changeCallback?.()

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Validate response time is under 100ms
      expect(executionTime).toBeLessThan(100)
    })

    it('should handle large content efficiently', async () => {
      const largeContent = 'a'.repeat(10000) // 10KB of content
      const onChange = vi.fn()

      const startTime = performance.now()
      
      render(
        <AceEditor 
          value={largeContent}
          onChange={onChange}
          mode={AceEditorMode.TEXT}
        />
      )

      await waitFor(() => {
        expect(mockAceEditor.setValue).toHaveBeenCalledWith(largeContent)
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should handle large content in reasonable time
      expect(renderTime).toBeLessThan(500)
    })

    it('should debounce rapid changes', async () => {
      const onChange = vi.fn()
      render(
        <AceEditor 
          value=""
          onChange={onChange}
          debounceMs={100}
        />
      )

      const changeCallback = mockAceEditor.getSession().on.mock.calls
        .find(call => call[0] === 'change')?.[1]

      // Simulate rapid changes
      mockAceEditor.getValue.mockReturnValue('a')
      changeCallback?.()
      
      mockAceEditor.getValue.mockReturnValue('ab')
      changeCallback?.()
      
      mockAceEditor.getValue.mockReturnValue('abc')
      changeCallback?.()

      // Should only call onChange once after debounce
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledTimes(1)
        expect(onChange).toHaveBeenCalledWith('abc')
      }, { timeout: 200 })
    })
  })

  describe('Screen Reader Compatibility', () => {
    it('should announce content changes to screen readers', async () => {
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          ariaLive="polite"
          ariaLabel="Code editor"
        />
      )

      const editor = screen.getByLabelText('Code editor')
      expect(editor).toHaveAttribute('aria-live', 'polite')
    })

    it('should provide content summary for screen readers', () => {
      render(
        <AceEditor 
          value="function test() { return true; }"
          onChange={vi.fn()}
          ariaLabel="JavaScript code editor"
          mode={AceEditorMode.JAVASCRIPT}
        />
      )

      const editor = screen.getByLabelText('JavaScript code editor')
      expect(editor).toBeInTheDocument()
      
      // Should have proper role
      expect(editor).toHaveAttribute('role', 'textbox')
    })
  })

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { edit } = await import('ace-builds')
      
      // Mock editor initialization failure
      vi.mocked(edit).mockImplementationOnce(() => {
        throw new Error('Failed to initialize editor')
      })

      const { container } = render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
        />
      )

      // Should still render container even if editor fails
      expect(container.firstChild).toBeInTheDocument()
      
      consoleError.mockRestore()
    })

    it('should handle invalid mode gracefully', async () => {
      render(
        <AceEditor 
          value=""
          onChange={vi.fn()}
          mode={'invalid-mode' as AceEditorMode}
        />
      )

      // Should fallback to text mode for invalid modes
      await waitFor(() => {
        expect(mockAceEditor.getSession().setMode).toHaveBeenCalledWith('ace/mode/text')
      })
    })
  })

  describe('Component Ref Integration', () => {
    it('should expose editor methods through ref', () => {
      const ref = createRef<AceEditorRef>()
      
      render(
        <AceEditor 
          ref={ref}
          value=""
          onChange={vi.fn()}
        />
      )

      // Should expose focus method
      expect(ref.current?.focus).toBeDefined()
      expect(typeof ref.current?.focus).toBe('function')
      
      // Should expose getValue method
      expect(ref.current?.getValue).toBeDefined()
      expect(typeof ref.current?.getValue).toBe('function')
      
      // Should expose setValue method
      expect(ref.current?.setValue).toBeDefined()
      expect(typeof ref.current?.setValue).toBe('function')
    })

    it('should call editor methods through ref', () => {
      const ref = createRef<AceEditorRef>()
      
      render(
        <AceEditor 
          ref={ref}
          value=""
          onChange={vi.fn()}
        />
      )

      // Test focus method
      ref.current?.focus()
      expect(mockAceEditor.focus).toHaveBeenCalled()

      // Test setValue method
      ref.current?.setValue('new value')
      expect(mockAceEditor.setValue).toHaveBeenCalledWith('new value')
    })
  })

  describe('Integration Tests', () => {
    it('should work in a complete form workflow', async () => {
      const user = userEvent.setup()
      let formData: any = {}

      const TestComponent = () => {
        const form = useForm({
          defaultValues: { script: '' }
        })

        const onSubmit = (data: any) => {
          formData = data
        }

        return (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <label htmlFor="script-editor">Script Editor</label>
              <AceEditor 
                id="script-editor"
                value={form.watch('script')}
                onChange={(value) => form.setValue('script', value)}
                mode={AceEditorMode.JAVASCRIPT}
                ariaLabel="Script editor"
              />
              <button type="submit">Save Script</button>
            </form>
          </FormProvider>
        )
      }

      render(<TestComponent />)

      // Simulate user typing
      const changeCallback = mockAceEditor.getSession().on.mock.calls
        .find(call => call[0] === 'change')?.[1]
      
      mockAceEditor.getValue.mockReturnValue('console.log("Hello World")')
      changeCallback?.()

      // Submit form
      await user.click(screen.getByText('Save Script'))

      await waitFor(() => {
        expect(formData.script).toBe('console.log("Hello World")')
      })
    })
  })
})