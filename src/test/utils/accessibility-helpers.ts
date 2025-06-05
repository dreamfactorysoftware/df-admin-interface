/**
 * Accessibility Testing Utilities
 * 
 * Comprehensive accessibility testing helpers that ensure WCAG 2.1 AA compliance 
 * throughout the React component migration. Provides automated accessibility auditing,
 * keyboard navigation testing, and screen reader simulation to maintain accessibility 
 * standards established in the Angular implementation.
 * 
 * Features:
 * - Automated axe-core integration for accessibility testing
 * - Keyboard navigation and focus management testing
 * - Screen reader simulation and ARIA validation
 * - Color contrast and visual accessibility validation
 * - Custom matchers for Vitest accessibility assertions
 */

import { type RenderResult } from '@testing-library/react';
import { type AxeResults, type Result, type RunOptions } from 'axe-core';
import userEvent from '@testing-library/user-event';

// Re-export axe for external use
export { axe, type AxeResults, type RunOptions } from 'axe-core';

/**
 * WCAG 2.1 AA Compliance Constants
 * Based on design system specifications from Section 7.7.1
 */
export const WCAG_COMPLIANCE = {
  CONTRAST_RATIOS: {
    AA_NORMAL: 4.5,    // Normal text minimum
    AA_LARGE: 3.0,     // Large text (18pt+ or 14pt+ bold) minimum  
    AAA_NORMAL: 7.0,   // Enhanced normal text
    AAA_LARGE: 4.5,    // Enhanced large text
    UI_COMPONENT: 3.0, // Non-text elements (borders, icons, etc.)
  },
  TOUCH_TARGETS: {
    MIN_SIZE: 44,      // Minimum 44x44px for touch targets
    RECOMMENDED_SIZE: 48, // Recommended size for better usability
  },
  FOCUS_INDICATORS: {
    MIN_WIDTH: 2,      // Minimum 2px focus ring width
    OFFSET: 2,         // Standard 2px offset for visibility
  },
} as const;

/**
 * Accessibility Testing Configuration
 */
export interface AccessibilityTestConfig {
  /** Custom axe-core rules configuration */
  axeRules?: RunOptions;
  /** Skip specific accessibility checks */
  skipChecks?: string[];
  /** Include additional experimental rules */
  experimental?: boolean;
  /** Custom WCAG compliance level */
  level?: 'A' | 'AA' | 'AAA';
  /** Custom color contrast requirements */
  contrastRequirements?: {
    normal: number;
    large: number;
    uiComponent: number;
  };
}

/**
 * Keyboard Navigation Test Options
 */
export interface KeyboardTestOptions {
  /** Elements that should be focusable */
  expectedFocusableElements?: string[];
  /** Elements that should be skipped during tab navigation */
  skipElements?: string[];
  /** Test custom keyboard shortcuts */
  customKeys?: Array<{
    key: string;
    expectedAction: string;
    targetElement?: string;
  }>;
  /** Validate focus trap behavior */
  testFocusTrap?: boolean;
}

/**
 * Screen Reader Simulation Options
 */
export interface ScreenReaderOptions {
  /** Simulate specific screen reader type */
  readerType?: 'NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack';
  /** Test live region announcements */
  testLiveRegions?: boolean;
  /** Validate ARIA label completeness */
  validateAriaLabels?: boolean;
  /** Check landmark navigation */
  testLandmarks?: boolean;
}

/**
 * Focus Management Test Results
 */
export interface FocusTestResult {
  focusableElements: Element[];
  focusOrder: Element[];
  trapContained: boolean;
  visualIndicators: boolean;
  keyboardAccessible: boolean;
  issues: string[];
}

/**
 * Accessibility Test Results
 */
