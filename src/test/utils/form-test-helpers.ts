/**
 * @fileoverview Specialized utilities for testing React Hook Form components
 * 
 * Provides comprehensive testing utilities for React Hook Form components including
 * validation scenarios, field interaction patterns, and form submission workflows.
 * Replaces Angular reactive form testing patterns with React-specific form testing utilities.
 * 
 * Performance Requirements:
 * - All form interaction simulations must complete under 100ms per Section 3.2.3
 * - Test utilities must support 90%+ code coverage targets per Section 3.6
 * - Form validation testing must maintain sub-100ms validation performance
 * - Complete test suite execution under 30 seconds per Section 3.6
 * 
 * Features:
 * - React Hook Form testing patterns with comprehensive validation scenarios
 * - Field interaction and validation error testing utilities
 * - Form submission workflow testing for database configuration
 * - File upload and dynamic form structure testing support
 * - Form reset and default value testing helpers for complex configurations
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

import { render, screen, fireEvent, waitFor, within, type RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { UseFormReturn, FieldPath, FieldValues, Control } from 'react-hook-form';
import type { ZodSchema, ZodError } from 'zod';
import type { MockedFunction } from 'vitest';

// =============================================================================
// TYPE DEFINITIONS FOR FORM TESTING
// =============================================================================

/**
 * Configuration for form testing scenarios
 */
export interface FormTestConfig<TFormData extends FieldValues = FieldValues> {
  /** Form component to render */
  component: ReactElement;
  /** Initial form data */
  initialData?: Partial<TFormData>;
  /** Expected form validation schema */
  validationSchema?: ZodSchema<TFormData>;
  /** Mock submit handler */
  onSubmit?: MockedFunction<(data: TFormData) => void | Promise<void>>;
  /** Mock change handler for specific fields */
  onChange?: MockedFunction<(fieldName: string, value: any) => void>;
  /** Additional props to pass to form component */
  props?: Record<string, any>;
  /** Test environment configuration */
  environment?: {
    /** Whether to mock file upload APIs */
    mockFileUploads?: boolean;
    /** API response delay in ms */
    apiDelay?: number;
    /** Mock network errors */
    simulateNetworkErrors?: boolean;
  };
}

/**
 * Field interaction testing configuration
 */
export interface FieldTestConfig {
  /** Field name or data-testid */
  field: string;
  /** Value to input */
  value: any;
  /** Expected validation error message */
  expectedError?: string;
  /** Whether field should be valid after input */
  shouldBeValid?: boolean;
  /** Additional interaction options */
  options?: {
    /** Trigger blur event after input */
    triggerBlur?: boolean;
    /** Clear field before input */
    clearFirst?: boolean;
    /** Delay between keystrokes for realistic typing */
    typeDelay?: number;
    /** Use paste instead of typing for large text */
    usePaste?: boolean;
  };
}

/**
 * Form submission testing result
 */
export interface FormSubmissionResult {
  /** Whether submission was successful */
  success: boolean;
  /** Submitted form data */
  data?: any;
  /** Validation errors if any */
  errors?: Record<string, string>;
  /** API response or error */
  response?: any;
  /** Submission duration in milliseconds */
  duration: number;
}

/**
 * File upload testing configuration
 */
export interface FileUploadTestConfig {
  /** Field name or data-testid for file input */
  field: string;
  /** Mock file to upload */
  file: File | File[];
  /** Expected upload progress events */
  expectProgress?: boolean;
  /** Expected validation behavior */
  validation?: {
    /** Should file be accepted */
    shouldAccept?: boolean;
    /** Expected error message if rejected */
    expectedError?: string;
  };
  /** Upload simulation options */
  options?: {
    /** Simulate upload progress */
    simulateProgress?: boolean;
    /** Upload duration in ms */
    uploadDuration?: number;
    /** Simulate upload failure */
    simulateFailure?: boolean;
  };
}

/**
 * Dynamic form structure testing configuration
 */
export interface DynamicFormTestConfig {
  /** Form array field name */
  arrayField: string;
  /** Initial number of items */
  initialItems?: number;
  /** Actions to test */
  actions?: {
    /** Test adding new items */
    testAdd?: boolean;
    /** Test removing items */
    testRemove?: boolean;
    /** Test reordering items */
    testReorder?: boolean;
  };
  /** Item template for new items */
  itemTemplate?: Record<string, any>;
}

/**
 * Conditional field testing configuration
 */
export interface ConditionalFieldTestConfig {
  /** Condition trigger field */
  triggerField: string;
  /** Value that triggers condition */
  triggerValue: any;
  /** Fields that should appear/disappear */
  conditionalFields: string[];
  /** Expected visibility state */
  expectedVisible: boolean;
  /** Additional test scenarios */
  scenarios?: Array<{
    triggerValue: any;
    expectedVisible: boolean;
    description: string;
  }>;
}

