import { type ClassValue, clsx } from 'clsx';
import { customAlphabet } from 'nanoid';
import { twMerge } from 'tailwind-merge';
import type { Diagram } from './domain/diagram';
import type { DBTable } from './domain/db-table';
import type { DBField } from './domain/db-field';
import type { DBIndex } from './domain/db-index';
import type { DBRelationship } from './domain/db-relationship';
import type { DBDependency } from './domain/db-dependency';
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

export const cloneDiagram = (
    diagram: Diagram,
    generateId: () => string
): Diagram => {
    const diagramId = generateId();

    const idsMap = new Map<string, string>();
    diagram.tables?.forEach((table) => {
        idsMap.set(table.id, generateId());

        table.fields.forEach((field) => {
            idsMap.set(field.id, generateId());
        });

        table.indexes.forEach((index) => {
            idsMap.set(index.id, generateId());
        });
    });
    diagram.relationships?.forEach((relationship) => {
        idsMap.set(relationship.id, generateId());
    });

    diagram.dependencies?.forEach((dependency) => {
        idsMap.set(dependency.id, generateId());
    });

    const getNewId = (id: string) => {
        const newId = idsMap.get(id);
        if (!newId) {
            throw new Error(`Id not found for ${id}`);
        }
        return newId;
    };

    const tables: DBTable[] =
        diagram.tables?.map((table) => {
            const newTable: DBTable = { ...table, id: getNewId(table.id) };
            newTable.fields = table.fields.map(
                (field): DBField => ({
                    ...field,
                    id: getNewId(field.id),
                })
            );
            newTable.indexes = table.indexes.map(
                (index): DBIndex => ({
                    ...index,
                    id: getNewId(index.id),
                })
            );

            return newTable;
        }) ?? [];

    const relationships: DBRelationship[] =
        diagram.relationships?.map(
            (relationship): DBRelationship => ({
                ...relationship,
                id: getNewId(relationship.id),
                sourceTableId: getNewId(relationship.sourceTableId),
                targetTableId: getNewId(relationship.targetTableId),
                sourceFieldId: getNewId(relationship.sourceFieldId),
                targetFieldId: getNewId(relationship.targetFieldId),
            })
        ) ?? [];

    const dependencies: DBDependency[] =
        diagram.dependencies?.map(
            (dependency): DBDependency => ({
                ...dependency,
                id: getNewId(dependency.id),
                dependentTableId: getNewId(dependency.dependentTableId),
                tableId: getNewId(dependency.tableId),
            })
        ) ?? [];

    return {
        ...diagram,
        id: diagramId,
        dependencies,
        relationships,
        tables,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};
