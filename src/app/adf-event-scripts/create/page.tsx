/**
 * Event Script Creation Page
 * 
 * Next.js page component for creating new event scripts in the DreamFactory Admin Interface.
 * Replaces the Angular DfScriptDetailsComponent create mode with React Hook Form validation,
 * Headless UI components, Tailwind CSS styling, and React Query data fetching.
 * 
 * Features:
 * - React Hook Form with Zod schema validation
 * - Real-time validation under 100ms
 * - Headless UI components with Tailwind CSS styling
 * - SWR/React Query for intelligent caching
 * - WCAG 2.1 AA compliance
 * - Server-side rendering with SSR under 2 seconds
 * - Comprehensive error handling and loading states
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Form, 
  FormField, 
  FormLabel, 
  FormDescription, 
  FormControl,
  FormErrorMessage,
  FormSection,
  FormActions
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectOption } from '@/components/ui/select';
import { Switch, LabeledSwitch } from '@/components/ui/switch';
import { ScriptEditor } from '@/components/event-scripts/script-editor';
import { LinkService } from '@/components/event-scripts/link-service';
import { 
  scriptSchema, 
  type ScriptFormData,
  validateScriptField,
  validateScriptNameUnique 
} from '@/lib/validations/script-schema';
import { 
  useCreateScript, 
  useScriptEvents, 
  useScriptNameAvailability 
} from '@/hooks/use-event-scripts';
import { useStorageServices } from '@/hooks/use-storage-services';
import { 
  ScriptType, 
  SCRIPT_TYPE_DEFINITIONS,
  AceEditorMode 
} from '@/types/scripts';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface PageState {
  selectedService: string;
  selectedEvent: string;
  selectedRoute: string;
  selectedTable: string;
  completeName: string;
  isDirty: boolean;
}

// ============================================================================
// EVENT SCRIPT CREATE PAGE COMPONENT
// ============================================================================

export default function CreateEventScriptPage() {
  const router = useRouter();
  
  // Local state for service/event selection
  const [pageState, setPageState] = useState<PageState>({
    selectedService: '',
    selectedEvent: '',
    selectedRoute: '',
    selectedTable: '',
    completeName: '',
    isDirty: false
  });
  
  // Data fetching hooks
  const { data: scriptEvents, isLoading: eventsLoading, error: eventsError } = useScriptEvents();
  const { data: storageServices, isLoading: servicesLoading } = useStorageServices();
  const createScriptMutation = useCreateScript();
  
  // Form setup with React Hook Form and Zod validation
  const form = useForm<ScriptFormData>({
    resolver: zodResolver(scriptSchema),
    defaultValues: {
      name: '',
      type: 'nodejs',
      content: '',
      storageServiceId: undefined,
      storagePath: '',
      isActive: true,
      allowEventModification: false,
      config: {}
    },
    mode: 'onChange' // Enable real-time validation
  });
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, isValid, isDirty, isSubmitting },
    trigger,
    clearErrors
  } = form;
  
  // Watch form values for real-time updates
  const watchedName = watch('name');
  const watchedType = watch('type');
  const watchedContent = watch('content');
  const watchedStorageServiceId = watch('storageServiceId');
  
  // Check script name availability
  const { data: nameAvailable, isLoading: checkingName } = useScriptNameAvailability(
    watchedName,
    { enabled: !!watchedName && watchedName.length > 0 }
  );
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Storage service options for select
  const storageServiceOptions: SelectOption[] = React.useMemo(() => {
    if (!storageServices) return [];
    
    return [
      { value: '', label: 'No storage service', description: 'Store script in database only' },
      ...storageServices.map(service => ({
        value: service.id.toString(),
        label: `${service.label} (${service.type})`,
        description: service.description || `${service.type} storage service`,
        disabled: !service.isActive
      }))
    ];
  }, [storageServices]);
  
  // Script type options for select
  const scriptTypeOptions: SelectOption[] = React.useMemo(() => {
    return SCRIPT_TYPE_DEFINITIONS.map(typeDef => ({
      value: typeDef.value,
      label: typeDef.label,
      description: `${typeDef.extension} files`
    }));
  }, []);
  
  // Selected storage service details
  const selectedStorageService = React.useMemo(() => {
    if (!watchedStorageServiceId || !storageServices) return null;
    return storageServices.find(s => s.id === Number(watchedStorageServiceId));
  }, [watchedStorageServiceId, storageServices]);
  
  // Check if we should show storage path field
  const showStoragePath = Boolean(selectedStorageService?.type === 'local_file');
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  // Handle service selection changes
  const handleServiceChange = useCallback((service: string) => {
    setPageState(prev => ({
      ...prev,
      selectedService: service,
      selectedEvent: '',
      selectedRoute: '',
      selectedTable: '',
      completeName: '',
      isDirty: true
    }));
  }, []);
  
  const handleEventChange = useCallback((event: string) => {
    setPageState(prev => ({
      ...prev,
      selectedEvent: event,
      selectedRoute: '',
      selectedTable: '',
      completeName: '',
      isDirty: true
    }));
  }, []);
  
  const handleRouteChange = useCallback((route: string) => {
    setPageState(prev => ({
      ...prev,
      selectedRoute: route,
      selectedTable: '',
      completeName: '',
      isDirty: true
    }));
  }, []);
  
  const handleTableChange = useCallback((table: string) => {
    setPageState(prev => ({
      ...prev,
      selectedTable: table,
      isDirty: true
    }));
  }, []);
  
  const handleCompleteNameChange = useCallback((name: string) => {
    setPageState(prev => ({ ...prev, completeName: name }));
    
    // Auto-fill script name if not manually entered
    if (!watchedName || !pageState.isDirty) {
      setValue('name', name);
      trigger('name'); // Trigger validation
    }
  }, [watchedName, setValue, trigger, pageState.isDirty]);
  
  // Handle script content changes
  const handleContentChange = useCallback((content: string) => {
    setValue('content', content);
    trigger('content');
    setPageState(prev => ({ ...prev, isDirty: true }));
  }, [setValue, trigger]);
  
  // Handle script type changes
  const handleTypeChange = useCallback((value: string | number | (string | number)[]) => {
    const type = Array.isArray(value) ? value[0] as ScriptType : value as ScriptType;
    setValue('type', type);
    trigger('type');
    
    // Clear content when type changes to avoid confusion
    if (watchedContent) {
      setValue('content', '');
      trigger('content');
    }
  }, [setValue, trigger, watchedContent]);
  
  // Handle storage service changes
  const handleStorageServiceChange = useCallback((value: string | number | (string | number)[]) => {
    const serviceId = Array.isArray(value) ? value[0] : value;
    setValue('storageServiceId', serviceId ? Number(serviceId) : undefined);
    trigger('storageServiceId');
    
    // Clear storage path when service changes
    setValue('storagePath', '');
    trigger('storagePath');
  }, [setValue, trigger]);
  
  // Handle form submission
  const handleFormSubmit = useCallback(async (data: ScriptFormData) => {
    try {
      // Final validation
      if (!nameAvailable && nameAvailable !== undefined) {
        toast.error('Script name is already taken');
        return;
      }
      
      // Prepare submission data
      const submissionData: ScriptFormData = {
        ...data,
        name: data.name || pageState.completeName,
        storageServiceId: selectedStorageService?.type === 'local_file' ? data.storageServiceId : undefined,
        storagePath: selectedStorageService?.type === 'local_file' ? data.storagePath : undefined
      };
      
      // Submit the script
      await createScriptMutation.mutateAsync(submissionData);
      
      // Show success message
      toast.success('Event script created successfully');
      
      // Navigate back to scripts list
      router.push('/adf-event-scripts');
      
    } catch (error) {
      console.error('Failed to create script:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create script');
    }
  }, [
    nameAvailable, 
    pageState.completeName, 
    selectedStorageService, 
    createScriptMutation, 
    router
  ]);
  
  // Handle navigation back
  const handleCancel = useCallback(() => {
    if (isDirty || pageState.isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push('/adf-event-scripts');
      }
    } else {
      router.push('/adf-event-scripts');
    }
  }, [isDirty, pageState.isDirty, router]);
  
  // ============================================================================
  // LOADING AND ERROR STATES
  // ============================================================================
  
  if (eventsLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading script configuration...</p>
        </div>
      </div>
    );
  }
  
  if (eventsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-semibold mb-2">Failed to load script events</p>
          <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
  
  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Create Event Script
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create a new event script that will execute when specific API events occur
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
      
      <Form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
        {/* Service and Event Configuration */}
        <FormSection
          title="Event Configuration"
          description="Configure which service and event will trigger this script"
        >
          {scriptEvents && (
            <LinkService
              selectedService={pageState.selectedService}
              selectedEvent={pageState.selectedEvent}
              selectedRoute={pageState.selectedRoute}
              selectedTable={pageState.selectedTable}
              onServiceChange={handleServiceChange}
              onEventChange={handleEventChange}
              onRouteChange={handleRouteChange}
              onTableChange={handleTableChange}
              onCompleteNameChange={handleCompleteNameChange}
              scriptEvents={scriptEvents}
              storageServices={storageServices || []}
              disabled={isSubmitting}
            />
          )}
        </FormSection>
        
        {/* Script Configuration */}
        <FormSection
          title="Script Configuration"
          description="Configure the basic properties of your event script"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Script Name */}
            <FormField>
              <FormLabel required>
                Script Name
              </FormLabel>
              <FormDescription>
                Unique identifier for your script
              </FormDescription>
              <FormControl error={errors.name}>
                <Input
                  {...register('name')}
                  placeholder="Enter script name..."
                  disabled={isSubmitting}
                  error={!!errors.name}
                  rightIcon={checkingName ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  ) : nameAvailable === false ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : nameAvailable === true ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                />
              </FormControl>
              {nameAvailable === false && (
                <FormErrorMessage error="Script name is already taken" />
              )}
            </FormField>
            
            {/* Script Type */}
            <FormField>
              <FormLabel required>
                Script Type
              </FormLabel>
              <FormDescription>
                Programming language for your script
              </FormDescription>
              <FormControl error={errors.type}>
                <Select
                  value={watchedType}
                  onChange={handleTypeChange}
                  options={scriptTypeOptions}
                  disabled={isSubmitting}
                  error={!!errors.type}
                />
              </FormControl>
            </FormField>
          </div>
          
          {/* Script Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LabeledSwitch
              {...register('isActive')}
              checked={watch('isActive')}
              onChange={(checked) => setValue('isActive', checked)}
              label="Active"
              description="Enable or disable this script"
              disabled={isSubmitting}
            />
            
            <LabeledSwitch
              {...register('allowEventModification')}
              checked={watch('allowEventModification')}
              onChange={(checked) => setValue('allowEventModification', checked)}
              label="Allow Event Modification"
              description="Allow script to modify event data"
              disabled={isSubmitting}
            />
          </div>
        </FormSection>
        
        {/* Storage Configuration */}
        <FormSection
          title="Storage Configuration"
          description="Configure where your script content will be stored"
          collapsible
          defaultExpanded={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storage Service */}
            <FormField>
              <FormLabel>
                Storage Service
              </FormLabel>
              <FormDescription>
                Optional: Store script in external storage
              </FormDescription>
              <FormControl error={errors.storageServiceId}>
                <Select
                  value={watchedStorageServiceId?.toString() || ''}
                  onChange={handleStorageServiceChange}
                  options={storageServiceOptions}
                  disabled={isSubmitting}
                  error={!!errors.storageServiceId}
                />
              </FormControl>
            </FormField>
            
            {/* Storage Path */}
            {showStoragePath && (
              <FormField>
                <FormLabel required={!!selectedStorageService}>
                  Storage Path
                </FormLabel>
                <FormDescription>
                  Path where script will be stored
                </FormDescription>
                <FormControl error={errors.storagePath}>
                  <Input
                    {...register('storagePath')}
                    placeholder="scripts/events/"
                    disabled={isSubmitting}
                    error={!!errors.storagePath}
                  />
                </FormControl>
              </FormField>
            )}
          </div>
        </FormSection>
        
        {/* Script Content */}
        <FormSection
          title="Script Content"
          description="Write your event script code"
        >
          <FormField>
            <FormLabel required>
              Script Code
            </FormLabel>
            <FormDescription>
              Write your script content using {SCRIPT_TYPE_DEFINITIONS.find(d => d.value === watchedType)?.label || watchedType}
            </FormDescription>
            <FormControl error={errors.content}>
              <ScriptEditor
                value={watchedContent}
                onChange={handleContentChange}
                language={watchedType}
                height={500}
                readOnly={isSubmitting}
                placeholder={`// Start writing your ${watchedType} script here...`}
                autoFocus
              />
            </FormControl>
          </FormField>
        </FormSection>
        
        {/* Form Actions */}
        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Creating Script..."
            disabled={!isValid || isSubmitting || (nameAvailable === false)}
          >
            Create Script
          </Button>
        </FormActions>
      </Form>
    </div>
  );
}

// ============================================================================
// METADATA FOR NEXT.JS
// ============================================================================

export const metadata = {
  title: 'Create Event Script - DreamFactory Admin',
  description: 'Create a new event script for DreamFactory API events',
};