import { z } from 'zod';
import type { ForeignKeyInfo } from '../data/import-metadata/metadata-types/foreign-key-info';
import type { DBField } from './db-field';
import {
    schemaNameToDomainSchemaName,
    schemaNameToSchemaId,
} from './db-schema';
import type { DBTable } from './db-table';
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
    sourceCardinality: Cardinality;
    targetCardinality: Cardinality;
    createdAt: number;
}

export const dbRelationshipSchema: z.ZodType<DBRelationship> = z.object({
    id: z.string(),
    name: z.string(),
    sourceSchema: z.string().optional(),
    sourceTableId: z.string(),
    targetSchema: z.string().optional(),
    targetTableId: z.string(),
    sourceFieldId: z.string(),
    targetFieldId: z.string(),
    sourceCardinality: z.union([z.literal('one'), z.literal('many')]),
    targetCardinality: z.union([z.literal('one'), z.literal('many')]),
    createdAt: z.number(),
});

export type RelationshipType =
    | 'one_to_one'
    | 'one_to_many'
    | 'many_to_one'
    | 'many_to_many';
export type Cardinality = 'one' | 'many';

export const shouldShowRelationshipBySchemaFilter = (
    relationship: DBRelationship,
    filteredSchemas?: string[]
): boolean =>
    !filteredSchemas ||
    !relationship.sourceSchema ||
    !relationship.targetSchema ||
    (filteredSchemas.includes(
        schemaNameToSchemaId(relationship.sourceSchema)
    ) &&
        filteredSchemas.includes(
            schemaNameToSchemaId(relationship.targetSchema)
        ));

const determineCardinality = (
    field: DBField,
    isTablePKComplex: boolean
): Cardinality => {
    return field.unique || (field.primaryKey && !isTablePKComplex)
        ? 'one'
        : 'many';
};

const areRelationshipsEqual = (
    rel1: {
        sourceTable?: DBTable;
        targetTable?: DBTable;
        sourceField?: DBField;
        targetField?: DBField;
    },
    rel2: {
        sourceTable?: DBTable;
        targetTable?: DBTable;
        sourceField?: DBField;
        targetField?: DBField;
    }
): boolean => {
    return (
        rel1.sourceTable?.name === rel2.sourceTable?.name &&
        rel1.sourceTable?.schema === rel2.sourceTable?.schema &&
        rel1.targetTable?.name === rel2.targetTable?.name &&
        rel1.targetTable?.schema === rel2.targetTable?.schema &&
        rel1.sourceField?.name === rel2.sourceField?.name &&
        rel1.targetField?.name === rel2.targetField?.name
    );
};

export const createRelationshipsFromMetadata = ({
    foreignKeys,
    tables,
}: {
    foreignKeys: ForeignKeyInfo[];
    tables: DBTable[];
}): DBRelationship[] => {
    const uniqueRelationships: Array<{
        sourceTable?: DBTable;
        targetTable?: DBTable;
        sourceField?: DBField;
        targetField?: DBField;
        fk: ForeignKeyInfo;
        sourceSchema?: string;
        targetSchema?: string;
    }> = [];

    // First pass to collect unique relationships
    foreignKeys.forEach((fk: ForeignKeyInfo) => {
        const schema = schemaNameToDomainSchemaName(fk.schema);
        const sourceTable = tables.find(
            (table) => table.name === fk.table && table.schema === schema
        );
        const targetSchema = schemaNameToDomainSchemaName(fk.reference_schema);
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

        const newRel = {
            sourceTable,
            targetTable,
            sourceField,
            targetField,
            fk,
            sourceSchema: schema,
            targetSchema,
        };

        // Check if this relationship already exists
        const isDuplicate = uniqueRelationships.some((existingRel) =>
            areRelationshipsEqual(existingRel, newRel)
        );

        if (!isDuplicate) {
            uniqueRelationships.push(newRel);
        }
    });

    // Second pass to create the actual relationships
    return uniqueRelationships
        .map(
            ({
                sourceTable,
                targetTable,
                sourceField,
                targetField,
                fk,
                sourceSchema,
                targetSchema,
            }) => {
                if (sourceTable && targetTable && sourceField && targetField) {
                    const isSourceTablePKComplex =
                        (
                            sourceTable.fields.filter(
                                (field) => field.primaryKey
                            ) ?? []
                        ).length > 1;
                    const isTargetTablePKComplex =
                        (
                            targetTable.fields.filter(
                                (field) => field.primaryKey
                            ) ?? []
                        ).length > 1;

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
                        sourceSchema,
                        targetSchema,
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
            }
        )
        .filter((rel) => rel !== null) as DBRelationship[];
};

export const determineRelationshipType = ({
    sourceCardinality,
    targetCardinality,
}: {
    sourceCardinality: Cardinality;
    targetCardinality: Cardinality;
}): RelationshipType => {
    if (sourceCardinality === 'one' && targetCardinality === 'one')
        return 'one_to_one';
    if (sourceCardinality === 'one' && targetCardinality === 'many')
        return 'one_to_many';
    if (sourceCardinality === 'many' && targetCardinality === 'one')
        return 'many_to_one';
    return 'many_to_many';
};

export const determineCardinalities = (
    relationshipType: RelationshipType
): {
    sourceCardinality: Cardinality;
    targetCardinality: Cardinality;
} => {
    switch (relationshipType) {
        case 'one_to_one':
            return { sourceCardinality: 'one', targetCardinality: 'one' };
        case 'one_to_many':
            return { sourceCardinality: 'one', targetCardinality: 'many' };
        case 'many_to_one':
            return { sourceCardinality: 'many', targetCardinality: 'one' };
        case 'many_to_many':
            return { sourceCardinality: 'many', targetCardinality: 'many' };
    }
};
