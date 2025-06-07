/**
 * @fileoverview SchedulerServiceSelector - React component for service and component selection
 * @description Provides cascading dropdowns for scheduler task configuration with search,
 * loading states, tooltips, and accessibility compliance. Replaces Angular service/component
 * selection with enhanced filtering and UX using Headless UI and React Query.
 * 
 * @version 1.0.0
 * @license MIT
 * @author DreamFactory Team
 * 
 * Features:
 * - Service dropdown with React Query-cached data and search functionality
 * - Component dropdown that updates automatically when service changes
 * - Loading spinners during data fetching operations
 * - Search functionality filtering services by name and description
 * - Service description tooltips for additional context
 * - Component access level badges (Read, Write, Admin)
 * - Empty state handling with appropriate messaging
 * - React Hook Form integration with proper validation
 * - WCAG 2.1 AA accessibility compliance
 * - Keyboard navigation and ARIA attributes
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Combobox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { Controller, useFormContext, FieldError } from 'react-hook-form'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import clsx from 'clsx'

// Component imports - these would be implemented elsewhere in the UI library
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'

// Type imports
import type { 
  Service, 
  ServiceRow, 
  ServiceCategory, 
  ServiceStatus,
  HTTPMethod
} from '@/types/services'
import type { 
  SchedulerService, 
  SchedulerComponent,
  SchedulerParameter 
} from '@/types/scheduler'

// Hook imports - these would be implemented elsewhere
// For now, I'll create mock implementations inline since the actual hooks don't exist yet

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Props interface for the SchedulerServiceSelector component
 */
export interface SchedulerServiceSelectorProps {
  /** Name of the service field in the form */
  serviceFieldName?: string
  
  /** Name of the component field in the form */
  componentFieldName?: string
  
  /** Placeholder text for service dropdown */
  servicePlaceholder?: string
  
  /** Placeholder text for component dropdown */
  componentPlaceholder?: string
  
  /** Whether the service selection is required */
  required?: boolean
  
  /** Whether the selector is disabled */
  disabled?: boolean
  
  /** Custom CSS classes */
  className?: string
  
  /** Callback when service is selected */
  onServiceChange?: (service: SchedulerService | null) => void
  
  /** Callback when component is selected */
  onComponentChange?: (component: SchedulerComponent | null) => void
  
  /** Filter services by category */
  filterByCategory?: ServiceCategory[]
  
  /** Filter services by status */
  filterByStatus?: ServiceStatus[]
  
  /** Minimum query length before searching */
  minSearchLength?: number
  
  /** Search debounce delay in milliseconds */
  searchDebounceMs?: number
}

/**
 * Extended service interface for the scheduler selector
 */
interface SchedulerServiceWithDetails extends SchedulerService {
  description?: string
  category?: ServiceCategory
  status?: ServiceStatus
  health?: {
    status: 'healthy' | 'unhealthy' | 'degraded'
    lastCheck: string
    message?: string
  }
  endpointCount?: number
}

/**
 * Component access level type
 */
type ComponentAccessLevel = 'read' | 'write' | 'admin' | 'none'

/**
 * Extended component interface with access level
 */
interface SchedulerComponentWithAccess extends SchedulerComponent {
  accessLevel?: ComponentAccessLevel
  methods?: HTTPMethod[]
  category?: string
  examples?: Array<{
    title: string
    description: string
    parameters?: Record<string, any>
  }>
}

// =============================================================================
// MOCK HOOKS - These would be real implementations in the actual app
// =============================================================================

/**
 * Mock useServices hook - would be implemented in src/hooks/useServices.ts
 */
