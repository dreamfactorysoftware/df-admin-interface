# LookupKeys Component

A comprehensive React component for managing lookup keys within DreamFactory Admin Interface. This component provides an intuitive interface for creating, editing, and organizing lookup key-value pairs with full React Hook Form integration and WCAG 2.1 AA accessibility compliance.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [React Hook Form Integration](#react-hook-form-integration)
- [Component Variants](#component-variants)
- [Accessibility Features](#accessibility-features)
- [Migration Guide](#migration-guide)
- [Theming and Customization](#theming-and-customization)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The LookupKeys component is designed to handle dynamic key-value pair management within forms and configuration interfaces. It supports both table and accordion layout variants, provides comprehensive validation, and integrates seamlessly with React Hook Form's `useFieldArray` hook for optimal performance and developer experience.

### Key Features

- **React Hook Form Integration**: Full compatibility with `useFieldArray` for form management
- **TypeScript Support**: Complete type safety with comprehensive interface definitions
- **Accessibility Compliance**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Responsive Design**: Adaptive layouts for desktop, tablet, and mobile viewports
- **Validation**: Built-in validation with Zod schema integration
- **Performance Optimized**: Virtualization support for large datasets (1000+ items)
- **Theming**: Full Tailwind CSS customization support

## Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

```typescript
import { LookupKeys } from '@/components/ui/lookup-keys'
import type { LookupKeyItem } from '@/components/ui/lookup-keys/types'
```

## API Reference

### LookupKeysProps Interface

```typescript
interface LookupKeysProps {
  /** Form control integration */
  name: string
  control: Control<any>
  
  /** Component configuration */
  variant?: 'table' | 'accordion'
  maxItems?: number
  minItems?: number
  
  /** Layout and appearance */
  className?: string
  disabled?: boolean
  required?: boolean
  
  /** Labels and text */
  label?: string
  description?: string
  addButtonText?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  
  /** Validation */
  keyValidation?: (key: string) => string | undefined
  valueValidation?: (value: string) => string | undefined
  duplicateKeyMessage?: string
  
  /** Accessibility */
  'aria-label'?: string
  'aria-describedby'?: string
  
  /** Event handlers */
  onAdd?: (item: LookupKeyItem) => void
  onRemove?: (index: number) => void
  onChange?: (items: LookupKeyItem[]) => void
  
  /** Advanced features */
  allowDuplicateKeys?: boolean
  sortable?: boolean
  searchable?: boolean
  exportable?: boolean
  
  /** Performance */
  virtualized?: boolean
  virtualizedHeight?: number
}

interface LookupKeyItem {
  id?: string
  key: string
  value: string
  description?: string
  enabled?: boolean
  readonly?: boolean
}

interface LookupKeysFormData {
  lookupKeys: LookupKeyItem[]
}
```

### Hook Integration Types

```typescript
interface UseLookupKeysReturn {
  fields: FieldArrayWithId<LookupKeysFormData, 'lookupKeys', 'id'>[]
  append: (value: LookupKeyItem | LookupKeyItem[]) => void
  prepend: (value: LookupKeyItem | LookupKeyItem[]) => void
  insert: (index: number, value: LookupKeyItem | LookupKeyItem[]) => void
  swap: (indexA: number, indexB: number) => void
  move: (from: number, to: number) => void
  update: (index: number, value: LookupKeyItem) => void
  replace: (value: LookupKeyItem[]) => void
  remove: (index?: number | number[]) => void
}

interface LookupKeysValidationSchema {
  lookupKeys: z.array(z.object({
    key: z.string().min(1, 'Key is required').max(255, 'Key too long'),
    value: z.string().min(1, 'Value is required').max(1000, 'Value too long'),
    description: z.string().optional(),
    enabled: z.boolean().default(true),
    readonly: z.boolean().default(false)
  }))
}
```

## Usage Examples

### Basic Usage

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LookupKeys } from '@/components/ui/lookup-keys'

const schema = z.object({
  lookupKeys: z.array(z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
    description: z.string().optional(),
    enabled: z.boolean().default(true)
  }))
})

type FormData = z.infer<typeof schema>

export function BasicLookupKeysExample() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lookupKeys: [
        { key: 'api_version', value: '2.0', enabled: true },
        { key: 'timeout', value: '30000', enabled: true }
      ]
    }
  })

  const onSubmit = (data: FormData) => {
    console.log('Lookup Keys:', data.lookupKeys)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <LookupKeys
        name="lookupKeys"
        control={control}
        label="Configuration Settings"
        description="Manage system configuration key-value pairs"
        keyPlaceholder="Enter configuration key"
        valuePlaceholder="Enter configuration value"
        aria-label="Configuration lookup keys management"
      />
      
      <button
        type="submit"
        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Save Configuration
      </button>
    </form>
  )
}
```

### Advanced Usage with Custom Validation

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { LookupKeys } from '@/components/ui/lookup-keys'

export function AdvancedLookupKeysExample() {
  const [existingKeys] = useState(['reserved_key', 'system_key'])
  
  const { control, watch } = useForm({
    defaultValues: {
      lookupKeys: []
    }
  })

  const customKeyValidation = (key: string): string | undefined => {
    if (existingKeys.includes(key.toLowerCase())) {
      return 'This key is reserved and cannot be used'
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      return 'Key must start with a letter and contain only letters, numbers, and underscores'
    }
    return undefined
  }

  const customValueValidation = (value: string): string | undefined => {
    if (value.length > 500) {
      return 'Value cannot exceed 500 characters'
    }
    return undefined
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <LookupKeys
        name="lookupKeys"
        control={control}
        variant="accordion"
        maxItems={50}
        minItems={1}
        keyValidation={customKeyValidation}
        valueValidation={customValueValidation}
        duplicateKeyMessage="Duplicate keys are not allowed in this configuration"
        sortable
        searchable
        exportable
        label="API Endpoint Configuration"
        description="Define custom headers and parameters for API endpoints"
        addButtonText="Add New Parameter"
        keyPlaceholder="parameter_name"
        valuePlaceholder="parameter_value"
        className="custom-lookup-keys"
        onAdd={(item) => console.log('Added:', item)}
        onRemove={(index) => console.log('Removed index:', index)}
      />
    </div>
  )
}
```

