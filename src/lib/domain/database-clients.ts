import { DatabaseType } from './database-type';
import { DatabaseEdition } from './database-edition';

export enum DatabaseClient {
    // PostgreSQL
    POSTGRESQL_PSQL = 'psql',

    // SQLite
    SQLITE_WRANGLER = 'wrangler',
}

export const databaseClientToLabelMap: Record<DatabaseClient, string> = {
    // PostgreSQL
    [DatabaseClient.POSTGRESQL_PSQL]: 'PSQL',

    // SQLite
    [DatabaseClient.SQLITE_WRANGLER]: 'Wrangler',
};

export const databaseTypeToClientsMap: Record<DatabaseType, DatabaseClient[]> =
    {
        [DatabaseType.POSTGRESQL]: [DatabaseClient.POSTGRESQL_PSQL],
        [DatabaseType.MYSQL]: [],
        [DatabaseType.SQLITE]: [],
        [DatabaseType.GENERIC]: [],
        [DatabaseType.SQL_SERVER]: [],
        [DatabaseType.MARIADB]: [],
        [DatabaseType.CLICKHOUSE]: [],
        [DatabaseType.COCKROACHDB]: [],
        [DatabaseType.ORACLE]: [],
    };

export const databaseEditionToClientsMap: Record<
    DatabaseEdition,
    DatabaseClient[]
> = {
    // PostgreSQL
    [DatabaseEdition.POSTGRESQL_SUPABASE]: [],
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: [],

    // MySQL
    [DatabaseEdition.MYSQL_5_7]: [],

    // SQL Server
    [DatabaseEdition.SQL_SERVER_2016_AND_BELOW]: [],

    // SQLite
    [DatabaseEdition.SQLITE_CLOUDFLARE_D1]: [DatabaseClient.SQLITE_WRANGLER],
};
