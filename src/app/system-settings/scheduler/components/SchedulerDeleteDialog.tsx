'use client'

import React, { Fragment, useCallback, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

// Types based on expected scheduler interfaces
interface SchedulerTask {
  id: string
  name: string
  service: string
  frequency: string
  description?: string
  enabled: boolean
}

interface SchedulerDeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  task: SchedulerTask | null
}

interface DeleteSchedulerTaskPayload {
  taskId: string
}

interface ApiError {
  message: string
  code?: string
  details?: string
}

// Mock delete function - this would be replaced by the actual API client
const deleteSchedulerTask = async (payload: DeleteSchedulerTaskPayload): Promise<void> => {
  // Simulate API call with potential failure scenarios
  const response = await fetch(`/api/v2/system/scheduler/${payload.taskId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const error: ApiError = {
      message: errorData.message || `Failed to delete scheduler task (${response.status})`,
      code: errorData.code || 'DELETE_FAILED',
      details: errorData.details,
    }
    throw error
  }
}

/**
 * SchedulerDeleteDialog - React confirmation dialog component that handles scheduler task deletion
 * with user confirmation and comprehensive feedback.
 * 
 * Features:
 * - Displays task details (name, service, frequency) in confirmation message
 * - Implements Headless UI Dialog for accessibility and WCAG 2.1 AA compliance
 * - Integrates with React Query mutations for optimistic updates and cache invalidation
 * - Provides proper loading states with disabled confirm button during deletion
 * - Handles error states with specific error messages and retry options
 * - Implements proper focus management and keyboard navigation (ESC, Tab)
 * - Auto-closes on successful deletion with success notification
 * - Applies Tailwind CSS styling with backdrop blur for visual focus
 */
export default function SchedulerDeleteDialog({
  isOpen,
  onClose,
  task,
}: SchedulerDeleteDialogProps) {
  const queryClient = useQueryClient()
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // React Query mutation for deleting scheduler task
  const deleteTaskMutation = useMutation({
    mutationFn: deleteSchedulerTask,
    onSuccess: () => {
      // Invalidate and refetch scheduler tasks cache
      queryClient.invalidateQueries({ queryKey: ['scheduler-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['scheduler-task', task?.id] })
      
      // Show success notification
      toast.success(`Scheduler task "${task?.name}" has been deleted successfully.`, {
        duration: 4000,
        position: 'top-right',
      })
      
      // Close dialog
      onClose()
    },
    onError: (error: ApiError) => {
      // Keep dialog open to show error and allow retry
      console.error('Failed to delete scheduler task:', error)
      
      // Show error notification with specific error message
      const errorMessage = error.message || 'An unexpected error occurred while deleting the scheduler task.'
      toast.error(errorMessage, {
        duration: 6000,
        position: 'top-right',
      })
    },
  })

  // Handle confirm deletion
  const handleConfirmDelete = useCallback(() => {
    if (!task) return
    
    deleteTaskMutation.mutate({ taskId: task.id })
  }, [task, deleteTaskMutation])

  // Handle retry after error
  const handleRetry = useCallback(() => {
    if (!task) return
    
    // Reset mutation state and retry
    deleteTaskMutation.reset()
    deleteTaskMutation.mutate({ taskId: task.id })
  }, [task, deleteTaskMutation])

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (deleteTaskMutation.isPending) {
      // Don't allow closing while deletion is in progress
      return
    }
    
    // Reset mutation state when closing
    deleteTaskMutation.reset()
    onClose()
  }, [deleteTaskMutation.isPending, deleteTaskMutation.reset, onClose])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          handleClose()
          break
        case 'Enter':
          if (event.target === cancelButtonRef.current) {
            // Allow Enter on cancel button to close dialog
            event.preventDefault()
            handleClose()
          } else if (event.target === confirmButtonRef.current && !deleteTaskMutation.isPending) {
            // Allow Enter on confirm button to delete (if not loading)
            event.preventDefault()
            handleConfirmDelete()
          }
          break
        case 'Tab':
          // Let default tab behavior handle focus management within dialog
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      
      // Focus the cancel button initially for safe default
      setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 100)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose, handleConfirmDelete, deleteTaskMutation.isPending])

  // Don't render if no task provided
  if (!task) {
    return null
  }

  const isLoading = deleteTaskMutation.isPending
  const hasError = deleteTaskMutation.isError
  const error = deleteTaskMutation.error as ApiError | undefined

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={handleClose}
        initialFocus={cancelButtonRef}
      >
        {/* Backdrop with blur effect */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                {/* Dialog Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10 dark:bg-red-900/20">
                      <ExclamationTriangleIcon 
                        className="h-6 w-6 text-red-600 dark:text-red-400" 
                        aria-hidden="true" 
                      />
                    </div>
                    <div className="ml-4">
                      <Dialog.Title 
                        as="h3" 
                        className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                      >
                        Delete Scheduler Task
                      </Dialog.Title>
                    </div>
                  </div>
                  
                  {/* Close button */}
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-500 dark:hover:text-gray-400"
                    onClick={handleClose}
                    disabled={isLoading}
                    aria-label="Close dialog"
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Dialog Content */}
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Are you sure you want to delete this scheduler task? This action cannot be undone.
                  </p>
                  
                  {/* Task Details */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Name:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 font-semibold">{task.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Service:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{task.service}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{task.frequency}</span>
                    </div>
                    {task.description && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description:</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{task.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Error Display */}
                  {hasError && error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" aria-hidden="true" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                            Deletion Failed
                          </h3>
                          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                            {error.message}
                          </p>
                          {error.details && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              Details: {error.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dialog Actions */}
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                  {/* Confirm Delete Button */}
                  <button
                    ref={confirmButtonRef}
                    type="button"
                    className={`
                      inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm 
                      sm:ml-3 sm:w-auto min-w-[100px] transition-colors duration-200
                      ${isLoading 
                        ? 'bg-red-400 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800
                    `}
                    onClick={hasError ? handleRetry : handleConfirmDelete}
                    disabled={isLoading}
                    aria-describedby={hasError ? 'error-message' : undefined}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg 
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          ></circle>
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Deleting...
                      </div>
                    ) : hasError ? (
                      'Retry'
                    ) : (
                      'Delete Task'
                    )}
                  </button>

                  {/* Cancel Button */}
                  <button
                    ref={cancelButtonRef}
                    type="button"
                    className={`
                      mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm 
                      ring-1 ring-inset ring-gray-300 sm:mt-0 sm:w-auto min-w-[100px] transition-colors duration-200
                      dark:bg-gray-700 dark:text-gray-100 dark:ring-gray-600
                      ${isLoading 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-indigo-500'
                      }
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800
                    `}
                    onClick={handleClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Export types for use in other components
export type { SchedulerTask, SchedulerDeleteDialogProps }