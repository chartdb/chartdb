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

// Simple function to replace Spanish special characters
export const sanitizeDBML = (content: string): string => {
    return content
        .replace(/[áàäâ]/g, 'a')
        .replace(/[éèëê]/g, 'e')
        .replace(/[íìïî]/g, 'i')
        .replace(/[óòöô]/g, 'o')
        .replace(/[úùüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/Á/g, 'A')
        .replace(/É/g, 'E')
        .replace(/Í/g, 'I')
        .replace(/Ó/g, 'O')
        .replace(/Ú/g, 'U')
        .replace(/Ñ/g, 'N')
        .replace(/Ç/g, 'C');
};

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

interface DBMLIndexColumn {
    value: string;
    type?: string;
    length?: number;
    order?: 'asc' | 'desc';
}

interface DBMLIndex {
    columns: string | (string | DBMLIndexColumn)[];
    unique?: boolean;
    name?: string;
}

interface DBMLTable {
    name: string;
    schema?: string | { name: string };
    fields: DBMLField[];
    indexes?: DBMLIndex[];
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
        // Sanitize DBML content to remove special characters
        const sanitizedContent = sanitizeDBML(dbmlContent);
        const parsedData = parser.parse(sanitizedContent, 'dbml');
        const dbmlData = parsedData.schemas[0];

        // Extract only the necessary data from the parsed DBML
        const extractedData = {
            tables: (dbmlData.tables as unknown as DBMLTable[]).map(
                (table) => ({
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
                    indexes:
                        table.indexes?.map((dbmlIndex) => {
                            let indexColumns: string[];

                            // Handle composite index case "(col1, col2)"
                            if (typeof dbmlIndex.columns === 'string') {
                                if (dbmlIndex.columns.includes('(')) {
                                    // Composite index
                                    const columnsStr =
                                        dbmlIndex.columns.replace(/[()]/g, '');
                                    indexColumns = columnsStr
                                        .split(',')
                                        .map((c) => c.trim());
                                } else {
                                    // Single column
                                    indexColumns = [dbmlIndex.columns.trim()];
                                }
                            } else {
                                // Handle array of columns
                                indexColumns = Array.isArray(dbmlIndex.columns)
                                    ? dbmlIndex.columns.map((col) =>
                                          typeof col === 'object' &&
                                          'value' in col
                                              ? (col.value as string).trim()
                                              : (col as string).trim()
                                      )
                                    : [String(dbmlIndex.columns).trim()];
                            }

                            // Generate a consistent index name
                            const indexName =
                                dbmlIndex.name ||
                                `idx_${table.name}_${indexColumns.join('_')}`;

                            return {
                                columns: indexColumns,
                                unique: dbmlIndex.unique || false,
                                name: indexName,
                            };
                        }) || [],
                })
            ),
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
        const tables: DBTable[] = extractedData.tables.map((table, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const tableSpacing = 300;

            // Create fields first so we have their IDs
            const fields = table.fields.map((field) => ({
                id: generateId(),
                name: field.name.replace(/['"]/g, ''),
                type: mapDBMLTypeToGenericType(field.type.type_name),
                nullable: !field.not_null,
                primaryKey: field.pk || false,
                unique: field.unique || false,
                createdAt: Date.now(),
            }));

            // Convert DBML indexes to ChartDB indexes
            const indexes =
                table.indexes?.map((dbmlIndex) => {
                    const fieldIds = dbmlIndex.columns.map((columnName) => {
                        const field = fields.find((f) => f.name === columnName);
                        if (!field) {
                            throw new Error(
                                `Index references non-existent column: ${columnName}`
                            );
                        }
                        return field.id;
                    });

                    return {
                        id: generateId(),
                        name:
                            dbmlIndex.name ||
                            `idx_${table.name}_${dbmlIndex.columns.join('_')}`,
                        fieldIds,
                        unique: dbmlIndex.unique || false,
                        createdAt: Date.now(),
                    };
                }) || [];

            return {
                id: generateId(),
                name: table.name.replace(/['"]/g, ''),
                schema:
                    typeof table.schema === 'string'
                        ? table.schema
                        : table.schema?.name || '',
                order: index,
                fields,
                indexes,
                x: col * tableSpacing,
                y: row * tableSpacing,
                color: randomColor(),
                isView: false,
                createdAt: Date.now(),
            };
        });

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
