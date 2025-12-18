import { z } from 'zod';
import { generateId } from '../utils';
import { DatabaseType } from './database-type';
import type { DBTable } from './db-table';

export const INDEX_TYPES = [
    'btree',
    'hash',
    'gist',
    'gin',
    'spgist',
    'brin',
    // sql server
    'nonclustered',
    'clustered',
    'xml',
    'fulltext',
    'spatial',
    'hash',
    'index',
] as const;
export type IndexType = (typeof INDEX_TYPES)[number];

export interface DBIndex {
    id: string;
    name: string;
    unique: boolean;
    fieldIds: string[];
    createdAt: number;
    type?: IndexType | null;
    isPrimaryKey?: boolean | null;
}

export const dbIndexSchema: z.ZodType<DBIndex> = z.object({
    id: z.string(),
    name: z.string(),
    unique: z.boolean(),
    fieldIds: z.array(z.string()),
    createdAt: z.number(),
    type: z.enum(INDEX_TYPES).optional(),
    isPrimaryKey: z.boolean().or(z.null()).optional(),
});

export const databaseIndexTypes: { [key in DatabaseType]?: IndexType[] } = {
    [DatabaseType.POSTGRESQL]: ['btree', 'hash'],
};

export const getTablePrimaryKeyIndex = ({
    table,
}: {
    table: DBTable;
}): DBIndex | null => {
    const primaryKeyFields = table.fields.filter((f) => f.primaryKey);
    const existingPKIndex = table.indexes.find((idx) => idx.isPrimaryKey);

    if (primaryKeyFields.length === 0) {
        return null;
    }

    const pkFieldIds = primaryKeyFields.map((f) => f.id);

    if (existingPKIndex) {
        return {
            ...existingPKIndex,
            fieldIds: pkFieldIds,
        };
    } else {
        // Create new PK index for primary key(s)
        // Use empty name for auto-generated PK indexes to indicate no CONSTRAINT should be used
        const pkIndex: DBIndex = {
            id: generateId(),
            name: '',
            fieldIds: pkFieldIds,
            unique: true,
            isPrimaryKey: true,
            createdAt: Date.now(),
        };

        return pkIndex;
    }
};

export const getTableIndexesWithPrimaryKey = ({
    table,
}: {
    table: DBTable;
}): DBIndex[] => {
    const primaryKeyIndex = getTablePrimaryKeyIndex({ table });
    const indexesWithoutPKIndex = table.indexes.filter(
        (idx) => !idx.isPrimaryKey
    );
    return primaryKeyIndex
        ? [primaryKeyIndex, ...indexesWithoutPKIndex]
        : indexesWithoutPKIndex;
};
