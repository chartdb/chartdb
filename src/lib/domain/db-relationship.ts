export interface DBRelationship {
    id: string;
    sourceTableId: string;
    destinationTableId: string;
    sourceFieldId: string;
    destinationFieldId: string;
    type: RelationshipType;
    createdAt: number;
}

export type RelationshipType =
    | 'one-to-one'
    | 'one-to-many'
    | 'many-to-one'
    | 'many-to-many';
