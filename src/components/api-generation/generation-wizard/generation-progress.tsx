'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Generation Progress Component
 * 
 * React component for the final wizard step displaying API generation progress,
 * success confirmation, and navigation to generated API documentation.
 * Implements progress tracking, error handling, and completion workflows with user feedback.
 * 
 * Features:
 * - Real-time progress tracking with React Query mutations
 * - Success/error handling with user feedback
 * - Automatic navigation to API documentation upon successful generation
 * - Error recovery workflows with retry capabilities
 * - WCAG 2.1 AA accessibility compliance
 */

// Types for component props and state
interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  description?: string;
  error?: string;
}

interface ApiGenerationResult {
  success: boolean;
  serviceId?: string;
  endpointsGenerated?: number;
  documentationUrl?: string;
  error?: string;
  details?: string;
}

interface GenerationProgressProps {
  onComplete?: (result: ApiGenerationResult) => void;
  onError?: (error: string) => void;
  onRetry?: () => void;
}

// Mock hook interface for use-api-generation
// In real implementation, this would be imported from '@/hooks/use-api-generation'
interface UseApiGenerationResult {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  generateApi: () => Promise<ApiGenerationResult>;
  error: string | null;
  result: ApiGenerationResult | null;
  retry: () => void;
}

// Mock implementation of use-api-generation hook
// This would be replaced with actual hook import
const useApiGeneration = (): UseApiGenerationResult => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiGenerationResult | null>(null);

  const generateApi = async (): Promise<ApiGenerationResult> => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Simulate API generation steps
      const steps = [
        'Analyzing selected tables...',
        'Generating endpoint configurations...',
        'Creating OpenAPI specification...',
        'Deploying API endpoints...',
        'Configuring security rules...',
        'Generating documentation...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const mockResult: ApiGenerationResult = {
        success: true,
        serviceId: 'db-service-123',
        endpointsGenerated: 12,
        documentationUrl: '/api-docs/db-service-123'
      };

      setResult(mockResult);
      return mockResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API generation failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
      setCurrentStep('');
    }
  };

  const retry = () => {
    setError(null);
    setResult(null);
    setProgress(0);
  };

  return {
    isGenerating,
    progress,
    currentStep,
    generateApi,
    error,
    result,
    retry
  };
};

/**
 * Progress bar component with accessibility features
 */
