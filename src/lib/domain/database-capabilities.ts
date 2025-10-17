import { DatabaseType } from './database-type';

export interface DatabaseCapabilities {
    supportsArrays: boolean;
}

const DATABASE_CAPABILITIES: Record<DatabaseType, DatabaseCapabilities> = {
    [DatabaseType.POSTGRESQL]: {
        supportsArrays: true,
    },
    [DatabaseType.COCKROACHDB]: {
        supportsArrays: true,
    },
    [DatabaseType.MYSQL]: {
        supportsArrays: false,
    },
    [DatabaseType.MARIADB]: {
        supportsArrays: false,
    },
    [DatabaseType.SQL_SERVER]: {
        supportsArrays: false,
    },
    [DatabaseType.SQLITE]: {
        supportsArrays: false,
    },
    [DatabaseType.CLICKHOUSE]: {
        supportsArrays: false,
    },
    [DatabaseType.ORACLE]: {
        supportsArrays: false,
    },
    [DatabaseType.GENERIC]: {
        supportsArrays: false,
    },
};

export const getDatabaseCapabilities = (
    databaseType: DatabaseType
): DatabaseCapabilities => {
    return DATABASE_CAPABILITIES[databaseType];
};

export const databaseSupportsArrays = (databaseType: DatabaseType): boolean => {
    return getDatabaseCapabilities(databaseType).supportsArrays;
};
