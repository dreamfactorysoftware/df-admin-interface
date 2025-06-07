import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Configuration options for debouncing operations
 */
export interface DebounceOptions {
  /** Delay in milliseconds before executing the debounced operation */
  delay: number;
  /** Whether to execute immediately on first call */
  immediate?: boolean;
  /** Maximum delay in milliseconds (useful for preventing infinite delays) */
  maxDelay?: number;
  /** Whether to execute on the leading edge of the timeout */
  leading?: boolean;
  /** Whether to execute on the trailing edge of the timeout */
  trailing?: boolean;
}

/**
 * Return type for debounced callback functionality
 */
export interface DebouncedCallback<T extends (...args: any[]) => any> {
  /** The debounced function */
  (...args: Parameters<T>): void;
  /** Cancel any pending execution */
  cancel: () => void;
  /** Execute immediately, bypassing the delay */
  flush: () => void;
  /** Check if there's a pending execution */
  isPending: () => boolean;
}

/**
 * Return type for debounced value management
 */
export interface DebouncedValue<T> {
  /** The current debounced value */
  debouncedValue: T;
  /** Whether the debounced value is currently pending update */
  isPending: boolean;
  /** Cancel any pending value update */
  cancel: () => void;
  /** Immediately update the debounced value */
  flush: () => void;
}

