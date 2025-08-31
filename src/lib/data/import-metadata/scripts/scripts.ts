import { DatabaseType } from '@/lib/domain/database-type';
import { getPostgresQuery } from './postgres-script';
import { getMySQLQuery } from './mysql-script';
import { getSQLiteQuery } from './sqlite-script';
import { getSqlServerQuery } from './sqlserver-script';
import { mariaDBQuery } from './maria-script';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DatabaseClient } from '@/lib/domain/database-clients';
import { clickhouseQuery } from './clickhouse-script';
import { cockroachdbQuery } from './cockroachdb-script';
import { oracleDBQuery } from './oracle-script';

export type ImportMetadataScripts = Record<
    DatabaseType,
    (options?: {
        databaseEdition?: DatabaseEdition;
        databaseClient?: DatabaseClient;
    }) => string
>;

export const importMetadataScripts: ImportMetadataScripts = {
    [DatabaseType.GENERIC]: () => '',
    [DatabaseType.POSTGRESQL]: getPostgresQuery,
    [DatabaseType.MYSQL]: getMySQLQuery,
    [DatabaseType.SQLITE]: getSQLiteQuery,
    [DatabaseType.SQL_SERVER]: getSqlServerQuery,
    [DatabaseType.MARIADB]: () => mariaDBQuery,
    [DatabaseType.CLICKHOUSE]: () => clickhouseQuery,
    [DatabaseType.COCKROACHDB]: () => cockroachdbQuery,
    [DatabaseType.ORACLE]: () => oracleDBQuery,
};