## React Hook Form Integration

### useFieldArray Integration

The LookupKeys component is built specifically for `useFieldArray` integration:

```typescript
import { useFieldArray, useForm } from 'react-hook-form'
import { LookupKeys } from '@/components/ui/lookup-keys'

export function FieldArrayIntegrationExample() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      lookupKeys: []
    }
  })

  const {
    fields,
    append,
    remove,
    move,
    update
  } = useFieldArray({
    control,
    name: 'lookupKeys'
  })

  // Custom handlers for external operations
  const handleAddPredefined = () => {
    append([
      { key: 'content_type', value: 'application/json' },
      { key: 'cache_timeout', value: '3600' }
    ])
  }

  const handleSort = () => {
    const sortedItems = [...fields].sort((a, b) => a.key.localeCompare(b.key))
    sortedItems.forEach((item, index) => {
      if (fields[index]?.id !== item.id) {
        move(fields.findIndex(f => f.id === item.id), index)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAddPredefined}
          className="px-3 py-2 text-sm bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200"
        >
          Add Predefined
        </button>
        <button
          type="button"
          onClick={handleSort}
          className="px-3 py-2 text-sm bg-secondary-100 text-secondary-700 rounded-md hover:bg-secondary-200"
        >
          Sort Alphabetically
        </button>
      </div>

      <LookupKeys
        name="lookupKeys"
        control={control}
        variant="table"
        sortable
      />
    </div>
  )
}
```

### Nested Form Integration

```typescript
interface ServiceConfiguration {
  serviceName: string
  serviceType: string
  connectionSettings: {
    lookupKeys: LookupKeyItem[]
  }
  advancedSettings: {
    lookupKeys: LookupKeyItem[]
  }
}

export function NestedFormExample() {
  const { control, handleSubmit } = useForm<ServiceConfiguration>({
    defaultValues: {
      serviceName: '',
      serviceType: 'database',
      connectionSettings: {
        lookupKeys: []
      },
      advancedSettings: {
        lookupKeys: []
      }
    }
  })

  return (
    <form onSubmit={handleSubmit(console.log)} className="space-y-8">
      <fieldset className="border border-gray-300 rounded-lg p-4">
        <legend className="text-lg font-medium px-2">Connection Settings</legend>
        <LookupKeys
          name="connectionSettings.lookupKeys"
          control={control}
          label="Connection Parameters"
          keyPlaceholder="host, port, database"
          valuePlaceholder="Enter connection value"
        />
      </fieldset>

      <fieldset className="border border-gray-300 rounded-lg p-4">
        <legend className="text-lg font-medium px-2">Advanced Settings</legend>
        <LookupKeys
          name="advancedSettings.lookupKeys"
          control={control}
          label="Advanced Configuration"
          variant="accordion"
          keyPlaceholder="ssl_mode, timeout"
          valuePlaceholder="Enter advanced setting value"
        />
      </fieldset>

      <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-lg">
        Save Service Configuration
      </button>
    </form>
  )
}
```

