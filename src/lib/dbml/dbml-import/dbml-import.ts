import { Parser } from '@dbml/core';
import type { Diagram } from '@/lib/domain/diagram';
import { generateDiagramId, generateId } from '@/lib/utils';
import type { DBTable } from '@/lib/domain/db-table';
import type { Cardinality, DBRelationship } from '@/lib/domain/db-relationship';
import type { DBField } from '@/lib/domain/db-field';
import type { DataTypeData } from '@/lib/data/data-types/data-types';
import { findDataTypeDataById } from '@/lib/data/data-types/data-types';
import { defaultTableColor } from '@/lib/colors';
import { DatabaseType } from '@/lib/domain/database-type';
import type Field from '@dbml/core/types/model_structure/field';
import type { DBIndex } from '@/lib/domain';
import {
    DBCustomTypeKind,
    type DBCustomType,
} from '@/lib/domain/db-custom-type';

// Preprocess DBML to handle unsupported features
export const preprocessDBML = (content: string): string => {
    let processed = content;

    // Remove TableGroup blocks (not supported by parser)
    processed = processed.replace(/TableGroup\s+[^{]*\{[^}]*\}/gs, '');

    // Remove Note blocks
    processed = processed.replace(/Note\s+\w+\s*\{[^}]*\}/gs, '');

    // Don't remove enum definitions - we'll parse them
    // processed = processed.replace(/enum\s+\w+\s*\{[^}]*\}/gs, '');

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
    characterMaximumLength?: string | null;
    precision?: number | null;
    scale?: number | null;
    note?: string | { value: string } | null;
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

interface DBMLEnum {
    name: string;
    schema?: string | { name: string };
    values: Array<{ name: string; note?: string }>;
    note?: string | { value: string } | null;
}

