import { useState, useEffect, useRef } from "react";

/**
 * Delays updating the returned value until after `delay` ms have passed
 * since the last change to `value`.
 */
export default function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [value, delay]);

  return debounced;
}
