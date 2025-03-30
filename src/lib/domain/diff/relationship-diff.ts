import { z } from 'zod';
import type { DBRelationship } from '../db-relationship';
import { dbRelationshipSchema } from '../db-relationship';

export interface RelationshipDiffAdded {
    object: 'relationship';
    type: 'added';
    newRelationship: DBRelationship;
}

export const relationshipDiffAddedSchema: z.ZodType<RelationshipDiffAdded> =
    z.object({
        object: z.literal('relationship'),
        type: z.literal('added'),
        newRelationship: dbRelationshipSchema,
    });

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

export type RelationshipDiff = RelationshipDiffAdded | RelationshipDiffRemoved;

export const relationshipDiffSchema: z.ZodType<RelationshipDiff> = z.union([
    relationshipDiffAddedSchema,
    relationshipDiffRemovedSchema,
]);
