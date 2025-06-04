'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

// Error types for comprehensive error classification
interface SchedulerError extends Error {
  code?: string
  context?: {
    operation?: 'create' | 'update' | 'delete' | 'fetch' | 'execute'
    taskId?: string
    taskName?: string
    payload?: unknown
  }
  statusCode?: number
  originalError?: Error
}

interface ErrorPageProps {
  error: SchedulerError
  reset: () => void
}

// Error classification constants
const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  SCHEDULER_TASK_ERROR: 'SCHEDULER_TASK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

// Scheduler-specific error messages
const SCHEDULER_ERROR_MESSAGES = {
  TASK_CREATE_FAILED: 'Failed to create scheduled task. Please check the task configuration and try again.',
  TASK_UPDATE_FAILED: 'Failed to update scheduled task. The task may have been modified by another user.',
  TASK_DELETE_FAILED: 'Failed to delete scheduled task. The task may still be running or has dependencies.',
  TASK_EXECUTION_FAILED: 'Scheduled task execution failed. Check the task parameters and target system availability.',
  TASK_NOT_FOUND: 'The requested scheduled task was not found. It may have been deleted by another user.',
  SCHEDULER_SERVICE_UNAVAILABLE: 'The scheduler service is temporarily unavailable. Please try again in a few moments.',
  INSUFFICIENT_PERMISSIONS: 'You do not have sufficient permissions to perform this scheduler operation.',
  TASK_VALIDATION_ERROR: 'Task configuration is invalid. Please review all required fields and try again.',
  CONCURRENT_MODIFICATION: 'This task has been modified by another user. Please refresh the page and try again.',
  SCHEDULER_QUOTA_EXCEEDED: 'Maximum number of scheduled tasks reached. Please delete unused tasks before creating new ones.'
} as const

/**
 * Classifies error based on error properties and context
 */
function classifyError(error: SchedulerError): string {
  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return ERROR_TYPES.NETWORK_ERROR
  }

  // HTTP status code based classification
  if (error.statusCode) {
    if (error.statusCode === 400 || error.statusCode === 422) {
      return ERROR_TYPES.VALIDATION_ERROR
    }
    if (error.statusCode === 401 || error.statusCode === 403) {
      return ERROR_TYPES.PERMISSION_ERROR
    }
    if (error.statusCode >= 500) {
      return ERROR_TYPES.SERVER_ERROR
    }
  }

  // Scheduler-specific errors based on context
  if (error.context?.operation) {
    return ERROR_TYPES.SCHEDULER_TASK_ERROR
  }

  return ERROR_TYPES.UNKNOWN_ERROR
}

/**
 * Gets user-friendly error message based on error classification
 */
function getErrorMessage(error: SchedulerError): string {
  const errorType = classifyError(error)
  const context = error.context

  // Scheduler-specific error messages
  if (errorType === ERROR_TYPES.SCHEDULER_TASK_ERROR && context?.operation) {
    switch (context.operation) {
      case 'create':
        return SCHEDULER_ERROR_MESSAGES.TASK_CREATE_FAILED
      case 'update':
        return SCHEDULER_ERROR_MESSAGES.TASK_UPDATE_FAILED
      case 'delete':
        return SCHEDULER_ERROR_MESSAGES.TASK_DELETE_FAILED
      case 'execute':
        return SCHEDULER_ERROR_MESSAGES.TASK_EXECUTION_FAILED
      case 'fetch':
        return SCHEDULER_ERROR_MESSAGES.TASK_NOT_FOUND
    }
  }

  // Generic error messages by type
  switch (errorType) {
    case ERROR_TYPES.NETWORK_ERROR:
      return 'Network connection failed. Please check your internet connection and try again.'
    case ERROR_TYPES.VALIDATION_ERROR:
      return SCHEDULER_ERROR_MESSAGES.TASK_VALIDATION_ERROR
    case ERROR_TYPES.PERMISSION_ERROR:
      return SCHEDULER_ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS
    case ERROR_TYPES.SERVER_ERROR:
      return SCHEDULER_ERROR_MESSAGES.SCHEDULER_SERVICE_UNAVAILABLE
    default:
      return 'An unexpected error occurred while managing scheduled tasks. Please try again or contact support if the problem persists.'
  }
}

/**
 * Gets suggested recovery actions based on error type
 */
function getRecoveryActions(error: SchedulerError): Array<{
  label: string
  action: () => void
  variant: 'primary' | 'secondary' | 'outline'
}> {
  const errorType = classifyError(error)
  const actions = []

  // Always include retry option
  actions.push({
    label: 'Try Again',
    action: () => window.location.reload(),
    variant: 'primary' as const
  })

  // Error-specific actions
  switch (errorType) {
    case ERROR_TYPES.VALIDATION_ERROR:
      actions.push({
        label: 'Review Configuration',
        action: () => window.history.back(),
        variant: 'secondary' as const
      })
      break

    case ERROR_TYPES.PERMISSION_ERROR:
      actions.push({
        label: 'Contact Administrator',
        action: () => window.open('mailto:admin@example.com?subject=Scheduler Access Issue', '_blank'),
        variant: 'outline' as const
      })
      break

    case ERROR_TYPES.SCHEDULER_TASK_ERROR:
      if (error.context?.taskId) {
        actions.push({
          label: 'View Task Details',
          action: () => window.location.href = `/system-settings/scheduler/${error.context?.taskId}`,
          variant: 'secondary' as const
        })
      }
      break
  }

  return actions
}