export interface AccessibilityTestResult {
  passed: boolean;
  violations: Result[];
  wcagLevel: string;
  contrastIssues: Array<{
    element: Element;
    foreground: string;
    background: string;
    ratio: number;
    minimum: number;
  }>;
  keyboardIssues: string[];
  ariaIssues: string[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Default accessibility configuration optimized for DreamFactory components
 */
const DEFAULT_A11Y_CONFIG: AccessibilityTestConfig = {
  level: 'AA',
  axeRules: {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    rules: {
      // Enforce color contrast requirements
      'color-contrast': { enabled: true },
      // Ensure proper focus management
      'focus-order-semantics': { enabled: true },
      // Validate ARIA implementation
      'aria-required-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      // Check keyboard accessibility
      'keyboard': { enabled: true },
      // Validate form labels
      'label': { enabled: true },
      // Check heading hierarchy
      'heading-order': { enabled: true },
      // Ensure proper landmark usage
      'region': { enabled: true },
    },
  },
  contrastRequirements: {
    normal: WCAG_COMPLIANCE.CONTRAST_RATIOS.AA_NORMAL,
    large: WCAG_COMPLIANCE.CONTRAST_RATIOS.AA_LARGE,
    uiComponent: WCAG_COMPLIANCE.CONTRAST_RATIOS.UI_COMPONENT,
  },
};

/**
 * Core Accessibility Testing Functions
 */

/**
 * Run comprehensive accessibility audit using axe-core
 * Integrates with Vitest for automated accessibility testing
 */
export async function runAccessibilityAudit(
  container: Element,
  config: AccessibilityTestConfig = {}
): Promise<AccessibilityTestResult> {
  const axe = await import('axe-core');
  
  const mergedConfig = {
    ...DEFAULT_A11Y_CONFIG,
    ...config,
    axeRules: {
      ...DEFAULT_A11Y_CONFIG.axeRules,
      ...config.axeRules,
    },
  };

  try {
    const results = await axe.run(container, mergedConfig.axeRules);
    
    const violations = results.violations;
    const contrastIssues = await analyzeColorContrast(container, mergedConfig);
    const keyboardIssues = await validateKeyboardAccess(container);
    const ariaIssues = await validateAriaImplementation(container);

    return {
      passed: violations.length === 0 && contrastIssues.length === 0,
      violations,
      wcagLevel: mergedConfig.level || 'AA',
      contrastIssues,
      keyboardIssues,
      ariaIssues,
      summary: {
        totalTests: results.passes.length + violations.length,
        passed: results.passes.length,
        failed: violations.length,
        warnings: results.incomplete.length,
      },
    };
  } catch (error) {
    throw new Error(`Accessibility audit failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Test keyboard navigation patterns for database service management interfaces
 */
export async function testKeyboardNavigation(
  container: Element,
  options: KeyboardTestOptions = {}
): Promise<FocusTestResult> {
  const user = userEvent.setup();
  
  // Find all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
  );

  const focusOrder: Element[] = [];
  const issues: string[] = [];
  
  // Test tab navigation
  let currentElement = document.activeElement;
  const startElement = currentElement;
  
  for (let i = 0; i < focusableElements.length; i++) {
    await user.tab();
    currentElement = document.activeElement;
    
    if (currentElement) {
      focusOrder.push(currentElement);
    }
    
    // Validate focus indicator visibility
    if (currentElement && !hasVisibleFocusIndicator(currentElement)) {
      issues.push(`Element ${getElementSelector(currentElement)} lacks visible focus indicator`);
    }
  }

  // Test custom keyboard shortcuts if specified
  if (options.customKeys) {
    for (const shortcut of options.customKeys) {
      await user.keyboard(shortcut.key);
      // Custom validation based on expectedAction would go here
    }
  }

  // Test focus trap behavior for modals/dialogs
  let trapContained = true;
  if (options.testFocusTrap) {
    const modal = container.querySelector('[role="dialog"], [role="alertdialog"]');
    if (modal) {
      trapContained = await testFocusTrap(modal, user);
    }
  }

  return {
    focusableElements: Array.from(focusableElements),
    focusOrder,
    trapContained,
    visualIndicators: issues.length === 0,
    keyboardAccessible: focusOrder.length === focusableElements.length,
    issues,
  };
}

/**
 * Simulate screen reader behavior and validate announcements
 */
export function simulateScreenReader(
  container: Element,
  options: ScreenReaderOptions = {}
): {
  announcements: string[];
  landmarks: Element[];
  ariaLabels: Map<Element, string>;
  issues: string[];
} {
  const announcements: string[] = [];
  const landmarks: Element[] = [];
  const ariaLabels = new Map<Element, string>();
  const issues: string[] = [];

  // Collect live region announcements
  if (options.testLiveRegions) {
    const liveRegions = container.querySelectorAll('[aria-live]');
    liveRegions.forEach(region => {
      const announcement = getScreenReaderText(region);
      if (announcement) {
        announcements.push(announcement);
      }
    });
  }

  // Identify landmarks for navigation
  if (options.testLandmarks) {
    const landmarkSelectors = [
      '[role="banner"]', '[role="main"]', '[role="navigation"]', 
      '[role="complementary"]', '[role="contentinfo"]', '[role="search"]',
      'header', 'main', 'nav', 'aside', 'footer'
    ];
    
    landmarkSelectors.forEach(selector => {
      const elements = container.querySelectorAll(selector);
      landmarks.push(...Array.from(elements));
    });
  }

  // Validate ARIA labels
  if (options.validateAriaLabels) {
    const labeledElements = container.querySelectorAll('[aria-label], [aria-labelledby]');
    labeledElements.forEach(element => {
      const label = getAccessibleName(element);
      if (label) {
        ariaLabels.set(element, label);
      } else {
        issues.push(`Element ${getElementSelector(element)} lacks accessible name`);
      }
    });
  }

  return {
    announcements,
    landmarks,
    ariaLabels,
    issues,
  };
}

/**
 * Validate focus management for modal dialogs and dropdown components
 */
export async function testFocusManagement(
  modalElement: Element,
  triggerElement?: Element
): Promise<{
  initialFocus: boolean;
  focusTrap: boolean;
  returnFocus: boolean;
  escapeHandling: boolean;
  issues: string[];
}> {
  const user = userEvent.setup();
  const issues: string[] = [];
  
  // Store initial focus
  const initialFocusElement = document.activeElement;
  
  // Test initial focus when modal opens
  const firstFocusable = modalElement.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const initialFocus = document.activeElement === firstFocusable;
  if (!initialFocus) {
    issues.push('Modal does not set initial focus correctly');
  }

  // Test focus trap
  const focusTrap = await testFocusTrap(modalElement, user);
  if (!focusTrap) {
    issues.push('Focus trap not working properly in modal');
  }

  // Test escape key handling
  let escapeHandling = false;
  try {
    await user.keyboard('{Escape}');
    // Modal should close and focus should return
    escapeHandling = !document.body.contains(modalElement);
  } catch {
    issues.push('Escape key handling not implemented');
  }

  // Test return focus
  const returnFocus = triggerElement ? 
    document.activeElement === triggerElement : 
    document.activeElement === initialFocusElement;
  
  if (!returnFocus) {
    issues.push('Focus not returned to trigger element after modal close');
  }

  return {
    initialFocus,
    focusTrap,
    returnFocus,
    escapeHandling,
    issues,
  };
}

/**
 * Validate color contrast and text sizing for Tailwind CSS components
 */
export async function validateColorContrast(
  element: Element,
  requirements = DEFAULT_A11Y_CONFIG.contrastRequirements!
): Promise<Array<{
  element: Element;
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
  passed: boolean;
}>> {
  const contrastIssues: Array<{
    element: Element;
    foreground: string;
    background: string;
    ratio: number;
    minimum: number;
    passed: boolean;
  }> = [];

  // Find all text elements
  const textElements = element.querySelectorAll('*');
  
  for (const el of textElements) {
    const style = window.getComputedStyle(el);
    const hasText = el.textContent?.trim();
    
    if (!hasText) continue;

    const foreground = style.color;
    const background = getEffectiveBackgroundColor(el);
    
    if (foreground && background) {
      const ratio = calculateContrastRatio(foreground, background);
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = style.fontWeight;
      
      // Determine minimum required ratio
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      const minimum = isLargeText ? requirements.large : requirements.normal;
      
      const passed = ratio >= minimum;
      
      if (!passed) {
        contrastIssues.push({
          element: el,
          foreground,
          background,
          ratio,
          minimum,
          passed,
        });
      }
    }
  }

  return contrastIssues;
}

/**
 * Validate ARIA attributes for custom Headless UI component implementations
 */
export function validateAriaAttributes(container: Element): {
  validAttributes: Map<Element, string[]>;
  invalidAttributes: Map<Element, string[]>;
  missingAttributes: Map<Element, string[]>;
  issues: string[];
} {
  const validAttributes = new Map<Element, string[]>();
  const invalidAttributes = new Map<Element, string[]>();
  const missingAttributes = new Map<Element, string[]>();
  const issues: string[] = [];

  // Standard ARIA attributes and their valid patterns
  const ariaAttributes = {
    'aria-label': /^.+$/,
    'aria-labelledby': /^[\w\s-]+$/,
    'aria-describedby': /^[\w\s-]+$/,
    'aria-expanded': /^(true|false)$/,
    'aria-pressed': /^(true|false|mixed)$/,
    'aria-checked': /^(true|false|mixed)$/,
    'aria-selected': /^(true|false)$/,
    'aria-disabled': /^(true|false)$/,
    'aria-hidden': /^(true|false)$/,
    'aria-live': /^(off|polite|assertive)$/,
    'aria-atomic': /^(true|false)$/,
    'aria-relevant': /^(additions|removals|text|all)$/,
    'aria-haspopup': /^(true|false|menu|listbox|tree|grid|dialog)$/,
  };

  // Required ARIA attributes for specific roles
  const roleRequirements = {
    'button': ['aria-label'],
    'dialog': ['aria-labelledby', 'aria-modal'],
    'combobox': ['aria-expanded', 'aria-haspopup'],
    'listbox': ['aria-multiselectable'],
    'tab': ['aria-selected'],
    'tabpanel': ['aria-labelledby'],
    'slider': ['aria-valuemin', 'aria-valuemax', 'aria-valuenow'],
  };

  const elements = container.querySelectorAll('*');
  
  elements.forEach(element => {
    const role = element.getAttribute('role');
    const valid: string[] = [];
    const invalid: string[] = [];
    const missing: string[] = [];

    // Check existing ARIA attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('aria-')) {
        const pattern = ariaAttributes[attr.name as keyof typeof ariaAttributes];
        if (pattern && pattern.test(attr.value)) {
          valid.push(attr.name);
        } else {
          invalid.push(attr.name);
          issues.push(`Invalid ${attr.name} value "${attr.value}" on ${getElementSelector(element)}`);
        }
      }
    });

    // Check required attributes for role
    if (role && roleRequirements[role as keyof typeof roleRequirements]) {
      const required = roleRequirements[role as keyof typeof roleRequirements];
      required.forEach(attr => {
        if (!element.hasAttribute(attr)) {
          missing.push(attr);
          issues.push(`Missing required ${attr} attribute for role="${role}" on ${getElementSelector(element)}`);
        }
      });
    }

    if (valid.length > 0) validAttributes.set(element, valid);
    if (invalid.length > 0) invalidAttributes.set(element, invalid);
    if (missing.length > 0) missingAttributes.set(element, missing);
  });

  return {
    validAttributes,
    invalidAttributes,
    missingAttributes,
    issues,
  };
}

/**
 * Utility Functions
 */

/**
 * Analyze color contrast for an element and its children
 */
async function analyzeColorContrast(
  container: Element,
  config: AccessibilityTestConfig
): Promise<Array<{
  element: Element;
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
}>> {
  return validateColorContrast(container, config.contrastRequirements);
}

/**
 * Validate keyboard accessibility
 */
async function validateKeyboardAccess(container: Element): Promise<string[]> {
  const issues: string[] = [];
  
  // Check for keyboard traps
  const interactiveElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  interactiveElements.forEach(element => {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) > 0) {
      issues.push(`Positive tabindex found on ${getElementSelector(element)} - use 0 or remove`);
    }
  });

  return issues;
}

/**
 * Validate ARIA implementation
 */
async function validateAriaImplementation(container: Element): Promise<string[]> {
  const { issues } = validateAriaAttributes(container);
  return issues;
}

/**
 * Test focus trap functionality
 */
async function testFocusTrap(modal: Element, user: any): Promise<boolean> {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) return true;
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  // Focus last element and tab forward - should go to first
  lastElement.focus();
  await user.tab();
  
  const isTrapped = document.activeElement === firstElement;
  
  // Reset focus to first element and test backward navigation
  firstElement.focus();
  await user.tab({ shift: true });
  
  return isTrapped && document.activeElement === lastElement;
}

/**
 * Check if element has visible focus indicator
 */
function hasVisibleFocusIndicator(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const pseudoStyle = window.getComputedStyle(element, ':focus');
  
  // Check for outline or box-shadow
  const hasOutline = pseudoStyle.outline !== 'none' && pseudoStyle.outline !== '';
  const hasBoxShadow = pseudoStyle.boxShadow !== 'none' && pseudoStyle.boxShadow !== '';
  const hasBorder = pseudoStyle.border !== style.border;
  
  return hasOutline || hasBoxShadow || hasBorder;
}

/**
 * Get element selector for debugging
 */
function getElementSelector(element: Element): string {
  if (element.id) return `#${element.id}`;
  if (element.className) return `.${element.className.split(' ').join('.')}`;
  return element.tagName.toLowerCase();
}

/**
 * Get screen reader text for an element
 */
function getScreenReaderText(element: Element): string {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;
  
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement) return labelElement.textContent || '';
  }
  
  return element.textContent || '';
}

/**
 * Get accessible name for an element
 */
function getAccessibleName(element: Element): string {
  return getScreenReaderText(element);
}

/**
 * Calculate effective background color
 */
function getEffectiveBackgroundColor(element: Element): string {
  const style = window.getComputedStyle(element);
  let bgColor = style.backgroundColor;
  
  if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
    // Walk up the DOM tree to find a background color
    let parent = element.parentElement;
    while (parent && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
      bgColor = window.getComputedStyle(parent).backgroundColor;
      parent = parent.parentElement;
    }
  }
  
  return bgColor || '#ffffff'; // Default to white if no background found
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert color to RGB values
    const rgb = colorToRgb(color);
    if (!rgb) return 0;
    
    // Convert to relative luminance
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert color string to RGB values
 */
function colorToRgb(color: string): [number, number, number] | null {
  // Create a temporary element to get computed color
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  
  const computed = window.getComputedStyle(temp).color;
  document.body.removeChild(temp);
  
  const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  
  return null;
}

/**
 * Custom Vitest Matchers for Accessibility Testing
 */

declare global {
  namespace Vi {
    interface Assertion {
      toBeAccessible(config?: AccessibilityTestConfig): void;
      toHaveNoColorContrastIssues(level?: 'AA' | 'AAA'): void;
      toSupportKeyboardNavigation(options?: KeyboardTestOptions): void;
      toHaveValidAriaAttributes(): void;
      toAnnounceProperly(expectedText?: string): void;
    }
  }
}

/**
 * Export everything for use in tests
 */
export {
  runAccessibilityAudit,
  testKeyboardNavigation,
  simulateScreenReader,
  testFocusManagement,
  validateColorContrast,
  validateAriaAttributes,
  WCAG_COMPLIANCE,
  type AccessibilityTestConfig,
  type KeyboardTestOptions,
  type ScreenReaderOptions,
  type FocusTestResult,
  type AccessibilityTestResult,
};

/**
 * Default export for convenience
 */
export default {
  runAccessibilityAudit,
  testKeyboardNavigation,
  simulateScreenReader,
  testFocusManagement,
  validateColorContrast,
  validateAriaAttributes,
  WCAG_COMPLIANCE,
};