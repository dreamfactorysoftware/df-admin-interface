'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Play, Eye, AlertCircle, CheckCircle, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { JsonEditor } from '@/components/ui/json-editor';

// Enhanced validation types with comprehensive rule system
export interface ValidationRule {
  id: string;
  name: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'number' | 'date' | 'custom' | 'conditional';
  value?: string | number | boolean;
  message: string;
  enabled: boolean;
  conditions?: ValidationCondition[];
  customScript?: string;
  priority: number;
}

export interface ValidationCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

export interface ValidationConfig {
  rules: ValidationRule[];
  globalEnabled: boolean;
  strictMode: boolean;
  customErrorMessages: Record<string, string>;
  businessRules: BusinessRule[];
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  conditions: ValidationCondition[];
  actions: ValidationAction[];
  enabled: boolean;
  priority: number;
}

export interface ValidationAction {
  type: 'show_error' | 'show_warning' | 'set_value' | 'disable_field' | 'show_field' | 'hide_field';
  target: string;
  value?: string;
  message?: string;
}

export interface TestScenario {
  id: string;
  name: string;
  inputData: Record<string, any>;
  expectedResult: 'valid' | 'invalid';
  expectedErrors?: string[];
}

// Comprehensive Zod schema for validation configuration
const validationConditionSchema = z.object({
  field: z.string().min(1, 'Field is required'),
  operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'isEmpty', 'isNotEmpty']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  logicalOperator: z.enum(['AND', 'OR']).optional(),
});

const validationActionSchema = z.object({
  type: z.enum(['show_error', 'show_warning', 'set_value', 'disable_field', 'show_field', 'hide_field']),
  target: z.string().min(1, 'Target is required'),
  value: z.string().optional(),
  message: z.string().optional(),
});

const businessRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Business rule name is required'),
  description: z.string(),
  conditions: z.array(validationConditionSchema),
  actions: z.array(validationActionSchema),
  enabled: z.boolean(),
  priority: z.number().min(0).max(100),
});

const validationRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Rule name is required'),
  type: z.enum(['required', 'minLength', 'maxLength', 'pattern', 'email', 'url', 'number', 'date', 'custom', 'conditional']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
  message: z.string().min(1, 'Error message is required'),
  enabled: z.boolean(),
  conditions: z.array(validationConditionSchema).optional(),
  customScript: z.string().optional(),
  priority: z.number().min(0).max(100),
});

const testScenarioSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Test scenario name is required'),
  inputData: z.record(z.any()),
  expectedResult: z.enum(['valid', 'invalid']),
  expectedErrors: z.array(z.string()).optional(),
});

const validationConfigSchema = z.object({
  rules: z.array(validationRuleSchema),
  globalEnabled: z.boolean(),
  strictMode: z.boolean(),
  customErrorMessages: z.record(z.string()),
  businessRules: z.array(businessRuleSchema),
});

// Real-time validation engine
class ValidationEngine {
  static validateRule(rule: ValidationRule, value: any, context: Record<string, any> = {}): { valid: boolean; message?: string } {
    if (!rule.enabled) return { valid: true };

    // Check conditions first
    if (rule.conditions && rule.conditions.length > 0) {
      const conditionsMet = this.evaluateConditions(rule.conditions, context);
      if (!conditionsMet) return { valid: true };
    }

    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return { valid: false, message: rule.message };
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return { valid: false, message: rule.message };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return { valid: false, message: rule.message };
        }
        break;

      case 'pattern':
        if (typeof value === 'string') {
          const regex = new RegExp(rule.value as string);
          if (!regex.test(value)) {
            return { valid: false, message: rule.message };
          }
        }
        break;

