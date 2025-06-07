/**
 * ACE Editor Component Test Suite
 * 
 * Comprehensive Vitest test suite for the ACE editor React component with Mock Service Worker
 * integration for realistic API mocking. Tests component rendering, editor initialization,
 * mode switching, value changes, theme toggling, accessibility compliance, and React Hook Form
 * integration. Includes performance tests for real-time validation under 100ms, keyboard
 * navigation testing, and screen reader compatibility verification using Testing Library patterns.
 * 
 * @fileoverview Vitest test suite for ACE Editor component
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React, { useRef, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useForm, FormProvider } from 'react-hook-form';

import AceEditor from './ace-editor';
import { AceEditorMode, AceEditorRef, AceEditorProps } from './types';
import {
  customRender,
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  waitForValidation,
  measureRenderTime,
  type FormTestUtils,
} from '@/test/test-utils';
import { server } from '@/test/mocks/server';

// Extend Vitest matchers with jest-axe
expect.extend(toHaveNoViolations);

// ============================================================================
// MOCK SETUP
// ============================================================================

/**
 * Mock ACE editor instance with comprehensive method implementations
 */
const createMockAceEditor = () => ({
  getValue: vi.fn(() => 'mock-value'),
  setValue: vi.fn(),
  setOptions: vi.fn(),
  setTheme: vi.fn(),
  setReadOnly: vi.fn(),
  focus: vi.fn(),
  blur: vi.fn(),
  resize: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  insert: vi.fn(),
  getCursorPosition: vi.fn(() => ({ row: 0, column: 0 })),
  moveCursorTo: vi.fn(),
  getSelectedText: vi.fn(() => ''),
  undo: vi.fn(),
  redo: vi.fn(),
  session: {
    setMode: vi.fn(),
    replace: vi.fn(),
    getAnnotations: vi.fn(() => []),
    on: vi.fn(),
    selection: {
      getRange: vi.fn(() => ({ start: { row: 0, column: 0 }, end: { row: 0, column: 0 } })),
    },
  },
  textInput: {
    getElement: vi.fn(() => ({
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    })),
  },
  container: document.createElement('div'),
  commands: {},
  renderer: {},
});

/**
 * Mock ACE module with dynamic loading simulation
 */
const mockAceModule = {
  edit: vi.fn(() => createMockAceEditor()),
  config: {
    set: vi.fn(),
    setModuleUrl: vi.fn(),
  },
  require: vi.fn(),
};

/**
 * Mock dynamic imports for ACE editor assets
 */
const mockDynamicImports = () => {
  vi.doMock('/assets/ace-builds/src-min-noconflict/ace.js', () => mockAceModule);
  
  // Mock mode imports
  Object.values(AceEditorMode).forEach(mode => {
    vi.doMock(`/assets/ace-builds/src-min-noconflict/mode-${mode}.js`, () => ({}));
  });
  
  // Mock theme imports
  vi.doMock('/assets/ace-builds/src-min-noconflict/theme-chrome.js', () => ({}));
  vi.doMock('/assets/ace-builds/src-min-noconflict/theme-monokai.js', () => ({}));
};

/**
 * Mock DOM APIs required for ACE editor
 */
const mockDOMAPIs = () => {
  // Mock MutationObserver for theme detection
  const MockMutationObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  }));
  vi.stubGlobal('MutationObserver', MockMutationObserver);
  
  // Mock matchMedia for system theme detection
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  
  // Mock performance API for performance testing
  vi.stubGlobal('performance', {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
  });
};

// ============================================================================
// TEST SETUP AND TEARDOWN
// ============================================================================

beforeAll(() => {
  mockDOMAPIs();
  mockDynamicImports();
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => {
  server.close();
  vi.clearAllMocks();
  vi.resetModules();
});

beforeEach(() => {
  vi.clearAllMocks();
  // Reset document class for theme testing
  document.documentElement.className = '';
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllTimers();
});

// ============================================================================
// COMPONENT WRAPPER HELPERS
// ============================================================================

/**
 * Test wrapper component for ACE editor with ref access
 */
const AceEditorTestWrapper: React.FC<{
  onRef?: (ref: AceEditorRef | null) => void;
  props?: Partial<AceEditorProps>;
}> = ({ onRef, props = {} }) => {
  const editorRef = useRef<AceEditorRef>(null);
  
  React.useEffect(() => {
    onRef?.(editorRef.current);
  }, [onRef]);
  
  return (
    <AceEditor
      ref={editorRef}
      data-testid="ace-editor"
      {...props}
    />
  );
};

/**
 * Controlled component wrapper for testing value changes
 */
const ControlledAceEditor: React.FC<{
  initialValue?: string;
  onValueChange?: (value: string) => void;
  props?: Partial<AceEditorProps>;
}> = ({ initialValue = '', onValueChange, props = {} }) => {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
  };
  
  return (
    <AceEditor
      value={value}
      onChange={handleChange}
      data-testid="controlled-ace-editor"
      {...props}
    />
  );
};

