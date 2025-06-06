/**
 * Role Creation Page Component
 * 
 * Main role creation page component that provides a comprehensive form interface
 * for creating new roles with service access configuration and lookup key management.
 * Transforms the Angular DfRoleDetailsComponent create mode into a React/Next.js
 * server component with React Hook Form, Zod validation, and Tailwind CSS styling.
 * 
 * @fileoverview Role creation page implementation
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Role-specific components
import { RoleServiceAccess } from '@/components/roles/role-service-access';
import { LookupKeys } from '@/components/ui/lookup-keys';

// Hooks and Types
import { useNotifications } from '@/hooks/use-notifications';
import { apiPost } from '@/lib/api-client';
import type { CreateRoleData, RoleServiceAccess as RoleServiceAccessType, RoleLookup } from '@/types/role';

// ============================================================================
// Validation Schema
// ============================================================================

/**
 * Service access form validation schema
 */
const ServiceAccessSchema = z.object({
  id: z.number().optional(),
  serviceId: z.number().min(1, 'Service is required'),
  component: z.string().optional(),
  access: z.array(z.number()).min(1, 'At least one access type is required'),
  requester: z.array(z.number()).min(1, 'At least one requester type is required'),
  advancedFilters: z.array(z.object({
    expandField: z.string().optional(),
    expandOperator: z.string().optional(),
    expandValue: z.string().optional(),
    filterOp: z.string().optional(),
  })).default([]),
  extendField: z.string().optional(),
  extendOperator: z.string().optional(),
  extendValue: z.string().optional(),
  filterOp: z.string().optional(),
});

/**
 * Lookup key form validation schema
 */
const LookupKeySchema = z.object({
  name: z.string().min(1, 'Lookup key name is required'),
  value: z.string().optional(),
  private: z.boolean().default(false),
  description: z.string().optional(),
});

/**
 * Main role creation form validation schema
 */
const CreateRoleSchema = z.object({
  name: z.string()
    .min(1, 'Role name is required')
    .max(64, 'Role name must be less than 64 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, underscores, and hyphens'),
  description: z.string()
    .max(255, 'Description must be less than 255 characters')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  serviceAccess: z.array(ServiceAccessSchema).default([]),
  lookupKeys: z.array(LookupKeySchema).default([]),
});

type CreateRoleFormData = z.infer<typeof CreateRoleSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert access array to verbMask bitmask
 */
function calculateVerbMask(accessArray: number[]): number {
  return accessArray.reduce((mask, value) => mask + value, 0);
}

/**
 * Convert requester array to requestorMask bitmask
 */
function calculateRequestorMask(requesterArray: number[]): number {
  return requesterArray.reduce((mask, value) => mask + value, 0);
}

/**
 * Transform form data to API payload
 */
function transformToApiPayload(formData: CreateRoleFormData): CreateRoleData {
  return {
    name: formData.name,
    description: formData.description || '',
    isActive: formData.isActive,
    roleServiceAccess: formData.serviceAccess?.map((access) => ({
      serviceId: access.serviceId,
      component: access.component || '',
      verbMask: calculateVerbMask(access.access),
      requestorMask: calculateRequestorMask(access.requester),
      filters: access.advancedFilters?.map(filter => ({
        name: filter.expandField || '',
        operator: filter.expandOperator || '',
        value: filter.expandValue || '',
      })) || [],
      filterOp: access.filterOp || 'AND',
    })) || [],
    lookupByRoleId: formData.lookupKeys?.map((lookup) => ({
      name: lookup.name,
      value: lookup.value || '',
      private: lookup.private,
      description: lookup.description || '',
    })) || [],
  };
}

// ============================================================================
// Page Metadata
// ============================================================================

/**
 * Generate metadata for the role creation page
 */
