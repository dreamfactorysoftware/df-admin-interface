'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values with configurable delay and cleanup
 * Optimizes performance by reducing the frequency of expensive operations
 * like API calls, search queries, and form validation
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout to update the debounced value after the delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Enhanced debounce hook with callback function support
 * Useful for triggering side effects like API calls after debounce delay
 */
export function useDebouncedCallback<TArgs extends any[]>(
  callback: (...args: TArgs) => void,
  delay: number,
  dependencies: React.DependencyList = []
): {
  /** The debounced callback function */
  debouncedCallback: (...args: TArgs) => void;
  /** Cancel any pending debounced callback */
  cancel: () => void;
  /** Execute the callback immediately, canceling any pending calls */
  flush: (...args: TArgs) => void;
  /** Whether there is a pending debounced callback */
  isPending: () => boolean;
} {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const argsRef = useRef<TArgs>();

  // Update the callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...dependencies]);

  // Cancel pending callback on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const flush = useCallback((...args: TArgs) => {
    cancel();
    callbackRef.current(...args);
  }, [cancel]);

  const isPending = useCallback(() => {
    return timeoutRef.current !== undefined;
  }, []);

  const debouncedCallback = useCallback((...args: TArgs) => {
    argsRef.current = args;
    
    // Cancel any existing timeout
    cancel();
    
    // Set up new timeout
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
      callbackRef.current(...args);
    }, delay);
  }, [cancel, delay]);

  return {
    debouncedCallback,
    cancel,
    flush,
    isPending
  };
}

/**
 * Debounced state hook that combines useState with debouncing
 * Returns both immediate and debounced values for flexible usage
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): {
  /** Current immediate value */
  value: T;
  /** Debounced value */
  debouncedValue: T;
  /** Set the immediate value */
  setValue: React.Dispatch<React.SetStateAction<T>>;
  /** Whether the debounced value is pending update */
  isPending: boolean;
} {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);
  const isPending = value !== debouncedValue;

  return {
    value,
    debouncedValue,
    setValue,
    isPending
  };
}

/**
 * Debounced effect hook that delays effect execution until value stabilizes
 * Useful for expensive operations that should only run after user stops interacting
 */
export function useDebouncedEffect(
  effect: React.EffectCallback,
  dependencies: React.DependencyList,
  delay: number
): void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up new timeout
    timeoutRef.current = setTimeout(() => {
      const cleanup = effect();
      
      // Store cleanup function for later execution
      if (cleanup) {
        timeoutRef.current = setTimeout(cleanup, 0) as any;
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [...dependencies, delay]);
}

/**
 * Advanced debounce hook with leading and trailing edge options
 * Provides fine-grained control over when the debounced function executes
 */
export function useAdvancedDebounce<TArgs extends any[]>(
  callback: (...args: TArgs) => void,
  delay: number,
  options: {
    /** Execute on the leading edge of the timeout */
    leading?: boolean;
    /** Execute on the trailing edge of the timeout (default: true) */
    trailing?: boolean;
    /** Maximum time callback is allowed to be delayed */
    maxWait?: number;
  } = {}
): {
  /** The debounced callback function */
  debouncedCallback: (...args: TArgs) => void;
  /** Cancel any pending debounced callback */
  cancel: () => void;
  /** Execute the callback immediately */
  flush: (...args: TArgs) => void;
} {
  const { leading = false, trailing = true, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  const lastCallTimeRef = useRef<number>();
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<TArgs>();

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, []);

  const invokeCallback = useCallback(() => {
    const args = argsRef.current;
    if (args) {
      lastInvokeTimeRef.current = Date.now();
      callbackRef.current(...args);
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = undefined;
    }
    lastCallTimeRef.current = undefined;
  }, []);

  const flush = useCallback((...args: TArgs) => {
    argsRef.current = args;
    cancel();
    invokeCallback();
  }, [cancel, invokeCallback]);

  const debouncedCallback = useCallback((...args: TArgs) => {
    const now = Date.now();
    const isInvoking = lastCallTimeRef.current === undefined;
    
    argsRef.current = args;
    lastCallTimeRef.current = now;

    // Leading edge execution
    if (isInvoking && leading) {
      invokeCallback();
    }

    // Cancel existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up trailing execution
    if (trailing) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined;
        if (lastCallTimeRef.current) {
          invokeCallback();
        }
      }, delay);
    }

    // Handle maxWait
    if (maxWait !== undefined && !maxTimeoutRef.current && !isInvoking) {
      maxTimeoutRef.current = setTimeout(() => {
        maxTimeoutRef.current = undefined;
        if (lastCallTimeRef.current) {
          invokeCallback();
        }
      }, maxWait);
    }
  }, [delay, leading, trailing, maxWait, invokeCallback]);

  return {
    debouncedCallback,
    cancel,
    flush
  };
}

/**
 * Hook for debouncing search functionality specifically
 * Optimized for search use cases with sensible defaults
 */
export function useSearchDebounce(
  searchFunction: (query: string) => void,
  delay: number = 300
): {
  /** Execute search with debouncing */
  search: (query: string) => void;
  /** Cancel pending search */
  cancel: () => void;
  /** Execute search immediately */
  searchNow: (query: string) => void;
  /** Whether a search is pending */
  isPending: () => boolean;
} {
  const { debouncedCallback, cancel, flush, isPending } = useDebouncedCallback(
    searchFunction,
    delay
  );

  return {
    search: debouncedCallback,
    cancel,
    searchNow: flush,
    isPending
  };
}

/**
 * Type definitions for the debounce hooks
 */
export interface DebounceOptions {
  /** Execute on the leading edge */
  leading?: boolean;
  /** Execute on the trailing edge */
  trailing?: boolean;
  /** Maximum delay time */
  maxWait?: number;
}

export interface DebouncedFunction<TArgs extends any[]> {
  /** The debounced function */
  (...args: TArgs): void;
  /** Cancel pending execution */
  cancel: () => void;
  /** Execute immediately */
  flush: (...args: TArgs) => void;
  /** Check if execution is pending */
  isPending?: () => boolean;
}

/**
 * Default export with all debounce utilities
 */
export default {
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useDebouncedEffect,
  useAdvancedDebounce,
  useSearchDebounce
};