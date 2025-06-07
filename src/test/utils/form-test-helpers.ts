/**
 * @fileoverview Specialized utilities for testing React Hook Form components
 * 
 * Provides comprehensive testing patterns for React Hook Form integration with Zod schema validation,
 * replacing Angular reactive form testing patterns with React-specific form testing utilities.
 * Supports database configuration forms, multi-step wizards, dynamic field structures, file uploads,
 * and complex validation scenarios required for the DreamFactory Admin Interface.
 * 
 * Key Features:
 * - React Hook Form testing patterns with comprehensive validation scenarios
 * - Field interaction and validation error testing utilities
 * - Form submission workflow testing for database configuration
 * - File upload and dynamic form structure testing support
 * - Multi-step wizard navigation testing utilities
 * - Conditional field visibility and dynamic form structure testing
 * - Form reset and default value testing helpers
 * 
 * Performance Requirements:
 * - All form validation testing must complete under 100ms per Section 3.2.3
 * - Field interaction testing optimized for real-time validation feedback
 * - Wizard navigation testing with state persistence validation
 * 
 * @version 1.0.0
 * @since React 19 / Next.js 15.1 migration
 */

import React, { ReactElement } from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  useForm, 
  UseFormReturn, 
  FieldValues, 
  Path, 
  Control,
  FormProvider,
  useFormContext,
  FieldPath,
  PathValue
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { renderWithProviders, type CustomRenderOptions } from './test-utils';

// =============================================================================
// TYPE DEFINITIONS FOR FORM TESTING
// =============================================================================

/**
 * Configuration options for form testing utilities
 */
interface FormTestOptions<T extends FieldValues = FieldValues> extends CustomRenderOptions {
  /** Default values to populate the form with */
  defaultValues?: Partial<T>;
  /** Validation mode for React Hook Form */
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  /** Whether to validate on mount */
  shouldValidateOnMount?: boolean;
  /** Custom validation schema */
  schema?: z.ZodSchema<T>;
  /** Whether to enable form state debugging */
  debug?: boolean;
}

/**
 * Field interaction test configuration
 */
interface FieldTestConfig {
  /** Field name/identifier */
  name: string;
  /** Test ID or selector for the field */
  selector?: string;
  /** Field type for appropriate interaction */
  type?: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'file' | 'textarea';
  /** Expected validation errors for various inputs */
  validationTests?: Array<{
    /** Input value to test */
    value: any;
    /** Expected error message(s) */
    expectedErrors?: string[];
    /** Whether this value should be valid */
    shouldBeValid?: boolean;
    /** Additional context for the test */
    description?: string;
  }>;
  /** Whether the field is required */
  required?: boolean;
  /** Conditional visibility test */
  conditionalVisibility?: {
    /** Field that controls visibility */
    dependsOn: string;
    /** Value that triggers visibility */
    triggerValue: any;
    /** Whether field should be visible when triggered */
    shouldBeVisible: boolean;
  };
}

/**
 * Form submission test configuration
 */
interface FormSubmissionTestConfig<T extends FieldValues = FieldValues> {
  /** Form data to submit */
  formData: Partial<T>;
  /** Expected validation errors */
  expectedErrors?: Record<string, string[]>;
  /** Whether submission should succeed */
  shouldSucceed?: boolean;
  /** Custom submission handler for testing */
  onSubmit?: (data: T) => Promise<void> | void;
  /** API response to mock */
  mockResponse?: {
    success: boolean;
    data?: any;
    errors?: Record<string, string[]>;
  };
  /** Time to wait for submission to complete */
  timeout?: number;
}

/**
 * Multi-step wizard test configuration
 */
interface WizardTestConfig<T extends FieldValues = FieldValues> {
  /** Steps configuration */
  steps: Array<{
    /** Step identifier */
    id: string;
    /** Step title/label */
    title: string;
    /** Fields to test in this step */
    fields: FieldTestConfig[];
    /** Data to fill in this step */
    data?: Partial<T>;
    /** Whether this step should be skippable */
    optional?: boolean;
    /** Custom validation for step completion */
    stepValidation?: (formData: Partial<T>) => boolean;
  }>;
  /** Whether wizard should preserve state between steps */
  preserveState?: boolean;
  /** Overall form completion test data */
  completionData?: T;
}

/**
 * File upload test configuration
 */
interface FileUploadTestConfig {
  /** Field name for file upload */
  fieldName: string;
  /** Files to upload */
  files: Array<{
    /** File name */
    name: string;
    /** File content */
    content: string | Buffer;
    /** MIME type */
    type: string;
    /** File size in bytes */
    size?: number;
  }>;
  /** Expected validation behavior */
  validation?: {
    /** Maximum file size allowed */
    maxSize?: number;
    /** Allowed file types */
    allowedTypes?: string[];
    /** Maximum number of files */
    maxFiles?: number;
    /** Whether files are required */
    required?: boolean;
  };
  /** Expected upload behavior */
  uploadBehavior?: {
    /** Should upload succeed */
    shouldSucceed?: boolean;
    /** Expected progress updates */
    progressUpdates?: number[];
    /** Upload timeout */
    timeout?: number;
  };
}

