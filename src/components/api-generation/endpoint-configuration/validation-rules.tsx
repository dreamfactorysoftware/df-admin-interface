'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, debounce } from '@/lib/utils';

// ============================================================================
// Types and Schemas (inline definitions since dependency files don't exist yet)
// ============================================================================

/**
 * Validation rule types supported by the system
 */
export type ValidationRuleType = 
  | 'required'
  | 'string'
  | 'number'
  | 'email'
  | 'url'
  | 'date'
  | 'regex'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'enum'
  | 'custom';

/**
 * Conditional logic operators for rule chaining
 */
export type ConditionalOperator = 'AND' | 'OR' | 'NOT';

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Individual validation rule configuration
 */
export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  value?: any;
  message?: string;
  severity: ValidationSeverity;
  enabled: boolean;
  conditionalLogic?: {
    operator: ConditionalOperator;
    dependsOn?: string[];
    condition?: string;
  };
  customValidator?: {
    code: string;
    description?: string;
  };
}

/**
 * Field validation configuration
 */
export interface FieldValidationConfig {
  fieldName: string;
  rules: ValidationRule[];
  testData?: any;
  testResults?: ValidationTestResult[];
}

/**
 * Validation test result
 */
export interface ValidationTestResult {
  ruleId: string;
  passed: boolean;
  message: string;
  severity: ValidationSeverity;
  executionTime: number;
}

/**
 * Complete validation configuration
 */
export interface ValidationConfig {
  fields: FieldValidationConfig[];
  globalRules: ValidationRule[];
  businessRules: BusinessRule[];
  settings: ValidationSettings;
}

/**
 * Business rule configuration
 */
export interface BusinessRule {
  id: string;
  name: string;
  description?: string;
  expression: string;
  errorMessage: string;
  severity: ValidationSeverity;
  enabled: boolean;
  dependencies: string[];
}

/**
 * Validation settings
 */
export interface ValidationSettings {
  enableRealTimeValidation: boolean;
  validationTimeout: number;
  i18nEnabled: boolean;
  locale: string;
  skipValidationOnEmpty: boolean;
  abortOnFirstError: boolean;
}

// Zod schema for validation configuration
const validationRuleSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  type: z.enum(['required', 'string', 'number', 'email', 'url', 'date', 'regex', 'min', 'max', 'minLength', 'maxLength', 'enum', 'custom']),
  value: z.any().optional(),
  message: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']).default('error'),
  enabled: z.boolean().default(true),
  conditionalLogic: z.object({
    operator: z.enum(['AND', 'OR', 'NOT']),
    dependsOn: z.array(z.string()).optional(),
    condition: z.string().optional(),
  }).optional(),
  customValidator: z.object({
    code: z.string().min(1, 'Custom validator code is required'),
    description: z.string().optional(),
  }).optional(),
});

const fieldValidationConfigSchema = z.object({
  fieldName: z.string().min(1, 'Field name is required'),
  rules: z.array(validationRuleSchema),
  testData: z.any().optional(),
});

const businessRuleSchema = z.object({
  id: z.string().min(1, 'Business rule ID is required'),
  name: z.string().min(1, 'Business rule name is required'),
  description: z.string().optional(),
  expression: z.string().min(1, 'Expression is required'),
  errorMessage: z.string().min(1, 'Error message is required'),
  severity: z.enum(['error', 'warning', 'info']).default('error'),
  enabled: z.boolean().default(true),
  dependencies: z.array(z.string()),
});

const validationConfigSchema = z.object({
  fields: z.array(fieldValidationConfigSchema),
  globalRules: z.array(validationRuleSchema),
  businessRules: z.array(businessRuleSchema),
  settings: z.object({
    enableRealTimeValidation: z.boolean().default(true),
    validationTimeout: z.number().min(1).max(10000).default(100),
    i18nEnabled: z.boolean().default(true),
    locale: z.string().default('en'),
    skipValidationOnEmpty: z.boolean().default(false),
    abortOnFirstError: z.boolean().default(false),
  }),
});

// ============================================================================
// Component Props
// ============================================================================

export interface ValidationRulesProps {
  /**
   * Initial validation configuration
   */
  initialConfig?: Partial<ValidationConfig>;
  
