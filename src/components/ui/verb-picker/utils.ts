/**
 * Utility functions for HTTP verb picker operations
 * Provides pure functions for verb selection logic, bitmask conversions,
 * value transformations, and validation helpers.
 */

// HTTP verb type definitions matching Angular implementation
export type HttpVerb = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// HTTP verb bitmask values matching Angular df-verb-picker implementation
export const HTTP_VERB_BITMASKS = {
  GET: 1,
  POST: 2,
  PUT: 4,
  PATCH: 8,
  DELETE: 16,
} as const;

// Verb option interface matching Angular implementation
export interface VerbOption {
  value: number;
  altValue: HttpVerb;
  label: string;
}

// Selection mode types
export type VerbPickerMode = 'verb' | 'verb_multiple' | 'number';

// Value types for different selection modes
export type VerbValue = HttpVerb | HttpVerb[] | number;

/**
 * Converts a numeric bitmask to an array of HTTP verbs
 * Matches Angular writeValue logic for 'number' type
 * @param bitmask - Numeric bitmask representing selected verbs
 * @returns Array of selected HTTP verbs
 */
export function convertBitmaskToVerbs(bitmask: number): HttpVerb[] {
  if (!bitmask || typeof bitmask !== 'number') {
    return [];
  }

  const selectedVerbs: HttpVerb[] = [];
  
  // Check each verb bitmask value
  for (const [verb, value] of Object.entries(HTTP_VERB_BITMASKS)) {
    if ((bitmask & value) === value) {
      selectedVerbs.push(verb as HttpVerb);
    }
  }
  
  return selectedVerbs;
}

/**
 * Converts an array of HTTP verbs to a numeric bitmask
 * Matches Angular registerOnChange logic for 'number' type
 * @param verbs - Array of HTTP verbs to convert
 * @returns Numeric bitmask representing the verbs
 */
export function convertVerbsToBitmask(verbs: HttpVerb[]): number {
  if (!Array.isArray(verbs) || verbs.length === 0) {
    return 0;
  }

  return verbs.reduce((bitmask, verb) => {
    const verbValue = HTTP_VERB_BITMASKS[verb];
    return verbValue ? bitmask | verbValue : bitmask;
  }, 0);
}

/**
 * Transforms value between different verb picker modes
 * Provides comprehensive value conversion matching Angular ControlValueAccessor behavior
 * @param value - Input value to transform
 * @param fromMode - Source mode type
 * @param toMode - Target mode type
 * @returns Transformed value in target mode format
 */
export function transformValue(
  value: VerbValue | undefined,
  fromMode: VerbPickerMode,
  toMode: VerbPickerMode
): VerbValue | undefined {
  if (!value) {
    return undefined;
  }

  // Same mode, return as-is
  if (fromMode === toMode) {
    return value;
  }

  // Convert from different modes
  switch (fromMode) {
    case 'number':
      if (typeof value === 'number') {
        const verbs = convertBitmaskToVerbs(value);
        if (toMode === 'verb') {
          return verbs.length > 0 ? verbs[0] : undefined;
        }
        if (toMode === 'verb_multiple') {
          return verbs;
        }
      }
      break;

    case 'verb':
      if (typeof value === 'string') {
        if (toMode === 'number') {
          return HTTP_VERB_BITMASKS[value as HttpVerb] || 0;
        }
        if (toMode === 'verb_multiple') {
          return [value as HttpVerb];
        }
      }
      break;

    case 'verb_multiple':
      if (Array.isArray(value)) {
        if (toMode === 'number') {
          return convertVerbsToBitmask(value as HttpVerb[]);
        }
        if (toMode === 'verb') {
          return value.length > 0 ? value[0] : undefined;
        }
      }
      break;
  }

  return undefined;
}

/**
 * Generates verb options with internationalization support
 * Creates the standard verb options array matching Angular implementation
 * @param translate - Translation function for verb labels
 * @returns Array of verb options with translated labels
 */