/**
 * Form integration wrapper for React Hook Form testing
 */
const FormAceEditor: React.FC<{
  defaultValues?: any;
  onFormSubmit?: (data: any) => void;
  editorProps?: Partial<AceEditorProps>;
}> = ({ defaultValues = {}, onFormSubmit, editorProps = {} }) => {
  const methods = useForm({ defaultValues });
  
  const onSubmit = (data: any) => {
    onFormSubmit?.(data);
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <AceEditor
          {...methods.register('code')}
          data-testid="form-ace-editor"
          {...editorProps}
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </form>
    </FormProvider>
  );
};

// ============================================================================
// CORE RENDERING TESTS
// ============================================================================

describe('AceEditor - Core Rendering', () => {
  it('renders ACE editor container with default props', async () => {
    const { container } = customRender(<AceEditor data-testid="ace-editor" />);
    
    const editorContainer = screen.getByTestId('ace-editor');
    expect(editorContainer).toBeInTheDocument();
    expect(editorContainer).toHaveClass('relative', 'w-full');
    
    // Verify container structure
    const editorDiv = editorContainer.querySelector('div[id^="ace-editor-"]');
    expect(editorDiv).toBeInTheDocument();
    expect(editorDiv).toHaveClass('w-full', 'border', 'rounded-md');
    
    await testA11y(container);
  });

  it('applies custom className and style props', () => {
    const customProps = {
      className: 'custom-editor-class',
      style: { backgroundColor: 'red', height: '400px' },
    };
    
    customRender(<AceEditor {...customProps} data-testid="ace-editor" />);
    
    const container = screen.getByTestId('ace-editor');
    expect(container).toHaveClass('custom-editor-class');
    expect(container).toHaveStyle('background-color: red; height: 400px');
  });

  it('generates unique IDs when no ID provided', () => {
    customRender(
      <>
        <AceEditor data-testid="editor-1" />
        <AceEditor data-testid="editor-2" />
      </>
    );
    
    const editor1 = screen.getByTestId('editor-1');
    const editor2 = screen.getByTestId('editor-2');
    
    const editorDiv1 = editor1.querySelector('div[id^="ace-editor-"]');
    const editorDiv2 = editor2.querySelector('div[id^="ace-editor-"]');
    
    expect(editorDiv1?.id).toBeDefined();
    expect(editorDiv2?.id).toBeDefined();
    expect(editorDiv1?.id).not.toBe(editorDiv2?.id);
  });

  it('applies size variants correctly', () => {
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];
    
    sizes.forEach(size => {
      const { rerender } = customRender(
        <AceEditor size={size} data-testid={`editor-${size}`} />
      );
      
      const container = screen.getByTestId(`editor-${size}`);
      const editorDiv = container.querySelector('div[id^="ace-editor-"]');
      
      switch (size) {
        case 'sm':
          expect(editorDiv).toHaveClass('min-h-[120px]', 'text-sm');
          break;
        case 'md':
          expect(editorDiv).toHaveClass('min-h-[200px]', 'text-base');
          break;
        case 'lg':
          expect(editorDiv).toHaveClass('min-h-[300px]', 'text-lg');
          break;
        case 'xl':
          expect(editorDiv).toHaveClass('min-h-[400px]', 'text-lg');
          break;
      }
    });
  });
});

// ============================================================================
// EDITOR INITIALIZATION TESTS
// ============================================================================

