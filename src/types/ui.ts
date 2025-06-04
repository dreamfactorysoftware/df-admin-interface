/**
 * UI Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for React 19 UI components following
 * Next.js 15.1 patterns and WCAG 2.1 AA accessibility requirements.
 * 
 * @fileoverview UI type definitions for accessible, responsive React components
 * @version 1.0.0
 */

import { type ReactNode, type HTMLAttributes, type ComponentPropsWithoutRef } from 'react';
import { type VariantProps } from 'class-variance-authority';

/**
 * Base accessibility props that extend ARIA attributes
 * Ensures WCAG 2.1 AA compliance across all UI components
 */
export interface AccessibilityProps {
  /** ARIA label for screen readers - required for some components */
  'aria-label'?: string;
  /** ARIA description reference ID */
  'aria-describedby'?: string;
  /** ARIA labelledby reference ID */
  'aria-labelledby'?: string;
  /** ARIA role override */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Screen reader announcement on state change */
  announceOnChange?: string;
}

/**
 * Common size variants used across UI components
 * Follows design system scale with accessibility touch targets
 */
export type SizeVariant = 'sm' | 'md' | 'lg';

/**
 * Color scheme variants matching design system tokens
 * WCAG 2.1 AA compliant with proper contrast ratios
 */
export type ColorVariant = 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'outline' 
  | 'ghost';

/**
 * Component state variants for consistent state management
 */
export type StateVariant = 'default' | 'loading' | 'disabled' | 'error';

/**
 * Base props for form components with validation support
 */
export interface FormComponentProps extends AccessibilityProps {
  /** Component name for form submission */
  name?: string;
  /** Required field indicator */
  required?: boolean;
  /** Validation error message */
  error?: string;
  /** Helper text below component */
  helperText?: string;
  /** Success state indicator */
  success?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state for async operations */
  loading?: boolean;
}

/**
 * Label positioning options for form components
 */
export type LabelPosition = 'left' | 'right' | 'top' | 'bottom' | 'none';

/**
 * Layout and alignment options for component containers
 */
export interface LayoutProps {
  /** Flex layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Content alignment */
  alignment?: 'start' | 'center' | 'end' | 'between';
  /** Spacing between elements */
  spacing?: 'compact' | 'normal' | 'relaxed';
}

/**
 * Theme-aware props for consistent theming
 */
export interface ThemeProps {
  /** Component color variant */
  variant?: ColorVariant;
  /** Component size */
  size?: SizeVariant;
  /** Component state */
  state?: StateVariant;
  /** Custom className override */
  className?: string;
}

/**
 * Responsive behavior configuration
 */
export interface ResponsiveProps {
  /** Hide on mobile devices */
  hiddenMobile?: boolean;
  /** Hide on tablet devices */
  hiddenTablet?: boolean;
  /** Hide on desktop devices */
  hiddenDesktop?: boolean;
  /** Full width on mobile */
  fullWidthMobile?: boolean;
}

/**
 * Animation and transition preferences
 */
