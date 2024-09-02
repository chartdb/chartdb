import { type ClassValue, clsx } from 'clsx';
import { customAlphabet } from 'nanoid';

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

const randomId = customAlphabet(alphabet, 7);
const prefixGenerator = customAlphabet(alphabet, 5);

const UUID_KEY = 'uuid';

import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const emptyFn = (): any => undefined;

export const generateId = (): string => {
    let prefix = localStorage.getItem(UUID_KEY);

    if (!prefix) {
        prefix = prefixGenerator();
        localStorage.setItem(UUID_KEY, prefix);
    }

    return `${prefix}${randomId()}`;
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
