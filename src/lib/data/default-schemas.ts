import { DatabaseType } from '../domain/database-type';

export const defaultSchemas: { [key in DatabaseType]?: string } = {
    [DatabaseType.POSTGRESQL]: 'public',
    [DatabaseType.SQL_SERVER]: 'dbo',
    [DatabaseType.CLICKHOUSE]: 'default',
};
