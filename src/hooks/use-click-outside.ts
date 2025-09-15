import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Hook that handles clicks outside of the passed ref elements
 * @param refs - Array of refs to consider as "inside" (e.g., inputRef, buttonRef)
 * @param handler - Function to call when clicking outside
 * @param enabled - Whether the hook is active (default: true)
 * @param delay - Delay before adding listeners to avoid immediate trigger (default: 100ms)
 */
export function useClickOutside(
    refs: RefObject<HTMLElement>[],
    handler: (() => void) | null,
    enabled = true,
    delay = 100
) {
    useEffect(() => {
        if (!enabled || !handler) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Check if click is on any of the refs
            const isInsideAnyRef = refs.some((ref) => {
                if (!ref.current) return false;
                return ref.current.contains(target) || ref.current === target;
            });

            if (!isInsideAnyRef) {
                handler();
            }
        };

        // Small delay to avoid immediate trigger when entering edit mode
        const timer = setTimeout(() => {
            // Use capture phase to catch events before they might be stopped
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('click', handleClickOutside, true);
        }, delay);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [refs, handler, enabled, delay]);
}

/**
 * Simplified version for edit mode scenarios
 * Automatically saves and exits edit mode when clicking outside
 */
export function useEditClickOutside(
    inputRef: RefObject<HTMLElement>,
    editMode: boolean,
    onSave: () => void,
    delay = 100
) {
    useEffect(() => {
        if (!editMode) return;

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // Check if click is on the input
            const isInput =
                inputRef.current &&
                (inputRef.current.contains(target) ||
                    inputRef.current === target);

            // Check if click is on a button inside the same parent
            const isRelatedButton =
                target.closest('button') &&
                inputRef.current?.parentElement?.contains(target);

            if (!isInput && !isRelatedButton) {
                onSave();
            }
        };

        // Small delay to avoid immediate trigger when entering edit mode
        const timer = setTimeout(() => {
            // Use capture phase to catch events before they might be stopped
            document.addEventListener('mousedown', handleClickOutside, true);
            document.addEventListener('click', handleClickOutside, true);
        }, delay);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside, true);
            document.removeEventListener('click', handleClickOutside, true);
        };
    }, [editMode, inputRef, onSave, delay]);
}
