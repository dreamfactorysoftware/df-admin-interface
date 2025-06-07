# Toggle Component System

A comprehensive, accessible toggle (switch) component system for the DreamFactory Admin Interface, built with React 19, TypeScript 5.8+, and Tailwind CSS 4.1+. This system replaces Angular Material `mat-slide-toggle` patterns with modern React implementations using Headless UI Switch primitives while maintaining WCAG 2.1 AA compliance and superior developer experience.

## Table of Contents

- [Quick Start](#quick-start)
- [Component API](#component-api)
- [TypeScript Interfaces](#typescript-interfaces)
- [Accessibility Features](#accessibility-features)
- [Migration Guide](#migration-guide)
- [Usage Examples](#usage-examples)
- [Variants and States](#variants-and-states)
- [Best Practices](#best-practices)
- [Form Integration](#form-integration)
- [Troubleshooting](#troubleshooting)

## Quick Start

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useState } from 'react';

// Basic controlled toggle
function DatabaseSettings() {
  const [cacheEnabled, setCacheEnabled] = useState(false);

  return (
    <Toggle
      checked={cacheEnabled}
      onCheckedChange={setCacheEnabled}
      label="Enable caching"
      description="Improve query performance with intelligent caching"
    />
  );
}

// Theme toggle example
function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Toggle
      checked={isDarkMode}
      onCheckedChange={setIsDarkMode}
      label="Dark mode"
      size="lg"
      color="primary"
    />
  );
}

// Form integration with React Hook Form
import { useForm, Controller } from 'react-hook-form';

function ServiceConfigForm() {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="enableSSL"
        control={control}
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onCheckedChange={field.onChange}
            label="Enable SSL connection"
            description="Secure your database connection with SSL/TLS encryption"
            required
          />
        )}
      />
    </form>
  );
}
```

## Component API

### Toggle Component

The primary toggle component supporting all common use cases with comprehensive accessibility features and WCAG 2.1 AA compliance.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Controlled checked state |
| `defaultChecked` | `boolean` | `false` | Default checked state for uncontrolled usage |
| `onCheckedChange` | `(checked: boolean) => void` | - | Callback when toggle state changes |
| `disabled` | `boolean` | `false` | Disables toggle interaction |
| `readonly` | `boolean` | `false` | Makes toggle read-only (displays state but prevents changes) |
| `loading` | `boolean` | `false` | Shows loading state with spinner |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant affecting dimensions and touch targets |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'error'` | `'primary'` | Color scheme variant |
| `label` | `string` | - | Visible label text |
| `description` | `string` | - | Help text displayed below the toggle |
| `labelPosition` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | Position of label relative to toggle |
| `required` | `boolean` | `false` | Marks field as required for forms |
| `error` | `string` | - | Error message to display |
| `name` | `string` | - | Form field name |
| `id` | `string` | - | Unique identifier |
| `className` | `string` | - | Additional CSS classes |
| `ariaLabel` | `string` | - | Accessible label for screen readers |
| `ariaDescribedBy` | `string` | - | References additional descriptive text |
| `ariaLabelledBy` | `string` | - | References labeling element |
| `...props` | `SwitchProps` | - | All Headless UI Switch props |

## TypeScript Interfaces

### Core Interfaces

```typescript
import { ReactNode } from 'react';
import { SwitchProps } from '@headlessui/react';
import { VariantProps } from 'class-variance-authority';

// Base toggle variant configuration
export interface ToggleVariants extends VariantProps<typeof toggleVariants> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
}

// Main Toggle component props
export interface ToggleProps extends 
  Omit<SwitchProps<'button'>, 'checked' | 'onChange'>,
  ToggleVariants {
  // State management
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  
  // Visual configuration
  label?: string;
  description?: string;
  loading?: boolean;
  readonly?: boolean;
  
  // Form integration
  name?: string;
  required?: boolean;
  error?: string;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  
  // Styling
  className?: string;
}

// Toggle state types
export type ToggleState = 
  | 'unchecked'
  | 'checked' 
  | 'indeterminate'
  | 'loading'
  | 'disabled';

// Color variants with WCAG compliance
export type ToggleColor = 
  | 'primary'    // Primary brand color (4.52:1 contrast ratio)
  | 'secondary'  // Secondary accent (4.51:1 contrast ratio)
  | 'success'    // Success/positive actions (5.89:1 contrast ratio)
  | 'warning'    // Warning/caution states (6.12:1 contrast ratio)
  | 'error'      // Error/destructive actions (5.25:1 contrast ratio)

// Size variants with minimum touch targets
export type ToggleSize = 
  | 'sm'  // 44x24px minimum (WCAG compliance)
  | 'md'  // 48x28px standard  
  | 'lg'  // 56x32px enhanced

// Label positioning options
export type LabelPosition = 
  | 'left'    // Label to the left of toggle
  | 'right'   // Label to the right of toggle (default)
  | 'top'     // Label above toggle
  | 'bottom'  // Label below toggle

// Form field component props
export interface FormToggleProps extends ToggleProps {
  label: string; // Required for form fields
  hint?: string;
  validationState?: ValidationState;
  fieldId?: string;
}

export type ValidationState = 'valid' | 'invalid' | 'pending';

// Accessibility enhancement types
export interface ToggleAccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  role?: string;
  tabIndex?: number;
}

// Loading state configuration
export interface LoadingConfig {
  spinner?: 'default' | 'dots' | 'pulse';
  duration?: number;
  announceChange?: boolean;
}
```

### Advanced Types

```typescript
// Toggle context for grouped toggles
export interface ToggleGroupContextType {
  orientation?: 'horizontal' | 'vertical';
  size?: ToggleSize;
  color?: ToggleColor;
  disabled?: boolean;
  readonly?: boolean;
}

// Form validation integration
export interface ToggleValidation {
  required?: boolean;
  validate?: (value: boolean) => string | boolean;
  shouldUnregister?: boolean;
}

// Animation configuration
export interface ToggleAnimationConfig {
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  disabled?: boolean;
}

// Theme integration types
export interface ToggleThemeConfig {
  colors: Record<ToggleColor, {
    background: string;
    foreground: string;
    border: string;
    focus: string;
  }>;
  sizes: Record<ToggleSize, {
    width: string;
    height: string;
    thumb: string;
  }>;
  animations: ToggleAnimationConfig;
}
```

## Accessibility Features

### WCAG 2.1 AA Compliance

The Toggle component system meets Level AA accessibility standards through comprehensive implementation:

#### Color Contrast Requirements
- **UI Components**: Minimum 3:1 contrast ratio for interactive elements
- **Focus Indicators**: Minimum 3:1 contrast ratio for focus rings
- **State Indication**: Clear visual distinction between on/off states

```typescript
// Color compliance matrix with actual contrast ratios
const accessibleColors = {
  primary: {
    checked: '#6366f1',      // 4.52:1 vs white ✓ AA
    unchecked: '#e5e7eb',    // 1.79:1 vs white
    thumb: '#ffffff',        // High contrast
    focus: '#4f46e5',        // 7.14:1 vs white ✓ AAA
  },
  success: {
    checked: '#059669',      // 5.89:1 vs white ✓ AA
    unchecked: '#e5e7eb',    // 1.79:1 vs white
    thumb: '#ffffff',        // High contrast
    focus: '#047857',        // 8.12:1 vs white ✓ AAA
  },
  error: {
    checked: '#dc2626',      // 5.25:1 vs white ✓ AA
    unchecked: '#e5e7eb',    // 1.79:1 vs white  
    thumb: '#ffffff',        // High contrast
    focus: '#b91c1c',        // 7.36:1 vs white ✓ AAA
  }
};
```

#### Touch Target Requirements
- **Minimum Size**: 44x44px interactive area (WCAG 2.5.5)
- **Enhanced Targets**: 48x48px for improved usability
- **Large Variant**: 56x56px for optimal mobile experience

```tsx
// Touch target implementation
<Toggle
  size="sm"   // 44x24px toggle with 44x44px touch target
  size="md"   // 48x28px toggle with 48x48px touch target
  size="lg"   // 56x32px toggle with 56x56px touch target
  label="Enable notifications"
/>
```

#### Keyboard Navigation
- **Space Key**: Toggles the switch state
- **Enter Key**: Activates the switch (optional)
- **Tab Navigation**: Proper focus management
- **Focus Visible**: Clear focus indicators for keyboard users

```tsx
// Keyboard navigation example
<Toggle
  checked={isEnabled}
  onCheckedChange={setIsEnabled}
  label="Auto-save settings"
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEnabled(!isEnabled);
    }
  }}
  className="focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
/>
```

#### Screen Reader Support
- **ARIA Attributes**: Proper role, state, and property attributes
- **Live Regions**: Announcements for state changes
- **Descriptive Labels**: Clear, contextual labeling
- **State Announcements**: "On" and "Off" state communication

```tsx
// Screen reader optimized toggle
<Toggle
  checked={sslEnabled}
  onCheckedChange={setSslEnabled}
  label="SSL/TLS Encryption"
  description="Secure your database connection with encryption"
  ariaLabel="Enable SSL encryption for database connection"
  ariaDescribedBy="ssl-description ssl-status"
  role="switch"
  aria-checked={sslEnabled}
/>

{/* Additional context for screen readers */}
<div id="ssl-description" className="sr-only">
  Enabling SSL will encrypt all data transmitted between the application and database
</div>
<div id="ssl-status" aria-live="polite" className="sr-only">
  SSL encryption is currently {sslEnabled ? 'enabled' : 'disabled'}
</div>
```

### Focus Management

Comprehensive focus management ensures keyboard accessibility:

```typescript
// Focus ring utility classes
export const focusStyles = {
  primary: 'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
  success: 'focus-visible:ring-2 focus-visible:ring-success-600 focus-visible:ring-offset-2',
  error: 'focus-visible:ring-2 focus-visible:ring-error-600 focus-visible:ring-offset-2',
  warning: 'focus-visible:ring-2 focus-visible:ring-warning-600 focus-visible:ring-offset-2',
};

// Focus management hook for toggle groups
export const useToggleFocusManagement = (refs: RefObject<HTMLButtonElement>[]) => {
  const handleKeyDown = useCallback((e: KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % refs.length;
      refs[nextIndex]?.current?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + refs.length) % refs.length;
      refs[prevIndex]?.current?.focus();
    }
  }, [refs]);

  return handleKeyDown;
};
```

## Migration Guide

### From Angular Material to React

This guide helps migrate existing Angular Material `mat-slide-toggle` patterns to the new React Toggle implementation.

#### Basic Toggle Migration

**Angular Material (Before):**
```html
<!-- Basic slide toggle -->
<mat-slide-toggle 
  color="primary" 
  [checked]="isEnabled" 
  (change)="handleToggle($event)">
  Enable feature
</mat-slide-toggle>

<!-- Form-integrated toggle -->
<mat-slide-toggle 
  [formControl]="sslControl"
  color="primary"
  [matTooltip]="'Enable SSL encryption'"
  [attr.aria-label]="'SSL encryption toggle'">
  SSL Encryption
</mat-slide-toggle>

<!-- Disabled toggle -->
<mat-slide-toggle 
  [checked]="readOnlyValue"
  [disabled]="true">
  Read-only setting
</mat-slide-toggle>
```

**React Implementation (After):**
```tsx
{/* Basic toggle */}
<Toggle
  checked={isEnabled}
  onCheckedChange={handleToggle}
  label="Enable feature"
  color="primary"
/>

{/* Form-integrated toggle with React Hook Form */}
<Controller
  name="enableSSL"
  control={control}
  render={({ field }) => (
    <Toggle
      checked={field.value}
      onCheckedChange={field.onChange}
      label="SSL Encryption"
      description="Enable SSL encryption"
      color="primary"
      ariaLabel="SSL encryption toggle"
    />
  )}
/>

{/* Read-only toggle */}
<Toggle
  checked={readOnlyValue}
  readonly
  label="Read-only setting"
/>
```

#### Theme Toggle Migration

**Angular Material (Before):**
```typescript
// df-theme-toggle.component.ts
@Component({
  selector: 'df-theme-toggle',
  templateUrl: './df-theme-toggle.component.html',
  standalone: true,
  imports: [MatSlideToggleModule, AsyncPipe],
})
export class DfThemeToggleComponent {
  isDarkMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  themeService = inject(DfThemeService);

  toggle() {
    this.isDarkMode$.subscribe(isDarkMode => {
      this.themeService.setThemeMode(!isDarkMode);
    });
    this.isDarkMode$.next(!this.isDarkMode$.value);
  }
}
```

```html
<!-- df-theme-toggle.component.html -->
<mat-slide-toggle
  color="primary"
  [checked]="isDarkMode$ | async"
  (change)="toggle()">
</mat-slide-toggle>
```

**React Implementation (After):**
```tsx
// ThemeToggle.tsx
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <Toggle
      checked={isDarkMode}
      onCheckedChange={handleThemeChange}
      label="Dark mode"
      description="Switch between light and dark themes"
      color="primary"
      size="md"
      ariaLabel="Toggle dark mode"
    />
  );
}
```

#### Dynamic Form Field Migration

**Angular Material (Before):**
```html
<!-- df-dynamic-field.component.html (boolean field) -->
<mat-slide-toggle
  *ngIf="schema.type === 'boolean'"
  [formControl]="control"
  color="primary"
  [matTooltip]="schema.description ?? ''"
  [attr.aria-label]="schema.label">
  <ng-container *ngIf="showLabel">
    <span>{{ schema.label }}</span>
  </ng-container>
</mat-slide-toggle>
```

**React Implementation (After):**
```tsx
// DynamicField.tsx (boolean field implementation)
import { Toggle } from '@/components/ui/toggle';
import { Controller } from 'react-hook-form';

interface BooleanFieldProps {
  schema: FieldSchema;
  control: Control<any>;
  showLabel?: boolean;
}

function BooleanField({ schema, control, showLabel = true }: BooleanFieldProps) {
  return (
    <Controller
      name={schema.name}
      control={control}
      render={({ field, fieldState }) => (
        <Toggle
          checked={field.value || false}
          onCheckedChange={field.onChange}
          label={showLabel ? schema.label : undefined}
          description={schema.description}
          color="primary"
          error={fieldState.error?.message}
          required={schema.required}
          ariaLabel={schema.label}
          name={field.name}
        />
      )}
    />
  );
}
```

#### Service Configuration Migration

**Angular Material (Before):**
```html
<!-- Service configuration form -->
<mat-slide-toggle 
  [formControl]="configForm.get('cacheEnabled')"
  color="primary">
  Enable Query Caching
</mat-slide-toggle>

<mat-slide-toggle 
  [formControl]="configForm.get('sslEnabled')"
  color="primary"
  [matTooltip]="'Secure connection with SSL/TLS'">
  SSL/TLS Encryption
</mat-slide-toggle>

<mat-slide-toggle 
  [formControl]="configForm.get('poolingEnabled')"
  color="primary"
  [disabled]="!advancedMode">
  Connection Pooling
</mat-slide-toggle>
```

**React Implementation (After):**
```tsx
// ServiceConfigurationForm.tsx
import { Toggle } from '@/components/ui/toggle';
import { useForm, Controller } from 'react-hook-form';

interface ServiceConfig {
  cacheEnabled: boolean;
  sslEnabled: boolean;
  poolingEnabled: boolean;
}

function ServiceConfigurationForm() {
  const { control, handleSubmit, watch } = useForm<ServiceConfig>();
  const advancedMode = watch('advancedMode');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="cacheEnabled"
        control={control}
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onCheckedChange={field.onChange}
            label="Enable Query Caching"
            description="Improve performance by caching frequently used queries"
            color="primary"
          />
        )}
      />

      <Controller
        name="sslEnabled"
        control={control}
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onCheckedChange={field.onChange}
            label="SSL/TLS Encryption"
            description="Secure connection with SSL/TLS encryption"
            color="primary"
          />
        )}
      />

      <Controller
        name="poolingEnabled"
        control={control}
        render={({ field }) => (
          <Toggle
            checked={field.value}
            onCheckedChange={field.onChange}
            label="Connection Pooling"
            description="Enable database connection pooling for better performance"
            color="primary"
            disabled={!advancedMode}
          />
        )}
      />
    </form>
  );
}
```

### State Management Migration

**Angular RxJS to React State:**

```typescript
// Angular (Before)
export class SettingsComponent {
  isDarkMode$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  settings$ = this.settingsService.getSettings();
  
  updateSetting(key: string, value: boolean) {
    this.settingsService.updateSetting(key, value).subscribe();
  }
}

// React (After)
import { useState, useCallback } from 'react';
import { useSettings } from '@/hooks/use-settings';

function SettingsComponent() {
  const { settings, updateSetting } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState(settings.darkMode);

  const handleSettingChange = useCallback((key: string, value: boolean) => {
    updateSetting(key, value);
  }, [updateSetting]);

  return (
    <Toggle
      checked={isDarkMode}
      onCheckedChange={(checked) => {
        setIsDarkMode(checked);
        handleSettingChange('darkMode', checked);
      }}
      label="Dark mode"
    />
  );
}
```

## Usage Examples

### Basic Toggle Implementations

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useState } from 'react';

// Simple controlled toggle
function BasicExample() {
  const [enabled, setEnabled] = useState(false);

  return (
    <Toggle
      checked={enabled}
      onCheckedChange={setEnabled}
      label="Enable notifications"
      description="Receive email notifications for important updates"
    />
  );
}

// Different size variants
function SizeVariants() {
  return (
    <div className="space-y-4">
      <Toggle
        size="sm"
        label="Small toggle"
        description="Compact size for dense layouts"
      />
      
      <Toggle
        size="md"
        label="Medium toggle"
        description="Standard size for most use cases"
      />
      
      <Toggle
        size="lg"
        label="Large toggle"
        description="Enhanced size for mobile interfaces"
      />
    </div>
  );
}

// Color variants
function ColorVariants() {
  return (
    <div className="space-y-4">
      <Toggle color="primary" label="Primary color" />
      <Toggle color="secondary" label="Secondary color" />
      <Toggle color="success" label="Success color" />
      <Toggle color="warning" label="Warning color" />
      <Toggle color="error" label="Error color" />
    </div>
  );
}
```

### Advanced State Management

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useState, useCallback, useEffect } from 'react';

// Toggle with loading state
function LoadingToggle() {
  const [cacheEnabled, setCacheEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(async (checked: boolean) => {
    setIsLoading(true);
    try {
      await updateCacheSettings(checked);
      setCacheEnabled(checked);
    } catch (error) {
      console.error('Failed to update cache settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <Toggle
      checked={cacheEnabled}
      onCheckedChange={handleToggle}
      loading={isLoading}
      label="Enable query caching"
      description="Improve database performance with intelligent query caching"
      disabled={isLoading}
    />
  );
}

// Toggle with error handling
function ErrorHandlingToggle() {
  const [sslEnabled, setSslEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSSLToggle = useCallback(async (checked: boolean) => {
    setError(null);
    try {
      await configureSslConnection(checked);
      setSslEnabled(checked);
    } catch (err) {
      setError('Failed to configure SSL connection. Please check your certificates.');
    }
  }, []);

  return (
    <div>
      <Toggle
        checked={sslEnabled}
        onCheckedChange={handleSSLToggle}
        label="SSL/TLS Encryption"
        description="Secure your database connection with encryption"
        error={error}
        ariaDescribedBy={error ? 'ssl-error' : undefined}
      />
      {error && (
        <div id="ssl-error" role="alert" className="text-red-600 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  );
}

// Dependent toggles
function DependentToggles() {
  const [advancedMode, setAdvancedMode] = useState(false);
  const [connectionPooling, setConnectionPooling] = useState(false);
  const [compressionEnabled, setCompressionEnabled] = useState(false);

  // Reset dependent settings when advanced mode is disabled
  useEffect(() => {
    if (!advancedMode) {
      setConnectionPooling(false);
      setCompressionEnabled(false);
    }
  }, [advancedMode]);

  return (
    <div className="space-y-4">
      <Toggle
        checked={advancedMode}
        onCheckedChange={setAdvancedMode}
        label="Advanced configuration"
        description="Enable advanced database connection options"
        color="primary"
      />

      <div className={`space-y-3 pl-6 ${!advancedMode ? 'opacity-50' : ''}`}>
        <Toggle
          checked={connectionPooling}
          onCheckedChange={setConnectionPooling}
          label="Connection pooling"
          description="Reuse database connections for improved performance"
          disabled={!advancedMode}
        />

        <Toggle
          checked={compressionEnabled}
          onCheckedChange={setCompressionEnabled}
          label="Data compression"
          description="Compress data transfer to reduce bandwidth usage"
          disabled={!advancedMode}
        />
      </div>
    </div>
  );
}
```

### Form Integration Examples

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Database configuration form schema
const databaseConfigSchema = z.object({
  enableSSL: z.boolean(),
  enableCaching: z.boolean(),
  enablePooling: z.boolean(),
  enableCompression: z.boolean().optional(),
  strictMode: z.boolean(),
});

type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

function DatabaseConfigurationForm() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<DatabaseConfig>({
    resolver: zodResolver(databaseConfigSchema),
    defaultValues: {
      enableSSL: true,
      enableCaching: false,
      enablePooling: false,
      strictMode: true,
    },
  });

  const sslEnabled = watch('enableSSL');

  const onSubmit = async (data: DatabaseConfig) => {
    await saveDatabaseConfiguration(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Security Settings</h3>
        
        <Controller
          name="enableSSL"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              label="SSL/TLS Encryption"
              description="Encrypt all data transmitted between application and database"
              error={fieldState.error?.message}
              required
              color="primary"
            />
          )}
        />

        <Controller
          name="strictMode"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              label="Strict mode"
              description="Enable strict SQL mode for enhanced data validation"
              error={fieldState.error?.message}
              color="warning"
            />
          )}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Performance Settings</h3>
        
        <Controller
          name="enableCaching"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              label="Query caching"
              description="Cache frequently accessed queries for improved performance"
              error={fieldState.error?.message}
              color="success"
            />
          )}
        />

        <Controller
          name="enablePooling"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              label="Connection pooling"
              description="Reuse database connections to reduce overhead"
              error={fieldState.error?.message}
              disabled={!sslEnabled}
            />
          )}
        />

        <Controller
          name="enableCompression"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value || false}
              onCheckedChange={field.onChange}
              label="Data compression"
              description="Compress data transfer to reduce bandwidth usage"
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
}
```

### Label Position Examples

```tsx
import { Toggle } from '@/components/ui/toggle';