/**
 * Dynamic form structure test configuration
 */
interface DynamicFormTestConfig {
  /** Initial form structure */
  initialStructure: Array<{
    /** Field configuration */
    field: FieldTestConfig;
    /** Initial visibility */
    visible: boolean;
  }>;
  /** Structure changes to test */
  structureChanges: Array<{
    /** Trigger that causes the change */
    trigger: {
      /** Field to interact with */
      fieldName: string;
      /** Value to set */
      value: any;
    };
    /** Expected structure after change */
    expectedStructure: Array<{
      /** Field name */
      fieldName: string;
      /** Should be visible */
      visible: boolean;
      /** Should be required */
      required?: boolean;
    }>;
    /** Description of the change */
    description?: string;
  }>;
}

// =============================================================================
// FORM RENDERING AND SETUP UTILITIES
// =============================================================================

/**
 * Enhanced form testing wrapper component
 */
const FormTestWrapper = <T extends FieldValues>({
  children,
  formMethods,
  onSubmit,
  debug = false
}: {
  children: React.ReactNode;
  formMethods: UseFormReturn<T>;
  onSubmit?: (data: T) => void;
  debug?: boolean;
}) => {
  const handleSubmit = formMethods.handleSubmit((data) => {
    if (debug) {
      console.log('Form submitted with data:', data);
      console.log('Form state:', formMethods.formState);
    }
    onSubmit?.(data);
  });

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit} data-testid="test-form">
        {children}
        {debug && (
          <div data-testid="form-debug-info">
            <pre>{JSON.stringify(formMethods.formState, null, 2)}</pre>
            <pre>{JSON.stringify(formMethods.getValues(), null, 2)}</pre>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

/**
 * Renders a form component with React Hook Form integration for testing
 * 
 * @param component - React component to render
 * @param options - Form testing configuration options
 * @returns Enhanced render result with form testing utilities
 */
export const renderWithForm = <T extends FieldValues = FieldValues>(
  component: ReactElement,
  options: FormTestOptions<T> = {}
) => {
  const {
    defaultValues = {} as Partial<T>,
    mode = 'onChange',
    shouldValidateOnMount = false,
    schema,
    debug = false,
    providerOptions,
    ...renderOptions
  } = options;

  // Create form methods with configuration
  const formMethods = useForm<T>({
    defaultValues,
    mode,
    resolver: schema ? zodResolver(schema) : undefined,
    shouldValidateOnMount
  });

  const user = userEvent.setup();
  let onSubmitData: T | null = null;
  let submitPromise: Promise<void> | null = null;

  const onSubmit = (data: T) => {
    onSubmitData = data;
  };

  const WrappedComponent = () => (
    <FormTestWrapper
      formMethods={formMethods}
      onSubmit={onSubmit}
      debug={debug}
    >
      {component}
    </FormTestWrapper>
  );

  const renderResult = renderWithProviders(<WrappedComponent />, {
    providerOptions,
    ...renderOptions
  });

  return {
    ...renderResult,
    user,
    formMethods,
    
    // Form testing utilities
    
    /**
     * Get the current form data
     */
    getFormData: () => formMethods.getValues(),
    
    /**
     * Get the current form state
     */
    getFormState: () => formMethods.formState,
    
    /**
     * Submit the form and wait for completion
     */
    submitForm: async (): Promise<T | null> => {
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(formMethods.formState.isSubmitting).toBe(false);
      });
      
      return onSubmitData;
    },
    
    /**
     * Get submitted form data (if form was submitted)
     */
    getSubmittedData: () => onSubmitData,
    
    /**
     * Reset the form to initial state
     */
    resetForm: (data?: Partial<T>) => {
      formMethods.reset(data);
      onSubmitData = null;
    },
    
    /**
     * Set form values programmatically
     */
    setFormValues: (values: Partial<T>) => {
      Object.entries(values).forEach(([key, value]) => {
        formMethods.setValue(key as Path<T>, value);
      });
    },
    
    /**
     * Trigger form validation manually
     */
    triggerValidation: async (fieldName?: Path<T>) => {
      if (fieldName) {
        return await formMethods.trigger(fieldName);
      }
      return await formMethods.trigger();
    },
    
    /**
     * Clear all form errors
     */
    clearErrors: () => {
      formMethods.clearErrors();
    },
    
    /**
     * Set form errors manually
     */
    setErrors: (errors: Record<Path<T>, { type: string; message: string }>) => {
      Object.entries(errors).forEach(([fieldName, error]) => {
        formMethods.setError(fieldName as Path<T>, error);
      });
    }
  };
};

