import { Parser } from '@dbml/core';
import type { Diagram } from '@/lib/domain/diagram';
import { generateDiagramId, generateId, isStringEmpty } from '@/lib/utils';
import type { DBTable } from '@/lib/domain/db-table';
import { defaultSchemas } from '@/lib/data/default-schemas';
import type { Cardinality, DBRelationship } from '@/lib/domain/db-relationship';
import type { DBField } from '@/lib/domain/db-field';
import type { DataTypeData } from '@/lib/data/data-types/data-types';
import {
    findDataTypeDataById,
    getPreferredSynonym,
    requiresNotNull,
} from '@/lib/data/data-types/data-types';
import { defaultTableColor } from '@/lib/colors';
import { DatabaseType } from '@/lib/domain/database-type';
import type Field from '@dbml/core/types/model_structure/field';
import { getTableIndexesWithPrimaryKey, type DBIndex } from '@/lib/domain';
import {
    DBCustomTypeKind,
    type DBCustomType,
} from '@/lib/domain/db-custom-type';
import { validateArrayTypesForDatabase } from './dbml-import-error';

export const defaultDBMLDiagramName = 'DBML Import';

interface PreprocessDBMLResult {
    content: string;
    arrayFields: Map<string, Set<string>>;
}

export const preprocessDBML = (content: string): PreprocessDBMLResult => {
    let processed = content;

    // Track array fields found during preprocessing
    const arrayFields = new Map<string, Set<string>>();

    // Remove TableGroup blocks (not supported by parser)
    processed = processed.replace(/TableGroup\s+[^{]*\{[^}]*\}/gs, '');

    // Remove Note blocks
    processed = processed.replace(/Note\s+\w+\s*\{[^}]*\}/gs, '');

    // Don't remove enum definitions - we'll parse them
    // processed = processed.replace(/enum\s+\w+\s*\{[^}]*\}/gs, '');

    // Handle array types by tracking them and converting syntax for DBML parser
    // Note: DBML doesn't officially support array syntax, so we convert type[] to type
    // but track which fields should be arrays

    // First, find all array field declarations and track them
    const tablePattern =
        /Table\s+(?:"([^"]+)"\.)?(?:"([^"]+)"|(\w+))\s*(?:\[[^\]]*\])?\s*\{([^}]+)\}/gs;
    let match;

    while ((match = tablePattern.exec(content)) !== null) {
        const schema = match[1] || '';
        const tableName = match[2] || match[3];
        const tableBody = match[4];
        const fullTableName = schema ? `${schema}.${tableName}` : tableName;

        // Find array field declarations within this table
        const fieldPattern = /"?(\w+)"?\s+(\w+(?:\([^)]+\))?)\[\]/g;
        let fieldMatch;

        while ((fieldMatch = fieldPattern.exec(tableBody)) !== null) {
            const fieldName = fieldMatch[1];

            if (!arrayFields.has(fullTableName)) {
                arrayFields.set(fullTableName, new Set());
            }
            arrayFields.get(fullTableName)!.add(fieldName);
        }
    }

    // Now convert array syntax for DBML parser (keep the base type, remove [])
    processed = processed.replace(/(\w+(?:\(\d+(?:,\s*\d+)?\))?)\[\]/g, '$1');

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

    return { content: processed, arrayFields };
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
    isArray?: boolean;
    characterMaximumLength?: string | null;
    precision?: number | null;
    scale?: number | null;
    note?: string | { value: string } | null;
    default?: string | null;
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
    pk?: boolean; // Primary key index flag
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
    options: {
        databaseType: DatabaseType;
    }
): Promise<Diagram> => {
    try {
        // Handle empty content
        if (!dbmlContent.trim()) {
            return {
                id: generateDiagramId(),
                name: defaultDBMLDiagramName,
                databaseType: options?.databaseType ?? DatabaseType.GENERIC,
                tables: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        // Validate array types BEFORE preprocessing (preprocessing removes [])
        validateArrayTypesForDatabase(dbmlContent, options.databaseType);

        const parser = new Parser();
        // Preprocess and sanitize DBML content
        const { content: preprocessedContent, arrayFields } =
            preprocessDBML(dbmlContent);
        const sanitizedContent = sanitizeDBML(preprocessedContent);

        // Handle content that becomes empty after preprocessing
        if (!sanitizedContent.trim()) {
            return {
                id: generateDiagramId(),
                name: defaultDBMLDiagramName,
                databaseType: options?.databaseType ?? DatabaseType.GENERIC,
                tables: [],
                relationships: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        const parsedData = parser.parse(sanitizedContent, 'dbmlv2');

        // Handle case where no schemas are found
        if (!parsedData.schemas || parsedData.schemas.length === 0) {
            return {
                id: generateDiagramId(),
                name: defaultDBMLDiagramName,
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
            // First check if the type name itself contains the length (e.g., "character varying(50)")
            const typeName = field.type.type_name;
            let extractedArgs: string[] | undefined;

            // Check for types with embedded length like "character varying(50)" or varchar(255)
            const typeWithLengthMatch = typeName.match(/^(.+?)\(([^)]+)\)$/);
            if (typeWithLengthMatch) {
                // Extract the args from the type name itself
                extractedArgs = typeWithLengthMatch[2]
                    .split(',')
                    .map((arg: string) => arg.trim());
            }

            // Use extracted args or fall back to field.type.args
            const args =
                extractedArgs ||
                (field.type.args ? field.type.args.split(',') : undefined);

            if (!args || args.length === 0) {
                return {};
            }

            const dataType = mapDBMLTypeToDataType(field.type.type_name, {
                ...options,
                enums,
            });

            // Also check the preferred synonym for field attributes (e.g., decimal → numeric)
            const preferredType = options.databaseType
                ? getPreferredSynonym(dataType.name, options.databaseType)
                : null;
            const effectiveType = preferredType ?? dataType;

            // Check if this is a character type that should have a max length
            const baseTypeName = typeName
                .replace(/\(.*\)/, '')
                .toLowerCase()
                .replace(/['"]/g, '');
            const isCharType =
                baseTypeName.includes('char') ||
                baseTypeName.includes('varchar') ||
                baseTypeName === 'text' ||
                baseTypeName === 'string';

            if (isCharType && args[0]) {
                return {
                    characterMaximumLength: args[0],
                };
            } else if (
                effectiveType.fieldAttributes?.precision &&
                effectiveType.fieldAttributes?.scale
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
                            // Extract default value and remove all quotes
                            let defaultValue: string | undefined;
                            if (
                                field.dbdefault !== undefined &&
                                field.dbdefault !== null
                            ) {
                                const rawDefault = String(
                                    field.dbdefault.value
                                );
                                defaultValue = rawDefault.replace(/['"`]/g, '');
                            }

                            // Check if this field should be an array
                            const fullTableName = schemaName
                                ? `${schemaName}.${table.name}`
                                : table.name;

                            let isArray = arrayFields
                                .get(fullTableName)
                                ?.has(field.name);

                            if (!isArray && schemaName) {
                                isArray = arrayFields
                                    .get(table.name)
                                    ?.has(field.name);
                            }

                            return {
                                name: field.name,
                                type: field.type,
                                unique: field.unique,
                                pk: field.pk,
                                not_null: field.not_null,
                                increment: field.increment,
                                isArray: isArray || undefined,
                                note: field.note,
                                default: defaultValue,
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

                                // For PK indexes, only use the name if explicitly provided
                                // For regular indexes, generate a default name if needed
                                const indexName =
                                    dbmlIndex.name ||
                                    (!dbmlIndex.pk
                                        ? `idx_${table.name}_${indexColumns.join('_')}`
                                        : undefined);

                                return {
                                    columns: indexColumns,
                                    unique: dbmlIndex.unique || false,
                                    name: indexName,
                                    pk: Boolean(dbmlIndex.pk) || false,
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
                    // DBML parser uses 'public' as its default - treat it as empty
                    const rawEnumSchema =
                        typeof enumDef.schema === 'string'
                            ? enumDef.schema
                            : enumDef.schema?.name || schema.name;
                    const defaultSchema = defaultSchemas[options.databaseType];
                    const isEnumSchemaEmpty =
                        isStringEmpty(rawEnumSchema) ||
                        rawEnumSchema === 'public';
                    const enumSchema = isEnumSchemaEmpty
                        ? defaultSchema
                        : rawEnumSchema;

                    allEnums.push({
                        name: enumDef.name,
                        schema: enumSchema,
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

                // Map DBML type to DataType
                const mappedType = mapDBMLTypeToDataType(field.type.type_name, {
                    ...options,
                    enums: extractedData.enums,
                });

                // Check if there's a preferred synonym for this type
                const preferredType = getPreferredSynonym(
                    mappedType.name,
                    options.databaseType
                );

                // Use the preferred synonym if it exists, otherwise use the mapped type
                const finalType = preferredType ?? mappedType;

                return {
                    id: generateId(),
                    name: field.name.replace(/['"]/g, ''),
                    type: finalType,
                    nullable:
                        field.increment ||
                        field.pk ||
                        requiresNotNull(field.type.type_name)
                            ? false
                            : !field.not_null,
                    primaryKey: field.pk || false,
                    unique: field.unique || field.pk || false, // Primary keys are always unique
                    createdAt: Date.now(),
                    characterMaximumLength: field.characterMaximumLength,
                    precision: field.precision,
                    scale: field.scale,
                    ...(field.increment ? { increment: field.increment } : {}),
                    ...(field.isArray ? { isArray: field.isArray } : {}),
                    ...(fieldComment ? { comments: fieldComment } : {}),
                    ...(field.default ? { default: field.default } : {}),
                };
            });

            // Process composite primary keys from indexes with [pk] attribute
            let compositePKFields: string[] = [];
            let compositePKIndexName: string | undefined;

            // Find PK indexes and mark fields as primary keys
            table.indexes?.forEach((dbmlIndex) => {
                if (dbmlIndex.pk) {
                    // Extract column names from the columns array
                    compositePKFields = dbmlIndex.columns.map((col) =>
                        typeof col === 'string' ? col : col.value
                    );
                    // Only store the name if it was explicitly provided (not undefined)
                    if (dbmlIndex.name) {
                        compositePKIndexName = dbmlIndex.name;
                    }
                    // Mark fields as primary keys and NOT NULL
                    dbmlIndex.columns.forEach((col) => {
                        const columnName =
                            typeof col === 'string' ? col : col.value;
                        const field = fields.find((f) => f.name === columnName);
                        if (field) {
                            field.primaryKey = true;
                            field.nullable = false;
                        }
                    });
                }
            });

            // If we found a PK without a name, look for a duplicate index with just a name
            if (compositePKFields.length > 0 && !compositePKIndexName) {
                table.indexes?.forEach((dbmlIndex) => {
                    if (
                        !dbmlIndex.pk &&
                        dbmlIndex.name &&
                        dbmlIndex.columns.length === compositePKFields.length
                    ) {
                        // Check if columns match
                        const indexColumns = dbmlIndex.columns.map((col) =>
                            typeof col === 'string' ? col : col.value
                        );
                        if (
                            indexColumns.every(
                                (col, i) => col === compositePKFields[i]
                            )
                        ) {
                            compositePKIndexName = dbmlIndex.name;
                        }
                    }
                });
            }

            // Convert DBML indexes to ChartDB indexes (excluding PK indexes and their duplicates)
            const indexes: DBIndex[] =
                table.indexes
                    ?.filter((dbmlIndex) => {
                        // Skip PK indexes - we'll handle them separately
                        if (dbmlIndex.pk) return false;

                        // Skip duplicate indexes that match the composite PK
                        // (when user has both [pk] and [name: "..."] on same fields)
                        if (
                            compositePKFields.length > 0 &&
                            dbmlIndex.columns.length ===
                                compositePKFields.length &&
                            dbmlIndex.columns.every((col, i) => {
                                const colName =
                                    typeof col === 'string' ? col : col.value;
                                return colName === compositePKFields[i];
                            })
                        ) {
                            return false;
                        }

                        return true;
                    })
                    .map((dbmlIndex) => {
                        const fieldIds = dbmlIndex.columns.map((columnName) => {
                            const field = fields.find(
                                (f) => f.name === columnName
                            );
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

            // Add PK as an index if it exists and has a name
            // Only create the PK index if there's an explicit name for it
            if (compositePKFields.length >= 1 && compositePKIndexName) {
                const pkFieldIds = compositePKFields.map((columnName) => {
                    const field = fields.find((f) => f.name === columnName);
                    if (!field) {
                        throw new Error(
                            `PK references non-existent column: ${columnName}`
                        );
                    }
                    return field.id;
                });

                indexes.push({
                    id: generateId(),
                    name: compositePKIndexName,
                    fieldIds: pkFieldIds,
                    unique: true,
                    isPrimaryKey: true,
                    createdAt: Date.now(),
                });
            }

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

            // Get raw schema from DBML, then apply defaultSchema if empty
            // DBML parser uses 'public' as its default - treat it as empty
            const defaultSchema = defaultSchemas[options.databaseType];
            const rawSchema =
                typeof table.schema === 'string'
                    ? table.schema
                    : table.schema?.name;
            const isSchemaEmpty =
                isStringEmpty(rawSchema) || rawSchema === 'public';
            const tableSchema = isSchemaEmpty ? defaultSchema : rawSchema;

            const tableToReturn: DBTable = {
                id: generateId(),
                name: table.name.replace(/['"]/g, ''),
                schema: tableSchema,
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

            return {
                ...tableToReturn,
                indexes: getTableIndexesWithPrimaryKey({
                    table: tableToReturn,
                }),
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
            name: defaultDBMLDiagramName,
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
