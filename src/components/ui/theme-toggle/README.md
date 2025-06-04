# ThemeToggle Component

A fully accessible React component that provides three-state theme switching functionality (light/dark/system) for the DreamFactory Admin Interface. This component replaces the Angular Material `mat-slide-toggle` implementation with a modern React-based solution using Headless UI and Tailwind CSS.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation & Setup](#installation--setup)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Accessibility](#accessibility)
- [Migration Guide](#migration-guide)
- [Integration](#integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

The ThemeToggle component is a core UI element that enables users to switch between light, dark, and system theme preferences throughout the DreamFactory Admin Interface. It provides seamless integration with the application's theme system while maintaining WCAG 2.1 AA accessibility compliance.

### Key Technologies

- **React 19.0**: Modern React with concurrent features and enhanced performance
- **Headless UI 2.0+**: Accessible, unstyled Switch component for toggle functionality
- **Tailwind CSS 4.1+**: Utility-first styling with enhanced accessibility features
- **TypeScript 5.8+**: Complete type safety with advanced inference capabilities
- **Theme Context**: React context-based theme state management

## Features

### Core Functionality
- ✅ **Three-State Theme System**: Support for light, dark, and system preferences
- ✅ **System Theme Detection**: Automatic detection and following of OS-level theme changes
- ✅ **Persistent Preferences**: User selections are saved to localStorage with `df-admin-theme` key
- ✅ **Real-Time Updates**: Instant theme application across the entire application
- ✅ **Theme Transitions**: Smooth visual transitions between theme states (configurable)

### Accessibility Features
- ✅ **WCAG 2.1 AA Compliance**: Meets level AA accessibility standards
- ✅ **Keyboard Navigation**: Full keyboard support with proper focus management
- ✅ **Screen Reader Support**: Comprehensive ARIA labeling and announcements
- ✅ **Touch Target Compliance**: Minimum 44x44px interactive areas for mobile accessibility
- ✅ **High Contrast Support**: Enhanced visibility in high contrast modes
- ✅ **Focus-Visible Support**: Keyboard-only focus indicators with 2px outline

### Design System Integration
- ✅ **Design Token Compliance**: Uses WCAG-compliant color tokens from Section 7.7.1
- ✅ **Responsive Design**: Mobile-first approach with consistent behavior across devices
- ✅ **Brand Consistency**: Aligns with DreamFactory visual design language
- ✅ **Variant Support**: Multiple size and styling variants for different contexts

## Installation & Setup

### Prerequisites

Ensure your project has the required dependencies:

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "next": "^15.1.0",
    "@headlessui/react": "^2.0.0",
    "tailwindcss": "^4.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

### Theme Provider Setup

The ThemeToggle component requires the ThemeProvider to be set up at the root of your application:

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/layout/theme/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          defaultTheme="system"
          storageKey="df-admin-theme"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Component Import

```tsx
// Import the component and types
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { ThemeToggleProps } from '@/components/ui/theme-toggle';

// Or use the barrel import
import { ThemeToggle } from '@/components/ui';
```

## API Reference

### ThemeToggle Component

```tsx
interface ThemeToggleProps {
  /** Visual size variant */
  size?: 'sm' | 'md' | 'lg';
  
  /** Visual style variant */
  variant?: 'default' | 'outline' | 'ghost';
  
  /** Whether the toggle is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Accessible label for screen readers */
  'aria-label'?: string;
  
  /** Additional description for accessibility */
  'aria-describedby'?: string;
  
  /** Show theme labels next to toggle */
  showLabels?: boolean;
  
  /** Custom labels for theme states */
  labels?: {
    light: string;
    dark: string;
    system: string;
  };
  
  /** Show current theme indicator */
  showIndicator?: boolean;
  
  /** Callback when theme changes */
  onThemeChange?: (theme: ThemeMode) => void;
  
  /** Custom theme icons */
  icons?: {
    light: React.ComponentType<{ className?: string }>;
    dark: React.ComponentType<{ className?: string }>;
    system: React.ComponentType<{ className?: string }>;
  };
}
```

### Theme Types

```tsx
/** Available theme modes */
type ThemeMode = 'light' | 'dark' | 'system';

/** Resolved theme after system detection */
type ResolvedTheme = 'light' | 'dark';

/** Theme context state */
interface ThemeContextState {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  mounted: boolean;
}
```

### useTheme Hook

```tsx
const {
  theme,           // Current theme setting
  resolvedTheme,   // Actual applied theme
  systemTheme,     // System detected theme
  setTheme,        // Function to change theme
  mounted          // Whether theme system is ready
} = useTheme();
```

### useThemeUtils Hook

```tsx
const {
  toggleTheme,       // Toggle between light/dark
  resetToSystem,     // Reset to system preference
  isTheme,          // Check current theme mode
  isResolvedTheme,  // Check resolved theme
  getSystemTheme,   // Get system preference
  isSystemThemeSupported // Check system support
} = useThemeUtils();
```

## Usage Examples

### Basic Usage

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>DreamFactory Admin</h1>
      <ThemeToggle />
    </header>
  );
}
```

### With Size Variants

```tsx
// Small toggle for compact layouts
<ThemeToggle size="sm" />

// Medium toggle (default)
<ThemeToggle size="md" />

// Large toggle for prominent placement
<ThemeToggle size="lg" />
```

### With Style Variants

```tsx
// Default solid styling
<ThemeToggle variant="default" />

// Outlined styling
<ThemeToggle variant="outline" />

// Ghost styling for minimal appearance
<ThemeToggle variant="ghost" />
```

### With Labels and Indicators

```tsx
<ThemeToggle 
  showLabels={true}
  showIndicator={true}
  labels={{
    light: 'Light Mode',
    dark: 'Dark Mode',
    system: 'Auto'
  }}
/>
```

### With Custom Icons

```tsx
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

<ThemeToggle 
  icons={{
    light: SunIcon,
    dark: MoonIcon,
    system: ComputerDesktopIcon
  }}
/>
```

### With Custom Accessibility

```tsx
<ThemeToggle 
  aria-label="Switch between light and dark themes"
  aria-describedby="theme-description"
  onThemeChange={(theme) => {
    // Announce theme change to screen readers
    announceToScreenReader(`Theme changed to ${theme} mode`);
  }}
/>

<div id="theme-description" className="sr-only">
  Toggle between light mode, dark mode, or automatic system preference
</div>
```

### Programmatic Theme Control

```tsx
import { useTheme, useThemeUtils } from '@/components/layout/theme/theme-provider';

function CustomThemeControls() {
  const { theme, resolvedTheme } = useTheme();
  const { toggleTheme, resetToSystem } = useThemeUtils();

  return (
    <div className="flex gap-2">
      <button onClick={toggleTheme}>
        Toggle Theme (Current: {resolvedTheme})
      </button>
      
      <button onClick={resetToSystem}>
        Use System Preference
      </button>
      
      <ThemeToggle 
        onThemeChange={(newTheme) => {
          console.log(`Theme changed from ${theme} to ${newTheme}`);
        }}
      />
    </div>
  );
}
```

### Advanced Integration

```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/components/layout/theme/theme-provider';

function AdvancedThemeExample() {
  const { theme, resolvedTheme, mounted } = useTheme();

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Current theme: {theme}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Resolved: {resolvedTheme}
        </span>
      </div>
      
      <ThemeToggle 
        size="lg"
        showLabels={true}
        className="border border-gray-200 dark:border-gray-700 rounded-lg p-2"
      />
    </div>
  );
}
```

## Accessibility

The ThemeToggle component follows WCAG 2.1 AA accessibility guidelines and provides comprehensive support for users with disabilities.

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus the toggle control |
| `Space` or `Enter` | Activate the toggle and cycle through themes |
| `Shift + Tab` | Move focus to previous element |

### Screen Reader Support

- **Role**: Uses `switch` role for proper semantic meaning
- **State**: Announces current theme state and changes
- **Labels**: Provides descriptive labels for each theme option
- **Live Regions**: Announces theme changes using `aria-live` regions

### ARIA Attributes

```tsx
// Example of ARIA implementation
<Switch
  checked={theme === 'dark'}
  onChange={handleThemeChange}
  className={toggleClasses}
  aria-label="Toggle between light and dark themes"
  aria-describedby="theme-description"
  role="switch"
  aria-checked={theme === 'dark'}
