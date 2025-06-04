'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Progress mode types for different operation scenarios
 */
export type ProgressMode = 'determinate' | 'indeterminate';

/**
 * Step status for multi-step workflows
 */
export type StepStatus = 'pending' | 'running' | 'completed' | 'error' | 'warning';

/**
 * Progress variant for different visual styles
 */
export type ProgressVariant = 'default' | 'compact' | 'detailed';

/**
 * Individual step in a multi-step workflow
 */
export interface ProgressStep {
  /** Unique identifier for the step */
  id: string;
  /** Display label for the step */
  label: string;
  /** Optional description for additional context */
  description?: string;
  /** Current status of the step */
  status: StepStatus;
  /** Progress percentage for this step (0-100) */
  progress?: number;
  /** Estimated duration in milliseconds */
  estimatedDuration?: number;
  /** Actual start time */
  startTime?: Date;
  /** Completion time */
  completionTime?: Date;
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Warning message if status is 'warning' */
  warningMessage?: string;
}

/**
 * Animation configuration for progress transitions
 */
export interface ProgressAnimation {
  /** Enable smooth transitions */
  enabled: boolean;
  /** Transition duration in milliseconds */
  duration: number;
  /** Easing function */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Enable completion celebration */
  celebrateCompletion: boolean;
}

/**
 * Props for the ProgressIndicator component
 */
export interface ProgressIndicatorProps {
  /** Array of steps for multi-step workflows */
  steps: ProgressStep[];
  /** Current overall progress (0-100) */
  progress: number;
  /** Progress mode */
  mode: ProgressMode;
  /** Visual variant */
  variant?: ProgressVariant;
  /** Show step labels */
  showLabels?: boolean;
  /** Show progress percentage */
  showPercentage?: boolean;
  /** Show estimated time remaining */
  showTimeRemaining?: boolean;
  /** Animation configuration */
  animation?: Partial<ProgressAnimation>;
  /** Loading state for indeterminate operations */
  isLoading?: boolean;
  /** Error state */
  hasError?: boolean;
  /** Overall error message */
  errorMessage?: string;
  /** Success state */
  isComplete?: boolean;
  /** Completion message */
  completionMessage?: string;
  /** Callback when a step is clicked */
  onStepClick?: (step: ProgressStep) => void;
  /** Callback when process is cancelled */
  onCancel?: () => void;
  /** Callback when process is retried */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for screen readers */
  ariaLabel?: string;
  /** ARIA describedby for additional context */
  ariaDescribedBy?: string;
  /** Enable keyboard navigation */
  enableKeyboardNavigation?: boolean;
  /** Auto-announce progress updates */
  announceUpdates?: boolean;
}

/**
 * Default animation configuration
 */
const defaultAnimation: ProgressAnimation = {
  enabled: true,
  duration: 300,
  easing: 'ease-out',
  celebrateCompletion: true,
};

/**
 * ProgressIndicator Component
 * 
 * A comprehensive progress indicator component for multi-step workflows like database
 * service creation, API generation, and schema discovery. Provides visual feedback
 * for operations with known duration and step progression.
 * 
 * Features:
 * - Multi-step workflow support with visual step indicators
 * - Determinate and indeterminate progress modes
 * - Real-time progress tracking with React Query integration
 * - WCAG 2.1 AA accessibility compliance
 * - Customizable animations and completion celebrations
 * - Error handling and retry mechanisms
 * - Keyboard navigation support
 * - Screen reader announcements
 */