export interface AnimationProps {
  /** Disable transitions (for reduced motion) */
  disableTransitions?: boolean;
  /** Animation duration override */
  animationDuration?: 'fast' | 'normal' | 'slow';
  /** Animation easing function */
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Common component props extending HTML attributes
 */
export interface BaseComponentProps<T extends HTMLElement = HTMLElement> 
  extends Omit<HTMLAttributes<T>, 'className' | 'children'> {
  /** React children */
  children?: ReactNode;
  /** Custom CSS classes */
  className?: string;
  /** Component test ID for testing */
  'data-testid'?: string;
}

/**
 * Controlled component props for form elements
 */
export interface ControlledProps<T = boolean> {
  /** Current value */
  value?: T;
  /** Default value for uncontrolled usage */
  defaultValue?: T;
  /** Change event handler */
  onChange?: (value: T) => void;
  /** Controlled state indicator */
  controlled?: boolean;
}

/**
 * Focus management props for keyboard navigation
 */
export interface FocusProps {
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Focus trap within component */
  trapFocus?: boolean;
  /** Restore focus on unmount */
  restoreFocus?: boolean;
  /** Focus handler */
  onFocus?: (event: React.FocusEvent) => void;
  /** Blur handler */
  onBlur?: (event: React.FocusEvent) => void;
}

/**
 * Event handling props for user interactions
 */
export interface InteractionProps {
  /** Click event handler */
  onClick?: (event: React.MouseEvent) => void;
  /** Key down event handler */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** Mouse enter event handler */
  onMouseEnter?: (event: React.MouseEvent) => void;
  /** Mouse leave event handler */
  onMouseLeave?: (event: React.MouseEvent) => void;
}

/**
 * Toggle/Switch specific props
 */
export interface ToggleProps extends 
  BaseComponentProps<HTMLButtonElement>,
  FormComponentProps,
  ControlledProps<boolean>,
  ThemeProps,
  LayoutProps,
  ResponsiveProps,
  AnimationProps,
  FocusProps,
  InteractionProps {
  
  /** Toggle label text */
  label?: string;
  /** Label position relative to toggle */
  labelPosition?: LabelPosition;
  /** Label variant styling */
  labelVariant?: 'default' | 'muted' | 'emphasis';
  /** Show label (false makes it screen reader only) */
  showLabel?: boolean;
  
  /** Icon to show when checked */
  checkedIcon?: ReactNode;
  /** Icon to show when unchecked */
  uncheckedIcon?: ReactNode;
  
  /** Additional thumb styling */
  thumbClassName?: string;
  /** Additional label styling */
  labelClassName?: string;
  /** Additional container styling */
  containerClassName?: string;
  
  /** Form integration - register with React Hook Form */
  register?: any;
  /** Validation rules for React Hook Form */
  rules?: any;
}

/**
 * Button component props interface
 */
export interface ButtonProps extends 
  BaseComponentProps<HTMLButtonElement>,
  ThemeProps,
  ResponsiveProps,
  AnimationProps,
  FocusProps,
  Pick<InteractionProps, 'onClick'> {
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon before text */
  leftIcon?: ReactNode;
  /** Icon after text */
  rightIcon?: ReactNode;
  /** Loading spinner override */
  spinner?: ReactNode;
  /** Click announcement for screen readers */
  announceOnClick?: string;
}

/**
 * Input component props interface
 */
export interface InputProps extends 
  BaseComponentProps<HTMLInputElement>,
  FormComponentProps,
  ControlledProps<string>,
  ThemeProps,
  FocusProps {
  
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Placeholder text */
  placeholder?: string;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Input pattern for validation */
  pattern?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Read-only state */
  readOnly?: boolean;
  
  /** Prefix icon or text */
  prefix?: ReactNode;
  /** Suffix icon or text */
  suffix?: ReactNode;
  /** Clear button */
  clearable?: boolean;
  /** Password visibility toggle */
  showPasswordToggle?: boolean;
}

/**
 * Select component props interface
 */
export interface SelectProps<T = string> extends 
  BaseComponentProps<HTMLSelectElement>,
  FormComponentProps,
  ControlledProps<T>,
  ThemeProps,
  FocusProps {
  
  /** Select options */
  options: Array<{
    value: T;
    label: string;
    disabled?: boolean;
    description?: string;
  }>;
  /** Placeholder option */
  placeholder?: string;
  /** Multiple selection */
  multiple?: boolean;
  /** Searchable/filterable */
  searchable?: boolean;
  /** Clear button */
  clearable?: boolean;
  /** Custom option renderer */
  renderOption?: (option: any) => ReactNode;
  /** Custom value renderer */
  renderValue?: (value: T) => ReactNode;
}

/**
 * Dialog/Modal component props interface
 */
export interface DialogProps extends 
  BaseComponentProps<HTMLDivElement>,
  ThemeProps,
  AnimationProps,
  FocusProps {
  
  /** Dialog open state */
  open: boolean;
  /** Close event handler */
  onClose: () => void;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Dialog title */
  title?: string;
  /** Dialog description */
  description?: string;
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Scrollable content */
  scrollable?: boolean;
}

/**
 * Export utility types for component variants
 */
export type ComponentVariants<T> = T extends (...args: any) => any
  ? VariantProps<T>
  : never;

/**
 * Polymorphic component props for flexible element rendering
 */
export type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
} & ComponentPropsWithoutRef<T>;

/**
 * Utility type for merging props with overrides
 */
export type MergeProps<A, B> = Omit<A, keyof B> & B;

/**
 * Common event handler types
 */
export interface EventHandlers {
  onChange?: (value: any) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onSubmit?: (event: React.FormEvent) => void;
}

/**
 * Validation state interface for form components
 */
export interface ValidationState {
  /** Is field valid */
  isValid: boolean;
  /** Is field dirty (has been modified) */
  isDirty: boolean;
  /** Is field touched (has been focused) */
  isTouched: boolean;
  /** Validation error message */
  error?: string;
  /** Warning message */
  warning?: string;
}

/**
 * Loading state interface for async components
 */
export interface LoadingState {
  /** Is component loading */
  isLoading: boolean;
  /** Loading progress (0-100) */
  progress?: number;
  /** Loading message */
  message?: string;
  /** Error state */
  error?: string;
}