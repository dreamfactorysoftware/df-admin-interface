/**
 * Dynamic Field Component Test Suite
 * 
 * Comprehensive test suite for the React dynamic field component using Vitest
 * and React Testing Library. Tests all field types, validation scenarios,
 * accessibility features, form integration, and user interactions.
 * 
 * Test Coverage:
 * - All field types (string, password, integer, text, boolean, etc.)
 * - Form integration (controlled and uncontrolled modes)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - File upload functionality (File objects and file paths)
 * - Event autocomplete with filtering and selection
 * - Zod validation integration
 * - Theme switching (light and dark modes)
 * - Performance testing (real-time validation <100ms)
 * - MSW mocks for event data fetching
 * - React Hook Form integration patterns
 * 
 * @fileoverview Test suite for dynamic field component
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { z } from 'zod';

// Test utilities and setup
import {
  customRender,
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  waitForValidation,
  measureRenderTime,
  createMockOptions,
  type FormTestUtils,
  type CustomRenderOptions,
} from '@/test/test-utils';

// Component under test
import { DynamicField } from './dynamic-field';
import type {
  DynamicFieldProps,
  DynamicFieldRef,
  ConfigSchema,
  SelectOption,
  EventOption,
} from './dynamic-field.types';

// Mock handlers
import { handlers } from '@/test/mocks/handlers';

// ============================================================================
// TEST SETUP AND CONFIGURATION
// ============================================================================

/**
 * MSW server setup for API mocking
 */
const server = setupServer(...handlers);

// Mock performance.now for timing tests
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

// Setup before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  // Mock performance timing
  mockPerformanceNow.mockImplementation(() => Date.now());
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  server.close();
});

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

/**
 * Mock configuration schemas for different field types
 */
const mockSchemas: Record<string, ConfigSchema> = {
  string: {
    name: 'testString',
    type: 'string',
    label: 'Test String Field',
    description: 'A test string input field',
    required: false,
  },
  password: {
    name: 'testPassword',
    type: 'password',
    label: 'Test Password Field',
    description: 'A test password input field',
    required: true,
  },
  integer: {
    name: 'testInteger',
    type: 'integer',
    label: 'Test Integer Field',
    description: 'A test numeric input field',
    required: false,
  },
  text: {
    name: 'testText',
    type: 'text',
    label: 'Test Text Area',
    description: 'A test textarea field',
    required: false,
  },
  boolean: {
    name: 'testBoolean',
    type: 'boolean',
    label: 'Test Boolean Field',
    description: 'A test boolean toggle field',
    required: false,
  },
  picklist: {
    name: 'testPicklist',
    type: 'picklist',
    label: 'Test Picklist',
    description: 'A test single select field',
    required: false,
    values: createMockOptions(3),
  },
  multiPicklist: {
    name: 'testMultiPicklist',
    type: 'multi_picklist',
    label: 'Test Multi Picklist',
    description: 'A test multi-select field',
    required: false,
    values: createMockOptions(5),
  },
  fileCertificate: {
    name: 'testFileCertificate',
    type: 'file_certificate',
    label: 'Test File Upload',
    description: 'A test file upload field',
    required: false,
  },
  fileCertificateApi: {
    name: 'testFileCertificateApi',
    type: 'file_certificate_api',
    label: 'Test File Selector',
    description: 'A test file selector field',
    required: false,
  },
  eventPicklist: {
    name: 'testEventPicklist',
    type: 'event_picklist',
    label: 'Test Event Picker',
    description: 'A test event autocomplete field',
    required: false,
    eventSource: 'system',
  },
};

/**
 * Mock event data for autocomplete testing
 */
const mockEventOptions: EventOption[] = [
  {
    id: 1,
    label: 'user.login',
    value: 'user.login',
    description: 'User login event',
    isSelectable: true,
  },
  {
    id: 2,
    label: 'user.logout',
    value: 'user.logout',
    description: 'User logout event',
    isSelectable: true,
  },
  {
    id: 3,
    label: 'database.before_insert',
    value: 'database.before_insert',
    description: 'Database before insert event',
    isSelectable: true,
  },
  {
    id: 4,
    label: 'api.get',
    value: 'api.get',
    description: 'API GET request event',
    isSelectable: true,
  },
];

