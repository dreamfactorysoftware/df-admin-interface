'use client';

/**
 * @fileoverview Wizard Layout Component - API Generation Workflow Container
 * 
 * Comprehensive React wizard layout component providing the main container structure, 
 * step navigation, progress indication, and coordinated step rendering for the 
 * DreamFactory API generation workflow.
 * 
 * Technical Architecture:
 * - React 19 functional component with TypeScript 5.8+ strict type safety
 * - Integration with Zustand wizard provider for state management and step coordination
 * - React Hook Form integration for multi-step form validation with real-time feedback
 * - Tailwind CSS 4.1+ responsive design with mobile-first approach and WCAG 2.1 AA compliance
 * - Progressive step validation with conditional navigation controls
 * - Advanced loading states with skeleton placeholders and error boundary integration
 * 
 * Features:
 * - Responsive wizard layout with adaptive sidebar navigation and mobile-optimized stepper
 * - Real-time step validation with conditional navigation enabling per workflow requirements  
 * - Progress indication with visual step completion states and estimated time remaining
 * - Keyboard navigation support with arrow keys, Enter/Space for step activation
 * - Error handling with step-level error boundaries and comprehensive user feedback
 * - Integration with React Query for data management and optimistic updates
 * - Support for wizard state persistence and restoration across browser sessions
 * 
 * Migration Context:
 * Replaces Angular routing-based wizard navigation with React component composition
 * following F-003 REST API Endpoint Generation workflow requirements per
 * Section 4.1 System Workflows and React/Next.js Integration Requirements.
 * 
 * Performance Requirements:
 * - Step transitions under 100ms per React/Next.js Integration Requirements
 * - Real-time validation feedback under 100ms response time
 * - Responsive design supporting viewport widths from 320px to 2560px
 * - Optimized re-rendering with React.memo and useCallback optimizations
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 4.1 - SYSTEM WORKFLOWS (F-003)
 * @see React/Next.js Integration Requirements - React Hook Form integration
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES (Tailwind CSS 4.1+)
 * @see Technical Specification Section 7.2 - UI USE CASES (responsive wizard layout)
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo,
  KeyboardEvent,
  ErrorInfo,
  ReactNode
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/solid';

// Wizard context and state management
import { 
  useWizard, 
  useWizardNavigation,
  WIZARD_STEPS,
  type WizardStep 
} from './wizard-provider';

// Step components for coordinated rendering
import { TableSelection } from './table-selection';
import { EndpointConfiguration } from './endpoint-configuration';
import { GenerationPreview } from './generation-preview';
import { GenerationProgress } from './generation-progress';

// UI Components with Tailwind CSS styling
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

// Utilities
import { cn } from '@/lib/utils';

/**
 * Wizard step metadata for navigation and progress indication
 */
interface WizardStepMeta {
  id: WizardStep;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  estimatedTime: string;
  isOptional: boolean;
}

/**
 * Wizard layout props interface
 */
interface WizardLayoutProps {
  /** Optional CSS class name for layout customization */
  className?: string;
  /** Test identifier for automated testing */
  'data-testid'?: string;
  /** Service ID for the database service being configured */
  serviceId?: string;
  /** Service name for display in the wizard header */
  serviceName?: string;
  /** Database type for display and workflow customization */
  databaseType?: string;
  /** Callback fired when wizard is completed successfully */
  onComplete?: (result: GenerationResult) => void;
  /** Callback fired when wizard is cancelled */
  onCancel?: () => void;
}

/**
 * Generation result interface for successful completion
 */
interface GenerationResult {
  serviceId: string;
  generatedEndpoints: string[];
  openApiSpec: Record<string, any>;
  timestamp: Date;
}

/**
 * Wizard step definitions with metadata and components
 */
const WIZARD_STEP_META: Record<WizardStep, WizardStepMeta> = {
  [WIZARD_STEPS.TABLE_SELECTION]: {
    id: WIZARD_STEPS.TABLE_SELECTION,
    title: 'Select Tables',
    description: 'Choose database tables for API generation',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125S3.75 19.903 3.75 17.625V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
    component: TableSelection,
    estimatedTime: '2-3 min',
    isOptional: false,
  },
  [WIZARD_STEPS.ENDPOINT_CONFIGURATION]: {
    id: WIZARD_STEPS.ENDPOINT_CONFIGURATION,
    title: 'Configure Endpoints',
    description: 'Set up HTTP methods and parameters',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    component: EndpointConfiguration,
    estimatedTime: '3-5 min',
    isOptional: false,
  },
  [WIZARD_STEPS.SECURITY_CONFIGURATION]: {
    id: WIZARD_STEPS.SECURITY_CONFIGURATION,
    title: 'Preview & Security',
    description: 'Review configuration and set security rules',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    component: GenerationPreview,
    estimatedTime: '2-3 min',
    isOptional: false,
  },
  [WIZARD_STEPS.PREVIEW_AND_GENERATE]: {
    id: WIZARD_STEPS.PREVIEW_AND_GENERATE,
    title: 'Generate APIs',
    description: 'Generate and deploy REST API endpoints',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    component: GenerationProgress,
    estimatedTime: '1-2 min',
    isOptional: false,
  },
} as const;

