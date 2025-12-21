import { z } from 'zod';
import type { DBIndex, IndexType } from '../db-index';

export type IndexDiffAttribute = 'name' | 'unique' | 'fieldIds' | 'type';

export const indexDiffAttributeSchema: z.ZodType<IndexDiffAttribute> = z.union([
    z.literal('name'),
    z.literal('unique'),
    z.literal('fieldIds'),
    z.literal('type'),
]);

export interface IndexDiffAdded<T = DBIndex> {
    object: 'index';
    type: 'added';
    tableId: string;
    newIndex: T;
}

export const createIndexDiffAddedSchema = <T = DBIndex>(
    indexSchema: z.ZodType<T>
): z.ZodType<IndexDiffAdded<T>> => {
    return z.object({
        object: z.literal('index'),
        type: z.literal('added'),
        tableId: z.string(),
        newIndex: indexSchema,
    }) as z.ZodType<IndexDiffAdded<T>>;
};

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

export interface IndexDiffChanged {
    object: 'index';
    type: 'changed';
    indexId: string;
    tableId: string;
    attribute: IndexDiffAttribute;
    oldValue?: string | boolean | string[] | IndexType | null;
    newValue?: string | boolean | string[] | IndexType | null;
}

export const indexDiffChangedSchema: z.ZodType<IndexDiffChanged> = z.object({
    object: z.literal('index'),
    type: z.literal('changed'),
    indexId: z.string(),
    tableId: z.string(),
    attribute: indexDiffAttributeSchema,
    oldValue: z
        .union([z.string(), z.boolean(), z.array(z.string()), z.null()])
        .optional(),
    newValue: z
        .union([z.string(), z.boolean(), z.array(z.string()), z.null()])
        .optional(),
});

export type IndexDiff<T = DBIndex> =
    | IndexDiffAdded<T>
    | IndexDiffRemoved
    | IndexDiffChanged;

export const createIndexDiffSchema = <T = DBIndex>(
    indexSchema: z.ZodType<T>
): z.ZodType<IndexDiff<T>> => {
    return z.union([
        createIndexDiffAddedSchema(indexSchema),
        indexDiffRemovedSchema,
        indexDiffChangedSchema,
    ]) as z.ZodType<IndexDiff<T>>;
};
