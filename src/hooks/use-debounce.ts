import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Configuration options for debouncing behavior
 */
export interface DebounceOptions {
  /** Delay in milliseconds before executing the debounced action */
  delay?: number;
  /** Execute immediately on the first call (leading edge) */
  leading?: boolean;
  /** Execute on the trailing edge (default: true) */
  trailing?: boolean;
  /** Maximum time to wait before forcing execution */
  maxWait?: number;
}

/**
 * Return type for debounced callback functionality
 */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  /** The debounced function */
  (...args: Parameters<T>): void;
  /** Cancel any pending execution */
  cancel: () => void;
  /** Immediately execute the function and cancel any pending execution */
  flush: () => void;
  /** Check if there's a pending execution */
  isPending: () => boolean;
}

/**
 * Debounced value hook that delays state updates for performance optimization.
 * Essential for search inputs, form validation, and preventing excessive API calls.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState('');
 *   const debouncedSearchTerm = useDebounceValue(searchTerm, 500);
 *   
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       // Perform search API call
 *       searchAPI(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *   
 *   return (
 *     <input 
 *       value={searchTerm}
 *       onChange={(e) => setSearchTerm(e.target.value)}
 *       placeholder="Search..."
 *     />
 *   );
 * }
 * ```
 */
export function useDebounceValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedValue;
}

