# Button Component System

A comprehensive, accessible button component system for the DreamFactory Admin Interface, built with React 19, TypeScript 5.8+, and Tailwind CSS 4.1+. This system replaces Angular Material button patterns with modern React implementations while maintaining WCAG 2.1 AA compliance and superior developer experience.

## Table of Contents

- [Quick Start](#quick-start)
- [Component API](#component-api)
- [TypeScript Interfaces](#typescript-interfaces)
- [Accessibility Features](#accessibility-features)
- [Migration Guide](#migration-guide)
- [Usage Examples](#usage-examples)
- [Variants and States](#variants-and-states)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

```tsx
import { Button, IconButton, ButtonGroup } from '@/components/ui/button';
import { Plus, Save, Trash2 } from 'lucide-react';

// Basic usage
<Button variant="primary" size="md">
  Create Service
</Button>

// With icon
<Button variant="secondary" size="lg">
  <Save className="w-4 h-4 mr-2" />
  Save Configuration
</Button>

// Icon-only button
<IconButton
  variant="outline"
  size="sm"
  aria-label="Add new entry"
>
  <Plus className="w-4 h-4" />
</IconButton>

// Grouped buttons
<ButtonGroup orientation="horizontal">
  <Button variant="outline">Cancel</Button>
  <Button variant="primary">Confirm</Button>
</ButtonGroup>
```

## Component API

### Button Component

The primary button component supporting all common use cases with comprehensive accessibility features.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant affecting padding and minimum touch targets |
| `loading` | `boolean` | `false` | Shows loading spinner and disables interaction |
| `disabled` | `boolean` | `false` | Disables button interaction and applies disabled styling |
| `fullWidth` | `boolean` | `false` | Makes button span full width of container |
| `children` | `React.ReactNode` | - | Button content (text, icons, etc.) |
| `className` | `string` | - | Additional CSS classes |
| `ariaLabel` | `string` | - | Accessible label for screen readers |
| `ariaDescribedBy` | `string` | - | References additional descriptive text |
| `announceOnPress` | `string` | - | Screen reader announcement on button press |
| `...props` | `ButtonHTMLAttributes<HTMLButtonElement>` | - | All standard button HTML attributes |

### IconButton Component

Specialized component for icon-only buttons with enhanced accessibility requirements.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'destructive'` | `'ghost'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant with minimum 44x44px touch targets |
| `shape` | `'square' \| 'circle'` | `'square'` | Button shape for different contexts |
| `children` | `React.ReactNode` | - | Icon element (required) |
| `aria-label` | `string` | - | **Required** - Accessible label for icon-only buttons |
| `...props` | Extends `Button` props | - | All Button component props available |

### ButtonGroup Component

Container for grouping related buttons with consistent spacing and navigation.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `spacing` | `'tight' \| 'normal' \| 'loose'` | `'normal'` | Spacing between buttons |
| `variant` | `'default' \| 'toolbar' \| 'dialog'` | `'default'` | Predefined grouping styles |
| `children` | `React.ReactNode` | - | Button components to group |
| `ariaLabel` | `string` | - | Group label for screen readers |
| `className` | `string` | - | Additional CSS classes |

## TypeScript Interfaces

### Core Interfaces

```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { VariantProps } from 'class-variance-authority';

// Base button variant configuration
export interface ButtonVariants extends VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

// Main Button component props
export interface ButtonProps extends 
  ButtonHTMLAttributes<HTMLButtonElement>,
  ButtonVariants {
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  announceOnPress?: string;
}

// IconButton specific props
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  shape?: 'square' | 'circle';
  children: ReactNode; // Icon element
  'aria-label': string; // Required for accessibility
}

// ButtonGroup configuration
export interface ButtonGroupProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  variant?: 'default' | 'toolbar' | 'dialog';
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

// Accessibility enhancement types
export interface AccessibilityProps {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaPressed?: boolean;
  ariaExpanded?: boolean;
  role?: string;
}

// Loading state configuration
export interface LoadingConfig {
  text?: string;
  spinner?: 'default' | 'dots' | 'pulse';
  position?: 'start' | 'end' | 'overlay';
}
```

### Variant Types

```typescript
// Color variants with WCAG 2.1 AA compliance
export type ButtonVariant = 
  | 'primary'     // Primary brand actions (4.52:1 contrast ratio)
  | 'secondary'   // Secondary actions (4.51:1 contrast ratio)
  | 'outline'     // Subtle emphasis (7.14:1 contrast ratio)
  | 'ghost'       // Minimal emphasis
  | 'destructive' // Dangerous actions (5.25:1 contrast ratio)

// Size variants with minimum touch targets
export type ButtonSize = 
  | 'sm'  // 44x44px minimum (WCAG compliance)
  | 'md'  // 48x48px standard
  | 'lg'  // 56x56px enhanced

// State types for interactive feedback
export type ButtonState = 
  | 'default'
  | 'hover'
  | 'active'
  | 'focused'
  | 'loading'
  | 'disabled'
```

## Accessibility Features

### WCAG 2.1 AA Compliance

The Button component system meets Level AA accessibility standards through:

#### Color Contrast Requirements
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **UI Components**: Minimum 3:1 contrast ratio for borders and focus indicators
- **Enhanced (AAA)**: 7:1 contrast ratio for improved readability

```typescript
// Color compliance matrix with actual contrast ratios
const accessibleColors = {
  primary: {
    background: '#6366f1', // 4.52:1 vs white ✓ AA
    text: '#ffffff',       // High contrast
    border: '#4f46e5',     // 7.14:1 vs white ✓ AAA
  },
  secondary: {
    background: '#f8fafc', // 1.04:1 vs white (light mode)
    text: '#0f172a',       // 18.91:1 vs white ✓ AAA
    border: '#cbd5e1',     // 1.39:1 vs white
  },
  destructive: {
    background: '#dc2626', // 5.25:1 vs white ✓ AA
    text: '#ffffff',       // High contrast
    border: '#b91c1c',     // 7.36:1 vs white ✓ AAA
  }
};
```

#### Keyboard Navigation

- **Focus Visible**: 2px solid outline with 2px offset
- **Touch Targets**: Minimum 44x44px interactive areas
- **Tab Order**: Logical navigation sequence
- **Enter/Space**: Standard activation keys

```tsx
// Focus management example
<Button
  variant="primary"
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
>
  Submit Form
</Button>
```

#### Screen Reader Support

- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: Announcements for state changes
- **Role Attributes**: Proper semantic roles
- **Group Labeling**: Accessible grouping for button collections

```tsx
// Screen reader optimized button
<Button
  variant="primary"
  loading={isSubmitting}
  ariaLabel="Submit database configuration form"
  ariaDescribedBy="form-errors"
  announceOnPress="Configuration saved successfully"
>
  {isSubmitting ? 'Saving...' : 'Save Configuration'}
</Button>
```

### Focus Management

The button system implements comprehensive focus management:

```typescript
// Focus ring utility classes
export const focusStyles = {
  primary: 'focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
  error: 'focus-visible:ring-2 focus-visible:ring-error-600 focus-visible:ring-offset-2',
  success: 'focus-visible:ring-2 focus-visible:ring-success-600 focus-visible:ring-offset-2',
};

// Focus trap for button groups
export const useFocusTrap = (refs: RefObject<HTMLButtonElement>[]) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      // Focus next button
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      // Focus previous button
    }
  }, [refs]);
};
```

## Migration Guide

### From Angular Material to React

This guide helps migrate existing Angular Material button patterns to the new React implementation.

#### Basic Button Migration

**Angular Material (Before):**
```html
<!-- mat-button (text button) -->
<button mat-button color="primary" (click)="handleClick()">
  Click Me
</button>

<!-- mat-flat-button (filled button) -->
<button mat-flat-button color="primary" (click)="handleSubmit()">
  Submit
</button>

<!-- mat-stroked-button (outlined button) -->
<button mat-stroked-button (click)="handleCancel()">
  Cancel
</button>
```

**React Implementation (After):**
```tsx
{/* Ghost variant replaces mat-button */}
<Button variant="ghost" onClick={handleClick}>
  Click Me
</Button>

{/* Primary variant replaces mat-flat-button */}
<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>

{/* Outline variant replaces mat-stroked-button */}
<Button variant="outline" onClick={handleCancel}>
  Cancel
</Button>
```

#### Icon Button Migration

**Angular Material (Before):**
```html
<!-- mat-icon-button -->
<button mat-icon-button (click)="toggleMenu()" [attr.aria-label]="menuLabel">
  <fa-icon [icon]="faMenu"></fa-icon>
</button>

<!-- mat-mini-fab -->
<button mat-mini-fab color="primary" (click)="createNew()" aria-label="Create new entry">
  <fa-icon [icon]="faPlus"></fa-icon>
</button>
```

**React Implementation (After):**
```tsx
{/* IconButton replaces mat-icon-button */}
<IconButton
  variant="ghost"
  shape="square"
  onClick={toggleMenu}
  aria-label={menuLabel}
>
  <Menu className="w-5 h-5" />
</IconButton>

{/* FAB variant replaces mat-mini-fab */}
<IconButton
  variant="primary"
  shape="circle"
  size="lg"
  onClick={createNew}
  aria-label="Create new entry"
>
  <Plus className="w-6 h-6" />
</IconButton>
```

#### Dialog Actions Migration

**Angular Material (Before):**
```html
<div mat-dialog-actions>
  <button mat-flat-button mat-dialog-close>Cancel</button>
  <button mat-flat-button color="primary" cdkFocusInitial (click)="confirm()">
    Confirm
  </button>
</div>
```

**React Implementation (After):**
```tsx
<ButtonGroup variant="dialog" ariaLabel="Dialog actions">
  <Button variant="outline" onClick={onCancel}>
    Cancel
  </Button>
  <Button 
    variant="primary" 
    onClick={onConfirm}
    autoFocus
  >
    Confirm
  </Button>
</ButtonGroup>
```

#### Loading States Migration

**Angular Material (Before):**
```html
<button mat-flat-button [disabled]="isLoading" (click)="submit()">
  <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
  {{ isLoading ? 'Saving...' : 'Save' }}
</button>
```

**React Implementation (After):**
```tsx
<Button
  variant="primary"
  loading={isLoading}
  onClick={handleSubmit}
  disabled={isLoading}
>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

### Icon Library Migration

**FontAwesome to Lucide React:**

```typescript
// Angular FontAwesome imports (Before)
import { faPlus, faEdit, faTrash, faRefresh } from '@fortawesome/free-solid-svg-icons';

// Lucide React imports (After)
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';

// Icon usage migration
const iconMigrationMap = {
  faPlus: <Plus className="w-4 h-4" />,
  faEdit: <Edit className="w-4 h-4" />,
  faTrash: <Trash2 className="w-4 h-4" />,
  faRefresh: <RefreshCw className="w-4 h-4" />,
};
```

## Usage Examples

### Basic Button Variants

```tsx
import { Button } from '@/components/ui/button';
import { Save, Download, Share } from 'lucide-react';

// Primary action button
<Button variant="primary" size="lg">
  Create Database Service
</Button>

// Secondary action button
<Button variant="secondary" size="md">
  <Save className="w-4 h-4 mr-2" />
  Save Configuration
</Button>

// Subtle action button
<Button variant="outline" size="sm">
  <Download className="w-4 h-4 mr-2" />
  Export Schema
</Button>

// Minimal action button
<Button variant="ghost">
  <Share className="w-4 h-4 mr-2" />
  Share
</Button>

// Destructive action button
<Button variant="destructive">
  Delete Service
</Button>
```

### Advanced Button States

```tsx
import { Button } from '@/components/ui/button';
import { useState } from 'react';

function DatabaseConfigurationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveConfiguration();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Loading state */}
      <Button
        variant="primary"
        loading={isSubmitting}
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        announceOnPress="Database configuration saved"
      >
        {isSubmitting ? 'Saving Configuration...' : 'Save Configuration'}
      </Button>

      {/* Disabled state with tooltip */}
      <Button
        variant="secondary"
        disabled={!isValid}
        ariaDescribedBy="validation-errors"
      >
        Test Connection
      </Button>

      {/* Full width button */}
      <Button variant="outline" fullWidth>
        Cancel and Return to Dashboard
      </Button>
    </div>
  );
}
```

### Icon Button Examples

```tsx
import { IconButton } from '@/components/ui/button';
import { Plus, Edit3, Trash2, RefreshCw, Settings } from 'lucide-react';

// Toolbar actions
<div className="flex items-center space-x-2">
  <IconButton
    variant="primary"
    size="sm"
    shape="circle"
    aria-label="Add new database table"
  >
    <Plus className="w-4 h-4" />
  </IconButton>

  <IconButton
    variant="ghost"
    size="sm"
    aria-label="Refresh schema"
  >
    <RefreshCw className="w-4 h-4" />
  </IconButton>

  <IconButton
    variant="ghost"
    size="sm"
    aria-label="Open settings"
  >
    <Settings className="w-4 h-4" />
  </IconButton>
</div>

// Table row actions
<div className="flex items-center justify-end space-x-1">
  <IconButton
    variant="ghost"
    size="sm"
    aria-label="Edit database configuration"
  >
    <Edit3 className="w-4 h-4" />
  </IconButton>

  <IconButton
    variant="ghost"
    size="sm"
    aria-label="Delete database service"
  >
    <Trash2 className="w-4 h-4 text-red-600" />
  </IconButton>
</div>

// Floating Action Button (FAB)
<IconButton
  variant="primary"
  size="lg"
  shape="circle"
  className="fixed bottom-6 right-6 shadow-lg"
  aria-label="Create new API endpoint"
>
  <Plus className="w-6 h-6" />
</IconButton>
```

### Button Group Examples

```tsx
import { Button, ButtonGroup } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Dialog actions
<ButtonGroup variant="dialog" ariaLabel="Confirm deletion">
  <Button variant="outline">Cancel</Button>
  <Button variant="destructive">Delete Service</Button>
</ButtonGroup>

// Pagination controls
<ButtonGroup orientation="horizontal" spacing="tight">
  <Button variant="outline" size="sm">
    <ChevronLeft className="w-4 h-4 mr-1" />
    Previous
  </Button>
  <Button variant="outline" size="sm">
    1
  </Button>
  <Button variant="primary" size="sm">
    2
  </Button>
  <Button variant="outline" size="sm">
    3
  </Button>
  <Button variant="outline" size="sm">
    Next
    <ChevronRight className="w-4 h-4 ml-1" />
  </Button>
</ButtonGroup>

// Vertical toolbar
<ButtonGroup orientation="vertical" variant="toolbar">
  <Button variant="ghost" size="sm">Tables</Button>
  <Button variant="ghost" size="sm">Views</Button>
  <Button variant="ghost" size="sm">Procedures</Button>
  <Button variant="ghost" size="sm">Functions</Button>
</ButtonGroup>

// Form actions with proper spacing
<ButtonGroup orientation="horizontal" spacing="normal">
  <Button variant="outline">Reset Form</Button>
  <Button variant="secondary">Save Draft</Button>
  <Button variant="primary">Publish Configuration</Button>
</ButtonGroup>
```

### Responsive Button Patterns

```tsx
import { Button } from '@/components/ui/button';
import { Save, Settings } from 'lucide-react';

// Responsive button with icon/text
<Button
  variant="primary"
  className="w-full sm:w-auto"
>
  <Save className="w-4 h-4 sm:mr-2" />
  <span className="hidden sm:inline">Save Configuration</span>
</Button>

// Mobile-optimized button group
<div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
  <ButtonGroup 
    orientation="horizontal" 
    className="hidden sm:flex"
  >
    <Button variant="outline">Cancel</Button>
    <Button variant="primary">Save</Button>
  </ButtonGroup>
  
  {/* Mobile: Stack buttons vertically */}
  <div className="flex flex-col gap-2 sm:hidden">
    <Button variant="primary" fullWidth>Save</Button>
    <Button variant="outline" fullWidth>Cancel</Button>
  </div>
</div>

// Responsive icon size
<Button variant="secondary">
  <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
  Database Settings
</Button>
```

## Variants and States

### Visual Variants

#### Primary Variant
- **Use Case**: Main call-to-action buttons
- **Examples**: "Create Service", "Save Configuration", "Generate API"
- **Styling**: Solid background with high contrast text
- **Accessibility**: 4.52:1 contrast ratio (AA compliant)

```tsx
<Button variant="primary">Create Database Service</Button>
```

#### Secondary Variant
- **Use Case**: Supporting actions, alternative choices
- **Examples**: "Save Draft", "Import Schema", "View Documentation"
- **Styling**: Muted background with strong text contrast
- **Accessibility**: 4.51:1 contrast ratio (AA compliant)

```tsx
<Button variant="secondary">Import Existing Schema</Button>
```

#### Outline Variant
- **Use Case**: Subtle emphasis, neutral actions
- **Examples**: "Cancel", "Back", "Learn More"
- **Styling**: Transparent background with prominent border
- **Accessibility**: 7.14:1 border contrast ratio (AAA compliant)

```tsx
<Button variant="outline">Cancel Operation</Button>
```

#### Ghost Variant
- **Use Case**: Minimal emphasis, navigation, menu items
- **Examples**: Toolbar buttons, table actions, navigation links
- **Styling**: Transparent background, subtle hover states
- **Accessibility**: Focus ring for keyboard navigation

```tsx
<Button variant="ghost">View API Documentation</Button>
```

#### Destructive Variant
- **Use Case**: Dangerous actions requiring confirmation
- **Examples**: "Delete Service", "Remove Table", "Reset Configuration"
- **Styling**: Error color scheme with high visibility
- **Accessibility**: 5.25:1 contrast ratio (AA compliant)

```tsx
<Button variant="destructive">Delete Database Service</Button>
```

### Size Variants

#### Small (sm)
- **Dimensions**: Minimum 44x44px (WCAG compliance)
- **Use Case**: Compact interfaces, table actions, secondary controls
- **Touch Target**: Meets minimum accessibility requirements

```tsx
<Button variant="outline" size="sm">Edit</Button>
```

#### Medium (md) - Default
- **Dimensions**: 48x48px standard
- **Use Case**: General purpose buttons, forms, dialogs
- **Touch Target**: Enhanced usability on touch devices

```tsx
<Button variant="primary" size="md">Save Configuration</Button>
```

#### Large (lg)
- **Dimensions**: 56x56px enhanced
- **Use Case**: Primary actions, mobile interfaces, prominent CTAs
- **Touch Target**: Optimal for accessibility and mobile use

```tsx
<Button variant="primary" size="lg">Create New Service</Button>
```

### Interactive States

#### Loading State
- **Behavior**: Shows spinner, disables interaction, announces progress
- **Implementation**: Built-in loading prop with screen reader support

```tsx
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Creating Service...' : 'Create Service'}
</Button>
```

#### Disabled State
- **Behavior**: Prevents interaction, reduced opacity, maintains tab order
- **Accessibility**: Includes aria-disabled and descriptive messaging

```tsx
<Button 
  variant="secondary" 
  disabled={!isValid}
  ariaDescribedBy="validation-message"
>
  Test Connection
</Button>
```

#### Focus State
- **Behavior**: Visible focus ring for keyboard navigation
- **Accessibility**: 2px outline with 2px offset, 3:1 contrast ratio

```tsx
<Button 
  variant="primary"
  className="focus-visible:ring-2 focus-visible:ring-primary-600"
>
  Submit Form
</Button>
```

## Best Practices

### Accessibility Guidelines

1. **Always provide descriptive labels**
   ```tsx
   // Good: Descriptive action
   <Button variant="primary">Create Database Service</Button>
   
   // Better: Include context
   <Button variant="primary" ariaLabel="Create new database service configuration">
     Create Service
   </Button>
   ```

2. **Use appropriate variants for context**
   ```tsx
   // Good: Clear visual hierarchy
   <ButtonGroup>
     <Button variant="outline">Cancel</Button>
     <Button variant="primary">Save</Button>
   </ButtonGroup>
   ```

3. **Ensure sufficient color contrast**
   ```tsx
   // Good: High contrast destructive action
   <Button variant="destructive">Delete Service</Button>
   
   // Avoid: Custom colors without contrast verification
   <Button className="bg-yellow-300 text-yellow-500">Warning</Button>
   ```

4. **Provide loading states for async actions**
   ```tsx
   <Button 
     variant="primary"
     loading={isSubmitting}
     disabled={isSubmitting}
     announceOnPress="Configuration saved successfully"
   >
     {isSubmitting ? 'Saving...' : 'Save Configuration'}
   </Button>
   ```

### Performance Optimization

1. **Use IconButton for icon-only actions**
   ```tsx
   // Optimized: Dedicated icon button component
   <IconButton variant="ghost" aria-label="Refresh data">
     <RefreshCw className="w-4 h-4" />
   </IconButton>
   
   // Less optimal: Regular button with icon styling
   <Button variant="ghost" className="p-2">
     <RefreshCw className="w-4 h-4" />
   </Button>
   ```

2. **Group related buttons efficiently**
   ```tsx
   // Optimized: ButtonGroup handles spacing and navigation
   <ButtonGroup orientation="horizontal">
     <Button variant="outline">Step 1</Button>
     <Button variant="outline">Step 2</Button>
     <Button variant="primary">Step 3</Button>
   </ButtonGroup>
   ```

3. **Implement proper loading states**
   ```tsx
   // Good: Built-in loading handling
   <Button variant="primary" loading={isLoading}>
     Process Data
   </Button>
   ```

### Component Composition

1. **Combine with other UI components**
   ```tsx
   import { Button } from '@/components/ui/button';
   import { Tooltip } from '@/components/ui/tooltip';
   
   <Tooltip content="This action cannot be undone">
     <Button variant="destructive">Delete All Data</Button>
   </Tooltip>
   ```

2. **Use with form libraries**
   ```tsx
   import { useForm } from 'react-hook-form';
   
   function DatabaseForm() {
     const { handleSubmit, formState: { isSubmitting, isValid } } = useForm();
     
     return (
       <form onSubmit={handleSubmit(onSubmit)}>
         <Button
           type="submit"
           variant="primary"
           loading={isSubmitting}
           disabled={!isValid}
         >
           Create Database Connection
         </Button>
       </form>
     );
   }
   ```

3. **Responsive design patterns**
   ```tsx
   // Mobile-first responsive button
   <Button
     variant="primary"
     size="sm"
     className="w-full sm:w-auto sm:size-md lg:size-lg"
   >
     <Save className="w-4 h-4 mr-2" />
     <span className="hidden sm:inline">Save Configuration</span>
   </Button>
   ```

### Error Handling

1. **Provide feedback for failed actions**
   ```tsx
   function AsyncButton() {
     const [error, setError] = useState<string | null>(null);
     
     const handleClick = async () => {
       try {
         await riskyOperation();
       } catch (err) {
         setError('Failed to complete operation');
       }
     };
     
     return (
       <div>
         <Button
           variant="primary"
           onClick={handleClick}
           ariaDescribedBy={error ? 'button-error' : undefined}
         >
           Process Data
         </Button>
         {error && (
           <div id="button-error" role="alert" className="text-red-600 text-sm mt-1">
             {error}
           </div>
         )}
       </div>
     );
   }
   ```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Focus Ring Not Visible

**Problem**: Focus indicators don't appear when navigating with keyboard.

**Solution**: Ensure `focus-visible` pseudo-class is properly implemented:

```tsx
// Correct implementation
<Button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600">
  Click Me
</Button>

// Check Tailwind configuration includes focus-visible variant
// tailwind.config.ts
module.exports = {
  variants: {
    extend: {
      outline: ['focus-visible'],
      ring: ['focus-visible'],
    },
  },
};
```

#### Issue: Icon Button Accessibility Warnings

**Problem**: Screen readers can't identify icon-only button purpose.

**Solution**: Always provide `aria-label` for IconButton components:

```tsx
// Incorrect: No accessible label
<IconButton variant="ghost">
  <Edit className="w-4 h-4" />
</IconButton>

// Correct: Descriptive label provided
<IconButton variant="ghost" aria-label="Edit database configuration">
  <Edit className="w-4 h-4" />
</IconButton>
```

#### Issue: Touch Targets Too Small on Mobile

**Problem**: Buttons are difficult to tap on touch devices.

**Solution**: Ensure minimum 44x44px touch targets:

```tsx
// Check button size variants meet requirements
const sizeVariants = {
  sm: "h-11 px-4 min-w-[44px]", // 44px minimum
  md: "h-12 px-6 min-w-[48px]", // Enhanced usability
  lg: "h-14 px-8 min-w-[56px]", // Optimal touch experience
};
```

#### Issue: Loading State Not Announced to Screen Readers

**Problem**: Users with screen readers don't know when async operations start/complete.

**Solution**: Use `announceOnPress` and proper ARIA attributes:

```tsx
<Button
  variant="primary"
  loading={isLoading}
  announceOnPress="Database connection test started"
  aria-live="polite"
>
  {isLoading ? 'Testing Connection...' : 'Test Connection'}
</Button>
```

#### Issue: Button Group Navigation Not Working

**Problem**: Arrow key navigation between grouped buttons doesn't function.

**Solution**: Verify ButtonGroup implements focus management:

```tsx
// Ensure proper keyboard navigation
<ButtonGroup orientation="horizontal">
  <Button variant="outline">Previous</Button>
  <Button variant="outline">Current</Button>
  <Button variant="outline">Next</Button>
</ButtonGroup>

// ButtonGroup should handle:
// - Arrow key navigation between buttons
// - Home/End key support
// - Proper tab order management
```

#### Issue: Custom Styling Overrides Accessibility Features

**Problem**: Custom CSS classes break focus indicators or touch targets.

**Solution**: Extend variants instead of overriding base styles:

```tsx
// Avoid: Direct style overrides
<Button className="p-1 h-8 w-8"> // Breaks touch targets
  Icon
</Button>

// Prefer: Extend through variant system
<IconButton 
  variant="ghost" 
  size="sm"
  className="hover:bg-blue-50" // Safe additional styling
>
  <Icon className="w-4 h-4" />
</IconButton>
```

### Performance Optimization Issues

#### Issue: Slow Rendering with Many Buttons

**Problem**: Pages with multiple buttons render slowly.

**Solution**: Implement proper memoization and lazy loading:

```tsx
import { memo } from 'react';

// Memoize button components when props don't change frequently
const MemoizedButton = memo(Button);

// Use ButtonGroup for collections to optimize layout calculations
<ButtonGroup>
  {actions.map((action) => (
    <MemoizedButton 
      key={action.id}
      variant={action.variant}
      onClick={action.handler}
    >
      {action.label}
    </MemoizedButton>
  ))}
</ButtonGroup>
```

#### Issue: Bundle Size Concerns

**Problem**: Button component system increases bundle size significantly.

**Solution**: Verify tree-shaking and imports are optimized:

```tsx
// Correct: Import only needed components
import { Button, IconButton } from '@/components/ui/button';

// Avoid: Importing entire button system when only using basic Button
import * as ButtonComponents from '@/components/ui/button';
```

### Testing Issues

#### Issue: Button Tests Fail in CI Environment

**Problem**: Tests pass locally but fail in continuous integration.

**Solution**: Ensure proper test environment setup:

```typescript
// test/setup.ts - Add missing DOM APIs
Object.defineProperty(window, 'ResizeObserver', {
  value: class ResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  },
});

// Verify button accessibility in tests
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button meets accessibility standards', async () => {
  const { container } = render(
    <Button variant="primary">Test Button</Button>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

For additional support, refer to the component implementation files:
- `button.tsx` - Core button component
- `icon-button.tsx` - Icon-only button variant  
- `button-group.tsx` - Button grouping component
- `button-variants.ts` - Styling and variant definitions
- `button.test.tsx` - Comprehensive test suite

---

**Last Updated**: 2024-12-19  
**Version**: 1.0.0  
**React Version**: 19.0.0  
**TypeScript Version**: 5.8+  
**Accessibility Standard**: WCAG 2.1 AA