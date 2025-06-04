# UserDetails Component

Comprehensive React component for managing user account details in the DreamFactory Admin Interface. This component provides a complete user management solution with React Hook Form integration, accessibility compliance, and theme support.

## Table of Contents

- [Overview](#overview)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [React Hook Form Integration](#react-hook-form-integration)
- [Accessibility Compliance](#accessibility-compliance)
- [Performance Optimization](#performance-optimization)
- [Theme Customization](#theme-customization)
- [Internationalization](#internationalization)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Integration Patterns](#integration-patterns)

## Overview

The UserDetails component is a fully-featured user management interface that supports both admin and user profile workflows. Built with React 19, Next.js 15.1, and Tailwind CSS, it provides enterprise-grade functionality with complete accessibility compliance.

### Key Features

- **🔧 Dual Mode Support**: Admin and user profile management
- **📝 Form Management**: React Hook Form integration with Zod validation
- **♿ Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **🎨 Theme Support**: Dark/light mode with Zustand state management
- **🌐 Internationalization**: Next.js i18n integration
- **🔒 Access Control**: Role-based permission enforcement
- **⚡ Performance**: Sub-100ms validation with optimized rendering
- **💰 Paywall Integration**: Feature restriction capabilities

## API Reference

### TypeScript Interfaces

```typescript
// Core user data interface with generic type support
interface UserDetailsData<T extends 'admin' | 'user' = 'user'> {
  id?: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  username?: string;
  phone?: string;
  
  // Admin-specific fields
  is_active: T extends 'admin' ? boolean : boolean | undefined;
  default_app_id?: T extends 'admin' ? number : undefined;
  
  // Conditional fields based on mode
  password?: T extends 'admin' ? never : string;
  password_confirmation?: T extends 'admin' ? never : string;
  security_question?: string;
  security_answer?: string;
  
  // Role assignments (admin mode only)
  user_to_app_to_role_by_user_id?: T extends 'admin' ? UserAppRole[] : undefined;
  
  // Timestamps
  created_date?: string;
  last_modified_date?: string;
  last_login_date?: string;
}

// Role assignment interface
interface UserAppRole {
  id?: number;
  user_id: number;
  app_id: number;
  role_id: number;
  app?: {
    id: number;
    name: string;
    description?: string;
  };
  role?: {
    id: number;
    name: string;
    description?: string;
  };
}

// Component props interface
interface UserDetailsProps<T extends 'admin' | 'user' = 'user'> {
  mode: T;
  userId?: string;
  defaultValues?: Partial<UserDetailsData<T>>;
  onSave?: (data: UserDetailsData<T>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  readOnly?: boolean;
  showPasswordFields?: boolean;
  availableApps?: App[];
  availableRoles?: Role[];
  className?: string;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// Form field configuration
interface FieldConfig {
  name: keyof UserDetailsData;
  label: string;
  type: 'text' | 'email' | 'password' | 'tel' | 'select' | 'checkbox' | 'textarea';
  required?: boolean;
  validation?: ZodSchema;
  placeholder?: string;
  helpText?: string;
  conditional?: (data: UserDetailsData) => boolean;
  disabled?: boolean;
}
```

### Component API

```typescript
// Primary component export
export function UserDetails<T extends 'admin' | 'user' = 'user'>(
  props: UserDetailsProps<T>
): JSX.Element;

// Hook for form management
export function useUserDetailsForm<T extends 'admin' | 'user' = 'user'>(
  mode: T,
  defaultValues?: Partial<UserDetailsData<T>>
): {
  form: UseFormReturn<UserDetailsData<T>>;
  isValid: boolean;
  isDirty: boolean;
  errors: FieldErrors<UserDetailsData<T>>;
  handleSubmit: (onSubmit: (data: UserDetailsData<T>) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  reset: (values?: Partial<UserDetailsData<T>>) => void;
  watch: UseFormWatch<UserDetailsData<T>>;
};

// Validation schemas
export const userValidationSchema: ZodSchema<UserDetailsData<'user'>>;
export const adminValidationSchema: ZodSchema<UserDetailsData<'admin'>>;
```

## Usage Examples

### Basic User Profile Management

```typescript
'use client';

import { UserDetails } from '@/components/ui/user-details';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export function UserProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (userData: UserDetailsData<'user'>) => {
    try {
      const response = await fetch('/api/v2/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
        variant: 'success',
      });
      
      router.push('/profile');
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'error',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <UserDetails
        mode="user"
        onSave={handleSave}
        onCancel={() => router.back()}
        showPasswordFields={true}
        aria-label="Edit user profile form"
      />
    </div>
  );
}
```

### Admin User Management

```typescript
'use client';

import { UserDetails } from '@/components/ui/user-details';
import { useUser } from '@/hooks/use-user';
import { useApps } from '@/hooks/use-apps';
import { useRoles } from '@/hooks/use-roles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminUserEditProps {
  userId: string;
}

export function AdminUserEdit({ userId }: AdminUserEditProps) {
  const { data: user, isLoading: userLoading } = useUser(userId);
  const { data: apps } = useApps();
  const { data: roles } = useRoles();

  const handleSave = async (userData: UserDetailsData<'admin'>) => {
    // Handle admin save logic with role assignments
    await fetch(`/api/v2/system/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
  };

  if (userLoading) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit User</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">User Details</TabsTrigger>
          <TabsTrigger value="roles">Role Assignments</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <UserDetails
            mode="admin"
            userId={userId}
            defaultValues={user}
            onSave={handleSave}
            availableApps={apps}
            availableRoles={roles}
            aria-label="Admin user management form"
          />
        </TabsContent>

        <TabsContent value="roles">
          {/* Role assignment interface */}
        </TabsContent>

        <TabsContent value="activity">
          {/* User activity log */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Create New User (Admin)

```typescript
'use client';

import { UserDetails } from '@/components/ui/user-details';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CreateUserPage() {
  const handleCreate = async (userData: UserDetailsData<'admin'>) => {
    const response = await fetch('/api/v2/system/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const newUser = await response.json();
      router.push(`/admin-settings/users/${newUser.id}`);
    }
  };

  const defaultValues: Partial<UserDetailsData<'admin'>> = {
    is_active: true,
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <UserDetails
            mode="admin"
            defaultValues={defaultValues}
            onSave={handleCreate}
            onCancel={() => router.back()}
            showPasswordFields={false}
            aria-label="Create new user form"
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

## React Hook Form Integration

### Form Configuration with Zod Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// User validation schema
export const userValidationSchema = z.object({
  name: z.string().min(1, 'Display name is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().optional(),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .optional(),
  password_confirmation: z.string().optional(),
  security_question: z.string().optional(),
  security_answer: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.password_confirmation) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// Admin validation schema (extends user schema)
export const adminValidationSchema = userValidationSchema.extend({
  is_active: z.boolean(),
  default_app_id: z.number().optional(),
  user_to_app_to_role_by_user_id: z.array(z.object({
    app_id: z.number(),
    role_id: z.number(),
  })).optional(),
}).omit({ password: true, password_confirmation: true });

// Custom hook for form management
export function useUserDetailsForm<T extends 'admin' | 'user'>(
  mode: T,
  defaultValues?: Partial<UserDetailsData<T>>
) {
  const schema = mode === 'admin' ? adminValidationSchema : userValidationSchema;
  
  const form = useForm<UserDetailsData<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as UserDetailsData<T>,
    mode: 'onChange', // Real-time validation
  });

  // Real-time validation under 100ms requirement
  const debouncedValidation = useMemo(
    () => debounce(form.trigger, 50),
    [form.trigger]
  );

  useEffect(() => {
    const subscription = form.watch(() => {
      debouncedValidation();
    });
    return () => subscription.unsubscribe();
  }, [form.watch, debouncedValidation]);

  return {
    form,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    errors: form.formState.errors,
    handleSubmit: form.handleSubmit,
    reset: form.reset,
    watch: form.watch,
  };
}
```

### Dynamic Field Management

```typescript
// Component for conditional password fields
function PasswordFields({ mode, control, watch }: {
  mode: 'admin' | 'user';
  control: Control<UserDetailsData>;
  watch: UseFormWatch<UserDetailsData>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = watch('id') !== undefined;

  // Only show password fields for user mode or when creating new admin users
  if (mode === 'admin' && isEditing) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password
                {!isEditing && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    aria-describedby="password-requirements"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormDescription id="password-requirements">
                Minimum 8 characters with uppercase, lowercase, and number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="password_confirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Confirm Password
                {!isEditing && <span className="text-red-500 ml-1">*</span>}
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Confirm password"
                  aria-describedby="password-confirmation-help"
                />
              </FormControl>
              <FormDescription id="password-confirmation-help">
                Re-enter password to confirm
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
```

### useFieldArray for Role Management

```typescript
import { useFieldArray } from 'react-hook-form';

function RoleAssignments({ control, availableApps, availableRoles }: {
  control: Control<UserDetailsData<'admin'>>;
  availableApps: App[];
  availableRoles: Role[];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'user_to_app_to_role_by_user_id',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Role Assignments</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ app_id: 0, role_id: 0 })}
          aria-label="Add new role assignment"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex items-end space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <FormField
            control={control}
            name={`user_to_app_to_role_by_user_id.${index}.app_id`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Application</FormLabel>
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableApps.map((app) => (
                      <SelectItem key={app.id} value={String(app.id)}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`user_to_app_to_role_by_user_id.${index}.role_id`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} value={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => remove(index)}
            aria-label={`Remove role assignment ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No role assignments. Click "Add Role" to assign applications and roles to this user.
        </div>
      )}
    </div>
  );
}
```

## Accessibility Compliance

### WCAG 2.1 AA Implementation

The UserDetails component implements comprehensive accessibility features to meet WCAG 2.1 AA standards:

#### Form Accessibility

```typescript
// Accessible form field implementation
function AccessibleFormField({
  name,
  label,
  type = 'text',
  required = false,
  helpText,
  error,
  ...props
}: AccessibleFormFieldProps) {
  const fieldId = useId();
  const helpTextId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={fieldId}
        className={cn(
          "text-sm font-medium",
          required && "after:content-['*'] after:ml-1 after:text-red-500"
        )}
      >
        {label}
      </Label>
      
      <Input
        id={fieldId}
        type={type}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={cn(
          helpText && helpTextId,
          error && errorId
        )}
        className={cn(
          "transition-colors focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          error && "border-red-500 focus:ring-red-500"
        )}
        {...props}
      />
      
      {helpText && (
        <div
          id={helpTextId}
          className="text-sm text-gray-600 dark:text-gray-400"
          role="note"
        >
          {helpText}
        </div>
      )}
      
      {error && (
        <div
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

#### Keyboard Navigation

```typescript
// Keyboard navigation implementation
function useKeyboardNavigation(formRef: RefObject<HTMLFormElement>) {
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation enhancement
      if (event.key === 'Tab') {
        const focusableElements = form.querySelectorAll(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
        );
        
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }

      // Form submission with Ctrl+Enter
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        submitButton?.click();
      }
    };

    form.addEventListener('keydown', handleKeyDown);
    return () => form.removeEventListener('keydown', handleKeyDown);
  }, [formRef]);
}
```

#### Screen Reader Support

```typescript
// Live regions for status updates
function FormStatusAnnouncer({ status, message }: {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}) {
  return (
    <>
      {/* Polite announcements for non-critical updates */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {status === 'loading' && 'Saving user details...'}
        {status === 'success' && (message || 'User details saved successfully')}
      </div>

      {/* Assertive announcements for errors */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {status === 'error' && (message || 'Error saving user details')}
      </div>
    </>
  );
}
```

#### Focus Management

```typescript
// Focus management utilities
export function useFocusManagement() {
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  const saveFocus = useCallback(() => {
    const activeElement = document.activeElement as HTMLElement;
    setFocusedElementId(activeElement?.id || null);
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElementId) {
      const element = document.getElementById(focusedElementId);
      element?.focus();
    }
  }, [focusedElementId]);

  const focusFirstError = useCallback((errors: FieldErrors) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
      element?.focus();
    }
  }, []);

  return { saveFocus, restoreFocus, focusFirstError };
}
```

## Performance Optimization

### Real-Time Validation Under 100ms

```typescript
// Optimized validation with debouncing
import { useDebouncedCallback } from 'use-debounce';

function useOptimizedValidation<T>(
  form: UseFormReturn<T>,
  validationSchema: ZodSchema<T>
) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Debounced validation to meet <100ms requirement
  const debouncedValidate = useDebouncedCallback(
    async (fieldName: keyof T, value: any) => {
      try {
        // Validate single field for immediate feedback
        const fieldSchema = validationSchema.shape[fieldName];
        if (fieldSchema) {
          await fieldSchema.parseAsync(value);
          setValidationErrors(prev => {
            const next = { ...prev };
            delete next[fieldName as string];
            return next;
          });
        }
      } catch (error) {
        if (error instanceof ZodError) {
          setValidationErrors(prev => ({
            ...prev,
            [fieldName as string]: error.errors[0]?.message || 'Invalid value'
          }));
        }
      }
    },
    50 // 50ms debounce for sub-100ms validation
  );

  // Watch form changes and trigger validation
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name) {
        debouncedValidate(name as keyof T, value[name]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch, debouncedValidate]);

  return { validationErrors };
}
```

### Memoization for Large Forms

```typescript
// Optimized component rendering
const UserDetailsForm = memo(function UserDetailsForm<T extends 'admin' | 'user'>({
  mode,
  defaultValues,
  onSave,
  availableApps,
  availableRoles,
  ...props
}: UserDetailsProps<T>) {
  const { form, handleSubmit } = useUserDetailsForm(mode, defaultValues);

  // Memoize expensive computations
  const fieldConfigurations = useMemo(() => 
    generateFieldConfigs(mode, availableApps, availableRoles),
    [mode, availableApps, availableRoles]
  );

  const memoizedOnSave = useCallback(
    (data: UserDetailsData<T>) => onSave?.(data),
    [onSave]
  );

  // Split form into sections for better performance
  const basicInfoFields = useMemo(() => 
    fieldConfigurations.filter(field => field.section === 'basic'),
    [fieldConfigurations]
  );

  const securityFields = useMemo(() => 
    fieldConfigurations.filter(field => field.section === 'security'),
    [fieldConfigurations]
  );

  const roleFields = useMemo(() => 
    fieldConfigurations.filter(field => field.section === 'roles'),
    [fieldConfigurations]
  );

  return (
    <form onSubmit={handleSubmit(memoizedOnSave)} {...props}>
      <FormSection fields={basicInfoFields} control={form.control} />
      <FormSection fields={securityFields} control={form.control} />
      {mode === 'admin' && (
        <FormSection fields={roleFields} control={form.control} />
      )}
    </form>
  );
});
```

### Virtual Scrolling for Large Role Lists

```typescript
// Virtual scrolling for role assignments
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedRoleList({ roles, selectedRoles, onToggle }: {
  roles: Role[];
  selectedRoles: Set<number>;
  onToggle: (roleId: number) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: roles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Height per role item
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="h-64 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
      role="listbox"
      aria-label="Available roles"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualItem => {
          const role = roles[virtualItem.index];
          const isSelected = selectedRoles.has(role.id);

          return (
            <div
              key={role.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div
                className={cn(
                  "flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                  isSelected && "bg-primary-50 dark:bg-primary-900/20"
                )}
                onClick={() => onToggle(role.id)}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle(role.id);
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(role.id)}
                  className="mr-3"
                  tabIndex={-1}
                />
                <div>
                  <div className="font-medium">{role.name}</div>
                  {role.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {role.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Theme Customization

### Tailwind CSS Integration

```typescript
// Theme-aware styling with CSS variables
const userDetailsTheme = {
  light: {
    background: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    accent: 'text-primary-600',
    input: 'bg-white border-gray-300 focus:border-primary-500',
    error: 'text-red-600 border-red-300',
    success: 'text-green-600 border-green-300',
  },
  dark: {
    background: 'bg-gray-900',
    border: 'border-gray-700',
    text: 'text-gray-100',
    accent: 'text-primary-400',
    input: 'bg-gray-800 border-gray-600 focus:border-primary-400',
    error: 'text-red-400 border-red-500',
    success: 'text-green-400 border-green-500',
  }
};

// Theme provider integration
function ThemedUserDetails(props: UserDetailsProps) {
  const { theme } = useAppStore();
  const currentTheme = userDetailsTheme[theme === 'dark' ? 'dark' : 'light'];

  return (
    <div className={cn(
      "p-6 rounded-lg transition-colors duration-200",
      currentTheme.background,
      currentTheme.border,
      currentTheme.text
    )}>
      <UserDetails
        {...props}
        className={cn(props.className, currentTheme.background)}
      />
    </div>
  );
}
```

### Zustand Store Theme Integration

```typescript
// Theme store integration
import { useAppStore } from '@/stores/app-store';

function useThemeClasses() {
  const { theme } = useAppStore();
  
  return useMemo(() => ({
    form: cn(
      "space-y-6 transition-colors duration-200",
      theme === 'dark' ? 'text-white' : 'text-gray-900'
    ),
    fieldGroup: cn(
      "grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg",
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    ),
    input: cn(
      "transition-all duration-200 focus:ring-2 focus:ring-offset-2",
      theme === 'dark'
        ? 'bg-gray-700 border-gray-600 text-white focus:ring-primary-500 focus:border-primary-500'
        : 'bg-white border-gray-300 text-gray-900 focus:ring-primary-500 focus:border-primary-500'
    ),
    button: cn(
      "transition-all duration-200 font-medium",
      theme === 'dark'
        ? 'bg-primary-600 hover:bg-primary-700 text-white'
        : 'bg-primary-500 hover:bg-primary-600 text-white'
    ),
  }), [theme]);
}

// Dynamic theme switching
function ThemeToggle() {
  const { theme, setTheme } = useAppStore();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        "p-2 rounded-lg transition-colors",
        theme === 'dark'
          ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
```

### Responsive Design Patterns

```typescript
// Responsive form layout
const responsiveFormClasses = {
  container: "max-w-4xl mx-auto p-4 sm:p-6 lg:p-8",
  section: "space-y-6 sm:space-y-8",
  fieldGroup: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
  fullWidth: "col-span-1 sm:col-span-2 lg:col-span-3",
  halfWidth: "col-span-1 sm:col-span-1",
  actions: "flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4",
};

// Adaptive component sizing
function useResponsiveLayout() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1024) setBreakpoint('desktop');
      else if (width >= 768) setBreakpoint('tablet');
      else setBreakpoint('mobile');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    fieldColumns: breakpoint === 'desktop' ? 3 : breakpoint === 'tablet' ? 2 : 1,
  };
}
```

## Internationalization

### Next.js i18n Integration

```typescript
// i18n hook for user details
import { useTranslations } from 'next-intl';

function useUserDetailsTranslations() {
  const t = useTranslations('userDetails');
  
  return {
    // Field labels
    labels: {
      firstName: t('fields.firstName'),
      lastName: t('fields.lastName'),
      email: t('fields.email'),
      username: t('fields.username'),
      phone: t('fields.phone'),
      password: t('fields.password'),
      confirmPassword: t('fields.confirmPassword'),
      isActive: t('fields.isActive'),
      defaultApp: t('fields.defaultApp'),
    },
    
    // Validation messages
    validation: {
      required: t('validation.required'),
      emailInvalid: t('validation.emailInvalid'),
      passwordTooShort: t('validation.passwordTooShort'),
      passwordMismatch: t('validation.passwordMismatch'),
      phoneInvalid: t('validation.phoneInvalid'),
    },
    
    // Actions
    actions: {
      save: t('actions.save'),
      cancel: t('actions.cancel'),
      edit: t('actions.edit'),
      create: t('actions.create'),
      delete: t('actions.delete'),
    },
    
    // Status messages
    status: {
      saving: t('status.saving'),
      saved: t('status.saved'),
      error: t('status.error'),
      loading: t('status.loading'),
    },
    
    // Help text
    help: {
      password: t('help.password'),
      username: t('help.username'),
      defaultApp: t('help.defaultApp'),
    },
  };
}

// Localized form component
function LocalizedUserDetails(props: UserDetailsProps) {
  const { labels, validation, actions, status, help } = useUserDetailsTranslations();
  const locale = useLocale();

  // Date formatting for timestamps
  const formatDate = useCallback((dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  }, [locale]);

  return (
    <UserDetails
      {...props}
      labels={labels}
      validation={validation}
      actions={actions}
      status={status}
      help={help}
      formatDate={formatDate}
    />
  );
}
```

### Translation Files Structure

```json
// messages/en.json
{
  "userDetails": {
    "fields": {
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email Address",
      "username": "Username",
      "phone": "Phone Number",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "isActive": "Active User",
      "defaultApp": "Default Application"
    },
    "validation": {
      "required": "This field is required",
      "emailInvalid": "Please enter a valid email address",
      "passwordTooShort": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match",
      "phoneInvalid": "Please enter a valid phone number"
    },
    "actions": {
      "save": "Save Changes",
      "cancel": "Cancel",
      "edit": "Edit User",
      "create": "Create User",
      "delete": "Delete User"
    },
    "status": {
      "saving": "Saving user details...",
      "saved": "User details saved successfully",
      "error": "Error saving user details",
      "loading": "Loading user information..."
    },
    "help": {
      "password": "Minimum 8 characters with uppercase, lowercase, and number",
      "username": "Optional: Leave blank to use email as username",
      "defaultApp": "The application this user will see after login"
    }
  }
}

// messages/es.json
{
  "userDetails": {
    "fields": {
      "firstName": "Nombre",
      "lastName": "Apellido",
      "email": "Correo Electrónico",
      "username": "Nombre de Usuario",
      "phone": "Número de Teléfono",
      "password": "Contraseña",
      "confirmPassword": "Confirmar Contraseña",
      "isActive": "Usuario Activo",
      "defaultApp": "Aplicación Predeterminada"
    },
    "validation": {
      "required": "Este campo es obligatorio",
      "emailInvalid": "Por favor ingrese un correo electrónico válido",
      "passwordTooShort": "La contraseña debe tener al menos 8 caracteres",
      "passwordMismatch": "Las contraseñas no coinciden",
      "phoneInvalid": "Por favor ingrese un número de teléfono válido"
    },
    "actions": {
      "save": "Guardar Cambios",
      "cancel": "Cancelar",
      "edit": "Editar Usuario",
      "create": "Crear Usuario",
      "delete": "Eliminar Usuario"
    },
    "status": {
      "saving": "Guardando detalles del usuario...",
      "saved": "Detalles del usuario guardados exitosamente",
      "error": "Error al guardar los detalles del usuario",
      "loading": "Cargando información del usuario..."
    },
    "help": {
      "password": "Mínimo 8 caracteres con mayúscula, minúscula y número",
      "username": "Opcional: Deje en blanco para usar el correo como nombre de usuario",
      "defaultApp": "La aplicación que este usuario verá después del inicio de sesión"
    }
  }
}
```

## Migration Guide

### From Angular DfUserDetailsBaseComponent

This section provides a comprehensive migration guide from the Angular `DfUserDetailsBaseComponent` to the new React `UserDetails` component.

#### Architecture Comparison

| Aspect | Angular (Before) | React (After) |
|--------|------------------|---------------|
| **Framework** | Angular 16 + RxJS | React 19 + Next.js 15.1 |
| **Forms** | Reactive Forms | React Hook Form + Zod |
| **State Management** | Services + RxJS | Zustand + React Query |
| **Styling** | Angular Material + SCSS | Tailwind CSS + Headless UI |
| **Validation** | Angular Validators | Zod Schema Validation |
| **HTTP Client** | HttpClient + RxJS | Fetch API + React Query |
| **Routing** | Angular Router | Next.js App Router |

#### Code Migration Examples

**Angular Component (Before):**

```typescript
// Angular DfUserDetailsBaseComponent
@Component({
  selector: 'df-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss']
})
export class DfUserDetailsComponent implements OnInit {
  userForm: FormGroup;
  isLoading$ = new BehaviorSubject(false);
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(8)]],
      is_active: [true]
    });
  }

  ngOnInit() {
    if (this.userId) {
      this.loadUser();
    }
  }

  loadUser() {
    this.isLoading$.next(true);
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        this.userForm.patchValue(user);
        this.isLoading$.next(false);
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.isLoading$.next(false);
      }
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      this.userService.saveUser(userData).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error saving user:', error);
        }
      });
    }
  }
}
```

**React Component (After):**

```typescript
// React UserDetails Component
'use client';

