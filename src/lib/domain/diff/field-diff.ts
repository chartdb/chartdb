import { z } from 'zod';

import {
    type DataType,
    dataTypeSchema,
} from '@/lib/data/data-types/data-types';
import type { DBField } from '../db-field';

export type FieldDiffAttribute =
    | 'name'
    | 'type'
    | 'primaryKey'
    | 'unique'
    | 'nullable'
    | 'comments'
    | 'characterMaximumLength'
    | 'precision'
    | 'scale'
    | 'increment'
    | 'isArray';

export const fieldDiffAttributeSchema: z.ZodType<FieldDiffAttribute> = z.union([
    z.literal('name'),
    z.literal('type'),
    z.literal('primaryKey'),
    z.literal('unique'),
    z.literal('nullable'),
    z.literal('comments'),
]);

export interface FieldDiffAdded<T = DBField> {
    object: 'field';
    type: 'added';
    tableId: string;
    newField: T;
}

export const createFieldDiffAddedSchema = <T = DBField>(
    fieldSchema: z.ZodType<T>
): z.ZodType<FieldDiffAdded<T>> => {
    return z.object({
        object: z.literal('field'),
        type: z.literal('added'),
        tableId: z.string(),
        newField: fieldSchema,
    }) as z.ZodType<FieldDiffAdded<T>>;
};

export interface FieldDiffRemoved {
    object: 'field';
    type: 'removed';
    fieldId: string;
    tableId: string;
}

export const fieldDiffRemovedSchema: z.ZodType<FieldDiffRemoved> = z.object({
    object: z.literal('field'),
    type: z.literal('removed'),
    fieldId: z.string(),
    tableId: z.string(),
});

export interface FieldDiffChanged {
    object: 'field';
    type: 'changed';
    fieldId: string;
    tableId: string;
    attribute: FieldDiffAttribute;
    oldValue: string | boolean | DataType | number;
    newValue: string | boolean | DataType | number;
}

export const fieldDiffChangedSchema: z.ZodType<FieldDiffChanged> = z.object({
    object: z.literal('field'),
    type: z.literal('changed'),
    fieldId: z.string(),
    tableId: z.string(),
    attribute: fieldDiffAttributeSchema,
    oldValue: z.union([z.string(), z.boolean(), dataTypeSchema]),
    newValue: z.union([z.string(), z.boolean(), dataTypeSchema]),
});

export type FieldDiff<T = DBField> =
    | FieldDiffAdded<T>
    | FieldDiffRemoved
    | FieldDiffChanged;

export const createFieldDiffSchema = <T = DBField>(
    fieldSchema: z.ZodType<T>
): z.ZodType<FieldDiff<T>> => {
    return z.union([
        fieldDiffRemovedSchema,
        fieldDiffChangedSchema,
        createFieldDiffAddedSchema(fieldSchema),
    ]) as z.ZodType<FieldDiff<T>>;
};