// =============================================================================
// FIELD INTERACTION TESTING UTILITIES
// =============================================================================

/**
 * Tests field interactions including input, validation, and error handling
 * 
 * @param fieldConfig - Configuration for field testing
 * @param user - User event instance from testing library
 * @returns Promise that resolves when all field tests complete
 */
export const testFieldInteractions = async (
  fieldConfig: FieldTestConfig,
  user: ReturnType<typeof userEvent.setup>
) => {
  const { name, selector, type = 'text', validationTests = [], required } = fieldConfig;
  
  // Find the field element
  const fieldElement = selector 
    ? screen.getByTestId(selector)
    : screen.getByRole(getFieldRole(type), { name: new RegExp(name, 'i') });
  
  expect(fieldElement).toBeInTheDocument();
  
  // Test required field validation if applicable
  if (required) {
    await testRequiredFieldValidation(fieldElement, user, type);
  }
  
  // Run validation tests
  for (const validationTest of validationTests) {
    await runFieldValidationTest(fieldElement, validationTest, user, type);
  }
  
  return {
    fieldElement,
    isValid: () => !fieldElement.getAttribute('aria-invalid'),
    getErrorMessage: () => {
      const errorId = fieldElement.getAttribute('aria-describedby');
      return errorId ? screen.queryByText(errorId)?.textContent : null;
    },
    getValue: () => getFieldValue(fieldElement, type),
    setValue: async (value: any) => {
      await setFieldValue(fieldElement, value, user, type);
    }
  };
};

/**
 * Tests conditional field visibility based on form state
 * 
 * @param fieldConfig - Field configuration with conditional visibility rules
 * @param formMethods - React Hook Form methods
 * @param user - User event instance
 * @returns Promise that resolves when visibility tests complete
 */
export const testConditionalFieldVisibility = async <T extends FieldValues>(
  fieldConfig: FieldTestConfig,
  formMethods: UseFormReturn<T>,
  user: ReturnType<typeof userEvent.setup>
) => {
  const { name, conditionalVisibility } = fieldConfig;
  
  if (!conditionalVisibility) {
    throw new Error('Field configuration must include conditionalVisibility for this test');
  }
  
  const { dependsOn, triggerValue, shouldBeVisible } = conditionalVisibility;
  
  // Find the controlling field
  const controlField = screen.getByRole('textbox', { name: new RegExp(dependsOn, 'i') });
  
  // Set the trigger value
  await user.clear(controlField);
  await user.type(controlField, String(triggerValue));
  
  // Wait for form to update
  await waitFor(() => {
    expect(formMethods.getValues(dependsOn as Path<T>)).toBe(triggerValue);
  });
  
  // Check field visibility
  const targetField = screen.queryByRole('textbox', { name: new RegExp(name, 'i') });
  
  if (shouldBeVisible) {
    expect(targetField).toBeInTheDocument();
    expect(targetField).toBeVisible();
  } else {
    expect(targetField).not.toBeInTheDocument();
  }
  
  return {
    controlField,
    targetField,
    isVisible: () => !!targetField && targetField.style.display !== 'none'
  };
};

/**
 * Tests dynamic form array fields (add/remove functionality)
 * 
 * @param arrayFieldName - Name of the array field
 * @param itemTemplate - Template for array items
 * @param user - User event instance
 * @returns Promise with array field testing utilities
 */
export const testDynamicArrayFields = async (
  arrayFieldName: string,
  itemTemplate: Record<string, any>,
  user: ReturnType<typeof userEvent.setup>
) => {
  const addButton = screen.getByRole('button', { name: new RegExp(`add.*${arrayFieldName}`, 'i') });
  const initialItems = screen.getAllByTestId(new RegExp(`${arrayFieldName}-item`, 'i'));
  const initialCount = initialItems.length;
  
  // Test adding an item
  await user.click(addButton);
  
  await waitFor(() => {
    const updatedItems = screen.getAllByTestId(new RegExp(`${arrayFieldName}-item`, 'i'));
    expect(updatedItems).toHaveLength(initialCount + 1);
  });
  
  // Test removing an item
  const removeButtons = screen.getAllByRole('button', { name: new RegExp(`remove.*${arrayFieldName}`, 'i') });
  if (removeButtons.length > 0) {
    await user.click(removeButtons[0]);
    
    await waitFor(() => {
      const updatedItems = screen.getAllByTestId(new RegExp(`${arrayFieldName}-item`, 'i'));
      expect(updatedItems).toHaveLength(initialCount);
    });
  }
  
  // Test filling array items
  const fillArrayItems = async (data: Array<Record<string, any>>) => {
    for (let i = 0; i < data.length; i++) {
      const itemData = data[i];
      const itemContainer = screen.getByTestId(`${arrayFieldName}-item-${i}`);
      
      for (const [fieldName, value] of Object.entries(itemData)) {
        const field = within(itemContainer).getByRole('textbox', { name: new RegExp(fieldName, 'i') });
        await user.clear(field);
        await user.type(field, String(value));
      }
    }
  };
  
  return {
    addItem: async () => {
      await user.click(addButton);
      await waitFor(() => {
        const items = screen.getAllByTestId(new RegExp(`${arrayFieldName}-item`, 'i'));
        expect(items.length).toBeGreaterThan(initialCount);
      });
    },
    
    removeItem: async (index: number) => {
      const removeButton = screen.getByTestId(`${arrayFieldName}-remove-${index}`);
      await user.click(removeButton);
      await waitFor(() => {
        expect(screen.queryByTestId(`${arrayFieldName}-item-${index}`)).not.toBeInTheDocument();
      });
    },
    
    fillItems: fillArrayItems,
    
    getItemCount: () => screen.getAllByTestId(new RegExp(`${arrayFieldName}-item`, 'i')).length,
    
    getItemData: (index: number) => {
      const itemContainer = screen.getByTestId(`${arrayFieldName}-item-${index}`);
      const fields = within(itemContainer).getAllByRole('textbox');
      const data: Record<string, string> = {};
      
      fields.forEach(field => {
        const name = field.getAttribute('name') || field.getAttribute('data-testid') || 'unknown';
        data[name] = (field as HTMLInputElement).value;
      });
      
      return data;
    }
  };
};

