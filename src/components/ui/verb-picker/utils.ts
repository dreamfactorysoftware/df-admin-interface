/**
 * Utility functions for HTTP verb picker operations
 * 
 * Provides pure functions for HTTP verb selection logic including bitmask conversions,
 * value transformations, option generation, and validation helpers. Optimized for
 * tree-shaking and performance with proper TypeScript typing.
 */

import {
  type HttpVerb,
  type VerbOption,
  type VerbPickerMode,
  type VerbPickerAnyValue,
  type VerbValidationResult,
  type ConfigSchema,
  VERB_BITMASKS,
} from './types';
import { cn } from '@/lib/utils';

// ============================================================================
// Constants and Configuration
// ============================================================================

/**
 * Default HTTP verb labels for internationalization
 * Can be overridden by i18n system
 */
export const DEFAULT_VERB_LABELS: Record<HttpVerb, string> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

/**
 * Reverse mapping from bitmask values to HTTP verbs
 * Optimized for constant-time lookups
 */
export const BITMASK_TO_VERB: Record<number, HttpVerb> = {
  [VERB_BITMASKS.GET]: 'GET',
  [VERB_BITMASKS.POST]: 'POST',
  [VERB_BITMASKS.PUT]: 'PUT',
  [VERB_BITMASKS.PATCH]: 'PATCH',
  [VERB_BITMASKS.DELETE]: 'DELETE',
} as const;

/**
 * All supported HTTP verbs in consistent order
 */
export const ALL_HTTP_VERBS: readonly HttpVerb[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
] as const;

/**
 * Maximum valid bitmask value (all verbs combined)
 * Used for validation: 1 + 2 + 4 + 8 + 16 = 31
 */
export const MAX_BITMASK_VALUE = 31;

// ============================================================================
// Bitmask Conversion Functions
// ============================================================================

/**
 * Convert a numeric bitmask value to an array of HTTP verbs
 * 
 * Performs bitwise operations to extract individual verb flags from
 * a combined bitmask value. Optimized for performance with early returns.
 * 
 * @param bitmask - Numeric bitmask value representing combined verbs
 * @returns Array of HTTP verbs corresponding to set bits
 * 
 * @example
 * ```typescript
 * convertBitmaskToVerbs(3) // Returns ['GET', 'POST'] (1 + 2)
 * convertBitmaskToVerbs(12) // Returns ['PUT', 'PATCH'] (4 + 8)
 * convertBitmaskToVerbs(0) // Returns []
 * ```
 */
export function convertBitmaskToVerbs(bitmask: number): HttpVerb[] {
  // Input validation
  if (!Number.isInteger(bitmask) || bitmask < 0 || bitmask > MAX_BITMASK_VALUE) {
    return [];
  }

  const verbs: HttpVerb[] = [];

  // Use bitwise operations for efficient extraction
  for (const verb of ALL_HTTP_VERBS) {
    const verbBitmask = VERB_BITMASKS[verb];
    if ((bitmask & verbBitmask) === verbBitmask) {
      verbs.push(verb);
    }
  }

  return verbs;
}

/**
 * Convert an array of HTTP verbs to a numeric bitmask value
 * 
 * Combines individual verb bitmasks using bitwise OR operations.
 * Handles duplicate verbs gracefully and maintains consistent ordering.
 * 
 * @param verbs - Array of HTTP verbs to combine
 * @returns Numeric bitmask value representing combined verbs
 * 
 * @example
 * ```typescript
 * convertVerbsToBitmask(['GET', 'POST']) // Returns 3 (1 + 2)
 * convertVerbsToBitmask(['PUT', 'PATCH']) // Returns 12 (4 + 8)
 * convertVerbsToBitmask([]) // Returns 0
 * ```
 */
export function convertVerbsToBitmask(verbs: HttpVerb[]): number {
  // Input validation
  if (!Array.isArray(verbs)) {
    return 0;
  }

  let bitmask = 0;

  // Use Set to automatically handle duplicates
  const uniqueVerbs = new Set(verbs);
  
  for (const verb of uniqueVerbs) {
    if (verb in VERB_BITMASKS) {
      bitmask |= VERB_BITMASKS[verb];
    }
  }

  return bitmask;
}