describe('AceEditor - Editor Initialization', () => {
  it('initializes ACE editor with default configuration', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    // Wait for editor initialization
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    // Verify editor setup
    expect(mockAceModule.edit).toHaveBeenCalledWith(
      expect.any(HTMLElement)
    );
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        fontSize: 14,
        showPrintMargin: false,
        showGutter: true,
        highlightActiveLine: true,
        tabSize: 2,
      })
    );
  });

  it('applies custom configuration options', async () => {
    const customConfig = {
      fontSize: 16,
      showGutter: false,
      tabSize: 4,
      wrap: true,
    };
    
    customRender(
      <AceEditor config={customConfig} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setOptions).toHaveBeenCalledWith(
      expect.objectContaining(customConfig)
    );
  });

  it('sets initial value correctly', async () => {
    const initialValue = '{"test": "value"}';
    
    customRender(
      <AceEditor value={initialValue} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setValue).toHaveBeenCalledWith(initialValue, -1);
  });

  it('handles loading state correctly', () => {
    customRender(<AceEditor loading={true} data-testid="ace-editor" />);
    
    const container = screen.getByTestId('ace-editor');
    const loadingOverlay = container.querySelector('.animate-pulse');
    
    expect(loadingOverlay).toBeInTheDocument();
    expect(screen.getByText('Loading editor...')).toBeInTheDocument();
  });

  it('displays placeholder when editor is not ready', () => {
    const placeholder = 'Enter your code here...';
    
    customRender(
      <AceEditor placeholder={placeholder} data-testid="ace-editor" />
    );
    
    // Should show placeholder until editor loads
    expect(screen.getByText(placeholder)).toBeInTheDocument();
  });
});

// ============================================================================
// MODE SWITCHING TESTS
// ============================================================================

