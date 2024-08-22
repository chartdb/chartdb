import { DatabaseType } from '@/lib/domain/database-type';
import { postgresQuery } from './postgres-script';
import { mySQLQuery } from './mysql-script';
import { sqliteQuery } from './sqlite-script';
import { sqlServerQuery } from './sqlserver-script';
import { mariaDBQuery } from './maria-script';

export const importMetadataScripts: Record<DatabaseType, string> = {
    [DatabaseType.GENERIC]: '',
    [DatabaseType.POSTGRESQL]: postgresQuery,
    [DatabaseType.MYSQL]: mySQLQuery,
    [DatabaseType.SQLITE]: sqliteQuery,
    [DatabaseType.SQL_SERVER]: sqlServerQuery,
    [DatabaseType.MARIADB]: mariaDBQuery,
};