/**
 * Convert a single HTTP verb to its bitmask value
 * 
 * @param verb - HTTP verb to convert
 * @returns Numeric bitmask value for the verb
 * 
 * @example
 * ```typescript
 * convertVerbToBitmask('GET') // Returns 1
 * convertVerbToBitmask('DELETE') // Returns 16
 * ```
 */
export function convertVerbToBitmask(verb: HttpVerb): number {
  return VERB_BITMASKS[verb] || 0;
}

/**
 * Convert a bitmask value to a single HTTP verb
 * 
 * Returns the first valid verb if bitmask represents multiple verbs.
 * Used primarily for single-verb selection modes.
 * 
 * @param bitmask - Numeric bitmask value
 * @returns Single HTTP verb or null if invalid
 * 
 * @example
 * ```typescript
 * convertBitmaskToVerb(1) // Returns 'GET'
 * convertBitmaskToVerb(3) // Returns 'GET' (first valid verb)
 * convertBitmaskToVerb(0) // Returns null
 * ```
 */
export function convertBitmaskToVerb(bitmask: number): HttpVerb | null {
  const verbs = convertBitmaskToVerbs(bitmask);
  return verbs.length > 0 ? verbs[0] : null;
}

// ============================================================================
// Value Transformation Functions
// ============================================================================

/**
 * Transform values between different verb picker modes
 * 
 * Handles conversion between single verb, multiple verbs, and numeric
 * bitmask representations. Maintains type safety and validation.
 * 
 * @param value - Input value to transform
 * @param fromMode - Source mode of the input value
 * @param toMode - Target mode for transformation
 * @returns Transformed value in target mode format
 * 
 * @example
 * ```typescript
 * transformValue('GET', 'verb', 'number') // Returns 1
 * transformValue(['GET', 'POST'], 'verb_multiple', 'number') // Returns 3
 * transformValue(3, 'number', 'verb_multiple') // Returns ['GET', 'POST']
 * ```
 */
export function transformValue(
  value: VerbPickerAnyValue,
  fromMode: VerbPickerMode,
  toMode: VerbPickerMode
): VerbPickerAnyValue {
  // Early return if modes are the same
  if (fromMode === toMode) {
    return value;
  }

  // Handle null/undefined values
  if (value == null) {
    switch (toMode) {
      case 'verb':
        return null;
      case 'verb_multiple':
        return [];
      case 'number':
        return 0;
      default:
        return null;
    }
  }

  // Convert to intermediate verb array format
  let verbArray: HttpVerb[];

  switch (fromMode) {
    case 'verb':
      verbArray = typeof value === 'string' && value in VERB_BITMASKS ? [value as HttpVerb] : [];
      break;
    case 'verb_multiple':
      verbArray = Array.isArray(value) ? value.filter(v => v in VERB_BITMASKS) : [];
      break;
    case 'number':
      verbArray = typeof value === 'number' ? convertBitmaskToVerbs(value) : [];
      break;
    default:
      verbArray = [];
  }

  // Convert from verb array to target format
  switch (toMode) {
    case 'verb':
      return verbArray.length > 0 ? verbArray[0] : null;
    case 'verb_multiple':
      return verbArray;
    case 'number':
      return convertVerbsToBitmask(verbArray);
    default:
      return null;
  }
}

// ============================================================================
// Option Generation Functions
// ============================================================================

/**
 * Generate verb options for picker component with internationalization support
 * 
 * Creates standardized option objects with proper labels, values, and alt values.
 * Supports custom label overrides and maintains consistent ordering.
 * 
 * @param customLabels - Optional custom labels for verbs
 * @param includedVerbs - Optional subset of verbs to include
 * @returns Array of formatted verb options
 * 
 * @example
 * ```typescript
 * generateVerbOptions() // Returns all verbs with default labels
 * generateVerbOptions({ GET: 'Retrieve' }) // Custom label for GET
 * generateVerbOptions({}, ['GET', 'POST']) // Only GET and POST options
 * ```
 */