export function ProgressIndicator({
  steps,
  progress,
  mode,
  variant = 'default',
  showLabels = true,
  showPercentage = true,
  showTimeRemaining = false,
  animation = {},
  isLoading = false,
  hasError = false,
  errorMessage,
  isComplete = false,
  completionMessage,
  onStepClick,
  onCancel,
  onRetry,
  className,
  ariaLabel = 'Progress indicator',
  ariaDescribedBy,
  enableKeyboardNavigation = true,
  announceUpdates = true,
  ...props
}: ProgressIndicatorProps) {
  const [focusedStepIndex, setFocusedStepIndex] = useState<number>(-1);
  const [lastAnnouncedProgress, setLastAnnouncedProgress] = useState<number>(0);
  const [celebrating, setCelebrating] = useState<boolean>(false);

  // Merge animation configuration with defaults
  const animationConfig = { ...defaultAnimation, ...animation };

  // Calculate overall status based on steps
  const overallStatus = React.useMemo(() => {
    if (hasError) return 'error';
    if (isComplete) return 'completed';
    if (isLoading && mode === 'indeterminate') return 'running';
    
    const hasErrorStep = steps.some(step => step.status === 'error');
    const hasRunningStep = steps.some(step => step.status === 'running');
    const allCompleted = steps.length > 0 && steps.every(step => step.status === 'completed');
    
    if (hasErrorStep) return 'error';
    if (hasRunningStep) return 'running';
    if (allCompleted) return 'completed';
    return 'pending';
  }, [steps, hasError, isComplete, isLoading, mode]);

  // Calculate estimated time remaining
  const estimatedTimeRemaining = React.useMemo(() => {
    if (!showTimeRemaining || mode === 'indeterminate') return null;
    
    const runningStep = steps.find(step => step.status === 'running');
    if (!runningStep?.estimatedDuration) return null;
    
    const elapsed = runningStep.startTime 
      ? Date.now() - runningStep.startTime.getTime()
      : 0;
    
    const remaining = Math.max(0, runningStep.estimatedDuration - elapsed);
    return Math.ceil(remaining / 1000); // Convert to seconds
  }, [steps, showTimeRemaining, mode]);

  // Announce progress updates to screen readers
  const announceProgress = useCallback((currentProgress: number, stepName?: string) => {
    if (!announceUpdates) return;
    
    // Only announce significant progress changes (every 10%) or step changes
    const progressDiff = Math.abs(currentProgress - lastAnnouncedProgress);
    if (progressDiff < 10 && !stepName) return;
    
    const announcement = stepName 
      ? `Step ${stepName} completed. Overall progress: ${currentProgress}%`
      : `Progress: ${currentProgress}%`;
    
    // Create live region for screen reader announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.textContent = announcement;
    
    document.body.appendChild(liveRegion);
    setTimeout(() => {
      if (document.body.contains(liveRegion)) {
        document.body.removeChild(liveRegion);
      }
    }, 1000);
    
    setLastAnnouncedProgress(currentProgress);
  }, [announceUpdates, lastAnnouncedProgress]);

  // Handle completion celebration
  useEffect(() => {
    if (isComplete && animationConfig.celebrateCompletion && !celebrating) {
      setCelebrating(true);
      announceProgress(100, 'All steps completed');
      
      // Reset celebration state after animation
      const timeout = setTimeout(() => {
        setCelebrating(false);
      }, animationConfig.duration * 2);
      
      return () => clearTimeout(timeout);
    }
  }, [isComplete, animationConfig, celebrating, announceProgress]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        setFocusedStepIndex(prev => 
          prev < steps.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        setFocusedStepIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedStepIndex >= 0 && onStepClick) {
          onStepClick(steps[focusedStepIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setFocusedStepIndex(-1);
        break;
    }
  }, [enableKeyboardNavigation, focusedStepIndex, onStepClick, steps]);

  // Base container styles
  const containerStyles = cn(
    'w-full space-y-4',
    'focus-within:outline-none',
    className
  );

  // Progress bar styles
  const progressBarStyles = cn(
    'relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
    'transition-all duration-300 ease-out',
    animationConfig.enabled && 'animate-pulse',
    hasError && 'bg-red-100 dark:bg-red-900',
    isComplete && celebrating && 'animate-pulse'
  );

  // Progress fill styles
  const progressFillStyles = cn(
    'h-full transition-all ease-out rounded-full',
    `duration-[${animationConfig.duration}ms]`,
    overallStatus === 'running' && 'bg-primary-500',
    overallStatus === 'completed' && 'bg-success-500',
    overallStatus === 'error' && 'bg-error-500',
    overallStatus === 'pending' && 'bg-gray-400',
    celebrating && 'animate-pulse'
  );

  // Step status icon mapping
  const getStatusIcon = (status: StepStatus) => {
    const iconProps = { 
      className: 'w-4 h-4',
      'aria-hidden': true 
    };
    
    switch (status) {
      case 'completed':
        return <CheckCircle {...iconProps} className={cn(iconProps.className, 'text-success-500')} />;
      case 'error':
        return <XCircle {...iconProps} className={cn(iconProps.className, 'text-error-500')} />;
      case 'warning':
        return <AlertCircle {...iconProps} className={cn(iconProps.className, 'text-warning-500')} />;
      case 'running':
        return <Loader2 {...iconProps} className={cn(iconProps.className, 'text-primary-500 animate-spin')} />;
      case 'pending':
      default:
        return <Clock {...iconProps} className={cn(iconProps.className, 'text-gray-400')} />;
    }
  };

  // Render step indicators
  const renderSteps = () => {
    if (variant === 'compact') {
      return (
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center space-x-2 cursor-pointer',
                focusedStepIndex === index && 'ring-2 ring-primary-500 ring-offset-2 rounded-md p-1',
                onStepClick && 'hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-1'
              )}
              onClick={() => onStepClick?.(step)}
              onKeyDown={handleKeyDown}
              tabIndex={enableKeyboardNavigation ? 0 : -1}
              role="button"
              aria-label={`Step ${index + 1}: ${step.label}. Status: ${step.status}`}
            >
              {getStatusIcon(step.status)}
              {showLabels && (
                <span className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' && 'text-success-600',
                  step.status === 'error' && 'text-error-600',
                  step.status === 'warning' && 'text-warning-600',
                  step.status === 'running' && 'text-primary-600',
                  step.status === 'pending' && 'text-gray-500'
                )}>
                  {step.label}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start space-x-3 p-3 rounded-lg transition-all duration-200',
              'border border-gray-200 dark:border-gray-700',
              focusedStepIndex === index && 'ring-2 ring-primary-500 ring-offset-2',
              onStepClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
              step.status === 'completed' && 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800',
              step.status === 'error' && 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800',
              step.status === 'warning' && 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
              step.status === 'running' && 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
            )}
            onClick={() => onStepClick?.(step)}
            onKeyDown={handleKeyDown}
            tabIndex={enableKeyboardNavigation ? 0 : -1}
            role="button"
            aria-label={`Step ${index + 1}: ${step.label}. Status: ${step.status}. ${step.description || ''}`}
            aria-describedby={step.errorMessage || step.warningMessage ? `step-${step.id}-message` : undefined}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(step.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={cn(
                  'text-sm font-medium',
                  step.status === 'completed' && 'text-success-800 dark:text-success-200',
                  step.status === 'error' && 'text-error-800 dark:text-error-200',
                  step.status === 'warning' && 'text-warning-800 dark:text-warning-200',
                  step.status === 'running' && 'text-primary-800 dark:text-primary-200',
                  step.status === 'pending' && 'text-gray-700 dark:text-gray-300'
                )}>
                  {step.label}
                </h4>
                
                {step.progress !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {step.progress}%
                  </span>
                )}
              </div>
              
              {step.description && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              )}
              
              {(step.errorMessage || step.warningMessage) && (
                <p
                  id={`step-${step.id}-message`}
                  className={cn(
                    'mt-1 text-xs',
                    step.errorMessage && 'text-error-600 dark:text-error-400',
                    step.warningMessage && 'text-warning-600 dark:text-warning-400'
                  )}
                >
                  {step.errorMessage || step.warningMessage}
                </p>
              )}
              
              {step.status === 'running' && step.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={containerStyles}
      role="progressbar"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-valuenow={mode === 'determinate' ? progress : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={mode === 'determinate' ? `${progress}% complete` : 'Loading...'}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* Main progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoading && mode === 'indeterminate' && (
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" aria-hidden="true" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isComplete 
                ? completionMessage || 'Complete'
                : hasError 
                ? 'Error'
                : `Step ${steps.findIndex(s => s.status === 'running') + 1} of ${steps.length}`
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {showPercentage && mode === 'determinate' && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {progress}%
              </span>
            )}
            
            {estimatedTimeRemaining && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ~{estimatedTimeRemaining}s remaining
              </span>
            )}
          </div>
        </div>
        
        <div className={progressBarStyles}>
          {mode === 'determinate' ? (
            <div
              className={progressFillStyles}
              style={{ width: `${progress}%` }}
            />
          ) : (
            <div className={cn(
              progressFillStyles,
              'w-1/3 animate-pulse'
            )}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          )}
        </div>
      </div>

      {/* Step indicators */}
      {steps.length > 0 && (
        <div className="mt-4">
          {renderSteps()}
        </div>
      )}

      {/* Error message */}
      {hasError && errorMessage && (
        <div className="mt-3 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md">
          <div className="flex items-start space-x-2">
            <XCircle className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-error-800 dark:text-error-200">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(onCancel || onRetry) && (
        <div className="mt-4 flex items-center justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300',
                'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
                'rounded-md hover:bg-gray-50 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'transition-colors duration-200'
              )}
              aria-label="Cancel operation"
            >
              Cancel
            </button>
          )}
          
          {onRetry && hasError && (
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                'px-3 py-1.5 text-sm font-medium text-white',
                'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
                'border border-primary-600 hover:border-primary-700',
                'rounded-md transition-colors duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              )}
              aria-label="Retry operation"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ProgressIndicator;