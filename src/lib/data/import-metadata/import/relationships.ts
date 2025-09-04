import type {
    Cardinality,
    DBField,
    DBRelationship,
    DBTable,
} from '@/lib/domain';
import { schemaNameToDomainSchemaName } from '@/lib/domain';
import type { ForeignKeyInfo } from '../metadata-types/foreign-key-info';
import { generateId } from '@/lib/utils';

const determineCardinality = (
    field: DBField,
    isTablePKComplex: boolean
): Cardinality => {
    return field.unique || (field.primaryKey && !isTablePKComplex)
        ? 'one'
        : 'many';
};

export const createRelationshipsFromMetadata = ({
    foreignKeys,
    tables,
}: {
    foreignKeys: ForeignKeyInfo[];
    tables: DBTable[];
}): DBRelationship[] => {
    return foreignKeys
        .map((fk: ForeignKeyInfo): DBRelationship | null => {
            const schema = schemaNameToDomainSchemaName(fk.schema);
            const sourceTable = tables.find(
                (table) => table.name === fk.table && table.schema === schema
            );

            const targetSchema = schemaNameToDomainSchemaName(
                fk.reference_schema
            );

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

            const isSourceTablePKComplex =
                (sourceTable?.fields.filter((field) => field.primaryKey) ?? [])
                    .length > 1;
            const isTargetTablePKComplex =
                (targetTable?.fields.filter((field) => field.primaryKey) ?? [])
                    .length > 1;

            if (sourceTable && targetTable && sourceField && targetField) {
                const sourceCardinality = determineCardinality(
                    sourceField,
                    isSourceTablePKComplex
                );
                const targetCardinality = determineCardinality(
                    targetField,
                    isTargetTablePKComplex
                );

                return {
                    id: generateId(),
                    name: fk.foreign_key_name,
                    sourceSchema: schema,
                    targetSchema: targetSchema,
                    sourceTableId: sourceTable.id,
                    targetTableId: targetTable.id,
                    sourceFieldId: sourceField.id,
                    targetFieldId: targetField.id,
                    sourceCardinality,
                    targetCardinality,
                    createdAt: Date.now(),
                };
            }

            return null;
        })
        .filter((rel) => rel !== null) as DBRelationship[];
};