export function generateVerbOptions(
  customLabels?: Partial<Record<HttpVerb, string>>,
  includedVerbs?: HttpVerb[]
): VerbOption[] {
  const verbs = includedVerbs || ALL_HTTP_VERBS;
  const labels = { ...DEFAULT_VERB_LABELS, ...customLabels };

  return verbs.map(verb => ({
    value: VERB_BITMASKS[verb],
    altValue: verb,
    label: labels[verb] || verb,
  }));
}

/**
 * Generate verb options from configuration schema
 * 
 * Extracts verb options from field schema configuration, supporting
 * custom labels and constraints defined in the schema.
 * 
 * @param schema - Configuration schema for the field
 * @returns Array of verb options based on schema
 */
export function generateVerbOptionsFromSchema(schema?: Partial<ConfigSchema>): VerbOption[] {
  if (!schema) {
    return generateVerbOptions();
  }

  // Extract custom labels from schema
  const customLabels = schema.labels as Partial<Record<HttpVerb, string>> | undefined;
  
  // Extract allowed verbs from schema constraints
  const allowedVerbs = schema.allowedVerbs as HttpVerb[] | undefined;

  return generateVerbOptions(customLabels, allowedVerbs);
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate verb selection based on constraints and mode
 * 
 * Performs comprehensive validation including required field checking,
 * selection count limits, and allowed verb constraints.
 * 
 * @param value - Current value to validate
 * @param mode - Picker mode for validation rules
 * @param options - Validation options and constraints
 * @returns Validation result with error details
 * 
 * @example
 * ```typescript
 * validateVerbSelection([], 'verb_multiple', { required: true })
 * // Returns { isValid: false, error: 'Selection is required' }
 * 
 * validateVerbSelection(['GET', 'POST'], 'verb_multiple', { maxSelections: 1 })
 * // Returns { isValid: false, error: 'Maximum 1 selection allowed' }
 * ```
 */
export function validateVerbSelection(
  value: VerbPickerAnyValue,
  mode: VerbPickerMode,
  options: {
    required?: boolean;
    maxSelections?: number;
    minSelections?: number;
    allowedVerbs?: HttpVerb[];
    fieldName?: string;
  } = {}
): VerbValidationResult {
  const {
    required = false,
    maxSelections,
    minSelections,
    allowedVerbs,
    fieldName = 'verbs',
  } = options;

  // Convert value to consistent format for validation
  const verbs = getSelectedVerbs(value, mode);

  // Check required field
  if (required && verbs.length === 0) {
    return {
      isValid: false,
      error: 'Selection is required',
      field: fieldName,
    };
  }

  // Check minimum selections
  if (minSelections !== undefined && verbs.length < minSelections) {
    return {
      isValid: false,
      error: `Minimum ${minSelections} selection${minSelections === 1 ? '' : 's'} required`,
      field: fieldName,
    };
  }

  // Check maximum selections
  if (maxSelections !== undefined && verbs.length > maxSelections) {
    return {
      isValid: false,
      error: `Maximum ${maxSelections} selection${maxSelections === 1 ? '' : 's'} allowed`,
      field: fieldName,
    };
  }

  // Check allowed verbs constraint
  if (allowedVerbs) {
    const invalidVerbs = verbs.filter(verb => !allowedVerbs.includes(verb));
    if (invalidVerbs.length > 0) {
      return {
        isValid: false,
        error: `Invalid verb${invalidVerbs.length === 1 ? '' : 's'}: ${invalidVerbs.join(', ')}`,
        field: fieldName,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate if a combination of HTTP verbs is logically valid
 * 
 * Checks for common anti-patterns and incompatible verb combinations
 * based on REST API best practices.
 * 
 * @param verbs - Array of HTTP verbs to validate
 * @returns Validation result with specific combination errors
 * 
 * @example
 * ```typescript
 * isValidVerbCombination(['GET', 'DELETE']) // Valid combination
 * isValidVerbCombination(['POST', 'PUT', 'PATCH']) // Potentially redundant
 * ```
 */
export function isValidVerbCombination(verbs: HttpVerb[]): VerbValidationResult {
  if (verbs.length === 0) {
    return { isValid: true };
  }

  // Check for potentially redundant combinations
  const hasPost = verbs.includes('POST');
  const hasPut = verbs.includes('PUT');
  const hasPatch = verbs.includes('PATCH');

  if (hasPost && hasPut && hasPatch) {
    return {
      isValid: false,
      error: 'Having POST, PUT, and PATCH together may be redundant',
    };
  }

  // All combinations are technically valid for HTTP
  return { isValid: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract selected verbs from component state or value
 * 
 * Normalizes different value formats (single verb, array, bitmask)
 * into a consistent array of HTTP verbs for processing.
 * 
 * @param value - Current component value
 * @param mode - Component mode for interpretation
 * @returns Array of currently selected HTTP verbs
 * 
 * @example
 * ```typescript
 * getSelectedVerbs('GET', 'verb') // Returns ['GET']
 * getSelectedVerbs(['GET', 'POST'], 'verb_multiple') // Returns ['GET', 'POST']
 * getSelectedVerbs(3, 'number') // Returns ['GET', 'POST']
 * ```
 */
export function getSelectedVerbs(
  value: VerbPickerAnyValue,
  mode: VerbPickerMode
): HttpVerb[] {
  if (value == null) {
    return [];
  }

  switch (mode) {
    case 'verb':
      return typeof value === 'string' && value in VERB_BITMASKS ? [value as HttpVerb] : [];
    case 'verb_multiple':
      return Array.isArray(value) ? value.filter(v => v in VERB_BITMASKS) : [];
    case 'number':
      return typeof value === 'number' ? convertBitmaskToVerbs(value) : [];
    default:
      return [];
  }
}

/**
 * Format verb labels for consistent display
 * 
 * Applies consistent formatting rules for verb labels including
 * capitalization, spacing, and localization support.
 * 
 * @param verbs - Array of HTTP verbs to format
 * @param customLabels - Optional custom label mappings
 * @param separator - Separator for multiple verbs
 * @returns Formatted display string
 * 
 * @example
 * ```typescript
 * formatVerbDisplay(['GET', 'POST']) // Returns 'GET, POST'
 * formatVerbDisplay(['GET'], { GET: 'Retrieve' }) // Returns 'Retrieve'
 * formatVerbDisplay(['GET', 'POST'], {}, ' | ') // Returns 'GET | POST'
 * ```
 */
export function formatVerbDisplay(
  verbs: HttpVerb[],
  customLabels?: Partial<Record<HttpVerb, string>>,
  separator: string = ', '
): string {
  if (verbs.length === 0) {
    return '';
  }

  const labels = { ...DEFAULT_VERB_LABELS, ...customLabels };
  
  return verbs
    .map(verb => labels[verb] || verb)
    .join(separator);
}

/**
 * Check if a specific verb is selected in the current value
 * 
 * Efficiently determines selection state for individual verbs
 * across different picker modes and value formats.
 * 
 * @param value - Current picker value
 * @param verb - HTTP verb to check
 * @param mode - Picker mode for interpretation
 * @returns Whether the verb is currently selected
 * 
 * @example
 * ```typescript
 * isVerbSelected('GET', 'GET', 'verb') // Returns true
 * isVerbSelected(['GET', 'POST'], 'POST', 'verb_multiple') // Returns true
 * isVerbSelected(3, 'POST', 'number') // Returns true (bitmask includes POST)
 * ```
 */
export function isVerbSelected(
  value: VerbPickerAnyValue,
  verb: HttpVerb,
  mode: VerbPickerMode
): boolean {
  if (value == null || !(verb in VERB_BITMASKS)) {
    return false;
  }

  switch (mode) {
    case 'verb':
      return value === verb;
    case 'verb_multiple':
      return Array.isArray(value) && value.includes(verb);
    case 'number':
      return typeof value === 'number' && (value & VERB_BITMASKS[verb]) === VERB_BITMASKS[verb];
    default:
      return false;
  }
}

/**
 * Toggle selection state of a specific verb
 * 
 * Adds or removes a verb from the current selection based on
 * current state and picker mode constraints.
 * 
 * @param currentValue - Current picker value
 * @param verb - HTTP verb to toggle
 * @param mode - Picker mode for operation
 * @returns New value with toggled verb selection
 * 
 * @example
 * ```typescript
 * toggleVerbSelection('GET', 'POST', 'verb') // Returns 'POST'
 * toggleVerbSelection(['GET'], 'POST', 'verb_multiple') // Returns ['GET', 'POST']
 * toggleVerbSelection(1, 'POST', 'number') // Returns 3 (1 + 2)
 * ```
 */
export function toggleVerbSelection(
  currentValue: VerbPickerAnyValue,
  verb: HttpVerb,
  mode: VerbPickerMode
): VerbPickerAnyValue {
  if (!(verb in VERB_BITMASKS)) {
    return currentValue;
  }

  const isSelected = isVerbSelected(currentValue, verb, mode);

  switch (mode) {
    case 'verb':
      // In single mode, selecting a new verb replaces the current one
      // Deselecting returns null
      return isSelected ? null : verb;

    case 'verb_multiple': {
      const currentVerbs = getSelectedVerbs(currentValue, mode);
      if (isSelected) {
        return currentVerbs.filter(v => v !== verb);
      } else {
        return [...currentVerbs, verb];
      }
    }

    case 'number': {
      const currentBitmask = typeof currentValue === 'number' ? currentValue : 0;
      const verbBitmask = VERB_BITMASKS[verb];
      if (isSelected) {
        return currentBitmask & ~verbBitmask; // Remove verb using bitwise AND with NOT
      } else {
        return currentBitmask | verbBitmask; // Add verb using bitwise OR
      }
    }

    default:
      return currentValue;
  }
}

/**
 * Get all possible verb combinations for a given maximum selection count
 * 
 * Generates all valid combinations of HTTP verbs up to the specified limit.
 * Useful for testing and validation scenarios.
 * 
 * @param maxCount - Maximum number of verbs in each combination
 * @param allowedVerbs - Optional subset of verbs to use
 * @returns Array of all possible verb combinations
 */
export function getVerbCombinations(
  maxCount: number = ALL_HTTP_VERBS.length,
  allowedVerbs: HttpVerb[] = [...ALL_HTTP_VERBS]
): HttpVerb[][] {
  const combinations: HttpVerb[][] = [];
  const verbs = allowedVerbs.filter(v => v in VERB_BITMASKS);

  function generateCombinations(
    startIndex: number,
    currentCombination: HttpVerb[],
    remainingCount: number
  ): void {
    if (remainingCount === 0 || startIndex >= verbs.length) {
      if (currentCombination.length > 0) {
        combinations.push([...currentCombination]);
      }
      return;
    }

    // Include current verb
    currentCombination.push(verbs[startIndex]);
    generateCombinations(startIndex + 1, currentCombination, remainingCount - 1);
    currentCombination.pop();

    // Exclude current verb
    generateCombinations(startIndex + 1, currentCombination, remainingCount);
  }

  generateCombinations(0, [], maxCount);
  return combinations;
}

/**
 * Create a verb picker value validator function
 * 
 * Returns a configured validator function for use with form libraries
 * like React Hook Form. Encapsulates validation logic with preset options.
 * 
 * @param validationOptions - Preset validation options
 * @returns Configured validator function
 */
export function createVerbValidator(
  validationOptions: Parameters<typeof validateVerbSelection>[2] = {}
) {
  return (value: VerbPickerAnyValue, mode: VerbPickerMode = 'verb_multiple') => {
    return validateVerbSelection(value, mode, validationOptions);
  };
}