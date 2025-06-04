'use client';

/**
 * Main React component implementing the endpoint configuration workflow.
 * Replaces Angular reactive forms with React Hook Form and Zod validation.
 * Orchestrates HTTP method selection, parameter configuration, security rules,
 * and validation settings for API endpoint generation with real-time preview capabilities.
 * 
 * Features:
 * - React Hook Form 7.52+ with Zod schema validators per React/Next.js Integration Requirements
 * - Real-time validation under 100ms response time for optimal user experience
 * - Next.js API Routes for preview interface under /api/preview with server-side validation
 * - Tailwind CSS 4.1+ with consistent theme injection across components
 * - API generation workflow state management with React Query caching per Section 4.4.3.2
 * - MSW compatibility for comprehensive endpoint configuration testing workflows
 * 
 * Performance Requirements:
 * - Real-time validation under 100ms per technical specification
 * - API responses under 2 seconds per React/Next.js Integration Requirements
 * - Cache hit responses under 50ms for optimal user experience
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { FormProvider } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Component imports
import { HttpMethodSelector } from './http-method-selector';
import { ParameterBuilder } from './parameter-builder';
import { QueryConfiguration } from './query-configuration';
import { SecurityConfiguration } from './security-configuration';
import { ValidationRules } from './validation-rules';
import { PreviewPanel } from './preview-panel';

// Hook and schema imports
import { useEndpointForm, type UseEndpointFormOptions } from './hooks/use-endpoint-form';
import { type EndpointConfigFormData } from './schemas/endpoint-config.schema';

// Type imports
import {
  type HttpMethod,
  type EndpointConfig,
  type MethodSpecificConfig
} from './types/endpoint-config.types';

// UI component imports (assuming these exist based on other components)
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

/**
 * Props interface for the EndpointConfigForm component
 */
export interface EndpointConfigFormProps {
  /** Initial configuration data */
  initialData?: Partial<EndpointConfigFormData>;
  /** Unique identifier for configuration persistence */
  configId?: string;
  /** Service name for context */
  serviceName?: string;
  /** Table name for database-specific endpoints */
  tableName?: string;
  /** Enable multi-step form mode */
  multiStep?: boolean;
  /** Enable auto-save functionality */
  autoSave?: boolean;
  /** Enable real-time preview */
  enablePreview?: boolean;
  /** CSS class names */
  className?: string;
  /** Callback when configuration is saved */
  onSave?: (config: EndpointConfigFormData) => Promise<void> | void;
  /** Callback when configuration changes */
  onChange?: (config: Partial<EndpointConfigFormData>) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Test ID for automated testing */
  'data-testid'?: string;
}

/**
 * Form step configuration for multi-step mode
 */
const FORM_STEPS = [
  {
    id: 'basic',
    title: 'Basic Configuration',
    description: 'Configure HTTP method and endpoint details',
    icon: '🔧'
  },
  {
    id: 'parameters',
    title: 'Parameters',
    description: 'Configure path and query parameters',
    icon: '📝'
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Configure authentication and authorization',
    icon: '🔒'
  },
  {
    id: 'validation',
    title: 'Validation',
    description: 'Configure validation rules and constraints',
    icon: '✅'
  },
  {
    id: 'preview',
    title: 'Preview',
    description: 'Review and test configuration',
    icon: '👁️'
  }
] as const;

type FormStep = typeof FORM_STEPS[number]['id'];

/**
 * Main Endpoint Configuration Form Component
 * 
 * Provides a comprehensive interface for configuring API endpoints with real-time
 * validation, preview capabilities, and integration with Next.js API routes for
 * server-side validation per Section 5.2.
 */