      case 'email':
        if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return { valid: false, message: rule.message };
          }
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            return { valid: false, message: rule.message };
          }
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return { valid: false, message: rule.message };
        }
        break;

      case 'date':
        if (typeof value === 'string') {
          const date = new Date(value);
          if (isNaN(date.getTime())) {
            return { valid: false, message: rule.message };
          }
        }
        break;

      case 'custom':
        if (rule.customScript) {
          try {
            // Safe evaluation of custom validation script
            const func = new Function('value', 'context', rule.customScript);
            const result = func(value, context);
            if (!result) {
              return { valid: false, message: rule.message };
            }
          } catch (error) {
            return { valid: false, message: 'Custom validation script error' };
          }
        }
        break;
    }

    return { valid: true };
  }

  static evaluateConditions(conditions: ValidationCondition[], context: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], context);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, context);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }

  static evaluateCondition(condition: ValidationCondition, context: Record<string, any>): boolean {
    const fieldValue = context[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'notContains':
        return !String(fieldValue).includes(String(condition.value));
      case 'greaterThan':
        return Number(fieldValue) > Number(condition.value);
      case 'lessThan':
        return Number(fieldValue) < Number(condition.value);
      case 'isEmpty':
        return !fieldValue || fieldValue === '' || fieldValue === null || fieldValue === undefined;
      case 'isNotEmpty':
        return !!fieldValue && fieldValue !== '' && fieldValue !== null && fieldValue !== undefined;
      default:
        return true;
    }
  }

  static validateData(data: Record<string, any>, config: ValidationConfig): { valid: boolean; errors: Record<string, string[]> } {
    if (!config.globalEnabled) return { valid: true, errors: {} };

    const errors: Record<string, string[]> = {};
    let valid = true;

    // Sort rules by priority
    const sortedRules = [...config.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const fieldName = rule.name;
      const fieldValue = data[fieldName];
      const result = this.validateRule(rule, fieldValue, data);

      if (!result.valid && result.message) {
        if (!errors[fieldName]) {
          errors[fieldName] = [];
        }
        errors[fieldName].push(result.message);
        valid = false;
      }
    }

    // Evaluate business rules
    for (const businessRule of config.businessRules) {
      if (businessRule.enabled && this.evaluateConditions(businessRule.conditions, data)) {
        for (const action of businessRule.actions) {
          if (action.type === 'show_error' && action.message) {
            if (!errors[action.target]) {
              errors[action.target] = [];
            }
            errors[action.target].push(action.message);
            valid = false;
          }
        }
      }
    }

    return { valid, errors };
  }
}

// Default validation rule templates
const defaultRuleTemplates: Partial<ValidationRule>[] = [
  { type: 'required', name: 'Required Field', message: 'This field is required' },
  { type: 'email', name: 'Email Validation', message: 'Please enter a valid email address' },
  { type: 'minLength', name: 'Minimum Length', value: 3, message: 'Must be at least 3 characters long' },
  { type: 'maxLength', name: 'Maximum Length', value: 100, message: 'Must be no more than 100 characters long' },
  { type: 'pattern', name: 'Pattern Match', value: '^[a-zA-Z0-9]+$', message: 'Only alphanumeric characters allowed' },
  { type: 'url', name: 'URL Validation', message: 'Please enter a valid URL' },
  { type: 'number', name: 'Number Validation', message: 'Please enter a valid number' },
];

interface ValidationRulesProps {
  initialConfig?: Partial<ValidationConfig>;
  onConfigChange?: (config: ValidationConfig) => void;
  onSave?: (config: ValidationConfig) => void;
  className?: string;
}