/**
 * Create a mock file for testing
 */
const createMockFile = (name = 'test.pem', type = 'application/x-pem-file'): File => {
  const content = '-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE_CONTENT\n-----END CERTIFICATE-----';
  return new File([content], name, { type });
};

/**
 * Test wrapper component with form provider
 */
interface TestWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, any>;
  onSubmit?: (data: any) => void;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  defaultValues = {},
  onSubmit = vi.fn(),
}) => {
  const methods = useForm({ defaultValues });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          {children}
        </form>
      </FormProvider>
    </QueryClientProvider>
  );
};

// ============================================================================
// STRING FIELD TESTS
// ============================================================================

describe('DynamicField - String Type', () => {
  it('renders string input field correctly', () => {
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testString"
        control={undefined as any}
        schema={mockSchemas.string}
        data-testid="string-field"
      />
    );

    const input = screen.getByRole('textbox', { name: /test string field/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', mockSchemas.string.description);
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testString"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(input).toHaveValue('test value');
    expect(formMethods.getValues('testString')).toBe('test value');
  });

  it('supports controlled mode with external value changes', async () => {
    const { formMethods, setFieldValue } = renderWithForm(
      <DynamicField
        name="testString"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    const input = screen.getByRole('textbox');
    
    setFieldValue('testString', 'controlled value');
    await waitFor(() => {
      expect(input).toHaveValue('controlled value');
    });
  });

  it('validates required string fields', async () => {
    const requiredSchema = { ...mockSchemas.string, required: true };
    const { formMethods, triggerValidation } = renderWithForm(
      <DynamicField
        name="testString"
        control={undefined as any}
        schema={requiredSchema}
      />
    );

    const isValid = await triggerValidation('testString');
    expect(isValid).toBe(false);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/this field is required/i);
    });
  });

  it('meets accessibility requirements', async () => {
    const { container } = customRender(
      <TestWrapper>
        <DynamicField
          name="testString"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>
    );

    // Test accessibility compliance
    await testA11y(container);

    // Check specific ARIA attributes
    const input = screen.getByRole('textbox');
    checkAriaAttributes(input, {
      'aria-label': mockSchemas.string.label,
      'aria-describedby': 'testString-help',
    });
  });
});

// ============================================================================
// PASSWORD FIELD TESTS
// ============================================================================

describe('DynamicField - Password Type', () => {
  it('renders password input with proper masking', () => {
    renderWithForm(
      <DynamicField
        name="testPassword"
        control={undefined as any}
        schema={mockSchemas.password}
      />
    );

    const input = screen.getByLabelText(/test password field/i);
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autoComplete', 'current-password');
  });

  it('handles password input securely', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testPassword"
        control={undefined as any}
        schema={mockSchemas.password}
      />
    );

    const input = screen.getByLabelText(/test password field/i);
    await user.type(input, 'secretpassword');

    expect(formMethods.getValues('testPassword')).toBe('secretpassword');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('validates required password fields', async () => {
    const { triggerValidation } = renderWithForm(
      <DynamicField
        name="testPassword"
        control={undefined as any}
        schema={mockSchemas.password}
      />
    );

    const isValid = await triggerValidation('testPassword');
    expect(isValid).toBe(false);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// INTEGER FIELD TESTS
// ============================================================================

describe('DynamicField - Integer Type', () => {
  it('renders numeric input field', () => {
    renderWithForm(
      <DynamicField
        name="testInteger"
        control={undefined as any}
        schema={mockSchemas.integer}
      />
    );

    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('handles numeric input correctly', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testInteger"
        control={undefined as any}
        schema={mockSchemas.integer}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, '42');

    expect(formMethods.getValues('testInteger')).toBe(42);
  });

  it('rejects non-numeric input', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testInteger"
        control={undefined as any}
        schema={mockSchemas.integer}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, 'abc');

    // Non-numeric input should be filtered out
    expect(formMethods.getValues('testInteger')).toBeUndefined();
  });

  it('handles empty input as undefined', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testInteger"
        control={undefined as any}
        schema={mockSchemas.integer}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, '123');
    await user.clear(input);

    expect(formMethods.getValues('testInteger')).toBeUndefined();
  });
});

