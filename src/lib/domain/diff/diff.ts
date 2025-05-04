import { z } from 'zod';

import type { FieldDiff } from './field-diff';
import { fieldDiffSchema } from './field-diff';
import type { IndexDiff } from './index-diff';
import { indexDiffSchema } from './index-diff';
import type { RelationshipDiff } from './relationship-diff';
import { relationshipDiffSchema } from './relationship-diff';
import type { TableDiff } from './table-diff';
import { tableDiffSchema } from './table-diff';

export type ChartDBDiff = TableDiff | FieldDiff | IndexDiff | RelationshipDiff;

export const chartDBDiffSchema: z.ZodType<ChartDBDiff> = z.union([
    tableDiffSchema,
    fieldDiffSchema,
    indexDiffSchema,
    relationshipDiffSchema,
]);

export type DiffMap = Map<string, ChartDBDiff>;

export type DiffObject =
    | TableDiff['object']
    | FieldDiff['object']
    | IndexDiff['object']
    | RelationshipDiff['object'];
