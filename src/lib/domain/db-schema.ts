export interface DBSchema {
    id: string;
    name: string;
    tableCount: number;
}

export const schemaNameToSchemaId = (schema: string): string =>
    schema.toLowerCase().split(' ').join('_');
