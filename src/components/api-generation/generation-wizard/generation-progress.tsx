'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWizard } from './wizard-provider';
import { Button } from '@/components/ui/button';
import { GenerationStatus, GenerationResult } from './types';
import { cn } from '@/lib/utils';

/**
 * Generation Progress Component
 * 
 * React component for the final wizard step displaying API generation progress, 
 * success confirmation, and navigation to generated API documentation.
 * 
 * Implements:
 * - F-003 REST API Endpoint Generation completion workflow per Section 2.1 Feature Catalog
 * - Real-time progress tracking with React Query mutations per React/Next.js Integration Requirements  
 * - Error handling and recovery workflows per Section 4.4.5 Error Handling Implementation
 * - Automatic navigation to API documentation upon successful generation per workflow requirements
 * 
 * Features:
 * - Real-time progress indication using React Query mutations with optimistic updates
 * - Success/error handling with user feedback and navigation to generated API documentation  
 * - Integration with completion workflows and automatic navigation to API documentation and testing interfaces
 * - Comprehensive error recovery with retry mechanisms and user feedback
 * - Progress tracking with detailed status messages and visual indicators
 * 
 * @returns {JSX.Element} Generation progress component
 */

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
}

interface GenerationProgressProps {
  className?: string;
  'data-testid'?: string;
}

/**
 * Progress indicator component for showing individual step status
 */