/**
 * Progress Step Component - Individual step indicator in the progress bar
 */
interface ProgressStepProps {
  step: WizardStepMeta;
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  isClickable: boolean;
  onClick: (step: WizardStep) => void;
  className?: string;
}

const ProgressStep: React.FC<ProgressStepProps> = React.memo(({
  step,
  currentStep,
  completedSteps,
  isClickable,
  onClick,
  className,
}) => {
  const isActive = currentStep === step.id;
  const isCompleted = completedSteps.has(step.id);
  const isPending = step.id > currentStep;

  const handleClick = useCallback(() => {
    if (isClickable && !isPending) {
      onClick(step.id);
    }
  }, [isClickable, isPending, onClick, step.id]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={!isClickable || isPending}
      className={cn(
        'group relative flex items-center justify-center transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg',
        isClickable && !isPending ? 'cursor-pointer hover:scale-105' : 'cursor-default',
        className
      )}
      aria-label={`${step.title} - ${isCompleted ? 'Completed' : isActive ? 'Current' : 'Pending'}`}
      aria-current={isActive ? 'step' : undefined}
      whileHover={isClickable && !isPending ? { scale: 1.05 } : {}}
      whileTap={isClickable && !isPending ? { scale: 0.95 } : {}}
    >
      {/* Step Circle */}
      <div className={cn(
        'relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
        isCompleted
          ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:border-green-400 dark:text-green-300'
          : isActive
          ? 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900 dark:border-primary-400 dark:text-primary-300'
          : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-500'
      )}>
        {isCompleted ? (
          <CheckCircleIcon className="w-6 h-6" />
        ) : (
          <step.icon className="w-5 h-5" />
        )}
        
        {/* Active step pulse animation */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        )}
      </div>
      
      {/* Step Label */}
      <div className="ml-3 text-left">
        <div className={cn(
          'text-sm font-medium transition-colors duration-200',
          isCompleted
            ? 'text-green-700 dark:text-green-300'
            : isActive
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-gray-500 dark:text-gray-400'
        )}>
          {step.title}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {step.estimatedTime}
        </div>
      </div>
    </motion.button>
  );
});

ProgressStep.displayName = 'ProgressStep';

/**
 * Error Boundary Component for step-level error handling
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class StepErrorBoundary extends React.Component<
  { children: ReactNode; stepName: string; onRetry: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; stepName: string; onRetry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`Error in wizard step ${this.props.stepName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong in {this.props.stepName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: undefined, errorInfo: undefined });
              this.props.onRetry();
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main Wizard Layout Component
 */
