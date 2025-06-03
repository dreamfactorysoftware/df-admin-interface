'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useSWR from 'swr';

// Import UI Components (create interfaces for type safety)
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Import Feature Components
import { ScriptEditor } from '@/components/event-scripts/script-editor';
import { LinkService } from '@/components/event-scripts/link-service';

// Import Hooks and API Client
import { useEventScripts } from '@/hooks/use-event-scripts';
import { useStorageServices } from '@/hooks/use-storage-services';
import { apiClient } from '@/lib/api-client';

// Import Types and Validation
import { ScriptObject, ScriptEvent, ScriptEventResponse, AceEditorMode } from '@/types/scripts';
import { Service } from '@/types/services';
import { scriptSchema } from '@/lib/validations/script-schema';

// Import Utilities
import { groupEvents } from '@/lib/data-transform/event-scripts';
import { camelToSnakeString } from '@/lib/utils/case';

// Script Types Configuration (replaces SCRIPT_TYPES constant)
const SCRIPT_TYPES = [
  {
    label: 'Node.js',
    value: AceEditorMode.NODEJS,
    extension: 'js',
  },
  {
    label: 'PHP',
    value: AceEditorMode.PHP,
    extension: 'php',
  },
  {
    label: 'Python',
    value: AceEditorMode.PYTHON,
    extension: 'py',
  },
  {
    label: 'Python 3',
    value: AceEditorMode.PYTHON3,
    extension: 'py',
  },
] as const;

// Form Schema using Zod for validation
const editScriptSchema = scriptSchema.extend({
  name: z.string().min(1, 'Script name is required'),
  type: z.nativeEnum(AceEditorMode),
  content: z.string().optional(),
  storageServiceId: z.union([z.number(), z.null()]).optional(),
  storagePath: z.string().optional(),
  isActive: z.boolean().default(false),
  allow_event_modification: z.boolean().default(false),
});

type EditScriptFormData = z.infer<typeof editScriptSchema>;

interface EventScriptPageProps {
  params: {
    name: string;
  };
}

/**
 * Next.js dynamic route page component for editing individual event scripts.
 * Implements React Hook Form with Zod validation, SWR data fetching, and comprehensive
 * script editing workflow. Replaces Angular DfScriptDetailsComponent edit functionality
 * with React 19 server components and modern patterns.
 * 
 * @param props - Page props containing dynamic route parameters
 * @returns JSX element for the script editing page
 */