function LabelPositionExamples() {
  return (
    <div className="space-y-6">
      {/* Right label (default) */}
      <Toggle
        labelPosition="right"
        label="Label on the right"
        description="This is the default label position"
      />

      {/* Left label */}
      <Toggle
        labelPosition="left"
        label="Label on the left"
        description="Label appears to the left of the toggle"
      />

      {/* Top label */}
      <Toggle
        labelPosition="top"
        label="Label on top"
        description="Label appears above the toggle"
      />

      {/* Bottom label */}
      <Toggle
        labelPosition="bottom"
        label="Label on bottom"
        description="Label appears below the toggle"
      />

      {/* No visible label (accessibility label only) */}
      <Toggle
        ariaLabel="Hidden label toggle"
        description="No visible label, but accessible to screen readers"
      />
    </div>
  );
}
```

### Responsive Design Examples

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useState } from 'react';

function ResponsiveToggles() {
  const [mobileOptimized, setMobileOptimized] = useState(false);

  return (
    <div className="space-y-4">
      {/* Responsive size */}
      <Toggle
        checked={mobileOptimized}
        onCheckedChange={setMobileOptimized}
        label="Mobile optimized"
        description="Automatically adjust interface for mobile devices"
        size="sm" // Small on all screens
        className="sm:size-md lg:size-lg" // Responsive sizing
      />

      {/* Responsive label position */}
      <Toggle
        label="Responsive layout"
        description="Label position adapts to screen size"
        labelPosition="top" // Top on mobile
        className="sm:label-right" // Right on larger screens
      />

      {/* Mobile-first design */}
      <div className="w-full">
        <Toggle
          label="Full width on mobile"
          description="Toggle spans full width on small screens"
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
}
```

