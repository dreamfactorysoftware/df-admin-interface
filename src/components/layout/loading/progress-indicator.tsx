'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Progress step definition for multi-step workflows
 */
export interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  duration?: number; // Expected duration in milliseconds
}

/**
 * Progress state for individual steps
 */
export type ProgressStepStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped';

/**
 * Progress mode types
 */
export type ProgressMode = 'determinate' | 'indeterminate';

/**
 * Progress indicator component props
 */
export interface ProgressIndicatorProps {
  /** List of steps in the workflow */
  steps: ProgressStep[];
  /** Current active step index */
  currentStep: number;
  /** Progress mode - determinate shows percentage, indeterminate shows spinner */
  mode?: ProgressMode;
  /** Progress percentage (0-100) for determinate mode */
  progress?: number;
  /** Status for each step */
  stepStatuses?: Record<string, ProgressStepStatus>;
  /** Whether to show step descriptions */
  showDescriptions?: boolean;
  /** Whether to show step icons */
  showIcons?: boolean;
  /** Whether to show progress percentage */
  showPercentage?: boolean;
  /** Whether to show estimated time remaining */
  showTimeRemaining?: boolean;
  /** Custom class name */
  className?: string;
  /** Callback when step is clicked (for navigation) */
  onStepClick?: (stepIndex: number, step: ProgressStep) => void;
  /** Whether steps are clickable for navigation */
  allowNavigation?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether to animate progress changes */
  animated?: boolean;
  /** Custom colors for different states */
  colors?: {
    pending?: string;
    active?: string;
    completed?: string;
    error?: string;
  };
  /** Accessibility label for the progress indicator */
  'aria-label'?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Individual step indicator component
 */
interface StepIndicatorProps {
  step: ProgressStep;
  index: number;
  status: ProgressStepStatus;
  isLast: boolean;
  onClick?: () => void;
  showDescription: boolean;
  showIcon: boolean;
  size: 'sm' | 'md' | 'lg';
  orientation: 'horizontal' | 'vertical';
  allowNavigation: boolean;
  colors: Required<ProgressIndicatorProps['colors']>;
  animated: boolean;
}

/**
 * Step indicator component for individual workflow steps
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  index,
  status,
  isLast,
  onClick,
  showDescription,
  showIcon,
  size,
  orientation,
  allowNavigation,
  colors,
  animated,
}) => {
  const sizeClasses = {
    sm: {
      circle: 'h-6 w-6',
      icon: 'h-3 w-3',
      title: 'text-xs font-medium',
      description: 'text-xs',
      connector: 'h-0.5',
    },
    md: {
      circle: 'h-8 w-8',
      icon: 'h-4 w-4',
      title: 'text-sm font-medium',
      description: 'text-sm',
      connector: 'h-0.5',
    },
    lg: {
      circle: 'h-10 w-10',
      icon: 'h-5 w-5',
      title: 'text-base font-medium',
      description: 'text-base',
      connector: 'h-0.5',
    },
  };

  const statusConfig = {
    pending: {
      circle: `bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 ${colors.pending}`,
      icon: null,
      text: 'text-gray-500 dark:text-gray-400',
    },
    active: {
      circle: `bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-600 ${colors.active}`,
      icon: status === 'active' ? Loader2 : PlayCircle,
      text: 'text-primary-700 dark:text-primary-300',
    },
    completed: {
      circle: `bg-green-100 dark:bg-green-900/30 border-2 border-green-600 ${colors.completed}`,
      icon: CheckCircle,
      text: 'text-green-700 dark:text-green-300',
    },
    error: {
      circle: `bg-red-100 dark:bg-red-900/30 border-2 border-red-600 ${colors.error}`,
      icon: AlertCircle,
      text: 'text-red-700 dark:text-red-300',
    },
    skipped: {
      circle: 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-400 dark:border-gray-500',
      icon: null,
      text: 'text-gray-400 dark:text-gray-500',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = showIcon && (step.icon || config.icon);
  const isClickable = allowNavigation && onClick && (status === 'completed' || status === 'active');

  const stepContent = (
    <div
      className={cn(
        'flex items-center',
        orientation === 'horizontal' ? 'flex-col' : 'flex-row',
        isClickable && 'cursor-pointer hover:opacity-80',
        'transition-all duration-200',
        animated && 'transform hover:scale-105'
      )}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? 'button' : 'listitem'}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={`Step ${index + 1}: ${step.title}${
        step.description ? ` - ${step.description}` : ''
      }. Status: ${status}`}
      data-testid={`step-indicator-${step.id}`}
    >
      {/* Step Circle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300',
          sizeClasses[size].circle,
          config.circle,
          animated && status === 'active' && 'animate-pulse'
        )}
        aria-hidden="true"
      >
        {StatusIcon && (
          <StatusIcon
            className={cn(
              sizeClasses[size].icon,
              config.text,
              status === 'active' && animated && 'animate-spin'
            )}
          />
        )}
        {!StatusIcon && (
          <span className={cn('font-semibold', config.text, sizeClasses[size].icon)}>
            {index + 1}
          </span>
        )}
      </div>

      {/* Step Text */}
      <div
        className={cn(
          'text-center',
          orientation === 'horizontal' ? 'mt-2' : 'ml-3 text-left',
          config.text
        )}
      >
        <div className={sizeClasses[size].title}>{step.title}</div>
        {showDescription && step.description && (
          <div className={cn(sizeClasses[size].description, 'opacity-75 mt-1')}>
            {step.description}
          </div>
        )}
      </div>
    </div>
  );

  if (orientation === 'horizontal') {
    return (
      <div className="flex flex-col items-center relative">
        {stepContent}
        {/* Connector Line */}
        {!isLast && (
          <div
            className={cn(
              'absolute top-1/2 left-full transform -translate-y-1/2',
              'ml-2 w-8 bg-gray-300 dark:bg-gray-600',
              sizeClasses[size].connector,
              status === 'completed' && 'bg-green-500',
              animated && 'transition-colors duration-300'
            )}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start relative">
      {stepContent}
      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-4 top-8 w-0.5 h-8 bg-gray-300 dark:bg-gray-600',
            status === 'completed' && 'bg-green-500',
            animated && 'transition-colors duration-300'
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

/**
 * Progress bar component for determinate progress
 */
interface ProgressBarProps {
  progress: number;
  animated: boolean;
  showPercentage: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  animated,
  showPercentage,
  className,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
        {showPercentage && (
          <span className="text-sm text-gray-600 dark:text-gray-400">{clampedProgress}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full bg-gradient-to-r from-primary-500 to-primary-600',
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${clampedProgress}%`}
        />
      </div>
    </div>
  );
};

/**
 * Progress Indicator Component
 * 
 * A comprehensive progress indicator for multi-step workflows like database service creation,
 * API generation, and schema discovery. Supports both determinate and indeterminate progress
 * modes with step-by-step visual feedback.
 * 
 * Features:
 * - Multi-step workflow visualization
 * - Determinate and indeterminate progress modes
 * - Step navigation and status tracking
 * - Customizable appearance and animations
 * - Full accessibility support
 * - Integration with React Query mutations
 * 
 * @param props - Progress indicator configuration
 * @returns JSX.Element
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  mode = 'determinate',
  progress = 0,
  stepStatuses = {},
  showDescriptions = true,
  showIcons = true,
  showPercentage = true,
  showTimeRemaining = false,
  className,
  onStepClick,
  allowNavigation = false,
  size = 'md',
  orientation = 'horizontal',
  animated = true,
  colors = {},
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}) => {
  const [startTime] = useState(Date.now());
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Default color configuration
  const defaultColors = {
    pending: '',
    active: '',
    completed: '',
    error: '',
    ...colors,
  };

  // Calculate step statuses based on current step and provided statuses
  const calculatedStatuses = useMemo(() => {
    const statuses: Record<string, ProgressStepStatus> = {};
    
    steps.forEach((step, index) => {
      if (stepStatuses[step.id]) {
        statuses[step.id] = stepStatuses[step.id];
      } else if (index < currentStep) {
        statuses[step.id] = 'completed';
      } else if (index === currentStep) {
        statuses[step.id] = 'active';
      } else {
        statuses[step.id] = 'pending';
      }
    });
    
    return statuses;
  }, [steps, currentStep, stepStatuses]);

  // Calculate estimated time remaining based on progress and elapsed time
  useEffect(() => {
    if (showTimeRemaining && mode === 'determinate' && progress > 0) {
      const elapsed = Date.now() - startTime;
      const estimated = (elapsed / progress) * (100 - progress);
      setEstimatedTimeRemaining(estimated);
    }
  }, [progress, showTimeRemaining, mode, startTime]);

  // Handle step click for navigation
  const handleStepClick = useCallback(
    (stepIndex: number, step: ProgressStep) => {
      if (allowNavigation && onStepClick) {
        onStepClick(stepIndex, step);
      }
    },
    [allowNavigation, onStepClick]
  );

  // Calculate overall progress based on completed steps
  const overallProgress = useMemo(() => {
    if (mode === 'indeterminate') return 0;
    if (progress !== undefined) return progress;
    
    const completedSteps = steps.filter((step) => calculatedStatuses[step.id] === 'completed').length;
    return (completedSteps / steps.length) * 100;
  }, [mode, progress, steps, calculatedStatuses]);

  // Format time remaining for display
  const formatTimeRemaining = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div
      className={cn(
        'w-full space-y-6',
        className
      )}
      role="progressbar"
      aria-label={ariaLabel || `Progress indicator with ${steps.length} steps`}
      aria-valuenow={mode === 'determinate' ? overallProgress : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid={dataTestId || 'progress-indicator'}
    >
      {/* Progress Bar (for determinate mode) */}
      {mode === 'determinate' && (
        <ProgressBar
          progress={overallProgress}
          animated={animated}
          showPercentage={showPercentage}
          className="mb-4"
        />
      )}

      {/* Time Remaining Display */}
      {showTimeRemaining && estimatedTimeRemaining && mode === 'determinate' && (
        <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Clock className="h-4 w-4 mr-2" />
          <span>Estimated time remaining: {formatTimeRemaining(estimatedTimeRemaining)}</span>
        </div>
      )}

      {/* Steps Display */}
      <div
        className={cn(
          'flex',
          orientation === 'horizontal' 
            ? 'flex-row justify-between items-start space-x-4' 
            : 'flex-col space-y-4'
        )}
        role="list"
        aria-label="Workflow steps"
      >
        {steps.map((step, index) => (
          <StepIndicator
            key={step.id}
            step={step}
            index={index}
            status={calculatedStatuses[step.id]}
            isLast={index === steps.length - 1}
            onClick={() => handleStepClick(index, step)}
            showDescription={showDescriptions}
            showIcon={showIcons}
            size={size}
            orientation={orientation}
            allowNavigation={allowNavigation}
            colors={defaultColors}
            animated={animated}
          />
        ))}
      </div>

      {/* Current Step Information */}
      {currentStep < steps.length && (
        <div className="text-center mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            Current Step: {steps[currentStep]?.title}
          </div>
          {steps[currentStep]?.description && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {steps[currentStep].description}
            </div>
          )}
          {mode === 'indeterminate' && (
            <div className="flex items-center justify-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary-600" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Processing...</span>
            </div>
          )}
        </div>
      )}

      {/* Screen Reader Status Updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {mode === 'determinate' && showPercentage && (
          `Progress: ${Math.round(overallProgress)}% complete. `
        )}
        {currentStep < steps.length && (
          `Currently on step ${currentStep + 1} of ${steps.length}: ${steps[currentStep]?.title}. `
        )}
        {calculatedStatuses[steps[currentStep]?.id] === 'error' && (
          'Error encountered in current step. '
        )}
        {currentStep >= steps.length && 'All steps completed successfully.'}
      </div>
    </div>
  );
};

export default ProgressIndicator;