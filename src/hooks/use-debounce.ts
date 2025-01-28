import { useCallback, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

export const useDebounce = <T extends AnyFunction>(
    func: T,
    delay: number
): ((...args: Parameters<T>) => void) => {
    const inDebounce = useRef<NodeJS.Timeout>();

    const debounce = useCallback(
        (...args: Parameters<T>) => {
            clearTimeout(inDebounce.current);
            inDebounce.current = setTimeout(() => func(...args), delay);
        },
        [func, delay]
    );

    return debounce;
};
