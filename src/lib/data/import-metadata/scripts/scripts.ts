import { DatabaseType } from '@/lib/domain/database-type';
import { getPostgresQuery } from './postgres-script';
import { mySQLQuery } from './mysql-script';
import { sqliteQuery } from './sqlite-script';
import { sqlServerQuery } from './sqlserver-script';
import { mariaDBQuery } from './maria-script';
import { DatabaseEdition } from '@/lib/domain/database-edition';

export const importMetadataScripts: Record<
    DatabaseType,
    (options?: { databaseEdition?: DatabaseEdition }) => string
> = {
    [DatabaseType.GENERIC]: () => '',
    [DatabaseType.POSTGRESQL]: getPostgresQuery,
    [DatabaseType.MYSQL]: () => mySQLQuery,
    [DatabaseType.SQLITE]: () => sqliteQuery,
    [DatabaseType.SQL_SERVER]: () => sqlServerQuery,
    [DatabaseType.MARIADB]: () => mariaDBQuery,
};
