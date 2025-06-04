# Toggle Component

The Toggle component provides an accessible switch control for boolean values, replacing Angular Material's `mat-slide-toggle` with a modern React implementation built on Headless UI's Switch primitive. It offers full WCAG 2.1 AA compliance, customizable styling, and seamless integration with React Hook Form.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [API Reference](#api-reference)
- [Accessibility](#accessibility)
- [Variants and Styling](#variants-and-styling)
- [Form Integration](#form-integration)
- [Migration Guide](#migration-guide)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Toggle component is designed to replace Angular Material's `mat-slide-toggle` while providing enhanced accessibility features, improved performance, and better integration with modern React patterns. Built using Headless UI Switch for accessibility and Tailwind CSS for styling.

### Key Features

- ✅ **WCAG 2.1 AA Compliant** - Meets accessibility standards with proper contrast ratios and keyboard navigation
- ✅ **Touch-Friendly** - Minimum 44×44px touch targets for mobile accessibility
- ✅ **Keyboard Navigation** - Full keyboard support with focus-visible indicators
- ✅ **Screen Reader Support** - Proper ARIA labeling and announcements
- ✅ **Form Integration** - Works seamlessly with React Hook Form and Formik
- ✅ **Customizable** - Multiple sizes, colors, and label positions
- ✅ **TypeScript Ready** - Full type safety with comprehensive interfaces
- ✅ **Theme Support** - Automatic dark/light mode adaptation

## Installation

The Toggle component is part of the UI component library and is automatically available in your project.

```tsx
import { Toggle } from '@/components/ui/toggle';
```

## Basic Usage

### Uncontrolled Toggle

```tsx
import { Toggle } from '@/components/ui/toggle';

function BasicExample() {
  return (
    <Toggle
      label="Enable notifications"
      defaultChecked={false}
      onChange={(checked) => console.log('Toggle state:', checked)}
    />
  );
}
```

### Controlled Toggle

```tsx
import { useState } from 'react';
import { Toggle } from '@/components/ui/toggle';

function ControlledExample() {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <Toggle
      label="Dark mode"
      checked={isEnabled}
      onChange={setIsEnabled}
    />
  );
}
```

## API Reference

### Toggle Props

```typescript
interface ToggleProps {
  /** Whether the toggle is checked */
  checked?: boolean;
  /** Default checked state for uncontrolled usage */
  defaultChecked?: boolean;
  /** Callback fired when toggle state changes */
  onChange?: (checked: boolean) => void;
  /** Toggle label text */
  label?: string;
  /** Additional description for tooltip and screen readers */
  description?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Label position relative to toggle */
  labelPosition?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  /** Custom CSS class */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ID for form association */
  id?: string;
  /** Form field name */
  name?: string;
  /** Custom test ID */
  'data-testid'?: string;
}
```

### Toggle Variants

The `toggleVariants` function provides consistent styling using class-variance-authority:

```typescript
const toggleVariants = cva(
  // Base styles with accessibility compliance
  [
    "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent",
    "transition-colors duration-200 ease-in-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "h-5 w-9 min-h-[44px] min-w-[44px]", // WCAG touch target compliance
        md: "h-6 w-11 min-h-[44px] min-w-[44px]",
        lg: "h-7 w-14 min-h-[44px] min-w-[44px]",
      },
      variant: {
        default: "bg-gray-200 dark:bg-gray-700 data-[checked]:bg-primary-600",
        success: "bg-gray-200 dark:bg-gray-700 data-[checked]:bg-success-600",
        warning: "bg-gray-200 dark:bg-gray-700 data-[checked]:bg-warning-600",
        danger: "bg-gray-200 dark:bg-gray-700 data-[checked]:bg-error-600",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);
```

## Accessibility

The Toggle component implements comprehensive accessibility features to meet WCAG 2.1 AA standards:

### WCAG 2.1 AA Compliance

| **Criteria** | **Implementation** | **Compliance Level** |
|---|---|---|
| **Color Contrast** | 4.5:1 minimum for text, 3:1 for UI components | ✅ AA |
| **Touch Targets** | Minimum 44×44px interactive area | ✅ AA |
| **Keyboard Navigation** | Space and Enter key support | ✅ AA |
| **Focus Management** | Visible focus indicators with 2px outline | ✅ AA |
| **Screen Reader Support** | Proper ARIA labeling and state announcements | ✅ AA |

### Keyboard Interactions

| **Key** | **Action** |
|---|---|
| `Space` | Toggles the switch state |
| `Enter` | Toggles the switch state |
| `Tab` | Moves focus to/from the toggle |

### ARIA Attributes

The component automatically manages ARIA attributes:

- `role="switch"` - Identifies the element as a toggle switch
- `aria-checked` - Indicates the current state (true/false)
- `aria-label` - Provides accessible name when no visible label
- `aria-labelledby` - References associated label element
- `aria-describedby` - References description/tooltip content

### Screen Reader Announcements

```typescript
// Screen reader will announce:
// "Dark mode, switch, off" (when unchecked)
// "Dark mode, switch, on" (when checked)
// "Dark mode, switch, disabled" (when disabled)
```

## Variants and Styling

### Size Variants

```tsx
<Toggle size="sm" label="Small toggle" />
<Toggle size="md" label="Medium toggle" /> {/* Default */}
<Toggle size="lg" label="Large toggle" />
```

### Color Variants

```tsx
<Toggle variant="default" label="Default blue" />
<Toggle variant="success" label="Success green" />
<Toggle variant="warning" label="Warning orange" />
<Toggle variant="danger" label="Danger red" />
```

### Label Positioning

```tsx
<Toggle labelPosition="left" label="Label on left" />
<Toggle labelPosition="right" label="Label on right" /> {/* Default */}
<Toggle labelPosition="top" label="Label on top" />
<Toggle labelPosition="bottom" label="Label on bottom" />
<Toggle labelPosition="none" aria-label="No visible label" />
```

### Custom Styling

```tsx
<Toggle
  className="custom-toggle-class"
  label="Custom styled toggle"
  style={{ marginTop: '1rem' }}
/>
```

## Form Integration

### React Hook Form Integration

```tsx
import { useForm, Controller } from 'react-hook-form';
import { Toggle } from '@/components/ui/toggle';

interface FormData {
  notifications: boolean;
  darkMode: boolean;
}

function FormExample() {
  const { control, handleSubmit, watch } = useForm<FormData>({
    defaultValues: {
      notifications: false,
      darkMode: true,
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="notifications"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Toggle
            label="Enable notifications"
            description="Receive email notifications for important updates"
            checked={value}
            onChange={onChange}
          />
        )}
      />

      <Controller
        name="darkMode"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Toggle
            label="Dark mode"
            description="Use dark theme for better viewing in low light"
            checked={value}
            onChange={onChange}
            variant="default"
          />
        )}
      />

      <button type="submit">Save Settings</button>
    </form>
  );
}
```

### Validation with React Hook Form

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

type FormData = z.infer<typeof schema>;

function ValidationExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <Controller
        name="acceptTerms"
        control={control}
        render={({ field: { onChange, value } }) => (
          <div>
            <Toggle
              label="I accept the terms and conditions"
              checked={value}
              onChange={onChange}
              variant={errors.acceptTerms ? 'danger' : 'default'}
            />
            {errors.acceptTerms && (
              <p className="text-error-600 text-sm mt-1">
                {errors.acceptTerms.message}
              </p>
            )}
          </div>
        )}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Migration Guide

### From Angular Material mat-slide-toggle

The Toggle component replaces Angular Material's `mat-slide-toggle` with enhanced functionality:

#### Angular Implementation (Before)

```html
<!-- df-theme-toggle.component.html -->
<mat-slide-toggle
  color="primary"
  [checked]="isDarkMode$ | async"
  (change)="toggle()">
</mat-slide-toggle>

<!-- df-dynamic-field.component.html -->
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

#### React Implementation (After)

```tsx
// ThemeToggle.tsx
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  return (
    <Toggle
      checked={isDarkMode}
      onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      label="Dark mode"
      variant="default"
    />
  );
}

// DynamicField.tsx - Boolean field
import { Controller } from 'react-hook-form';
import { Toggle } from '@/components/ui/toggle';

interface BooleanFieldProps {
  schema: {
    type: 'boolean';
    label: string;
    description?: string;
  };
  control: Control<any>;
  showLabel?: boolean;
}

export function BooleanField({ schema, control, showLabel = true }: BooleanFieldProps) {
  return (
    <Controller
      name={schema.name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <Toggle
          label={showLabel ? schema.label : undefined}
          aria-label={schema.label}
          description={schema.description}
          checked={value}
          onChange={onChange}
          variant="default"
        />
      )}
    />
  );
}
```

#### Migration Checklist

- [ ] **Replace imports**: Change `MatSlideToggleModule` to `Toggle` component import
- [ ] **Update form integration**: Replace `[formControl]` with React Hook Form `Controller`
- [ ] **Migrate observables**: Convert RxJS `BehaviorSubject` to React state management
- [ ] **Update event handlers**: Replace `(change)` with `onChange` prop
- [ ] **Convert templates**: Replace Angular template syntax with JSX
- [ ] **Update styling**: Replace Angular Material theming with Tailwind CSS variants
- [ ] **Add accessibility**: Ensure ARIA labels and descriptions are properly set
- [ ] **Test functionality**: Verify all toggle interactions work correctly

### Key Differences

| **Feature** | **Angular Material** | **React Toggle** |
|---|---|---|
| **Base Component** | `mat-slide-toggle` | Headless UI `Switch` |
| **Form Integration** | `ReactiveFormsModule` | React Hook Form |
| **State Management** | RxJS `BehaviorSubject` | React state/context |
| **Styling** | Angular Material theme | Tailwind CSS + CVA |
| **Event Handling** | `(change)` output | `onChange` prop |
| **Accessibility** | Built-in Material a11y | Enhanced WCAG 2.1 AA |
| **Touch Targets** | Standard Material | Minimum 44×44px |
| **Theme Support** | Material theme system | Automatic dark/light mode |

## Examples

### Settings Panel

```tsx
import { Toggle } from '@/components/ui/toggle';

function SettingsPanel() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
    darkMode: true,
    analytics: false,
  });

  const updateSetting = (key: keyof typeof settings) => (value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">User Preferences</h2>
      
      <div className="space-y-4">
        <Toggle
          label="Enable notifications"
          description="Receive email and push notifications"
          checked={settings.notifications}
          onChange={updateSetting('notifications')}
          size="md"
        />

        <Toggle
          label="Auto-save documents"
          description="Automatically save changes every 30 seconds"
          checked={settings.autoSave}
          onChange={updateSetting('autoSave')}
          variant="success"
        />

        <Toggle
          label="Dark mode"
          description="Use dark theme for better viewing in low light"
          checked={settings.darkMode}
          onChange={updateSetting('darkMode')}
        />

        <Toggle
          label="Analytics tracking"
          description="Help improve our service by sharing usage data"
          checked={settings.analytics}
          onChange={updateSetting('analytics')}
          variant="warning"
        />
      </div>
    </div>
  );
}
```

### Database Connection Settings

```tsx
import { Controller } from 'react-hook-form';
import { Toggle } from '@/components/ui/toggle';