export default function EventScriptEditPage({ params }: EventScriptPageProps) {
  const router = useRouter();
  const { name: scriptName } = params;
  
  // Decode script name from URL (handles URL encoding)
  const decodedScriptName = useMemo(() => decodeURIComponent(scriptName), [scriptName]);

  // State for script selection workflow (create mode)
  const [selectedServiceItem, setSelectedServiceItem] = useState<string>('');
  const [selectedEventItem, setSelectedEventItem] = useState<string>('');
  const [selectedRouteItem, setSelectedRouteItem] = useState<string>('');
  const [selectTable, setSelectTable] = useState<string>('');
  const [tableProcedureFlag, setTableProcedureFlag] = useState<string>('');
  const [completeScriptName, setCompleteScriptName] = useState<string>('');
  const [ungroupedEventItems, setUngroupedEventItems] = useState<string[]>([]);
  const [ungroupedRouteOptions, setUngroupedRouteOptions] = useState<string[]>([]);
  const [tableOptions, setTableOptions] = useState<string[]>([]);
  const [ungroupedEventOptions, setUngroupedEventOptions] = useState<any>({});
  const [scriptEvents, setScriptEvents] = useState<ScriptEvent[]>([]);
  const [unGroupedEvents, setUnGroupedEvents] = useState<ScriptEventResponse>({});
  const [storageServices, setStorageServices] = useState<Service[]>([]);
  const [storeServiceArray, setStoreServiceArray] = useState<string[]>([]);

  // Data fetching hooks
  const { data: scriptDetails, error: scriptError, mutate: mutateScript } = useSWR(
    decodedScriptName ? `/api/v2/script/${encodeURIComponent(decodedScriptName)}` : null,
    apiClient.get,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry on 404 - script doesn't exist yet
        if (error?.status === 404) return;
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 1000 * Math.pow(2, retryCount));
      },
    }
  );

  const { data: eventScriptsData } = useSWR('/api/v2/script/event', apiClient.get);
  const { storageServices: storageServicesData } = useStorageServices();

  // Initialize React Hook Form with Zod validation
  const form = useForm<EditScriptFormData>({
    resolver: zodResolver(editScriptSchema),
    defaultValues: {
      name: '',
      type: AceEditorMode.NODEJS,
      content: '',
      storageServiceId: null,
      storagePath: '',
      isActive: false,
      allow_event_modification: false,
    },
    mode: 'onChange', // Real-time validation under 100ms
  });

  const { handleSubmit, formState: { isSubmitting, errors }, watch, setValue, reset } = form;

  // Watch form values for reactive updates
  const watchedType = watch('type');
  const watchedContent = watch('content');
  const watchedStorageServiceId = watch('storageServiceId');
  const watchedStoragePath = watch('storagePath');

  // Determine if we're in edit mode (script exists) or create mode
  const isEditMode = !!(scriptDetails && !scriptError);

  // Effect to populate form when script data is loaded (edit mode)
  useEffect(() => {
    if (scriptDetails && isEditMode) {
      // Transform data from snake_case to camelCase for form
      const editData = Object.keys(scriptDetails).reduce(
        (acc, cur) => ({
          ...acc,
          [camelToSnakeString(cur)]: scriptDetails[cur],
        }),
        {}
      );

      // Ensure isActive is properly set
      const formData = {
        ...editData,
        name: scriptDetails.name,
        isActive: scriptDetails.isActive || false,
        allow_event_modification: scriptDetails.allowEventModification || false,
      };

      reset(formData);
      setCompleteScriptName(scriptDetails.name);
    }
  }, [scriptDetails, isEditMode, reset]);

  // Effect to initialize event scripts data for create mode
  useEffect(() => {
    if (eventScriptsData && !isEditMode) {
      setScriptEvents(groupEvents(eventScriptsData));
      setUnGroupedEvents(eventScriptsData);
    }
  }, [eventScriptsData, isEditMode]);

  // Effect to initialize storage services data
  useEffect(() => {
    if (storageServicesData) {
      setStorageServices(storageServicesData);
      setStoreServiceArray(storageServicesData.map(service => service.name));
    }
  }, [storageServicesData]);

  // Event handlers for script creation workflow
  const handleSelectedServiceItemEvent = () => {
    setUngroupedEventItems([]);
    setUngroupedRouteOptions([]);
    setSelectedRouteItem('');
    
    let serviceType = selectedServiceItem;
    if (serviceType === 'api_docs') {
      serviceType = 'apiDocs';
    }
    
    const eventOptions = unGroupedEvents[serviceType];
    setUngroupedEventOptions(eventOptions);
    
    if (eventOptions) {
      setUngroupedEventItems(Object.keys(eventOptions));
    }
  };

  const handleSelectedEventItemEvent = () => {
    const eventOptions = ungroupedEventOptions[selectedEventItem];
    if (!eventOptions) return;

    setUngroupedRouteOptions([...eventOptions.endpoints]);
    
    const data = eventOptions.parameter;
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      const paramKey = Object.keys(data)[0];
      
      if (paramKey === 'tableName') {
        setTableProcedureFlag('table');
        setTableOptions([...data.tableName]);
      } else if (paramKey === 'procedureName') {
        setTableProcedureFlag('procedure');
        setTableOptions([...data.procedureName]);
      } else if (paramKey === 'functionName') {
        setTableProcedureFlag('function');
        setTableOptions([...data.functionName]);
      }
    }
  };

  const handleSelectedTable = () => {
    const newScriptName = selectedRouteItem.replace('{table_name}', selectTable);
    setCompleteScriptName(newScriptName);
  };

  const handleSelectedRoute = () => {
    let newScriptName = selectedRouteItem;
    if (selectTable) {
      newScriptName = newScriptName.replace('{table_name}', selectTable);
    }
    setCompleteScriptName(newScriptName);
  };

  // Navigation handler
  const handleGoBack = () => {
    router.push('/adf-event-scripts');
  };

  // Form submission handler
  const onSubmit = async (data: EditScriptFormData) => {
    try {
      const scriptItem = {
        ...data,
        storageServiceId: 
          data.storageServiceId && typeof data.storageServiceId === 'object' && 'type' in data.storageServiceId
            ? (data.storageServiceId as any).type === 'local_file' 
              ? (data.storageServiceId as any).id 
              : null
            : data.storageServiceId,
        storage_path:
          data.storageServiceId && typeof data.storageServiceId === 'object' && 'type' in data.storageServiceId
            ? (data.storageServiceId as any).type === 'local_file'
              ? data.storagePath
              : null
            : data.storagePath,
        name: isEditMode ? decodedScriptName : (completeScriptName || selectedRouteItem),
      };

      if (isEditMode) {
        // Update existing script (PATCH/PUT operation for edit mode)
        await apiClient.put(`/api/v2/script/${encodeURIComponent(decodedScriptName)}`, scriptItem);
        await mutateScript(); // Revalidate cache
      } else {
        // Create new script
        await apiClient.post('/api/v2/script', scriptItem, {
          params: { name: scriptItem.name },
        });
      }

      // Navigate back to scripts list
      handleGoBack();
    } catch (error) {
      console.error('Error saving script:', error);
      // Error handling will be managed by global error handler
    }
  };

  // Loading states
  if (!isEditMode && !eventScriptsData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Event Script' : 'Create Event Script'}
          </h1>
          {isEditMode && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Editing script: {decodedScriptName}
            </p>
          )}
        </div>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Create Mode Fields - Service Selection Workflow */}
            {!isEditMode && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <FormControl>
                        <Select 
                          value={selectedServiceItem} 
                          onValueChange={(value) => {
                            setSelectedServiceItem(value);
                            setTimeout(handleSelectedServiceItemEvent, 0);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            {storeServiceArray.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {ungroupedEventItems.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Script Type</FormLabel>
                      <FormControl>
                        <Select 
                          value={selectedEventItem} 
                          onValueChange={(value) => {
                            setSelectedEventItem(value);
                            setTimeout(handleSelectedEventItemEvent, 0);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select script type" />
                          </SelectTrigger>
                          <SelectContent>
                            {ungroupedEventItems.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Script Method</FormLabel>
                      <FormControl>
                        <Select 
                          value={selectedRouteItem} 
                          onValueChange={(value) => {
                            setSelectedRouteItem(value);
                            setTimeout(handleSelectedRoute, 0);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select script method" />
                          </SelectTrigger>
                          <SelectContent>
                            {ungroupedRouteOptions.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  </div>
                )}

                {tableOptions.length > 0 && (
                  <FormItem>
                    <FormLabel>
                      {tableProcedureFlag === 'table' ? 'Table Name' : 'Name'}
                    </FormLabel>
                    <FormControl>
                      <Select 
                        value={selectTable} 
                        onValueChange={(value) => {
                          setSelectTable(value);
                          setTimeout(handleSelectedTable, 0);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${tableProcedureFlag === 'table' ? 'table' : 'name'}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {tableOptions.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}

                {completeScriptName && (
                  <FormItem>
                    <FormLabel>Script Name</FormLabel>
                    <FormControl>
                      <Input 
                        value={completeScriptName} 
                        disabled
                        className="bg-gray-50 dark:bg-gray-700"
                      />
                    </FormControl>
                  </FormItem>
                )}
              </>
            )}

            {/* Edit Mode - Script Name Field (Read-only) */}
            {isEditMode && (
              <FormItem>
                <FormLabel>Script Name</FormLabel>
                <FormControl>
                  <Input 
                    value={decodedScriptName} 
                    disabled
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                </FormControl>
              </FormItem>
            )}

            {/* Script Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Script Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select script type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCRIPT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Script Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Enable this script
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Active script"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allow_event_modification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Event Modification</FormLabel>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Allow event modification
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Allow event modification"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Storage Service Configuration */}
            <LinkService
              cache={isEditMode ? decodedScriptName : completeScriptName}
              storageServiceId={selectedServiceItem}
              storagePath={form.register('storagePath')}
              content={form.register('content')}
            />

            {/* Script Editor */}
            <div className="space-y-2">
              <FormLabel>Script Content</FormLabel>
              <ScriptEditor
                cache={isEditMode ? decodedScriptName : completeScriptName}
                type={form.register('type')}
                storageServiceId={form.register('storageServiceId')}
                storagePath={form.register('storagePath')}
                content={form.register('content')}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoBack}
                disabled={isSubmitting}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (isEditMode ? false : !completeScriptName)}
                className="px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Script'
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}