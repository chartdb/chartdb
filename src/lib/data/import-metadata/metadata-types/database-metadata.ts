import type { ForeignKeyInfo } from './foreign-key-info';
import type { PrimaryKeyInfo } from './primary-key-info';
import type { ColumnInfo } from './column-info';
import type { IndexInfo } from './index-info';
import type { TableInfo } from './table-info';
import type { ViewInfo } from './view-info';
export interface DatabaseMetadata {
    fk_info: ForeignKeyInfo[];
    pk_info: PrimaryKeyInfo[];
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    tables: TableInfo[];
    views: ViewInfo[];
    database_name: string;
    version: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDatabaseMetadata = (obj: any): boolean => {
    return (
        Array.isArray(obj.fk_info) &&
        Array.isArray(obj.pk_info) &&
        Array.isArray(obj.columns) &&
        Array.isArray(obj.indexes) &&
        Array.isArray(obj.tables) &&
        Array.isArray(obj.views)
    );
};

export function loadDatabaseMetadata(jsonString: string): DatabaseMetadata {
    try {
        const parsedData: DatabaseMetadata = JSON.parse(jsonString);
        return parsedData;
    } catch (parseError) {
        throw new Error(`Error parsing JSON data: ${parseError}`);
    }
}
