import { useEffect, useCallback, type RefObject } from 'react';

/**
 * Custom hook that handles click outside detection with capture phase
 * to work properly with React Flow canvas and other event-stopping elements
 */
export function useClickOutside(
    ref: RefObject<HTMLElement>,
    handler: () => void,
    isActive = true
) {
    useEffect(() => {
        if (!isActive) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        // Use capture phase to catch events before React Flow or other libraries can stop them
        document.addEventListener('mousedown', handleClickOutside, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [ref, handler, isActive]);
}

/**
 * Specialized version of useClickOutside for edit mode inputs
 * Adds a small delay to prevent race conditions with blur events
 */
export function useEditClickOutside(
    inputRef: RefObject<HTMLElement>,
    editMode: boolean,
    onSave: () => void,
    delay = 100
) {
    const handleClickOutside = useCallback(() => {
        if (editMode) {
            // Small delay to ensure any pending state updates are processed
            setTimeout(() => {
                onSave();
            }, delay);
        }
    }, [editMode, onSave, delay]);

    useClickOutside(inputRef, handleClickOutside, editMode);
}
