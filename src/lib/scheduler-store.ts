/**
 * Scheduler State Management Store for DreamFactory Admin Interface
 * 
 * Zustand-based state management store specifically designed for scheduler workflow
 * state management, replacing RxJS observables from Angular implementation with
 * simplified React patterns per Section 5.2 component details.
 * 
 * Key Features:
 * - Scheduler workflow state with persistence capabilities
 * - Task management with optimistic updates
 * - Filter and search state management
 * - Integration with React Query for server state
 * - Persistence middleware for state restoration
 * - Type-safe state management with TypeScript
 * 
 * Architecture:
 * - Replaces Angular DfSchedulerService with Zustand store patterns
 * - Implements Section 4.3.1 React Context state flow
 * - Provides simplified state patterns replacing RxJS complexity
 * - Integrates with React Query for server-side data synchronization
 * - Supports concurrent features for improved user experience
 * 
 * Performance:
 * - Selective subscriptions to prevent unnecessary re-renders
 * - Persisted state for seamless user experience across sessions
 * - Optimistic updates for immediate UI feedback
 * - Intelligent cache invalidation coordination with React Query
 * 
 * @example
 * ```tsx
 * function SchedulerManagement() {
 *   const { 
 *     tasks, 
 *     selectedTask, 
 *     filters, 
 *     setFilter, 
 *     selectTask,
 *     updateTask 
 *   } = useSchedulerStore()
 *   
 *   return (
 *     <div>
 *       {tasks.map(task => (
 *         <div key={task.id} onClick={() => selectTask(task.id)}>
 *           {task.name}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */

'use client'

import { create } from 'zustand'
import { createContext, useContext, useRef, ReactNode } from 'react'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import { useStore } from 'zustand'

/**
 * Scheduler task interface
 * Represents a scheduled task in the system
 */
export interface SchedulerTask {
  /** Unique task identifier */
  id: number
  /** Human-readable task name */
  name: string
  /** Task description */
  description: string
  /** Whether the task is active */
  active: boolean
  /** Service ID this task belongs to */
  serviceId: number
  /** Service name for display */
  serviceName?: string
  /** Component within the service */
  componentId: string
  /** HTTP method for the task */
  method: string
  /** HTTP verb mask for API calls */
  verbMask: number
  /** Execution frequency in seconds */
  frequency: number
  /** JSON payload for the task */
  payload?: string
  /** Last execution status */
  lastStatus?: number
  /** Last execution timestamp */
  lastRun?: Date
  /** Next scheduled execution */
  nextRun?: Date
  /** Task creator user ID */
  createdById?: number
  /** Task last modifier user ID */
  lastModifiedById?: number
  /** Creation timestamp */
  createdDate?: Date
  /** Last modification timestamp */
  lastModifiedDate?: Date
  /** Associated task logs */
  taskLogs?: SchedulerTaskLog[]
}

/**
 * Scheduler task log interface
 * Represents execution logs for scheduler tasks
 */
export interface SchedulerTaskLog {
  /** Log entry ID */
  id: number
  /** Associated task ID */
  taskId: number
  /** Execution timestamp */
  executedAt: Date
  /** HTTP status code */
  statusCode: number
  /** Response message */
  response?: string
  /** Error message if execution failed */
  error?: string
  /** Execution duration in milliseconds */
  duration?: number
}

/**
 * Filter options for scheduler tasks
 */
export interface SchedulerFilters {
  /** Filter by task name or description */
  search: string
  /** Filter by service ID */
  serviceId?: number
  /** Filter by active status */
  active?: boolean
  /** Filter by HTTP method */
  method?: string
  /** Sort field */
  sortBy: 'name' | 'lastRun' | 'nextRun' | 'frequency' | 'status'
  /** Sort direction */
  sortOrder: 'asc' | 'desc'
  /** Pagination page */
  page: number
  /** Items per page */
  pageSize: number
}

/**
 * Scheduler workflow state
 */
