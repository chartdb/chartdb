import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const randomHSLA = () =>
    `hsla(${~~(360 * Math.random())}, 70%, 72%, 0.8)`;