>
  <span className="sr-only">
    {theme === 'system' ? 'System theme' : `${theme} theme`} active
  </span>
  {/* Toggle indicator */}
</Switch>
```

### Touch Target Compliance

All interactive elements meet the minimum 44x44px touch target requirement:

```tsx
// Size variants maintain accessibility standards
const sizeClasses = {
  sm: "h-11 min-w-[44px]", // 44px minimum
  md: "h-12 min-w-[48px]", // Enhanced target
  lg: "h-14 min-w-[56px]"  // Premium target
};
```

### Color Contrast Compliance

All color combinations meet WCAG 2.1 AA standards:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio  
- **UI components**: Minimum 3:1 contrast ratio
- **Focus indicators**: 2px outline with 7.14:1 contrast ratio

### High Contrast Mode Support

The component adapts to high contrast preferences:

```css
@media (prefers-contrast: high) {
  .theme-toggle {
    border-width: 2px;
    border-color: currentColor;
  }
  
  .theme-toggle:focus-visible {
    outline-width: 3px;
    outline-color: highlight;
  }
}
```

## Migration Guide

### From Angular Material to React

This guide helps migrate from the Angular `df-theme-toggle` component to the React implementation.

#### Angular Implementation (Before)

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

#### React Implementation (After)

```tsx
// theme-toggle.tsx
import { Switch } from '@headlessui/react';
import { useTheme } from '@/components/layout/theme/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const handleToggle = () => {
    if (theme === 'system') {
      setTheme('dark');
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  return (
    <Switch
      checked={theme === 'dark'}
      onChange={handleToggle}
      className="theme-toggle"
    >
      {/* Switch implementation */}
    </Switch>
  );
}
```

#### Key Migration Changes

| Aspect | Angular Material | React Implementation |
|--------|------------------|---------------------|
| **Component Type** | `mat-slide-toggle` | Headless UI `Switch` |
| **State Management** | `BehaviorSubject` | React Context `useTheme` |
| **Theme States** | Boolean (dark/light) | Three-state (light/dark/system) |
| **Styling** | Material Design | Tailwind CSS + Design Tokens |
| **Accessibility** | Material a11y | WCAG 2.1 AA compliant |
| **Event Handling** | `(change)` event | `onChange` prop |
| **Type Safety** | Angular types | TypeScript 5.8+ interfaces |

#### Migration Steps

1. **Replace Component Import**:
   ```typescript
   // Remove Angular Material import
   - import { MatSlideToggleModule } from '@angular/material/slide-toggle';
   
   // Add React component import
   + import { ThemeToggle } from '@/components/ui/theme-toggle';
   ```

2. **Update State Management**:
   ```typescript
   // Remove Angular service injection
   - themeService = inject(DfThemeService);
   - isDarkMode$: BehaviorSubject<boolean>
   
   // Use React hook
   + const { theme, setTheme } = useTheme();
   ```

3. **Replace Template**:
   ```html
   <!-- Remove Angular template -->
   - <mat-slide-toggle [checked]="isDarkMode$ | async" (change)="toggle()">
   - </mat-slide-toggle>
   
   <!-- Add React component -->
   + <ThemeToggle />
   ```

4. **Update Event Handling**:
   ```typescript
   // Remove Observable pattern
   - toggle() {
   -   this.isDarkMode$.subscribe(isDarkMode => {
   -     this.themeService.setThemeMode(!isDarkMode);
   -   });
   -   this.isDarkMode$.next(!this.isDarkMode$.value);
   - }
   
   // Use direct theme setting (handled internally)
   // No additional code needed - handled by component
   ```

#### Enhanced Features Available

The React implementation provides several enhancements over the Angular version:

1. **System Theme Support**: Automatic detection of OS preference
2. **Better Accessibility**: WCAG 2.1 AA compliance with screen reader support
3. **Improved Performance**: React 19 optimizations with concurrent features
4. **Type Safety**: Enhanced TypeScript support with strict typing
5. **Customization**: Multiple variants and styling options
6. **Mobile Optimization**: Proper touch targets and responsive design

## Integration

### Theme Provider Integration

The ThemeToggle component integrates seamlessly with the application's theme system through React Context:

```tsx
// Root layout setup
import { ThemeProvider } from '@/components/layout/theme/theme-provider';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="df-admin-theme" 
      enableSystem={true}
    >
      {children}
    </ThemeProvider>
  );
}

