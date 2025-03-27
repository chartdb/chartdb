import { z } from 'zod';
import type { AggregatedIndexInfo } from '../data/import-metadata/metadata-types/index-info';
import { generateId } from '../utils';
import type { DBField } from './db-field';

export interface DBIndex {
    id: string;
    name: string;
    unique: boolean;
    fieldIds: string[];
    createdAt: number;
}

export const dbIndexSchema: z.ZodType<DBIndex> = z.object({
    id: z.string(),
    name: z.string(),
    unique: z.boolean(),
    fieldIds: z.array(z.string()),
    createdAt: z.number(),
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
        })
    );
