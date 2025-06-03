'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import useSWR, { mutate } from 'swr'
import { 
  ApplicationFormSchema, 
  DEFAULT_APPLICATION_FORM,
  transformFormToPayload,
  transformPayloadToForm,
  type ApplicationForm,
  type ApplicationPayload,
  type RoleSelection
} from './df-app-details.schema'
import { useTheme } from '@/hooks/use-theme'
import { apiClient } from '@/lib/api-client'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { AppType, AppPayload } from '@/types/apps'
import { RoleType } from '@/types/role'

// UI Components (these would be imported from actual components when they exist)
// For now, using basic implementations with Tailwind styling
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
import { Alert } from '@/components/ui/alert'
import { Combobox } from '@/components/ui/combobox'
import { RadioGroup } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'

// Icons
import { 
  InformationCircleIcon, 
  ClipboardDocumentIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Utility functions for API key generation
const generateApiKey = async (host: string, appName: string): Promise<string> => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const combined = `${host}-${appName}-${timestamp}-${randomStr}`
  
  // Use Web Crypto API for generating hash
  const encoder = new TextEncoder()
  const data = encoder.encode(combined)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// API endpoints
const APPS_ENDPOINT = '/apps'
const ROLES_ENDPOINT = '/system/roles'

// Main component interface
interface DfAppDetailsProps {
  /** Optional app ID for edit mode - passed via URL params or props */
  appId?: string | number
  /** Optional roles data for autocomplete - if not provided, will fetch via SWR */
  initialRoles?: RoleType[]
  /** Callback function called after successful save operation */
  onSaveSuccess?: (app: AppType) => void
  /** Callback function called when user cancels/navigates back */
  onCancel?: () => void
}

/**
 * DfAppDetailsComponent - React functional component for application entity management
 * 
 * Replaces Angular DfAppDetailsComponent with modern React patterns:
 * - React Hook Form with Zod validation for forms
 * - SWR/React Query for intelligent caching and data fetching
 * - Headless UI components with Tailwind CSS styling
 * - Next.js navigation and middleware-based authentication
 * - Zustand state management for theme and global state
 * 
 * Supports both create and edit modes for application entities,
 * maintaining all existing functionality from the Angular version
 * while providing enhanced performance and developer experience.
 */
export default function DfAppDetailsComponent({
  appId,
  initialRoles,
  onSaveSuccess,
  onCancel
}: DfAppDetailsProps) {
  // Next.js hooks for navigation and URL params
  const router = useRouter()
  const searchParams = useSearchParams()
  const editAppId = appId || searchParams.get('id')
  const isEditMode = Boolean(editAppId)
  
  // Theme management using Zustand-based theme hook
  const { isDark } = useTheme()
  
  // Local state for UI interactions
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('error')
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle')
  
  // URL origin for app location calculation
  const urlOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  // SWR data fetching for roles with cache optimization
  const { 
    data: rolesData, 
    error: rolesError, 
    isLoading: rolesLoading 
  } = useSWR<{ resource: RoleType[] }>(
    ROLES_ENDPOINT, 
    apiClient.get,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 minutes deduplication
      fallbackData: initialRoles ? { resource: initialRoles } : undefined,
      onError: (error) => {
        console.error('Failed to load roles:', error)
        triggerAlert('error', 'Failed to load roles. Please refresh the page.')
      }
    }
  )

  // SWR data fetching for application data in edit mode
  const { 
    data: appData, 
    error: appError, 
    isLoading: appLoading 
  } = useSWR<AppType>(
    isEditMode ? `${APPS_ENDPOINT}/${editAppId}` : null,
    apiClient.get,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2 * 60 * 1000, // 2 minutes deduplication
      onError: (error) => {
        console.error('Failed to load application:', error)
        triggerAlert('error', 'Failed to load application data. Please try again.')
      }
    }
  )

  // Extract roles from API response
  const roles = useMemo(() => rolesData?.resource || [], [rolesData])

  // React Hook Form setup with Zod validation
  const form = useForm<ApplicationForm>({
    resolver: zodResolver(ApplicationFormSchema),
    defaultValues: DEFAULT_APPLICATION_FORM,
    mode: 'onTouched', // Real-time validation on touch for under 100ms response
    criteriaMode: 'all' // Show all validation errors
  })

  const { 
    register, 
    handleSubmit, 
    control, 
    watch, 
    formState: { errors, isSubmitting, isDirty, isValid },
    setValue,
    reset,
    getValues
  } = form

  // Watch appLocation for conditional field validation
  const watchedAppLocation = watch('appLocation')

  // API mutations using custom hook with SWR cache integration
  const createMutation = useApiMutation({
    mutationFn: async (payload: ApplicationPayload) => {
      const response = await apiClient.post(APPS_ENDPOINT, { 
        resource: [payload] 
      }, {
        headers: {
          'X-Request-ID': `create-app-${Date.now()}`
        }
      })
      return response.resource[0]
    },
    onSuccess: (data) => {
      triggerAlert('success', 'Application created successfully!')
      // Invalidate related cache entries
      mutate(APPS_ENDPOINT)
      onSaveSuccess?.(data)
      // Navigate back after short delay to show success message
      setTimeout(() => goBack(), 1500)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.context?.resource?.[0]?.message 
        || error?.message 
        || 'Failed to create application'
      triggerAlert('error', message)
    }
  })

  const updateMutation = useApiMutation({
    mutationFn: async (payload: ApplicationPayload) => {
      const response = await apiClient.put(`${APPS_ENDPOINT}/${editAppId}`, payload, {
        headers: {
          'X-Request-ID': `update-app-${editAppId}-${Date.now()}`
        }
      })
      return response
    },
    onSuccess: (data) => {
      triggerAlert('success', 'Application updated successfully!')
      // Invalidate related cache entries
      mutate(APPS_ENDPOINT)
      mutate(`${APPS_ENDPOINT}/${editAppId}`)
      onSaveSuccess?.(data)
      // Navigate back after short delay to show success message
      setTimeout(() => goBack(), 1500)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message 
        || error?.message 
        || 'Failed to update application'
      triggerAlert('error', message)
    }
  })

  // Initialize form with application data in edit mode
  useEffect(() => {
    if (isEditMode && appData && roles.length > 0) {
      const formData = transformPayloadToForm(appData, roles)
      reset(formData)
    }
  }, [isEditMode, appData, roles, reset])

  // Utility function for triggering alerts
  const triggerAlert = useCallback((type: typeof alertType, message: string) => {
    setAlertType(type)
    setAlertMessage(message)
    setShowAlert(true)
    
    // Auto-hide success alerts after 3 seconds
    if (type === 'success') {
      setTimeout(() => setShowAlert(false), 3000)
    }
  }, [])

  // Navigation helper
  const goBack = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }, [router, onCancel])

  // Generate application URL based on current form values
  const getAppLocationUrl = useCallback((): string => {
    const values = getValues()
    const { appLocation, storageServiceId, storageContainer, path } = values

    const baseUrl = urlOrigin
    
    if (appLocation === '1') {
      // File storage
      let servicePath = ''
      if (storageServiceId === 3) servicePath = 'file/'
      if (storageServiceId === 4) servicePath = 'log/'
      
      return `${baseUrl}/${servicePath}${storageContainer}/${path}`.replace(/\/+/g, '/')
    }
    
    if (appLocation === '3') {
      // Web server
      return `${baseUrl}${path}`.replace(/\/+/g, '/')
    }
    
    return baseUrl
  }, [urlOrigin, getValues])

  // Copy to clipboard functionality with status feedback
  const copyToClipboard = useCallback(async (text: string, label: string = 'text') => {
    setCopyStatus('copying')
    
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('success')
      triggerAlert('success', `${label} copied to clipboard!`)
      
      // Reset copy status after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch (error) {
      setCopyStatus('error')
      triggerAlert('error', `Failed to copy ${label}. Please try again.`)
      console.error('Copy to clipboard failed:', error)
      
      // Reset copy status after 2 seconds
      setTimeout(() => setCopyStatus('idle'), 2000)
    }
  }, [triggerAlert])

  // API key refresh functionality
  const refreshApiKey = useCallback(async () => {
    if (!appData || !isEditMode) return

    setIsGeneratingKey(true)
    
    try {
      const newKey = await generateApiKey(urlOrigin, getValues('name'))
      
      const response = await apiClient.put(`${APPS_ENDPOINT}/${editAppId}`, {
        apiKey: newKey
      })
      
      // Update local cache
      mutate(`${APPS_ENDPOINT}/${editAppId}`, { ...appData, apiKey: newKey }, false)
      
      triggerAlert('success', 'API key refreshed successfully!')
    } catch (error) {
      triggerAlert('error', 'Failed to refresh API key. Please try again.')
      console.error('API key refresh failed:', error)
    } finally {
      setIsGeneratingKey(false)
    }
  }, [appData, isEditMode, urlOrigin, getValues, editAppId, triggerAlert])

  // Form submission handler
  const onSubmit = useCallback(async (data: ApplicationForm) => {
    try {
      const payload = transformFormToPayload(data)
      
      if (isEditMode) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
    } catch (error) {
      // Error handling is done in mutation callbacks
      console.error('Form submission error:', error)
    }
  }, [isEditMode, updateMutation, createMutation])

  // Role filtering for autocomplete
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
  const filteredRoles = useMemo(() => {
    if (!roleSearchTerm) return roles
    
    return roles.filter(role =>
      role.name.toLowerCase().includes(roleSearchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(roleSearchTerm.toLowerCase())
    )
  }, [roles, roleSearchTerm])

  // Loading state
  const isLoading = appLoading || rolesLoading

  // Error state handling
  if (rolesError && !rolesData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert type="error" className="max-w-md">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Failed to load required data</h3>
            <p className="text-sm">Please refresh the page to try again.</p>
          </div>
        </Alert>
      </div>
    )
  }

  if (isEditMode && appError && !appData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert type="error" className="max-w-md">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">Application not found</h3>
            <p className="text-sm">The requested application could not be loaded.</p>
            <Button 
              onClick={goBack} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Go Back
            </Button>
          </div>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`${isDark ? 'dark' : ''} w-full max-w-4xl mx-auto p-6 space-y-6`}>
      {/* Alert Display */}
      {showAlert && (
        <Alert 
          type={alertType}
          onClose={() => setShowAlert(false)}
          className="mb-6"
        >
          {alertMessage}
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading {isEditMode ? 'application' : 'form'}...
          </span>
        </div>
      )}

      {/* Main Form */}
      {!isLoading && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Application Name Field */}
          <FormField 
            label="Application Name"
            required
            error={errors.name?.message}
            tooltip="Enter a unique name for your application. This will be used to identify the app in the admin interface."
          >
            <Input
              {...register('name')}
              placeholder="Enter application name"
              disabled={isSubmitting}
              className="w-full"
            />
          </FormField>

          {/* Default Role Field */}
          <FormField 
            label="Default Role"
            error={errors.defaultRole?.message}
            tooltip="Select a default role for users accessing this application. This role will be applied automatically."
          >
            <Controller
              name="defaultRole"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value}
                  onChange={field.onChange}
                  onSearchChange={setRoleSearchTerm}
                  options={filteredRoles}
                  displayValue={(role: RoleSelection) => role?.name || ''}
                  placeholder="Select a role"
                  disabled={isSubmitting}
                  className="w-full"
                />
              )}
            />
          </FormField>

          {/* Description Field */}
          <FormField 
            label="Description"
            error={errors.description?.message}
            tooltip="Provide a brief description of what this application does."
          >
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Enter application description"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </FormField>

          {/* Active Toggle */}
          <FormField label="Active Status">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  label="Application is active"
                />
              )}
            />
          </FormField>

          {/* API Key Card (Edit Mode Only) */}
          {isEditMode && appData && (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    API Key
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(appData.apiKey, 'API key')}
                      disabled={copyStatus === 'copying'}
                      className="flex items-center space-x-1"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      <span>Copy</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={refreshApiKey}
                      disabled={isGeneratingKey || appData.createdById === null}
                      className="flex items-center space-x-1"
                    >
                      <ArrowPathIcon className={`w-4 h-4 ${isGeneratingKey ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border font-mono text-sm break-all">
                  {appData.apiKey}
                </div>
                {appData.createdById === null && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    API key refresh is disabled for system-created applications.
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* App Location Configuration */}
          <div className="space-y-4">
            <FormField 
              label="Application Location"
              error={errors.appLocation?.message}
              tooltip="Choose where your application is hosted and how users will access it."
            >
              <Controller
                name="appLocation"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    options={[
                      { value: '0', label: 'No Specific Storage', description: 'Application does not require file storage' },
                      { value: '1', label: 'File Storage', description: 'Application files are stored in the DreamFactory file system' },
                      { value: '3', label: 'Web Server Path', description: 'Application is accessible via a web server path' },
                      { value: '2', label: 'Remote URL', description: 'Application is hosted externally and accessed via URL' }
                    ]}
                    className="space-y-3"
                  />
                )}
              />
            </FormField>

            {/* Conditional Fields Based on App Location */}
            {(watchedAppLocation === '1' || watchedAppLocation === '2' || watchedAppLocation === '3') && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                
                {/* Storage Service Selection (File Storage Only) */}
                {watchedAppLocation === '1' && (
                  <FormField 
                    label="Storage Service"
                    error={errors.storageServiceId?.message}
                    tooltip="Select the storage service where your application files are located."
                  >
                    <Controller
                      name="storageServiceId"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={isSubmitting}
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value={3}>File Service</option>
                          <option value={4}>Log Service</option>
                        </select>
                      )}
                    />
                  </FormField>
                )}

                {/* Storage Container (File Storage Only) */}
                {watchedAppLocation === '1' && (
                  <FormField 
                    label="Storage Folder"
                    error={errors.storageContainer?.message}
                    tooltip="Specify the folder name where your application files are stored."
                  >
                    <Input
                      {...register('storageContainer')}
                      placeholder="applications"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </FormField>
                )}

                {/* Path Field (File Storage and Web Server) */}
                {(watchedAppLocation === '1' || watchedAppLocation === '3') && (
                  <FormField 
                    label={watchedAppLocation === '1' ? 'Launch Path' : 'Path to Application'}
                    error={errors.path?.message}
                    tooltip={
                      watchedAppLocation === '1' 
                        ? 'Specify the relative path to your application\'s main file (e.g., index.html).'
                        : 'Specify the absolute path where your application is accessible (must start with /).'
                    }
                  >
                    <Input
                      {...register('path')}
                      placeholder={watchedAppLocation === '1' ? 'index.html' : '/path/to/app'}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </FormField>
                )}

                {/* URL Field (Remote URL Only) */}
                {watchedAppLocation === '2' && (
                  <FormField 
                    label="Remote URL"
                    error={errors.url?.message}
                    tooltip="Enter the complete URL where your application is hosted."
                  >
                    <Input
                      {...register('url')}
                      placeholder="https://example.com/myapp"
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </FormField>
                )}

                {/* Generated URL Preview */}
                {(watchedAppLocation === '1' || watchedAppLocation === '3') && (
                  <Card className="p-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Generated Application URL
                      </h4>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border text-sm break-all font-mono">
                        {getAppLocationUrl()}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(getAppLocationUrl(), 'Application URL')}
                        disabled={copyStatus === 'copying'}
                        className="flex items-center space-x-1"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        <span>Copy URL</span>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty || !isValid}
              className="flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isEditMode ? 'Save Changes' : 'Create Application'}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

/**
 * Export component for use in Next.js App Router
 * Supports both direct import and lazy loading patterns
 */
export { DfAppDetailsComponent }