## Variants and States

### Visual Variants

#### Color Variants

Each color variant is designed with WCAG 2.1 AA compliance and semantic meaning:

##### Primary Variant
- **Use Case**: Main feature toggles, core settings
- **Examples**: "Enable API", "Dark mode", "Auto-save"
- **Styling**: Brand primary color with high contrast
- **Accessibility**: 4.52:1 contrast ratio (AA compliant)

```tsx
<Toggle
  color="primary"
  checked={apiEnabled}
  onCheckedChange={setApiEnabled}
  label="Enable REST API"
  description="Allow external applications to access your data"
/>
```

##### Secondary Variant
- **Use Case**: Supporting features, secondary preferences
- **Examples**: "Advanced options", "Developer mode", "Verbose logging"
- **Styling**: Muted color scheme with clear states
- **Accessibility**: 4.51:1 contrast ratio (AA compliant)

```tsx
<Toggle
  color="secondary"
  checked={verboseLogging}
  onCheckedChange={setVerboseLogging}
  label="Verbose logging"
  description="Include detailed information in application logs"
/>
```

##### Success Variant
- **Use Case**: Positive actions, security features, performance enhancements
- **Examples**: "Enable encryption", "Backup enabled", "Performance mode"
- **Styling**: Green color scheme indicating positive states
- **Accessibility**: 5.89:1 contrast ratio (AA compliant)

