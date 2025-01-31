import { Parser } from '@dbml/core';
import type { Diagram } from '@/lib/domain/diagram';
import { generateDiagramId, generateId } from '@/lib/utils';
import type { DBTable } from '@/lib/domain/db-table';
import type { Cardinality, DBRelationship } from '@/lib/domain/db-relationship';
import type { DBField } from '@/lib/domain/db-field';
import type { DataType } from '@/lib/data/data-types/data-types';
import { genericDataTypes } from '@/lib/data/data-types/generic-data-types';
import { randomColor } from '@/lib/colors';
import { DatabaseType } from '@/lib/domain/database-type';

interface DBMLTypeArgs {
    length?: number;
    precision?: number;
    scale?: number;
    values?: string[]; // For enum types
}

interface DBMLField {
    name: string;
    type: {
        type_name: string;
        args?: DBMLTypeArgs;
    };
    unique?: boolean;
    pk?: boolean;
    not_null?: boolean;
    increment?: boolean;
}

interface DBMLTable {
    name: string;
    schema?: string | { name: string };
    fields: DBMLField[];
}

interface DBMLEndpoint {
    tableName: string;
    fieldNames: string[];
    relation: string;
}

interface DBMLRef {
    endpoints: [DBMLEndpoint, DBMLEndpoint];
}

const mapDBMLTypeToGenericType = (dbmlType: string): DataType => {
    const normalizedType = dbmlType.toLowerCase().replace(/\(.*\)/, '');
    const matchedType = genericDataTypes.find((t) => t.id === normalizedType);
    if (matchedType) return matchedType;
    const typeMap: Record<string, string> = {
        int: 'integer',
        varchar: 'varchar',
        bool: 'boolean',
        number: 'numeric',
        string: 'varchar',
        text: 'text',
        timestamp: 'timestamp',
        datetime: 'timestamp',
        float: 'float',
        double: 'double',
        decimal: 'decimal',
        bigint: 'bigint',
        smallint: 'smallint',
        char: 'char',
    };
    const mappedType = typeMap[normalizedType];
    if (mappedType) {
        const foundType = genericDataTypes.find((t) => t.id === mappedType);
        if (foundType) return foundType;
    }
    return genericDataTypes.find((t) => t.id === 'varchar')!;
};

const determineCardinality = (
    field: DBField,
    referencedField: DBField
): { sourceCardinality: string; targetCardinality: string } => {
    const isSourceUnique = field.unique || field.primaryKey;
    const isTargetUnique = referencedField.unique || referencedField.primaryKey;
    if (isSourceUnique && isTargetUnique) {
        return { sourceCardinality: 'one', targetCardinality: 'one' };
    } else if (isSourceUnique) {
        return { sourceCardinality: 'one', targetCardinality: 'many' };
    } else if (isTargetUnique) {
        return { sourceCardinality: 'many', targetCardinality: 'one' };
    } else {
        return { sourceCardinality: 'many', targetCardinality: 'many' };
    }
};

export const importDBMLToDiagram = async (
    dbmlContent: string
): Promise<Diagram> => {
    try {
        const parser = new Parser();
        const parsedData = parser.parse(dbmlContent, 'dbml');
        const dbmlData = parsedData.schemas[0];

        // Extract only the necessary data from the parsed DBML
        const extractedData = {
            tables: dbmlData.tables.map((table: DBMLTable) => ({
                name: table.name,
                schema: table.schema,
                fields: table.fields.map((field: DBMLField) => ({
                    name: field.name,
                    type: field.type,
                    unique: field.unique,
                    pk: field.pk,
                    not_null: field.not_null,
                    increment: field.increment,
                })),
            })),
            refs: (dbmlData.refs as unknown as DBMLRef[]).map((ref) => ({
                endpoints: (ref.endpoints as [DBMLEndpoint, DBMLEndpoint]).map(
                    (endpoint) => ({
                        tableName: endpoint.tableName,
                        fieldNames: endpoint.fieldNames,
                        relation: endpoint.relation,
                    })
                ),
            })),
        };

        // Convert DBML tables to ChartDB table objects
        const tables: DBTable[] = extractedData.tables.map((table, index) => ({
            id: generateId(),
            name: table.name.replace(/['"]/g, ''),
            schema:
                typeof table.schema === 'string'
                    ? table.schema
                    : table.schema?.name || '',
            order: index,
            fields: table.fields.map((field) => ({
                id: generateId(),
                name: field.name.replace(/['"]/g, ''),
                type: mapDBMLTypeToGenericType(field.type.type_name),
                nullable: !field.not_null,
                primaryKey: field.pk || false,
                unique: field.unique || false,
                createdAt: Date.now(),
            })),
            x: 0,
            y: 0,
            indexes: [],
            color: randomColor(),
            isView: false,
            createdAt: Date.now(),
        }));

        // Create relationships using the refs
        const relationships: DBRelationship[] = extractedData.refs.map(
            (ref) => {
                const [source, target] = ref.endpoints;
                const sourceTable = tables.find(
                    (t) =>
                        t.name === source.tableName.replace(/['"]/g, '') &&
                        (!source.tableName.includes('.') ||
                            t.schema === source.tableName.split('.')[0])
                );
                const targetTable = tables.find(
                    (t) =>
                        t.name === target.tableName.replace(/['"]/g, '') &&
                        (!target.tableName.includes('.') ||
                            t.schema === target.tableName.split('.')[0])
                );

                if (!sourceTable || !targetTable) {
                    throw new Error('Invalid relationship: tables not found');
                }

                const sourceField = sourceTable.fields.find(
                    (f) => f.name === source.fieldNames[0].replace(/['"]/g, '')
                );
                const targetField = targetTable.fields.find(
                    (f) => f.name === target.fieldNames[0].replace(/['"]/g, '')
                );

                if (!sourceField || !targetField) {
                    throw new Error('Invalid relationship: fields not found');
                }

                const { sourceCardinality, targetCardinality } =
                    determineCardinality(sourceField, targetField);

                return {
                    id: generateId(),
                    name: `${sourceTable.name}_${sourceField.name}_${targetTable.name}_${targetField.name}`,
                    sourceSchema: sourceTable.schema,
                    targetSchema: targetTable.schema,
                    sourceTableId: sourceTable.id,
                    targetTableId: targetTable.id,
                    sourceFieldId: sourceField.id,
                    targetFieldId: targetField.id,
                    sourceCardinality: sourceCardinality as Cardinality,
                    targetCardinality: targetCardinality as Cardinality,
                    createdAt: Date.now(),
                };
            }
        );

        return {
            id: generateDiagramId(),
            name: 'DBML Import',
            databaseType: DatabaseType.GENERIC,
            tables,
            relationships,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    } catch (error) {
        console.error('DBML parsing error:', error);
        throw error;
    }
};
