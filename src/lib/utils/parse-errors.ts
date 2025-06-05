/**
 * Error message parsing utility for mapping SQL error patterns to internationalized alert keys.
 * 
 * This utility converts database and system error messages into user-friendly translation keys
 * that can be displayed through the internationalization system. It maintains compatibility
 * with existing DreamFactory Core API error message formats while supporting Next.js
 * internationalization patterns.
 * 
 * @module parse-errors
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Interface defining the structure of error pattern definitions.
 * Each error pattern contains a regular expression for matching error messages
 * and a corresponding translation key for user-friendly display.
 */
interface ErrorPattern {
  /** Regular expression to match specific error message patterns */
  regex: RegExp;
  /** Translation key for internationalized error message display */
  message: string;
  /** Optional description of what this error pattern matches */
  description?: string;
}

/**
 * Comprehensive array of error patterns with their corresponding translation keys.
 * Supports various database error types with focus on MySQL duplicate entry errors
 * and other common database constraint violations.
 * 
 * Translation keys follow the Next.js i18n pattern and are compatible with
 * React error boundary components and user notification systems.
 */
const ERROR_PATTERNS: ReadonlyArray<ErrorPattern> = [
  {
    regex: /Duplicate entry '([^']+)' for key 'user_email_unique'/i,
    message: 'alerts.duplicateEmail',
    description: 'MySQL duplicate email constraint violation'
  },
  {
    regex: /Duplicate entry '([^']+)' for key '([^']+)'/i,
    message: 'alerts.duplicateEntry',
    description: 'Generic MySQL duplicate entry constraint violation'
  },
  {
    regex: /cannot be null|null value in column/i,
    message: 'alerts.nullConstraintViolation',
    description: 'Database null constraint violation'
  },
  {
    regex: /foreign key constraint/i,
    message: 'alerts.foreignKeyConstraintViolation',
    description: 'Database foreign key constraint violation'
  },
  {
    regex: /access denied|authentication failed/i,
    message: 'alerts.authenticationError',
    description: 'Database authentication or authorization error'
  },
  {
    regex: /connection refused|unable to connect/i,
    message: 'alerts.connectionError',
    description: 'Database connection error'
  },
  {
    regex: /timeout|timed out/i,
    message: 'alerts.timeoutError',
    description: 'Database or network timeout error'
  },
  {
    regex: /table.*doesn't exist|no such table/i,
    message: 'alerts.tableNotFound',
    description: 'Database table not found error'
  },
  {
    regex: /column.*doesn't exist|no such column/i,
    message: 'alerts.columnNotFound',
    description: 'Database column not found error'
  },
  {
    regex: /syntax error|sql syntax/i,
    message: 'alerts.sqlSyntaxError',
    description: 'SQL syntax error'
  },
  {
    regex: /permission denied|insufficient privileges/i,
    message: 'alerts.permissionDenied',
    description: 'Database permission or privilege error'
  }
] as const;

/**
 * Default translation keys for various error scenarios.
 * These constants ensure consistency and provide fallback options
 * for error handling throughout the application.
 */
export const ERROR_TRANSLATION_KEYS = {
  /** Generic error fallback when no specific pattern matches */
  GENERIC_ERROR: 'alerts.genericError',
  /** Network or connectivity related errors */
  NETWORK_ERROR: 'alerts.networkError',
  /** Server-side errors (5xx status codes) */
  SERVER_ERROR: 'alerts.serverError',
  /** Client-side validation errors (4xx status codes) */
  VALIDATION_ERROR: 'alerts.validationError',
  /** Unknown or unexpected errors */
  UNKNOWN_ERROR: 'alerts.unknownError'
} as const;

/**
 * Options for configuring error parsing behavior.
 * Allows customization of fallback strategies and error handling patterns.
 */
export interface ParseErrorOptions {
  /** Whether to return the original error message if no pattern matches */
  returnOriginalOnNoMatch?: boolean;
  /** Custom fallback translation key to use instead of the default */
  customFallbackKey?: string;
  /** Whether to log unmatched errors to console for debugging */
  logUnmatchedErrors?: boolean;
  /** Context information for better error reporting */
  context?: {
    component?: string;
    operation?: string;
    userId?: string;
  };
}

/**
 * Result interface for the error parsing operation.
 * Provides both the translation key and metadata about the parsing process.
 */
export interface ParseErrorResult {
  /** The translation key to use for displaying the error */
  translationKey: string;
  /** Whether the error was matched to a known pattern */
  matched: boolean;
  /** The original error message that was parsed */
  originalError: string | null;
  /** Additional context or extracted information from the error */
  extractedData?: Record<string, unknown>;
}