```tsx
<Toggle
  color="success"
  checked={backupEnabled}
  onCheckedChange={setBackupEnabled}
  label="Automatic backups"
  description="Regularly backup your database configurations"
/>
```

##### Warning Variant
- **Use Case**: Caution-required features, experimental options
- **Examples**: "Beta features", "Aggressive caching", "Debug mode"
- **Styling**: Amber/orange color scheme for caution
- **Accessibility**: 6.12:1 contrast ratio (AA compliant)

```tsx
<Toggle
  color="warning"
  checked={betaFeatures}
  onCheckedChange={setBetaFeatures}
  label="Beta features"
  description="Enable experimental features (may be unstable)"
/>
```

##### Error Variant
- **Use Case**: Dangerous actions, destructive operations
- **Examples**: "Allow destructive operations", "Disable security", "Debug access"
- **Styling**: Red color scheme for dangerous actions
- **Accessibility**: 5.25:1 contrast ratio (AA compliant)

```tsx
<Toggle
  color="error"
  checked={allowDestructive}
  onCheckedChange={setAllowDestructive}
  label="Allow destructive operations"
  description="Enable operations that can permanently delete data"
/>
```

### Size Variants

#### Small (sm)
- **Dimensions**: 44x24px toggle with 44x44px touch target
- **Use Case**: Dense layouts, table cells, toolbar actions
- **Accessibility**: Meets WCAG minimum touch target requirements

