'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Database, 
  Settings, 
  Eye, 
  Zap,
  Home
} from 'lucide-react';

// Internal component imports
import { TableSelection } from './table-selection';
import { EndpointConfiguration } from './endpoint-configuration';
import { GenerationPreview } from './generation-preview';
import { GenerationProgress } from './generation-progress';

// UI component imports (assuming these exist based on the design system)
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// Types and validation schemas
interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<any>;
  validation?: z.ZodSchema<any>;
  isCompleted: boolean;
  isAccessible: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

interface WizardFormData {
  serviceId: string;
  selectedTables: string[];
  endpointConfiguration: Record<string, any>;
  previewConfiguration: Record<string, any>;
}

interface WizardLayoutProps {
  serviceId: string;
  onComplete?: (result: { success: boolean; serviceId: string; endpointsGenerated?: number }) => void;
  onCancel?: () => void;
  className?: string;
}

// Form validation schema for the entire wizard
const wizardFormSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  selectedTables: z.array(z.string()).min(1, 'At least one table must be selected'),
  endpointConfiguration: z.record(z.any()).optional(),
  previewConfiguration: z.record(z.any()).optional(),
});

// Utility function for conditional class names
const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * WizardLayout Component
 * 
 * Main wizard container component providing the layout structure, step navigation, 
 * progress indication, and coordinated step rendering for the API generation workflow.
 * 
 * Features:
 * - Multi-step wizard navigation with validation
 * - Progress indication and step validation
 * - React Hook Form integration across steps
 * - Responsive design with Tailwind CSS
 * - WCAG 2.1 AA accessibility compliance
 * - Comprehensive error handling and loading states
 * - Step completion tracking and conditional navigation
 */
