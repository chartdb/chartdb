import { RelationshipType } from '../domain/db-relationship';

export const relationshipTypes: Record<RelationshipType, string> = {
    one_to_one: 'One to One',
    one_to_many: 'One to Many',
    many_to_one: 'Many to One',
} as const;