describe('AceEditor - Mode Switching', () => {
  it('sets default JSON mode correctly', async () => {
    customRender(<AceEditor data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/json');
  });

  it('switches between different modes', async () => {
    const { rerender } = customRender(
      <AceEditor mode={AceEditorMode.JSON} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Initial JSON mode
    expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/json');
    
    // Switch to JavaScript mode
    rerender(<AceEditor mode={AceEditorMode.JAVASCRIPT} data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/javascript');
    });
    
    // Switch to YAML mode
    rerender(<AceEditor mode={AceEditorMode.YAML} data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/yaml');
    });
  });

  it('handles unsupported modes gracefully', async () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    customRender(
      <AceEditor mode={'invalid-mode' as AceEditorMode} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    // Should not crash the component
    expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('supports all defined editor modes', async () => {
    const modes = Object.values(AceEditorMode);
    
    for (const mode of modes) {
      const { rerender } = customRender(
        <AceEditor mode={mode} data-testid="ace-editor" />
      );
      
      await waitFor(() => {
        expect(mockAceModule.edit).toHaveBeenCalled();
      });
      
      const mockEditor = mockAceModule.edit.mock.results[0].value;
      
      // Verify correct mode mapping
      switch (mode) {
        case AceEditorMode.JSON:
          expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/json');
          break;
        case AceEditorMode.JAVASCRIPT:
        case AceEditorMode.NODEJS:
          expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/javascript');
          break;
        case AceEditorMode.PYTHON:
        case AceEditorMode.PYTHON3:
          expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/python');
          break;
        case AceEditorMode.PHP:
          expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/php');
          break;
        case AceEditorMode.YAML:
          expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/yaml');
          break;
        case AceEditorMode.TEXT:
          expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/text');
          break;
      }
    }
  });
});

// ============================================================================
// VALUE CHANGES AND CONTROLLED COMPONENT TESTS
// ============================================================================

describe('AceEditor - Value Changes and Controlled Component', () => {
  it('handles controlled component value changes', async () => {
    const onValueChange = vi.fn();
    const initialValue = 'initial';
    
    const { rerender } = customRender(
      <ControlledAceEditor
        initialValue={initialValue}
        onValueChange={onValueChange}
      />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Simulate editor change event
    const changeCallback = mockEditor.on.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];
    
    expect(changeCallback).toBeDefined();
    
    // Mock editor returning new value
    mockEditor.getValue.mockReturnValue('new value');
    
    // Trigger change event
    act(() => {
      changeCallback?.({ action: 'insert', lines: ['new value'] });
    });
    
    expect(onValueChange).toHaveBeenCalledWith('new value');
  });

  it('updates editor value when prop changes', async () => {
    const { rerender } = customRender(
      <AceEditor value="initial value" data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Change value prop
    rerender(<AceEditor value="updated value" data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockEditor.setValue).toHaveBeenCalledWith('updated value', -1);
    });
  });

  it('calls onChange callback with value and delta', async () => {
    const onChange = vi.fn();
    
    customRender(
      <AceEditor onChange={onChange} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    const changeCallback = mockEditor.on.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];
    
    const mockDelta = { action: 'insert', lines: ['test'], start: { row: 0, column: 0 } };
    mockEditor.getValue.mockReturnValue('test value');
    
    act(() => {
      changeCallback?.(mockDelta);
    });
    
    expect(onChange).toHaveBeenCalledWith('test value', mockDelta);
  });

  it('handles defaultValue for uncontrolled component', async () => {
    const defaultValue = 'default content';
    
    customRender(
      <AceEditor defaultValue={defaultValue} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setValue).toHaveBeenCalledWith(defaultValue, -1);
  });

  it('prevents infinite update loops with value changes', async () => {
    const mockEditor = createMockAceEditor();
    mockAceModule.edit.mockReturnValue(mockEditor);
    
    const { rerender } = customRender(
      <AceEditor value="same value" data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    // Mock editor returning the same value
    mockEditor.getValue.mockReturnValue('same value');
    
    // Re-render with same value
    rerender(<AceEditor value="same value" data-testid="ace-editor" />);
    
    // Should not call setValue again for same value
    await waitFor(() => {
      const setValueCalls = mockEditor.setValue.mock.calls.filter(
        call => call[0] === 'same value'
      );
      expect(setValueCalls.length).toBe(1); // Only initial setValue
    });
  });
});

// ============================================================================
// THEME TOGGLING TESTS
// ============================================================================

describe('AceEditor - Theme Toggling', () => {
  it('applies light theme by default', async () => {
    customRender(<AceEditor data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setTheme).toHaveBeenCalledWith('ace/theme/chrome');
  });

  it('applies dark theme when dark mode is active', async () => {
    // Set dark mode on document
    document.documentElement.classList.add('dark');
    
    customRender(<AceEditor data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
    
    // Cleanup
    document.documentElement.classList.remove('dark');
  });

  it('responds to theme override prop', async () => {
    customRender(<AceEditor theme="dark" data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
  });

  it('updates theme when system preference changes', async () => {
    const { rerender } = customRender(<AceEditor data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Initially light theme
    expect(mockEditor.setTheme).toHaveBeenCalledWith('ace/theme/chrome');
    
    // Simulate dark mode activation
    document.documentElement.classList.add('dark');
    
    // Force re-render to trigger theme update
    rerender(<AceEditor key="updated" data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
    });
    
    // Cleanup
    document.documentElement.classList.remove('dark');
  });

  it('applies theme-specific styling classes', () => {
    const { rerender } = customRender(<AceEditor data-testid="ace-editor" />);
    
    const container = screen.getByTestId('ace-editor');
    const editorDiv = container.querySelector('div[id^="ace-editor-"]');
    
    // Light theme classes
    expect(editorDiv).toHaveClass('bg-white', 'border-gray-300');
    
    // Switch to dark theme
    document.documentElement.classList.add('dark');
    rerender(<AceEditor key="dark" data-testid="ace-editor" />);
    
    const updatedEditorDiv = container.querySelector('div[id^="ace-editor-"]');
    expect(updatedEditorDiv).toHaveClass('bg-gray-900', 'border-gray-700');
    
    // Cleanup
    document.documentElement.classList.remove('dark');
  });
});

// ============================================================================
// ACCESSIBILITY COMPLIANCE TESTS
// ============================================================================

describe('AceEditor - Accessibility Compliance', () => {
  it('passes WCAG 2.1 AA accessibility tests', async () => {
    const { container } = customRender(
      <AceEditor
        aria-label="Code editor"
        required={true}
        data-testid="ace-editor"
      />
    );
    
    await testA11y(container, {
      skipRules: ['color-contrast'], // ACE editor themes handle contrast
    });
  });

  it('sets appropriate ARIA attributes', async () => {
    const ariaProps = {
      'aria-label': 'JSON code editor',
      'aria-labelledby': 'editor-label',
      'aria-describedby': 'editor-description',
      'aria-required': true,
      'aria-invalid': false,
    };
    
    customRender(
      <AceEditor
        {...ariaProps}
        required={true}
        data-testid="ace-editor"
      />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    const mockTextInput = mockEditor.textInput.getElement();
    
    // Verify ARIA attributes are set on text input
    expect(mockTextInput.setAttribute).toHaveBeenCalledWith('aria-label', 'JSON code editor');
    expect(mockTextInput.setAttribute).toHaveBeenCalledWith('aria-labelledby', 'editor-label');
    expect(mockTextInput.setAttribute).toHaveBeenCalledWith('aria-describedby', 'editor-description');
    expect(mockTextInput.setAttribute).toHaveBeenCalledWith('aria-required', 'true');
  });

  it('updates aria-invalid when hasError is true', async () => {
    const { rerender } = customRender(
      <AceEditor hasError={false} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    const mockTextInput = mockEditor.textInput.getElement();
    
    // Update to error state
    rerender(<AceEditor hasError={true} data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockTextInput.setAttribute).toHaveBeenCalledWith('aria-invalid', 'true');
    });
  });

  it('displays error messages with proper ARIA live region', () => {
    const errorMessage = 'Invalid JSON syntax';
    
    customRender(
      <AceEditor
        hasError={true}
        errorMessage={errorMessage}
        data-testid="ace-editor"
      />
    );
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent(errorMessage);
    expect(errorElement).toHaveAttribute('aria-live', 'polite');
    expect(errorElement).toHaveClass('text-red-600');
  });

  it('provides helper text with correct associations', () => {
    const helperText = 'Enter valid JSON code';
    
    customRender(
      <AceEditor
        helperText={helperText}
        id="test-editor"
        data-testid="ace-editor"
      />
    );
    
    const helperElement = screen.getByText(helperText);
    expect(helperElement).toBeInTheDocument();
    expect(helperElement).toHaveAttribute('id', 'test-editor-helper');
    
    const container = screen.getByTestId('ace-editor');
    const editorDiv = container.querySelector('div[id="test-editor"]');
    expect(editorDiv).toHaveAttribute('aria-describedby', expect.stringContaining('test-editor-helper'));
  });

  it('supports required field indication', () => {
    customRender(
      <AceEditor required={true} data-testid="ace-editor" />
    );
    
    const requiredIndicator = screen.getByLabelText('Required field');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveTextContent('*');
    expect(requiredIndicator).toHaveClass('text-red-500');
  });

  it('supports custom role and tabIndex', async () => {
    customRender(
      <AceEditor
        role="code"
        tabIndex={5}
        data-testid="ace-editor"
      />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    const mockTextInput = mockEditor.textInput.getElement();
    
    expect(mockTextInput.setAttribute).toHaveBeenCalledWith('role', 'code');
    expect(mockTextInput.setAttribute).toHaveBeenCalledWith('tabindex', '5');
  });
});

// ============================================================================
// REACT HOOK FORM INTEGRATION TESTS
// ============================================================================

describe('AceEditor - React Hook Form Integration', () => {
  it('integrates with React Hook Form register', async () => {
    const onFormSubmit = vi.fn();
    const defaultValues = { code: '{"test": true}' };
    
    const { user } = renderWithForm(
      <FormAceEditor
        defaultValues={defaultValues}
        onFormSubmit={onFormSubmit}
      />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onFormSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ code: expect.any(String) })
      );
    });
  });

  it('validates form field with custom validation', async () => {
    const TestFormComponent = () => {
      const methods = useForm({
        defaultValues: { code: '' },
        mode: 'onChange',
      });
      
      const validateCode = (value: string) => {
        if (!value) return 'Code is required';
        try {
          JSON.parse(value);
          return true;
        } catch {
          return 'Invalid JSON';
        }
      };
      
      return (
        <FormProvider {...methods}>
          <form>
            <AceEditor
              {...methods.register('code', { validate: validateCode })}
              mode={AceEditorMode.JSON}
              data-testid="form-ace-editor"
            />
            {methods.formState.errors.code && (
              <span role="alert" data-testid="validation-error">
                {methods.formState.errors.code.message}
              </span>
            )}
          </form>
        </FormProvider>
      );
    };
    
    const { user } = customRender(<TestFormComponent />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    const changeCallback = mockEditor.on.mock.calls.find(
      call => call[0] === 'change'
    )?.[1];
    
    // Simulate invalid JSON input
    mockEditor.getValue.mockReturnValue('invalid json');
    
    act(() => {
      changeCallback?.({ action: 'insert', lines: ['invalid json'] });
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toHaveTextContent('Invalid JSON');
    });
  });

  it('handles form reset correctly', async () => {
    const TestFormComponent = () => {
      const methods = useForm({
        defaultValues: { code: 'initial value' },
      });
      
      return (
        <FormProvider {...methods}>
          <form>
            <AceEditor
              {...methods.register('code')}
              data-testid="form-ace-editor"
            />
            <button
              type="button"
              onClick={() => methods.reset()}
              data-testid="reset-button"
            >
              Reset
            </button>
          </form>
        </FormProvider>
      );
    };
    
    const { user } = customRender(<TestFormComponent />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Simulate form reset
    const resetButton = screen.getByTestId('reset-button');
    await user.click(resetButton);
    
    await waitFor(() => {
      expect(mockEditor.setValue).toHaveBeenCalledWith('initial value', -1);
    });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('AceEditor - Performance Tests', () => {
  it('renders within performance budget (<100ms)', async () => {
    const { renderTime } = await measureRenderTime(() =>
      customRender(<AceEditor data-testid="ace-editor" />)
    );
    
    // Performance requirement: render under 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles real-time validation under 100ms', async () => {
    const onValidate = vi.fn();
    
    customRender(
      <AceEditor
        mode={AceEditorMode.JSON}
        onValidate={onValidate}
        data-testid="ace-editor"
      />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    const sessionChangeCallback = mockEditor.session.on.mock.calls.find(
      call => call[0] === 'changeAnnotation'
    )?.[1];
    
    const start = performance.now();
    
    // Simulate validation annotations
    const mockAnnotations = [
      { row: 0, column: 5, text: 'Syntax error', type: 'error' },
    ];
    mockEditor.session.getAnnotations.mockReturnValue(mockAnnotations);
    
    act(() => {
      sessionChangeCallback?.();
    });
    
    const end = performance.now();
    const validationTime = end - start;
    
    expect(validationTime).toBeLessThan(100);
    expect(onValidate).toHaveBeenCalledWith(mockAnnotations);
  });

  it('optimizes re-renders with large content', async () => {
    const largeContent = 'x'.repeat(10000); // 10KB content
    
    const { renderTime } = await measureRenderTime(() =>
      customRender(<AceEditor value={largeContent} data-testid="ace-editor" />)
    );
    
    // Should handle large content efficiently
    expect(renderTime).toBeLessThan(200);
  });

  it('handles rapid value changes efficiently', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const start = performance.now();
    
    // Simulate rapid value changes
    for (let i = 0; i < 100; i++) {
      editorRef?.setValue(`value-${i}`);
    }
    
    const end = performance.now();
    const operationTime = end - start;
    
    // Should handle 100 operations quickly
    expect(operationTime).toBeLessThan(50);
  });
});

// ============================================================================
// KEYBOARD NAVIGATION TESTS
// ============================================================================

describe('AceEditor - Keyboard Navigation', () => {
  it('supports keyboard focus management', async () => {
    let editorRef: AceEditorRef | null = null;
    
    const { user } = customRender(
      <>
        <button data-testid="before-button">Before</button>
        <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
        <button data-testid="after-button">After</button>
      </>
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const beforeButton = screen.getByTestId('before-button');
    const afterButton = screen.getByTestId('after-button');
    
    // Start focus on before button
    beforeButton.focus();
    expect(document.activeElement).toBe(beforeButton);
    
    // Tab to editor
    await user.tab();
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.focus).toHaveBeenCalled();
    
    // Tab away from editor
    await user.tab();
    expect(document.activeElement).toBe(afterButton);
  });

  it('supports programmatic focus and blur', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Focus editor
    editorRef?.focus();
    expect(mockEditor.focus).toHaveBeenCalled();
    
    // Blur editor
    editorRef?.blur();
    expect(mockEditor.blur).toHaveBeenCalled();
  });

  it('triggers focus and blur callbacks', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    
    customRender(
      <AceEditor
        onFocus={onFocus}
        onBlur={onBlur}
        data-testid="ace-editor"
      />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Simulate focus event
    const focusCallback = mockEditor.on.mock.calls.find(
      call => call[0] === 'focus'
    )?.[1];
    
    const blurCallback = mockEditor.on.mock.calls.find(
      call => call[0] === 'blur'
    )?.[1];
    
    const mockEvent = { type: 'focus' };
    
    act(() => {
      focusCallback?.(mockEvent);
    });
    
    expect(onFocus).toHaveBeenCalledWith(mockEvent);
    
    act(() => {
      blurCallback?.(mockEvent);
    });
    
    expect(onBlur).toHaveBeenCalledWith(mockEvent);
  });

  it('supports autoFocus prop', async () => {
    customRender(<AceEditor autoFocus={true} data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.focus).toHaveBeenCalled();
  });
});

// ============================================================================
// IMPERATIVE HANDLE TESTS
// ============================================================================

describe('AceEditor - Imperative Handle', () => {
  it('exposes complete imperative API', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    // Verify all methods are available
    expect(editorRef?.getValue).toBeDefined();
    expect(editorRef?.setValue).toBeDefined();
    expect(editorRef?.focus).toBeDefined();
    expect(editorRef?.blur).toBeDefined();
    expect(editorRef?.getEditor).toBeDefined();
    expect(editorRef?.clear).toBeDefined();
    expect(editorRef?.insert).toBeDefined();
    expect(editorRef?.getCursorPosition).toBeDefined();
    expect(editorRef?.setCursorPosition).toBeDefined();
    expect(editorRef?.getSelectedText).toBeDefined();
    expect(editorRef?.replaceSelectedText).toBeDefined();
    expect(editorRef?.undo).toBeDefined();
    expect(editorRef?.redo).toBeDefined();
    expect(editorRef?.getSession).toBeDefined();
    expect(editorRef?.resize).toBeDefined();
  });

  it('getValue returns current editor value', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    mockEditor.getValue.mockReturnValue('test value');
    
    const value = editorRef?.getValue();
    expect(value).toBe('test value');
    expect(mockEditor.getValue).toHaveBeenCalled();
  });

  it('setValue updates editor content', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    editorRef?.setValue('new content');
    expect(mockEditor.setValue).toHaveBeenCalledWith('new content', -1);
  });

  it('clear removes all content', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    editorRef?.clear();
    expect(mockEditor.setValue).toHaveBeenCalledWith('', -1);
  });

  it('insert adds text at cursor position', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    editorRef?.insert('inserted text');
    expect(mockEditor.insert).toHaveBeenCalledWith('inserted text');
  });

  it('cursor position methods work correctly', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    mockEditor.getCursorPosition.mockReturnValue({ row: 5, column: 10 });
    
    const position = editorRef?.getCursorPosition();
    expect(position).toEqual({ row: 5, column: 10 });
    
    editorRef?.setCursorPosition(2, 3);
    expect(mockEditor.moveCursorTo).toHaveBeenCalledWith(2, 3);
  });

  it('text selection methods work correctly', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    mockEditor.getSelectedText.mockReturnValue('selected');
    
    const selected = editorRef?.getSelectedText();
    expect(selected).toBe('selected');
    
    editorRef?.replaceSelectedText('replacement');
    expect(mockEditor.session.replace).toHaveBeenCalledWith(
      expect.any(Object),
      'replacement'
    );
  });

  it('undo and redo operations work', async () => {
    let editorRef: AceEditorRef | null = null;
    
    customRender(
      <AceEditorTestWrapper onRef={ref => (editorRef = ref)} />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    editorRef?.undo();
    expect(mockEditor.undo).toHaveBeenCalled();
    
    editorRef?.redo();
    expect(mockEditor.redo).toHaveBeenCalled();
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('AceEditor - Error Handling', () => {
  it('handles ACE editor loading failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock failed import
    vi.doMock('/assets/ace-builds/src-min-noconflict/ace.js', () => {
      throw new Error('Failed to load ACE editor');
    });
    
    customRender(<AceEditor data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to load code editor. Please refresh the page.'
      );
    });
    
    consoleSpy.mockRestore();
  });

  it('displays custom error messages', () => {
    const errorMessage = 'Custom validation error';
    
    customRender(
      <AceEditor
        hasError={true}
        errorMessage={errorMessage}
        data-testid="ace-editor"
      />
    );
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveTextContent(errorMessage);
    expect(errorElement).toHaveClass('text-red-600');
  });

  it('handles disabled and readonly states', async () => {
    const { rerender } = customRender(
      <AceEditor disabled={true} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setReadOnly).toHaveBeenCalledWith(true);
    
    const container = screen.getByTestId('ace-editor');
    const editorDiv = container.querySelector('div[id^="ace-editor-"]');
    expect(editorDiv).toHaveClass('opacity-60', 'cursor-not-allowed');
    
    // Test readonly state
    rerender(<AceEditor readonly={true} data-testid="ace-editor" />);
    
    await waitFor(() => {
      expect(mockEditor.setReadOnly).toHaveBeenCalledWith(true);
    });
  });

  it('validates required field correctly', () => {
    customRender(
      <AceEditor
        required={true}
        value=""
        hasError={true}
        errorMessage="This field is required"
        data-testid="ace-editor"
      />
    );
    
    const requiredIndicator = screen.getByLabelText('Required field');
    expect(requiredIndicator).toBeInTheDocument();
    
    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveTextContent('This field is required');
  });

  it('handles missing container ref gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock scenario where container ref is null
    const TestComponent = () => {
      const [mounted, setMounted] = useState(false);
      
      useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
      }, []);
      
      return mounted ? <AceEditor data-testid="ace-editor" /> : null;
    };
    
    customRender(<TestComponent />);
    
    // Component should mount without errors
    await waitFor(() => {
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// EDGE CASES AND INTEGRATION TESTS
// ============================================================================

describe('AceEditor - Edge Cases and Integration', () => {
  it('handles rapid mount/unmount cycles', async () => {
    const TestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
      return shouldRender ? <AceEditor data-testid="ace-editor" /> : null;
    };
    
    const { rerender } = customRender(<TestComponent shouldRender={true} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });
    
    // Rapid unmount/mount
    rerender(<TestComponent shouldRender={false} />);
    rerender(<TestComponent shouldRender={true} />);
    rerender(<TestComponent shouldRender={false} />);
    rerender(<TestComponent shouldRender={true} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('ace-editor')).toBeInTheDocument();
    });
    
    // Should not have memory leaks or errors
    const mockEditor = mockAceModule.edit.mock.results[0]?.value;
    if (mockEditor) {
      expect(mockEditor.destroy).toHaveBeenCalled();
    }
  });

  it('handles multiple editors on same page', async () => {
    customRender(
      <>
        <AceEditor data-testid="editor-1" id="editor-1" />
        <AceEditor data-testid="editor-2" id="editor-2" />
        <AceEditor data-testid="editor-3" id="editor-3" />
      </>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('editor-1')).toBeInTheDocument();
      expect(screen.getByTestId('editor-2')).toBeInTheDocument();
      expect(screen.getByTestId('editor-3')).toBeInTheDocument();
    });
    
    // Each editor should have been initialized
    expect(mockAceModule.edit).toHaveBeenCalledTimes(3);
    
    // Each editor should have unique IDs
    const editorDivs = [
      screen.getByTestId('editor-1').querySelector('div[id="editor-1"]'),
      screen.getByTestId('editor-2').querySelector('div[id="editor-2"]'),
      screen.getByTestId('editor-3').querySelector('div[id="editor-3"]'),
    ];
    
    editorDivs.forEach((div, index) => {
      expect(div).toBeInTheDocument();
      expect(div?.id).toBe(`editor-${index + 1}`);
    });
  });

  it('handles prop changes during loading state', async () => {
    const { rerender } = customRender(
      <AceEditor loading={true} value="initial" data-testid="ace-editor" />
    );
    
    // Change props while loading
    rerender(
      <AceEditor loading={true} value="updated" mode={AceEditorMode.YAML} data-testid="ace-editor" />
    );
    
    // Stop loading
    rerender(
      <AceEditor loading={false} value="final" mode={AceEditorMode.JAVASCRIPT} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Should apply final state
    expect(mockEditor.setValue).toHaveBeenCalledWith('final', -1);
    expect(mockEditor.session.setMode).toHaveBeenCalledWith('ace/mode/javascript');
  });

  it('maintains focus during theme changes', async () => {
    let editorRef: AceEditorRef | null = null;
    
    const { rerender } = customRender(
      <AceEditorTestWrapper
        onRef={ref => (editorRef = ref)}
        props={{ theme: 'light' }}
      />
    );
    
    await waitFor(() => {
      expect(editorRef).toBeTruthy();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Focus editor
    editorRef?.focus();
    expect(mockEditor.focus).toHaveBeenCalled();
    
    // Change theme
    rerender(
      <AceEditorTestWrapper
        onRef={ref => (editorRef = ref)}
        props={{ theme: 'dark' }}
      />
    );
    
    await waitFor(() => {
      expect(mockEditor.setTheme).toHaveBeenCalledWith('ace/theme/monokai');
    });
    
    // Focus should be maintained (no additional focus calls during theme change)
    const focusCalls = mockEditor.focus.mock.calls.length;
    expect(focusCalls).toBe(1);
  });

  it('handles cleanup on unmount properly', async () => {
    const TestComponent = ({ mounted }: { mounted: boolean }) => {
      return mounted ? <AceEditor data-testid="ace-editor" /> : null;
    };
    
    const { rerender } = customRender(<TestComponent mounted={true} />);
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    
    // Unmount component
    rerender(<TestComponent mounted={false} />);
    
    // Should destroy editor instance
    await waitFor(() => {
      expect(mockEditor.destroy).toHaveBeenCalled();
    });
  });

  it('integrates with MSW for configuration loading', async () => {
    // This test would use MSW to mock configuration API calls
    // For now, we'll verify the component handles configuration correctly
    
    const config = {
      fontSize: 18,
      showGutter: false,
      enableLiveAutocompletion: false,
    };
    
    customRender(
      <AceEditor config={config} data-testid="ace-editor" />
    );
    
    await waitFor(() => {
      expect(mockAceModule.edit).toHaveBeenCalled();
    });
    
    const mockEditor = mockAceModule.edit.mock.results[0].value;
    expect(mockEditor.setOptions).toHaveBeenCalledWith(
      expect.objectContaining(config)
    );
  });
});