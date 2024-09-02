import { DatabaseType } from './database-type';

export enum DatabaseClient {
    // PostgreSQL
    POSTGRESQL_PSQL = 'psql',
}

export const databaseClientToLabelMap: Record<DatabaseClient, string> = {
    // PostgreSQL
    [DatabaseClient.POSTGRESQL_PSQL]: 'PSQL',
};

export const databaseTypeToClientsMap: Record<DatabaseType, DatabaseClient[]> =
    {
        [DatabaseType.POSTGRESQL]: [DatabaseClient.POSTGRESQL_PSQL],
        [DatabaseType.MYSQL]: [],
        [DatabaseType.SQLITE]: [],
        [DatabaseType.GENERIC]: [],
        [DatabaseType.SQL_SERVER]: [],
        [DatabaseType.MARIADB]: [],
    };