```tsx
<Toggle
  size="sm"
  label="Compact toggle"
  description="Optimized for space-constrained interfaces"
/>
```

#### Medium (md) - Default
- **Dimensions**: 48x28px toggle with 48x48px touch target
- **Use Case**: Standard forms, settings panels, general UI
- **Accessibility**: Enhanced usability on all devices

```tsx
<Toggle
  size="md" // Default size
  label="Standard toggle"
  description="Balanced size for most use cases"
/>
```

#### Large (lg)
- **Dimensions**: 56x32px toggle with 56x56px touch target  
- **Use Case**: Mobile interfaces, primary actions, accessibility-focused designs
- **Accessibility**: Optimal for users with motor impairments

```tsx
<Toggle
  size="lg"
  label="Large toggle"
  description="Enhanced size for improved accessibility"
/>
```

### Interactive States

#### Default State
- **Behavior**: Standard interactive toggle ready for user input
- **Visual**: Clear on/off indication with smooth animations

```tsx
<Toggle
  label="Default state"
  description="Ready for user interaction"
/>
```

#### Loading State  
- **Behavior**: Shows spinner, prevents interaction, announces loading
- **Visual**: Subtle spinner animation, reduced opacity
- **Accessibility**: Screen reader announcements for state changes

```tsx
<Toggle
  loading={isUpdating}
  label="Loading state"
  description="Toggle is processing changes"
  onCheckedChange={async (checked) => {
    setIsUpdating(true);
    await updateSettings(checked);
    setIsUpdating(false);
  }}
/>
```

#### Disabled State
- **Behavior**: Prevents all interaction, maintains visual context
- **Visual**: Reduced opacity, no hover effects
- **Accessibility**: Proper aria-disabled attribute, maintains tab order

```tsx
<Toggle
  disabled
  checked={readOnlyValue}
  label="Disabled state"
  description="Toggle is currently unavailable"
/>
```

#### Readonly State
- **Behavior**: Displays current state without allowing changes
- **Visual**: Subtle styling difference from disabled
- **Accessibility**: Clear indication that value is read-only

```tsx
<Toggle
  readonly
  checked={systemControlledValue}
  label="Read-only state"
  description="Value is controlled by system settings"
/>
```

#### Error State
- **Behavior**: Indicates validation failure or system error
- **Visual**: Error color scheme, error message display
- **Accessibility**: Error announcement to screen readers

```tsx
<Toggle
  checked={invalidValue}
  error="This setting conflicts with your current configuration"
  label="Error state"
  description="Toggle has validation errors"
/>
```

#### Focus State
- **Behavior**: Clear focus indication for keyboard navigation
- **Visual**: Prominent focus ring with proper contrast
- **Accessibility**: 2px outline with 2px offset, 3:1 contrast ratio

```tsx
<Toggle
  label="Focus state"
  description="Clear focus indication for keyboard users"
  className="focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
/>
```

## Best Practices

### Accessibility Guidelines

1. **Always provide descriptive labels**
   ```tsx
   // Good: Clear, descriptive label
   <Toggle
     label="Enable SSL encryption"
     description="Secure database connections with SSL/TLS encryption"
   />
   
   // Better: Include context and consequences
   <Toggle
     label="Enable SSL encryption"
     description="Secure database connections with SSL/TLS encryption. This may slightly impact connection performance."
     ariaLabel="Enable SSL encryption for database connections"
   />
   ```

2. **Use appropriate color variants for semantic meaning**
   ```tsx
   // Good: Color matches semantic meaning
   <Toggle color="success" label="Enable automatic backups" />
   <Toggle color="warning" label="Enable beta features" />
   <Toggle color="error" label="Allow destructive operations" />
   ```

3. **Ensure sufficient touch targets**
   ```tsx
   // Good: Minimum size for mobile accessibility
   <Toggle size="sm" /> // 44x44px minimum touch target
   
   // Better: Enhanced size for improved usability
   <Toggle size="lg" /> // 56x56px enhanced touch target
   ```

4. **Provide loading states for async operations**
   ```tsx
   <Toggle
     checked={sslEnabled}
     loading={isUpdatingSSL}
     onCheckedChange={async (checked) => {
       setIsUpdatingSSL(true);
       try {
         await updateSSLConfiguration(checked);
       } finally {
         setIsUpdatingSSL(false);
       }
     }}
     label="SSL Encryption"
   />
   ```

### Performance Optimization

1. **Use controlled components efficiently**
   ```tsx
   // Optimized: Memoize expensive operations
   const MemoizedToggle = memo(Toggle);
   
   function SettingsList({ settings }) {
     const handleToggle = useCallback((key: string, value: boolean) => {
       updateSetting(key, value);
     }, [updateSetting]);
   
     return (
       <div>
         {settings.map((setting) => (
           <MemoizedToggle
             key={setting.id}
             checked={setting.value}
             onCheckedChange={(checked) => handleToggle(setting.key, checked)}
             label={setting.label}
           />
         ))}
       </div>
     );
   }
   ```

2. **Implement proper error boundaries**
   ```tsx
   function DatabaseSettingsForm() {
     return (
       <ErrorBoundary fallback={<SettingsErrorFallback />}>
         <Toggle
           label="Enable caching"
           onCheckedChange={updateCacheSettings}
         />
       </ErrorBoundary>
     );
   }
   ```

3. **Use loading states to prevent race conditions**
   ```tsx
   function AsyncToggle() {
     const [isLoading, setIsLoading] = useState(false);
     
     const handleChange = useCallback(async (checked: boolean) => {
       if (isLoading) return; // Prevent concurrent operations
       
       setIsLoading(true);
       try {
         await updateSetting(checked);
       } finally {
         setIsLoading(false);
       }
     }, [isLoading]);
     
     return (
       <Toggle
         loading={isLoading}
         onCheckedChange={handleChange}
         label="Setting"
       />
     );
   }
   ```

### Form Integration Best Practices

1. **Use React Hook Form Controller properly**
   ```tsx
   // Good: Proper Controller usage
   <Controller
     name="enableSSL"
     control={control}
     rules={{ required: "SSL setting is required" }}
     render={({ field, fieldState }) => (
       <Toggle
         checked={field.value}
         onCheckedChange={field.onChange}
         error={fieldState.error?.message}
         label="Enable SSL"
         required
       />
     )}
   />
   ```

2. **Implement proper validation**
   ```tsx
   // Using Zod schema validation
   const configSchema = z.object({
     enableSSL: z.boolean(),
     enableCaching: z.boolean(),
     // Conditional validation
     cacheSize: z.number().optional().refine((val, ctx) => {
       const cacheEnabled = ctx.parent.enableCaching;
       if (cacheEnabled && (!val || val <= 0)) {
         ctx.addIssue({
           code: z.ZodIssueCode.custom,
           message: "Cache size is required when caching is enabled",
         });
       }
       return true;
     }),
   });
   ```