// =============================================================================
// FORM SUBMISSION TESTING UTILITIES
// =============================================================================

/**
 * Tests form submission workflow with validation and error handling
 * 
 * @param config - Form submission test configuration
 * @param formMethods - React Hook Form methods
 * @param user - User event instance
 * @returns Promise with submission test results
 */
export const testFormSubmission = async <T extends FieldValues>(
  config: FormSubmissionTestConfig<T>,
  formMethods: UseFormReturn<T>,
  user: ReturnType<typeof userEvent.setup>
) => {
  const {
    formData,
    expectedErrors,
    shouldSucceed = true,
    onSubmit,
    mockResponse,
    timeout = 5000
  } = config;
  
  // Fill form with test data
  await fillFormData(formData, user);
  
  // Set up submission handler
  let submissionResult: any = null;
  let submissionError: any = null;
  
  const handleSubmit = async (data: T) => {
    try {
      if (onSubmit) {
        submissionResult = await onSubmit(data);
      } else if (mockResponse) {
        if (mockResponse.success) {
          submissionResult = mockResponse.data;
        } else {
          throw new Error('Submission failed');
        }
      }
    } catch (error) {
      submissionError = error;
    }
  };
  
  // Trigger form submission
  const submitButton = screen.getByRole('button', { name: /submit/i });
  await user.click(submitButton);
  
  // Wait for submission to complete
  await waitFor(
    () => {
      if (shouldSucceed) {
        expect(formMethods.formState.isSubmitSuccessful).toBe(true);
      } else {
        expect(formMethods.formState.isSubmitSuccessful).toBe(false);
      }
    },
    { timeout }
  );
  
  // Validate expected errors
  if (expectedErrors) {
    for (const [fieldName, errors] of Object.entries(expectedErrors)) {
      const fieldError = formMethods.formState.errors[fieldName as keyof T];
      if (errors.length > 0) {
        expect(fieldError).toBeDefined();
        expect(fieldError?.message).toBe(errors[0]);
      }
    }
  }
  
  return {
    submissionResult,
    submissionError,
    isSuccessful: formMethods.formState.isSubmitSuccessful,
    errors: formMethods.formState.errors,
    submittedData: formMethods.getValues()
  };
};

/**
 * Tests database connection form submission with connection testing
 * 
 * @param connectionData - Database connection configuration
 * @param user - User event instance
 * @returns Promise with connection test results
 */
export const testDatabaseConnectionSubmission = async (
  connectionData: {
    name: string;
    type: 'mysql' | 'postgresql' | 'oracle' | 'mongodb' | 'snowflake';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  },
  user: ReturnType<typeof userEvent.setup>
) => {
  // Fill connection form
  await user.type(screen.getByLabelText(/connection name/i), connectionData.name);
  await user.selectOptions(screen.getByLabelText(/database type/i), connectionData.type);
  await user.type(screen.getByLabelText(/host/i), connectionData.host);
  await user.type(screen.getByLabelText(/port/i), String(connectionData.port));
  await user.type(screen.getByLabelText(/database/i), connectionData.database);
  await user.type(screen.getByLabelText(/username/i), connectionData.username);
  await user.type(screen.getByLabelText(/password/i), connectionData.password);
  
  if (connectionData.ssl !== undefined) {
    const sslCheckbox = screen.getByLabelText(/ssl/i);
    if (connectionData.ssl) {
      await user.check(sslCheckbox);
    } else {
      await user.uncheck(sslCheckbox);
    }
  }
  
  // Test connection button
  const testConnectionButton = screen.getByRole('button', { name: /test connection/i });
  expect(testConnectionButton).toBeInTheDocument();
  
  await user.click(testConnectionButton);
  
  // Wait for connection test to complete
  await waitFor(() => {
    const resultElement = screen.queryByTestId('connection-test-result');
    expect(resultElement).toBeInTheDocument();
  }, { timeout: 10000 }); // Connection tests may take longer
  
  const testResult = screen.getByTestId('connection-test-result');
  const isSuccess = testResult.textContent?.includes('success') || testResult.classList.contains('success');
  
  return {
    connectionData,
    testResult: testResult.textContent,
    isConnectionSuccessful: isSuccess,
    
    // Submit the form after successful connection test
    submitConnection: async () => {
      const submitButton = screen.getByRole('button', { name: /create.*connection|save.*connection/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/connection.*created|connection.*saved/i)).toBeInTheDocument();
      });
    }
  };
};

