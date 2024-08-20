import { type ClassValue, clsx } from 'clsx';
import { customAlphabet } from 'nanoid';

const randomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);
const randonNumber = customAlphabet('1234567890', 18);

import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const convertToDecimal = (number: number) => {
    const digits = number.toString().length; // Get the number of digits
    return number / Math.pow(10, digits); // Divide the number by 10^digits
};

export const randomHSLA = () =>
    `hsla(${~~(360 * convertToDecimal(parseInt(randonNumber())))}, 70%, 72%, 0.8)`;

export const greyColor = 'hsla(0, 0%, 65%, 1)';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const emptyFn = (): any => undefined;

export const generateId = () => randomId();