const ProgressIndicator: React.FC<{
  step: ProgressStep;
  index: number;
  total: number;
}> = ({ step, index, total }) => {
  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'active':
        return 'bg-blue-500 border-blue-500';
      case 'error':
        return 'bg-red-500 border-red-500';
      default:
        return 'bg-gray-200 border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'active':
        return (
          <div className="w-3 h-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        );
      case 'error':
        return (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center mr-4">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200',
            getStatusColor()
          )}
        >
          {getStatusIcon()}
        </div>
        {index < total - 1 && (
          <div
            className={cn(
              'w-0.5 h-16 mt-2 transition-colors duration-200',
              step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            'text-sm font-medium transition-colors duration-200',
            step.status === 'error'
              ? 'text-red-700 dark:text-red-300'
              : step.status === 'active'
              ? 'text-blue-700 dark:text-blue-300'
              : step.status === 'completed'
              ? 'text-green-700 dark:text-green-300'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {step.title}
        </h3>
        <p
          className={cn(
            'text-xs mt-1 transition-colors duration-200',
            step.status === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {step.description}
        </p>
        {step.status === 'active' && step.progress !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{step.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Alert component for displaying status messages
 */
const Alert: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actions?: React.ReactNode;
}> = ({ type, title, message, actions }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';
    }
  };

  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn('rounded-lg border p-4', getAlertStyles())}>
      <div className="flex">
        <div className={cn('flex-shrink-0', getIconStyles())}>
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm opacity-90">
            <p>{message}</p>
          </div>
          {actions && <div className="mt-4">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  className,
  'data-testid': testId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const wizard = useWizard();
  
  // Local state for progress tracking
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    {
      id: 'validate-config',
      title: 'Validating Configuration',
      description: 'Checking endpoint configurations and security settings',
      status: 'pending',
    },
    {
      id: 'generate-schema',
      title: 'Generating Database Schemas',
      description: 'Creating OpenAPI schemas from database table structures',
      status: 'pending',
    },
    {
      id: 'create-endpoints',
      title: 'Creating API Endpoints',
      description: 'Generating REST endpoints with configured parameters',
      status: 'pending',
    },
    {
      id: 'configure-security',
      title: 'Configuring Security',
      description: 'Applying access controls and authentication rules',
      status: 'pending',
    },
    {
      id: 'generate-docs',
      title: 'Generating Documentation',
      description: 'Creating interactive API documentation',
      status: 'pending',
    },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // React Query mutation for API generation with optimistic updates
  const generateApiMutation = useMutation({
    mutationFn: async () => {
      if (!wizard.serviceId || wizard.selectedTables.size === 0) {
        throw new Error('Invalid service configuration for API generation');
      }

      // Construct generation payload
      const generationPayload = {
        serviceId: wizard.serviceId,
        serviceName: wizard.serviceName,
        databaseType: wizard.databaseType,
        tables: Array.from(wizard.selectedTables.values()),
        configurations: Object.fromEntries(wizard.endpointConfigurations),
        globalConfiguration: wizard.globalConfiguration,
        timestamp: new Date().toISOString(),
      };

      // Call Next.js API route for generation
      const response = await fetch(`/api/generation/${wizard.serviceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `API generation failed: ${response.statusText}`
        );
      }

      return response.json() as Promise<GenerationResult>;
    },
    onMutate: async () => {
      // Optimistic update: Start generation process
      wizard.startGeneration();
      setRetryCount(0);
      setIsRetrying(false);
      
      // Update wizard progress state
      wizard.updateGenerationProgress({
        isGenerating: true,
        error: null,
        currentStep: 0,
      });
    },
    onSuccess: (result: GenerationResult) => {
      // Complete the generation process
      wizard.completeGeneration(result.endpointUrls);
      
      // Update final progress state
      wizard.updateGenerationProgress({
        isGenerating: false,
        currentStep: 100,
        completedSteps: progressSteps.map((_, index) => index),
      });

      // Mark all steps as completed
      setProgressSteps(steps =>
        steps.map(step => ({ ...step, status: 'completed' as const }))
      );
      setOverallProgress(100);

      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['api-docs'] });
    },
    onError: (error: Error) => {
      // Handle generation error
      wizard.setGenerationError(error.message);
      
      // Update current step to error status
      setProgressSteps(steps =>
        steps.map((step, index) =>
          index === currentStepIndex
            ? { ...step, status: 'error' as const, description: error.message }
            : step
        )
      );

      // Update wizard progress state
      wizard.updateGenerationProgress({
        isGenerating: false,
        error: error.message,
      });
    },
    retry: (failureCount, error) => {
      // Exponential backoff retry strategy per Section 4.4.5
      const maxRetries = 3;
      const shouldRetry = failureCount < maxRetries && !error.message.includes('authentication');
      
      if (shouldRetry) {
        setRetryCount(failureCount);
        setIsRetrying(true);
        
        // Update current step to show retry status
        setProgressSteps(steps =>
          steps.map((step, index) =>
            index === currentStepIndex
              ? {
                  ...step,
                  status: 'active' as const,
                  description: `Retrying... (attempt ${failureCount + 1}/${maxRetries})`,
                }
              : step
          )
        );
      }
      
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with max 30s
  });

  // Simulate progress steps during generation
  useEffect(() => {
    if (wizard.generationProgress.isGenerating && !wizard.generationProgress.error) {
      const interval = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          const nextIndex = Math.min(prevIndex + 1, progressSteps.length - 1);
          
          // Update step status
          setProgressSteps(steps =>
            steps.map((step, index) => {
              if (index < nextIndex) {
                return { ...step, status: 'completed' as const };
              } else if (index === nextIndex) {
                return { 
                  ...step, 
                  status: 'active' as const,
                  progress: Math.random() * 30 + 20, // Simulate progress within step
                };
              }
              return step;
            })
          );

          // Update overall progress
          const totalProgress = ((nextIndex + 0.5) / progressSteps.length) * 100;
          setOverallProgress(Math.min(totalProgress, 95)); // Leave 5% for completion

          return nextIndex;
        });
      }, 2000); // Progress every 2 seconds

      return () => clearInterval(interval);
    }
  }, [wizard.generationProgress.isGenerating, wizard.generationProgress.error, progressSteps.length]);

  // Auto-start generation when component mounts
  useEffect(() => {
    const canStartGeneration = 
      wizard.serviceId && 
      wizard.selectedTables.size > 0 && 
      !wizard.generationProgress.isGenerating &&
      !wizard.generationProgress.error &&
      wizard.generationProgress.generatedEndpoints.length === 0;

    if (canStartGeneration) {
      const timer = setTimeout(() => {
        generateApiMutation.mutate();
      }, 1000); // Small delay for better UX

      return () => clearTimeout(timer);
    }
  }, [
    wizard.serviceId,
    wizard.selectedTables.size,
    wizard.generationProgress.isGenerating,
    wizard.generationProgress.error,
    wizard.generationProgress.generatedEndpoints.length,
    generateApiMutation
  ]);

  // Navigation handlers
  const handleViewApiDocs = useCallback(() => {
    if (wizard.serviceId) {
      router.push(`/api-docs/${wizard.serviceId}`);
    }
  }, [router, wizard.serviceId]);

  const handleRetryGeneration = useCallback(() => {
    // Reset progress state
    setProgressSteps(steps =>
      steps.map(step => ({ ...step, status: 'pending' as const, progress: undefined }))
    );
    setCurrentStepIndex(0);
    setOverallProgress(0);
    
    // Clear wizard error state
    wizard.updateGenerationProgress({
      error: null,
      isGenerating: false,
    });

    // Retry the mutation
    generateApiMutation.mutate();
  }, [generateApiMutation, wizard]);

  const handleGoBack = useCallback(() => {
    wizard.goToPreviousStep();
  }, [wizard]);

  const handleStartOver = useCallback(() => {
    wizard.resetWizard();
    router.push('/api-connections/database');
  }, [wizard, router]);

  // Calculate current status
  const isGenerating = wizard.generationProgress.isGenerating || generateApiMutation.isPending;
  const hasError = !!wizard.generationProgress.error || generateApiMutation.isError;
  const isCompleted = wizard.generationProgress.generatedEndpoints.length > 0 && !isGenerating;
  const canRetry = hasError && retryCount < 3;

  return (
    <div 
      className={cn('space-y-6', className)}
      data-testid={testId}
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isGenerating && 'Generating Your APIs'}
          {hasError && 'Generation Failed'}
          {isCompleted && 'APIs Generated Successfully!'}
          {!isGenerating && !hasError && !isCompleted && 'Ready to Generate APIs'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isGenerating && 'Please wait while we create your REST API endpoints...'}
          {hasError && 'There was an issue generating your APIs. Please review the error and try again.'}
          {isCompleted && 'Your API endpoints have been created and are ready to use.'}
          {!isGenerating && !hasError && !isCompleted && 
            `Creating ${wizard.selectedTables.size} API endpoint${wizard.selectedTables.size === 1 ? '' : 's'} for ${wizard.serviceName}`
          }
        </p>
      </div>

      {/* Overall Progress Bar */}
      {(isGenerating || isCompleted) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                isCompleted 
                  ? 'bg-green-500' 
                  : 'bg-blue-500'
              )}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Generation Steps
        </h3>
        <div className="space-y-4">
          {progressSteps.map((step, index) => (
            <ProgressIndicator
              key={step.id}
              step={step}
              index={index}
              total={progressSteps.length}
            />
          ))}
        </div>
      </div>

      {/* Status Messages */}
      {hasError && (
        <Alert
          type="error"
          title="Generation Failed"
          message={wizard.generationProgress.error || 'An unexpected error occurred during API generation.'}
          actions={
            <div className="flex gap-2">
              {canRetry && (
                <Button
                  onClick={handleRetryGeneration}
                  variant="outline"
                  size="sm"
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry Generation'}
                </Button>
              )}
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="sm"
              >
                Go Back
              </Button>
              <Button
                onClick={handleStartOver}
                variant="ghost"
                size="sm"
              >
                Start Over
              </Button>
            </div>
          }
        />
      )}

      {isCompleted && (
        <Alert
          type="success"
          title="APIs Generated Successfully!"
          message={`${wizard.generationProgress.generatedEndpoints.length} API endpoint${
            wizard.generationProgress.generatedEndpoints.length === 1 ? '' : 's'
          } created successfully. Your APIs are now ready to use and test.`}
          actions={
            <div className="flex gap-2">
              <Button
                onClick={handleViewApiDocs}
                variant="default"
                size="sm"
              >
                View API Documentation
              </Button>
              <Button
                onClick={handleStartOver}
                variant="outline"
                size="sm"
              >
                Create Another API
              </Button>
            </div>
          }
        />
      )}

      {isGenerating && retryCount > 0 && (
        <Alert
          type="warning"
          title="Retrying Generation"
          message={`Attempting to retry generation (attempt ${retryCount + 1}/3). Please wait...`}
        />
      )}

      {/* Generation Details */}
      {isCompleted && wizard.generationProgress.generatedEndpoints.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Generated API Endpoints
          </h3>
          <div className="space-y-2">
            {wizard.generationProgress.generatedEndpoints.map((endpoint, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <code className="text-sm text-gray-800 dark:text-gray-200">
                  {endpoint}
                </code>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Ready
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isGenerating && !hasError && !isCompleted && (
        <div className="flex justify-between">
          <Button
            onClick={handleGoBack}
            variant="outline"
          >
            Go Back
          </Button>
          <Button
            onClick={() => generateApiMutation.mutate()}
            variant="default"
            disabled={wizard.selectedTables.size === 0}
          >
            Start Generation
          </Button>
        </div>
      )}
    </div>
  );
};

export default GenerationProgress;