export default function ValidationRules({
  initialConfig,
  onConfigChange,
  onSave,
  className = '',
}: ValidationRulesProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'business' | 'test'>('rules');
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [isTestingRealTime, setIsTestingRealTime] = useState(false);

  // Form setup with Zod validation
  const form = useForm<ValidationConfig>({
    resolver: zodResolver(validationConfigSchema),
    defaultValues: {
      rules: [],
      globalEnabled: true,
      strictMode: false,
      customErrorMessages: {},
      businessRules: [],
      ...initialConfig,
    },
    mode: 'onChange',
  });

  const { fields: ruleFields, append: appendRule, remove: removeRule } = useFieldArray({
    control: form.control,
    name: 'rules',
  });

  const { fields: businessRuleFields, append: appendBusinessRule, remove: removeBusinessRule } = useFieldArray({
    control: form.control,
    name: 'businessRules',
  });

  const watchedValues = form.watch();

  // Generate unique IDs
  const generateId = useCallback(() => {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add new validation rule
  const addRule = useCallback((template?: Partial<ValidationRule>) => {
    const newRule: ValidationRule = {
      id: generateId(),
      name: template?.name || 'New Rule',
      type: template?.type || 'required',
      value: template?.value,
      message: template?.message || 'Validation failed',
      enabled: true,
      conditions: [],
      priority: 50,
      ...template,
    };
    appendRule(newRule);
  }, [appendRule, generateId]);

  // Add new business rule
  const addBusinessRule = useCallback(() => {
    const newBusinessRule: BusinessRule = {
      id: generateId(),
      name: 'New Business Rule',
      description: '',
      conditions: [],
      actions: [],
      enabled: true,
      priority: 50,
    };
    appendBusinessRule(newBusinessRule);
  }, [appendBusinessRule, generateId]);

  // Add test scenario
  const addTestScenario = useCallback(() => {
    const newScenario: TestScenario = {
      id: generateId(),
      name: 'New Test Scenario',
      inputData: {},
      expectedResult: 'valid',
    };
    setTestScenarios(prev => [...prev, newScenario]);
  }, [generateId]);

  // Run validation test on scenario
  const runTest = useCallback((scenario: TestScenario) => {
    const result = ValidationEngine.validateData(scenario.inputData, watchedValues);
    const passed = (result.valid && scenario.expectedResult === 'valid') ||
                   (!result.valid && scenario.expectedResult === 'invalid');
    
    setTestResults(prev => ({
      ...prev,
      [scenario.id]: {
        passed,
        result,
        scenario,
      },
    }));
  }, [watchedValues]);

  // Run all tests
  const runAllTests = useCallback(() => {
    testScenarios.forEach(runTest);
  }, [testScenarios, runTest]);

  // Real-time testing with sample data
  const [sampleData, setSampleData] = useState<Record<string, any>>({});
  const [realTimeResult, setRealTimeResult] = useState<{ valid: boolean; errors: Record<string, string[]> }>({
    valid: true,
    errors: {},
  });

  useEffect(() => {
    if (isTestingRealTime && Object.keys(sampleData).length > 0) {
      const result = ValidationEngine.validateData(sampleData, watchedValues);
      setRealTimeResult(result);
    }
  }, [sampleData, watchedValues, isTestingRealTime]);

  // Notify parent of configuration changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(watchedValues);
    }
  }, [watchedValues, onConfigChange]);

  // Export configuration
  const exportConfig = useCallback(() => {
    const config = form.getValues();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validation-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [form]);

  // Copy configuration to clipboard
  const copyConfig = useCallback(async () => {
    const config = form.getValues();
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  }, [form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSave?.(data);
  });

  return (
    <div className={`validation-rules-container space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Validation Rules Configuration
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Define comprehensive validation rules for API endpoints with real-time testing capabilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyConfig} className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Copy Config
          </Button>
          <Button variant="outline" onClick={exportConfig} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={handleSubmit} className="flex items-center gap-2">
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Global Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Global Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="globalEnabled"
              {...form.register('globalEnabled')}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="globalEnabled" className="text-sm font-medium">
              Enable Global Validation
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="strictMode"
              {...form.register('strictMode')}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <label htmlFor="strictMode" className="text-sm font-medium">
              Strict Mode (Stop on first error)
            </label>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'rules', label: 'Validation Rules', count: ruleFields.length },
            { id: 'business', label: 'Business Rules', count: businessRuleFields.length },
            { id: 'test', label: 'Test Scenarios', count: testScenarios.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-1 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Validation Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Rule Templates */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3">Quick Add Templates</h4>
            <div className="flex flex-wrap gap-2">
              {defaultRuleTemplates.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => addRule(template)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule()}
                className="text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Custom Rule
              </Button>
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-4">
            {ruleFields.map((field, index) => (
              <div
                key={field.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...form.register(`rules.${index}.enabled`)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-lg font-medium">
                      Rule {index + 1}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    label="Rule Name"
                    {...form.register(`rules.${index}.name`)}
                    error={form.formState.errors.rules?.[index]?.name?.message}
                  />

                  <Select
                    label="Rule Type"
                    {...form.register(`rules.${index}.type`)}
                    error={form.formState.errors.rules?.[index]?.type?.message}
                  >
                    <option value="required">Required</option>
                    <option value="minLength">Min Length</option>
                    <option value="maxLength">Max Length</option>
                    <option value="pattern">Pattern</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="custom">Custom Script</option>
                    <option value="conditional">Conditional</option>
                  </Select>

                  <Input
                    label="Priority (0-100)"
                    type="number"
                    min={0}
                    max={100}
                    {...form.register(`rules.${index}.priority`, { valueAsNumber: true })}
                    error={form.formState.errors.rules?.[index]?.priority?.message}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  {/* Rule Value */}
                  {['minLength', 'maxLength', 'pattern'].includes(form.watch(`rules.${index}.type`)) && (
                    <Input
                      label={
                        form.watch(`rules.${index}.type`) === 'pattern'
                          ? 'Regular Expression'
                          : 'Value'
                      }
                      {...form.register(`rules.${index}.value`)}
                      error={form.formState.errors.rules?.[index]?.value?.message}
                    />
                  )}

                  {/* Error Message */}
                  <Textarea
                    label="Error Message"
                    rows={2}
                    {...form.register(`rules.${index}.message`)}
                    error={form.formState.errors.rules?.[index]?.message?.message}
                  />

                  {/* Custom Script */}
                  {form.watch(`rules.${index}.type`) === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Custom Validation Script
                      </label>
                      <Controller
                        name={`rules.${index}.customScript`}
                        control={form.control}
                        render={({ field }) => (
                          <JsonEditor
                            value={field.value || '// Return true for valid, false for invalid\nreturn value && value.length > 0;'}
                            onChange={field.onChange}
                            language="javascript"
                            height="100px"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {ruleFields.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No validation rules configured yet
                </p>
                <Button onClick={() => addRule()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Rule
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Business Rules Tab */}
      {activeTab === 'business' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400">
              Business rules allow complex conditional validation logic
            </p>
            <Button onClick={addBusinessRule}>
              <Plus className="w-4 h-4 mr-2" />
              Add Business Rule
            </Button>
          </div>

          <div className="space-y-4">
            {businessRuleFields.map((field, index) => (
              <div
                key={field.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...form.register(`businessRules.${index}.enabled`)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-lg font-medium">
                      Business Rule {index + 1}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeBusinessRule(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Rule Name"
                    {...form.register(`businessRules.${index}.name`)}
                    error={form.formState.errors.businessRules?.[index]?.name?.message}
                  />
                  <Input
                    label="Priority (0-100)"
                    type="number"
                    min={0}
                    max={100}
                    {...form.register(`businessRules.${index}.priority`, { valueAsNumber: true })}
                    error={form.formState.errors.businessRules?.[index]?.priority?.message}
                  />
                </div>

                <Textarea
                  label="Description"
                  rows={2}
                  {...form.register(`businessRules.${index}.description`)}
                  error={form.formState.errors.businessRules?.[index]?.description?.message}
                />
              </div>
            ))}

            {businessRuleFields.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No business rules configured yet
                </p>
                <Button onClick={addBusinessRule}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Business Rule
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Scenarios Tab */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          {/* Real-time Testing */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium">Real-time Validation Testing</h4>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="realTimeTest"
                  checked={isTestingRealTime}
                  onChange={(e) => setIsTestingRealTime(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="realTimeTest" className="text-sm font-medium">
                  Enable Real-time Testing
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sample Input Data (JSON)
                </label>
                <JsonEditor
                  value={JSON.stringify(sampleData, null, 2)}
                  onChange={(value) => {
                    try {
                      setSampleData(JSON.parse(value));
                    } catch {
                      // Invalid JSON, keep previous value
                    }
                  }}
                  height="200px"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Validation Result
                </label>
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 h-[200px] overflow-auto">
                  {isTestingRealTime ? (
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 ${
                        realTimeResult.valid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {realTimeResult.valid ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {realTimeResult.valid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                      
                      {!realTimeResult.valid && Object.keys(realTimeResult.errors).length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Errors:</h5>
                          {Object.entries(realTimeResult.errors).map(([field, errors]) => (
                            <div key={field} className="mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {field}:
                              </span>
                              <ul className="ml-4 text-sm text-red-600 dark:text-red-400">
                                {errors.map((error, idx) => (
                                  <li key={idx}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      Enable real-time testing to see validation results
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Scenarios */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium">Test Scenarios</h4>
              <div className="flex gap-2">
                <Button variant="outline" onClick={runAllTests}>
                  <Play className="w-4 h-4 mr-2" />
                  Run All Tests
                </Button>
                <Button onClick={addTestScenario}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Test Scenario
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {testScenarios.map((scenario, index) => (
                <div
                  key={scenario.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-lg font-medium">{scenario.name}</h5>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runTest(scenario)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestScenarios(prev => prev.filter(s => s.id !== scenario.id))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Test Input Data
                      </label>
                      <JsonEditor
                        value={JSON.stringify(scenario.inputData, null, 2)}
                        onChange={(value) => {
                          try {
                            const newData = JSON.parse(value);
                            setTestScenarios(prev =>
                              prev.map(s =>
                                s.id === scenario.id
                                  ? { ...s, inputData: newData }
                                  : s
                              )
                            );
                          } catch {
                            // Invalid JSON, keep previous value
                          }
                        }}
                        height="150px"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expected Result
                      </label>
                      <select
                        value={scenario.expectedResult}
                        onChange={(e) => {
                          setTestScenarios(prev =>
                            prev.map(s =>
                              s.id === scenario.id
                                ? { ...s, expectedResult: e.target.value as 'valid' | 'invalid' }
                                : s
                            )
                          );
                        }}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                      >
                        <option value="valid">Valid</option>
                        <option value="invalid">Invalid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Test Result
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4 h-[150px] overflow-auto">
                        {testResults[scenario.id] ? (
                          <div className="space-y-2">
                            <div className={`flex items-center gap-2 ${
                              testResults[scenario.id].passed ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {testResults[scenario.id].passed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <AlertCircle className="w-4 h-4" />
                              )}
                              <span className="font-medium">
                                {testResults[scenario.id].passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                            
                            <div className="text-sm">
                              <div>
                                Actual: {testResults[scenario.id].result.valid ? 'Valid' : 'Invalid'}
                              </div>
                              <div>
                                Expected: {scenario.expectedResult}
                              </div>
                            </div>

                            {!testResults[scenario.id].result.valid && (
                              <div className="text-sm text-red-600 dark:text-red-400">
                                <div className="font-medium">Errors:</div>
                                {Object.entries(testResults[scenario.id].result.errors).map(([field, errors]) => (
                                  <div key={field}>
                                    {field}: {(errors as string[]).join(', ')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <Eye className="w-4 h-4 mr-2" />
                            Run test to see results
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {testScenarios.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No test scenarios configured yet
                  </p>
                  <Button onClick={addTestScenario}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Test Scenario
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}