/**
 * Accessibility Testing Utilities
 * 
 * Comprehensive WCAG 2.1 AA compliance testing helpers for React components.
 * Integrates with Vitest framework and provides automated accessibility auditing,
 * keyboard navigation testing, and screen reader simulation.
 * 
 * Key Features:
 * - Axe-core integration for automated WCAG compliance checking
 * - Keyboard navigation testing for database service management interfaces
 * - Screen reader simulation with virtual screen reader
 * - Focus management validation for modal dialogs and dropdowns
 * - Color contrast and text sizing validation for Tailwind CSS components
 * - ARIA attribute validation for custom Headless UI implementations
 */

import { expect } from 'vitest';
import { screen, within, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { virtual } from '@guidepup/virtual-screen-reader';
import userEvent from '@testing-library/user-event';

// Extend Vitest expect with axe matchers
expect.extend(toHaveNoViolations);

/**
 * WCAG 2.1 AA Compliance Levels
 */
export const WCAG_LEVELS = {
  A: 'A',
  AA: 'AA',
  AAA: 'AAA',
} as const;

export type WCAGLevel = typeof WCAG_LEVELS[keyof typeof WCAG_LEVELS];

/**
 * WCAG 2.1 AA contrast ratio requirements
 */
export const CONTRAST_REQUIREMENTS = {
  AA: {
    normal: 4.5, // Normal text (< 18pt regular or < 14pt bold)
    large: 3.0,  // Large text (≥ 18pt regular or ≥ 14pt bold)
    ui: 3.0,     // UI components and graphical objects
  },
  AAA: {
    normal: 7.0,
    large: 4.5,
    ui: 3.0,
  },
} as const;

/**
 * Touch target minimum sizes (WCAG 2.1 AA Level)
 */
export const TOUCH_TARGET_MINIMUM = {
  width: 44,  // pixels
  height: 44, // pixels
} as const;

/**
 * Axe-core accessibility testing utilities
 */
export const axeUtils = {
  /**
   * Run comprehensive accessibility audit with axe-core
   * Configured for WCAG 2.1 AA compliance by default
   */
  runAccessibilityAudit: async (
    container: HTMLElement,
    options: {
      level?: WCAGLevel;
      rules?: Record<string, boolean>;
      tags?: string[];
      includedImpacts?: ('minor' | 'moderate' | 'serious' | 'critical')[];
    } = {}
  ) => {
    const {
      level = 'AA',
      rules = {},
      tags = ['wcag2a', 'wcag2aa', 'wcag21aa'],
      includedImpacts = ['moderate', 'serious', 'critical'],
    } = options;

    // Configure axe for WCAG 2.1 AA compliance
    const axeConfig = {
      tags: level === 'AAA' ? [...tags, 'wcag2aaa'] : tags,
      rules: {
        // Enable all WCAG 2.1 AA rules by default
        'color-contrast': { enabled: false }, // Note: color contrast doesn't work in JSDOM
        'region': { enabled: false }, // May not apply to isolated components
        'page-has-heading-one': { enabled: false }, // Component-level testing
        ...rules,
      },
      resultTypes: ['violations', 'inapplicable', 'passes'],
      reporter: 'v2',
    };

    const results = await axe(container, axeConfig);

    // Filter results by impact level
    const filteredViolations = results.violations.filter(violation =>
      includedImpacts.includes(violation.impact as any)
    );

    return {
      ...results,
      violations: filteredViolations,
      hasViolations: filteredViolations.length > 0,
      summary: {
        total: filteredViolations.length,
        critical: filteredViolations.filter(v => v.impact === 'critical').length,
        serious: filteredViolations.filter(v => v.impact === 'serious').length,
        moderate: filteredViolations.filter(v => v.impact === 'moderate').length,
        minor: filteredViolations.filter(v => v.impact === 'minor').length,
      },
    };
  },

  /**
   * Quick accessibility check with detailed error reporting
   */
  expectNoAccessibilityViolations: async (
    container: HTMLElement,
    options?: Parameters<typeof axeUtils.runAccessibilityAudit>[1]
  ) => {
    const results = await axeUtils.runAccessibilityAudit(container, options);
    
    if (results.hasViolations) {
      const violationDetails = results.violations.map(violation => ({
        rule: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.length,
      }));
      
      console.error('Accessibility violations found:', violationDetails);
    }
    
    expect(results).toHaveNoViolations();
    return results;
  },

  /**
   * Test specific accessibility rule
   */
  testSpecificRule: async (
    container: HTMLElement,
    ruleId: string,
    shouldPass: boolean = true
  ) => {
    const results = await axe(container, {
      rules: { [ruleId]: { enabled: true } },
    });

    const ruleViolations = results.violations.filter(v => v.id === ruleId);
    
    if (shouldPass) {
      expect(ruleViolations).toHaveLength(0);
    } else {
      expect(ruleViolations.length).toBeGreaterThan(0);
    }

    return ruleViolations;
  },
};

/**
 * Keyboard navigation testing utilities
 */
export const keyboardNavigationUtils = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled]):not([aria-hidden="true"])',
      'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"])',
      'select:not([disabled]):not([aria-hidden="true"])',
      'textarea:not([disabled]):not([aria-hidden="true"])',
      'a[href]:not([aria-hidden="true"])',
      '[tabindex]:not([tabindex="-1"]):not([aria-hidden="true"])',
      '[role="button"]:not([disabled]):not([aria-hidden="true"])',
      '[role="link"]:not([aria-hidden="true"])',
      '[role="menuitem"]:not([aria-hidden="true"])',
      '[role="option"]:not([aria-hidden="true"])',
      '[role="tab"]:not([aria-hidden="true"])',
      'details:not([aria-hidden="true"])',
      'summary:not([aria-hidden="true"])',
    ].join(', ');

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    // Filter out elements that are not visible or have display: none
    return elements.filter(element => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        element.offsetParent !== null
      );
    });
  },

  /**
   * Test complete keyboard navigation flow through focusable elements
   */
  testKeyboardNavigation: async (
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>,
    options: {
      startElement?: HTMLElement;
      endElement?: HTMLElement;
      skipElements?: HTMLElement[];
      testShiftTab?: boolean;
    } = {}
  ) => {
    const {
      startElement,
      endElement,
      skipElements = [],
      testShiftTab = true,
    } = options;

    const focusableElements = keyboardNavigationUtils
      .getFocusableElements(container)
      .filter(el => !skipElements.includes(el));

    if (focusableElements.length === 0) {
      return {
        success: true,
        focusedElements: [],
        issues: ['No focusable elements found'],
      };
    }

    const focusHistory: HTMLElement[] = [];
    const issues: string[] = [];

    // Start from specified element or first focusable element
    const firstElement = startElement || focusableElements[0];
    firstElement.focus();

    if (document.activeElement !== firstElement) {
      issues.push(`Could not focus first element: ${firstElement.tagName}`);
    } else {
      focusHistory.push(firstElement);
    }

    // Test Tab navigation forward
    for (let i = 1; i < focusableElements.length; i++) {
      await user.keyboard('{Tab}');
      const activeElement = document.activeElement as HTMLElement;
      
      if (activeElement !== focusableElements[i]) {
        issues.push(
          `Tab navigation failed at index ${i}. Expected: ${focusableElements[i].tagName}, Got: ${activeElement?.tagName || 'null'}`
        );
      } else {
        focusHistory.push(activeElement);
      }
    }

    // Test Shift+Tab navigation backward (if enabled)
    let reverseHistory: HTMLElement[] = [];
    if (testShiftTab && focusableElements.length > 1) {
      for (let i = focusableElements.length - 2; i >= 0; i--) {
        await user.keyboard('{Shift>}{Tab}{/Shift}');
        const activeElement = document.activeElement as HTMLElement;
        
        if (activeElement !== focusableElements[i]) {
          issues.push(
            `Shift+Tab navigation failed at index ${i}. Expected: ${focusableElements[i].tagName}, Got: ${activeElement?.tagName || 'null'}`
          );
        } else {
          reverseHistory.push(activeElement);
        }
      }
    }

    return {
      success: issues.length === 0,
      focusedElements: focusHistory,
      reverseHistory,
      expectedElements: focusableElements,
      issues,
      focusableCount: focusableElements.length,
    };
  },

  /**
   * Test arrow key navigation for custom components (like menus, lists)
   */
  testArrowKeyNavigation: async (
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>,
    options: {
      orientation?: 'horizontal' | 'vertical' | 'both';
      circular?: boolean;
      role?: string;
    } = {}
  ) => {
    const { orientation = 'vertical', circular = false, role } = options;

    const selector = role 
      ? `[role="${role}"] > *[role], [role="${role}"] > *[tabindex]`
      : '[role="menuitem"], [role="option"], [role="tab"]';
    
    const navigableElements = Array.from(
      container.querySelectorAll<HTMLElement>(selector)
    );

    if (navigableElements.length === 0) {
      return {
        success: false,
        issues: ['No arrow-navigable elements found'],
      };
    }

    const issues: string[] = [];
    const focusHistory: HTMLElement[] = [];

    // Focus first element
    navigableElements[0].focus();
    focusHistory.push(navigableElements[0]);

    // Test vertical navigation (ArrowDown/ArrowUp)
    if (orientation === 'vertical' || orientation === 'both') {
      // Test ArrowDown
      for (let i = 1; i < navigableElements.length; i++) {
        await user.keyboard('{ArrowDown}');
        const activeElement = document.activeElement as HTMLElement;
        
        if (activeElement !== navigableElements[i]) {
          issues.push(`ArrowDown failed at index ${i}`);
        } else {
          focusHistory.push(activeElement);
        }
      }

      // Test circular navigation if enabled
      if (circular) {
        await user.keyboard('{ArrowDown}');
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement !== navigableElements[0]) {
          issues.push('Circular navigation (ArrowDown) failed');
        }
      }
    }

    // Test horizontal navigation (ArrowRight/ArrowLeft)
    if (orientation === 'horizontal' || orientation === 'both') {
      // Reset to first element
      navigableElements[0].focus();
      
      // Test ArrowRight
      for (let i = 1; i < navigableElements.length; i++) {
        await user.keyboard('{ArrowRight}');
        const activeElement = document.activeElement as HTMLElement;
        
        if (activeElement !== navigableElements[i]) {
          issues.push(`ArrowRight failed at index ${i}`);
        }
      }
    }

    return {
      success: issues.length === 0,
      issues,
      focusHistory,
      navigableElements,
    };
  },

  /**
   * Test escape key behavior for dismissible components
   */
  testEscapeKeyBehavior: async (
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>,
    options: {
      onEscape?: () => void;
      shouldReturnFocus?: boolean;
      previouslyFocusedElement?: HTMLElement;
    } = {}
  ) => {
    const { onEscape, shouldReturnFocus = true, previouslyFocusedElement } = options;

    const initialActiveElement = document.activeElement as HTMLElement;
    const beforeEscapeElement = previouslyFocusedElement || initialActiveElement;

    // Press Escape
    await user.keyboard('{Escape}');

    // Check if custom handler was called
    if (onEscape) {
      onEscape();
    }

    // Verify focus return if expected
    if (shouldReturnFocus && beforeEscapeElement) {
      const finalActiveElement = document.activeElement as HTMLElement;
      return {
        success: finalActiveElement === beforeEscapeElement,
        focusReturned: finalActiveElement === beforeEscapeElement,
        beforeEscape: beforeEscapeElement,
        afterEscape: finalActiveElement,
      };
    }

    return {
      success: true,
      focusReturned: false,
      beforeEscape: beforeEscapeElement,
      afterEscape: document.activeElement as HTMLElement,
    };
  },
};