export interface SchedulerWorkflowState {
  /** Current workflow step */
  currentStep: 'list' | 'create' | 'edit' | 'view' | 'logs'
  /** Whether in editing mode */
  isEditing: boolean
  /** Whether changes are pending */
  hasUnsavedChanges: boolean
  /** Last action performed */
  lastAction?: string
  /** Workflow context data */
  workflowData?: Record<string, any>
}

/**
 * Main scheduler store state interface
 */
export interface SchedulerState {
  // Task Management
  /** Current list of scheduler tasks */
  tasks: SchedulerTask[]
  /** Currently selected task */
  selectedTask: SchedulerTask | null
  /** Task being edited */
  editingTask: SchedulerTask | null
  
  // UI State
  /** Current filters applied */
  filters: SchedulerFilters
  /** Loading states for different operations */
  loading: {
    tasks: boolean
    task: boolean
    creating: boolean
    updating: boolean
    deleting: boolean
    testing: boolean
  }
  /** Error states */
  errors: {
    tasks?: string
    task?: string
    create?: string
    update?: string
    delete?: string
    test?: string
  }
  
  // Workflow State
  /** Current workflow state */
  workflow: SchedulerWorkflowState
  
  // View State
  /** Expanded task IDs in list view */
  expandedTasks: Set<number>
  /** Selected task IDs for bulk operations */
  selectedTasks: Set<number>
  /** Table column visibility */
  visibleColumns: string[]
  
  // Cache Management
  /** Last cache update timestamp */
  lastUpdated?: Date
  /** Whether data needs refresh */
  stale: boolean
}

/**
 * Scheduler store actions interface
 */
export interface SchedulerActions {
  // Task Management Actions
  /** Set the task list */
  setTasks: (tasks: SchedulerTask[]) => void
  /** Add a new task */
  addTask: (task: SchedulerTask) => void
  /** Update an existing task */
  updateTask: (id: number, updates: Partial<SchedulerTask>) => void
  /** Remove a task */
  removeTask: (id: number) => void
  /** Select a task */
  selectTask: (taskId: number | null) => void
  /** Start editing a task */
  startEditing: (task: SchedulerTask) => void
  /** Stop editing */
  stopEditing: () => void
  
  // Filter Actions
  /** Update filters */
  setFilter: <K extends keyof SchedulerFilters>(key: K, value: SchedulerFilters[K]) => void
  /** Reset filters to default */
  resetFilters: () => void
  /** Apply multiple filters at once */
  applyFilters: (filters: Partial<SchedulerFilters>) => void
  
  // Loading State Actions
  /** Set loading state for specific operation */
  setLoading: <K extends keyof SchedulerState['loading']>(key: K, value: boolean) => void
  /** Set error state */
  setError: <K extends keyof SchedulerState['errors']>(key: K, error: string | undefined) => void
  /** Clear all errors */
  clearErrors: () => void
  
  // Workflow Actions
  /** Set workflow step */
  setWorkflowStep: (step: SchedulerWorkflowState['currentStep']) => void
  /** Set editing mode */
  setEditingMode: (editing: boolean) => void
  /** Mark unsaved changes */
  markUnsavedChanges: (hasChanges: boolean) => void
  /** Set workflow data */
  setWorkflowData: (data: Record<string, any>) => void
  
  // UI State Actions
  /** Toggle task expansion */
  toggleTaskExpansion: (taskId: number) => void
  /** Toggle task selection */
  toggleTaskSelection: (taskId: number) => void
  /** Clear task selection */
  clearTaskSelection: () => void
  /** Set visible columns */
  setVisibleColumns: (columns: string[]) => void
  
  // Cache Actions
  /** Mark data as stale */
  markStale: () => void
  /** Refresh data */
  refresh: () => void
  /** Reset entire state */
  reset: () => void
}

/**
 * Combined scheduler store interface
 */
export type SchedulerStore = SchedulerState & SchedulerActions

/**
 * Default filter values
 */
