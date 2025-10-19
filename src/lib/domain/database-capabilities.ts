import { DatabaseType } from './database-type';

export interface DatabaseCapabilities {
    supportsArrays?: boolean;
    supportsCustomTypes?: boolean;
    supportsSchemas?: boolean;
    supportsComments?: boolean;
}

export const DATABASE_CAPABILITIES: Record<DatabaseType, DatabaseCapabilities> =
    {
        [DatabaseType.POSTGRESQL]: {
            supportsArrays: true,
            supportsCustomTypes: true,
            supportsSchemas: true,
            supportsComments: true,
        },
        [DatabaseType.COCKROACHDB]: {
            supportsArrays: true,
            supportsSchemas: true,
            supportsComments: true,
        },
        [DatabaseType.MYSQL]: {},
        [DatabaseType.MARIADB]: {},
        [DatabaseType.SQL_SERVER]: {
            supportsSchemas: true,
        },
        [DatabaseType.SQLITE]: {},
        [DatabaseType.CLICKHOUSE]: {
            supportsSchemas: true,
        },
        [DatabaseType.ORACLE]: {
            supportsSchemas: true,
            supportsComments: true,
        },
        [DatabaseType.GENERIC]: {},
    };

export const getDatabaseCapabilities = (
    databaseType: DatabaseType
): DatabaseCapabilities => {
    return DATABASE_CAPABILITIES[databaseType];
};

export const databaseSupportsArrays = (databaseType: DatabaseType): boolean => {
    return getDatabaseCapabilities(databaseType).supportsArrays ?? false;
};

export const databaseTypesWithCommentSupport: DatabaseType[] = Object.keys(
    DATABASE_CAPABILITIES
).filter(
    (dbType) => DATABASE_CAPABILITIES[dbType as DatabaseType].supportsComments
) as DatabaseType[];

export const supportsCustomTypes = (databaseType: DatabaseType): boolean => {
    return getDatabaseCapabilities(databaseType).supportsCustomTypes ?? false;
};