import { useUserDetailsForm } from './hooks/use-user-details-form';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';

interface UserDetailsProps {
  userId?: string;
  mode: 'admin' | 'user';
  onSave?: (data: UserDetailsData) => Promise<void>;
}

export function UserDetails({ userId, mode, onSave }: UserDetailsProps) {
  const router = useRouter();
  const { data: user, isLoading } = useUser(userId);
  const { form, handleSubmit } = useUserDetailsForm(mode, user);

  const onSubmit = async (data: UserDetailsData) => {
    try {
      if (onSave) {
        await onSave(data);
      } else {
        // Default save behavior
        const url = userId ? `/api/v2/system/user/${userId}` : '/api/v2/system/user';
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to save user');
        }
      }
      
      router.push('/admin-settings/users');
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  if (isLoading) {
    return <UserDetailsSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form fields implementation */}
    </form>
  );
}
```

#### Service Migration

**Angular Service (Before):**

```typescript
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/v2/system/user/${id}`);
  }

  saveUser(userData: User): Observable<User> {
    if (userData.id) {
      return this.http.put<User>(`/api/v2/system/user/${userData.id}`, userData);
    } else {
      return this.http.post<User>('/api/v2/system/user', userData);
    }
  }
}
```

**React Hook (After):**

```typescript
// hooks/use-user.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUser(userId?: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/v2/system/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
    enabled: !!userId,
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (userData: UserDetailsData) => {
      const response = await fetch('/api/v2/system/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, ...userData }: UserDetailsData & { id: string }) => {
      const response = await fetch(`/api/v2/system/user/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to update user');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return { createUser, updateUser };
}
```

#### Template Migration

**Angular Template (Before):**

```html
<!-- user-details.component.html -->
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <mat-card>
    <mat-card-header>
      <mat-card-title>User Details</mat-card-title>
    </mat-card-header>
    
    <mat-card-content>
      <div class="form-row">
        <mat-form-field>
          <mat-label>First Name</mat-label>
          <input matInput formControlName="first_name" required>
          <mat-error *ngIf="userForm.get('first_name')?.hasError('required')">
            First name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Last Name</mat-label>
          <input matInput formControlName="last_name" required>
          <mat-error *ngIf="userForm.get('last_name')?.hasError('required')">
            Last name is required
          </mat-error>
        </mat-form-field>
      </div>

      <mat-form-field>
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email" required>
        <mat-error *ngIf="userForm.get('email')?.hasError('required')">
          Email is required
        </mat-error>
        <mat-error *ngIf="userForm.get('email')?.hasError('email')">
          Please enter a valid email
        </mat-error>
      </mat-form-field>

      <mat-slide-toggle formControlName="is_active">
        Active User
      </mat-slide-toggle>
    </mat-card-content>

    <mat-card-actions align="end">
      <button mat-button type="button" (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" type="submit" [disabled]="!userForm.valid">
        Save
      </button>
    </mat-card-actions>
  </mat-card>
</form>
```

**React JSX (After):**

```typescript
// UserDetails component JSX
return (
  <Card>
    <CardHeader>
      <CardTitle>User Details</CardTitle>
    </CardHeader>
    
    <CardContent>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter first name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter last name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="Enter email address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active User</FormLabel>
                <FormDescription>
                  Enable this user to log in and access the system
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!form.formState.isValid}>
            Save
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
);
```

#### Migration Checklist

- [ ] **Convert Reactive Forms to React Hook Form**
  - Replace `FormBuilder` with `useForm` hook
  - Convert validators to Zod schemas
  - Update form field bindings

- [ ] **Replace RxJS with React Query**
  - Convert `Observable` subscriptions to `useQuery` hooks
  - Replace `BehaviorSubject` with React state or Zustand store
  - Update error handling patterns

- [ ] **Update Styling**
  - Replace Angular Material with Headless UI components
  - Convert SCSS to Tailwind CSS classes
  - Implement dark mode support

- [ ] **Modernize Validation**
  - Convert Angular validators to Zod schemas
  - Implement real-time validation with debouncing
  - Add accessibility attributes

- [ ] **Update Routing**
  - Replace Angular Router with Next.js App Router
  - Convert route parameters and navigation

- [ ] **Add Accessibility Features**
  - Implement ARIA attributes
  - Add keyboard navigation support
  - Include screen reader announcements

## Troubleshooting

### Common Integration Issues

#### 1. Form Validation Not Working

**Problem**: Real-time validation not triggering or validation errors not displaying.

**Solution**:
```typescript
// Ensure proper form mode and resolver configuration
const form = useForm({
  resolver: zodResolver(validationSchema),
  mode: 'onChange', // Enable real-time validation
  reValidateMode: 'onChange',
});

// Check if FormProvider is properly wrapping the form
<FormProvider {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* Form fields */}
  </form>
</FormProvider>
```

#### 2. Accessibility Violations

**Problem**: Screen readers not announcing form errors or field changes.

**Solution**:
```typescript
// Ensure proper ARIA attributes and live regions
<FormField
  control={control}
  name="email"
  render={({ field, fieldState }) => (
    <FormItem>
      <FormLabel htmlFor={field.name}>Email</FormLabel>
      <FormControl>
        <Input
          {...field}
          id={field.name}
          aria-invalid={fieldState.invalid}
          aria-describedby={`${field.name}-error ${field.name}-description`}
        />
      </FormControl>
      <FormDescription id={`${field.name}-description`}>
        Enter your email address
      </FormDescription>
      <FormMessage
        id={`${field.name}-error`}
        role="alert"
        aria-live="polite"
      />
    </FormItem>
  )}
/>
```

#### 3. Performance Issues with Large Forms

**Problem**: Form becomes slow or unresponsive with many fields.

**Solution**:
```typescript
// Use field-level memoization and controlled re-renders
const MemoizedFormField = memo(function MemoizedFormField({ 
  name, 
  control 
}: { 
  name: string; 
  control: Control; 
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{name}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

// Implement virtual scrolling for role lists
// See the Virtual Scrolling example in Performance Optimization section
```

#### 4. Theme Not Applying Correctly

**Problem**: Dark/light theme changes not reflected in form components.

**Solution**:
```typescript
// Ensure Zustand store is properly configured and components are subscribed
const { theme } = useAppStore((state) => ({ theme: state.theme }));

// Use CSS variables for consistent theming
:root {
  --form-background: #ffffff;
  --form-border: #e5e7eb;
  --form-text: #111827;
}

[data-theme="dark"] {
  --form-background: #1f2937;
  --form-border: #374151;
  --form-text: #f9fafb;
}

// Apply theme classes conditionally
className={cn(
  "form-field",
  theme === 'dark' ? 'dark-theme' : 'light-theme'
)}
```

#### 5. React Query Cache Issues

**Problem**: User data not updating or stale data being displayed.

**Solution**:
```typescript
// Proper cache invalidation and optimistic updates
const { mutate: updateUser } = useMutation({
  mutationFn: updateUserAPI,
  onMutate: async (newUserData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['user', userId] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['user', userId]);

    // Optimistically update cache
    queryClient.setQueryData(['user', userId], newUserData);

    return { previousUser };
  },
  onError: (err, newUserData, context) => {
    // Rollback on error
    queryClient.setQueryData(['user', userId], context?.previousUser);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  },
});
```

### Debugging Tools

#### Form State Inspector

```typescript
// Development-only form state debugger
function FormDebugger({ form }: { form: UseFormReturn }) {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="font-bold mb-2">Form Debug Info</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify({
          values: form.getValues(),
          errors: form.formState.errors,
          isDirty: form.formState.isDirty,
          isValid: form.formState.isValid,
          touchedFields: form.formState.touchedFields,
        }, null, 2)}
      </pre>
    </div>
  );
}

// Usage in development
<UserDetails {...props} />
{process.env.NODE_ENV === 'development' && <FormDebugger form={form} />}
```

#### Accessibility Audit

```typescript
// Automated accessibility check (development only)
function useAccessibilityAudit(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || !ref.current) return;

    // Check for missing labels
    const inputs = ref.current.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = document.querySelector(`label[for="${id}"]`);

      if (!label && !ariaLabel && !ariaLabelledBy) {
        console.warn('Input missing label:', input);
      }
    });

    // Check for missing error announcements
    const errorElements = ref.current.querySelectorAll('[role="alert"]');
    errorElements.forEach((error) => {
      if (!error.getAttribute('aria-live')) {
        console.warn('Error element missing aria-live:', error);
      }
    });
  }, [ref]);
}
```

## Integration Patterns

### Paywall Integration

```typescript
// Paywall-aware user management
import { usePaywall } from '@/hooks/use-paywall';

interface PaywallEnabledUserDetailsProps extends UserDetailsProps {
  requiredFeatures?: string[];
}

export function PaywallEnabledUserDetails({
  requiredFeatures = [],
  ...props
}: PaywallEnabledUserDetailsProps) {
  const { hasFeature, showUpgradeDialog } = usePaywall();

  // Check if user has required features
  const canAccess = requiredFeatures.every(feature => hasFeature(feature));

  if (!canAccess) {
    return (
      <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="mb-4">
          <Lock className="h-12 w-12 mx-auto text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Premium Feature
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Advanced user management features require a premium subscription.
        </p>
        <Button onClick={() => showUpgradeDialog()}>
          Upgrade Now
        </Button>
      </div>
    );
  }

  return <UserDetails {...props} />;
}

