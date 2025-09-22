import { z } from 'zod';

import type { FieldDiff } from './field-diff';
import { createFieldDiffSchema } from './field-diff';
import type { IndexDiff } from './index-diff';
import { createIndexDiffSchema } from './index-diff';
import type { RelationshipDiff } from './relationship-diff';
import { createRelationshipDiffSchema } from './relationship-diff';
import type { TableDiff } from './table-diff';
import { createTableDiffSchema } from './table-diff';
import type { AreaDiff } from './area-diff';
import { createAreaDiffSchema } from './area-diff';
import type { DBField, DBIndex, DBRelationship, DBTable, Area } from '..';

export type ChartDBDiff<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
    TArea = Area,
> =
    | TableDiff<TTable>
    | FieldDiff<TField>
    | IndexDiff<TIndex>
    | RelationshipDiff<TRelationship>
    | AreaDiff<TArea>;

export const createChartDBDiffSchema = <
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
    TArea = Area,
>(
    tableSchema: z.ZodType<TTable>,
    fieldSchema: z.ZodType<TField>,
    indexSchema: z.ZodType<TIndex>,
    relationshipSchema: z.ZodType<TRelationship>,
    areaSchema: z.ZodType<TArea>
): z.ZodType<ChartDBDiff<TTable, TField, TIndex, TRelationship, TArea>> => {
    return z.union([
        createTableDiffSchema(tableSchema),
        createFieldDiffSchema(fieldSchema),
        createIndexDiffSchema(indexSchema),
        createRelationshipDiffSchema(relationshipSchema),
        createAreaDiffSchema(areaSchema),
    ]) as z.ZodType<ChartDBDiff<TTable, TField, TIndex, TRelationship, TArea>>;
};

export type DiffMap<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
    TArea = Area,
> = Map<string, ChartDBDiff<TTable, TField, TIndex, TRelationship, TArea>>;

export type DiffObject<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
    TArea = Area,
> =
    | TableDiff<TTable>['object']
    | FieldDiff<TField>['object']
    | IndexDiff<TIndex>['object']
    | RelationshipDiff<TRelationship>['object']
    | AreaDiff<TArea>['object'];

type ExtractDiffKind<T> = T extends { object: infer O; type: infer Type }
    ? T extends { attribute: infer A }
        ? { object: O; type: Type; attribute: A }
        : { object: O; type: Type }
    : never;

export type DiffKind<
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
    TArea = Area,
> = ExtractDiffKind<ChartDBDiff<TTable, TField, TIndex, TRelationship, TArea>>;

export const isDiffOfKind = <
    TTable = DBTable,
    TField = DBField,
    TIndex = DBIndex,
    TRelationship = DBRelationship,
    TArea = Area,
>(
    diff: ChartDBDiff<TTable, TField, TIndex, TRelationship, TArea>,
    kind: DiffKind<TTable, TField, TIndex, TRelationship, TArea>
): boolean => {
    if ('attribute' in kind) {
        return (
            diff.object === kind.object &&
            diff.type === kind.type &&
            diff.attribute === kind.attribute
        );
    }

    if ('attribute' in diff) {
        return false;
    }

    return diff.object === kind.object && diff.type === kind.type;
};