/**
 * Parses error messages and maps them to appropriate internationalization keys.
 * 
 * This function analyzes error strings (typically from SQL databases or API responses)
 * and returns corresponding translation keys that can be used with Next.js i18n system
 * for user-friendly error display. It maintains backward compatibility with existing
 * DreamFactory Core API error formats while supporting React error boundary patterns.
 * 
 * @param errorString - The error message to parse. Can be null or undefined.
 * @param options - Optional configuration for parsing behavior.
 * @returns Translation key string for internationalized error display.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const translationKey = parseError("Duplicate entry 'user@example.com' for key 'user_email_unique'");
 * // Returns: 'alerts.duplicateEmail'
 * 
 * // With custom options
 * const translationKey = parseError(
 *   "Unknown error occurred",
 *   { 
 *     returnOriginalOnNoMatch: false,
 *     customFallbackKey: 'errors.custom.unknown'
 *   }
 * );
 * // Returns: 'errors.custom.unknown'
 * 
 * // For React error boundary usage
 * const handleError = (error: Error) => {
 *   const translationKey = parseError(error.message, {
 *     context: { component: 'DatabaseConnectionForm', operation: 'create' }
 *   });
 *   setErrorMessage(t(translationKey));
 * };
 * ```
 * 
 * @throws {TypeError} If the error string is not a string type when provided.
 */
export function parseError(
  errorString: string | null | undefined,
  options: ParseErrorOptions = {}
): string {
  // Handle null, undefined, or empty error strings
  if (!errorString || typeof errorString !== 'string') {
    return options.customFallbackKey || ERROR_TRANSLATION_KEYS.GENERIC_ERROR;
  }

  // Normalize the error string for consistent pattern matching
  const normalizedError = errorString.trim();
  
  // Attempt to match against known error patterns
  const matchedPattern = ERROR_PATTERNS.find(pattern => 
    pattern.regex.test(normalizedError)
  );

  if (matchedPattern) {
    return matchedPattern.message;
  }

  // Handle unmatched errors based on options
  if (options.logUnmatchedErrors) {
    console.warn('[parseError] Unmatched error pattern:', {
      error: normalizedError,
      context: options.context,
      timestamp: new Date().toISOString()
    });
  }

  // Return original error if configured to do so, otherwise use fallback
  if (options.returnOriginalOnNoMatch) {
    return normalizedError;
  }

  return options.customFallbackKey || ERROR_TRANSLATION_KEYS.GENERIC_ERROR;
}

/**
 * Enhanced error parsing function that returns detailed parsing results.
 * 
 * This function provides comprehensive information about the error parsing process,
 * including whether a pattern was matched, any extracted data from the error message,
 * and the original error for debugging purposes. Useful for advanced error handling
 * scenarios and error reporting systems.
 * 
 * @param errorString - The error message to parse.
 * @param options - Optional configuration for parsing behavior.
 * @returns Detailed parsing result with translation key and metadata.
 * 
 * @example
 * ```typescript
 * const result = parseErrorDetailed(
 *   "Duplicate entry 'admin@example.com' for key 'user_email_unique'"
 * );
 * // Returns: {
 * //   translationKey: 'alerts.duplicateEmail',
 * //   matched: true,
 * //   originalError: "Duplicate entry 'admin@example.com' for key 'user_email_unique'",
 * //   extractedData: { email: 'admin@example.com', constraint: 'user_email_unique' }
 * // }
 * ```
 */
export function parseErrorDetailed(
  errorString: string | null | undefined,
  options: ParseErrorOptions = {}
): ParseErrorResult {
  const result: ParseErrorResult = {
    translationKey: '',
    matched: false,
    originalError: errorString || null
  };

  // Handle null, undefined, or empty error strings
  if (!errorString || typeof errorString !== 'string') {
    result.translationKey = options.customFallbackKey || ERROR_TRANSLATION_KEYS.GENERIC_ERROR;
    return result;
  }

  const normalizedError = errorString.trim();
  
  // Attempt to match against known error patterns and extract data
  for (const pattern of ERROR_PATTERNS) {
    const match = pattern.regex.exec(normalizedError);
    if (match) {
      result.translationKey = pattern.message;
      result.matched = true;
      
      // Extract useful data from the regex match groups
      if (match.length > 1) {
        result.extractedData = {};
        
        // For duplicate entry errors, extract the value and constraint
        if (pattern.message === 'alerts.duplicateEmail' || pattern.message === 'alerts.duplicateEntry') {
          result.extractedData.value = match[1];
          if (match[2]) {
            result.extractedData.constraint = match[2];
          }
        }
      }
      
      return result;
    }
  }

  // Handle unmatched errors
  if (options.logUnmatchedErrors) {
    console.warn('[parseErrorDetailed] Unmatched error pattern:', {
      error: normalizedError,
      context: options.context,
      timestamp: new Date().toISOString()
    });
  }

  if (options.returnOriginalOnNoMatch) {
    result.translationKey = normalizedError;
  } else {
    result.translationKey = options.customFallbackKey || ERROR_TRANSLATION_KEYS.GENERIC_ERROR;
  }

  return result;
}