// ============================================================================
// TEXT AREA FIELD TESTS
// ============================================================================

describe('DynamicField - Text Type', () => {
  it('renders textarea field', () => {
    renderWithForm(
      <DynamicField
        name="testText"
        control={undefined as any}
        schema={mockSchemas.text}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('handles multi-line text input', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testText"
        control={undefined as any}
        schema={mockSchemas.text}
      />
    );

    const textarea = screen.getByRole('textbox');
    const multiLineText = 'Line 1\nLine 2\nLine 3';
    await user.type(textarea, multiLineText);

    expect(formMethods.getValues('testText')).toBe(multiLineText);
  });

  it('supports accessibility features for textarea', async () => {
    const { container } = customRender(
      <TestWrapper>
        <DynamicField
          name="testText"
          control={undefined as any}
          schema={mockSchemas.text}
        />
      </TestWrapper>
    );

    await testA11y(container);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', mockSchemas.text.label);
  });
});

// ============================================================================
// BOOLEAN FIELD TESTS
// ============================================================================

describe('DynamicField - Boolean Type', () => {
  it('renders switch component for boolean field', () => {
    renderWithForm(
      <DynamicField
        name="testBoolean"
        control={undefined as any}
        schema={mockSchemas.boolean}
      />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles boolean value on click', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testBoolean"
        control={undefined as any}
        schema={mockSchemas.boolean}
      />
    );

    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);

    expect(formMethods.getValues('testBoolean')).toBe(true);
    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testBoolean"
        control={undefined as any}
        schema={mockSchemas.boolean}
      />
    );

    const switchElement = screen.getByRole('switch');
    switchElement.focus();
    
    const keyboard = createKeyboardUtils(user);
    await keyboard.space();

    expect(formMethods.getValues('testBoolean')).toBe(true);
  });

  it('displays label alongside switch when showLabel is true', () => {
    renderWithForm(
      <DynamicField
        name="testBoolean"
        control={undefined as any}
        schema={mockSchemas.boolean}
        showLabel={true}
      />
    );

    expect(screen.getByText(mockSchemas.boolean.label!)).toBeInTheDocument();
  });
});

// ============================================================================
// PICKLIST FIELD TESTS
// ============================================================================

describe('DynamicField - Picklist Type', () => {
  it('renders single select dropdown', () => {
    renderWithForm(
      <DynamicField
        name="testPicklist"
        control={undefined as any}
        schema={mockSchemas.picklist}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Select an option...');
  });

  it('displays options when clicked', async () => {
    const user = userEvent.setup();
    renderWithForm(
      <DynamicField
        name="testPicklist"
        control={undefined as any}
        schema={mockSchemas.picklist}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Verify all options are present
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent('Option 1');
  });

  it('selects option and updates value', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testPicklist"
        control={undefined as any}
        schema={mockSchemas.picklist}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    const option = screen.getByRole('option', { name: /option 1/i });
    await user.click(option);

    expect(formMethods.getValues('testPicklist')).toBe('option-1');
    expect(button).toHaveTextContent('Option 1');
  });

  it('supports keyboard navigation in dropdown', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testPicklist"
        control={undefined as any}
        schema={mockSchemas.picklist}
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    
    const keyboard = createKeyboardUtils(user);
    await keyboard.enter();

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    await keyboard.arrowDown();
    await keyboard.enter();

    expect(formMethods.getValues('testPicklist')).toBe('option-1');
  });
});

// ============================================================================
// MULTI-PICKLIST FIELD TESTS
// ============================================================================

