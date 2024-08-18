import MysqlLogo from '@/assets/mysql_logo.png';
import PostgresqlLogo from '@/assets/postgresql_logo.png';
import MariaDBLogo from '@/assets/mariadb_logo.png';
import SqliteLogo from '@/assets/sqlite_logo.png';
import SqlServerLogo from '@/assets/sql_server_logo.png';
import { DatabaseType } from './domain/database-type';

export const getDatabaseLogo = (databaseType: DatabaseType) => {
    switch (databaseType) {
        case DatabaseType.MYSQL:
            return MysqlLogo;
        case DatabaseType.POSTGRESQL:
            return PostgresqlLogo;
        case DatabaseType.MARIADB:
            return MariaDBLogo;
        case DatabaseType.SQLITE:
            return SqliteLogo;
        case DatabaseType.SQL_SERVER:
            return SqlServerLogo;
        default:
            return PostgresqlLogo;
    }
};