// Component usage anywhere in the tree
function NavigationBar() {
  return (
    <nav>
      <ThemeToggle />
    </nav>
  );
}
```

### State Management Integration

Integration with Zustand or other state management libraries:

```tsx
// stores/theme-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  userPreferences: {
    themePreference: ThemeMode;
    autoSwitch: boolean;
    highContrast: boolean;
  };
  updateThemePreference: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      userPreferences: {
        themePreference: 'system',
        autoSwitch: true,
        highContrast: false,
      },
      updateThemePreference: (theme) => 
        set((state) => ({
          userPreferences: {
            ...state.userPreferences,
            themePreference: theme,
          }
        })),
    }),
    {
      name: 'theme-preferences',
    }
  )
);

// Component integration
function EnhancedThemeToggle() {
  const { setTheme } = useTheme();
  const { updateThemePreference } = useThemeStore();

  const handleThemeChange = (theme: ThemeMode) => {
    setTheme(theme);
    updateThemePreference(theme);
  };

  return (
    <ThemeToggle onThemeChange={handleThemeChange} />
  );
}
```

### API Integration

Integration with backend preferences:

```tsx
// hooks/use-theme-sync.ts
import { useTheme } from '@/components/layout/theme/theme-provider';
import { useMutation, useQuery } from '@tanstack/react-query';

