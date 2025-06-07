/**
 * Error message parsing utility for DreamFactory Admin Interface
 * 
 * Maps SQL error patterns and DreamFactory API errors to internationalized alert keys.
 * Converts database-specific error messages to user-friendly translation keys while
 * providing fallback error handling for unknown error types.
 * 
 * This utility maintains compatibility with existing DreamFactory Core API error
 * message formats while supporting Next.js internationalization patterns.
 * 
 * @fileoverview Error parsing utility with i18n support
 * @version 1.0.0
 */

/**
 * Error pattern configuration for mapping SQL and API errors to translation keys
 */
interface ErrorPattern {
  /** Regular expression to match the error message */
  regex: RegExp;
  /** Translation key for the internationalized error message */
  message: string;
  /** Optional error category for enhanced error handling */
  category?: 'validation' | 'database' | 'authentication' | 'authorization' | 'network' | 'system';
}

/**
 * Comprehensive error patterns for common database and API errors
 * 
 * Maintains backward compatibility with existing Angular implementation
 * while adding support for additional database error types and patterns.
 */
const errors: ErrorPattern[] = [
  // MySQL specific errors
  {
    regex: /Duplicate entry '([^']+)' for key 'user_email_unique'/,
    message: 'alerts.duplicateEmail',
    category: 'validation',
  },
  {
    regex: /Duplicate entry '([^']+)' for key '([^']+)'/,
    message: 'alerts.duplicateEntry',
    category: 'validation',
  },
  
  // PostgreSQL specific errors
  {
    regex: /duplicate key value violates unique constraint "([^"]+)"/,
    message: 'alerts.duplicateEntry',
    category: 'validation',
  },
  
  // General database connection errors
  {
    regex: /Connection refused|Connection timed out|Connection lost/i,
    message: 'alerts.connectionError',
    category: 'network',
  },
  
  // Authentication and authorization errors
  {
    regex: /Access denied|Invalid credentials|Authentication failed/i,
    message: 'alerts.accessDenied',
    category: 'authentication',
  },
  {
    regex: /Insufficient privileges|Permission denied|Unauthorized/i,
    message: 'alerts.insufficientPrivileges',
    category: 'authorization',
  },
  
  // Database constraint violations
  {
    regex: /Foreign key constraint fails|Cannot delete or update a parent row/i,
    message: 'alerts.foreignKeyConstraint',
    category: 'validation',
  },
  {
    regex: /Data too long for column|Value too long/i,
    message: 'alerts.dataTooLong',
    category: 'validation',
  },
  {
    regex: /Cannot be null|NOT NULL constraint failed/i,
    message: 'alerts.requiredField',
    category: 'validation',
  },
  
  // Network and timeout errors
  {
    regex: /Request timeout|Gateway timeout|Service unavailable/i,
    message: 'alerts.serviceTimeout',
    category: 'network',
  },
  
  // DreamFactory specific errors
  {
    regex: /Service configuration not found|Invalid service/i,
    message: 'alerts.serviceNotFound',
    category: 'system',
  },
  {
    regex: /Schema not found|Table does not exist/i,
    message: 'alerts.schemaNotFound',
    category: 'database',
  },
];

/**
 * Error parsing result containing the translated message and metadata
 */
interface ParseErrorResult {
  /** The translation key or fallback error message */
  message: string;
  /** The category of error for enhanced handling */
  category: ErrorPattern['category'] | 'unknown';
  /** Whether the error was successfully parsed to a translation key */
  isParsed: boolean;
  /** The original error string for debugging purposes */
  originalError: string | null;
}

/**
 * Parses error messages and maps them to internationalization keys
 * 
 * This function maintains backward compatibility with the existing Angular
 * implementation while providing enhanced error categorization and metadata
 * for better error handling in React Error Boundaries.
 * 
 * @param errorString - The error message string to parse
 * @returns The corresponding translation key or fallback error message
 * 
 * @example
 * ```typescript
 * // Basic usage (backward compatible)
 * const translationKey = parseError("Duplicate entry 'user@example.com' for key 'user_email_unique'");
 * console.log(translationKey); // "alerts.duplicateEmail"
 * 
 * // Enhanced usage with metadata
 * const result = parseErrorWithMetadata("Connection refused");
 * console.log(result.message); // "alerts.connectionError"
 * console.log(result.category); // "network"
 * console.log(result.isParsed); // true
 * ```
 */
export function parseError(errorString: string | null): string {
  if (!errorString) {
    return 'alert.genericError';
  }

  const error = errors.find(err => err.regex.test(errorString));
  if (error) {
    return error.message;
  }

  return errorString;
}

/**
 * Enhanced error parsing function that returns detailed metadata
 * 
 * Provides additional context for error handling in React Error Boundaries
 * and advanced error reporting scenarios. This function is compatible with
 * modern error handling patterns while maintaining the simple API contract.
 * 
 * @param errorString - The error message string to parse
 * @returns Detailed error parsing result with metadata
 * 
 * @example
 * ```typescript
 * const result = parseErrorWithMetadata("Foreign key constraint fails");
 * 
 * if (result.category === 'validation') {
 *   // Handle validation errors specifically
 *   showFieldError(result.message);
 * } else if (result.category === 'network') {
 *   // Handle network errors with retry logic
 *   triggerRetryWithBackoff();
 * }
 * ```
 */
export function parseErrorWithMetadata(errorString: string | null): ParseErrorResult {
  if (!errorString) {
    return {
      message: 'alert.genericError',
      category: 'unknown',
      isParsed: false,
      originalError: errorString,
    };
  }

  const error = errors.find(err => err.regex.test(errorString));
  
  if (error) {
    return {
      message: error.message,
      category: error.category || 'unknown',
      isParsed: true,
      originalError: errorString,
    };
  }

  return {
    message: errorString,
    category: 'unknown',
    isParsed: false,
    originalError: errorString,
  };
}

/**
 * Type guard to check if an error result indicates a validation error
 * 
 * Useful for conditional error handling in forms and validation workflows.
 * 
 * @param result - The error parsing result to check
 * @returns True if the error is a validation error
 */
export function isValidationError(result: ParseErrorResult): boolean {
  return result.category === 'validation';
}

/**
 * Type guard to check if an error result indicates a network error
 * 
 * Useful for implementing retry logic and network-specific error handling.
 * 
 * @param result - The error parsing result to check
 * @returns True if the error is a network error
 */
export function isNetworkError(result: ParseErrorResult): boolean {
  return result.category === 'network';
}

/**
 * Utility function to determine if an error should trigger a retry mechanism
 * 
 * Based on error categories and patterns, determines whether the error
 * represents a transient condition that could be resolved by retrying.
 * 
 * @param result - The error parsing result to evaluate
 * @returns True if the error condition suggests a retry might succeed
 */
export function shouldRetryError(result: ParseErrorResult): boolean {
  return result.category === 'network' || 
         (result.category === 'system' && result.message.includes('timeout'));
}

/**
 * Export types for use in other modules
 */
export type { ErrorPattern, ParseErrorResult };