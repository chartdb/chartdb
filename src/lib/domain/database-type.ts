export enum DatabaseType {
    GENERIC = 'generic',
    POSTGRESQL = 'postgresql',
    MYSQL = 'mysql',
    SQL_SERVER = 'sql_server',
    MARIADB = 'mariadb',
    SQLITE = 'sqlite',
}

export const databaseTypeToLabel = (type: DatabaseType) => {
    switch (type) {
        case DatabaseType.GENERIC:
            return 'Generic';
        case DatabaseType.POSTGRESQL:
            return 'PostgreSQL';
        case DatabaseType.MYSQL:
            return 'MySQL';
        case DatabaseType.SQL_SERVER:
            return 'SQL Server';
        case DatabaseType.MARIADB:
            return 'MariaDB';
        case DatabaseType.SQLITE:
            return 'SQLite';
    }
};
