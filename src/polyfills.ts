/**
 * Polyfills for Safari compatibility
 * Safari 15.3 and earlier don't support these modern JavaScript features
 */

// Polyfill for structuredClone (Safari < 15.4)
if (typeof globalThis.structuredClone === 'undefined') {
    globalThis.structuredClone = <T>(obj: T): T => {
        // For simple cases, use JSON parse/stringify
        // This doesn't handle all edge cases (like circular refs, Map, Set, etc.)
        // but works for most common use cases
        if (obj === undefined) return undefined as T;
        if (obj === null) return null as T;

        try {
            return JSON.parse(JSON.stringify(obj));
        } catch {
            // Fallback for objects that can't be JSON serialized
            return obj;
        }
    };
}

// Polyfill for Array.prototype.at (Safari < 15.4)
if (!Array.prototype.at) {
    Array.prototype.at = function <T>(this: T[], index: number): T | undefined {
        const length = this.length;
        const relativeIndex = index >= 0 ? index : length + index;
        if (relativeIndex < 0 || relativeIndex >= length) {
            return undefined;
        }
        return this[relativeIndex];
    };
}

// Polyfill for String.prototype.at (Safari < 15.4)
if (!String.prototype.at) {
    String.prototype.at = function (index: number): string | undefined {
        const length = this.length;
        const relativeIndex = index >= 0 ? index : length + index;
        if (relativeIndex < 0 || relativeIndex >= length) {
            return undefined;
        }
        return this[relativeIndex];
    };
}

// Polyfill for Object.hasOwn (Safari < 15.4)
if (!Object.hasOwn) {
    Object.hasOwn = function (obj: object, prop: PropertyKey): boolean {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    };
}

export {};