## Component Variants

### Table Variant (Default)

The table variant provides a spreadsheet-like interface ideal for large datasets:

```typescript
<LookupKeys
  name="lookupKeys"
  control={control}
  variant="table"
  virtualized={true}
  virtualizedHeight={400}
  searchable
  sortable
  exportable
  label="Database Connection Parameters"
  description="Configure database connection settings in table format"
/>
```

**Features:**
- Sortable columns
- Inline editing
- Bulk selection
- Export functionality
- Virtualization for performance
- Column resizing
- Search and filter

### Accordion Variant

The accordion variant is perfect for smaller datasets with more detailed editing:

```typescript
<LookupKeys
  name="lookupKeys"
  control={control}
  variant="accordion"
  maxItems={20}
  allowDuplicateKeys={false}
  label="API Endpoint Headers"
  description="Configure HTTP headers for API requests"
  addButtonText="Add New Header"
/>
```

**Features:**
- Expandable sections
- Rich text editing for values
- Detailed validation messages
- Drag-and-drop reordering
- Compact view option

## Accessibility Features

The LookupKeys component is fully WCAG 2.1 AA compliant with comprehensive accessibility features:

### Keyboard Navigation

| Key Combination | Action |
|---|---|
| `Tab` / `Shift+Tab` | Navigate between interactive elements |
| `Enter` / `Space` | Activate buttons and controls |
| `Escape` | Cancel editing mode or close dialogs |
| `Arrow Keys` | Navigate within table cells |
| `F2` | Enter edit mode for table cells |
| `Delete` | Remove selected items (with confirmation) |
| `Ctrl+A` | Select all items in table variant |

### Screen Reader Support

```typescript
<LookupKeys
  name="lookupKeys"
  control={control}
  aria-label="Configuration lookup keys"
  aria-describedby="lookup-keys-description"
  label="System Configuration"
  description="Manage key-value pairs for system configuration. Use Tab to navigate between fields, Enter to edit, and Delete to remove items."
/>

<div id="lookup-keys-description" className="sr-only">
  This component allows you to manage key-value pairs. Each row contains a key field, value field, and optional actions. Use keyboard navigation to move between fields.
</div>
```

### Live Regions for Dynamic Updates

```typescript
// Automatic announcements for screen readers
const announcements = {
  itemAdded: "New lookup key added",
  itemRemoved: "Lookup key removed",
  validationError: "Validation error: {message}",
  sortChanged: "Items sorted by {column}",
  searchResult: "{count} items found matching search"
}
```

### Focus Management

```typescript
// Focus management utilities
const useFocusManagement = () => {
  const focusFirstError = useCallback(() => {
    const firstError = document.querySelector('[data-error="true"]')
    if (firstError instanceof HTMLElement) {
      firstError.focus()
    }
  }, [])

  const focusNewItem = useCallback((index: number) => {
    const newItemKey = document.querySelector(`[data-key-index="${index}"]`)
    if (newItemKey instanceof HTMLElement) {
      newItemKey.focus()
    }
  }, [])

  return { focusFirstError, focusNewItem }
}
```

## Migration Guide

### From Angular df-lookup-keys to React LookupKeys

This section provides comprehensive guidance for migrating from the Angular `df-lookup-keys` component to the new React implementation.

#### Architecture Changes

| Angular Implementation | React Implementation | Migration Notes |
|---|---|---|
| `@Input()` properties | TypeScript props interface | Replace decorators with props |
| `@Output()` events | Event handler props | Use callback props instead of EventEmitter |
| `FormArray` with Angular Forms | `useFieldArray` with React Hook Form | Different validation approach |
| Angular Material components | Headless UI + Tailwind CSS | Maintain visual consistency |
| RxJS observables | React Query + SWR | Replace reactive patterns |
| Angular services | Custom React hooks | Convert service patterns |

#### Code Migration Examples

**Angular Template (Before):**
```html
<df-lookup-keys
  [formArray]="lookupKeysArray"
  [required]="true"
  [disabled]="false"
  label="Configuration Keys"
  addButtonText="Add Key"
  (itemAdded)="onItemAdded($event)"
  (itemRemoved)="onItemRemoved($event)"
  (validation)="onValidation($event)">
</df-lookup-keys>
```