interface UserPreferences {
  themeMode: ThemeMode;
  // other preferences...
}

export function useThemeSync() {
  const { setTheme } = useTheme();

  // Fetch user preferences from API
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => fetch('/api/user/preferences').then(res => res.json()),
  });

  // Sync theme changes to API
  const { mutate: updateTheme } = useMutation({
    mutationFn: (theme: ThemeMode) => 
      fetch('/api/user/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ themeMode: theme }),
      }),
  });

  // Sync local theme with server preferences
  useEffect(() => {
    if (preferences?.themeMode) {
      setTheme(preferences.themeMode);
    }
  }, [preferences, setTheme]);

  return { updateTheme };
}

// Usage in component
function SyncedThemeToggle() {
  const { updateTheme } = useThemeSync();

  return (
    <ThemeToggle 
      onThemeChange={(theme) => {
        updateTheme(theme);
      }}
    />
  );
}
```

### Testing Integration

Integration with Vitest and React Testing Library:

```tsx
// __tests__/theme-toggle.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/components/layout/theme/theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider defaultTheme="light">
      {ui}
    </ThemeProvider>
  );
};

describe('ThemeToggle Integration', () => {
  it('integrates with theme context', () => {
    renderWithTheme(<ThemeToggle />);
    
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAccessibleName(/theme/i);
  });

  it('persists theme changes', () => {
    renderWithTheme(<ThemeToggle />);
    
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    
    // Verify localStorage was updated
    expect(localStorage.getItem('df-admin-theme')).toBe('dark');
  });
});
```

## Best Practices

### Performance Optimization

1. **Lazy Loading**: Load ThemeToggle only when needed
   ```tsx
   const ThemeToggle = lazy(() => import('@/components/ui/theme-toggle'));
   
   function Header() {
     return (
       <header>
         <Suspense fallback={<ThemeToggleSkeleton />}>
           <ThemeToggle />
         </Suspense>
       </header>
     );
   }
   ```

2. **Memoization**: Prevent unnecessary re-renders
   ```tsx
   const MemoizedThemeToggle = memo(ThemeToggle);
   
   // Or with custom comparison
   const MemoizedThemeToggle = memo(ThemeToggle, (prev, next) => {
     return prev.size === next.size && prev.variant === next.variant;
   });
   ```

3. **Bundle Optimization**: Use tree-shaking friendly imports
   ```tsx
   // Good - specific import
   import { ThemeToggle } from '@/components/ui/theme-toggle';
   
   // Avoid - barrel import for single component
   import { ThemeToggle } from '@/components/ui';
   ```

### Accessibility Best Practices

1. **Descriptive Labels**: Provide clear context
   ```tsx
   <ThemeToggle 
     aria-label="Switch between light and dark themes"
     aria-describedby="theme-help-text"
   />
   <div id="theme-help-text" className="sr-only">
     Choose between light mode, dark mode, or automatic based on your system preference
   </div>
   ```

2. **Reduced Motion**: Respect user preferences
   ```tsx
   <ThemeToggle 
     className="motion-reduce:transition-none"
     disableTransitionOnChange={prefersReducedMotion}
   />
   ```

3. **Focus Management**: Maintain proper focus order
   ```tsx
   function NavigationMenu() {
     return (
       <nav role="navigation" aria-label="Main navigation">
         <ul>
           <li><a href="/dashboard">Dashboard</a></li>
           <li><a href="/services">Services</a></li>
           <li>
             <ThemeToggle aria-label="Theme settings" />
           </li>
         </ul>
       </nav>
     );
   }
   ```

### Design System Integration

1. **Consistent Spacing**: Use design system tokens
   ```tsx
   <div className="flex items-center gap-4">
     <UserMenu />
     <ThemeToggle className="ml-auto" />
   </div>
   ```

2. **Brand Consistency**: Maintain visual hierarchy
   ```tsx
   // Primary navigation
   <ThemeToggle size="md" variant="default" />
   
   // Secondary context
   <ThemeToggle size="sm" variant="ghost" />
   
   // Settings page
   <ThemeToggle size="lg" variant="outline" showLabels={true} />
   ```

3. **Responsive Behavior**: Adapt to screen sizes
   ```tsx
   <ThemeToggle 
     size={{
       sm: 'sm',
       md: 'md',
       lg: 'lg'
     }}
     showLabels={{
       sm: false,
       md: true,
       lg: true
     }}
   />
   ```

### State Management Best Practices

1. **Single Source of Truth**: Use theme context consistently
   ```tsx
   // Good - use theme context
   const { theme } = useTheme();
   
   // Avoid - duplicate state
   const [localTheme, setLocalTheme] = useState('light');
   ```

2. **Error Boundaries**: Handle theme errors gracefully
   ```tsx
   function ThemeErrorBoundary({ children }: { children: React.ReactNode }) {
     return (
       <ErrorBoundary
         fallback={
           <ThemeToggle 
             disabled 
             aria-label="Theme toggle unavailable"
           />
         }
       >
         {children}
       </ErrorBoundary>
     );
   }
   ```

3. **Hydration Safety**: Prevent SSR mismatches
   ```tsx
   function SafeThemeToggle() {
     const { mounted } = useTheme();
     
     if (!mounted) {
       return <ThemeToggleSkeleton />;
     }
     
     return <ThemeToggle />;
   }
   ```

## Troubleshooting

### Common Issues and Solutions

#### 1. Theme Toggle Not Working

**Problem**: Toggle appears but doesn't change theme

**Solutions**:
- Verify ThemeProvider is wrapping your app:
  ```tsx
  // Check if this exists in your root layout
  <ThemeProvider>
    <App />
  </ThemeProvider>
  ```

- Check for React strict mode double-rendering:
  ```tsx
  // This is expected behavior in development
  <React.StrictMode>
    <App />
  </React.StrictMode>
  ```

- Verify localStorage is available:
  ```tsx
  if (typeof window !== 'undefined' && window.localStorage) {
    // localStorage is available
  }
  ```

#### 2. Hydration Mismatch Errors

**Problem**: Server and client render different content

**Solutions**:
- Use the `mounted` state from useTheme:
  ```tsx
  const { mounted } = useTheme();
  
  if (!mounted) {
    return <ThemeToggleSkeleton />;
  }
  ```

- Add `suppressHydrationWarning` to HTML element:
  ```tsx
  <html suppressHydrationWarning>
  ```

- Use dynamic imports for client-only components:
  ```tsx
  const ThemeToggle = dynamic(
    () => import('@/components/ui/theme-toggle'),
    { ssr: false }
  );
  ```

#### 3. Accessibility Issues

**Problem**: Screen readers not announcing theme changes

**Solutions**:
- Add proper ARIA live regions:
  ```tsx
  <div aria-live="polite" aria-atomic="true" className="sr-only">
    Theme changed to {resolvedTheme} mode
  </div>
  ```

- Verify ARIA labels are present:
  ```tsx
  <ThemeToggle aria-label="Toggle theme" />
  ```

- Test with actual screen readers (NVDA, VoiceOver, JAWS)

#### 4. Performance Issues

**Problem**: Theme toggle causes layout shifts or slow renders

**Solutions**:
- Use CSS custom properties for smooth transitions:
  ```css
  :root {
    --transition-colors: 150ms ease-in-out;
  }
  
  * {
    transition: background-color var(--transition-colors),
                color var(--transition-colors),
                border-color var(--transition-colors);
  }
  ```

- Implement skeleton loading states:
  ```tsx
  function ThemeToggleSkeleton() {
    return (
      <div 
        className="w-12 h-6 bg-gray-200 rounded-full animate-pulse" 
        aria-hidden="true"
      />
    );
  }
  ```

- Use `memo` to prevent unnecessary re-renders:
  ```tsx
  export const ThemeToggle = memo(function ThemeToggle(props) {
    // Component implementation
  });
  ```

#### 5. System Theme Not Detected

**Problem**: System theme preference not being followed

**Solutions**:
- Check browser support for `prefers-color-scheme`:
  ```tsx
  const supportsSystemTheme = window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').media !== 'not all';
  ```

- Verify media query is correct:
  ```tsx
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  ```

- Test on different operating systems and browsers

#### 6. Styling Issues

**Problem**: Theme toggle doesn't match design system

**Solutions**:
- Verify Tailwind CSS is properly configured:
  ```javascript
  // tailwind.config.js
  module.exports = {
    darkMode: 'class', // Important for theme switching
    // ... rest of config
  };
  ```

- Check design token imports:
  ```tsx
  import { designTokens } from '@/styles/design-tokens';
  ```

- Use className debugging:
  ```tsx
  <ThemeToggle 
    className="debug-border border-2 border-red-500" 
  />
  ```

### Debug Tools

#### 1. Theme State Inspector

```tsx
function ThemeDebugger() {
  const { theme, resolvedTheme, systemTheme, mounted } = useTheme();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Theme Debug</h3>
      <ul className="text-sm space-y-1">
        <li>Theme: {theme}</li>
        <li>Resolved: {resolvedTheme}</li>
        <li>System: {systemTheme}</li>
        <li>Mounted: {mounted.toString()}</li>
        <li>Storage: {localStorage.getItem('df-admin-theme')}</li>
      </ul>
    </div>
  );
}
```

#### 2. Accessibility Testing

```tsx
// Test accessibility with jest-axe
import { axe } from 'jest-axe';

