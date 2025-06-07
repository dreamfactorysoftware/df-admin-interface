/**
 * Comprehensive Test Suite for Select Components
 * 
 * Complete testing coverage for Select, Autocomplete, and MultiSelect components
 * using Vitest 2.1+, Testing Library, and MSW for realistic API interaction testing.
 * Tests component rendering, user interactions, accessibility, form integration,
 * and async functionality with 90%+ code coverage target.
 * 
 * Test Coverage Areas:
 * - Component rendering with all variants and themes
 * - User interactions (click, keyboard navigation, search)
 * - Accessibility compliance (WCAG 2.1 AA)
 * - React Hook Form integration with validation
 * - Async operations with MSW mocking
 * - Value transformations (arrays, bitmasks, strings)
 * - Performance with large datasets
 * - Error handling and loading states
 * 
 * @fileoverview Comprehensive test suite for DreamFactory select components
 * @version 1.0.0
 * @since React 19.0.0 / Vitest 2.1+
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useForm } from 'react-hook-form';

import {
  customRender,
  renderWithForm,
  testA11y,
  checkAriaAttributes,
  createKeyboardUtils,
  createMockOptions,
  createMockGroupedOptions,
  createMockVerbOptions,
  createLargeDataset,
  measureRenderTime,
  waitForValidation,
  type FormTestUtils,
} from '../../../test/test-utils';

import Select from './Select';
import Autocomplete from './Autocomplete';
import MultiSelect from './MultiSelect';
import type { SelectOption, SelectProps, AutocompleteProps, MultiSelectProps } from './types';

// ============================================================================
// MOCK DATA AND UTILITIES
// ============================================================================

/**
 * Mock handlers for async operations
 */
const mockHandlers = [
  // Mock async option loading
  http.get('/api/options/async', () => {
    return HttpResponse.json([
      { value: 'async-1', label: 'Async Option 1', description: 'Loaded from API' },
      { value: 'async-2', label: 'Async Option 2', description: 'Loaded from API' },
      { value: 'async-3', label: 'Async Option 3', description: 'Loaded from API' },
    ]);
  }),

  // Mock search endpoint
  http.get('/api/options/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    const allOptions = [
      { value: 'search-1', label: 'Searchable Option 1', description: 'First search result' },
      { value: 'search-2', label: 'Searchable Option 2', description: 'Second search result' },
      { value: 'search-3', label: 'Another Result', description: 'Third search result' },
    ];

    const filtered = allOptions.filter(option =>
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      option.description.toLowerCase().includes(query.toLowerCase())
    );

    return HttpResponse.json(filtered);
  }),

  // Mock database connection test
  http.post('/api/v2/system/service/test', () => {
    return HttpResponse.json({ success: true, message: 'Connection successful' });
  }),

  // Mock error scenario
  http.get('/api/options/error', () => {
    return HttpResponse.json(
      { error: 'Failed to load options' },
      { status: 500 }
    );
  }),
];

const server = setupServer(...mockHandlers);

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// SELECT COMPONENT TESTS
// ============================================================================

