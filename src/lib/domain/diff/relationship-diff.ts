import { z } from 'zod';
import type { Cardinality, DBRelationship } from '../db-relationship';

export type RelationshipDiffAttribute =
    | 'name'
    | 'sourceSchema'
    | 'sourceTableId'
    | 'targetSchema'
    | 'targetTableId'
    | 'sourceFieldId'
    | 'targetFieldId'
    | 'sourceCardinality'
    | 'targetCardinality';

export const relationshipDiffAttributeSchema: z.ZodType<RelationshipDiffAttribute> =
    z.union([
        z.literal('name'),
        z.literal('sourceSchema'),
        z.literal('sourceTableId'),
        z.literal('targetSchema'),
        z.literal('targetTableId'),
        z.literal('sourceFieldId'),
        z.literal('targetFieldId'),
        z.literal('sourceCardinality'),
        z.literal('targetCardinality'),
    ]);

export interface RelationshipDiffAdded<T = DBRelationship> {
    object: 'relationship';
    type: 'added';
    newRelationship: T;
}

export const createRelationshipDiffAddedSchema = <T = DBRelationship>(
    relationshipSchema: z.ZodType<T>
): z.ZodType<RelationshipDiffAdded<T>> => {
    return z.object({
        object: z.literal('relationship'),
        type: z.literal('added'),
        newRelationship: relationshipSchema,
    }) as z.ZodType<RelationshipDiffAdded<T>>;
};

export interface RelationshipDiffRemoved {
    object: 'relationship';
    type: 'removed';
    relationshipId: string;
}

export const relationshipDiffRemovedSchema: z.ZodType<RelationshipDiffRemoved> =
    z.object({
        object: z.literal('relationship'),
        type: z.literal('removed'),
        relationshipId: z.string(),
    });

export interface RelationshipDiffChanged {
    object: 'relationship';
    type: 'changed';
    relationshipId: string;
    newRelationshipId: string;
    attribute: RelationshipDiffAttribute;
    oldValue?: string | Cardinality | null;
    newValue?: string | Cardinality | null;
}

export const relationshipDiffChangedSchema: z.ZodType<RelationshipDiffChanged> =
    z.object({
        object: z.literal('relationship'),
        type: z.literal('changed'),
        relationshipId: z.string(),
        newRelationshipId: z.string(),
        attribute: relationshipDiffAttributeSchema,
        oldValue: z.union([z.string(), z.null()]).optional(),
        newValue: z.union([z.string(), z.null()]).optional(),
    });

export type RelationshipDiff<T = DBRelationship> =
    | RelationshipDiffAdded<T>
    | RelationshipDiffRemoved
    | RelationshipDiffChanged;

export const createRelationshipDiffSchema = <T = DBRelationship>(
    relationshipSchema: z.ZodType<T>
): z.ZodType<RelationshipDiff<T>> => {
    return z.union([
        createRelationshipDiffAddedSchema(relationshipSchema),
        relationshipDiffRemovedSchema,
        relationshipDiffChangedSchema,
    ]) as z.ZodType<RelationshipDiff<T>>;
};