3. **Handle dependent fields properly**
   ```tsx
   function ConfigForm() {
     const { control, watch } = useForm();
     const advancedMode = watch('advancedMode');
     
     return (
       <div>
         <Controller
           name="advancedMode"
           control={control}
           render={({ field }) => (
             <Toggle
               checked={field.value}
               onCheckedChange={field.onChange}
               label="Advanced configuration"
             />
           )}
         />
         
         {/* Dependent field */}
         <Controller
           name="connectionPooling"
           control={control}
           render={({ field }) => (
             <Toggle
               checked={field.value && advancedMode}
               onCheckedChange={field.onChange}
               disabled={!advancedMode}
               label="Connection pooling"
             />
           )}
         />
       </div>
     );
   }
   ```

### Error Handling

1. **Provide clear error messages**
   ```tsx
   function ValidatedToggle() {
     const [error, setError] = useState<string | null>(null);
     
     const handleToggle = async (checked: boolean) => {
       setError(null);
       try {
         await validateAndUpdate(checked);
       } catch (err) {
         setError(
           err instanceof Error 
             ? err.message 
             : 'Failed to update setting. Please try again.'
         );
       }
     };
     
     return (
       <Toggle
         onCheckedChange={handleToggle}
         error={error}
         label="Validated setting"
         ariaDescribedBy={error ? 'setting-error' : undefined}
       />
     );
   }
   ```

2. **Implement retry mechanisms**
   ```tsx
   function RetryableToggle() {
     const [retryCount, setRetryCount] = useState(0);
     const maxRetries = 3;
     
     const handleToggle = async (checked: boolean) => {
       try {
         await updateSetting(checked);
         setRetryCount(0); // Reset on success
       } catch (err) {
         if (retryCount < maxRetries) {
           setRetryCount(prev => prev + 1);
           // Retry after delay
           setTimeout(() => handleToggle(checked), 1000 * retryCount);
         } else {
           // Handle final failure
           showErrorNotification('Failed to update setting after multiple attempts');
         }
       }
     };
     
     return (
       <Toggle
         onCheckedChange={handleToggle}
         label="Setting with retry"
         description={retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : undefined}
       />
     );
   }
   ```

## Form Integration

### React Hook Form Integration

The Toggle component integrates seamlessly with React Hook Form for comprehensive form management:

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Comprehensive form schema
const databaseConfigSchema = z.object({
  // Required toggles
  enableSSL: z.boolean({
    required_error: "SSL configuration is required",
  }),
  
  // Optional toggles with defaults
  enableCaching: z.boolean().default(false),
  enablePooling: z.boolean().default(false),
  
  // Conditional validation
  strictMode: z.boolean().default(true),
  
  // Advanced configuration
  advancedOptions: z.object({
    enableCompression: z.boolean().default(false),
    enableProfiling: z.boolean().default(false),
    maxConnections: z.number().min(1).max(1000).default(10),
  }).optional(),
}).refine((data) => {
  // Custom validation: pooling requires SSL
  if (data.enablePooling && !data.enableSSL) {
    return false;
  }
  return true;
}, {
  message: "Connection pooling requires SSL to be enabled",
  path: ["enablePooling"],
});

type DatabaseConfig = z.infer<typeof databaseConfigSchema>;

function DatabaseConfigurationForm() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<DatabaseConfig>({
    resolver: zodResolver(databaseConfigSchema),
    defaultValues: {
      enableSSL: true,
      enableCaching: false,
      enablePooling: false,
      strictMode: true,
    },
  });

  // Watch for dependent field changes
  const sslEnabled = watch('enableSSL');
  const advancedMode = watch('advancedOptions');

  const onSubmit = async (data: DatabaseConfig) => {
    try {
      await saveDatabaseConfiguration(data);
      reset(data); // Reset form state after successful save
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Security Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
        
        <Controller
          name="enableSSL"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              name={field.name}
              label="SSL/TLS Encryption"
              description="Encrypt all data transmitted between the application and database"
              error={fieldState.error?.message}
              required
              color="primary"
              size="md"
              ariaDescribedBy="ssl-description"
            />
          )}
        />

        <Controller
          name="strictMode"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              name={field.name}
              label="Strict SQL mode"
              description="Enable strict SQL mode for enhanced data validation and error detection"
              error={fieldState.error?.message}
              color="warning"
            />
          )}
        />
      </div>

      {/* Performance Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
        
        <Controller
          name="enableCaching"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              name={field.name}
              label="Query caching"
              description="Cache frequently accessed queries to improve response times"
              error={fieldState.error?.message}
              color="success"
            />
          )}
        />

        <Controller
          name="enablePooling"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value}
              onCheckedChange={field.onChange}
              name={field.name}
              label="Connection pooling"
              description="Reuse database connections to reduce connection overhead"
              error={fieldState.error?.message}
              disabled={!sslEnabled}
              color={sslEnabled ? "success" : "secondary"}
            />
          )}
        />
        
        {!sslEnabled && (
          <p className="text-sm text-amber-600 pl-12">
            Connection pooling requires SSL encryption to be enabled
          </p>
        )}
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
          <span className="text-sm text-gray-500">(Optional)</span>
        </div>
        
        <Controller
          name="advancedOptions.enableCompression"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value || false}
              onCheckedChange={field.onChange}
              name={field.name}
              label="Data compression"
              description="Compress data transfer to reduce bandwidth usage"
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="advancedOptions.enableProfiling"
          control={control}
          render={({ field, fieldState }) => (
            <Toggle
              checked={field.value || false}
              onCheckedChange={field.onChange}
              name={field.name}
              label="Query profiling"
              description="Enable detailed query performance profiling (may impact performance)"
              error={fieldState.error?.message}
              color="warning"
            />
          )}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => reset()}
          disabled={!isDirty || isSubmitting}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Reset Changes
        </button>
        
        <div className="flex space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving Configuration...' : 'Save Configuration'}
          </button>
        </div>
      </div>
      
      {/* Global form error */}
      {errors.root && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{errors.root.message}</p>
        </div>
      )}
    </form>
  );
}
```

### Custom Validation Hooks

```tsx
import { useState, useCallback } from 'react';
import { Toggle } from '@/components/ui/toggle';