// =============================================================================
// WIZARD TESTING UTILITIES
// =============================================================================

/**
 * Tests multi-step wizard navigation and form state persistence
 * 
 * @param config - Wizard test configuration
 * @param user - User event instance
 * @returns Promise with wizard testing utilities
 */
export const testWizardNavigation = async <T extends FieldValues>(
  config: WizardTestConfig<T>,
  user: ReturnType<typeof userEvent.setup>
) => {
  const { steps, preserveState = true, completionData } = config;
  
  let currentStepIndex = 0;
  const stepResults: Array<{
    stepId: string;
    completed: boolean;
    data: Partial<T>;
    errors: string[];
  }> = [];
  
  // Navigate through each step
  for (const step of steps) {
    const stepResult = await testWizardStep(step, user, currentStepIndex);
    stepResults.push(stepResult);
    
    // Check if we can proceed to next step
    if (stepResult.completed && currentStepIndex < steps.length - 1) {
      await goToNextStep(user);
      currentStepIndex++;
    }
  }
  
  // Test wizard completion
  let completionResult: any = null;
  if (completionData) {
    completionResult = await completeWizard(completionData, user);
  }
  
  return {
    steps: stepResults,
    currentStep: currentStepIndex,
    isCompleted: completionResult !== null,
    completionResult,
    
    // Navigation utilities
    goToStep: async (stepIndex: number) => {
      const stepButton = screen.getByTestId(`wizard-step-${stepIndex}`);
      await user.click(stepButton);
      
      await waitFor(() => {
        expect(screen.getByTestId(`wizard-step-content-${stepIndex}`)).toBeVisible();
      });
      
      currentStepIndex = stepIndex;
    },
    
    goToNextStep: () => goToNextStep(user),
    goToPreviousStep: () => goToPreviousStep(user),
    
    // State validation
    validateStepCompletion: (stepIndex: number) => {
      const step = stepResults[stepIndex];
      return step && step.completed;
    },
    
    getStepData: (stepIndex: number) => {
      return stepResults[stepIndex]?.data || {};
    },
    
    // Overall wizard state
    getWizardProgress: () => {
      const completedSteps = stepResults.filter(step => step.completed).length;
      return {
        completedSteps,
        totalSteps: steps.length,
        progress: (completedSteps / steps.length) * 100
      };
    }
  };
};

/**
 * Tests individual wizard step
 */
const testWizardStep = async <T extends FieldValues>(
  step: WizardTestConfig<T>['steps'][0],
  user: ReturnType<typeof userEvent.setup>,
  stepIndex: number
) => {
  const { id, title, fields, data, optional, stepValidation } = step;
  
  // Verify step is visible
  const stepContainer = screen.getByTestId(`wizard-step-content-${stepIndex}`);
  expect(stepContainer).toBeVisible();
  
  // Verify step title
  expect(screen.getByText(title)).toBeInTheDocument();
  
  const errors: string[] = [];
  let stepData: Partial<T> = {};
  
  // Fill step data if provided
  if (data) {
    stepData = { ...data };
    await fillFormData(data, user);
  }
  
  // Test each field in the step
  for (const fieldConfig of fields) {
    try {
      await testFieldInteractions(fieldConfig, user);
    } catch (error) {
      errors.push(`Field ${fieldConfig.name}: ${(error as Error).message}`);
    }
  }
  
  // Validate step completion
  let completed = errors.length === 0;
  if (stepValidation && data) {
    completed = completed && stepValidation(data);
  }
  
  return {
    stepId: id,
    completed,
    data: stepData,
    errors
  };
};

// =============================================================================
// FILE UPLOAD TESTING UTILITIES
// =============================================================================

/**
 * Tests file upload functionality with validation and progress tracking
 * 
 * @param config - File upload test configuration
 * @param user - User event instance
 * @returns Promise with upload test results
 */
