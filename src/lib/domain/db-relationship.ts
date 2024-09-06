import { ForeignKeyInfo } from '../data/import-metadata/metadata-types/foreign-key-info';
import { DBTable } from './db-table';
import { generateId } from '@/lib/utils';

export interface DBRelationship {
    id: string;
    name: string;
    sourceSchema?: string;
    sourceTableId: string;
    targetSchema?: string;
    targetTableId: string;
    sourceFieldId: string;
    targetFieldId: string;
    type: RelationshipType;
    createdAt: number;
}

export type RelationshipType = 'one_to_one' | 'one_to_many' | 'many_to_one';

export const createRelationshipsFromMetadata = ({
    foreignKeys,
    tables,
}: {
    foreignKeys: ForeignKeyInfo[];
    tables: DBTable[];
}): DBRelationship[] => {
    return foreignKeys
        .map((fk: ForeignKeyInfo) => {
            const schema =
                (fk.schema ?? '').trim() === '' ? undefined : fk.schema;
            const sourceTable = tables.find(
                (table) => table.name === fk.table && table.schema === schema
            );

            const targetSchema =
                (fk.reference_schema ?? '').trim() === ''
                    ? undefined
                    : fk.reference_schema;

            const targetTable = tables.find(
                (table) =>
                    table.name === fk.reference_table &&
                    table.schema === targetSchema
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
                    sourceSchema: schema,
                    targetSchema: targetSchema,
                    sourceTableId: sourceTable.id,
                    targetTableId: targetTable.id,
                    sourceFieldId: sourceField.id,
                    targetFieldId: targetField.id,
                    type: 'many_to_one', // This could be adjusted based on your logic
                    createdAt: Date.now(),
                } as DBRelationship;
            }

            return null;
        })
        .filter((rel) => rel !== null) as DBRelationship[];
};
