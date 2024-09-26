import { type ClassValue, clsx } from 'clsx';
import { customAlphabet } from 'nanoid';
import type { DataType } from './data/data-types';
import { DatabaseType } from './domain/database-type';

export function areFieldTypesCompatible(
    type1: DataType,
    type2: DataType,
    databaseType: DatabaseType
): boolean {
    // Check for exact match first
    if (type1.id === type2.id) {
        return true;
    }

    // Define compatible types for each database type
    const compatibleTypes: { [key: string]: { [key: string]: string[] } } = {
        [DatabaseType.POSTGRESQL]: {
            serial: ['integer'],
            smallserial: ['smallint'],
            bigserial: ['bigint'],
        },
        [DatabaseType.MYSQL]: {
            int: ['integer'],
            tinyint: ['boolean'],
        },
        // Add more database-specific compatibilities as needed
    };

    // Check if the types are compatible based on the database type
    const dbCompatibleTypes = compatibleTypes[databaseType] || {};
    return (
        dbCompatibleTypes[type1.id]?.includes(type2.id) ||
        dbCompatibleTypes[type2.id]?.includes(type1.id)
    );
}

const randomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);

import { twMerge } from 'tailwind-merge';
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
