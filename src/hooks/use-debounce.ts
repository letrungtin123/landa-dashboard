import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value by the specified delay.
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 2000ms)
 */
export function useDebounce<T>(value: T, delay = 1000): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