const ProgressBar: React.FC<{ 
  progress: number; 
  className?: string;
  'aria-label'?: string;
}> = ({ progress, className = '', 'aria-label': ariaLabel }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-3 ${className}`}>
      <div
        className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel || `Progress: ${progress}%`}
      />
    </div>
  );
};

/**
 * Generation step indicator component
 */
const StepIndicator: React.FC<{ steps: GenerationStep[] }> = ({ steps }) => {
  return (
    <div className="space-y-4" role="list" aria-label="Generation progress steps">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className="flex items-start space-x-3"
          role="listitem"
        >
          <div className="flex-shrink-0 mt-1">
            {step.status === 'completed' && (
              <CheckCircleSolidIcon
                className="h-5 w-5 text-green-500"
                aria-hidden="true"
              />
            )}
            {step.status === 'in-progress' && (
              <ArrowPathIcon
                className="h-5 w-5 text-blue-500 animate-spin"
                aria-hidden="true"
              />
            )}
            {step.status === 'error' && (
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            )}
            {step.status === 'pending' && (
              <div
                className="h-5 w-5 rounded-full border-2 border-gray-300"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              step.status === 'completed' ? 'text-green-700' :
              step.status === 'in-progress' ? 'text-blue-700' :
              step.status === 'error' ? 'text-red-700' :
              'text-gray-500'
            }`}>
              {step.label}
            </p>
            {step.description && (
              <p className="text-sm text-gray-500 mt-1">
                {step.description}
              </p>
            )}
            {step.error && step.status === 'error' && (
              <p className="text-sm text-red-600 mt-1">
                {step.error}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Main Generation Progress Component
 */
export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  onComplete,
  onError,
  onRetry
}) => {
  const router = useRouter();
  const { 
    isGenerating, 
    progress, 
    currentStep, 
    generateApi, 
    error, 
    result, 
    retry 
  } = useApiGeneration();

  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([
    {
      id: 'analyze',
      label: 'Analyzing Database Schema',
      status: 'pending',
      description: 'Examining selected tables and relationships'
    },
    {
      id: 'configure',
      label: 'Configuring API Endpoints',
      status: 'pending',
      description: 'Setting up CRUD operations and parameters'
    },
    {
      id: 'generate',
      label: 'Generating OpenAPI Specification',
      status: 'pending',
      description: 'Creating comprehensive API documentation'
    },
    {
      id: 'deploy',
      label: 'Deploying API Endpoints',
      status: 'pending',
      description: 'Making APIs available and accessible'
    },
    {
      id: 'security',
      label: 'Applying Security Configuration',
      status: 'pending',
      description: 'Implementing access controls and permissions'
    },
    {
      id: 'documentation',
      label: 'Preparing Documentation',
      status: 'pending',
      description: 'Finalizing interactive API documentation'
    }
  ]);

  // Auto-start generation when component mounts
  useEffect(() => {
    if (!isGenerating && !result && !error) {
      generateApi().then(onComplete).catch(onError);
    }
  }, []);

  // Update steps based on current progress
  useEffect(() => {
    if (isGenerating && currentStep) {
      setGenerationSteps(prev => prev.map((step, index) => {
        const progressIndex = Math.floor((progress / 100) * prev.length);
        
        if (index < progressIndex) {
          return { ...step, status: 'completed' };
        } else if (index === progressIndex) {
          return { ...step, status: 'in-progress', description: currentStep };
        }
        return { ...step, status: 'pending' };
      }));
    }
  }, [isGenerating, currentStep, progress]);

  // Handle error state
  useEffect(() => {
    if (error) {
      setGenerationSteps(prev => prev.map((step, index) => {
        const progressIndex = Math.floor((progress / 100) * prev.length);
        
        if (index < progressIndex) {
          return { ...step, status: 'completed' };
        } else if (index === progressIndex) {
          return { ...step, status: 'error', error };
        }
        return { ...step, status: 'pending' };
      }));
    }
  }, [error, progress]);

  // Handle successful completion
  useEffect(() => {
    if (result?.success) {
      setGenerationSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
    }
  }, [result]);

  const handleRetry = () => {
    retry();
    onRetry?.();
    generateApi().then(onComplete).catch(onError);
  };

  const handleViewDocumentation = () => {
    if (result?.documentationUrl) {
      router.push(result.documentationUrl);
    }
  };

  const handleBackToWizard = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isGenerating && 'Generating Your API...'}
          {result?.success && 'API Generation Complete!'}
          {error && 'Generation Failed'}
        </h2>
        <p className="text-gray-600">
          {isGenerating && 'Please wait while we create your REST API endpoints'}
          {result?.success && 'Your API is ready and documentation is available'}
          {error && 'An error occurred during API generation'}
        </p>
      </div>

      {/* Progress Section */}
      {isGenerating && (
        <div className="space-y-4">
          <ProgressBar 
            progress={progress} 
            aria-label="API generation progress"
          />
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {Math.round(progress)}% Complete
            </p>
            {currentStep && (
              <p className="text-sm font-medium text-blue-600 mt-1">
                {currentStep}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success State */}
      {result?.success && (
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <Alert.Content>
            <Alert.Title>API Generation Successful!</Alert.Title>
            <Alert.Description>
              Successfully generated {result.endpointsGenerated} API endpoints for your database service.
              Your API is now ready for use and testing.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <ExclamationCircleIcon className="h-4 w-4" />
          <Alert.Content>
            <Alert.Title>Generation Failed</Alert.Title>
            <Alert.Description>
              {error}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {/* Step Progress Indicator */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generation Progress
        </h3>
        <StepIndicator steps={generationSteps} />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {isGenerating && (
          <Button variant="outline" disabled>
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </Button>
        )}

        {result?.success && (
          <>
            <Button
              onClick={handleViewDocumentation}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View API Documentation
            </Button>
            <Button variant="outline" onClick={handleBackToWizard}>
              Back to Wizard
            </Button>
          </>
        )}

        {error && (
          <>
            <Button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry Generation
            </Button>
            <Button variant="outline" onClick={handleBackToWizard}>
              Back to Configuration
            </Button>
          </>
        )}
      </div>

      {/* Additional Information */}
      {result?.success && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            What's Next?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Test your API endpoints in the interactive documentation</li>
            <li>• Configure additional security rules if needed</li>
            <li>• Generate API keys for client applications</li>
            <li>• Share documentation with your development team</li>
          </ul>
        </div>
      )}

      {/* Accessibility live region for screen readers */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isGenerating && `API generation in progress: ${Math.round(progress)}% complete. ${currentStep}`}
        {result?.success && 'API generation completed successfully'}
        {error && `API generation failed: ${error}`}
      </div>
    </div>
  );
};

export default GenerationProgress;