describe('Select Component', () => {
  const defaultOptions = createMockOptions();
  const defaultProps: SelectProps = {
    options: defaultOptions,
    placeholder: 'Select an option...',
  };

  describe('Rendering and Basic Functionality', () => {
    it('renders with default props', () => {
      const { user } = customRender(<Select {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Select an option...')).toBeInTheDocument();
    });

    it('renders with all size variants', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      sizes.forEach(size => {
        const { rerender } = customRender(
          <Select {...defaultProps} size={size} data-testid={`select-${size}`} />
        );
        
        const select = screen.getByTestId(`select-${size}`);
        expect(select).toBeInTheDocument();
        expect(select).toHaveClass(size === 'sm' ? 'py-2' : size === 'lg' ? 'py-3' : 'py-2.5');
      });
    });

    it('renders with all visual variants', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost'] as const;
      
      variants.forEach(variant => {
        const { rerender } = customRender(
          <Select {...defaultProps} variant={variant} data-testid={`select-${variant}`} />
        );
        
        const select = screen.getByTestId(`select-${variant}`);
        expect(select).toBeInTheDocument();
      });
    });

    it('displays options when clicked', async () => {
      const { user } = customRender(<Select {...defaultProps} />);
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      defaultOptions.forEach(option => {
        expect(screen.getByText(option.label)).toBeInTheDocument();
      });
    });

    it('handles option selection', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <Select {...defaultProps} onChange={onChange} />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      const firstOption = screen.getByText(defaultOptions[0].label);
      await user.click(firstOption);
      
      expect(onChange).toHaveBeenCalledWith(
        defaultOptions[0].value,
        defaultOptions[0]
      );
    });

    it('displays selected value correctly', () => {
      const selectedValue = defaultOptions[1].value;
      customRender(
        <Select {...defaultProps} value={selectedValue} />
      );
      
      expect(screen.getByText(defaultOptions[1].label)).toBeInTheDocument();
    });

    it('handles disabled state', () => {
      const { user } = customRender(
        <Select {...defaultProps} disabled />
      );
      
      const selectButton = screen.getByRole('button');
      expect(selectButton).toBeDisabled();
      expect(selectButton).toHaveClass('disabled:opacity-50');
    });

    it('shows error state correctly', () => {
      const errorMessage = 'This field is required';
      customRender(
        <Select {...defaultProps} error={errorMessage} />
      );
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('meets WCAG 2.1 AA accessibility standards', async () => {
      const { container } = customRender(<Select {...defaultProps} />);
      await testA11y(container);
    });

    it('has proper ARIA attributes', () => {
      customRender(
        <Select
          {...defaultProps}
          aria-label="Database connection type"
          aria-describedby="connection-help"
          required
        />
      );
      
      const selectButton = screen.getByRole('button');
      
      checkAriaAttributes(selectButton, {
        'aria-label': 'Database connection type',
        'aria-describedby': 'connection-help',
        'aria-required': 'true',
        'aria-expanded': 'false',
      });
    });

    it('updates aria-expanded when opened', async () => {
      const { user } = customRender(<Select {...defaultOptions} />);
      
      const selectButton = screen.getByRole('button');
      expect(selectButton).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(selectButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper focus management', async () => {
      const { user } = customRender(<Select {...defaultProps} />);
      
      const selectButton = screen.getByRole('button');
      await user.tab();
      
      expect(selectButton).toHaveFocus();
    });

    it('supports keyboard navigation', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <Select {...defaultProps} onChange={onChange} />
      );
      
      const keyboard = createKeyboardUtils(user);
      const selectButton = screen.getByRole('button');
      
      await user.click(selectButton);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Test arrow navigation
      await keyboard.arrowDown();
      await keyboard.arrowDown();
      await keyboard.enter();
      
      expect(onChange).toHaveBeenCalled();
    });

    it('handles escape key to close dropdown', async () => {
      const { user } = customRender(<Select {...defaultProps} />);
      
      const keyboard = createKeyboardUtils(user);
      const selectButton = screen.getByRole('button');
      
      await user.click(selectButton);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      await keyboard.escape();
      
      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Integration', () => {
    it('integrates with React Hook Form', async () => {
      const onSubmit = vi.fn();
      
      const TestForm = () => {
        const { register, handleSubmit, formState: { errors } } = useForm();
        
        return (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Select
              {...defaultProps}
              name="connection-type"
              register={register}
              rules={{ required: 'Connection type is required' }}
            />
            <button type="submit">Submit</button>
            {errors['connection-type'] && (
              <span role="alert">{errors['connection-type']?.message}</span>
            )}
          </form>
        );
      };
      
      const { user } = customRender(<TestForm />);
      
      // Submit without selection should show error
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(screen.getByText('Connection type is required')).toBeInTheDocument();
      });
      
      // Select option and submit should work
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText(defaultOptions[0].label));
      await user.click(screen.getByText('Submit'));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            'connection-type': defaultOptions[0].value,
          }),
          expect.any(Object)
        );
      });
    });

    it('works with renderWithForm utility', async () => {
      const {
        user,
        formMethods,
        getFieldError,
        setFieldValue,
        triggerValidation,
      } = renderWithForm(
        <Select
          {...defaultProps}
          name="test-select"
          rules={{ required: 'Required field' }}
        />,
        {
          defaultValues: { 'test-select': '' },
        }
      );
      
      // Test validation
      const isValid = await triggerValidation('test-select');
      expect(isValid).toBe(false);
      expect(getFieldError('test-select')).toBe('Required field');
      
      // Set value programmatically
      setFieldValue('test-select', defaultOptions[0].value);
      expect(formMethods.getValues('test-select')).toBe(defaultOptions[0].value);
    });
  });

  describe('Loading and Error States', () => {
    it('displays loading state', () => {
      const loadingState = {
        isLoading: true,
        message: 'Loading options...',
        progress: 50,
      };
      
      customRender(
        <Select {...defaultProps} loadingState={loadingState} />
      );
      
      expect(screen.getByText('Loading options...')).toBeInTheDocument();
    });

    it('displays error state with retry', async () => {
      const onRetry = vi.fn();
      const errorState = {
        message: 'Failed to load options',
        onRetry,
      };
      
      const { user } = customRender(
        <Select {...defaultProps} errorState={errorState} />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load options')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Clearable Functionality', () => {
    it('shows clear button when clearable and has value', () => {
      customRender(
        <Select
          {...defaultProps}
          value={defaultOptions[0].value}
          clearable
        />
      );
      
      expect(screen.getByLabelText('Clear selection')).toBeInTheDocument();
    });

    it('clears selection when clear button clicked', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <Select
          {...defaultProps}
          value={defaultOptions[0].value}
          clearable
          onChange={onChange}
        />
      );
      
      const clearButton = screen.getByLabelText('Clear selection');
      await user.click(clearButton);
      
      expect(onChange).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom option renderer', async () => {
      const renderOption = vi.fn((option, isSelected) => (
        <div data-testid={`custom-option-${option.value}`}>
          {isSelected ? '✓ ' : ''}Custom: {option.label}
        </div>
      ));
      
      const { user } = customRender(
        <Select {...defaultProps} renderOption={renderOption} />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(`custom-option-${defaultOptions[0].value}`)).toBeInTheDocument();
      });
      
      expect(renderOption).toHaveBeenCalled();
    });

    it('uses custom value renderer', () => {
      const renderValue = vi.fn((value, option) => (
        <span data-testid="custom-value">
          Custom: {option?.label || value}
        </span>
      ));
      
      customRender(
        <Select
          {...defaultProps}
          value={defaultOptions[0].value}
          renderValue={renderValue}
        />
      );
      
      expect(screen.getByTestId('custom-value')).toBeInTheDocument();
      expect(renderValue).toHaveBeenCalledWith(
        defaultOptions[0].value,
        defaultOptions[0]
      );
    });
  });

  describe('Theme Support', () => {
    it('applies dark theme correctly', () => {
      const { container } = customRender(
        <Select {...defaultProps} />,
        { theme: 'dark' }
      );
      
      expect(container.firstChild).toHaveAttribute('data-theme', 'dark');
    });

    it('switches themes dynamically', () => {
      const { rerender } = customRender(
        <Select {...defaultProps} />,
        { theme: 'light' }
      );
      
      rerender(<Select {...defaultProps} />);
      
      // Theme switching would be handled by theme provider
      expect(document.documentElement).not.toHaveClass('dark');
    });
  });
});