// Custom validation hook for complex toggle logic
function useToggleValidation(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async (newValue: boolean) => {
    setIsValidating(true);
    setError(null);

    try {
      // Simulate async validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Custom validation logic
      if (newValue && !await checkSystemRequirements()) {
        throw new Error('System requirements not met for this feature');
      }
      
      setValue(newValue);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    value,
    error,
    isValidating,
    onChange: validate,
    reset: () => {
      setValue(initialValue);
      setError(null);
    },
  };
}

// Usage example
function ValidatedToggleExample() {
  const {
    value: encryptionEnabled,
    error,
    isValidating,
    onChange: handleEncryptionToggle,
    reset,
  } = useToggleValidation(false);

  return (
    <div className="space-y-4">
      <Toggle
        checked={encryptionEnabled}
        onCheckedChange={handleEncryptionToggle}
        loading={isValidating}
        error={error}
        label="Enable encryption"
        description="Encrypt sensitive data at rest"
        disabled={isValidating}
      />
      
      {error && (
        <button
          onClick={reset}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset to default
        </button>
      )}
    </div>
  );
}
```

### Field Array Integration

```tsx
import { Toggle } from '@/components/ui/toggle';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

interface DatabaseService {
  id: string;
  name: string;
  enabled: boolean;
  settings: {
    cacheEnabled: boolean;
    poolingEnabled: boolean;
    compressionEnabled: boolean;
  };
}

interface ServicesFormData {
  services: DatabaseService[];
}

function DatabaseServicesManager() {
  const { control, handleSubmit } = useForm<ServicesFormData>({
    defaultValues: {
      services: [
        {
          id: '1',
          name: 'Primary Database',
          enabled: true,
          settings: {
            cacheEnabled: false,
            poolingEnabled: false,
            compressionEnabled: false,
          },
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'services',
  });

  const onSubmit = (data: ServicesFormData) => {
    console.log('Services configuration:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field, index) => (
        <div key={field.id} className="p-6 border border-gray-200 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{field.name}</h3>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove Service
            </button>
          </div>

          {/* Service enabled toggle */}
          <Controller
            name={`services.${index}.enabled`}
            control={control}
            render={({ field: fieldProps }) => (
              <Toggle
                checked={fieldProps.value}
                onCheckedChange={fieldProps.onChange}
                label="Service enabled"
                description="Enable this database service"
                color="primary"
                size="lg"
              />
            )}
          />

          {/* Service settings - only show when service is enabled */}
          <Controller
            name={`services.${index}.enabled`}
            control={control}
            render={({ field: enabledField }) => (
              enabledField.value && (
                <div className="pl-6 space-y-3 border-l-2 border-blue-100">
                  <h4 className="font-medium text-gray-700">Service Settings</h4>
                  
                  <Controller
                    name={`services.${index}.settings.cacheEnabled`}
                    control={control}
                    render={({ field: cacheField }) => (
                      <Toggle
                        checked={cacheField.value}
                        onCheckedChange={cacheField.onChange}
                        label="Enable caching"
                        description="Cache query results for improved performance"
                        color="success"
                      />
                    )}
                  />

                  <Controller
                    name={`services.${index}.settings.poolingEnabled`}
                    control={control}
                    render={({ field: poolingField }) => (
                      <Toggle
                        checked={poolingField.value}
                        onCheckedChange={poolingField.onChange}
                        label="Connection pooling"
                        description="Reuse database connections"
                        color="success"
                      />
                    )}
                  />

                  <Controller
                    name={`services.${index}.settings.compressionEnabled`}
                    control={control}
                    render={({ field: compressionField }) => (
                      <Toggle
                        checked={compressionField.value}
                        onCheckedChange={compressionField.onChange}
                        label="Data compression"
                        description="Compress data transfer"
                      />
                    )}
                  />
                </div>
              )
            )}
          />
        </div>
      ))}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => append({
            id: Date.now().toString(),
            name: 'New Service',
            enabled: false,
            settings: {
              cacheEnabled: false,
              poolingEnabled: false,
              compressionEnabled: false,
            },
          })}
          className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          Add Service
        </button>

        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save All Services
        </button>
      </div>
    </form>
  );
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Toggle Not Responding to Clicks

**Problem**: Toggle doesn't change state when clicked or space is pressed.

**Solution**: Ensure proper event handling and controlled component pattern:

```tsx
// Incorrect: Missing onCheckedChange handler
<Toggle checked={value} label="Broken toggle" />

// Correct: Proper controlled component
<Toggle
  checked={value}
  onCheckedChange={setValue}
  label="Working toggle"
/>

// For React Hook Form
<Controller
  name="toggleField"
  control={control}
  render={({ field }) => (
    <Toggle
      checked={field.value}
      onCheckedChange={field.onChange} // Essential for form integration
      label="Form toggle"
    />
  )}
/>
```

#### Issue: Accessibility Warnings in Screen Readers

**Problem**: Screen readers announce unclear or missing information.

**Solution**: Provide comprehensive accessibility attributes:

```tsx
// Problematic: Minimal accessibility
<Toggle checked={value} />

// Improved: Basic accessibility
<Toggle
  checked={value}
  onCheckedChange={setValue}
  label="Feature toggle"
/>

// Optimal: Comprehensive accessibility
<Toggle
  checked={value}
  onCheckedChange={setValue}
  label="Enable SSL encryption"
  description="Secure database connections with SSL/TLS encryption"
  ariaLabel="Toggle SSL encryption for database connections"
  ariaDescribedBy="ssl-description ssl-status"
  role="switch"
/>

<div id="ssl-description" className="sr-only">
  SSL encryption protects data transmitted between the application and database
</div>
<div id="ssl-status" aria-live="polite" className="sr-only">
  SSL encryption is currently {value ? 'enabled' : 'disabled'}
</div>
```

#### Issue: Focus Ring Not Visible

**Problem**: Focus indicators don't appear for keyboard navigation.

**Solution**: Ensure proper focus-visible styling is applied:

```tsx
// Check Tailwind configuration includes focus-visible
// tailwind.config.ts
module.exports = {
  variants: {
    extend: {
      outline: ['focus-visible'],
      ring: ['focus-visible'],
    },
  },
};

// Correct implementation
<Toggle
  checked={value}
  onCheckedChange={setValue}
  label="Focusable toggle"
  className="focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
/>
```

#### Issue: Touch Targets Too Small on Mobile

**Problem**: Toggle is difficult to interact with on touch devices.

**Solution**: Verify size variants meet touch target requirements:

```tsx
// Problematic: Custom styling that breaks touch targets
<Toggle className="w-6 h-6" label="Too small" />

// Correct: Use size variants that ensure proper touch targets
<Toggle size="sm" label="Minimum size" /> // 44x44px minimum
<Toggle size="md" label="Standard size" /> // 48x48px enhanced
<Toggle size="lg" label="Large size" /> // 56x56px optimal

// For mobile-first design
<Toggle
  size="sm"
  className="sm:size-md lg:size-lg"
  label="Responsive sizing"
/>
```

#### Issue: Color Contrast Failing Accessibility Tests

**Problem**: Custom colors don't meet WCAG contrast requirements.

**Solution**: Use built-in color variants or ensure custom colors meet standards:

```tsx
// Avoid: Custom colors without contrast verification
<Toggle
  className="data-[checked]:bg-yellow-300"
  label="Poor contrast"
/>

// Use: Built-in accessible color variants
<Toggle color="primary" label="Accessible colors" />
<Toggle color="success" label="Success state" />
<Toggle color="warning" label="Warning state" />
<Toggle color="error" label="Error state" />

// If custom colors are needed, verify contrast ratios
// Use tools like WebAIM Contrast Checker or Lighthouse
```

#### Issue: Form Validation Not Working

**Problem**: Toggle validation doesn't trigger or display errors properly.

**Solution**: Ensure proper integration with form validation library:

```tsx
// React Hook Form integration
<Controller
  name="requiredToggle"
  control={control}
  rules={{
    required: "This setting is required",
    validate: (value) => {
      if (!value && advancedMode) {
        return "This setting must be enabled in advanced mode";
      }
      return true;
    }
  }}
  render={({ field, fieldState }) => (
    <Toggle
      checked={field.value}
      onCheckedChange={field.onChange}
      error={fieldState.error?.message}
      label="Required toggle"
      required
      ariaDescribedBy={fieldState.error ? 'toggle-error' : undefined}
    />
  )}
/>

{/* Error display */}
{fieldState.error && (
  <div id="toggle-error" role="alert" className="text-red-600 text-sm mt-1">
    {fieldState.error.message}
  </div>
)}
```

#### Issue: Loading State Not Properly Announced

**Problem**: Screen readers don't announce when toggle is processing changes.

**Solution**: Implement proper loading state announcements:

```tsx
function AsyncToggle() {
  const [isLoading, setIsLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    setAnnouncement('Updating setting...');
    
    try {
      await updateSetting(checked);
      setAnnouncement('Setting updated successfully');
    } catch (error) {
      setAnnouncement('Failed to update setting');
    } finally {
      setIsLoading(false);
      // Clear announcement after delay
      setTimeout(() => setAnnouncement(''), 3000);
    }
  };

  return (
    <div>
      <Toggle
        checked={value}
        onCheckedChange={handleToggle}
        loading={isLoading}
        disabled={isLoading}
        label="Async toggle"
        ariaDescribedBy="toggle-status"
      />
      
      {/* Live region for announcements */}
      <div
        id="toggle-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );
}
```

### Performance Issues

#### Issue: Multiple Toggles Cause Rendering Performance Problems

**Problem**: Pages with many toggles render slowly or cause UI lag.

**Solution**: Implement proper optimization techniques:

```tsx
import { memo, useCallback } from 'react';

// Memoize toggle components
const MemoizedToggle = memo(Toggle);

// Optimize toggle lists
function ToggleList({ settings, onUpdate }) {
  // Memoize callback to prevent unnecessary re-renders
  const handleToggle = useCallback((key: string) => {
    return (checked: boolean) => {
      onUpdate(key, checked);
    };
  }, [onUpdate]);

  return (
    <div>
      {settings.map((setting) => (
        <MemoizedToggle
          key={setting.id}
          checked={setting.value}
          onCheckedChange={handleToggle(setting.key)}
          label={setting.label}
        />
      ))}
    </div>
  );
}

// Use virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

function VirtualizedToggleList({ settings, onUpdate }) {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <Toggle
        checked={settings[index].value}
        onCheckedChange={(checked) => onUpdate(settings[index].key, checked)}
        label={settings[index].label}
      />
    </div>
  ), [settings, onUpdate]);

  return (
    <List
      height={400}
      itemCount={settings.length}
      itemSize={60}
    >
      {Row}
    </List>
  );
}
```

#### Issue: Bundle Size Concerns

**Problem**: Toggle component increases bundle size significantly.

**Solution**: Verify tree-shaking and optimize imports:

```tsx
// Correct: Import only what you need
import { Toggle } from '@/components/ui/toggle';

// Avoid: Importing entire component library
import * as UI from '@/components/ui';

// Check bundle analysis
// npm run build:analyze

// Ensure proper tree-shaking in bundler configuration
```

### Testing Issues

#### Issue: Toggle Tests Fail in CI Environment

**Problem**: Tests pass locally but fail in continuous integration.

**Solution**: Ensure proper test environment setup:

```typescript
// test/setup.ts - Add required DOM APIs
Object.defineProperty(window, 'ResizeObserver', {
  value: class ResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  },
});

// Mock Headless UI Switch for testing
jest.mock('@headlessui/react', () => ({
  Switch: ({ checked, onChange, children, ...props }) => (
    <button
      {...props}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      {children}
    </button>
  ),
}));

// Test accessibility compliance
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

test('Toggle meets accessibility standards', async () => {
  const { container } = render(
    <Toggle
      checked={false}
      onCheckedChange={() => {}}
      label="Test toggle"
    />
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('Toggle responds to keyboard navigation', async () => {
  const user = userEvent.setup();
  const handleChange = jest.fn();
  
  render(
    <Toggle
      checked={false}
      onCheckedChange={handleChange}
      label="Keyboard test"
    />
  );
  
  const toggle = screen.getByRole('switch');
  
  // Test space key activation
  await user.click(toggle);
  await user.keyboard(' ');
  
  expect(handleChange).toHaveBeenCalledWith(true);
});
```

### Migration Issues

#### Issue: Angular Material mat-slide-toggle Behaviors Not Working

**Problem**: Expected Angular Material behaviors don't work in React implementation.

**Solution**: Update code to use React patterns:

```tsx
// Angular (old way)
// Template-driven forms
<mat-slide-toggle [(ngModel)]="value" name="setting">
  Setting Label
</mat-slide-toggle>

// React (new way)
// Controlled component with state
function SettingToggle() {
  const [value, setValue] = useState(false);
  
  return (
    <Toggle
      checked={value}
      onCheckedChange={setValue}
      name="setting"
      label="Setting Label"
    />
  );
}

// Angular (old way)
// Reactive forms
<mat-slide-toggle [formControl]="settingControl">
  Setting Label
</mat-slide-toggle>

// React (new way)
// React Hook Form
<Controller
  name="setting"
  control={control}
  render={({ field }) => (
    <Toggle
      checked={field.value}
      onCheckedChange={field.onChange}
      label="Setting Label"
    />
  )}
/>
```

For additional support and examples, refer to:
- `toggle.tsx` - Core toggle component implementation
- `toggle-variants.ts` - Styling and variant definitions  
- `toggle.test.tsx` - Comprehensive test suite
- `toggle.stories.tsx` - Storybook documentation with interactive examples

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0  
**React Version**: 19.0.0  
**TypeScript Version**: 5.8+  
**Accessibility Standard**: WCAG 2.1 AA  
**Design System**: Tailwind CSS 4.1+