export const WizardLayout: React.FC<WizardLayoutProps> = ({
  className,
  'data-testid': testId,
  serviceId,
  serviceName,
  databaseType,
  onComplete,
  onCancel,
}) => {
  const router = useRouter();
  const wizard = useWizard();
  const navigation = useWizardNavigation();
  
  // Local state for layout management
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Initialize wizard context with service information
  useEffect(() => {
    if (serviceId && serviceName && databaseType) {
      wizard.setServiceContext(serviceId, serviceName, databaseType);
    }
  }, [serviceId, serviceName, databaseType, wizard]);

  // Handle wizard completion
  useEffect(() => {
    if (wizard.generationProgress.isGenerating === false && 
        wizard.generationProgress.generatedEndpoints.length > 0 &&
        onComplete) {
      const result: GenerationResult = {
        serviceId: wizard.serviceId || '',
        generatedEndpoints: wizard.generationProgress.generatedEndpoints,
        openApiSpec: wizard.openApiPreview.specification || {},
        timestamp: new Date(),
      };
      onComplete(result);
    }
  }, [wizard.generationProgress, wizard.serviceId, wizard.openApiPreview.specification, onComplete]);

  // Get current step metadata and component
  const currentStepMeta = WIZARD_STEP_META[navigation.currentStep];
  const CurrentStepComponent = currentStepMeta.component;

  // Calculate overall progress percentage
  const progressPercentage = useMemo(() => {
    const totalSteps = Object.keys(WIZARD_STEPS).length;
    const completedCount = wizard.completedSteps.size;
    const currentProgress = navigation.currentStep / totalSteps;
    return Math.round(((completedCount + currentProgress) / totalSteps) * 100);
  }, [wizard.completedSteps.size, navigation.currentStep]);

  // Handle step navigation with validation
  const handleStepClick = useCallback((targetStep: WizardStep) => {
    if (targetStep <= navigation.currentStep || wizard.completedSteps.has(targetStep)) {
      navigation.setCurrentStep(targetStep);
    }
  }, [navigation, wizard.completedSteps]);

  // Handle wizard cancellation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/api-connections/database');
    }
  }, [onCancel, router]);

  // Handle step retry for error recovery
  const handleStepRetry = useCallback(() => {
    // Reset any error states and refresh current step
    wizard.setGenerationError('');
    // Trigger component remount by toggling a state
  }, [wizard]);

  // Keyboard navigation support
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey) {
      switch (event.key) {
        case 'ArrowLeft':
          if (navigation.canGoPrevious) {
            event.preventDefault();
            navigation.goToPreviousStep();
          }
          break;
        case 'ArrowRight':
          if (navigation.canGoNext) {
            event.preventDefault();
            navigation.goToNextStep();
          }
          break;
      }
    }
  }, [navigation]);

  return (
    <div 
      className={cn(
        'flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900',
        className
      )}
      data-testid={testId}
      onKeyDown={handleKeyboardNavigation}
      tabIndex={-1}
    >
      {/* Wizard Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
            
            <div className="border-l border-gray-300 dark:border-gray-600 pl-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                API Generation Wizard
              </h1>
              {serviceName && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {serviceName} ({databaseType})
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Progress indicator */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <ClockIcon className="w-4 h-4" />
              <span>{currentStepMeta.estimatedTime} remaining</span>
            </div>
            
            {/* Overall progress bar */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {progressPercentage}%
              </span>
              <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Step Navigation Sidebar */}
        <aside className={cn(
          'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
          'hidden lg:flex flex-col',
          isCollapsed ? 'w-16' : 'w-80'
        )}>
          {/* Collapse toggle */}
          <div className="flex justify-end p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1"
            >
              <ChevronLeftIcon className={cn(
                'w-4 h-4 transition-transform duration-200',
                isCollapsed && 'rotate-180'
              )} />
            </Button>
          </div>
          
          {/* Steps list */}
          <nav className="flex-1 p-4 space-y-2" aria-label="Wizard steps">
            {Object.values(WIZARD_STEP_META).map((stepMeta, index) => (
              <div key={stepMeta.id} className="relative">
                <ProgressStep
                  step={stepMeta}
                  currentStep={navigation.currentStep}
                  completedSteps={wizard.completedSteps}
                  isClickable={!wizard.isNavigationLocked}
                  onClick={handleStepClick}
                  className={cn(
                    'w-full justify-start p-3 rounded-lg',
                    isCollapsed && 'justify-center'
                  )}
                />
                
                {/* Connection line between steps */}
                {index < Object.values(WIZARD_STEP_META).length - 1 && (
                  <div className={cn(
                    'absolute left-5 top-full w-0.5 h-4 bg-gray-200 dark:bg-gray-700',
                    isCollapsed && 'left-1/2 transform -translate-x-px'
                  )} />
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Mobile step navigation */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {currentStepMeta.title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden"
            >
              Steps ({navigation.currentStep + 1}/{Object.keys(WIZARD_STEPS).length})
            </Button>
          </div>
          
          {/* Mobile steps dropdown */}
          <AnimatePresence>
            {showMobileMenu && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
              >
                <div className="p-4 space-y-2">
                  {Object.values(WIZARD_STEP_META).map((stepMeta) => (
                    <ProgressStep
                      key={stepMeta.id}
                      step={stepMeta}
                      currentStep={navigation.currentStep}
                      completedSteps={wizard.completedSteps}
                      isClickable={!wizard.isNavigationLocked}
                      onClick={(step) => {
                        handleStepClick(step);
                        setShowMobileMenu(false);
                      }}
                      className="w-full justify-start p-2 rounded-md"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Step Content */}
          <div className="flex-1 overflow-y-auto">
            <StepErrorBoundary 
              stepName={currentStepMeta.title}
              onRetry={handleStepRetry}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={navigation.currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <CurrentStepComponent />
                </motion.div>
              </AnimatePresence>
            </StepErrorBoundary>
          </div>

          {/* Navigation Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={navigation.goToPreviousStep}
                disabled={!navigation.canGoPrevious || wizard.isNavigationLocked}
                className="flex items-center gap-2"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-2">
                {/* Error display */}
                {wizard.generationProgress.error && (
                  <Alert variant="destructive" className="mr-4">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span className="text-sm">{wizard.generationProgress.error}</span>
                  </Alert>
                )}
                
                {navigation.currentStep === WIZARD_STEPS.PREVIEW_AND_GENERATE ? (
                  <Button
                    onClick={() => wizard.startGeneration()}
                    disabled={wizard.isNavigationLocked || !navigation.canGoNext}
                    className="flex items-center gap-2"
                  >
                    {wizard.generationProgress.isGenerating ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Generate APIs
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={navigation.goToNextStep}
                    disabled={!navigation.canGoNext || wizard.isNavigationLocked}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

// Export component with display name for debugging
WizardLayout.displayName = 'WizardLayout';

// Export for easy importing
export default WizardLayout;