export function generateMetadata() {
  return {
    title: 'Create Role - DreamFactory Admin',
    description: 'Create a new role with service access configuration and lookup key management for API security.',
    keywords: ['role', 'create', 'access control', 'permissions', 'API security'],
  };
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Role Creation Page Component
 */
export default function CreateRolePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showNotification } = useNotifications();
  
  // Form state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'warning' | 'info' | 'success'>('error');

  // Initialize form with React Hook Form and Zod validation
  const form = useForm<CreateRoleFormData>({
    resolver: zodResolver(CreateRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      serviceAccess: [],
      lookupKeys: [],
    },
    mode: 'onChange', // Real-time validation under 100ms per requirements
  });

  // Service access field array
  const {
    fields: serviceAccessFields,
    append: appendServiceAccess,
    remove: removeServiceAccess,
  } = useFieldArray({
    control: form.control,
    name: 'serviceAccess',
  });

  // Lookup keys field array
  const {
    fields: lookupKeyFields,
    append: appendLookupKey,
    remove: removeLookupKey,
  } = useFieldArray({
    control: form.control,
    name: 'lookupKeys',
  });

  // Role creation mutation with React Query
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleData) => {
      const payload = {
        resource: [data],
      };
      
      return apiPost('/system/role', payload, {
        fields: '*',
        related: 'role_service_access_by_role_id,lookup_by_role_id',
        snackbarSuccess: 'Role created successfully',
        snackbarError: 'Failed to create role',
      });
    },
    onSuccess: (data) => {
      // Invalidate and refetch role queries
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      
      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Role created successfully',
      });
      
      // Navigate back to roles list
      router.push('/api-security/roles');
    },
    onError: (error: any) => {
      console.error('Role creation error:', error);
      
      let errorMessage = 'Failed to create role';
      
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error?.context?.resource?.[0]?.message) {
          errorMessage = errorData.error.context.resource[0].message;
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        // Use default error message
      }
      
      setAlertType('error');
      setAlertMessage(errorMessage);
      setShowAlert(true);
      
      showNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: CreateRoleFormData) => {
    if (!data.name?.trim()) {
      setAlertType('error');
      setAlertMessage('Role name is required');
      setShowAlert(true);
      return;
    }

    const payload = transformToApiPayload(data);
    createRoleMutation.mutate(payload);
  };

  // Navigation handlers
  const handleCancel = () => {
    router.push('/api-security/roles');
  };

  // Alert management
  const handleAlertClose = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Create Role
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a new role with granular permissions and service access configuration.
          Roles enable you to control what APIs and functionality users can access.
        </p>
      </div>

      {/* Alert Component */}
      {showAlert && (
        <Alert 
          variant={alertType}
          className="mb-6"
          onClose={handleAlertClose}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Role Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Role Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter role name"
                        className="mt-1"
                        aria-describedby="name-description"
                      />
                    </FormControl>
                    <FormDescription id="name-description" className="text-xs text-gray-500">
                      Unique name for the role (letters, numbers, underscores, and hyphens only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Active
                      </FormLabel>
                      <FormDescription className="text-xs text-gray-500">
                        Enable this role for assignment to users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Toggle role active status"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <div className="mt-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter role description"
                        rows={3}
                        className="mt-1"
                        aria-describedby="description-description"
                      />
                    </FormControl>
                    <FormDescription id="description-description" className="text-xs text-gray-500">
                      Optional description explaining the purpose of this role
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Service Access Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Service Access Configuration
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure which services this role can access and what operations are allowed.
              Service access controls API endpoint permissions and request types.
            </p>

            <RoleServiceAccess
              fields={serviceAccessFields}
              control={form.control}
              onAppend={appendServiceAccess}
              onRemove={removeServiceAccess}
              watch={form.watch}
              errors={form.formState.errors.serviceAccess}
            />
          </div>

          {/* Lookup Keys Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Lookup Keys
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Define lookup keys that provide dynamic values for API operations.
              These key-value pairs can be referenced in API calls and scripts.
            </p>

            <LookupKeys
              fields={lookupKeyFields}
              control={form.control}
              onAppend={appendLookupKey}
              onRemove={removeLookupKey}
              errors={form.formState.errors.lookupKeys}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createRoleMutation.isPending}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRoleMutation.isPending || !form.formState.isValid}
              className="min-w-24"
            >
              {createRoleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}