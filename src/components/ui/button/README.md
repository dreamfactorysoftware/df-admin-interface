# Button Component System

The Button component system provides a comprehensive set of button components for the DreamFactory Admin Interface, implementing WCAG 2.1 AA accessibility standards and replacing all Angular Material button patterns with a modern React 19/Tailwind CSS implementation.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [API Reference](#api-reference)
- [Accessibility](#accessibility)
- [Migration Guide](#migration-guide)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Button component system consists of four main components:

- **Button**: Core button component with comprehensive variant support
- **IconButton**: Specialized icon-only buttons with enhanced accessibility
- **LoadingButton**: Async operation buttons with automatic loading states
- **ButtonGroup**: Grouped button layouts with keyboard navigation

### Key Features

- ✅ **WCAG 2.1 AA Compliant**: Minimum 4.5:1 contrast ratios and 44×44px touch targets
- ⌨️ **Keyboard Navigation**: Focus-visible indicators and arrow key support
- 📱 **Mobile Optimized**: Touch-friendly targets and responsive design
- 🎨 **Design System**: Consistent styling with Tailwind CSS design tokens
- 🔄 **Loading States**: Built-in async operation support
- 🌙 **Dark Mode**: Full dark mode support with proper contrast
- 🎯 **Type Safety**: Complete TypeScript interfaces and prop validation

## Components

### Button

The core button component with comprehensive variant and accessibility support.

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">
  Save Changes
</Button>
```

### IconButton

Specialized component for icon-only buttons with mandatory accessibility labels.

```tsx
import { IconButton } from '@/components/ui/button';
import { Search } from 'lucide-react';

<IconButton 
  icon={Search}
  aria-label="Search database tables"
  variant="outline"
/>
```

### LoadingButton

Enhanced button with automatic async operation handling.

```tsx
import { LoadingButton } from '@/components/ui/button';

<LoadingButton
  asyncAction={handleSaveDatabase}
  successMessage="Database connection saved successfully"
  errorMessage="Failed to save database connection"
>
  Test Connection
</LoadingButton>
```

### ButtonGroup

Container for related buttons with keyboard navigation support.

```tsx
import { ButtonGroup, Button } from '@/components/ui/button';

<ButtonGroup label="Form actions" orientation="horizontal">
  <Button variant="outline">Cancel</Button>
  <Button variant="primary">Save</Button>
</ButtonGroup>
```

## API Reference

### Button Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Visual Variants
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon-sm' | 'icon-md' | 'icon-lg' | 'icon-xl';
  fullWidth?: boolean;
  
  // Content
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  
  // Loading States
  loading?: boolean;
  loadingText?: string;
  loadingSpinner?: React.ReactNode;
  
  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  announceOnPress?: string;
  role?: string;
  disableFocusRing?: boolean;
}
```

### IconButton Props

```typescript
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Icon and Accessibility (Required)
  icon: LucideIcon;
  'aria-label': string; // Required for accessibility
  
  // Visual Variants
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'xl';
  shape?: 'square' | 'circle';
  elevation?: 'none' | 'low' | 'medium' | 'high';
  
  // Enhanced Features
  tooltip?: string;
  loading?: boolean;
  fab?: boolean; // Floating Action Button
  asChild?: boolean; // Composition pattern
}
```

### LoadingButton Props

```typescript
interface LoadingButtonProps extends ButtonProps {
  // Async Operation Handling
  asyncAction?: () => Promise<void> | void;
  successMessage?: string;
  errorMessage?: string;
}
```

### ButtonGroup Props

```typescript
interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  // Layout and Behavior
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'contained' | 'separated' | 'minimal';
  
  // Accessibility
  label?: string; // Screen reader label
  ariaDescribedBy?: string;
  enableKeyboardNavigation?: boolean;
  
  // Visual Grouping
  attached?: boolean; // Connect buttons visually
  
  // Content
  children: React.ReactNode;
}
```

### Variant Specifications

#### Button Variants

| Variant | Use Case | Contrast Ratio | Example |
|---------|----------|----------------|---------|
| `primary` | Main call-to-action buttons | 7.14:1 (AAA) | Save, Submit, Create |
| `secondary` | Supporting actions | 4.51:1 (AA) | Edit, View, Configure |
| `success` | Confirmation and positive actions | 4.89:1 (AA) | Approve, Enable, Activate |
| `warning` | Caution and intermediate states | 4.68:1 (AA) | Warning dialogs, Pending actions |
| `error` | Destructive actions | 5.25:1 (AA) | Delete, Remove, Disable |
| `outline` | Secondary actions with emphasis | 7.14:1 (AAA) | Alternative actions |
| `ghost` | Minimal impact actions | 10.89:1 (AAA) | Cancel, Dismiss |
| `link` | Navigation and external links | 7.14:1 (AAA) | Help links, Documentation |

#### Size Specifications

| Size | Dimensions | Touch Target | Use Case |
|------|------------|--------------|----------|
| `sm` | 44×44px | 44×44px (WCAG minimum) | Compact interfaces, table actions |
| `md` | 48×48px | 48×48px | Standard buttons, forms |
| `lg` | 56×56px | 56×56px | Primary actions, prominent buttons |
| `xl` | 64×64px | 64×64px | Hero buttons, major CTAs |

## Accessibility

### WCAG 2.1 AA Compliance

The Button component system is fully compliant with WCAG 2.1 AA accessibility standards:

#### Color and Contrast
- **Minimum contrast ratios**: 4.5:1 for normal text, 3:1 for UI components
- **Color independence**: Information conveyed through means other than color alone
- **High contrast mode**: Compatible with Windows High Contrast Mode

#### Touch Targets
- **Minimum size**: 44×44px for all interactive elements
- **Spacing**: Adequate spacing between adjacent targets
- **Mobile optimization**: Enhanced touch targets for mobile devices

#### Keyboard Navigation
- **Focus management**: Visible focus indicators for keyboard-only users
- **Focus-visible**: Modern focus-visible support (no mouse focus rings)
- **Tab order**: Logical tab sequence throughout the interface
- **Arrow key navigation**: ButtonGroup supports arrow key navigation

#### Screen Reader Support
- **ARIA labels**: Proper labeling for all interactive elements
- **ARIA states**: Live announcements for loading and state changes
- **Role attributes**: Semantic roles for assistive technology
- **Content descriptions**: Descriptive text for complex interactions

### Accessibility Features

```tsx
// Required ARIA label for icon buttons
<IconButton 
  icon={Delete} 
  aria-label="Delete database connection"
  aria-describedby="delete-help-text"
/>

// Screen reader announcements
<Button 
  announceOnPress="Database connection saved successfully"
  loading={isSaving}
  loadingText="Saving database connection"
>
  Save Connection
</Button>

// Keyboard navigation in groups
<ButtonGroup 
  label="Database actions" 
  enableKeyboardNavigation={true}
>
  <Button>Edit</Button>
  <Button>Test</Button>
  <Button>Delete</Button>
</ButtonGroup>
```

### Testing Accessibility

The component includes comprehensive accessibility testing:

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Button } from './button';

test('passes accessibility audit', async () => {
  const { container } = render(
    <Button variant="primary">Save Changes</Button>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Migration Guide

### From Angular Material to React

This section provides comprehensive migration guidance from Angular Material button patterns to the new React implementation.

#### Basic Button Migration

```typescript
// Angular Material (BEFORE)
<button mat-button>Basic</button>
<button mat-raised-button>Raised</button>
<button mat-flat-button>Flat</button>
<button mat-stroked-button>Stroked</button>

// React Implementation (AFTER)
<Button variant="ghost">Basic</Button>
<Button variant="secondary">Raised</Button>
<Button variant="primary">Flat</Button>
<Button variant="outline">Stroked</Button>
```

#### Icon Button Migration

```typescript
// Angular Material (BEFORE)
<button mat-icon-button>
  <mat-icon>search</mat-icon>
</button>

<button mat-mini-fab>
  <mat-icon>add</mat-icon>
</button>

// React Implementation (AFTER)
<IconButton 
  icon={Search} 
  aria-label="Search"
  variant="ghost"
/>

<IconButton 
  icon={Plus} 
  aria-label="Add item"
  shape="circle"
  elevation="medium"
  fab
/>
```

#### Dialog Actions Migration

```typescript
// Angular Material (BEFORE)
<div mat-dialog-actions>
  <button mat-flat-button mat-dialog-close>
    {{ 'no' | transloco }}
  </button>
  <button mat-flat-button 
          (click)="onClose()" 
          cdkFocusInitial 
          color="primary">
    {{ 'yes' | transloco }}
  </button>
</div>

// React Implementation (AFTER)
<ButtonGroup 
  label="Dialog actions" 
  orientation="horizontal"
  className="justify-end space-x-2"
>
  <Button 
    variant="outline" 
    onClick={onCancel}
  >
    {t('no')}
  </Button>
  <Button 
    variant="primary" 
    onClick={onConfirm}
    autoFocus
  >
    {t('yes')}
  </Button>
</ButtonGroup>
```

#### Form Button Migration

```typescript
// Angular Material (BEFORE)
<button mat-raised-button 
        type="submit" 
        [disabled]="!form.valid"
        color="primary">
  Save
</button>

// React Implementation (AFTER)
<Button 
  type="submit"
  variant="primary"
  disabled={!isFormValid}
  loading={isSubmitting}
  announceOnPress="Form submitted successfully"
>
  Save
</Button>
```

#### Loading State Migration

```typescript
// Angular Material (BEFORE)
<button mat-flat-button 
        [disabled]="loading"
        color="primary">
  <mat-spinner 
    *ngIf="loading" 
    diameter="20"
    color="primary">
  </mat-spinner>
  <span [class.hidden]="loading">Save</span>
</button>

// React Implementation (AFTER)
<Button 
  variant="primary"
  loading={loading}
  loadingText="Saving changes"
>
  Save
</Button>

// Or with LoadingButton
<LoadingButton
  variant="primary"
  asyncAction={handleSave}
  successMessage="Changes saved successfully"
  errorMessage="Failed to save changes"
>
  Save
</LoadingButton>
```

### Migration Checklist

- [ ] Replace `mat-button` with `Button variant="ghost"`
- [ ] Replace `mat-raised-button` with `Button variant="secondary"`
- [ ] Replace `mat-flat-button` with `Button variant="primary"`
- [ ] Replace `mat-stroked-button` with `Button variant="outline"`
- [ ] Replace `mat-icon-button` with `IconButton`
- [ ] Replace `mat-mini-fab` with `IconButton fab`
- [ ] Add required `aria-label` to all IconButton instances
- [ ] Update color attributes to variant props
- [ ] Replace Angular loading patterns with built-in loading prop
- [ ] Update form submission patterns with async handling
- [ ] Add accessibility labels and descriptions
- [ ] Test keyboard navigation in button groups
- [ ] Verify WCAG compliance with automated testing

## Usage Examples

### Basic Button Variants

```tsx
import { Button } from '@/components/ui/button';

// Primary action button
<Button variant="primary" size="md">
  Create Database Service
</Button>

// Secondary action
<Button variant="secondary" size="md">
  Edit Configuration
</Button>

// Destructive action with confirmation
<Button 
  variant="error" 
  announceOnPress="Database service deleted"
  onClick={handleDelete}
>
  Delete Service
</Button>

// Link-style button
<Button 
  variant="link" 
  iconRight={<ExternalLink className="h-4 w-4" />}
  onClick={openDocumentation}
>
  View Documentation
</Button>
```

### Icon Buttons

```tsx
import { IconButton } from '@/components/ui/button';
import { Settings, Search, Plus, MoreVertical } from 'lucide-react';

// Basic icon button
<IconButton 
  icon={Settings}
  aria-label="Open settings"
  variant="ghost"
  size="default"
/>

// Floating action button
<IconButton 
  icon={Plus}
  aria-label="Add new database connection"
  variant="primary"
  shape="circle"
  elevation="medium"
  fab
/>

// Table action button
<IconButton 
  icon={MoreVertical}
  aria-label="More actions for this table"
  variant="ghost"
  size="sm"
  tooltip="Additional table actions"
/>

// Search button with loading
<IconButton 
  icon={Search}
  aria-label="Search tables"
  variant="outline"
  loading={isSearching}
  onClick={handleSearch}
/>
```

### Loading and Async Operations

```tsx
import { Button, LoadingButton } from '@/components/ui/button';

// Manual loading state
<Button
  variant="primary"
  loading={isConnecting}
  loadingText="Testing database connection"
  disabled={!isFormValid}
  onClick={handleTestConnection}
>
  Test Connection
</Button>

// Automatic async handling
<LoadingButton
  variant="success"
  asyncAction={async () => {
    await saveConfiguration();
    await refreshData();
  }}
  successMessage="Configuration saved and data refreshed"
  errorMessage="Failed to save configuration"
>
  Save and Refresh
</LoadingButton>

// Custom loading spinner
<Button
  variant="primary"
  loading={isGenerating}
  loadingSpinner={
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Generating APIs...</span>
    </div>
  }
>
  Generate REST APIs
</Button>
```

### Button Groups

```tsx
import { ButtonGroup, Button, IconButton } from '@/components/ui/button';
import { Edit, Copy, Trash } from 'lucide-react';

// Dialog actions
<ButtonGroup 
  label="Confirmation dialog actions"
  orientation="horizontal"
  className="justify-end mt-6"
>
  <Button variant="outline">Cancel</Button>
  <Button variant="primary">Confirm</Button>
</ButtonGroup>

// Table row actions
<ButtonGroup 
  label="Table row actions"
  orientation="horizontal"
  size="sm"
  variant="minimal"
>
  <IconButton 
    icon={Edit}
    aria-label="Edit table"
    variant="ghost"
    size="sm"
  />
  <IconButton 
    icon={Copy}
    aria-label="Duplicate table"
    variant="ghost"
    size="sm"
  />
  <IconButton 
    icon={Trash}
    aria-label="Delete table"
    variant="ghost"
    size="sm"
  />
</ButtonGroup>

// Attached button group
<ButtonGroup 
  label="View options"
  orientation="horizontal"
  attached={true}
  variant="contained"
>
  <Button variant={viewMode === 'table' ? 'primary' : 'secondary'}>
    Table View
  </Button>
  <Button variant={viewMode === 'card' ? 'primary' : 'secondary'}>
    Card View
  </Button>
  <Button variant={viewMode === 'list' ? 'primary' : 'secondary'}>
    List View
  </Button>
</ButtonGroup>

// Vertical button group
<ButtonGroup 
  label="Navigation menu"
  orientation="vertical"
  variant="separated"
  className="w-48"
>
  <Button variant="ghost" className="justify-start">
    Database Services
  </Button>
  <Button variant="ghost" className="justify-start">
    API Documentation
  </Button>
  <Button variant="ghost" className="justify-start">
    User Management
  </Button>
</ButtonGroup>
```

### Form Integration

```tsx
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';

function DatabaseConnectionForm() {
  const { handleSubmit, formState: { isValid, isSubmitting } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields... */}
      
      <ButtonGroup 
        label="Form actions"
        orientation="horizontal"
        className="justify-between mt-6"
      >
        <Button 
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          Reset Form
        </Button>
        
        <div className="space-x-2">
          <Button 
            type="button"
            variant="secondary"
            disabled={!isValid}
            onClick={handleTestConnection}
          >
            Test Connection
          </Button>
          
          <Button 
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isValid}
            announceOnPress="Database connection saved successfully"
          >
            Save Connection
          </Button>
        </div>
      </ButtonGroup>
    </form>
  );
}
```

### Responsive and Mobile Optimized

```tsx
// Responsive sizing
<Button 
  variant="primary"
  size={{ base: 'sm', md: 'md', lg: 'lg' }}
  fullWidth={{ base: true, md: false }}
>
  Save Changes
</Button>

// Mobile-optimized button group
<ButtonGroup 
  orientation={{ base: 'vertical', md: 'horizontal' }}
  fullWidth={{ base: true, md: false }}
  label="Mobile-responsive actions"
>
  <Button variant="outline">Cancel</Button>
  <Button variant="primary">Submit</Button>
</ButtonGroup>

// Touch-friendly spacing
<div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
  <Button size="lg" fullWidth={{ base: true, md: false }}>
    Primary Action
  </Button>
  <Button size="lg" variant="outline" fullWidth={{ base: true, md: false }}>
    Secondary Action
  </Button>
</div>
```

## Best Practices

### Accessibility Best Practices

1. **Always provide accessible labels for icon buttons**:
   ```tsx
   // ✅ Good
   <IconButton 
     icon={Delete} 
     aria-label="Delete database connection" 
   />
   
   // ❌ Bad
   <IconButton icon={Delete} />
   ```

2. **Use descriptive button text**:
   ```tsx
   // ✅ Good
   <Button>Save Database Connection</Button>
   
   // ❌ Bad
   <Button>Save</Button>
   ```

3. **Provide context for screen readers**:
   ```tsx
   // ✅ Good
   <Button 
     announceOnPress="Database connection test completed successfully"
     ariaDescribedBy="connection-help-text"
   >
     Test Connection
   </Button>
   ```

4. **Use proper button groups for related actions**:
   ```tsx
   // ✅ Good
   <ButtonGroup label="Dialog actions">
     <Button variant="outline">Cancel</Button>
     <Button variant="primary">Save</Button>
   </ButtonGroup>
   
   // ❌ Bad
   <div>
     <Button variant="outline">Cancel</Button>
     <Button variant="primary">Save</Button>
   </div>
   ```

### Visual Design Best Practices

1. **Use variant hierarchy appropriately**:
   - `primary`: One per page/section for the main action
   - `secondary`: Supporting actions
   - `outline`: Alternative or less important actions
   - `ghost`: Minimal impact actions like Cancel

2. **Maintain consistent sizing**:
   ```tsx
   // ✅ Good - consistent sizing in groups
   <ButtonGroup>
     <Button size="md" variant="outline">Cancel</Button>
     <Button size="md" variant="primary">Save</Button>
   </ButtonGroup>
   ```

3. **Use loading states for async operations**:
   ```tsx
   // ✅ Good
   <Button 
     loading={isSubmitting}
     loadingText="Saving changes"
   >
     Save
   </Button>
   ```

4. **Provide visual feedback for user actions**:
   ```tsx
   // ✅ Good
   <Button 
     variant="success"
     announceOnPress="Database connected successfully"
   >
     Connect
   </Button>
   ```

### Performance Best Practices

1. **Use LoadingButton for complex async operations**:
   ```tsx
   // ✅ Good - automatic error handling
   <LoadingButton
     asyncAction={handleComplexOperation}
     successMessage="Operation completed"
     errorMessage="Operation failed"
   >
     Execute
   </LoadingButton>
   ```

2. **Optimize icon usage**:
   ```tsx
   // ✅ Good - tree-shakeable icons
   import { Save } from 'lucide-react';
   
   // ❌ Bad - imports entire icon library
   import * as Icons from 'lucide-react';
   ```

3. **Use composition patterns appropriately**:
   ```tsx
   // ✅ Good - for complex button compositions
   <IconButton asChild>
     <Link href="/settings">
       <Settings />
     </Link>
   </IconButton>
   ```

### Code Organization Best Practices

1. **Import components cleanly**:
   ```tsx
   // ✅ Good
   import { Button, IconButton, ButtonGroup } from '@/components/ui/button';
   
   // ❌ Bad
   import Button from '@/components/ui/button/button';
   import IconButton from '@/components/ui/button/icon-button';
   ```

2. **Use TypeScript for prop validation**:
   ```tsx
   // ✅ Good
   interface FormActionsProps {
     onSave: () => void;
     onCancel: () => void;
     isLoading?: boolean;
   }
   
   function FormActions({ onSave, onCancel, isLoading }: FormActionsProps) {
     return (
       <ButtonGroup label="Form actions">
         <Button variant="outline" onClick={onCancel}>
           Cancel
         </Button>
         <Button variant="primary" onClick={onSave} loading={isLoading}>
           Save
         </Button>
       </ButtonGroup>
     );
   }
   ```

3. **Create reusable button patterns**:
   ```tsx
   // ✅ Good - reusable pattern
   function DeleteButton({ 
     onDelete, 
     itemName,
     ...props 
   }: { 
     onDelete: () => void; 
     itemName: string; 
   } & ButtonProps) {
     return (
       <Button
         variant="error"
         aria-label={`Delete ${itemName}`}
         announceOnPress={`${itemName} deleted successfully`}
         onClick={onDelete}
         {...props}
       >
         Delete
       </Button>
     );
   }
   ```

## Troubleshooting

### Common Issues and Solutions

#### 1. Focus Ring Not Visible

**Problem**: Focus ring not appearing during keyboard navigation.

**Solution**: Ensure focus-visible is working correctly:

```tsx
// ✅ Check for focus-visible support
<Button 
  disableFocusRing={false} // Ensure this is false (default)
  className="focus-visible:ring-2" // Custom focus ring if needed
>
  Button Text
</Button>
```

**Debugging**:
- Test with Tab key navigation (not mouse clicks)
- Check browser support for :focus-visible
- Verify Tailwind CSS includes focus-visible utilities

#### 2. Touch Targets Too Small on Mobile

**Problem**: Buttons are difficult to tap on mobile devices.

**Solution**: Verify minimum touch target sizes:

```tsx
// ✅ Ensure minimum 44x44px touch targets
<Button size="sm"> {/* Minimum 44x44px */}
  Small Button
</Button>

<IconButton 
  size="sm" 
  icon={Icon}
  aria-label="Icon button" 
/> {/* Always 44x44px minimum */}
```

**Debugging**:
- Test on actual mobile devices
- Use browser dev tools device emulation
- Check computed styles for min-height and min-width

#### 3. Loading State Not Working

**Problem**: Loading spinner not appearing or button still clickable.

**Solution**: Check loading prop implementation:

```tsx
// ✅ Correct loading implementation
<Button 
  loading={isLoading}
  onClick={handleClick}
  disabled={isLoading} // Optional: explicit disabled state
>
  Submit
</Button>

// ✅ For async operations
<LoadingButton
  asyncAction={handleAsyncAction}
  successMessage="Success!"
  errorMessage="Failed!"
>
  Async Action
</LoadingButton>
```

**Debugging**:
- Verify loading state variable is boolean
- Check if onClick handler is prevented during loading
- Ensure loading spinner is visible (check z-index and positioning)

#### 4. ARIA Labels Missing for Icon Buttons

**Problem**: Screen readers cannot identify icon button purpose.

**Solution**: Always provide aria-label for IconButton:

```tsx
// ✅ Required aria-label
<IconButton 
  icon={Delete}
  aria-label="Delete database connection" // Required!
  onClick={handleDelete}
/>

// ✅ Enhanced with description
<IconButton 
  icon={Edit}
  aria-label="Edit table schema"
  aria-describedby="edit-help-text"
  tooltip="Edit table structure and relationships"
/>
```

#### 5. Button Group Navigation Not Working

**Problem**: Arrow keys don't navigate between grouped buttons.

**Solution**: Verify ButtonGroup configuration:

```tsx
// ✅ Enable keyboard navigation
<ButtonGroup 
  enableKeyboardNavigation={true} // Default: true
  label="Actions" // Provide group label
  orientation="horizontal"
>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
</ButtonGroup>
```

**Debugging**:
- Test with arrow keys (←/→ for horizontal, ↑/↓ for vertical)
- Check that buttons are focusable (not disabled)
- Verify ARIA attributes are present
- Test with screen reader to ensure proper announcements

#### 6. Custom Styling Not Applied

**Problem**: Custom CSS classes not overriding component styles.

**Solution**: Use proper CSS class merging:

```tsx
// ✅ Proper class merging with cn() utility
import { cn } from '@/lib/utils';

<Button 
  className={cn(
    "custom-button-class",
    variant === 'special' && "special-styles"
  )}
>
  Custom Button
</Button>

// ✅ Using CSS variables for theming
<Button 
  style={{
    '--button-bg': '#custom-color',
    '--button-text': '#custom-text-color'
  }}
  className="bg-[var(--button-bg)] text-[var(--button-text)]"
>
  Themed Button
</Button>
```

#### 7. TypeScript Errors

**Problem**: TypeScript compilation errors with button props.

**Solution**: Use proper type definitions:

```tsx
// ✅ Proper prop typing
interface CustomButtonProps extends ButtonProps {
  customProp: string;
}

function CustomButton({ customProp, ...buttonProps }: CustomButtonProps) {
  return <Button {...buttonProps}>Custom: {customProp}</Button>;
}

// ✅ Forward ref typing
const CustomIconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    return <IconButton ref={ref} {...props} />;
  }
);
```

### Performance Issues

#### 1. Slow Rendering with Many Buttons

**Problem**: Page becomes slow with numerous button instances.

**Solution**: Optimize rendering patterns:

```tsx
// ✅ Memoize expensive button lists
const ButtonList = React.memo(({ items, onAction }) => (
  <div>
    {items.map(item => (
      <Button 
        key={item.id}
        onClick={() => onAction(item.id)}
      >
        {item.name}
      </Button>
    ))}
  </div>
));

// ✅ Use callback optimization
const handleClick = useCallback((id: string) => {
  // Handle click
}, []);
```

#### 2. Bundle Size Issues

**Problem**: Button component system increases bundle size significantly.

**Solution**: Use proper tree-shaking:

```tsx
// ✅ Import only what you need
import { Button } from '@/components/ui/button';

// ❌ Don't import entire module
import * as ButtonComponents from '@/components/ui/button';
```

### Testing Issues

#### 1. Accessibility Tests Failing

**Problem**: jest-axe or similar tools reporting accessibility violations.

**Solution**: Address common accessibility issues:

```tsx
// ✅ Proper test setup
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';

test('button is accessible', async () => {
  const { container } = render(
    <IconButton 
      icon={Search}
      aria-label="Search items" // Required!
    />
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 2. Interaction Tests Failing

**Problem**: Button click handlers not firing in tests.

**Solution**: Use proper testing patterns:

```tsx
// ✅ Test user interactions
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('button handles click correctly', async () => {
  const user = userEvent.setup();
  const handleClick = jest.fn();
  
  render(
    <Button onClick={handleClick}>
      Test Button
    </Button>
  );
  
  await user.click(screen.getByRole('button', { name: 'Test Button' }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Getting Help

If you encounter issues not covered in this troubleshooting guide:

1. **Check the TypeScript errors**: Most issues are caught at compile time
2. **Use browser dev tools**: Inspect generated HTML and CSS
3. **Test with assistive technology**: Use screen readers to verify accessibility
4. **Review the source code**: All components are well-documented with inline comments
5. **Check the test files**: Component tests demonstrate proper usage patterns

For additional support, refer to:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React 19 Documentation](https://react.dev/)
- [Lucide React Icons](https://lucide.dev/guide/packages/lucide-react)