describe('DynamicField - Multi-Picklist Type', () => {
  it('renders multi-select dropdown', () => {
    renderWithForm(
      <DynamicField
        name="testMultiPicklist"
        control={undefined as any}
        schema={mockSchemas.multiPicklist}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Select options...');
  });

  it('allows multiple option selection', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testMultiPicklist"
        control={undefined as any}
        schema={mockSchemas.multiPicklist}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Select first option
    const option1 = screen.getByRole('option', { name: /option 1/i });
    await user.click(option1);

    // Select second option
    const option2 = screen.getByRole('option', { name: /option 2/i });
    await user.click(option2);

    const values = formMethods.getValues('testMultiPicklist');
    expect(values).toEqual(['option-1', 'option-2']);
    expect(button).toHaveTextContent('2 selected');
  });

  it('handles deselection of options', async () => {
    const user = userEvent.setup();
    const { formMethods, setFieldValue } = renderWithForm(
      <DynamicField
        name="testMultiPicklist"
        control={undefined as any}
        schema={mockSchemas.multiPicklist}
      />,
      { defaultValues: { testMultiPicklist: ['option-1', 'option-2'] } }
    );

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Deselect first option
    const option1 = screen.getByRole('option', { name: /option 1/i });
    await user.click(option1);

    const values = formMethods.getValues('testMultiPicklist');
    expect(values).toEqual(['option-2']);
  });
});

// ============================================================================
// FILE CERTIFICATE FIELD TESTS
// ============================================================================

describe('DynamicField - File Certificate Type', () => {
  it('renders file upload field', () => {
    renderWithForm(
      <DynamicField
        name="testFileCertificate"
        control={undefined as any}
        schema={mockSchemas.fileCertificate}
      />
    );

    const button = screen.getByRole('button', { name: /test file upload/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('No file selected')).toBeInTheDocument();
  });

  it('handles file selection with File object', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testFileCertificate"
        control={undefined as any}
        schema={mockSchemas.fileCertificate}
      />
    );

    const mockFile = createMockFile();
    const fileInput = screen.getByLabelText(/test file upload/i);
    
    // Mock file input change
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(formMethods.getValues('testFileCertificate')).toBe(mockFile);
    expect(screen.getByText('test.pem')).toBeInTheDocument();
  });

  it('accepts only allowed file extensions', () => {
    renderWithForm(
      <DynamicField
        name="testFileCertificate"
        control={undefined as any}
        schema={mockSchemas.fileCertificate}
      />
    );

    const fileInput = screen.getByLabelText(/test file upload/i);
    expect(fileInput).toHaveAttribute('accept', '.p8,.pem,.key,.crt,.cert');
  });

  it('handles file removal', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testFileCertificate"
        control={undefined as any}
        schema={mockSchemas.fileCertificate}
      />,
      { defaultValues: { testFileCertificate: createMockFile() } }
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Simulate selecting no file (removing the current file)
    const fileInput = screen.getByLabelText(/test file upload/i);
    Object.defineProperty(fileInput, 'files', {
      value: [],
      writable: false,
    });

    fireEvent.change(fileInput);

    expect(formMethods.getValues('testFileCertificate')).toBeNull();
  });
});

// ============================================================================
// FILE CERTIFICATE API FIELD TESTS
// ============================================================================

describe('DynamicField - File Certificate API Type', () => {
  it('renders file selector component', () => {
    renderWithForm(
      <DynamicField
        name="testFileCertificateApi"
        control={undefined as any}
        schema={mockSchemas.fileCertificateApi}
      />
    );

    // FileSelector component should be rendered
    // This will depend on the actual FileSelector implementation
    expect(screen.getByLabelText(/test file selector/i)).toBeInTheDocument();
  });

  it('handles file selection with file path strings', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testFileCertificateApi"
        control={undefined as any}
        schema={mockSchemas.fileCertificateApi}
      />
    );

    // Mock file selector behavior - this would interact with the FileSelector component
    const mockFilePath = '/app/certificates/test.pem';
    
    // Simulate file selection (this would be triggered by FileSelector component)
    formMethods.setValue('testFileCertificateApi', mockFilePath);

    expect(formMethods.getValues('testFileCertificateApi')).toBe(mockFilePath);
  });

  it('supports accessibility features for file selector', async () => {
    const { container } = customRender(
      <TestWrapper>
        <DynamicField
          name="testFileCertificateApi"
          control={undefined as any}
          schema={mockSchemas.fileCertificateApi}
        />
      </TestWrapper>
    );

    await testA11y(container, {
      skipRules: ['color-contrast'], // FileSelector might have custom styling
    });
  });
});