export const WizardLayout: React.FC<WizardLayoutProps> = ({
  serviceId,
  onComplete,
  onCancel,
  className,
}) => {
  const router = useRouter();
  
  // Form management with React Hook Form
  const methods = useForm<WizardFormData>({
    resolver: zodResolver(wizardFormSchema),
    defaultValues: {
      serviceId,
      selectedTables: [],
      endpointConfiguration: {},
      previewConfiguration: {},
    },
    mode: 'onChange', // Enable real-time validation
  });

  const { watch, trigger, getValues, formState: { errors, isValid } } = methods;
  
  // Watch form values for step validation
  const formValues = watch();
  
  // Wizard state management
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Define wizard steps with validation and accessibility
  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'table-selection',
      title: 'Select Tables',
      description: 'Choose database tables for API generation',
      icon: Database,
      component: TableSelection,
      validation: z.object({
        selectedTables: z.array(z.string()).min(1, 'Select at least one table'),
      }),
      isCompleted: formValues.selectedTables?.length > 0,
      isAccessible: true,
    },
    {
      id: 'endpoint-configuration',
      title: 'Configure Endpoints',
      description: 'Set up API endpoints and parameters',
      icon: Settings,
      component: EndpointConfiguration,
      validation: z.object({
        endpointConfiguration: z.record(z.any()).refine(
          (config) => Object.keys(config).length > 0,
          'Configure at least one endpoint'
        ),
      }),
      isCompleted: formValues.endpointConfiguration && Object.keys(formValues.endpointConfiguration).length > 0,
      isAccessible: formValues.selectedTables?.length > 0,
    },
    {
      id: 'preview',
      title: 'Preview & Review',
      description: 'Review generated API specifications',
      icon: Eye,
      component: GenerationPreview,
      isCompleted: formValues.previewConfiguration && Object.keys(formValues.previewConfiguration).length > 0,
      isAccessible: formValues.selectedTables?.length > 0 && 
                   formValues.endpointConfiguration && 
                   Object.keys(formValues.endpointConfiguration).length > 0,
    },
    {
      id: 'generation',
      title: 'Generate APIs',
      description: 'Generate and deploy API endpoints',
      icon: Zap,
      component: GenerationProgress,
      isCompleted: false,
      isAccessible: formValues.selectedTables?.length > 0 && 
                   formValues.endpointConfiguration && 
                   Object.keys(formValues.endpointConfiguration).length > 0 &&
                   formValues.previewConfiguration &&
                   Object.keys(formValues.previewConfiguration).length > 0,
    },
  ], [formValues]);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const completedSteps = steps.filter(step => step.isCompleted).length;
    return Math.round((completedSteps / steps.length) * 100);
  }, [steps]);

  // Step navigation handlers
  const handleNextStep = useCallback(async () => {
    setIsNavigating(true);
    setGlobalError(null);

    try {
      // Validate current step
      const currentStepConfig = steps[currentStep];
      if (currentStepConfig.validation) {
        const isStepValid = await trigger(['selectedTables', 'endpointConfiguration', 'previewConfiguration']);
        if (!isStepValid) {
          setGlobalError('Please complete the current step before proceeding.');
          return;
        }
      }

      // Check if next step is accessible
      const nextStepIndex = currentStep + 1;
      if (nextStepIndex < steps.length && steps[nextStepIndex].isAccessible) {
        setCurrentStep(nextStepIndex);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setGlobalError('An error occurred while navigating. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  }, [currentStep, steps, trigger]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setGlobalError(null);
    }
  }, [currentStep]);

  const handleStepClick = useCallback(async (stepIndex: number) => {
    const targetStep = steps[stepIndex];
    
    if (!targetStep.isAccessible) {
      setGlobalError('Complete previous steps before accessing this step.');
      return;
    }

    // Allow going back to any accessible step, or forward if current step is valid
    if (stepIndex < currentStep || steps[currentStep].isCompleted) {
      setCurrentStep(stepIndex);
      setGlobalError(null);
    } else {
      setGlobalError('Complete the current step before proceeding.');
    }
  }, [currentStep, steps]);

  // Handle wizard completion
  const handleWizardComplete = useCallback((result: any) => {
    if (onComplete) {
      onComplete(result);
    } else {
      // Default navigation to service documentation
      router.push(`/api-connections/database/${serviceId}/docs`);
    }
  }, [onComplete, router, serviceId]);

  // Handle wizard cancellation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      // Default navigation back to services
      router.push('/api-connections/database');
    }
  }, [onCancel, router]);

  // Effect to handle browser back button and cleanup
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep > 0) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep]);

  // Render current step component
  const renderCurrentStep = () => {
    const currentStepConfig = steps[currentStep];
    const StepComponent = currentStepConfig.component;

    const stepProps = {
      serviceId,
      selectedTables: formValues.selectedTables || [],
      onTablesChange: (tables: string[]) => {
        methods.setValue('selectedTables', tables, { shouldValidate: true });
      },
      onConfigurationChange: (config: any) => {
        methods.setValue('endpointConfiguration', config, { shouldValidate: true });
      },
      onPreviewChange: (config: any) => {
        methods.setValue('previewConfiguration', config, { shouldValidate: true });
      },
      onNext: currentStep < steps.length - 1 ? handleNextStep : undefined,
      onComplete: currentStep === steps.length - 1 ? handleWizardComplete : undefined,
    };

    return (
      <div className="flex-1 min-h-0">
        <StepComponent {...stepProps} />
      </div>
    );
  };

  return (
    <div className={cn(
      'flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      className
    )}>
      {/* Header Section */}
      <div className="flex-shrink-0 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="flex items-center space-x-2"
              aria-label="Cancel API generation wizard"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Services</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                API Generation Wizard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate REST APIs from your database tables in under 5 minutes
              </p>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </div>
            <div className="w-32">
              <Progress 
                value={progressPercentage} 
                className="h-2"
                aria-label={`Wizard progress: ${progressPercentage}% complete`}
              />
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {progressPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex-shrink-0 py-6">
        <nav aria-label="API generation wizard steps">
          <ol className="flex items-center justify-between space-x-4 md:space-x-8">
            {steps.map((step, index) => {
              const isCurrent = index === currentStep;
              const isCompleted = step.isCompleted;
              const isAccessible = step.isAccessible;
              const hasError = step.hasError;

              return (
                <li 
                  key={step.id} 
                  className="flex-1 flex items-center"
                  role="presentation"
                >
                  <button
                    onClick={() => handleStepClick(index)}
                    disabled={!isAccessible || isNavigating}
                    className={cn(
                      'group flex flex-col items-center space-y-2 p-2 rounded-lg transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                      isAccessible && !isNavigating
                        ? 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                        : 'cursor-not-allowed opacity-60',
                      isCurrent && 'bg-blue-50 dark:bg-blue-900/20'
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`${step.title}: ${step.description}`}
                  >
                    {/* Step Icon */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : hasError
                          ? 'bg-red-500 border-red-500 text-white'
                          : isCurrent
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : isAccessible
                          ? 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : hasError ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="text-center">
                      <div
                        className={cn(
                          'text-sm font-medium transition-colors',
                          isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : hasError
                            ? 'text-red-600 dark:text-red-400'
                            : isAccessible
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400 dark:text-gray-600'
                        )}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </button>

                  {/* Step Connector */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-px mx-4',
                        isCompleted
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Global Error Display */}
      {globalError && (
        <div className="flex-shrink-0 mb-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {globalError}
              </p>
              <button
                onClick={() => setGlobalError(null)}
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
                aria-label="Dismiss error"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <FormProvider {...methods}>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {renderCurrentStep()}
        </div>
      </FormProvider>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStep === 0 || isNavigating}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {/* Step Information */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <div className="md:hidden">
              <Progress value={progressPercentage} className="w-16 h-2" />
            </div>
          </div>

          {/* Next/Complete Button */}
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNextStep}
              disabled={!steps[currentStep].isCompleted || isNavigating || !steps[currentStep + 1]?.isAccessible}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => handleWizardComplete({ success: true, serviceId })}
              disabled={!steps[currentStep].isCompleted || isNavigating}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Zap className="h-4 w-4" />
              <span>Generate APIs</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WizardLayout;