/**
 * Custom hook for error recovery functionality
 */
function useErrorRecovery() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const clearCache = () => {
    // Clear React Query cache for scheduler-related queries
    queryClient.invalidateQueries({ queryKey: ['scheduler'] })
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.removeQueries({ queryKey: ['scheduler'], exact: false })
  }

  const resetToSchedulerList = () => {
    clearCache()
    router.push('/system-settings/scheduler')
  }

  const refreshPage = () => {
    clearCache()
    window.location.reload()
  }

  return {
    clearCache,
    resetToSchedulerList,
    refreshPage
  }
}

/**
 * Error reporting utility
 */
function reportError(error: SchedulerError) {
  // Log error for development
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Scheduler Error Report')
    console.error('Error:', error)
    console.log('Context:', error.context)
    console.log('Stack:', error.stack)
    console.groupEnd()
  }

  // In production, this would integrate with monitoring service
  // Example: sendToErrorReporting(error)
}

/**
 * Scheduler Error Boundary Component
 * 
 * This component provides comprehensive error handling for the scheduler management section,
 * following Next.js app router error.tsx conventions and implementing React Error Boundary
 * integration with detailed error reporting and recovery mechanisms.
 */
export default function SchedulerError({ error, reset }: ErrorPageProps) {
  const { resetToSchedulerList, refreshPage } = useErrorRecovery()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Report error on mount and when error changes
  useEffect(() => {
    reportError(error)
  }, [error])

  // Auto-retry logic for transient errors
  useEffect(() => {
    const errorType = classifyError(error)
    
    if (errorType === ERROR_TYPES.NETWORK_ERROR && retryCount < 2) {
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        reset()
      }, Math.pow(2, retryCount) * 1000) // Exponential backoff

      return () => clearTimeout(timeoutId)
    }
  }, [error, retryCount, reset])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500)) // Brief delay for UX
      reset()
    } catch (retryError) {
      console.error('Retry failed:', retryError)
    } finally {
      setIsRetrying(false)
    }
  }

  const errorMessage = getErrorMessage(error)
  const errorType = classifyError(error)
  const isSchedulerSpecific = errorType === ERROR_TYPES.SCHEDULER_TASK_ERROR

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Error Icon and Status */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg
              className="h-8 w-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isSchedulerSpecific ? 'Scheduler Task Error' : 'Something went wrong'}
          </h1>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {errorMessage}
          </p>
        </div>

        {/* Error Details (Development Mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Development Error Details
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p><strong>Error:</strong> {error.name}: {error.message}</p>
                  {error.context && (
                    <p><strong>Context:</strong> {JSON.stringify(error.context, null, 2)}</p>
                  )}
                  {error.statusCode && (
                    <p><strong>Status Code:</strong> {error.statusCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isRetrying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>

          <button
            onClick={refreshPage}
            className="w-full flex justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Refresh Page
          </button>

          <button
            onClick={resetToSchedulerList}
            className="w-full flex justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            Return to Scheduler List
          </button>
        </div>

        {/* Additional Help */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            If this problem persists,{' '}
            <a
              href="mailto:support@dreamfactory.com?subject=Scheduler Error Report"
              className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
            >
              contact support
            </a>{' '}
            for assistance.
          </p>
        </div>

        {/* Accessibility Improvements */}
        <div className="sr-only" role="status" aria-live="polite">
          {retryCount > 0 && `Retry attempt ${retryCount} in progress`}
        </div>
      </div>
    </div>
  )
}

// Error boundary wrapper component for development testing
export function SchedulerErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {children}
    </React.Suspense>
  )
}

// MSW mock error generator for development testing
export const generateMockSchedulerError = (type: keyof typeof ERROR_TYPES, context?: Partial<SchedulerError['context']>): SchedulerError => {
  const baseError = new Error('Mock scheduler error for testing') as SchedulerError
  
  switch (type) {
    case 'NETWORK_ERROR':
      baseError.name = 'NetworkError'
      baseError.message = 'Failed to fetch scheduler data'
      break
    case 'VALIDATION_ERROR':
      baseError.statusCode = 400
      baseError.message = 'Invalid task configuration'
      break
    case 'PERMISSION_ERROR':
      baseError.statusCode = 403
      baseError.message = 'Insufficient permissions'
      break
    case 'SCHEDULER_TASK_ERROR':
      baseError.code = 'TASK_OPERATION_FAILED'
      baseError.context = { operation: 'create', taskName: 'test-task', ...context }
      break
    case 'SERVER_ERROR':
      baseError.statusCode = 500
      baseError.message = 'Internal server error'
      break
    default:
      baseError.message = 'Unknown error occurred'
  }
  
  return baseError
}