interface DatabaseSettingsProps {
  control: Control<DatabaseConfig>;
}

function DatabaseSettings({ control }: DatabaseSettingsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-md font-medium">Connection Options</h3>
      
      <Controller
        name="ssl.enabled"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Toggle
            label="Enable SSL"
            description="Use SSL/TLS encryption for database connections"
            checked={value}
            onChange={onChange}
            variant="success"
          />
        )}
      />

      <Controller
        name="ssl.rejectUnauthorized"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Toggle
            label="Verify SSL certificates"
            description="Reject connections with invalid SSL certificates"
            checked={value}
            onChange={onChange}
            variant="warning"
          />
        )}
      />

      <Controller
        name="readOnly"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Toggle
            label="Read-only mode"
            description="Prevent write operations to the database"
            checked={value}
            onChange={onChange}
            variant="danger"
          />
        )}
      />
    </div>
  );
}
```

### API Security Configuration

```tsx
function ApiSecuritySettings() {
  const { control } = useForm<SecurityConfig>();

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Controller
          name="requireApiKey"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Toggle
              label="Require API Key"
              description="All API requests must include a valid API key"
              checked={value}
              onChange={onChange}
              size="lg"
              variant="danger"
            />
          )}
        />

        <Controller
          name="enableRateLimit"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Toggle
              label="Enable rate limiting"
              description="Limit the number of requests per minute"
              checked={value}
              onChange={onChange}
              variant="warning"
            />
          )}
        />

        <Controller
          name="logRequests"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Toggle
              label="Log API requests"
              description="Store detailed logs of all API calls"
              checked={value}
              onChange={onChange}
              variant="default"
            />
          )}
        />
      </div>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

