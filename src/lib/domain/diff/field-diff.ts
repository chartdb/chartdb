import { z } from 'zod';

import {
    type DataType,
    dataTypeSchema,
} from '@/lib/data/data-types/data-types';
import type { DBField } from '../db-field';
import { dbFieldSchema } from '../db-field';

export type FieldDiffAttribute =
    | 'name'
    | 'type'
    | 'primaryKey'
    | 'unique'
    | 'nullable'
    | 'comments';

export const fieldDiffAttributeSchema: z.ZodType<FieldDiffAttribute> = z.union([
    z.literal('name'),
    z.literal('type'),
    z.literal('primaryKey'),
    z.literal('unique'),
    z.literal('nullable'),
    z.literal('comments'),
]);

export interface FieldDiffAdded {
    object: 'field';
    type: 'added';
    tableId: string;
    newField: DBField;
}

export const fieldDiffAddedSchema: z.ZodType<FieldDiffAdded> = z.object({
    object: z.literal('field'),
    type: z.literal('added'),
    tableId: z.string(),
    newField: dbFieldSchema,
});

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
    oldValue: string | boolean | DataType;
    newValue: string | boolean | DataType;
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

export type FieldDiff = FieldDiffAdded | FieldDiffRemoved | FieldDiffChanged;

export const fieldDiffSchema: z.ZodType<FieldDiff> = z.union([
    fieldDiffRemovedSchema,
    fieldDiffChangedSchema,
    fieldDiffAddedSchema,
]);
