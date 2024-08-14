export interface DBRelationship {
    id: string;
    name: string;
    sourceTableId: string;
    targetTableId: string;
    sourceFieldId: string;
    targetFieldId: string;
    type: RelationshipType;
    createdAt: number;
}

export type RelationshipType =
    | 'one_to_one'
    | 'one_to_many'
    | 'many_to_one'
    | 'many_to_many';