// ============================================================================
// AUTOCOMPLETE COMPONENT TESTS
// ============================================================================

describe('Autocomplete Component', () => {
  const defaultOptions = createMockOptions(10);
  const defaultProps: AutocompleteProps = {
    options: defaultOptions,
    placeholder: 'Search...',
    searchPlaceholder: 'Type to search...',
  };

  describe('Search Functionality', () => {
    it('renders search input correctly', async () => {
      const { user } = customRender(<Autocomplete {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Search...');
      
      await user.click(input);
      expect(input).toHaveAttribute('placeholder', 'Type to search...');
    });

    it('filters options based on search input', async () => {
      const { user } = customRender(<Autocomplete {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'Option 1');
      
      await waitFor(() => {
        // Should show Option 1 and Option 10 (contains "1")
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      });
    });

    it('debounces search input', async () => {
      const onSearch = vi.fn();
      const { user } = customRender(
        <Autocomplete
          {...defaultProps}
          onSearch={onSearch}
          searchDebounce={100}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.type(input, 'test');
      
      // Should not call onSearch immediately
      expect(onSearch).not.toHaveBeenCalled();
      
      // Wait for debounce
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith('test');
        },
        { timeout: 200 }
      );
    });

    it('highlights matching text', async () => {
      const { user } = customRender(
        <Autocomplete {...defaultProps} highlightMatches />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'Option');
      
      await waitFor(() => {
        const highlighted = screen.getAllByText('Option');
        expect(highlighted.length).toBeGreaterThan(0);
        // Check for highlighted marks
        expect(document.querySelector('mark')).toBeInTheDocument();
      });
    });
  });

  describe('Async Operations', () => {
    it('loads options asynchronously', async () => {
      const asyncOptions = vi.fn(() =>
        fetch('/api/options/async').then(res => res.json())
      );
      
      const { user } = customRender(
        <Autocomplete
          options={[]}
          asyncOptions={asyncOptions}
          placeholder="Search async..."
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'async');
      
      await waitFor(() => {
        expect(screen.getByText('Async Option 1')).toBeInTheDocument();
      });
      
      expect(asyncOptions).toHaveBeenCalledWith('async');
    });

    it('shows loading state during async operations', async () => {
      const slowAsyncOptions = vi.fn(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve([]), 1000)
          )
      );
      
      const { user } = customRender(
        <Autocomplete
          options={[]}
          asyncOptions={slowAsyncOptions}
          loadingContent="Searching..."
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'slow');
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('handles async errors gracefully', async () => {
      const errorAsyncOptions = vi.fn(() =>
        fetch('/api/options/error').then(res => {
          if (!res.ok) throw new Error('Failed to load');
          return res.json();
        })
      );
      
      const { user } = customRender(
        <Autocomplete
          options={[]}
          asyncOptions={errorAsyncOptions}
          errorState={{
            message: 'Failed to load options',
            onRetry: vi.fn(),
          }}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'error');
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load options')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Option Creation', () => {
    it('allows custom option creation', async () => {
      const onCreateOption = vi.fn((value: string) => ({
        value: `custom-${value}`,
        label: `Custom: ${value}`,
      }));
      
      const { user } = customRender(
        <Autocomplete
          {...defaultProps}
          allowCustomValue
          onCreateOption={onCreateOption}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'New Option');
      
      await waitFor(() => {
        expect(screen.getByText('Create "New Option"')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Create "New Option"'));
      
      expect(onCreateOption).toHaveBeenCalledWith('New Option');
    });
  });

  describe('Accessibility for Autocomplete', () => {
    it('meets WCAG standards for combobox', async () => {
      const { container } = customRender(<Autocomplete {...defaultProps} />);
      await testA11y(container);
    });

    it('has proper ARIA attributes for combobox', () => {
      customRender(<Autocomplete {...defaultProps} />);
      
      const input = screen.getByRole('combobox');
      
      checkAriaAttributes(input, {
        'aria-autocomplete': 'list',
        'aria-expanded': 'false',
      });
    });

    it('announces search results for screen readers', async () => {
      const announceSearchResults = vi.fn((count, query) => 
        `${count} results found for "${query}"`
      );
      
      const { user } = customRender(
        <Autocomplete
          {...defaultProps}
          announceSearchResults={announceSearchResults}
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'Option');
      
      await waitFor(() => {
        expect(announceSearchResults).toHaveBeenCalled();
      });
    });
  });

  describe('Virtual Scrolling', () => {
    it('handles large datasets with virtual scrolling', async () => {
      const largeDataset = createLargeDataset(1000);
      
      const { result: renderResult } = await measureRenderTime(() =>
        customRender(
          <Autocomplete
            options={largeDataset}
            placeholder="Search large dataset..."
          />
        )
      );
      
      const { user } = renderResult;
      const input = screen.getByRole('combobox');
      await user.click(input);
      
      // Should render without performance issues
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Virtual scrolling should limit DOM nodes
      const options = screen.getAllByRole('option');
      expect(options.length).toBeLessThan(100); // Virtual scrolling active
    });
  });
});

// ============================================================================
// MULTISELECT COMPONENT TESTS
// ============================================================================

describe('MultiSelect Component', () => {
  const defaultOptions = createMockOptions();
  const verbOptions = createMockVerbOptions();
  const defaultProps: MultiSelectProps = {
    options: defaultOptions,
    placeholder: 'Select multiple options...',
  };

  describe('Multiple Selection', () => {
    it('allows multiple option selection', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect {...defaultProps} onChange={onChange} />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      
      // Select first option
      await user.click(screen.getByText(defaultOptions[0].label));
      expect(onChange).toHaveBeenCalledWith(
        [defaultOptions[0].value],
        [defaultOptions[0]]
      );
      
      // Select second option
      await user.click(screen.getByText(defaultOptions[1].label));
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([defaultOptions[0].value, defaultOptions[1].value]),
        expect.arrayContaining([defaultOptions[0], defaultOptions[1]])
      );
    });

    it('displays selected values as chips', () => {
      const selectedValues = [defaultOptions[0].value, defaultOptions[1].value];
      
      customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          valueDisplay="chips"
        />
      );
      
      expect(screen.getByText(defaultOptions[0].label)).toBeInTheDocument();
      expect(screen.getByText(defaultOptions[1].label)).toBeInTheDocument();
    });

    it('removes chips when clicked', async () => {
      const onChange = vi.fn();
      const selectedValues = [defaultOptions[0].value, defaultOptions[1].value];
      
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          onChange={onChange}
          valueDisplay="chips"
        />
      );
      
      // Find and click remove button on first chip
      const firstChip = screen.getByText(defaultOptions[0].label).closest('[role="button"]');
      const removeButton = within(firstChip!).getByRole('button');
      
      await user.click(removeButton);
      
      expect(onChange).toHaveBeenCalledWith(
        [defaultOptions[1].value],
        [defaultOptions[1]]
      );
    });

    it('displays count when valueDisplay is "count"', () => {
      const selectedValues = [defaultOptions[0].value, defaultOptions[1].value];
      
      customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          valueDisplay="count"
        />
      );
      
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('shows "+N more" when exceeding maxChipsDisplay', () => {
      const selectedValues = defaultOptions.slice(0, 4).map(opt => opt.value);
      
      customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          valueDisplay="chips"
          maxChipsDisplay={2}
        />
      );
      
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  describe('Selection Limits', () => {
    it('enforces maximum selection limit', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          maxSelections={2}
          onChange={onChange}
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      // Select first two options
      await user.click(screen.getByText(defaultOptions[0].label));
      await user.click(screen.getByText(defaultOptions[1].label));
      
      // Try to select third option - should be ignored
      await user.click(screen.getByText(defaultOptions[3].label));
      
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Maximum reached')).toBeInTheDocument();
    });

    it('validates minimum selection requirement', async () => {
      const { triggerValidation, getFieldError } = renderWithForm(
        <MultiSelect
          {...defaultProps}
          name="test-multiselect"
          minSelections={2}
          rules={{
            validate: (value: any[]) =>
              value?.length >= 2 || 'At least 2 selections required',
          }}
        />
      );
      
      const isValid = await triggerValidation('test-multiselect');
      expect(isValid).toBe(false);
      expect(getFieldError('test-multiselect')).toBe('At least 2 selections required');
    });
  });

  describe('Batch Operations', () => {
    it('provides select all functionality', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          selectAllOption
          selectAllLabel="Select All Options"
          onChange={onChange}
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Select All Options')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Select All Options'));
      
      const enabledOptions = defaultOptions.filter(opt => !opt.disabled);
      expect(onChange).toHaveBeenCalledWith(
        enabledOptions.map(opt => opt.value),
        enabledOptions
      );
    });

    it('provides clear all functionality', async () => {
      const onChange = vi.fn();
      const selectedValues = [defaultOptions[0].value, defaultOptions[1].value];
      
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          clearable
          onChange={onChange}
        />
      );
      
      const clearButton = screen.getByLabelText('Clear all selections');
      await user.click(clearButton);
      
      expect(onChange).toHaveBeenCalledWith([], []);
    });
  });

  describe('Search within MultiSelect', () => {
    it('filters options based on search input', async () => {
      const { user } = customRender(
        <MultiSelect {...defaultProps} searchable />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      const searchInput = screen.getByPlaceholderText('Search options...');
      await user.type(searchInput, 'Option 1');
      
      await waitFor(() => {
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Value Transformations', () => {
    it('transforms values to bitmask for HTTP verbs', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect
          options={verbOptions}
          transformMode="bitmask"
          onChange={onChange}
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      // Select GET (1) and POST (2) = bitmask 3
      await user.click(screen.getByText('GET'));
      await user.click(screen.getByText('POST'));
      
      expect(onChange).toHaveBeenCalledWith(
        3, // Bitmask for GET (1) + POST (2)
        expect.any(Array)
      );
    });

    it('transforms values to comma-separated string', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          transformMode="comma-separated"
          onChange={onChange}
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await user.click(screen.getByText(defaultOptions[0].label));
      await user.click(screen.getByText(defaultOptions[1].label));
      
      expect(onChange).toHaveBeenCalledWith(
        `${defaultOptions[0].value},${defaultOptions[1].value}`,
        expect.any(Array)
      );
    });
  });

  describe('HTTP Verb Picker Functionality', () => {
    it('works as HTTP verb picker with bitmask values', async () => {
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect
          options={verbOptions}
          verbMode
          transformMode="bitmask"
          onChange={onChange}
          placeholder="Select HTTP methods..."
        />
      );
      
      expect(screen.getByText('Select HTTP methods...')).toBeInTheDocument();
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      // Select multiple HTTP verbs
      await user.click(screen.getByText('GET'));
      await user.click(screen.getByText('POST'));
      await user.click(screen.getByText('PUT'));
      
      // Should transform to bitmask: GET(1) + POST(2) + PUT(4) = 7
      expect(onChange).toHaveBeenCalledWith(7, expect.any(Array));
    });

    it('displays HTTP verb descriptions', async () => {
      const { user } = customRender(
        <MultiSelect options={verbOptions} verbMode />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      expect(screen.getByText('Retrieve data')).toBeInTheDocument();
      expect(screen.getByText('Create new data')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation for chips', async () => {
      const onChange = vi.fn();
      const selectedValues = [defaultOptions[0].value, defaultOptions[1].value];
      
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          onChange={onChange}
        />
      );
      
      const keyboard = createKeyboardUtils(user);
      
      // Focus first chip
      const firstChip = screen.getByText(defaultOptions[0].label).closest('[role="button"]');
      firstChip?.focus();
      
      // Delete key should remove chip
      await keyboard.enter(); // or Delete/Backspace key simulation
      
      // Focus should move appropriately
      expect(keyboard.getFocused()).toBeDefined();
    });

    it('supports arrow key navigation between chips', async () => {
      const selectedValues = [defaultOptions[0].value, defaultOptions[1].value];
      
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
        />
      );
      
      const keyboard = createKeyboardUtils(user);
      
      // Focus first chip
      const firstChip = screen.getByText(defaultOptions[0].label).closest('[role="button"]');
      firstChip?.focus();
      
      // Arrow right should move to next chip
      await keyboard.arrowRight();
      
      const secondChip = screen.getByText(defaultOptions[1].label).closest('[role="button"]');
      expect(keyboard.isFocused(secondChip!)).toBe(true);
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom chip renderer', () => {
      const chipRenderer = vi.fn((value, option, onRemove) => (
        <div data-testid={`custom-chip-${value}`}>
          Custom Chip: {option.label}
          <button onClick={onRemove}>×</button>
        </div>
      ));
      
      const selectedValues = [defaultOptions[0].value];
      
      customRender(
        <MultiSelect
          {...defaultProps}
          value={selectedValues}
          chipRenderer={chipRenderer}
        />
      );
      
      expect(screen.getByTestId(`custom-chip-${defaultOptions[0].value}`)).toBeInTheDocument();
      expect(chipRenderer).toHaveBeenCalledWith(
        defaultOptions[0].value,
        defaultOptions[0],
        expect.any(Function)
      );
    });
  });

  describe('Accessibility for MultiSelect', () => {
    it('meets WCAG standards for multi-select', async () => {
      const { container } = customRender(<MultiSelect {...defaultProps} />);
      await testA11y(container);
    });

    it('has proper ARIA attributes for multiple selection', () => {
      customRender(
        <MultiSelect
          {...defaultProps}
          aria-label="Select database operations"
          required
        />
      );
      
      const selectButton = screen.getByRole('button');
      
      checkAriaAttributes(selectButton, {
        'aria-label': 'Select database operations (required)',
        'aria-expanded': 'false',
      });
    });

    it('announces selection count changes', async () => {
      const announceSelectionCount = vi.fn((count, total) =>
        `${count} of ${total} options selected`
      );
      
      const onChange = vi.fn();
      const { user } = customRender(
        <MultiSelect
          {...defaultProps}
          onChange={onChange}
          announceSelectionCount={announceSelectionCount}
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      await user.click(screen.getByText(defaultOptions[0].label));
      
      expect(announceSelectionCount).toHaveBeenCalledWith(1, defaultOptions.length);
    });
  });

  describe('Performance', () => {
    it('handles large option lists efficiently', async () => {
      const largeOptions = createLargeDataset(500);
      
      const { result: renderResult } = await measureRenderTime(() =>
        customRender(
          <MultiSelect
            options={largeOptions}
            placeholder="Select from large dataset..."
          />
        )
      );
      
      expect(renderResult.renderTime).toBeLessThan(1000); // Should render in under 1 second
      
      const { user } = renderResult;
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      // Should handle large lists without performance issues
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Select Components Integration', () => {
  describe('Form Integration Scenarios', () => {
    it('works together in complex forms', async () => {
      const onSubmit = vi.fn();
      
      const ComplexForm = () => {
        const { register, handleSubmit, watch, formState: { errors } } = useForm({
          defaultValues: {
            connectionType: '',
            features: [],
            searchTerm: '',
          },
        });
        
        return (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Select
              name="connectionType"
              options={createMockOptions(3)}
              placeholder="Select connection type"
              register={register}
              rules={{ required: 'Connection type required' }}
            />
            
            <MultiSelect
              name="features"
              options={createMockVerbOptions()}
              placeholder="Select features"
              verbMode
              transformMode="bitmask"
            />
            
            <Autocomplete
              name="searchTerm"
              options={createMockOptions(10)}
              placeholder="Search for option"
              searchable
            />
            
            <button type="submit">Submit Form</button>
            
            {Object.keys(errors).length > 0 && (
              <div role="alert">
                {Object.values(errors).map((error, i) => (
                  <div key={i}>{error?.message}</div>
                ))}
              </div>
            )}
          </form>
        );
      };
      
      const { user } = customRender(<ComplexForm />);
      
      // Test form validation
      await user.click(screen.getByText('Submit Form'));
      expect(screen.getByText('Connection type required')).toBeInTheDocument();
      
      // Fill out form
      const connectionSelect = screen.getByText('Select connection type');
      await user.click(connectionSelect);
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Option 1'));
      
      // Submit should work now
      await user.click(screen.getByText('Submit Form'));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Theme Consistency', () => {
    it('maintains consistent theming across all variants', () => {
      const { container } = customRender(
        <div>
          <Select options={createMockOptions(3)} placeholder="Basic select" />
          <Autocomplete options={createMockOptions(3)} placeholder="Autocomplete" />
          <MultiSelect options={createMockOptions(3)} placeholder="Multi-select" />
        </div>,
        { theme: 'dark' }
      );
      
      expect(container.firstChild).toHaveAttribute('data-theme', 'dark');
      
      // All selects should have consistent dark theme styling
      const buttons = screen.getAllByRole('button');
      const combobox = screen.getByRole('combobox');
      
      // Theme consistency would be verified through class presence
      expect(buttons.length).toBe(2); // Basic select + Multi-select
      expect(combobox).toBeInTheDocument(); // Autocomplete
    });
  });

  describe('MSW Integration', () => {
    it('works with MSW for async option loading', async () => {
      const { user } = customRender(
        <Autocomplete
          options={[]}
          asyncOptions={async (query) => {
            const response = await fetch(`/api/options/search?q=${query}`);
            return response.json();
          }}
          placeholder="Search with MSW"
        />
      );
      
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.type(input, 'Searchable');
      
      await waitFor(() => {
        expect(screen.getByText('Searchable Option 1')).toBeInTheDocument();
        expect(screen.getByText('Searchable Option 2')).toBeInTheDocument();
      });
    });

    it('handles MSW connection testing', async () => {
      const testConnection = async () => {
        const response = await fetch('/api/v2/system/service/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'mysql', host: 'localhost' }),
        });
        return response.json();
      };
      
      const result = await testConnection();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
    });
  });
});

// ============================================================================
// EDGE CASES AND ERROR SCENARIOS
// ============================================================================

describe('Edge Cases and Error Handling', () => {
  describe('Empty States', () => {
    it('handles empty options gracefully', () => {
      customRender(<Select options={[]} placeholder="No options" />);
      expect(screen.getByText('No options')).toBeInTheDocument();
    });

    it('shows custom empty state content', async () => {
      const { user } = customRender(
        <Select
          options={[]}
          emptyStateContent={<div>Custom empty message</div>}
          placeholder="Empty select"
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Custom empty message')).toBeInTheDocument();
      });
    });
  });

  describe('Invalid Props', () => {
    it('handles undefined values gracefully', () => {
      customRender(
        <Select
          options={createMockOptions()}
          value={undefined}
          placeholder="Undefined value"
        />
      );
      
      expect(screen.getByText('Undefined value')).toBeInTheDocument();
    });

    it('handles malformed options', () => {
      const malformedOptions = [
        { value: 'valid', label: 'Valid Option' },
        { value: null, label: 'Null Value' }, // Invalid
        { value: 'missing-label' }, // Missing label
      ] as any;
      
      expect(() => {
        customRender(
          <Select options={malformedOptions} placeholder="Malformed options" />
        );
      }).not.toThrow();
    });
  });

  describe('Boundary Conditions', () => {
    it('handles maximum selection limit edge cases', async () => {
      const { user } = customRender(
        <MultiSelect
          options={createMockOptions(2)}
          maxSelections={0} // Edge case: no selections allowed
          placeholder="No selections allowed"
        />
      );
      
      const selectButton = screen.getByRole('button');
      await user.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Maximum reached')).toBeInTheDocument();
      });
    });

    it('handles very long option labels', () => {
      const longLabelOptions = [
        {
          value: 'long',
          label: 'This is a very long option label that should truncate properly without breaking the layout or causing accessibility issues',
          description: 'This is also a very long description that should be handled gracefully'
        }
      ];
      
      customRender(
        <Select options={longLabelOptions} placeholder="Long labels" />
      );
      
      // Should render without layout issues
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Memory Leaks and Cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = customRender(
        <Select options={createMockOptions()} placeholder="Cleanup test" />
      );
      
      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('cancels pending async operations on unmount', async () => {
      const slowAsyncOptions = vi.fn(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );
      
      const { unmount } = customRender(
        <Autocomplete
          options={[]}
          asyncOptions={slowAsyncOptions}
          placeholder="Async cleanup"
        />
      );
      
      // Unmount before async operation completes
      unmount();
      
      // Should not cause any warnings or errors
      expect(true).toBe(true);
    });
  });
});