/**
 * Screen reader simulation utilities using Guidepup Virtual Screen Reader
 */
export const screenReaderUtils = {
  /**
   * Start virtual screen reader for component testing
   */
  startVirtualScreenReader: async (container: HTMLElement) => {
    await virtual.start({ container });
    return virtual;
  },

  /**
   * Stop virtual screen reader and cleanup
   */
  stopVirtualScreenReader: async () => {
    await virtual.stop();
  },

  /**
   * Test complete screen reader navigation through component
   */
  testScreenReaderNavigation: async (
    container: HTMLElement,
    expectedAnnouncements: string[],
    options: {
      exactMatch?: boolean;
      timeout?: number;
    } = {}
  ) => {
    const { exactMatch = false, timeout = 5000 } = options;

    await virtual.start({ container });

    try {
      const announcements: string[] = [];
      
      // Navigate through all content
      let attempts = 0;
      const maxAttempts = expectedAnnouncements.length * 2; // Safety limit

      while (attempts < maxAttempts) {
        try {
          await virtual.next();
          const phrase = await virtual.lastSpokenPhrase();
          
          if (phrase && phrase.trim()) {
            announcements.push(phrase.trim());
          }
          
          attempts++;
        } catch (error) {
          // End of content reached
          break;
        }
      }

      // Compare announcements with expectations
      const matches = expectedAnnouncements.map((expected, index) => {
        const actual = announcements[index];
        const isMatch = exactMatch 
          ? actual === expected
          : actual?.toLowerCase().includes(expected.toLowerCase());
        
        return {
          expected,
          actual: actual || '',
          isMatch,
          index,
        };
      });

      const allMatched = matches.every(match => match.isMatch);

      return {
        success: allMatched,
        announcements,
        expectedAnnouncements,
        matches,
        issues: matches
          .filter(match => !match.isMatch)
          .map(match => `Expected "${match.expected}", got "${match.actual}"`),
      };
    } finally {
      await virtual.stop();
    }
  },

  /**
   * Test specific screen reader landmarks and headings
   */
  testScreenReaderStructure: async (
    container: HTMLElement,
    expectedStructure: {
      landmarks?: string[];
      headings?: Array<{ level: number; text: string }>;
      links?: string[];
      buttons?: string[];
    }
  ) => {
    await virtual.start({ container });

    try {
      const structure = {
        landmarks: [] as string[],
        headings: [] as Array<{ level: number; text: string }>,
        links: [] as string[],
        buttons: [] as string[],
      };

      // Extract landmarks
      const landmarkElements = container.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="region"], main, nav, header, footer, aside, section[aria-labelledby], section[aria-label]');
      landmarkElements.forEach(element => {
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        const label = element.getAttribute('aria-label') || element.getAttribute('aria-labelledby');
        structure.landmarks.push(label ? `${role}: ${label}` : role);
      });

      // Extract headings
      const headingElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
      headingElements.forEach(element => {
        const level = element.getAttribute('aria-level') 
          ? parseInt(element.getAttribute('aria-level')!, 10)
          : parseInt(element.tagName.charAt(1), 10);
        const text = element.textContent?.trim() || '';
        structure.headings.push({ level, text });
      });

      // Extract links
      const linkElements = container.querySelectorAll('a[href], [role="link"]');
      linkElements.forEach(element => {
        const text = element.textContent?.trim() || element.getAttribute('aria-label') || '';
        if (text) structure.links.push(text);
      });

      // Extract buttons
      const buttonElements = container.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
      buttonElements.forEach(element => {
        const text = element.textContent?.trim() || element.getAttribute('aria-label') || element.getAttribute('value') || '';
        if (text) structure.buttons.push(text);
      });

      // Compare with expected structure
      const issues: string[] = [];

      if (expectedStructure.landmarks) {
        const missingLandmarks = expectedStructure.landmarks.filter(
          expected => !structure.landmarks.some(actual => actual.includes(expected))
        );
        if (missingLandmarks.length > 0) {
          issues.push(`Missing landmarks: ${missingLandmarks.join(', ')}`);
        }
      }

      if (expectedStructure.headings) {
        const missingHeadings = expectedStructure.headings.filter(
          expected => !structure.headings.some(
            actual => actual.level === expected.level && actual.text.includes(expected.text)
          )
        );
        if (missingHeadings.length > 0) {
          issues.push(`Missing headings: ${missingHeadings.map(h => `H${h.level}: ${h.text}`).join(', ')}`);
        }
      }

      return {
        success: issues.length === 0,
        structure,
        expectedStructure,
        issues,
      };
    } finally {
      await virtual.stop();
    }
  },
};