const useServices = (): UseQueryResult<SchedulerServiceWithDetails[], Error> => {
  return useQuery({
    queryKey: ['services', 'scheduler'],
    queryFn: async (): Promise<SchedulerServiceWithDetails[]> => {
      // Mock implementation - in real app this would call API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
      
      return [
        {
          id: '1',
          name: 'mysql_db',
          type: 'database',
          label: 'MySQL Database',
          isActive: true,
          description: 'Production MySQL database for customer data',
          category: 'database',
          status: 'active',
          health: {
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            message: 'All connections healthy'
          },
          endpointCount: 45
        },
        {
          id: '2', 
          name: 'postgres_analytics',
          type: 'database',
          label: 'PostgreSQL Analytics',
          isActive: true,
          description: 'Analytics and reporting PostgreSQL database',
          category: 'database',
          status: 'active',
          health: {
            status: 'healthy',
            lastCheck: new Date().toISOString()
          },
          endpointCount: 23
        },
        {
          id: '3',
          name: 'email_service',
          type: 'email',
          label: 'SMTP Email Service',
          isActive: true,
          description: 'SMTP service for transactional emails',
          category: 'email',
          status: 'active',
          health: {
            status: 'healthy',
            lastCheck: new Date().toISOString()
          },
          endpointCount: 8
        },
        {
          id: '4',
          name: 'file_storage',
          type: 'file',
          label: 'S3 File Storage',
          isActive: false,
          description: 'Amazon S3 file storage service',
          category: 'file',
          status: 'inactive',
          health: {
            status: 'degraded',
            lastCheck: new Date().toISOString(),
            message: 'Some endpoints experiencing delays'
          },
          endpointCount: 12
        }
      ]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Mock useServiceComponents hook - would be implemented in src/hooks/useServiceComponents.ts
 */
const useServiceComponents = (serviceId: string | null): UseQueryResult<SchedulerComponentWithAccess[], Error> => {
  return useQuery({
    queryKey: ['service-components', serviceId],
    queryFn: async (): Promise<SchedulerComponentWithAccess[]> => {
      if (!serviceId) return []
      
      // Mock implementation - in real app this would call API
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate network delay
      
      // Return different components based on service type
      const mockComponents: Record<string, SchedulerComponentWithAccess[]> = {
        '1': [ // mysql_db
          {
            path: '/api/v2/mysql_db/_table',
            description: 'List all tables in the database',
            verbs: ['GET'],
            accessLevel: 'read',
            methods: ['GET'],
            category: 'schema',
            requiresAuth: true,
            parameters: [
              {
                name: 'include_schema',
                type: 'boolean',
                required: false,
                description: 'Include schema information'
              }
            ]
          },
          {
            path: '/api/v2/mysql_db/_table/{table_name}',
            description: 'Perform CRUD operations on specific table',
            verbs: ['GET', 'POST', 'PUT', 'DELETE'],
            accessLevel: 'write',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            category: 'data',
            requiresAuth: true,
            parameters: [
              {
                name: 'table_name',
                type: 'string',
                required: true,
                description: 'Name of the database table'
              },
              {
                name: 'limit',
                type: 'number',
                required: false,
                description: 'Limit number of records returned'
              }
            ]
          },
          {
            path: '/api/v2/mysql_db/_schema',
            description: 'Database schema information',
            verbs: ['GET'],
            accessLevel: 'admin',
            methods: ['GET'],
            category: 'schema',
            requiresAuth: true,
            parameters: []
          }
        ],
        '2': [ // postgres_analytics
          {
            path: '/api/v2/postgres_analytics/_table',
            description: 'Analytics table operations',
            verbs: ['GET'],
            accessLevel: 'read',
            methods: ['GET'],
            category: 'analytics',
            requiresAuth: true,
            parameters: []
          },
          {
            path: '/api/v2/postgres_analytics/_proc/{procedure_name}',
            description: 'Execute stored procedures',
            verbs: ['POST'],
            accessLevel: 'write',
            methods: ['POST'],
            category: 'procedures',
            requiresAuth: true,
            parameters: [
              {
                name: 'procedure_name',
                type: 'string',
                required: true,
                description: 'Name of the stored procedure'
              }
            ]
          }
        ],
        '3': [ // email_service
          {
            path: '/api/v2/email_service/send',
            description: 'Send transactional email',
            verbs: ['POST'],
            accessLevel: 'write',
            methods: ['POST'],
            category: 'messaging',
            requiresAuth: true,
            parameters: [
              {
                name: 'to',
                type: 'string',
                required: true,
                description: 'Recipient email address'
              },
              {
                name: 'subject',
                type: 'string',
                required: true,
                description: 'Email subject line'
              }
            ]
          }
        ],
        '4': [ // file_storage
          {
            path: '/api/v2/file_storage/_file',
            description: 'File operations',
            verbs: ['GET', 'POST', 'DELETE'],
            accessLevel: 'write',
            methods: ['GET', 'POST', 'DELETE'],
            category: 'storage',
            requiresAuth: true,
            parameters: []
          }
        ]
      }
      
      return mockComponents[serviceId] || []
    },
    enabled: !!serviceId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 8 * 60 * 1000, // 8 minutes
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Filter services based on search query
 */
const filterServices = (
  services: SchedulerServiceWithDetails[], 
  query: string,
  minSearchLength: number = 2
): SchedulerServiceWithDetails[] => {
  if (!query || query.length < minSearchLength) {
    return services
  }
  
  const lowerQuery = query.toLowerCase()
  
  return services.filter(service => 
    service.name.toLowerCase().includes(lowerQuery) ||
    service.label?.toLowerCase().includes(lowerQuery) ||
    service.description?.toLowerCase().includes(lowerQuery) ||
    service.type.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter components based on search query
 */
const filterComponents = (
  components: SchedulerComponentWithAccess[], 
  query: string,
  minSearchLength: number = 2
): SchedulerComponentWithAccess[] => {
  if (!query || query.length < minSearchLength) {
    return components
  }
  
  const lowerQuery = query.toLowerCase()
  
  return components.filter(component =>
    component.path.toLowerCase().includes(lowerQuery) ||
    component.description?.toLowerCase().includes(lowerQuery) ||
    component.category?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get badge variant based on access level
 */
const getAccessLevelBadgeVariant = (accessLevel: ComponentAccessLevel) => {
  switch (accessLevel) {
    case 'read':
      return 'secondary'
    case 'write':
      return 'default'
    case 'admin':
      return 'destructive'
    default:
      return 'outline'
  }
}

/**
 * Get access level display text
 */
const getAccessLevelText = (accessLevel: ComponentAccessLevel) => {
  switch (accessLevel) {
    case 'read':
      return 'Read'
    case 'write':
      return 'Write'
    case 'admin':
      return 'Admin'
    default:
      return 'None'
  }
}

/**
 * Get service status indicator
 */
const getServiceStatusIndicator = (status: ServiceStatus, isActive: boolean) => {
  if (!isActive) return 'bg-gray-400'
  
  switch (status) {
    case 'active':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    case 'testing':
      return 'bg-yellow-500'
    case 'deploying':
      return 'bg-blue-500'
    case 'updating':
      return 'bg-orange-500'
    default:
      return 'bg-gray-400'
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SchedulerServiceSelector Component
 * 
 * Provides cascading service and component selection for scheduler tasks.
 * Integrates with React Query for data fetching and React Hook Form for validation.
 */
export const SchedulerServiceSelector: React.FC<SchedulerServiceSelectorProps> = ({
  serviceFieldName = 'serviceId',
  componentFieldName = 'component',
  servicePlaceholder = 'Select a service...',
  componentPlaceholder = 'Select a component...',
  required = false,
  disabled = false,
  className,
  onServiceChange,
  onComponentChange,
  filterByCategory,
  filterByStatus,
  minSearchLength = 2,
  searchDebounceMs = 300
}) => {
  // Form context
  const { control, watch, formState: { errors } } = useFormContext()
  
  // Watch selected service ID to trigger component loading
  const selectedServiceId = watch(serviceFieldName)
  
  // Local state
  const [serviceQuery, setServiceQuery] = useState('')
  const [componentQuery, setComponentQuery] = useState('')
  const [selectedService, setSelectedService] = useState<SchedulerServiceWithDetails | null>(null)
  const [selectedComponent, setSelectedComponent] = useState<SchedulerComponentWithAccess | null>(null)
  
  // Data fetching
  const { 
    data: services = [], 
    isLoading: servicesLoading, 
    error: servicesError 
  } = useServices()
  
  const { 
    data: components = [], 
    isLoading: componentsLoading, 
    error: componentsError 
  } = useServiceComponents(selectedServiceId)
  
  // Filter services based on props and search query
  const filteredServices = useMemo(() => {
    let filtered = services
    
    // Apply category filter
    if (filterByCategory && filterByCategory.length > 0) {
      filtered = filtered.filter(service => 
        service.category && filterByCategory.includes(service.category)
      )
    }
    
    // Apply status filter
    if (filterByStatus && filterByStatus.length > 0) {
      filtered = filtered.filter(service => 
        service.status && filterByStatus.includes(service.status)
      )
    }
    
    // Apply search filter
    return filterServices(filtered, serviceQuery, minSearchLength)
  }, [services, serviceQuery, filterByCategory, filterByStatus, minSearchLength])
  
  // Filter components based on search query
  const filteredComponents = useMemo(() => {
    return filterComponents(components, componentQuery, minSearchLength)
  }, [components, componentQuery, minSearchLength])
  
  // Update selected service when serviceId changes
  useEffect(() => {
    if (selectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === selectedServiceId)
      setSelectedService(service || null)
    } else {
      setSelectedService(null)
    }
  }, [selectedServiceId, services])
  
  // Handle service selection
  const handleServiceChange = useCallback((service: SchedulerServiceWithDetails | null) => {
    setSelectedService(service)
    setSelectedComponent(null) // Reset component selection
    setComponentQuery('') // Clear component search
    onServiceChange?.(service)
  }, [onServiceChange])
  
  // Handle component selection
  const handleComponentChange = useCallback((component: SchedulerComponentWithAccess | null) => {
    setSelectedComponent(component)
    onComponentChange?.(component)
  }, [onComponentChange])
  
  // Get form field errors
  const serviceError = errors[serviceFieldName] as FieldError | undefined
  const componentError = errors[componentFieldName] as FieldError | undefined
  
  return (
    <div className={clsx('space-y-6', className)}>
      {/* Service Selection */}
      <div className="space-y-2">
        <label 
          htmlFor="service-selector"
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Service {required && <span className="text-red-500">*</span>}
        </label>
        
        <Controller
          name={serviceFieldName}
          control={control}
          rules={{ required: required ? 'Service selection is required' : false }}
          render={({ field }) => (
            <Combobox
              value={selectedService}
              onChange={(service) => {
                field.onChange(service?.id || '')
                handleServiceChange(service)
              }}
              disabled={disabled || servicesLoading}
            >
              <div className="relative">
                <Combobox.Input
                  id="service-selector"
                  className={clsx(
                    'w-full rounded-md border-0 bg-white dark:bg-gray-900 py-1.5 pl-3 pr-10 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset',
                    serviceError 
                      ? 'ring-red-300 dark:ring-red-700 focus:ring-red-500' 
                      : 'ring-gray-300 dark:ring-gray-600 focus:ring-primary-500',
                    'focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  displayValue={(service: SchedulerServiceWithDetails) => service?.label || ''}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder={servicePlaceholder}
                  autoComplete="off"
                  aria-describedby={serviceError ? 'service-error' : undefined}
                />
                
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  {servicesLoading ? (
                    <Spinner className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </Combobox.Button>
                
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {servicesError ? (
                    <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                      Error loading services. Please try again.
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {serviceQuery ? 'No services found matching your search.' : 'No services available.'}
                    </div>
                  ) : (
                    filteredServices.map((service) => (
                      <Combobox.Option
                        key={service.id}
                        value={service}
                        className={({ active }) =>
                          clsx(
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                            active 
                              ? 'bg-primary-600 text-white' 
                              : 'text-gray-900 dark:text-gray-100'
                          )
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {/* Service Status Indicator */}
                                <div 
                                  className={clsx(
                                    'h-2 w-2 rounded-full',
                                    getServiceStatusIndicator(service.status || 'inactive', service.isActive)
                                  )}
                                  aria-label={`Service status: ${service.status}`}
                                />
                                
                                <div className="flex flex-col">
                                  <span className={clsx(
                                    'block truncate',
                                    selected ? 'font-semibold' : 'font-normal'
                                  )}>
                                    {service.label}
                                  </span>
                                  <span className={clsx(
                                    'text-xs truncate',
                                    active ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'
                                  )}>
                                    {service.name} • {service.type}
                                    {service.endpointCount && ` • ${service.endpointCount} endpoints`}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Service Description Tooltip */}
                              {service.description && (
                                <Tooltip content={service.description}>
                                  <InformationCircleIcon 
                                    className={clsx(
                                      'h-4 w-4',
                                      active ? 'text-primary-200' : 'text-gray-400'
                                    )}
                                  />
                                </Tooltip>
                              )}
                            </div>
                            
                            {selected && (
                              <span className={clsx(
                                'absolute inset-y-0 right-0 flex items-center pr-4',
                                active ? 'text-white' : 'text-primary-600'
                              )}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </div>
            </Combobox>
          )}
        />
        
        {serviceError && (
          <p id="service-error" className="text-sm text-red-600 dark:text-red-400">
            {serviceError.message}
          </p>
        )}
      </div>
      
      {/* Component Selection */}
      <div className="space-y-2">
        <label 
          htmlFor="component-selector"
          className="block text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Component {required && <span className="text-red-500">*</span>}
        </label>
        
        <Controller
          name={componentFieldName}
          control={control}
          rules={{ required: required ? 'Component selection is required' : false }}
          render={({ field }) => (
            <Combobox
              value={selectedComponent}
              onChange={(component) => {
                field.onChange(component?.path || '')
                handleComponentChange(component)
              }}
              disabled={disabled || !selectedService || componentsLoading}
            >
              <div className="relative">
                <Combobox.Input
                  id="component-selector"
                  className={clsx(
                    'w-full rounded-md border-0 bg-white dark:bg-gray-900 py-1.5 pl-3 pr-10 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset',
                    componentError 
                      ? 'ring-red-300 dark:ring-red-700 focus:ring-red-500' 
                      : 'ring-gray-300 dark:ring-gray-600 focus:ring-primary-500',
                    'focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
                    (disabled || !selectedService || componentsLoading) && 'opacity-50 cursor-not-allowed'
                  )}
                  displayValue={(component: SchedulerComponentWithAccess) => component?.path || ''}
                  onChange={(event) => setComponentQuery(event.target.value)}
                  placeholder={selectedService ? componentPlaceholder : 'Select a service first...'}
                  autoComplete="off"
                  aria-describedby={componentError ? 'component-error' : undefined}
                />
                
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                  {componentsLoading ? (
                    <Spinner className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  )}
                </Combobox.Button>
                
                <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {!selectedService ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      Please select a service first.
                    </div>
                  ) : componentsError ? (
                    <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                      Error loading components. Please try again.
                    </div>
                  ) : filteredComponents.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      {componentQuery ? 'No components found matching your search.' : 'No components available for this service.'}
                    </div>
                  ) : (
                    filteredComponents.map((component, index) => (
                      <Combobox.Option
                        key={`${component.path}-${index}`}
                        value={component}
                        className={({ active }) =>
                          clsx(
                            'relative cursor-default select-none py-2 pl-3 pr-9',
                            active 
                              ? 'bg-primary-600 text-white' 
                              : 'text-gray-900 dark:text-gray-100'
                          )
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col space-y-1 flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className={clsx(
                                    'block truncate',
                                    selected ? 'font-semibold' : 'font-normal'
                                  )}>
                                    {component.path}
                                  </span>
                                  
                                  {/* Access Level Badge */}
                                  {component.accessLevel && (
                                    <Badge 
                                      variant={getAccessLevelBadgeVariant(component.accessLevel)}
                                      className="text-xs"
                                    >
                                      {getAccessLevelText(component.accessLevel)}
                                    </Badge>
                                  )}
                                </div>
                                
                                {component.description && (
                                  <span className={clsx(
                                    'text-xs truncate',
                                    active ? 'text-primary-200' : 'text-gray-500 dark:text-gray-400'
                                  )}>
                                    {component.description}
                                  </span>
                                )}
                                
                                {/* HTTP Methods */}
                                {component.methods && component.methods.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {component.methods.map((method) => (
                                      <span
                                        key={method}
                                        className={clsx(
                                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                                          active 
                                            ? 'bg-primary-700 text-primary-100' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                        )}
                                      >
                                        {method}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {selected && (
                              <span className={clsx(
                                'absolute inset-y-0 right-0 flex items-center pr-4',
                                active ? 'text-white' : 'text-primary-600'
                              )}>
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </div>
            </Combobox>
          )}
        />
        
        {componentError && (
          <p id="component-error" className="text-sm text-red-600 dark:text-red-400">
            {componentError.message}
          </p>
        )}
      </div>
      
      {/* Service Information Display */}
      {selectedService && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Selected Service: {selectedService.label}
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>{selectedService.description}</p>
                <div className="mt-2 space-y-1">
                  <p><strong>Type:</strong> {selectedService.type}</p>
                  <p><strong>Status:</strong> {selectedService.status}</p>
                  {selectedService.endpointCount && (
                    <p><strong>Endpoints:</strong> {selectedService.endpointCount}</p>
                  )}
                  {selectedService.health && (
                    <p>
                      <strong>Health:</strong> 
                      <span className={clsx(
                        'ml-1',
                        selectedService.health.status === 'healthy' ? 'text-green-600 dark:text-green-400' :
                        selectedService.health.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      )}>
                        {selectedService.health.status}
                      </span>
                      {selectedService.health.message && (
                        <span className="text-blue-600 dark:text-blue-300"> - {selectedService.health.message}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Component Information Display */}
      {selectedComponent && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Selected Component: {selectedComponent.path}
              </h3>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                {selectedComponent.description && <p>{selectedComponent.description}</p>}
                <div className="mt-2 space-y-1">
                  {selectedComponent.methods && (
                    <p><strong>Methods:</strong> {selectedComponent.methods.join(', ')}</p>
                  )}
                  {selectedComponent.accessLevel && (
                    <p><strong>Access Level:</strong> {getAccessLevelText(selectedComponent.accessLevel)}</p>
                  )}
                  {selectedComponent.requiresAuth !== undefined && (
                    <p><strong>Authentication:</strong> {selectedComponent.requiresAuth ? 'Required' : 'Not required'}</p>
                  )}
                  {selectedComponent.parameters && selectedComponent.parameters.length > 0 && (
                    <div>
                      <strong>Parameters:</strong>
                      <ul className="mt-1 ml-4 list-disc space-y-1">
                        {selectedComponent.parameters.map((param, index) => (
                          <li key={index}>
                            <strong>{param.name}</strong> ({param.type}){param.required && ' *'} 
                            {param.description && ` - ${param.description}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchedulerServiceSelector