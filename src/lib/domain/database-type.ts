export enum DatabaseType {
    GENERIC = 'generic',
    POSTGRESQL = 'postgresql',
    MYSQL = 'mysql',
    TIDB = 'tidb',
    SQL_SERVER = 'sql_server',
    MARIADB = 'mariadb',
    SQLITE = 'sqlite',
    CLICKHOUSE = 'clickhouse',
    COCKROACHDB = 'cockroachdb',
    ORACLE = 'oracle',
}

export const databaseTypesWithCommentSupport: DatabaseType[] = [
    DatabaseType.POSTGRESQL,
    DatabaseType.COCKROACHDB,
    DatabaseType.ORACLE,
];