/**
 * Focus management testing utilities
 */
export const focusManagementUtils = {
  /**
   * Test focus trap implementation in modal dialogs
   */
  testFocusTrap: async (
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>,
    options: {
      modal?: HTMLElement;
      expectedFocusableCount?: number;
    } = {}
  ) => {
    const modal = options.modal || container.querySelector('[role="dialog"]') as HTMLElement;
    
    if (!modal) {
      return {
        success: false,
        issues: ['No modal dialog found'],
      };
    }

    const focusableElements = keyboardNavigationUtils.getFocusableElements(modal);
    const issues: string[] = [];

    if (options.expectedFocusableCount && focusableElements.length !== options.expectedFocusableCount) {
      issues.push(`Expected ${options.expectedFocusableCount} focusable elements, found ${focusableElements.length}`);
    }

    if (focusableElements.length === 0) {
      issues.push('No focusable elements in modal');
      return { success: false, issues, focusableElements };
    }

    // Test forward focus trap
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus last element and tab forward - should cycle to first
    lastElement.focus();
    await user.keyboard('{Tab}');
    
    if (document.activeElement !== firstElement) {
      issues.push('Forward focus trap failed: Tab from last element did not cycle to first');
    }

    // Test backward focus trap
    firstElement.focus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    
    if (document.activeElement !== lastElement) {
      issues.push('Backward focus trap failed: Shift+Tab from first element did not cycle to last');
    }

    // Test that focus doesn't escape outside modal
    const outsideElements = keyboardNavigationUtils
      .getFocusableElements(container)
      .filter(el => !modal.contains(el));

    for (const outsideElement of outsideElements.slice(0, 3)) { // Test first few
      outsideElement.focus();
      if (modal.contains(document.activeElement)) {
        // Good - focus was prevented from leaving modal
      } else if (document.activeElement === outsideElement) {
        issues.push(`Focus escaped modal to element: ${outsideElement.tagName}`);
      }
    }

    return {
      success: issues.length === 0,
      issues,
      focusableElements,
      firstElement,
      lastElement,
    };
  },

  /**
   * Test initial focus placement
   */
  testInitialFocus: async (
    container: HTMLElement,
    expectedElement?: HTMLElement | string,
    options: {
      timeout?: number;
    } = {}
  ) => {
    const { timeout = 1000 } = options;

    return new Promise<{
      success: boolean;
      focusedElement: HTMLElement | null;
      expectedElement: HTMLElement | null;
      issues: string[];
    }>((resolve) => {
      const issues: string[] = [];
      
      setTimeout(() => {
        const focusedElement = document.activeElement as HTMLElement;
        let expectedEl: HTMLElement | null = null;

        if (typeof expectedElement === 'string') {
          expectedEl = container.querySelector(expectedElement);
        } else if (expectedElement) {
          expectedEl = expectedElement;
        } else {
          // Default to first focusable element
          const focusableElements = keyboardNavigationUtils.getFocusableElements(container);
          expectedEl = focusableElements[0] || null;
        }

        if (!expectedEl) {
          issues.push('Expected focus element not found');
        } else if (focusedElement !== expectedEl) {
          issues.push(`Focus not on expected element. Expected: ${expectedEl.tagName}, Got: ${focusedElement?.tagName || 'none'}`);
        }

        resolve({
          success: issues.length === 0,
          focusedElement,
          expectedElement: expectedEl,
          issues,
        });
      }, timeout);
    });
  },

  /**
   * Test focus restoration after modal close
   */
  testFocusRestoration: async (
    triggerElement: HTMLElement,
    modal: HTMLElement,
    user: ReturnType<typeof userEvent.setup>,
    closeAction: () => Promise<void> | void
  ) => {
    const initialFocus = document.activeElement as HTMLElement;
    
    // Open modal (trigger should be focused initially)
    triggerElement.focus();
    
    // Wait for modal to potentially steal focus
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Perform close action
    await closeAction();
    
    // Wait for focus restoration
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const finalFocus = document.activeElement as HTMLElement;
    
    return {
      success: finalFocus === triggerElement,
      initialFocus,
      finalFocus,
      triggerElement,
      focusRestored: finalFocus === triggerElement,
    };
  },
};