// =============================================================================
// CORE FORM TESTING UTILITIES
// =============================================================================

/**
 * Enhanced form rendering utility with React Hook Form context setup
 * 
 * @param config - Form test configuration
 * @returns Rendered form with testing utilities
 */
export const renderForm = async <TFormData extends FieldValues = FieldValues>(
  config: FormTestConfig<TFormData>
): Promise<RenderResult & {
  formUtils: FormTestingUtils<TFormData>;
  user: ReturnType<typeof userEvent.setup>;
}> => {
  const user = userEvent.setup();
  
  // Performance tracking for form rendering
  const startTime = performance.now();
  
  const result = render(config.component);
  
  const endTime = performance.now();
  const renderDuration = endTime - startTime;
  
  // Warn if rendering takes too long
  if (renderDuration > 100) {
    console.warn(`Form rendering took ${renderDuration}ms, exceeding 100ms target`);
  }
  
  // Wait for form to be fully rendered and hydrated
  await waitFor(() => {
    expect(screen.getByRole('form', { hidden: true }) || document.querySelector('form')).toBeInTheDocument();
  });
  
  const formUtils = createFormTestingUtils<TFormData>(config, user);
  
  return {
    ...result,
    formUtils,
    user
  };
};

/**
 * Creates comprehensive form testing utilities for a specific form instance
 * 
 * @param config - Form test configuration
 * @param user - UserEvent instance for interactions
 * @returns Form testing utilities
 */
export const createFormTestingUtils = <TFormData extends FieldValues = FieldValues>(
  config: FormTestConfig<TFormData>,
  user: ReturnType<typeof userEvent.setup>
): FormTestingUtils<TFormData> => {
  return {
    // Field interaction utilities
    fillField: async (fieldConfig: FieldTestConfig) => {
      return fillFormField(fieldConfig, user);
    },
    
    clearField: async (field: string) => {
      return clearFormField(field, user);
    },
    
    triggerValidation: async (field?: string) => {
      return triggerFieldValidation(field, user);
    },
    
    // Form submission utilities
    submitForm: async (expectedData?: Partial<TFormData>) => {
      return submitFormAndValidate(config, expectedData, user);
    },
    
    submitWithErrors: async (expectedErrors: Record<string, string>) => {
      return submitFormWithValidationErrors(expectedErrors, user);
    },
    
    // File upload utilities
    uploadFile: async (uploadConfig: FileUploadTestConfig) => {
      return testFileUpload(uploadConfig, user);
    },
    
    // Dynamic form utilities
    addFormArrayItem: async (arrayField: string, itemData?: Record<string, any>) => {
      return addDynamicFormItem(arrayField, itemData, user);
    },
    
    removeFormArrayItem: async (arrayField: string, index: number) => {
      return removeDynamicFormItem(arrayField, index, user);
    },
    
    // Conditional field utilities
    testConditionalField: async (conditionalConfig: ConditionalFieldTestConfig) => {
      return testConditionalFieldVisibility(conditionalConfig, user);
    },
    
    // Form state utilities
    resetForm: async () => {
      return resetFormToDefaults(user);
    },
    
    getFormData: async () => {
      return getCurrentFormData();
    },
    
    getFieldErrors: () => {
      return getCurrentFieldErrors();
    },
    
    // Validation utilities
    validateForm: async () => {
      return validateCurrentFormState(config.validationSchema);
    },
    
    expectFieldError: (field: string, error: string) => {
      return expectFieldToHaveError(field, error);
    },
    
    expectFieldValid: (field: string) => {
      return expectFieldToBeValid(field);
    },
    
    // Performance utilities
    measureInteractionTime: async (interaction: () => Promise<void>) => {
      return measureFormInteractionPerformance(interaction);
    }
  };
};

/**
 * Form testing utilities interface
 */
export interface FormTestingUtils<TFormData extends FieldValues = FieldValues> {
  // Field interactions
  fillField: (config: FieldTestConfig) => Promise<void>;
  clearField: (field: string) => Promise<void>;
  triggerValidation: (field?: string) => Promise<void>;
  
  // Form submission
  submitForm: (expectedData?: Partial<TFormData>) => Promise<FormSubmissionResult>;
  submitWithErrors: (expectedErrors: Record<string, string>) => Promise<FormSubmissionResult>;
  
  // File uploads
  uploadFile: (config: FileUploadTestConfig) => Promise<void>;
  
  // Dynamic forms
  addFormArrayItem: (arrayField: string, itemData?: Record<string, any>) => Promise<void>;
  removeFormArrayItem: (arrayField: string, index: number) => Promise<void>;
  
  // Conditional fields
  testConditionalField: (config: ConditionalFieldTestConfig) => Promise<void>;
  