/**
 * Advanced debounced callback hook with comprehensive control options.
 * Provides delayed function execution with cancellation, immediate execution,
 * and advanced timing controls for complex use cases.
 * 
 * @param callback - The function to debounce
 * @param options - Debouncing configuration options
 * @returns Debounced function with control methods
 * 
 * @example
 * ```tsx
 * function AutoSaveForm() {
 *   const [formData, setFormData] = useState({});
 *   
 *   const debouncedSave = useDebounceCallback(
 *     (data) => saveFormAPI(data),
 *     { delay: 1000, maxWait: 5000 }
 *   );
 *   
 *   const handleInputChange = (field, value) => {
 *     const newData = { ...formData, [field]: value };
 *     setFormData(newData);
 *     debouncedSave(newData);
 *   };
 *   
 *   return (
 *     <form>
 *       <input 
 *         onChange={(e) => handleInputChange('name', e.target.value)}
 *       />
 *       <button type="button" onClick={debouncedSave.flush}>
 *         Save Now
 *       </button>
 *       <button type="button" onClick={debouncedSave.cancel}>
 *         Cancel Save
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const {
    delay = 300,
    leading = false,
    trailing = true,
    maxWait
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T>>();
  const resultRef = useRef<ReturnType<T>>();

  // Store the latest callback to avoid stale closure issues
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

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

  const invokeFunc = useCallback(() => {
    const args = argsRef.current as Parameters<T>;
    const func = callbackRef.current;
    
    lastInvokeTimeRef.current = Date.now();
    resultRef.current = func(...args);
    return resultRef.current;
  }, []);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - lastCallTimeRef.current;
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    // Either this is the first call, activity has stopped, or maxWait has elapsed
    return (
      lastCallTimeRef.current === 0 ||
      timeSinceLastCall >= delay ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }, [delay, maxWait]);

  const trailingEdge = useCallback(() => {
    timeoutRef.current = null;
    
    // Only invoke if we have arguments (means trailing edge is enabled)
    if (trailing && argsRef.current) {
      return invokeFunc();
    }
    
    argsRef.current = undefined;
    return resultRef.current;
  }, [trailing, invokeFunc]);

  const timerExpired = useCallback(() => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge();
    }
    
    // Restart the timer with remaining time
    const timeSinceLastCall = time - lastCallTimeRef.current;
    const timeRemaining = delay - timeSinceLastCall;
    timeoutRef.current = setTimeout(timerExpired, timeRemaining);
  }, [shouldInvoke, trailingEdge, delay]);

  const leadingEdge = useCallback((time: number) => {
    // Reset any `maxWait` timer
    lastInvokeTimeRef.current = time;
    
    // Start the timer for the trailing edge
    timeoutRef.current = setTimeout(timerExpired, delay);
    
    // Invoke the leading edge
    return leading ? invokeFunc() : resultRef.current;
  }, [leading, invokeFunc, timerExpired, delay]);

  const debouncedFunction = useCallback((...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastCallTimeRef.current = time;
    argsRef.current = args;

    if (isInvoking) {
      if (timeoutRef.current === null) {
        return leadingEdge(lastCallTimeRef.current);
      }
      
      if (maxWait !== undefined) {
        // Handle maxWait
        timeoutRef.current = setTimeout(timerExpired, delay);
        return leading ? invokeFunc() : resultRef.current;
      }
    }
    
    if (timeoutRef.current === null) {
      timeoutRef.current = setTimeout(timerExpired, delay);
    }
    
    return resultRef.current;
  }, [shouldInvoke, leadingEdge, timerExpired, delay, maxWait, leading, invokeFunc]);

  const cancel = useCallback(() => {
    clearTimeouts();
    lastInvokeTimeRef.current = 0;
    lastCallTimeRef.current = 0;
    argsRef.current = undefined;
  }, [clearTimeouts]);

  const flush = useCallback(() => {
    if (timeoutRef.current === null) {
      return resultRef.current;
    }
    
    clearTimeouts();
    return trailingEdge();
  }, [clearTimeouts, trailingEdge]);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  // Setup maxWait timer if specified
  useEffect(() => {
    if (maxWait !== undefined && argsRef.current && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          trailingEdge();
        }
      }, maxWait);
    }
  }, [maxWait, trailingEdge]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Attach control methods to the debounced function
  const debouncedWithControls = debouncedFunction as DebouncedFunction<T>;
  debouncedWithControls.cancel = cancel;
  debouncedWithControls.flush = flush;
  debouncedWithControls.isPending = isPending;

  return debouncedWithControls;
}

/**
 * Simple debouncing hook that combines value debouncing with callback execution.
 * Ideal for form validation and search scenarios where you need both debounced
 * state and debounced action execution.
 * 
 * @param value - The value to debounce
 * @param callback - Function to call with the debounced value
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Object with debounced value and control methods
 * 
 * @example
 * ```tsx
 * function ValidatedInput() {
 *   const [inputValue, setInputValue] = useState('');
 *   const [errors, setErrors] = useState([]);
 *   
 *   const { debouncedValue, cancel, flush } = useDebounce(
 *     inputValue,
 *     (value) => validateInput(value).then(setErrors),
 *     500
 *   );
 *   
 *   return (
 *     <div>
 *       <input 
 *         value={inputValue}
 *         onChange={(e) => setInputValue(e.target.value)}
 *       />
 *       {errors.map(error => <span key={error}>{error}</span>)}
 *       <button onClick={flush}>Validate Now</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDebounce<T>(
  value: T,
  callback?: (value: T) => void,
  delay: number = 300
) {
  const debouncedValue = useDebounceValue(value, delay);
  
  const debouncedCallback = useDebounceCallback(
    (val: T) => callback?.(val),
    { delay }
  );

  // Execute callback when debounced value changes
  useEffect(() => {
    if (callback) {
      callback(debouncedValue);
    }
  }, [debouncedValue, callback]);

  return {
    debouncedValue,
    cancel: debouncedCallback.cancel,
    flush: debouncedCallback.flush,
    isPending: debouncedCallback.isPending
  };
}

/**
 * Debouncing hook specifically optimized for search functionality.
 * Includes additional features like minimum query length and empty query handling.
 * 
 * @param searchTerm - The search term to debounce
 * @param onSearch - Function to call with the debounced search term
 * @param options - Search-specific debouncing options
 * @returns Object with debounced search term and control methods
 * 
 * @example
 * ```tsx
 * function SearchComponent() {
 *   const [query, setQuery] = useState('');
 *   const [results, setResults] = useState([]);
 *   const [isSearching, setIsSearching] = useState(false);
 *   
 *   const { debouncedValue: debouncedQuery, isPending } = useSearchDebounce(
 *     query,
 *     async (searchTerm) => {
 *       if (searchTerm.trim()) {
 *         setIsSearching(true);
 *         try {
 *           const searchResults = await searchAPI(searchTerm);
 *           setResults(searchResults);
 *         } finally {
 *           setIsSearching(false);
 *         }
 *       } else {
 *         setResults([]);
 *       }
 *     },
 *     { delay: 400, minLength: 2 }
 *   );
 *   
 *   return (
 *     <div>
 *       <input 
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search..."
 *       />
 *       {(isSearching || isPending()) && <span>Searching...</span>}
 *       {results.map(result => <div key={result.id}>{result.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSearchDebounce(
  searchTerm: string,
  onSearch: (term: string) => void,
  options: {
    delay?: number;
    minLength?: number;
    trimWhitespace?: boolean;
  } = {}
) {
  const { delay = 400, minLength = 1, trimWhitespace = true } = options;
  
  const processedTerm = trimWhitespace ? searchTerm.trim() : searchTerm;
  const shouldSearch = processedTerm.length >= minLength;
  
  const debouncedCallback = useDebounceCallback(
    (term: string) => {
      if (shouldSearch) {
        onSearch(term);
      }
    },
    { delay }
  );
  
  const debouncedValue = useDebounceValue(processedTerm, delay);
  
  // Execute search when debounced value changes and meets criteria
  useEffect(() => {
    if (shouldSearch || processedTerm === '') {
      debouncedCallback(processedTerm);
    }
  }, [debouncedValue, shouldSearch, processedTerm, debouncedCallback]);
  
  return {
    debouncedValue,
    cancel: debouncedCallback.cancel,
    flush: debouncedCallback.flush,
    isPending: debouncedCallback.isPending,
    shouldSearch
  };
}

// Export default hooks for convenience
export default {
  useDebounceValue,
  useDebounceCallback,
  useDebounce,
  useSearchDebounce
};