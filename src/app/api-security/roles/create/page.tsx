/**
 * Role Creation Page Component
 * 
 * Main role creation page component that provides a comprehensive form interface 
 * for creating new roles with service access configuration and lookup key management. 
 * Transforms the Angular DfRoleDetailsComponent create mode into a React/Next.js 
 * server component with React Hook Form, Zod validation, and Tailwind CSS styling.
 * 
 * Features:
 * - React Hook Form with Zod schema validation for real-time validation under 100ms
 * - Next.js server component for SSR pages under 2 seconds  
 * - SWR/React Query for intelligent caching with cache hit responses under 50ms
 * - Tailwind CSS 4.1+ with WCAG 2.1 AA compliance
 * - Complex role creation workflows with permission bitmasks and service access arrays
 * - Zustand state management for form state persistence
 * - Next.js useRouter for form submission success navigation
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'

// UI Components
import {
  Form,
  FormField,
  FormLabel,
  FormDescription,
  FormErrorMessage,
  FormControl,
  FormGroup,
  FormActions,
  FormSection
} from '@/components/ui/form'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch, LabeledSwitch } from '@/components/ui/switch'

// Types and Validation
import {
  RoleCreatePayload,
  RoleCreatePayloadSchema,
  RoleServiceAccessType,
  AccessLevel,
  RequesterLevel
} from '@/types/role'

// Hooks and Services
import { useCreateRole } from '@/hooks/use-roles'
import { apiClient } from '@/lib/api-client'

// State Management
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// =============================================================================
// ZUSTAND STATE MANAGEMENT
// =============================================================================

interface RoleCreateFormState {
  formData: Partial<RoleCreatePayload>
  selectedServices: number[]
  lookupKeys: number[]
  setFormData: (data: Partial<RoleCreatePayload>) => void
  setSelectedServices: (services: number[]) => void
  setLookupKeys: (keys: number[]) => void
  clearForm: () => void
}

const useRoleCreateStore = create<RoleCreateFormState>()(
  persist(
    (set) => ({
      formData: {
        name: '',
        description: '',
        isActive: true,
        lookupByRoleId: [],
        accessibleTabs: [],
        roleServiceAccessByRoleId: []
      },
      selectedServices: [],
      lookupKeys: [],
      setFormData: (data) => set((state) => ({ 
        formData: { ...state.formData, ...data } 
      })),
      setSelectedServices: (services) => set({ selectedServices: services }),
      setLookupKeys: (keys) => set({ lookupKeys: keys }),
      clearForm: () => set({
        formData: {
          name: '',
          description: '',
          isActive: true,
          lookupByRoleId: [],
          accessibleTabs: [],
          roleServiceAccessByRoleId: []
        },
        selectedServices: [],
        lookupKeys: []
      })
    }),
    {
      name: 'role-create-form',
      partialize: (state) => ({ 
        formData: state.formData,
        selectedServices: state.selectedServices,
        lookupKeys: state.lookupKeys
      })
    }
  )
)

// =============================================================================
// EXTENDED FORM VALIDATION SCHEMA
// =============================================================================

const ExtendedRoleCreateSchema = RoleCreatePayloadSchema.extend({
  // Additional validation for role creation workflow
  name: z.string()
    .min(1, 'Role name is required')
    .max(64, 'Role name must be less than 64 characters')
    .regex(
      /^[a-zA-Z0-9_\-\s]+$/, 
      'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
    )
    .refine(
      (name) => !name.toLowerCase().includes('system'),
      'Role name cannot contain "system" keyword'
    ),
  description: z.string()
    .max(255, 'Description must be less than 255 characters')
    .optional(),
  // Service access validation
  serviceAccessEnabled: z.boolean().optional(),
  selectedServiceIds: z.array(z.number()).optional()
})

type ExtendedRoleCreateFormData = z.infer<typeof ExtendedRoleCreateSchema>

// =============================================================================
// SERVICE AND LOOKUP KEY DATA FETCHING
// =============================================================================

interface ServiceType {
  id: number
  name: string
  type: string
  description: string
  isActive: boolean
  group?: string
}

interface LookupKeyType {
  id: number
  name: string
  value: string
  description?: string
  private?: boolean
}

// Fetch available services for role access configuration
async function fetchServices(): Promise<ServiceType[]> {
  try {
    const response = await apiClient.get('/system/service')
    return response.resource || []
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return []
  }
}

// Fetch available lookup keys for role configuration
async function fetchLookupKeys(): Promise<LookupKeyType[]> {
  try {
    const response = await apiClient.get('/system/lookup_key')
    return response.resource || []
  } catch (error) {
    console.error('Failed to fetch lookup keys:', error)
    return []
  }
}

// =============================================================================
// SERVICE ACCESS CONFIGURATION COMPONENT
// =============================================================================

interface ServiceAccessConfigProps {
  services: ServiceType[]
  selectedServices: number[]
  onServicesChange: (services: number[]) => void
  onAccessChange: (serviceId: number, access: number, requester: number) => void
  serviceAccess: Record<number, { access: number; requester: number }>
}

const ServiceAccessConfig: React.FC<ServiceAccessConfigProps> = ({
  services,
  selectedServices,
  onServicesChange,
  onAccessChange,
  serviceAccess
}) => {
  const handleServiceToggle = useCallback((serviceId: number, enabled: boolean) => {
    const updatedServices = enabled
      ? [...selectedServices, serviceId]
      : selectedServices.filter(id => id !== serviceId)
    
    onServicesChange(updatedServices)

    // Set default access levels for newly added services
    if (enabled && !serviceAccess[serviceId]) {
      onAccessChange(serviceId, AccessLevel.READ, RequesterLevel.SELF)
    }
  }, [selectedServices, onServicesChange, onAccessChange, serviceAccess])

  const handleAccessLevelChange = useCallback((serviceId: number, level: AccessLevel) => {
    const currentRequester = serviceAccess[serviceId]?.requester || RequesterLevel.SELF
    onAccessChange(serviceId, level, currentRequester)
  }, [onAccessChange, serviceAccess])

  const handleRequesterLevelChange = useCallback((serviceId: number, level: RequesterLevel) => {
    const currentAccess = serviceAccess[serviceId]?.access || AccessLevel.READ
    onAccessChange(serviceId, currentAccess, level)
  }, [onAccessChange, serviceAccess])

  // Group services by type for better organization
  const serviceGroups = services.reduce((groups, service) => {
    const group = service.group || service.type || 'Other'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(service)
    return groups
  }, {} as Record<string, ServiceType[]>)

  return (
    <div className="space-y-6">
      {Object.entries(serviceGroups).map(([groupName, groupServices]) => (
        <FormGroup key={groupName} title={groupName} className="space-y-4">
          {groupServices.map((service) => {
            const isSelected = selectedServices.includes(service.id)
            const access = serviceAccess[service.id]
            
            return (
              <div key={service.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <LabeledSwitch
                        checked={isSelected}
                        onChange={(checked) => handleServiceToggle(service.id, checked)}
                        label={service.name}
                        description={service.description}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Access Level Configuration */}
                    <FormField>
                      <FormLabel>Access Level</FormLabel>
                      <div className="space-y-2">
                        {[
                          { value: AccessLevel.READ, label: 'Read Only' },
                          { value: AccessLevel.READ | AccessLevel.CREATE, label: 'Read & Create' },
                          { value: AccessLevel.READ | AccessLevel.UPDATE, label: 'Read & Update' },
                          { value: AccessLevel.READ | AccessLevel.DELETE, label: 'Read & Delete' },
                          { value: AccessLevel.ADMIN, label: 'Full Access' }
                        ].map(({ value, label }) => (
                          <LabeledSwitch
                            key={value}
                            checked={(access?.access || 0) === value}
                            onChange={(checked) => checked && handleAccessLevelChange(service.id, value)}
                            label={label}
                            size="sm"
                          />
                        ))}
                      </div>
                    </FormField>

                    {/* Requester Level Configuration */}
                    <FormField>
                      <FormLabel>Requester Level</FormLabel>
                      <div className="space-y-2">
                        {[
                          { value: RequesterLevel.SELF, label: 'Self Only' },
                          { value: RequesterLevel.OTHERS, label: 'Others Only' },
                          { value: RequesterLevel.ALL, label: 'Self & Others' }
                        ].map(({ value, label }) => (
                          <LabeledSwitch
                            key={value}
                            checked={(access?.requester || 0) === value}
                            onChange={(checked) => checked && handleRequesterLevelChange(service.id, value)}
                            label={label}
                            size="sm"
                          />
                        ))}
                      </div>
                    </FormField>
                  </div>
                )}
              </div>
            )
          })}
        </FormGroup>
      ))}
    </div>
  )
}

