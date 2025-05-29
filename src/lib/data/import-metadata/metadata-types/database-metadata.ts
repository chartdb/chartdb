import { z } from 'zod';
import { ForeignKeyInfoSchema, type ForeignKeyInfo } from './foreign-key-info';
import { PrimaryKeyInfoSchema, type PrimaryKeyInfo } from './primary-key-info';
import { ColumnInfoSchema, type ColumnInfo } from './column-info';
import { IndexInfoSchema, type IndexInfo } from './index-info';
import { TableInfoSchema, type TableInfo } from './table-info';
import { ViewInfoSchema, type ViewInfo } from './view-info';
import {
    DBCustomTypeInfoSchema,
    type DBCustomTypeInfo,
} from './custom-type-info';

export interface DatabaseMetadata {
    fk_info: ForeignKeyInfo[];
    pk_info: PrimaryKeyInfo[];
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    tables: TableInfo[];
    views: ViewInfo[];
    custom_types?: DBCustomTypeInfo[];
    database_name: string;
    version: string;
}

export const DatabaseMetadataSchema: z.ZodType<DatabaseMetadata> = z.object({
    fk_info: z.array(ForeignKeyInfoSchema),
    pk_info: z.array(PrimaryKeyInfoSchema),
    columns: z.array(ColumnInfoSchema),
    indexes: z.array(IndexInfoSchema),
    tables: z.array(TableInfoSchema),
    views: z.array(ViewInfoSchema),
    custom_types: z.array(DBCustomTypeInfoSchema).optional(),
    database_name: z.string(),
    version: z.string(),
});

export const isDatabaseMetadata = (obj: unknown): boolean => {
    const parsedObject = DatabaseMetadataSchema.safeParse(obj);

    if (!parsedObject.success) {
        console.error(parsedObject.error);
        return false;
    }

    return true;
};

export const loadDatabaseMetadata = (jsonString: string): DatabaseMetadata => {
    try {
        const parsedData: DatabaseMetadata = JSON.parse(jsonString);
        return parsedData;
    } catch (parseError) {
        throw new Error(`Error parsing JSON data: ${parseError}`);
    }
};