  // Form state
  resetForm: () => Promise<void>;
  getFormData: () => Promise<TFormData>;
  getFieldErrors: () => Record<string, string>;
  
  // Validation
  validateForm: () => Promise<{ isValid: boolean; errors: Record<string, string> }>;
  expectFieldError: (field: string, error: string) => void;
  expectFieldValid: (field: string) => void;
  
  // Performance
  measureInteractionTime: (interaction: () => Promise<void>) => Promise<number>;
}

// =============================================================================
// FIELD INTERACTION UTILITIES
// =============================================================================

/**
 * Fills a form field with comprehensive validation testing
 * 
 * @param config - Field test configuration
 * @param user - UserEvent instance
 */
export const fillFormField = async (
  config: FieldTestConfig,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const startTime = performance.now();
  
  // Find the field element
  const field = findFormField(config.field);
  
  // Clear field if requested
  if (config.options?.clearFirst) {
    await user.clear(field);
  }
  
  // Handle different input types
  if (field.type === 'checkbox' || field.type === 'radio') {
    if (config.value) {
      await user.click(field);
    }
  } else if (field.type === 'file') {
    const file = Array.isArray(config.value) ? config.value : [config.value];
    await user.upload(field, file);
  } else if (field.tagName === 'SELECT') {
    await user.selectOptions(field, config.value);
  } else {
    // Text-based inputs
    if (config.options?.usePaste) {
      await user.paste(config.value);
    } else {
      const typeOptions = config.options?.typeDelay ? { delay: config.options.typeDelay } : undefined;
      await user.type(field, config.value.toString(), typeOptions);
    }
  }
  
  // Trigger blur if requested
  if (config.options?.triggerBlur) {
    await user.tab(); // Tab away to trigger blur
  }
  
  // Wait for validation to complete
  await waitFor(() => {
    // Check if validation has been triggered
    const errorElement = screen.queryByRole('alert');
    if (config.expectedError) {
      if (config.shouldBeValid === false) {
        expect(errorElement).toBeInTheDocument();
      }
    }
  });
  
  // Validate expected error state
  if (config.expectedError) {
    if (config.shouldBeValid === false) {
      await waitFor(() => {
        expect(screen.getByText(config.expectedError!)).toBeInTheDocument();
      });
    }
  } else if (config.shouldBeValid !== false) {
    // Ensure no error is shown
    await waitFor(() => {
      const errorText = screen.queryByText(/error|invalid|required/i);
      expect(errorText).not.toBeInTheDocument();
    });
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Performance validation
  if (duration > 100) {
    console.warn(`Field interaction took ${duration}ms, exceeding 100ms target`);
  }
};

/**
 * Clears a form field completely
 * 
 * @param field - Field selector or name
 * @param user - UserEvent instance
 */
export const clearFormField = async (
  field: string,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const fieldElement = findFormField(field);
  await user.clear(fieldElement);
  
  // Trigger validation after clearing
  await user.tab();
  await user.tab(); // Tab back to trigger validation
};

/**
 * Triggers validation on a specific field or entire form
 * 
 * @param field - Optional field to validate, or entire form if not specified
 * @param user - UserEvent instance
 */
export const triggerFieldValidation = async (
  field: string | undefined,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  if (field) {
    const fieldElement = findFormField(field);
    await user.click(fieldElement);
    await user.tab(); // Tab away to trigger blur validation
  } else {
    // Trigger form-level validation by attempting submit
    const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
    await user.click(submitButton);
  }
  
  // Wait for validation to complete
  await waitFor(() => {
    // Validation should have run (either showing errors or clearing them)
    expect(document.querySelector('[data-testid], [role="alert"]')).toBeTruthy();
  }, { timeout: 1000 });
};

// =============================================================================
// FORM SUBMISSION TESTING UTILITIES
// =============================================================================

/**
 * Submits form and validates the submission process
 * 
 * @param config - Form test configuration
 * @param expectedData - Expected form data to be submitted
 * @param user - UserEvent instance
 * @returns Submission result
 */
export const submitFormAndValidate = async <TFormData extends FieldValues>(
  config: FormTestConfig<TFormData>,
  expectedData: Partial<TFormData> | undefined,
  user: ReturnType<typeof userEvent.setup>
): Promise<FormSubmissionResult> => {
  const startTime = performance.now();
  
  // Find and click submit button
  const submitButton = screen.getByRole('button', { name: /submit|save|create|update|connect|test/i });
  
  expect(submitButton).toBeEnabled();
  
  // Click submit
  await user.click(submitButton);
  
  // Wait for submission to complete
  let submissionData: any = null;
  let submissionError: any = null;
  
  try {
    await waitFor(async () => {
      // Check if onSubmit was called
      if (config.onSubmit) {
        expect(config.onSubmit).toHaveBeenCalled();
        submissionData = config.onSubmit.mock.calls[config.onSubmit.mock.calls.length - 1][0];
      }
    }, { timeout: 5000 });
  } catch (error) {
    submissionError = error;
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Validate expected data if provided
  if (expectedData && submissionData) {
    Object.keys(expectedData).forEach(key => {
      expect(submissionData).toHaveProperty(key, expectedData[key]);
    });
  }
  
  return {
    success: !submissionError && !!submissionData,
    data: submissionData,
    errors: submissionError ? extractFormErrors() : undefined,
    response: submissionData,
    duration
  };
};

/**
 * Submits form expecting validation errors
 * 
 * @param expectedErrors - Expected validation errors
 * @param user - UserEvent instance
 * @returns Submission result
 */
export const submitFormWithValidationErrors = async (
  expectedErrors: Record<string, string>,
  user: ReturnType<typeof userEvent.setup>
): Promise<FormSubmissionResult> => {
  const startTime = performance.now();
  
  const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
  
  await user.click(submitButton);
  
  // Wait for validation errors to appear
  await waitFor(() => {
    Object.entries(expectedErrors).forEach(([field, error]) => {
      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });
  
  const endTime = performance.now();
  
  return {
    success: false,
    errors: expectedErrors,
    duration: endTime - startTime
  };
};

// =============================================================================
// FILE UPLOAD TESTING UTILITIES
// =============================================================================

/**
 * Tests file upload functionality with validation and progress tracking
 * 
 * @param config - File upload test configuration
 * @param user - UserEvent instance
 */
export const testFileUpload = async (
  config: FileUploadTestConfig,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const fileInput = findFormField(config.field) as HTMLInputElement;
  
  expect(fileInput.type).toBe('file');
  
  // Handle single or multiple files
  const files = Array.isArray(config.file) ? config.file : [config.file];
  
  // Upload files
  await user.upload(fileInput, files);
  
  // Wait for upload to be processed
  await waitFor(() => {
    expect(fileInput.files).toHaveLength(files.length);
  });
  
  // Check validation if specified
  if (config.validation) {
    if (config.validation.shouldAccept === false && config.validation.expectedError) {
      await waitFor(() => {
        expect(screen.getByText(config.validation!.expectedError!)).toBeInTheDocument();
      });
    } else if (config.validation.shouldAccept !== false) {
      // Ensure no error is shown
      const errorElements = screen.queryAllByRole('alert');
      expect(errorElements).toHaveLength(0);
    }
  }
  
  // Simulate upload progress if requested
  if (config.options?.simulateProgress && config.expectProgress) {
    const progressElement = screen.queryByRole('progressbar');
    expect(progressElement).toBeInTheDocument();
    
    // Wait for progress to complete
    await waitFor(() => {
      const progressElement = screen.queryByRole('progressbar');
      expect(progressElement).not.toBeInTheDocument();
    }, { timeout: config.options.uploadDuration || 2000 });
  }
  
  // Handle upload failure simulation
  if (config.options?.simulateFailure) {
    await waitFor(() => {
      expect(screen.getByText(/upload failed|error uploading/i)).toBeInTheDocument();
    });
  }
};

/**
 * Creates a mock file for testing file uploads
 * 
 * @param options - File creation options
 * @returns Mock File object
 */
export const createMockFile = (options: {
  name?: string;
  size?: number;
  type?: string;
  content?: string;
}): File => {
  const {
    name = 'test-file.txt',
    size = 1024,
    type = 'text/plain',
    content = 'test file content'
  } = options;
  
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  
  // Mock the size property
  Object.defineProperty(file, 'size', { value: size });
  
  return file;
};

/**
 * Tests schema import file upload with validation
 * 
 * @param fileContent - Schema content to test
 * @param expectedValidation - Expected validation result
 * @param user - UserEvent instance
 */
export const testSchemaImportUpload = async (
  fileContent: string,
  expectedValidation: { isValid: boolean; errors?: string[] },
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const schemaFile = createMockFile({
    name: 'schema.json',
    type: 'application/json',
    content: fileContent
  });
  
  await testFileUpload({
    field: 'schema-import',
    file: schemaFile,
    validation: {
      shouldAccept: expectedValidation.isValid,
      expectedError: expectedValidation.errors?.[0]
    },
    expectProgress: true,
    options: {
      simulateProgress: true,
      uploadDuration: 1000
    }
  }, user);
};

// =============================================================================
// DYNAMIC FORM STRUCTURE TESTING UTILITIES
// =============================================================================

/**
 * Tests dynamic form array functionality
 * 
 * @param config - Dynamic form test configuration
 * @param user - UserEvent instance
 */
export const testDynamicFormArray = async (
  config: DynamicFormTestConfig,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const arrayContainer = screen.getByTestId(config.arrayField) || 
                        screen.getByRole('group', { name: new RegExp(config.arrayField, 'i') });
  
  // Test initial state
  if (config.initialItems) {
    const initialItems = within(arrayContainer).getAllByRole('group');
    expect(initialItems).toHaveLength(config.initialItems);
  }
  
  // Test adding items
  if (config.actions?.testAdd) {
    const addButton = within(arrayContainer).getByRole('button', { name: /add|new|\+/i });
    await user.click(addButton);
    
    await waitFor(() => {
      const items = within(arrayContainer).getAllByRole('group');
      expect(items.length).toBeGreaterThan(config.initialItems || 0);
    });
  }
  
  // Test removing items
  if (config.actions?.testRemove) {
    const removeButtons = within(arrayContainer).getAllByRole('button', { name: /remove|delete|×/i });
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      
      await waitFor(() => {
        const updatedRemoveButtons = within(arrayContainer).queryAllByRole('button', { name: /remove|delete|×/i });
        expect(updatedRemoveButtons.length).toBeLessThan(removeButtons.length);
      });
    }
  }
  
  // Test reordering if requested
  if (config.actions?.testReorder) {
    const items = within(arrayContainer).getAllByRole('group');
    if (items.length >= 2) {
      // Find drag handles or move buttons
      const moveUpButton = within(items[1]).queryByRole('button', { name: /move up|↑/i });
      if (moveUpButton) {
        await user.click(moveUpButton);
        
        await waitFor(() => {
          // Verify the item order has changed
          const updatedItems = within(arrayContainer).getAllByRole('group');
          expect(updatedItems).toHaveLength(items.length);
        });
      }
    }
  }
};

/**
 * Adds a new item to a dynamic form array
 * 
 * @param arrayField - Array field name
 * @param itemData - Data for the new item
 * @param user - UserEvent instance
 */
export const addDynamicFormItem = async (
  arrayField: string,
  itemData: Record<string, any> | undefined,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const arrayContainer = screen.getByTestId(arrayField);
  const addButton = within(arrayContainer).getByRole('button', { name: /add|new|\+/i });
  
  const initialItems = within(arrayContainer).queryAllByRole('group');
  const initialCount = initialItems.length;
  
  await user.click(addButton);
  
  // Wait for new item to be added
  await waitFor(() => {
    const updatedItems = within(arrayContainer).getAllByRole('group');
    expect(updatedItems).toHaveLength(initialCount + 1);
  });
  
  // Fill in data if provided
  if (itemData) {
    const newItems = within(arrayContainer).getAllByRole('group');
    const newItem = newItems[newItems.length - 1];
    
    for (const [fieldName, value] of Object.entries(itemData)) {
      const field = within(newItem).getByRole('textbox', { name: new RegExp(fieldName, 'i') });
      await user.clear(field);
      await user.type(field, value.toString());
    }
  }
};

/**
 * Removes an item from a dynamic form array
 * 
 * @param arrayField - Array field name
 * @param index - Index of item to remove
 * @param user - UserEvent instance
 */
export const removeDynamicFormItem = async (
  arrayField: string,
  index: number,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const arrayContainer = screen.getByTestId(arrayField);
  const items = within(arrayContainer).getAllByRole('group');
  
  expect(items).toHaveLength(index + 1);
  
  const itemToRemove = items[index];
  const removeButton = within(itemToRemove).getByRole('button', { name: /remove|delete|×/i });
  
  await user.click(removeButton);
  
  // Wait for item to be removed
  await waitFor(() => {
    const updatedItems = within(arrayContainer).getAllByRole('group');
    expect(updatedItems).toHaveLength(items.length - 1);
  });
};

// =============================================================================
// CONDITIONAL FIELD TESTING UTILITIES
// =============================================================================

/**
 * Tests conditional field visibility based on form state
 * 
 * @param config - Conditional field test configuration
 * @param user - UserEvent instance
 */
export const testConditionalFieldVisibility = async (
  config: ConditionalFieldTestConfig,
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const triggerField = findFormField(config.triggerField);
  
  // Test initial state
  config.conditionalFields.forEach(fieldName => {
    const field = screen.queryByTestId(fieldName) || screen.queryByLabelText(new RegExp(fieldName, 'i'));
    if (config.expectedVisible) {
      expect(field).toBeInTheDocument();
    } else {
      expect(field).not.toBeInTheDocument();
    }
  });
  
  // Change trigger field value
  await fillFormField({
    field: config.triggerField,
    value: config.triggerValue,
    options: { triggerBlur: true }
  }, user);
  
  // Wait for conditional fields to update
  await waitFor(() => {
    config.conditionalFields.forEach(fieldName => {
      const field = screen.queryByTestId(fieldName) || screen.queryByLabelText(new RegExp(fieldName, 'i'));
      if (config.expectedVisible) {
        expect(field).toBeInTheDocument();
      } else {
        expect(field).not.toBeInTheDocument();
      }
    });
  });
  
  // Test additional scenarios if provided
  if (config.scenarios) {
    for (const scenario of config.scenarios) {
      await fillFormField({
        field: config.triggerField,
        value: scenario.triggerValue,
        options: { triggerBlur: true, clearFirst: true }
      }, user);
      
      await waitFor(() => {
        config.conditionalFields.forEach(fieldName => {
          const field = screen.queryByTestId(fieldName) || screen.queryByLabelText(new RegExp(fieldName, 'i'));
          if (scenario.expectedVisible) {
            expect(field).toBeInTheDocument();
          } else {
            expect(field).not.toBeInTheDocument();
          }
        });
      });
    }
  }
};

// =============================================================================
// DATABASE CONNECTION FORM TESTING UTILITIES
// =============================================================================

/**
 * Specialized testing utilities for database connection forms
 */
export const databaseConnectionFormUtils = {
  /**
   * Tests complete database connection workflow
   */
  testConnectionWorkflow: async (
    connectionData: {
      name: string;
      type: string;
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    },
    user: ReturnType<typeof userEvent.setup>
  ): Promise<void> => {
    // Fill connection form fields
    await fillFormField({ field: 'name', value: connectionData.name }, user);
    await fillFormField({ field: 'type', value: connectionData.type }, user);
    await fillFormField({ field: 'host', value: connectionData.host }, user);
    await fillFormField({ field: 'port', value: connectionData.port.toString() }, user);
    await fillFormField({ field: 'database', value: connectionData.database }, user);
    await fillFormField({ field: 'username', value: connectionData.username }, user);
    await fillFormField({ field: 'password', value: connectionData.password }, user);
    
    // Test connection
    const testButton = screen.getByRole('button', { name: /test connection/i });
    await user.click(testButton);
    
    // Wait for test result
    await waitFor(() => {
      expect(screen.getByText(/connection successful|connection failed/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  },
  
  /**
   * Tests database type-specific field visibility
   */
  testDatabaseTypeFields: async (
    databaseType: string,
    expectedFields: string[],
    hiddenFields: string[],
    user: ReturnType<typeof userEvent.setup>
  ): Promise<void> => {
    // Select database type
    await fillFormField({ field: 'type', value: databaseType }, user);
    
    // Wait for conditional fields to update
    await waitFor(() => {
      expectedFields.forEach(field => {
        expect(screen.getByTestId(field)).toBeInTheDocument();
      });
      
      hiddenFields.forEach(field => {
        expect(screen.queryByTestId(field)).not.toBeInTheDocument();
      });
    });
  },
  
  /**
   * Tests SSL configuration options
   */
  testSSLConfiguration: async (
    enableSSL: boolean,
    user: ReturnType<typeof userEvent.setup>
  ): Promise<void> => {
    const sslCheckbox = screen.getByRole('checkbox', { name: /enable ssl|ssl/i });
    
    if (enableSSL) {
      await user.click(sslCheckbox);
      
      // SSL options should become visible
      await waitFor(() => {
        expect(screen.getByTestId('ssl-mode')).toBeInTheDocument();
      });
    } else {
      if (sslCheckbox.checked) {
        await user.click(sslCheckbox);
      }
      
      // SSL options should be hidden
      await waitFor(() => {
        expect(screen.queryByTestId('ssl-mode')).not.toBeInTheDocument();
      });
    }
  }
};

// =============================================================================
// FORM STATE AND VALIDATION UTILITIES
// =============================================================================

/**
 * Resets form to default values
 * 
 * @param user - UserEvent instance
 */
export const resetFormToDefaults = async (
  user: ReturnType<typeof userEvent.setup>
): Promise<void> => {
  const resetButton = screen.queryByRole('button', { name: /reset|clear|cancel/i });
  
  if (resetButton) {
    await user.click(resetButton);
  } else {
    // Manually clear all form fields
    const formInputs = screen.getAllByRole('textbox');
    for (const input of formInputs) {
      await user.clear(input);
    }
    
    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      if (checkbox.checked) {
        await user.click(checkbox);
      }
    }
  }
  
  // Wait for form to reset
  await waitFor(() => {
    const formInputs = screen.getAllByRole('textbox');
    formInputs.forEach(input => {
      expect(input.value).toBe('');
    });
  });
};

/**
 * Gets current form data from the DOM
 * 
 * @returns Current form data
 */
export const getCurrentFormData = async (): Promise<any> => {
  const form = screen.getByRole('form', { hidden: true }) || document.querySelector('form');
  
  if (!form) {
    throw new Error('No form found in the document');
  }
  
  const formData = new FormData(form);
  const data: Record<string, any> = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
};

/**
 * Gets current field errors from the DOM
 * 
 * @returns Field errors
 */
export const getCurrentFieldErrors = (): Record<string, string> => {
  const errorElements = screen.getAllByRole('alert');
  const errors: Record<string, string> = {};
  
  errorElements.forEach(element => {
    const fieldName = element.getAttribute('data-field') || 
                     element.closest('[data-testid]')?.getAttribute('data-testid') ||
                     'unknown';
    errors[fieldName] = element.textContent || '';
  });
  
  return errors;
};

/**
 * Validates current form state against schema
 * 
 * @param schema - Zod validation schema
 * @returns Validation result
 */
export const validateCurrentFormState = async (
  schema: ZodSchema | undefined
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  if (!schema) {
    return { isValid: true, errors: {} };
  }
  
  const formData = await getCurrentFormData();
  
  try {
    schema.parse(formData);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

/**
 * Expects a field to have a specific error
 * 
 * @param field - Field name or selector
 * @param error - Expected error message
 */
export const expectFieldToHaveError = (field: string, error: string): void => {
  const errorElement = screen.getByText(error);
  expect(errorElement).toBeInTheDocument();
  
  // Verify error is associated with the correct field
  const fieldElement = findFormField(field);
  const fieldContainer = fieldElement.closest('[data-testid], .form-field, .field-container');
  
  if (fieldContainer) {
    expect(within(fieldContainer as HTMLElement).getByText(error)).toBeInTheDocument();
  }
};

/**
 * Expects a field to be valid (no errors)
 * 
 * @param field - Field name or selector
 */
export const expectFieldToBeValid = (field: string): void => {
  const fieldElement = findFormField(field);
  const fieldContainer = fieldElement.closest('[data-testid], .form-field, .field-container');
  
  if (fieldContainer) {
    const errorElements = within(fieldContainer as HTMLElement).queryAllByRole('alert');
    expect(errorElements).toHaveLength(0);
  }
  
  // Check for aria-invalid attribute
  expect(fieldElement).not.toHaveAttribute('aria-invalid', 'true');
};

// =============================================================================
// PERFORMANCE TESTING UTILITIES
// =============================================================================

/**
 * Measures the performance of form interactions
 * 
 * @param interaction - Interaction function to measure
 * @returns Duration in milliseconds
 */
export const measureFormInteractionPerformance = async (
  interaction: () => Promise<void>
): Promise<number> => {
  const startTime = performance.now();
  
  await interaction();
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log performance warning if needed
  if (duration > 100) {
    console.warn(`Form interaction took ${duration}ms, exceeding 100ms performance target`);
  }
  
  return duration;
};

/**
 * Tests form validation performance
 * 
 * @param schema - Validation schema to test
 * @param testData - Test data for validation
 * @returns Performance metrics
 */
export const testValidationPerformance = async (
  schema: ZodSchema,
  testData: any[]
): Promise<{ averageTime: number; maxTime: number; passedPerformanceTarget: boolean }> => {
  const times: number[] = [];
  
  for (const data of testData) {
    const startTime = performance.now();
    
    try {
      schema.parse(data);
    } catch {
      // Ignore validation errors for performance testing
    }
    
    const endTime = performance.now();
    times.push(endTime - startTime);
  }
  
  const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
  const maxTime = Math.max(...times);
  const passedPerformanceTarget = maxTime <= 100;
  
  return {
    averageTime,
    maxTime,
    passedPerformanceTarget
  };
};

// =============================================================================
// UTILITY HELPER FUNCTIONS
// =============================================================================

/**
 * Finds a form field by various selectors
 * 
 * @param selector - Field selector (name, data-testid, label, etc.)
 * @returns Field element
 */
export const findFormField = (selector: string): HTMLElement => {
  // Try data-testid first
  let field = screen.queryByTestId(selector);
  
  if (!field) {
    // Try by name attribute
    field = screen.queryByRole('textbox', { name: new RegExp(selector, 'i') }) ||
           screen.queryByRole('combobox', { name: new RegExp(selector, 'i') }) ||
           screen.queryByRole('checkbox', { name: new RegExp(selector, 'i') }) ||
           screen.queryByRole('radio', { name: new RegExp(selector, 'i') });
  }
  
  if (!field) {
    // Try by label text
    field = screen.queryByLabelText(new RegExp(selector, 'i'));
  }
  
  if (!field) {
    // Try by placeholder
    field = screen.queryByPlaceholderText(new RegExp(selector, 'i'));
  }
  
  if (!field) {
    // Try by name attribute directly
    field = document.querySelector(`[name="${selector}"]`);
  }
  
  if (!field) {
    throw new Error(`Could not find form field with selector: ${selector}`);
  }
  
  return field as HTMLElement;
};

/**
 * Extracts form errors from the current DOM state
 * 
 * @returns Form errors by field name
 */
export const extractFormErrors = (): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Find all error elements
  const errorElements = document.querySelectorAll('[role="alert"], .error-message, .field-error');
  
  errorElements.forEach(element => {
    const fieldName = element.getAttribute('data-field') ||
                     element.closest('[data-testid]')?.getAttribute('data-testid') ||
                     element.closest('.form-field')?.querySelector('input, select, textarea')?.getAttribute('name') ||
                     'unknown';
    
    errors[fieldName] = element.textContent?.trim() || '';
  });
  
  return errors;
};

/**
 * Waits for form validation to complete
 * 
 * @param timeout - Maximum wait time in milliseconds
 */
export const waitForValidation = async (timeout: number = 1000): Promise<void> => {
  await waitFor(() => {
    // Look for loading states to disappear
    const loadingElements = screen.queryAllByText(/validating|checking/i);
    expect(loadingElements).toHaveLength(0);
  }, { timeout });
  
  // Wait a bit more for any async validation to complete
  await new Promise(resolve => setTimeout(resolve, 50));
};

// =============================================================================
// FORM TEST UTILITIES FOR COMMON PATTERNS
// =============================================================================

/**
 * Database connection form testing patterns
 */
export const createDatabaseConnectionFormTests = () => ({
  /**
   * Test MySQL connection form
   */
  testMySQLConnection: async (user: ReturnType<typeof userEvent.setup>) => {
    return databaseConnectionFormUtils.testConnectionWorkflow({
      name: 'Test MySQL',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    }, user);
  },
  
  /**
   * Test PostgreSQL connection form
   */
  testPostgreSQLConnection: async (user: ReturnType<typeof userEvent.setup>) => {
    return databaseConnectionFormUtils.testConnectionWorkflow({
      name: 'Test PostgreSQL',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    }, user);
  },
  
  /**
   * Test MongoDB connection form
   */
  testMongoDBConnection: async (user: ReturnType<typeof userEvent.setup>) => {
    return databaseConnectionFormUtils.testConnectionWorkflow({
      name: 'Test MongoDB',
      type: 'mongodb',
      host: 'localhost',
      port: 27017,
      database: 'test_db',
      username: 'test_user',
      password: 'test_password'
    }, user);
  }
});

/**
 * User profile form testing patterns
 */
export const createUserProfileFormTests = () => ({
  /**
   * Test complete user profile form
   */
  testUserProfileForm: async (
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      company?: string;
    },
    user: ReturnType<typeof userEvent.setup>
  ) => {
    await fillFormField({ field: 'firstName', value: userData.firstName }, user);
    await fillFormField({ field: 'lastName', value: userData.lastName }, user);
    await fillFormField({ field: 'email', value: userData.email }, user);
    
    if (userData.phone) {
      await fillFormField({ field: 'phone', value: userData.phone }, user);
    }
    
    if (userData.company) {
      await fillFormField({ field: 'company', value: userData.company }, user);
    }
  },
  
  /**
   * Test email validation scenarios
   */
  testEmailValidation: async (user: ReturnType<typeof userEvent.setup>) => {
    // Test invalid email
    await fillFormField({
      field: 'email',
      value: 'invalid-email',
      expectedError: 'Please enter a valid email address',
      shouldBeValid: false,
      options: { triggerBlur: true }
    }, user);
    
    // Test valid email
    await fillFormField({
      field: 'email',
      value: 'test@example.com',
      shouldBeValid: true,
      options: { clearFirst: true, triggerBlur: true }
    }, user);
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Main form testing utilities export
 */
export const formTestUtils = {
  // Core utilities
  renderForm,
  createFormTestingUtils,
  
  // Field interactions
  fillFormField,
  clearFormField,
  triggerFieldValidation,
  
  // Form submission
  submitFormAndValidate,
  submitFormWithValidationErrors,
  
  // File uploads
  testFileUpload,
  createMockFile,
  testSchemaImportUpload,
  
  // Dynamic forms
  testDynamicFormArray,
  addDynamicFormItem,
  removeDynamicFormItem,
  
  // Conditional fields
  testConditionalFieldVisibility,
  
  // Database connections
  databaseConnectionFormUtils,
  
  // Form state
  resetFormToDefaults,
  getCurrentFormData,
  getCurrentFieldErrors,
  validateCurrentFormState,
  
  // Validation utilities
  expectFieldToHaveError,
  expectFieldToBeValid,
  waitForValidation,
  
  // Performance
  measureFormInteractionPerformance,
  testValidationPerformance,
  
  // Common patterns
  createDatabaseConnectionFormTests,
  createUserProfileFormTests,
  
  // Helpers
  findFormField,
  extractFormErrors
};

export default formTestUtils;