#### 1. Toggle not responding to clicks

**Problem**: Toggle appears but doesn't change state when clicked.

**Solution**: Ensure you're using either controlled or uncontrolled pattern consistently:

```tsx
// ❌ Incorrect: Missing onChange handler
<Toggle checked={isEnabled} />

// ✅ Correct: Controlled component
<Toggle checked={isEnabled} onChange={setIsEnabled} />

// ✅ Correct: Uncontrolled component
<Toggle defaultChecked={false} onChange={(checked) => console.log(checked)} />
```

#### 2. Form validation not working

**Problem**: Toggle value not being captured in form submission.

**Solution**: Use proper form integration with Controller:

```tsx
// ❌ Incorrect: Direct usage without form integration
<Toggle label="Accept terms" checked={acceptTerms} onChange={setAcceptTerms} />

// ✅ Correct: Using Controller for form integration
<Controller
  name="acceptTerms"
  control={control}
  render={({ field: { onChange, value } }) => (
    <Toggle
      label="Accept terms"
      checked={value}
      onChange={onChange}
    />
  )}
/>
```

#### 3. Accessibility warnings

**Problem**: Screen reader or accessibility tools reporting issues.

**Solution**: Ensure proper labeling:

```tsx
// ❌ Incorrect: Missing accessible name
<Toggle checked={isEnabled} onChange={setIsEnabled} />

// ✅ Correct: With visible label
<Toggle label="Enable feature" checked={isEnabled} onChange={setIsEnabled} />

// ✅ Correct: With aria-label when no visible label
<Toggle 
  aria-label="Enable dark mode"
  checked={isEnabled} 
  onChange={setIsEnabled} 
/>
```

