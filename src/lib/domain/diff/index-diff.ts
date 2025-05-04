import { z } from 'zod';
import type { DBIndex } from '../db-index';
import { dbIndexSchema } from '../db-index';

export interface IndexDiffAdded {
    object: 'index';
    type: 'added';
    tableId: string;
    newIndex: DBIndex;
}

export const indexDiffAddedSchema: z.ZodType<IndexDiffAdded> = z.object({
    object: z.literal('index'),
    type: z.literal('added'),
    tableId: z.string(),
    newIndex: dbIndexSchema,
});

export interface IndexDiffRemoved {
    object: 'index';
    type: 'removed';
    indexId: string;
    tableId: string;
}

export const indexDiffRemovedSchema: z.ZodType<IndexDiffRemoved> = z.object({
    object: z.literal('index'),
    type: z.literal('removed'),
    indexId: z.string(),
    tableId: z.string(),
});

export type IndexDiff = IndexDiffAdded | IndexDiffRemoved;

export const indexDiffSchema: z.ZodType<IndexDiff> = z.union([
    indexDiffAddedSchema,
    indexDiffRemovedSchema,
]);