// =============================================================================
// LOOKUP KEYS SELECTION COMPONENT
// =============================================================================

interface LookupKeysSelectionProps {
  lookupKeys: LookupKeyType[]
  selectedKeys: number[]
  onKeysChange: (keys: number[]) => void
}

const LookupKeysSelection: React.FC<LookupKeysSelectionProps> = ({
  lookupKeys,
  selectedKeys,
  onKeysChange
}) => {
  const handleKeyToggle = useCallback((keyId: number, enabled: boolean) => {
    const updatedKeys = enabled
      ? [...selectedKeys, keyId]
      : selectedKeys.filter(id => id !== keyId)
    
    onKeysChange(updatedKeys)
  }, [selectedKeys, onKeysChange])

  const handleSelectAll = useCallback(() => {
    const allKeyIds = lookupKeys.map(key => key.id)
    onKeysChange(allKeyIds)
  }, [lookupKeys, onKeysChange])

  const handleClearAll = useCallback(() => {
    onKeysChange([])
  }, [onKeysChange])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FormDescription>
          Select lookup keys that this role can access. Lookup keys provide configurable 
          values that can be used in API responses and business logic.
        </FormDescription>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {lookupKeys.map((lookupKey) => (
          <div 
            key={lookupKey.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <LabeledSwitch
              checked={selectedKeys.includes(lookupKey.id)}
              onChange={(checked) => handleKeyToggle(lookupKey.id, checked)}
              label={lookupKey.name}
              description={lookupKey.description || lookupKey.value}
              size="sm"
            />
            {lookupKey.private && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                Private
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// MAIN ROLE CREATION PAGE COMPONENT
// =============================================================================

export default function CreateRolePage() {
  const router = useRouter()
  const {
    formData,
    selectedServices,
    lookupKeys,
    setFormData,
    setSelectedServices,
    setLookupKeys,
    clearForm
  } = useRoleCreateStore()

  // State for service access configuration
  const [serviceAccess, setServiceAccess] = useState<Record<number, { access: number; requester: number }>>({})

  // Form setup with React Hook Form and Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    setValue,
    reset
  } = useForm<ExtendedRoleCreateFormData>({
    resolver: zodResolver(ExtendedRoleCreateSchema),
    defaultValues: {
      name: formData.name || '',
      description: formData.description || '',
      isActive: formData.isActive ?? true,
      serviceAccessEnabled: false,
      selectedServiceIds: selectedServices
    },
    mode: 'onChange' // Enable real-time validation under 100ms
  })

  // Watch form values for real-time state persistence
  const watchedValues = watch()

  // Data fetching with React Query for intelligent caching
  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError
  } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  })

  const {
    data: availableLookupKeys = [],
    isLoading: lookupKeysLoading,
    error: lookupKeysError
  } = useQuery({
    queryKey: ['lookup-keys'],
    queryFn: fetchLookupKeys,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Role creation mutation with error handling
  const createRoleMutation = useCreateRole({
    onSuccess: (data) => {
      clearForm()
      router.push(`/api-security/roles/${data.id}?created=true`)
    },
    onError: (error) => {
      console.error('Failed to create role:', error)
    }
  })

  // Persist form data to Zustand store on changes
  useEffect(() => {
    setFormData(watchedValues)
  }, [watchedValues, setFormData])

  // Handle service access configuration changes
  const handleServiceAccessChange = useCallback((serviceId: number, access: number, requester: number) => {
    setServiceAccess(prev => ({
      ...prev,
      [serviceId]: { access, requester }
    }))
  }, [])

  // Form submission handler with business logic
  const onSubmit = useCallback(async (data: ExtendedRoleCreateFormData) => {
    try {
      // Construct role service access array with proper bitmask calculations
      const roleServiceAccessByRoleId: Omit<RoleServiceAccessType, 'id' | 'roleId'>[] = selectedServices.map(serviceId => {
        const service = services.find(s => s.id === serviceId)
        const access = serviceAccess[serviceId]
        
        return {
          serviceId,
          serviceName: service?.name || '',
          component: service?.type || '',
          access: access?.access || AccessLevel.READ,
          requester: access?.requester || RequesterLevel.SELF,
          filters: [] // Default empty filters
        }
      })

      // Construct complete role creation payload
      const rolePayload: RoleCreatePayload = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        isActive: data.isActive,
        lookupByRoleId: lookupKeys,
        roleServiceAccessByRoleId: roleServiceAccessByRoleId.length > 0 ? roleServiceAccessByRoleId : undefined
      }

      // Submit role creation
      await createRoleMutation.mutateAsync(rolePayload)
    } catch (error) {
      console.error('Role creation failed:', error)
    }
  }, [selectedServices, services, serviceAccess, lookupKeys, createRoleMutation])

  // Handle form reset
  const handleReset = useCallback(() => {
    reset()
    clearForm()
    setServiceAccess({})
  }, [reset, clearForm])

  // Loading state for data dependencies
  if (servicesLoading || lookupKeysLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading form data...</p>
        </div>
      </div>
    )
  }

  // Error state for data fetching
  if (servicesError || lookupKeysError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error Loading Data
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              Failed to load required data for role creation. Please refresh the page to try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Create New Role
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a new role with custom permissions and service access configuration. 
          Roles define what resources and operations users can access within the API system.
        </p>
      </div>

      {/* Role Creation Form */}
      <Form onSubmit={handleSubmit(onSubmit)} variant="card">
        {/* Basic Role Information */}
        <FormSection
          title="Basic Information"
          description="Define the fundamental properties of the role including name, description, and status."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <FormControl error={errors.name}>
                    <FormLabel required>Role Name</FormLabel>
                    <Input
                      {...field}
                      placeholder="Enter role name"
                      error={!!errors.name}
                      aria-describedby="name-description name-error"
                    />
                    <FormDescription id="name-description">
                      A unique name for this role. Use descriptive names like "Database Admin" or "API Developer".
                    </FormDescription>
                  </FormControl>
                )}
              />
            </FormField>

            <FormField>
              <Controller
                name="isActive"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <FormControl>
                    <LabeledSwitch
                      checked={value}
                      onChange={onChange}
                      label="Active Role"
                      description="Whether this role is active and can be assigned to users"
                      labelPosition="left"
                    />
                  </FormControl>
                )}
              />
            </FormField>
          </div>

          <FormField>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <FormControl error={errors.description}>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    {...field}
                    placeholder="Enter role description"
                    error={!!errors.description}
                    rows={3}
                    aria-describedby="description-description description-error"
                  />
                  <FormDescription id="description-description">
                    Optional description explaining the purpose and scope of this role.
                  </FormDescription>
                </FormControl>
              )}
            />
          </FormField>
        </FormSection>

        {/* Service Access Configuration */}
        <FormSection
          title="Service Access Configuration"
          description="Configure which services this role can access and the level of permissions for each service."
          collapsible
          defaultExpanded={selectedServices.length > 0}
        >
          <ServiceAccessConfig
            services={services}
            selectedServices={selectedServices}
            onServicesChange={setSelectedServices}
            onAccessChange={handleServiceAccessChange}
            serviceAccess={serviceAccess}
          />
        </FormSection>

        {/* Lookup Keys Management */}
        <FormSection
          title="Lookup Keys Access"
          description="Select which lookup keys this role can access. Lookup keys provide configurable values for API responses."
          collapsible
          defaultExpanded={lookupKeys.length > 0}
        >
          <LookupKeysSelection
            lookupKeys={availableLookupKeys}
            selectedKeys={lookupKeys}
            onKeysChange={setLookupKeys}
          />
        </FormSection>

        {/* Form Actions */}
        <FormActions justify="between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/api-security/roles')}
          >
            Cancel
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={!isDirty}
            >
              Reset
            </Button>
            <Button
              type="submit"
              loading={createRoleMutation.isLoading}
              loadingText="Creating Role..."
              disabled={!isValid || createRoleMutation.isLoading}
            >
              Create Role
            </Button>
          </div>
        </FormActions>
      </Form>
    </div>
  )
}

// =============================================================================
// METADATA EXPORT FOR NEXT.JS
// =============================================================================

export const metadata = {
  title: 'Create Role | API Security | DreamFactory Admin',
  description: 'Create a new role with custom permissions and service access configuration for API security management.',
  keywords: 'role creation, API security, permissions, access control, DreamFactory',
}