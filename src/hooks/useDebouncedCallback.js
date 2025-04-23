import { useRef, useEffect, useCallback } from "react";

/**
 * useDebouncedCallback
 * Debounces a callback function by a given delay (default 500ms)
 *
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced callback function
 */
export default function useDebouncedCallback(callback, delay = 500) {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Keep the latest callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return memoized debounced function
  const debouncedFn = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current?.(...args);
    }, delay);
  }, [delay]);

  // Optional: clear on unmount
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return debouncedFn;
}
