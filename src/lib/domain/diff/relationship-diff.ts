import { z } from 'zod';
import type { DBRelationship } from '../db-relationship';

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

export type RelationshipDiff<T = DBRelationship> =
    | RelationshipDiffAdded<T>
    | RelationshipDiffRemoved;

export const createRelationshipDiffSchema = <T = DBRelationship>(
    relationshipSchema: z.ZodType<T>
): z.ZodType<RelationshipDiff<T>> => {
    return z.union([
        createRelationshipDiffAddedSchema(relationshipSchema),
        relationshipDiffRemovedSchema,
    ]) as z.ZodType<RelationshipDiff<T>>;
};