export function generateVerbOptions(
  translate?: (key: string) => string
): VerbOption[] {
  const defaultTranslate = (key: string) => {
    const verbMap = {
      'verbs.get': 'GET',
      'verbs.post': 'POST', 
      'verbs.put': 'PUT',
      'verbs.patch': 'PATCH',
      'verbs.delete': 'DELETE',
    };
    return verbMap[key as keyof typeof verbMap] || key;
  };

  const translateFn = translate || defaultTranslate;

  return [
    {
      value: HTTP_VERB_BITMASKS.GET,
      altValue: 'GET',
      label: translateFn('verbs.get'),
    },
    {
      value: HTTP_VERB_BITMASKS.POST,
      altValue: 'POST',
      label: translateFn('verbs.post'),
    },
    {
      value: HTTP_VERB_BITMASKS.PUT,
      altValue: 'PUT',
      label: translateFn('verbs.put'),
    },
    {
      value: HTTP_VERB_BITMASKS.PATCH,
      altValue: 'PATCH',
      label: translateFn('verbs.patch'),
    },
    {
      value: HTTP_VERB_BITMASKS.DELETE,
      altValue: 'DELETE',
      label: translateFn('verbs.delete'),
    },
  ];
}

/**
 * Validates verb selection based on constraints and mode
 * @param value - Selected verb value to validate
 * @param mode - Selection mode for validation rules
 * @param required - Whether selection is required
 * @returns Validation result with error message if invalid
 */