export const testFileUpload = async (
  config: FileUploadTestConfig,
  user: ReturnType<typeof userEvent.setup>
) => {
  const { fieldName, files, validation, uploadBehavior } = config;
  
  // Find file input
  const fileInput = screen.getByLabelText(new RegExp(fieldName, 'i'));
  expect(fileInput).toBeInTheDocument();
  expect(fileInput).toHaveAttribute('type', 'file');
  
  // Create File objects for testing
  const testFiles = files.map(file => {
    const content = typeof file.content === 'string' 
      ? new TextEncoder().encode(file.content)
      : file.content;
    
    return new File([content], file.name, {
      type: file.type,
      lastModified: Date.now()
    });
  });
  
  // Test file selection
  await user.upload(fileInput, testFiles);
  
  // Verify files were selected
  expect(fileInput.files).toHaveLength(testFiles.length);
  
  const uploadResults: Array<{
    file: File;
    uploaded: boolean;
    error?: string;
    progress?: number;
  }> = [];
  
  // Test each file
  for (let i = 0; i < testFiles.length; i++) {
    const file = testFiles[i];
    const result: typeof uploadResults[0] = {
      file,
      uploaded: false
    };
    
    try {
      // Test file validation
      if (validation) {
        await validateUploadedFile(file, validation);
      }
      
      // Test upload behavior
      if (uploadBehavior) {
        result.uploaded = uploadBehavior.shouldSucceed !== false;
        
        if (uploadBehavior.progressUpdates) {
          // Simulate progress updates
          for (const progress of uploadBehavior.progressUpdates) {
            result.progress = progress;
            await waitFor(() => {
              const progressElement = screen.queryByTestId(`upload-progress-${i}`);
              if (progressElement) {
                expect(progressElement).toHaveTextContent(`${progress}%`);
              }
            });
          }
        }
      } else {
        result.uploaded = true;
      }
    } catch (error) {
      result.error = (error as Error).message;
    }
    
    uploadResults.push(result);
  }
  
  return {
    uploadResults,
    selectedFiles: testFiles,
    
    // File validation utilities
    validateFileSize: (file: File, maxSize: number) => {
      return file.size <= maxSize;
    },
    
    validateFileType: (file: File, allowedTypes: string[]) => {
      return allowedTypes.includes(file.type);
    },
    
    // Upload progress utilities
    getUploadProgress: (fileIndex: number) => {
      const progressElement = screen.queryByTestId(`upload-progress-${fileIndex}`);
      return progressElement ? parseInt(progressElement.textContent || '0') : 0;
    },
    
    // Upload completion utilities
    waitForUploadCompletion: async (timeout = 10000) => {
      await waitFor(() => {
        const allFiles = uploadResults.every(result => result.uploaded || result.error);
        expect(allFiles).toBe(true);
      }, { timeout });
    },
    
    getUploadErrors: () => {
      return uploadResults
        .filter(result => result.error)
        .map(result => ({ file: result.file.name, error: result.error }));
    }
  };
};

/**
 * Tests schema import/export file upload workflow
 * 
 * @param operation - 'import' or 'export'
 * @param schemaData - Schema data for testing
 * @param user - User event instance
 * @returns Promise with schema operation results
 */
export const testSchemaFileUpload = async (
  operation: 'import' | 'export',
  schemaData: any,
  user: ReturnType<typeof userEvent.setup>
) => {
  if (operation === 'import') {
    // Test schema import
    const importButton = screen.getByRole('button', { name: /import.*schema/i });
    await user.click(importButton);
    
    const fileInput = screen.getByLabelText(/select.*schema.*file/i);
    const schemaFile = new File([JSON.stringify(schemaData)], 'schema.json', {
      type: 'application/json'
    });
    
    await user.upload(fileInput, schemaFile);
    
    // Wait for schema to be processed
    await waitFor(() => {
      expect(screen.getByText(/schema.*imported/i)).toBeInTheDocument();
    });
    
    return {
      operation: 'import',
      file: schemaFile,
      imported: true,
      processedSchema: schemaData
    };
  } else {
    // Test schema export
    const exportButton = screen.getByRole('button', { name: /export.*schema/i });
    await user.click(exportButton);
    
    // Wait for download to be triggered
    await waitFor(() => {
      expect(screen.getByText(/schema.*exported/i)).toBeInTheDocument();
    });
    
    return {
      operation: 'export',
      exported: true,
      exportedSchema: schemaData
    };
  }
};

// =============================================================================
// FORM RESET AND DEFAULT VALUE UTILITIES
// =============================================================================

/**
 * Tests form reset functionality and default value handling
 * 
 * @param formMethods - React Hook Form methods
 * @param defaultValues - Expected default values
 * @param user - User event instance
 * @returns Promise with reset test results
 */