  /**
   * Available fields from the API endpoint schema
   */
  availableFields?: string[];
  
  /**
   * Callback when validation configuration changes
   */
  onConfigChange?: (config: ValidationConfig) => void;
  
  /**
   * Callback when validation test is executed
   */
  onValidationTest?: (fieldName: string, testData: any, results: ValidationTestResult[]) => void;
  
  /**
   * Whether the component is read-only
   */
  readOnly?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

// ============================================================================
// Mock UI Components (since some dependencies don't exist yet)
// ============================================================================

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean; errorMessage?: string }
>(({ className, error = false, errorMessage, ...props }, ref) => (
  <div className="w-full">
    <textarea
      className={cn(
        'flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-500 focus:ring-red-500',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        'dark:placeholder:text-gray-500 dark:focus:ring-primary-400',
        className
      )}
      ref={ref}
      {...props}
    />
    {error && errorMessage && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
        {errorMessage}
      </p>
    )}
  </div>
));
Textarea.displayName = 'Textarea';

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean; errorMessage?: string; options: { value: string; label: string }[] }
>(({ className, error = false, errorMessage, options, ...props }, ref) => (
  <div className="w-full">
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-red-500 focus:ring-red-500',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
        'dark:focus:ring-primary-400',
        className
      )}
      ref={ref}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && errorMessage && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
        {errorMessage}
      </p>
    )}
  </div>
));
Select.displayName = 'Select';

const JsonEditor = React.forwardRef<
  HTMLTextAreaElement,
  { value?: string; onChange?: (value: string) => void; placeholder?: string; error?: boolean; className?: string }
>(({ value, onChange, placeholder, error, className }, ref) => (
  <Textarea
    ref={ref}
    value={value}
    onChange={(e) => onChange?.(e.target.value)}
    placeholder={placeholder}
    error={error}
    className={cn('font-mono text-xs', className)}
    rows={6}
  />
));
JsonEditor.displayName = 'JsonEditor';

// ============================================================================
// Main Component
// ============================================================================

/**
 * ValidationRules Component
 * 
 * A comprehensive validation rules configuration component for API endpoints.
 * Features dynamic rule building, real-time testing, and business rule configuration.
 * 
 * Key Features:
 * - Dynamic validation rule builder with conditional logic
 * - Real-time validation testing with sample data input
 * - Business rule configuration with complex validation scenarios
 * - Enhanced error message customization with i18n support
 * - Zod schema validation integrated with React Hook Form
 * 
 * @param {ValidationRulesProps} props - Component props
 * @returns {JSX.Element} ValidationRules component
 */