**React Implementation (After):**
```typescript
<LookupKeys
  name="lookupKeys"
  control={control}
  required={true}
  disabled={false}
  label="Configuration Keys"
  addButtonText="Add Key"
  onAdd={handleItemAdded}
  onRemove={handleItemRemoved}
  onChange={handleValidation}
/>
```

**Angular Component Logic (Before):**
```typescript
export class ConfigurationComponent {
  @Input() lookupKeysArray: FormArray
  
  constructor(private fb: FormBuilder) {
    this.lookupKeysArray = this.fb.array([])
  }
  
  addLookupKey(): void {
    const group = this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    })
    this.lookupKeysArray.push(group)
  }
  
  removeLookupKey(index: number): void {
    this.lookupKeysArray.removeAt(index)
  }
}
```

**React Component Logic (After):**
```typescript
export function ConfigurationComponent() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      lookupKeys: []
    }
  })
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lookupKeys'
  })
  
  const handleAddKey = useCallback(() => {
    append({ key: '', value: '' })
  }, [append])
  
  const handleRemoveKey = useCallback((index: number) => {
    remove(index)
  }, [remove])
  
  return (
    <LookupKeys
      name="lookupKeys"
      control={control}
      onAdd={handleAddKey}
      onRemove={handleRemoveKey}
    />
  )
}
```

#### Validation Migration

**Angular Validators (Before):**
```typescript
const validationRules = {
  key: [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)],
  value: [Validators.required, Validators.maxLength(500)]
}
```

**Zod Schema (After):**
```typescript
const lookupKeysSchema = z.object({
  lookupKeys: z.array(z.object({
    key: z.string()
      .min(1, 'Key is required')
      .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid key format'),
    value: z.string()
      .min(1, 'Value is required')
      .max(500, 'Value too long')
  }))
})
```

#### State Management Migration

**Angular Service (Before):**
```typescript
@Injectable()
export class LookupKeysService {
  private lookupKeysSubject = new BehaviorSubject<LookupKeyItem[]>([])
  public lookupKeys$ = this.lookupKeysSubject.asObservable()
  
  updateLookupKeys(keys: LookupKeyItem[]): void {
    this.lookupKeysSubject.next(keys)
  }
}
```

**Zustand Store (After):**
```typescript
interface LookupKeysStore {
  lookupKeys: LookupKeyItem[]
  updateLookupKeys: (keys: LookupKeyItem[]) => void
  addLookupKey: (key: LookupKeyItem) => void
  removeLookupKey: (index: number) => void
}

export const useLookupKeysStore = create<LookupKeysStore>((set) => ({
  lookupKeys: [],
  updateLookupKeys: (keys) => set({ lookupKeys: keys }),
  addLookupKey: (key) => set((state) => ({ 
    lookupKeys: [...state.lookupKeys, key] 
  })),
  removeLookupKey: (index) => set((state) => ({
    lookupKeys: state.lookupKeys.filter((_, i) => i !== index)
  }))
}))
```

## Theming and Customization

### Tailwind CSS Customization

The LookupKeys component supports comprehensive theming through Tailwind CSS classes:

```typescript
// Custom theme configuration
const customTheme = {
  container: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
  header: 'bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600',
  table: {
    wrapper: 'overflow-x-auto',
    table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
    thead: 'bg-gray-50 dark:bg-gray-700',
    tbody: 'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700',
    th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider',
    td: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'
  },
  form: {
    input: 'mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white',
    button: 'inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    error: 'mt-1 text-sm text-red-600 dark:text-red-400'
  }
}

<LookupKeys
  name="lookupKeys"
  control={control}
  className={customTheme.container}
  // Component will apply theme classes automatically
/>
```

### CSS Custom Properties

```css
/* Custom CSS properties for advanced theming */
.lookup-keys {
  --lookup-keys-bg: theme(colors.white);
  --lookup-keys-border: theme(colors.gray.200);
  --lookup-keys-text: theme(colors.gray.900);
  --lookup-keys-primary: theme(colors.primary.600);
  --lookup-keys-error: theme(colors.red.600);
  --lookup-keys-success: theme(colors.green.600);
}

.lookup-keys.dark {
  --lookup-keys-bg: theme(colors.gray.800);
  --lookup-keys-border: theme(colors.gray.700);
  --lookup-keys-text: theme(colors.gray.100);
  --lookup-keys-primary: theme(colors.primary.500);
  --lookup-keys-error: theme(colors.red.500);
  --lookup-keys-success: theme(colors.green.500);
}
```

