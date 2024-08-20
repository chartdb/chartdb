import { ForeignKeyInfo } from './foreign-key-info';
import { PrimaryKeyInfo } from './primary-key-info';
import { ColumnInfo } from './column-info';
import { IndexInfo } from './index-info';
import { TableInfo } from './table-info';
import { ViewInfo } from './view-info';
export interface DatabaseMetadata {
    fk_info: ForeignKeyInfo[];
    pk_info: PrimaryKeyInfo[];
    columns: ColumnInfo[];
    indexes: IndexInfo[];
    tables: TableInfo[];
    views: ViewInfo[];
    server_name: string;
    version: string;
}

export function loadDatabaseMetadata(jsonString: string): DatabaseMetadata {
    try {
        const parsedData: DatabaseMetadata = JSON.parse(jsonString);
        return parsedData;
    } catch (parseError) {
        throw new Error(`Error parsing JSON data: ${parseError}`);
    }
}