export function validateVerbSelection(
  value: VerbValue | undefined,
  mode: VerbPickerMode,
  required = false
): { isValid: boolean; error?: string } {
  // Check required validation
  if (required) {
    if (!value) {
      return { isValid: false, error: 'Verb selection is required' };
    }

    if (mode === 'verb_multiple' && Array.isArray(value) && value.length === 0) {
      return { isValid: false, error: 'At least one verb must be selected' };
    }

    if (mode === 'number' && typeof value === 'number' && value === 0) {
      return { isValid: false, error: 'At least one verb must be selected' };
    }
  }

  // Validate value type matches mode
  switch (mode) {
    case 'verb':
      if (value && typeof value !== 'string') {
        return { isValid: false, error: 'Single verb must be a string value' };
      }
      if (value && !Object.keys(HTTP_VERB_BITMASKS).includes(value as string)) {
        return { isValid: false, error: 'Invalid HTTP verb selected' };
      }
      break;

    case 'verb_multiple':
      if (value && !Array.isArray(value)) {
        return { isValid: false, error: 'Multiple verbs must be an array' };
      }
      if (Array.isArray(value)) {
        const invalidVerbs = value.filter(v => !Object.keys(HTTP_VERB_BITMASKS).includes(v));
        if (invalidVerbs.length > 0) {
          return { isValid: false, error: `Invalid HTTP verbs: ${invalidVerbs.join(', ')}` };
        }
      }
      break;

    case 'number':
      if (value && typeof value !== 'number') {
        return { isValid: false, error: 'Bitmask value must be a number' };
      }
      if (typeof value === 'number' && (value < 0 || value > 31)) {
        return { isValid: false, error: 'Bitmask value must be between 0 and 31' };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Extracts selected verbs from component state value
 * Normalizes different value formats to consistent verb array
 * @param value - Component value in any format
 * @param mode - Selection mode for interpretation
 * @returns Array of selected HTTP verbs
 */
export function getSelectedVerbs(
  value: VerbValue | undefined,
  mode: VerbPickerMode
): HttpVerb[] {
  if (!value) {
    return [];
  }

  switch (mode) {
    case 'verb':
      return typeof value === 'string' ? [value as HttpVerb] : [];

    case 'verb_multiple':
      return Array.isArray(value) ? value as HttpVerb[] : [];

    case 'number':
      return typeof value === 'number' ? convertBitmaskToVerbs(value) : [];

    default:
      return [];
  }
}

/**
 * Formats verb display for consistent presentation
 * Provides formatted verb labels for UI display
 * @param verbs - Array of HTTP verbs to format
 * @param mode - Display mode for formatting
 * @returns Formatted display string
 */
export function formatVerbDisplay(
  verbs: HttpVerb[],
  mode: 'short' | 'long' = 'short'
): string {
  if (verbs.length === 0) {
    return 'None selected';
  }

  if (mode === 'short') {
    return verbs.join(', ');
  }

  if (verbs.length === 1) {
    return `${verbs[0]} method`;
  }

  if (verbs.length <= 3) {
    return `${verbs.join(', ')} methods`;
  }

  return `${verbs.length} methods selected`;
}

/**
 * Validates if a combination of HTTP verbs is logically valid
 * Checks for reasonable verb combinations and patterns
 * @param verbs - Array of HTTP verbs to validate
 * @returns Whether the combination is valid
 */
export function isValidVerbCombination(verbs: HttpVerb[]): boolean {
  if (verbs.length === 0) {
    return true; // Empty selection is valid
  }

  if (verbs.length === 1) {
    return true; // Single verb is always valid
  }

  // Check for reasonable combinations
  const hasReadOnly = verbs.includes('GET');
  const hasWriteOperations = verbs.some(verb => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(verb));

  // GET + write operations is a common pattern
  if (hasReadOnly && hasWriteOperations) {
    return true;
  }

  // Multiple write operations without GET is also valid
  if (!hasReadOnly && hasWriteOperations) {
    return true;
  }

  // Only GET is valid
  if (hasReadOnly && !hasWriteOperations) {
    return true;
  }

  return true; // Allow all combinations by default
}

/**
 * Gets the numeric bitmask value from any verb picker value
 * Utility for converting any verb value format to bitmask
 * @param value - Verb value in any format
 * @param mode - Current selection mode
 * @returns Numeric bitmask representation
 */
export function getVerbBitmask(
  value: VerbValue | undefined,
  mode: VerbPickerMode
): number {
  if (!value) {
    return 0;
  }

  switch (mode) {
    case 'number':
      return typeof value === 'number' ? value : 0;

    case 'verb':
      return typeof value === 'string' ? (HTTP_VERB_BITMASKS[value as HttpVerb] || 0) : 0;

    case 'verb_multiple':
      return Array.isArray(value) ? convertVerbsToBitmask(value as HttpVerb[]) : 0;

    default:
      return 0;
  }
}

/**
 * Checks if a specific verb is selected in the current value
 * @param value - Current verb picker value
 * @param mode - Selection mode
 * @param targetVerb - Verb to check for selection
 * @returns Whether the target verb is selected
 */
export function isVerbSelected(
  value: VerbValue | undefined,
  mode: VerbPickerMode,
  targetVerb: HttpVerb
): boolean {
  const selectedVerbs = getSelectedVerbs(value, mode);
  return selectedVerbs.includes(targetVerb);
}

/**
 * Toggles a specific verb in the current selection
 * Provides immutable verb selection toggle functionality
 * @param value - Current verb picker value
 * @param mode - Selection mode
 * @param targetVerb - Verb to toggle
 * @returns New value with verb toggled
 */
export function toggleVerb(
  value: VerbValue | undefined,
  mode: VerbPickerMode,
  targetVerb: HttpVerb
): VerbValue | undefined {
  const selectedVerbs = getSelectedVerbs(value, mode);
  const isSelected = selectedVerbs.includes(targetVerb);

  if (mode === 'verb') {
    // Single mode: select if different, clear if same
    return isSelected ? undefined : targetVerb;
  }

  if (mode === 'verb_multiple') {
    if (isSelected) {
      return selectedVerbs.filter(verb => verb !== targetVerb);
    } else {
      return [...selectedVerbs, targetVerb];
    }
  }

  if (mode === 'number') {
    const currentBitmask = getVerbBitmask(value, mode);
    const targetBitmask = HTTP_VERB_BITMASKS[targetVerb];
    
    if (isSelected) {
      return currentBitmask & ~targetBitmask; // Remove verb from bitmask
    } else {
      return currentBitmask | targetBitmask; // Add verb to bitmask
    }
  }

  return value;
}