#### 4. Touch targets too small on mobile

**Problem**: Toggle is difficult to tap on mobile devices.

**Solution**: The component automatically ensures 44×44px minimum touch targets, but verify your CSS isn't overriding this:

```tsx
// ✅ Automatic touch target compliance
<Toggle size="sm" label="Small toggle" /> {/* Still meets 44x44px requirement */}

// ❌ Don't override minimum sizes in custom CSS
.custom-toggle {
  width: 20px !important; /* This breaks accessibility */
  height: 20px !important;
}
```

#### 5. Dark mode styling issues

**Problem**: Toggle doesn't adapt properly to dark mode.

**Solution**: Ensure your theme provider is properly configured:

```tsx
// Verify ThemeProvider is wrapping your app
function App() {
  return (
    <ThemeProvider>
      <Toggle label="Dark mode toggle" />
    </ThemeProvider>
  );
}
```

### Debug Mode

Enable debug mode to troubleshoot toggle behavior:

```tsx
<Toggle
  label="Debug toggle"
  checked={isEnabled}
  onChange={(checked) => {
    console.log('Toggle changed:', checked);
    setIsEnabled(checked);
  }}
  data-testid="debug-toggle"
/>
```

## Best Practices

### Do's ✅

1. **Always provide accessible labels**:
   ```tsx
   <Toggle label="Enable notifications" />
   // or
   <Toggle aria-label="Toggle dark mode" />
   ```

2. **Use descriptive descriptions for complex settings**:
   ```tsx
   <Toggle
     label="SSL verification"
     description="Verify SSL certificates to ensure secure connections"
   />
   ```

3. **Choose appropriate variants for semantic meaning**:
   ```tsx
   <Toggle variant="danger" label="Delete data permanently" />
   <Toggle variant="success" label="Enable backup" />
   ```