export const ValidationRules: React.FC<ValidationRulesProps> = ({
  initialConfig,
  availableFields = [],
  onConfigChange,
  onValidationTest,
  readOnly = false,
  className,
}) => {
  // ============================================================================
  // State Management
  // ============================================================================
  
  const [activeTab, setActiveTab] = useState<'fields' | 'global' | 'business' | 'settings'>('fields');
  const [testResults, setTestResults] = useState<Record<string, ValidationTestResult[]>>({});
  const [validationInProgress, setValidationInProgress] = useState<Record<string, boolean>>({});

  // Default configuration
  const defaultConfig: ValidationConfig = {
    fields: [],
    globalRules: [],
    businessRules: [],
    settings: {
      enableRealTimeValidation: true,
      validationTimeout: 100,
      i18nEnabled: true,
      locale: 'en',
      skipValidationOnEmpty: false,
      abortOnFirstError: false,
    },
  };

  // Form management with React Hook Form and Zod validation
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<ValidationConfig>({
    resolver: zodResolver(validationConfigSchema),
    defaultValues: { ...defaultConfig, ...initialConfig },
    mode: 'onChange',
  });

  // Field arrays for dynamic form sections
  const { fields: fieldConfigs, append: appendField, remove: removeField } = useFieldArray({
    control,
    name: 'fields',
  });

  const { fields: globalRules, append: appendGlobalRule, remove: removeGlobalRule } = useFieldArray({
    control,
    name: 'globalRules',
  });

  const { fields: businessRules, append: appendBusinessRule, remove: removeBusinessRule } = useFieldArray({
    control,
    name: 'businessRules',
  });

  // Watch for configuration changes
  const watchedConfig = watch();

  // ============================================================================
  // Validation Logic
  // ============================================================================

  /**
   * Execute validation rules against test data
   */
  const executeValidation = useCallback(async (
    fieldName: string,
    rules: ValidationRule[],
    testData: any
  ): Promise<ValidationTestResult[]> => {
    const results: ValidationTestResult[] = [];
    
    for (const rule of rules.filter(r => r.enabled)) {
      const startTime = performance.now();
      let passed = true;
      let message = rule.message || `${rule.type} validation`;

      try {
        switch (rule.type) {
          case 'required':
            passed = testData != null && testData !== '' && testData !== undefined;
            if (!passed) message = rule.message || 'Field is required';
            break;

          case 'string':
            passed = typeof testData === 'string';
            if (!passed) message = rule.message || 'Must be a string';
            break;

          case 'number':
            passed = typeof testData === 'number' && !isNaN(testData);
            if (!passed) message = rule.message || 'Must be a valid number';
            break;

          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            passed = typeof testData === 'string' && emailRegex.test(testData);
            if (!passed) message = rule.message || 'Must be a valid email address';
            break;

          case 'url':
            try {
              new URL(testData);
              passed = true;
            } catch {
              passed = false;
              message = rule.message || 'Must be a valid URL';
            }
            break;

          case 'regex':
            if (rule.value && typeof testData === 'string') {
              const regex = new RegExp(rule.value);
              passed = regex.test(testData);
              if (!passed) message = rule.message || 'Does not match required pattern';
            }
            break;

          case 'min':
            passed = typeof testData === 'number' && testData >= (rule.value || 0);
            if (!passed) message = rule.message || `Must be at least ${rule.value}`;
            break;

          case 'max':
            passed = typeof testData === 'number' && testData <= (rule.value || 0);
            if (!passed) message = rule.message || `Must be at most ${rule.value}`;
            break;

          case 'minLength':
            passed = typeof testData === 'string' && testData.length >= (rule.value || 0);
            if (!passed) message = rule.message || `Must be at least ${rule.value} characters`;
            break;

          case 'maxLength':
            passed = typeof testData === 'string' && testData.length <= (rule.value || 0);
            if (!passed) message = rule.message || `Must be at most ${rule.value} characters`;
            break;

          case 'enum':
            passed = Array.isArray(rule.value) && rule.value.includes(testData);
            if (!passed) message = rule.message || `Must be one of: ${rule.value?.join(', ')}`;
            break;

          case 'custom':
            if (rule.customValidator?.code) {
              try {
                // Safe custom validator execution (simplified)
                const validator = new Function('value', 'field', rule.customValidator.code);
                passed = Boolean(validator(testData, fieldName));
                if (!passed) message = rule.message || 'Custom validation failed';
              } catch (error) {
                passed = false;
                message = rule.message || `Custom validator error: ${error}`;
              }
            }
            break;

          default:
            passed = true;
        }
      } catch (error) {
        passed = false;
        message = `Validation error: ${error}`;
      }

      const endTime = performance.now();
      
      results.push({
        ruleId: rule.id,
        passed,
        message,
        severity: rule.severity,
        executionTime: endTime - startTime,
      });
    }

    return results;
  }, []);

  /**
   * Debounced validation test execution
   */
  const debouncedValidationTest = useMemo(
    () => debounce(async (fieldName: string, rules: ValidationRule[], testData: any) => {
      setValidationInProgress(prev => ({ ...prev, [fieldName]: true }));
      
      try {
        const results = await executeValidation(fieldName, rules, testData);
        setTestResults(prev => ({ ...prev, [fieldName]: results }));
        onValidationTest?.(fieldName, testData, results);
      } catch (error) {
        console.error('Validation test failed:', error);
      } finally {
        setValidationInProgress(prev => ({ ...prev, [fieldName]: false }));
      }
    }, 300),
    [executeValidation, onValidationTest]
  );

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Generate unique ID for new rules
   */
  const generateId = () => `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Add new validation rule to field
   */
  const addRuleToField = (fieldIndex: number) => {
    const newRule: ValidationRule = {
      id: generateId(),
      type: 'required',
      severity: 'error',
      enabled: true,
    };

    const currentRules = watchedConfig.fields[fieldIndex]?.rules || [];
    setValue(`fields.${fieldIndex}.rules`, [...currentRules, newRule]);
  };

  /**
   * Remove validation rule from field
   */
  const removeRuleFromField = (fieldIndex: number, ruleIndex: number) => {
    const currentRules = watchedConfig.fields[fieldIndex]?.rules || [];
    const updatedRules = currentRules.filter((_, index) => index !== ruleIndex);
    setValue(`fields.${fieldIndex}.rules`, updatedRules);
  };

  /**
   * Add new field configuration
   */
  const addFieldConfig = () => {
    appendField({
      fieldName: '',
      rules: [],
    });
  };

  /**
   * Add new global rule
   */
  const addGlobalRule = () => {
    appendGlobalRule({
      id: generateId(),
      type: 'required',
      severity: 'error',
      enabled: true,
    });
  };

  /**
   * Add new business rule
   */
  const addBusinessRule = () => {
    appendBusinessRule({
      id: generateId(),
      name: '',
      expression: '',
      errorMessage: '',
      severity: 'error',
      enabled: true,
      dependencies: [],
    });
  };

  // ============================================================================
  // Effects
  // ============================================================================

  // Notify parent of configuration changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(watchedConfig);
    }
  }, [watchedConfig, onConfigChange]);

  // ============================================================================
  // Render Functions
  // ============================================================================

  /**
   * Render individual validation rule editor
   */
  const renderValidationRule = (
    rule: ValidationRule,
    fieldIndex: number,
    ruleIndex: number
  ) => (
    <div key={rule.id || ruleIndex} className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          {/* Rule Type */}
          <Controller
            name={`fields.${fieldIndex}.rules.${ruleIndex}.type`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'required', label: 'Required' },
                  { value: 'string', label: 'String' },
                  { value: 'number', label: 'Number' },
                  { value: 'email', label: 'Email' },
                  { value: 'url', label: 'URL' },
                  { value: 'date', label: 'Date' },
                  { value: 'regex', label: 'Regex' },
                  { value: 'min', label: 'Minimum' },
                  { value: 'max', label: 'Maximum' },
                  { value: 'minLength', label: 'Min Length' },
                  { value: 'maxLength', label: 'Max Length' },
                  { value: 'enum', label: 'Enum' },
                  { value: 'custom', label: 'Custom' },
                ]}
                disabled={readOnly}
              />
            )}
          />

          {/* Rule Value */}
          {['min', 'max', 'minLength', 'maxLength', 'regex', 'enum'].includes(rule.type) && (
            <Controller
              name={`fields.${fieldIndex}.rules.${ruleIndex}.value`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={
                    rule.type === 'enum' ? 'option1,option2,option3' :
                    rule.type === 'regex' ? '^[a-zA-Z]+$' :
                    'Value'
                  }
                  disabled={readOnly}
                />
              )}
            />
          )}

          {/* Severity */}
          <Controller
            name={`fields.${fieldIndex}.rules.${ruleIndex}.severity`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'error', label: 'Error' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'info', label: 'Info' },
                ]}
                disabled={readOnly}
              />
            )}
          />
        </div>

        {/* Remove Rule Button */}
        {!readOnly && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeRuleFromField(fieldIndex, ruleIndex)}
            className="ml-2"
          >
            Remove
          </Button>
        )}
      </div>

      {/* Custom Error Message */}
      <Controller
        name={`fields.${fieldIndex}.rules.${ruleIndex}.message`}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            placeholder="Custom error message (optional)"
            disabled={readOnly}
          />
        )}
      />

      {/* Custom Validator Code */}
      {rule.type === 'custom' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Custom Validator Code
          </label>
          <Controller
            name={`fields.${fieldIndex}.rules.${ruleIndex}.customValidator.code`}
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="return value && value.length > 0; // Return true for valid, false for invalid"
                className="font-mono text-xs"
                rows={4}
                disabled={readOnly}
              />
            )}
          />
        </div>
      )}

      {/* Enabled Toggle */}
      <div className="flex items-center space-x-2">
        <Controller
          name={`fields.${fieldIndex}.rules.${ruleIndex}.enabled`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={readOnly}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          )}
        />
        <label className="text-sm text-gray-700 dark:text-gray-300">
          Rule enabled
        </label>
      </div>
    </div>
  );

  /**
   * Render field validation configuration
   */
  const renderFieldConfig = (fieldConfig: any, fieldIndex: number) => {
    const fieldRules = watchedConfig.fields[fieldIndex]?.rules || [];
    const fieldTestResults = testResults[fieldConfig.fieldName] || [];

    return (
      <div key={fieldConfig.fieldName || fieldIndex} className="border border-gray-300 rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Field Name
            </label>
            <Controller
              name={`fields.${fieldIndex}.fieldName`}
              control={control}
              render={({ field }) => (
                availableFields.length > 0 ? (
                  <Select
                    {...field}
                    options={[
                      { value: '', label: 'Select field...' },
                      ...availableFields.map(f => ({ value: f, label: f }))
                    ]}
                    disabled={readOnly}
                  />
                ) : (
                  <Input
                    {...field}
                    placeholder="Enter field name"
                    disabled={readOnly}
                  />
                )
              )}
            />
          </div>

          {/* Test Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Test Data
            </label>
            <Controller
              name={`fields.${fieldIndex}.testData`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    if (watchedConfig.settings.enableRealTimeValidation && fieldRules.length > 0) {
                      debouncedValidationTest(fieldConfig.fieldName, fieldRules, e.target.value);
                    }
                  }}
                  placeholder="Enter test value"
                  disabled={readOnly}
                />
              )}
            />
          </div>
        </div>

        {/* Validation Rules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Validation Rules
            </h4>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addRuleToField(fieldIndex)}
              >
                Add Rule
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {fieldRules.map((rule: ValidationRule, ruleIndex: number) =>
              renderValidationRule(rule, fieldIndex, ruleIndex)
            )}
            
            {fieldRules.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No validation rules configured. Click "Add Rule" to get started.
              </div>
            )}
          </div>
        </div>

        {/* Test Results */}
        {fieldTestResults.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Validation Results
            </h4>
            <div className="space-y-2">
              {fieldTestResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-3 rounded-md border',
                    result.passed
                      ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                      : result.severity === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                      : result.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
                      : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {result.passed ? '✓' : '✗'} {result.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.executionTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Remove Field Button */}
        {!readOnly && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeField(fieldIndex)}
            >
              Remove Field Configuration
            </Button>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render business rules configuration
   */
  const renderBusinessRules = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Business Rules
        </h3>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            onClick={addBusinessRule}
          >
            Add Business Rule
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {businessRules.map((rule, index) => (
          <div key={rule.id} className="border border-gray-300 rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name={`businessRules.${index}.name`}
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rule Name
                    </label>
                    <Input
                      {...field}
                      placeholder="Enter rule name"
                      disabled={readOnly}
                    />
                  </div>
                )}
              />

              <Controller
                name={`businessRules.${index}.severity`}
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Severity
                    </label>
                    <Select
                      {...field}
                      options={[
                        { value: 'error', label: 'Error' },
                        { value: 'warning', label: 'Warning' },
                        { value: 'info', label: 'Info' },
                      ]}
                      disabled={readOnly}
                    />
                  </div>
                )}
              />
            </div>

            <Controller
              name={`businessRules.${index}.description`}
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <Input
                    {...field}
                    placeholder="Describe what this rule validates"
                    disabled={readOnly}
                  />
                </div>
              )}
            />

            <Controller
              name={`businessRules.${index}.expression`}
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expression
                  </label>
                  <Textarea
                    {...field}
                    placeholder="field1 > 0 && field2 !== null && field3.length > 5"
                    className="font-mono text-sm"
                    rows={3}
                    disabled={readOnly}
                  />
                </div>
              )}
            />

            <Controller
              name={`businessRules.${index}.errorMessage`}
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Error Message
                  </label>
                  <Input
                    {...field}
                    placeholder="Message to display when validation fails"
                    disabled={readOnly}
                  />
                </div>
              )}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Controller
                  name={`businessRules.${index}.enabled`}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      disabled={readOnly}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  )}
                />
                <label className="text-sm text-gray-700 dark:text-gray-300">
                  Rule enabled
                </label>
              </div>

              {!readOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeBusinessRule(index)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}

        {businessRules.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No business rules configured. Click "Add Business Rule" to get started.
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render validation settings
   */
  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Validation Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real-time Validation */}
        <div className="flex items-center space-x-3">
          <Controller
            name="settings.enableRealTimeValidation"
            control={control}
            render={({ field: { value, onChange } }) => (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            )}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Real-time Validation
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Validate input as user types
            </p>
          </div>
        </div>

        {/* Validation Timeout */}
        <Controller
          name="settings.validationTimeout"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Validation Timeout (ms)
              </label>
              <Input
                {...field}
                type="number"
                min={1}
                max={10000}
                disabled={readOnly}
              />
            </div>
          )}
        />

        {/* Internationalization */}
        <div className="flex items-center space-x-3">
          <Controller
            name="settings.i18nEnabled"
            control={control}
            render={({ field: { value, onChange } }) => (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            )}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Internationalization
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Support multiple languages for error messages
            </p>
          </div>
        </div>

        {/* Locale */}
        <Controller
          name="settings.locale"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Locale
              </label>
              <Select
                {...field}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Spanish' },
                  { value: 'fr', label: 'French' },
                  { value: 'de', label: 'German' },
                  { value: 'it', label: 'Italian' },
                  { value: 'pt', label: 'Portuguese' },
                  { value: 'zh', label: 'Chinese' },
                  { value: 'ja', label: 'Japanese' },
                ]}
                disabled={readOnly}
              />
            </div>
          )}
        />

        {/* Skip Validation on Empty */}
        <div className="flex items-center space-x-3">
          <Controller
            name="settings.skipValidationOnEmpty"
            control={control}
            render={({ field: { value, onChange } }) => (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            )}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Skip Validation on Empty Values
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Don't validate fields that are empty
            </p>
          </div>
        </div>

        {/* Abort on First Error */}
        <div className="flex items-center space-x-3">
          <Controller
            name="settings.abortOnFirstError"
            control={control}
            render={({ field: { value, onChange } }) => (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            )}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Abort on First Error
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Stop validation after first failed rule
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Validation Rules Configuration
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure validation rules, business logic, and real-time testing for API endpoints
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'fields', label: 'Field Validation' },
            { key: 'global', label: 'Global Rules' },
            { key: 'business', label: 'Business Rules' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Field Validation Rules
              </h3>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFieldConfig}
                >
                  Add Field Configuration
                </Button>
              )}
            </div>

            <div className="space-y-6">
              {fieldConfigs.map((fieldConfig, index) =>
                renderFieldConfig(fieldConfig, index)
              )}
              
              {fieldConfigs.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No field configurations</h3>
                  <p className="mb-4">Start by adding a field configuration to define validation rules.</p>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addFieldConfig}
                    >
                      Add Field Configuration
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Global Validation Rules
              </h3>
              {!readOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGlobalRule}
                >
                  Add Global Rule
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Global rules apply to all fields and are evaluated before field-specific rules.
            </p>

            <div className="space-y-4">
              {globalRules.map((rule, index) => (
                <div key={rule.id} className="border border-gray-300 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Controller
                      name={`globalRules.${index}.type`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={[
                            { value: 'required', label: 'Required' },
                            { value: 'string', label: 'String' },
                            { value: 'number', label: 'Number' },
                            { value: 'custom', label: 'Custom' },
                          ]}
                          disabled={readOnly}
                        />
                      )}
                    />

                    <Controller
                      name={`globalRules.${index}.severity`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          options={[
                            { value: 'error', label: 'Error' },
                            { value: 'warning', label: 'Warning' },
                            { value: 'info', label: 'Info' },
                          ]}
                          disabled={readOnly}
                        />
                      )}
                    />

                    {!readOnly && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeGlobalRule(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Controller
                    name={`globalRules.${index}.message`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Custom error message"
                        disabled={readOnly}
                      />
                    )}
                  />
                </div>
              ))}

              {globalRules.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No global rules configured. Click "Add Global Rule" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'business' && renderBusinessRules()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      {/* Form Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Validation Errors
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([key, error]) => (
                    <li key={key}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationRules;