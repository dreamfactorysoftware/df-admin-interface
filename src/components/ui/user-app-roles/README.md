# UserAppRoles Component

A comprehensive React component for managing user application role assignments with full accessibility compliance, form integration capabilities, and support for large datasets. This component enables dynamic assignment of applications to roles through an accessible, keyboard-navigable interface with real-time validation.

## Table of Contents

- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [Accessibility Features](#accessibility-features)
- [Migration Guide](#migration-guide)
- [Form Integration](#form-integration)
- [Theming & Customization](#theming--customization)
- [Performance Optimization](#performance-optimization)
- [Internationalization](#internationalization)
- [Testing Guidelines](#testing-guidelines)
- [Troubleshooting](#troubleshooting)

## Overview

The `UserAppRoles` component provides a modern React implementation for managing application role assignments, featuring:

- **React Hook Form Integration**: Built with `useFieldArray` for dynamic form management
- **WCAG 2.1 AA Compliance**: Full accessibility support with keyboard navigation and screen reader compatibility
- **Headless UI Components**: Accessible disclosure panels and combobox autocomplete functionality
- **Real-time Validation**: Zod schema validation with sub-100ms validation performance
- **Responsive Design**: Mobile-first design with Tailwind CSS responsive utilities
- **Dark Mode Support**: Integrated theme switching with Zustand state management
- **Performance Optimized**: Virtualized rendering for large datasets (1000+ items)

### Key Features

- ✅ Dynamic add/remove functionality for application role assignments
- ✅ Autocomplete selection for applications and roles with keyboard navigation
- ✅ Collapsible interface with accessible disclosure panels
- ✅ Form validation with immediate feedback and error handling
- ✅ Full TypeScript support with comprehensive type definitions
- ✅ Internationalization support with Next.js i18n patterns
- ✅ Touch-friendly interface with minimum 44px touch targets
- ✅ Screen reader announcements for all user actions

## Installation & Setup

### Prerequisites

Ensure your project has the required dependencies:

```bash
npm install react@19.0.0 react-hook-form@7.52.0 @headlessui/react@2.0.0 
npm install zod@3.23.0 @hookform/resolvers@3.3.0
npm install @tailwindcss/forms@0.5.0 @fortawesome/react-fontawesome@0.2.0
npm install zustand@4.5.0 next@15.1.0
```

### Component Import

```typescript
// Basic import
import { UserAppRoles } from '@/components/ui/user-app-roles';

// With types
import { UserAppRoles, type UserAppRolesProps } from '@/components/ui/user-app-roles';

// Individual imports for tree-shaking
import { 
  UserAppRoles,
  type UserAppRolesProps,
  type AppRoleField,
  userAppRolesSchema 
} from '@/components/ui/user-app-roles';
```

## API Documentation

### Component Props Interface

```typescript
export interface UserAppRolesProps {
  // Data props
  apps: AppType[];
  roles: RoleType[];
  
  // Form integration props
  name?: string;
  defaultValue?: AppRoleField[];
  onValueChange?: (value: AppRoleField[]) => void;
  
  // Validation props
  required?: boolean;
  disabled?: boolean;
  error?: string;
  
  // Display props
  title?: string;
  description?: string;
  maxAssignments?: number;
  showAssignmentCount?: boolean;
  
  // Accessibility props
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
  
  // Styling props
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
  size?: 'sm' | 'md' | 'lg';
  
  // Behavior props
  collapsible?: boolean;
  defaultExpanded?: boolean;
  searchPlaceholder?: string;
  allowDuplicateApps?: boolean;
  
  // Performance props
  virtualized?: boolean;
  pageSize?: number;
  
  // Event handlers
  onAdd?: (appRole: AppRoleField) => void;
  onRemove?: (index: number, appRole: AppRoleField) => void;
  onExpand?: (expanded: boolean) => void;
}
```

### Data Type Definitions

```typescript
export interface AppType {
  id: number;
  name: string;
  apiKey: string;
  description: string;
  isActive: boolean;
  type: number;
  path?: string;
  url?: string;
  launchUrl: string;
  // Additional metadata
  roleByRoleId?: RoleType;
  createdDate: string;
  lastModifiedDate: string;
}

export interface RoleType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdById: number;
  createdDate: string;
  lastModifiedById: number;
  lastModifiedDate: string;
  lookupByRoleId: number[];
  accessibleTabs?: Array<string>;
}

export interface AppRoleField {
  app: string;
  role: string;
  // Internal tracking
  id?: string;
  isNew?: boolean;
  hasChanges?: boolean;
}
```

### Validation Schema

```typescript
import { z } from 'zod';

export const appRoleFieldSchema = z.object({
  app: z.string()
    .min(1, 'Application is required')
    .max(255, 'Application name too long'),
  role: z.string()
    .min(1, 'Role is required')
    .max(255, 'Role name too long'),
  id: z.string().optional(),
  isNew: z.boolean().optional(),
  hasChanges: z.boolean().optional(),
});

export const userAppRolesSchema = z.object({
  appRoles: z.array(appRoleFieldSchema)
    .min(0, 'No app roles specified')
    .max(100, 'Too many app role assignments')
    .refine(
      (appRoles) => {
        const apps = appRoles.map(ar => ar.app);
        return new Set(apps).size === apps.length;
      },
      {
        message: 'Duplicate applications are not allowed',
        path: ['appRoles'],
      }
    ),
});

export type UserAppRolesFormData = z.infer<typeof userAppRolesSchema>;
```

### Hook Integration

```typescript
export interface UseUserAppRolesReturn {
  // Field array methods
  fields: (AppRoleField & { id: string })[];
  append: (value: AppRoleField) => void;
  remove: (index: number) => void;
  update: (index: number, value: AppRoleField) => void;
  
  // Computed values
  availableApps: AppType[];
  assignedCount: number;
  totalCount: number;
  canAddMore: boolean;
  
  // Validation state
  errors: FieldErrors<UserAppRolesFormData>;
  isValid: boolean;
  isDirty: boolean;
  
  // UI state
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}
```

## Usage Examples

### Basic Implementation

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserAppRoles, userAppRolesSchema } from '@/components/ui/user-app-roles';

function UserManagementForm() {
  const apps = [
    { id: 1, name: 'admin-app', description: 'Admin Dashboard', isActive: true },
    { id: 2, name: 'user-portal', description: 'User Portal', isActive: true },
    { id: 3, name: 'api-docs', description: 'API Documentation', isActive: true },
  ];

  const roles = [
    { id: 1, name: 'admin', description: 'Administrator', isActive: true },
    { id: 2, name: 'editor', description: 'Content Editor', isActive: true },
    { id: 3, name: 'viewer', description: 'Read Only', isActive: true },
  ];

  const form = useForm({
    resolver: zodResolver(userAppRolesSchema),
    defaultValues: {
      appRoles: []
    }
  });

  const onSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <UserAppRoles
        apps={apps}
        roles={roles}
        title="Application Role Assignments"
        description="Assign applications to roles for this user"
        showAssignmentCount
        defaultExpanded
        data-testid="user-app-roles"
      />
      
      <button 
        type="submit" 
        className="btn-accessible btn-primary"
        disabled={!form.formState.isValid}
      >
        Save User Settings
      </button>
    </form>
  );
}
```

### Advanced Form Integration

```typescript
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { UserAppRoles } from '@/components/ui/user-app-roles';

interface UserFormData {
  name: string;
  email: string;
  appRoles: AppRoleField[];
  isActive: boolean;
}

function AdvancedUserForm() {
  const form = useForm<UserFormData>({
    defaultValues: {
      name: '',
      email: '',
      appRoles: [],
      isActive: true
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'appRoles'
  });

  // Custom validation with business logic
  const validateAppRoles = (appRoles: AppRoleField[]) => {
    const hasAdminRole = appRoles.some(ar => ar.role === 'admin');
    const hasRestrictedApp = appRoles.some(ar => ar.app === 'admin-app');
    
    if (hasRestrictedApp && !hasAdminRole) {
      return 'Admin application requires admin role';
    }
    return true;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Basic user information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Full Name
          </label>
          <input
            {...form.register('name', { required: 'Name is required' })}
            className="input-accessible mt-1 block w-full"
            aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
          />
          {form.formState.errors.name && (
            <p id="name-error" className="mt-1 text-sm text-error-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <input
            {...form.register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            type="email"
            className="input-accessible mt-1 block w-full"
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
          />
          {form.formState.errors.email && (
            <p id="email-error" className="mt-1 text-sm text-error-600">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* App roles section */}
      <div className="mt-8">
        <UserAppRoles
          apps={apps}
          roles={roles}
          name="appRoles"
          title="Application Permissions"
          description="Configure which applications this user can access and their role level"
          error={form.formState.errors.appRoles?.message}
          maxAssignments={10}
          showAssignmentCount
          onAdd={(appRole) => {
            // Custom logic before adding
            if (appRole.app === 'admin-app' && appRole.role !== 'admin') {
              alert('Admin application requires admin role');
              return;
            }
            append(appRole);
          }}
          onRemove={(index) => {
            // Custom logic before removing
            const removedRole = fields[index];
            if (removedRole.app === 'admin-app') {
              if (!confirm('Remove admin access? This will revoke all administrative privileges.')) {
                return;
              }
            }
            remove(index);
          }}
          aria-describedby="app-roles-help"
          data-testid="user-app-roles-field"
        />
        <p id="app-roles-help" className="mt-2 text-sm text-gray-600">
          Select applications and assign appropriate roles based on user responsibilities
        </p>
      </div>

      {/* Submit button */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          type="button"
          className="btn-accessible btn-secondary"
          onClick={() => form.reset()}
        >
          Reset Form
        </button>
        <button
          type="submit"
          className="btn-accessible btn-primary"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Save User'}
        </button>
      </div>
    </form>
  );
}
```

### Standalone Usage with Custom Handlers

```typescript
import React, { useState } from 'react';
import { UserAppRoles } from '@/components/ui/user-app-roles';

function StandaloneAppRoles() {
  const [appRoles, setAppRoles] = useState<AppRoleField[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleValueChange = async (newAppRoles: AppRoleField[]) => {
    setIsLoading(true);
    try {
      // Validate changes
      const result = userAppRolesSchema.safeParse({ appRoles: newAppRoles });
      if (!result.success) {
        throw new Error('Invalid app role configuration');
      }

      // Save to backend
      await fetch('/api/users/123/app-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appRoles: newAppRoles })
      });

      setAppRoles(newAppRoles);
      
      // Show success message
      toast.success('App role assignments updated successfully');
    } catch (error) {
      toast.error('Failed to update app role assignments');
      console.error('Error saving app roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <UserAppRoles
        apps={apps}
        roles={roles}
        defaultValue={appRoles}
        onValueChange={handleValueChange}
        title="User Application Access"
        description="Manage application access and role assignments"
        disabled={isLoading}
        showAssignmentCount
        maxAssignments={20}
        searchPlaceholder="Search applications and roles..."
        variant="detailed"
        size="lg"
        className="bg-white dark:bg-gray-900 rounded-lg shadow-md"
        aria-label="Application role management interface"
        data-testid="app-roles-manager"
      />
      
      {isLoading && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-sm text-gray-600">Saving changes...</span>
        </div>
      )}
    </div>
  );
}
```

## Accessibility Features

The UserAppRoles component is designed with WCAG 2.1 AA compliance as a core requirement. All interactive elements meet accessibility standards for keyboard navigation, screen reader support, and visual accessibility.

### WCAG 2.1 AA Compliance Features

#### Keyboard Navigation Support

```typescript
// All interactive elements support keyboard navigation
const keyboardHandlers = {
  // Tab navigation through form fields
  onKeyDown: (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Tab':
        // Natural tab order through add button, app field, role field, remove button
        break;
      case 'Enter':
        // Activate buttons and confirm selections
        if (event.target.type === 'button') {
          event.target.click();
        }
        break;
      case 'Escape':
        // Close autocomplete dropdowns and cancel operations
        closeAutocomplete();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        // Navigate through autocomplete options
        navigateAutocomplete(event.key);
        break;
    }
  }
};
```

#### ARIA Labeling and Announcements

```typescript
// Screen reader announcements for dynamic content
const announcements = {
  // When adding new app role
  onAdd: (app: string, role: string) => {
    announceToScreenReader(`Added ${app} with ${role} role. ${remainingCount} applications remaining.`);
  },
  
  // When removing app role
  onRemove: (app: string, index: number) => {
    announceToScreenReader(`Removed ${app} from position ${index + 1}. Application is now available for reassignment.`);
  },
  
  // Validation errors
  onError: (error: string) => {
    announceToScreenReader(`Error: ${error}`, 'assertive');
  },
  
  // Success messages
  onSuccess: (message: string) => {
    announceToScreenReader(message, 'polite');
  }
};

// ARIA attributes for complex UI elements
const ariaAttributes = {
  disclosure: {
    'aria-expanded': isExpanded,
    'aria-controls': 'app-roles-content',
    'aria-describedby': 'app-roles-description'
  },
  
  combobox: {
    'role': 'combobox',
    'aria-expanded': isDropdownOpen,
    'aria-haspopup': 'listbox',
    'aria-owns': 'app-options-listbox',
    'aria-autocomplete': 'list'
  },
  
  table: {
    'role': 'table',
    'aria-label': 'Application role assignments',
    'aria-rowcount': appRoles.length,
    'aria-describedby': 'table-instructions'
  }
};
```

### Color Contrast and Visual Accessibility

```typescript
// WCAG AA compliant color combinations
const accessibleColors = {
  // Text colors (minimum 4.5:1 contrast ratio)
  text: {
    primary: 'text-gray-900 dark:text-gray-100',     // 18.91:1 / 19.15:1
    secondary: 'text-gray-600 dark:text-gray-400',   // 7.25:1 / 9.14:1
    error: 'text-error-600 dark:text-error-400',     // 5.25:1 / 7.36:1
    success: 'text-success-600 dark:text-success-400' // 4.89:1 / 6.12:1
  },
  
  // Button colors (minimum 3:1 contrast ratio for UI components)
  buttons: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700', // 7.14:1 contrast
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300',
    danger: 'bg-error-600 text-white hover:bg-error-700'       // 5.25:1 contrast
  },
  
  // Focus indicators (minimum 3:1 contrast ratio)
  focus: {
    ring: 'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    outline: 'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-primary-600'
  }
};
```

### Touch Target Accessibility

```typescript
// Minimum 44x44px touch targets for mobile accessibility
const touchTargets = {
  buttons: 'min-h-[44px] min-w-[44px] p-2',
  inputFields: 'min-h-[44px] px-3 py-2',
  selectOptions: 'min-h-[44px] px-4 py-2',
  iconButtons: 'h-11 w-11 p-2' // 44px minimum with padding
};

// Example implementation
<button
  className={cn(
    'btn-accessible',
    'bg-primary-600 text-white',
    'hover:bg-primary-700 active:bg-primary-800',
    'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    'min-h-[44px] min-w-[44px] px-4 py-2',
    'rounded-md font-medium transition-colors'
  )}
  aria-label="Add new application role assignment"
  aria-describedby="add-button-help"
>
  <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
</button>
```

### Screen Reader Optimization

```typescript
// Comprehensive screen reader support
const screenReaderFeatures = {
  // Hidden labels for context
  hiddenLabels: (
    <>
      <span className="sr-only">
        Application role assignments table. Use tab to navigate through applications and roles.
        Press Enter to edit selections or Delete to remove assignments.
      </span>
    </>
  ),
  
  // Live regions for dynamic updates
  liveRegions: (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcements.current}
    </div>
  ),
  
  // Table headers and structure
  tableStructure: (
    <table role="table" aria-label="Application role assignments">
      <thead>
        <tr>
          <th scope="col" aria-sort="none">Application</th>
          <th scope="col" aria-sort="none">Role</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        {/* Table rows with proper markup */}
      </tbody>
    </table>
  ),
  
  // Form field associations
  fieldAssociations: {
    'aria-labelledby': 'app-field-label',
    'aria-describedby': 'app-field-help app-field-error',
    'aria-required': 'true',
    'aria-invalid': hasError ? 'true' : 'false'
  }
};
```

## Migration Guide

This section provides comprehensive guidance for migrating from the Angular `df-user-app-roles` component to the React `UserAppRoles` component.

### Architecture Changes Overview

| **Aspect** | **Angular Implementation** | **React Implementation** | **Migration Strategy** |
|---|---|---|---|
| **Component Type** | Class component with decorators | Functional component with hooks | Replace class with function, use hooks for state |
| **Form Integration** | Angular Reactive Forms | React Hook Form with useFieldArray | Update form control registration |
| **UI Components** | Angular Material | Headless UI + Tailwind CSS | Replace Material components with Headless UI |
| **State Management** | Local component state + RxJS | useState + React Hook Form | Migrate observables to hooks |
| **Validation** | Angular Validators | Zod schema validation | Replace validators with Zod schemas |
| **Styling** | SCSS + Angular Material | Tailwind CSS | Convert styles to utility classes |

### Step-by-Step Migration Process

#### 1. Component Structure Migration

**Before (Angular):**
```typescript
// df-user-app-roles.component.ts
@Component({
  selector: 'df-user-app-roles',
  templateUrl: './df-user-app-roles.component.html',
  styleUrls: ['./df-user-app-roles.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatTableModule, ...]
})
export class DfUserAppRolesComponent implements OnInit {
  @Input() apps: Array<AppType> = [];
  @Input() roles: Array<RoleType> = [];
  
  rootForm: FormGroup;
  appRoles: FormArray;
  dataSource: MatTableDataSource<any>;
  
  constructor(private rootFormGroup: FormGroupDirective) {}
  
  ngOnInit() {
    this.rootForm = this.rootFormGroup.control;
    this.appRoles = this.rootForm.get('appRoles') as FormArray;
    this.updateDataSource();
  }
}
```

**After (React):**
```typescript
// user-app-roles.tsx
import React, { forwardRef } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';

export interface UserAppRolesProps {
  apps: AppType[];
  roles: RoleType[];
  name?: string;
  // ... other props
}

export const UserAppRoles = forwardRef<HTMLDivElement, UserAppRolesProps>(
  ({ apps, roles, name = 'appRoles', ...props }, ref) => {
    const { control, formState } = useFormContext();
    const { fields, append, remove } = useFieldArray({
      control,
      name,
    });
    
    // Component logic here
    
    return (
      <div ref={ref} {...props}>
        {/* Component JSX */}
      </div>
    );
  }
);

UserAppRoles.displayName = 'UserAppRoles';
```

#### 2. Template Migration

**Before (Angular Template):**
```html
<!-- df-user-app-roles.component.html -->
<div class="app-roles-keys-accordion">
  <mat-accordion>
    <mat-expansion-panel>
      <mat-expansion-panel-header>
        <mat-panel-title>{{ 'roles.label' | transloco }}</mat-panel-title>
        <mat-panel-description>
          {{ 'roles.appRoleAssigned' | transloco : { assigned: assignedCount, total: totalCount } }}
        </mat-panel-description>
      </mat-expansion-panel-header>
      
      <ng-container [formGroup]="rootForm">
        <ng-container formArrayName="appRoles">
          <mat-table [dataSource]="dataSource">
            <!-- Table content -->
          </mat-table>
        </ng-container>
      </ng-container>
    </mat-expansion-panel>
  </mat-accordion>
</div>
```

**After (React JSX):**
```typescript
// user-app-roles.tsx JSX portion
const { t } = useTranslation();

return (
  <div className="app-roles-accordion">
    <Disclosure defaultOpen={defaultExpanded}>
      {({ open }) => (
        <>
          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-primary-500 focus-visible:ring-opacity-75">
            <span>{t('roles.label')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('roles.appRoleAssigned', { assigned: assignedCount, total: totalCount })}
            </span>
            <ChevronDownIcon
              className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}
            />
          </Disclosure.Button>
          
          <Disclosure.Panel className="px-4 pt-4 pb-2">
            <div className="overflow-hidden bg-white dark:bg-gray-900 shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                {/* Table content */}
              </table>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  </div>
);
```

#### 3. Form Integration Migration

**Before (Angular Reactive Forms):**
```typescript
// Angular form setup
ngOnInit() {
  this.rootForm = this.rootFormGroup.control;
  this.appRoles = this.rootForm.get('appRoles') as FormArray;
}

add() {
  this.appRoles.push(
    new FormGroup({
      app: new FormControl('', Validators.required),
      role: new FormControl('', Validators.required),
    })
  );
  this.updateDataSource();
}

remove(index: number) {
  this.appRoles.removeAt(index);
  this.updateDataSource();
}
```

**After (React Hook Form):**
```typescript
// React Hook Form setup
const { control, formState } = useFormContext();
const { fields, append, remove } = useFieldArray({
  control,
  name: 'appRoles',
});

const handleAdd = useCallback(() => {
  append({ app: '', role: '' });
}, [append]);

const handleRemove = useCallback((index: number) => {
  remove(index);
}, [remove]);

// Usage in parent component
const form = useForm({
  resolver: zodResolver(userAppRolesSchema),
  defaultValues: {
    appRoles: []
  }
});

return (
  <FormProvider {...form}>
    <UserAppRoles apps={apps} roles={roles} />
  </FormProvider>
);
```

#### 4. Validation Migration

**Before (Angular Validators):**
```typescript
// Angular validation
new FormGroup({
  app: new FormControl('', Validators.required),
  role: new FormControl('', Validators.required),
})

// Custom validator
validateUniqueApps(control: AbstractControl): ValidationErrors | null {
  const appRoles = control.value as AppRoleField[];
  const apps = appRoles.map(ar => ar.app);
  const hasDuplicates = new Set(apps).size !== apps.length;
  return hasDuplicates ? { duplicateApps: true } : null;
}
```

**After (Zod Schemas):**
```typescript
// Zod validation
export const appRoleFieldSchema = z.object({
  app: z.string().min(1, 'Application is required'),
  role: z.string().min(1, 'Role is required'),
});

export const userAppRolesSchema = z.object({
  appRoles: z.array(appRoleFieldSchema)
    .refine(
      (appRoles) => {
        const apps = appRoles.map(ar => ar.app);
        return new Set(apps).size === apps.length;
      },
      {
        message: 'Duplicate applications are not allowed',
        path: ['appRoles'],
      }
    ),
});
```

#### 5. Styling Migration

**Before (SCSS):**
```scss
// df-user-app-roles.component.scss
.app-roles-keys-accordion {
  .mat-expansion-panel {
    box-shadow: none;
    border: 1px solid #e0e0e0;
    
    &:first-child {
      border-radius: 4px 4px 0 0;
    }
    
    &:last-child {
      border-radius: 0 0 4px 4px;
    }
  }
  
  .mat-table {
    background: transparent;
    
    .mat-header-cell,
    .mat-cell {
      border-bottom: 1px solid #e0e0e0;
      padding: 8px 16px;
    }
  }
}
```

**After (Tailwind CSS):**
```typescript
// Tailwind utility classes
const styles = {
  accordion: 'rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
  disclosureButton: 'flex w-full justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  table: 'min-w-full divide-y divide-gray-300 dark:divide-gray-700',
  tableHeader: 'bg-gray-50 dark:bg-gray-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
  tableCell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700'
};
```

### Migration Checklist

- [ ] **Component Structure**
  - [ ] Replace Angular class component with React functional component
  - [ ] Convert @Input decorators to props interface
  - [ ] Replace Angular lifecycle hooks with useEffect hooks
  - [ ] Update import statements and dependencies

- [ ] **Form Integration**
  - [ ] Replace FormGroupDirective with useFormContext
  - [ ] Convert FormArray to useFieldArray hook
  - [ ] Update form control registration
  - [ ] Migrate validation from Angular validators to Zod schemas

- [ ] **UI Components**
  - [ ] Replace MatAccordion with Headless UI Disclosure
  - [ ] Convert MatTable to accessible HTML table
  - [ ] Replace MatAutocomplete with Headless UI Combobox
  - [ ] Update button components with accessibility attributes

- [ ] **Styling**
  - [ ] Convert SCSS styles to Tailwind CSS utilities
  - [ ] Implement dark mode support with CSS variables
  - [ ] Ensure WCAG 2.1 AA color contrast compliance
  - [ ] Add responsive design breakpoints

- [ ] **Functionality**
  - [ ] Test add/remove functionality
  - [ ] Verify autocomplete filtering works correctly
  - [ ] Validate form submission and error handling
  - [ ] Test keyboard navigation and accessibility features

- [ ] **Internationalization**
  - [ ] Replace Angular Transloco with Next.js i18n
  - [ ] Update translation key references
  - [ ] Test language switching functionality

- [ ] **Testing**
  - [ ] Replace Angular TestBed with React Testing Library
  - [ ] Update component tests to use Vitest
  - [ ] Add accessibility tests with jest-axe
  - [ ] Test form integration and validation

## Form Integration

The UserAppRoles component is designed for seamless integration with React Hook Form, providing powerful form management capabilities with type safety and validation.

### React Hook Form Integration

#### Basic Setup

```typescript
import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserAppRoles, userAppRolesSchema } from '@/components/ui/user-app-roles';

interface FormData {
  appRoles: AppRoleField[];
  // ... other form fields
}

function UserManagementForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(z.object({
      appRoles: userAppRolesSchema.shape.appRoles,
      // ... other field schemas
    })),
    defaultValues: {
      appRoles: [],
      // ... other default values
    },
    mode: 'onChange', // Real-time validation
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <UserAppRoles
          apps={apps}
          roles={roles}
          name="appRoles"
        />
        
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}
```

#### Advanced Form Context Usage

```typescript
import { useFormContext, useWatch } from 'react-hook-form';

function ConditionalUserAppRoles() {
  const { control, setValue } = useFormContext();
  
  // Watch for changes in user type to conditionally show app roles
  const userType = useWatch({
    control,
    name: 'userType',
  });
  
  // Watch app roles for dependent field updates
  const appRoles = useWatch({
    control,
    name: 'appRoles',
  });
  
  // Auto-assign default role based on user type
  useEffect(() => {
    if (userType === 'admin' && appRoles.length === 0) {
      setValue('appRoles', [
        { app: 'admin-dashboard', role: 'admin' },
        { app: 'user-management', role: 'admin' },
      ]);
    }
  }, [userType, appRoles.length, setValue]);
  
  // Only show app roles for non-guest users
  if (userType === 'guest') {
    return null;
  }
  
  return (
    <UserAppRoles
      apps={apps}
      roles={roles}
      name="appRoles"
      title={`${userType} Application Access`}
      maxAssignments={userType === 'admin' ? 20 : 5}
    />
  );
}
```

### Custom Validation Patterns

#### Business Logic Validation

```typescript
import { z } from 'zod';

// Custom validation with business rules
const businessRulesSchema = z.object({
  appRoles: z.array(appRoleFieldSchema)
    .refine(
      (appRoles) => {
        // Rule 1: Admin role requires admin application
        const hasAdminRole = appRoles.some(ar => ar.role === 'admin');
        const hasAdminApp = appRoles.some(ar => ar.app === 'admin-dashboard');
        
        if (hasAdminRole && !hasAdminApp) {
          return false;
        }
        return true;
      },
      {
        message: 'Admin role requires access to admin dashboard application',
        path: ['appRoles'],
      }
    )
    .refine(
      (appRoles) => {
        // Rule 2: Billing application requires at least editor role
        const billingApp = appRoles.find(ar => ar.app === 'billing-system');
        if (billingApp && billingApp.role === 'viewer') {
          return false;
        }
        return true;
      },
      {
        message: 'Billing system requires editor or admin role',
        path: ['appRoles'],
      }
    )
    .refine(
      (appRoles) => {
        // Rule 3: Limit concurrent admin assignments
        const adminCount = appRoles.filter(ar => ar.role === 'admin').length;
        return adminCount <= 3;
      },
      {
        message: 'Maximum 3 admin role assignments allowed',
        path: ['appRoles'],
      }
    ),
});

// Usage in form
const form = useForm({
  resolver: zodResolver(businessRulesSchema),
  // ... other options
});
```

#### Real-time Validation with Debouncing

```typescript
import { useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';

function ValidatedUserAppRoles() {
  const { watch, setError, clearErrors } = useFormContext();
  const appRoles = watch('appRoles');
  
  // Debounce validation requests
  const deferredAppRoles = useDeferredValue(appRoles);
  
  // Real-time validation query
  const { data: validationResult, isLoading } = useQuery({
    queryKey: ['validate-app-roles', deferredAppRoles],
    queryFn: async () => {
      if (!deferredAppRoles || deferredAppRoles.length === 0) {
        return { isValid: true, errors: [] };
      }
      
      const response = await fetch('/api/validate-app-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appRoles: deferredAppRoles }),
      });
      
      return response.json();
    },
    enabled: !!deferredAppRoles,
    staleTime: 30000, // 30 seconds
  });
  
  // Update form errors based on validation result
  useEffect(() => {
    if (validationResult?.errors) {
      validationResult.errors.forEach((error: any) => {
        setError(`appRoles.${error.index}.${error.field}`, {
          type: 'server',
          message: error.message,
        });
      });
    } else {
      clearErrors('appRoles');
    }
  }, [validationResult, setError, clearErrors]);
  
  return (
    <div className="relative">
      <UserAppRoles
        apps={apps}
        roles={roles}
        name="appRoles"
        disabled={isLoading}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  );
}
```

### Error Handling and Display

#### Field-Level Error Display

```typescript
import { useFormContext } from 'react-hook-form';
import { get } from 'lodash';

function UserAppRolesWithErrors() {
  const { formState: { errors } } = useFormContext();
  
  // Extract app roles specific errors
  const appRolesErrors = get(errors, 'appRoles');
  const globalError = appRolesErrors?.message;
  const fieldErrors = appRolesErrors?.type === 'array' ? appRolesErrors : null;
  
  return (
    <div>
      <UserAppRoles
        apps={apps}
        roles={roles}
        name="appRoles"
        error={globalError}
      />
      
      {/* Display field-specific errors */}
      {fieldErrors && (
        <div className="mt-2 space-y-1">
          {Object.entries(fieldErrors).map(([index, fieldError]: [string, any]) => (
            <div key={index} className="text-sm text-error-600">
              <strong>Row {parseInt(index) + 1}:</strong>
              {fieldError.app && <span className="ml-1">App - {fieldError.app.message}</span>}
              {fieldError.role && <span className="ml-1">Role - {fieldError.role.message}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### Custom Error Messages

```typescript
const customErrorMessages = {
  required: 'This field cannot be empty',
  duplicate: 'This application is already assigned',
  unauthorized: 'You do not have permission to assign this role',
  maxAssignments: 'Maximum number of assignments reached',
  businessRule: 'This combination violates business rules',
  networkError: 'Unable to validate assignment. Please try again.',
};

// Usage in validation schema
const userAppRolesSchema = z.object({
  appRoles: z.array(appRoleFieldSchema)
    .min(1, customErrorMessages.required)
    .max(10, customErrorMessages.maxAssignments)
    .refine(
      (appRoles) => {
        const apps = appRoles.map(ar => ar.app);
        return new Set(apps).size === apps.length;
      },
      {
        message: customErrorMessages.duplicate,
        path: ['appRoles'],
      }
    ),
});
```

## Theming & Customization

The UserAppRoles component supports comprehensive theming and customization options, including dark mode support, custom styling, and design system integration.

### Theme Integration

#### Dark Mode Support

```typescript
import { useTheme } from '@/components/providers/theme-provider';

function ThemedUserAppRoles(props: UserAppRolesProps) {
  const { resolvedTheme } = useTheme();
  
  const themeClasses = {
    light: {
      container: 'bg-white border-gray-200 text-gray-900',
      disclosure: 'bg-gray-50 hover:bg-gray-100 text-gray-900',
      table: 'bg-white divide-gray-200',
      input: 'bg-white border-gray-300 text-gray-900 focus:border-primary-500',
      button: 'bg-primary-600 text-white hover:bg-primary-700',
    },
    dark: {
      container: 'bg-gray-900 border-gray-700 text-gray-100',
      disclosure: 'bg-gray-800 hover:bg-gray-700 text-gray-100',
      table: 'bg-gray-900 divide-gray-700',
      input: 'bg-gray-800 border-gray-600 text-gray-100 focus:border-primary-400',
      button: 'bg-primary-600 text-white hover:bg-primary-700',
    },
  };
  
  const currentTheme = themeClasses[resolvedTheme];
  
  return (
    <UserAppRoles
      {...props}
      className={cn(
        currentTheme.container,
        'rounded-lg shadow-sm transition-colors duration-200',
        props.className
      )}
    />
  );
}
```

#### Custom Color Schemes

```typescript
// Define custom color schemes
const colorSchemes = {
  default: {
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    error: 'error',
  },
  healthcare: {
    primary: 'blue',
    success: 'teal',
    warning: 'amber',
    error: 'red',
  },
  finance: {
    primary: 'indigo',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  },
  education: {
    primary: 'purple',
    success: 'emerald',
    warning: 'orange',
    error: 'rose',
  },
};

interface ThemedUserAppRolesProps extends UserAppRolesProps {
  colorScheme?: keyof typeof colorSchemes;
}

function CustomThemedUserAppRoles({ 
  colorScheme = 'default', 
  ...props 
}: ThemedUserAppRolesProps) {
  const colors = colorSchemes[colorScheme];
  
  const customStyles = {
    '--color-primary': `var(--color-${colors.primary}-500)`,
    '--color-primary-hover': `var(--color-${colors.primary}-600)`,
    '--color-success': `var(--color-${colors.success}-500)`,
    '--color-warning': `var(--color-${colors.warning}-500)`,
    '--color-error': `var(--color-${colors.error}-500)`,
  } as React.CSSProperties;
  
  return (
    <div style={customStyles}>
      <UserAppRoles
        {...props}
        className={cn(
          // Use CSS custom properties for theming
          '[--btn-primary:var(--color-primary)] [--btn-primary-hover:var(--color-primary-hover)]',
          '[--text-success:var(--color-success)] [--text-error:var(--color-error)]',
          props.className
        )}
      />
    </div>
  );
}
```

### Component Variants

#### Size Variants

```typescript
const sizeVariants = {
  sm: {
    container: 'text-sm',
    disclosure: 'px-3 py-2 text-sm',
    table: 'text-sm',
    input: 'px-2 py-1 text-sm min-h-[36px]',
    button: 'h-8 w-8 text-sm',
    spacing: 'space-y-2',
  },
  md: {
    container: 'text-base',
    disclosure: 'px-4 py-3 text-sm',
    table: 'text-sm',
    input: 'px-3 py-2 text-sm min-h-[44px]',
    button: 'h-10 w-10 text-base',
    spacing: 'space-y-3',
  },
  lg: {
    container: 'text-lg',
    disclosure: 'px-5 py-4 text-base',
    table: 'text-base',
    input: 'px-4 py-3 text-base min-h-[48px]',
    button: 'h-12 w-12 text-lg',
    spacing: 'space-y-4',
  },
};

// Usage
<UserAppRoles
  apps={apps}
  roles={roles}
  size="lg"
  className="max-w-6xl" // Larger container for lg size
/>
```

#### Visual Variants

```typescript
const visualVariants = {
  default: {
    container: 'border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm',
    disclosure: 'bg-gray-50 dark:bg-gray-800',
    table: 'border-t border-gray-200 dark:border-gray-700',
  },
  minimal: {
    container: 'border-0 shadow-none',
    disclosure: 'bg-transparent border-b border-gray-200 dark:border-gray-700 rounded-none',
    table: 'border-0',
  },
  card: {
    container: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg',
    disclosure: 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700',
    table: 'bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
  },
  outlined: {
    container: 'border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent',
    disclosure: 'bg-transparent border-b-2 border-gray-300 dark:border-gray-600 rounded-none',
    table: 'border-2 border-gray-300 dark:border-gray-600 rounded-lg',
  },
};

// Usage
<UserAppRoles
  apps={apps}
  roles={roles}
  variant="card"
  className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90"
/>
```

### Custom Styling Hooks

#### CSS-in-JS Integration

```typescript
import { styled } from '@/lib/styled-components'; // Example styled-components integration

const StyledUserAppRoles = styled(UserAppRoles)<{ 
  brand?: 'default' | 'healthcare' | 'finance' 
}>`
  /* Base styles */
  .disclosure-button {
    background: linear-gradient(
      135deg,
      ${props => props.theme.colors.primary[500]},
      ${props => props.theme.colors.primary[600]}
    );
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background: linear-gradient(
        135deg,
        ${props => props.theme.colors.primary[600]},
        ${props => props.theme.colors.primary[700]}
      );
      transform: translateY(-1px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
  }
  
  /* Brand-specific customizations */
  ${props => props.brand === 'healthcare' && `
    .disclosure-button {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
    }
    
    .table-row:hover {
      background: rgba(14, 165, 233, 0.05);
    }
  `}
  
  ${props => props.brand === 'finance' && `
    .disclosure-button {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
    }
    
    .add-button {
      background: linear-gradient(135deg, #059669, #047857);
    }
  `}
`;

// Usage
<StyledUserAppRoles
  apps={apps}
  roles={roles}
  brand="healthcare"
/>
```

#### Tailwind CSS Custom Utilities

```typescript
// tailwind.config.ts additions
module.exports = {
  theme: {
    extend: {
      animation: {
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in-scale': 'fadeInScale 0.2s ease-out',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeInScale: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Custom plugin for UserAppRoles component
    function({ addComponents, theme }) {
      addComponents({
        '.user-app-roles': {
          // Base component styles
          '--disclosure-bg': theme('colors.gray.50'),
          '--disclosure-hover-bg': theme('colors.gray.100'),
          '--table-border': theme('colors.gray.200'),
          
          // Dark mode overrides
          '@media (prefers-color-scheme: dark)': {
            '--disclosure-bg': theme('colors.gray.800'),
            '--disclosure-hover-bg': theme('colors.gray.700'),
            '--table-border': theme('colors.gray.700'),
          },
        },
        
        '.user-app-roles-disclosure': {
          'background-color': 'var(--disclosure-bg)',
          'transition': 'all 0.2s ease',
          
          '&:hover': {
            'background-color': 'var(--disclosure-hover-bg)',
          },
          
          '&[data-state="open"]': {
            'border-bottom-left-radius': '0',
            'border-bottom-right-radius': '0',
          },
        },
        
        '.user-app-roles-table': {
          'border-color': 'var(--table-border)',
          'animation': 'slide-down 0.3s ease-out',
        },
      });
    },
  ],
};

// Usage with custom utilities
<UserAppRoles
  apps={apps}
  roles={roles}
  className="user-app-roles border-2 border-primary-200 dark:border-primary-800"
/>
```

## Performance Optimization

The UserAppRoles component is optimized for handling large datasets and complex form interactions while maintaining smooth user experience and accessibility.

### Large Dataset Handling

#### Virtual Scrolling for Large Lists

```typescript
import { FixedSizeList as List } from 'react-window';
import { useMemo } from 'react';

interface VirtualizedUserAppRolesProps extends UserAppRolesProps {
  virtualized?: boolean;
  itemHeight?: number;
  maxHeight?: number;
}

function VirtualizedUserAppRoles({
  apps,
  roles,
  virtualized = false,
  itemHeight = 72,
  maxHeight = 400,
  ...props
}: VirtualizedUserAppRolesProps) {
  const { fields } = useFieldArray({ name: 'appRoles' });
  
  // Memoize filtered options for performance
  const availableApps = useMemo(() => {
    const assignedApps = new Set(fields.map(field => field.app));
    return apps.filter(app => !assignedApps.has(app.name));
  }, [apps, fields]);
  
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const field = fields[index];
    
    return (
      <div style={style} className="flex items-center space-x-4 px-4">
        <AppRoleRow
          index={index}
          field={field}
          apps={availableApps}
          roles={roles}
          onRemove={remove}
        />
      </div>
    );
  }, [fields, availableApps, roles, remove]);
  
  if (!virtualized || fields.length < 20) {
    // Use regular rendering for small lists
    return <UserAppRoles {...props} apps={apps} roles={roles} />;
  }
  
  return (
    <div className="user-app-roles-virtualized">
      <DisclosureHeader 
        title={props.title}
        assignedCount={fields.length}
        totalCount={apps.length}
      />
      
      <List
        height={Math.min(maxHeight, fields.length * itemHeight)}
        itemCount={fields.length}
        itemSize={itemHeight}
        itemData={{ fields, availableApps, roles }}
        className="border border-gray-200 dark:border-gray-700 rounded-lg"
      >
        {Row}
      </List>
      
      <AddNewAppRoleButton 
        availableApps={availableApps}
        roles={roles}
        onAdd={append}
        disabled={availableApps.length === 0}
      />
    </div>
  );
}
```

#### Memoization and Optimization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize individual app role rows to prevent unnecessary re-renders
const AppRoleRow = memo<{
  index: number;
  field: AppRoleField;
  apps: AppType[];
  roles: RoleType[];
  onRemove: (index: number) => void;
}>(({ index, field, apps, roles, onRemove }) => {
  const handleRemove = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);
  
  // Memoize filtered options based on current field value
  const availableApps = useMemo(() => {
    return apps.filter(app => app.name === field.app || !field.app);
  }, [apps, field.app]);
  
  const availableRoles = useMemo(() => {
    return roles.filter(role => role.isActive);
  }, [roles]);
  
  return (
    <tr className="app-role-row">
      <td>
        <AutocompleteField
          name={`appRoles.${index}.app`}
          options={availableApps}
          placeholder="Select application"
          renderOption={(app) => (
            <div className="flex items-center space-x-2">
              <span className="font-medium">{app.name}</span>
              <span className="text-sm text-gray-500">{app.description}</span>
            </div>
          )}
        />
      </td>
      <td>
        <AutocompleteField
          name={`appRoles.${index}.role`}
          options={availableRoles}
          placeholder="Select role"
          renderOption={(role) => (
            <div className="flex items-center space-x-2">
              <span className="font-medium">{role.name}</span>
              <span className="text-sm text-gray-500">{role.description}</span>
            </div>
          )}
        />
      </td>
      <td>
        <button
          type="button"
          onClick={handleRemove}
          className="btn-accessible btn-danger-outline h-10 w-10"
          aria-label={`Remove ${field.app || 'application'} assignment`}
        >
          <FontAwesomeIcon icon={faTrashCan} className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
});

AppRoleRow.displayName = 'AppRoleRow';
```

### Debounced Search and Filtering

```typescript
import { useDeferredValue, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

function OptimizedAutocomplete({
  options,
  searchTerm,
  onSearchChange,
  ...props
}: AutocompleteProps) {
  // Debounce search input to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  const deferredSearchTerm = useDeferredValue(debouncedSearchTerm);
  
  // Memoize filtered options with optimized search algorithm
  const filteredOptions = useMemo(() => {
    if (!deferredSearchTerm) return options;
    
    const term = deferredSearchTerm.toLowerCase();
    
    // Implement fuzzy search for better UX
    return options.filter(option => {
      const name = option.name.toLowerCase();
      const description = option.description?.toLowerCase() || '';
      
      // Exact match (highest priority)
      if (name === term) return true;
      
      // Starts with match (high priority)
      if (name.startsWith(term)) return true;
      
      // Contains match (medium priority)
      if (name.includes(term) || description.includes(term)) return true;
      
      // Fuzzy match (low priority)
      return fuzzyMatch(name, term) || fuzzyMatch(description, term);
    }).slice(0, 50); // Limit results for performance
  }, [options, deferredSearchTerm]);
  
  return (
    <AutocompleteField
      {...props}
      options={filteredOptions}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
    />
  );
}

// Simple fuzzy matching algorithm
function fuzzyMatch(text: string, pattern: string): boolean {
  let patternIndex = 0;
  
  for (let i = 0; i < text.length && patternIndex < pattern.length; i++) {
    if (text[i] === pattern[patternIndex]) {
      patternIndex++;
    }
  }
  
  return patternIndex === pattern.length;
}
```

### Real-time Validation Performance

```typescript
import { useCallback, useRef } from 'react';

function usePerformantValidation() {
  const validationTimeoutRef = useRef<NodeJS.Timeout>();
  const validationCache = useRef<Map<string, ValidationResult>>(new Map());
  
  const validateAppRoles = useCallback(async (appRoles: AppRoleField[]): Promise<ValidationResult> => {
    // Create cache key from app roles
    const cacheKey = JSON.stringify(appRoles.map(ar => ({ app: ar.app, role: ar.role })));
    
    // Return cached result if available
    if (validationCache.current.has(cacheKey)) {
      return validationCache.current.get(cacheKey)!;
    }
    
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Debounce validation request
    return new Promise((resolve) => {
      validationTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await performValidation(appRoles);
          
          // Cache successful validation results
          validationCache.current.set(cacheKey, result);
          
          // Limit cache size to prevent memory leaks
          if (validationCache.current.size > 100) {
            const firstKey = validationCache.current.keys().next().value;
            validationCache.current.delete(firstKey);
          }
          
          resolve(result);
        } catch (error) {
          resolve({ isValid: false, errors: ['Validation failed'] });
        }
      }, 300); // 300ms debounce
    });
  }, []);
  
  return { validateAppRoles };
}

async function performValidation(appRoles: AppRoleField[]): Promise<ValidationResult> {
  // Implement actual validation logic
  const response = await fetch('/api/validate-app-roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appRoles }),
  });
  
  if (!response.ok) {
    throw new Error('Validation request failed');
  }
  
  return response.json();
}
```

### Bundle Size Optimization

#### Code Splitting and Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy autocomplete component
const AutocompleteField = lazy(() => import('./autocomplete-field').then(module => ({
  default: module.AutocompleteField
})));

// Lazy load complex validation utilities
const ValidationUtils = lazy(() => import('./validation-utils'));

function UserAppRoles(props: UserAppRolesProps) {
  return (
    <div className="user-app-roles">
      <Suspense fallback={<SkeletonLoader />}>
        <UserAppRolesContent {...props} />
      </Suspense>
    </div>
  );
}

function UserAppRolesContent(props: UserAppRolesProps) {
  return (
    <Disclosure>
      {/* ... other content ... */}
      <Suspense fallback={<div className="h-12 bg-gray-100 animate-pulse rounded" />}>
        <AutocompleteField
          options={props.apps}
          placeholder="Select application"
        />
      </Suspense>
    </Disclosure>
  );
}
```

#### Tree-shaking Optimizations

```typescript
// Optimize imports to enable tree-shaking
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons/faTrashCan';

// Instead of importing the entire icon library
// import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';

// Use specific utility imports
import { clsx } from 'clsx/lite'; // Lighter version of clsx
import { debounce } from 'lodash-es/debounce'; // ES modules version for tree-shaking

// Export only what's needed from component
export { UserAppRoles } from './user-app-roles';
export type { UserAppRolesProps, AppRoleField } from './user-app-roles.types';

// Don't export internal utilities unless needed
// export { internalHelper } from './internal-utils';
```

## Internationalization

The UserAppRoles component fully supports internationalization with Next.js i18n patterns, including right-to-left (RTL) language support and dynamic locale switching.

### Next.js i18n Integration

#### Basic Setup

```typescript
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja'],
    defaultLocale: 'en',
    domains: [
      {
        domain: 'example.com',
        defaultLocale: 'en',
      },
      {
        domain: 'example.es',
        defaultLocale: 'es',
      },
    ],
  },
};

// Translation hook integration
import { useTranslation } from 'next-i18next';

function LocalizedUserAppRoles(props: UserAppRolesProps) {
  const { t, i18n } = useTranslation('common');
  
  return (
    <UserAppRoles
      {...props}
      title={t('userAppRoles.title')}
      description={t('userAppRoles.description')}
      searchPlaceholder={t('userAppRoles.searchPlaceholder')}
      aria-label={t('userAppRoles.ariaLabel')}
    />
  );
}
```

#### Translation Files Structure

```json
// public/locales/en/common.json
{
  "userAppRoles": {
    "title": "Application Role Assignments",
    "description": "Assign applications to roles for this user",
    "searchPlaceholder": "Search applications and roles...",
    "ariaLabel": "Application role management interface",
    "addButton": "Add new application role",
    "removeButton": "Remove application role",
    "appField": {
      "label": "Application",
      "placeholder": "Select application",
      "required": "Application is required",
      "notFound": "No applications found"
    },
    "roleField": {
      "label": "Role",
      "placeholder": "Select role", 
      "required": "Role is required",
      "notFound": "No roles found"
    },
    "validation": {
      "duplicateApp": "This application is already assigned",
      "maxAssignments": "Maximum {{count}} assignments allowed",
      "businessRule": "This combination violates business rules",
      "unauthorized": "You do not have permission to assign this role"
    },
    "status": {
      "assigned": "{{assigned}} of {{total}} applications assigned",
      "loading": "Loading applications...",
      "saving": "Saving changes...",
      "saved": "Changes saved successfully",
      "error": "Failed to save changes"
    },
    "actions": {
      "expand": "Expand application roles section",
      "collapse": "Collapse application roles section",
      "add": "Add application role",
      "remove": "Remove application role for {{app}}",
      "clear": "Clear selection",
      "selectAll": "Select all applications"
    }
  }
}

// public/locales/es/common.json
{
  "userAppRoles": {
    "title": "Asignaciones de Roles de Aplicación",
    "description": "Asignar aplicaciones a roles para este usuario",
    "searchPlaceholder": "Buscar aplicaciones y roles...",
    "ariaLabel": "Interfaz de gestión de roles de aplicación",
    "addButton": "Agregar nuevo rol de aplicación",
    "removeButton": "Eliminar rol de aplicación",
    "appField": {
      "label": "Aplicación",
      "placeholder": "Seleccionar aplicación",
      "required": "La aplicación es requerida",
      "notFound": "No se encontraron aplicaciones"
    },
    "roleField": {
      "label": "Rol",
      "placeholder": "Seleccionar rol",
      "required": "El rol es requerido", 
      "notFound": "No se encontraron roles"
    },
    "validation": {
      "duplicateApp": "Esta aplicación ya está asignada",
      "maxAssignments": "Máximo {{count}} asignaciones permitidas",
      "businessRule": "Esta combinación viola las reglas de negocio",
      "unauthorized": "No tienes permisos para asignar este rol"
    },
    "status": {
      "assigned": "{{assigned}} de {{total}} aplicaciones asignadas",
      "loading": "Cargando aplicaciones...",
      "saving": "Guardando cambios...",
      "saved": "Cambios guardados exitosamente",
      "error": "Error al guardar cambios"
    },
    "actions": {
      "expand": "Expandir sección de roles de aplicación",
      "collapse": "Contraer sección de roles de aplicación", 
      "add": "Agregar rol de aplicación",
      "remove": "Eliminar rol de aplicación para {{app}}",
      "clear": "Limpiar selección",
      "selectAll": "Seleccionar todas las aplicaciones"
    }
  }
}
```

#### RTL Language Support

```typescript
import { useRouter } from 'next/router';
import { useDirection } from '@/hooks/use-direction';

function RTLSupportedUserAppRoles(props: UserAppRolesProps) {
  const { locale } = useRouter();
  const direction = useDirection(locale);
  
  // RTL languages list
  const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
  const isRTL = rtlLanguages.includes(locale || 'en');
  
  const rtlClasses = {
    container: isRTL ? 'rtl' : 'ltr',
    text: isRTL ? 'text-right' : 'text-left',
    icon: isRTL ? 'scale-x-[-1]' : '', // Flip icons for RTL
    spacing: isRTL ? 'space-x-reverse' : '',
    flex: isRTL ? 'flex-row-reverse' : 'flex-row',
  };
  
  return (
    <div dir={direction} className={cn('user-app-roles', rtlClasses.container)}>
      <UserAppRoles
        {...props}
        className={cn(
          rtlClasses.text,
          rtlClasses.spacing,
          props.className
        )}
      />
    </div>
  );
}

// Direction hook implementation
function useDirection(locale?: string) {
  return useMemo(() => {
    const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
    return rtlLanguages.includes(locale || 'en') ? 'rtl' : 'ltr';
  }, [locale]);
}
```

### Dynamic Content Localization

#### Pluralization Support

```typescript
import { useTranslation } from 'next-i18next';

function LocalizedStatus({ assignedCount, totalCount }: {
  assignedCount: number;
  totalCount: number;
}) {
  const { t } = useTranslation('common');
  
  return (
    <div className="text-sm text-gray-600 dark:text-gray-400">
      {/* Pluralization with count interpolation */}
      {t('userAppRoles.status.assigned', {
        assigned: assignedCount,
        total: totalCount,
        count: assignedCount // Used for pluralization rules
      })}
      
      {/* Different message based on count */}
      {assignedCount === 0 && (
        <span className="block mt-1 text-orange-600">
          {t('userAppRoles.status.noAssignments')}
        </span>
      )}
      
      {assignedCount === totalCount && (
        <span className="block mt-1 text-green-600">
          {t('userAppRoles.status.allAssigned')}
        </span>
      )}
    </div>
  );
}
```

#### Date and Number Formatting

```typescript
import { useIntl } from 'react-intl';

function LocalizedAppRoleDisplay({ appRole, createdDate }: {
  appRole: AppRoleField;
  createdDate: Date;
}) {
  const intl = useIntl();
  
  // Format dates according to locale
  const formattedDate = intl.formatDate(createdDate, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Format relative time
  const relativeTime = intl.formatRelativeTime(
    Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)),
    'day'
  );
  
  return (
    <div className="app-role-display">
      <div className="font-medium">{appRole.app}</div>
      <div className="text-sm text-gray-600">
        Role: {appRole.role}
      </div>
      <div className="text-xs text-gray-500">
        Created: {formattedDate} ({relativeTime})
      </div>
    </div>
  );
}
```

### Accessibility and Localization

#### Screen Reader Announcements in Multiple Languages

```typescript
function useLocalizedAnnouncements() {
  const { t } = useTranslation('common');
  
  const announceToScreenReader = useCallback((
    messageKey: string, 
    interpolation?: Record<string, any>,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const message = t(messageKey, interpolation);
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Clean up after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, [t]);
  
  return {
    announceAdd: (app: string, role: string) => 
      announceToScreenReader('userAppRoles.announcements.added', { app, role }),
    announceRemove: (app: string) => 
      announceToScreenReader('userAppRoles.announcements.removed', { app }),
    announceError: (error: string) => 
      announceToScreenReader('userAppRoles.announcements.error', { error }, 'assertive'),
    announceSuccess: (message: string) => 
      announceToScreenReader('userAppRoles.announcements.success', { message }),
  };
}
```

## Testing Guidelines

Comprehensive testing strategies for the UserAppRoles component, covering unit tests, integration tests, accessibility testing, and visual regression testing.

### Unit Testing with Vitest

#### Basic Component Testing

```typescript
// user-app-roles.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserAppRoles, userAppRolesSchema } from './user-app-roles';

// Test data
const mockApps = [
  { id: 1, name: 'admin-app', description: 'Admin Dashboard', isActive: true },
  { id: 2, name: 'user-portal', description: 'User Portal', isActive: true },
  { id: 3, name: 'api-docs', description: 'API Documentation', isActive: true },
];

const mockRoles = [
  { id: 1, name: 'admin', description: 'Administrator', isActive: true },
  { id: 2, name: 'editor', description: 'Content Editor', isActive: true },
  { id: 3, name: 'viewer', description: 'Read Only', isActive: true },
];

// Test wrapper component
function TestWrapper({ 
  children, 
  defaultValues = { appRoles: [] } 
}: { 
  children: React.ReactNode;
  defaultValues?: any;
}) {
  const methods = useForm({
    resolver: zodResolver(userAppRolesSchema),
    defaultValues,
  });
  
  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
}

describe('UserAppRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Application Role Assignments')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 applications assigned')).toBeInTheDocument();
  });
  
  it('allows adding new app role assignments', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    // Click add button
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    // Should add new row with empty fields
    expect(screen.getByRole('combobox', { name: /application/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument();
  });
  
  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    // Add new row and try to submit without filling fields
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    // Trigger validation by focusing and blurring fields
    const appField = screen.getByRole('combobox', { name: /application/i });
    await user.click(appField);
    await user.tab(); // Move focus away to trigger validation
    
    await waitFor(() => {
      expect(screen.getByText('Application is required')).toBeInTheDocument();
    });
  });
  
  it('prevents duplicate application assignments', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper defaultValues={{
        appRoles: [{ app: 'admin-app', role: 'admin' }]
      }}>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    // Try to add the same app again
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    // The admin-app should not be available in the dropdown
    const appField = screen.getAllByRole('combobox', { name: /application/i })[1];
    await user.click(appField);
    
    // Admin app should not be in the options
    expect(screen.queryByText('admin-app')).not.toBeInTheDocument();
    expect(screen.getByText('user-portal')).toBeInTheDocument();
    expect(screen.getByText('api-docs')).toBeInTheDocument();
  });
  
  it('removes app role assignments', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper defaultValues={{
        appRoles: [
          { app: 'admin-app', role: 'admin' },
          { app: 'user-portal', role: 'editor' }
        ]
      }}>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    expect(screen.getByText('2 of 3 applications assigned')).toBeInTheDocument();
    
    // Remove first assignment
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('1 of 3 applications assigned')).toBeInTheDocument();
    });
  });
});
```

#### Advanced Testing Scenarios

```typescript
describe('UserAppRoles - Advanced Scenarios', () => {
  it('handles keyboard navigation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    // Test tab navigation
    await user.tab(); // Focus disclosure button
    expect(screen.getByRole('button', { name: /application role assignments/i })).toHaveFocus();
    
    await user.keyboard('{Enter}'); // Expand disclosure
    await user.tab(); // Focus add button
    expect(screen.getByRole('button', { name: /add new application role/i })).toHaveFocus();
    
    await user.keyboard('{Enter}'); // Add new row
    await user.tab(); // Focus app field
    expect(screen.getByRole('combobox', { name: /application/i })).toHaveFocus();
    
    // Test arrow key navigation in combobox
    await user.keyboard('{ArrowDown}'); // Open dropdown
    await user.keyboard('{ArrowDown}'); // Navigate to first option
    await user.keyboard('{Enter}'); // Select option
    
    await user.tab(); // Move to role field
    expect(screen.getByRole('combobox', { name: /role/i })).toHaveFocus();
  });
  
  it('handles search and filtering in autocomplete', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    const appField = screen.getByRole('combobox', { name: /application/i });
    await user.click(appField);
    
    // Type to filter options
    await user.type(appField, 'admin');
    
    await waitFor(() => {
      expect(screen.getByText('admin-app')).toBeInTheDocument();
      expect(screen.queryByText('user-portal')).not.toBeInTheDocument();
    });
    
    // Clear search and verify all options return
    await user.clear(appField);
    await user.click(appField);
    
    await waitFor(() => {
      expect(screen.getByText('admin-app')).toBeInTheDocument();
      expect(screen.getByText('user-portal')).toBeInTheDocument();
      expect(screen.getByText('api-docs')).toBeInTheDocument();
    });
  });
  
  it('respects maxAssignments limit', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles 
          apps={mockApps} 
          roles={mockRoles} 
          maxAssignments={2}
        />
      </TestWrapper>
    );
    
    // Add first assignment
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    // Add second assignment
    await user.click(addButton);
    
    // Add button should now be disabled
    expect(addButton).toBeDisabled();
    
    // Should show max assignments message
    expect(screen.getByText(/maximum.*assignments/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

#### Form Integration Tests

```typescript
describe('UserAppRoles - Form Integration', () => {
  it('integrates correctly with parent form submission', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    
    function TestForm() {
      const methods = useForm({
        resolver: zodResolver(z.object({
          userName: z.string().min(1),
          appRoles: userAppRolesSchema.shape.appRoles,
        })),
        defaultValues: {
          userName: '',
          appRoles: [],
        },
      });
      
      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <input {...methods.register('userName')} placeholder="User name" />
            <UserAppRoles apps={mockApps} roles={mockRoles} />
            <button type="submit">Submit</button>
          </form>
        </FormProvider>
      );
    }
    
    render(<TestForm />);
    
    // Fill out form
    await user.type(screen.getByPlaceholderText('User name'), 'John Doe');
    
    // Add app role
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    const appField = screen.getByRole('combobox', { name: /application/i });
    await user.click(appField);
    await user.click(screen.getByText('admin-app'));
    
    const roleField = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleField);
    await user.click(screen.getByText('admin'));
    
    // Submit form
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        userName: 'John Doe',
        appRoles: [{ app: 'admin-app', role: 'admin' }],
      });
    });
  });
  
  it('validates with custom business rules', async () => {
    const user = userEvent.setup();
    
    const businessRulesSchema = z.object({
      appRoles: z.array(appRoleFieldSchema)
        .refine(
          (appRoles) => {
            const hasAdminApp = appRoles.some(ar => ar.app === 'admin-app');
            const hasAdminRole = appRoles.some(ar => ar.role === 'admin');
            return !hasAdminApp || hasAdminRole;
          },
          'Admin application requires admin role'
        ),
    });
    
    function TestForm() {
      const methods = useForm({
        resolver: zodResolver(businessRulesSchema),
        defaultValues: { appRoles: [] },
      });
      
      return (
        <FormProvider {...methods}>
          <form>
            <UserAppRoles apps={mockApps} roles={mockRoles} />
            <div data-testid="errors">
              {methods.formState.errors.appRoles?.message}
            </div>
          </form>
        </FormProvider>
      );
    }
    
    render(<TestForm />);
    
    // Add admin app with non-admin role
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    const appField = screen.getByRole('combobox', { name: /application/i });
    await user.click(appField);
    await user.click(screen.getByText('admin-app'));
    
    const roleField = screen.getByRole('combobox', { name: /role/i });
    await user.click(roleField);
    await user.click(screen.getByText('editor')); // Non-admin role
    
    await waitFor(() => {
      expect(screen.getByTestId('errors')).toHaveTextContent(
        'Admin application requires admin role'
      );
    });
  });
});
```

### Accessibility Testing

#### WCAG Compliance Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('UserAppRoles - Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('has proper ARIA labels and roles', () => {
    render(
      <TestWrapper>
        <UserAppRoles 
          apps={mockApps} 
          roles={mockRoles}
          aria-label="Application role management interface"
        />
      </TestWrapper>
    );
    
    // Check disclosure button ARIA attributes
    const disclosureButton = screen.getByRole('button', { 
      name: /application role assignments/i 
    });
    expect(disclosureButton).toHaveAttribute('aria-expanded');
    expect(disclosureButton).toHaveAttribute('aria-controls');
    
    // Check table structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveAttribute('aria-label');
    
    // Check form field labels
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    fireEvent.click(addButton);
    
    const appField = screen.getByRole('combobox', { name: /application/i });
    expect(appField).toHaveAttribute('aria-label');
    expect(appField).toHaveAttribute('aria-expanded');
    expect(appField).toHaveAttribute('aria-autocomplete');
  });
  
  it('supports screen reader announcements', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    // Add new assignment
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    // Check for live region announcements
    await waitFor(() => {
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toBeInTheDocument();
    });
  });
  
  it('maintains focus management', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <UserAppRoles apps={mockApps} roles={mockRoles} />
      </TestWrapper>
    );
    
    // Add and remove assignment to test focus restoration
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    // Focus should return to add button after removal
    await waitFor(() => {
      expect(addButton).toHaveFocus();
    });
  });
});
```

### Visual Regression Testing

#### Playwright Visual Tests

```typescript
// e2e/user-app-roles.spec.ts
import { test, expect } from '@playwright/test';

test.describe('UserAppRoles Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/user-app-roles');
    await page.waitForLoadState('networkidle');
  });
  
  test('renders correctly in light mode', async ({ page }) => {
    await expect(page.locator('[data-testid="user-app-roles"]')).toHaveScreenshot(
      'user-app-roles-light.png'
    );
  });
  
  test('renders correctly in dark mode', async ({ page }) => {
    await page.click('[data-testid="theme-toggle"]');
    await page.waitForTimeout(500); // Wait for theme transition
    
    await expect(page.locator('[data-testid="user-app-roles"]')).toHaveScreenshot(
      'user-app-roles-dark.png'
    );
  });
  
  test('shows expanded state correctly', async ({ page }) => {
    await page.click('[data-testid="disclosure-button"]');
    await page.waitForTimeout(300); // Wait for animation
    
    await expect(page.locator('[data-testid="user-app-roles"]')).toHaveScreenshot(
      'user-app-roles-expanded.png'
    );
  });
  
  test('shows form with assignments', async ({ page }) => {
    // Expand disclosure
    await page.click('[data-testid="disclosure-button"]');
    
    // Add assignment
    await page.click('[data-testid="add-button"]');
    
    // Fill in app field
    await page.click('[data-testid="app-field"]');
    await page.click('text=admin-app');
    
    // Fill in role field
    await page.click('[data-testid="role-field"]');
    await page.click('text=admin');
    
    await expect(page.locator('[data-testid="user-app-roles"]')).toHaveScreenshot(
      'user-app-roles-with-assignment.png'
    );
  });
  
  test('shows error states correctly', async ({ page }) => {
    // Add empty assignment to trigger validation
    await page.click('[data-testid="disclosure-button"]');
    await page.click('[data-testid="add-button"]');
    
    // Trigger validation by focusing and blurring
    await page.click('[data-testid="app-field"]');
    await page.press('[data-testid="app-field"]', 'Tab');
    
    // Wait for validation error to appear
    await page.waitForSelector('text=Application is required');
    
    await expect(page.locator('[data-testid="user-app-roles"]')).toHaveScreenshot(
      'user-app-roles-validation-error.png'
    );
  });
});
```

### Performance Testing

```typescript
describe('UserAppRoles - Performance', () => {
  it('handles large datasets efficiently', async () => {
    // Generate large dataset
    const largeAppList = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `app-${i + 1}`,
      description: `Application ${i + 1}`,
      isActive: true,
    }));
    
    const largeRoleList = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `role-${i + 1}`,
      description: `Role ${i + 1}`,
      isActive: true,
    }));
    
    const startTime = performance.now();
    
    render(
      <TestWrapper>
        <UserAppRoles 
          apps={largeAppList} 
          roles={largeRoleList}
          virtualized={true}
        />
      </TestWrapper>
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render large dataset in under 100ms
    expect(renderTime).toBeLessThan(100);
    
    // Component should still be interactive
    expect(screen.getByRole('button', { name: /add new application role/i }))
      .toBeInTheDocument();
  });
  
  it('debounces search input efficiently', async () => {
    const user = userEvent.setup();
    const mockFilter = vi.fn();
    
    render(
      <TestWrapper>
        <UserAppRoles 
          apps={mockApps} 
          roles={mockRoles}
          onSearchChange={mockFilter}
        />
      </TestWrapper>
    );
    
    const addButton = screen.getByRole('button', { name: /add new application role/i });
    await user.click(addButton);
    
    const appField = screen.getByRole('combobox', { name: /application/i });
    
    // Type rapidly to test debouncing
    await user.type(appField, 'admin');
    
    // Should only call filter once after debounce period
    await waitFor(() => {
      expect(mockFilter).toHaveBeenCalledTimes(1);
    }, { timeout: 500 });
  });
});
```

## Troubleshooting

Common issues and solutions when implementing and using the UserAppRoles component.

### Common Integration Issues

#### Form Context Not Available

**Problem:** `useFormContext` throws error about missing FormProvider

```typescript
// ❌ Error: useFormContext must be used within a FormProvider
function MyComponent() {
  return <UserAppRoles apps={apps} roles={roles} />;
}
```

**Solution:** Wrap component in FormProvider

```typescript
// ✅ Correct implementation
function MyComponent() {
  const methods = useForm({
    resolver: zodResolver(userAppRolesSchema),
    defaultValues: { appRoles: [] },
  });
  
  return (
    <FormProvider {...methods}>
      <UserAppRoles apps={apps} roles={roles} />
    </FormProvider>
  );
}
```

#### Field Array Registration Issues

**Problem:** Changes not reflected in form state

```typescript
// ❌ Incorrect field name
<UserAppRoles name="userAppRoles" /> // Wrong field name

// Form expects 'appRoles' but component uses 'userAppRoles'
const form = useForm({
  defaultValues: { appRoles: [] } // Different field name
});
```

**Solution:** Ensure consistent field naming

```typescript
// ✅ Consistent field names
const form = useForm({
  defaultValues: { appRoles: [] }
});

return (
  <FormProvider {...form}>
    <UserAppRoles name="appRoles" apps={apps} roles={roles} />
  </FormProvider>
);
```

#### TypeScript Type Errors

**Problem:** Type mismatch between component props and data

```typescript
// ❌ Type error: Property 'isActive' is missing
const apps = [
  { id: 1, name: 'app1', description: 'App 1' } // Missing required properties
];
```

**Solution:** Ensure data matches interface requirements

```typescript
// ✅ Complete data structure
const apps: AppType[] = [
  {
    id: 1,
    name: 'app1',
    description: 'App 1',
    isActive: true,
    apiKey: 'key1',
    type: 1,
    launchUrl: '/app1',
    createdDate: '2024-01-01',
    lastModifiedDate: '2024-01-01',
    createdById: 1,
    lastModifiedById: 1,
  }
];
```

### Performance Issues

#### Slow Rendering with Large Datasets

**Problem:** Component becomes sluggish with hundreds of applications/roles

```typescript
// ❌ Performance issue with large datasets
<UserAppRoles 
  apps={thousandsOfApps} 
  roles={hundredsOfRoles}
  // No virtualization or optimization
/>
```

**Solution:** Enable virtualization and optimize rendering

```typescript
// ✅ Optimized for large datasets
<UserAppRoles 
  apps={thousandsOfApps} 
  roles={hundredsOfRoles}
  virtualized={true}
  pageSize={50}
  searchable={true}
  className="max-h-96 overflow-auto"
/>

// Or implement custom memoization
const memoizedApps = useMemo(() => 
  apps.filter(app => app.isActive), [apps]
);
```

#### Memory Leaks with Form State

**Problem:** Form state not cleaning up properly

```typescript
// ❌ Potential memory leak
useEffect(() => {
  const subscription = watch((value) => {
    // Heavy computation without cleanup
    processLargeDataset(value);
  });
  // Missing return cleanup
}, [watch]);
```

**Solution:** Proper cleanup and memoization

```typescript
// ✅ Proper cleanup and optimization
useEffect(() => {
  const subscription = watch(
    debounce((value) => {
      processLargeDataset(value);
    }, 300)
  );
  
  return () => subscription.unsubscribe();
}, [watch]);

// Memoize expensive computations
const processedData = useMemo(() => 
  expensiveComputation(formData), [formData]
);
```

### Validation Problems

#### Custom Validation Not Working

**Problem:** Custom business rules not being enforced

```typescript
// ❌ Validation schema not applied correctly
const form = useForm({
  defaultValues: { appRoles: [] }
  // Missing resolver
});
```

**Solution:** Ensure proper schema resolver setup

```typescript
// ✅ Correct validation setup
const customSchema = z.object({
  appRoles: z.array(appRoleFieldSchema)
    .refine(
      (appRoles) => {
        // Custom business logic
        return validateBusinessRules(appRoles);
      },
      {
        message: 'Business rule validation failed',
        path: ['appRoles'],
      }
    ),
});

const form = useForm({
  resolver: zodResolver(customSchema),
  mode: 'onChange', // Enable real-time validation
  defaultValues: { appRoles: [] }
});
```

#### Async Validation Timing Issues

**Problem:** Race conditions with async validation

```typescript
// ❌ Race condition in async validation
const validateAsync = async (appRoles) => {
  const result = await fetch('/api/validate', {
    body: JSON.stringify(appRoles)
  });
  return result.json();
};

// Multiple rapid calls can cause race conditions
```

**Solution:** Implement proper async validation with debouncing

```typescript
// ✅ Debounced async validation with abort controller
const useAsyncValidation = () => {
  const abortControllerRef = useRef<AbortController>();
  
  const validateAsync = useCallback(
    debounce(async (appRoles: AppRoleField[]) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      try {
        const response = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appRoles }),
          signal: abortControllerRef.current.signal,
        });
        
        return response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          return null; // Request was cancelled
        }
        throw error;
      }
    }, 500),
    []
  );
  
  return { validateAsync };
};
```

### Accessibility Issues

#### Screen Reader Announcements Not Working

**Problem:** Dynamic content changes not announced to screen readers

```typescript
// ❌ No screen reader announcements
const handleAdd = () => {
  append({ app: '', role: '' });
  // Missing accessibility announcement
};
```

**Solution:** Implement proper ARIA live regions

```typescript
// ✅ Proper screen reader announcements
const announceToScreenReader = (message: string, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

const handleAdd = () => {
  append({ app: '', role: '' });
  announceToScreenReader('New application role assignment added');
};

const handleRemove = (index: number) => {
  const removedItem = fields[index];
  remove(index);
  announceToScreenReader(
    `Removed ${removedItem.app || 'application'} assignment`
  );
};
```

#### Focus Management Issues

**Problem:** Focus lost after dynamic content changes

```typescript
// ❌ Focus lost after removing item
const handleRemove = (index: number) => {
  remove(index);
  // Focus management missing
};
```

**Solution:** Implement proper focus restoration

```typescript
// ✅ Proper focus management
const handleRemove = (index: number) => {
  const wasLastItem = index === fields.length - 1;
  const focusTarget = wasLastItem && index > 0 
    ? index - 1 // Focus previous item if removing last
    : index;     // Focus same position if not last
  
  remove(index);
  
  // Restore focus after DOM update
  setTimeout(() => {
    if (fields.length === 0) {
      // Focus add button if no items left
      const addButton = document.querySelector('[data-testid="add-button"]');
      addButton?.focus();
    } else {
      // Focus appropriate row
      const targetRow = document.querySelector(
        `[data-testid="app-role-row-${focusTarget}"]`
      );
      targetRow?.focus();
    }
  }, 0);
};
```

### Styling and Theme Issues

#### Dark Mode Not Working

**Problem:** Component doesn't respect dark mode theme

```typescript
// ❌ Hard-coded light mode classes
<div className="bg-white text-black border-gray-200">
  {/* Content */}
</div>
```

**Solution:** Use proper theme-aware classes

```typescript
// ✅ Theme-aware styling
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700">
  {/* Content */}
</div>

// Or use theme context
const { resolvedTheme } = useTheme();
const themeClasses = resolvedTheme === 'dark' 
  ? 'bg-gray-900 text-gray-100' 
  : 'bg-white text-gray-900';
```

#### CSS Conflicts with Tailwind

**Problem:** Custom CSS conflicting with Tailwind utilities

```css
/* ❌ CSS specificity issues */
.user-app-roles .button {
  background-color: blue !important; /* Overrides Tailwind */
}
```

**Solution:** Use Tailwind utilities and proper CSS layers

```css
/* ✅ Proper Tailwind integration */
@layer components {
  .user-app-roles-button {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-md;
  }
}

/* Or use Tailwind utilities directly */
```

### Testing Issues

#### Mocking Form Context in Tests

**Problem:** Tests failing due to missing form context

```typescript
// ❌ Test without proper form context
it('should render', () => {
  render(<UserAppRoles apps={apps} roles={roles} />);
  // Fails: useFormContext not available
});
```

**Solution:** Create proper test wrapper

```typescript
// ✅ Proper test setup with form context
function createTestWrapper(defaultValues = { appRoles: [] }) {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm({
      resolver: zodResolver(userAppRolesSchema),
      defaultValues,
    });
    
    return <FormProvider {...methods}>{children}</FormProvider>;
  };
  
  return TestWrapper;
}

it('should render', () => {
  const TestWrapper = createTestWrapper();
  render(
    <TestWrapper>
      <UserAppRoles apps={apps} roles={roles} />
    </TestWrapper>
  );
  
  expect(screen.getByText('Application Role Assignments')).toBeInTheDocument();
});
```

#### Async Test Timing Issues

**Problem:** Tests failing due to timing issues with async operations

```typescript
// ❌ Not waiting for async operations
it('should validate on submit', async () => {
  // ... setup
  fireEvent.click(submitButton);
  expect(screen.getByText('Validation error')).toBeInTheDocument(); // Fails
});
```

**Solution:** Proper async test handling

```typescript
// ✅ Proper async test handling
it('should validate on submit', async () => {
  // ... setup
  fireEvent.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText('Validation error')).toBeInTheDocument();
  });
  
  // Or use user-event for more realistic interactions
  await user.click(submitButton);
  await screen.findByText('Validation error');
});
```

### Debugging Tips

#### Enable Debug Mode

```typescript
// Add debug props to component
<UserAppRoles
  apps={apps}
  roles={roles}
  debug={process.env.NODE_ENV === 'development'}
  onDebug={(event, data) => {
    console.log('UserAppRoles Debug:', event, data);
  }}
/>
```

#### Form State Inspection

```typescript
// Add form state inspector in development
function FormStateInspector() {
  const { watch, formState } = useFormContext();
  const values = watch();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <details className="mt-4 p-4 bg-gray-100 rounded">
      <summary>Form State (Development Only)</summary>
      <pre className="mt-2 text-xs">
        {JSON.stringify({ values, errors: formState.errors }, null, 2)}
      </pre>
    </details>
  );
}
```

#### Performance Monitoring

```typescript
// Add performance monitoring
function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time: ${end - start}ms`);
    };
  });
}

// Use in component
function UserAppRoles(props: UserAppRolesProps) {
  usePerformanceMonitor('UserAppRoles');
  // ... component logic
}
```

For additional support, please refer to the component documentation or create an issue in the project repository with a minimal reproduction case.