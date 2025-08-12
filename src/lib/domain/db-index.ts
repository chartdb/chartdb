import { z } from 'zod';
import type { AggregatedIndexInfo } from '../data/import-metadata/metadata-types/index-info';
import { generateId } from '../utils';
import type { DBField } from './db-field';
import { DatabaseType } from './database-type';

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
}

export const dbIndexSchema: z.ZodType<DBIndex> = z.object({
    id: z.string(),
    name: z.string(),
    unique: z.boolean(),
    fieldIds: z.array(z.string()),
    createdAt: z.number(),
    type: z.enum(INDEX_TYPES).optional(),
});

export const createIndexesFromMetadata = ({
    aggregatedIndexes,
    fields,
}: {
    aggregatedIndexes: AggregatedIndexInfo[];
    fields: DBField[];
}): DBIndex[] =>
    aggregatedIndexes.map(
        (idx): DBIndex => ({
            id: generateId(),
            name: idx.name,
            unique: Boolean(idx.unique),
            fieldIds: idx.columns
                .sort((a, b) => a.position - b.position)
                .map((c) => fields.find((f) => f.name === c.name)?.id)
                .filter((id): id is string => id !== undefined),
            createdAt: Date.now(),
            type: idx.index_type?.toLowerCase() as IndexType,
        })
    );

export const databaseIndexTypes: { [key in DatabaseType]?: IndexType[] } = {
    [DatabaseType.POSTGRESQL]: ['btree', 'hash'],
};