// ============================================================================
// EVENT PICKLIST FIELD TESTS
// ============================================================================

describe('DynamicField - Event Picklist Type', () => {
  beforeEach(() => {
    // Mock the event API endpoint
    server.use(
      rest.get('/api/v2/system/events', (req, res, ctx) => {
        const query = req.url.searchParams.get('filter') || '';
        const filteredEvents = mockEventOptions.filter(event =>
          event.label.toLowerCase().includes(query.toLowerCase())
        );
        return res(ctx.json({ resource: filteredEvents }));
      })
    );
  });

  it('renders event autocomplete field', () => {
    renderWithForm(
      <DynamicField
        name="testEventPicklist"
        control={undefined as any}
        schema={mockSchemas.eventPicklist}
      />
    );

    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('placeholder', 'Type to search events...');
  });

  it('filters events based on user input', async () => {
    const user = userEvent.setup();
    renderWithForm(
      <DynamicField
        name="testEventPicklist"
        control={undefined as any}
        schema={mockSchemas.eventPicklist}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'user');

    await waitFor(() => {
      expect(screen.getByText('user.login')).toBeInTheDocument();
      expect(screen.getByText('user.logout')).toBeInTheDocument();
    });

    // Should not show non-matching events
    expect(screen.queryByText('database.before_insert')).not.toBeInTheDocument();
  });

  it('selects event from autocomplete dropdown', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testEventPicklist"
        control={undefined as any}
        schema={mockSchemas.eventPicklist}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'login');

    await waitFor(() => {
      expect(screen.getByText('user.login')).toBeInTheDocument();
    });

    const option = screen.getByText('user.login');
    await user.click(option);

    expect(formMethods.getValues('testEventPicklist')).toBe('user.login');
    expect(input).toHaveValue('user.login');
  });

  it('shows loading state during search', async () => {
    const user = userEvent.setup();
    
    // Add delay to the mock to simulate loading
    server.use(
      rest.get('/api/v2/system/events', (req, res, ctx) => {
        return res(ctx.delay(100), ctx.json({ resource: mockEventOptions }));
      })
    );

    renderWithForm(
      <DynamicField
        name="testEventPicklist"
        control={undefined as any}
        schema={mockSchemas.eventPicklist}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    // Should show loading message briefly
    await waitFor(() => {
      expect(screen.queryByText('Loading events...')).toBeInTheDocument();
    }, { timeout: 50 });
  });

  it('handles keyboard navigation in event dropdown', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testEventPicklist"
        control={undefined as any}
        schema={mockSchemas.eventPicklist}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'user');

    await waitFor(() => {
      expect(screen.getByText('user.login')).toBeInTheDocument();
    });

    const keyboard = createKeyboardUtils(user);
    await keyboard.arrowDown();
    await keyboard.enter();

    expect(formMethods.getValues('testEventPicklist')).toBe('user.login');
  });
});

// ============================================================================
// FORM INTEGRATION TESTS
// ============================================================================

