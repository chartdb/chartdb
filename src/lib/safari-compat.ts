/**
 * Safari compatibility utilities
 */

/**
 * Detect if the current browser is Safari
 */
const isSafari = (): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    const ua = navigator.userAgent;
    // Safari but not Chrome (Chrome UA also contains "Safari")
    return (
        ua.includes('Safari') &&
        !ua.includes('Chrome') &&
        !ua.includes('Chromium')
    );
};

/**
 * Test if the browser supports the regex features used by remark-gfm.
 * remark-gfm uses unicode property escapes (\p{P}) which older Safari
 * misinterprets as named capture groups, throwing "invalid group specifier name"
 */
const hasRemarkGfmRegexIssue = (): boolean => {
    try {
        // Test the pattern remark-gfm uses in transformGfmAutolinkLiterals
        new RegExp('(?<=\\p{P})a', 'u');
        return false; // Regex works fine
    } catch {
        return true; // Regex throws error
    }
};

/**
 * Returns true if remarkGfm should be disabled.
 * Only disables for Safari browsers that have the regex issue.
 */
let shouldDisableCached: boolean | null = null;

export const getIsSafari = (): boolean => {
    if (shouldDisableCached === null) {
        shouldDisableCached = isSafari() && hasRemarkGfmRegexIssue();
    }
    return shouldDisableCached;
};
