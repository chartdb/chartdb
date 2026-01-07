/**
 * Safari compatibility utilities
 */

/**
 * Detect if the current browser is Safari
 * Safari has issues with modern regex features (lookbehind) used by remark-gfm
 */
export const isSafari = (): boolean => {
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
 * Cached result to avoid repeated UA checks
 */
let isSafariCached: boolean | null = null;

export const getIsSafari = (): boolean => {
    if (isSafariCached === null) {
        isSafariCached = isSafari();
    }
    return isSafariCached;
};