export const testFormReset = async <T extends FieldValues>(
  formMethods: UseFormReturn<T>,
  defaultValues: Partial<T>,
  user: ReturnType<typeof userEvent.setup>
) => {
  // Get initial form state
  const initialValues = formMethods.getValues();
  const initialState = formMethods.formState;
  
  // Make some changes to the form
  const testData = {
    field1: 'modified value 1',
    field2: 'modified value 2'
  } as Partial<T>;
  
  await fillFormData(testData, user);
  
  // Verify form was modified
  const modifiedValues = formMethods.getValues();
  expect(modifiedValues).not.toEqual(initialValues);
  
  // Test reset button
  const resetButton = screen.getByRole('button', { name: /reset|clear/i });
  await user.click(resetButton);
  
  // Wait for reset to complete
  await waitFor(() => {
    const resetValues = formMethods.getValues();
    Object.entries(defaultValues).forEach(([key, value]) => {
      expect(resetValues[key as keyof T]).toEqual(value);
    });
  });
  
  // Verify form state was reset
  expect(formMethods.formState.isDirty).toBe(false);
  expect(formMethods.formState.isValid).toBe(true);
  
  return {
    initialValues,
    modifiedValues,
    resetValues: formMethods.getValues(),
    wasReset: !formMethods.formState.isDirty,
    
    // Reset with specific data
    resetWithData: async (data: Partial<T>) => {
      formMethods.reset(data);
      await waitFor(() => {
        const newValues = formMethods.getValues();
        Object.entries(data).forEach(([key, value]) => {
          expect(newValues[key as keyof T]).toEqual(value);
        });
      });
    },
    
    // Test dirty state
    testDirtyState: async () => {
      // Make a change
      const firstField = screen.getAllByRole('textbox')[0];
      await user.type(firstField, 'test');
      
      await waitFor(() => {
        expect(formMethods.formState.isDirty).toBe(true);
      });
      
      // Reset
      formMethods.reset();
      
      await waitFor(() => {
        expect(formMethods.formState.isDirty).toBe(false);
      });
    }
  };
};

/**
 * Tests default value population for complex form configurations
 * 
 * @param schema - Form schema with default values
 * @param formMethods - React Hook Form methods
 * @returns Promise with default value test results
 */
export const testDefaultValues = async <T extends FieldValues>(
  schema: z.ZodSchema<T>,
  formMethods: UseFormReturn<T>
) => {
  // Parse schema to extract default values
  const schemaDefaults = extractDefaultsFromSchema(schema);
  const formDefaults = formMethods.getValues();
  
  // Verify all default values are correctly set
  const defaultValueTests = Object.entries(schemaDefaults).map(([key, expectedValue]) => {
    const actualValue = formDefaults[key as keyof T];
    return {
      field: key,
      expected: expectedValue,
      actual: actualValue,
      matches: actualValue === expectedValue
    };
  });
  
  const allDefaultsMatch = defaultValueTests.every(test => test.matches);
  
  return {
    schemaDefaults,
    formDefaults,
    defaultValueTests,
    allDefaultsMatch,
    
    // Verify specific field defaults
    verifyFieldDefault: (fieldName: keyof T, expectedValue: any) => {
      const actualValue = formDefaults[fieldName];
      expect(actualValue).toEqual(expectedValue);
    },
    
    // Test default value override
    testDefaultOverride: async (overrides: Partial<T>) => {
      formMethods.reset(overrides);
      
      await waitFor(() => {
        const newValues = formMethods.getValues();
        Object.entries(overrides).forEach(([key, value]) => {
          expect(newValues[key as keyof T]).toEqual(value);
        });
      });
    }
  };
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Gets the appropriate ARIA role for a field type
 */
const getFieldRole = (type: string): string => {
  switch (type) {
    case 'text':
    case 'email':
    case 'password':
    case 'number':
      return 'textbox';
    case 'select':
      return 'combobox';
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    case 'textarea':
      return 'textbox';
    default:
      return 'textbox';
  }
};

/**
 * Tests required field validation
 */
const testRequiredFieldValidation = async (
  fieldElement: HTMLElement,
  user: ReturnType<typeof userEvent.setup>,
  type: string
) => {
  // Focus and blur without entering data
  await user.click(fieldElement);
  await user.tab();
  
  await waitFor(() => {
    expect(fieldElement).toHaveAttribute('aria-invalid', 'true');
  });
  
  // Check for error message
  const errorId = fieldElement.getAttribute('aria-describedby');
  if (errorId) {
    const errorElement = screen.getByTestId(errorId);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement.textContent).toMatch(/required/i);
  }
};

/**
 * Runs a single field validation test
 */
const runFieldValidationTest = async (
  fieldElement: HTMLElement,
  validationTest: FieldTestConfig['validationTests'][0],
  user: ReturnType<typeof userEvent.setup>,
  type: string
) => {
  const { value, expectedErrors, shouldBeValid, description } = validationTest;
  
  // Clear field and enter test value
  await user.clear(fieldElement);
  await setFieldValue(fieldElement, value, user, type);
  
  // Trigger validation by blurring
  await user.tab();
  
  await waitFor(() => {
    if (shouldBeValid) {
      expect(fieldElement).not.toHaveAttribute('aria-invalid', 'true');
    } else {
      expect(fieldElement).toHaveAttribute('aria-invalid', 'true');
    }
  });
  
  // Check for expected error messages
  if (expectedErrors && expectedErrors.length > 0) {
    const errorId = fieldElement.getAttribute('aria-describedby');
    if (errorId) {
      const errorElement = screen.getByTestId(errorId);
      expect(errorElement.textContent).toMatch(new RegExp(expectedErrors[0], 'i'));
    }
  }
};

