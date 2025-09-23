import { z } from 'zod';
import type { Area } from '../area';

export type AreaDiffAttribute = keyof Pick<
    Area,
    'name' | 'color' | 'x' | 'y' | 'width' | 'height'
>;

const areaDiffAttributeSchema: z.ZodType<AreaDiffAttribute> = z.union([
    z.literal('name'),
    z.literal('color'),
    z.literal('x'),
    z.literal('y'),
    z.literal('width'),
    z.literal('height'),
]);

export interface AreaDiffChanged {
    object: 'area';
    type: 'changed';
    areaId: string;
    attribute: AreaDiffAttribute;
    oldValue?: string | number | null;
    newValue?: string | number | null;
}

export const AreaDiffChangedSchema: z.ZodType<AreaDiffChanged> = z.object({
    object: z.literal('area'),
    type: z.literal('changed'),
    areaId: z.string(),
    attribute: areaDiffAttributeSchema,
    oldValue: z.union([z.string(), z.number(), z.null()]).optional(),
    newValue: z.union([z.string(), z.number(), z.null()]).optional(),
});

export interface AreaDiffRemoved {
    object: 'area';
    type: 'removed';
    areaId: string;
}

export const AreaDiffRemovedSchema: z.ZodType<AreaDiffRemoved> = z.object({
    object: z.literal('area'),
    type: z.literal('removed'),
    areaId: z.string(),
});

export interface AreaDiffAdded<T = Area> {
    object: 'area';
    type: 'added';
    areaAdded: T;
}

export const createAreaDiffAddedSchema = <T = Area>(
    areaSchema: z.ZodType<T>
): z.ZodType<AreaDiffAdded<T>> => {
    return z.object({
        object: z.literal('area'),
        type: z.literal('added'),
        areaAdded: areaSchema,
    }) as z.ZodType<AreaDiffAdded<T>>;
};

export type AreaDiff<T = Area> =
    | AreaDiffChanged
    | AreaDiffRemoved
    | AreaDiffAdded<T>;

export const createAreaDiffSchema = <T = Area>(
    areaSchema: z.ZodType<T>
): z.ZodType<AreaDiff<T>> => {
    return z.union([
        AreaDiffChangedSchema,
        AreaDiffRemovedSchema,
        createAreaDiffAddedSchema(areaSchema),
    ]) as z.ZodType<AreaDiff<T>>;
};
