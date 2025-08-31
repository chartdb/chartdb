import { useEffect, useRef, useCallback } from 'react';
import { debounce as utilsDebounce } from '@/lib/utils';

interface DebouncedFunction {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]): void;
    cancel?: () => void;
}

/**
 * A hook that returns a debounced version of the provided function.
 * The debounced function will only be called after the specified delay
 * has passed without the function being called again.
 *
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    // Use a ref to store the debounced function
    const debouncedFnRef = useRef<DebouncedFunction>();

    // Update the debounced function when dependencies change
    useEffect(() => {
        // Create the debounced function
        debouncedFnRef.current = utilsDebounce(callback, delay);

        // Clean up when component unmounts or dependencies change
        return () => {
            if (debouncedFnRef.current?.cancel) {
                debouncedFnRef.current.cancel();
            }
        };
    }, [callback, delay]);

    // Create a stable callback that uses the ref
    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        debouncedFnRef.current?.(...args);
    }, []);

    return debouncedCallback;
}