export function EndpointConfigForm({
  initialData = {},
  configId,
  serviceName,
  tableName,
  multiStep = false,
  autoSave = true,
  enablePreview = true,
  className,
  onSave,
  onChange,
  onCancel,
  'data-testid': testId = 'endpoint-config-form'
}: EndpointConfigFormProps) {
  
  // Local state for multi-step form
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());
  const [isPreviewVisible, setIsPreviewVisible] = useState(enablePreview);

  // Form hook options
  const formOptions: UseEndpointFormOptions = useMemo(() => ({
    defaultValues: {
      endpoint: tableName ? `/${serviceName}/_table/${tableName}` : `/${serviceName}/custom`,
      summary: tableName ? `API endpoints for ${tableName} table` : 'Custom API endpoint',
      ...initialData
    },
    autoSave,
    configId,
    onDataChange: onChange,
    onSubmit: onSave
  }), [initialData, autoSave, configId, onChange, onSave, serviceName, tableName]);

  // Initialize form hook
  const { form, state, actions, preview } = useEndpointForm(formOptions);

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    if (!multiStep) return 100;
    
    const totalSteps = FORM_STEPS.length;
    const completed = completedSteps.size;
    return Math.round((completed / totalSteps) * 100);
  }, [multiStep, completedSteps.size]);

  // Get current method configuration
  const methodConfig = useMemo(() => {
    return actions.getMethodConfig();
  }, [actions, state.data.method]);

  // Handle step navigation
  const handleStepChange = useCallback(async (step: FormStep) => {
    if (multiStep) {
      // Validate current step before moving
      const isCurrentStepValid = await actions.validateStep(currentStep);
      
      if (isCurrentStepValid) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setCurrentStep(step);
      } else {
        toast.error(`Please complete the ${FORM_STEPS.find(s => s.id === currentStep)?.title} step`);
      }
    }
  }, [multiStep, currentStep, actions]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    try {
      if (multiStep) {
        // Validate all steps in multi-step mode
        const allValid = await actions.validateAll();
        if (!allValid) {
          toast.error('Please complete all required fields');
          return;
        }
      }
      
      await actions.handleSubmit();
      toast.success('Endpoint configuration saved successfully');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save endpoint configuration');
    }
  }, [multiStep, actions]);

  // Handle form reset
  const handleReset = useCallback(() => {
    actions.reset(initialData);
    setCurrentStep('basic');
    setCompletedSteps(new Set());
    toast.info('Form reset to initial state');
  }, [actions, initialData]);

  // Auto-save status indicator
  const AutoSaveIndicator = useMemo(() => {
    if (!autoSave || !state.autoSaveStatus || state.autoSaveStatus === 'idle') {
      return null;
    }

    const statusConfig = {
      saving: { text: 'Saving...', color: 'bg-blue-500' },
      saved: { text: 'Saved', color: 'bg-green-500' },
      error: { text: 'Save Error', color: 'bg-red-500' }
    };

    const config = statusConfig[state.autoSaveStatus];

    return (
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <div className={cn('w-2 h-2 rounded-full', config.color)} />
        <span>{config.text}</span>
      </div>
    );
  }, [autoSave, state.autoSaveStatus]);

  // Render form step content
  const renderStepContent = useCallback((step: FormStep) => {
    switch (step) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HTTP Method Selection */}
              <div className="space-y-4">
                <HttpMethodSelector
                  name="method"
                  label="HTTP Method"
                  description="Select the HTTP method for this endpoint"
                  required
                  showMethodConfig
                  onMethodChange={(method) => {
                    // Clear request body if method doesn't support it
                    if (method && !['POST', 'PUT', 'PATCH'].includes(method)) {
                      form.setValue('requestBody', undefined);
                    }
                  }}
                />
              </div>

              {/* Endpoint Path */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Endpoint Path *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="/api/v1/resource"
                          className="font-mono text-sm"
                          data-testid="endpoint-path-input"
                        />
                      </FormControl>
                      <FormDescription>
                        The URL path for this endpoint (must start with /)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Summary and Description */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Brief description of the endpoint"
                        maxLength={255}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief summary for API documentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Detailed description of the endpoint functionality..."
                        rows={4}
                        maxLength={1000}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description for API documentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 'parameters':
        return (
          <div className="space-y-6">
            <ParameterBuilder />
            {methodConfig?.allowParameters && (
              <QueryConfiguration />
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <SecurityConfiguration />
          </div>
        );

      case 'validation':
        return (
          <div className="space-y-6">
            <ValidationRules />
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <PreviewPanel
              configuration={state.data}
              validationResult={preview.validationPreview}
              openApiSpec={preview.openApiSpec}
            />
          </div>
        );

      default:
        return null;
    }
  }, [form, state.data, methodConfig, preview]);

  // Main form render
  return (
    <div 
      className={cn('space-y-6', className)}
      data-testid={testId}
    >
      <FormProvider {...form}>
        <Form {...form}>
          {/* Form Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Endpoint Configuration
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure API endpoint settings, parameters, and security rules
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {AutoSaveIndicator}
              {enablePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                  data-testid="toggle-preview"
                >
                  {isPreviewVisible ? 'Hide Preview' : 'Show Preview'}
                </Button>
              )}
            </div>
          </div>

          {/* Progress indicator for multi-step forms */}
          {multiStep && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{formProgress}% complete</span>
              </div>
              <Progress value={formProgress} className="h-2" />
            </div>
          )}

          {/* Form validation errors */}
          {!state.isValid && Object.keys(state.errors).length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                Please fix the following errors:
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {Object.entries(state.errors).map(([field, error]) => (
                    <li key={field} className="text-sm">
                      {field}: {error?.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main form content */}
            <div className={cn(
              'space-y-6',
              isPreviewVisible ? 'lg:col-span-8' : 'lg:col-span-12'
            )}>
              {multiStep ? (
                /* Multi-step form layout */
                <Card>
                  <CardHeader>
                    <Tabs value={currentStep} onValueChange={handleStepChange}>
                      <TabsList className="grid w-full grid-cols-5">
                        {FORM_STEPS.map((step) => (
                          <TabsTrigger
                            key={step.id}
                            value={step.id}
                            className="text-xs"
                            disabled={!completedSteps.has(step.id) && step.id !== currentStep}
                          >
                            <span className="mr-1">{step.icon}</span>
                            <span className="hidden sm:inline">{step.title}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {FORM_STEPS.map((step) => (
                        <TabsContent key={step.id} value={step.id} className="mt-0">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-lg font-medium">{step.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {step.description}
                              </p>
                            </div>
                            <Separator />
                            {renderStepContent(step.id)}
                          </div>
                        </TabsContent>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Single-page form layout */
                <div className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Configuration</CardTitle>
                      <CardDescription>
                        Configure HTTP method and endpoint details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderStepContent('basic')}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Parameters & Query Options</CardTitle>
                      <CardDescription>
                        Configure endpoint parameters and query settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderStepContent('parameters')}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Security Configuration</CardTitle>
                      <CardDescription>
                        Configure authentication and authorization requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderStepContent('security')}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Rules</CardTitle>
                      <CardDescription>
                        Configure validation constraints and rules
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderStepContent('validation')}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Preview panel */}
            {isPreviewVisible && enablePreview && (
              <div className="lg:col-span-4">
                <div className="sticky top-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span>Live Preview</span>
                        <Badge variant="secondary" className="text-xs">
                          Real-time
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Preview your API endpoint configuration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <PreviewPanel
                        configuration={state.data}
                        validationResult={preview.validationPreview}
                        openApiSpec={preview.openApiSpec}
                        compact
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Form actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="cancel-button"
                >
                  Cancel
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                data-testid="reset-button"
              >
                Reset
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              {multiStep && currentStep !== 'preview' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentIndex = FORM_STEPS.findIndex(s => s.id === currentStep);
                    if (currentIndex < FORM_STEPS.length - 1) {
                      handleStepChange(FORM_STEPS[currentIndex + 1].id);
                    }
                  }}
                  data-testid="next-step-button"
                >
                  Next Step
                </Button>
              )}
              
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={state.isSubmitting || !state.isValid}
                data-testid="save-button"
              >
                {state.isSubmitting ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </Form>
      </FormProvider>
    </div>
  );
}

/**
 * Export component and related types
 */
export default EndpointConfigForm;
export type { EndpointConfigFormProps };

/**
 * Export for testing utilities
 */
export { FORM_STEPS };