export interface DBRelationship {
    id: string;
    sourceTableId: string;
    targetTableId: string;
    sourceFieldId: string;
    targetFieldId: string;
    type: RelationshipType;
    createdAt: number;
}

export type RelationshipType =
    | 'one-to-one'
    | 'one-to-many'
    | 'many-to-one'
    | 'many-to-many';