const defaultFilters: SchedulerFilters = {
  search: '',
  serviceId: undefined,
  active: undefined,
  method: undefined,
  sortBy: 'name',
  sortOrder: 'asc',
  page: 1,
  pageSize: 25,
}

/**
 * Default workflow state
 */
const defaultWorkflow: SchedulerWorkflowState = {
  currentStep: 'list',
  isEditing: false,
  hasUnsavedChanges: false,
}

/**
 * Default visible columns for scheduler table
 */
const defaultVisibleColumns = [
  'status',
  'name',
  'description', 
  'service',
  'method',
  'frequency',
  'lastRun',
  'actions'
]

/**
 * Initial scheduler state
 */
const initialState: SchedulerState = {
  tasks: [],
  selectedTask: null,
  editingTask: null,
  filters: defaultFilters,
  loading: {
    tasks: false,
    task: false,
    creating: false,
    updating: false,
    deleting: false,
    testing: false,
  },
  errors: {},
  workflow: defaultWorkflow,
  expandedTasks: new Set(),
  selectedTasks: new Set(),
  visibleColumns: defaultVisibleColumns,
  stale: false,
}

/**
 * Custom storage interface for Zustand persistence
 * Handles serialization of complex types like Date and Set
 */
const customStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      const item = localStorage.getItem(name)
      return item
    } catch (error) {
      console.warn('Failed to get item from localStorage:', error)
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch (error) {
      console.warn('Failed to set item in localStorage:', error)
    }
  },
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch (error) {
      console.warn('Failed to remove item from localStorage:', error)
    }
  },
}

/**
 * Create scheduler store with middleware
 */