/**
 * Sets a field value based on its type
 */
const setFieldValue = async (
  fieldElement: HTMLElement,
  value: any,
  user: ReturnType<typeof userEvent.setup>,
  type: string
) => {
  switch (type) {
    case 'checkbox':
      if (value) {
        await user.check(fieldElement as HTMLInputElement);
      } else {
        await user.uncheck(fieldElement as HTMLInputElement);
      }
      break;
    case 'select':
      await user.selectOptions(fieldElement, String(value));
      break;
    case 'file':
      const files = Array.isArray(value) ? value : [value];
      await user.upload(fieldElement as HTMLInputElement, files);
      break;
    default:
      await user.type(fieldElement, String(value));
      break;
  }
};

/**
 * Gets a field value based on its type
 */
const getFieldValue = (fieldElement: HTMLElement, type: string): any => {
  switch (type) {
    case 'checkbox':
      return (fieldElement as HTMLInputElement).checked;
    case 'file':
      return (fieldElement as HTMLInputElement).files;
    default:
      return (fieldElement as HTMLInputElement).value;
  }
};

/**
 * Fills form data for testing
 */
const fillFormData = async <T extends FieldValues>(
  data: Partial<T>,
  user: ReturnType<typeof userEvent.setup>
) => {
  for (const [fieldName, value] of Object.entries(data)) {
    const field = screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') });
    await user.clear(field);
    await user.type(field, String(value));
  }
};

/**
 * Navigate to next wizard step
 */
const goToNextStep = async (user: ReturnType<typeof userEvent.setup>) => {
  const nextButton = screen.getByRole('button', { name: /next|continue/i });
  await user.click(nextButton);
  
  await waitFor(() => {
    expect(nextButton).not.toBeDisabled();
  });
};

/**
 * Navigate to previous wizard step
 */
const goToPreviousStep = async (user: ReturnType<typeof userEvent.setup>) => {
  const prevButton = screen.getByRole('button', { name: /previous|back/i });
  await user.click(prevButton);
  
  await waitFor(() => {
    expect(prevButton).not.toBeDisabled();
  });
};

/**
 * Complete wizard form
 */
const completeWizard = async <T extends FieldValues>(
  completionData: T,
  user: ReturnType<typeof userEvent.setup>
) => {
  await fillFormData(completionData, user);
  
  const finishButton = screen.getByRole('button', { name: /finish|complete|submit/i });
  await user.click(finishButton);
  
  await waitFor(() => {
    expect(screen.getByText(/completed|success/i)).toBeInTheDocument();
  });
  
  return completionData;
};

/**
 * Validates uploaded file against configuration
 */
const validateUploadedFile = async (
  file: File,
  validation: FileUploadTestConfig['validation']
) => {
  if (!validation) return;
  
  const { maxSize, allowedTypes, required } = validation;
  
  if (required && !file) {
    throw new Error('File is required');
  }
  
  if (maxSize && file.size > maxSize) {
    throw new Error(`File size ${file.size} exceeds maximum ${maxSize}`);
  }
  
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed`);
  }
};

/**
 * Extracts default values from Zod schema
 */
const extractDefaultsFromSchema = (schema: z.ZodSchema<any>): Record<string, any> => {
  // This is a simplified implementation
  // In practice, you might need to walk the schema more thoroughly
  const defaults: Record<string, any> = {};
  
  try {
    const parsed = schema.parse({});
    return parsed;
  } catch {
    // Return empty defaults if parsing fails
    return defaults;
  }
};

// =============================================================================
// EXPORTED UTILITIES
// =============================================================================

/**
 * Main form testing utilities export
 */
export const formTestHelpers = {
  // Core rendering
  renderWithForm,
  
  // Field testing
  testFieldInteractions,
  testConditionalFieldVisibility,
  testDynamicArrayFields,
  
  // Form submission
  testFormSubmission,
  testDatabaseConnectionSubmission,
  
  // Wizard testing
  testWizardNavigation,
  
  // File upload
  testFileUpload,
  testSchemaFileUpload,
  
  // Reset and defaults
  testFormReset,
  testDefaultValues,
  
  // Type definitions
  types: {
    FormTestOptions,
    FieldTestConfig,
    FormSubmissionTestConfig,
    WizardTestConfig,
    FileUploadTestConfig,
    DynamicFormTestConfig
  }
};

// Re-export everything for convenience
export * from './test-utils';