/**
 * Application Details Form Component
 * 
 * React functional component that manages the create and edit form for application
 * entities in the adf-apps feature. Implements React Hook Form with Zod validation
 * for real-time form validation under 100ms, integrates SWR/React Query for API
 * operations with cache hit responses under 50ms, uses Headless UI components with
 * Tailwind CSS styling, and provides API key generation, clipboard operations,
 * and navigation using Next.js patterns.
 * 
 * Replaces Angular standalone component while maintaining all existing functionality
 * for application CRUD operations.
 * 
 * @fileoverview Application details form component for create/edit workflows
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import { 
  InfoIcon,
  CopyIcon, 
  RefreshCwIcon,
  ArrowLeftIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';

// Type imports
import type { 
  AppType, 
  AppPayload, 
  APP_TYPES,
  AppFormData,
  transformPayloadToApi 
} from '@/types/apps';
import type { RoleType } from '@/types/role';

// Schema and validation
import { 
  AppFormSchema, 
  type AppFormFieldNames,
  validateAppForm,
  getRequiredFieldsForType,
  transformFormDataToPayload
} from './df-app-details.schema';

// API and hooks
import { apiGet, apiPost, apiPut, API_ENDPOINTS } from '@/lib/api-client';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useTheme } from '@/hooks/use-theme';

// UI Components
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Application location type options for radio group
 */
const APP_LOCATION_OPTIONS = [
  {
    value: '0',
    label: 'No Storage',
    description: 'Application without file storage'
  },
  {
    value: '1', 
    label: 'File Storage',
    description: 'Application hosted on file service'
  },
  {
    value: '3',
    label: 'Web Server',
    description: 'Application on web server path'
  },
  {
    value: '2',
    label: 'Remote URL',
    description: 'Application hosted at remote URL'
  }
] as const;

/**
 * Storage service options for file storage applications
 */
const STORAGE_SERVICE_OPTIONS = [
  { value: 3, label: 'File Service' },
  { value: 4, label: 'Log Service' }
] as const;

/**
 * Default form values for new applications
 */
const DEFAULT_FORM_VALUES: Partial<AppFormData> = {
  name: '',
  description: '',
  type: 0,
  role_id: undefined,
  is_active: true,
  storage_service_id: 3,
  storage_container: 'applications',
  path: '',
  url: '',
};

/**
 * Performance configuration
 */
const PERFORMANCE_CONFIG = {
  validationDelay: 100, // ms - validation under 100ms requirement
  debounceDelay: 300, // ms - debounce for API calls
  cacheStaleTime: 30000, // 30s - SWR cache stale time
  cacheDedupingInterval: 5000, // 5s - SWR deduping interval
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate API key for applications
 */
async function generateApiKey(host: string, appName: string): Promise<string> {
  // Simple API key generation (matches original functionality)
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2, 15);
  const combined = `${host}-${appName}-${timestamp}-${randomString}`;
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `df_api_${Math.abs(hash).toString(36)}_${randomString}`;
}

/**
 * Copy text to clipboard with error handling
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get application launch URL based on form data
 */
