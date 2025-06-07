'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useSWR from 'swr';
import { z } from 'zod';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Feature Components
import { ScriptEditor } from '@/components/event-scripts/script-editor';
import { LinkService } from '@/components/event-scripts/link-service';

// Hooks and Services
import { useEventScript, useEventScripts } from '@/hooks/use-event-scripts';
import { useStorageServices } from '@/hooks/use-storage-services';
import { apiClient } from '@/lib/api-client';

// Types
interface ScriptObject {
  name: string;
  type: string;
  content: string;
  isActive: boolean;
  allowEventModification: boolean;
  storageServiceId?: number;
  scmRepository?: string;
  scmReference?: string;
  storagePath?: string;
  config?: any;
  createdById?: number;
  createdDate?: string;
  lastModifiedById?: number;
  lastModifiedDate?: string;
}

interface Service {
  id: number;
  name: string;
  label: string;
  type: string;
  description?: string;
  isActive: boolean;
}

enum AceEditorMode {
  JSON = 'json',
  YAML = 'yaml',
  TEXT = 'text',
  NODEJS = 'nodejs',
  PHP = 'php',
  PYTHON = 'python',
  PYTHON3 = 'python3',
  JAVASCRIPT = 'javascript',
}

// Script validation schema
const scriptSchema = z.object({
  name: z.string().min(1, 'Script name is required'),
  type: z.enum(['nodejs', 'php', 'python', 'python3'], {
    required_error: 'Script type is required',
  }),
  content: z.string().optional(),
  isActive: z.boolean().default(false),
  allowEventModification: z.boolean().default(false),
  storageServiceId: z.number().optional(),
  storagePath: z.string().optional(),
});

type ScriptFormData = z.infer<typeof scriptSchema>;

// Script types configuration
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

// Loading skeleton component
function ScriptFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Error display component
interface ScriptErrorProps {
  error: Error;
  onRetry: () => void;
}

function ScriptError({ error, onRetry }: ScriptErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load script: {error.message}</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Main page component
export default function ScriptEditPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure script name is properly decoded
  const scriptName = useMemo(() => {
    if (typeof params.name === 'string') {
      return decodeURIComponent(params.name);
    }
    return '';
  }, [params.name]);

  // Data fetching with SWR
  const {
    data: script,
    error: scriptError,
    isLoading: isLoadingScript,
    mutate: mutateScript,
  } = useSWR(
    scriptName ? `/api/v2/system/event/${scriptName}` : null,
    apiClient.get,
    {
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const {
    data: storageServices,
    error: servicesError,
    isLoading: isLoadingServices,
  } = useSWR('/api/v2/system/service?group=File', apiClient.get, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  // Form setup with React Hook Form and Zod validation
  const form = useForm<ScriptFormData>({
    resolver: zodResolver(scriptSchema),
    defaultValues: {
      name: '',
      type: 'nodejs',
      content: '',
      isActive: false,
      allowEventModification: false,
      storageServiceId: undefined,
      storagePath: '',
    },
    mode: 'onChange', // Real-time validation under 100ms
  });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-populate form with script data when loaded
  useEffect(() => {
    if (script && mounted) {
      const formData: ScriptFormData = {
        name: script.name || scriptName,
        type: script.type || 'nodejs',
        content: script.content || '',
        isActive: script.isActive || false,
        allowEventModification: script.allowEventModification || false,
        storageServiceId: script.storageServiceId,
        storagePath: script.storagePath || '',
      };

      form.reset(formData);
    }
  }, [script, form, scriptName, mounted]);

  // Handle form submission
  const onSubmit = async (data: ScriptFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare script data for update (PATCH/PUT operation)
      const scriptData = {
        ...data,
        name: scriptName, // Ensure name remains the original (read-only)
        storageServiceId: data.storageServiceId || null,
        storagePath: data.storageServiceId ? data.storagePath : null,
      };

      // Update script using PUT request
      await apiClient.put(`/api/v2/system/event/${scriptName}`, scriptData);

      // Revalidate the script data
      mutateScript();

      toast.success('Script updated successfully');
      
      // Navigate back to scripts list
      router.push('/adf-event-scripts');
    } catch (error) {
      console.error('Failed to update script:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update script. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation back
  const handleGoBack = () => {
    router.push('/adf-event-scripts');
  };

  // Loading state
  if (!mounted || isLoadingScript || isLoadingServices) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <ScriptFormSkeleton />
      </div>
    );
  }

  // Error state
  if (scriptError) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Edit Script
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Edit event script configuration and content
          </p>
        </div>
        <ScriptError 
          error={scriptError} 
          onRetry={() => mutateScript()} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Script
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Edit event script configuration and content
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {scriptName}
          </Badge>
        </div>
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Script Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Script Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Script Name (Read-only in edit mode) */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={scriptName}
                        disabled={true}
                        className="bg-gray-50 dark:bg-gray-800"
                        aria-label="Script name (read-only)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Script Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Script Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      aria-label="Select script type"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select script type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCRIPT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Toggle switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Active
                        </FormLabel>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Enable or disable this script
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Toggle script active status"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowEventModification"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Allow Event Modification
                        </FormLabel>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Allow script to modify event data
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Toggle event modification permission"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage Service Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkService
                formControl={form.control}
                storageServices={storageServices?.resource || []}
                cache={scriptName}
                aria-label="Configure storage service settings"
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Script Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Script Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ScriptEditor
                formControl={form.control}
                cache={scriptName}
                storageServices={storageServices?.resource || []}
                aria-label="Edit script content"
                className="min-h-[400px]"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGoBack}
              disabled={isSubmitting}
              aria-label="Cancel editing and go back"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.formState.isValid}
              aria-label="Save script changes"
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Script'
              )}
            </Button>
          </div>
        </form>
      </FormProvider>

      {/* Development info (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-8 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              Development Info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 space-y-2">
            <p>Script Name: {scriptName}</p>
            <p>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</p>
            <p>Form Dirty: {form.formState.isDirty ? 'Yes' : 'No'}</p>
            <p>
              Errors: {Object.keys(form.formState.errors).length || 'None'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}