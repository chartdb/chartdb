import { z } from 'zod';
import type { DBTable } from '../db-table';

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

export interface TableDiffAdded<T = DBTable> {
    object: 'table';
    type: 'added';
    tableAdded: T;
}

export const createTableDiffAddedSchema = <T = DBTable>(
    tableSchema: z.ZodType<T>
): z.ZodType<TableDiffAdded<T>> => {
    return z.object({
        object: z.literal('table'),
        type: z.literal('added'),
        tableAdded: tableSchema,
    }) as z.ZodType<TableDiffAdded<T>>;
};

export type TableDiff<T = DBTable> =
    | TableDiffChanged
    | TableDiffRemoved
    | TableDiffAdded<T>;

export const createTableDiffSchema = <T = DBTable>(
    tableSchema: z.ZodType<T>
): z.ZodType<TableDiff<T>> => {
    return z.union([
        TableDiffChangedSchema,
        TableDiffRemovedSchema,
        createTableDiffAddedSchema(tableSchema),
    ]) as z.ZodType<TableDiff<T>>;
};
