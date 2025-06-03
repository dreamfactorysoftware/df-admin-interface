'use client'

/**
 * Database Service Creation Page
 * 
 * Main Next.js page component for the database service creation workflow.
 * Implements a multi-step wizard interface using React Hook Form with Zod validation,
 * enabling users to select database types, configure connection parameters, test
 * connectivity, and save service configurations.
 * 
 * Features:
 * - Multi-step wizard with validation
 * - Database type selection (MySQL, PostgreSQL, SQL Server, MongoDB, Oracle, Snowflake)
 * - Connection parameter configuration with real-time validation
 * - Connection testing with SWR caching
 * - Paywall integration for premium features
 * - Next.js SSR compatibility
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useSWR from 'swr'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// UI Components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import { Toggle } from '@/components/ui/toggle'
import { Dialog } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

// Database Service Components
import { DatabaseServiceWizard } from '@/components/database-service/service-wizard'
import { PaywallModal } from '@/components/database-service/paywall-modal'
import { PageHeader } from '@/components/ui/page-header'
import { ConnectionTest } from '@/components/database-service/connection-test'

// Hooks and Utilities
import { useAuth } from '@/hooks/use-auth'
import { usePaywall } from '@/hooks/use-paywall'
import { useNotifications } from '@/hooks/use-notifications'
import { useLoading } from '@/hooks/use-loading'
import { useSystemConfig } from '@/hooks/use-system-config'
import { apiClient } from '@/lib/api-client'

// Types
import type { 
  DatabaseServiceConfig, 
  ServiceType, 
  ServiceCreationStep,
  DatabaseType 
} from '@/types/service'

// Constants
const SUPPORTED_DATABASE_TYPES: DatabaseType[] = [
  'mysql',
  'postgresql', 
  'sqlserver',
  'mongodb',
  'oracle',
  'snowflake'
]

// Zod Validation Schema
const serviceCreationSchema = z.object({
  type: z.string().min(1, 'Database type is required'),
  name: z.string()
    .min(1, 'Service name is required')
    .max(64, 'Service name must be 64 characters or less')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Service name must start with a letter and contain only letters, numbers, and underscores'),
  label: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  config: z.object({
    host: z.string().min(1, 'Host is required'),
    port: z.number().min(1).max(65535),
    database: z.string().min(1, 'Database name is required'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    options: z.record(z.any()).optional(),
    ssl: z.boolean().default(false),
    timeout: z.number().min(1).max(300).default(30),
  }).refine((data) => {
    // Custom validation for specific database types
    return true
  }, {
    message: 'Invalid configuration for selected database type'
  })
})

type ServiceCreationForm = z.infer<typeof serviceCreationSchema>

/**
 * Database Service Creation Page Component
 */