/**
 * ARIA attribute validation utilities
 */
export const ariaValidationUtils = {
  /**
   * Validate required ARIA attributes for component
   */
  validateAriaAttributes: (
    element: HTMLElement,
    requiredAttributes: Record<string, string | boolean | string[]>
  ) => {
    const issues: string[] = [];
    const foundAttributes: Record<string, string | null> = {};

    Object.entries(requiredAttributes).forEach(([attribute, expectedValue]) => {
      const actualValue = element.getAttribute(attribute);
      foundAttributes[attribute] = actualValue;

      if (expectedValue === true && !actualValue) {
        issues.push(`Missing required attribute: ${attribute}`);
      } else if (typeof expectedValue === 'string' && actualValue !== expectedValue) {
        issues.push(`Incorrect ${attribute}. Expected: "${expectedValue}", Got: "${actualValue}"`);
      } else if (Array.isArray(expectedValue) && !expectedValue.includes(actualValue!)) {
        issues.push(`Invalid ${attribute}. Expected one of: [${expectedValue.join(', ')}], Got: "${actualValue}"`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      foundAttributes,
    };
  },

  /**
   * Check ARIA labeling completeness
   */
  checkAriaLabeling: (element: HTMLElement) => {
    const issues: string[] = [];
    const labeling = {
      hasAriaLabel: !!element.getAttribute('aria-label'),
      hasAriaLabelledBy: !!element.getAttribute('aria-labelledby'),
      hasAriaDescribedBy: !!element.getAttribute('aria-describedby'),
      hasTitle: !!element.getAttribute('title'),
      hasTextContent: !!element.textContent?.trim(),
    };

    // Check if element has any form of accessible name
    const hasAccessibleName = labeling.hasAriaLabel || 
                              labeling.hasAriaLabelledBy || 
                              labeling.hasTextContent ||
                              labeling.hasTitle;

    if (!hasAccessibleName) {
      issues.push('Element lacks accessible name (aria-label, aria-labelledby, text content, or title)');
    }

    // Check for redundant labeling
    if (labeling.hasAriaLabel && labeling.hasTextContent) {
      const ariaLabel = element.getAttribute('aria-label');
      const textContent = element.textContent?.trim();
      if (ariaLabel === textContent) {
        issues.push('Redundant aria-label that duplicates visible text');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      labeling,
    };
  },

  /**
   * Validate ARIA live region implementation
   */
  validateLiveRegion: async (
    element: HTMLElement,
    expectedAnnouncement: string,
    options: {
      politeness?: 'polite' | 'assertive';
      timeout?: number;
    } = {}
  ) => {
    const { politeness = 'polite', timeout = 1000 } = options;

    const issues: string[] = [];
    const ariaLive = element.getAttribute('aria-live');
    
    if (ariaLive !== politeness) {
      issues.push(`Expected aria-live="${politeness}", got "${ariaLive}"`);
    }

    // Set the expected content and wait
    element.textContent = expectedAnnouncement;
    
    return new Promise<{
      valid: boolean;
      issues: string[];
      announcement: string;
    }>((resolve) => {
      setTimeout(() => {
        resolve({
          valid: issues.length === 0,
          issues,
          announcement: element.textContent || '',
        });
      }, timeout);
    });
  },

  /**
   * Check ARIA role implementation
   */
  validateAriaRole: (
    element: HTMLElement,
    expectedRole: string,
    requiredProperties: string[] = []
  ) => {
    const issues: string[] = [];
    const actualRole = element.getAttribute('role');

    if (actualRole !== expectedRole) {
      issues.push(`Expected role="${expectedRole}", got "${actualRole}"`);
    }

    // Check required properties for this role
    requiredProperties.forEach(property => {
      if (!element.hasAttribute(property)) {
        issues.push(`Missing required property for ${expectedRole} role: ${property}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
      role: actualRole,
    };
  },
};

/**
 * Color contrast validation utilities
 * Note: Limited in JSDOM environment - full testing requires browser context
 */
export const colorContrastUtils = {
  /**
   * Parse RGB color string to values
   */
  parseColor: (colorString: string): [number, number, number] | null => {
    if (colorString.startsWith('rgb(')) {
      const values = colorString
        .slice(4, -1)
        .split(',')
        .map(v => parseInt(v.trim(), 10));
      return values.length === 3 ? [values[0], values[1], values[2]] : null;
    }

    if (colorString.startsWith('#')) {
      const hex = colorString.slice(1);
      if (hex.length === 3) {
        return [
          parseInt(hex[0] + hex[0], 16),
          parseInt(hex[1] + hex[1], 16),
          parseInt(hex[2] + hex[2], 16),
        ];
      } else if (hex.length === 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    }

    return null;
  },

  /**
   * Calculate relative luminance
   */
  getRelativeLuminance: (r: number, g: number, b: number): number => {
    const normalize = (val: number) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * normalize(r) + 0.7152 * normalize(g) + 0.0722 * normalize(b);
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: string, color2: string): number | null => {
    const rgb1 = colorContrastUtils.parseColor(color1);
    const rgb2 = colorContrastUtils.parseColor(color2);

    if (!rgb1 || !rgb2) return null;

    const lum1 = colorContrastUtils.getRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = colorContrastUtils.getRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if element meets WCAG contrast requirements
   * Limited effectiveness in JSDOM - use browser testing for comprehensive validation
   */
  checkElementContrast: (
    element: HTMLElement,
    level: WCAGLevel = 'AA',
    isLargeText: boolean = false
  ) => {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    if (!color || !backgroundColor || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
      return {
        valid: false,
        issues: ['Cannot determine background color (possibly transparent or inherited)'],
        note: 'Full color contrast testing requires browser environment',
      };
    }

    const contrastRatio = colorContrastUtils.getContrastRatio(color, backgroundColor);
    
    if (contrastRatio === null) {
      return {
        valid: false,
        issues: ['Could not parse color values'],
        colors: { foreground: color, background: backgroundColor },
      };
    }

    const requirements = CONTRAST_REQUIREMENTS[level];
    const threshold = isLargeText ? requirements.large : requirements.normal;
    const valid = contrastRatio >= threshold;

    return {
      valid,
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      threshold,
      level,
      isLargeText,
      colors: { foreground: color, background: backgroundColor },
      issues: valid ? [] : [`Contrast ratio ${contrastRatio.toFixed(2)} does not meet ${level} requirement of ${threshold}`],
    };
  },

  /**
   * Validate touch target size for mobile accessibility
   */
  validateTouchTargetSize: (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const issues: string[] = [];

    if (rect.width < TOUCH_TARGET_MINIMUM.width) {
      issues.push(`Touch target width ${rect.width}px is below minimum ${TOUCH_TARGET_MINIMUM.width}px`);
    }

    if (rect.height < TOUCH_TARGET_MINIMUM.height) {
      issues.push(`Touch target height ${rect.height}px is below minimum ${TOUCH_TARGET_MINIMUM.height}px`);
    }

    return {
      valid: issues.length === 0,
      issues,
      size: { width: rect.width, height: rect.height },
      minimum: TOUCH_TARGET_MINIMUM,
    };
  },
};

/**
 * Comprehensive accessibility test suite for components
 */
export const accessibilityTestSuite = {
  /**
   * Run complete accessibility test suite
   */
  runFullAccessibilityTest: async (
    container: HTMLElement,
    user: ReturnType<typeof userEvent.setup>,
    options: {
      skipAxe?: boolean;
      skipKeyboard?: boolean;
      skipScreenReader?: boolean;
      skipFocus?: boolean;
      skipContrast?: boolean;
      wcagLevel?: WCAGLevel;
      expectedScreenReaderContent?: string[];
      customValidations?: Array<() => Promise<{ valid: boolean; issues: string[] }> | { valid: boolean; issues: string[] }>;
    } = {}
  ) => {
    const {
      skipAxe = false,
      skipKeyboard = false,
      skipScreenReader = false,
      skipFocus = false,
      skipContrast = false,
      wcagLevel = 'AA',
      expectedScreenReaderContent = [],
      customValidations = [],
    } = options;

    const results = {
      axe: { valid: true, issues: [] as string[] },
      keyboard: { valid: true, issues: [] as string[] },
      screenReader: { valid: true, issues: [] as string[] },
      focus: { valid: true, issues: [] as string[] },
      contrast: { valid: true, issues: [] as string[] },
      custom: { valid: true, issues: [] as string[] },
      overall: { valid: true, issues: [] as string[] },
    };

    // Run axe accessibility audit
    if (!skipAxe) {
      try {
        const axeResults = await axeUtils.runAccessibilityAudit(container, { level: wcagLevel });
        results.axe = {
          valid: !axeResults.hasViolations,
          issues: axeResults.violations.map(v => `${v.id}: ${v.description}`),
        };
      } catch (error) {
        results.axe = {
          valid: false,
          issues: [`Axe test failed: ${error}`],
        };
      }
    }

    // Run keyboard navigation tests
    if (!skipKeyboard) {
      try {
        const keyboardResults = await keyboardNavigationUtils.testKeyboardNavigation(container, user);
        results.keyboard = {
          valid: keyboardResults.success,
          issues: keyboardResults.issues,
        };
      } catch (error) {
        results.keyboard = {
          valid: false,
          issues: [`Keyboard test failed: ${error}`],
        };
      }
    }

    // Run screen reader tests
    if (!skipScreenReader && expectedScreenReaderContent.length > 0) {
      try {
        const screenReaderResults = await screenReaderUtils.testScreenReaderNavigation(
          container,
          expectedScreenReaderContent
        );
        results.screenReader = {
          valid: screenReaderResults.success,
          issues: screenReaderResults.issues,
        };
      } catch (error) {
        results.screenReader = {
          valid: false,
          issues: [`Screen reader test failed: ${error}`],
        };
      }
    }

    // Run focus management tests
    if (!skipFocus) {
      try {
        const focusableElements = keyboardNavigationUtils.getFocusableElements(container);
        if (focusableElements.length > 0) {
          const focusResults = await focusManagementUtils.testInitialFocus(container);
          results.focus = {
            valid: focusResults.success,
            issues: focusResults.issues,
          };
        }
      } catch (error) {
        results.focus = {
          valid: false,
          issues: [`Focus test failed: ${error}`],
        };
      }
    }

    // Run color contrast tests (limited in JSDOM)
    if (!skipContrast) {
      try {
        const textElements = container.querySelectorAll('p, span, div, button, a, label, h1, h2, h3, h4, h5, h6');
        const contrastIssues: string[] = [];

        textElements.forEach((element, index) => {
          const contrastResult = colorContrastUtils.checkElementContrast(element as HTMLElement, wcagLevel);
          if (!contrastResult.valid) {
            contrastIssues.push(`Element ${index}: ${contrastResult.issues.join(', ')}`);
          }
        });

        results.contrast = {
          valid: contrastIssues.length === 0,
          issues: contrastIssues,
        };
      } catch (error) {
        results.contrast = {
          valid: false,
          issues: [`Contrast test failed: ${error}`],
        };
      }
    }

    // Run custom validations
    if (customValidations.length > 0) {
      try {
        const customIssues: string[] = [];
        
        for (const validation of customValidations) {
          const result = await validation();
          if (!result.valid) {
            customIssues.push(...result.issues);
          }
        }

        results.custom = {
          valid: customIssues.length === 0,
          issues: customIssues,
        };
      } catch (error) {
        results.custom = {
          valid: false,
          issues: [`Custom validation failed: ${error}`],
        };
      }
    }

    // Calculate overall results
    const allResults = [results.axe, results.keyboard, results.screenReader, results.focus, results.contrast, results.custom];
    const overallValid = allResults.every(result => result.valid);
    const overallIssues = allResults.flatMap(result => result.issues);

    results.overall = {
      valid: overallValid,
      issues: overallIssues,
    };

    return results;
  },

  /**
   * Generate accessibility test report
   */
  generateAccessibilityReport: (
    results: Awaited<ReturnType<typeof accessibilityTestSuite.runFullAccessibilityTest>>
  ) => {
    const sections = [
      { name: 'Axe Core Audit', ...results.axe },
      { name: 'Keyboard Navigation', ...results.keyboard },
      { name: 'Screen Reader Compatibility', ...results.screenReader },
      { name: 'Focus Management', ...results.focus },
      { name: 'Color Contrast', ...results.contrast },
      { name: 'Custom Validations', ...results.custom },
    ];

    const report = {
      summary: {
        overallValid: results.overall.valid,
        totalIssues: results.overall.issues.length,
        passedSections: sections.filter(s => s.valid).length,
        totalSections: sections.length,
      },
      sections: sections.map(section => ({
        name: section.name,
        valid: section.valid,
        issues: section.issues,
        status: section.valid ? 'PASS' : 'FAIL',
      })),
      recommendations: results.overall.issues.map(issue => ({
        issue,
        priority: issue.includes('critical') ? 'HIGH' : 
                 issue.includes('serious') ? 'MEDIUM' : 'LOW',
      })),
    };

    return report;
  },
};

// Export convenience functions for common testing patterns
export const a11y = {
  // Quick axe test
  checkAxe: axeUtils.expectNoAccessibilityViolations,
  
  // Quick keyboard test
  checkKeyboard: keyboardNavigationUtils.testKeyboardNavigation,
  
  // Quick screen reader test
  checkScreenReader: screenReaderUtils.testScreenReaderNavigation,
  
  // Quick focus test
  checkFocus: focusManagementUtils.testFocusTrap,
  
  // Full test suite
  checkAll: accessibilityTestSuite.runFullAccessibilityTest,
};

export default {
  axeUtils,
  keyboardNavigationUtils,
  screenReaderUtils,
  focusManagementUtils,
  ariaValidationUtils,
  colorContrastUtils,
  accessibilityTestSuite,
  a11y,
  WCAG_LEVELS,
  CONTRAST_REQUIREMENTS,
  TOUCH_TARGET_MINIMUM,
};