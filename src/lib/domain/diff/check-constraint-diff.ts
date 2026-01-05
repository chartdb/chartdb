import { z } from 'zod';
import type { DBCheckConstraint } from '../db-check-constraint';

export type CheckConstraintDiffAttribute = 'expression';

export const checkConstraintDiffAttributeSchema: z.ZodType<CheckConstraintDiffAttribute> =
    z.literal('expression');

export interface CheckConstraintDiffAdded<T = DBCheckConstraint> {
    object: 'checkConstraint';
    type: 'added';
    tableId: string;
    newCheckConstraint: T;
}

export const createCheckConstraintDiffAddedSchema = <T = DBCheckConstraint>(
    checkConstraintSchema: z.ZodType<T>
): z.ZodType<CheckConstraintDiffAdded<T>> => {
    return z.object({
        object: z.literal('checkConstraint'),
        type: z.literal('added'),
        tableId: z.string(),
        newCheckConstraint: checkConstraintSchema,
    }) as z.ZodType<CheckConstraintDiffAdded<T>>;
};

export interface CheckConstraintDiffRemoved {
    object: 'checkConstraint';
    type: 'removed';
    checkConstraintId: string;
    tableId: string;
}

export const checkConstraintDiffRemovedSchema: z.ZodType<CheckConstraintDiffRemoved> =
    z.object({
        object: z.literal('checkConstraint'),
        type: z.literal('removed'),
        checkConstraintId: z.string(),
        tableId: z.string(),
    });

export interface CheckConstraintDiffChanged {
    object: 'checkConstraint';
    type: 'changed';
    checkConstraintId: string;
    newCheckConstraintId: string;
    tableId: string;
    attribute: CheckConstraintDiffAttribute;
    oldValue?: string | null;
    newValue?: string | null;
}

export const checkConstraintDiffChangedSchema: z.ZodType<CheckConstraintDiffChanged> =
    z.object({
        object: z.literal('checkConstraint'),
        type: z.literal('changed'),
        checkConstraintId: z.string(),
        newCheckConstraintId: z.string(),
        tableId: z.string(),
        attribute: checkConstraintDiffAttributeSchema,
        oldValue: z.string().nullable().optional(),
        newValue: z.string().nullable().optional(),
    });

export type CheckConstraintDiff<T = DBCheckConstraint> =
    | CheckConstraintDiffAdded<T>
    | CheckConstraintDiffRemoved
    | CheckConstraintDiffChanged;

export const createCheckConstraintDiffSchema = <T = DBCheckConstraint>(
    checkConstraintSchema: z.ZodType<T>
): z.ZodType<CheckConstraintDiff<T>> => {
    return z.union([
        createCheckConstraintDiffAddedSchema(checkConstraintSchema),
        checkConstraintDiffRemovedSchema,
        checkConstraintDiffChangedSchema,
    ]) as z.ZodType<CheckConstraintDiff<T>>;
};
