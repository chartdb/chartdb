import { ForeignKeyInfo } from '../import-script-types/foreign-key-info';
import { DBTable } from './db-table';
import { generateId } from '@/lib/utils';

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

export type RelationshipType = 'one_to_one' | 'one_to_many' | 'many_to_one';

export const createRelationships = (
    fkInfo: ForeignKeyInfo[],
    tables: DBTable[]
): DBRelationship[] => {
    return fkInfo
        .map((fk: ForeignKeyInfo) => {
            const sourceTable = tables.find((table) => table.name === fk.table);
            const targetTable = tables.find(
                (table) => table.name === fk.reference_table
            );
            const sourceField = sourceTable?.fields.find(
                (field) => field.name === fk.column
            );
            const targetField = targetTable?.fields.find(
                (field) => field.name === fk.reference_column
            );

            if (sourceTable && targetTable && sourceField && targetField) {
                return {
                    id: generateId(),
                    name: fk.foreign_key_name,
                    sourceTableId: sourceTable.id,
                    targetTableId: targetTable.id,
                    sourceFieldId: sourceField.id,
                    targetFieldId: targetField.id,
                    type: 'many_to_one', // This could be adjusted based on your logic
                    createdAt: Date.now(),
                };
            }

            return null;
        })
        .filter((rel) => rel !== null) as DBRelationship[];
};