/**
 * Hook for debouncing callback functions with advanced control options
 * 
 * @param callback - The function to debounce
 * @param options - Debounce configuration options
 * @returns Debounced callback with control methods
 * 
 * @example
 * ```tsx
 * const search = useDebouncedCallback(
 *   (query: string) => fetchSearchResults(query),
 *   { delay: 300, trailing: true }
 * );
 * 
 * // Usage in component
 * <input onChange={(e) => search(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions
): DebouncedCallback<T> {
  const { delay, immediate = false, maxDelay, leading = false, trailing = true } = options;
  
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const hasExecutedRef = useRef(false);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const executeCallback = useCallback(() => {
    if (lastArgsRef.current) {
      callbackRef.current(...lastArgsRef.current);
      hasExecutedRef.current = true;
    }
    clearTimeouts();
    lastCallTimeRef.current = null;
    lastArgsRef.current = null;
  }, [clearTimeouts]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      // Handle immediate execution on first call
      if (immediate && !hasExecutedRef.current) {
        callbackRef.current(...args);
        hasExecutedRef.current = true;
        lastCallTimeRef.current = now;
        return;
      }

      // Handle leading edge execution
      if (leading && (!lastCallTimeRef.current || now - lastCallTimeRef.current > delay)) {
        callbackRef.current(...args);
        hasExecutedRef.current = true;
      }

      // Clear existing timeout
      clearTimeouts();

      // Set up trailing edge execution if enabled
      if (trailing) {
        timeoutRef.current = setTimeout(executeCallback, delay);
      }

      // Set up max delay execution if specified
      if (maxDelay && !lastCallTimeRef.current) {
        maxTimeoutRef.current = setTimeout(executeCallback, maxDelay);
      }

      lastCallTimeRef.current = now;
    },
    [delay, immediate, leading, trailing, maxDelay, executeCallback, clearTimeouts]
  );

  const cancel = useCallback(() => {
    clearTimeouts();
    lastCallTimeRef.current = null;
    lastArgsRef.current = null;
    hasExecutedRef.current = false;
  }, [clearTimeouts]);

  const flush = useCallback(() => {
    if (lastArgsRef.current) {
      executeCallback();
    }
  }, [executeCallback]);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null || maxTimeoutRef.current !== null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Reset execution flag when options change
  useEffect(() => {
    hasExecutedRef.current = false;
  }, [immediate, leading, trailing, delay, maxDelay]);

  return Object.assign(debouncedCallback, {
    cancel,
    flush,
    isPending,
  });
}

/**
 * Hook for debouncing state values with automatic cleanup
 * 
 * @param value - The value to debounce
 * @param options - Debounce configuration options
 * @returns Object containing debounced value and control methods
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const { debouncedValue, isPending } = useDebouncedValue(searchTerm, { delay: 300 });
 * 
 *   useEffect(() => {
 *     if (debouncedValue) {
 *       fetchSearchResults(debouncedValue);
 *     }
 *   }, [debouncedValue]);
 * 
 *   return (
 *     <div>
 *       <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 *       {isPending && <span>Searching...</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDebouncedValue<T>(
  value: T,
  options: DebounceOptions
): DebouncedValue<T> {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isPending, setIsPending] = useState(false);
  const { delay, immediate = false } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const updateDebouncedValue = useCallback((newValue: T) => {
    if (mountedRef.current) {
      setDebouncedValue(newValue);
      setIsPending(false);
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      setIsPending(false);
    }
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      updateDebouncedValue(value);
    }
  }, [value, updateDebouncedValue]);

  useEffect(() => {
    // Handle immediate execution
    if (immediate && debouncedValue !== value) {
      updateDebouncedValue(value);
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set pending state if value is different
    if (debouncedValue !== value) {
      setIsPending(true);
      
      timeoutRef.current = setTimeout(() => {
        updateDebouncedValue(value);
        timeoutRef.current = null;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay, immediate, debouncedValue, updateDebouncedValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
  };
}

/**
 * Simple debounce hook for basic use cases
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [query, setQuery] = useState('');
 *   const debouncedQuery = useDebounce(query, 300);
 * 
 *   useEffect(() => {
 *     if (debouncedQuery) {
 *       performSearch(debouncedQuery);
 *     }
 *   }, [debouncedQuery]);
 * 
 *   return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const { debouncedValue } = useDebouncedValue(value, { delay });
  return debouncedValue;
}

/**
 * Hook for debouncing form validation with specific optimizations for form inputs
 * 
 * @param value - The form field value to debounce
 * @param validator - Optional validation function to run on debounced value
 * @param options - Debounce configuration options (defaults optimized for forms)
 * @returns Object with debounced value, validation result, and control methods
 * 
 * @example
 * ```tsx
 * function EmailInput() {
 *   const [email, setEmail] = useState('');
 *   const { debouncedValue, validationResult, isPending } = useFormDebounce(
 *     email,
 *     (value) => validateEmail(value),
 *     { delay: 300 }
 *   );
 * 
 *   return (
 *     <div>
 *       <input value={email} onChange={(e) => setEmail(e.target.value)} />
 *       {isPending && <span>Validating...</span>}
 *       {validationResult?.error && <span>{validationResult.error}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFormDebounce<T, R = any>(
  value: T,
  validator?: (value: T) => R | Promise<R>,
  options: Partial<DebounceOptions> = {}
): DebouncedValue<T> & { validationResult?: R } {
  const defaultOptions: DebounceOptions = {
    delay: 300, // Optimized for form inputs per 100ms requirement
    trailing: true,
    ...options,
  };

  const { debouncedValue, isPending, cancel, flush } = useDebouncedValue(value, defaultOptions);
  const [validationResult, setValidationResult] = useState<R>();
  const validationRef = useRef<Promise<R> | null>(null);

  useEffect(() => {
    if (validator && debouncedValue !== undefined) {
      const result = validator(debouncedValue);
      
      if (result instanceof Promise) {
        validationRef.current = result;
        result
          .then((resolved) => {
            // Only update if this is still the latest validation
            if (validationRef.current === result) {
              setValidationResult(resolved);
            }
          })
          .catch((error) => {
            if (validationRef.current === result) {
              setValidationResult(error);
            }
          });
      } else {
        setValidationResult(result);
      }
    }
  }, [debouncedValue, validator]);

  return {
    debouncedValue,
    isPending,
    cancel,
    flush,
    validationResult,
  };
}

// Default export for the main debounce hook
export default useDebounce;