test('ThemeToggle is accessible', async () => {
  const { container } = render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 3. Visual Regression Testing

```tsx
// Storybook story for visual testing
export const AllVariants = () => (
  <div className="grid grid-cols-3 gap-4 p-4">
    <ThemeToggle size="sm" />
    <ThemeToggle size="md" />
    <ThemeToggle size="lg" />
  </div>
);
```

### Getting Help

If you encounter issues not covered here:

1. **Check the GitHub Issues**: Search for existing issues and solutions
2. **Review the Technical Specification**: Reference Section 7.7 for design system details
3. **Test in Isolation**: Create a minimal reproduction case
4. **Use Developer Tools**: Inspect the DOM and check console for errors
5. **Submit a Bug Report**: Include environment details and reproduction steps

## Contributing

### Development Setup

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd df-admin-interface
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Run Tests**:
   ```bash
   npm run test
   npm run test:coverage
   ```

4. **Run Storybook**:
   ```bash
   npm run storybook
   ```

### Testing Requirements

All changes to the ThemeToggle component must include:

1. **Unit Tests**: Component behavior and props
2. **Accessibility Tests**: WCAG compliance verification
3. **Integration Tests**: Theme context interaction
4. **Visual Tests**: Storybook stories for all variants

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow project linting rules
- **Prettier**: Consistent code formatting
- **Performance**: No unnecessary re-renders
- **Accessibility**: WCAG 2.1 AA compliance required

### Submitting Changes

1. Create a feature branch
2. Add comprehensive tests
3. Update documentation
4. Run the full test suite
5. Submit a pull request with detailed description

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Compatibility**: React 19.0+, Next.js 15.1+, TypeScript 5.8+