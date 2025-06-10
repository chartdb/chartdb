import { z } from 'zod';

import type { FieldDiff } from './field-diff';
import { createFieldDiffSchema } from './field-diff';
import type { IndexDiff } from './index-diff';
import { createIndexDiffSchema } from './index-diff';
import type { RelationshipDiff } from './relationship-diff';
import { createRelationshipDiffSchema } from './relationship-diff';
import type { TableDiff } from './table-diff';
import { createTableDiffSchema } from './table-diff';
import type { DBField, DBIndex, DBRelationship, DBTable } from '..';

export type ChartDBDiff<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
> =
    | TableDiff<TTable>
    | FieldDiff<TField>
    | IndexDiff<TIndex>
    | RelationshipDiff<TRelationship>;

export const createChartDBDiffSchema = <
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
>(
    tableSchema: z.ZodType<TTable>,
    fieldSchema: z.ZodType<TField>,
    indexSchema: z.ZodType<TIndex>,
    relationshipSchema: z.ZodType<TRelationship>
): z.ZodType<ChartDBDiff<TTable, TField, TIndex, TRelationship>> => {
    return z.union([
        createTableDiffSchema(tableSchema),
        createFieldDiffSchema(fieldSchema),
        createIndexDiffSchema(indexSchema),
        createRelationshipDiffSchema(relationshipSchema),
    ]) as z.ZodType<ChartDBDiff<TTable, TField, TIndex, TRelationship>>;
};

export type DiffMap<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
> = Map<string, ChartDBDiff<TTable, TField, TIndex, TRelationship>>;

export type DiffObject<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
> =
    | TableDiff<TTable>['object']
    | FieldDiff<TField>['object']
    | IndexDiff<TIndex>['object']
    | RelationshipDiff<TRelationship>['object'];