function getAppLocationUrl(formData: AppFormData, origin: string): string {
  const appLocation = formData.type.toString();
  
  let url = origin;
  
  if (appLocation === '1' && formData.storage_service_id === 3) {
    url += '/file/';
  } else if (appLocation === '1' && formData.storage_service_id === 4) {
    url += '/log/';
  }
  
  if (appLocation === '1' && formData.storage_container) {
    url += formData.storage_container + '/';
  }
  
  if (formData.path && (appLocation === '1' || appLocation === '3')) {
    url += formData.path;
  }
  
  return url.replace(/\/+/g, '/').replace(/\/$/, '');
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook for fetching roles data with caching
 */
function useRoles() {
  return useSWR(
    'roles',
    () => apiGet<{ resource: RoleType[] }>(`${API_ENDPOINTS.SYSTEM_ROLE}?fields=*&limit=1000`),
    {
      dedupingInterval: PERFORMANCE_CONFIG.cacheDedupingInterval,
      focusThrottleInterval: PERFORMANCE_CONFIG.cacheStaleTime,
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );
}

/**
 * Hook for fetching app data with caching
 */
function useAppData(appId: string | null) {
  return useSWR(
    appId ? ['app', appId] : null,
    () => apiGet<AppType>(`${API_ENDPOINTS.SYSTEM_APP}/${appId}?related=role_by_role_id`),
    {
      dedupingInterval: PERFORMANCE_CONFIG.cacheDedupingInterval,
      focusThrottleInterval: PERFORMANCE_CONFIG.cacheStaleTime,
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Application Details Form Component
 */
export default function DfAppDetails() {
  // ==========================================================================
  // HOOKS AND STATE
  // ==========================================================================

  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();
  const { resolvedTheme } = useTheme();
  
  // Get app ID from URL parameters
  const appId = searchParams.get('id');
  const isEditMode = Boolean(appId);
  
  // Fetch data
  const { data: rolesData, error: rolesError, isLoading: rolesLoading } = useRoles();
  const { data: appData, error: appError, isLoading: appLoading } = useAppData(appId);
  
  // Local state
  const [alertState, setAlertState] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>({
    show: false,
    type: 'error',
    message: '',
  });
  
  const [urlOrigin] = useState(() => 
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  // ==========================================================================
  // FORM SETUP
  // ==========================================================================

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty, isValid }
  } = useForm<AppFormData>({
    resolver: zodResolver(AppFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: true,
  });

  // Watch form values for reactive updates
  const watchedValues = watch();
  const appLocationType = watchedValues.type?.toString();

  // ==========================================================================
  // API MUTATIONS
  // ==========================================================================

  const createAppMutation = useApiMutation({
    mutationFn: async (data: AppPayload) => {
      return apiPost<{ resource: AppType[] }>(
        API_ENDPOINTS.SYSTEM_APP,
        { resource: [data] },
        {
          fields: '*',
          related: 'role_by_role_id',
          snackbarSuccess: 'Application created successfully',
        }
      );
    },
    onSuccess: () => {
      mutate('apps'); // Invalidate apps list cache
      goBack();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to create application';
      triggerAlert('error', errorMessage);
    },
  });

  const updateAppMutation = useApiMutation({
    mutationFn: async (data: { id: string; payload: Partial<AppPayload> }) => {
      return apiPut<AppType>(
        `${API_ENDPOINTS.SYSTEM_APP}/${data.id}`,
        data.payload,
        {
          snackbarSuccess: 'Application updated successfully',
        }
      );
    },
    onSuccess: () => {
      mutate(['app', appId]); // Invalidate specific app cache
      mutate('apps'); // Invalidate apps list cache
      goBack();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to update application';
      triggerAlert('error', errorMessage);
    },
  });

  const refreshApiKeyMutation = useApiMutation({
    mutationFn: async (data: { id: string; apiKey: string }) => {
      return apiPut<AppType>(
        `${API_ENDPOINTS.SYSTEM_APP}/${data.id}`,
        { apiKey: data.apiKey }
      );
    },
    onSuccess: (data) => {
      mutate(['app', appId]); // Invalidate app cache to refresh data
    },
    onError: (error) => {
      triggerAlert('error', 'Failed to refresh API key');
    },
  });

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const roles = useMemo(() => rolesData?.resource || [], [rolesData]);
  const editApp = useMemo(() => appData || null, [appData]);
  
  const isLoading = rolesLoading || (isEditMode && appLoading);
  const hasError = rolesError || (isEditMode && appError);
  
  const requiredFields = useMemo(() => 
    getRequiredFieldsForType(watchedValues.type || 0), 
    [watchedValues.type]
  );

  const appLocationUrl = useMemo(() => {
    if (appLocationType === '1' || appLocationType === '3') {
      return getAppLocationUrl(watchedValues, urlOrigin);
    }
    return '';
  }, [watchedValues, urlOrigin, appLocationType]);

  const disableKeyRefresh = useMemo(() => {
    return !editApp || editApp.createdById === null;
  }, [editApp]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Initialize form with existing app data in edit mode
   */
  useEffect(() => {
    if (isEditMode && editApp) {
      reset({
        name: editApp.name,
        description: editApp.description || '',
        type: editApp.type,
        role_id: editApp.roleByRoleId?.id,
        is_active: editApp.isActive,
        storage_service_id: editApp.storageServiceId,
        storage_container: editApp.storageContainer || 'applications',
        path: editApp.path || '',
        url: editApp.url || '',
      });
    }
  }, [isEditMode, editApp, reset]);

  /**
   * Handle conditional validation based on app location type
   */
  useEffect(() => {
    const type = watchedValues.type;
    
    // Update validation based on type changes
    if (type === 2) { // URL
      // URL is required, path is not
      setValue('path', '');
    } else if (type === 3) { // Web Server
      // Path is required, URL is not
      setValue('url', '');
    } else if (type === 0) { // No Storage
      // Clear all storage-related fields
      setValue('path', '');
      setValue('url', '');
      setValue('storage_service_id', 3);
      setValue('storage_container', 'applications');
    }
  }, [watchedValues.type, setValue]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Show alert message
   */
  const triggerAlert = useCallback((type: typeof alertState.type, message: string) => {
    setAlertState({
      show: true,
      type,
      message,
    });
  }, []);

  /**
   * Hide alert message
   */
  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, show: false }));
  }, []);

  /**
   * Navigate back to apps list
   */
  const goBack = useCallback(() => {
    router.push('/adf-apps');
  }, [router]);

  /**
   * Copy API key to clipboard
   */
  const copyApiKey = useCallback(async () => {
    if (!editApp?.apiKey) return;
    
    const success = await copyToClipboard(editApp.apiKey);
    if (success) {
      triggerAlert('success', 'API key copied to clipboard');
    } else {
      triggerAlert('error', 'Failed to copy API key');
    }
  }, [editApp?.apiKey, triggerAlert]);

  /**
   * Copy app URL to clipboard
   */
  const copyAppUrl = useCallback(async () => {
    const success = await copyToClipboard(appLocationUrl);
    if (success) {
      triggerAlert('success', 'URL copied to clipboard');
    } else {
      triggerAlert('error', 'Failed to copy URL');
    }
  }, [appLocationUrl, triggerAlert]);

  /**
   * Refresh API key
   */
  const refreshApiKey = useCallback(async () => {
    if (!editApp || !editApp.id || disableKeyRefresh) return;
    
    try {
      const newKey = await generateApiKey(urlOrigin, getValues('name'));
      refreshApiKeyMutation.mutate({
        id: editApp.id.toString(),
        apiKey: newKey,
      });
    } catch (error) {
      triggerAlert('error', 'Failed to generate new API key');
    }
  }, [editApp, disableKeyRefresh, urlOrigin, getValues, refreshApiKeyMutation, triggerAlert]);

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(async (data: AppFormData) => {
    try {
      const payload = transformFormDataToPayload(data);
      
      if (isEditMode && editApp) {
        updateAppMutation.mutate({
          id: editApp.id.toString(),
          payload,
        });
      } else {
        createAppMutation.mutate(payload);
      }
    } catch (error) {
      triggerAlert('error', 'Failed to save application');
    }
  }, [isEditMode, editApp, updateAppMutation, createAppMutation, triggerAlert]);

  /**
   * Filter roles based on input
   */
  const filterRoles = useCallback((query: string) => {
    if (!query.trim()) return roles;
    
    const lowercaseQuery = query.toLowerCase();
    return roles.filter(role =>
      role.name.toLowerCase().includes(lowercaseQuery)
    );
  }, [roles]);

  // ==========================================================================
  // LOADING AND ERROR STATES
  // ==========================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4">
        <Alert type="error">
          Failed to load {isEditMode ? 'application' : 'form'} data. Please try again.
        </Alert>
      </div>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={`min-h-screen bg-background ${resolvedTheme === 'dark' ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Apps
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditMode ? 'Edit Application' : 'Create Application'}
          </h1>
        </div>

        {/* Alert */}
        {alertState.show && (
          <div className="mb-6">
            <Alert
              type={alertState.type}
              onClose={hideAlert}
            >
              {alertState.message}
            </Alert>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Application Name */}
          <FormField
            label="Application Name"
            required
            error={errors.name?.message}
            tooltip="Unique name for this application"
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter application name"
                  className="w-full"
                />
              )}
            />
          </FormField>

          {/* Default Role */}
          <FormField
            label="Default Role"
            error={errors.role_id?.message}
            tooltip="Default role for application users"
          >
            <Controller
              name="role_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  value={field.value ? roles.find(r => r.id === field.value) : null}
                  onChange={(role) => field.onChange(role?.id)}
                  options={roles}
                  filterFunction={filterRoles}
                  displayValue={(role) => role?.name || ''}
                  placeholder="Select a role"
                  className="w-full"
                />
              )}
            />
          </FormField>

          {/* Description */}
          <FormField
            label="Description"
            error={errors.description?.message}
            tooltip="Optional description for this application"
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter application description"
                  className="w-full"
                />
              )}
            />
          </FormField>

          {/* Active Toggle */}
          <FormField
            label="Active"
            tooltip="Whether this application is currently active"
          >
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="ml-0"
                />
              )}
            />
          </FormField>

          {/* API Key Card (Edit Mode Only) */}
          {isEditMode && editApp && (
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">API Key</h3>
                <div className="break-all text-sm font-mono bg-muted p-3 rounded border">
                  {editApp.apiKey}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyApiKey}
                    className="flex items-center gap-2"
                  >
                    <CopyIcon className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={refreshApiKey}
                    disabled={disableKeyRefresh || refreshApiKeyMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* App Location */}
          <FormField
            label="Application Location"
            required
            error={errors.type?.message}
            tooltip="Where is this application hosted?"
          >
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value?.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  className="space-y-3"
                >
                  {APP_LOCATION_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroup.Item value={option.value} id={option.value} />
                      <label 
                        htmlFor={option.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
          </FormField>

          {/* Conditional Fields Based on App Location */}
          {appLocationType === '1' && (
            <>
              {/* Storage Service */}
              <FormField
                label="Storage Service"
                required
                error={errors.storage_service_id?.message}
                tooltip="Which storage service to use"
              >
                <Controller
                  name="storage_service_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      value={STORAGE_SERVICE_OPTIONS.find(s => s.value === field.value)}
                      onChange={(service) => field.onChange(service?.value)}
                      options={STORAGE_SERVICE_OPTIONS}
                      displayValue={(service) => service?.label || ''}
                      placeholder="Select storage service"
                      className="w-full"
                    />
                  )}
                />
              </FormField>

              {/* Storage Container */}
              <FormField
                label="Storage Folder"
                required
                error={errors.storage_container?.message}
                tooltip="Folder name in the storage service"
              >
                <Controller
                  name="storage_container"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="applications"
                      className="w-full"
                    />
                  )}
                />
              </FormField>
            </>
          )}

          {/* Path field for File Storage and Web Server */}
          {(appLocationType === '1' || appLocationType === '3') && (
            <FormField
              label={appLocationType === '1' ? 'Launch Path' : 'Path to App'}
              required
              error={errors.path?.message}
              tooltip={appLocationType === '1' ? 'Path to the launch file' : 'Path on web server'}
            >
              <Controller
                name="path"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder={appLocationType === '1' ? 'index.html' : '/path/to/app'}
                    className="w-full"
                  />
                )}
              />
            </FormField>
          )}

          {/* URL field for Remote URL */}
          {appLocationType === '2' && (
            <FormField
              label="Remote URL"
              required
              error={errors.url?.message}
              tooltip="Full URL to the remote application"
            >
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="https://example.com/app"
                    className="w-full"
                  />
                )}
              />
            </FormField>
          )}

          {/* Generated URL Display */}
          {(appLocationType === '1' || appLocationType === '3') && appLocationUrl && (
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Application URL</h3>
                <div className="break-all text-sm font-mono bg-muted p-3 rounded border">
                  {appLocationUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyAppUrl}
                  className="flex items-center gap-2"
                >
                  <CopyIcon className="h-4 w-4" />
                  Copy URL
                </Button>
              </div>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
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
              disabled={isSubmitting || !isValid}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                isEditMode ? 'Save' : 'Create'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}