### Component Slot Customization

```typescript
interface LookupKeysSlots {
  header?: React.ComponentType<{ title: string; description?: string }>
  addButton?: React.ComponentType<{ onClick: () => void; disabled?: boolean }>
  keyInput?: React.ComponentType<InputProps>
  valueInput?: React.ComponentType<InputProps>
  actions?: React.ComponentType<{ onEdit: () => void; onDelete: () => void }>
  emptyState?: React.ComponentType<{ onAdd: () => void }>
}

<LookupKeys
  name="lookupKeys"
  control={control}
  slots={{
    header: CustomHeader,
    addButton: CustomAddButton,
    emptyState: CustomEmptyState
  }}
/>
```

## Testing

### Unit Testing with Vitest

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { LookupKeys } from '../LookupKeys'

const TestWrapper = ({ onSubmit = vi.fn() }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { lookupKeys: [] }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <LookupKeys name="lookupKeys" control={control} />
      <button type="submit">Submit</button>
    </form>
  )
}

describe('LookupKeys Component', () => {
  it('renders with empty state', () => {
    render(<TestWrapper />)
    
    expect(screen.getByText(/no lookup keys configured/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add key/i })).toBeInTheDocument()
  })

  it('adds new lookup key pair', async () => {
    const user = userEvent.setup()
    render(<TestWrapper />)
    
    const addButton = screen.getByRole('button', { name: /add key/i })
    await user.click(addButton)
    
    expect(screen.getByPlaceholderText(/enter key/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter value/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<TestWrapper onSubmit={onSubmit} />)
    
    // Add a row but leave fields empty
    await user.click(screen.getByRole('button', { name: /add key/i }))
    await user.click(screen.getByRole('button', { name: /submit/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/key is required/i)).toBeInTheDocument()
      expect(screen.getByText(/value is required/i)).toBeInTheDocument()
    })
    
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('handles duplicate key validation', async () => {
    const user = userEvent.setup()
    render(<TestWrapper />)
    
    // Add first key
    await user.click(screen.getByRole('button', { name: /add key/i }))
    await user.type(screen.getAllByPlaceholderText(/enter key/i)[0], 'test_key')
    await user.type(screen.getAllByPlaceholderText(/enter value/i)[0], 'test_value')
    
    // Add second key with same name
    await user.click(screen.getByRole('button', { name: /add key/i }))
    await user.type(screen.getAllByPlaceholderText(/enter key/i)[1], 'test_key')
    
    await waitFor(() => {
      expect(screen.getByText(/duplicate key/i)).toBeInTheDocument()
    })
  })

  it('removes lookup key', async () => {
    const user = userEvent.setup()
    render(<TestWrapper />)
    
    // Add a key
    await user.click(screen.getByRole('button', { name: /add key/i }))
    await user.type(screen.getByPlaceholderText(/enter key/i), 'test_key')
    
    // Remove the key
    const removeButton = screen.getByRole('button', { name: /remove/i })
    await user.click(removeButton)
    
    expect(screen.queryByDisplayValue('test_key')).not.toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<TestWrapper />)
    
    await user.click(screen.getByRole('button', { name: /add key/i }))
    
    const keyInput = screen.getByPlaceholderText(/enter key/i)
    const valueInput = screen.getByPlaceholderText(/enter value/i)
    
    // Tab navigation
    keyInput.focus()
    expect(keyInput).toHaveFocus()
    
    await user.tab()
    expect(valueInput).toHaveFocus()
  })
})
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockServiceWorker } from '@/test/mocks/msw'
import { LookupKeysForm } from '../LookupKeysForm'

describe('LookupKeys Integration', () => {
  it('saves lookup keys to backend', async () => {
    const user = userEvent.setup()
    
    MockServiceWorker.use(
      rest.post('/api/v2/system/config', (req, res, ctx) => {
        return res(ctx.status(200), ctx.json({ success: true }))
      })
    )
    
    render(<LookupKeysForm />)
    
    // Add and configure lookup key
    await user.click(screen.getByRole('button', { name: /add key/i }))
    await user.type(screen.getByPlaceholderText(/enter key/i), 'api_timeout')
    await user.type(screen.getByPlaceholderText(/enter value/i), '30000')
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    expect(await screen.findByText(/saved successfully/i)).toBeInTheDocument()
  })
})
```

### Accessibility Testing

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { LookupKeys } from '../LookupKeys'

expect.extend(toHaveNoViolations)

describe('LookupKeys Accessibility', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const { container } = render(
      <LookupKeys name="lookupKeys" control={mockControl} />
    )
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('provides proper ARIA labels', () => {
    render(
      <LookupKeys
        name="lookupKeys"
        control={mockControl}
        aria-label="Configuration lookup keys"
      />
    )
    
    expect(screen.getByLabelText(/configuration lookup keys/i)).toBeInTheDocument()
  })
})
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Form Validation Not Working

**Problem**: Validation messages not appearing or form submitting with invalid data.

**Solution**:
```typescript
// Ensure proper resolver setup
const { control, formState: { errors } } = useForm({
  resolver: zodResolver(schema), // Required for validation
  mode: 'onChange' // For real-time validation
})

