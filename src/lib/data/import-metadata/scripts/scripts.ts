import { DatabaseType } from '@/lib/domain/database-type';
import { getPostgresQuery } from './postgres-script';
import { getMySQLQuery } from './mysql-script';
import { sqliteQuery } from './sqlite-script';
import { getSqlServerQuery } from './sqlserver-script';
import { mariaDBQuery } from './maria-script';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DatabaseClient } from '@/lib/domain/database-clients';
// import { clickhouseQuery } from './clickhouse-script';

export const importMetadataScripts: Record<
    DatabaseType,
    (options?: {
        databaseEdition?: DatabaseEdition;
        databaseClient?: DatabaseClient;
    }) => string
> = {
    [DatabaseType.GENERIC]: () => '',
    [DatabaseType.POSTGRESQL]: getPostgresQuery,
    [DatabaseType.MYSQL]: getMySQLQuery,
    [DatabaseType.SQLITE]: () => sqliteQuery,
    [DatabaseType.SQL_SERVER]: getSqlServerQuery,
    [DatabaseType.MARIADB]: () => mariaDBQuery,
    // [DatabaseType.CLICKHOUSE]: () => clickhouseQuery,
};
