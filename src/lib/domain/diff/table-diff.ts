import { z } from 'zod';
import type { DBTable } from '../db-table';
import { dbTableSchema } from '../db-table';

export type TableDiffAttribute = keyof Pick<
    DBTable,
    'name' | 'comments' | 'color'
>;

const tableDiffAttributeSchema: z.ZodType<TableDiffAttribute> = z.union([
    z.literal('name'),
    z.literal('comments'),
    z.literal('color'),
]);

export interface TableDiffChanged {
    object: 'table';
    type: 'changed';
    tableId: string;
    attribute: TableDiffAttribute;
    oldValue?: string | null;
    newValue?: string | null;
}

export const TableDiffChangedSchema: z.ZodType<TableDiffChanged> = z.object({
    object: z.literal('table'),
    type: z.literal('changed'),
    tableId: z.string(),
    attribute: tableDiffAttributeSchema,
    oldValue: z.string().or(z.null()).optional(),
    newValue: z.string().or(z.null()).optional(),
});

export interface TableDiffRemoved {
    object: 'table';
    type: 'removed';
    tableId: string;
}

export const TableDiffRemovedSchema: z.ZodType<TableDiffRemoved> = z.object({
    object: z.literal('table'),
    type: z.literal('removed'),
    tableId: z.string(),
});

export interface TableDiffAdded {
    object: 'table';
    type: 'added';
    tableAdded: DBTable;
}

export const TableDiffAddedSchema: z.ZodType<TableDiffAdded> = z.object({
    object: z.literal('table'),
    type: z.literal('added'),
    tableAdded: dbTableSchema,
});

export type TableDiff = TableDiffChanged | TableDiffRemoved | TableDiffAdded;

export const tableDiffSchema: z.ZodType<TableDiff> = z.union([
    TableDiffChangedSchema,
    TableDiffRemovedSchema,
    TableDiffAddedSchema,
]);