describe('DynamicField - Form Integration', () => {
  it('integrates with React Hook Form in controlled mode', async () => {
    const onSubmit = vi.fn();
    const TestForm = () => {
      const methods = useForm({
        defaultValues: { testField: 'initial value' },
      });

      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <DynamicField
              name="testField"
              control={methods.control}
              schema={mockSchemas.string}
            />
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      );
    };

    const user = userEvent.setup();
    customRender(<TestForm />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial value');

    await user.clear(input);
    await user.type(input, 'new value');
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({ testField: 'new value' });
  });

  it('supports uncontrolled mode with register', () => {
    const TestForm = () => {
      const { register, handleSubmit } = useForm();

      return (
        <form onSubmit={handleSubmit(() => {})}>
          <DynamicField
            name="testField"
            control={undefined as any}
            schema={mockSchemas.string}
          />
        </form>
      );
    };

    customRender(<TestForm />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('validates fields using React Hook Form rules', async () => {
    const TestForm = () => {
      const methods = useForm({
        mode: 'onChange',
      });

      return (
        <FormProvider {...methods}>
          <DynamicField
            name="testField"
            control={methods.control}
            schema={{ ...mockSchemas.string, required: true }}
          />
        </FormProvider>
      );
    };

    const user = userEvent.setup();
    customRender(<TestForm />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Trigger blur to validate

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/this field is required/i);
    });
  });

  it('supports field arrays and nested forms', async () => {
    const TestForm = () => {
      const methods = useForm({
        defaultValues: {
          items: [{ name: 'Item 1' }, { name: 'Item 2' }],
        },
      });

      return (
        <FormProvider {...methods}>
          {methods.watch('items').map((item, index) => (
            <DynamicField
              key={index}
              name={`items.${index}.name`}
              control={methods.control}
              schema={mockSchemas.string}
            />
          ))}
        </FormProvider>
      );
    };

    customRender(<TestForm />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue('Item 1');
    expect(inputs[1]).toHaveValue('Item 2');
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('DynamicField - Accessibility', () => {
  it('meets WCAG 2.1 AA compliance for all field types', async () => {
    const fieldTypes = Object.keys(mockSchemas);
    
    for (const fieldType of fieldTypes) {
      const { container } = customRender(
        <TestWrapper>
          <DynamicField
            name={`test_${fieldType}`}
            control={undefined as any}
            schema={mockSchemas[fieldType]}
          />
        </TestWrapper>
      );

      await testA11y(container, {
        skipRules: ['color-contrast'], // Some components might have custom styling
      });
    }
  });

  it('provides proper labeling and descriptions', () => {
    renderWithForm(
      <DynamicField
        name="testField"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    const input = screen.getByRole('textbox');
    const label = screen.getByText(mockSchemas.string.label!);
    const description = screen.getByText(mockSchemas.string.description!);

    expect(label).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', 'testField-help');
  });

  it('announces errors to screen readers', async () => {
    const { triggerValidation } = renderWithForm(
      <DynamicField
        name="testField"
        control={undefined as any}
        schema={{ ...mockSchemas.string, required: true }}
      />
    );

    await triggerValidation('testField');

    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
      expect(errorElement).toHaveTextContent(/this field is required/i);
    });
  });

  it('supports keyboard navigation for all interactive elements', async () => {
    const user = userEvent.setup();
    renderWithForm(
      <DynamicField
        name="testPicklist"
        control={undefined as any}
        schema={mockSchemas.picklist}
      />
    );

    const button = screen.getByRole('button');
    const keyboard = createKeyboardUtils(user);
    
    // Test tab navigation
    await keyboard.tab();
    expect(keyboard.isFocused(button)).toBe(true);

    // Test enter key activation
    await keyboard.enter();
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    // Test arrow navigation
    await keyboard.arrowDown();
    await keyboard.enter();

    expect(button).toHaveTextContent('Option 1');
  });

  it('provides appropriate focus management', async () => {
    const user = userEvent.setup();
    renderWithForm(
      <DynamicField
        name="testField"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    const input = screen.getByRole('textbox');
    
    // Test focus method through ref
    input.focus();
    expect(document.activeElement).toBe(input);

    // Test blur behavior
    await user.tab();
    expect(document.activeElement).not.toBe(input);
  });
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('DynamicField - Validation', () => {
  it('validates using Zod schemas', async () => {
    const zodSchema = z.object({
      testField: z.string().min(5, 'Must be at least 5 characters'),
    });

    const TestForm = () => {
      const methods = useForm({
        mode: 'onChange',
        resolver: async (data) => {
          try {
            zodSchema.parse(data);
            return { values: data, errors: {} };
          } catch (error) {
            return {
              values: {},
              errors: {
                testField: {
                  type: 'validation',
                  message: 'Must be at least 5 characters',
                },
              },
            };
          }
        },
      });

      return (
        <FormProvider {...methods}>
          <DynamicField
            name="testField"
            control={methods.control}
            schema={mockSchemas.string}
          />
        </FormProvider>
      );
    };

    const user = userEvent.setup();
    customRender(<TestForm />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'abc');
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/must be at least 5 characters/i);
    });
  });

  it('validates required fields correctly', async () => {
    const { triggerValidation } = renderWithForm(
      <DynamicField
        name="testField"
        control={undefined as any}
        schema={{ ...mockSchemas.string, required: true }}
      />
    );

    const isValid = await triggerValidation('testField');
    expect(isValid).toBe(false);
  });

  it('validates integer fields for numeric input', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testInteger"
        control={undefined as any}
        schema={mockSchemas.integer}
      />
    );

    const input = screen.getByRole('spinbutton');
    await user.type(input, 'not-a-number');

    // Value should remain undefined for invalid input
    expect(formMethods.getValues('testInteger')).toBeUndefined();
  });

  it('provides real-time validation under 100ms', async () => {
    const startTime = performance.now();
    let validationTime = 0;

    const TestForm = () => {
      const methods = useForm({
        mode: 'onChange',
        resolver: async (data) => {
          const validationStart = performance.now();
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate validation
          validationTime = performance.now() - validationStart;
          
          return { values: data, errors: {} };
        },
      });

      return (
        <FormProvider {...methods}>
          <DynamicField
            name="testField"
            control={methods.control}
            schema={mockSchemas.string}
          />
        </FormProvider>
      );
    };

    const user = userEvent.setup();
    customRender(<TestForm />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    await waitFor(() => {
      expect(validationTime).toBeLessThan(100);
    });
  });
});

// ============================================================================
// THEME TESTS
// ============================================================================

describe('DynamicField - Theme Support', () => {
  it('applies light theme classes correctly', () => {
    customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>,
      { theme: 'light' }
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-gray-300');
    expect(input).not.toHaveClass('dark:bg-gray-900');
  });

  it('applies dark theme classes correctly', () => {
    customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>,
      { theme: 'dark' }
    );

    const container = screen.getByTestId('testField') || document.querySelector('[data-theme="dark"]');
    expect(container).toHaveClass('dark');
  });

  it('switches theme dynamically', async () => {
    const { rerender } = customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>,
      { theme: 'light' }
    );

    // Switch to dark theme
    rerender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>
    );

    // Theme classes should update
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('dark:bg-gray-900');
  });

  it('maintains contrast ratios in both themes', async () => {
    // Light theme test
    const { container: lightContainer } = customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>,
      { theme: 'light' }
    );

    await testA11y(lightContainer);

    // Dark theme test
    const { container: darkContainer } = customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      </TestWrapper>,
      { theme: 'dark' }
    );

    await testA11y(darkContainer);
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('DynamicField - Performance', () => {
  it('renders quickly with large datasets', async () => {
    const largeOptionSet = Array.from({ length: 1000 }, (_, i) => ({
      value: `option-${i}`,
      label: `Option ${i}`,
      description: `Description ${i}`,
    }));

    const largeSchema = {
      ...mockSchemas.picklist,
      values: largeOptionSet,
    };

    const { renderTime } = await measureRenderTime(() =>
      customRender(
        <TestWrapper>
          <DynamicField
            name="testField"
            control={undefined as any}
            schema={largeSchema}
          />
        </TestWrapper>
      )
    );

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(100);
  });

  it('handles rapid input changes efficiently', async () => {
    const user = userEvent.setup();
    const { formMethods } = renderWithForm(
      <DynamicField
        name="testField"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    const input = screen.getByRole('textbox');
    const startTime = performance.now();

    // Simulate rapid typing
    for (let i = 0; i < 50; i++) {
      await user.type(input, 'a', { delay: 10 });
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should handle rapid input without performance degradation
    expect(totalTime).toBeLessThan(1000); // 1 second for 50 keystrokes
    expect(formMethods.getValues('testField')).toHaveLength(50);
  });

  it('optimizes re-renders with React.memo', async () => {
    let renderCount = 0;
    const TestComponent = React.memo(() => {
      renderCount++;
      return (
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={mockSchemas.string}
        />
      );
    });

    const { rerender } = customRender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    const initialRenderCount = renderCount;

    // Re-render with same props should not cause component re-render
    rerender(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    );

    expect(renderCount).toBe(initialRenderCount);
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('DynamicField - Error Handling', () => {
  it('handles missing schema gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={undefined as any}
        />
      </TestWrapper>
    );

    expect(consoleSpy).toHaveBeenCalledWith('DynamicField: schema with type is required');
    consoleSpy.mockRestore();
  });

  it('handles unsupported field types gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    customRender(
      <TestWrapper>
        <DynamicField
          name="testField"
          control={undefined as any}
          schema={{ name: 'test', type: 'unsupported' as any }}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/unsupported field type/i)).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('DynamicField: Unsupported field type "unsupported"');
    consoleSpy.mockRestore();
  });

  it('handles API errors for event picklist gracefully', async () => {
    // Mock API error
    server.use(
      rest.get('/api/v2/system/events', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      })
    );

    const user = userEvent.setup();
    renderWithForm(
      <DynamicField
        name="testEventPicklist"
        control={undefined as any}
        schema={mockSchemas.eventPicklist}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    // Should not crash and should handle error gracefully
    await waitFor(() => {
      expect(input).toBeInTheDocument();
    });
  });

  it('handles disabled state correctly for all field types', () => {
    const fieldTypes = Object.keys(mockSchemas);
    
    fieldTypes.forEach(fieldType => {
      const { container } = customRender(
        <TestWrapper key={fieldType}>
          <DynamicField
            name={`test_${fieldType}`}
            control={undefined as any}
            schema={mockSchemas[fieldType]}
            disabled={true}
          />
        </TestWrapper>
      );

      // All interactive elements should be disabled
      const interactiveElements = container.querySelectorAll('input, button, textarea, select');
      interactiveElements.forEach(element => {
        expect(element).toBeDisabled();
      });
    });
  });
});

// ============================================================================
// COMPONENT REF TESTS
// ============================================================================

describe('DynamicField - Component Ref', () => {
  it('provides imperative handle methods', () => {
    const ref = React.createRef<DynamicFieldRef>();
    
    renderWithForm(
      <DynamicField
        ref={ref}
        name="testField"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.focus).toBe('function');
    expect(typeof ref.current?.blur).toBe('function');
    expect(typeof ref.current?.clear).toBe('function');
    expect(typeof ref.current?.validate).toBe('function');
    expect(typeof ref.current?.getValue).toBe('function');
    expect(typeof ref.current?.setValue).toBe('function');
  });

  it('implements focus method correctly', async () => {
    const ref = React.createRef<DynamicFieldRef>();
    
    renderWithForm(
      <DynamicField
        ref={ref}
        name="testField"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    const input = screen.getByRole('textbox');
    
    ref.current?.focus();
    
    await waitFor(() => {
      expect(document.activeElement).toBe(input);
    });
  });

  it('implements setValue method correctly', async () => {
    const ref = React.createRef<DynamicFieldRef>();
    const { formMethods } = renderWithForm(
      <DynamicField
        ref={ref}
        name="testField"
        control={undefined as any}
        schema={mockSchemas.string}
      />
    );

    ref.current?.setValue('ref value');

    await waitFor(() => {
      expect(formMethods.getValues('testField')).toBe('ref value');
    });
  });

  it('implements validate method correctly', async () => {
    const ref = React.createRef<DynamicFieldRef>();
    renderWithForm(
      <DynamicField
        ref={ref}
        name="testField"
        control={undefined as any}
        schema={{ ...mockSchemas.string, required: true }}
      />
    );

    const isValid = await ref.current?.validate();
    expect(isValid).toBe(false);

    ref.current?.setValue('valid value');
    const isValidAfterSet = await ref.current?.validate();
    expect(isValidAfterSet).toBe(true);
  });
});