/**
 * Validates whether a given string is a valid translation key pattern.
 * 
 * This utility function checks if a string follows the expected translation key
 * format used by the application's internationalization system. Useful for
 * validating error parsing results and ensuring proper integration with i18n.
 * 
 * @param key - The string to validate as a translation key.
 * @returns True if the string is a valid translation key pattern.
 * 
 * @example
 * ```typescript
 * isValidTranslationKey('alerts.duplicateEmail'); // true
 * isValidTranslationKey('invalid-key'); // false
 * isValidTranslationKey('errors.database.connection'); // true
 * ```
 */
export function isValidTranslationKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Translation keys should follow the pattern: namespace.category.specific
  // Examples: alerts.duplicateEmail, errors.database.connection, common.actions.save
  const translationKeyPattern = /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/;
  
  return translationKeyPattern.test(key);
}

/**
 * Error boundary helper function for React components.
 * 
 * This function is specifically designed to work with React Error Boundaries,
 * providing consistent error message translation and optional error reporting.
 * It handles both JavaScript errors and API errors in a unified way.
 * 
 * @param error - The error object from React Error Boundary.
 * @param errorInfo - Additional error information from React.
 * @param options - Optional configuration including error reporting callback.
 * @returns Translation key for error display.
 * 
 * @example
 * ```typescript
 * // In a React Error Boundary component
 * class ErrorBoundary extends Component {
 *   componentDidCatch(error: Error, errorInfo: ErrorInfo) {
 *     const translationKey = handleErrorBoundaryError(error, errorInfo, {
 *       context: { component: 'DatabaseServiceForm' },
 *       onError: (err, key) => {
 *         // Report to error tracking service
 *         errorReportingService.report(err, { translationKey: key });
 *       }
 *     });
 *     
 *     this.setState({ 
 *       hasError: true, 
 *       errorTranslationKey: translationKey 
 *     });
 *   }
 * }
 * ```
 */
export function handleErrorBoundaryError(
  error: Error,
  errorInfo?: { componentStack?: string },
  options: ParseErrorOptions & { 
    onError?: (error: Error, translationKey: string) => void 
  } = {}
): string {
  // Extract error message from Error object
  const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
  
  // Parse the error message to get translation key
  const translationKey = parseError(errorMessage, {
    ...options,
    context: {
      ...options.context,
      errorType: error.name,
      componentStack: errorInfo?.componentStack
    }
  });

  // Optional error reporting callback
  if (options.onError) {
    try {
      options.onError(error, translationKey);
    } catch (reportingError) {
      console.error('[handleErrorBoundaryError] Error reporting failed:', reportingError);
    }
  }

  return translationKey;
}

/**
 * Type guard to check if an error is a database-related error.
 * 
 * @param error - The error string to check.
 * @returns True if the error appears to be database-related.
 */
export function isDatabaseError(error: string): boolean {
  if (!error || typeof error !== 'string') {
    return false;
  }

  const databaseErrorPatterns = [
    /duplicate entry/i,
    /foreign key constraint/i,
    /table.*doesn't exist/i,
    /column.*doesn't exist/i,
    /sql syntax/i,
    /connection refused/i,
    /access denied/i,
    /null value in column/i
  ];

  return databaseErrorPatterns.some(pattern => pattern.test(error));
}

/**
 * Type guard to check if an error is a network-related error.
 * 
 * @param error - The error string to check.
 * @returns True if the error appears to be network-related.
 */
export function isNetworkError(error: string): boolean {
  if (!error || typeof error !== 'string') {
    return false;
  }

  const networkErrorPatterns = [
    /network error/i,
    /connection refused/i,
    /timeout/i,
    /timed out/i,
    /unable to connect/i,
    /connection failed/i,
    /no internet/i,
    /offline/i
  ];

  return networkErrorPatterns.some(pattern => pattern.test(error));
}

// Re-export types for external usage
export type { ErrorPattern, ParseErrorOptions, ParseErrorResult };

// Default export for convenient importing
export default {
  parseError,
  parseErrorDetailed,
  handleErrorBoundaryError,
  isValidTranslationKey,
  isDatabaseError,
  isNetworkError,
  ERROR_TRANSLATION_KEYS
};