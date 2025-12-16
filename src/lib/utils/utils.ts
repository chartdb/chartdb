import { type ClassValue, clsx } from 'clsx';
import { customAlphabet } from 'nanoid';
import { twMerge } from 'tailwind-merge';
const randomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);

const UUID_KEY = 'uuid';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const emptyFn = (): any => undefined;

export const generateId = () => randomId();

export const getWorkspaceId = (): string => {
    let workspaceId = localStorage.getItem(UUID_KEY);

    if (!workspaceId) {
        workspaceId = randomId(8);
        localStorage.setItem(UUID_KEY, workspaceId);
    }

    return workspaceId;
};

export const generateDiagramId = () => {
    const prefix = getWorkspaceId();

    return `${prefix}${randomId(4)}`;
};

export const getOperatingSystem = (): 'mac' | 'windows' | 'unknown' => {
    const userAgent = window.navigator.userAgent;
    if (userAgent.includes('Mac OS X')) {
        return 'mac';
    }
    if (userAgent.includes('Windows')) {
        return 'windows';
    }
    return 'unknown';
};

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    waitFor: number
) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>): void => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
};

export const removeDups = <T>(array: T[]): T[] => {
    return [...new Set(array)];
};

export const decodeBase64ToUtf16LE = (base64: string) => {
    const binaryString = atob(base64);

    const charCodes = new Uint16Array(binaryString.length / 2);

    for (let i = 0; i < charCodes.length; i++) {
        charCodes[i] =
            binaryString.charCodeAt(i * 2) +
            (binaryString.charCodeAt(i * 2 + 1) << 8);
    }

    return String.fromCharCode(...charCodes);
};

export const decodeBase64ToUtf8 = (base64: string) => {
    const binaryString = atob(base64);

    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
};

export const waitFor = async (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);

    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return hashHex;
};

export function mergeRefs<T>(
    ...inputRefs: (React.Ref<T> | undefined)[]
): React.Ref<T> | React.RefCallback<T> {
    const filteredInputRefs = inputRefs.filter(Boolean);

    if (filteredInputRefs.length <= 1) {
        const firstRef = filteredInputRefs[0];

        return firstRef || null;
    }

    return function mergedRefs(ref) {
        for (const inputRef of filteredInputRefs) {
            if (typeof inputRef === 'function') {
                inputRef(ref);
            } else if (inputRef) {
                (inputRef as React.MutableRefObject<T | null>).current = ref;
            }
        }
    };
}

export const isStringEmpty = (str: string | undefined | null): boolean => {
    return !str || str.trim().length === 0;
};
