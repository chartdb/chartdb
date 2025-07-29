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

// Preprocess DBML to handle unsupported features
export const preprocessDBML = (content: string): string => {
    let processed = content;

    // Remove TableGroup blocks (not supported by parser)
    processed = processed.replace(/TableGroup\s+[^{]*\{[^}]*\}/gs, '');

    // Remove Note blocks
    processed = processed.replace(/Note\s+\w+\s*\{[^}]*\}/gs, '');

    // Remove enum definitions (blocks)
    processed = processed.replace(/enum\s+\w+\s*\{[^}]*\}/gs, '');

    // Handle array types by converting them to text
    processed = processed.replace(/(\w+)\[\]/g, 'text');

    // Handle inline enum types without values by converting to varchar
    processed = processed.replace(
        /^\s*(\w+)\s+enum\s*(?:\/\/.*)?$/gm,
        '$1 varchar'
    );

    // Handle Table headers with color attributes
    // This regex handles both simple table names and schema.table patterns with quotes
    processed = processed.replace(
        /Table\s+((?:"[^"]+"\."[^"]+")|(?:\w+))\s*\[[^\]]*\]\s*\{/g,
        'Table $1 {'
    );

    return processed;
};

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
    columns: (string | DBMLIndexColumn)[];
    unique?: boolean;
    name?: string;
}

interface DBMLTable {
    name: string;
    schema?: string | { name: string };
    fields: DBMLField[];
    indexes?: DBMLIndex[];
    note?: string | { value: string } | null;
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
        int: 'int',
        integer: 'int',
        varchar: 'varchar',
        bool: 'boolean',
        boolean: 'boolean',
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
    const type = genericDataTypes.find((t) => t.id === 'varchar')!;

    return {
        id: type.id,
        name: type.name,
    };
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
        // Handle empty content
        if (!dbmlContent.trim()) {
            return {
                id: generateDiagramId(),
                name: 'DBML Import',
                databaseType: DatabaseType.GENERIC,
                tables: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        const parser = new Parser();
        // Preprocess and sanitize DBML content
        const preprocessedContent = preprocessDBML(dbmlContent);
        const sanitizedContent = sanitizeDBML(preprocessedContent);

        // Handle content that becomes empty after preprocessing
        if (!sanitizedContent.trim()) {
            return {
                id: generateDiagramId(),
                name: 'DBML Import',
                databaseType: DatabaseType.GENERIC,
                tables: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        const parsedData = parser.parse(sanitizedContent, 'dbml');

        // Handle case where no schemas are found
        if (!parsedData.schemas || parsedData.schemas.length === 0) {
            return {
                id: generateDiagramId(),
                name: 'DBML Import',
                databaseType: DatabaseType.GENERIC,
                tables: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        // Process all schemas, not just the first one
        const allTables: DBMLTable[] = [];
        const allRefs: DBMLRef[] = [];

        parsedData.schemas.forEach((schema) => {
            if (schema.tables) {
                schema.tables.forEach((table) => {
                    // For tables with explicit schema, use the schema name
                    // For tables without explicit schema, use empty string
                    const schemaName =
                        typeof table.schema === 'string'
                            ? table.schema
                            : table.schema?.name || '';

                    allTables.push({
                        name: table.name,
                        schema: schemaName,
                        note: table.note,
                        fields: table.fields.map(
                            (field) =>
                                ({
                                    name: field.name,
                                    type: field.type,
                                    unique: field.unique,
                                    pk: field.pk,
                                    not_null: field.not_null,
                                    increment: field.increment,
                                }) satisfies DBMLField
                        ),
                        indexes:
                            table.indexes?.map((dbmlIndex) => {
                                let indexColumns: string[];

                                // Handle both string and array formats
                                if (typeof dbmlIndex.columns === 'string') {
                                    // Handle composite index case "(col1, col2)"
                                    // @ts-expect-error "columns" can be a string in some DBML versions
                                    if (dbmlIndex.columns.includes('(')) {
                                        const columnsStr: string =
                                            // @ts-expect-error "columns" can be a string in some DBML versions
                                            dbmlIndex.columns.replace(
                                                /[()]/g,
                                                ''
                                            );
                                        indexColumns = columnsStr
                                            .split(',')
                                            .map((c) => c.trim());
                                    } else {
                                        // Single column as string

                                        indexColumns = [
                                            // @ts-expect-error "columns" can be a string in some DBML versions
                                            dbmlIndex.columns.trim(),
                                        ];
                                    }
                                } else {
                                    // Handle array of columns
                                    indexColumns = dbmlIndex.columns.map(
                                        (col) => {
                                            if (typeof col === 'string') {
                                                // @ts-expect-error "columns" can be a string in some DBML versions
                                                return col.trim();
                                            } else if (
                                                typeof col === 'object' &&
                                                'value' in col
                                            ) {
                                                return col.value.trim();
                                            } else {
                                                return String(col).trim();
                                            }
                                        }
                                    );
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
                    });
                });
            }

            if (schema.refs) {
                schema.refs.forEach((ref) => {
                    // Convert the ref to ensure it has exactly two endpoints
                    if (ref.endpoints && ref.endpoints.length >= 2) {
                        allRefs.push({
                            endpoints: [ref.endpoints[0], ref.endpoints[1]] as [
                                DBMLEndpoint,
                                DBMLEndpoint,
                            ],
                        });
                    }
                });
            }
        });

        // Extract only the necessary data from the parsed DBML
        const extractedData: {
            tables: DBMLTable[];
            refs: DBMLRef[];
        } = {
            tables: allTables,
            refs: allRefs,
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
                            `idx_${table.name}_${(dbmlIndex.columns as string[]).join('_')}`,
                        fieldIds,
                        unique: dbmlIndex.unique || false,
                        createdAt: Date.now(),
                    };
                }) || [];

            // Extract table note/comment
            let tableComment: string | undefined;
            if (table.note) {
                if (typeof table.note === 'string') {
                    tableComment = table.note;
                } else if (
                    typeof table.note === 'object' &&
                    'value' in table.note
                ) {
                    tableComment = table.note.value;
                }
            }

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
                comments: tableComment,
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