const mapDBMLTypeToDataType = (
    dbmlType: string,
    options?: { databaseType?: DatabaseType; enums?: DBMLEnum[] }
): DataTypeData => {
    const normalizedType = dbmlType.toLowerCase().replace(/\(.*\)/, '');

    // Check if it's an enum type
    if (options?.enums) {
        const enumDef = options.enums.find((e) => {
            // Check both with and without schema prefix
            const enumName = e.name.toLowerCase();
            const enumFullName = e.schema
                ? `${e.schema}.${enumName}`
                : enumName;
            return (
                normalizedType === enumName || normalizedType === enumFullName
            );
        });

        if (enumDef) {
            // Return enum as custom type reference
            return {
                id: enumDef.name,
                name: enumDef.name,
            } satisfies DataTypeData;
        }
    }

    const matchedType = findDataTypeDataById(
        normalizedType,
        options?.databaseType
    );
    if (matchedType) return matchedType;

    return {
        id: normalizedType.split(' ').join('_').toLowerCase(),
        name: normalizedType,
    } satisfies DataTypeData;
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
    dbmlContent: string,
    options?: {
        databaseType?: DatabaseType;
    }
): Promise<Diagram> => {
    try {
        // Handle empty content
        if (!dbmlContent.trim()) {
            return {
                id: generateDiagramId(),
                name: 'DBML Import',
                databaseType: options?.databaseType ?? DatabaseType.GENERIC,
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
                databaseType: options?.databaseType ?? DatabaseType.GENERIC,
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
                databaseType: options?.databaseType ?? DatabaseType.GENERIC,
                tables: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        // Process all schemas, not just the first one
        const allTables: DBMLTable[] = [];
        const allRefs: DBMLRef[] = [];
        const allEnums: DBMLEnum[] = [];

        const getFieldExtraAttributes = (
            field: Field,
            enums: DBMLEnum[]
        ): Partial<DBMLField> => {
            if (!field.type || !field.type.args) {
                return {};
            }

            const args = field.type.args.split(',') as string[];

            const dataType = mapDBMLTypeToDataType(field.type.type_name, {
                ...options,
                enums,
            });

            if (dataType.fieldAttributes?.hasCharMaxLength) {
                const charMaxLength = args?.[0];
                return {
                    characterMaximumLength: charMaxLength,
                };
            } else if (
                dataType.fieldAttributes?.precision &&
                dataType.fieldAttributes?.scale
            ) {
                const precisionNum = args?.[0] ? parseInt(args[0]) : undefined;
                const scaleNum = args?.[1] ? parseInt(args[1]) : undefined;

                const precision = precisionNum
                    ? isNaN(precisionNum)
                        ? undefined
                        : precisionNum
                    : undefined;

                const scale = scaleNum
                    ? isNaN(scaleNum)
                        ? undefined
                        : scaleNum
                    : undefined;

                return {
                    precision,
                    scale,
                };
            }

            return {};
        };

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
                        fields: table.fields.map((field): DBMLField => {
                            return {
                                name: field.name,
                                type: field.type,
                                unique: field.unique,
                                pk: field.pk,
                                not_null: field.not_null,
                                increment: field.increment,
                                note: field.note,
                                ...getFieldExtraAttributes(field, allEnums),
                            } satisfies DBMLField;
                        }),
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

            if (schema.enums) {
                schema.enums.forEach((enumDef) => {
                    // Get schema name from enum or use schema's name
                    const enumSchema =
                        typeof enumDef.schema === 'string'
                            ? enumDef.schema
                            : enumDef.schema?.name || schema.name;

                    allEnums.push({
                        name: enumDef.name,
                        schema: enumSchema === 'public' ? '' : enumSchema,
                        values: enumDef.values || [],
                        note: enumDef.note,
                    });
                });
            }
        });

        // Extract only the necessary data from the parsed DBML
        const extractedData: {
            tables: DBMLTable[];
            refs: DBMLRef[];
            enums: DBMLEnum[];
        } = {
            tables: allTables,
            refs: allRefs,
            enums: allEnums,
        };

        // Convert DBML tables to ChartDB table objects
        const tables: DBTable[] = extractedData.tables.map((table, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const tableSpacing = 300;

            // Create fields first so we have their IDs
            const fields: DBField[] = table.fields.map((field) => {
                // Extract field note/comment
                let fieldComment: string | undefined;
                if (field.note) {
                    if (typeof field.note === 'string') {
                        fieldComment = field.note;
                    } else if (
                        typeof field.note === 'object' &&
                        'value' in field.note
                    ) {
                        fieldComment = field.note.value;
                    }
                }

                return {
                    id: generateId(),
                    name: field.name.replace(/['"]/g, ''),
                    type: mapDBMLTypeToDataType(field.type.type_name, {
                        ...options,
                        enums: extractedData.enums,
                    }),
                    nullable: !field.not_null,
                    primaryKey: field.pk || false,
                    unique: field.unique || false,
                    createdAt: Date.now(),
                    characterMaximumLength: field.characterMaximumLength,
                    precision: field.precision,
                    scale: field.scale,
                    ...(fieldComment ? { comments: fieldComment } : {}),
                };
            });

            // Convert DBML indexes to ChartDB indexes
            const indexes: DBIndex[] =
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
                color: defaultTableColor,
                isView: false,
                createdAt: Date.now(),
                comments: tableComment,
            } satisfies DBTable;
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

        // Convert DBML enums to custom types
        const customTypes: DBCustomType[] = extractedData.enums.map(
            (enumDef) => {
                // Extract values from enum
                const values = enumDef.values
                    .map((v) => {
                        // Handle both string values and objects with name property
                        if (typeof v === 'string') {
                            return v;
                        } else if (v && typeof v === 'object' && 'name' in v) {
                            return v.name.replace(/["']/g, ''); // Remove quotes from values
                        }
                        return '';
                    })
                    .filter((v) => v !== '');

                return {
                    id: generateId(),
                    schema:
                        typeof enumDef.schema === 'string'
                            ? enumDef.schema
                            : undefined,
                    name: enumDef.name,
                    kind: DBCustomTypeKind.enum,
                    values,
                    order: 0,
                } satisfies DBCustomType;
            }
        );

        return {
            id: generateDiagramId(),
            name: 'DBML Import',
            databaseType: options?.databaseType ?? DatabaseType.GENERIC,
            tables,
            relationships,
            customTypes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    } catch (error) {
        console.error('DBML parsing error:', error);
        throw error;
    }
};
