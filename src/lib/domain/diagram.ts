import { DatabaseType } from './database-type';
import { DBRelationship } from './db-relationship';
import { DBTable } from './db-table';

export interface Diagram {
    id: string;
    name: string;
    databaseType: DatabaseType;
    tables: DBTable[];
    relationships: DBRelationship[];
}