// Check field registration
<LookupKeys
  name="lookupKeys" // Must match schema property
  control={control}
/>
```

#### 2. Performance Issues with Large Datasets

**Problem**: Component becomes slow with many lookup keys.

**Solution**:
```typescript
// Enable virtualization for large datasets
<LookupKeys
  name="lookupKeys"
  control={control}
  variant="table"
  virtualized={true}
  virtualizedHeight={400}
  // Consider pagination for >1000 items
/>
```

#### 3. TypeScript Type Errors

**Problem**: TypeScript compilation errors with form integration.

**Solution**:
```typescript
// Properly type your form data
interface FormData {
  lookupKeys: LookupKeyItem[]
}

// Use typed control
const { control } = useForm<FormData>()

// Ensure correct name property type
<LookupKeys
  name="lookupKeys" // keyof FormData
  control={control}
/>
```

#### 4. Accessibility Issues

**Problem**: Screen reader not announcing changes or keyboard navigation not working.

**Solution**:
```typescript
// Provide proper ARIA attributes
<LookupKeys
  name="lookupKeys"
  control={control}
  aria-label="Lookup keys management"
  aria-describedby="lookup-keys-help"
/>

<div id="lookup-keys-help" className="sr-only">
  Use Tab to navigate, Enter to edit, Delete to remove items
</div>
```

#### 5. Styling Issues

**Problem**: Component not matching design system or responsive issues.

**Solution**:
```typescript
// Ensure Tailwind CSS is properly configured
// tailwind.config.ts
module.exports = {
  content: [
    './src/components/ui/lookup-keys/**/*.{js,ts,jsx,tsx}',
  ],
  // ... rest of config
}

// Use design system classes
<LookupKeys
  name="lookupKeys"
  control={control}
  className="your-custom-styles"
/>
```

### Debug Mode

Enable debug mode for development troubleshooting:

```typescript
<LookupKeys
  name="lookupKeys"
  control={control}
  debug={process.env.NODE_ENV === 'development'}
  onDebug={(data) => console.log('LookupKeys Debug:', data)}
/>
```

## Best Practices

### 1. Form Integration

```typescript
// ✅ Good: Use proper form setup
const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { lookupKeys: [] }
})

// ❌ Avoid: Missing validation setup
const { control } = useForm()
```

### 2. Performance Optimization

```typescript
// ✅ Good: Memoize handlers
const handleAdd = useCallback((item: LookupKeyItem) => {
  console.log('Added:', item)
}, [])

// ✅ Good: Use virtualization for large datasets
<LookupKeys
  name="lookupKeys"
  control={control}
  virtualized={fields.length > 100}
  onAdd={handleAdd}
/>
```

### 3. Accessibility

```typescript
// ✅ Good: Comprehensive accessibility
<LookupKeys
  name="lookupKeys"
  control={control}
  aria-label="Configuration parameters"
  aria-describedby="lookup-keys-description"
  label="System Configuration"
  description="Manage system configuration key-value pairs"
/>
```

### 4. Error Handling

```typescript
// ✅ Good: Custom validation with helpful messages
const keyValidation = (key: string) => {
  if (!key) return 'Key is required'
  if (key.length > 50) return 'Key must be 50 characters or less'
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
    return 'Key must start with a letter and contain only letters, numbers, and underscores'
  }
  return undefined
}
```

### 5. Testing

```typescript
// ✅ Good: Comprehensive test coverage
describe('LookupKeys', () => {
  it('renders correctly')
  it('handles user interactions')
  it('validates input properly')
  it('meets accessibility standards')
  it('integrates with form properly')
})
```

---

For additional support and examples, refer to the [DreamFactory Admin Interface documentation](../../../docs/) or check the [component source code](./LookupKeys.tsx).