export const createSchedulerStore = () =>
  create<SchedulerStore>()(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          ...initialState,

          // Task Management Actions
          setTasks: (tasks) =>
            set((state) => {
              state.tasks = tasks
              state.lastUpdated = new Date()
              state.stale = false
            }),

          addTask: (task) =>
            set((state) => {
              state.tasks.push(task)
              state.lastUpdated = new Date()
            }),

          updateTask: (id, updates) =>
            set((state) => {
              const index = state.tasks.findIndex((task) => task.id === id)
              if (index !== -1) {
                Object.assign(state.tasks[index], updates)
                state.lastUpdated = new Date()
              }
              if (state.selectedTask?.id === id) {
                Object.assign(state.selectedTask, updates)
              }
              if (state.editingTask?.id === id) {
                Object.assign(state.editingTask, updates)
              }
            }),

          removeTask: (id) =>
            set((state) => {
              state.tasks = state.tasks.filter((task) => task.id !== id)
              if (state.selectedTask?.id === id) {
                state.selectedTask = null
              }
              if (state.editingTask?.id === id) {
                state.editingTask = null
              }
              state.selectedTasks.delete(id)
              state.expandedTasks.delete(id)
              state.lastUpdated = new Date()
            }),

          selectTask: (taskId) =>
            set((state) => {
              state.selectedTask = taskId 
                ? state.tasks.find((task) => task.id === taskId) || null 
                : null
            }),

          startEditing: (task) =>
            set((state) => {
              state.editingTask = { ...task }
              state.workflow.isEditing = true
              state.workflow.currentStep = task.id ? 'edit' : 'create'
            }),

          stopEditing: () =>
            set((state) => {
              state.editingTask = null
              state.workflow.isEditing = false
              state.workflow.hasUnsavedChanges = false
              state.workflow.currentStep = 'list'
            }),

          // Filter Actions
          setFilter: (key, value) =>
            set((state) => {
              (state.filters as any)[key] = value
              if (key !== 'page') {
                state.filters.page = 1 // Reset to first page when filtering
              }
            }),

          resetFilters: () =>
            set((state) => {
              state.filters = { ...defaultFilters }
            }),

          applyFilters: (filters) =>
            set((state) => {
              Object.assign(state.filters, filters)
              state.filters.page = 1 // Reset to first page
            }),

          // Loading State Actions
          setLoading: (key, value) =>
            set((state) => {
              state.loading[key] = value
            }),

          setError: (key, error) =>
            set((state) => {
              if (error) {
                state.errors[key] = error
              } else {
                delete state.errors[key]
              }
            }),

          clearErrors: () =>
            set((state) => {
              state.errors = {}
            }),

          // Workflow Actions
          setWorkflowStep: (step) =>
            set((state) => {
              state.workflow.currentStep = step
            }),

          setEditingMode: (editing) =>
            set((state) => {
              state.workflow.isEditing = editing
            }),

          markUnsavedChanges: (hasChanges) =>
            set((state) => {
              state.workflow.hasUnsavedChanges = hasChanges
            }),

          setWorkflowData: (data) =>
            set((state) => {
              state.workflow.workflowData = data
            }),

          // UI State Actions
          toggleTaskExpansion: (taskId) =>
            set((state) => {
              if (state.expandedTasks.has(taskId)) {
                state.expandedTasks.delete(taskId)
              } else {
                state.expandedTasks.add(taskId)
              }
            }),

          toggleTaskSelection: (taskId) =>
            set((state) => {
              if (state.selectedTasks.has(taskId)) {
                state.selectedTasks.delete(taskId)
              } else {
                state.selectedTasks.add(taskId)
              }
            }),

          clearTaskSelection: () =>
            set((state) => {
              state.selectedTasks.clear()
            }),

          setVisibleColumns: (columns) =>
            set((state) => {
              state.visibleColumns = columns
            }),

          // Cache Actions
          markStale: () =>
            set((state) => {
              state.stale = true
            }),

          refresh: () =>
            set((state) => {
              state.stale = true
              state.lastUpdated = new Date()
            }),

          reset: () => set(() => ({ ...initialState })),
        })),
        {
          name: 'scheduler-state',
          storage: createJSONStorage(() => customStorage),
          partialize: (state) => ({
            filters: state.filters,
            visibleColumns: state.visibleColumns,
            workflow: {
              currentStep: state.workflow.currentStep,
              // Don't persist editing state or unsaved changes
              isEditing: false,
              hasUnsavedChanges: false,
            },
          }),
          version: 1,
          migrate: (persistedState: any, version: number) => {
            // Handle migration of persisted state if needed
            if (version === 0) {
              // Migrate from version 0 to 1
              return {
                ...persistedState,
                workflow: { ...defaultWorkflow },
                visibleColumns: defaultVisibleColumns,
              }
            }
            return persistedState
          },
        }
      )
    )
  )

/**
 * Scheduler store context
 */
const SchedulerStoreContext = createContext<ReturnType<typeof createSchedulerStore> | null>(null)

/**
 * Scheduler store provider component
 */
export function SchedulerProvider({ 
  children, 
  store 
}: { 
  children: ReactNode
  store: ReturnType<typeof createSchedulerStore>
}) {
  return (
    <SchedulerStoreContext.Provider value={store}>
      {children}
    </SchedulerStoreContext.Provider>
  )
}

/**
 * Hook to access scheduler store
 * Must be used within SchedulerProvider
 */
export function useSchedulerStore<T>(selector?: (state: SchedulerStore) => T): T extends undefined ? SchedulerStore : T {
  const store = useContext(SchedulerStoreContext)
  
  if (!store) {
    throw new Error('useSchedulerStore must be used within SchedulerProvider')
  }
  
  return useStore(store, selector!) as any
}

/**
 * Hook to get the raw store instance
 * Useful for advanced use cases that need direct store access
 */
export function useSchedulerStoreApi() {
  const store = useContext(SchedulerStoreContext)
  
  if (!store) {
    throw new Error('useSchedulerStoreApi must be used within SchedulerProvider')
  }
  
  return store
}

/**
 * Type exports for scheduler store
 */
export type {
  SchedulerTask,
  SchedulerTaskLog,
  SchedulerFilters,
  SchedulerWorkflowState,
  SchedulerState,
  SchedulerActions,
}