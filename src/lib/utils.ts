import { type ClassValue, clsx } from 'clsx';
import { customAlphabet } from 'nanoid';

const randomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);

import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const emptyFn = (): any => undefined;

export const generateId = () => randomId();

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