4. **Group related toggles logically**:
   ```tsx
   <div className="space-y-4">
     <h3>Security Settings</h3>
     <Toggle label="Require 2FA" />
     <Toggle label="Enable audit logging" />
   </div>
   ```

5. **Use consistent sizing within a form or section**:
   ```tsx
   <div className="space-y-4">
     <Toggle size="md" label="Setting 1" />
     <Toggle size="md" label="Setting 2" />
     <Toggle size="md" label="Setting 3" />
   </div>
   ```

6. **Provide immediate feedback for critical actions**:
   ```tsx
   <Toggle
     label="Maintenance mode"
     onChange={(checked) => {
       if (checked) {
         toast.warning('Application will be unavailable during maintenance');
       }
     }}
     variant="warning"
   />
   ```

### Don'ts ❌

1. **Don't use toggles for actions that should be buttons**:
   ```tsx
   // ❌ Wrong: Actions should be buttons
   <Toggle label="Save document" />
   
   // ✅ Correct: States should be toggles
   <Toggle label="Auto-save enabled" />
   ```

2. **Don't use toggles for mutually exclusive options**:
   ```tsx
   // ❌ Wrong: Use radio buttons instead
   <Toggle label="Light theme" />
   <Toggle label="Dark theme" />
   
   // ✅ Correct: Use toggle for binary choice
   <Toggle label="Dark mode" />
   ```

3. **Don't override accessibility features**:
   ```tsx
   // ❌ Wrong: Removes focus indicators
   <Toggle className="focus:outline-none" />
   
   // ✅ Correct: Extend existing styles
   <Toggle className="custom-spacing" />
   ```

4. **Don't use loading state for immediate actions**:
   ```tsx
   // ❌ Wrong: Loading for instant state changes
   <Toggle loading={true} label="Dark mode" />
   
   // ✅ Correct: Loading for async operations
   <Toggle 
     loading={isSaving} 
     label="Enable API access"
     onChange={handleApiToggle}
   />
   ```

5. **Don't use ambiguous labels**:
   ```tsx
   // ❌ Wrong: Unclear what "Enable" means
   <Toggle label="Enable" />
   
   // ✅ Correct: Specific and clear
   <Toggle label="Enable email notifications" />
   ```

### Performance Considerations

1. **Minimize re-renders with proper memoization**:
   ```tsx
   const handleToggle = useCallback((checked: boolean) => {
     updateSettings({ notifications: checked });
   }, [updateSettings]);
   
   <Toggle label="Notifications" onChange={handleToggle} />
   ```

2. **Use proper form state management**:
   ```tsx
   // Use react-hook-form for complex forms
   const { control } = useForm({ mode: 'onChange' });
   ```

3. **Avoid inline functions in render**:
   ```tsx
   // ❌ Creates new function on every render
   <Toggle onChange={(checked) => setState(checked)} />
   
   // ✅ Stable reference
   <Toggle onChange={handleChange} />
   ```

### Testing Best Practices

1. **Test both interaction methods**:
   ```tsx
   // Test mouse clicks
   await user.click(toggle);
   
   // Test keyboard interaction
   toggle.focus();
   await user.keyboard(' '); // Space key
   ```

2. **Verify accessibility attributes**:
   ```tsx
   expect(toggle).toHaveAttribute('role', 'switch');
   expect(toggle).toHaveAttribute('aria-checked', 'true');
   ```

3. **Test form integration**:
   ```tsx
   // Verify form values are updated
   expect(getValues('notifications')).toBe(true);
   ```

---

## Component Architecture

The Toggle component is built with the following architecture:

- **Base**: Headless UI Switch for accessibility
- **Styling**: Tailwind CSS with class-variance-authority
- **Types**: Full TypeScript integration
- **Testing**: Vitest + React Testing Library
- **Documentation**: Storybook stories

For implementation details, see:
- [`toggle.tsx`](./toggle.tsx) - Main component
- [`toggle-variants.ts`](./toggle-variants.ts) - Styling variants
- [`toggle.test.tsx`](./toggle.test.tsx) - Test suite
- [`toggle.stories.tsx`](./toggle.stories.tsx) - Storybook documentation