// Usage with feature restrictions
<PaywallEnabledUserDetails
  mode="admin"
  requiredFeatures={['advanced_user_management', 'role_assignments']}
  userId={userId}
/>
```

### Multi-tenant Support

```typescript
// Tenant-aware user management
interface TenantUserDetailsProps extends UserDetailsProps {
  tenantId: string;
}

export function TenantUserDetails({ tenantId, ...props }: TenantUserDetailsProps) {
  const { data: tenantConfig } = useTenantConfig(tenantId);
  const { data: tenantRoles } = useTenantRoles(tenantId);

  // Customize form based on tenant configuration
  const fieldConfig = useMemo(() => {
    const baseFields = getBaseFieldConfig();
    
    if (tenantConfig?.customFields) {
      baseFields.push(...tenantConfig.customFields);
    }
    
    return baseFields;
  }, [tenantConfig]);

  return (
    <UserDetails
      {...props}
      availableRoles={tenantRoles}
      fieldConfiguration={fieldConfig}
      validationSchema={getTenantValidationSchema(tenantConfig)}
    />
  );
}
```

### Audit Logging Integration

```typescript
// Audit-enabled user management
function useUserAuditLogger() {
  const logUserChange = useCallback((action: string, userId: string, changes: any) => {
    // Log user management actions for compliance
    fetch('/api/v2/system/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: 'user',
        entity_id: userId,
        action,
        changes,
        timestamp: new Date().toISOString(),
      }),
    });
  }, []);

  return { logUserChange };
}

// Integration in UserDetails component
export function AuditEnabledUserDetails(props: UserDetailsProps) {
  const { logUserChange } = useUserAuditLogger();

  const handleSave = async (data: UserDetailsData) => {
    const originalData = props.defaultValues;
    const changes = getDifferences(originalData, data);

    try {
      await props.onSave?.(data);
      
      // Log successful change
      logUserChange(
        props.userId ? 'update' : 'create',
        props.userId || data.id,
        changes
      );
    } catch (error) {
      // Log failed change attempt
      logUserChange(
        `${props.userId ? 'update' : 'create'}_failed`,
        props.userId || 'new',
        { error: error.message, attempted_changes: changes }
      );
      throw error;
    }
  };

  return (
    <UserDetails
      {...props}
      onSave={handleSave}
    />
  );
}
```

---

## Conclusion

The UserDetails component provides a comprehensive, accessible, and performant solution for user management in the DreamFactory Admin Interface. With complete React Hook Form integration, WCAG 2.1 AA compliance, and enterprise-grade features, it serves as the foundation for all user management workflows.

For additional support or feature requests, please refer to the [DreamFactory documentation](https://docs.dreamfactory.com) or contact the development team.