export default function CreateServicePage() {
  // Next.js router
  const router = useRouter()
  
  // Form management
  const form = useForm<ServiceCreationForm>({
    resolver: zodResolver(serviceCreationSchema),
    defaultValues: {
      type: '',
      name: '',
      label: '',
      description: '',
      isActive: true,
      config: {
        host: '',
        port: 3306,
        database: '',
        username: '',
        password: '',
        options: {},
        ssl: false,
        timeout: 30,
      }
    },
    mode: 'onChange'
  })

  // State management
  const [currentStep, setCurrentStep] = useState<ServiceCreationStep>('type-selection')
  const [selectedType, setSelectedType] = useState<string>('')
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Hooks
  const { user, isAuthenticated } = useAuth()
  const { checkFeatureAccess, openPaywall } = usePaywall()
  const { addNotification } = useNotifications()
  const { setLoading } = useLoading()
  const queryClient = useQueryClient()

  // System configuration
  const { data: systemConfig, isLoading: configLoading } = useSystemConfig()
  
  // Service types query with license filtering
  const { data: serviceTypes = [], isLoading: typesLoading } = useQuery({
    queryKey: ['service-types', 'database'],
    queryFn: async () => {
      const response = await apiClient.get('/system/service_type')
      const allTypes = response.resource || []
      
      // Filter for database types only
      const databaseTypes = allTypes.filter((type: ServiceType) => 
        type.group === 'Database' && 
        SUPPORTED_DATABASE_TYPES.includes(type.name.toLowerCase() as DatabaseType)
      )

      // Apply license filtering
      if (systemConfig?.platform?.license === 'OPEN SOURCE') {
        return databaseTypes.filter((type: ServiceType) => 
          !type.premium && !type.gold
        )
      } else if (systemConfig?.platform?.license === 'SILVER') {
        return databaseTypes.filter((type: ServiceType) => !type.gold)
      }
      
      return databaseTypes
    },
    enabled: !!systemConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })

  // Connection test with SWR
  const { data: connectionStatus, error: connectionError, mutate: testConnection } = useSWR(
    currentStep === 'connection-test' && form.formState.isValid 
      ? ['connection-test', form.getValues().config] 
      : null,
    async ([, config]) => {
      const testData = {
        type: selectedType,
        config: config
      }
      
      const response = await apiClient.post('/system/service/_test', testData)
      return response
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  )

  // Service creation mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceCreationForm) => {
      const serviceData = {
        ...data,
        config: {
          ...data.config,
          // Transform camelCase to snake_case for API
          driver_name: selectedType,
        }
      }
      
      const response = await apiClient.post('/system/service', serviceData)
      return response
    },
    onSuccess: (data) => {
      addNotification({
        type: 'success',
        title: 'Service Created',
        message: `Database service "${data.name}" has been created successfully.`
      })
      
      // Invalidate service list cache
      queryClient.invalidateQueries({ queryKey: ['services'] })
      
      // Navigate to service details or list
      router.push(`/adf-services/df-service-details/${data.id}`)
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Service Creation Failed',
        message: error.message || 'Failed to create database service. Please try again.'
      })
    }
  })

  // Filter service types based on search
  const filteredServiceTypes = serviceTypes.filter((type: ServiceType) =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle type selection
  const handleTypeSelection = useCallback((type: string) => {
    // Check if premium feature access is required
    const serviceType = serviceTypes.find((st: ServiceType) => st.name === type)
    
    if (serviceType?.premium || serviceType?.gold) {
      const hasAccess = checkFeatureAccess(serviceType.premium ? 'premium' : 'gold')
      if (!hasAccess) {
        setPaywallOpen(true)
        return
      }
    }

    setSelectedType(type)
    form.setValue('type', type)
    form.setValue('label', serviceType?.label || type)
    
    // Update port default based on database type
    const defaultPorts: Record<string, number> = {
      mysql: 3306,
      postgresql: 5432,
      sqlserver: 1433,
      mongodb: 27017,
      oracle: 1521,
      snowflake: 443
    }
    
    form.setValue('config.port', defaultPorts[type.toLowerCase()] || 3306)
    
    setCurrentStep('service-details')
  }, [serviceTypes, checkFeatureAccess, form])

  // Handle form submission
  const handleSubmit = useCallback(async (data: ServiceCreationForm) => {
    setLoading(true)
    
    try {
      await createServiceMutation.mutateAsync(data)
    } finally {
      setLoading(false)
    }
  }, [createServiceMutation, setLoading])

  // Handle step navigation
  const handleNextStep = useCallback(() => {
    const currentValues = form.getValues()
    
    switch (currentStep) {
      case 'type-selection':
        if (currentValues.type) {
          setCurrentStep('service-details')
        }
        break
      case 'service-details':
        if (currentValues.name && currentValues.type) {
          setCurrentStep('configuration')
        }
        break
      case 'configuration':
        if (form.formState.isValid) {
          setCurrentStep('connection-test')
        }
        break
      case 'connection-test':
        if (connectionStatus?.success) {
          setCurrentStep('review')
        }
        break
      case 'review':
        form.handleSubmit(handleSubmit)()
        break
    }
  }, [currentStep, form, connectionStatus, handleSubmit])

  const handlePreviousStep = useCallback(() => {
    switch (currentStep) {
      case 'service-details':
        setCurrentStep('type-selection')
        break
      case 'configuration':
        setCurrentStep('service-details')
        break
      case 'connection-test':
        setCurrentStep('configuration')
        break
      case 'review':
        setCurrentStep('connection-test')
        break
    }
  }, [currentStep])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/adf-services/df-service-details/create')
    }
  }, [isAuthenticated, router])

  // Loading state for initial data
  if (configLoading || typesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
        <span className="ml-3 text-lg">Loading service configuration...</span>
      </div>
    )
  }

  // Authentication check
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <PageHeader
        title="Create Database Service"
        description="Set up a new database service connection to generate REST APIs"
        breadcrumbs={[
          { label: 'Services', href: '/adf-services' },
          { label: 'Database Services', href: '/adf-services/df-service-details' },
          { label: 'Create', href: '/adf-services/df-service-details/create' }
        ]}
      />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <DatabaseServiceWizard
            currentStep={currentStep}
            serviceTypes={filteredServiceTypes}
            selectedType={selectedType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onTypeSelect={handleTypeSelection}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            onTestConnection={() => testConnection()}
            isSubmitting={createServiceMutation.isLoading}
          />

          {/* Paywall Modal */}
          <PaywallModal 
            isOpen={paywallOpen}
            onClose={() => setPaywallOpen(false)}
            feature="premium-database-services"
            title="Premium Database Services"
            description="Unlock advanced database connectors including Oracle, MongoDB, and Snowflake with a premium license."
          />
        </form>
      </FormProvider>
    </div>
  )
}

/**
 * Loading Component for Suspense Boundary
 */
function CreateServicePageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-md w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-8"></div>
        
        <div className="space-y-6">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}

/**
 * Page with Suspense Wrapper for SSR Compatibility
 */
export function CreateServicePageWrapper() {
  return (
    <Suspense fallback={<CreateServicePageSkeleton />}>
      <CreateServicePage />
    </Suspense>
  )
}